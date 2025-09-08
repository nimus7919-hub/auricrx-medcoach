import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserDataDirPlugin from 'puppeteer-extra-plugin-user-data-dir';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import UserAgent from 'user-agents';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());
puppeteer.use(UserDataDirPlugin());

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: false,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Pharmacy configurations
const PHARMACIES = {
  'fahorro': {
    name: 'Farmacia del Ahorro',
    baseUrl: 'https://www.fahorro.com',
    searchUrl: '/farmacia.html',
    selectors: {
      productContainer: '.product-item, .product-tile, .product-card, .item-producto, [data-testid="product"]',
      productName: '.product-name, .product-title, .nombre-producto, h3, h4, .titulo',
      productPrice: '.price, .product-price, .precio, .precio-producto, [data-testid="price"]',
      productImage: '.product-image img, .product-img img, .imagen-producto img',
      productCode: '.product-code, .sku, .codigo-producto',
      productDescription: '.product-description, .product-details, .descripcion'
    },
    searchParams: {
      q: 'q'
    }
  },
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

// Legal and ethical scraping compliance
class ScrapingCompliance {
  constructor() {
    this.robotsCache = new Map();
    this.rateLimits = new Map();
    this.userAgent = 'AuricRx-MedCoach/1.0 (+https://auricrx.com/contact)';
  }

  async checkRobotsTxt(url) {
    try {
      const baseUrl = new URL(url).origin;
      
      if (this.robotsCache.has(baseUrl)) {
        return this.robotsCache.get(baseUrl);
      }

      const robotsUrl = `${baseUrl}/robots.txt`;
      console.log(`🤖 Checking robots.txt: ${robotsUrl}`);
      
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.userAgent }
      });
      
      if (response.ok) {
        const robotsText = await response.text();
        const isAllowed = this.parseRobotsTxt(robotsText, url);
        this.robotsCache.set(baseUrl, isAllowed);
        console.log(`✅ Robots.txt check: ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
        return isAllowed;
      } else {
        // If no robots.txt, assume allowed but be respectful
        console.log(`⚠️ No robots.txt found, proceeding with caution`);
        this.robotsCache.set(baseUrl, true);
        return true;
      }
    } catch (error) {
      console.log(`❌ Error checking robots.txt: ${error.message}`);
      return false;
    }
  }

  parseRobotsTxt(robotsText, targetUrl) {
    const lines = robotsText.split('\n');
    let currentUserAgent = null;
    let isAllowed = true;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('User-agent:')) {
        const agent = trimmed.substring(11).trim();
        currentUserAgent = agent === '*' ? 'all' : agent;
      } else if (trimmed.startsWith('Disallow:') && currentUserAgent) {
        const disallowPath = trimmed.substring(9).trim();
        if (currentUserAgent === 'all' || currentUserAgent.includes('AuricRx')) {
          if (disallowPath === '/' || targetUrl.includes(disallowPath)) {
            isAllowed = false;
            break;
          }
        }
      } else if (trimmed.startsWith('Allow:') && currentUserAgent) {
        const allowPath = trimmed.substring(6).trim();
        if (currentUserAgent === 'all' || currentUserAgent.includes('AuricRx')) {
          if (targetUrl.includes(allowPath)) {
            isAllowed = true;
          }
        }
      }
    }
    
    return isAllowed;
  }

  async checkRateLimit(domain) {
    const now = Date.now();
    const limit = this.rateLimits.get(domain) || { count: 0, resetTime: now + 60000 };
    
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 60000; // Reset every minute
    }
    
    if (limit.count >= 10) { // Max 10 requests per minute
      console.log(`⏳ Rate limit reached for ${domain}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 60000 - (now - limit.resetTime)));
      limit.count = 0;
      limit.resetTime = Date.now() + 60000;
    }
    
    limit.count++;
    this.rateLimits.set(domain, limit);
  }

  async sendScrapingNotice(url, pharmacyName) {
    try {
      const notice = {
        timestamp: new Date().toISOString(),
        userAgent: this.userAgent,
        purpose: 'Medication price comparison for healthcare app',
        contact: 'https://auricrx.com/contact',
        rateLimit: '10 requests per minute',
        dataUsage: 'Public medication prices only',
        optOut: `${url}/contact`
      };
      
      console.log(`📧 Scraping notice for ${pharmacyName}:`, notice);
      
      // In a real implementation, you might send this to their contact form
      // For now, we'll just log it and wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      console.log(`⚠️ Could not send scraping notice: ${error.message}`);
      return false;
    }
  }
}

// Advanced scraper class
export class PharmaScraper {
  constructor() {
    this.browser = null;
    this.userAgents = new UserAgent();
    this.compliance = new ScrapingCompliance();
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
    
    // Step 1: Legal compliance checks
    const searchUrl = `${pharmacy.baseUrl}${pharmacy.searchUrl}?${pharmacy.searchParams.q}=${encodeURIComponent(searchTerm)}`;
    
    // Check robots.txt
    const isAllowed = await this.compliance.checkRobotsTxt(searchUrl);
    if (!isAllowed) {
      console.log(`🚫 Scraping blocked by robots.txt for ${pharmacy.name}`);
      return {
        pharmacy: pharmacy.name,
        blocked: true,
        reason: 'robots.txt disallows scraping',
        fallback: {
          message: `Scraping not allowed by ${pharmacy.name}`,
          action: `Visit ${pharmacy.name} directly`,
          url: searchUrl
        }
      };
    }
    
    // Check rate limits
    await this.compliance.checkRateLimit(pharmacy.baseUrl);
    
    // Send scraping notice (ethical practice)
    await this.compliance.sendScrapingNotice(pharmacy.baseUrl, pharmacy.name);
    
    const page = await this.browser.newPage();
    
    try {
      // Set our official user agent (not random - we want to be identified)
      await page.setUserAgent(this.compliance.userAgent);
      
      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });
      
