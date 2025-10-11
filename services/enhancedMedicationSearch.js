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
      
      // Filter by quantity unit if available
      let filteredMatches = excelMatches;
      if (medication.quantityUnit) {
        const quantityUnit = medication.quantityUnit.toLowerCase();
        console.log(`🔍 Filtering by quantity unit: "${quantityUnit}"`);
        
        filteredMatches = excelMatches.filter(match => {
          const unidades = (match.unidades || '').toLowerCase();
          const medicinas = (match.Medicinas || '').toLowerCase();
          
          // Check if the quantity unit appears in the medication name or units field
          const hasUnitMatch = unidades.includes(quantityUnit) || 
                              medicinas.includes(quantityUnit) ||
                              // Handle common variations
                              (quantityUnit === 'tablet' && (unidades.includes('tab') || medicinas.includes('tab'))) ||
                              (quantityUnit === 'capsule' && (unidades.includes('cap') || medicinas.includes('cap'))) ||
                              (quantityUnit === 'gel cap' && (unidades.includes('gel') || medicinas.includes('gel'))) ||
                              (quantityUnit === 'ml' && (unidades.includes('ml') || medicinas.includes('ml'))) ||
                              (quantityUnit === 'mg' && (unidades.includes('mg') || medicinas.includes('mg')));
          
          return hasUnitMatch;
        });
        
        console.log(`📊 After quantity unit filtering: ${filteredMatches.length} matches`);
      }
      
      // Create enhanced results by combining pharmacy locations with Excel prices
      const enhancedResults = [];
      
      for (const pharmacy of pharmacies) {
        // Find Excel matches for this specific pharmacy with fuzzy matching
        const normalizedPharmacyName = this.excelReader.normalizePharmacyName(pharmacy.name);
        
        // Debug logging for specific pharmacies
        if (pharmacy.name.toLowerCase().includes('guadalajara') || pharmacy.name.toLowerCase().includes('ahorro')) {
          console.log(`🔍 DEBUG ${pharmacy.name}: "${pharmacy.name}" -> "${normalizedPharmacyName}"`);
        }
        
        const pharmacyMatches = filteredMatches.filter(match => {
          const normalizedExcelPharmacy = this.excelReader.normalizePharmacyName(match.Pharmacy);
          
          // Debug logging for specific pharmacies
          if (pharmacy.name.toLowerCase().includes('guadalajara') || pharmacy.name.toLowerCase().includes('ahorro')) {
            console.log(`🔍 DEBUG ${pharmacy.name} Excel: "${match.Pharmacy}" -> "${normalizedExcelPharmacy}"`);
          }
          
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
          
          // Special case: if one name is a subset of the other, but only for specific known cases
          // This handles specific cases like "H-E-B El Mirador" vs "HEB"
          if (normalizedPharmacyName.includes(normalizedExcelPharmacy) || 
              normalizedExcelPharmacy.includes(normalizedPharmacyName)) {
            // Only allow subset matching for very specific known patterns
            const allowedSubsets = [
              { app: 'heb el mirador', excel: 'heb' },
              { app: 'h-e-b el mirador', excel: 'heb' }
              // Removed farmacia guadalajara - let exact matching handle it
            ];
            
            const isAllowedSubset = allowedSubsets.some(pattern => 
              (normalizedPharmacyName.includes(pattern.app) && normalizedExcelPharmacy.includes(pattern.excel)) ||
              (normalizedExcelPharmacy.includes(pattern.app) && normalizedPharmacyName.includes(pattern.excel))
            );
            
            if (isAllowedSubset) {
              return true;
            }
          }
          
          // Require 85% word match for pharmacy names (balanced strictness)
          // This prevents most false matches while allowing legitimate ones like "Farmacia del Ahorro"
          return matchingWords.length >= Math.max(1, pharmacyWords.length * 0.85);
        });
        
        if (pharmacyMatches.length > 0) {
          // Use the first match (since we don't have similarity scores)
          const bestMatch = pharmacyMatches[0];
          
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
