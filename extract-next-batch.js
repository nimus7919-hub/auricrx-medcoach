const fs = require('fs');

console.log('🚀 Extracting Next Batch (Pain Relief, UTI, Heating Pads, etc.)...');
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
// IMAGE 1: 36 Products (Heating Pads, Pain Relief, UTI, Epsom Salt)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Walgreens Heating Pad Moist/Dry', '1 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Easy-Open Aspirin 81 Tablets', '500 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cranberry 250 mg Caplets', '50 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Icy Hot Original Large Pain Relief Patch Back', '5 ea', 10.99, 'Walgreens', 'Icy Hot');
addProduct('Walgreens Oral Pain Relief Paste Maximum Strength Assorted', '0.42 oz', 6.99, 'Walgreens', 'Walgreens');
addProduct('Aspercreme Lidocaine Pain Relief Roll-On Fragrance Free', '2.5 fl oz', 13.99, 'Walgreens', 'Aspercreme');

// Row 2
addProduct('TYLENOL Regular Strength 325 mg Tablets', '100 ea', 10.99, 'Walgreens', 'TYLENOL');
addProduct('Walgreens Neck & Shoulder Heating Wrap', '1 ea', 36.99, 'Walgreens', 'Walgreens');
addProduct('Aspercreme Lidocaine Pain Relief Patch Fragrance Free Odor Free', '5 ea', 13.99, 'Walgreens', 'Aspercreme');
addProduct('Walgreens All Day Pain Relief Tablets', '200 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Oral-B Mouth Sore Special Care Oral Rinse Soothing Mint', '16 fl oz', 11.99, 'Walgreens', 'Oral-B');
addProduct('Walgreens Ibuprofen Tablets Dye-free', '100 ea', 8.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Migraine Relief Coated Caplets', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Dr Teals Pure Epsom Salt Soaking Solution Lavender', '3 lb', 5.99, 'Walgreens', 'Dr Teals');
addProduct('Walgreens Massaging Heating Pad', '1 ea', 34.99, 'Walgreens', 'Walgreens');
addProduct('Salonpas 8-Hour Pain Relieving Patch-For Back Pain Joint Pain Muscle Soreness Large', '6 ea', 8.29, 'Walgreens', 'Salonpas');
addProduct('Icy Hot Lidocaine Plus Menthol Patches', '5 ea', 12.99, 'Walgreens', 'Icy Hot');
addProduct('Walgreens Low Dose Aspirin 81 Tablets', '500 ea', 13.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens Pain Reliever PM Gelcaps', '20 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('BenGay Ultra Strength Non-Greasy Topical Pain Relief Cream', '4 oz', 11.49, 'Walgreens', 'BenGay');
addProduct('Icy Hot Pain Relieving Patches Arm Neck & Leg', '5 ea', 9.99, 'Walgreens', 'Icy Hot');
addProduct('Icy Hot Original Medicated Pain Relief Liquid with No Mess Applicator', '2.5 fl oz', 9.99, 'Walgreens', 'Icy Hot');
addProduct('Walgreens Maximum Strength Urinary Pain Relief Tablets', '12 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Excedrin Pain Relief', '200 ea', 22.99, 'Walgreens', 'Excedrin');

// Row 5
addProduct('Walgreens Pain Relieving Lidocaine Patch 3.94in x 5.5in', '5 ea', 9.29, 'Walgreens', 'Walgreens');
addProduct('Aspercreme Lidocaine Pain Relief Patch XL', '3 ea', 12.99, 'Walgreens', 'Aspercreme');
addProduct('Diurex Max Caffeine-Free Water Pills', '48 ea', 9.49, 'Walgreens', 'Diurex');
addProduct('Walgreens Pre-Moistened Medicated Wipes', '48 ea', 7.49, 'Walgreens', 'Walgreens');
addProduct('Pamprin Maximum Strength Multi-Symptom Menstrual Period Symptoms Relief Caplets', '40 ea', 8.79, 'Walgreens', 'Pamprin');
addProduct('Icy Hot Original Pain Relief Patch for Back and Large Areas X-Large', '3 ea', 10.99, 'Walgreens', 'Icy Hot');

// Row 6
addProduct('Walgreens Cool n Heat Liquid', '2.5 fl oz', 6.79, 'Walgreens', 'Walgreens');
addProduct('Preparation H Hemorrhoid Relief Suppositories', '12 ea', 12.49, 'Walgreens', 'Preparation H');
addProduct('Walgreens Urinary Pain Relief Maximum Strength', '24 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen 200 mg Softgels', '40 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Aspirin 81 Tablets', '240 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Advil Liqui-Gels Ibuprofen Pain Reliever/Fever Reducer', '160 ea', 21.99, 'Walgreens', 'Advil');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Pain Relief, UTI, Ibuprofen, Acetaminophen)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Walgreens Ibuprofen Mini Softgels', '80 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Advil Liqui-Gels Ibuprofen Pain Reliever/Fever Reducer Capsules 200 mg', '20 ea', 5.99, 'Walgreens', 'Advil');
addProduct('Preparation H Hemorrhoid Symptom Treatment Ointment', '2 oz', 19.99, 'Walgreens', 'Preparation H');
addProduct('Walgreens Ibuprofen Mini Softgels', '20 ea', 4.49, 'Walgreens', 'Walgreens');
addProduct('Advil Ibuprofen Tablets 200 mg', '200 ea', 21.99, 'Walgreens', 'Advil');
addProduct('Walgreens Childrens Ibuprofen Oral Suspension 100 mg Bubble Gum', '4 fl oz x 2 pack', 9.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('TYLENOL Extra Strength', '225 ea', 22.99, 'Walgreens', 'TYLENOL');
addProduct('Midol Menstrual Period Symptoms Relief Caplets', '40 ea', 12.99, 'Walgreens', 'Midol');
addProduct('Walgreens Ibuprofen 200 mg Pain Reliever/Fever Reducer Tablets', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Advil Liqui-Gels Minis Ibuprofen Pain Reliever & Fever Reducer', '160 ea', 21.99, 'Walgreens', 'Advil');
addProduct('Infants TYLENOL Acetaminophen Medicine Cherry', '1 fl oz', 8.99, 'Walgreens', 'Infants TYLENOL');
addProduct('Aleve Back & Muscle Pain Reliever Fever Reducer Naproxen Sodium Tablets', '90 ea', 15.99, 'Walgreens', 'Aleve');

// Row 3
addProduct('Aleve Easy Open Arthritis Cap Naproxen Sodium for Pain Relief', '90 ea', 15.99, 'Walgreens', 'Aleve');
addProduct('Walgreens Arthritis Pain Reliever Acetaminophen 650 mg Caplet', '225 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Pain Reliever Acetaminophen Caplets', '225 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Tension Headache Relief Caplets', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen 200 Mini Softgels', '200 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens 8-Hour Pain Reliever Acetaminophen 650 mg Caplet', '200 ea', 21.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Midol Menstrual Pain Relief Heat Patches', '3 ea', 12.49, 'Walgreens', 'Midol');
addProduct('Walgreens Arthritis Pain Relieving Gel Diclofenac Sodium 1%', '1.76 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Omron Max Power TENS Therapy Pain Relief PM500', '1 set', 69.99, 'Walgreens', 'Omron');
addProduct('Aspercreme Lidocaine Pain Relief Cream Fragrance Free', '4.3 oz', 13.49, 'Walgreens', 'Aspercreme');
addProduct('Cystex UTI Pain Relief Maximum Strength', '48 ea', 16.99, 'Walgreens', 'Cystex');
addProduct('Walgreens Pain Relieving Cream', '4 oz', 8.49, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Ibuprofen Caplets', '500 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Pain & Fever Chewable Tablets Bubble Gum', '24 ea', 7.49, 'Walgreens', 'Walgreens');
addProduct('Anbesol Liquid Maximum Strength Instant Oral Pain Reliever', '0.41 fl oz', 8.49, 'Walgreens', 'Anbesol');
addProduct('Salonpas Lidocaine 4% Pain Relieving Flex Patch Unscented', '7 ea', 14.99, 'Walgreens', 'Salonpas');
addProduct('Anbesol Maximum Strength Instant Oral Pain Relief Gel', '0.33 oz', 8.49, 'Walgreens', 'Anbesol');
addProduct('Voltaren Arthritis Pain Gel', '3.53 oz', 18.49, 'Walgreens', 'Voltaren');

// Row 6
addProduct('AZO Urinary Tract Infection UTI Test Strips', '3 ea', 9.74, 'Walgreens', 'AZO');
addProduct('Red Cross Toothache Medicine Kit', '1 set', 7.79, 'Walgreens', 'Red Cross');
addProduct('Tiger Balm Extra Strength Pain Relieving Ointment', '0.63 oz', 10.99, 'Walgreens', 'Tiger Balm');
addProduct('Frankincense & Myrrh Foot Pain Relief Rubbing Oil', '2 fl oz', 18.99, 'Walgreens', 'Frankincense & Myrrh');
addProduct('AZO Urinary Tract Defense Antibacterial Protection Tablets', '24 ea', 18.99, 'Walgreens', 'AZO');
addProduct('AZO Urinary Tract Defense Antibacterial Protection Tablets', '18 ea', 8.24, 'Walgreens', 'AZO');

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

// Merge with existing data
const mergedData = [...existingData, ...uniqueProducts];
console.log(`📊 After merge: ${mergedData.length} products`);
console.log('');

// Save to file
fs.writeFileSync('assets/medicationData.json', JSON.stringify(mergedData, null, 2), 'utf8');
console.log('💾 Saved to assets/medicationData.json');
console.log('');
console.log('🎉 Next Batch Complete!');
console.log(`📊 Grand Total: ${mergedData.length} products in database`);

