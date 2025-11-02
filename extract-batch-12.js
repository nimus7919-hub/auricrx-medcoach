const fs = require('fs');

console.log('🚀 Extracting Batch 12 (Massive Digestive Health Collection)...');
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
// IMAGE 1: 36 Products (Pepto-Bismol, Phillips', OLLY, etc.)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Pepto-Bismol InstaCOOL Liquid', '12 fl oz', 12.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Walgreens Gas Relief Softgels Ultra Strength', '50 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Phillips Colon Health Probiotics Capsules', '30 ea', 18.99, 'Walgreens', 'Phillips');
addProduct('OLLY Beat The Bloat Capsules', '25 ea', 22.99, 'Walgreens', 'OLLY');
addProduct('Walgreens Gentle Laxative Liquid Cherry', '12 fl oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Pepto-Bismol Chewable Tablets', '12 ea', 5.79, 'Walgreens', 'Pepto-Bismol');

// Row 2
addProduct('Walgreens Stool Softener + Stimulant Laxative Tablets', '60 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Electrolyte Solution Strawberry', '33.8 fl oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Dulcolax Medicated Stimulant Laxative Suppositories', '16 ea', 32.99, 'Walgreens', 'Dulcolax');
addProduct('Walgreens Electrolyte Solution Mixed Fruit', '33.8 fl oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Liquid I.V. Hydration Multiplier', '0.56 oz x 10 pack', 19.99, 'Walgreens', 'Liquid I.V.');
addProduct('Liquid I.V. Hydration Multiplier Powder', '0.56 oz x 10 pack', 19.99, 'Walgreens', 'Liquid I.V.');

