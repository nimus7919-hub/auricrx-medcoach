const fs = require('fs');

console.log('🚀 Extracting Batch 15 (Massive Vitamins and Supplements Collection)...');
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
addProduct('Nature Made Calcium 600 mg with Vitamin D3 Softgels', '100 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('AZO Urinary Tract Health, Dietary Supplement, Tablets Cranberry', '50 ea', 8.99, 'Walgreens', 'AZO');
addProduct('Enfamil D-Vi-Sol Vitamin D Supplement Drops for Infants 50 ml dropper bottle', '1.66 fl oz', 14.99, 'Walgreens', 'Enfamil D-VI-Sol');
addProduct('One A Day Mens Complete Multivitamin Tablets', '200 ea', 21.99, 'Walgreens', 'One A Day');
addProduct('Nature Made Prenatal with Folic Acid + DHA Softgels Orange', '60 ea', 33.99, 'Walgreens', 'Nature Made');
addProduct('Vital Proteins Collagen Peptides', '10 oz', 27.99, 'Walgreens', 'Vital Proteins');

// Row 2
addProduct('Diurex Ultimate Re-Energizing Water Pills', '60 ea', 11.49, 'Walgreens', 'Diurex');
addProduct('Metamucil 4-in-1 Psyllium Fiber Powder Orange', '23.3 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('Airborne Gummies, 750mg of Vitamin C and Minerals & Herbs, Immune Support Zesty Orange', '42 ea', 15.99, 'Walgreens', 'Airborne');
addProduct('ReNew Life Womens Care Probiotic', '30 ea', 34.99, 'Walgreens', 'ReNew Life');
addProduct('Walgreens High Potency Iron Ferrous Gluconate 27 mg Tablets (100 days)', '100 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Natures Bounty Calcium 1200 mg plus Vitamin D3 1000 IU Dietary Supplement Softgels', '120 ea', 21.99, 'Walgreens', 'Natures Bounty');

// Row 3
addProduct('Metamucil 4 in 1 Daily Fiber Supplement Powder, for Digestive Health and Regularity Orange', '6.1 oz', 14.99, 'Walgreens', 'Metamucil');
addProduct('Nature Made Turmeric Curcumin 500 mg Capsules', '120 ea', 27.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Turmeric Curcumin 500 mg Capsules', '60 ea', 15.99, 'Walgreens', 'Nature Made');
addProduct('Osteo Bi-Flex Triple Strength Joint Health', '80 ea', 35.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('NeoCell Collagen Beauty Builder With Hyaluronic Acid and Biotin', '150 EA', 21.99, 'Walgreens', 'NeoCell');
addProduct('Culturelle Daily Probiotic Capsules for Men and Women', '30 ea', 22.99, 'Walgreens', 'Culturelle');

// Row 4
addProduct('Neuriva Brain Health Supplement, Support for Memory, Focus, Concentration and Learning', '30 ea', 29.99, 'Walgreens', 'Neuriva');
addProduct('Walgreens Sugar Free Fiber Powder Smooth Texture Orange', '23.3 oz', 23.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Magnesium Citrate 250 mg Softgels', '120 ea', 29.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made CholestOff Plus Softgels', '100 ea', 36.99, 'Walgreens', 'Nature Made');
addProduct('Metamucil 4-in-1 Psyllium Fiber Powder Orange', '36.8 oz', 45.99, 'Walgreens', 'Metamucil');
addProduct('Natures Bounty Red Yeast Rice 600 mg, Capsules', '120 ea', 29.99, 'Walgreens', 'Natures Bounty');

// Row 5
addProduct('Nature Made Extra Strength Vitamin C 1000 mg Tablets', '300 ea', 49.99, 'Walgreens', 'Nature Made');
addProduct('PreserVision Areds2 Supplement', '60 ea', 23.99, 'Walgreens', 'PreserVision');
addProduct('Nature Made Melatonin 3 mg Tablets', '120 ea', 9.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Calcium 500 mg with Vitamin D3 Tablets', '130 ea', 12.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Vitamin D3 1000 IU (25 mcg) Tablets', '300 ea', 23.99, 'Walgreens', 'Nature Made');
addProduct('Metamucil 3-in-1 Fiber Capsules, Daily Psyllium Husk Supplement, for Digestive Health', '300 ea', 43.99, 'Walgreens', 'Metamucil');

// Row 6
addProduct('Flintstones Childrens Complete Multivitamin Gummies', '180 ea', 22.99, 'Walgreens', 'Flintstones');
addProduct('Zarbees Childrens Sleep Gummies with Melatonin, Berry Natural Berry, Fragrance-Free', '50 ea', 19.99, 'Walgreens', 'Zarbees');
addProduct('Estroven Complete Multi-Symptom Menopause Relief Dietary Supplement Caplets', '28 ea', 22.49, 'Walgreens', 'Estroven');
addProduct('Metamucil Fiber Capsules, 3-in-1 Psyllium Husk Fiber', '160 ea', 29.99, 'Walgreens', 'Metamucil');
addProduct('PreserVision Areds 2 Multi-Vitamins', '100 ea', 39.99, 'Walgreens', 'PreserVision');
addProduct('Nature Made Magnesium 250 mg Softgels', '90 ea', 12.99, 'Walgreens', 'Nature Made');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Feosol Original Iron Supplement Tablets', '120 ea', 12.99, 'Walgreens', 'Feosol');
addProduct('Estroven Weight Management for Menopause Relief', '30 ea', 20.24, 'Walgreens', 'Estroven');
addProduct('Nordic Naturals Ultimate Omega Lemon', '60 ea', 31.99, 'Walgreens', 'Nordic Naturals');
addProduct('Align Probiotic Extra Strength, 5X More Good Bacteria', '21 ea', 32.99, 'Walgreens', 'Align');
addProduct('Emergen-C Fizzy Drink Mix Immune Support Elderberry', '.29 oz x 18 pack', 18.99, 'Walgreens', 'Emergen-C');
addProduct('Ester C Vitamin C 1000 mg Tablets', '90 ea', 18.99, 'Walgreens', 'Ester C');

// Row 2
addProduct('Natures Bounty Extra Strength Co Q-10 200 mg Rapid Release Liquid Softgels', '75 ea', 66.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Fish Oil With Omega 3 Softgels, 1200 Mg', '200 ea', 33.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Optimal Solutions Hair, Skin & Nails Caplets', '60 ea', 15.99, 'Walgreens', 'Natures Bounty');
addProduct('Qunol Mega CoQ10 10 Ubiquinol Dietary Supplement Softgels', '60 ea', 49.99, 'Walgreens', 'Qunol');
addProduct('Walgreens Womens Multivitamin Tablets', '120 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Adults 50+ Eye Health Mini Softgels (90 days)', '90 ea', 17.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Flintstones Complete Multivitamin for Kids Grape, Cherry, Orange & Peach', '150 ea', 22.99, 'Walgreens', 'Flintstones');
addProduct('Emergen-C Immune Support Gummies with 500 mg Vitamin C, Folic Acid, and B Vitamins Orange, Tangerine, Raspberry', '45 ea', 18.99, 'Walgreens', 'Emergen-C');
addProduct('Osteo Bi-Flex Glucosamine Chondroitin plus Joint Shield Dietary Supplement Coated Caplets', '40 ea', 23.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('Nature Made Prenatal Gummies with DHA and Folic Acid Mixed Berry', '60 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Maximum Strength Vitamin B12 5000 mcg Softgels', '60 ea', 24.99, 'Walgreens', 'Nature Made');
addProduct('Natural Vitality Magnesium Supplement Gummies Raspberry Lemon', '120 ea', 34.99, 'Walgreens', 'Natural Vitality');

// Row 4
addProduct('Nature Made Chewable Vitamin C 500 mg Tablets Orange', '60 ea', 17.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty D3 10,000 IU Vitamin Supplement Softgels', '72 ea', 28.99, 'Walgreens', 'Natures Bounty');
addProduct('Osteo Bi-Flex Herbal Formula With Turmeric Capsules Triple Strength', '80 ea', 34.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('CharcoCaps Activated Charcoal Detox & Digestive Relief', '100 ea', 22.99, 'Walgreens', 'CharcoCaps');
addProduct('Natrol 5mg Fast Dissolve Tablets Melatonin Strawberry', '90 ea', 12.99, 'Walgreens', 'Natrol');
addProduct('Walgreens Multivitamin Mens Tablets (200 days) Value Size', '200 ea', 17.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Natures Bounty Flaxseed Oil 1200 mg Dietary Supplement Softgels', '125 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Vitamin B12 Sublingual 3000 mcg Sugar Free Fast Dissolve Tablets', '40 ea', 15.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Q-Sorb CoQ10 100 mg Dietary Supplement Softgels Twinpack', '60 ea x 2 pack', 66.99, 'Walgreens', 'Natures Bounty');
addProduct('Metamucil On The Go Sugar-Free Psyllium Husk Fiber Packets Orange', '44 ea', 29.99, 'Walgreens', 'Metamucil');
addProduct('Nature Made Vitamin B12 1000 mcg Time Release Tablets', '75 ea', 12.99, 'Walgreens', 'Nature Made');
addProduct('Align Prebiotic + Probiotic for Feminine Health Cranberry', '50 ea', 26.99, 'Walgreens', 'Align');

// Row 6
addProduct('Walgreens Adults Multivitamin Tablets (200 days)', '200 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ultra Strength Cranberry Softgels', '100 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Vitamin C 500 mg Tablets', '250 ea', 21.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Melatonin 3 mg Dietary Supplement Tablets', '240 ea', 15.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Calcium Soft Chews (100 days) Chocolate', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Metamucil Fiber Thins, Psyllium Husk Fiber, Supports Digestive Health and Satisfies Hunger Cinnamon Spice', '12 ea', 14.99, 'Walgreens', 'Metamucil');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 36 Products
// ============================================================================
console.log('📸 Extracting Image 3 (36 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Airborne Chewables Citrus', '64 ea', 17.99, 'Walgreens', 'Airborne');
addProduct('Nature Made CoQ10 100 mg Softgels', '40 ea', 29.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made CoQ10 400 mg Softgels', '40 ea', 59.99, 'Walgreens', 'Nature Made');
addProduct('One A Day Womens 50+ Advanced Multivitamin With Immunity + Brain Support Gummies Strawberry', '110 ea', 19.99, 'Walgreens', 'One A Day');
addProduct('Natrol 10 mg Melatonin Gummies Strawberry', '60 ea', 15.99, 'Walgreens', 'Natrol');
addProduct('Natures Bounty Niacin 500 mg Vitamin Supplement Capsules', '120 ea', 31.99, 'Walgreens', 'Natures Bounty');

// Row 2
addProduct('Walgreens Slow Release Iron Ferrous Sulfate 45 mg Tablets (60 days)', '60 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Vitamin C 1000 mg Time Release Tablets with Rose Hips', '60 ea', 21.99, 'Walgreens', 'Nature Made');
addProduct('Florajen Womens Refrigerated Probiotics, 15 Billion CFUs', '30 ea', 18.99, 'Walgreens', 'Florajen');
addProduct('Metamucil 4-in-1 Psyllium Fiber Powder, Sugar-Free Orange, 72 teaspoons', '15 oz', 24.99, 'Walgreens', 'Metamucil');
addProduct('PURE Zzzs De-Stress Gummy, Sleep Aid, Melatonin 2mg, with Ashwagandha Blackberry Vanilla', '42 ea', 17.99, 'Walgreens', 'PURE Zzzs');
addProduct('Walgreens Multivitamin Adults 50+ Tablets (220 days)', '220 ea', 19.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Triple Action Joint Health Tablets (40 days)', '40 ea', 25.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Burp Less Fish Oil 1200 mg Softgels', '60 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Mens 50+ Multivitamin Tablets (100 days)', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Natrol Melatonin 10 mg, Time Release to Minimize Wake-Ups Unflavored', '100 ea', 19.99, 'Walgreens', 'Natrol');
addProduct('Walgreens Womens Multivitamin Tablets (200 days)', '200 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Melatonin 5 mg Liquid Natural Cherry', '6 fl oz', 9.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('OLLY Probiotic Tropical Mango', '50 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Walgreens Extra Strength Antarctic Pure Krill Oil 500 mg Softgels (80 days)', '80 ea', 36.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ultra Collagen + Vitamin C Tablets (30 days)', '90 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Airborne Vitamin C, E, Zinc, Minerals & Herbs Immune Support Supplement Gummies Very Berry', '42 ea', 15.99, 'Walgreens', 'Airborne');
addProduct('Natures Bounty Red Yeast Rice 600 mg Dietary Supplement Capsules', '250 ea', 47.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Fish Oil With Omega 3 Softgels, 1000 Mg', '120 ea', 25.99, 'Walgreens', 'Natures Bounty');

// Row 5
addProduct('Walgreens One Daily Womens Multivitamin (100 days)', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens One Daily Multivitamin Women (200 days)', '200 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Vitamin C Effervescent Powder Blend Orange', '10 ea', 5.49, 'Walgreens', 'Walgreens');
addProduct('Vivarin Caffeine Alertness Aid 200 mg Tablets', '40 ea', 10.99, 'Walgreens', 'Vivarin');
addProduct('Nature Made Vitamin D3 1000 IU (25 mcg) Softgels', '100 ea', 15.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Glucosamine Chondroitin Tablets Triple Strength (40 days)', '80 ea', 23.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Natures Bounty D3-1000 IU Vitamin Supplement Softgels', '100 ea', 11.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Vitamin C Immune Support Gummies Orange', '80 ea', 15.99, 'Walgreens', 'Natures Bounty');
addProduct('Natrol 10mg Fast Dissolve Melatonin Tablets Strawberry', '60 ea', 13.99, 'Walgreens', 'Natrol');
addProduct('Natures Bounty Super Strength Melatonin 5 mg Dietary Supplement Softgels', '90 ea', 15.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Vitamin D3 Rapid Release Softgels, 1000 IU', '250 ea', 17.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Co Q-10 400 mg Rapid Release Dietary Supplement Liquid Softgels', '39 ea', 59.99, 'Walgreens', 'Natures Bounty');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 6 Products (partial row)
// ============================================================================
console.log('📸 Extracting Image 4 (6 products)...');
const img4Start = allProducts.length;

addProduct('Walgreens Cranberry 500 mg Tablets (60 days)', '60 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Timed Release Vitamin B12 1000 mcg Tablets (60 days)', '60 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Extra Strength Zinc 30 mg Gummies', '60 ea', 21.99, 'Walgreens', 'Nature Made');
addProduct('Garden of Life My Kind Organics Women Multivitamin Tablets', '30 ea', 21.99, 'Walgreens', 'Garden of Life');
addProduct('Walgreens Cod Liver Oil 415 mg Softgels (300 days)', '300 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Dye-Free Melatonin 5 mg Tablets (150 days) Natural Cherry', '150 ea', 13.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 4 complete: ${allProducts.length - img4Start} products extracted`);

// ============================================================================
// IMAGE 5: 36 Products
// ============================================================================
console.log('📸 Extracting Image 5 (36 products)...');
const img5Start = allProducts.length;

// Row 1
addProduct('Natures Bounty 10 mg Melatonin Gummies Blueberry', '140 ea', 22.99, 'Walgreens', 'Natures Bounty');
addProduct('PreserVision AREDS 2 MiniGels', '130 ea', 41.99, 'Walgreens', 'PreserVision');
addProduct('PURE Zzzs Triple Action, Sleep Aid, Melatonin Gummies, 6 mg with Ashwagandha Blackberry Vanilla', '42 ea', 17.99, 'Walgreens', 'PURE Zzzs');
addProduct('Walgreens Calcium 600 mg Plus Vitamin D3 20 mcg Tablets (250 days)', '250 EA', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Timed Release Vitamin B12 1000 mcg Tablets (300 days)', '300 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens CoQ-10 200 mg Softgels (90 days)', '90 ea', 49.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens High Potency Zinc 50 mg Caplets (100 days)', '100 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Magnesium 250 mg Tablets (300 days)', '300 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Apple Cider Vinegar 500 mg Gummies Natural Apple', '60 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens L-Theanine 200 mg Capsules (60 days)', '60 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Prebiotic + Probiotic Gummies Natural Peach, Strawberry & Mixed Berry', '60 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Natures Bounty Elderberry Gummies', '70 ea', 33.99, 'Walgreens', 'Natures Bounty');

// Row 3
addProduct('Walgreens Potassium 99 mg Caplets (250 days)', '250 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Triple Strength Cranberry Capsules (30 days)', '60 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Centrum Men 50+, Multivitamin & Multimineral Gummies Assorted Fruit', '80 ea', 14.99, 'Walgreens', 'Centrum');
addProduct('Walgreens Saw Palmetto 450 mg Capsules', '250 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('Centrum Multivitamin Gummies for Women Fruit', '170 ea', 14.99, 'Walgreens', 'Centrum');
addProduct('Liquid I.V. Immune Support Drink Mix Tangerine, 6ct', '0.56 oz x 6 pack', 12.99, 'Walgreens', 'Liquid I.V.');

// Row 4
addProduct('Walgreens Apple Cider Vinegar 480 mg Tablets (50 days)', '100 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ashwagandha Root Gummies Mixed Berry', '60 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Vitamin B6 100 mg Tablets (100 days)', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Natures Bounty Apple Cider Vinegar Gummies', '60 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Maximum Strength Diuretic Softgels', '48 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Vitamin D3 25 mcg Softgels (100 days)', '100 ea', 8.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Childrens Sleep Pure Gummies Melatonin 1 mg Berry', '48 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens High Potency Zinc 50 mg Caplets (300 days)', '300 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Osteo Bi-Flex One Per Day Inflammatory Response', '30 ea', 29.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('Walgreens Super B-Complex with Vitamin C Tablets (120 days)', '120 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Centrum Women Multivitamin & Multimineral Gummies Assorted Fruit', '100 ea', 10.99, 'Walgreens', 'Centrum');
addProduct('Walgreens Sleep Aid Gummies Berry', '48 ea', 14.49, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Walgreens Enhanced Absorption Turmeric Complex with BioPerine Capsules (60 days)', '120 EA', 12.99, 'Walgreens', 'Walgreens');
addProduct('OLLY Lovin Libido Capsules', '40 ea', 22.99, 'Walgreens', 'OLLY');
addProduct('Extenze Male Supplement', '30 ea', 49.99, 'Walgreens', 'Extenze');
addProduct('Alive! Womens Energy Multi-Vitamin Tablets', '50 ea', 13.99, 'Walgreens', 'Alive!');
addProduct('Metamucil 4-in-1 Fiber Supplement for Digestive Health, Psyllium Husk Powder Orange', '48.2 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('Amberen Multi-Symptom Menopause Relief Capsules', '60 ea', 34.99, 'Walgreens', 'Amberen');

console.log(`✅ Image 5 complete: ${allProducts.length - img5Start} products extracted`);

// ============================================================================
// IMAGE 6: 36 Products
// ============================================================================
console.log('📸 Extracting Image 6 (36 products)...');
const img6Start = allProducts.length;

// Row 1
addProduct('Estroven Menopause Stress Relief & Energy Boost', '28 ea', 19.49, 'Walgreens', 'Estroven');
addProduct('ReNew Life Day Cleanse Total Body Reset, Part Detox Cleanse Supplement Capsules', '12 ea', 9.99, 'Walgreens', 'ReNew Life');
addProduct('Libido-Max Male Enhancement Dietary Supplement Liquid Soft-Gels', '75 ea', 21.74, 'Walgreens', 'Libido-Max');
addProduct('Align Probiotics for Women and Men, Daily Supplement for Digestive Health, Capsules', '28 ea', 32.99, 'Walgreens', 'Align');
addProduct('Nature Made Fish Oil 1200 mg Softgels', '100 ea', 34.99, 'Walgreens', 'Nature Made');
addProduct('AZO Urinary Tract Health Dietary Supplement Softgels', '100 EA', 16.49, 'Walgreens', 'AZO');

// Row 2
addProduct('Neuriva Brain Health Supplement Gummies, for Memory, Focus, Concentration and Learning Strawberry', '50 ea', 29.99, 'Walgreens', 'Neuriva');
addProduct('Relacore Ultimate Super Fat Burning Belly Bulge Kit, 2-Part System', '1 ea', 29.99, 'Walgreens', 'Relacore');
addProduct('Culturelle Immune & Digestive Support Probiotic + Vitamin D Drops, 0-12 Months', '9 mL', 29.99, 'Walgreens', 'Culturelle');
addProduct('Benefiber Prebiotic Fiber Supplement Powder Unflavored, 62 dose', '8.7 oz', 19.99, 'Walgreens', 'Benefiber');
addProduct('OLLY Kids Sleep', '50 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Irwin Naturals Testosterone Up Red Liquid Softgels', '60 ea', 22.49, 'Walgreens', 'Irwin Naturals');

// Row 3
addProduct('Hydroxycut Weight Loss Drink Mix, Sugar Free Wildberry Blast Wildberry', '21 ea', 27.99, 'Walgreens', 'Hydroxycut');
addProduct('Walgreens Mens Multivitamin Dietary Supplement (120 days)', '120 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('One A Day Mens Pro Edge Multivitamin', '50 ea', 15.99, 'Walgreens', 'One A Day');
addProduct('Nature Made Melatonin 2.5 mg Gummies Strawberry', '80 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Ginseng Complex Capsules', '75 ea', 12.99, 'Walgreens', 'Natures Bounty');
addProduct('PreserVision AREDS Eye Vitamin & Mineral Supplement Tablets', '120 ea', 31.99, 'Walgreens', 'PreserVision');

// Row 4
addProduct('Natures Bounty Gentle Iron Glycinate 28 mg Capsules, Supports Red Blood Cells', '90 ea', 11.99, 'Walgreens', 'Natures Bounty');
addProduct('Real Health Prostate Formula Tablets', '270 ea', 38.99, 'Walgreens', 'Real Health');
addProduct('Qunol Ultra 100 mg CoQ10 Dietary Supplement Softgels', '30 ea', 28.99, 'Walgreens', 'Qunol');
addProduct('Feosol Complete Iron Supplement Caplets, Iron for High Absorption', '30 ea', 24.99, 'Walgreens', 'Feosol');
addProduct('Walgreens Antarctic Krill Oil 350 mg Softgels', '120 ea', 34.99, 'Walgreens', 'Walgreens');
addProduct('Liverite Liver Aid Dietary Supplement Tablets', '90 ea', 21.99, 'Walgreens', 'Liverite');

// Row 5
addProduct('PreserVision Areds2 Supplement', '90 ea', 32.99, 'Walgreens', 'PreserVision');
addProduct('One A Day Prenatal Multivitamin Gummies', '60 ea', 21.99, 'Walgreens', 'One A Day');
addProduct('Qunol Ultra CoQ10 Dietary Supplement Softgels', '60 ea', 49.99, 'Walgreens', 'Qunol');
addProduct('Nature Made Multivitamin + Omega-3 Gummies Strawberry, Lemon & Orange', '140 ea', 26.99, 'Walgreens', 'Nature Made');
addProduct('OLLY Immunity Sleep + Elderberry Gummies', '36 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('One A Day Womens Multivitamin Gummies', '170 ea', 19.99, 'Walgreens', 'One A Day');

// Row 6
addProduct('Osteo Bi-Flex Triple Strength + MSM, Coated Tablets', '80 ea', 34.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('Estroven Sleep Cool for Menopause Relief, Night Sweats & Hot Flash Relief', '30 EA', 14.24, 'Walgreens', 'Estroven');
addProduct('Nature Made Extra Strength Vitamin B12 2500 mcg Tablets', '60 ea', 17.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty CoQ-10 200 mg', '80 ea x 2 pack', 99.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Maximum Strength Biotin 5000 mcg Softgels', '120 ea', 25.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Vitamin E 450 mg (1000 IU) dl-Alpha Softgels', '60 ea', 21.99, 'Walgreens', 'Nature Made');

console.log(`✅ Image 6 complete: ${allProducts.length - img6Start} products extracted`);

// ============================================================================
// IMAGE 7: 36 Products
// ============================================================================
console.log('📸 Extracting Image 7 (36 products)...');
const img7Start = allProducts.length;

// Row 1
addProduct('ZzzQuil Melatonin Gummies, Sleep Aid Wildberry Vanilla', '48 ea', 17.99, 'Walgreens', 'ZzzQuil');
addProduct('One A Day Mens Multivitamin Gummies', '170 ea', 19.99, 'Walgreens', 'One A Day');
addProduct('Walgreens One Daily Mens Multivitamin Tablets (200 days)', '200 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Natrol Advanced Melatonin 10mg Time Release Tablets, Nighttime Sleep Aid Unflavored', '60 ea', 13.99, 'Walgreens', 'Natrol');
addProduct('Natures Bounty Vitamin D3-2000 IU, Softgels', '240 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('OLLY Daily Energy Gummies - Caffeine Free Tropical Passion', '60 ea', 12.99, 'Walgreens', 'OLLY');

// Row 2
addProduct('Align Health Prebiotic + Probiotic Supplement Gummies Fruit', '50 ea', 26.99, 'Walgreens', 'Align');
addProduct('Natures Bounty Turmeric 538mg, Capsules', '45 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Dye-Free Melatonin 3 mg Cherry', '30 ea', 3.99, 'Walgreens', 'Walgreens');
addProduct('Caltrate 600+D3 Calcium Supplement Tablet', '60 ea', 9.99, 'Walgreens', 'Caltrate');
addProduct('Natures Bounty Sleep3 Tri-Layer', '60 ea', 27.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Advanced Omega-3 Fish Oil 500 mg Softgels (80 days)', '80 ea', 34.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Airborne Effervescent Tablets, Vitamin C - Immune Support Supplement Zesty Orange', '20 ea', 14.99, 'Walgreens', 'Airborne');
addProduct('Walgreens Dye-Free Melatonin 5 mg Cherry', '30 ea', 4.99, 'Walgreens', 'Walgreens');
addProduct('Culturelle Kids Daily Probiotic + Veggie Fiber Gummies Berry Blast', '30 ea', 19.99, 'Walgreens', 'Culturelle');
addProduct('Walgreens Dye-Free Melatonin 10 mg Tablets Cherry', '30 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Melatonin Gummies 10mg Strawberry', '150 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('Emergen-C Daily Immune Support Drink with 1000 mg Vitamin C, Antioxidants, & B Vitamins', '0.33 oz x 30 pack', 18.99, 'Walgreens', 'Emergen-C');

// Row 4
addProduct('Walgreens Vitamin D3 50 mcg Softgels (150 days)', '150 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Vitafusion Mens Gummy Vitamins Berry', '150 ea', 16.99, 'Walgreens', 'Vitafusion');
addProduct('Natrol Sleep+ Calm Gummies Strawberry', '60 ea', 19.99, 'Walgreens', 'Natrol');
addProduct('Airborne Vitamin C, E, Zinc, Minerals & Herbs Immune Support Supplement Gummies Assorted Fruit', '63 ea', 20.24, 'Walgreens', 'Airborne');
addProduct('Align Daily Probiotic Supplement for Digestive Health Capsules', '14 ea', 22.99, 'Walgreens', 'Align');
addProduct('Airborne Vitamin C, E, Zinc, Minerals & Herbs Kids Immune Support Supplement Gummies Assorted Fruit', '63 ea', 20.24, 'Walgreens', 'Airborne');

// Row 5
addProduct('Walgreens Clinical Strength Probiotic Capsules (30 days) 15 Billion Active Cultures', '30 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Diabetes Doctor Dr. Stephanies Carb & Sugar Blocker Weight Loss Program Capsules', '45 ea', 29.99, 'Walgreens', 'Diabetes Doctor');
addProduct('Garden of Life Dr. Formulated Digestive & Immune + Zinc', '30 ea', 19.99, 'Walgreens', 'Garden of Life');
addProduct('Walgreens Vitamin C 1000 mg with Natural Rose Hips Tablets (200 days)', '200 ea', 25.99, 'Walgreens', 'Walgreens');
addProduct('Garden of Life Probiotics Critical Care', '30 EA', 36.99, 'Walgreens', 'Garden of Life');
addProduct('Osteo Bi-Flex Glucosamine Chondroitin with Joint Shield Coated Tablets', '80 ea x 2 pack', 62.99, 'Walgreens', 'Osteo Bi-Flex');

// Row 6
addProduct('Walgreens Mens 50+ Once Daily Multivitamin Tablets (100 days)', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Garden of Life Dr. Formulated Mens Daily Care Probiotic Capsules', '30 ea', 24.99, 'Walgreens', 'Garden of Life');
addProduct('Walgreens Vitamin B6 100 mg Tablets (300 days)', '300 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('One A Day Womens 50+ Healthy Advantage Multivitamin Tablets', '65 ea', 13.99, 'Walgreens', 'One A Day');
addProduct('Difeel Tea Tree Pure Essential Oil', '1 OZ', 7.99, 'Walgreens', 'Difeel');
addProduct('Walgreens Timed Release Vitamin B12 1000 mcg Tablets (150 days)', '150 ea', 17.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 7 complete: ${allProducts.length - img7Start} products extracted`);

// ============================================================================
// IMAGE 8: 33 Products (6x6 grid, last 3 slots empty)
// ============================================================================
console.log('📸 Extracting Image 8 (33 products)...');
const img8Start = allProducts.length;

// Row 1
addProduct('OLLY Sleep Gummies Blackberry Zen', '70 ea', 16.99, 'Walgreens', 'OLLY');
addProduct('Centrum Adults Multivitamin Tablets', '200 ea', 19.99, 'Walgreens', 'Centrum');
addProduct('Hydroxycut Original Weight Loss Rapid Release Capsules', '72 ea', 29.99, 'Walgreens', 'Hydroxycut');
addProduct('OLLY Hello Happy Gummies', '60 ea', 18.99, 'Walgreens', 'OLLY');
addProduct('Nordic Naturals Ultimate Omega 2X Soft Gels Lemon', '60 EA', 49.99, 'Walgreens', 'Nordic Naturals');
addProduct('Walgreens Apple Cider Vinegar Gummies (60 days) Natural Apple', '60 ea', 12.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Lecithin 1200 mg Softgels (200 days)', '200 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Vitamin C 750 mg Gummies (15 days)', '45 ea', 9.59, 'Walgreens', 'Walgreens');
addProduct('Urinozinc Prostate Plus, Clinical Strength Saw Palmetto & Beta Sistosterol Supplement', '75 ea', 19.99, 'Walgreens', 'Urinozinc');
addProduct('Neuriva Brain + Eye Health Support Capsules', '30 ea', 29.99, 'Walgreens', 'Neuriva');
addProduct('Walgreens Quick Dissolve Vitamin B12 5000 mcg Tablets (90 days) Natural Cherry', '90 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Calcium 1200 mg Plus Vitamin D3 25 mcg Softgels (100 days)', '100 ea', 22.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Once Daily Prenatal Multivitamin Softgels (30 days)', '30 ea', 11.19, 'Walgreens', 'Walgreens');
addProduct('Walgreens Glucosamine HCI Chondroitin Sulfate Caplets Triple Strength (120 days)', '240 ea', 52.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Probiotic + Fiber Capsules', '120 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Magnesium 400 mg Softgels (60 days)', '60 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Organic Mens Multivitamin Gummies (30 days) Natural Raspberry, Strawberry & Cherry', '90 ea', 14.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Free & Pure Organic Womens Multivitamin Gummies (30 days) Natural Raspberry, Strawberry & Cherry', '90 ea', 14.99, 'Walgreens', 'Walgreens Free & Pure');

// Row 4
addProduct('Walgreens Childrens Melatonin 1 mg Gummies Mixed Berry', '50 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Lutein 40 mg Softgels (30 days)', '30 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Prenatal Multivitamin Tablets (240 days)', '240 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Vitamin B12 100 mcg Tablets (100 days)', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Magnesium 400 mg Tablets (120 days)', '120 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Triple Strength Glucosamine HCI 1500 mg plus MSM 1500 mg Caplets (90 days)', '180 ea', 34.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Nugenix Ultimate Advanced Free Testosterone Complex Dietary Supplement Tablets', '56 ea', 39.99, 'Walgreens', 'Nugenix');
addProduct('Walgreens Vitamin C with Natural Rose Hips 500 mg Tablets (200 days)', '200 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Chromium 1000 mcg Tablets (100 days)', '100 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Centrum Men Multivitamin & Multimineral Gummies Assorted Fruit', '100 ea', 10.99, 'Walgreens', 'Centrum');
addProduct('Walgreens Melatonin with Lemon Balm 10 mg Tablets (60 days)', '60 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Immune Support Vitamin C 1000 mg Tablets (20 days) Orange', '20 ea', 9.59, 'Walgreens', 'Walgreens');

// Row 6 (partial - 3 products)
addProduct('Walgreens Vitamin D3 250 mcg Softgels (60 days)', '60 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Immune Support Vitamin C Gummies', '63 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('ReNew Life Extra Care Digestive Probiotic Capsules', '30 ea', 26.99, 'Walgreens', 'ReNew Life');

console.log(`✅ Image 8 complete: ${allProducts.length - img8Start} products extracted`);

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
console.log('🎉 Batch 15 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

