const fs = require('fs');

console.log('🚀 Extracting Batch 17 (Farmacia Benavides - Mexico)...');
console.log('');

const allProducts = [];

// Helper function to add products
const addProduct = (name, size, price, pharmacy = 'Farmacia Benavides', brand = '') => {
  if (price && price !== 'Price available in store' && !isNaN(parseFloat(price))) {
    allProducts.push({
      medicinas: name,
      precio: parseFloat(price),
      unidades: size,
      farmacia: pharmacy,
      brand: brand || name
    });
  }
};

// ============================================================================
// IMAGE 1: 8 Products
// ============================================================================
console.log('📸 Extracting Image 1 (8 products)...');

addProduct('Fanter', '10 mg Dapagliflozin, 28 Tablets', 1150.00);
addProduct('Fanter', '10 mg Dapagliflozin, 14 Tablets', 623.00);
addProduct('Tukol-D', 'Diabetes 0.2 g/2.0 g Dextromethorphan, 120 ml Bottle', 204.00);
addProduct('Grisi Diabecare Bar Soap', 'for the Skin of People with Diabetes, 125 g', 53.00);
addProduct('Contour TS Blood Glucose Test Strips', '50 units', 436.00);
addProduct('Contour Plus Blood Glucose Test Strips', '50 units', 369.00);
addProduct('Microlet Silicone-Coated Colored Lancets', '25 units', 69.00);
addProduct('Contour Plus Glucometer', 'for Blood Glucose Monitoring, 1 unit', 299.00);

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 8 Products
// ============================================================================
console.log('📸 Extracting Image 2 (8 products)...');
const img2Start = allProducts.length;

addProduct('Contour Plus Blood Glucose Test Strips', '25 units', 240.00);
addProduct('Contour Plus Elite Glucometer', 'for Blood Glucose Monitoring, 1 unit', 299.00);
addProduct('Brand Generic Anavit', 'Vitamins for Diabetics, 30 Capsules', 212.00);
addProduct('Xigduo Xr', '5 mg Dapagliflozin/1000 mg Metformin, 28 Tablets', 851.00);
addProduct('Forxiga', '10 mg Dapagliflozin, 28 Tablets', 1513.00);
addProduct('Xigduo Xr', '10 mg Dapagliflozin/1000 mg Metformin, 28 Tablets', 1558.00);
addProduct('Rybelsus', '14 mg Semaglutide, 30 Tablets', 4379.00);
addProduct('Jardianz Dpp', '25 mg Empagliflozin/5 mg Linagliptin, 30 Tablets', 3167.00);

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 8 Products
// ============================================================================
console.log('📸 Extracting Image 3 (8 products)...');
const img3Start = allProducts.length;

addProduct('Rybelsus', '3 mg Semaglutide, 30 Tablets', 2351.00);
addProduct('Jardianz', '10 mg Empagliflozin, 30 Tablets', 2167.00);
addProduct('Shot B Diabetic B Complex', 'Thiamine, Pyridoxine, 30 units Tablets', 256.00);
addProduct('Jardianz Duo', '12.5 mg Empagliflozin/850 mg Metformin, 60 Tablets', 2130.00);
addProduct('Rybelsus', '7 mg Semaglutide, 30 Tablets', 3906.00);
addProduct('Janumet Xr', '100 mg Sitagliptin/1000 mg Metformin, 28 Tablets', 1727.00);
addProduct('Jardianz Duo', '12.5 mg Empagliflozin/1000 mg Metformin, 60 Tablets', 2130.00);
addProduct('Galvus Met', '50 mg Vildagliptin/850 mg Metformin, 60 Tablets', 1333.00);

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 8 Products
// ============================================================================
console.log('📸 Extracting Image 4 (8 products)...');
const img4Start = allProducts.length;

addProduct('Janument', '50 mg Sitagliptin/850 mg Metformin, 56 Tablets', 1709.00);
addProduct('Galvus Met', '50 mg Vildagliptin/1000 mg Metformin, 30 Tablets', 683.00);
addProduct('Trayenta', '5 mg Linagliptin, 30 Tablets', 1967.00);
addProduct('Jardianz', '25 mg Empagliflozin, 30 Tablets', 2110.00);
addProduct('Dabex Xr', '1000 mg Metformin, 30 Tablets', 390.53);
addProduct('Lantus Solostar', '100 U/ml Insulin Glargine, 5 Prefilled Syringes', 2288.00);
addProduct('Firialta', '20 mg Finerenone, 28 Tablets', 1262.70);
addProduct('Dabex Xr', '750 mg Metformin, 30 Tablets', 390.53);

