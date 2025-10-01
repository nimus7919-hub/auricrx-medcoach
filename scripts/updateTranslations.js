#!/usr/bin/env node

/**
 * Translation Update Script
 * 
 * This script helps update translations across all language files.
 * Usage: node scripts/updateTranslations.js
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'es', 'zh', 'pt', 'fr', 'de'];
const I18N_DIR = path.join(__dirname, '..', 'src', 'i18n');

// Load all translation files
const translations = {};
LANGUAGES.forEach(lang => {
  try {
    const filePath = path.join(I18N_DIR, `${lang}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    translations[lang] = JSON.parse(content);
    console.log(`✅ Loaded ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error loading ${lang}.json:`, error.message);
  }
});

// Function to find missing keys
function findMissingKeys() {
  const englishKeys = getAllKeys(translations.en);
  const missingKeys = {};
  
  LANGUAGES.forEach(lang => {
    if (lang === 'en') return;
    
    const langKeys = getAllKeys(translations[lang]);
    const missing = englishKeys.filter(key => !langKeys.includes(key));
    
    if (missing.length > 0) {
      missingKeys[lang] = missing;
    }
  });
  
  return missingKeys;
}

// Function to get all keys from nested object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  
  return keys;
}

// Function to add missing keys with placeholder values
function addMissingKeys() {
  const missingKeys = findMissingKeys();
  
  Object.keys(missingKeys).forEach(lang => {
    console.log(`\n🔍 Missing keys in ${lang}.json:`);
    missingKeys[lang].forEach(key => {
      console.log(`  - ${key}`);
      
      // Add placeholder value
      const keyParts = key.split('.');
      let current = translations[lang];
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      
      // Add placeholder value
      const lastKey = keyParts[keyParts.length - 1];
      current[lastKey] = `[TRANSLATE] ${key}`;
    });
    
    // Save updated file
    const filePath = path.join(I18N_DIR, `${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(translations[lang], null, 2));
    console.log(`✅ Updated ${lang}.json`);
  });
}

// Function to validate all translations have the same structure
function validateStructure() {
  const englishKeys = getAllKeys(translations.en);
  const issues = [];
  
  LANGUAGES.forEach(lang => {
    if (lang === 'en') return;
    
    const langKeys = getAllKeys(translations[lang]);
    const missing = englishKeys.filter(key => !langKeys.includes(key));
    const extra = langKeys.filter(key => !englishKeys.includes(key));
    
    if (missing.length > 0) {
      issues.push(`${lang}: Missing ${missing.length} keys`);
    }
    if (extra.length > 0) {
      issues.push(`${lang}: Extra ${extra.length} keys`);
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ All translation files have consistent structure');
  } else {
    console.log('❌ Translation structure issues:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
}

// Main execution
console.log('🌍 Translation Update Script');
console.log('============================\n');

console.log('1. Validating structure...');
validateStructure();

console.log('\n2. Finding missing keys...');
const missingKeys = findMissingKeys();
if (Object.keys(missingKeys).length === 0) {
  console.log('✅ All translation files are up to date');
} else {
  console.log('❌ Missing keys found in some files');
  addMissingKeys();
}

console.log('\n✨ Translation update complete!');
console.log('\nNext steps:');
console.log('1. Review the [TRANSLATE] placeholders in the updated files');
console.log('2. Replace placeholders with actual translations');
console.log('3. Test the app with different languages');
