import {
  offerKey,
  parseSnooze,
  parseTimestamp,
  shouldRunCheck,
  shouldShowBanner,
} from '../updateNotice/throttle';
import { UPDATE_NOTICE_CONFIG } from '../../config/updateNotice';

describe('update notice throttling', () => {
  const interval = UPDATE_NOTICE_CONFIG.CHECK_THROTTLE_MS;

  it('runs when there is no previous check', () => {
    expect(shouldRunCheck(null, 1_000, interval)).toBe(true);
    expect(shouldRunCheck(undefined, 1_000, interval)).toBe(true);
  });

  it('does not run again until the 30-minute window has elapsed', () => {
    const last = 1_000_000;
    expect(shouldRunCheck(last, last + interval - 1, interval)).toBe(false);
    expect(shouldRunCheck(last, last + interval, interval)).toBe(true);
    expect(shouldRunCheck(last, last + interval + 5, interval)).toBe(true);
  });

  it('force=true bypasses the throttle (notification tap)', () => {
    const last = 1_000_000;
    expect(shouldRunCheck(last, last + 10, interval, true)).toBe(true);
    expect(shouldRunCheck(last, last + 10, interval, false)).toBe(false);
  });

  it('parses stored timestamps and snooze records', () => {
    expect(parseTimestamp('12345')).toBe(12345);
    expect(parseTimestamp('nope')).toBeNull();
    expect(parseTimestamp(null)).toBeNull();
    expect(parseSnooze(JSON.stringify({ key: 'store:1.2.0', untilMs: 99 }))).toEqual({
      key: 'store:1.2.0',
      untilMs: 99,
    });
    expect(parseSnooze('not-json')).toBeNull();
    expect(parseSnooze('{"key":"x"}')).toBeNull();
  });

  it('hides a snoozed banner until the snooze expires, only for that version', () => {
    const snooze = { key: offerKey('ota', 'abc'), untilMs: 500 };
    expect(shouldShowBanner(snooze, 'ota:abc', 499)).toBe(false);
    expect(shouldShowBanner(snooze, 'ota:abc', 500)).toBe(true);
    expect(shouldShowBanner(snooze, 'store:1.2.0', 100)).toBe(true);
    expect(shouldShowBanner(null, 'ota:abc', 100)).toBe(true);
  });
});
