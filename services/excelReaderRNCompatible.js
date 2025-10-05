// services/excelReaderRNCompatible.js
// React Native/Expo compatible Excel reader using fetch and blob

class ExcelReaderRNCompatible {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.excelData = null;
  }

  // Load Excel data from a bundled JSON file (pre-converted from Excel)
  async loadExcelData() {
    try {
      console.log('📊 Loading Excel data for React Native...');
      
      // Try to load from JSON file first
      try {
        // Try different paths for different environments
        const paths = [
          './assets/medicationData.json',  // Client-side React Native
          './medicationData.json',         // Server-side
          '../assets/medicationData.json', // Alternative client path
          '../medicationData.json'         // Alternative server path
        ];
        
        for (const path of paths) {
          try {
            console.log(`📊 Trying to load from: ${path}`);
            const response = await fetch(path);
            if (response.ok) {
              const data = await response.json();
              console.log(`📊 Loaded ${data.length} medications from ${path}`);
              return data;
            } else {
              console.log(`📊 Failed to load from ${path}, status: ${response.status}`);
            }
          } catch (pathError) {
            console.log(`📊 Path ${path} failed:`, pathError.message);
          }
        }
        
        console.log('⚠️ All fetch paths failed, trying require method...');
      } catch (fetchError) {
        console.log('⚠️ Fetch failed, trying require method...');
      }
      
      // Fallback: Try to require the JSON file (for Node.js test environment)
      const requirePaths = [
        '../assets/medicationData.json',
        './assets/medicationData.json',
        '../medicationData.json',
        './medicationData.json'
      ];
      
      for (const requirePath of requirePaths) {
        try {
          console.log(`📊 Trying require path: ${requirePath}`);
          const data = require(requirePath);
          console.log(`📊 Loaded ${data.length} medications from require() method (${requirePath})`);
          return data;
        } catch (requireError) {
          console.log(`📊 Require path ${requirePath} failed:`, requireError.message);
        }
      }
      
      console.warn('⚠️ All require methods failed, generating mock data...');
      throw new Error('Both fetch and require failed');
      
    } catch (error) {
      console.log('⚠️ Could not load JSON data, using mock data for testing');
      console.log('📊 Mock data includes aspirin and other common medications for testing');
      // Fallback to mock data for testing
      return this.generateMockData(1000);
    }
  }

  // Generate mock data that matches your Excel structure
  generateMockData(count) {
    console.log('📊 Generating mock medication data for React Native...');
    const pharmacies = ['Aurrera', 'Farmacia Benavides', 'farmacia del ahorro', 'farmacia guadalajara', 'HEB', 'Farmacia san Angel', 'farmacia San Pablo', 'farmacia similares'];
    const medicationNames = [
      'Aspirin', 'Aspirin Protect', 'Advil', 'Viagra', 'Omeprazol', 'Paracetamol', 'Ibuprofeno', 'Amikacin Medimart', 'Ceftriaxone Medimart', 'Postday', 'Fosfonat', 'Aquasol AD.'
    ];
    const dosages = ['100 mg', '200 mg', '400 mg', '500 mg', '1 g', '1.5 mg', '5.9 gc/u', '2 ml'];
    const units = ['', '1 AMPULE', '10 Cápsulas', '1 tableta', '1 G'];

    const mockData = [];
    for (let i = 0; i < count; i++) {
      const randomPharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)];
      const randomMedication = medicationNames[Math.floor(Math.random() * medicationNames.length)];
      const randomDosage = dosages[Math.floor(Math.random() * dosages.length)];
      const randomUnits = units[Math.floor(Math.random() * units.length)];
      const randomPrice = Math.floor(Math.random() * 500) + 10; // Price between 10 and 509

      const fullMedicationName = `${randomMedication} ${randomDosage}`;

      mockData.push({
        id: `mock_med_${i}`,
        farmacia: randomPharmacy,
        medicinas: fullMedicationName,
        precioOriginal: randomPrice,
        unidades: randomUnits,
        _medicinasNorm: this.normalizeMedicationName(fullMedicationName),
        _farmaciaNorm: this.normalizePharmacyName(randomPharmacy),
        _strengthMg: this.extractStrength(fullMedicationName),
        _packSize: this.extractPackSize(randomUnits)
      });
    }
    console.log(`📊 Generated ${mockData.length} mock medications`);
    return mockData;
  }

  async getMedicationData() {
    const cached = this.cache.get('medications');
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      console.log('📊 Using cached medication data:', cached.data.length, 'medications');
      return cached.data;
    }
    
    console.log('📊 Loading fresh medication data...');
    const data = await this.loadExcelData();
    console.log('📊 Loaded medication data:', data.length, 'medications');
    this.cache.set('medications', { data, timestamp: Date.now() });
    return data;
  }

  cleanString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim();
  }

  parsePrice(priceStr) {
    if (!priceStr) return 0;
    let price;
    if (typeof priceStr === 'number') {
      price = priceStr;
    } else {
      const cleanPrice = String(priceStr).replace(/MXN\s*/g, '').replace(/[^\d.]/g, '');
      price = parseFloat(cleanPrice);
    }
    return isNaN(price) ? 0 : price;
  }

  normalizeMedicationName(name) {
    if (!name) return '';
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  normalizePharmacyName(name) {
    if (!name) return '';
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  extractStrength(name) {
    const match = name.match(/(\d+)\s*(mg|g|ml)/i);
    return match ? parseFloat(match[1]) : null;
  }

  extractPackSize(unidades) {
    const match = unidades.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  async searchMedications(query) {
    console.log('🔍 DEBUG: searchMedications called with query:', query);
    const medications = await this.getMedicationData();
    
    console.log('🔍 DEBUG: Total medications loaded:', medications.length);
    console.log('🔍 DEBUG: Sample medications:', medications.slice(0, 3).map(m => ({
      medicinas: m.Medicinas,
      farmacia: m.Pharmacy,
      precioOriginal: m['original price']
    })));
    
    // More precise search for exact matches first
    const normalizedQuery = this.normalizeMedicationName(query);
    console.log('🔍 DEBUG: Normalized query:', normalizedQuery);
    
    // Handle common medication name variations
    const queryVariations = [normalizedQuery];
    
    // Add common variations for aspirin/aspirina
    if (normalizedQuery.includes('aspirin')) {
      queryVariations.push(normalizedQuery.replace('aspirin', 'aspirina'));
    }
    if (normalizedQuery.includes('aspirina')) {
      queryVariations.push(normalizedQuery.replace('aspirina', 'aspirin'));
    }
    
    // Add common variations for paracetamol/acetaminophen
    if (normalizedQuery.includes('paracetamol')) {
      queryVariations.push(normalizedQuery.replace('paracetamol', 'acetaminofen'));
    }
    if (normalizedQuery.includes('acetaminophen')) {
      queryVariations.push(normalizedQuery.replace('acetaminophen', 'paracetamol'));
    }
    
    console.log(`🔍 Searching for medication: "${query}" with variations:`, queryVariations);
    
    const results = medications.filter(med => {
      const normalizedMed = this.normalizeMedicationName(med.Medicinas);
      
      // Try all query variations
      for (const variation of queryVariations) {
        // First try exact match
        if (normalizedMed.includes(variation)) {
          console.log(`✅ Exact match found: "${med.Medicinas}" contains "${variation}"`);
          return true;
        }
        
        // Then try partial word matches
        const queryWords = variation.split(' ').filter(w => w.length > 2);
        const medWords = normalizedMed.split(' ').filter(w => w.length > 2);
        
        const wordMatches = queryWords.filter(qWord => 
          medWords.some(mWord => mWord.includes(qWord) || qWord.includes(mWord))
        );
        
        if (wordMatches.length >= queryWords.length * 0.6) { // At least 60% of words match
          console.log(`✅ Partial match found: "${med.Medicinas}" matches "${variation}" (${wordMatches.length}/${queryWords.length} words)`);
          return true;
        }
      }
      
      return false;
    }).map(med => ({
      ...med,
      similarity: 0.9 // Higher similarity for better matches
    }));
    
    console.log(`🔍 Found ${results.length} matches for "${query}"`);
    return results;
  }

  async getPharmacies() {
    const medications = await this.getMedicationData();
    const pharmacyNames = new Set(medications.map(m => m.Pharmacy));
    return Array.from(pharmacyNames);
  }
}

module.exports = ExcelReaderRNCompatible;
