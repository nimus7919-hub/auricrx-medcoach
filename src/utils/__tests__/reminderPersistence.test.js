const {
  normalizeRemindersPayload,
  mergeReminders,
  shouldPushReminders,
  upsertMedicationFromReminder,
} = require('../reminderPersistence');

describe('reminderPersistence', () => {
  describe('normalizeRemindersPayload', () => {
    it('parses JSON strings and filters invalid rows', () => {
      expect(normalizeRemindersPayload('[{"id":"1","name":"A"},null,{"foo":1}]')).toEqual([
        { id: '1', name: 'A' },
      ]);
      expect(normalizeRemindersPayload(null)).toEqual([]);
      expect(normalizeRemindersPayload({ id: 'x' })).toEqual([]);
    });
  });

  describe('mergeReminders', () => {
    it('restores remote list when local is empty', () => {
      const remote = [{ id: 'r1', name: 'Take med', time: '08:00' }];
      expect(mergeReminders([], remote)).toEqual(remote);
    });

    it('keeps local-only reminders and merges by id', () => {
      const local = [
        { id: '1', name: 'Local', time: '09:00' },
        { id: '2', name: 'Shared local', time: '10:00', updatedAt: '2026-01-01T00:00:00.000Z' },
      ];
      const remote = [
        { id: '2', name: 'Shared remote', time: '11:00', updatedAt: '2026-02-01T00:00:00.000Z' },
        { id: '3', name: 'Remote only', time: '12:00' },
      ];
      const merged = mergeReminders(local, remote);
      expect(merged.find(r => r.id === '1').name).toBe('Local');
      expect(merged.find(r => r.id === '2').name).toBe('Shared remote');
      expect(merged.find(r => r.id === '3').name).toBe('Remote only');
    });
  });

  describe('shouldPushReminders', () => {
    it('blocks push until cloud hydration and blocks empty overwrite of remote', () => {
      expect(shouldPushReminders({ cloudReady: false, reminders: [{ id: 1 }], remoteHadData: false })).toBe(false);
      expect(shouldPushReminders({ cloudReady: true, reminders: [{ id: 1 }], remoteHadData: false })).toBe(true);
      expect(shouldPushReminders({ cloudReady: true, reminders: [], remoteHadData: true })).toBe(false);
      expect(shouldPushReminders({ cloudReady: true, reminders: [], remoteHadData: true, allowEmptyPush: true })).toBe(true);
      expect(shouldPushReminders({ cloudReady: true, reminders: [], remoteHadData: false })).toBe(false);
    });
  });

  describe('upsertMedicationFromReminder', () => {
    it('does not create a stray duplicate for the same reminder or name', () => {
      const existing = [{ id: 'med-1', name: 'Metformin', reminderId: 'rem-1', strength: '500mg' }];
      const byReminder = upsertMedicationFromReminder(existing, {
        id: 'rem-1',
        name: 'Metformin',
        reminderId: 'rem-1',
        strength: '850mg',
        fromReminder: true,
      });
      expect(byReminder).toHaveLength(1);
      expect(byReminder[0].id).toBe('med-1');
      expect(byReminder[0].strength).toBe('850mg');

      const byName = upsertMedicationFromReminder(
        [{ id: 'med-2', name: 'Aspirina', strength: '100mg' }],
        { id: 'rem-9', name: 'aspirina', reminderId: 'rem-9', strength: '100mg', fromReminder: true }
      );
      expect(byName).toHaveLength(1);
      expect(byName[0].id).toBe('med-2');
      expect(byName[0].reminderId).toBe('rem-9');
    });

    it('appends when no matching medication exists', () => {
      const next = upsertMedicationFromReminder([], {
        id: 'rem-3',
        name: 'Ibuprofeno',
        reminderId: 'rem-3',
        fromReminder: true,
      });
      expect(next).toHaveLength(1);
      expect(next[0].name).toBe('Ibuprofeno');
    });
  });
});
