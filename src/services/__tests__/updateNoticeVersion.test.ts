import { compareVersions, isRemoteNewer, parseVersionParts } from '../updateNotice/versionCompare';
import { isStoreUpdateAvailable } from '../updateNotice/storeVersion';

describe('version comparison', () => {
  it('parses dotted versions and ignores pre-release suffixes', () => {
    expect(parseVersionParts('1.1.0')).toEqual([1, 1, 0]);
    expect(parseVersionParts(' 1.2 ')).toEqual([1, 2]);
    expect(parseVersionParts('1.1.0-ota.3')).toEqual([1, 1, 0]);
    expect(parseVersionParts('1.1.0+17')).toEqual([1, 1, 0]);
    expect(parseVersionParts('')).toBeNull();
    expect(parseVersionParts(null)).toBeNull();
    expect(parseVersionParts('not-a-version')).toBeNull();
  });

  it('compares major.minor.patch numerically', () => {
    expect(compareVersions('1.0.0', '1.1.0')).toBeLessThan(0);
    expect(compareVersions('1.1.0', '1.1.0')).toBe(0);
    expect(compareVersions('1.2.1', '1.2.0')).toBeGreaterThan(0);
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('2.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareVersions('1.1', '1.1.0')).toBe(0);
    expect(compareVersions('1.1.0', 'bogus')).toBeNull();
  });

  it('treats a remote version as newer only when it is strictly ahead', () => {
    expect(isRemoteNewer('1.1.0', '1.2.0')).toBe(true);
    expect(isRemoteNewer('1.1.0', '1.1.0')).toBe(false);
    expect(isRemoteNewer('1.2.0', '1.1.9')).toBe(false);
    expect(isRemoteNewer('1.1.0', null)).toBe(false);
    expect(isRemoteNewer(undefined, '1.2.0')).toBe(false);
  });

  it('detects a store update from the latest-version payload', () => {
    expect(isStoreUpdateAvailable('1.0.0', { latestVersion: '1.1.0', source: 'env' })).toBe(true);
    expect(isStoreUpdateAvailable('1.1.0', { latestVersion: '1.1.0', source: 'api' })).toBe(false);
    expect(isStoreUpdateAvailable('1.1.0', null)).toBe(false);
  });
});
