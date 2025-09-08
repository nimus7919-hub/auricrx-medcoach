import { PharmaScraper } from './scraper.js';

async function testFahorro() {
  console.log('🧪 Testing Farmacia del Ahorro Scraper...');
  
  const scraper = new PharmaScraper();
  
  try {
    await scraper.initialize();
    
    // Test with common medications
    const testMedications = [
      'aspirina',
      'ibuprofeno',
      'paracetamol',
      'omeprazol'
    ];
    
    for (const medication of testMedications) {
      console.log(`\n🔍 Testing: ${medication}`);
      
      // Test just Farmacia del Ahorro first
      const results = await scraper.scrapePharmacy('fahorro', medication);
      
      console.log(`📊 Results for ${medication} at Farmacia del Ahorro:`);
      
      if (results.blocked) {
        console.log(`🚫 BLOCKED: ${results.reason}`);
        console.log(`📋 Fallback: ${results.fallback?.message}`);
        console.log(`🔗 URL: ${results.fallback?.url}`);
      } else if (Array.isArray(results)) {
        results.forEach((med, index) => {
          console.log(`  ${index + 1}. ${med.name} - $${med.price} ${med.currency}`);
          console.log(`     Strength: ${med.strength}, Form: ${med.form}, Quantity: ${med.quantity}`);
          console.log(`     Code: ${med.productCode}`);
        });
      } else {
        console.log(`📝 Single result:`, results);
      }
      
      // Wait between tests
      console.log(`⏳ Waiting 10 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Now test all pharmacies
    console.log(`\n🌍 Testing all pharmacies with "aspirina":`);
    const allResults = await scraper.scrapeAllPharmacies('aspirina');
    
    console.log(`📊 Summary:`);
    console.log(`  ✅ Successful results: ${allResults.summary.totalResults}`);
    console.log(`  🚫 Blocked pharmacies: ${allResults.summary.blockedCount}`);
    console.log(`  ✅ Successful pharmacies: ${allResults.summary.successCount}`);
    
    if (allResults.blockedPharmacies.length > 0) {
      console.log(`\n🚫 Blocked Pharmacies:`);
      allResults.blockedPharmacies.forEach(blocked => {
        console.log(`  - ${blocked.pharmacy}: ${blocked.reason}`);
      });
    }
    
    if (allResults.fallbacks.length > 0) {
      console.log(`\n📋 Fallback Options:`);
      allResults.fallbacks.forEach(fallback => {
        console.log(`  - ${fallback.message}`);
        console.log(`    Action: ${fallback.action}`);
        console.log(`    URL: ${fallback.url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await scraper.close();
  }
}

// Run test
testFahorro();
