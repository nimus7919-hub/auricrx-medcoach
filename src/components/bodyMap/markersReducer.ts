/**
 * Pure state for the body pain map: current layer/view/zoom and the patient's markers.
 * Unit tested in src/components/__tests__/bodyMapReducer.test.ts.
 */
import { BODY_ZOOMS, type BodyZoom } from './regions';
import {
  BODY_LAYERS,
  BODY_VIEWS,
  MAX_BODY_MARKERS,
  MAX_MARKER_NOTE_LENGTH,
  PAIN_FEELS,
  PAIN_INTENSITY_MAX,
  PAIN_INTENSITY_MIN,
  PAIN_ONSETS,
  type BodyLayer,
  type BodyPainMarker,
  type BodyView,
  type PainDescriptors,
  type PainFeel,
  type PainOnset,
} from './types';

export interface BodyMapState {
  layer: BodyLayer;
  view: BodyView;
  zoom: BodyZoom;
  markers: BodyPainMarker[];
  selectedId: string | null;
  /** Monotonic counter for marker ids / pin numbers. */
  nextSeq: number;
}

export type BodyMapAction =
  | { type: 'SET_LAYER'; layer: BodyLayer }
  | { type: 'SET_VIEW'; view: BodyView }
  | { type: 'SET_ZOOM'; zoom: BodyZoom }
  | { type: 'PLACE'; regionId: string; x: number; y: number }
  | { type: 'UPDATE'; id: string; patch: Partial<PainDescriptors> }
  | { type: 'REMOVE'; id: string }
  | { type: 'SELECT'; id: string | null }
  | { type: 'CLEAR' };

export const EMPTY_DESCRIPTORS: PainDescriptors = { intensity: null, feels: [], onset: null, note: null };

export function initialBodyMapState(partial: Partial<BodyMapState> = {}): BodyMapState {
  const markers = partial.markers ?? [];
  return {
    layer: partial.layer ?? 'skin',
    view: partial.view ?? 'front',
    zoom: partial.zoom ?? 'full',
    markers,
    selectedId: partial.selectedId ?? null,
    nextSeq: partial.nextSeq ?? markers.reduce((m, k) => Math.max(m, k.seq), 0) + 1,
  };
}

export function sanitizeIntensity(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.min(PAIN_INTENSITY_MAX, Math.max(PAIN_INTENSITY_MIN, n));
}

export function sanitizeFeels(v: unknown): PainFeel[] {
  if (!Array.isArray(v)) return [];
  const set = new Set(v.filter((f): f is PainFeel => (PAIN_FEELS as readonly string[]).includes(f)));
  // Stable order (the order the chips are shown in).
  return PAIN_FEELS.filter((f) => set.has(f));
}

export function sanitizeOnset(v: unknown): PainOnset | null {
  return (PAIN_ONSETS as readonly string[]).includes(v as string) ? (v as PainOnset) : null;
}

export function sanitizeNote(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, MAX_MARKER_NOTE_LENGTH);
  return t ? t : null;
}

export function sanitizeDescriptors(patch: Partial<PainDescriptors>, base: PainDescriptors = EMPTY_DESCRIPTORS): PainDescriptors {
  return {
    intensity: 'intensity' in patch ? sanitizeIntensity(patch.intensity) : base.intensity,
    feels: 'feels' in patch ? sanitizeFeels(patch.feels) : base.feels,
    onset: 'onset' in patch ? sanitizeOnset(patch.onset) : base.onset,
    note: 'note' in patch ? sanitizeNote(patch.note) : base.note,
  };
}

const clampCoord = (v: number, max: number) => Math.min(max, Math.max(0, Math.round(v * 10) / 10));

export function bodyMapReducer(state: BodyMapState, action: BodyMapAction): BodyMapState {
  switch (action.type) {
    case 'SET_LAYER':
      if (!BODY_LAYERS.includes(action.layer) || action.layer === state.layer) return state;
      return { ...state, layer: action.layer, selectedId: null };
    case 'SET_VIEW':
      if (!BODY_VIEWS.includes(action.view) || action.view === state.view) return state;
      return { ...state, view: action.view, selectedId: null };
    case 'SET_ZOOM':
      if (!(action.zoom in BODY_ZOOMS) || action.zoom === state.zoom) return state;
      return { ...state, zoom: action.zoom };
    case 'PLACE': {
      if (!action.regionId || state.markers.length >= MAX_BODY_MARKERS) return state;
      if (!Number.isFinite(action.x) || !Number.isFinite(action.y)) return state;
      const seq = state.nextSeq;
      const marker: BodyPainMarker = {
        id: `m${seq}`,
        seq,
        layer: state.layer,
        view: state.view,
        regionId: action.regionId,
        x: clampCoord(action.x, BODY_ZOOMS.full.width),
        y: clampCoord(action.y, BODY_ZOOMS.full.height),
        ...EMPTY_DESCRIPTORS,
      };
      return { ...state, markers: [...state.markers, marker], selectedId: marker.id, nextSeq: seq + 1 };
    }
    case 'UPDATE': {
      const idx = state.markers.findIndex((m) => m.id === action.id);
      if (idx < 0) return state;
      const prev = state.markers[idx];
      const next: BodyPainMarker = { ...prev, ...sanitizeDescriptors(action.patch, prev) };
      const markers = state.markers.slice();
      markers[idx] = next;
      return { ...state, markers };
    }
    case 'REMOVE': {
      if (!state.markers.some((m) => m.id === action.id)) return state;
      return {
        ...state,
        markers: state.markers.filter((m) => m.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    }
    case 'SELECT': {
      if (action.id !== null && !state.markers.some((m) => m.id === action.id)) return state;
      const target = state.markers.find((m) => m.id === action.id);
      // Selecting a marker brings its layer + view into focus so the pin is visible.
      return target ? { ...state, selectedId: target.id, layer: target.layer, view: target.view } : { ...state, selectedId: null };
    }
    case 'CLEAR':
      return { ...state, markers: [], selectedId: null };
    default:
      return state;
  }
}

export const canPlaceMore = (state: BodyMapState) => state.markers.length < MAX_BODY_MARKERS;
