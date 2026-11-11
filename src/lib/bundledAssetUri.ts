/**
 * Helpers for turning Metro/React Native bundled image assets into URIs that
 * native image tools (expo-image-manipulator, FileSystem reads) can open.
 *
 * On Android release/preview builds, Image.resolveAssetSource and even
 * Asset.localUri frequently return a drawable resource name
 * (e.g. "icon_auric" or "assets_images_icon_auric") instead of file:// or http.
 * ImageManipulator only accepts local file or data URIs, so those names must be
 * copied into the cache directory first.
 */

export function isManipulableImageUri(uri: string | null | undefined): boolean {
  return !!uri && /^(file|data):/i.test(uri);
}

export function needsBundledAssetMaterialization(uri: string | null | undefined): boolean {
  return !isManipulableImageUri(uri);
}

export function bundledAssetCachePath(
  cacheDirectory: string | null | undefined,
  fileName: string,
): string {
  if (!cacheDirectory) {
    throw new Error('FileSystem.cacheDirectory is unavailable');
  }
  return `${cacheDirectory}${fileName}`;
}
