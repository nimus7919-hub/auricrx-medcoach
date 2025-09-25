// services/medicationDataCollector.js
// Service for collecting and sending medication price contributions to the server

import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../src/services/authService';

const API_BASE = 'https://auricrx-medcoach.onrender.com';

class MedicationDataCollector {
  constructor() {
    this.apiBase = API_BASE;
  }

  // Get authenticated user ID or create anonymous ID
  async getOrCreateUserId() {
    try {
      // First, try to get authenticated user
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.uid) {
        console.log('🆔 Using authenticated user ID:', currentUser.uid);
        return currentUser.uid;
      }
      
      // Fallback: Try to get existing anonymous user ID from AsyncStorage
      const existingUserId = await AsyncStorage.getItem('auricrx_user_id');
      if (existingUserId) {
        console.log('🆔 Using stored anonymous user ID:', existingUserId);
        return existingUserId;
      }
      
      // Generate a new anonymous user ID
      const userId = 'anonymous_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store it for future use
      await AsyncStorage.setItem('auricrx_user_id', userId);
      
      console.log('🆔 Generated new anonymous user ID:', userId);
      return userId;
    } catch (error) {
      console.error('❌ Failed to get/create user ID:', error);
      // Fallback to a simple timestamp-based ID
      return 'anonymous_' + Date.now();
    }
  }

  // Add a new medication contribution
  async addContribution(contributionData) {
    try {
      // Generate a unique user ID for this session (in a real app, this would come from authentication)
      const userId = await this.getOrCreateUserId();
      
      // Add userId to contribution data
      const contributionWithUserId = {
        ...contributionData,
        userId: userId
      };
      
      console.log('📊 Sending contribution to server:', contributionWithUserId);
      
      const response = await fetch(`${this.apiBase}/medication-contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contributionWithUserId),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Contribution saved to server:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to save contribution to server:', error);
      throw error;
    }
  }

  // Get all contributions from server
  async getContributions(options = {}) {
    try {
      // Get user ID for data isolation
      const userId = await this.getOrCreateUserId();
      
      const params = new URLSearchParams();
      params.append('userId', userId); // Add userId for data isolation
      if (options.search) params.append('search', options.search);
      if (options.medication) params.append('medication', options.medication);
      if (options.store) params.append('store', options.store);
      if (options.verified !== undefined) params.append('verified', options.verified);
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const url = `${this.apiBase}/medication-contributions${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Retrieved contributions from server:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to get contributions from server:', error);
      throw error;
    }
  }

  // Export contributions as CSV
  async exportContributions(format = 'csv') {
    try {
      const response = await fetch(`${this.apiBase}/medication-contributions/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (format === 'csv') {
        const csvText = await response.text();
        return csvText;
      } else {
        const jsonData = await response.json();
        return jsonData;
      }
    } catch (error) {
      console.error('❌ Failed to export contributions:', error);
      throw error;
    }
  }

  // Verify a contribution
  async verifyContribution(contributionId) {
    try {
      const response = await fetch(`${this.apiBase}/medication-contributions/${contributionId}/verify`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Contribution verified:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to verify contribution:', error);
      throw error;
    }
  }

  // Delete a contribution
  async deleteContribution(contributionId) {
    try {
      const response = await fetch(`${this.apiBase}/medication-contributions/${contributionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🗑️ Contribution deleted:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to delete contribution:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const medicationDataCollector = new MedicationDataCollector();
export default medicationDataCollector;
