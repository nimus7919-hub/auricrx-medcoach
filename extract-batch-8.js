const fs = require('fs');

console.log('🚀 Extracting Batch 8 (Children\'s Meds, TENS Therapy, Heating Pads)...');
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
// IMAGE 1: 36 Products (Heating Pads, Children's Meds, Pain Relief)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Walgreens Heating Pad Moist/Dry 12" X 24", Blue', '1 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Arthritis Pain Relief Capsaicin 0.1% Topical Analgesic Gel', '2.5 oz', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Heat Therapy Patches For Neck, Arm, Leg', '4 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cold Therapy Pain Relief Roll On', '2.5 fl oz', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Extra Strength PM Quickgel EZ Open', '125 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Pepto Kids Gummies Bubblegum, Clear', '24 ea', 11.99, 'Walgreens', 'Pepto Kids');

// Row 2
addProduct('Walgreens Heat Wraps Back & Hips L/XL', '3 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen Tablets, Pain Reliever/Fever Reducer', '50 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Migraine Relief Coated Caplets', '200 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen PM Coated Caplets', '80 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens All Day Pain Relief Caplets', '90 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen PM Coated Caplets', '120 ea', 16.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Ibuprofen 200 Caplets', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Fast-Heat Heating Pad', '1 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Neck & Shoulder Heating Wrap', '1 ea', 36.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Numbing Pain Relief + Skin Moisturizing Cream', '3 oz', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Pain & Fever Liquid Cherry', '4 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Nervive Pain Relieving Spray, Max Strength', '4.5 oz', 24.99, 'Walgreens', 'Nervive');

// Row 4
addProduct('Walgreens Ibuprofen 200 Caplets', '500 ea', 22.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Headache Relief Caplets', '24 ea', 4.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Dye-Free Pain & Fever Natural Cherry', '8 fl oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Infants TYLENOL Acetaminophen Liquid Medicine Cherry', '2 fl oz', 13.99, 'Walgreens', 'Infants TYLENOL');
addProduct('Walgreens Childrens Pain Reliever/Fever Reducer Suppositories', '12 ea', 12.49, 'Walgreens', 'Walgreens');
addProduct('Bio Electro Extra Strength Pain & Headache Reliever Tablets', '24 ea', 6.99, 'Walgreens', 'Bio Electro');

