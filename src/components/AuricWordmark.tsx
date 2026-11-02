import React, { useId } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Rect, ClipPath, G } from 'react-native-svg';
// Shared by the static mark and the animated capsule landing frame.
export const WORDMARK = { width: 440, height: 128 };
// At y=81 the inner legs are x=28.74 and x=66.62. Rounded caps
// touch their sloping edges tangentially, without crossing either leg.
export const CROSSBAR = { x: 28.27, y: 74, width: 38.79, height: 14 };

/** Fixed vector geometry keeps the capsule entirely within the A's inner legs. */
export default function AuricWordmark({ hidePill = false, pillOnly = false }: { hidePill?: boolean; pillOnly?: boolean }) {
  const id = useId().replace(/:/g, '');
  return <Svg width="100%" height="100%" viewBox={pillOnly ? `${CROSSBAR.x} ${CROSSBAR.y} ${CROSSBAR.width} ${CROSSBAR.height}` : "0 0 440 128"} accessibilityLabel="AURIC" accessibilityRole="image">
    <Defs>
      <LinearGradient id={`${id}gold`} x1="0%" y1="0%" x2="18%" y2="100%">
        <Stop offset="0" stopColor="#FFF0BE"/><Stop offset="0.22" stopColor="#EFC77F"/><Stop offset="0.43" stopColor="#FFE3A0"/><Stop offset="0.58" stopColor="#C18B3D"/><Stop offset="0.8" stopColor="#E5B562"/><Stop offset="1" stopColor="#946025"/>
      </LinearGradient>
      <LinearGradient id={`${id}pill`} x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0" stopColor="#FFF1B4"/><Stop offset="0.3" stopColor="#F8D67B"/><Stop offset="0.58" stopColor="#DEAB45"/><Stop offset="1" stopColor="#AA7529"/>
      </LinearGradient>
      <LinearGradient id={`${id}white`} x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0" stopColor="#FFFFFF"/><Stop offset="0.45" stopColor="#FFFEF8"/><Stop offset="1" stopColor="#CBC9C0"/>
      </LinearGradient>
      <LinearGradient id={`${id}gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7"/><Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0"/><Stop offset="1" stopColor="#241A0B" stopOpacity="0.16"/>
      </LinearGradient>
      <ClipPath id={`${id}clip`}><Rect x={CROSSBAR.x} y={CROSSBAR.y} width={CROSSBAR.width} height={CROSSBAR.height} rx={CROSSBAR.height / 2}/></ClipPath>
    </Defs>
    {!pillOnly && <G fill={`url(#${id}gold)`}>
      <Path d="M52 4 L94 110 Q97 120 105 120 L105 122 L69 122 L69 120 Q80 120 77 110 L48 29 L18 110 Q14 120 27 120 L27 122 L0 122 L0 120 Q10 120 15 108 Z"/>
      <Path d="M109 18 H147 V20 Q135 20 135 29 V88 Q135 119 163 119 Q190 119 190 87 V29 Q190 20 177 20 V18 H206 V20 Q194 20 194 29 V87 Q194 124 159 124 Q120 124 120 88 V29 Q120 20 109 20 Z"/>
      <Path fillRule="evenodd" d="M211 18 H255 Q287 18 287 44 Q287 65 263 70 L290 110 Q297 121 305 120 V122 H281 L247 72 H237 V111 Q237 120 249 120 V122 H211 V120 Q223 120 223 111 V29 Q223 20 211 20 Z M237 22 V68 H250 Q272 68 272 45 Q272 22 250 22 Z"/>
      <Path d="M304 18 H343 V20 Q331 20 331 29 V111 Q331 120 343 120 V122 H304 V120 Q316 120 316 111 V29 Q316 20 304 20 Z"/>
      <Path d="M435 19 V45 H433 Q423 21 399 21 Q364 21 364 69 Q364 119 400 119 Q423 119 438 98 L440 100 Q425 125 397 125 Q348 125 348 72 Q348 17 399 17 Q420 17 429 24 Z"/>
    </G>}
    {!hidePill && <G clipPath={`url(#${id}clip)`}>
      <Rect x={CROSSBAR.x} y={CROSSBAR.y} width={CROSSBAR.width} height={CROSSBAR.height} fill={`url(#${id}pill)`}/>
      <Rect x={CROSSBAR.x + CROSSBAR.width / 2} y={CROSSBAR.y} width={CROSSBAR.width / 2} height={CROSSBAR.height} fill={`url(#${id}white)`}/>
      <Rect x={CROSSBAR.x} y={CROSSBAR.y} width={CROSSBAR.width} height={CROSSBAR.height} fill={`url(#${id}gloss)`}/>
      <Path d="M29 83 Q30 87.5 35.27 87.5 H60.06 Q65.5 87.5 66.3 83" fill="none" stroke="#33230E" strokeOpacity="0.18" strokeWidth="1"/>
      <Rect x={CROSSBAR.x + 0.6} y={CROSSBAR.y + 0.6} width={CROSSBAR.width - 1.2} height={CROSSBAR.height - 1.2} rx="6.4" fill="none" stroke="#FFF6D4" strokeOpacity="0.45" strokeWidth="0.6"/>
    </G>}
  </Svg>;
}
