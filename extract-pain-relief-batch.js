const fs = require('fs');

console.log('🚀 Extracting Pain Relief & Fever Reducer Products...');
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
// IMAGE 1: 35 Products (Pain Relief, Fever Reducers, Children's Medications)
// ============================================================================
console.log('📸 Extracting Image 1 (35 products)...');

// Row 1
addProduct('Walgreens Childrens Pain & Fever Chewable Tablets Grape', '24 ea', 7.49, 'Walgreens', 'Walgreens');
addProduct('Be Koool Immediate Cooling Fever Reducing Soft Gel Sheets for Kids', '4 ea', 5.99, 'Walgreens', 'Be Koool');
addProduct('Childrens Motrin Oral Suspension 100mg Ibuprofen Medicine NSAID Fever Reducer & Pain Reliever Original Berry', '4 fl oz', 10.99, 'Walgreens', 'Childrens Motrin');
addProduct('Childrens TYLENOL Pain + Fever Relief Cold Medicine Grape', '4 fl oz', 9.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('TYLENOL 500 Mg Acetaminophen Rapid Release Gels', '100 ea', 14.99, 'Walgreens', 'TYLENOL');
addProduct('TYLENOL 500 mg Acetaminophen Caplets for Pain Relief Value Size', '100 ea', 13.99, 'Walgreens', 'TYLENOL');

// Row 2
addProduct('Advil Liqui-Gels Minis Ibuprofen Pain Reliever & Fever Reducer', '20 ea', 5.99, 'Walgreens', 'Advil');
addProduct('Walgreens Childrens Ibuprofen 100 Chewable Tablets Grape', '24 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Childrens TYLENOL Pain + Fever Relief Medicine Strawberry', '4 fl oz', 9.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Walgreens Childrens Dye-Free Ibuprofen 100 Oral Suspension Berry', '4 fl oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Childrens TYLENOL Pain + Fever Relief Medicine Bubble Gum', '4 fl oz', 9.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Voltaren Arthritis Pain Gel', '1.76 oz', 12.99, 'Walgreens', 'Voltaren');

// Row 3
addProduct('Walgreens Arthritis Pain Relieving Gel Diclofenac Sodium Gel 1%', '3.5 oz', 15.99, 'Walgreens', 'Walgreens');
addProduct('AZO Urinary Pain Relief Maximum Strength Tablets', '12 ea', 11.99, 'Walgreens', 'AZO');
addProduct('Excedrin Migraine Pain Relief', '100 ea', 15.99, 'Walgreens', 'Excedrin');
addProduct('Tucks Medicated Cooling Pads Powder Fresh', '100 ea', 9.99, 'Walgreens', 'Tucks');
addProduct('TYLENOL Arthritis & Joint Pain Acetaminophen Caplets', '225 ea', 24.99, 'Walgreens', 'TYLENOL');
addProduct('Walgreens Adult Pain Reliever Liquid Cherry', '8 fl oz', 9.49, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Salonpas 8-Hour Pain Relieving Patch', '60 ea', 10.99, 'Walgreens', 'Salonpas');
addProduct('Advil Dual Action Coated Caplets with Acetaminophen', '144 ea', 21.99, 'Walgreens', 'Advil');
addProduct('Be Koool Cooling Gel Sheets for Migraine Headaches', '6 ea', 7.99, 'Walgreens', 'Be Koool');
addProduct('Advil Liqui-Gels Ibuprofen Pain Reliever/Fever Reducer Capsules 200mg', '80 ea', 13.99, 'Walgreens', 'Advil');
addProduct('Advil Ibuprofen Pain Reliever & Fever Reducer Tablets', '100 ea', 12.49, 'Walgreens', 'Advil');
addProduct('Walgreens Pain Relieving Lidocaine Patch 3.94in x 5.51in', '6 ea', 9.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Dr Teals Pure Epsom Salt Fragrance Free', '6 lb', 8.99, 'Walgreens', 'Dr Teals');
addProduct('Motrin IB Ibuprofen 200 mg Tablets for Pain & Fever Relief', '50 ea', 7.49, 'Walgreens', 'Motrin');
addProduct('Childrens TYLENOL Pain + Fever Relief Medicine Cherry', '4 fl oz', 9.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Infants TYLENOL Acetaminophen Medicine Dye-Free Cherry', '2 fl oz', 13.99, 'Walgreens', 'Infants TYLENOL');
addProduct('Icy Hot Original Strength Pain Relieving Balm', '3.5 oz', 9.99, 'Walgreens', 'Icy Hot');

// Row 6
addProduct('Infants Motrin Liquid Medicine Drops With Ibuprofen Berry', '1 fl oz', 15.99, 'Walgreens', 'Infants Motrin');
addProduct('Walgreens Childrens Ibuprofen 100 mg Chewable Tablets Orange', '24 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Childrens Advil Liquid Pain Reliever and Fever Reducer Grape', '4 oz', 8.99, 'Walgreens', 'Childrens Advil');
// Product 33 (Preparation H) has no visible price - skipping
addProduct('Walgreens Aspirin 81 Chewable Tablets Orange', '108 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ibuprofen Pain Reliever/Fever Reducer 200 mg Tablets', '150 ea', 10.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Pain Relief, Ibuprofen, Acetaminophen, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Walgreens Childrens Ibuprofen Oral Suspension Berry', '4 fl oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Ibuprofen Oral Suspension 100 mg per 5 mL Grape', '4 fl oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Excedrin Migraine Pain Relief', '24 ea', 6.49, 'Walgreens', 'Excedrin');
addProduct('Walgreens Childrens Dye-Free Ibuprofen 100 Oral Suspension Berry', '4 fl oz x 2 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Pain & Fever Liquid Grape', '4 fl oz x 2 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Gelcaps', '24 ea', 4.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Infants TYLENOL Acetaminophen Liquid Medicine Grape', '2 fl oz', 13.99, 'Walgreens', 'Infants TYLENOL');
addProduct('Childrens TYLENOL Acetaminophen Chewables Bubble Gum', '24 ea', 9.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Childrens TYLENOL Acetaminophen Chewables Grape', '24 ea', 9.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Walgreens Epsom Salt', '96 oz', 7.29, 'Walgreens', 'Walgreens');
addProduct('Voltaren Arthritis Pain Relief Topical Gel', '3.53 oz x 2 pack', 32.99, 'Walgreens', 'Voltaren');
addProduct('Walgreens Urinary Tract Infection Test Strips', '3 ea', 10.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Capsaicin Hot Patch', '3 ea', 3.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Coated Caplets', '50 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Epsom Salt', '16 oz', 4.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Antibacterial Plus Urinary', '24 ea', 13.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Water Bottle', '1 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Excedrin Pain Relief No Aspirin', '100 ea', 15.99, 'Walgreens', 'Excedrin');

// Row 4
addProduct('Bayer Aspirin Low Dose 81 mg Safety Coated Tablets', '200 ea', 13.99, 'Walgreens', 'Bayer');
addProduct('Excedrin Headache Pain Relief Extra Strength', '24 ea', 6.49, 'Walgreens', 'Excedrin');
addProduct('Walgreens Aspirin 325 Tablets', '500 ea', 6.79, 'Walgreens', 'Walgreens');
addProduct('Walgreens Mini Weighted Fast-Heat Heating Pad 6 in x 15 in', '1 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Colgate Peroxyl Antiseptic Mouth Sore Rinse Mild Mint', '8.4 fl oz', 8.99, 'Walgreens', 'Colgate');
addProduct('Aspercreme Lidocaine Pain Relief Dry Spray Fragrance Free', '4 oz', 12.99, 'Walgreens', 'Aspercreme');

// Row 5
addProduct('Preparation H Hemorrhoid Symptom Treatment Cream', '.9 oz', 10.99, 'Walgreens', 'Preparation H');
addProduct('Salonpas Pain Relieving Gel-Patch with Maximum Strength Lidocaine', '6 ea', 13.99, 'Walgreens', 'Salonpas');
addProduct('Advil Migraine Headache Relief', '80 ea', 13.99, 'Walgreens', 'Advil');
addProduct('Preparation H Hemorrhoid Suppositories for Burning Itching & Discomfort Relief', '24 ea', 21.99, 'Walgreens', 'Preparation H');
addProduct('Walgreens Ice Bag Large', '1 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('TYLENOL 500 mg Acetaminophen Caplets for Pain Relief', '24 ea', 5.99, 'Walgreens', 'TYLENOL');

// Row 6
addProduct('Walgreens Pre-Moistened Medicated Pads with Witch Hazel', '100 ea', 9.49, 'Walgreens', 'Walgreens');
addProduct('Tiger Balm Ultra Strength Pain Relieving Ointment', '.63 oz', 9.49, 'Walgreens', 'Tiger Balm');
addProduct('Advil Ibuprofen Pain Reliever/Fever Reducer Tablets 200 mg', '50 ea', 9.49, 'Walgreens', 'Advil');
addProduct('Walgreens Pain Relieving Lidocaine Patches Maximum Strength Assorted', '6 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Salonpas Pain Relieving Hot Capsicum Patch', '3 ea', 5.99, 'Walgreens', 'Salonpas');
addProduct('Zarbees Childrens Sleep with Melatonin Chewables Grape Fragrance-Free', '30 ea', 8.99, 'Walgreens', 'Zarbees');

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
console.log('🎉 Pain Relief Batch Complete!');
console.log(`📊 Grand Total: ${mergedData.length} products in database`);

