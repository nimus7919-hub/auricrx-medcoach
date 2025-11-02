// services/enhancedSupplementSearch.js
// Enhanced supplement search using Excel data and database contributions

const ExcelReader = require('./excelReaderRNCompatible');

let getSupplementContributions;
try {
  const neonModule = require('../server/neon');
  getSupplementContributions = neonModule.getSupplementContributions;
} catch (error) {
  console.warn('⚠️ Neon database not available, enhanced supplement search will use fallback');
  getSupplementContributions = null;
}

class EnhancedSupplementSearch {
  constructor() {
    this.excelReader = new ExcelReader();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Test method to check if Excel reader is working
  async testExcelReader() {
    try {
      console.log('🧪 Testing Excel reader...');
      const data = await this.excelReader.getMedicationData();
      console.log('🧪 Excel reader test result:', {
        success: true,
        recordCount: data.length,
        sampleRecord: data[0] ? {
          medicinas: data[0].Medicinas || data[0].medicinas,
          farmacia: data[0].Pharmacy || data[0].farmacia,
          precio: data[0]['original price'] || data[0].precioOriginal
        } : null
      });
      return true;
    } catch (error) {
      console.error('🧪 Excel reader test failed:', error);
      return false;
    }
  }

  // Search for supplement prices using Excel data and database contributions
  async searchSupplementPrices(stores, supplement, options = {}) {
    try {
      console.log('🔍 Enhanced supplement search for:', supplement.name);
      
      // Try Excel data first (same as medication search)
      let prices = [];
      let meta = null;
      
      try {
        console.log('📊 Attempting Excel data search for supplements...');
        console.log('🔍 Searching for supplement:', supplement.name, 'brand:', supplement.brand);
        
        // Test Excel reader first
        const excelReaderWorking = await this.testExcelReader();
        if (!excelReaderWorking) {
          throw new Error('Excel reader not working');
        }
        
        // Get Excel medication data (some medications might be supplements)
        console.log('🔍 Loading Excel medication data...');
        const excelMedications = await this.excelReader.getMedicationData();
        console.log(`📊 Total Excel records available: ${excelMedications.length}`);
        
        if (!excelMedications || excelMedications.length === 0) {
          throw new Error('No Excel medication data loaded');
        }
        
        // Check a few sample records to see the data structure
        console.log('📊 Sample Excel records:', excelMedications.slice(0, 2).map(med => ({
          medicinas: med.Medicinas || med.medicinas,
          farmacia: med.Pharmacy || med.farmacia,
          precio: med['original price'] || med.precioOriginal
        })));
        
        // Search for matching supplements in Excel
        console.log('🔍 Searching Excel data for:', supplement.name);
        let excelMatches = await this.excelReader.searchMedications(supplement.name);
        
        console.log(`📊 Found ${excelMatches.length} Excel matches for "${supplement.name}"`);
        console.log(`📊 Sample matches:`, excelMatches.slice(0, 3).map(m => ({ 
          medicinas: m.Medicinas || m.medicinas, 
          farmacia: m.Pharmacy || m.farmacia, 
          precio: m['original price'] || m.precioOriginal 
        })));
        
        // If no matches found, try searching with just the first word or common supplement terms
        if (excelMatches.length === 0) {
          console.log('🔍 No direct matches found, trying broader search...');
          const firstWord = supplement.name.split(' ')[0];
          console.log(`🔍 Trying search with first word: "${firstWord}"`);
          
          const broadMatches = await this.excelReader.searchMedications(firstWord);
          console.log(`📊 Broad search found ${broadMatches.length} matches for "${firstWord}"`);
          
          if (broadMatches.length > 0) {
            excelMatches = broadMatches;
            console.log(`📊 Sample broad matches:`, excelMatches.slice(0, 3).map(m => ({ 
              medicinas: m.Medicinas || m.medicinas, 
              farmacia: m.Pharmacy || m.farmacia, 
              precio: m['original price'] || m.precioOriginal 
            })));
          } else {
            // Try even broader search with common supplement terms
            console.log('🔍 Trying supplement-related keywords...');
            const supplementKeywords = ['vitamin', 'vitamina', 'calcio', 'magnesio', 'suplemento', 'supplement'];
            
            for (const keyword of supplementKeywords) {
              console.log(`🔍 Searching for keyword: "${keyword}"`);
              const keywordMatches = await this.excelReader.searchMedications(keyword);
              console.log(`📊 Keyword "${keyword}" found ${keywordMatches.length} matches`);
              
              if (keywordMatches.length > 0) {
                excelMatches = keywordMatches.slice(0, 10); // Limit to first 10 for performance
                console.log(`📊 Using keyword matches for "${keyword}":`, excelMatches.slice(0, 2).map(m => ({ 
                  medicinas: m.Medicinas || m.medicinas, 
                  farmacia: m.Pharmacy || m.farmacia, 
                  precio: m['original price'] || m.precioOriginal 
                })));
                break;
              }
            }
          }
        }
        
        // Start with all matches - don't filter too strictly initially
        let filteredMatches = excelMatches;
        
        // Only apply brand filtering if it would help narrow down results
        if (supplement.brand && filteredMatches.length > 10) {
          const brand = supplement.brand.toLowerCase();
          console.log(`🔍 Filtering by brand: "${brand}" (${filteredMatches.length} -> ?)`);
          
          const brandFiltered = filteredMatches.filter(match => {
            const medicationName = (match.medicinas || '').toLowerCase();
            return medicationName.includes(brand) || 
                   medicationName.includes(supplement.name.toLowerCase());
          });
          
          // Only use brand filtering if it still leaves us with results
          if (brandFiltered.length > 0) {
            filteredMatches = brandFiltered;
            console.log(`📊 Brand filtering result: ${filteredMatches.length} matches`);
          } else {
            console.log(`📊 Brand filtering too strict, keeping all ${excelMatches.length} matches`);
          }
        }
        
        // Filter by quantity unit if available (with smart fallback)
        let strictMatches = filteredMatches;
        if (supplement.quantityUnit) {
          const quantityUnit = supplement.quantityUnit.toLowerCase();
          console.log(`🔍 Filtering by quantity unit: "${quantityUnit}"`);
          console.log(`🔍 Filtering FROM: ${filteredMatches.length} matches (after previous filters)`);
          
          strictMatches = filteredMatches.filter(match => {
            const unidades = (match.unidades || '').toLowerCase();
            const medicinas = (match.Medicinas || '').toLowerCase();
            const combined = `${medicinas} ${unidades}`;
            
            // Normalize the quantity unit to handle plurals and variations
            const normalizedUnit = quantityUnit.replace(/s$/, ''); // Remove trailing 's' (tablets -> tablet)
            
            // Check if the quantity unit appears in the supplement name or units field
            const hasUnitMatch = combined.includes(quantityUnit) || 
                                combined.includes(normalizedUnit) ||
                                // Handle Spanish/English variations
                                (normalizedUnit === 'tablet' && (combined.includes('tab') || combined.includes('tableta'))) ||
                                (normalizedUnit === 'capsule' && (combined.includes('cap') || combined.includes('capsula'))) ||
                                (normalizedUnit === 'gel cap' && (combined.includes('gel cap') || combined.includes('capsula gel') || combined.includes('softgel'))) ||
                                (normalizedUnit === 'suspension' && (combined.includes('suspension') || combined.includes('susplumas') || combined.includes('jarabe'))) ||
                                (normalizedUnit === 'drop' && (combined.includes('drop') || combined.includes('gota'))) ||
                                (normalizedUnit === 'syrup' && (combined.includes('syrup') || combined.includes('jarabe'))) ||
                                (normalizedUnit === 'gel' && combined.includes('gel')) ||
                                (normalizedUnit === 'cream' && (combined.includes('cream') || combined.includes('crema'))) ||
                                (normalizedUnit === 'ointment' && (combined.includes('ointment') || combined.includes('pomada') || combined.includes('ungüento'))) ||
                                (normalizedUnit === 'suppository' && (combined.includes('suppository') || combined.includes('suppositories') || combined.includes('supositorio'))) ||
                                (normalizedUnit === 'patch' && (combined.includes('patch') || combined.includes('parche'))) ||
                                (normalizedUnit === 'injection' && (combined.includes('injection') || combined.includes('injectable') || combined.includes('inyección') || combined.includes('inyectable'))) ||
                                (normalizedUnit === 'vial' && (combined.includes('vial') || combined.includes('ampolla') || combined.includes('ampoule'))) ||
                                (normalizedUnit === 'ml' && combined.includes('ml')) ||
                                (normalizedUnit === 'mg' && combined.includes('mg')) ||
                                (normalizedUnit === 'bottle' && (combined.includes('bottle') || combined.includes('botella') || combined.includes('frasco'))) ||
                                (normalizedUnit === 'box' && (combined.includes('box') || combined.includes('caja'))) ||
                                (normalizedUnit === 'pack' && (combined.includes('pack') || combined.includes('paquete')));
            
            return hasUnitMatch;
          });
          
          console.log(`📊 After quantity unit filtering: ${strictMatches.length} matches`);
          
          // SMART FALLBACK: If too few results, run relaxed search (ignore quantity unit)
          const FALLBACK_THRESHOLD = 5;
          if (strictMatches.length <= FALLBACK_THRESHOLD && strictMatches.length < filteredMatches.length) {
            console.log(`⚠️ Only ${strictMatches.length} strict matches found. Running relaxed search (ignoring quantity unit)...`);
            
            // Keep strict matches first, then add relaxed matches that aren't already included
            const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const strictIds = new Set(strictMatches.map(m => `${normalize(m.Medicinas)}|${normalize(m.unidades || '')}`));
            const relaxedMatches = filteredMatches.filter(m => {
              const id = `${normalize(m.Medicinas)}|${normalize(m.unidades || '')}`;
              return !strictIds.has(id);
            });
            
            filteredMatches = [...strictMatches, ...relaxedMatches];
            console.log(`✅ Expanded to ${filteredMatches.length} matches (${strictMatches.length} exact + ${relaxedMatches.length} other forms)`);
            console.log(`📋 Showing all available forms: tablets, capsules, powders, liquids, etc.`);
          } else {
            filteredMatches = strictMatches;
          }
        }
        
        // Group matches by pharmacy
        const pharmacyMatches = {};
        filteredMatches.forEach(match => {
          const pharmacyName = match.Pharmacy || match.farmacia;
          if (!pharmacyName) return; // Skip if no pharmacy name
          
          const pharmacyKey = pharmacyName.toLowerCase().trim();
          if (!pharmacyMatches[pharmacyKey]) {
            pharmacyMatches[pharmacyKey] = [];
          }
          pharmacyMatches[pharmacyKey].push(match);
        });
        
        console.log(`🏪 Found Excel data for ${Object.keys(pharmacyMatches).length} pharmacies`);
        console.log(`🏪 Excel pharmacy names:`, Object.keys(pharmacyMatches).slice(0, 10));
        
        // Match stores with Excel data and create price data
        stores.forEach(store => {
          const storeKey = store.name.toLowerCase().trim();
          let matches = pharmacyMatches[storeKey] || [];
          
          // If no direct match, try fuzzy matching
          if (matches.length === 0) {
            console.log(`🔍 No direct match for "${store.name}", trying fuzzy matching...`);
            
            // Try partial matches
            for (const [pharmacyKey, pharmacyMatchesArray] of Object.entries(pharmacyMatches)) {
              if (storeKey.includes(pharmacyKey) || pharmacyKey.includes(storeKey)) {
                console.log(`🔍 Found fuzzy match: "${store.name}" ≈ "${pharmacyKey}"`);
                matches = pharmacyMatchesArray;
                break;
              }
            }
            
            // Try common pharmacy name variations
            if (matches.length === 0) {
              const commonVariations = {
                'farmacia del ahorro': ['del ahorro', 'ahorro', 'farmacia ahorro'],
                'farmacia benavides': ['benavides', 'benavides farmacia'],
                'farmacia guadalajara': ['guadalajara', 'guadalajara farmacia'],
                'farmacia san pablo': ['san pablo', 'pablo', 'sanpablo'],
                'farmacia similares': ['similares', 'similares farmacia']
              };
              
              for (const [commonName, variations] of Object.entries(commonVariations)) {
                if (storeKey.includes(commonName) || commonName.includes(storeKey)) {
                  console.log(`🔍 Found common name match: "${store.name}" ≈ "${commonName}"`);
                  matches = pharmacyMatches[commonName] || [];
                  break;
                }
                
                // Check variations
                for (const variation of variations) {
                  if (storeKey.includes(variation) || variation.includes(storeKey)) {
                    console.log(`🔍 Found variation match: "${store.name}" ≈ "${variation}" (${commonName})`);
                    matches = pharmacyMatches[commonName] || [];
                    break;
                  }
                }
                
                if (matches.length > 0) break;
              }
            }
          }
          
          if (matches.length > 0) {
            // Use the first match for pricing (could be enhanced to find best match)
            const match = matches[0];
            
            const price = match['original price'] || match.precioOriginal || 0;
            const medicinas = match.Medicinas || match.medicinas || '';
            const unidades = match.unidades || '';
            
            prices.push({
              ...store,
              price: parseFloat(price) || 0,
              pickup: true,
              delivery: Math.random() > 0.3,
              requiresCoupon: Math.random() > 0.9,
              source: 'excel_data',
              excelMatch: {
                medicinas: medicinas,
                precioOriginal: price,
                unidades: unidades,
                farmacia: match.Pharmacy || match.farmacia,
                _strengthMg: match._strengthMg,
                _packSize: match._packSize
              },
              lastUpdated: new Date().toISOString()
            });
            
            console.log(`✅ Added Excel price for ${store.name}: $${price} (${medicinas})`);
          } else {
            // No Excel match found - show "Price not available"
            console.log(`🔍 No Excel matches for ${store.name}, showing "Price not available"`);
            prices.push({
              ...store,
              price: null, // No price available
              priceNotAvailable: true,
              pickup: true,
              delivery: Math.random() > 0.5,
              requiresCoupon: Math.random() > 0.8,
              source: 'no_excel_data'
            });
          }
        });
        
        if (prices.length > 0) {
          console.log(`🎯 Excel search returned ${prices.length} prices`);
          meta = {
            source: 'excel_data',
            matchCount: filteredMatches.length,
            storeCount: prices.length,
            currency: options.currency || 'USD'
          };
          return { prices, meta };
        }
      } catch (excelError) {
        console.warn('⚠️ Excel search failed, trying database contributions:', excelError);
        console.error('🔍 Excel search error details:', {
          supplementName: supplement.name,
          supplementBrand: supplement.brand,
          errorMessage: excelError.message,
          errorStack: excelError.stack
        });
      }
      
      // Fallback to database contributions if Excel didn't work
      if (getSupplementContributions) {
        console.log('📊 Attempting database contribution search...');
        
        const supplementContributions = await getSupplementContributions({
          supplementName: supplement.name,
          limit: 100
        });
        
        console.log(`📊 Found ${supplementContributions.length} supplement contributions for "${supplement.name}"`);
        
        // Process database contributions (same logic as before)
        const storeContributions = {};
        supplementContributions.forEach(contribution => {
          const storeKey = contribution.store_name.toLowerCase().trim();
          if (!storeContributions[storeKey]) {
            storeContributions[storeKey] = [];
          }
          storeContributions[storeKey].push(contribution);
        });
        
        stores.forEach(store => {
          const storeKey = store.name.toLowerCase().trim();
          const contributions = storeContributions[storeKey] || [];
          
          if (contributions.length > 0 && prices.find(p => p.id === store.id) === undefined) {
            const latestContribution = contributions.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at)
            )[0];
            
            prices.push({
              ...store,
              price: parseFloat(latestContribution.price),
              pickup: true,
              delivery: Math.random() > 0.3,
              requiresCoupon: Math.random() > 0.9,
              source: 'database_contribution',
              contributionId: latestContribution.id,
              lastUpdated: latestContribution.created_at
            });
            
            console.log(`✅ Added database price for ${store.name}: $${latestContribution.price}`);
          }
        });
        
        if (prices.length > 0) {
          console.log(`🎯 Database search returned ${prices.length} prices`);
          meta = {
            source: 'database_contributions',
            contributionCount: supplementContributions.length,
            storeCount: prices.length,
            currency: options.currency || 'USD'
          };
          return { prices, meta };
        }
      }
      
      // If both Excel and database failed, show detailed debugging and fall back gracefully
      console.log('⚠️ No enhanced data available - this is normal for supplements not in Excel data');
      console.log('📊 Debug summary:', {
        supplementName: supplement.name,
        supplementBrand: supplement.brand,
        excelDataLoaded: excelMedications ? excelMedications.length : 0,
        excelMatchesFound: excelMatches ? excelMatches.length : 0,
        databaseAvailable: !!getSupplementContributions,
        finalPriceCount: prices.length,
        hasExcelData: !!excelMedications,
        hasMatches: !!excelMatches
      });
      
      // Don't throw error - just return empty results to fall back to original method
      return { prices: [], meta: { source: 'no_enhanced_data', reason: 'supplement not found in Excel or database' } };
      
    } catch (error) {
      console.error('❌ Enhanced supplement search failed:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Enhanced supplement search cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout
    };
  }
}

module.exports = new EnhancedSupplementSearch();