console.log(`✅ Image 4 complete: ${allProducts.length - img4Start} products extracted`);

// ============================================================================
// IMAGE 5: 8 Products
// ============================================================================
console.log('📸 Extracting Image 5 (8 products)...');
const img5Start = allProducts.length;

addProduct('Lantus', '100 U/ml Insulin Glargine, 1 Pre-filled Pen', 621.00);
addProduct('Januvia', '100 mg Sitagliptin, 28 Tablets', 1801.00);
addProduct('Firialta', '10 mg Finerenone, 28 Tablets', 1262.70);
addProduct('Lodestar', '50 mg Losartan, 30 Tablets', 690.00);
addProduct('Janumet', '50 mg Sitagliptin/850 mg Metformin, 28 Tablets', 957.00);
addProduct('Toujeo', '300 U/ml Insulin Glargine, 1 Prefilled Syringe', 1019.00);
addProduct('Invokana', '300 mg Canagliflozin, 30 Tablets', 1918.00);
addProduct('Humalog Kwikpen', '100 IU Insulin Lispro/1 ml Injectable Solution, 1 Prefilled Syringe', 403.00);

console.log(`✅ Image 5 complete: ${allProducts.length - img5Start} products extracted`);

// ============================================================================
// IMAGE 6: 8 Products
// ============================================================================
console.log('📸 Extracting Image 6 (8 products)...');
const img6Start = allProducts.length;

addProduct('Dabex Xr', '750 mg Metformin, 60 Tablets', 1024.00);
addProduct('Jardianz Duo', '12.5 mg Empagliflozin/850 mg Metformin, 30 Tablets', 1171.00);
addProduct('Humalog Mix Kwikpen', '100 IU Insulin Lispro/1 ml Injectable Solution, 1 Prefilled Syringe', 483.00);
addProduct('Lobivon', '5 mg Nebivolol, 28 units Tablets', 929.00);
addProduct('Thioctacid', '600 mg Thioctic Acid, 30 Tablets', 1341.00);
addProduct('Micardis', '80 mg Telmisartan, 28 Tablets', 1462.00);
addProduct('Concor', '2.50 mg Bisoprolol, 30 Tablets', 882.00);
addProduct('Toujeo', '300 U/ml Insulin Glargine, 3 Prefilled Syringes', 2974.00);

console.log(`✅ Image 6 complete: ${allProducts.length - img6Start} products extracted`);

// ============================================================================
// IMAGE 7: 8 Products
// ============================================================================
console.log('📸 Extracting Image 7 (8 products)...');
const img7Start = allProducts.length;

addProduct('Blodivit', '40 mg Atorvastatin, 30 Tablets', 616.42);
addProduct('Vessel-Due F', '250 LRU Sulodexide, 50 Capsules', 735.00);
addProduct('Micardis Plus', '80 mg Telmisartan/12.5 mg Hydrochlorothiazide, 28 Tablets', 1621.00);
addProduct('Prikul', '50 mg Pregabalin, 28 Capsules', 759.01);
addProduct('Concor', '1.25 mg Bisoprolol, 30 Tablets', 766.00);
addProduct('Atozet', '10 mg Ezetimibe/40 mg Atorvastatin, 30 Tablets', 2003.00);
addProduct('Miccil', '1 mg Bumetanide, 20 Tablets', 307.00);
addProduct('XL-3 Xtra', '2 mg Chlorphenamine/5 mg Phenylephrine/10 mg Dextromethorphan, 12 Capsules', 87.00);

console.log(`✅ Image 7 complete: ${allProducts.length - img7Start} products extracted`);

// ============================================================================
// IMAGE 8: 8 Products
// ============================================================================
console.log('📸 Extracting Image 8 (8 products)...');
const img8Start = allProducts.length;

