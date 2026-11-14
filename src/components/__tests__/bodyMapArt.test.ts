import { ART, SKIN } from '../bodyMap/art';
import { getAllRegionIds, getRegions, hitTestRegion, shapeCenter } from '../bodyMap/regions';
import { BODY_LAYERS, BODY_VIEWS } from '../bodyMap/types';

describe('body map artwork data', () => {
  it('has matching dark/light palettes and valid path rows for every layer and view', () => {
    for (const layer of Object.keys(ART) as (keyof typeof ART)[]) {
      for (const view of BODY_VIEWS) {
        const art = ART[layer][view];
        expect(art.dark.length).toBe(art.light.length);
        expect(art.p.length).toBeGreaterThan(20);
        for (const row of art.p) {
          const [fi, si] = row;
          const d = row[row.length - 1] as string;
          expect(fi).toBeLessThan(art.dark.length);
          expect(si).toBeLessThan(art.dark.length);
          expect(fi >= 0 || si >= 0).toBe(true);
          expect(d).toMatch(/^[Mm]/);
        }
        for (const c of [...art.dark, ...art.light]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it('has a body surface outline for both views', () => {
    for (const view of BODY_VIEWS) {
      expect(SKIN[view].outline).toMatch(/^[Mm]/);
      expect(SKIN[view].insets.length).toBeGreaterThan(0);
      expect(SKIN[view].lines.length).toBeGreaterThan(0);
    }
  });
});

describe('regions fitted to the artwork', () => {
  it('still exposes the same 67 region ids', () => {
    expect(getAllRegionIds()).toHaveLength(67);
  });

  it('every region center hits its own region (no region is shadowed)', () => {
    for (const layer of BODY_LAYERS) {
      for (const view of BODY_VIEWS) {
        for (const r of getRegions(layer, view)) {
          const c = shapeCenter(r.shape);
          expect(hitTestRegion(layer, view, c.x, c.y)?.id).toBe(r.id);
        }
      }
    }
  });

  it('maps taps on the new figure to plain location regions', () => {
    expect(hitTestRegion('skin', 'front', 100, 20)?.id).toBe('head');
    expect(hitTestRegion('skin', 'front', 30, 235)?.id).toBe('hand_right');
    expect(hitTestRegion('bones', 'front', 125, 310)?.id).toBe('knee_left');
    expect(hitTestRegion('vessels', 'front', 70, 352)?.id).toBe('lower_leg_right');
    expect(hitTestRegion('skin', 'back', 130, 425)?.id).toBe('heel_right');
    // back view, area over the kidneys in the artwork
    expect(hitTestRegion('organs', 'back', 84, 178)?.id).toBe('lower_back_left');
    expect(hitTestRegion('organs', 'back', 116, 150)?.id).toBe('flank_right');
    expect(hitTestRegion('organs', 'front', 100, 225)?.id).toBe('pelvic');
  });
});
