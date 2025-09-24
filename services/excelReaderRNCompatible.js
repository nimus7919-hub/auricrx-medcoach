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
        const response = await fetch('./assets/medicationData.json');
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Loaded ${data.length} medications from JSON data`);
          return data;
        }
      } catch (fetchError) {
        console.log('⚠️ Fetch failed, trying require method...');
      }
      
      // Fallback: Try to require the JSON file (for Node.js test environment)
      try {
        const data = require('../assets/medicationData.json');
        console.log(`📊 Loaded ${data.length} medications from require() method`);
        return data;
      } catch (requireError) {
        console.log('⚠️ Require failed, using mock data for testing');
        throw new Error('Both fetch and require failed');
      }
      
    } catch (error) {
      console.log('⚠️ Could not load JSON data, using mock data for testing');
      // Fallback to mock data for testing
      return this.generateMockData(1000);
    }
  }

  // Generate mock data that matches your Excel structure
  generateMockData(count) {
    console.log('📊 Generating mock medication data for React Native...');
    const pharmacies = ['Aurrera', 'Farmacia Benavides', 'farmacia del ahorro', 'farmacia guadalajara', 'HEB', 'Farmacia san Angel', 'farmacia San Pablo', 'farmacia similares'];
    const medicationNames = [
      'Aspirin Protect', 'Advil', 'Viagra', 'Omeprazol', 'Paracetamol', 'Ibuprofeno', 'Amikacin Medimart', 'Ceftriaxone Medimart', 'Postday', 'Fosfonat', 'Aquasol AD.'
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
      console.log('📊 Using cached medication data');
      return cached.data;
    }
    
    const data = await this.loadExcelData();
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
    const medications = await this.getMedicationData();
    
    // More precise search for exact matches first
    const normalizedQuery = this.normalizeMedicationName(query);
    
    const results = medications.filter(med => {
      const normalizedMed = this.normalizeMedicationName(med.Medicinas);
      
      // First try exact match
      if (normalizedMed.includes(normalizedQuery)) {
        return true;
      }
      
      // Then try partial word matches
      const queryWords = normalizedQuery.split(' ').filter(w => w.length > 2);
      const medWords = normalizedMed.split(' ').filter(w => w.length > 2);
      
      const wordMatches = queryWords.filter(qWord => 
        medWords.some(mWord => mWord.includes(qWord) || qWord.includes(mWord))
      );
      
      if (wordMatches.length >= queryWords.length * 0.6) { // At least 60% of words match
        return true;
      }
      
      return false;
    }).map(med => ({
      ...med,
      similarity: 0.9 // Higher similarity for better matches
    }));
    return results;
  }

  async getPharmacies() {
    const medications = await this.getMedicationData();
    const pharmacyNames = new Set(medications.map(m => m.Pharmacy));
    return Array.from(pharmacyNames);
  }
}

module.exports = ExcelReaderRNCompatible;
