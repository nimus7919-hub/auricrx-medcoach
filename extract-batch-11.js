const fs = require('fs');

console.log('🚀 Extracting Batch 11 (More Digestive Health, Probiotics, Antacids)...');
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
// IMAGE 1: 36 Products (Dulcolax, MiraLAX, Align, Citrucel, etc.)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Dulcolax Stool Softener Laxative Liquid Gel Capsules', '100 ea', 29.99, 'Walgreens', 'Dulcolax');
addProduct('MiraLAX Mix-In Pax, Constipation Relief Laxative Unflavored', '0.5 oz x 10 pack', 19.99, 'Walgreens', 'MiraLAX');
addProduct('Align Probiotic Extra Strength, 5X More Good Bacteria', '21 ea', 32.99, 'Walgreens', 'Align');
addProduct('Citrucel Fiber Therapy Caplets for Occasional Constipation Relief Unflavored', '100 ea', 21.99, 'Walgreens', 'Citrucel');
addProduct('Nexium 24 Hour Clear Mini Delayed Release Heartburn Relief Capsules', '14 ea', 12.99, 'Walgreens', 'Nexium');
addProduct('Lactaid Original Strength Lactose Intolerance Relief Caplets', '120 ea', 16.99, 'Walgreens', 'Lactaid');

// Row 2
addProduct('Tums Soft Chewable Antacid Very Cherry', '32 ea', 8.49, 'Walgreens', 'Tums');
addProduct('CharcoCaps Activated Charcoal Detox & Digestive Relief', '100 ea', 22.99, 'Walgreens', 'CharcoCaps');
addProduct('Lactaid Fast Act Lactose Intolerance Caplets', '32 ea', 14.99, 'Walgreens', 'Lactaid');
addProduct('Gas-X Gas Relief Extra Strength', '72 ea', 21.99, 'Walgreens', 'Gas-X');
addProduct('Pepcid Complete Acid Reducer + Antacid Chewable Tablets Mint', '50 ea', 24.99, 'Walgreens', 'Pepcid Complete');
addProduct('Metamucil On The Go Sugar-Free Psyllium Husk Fiber Packets Orange', '44 ea', 29.99, 'Walgreens', 'Metamucil');

// Row 3
addProduct('Senokot Extra Strength Natural Vegetable Laxative Tablets', '12 ea', 9.29, 'Walgreens', 'Senokot');
addProduct('Align Prebiotic + Probiotic for Feminine Health Cranberry', '50 ea', 26.99, 'Walgreens', 'Align');
addProduct('Dulcolax Medicated Stimulant Laxative Suppositories', '4 ea', 11.99, 'Walgreens', 'Dulcolax');
addProduct('Walgreens Antacid + Anti-Gas Liquid Maximum Strength Classic', '12 fl oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Famotidine Complete Chews Berry', '50 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Gas-X Ultra Strength Gas Relief Softgels', '50 ea', 19.99, 'Walgreens', 'Gas-X');

// Row 4
addProduct('Metamucil Fiber Thins, Psyllium Husk Fiber, Supports Digestive Health and Satisfies Hunger Cinnamon Spice', '12 ea', 14.99, 'Walgreens', 'Metamucil');
addProduct('Tums Chewable Antacid Tablets Peppermint', '72 ea', 8.49, 'Walgreens', 'Tums');
addProduct('Pepto-Bismol Chewable Tablets Cherry', '30 ea', 9.49, 'Walgreens', 'Pepto-Bismol');
addProduct('Phillips Milk of Magnesia Saline Laxative Cherry', '12 fl oz', 9.99, 'Walgreens', 'Phillips');
addProduct('DiaResQ Toddlers Diarrhea Relief Vanilla', '0.25 oz x 3 pack', 11.99, 'Walgreens', 'DiaResQ');
addProduct('Alka-Seltzer Effervescent Tablets, Dissolvable Antacid Lemon Lime', '36 ea', 8.99, 'Walgreens', 'Alka-Seltzer');

