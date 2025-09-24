// scripts/testServerDebug.js
// Test server with debug logging to see what's happening

const fetch = require('node-fetch');

async function testServerDebug() {
  console.log('🔍 DEBUG: Testing Server API with Debug Logging...\n');
  
  try {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
      }
    ];
    
    const medication = { name: 'Aspirina Protect', dosage: '100mg' };
    
    console.log('🔍 DEBUG: Making test request to server...');
    console.log('🔍 DEBUG: Medication:', medication);
    console.log('🔍 DEBUG: Pharmacies:', mockPharmacies.map(p => ({ name: p.name, id: p.id })));
    
    const response = await fetch('http://localhost:4000/pharmacies/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        medication, 
        pharmacies: mockPharmacies, 
        currency: 'MXN' 
      })
    });
    
    console.log('🔍 DEBUG: Response status:', response.status);
    console.log('🔍 DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.log('❌ DEBUG: Server error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('❌ DEBUG: Error body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('🔍 DEBUG: Response data:', JSON.stringify(data, null, 2));
    
    if (data.ok && data.prices) {
      console.log(`✅ DEBUG: Server returned ${data.prices.length} pharmacies`);
      data.prices.forEach((pharmacy, index) => {
        const priceText = pharmacy.priceNotAvailable ? 
          'Price not available' : 
          `MXN ${pharmacy.price}`;
        console.log(`  ${index + 1}. ${pharmacy.name} - ${priceText}`);
      });
      
      // Check for mock data
      const hasMockData = data.prices.some(p => p.price && p.price > 0);
      if (hasMockData) {
        console.log('❌ DEBUG: WARNING - Server still returning mock prices!');
        console.log('❌ DEBUG: Mock prices found:', data.prices.filter(p => p.price > 0));
      } else {
        console.log('✅ DEBUG: SUCCESS - Server correctly returns "Price not available"');
      }
    } else {
      console.log('❌ DEBUG: Invalid server response structure');
    }
    
  } catch (error) {
    console.log('❌ DEBUG: Server not accessible:', error.message);
    console.log('🔍 DEBUG: This means the app will use the fallback "Price not available" system');
    console.log('🔍 DEBUG: Check if server is running on port 4000');
  }
}

// Run the debug test
testServerDebug();
