import * as fs from 'fs';
import * as path from 'path';
import {
  computeUpdateNoticeEnabled,
  isUpdateNoticeEnabled,
  UPDATE_NOTICE_CONFIG,
  UPDATE_NOTICE_FLAG_ENV,
} from '../../config/updateNotice';

describe('update notice feature flag', () => {
  it('is OFF when the flag env is missing or not truthy', () => {
    expect(computeUpdateNoticeEnabled({})).toBe(false);
    expect(computeUpdateNoticeEnabled({ flag: undefined })).toBe(false);
    expect(computeUpdateNoticeEnabled({ flag: 'false' })).toBe(false);
    expect(computeUpdateNoticeEnabled({ flag: 'yes' })).toBe(false);
    expect(computeUpdateNoticeEnabled({ flag: '' })).toBe(false);
    expect(computeUpdateNoticeEnabled({ flag: 'TRUE' })).toBe(false);
  });

  it('turns on only with an explicit true or 1', () => {
    expect(computeUpdateNoticeEnabled({ flag: 'true' })).toBe(true);
    expect(computeUpdateNoticeEnabled({ flag: '1' })).toBe(true);
  });

  it('reads OFF from the real environment by default', () => {
    expect(process.env.EXPO_PUBLIC_FEATURE_UPDATE_NOTICE).toBeUndefined();
    expect(isUpdateNoticeEnabled()).toBe(false);
  });

  it('uses a 30-minute check throttle', () => {
    expect(UPDATE_NOTICE_FLAG_ENV).toBe('EXPO_PUBLIC_FEATURE_UPDATE_NOTICE');
    expect(UPDATE_NOTICE_CONFIG.CHECK_THROTTLE_MS).toBe(30 * 60 * 1000);
  });

  it('the app providers mount the host (the host no-ops when the flag is off)', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../providers/AppProviders.js'), 'utf8');
    expect(src).toMatch(/import UpdateNoticeHost from '\.\/UpdateNoticeHost'/);
    expect(src).toMatch(/<UpdateNoticeHost\s*\/>/);
  });
});
