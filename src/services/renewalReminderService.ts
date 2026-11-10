import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const STORAGE_KEY = 'renewal:reminder:scheduled';
const REMINDER_DAYS_BEFORE = 5; // F10: At least 5 days before renewal

interface RenewalReminder {
  renewalDate: string;
  notificationId: string;
  scheduledAt: string;
  type: 'trial_ending' | 'renewal';
}

class RenewalReminderService {
  private static instance: RenewalReminderService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new RenewalReminderService();
    }
    return this.instance;
  }

  /**
   * Schedule renewal reminder notification
   * F10: LFPC art. 76 Bis VIII - at least 5 days before renewal
   * 
   * @param renewalDate - Date when subscription renews
   * @param isTrialEnding - Whether this is trial ending (vs regular renewal)
   * @param price - Subscription price (e.g., "MXN $79.00")
   * @param store - Store name (e.g., "Google Play", "App Store")
   */
  async scheduleRenewalReminder(
    renewalDate: Date,
    isTrialEnding: boolean,
    price: string = 'MXN $79.00',
    store: string = 'Google Play'
  ): Promise<void> {
    try {
      // Calculate notification date: 5 days before renewal
      const notificationDate = new Date(renewalDate);
      notificationDate.setDate(notificationDate.getDate() - REMINDER_DAYS_BEFORE);

      // Don't schedule if notification date is in the past
      if (notificationDate <= new Date()) {
        console.log('Renewal reminder date is in the past, skipping');
        return;
      }

      // Cancel any existing reminder
      await this.cancelRenewalReminder();

      // Get localized reminder text
      const locale = i18n.language || 'es';
      const renewalDateStr = renewalDate.toLocaleDateString(locale);
      const cancelPath = store === 'App Store' ? 'App Store > Subscriptions' : 'Google Play > Subscriptions';

      const title = isTrialEnding 
        ? i18n.t('renewalNotices.trialEnding', { 
            date: renewalDateStr, 
            price, 
            store,
            link: cancelPath,
            lng: locale 
          }).split('.')[0] // Just the first sentence for title
        : i18n.t('renewalNotices.renewal', { 
            date: renewalDateStr, 
            price,
            link: cancelPath,
            lng: locale 
          }).split('.')[0];

      const body = isTrialEnding
        ? i18n.t('renewalNotices.trialEnding', { 
            date: renewalDateStr, 
            price, 
            store,
            link: cancelPath,
            lng: locale 
          })
        : i18n.t('renewalNotices.renewal', { 
            date: renewalDateStr, 
            price,
            link: cancelPath,
            lng: locale 
          });

      // Schedule notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'renewal_reminder',
            renewalDate: renewalDate.toISOString(),
            isTrialEnding 
          },
        },
        trigger: {
          type: 'date',
          date: notificationDate,
        } as Notifications.NotificationTriggerInput,
      });

      // Store reminder info
      const reminder: RenewalReminder = {
        renewalDate: renewalDate.toISOString(),
        notificationId,
        scheduledAt: new Date().toISOString(),
        type: isTrialEnding ? 'trial_ending' : 'renewal',
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminder));

      console.log(`Renewal reminder scheduled for ${notificationDate.toISOString()}`);
    } catch (error) {
      console.error('Error scheduling renewal reminder:', error);
    }
  }

  /**
   * Cancel existing renewal reminder
   */
  async cancelRenewalReminder(): Promise<void> {
    try {
      const existingReminderJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (existingReminderJson) {
        const existingReminder: RenewalReminder = JSON.parse(existingReminderJson);
        await Notifications.cancelScheduledNotificationAsync(existingReminder.notificationId);
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('Cancelled existing renewal reminder');
      }
    } catch (error) {
      console.error('Error cancelling renewal reminder:', error);
    }
  }

  /**
   * Get current scheduled reminder
   */
  async getScheduledReminder(): Promise<RenewalReminder | null> {
    try {
      const reminderJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (reminderJson) {
        return JSON.parse(reminderJson);
      }
      return null;
    } catch (error) {
      console.error('Error getting scheduled reminder:', error);
      return null;
    }
  }

  /**
   * Check if reminder needs rescheduling (e.g., after app update or date change)
   */
  async checkAndRescheduleIfNeeded(
    currentRenewalDate: Date,
    isTrialEnding: boolean,
    price: string = 'MXN $79.00',
    store: string = 'Google Play'
  ): Promise<void> {
    const existingReminder = await this.getScheduledReminder();
    
    if (!existingReminder) {
      // No reminder scheduled, schedule one
      await this.scheduleRenewalReminder(currentRenewalDate, isTrialEnding, price, store);
      return;
    }

    const existingRenewalDate = new Date(existingReminder.renewalDate);
    
    // If renewal date has changed, reschedule
    if (existingRenewalDate.getTime() !== currentRenewalDate.getTime()) {
      console.log('Renewal date changed, rescheduling reminder');
      await this.scheduleRenewalReminder(currentRenewalDate, isTrialEnding, price, store);
    }
  }
}

export default RenewalReminderService;
