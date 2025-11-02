const fs = require('fs');

console.log('🚀 Extracting Batch 6 (Pain Relief, Menstrual, Foot Care, UTI)...');
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
// IMAGE 1: 36 Products (Salonpas, Aquaphor, TYLENOL, Advil, Genexa, etc.)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Salonpas Pain Relief Patch', '20 ea', 19.99, 'Walgreens', 'Salonpas');
addProduct('Aquaphor Healing Ointment', '7 oz', 11.19, 'Walgreens', 'Aquaphor');
addProduct('Walgreens Migraine Relief Geltabs', '20 ea', 4.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cool n Heat Dry Spray + Lidocaine', '4 oz', 10.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Reusable Cold Gel Wrap', '1 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('TYLENOL Extra Strength, Acetaminophen Caplets', '6 ea', 2.49, 'Walgreens', 'TYLENOL');

// Row 2
addProduct('Theraworx Muscle Cramp And Spasm Relief Foam', '7.1 fl oz', 19.99, 'Walgreens', 'Theraworx');
addProduct('TYLENOL 8 Hour Muscle Aches & Pain Tablets with Acetaminophen', '100 ea', 14.99, 'Walgreens', 'TYLENOL');
addProduct('Kerasal Intensive Foot Repair Ointment', '1 oz', 12.99, 'Walgreens', 'Kerasal');
addProduct('Walgreens Tension Headache', '80 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Bayer Chewable Low Dose Aspirin Cherry', '36 ea', 4.49, 'Walgreens', 'Bayer');
addProduct('Walgreens Easy Open All Day Pain Relief Caplets', '90 ea', 12.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Infants Concentrated Drops, Ibuprofen 50 mg Berry', '1 fl oz', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Extra Strength Easy Open Rapid Release Gelcaps', '150 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Bayer Low Dose Aspirin Regimen Chewable Tablets, Pack Cherry', '36 ea x 3 pack', 12.99, 'Walgreens', 'Bayer');
addProduct('Walgreens Dual Action Acetaminophen 250 mg and Ibuprofen (NSAID) 125 mg Tablets', '216 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Naproxen Sodium Tablets USP, 220mg', '600 ea', 41.99, 'Walgreens', 'Walgreens');
addProduct('TYLENOL PM Extra Strength Pain Reliever & Sleep Aid Caplets', '4 ea', 1.99, 'Walgreens', 'TYLENOL');

// Row 4
addProduct('Walgreens All Day Pain Relief Naproxen Sodium Tablets USP, 220mg', '24 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Child Pain/Fever Suspension Strawberry', '4 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Mouth Sore Relief Liquid', '0.5 fl oz', 4.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Dye-Free Pain & Fever Cherry', '8 fl oz x 2 pack', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Summer Essentials Kit', '1 set', 6.29, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Pain & Fever Acetaminophen 160 mg Oral Suspension Dye-Free Cherry', '4 fl oz', 7.49, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Cold Therapy Pain Relief Gel', '3 fl oz', 11.99, 'Walgreens', 'Walgreens');
addProduct('Advil Dual Action Coated Caplets with Acetaminophen', '8 ea', 3.79, 'Walgreens', 'Advil');
addProduct('Advil Dual Action Back Pain Caplets', '72 ea', 13.99, 'Walgreens', 'Advil');
addProduct('Advil Dual Action Back Pain Caplets', '18 ea', 5.99, 'Walgreens', 'Advil');
addProduct('Genexa Kids Acetaminophen Pain & Fever Oral Suspension Syrup Cherry', '4 fl oz', 9.99, 'Walgreens', 'Genexa');
addProduct('Advil Liqui Gels Pain Reliever Minis', '40 ea', 11.99, 'Walgreens', 'Advil');

// Row 6
addProduct('Genexa Infants Acetaminophen Oral Suspension Blueberry', '2 fl oz', 12.99, 'Walgreens', 'Genexa');
addProduct('Childrens TYLENOL Pain + Fever Medicine, Dye-Free Cherry', '8 fl oz', 16.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('TYLENOL 500Mg Acetaminophen Caplets, Travel Size Travel', '10 ea', 3.99, 'Walgreens', 'TYLENOL');
addProduct('Biofreeze Pain Relief Roll-On Menthol', '2.5 fl oz', 11.99, 'Walgreens', 'Biofreeze');
addProduct('Midol On the Go Pouches', '10 ea', 9.99, 'Walgreens', 'Midol');
addProduct('TYLENOL Precise Cooling Pain Relieving Cream, Lidocaine & Menthol Lightly Scented', '4 oz', 13.49, 'Walgreens', 'TYLENOL');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Midol, TYLENOL, Biofreeze, Motrin, BC, Goody's, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Midol Menstrual Pain Relief Caplets With Acetaminophen', '16 ea', 7.99, 'Walgreens', 'Midol');
addProduct('TYLENOL Extra Strength Coated Tablets With Acetaminophen 500Mg', '225 ea', 22.99, 'Walgreens', 'TYLENOL');
addProduct('TYLENOL Coated Tablets With Acetaminophen 500 mg', '100 ea', 13.99, 'Walgreens', 'TYLENOL');
addProduct('Childrens TYLENOL Liquid Pain Relief & Fever Medicine, Natural Apple Flavor Apple', '4 fl oz', 8.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Icy Hot Original Pain Relief Patch Multipack', '10 ea', 16.99, 'Walgreens', 'Icy Hot');
addProduct('TYLENOL Precise Maximum Strength 4% Lidocaine Pain Relieving Cream', '4 oz', 13.49, 'Walgreens', 'TYLENOL');

// Row 2
addProduct('Midol Complete Menstrual Pain Relief Gelcaps with Acetaminophen', '24 ea', 9.79, 'Walgreens', 'Midol');
addProduct('TYLENOL Precise Warming Pain Relief Lidocaine Cream Lightly Scented', '4 oz', 13.49, 'Walgreens', 'TYLENOL');
addProduct('Biofreeze Pain Relief Gel Menthol', '3 fl oz', 11.99, 'Walgreens', 'Biofreeze');
addProduct('Motrin IB, Ibuprofen Caplets for Pain & Fever Relief', '225 ea', 18.99, 'Walgreens', 'Motrin');
addProduct('Aleve Reliever & Fever Reducer Naproxen Sodium Caplets', '270 ea', 29.99, 'Walgreens', 'Aleve');
addProduct('Midol Complete Caffeine Free Menstrual Pain Relief Caplets', '24 ct', 9.99, 'Walgreens', 'Midol');

// Row 3
addProduct('TYLENOL Extra Strength Easy To Swallow Caplets', '24 ea', 5.99, 'Walgreens', 'TYLENOL');
addProduct('TYLENOL Acetaminophen, Easy To Swallow Caplets', '100 ea', 13.99, 'Walgreens', 'TYLENOL');
addProduct('TYLENOL Acetaminophen, Easy To Swallow Caplets', '200 ea', 23.99, 'Walgreens', 'TYLENOL');
addProduct('Biofreeze Pain Relief Spray', '3 fl oz', 11.99, 'Walgreens', 'Biofreeze');
addProduct('Aleve PM Pain Reliever and Night-time Sleep Aid', '20 Ea', 9.99, 'Walgreens', 'Aleve PM');
addProduct('BIOFREEZE Cool The Pain Patches Large', '5 ea', 8.99, 'Walgreens', 'BIOFREEZE');

// Row 4
addProduct('BIOFREEZE Soothing Pain Relief Cream Menthol', '3 oz', 11.99, 'Walgreens', 'BIOFREEZE');
addProduct('Midol Menstrual Pain and Fever Caplets', '20 ea', 11.49, 'Walgreens', 'Midol');
addProduct('Walgreens Dual Action Acetaminophen 250 mg and Ibuprofen (NSAID) 125 mg Tablets', '36 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Dual Pain Reliever Caplets', '72 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Childrens Motrin Dye-Free Ibuprofen Chewable Tablets Grape', '24 ea', 10.99, 'Walgreens', 'Childrens Motrin');
addProduct('Biofreeze Pain Relief Gel Menthol', '8 fl oz', 24.99, 'Walgreens', 'Biofreeze');

// Row 5
addProduct('Icy Hot Nighttime Recovery Roll-On Pain Relief Lavender', '2 fl oz', 12.99, 'Walgreens', 'Icy Hot');
addProduct('BIOFREEZE Menthol Overnight Pain Relieving Gel Tube Lavender', '3 fl oz', 13.99, 'Walgreens', 'BIOFREEZE');
addProduct('Uqora All-In-One UTI Emergency Kit', '1 set', 24.99, 'Walgreens', 'Uqora');
addProduct('Orajel Toothache & Gum Pain Pen', '0.07 oz', 11.49, 'Walgreens', 'Orajel');
addProduct('BC Aspirin Pain Relief Powder, Relieves Headaches', '50 ea', 8.29, 'Walgreens', 'BC');
addProduct('Biofreeze Overnight Pain Relief Roll-On Lavender', '2.5 fl oz', 13.99, 'Walgreens', 'Biofreeze');

// Row 6
addProduct('Walgreens Extra Strength Pain Reliever Acetaminophen Rapid Release Gelcaps', '375 ea', 22.99, 'Walgreens', 'Walgreens');
addProduct('BC Aspirin Pain Relief Powder', '24 ea', 6.99, 'Walgreens', 'BC');
addProduct('Walgreens Instant Toothache & Gum Relief Cream', '0.5 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Arthritis Pain Reliever Acetaminophen 650mg Caplet', '150 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Goodys Extra Strength Headache Powders, Fast Pain Relief', '50 ea', 11.99, 'Walgreens', 'Goodys');
addProduct('Goodys Extra Strength Headache Powder Cool Orange', '24 ea', 10.99, 'Walgreens', 'Goodys');

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
console.log('🎉 Batch 6 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

