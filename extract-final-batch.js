const fs = require('fs');

console.log('🚀 Extracting Final Batch (Pain Relief, Oral Care, Heating Pads)...');
console.log('');

const allProducts = [];

// Helper function to add products
const addProduct = (name, size, price, pharmacy = 'Walgreens', brand = '') => {
  if (price && price !== 'Price available in store' && !isNaN(parseFloat(price))) {
    allProducts.push({
      medicinas: name,
      precio: parseFloat(price),
      unidades: size,
      farmacia: pharmacy,
      brand: brand || pharmacy
    });
  }
};

// ============================================================================
// IMAGE 1: 36 Products (TENS, Preparation H, Orajel, etc.)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Walgreens TENS Therapy Replacement Gel Pads', '10 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Preparation H Rapid Relief With Lidocaine Hemorrhoid Symptom Treatment Cream', '1 oz', 33.99, 'Walgreens', 'Preparation H');
addProduct('Orajel Toothache Rinse Double Medicated Pain Relief', '16 fl oz', 11.99, 'Walgreens', 'Orajel');
addProduct('Kanka Mouth Pain Liquid (Packaging May Vary)', '0.33 oz', 6.99, 'Walgreens', 'Kanka');
addProduct('Kanka Soft Brush Tooth/Mouth Pain Gel Oral Anesthetic/Oral Astringent (Packaging May Vary)', '0.07 oz', 7.99, 'Walgreens', 'Kanka');
addProduct('Diurex Ultimate Re-Energizing Water Pills', '60 ea', 11.49, 'Walgreens', 'Diurex');

// Row 2
addProduct('Voltaren Arthritis Pain Gel with Easy Open Cap', '5.29 oz', 25.99, 'Walgreens', 'Voltaren');
addProduct('Orajel 4x Severe Toothache Oral Pain Reliever Cream', '0.33 oz', 11.49, 'Walgreens', 'Orajel');
addProduct('Bayer Chewable Low Dose Aspirin Orange', '36 ea x 3 pack', 12.99, 'Walgreens', 'Bayer');
addProduct('Walgreens Liquid Oral Pain Relief', '0.5 oz', 6.49, 'Walgreens', 'Walgreens');
addProduct('Orajel Cold Sore Touch Free Applicators (Actual Item May Vary)', '0.02 oz x 4 pack', 19.99, 'Walgreens', 'Orajel');
addProduct('Orajel Antiseptic Mouth Sore Rinse Mint', '16 fl oz', 11.99, 'Walgreens', 'Orajel');

