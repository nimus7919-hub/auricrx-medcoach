import { BODY_VIEWBOX, BODY_ZOOMS, findRegion, hitTestRegion, viewBoxToCanvas } from '../bodyMap/regions';
import {
  CLOSE_UP_PRESETS,
  FULL_CAMERA,
  MAX_ZOOM,
  cameraAt,
  cameraScale,
  clampCamera,
  isFullCamera,
  panBy,
  presetCamera,
  tapToBody,
  zoomAt,
  type Camera,
} from '../bodyMap/zoomCamera';

const canvas = { width: 200, height: 440 };
const W = BODY_VIEWBOX.width;
const H = BODY_VIEWBOX.height;
const inFrame = (c: Camera) => {
  expect(c.x).toBeGreaterThanOrEqual(-1e-6);
  expect(c.y).toBeGreaterThanOrEqual(-1e-6);
  expect(c.x + c.width).toBeLessThanOrEqual(W + 1e-6);
  expect(c.y + c.height).toBeLessThanOrEqual(H + 1e-6);
  expect(c.width / c.height).toBeCloseTo(W / H, 3);
};

describe('tap → normalized body coordinates', () => {
  it('maps identity at 1x', () => {
    const r = tapToBody(82, 182, canvas, FULL_CAMERA);
    expect(r.nx).toBeCloseTo(0.41, 5);
    expect(r.ny).toBeCloseTo(182 / 440, 5);
  });

  it.each([
    [2, 50, 100],
    [3, 120, 300],
    [4, 10, 20],
    [4, 150, 400],
    [1.5, 0, 0],
  ])('maps correctly at scale %p with offset (%p, %p)', (scale, x, y) => {
    const cam: Camera = { x, y, width: W / scale, height: H / scale };
    // Tap at the canvas centre and the top-left / bottom-right corners.
    const centre = tapToBody(canvas.width / 2, canvas.height / 2, canvas, cam);
    expect(centre.x).toBeCloseTo(x + W / scale / 2, 5);
    expect(centre.y).toBeCloseTo(y + H / scale / 2, 5);
    expect(tapToBody(0, 0, canvas, cam).nx).toBeCloseTo(x / W, 5);
    const br = tapToBody(canvas.width, canvas.height, canvas, cam);
    expect(br.nx).toBeCloseTo((x + W / scale) / W, 5);
    expect(br.ny).toBeCloseTo((y + H / scale) / H, 5);
  });

  it('works with a non-square device canvas (190.9 x 420)', () => {
    const dev = { width: 190.9, height: 420 };
    const cam = cameraAt(150, 175, 4);
    const r = tapToBody(dev.width * 0.25, dev.height * 0.75, dev, cam);
    expect(r.x).toBeCloseTo(cam.x + cam.width * 0.25, 4);
    expect(r.y).toBeCloseTo(cam.y + cam.height * 0.75, 4);
  });

  it('round-trips with the pin placement transform at every zoom (pins keep exact positions)', () => {
    for (const scale of [1, 2, 3.3, 4]) {
      const cam = cameraAt(124, 310, scale);
      const pos = viewBoxToCanvas(124, 310, canvas, cam);
      const back = tapToBody(pos.left, pos.top, canvas, cam);
      expect(back.x).toBeCloseTo(124, 5);
      expect(back.y).toBeCloseTo(310, 5);
      expect(back.nx).toBeCloseTo(0.62, 5);
    }
  });

  it('a zoomed tap resolves to the same region as the same body point at 1x', () => {
    const cam = cameraAt(155, 175, 4); // around the left forearm (front view)
    const pos = viewBoxToCanvas(155, 175, canvas, cam);
    const pt = tapToBody(pos.left, pos.top, canvas, cam);
    expect(hitTestRegion('skin', 'front', pt.x, pt.y)?.id).toBe(hitTestRegion('skin', 'front', 155, 175)?.id);
    expect(hitTestRegion('skin', 'front', pt.x, pt.y)?.id).toBe('forearm_left');
  });
});

describe('zoomAt (pinch / double-tap)', () => {
  it('keeps the body point under the fingers fixed', () => {
    const fx = 60;
    const fy = 300;
    const before = tapToBody(fx, fy, canvas, FULL_CAMERA);
    const z = zoomAt(FULL_CAMERA, fx, fy, 2, canvas);
    expect(cameraScale(z)).toBeCloseTo(2, 3);
    const after = tapToBody(fx, fy, canvas, z);
    expect(after.x).toBeCloseTo(before.x, 2);
    expect(after.y).toBeCloseTo(before.y, 2);
  });

  it('caps at 4x and at 1x', () => {
    expect(cameraScale(zoomAt(FULL_CAMERA, 100, 220, 10, canvas))).toBeCloseTo(MAX_ZOOM, 3);
    const out = zoomAt(cameraAt(100, 220, 3), 100, 220, 0.01, canvas);
    expect(out).toEqual(FULL_CAMERA);
    expect(isFullCamera(out)).toBe(true);
  });

  it('clamps near an edge so the body stays in view', () => {
    const z = zoomAt(FULL_CAMERA, 0, 0, 4, canvas);
    expect(z.x).toBe(0);
    expect(z.y).toBe(0);
    inFrame(z);
    const z2 = zoomAt(FULL_CAMERA, 200, 440, 4, canvas);
    inFrame(z2);
    expect(z2.x + z2.width).toBeCloseTo(W, 3);
  });
});

