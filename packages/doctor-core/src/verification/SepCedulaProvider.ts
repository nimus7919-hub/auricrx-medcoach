/**
 * Mexico SEP Registro Nacional de Profesionistas lookup.
 *
 * Public endpoint (unofficial JSON action used by the SEP web UI):
 *   GET https://www.cedulaprofesional.sep.gob.mx/cedula/buscaCedulaJson.action
 *   ?json={"maxResult":"50","nombre":"","paterno":"","materno":"","idCedula":"<n>"}&wt=json
 *
 * Constraints observed / documented by the community:
 * - No official public API key; this is a UI-backed JSON action that may time out,
 *   return HTML, or require CAPTCHA / bot protection from some networks.
 * - Rate limits / blocking are opaque; treat failures as lookup_unavailable.
 * - Response shape varies; commonly `items` array with nombre, paterno, materno,
 *   titulo, institucion, idCedula / cedula.
 * - NEVER auto-approves — caller always queues for human review.
 */

import { compareNames, joinNameParts } from './nameMatch';
import { isMedicalGeneralTitle, isMedicalSpecialtyTitle } from './medicalTitles';
import type {
  RegistryLookupProvider,
  RegistryLookupRequest,
  RegistryLookupResult,
  RegistryRecord,
} from './RegistryLookup';

export const SEP_CEDULA_JSON_URL =
  'https://www.cedulaprofesional.sep.gob.mx/cedula/buscaCedulaJson.action';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function refId(cedula: string): string {
  return `sep_${Date.now()}_${String(cedula || 'x').slice(0, 12)}`;
}

function parseSepItems(payload: unknown): any[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.results)) return obj.results;
  if (Array.isArray(obj.docs)) return obj.docs;
  if (Array.isArray(payload)) return payload as any[];
  return [];
}

function toRecord(item: any): RegistryRecord {
  const nombre = item?.nombre || item?.name || '';
  const paterno = item?.paterno || item?.apellidoPaterno || item?.apellido_paterno || '';
  const materno = item?.materno || item?.apellidoMaterno || item?.apellido_materno || '';
  const fullName = joinNameParts(nombre, paterno, materno) || String(item?.nombreCompleto || '');
  return {
    registryId: String(item?.idCedula || item?.cedula || item?.numCedula || item?.id || ''),
    fullName,
    givenName: String(nombre || ''),
    familyName: joinNameParts(paterno, materno),
    title: String(item?.titulo || item?.carrera || item?.title || ''),
    institution: String(item?.institucion || item?.universidad || ''),
    year: item?.anioRegistro || item?.anno || item?.anio || undefined,
    raw: item,
  };
}

async function fetchByCedula(
  cedulaNumber: string,
  fetchImpl: FetchLike,
  timeoutMs: number
): Promise<{ ok: boolean; unavailable?: boolean; items: any[]; raw?: unknown; message?: string }> {
  const json = {
    maxResult: '50',
    nombre: '',
    paterno: '',
    materno: '',
    idCedula: String(cedulaNumber || '').trim(),
  };
  const url = `${SEP_CEDULA_JSON_URL}?json=${encodeURIComponent(JSON.stringify(json))}&wt=json`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent': 'AuricRX-Medicos-Verification/1.0',
      },
      signal: controller?.signal,
    });
    const contentType = res.headers?.get?.('content-type') || '';
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        unavailable: true,
        items: [],
        message: `SEP HTTP ${res.status}`,
        raw: text.slice(0, 2000),
      };
    }
    // CAPTCHA / HTML interstitial
    if (/captcha|cloudflare|cf-challenge|<html/i.test(text) || /text\/html/i.test(contentType)) {
      return {
        ok: false,
        unavailable: true,
        items: [],
        message: 'SEP response looks like HTML/CAPTCHA — lookup unavailable',
        raw: text.slice(0, 2000),
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ok: false,
        unavailable: true,
        items: [],
        message: 'SEP response was not JSON',
        raw: text.slice(0, 2000),
      };
    }
    return { ok: true, items: parseSepItems(parsed), raw: parsed };
  } catch (err: any) {
    return {
      ok: false,
      unavailable: true,
      items: [],
      message: err?.name === 'AbortError' ? 'SEP lookup timed out' : err?.message || 'SEP lookup failed',
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class SepCedulaProvider implements RegistryLookupProvider {
  readonly name = 'sep-cedula';
  readonly country = 'MX' as const;

  constructor(
    private readonly fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
    private readonly timeoutMs = 12_000
  ) {}

  async lookup(request: RegistryLookupRequest): Promise<RegistryLookupResult> {
    const checkedAt = new Date().toISOString();
    const cedula = String(request.cedulaNumber || '').trim();
    const referenceId = refId(cedula);
    if (!cedula) {
      return {
        provider: this.name,
        country: 'MX',
        outcome: 'not_found',
        checkedAt,
        referenceId,
        message: 'Missing cédula number',
        records: [],
      };
    }

    const primary = await fetchByCedula(cedula, this.fetchImpl, this.timeoutMs);
    if (primary.unavailable) {
      return {
        provider: this.name,
        country: 'MX',
        outcome: 'lookup_unavailable',
        checkedAt,
        referenceId,
        message: primary.message || 'SEP lookup unavailable',
        records: [],
        raw: primary.raw,
      };
    }

    const records = primary.items.map(toRecord);
    if (!records.length) {
      return {
        provider: this.name,
        country: 'MX',
        outcome: 'not_found',
        checkedAt,
        referenceId,
        message: 'No SEP record for this cédula',
        records: [],
        raw: primary.raw,
      };
    }

    // Prefer exact cédula id match when present
    const matchedRecord =
      records.find((r) => String(r.registryId) === cedula) || records[0];
    const nameMatch = compareNames(request.legalFullName, matchedRecord.fullName || '');
    const medicalTitleOk = isMedicalGeneralTitle(matchedRecord.title || '');

    let specialtyTitleOk: boolean | null = null;
    let specialtyRaw: unknown;
    if (request.specialtyCedulaNumber) {
      const specialtyLookup = await fetchByCedula(
        request.specialtyCedulaNumber,
        this.fetchImpl,
        this.timeoutMs
      );
      specialtyRaw = specialtyLookup.raw;
      if (specialtyLookup.unavailable) {
        specialtyTitleOk = null;
      } else if (!specialtyLookup.items.length) {
        specialtyTitleOk = false;
      } else {
        const specRec = toRecord(specialtyLookup.items[0]);
        const specName = compareNames(request.legalFullName, specRec.fullName || '');
        specialtyTitleOk =
          specName.matched &&
          (isMedicalSpecialtyTitle(specRec.title || '') || isMedicalGeneralTitle(specRec.title || ''));
        records.push(specRec);
      }
    }

    let outcome: RegistryLookupResult['outcome'] = 'match';
    if (!medicalTitleOk) outcome = 'non_medical';
    else if (!nameMatch.matched) outcome = 'mismatch';
    else if (request.specialtyCedulaNumber && specialtyTitleOk === false) outcome = 'mismatch';

    return {
      provider: this.name,
      country: 'MX',
      outcome,
      checkedAt,
      referenceId,
      message:
        outcome === 'match'
          ? 'SEP record found; queued for human review'
          : `SEP outcome=${outcome}; queued for human review`,
      nameMatch,
      medicalTitleOk,
      specialtyTitleOk,
      records,
      raw: { primary: primary.raw, specialty: specialtyRaw },
    };
  }
}
