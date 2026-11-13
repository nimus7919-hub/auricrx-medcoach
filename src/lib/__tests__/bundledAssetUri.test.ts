import {
  bundledAssetCachePath,
  isManipulableImageUri,
  needsBundledAssetMaterialization,
} from '../bundledAssetUri';

describe('bundledAssetUri', () => {
  describe('isManipulableImageUri', () => {
    it('accepts file and data URIs ImageManipulator can open', () => {
      expect(isManipulableImageUri('file:///data/user/0/app/cache/logo.png')).toBe(true);
      expect(isManipulableImageUri('data:image/png;base64,abc')).toBe(true);
    });

    it('rejects Android release drawable resource names and remote/asset schemes', () => {
      expect(isManipulableImageUri('icon_auric')).toBe(false);
      expect(isManipulableImageUri('assets_images_icon_auric')).toBe(false);
      expect(isManipulableImageUri('asset:/icon-auric.png')).toBe(false);
      expect(isManipulableImageUri('http://127.0.0.1:8081/assets/icon.png')).toBe(false);
      expect(isManipulableImageUri(null)).toBe(false);
      expect(isManipulableImageUri(undefined)).toBe(false);
      expect(isManipulableImageUri('')).toBe(false);
    });
  });

  describe('needsBundledAssetMaterialization', () => {
    it('requires a cache copy for release resource names', () => {
      expect(needsBundledAssetMaterialization('icon_auric')).toBe(true);
      expect(needsBundledAssetMaterialization('file:///tmp/logo.png')).toBe(false);
    });
  });

  describe('bundledAssetCachePath', () => {
    it('joins cache directory and file name', () => {
      expect(bundledAssetCachePath('file:///cache/', 'logo.png')).toBe('file:///cache/logo.png');
    });

    it('throws when cache directory is missing', () => {
      expect(() => bundledAssetCachePath(null, 'logo.png')).toThrow(/cacheDirectory/);
      expect(() => bundledAssetCachePath(undefined, 'logo.png')).toThrow(/cacheDirectory/);
    });
  });
});
