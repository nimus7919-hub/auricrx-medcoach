// scripts/integrationExample.js
// Example of how to integrate Excel medication search with existing system

const EnhancedMedicationSearch = require('../services/enhancedMedicationSearch');

async function integrationExample() {
  console.log('🔗 Integration Example: Excel Medication Search\n');
  
  try {
    const search = new EnhancedMedicationSearch();
    
    // Simulate what happens when user searches for medication
    console.log('👤 User searches for: "Advil 400mg"');
    console.log('📍 User location: Guadalajara, Mexico');
    console.log('💱 User currency: MXN\n');
    
    // Mock pharmacy locations (normally from your existing pharmacy API)
    const nearbyPharmacies = [
      { 
        id: '1', 
        name: 'Aurrera', 
        lat: 20.6597, 
        lon: -103.3496, 
        address: 'Av. López Mateos Sur, Guadalajara, Jalisco, Mexico',
        distanceMiles: 0.5
      },
      { 
        id: '2', 
        name: 'farmacia del ahorro', 
        lat: 20.6600, 
        lon: -103.3500, 
        address: 'Calle Morelos, Guadalajara, Jalisco, Mexico',
        distanceMiles: 0.8
      },
      { 
        id: '3', 
        name: 'farmacia guadalajara', 
        lat: 20.6610, 
        lon: -103.3510, 
        address: 'Plaza del Sol, Guadalajara, Jalisco, Mexico',
        distanceMiles: 1.2
      }
    ];
    
    // Search for medication using Excel data
    const medication = { name: 'Advil', dosage: '400mg' };
    const results = await search.searchMedicationPrices(nearbyPharmacies, medication, {
      currency: 'MXN',
      userCountry: 'MX'
    });
    
    console.log('📊 Results from Excel integration:');
    console.log(`✅ Found ${results.prices.length} pharmacies with prices\n`);
    
    // Display results like your existing medication refill modal
    results.prices.forEach((pharmacy, index) => {
      const distance = pharmacy.distanceMiles ? `${(pharmacy.distanceMiles * 1.60934).toFixed(1)} km` : 'N/A';
      const price = `MXN ${pharmacy.price}`;
      const excelInfo = pharmacy.excelMatch ? 
        `(Excel: ${pharmacy.excelMatch.medicinas}, similarity: ${pharmacy.excelMatch.similarity.toFixed(2)})` : 
        '(Mock price)';
      
      console.log(`${index + 1}. ${pharmacy.name}`);
      console.log(`   📍 ${pharmacy.address}`);
      console.log(`   📏 Distance: ${distance}`);
      console.log(`   💰 Price: ${price} ${excelInfo}`);
      console.log(`   🚚 Pickup: ${pharmacy.pickup ? 'Yes' : 'No'} | Delivery: ${pharmacy.delivery ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Show statistics
    console.log('📈 Excel Data Statistics:');
    const stats = await search.getMedicationStats();
    console.log(`   📊 Total medications: ${stats.totalMedications.toLocaleString()}`);
    console.log(`   🏪 Total pharmacies: ${stats.totalPharmacies}`);
    console.log(`   💰 Average price: MXN ${stats.averagePrice.toFixed(2)}`);
    console.log(`   📏 Price range: MXN ${stats.priceRange.min} - MXN ${stats.priceRange.max.toLocaleString()}`);
    console.log('');
    
    // Show how this integrates with your existing system
    console.log('🔗 Integration Benefits:');
    console.log('   ✅ Real prices from your Excel data');
    console.log('   ✅ Fuzzy matching for medication names');
    console.log('   ✅ Currency conversion (MXN ↔ USD)');
    console.log('   ✅ Pharmacy-specific pricing');
    console.log('   ✅ Fallback to mock prices when no Excel match');
    console.log('   ✅ Maintains existing UI and functionality');
    console.log('');
    
    console.log('🎯 Next Steps:');
    console.log('   1. Replace getMedicationPrices() in MedicationRefillModal');
    console.log('   2. Add Excel search as primary method');
    console.log('   3. Keep existing fallback for non-Excel pharmacies');
    console.log('   4. Test with real user searches');
    
  } catch (error) {
    console.error('❌ Integration example failed:', error.message);
  }
}

// Run the integration example
integrationExample();
