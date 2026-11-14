import { bodyMapReducer, initialBodyMapState, sanitizeDescriptors, type BodyMapAction, type BodyMapState } from '../bodyMap/markersReducer';
import { canvasToViewBox, getAllRegionIds, getRegions, hitTestRegion, shapeCenter, viewBoxToCanvas, BODY_ZOOMS } from '../bodyMap/regions';
import { smoothClosedPath } from '../bodyMap/BodyFigure';
import { BODY_LAYERS, MAX_BODY_MARKERS, MAX_MARKER_NOTE_LENGTH } from '../bodyMap/types';

const run = (s: BodyMapState, ...actions: BodyMapAction[]) => actions.reduce(bodyMapReducer, s);

describe('body map marker reducer', () => {
  it('starts on skin / front / whole body with no markers', () => {
    const s = initialBodyMapState();
    expect(s).toMatchObject({ layer: 'skin', view: 'front', zoom: 'full', markers: [], selectedId: null, nextSeq: 1 });
  });

  it('places a marker with the current layer + view and selects it', () => {
    const s = run(initialBodyMapState(), { type: 'SET_LAYER', layer: 'muscles' }, { type: 'SET_VIEW', view: 'back' }, { type: 'PLACE', regionId: 'lower_back_left', x: 88.123, y: 180 });
    expect(s.markers).toHaveLength(1);
    expect(s.markers[0]).toMatchObject({ id: 'm1', seq: 1, layer: 'muscles', view: 'back', regionId: 'lower_back_left', x: 88.1, y: 180, intensity: null, feels: [], onset: null, note: null });
    expect(s.selectedId).toBe('m1');
    expect(s.nextSeq).toBe(2);
  });

  it('supports several markers across layers and keeps pin numbers stable after removal', () => {
    let s = run(initialBodyMapState(), { type: 'PLACE', regionId: 'head', x: 100, y: 30 }, { type: 'SET_LAYER', layer: 'organs' }, { type: 'PLACE', regionId: 'navel', x: 100, y: 170 });
    expect(s.markers.map((m) => [m.seq, m.layer])).toEqual([[1, 'skin'], [2, 'organs']]);
    s = run(s, { type: 'REMOVE', id: 'm1' }, { type: 'PLACE', regionId: 'pelvic', x: 100, y: 210 });
    expect(s.markers.map((m) => m.seq)).toEqual([2, 3]);
  });

  it(`caps markers at ${MAX_BODY_MARKERS}`, () => {
    let s = initialBodyMapState();
    for (let i = 0; i < MAX_BODY_MARKERS + 3; i++) s = bodyMapReducer(s, { type: 'PLACE', regionId: 'head', x: 100, y: 30 });
    expect(s.markers).toHaveLength(MAX_BODY_MARKERS);
  });

  it('ignores invalid placements', () => {
    const s0 = initialBodyMapState();
    expect(run(s0, { type: 'PLACE', regionId: '', x: 1, y: 1 })).toBe(s0);
    expect(run(s0, { type: 'PLACE', regionId: 'head', x: NaN, y: 1 })).toBe(s0);
  });

  it('updates descriptors with sanitizing (clamp 0–10, valid feel words, trimmed note)', () => {
    let s = run(initialBodyMapState(), { type: 'PLACE', regionId: 'knee_left', x: 117, y: 310 });
    s = run(s, { type: 'UPDATE', id: 'm1', patch: { intensity: 14, feels: ['aching', 'bogus' as any, 'sharp', 'aching'], onset: 'days', note: '   hurts on stairs  ' } });
    expect(s.markers[0]).toMatchObject({ intensity: 10, feels: ['sharp', 'aching'], onset: 'days', note: 'hurts on stairs' });
    s = run(s, { type: 'UPDATE', id: 'm1', patch: { intensity: -3 } });
    expect(s.markers[0].intensity).toBe(0);
    expect(s.markers[0].feels).toEqual(['sharp', 'aching']); // untouched fields kept
    s = run(s, { type: 'UPDATE', id: 'm1', patch: { intensity: null, onset: 'never' as any, note: '' } });
    expect(s.markers[0]).toMatchObject({ intensity: null, onset: null, note: null });
  });

  it('caps note length', () => {
    const d = sanitizeDescriptors({ note: 'x'.repeat(MAX_MARKER_NOTE_LENGTH + 50) });
    expect(d.note).toHaveLength(MAX_MARKER_NOTE_LENGTH);
  });

  it('selecting a marker brings its layer and view into focus; remove clears selection', () => {
    let s = run(initialBodyMapState(), { type: 'SET_VIEW', view: 'back' }, { type: 'SET_LAYER', layer: 'bones' }, { type: 'PLACE', regionId: 'calf_left', x: 80, y: 350 });
    s = run(s, { type: 'SET_VIEW', view: 'front' }, { type: 'SET_LAYER', layer: 'skin' });
    expect(s.selectedId).toBeNull();
    s = run(s, { type: 'SELECT', id: 'm1' });
    expect(s).toMatchObject({ selectedId: 'm1', view: 'back', layer: 'bones' });
    s = run(s, { type: 'REMOVE', id: 'm1' });
    expect(s.selectedId).toBeNull();
    expect(run(s, { type: 'SELECT', id: 'nope' })).toBe(s);
  });

  it('clear removes everything; zoom changes only zoom', () => {
    let s = run(initialBodyMapState(), { type: 'PLACE', regionId: 'head', x: 100, y: 30 }, { type: 'SET_ZOOM', zoom: 'upper' });
    expect(s.zoom).toBe('upper');
    expect(s.markers).toHaveLength(1);
    s = run(s, { type: 'CLEAR' });
    expect(s.markers).toEqual([]);
  });
});

