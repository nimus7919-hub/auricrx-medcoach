// scripts/testExcelReader.js
// Test script to verify Excel reading functionality

const ExcelReader = require('../services/excelReader');

async function testExcelReader() {
  console.log('🧪 Testing Excel Reader...\n');
  
  try {
    const reader = new ExcelReader();
    
    // Test 1: Read all medication data
    console.log('📊 Test 1: Reading all medication data...');
    const medications = await reader.getMedicationData();
    console.log(`✅ Successfully loaded ${medications.length} medications\n`);
    
    // Test 2: Show sample data
    console.log('📊 Test 2: Sample medications:');
    medications.slice(0, 5).forEach((med, index) => {
      console.log(`${index + 1}. ${med.medicinas} - ${med.farmacia} - MXN ${med.precioOriginal}`);
    });
    console.log('');
    
    // Test 3: Search for specific medications
    console.log('🔍 Test 3: Searching for "Advil"...');
    const advilResults = await reader.searchMedications('Advil');
    advilResults.slice(0, 3).forEach((med, index) => {
      console.log(`${index + 1}. ${med.medicinas} - ${med.farmacia} - MXN ${med.precioOriginal} (similarity: ${med.similarity.toFixed(2)})`);
    });
    console.log('');
    
    // Test 4: Search for "Viagra"
    console.log('🔍 Test 4: Searching for "Viagra"...');
    const viagraResults = await reader.searchMedications('Viagra');
    viagraResults.slice(0, 3).forEach((med, index) => {
      console.log(`${index + 1}. ${med.medicinas} - ${med.farmacia} - MXN ${med.precioOriginal} (similarity: ${med.similarity.toFixed(2)})`);
    });
    console.log('');
    
    // Test 5: Get all pharmacies
    console.log('🏪 Test 5: All pharmacies:');
    const pharmacies = await reader.getPharmacies();
    pharmacies.forEach((pharmacy, index) => {
      console.log(`${index + 1}. ${pharmacy}`);
    });
    console.log('');
    
    // Test 6: Get medications by pharmacy
    console.log('🏪 Test 6: Medications from "Aurrera":');
    const aurreraMeds = await reader.getMedicationsByPharmacy('Aurrera');
    aurreraMeds.slice(0, 5).forEach((med, index) => {
      console.log(`${index + 1}. ${med.medicinas} - MXN ${med.precioOriginal}`);
    });
    console.log('');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testExcelReader();
