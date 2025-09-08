import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserDataDirPlugin from 'puppeteer-extra-plugin-user-data-dir';
import express from 'express';
import cors from 'cors';
import UserAgent from 'user-agents';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());
puppeteer.use(UserDataDirPlugin());

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Pharmacy configurations
const PHARMACIES = {
  'san-pablo': {
    name: 'Farmacia San Pablo',
    baseUrl: 'https://www.farmaciasanpablo.com.mx',
    searchUrl: '/search',
    selectors: {
      productContainer: '.product-item, .product-tile, [data-testid="product"]',
      productName: '.product-name, .product-title, h3, h4',
      productPrice: '.price, .product-price, [data-testid="price"]',
      productImage: '.product-image img, .product-img img',
      productCode: '.product-code, .sku',
      productDescription: '.product-description, .product-details'
    },
    searchParams: {
      q: 'q'
    }
  },
  'cvs': {
    name: 'CVS Pharmacy',
    baseUrl: 'https://www.cvs.com',
    searchUrl: '/search',
    selectors: {
      productContainer: '.product-item, .product-tile',
      productName: '.product-name, .product-title',
      productPrice: '.price, .product-price',
      productImage: '.product-image img',
      productCode: '.product-code, .sku'
    },
    searchParams: {
      q: 'searchTerm'
    }
  }
};

// Medication data structure
class MedicationData {
  constructor() {
    this.name = null;
    this.genericName = null;
    this.dosage = null;
    this.strength = null;
    this.form = null; // tablet, capsule, liquid, etc.
    this.quantity = null;
    this.price = null;
    this.currency = 'USD';
    this.pharmacy = null;
    this.productCode = null;
    this.imageUrl = null;
    this.description = null;
    this.availability = null;
    this.lastUpdated = new Date();
  }

  normalize() {
    // Extract dosage and strength from name
    this.extractDosageStrength();
    // Normalize medication name
    this.normalizeName();
    // Clean price
    this.normalizePrice();
  }

  extractDosageStrength() {
    if (!this.name) return;
    
    const name = this.name.toLowerCase();
    
    // Extract strength (e.g., "100mg", "500mg")
    const strengthMatch = name.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|mcg)/i);
    if (strengthMatch) {
      this.strength = `${strengthMatch[1]}${strengthMatch[2]}`;
    }
    
    // Extract form (tablet, capsule, etc.)
    const formMatch = name.match(/(tablet|capsule|liquid|syrup|injection|cream|gel|patch)/i);
    if (formMatch) {
      this.form = formMatch[1];
    }
    
    // Extract quantity (e.g., "28 tablets", "30 count")
    const quantityMatch = name.match(/(\d+)\s*(tablet|capsule|count|piece)/i);
    if (quantityMatch) {
      this.quantity = parseInt(quantityMatch[1]);
    }
  }

  normalizeName() {
    if (!this.name) return;
    
    // Remove common suffixes and clean up
    this.name = this.name
      .replace(/\s+(tablet|capsule|liquid|syrup|injection|cream|gel|patch).*$/i, '')
      .replace(/\s+\d+(mg|mcg|g|ml).*$/i, '')
      .trim();
  }

  normalizePrice() {
    if (!this.price) return;
    
    // Extract numeric price
    const priceMatch = this.price.toString().match(/[\d,]+\.?\d*/);
    if (priceMatch) {
      this.price = parseFloat(priceMatch[0].replace(/,/g, ''));
    }
  }
}

// Advanced scraper class
export class PharmaScraper {
  constructor() {
    this.browser = null;
    this.userAgents = new UserAgent();
  }

