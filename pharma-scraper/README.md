# Pharmaceutical Price Scraper Bot

An advanced web scraping bot that intelligently extracts medication prices, dosages, and details from multiple pharmacy websites.

## Features

🤖 **Intelligent Scraping**
- Multi-pharmacy support (San Pablo, CVS, Walgreens, etc.)
- Advanced bot evasion techniques
- Dynamic selector adaptation
- Real-time price extraction

🧠 **Smart Data Processing**
- Automatic dosage/strength extraction
- Medication name normalization
- Price standardization
- Form detection (tablet, capsule, liquid, etc.)

🛡️ **Bot Protection Evasion**
- Stealth mode with Puppeteer
- Random user agent rotation
- Intelligent delays and timeouts
- CAPTCHA handling capabilities

📊 **Structured Data Output**
- Standardized medication format
- Cross-pharmacy price comparison
- Real-time availability status
- Comprehensive product details

## Quick Start

```bash
# Install dependencies
npm install

# Start the scraper API
npm start

# Test the scraper
npm test
```

## API Endpoints

### Search Medications
```bash
GET /search?q=aspirin%20100mg
```

### List Available Pharmacies
```bash
GET /pharmacies
```

### Health Check
```bash
GET /health
```

## Example Response

```json
{
  "searchTerm": "aspirin 100mg",
  "totalResults": 5,
  "results": [
    {
      "name": "Aspirin Protect",
      "genericName": "acetylsalicylic acid",
      "dosage": "100mg",
      "strength": "100mg",
      "form": "tablet",
      "quantity": 28,
      "price": 12.99,
      "currency": "USD",
      "pharmacy": "CVS Pharmacy",
      "productCode": "CVS-12345",
      "imageUrl": "https://...",
      "availability": "in-stock",
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Supported Pharmacies

- **Farmacia San Pablo** (Mexico)
- **CVS Pharmacy** (US)
- **Walgreens** (US)
- *More pharmacies can be easily added*

## Advanced Features

### Bot Evasion
- Stealth mode with advanced fingerprint masking
- Random delays between requests
- User agent rotation
- Cookie and session management

### Data Intelligence
- Automatic medication name normalization
- Dosage and strength extraction
- Form detection (tablet, capsule, etc.)
- Price standardization across currencies

### Scalability
- Concurrent scraping capabilities
- Rate limiting and throttling
- Error handling and retry logic
- Comprehensive logging

## Configuration

The scraper can be configured through environment variables:

```bash
PORT=3001
SCRAPING_DELAY_MIN=1000
SCRAPING_DELAY_MAX=3000
TARGET_PHARMACIES=san-pablo,cvs,walgreens
```

## Legal Notice

This tool is for educational and research purposes. Always respect website terms of service and implement appropriate rate limiting. Consider reaching out to pharmacies for official API access when available.

## Contributing

1. Add new pharmacy configurations in `PHARMACIES` object
2. Implement custom selectors for each pharmacy
3. Test with various medication types
4. Submit pull requests for improvements

## License

MIT License - Use responsibly and ethically.
