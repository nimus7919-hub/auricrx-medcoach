/**
 * Layered body pain map — shared types.
 *
 * COMPLIANCE (COFEPRIS / FDA): everything here is PATIENT-REPORTED. A marker records only where the
 * patient tapped (layer + region + position) and the words/numbers they chose. There are no fields
 * for causes, conditions, likelihoods or urgency, on purpose. Do not add any.
 */

export const BODY_LAYERS = ['skin', 'muscles', 'vessels', 'bones', 'organs'] as const;
export type BodyLayer = (typeof BODY_LAYERS)[number];

export const BODY_VIEWS = ['front', 'back'] as const;
export type BodyView = (typeof BODY_VIEWS)[number];

/** Plain feel words the patient can pick (multi-select). */
export const PAIN_FEELS = ['sharp', 'dull', 'burning', 'throbbing', 'tingling', 'aching'] as const;
export type PainFeel = (typeof PAIN_FEELS)[number];

/** When it started — coarse buckets the patient picks (single-select). */
export const PAIN_ONSETS = ['today', 'days', 'weeks', 'months', 'unsure'] as const;
export type PainOnset = (typeof PAIN_ONSETS)[number];

export const PAIN_INTENSITY_MIN = 0;
export const PAIN_INTENSITY_MAX = 10;
export const MAX_BODY_MARKERS = 10;
export const MAX_MARKER_NOTE_LENGTH = 300;

/** Optional, patient-reported descriptors for one marker. */
export interface PainDescriptors {
  /** 0–10 as the patient reports it. Never a score computed by the app. */
  intensity: number | null;
  feels: PainFeel[];
  onset: PainOnset | null;
  note: string | null;
}

export interface BodyPainMarker extends PainDescriptors {
  id: string;
  /** 1-based number shown on the pin. */
  seq: number;
  layer: BodyLayer;
  view: BodyView;
  regionId: string;
  /** Position inside the figure's viewBox (BODY_VIEWBOX units). */
  x: number;
  y: number;
}

/** Wire format for one marker (pre-visit intake payload). Labels are captured in the patient's locale. */
export interface BodyPainMarkerPayload {
  layer: BodyLayer;
  view: BodyView;
  regionId: string;
  /** Plain-language region label in the patient's locale at the time of reporting. */
  regionLabel: string;
  /** Plain-language layer label in the patient's locale at the time of reporting. */
  layerLabel: string;
  /** Normalized 0–1 position in the figure (x from the viewer's left, y from the top). */
  position: { x: number; y: number };
  intensity: number | null;
  feels: PainFeel[];
  onset: PainOnset | null;
  note: string | null;
}

/**
 * Patient-reported body map attached to a pre-visit intake. Optional and nullable everywhere,
 * so a server that does not know about it can ignore it.
 */
export interface BodyPainMapPayload {
  version: 1;
  locale: 'en' | 'es';
  reportedAt: string;
  markers: BodyPainMarkerPayload[];
}