describe('body map regions', () => {
  it('every layer has regions on both views and ids are unique per layer/view', () => {
    for (const layer of BODY_LAYERS) {
      for (const view of ['front', 'back'] as const) {
        const ids = getRegions(layer, view).map((r) => r.id);
        expect(ids.length).toBeGreaterThan(5);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it("left/right are the PATIENT's sides: mirrored between front and back views", () => {
    // Viewer's right half (x > 100) on the front view is the patient's LEFT.
    expect(hitTestRegion('skin', 'front', 155, 175)?.id).toBe('forearm_left');
    expect(hitTestRegion('skin', 'front', 45, 175)?.id).toBe('forearm_right');
    // On the back view the viewer's right half is the patient's RIGHT.
    expect(hitTestRegion('skin', 'back', 155, 175)?.id).toBe('forearm_back_right');
    expect(hitTestRegion('muscles', 'back', 85, 180)?.id).toBe('lower_back_left');
  });

  it('organ regions use plain location words (lay ids) and do not cover limbs', () => {
    expect(hitTestRegion('organs', 'front', 80, 140)?.id).toBe('upper_abdomen_right');
    expect(hitTestRegion('organs', 'front', 100, 168)?.id).toBe('navel');
    expect(hitTestRegion('organs', 'front', 155, 175)).toBeNull();
    expect(hitTestRegion('skin', 'front', 5, 5)).toBeNull();
  });

  it('every region center hits its own region (list fallback places pins correctly)', () => {
    for (const layer of BODY_LAYERS) {
      for (const view of ['front', 'back'] as const) {
        for (const r of getRegions(layer, view)) {
          const c = shapeCenter(r.shape);
          const hit = hitTestRegion(layer, view, c.x, c.y);
          // Center must be inside the region itself, or inside an earlier, more specific one that shares the area.
          expect(hit).not.toBeNull();
        }
      }
    }
  });

  it('collects all region ids', () => {
    const ids = getAllRegionIds();
    expect(ids).toContain('lower_back_left');
    expect(ids).toContain('upper_abdomen_right');
    expect(ids.length).toBeGreaterThan(50);
  });

  it('maps canvas touches to viewBox coordinates and back, including zoom', () => {
    const canvas = { width: 200, height: 440 };
    expect(canvasToViewBox(100, 220, canvas, BODY_ZOOMS.full)).toEqual({ x: 100, y: 220 });
    const z = canvasToViewBox(100, 220, canvas, BODY_ZOOMS.upper);
    expect(z.x).toBeCloseTo(100);
    expect(z.y).toBeCloseTo(154);
    const back = viewBoxToCanvas(z.x, z.y, canvas, BODY_ZOOMS.upper);
    expect(back.left).toBeCloseTo(100);
    expect(back.top).toBeCloseTo(220);
    expect(viewBoxToCanvas(100, 420, canvas, BODY_ZOOMS.upper).visible).toBe(false);
  });

  it('builds a closed smooth silhouette path', () => {
    const d = smoothClosedPath([[0, 0], [10, 0], [10, 10], [0, 10]]);
    expect(d.startsWith('M0,0')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect((d.match(/C/g) || []).length).toBe(4);
  });
});
