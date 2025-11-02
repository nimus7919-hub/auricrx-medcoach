const fs = require('fs');

console.log('🚀 Extracting Batch 16 (FINAL Vitamins and Supplements Collection)...');
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
// IMAGE 1: 36 Products
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Qunol Extra Strength Turmeric 1000 mg Vegetarian Capsules', '30 ea', 26.99, 'Walgreens', 'Qunol');
addProduct('Mag-Ox 400 Magnesium Oxide Supplement Tablets', '120 ea', 23.99, 'Walgreens', 'Mag-Ox 400');
addProduct('Amazing Grass Green SuperFood All Natural Drink Powder Original', '8.5 oz', 35.99, 'Walgreens', 'Amazing Grass');
addProduct('Natrol Fast Dissolve Melatonin 5 mg, Sleep Support for Adults Strawberry', '150 ea', 17.99, 'Walgreens', 'Natrol');
addProduct('PreserVision AREDS 2 + Multi', '80 ea', 35.99, 'Walgreens', 'PreserVision');
addProduct('One A Day Gummies Advanced Multivitamin With Immunity + Brain Support Strawberry', '110 ea', 19.99, 'Walgreens', 'One A Day');

// Row 2
addProduct('Natures Bounty Milk Thistle 175 mg Capsules', '100 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Airborne Immune Support Effervescent Minerals & Herbs with Vitamin C, E, Zinc Citrus', '96 ea', 20.24, 'Walgreens', 'Airborne');
addProduct('BPI Sports Keto Weight Loss', '75 ea', 26.99, 'Walgreens', 'BPI Sports');
addProduct('Natures Bounty D3-1000 IU Dietary Supplement Rapid Release Softgels', '350 ea', 23.99, 'Walgreens', 'Natures Bounty');
addProduct('Natrol 5mg Melatonin Gummies Strawberry', '140 ea', 24.99, 'Walgreens', 'Natrol');
addProduct('Natrol 1mg Melatonin Gummies Raspberry', '140 ea', 24.99, 'Walgreens', 'Natrol');

