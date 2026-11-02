// Crash Logger Utility
// Logs crashes and errors to AsyncStorage for debugging

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CRASH_LOG_KEY = 'AURIC_CRASH_LOGS';
const MAX_LOGS = 50; // Keep last 50 crash logs

class CrashLogger {
  static async logError(error, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      const errorInfo = {
        timestamp,
        message: error?.message || String(error),
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown',
        context,
        platform: Platform?.OS || 'unknown',
      };

      console.error('💥 CRASH LOG:', errorInfo);

      // Get existing logs
      const existingLogs = await this.getLogs();
      const newLogs = [errorInfo, ...existingLogs].slice(0, MAX_LOGS);

      // Save to storage
      await AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(newLogs));

      return errorInfo;
    } catch (e) {
      console.error('Failed to log crash:', e);
    }
  }

  static async logUnhandledRejection(reason, promise) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    return this.logError(error, {
      type: 'unhandled_rejection',
      reason: String(reason),
    });
  }

  static async logUnhandledError(error, isFatal = false) {
    return this.logError(error, {
      type: 'unhandled_error',
      isFatal,
    });
  }

  static async getLogs() {
    try {
      const logsJson = await AsyncStorage.getItem(CRASH_LOG_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (e) {
      console.error('Failed to get crash logs:', e);
      return [];
    }
  }

  static async clearLogs() {
    try {
      await AsyncStorage.removeItem(CRASH_LOG_KEY);
    } catch (e) {
      console.error('Failed to clear crash logs:', e);
    }
  }

  static async getAllLogsAsString() {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

export default CrashLogger;

