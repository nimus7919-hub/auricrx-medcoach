const fs = require('fs');

console.log('🚀 Extracting Batch 5 (Pain Relief, TENS, Cold Packs, Leg Cramps)...');
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
// IMAGE 1: 42 Products (Pain Relief, TENS, Cold Packs, Leg Cramps)
// ============================================================================
console.log('📸 Extracting Image 1 (42 products)...');

// Row 1
addProduct('Walgreens 8-Hour Pain Reliever Caplets', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('DenTek Canker Relief Patch', '6 ea', 15.99, 'Walgreens', 'DenTek');
addProduct('Walgreens TENS Therapy Pain Relief Electronic Pulse Stimulator', '1 set', 31.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Instant Cold Packs', '8 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Relieving Patch Large', '6 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Blue-Emu Original Super Strength Cream Odor Free', '4 oz', 19.99, 'Walgreens', 'Blue-Emu');

// Row 2
addProduct('Icy Hot Original Pain Relief Dry Spray With 16% Menthol', '4 oz', 10.99, 'Walgreens', 'Icy Hot');
addProduct('Orajel Maximum 3X For Toothache & Gum Pain Gel', '0.42 oz', 11.49, 'Walgreens', 'Orajel');
addProduct('Campho-phenique Medicated Maximum Strength Cold Sore Treatment Gel', '0.23 oz', 6.29, 'Walgreens', 'Campho-phenique');
addProduct('Excedrin Triple Action Headache Relief Caplets, PM', '100 ea', 15.99, 'Walgreens', 'Excedrin');
addProduct('Theraworx Muscle Spasm and Leg Cramp Relief Spray', '7.1 fl oz', 19.99, 'Walgreens', 'Theraworx');
addProduct('Walgreens Urinary Pain Relief Tablets', '30 ea', 9.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Hylands Naturals Leg Cramp PM', '50 ea', 11.99, 'Walgreens', 'Hylands Naturals');
addProduct('Walgreens Instant + Reusable Gel Cold Compress, Blue', '1 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Orajel PM 4X Medicated For Toothache & Gum Cream', '0.25 oz', 11.49, 'Walgreens', 'Orajel');
addProduct('Walgreens Aspirin 325 mg Enteric-Coated Tablets Regular Strength', '500 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Red Cross Oral Pain Medicine Kit', '1 set', 9.79, 'Walgreens', 'Red Cross');
addProduct('Salonpas Lidocaine Plus Pain Relieving Roll-On', '3 fl oz', 12.99, 'Walgreens', 'Salonpas');

// Row 4
addProduct('Hylands Naturals Restful Legs PM Tablets', '50 ea', 11.99, 'Walgreens', 'Hylands Naturals');
addProduct('Aspercreme Lidocaine Roll-On Lavender', '2.5 fl oz', 13.99, 'Walgreens', 'Aspercreme');
addProduct('TYLENOL 500Mg Acetaminophen Caplets, Travel Size', '10 ea', 4.99, 'Walgreens', 'TYLENOL');
addProduct('Salonpas Capsaicin Pain Relieving Gel Patches', '6 ea', 10.49, 'Walgreens', 'Salonpas');
addProduct('Walgreens Fast Heat Heating Pad Plush Standard', '1 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Dr. Teals Pure Epsom Salt Soaking Solution Menthol & Essential Oils', '3 lb', 7.49, 'Walgreens', 'Dr. Teals');

// Row 5
addProduct('Advil Easy Open Ibuprofen Pain Reliever & Fever Reducer Tablets', '200 ea', 21.99, 'Walgreens', 'Advil');
addProduct('Advil Coated Caplet Pain Reliever/Fever Reducer 200 mg Ibuprofen', '100 ea', 12.49, 'Walgreens', 'Advil');
addProduct('Walgreens All Day Pain Relief Liquid Gels', '20 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Pain Reliever Suspension Liquid Grape', '4 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Advil Pain Reliever and Fever Reducer', '10 ea', 3.99, 'Walgreens', 'Advil');
addProduct('Walgreens Ibuprofen PM Tablets', '120 ea', 16.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Walgreens Dye-Free Aspirin 81 mg Low Dose Enteric-Coated Tablets', '500 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen 200 mg Caplets', '24 ea', 4.49, 'Walgreens', 'Walgreens');
addProduct('Genexa Kids Pain & Fever Relief With Acetaminophen Blueberry', '4 fl oz', 9.99, 'Walgreens', 'Genexa');
addProduct('Aleve Pain Relief Naproxen Sodium Caplets', '90 Ea', 15.99, 'Walgreens', 'Aleve');
addProduct('AleveX Pain Relieving Lotion with Rollerball Applicator', '2.5 oz', 17.99, 'Walgreens', 'AleveX');
addProduct('Aleve Pain Reliever & Fever Reducer Liquid Gels', '20 ea', 8.99, 'Walgreens', 'Aleve');

// Row 7
addProduct('Hylands Naturals Leg Cramps Pain Relief', '100 ea', 15.99, 'Walgreens', 'Hylands Naturals');
addProduct('Walgreens Ibuprofen PM Caplets', '200 EA', 18.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Headache Relief Caplets Extra Strength', '250 ea', 17.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Cool n Heat Patches Extra Strength Extra Large', '3 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen Caplets', '300 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Nervive Nerve Care, Pain Relieving Roll On Liquid, Max Strength', '2.5 oz', 14.99, 'Walgreens', 'Nervive');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 30 Products (Icy Hot, Biofreeze, Aleve, Hot/Cold Packs)
// ============================================================================
console.log('📸 Extracting Image 2 (30 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Icy Hot Max Strength Pain Relief Spray With Lidocaine Plus Menthol', '4 oz', 13.99, 'Walgreens', 'Icy Hot');
addProduct('Walgreens Arnica Gel', '2.6 oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Reusable Hot and Cold Gel Pack Extra Large', '1 ea', 23.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Reusable Hot and Cold Clay Back Wrap', '1 ea', 25.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Back & Muscle All Day Pain Relief Tablets', '90 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Dr. Talbots Night Time Soothing Tablets, Quick Dissolve', '140 ea', 9.49, 'Walgreens', 'Dr. Talbots');

// Row 2
addProduct('BIOFREEZE Patches, Fast Acting Pain Relief Large', '12 ea', 19.99, 'Walgreens', 'BIOFREEZE');
addProduct('Walgreens Leg Cramps PM Quick-Dissolving Tablets', '50 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cool n Heat Cream+ Lidocaine', '2.7 oz', 8.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens 24-Hour Lidocaine Patches', '6 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Multiple Ways Massager', '1 ea', 23.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Gel Shoulder Support', '1 ea', 29.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Naproxen Sodium Liquid Gels', '80 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Bayer Aspirin 325 mg Safety Coated Caplets', '100 ea', 8.99, 'Walgreens', 'Bayer');
addProduct('Walgreens Ice Blue Gel', '8 oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('DenTek Instant Pain Relief Advanced Kit Clean Mint', '50 ea', 8.49, 'Walgreens', 'DenTek');
addProduct('Walgreens Hydrocortisone Cool Relief Gel Maximum Strength', '1 oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Australian Dream Arthritis Pain Relief Cream', '4 oz', 27.99, 'Walgreens', 'Australian Dream');

// Row 4
addProduct('Walgreens Ibuprofen Caplets', '50 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Childrens Motrin Oral Suspension Grape', '4 fl oz', 10.99, 'Walgreens', 'Childrens Motrin');
addProduct('Aleve Pain Reliever & Fever Reducer Tablets', '24 Ea', 7.99, 'Walgreens', 'Aleve');
addProduct('Aleve Pain Reliever & Fever Reducer Naproxen Sodium Caplets', '24 Ea', 7.99, 'Walgreens', 'Aleve');
addProduct('Aleve Arthritis Cap Caplets', '270 Ea', 29.99, 'Walgreens', 'Aleve');
addProduct('Aleve Arthritis Pain Relief Caplets', '50 Ea', 9.99, 'Walgreens', 'Aleve');

// Row 5
addProduct('Aleve Naproxen Sodium Caplets, Soft Grip Cap, Arthritis Pain Relief', '24 Ea', 7.99, 'Walgreens', 'Aleve');
addProduct('BIOFREEZE Pain Relief Patches, for Back Knee Muscle Joint & Arthritis Pain', '4 ea', 9.99, 'Walgreens', 'BIOFREEZE');
addProduct('Walgreens All Day Pain Relief Caplets', '90 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens All Day Pain Relief Liquid Gels', '50 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Reusable Hot and Cold Clay Wrap With Strap', '1 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Reusable Hot and Cold Compression Wrap', '1 ea', 15.99, 'Walgreens', 'Walgreens');

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
console.log('🎉 Batch 5 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

