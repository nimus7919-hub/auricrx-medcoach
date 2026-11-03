const fs = require('fs');
const path = require('path');
const original = fs.readFileSync;
// Build verification must never open an environment file.
fs.readFileSync = function(file, ...args) {
  if (typeof file === 'string' && /^\.env(?:\.|$)/i.test(path.basename(file))) {
    const error = new Error('Environment files disabled for verification'); error.code = 'ENOENT'; throw error;
  }
  return original.call(this, file, ...args);
};
