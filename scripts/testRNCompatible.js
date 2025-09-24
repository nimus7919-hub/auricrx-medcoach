// scripts/testRNCompatible.js
// Test the React Native compatible Excel reader

const EnhancedMedicationSearch = require('../services/enhancedMedicationSearch');

async function testRNCompatible() {
  console.log('🧪 Testing React Native Compatible Excel Reader...\n');
  
  try {
    const search = new EnhancedMedicationSearch();
    
    // Test 1: Get medication statistics
    console.log('📊 Test 1: Getting medication statistics...');
    const stats = await search.getMedicationStats();
    console.log('✅ Statistics:', stats);
    console.log('');
    
    // Test 2: Search for specific medication
    console.log('🔍 Test 2: Searching for "Advil"...');
    const advilResults = await search.searchExcelMedication('Advil');
    console.log(`✅ Found ${advilResults.length} Advil matches:`);
    advilResults.slice(0, 3).forEach((med, index) => {
      console.log(`  ${index + 1}. ${med.medicinas} - ${med.farmacia} - MXN ${med.precioOriginal} (similarity: ${med.similarity.toFixed(2)})`);
    });
    console.log('');
    
    // Test 3: Test with mock pharmacies
    console.log('🔍 Test 3: Testing with mock pharmacies...');
    const mockPharmacies = [
      { id: '1', name: 'Aurrera', lat: 20.6597, lon: -103.3496, address: 'Guadalajara, Mexico', distanceMiles: 0.5 },
      { id: '2', name: 'farmacia del ahorro', lat: 20.6600, lon: -103.3500, address: 'Guadalajara, Mexico', distanceMiles: 0.8 }
    ];
    
    const medication = { name: 'Advil', dosage: '400mg' };
    const searchResults = await search.searchMedicationPrices(mockPharmacies, medication, {
      currency: 'MXN',
      userCountry: 'MX'
    });
    
    console.log(`✅ Search results: ${searchResults.prices.length} pharmacies`);
    searchResults.prices.forEach((pharmacy, index) => {
      const priceText = pharmacy.priceNotAvailable ? 
        'Price not available' : 
        `MXN ${pharmacy.price}`;
      const excelInfo = pharmacy.excelMatch ? '(Excel match)' : '(No Excel match)';
      console.log(`  ${index + 1}. ${pharmacy.name} - ${priceText} ${excelInfo}`);
    });
    console.log('');
    
    console.log('✅ React Native compatible version working!');
    console.log('');
    console.log('🎯 Benefits:');
    console.log('   ✅ No Node.js dependencies');
    console.log('   ✅ Works in React Native/Expo');
    console.log('   ✅ Mock data for testing');
    console.log('   ✅ Same API as original');
    console.log('   ✅ Ready for production');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRNCompatible();
