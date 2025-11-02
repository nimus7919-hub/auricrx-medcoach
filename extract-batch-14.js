const fs = require('fs');

console.log('🚀 Extracting Batch 14 (Vitamins and Supplements)...');
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
// IMAGE 1: 35 Products (Vitamins and Supplements)
// ============================================================================
console.log('📸 Extracting Image 1 (35 products)...');

// Row 1
addProduct('Walgreens Clear Dissolving Fiber Powder Flavor Free', '12.7 oz', 16.99, 'Walgreens', 'Walgreens');
addProduct('Natures Bounty Optimal Solutions Hair, Skin & Nails Gummies with Biotin', '80 ea', 9.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Optimal Solutions Hair, Skin & Nails with Biotin & Collagen Tropical Citrus', '80 ea', 11.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Vitamin K2 100 mcg Softgels', '30 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Glucosamine Chondroitin Capsules', '110 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Zinc 50 mg Caplets', '100 ea', 8.99, 'Walgreens', 'Natures Bounty');

// Row 2
addProduct('Schiff Move Free Joint Health Advanced + MSM with Glucosamine Chondroitin, Tablets', '120 ea', 24.99, 'Walgreens', 'Schiff Move Free');
addProduct('Natures Bounty Optimal Solutions Extra Strength Hair, Skin & Nails Softgels', '150 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Vitamin C Gummies 250 mg Tangerine', '150 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Vitamin D3 2000 IU (50 mcg) Tablets', '400 ea', 29.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Calcium 1200 mg Plus Vitamin D3 Dietary Supplement Softgels Twinpack', '120 ea x 2 pack', 31.99, 'Walgreens', 'Natures Bounty');
addProduct('Emergen-C Daily Immune Support Drink with 1000 mg Vitamin C Super Orange', '30 ea', 18.99, 'Walgreens', 'Emergen-C');

// Row 3
addProduct('Nature Made Vitamin B12 Sublingual 1000 mcg Sugar Free Fast Dissolve Tablets', '50 ea', 11.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Fish Oil 1200 mg Softgels', '100 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Optimal Solutions Advanced Hair, Skin, Nails Gummies', '80 ea', 14.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Vitamin D3 1000 IU (25 mcg) Softgels', '180 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Double Strength Ginkgo Biloba, 120mg, Capsules', '100 ea', 19.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty CoQ10 200 mg Gummies Peach Mango', '60 ea', 19.99, 'Walgreens', 'Natures Bounty');

// Row 4
addProduct('Nature Made Vitamin D3 2000 IU (50 mcg) Softgels', '90 ea', 12.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Ultra Strength Probiotic 10', '30 ea', 31.99, 'Walgreens', 'Natures Bounty');
addProduct('PreserVision AREDS 2 Formula Eye Vitamin & Mineral Supplement Softgels', '120 ea', 39.99, 'Walgreens', 'PreserVision');
addProduct('Schiff Move Free Advanced Joint Supplement', '80 ea', 24.99, 'Walgreens', 'Schiff Move Free');
addProduct('Schiff Move Free Ultra Triple Action Joint Support With Type II Collagen, Boron and HA', '30 ea', 24.99, 'Walgreens', 'Schiff Move Free');
addProduct('Nature Made Zinc 30 mg Tablets', '100 ea', 4.99, 'Walgreens', 'Nature Made');

// Row 5
addProduct('Nature Made Burp Less Fish Oil 1000 mg Softgels', '200 ea', 25.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Super C with Vitamin D3 and Zinc Tablets', '60 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Vitamin C 500 mg Softgels', '60 ea', 15.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Ultra Strength Biotin 10,000mcg, Softgels', '120 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Citracal Petites Calcium Supplement + D3 Coated Caplets', '200 ea', 15.99, 'Walgreens', 'Citracal');
addProduct('Natures Bounty Acidophilus Probiotic Tablets', '100 ea x 2 pack', 21.99, 'Walgreens', 'Natures Bounty');

// Row 6 (Partial)
addProduct('Vitafusion Fiber Well Gummy Vitamins Peach, Strawberry & Berry', '90 ea', 17.99, 'Walgreens', 'Vitafusion');
addProduct('Nature Made Super B Complex with Vitamin C and Folic Acid Tablets', '140 ea', 16.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Optimal Solutions Womens Multivitamin Gummies, Dietary Supplement Raspberry', '80 ea', 12.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Extra Strength Vitamin C 1000 mg Tablets', '100 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Multivitamin For Her Tablets', '90 ea', 14.99, 'Walgreens', 'Nature Made');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 42 Products (Vitamins and Supplements)
// ============================================================================
console.log('📸 Extracting Image 2 (42 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Natures Bounty Optimal Solutions Hair, Skin, & Nails', '120 ea', 13.99, 'Walgreens', 'Natures Bounty');
addProduct('Viviscal Hair Growth Supplements for Women, Thicker Fuller Hair Support', '60 ea', 49.99, 'Walgreens', 'Viviscal');
addProduct('Nature Made Stress B Complex with Vitamin C and Zinc Tablets', '75 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Osteo Bi-Flex Advanced Triple Strength Glucosamine Chondroitin MSM with 5-Loxin, Tablets', '120 ea', 47.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('Natures Bounty Milk Thistle 1000 mg Herbal Supplement Softgels', '50 ea', 19.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made SAM-e Complete 400 mg Tablets', '36 ea', 54.99, 'Walgreens', 'Nature Made');

// Row 2
addProduct('Nature Made Potassium Gluconate Tablets', '100 ea', 8.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Calcium Gummies 500 mg Per Serving with Vitamin D3 Cherry, Orange & Strawberry', '80 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Probiotic 4 Billion Live Cultures Gummies', '60 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Cranberry 4200 mg Plus Vitamin C Dietary Supplement Softgels', '250 ea', 31.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Iron 65 mg (325 mg Ferrous Sulfate) Tablets', '180 ea', 17.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Burp Less Fish Oil 1200 mg Softgels', '200 ea', 43.99, 'Walgreens', 'Nature Made');

// Row 3
addProduct('Natrol 10mg Melatonin Gummies Strawberry', '90 ea', 17.99, 'Walgreens', 'Natrol');
addProduct('Natures Bounty Saw Palmetto 450 mg Herbal Supplement Capsules', '250 ea', 34.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Extra Strength Magnesium Oxide 400 mg Softgels', '60 ea', 17.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Vitamin B-12 1000mcg Tablets, Value Size', '200 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('Emergen-C Daily Immune Support Drink with 1000 mg Vitamin C, Antioxidants, & B Vitamins Raspberry', '0.32 oz x 30 pack', 18.99, 'Walgreens', 'Emergen-C');
addProduct('Natures Bounty Probiotic GX Gas & Bloating Formula, Capsules', '25 ea', 31.99, 'Walgreens', 'Natures Bounty');

// Row 4
addProduct('Nature Made Vitamin B12 1000 mcg Softgels', '90 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Extra Strength Vitamin D3 5000 IU (125 mcg) Softgels', '90 ea', 25.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Calcium 600 Mg With Vitamin D3 Tablets', '120 ea', 16.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Optimal Solutions Essential Prenatal Gummies Mixed Berry', '50 ea', 15.99, 'Walgreens', 'Natures Bounty');
addProduct('Flintstones Kids Vitamins with Vitamin C & A Cherry, Raspberry, Orange', '70 ea', 9.99, 'Walgreens', 'Flintstones');
addProduct('Nature Made Energy B12 1000 mcg Gummies Cherry & Mixed Berries', '80 ea', 12.99, 'Walgreens', 'Nature Made');

// Row 5
addProduct('Nature Made Melatonin 5 mg Tablets', '90 ea', 13.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Mens 50+ Multivitamin Tablets (200 days)', '200 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Vitamin C 500 Mg Tablets', '100 ea', 11.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Vitamin D3 2000 IU (50 mcg) Tablets', '100 ea', 14.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Magnesium 500mg Value Size, Tablets', '200 ea', 18.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens Glucosamine Chondroitin Tablets Triple Strength (60 days)', '120 ea', 32.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Natures Bounty High Potency Cinnamon 2000 mg Dietary Supplement Capsules', '60 ea', 15.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Turmeric 1000 mg with Bioperine', '60 ea', 24.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Milk Thistle 250 mg Dietary Supplement Capsules', '200 ea', 41.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made High Absorption Magnesium Citrate Gummies Mixed Berry', '60 ea', 25.99, 'Walgreens', 'Nature Made');
addProduct('Airborne Immune Support Effervescent Tablets Verry Berry', '10 ea', 9.99, 'Walgreens', 'Airborne');
addProduct('Walgreens Womens 50+ Multivitamin Tablets (200 days)', '200 ea', 17.99, 'Walgreens', 'Walgreens');

// Row 7
addProduct('Nature Made Melatonin 10 mg Gummies', '70 ea', 18.99, 'Walgreens', 'Nature Made');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 36 Products (Vitamins and Supplements)
// ============================================================================
console.log('📸 Extracting Image 3 (36 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Nature Made Extra Strength Vitamin D3 5000 IU (125 mcg) per serving Gummies Strawberry, Peach, Mango', '80 ea', 21.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Melatonin 10mg Extra Strength Tablets', '70 ea', 16.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Lutein Softgels 40 mg', '30 ea', 29.99, 'Walgreens', 'Natures Bounty');
addProduct('Centrum Silver Women 50+, Multivitamin & Multimineral Supplements Tablets', '100 ea', 14.99, 'Walgreens', 'Centrum Silver');
addProduct('Walgreens Wild Caught Alaskan Half-the-Size Fish Oil with Omega-3 Softgels (200 days)', '200 ea', 26.99, 'Walgreens', 'Walgreens');
addProduct('Centrum Silver Men 50+, Multivitamin & Multimineral Supplements Tablets', '100 ea', 14.99, 'Walgreens', 'Centrum Silver');

// Row 2
addProduct('Walgreens Vitamin D3 125 mcg Softgels (100 days)', '100 EA', 11.99, 'Walgreens', 'Walgreens');
addProduct('Vitafusion B12 Gummy Vitamin', '140 ea', 13.99, 'Walgreens', 'Vitafusion');
addProduct('Nature Made Magnesium Glycinate 200 mg Capsules', '60 ea', 22.99, 'Walgreens', 'Nature Made');
addProduct('Geritol Liquid Vitamin and Iron Supplement, Energy Support', '12 fl oz', 12.99, 'Walgreens', 'Geritol');
addProduct('Walgreens High Potency Iron Ferrous Sulfate Tablets (100 days)', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Slow Fe Iron Supplement For Iron Deficiency', '60 ea', 18.99, 'Walgreens', 'Slow Fe');

// Row 3
addProduct('Florastor Daily Probiotic Supplement Capsules for Men and Women', '20 ea', 27.99, 'Walgreens', 'Florastor');
addProduct('Natures Bounty Anxiety & Stress Relief, Ashwagandha Ksm-66', '50 ea', 27.99, 'Walgreens', 'Natures Bounty');
addProduct('Culturelle Kids Daily Probiotic Supplement', '30 ea', 24.99, 'Walgreens', 'Culturelle');
addProduct('Nature Made Multivitamin For Her 50+ Tablets with No Iron', '90 ea', 14.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made L-Lysine 1000 mg Tablets', '60 ea', 14.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Extra Strength Vitamin D3 5000 IU (125 mcg) Softgels', '180 ea', 31.99, 'Walgreens', 'Nature Made');

// Row 4
addProduct('Natures Bounty Maximum Strength Melatonin 10 mg Capsules', '60 ea', 19.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Vitamin C Gummies 250 mg Tangerine', '80 ea', 14.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Womens Multivitamin + Omega-3 Gummies Lemon, Orange & Strawberry', '80 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Citracal Maximum Plus Calcium Supplement + D3 Coated Caplets', '180 ea', 19.99, 'Walgreens', 'Citracal');
addProduct('Nature Made Vitamin B12 1000 mcg Time Release Tablets', '160 ea', 24.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Chewable Vitamin C 500 mg Tablets Orange', '150 ea', 28.99, 'Walgreens', 'Nature Made');

// Row 5
addProduct('One A Day Womens 50+ Healthy Advantage Multivitamin Tablets', '100 ea', 16.99, 'Walgreens', 'One A Day');
addProduct('Natrol Melatonin 5 mg Time Release Nighttime Sleep Aid Tablets Unflavored', '100 ea', 12.99, 'Walgreens', 'Natrol');
addProduct('Natures Truth Triple Strength Apple Cider Vinegar 1,200 mg Capsules', '60 ea', 8.49, 'Walgreens', 'Natures Truth');
addProduct('Nature Made Vitamin B1 100 mg Tablets', '100 ea', 12.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Fiber Capsules', '320 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Almased Natural Health & Weight Loss Meal Replacement Protein Shake Original', '17.6 oz', 39.99, 'Walgreens', 'Almased');

// Row 6
addProduct('AZO Bladder Control Daily Supplement, Capsules', '72 EA', 19.99, 'Walgreens', 'AZO');
addProduct('Sambucol Black Elderberry Original Immune Support Syrup Elderberry', '4 fl oz', 14.49, 'Walgreens', 'Sambucol');
addProduct('Walgreens Cranberry 250 mg Caplets', '50 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Vitamin D3 2000 IU (50 mcg) Softgels', '250 ea', 27.99, 'Walgreens', 'Nature Made');
addProduct('Align Probiotics for Women and Men, Daily Probiotic Supplement for Digestive Health Cranberry', '42 ea', 42.99, 'Walgreens', 'Align');
addProduct('Natures Bounty Turmeric Capsules', '60 ea', 15.99, 'Walgreens', 'Natures Bounty');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 36 Products (Vitamins and Supplements)
// ============================================================================
console.log('📸 Extracting Image 4 (36 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('Nature Made Prenatal Multi + DHA Softgels', '90 ea', 39.99, 'Walgreens', 'Nature Made');
addProduct('Natrol 3mg Fast Dissolve Tablets Melatonin Strawberry', '90 ea', 9.99, 'Walgreens', 'Natrol');
addProduct('OLLY Kids Multi & Probiotic Gummies Yum Berry Punch, Orange', '70 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('OLLY Sleep Blackberry Zen', '50 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Natrol Kids Melatonin Sleep Support Gummies Berry', '90 ea', 17.99, 'Walgreens', 'Natrol');
addProduct('Ocuvite Adult 50+ Eye Health Mini Soft Gels', '90 ea', 29.99, 'Walgreens', 'Ocuvite');

// Row 2
addProduct('Walgreens Awake Coated Caplets Maximum Strength', '60 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made CoQ10 200mg Softgels', '80 ea', 59.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Vitamin D3 2000 IU (50 mcg) Per Serving Gummies Strawberry, Peach & Mango', '90 ea', 15.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Fiber Therapy Caplets', '100 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Magnesium Citrate 250 mg Softgels', '60 ea', 15.99, 'Walgreens', 'Nature Made');
addProduct('Airborne Immune Support Effervescent Tablets Zesty Orange', '10 ea', 9.99, 'Walgreens', 'Airborne');

// Row 3
addProduct('Ocuvite Adult 50+ Lutein & Omega 3 Eye Vitamin & Mineral Supplement Softgels', '50 ea', 17.99, 'Walgreens', 'Ocuvite');
addProduct('Walgreens Sugar Free Fiber Powder Orange', '36.8 oz', 32.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Calcium Citrate 500 mg Tablets (100 days)', '200 ea', 13.49, 'Walgreens', 'Walgreens');
addProduct('Nature Made Vitamin E 267 mg (400 IU) d-Alpha Softgels', '100 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Odorless Garlic 1000 mg Dietary Supplement Softgels', '100 ea', 12.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Super Strength D3-2000iu', '350 ea', 29.99, 'Walgreens', 'Natures Bounty');

// Row 4
addProduct('Citracal Slow Release With Vitamin D3 Calcium Supplement Caplets', '80 ea', 17.99, 'Walgreens', 'Citracal');
addProduct('Natures Bounty Triple Strength Natural Cranberry Softgels', '60 ea', 19.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Vitamin D3 Softgels 125 mcg, 5000 IU', '240 ea', 29.99, 'Walgreens', 'Natures Bounty');
addProduct('Flintstones Immunity Support Gummies Cherry, Raspberry, Orange', '150 ea', 19.99, 'Walgreens', 'Flintstones');
addProduct('One A Day Prenatal Advanced Multivitamin With Choline, DHA, Folic Acid and Iron', '60 ea x 2 pack', 41.99, 'Walgreens', 'One A Day');
addProduct('Walgreens Multivitamin Women 50+ (100 days)', '100 ea', 11.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Nature Made Vitamin D3 1000 IU (25 mcg) Tablets', '100 ea', 12.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Super Potency Biotin 5000 mcg Vitamin Supplement Rapid Release Softgels', '60 ea', 17.99, 'Walgreens', 'Natures Bounty');
addProduct('Qunol Ultra CoQ10 100 mg Dietary Supplement Softgels', '120 ea', 64.99, 'Walgreens', 'Qunol');
addProduct('Natures Bounty Magnesium 500 mg Dietary Supplement Tablets', '100 ea', 14.99, 'Walgreens', 'Natures Bounty');
addProduct('OLLY Womens Multi Blissful Berry', '90 ea', 12.99, 'Walgreens', 'OLLY');
addProduct('Nature Made Vitamin D3 2000 IU (50 mcg) Tablets', '220 ea', 24.99, 'Walgreens', 'Nature Made');

// Row 6
addProduct('Nature Made Calcium 600 Mg With Vitamin D3 Tablets', '220 ea', 27.99, 'Walgreens', 'Nature Made');
addProduct('Emergen-C Daily Immune Support Drink with 1000 mg Vitamin C, Antioxidants & B Vitamins', '0.32 oz x 10 pack', 7.29, 'Walgreens', 'Emergen-C');
addProduct('Walgreens Childrens Melatonin 1 mg Chewable Tablets Natural Grape', '30 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Vitamin B6 100 mg Tablets', '100 ea', 15.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Optimal Solutions Gorgeous Sleep Gummies Berry', '60 ea', 16.99, 'Walgreens', 'Natures Bounty');
addProduct('Schiff Glucosamine With Vitamin D3 And Hyaluronic Acid', '150 ea', 19.99, 'Walgreens', 'Schiff');

console.log(`✅ Image 4 complete: ${allProducts.length - img4Start} products extracted`);

// ============================================================================
// IMAGE 5: 36 Products (Vitamins and Supplements)
// ============================================================================
console.log('📸 Extracting Image 5 (36 products)...');
const img5Start = allProducts.length;

// Row 1
addProduct('Natrol Melatonin 1mg Liquid, Sleep Support Berry', '2 fl oz', 8.99, 'Walgreens', 'Natrol');
addProduct('Osteo Bi-Flex Ease Advanced Triple Action, Mini Tablets', '28 ea', 31.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('Nature Made Vitamin D3 1000 IU (25 mcg) Softgels', '300 ea', 27.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Triple Strength Cranberry 1680 mg Herbal Supplement Softgels', '100 ea', 18.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Vitamin E 180 mg (400 IU) dl-Alpha Softgels', '100 ea', 16.99, 'Walgreens', 'Nature Made');
addProduct('Natures Bounty Super Strength Vitamin D3 2000 IU Dietary Supplement Softgels', '150 ea', 18.99, 'Walgreens', 'Natures Bounty');

// Row 2
addProduct('Natures Bounty B-12 5000 mcg Dietary Supplement Liquid Berry', '2 fl oz', 16.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Fish Oil Gummies with Omega 3s Orange, Lemon & Strawberry', '90 ea', 17.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Multivitamin + Omega-3 Gummies Strawberry, Lemon & Orange', '80 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Osteo Bi-Flex Glucosamine HCI & Vitamin D3 Dietary Supplement Coated Caplets', '60 Each', 37.99, 'Walgreens', 'Osteo Bi-Flex');
addProduct('Natures Bounty B-12 2500 mcg, Quick Dissolve', '75 ea', 18.99, 'Walgreens', 'Natures Bounty');
addProduct('Osteo Bi-Flex Joint Health, Triple Strength with Vitamin D, Tablets', '120 ea', 49.99, 'Walgreens', 'Osteo Bi-Flex');

// Row 3
addProduct('Natures Bounty D3-5000 IU Vitamin Supplement Softgels', '150 ea', 25.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Magnesium 400 mg, Softgels', '75 ea', 14.99, 'Walgreens', 'Natures Bounty');
addProduct('Diurex Max Caffeine-Free Water Pills', '48 ea', 9.49, 'Walgreens', 'Diurex');
addProduct('Natures Bounty B-12 5000 mcg, Quick Dissolve', '40 ea', 17.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Biotin 1000 mcg Softgels', '120 ea', 16.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Ultra Strength Digestive Probiotics Gummies Raspberry & Cherry', '42 ea', 27.99, 'Walgreens', 'Nature Made');

// Row 4
addProduct('Natures Bounty Quick Dissolve Melatonin 10mg Tablets', '45 ea', 17.99, 'Walgreens', 'Natures Bounty');
addProduct('Natures Bounty Pure Vitamin C 1000mg Caplets', '100 ea', 21.99, 'Walgreens', 'Natures Bounty');
addProduct('Nature Made Extra Strength Vitamin B12 3000 mcg Softgels', '60 ea', 21.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Glucosamine Chondroitin with Vitamin D Tablets Triple Strength (40 days)', '80 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('One A Day Prenatal Advanced Complete Multivitamin With Brain Support Tablets', '1 set', 28.99, 'Walgreens', 'One A Day');
addProduct('Natures Bounty Super B Complex Tablets With Folic Acid', '150 ea x 150 pack', 18.99, 'Walgreens', 'Natures Bounty');

// Row 5
addProduct('Walgreens Glucose Tablets Grape', '50 ea', 7.99, 'Walgreens', 'Walgreens');
addProduct('Airborne 1000mg of Vitamin C Immune Support Supplement Multivitamin Chewable Tablets Citrus', '32 ea', 9.99, 'Walgreens', 'Airborne');
addProduct('Natures Bounty E-400 IU, Pure dl-Alpha, Softgels', '120 ea', 16.99, 'Walgreens', 'Natures Bounty');
addProduct('Metamucil Daily Psyllium Husk Powder Supplement with Real Sugar Orange', '30.4 oz', 24.99, 'Walgreens', 'Metamucil');
addProduct('Emergen-C Daily Immune Support Drink with 1000 mg Vitamin C, Antioxidants & B Vitamins Tangerine', '0.33 oz x 30 pack', 18.99, 'Walgreens', 'Emergen-C');
addProduct('Natures Bounty Melatonin 10 mg', '60 ea x 2 pack', 27.99, 'Walgreens', 'Natures Bounty');

// Row 6
addProduct('One A Day VitaCraves Womens Multivitamin Gummies Blue Raspberry, Cherry, Orange', '80 ea', 11.99, 'Walgreens', 'One A Day VitaCraves');
addProduct('Emergen-C Kids Daily Immune Support Supplement Gummies Fruit Fiesta', '44 ea', 18.99, 'Walgreens', 'Emergen-C');
addProduct('Centrum Multivitamin For Adults 50 Plus', '125 ea', 14.99, 'Walgreens', 'Centrum');
addProduct('Centrum Men 50+, Multivitamin & Multimineral Supplements Tablets', '200 ea', 23.99, 'Walgreens', 'Centrum');
addProduct('Florastor Daily Probiotic Supplement Capsules for Men and Women', '50 ea', 49.99, 'Walgreens', 'Florastor');
addProduct('Garden of Life Probiotics Womens Daily Care', '30 EA', 31.99, 'Walgreens', 'Garden of Life');

console.log(`✅ Image 5 complete: ${allProducts.length - img5Start} products extracted`);

// ============================================================================
// IMAGE 6: 36 Products (Vitamins and Supplements)
// ============================================================================
console.log('📸 Extracting Image 6 (36 products)...');
const img6Start = allProducts.length;

// Row 1
addProduct('Metamucil Fiber Gummies Supplement Orange', '72 ea', 22.99, 'Walgreens', 'Metamucil');
addProduct('Nature Made Melatonin 10 mg Gummies', '120 ea', 26.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Vitamin D3 + K2 Softgels', '30 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Airborne Gummies with Vitamin C, Zinc and Immune Support Supplement Elderberry', '50 ea', 17.99, 'Walgreens', 'Airborne');
addProduct('Walgreens Melatonin Quick-Dissolving Tablets Dye-Free (100 days) Natural Cherry', '100 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Womens Probiotic Capsules', '30 ea', 19.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Nature Made CoQ10 100 mg Softgels', '120 ea', 49.99, 'Walgreens', 'Nature Made');
addProduct('One A Day VitaCraves Mens Multivitamin Gummies Blue Raspberry, Cherry, Green Apple', '80 ea', 11.99, 'Walgreens', 'One A Day VitaCraves');
addProduct('Vital Proteins Collagen Peptides', '0.35 oz', 1.99, 'Walgreens', 'Vital Proteins');
addProduct('Benefiber Daily Prebiotic Fiber Supplement Powder Unflavored, 125 dose', '17.6 oz', 32.99, 'Walgreens', 'Benefiber');
addProduct('Nature Made Extra Strength Dosage Chewable Vitamin C 1000 mg Tablets', '90 ea', 19.99, 'Walgreens', 'Nature Made');
addProduct('Nature Made Extra Strength Vitamin C Gummies 500 mg', '60 ea', 16.99, 'Walgreens', 'Nature Made');

// Row 3
addProduct('Nature Made Collagen Gummies Lemon', '60 ea', 18.99, 'Walgreens', 'Nature Made');
addProduct('Centrum Women 50+, Multivitamin & Multimineral Gummies Assorted Fruit', '80 ea', 14.99, 'Walgreens', 'Centrum');
addProduct('Walgreens Ashwagandha Root 920 mg Capsules', '100 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Nature Made Fish Oil Minis 1400 mg Softgels', '60 ea', 27.99, 'Walgreens', 'Nature Made');
addProduct('Walgreens Chewable Vitamin C 500 mg Tablets (100 days) Natural Orange', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Natures Bounty Optimal Solutions Advanced, Skin and Nails Vitamins With Biotin, Gummies Strawberry', '140 ea', 21.99, 'Walgreens', 'Natures Bounty');

// Row 4
addProduct('Metamucil Daily Fiber Supplement, Psyllium Husk Powder Unflavored', '28.1 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('Liquid I.V. Electrolyte Drink Mix Strawberry, 6ct', '0.56 oz x 6 pack', 12.99, 'Walgreens', 'Liquid I.V.');
addProduct('Natures Bounty Acidophilus Probiotic Tablets', '120 ea', 14.99, 'Walgreens', 'Natures Bounty');
addProduct('Walgreens B-Complex with Vitamin C Tablets (100 days)', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Tea Tree Oil', '1 fl oz', 12.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Liquid Melatonin 1 mg Natural Berry', '1 fl oz', 9.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Nature Made Iron Gummies Raspberry', '60 ea', 21.99, 'Walgreens', 'Nature Made');
addProduct('Move Free Advanced Coated Tablets', '80 ea', 24.99, 'Walgreens', 'Move Free');
addProduct('Metamucil Psyllium Husk Powder Fiber Supplement No Flavor', '23.3 oz', 27.99, 'Walgreens', 'Metamucil');
addProduct('AZO Urinary Tract Defense Antibacterial Protection Tablets', '24 ea', 18.99, 'Walgreens', 'AZO');
addProduct('NeoCell Powder Type 1 & 3 Super Unflavored Collagen Unflavored', '7 oz', 19.99, 'Walgreens', 'NeoCell');
addProduct('Vitron-C High Potency Iron Supplement with Vitamin C', '60 ea', 21.99, 'Walgreens', 'Vitron-C');

// Row 6
addProduct('Irwin Naturals Maca Root Liquid Soft-Gels', '75 ea', 14.99, 'Walgreens', 'Irwin Naturals');
addProduct('Benefiber On the Go Prebiotic Fiber Supplement Powder Unflavored', '0.14 oz x 28 pack', 19.99, 'Walgreens', 'Benefiber');
addProduct('Culturelle Daily Probiotic Capsules For Men & Women', '50 ea', 41.99, 'Walgreens', 'Culturelle');
addProduct('Irwin Naturals Steel-Libido RED max-Blood Flow, Softgels', '75 ea', 19.49, 'Walgreens', 'Irwin Naturals');
addProduct('Hydroxycut Hardcore Weight Loss Rapid Release Capsules Wildberry', '60 ea', 31.99, 'Walgreens', 'Hydroxycut');
addProduct('Nature Made Magnesium Oxide', '200 ea', 14.99, 'Walgreens', 'Nature Made');

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
console.log('🎉 Batch 14 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

