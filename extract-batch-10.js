const fs = require('fs');

console.log('🚀 Extracting Batch 10 (Digestive Health, Probiotics, Antacids, Laxatives)...');
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
// IMAGE 1: 48 Products (Digestive Health, Probiotics, Antacids)
// ============================================================================
console.log('📸 Extracting Image 1 (48 products)...');

// Row 1
addProduct('Walgreens Omeprazole Delayed Release Tablets', '14 ea x 3 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Anti-Diarrheal Capsules', '24 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure SmoothLax Polyethylene Glycol 3350 Powder For Solution Unflavored', '26.9 oz', 27.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Pedialyte Electrolyte Solution Freezer Pops Variety Pack', '2.1 fl oz x 16 pack', 5.99, 'Walgreens', 'Pedialyte');
addProduct('Walgreens SmoothLax Polyethylene Glycol 3350 Powder For Solution Unflavored', '17.9 oz', 23.99, 'Walgreens', 'Walgreens');
addProduct('Pedialyte Electrolyte Solution Strawberry', '33.8 fl oz', 6.99, 'Walgreens', 'Pedialyte');

// Row 2
addProduct('Natures Bounty Ultra Strength Probiotic 10', '30 ea', 31.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Omeprazole Delayed-Release Capsules', '14 ea x 3 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Fleet Laxatives, Saline Enema for Adult Constipation Relief, Prefilled Kit', '4.5 fl oz x 4 pack', 7.49, 'Walgreens', 'Fleet');
addProduct('Tums Antacid Chewable Extra Strength Tablets Assorted Fruit', '96 ea', 8.49, 'Walgreens', 'Tums');
addProduct('Walgreens Clear Dissolving Fiber Powder Flavor Free', '12.7 oz', 16.99, 'Walgreens', 'Walgreens');
addProduct('Emetrol Non-Drowsy Nausea and Upset Stomach Relief Liquid Cherry', '4 fl oz', 13.99, 'Walgreens', 'Emetrol');

// Row 3
addProduct('Natures Bounty Acidophilus Probiotic Tablets', '100 ea x 2 pack', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Vitafusion Fiber Well Gummy Vitamins Peach, Strawberry & Berry', '90 ea', 17.99, 'Walgreens', 'Vitafusion');
addProduct('Natures Bounty Probiotic 4 Billion Live Cultures Gummies', '60 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Pepto-Bismol Chewable Tablets for Upset Stomach & Diarrhea Relief, Over-the-Counter Medicine Original', '30 ea', 9.49, 'Walgreens', 'Pepto-Bismol');
addProduct('Dramamine All Day Less Drowsy Motion Sickness Relief', '8 ea', 9.99, 'Walgreens', 'Dramamine');
addProduct('Pedialyte Electrolyte Solution Grape', '33.8 fl oz', 6.99, 'Walgreens', 'Pedialyte');

// Row 4
addProduct('Fleet Liquid Glycerin Laxative Suppositories', '7.5 mL x 4 pack', 7.99, 'Walgreens', 'Fleet');
addProduct('Imodium Multi-Symptom Relief Anti-Diarrheal Medicine Caplets', '18 ea', 17.99, 'Walgreens', 'Imodium');
addProduct('Natures Bounty Probiotic OX Gas & Bloating Formula, Capsules', '25 ea', 31.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Laxative Tablets', '90 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Antacid Tablets 750', '96 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Anti-Diarrheal Caplets', '24 ea', 11.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Antacid Tablets 500 Regular Strength', '150 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Pedialyte Electrolyte Powder Packets Variety', '0.3 oz x 8 pack', 10.99, 'Walgreens', 'Pedialyte');
addProduct('Walgreens Gentle Laxative Tablets', '200 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Lactaid Fast Act Lactose Intolerance Caplets Vanilla', '60 ea', 16.99, 'Walgreens', 'Lactaid');
addProduct('Tums Chewable Antacid Tablets Assorted Fruit', '160 ea', 14.99, 'Walgreens', 'Tums');
addProduct('Tums Extra Strength Chewable Sugar Free Antacid Tablets Melon Berry', '80 ea', 8.49, 'Walgreens', 'Tums');

// Row 6
addProduct('Pedialyte Electrolyte Solution Mixed Fruit', '33.8 fl oz', 6.99, 'Walgreens', 'Pedialyte');
addProduct('Walgreens Dye-Free Electrolyte Solution Strawberry, Strawberry', '33.8 fl oz', 6.49, 'Walgreens', 'Walgreens');
addProduct('Dulcolax Stimulant Laxative Tablets for Constipation Relief (Actual Item May Vary)', '10 ea', 5.49, 'Walgreens', 'Dulcolax');
addProduct('Walgreens Castor Oil U.S.P.', '4 fl oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Dulcolax Saline Laxative Soft Chews Mixed Berry', '30 ea', 18.99, 'Walgreens', 'Dulcolax');
addProduct('Florastor Daily Probiotic Supplement Capsules for Men and Women', '20 ea', 27.99, 'Walgreens', 'Florastor');

// Row 7
addProduct('Pedialyte Electrolyte Solution Unflavored', '33.8 fl oz', 6.99, 'Walgreens', 'Pedialyte');
addProduct('Culturelle Kids Daily Probiotic Supplement', '30 ea', 24.99, 'Walgreens', 'Culturelle');
addProduct('Fleet Laxative, Saline Enema for Adult Constipation Relief', '7.8 fl oz', 4.29, 'Walgreens', 'Fleet');
addProduct('Fleet Laxatives, Saline Enema for Adult Constipation Relief, Prefilled Kit', '4.5 fl oz x 2 pack', 3.99, 'Walgreens', 'Fleet');
addProduct('Walgreens Wal-Mucil 100% Natural Fiber, Smooth Texture Orange', '48.2 oz', 23.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Senna Tablets Regular Strength', '500 ea', 29.99, 'Walgreens', 'Walgreens');

// Row 8
addProduct('Walgreens Motion Sickness Relief Chewable Tablets Raspberry', '16 ea', 8.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Fast-Acting Lactase Enzyme Chewable Tablets Vanilla', '60 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Pepto Kids Chewable Tablets Bubble Gum', '24 ea', 11.99, 'Walgreens', 'Pepto Kids');
addProduct('Prilosec OTC Heartburn Relief, Omeprazole, Acid Reducer Tablets', '42 ea', 29.99, 'Walgreens', 'Prilosec OTC');
addProduct('Gaviscon Extra Strength Chewable Antacid Tablets Original', '100 ea', 12.99, 'Walgreens', 'Gaviscon Extra Strength');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 25 Products (Nexium, Dramamine, MiraLAX, Colace, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (25 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Nexium 24 Hour, 20 mg, Capsules', '42 ea', 29.99, 'Walgreens', 'Nexium');
addProduct('Dramamine Nausea Relief - Long Lasting', '10 ea', 9.99, 'Walgreens', 'Dramamine');
addProduct('Dramamine Chewable Motion Sickness Relief for Kids Grape', '8 ea', 9.99, 'Walgreens', 'Dramamine');
addProduct('MiraLAX Gentle Constipation Relief Polyethylene Glycol 3350 Laxative Powder Unflavored', '4.1 oz', 12.49, 'Walgreens', 'MiraLAX');
addProduct('Walgreens Fiber Capsules', '320 ea', 29.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Imodium A-D Liquid Anti-Diarrheal Medicine For Kids Mint', '4 fl oz', 9.99, 'Walgreens', 'Imodium');
addProduct('Colace 2-in-1 Stool Softener & Stimulant Laxative Tablets', '30 ea', 21.99, 'Walgreens', 'Colace');
addProduct('Colace Regular Strength Stimulant-Free Stool Softener', '30 ea', 14.99, 'Walgreens', 'Colace');
addProduct('AZO Bladder Control Daily Supplement, Capsules', '72 ea', 19.99, 'Walgreens', 'AZO');
addProduct('Walgreens Motion Sickness Relief Tablets', '16 ea', 8.49, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Align Probiotics for Women and Men, Daily Probiotic Supplement for Digestive Health Cranberry', '42 ea', 42.99, 'Walgreens', 'Align');
addProduct('Imodium Diarrhea Relief Caplets with Loperamide HCI', '24 ea', 12.99, 'Walgreens', 'Imodium');
addProduct('Walgreens Fiber Therapy Caplets', '100 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Stool Softener Softgels Regular Strength', '200 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('MiraLAX Laxative Powder Unflavored', '26.9 oz', 34.99, 'Walgreens', 'MiraLAX');

// Row 4
addProduct('Walgreens Sugar Free Fiber Powder Orange', '36.8 oz', 32.99, 'Walgreens', 'Walgreens');
addProduct('OLLY Kids Multi & Probiotic Gummies Yum Berry Punch, Orange', '70 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Walgreens Esomeprazole Magnesium Capsules', '42 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Dulcolax Liquid Laxative for Constipation Relief Cherry', '12 fl oz', 11.99, 'Walgreens', 'Dulcolax');
addProduct('Nexium 24 Hour Delayed Release Heartburn Relief Capsules, 20 mg', '42 ea', 29.99, 'Walgreens', 'Nexium');

// Row 5
addProduct('Walgreens Omeprazole Delayed Release Orally Disintegrating Tablets 20 mg, Acid Reducer Strawberry', '42 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Phillips Milk of Magnesia Liquid Laxative Cherry', '26 fl oz', 14.99, 'Walgreens', 'Phillips');
addProduct('Walgreens Free & Pure SmoothLax Polyethylene Glycol 3350 Powder For Solution Unflavored, 14 Day', '8.3 oz', 14.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Omeprazole Delayed Release Coated Tablets 20 mg Wildberry Mint', '14 ea x 3 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Pepto-Bismol Liquid, Nausea, Upset Stomach & Diarrhea Relief, Over-the-Counter Medicine Original', '16 fl oz', 13.99, 'Walgreens', 'Pepto-Bismol');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 42 Products (Gas-X, Colace, Tums, Imodium, etc.)
// ============================================================================
console.log('📸 Extracting Image 3 (42 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Walgreens Omeprazole Capsules', '14 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Gas-X Extra Strength Gas Relief Softgels', '20 ea', 9.99, 'Walgreens', 'Gas-X');
addProduct('Colace Stimulant-Free Stool Softener Soft Gels, for Adults & Children 2+', '28 ea', 16.99, 'Walgreens', 'Colace');
addProduct('Tums Chewable Antacid Tablets Assorted Berries', '32 ea', 8.49, 'Walgreens', 'Tums');
addProduct('Walgreens Fast-Acting Lactase Enzyme Caplets', '60 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Dairy Relief Lactase Enzyme/Dietary Supplement', '120 ea', 15.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Childrens Soothe Chewable Tablets Bubble Gum', '24 ea', 8.49, 'Walgreens', 'Walgreens');
addProduct('MiraLAX Mix-In Pax, Constipation Relief, Laxative Unflavored', '0.5 ea x 20 pack', 29.99, 'Walgreens', 'MiraLAX');
addProduct('Natures Bounty B-12 2500 mcg, Quick Dissolve', '75 ea', 18.99, 'Walgreens', 'Natures Bounty');
addProduct('Tums Antacid Chewable Extra Strength Tablets Assorted Berries', '96 ea', 8.49, 'Walgreens', 'Tums');
addProduct('Walgreens Ready-To-Use Saline Laxative Enema', '4.5 fl oz', 2.29, 'Walgreens', 'Walgreens');
addProduct('Walgreens Soothe Chewable Tablets Original', '30 ea', 5.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Soothe Caplets', '40 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Gas-X Gas Relief Chewable Extra Strength Tablets Cherry Creme', '18 ea', 9.99, 'Walgreens', 'Gas-X');
addProduct('Natures Bounty B-12 5000 mcg, Quick Dissolve', '40 ea', 17.99, 'Walgreens', 'Natures Bounty');
addProduct('Imodium A-D Anti-Diarrheal Softgels, Loperamide Hydrochloride', '12 ea', 12.99, 'Walgreens', 'Imodium');
addProduct('Nature Made Ultra Strength Digestive Probiotics Gummies Raspberry & Cherry', '42 ea', 27.99, 'Walgreens', 'Nature Made');
addProduct('Tums Ultra Strength Chewable Antacid Tablets Assorted Berries', '160 ea', 14.99, 'Walgreens', 'Tums');

// Row 4
addProduct('Tums Smoothies Chewable Antacid Tablets Assorted Fruit', '140 ea', 14.99, 'Walgreens', 'Tums');
addProduct('Walgreens Antacid Soft Chews Cherry', '32 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Omeprazole Delayed Release Tablets 20 mg, Acid Reducer, For Frequent Heartburn', '14 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Imodium Multi-Symptom Relief Anti-Diarrheal Medicine Caplets', '24 ea', 16.99, 'Walgreens', 'Imodium');
addProduct('Imodium Liquid Anti-Diarrheal Medicine with Loperamide HCI, Mint Mint', '8 fl oz', 16.99, 'Walgreens', 'Imodium');
addProduct('Alka-Seltzer Upset Stomach Relief Effervescent Tablets Original', '24 ea', 8.99, 'Walgreens', 'Alka-Seltzer');

// Row 5
addProduct('Pedialyte Electrolyte Solution Berry Frost', '33.8 fl oz', 7.99, 'Walgreens', 'Pedialyte');
addProduct('Metamucil Daily Psyllium Husk Powder Supplement with Real Sugar Orange', '30.4 oz', 24.99, 'Walgreens', 'Metamucil');
addProduct('Walgreens Extra Strength Antacid Chewable Tablets, 750 mg', '96 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Pedialyte AdvancedCare Electrolyte Solution Strawberry Lemonade', '33.8 fl oz', 7.49, 'Walgreens', 'Pedialyte');
addProduct('Walgreens Acid Reducer, Esomeprazole Magnesium Delayed-Release Mini Capsules, 20 mg', '14 ea x 3 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Tums Chewable Antacid Tablets Peppermint', '160 ea', 14.99, 'Walgreens', 'Tums');

// Row 6
addProduct('Tums Chewable Antacid Tablets Assorted Berries', '60 ea', 14.99, 'Walgreens', 'Tums');
addProduct('Walgreens Advantage Care Electrolyte Solution with Prevital Prebiotics Cherry Punch', '33.8 fl oz', 6.49, 'Walgreens', 'Walgreens');
addProduct('MiraLAX Polyethylene Glycol 3350 Laxative Powder Unflavored', '8.3 oz', 19.99, 'Walgreens', 'MiraLAX');
addProduct('Gas-X Maximum Strength Softgels', '30 ea', 17.99, 'Walgreens', 'Gas-X');
addProduct('Florastor Daily Probiotic Supplement Capsules for Men and Women', '50 ea', 49.99, 'Walgreens', 'Florastor');
addProduct('Garden of Life Probiotics Womens Daily Care', '30 ea', 31.99, 'Walgreens', 'Garden of Life');

// Row 7
addProduct('Metamucil Fiber Gummies Supplement Orange', '72 ea', 22.99, 'Walgreens', 'Metamucil');
addProduct('Pepcid AC Maximum Strength For Heartburn Prevention & Relief', '75 ea', 31.99, 'Walgreens', 'Pepcid AC');
addProduct('Walgreens Womens Probiotic Capsules', '30 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Benefiber Daily Prebiotic Fiber Supplement Powder Unflavored, 125 dose', '17.6 oz', 32.99, 'Walgreens', 'Benefiber');
addProduct('Metamucil Daily Fiber Supplement, Psyllium Husk Powder Unflavored', '28.1 oz', 26.50, 'Walgreens', 'Metamucil');
addProduct('Natures Bounty Acidophilus Probiotic Tablets', '120 ea', 14.99, 'Walgreens', 'Natures Bounty');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 29 Products (Metamucil, MiraLAX, Pepcid, Sea-Band, etc.)
// ============================================================================
console.log('📸 Extracting Image 4 (29 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('Walgreens Senna-S Tablets', '220 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Phillips Milk of Magnesia Saline Laxative Original', '12 fl oz', 9.99, 'Walgreens', 'Phillips');
addProduct('Sea-Band Acupressure Nausea Relief Wrist Bands (Actual Item May Vary)', '1 ea', 17.99, 'Walgreens', 'Sea-Band');
addProduct('Metamucil Psyllium Husk Powder Fiber Supplement No Flavor', '23.3 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('MiraLAX Gentle Constipation Relief Polyethylene Glycol 3350 Laxative Powder Unflavored', '17.9 oz', 29.99, 'Walgreens', 'MiraLAX');
addProduct('Fleet Childrens Pedia-Lax Saline Laxative Chewable Tablets Watermelon', '30 ea', 10.99, 'Walgreens', 'Fleet Childrens');

// Row 2
addProduct('Gas-X Extra Strength Gas Relief Chewable Tablets Cherry', '48 ea', 19.99, 'Walgreens', 'Gas-X');
addProduct('Walgreens Stool Softener + Stimulant Laxative Tablets', '200 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('Benefiber On the Go Prebiotic Fiber Supplement Powder Unflavored', '0.14 oz x 28 pack', 19.99, 'Walgreens', 'Benefiber');
addProduct('Culturelle Daily Probiotic Capsules For Men & Women', '50 ea', 41.99, 'Walgreens', 'Culturelle');
addProduct('Walgreens Antacid Liquid Regular Strength Mint', '12 fl oz', 10.99, 'Walgreens', 'Walgreens');
addProduct('Fleet Glycerin Laxative Suppositories', '50 ea', 8.99, 'Walgreens', 'Fleet');

// Row 3
addProduct('Walgreens Motion Sickness Relief Band', '1 pr', 14.49, 'Walgreens', 'Walgreens');
addProduct('Metamucil 4-in-1 Psyllium Fiber Powder Orange', '23.3 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('ReNew Life Womens Care Probiotic', '30 ea', 34.99, 'Walgreens', 'ReNew Life');
addProduct('Metamucil 4 in 1 Daily Fiber Supplement Powder, for Digestive Health and Regularity Orange', '6.1 oz', 14.99, 'Walgreens', 'Metamucil');
addProduct('Dulcolax Medicated Stimulant Laxative Suppositories (Actual Item May Vary)', '8 ea', 17.99, 'Walgreens', 'Dulcolax');
addProduct('Culturelle Daily Probiotic Capsules for Men and Women', '30 ea', 22.99, 'Walgreens', 'Culturelle');

// Row 4
addProduct('Walgreens Sugar Free Fiber Powder Smooth Texture Orange', '23.3 oz', 23.99, 'Walgreens', 'Walgreens');
addProduct('Pepto-Bismol Caplets for Nausea, Heartburn, Indigestion, Upset Stomach, and Diarrhea', '40 ea', 13.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Pepcid AC Maximum Strength for Heartburn Prevention & Relief', '25 ea', 16.99, 'Walgreens', 'Pepcid AC');
addProduct('Walgreens Wal-Mucil 100% Natural Fiber, Coarse Texture Original', '29 oz', 23.99, 'Walgreens', 'Walgreens');
addProduct('Metamucil 4-in-1 Psyllium Fiber Powder Orange', '36.8 oz', 45.99, 'Walgreens', 'Metamucil');
addProduct('Mommys Bliss Gripe Water Original', '4 fl oz', 13.49, 'Walgreens', 'Mommys Bliss');

// Row 5
addProduct('Bonine Motion Sickness Relief Chewable Tablets Raspberry', '16 ea', 10.99, 'Walgreens', 'Bonine');
addProduct('Metamucil 3-in-1 Fiber Capsules, Daily Psyllium Husk Supplement, for Digestive Health', '300 ea', 43.99, 'Walgreens', 'Metamucil');
addProduct('Senokot Dietary Supplement Laxative Gummies for Occasional Constipation Relief Mixed Berry', '60 ea', 22.99, 'Walgreens', 'Senokot');
addProduct('Gaviscon Extra Strength Chewable Antacid Tablets Cherry', '100 ea', 12.99, 'Walgreens', 'Gaviscon Extra Strength');
addProduct('Metamucil Fiber Capsules, 3-in-1 Psyllium Husk Fiber', '160 ea', 29.99, 'Walgreens', 'Metamucil');
addProduct('Nauzene Chewables For Upset Stomach & Nausea Wild Cherry', '42 ea', 12.99, 'Walgreens', 'Nauzene');

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
console.log('🎉 Batch 10 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

