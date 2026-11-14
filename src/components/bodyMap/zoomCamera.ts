/**
 * Pure camera math for the body map zoom (pinch, pan, double-tap, presets).
 *
 * A camera is a viewBox rectangle in BODY_VIEWBOX units with the figure's aspect ratio.
 * Zoom scale = BODY_VIEWBOX.width / camera.width (1 = whole body, MAX_ZOOM = closest).
 * Marker positions are stored in full-body units and never depend on the camera, so they
 * keep the same normalized x/y (0–1) at every zoom level.
 */
import { BODY_VIEWBOX, BODY_ZOOMS, canvasToViewBox, viewBoxToCanvas } from './regions';
import type { BodyView } from './types';

export interface Camera {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface CanvasSize {
  width: number;
  height: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** Double-tap zooms in by this factor around the tapped point. */
export const DOUBLE_TAP_FACTOR = 2;

const W = BODY_VIEWBOX.width;
const H = BODY_VIEWBOX.height;

export const FULL_CAMERA: Camera = { x: 0, y: 0, width: W, height: H };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number) => Math.round(v * 1000) / 1000;

export function cameraScale(c: Camera): number {
  return W / c.width;
}

/** Keep the zoom in range and the camera inside the body frame (so the body never leaves the view). */
export function clampCamera(c: Camera): Camera {
  const scale = clamp(W / c.width, MIN_ZOOM, MAX_ZOOM);
  const width = W / scale;
  const height = H / scale;
  // Re-centre if the scale changed, then keep the window inside the frame.
  const cx = c.x + c.width / 2;
  const cy = c.y + c.height / 2;
  return {
    x: round(clamp(cx - width / 2, 0, W - width)),
    y: round(clamp(cy - height / 2, 0, H - height)),
    width: round(width),
    height: round(height),
  };
}

/** Camera centred on a body point at the given zoom scale. */
export function cameraAt(cx: number, cy: number, scale: number): Camera {
  const s = clamp(scale, MIN_ZOOM, MAX_ZOOM);
  const width = W / s;
  const height = H / s;
  return clampCamera({ x: cx - width / 2, y: cy - height / 2, width, height });
}

/** Zoom by `factor` keeping the body point under the focal canvas pixel fixed (pinch / double-tap). */
export function zoomAt(c: Camera, focalPx: number, focalPy: number, factor: number, canvas: CanvasSize): Camera {
  const p = canvasToViewBox(focalPx, focalPy, canvas, c);
  const scale = clamp(cameraScale(c) * factor, MIN_ZOOM, MAX_ZOOM);
  const width = W / scale;
  const height = H / scale;
  const fx = focalPx / canvas.width;
  const fy = focalPy / canvas.height;
  const next = { x: p.x - fx * width, y: p.y - fy * height, width, height };
  // clampCamera re-centres on the same centre, so only the frame clamp applies here.
  return {
    x: round(clamp(next.x, 0, W - width)),
    y: round(clamp(next.y, 0, H - height)),
    width: round(width),
    height: round(height),
  };
}

/** Pan by a finger drag of (dx, dy) canvas pixels: the body follows the finger. */
export function panBy(c: Camera, dxPx: number, dyPx: number, canvas: CanvasSize): Camera {
  const ux = c.width / canvas.width;
  const uy = c.height / canvas.height;
  return clampCamera({ ...c, x: c.x - dxPx * ux, y: c.y - dyPx * uy });
}

/** A tap at canvas pixel (px, py) → full-body viewBox coordinates and normalized 0–1 position. */
export function tapToBody(px: number, py: number, canvas: CanvasSize, c: Camera) {
  const p = canvasToViewBox(px, py, canvas, c);
  return { x: p.x, y: p.y, nx: p.x / W, ny: p.y / H };
}

/** Where a full-body point lands on the canvas for this camera (pins). */
export function bodyToCanvas(x: number, y: number, canvas: CanvasSize, c: Camera) {
  return viewBoxToCanvas(x, y, canvas, c);
}

export function isFullCamera(c: Camera): boolean {
  return cameraScale(c) <= MIN_ZOOM + 1e-3;
}

// ---------- presets ----------

export const WIDE_PRESETS = ['full', 'upper', 'lower'] as const;
export const CLOSE_UP_PRESETS = ['head', 'torso', 'hand_right', 'hand_left', 'foot_right', 'foot_left'] as const;
export type ZoomPreset = (typeof WIDE_PRESETS)[number] | (typeof CLOSE_UP_PRESETS)[number];

/** Viewer-side x of the patient's left/right limb in this view (front view: patient's left is on the viewer's right). */
function limbX(side: 'left' | 'right', view: BodyView, viewerRightX: number): number {
  const onViewerRight = view === 'front' ? side === 'left' : side === 'right';
  return onViewerRight ? viewerRightX : W - viewerRightX;
}

export function presetCamera(preset: ZoomPreset, view: BodyView): Camera {
  switch (preset) {
    case 'full':
    case 'upper':
    case 'lower':
      return { ...BODY_ZOOMS[preset] };
    case 'head':
      return cameraAt(100, 42, 3.4);
    case 'torso':
      return cameraAt(100, 160, 2);
    case 'hand_left':
    case 'hand_right':
      return cameraAt(limbX(preset === 'hand_left' ? 'left' : 'right', view, 168), 234, 3.2);
    case 'foot_left':
    case 'foot_right':
      return cameraAt(limbX(preset === 'foot_left' ? 'left' : 'right', view, 132), 412, 3.2);
  }
}
