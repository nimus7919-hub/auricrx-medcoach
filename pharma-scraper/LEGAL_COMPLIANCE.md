# Legal Compliance & Ethical Scraping Policy

## 🏛️ Legal Framework

Our pharmaceutical scraper operates under the following legal and ethical principles:

### 1. **Robots.txt Compliance**
- ✅ **Always checks robots.txt** before scraping
- ✅ **Respects disallow directives** 
- ✅ **Follows allow directives** when specified
- ✅ **Caches robots.txt** to avoid repeated requests

### 2. **Rate Limiting & Respectful Access**
- ✅ **Maximum 10 requests per minute** per domain
- ✅ **5-8 second delays** between pharmacy requests
- ✅ **2-4 second delays** between page interactions
- ✅ **Automatic backoff** when rate limited

### 3. **Transparent Identification**
- ✅ **Clear User-Agent**: `AuricRx-MedCoach/1.0 (+https://auricrx.com/contact)`
- ✅ **Contact information** provided in all requests
- ✅ **Purpose statement** included in scraping notices
- ✅ **Opt-out mechanism** for pharmacies

### 4. **Data Usage Ethics**
- ✅ **Public data only** - no private/restricted information
- ✅ **Medication prices** - publicly available pricing
- ✅ **No personal data** collection
- ✅ **No account credentials** required

## 📋 Compliance Checklist

### Before Scraping:
- [ ] Check robots.txt
- [ ] Verify rate limits
- [ ] Send scraping notice
- [ ] Use official user agent
- [ ] Set respectful delays

### During Scraping:
- [ ] Monitor response codes
- [ ] Respect 403/429 blocks
- [ ] Maintain rate limits
- [ ] Log all activities
- [ ] Handle errors gracefully

### After Scraping:
- [ ] Provide fallback options
- [ ] Report blocked pharmacies
- [ ] Maintain compliance logs
- [ ] Update robots.txt cache

## 🚫 What We DON'T Do

- ❌ **Bypass robots.txt** restrictions
- ❌ **Ignore rate limits** or blocks
- ❌ **Use fake user agents** or stealth mode
- ❌ **Scrape private data** or accounts
- ❌ **Overwhelm servers** with requests
- ❌ **Circumvent security** measures

## 📞 Contact & Opt-Out

### For Pharmacies:
If you want to opt-out of our scraping:

1. **Add to robots.txt**:
   ```
   User-agent: AuricRx-MedCoach
   Disallow: /
   ```

2. **Contact us directly**:
   - Email: contact@auricrx.com
   - Website: https://auricrx.com/contact

3. **Block our user agent**:
   - Server-level blocking of `AuricRx-MedCoach`

### For Users:
- **Data source**: Public medication prices only
- **Purpose**: Healthcare price comparison
- **Contact**: https://auricrx.com/contact
- **Privacy**: No personal data collected

## ⚖️ Legal Basis

### Fair Use Doctrine:
- **Purpose**: Healthcare price comparison (non-commercial)
- **Nature**: Public medication pricing data
- **Amount**: Minimal data extraction (name, price, dosage)
- **Effect**: No market impact on original work

### Public Information:
- **Medication prices** are publicly displayed
- **Product information** is publicly available
- **No authentication** required to view data
- **No terms of service** violations

## 🔄 Continuous Compliance

### Monitoring:
- **Daily robots.txt checks**
- **Rate limit monitoring**
- **Response code tracking**
- **Error rate analysis**

### Updates:
- **Regular compliance reviews**
- **Legal framework updates**
- **Pharmacy policy changes**
- **Technology improvements**

## 📊 Compliance Metrics

### Success Indicators:
- ✅ **95%+ robots.txt compliance**
- ✅ **<1% rate limit violations**
- ✅ **<5% blocked requests**
- ✅ **100% transparent identification**

### Reporting:
- **Monthly compliance reports**
- **Pharmacy feedback integration**
- **Legal review updates**
- **Public transparency logs**

---

**Last Updated**: January 2024  
**Next Review**: April 2024  
**Legal Contact**: legal@auricrx.com
