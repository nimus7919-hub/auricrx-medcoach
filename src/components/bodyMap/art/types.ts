/**
 * Compact vector art format for the body pain map.
 * Each path: [fillIndex, strokeIndex, strokeWidth, d] or [fillIndex, strokeIndex, strokeWidth, opacity, d].
 * Indexes point into the `dark` / `light` palettes (same length, -1 = none). Coordinates are in
 * BODY_VIEWBOX units (200 x 440).
 */
export type ArtPath = [number, number, number, string] | [number, number, number, number, string];

export interface ArtLayer {
  dark: string[];
  light: string[];
  p: ArtPath[];
}

export interface SkinArt {
  /** Closed outline of the body surface. */
  outline: string;
  /** Progressively inset outlines, used for soft contour shading. */
  insets: string[];
  /** Surface linework (contours, navel, knees, fingers). */
  lines: string[];
}
