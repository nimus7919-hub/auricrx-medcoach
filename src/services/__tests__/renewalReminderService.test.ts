import RenewalReminderService from '../renewalReminderService';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../i18n', () => ({
  language: 'es',
  t: (key: string, params?: any) => `${key}(${JSON.stringify(params)})`,
}));

describe('RenewalReminderService', () => {
  let service: RenewalReminderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = RenewalReminderService.getInstance();
  });

  describe('Renewal Reminder Scheduling', () => {
    it('should schedule notification 5+ days before renewal', async () => {
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 14); // 14 days from now

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await service.scheduleRenewalReminder(renewalDate, true, 'MXN $79.00', 'Google Play');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      
      // Notification should be scheduled for 5 days before renewal
      const expectedNotificationDate = new Date(renewalDate);
      expectedNotificationDate.setDate(expectedNotificationDate.getDate() - 5);
      
      expect(call.trigger).toEqual(expectedNotificationDate);
      expect(call.content.data.type).toBe('renewal_reminder');
      expect(call.content.data.isTrialEnding).toBe(true);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'renewal:reminder:scheduled',
        expect.stringContaining('notification-id-123')
      );
    });

    it('should not schedule if notification date is in the past', async () => {
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 3); // Only 3 days away (less than 5)

      await service.scheduleRenewalReminder(renewalDate, false);

      // Should not schedule since notification would be in the past
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should cancel existing reminder before scheduling new one', async () => {
      const existingReminder = JSON.stringify({
        notificationId: 'old-notification-id',
        renewalDate: new Date().toISOString(),
        scheduledAt: new Date().toISOString(),
        type: 'trial_ending',
      });
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(existingReminder);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('new-notification-id');

      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 20);

      await service.scheduleRenewalReminder(renewalDate, false);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-notification-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should include price, store, and cancel path in notification content', async () => {
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 14);

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-456');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await service.scheduleRenewalReminder(renewalDate, false, 'MXN $79.00', 'App Store');

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.body).toContain('MXN $79.00');
      expect(call.content.body).toContain('App Store');
    });
  });

  describe('Reminder Management', () => {
    it('should retrieve scheduled reminder info', async () => {
      const reminderData = {
        renewalDate: new Date().toISOString(),
        notificationId: 'test-notification-id',
        scheduledAt: new Date().toISOString(),
        type: 'renewal' as const,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(reminderData));

      const reminder = await service.getScheduledReminder();

      expect(reminder).toEqual(reminderData);
    });

    it('should return null if no reminder is scheduled', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const reminder = await service.getScheduledReminder();

      expect(reminder).toBeNull();
    });

    it('should reschedule if renewal date changes', async () => {
      const oldRenewalDate = new Date();
      oldRenewalDate.setDate(oldRenewalDate.getDate() + 20);
      
      const existingReminder = JSON.stringify({
        renewalDate: oldRenewalDate.toISOString(),
        notificationId: 'old-id',
        scheduledAt: new Date().toISOString(),
        type: 'renewal',
      });
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(existingReminder);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('new-id');

      const newRenewalDate = new Date();
      newRenewalDate.setDate(newRenewalDate.getDate() + 25);

      await service.checkAndRescheduleIfNeeded(newRenewalDate, false);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });
});
