/**
 * Serialization of the patient's markers for the pre-visit intake, and a plain descriptive line
 * per marker for the doctor-facing summary.
 *
 * The description only restates what the patient picked: layer, region, number, words, note.
 * It never adds meaning (no causes, conditions, likelihoods or urgency).
 */
import { BODY_VIEWBOX } from './regions';
import { sanitizeDescriptors } from './markersReducer';
import type { BodyLayer, BodyPainMapPayload, BodyPainMarker, BodyPainMarkerPayload, PainFeel, PainOnset } from './types';

type T = (key: string, opts?: Record<string, unknown>) => string;

const round3 = (v: number) => Math.round(v * 1000) / 1000;

export const regionLabelKey = (regionId: string) => `bodyMap.regions.${regionId}`;
export const layerLabelKey = (layer: BodyLayer) => `bodyMap.layers.${layer}`;
export const layerPhraseKey = (layer: BodyLayer) => `bodyMap.layerPhrase.${layer}`;
export const feelLabelKey = (feel: PainFeel) => `bodyMap.feels.${feel}`;
export const onsetLabelKey = (onset: PainOnset) => `bodyMap.onsets.${onset}`;

/** Markers → wire payload. Empty list → null (nothing to send; the server field stays null). */
export function toBodyPainMapPayload(
  markers: BodyPainMarker[],
  opts: { locale: 'en' | 'es'; t: T; now?: () => Date }
): BodyPainMapPayload | null {
  if (!markers.length) return null;
  const now = opts.now ?? (() => new Date());
  return {
    version: 1,
    locale: opts.locale,
    reportedAt: now().toISOString(),
    markers: markers
      .slice()
      .sort((a, b) => a.seq - b.seq)
      .map((m): BodyPainMarkerPayload => {
        const d = sanitizeDescriptors(m, m);
        return {
          layer: m.layer,
          view: m.view,
          regionId: m.regionId,
          regionLabel: opts.t(regionLabelKey(m.regionId)),
          layerLabel: opts.t(layerLabelKey(m.layer)),
          position: { x: round3(m.x / BODY_VIEWBOX.width), y: round3(m.y / BODY_VIEWBOX.height) },
          intensity: d.intensity,
          feels: d.feels,
          onset: d.onset,
          note: d.note,
        };
      }),
  };
}

/** Lenient parse of a payload coming back from a server/mock; unknown or broken → null. */
export function parseBodyPainMapPayload(raw: unknown): BodyPainMapPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BodyPainMapPayload>;
  if (r.version !== 1 || !Array.isArray(r.markers) || !r.markers.length) return null;
  return {
    version: 1,
    locale: r.locale === 'en' ? 'en' : 'es',
    reportedAt: String(r.reportedAt ?? ''),
    markers: r.markers.filter((m) => m && typeof m.regionId === 'string' && typeof m.layer === 'string') as BodyPainMarkerPayload[],
  };
}

/** Parts of a marker description, without the "Patient marked:" prefix. */
export function describeMarkerParts(m: Pick<BodyPainMarkerPayload, 'layer' | 'regionId' | 'regionLabel' | 'intensity' | 'feels' | 'onset' | 'note'>, t: T): string[] {
  const parts = [t(layerPhraseKey(m.layer)), t(regionLabelKey(m.regionId), { defaultValue: m.regionLabel })];
  if (m.intensity !== null && m.intensity !== undefined) parts.push(t('bodyMap.summary.intensity', { value: m.intensity }));
  if (m.feels?.length) parts.push(m.feels.map((f) => `“${t(feelLabelKey(f)).toLowerCase()}”`).join(', '));
  if (m.onset) parts.push(t('bodyMap.summary.started', { when: t(onsetLabelKey(m.onset)).toLowerCase() }));
  if (m.note) parts.push(t('bodyMap.summary.note', { note: m.note }));
  return parts;
}

/** e.g. "Patient marked: Muscles layer, lower back, left side, intensity 6/10, “aching”". */
export function describeBodyPainMarker(m: BodyPainMarkerPayload, t: T): string {
  return `${t('bodyMap.summary.patientMarked')} ${describeMarkerParts(m, t).join(', ')}`;
}

export function describeBodyPainMap(payload: BodyPainMapPayload | null | undefined, t: T): string[] {
  return payload?.markers?.length ? payload.markers.map((m) => describeBodyPainMarker(m, t)) : [];
}
