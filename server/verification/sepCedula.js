const { compareNames, joinNameParts } = require('./nameMatch');
const { isMedicalGeneralTitle, isMedicalSpecialtyTitle } = require('./medicalTitles');

const SEP_CEDULA_JSON_URL =
  'https://www.cedulaprofesional.sep.gob.mx/cedula/buscaCedulaJson.action';

function parseSepItems(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.docs)) return payload.docs;
  if (Array.isArray(payload)) return payload;
  return [];
}

function toRecord(item) {
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

async function fetchByCedula(cedulaNumber, fetchImpl, timeoutMs) {
  const json = {
    maxResult: '50',
    nombre: '',
    paterno: '',
    materno: '',
    idCedula: String(cedulaNumber || '').trim(),
  };
  const url = `${SEP_CEDULA_JSON_URL}?json=${encodeURIComponent(JSON.stringify(json))}&wt=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'User-Agent': 'AuricRX-Medicos-Verification/1.0',
      },
      signal: controller.signal,
    });
    const contentType = res.headers?.get?.('content-type') || '';
    const text = await res.text();
    if (!res.ok) {
      return { unavailable: true, items: [], message: `SEP HTTP ${res.status}`, raw: text.slice(0, 2000) };
    }
    if (/captcha|cloudflare|cf-challenge|<html/i.test(text) || /text\/html/i.test(contentType)) {
      return {
        unavailable: true,
        items: [],
        message: 'SEP response looks like HTML/CAPTCHA — lookup unavailable',
        raw: text.slice(0, 2000),
      };
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        unavailable: true,
        items: [],
        message: 'SEP response was not JSON',
        raw: text.slice(0, 2000),
      };
    }
    return { items: parseSepItems(parsed), raw: parsed };
  } catch (err) {
    return {
      unavailable: true,
      items: [],
      message: err?.name === 'AbortError' ? 'SEP lookup timed out' : err?.message || 'SEP lookup failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function lookupSepCedula(request, opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const timeoutMs = opts.timeoutMs || 12_000;
  const checkedAt = new Date().toISOString();
  const cedula = String(request.cedulaNumber || '').trim();
  const referenceId = `sep_${Date.now()}_${cedula.slice(0, 12) || 'x'}`;

  if (!cedula) {
    return {
      provider: 'sep-cedula',
      country: 'MX',
      outcome: 'not_found',
      checkedAt,
      referenceId,
      message: 'Missing cédula number',
      records: [],
    };
  }

  const primary = await fetchByCedula(cedula, fetchImpl, timeoutMs);
  if (primary.unavailable) {
    return {
      provider: 'sep-cedula',
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
      provider: 'sep-cedula',
      country: 'MX',
      outcome: 'not_found',
      checkedAt,
      referenceId,
      message: 'No SEP record for this cédula',
      records: [],
      raw: primary.raw,
    };
  }

  const matchedRecord = records.find((r) => String(r.registryId) === cedula) || records[0];
  const nameMatch = compareNames(request.legalFullName, matchedRecord.fullName || '');
  const medicalTitleOk = isMedicalGeneralTitle(matchedRecord.title || '');

  let specialtyTitleOk = null;
  let specialtyRaw;
  if (request.specialtyCedulaNumber) {
    const specialtyLookup = await fetchByCedula(request.specialtyCedulaNumber, fetchImpl, timeoutMs);
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

  let outcome = 'match';
  if (!medicalTitleOk) outcome = 'non_medical';
  else if (!nameMatch.matched) outcome = 'mismatch';
  else if (request.specialtyCedulaNumber && specialtyTitleOk === false) outcome = 'mismatch';

  return {
    provider: 'sep-cedula',
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

module.exports = { lookupSepCedula, SEP_CEDULA_JSON_URL, toRecord, parseSepItems };
