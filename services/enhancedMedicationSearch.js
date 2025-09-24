// services/enhancedMedicationSearch.js
// Enhanced medication search using Excel data

const ExcelReader = require('./excelReaderRNCompatible');

class EnhancedMedicationSearch {
  constructor() {
    this.excelReader = new ExcelReader();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Search for medication prices using Excel data
  async searchMedicationPrices(pharmacies, medication, options = {}) {
    try {
      console.log('🔍 Enhanced medication search for:', medication.name);
      
      // Get Excel medication data
      const excelMedications = await this.excelReader.getMedicationData();
      
      // Search for matching medications in Excel
      const excelMatches = await this.excelReader.searchMedications(medication.name);
      
      console.log(`📊 Found ${excelMatches.length} Excel matches for "${medication.name}"`);
      
      // Create enhanced results by combining pharmacy locations with Excel prices
      const enhancedResults = [];
      
      for (const pharmacy of pharmacies) {
        // Find Excel matches for this specific pharmacy with fuzzy matching
        const normalizedPharmacyName = this.excelReader.normalizePharmacyName(pharmacy.name);
        const pharmacyMatches = excelMatches.filter(match => {
          const normalizedExcelPharmacy = this.excelReader.normalizePharmacyName(match.Pharmacy);
          
          // Exact match
          if (normalizedExcelPharmacy === normalizedPharmacyName) {
            return true;
          }
          
          // Fuzzy match for variations (e.g., "H-E-B El Mirador" vs "HEB")
          const pharmacyWords = normalizedPharmacyName.split(' ').filter(w => w.length > 1);
          const excelWords = normalizedExcelPharmacy.split(' ').filter(w => w.length > 1);
          
          // Check if any significant words match
          const matchingWords = pharmacyWords.filter(pWord => 
            excelWords.some(eWord => eWord.includes(pWord) || pWord.includes(eWord))
          );
          
          // Special case: if one name is a subset of the other, consider it a match
          if (normalizedPharmacyName.includes(normalizedExcelPharmacy) || 
              normalizedExcelPharmacy.includes(normalizedPharmacyName)) {
            return true;
          }
          
          // If at least 30% of words match (reduced from 50%), consider it a match
          return matchingWords.length >= Math.max(1, pharmacyWords.length * 0.3);
        });
        
        if (pharmacyMatches.length > 0) {
          // Use the best match (highest similarity)
          const bestMatch = pharmacyMatches.reduce((best, current) => 
            current.similarity > best.similarity ? current : best
          );
          
          // Log what we found for debugging
          console.log(`🔍 Found ${pharmacyMatches.length} Excel matches for ${pharmacy.name}: ${bestMatch.Medicinas} - MXN ${bestMatch['original price']}`);
          
          // Convert MXN price to target currency if needed
          let finalPrice = bestMatch['original price'];
          if (options.currency && options.currency !== 'MXN') {
            finalPrice = await this.convertCurrency(finalPrice, 'MXN', options.currency);
          }
          
          enhancedResults.push({
            ...pharmacy,
            price: finalPrice,
            pickup: true,
            delivery: Math.random() > 0.5, // Random for now
            requiresCoupon: Math.random() > 0.8, // Random for now
            excelMatch: {
              medicinas: bestMatch.Medicinas,
              precioOriginal: bestMatch['original price'],
              unidades: bestMatch.unidades,
              similarity: bestMatch.similarity
            }
          });
        } else {
          // Debug: Log why no matches were found
          console.log(`🔍 No Excel matches for ${pharmacy.name} (normalized: "${normalizedPharmacyName}")`);
          const sampleExcelPharmacies = [...new Set(excelMatches.slice(0, 10).map(m => m.Pharmacy))];
          console.log(`🔍 Sample Excel pharmacies: ${sampleExcelPharmacies.join(', ')}`);
          // No Excel match found - show "Price not available"
          enhancedResults.push({
            ...pharmacy,
            price: null, // No price available
            priceNotAvailable: true,
            pickup: true,
            delivery: Math.random() > 0.5,
            requiresCoupon: Math.random() > 0.8
          });
        }
      }
      
      // Sort by price (lowest first)
      enhancedResults.sort((a, b) => (a.price || 0) - (b.price || 0));
      
      console.log(`✅ Enhanced search completed: ${enhancedResults.length} results`);
      
      return {
        prices: enhancedResults,
        meta: {
          currency: options.currency || 'MXN',
          excelMatches: excelMatches.length,
          totalPharmacies: pharmacies.length
        }
      };
      
    } catch (error) {
      console.error('❌ Enhanced medication search failed:', error);
      
      // Fallback to "Price not available"
      return {
        prices: pharmacies.map((pharmacy) => ({
          ...pharmacy,
          price: null, // No price available
          priceNotAvailable: true,
          pickup: true,
          delivery: Math.random() > 0.5,
          requiresCoupon: Math.random() > 0.8
        }))
      };
    }
  }

  // REMOVED: Mock price generation to prevent misleading data

  // Convert currency (simplified - in real app, use real exchange rates)
  async convertCurrency(amount, from, to) {
    if (from === to) return amount;
    
    // Simple conversion rates (in real app, fetch from API)
    const rates = {
      'MXN': { 'USD': 0.05, 'EUR': 0.045, 'CAD': 0.07 },
      'USD': { 'MXN': 20, 'EUR': 0.9, 'CAD': 1.4 },
      'EUR': { 'MXN': 22, 'USD': 1.1, 'CAD': 1.5 },
      'CAD': { 'MXN': 14, 'USD': 0.7, 'EUR': 0.65 }
    };
    
    const rate = rates[from]?.[to] || 1;
    return Math.round(amount * rate * 100) / 100;
  }

  // Get all available pharmacies from Excel
  async getExcelPharmacies() {
    try {
      return await this.excelReader.getPharmacies();
    } catch (error) {
      console.error('❌ Failed to get Excel pharmacies:', error);
      return [];
    }
  }

  // Search for specific medication in Excel
  async searchExcelMedication(medicationName) {
    try {
      return await this.excelReader.searchMedications(medicationName);
    } catch (error) {
      console.error('❌ Failed to search Excel medication:', error);
      return [];
    }
  }

  // Get medication statistics
  async getMedicationStats() {
    try {
      const medications = await this.excelReader.getMedicationData();
      const prices = medications.map(m => m.precioOriginal).filter(p => p > 0);
      
      return {
        totalMedications: medications.length,
        totalPharmacies: new Set(medications.map(m => m.farmacia)).size,
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      };
    } catch (error) {
      console.error('❌ Failed to get medication stats:', error);
      return {
        totalMedications: 0,
        totalPharmacies: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 }
      };
    }
  }
}

module.exports = EnhancedMedicationSearch;