  async initialize() {
    console.log('🚀 Initializing pharmaceutical scraper...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    console.log('✅ Browser initialized');
  }

  async scrapePharmacy(pharmacyKey, searchTerm) {
    const pharmacy = PHARMACIES[pharmacyKey];
    if (!pharmacy) {
      throw new Error(`Unknown pharmacy: ${pharmacyKey}`);
    }

    console.log(`🔍 Scraping ${pharmacy.name} for: ${searchTerm}`);
    
    const page = await this.browser.newPage();
    
    try {
      // Set random user agent
      const userAgent = this.userAgents.toString();
      await page.setUserAgent(userAgent);
      
      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });
      
      // Add random delays to avoid detection
      await this.randomDelay(1000, 3000);
      
      // Navigate to search page
      const searchUrl = `${pharmacy.baseUrl}${pharmacy.searchUrl}?${pharmacy.searchParams.q}=${encodeURIComponent(searchTerm)}`;
      console.log(`📍 Navigating to: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for products to load
      await this.randomDelay(2000, 4000);
      
      // Extract product data
      const products = await page.evaluate((selectors) => {
        const productElements = document.querySelectorAll(selectors.productContainer);
        const results = [];
        
        productElements.forEach((element, index) => {
          try {
            const nameEl = element.querySelector(selectors.productName);
            const priceEl = element.querySelector(selectors.productPrice);
            const imageEl = element.querySelector(selectors.productImage);
            const codeEl = element.querySelector(selectors.productCode);
            const descEl = element.querySelector(selectors.productDescription);
            
            if (nameEl && priceEl) {
              results.push({
                name: nameEl.textContent?.trim() || null,
                price: priceEl.textContent?.trim() || null,
                imageUrl: imageEl?.src || imageEl?.getAttribute('data-src') || null,
                productCode: codeEl?.textContent?.trim() || null,
                description: descEl?.textContent?.trim() || null,
                index: index
              });
            }
          } catch (error) {
            console.error('Error extracting product data:', error);
          }
        });
        
        return results;
      }, pharmacy.selectors);
      
      console.log(`📊 Found ${products.length} products from ${pharmacy.name}`);
      
      // Convert to MedicationData objects
      const medications = products.map(product => {
        const med = new MedicationData();
        med.name = product.name;
        med.price = product.price;
        med.imageUrl = product.imageUrl;
        med.productCode = product.productCode;
        med.description = product.description;
        med.pharmacy = pharmacy.name;
        med.normalize();
        return med;
      });
      
      return medications;
      
    } catch (error) {
      console.error(`❌ Error scraping ${pharmacy.name}:`, error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  async scrapeAllPharmacies(searchTerm) {
    console.log(`🎯 Starting comprehensive search for: ${searchTerm}`);
    
    const allResults = [];
    
    for (const pharmacyKey of Object.keys(PHARMACIES)) {
      try {
        const results = await this.scrapePharmacy(pharmacyKey, searchTerm);
        allResults.push(...results);
        
        // Random delay between pharmacies
        await this.randomDelay(3000, 6000);
        
      } catch (error) {
        console.error(`Failed to scrape ${pharmacyKey}:`, error.message);
      }
    }
    
    console.log(`🏁 Scraping complete. Total results: ${allResults.length}`);
    return allResults;
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// API endpoints
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pharmaceutical Scraper API',
    version: '1.0.0',
    endpoints: {
      'GET /search?q=medication': 'Search for medication across all pharmacies',
      'GET /pharmacies': 'List available pharmacies',
      'GET /health': 'Health check'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/pharmacies', (req, res) => {
  const pharmacies = Object.keys(PHARMACIES).map(key => ({
    id: key,
    name: PHARMACIES[key].name,
    baseUrl: PHARMACIES[key].baseUrl
  }));
  res.json({ pharmacies });
});

app.get('/search', async (req, res) => {
  const { q: searchTerm } = req.query;
  
  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term (q) is required' });
  }
  
  console.log(`🔍 API search request for: ${searchTerm}`);
  
  try {
    const scraper = new PharmaScraper();
    await scraper.initialize();
    
    const results = await scraper.scrapeAllPharmacies(searchTerm);
    
    await scraper.close();
    
    res.json({
      searchTerm,
      totalResults: results.length,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pharmaceutical Scraper API running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /search?q=aspirin`);
  console.log(`   GET  /pharmacies`);
  console.log(`   GET  /health`);
});