// Row 3
addProduct('Culturelle Daily Probiotic Gummies', '52 ea', 15.99, 'Walgreens', 'Culturelle');
addProduct('OLLY Muscle Recovery Sleep Berry Rested, Purple', '40 ea', 14.99, 'Walgreens', 'OLLY');
addProduct('Walgreens Free & Pure Potassium 99 mg Caplets (120 days)', '120 ea', 12.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Natrol Melatonin 10 mg Maximum Strength Fast Dissolve Tablets Citrus', '100 ea', 21.99, 'Walgreens', 'Natrol');
addProduct('Centrum Multivitamin Gummies for Men Assorted Fruit', '170 ea', 14.99, 'Walgreens', 'Centrum');
addProduct('Walgreens Vitamin C 1,000 mg Single-Serve Packets (30 days)', '30 ea', 11.19, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Fungies Lions Mane Mushroom Gummies Blueberry & Strawberry', '60 ea', 19.99, 'Walgreens', 'Fungies');
addProduct('Phillips Colon Health Probiotics Capsules', '30 ea', 18.99, 'Walgreens', 'Phillips');
addProduct('OLLY Happy Hoo-Ha Capsule Unflavored', '25 ea', 21.99, 'Walgreens', 'OLLY');
addProduct('OLLY Beat The Bloat Capsules', '25 ea', 22.99, 'Walgreens', 'OLLY');
addProduct('Force Factor Total Beets Tablets', '120 ea', 24.99, 'Walgreens', 'Force Factor');
addProduct('Nature Made Multivitamin For Her Gummies', '70 ea', 11.99, 'Walgreens', 'Nature Made');

// Row 5
addProduct('Diabetes Doctor Dr. Stephanies Mens Romance Natural Booster Capsules', '90 ea', 29.99, 'Walgreens', 'Diabetes Doctor Dr. Stephanies');
addProduct('Nervive Nerve Health with Alpha Lipoic Acid Tablets', '30 ea', 23.99, 'Walgreens', 'Nervive');
addProduct('Walgreens Prostate Max Plus Caplets (30 days)', '60 ea', 23.99, 'Walgreens', 'Walgreens');
addProduct('Natures Bounty B-12 Raspberry Mixed Berry and Orange Flavors', '90 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Free & Pure Melatonin 5 mg Gummies Natural Strawberry', '120 ea', 13.49, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens St. Johns Wort 300 mg Capsules (120 days)', '240 ea', 12.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('New Vitality Super Beta Prostate Advanced - Chewables', '60 ea', 39.99, 'Walgreens', 'New Vitality');
addProduct('PURE Zzzs Melatonin Gummies, Sleep Aid, Melatonin Sleep Gummies Wildberry Vanilla', '60 ea', 21.99, 'Walgreens', 'PURE Zzzs');
addProduct('Focus Factor Brain Health Supplement for Brain Performance', '90 ea', 43.99, 'Walgreens', 'Focus Factor');
addProduct('Natures Bounty Fish Oil With Omega 3 Softgels, 1000 mg', '145 ea', 22.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Melatonin 10 mg Quick-Dissolving Tablets Dye-Free Cherry', '90 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Diabetes Doctor Dr. Stephanies Blood Sugar 24 Hour Daily Support', '60 ea', 29.99, 'Walgreens', 'Diabetes Doctor Dr. Stephanies');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('New Chapter Every Womans One Daily 40+ Multivitamin, Vegetarian Tablets', '30 ea', 36.99, 'Walgreens', 'New Chapter');
addProduct('New Chapter Every Womans One Daily 55+ Multivitamin, Vegetarian Tablets', '30 ea', 36.99, 'Walgreens', 'New Chapter');
addProduct('Nature Made Multi for Him Gummies', '70 ea', 11.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Womens Multivitamin + Omega-3 Gummies Lemon, Orange & Strawberry', '150 ea', 27.99, 'Walgreens', 'Nature Made');
addProduct('New Chapter Every Mans One Daily 55+ Multivitamin, Vegetarian Tablets', '30 ea', 36.99, 'Walgreens', 'New Chapter');
addProduct('Nature Made Extra Strength Vitamin D3 5000 IU (125 mcg) per serving Gummies Strawberry, Peach, Mango', '150 ea', 35.99, 'Walgreens', 'Nature Made');

// Row 2
addProduct('New Chapter One Daily Prenatal Multivitamin, Vegetarian Tablets', '30 ea', 26.99, 'Walgreens', 'New Chapter');
addProduct('Walgreens Free & Pure Glucosamine HCI Chondroitin Sulfate Tablets Extra Strength (45 days)', '90 ea', 24.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('One A Day Mens 50+ Complete Multivitamin Tablets', '200 ea', 26.99, 'Walgreens', 'One A Day');
addProduct('OLLY Teen Girl Multi Gummies', '70 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Walgreens Free & Pure Calcium + Vitamin D3 Gummies Natural Strawberry, Orange & Cherry', '90 ea', 7.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('GNC Mens Advanced Testosterone Dietary Supplement', '60 ea', 21.99, 'Walgreens', 'GNC Mens');

// Row 3
addProduct('Prevagen Regular Strength Capsules', '30 ea', 39.99, 'Walgreens', 'Prevagen');
addProduct('Prevagen Extra Strength Capsules', '30 ea', 59.99, 'Walgreens', 'Prevagen');
addProduct('Vitafusion Vitamin D3 Gummy Vitamins', '150 ea', 15.99, 'Walgreens', 'Vitafusion');
addProduct('Vitafusion Womens Gummy Vitamins Berry', '150 ea', 16.99, 'Walgreens', 'Vitafusion');
addProduct('Vitafusion Prenatal Gummy Vitamins Raspberry Lemonade', '90 ea', 17.99, 'Walgreens', 'Vitafusion');
addProduct('Lil Critters Gummy Vites Complete Kids Gummy Vitamins', '190 ea', 18.99, 'Walgreens', 'Lil Critters');

// Row 4
addProduct('Culturelle Calm & Comfort Probiotic (Age 0-12 Months)', '0.29 fl oz', 23.99, 'Walgreens', 'Culturelle');
addProduct('Natures Way Alive! Womens Energy Multi-Vitamin Tablets', '50 ea', 13.99, 'Walgreens', 'Natures Way');
addProduct('Vitafusion Power C Gummy Vitamins Orange', '150 ea', 15.99, 'Walgreens', 'Vitafusion');
addProduct('Nature Made Mens Multivitamin + Omega-3 Gummies Lemon, Orange & Strawberry', '80 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty L-Arginine 1000 mg Amino Acid Supplement Tablets', '50 ea', 14.99, 'Walgreens', 'Natures Bounty');
addProduct('Finest Nutrition Vitamin E Oil', '2.5 fl oz', 9.99, 'Walgreens', 'Finest Nutrition');

// Row 5
addProduct('Prevagen Regular Strength Chewables Mixed Berry', '30 ea', 39.99, 'Walgreens', 'Prevagen');
addProduct('MegaFood Blood Builder Iron Supplement', '30 ea', 19.99, 'Walgreens', 'MegaFood');
addProduct('Vitafusion Calcium Supplement Gummy Vitamins Fruit & Cream', '100 ea', 16.99, 'Walgreens', 'Vitafusion');
addProduct('Prevagen Professional Formula Capsules', '30 ea', 89.99, 'Walgreens', 'Prevagen');
addProduct('AZO Cranberry Urinary Tract Health, Dietary Supplement, Gummies Mixed Berry', '72 ea', 14.99, 'Walgreens', 'AZO');
addProduct('Ocuvite Eye Health Formula Mini Soft Gels', '30 ea', 12.99, 'Walgreens', 'Ocuvite');

// Row 6
addProduct('New Chapter Wholemega Fish Oil, Wild Alaskan Salmon Oil, Softgels', '60 ea', 24.99, 'Walgreens', 'New Chapter');
addProduct('Walgreens Free & Pure Cold Pressed Black Seed Oil 2,000 mg Softgels', '60 ea', 12.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Calcium with Vitamin D Tablets', '200 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Complete Multivitamin Gummies (190 days) Natural Cherry, Mixed Berry, Orange and Pineapple', '190 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Prebiotic + Postbiotic + Probiotic Gummies Natural Raspberry', '60 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Vitamin D3 50 mcg Tablets', '300 ea', 23.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 36 Products
// ============================================================================
console.log('📸 Extracting Image 3 (36 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Natures Bounty Quercetin Immune Support Dietary Supplement Capsules', '500 mg - 60 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Calcium 600mg + D3 20 mcg (800 IU) Tablets', '120 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Glowing Skin Complex Gummies Strawberry', '60 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Advanced Hair, Skin & Nail Gummies', '80 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Magnesium 400 mg Tablets', '60 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens B12 Softgels', '90 ea', 12.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Melatonin Delayed Release', '12mg - 30 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Melatonin 12 mg Gummies Natural Strawberry', '60 ea', 11.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Host Defense MyCommunity Mushroom Supplement Capsules for Immune Support', '60 ea', 35.09, 'Walgreens', 'Host Defense');
addProduct('Metamucil Premium Blend Fiber Supplement, with Stevia Plant-Based Sweetener, Sugar-Free Orange', '23.5 oz', 39.99, 'Walgreens', 'Metamucil');
addProduct('Qunol Ultra CoQ10 200mg Softgels', '45 ea', 39.99, 'Walgreens', 'Qunol');
addProduct('Walgreens Free & Pure Healthy Hair Renewal Support (30 days)', '60 ea', 19.99, 'Walgreens', 'Walgreens Free & Pure');

// Row 3
addProduct('Walgreens Free & Pure Kids Zero Sugar Melatonin 1 mg Gummies Blackberry & Raspberry', '60 ea', 8.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Fish Oil 1000 mg with 300 mg Omega-3 Softgels', '200 ea', 22.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure DHEA 25 mg Tablets', '300 ea', 19.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Dye-Free Melatonin 12mg Tablets', '60 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Force Factor Royal Manuka Soft Chews Honey-Lemon', '60 ea', 19.99, 'Walgreens', 'Force Factor');
addProduct('Walgreens Free & Pure Manuka Honey Gummy Natural Citrus', '60 ea', 12.99, 'Walgreens', 'Walgreens Free & Pure');

// Row 4
addProduct('Walgreens Free & Pure Prenatal 3rd Trimester Digestive Probiotic Support', '90 ea', 11.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Free & Pure Prenatal 1st Trimester Nausea Support', '60 ea', 11.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Liquid Melatonin Berry', '2 fl oz', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Liquid D3', '2 fl oz', 12.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Natrol Melatonin Travel Pouch Strawberry', '10 ea', 3.99, 'Walgreens', 'Natrol');
addProduct('Walgreens Vitamin C 1000mg Chewable Tablets', '100 EA', 14.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('More Labs Sugar Free Morning Recovery Natural Lemon', '3.4 fl oz', 4.99, 'Walgreens', 'More Labs');
addProduct('Emergen-C Immune Support Supplement Crystals Orange', '0.14 oz x 28 pack', 16.99, 'Walgreens', 'Emergen-C');
addProduct('AZO Complete Feminine Balance Daily Probiotic', '30 ea', 31.49, 'Walgreens', 'AZO');
addProduct('Uqora Flush Urinary Tract Health Drink Mix Pink Lemonade', '10 Ea', 29.99, 'Walgreens', 'Uqora');
addProduct('Natural Vitality Magnesium Supplement Drink Mix Raspberry Lemon', '4 oz', 17.99, 'Walgreens', 'Natural Vitality');
addProduct('Emergen-C Kids Immune Support Supplement Crystals Sparkly Strawberry', '0.07 oz x 28 pack', 16.99, 'Walgreens', 'Emergen-C');

// Row 6
addProduct('Centrum Multivitamin Tablets for Women 50 Plus', '200 ea', 23.99, 'Walgreens', 'Centrum');
addProduct('Natures Bounty Advanced Vitamin D3 + Magnesium Citrate, Immune and Bone Supplement Tablets', '90 ea', 27.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Beets & Co Q-10 Gummies Raspberry', '60 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('Sambucol Black Elderberry Immune Support Gummies with Vitamin C and Zinc Elderberry', '30 ea', 12.49, 'Walgreens', 'Sambucol');
addProduct('Natures Bounty Advanced Magnesium Glycinate 360 mg Muscle & Bone Support Capsules', '90 ea', 34.99, 'Walgreens', 'Natures Bounty');
addProduct('Flintstones Sugar Free Multivitamin Gummy Raspberry', '60 ea', 17.99, 'Walgreens', 'Flintstones');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 36 Products
// ============================================================================
console.log('📸 Extracting Image 4 (36 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('OLLY Probiotic + Prebiotic Peachy Peach', '60 ea', 23.99, 'Walgreens', 'OLLY');
addProduct('Zarbees Childrens Regularity Support Prebiotic Fiber Powder, Flavorless', '5.82 oz', 23.99, 'Walgreens', 'Zarbees');
addProduct('Force Factor Total Beets Powder Pomegranate Berry', '7.4 oz', 19.99, 'Walgreens', 'Force Factor');
addProduct('Emergen-C Immune Support Supplement 500 mg Crystals', '28 ea', 16.99, 'Walgreens', 'Emergen-C');
addProduct('Force Factor Collagen Boosting Superfoods Soft Chews Tropical Fruit', '60 ea', 19.99, 'Walgreens', 'Force Factor');
addProduct('Force Factor Modern Mushrooms Capsules', '90 ea', 19.99, 'Walgreens', 'Force Factor');

// Row 2
addProduct('Force Factor Modern Mushrooms Soft Chews Cinnamon Roll', '60 ea', 19.99, 'Walgreens', 'Force Factor');
addProduct('Natrol 10mg per Gummy MelatoninMax Blueberry', '50 ea', 17.99, 'Walgreens', 'Natrol');
addProduct('Force Factor Perfect Maca Soft Chews Dark Cherry', '60 ea', 19.99, 'Walgreens', 'Force Factor');
addProduct('Natures Bounty Chewable Probiotic Acidophilus with 1 Billion Live Cultures Strawberry', '60 ea', 16.99, 'Walgreens', 'Natures Bounty');
addProduct('Centrum Men Multivitamin & Multimineral Supplements Tablets', '120 ea', 10.99, 'Walgreens', 'Centrum');
addProduct('Natrol Sleep & Restore with 5 mg Melatonin Gummies Cherry', '60 ea', 24.99, 'Walgreens', 'Natrol');

// Row 3
addProduct('Culturelle Bloating & Gas Defense', '30 ea', 28.99, 'Walgreens', 'Culturelle');
addProduct('Zicam Daily Immune Supplement Citrus Strawberry', '70 ea', 13.99, 'Walgreens', 'Zicam');
addProduct('Emergen-C Zero Sugar Immune Support Adult Gummies Fruit', '36 ea', 18.99, 'Walgreens', 'Emergen-C');
addProduct('Natures Bounty Biotin 10,000 mcg Rapid Release Softgels', '180 ea', 27.99, 'Walgreens', 'Natures Bounty');
addProduct('Natrol Sleep & Restore Melatonin Free Calming Drink Mix Lemon Chamomile', '10 ea', 27.99, 'Walgreens', 'Natrol');
addProduct('Airborne Gummies with Vitamin C, Minerals & Herbs Immune Support Assorted Fruit', '42 ea', 15.99, 'Walgreens', 'Airborne');

// Row 4
addProduct('Diabetes Doctor Dr. Stephanies A1C Double Pack Blood Sugar + Carb & Sugar Blocker', '105 ea', 49.99, 'Walgreens', 'Diabetes Doctor Dr. Stephanies');
addProduct('Force Factor Total Beets Blood Pressure Support Chews Acai Berry', '60 ea', 29.99, 'Walgreens', 'Force Factor');
addProduct('OLLY Fiber Gummy Rings Berry Melon', '50 ea', 18.99, 'Walgreens', 'OLLY');
addProduct('Nature Made Zero Sugar Energy Vitamin B12 Gummies Brain Support Raspberry', '110 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty High Absorption Magnesium Glycinate 240mg', '60 ea', 19.99, 'Walgreens', 'Natures Bounty');
addProduct('Vicks Triple Action Melatonin Gummies, Sleep Aid with Ashwagandha for Adults Blackberry Vanilla', '60 ea', 24.99, 'Walgreens', 'Vicks');

// Row 5
addProduct('Nature Made Zero Sugar Vitamin D3 Gummies Cherry', '110 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Metamucil 4 in 1 Fiber Supplement Powder Promotes Digestive Health and Regularity Lemonade', '14.7 oz', 24.99, 'Walgreens', 'Metamucil');
addProduct('Natures Truth Beet Root Gummies Strawberry', '60 ea', 16.99, 'Walgreens', 'Natures Truth');
addProduct('Natures Bounty High Absorption Magnesium Glycinate 240 mg Capsules', '120 ea', 39.99, 'Walgreens', 'Natures Bounty');
addProduct('Force Factor Ultra Berberine Capsules', '60 ea', 19.99, 'Walgreens', 'Force Factor');
addProduct('Force Factor Total Beets Ultimate Heart Health Soft Chews Berry', '60 ea', 44.99, 'Walgreens', 'Force Factor');

// Row 6
addProduct('OLLY Magnesium Gummies Raspberry Lavender', '60 ea', 17.99, 'Walgreens', 'OLLY');
addProduct('Force Factor Ultimate Magtein Soft Chews Mixed Berry', '60 ea', 39.99, 'Walgreens', 'Force Factor');
addProduct('Force Factor Superior Sea Moss Gut Health + Skin Support Soft Chews Smores', '60 ea', 29.99, 'Walgreens', 'Force Factor');
addProduct('Force Factor Amazing Ashwa Advanced Soft Chews Blueberry Pomegranate', '60 ea', 29.99, 'Walgreens', 'Force Factor');
addProduct('Force Factor Better Turmeric Maximum Joint Support Fruit Punch', '60 ea', 29.99, 'Walgreens', 'Force Factor');
addProduct('Force Factor Supreme Shilajit Soft Chews Smoked Old Fashioned', '60 ea', 29.99, 'Walgreens', 'Force Factor');

console.log(`✅ Image 4 complete: ${allProducts.length - img4Start} products extracted`);

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
console.log('🎉 Batch 16 Complete - FINAL VITAMINS BATCH!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

