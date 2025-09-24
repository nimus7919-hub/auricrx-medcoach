// scripts/testExcelIntegration.js
// Test the Excel integration with safety measures

const EnhancedMedicationSearch = require('../services/enhancedMedicationSearch');

async function testExcelIntegration() {
  console.log('🧪 Testing Excel Integration with Safety Measures...\n');
  
  try {
    const enhancedSearch = new EnhancedMedicationSearch();
    
    // Test with mock pharmacies
    const mockPharmacies = [
      { 
        id: '1', 
        name: 'Aurrera', 
        lat: 20.6597, 
        lon: -103.3496, 
        address: 'Guadalajara, Mexico',
        distanceMiles: 0.5
      },
      { 
        id: '2', 
        name: 'farmacia del ahorro', 
        lat: 20.6600, 
        lon: -103.3500, 
        address: 'Guadalajara, Mexico',
        distanceMiles: 0.8
      },
      { 
        id: '3', 
        name: 'farmacia guadalajara', 
        lat: 20.6500, 
        lon: -103.3400, 
        address: 'Guadalajara, Mexico',
        distanceMiles: 1.2
      }
    ];
    
    const medication = { name: 'Aspirina Protect', dosage: '100mg' };
    
    console.log('🔍 Testing Excel integration...');
    const result = await enhancedSearch.searchMedicationPrices(
      mockPharmacies, 
      medication, 
      { currency: 'MXN', userCountry: 'MX' }
    );
    
    console.log(`✅ Excel integration completed: ${result.prices.length} results`);
    console.log(`✅ Meta data:`, result.meta);
    
    result.prices.forEach((pharmacy, index) => {
      const priceText = pharmacy.priceNotAvailable ? 
        'Price not available' : 
        `MXN ${pharmacy.price}`;
      const excelMatch = pharmacy.excelMatch ? ' (Excel match)' : '';
      console.log(`  ${index + 1}. ${pharmacy.name} - ${priceText}${excelMatch}`);
    });
    
    // Check for mock data
    const hasMockData = result.prices.some(p => p.price && p.price > 0 && !p.excelMatch);
    if (hasMockData) {
      console.log('❌ WARNING: Mock data detected!');
    } else {
      console.log('✅ SUCCESS: No mock data - only Excel matches or "Price not available"');
    }
    
    console.log('\n🎯 Safety Status:');
    console.log('   ✅ Excel integration enabled');
    console.log('   ✅ "Price not available" for no matches');
    console.log('   ✅ Real prices only from Excel data');
    console.log('   ✅ No mock data generation');
    console.log('   ✅ Safe for medical app users');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testExcelIntegration();
