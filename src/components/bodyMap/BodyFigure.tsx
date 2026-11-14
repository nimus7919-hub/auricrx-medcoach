/**
 * ORIGINAL stylized body artwork for the pain map, drawn with react-native-svg primitives.
 * Shapes are simplified, non-anatomical illustrations (no copied anatomy images).
 * Organ shapes are decorative context only and are NEVER labeled with organ names in the UI;
 * patients pick plain location regions (see regions.ts).
 */
import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { BodyRegion, RegionShape } from './regions';
import type { BodyLayer, BodyView } from './types';

export interface BodyFigurePalette {
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

// ---------- silhouette ----------

type Pt = [number, number];
/** Viewer's right half, from the right side of the neck down to the crotch. */
const RIGHT_HALF: Pt[] = [
  [110, 62], [111, 76], [127, 82], [141, 87], [150, 98], [153, 118], [156, 145], [160, 172], [165, 199],
  [171, 213], [169, 231], [160, 235], [155, 219], [151, 203], [145, 173], [140, 147], [137, 125], [135, 112],
  [133, 140], [129, 165], [133, 195], [136, 216], [134, 260], [130, 300], [131, 340], [126, 388], [131, 410],
  [125, 421], [108, 421], [107, 400], [108, 345], [106, 302], [104, 250], [100, 229],
];
const OUTLINE: Pt[] = [...RIGHT_HALF, ...RIGHT_HALF.slice(0, -1).reverse().map(([x, y]) => [200 - x, y] as Pt)];

/** Closed Catmull-Rom spline through the points → smooth cubic Bézier path. Exported for tests. */
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

const BODY_PATH = smoothClosedPath(OUTLINE, 0.42);
const MIRROR = 'translate(200,0) scale(-1,1)';

function Mirrored({ children }: { children: React.ReactNode }) {
  return (
    <>
      <G>{children}</G>
      <G transform={MIRROR}>{children}</G>
    </>
  );
}

function Silhouette({ palette, dim }: { palette: BodyFigurePalette; dim: number }) {
  return (
    <G opacity={dim}>
      <Path d={BODY_PATH} fill="url(#bm-skin)" stroke={palette.outline} strokeWidth={1.6} strokeLinejoin="round" />
      <Ellipse cx={100} cy={37} rx={21} ry={26} fill="url(#bm-skin)" stroke={palette.outline} strokeWidth={1.6} />
    </G>
  );
}

// ---------- layers ----------

function SkinDetails({ view, palette }: { view: BodyView; palette: BodyFigurePalette }) {
  const s = { stroke: palette.detail, strokeWidth: 1, fill: 'none', strokeLinecap: 'round' as const, opacity: 0.7 };
  if (view === 'front') {
    return (
      <G>
        <Mirrored>
          <Path d="M102,86 Q116,84 128,88" {...s} />
          <Path d="M106,112 Q116,120 128,112" {...s} opacity={0.4} />
          <Path d="M112,300 Q118,306 124,300" {...s} opacity={0.5} />
        </Mirrored>
        <Circle cx={100} cy={172} r={1.6} fill={palette.detail} opacity={0.8} />
        <Path d="M100,92 L100,128" {...s} opacity={0.35} />
      </G>
    );
  }
  return (
    <G>
      <Path d="M100,80 L100,198" {...s} strokeDasharray="2 4" />
      <Mirrored>
        <Path d="M108,96 Q122,92 126,104 Q124,118 110,120" {...s} opacity={0.5} />
        <Path d="M104,204 Q118,226 132,214" {...s} opacity={0.5} />
        <Path d="M110,304 Q118,298 126,304" {...s} opacity={0.5} />
      </Mirrored>
    </G>
  );
}

const M_FILL = '#B9664F';
const M_LINE = '#E7A48D';

function Muscles({ view }: { view: BodyView }) {
  const m = { fill: M_FILL, stroke: M_LINE, strokeWidth: 0.9, opacity: 0.92 };
  if (view === 'front') {
    return (
      <G>
        <Mirrored>
          <Ellipse cx={140} cy={99} rx={10} ry={12} {...m} />
          <Path d="M101,88 Q120,83 134,94 Q133,117 113,124 Q102,122 101,112 Z" {...m} />
          <Ellipse cx={146.5} cy={123} rx={6} ry={16} {...m} />
          <Ellipse cx={153} cy={172} rx={5.5} ry={22} {...m} />
          <Rect x={102} y={130} width={12} height={15} rx={4} {...m} />
          <Rect x={102} y={148} width={12} height={15} rx={4} {...m} />
          <Rect x={102} y={166} width={12} height={17} rx={4} {...m} />
          <Path d="M117,130 Q129,152 126,190 L119,192 Q121,160 117,130 Z" {...m} />
          <Ellipse cx={118} cy={262} rx={13} ry={33} {...m} />
          <Path d="M106,236 Q110,270 112,296" stroke={M_LINE} strokeWidth={0.9} fill="none" opacity={0.8} />
          <Ellipse cx={119} cy={352} rx={8} ry={27} {...m} />
        </Mirrored>
        <Path d="M100,130 L100,186" stroke={M_LINE} strokeWidth={1.1} opacity={0.8} />
      </G>
    );
  }
  return (
    <G>
      <Path d="M100,64 L124,85 L100,130 L76,85 Z" {...m} />
      <Mirrored>
        <Ellipse cx={140} cy={99} rx={10} ry={12} {...m} />
        <Path d="M104,112 Q130,110 133,128 Q127,160 106,170 Z" {...m} />
        <Ellipse cx={146.5} cy={123} rx={6} ry={16} {...m} />
        <Ellipse cx={153} cy={172} rx={5.5} ry={22} {...m} />
        <Rect x={102} y={166} width={11} height={30} rx={5} {...m} />
        <Ellipse cx={117} cy={214} rx={16} ry={17} {...m} />
        <Ellipse cx={118} cy={268} rx={12} ry={30} {...m} />
        <Ellipse cx={119.5} cy={346} rx={10} ry={26} {...m} />
      </Mirrored>
    </G>
  );
}

const ARTERY = '#E0625A';
const VEIN = '#6B9BE0';

function VesselPaths({ color, dx, width }: { color: string; dx: number; width: number }) {
  const s = { stroke: color, strokeWidth: width, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <G transform={`translate(${dx},0)`}>
      <Path d="M100,72 L100,200" {...s} strokeWidth={width * 1.5} />
      <Mirrored>
        <Path d="M100,72 L104,58 Q108,40 102,20" {...s} />
        <Path d="M104,46 Q114,40 112,26" {...s} strokeWidth={width * 0.6} />
        <Path d="M100,86 Q125,85 140,99 L150,148 L160,206" {...s} />
        <Path d="M150,148 L147,202" {...s} strokeWidth={width * 0.7} />
        <Path d="M160,206 L166,226 M160,206 L160,230" {...s} strokeWidth={width * 0.5} />
        <Path d="M100,200 Q112,212 116,234 L118,300 L119,386 L124,414" {...s} />
        <Path d="M118,300 L112,384" {...s} strokeWidth={width * 0.7} />
        <Path d="M100,118 Q114,122 122,134 M100,142 Q112,146 118,160 M100,166 Q110,170 114,184" {...s} strokeWidth={width * 0.55} />
        <Path d="M116,240 Q124,256 128,276" {...s} strokeWidth={width * 0.5} />
      </Mirrored>
    </G>
  );
}

function Vessels() {
  return (
    <G opacity={0.95}>
      <VesselPaths color={VEIN} dx={2.4} width={1.5} />
      <VesselPaths color={ARTERY} dx={-0.6} width={1.7} />
    </G>
  );
}

const BONE = '#EFE6D2';
const BONE_LINE = '#B9A57E';

function Bones({ view }: { view: BodyView }) {
  const b = { fill: BONE, stroke: BONE_LINE, strokeWidth: 0.8 };
  const line = (w: number) => ({ stroke: BONE, strokeWidth: w, strokeLinecap: 'round' as const, fill: 'none' });
  const vertebrae = [];
  for (let y = 64; y < 200; y += 8.5) vertebrae.push(<Rect key={y} x={96.5} y={y} width={7} height={6.4} rx={2} {...b} />);
  return (
    <G opacity={0.95}>
      <Ellipse cx={100} cy={33} rx={18} ry={21} {...b} />
      {view === 'front' ? (
        <G>
          <Ellipse cx={92.5} cy={36} rx={4.2} ry={3.6} fill="#1A2640" opacity={0.75} />
          <Ellipse cx={107.5} cy={36} rx={4.2} ry={3.6} fill="#1A2640" opacity={0.75} />
          <Path d="M88,48 Q100,62 112,48 L110,56 Q100,64 90,56 Z" {...b} />
        </G>
      ) : null}
      {vertebrae}
      <Mirrored>
        <Path d="M102,85 L134,89" {...line(3.2)} />
        {[92, 101, 110, 119, 128].map((y) => (
          <Path key={y} d={`M103,${y} Q130,${y - 4} 128,${y + 10}`} {...line(2.4)} />
        ))}
        <Path d="M102,190 Q130,186 132,204 Q124,222 104,222 Z" {...b} />
        <Path d="M141,100 L150,146" {...line(4.2)} />
        <Path d="M150,150 L161,201 M147,150 L154,202" {...line(2.6)} />
        <Path d="M152,206 L168,228 M157,206 L163,232" {...line(1.6)} />
        <Path d="M116,224 L118,296" {...line(5.4)} />
        <Circle cx={117.5} cy={308} r={5} {...b} />
        <Path d="M117,318 L117,388 M124,322 L122,386" {...line(3.2)} />
        <Path d="M112,396 L128,414 M116,394 L124,418" {...line(2.2)} />
      </Mirrored>
      {view === 'front' ? <Path d="M100,88 L100,128" {...line(4)} /> : null}
    </G>
  );
}

function Organs({ view }: { view: BodyView }) {
  const o = (fill: string) => ({ fill, stroke: '#F5E3C4', strokeWidth: 0.7, opacity: 0.92 });
  if (view === 'front') {
    return (
      <G>
        <Ellipse cx={100} cy={30} rx={17} ry={15} {...o('#C99AA8')} />
        <Path d="M90,30 Q100,22 110,30 M92,36 Q100,30 108,36" stroke="#F5E3C4" strokeWidth={0.6} fill="none" opacity={0.6} />
        <Path d="M96,64 L96,86 L104,86 L104,64 Z" {...o('#B98C86')} />
        <Path d="M97,86 Q76,84 74,108 Q74,126 92,128 Q97,118 97,100 Z" {...o('#C98B8B')} />
        <Path d="M103,86 Q124,84 126,108 Q126,126 108,128 Q103,118 103,100 Z" {...o('#C98B8B')} />
        <Path d="M100,100 Q114,96 116,108 Q114,120 104,126 Q98,118 100,100 Z" {...o('#D65F58')} />
        <Path d="M68,128 Q86,122 106,130 Q104,146 86,150 Q72,150 68,140 Z" {...o('#9C5B4A')} />
        <Path d="M108,130 Q128,126 130,140 Q128,156 112,156 Q104,148 108,130 Z" {...o('#D8A26A')} />
        <Path d="M78,160 Q100,154 122,160 L124,196 Q100,204 76,196 Z" {...o('#C99A7A')} />
        <Path d="M84,168 Q100,162 116,168 M84,178 Q100,172 116,178 M84,188 Q100,182 116,188" stroke="#F5E3C4" strokeWidth={0.8} fill="none" opacity={0.7} />
        <Ellipse cx={100} cy={212} rx={11} ry={8} {...o('#D9C27A')} />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={100} cy={30} rx={17} ry={15} {...o('#C99AA8')} />
      <Path d="M97,86 Q76,84 74,108 Q74,128 92,132 Q97,118 97,100 Z" {...o('#C98B8B')} />
      <Path d="M103,86 Q124,84 126,108 Q126,128 108,132 Q103,118 103,100 Z" {...o('#C98B8B')} />
      <Path d="M86,148 Q76,150 78,162 Q80,174 90,172 Q86,160 90,152 Z" {...o('#B0644F')} />
      <Path d="M114,148 Q124,150 122,162 Q120,174 110,172 Q114,160 110,152 Z" {...o('#B0644F')} />
      <Path d="M80,178 Q100,172 120,178 L122,198 Q100,204 78,198 Z" {...o('#C99A7A')} opacity={0.6} />
      <Path d="M100,64 L100,200" stroke="#EFE6D2" strokeWidth={4} strokeLinecap="round" opacity={0.55} />
    </G>
  );
}

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
  const dim = layer === 'skin' ? 1 : layer === 'organs' ? 0.38 : 0.55;
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
      <Silhouette palette={palette} dim={dim} />
      {layer === 'skin' ? <SkinDetails view={view} palette={palette} /> : null}
      {layer === 'muscles' ? <Muscles view={view} /> : null}
      {layer === 'vessels' ? <Vessels /> : null}
      {layer === 'bones' ? <Bones view={view} /> : null}
      {layer === 'organs' ? <Organs view={view} /> : null}
      {regions?.map((r) => (
        <RegionShapeView key={r.id} shape={r.shape} fill="none" stroke={palette.highlight} strokeWidth={0.6} strokeDasharray="2 3" opacity={0.45} />
      ))}
      {highlight ? (
        <RegionShapeView shape={highlight.shape} fill={palette.highlight} fillOpacity={0.28} stroke={palette.highlight} strokeWidth={1.4} />
      ) : null}
    </Svg>
  );
}
