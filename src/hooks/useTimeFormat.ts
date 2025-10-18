/**
 * Custom hook for managing global time format preferences
 * Provides centralized time format state with AsyncStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeFormat, TIME_FORMATS, TIME_FORMAT_LABELS } from '../utils/time';

const STORAGE_KEY = 'user.timeFormat';

/**
 * Hook for managing global time format preferences
 */
export function useTimeFormat() {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>(TIME_FORMATS.TWELVE_HOUR);
  const [isLoading, setIsLoading] = useState(true);

  // Load time format from storage on mount
  useEffect(() => {
    loadTimeFormat();
  }, []);

  /**
   * Loads the time format preference from AsyncStorage
   */
  const loadTimeFormat = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && Object.values(TIME_FORMATS).includes(stored as TimeFormat)) {
        setTimeFormatState(stored as TimeFormat);
      } else {
        // Default to 12-hour format for new users
        setTimeFormatState(TIME_FORMATS.TWELVE_HOUR);
      }
    } catch (error) {
      console.error('Failed to load time format preference:', error);
      // Default to 12-hour format even on error
      setTimeFormatState(TIME_FORMATS.TWELVE_HOUR);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates the time format preference and persists to storage
   */
  const setTimeFormat = useCallback(async (format: TimeFormat) => {
    try {
      setTimeFormatState(format);
      await AsyncStorage.setItem(STORAGE_KEY, format);
      console.log('Time format preference saved:', format);
    } catch (error) {
      console.error('Failed to save time format preference:', error);
      // Revert state on error to 12-hour default
      setTimeFormatState(TIME_FORMATS.TWELVE_HOUR);
    }
  }, []);

  /**
   * Resets time format to default (12-hour)
   */
  const resetToDefault = useCallback(() => {
    setTimeFormat(TIME_FORMATS.TWELVE_HOUR);
  }, [setTimeFormat]);

  /**
   * Gets the display label for the current time format
   */
  const getTimeFormatLabel = useCallback((format?: TimeFormat) => {
    const formatToUse = format || timeFormat;
    return TIME_FORMAT_LABELS[formatToUse];
  }, [timeFormat]);

  /**
   * Gets all available time format options for UI
   */
  const getTimeFormatOptions = useCallback(() => {
    return Object.entries(TIME_FORMATS).map(([key, value]) => ({
      key,
      value,
      label: TIME_FORMAT_LABELS[value],
    }));
  }, []);

  return {
    timeFormat,
    setTimeFormat,
    resetToDefault,
    getTimeFormatLabel,
    getTimeFormatOptions,
    isLoading,
  };
}
