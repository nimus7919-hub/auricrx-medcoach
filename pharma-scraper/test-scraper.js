import { PharmaScraper } from './scraper.js';

async function testScraper() {
  console.log('🧪 Testing Pharmaceutical Scraper...');
  
  const scraper = new PharmaScraper();
  
  try {
    await scraper.initialize();
    
    // Test with common medications
    const testMedications = [
      'aspirin 100mg',
      'ibuprofen 200mg',
      'paracetamol 500mg',
      'omeprazol 20mg'
    ];
    
    for (const medication of testMedications) {
      console.log(`\n🔍 Testing: ${medication}`);
      const results = await scraper.scrapeAllPharmacies(medication);
      
      console.log(`📊 Results for ${medication}:`);
      results.forEach((med, index) => {
        console.log(`  ${index + 1}. ${med.name} - $${med.price} ${med.currency} (${med.pharmacy})`);
        console.log(`     Strength: ${med.strength}, Form: ${med.form}, Quantity: ${med.quantity}`);
      });
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await scraper.close();
  }
}

// Run test
testScraper();
