import {
  DASHBOARD_FEATURE_ICON_MAP,
  DASHBOARD_FEATURE_BADGE_SIZE,
  DASHBOARD_FEATURE_GLYPH_SIZE,
  FEATURE_ICON_GOLD,
} from '../DashboardFeatureIcon';

const EXPECTED_FEATURES = [
  'smartAlerts',
  'healthAnalytics',
  'appointments',
  'aiHealth',
  'documents',
  'familyCircle',
  'preventionPlanner',
  'labOrganizer',
  'dailyHabits',
];

describe('DashboardFeatureIcon map', () => {
  it('covers all nine home dashboard feature cards', () => {
    expect(Object.keys(DASHBOARD_FEATURE_ICON_MAP).sort()).toEqual([...EXPECTED_FEATURES].sort());
  });

  it('uses outline/line glyph names only (no filled emoji)', () => {
    Object.values(DASHBOARD_FEATURE_ICON_MAP).forEach(({ name }) => {
      expect(name).toMatch(/outline$|check-outline$/);
      expect(name).not.toMatch(/emoji/i);
    });
  });

  it('maps family/prevention/lab/habits to the requested meanings', () => {
    expect(DASHBOARD_FEATURE_ICON_MAP.familyCircle).toEqual({ set: 'ion', name: 'people-outline' });
    expect(DASHBOARD_FEATURE_ICON_MAP.preventionPlanner).toEqual({
      set: 'ion',
      name: 'shield-checkmark-outline',
    });
    expect(DASHBOARD_FEATURE_ICON_MAP.labOrganizer).toEqual({ set: 'mci', name: 'flask-outline' });
    expect(DASHBOARD_FEATURE_ICON_MAP.dailyHabits).toEqual({
      set: 'mci',
      name: 'calendar-check-outline',
    });
  });

  it('keeps the circular badge in the 48–56dp range with brand gold', () => {
    expect(DASHBOARD_FEATURE_BADGE_SIZE).toBeGreaterThanOrEqual(48);
    expect(DASHBOARD_FEATURE_BADGE_SIZE).toBeLessThanOrEqual(56);
    expect(DASHBOARD_FEATURE_GLYPH_SIZE).toBeLessThan(DASHBOARD_FEATURE_BADGE_SIZE);
    expect(FEATURE_ICON_GOLD.toLowerCase()).toBe('#d4af37');
  });
});
