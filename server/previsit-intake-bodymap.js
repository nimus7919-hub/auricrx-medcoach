/**
 * Validation for the patient-reported body pain map (PR #39 / #40).
 *
 * Onset values follow Nova's payload: today | days | weeks | months | unsure
 * (not the earlier design tokens few_days / 1_4_weeks / over_month / not_sure).
 *
 * Notes are patient-authored. Descriptive-only guardrails still apply: a note
 * that names a condition, screens for red flags, triages, or gives treatment
 * is stripped (the rest of the marker is kept).
 */

const { filterModelText } = require('./previsit-intake-lib');
const { normalizeIntakeLocale } = require('./language-utils');

const BODY_LAYERS = ['skin', 'muscles', 'vessels', 'bones', 'organs'];
const BODY_VIEWS = ['front', 'back'];
const PAIN_FEELS = ['sharp', 'dull', 'burning', 'throbbing', 'tingling', 'aching'];
const PAIN_ONSETS = ['today', 'days', 'weeks', 'months', 'unsure'];
const MAX_BODY_MARKERS = 10;
const MAX_MARKER_NOTE_LENGTH = 300;
const MAX_REGION_LABEL_LENGTH = 80;
const MAX_LAYER_LABEL_LENGTH = 40;
const SURFACE_LAYERS = new Set(['skin', 'muscles', 'vessels', 'bones']);

function expand(templates, view) {
  const viewerRight = view === 'front' ? 'left' : 'right';
  const viewerLeft = view === 'front' ? 'right' : 'left';
  const out = [];
  for (const t of templates) {
    if (!t.sided) out.push(t.base);
    else {
      out.push(`${t.base}_${viewerRight}`);
      out.push(`${t.base}_${viewerLeft}`);
    }
  }
  return out;
}

const C = (base) => ({ base, sided: false });
const S = (base) => ({ base, sided: true });

const SURFACE_FRONT = [
  C('head'), C('neck'), S('hand'), S('forearm'), S('upper_arm'), S('shoulder'),
  S('chest'), C('abdomen_upper'), C('abdomen_lower'), S('hip'), S('thigh'),
  S('knee'), S('lower_leg'), S('foot'),
];
const SURFACE_BACK = [
  C('head_back'), C('neck_back'), S('hand_back'), S('forearm_back'),
  S('upper_arm_back'), S('shoulder_back'), S('upper_back'), C('mid_back'),
  S('lower_back'), S('buttock'), S('thigh_back'), S('knee_back'), S('calf'), S('heel'),
];
const ORGANS_FRONT = [
  C('head'), C('throat'), C('chest_center'), S('chest'), C('abdomen_upper_middle'),
  S('upper_abdomen'), C('navel'), S('mid_abdomen'), C('abdomen_lower_middle'),
  S('lower_abdomen'), C('pelvic'),
];
const ORGANS_BACK = [
  C('head_back'), C('neck_back'), C('spine'), S('back_ribs'), S('flank'),
  S('lower_back'), C('pelvic_back'),
];

const REGION_IDS_BY_LAYER_VIEW = {
  'surface:front': expand(SURFACE_FRONT, 'front'),
  'surface:back': expand(SURFACE_BACK, 'back'),
  'organs:front': expand(ORGANS_FRONT, 'front'),
  'organs:back': expand(ORGANS_BACK, 'back'),
};

const ALL_REGION_IDS = new Set(
  Object.values(REGION_IDS_BY_LAYER_VIEW).flat()
);

function regionIdsFor(layer, view) {
  const group = SURFACE_LAYERS.has(layer) ? 'surface' : 'organs';
  return REGION_IDS_BY_LAYER_VIEW[`${group}:${view}`] || [];
}

function isFinite01(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
}

function uniqueFeels(feels) {
  const out = [];
  const seen = new Set();
  for (const f of feels) {
    if (!PAIN_FEELS.includes(f) || seen.has(f)) return { ok: false };
    seen.add(f);
    out.push(f);
  }
  return { ok: true, feels: out };
}

function sideFromRegionId(regionId) {
  if (String(regionId).endsWith('_left')) return 'left';
  if (String(regionId).endsWith('_right')) return 'right';
  return null;
}

function capLabel(value, max) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * @returns {{ ok: true, payload: object|null, notesStripped: number } | { ok: false, error: string }}
 */