// Row 3
addProduct('TYLENOL 8 Hour Arthritis & Joint Pain Acetaminophen Caplets', '24 ea', 6.99, 'Walgreens', 'TYLENOL');
addProduct('Percogesic Acetaminophen Coated Aspirin-Free Pain Reliever', '60 ea', 11.49, 'Walgreens', 'Percogesic');
addProduct('TYLENOL Sinus + Headache Non-Drowsy Daytime Caplets', '24 ea', 11.99, 'Walgreens', 'TYLENOL');
addProduct('Walgreens Ibuprofen 200 Tablets, Dye-free', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Excedrin Headache Pain Relief', '200 ea', 22.99, 'Walgreens', 'Excedrin');
addProduct('Walgreens All Day Pain Relief Liquid Gels', '180 ea', 19.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Salonpas 8-12 Hour Pain Relieving Patches Large', '9 ea', 19.99, 'Walgreens', 'Salonpas');
addProduct('Tiger Balm Pain Relieving Patch', '5 ea', 10.99, 'Walgreens', 'Tiger Balm');
addProduct('Dr. Teals Pure Epsom Salt Soaking Solution Eucalyptus & Spearmint', '3 lb', 5.99, 'Walgreens', 'Dr. Teals');
addProduct('Advil Easy Open Liqui-Gels Ibuprofen Pain Reliever & Fever Reducer', '160 ea', 21.99, 'Walgreens', 'Advil');
addProduct('Walgreens Extra Strength Pain Reliever PM Geltabs', '100 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Muscle Cramps Foam Green Tea & Orange Peel Extract', '7.1 fl oz', 17.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Bayer Aspirin 325 mg Multi-Symptom Pain Reliever Coated Tablets', '200 ea', 13.99, 'Walgreens', 'Bayer');
addProduct('Walgreens Antiseptic Rinse Oral Pain Reliever & Debriding Agent', '16 oz', 8.29, 'Walgreens', 'Walgreens');
addProduct('Bayer Chewable Low Dose Aspirin Orange (Actual Item May Vary)', '36 ea', 4.49, 'Walgreens', 'Bayer');
addProduct('Icy Hot Lidocaine No-Mess Pain Relief Liquid', '2.5 fl oz', 12.99, 'Walgreens', 'Icy Hot');
addProduct('Walgreens Ibuprofen PM, Ibuprofen and Diphenhydramine Citrate Tablets, 200 mg/38 mg', '80 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Aspirin 325 Caplets', '100 ea', 6.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('TYLENOL 8 Hour Muscle Aches & Pain Caplets With Acetaminophen', '24 ea', 6.99, 'Walgreens', 'TYLENOL');
addProduct('Walgreens Cool N Heat Lidocaine Patches', '5 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Dr. Teals Pure Epsom Salt Soaking Solution Rosemary & Mint', '3 lb', 7.49, 'Walgreens', 'Dr. Teals');
addProduct('Walgreens Headache Relief Geltabs', '80 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Bayer Low Dose Aspirin 81 mg Tablets', '120 ea', 8.99, 'Walgreens', 'Bayer');
addProduct('Walgreens Ibuprofen 200 mg Tablets', '500 ea', 24.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Bayer, Motrin, Aleve, Icy Hot, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Bayer Back and Body Extra Strength Aspirin 500 mg, Pain Reliever Caplets', '100 ea', 12.99, 'Walgreens', 'Bayer');
addProduct('Motrin IB, Ibuprofen Tablets for Pain & Fever Relief (Actual Item May Vary)', '100 ea', 12.99, 'Walgreens', 'Motrin');
addProduct('Walgreens Aspirin 325 mg Tablets', '100 ea', 1.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Aspirin 81 mg Low Dose Enteric-Coated Tablets', '120 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Extra Strength Gelcaps', '50 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Dye-Free Infants Pain & Fever Oral Suspension Cherry', '2 fl oz', 10.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Fast-Heat Therapy Blanket', '1 ea', 44.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Menstrual Relief Caplets', '16 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Burts Bees Rescue Cold Sore Treatment', '.07 oz', 14.99, 'Walgreens', 'Burts Bees');
addProduct('Aleve Pain Reliever & Fever Reducer Naproxen Sodium Tablets', '90 Ea', 15.99, 'Walgreens', 'Aleve');
addProduct('Aleve Pain Reliever & Fever Reducer Liquid Gels', '80 Ea', 17.99, 'Walgreens', 'Aleve');
addProduct('Aleve Pain Reliever & Fever Reducer Liquid Gels', '50 Ea', 12.99, 'Walgreens', 'Aleve');

// Row 3
addProduct('Aleve Pain Reliever, Fever Reducer, Naproxen Sodium Tablets', '24 Ea', 7.99, 'Walgreens', 'Aleve');
addProduct('Aleve Pain Relief, Naproxen Sodium, Easy Open Arthritis Cap', '80 Ea', 17.99, 'Walgreens', 'Aleve');
addProduct('Aleve PM Pain Reliever and Night-time Aid', '50 Ea', 14.49, 'Walgreens', 'Aleve PM');
addProduct('Walgreens Arthritis Pain Relieving Gel', '3.53 oz x 2 pack', 25.99, 'Walgreens', 'Walgreens');
addProduct('Icy Hot Advanced Muscle & Joint Pain Relief Cream', '2 oz', 9.99, 'Walgreens', 'Icy Hot');
addProduct('Aleve PM Pain Relief and Nighttime Sleep Aid Naproxen Sodium Caplets', '80 ea', 17.99, 'Walgreens', 'Aleve PM');

// Row 4
addProduct('Walgreens Gel Pad Large', '1 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Aspercreme Lidocaine Pain Relief Cream Fragrance Free', '2.7 oz', 10.99, 'Walgreens', 'Aspercreme');
addProduct('Walgreens Ibuprofen 200 Tablets', '500 ea', 22.99, 'Walgreens', 'Walgreens');
addProduct('Icy Hot Original Pain Relieving Cream, Powerful Pain Relief for Muscles & Joints', '3 oz', 9.99, 'Walgreens', 'Icy Hot');
addProduct('DerMend Moisturizing Bruise Cream', '4.5 oz', 29.99, 'Walgreens', 'DerMend');
addProduct('Icy Hot Max Strength Pain Relief Cream with Lidocaine', '2.7 oz', 10.99, 'Walgreens', 'Icy Hot');

// Row 5
addProduct('Walgreens Gel Bead Ice Pack 9 inches, Blue', '1 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('RectiCare Advanced Hemorrhoidal Cream', '1 oz', 39.99, 'Walgreens', 'RectiCare');
addProduct('Walgreens Ibuprofen 200 mg Tablets', '100 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Headache Relief Tablets Extra Strength', '100 ea', 11.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Icy Hot Pro Pain Cream With No-Mess Applicator', '3 oz', 17.99, 'Walgreens', 'Icy Hot');
addProduct('Walgreens Pain Relieving Dry Spray + Lidocaine', '4 oz', 10.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Walgreens Pain Relieving Cream + Lidocaine', '4.7 oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Mouth Sore Relief Gel', '0.42 oz', 5.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Menstrual Pain Relief Caplets', '48 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Caplets and Ibuprofen Tablets Combo Pack', '100 ea x 2 pack', 10.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Stay Awake Tablets', '100 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Relieving Cream + Lidocaine Odor Free', '2.7 oz', 8.49, 'Walgreens', 'Walgreens');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// SUMMARY & SAVE
// ============================================================================
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`✅ EXTRACTION COMPLETE!`);
console.log(`📦 Total products extracted: ${allProducts.length}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Deduplicate
const uniqueProducts = [];
const seen = new Set();

for (const item of allProducts) {
  const identifier = `${item.medicinas}-${item.unidades}-${item.farmacia}`.toLowerCase();
  if (!seen.has(identifier)) {
    uniqueProducts.push(item);
    seen.add(identifier);
  }
}

console.log(`🔍 Deduplication: ${allProducts.length} → ${uniqueProducts.length} unique products`);
console.log('');

// Load existing database
const existingData = JSON.parse(fs.readFileSync('assets/medicationData.json', 'utf8'));
console.log(`📊 Current database: ${existingData.length} products`);

// Check for duplicates in existing database
let newProductsAdded = 0;
for (const newProduct of uniqueProducts) {
  const existsInDb = existingData.some(
    existing =>
      existing.medicinas &&
      existing.medicinas.toLowerCase() === newProduct.medicinas.toLowerCase() &&
      existing.unidades === newProduct.unidades &&
      existing.farmacia === newProduct.farmacia
  );
  
  if (!existsInDb) {
    existingData.push(newProduct);
    newProductsAdded++;
  }
}

console.log(`➕ ${newProductsAdded} new products added (${uniqueProducts.length - newProductsAdded} were already in database)`);
console.log(`📊 After merge: ${existingData.length} products`);
console.log('');

// Save to file
fs.writeFileSync('assets/medicationData.json', JSON.stringify(existingData, null, 2), 'utf8');
console.log('💾 Saved to assets/medicationData.json');
console.log('');
console.log('🎉 Final Batch Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