// Row 5
addProduct('Advil Junior Strength Chewable Tablets Grape', '24 ea', 6.79, 'Walgreens', 'Advil');
addProduct('Walgreens Childrens Dye-Free Pain & Fever Oral Suspension Grape', '4 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Ibuprofen 100 Oral Suspension Bubble Gum', '4 fl oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Salonpas Lidocaine Plus Pain Relieving Cream', '3 oz', 12.99, 'Walgreens', 'Salonpas');
addProduct('Advil Liqui-Gels Minis Pain Reliever/Fever Reducer', '200 ea', 24.99, 'Walgreens', 'Advil');
addProduct('Walgreens Oral Relief Sore Throat Spray Cherry', '6 fl oz', 7.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Infants Motrin Infants Concentrated Drops, Fever Reducer, Ibuprofen Berry', '0.5 fl oz', 9.49, 'Walgreens', 'Infants Motrin');
addProduct('Childrens TYLENOL Liquid & Chewables', '1 set', 17.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Childrens Advil Ibuprofen Fever Reducer/Pain Reliever Oral Suspension Bubble Gum', '4 fl oz', 8.99, 'Walgreens', 'Childrens Advil');
addProduct('Aspercreme Original Pain Relief Cream Fragrance Free', '3 oz', 9.99, 'Walgreens', 'Aspercreme');
addProduct('Walgreens Gel Pad Medium', '1 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('ThermaCare Multi-Purpose Joint Pain Therapy Heatwraps', '4 ea', 14.99, 'Walgreens', 'ThermaCare');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (TENS, Hemorrhoidal, Heating Pads, Mouth Care)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Walgreens Childrens Pain & Fever Dissolve Packs Wild Berry', '18 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Buscapina Pain Reliever', '24 ea', 10.99, 'Walgreens', 'Buscapina');
addProduct('Doans Extra Strength Pain Reliever Caplets', '24 ea', 6.49, 'Walgreens', 'Doans');
addProduct('Walgreens Electronic TENS Therapy Pain Relief', '1 ea', 31.99, 'Walgreens', 'Walgreens');
addProduct('Omron Long Life Pads, TENS Therapy Pain Relief, Large Reusable & Washable', '1 pr', 21.99, 'Walgreens', 'Omron');
addProduct('Walgreens Dye-Free Aspirin 81 Tablets', '120 ea', 6.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Pomada Dragon Pain Numbing Cream Odor Free', '2.7 oz', 9.49, 'Walgreens', 'Pomada Dragon');
addProduct('Walgreens Electronic TENS Therapy Replacement Back Pads', '2 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Little Remedies Infant Fever + Pain Reliever', '2 fl oz x 2 pack', 12.49, 'Walgreens', 'Little Remedies');
addProduct('Infants Advil Infant Pain Reliever and Fever Reducer White Grape', '0.5 oz', 7.99, 'Walgreens', 'Infants Advil');
addProduct('Walgreens Cool n Heat Patches Extra Strength', '5 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Motrin IB Liquid Gels, Pain & Fever Reducer 200 mg', '80 ea', 16.99, 'Walgreens', 'Motrin');

// Row 3
addProduct('NeilMed NasaBulb Nose Aspirator', '1 ea', 7.79, 'Walgreens', 'NeilMed');
addProduct('Walgreens Childrens Ibuprofen 100 Liquid Berry', '4 fl oz x 2 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Aleve Pain Reliever & Fever Reducer Tablets', '50 Ea', 9.99, 'Walgreens', 'Aleve');
addProduct('Walgreens Pain Relieving 4% Lidocaine with Lavender Roll-On', '2.5 oz', 9.49, 'Walgreens', 'Walgreens');
addProduct('BenGay Ultra Strength Non-Greasy Topical Pain Relief Cream', '2 oz', 7.99, 'Walgreens', 'BenGay');
addProduct('RectiCare Anorectal Cream', '30 g', 29.99, 'Walgreens', 'RectiCare');

// Row 4
addProduct('Nervive Nerve Care, Pain Relieving Cream, Max Strength Non-Greasy Topical Pain Reliever Menthol', '3 oz', 14.99, 'Walgreens', 'Nervive');
addProduct('Bufferin Aspirin 325 mg, Pain & Fever Relief Tablets', '130 ea', 7.99, 'Walgreens', 'Bufferin');
addProduct('Tucks Multi-Care Relief Kit', '1 set', 11.99, 'Walgreens', 'Tucks');
addProduct('Walgreens Extra Strength Pain Reliever and Extra Strength Pain Reliever PM Combo Pack', '75 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Sunbeam Heating Pad with XpressHeat King Size', '1 ea', 54.99, 'Walgreens', 'Sunbeam');
addProduct('Nikzon Hemorrhoidal Cream, Vasoconstrictor & Anesthetic Cream Pain', '0.9 oz', 9.99, 'Walgreens', 'Nikzon');

// Row 5
addProduct('Blue-Emu Maximum Arthritis Pain Relief Cream', '3 oz', 19.99, 'Walgreens', 'Blue-Emu');
addProduct('Pomada Dragon Pain Relief Cream', '2 oz', 7.99, 'Walgreens', 'Pomada Dragon');
addProduct('Walgreens Arthritis Gloves Gray, Gray', '1 pr', 18.99, 'Walgreens', 'Walgreens');
addProduct('Sunbeam Renue XL Heat Wrap', '1 ea', 74.99, 'Walgreens', 'Sunbeam');
addProduct('Preparation H Cooling Gel Hemorrhoid Symptom Treatment', '0.9 oz', 10.99, 'Walgreens', 'Preparation H');
addProduct('Colgate Mouth Sore Rinse Mild Mint', '16.9 fl oz', 12.99, 'Walgreens', 'Colgate');

// Row 6
addProduct('Walgreens Maximum Strength Pain Relieving Liquid Roll On', '2.5 oz', 9.49, 'Walgreens', 'Walgreens');
addProduct('Aspercreme Lidocaine Foot Pain Relief Cream Odor Free', '4 oz', 14.99, 'Walgreens', 'Aspercreme');
addProduct('Advil Coated Caplets Pain Reliever / Fever Reducer', '200 ea', 21.99, 'Walgreens', 'Advil');
addProduct('Mommys Bliss Little Gums Organic Soothing Massage Gel', '0.53 oz x 2 pack', 14.49, 'Walgreens', 'Mommys Bliss');
addProduct('Walgreens Instant Toothache & Gum Relief Gel', '0.25 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Bayer Aspirin 325 mg Multi-Symptom Pain Reliever, Coated Tablets', '100 ea', 7.99, 'Walgreens', 'Bayer');

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
console.log('🎉 Batch 8 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

