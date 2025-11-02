const fs = require('fs');

console.log('🚀 Extracting Batch 13 (Digestive Health, Probiotics, Supplements)...');
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
// IMAGE 1: 36 Products (Sea-Band, Winx, Tums, Culturelle, etc.)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Sea-Band Childrens Anti-Nausea Acupressure Wristband for Motion Sickness', '2 ea', 16.99, 'Walgreens', 'Sea-Band');
addProduct('Winx Vaginal Health Probiotic Capsules', '60 ea', 29.99, 'Walgreens', 'Winx');
addProduct('Tums Heart Burn and Sleep Support Berry Fusion', '54 ea', 13.99, 'Walgreens', 'Tums');
addProduct('Culturelle Womens 4 in 1 Protection', '30 ea', 30.99, 'Walgreens', 'Culturelle');
addProduct('Benefiber Prebiotic Fiber Supplement Gummies Assorted Fruit', '81 ea', 23.99, 'Walgreens', 'Benefiber');
addProduct('Tums Gummy Bites Dietary Supplement for Upset Stomach & Nausea Support Ginger Berry', '45 ea', 13.99, 'Walgreens', 'Tums');

// Row 2
addProduct('Zantac Maximum Strength Heartburn Prevention & Relief Cool Mint', '25 ea', 13.99, 'Walgreens', 'Zantac');
addProduct('Pepto-Bismol Fast Melts, Soft Chewable Tablets, Upset Stomach Relief Fresh Berry', '24 ea', 14.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Zarbees Childrens Digestive Care Support Prebiotic Fiber Syrup, Grape Natural Grape', '8 fl oz', 23.99, 'Walgreens', 'Zarbees');
addProduct('Mylanta Coat & Cool Liquid Antacid & Antigas Mint Chocolate', '12 fl oz', 11.49, 'Walgreens', 'Mylanta');
addProduct('Mylicon Infant Gas Relief Drops, Dye Free', '0.5 fl oz', 8.79, 'Walgreens', 'Mylicon');
addProduct('Metamucil SuperGreens Digestive Blend Powder Fiber Supplement Kiwi Apple', '30 ea', 31.99, 'Walgreens', 'Metamucil');

// Row 3
addProduct('Florajen Triple Action Womens Probiotic, Prebiotic, & Postbiotic', '30 ea', 29.99, 'Walgreens', 'Florajen');
addProduct('Metamucil Fiber Gummies for Adults with Probiotics for Bloating Relief, No Sugar Added Strawberry, Kiwi, and Blackberry', '60 ea', 28.99, 'Walgreens', 'Metamucil');
addProduct('Mylanta Tonight Liquid Antacid & Antigas Honey Chamomile', '12 fl oz', 11.49, 'Walgreens', 'Mylanta');
addProduct('Nature Made Probiotic Capsules 1 Billion CFU From Live Cultures', '30 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Rolaids Power Chew 1000 Antacid Heartburn Relief Assorted Berry', '32 ea', 8.79, 'Walgreens', 'Rolaids');
addProduct('Align Bloating Relief + Food Digestion, Probiotics for Women and Men Strawberry, Gummies', '60 ea', 29.99, 'Walgreens', 'Align');

// Row 4
addProduct('Pedialyte Electrolyte Drink Iced Berry', '1 L', 6.99, 'Walgreens', 'Pedialyte');
addProduct('Pedialyte AdvancedCare Plus Electrolyte Drink Raspberry Lemonade', '33.8 fl oz', 7.99, 'Walgreens', 'Pedialyte AdvancedCare Plus');
addProduct('Metamucil Sparkling Fiber Supplement + Metabolism, Plant Based Psyllium Citrus', '24.9 oz', 35.99, 'Walgreens', 'Metamucil');
addProduct('Metamucil Fiber Supplement Gummies Orange', '105 ea', 34.99, 'Walgreens', 'Metamucil');
addProduct('Fleet Stool Softener, Stimulant Free Oral Laxative for Constipation Relief', '25 ea', 10.99, 'Walgreens', 'Fleet');
addProduct('Metamucil Fiber Gummies for Adults with Vitamins C, D, B12 for Metabolism, No Sugar Added Citrus Berry', '72 ea', 26.99, 'Walgreens', 'Metamucil');

// Row 5
addProduct('Dramamine Nausea Relief, Kids Gummies', '20 ea', 14.49, 'Walgreens', 'Dramamine');
addProduct('Pedialyte AdvancedCare Plus Electrolyte Drink For Kids & Adults Lemon Lime', '33.8 fl oz', 7.99, 'Walgreens', 'Pedialyte AdvancedCare Plus');
addProduct('Metamucil Daily Psyllium Husk Powder Supplement with Real Sugar, 4-in-1 Fiber Orange', '0.43 oz x 30 pack', 19.99, 'Walgreens', 'Metamucil');
addProduct('Walgreens Probiotic 1 Billion CFU Gummies (50 days) Natural Mango', '50 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Hilma Fiber Gummy', '60 ea', 25.99, 'Walgreens', 'Hilma');
addProduct('UpSpring Stomach Settle Nausea Relief Drops Lemon, Ginger, Honey', '28 ea', 13.99, 'Walgreens', 'UpSpring');

// Row 6
addProduct('Walgreens Gentle Laxative Soft Chews Blueberry-Raspberry', '30 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Fiber Powder Stick Packs', '44 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Gas Relief Chewable Tablets Extra Strength', '48 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Antacid Tablets 500', '66 ea', 2.00, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure 4-In-1 Daily Womens Probiotic Capsules', '30 ea', 24.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Zegerid Over The Counter Heartburn Relief, 24 Hour Stomach Acid Reducer', '42 ea', 29.99, 'Walgreens', 'Zegerid');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Walgreens Probiotic, Benefiber, Nauzene, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Walgreens Probiotic Gummies', '60 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Benefiber Prebiotic Fiber + Supergreens Dietary Supplement Watermelon Lemonade', '8.8 oz', 38.99, 'Walgreens', 'Benefiber');
addProduct('Natures Bounty Fiber Gummies, 5g Prebiotic Strawberry & Raspberry', '90 ea', 19.99, 'Walgreens', 'Natures Bounty');
addProduct('Benefiber Prebiotic Fiber + Superfruits Dietary Supplement Strawberry Dragon Fruit', '8.8 oz', 38.99, 'Walgreens', 'Benefiber');
addProduct('Benefiber Prebiotic Fiber Supplement Caplets', '84 ea', 23.99, 'Walgreens', 'Benefiber');
addProduct('Pepcid Soothing Gummies, Heartburn + Sleep', '32 ea', 13.49, 'Walgreens', 'Pepcid');

// Row 2
addProduct('Culturelle Metabolism + Weight Management With Slimbiotics Capsules', '30 ea', 26.24, 'Walgreens', 'Culturelle');
addProduct('Nature Made Probiotic + Prebiotic Fiber Gummies Gut Health Support', '50 ea', 24.99, 'Walgreens', 'Nature Made');
addProduct('Nauzene Upset Stomach & Nausea Relief', '42 ea', 9.99, 'Walgreens', 'Nauzene');
addProduct('Florajen Triple Action Womens Probiotic', '30 ea', 29.99, 'Walgreens', 'Florajen');
addProduct('Dr. Talbots Infant Tummy Ache Relief', '4 fl oz', 11.99, 'Walgreens', 'Dr. Talbots');
addProduct('Dramamine Advanced Herbals, Nausea and Stress Support with Ginger and Ashwagandha Tropical Fruit and Ginger', '20 ea', 14.49, 'Walgreens', 'Dramamine');

// Row 3
addProduct('Fleet Oral Laxative Stimulant, Overnight Constipation Relief, Laxative Tablets', '25 ea', 10.99, 'Walgreens', 'Fleet');
addProduct('Walgreens Fiber Gummies Orange', '72 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Sea-Band Anti-Nausea Ginger Gum (Actual Item May Vary)', '24 ea', 10.99, 'Walgreens', 'Sea-Band');
addProduct('Pedialyte AdvancedCare Plus Electrolyte Solution', '33.8 fl oz', 7.99, 'Walgreens', 'Pedialyte');
addProduct('Walgreens Gentle Laxative Comfort-Coated Tablets', '4 ea', 2.00, 'Walgreens', 'Walgreens');
addProduct('Walgreens Prebiotic & Probiotic Gummies', '50 ea', 16.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens Soothe Bismuth Subsalicylate 525 mg Liquid, Twin Pack Original', '16 fl oz x 2 pack', 11.99, 'Walgreens', 'Walgreens');
addProduct('FDGARD Gut Health Support Dietary Capsules', '36 ea', 29.99, 'Walgreens', 'FDGARD');
addProduct('Walgreens Extra Strength Gas Relief Chewable Tablets', '9 ea', 3.00, 'Walgreens', 'Walgreens');
addProduct('Align Probiotic, 3-in-1 Biotic Gummies, Prebiotic + Probiotic + Postbiotic Blackberry', '50 ea', 26.99, 'Walgreens', 'Align');
addProduct('Colace Stimulant Free Stool Softening Magnesium Citrate Gummies Berry', '60 ea', 27.99, 'Walgreens', 'Colace');
addProduct('Supergut GLP-1 Booster Prebiotic Fiber Raspberry Lemon', '5.9 oz', 29.99, 'Walgreens', 'Supergut');

// Row 5
addProduct('Supergut GLP-1 Booster Prebiotic Fiber Watermelon Lime', '5.7 oz', 29.99, 'Walgreens', 'Supergut');
addProduct('Walgreens Fiber Powder Orange', '6.1 OZ', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Motion Sickness Glasses', '1 pr', 15.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens High Fiber Gummies Natural Orange, Lemon & Strawberry', '90 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Kidney Cleanse Support Supplement Capsules (45 days)', '90 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('Benefiber On The Go Prebiotic Fiber Supplement Strawberry Lemonade', '24 ea', 19.99, 'Walgreens', 'Benefiber');

// Row 6
addProduct('Walgreens Esomeprazole Magnesium', '42 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Motion Travel Patches', '12 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Smooth Lax Polyethylene Glycol 3350 Powder for Solution Unflavored', '4.1 oz', 9.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Tums Chewy Bites Antacid Tablets Lemon & Strawberry', '28 ea', 8.49, 'Walgreens', 'Tums');
addProduct('Tums Chewy Bites Chewable Antacid Tablets with Gas Relief Lemon & Strawberry', '54 ea', 13.99, 'Walgreens', 'Tums');
addProduct('Walgreens Antacid + Anti-Gas Liquid Vanilla Caramel', '12 fl oz', 8.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 42 Products (DripDrop, Healthy Natural Systems, etc.)
// ============================================================================
console.log('📸 Extracting Image 3 (42 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Walgreens Childrens Electrolyte Drink Mix Stick Packs Tropical Punch', '0.28 oz x 10 pack', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Stomach Relief Chews', '24 ea', 9.49, 'Walgreens', 'Walgreens');
addProduct('DripDrop Electrolyte Powder Strawberry Lemonade', '.35 oz x 8 pack', 9.99, 'Walgreens', 'DripDrop');
addProduct('Walgreens Pediatric Electrolyte Strawberry and Grape', '16.9 oz x 2 pack', 7.79, 'Walgreens', 'Walgreens');
addProduct('Dulcolax Stool Softener Laxative Liquid Gel Capsules', '50 ea', 17.99, 'Walgreens', 'Dulcolax');
addProduct('Walgreens Lansoprazole 15mg Caps', '28 ea', 17.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Pepto-Bismol Chews, Fast and Effective Digestive Relief Berry Mint', '24 ea', 11.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Pepto-Bismol Chews, Fast and Effective Digestive Relief Berry Mint', '24 ea', 11.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Healthy Natural Systems Healthy Digestives Gluten Cutter Capsules', '30 ea', 14.99, 'Walgreens', 'Healthy Natural Systems');
addProduct('Thermotabs Salt Supplement Buffered Tablets', '100 ea', 6.49, 'Walgreens', 'Thermotabs');
addProduct('Equalactin Fiber Tablets Citrus', '48 ea', 6.69, 'Walgreens', 'Equalactin');
addProduct('Nature Made Probiotics for Digestive Health Extra Strength 15 Billion CFU from Live Cultures', '30 ea', 26.99, 'Walgreens', 'Nature Made');

// Row 3
addProduct('Walgreens Chewable Papaya Enzyme Complex Tablets (Packaging May Vary)', '120 EA', 6.79, 'Walgreens', 'Walgreens');
addProduct('Lil Critters Fiber Gummy Bears Berry', '90 ea', 10.99, 'Walgreens', 'Lil Critters');
addProduct('Digestive Advantage Intensive Bowel Support Probiotics, Digestive Enzymes', '96 ea', 26.99, 'Walgreens', 'Digestive Advantage');
addProduct('ex-lax Chocolated Stimulant Laxative Pieces Chocolate', '48 ea', 12.99, 'Walgreens', 'ex-lax');
addProduct('ProVent Vertigo X Roll-On', '0.15 fl oz', 7.99, 'Walgreens', 'ProVent');
addProduct('Emulsion De Escocia Cod Liver Oil Strawberry/Banana', '6.5 oz', 7.99, 'Walgreens', 'Emulsion De Escocia');

// Row 4
addProduct('Gas-X Extra Strength Gas Relief Chewable Tablets Peppermint Creme', '18 ea', 9.99, 'Walgreens', 'Gas-X');
addProduct('Prunelax Ciruelax Maximum Relief Laxative Tablets', '100 ea', 20.69, 'Walgreens', 'Prunelax Ciruelax');
addProduct('Prunelax Ciruelax Laxative', '150 ea', 16.99, 'Walgreens', 'Prunelax Ciruelax');
addProduct('Metamucil Psyllium Husk Fiber Thins, Supports Digestive Health and Satisfies Hunger Chocolate', '12 ea', 12.99, 'Walgreens', 'Metamucil');
addProduct('Natures Bounty B Complex Sublingual Liquid Dietary Supplement', '2 fl oz', 11.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Way Probiotic Pearls Womens Vaginal & Digestive Health Softgels', '30 ea', 19.99, 'Walgreens', 'Natures Way');

// Row 5
addProduct('Calmol 4 Hemorrhoidal Suppositories', '24 ea', 23.99, 'Walgreens', 'Calmol 4');
addProduct('BioGaia Protectis KIDS Lemon-Lime', '30 ea', 23.99, 'Walgreens', 'BioGaia');
addProduct('DiaResQ Rapid Recovery Diarrhea Relief Adults Ages 12 Years & Up Vanilla', '0.25 oz x 3 pack', 9.99, 'Walgreens', 'DiaResQ');
addProduct('New Chapter Every Mans One Daily 55+ Multivitamin', '72 ea', 58.99, 'Walgreens', 'New Chapter');
addProduct('Botanic Choice Cascara Sagrada 450 mg', '90 ea', 9.99, 'Walgreens', 'Botanic Choice');
addProduct('New Chapter Womens Daily Probiotic, Vegan Capsules', '30 ea', 29.99, 'Walgreens', 'New Chapter');

// Row 6
addProduct('Botanic Choice Grapefruit Seed Extract 200mg', '60 ea', 9.99, 'Walgreens', 'Botanic Choice');
addProduct('TRP IBS Therapy Fast Dissolving Tablets', '70 ea', 12.97, 'Walgreens', 'TRP');
addProduct('DiaResQ Childrens Strength Soothing Diarrhea Relief For Kids Ages 1 Year & Up Vanilla', '0.25 oz x 3 pack', 9.99, 'Walgreens', 'DiaResQ');
addProduct('Gelusil Anti-Gas and Heartburn Relief Antacid Chewable Tablets Cool Mint', '100 ea', 10.99, 'Walgreens', 'Gelusil');
addProduct('Botanic Choice Bromelain 500MG Joint Support Capsules', '180 ea', 29.99, 'Walgreens', 'Botanic Choice');
addProduct('Natures Way Fortify Womens 50 Billion Probiotic Vegetable Capsules', '30 ea', 29.99, 'Walgreens', 'Natures Way');

// Row 7
addProduct('Prunelax Ciruelax Natural Laxative Regular Tablets', '10 ea', 4.99, 'Walgreens', 'Prunelax Ciruelax');
addProduct('Culturelle Kids Complete Chewable Multivitamin + Probiotic, Ages 3+ Fruit Punch', '50 ea', 25.99, 'Walgreens', 'Culturelle');
addProduct('New Chapter Probiotic All-Flora, Vegan Capsules', '60 ea', 44.99, 'Walgreens', 'New Chapter');
addProduct('Hydrocil Instant Dietary Fiber Supplement', '10.6 oz', 18.99, 'Walgreens', 'Hydrocil');
addProduct('Natures Way Fortify Age 50+ 50 Billion Probiotic Vegetable Capsules', '30 ea', 29.99, 'Walgreens', 'Natures Way');
addProduct('Irwin Naturals Active-Cleanse & Probiotics, Soft-Gels', '60 ea', 19.99, 'Walgreens', 'Irwin Naturals');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 30 Products (Natures Bounty, UP4, Botanic Choice, etc.)
// ============================================================================
console.log('📸 Extracting Image 4 (30 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('Natures Bounty Vitamin B-12, 1000mcg, Tablets', '100 ea', 12.99, 'Walgreens', 'Natures Bounty');
addProduct('UP4 Probiotic + Prebiotic, Vitamin C, Berry Flavor, Gummies', '60 ea', 16.49, 'Walgreens', 'UP4');
addProduct('Natures Truth Probiotic Chewable 6 Billion Natural Berry', '60 ea', 9.99, 'Walgreens', 'Natures Truth');
addProduct('Botanic Choice Cinnamon 650mg', '60 ea', 7.99, 'Walgreens', 'Botanic Choice');
addProduct('Dulcolax Liquid Laxative for Constipation Relief Mint', '12 fl oz', 10.99, 'Walgreens', 'Dulcolax');
addProduct('Zantac Maximum Strength Famotidine Tablets 20 mg', '100 ea', 30.79, 'Walgreens', 'Zantac');

// Row 2
addProduct('Prunelax Kids Laxative Liquid', '4.05 fl oz', 6.99, 'Walgreens', 'Prunelax');
addProduct('Botanic Choice Fenugreek Seed Liquid Extract', '1OZ', 12.99, 'Walgreens', 'Botanic Choice');
addProduct('Natures Way DGL Chewable Tablets', '100 ea', 16.49, 'Walgreens', 'Natures Way');
addProduct('Tumeez Organic Tummy Soothing Pop for Kids Grape and Apple', '10 ea', 5.99, 'Walgreens', 'Tumeez');
addProduct('Botanic Choice Ultra Kidney Complex', '60 ea', 34.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Oat Fiber 1000mg', '90 ea', 13.99, 'Walgreens', 'Botanic Choice');

// Row 3
addProduct('Botanic Choice Pancreas-Plus', '60 ea', 31.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Cats Claw 400 mg Herbal Supplement Capsules', '60 ea', 6.99, 'Walgreens', 'Botanic Choice');
addProduct('Irwin Naturals Colon Flush Softgels Extra Strength', '60 ea', 14.99, 'Walgreens', 'Irwin Naturals');
addProduct('Enzymatic Therapy Acidophilus Pearls Probiotics, Capsules', '90 ea', 39.99, 'Walgreens', 'Enzymatic Therapy');
addProduct('Botanic Choice Noni Fruit 300mg', '30 ea', 6.49, 'Walgreens', 'Botanic Choice');
addProduct('Align Probiotic, for Women and Men, Supplement for Digestive Health Capsules', '56 ea', 49.99, 'Walgreens', 'Align');

// Row 4
addProduct('Botanic Choice Thyroid Complex Capsules', '120 ea', 61.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Gall Bladder Capsules', '90 ea', 41.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Digestive Enzyme Complex', '90 ea', 31.99, 'Walgreens', 'Botanic Choice');
addProduct('Pepto-Bismol Liquid Original', '4 fl oz', 4.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Botanic Choice Aloe Vera 500 mg', '90 ea', 16.49, 'Walgreens', 'Botanic Choice');
addProduct('New Chapter Probiotic All-Flora, Vegan Capsules', '30 ea', 43.99, 'Walgreens', 'New Chapter');

// Row 5
addProduct('Botanic Choice Colon Clear Formula', '90 ea', 24.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Cornsilk Kidney Comfort', '30 ea', 11.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Aloe Vera 500mg', '180 ea', 34.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice #739 Colon Clear Formula', '180 ea', 47.99, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Ginger Root Capsules 550mg', '30 ea', 11.49, 'Walgreens', 'Botanic Choice');
addProduct('Botanic Choice Fenugreek Plus Anise', '90 ea', 6.99, 'Walgreens', 'Botanic Choice');

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
console.log('🎉 Batch 13 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

