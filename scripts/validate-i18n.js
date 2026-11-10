#!/usr/bin/env node
/**
 * I18n Validation Script
 * 
 * Checks for:
 * 1. Missing keys in non-English locales
 * 2. Placeholder mismatches ({{var}} interpolations)
 * 3. Encoding corruption (?, mojibake)
 * 4. Keys present in other locales but not in en.json
 */

const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'zh'];
const I18N_DIR = path.join(__dirname, '../src/i18n');

// Load all locale files
function loadLocales() {
  const locales = {};
  for (const locale of LOCALES) {
    const filePath = path.join(I18N_DIR, `${locale}.json`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      locales[locale] = JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error loading ${locale}.json:`, error.message);
      process.exit(1);
    }
  }
  return locales;
}

// Get all keys from an object (nested dot notation)
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Extract placeholders from a string
function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{[^}]+\}\}/g) || [];
  return matches.map(m => m.slice(2, -2).trim()).sort();
}

// Check for encoding corruption
function checkEncoding(str, locale) {
  if (typeof str !== 'string') return [];
  const issues = [];
  
  // Check for literal '?' that might be corruption
  if (locale === 'zh' && str.includes('?') && !str.match(/\?$/)) {
    issues.push('Possible corruption: unexpected ? in Chinese text');
  }
  
  // Check for mojibake patterns
  const mojibakePatterns = [
    /Ã³/,  // ó corrupted
    /Ã¡/,  // á corrupted
    /Ã­/,  // í corrupted
    /Ã©/,  // é corrupted
    /Ã±/,  // ñ corrupted
    /Â£/,  // £ corrupted
    /â€™/, // ' corrupted
    /â€œ/, // " corrupted
    /â€/,  // " corrupted
  ];
  
  for (const pattern of mojibakePatterns) {
    if (pattern.test(str)) {
      issues.push(`Mojibake detected: ${str.match(pattern)[0]}`);
    }
  }
  
  return issues;
}

// Main validation
function validate() {
  console.log('🔍 Validating i18n files...\n');
  
  const locales = loadLocales();
  const enKeys = getAllKeys(locales.en);
  const results = {
    missing: {},
    extra: {},
    placeholderMismatches: {},
    encodingIssues: {},
  };
  
  // Check each non-English locale
  for (const locale of LOCALES) {
    if (locale === 'en') continue;
    
    const localeKeys = getAllKeys(locales[locale]);
    const missing = enKeys.filter(k => !localeKeys.includes(k));
    const extra = localeKeys.filter(k => !enKeys.includes(k));
    
    if (missing.length > 0) {
      results.missing[locale] = missing;
    }
    
    if (extra.length > 0) {
      results.extra[locale] = extra;
    }
    
    // Check placeholders for keys that exist in both
    const commonKeys = enKeys.filter(k => localeKeys.includes(k));
    const placeholderIssues = [];
    const encodingProblems = [];
    
    for (const key of commonKeys) {
      // Get values
      const enValue = getValueByPath(locales.en, key);
      const localeValue = getValueByPath(locales[locale], key);
      
      // Check placeholders
      const enPlaceholders = extractPlaceholders(enValue);
      const localePlaceholders = extractPlaceholders(localeValue);
      
      if (JSON.stringify(enPlaceholders) !== JSON.stringify(localePlaceholders)) {
        placeholderIssues.push({
          key,
          enPlaceholders,
          localePlaceholders,
        });
      }
      
      // Check encoding
      const encodingIssues = checkEncoding(localeValue, locale);
      if (encodingIssues.length > 0) {
        encodingProblems.push({
          key,
          value: localeValue,
          issues: encodingIssues,
        });
      }
    }
    
    if (placeholderIssues.length > 0) {
      results.placeholderMismatches[locale] = placeholderIssues;
    }
    
    if (encodingProblems.length > 0) {
      results.encodingIssues[locale] = encodingProblems;
    }
  }
  
  // Print results
  let hasErrors = false;
  
  console.log('📊 Summary:\n');
  for (const locale of LOCALES) {
    if (locale === 'en') continue;
    
    const missingCount = results.missing[locale]?.length || 0;
    const extraCount = results.extra[locale]?.length || 0;
    const placeholderCount = results.placeholderMismatches[locale]?.length || 0;
    const encodingCount = results.encodingIssues[locale]?.length || 0;
    
    console.log(`${locale.toUpperCase()}:`);
    console.log(`  Missing keys: ${missingCount}`);
    console.log(`  Extra keys: ${extraCount}`);
    console.log(`  Placeholder mismatches: ${placeholderCount}`);
    console.log(`  Encoding issues: ${encodingCount}`);
    console.log('');
    
    if (missingCount > 0 || placeholderCount > 0 || encodingCount > 0) {
      hasErrors = true;
    }
  }
  
  // Print details if there are issues
  if (hasErrors) {
    console.log('\n❌ Issues found:\n');
    
    // Missing keys
    for (const locale in results.missing) {
      if (results.missing[locale].length > 0) {
        console.log(`\n${locale.toUpperCase()} - Missing ${results.missing[locale].length} keys:`);
        console.log(results.missing[locale].slice(0, 10).join('\n'));
        if (results.missing[locale].length > 10) {
          console.log(`... and ${results.missing[locale].length - 10} more`);
        }
      }
    }
    
    // Placeholder mismatches
    for (const locale in results.placeholderMismatches) {
      if (results.placeholderMismatches[locale].length > 0) {
        console.log(`\n${locale.toUpperCase()} - Placeholder mismatches:`);
        results.placeholderMismatches[locale].slice(0, 5).forEach(issue => {
          console.log(`  ${issue.key}`);
          console.log(`    EN: [${issue.enPlaceholders.join(', ')}]`);
          console.log(`    ${locale}: [${issue.localePlaceholders.join(', ')}]`);
        });
        if (results.placeholderMismatches[locale].length > 5) {
          console.log(`  ... and ${results.placeholderMismatches[locale].length - 5} more`);
        }
      }
    }
    
    // Encoding issues
    for (const locale in results.encodingIssues) {
      if (results.encodingIssues[locale].length > 0) {
        console.log(`\n${locale.toUpperCase()} - Encoding issues:`);
        results.encodingIssues[locale].slice(0, 5).forEach(issue => {
          console.log(`  ${issue.key}`);
          console.log(`    ${issue.issues.join(', ')}`);
        });
        if (results.encodingIssues[locale].length > 5) {
          console.log(`  ... and ${results.encodingIssues[locale].length - 5} more`);
        }
      }
    }
  } else {
    console.log('✅ All locales are valid!\n');
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '../i18n-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📝 Detailed report saved to: ${reportPath}`);
  
  process.exit(hasErrors ? 1 : 0);
}

// Helper to get value by dot notation path
function getValueByPath(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

validate();
