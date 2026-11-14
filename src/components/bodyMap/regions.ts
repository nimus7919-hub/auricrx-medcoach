/**
 * Tappable regions of the stylized body figure, per layer and view.
 *
 * Region names are PLAIN LOCATION WORDS ONLY ("upper right abdomen area", "left forearm").
 * They never name a condition or suggest what a location could mean.
 *
 * Geometry is in BODY_VIEWBOX units. Sided regions are authored once for the viewer's RIGHT half
 * and mirrored. Left/right always means the PATIENT's left/right:
 *   - front view: the patient's left is on the viewer's right
 *   - back view:  the patient's left is on the viewer's left
 */
import type { BodyLayer, BodyView } from './types';

export const BODY_VIEWBOX = { x: 0, y: 0, width: 200, height: 440 } as const;
const MID_X = BODY_VIEWBOX.width / 2;

export type RegionShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'poly'; points: [number, number][] };

export interface BodyRegion {
  /** Stable id; i18n label at `bodyMap.regions.<id>`. */
  id: string;
  shape: RegionShape;
}

interface RegionTemplate {
  base: string;
  sided: boolean;
  /** For sided templates: drawn on the viewer's right half. */
  shape: RegionShape;
}

const rect = (x: number, y: number, w: number, h: number): RegionShape => ({ kind: 'rect', x, y, w, h });
const ellipse = (cx: number, cy: number, rx: number, ry: number): RegionShape => ({ kind: 'ellipse', cx, cy, rx, ry });
const poly = (...points: [number, number][]): RegionShape => ({ kind: 'poly', points });
const C = (base: string, shape: RegionShape): RegionTemplate => ({ base, sided: false, shape });
const S = (base: string, shape: RegionShape): RegionTemplate => ({ base, sided: true, shape });

// Arm / leg geometry shared by surface layers (viewer's right half).
const HAND = rect(146, 203, 28, 34);
const FOREARM = poly([139, 146], [159, 146], [168, 203], [147, 203]);
const UPPER_ARM = poly([135, 104], [153, 100], [159, 146], [139, 146]);
const SHOULDER = ellipse(139, 93, 14, 12);
const THIGH = rect(100, 230, 37, 68);
const KNEE = rect(100, 298, 33, 24);
const LOWER_LEG = rect(102, 322, 31, 68);
const FOOT = rect(102, 390, 32, 34);
const HEAD = ellipse(100, 37, 24, 29);
const NECK = rect(88, 62, 24, 19);

/** Order matters: the first region that contains the point wins (specific before broad). */
const SURFACE_FRONT: RegionTemplate[] = [
  C('head', HEAD),
  C('neck', NECK),
  S('hand', HAND),
  S('forearm', FOREARM),
  S('upper_arm', UPPER_ARM),
  S('shoulder', SHOULDER),
  S('chest', rect(100, 81, 36, 49)),
  C('abdomen_upper', rect(66, 130, 68, 35)),
  C('abdomen_lower', rect(66, 165, 68, 35)),
  S('hip', rect(100, 200, 38, 30)),
  S('thigh', THIGH),
  S('knee', KNEE),
  S('lower_leg', LOWER_LEG),
  S('foot', FOOT),
];

const SURFACE_BACK: RegionTemplate[] = [
  C('head_back', HEAD),
  C('neck_back', NECK),
  S('hand_back', HAND),
  S('forearm_back', FOREARM),
  S('upper_arm_back', UPPER_ARM),
  S('shoulder_back', SHOULDER),
  S('upper_back', rect(100, 81, 36, 49)),
  C('mid_back', rect(66, 130, 68, 35)),
  S('lower_back', rect(100, 165, 36, 35)),
  S('buttock', rect(100, 200, 38, 34)),
  S('thigh_back', rect(100, 234, 37, 64)),
  S('knee_back', KNEE),
  S('calf', LOWER_LEG),
  S('heel', FOOT),
];

const ORGANS_FRONT: RegionTemplate[] = [
  C('head', HEAD),
  C('throat', NECK),
  C('chest_center', rect(92, 81, 16, 47)),
  S('chest', rect(108, 81, 27, 47)),
  C('abdomen_upper_middle', rect(90, 128, 20, 30)),
  S('upper_abdomen', rect(110, 128, 25, 30)),
  C('navel', rect(88, 158, 24, 22)),
  S('mid_abdomen', rect(112, 158, 23, 22)),
  C('abdomen_lower_middle', rect(90, 180, 20, 22)),
  S('lower_abdomen', rect(110, 180, 25, 22)),
  C('pelvic', rect(76, 202, 48, 26)),
];

const ORGANS_BACK: RegionTemplate[] = [
  C('head_back', HEAD),
  C('neck_back', NECK),
  C('spine', rect(94, 81, 12, 119)),
  S('back_ribs', rect(106, 81, 29, 51)),
  S('flank', rect(106, 132, 29, 33)),
  S('lower_back', rect(106, 165, 29, 35)),
  C('pelvic_back', rect(76, 200, 48, 28)),
];