// Row 3
addProduct('Mylicon Infant Gas Relief Drops', '1 fl oz', 11.99, 'Walgreens', 'Mylicon');
addProduct('Culturelle Calm & Comfort Probiotic', '0.29 fl oz', 23.99, 'Walgreens', 'Culturelle');
addProduct('Imodium A-D Anti-Diarrheal Caplets', '6 ea', 6.99, 'Walgreens', 'Imodium A-D');
addProduct('Pepto-Bismol Chewable Tablets', '24 ea', 10.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Walgreens Laxative Tablets', '90 ea', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Soothe Ultra Caplets', '24 ea', 9.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens Prebiotic + Postbiotic + Probiotic Gummies', '60 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Laxative Tablets', '24 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Metamucil Premium Blend Fiber Supplement', '23.5 oz', 39.99, 'Walgreens', 'Metamucil');
addProduct('Walgreens Gentle Laxative Suppositories', '30 ea', 28.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Acid Reducer', '200 ea', 31.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Laxative Tablets', '48 ea', 9.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Acid Reducer Complete Chewable Tablets', '50 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoidal Suppositories', '24 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Antacid + Upset Stomach Relief Effervescent Tablets Extra Strength', '24 ea', 6.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Soothe Liquid Cherry', '16 fl oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Rolaids Original Strength Heartburn Relief', '10 ea x 3 pack', 4.49, 'Walgreens', 'Rolaids');
addProduct('AZO Complete Feminine Balance Daily Probiotic', '30 ea', 31.49, 'Walgreens', 'AZO');

// Row 6
addProduct('OLLY Probiotic + Prebiotic Peachy Peach', '60 ea', 23.99, 'Walgreens', 'OLLY');
addProduct('Zarbees Childrens Regularity Support Prebiotic Fiber Powder', '5.82 oz', 23.99, 'Walgreens', 'Zarbees');
addProduct('Prevacid 24HR Lansoprazole Delayed-Release Capsules 15 mg/Acid Reducer', '42 ea', 29.99, 'Walgreens', 'Prevacid 24HR');
addProduct('Tums Gummy Bites for Occasional Heartburn Relief, Upset Stomach and Acid Indigestion', '50 ea', 13.99, 'Walgreens', 'Tums');
addProduct('MiraLAX Gentle Constipation Relief Orange', '8.3 oz', 19.99, 'Walgreens', 'MiraLAX');
addProduct('MiraLAX For Gentle Constipation Relief Orange', '4.1 oz', 12.49, 'Walgreens', 'MiraLAX');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Natures Bounty, Culturelle, Rolaids, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Natures Bounty Chewable Probiotic Acidophilus with 1 Billion Live Cultures Strawberry', '60 ea', 16.99, 'Walgreens', 'Natures Bounty');
addProduct('Culturelle Bloating & Gas Defense', '30 ea', 28.99, 'Walgreens', 'Culturelle');
addProduct('Dulcolax Stimulant Laxative Liquid Gels For Constipation Relief', '20 ea', 10.99, 'Walgreens', 'Dulcolax');
addProduct('Pepcid AC Maximum Strength Heartburn Medicine, 20 Mg Famotidine Unflavored', '50 ea', 24.99, 'Walgreens', 'Pepcid AC');
addProduct('Pepto-Bismol Nausea Motion Sickness, Treats and Prevents Nausea', '10 ea', 9.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Pepcid AC Maximum Strength Heartburn Tablets Icy Cool Mint', '40 ea', 21.99, 'Walgreens', 'Pepcid AC');

// Row 2
addProduct('Pepcid AC Maximum Strength Heartburn Medicine Tablets Icy Cool Mint', '20 ea', 13.99, 'Walgreens', 'Pepcid AC');
addProduct('OLLY Fiber Gummy Rings Berry Melon', '50 ea', 18.99, 'Walgreens', 'OLLY');
addProduct('Rolaids Original Strength, Chewable Tablets Mint', '96 ea', 7.49, 'Walgreens', 'Rolaids');
addProduct('Metamucil 4 in 1 Fiber Supplement Powder Promotes Digestive Health and Regularity Lemonade', '14.7 oz', 24.99, 'Walgreens', 'Metamucil');
addProduct('Boiron Camilia Tummy, Gas & Colic Relief, Liquid Doses', '0.03 fl oz x 30 pack', 13.99, 'Walgreens', 'Boiron');
addProduct('Walgreens Soothe Chewable Tablets', '30 ea', 5.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Pepto-Bismol Non-Medicated Ginger Gummy, Helps Prevent Occasional Nausea Berry Citrus', '24 ea', 12.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Walgreens SmoothLAX Polyethylene Glycol 3350 Powder for Solution Orange', '17.9 oz', 23.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Fiber Powder with Probiotics + Enzymes', '4.2 oz', 15.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Gaviscon Antacid Extra Strength Liquid Mint', '12 fl oz', 14.49, 'Walgreens', 'Gaviscon');
addProduct('Walgreens Omeprazole Tablets Cool Mint Coated', '14 ea x 3 pack', 9.99, 'Walgreens', 'Walgreens');
addProduct('Pepto Kids Gummies, Helps Relieve Occasional Upset Stomach Bubble Gum', '24 ea', 11.99, 'Walgreens', 'Pepto Kids');

// Row 4
addProduct('Walgreens Antacid Bites Extra Strength Wild Berry', '32 ea', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Probiotic Digestive Health Capsules (30 days)', '30 ea', 19.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Esomeprazole Magnesium Delayed-Release Capsules 20 mg, Acid Reducer', '42 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Pepcid Complete Acid Reducer + Antacid Chewables Berry', '8 ea', 7.99, 'Walgreens', 'Pepcid Complete');
addProduct('Walgreens Acid Reducer Tablets Maximum Strength', '25 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Acid Reducer Tablets Original Strength', '30 ea', 9.49, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Colon Support Probiotic', '60 ea', 22.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Acid Controller Tablets Original Strength', '180 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Antacid Bites Chewable Tablets Wild Berry', '60 ea', 10.99, 'Walgreens', 'Walgreens');
addProduct('Lactaid Fast Act Lactose Intolerance Caplets', '96 ea', 18.99, 'Walgreens', 'Lactaid');
addProduct('Emetrol Non-Drowsy Rapid Nausea Relief Liquid for Upset Stomach Mixed Berry', '4 fl oz', 13.99, 'Walgreens', 'Emetrol');
addProduct('Walgreens Acid Reducer Tablets Maximum Strength', '50 ea', 16.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Walgreens Acid Reducer Tablets Maximum Strength', '200 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Senna-S Softgels', '60 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Maximum Strength Acid Controller, 20 mg, Tablets', '75 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Soothe Upset Stomach Reliever/Antidiarrheal Liquid', '8 fl oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Acid Reducer Tablets Maximum Strength', '90 ea', 21.99, 'Walgreens', 'Walgreens');
addProduct('Tums Chewable Antacid Tablets Berry Fusion', '12 ea', 3.29, 'Walgreens', 'Tums');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 36 Products (Konsyl, Mirafiber, Iberogast, etc.)
// ============================================================================
console.log('📸 Extracting Image 3 (36 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Konsyl Daily Psyllium Fiber', '12.7 oz', 25.99, 'Walgreens', 'Konsyl');
addProduct('Mirafiber Gummies Dietary Supplement Assorted', '72 ea', 19.99, 'Walgreens', 'Mirafiber');
addProduct('MiraFast Fast Acting Laxative Mixed Berry', '30 ea', 14.99, 'Walgreens', 'MiraFast');
addProduct('Iberogast Dual Action Digestive Relief Daily Herbal Supplement Softgels', '30 ea', 19.99, 'Walgreens', 'Iberogast');
addProduct('Florastor Advanced Gas & Bloat Probiotic & Digestive Supplement Capsules', '30 ea', 38.99, 'Walgreens', 'Florastor');
addProduct('Walgreens Magnesium Citrate Saline Laxative/Oral Solution Lemon', '10 fl oz', 3.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Magnesium Citrate Saline Laxative/Oral Solution Cherry', '10 fl oz', 3.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Magnesium Citrate Saline Laxative/Oral Solution Grape', '10 fl oz', 3.99, 'Walgreens', 'Walgreens');
addProduct('Mylanta Maximum Strength Liquid Antacid Classic', '12 fl oz', 11.49, 'Walgreens', 'Mylanta');
addProduct('Align Daily Probiotic Supplement for Digestive Health Capsules', '49 ea', 49.99, 'Walgreens', 'Align');
addProduct('Walgreens SmoothLax Laxative Powder, Polyethylene Glycol 3350, Grit Free Orange', '8.3 oz', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Abdominal Comfort', '48 ea', 25.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Walgreens Omeprazole Delayed Release Mini Capsules 20 mg, Acid Reducer', '42 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Probiotic Acidophilus Capsules', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Peppermint Oil Supplement Softgels for Digestive Support (60 days)', '60 ea', 12.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Free & Pure Maximum Strength Gas Relief, Simethicone 250 mg Softgels', '30 ea', 12.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Lansoprazole 15mg Caps', '42 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Anti Nausea Liquid', '4 fl oz', 9.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Emetrol Non-Drowsy Chewables for Rapid Nausea Relief', '42 ea', 10.99, 'Walgreens', 'Emetrol');
addProduct('Walgreens Gentle Laxative Comfort-Coated Tablets', '10 ea', 3.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Loperamide Hydrochloride Oral Solution, Anti-Diarrheal Medicine Mint', '8 fl oz', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Liquid Glycerin Suppositories', '0.25 fl oz x 6 pack', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Loperamide Hydrochloride Oral Solution, Anti-Diarrheal Medicine Mint', '4 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Gentle Stool Softener', '25 ea', 6.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Lansoprazole Delayed-Release Capsules USP, 15 mg/Acid Reducer', '14 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Garden of Life Feminine pH Daily Care Probiotic Capsules', '30 ea', 22.99, 'Walgreens', 'Garden of Life');
addProduct('Walgreens Gas Relief Chewable Tablets Extra Strength', '18 ea', 7.49, 'Walgreens', 'Walgreens');
addProduct('Force Factor Ginger, Naturally Soothing Digestive Support Soft Chews Honey Lemon', '60 ea', 19.99, 'Walgreens', 'Force Factor');
addProduct('Supergut GLP-1 Booster Prebiotic Fiber Unflavored', '5.7 oz', 29.99, 'Walgreens', 'Supergut');
addProduct('Supergut GLP-1 Booster Prebiotic Fiber Stick Packs Assorted Variety', '0.3 oz x 15 pack', 29.99, 'Walgreens', 'Supergut');

// Row 6
addProduct('Supergut GLP-1 Booster Unflavored', '0.3 oz x 15 pack', 29.99, 'Walgreens', 'Supergut');
addProduct('Iberogast Dual Action Digestive Relief Daily Herbal Supplement Liquid Drops', '1.69 fl oz', 19.99, 'Walgreens', 'Iberogast');
addProduct('Iberogast Dual Action Digestive Relief Daily Herbal Supplement Liquid Drops', '0.67 fl oz', 10.99, 'Walgreens', 'Iberogast');
addProduct('Walgreens Daily Probiotic Capsules', '50 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Colace Extra Strength Stool Softener Softgels', '60 ea', 34.99, 'Walgreens', 'Colace');
addProduct('Walgreens Glycerin Suppositories', '25 ea', 3.79, 'Walgreens', 'Walgreens');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 24 Products (Nature Made, Bonine, Ibgard, etc.)
// ============================================================================
console.log('📸 Extracting Image 4 (24 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('Nature Made Fiber Gummies 5 g Per Serving Orange & Mixed Berry', '90 ea', 23.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Ultra Probiotic Capsules', '60 ea', 22.99, 'Walgreens', 'Walgreens');
addProduct('Emetrol Non-Drowsy Rapid Nausea Relief Powder Mix Lemon', '6 ea', 13.99, 'Walgreens', 'Emetrol');
addProduct('Walgreens Soothe Bismuth Subsalicylate 525 mg Liquid Original', '16 fl oz', 8.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Glycerin Suppositories', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Motion Sickness Relief Chewable Tablets Raspberry', '12 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoidal Suppositories', '12 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Gentle Laxative Suppositories', '4 ea', 8.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Bonine Ginger Root Extract Liquid Capsules, Non-Drowsy Motion Sickness Relief', '60 ea', 19.99, 'Walgreens', 'Bonine');
addProduct('Walgreens Free & Pure Probiotic 10 Billion Active Cultures Capsules', '60 ea', 16.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Imodium A-D Diarrhea Relief Caplets with 2 mg Loperamide Hydrochloride', '12 ea', 10.99, 'Walgreens', 'Imodium A-D');
addProduct('Walgreens 24 Hour Acid Reducer Esomeprazole Magnesium USP 20 mg Capsules', '14 ea', 9.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens 24 Hour Acid Reducer Esomeprazole Magnesium USP 20 mg Capsules', '28 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens 24 Hour Acid Reducer Esomeprazole Magnesium USP 20 mg Capsules', '42 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Rolaids Ultra Strength Heartburn Relief, Chewable Tablets Assorted Fruit', '72 ea', 8.79, 'Walgreens', 'Rolaids');
addProduct('Walgreens Cimetidine Tablets 200 mg, Acid Reducer for Heartburn Relief', '60 ea', 15.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Soothe', '12 fl oz', 8.49, 'Walgreens', 'Walgreens');
addProduct('Natures Bounty Probiotic Acidophilus Dietary Supplement Tablets', '100 ea', 12.99, 'Walgreens', 'Natures Bounty');
addProduct('Lactaid Fast Act Lactose Relief Chewables Vanilla', '60 ea', 16.99, 'Walgreens', 'Lactaid');
addProduct('Fleet Childrens Pedia-Lax Liquid Glycerin Laxative Suppositories', '4 mL x 6 pack', 11.49, 'Walgreens', 'Fleet Childrens');

// Row 6
addProduct('Ibgard Gut Health Supplement, Peppermint Oil Capsule for Abdominal Comfort', '48 ea', 29.99, 'Walgreens', 'Ibgard');
addProduct('Walgreens Saline Enema Laxative', '4.5 fl oz x 6 pack', 9.49, 'Walgreens', 'Walgreens');
addProduct('Pepto-Bismol Liquid - 5 Symptom Fast Relief Original', '12 fl oz', 12.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Walgreens Lansoprazole Delayed Release Orally Disintegrating Tablets 15 mg, Acid Reducer Strawberry', '42 ea', 10.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 4 complete: ${allProducts.length - img4Start} products extracted`);

// ============================================================================
// IMAGE 5: 36 Products (Culturelle Kids, Pedialyte, Florastor, etc.)
// ============================================================================
console.log('📸 Extracting Image 5 (36 products)...');
const img5Start = allProducts.length;

// Row 1
addProduct('Culturelle Kids Daily Probiotic Supplement Chewable Bursting Berry', '30 ea', 24.99, 'Walgreens', 'Culturelle');
addProduct('Walgreens Anti-Diarrheal Multi-Symptom Caplets', '24 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Phillips Fiber Good Gummies Prebiotic Inulin Fiber Supplement Strawberry, Apple, Grape, Cherry, Orange, Lemon', '90 ea', 19.99, 'Walgreens', 'Phillips');
addProduct('Florastor Kids Daily Probiotic Supplement, Unflavored Powder Mixes with Food or Beverage', '20 ea', 27.99, 'Walgreens', 'Florastor');
addProduct('Pedialyte Electrolyte Powder Strawberry Lemonade', '0.6 oz x 6 pack', 10.99, 'Walgreens', 'Pedialyte');
addProduct('Pedialyte Electrolyte Solution Iced Grape', '33.8 fl oz', 7.99, 'Walgreens', 'Pedialyte');

// Row 2
addProduct('Pepcid Complete Acid Reducer + Antacid Chews Tropical Fruit', '25 ea', 16.99, 'Walgreens', 'Pepcid Complete');
addProduct('Alka-Seltzer Heartburn Relief Chews Fast Antacid Assorted Fruit', '66 ea', 12.99, 'Walgreens', 'Alka-Seltzer');
addProduct('OLLY Probiotic + Prebiotic Gummies Peachy Peach', '30 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Phazyme Ultimate Gas & Bloating Relief', '20 ea', 16.99, 'Walgreens', 'Phazyme');
addProduct('Mommys Bliss Baby Constipation Ease', '4 fl oz', 15.99, 'Walgreens', 'Mommys Bliss');
addProduct('Walgreens Daily Probiotic Capsules', '30 ea', 19.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('FiberCon Calcium Polycarbophil', '140 ea', 25.99, 'Walgreens', 'FiberCon');
addProduct('Dramamine Advanced Herbals Ginger Chews Ginger', '20 ea', 14.49, 'Walgreens', 'Dramamine');
addProduct('Walgreens Fiber Select Gummies Natural Mixed Berry', '90 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Aloe Vera Juice Aloe Vera', '128 oz', 13.49, 'Walgreens', 'Walgreens');
addProduct('Fleet Childrens Pedia-Lax Liquid Stool Softener Fruit Punch', '4 fl oz', 11.49, 'Walgreens', 'Fleet Childrens');
addProduct('Swiss Kriss Herbal Laxative, Tablets', '120 ea', 14.99, 'Walgreens', 'Swiss Kriss');

// Row 4
addProduct('Senokot-S Dual Action Natural Vegetable Laxative', '30 ea', 22.99, 'Walgreens', 'Senokot-S');
addProduct('Irwin Naturals 2-in-1 Kidney & Liver Super Cleanse', '60 ea', 14.99, 'Walgreens', 'Irwin Naturals');
addProduct('Walgreens Infants Gas Relief', '1 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Digestive Advantage Daily Probiotics Gummies For Womens & Mens Digestive & Gut Health, Bloating Assorted Fruit', '80 ea', 21.99, 'Walgreens', 'Digestive Advantage');
addProduct('Tagamet HB 200 Tablet', '30 ea', 14.99, 'Walgreens', 'Tagamet HB 200');
addProduct('Culturelle 3-in-1 Complete Probiotic Daily Formula', '30 ea', 27.99, 'Walgreens', 'Culturelle');

// Row 5
addProduct('Pepto-Bismol Liquid Cherry', '8 fl oz', 9.49, 'Walgreens', 'Pepto-Bismol');
addProduct('Pepto-Bismol Liquicaps, Upset Stomach Relief, Multi-Symptom Relief', '24 ea', 13.99, 'Walgreens', 'Pepto-Bismol');
addProduct('Walgreens Clear Fiber Powder Stick Packs Flavor Free', '0.14 oz x 28 pack', 14.99, 'Walgreens', 'Walgreens');
addProduct('Pedialyte AdvancedCare Electrolyte Solution Tropical Fruit', '33.8 fl oz', 7.49, 'Walgreens', 'Pedialyte');
addProduct('Culturelle Daily Probiotic Gummies for Women & Men, Naturally-Sourced Probiotic + Prebiotic Mixed Berry', '52 ea', 19.99, 'Walgreens', 'Culturelle');
addProduct('Mommys Bliss Gripe Water Night Time', '4 fl oz', 14.99, 'Walgreens', 'Mommys Bliss');

// Row 6
addProduct('Metamucil Daily Fiber + Collagen, Psyllium Husk Powder, Plant Based Fiber Orange', '19.9 oz', 35.99, 'Walgreens', 'Metamucil');
addProduct('Dulcolax Saline Laxative Chewy Fruit Bites Assorted Fruit', '30 ea', 18.99, 'Walgreens', 'Dulcolax');
addProduct('Walgreens Probiotic Gummies', '90 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Prunelax Ciruelax Natural Laxative Maximum Relief Tablets', '24 ea', 10.99, 'Walgreens', 'Prunelax Ciruelax');
addProduct('Florajen Digestion Refrigerated Probiotic, 15 Billion CFUs (Actual Item May Vary)', '30 ea', 18.99, 'Walgreens', 'Florajen');
addProduct('Kaopectate Diarrhea & Upset Stomach Soft Chews Strawberry', '24 ea', 9.99, 'Walgreens', 'Kaopectate');

console.log(`✅ Image 5 complete: ${allProducts.length - img5Start} products extracted`);

// ============================================================================
// IMAGE 6: 36 Products (Benefiber, Natures Way, Dramamine, etc.)
// ============================================================================
console.log('📸 Extracting Image 6 (36 products)...');
const img6Start = allProducts.length;

// Row 1
addProduct('Benefiber Prebiotic Fiber Supplement', '5.4 oz', 14.49, 'Walgreens', 'Benefiber');
addProduct('Natures Way Primadophilus Fortify Womens Probiotic', '30 ea', 25.99, 'Walgreens', 'Natures Way');
addProduct('Dramamine Motion Sickness Relief', '36 ea', 16.99, 'Walgreens', 'Dramamine');
addProduct('Dr. Sana Sodium Bicarbonate Powder', '6 oz', 2.99, 'Walgreens', 'Dr. Sana');
addProduct('Natures Way Fortify Daily 50 Billion Vegetarian Capsules', '30 ea', 29.99, 'Walgreens', 'Natures Way');
addProduct('Prunelax Ciruelax Laxative for Occasional Constipation Minitabs', '60 ea', 16.99, 'Walgreens', 'Prunelax Ciruelax');

// Row 2
addProduct('Culturelle Health & Wellness Daily Probiotic Capsules', '50 ea', 42.99, 'Walgreens', 'Culturelle');
addProduct('Walgreens SmoothLax Polyethylene Glycol 3350 Powder For Solution', '0.5 oz x 10 pack', 14.99, 'Walgreens', 'Walgreens');
addProduct('Suero Repone Oral Electrolyte Drink', '33.8 fl oz', 4.49, 'Walgreens', 'Suero Repone');
addProduct('Gas-X Gas Relief and Heartburn Relief', '30 ea', 13.99, 'Walgreens', 'Gas-X');
addProduct('Walgreens Free & Pure Probiotic Capsules (60 days)', '60 ea', 22.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Dulcolax Saline Laxative Chewy Fruit Bites', '30 ea', 18.99, 'Walgreens', 'Dulcolax');

// Row 3
addProduct('Pepcid AC Original Strength Heartburn Prevention & Relief', '90 ea', 26.99, 'Walgreens', 'Pepcid AC');
addProduct('Walgreens Free & Pure Probiotic Capsules Extra Strength', '30 ea', 29.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Digestive Advantage Probiotics For Digestive Health', '90 ea', 28.99, 'Walgreens', 'Digestive Advantage');
addProduct('Suero Repone Fruit Drink', '33.8 fl oz', 4.49, 'Walgreens', 'Suero Repone');
addProduct('ReNew Life Probiotic', '30 ea', 49.99, 'Walgreens', 'ReNew Life');
addProduct('Culturelle Daily Chewable Probiotic for Women, Vaginal, Digestive Health & Immune Support', '30 ea', 23.99, 'Walgreens', 'Culturelle');

// Row 4
addProduct('Colace 2-In-1 Stool Softener & Stimulant Laxative Tablets', '60 ea', 31.99, 'Walgreens', 'Colace');
addProduct('Dulcolax Kids Saline Laxative Soft Chews', '15 ea', 9.99, 'Walgreens', 'Dulcolax');
addProduct('Sanar Naturals Colon Cleanser 2002 Dietary Supplement', '90 ea', 10.99, 'Walgreens', 'Sanar Naturals');
addProduct('Prunelax Ciruelax Minitabs Natural Laxative, Coated Tablets', '20 ea', 6.49, 'Walgreens', 'Prunelax');
addProduct('Mylicon Infant Gas Relief Drops Original', '1 fl oz', 11.99, 'Walgreens', 'Mylicon');
addProduct('Ibgard Gut Health Supplement', '12 ea', 14.99, 'Walgreens', 'Ibgard');

// Row 5
addProduct('De La Cruz Castor Oil', '2 fl oz', 4.29, 'Walgreens', 'De La Cruz');
addProduct('Pedialyte Electrolyte Solution', '33.8 fl oz', 7.99, 'Walgreens', 'Pedialyte');
addProduct('Walgreens Electrolyte Solution', '33.8 fl oz', 5.99, 'Walgreens', 'Walgreens');
addProduct('Leonflax Flax Seed Fat Reducer Dietary Supplement Powder', '18 oz', 13.99, 'Walgreens', 'Leonflax');
addProduct('Metamucil Premium Blend Fiber Supplement', '14.9 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('Walgreens Antacid + Gas Relief Bites', '54 ea', 10.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('UpSpring Gummies Lemon Ginger', '50 ea', 18.99, 'Walgreens', 'UpSpring');
addProduct('Colace Stool Softening Soft Chews', '42 ea', 27.99, 'Walgreens', 'Colace');
addProduct('Senokot Regular Strength Natural Vegetable Laxative Tablets', '100 ea', 31.99, 'Walgreens', 'Senokot');
addProduct('Walgreens Colon Support Probiotic', '30 ea', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Gentle Laxative Suppositories', '8 ea', 13.99, 'Walgreens', 'Walgreens');
addProduct('Rolaids Power Chew 1000 Antacid Heartburn Relief', '32 ea', 8.79, 'Walgreens', 'Rolaids');

console.log(`✅ Image 6 complete: ${allProducts.length - img6Start} products extracted`);

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
console.log('🎉 Batch 12 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

