import { authenticatedFetch } from '../src/services/authenticatedFetch';
// services/supplementDataCollector.js
// Supplement data collection service for user contributions

import { auth } from '../src/config/firebase';


class SupplementDataCollector {
  constructor() {
    this.pendingContributions = [];
    this.isProcessing = false;
    this.apiBase = 'https://auricrx-medcoach.onrender.com';
  }

  // Use the signed-in Firebase identity for contributions.
  async getOrCreateUserId() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.uid;
  }

  // Collect supplement price data from user interactions
  async collectSupplementPrice(supplementData) {
    try {
      console.log('📊 Collecting supplement price data:', supplementData);
      
      // Generate a unique user ID for this session
      const userId = await this.getOrCreateUserId();
      
      const contribution = {
        supplementName: supplementData.supplementName || supplementData.name,
        brand: supplementData.brand || null,
        price: parseFloat(supplementData.price) || 0,
        quantity: supplementData.quantity || null,
        storeName: supplementData.storeName,
        storeAddress: supplementData.storeAddress || null,
        pharmacyId: supplementData.pharmacyId || null,
        currency: supplementData.currency || 'USD',
        userLocation: supplementData.userLocation || null,
        userId: userId
      };

      console.log('📊 Sending supplement contribution to server:', contribution);
      console.log('📊 API URL (temporarily using medication endpoint):', `${this.apiBase}/medication-contributions`);

      // Send to server API (temporarily using medication endpoint until supplement endpoint is deployed)
      const response = await authenticatedFetch(`${this.apiBase}/medication-contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicationName: contribution.supplementName, // Map supplement name to medication name
          strength: contribution.dosage || '', // Map dosage to strength
          price: contribution.price,
          quantity: contribution.quantity,
          storeName: contribution.storeName,
          storeAddress: contribution.storeAddress,
          pharmacyId: contribution.pharmacyId,
          userLocation: contribution.userLocation,
          currency: contribution.currency,
          userId: contribution.userId
        })
      });

      console.log('📊 Server response status:', response.status);
      console.log('📊 Server response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📊 Server error response:', errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📊 Server response result:', result);
      
      if (!result.ok) {
        throw new Error(result.message || 'Server returned error');
      }

      console.log('✅ Supplement contribution saved:', result.contribution.id);
      return result.contribution;
      
    } catch (error) {
      console.error('❌ Failed to collect supplement price data:', error);
      throw error;
    }
  }

  // Batch collect multiple supplement prices
  async batchCollectSupplementPrices(supplementDataArray) {
    try {
      console.log(`📊 Batch collecting ${supplementDataArray.length} supplement prices`);
      
      const results = [];
      for (const supplementData of supplementDataArray) {
        try {
          const result = await this.collectSupplementPrice(supplementData);
          results.push(result);
        } catch (error) {
          console.error('❌ Failed to collect individual supplement price:', error);
          results.push({ error: error.message });
        }
      }
      
      console.log(`✅ Batch collection completed: ${results.length} results`);
      return results;
      
    } catch (error) {
      console.error('❌ Failed to batch collect supplement prices:', error);
      throw error;
    }
  }

  // Get collection stats
  getCollectionStats() {
    return {
      pendingContributions: this.pendingContributions.length,
      isProcessing: this.isProcessing
    };
  }
}

export default new SupplementDataCollector();
