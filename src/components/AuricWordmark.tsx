import React, { useId } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Rect, ClipPath, G } from 'react-native-svg';
import { vip } from '../theme/vip';

/** Fixed vector geometry keeps the capsule entirely within the A's inner legs. */
export default function AuricWordmark({ hidePill = false, pillOnly = false }: { hidePill?: boolean; pillOnly?: boolean }) {
  const id = useId().replace(/:/g, '');
  return <Svg width="100%" height="100%" viewBox={pillOnly ? "26.5 81 42.25 12" : "0 0 440 128"} accessibilityLabel="AURIC" accessibilityRole="image">
    <Defs>
      <LinearGradient id={`${id}gold`} x1="0" y1="0" x2="0.15" y2="1">
        <Stop offset="0" stopColor={vip.colors.goldLight}/><Stop offset="0.6" stopColor={vip.colors.gold}/><Stop offset="1" stopColor={vip.colors.goldDark}/>
      </LinearGradient>
      <LinearGradient id={`${id}pill`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF1BB"/><Stop offset="0.5" stopColor="#EAC865"/><Stop offset="1" stopColor="#C69A3F"/>
      </LinearGradient>
      <ClipPath id={`${id}clip`}><Rect x="26.5" y="81" width="42.25" height="12" rx="6"/></ClipPath>
    </Defs>
    {!pillOnly && <G fill={`url(#${id}gold)`}>
      <Path d="M52 4 L94 110 Q97 120 105 120 L105 122 L69 122 L69 120 Q80 120 77 110 L48 29 L18 110 Q14 120 27 120 L27 122 L0 122 L0 120 Q10 120 15 108 Z"/>
      <Path d="M109 18 H147 V20 Q135 20 135 29 V88 Q135 119 163 119 Q190 119 190 87 V29 Q190 20 177 20 V18 H206 V20 Q194 20 194 29 V87 Q194 124 159 124 Q120 124 120 88 V29 Q120 20 109 20 Z"/>
      <Path fillRule="evenodd" d="M211 18 H255 Q287 18 287 44 Q287 65 263 70 L290 110 Q297 121 305 120 V122 H281 L247 72 H237 V111 Q237 120 249 120 V122 H211 V120 Q223 120 223 111 V29 Q223 20 211 20 Z M237 22 V68 H250 Q272 68 272 45 Q272 22 250 22 Z"/>
      <Path d="M304 18 H343 V20 Q331 20 331 29 V111 Q331 120 343 120 V122 H304 V120 Q316 120 316 111 V29 Q316 20 304 20 Z"/>
      <Path d="M435 19 V45 H433 Q423 21 399 21 Q364 21 364 69 Q364 119 400 119 Q423 119 438 98 L440 100 Q425 125 397 125 Q348 125 348 72 Q348 17 399 17 Q420 17 429 24 Z"/>
    </G>}
    {!hidePill && <G clipPath={`url(#${id}clip)`}><Rect x="26.5" y="81" width="42.25" height="12" fill={`url(#${id}pill)`}/><Rect x="47.625" y="81" width="21.125" height="12" fill="#FFF9E9"/></G>}
  </Svg>;
}
