// server/auth-utils.js
// Authentication and hashing utilities

const crypto = require('crypto');

// Get hash salt from environment (must be set!)
const SALT = process.env.IDENTITY_HASH_SALT || '';

if (!SALT) {
  console.warn('⚠️ IDENTITY_HASH_SALT not set in environment');
  console.warn('⚠️ Run: openssl rand -hex 32 to generate a secure salt');
  console.warn('⚠️ Trial abuse prevention will not work properly without this!');
}

/**
 * Hash a value for privacy-preserving identity checks
 * @param {string} value - Raw value to hash (email, phone, device ID)
 * @returns {string|null} - SHA-256 hash or null if value is empty
 */
function hash(value) {
  if (!value || !SALT) return null;
  return crypto
    .createHash('sha256')
    .update(SALT + value.toLowerCase().trim())
    .digest('hex');
}

/**
 * Normalize email for consistent hashing
 * @param {string} email - Raw email
 * @returns {string|null} - Lowercased email or null
 */
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

/**
 * Normalize phone to E.164 format for consistent hashing
 * @param {string} phone - Raw phone number
 * @returns {string|null} - E.164 formatted phone or null
 */
function normalizePhone(phone) {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  // Assume US (+1) if 10 digits, otherwise use as-is
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return `+${digits}`;
}

/**
 * Verify Firebase JWT token
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<Object>} - Decoded token with uid, email, etc.
 */
async function verifyToken(token) {
  const admin = require('./firebase-admin');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    throw new Error('Invalid token');
  }
}

module.exports = {
  hash,
  normalizeEmail,
  normalizePhone,
  verifyToken,
};

