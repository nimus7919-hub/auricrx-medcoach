// services/enhancedMedicationSearch.js
// Enhanced medication search using Excel data

const ExcelReader = require('./excelReader');
const { Pharmacy, StorePrice } = require('./pharmacySearch');

export interface EnhancedMedicationResult extends StorePrice {
  excelMatch?: {
    medicinas: string;
    precioOriginal: number;
    unidades: string;
    similarity: number;
  };
}

export class EnhancedMedicationSearch {
  private excelReader: ExcelReader;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.excelReader = new ExcelReader();
  }

  // Search for medication prices using Excel data
  async searchMedicationPrices(
    pharmacies: Pharmacy[], 
    medication: { name: string; dosage: string },
    options: { currency?: string; userCountry?: string } = {}
  ): Promise<{ prices: EnhancedMedicationResult[]; meta?: any }> {
    try {
      console.log('🔍 Enhanced medication search for:', medication.name);
      
      // Get Excel medication data
      const excelMedications = await this.excelReader.getMedicationData();
      
      // Search for matching medications in Excel
      const excelMatches = await this.excelReader.searchMedications(medication.name);
      
      console.log(`📊 Found ${excelMatches.length} Excel matches for "${medication.name}"`);
      
      // Create enhanced results by combining pharmacy locations with Excel prices
      const enhancedResults: EnhancedMedicationResult[] = [];
      
      for (const pharmacy of pharmacies) {
        // Find Excel matches for this specific pharmacy
        const pharmacyMatches = excelMatches.filter(match => 
          this.excelReader.normalizePharmacyName(match.farmacia) === 
          this.excelReader.normalizePharmacyName(pharmacy.name)
        );
        
        if (pharmacyMatches.length > 0) {
          // Use the best match (highest similarity)
          const bestMatch = pharmacyMatches.reduce((best, current) => 
            current.similarity > best.similarity ? current : best
          );
          
          // Convert MXN price to target currency if needed
          let finalPrice = bestMatch.precioOriginal;
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
              medicinas: bestMatch.medicinas,
              precioOriginal: bestMatch.precioOriginal,
              unidades: bestMatch.unidades,
              similarity: bestMatch.similarity
            }
          });
        } else {
          // Fallback: Use mock price if no Excel match found
          const mockPrice = this.generateMockPrice(pharmacy.name, medication.name);
          enhancedResults.push({
            ...pharmacy,
            price: mockPrice,
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
      
      // Fallback to mock prices
      return {
        prices: pharmacies.map((pharmacy, index) => ({
          ...pharmacy,
          price: this.generateMockPrice(pharmacy.name, medication.name),
          pickup: true,
          delivery: index % 2 === 0,
          requiresCoupon: index % 3 === 0
        }))
      };
    }
  }

  // Generate mock price based on pharmacy and medication
  private generateMockPrice(pharmacyName: string, medicationName: string): number {
    // Create a deterministic but varied price based on inputs
    const pharmacyHash = pharmacyName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const medHash = medicationName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const basePrice = 20 + (pharmacyHash % 30);
    const variation = (medHash % 20) - 10;
    return Math.max(5, basePrice + variation);
  }

  // Convert currency (simplified - in real app, use real exchange rates)
  private async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    
    // Simple conversion rates (in real app, fetch from API)
    const rates: Record<string, Record<string, number>> = {
      'MXN': { 'USD': 0.05, 'EUR': 0.045, 'CAD': 0.07 },
      'USD': { 'MXN': 20, 'EUR': 0.9, 'CAD': 1.4 },
      'EUR': { 'MXN': 22, 'USD': 1.1, 'CAD': 1.5 },
      'CAD': { 'MXN': 14, 'USD': 0.7, 'EUR': 0.65 }
    };
    
    const rate = rates[from]?.[to] || 1;
    return Math.round(amount * rate * 100) / 100;
  }

  // Get all available pharmacies from Excel
  async getExcelPharmacies(): Promise<string[]> {
    try {
      return await this.excelReader.getPharmacies();
    } catch (error) {
      console.error('❌ Failed to get Excel pharmacies:', error);
      return [];
    }
  }

  // Search for specific medication in Excel
  async searchExcelMedication(medicationName: string): Promise<any[]> {
    try {
      return await this.excelReader.searchMedications(medicationName);
    } catch (error) {
      console.error('❌ Failed to search Excel medication:', error);
      return [];
    }
  }

  // Get medication statistics
  async getMedicationStats(): Promise<{
    totalMedications: number;
    totalPharmacies: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
  }> {
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
