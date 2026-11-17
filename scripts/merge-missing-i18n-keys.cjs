#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function deepMergeMissing(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
      deepMergeMissing(target[key], value);
    } else if (!(key in target)) {
      target[key] = value;
    }
  }
  return target;
}

const dir = path.join(__dirname, '../src/i18n');
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'));
for (const lng of ['es', 'fr', 'de', 'pt', 'zh']) {
  const file = path.join(dir, `${lng}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepMergeMissing(data, en);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log('merged', lng);
}
