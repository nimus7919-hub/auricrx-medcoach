// services/pharmacy.js
// Temporary stub so the app runs. We’ll wire to real APIs next.

export async function findNearbyPharmacies({ medicineQuery, latitude, longitude }) {
  // You can log to confirm it's being called:
  console.log('findNearbyPharmacies:', { medicineQuery, latitude, longitude });

  // TODO: integrate Google Places / Baidu (CN) etc. For now return mock data.
  return [
    { name: 'CVS Pharmacy', distanceMeters: 1200, distanceText: '1.2 km', priceText: '$—$' },
    { name: 'Walgreens', distanceMeters: 2100, distanceText: '2.1 km', priceText: '$$' },
    { name: 'Rite Aid', distanceMeters: 3500, distanceText: '3.5 km', priceText: '$$' },
  ];
}