// Row 5
addProduct('Florajen Womens Refrigerated Probiotics, 15 Billion CFUs', '30 ea', 18.99, 'Walgreens', 'Florajen');
addProduct('Metamucil 4-in-1 Psyllium Fiber Powder, Sugar-Free Orange', '72 teaspoons - 15 oz', 24.99, 'Walgreens', 'Metamucil');
addProduct('Senokot Regular Strength, Standardized Senna Concentrate', '50 ea', 18.99, 'Walgreens', 'Senokot');
addProduct('Pepto-Bismol Liquid 5 Symptom Fast Relief Cherry', '12 fl oz', 12.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Pepcid Complete Acid Reducer + Antacid Chewable Tablets Berry', '50 ea', 24.99, 'Walgreens', 'Pepcid Complete');
addProduct('Walgreens Stimulant Laxative Pieces Chocolate', '24 ea', 5.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Walgreens Gas Relief Chewable Tablets Extra Strength Cherry Creme', '18 ea', 7.49, 'Walgreens', 'Walgreens');
addProduct('OLLY Probiotic Tropical Mango', '50 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Pepto-Bismol Caplets for 5 Symptom Fast Relief in a Convenient Form', '24 ea', 10.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Nexium Acid Reducer Delayed Release Capsules', '14 ea', 12.99, 'Walgreens', 'Nexium');
addProduct('Walgreens Omeprazole Delayed Release Orally Disintegrating Tablets Strawberry', '14 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Tums Smoothies Antacid Berry Fusion', '140 ea', 14.99, 'Walgreens', 'Tums Smoothies');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Motion Sickness, Pedialyte, Zantac, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Walgreens Motion Sickness Relief Tablets', '24 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Pedialyte AdvancedCare Electrolyte Solution Blue Raspberry', '33.8 fl oz', 7.49, 'Walgreens', 'Pedialyte');
addProduct('Walgreens Gentle Laxative Comfort-Coated Tablets', '25 ea', 6.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Milk of Magnesia Liquid Cherry', '26 fl oz', 11.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ultra Strength Antacid Tablets 1000 Assorted Berry', '160 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Pedialyte AdvancedCare Electrolyte Solution Ready-to-Drink Cherry Punch (Actual Item May Vary)', '33.8 fl oz', 7.49, 'Walgreens', 'Pedialyte');

// Row 2
addProduct('Walgreens Milk of Magnesia Mint', '12 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Tums Antacid Chewable Extra Strength Tablets Assorted Fruit (Actual Item May Vary)', '8 ea x 3 pack', 3.79, 'Walgreens', 'Tums');
addProduct('Pepto-Bismol Caplets for Nausea, Heartburn, Indigestion, Upset Stomach, and Diarrhea', '24 ea', 13.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Walgreens Antacid Flavor Chews Extra Strength Assorted Fruit', '90 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ultra Strength Antacid Chewable Tablets, 1000 mg Assorted Fruit', '72 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Alka-Seltzer Heartburn + Pain Effervescent Tablets Original', '24 ea', 7.99, 'Walgreens', 'Alka-Seltzer');

// Row 3
addProduct('Alka-Seltzer Effervescent Tablets Original', '36 ea', 8.99, 'Walgreens', 'Alka-Seltzer');
addProduct('Walgreens Advantage Care Plus Electrolyte Solution Berry Frost', '33.8 fl oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Electrolyte Solution With Zinc Mango', '33.8 fl oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Zantac Maximum Strength Famotidine Tablets 20 mg', '90 ea', 29.99, 'Walgreens', 'Zantac');
addProduct('Zantac 360 Maximum Strength Heartburn Relief Tablets', '25 ea', 13.99, 'Walgreens', 'Zantac');
addProduct('Prilosec OTC Heartburn Relief, Omeprazole, Acid Reducer Tablets', '14 ea', 12.99, 'Walgreens', 'Prilosec OTC');

// Row 4
addProduct('Alka-Seltzer Antacid+Antigas Fruit', '28 ea', 8.79, 'Walgreens', 'Alka-Seltzer');
addProduct('Walgreens Anti-Diarrheal Softgels', '12 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Gas Relief', '72 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Nausea Bags', '5 ea', 6.79, 'Walgreens', 'Walgreens');
addProduct('Kaopectate Multi-Symptom Relief for Diarrhea & Upset Stomach Vanilla', '11 fl oz', 8.49, 'Walgreens', 'Kaopectate');
addProduct('Tums Antacid Chewable Tablets Tropical Fruit', '72 ea', 8.49, 'Walgreens', 'Tums');

// Row 5
addProduct('Dulcolax Stimulant Laxative Tablets for Constipation Relief', '25 ea', 10.99, 'Walgreens', 'Dulcolax');
addProduct('Dulcolax Stimulant Laxative Tablets for Constipation Relief', '100 ea', 29.99, 'Walgreens', 'Dulcolax');
addProduct('Dulcolax Stimulant Laxative Tablets for Constipation Relief (Actual Item May Vary)', '50 ea', 17.99, 'Walgreens', 'Dulcolax');
addProduct('Dulcolax Stool Softener Laxative Liquid Gel Capsules', '25 ea', 10.99, 'Walgreens', 'Dulcolax');
addProduct('Walgreens Prebiotic + Probiotic Gummies Natural Peach, Strawberry & Mixed Berry', '60 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Stool Softener 100 mg Softgels', '30 ea', 5.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Walgreens Gas Relief Softgels', '60 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Kaopectate Multi-Symptom Anti-Diarrheal & Upset Stomach Relief', '42 ea', 9.79, 'Walgreens', 'Kaopectate');
addProduct('Walgreens Maximum Strength Acid Controller Tablets', '50 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Dramamine Less Drowsy Chewable Formula Raspberry Cream', '12 ea', 10.99, 'Walgreens', 'Dramamine');
addProduct('Metamucil 4-in-1 Fiber Supplement for Digestive Health, Psyllium Husk Powder Orange', '48.2 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('Picot Antacid Packets', '12 ea', 2.99, 'Walgreens', 'Picot');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 36 Products (Mommy's Bliss, Align, Dramamine, etc.)
// ============================================================================
console.log('📸 Extracting Image 3 (36 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Mommys Bliss Gripe Water Day + Night Combo Pack', '4 fl oz x 2 pack', 24.99, 'Walgreens', 'Mommys Bliss');
addProduct('Align Probiotics for Women and Men', '28 ea', 32.99, 'Walgreens', 'Align');
addProduct('Dramamine Advanced Herbals Non-Drowsy Naturals Motion Sickness Relief Capsules', '18 ea', 10.99, 'Walgreens', 'Dramamine');
addProduct('Imodium Multi-Symptom Relief Anti-Diarrheal Medicine Caplets', '12 ea', 12.99, 'Walgreens', 'Imodium');
addProduct('Culturelle Immune & Digestive Support Probiotic + Vitamin D Drops', '9 mL', 29.99, 'Walgreens', 'Culturelle');
addProduct('Pepcid AC Original Strength For Heartburn Prevention & Relief Tablets', '30 ea', 16.99, 'Walgreens', 'Pepcid AC');

// Row 2
addProduct('Benefiber Prebiotic Fiber Supplement Powder Unflavored', '62 dose - 8.7 oz', 19.99, 'Walgreens', 'Benefiber');
addProduct('Pepcid Complete Acid Reducer + Antacid Chewable Tablets Berry', '25 ea', 16.99, 'Walgreens', 'Pepcid Complete');
addProduct('Liverite Liver Aid Dietary Supplement Tablets', '90 ea', 21.99, 'Walgreens', 'Liverite');
addProduct('Phillips Laxative Caplets Magnesium Supplement', '100 ea', 23.99, 'Walgreens', 'Phillips');
addProduct('Prilosec OTC Heartburn Relief, Omeprazole, Acid Reducer Tablets', '28 ea', 24.99, 'Walgreens', 'Prilosec OTC');
addProduct('Walgreens Omeprazole Delayed Release Tablets', '28 ea', 17.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Electrolyte Solution Unflavored', '33.8 fl oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Pepcid Complete Acid Reducer + Antacid Chews Tropical Fruit', '50 ea', 24.99, 'Walgreens', 'Pepcid Complete');
addProduct('Beano Food Enzyme Dietary Supplement Tablets', '100 ea', 19.99, 'Walgreens', 'Beano');
addProduct('Walgreens Advanced Antacid Liquid Mint', '26 fl oz', 15.99, 'Walgreens', 'Walgreens');
addProduct('Pepto-Bismol Chewable Tablets Original', '48 ea', 13.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Pepto-Bismol Liquid for Nausea, Heartburn, Indigestion, Upset Stomach, and Diarrhea Cherry', '16 fl oz', 13.99, 'Walgreens', 'Pepto-Bismol');

// Row 4
addProduct('Walgreens Antacid + Anti-Gas Liquid Regular Strength Cherry', '12 fl oz', 8.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Omeprazole Capsules', '28 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Align Health Prebiotic + Probiotic Supplement Gummies Fruit', '50 ea', 26.99, 'Walgreens', 'Align');
addProduct('Pepto-Bismol Liquid for Nausea, Heartburn, Indigestion, Upset Stomach, and Diarrhea Original', '12 fl oz x 2 pack', 15.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Tums Ultra Strength Chewable Antacid Tablets Assorted Berries', '72 ea', 8.49, 'Walgreens', 'Tums');
addProduct('Tums Chewable Antacid Tablets Assorted Fruit', '72 ea', 8.49, 'Walgreens', 'Tums');

// Row 5
addProduct('Tums Chewable Extra Strength Antacid Tablets Assorted Fruit (Actual Item May Vary)', '60 ea', 8.49, 'Walgreens', 'Tums');
addProduct('Walgreens Anti-Diarrheal + Anti-Gas Caplets', '12 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ultra Strength Antacid Tablets 1000 Chewable Tablets Assorted Fruit', '160 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Senokot Extra Strength Natural Vegetable Laxative Tablets', '36 ea', 22.99, 'Walgreens', 'Senokot');
addProduct('Pepto-Bismol Liquid Ultra for 5 Symptom Fast Relief Original (Actual Item May Vary)', '4 fl oz', 7.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Walgreens Advantage Care Electrolyte Solution Tropical Fruit', '33.8 fl oz', 6.49, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Culturelle Kids Daily Probiotic + Veggie Fiber Gummies Berry Blast', '30 ea', 19.99, 'Walgreens', 'Culturelle');
addProduct('Tums Antacid Chewable Tablets, Smoothies for Heartburn Relief Assorted Fruit (Actual Item May Vary)', '12 ea', 3.29, 'Walgreens', 'Tums');
addProduct('Walgreens Advantage Care Electrolyte Solution with Prevital Prebiotics Blue Raspberry', '33.8 fl oz', 6.49, 'Walgreens', 'Walgreens');
addProduct('Zantac Maximum Strength Famotidine Tablets 20 mg', '50 ea', 23.99, 'Walgreens', 'Zantac');
addProduct('Walgreens Omeprazole Delayed Release Coated Tablets Wildberry Mint', '14 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Alka-Seltzer Antacid Chewable Tablets Tropical Punch', '110 ea', 19.99, 'Walgreens', 'Alka-Seltzer');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 30 Products (Garden of Life, Liquid IV, ReNew Life, etc.)
// ============================================================================
console.log('📸 Extracting Image 4 (30 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('Align Daily Probiotic Supplement for Digestive Health Capsules', '14 ea', 22.99, 'Walgreens', 'Align');
addProduct('Walgreens Maximum Strength Acid Controller Tablets Cool Mint', '50 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Clinical Strength Probiotic Capsules (30 days) 15 Billion Active Cultures (Packaging May Vary)', '30 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Senna Extra Strength Softgels', '200 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Garden of Life Dr. Formulated Digestive & Immune + Zinc', '30 ea', 19.99, 'Walgreens', 'Garden of Life');

// Row 2
addProduct('Walgreens Sugar Free Antacid Tablets 750 mg Orange Cream', '90 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Garden of Life Probiotics Critical Care', '30 ea', 36.99, 'Walgreens', 'Garden of Life');
addProduct('Walgreens Gas Relief', '50 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Garden of Life Dr. Formulated Mens Daily Care Probiotic Capsules', '30 ea', 24.99, 'Walgreens', 'Garden of Life');
addProduct('Traditional Medicinals Belly Comfort Lozenges', '30 ea', 13.99, 'Walgreens', 'Traditional Medicinals');

// Row 3
addProduct('Little Remedies Gripe Water, Colic & Gas Relief', '4 fl oz', 13.49, 'Walgreens', 'Little Remedies');
addProduct('Colace Regular Strength Stool Softener, Docusate Sodium, 100 mg Capsules', '100 ea', 31.99, 'Walgreens', 'Colace');
addProduct('Walgreens Probiotic + Fiber Capsules', '120 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Antacid Tablets 1000 mg Ultra Strength Natural Peppermint', '72 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Ginger Motion Sickness Relief Capsules', '18 ea', 8.49, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Liquid I.V. Hydration Multiplier, Electrolyte Powder Supplement Drink Mix Watermelon, 10ct', '0.56 oz x 10 pack', 19.99, 'Walgreens', 'Liquid I.V.');
addProduct('Imodium A-D Anti-Diarrheal Softgels, Loperamide Hydrochloride', '24 ea', 16.99, 'Walgreens', 'Imodium');
addProduct('Walgreens Gas Relief Ultra Strength Softgels', '20 ea', 8.49, 'Walgreens', 'Walgreens');
addProduct('ReNew Life Extra Care Digestive Probiotic Capsules', '30 ea', 26.99, 'Walgreens', 'ReNew Life');
addProduct('Phillips Stool Softener Liquid Gels', '30 ea', 7.99, 'Walgreens', 'Phillips');

// Row 5
addProduct('Gas-X Extra Strength Gas Relief Softgels', '50 ea', 17.99, 'Walgreens', 'Gas-X');
addProduct('Walgreens Acid Reducer Capsules', '28 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Tums Extra Strength Chewable Antacid Tablets Assorted Berries', '8 ea', 2.49, 'Walgreens', 'Tums');
addProduct('Tums Chewable Antacid Tablets Fruit Fusion', '28 ea', 9.99, 'Walgreens', 'Tums');
addProduct('Walgreens Soothe Ultra Strength Liquid', '4 oz', 4.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Walgreens Milk of Magnesia Cherry', '12 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Pepcid AC Maximum Strength Heartburn Medicine, 20 Mg Famotidine', '8 ea', 7.99, 'Walgreens', 'Pepcid AC');
addProduct('Walgreens Electrolyte Solution Grape', '33.8 fl oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Prevacid 24HR Lansoprazole Delayed-Release Capsules 15 mg/Acid Reducer', '14 ea', 12.99, 'Walgreens', 'Prevacid 24HR');
addProduct('Nexium Acid Reducer Delayed Release Capsules', '28 ea', 24.99, 'Walgreens', 'Nexium');

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
console.log('🎉 Batch 11 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

