const fs = require('fs');

console.log('🚀 Extracting Batch 7 (Pain Relief, Heat Therapy, Hemorrhoidal Care)...');
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
// IMAGE 1: 36 Products (Walgreens Free & Pure, ThermaCare, TYLENOL, etc.)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Walgreens Free & Pure Aspirin 81 mg, Enteric-Coated Tablets', '1000 ea', 24.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Dual Action Acetaminophen & Ibuprofen (NSAID) Tablets, 250 mg/125 mg, Back Pain', '72 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Epsom Salt Eucalyptus', '3 lb', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Long-Lasting Relief Pain Reliever Extended-Release Caplets', '40 ea', 9.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Nerve Pain Relieving Roll-On', '2.5 fl oz', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Overnight Cold Therapy Pain Relief Roll On Lavender', '2.5 fl oz', 12.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens All Day Pain Relief, Naproxen Sodium Tablets', '50 ea', 7.79, 'Walgreens', 'Walgreens');
addProduct('Walgreens Dual Action Acetaminophen and Ibuprofen (NSAID) Tablets', '144 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Lidocaine Patch Knee & Elbow 6.5 x 5.1 Inches', '6 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Menstrual Complete Pain Relief Caplets', '40 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Pain Reliever Acetaminophen 500 mg Caplets', '500 ea', 29.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Pain Reliever PM Caplets', '100 ea', 11.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Free & Pure Pain Reliever Acetaminophen 325 mg Tablets Regular Strength', '100 ea', 7.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Pain Reliever PM Caplets', '24 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cold Therapy Pain Relief Patch', '5 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Pain Reliever Quickgels', '225 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Extra Strength Easy Tablets', '225 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever PM Extra Strength Caplets', '250 ea', 22.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens Hot/Cold Bead Multi Purpose Pack', '1 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure MIGRAINE RELIEF CAPLETS', '24 ea', 4.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('TYLENOL Pain Relieving Patches, Large, Unscented Large', '4 ea', 11.49, 'Walgreens', 'TYLENOL');
addProduct('TYLENOL Pain Relieving Patches, Large, Unscented Large', '2 ea', 7.99, 'Walgreens', 'TYLENOL');
addProduct('TYLENOL Precise Nighttime Pain Relieving Cream, Calming Scent for Relaxation Calming', '4 oz', 13.49, 'Walgreens', 'TYLENOL Precise');
addProduct('Natures Bounty Optimal Solutions Advanced PMS Relief for Menstrual Cycle Support', '60 ea', 29.99, 'Walgreens', 'Natures Bounty');

// Row 5
addProduct('ThermaCare Knee Heat Wraps for Knee Pain Relief', '2 ea', 14.99, 'Walgreens', 'ThermaCare');
addProduct('Arnicare Gel, Homeopathic Topical Pain Relief', '2.6 oz', 12.99, 'Walgreens', 'Arnicare');
addProduct('ThermaCare Back Pain Relief Heatwraps', '3 ea', 14.99, 'Walgreens', 'ThermaCare');
addProduct('ThermaCare Menstrual Pain Relief Heatwrap', '4 ea', 14.99, 'Walgreens', 'ThermaCare');
addProduct('ThermaCare Neck, Wrist & Shoulder Pain Relief Heatwraps', '4 ea', 14.99, 'Walgreens', 'ThermaCare');
addProduct('Icy Hot Pain Relief Patches', '5 ea', 17.99, 'Walgreens', 'Icy Hot');

// Row 6
addProduct('Walgreens Anorectal Lidocaine Cream', '1 oz', 24.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Reusable Hot and Cold Neck and Shoulder Wrap', '1 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('NeuropAWAY Nerve Support Maximum Strength Topical Gel', '2 oz', 19.99, 'Walgreens', 'NeuropAWAY');
addProduct('Walgreens Emu Muscle & Joint Relief', '4 oz', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Freezer Friends Cold Pack', '1 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Capsaicin Arthritis Pain Relief Cream Fragrance Free', '1.5 oz', 14.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Hemorrhoidal Care, Heat Therapy, Menstrual Relief)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Walgreens Flexible Pain Relieving Lidocaine Patch 2 3/4 x 3 15/16 Inches', '7 ea', 12.29, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoidal Pain Relief Cream with Lidocaine Tube + Single-Use Packets', '1 set', 29.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Heat Therapy Patches For Back and Large Areas', '3 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoidal Cooling Gel', '0.9 oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoidal Pain Relief Ointment', '2 oz', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoidal Pain Relief Cream', '0.9 oz', 7.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Hemorrhoidal Pain Relief Ointment', '1 oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Pain Reliever Acetaminophen Caplets', '50 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens 8-Hour Cold Pack 12 in x 6 in', '1 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Biofreeze Overnight Pain Relief Patches Lavender', '4 ea', 11.99, 'Walgreens', 'Biofreeze');
addProduct('BIOFREEZE Patches, Back Knee Muscle Joint and Arthritis Pain Lavender, Large & Overnight Relief', '9 ea', 19.99, 'Walgreens', 'BIOFREEZE');
addProduct('Walgreens Pain Reliever Acetaminophen 500mg', '150 ea', 12.49, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Menstrual Complete Pain Relief Gelcaps', '24 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Heat Therapy Patches For Neck, Arm, Leg', '8 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen Tablets 200 mg, Pain Reliever/Fever Reducer', '100 ea x 2 pack', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cold Therapy Pain Relief Continuous Spray Menthol', '3 oz', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hot/Cold Beads Back Wrap', '1 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Epsom Salt Peppermint', '2 lb', 4.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens Arthritis Pain Reliever Tablets', '24 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen PM Tablets', '20 ea', 5.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen Tablets, Pain Reliever/Fever Reducer', '24 ea', 4.49, 'Walgreens', 'Walgreens');
addProduct('Midol Menstrual Patches', '3 ea', 12.49, 'Walgreens', 'Midol');
addProduct('Walgreens Easy Open Ibuprofen 200 mg Caplets', '225 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Pain Reliever Acetaminophen 500 mg Caplets Extra Strength', '24 ea', 4.99, 'Walgreens', 'Walgreens Free & Pure');

// Row 5
addProduct('Canker-X Mouth Sore Gel', '0.28 fl oz', 14.99, 'Walgreens', 'Canker-X');
addProduct('Walgreens Heat Therapy Menstrual Patch', '3 ea', 8.29, 'Walgreens', 'Walgreens');
addProduct('Walgreens Boil Pain Relieving Ointment', '1 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Instant Cold Packs 5.6 in x 7.4 in', '2 ea', 4.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Toothache & Gum Pain Relief PM Cream', '0.25 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Instant Oral Pain Relief Gel Maximum Strength', '0.33 oz', 6.49, 'Walgreens', 'Walgreens');

// Row 6
addProduct('NARCAN Nasal Spray, Emergency Treatment of Opioid Overdose', '0 oz x 2 pack', 34.99, 'Walgreens', 'NARCAN');
addProduct('Walgreens Neck/Shoulder/Arm Heat Wrap', '4 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen 200 mg Tablets', '10 ea', 1.79, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Pain Reliever Mini Softgels', '50 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Heating Pad', '1 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Fast Heat Heating Pad 12" x 24", Beige', '1 ea', 34.99, 'Walgreens', 'Walgreens');

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
console.log('🎉 Batch 7 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

