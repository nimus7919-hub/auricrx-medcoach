// services/pharmacySearchTypes.js
// Simplified types for pharmacy search

// Basic types that can be used in JavaScript
const Pharmacy = {
  id: 'string',
  name: 'string', 
  lat: 'number',
  lon: 'number',
  address: 'string',
  logoUrl: 'string?',
  distanceMiles: 'number?'
};

const StorePrice = {
  ...Pharmacy,
  price: 'number',
  pickup: 'boolean?',
  delivery: 'boolean?',
  requiresCoupon: 'boolean?'
};

module.exports = {
  Pharmacy,
  StorePrice
};
