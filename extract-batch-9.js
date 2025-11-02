const fs = require('fs');

console.log('🚀 Extracting Batch 9 (Pain Relief, Hemorrhoidal Care, UTI, Heating Pads)...');
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
// IMAGE 1: 36 Products (Icy Hot, AZO, Nervive, Aspercreme, etc.)
// ============================================================================
console.log('📸 Extracting Image 1 (36 products)...');

// Row 1
addProduct('Walgreens Headache Relief Geltabs', '80 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Icy Hot Original Pain Relief Cream for Muscles & Joints', '1.25 oz', 5.99, 'Walgreens', 'Icy Hot');
addProduct('AZO Dual Protection Urinary + Vaginal Support Capsules', '30 ea', 32.99, 'Walgreens', 'AZO');
addProduct('Nervive Nerve Relief, Alpha Lipoic Acid, Vitamin B12, B6, B1 Ginger', '30 ea', 23.99, 'Walgreens', 'Nervive');
addProduct('Aspercreme Lidocaine Roll-On Rosemary Mint', '2.5 fl oz', 13.99, 'Walgreens', 'Aspercreme');
addProduct('Icy Hot PRO Dry Spray With Menthol & Camphor', '4 oz', 17.99, 'Walgreens', 'Icy Hot');

// Row 2
addProduct('Walgreens Free & Pure Ibuprofen Dye-Free Mini 200 mg Softgels', '120 ea', 15.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Pamprin Menstrual Period Symptoms Relief Caplets', '24 ea', 7.99, 'Walgreens', 'Pamprin');
addProduct('Theraworx Relief for Joint Pain & Inflammation Foam', '7.1 fl oz', 19.99, 'Walgreens', 'Theraworx');
addProduct('Ensure Original Nutrition Shake Vanilla', '8 fl oz x 16 pack', 29.99, 'Walgreens', 'Ensure Original');
addProduct('Walgreens Instant Toothache & Gum Relief Cream', '0.33 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Aspirin 81 Tablets', '200 ea', 10.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Aleve Pain Reliever & Fever Reducer Naproxen Sodium Caplets', '200 Ea', 24.99, 'Walgreens', 'Aleve');
addProduct('Dr. Browns Infant GripeBelt', '1 ea', 19.99, 'Walgreens', 'Dr. Browns');
addProduct('Walgreens Homeopathic Soothing Nerve Spray Citrus', '7.1 fl oz', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Homeopathic Soothing Nerve Foam Citrus', '7.1 fl oz', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Comfort Slippers, Beige', '1 pr', 21.99, 'Walgreens', 'Walgreens');
addProduct('Preparation H Rapid Relief Hemorrhoidal Spray', '3.8 oz', 21.99, 'Walgreens', 'Preparation H');

// Row 4
addProduct('Childrens Motrin Ibuprofen Liquid Medicine Bubble Gum', '4 fl oz', 10.99, 'Walgreens', 'Childrens Motrin');
addProduct('FridaBaby Windi Gas and Colic Reliever For Babies', '10 ea', 17.99, 'Walgreens', 'FridaBaby');
addProduct('AleveX Pain Relieving Spray', '3.2 oz', 16.99, 'Walgreens', 'AleveX');
addProduct('Walgreens Homeopathic Muscle Cramps Spray Green Tea & Orange Peel Extract', '7.1 fl oz', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Extra Strength Headache Relief Geltabs', '20 ea', 4.99, 'Walgreens', 'Walgreens');
addProduct('Preparation H Hemorrhoid Wipes with Witch Hazel', '48 ea x 2 pack', 14.99, 'Walgreens', 'Preparation H');

// Row 5
addProduct('Preparation H Hemorrhoid Womens Wipes', '48 ea', 8.79, 'Walgreens', 'Preparation H');
addProduct('De La Cruz Maximum Strength Pain Relieving Ointment with 11% Camphor', '2.5 oz', 7.79, 'Walgreens', 'De La Cruz');
addProduct('Preparation H Hemorrhoid Wipes with Lidocaine', '20 ea', 21.99, 'Walgreens', 'Preparation H');
addProduct('Walgreens Headache Relief', '120 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Bayer 500 mg, Pain Reliever and Fever Reducer', '100 ea', 12.99, 'Walgreens', 'Bayer');
addProduct('KT Tape Original Pre-Cut Black Strips, Black', '20 ea', 12.99, 'Walgreens', 'KT Tape');

// Row 6
addProduct('ThermaCare Heatwraps Lower Back & Hips L/XL', '8 ea', 36.99, 'Walgreens', 'ThermaCare');
addProduct('Walgreens Lidocaine Patch Extra Small, 2.4 x 1 Inches', '20 ea', 11.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoidal Pain Relief Cream Maximum Strength With Aloe & Vitamin E', '1.8 oz', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Headache Relief Extra Strength', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('Aleve Toothache Pain Relief, Naproxen Sodium 220mg, NSAID Tablets', '24 ea', 8.49, 'Walgreens', 'Aleve');
addProduct('Walgreens Ibuprofen Pain Reliever 200mg', '15 ea', 2.00, 'Walgreens', 'Walgreens');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 36 Products (Dragon, Popmask, Trakk, Emuaid, etc.)
// ============================================================================
console.log('📸 Extracting Image 2 (36 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Dragon With Arnica Pain Relief Gel', '2 oz', 7.99, 'Walgreens', 'Dragon');
addProduct('Popmask Big Hug Heated Patch', '5 ea', 13.49, 'Walgreens', 'Popmask');
addProduct('Trakk Hot & Cold Migraine Relief Cap', '1 ea', 14.99, 'Walgreens', 'Trakk');
addProduct('Emuaid Pain Relieving Cream', '4 oz', 49.99, 'Walgreens', 'Emuaid');
addProduct('Canker-X Mouth Sore Spray', '0.51 fl oz', 12.99, 'Walgreens', 'Canker-X');
addProduct('Walgreens Pain Reliever Caplets', '1 ea', 2.49, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Jaloma Arnica Gel', '4 fl oz', 6.49, 'Walgreens', 'Jaloma');
addProduct('Trakk Hot & Cold Stomach & Back Sleeve', '1 ea', 19.99, 'Walgreens', 'Trakk');
addProduct('Epsom-It Soothing Nerve Lotion Rollerball Fragrance-Free', '3 fl oz', 19.99, 'Walgreens', 'Epsom-it');
addProduct('Walgreens Heated Unicorn Cramp Companion', '1 ea', 15.99, 'Walgreens', 'Walgreens');
addProduct('Popmask Big Hug Period Support Patches Strawberry Shortcake', '10 ea', 9.99, 'Walgreens', 'Popmask');
addProduct('Walgreens Ibuprofen 200 mg Tablets', '100 ea', 9.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Epsom-It Soothing Nerve Lotion Tube', '3.5 fl oz', 19.99, 'Walgreens', 'Epsom-It');
addProduct('Winx UTI Daily Protection Daily Supplement', '60 ea', 29.99, 'Walgreens', 'Winx');
addProduct('Advil Liqui Gels Pain Reliever Minis', '80 ea', 21.49, 'Walgreens', 'Advil');
addProduct('TYLENOL Extra Strength Caplets With 500 mg Acetaminophen', '50 ea', 8.99, 'Walgreens', 'TYLENOL');
addProduct('Bayer Rapid Relief Powder Packs With Aspirin & Caffeine Raspberry', '20 ea', 10.99, 'Walgreens', 'Bayer');
addProduct('Bayer Rapid Relief Powder Packs with Aspirin & Caffeine Raspberry', '10 ea', 5.99, 'Walgreens', 'Bayer');

// Row 4
addProduct('Childrens Motrin Ibuprofen Medicine Berry', '8 fl oz', 14.99, 'Walgreens', 'Childrens Motrin');
addProduct('Motrin IB Liquid Gels, Ibuprofen 200mg', '20 ea', 5.99, 'Walgreens', 'Motrin');
addProduct('Aleve Pain Reliever, Fever Reducer, Naproxen Sodium Tablets', '200 ea', 24.99, 'Walgreens', 'Aleve');
addProduct('Icy Hot Pro Pain Relief Massaging Balm', '1.25 oz', 17.99, 'Walgreens', 'Icy Hot');
addProduct('Motrin Dual Action with Tylenol', '120 ea', 18.99, 'Walgreens', 'Motrin');
addProduct('Motrin Dual Action', '80 ea', 15.99, 'Walgreens', 'Motrin');

// Row 5
addProduct('Mommys Bliss Infant Pain + Fever Relief Liquid Natural Berry', '2 fl oz', 9.99, 'Walgreens', 'Mommys Bliss');
addProduct('Sunbeam Advanced Heat Heating Pad King', '1 ea', 84.99, 'Walgreens', 'Sunbeam');
addProduct('Absorbine Jr. Pro No Mess Roll On', '2.5 oz', 15.99, 'Walgreens', 'Absorbine Jr.');
addProduct('Bayer Aspirina 500mg Medicine, Headache Relief, Caplets', '50 ea', 8.99, 'Walgreens', 'Bayer');
addProduct('Orajel Medicated For Toothache & Gum Liquid', '0.45 fl oz', 11.49, 'Walgreens', 'Orajel');
addProduct('Sanar Naturals Arnica Roll On For Muscle Pain Relief', '3 oz', 7.49, 'Walgreens', 'Sanar Naturals');

// Row 6
addProduct('Biofreeze Pain Relief Gel Menthol', '3 fl oz', 11.99, 'Walgreens', 'Biofreeze');
addProduct('Tucks Triple Relief Hemorrhoidal Cream', '0.9 oz', 9.99, 'Walgreens', 'Tucks');
addProduct('Aspercreme Lidocaine Cream Eucalyptus', '3 oz', 12.99, 'Walgreens', 'Aspercreme');
addProduct('Vicks PainQuil Pain Relief, Max Strength Adult Pain Reliever Liquid Black Cherry', '12 fl oz', 12.99, 'Walgreens', 'Vicks PainQuil');
addProduct('Nervive Pain Relieving Large Roll On, Max Strength Menthol', '4.6 oz', 24.99, 'Walgreens', 'Nervive');
addProduct('Vicks PainQuil Max Strength Adult Pain Reliever Liquid Midnight Cherry', '12 fl oz', 12.99, 'Walgreens', 'Vicks PainQuil');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 36 Products (ZzzQuil, Vicks, Hyland's, Sunbeam, etc.)
// ============================================================================
console.log('📸 Extracting Image 3 (36 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Bayer Aspirina Cafeina, Pain Medicine for Adults, Caplets', '24 ea', 5.99, 'Walgreens', 'Bayer');
addProduct('ZzzQuil Liquid Max Strength Pain Reliever, Nighttime Sleep Aid Liquid Black Cherry', '12 fl oz x 2 pack', 17.99, 'Walgreens', 'ZzzQuil');
addProduct('ZzzQuil Liquid Pain Reliever, Sleep Aid Black Cherry', '12 fl oz', 9.99, 'Walgreens', 'ZzzQuil');
addProduct('Hylands Naturals Baby Organic Soothing Gel Nighttime', '.53 oz', 6.99, 'Walgreens', 'Hylands Naturals');
addProduct('Hylands Naturals Baby Organic Soothing Gel Daytime', '.53 oz', 6.99, 'Walgreens', 'Hylands Naturals');
addProduct('Sunbeam Heating Pad Standard, Gray', '1 ea', 34.99, 'Walgreens', 'Sunbeam');

// Row 2
addProduct('Vicks VapoFreeze Topical Spray, Maximum Strength Menthol+for Muscle Pain Relief Vicks Vapors', '3 oz', 17.99, 'Walgreens', 'Vicks VapoFreeze');
addProduct('Vicks VapoFreeze Topical Pain Cream Maximum Strength for Muscle Pain Relief Menthol', '3 oz', 17.99, 'Walgreens', 'Vicks VapoFreeze');
addProduct('Vicks VapoCool Severe Intense Pain Relief Max Strength Drops Icy Mint', '30 ea', 7.99, 'Walgreens', 'Vicks VapoCool Severe');
addProduct('Kanka Max Strength Triple Action Gel', '0.42 oz', 8.99, 'Walgreens', 'Kanka');
addProduct('Dr. Teals Pure Epsom Salt Restorative Minerals Soaking Solution', '3 lb', 5.99, 'Walgreens', 'Dr. Teals');
addProduct('Walgreens Overnight Cold Therapy Pain Relief Gel Lavender', '3 fl oz', 12.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Salonpas Arthritis Pain Patch', '20 ea', 22.99, 'Walgreens', 'Salonpas');
addProduct('Walgreens Extra Strength Pain Relief Tablets, Acetaminophen 500 mg', '100 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Acetaminophen Extended-Release Tablets USP 650 mg', '100 ea', 11.99, 'Walgreens', 'Walgreens');
addProduct('MagniLife Nerve Relief Roll-On', '3 oz', 14.99, 'Walgreens', 'MagniLife');
addProduct('Epsom-It Soothing Nerve Lotion Bottle Fragrance-Free', '8 fl oz', 24.99, 'Walgreens', 'Epsom-It');
addProduct('Walgreens Ibuprofen PM Softgels', '40 ea', 8.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Vicks PainQuil Pain Relief Acetaminophen, Max Strength Adult Pain Reliever Liquid Midnight & Black Cherry', '12 fl oz x 2 pack', 19.99, 'Walgreens', 'Vicks PainQuil');
addProduct('Flanax Pain Relief Liniment (Actual Item May Vary)', '2.3 oz', 5.99, 'Walgreens', 'Flanax');
addProduct('Nartex Arnica Cream', '2.6 oz', 6.99, 'Walgreens', 'Nartex');
addProduct('Walgreens Childrens Pain Reliever Dye Free Bubble Gum', '4 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Winx UTI Fast-Acting Pain Relief Tablets', '24 ea', 11.99, 'Walgreens', 'Winx');
addProduct('Advil Targeted Relief Cream', '2.3 oz', 12.99, 'Walgreens', 'Advil');

// Row 5
addProduct('Advil Targeted Relief Cream', '2.5 oz', 13.99, 'Walgreens', 'Advil');
addProduct('Advil Targeted Relief Cream', '4 oz', 18.99, 'Walgreens', 'Advil');
addProduct('Emuaid First Aid Ointment Maximum Strength', '2 fl oz', 69.99, 'Walgreens', 'Emuaid');
addProduct('Arnicare Homeopathic Arthritis Cream', '2.5 oz', 9.99, 'Walgreens', 'Arnicare');
addProduct('Absorbine Jr. Pro Cream', '3 oz', 15.99, 'Walgreens', 'Absorbine Jr.');
addProduct('Good Patch Cycle Wearable Wellness Patches', '4 ea', 13.99, 'Walgreens', 'Good Patch');

// Row 6
addProduct('Sunbeam ConformHeat Heating Pad', '1 ea', 54.99, 'Walgreens', 'Sunbeam');
addProduct('KT Tape Recover Cooling Magnesium Cream', '4 oz', 18.99, 'Walgreens', 'KT Tape');
addProduct('Walgreens Cool And Heat Lidocaine Roll On', '2.5 oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Penetrex Joint & Muscle Therapy Cream for Relief & Recovery', '2 fl oz', 21.99, 'Walgreens', 'Penetrex');
addProduct('Walgreens Lidocaine Pain Relief Cream', '3 oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cool N Heat Spray', '4 oz', 8.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 36 Products (Hemorrhoidal Care, Lidocaine, UTI, Heating)
// ============================================================================
console.log('📸 Extracting Image 4 (36 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('Walgreens Hemorrhoidal Pain Relief Cream with Lidocaine', '1 oz', 24.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Lidocaine Patch Back 6.7 x 5.1 Inches', '6 ea', 19.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Pain Reliever Extra Strength', '15 ea', 2.00, 'Walgreens', 'Walgreens');
addProduct('Herpecin-L Pain Relief Triple Action Lidocaine', '0.15 oz', 12.99, 'Walgreens', 'Herpecin-L');
addProduct('Walgreens Infants Pain & Fever Dye Free', '2 fl oz', 10.99, 'Walgreens', 'Walgreens');
addProduct('Rael Heating Patches For Menstrual Cramps', '3 ea', 8.49, 'Walgreens', 'Rael');

// Row 2
addProduct('Theraworx Nerve Relief Foam', '7.1 fl oz', 19.99, 'Walgreens', 'Theraworx');
addProduct('Trakk Heating Neck Relaxer', '1 ea', 14.99, 'Walgreens', 'Trakk');
addProduct('Walgreens Pain Reliever PM', '15 ea', 3.00, 'Walgreens', 'Walgreens');
addProduct('Trakk Hot & Cold Massage Gun', '1 ea', 39.99, 'Walgreens', 'Trakk');
addProduct('Walgreens Flexible Heat Band', '1 ea', 29.99, 'Walgreens', 'Walgreens');
addProduct('Dentemp Canker Cover Oral Pain Reliever Cool Mint', '6 ea', 14.99, 'Walgreens', 'Dentemp');

// Row 3
addProduct('Walgreens Aspirin 81 Tablets', '15 ea', 2.00, 'Walgreens', 'Walgreens');
addProduct('Walgreens Hemorrhoid Spray Lidocaine', '3 oz', 18.99, 'Walgreens', 'Walgreens');
addProduct('Trakk Hot & Cold Neck and Shoulder Wrap', '1 ea', 14.99, 'Walgreens', 'Trakk');
addProduct('Midol Bloat Relief Caplets', '30 ea', 11.49, 'Walgreens', 'Midol');
addProduct('Walgreens Air Compression Foot & Calf Massagers', '2 ea', 70.99, 'Walgreens', 'Walgreens');
addProduct('Pamprin Heat Relief Menstrual Patches', '3 ea', 9.99, 'Walgreens', 'Pamprin');

// Row 4
addProduct('Winx UTI Test + Treat', '3 ea', 12.99, 'Walgreens', 'Winx');
addProduct('Walgreens Heat Pain Relief + Skin Moisturizing Cream', '3 oz', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Cooling Pain Relief + Skin Moisturizing Cream', '3 oz', 16.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Free & Pure Cold Therapy Pain Relief Gel Pump', '8 fl oz', 22.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('X Ray Dol Topical Arthritis Pain Reliever Cream', '2 oz', 9.99, 'Walgreens', 'X Ray Dol');
addProduct('Walgreens Acetaminophen 160 mg', '2 fl oz', 10.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('DentiCalm Massaging Roll-On Pain Relief Serum for Jaw Clenching & Teeth Grinding', '0.47 fl oz', 18.99, 'Walgreens', 'DentiCalm');
addProduct('DentiCalm Extra Strength Roll-On Pain Reliever for TMJ and Jaw Pain', '0.47 fl oz', 18.99, 'Walgreens', 'DentiCalm');
addProduct('Nartex Arnica Montana Nartex Roll-On Gel', '3.17 oz', 5.99, 'Walgreens', 'Nartex');
addProduct('Nartex Hemorrhoidex Gel', '2.29 oz', 7.99, 'Walgreens', 'Nartex');
addProduct('Childrens TYLENOL Pain + Fever Medicine, Dye-Free Cherry', '4 fl oz', 9.99, 'Walgreens', 'Childrens TYLENOL');
addProduct('Preparation H Flushable Medicated Hemorrhoid Wipes', '10 ea', 4.49, 'Walgreens', 'Preparation H');

// Row 6
addProduct('WellPatch Warming Pain, Migraine, Arthritis Relief Patch', '1 ea', 1.25, 'Walgreens', 'WellPatch');
addProduct('ThermaCare Lower Back & Hip Pain Therapy Heatwraps L/XL', '2 ea', 7.99, 'Walgreens', 'ThermaCare');
addProduct('Percogesic Pain Reliever/Fever Reducer Tablets (Actual Item May Vary)', '90 ea', 11.49, 'Walgreens', 'Percogesic');
addProduct('Mentholatum Original Vapor Chest Rub Topical Ointment For Adults & Kids', '3 oz', 7.99, 'Walgreens', 'Mentholatum');
addProduct('Salonpas Deep Relieving Gel', '2.75 oz', 10.99, 'Walgreens', 'Salonpas');
addProduct('Backaid Aspirin Free Analgesic/Diuretic Caplets', '38 ea', 9.79, 'Walgreens', 'Backaid');

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
console.log('🎉 Batch 9 Complete!');
console.log(`📊 Grand Total: ${existingData.length} products in database`);

