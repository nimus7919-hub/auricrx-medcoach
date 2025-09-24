// scripts/testEnhancedMedicationSearch.js
// Test script for enhanced medication search with Excel integration

const EnhancedMedicationSearch = require('../services/enhancedMedicationSearch');

async function testEnhancedMedicationSearch() {
  console.log('🧪 Testing Enhanced Medication Search...\n');
  
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
    
    // Test 3: Search for "Viagra"
    console.log('🔍 Test 3: Searching for "Viagra"...');
    const viagraResults = await search.searchExcelMedication('Viagra');
    console.log(`✅ Found ${viagraResults.length} Viagra matches:`);
    viagraResults.slice(0, 3).forEach((med, index) => {
      console.log(`  ${index + 1}. ${med.medicinas} - ${med.farmacia} - MXN ${med.precioOriginal} (similarity: ${med.similarity.toFixed(2)})`);
    });
    console.log('');
    
    // Test 4: Get Excel pharmacies
    console.log('🏪 Test 4: Getting Excel pharmacies...');
    const excelPharmacies = await search.getExcelPharmacies();
    console.log(`✅ Found ${excelPharmacies.length} pharmacies:`);
    excelPharmacies.slice(0, 5).forEach((pharmacy, index) => {
      console.log(`  ${index + 1}. ${pharmacy}`);
    });
    console.log('');
    
    // Test 5: Simulate pharmacy search with Excel integration
    console.log('🔍 Test 5: Simulating pharmacy search with Excel integration...');
    const mockPharmacies = [
      { id: '1', name: 'Aurrera', lat: 20.6597, lon: -103.3496, address: 'Guadalajara, Mexico' },
      { id: '2', name: 'farmacia del ahorro', lat: 20.6597, lon: -103.3496, address: 'Guadalajara, Mexico' },
      { id: '3', name: 'farmacia guadalajara', lat: 20.6597, lon: -103.3496, address: 'Guadalajara, Mexico' }
    ];
    
    const medication = { name: 'Advil', dosage: '400mg' };
    const searchResults = await search.searchMedicationPrices(mockPharmacies, medication, {
      currency: 'MXN',
      userCountry: 'MX'
    });
    
    console.log(`✅ Enhanced search results: ${searchResults.prices.length} pharmacies`);
    searchResults.prices.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - MXN ${result.price} ${result.excelMatch ? '(Excel match)' : '(Mock price)'}`);
      if (result.excelMatch) {
        console.log(`     Excel: ${result.excelMatch.medicinas} (similarity: ${result.excelMatch.similarity.toFixed(2)})`);
      }
    });
    console.log('');
    
    // Test 6: Test currency conversion
    console.log('💱 Test 6: Testing currency conversion...');
    const usdResults = await search.searchMedicationPrices(mockPharmacies, medication, {
      currency: 'USD',
      userCountry: 'US'
    });
    
    console.log(`✅ USD results: ${usdResults.prices.length} pharmacies`);
    usdResults.prices.slice(0, 3).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - USD ${result.price}`);
    });
    console.log('');
    
    console.log('✅ All enhanced medication search tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEnhancedMedicationSearch();