describe('panBy', () => {
  it('moves the body with the finger', () => {
    const cam = cameraAt(100, 220, 2);
    const moved = panBy(cam, 20, -40, canvas);
    // Finger right → window moves left (by 20px * units-per-px).
    expect(moved.x).toBeCloseTo(cam.x - 20 * (cam.width / canvas.width), 3);
    expect(moved.y).toBeCloseTo(cam.y + 40 * (cam.height / canvas.height), 3);
    expect(moved.width).toBe(cam.width);
  });

  it('clamps so the body never leaves the view', () => {
    const cam = cameraAt(100, 220, 4);
    inFrame(panBy(cam, 10000, 10000, canvas));
    inFrame(panBy(cam, -10000, -10000, canvas));
    expect(panBy(cam, 10000, 10000, canvas)).toMatchObject({ x: 0, y: 0 });
  });

  it('does nothing at 1x', () => {
    expect(panBy(FULL_CAMERA, 50, 50, canvas)).toEqual(FULL_CAMERA);
  });

  it('clampCamera fixes out-of-range scale and position', () => {
    const c = clampCamera({ x: -50, y: 500, width: 10, height: 22 });
    expect(cameraScale(c)).toBeCloseTo(MAX_ZOOM, 3);
    inFrame(c);
  });
});

describe('presets', () => {
  it('keeps the wide presets identical to BODY_ZOOMS', () => {
    for (const z of ['full', 'upper', 'lower'] as const) {
      expect(presetCamera(z, 'front')).toEqual(BODY_ZOOMS[z]);
      expect(presetCamera(z, 'back')).toEqual(BODY_ZOOMS[z]);
    }
  });

  const bounds = (shape: any) => {
    if (shape.kind === 'rect') return { x0: shape.x, y0: shape.y, x1: shape.x + shape.w, y1: shape.y + shape.h };
    if (shape.kind === 'ellipse') return { x0: shape.cx - shape.rx, y0: shape.cy - shape.ry, x1: shape.cx + shape.rx, y1: shape.cy + shape.ry };
    const xs = shape.points.map((q: number[]) => q[0]);
    const ys = shape.points.map((q: number[]) => q[1]);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  };
  const target: Record<string, Record<'front' | 'back', string>> = {
    head: { front: 'head', back: 'head_back' },
    hand_left: { front: 'hand_left', back: 'hand_back_left' },
    hand_right: { front: 'hand_right', back: 'hand_back_right' },
    foot_left: { front: 'foot_left', back: 'heel_left' },
    foot_right: { front: 'foot_right', back: 'heel_right' },
  };

  it.each(CLOSE_UP_PRESETS.flatMap((p) => (['front', 'back'] as const).map((v) => [p, v] as const)))(
    '%s (%s) is a valid close-up that frames the right region',
    (preset, view) => {
      const cam = presetCamera(preset, view);
      inFrame(cam);
      expect(cameraScale(cam)).toBeGreaterThanOrEqual(2);
      expect(cameraScale(cam)).toBeLessThanOrEqual(MAX_ZOOM);
      const inside = (x: number, y: number) => x >= cam.x && x <= cam.x + cam.width && y >= cam.y && y <= cam.y + cam.height;
      if (preset === 'torso') {
        expect(inside(100, 125)).toBe(true); // chest
        expect(inside(100, 200)).toBe(true); // belly / lower back
        return;
      }
      const region = findRegion('skin', view, target[preset][view]);
      expect(region).not.toBeNull();
      const b = bounds(region!.shape);
      expect(inside(b.x0, b.y0)).toBe(true);
      expect(inside(b.x1, b.y1)).toBe(true);
    }
  );

  it('maps the patient’s left/right to the correct screen side per view', () => {
    // Front view: patient's left is on the viewer's right.
    expect(presetCamera('hand_left', 'front').x).toBeGreaterThan(W / 2 - 1);
    expect(presetCamera('hand_right', 'front').x + presetCamera('hand_right', 'front').width).toBeLessThan(W / 2 + 1);
    // Back view: patient's left is on the viewer's left.
    expect(presetCamera('hand_left', 'back').x + presetCamera('hand_left', 'back').width).toBeLessThan(W / 2 + 1);
    expect(presetCamera('foot_right', 'back').x).toBeGreaterThan(W / 2 - 50);
  });
});
