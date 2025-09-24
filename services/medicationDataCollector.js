// services/medicationDataCollector.js
// Service to collect and manage user-contributed medication price data

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTRIBUTIONS_KEY = 'AURIC_MEDICATION_CONTRIBUTIONS';
const EXPORT_KEY = 'AURIC_MEDICATION_EXPORT';

// Use the same API base as other services
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://auricrx-medcoach.onrender.com' 
  : 'http://localhost:4000';

class MedicationDataCollector {
  constructor() {
    this.contributions = [];
    this.loadContributions();
  }

  // Load existing contributions from storage
  async loadContributions() {
    try {
      const stored = await AsyncStorage.getItem(CONTRIBUTIONS_KEY);
      if (stored) {
        this.contributions = JSON.parse(stored);
        console.log(`📊 Loaded ${this.contributions.length} existing contributions`);
      }
    } catch (error) {
      console.error('❌ Failed to load contributions:', error);
      this.contributions = [];
    }
  }

  // Save contributions to storage
  async saveContributions() {
    try {
      await AsyncStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(this.contributions));
      console.log(`💾 Saved ${this.contributions.length} contributions to storage`);
    } catch (error) {
      console.error('❌ Failed to save contributions:', error);
    }
  }

  // Add a new contribution
  async addContribution(contributionData) {
    try {
      console.log('📊 Sending contribution to server:', contributionData);

      // Send to server
      const response = await fetch(`${API_BASE}/medication-contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contributionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      const result = await response.json();
      const contribution = result.contribution;

      // Also save locally as backup
      this.contributions.push(contribution);
      await this.saveContributions();
      
      console.log('✅ New contribution saved to server:', contribution);
      return contribution;
    } catch (error) {
      console.error('❌ Failed to add contribution to server:', error);
      
      // Fallback to local storage if server fails
      try {
        const contribution = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          medicationName: contributionData.medicationName || '',
          strength: contributionData.strength || '',
          price: parseFloat(contributionData.price) || 0,
          quantity: contributionData.quantity || '',
          storeName: contributionData.storeName || '',
          storeAddress: contributionData.storeAddress || '',
          pharmacyId: contributionData.pharmacyId || '',
          userLocation: contributionData.userLocation || null,
          currency: contributionData.currency || 'USD',
          verified: false,
          source: 'user_contribution'
        };

        this.contributions.push(contribution);
        await this.saveContributions();
        
        console.log('⚠️ Saved locally as fallback:', contribution);
        return contribution;
      } catch (fallbackError) {
        console.error('❌ Fallback save also failed:', fallbackError);
        throw error;
      }
    }
  }

  // Get all contributions from server
  async getAllContributions() {
    try {
      console.log('📊 Fetching contributions from server...');
      
      const response = await fetch(`${API_BASE}/medication-contributions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from server');
      }

      const result = await response.json();
      this.contributions = result.contributions || [];
      
      console.log(`✅ Fetched ${this.contributions.length} contributions from server`);
      return this.contributions;
    } catch (error) {
      console.error('❌ Failed to fetch from server, using local data:', error);
      return this.contributions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  }

  // Get contributions with server-side filtering
  async getContributions(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.medication) queryParams.append('medication', filters.medication);
      if (filters.store) queryParams.append('store', filters.store);
      if (filters.verified !== undefined) queryParams.append('verified', filters.verified);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.offset) queryParams.append('offset', filters.offset);

      const url = `${API_BASE}/medication-contributions?${queryParams.toString()}`;
      console.log('📊 Fetching filtered contributions:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch filtered data from server');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch filtered data, using local data:', error);
      return {
        contributions: this.contributions,
        statistics: this.getStatistics(),
        pagination: { total: this.contributions.length }
      };
    }
  }

  // Get contributions by medication name
  getContributionsByMedication(medicationName) {
    const normalizedName = medicationName.toLowerCase().trim();
    return this.contributions.filter(contrib => 
      contrib.medicationName.toLowerCase().includes(normalizedName)
    );
  }

  // Get contributions by store
  getContributionsByStore(storeName) {
    const normalizedStore = storeName.toLowerCase().trim();
    return this.contributions.filter(contrib => 
      contrib.storeName.toLowerCase().includes(normalizedStore)
    );
  }

  // Get statistics
  getStatistics() {
    const total = this.contributions.length;
    const medications = [...new Set(this.contributions.map(c => c.medicationName))].length;
    const stores = [...new Set(this.contributions.map(c => c.storeName))].length;
    const verified = this.contributions.filter(c => c.verified).length;
    
    return {
      totalContributions: total,
      uniqueMedications: medications,
      uniqueStores: stores,
      verifiedContributions: verified,
      averagePrice: total > 0 ? this.contributions.reduce((sum, c) => sum + c.price, 0) / total : 0
    };
  }

  // Export to CSV format (for Excel compatibility)
  exportToCSV() {
    if (this.contributions.length === 0) {
      return 'No contributions to export';
    }

    const headers = [
      'ID',
      'Timestamp',
      'Medication Name',
      'Strength/Dosage',
      'Price',
      'Quantity',
      'Store Name',
      'Store Address',
      'Currency',
      'Verified',
      'Source'
    ];

    const rows = this.contributions.map(contrib => [
      contrib.id,
      contrib.timestamp,
      `"${contrib.medicationName}"`,
      `"${contrib.strength}"`,
      contrib.price,
      `"${contrib.quantity}"`,
      `"${contrib.storeName}"`,
      `"${contrib.storeAddress}"`,
      contrib.currency,
      contrib.verified ? 'Yes' : 'No',
      contrib.source
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return csvContent;
  }

  // Export to JSON format
  exportToJSON() {
    return JSON.stringify(this.contributions, null, 2);
  }

  // Clear all contributions (admin function)
  async clearAllContributions() {
    try {
      this.contributions = [];
      await AsyncStorage.removeItem(CONTRIBUTIONS_KEY);
      console.log('🗑️ All contributions cleared');
    } catch (error) {
      console.error('❌ Failed to clear contributions:', error);
    }
  }

  // Mark contribution as verified
  async verifyContribution(contributionId) {
    try {
      const contrib = this.contributions.find(c => c.id === contributionId);
      if (contrib) {
        contrib.verified = true;
        await this.saveContributions();
        console.log(`✅ Contribution ${contributionId} marked as verified`);
      }
    } catch (error) {
      console.error('❌ Failed to verify contribution:', error);
    }
  }

  // Delete a contribution
  async deleteContribution(contributionId) {
    try {
      this.contributions = this.contributions.filter(c => c.id !== contributionId);
      await this.saveContributions();
      console.log(`🗑️ Contribution ${contributionId} deleted`);
    } catch (error) {
      console.error('❌ Failed to delete contribution:', error);
    }
  }
}

// Create singleton instance
const medicationDataCollector = new MedicationDataCollector();

export default medicationDataCollector;
