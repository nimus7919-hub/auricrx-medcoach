/**
 * Realistic anatomy artwork for the pain map, rendered with react-native-svg <Path> elements.
 *
 * The vector data in ./art is adapted from openly licensed illustrations (CC0, public domain and
 * CC BY-SA 4.0); see THIRD_PARTY_NOTICES.md at the repository root for sources and credits.
 * Every layer is warped onto one shared body silhouette so the tappable regions in regions.ts line up.
 *
 * Organ shapes are visual context only and are NEVER labeled with organ names in the UI;
 * patients pick plain location regions (see regions.ts).
 */
import React, { memo } from 'react';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ART, SKIN, type ArtLayer } from './art';
import type { BodyRegion, RegionShape } from './regions';
import type { BodyLayer, BodyView } from './types';

export interface BodyFigurePalette {
  /** Drives which pre-toned art palette is used. */
  mode: 'dark' | 'light';
  fill: string;
  fillEnd: string;
  outline: string;
  highlight: string;
  detail: string;
}

interface Props {
  layer: BodyLayer;
  view: BodyView;
  viewBox: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
  palette: BodyFigurePalette;
  highlight?: BodyRegion | null;
  /** Faint outlines of every tappable region (helps orientation on the organs layer). */
  regions?: BodyRegion[];
}

type Pt = [number, number];

/** Closed Catmull-Rom spline through the points → smooth cubic Bézier path. Exported for tests and callers. */
export function smoothClosedPath(points: Pt[], tension = 0.5): string {
  const n = points.length;
  if (n < 3) return '';
  const p = (i: number) => points[(i + n) % n];
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    const c1x = x1 + ((x2 - x0) / 6) * tension * 2;
    const c1y = y1 + ((y2 - y0) / 6) * tension * 2;
    const c2x = x2 - ((x3 - x1) / 6) * tension * 2;
    const c2y = y2 - ((y3 - y1) / 6) * tension * 2;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2},${y2}`;
  }
  return `${d} Z`;
}

// ---------- art layers ----------

const ArtPaths = memo(function ArtPaths({ art, mode, opacity = 1, strokeOnly }: { art: ArtLayer; mode: 'dark' | 'light'; opacity?: number; strokeOnly?: string }) {
  const pal = mode === 'dark' ? art.dark : art.light;
  return (
    <G opacity={opacity}>
      {art.p.map((row, i) => {
        const [fi, si, w] = row;
        const op = row.length === 5 ? row[3] : undefined;
        const d = row.length === 5 ? row[4] : row[3];
        if (strokeOnly) {
          return <Path key={i} d={d} fill="none" stroke={strokeOnly} strokeWidth={0.35} strokeLinejoin="round" />;
        }
        return (
          <Path
            key={i}
            d={d}
            fill={fi >= 0 ? pal[fi] : 'none'}
            stroke={si >= 0 ? pal[si] : undefined}
            strokeWidth={si >= 0 ? w : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={op}
          />
        );
      })}
    </G>
  );
});

/** Body surface: gradient fill, soft inset shading, faint muscle contours and gold linework. */
const Skin = memo(function Skin({ view, palette, active }: { view: BodyView; palette: BodyFigurePalette; active: boolean }) {
  const skin = SKIN[view];
  const dark = palette.mode === 'dark';
  const shade = dark ? '#FFF5E4' : '#FFFFFF';
  return (
    <G opacity={active ? 1 : dark ? 0.5 : 0.62}>
      <Path d={skin.outline} fill="url(#bm-skin)" />
      {active
        ? skin.insets.map((d, i) => <Path key={i} d={d} fill={shade} opacity={dark ? 0.05 : 0.2} />)
        : null}
      {active ? <ArtPaths art={ART.muscles[view]} mode={palette.mode} opacity={dark ? 0.16 : 0.2} strokeOnly={palette.detail} /> : null}
      {active
        ? skin.lines.map((d, i) => (
            <Path key={`l${i}`} d={d} fill="none" stroke={palette.detail} strokeWidth={0.75} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          ))
        : null}
      <Path d={skin.outline} fill="none" stroke={palette.outline} strokeWidth={active ? 1.1 : 0.8} strokeLinejoin="round" />
    </G>
  );
});

// ---------- regions ----------

export function RegionShapeView({ shape, ...rest }: { shape: RegionShape } & Record<string, unknown>) {
  switch (shape.kind) {
    case 'rect':
      return <Rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={6} {...rest} />;
    case 'ellipse':
      return <Ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...rest} />;
    case 'poly':
      return <Polygon points={shape.points.map((p) => p.join(',')).join(' ')} {...rest} />;
  }
}

export default function BodyFigure({ layer, view, viewBox, width, height, palette, highlight, regions }: Props) {
  const vb = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  return (
    <Svg width={width} height={height} viewBox={vb} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id="bm-skin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.fill} stopOpacity={1} />
          <Stop offset="1" stopColor={palette.fillEnd} stopOpacity={1} />
        </LinearGradient>
        <RadialGradient id="bm-glow" cx="50%" cy="45%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={palette.highlight} stopOpacity={0.16} />
          <Stop offset="1" stopColor={palette.highlight} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={100} cy={200} rx={100} ry={220} fill="url(#bm-glow)" />
      {/* The body surface is always drawn; deeper layers sit on top of a dimmed surface so the active layer stands out. */}
      <Skin view={view} palette={palette} active={layer === 'skin'} />
      {layer !== 'skin' ? <ArtPaths art={ART[layer][view]} mode={palette.mode} /> : null}
      {regions?.map((r) => (
        <RegionShapeView key={r.id} shape={r.shape} fill="none" stroke={palette.highlight} strokeWidth={0.6} strokeDasharray="2 3" opacity={0.45} />
      ))}
      {highlight ? (
        <RegionShapeView shape={highlight.shape} fill={palette.highlight} fillOpacity={0.28} stroke={palette.highlight} strokeWidth={1.4} />
      ) : null}
    </Svg>
  );
}