function validateBodyPainMapPayload(raw) {
  if (raw == null) return { ok: true, payload: null, notesStripped: 0 };
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'invalid_body_pain_map' };
  }
  if (raw.version !== 1) return { ok: false, error: 'invalid_body_pain_map_version' };
  if (raw.locale != null && raw.locale !== 'en' && raw.locale !== 'es') {
    return { ok: false, error: 'invalid_body_pain_map_locale' };
  }
  if (!Array.isArray(raw.markers)) return { ok: false, error: 'invalid_body_pain_map' };
  if (raw.markers.length > MAX_BODY_MARKERS) return { ok: false, error: 'too_many_body_markers' };
  if (raw.markers.length === 0) return { ok: true, payload: null, notesStripped: 0 };

  const markers = [];
  let notesStripped = 0;
  for (const m of raw.markers) {
    if (!m || typeof m !== 'object') return { ok: false, error: 'invalid_body_marker' };
    if (!BODY_LAYERS.includes(m.layer)) return { ok: false, error: 'invalid_body_layer' };
    if (!BODY_VIEWS.includes(m.view)) return { ok: false, error: 'invalid_body_view' };
    if (typeof m.regionId !== 'string' || !ALL_REGION_IDS.has(m.regionId)) {
      return { ok: false, error: 'invalid_body_region' };
    }
    if (!regionIdsFor(m.layer, m.view).includes(m.regionId)) {
      return { ok: false, error: 'invalid_body_region_for_layer' };
    }
    const pos = m.position;
    if (!pos || !isFinite01(pos.x) || !isFinite01(pos.y)) {
      return { ok: false, error: 'invalid_body_position' };
    }
    let intensity = m.intensity;
    if (intensity === undefined) intensity = null;
    if (intensity !== null) {
      if (typeof intensity !== 'number' || !Number.isInteger(intensity) || intensity < 0 || intensity > 10) {
        return { ok: false, error: 'invalid_body_intensity' };
      }
    }
    if (!Array.isArray(m.feels)) return { ok: false, error: 'invalid_body_feels' };
    const felt = uniqueFeels(m.feels);
    if (!felt.ok) return { ok: false, error: 'invalid_body_feels' };
    let onset = m.onset === undefined ? null : m.onset;
    if (onset !== null && !PAIN_ONSETS.includes(onset)) {
      return { ok: false, error: 'invalid_body_onset' };
    }
    let note = m.note == null ? null : String(m.note).trim();
    if (note === '') note = null;
    if (note && note.length > MAX_MARKER_NOTE_LENGTH) {
      return { ok: false, error: 'body_note_too_long' };
    }
    if (note) {
      const filtered = filterModelText(note);
      if (!filtered.ok) {
        note = null;
        notesStripped += 1;
      }
    }
    const regionLabel = capLabel(m.regionLabel, MAX_REGION_LABEL_LENGTH);
    const layerLabel = capLabel(m.layerLabel, MAX_LAYER_LABEL_LENGTH);
    if (!regionLabel || !layerLabel) return { ok: false, error: 'invalid_body_labels' };
    const labelFilter = filterModelText(`${regionLabel} ${layerLabel}`);
    if (!labelFilter.ok) return { ok: false, error: 'invalid_body_labels' };

    markers.push({
      layer: m.layer,
      view: m.view,
      regionId: m.regionId,
      regionLabel,
      layerLabel,
      position: { x: m.position.x, y: m.position.y },
      intensity,
      feels: felt.feels,
      onset,
      note,
    });
  }

  const reportedAt = typeof raw.reportedAt === 'string' && raw.reportedAt.trim()
    ? raw.reportedAt.trim()
    : new Date().toISOString();

  return {
    ok: true,
    payload: {
      version: 1,
      locale: normalizeIntakeLocale(raw.locale),
      reportedAt,
      markers,
    },
    notesStripped,
  };
}

module.exports = {
  BODY_LAYERS,
  BODY_VIEWS,
  PAIN_FEELS,
  PAIN_ONSETS,
  MAX_BODY_MARKERS,
  MAX_MARKER_NOTE_LENGTH,
  MAX_REGION_LABEL_LENGTH,
  MAX_LAYER_LABEL_LENGTH,
  ALL_REGION_IDS,
  regionIdsFor,
  sideFromRegionId,
  validateBodyPainMapPayload,
};
