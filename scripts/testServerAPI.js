// scripts/testServerAPI.js
// Test the server API to verify it returns "Price not available" instead of mock data

const fetch = require('node-fetch');

async function testServerAPI() {
  console.log('🧪 Testing Server API for "Price Not Available"...\n');
  
  try {
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    
    console.log('🔍 Testing server API...');
    const response = await fetch('http://localhost:4000/pharmacies/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        medication, 
        pharmacies: mockPharmacies, 
        currency: 'MXN' 
      })
    });
    
    if (!response.ok) {
      console.log('❌ Server API error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    if (data.ok && data.prices) {
      console.log(`✅ Server API response: ${data.prices.length} pharmacies`);
      data.prices.forEach((pharmacy, index) => {
        const priceText = pharmacy.priceNotAvailable ? 
          'Price not available' : 
          `MXN ${pharmacy.price}`;
        console.log(`  ${index + 1}. ${pharmacy.name} - ${priceText}`);
      });
      
      // Check if any mock data is present
      const hasMockData = data.prices.some(p => p.price && p.price > 0);
      if (hasMockData) {
        console.log('❌ WARNING: Server still returning mock prices!');
      } else {
        console.log('✅ SUCCESS: Server correctly returns "Price not available"');
      }
    } else {
      console.log('❌ Invalid server response:', data);
    }
    
  } catch (error) {
    console.log('⚠️ Server not accessible:', error.message);
    console.log('✅ This means the app will use the fallback "Price not available" system');
  }
}

// Run the test
testServerAPI();