addProduct('Seloken Zok', '95 mg Metoprolol, 30 Tablets', 874.00);
addProduct('Trayenta Duo', '2.5 mg Linagliptin/850 mg Metformin, 60 Tablets', 2040.00);
addProduct('Edarbi Cld', '80 mg Azilsartan Medoxomil/12.5 mg Chlorthalidone, 28 Tablets', 1315.00);
addProduct('Geslutin', '200 mg Progesterone, 15 Pearls', 629.00);
addProduct('One Touch Select Plus', 'Glucose Meter + Lancing Device + 25 Test Strips, 1 unit', 480.25);
addProduct('Iltux', '40 mg Olmesartan Medoxomil, 28 Tablets', 1197.56);
addProduct('Cyclofémina', '25 mg Medroxyprogesterone/5 mg Estradiol, 1 Prefilled Syringe', 401.00);
addProduct('Celestamine Ns', '5 mg Loratadine/0.25 mg Betamethasone, 20 Tablets', 514.00);

console.log(`✅ Image 8 complete: ${allProducts.length - img8Start} products extracted`);

// ============================================================================
// IMAGE 9: 8 Products
// ============================================================================
console.log('📸 Extracting Image 9 (8 products)...');
const img9Start = allProducts.length;

addProduct('Aspirin Protect', '100 mg Acetylsalicylic Acid, 28 Tablets', 124.20);
addProduct('Entresto', '50 mg Sacubitril Valsartan, 30 Tablets', 1674.82);
addProduct('Acxion Ap', '30 mg Phentermine, 30 Tablets', 392.00);
addProduct('Iltux2hct', '40 mg Olmesartan Medoxomil/12.5 mg Hydrochlorothiazide, 28 Tablets', 1211.77);
addProduct('Euthyrox', '75 mcg Levothyroxine Sodium, 50 Tablets', 279.00);
addProduct('Euthyrox', '50 mcg Levothyroxine Sodium, 50 Tablets', 342.00);
addProduct('Atozet', '10 mg Ezetimibe/20 mg Atorvastatin, 30 Tablets', 2003.00);
addProduct('Controlip Trilipix', '135 mg Fenofibric Acid, 30 Capsules', 1285.00);

console.log(`✅ Image 9 complete: ${allProducts.length - img9Start} products extracted`);

// ============================================================================
// IMAGE 10: 8 Products
// ============================================================================
console.log('📸 Extracting Image 10 (8 products)...');
const img10Start = allProducts.length;

addProduct('Dimegan D', '0.1 g Loratadine/0.4 g Phenylephrine, 60 ml Syrup', 472.00);
addProduct('Vartalon Compositum', '1500 mg Glucosamine/1200 mg Chondroitin, 30 Envelopes', 1278.00);
addProduct('Jasmine 24/4', '3 mg Drospirenone/0.02 mg Ethinylestradiol, 28 Tablets', 566.00);
addProduct('Saxenda', '6 mg/mL Liraglutide, 3 Pre-filled Pens', 4569.74);
addProduct('Mysimba', '8 mg Naltrexone/90 mg Bupropion, 120 Tablets', 1880.00);
addProduct('Trixeo Aerosphere', '160 mcg Budesonide/7.2 mcg Glycopyrronium/4.8 mcg Formoterol, 120 Doses', 1546.00);
addProduct('Acxion', '30 mg Phentermine, 30 Tablets', 299.00);
addProduct('Combivent', '0.5 mg Ipratropium Bromide/2.5 mg Salbutamol, 10 Ampoules', 608.00);

console.log(`✅ Image 10 complete: ${allProducts.length - img10Start} products extracted`);

// ============================================================================
// IMAGE 11: 4 Products
// ============================================================================
console.log('📸 Extracting Image 11 (4 products)...');
const img11Start = allProducts.length;

addProduct('Omacor', '1000 mg Omega-3 Fatty Acid Ethyl Esters, 28 Capsules', 675.00);
addProduct('Concor', '5 mg Bisoprolol, 30 Tablets', 1103.00);
addProduct('Itravil', '30 mg Clobenzorex, 60 units Capsules', 1350.00);
addProduct('Vannair', '160 mcg Budesonide/4.5 mcg Formoterol, 120 Doses Aerosol', 1274.00);

console.log(`✅ Image 11 complete: ${allProducts.length - img11Start} products extracted`);

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
console.log('🎉 Batch 17 Complete - Farmacia Benavides (Mexico)!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