function mirrorShape(shape: RegionShape): RegionShape {
  switch (shape.kind) {
    case 'rect':
      return { ...shape, x: 2 * MID_X - shape.x - shape.w };
    case 'ellipse':
      return { ...shape, cx: 2 * MID_X - shape.cx };
    case 'poly':
      return { kind: 'poly', points: shape.points.map(([x, y]) => [2 * MID_X - x, y] as [number, number]) };
  }
}

function expand(templates: RegionTemplate[], view: BodyView): BodyRegion[] {
  // Which patient side is drawn on the viewer's right half for this view.
  const viewerRight = view === 'front' ? 'left' : 'right';
  const viewerLeft = view === 'front' ? 'right' : 'left';
  const out: BodyRegion[] = [];
  for (const t of templates) {
    if (!t.sided) {
      out.push({ id: t.base, shape: t.shape });
      continue;
    }
    out.push({ id: `${t.base}_${viewerRight}`, shape: t.shape });
    out.push({ id: `${t.base}_${viewerLeft}`, shape: mirrorShape(t.shape) });
  }
  return out;
}

const SURFACE_LAYERS: BodyLayer[] = ['skin', 'muscles', 'vessels', 'bones'];

const CACHE = new Map<string, BodyRegion[]>();

/** Tappable regions for a layer + view. Skin, muscles, vessels and bones share surface regions. */
export function getRegions(layer: BodyLayer, view: BodyView): BodyRegion[] {
  const key = `${SURFACE_LAYERS.includes(layer) ? 'surface' : 'organs'}:${view}`;
  let regions = CACHE.get(key);
  if (!regions) {
    const templates = layer === 'organs' ? (view === 'front' ? ORGANS_FRONT : ORGANS_BACK) : view === 'front' ? SURFACE_FRONT : SURFACE_BACK;
    regions = expand(templates, view);
    CACHE.set(key, regions);
  }
  return regions;
}

/** Every region id that can ever be produced (for i18n coverage tests). */
export function getAllRegionIds(): string[] {
  const ids = new Set<string>();
  for (const layer of ['skin', 'organs'] as BodyLayer[]) {
    for (const view of ['front', 'back'] as BodyView[]) {
      for (const r of getRegions(layer, view)) ids.add(r.id);
    }
  }
  return Array.from(ids).sort();
}

export function pointInShape(shape: RegionShape, x: number, y: number): boolean {
  switch (shape.kind) {
    case 'rect':
      return x >= shape.x && x <= shape.x + shape.w && y >= shape.y && y <= shape.y + shape.h;
    case 'ellipse': {
      const dx = (x - shape.cx) / shape.rx;
      const dy = (y - shape.cy) / shape.ry;
      return dx * dx + dy * dy <= 1;
    }
    case 'poly': {
      let inside = false;
      const pts = shape.points;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }
  }
}

/** First region (in priority order) containing the point, or null when the tap misses the body. */
export function hitTestRegion(layer: BodyLayer, view: BodyView, x: number, y: number): BodyRegion | null {
  return getRegions(layer, view).find((r) => pointInShape(r.shape, x, y)) ?? null;
}

export function shapeCenter(shape: RegionShape): { x: number; y: number } {
  switch (shape.kind) {
    case 'rect':
      return { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
    case 'ellipse':
      return { x: shape.cx, y: shape.cy };
    case 'poly': {
      const n = shape.points.length;
      const sx = shape.points.reduce((a, [x]) => a + x, 0);
      const sy = shape.points.reduce((a, [, y]) => a + y, 0);
      return { x: sx / n, y: sy / n };
    }
  }
}

export function findRegion(layer: BodyLayer, view: BodyView, regionId: string): BodyRegion | null {
  return getRegions(layer, view).find((r) => r.id === regionId) ?? null;
}

/** Zoom presets: same aspect ratio as the full figure so taps map linearly. */
export const BODY_ZOOMS = {
  full: { x: 0, y: 0, width: 200, height: 440 },
  upper: { x: 30, y: 0, width: 140, height: 308 },
  lower: { x: 30, y: 132, width: 140, height: 308 },
} as const;
export type BodyZoom = keyof typeof BODY_ZOOMS;

/** Convert a touch point on a canvas of the given pixel size into viewBox coordinates. */
export function canvasToViewBox(
  px: number,
  py: number,
  canvas: { width: number; height: number },
  vb: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  return { x: vb.x + (px / canvas.width) * vb.width, y: vb.y + (py / canvas.height) * vb.height };
}

export function viewBoxToCanvas(
  x: number,
  y: number,
  canvas: { width: number; height: number },
  vb: { x: number; y: number; width: number; height: number }
): { left: number; top: number; visible: boolean } {
  const left = ((x - vb.x) / vb.width) * canvas.width;
  const top = ((y - vb.y) / vb.height) * canvas.height;
  return { left, top, visible: left >= 0 && top >= 0 && left <= canvas.width && top <= canvas.height };
}
