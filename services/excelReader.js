// services/excelReader.js
// Service for reading medication prices from Excel file

const XLSX = require('xlsx');

class ExcelReader {
  constructor() {
    // Use a relative path that works in React Native
    this.excelPath = './Medication prices/pharmacias_cleaned modded.xlsm';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Read and parse the Excel file
  async readMedicationData() {
    try {
      console.log('📊 Reading Excel file:', this.excelPath);
      
      // In React Native, we'll try to read the file directly
      // If it fails, we'll catch the error and handle it gracefully

      // Read the workbook
      const workbook = XLSX.readFile(this.excelPath);
      
      // Get the "Main" sheet
      const sheetName = 'Main';
      if (!workbook.Sheets[sheetName]) {
        throw new Error(`Sheet "${sheetName}" not found in Excel file`);
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      console.log(`📊 Found ${jsonData.length} rows in Excel file`);

      // Parse the data
      const medications = jsonData.map((row, index) => {
        try {
          // Debug: Log first few rows to see the structure
          if (index < 3) {
            console.log(`🔍 Row ${index} structure:`, Object.keys(row));
            console.log(`🔍 Row ${index} data:`, row);
          }
          
          return {
            id: `med_${index}`,
            farmacia: this.cleanString(row.Pharmacy || ''),
            medicinas: this.cleanString(row.Medicinas || ''),
            precioOriginal: this.parsePrice(row['original price'] || 0),
            unidades: this.cleanString(row.unidades || ''),
            // Normalized fields for matching
            _medicinasNorm: this.normalizeMedicationName(row.Medicinas || ''),
            _farmaciaNorm: this.normalizePharmacyName(row.Pharmacy || ''),
            _strengthMg: this.extractStrength(row.Medicinas || ''),
            _packSize: this.extractPackSize(row.unidades || '')
          };
        } catch (error) {
          console.warn(`⚠️ Error parsing row ${index}:`, error.message);
          return null;
        }
      }).filter(Boolean);

      console.log(`📊 Successfully parsed ${medications.length} medications`);
      
      // Cache the data
      this.cache.set('medications', {
        data: medications,
        timestamp: Date.now()
      });

      return medications;
    } catch (error) {
      console.error('❌ Error reading Excel file:', error);
      throw error;
    }
  }

  // Clean string data
  cleanString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim();
  }

  // Parse price from MXN format
  parsePrice(priceStr) {
    if (!priceStr) return 0;
    
    // Handle both string and number inputs
    let price;
    if (typeof priceStr === 'number') {
      price = priceStr;
    } else {
      // Remove "MXN" prefix and extract number
      const cleanPrice = String(priceStr).replace(/MXN\s*/g, '').replace(/[^\d.]/g, '');
      price = parseFloat(cleanPrice);
    }
    
    return isNaN(price) ? 0 : price;
  }

  // Normalize medication name for matching
  normalizeMedicationName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, ' ') // Keep only letters, numbers, spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Normalize pharmacy name for matching
  normalizePharmacyName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, ' ') // Keep only letters, numbers, spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Extract strength in mg from medication name
  extractStrength(name) {
    if (!name) return null;
    
    const normalized = this.normalizeMedicationName(name);
    
    // Look for patterns like "100 mg", "500mg", "1.5 mg"
    const mgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mg/);
    if (mgMatch) {
      return parseFloat(mgMatch[1]);
    }
    
    // Look for patterns like "100mcg", "500 mcg"
    const mcgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mcg/);
    if (mcgMatch) {
      return parseFloat(mcgMatch[1]) / 1000; // Convert mcg to mg
    }
    
    return null;
  }

  // Extract pack size from unidades
  extractPackSize(unidades) {
    if (!unidades) return null;
    
    const normalized = this.normalizeMedicationName(unidades);
    
    // Look for numbers in unidades
    const numberMatch = normalized.match(/(\d+)/);
    if (numberMatch) {
      return parseInt(numberMatch[1], 10);
    }
    
    return null;
  }

  // Get cached data or refresh if expired
  async getMedicationData() {
    const cached = this.cache.get('medications');
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log('📊 Using cached medication data');
      return cached.data;
    }
    
    console.log('📊 Refreshing medication data from Excel');
    return await this.readMedicationData();
  }

  // Search for medications by name (fuzzy matching)
  async searchMedications(searchTerm, options = {}) {
    const medications = await this.getMedicationData();
    const normalizedSearch = this.normalizeMedicationName(searchTerm);
    
    if (!normalizedSearch) return [];
    
    const results = medications.map(med => {
      const similarity = this.calculateSimilarity(normalizedSearch, med._medicinasNorm);
      return { ...med, similarity };
    })
    .filter(med => med.similarity > 0.3) // Minimum similarity threshold
    .sort((a, b) => b.similarity - a.similarity); // Sort by similarity
    
    console.log(`🔍 Found ${results.length} similar medications for "${searchTerm}"`);
    
    return results;
  }

  // Calculate similarity between two strings
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const tokens1 = str1.split(' ').filter(t => t.length > 1);
    const tokens2 = str2.split(' ').filter(t => t.length > 1);
    
    if (tokens1.length === 0 || tokens2.length === 0) return 0;
    
    // Count common tokens
    const commonTokens = tokens1.filter(token => 
      tokens2.some(t2 => t2.includes(token) || token.includes(t2))
    );
    
    // Calculate similarity score
    const maxTokens = Math.max(tokens1.length, tokens2.length);
    return commonTokens.length / maxTokens;
  }

  // Get medications by pharmacy
  async getMedicationsByPharmacy(pharmacyName) {
    const medications = await this.getMedicationData();
    const normalizedPharmacy = this.normalizePharmacyName(pharmacyName);
    
    return medications.filter(med => 
      med._farmaciaNorm.includes(normalizedPharmacy) || 
      normalizedPharmacy.includes(med._farmaciaNorm)
    );
  }

  // Get all unique pharmacies
  async getPharmacies() {
    const medications = await this.getMedicationData();
    const pharmacies = [...new Set(medications.map(med => med.farmacia))];
    return pharmacies.filter(Boolean);
  }
}

module.exports = ExcelReader;