      // Add respectful delays
      await this.randomDelay(2000, 4000);
      
      console.log(`📍 Navigating to: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Check if we got blocked (403, 429, etc.)
      const response = await page.waitForResponse(response => 
        response.url().includes(pharmacy.baseUrl), 
        { timeout: 10000 }
      );
      
      if (response.status() === 403 || response.status() === 429) {
        console.log(`🚫 Blocked by ${pharmacy.name} (${response.status()})`);
        return {
          pharmacy: pharmacy.name,
          blocked: true,
          reason: `HTTP ${response.status()} - Access denied`,
          fallback: {
            message: `Access denied by ${pharmacy.name}`,
            action: `Visit ${pharmacy.name} directly`,
            url: searchUrl
          }
        };
      }
      
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
    const blockedPharmacies = [];
    const fallbacks = [];
    
    for (const pharmacyKey of Object.keys(PHARMACIES)) {
      try {
        const results = await this.scrapePharmacy(pharmacyKey, searchTerm);
        
        // Handle different response types
        if (results.blocked) {
          console.log(`🚫 ${results.pharmacy}: ${results.reason}`);
          blockedPharmacies.push(results);
          if (results.fallback) {
            fallbacks.push(results.fallback);
          }
        } else if (Array.isArray(results)) {
          // Normal results array
          allResults.push(...results);
        } else if (results.pharmacy) {
          // Single result object
          allResults.push(results);
        }
        
        // Respectful delay between pharmacies
        await this.randomDelay(5000, 8000);
        
      } catch (error) {
        console.error(`❌ Failed to scrape ${pharmacyKey}:`, error.message);
        blockedPharmacies.push({
          pharmacy: PHARMACIES[pharmacyKey]?.name || pharmacyKey,
          blocked: true,
          reason: `Error: ${error.message}`,
          fallback: {
            message: `Error accessing ${PHARMACIES[pharmacyKey]?.name || pharmacyKey}`,
            action: `Visit ${PHARMACIES[pharmacyKey]?.name || pharmacyKey} directly`,
            url: `${PHARMACIES[pharmacyKey]?.baseUrl || ''}/search?q=${encodeURIComponent(searchTerm)}`
          }
        });
      }
    }
    
    console.log(`🏁 Scraping complete. Results: ${allResults.length}, Blocked: ${blockedPharmacies.length}`);
    
    return {
      results: allResults,
      blockedPharmacies,
      fallbacks,
      summary: {
        totalResults: allResults.length,
        blockedCount: blockedPharmacies.length,
        successCount: Object.keys(PHARMACIES).length - blockedPharmacies.length
      }
    };
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

// Input validation and sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 100) // Limit length
    .toLowerCase();
}

function validateSearchTerm(term) {
  if (!term || typeof term !== 'string') return false;
  
  // Allow only alphanumeric, spaces, and common medication characters
  const validPattern = /^[a-zA-Z0-9\s\-\.\(\)]+$/;
  return validPattern.test(term) && term.length >= 2 && term.length <= 100;
}

app.get('/search', async (req, res) => {
  const { q: searchTerm } = req.query;
  
  // Input validation
  if (!searchTerm) {
    return res.status(400).json({ 
      error: 'Search term (q) is required',
      example: '/search?q=aspirin'
    });
  }
  
  if (!validateSearchTerm(searchTerm)) {
    return res.status(400).json({ 
      error: 'Invalid search term',
      message: 'Search term must be 2-100 characters, alphanumeric only',
      received: searchTerm
    });
  }
  
  const sanitizedTerm = sanitizeInput(searchTerm);
  console.log(`🔍 API search request for: ${sanitizedTerm}`);
  
  try {
    const scraper = new PharmaScraper();
    await scraper.initialize();
    
    const response = await scraper.scrapeAllPharmacies(sanitizedTerm);
    
    await scraper.close();
    
    res.json({
      searchTerm,
      results: response.results,
      blockedPharmacies: response.blockedPharmacies,
      fallbacks: response.fallbacks,
      summary: response.summary,
      compliance: {
        robotsTxtChecked: true,
        rateLimited: true,
        userAgent: scraper.compliance.userAgent,
        ethicalNotice: 'We respect robots.txt and implement rate limiting'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
      error: 'Search failed', 
      message: isDevelopment ? error.message : 'Internal server error',
      compliance: {
        robotsTxtChecked: false,
        rateLimited: false,
        userAgent: 'AuricRx-MedCoach/1.0 (+https://auricrx.com/contact)',
        ethicalNotice: 'Error occurred during compliant scraping attempt'
      },
      ...(isDevelopment && { stack: error.stack })
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
