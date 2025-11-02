const fs = require('fs');

console.log('🚀 Starting comprehensive bulk extraction of FIRST BATCH...');
console.log('📦 Extracting ALL products (all brands) from Walgreens images');
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
// IMAGE 1: 48 Products (Allergy, Cold, Flu, Sinus Relief)
// ============================================================================
console.log('📸 Extracting Image 1 (48 products)...');

// Row 1
addProduct('Walgreens Neti Pot Kit', '1 set', 14.99, 'Walgreens', 'Walgreens');
addProduct('Primatene Mist Epinephrine Inhalation Aerosol', '160 Metered Sprays - 1 ea', 32.99, 'Walgreens', 'Primatene');
addProduct('Walgreens 4 Hour Allergy Relief Tablets', '50 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Premium Saline Nasal Moisturizing Spray', '3 fl oz', 6.99, 'Walgreens', 'Walgreens');
addProduct('Benadryl Liqui-Gels Antihistamine Allergy Relief Medicine', '24 ea', 6.99, 'Walgreens', 'Benadryl');
addProduct('Benadryl Ultratabs Allergy Relief Medicine 25 mg Diphenhydramine HCl', '24 ea', 6.99, 'Walgreens', 'Benadryl');

// Row 2
addProduct('Walgreens Allergy Relief Diphenhydramine Coated Mini Tabs', '24 ea', 4.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Sinus PE Allergy Maximum Strength Tablets', '24 ea', 7.79, 'Walgreens', 'Walgreens');
addProduct('Sudafed PE Day + Night Maximum Strength Sinus Decongestant', '20 ea', 10.99, 'Walgreens', 'Sudafed');
addProduct('Vicks Sinex Moisturizing Ultra Fine Nasal Mist Over-the-Counter Medicine Aloe', '0.5 fl oz', 9.99, 'Walgreens', 'Vicks Sinex');
addProduct('NeilMed Nasa Mist All In One Saline Spray', '6 fl oz', 12.99, 'Walgreens', 'NeilMed');
addProduct('TYLENOL Sinus Severe Non-Drowsy Day Cold & Flu Relief Caplets', '24 ea', 11.99, 'Walgreens', 'TYLENOL');

// Row 3
addProduct('Walgreens Daytime Severe Sinus Caplets Cool Blast', '24 ea', 8.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens Anefrin Nasal Spray', '1 fl oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Advil Sinus Congestion & Pain Coated Tablets', '10 ea', 8.29, 'Walgreens', 'Advil');
addProduct('Zarbees Soothing Saline Nasal Mist With Aloe For All Ages Fragrance-Free', '3 FL OZ', 9.79, 'Walgreens', 'Zarbees');
addProduct('Afrin 12 Hour Nasal Decongestant Pump Mist Original', '0.5 fl oz', 11.99, 'Walgreens', 'Afrin');
addProduct('Walgreens 24 Hour Childrens Allergy Relief Cetirizine Oral Solution Grape', '8 fl oz', 13.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens Saline Nasal Moisturizing Spray', '1.5 fl oz', 4.29, 'Walgreens', 'Walgreens');
addProduct('Flonase Allergy Relief Nasal Spray', '0.38 fl oz', 19.99, 'Walgreens', 'Flonase');
addProduct('Navage Saltpod Original', '60 ea', 19.99, 'Walgreens', 'Navage');
addProduct('PATADAY Eye Itch Relief', '5 mL', 19.99, 'Walgreens', 'PATADAY');
addProduct('Flonase Sensimist Allergy Relief Nasal Spray 120 Sprays', '0.31 fl oz', 31.99, 'Walgreens', 'Flonase');
addProduct('Ayr Saline Nasal Gel', '0.5 oz', 5.99, 'Walgreens', 'Ayr');

// Row 5
addProduct('Flonase Allergy Relief Nasal Spray Scent Free 60 Sprays', '0.2 fl oz', 19.99, 'Walgreens', 'Flonase');
addProduct('Benadryl Allergy Plus Congestion Ultratabs', '24 ea', 10.99, 'Walgreens', 'Benadryl');
addProduct('Walgreens Saline Packets', '0.1 oz x 100 pack', 12.49, 'Walgreens', 'Walgreens');
addProduct('Walgreens 24 Hour Allergy Relief Levocetirizine Tablets', '35 ea', 18.99, 'Walgreens', 'Walgreens');
addProduct('Benzedrex Inhaler Nasal Decongestant', '1 ea', 6.99, 'Walgreens', 'Benzedrex');
addProduct('Childrens Benadryl Dye-Free Allergy Liquid Bubble Gum', '4 fl oz', 8.99, 'Walgreens', 'Childrens Benadryl');

// Row 6
addProduct('Afrin Severe Congestion Nasal Spray', '0.5 fl oz', 8.99, 'Walgreens', 'Afrin');
addProduct('Sudafed PE Non-Drowsy Head Congestion + Pain Relief Caplets', '20 ea', 10.99, 'Walgreens', 'Sudafed');
addProduct('NeilMed NasaMist Extra Strength Saline Spray', '4.2 oz', 8.49, 'Walgreens', 'NeilMed');
addProduct('Afrin Original Maximum Strength Nasal Spray', '1 fl oz', 14.99, 'Walgreens', 'Afrin');
addProduct('Vicks Sinex Ultra Fine Nasal Mist Over-the-Counter Medicine', '0.5 oz', 9.99, 'Walgreens', 'Vicks Sinex');
addProduct('Ayr Saline Nasal Mist', '1.69 fl oz', 5.99, 'Walgreens', 'Ayr');

// Row 7
addProduct('Walgreens Nasal Saline Mist', '4.5 oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Afrin No Drip Severe Congestion Nasal Spray Relief', '0.5 fl oz', 11.99, 'Walgreens', 'Afrin');
addProduct('Walgreens Childrens Allergy Relief Diphenhydramine Dye-Free Liquid Bubble Gum', '4 oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Opcon-A Itching & Redness Reliever Eye Drops', '0.5 fl oz', 8.79, 'Walgreens', 'Opcon-A');
addProduct('NeilMed NasoGEL Drip Free Gel Spray', '1 oz', 9.99, 'Walgreens', 'NeilMed');
addProduct('Allegra Adult 24 Hour Allergy Tablets Non-Drowsy Antihistamine', '30 ea', 21.99, 'Walgreens', 'Allegra');

// Row 8
addProduct('Walgreens 24 Hour Allergy Relief Cetirizine Softgels', '40 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Xlear Natural Saline Nasal Spray with Xylitol', '1.5 fl oz', 12.99, 'Walgreens', 'Xlear');
addProduct('Walgreens 24 Hour Allergy Nasal Spray', '0.57 fl oz', 16.99, 'Walgreens', 'Walgreens');
addProduct('Allegra Childrens 12 Hour Allergy Relief Liquid Non-Drowsy Berry', '8 fl oz', 21.99, 'Walgreens', 'Allegra');
addProduct('Zicam Intense Sinus Relief No-Drip Relief Nasal Spray', '0.5 oz', 13.49, 'Walgreens', 'Zicam');

console.log(`✅ Image 1 complete: ${allProducts.length} products extracted`);

// ============================================================================
// IMAGE 2: 30 Products (Allergy, Cold, Flu, Sinus Relief)
// ============================================================================
console.log('📸 Extracting Image 2 (30 products)...');
const img2Start = allProducts.length;

// Row 1
addProduct('Afrin No Drip Extra Moisturizing Nasal Pump Mist', '0.5 fl oz', 11.99, 'Walgreens', 'Afrin');
addProduct('Claritin Childrens 24 Hour Allergy Relief Syrup Grape', '4 fl oz', 14.99, 'Walgreens', 'Claritin');
addProduct('TYLENOL Cold + Flu Cough Night Liquid Medicine Wild Berry Burst', '8 fl oz', 9.79, 'Walgreens', 'TYLENOL');
addProduct('Walgreens Daytime & Nighttime Sinus PE Congestion Tablets', '20 ea', 8.49, 'Walgreens', 'Walgreens');
addProduct('Zicam Cold Remedy Nasal Spray', '0.5 fl oz', 13.49, 'Walgreens', 'Zicam');
addProduct('Walgreens Non-Medicated Vapor Inhaler', '0.01 oz', 8.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Arm & Hammer Simply Saline Nasal Care Daily Mist', '4.5 oz', 10.99, 'Walgreens', 'Arm & Hammer');
addProduct('Claritin Liqui-Gels 24 Hour Non-Drowsy Allergy Relief', '30 ea', 24.99, 'Walgreens', 'Claritin');
addProduct('Walgreens 24 Hour Allergy Relief Cetirizine Tablets', '30 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens 24 Hour Allergy Relief Fluticasone Nasal Spray', '1.24 fl oz x 2 pack', 41.99, 'Walgreens', 'Walgreens');
addProduct('Childrens Zyrtec 24 Hour Allergy Relief Syrup Grape', '4 fl oz', 17.99, 'Walgreens', 'Childrens Zyrtec');
addProduct('Flonase Allergy Relief Nasal Spray', '0.62 fl oz', 31.99, 'Walgreens', 'Flonase');

// Row 3
addProduct('Boogie Mist Saline Mist Fresh', '3.1 oz', 6.99, 'Walgreens', 'Boogie Mist');
addProduct('Childrens Zyrtec Allergy Relief Syrup Bubble Gum', '4 fl oz', 17.99, 'Walgreens', 'Childrens Zyrtec');
addProduct('Claritin 24 Hour Non-Drowsy Allergy Relief', '100 ea', 51.99, 'Walgreens', 'Claritin');
addProduct('Walgreens 24 Hour Allergy Relief Fexofenadine Tablets', '30 ea', 17.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Saline Spray + Drops', '2 fl oz', 4.99, 'Walgreens', 'Walgreens');
addProduct('Mucinex Severe Nasal Congestion Relief Clear & Cool Nasal Spray Nasal Decongestant Menthol', '0.75 oz', 12.99, 'Walgreens', 'Mucinex');

// Row 4
addProduct('Breathe Right Extra Strength Nasal Strips Tan', '26 ea', 11.99, 'Walgreens', 'Breathe Right');
addProduct('PATADAY Eye Itch Relief', '0.08 oz', 22.99, 'Walgreens', 'PATADAY');
addProduct('Zaditor Antihistamine Eye Drops', '0.17 fl oz', 16.99, 'Walgreens', 'Zaditor');
addProduct('Walgreens Allergy Relief Diphenhydramine Capsules', '24 ea', 4.99, 'Walgreens', 'Walgreens');
addProduct('Nasacort 24 Hour Multi-Symptom Nasal Allergy Spray 120 Sprays', '0.57 fl oz', 21.99, 'Walgreens', 'Nasacort');
addProduct('Claritin RediTabs 24 HR Non-Drowsy Allergy Relief', '30 ea', 23.99, 'Walgreens', 'Claritin');

// Row 5
addProduct('Walgreens Eye Itch Relief Drops', '0.17 oz', 11.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 2 complete: ${allProducts.length - img2Start} products extracted`);

// ============================================================================
// IMAGE 3: 42 Products (Allergy, Cold, Flu, Eye Care)
// ============================================================================
console.log('📸 Extracting Image 3 (42 products)...');
const img3Start = allProducts.length;

// Row 1
addProduct('Walgreens Vapor Inhaler', '3 ea', 12.99, 'Walgreens', 'Walgreens');
addProduct('Abreva Docosanol 10% Cold Sore Treatment', '0.07 oz x 2 pack', 44.99, 'Walgreens', 'Abreva');
addProduct('Naphcon-A Allergy Relief Eye Drops', '0.5 fl oz', 14.49, 'Walgreens', 'Naphcon-A');
addProduct('Zyrtec 24 Hour Allergy Relief Tablets Antihistamine Cetirizine HCl', '5 ea', 6.99, 'Walgreens', 'Zyrtec');
addProduct('Allegra Adult 24 Hour Allergy Gelcaps Non-Drowsy Antihistamine', '24 ea', 21.99, 'Walgreens', 'Allegra');
addProduct('Zyrtec Allergy Dissolve Tablets Citrus', '24 ea', 20.99, 'Walgreens', 'Zyrtec');

// Row 2
addProduct('Walgreens Smart-Flex Nasal Strips Small/Medium Clear', '30 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Claritin RediTabs 12 HR Non-Drowsy Allergy Relief', '30 ea', 26.99, 'Walgreens', 'Claritin');
addProduct('Walgreens Saline Nasal Spray with Aloe', '3 fl oz', 7.49, 'Walgreens', 'Walgreens');
addProduct('Childrens Zyrtec 24 Hour Allergy Relief Dissolve Tablets Citrus', '12 ea', 17.99, 'Walgreens', 'Childrens Zyrtec');
addProduct('XYZAL Childrens 24 Hour Allergy Medicine Bubble Gum', '5 fl oz', 14.99, 'Walgreens', 'XYZAL');
addProduct('Walgreens 24 Hour Allergy Relief Loratadine Capsules', '30 ea', 17.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Flonase Sensimist Allergy Relief Nasal Spray', '0.31 fl oz x 2 pack', 47.99, 'Walgreens', 'Flonase');
addProduct('Walgreens Childrens Allergy Relief Diphenhydramine Liquid Cherry', '4 fl oz', 7.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Allergy Relief Diphenhydramine Coated Mini Tabs', '48 ea', 8.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Severe Sinus Relief Mist', '0.5 fl oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Allegra Adult 24 Hour Allergy Gelcaps Non-Drowsy Antihistamine', '60 ea', 36.99, 'Walgreens', 'Allegra');
addProduct('Walgreens Dye-Free Allergy Relief Diphenhydramine Mini Tabs', '100 ea', 14.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Flonase Allergy Relief Nasal Spray', '0.62 fl oz x 2 pack', 49.99, 'Walgreens', 'Flonase');
addProduct('Walgreens Anefrin Nasal Spray', '0.5 fl oz', 8.49, 'Walgreens', 'Walgreens');
addProduct('Benadryl Ultratabs Antihistamine Cold & Allergy Relief Tablets', '100 ea', 18.99, 'Walgreens', 'Benadryl');
addProduct('Benadryl Ultratabs Antihistamine Allergy Relief Medicine 25 mg Diphenhydramine HCl', '48 ea', 11.99, 'Walgreens', 'Benadryl');
addProduct('Walgreens 24 Hour Childrens Allergy Relief Cetirizine Oral Solution Bubble Gum', '8 fl oz', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Nasal Strips Extra Strength One Size Tan', '26 ea', 8.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Allegra Adult 12 Hour Allergy Tablets Non-Drowsy Antihistamine', '24 ea', 14.99, 'Walgreens', 'Allegra');
addProduct('Nasacort 24 Hour Allergy Spray 240 Sprays', '0.57 fl oz x 2 pack', 29.99, 'Walgreens', 'Nasacort');
addProduct('PATADAY Eye Itch Relief', '0.09 fl oz', 25.99, 'Walgreens', 'PATADAY');
addProduct('Flonase Childrens 24 Hour Allergy Relief Spray Unflavored', '0.38 fl oz', 21.99, 'Walgreens', 'Flonase');
addProduct('Vicks Vapor Pads Family Pack Lavender and Rosemary', '12 ea', 14.49, 'Walgreens', 'Vicks');
addProduct('Claritin Allergy Medicine Loratadine Tablets 10 mg', '30 ea', 24.99, 'Walgreens', 'Claritin');

// Row 6
addProduct('Sudafed Maximum Strength Non-Drowsy Sinus Decongestant', '36 ea', 16.99, 'Walgreens', 'Sudafed');
addProduct('Walgreens 24 Hour Allergy Nasal Spray', '0.37 fl oz', 11.99, 'Walgreens', 'Walgreens');
addProduct('Zaditor Antihistamine Eye Drops', '0.34 fl oz x 2 pack', 29.99, 'Walgreens', 'Zaditor');
addProduct('Walgreens Nasal Saline Mist', '7.5 oz', 13.99, 'Walgreens', 'Walgreens');
addProduct('Breathe Right Original Nasal Strips Large Tan', '30 ea', 11.99, 'Walgreens', 'Breathe Right');
addProduct('Breathe Right Extra Strength for Sensitive Skin Nasal Strips Clear', '26 ea', 11.99, 'Walgreens', 'Breathe Right');

// Row 7
addProduct('Zyrtec 24 Hour Dissolving Allergy Relief Tablets with 10 mg Cetirizine Hydrochloride Citrus', '24 ea', 24.99, 'Walgreens', 'Zyrtec');
addProduct('Walgreens Eye Allergy Relief Drops', '0.5 fl oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Allergy Relief Diphenhydramine Liquid Cherry', '8 fl oz', 8.99, 'Walgreens', 'Walgreens');
addProduct('Allegra Adult 24 Hour Allergy Gelcaps Non-Drowsy Antihistamine', '15 ea', 16.99, 'Walgreens', 'Allegra');
addProduct('Claritin Allergy Medicine Loratadine Tablets', '70 ea', 42.99, 'Walgreens', 'Claritin');
addProduct('Walgreens 24 Hour Allergy Relief Fluticasone Nasal Spray', '2.48 fl oz x 4 pack', 54.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 3 complete: ${allProducts.length - img3Start} products extracted`);

// ============================================================================
// IMAGE 4: 29 Products (Allergy, Cold, Flu)
// ============================================================================
console.log('📸 Extracting Image 4 (29 products)...');
const img4Start = allProducts.length;

// Row 1
addProduct('Claritin Childrens 24 Hour Allergy Relief Syrup Grape', '8 fl oz', 25.99, 'Walgreens', 'Claritin');
addProduct('Opcon-A Eye Allergy Relief Drops', '0.5 fl oz', 14.99, 'Walgreens', 'Opcon-A');
addProduct('Childrens Zyrtec 24 Hour Allergy Syrup with Cetirizine Grape', '8 fl oz', 23.99, 'Walgreens', 'Childrens Zyrtec');
addProduct('Lastacaft Eye Allergy Itch Relief Drops', '0.17 fl oz', 21.99, 'Walgreens', 'Lastacaft');
addProduct('Walgreens Eye Allergy Itch Relief', '0.09 oz x 2 pack', 29.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens 24 Hour Allergy Relief Loratadine Tablets', '365 ea', 54.99, 'Walgreens', 'Walgreens');

// Row 2
addProduct('Walgreens Allergy Relief Diphenhydramine Caplets', '600 ea', 36.99, 'Walgreens', 'Walgreens');
addProduct('PATADAY Eye Itch Relief', '2.5 mL x 2 pack', 35.99, 'Walgreens', 'PATADAY');
addProduct('Claritin Non-Drowsy Indoor & Outdoor Allergy Tablets', '5 ea', 7.99, 'Walgreens', 'Claritin');
addProduct('Allegra Adult 24 Hour Allergy Tablets Non-Drowsy Antihistamine', '45 ea', 29.99, 'Walgreens', 'Allegra');
addProduct('Zyrtec Allergy 24 Hour 10mg Tablets Travel Size', '3 ea', 6.29, 'Walgreens', 'Zyrtec');
addProduct('Walgreens Childrens Allergy Relief Loratadine Dye-Free Liquid Bubble Gum', '4 fl oz', 10.99, 'Walgreens', 'Walgreens');

// Row 3
addProduct('Benadryl Go Packs Antihistamine Allergy Relief Medicine Tablets Cherry Pink', '8 ea', 4.99, 'Walgreens', 'Benadryl');
addProduct('Claritin 24 Hour Non-Drowsy Allergy Medicine Loratadine Tablets', '45 ea', 34.99, 'Walgreens', 'Claritin');
addProduct('Zicam Allergy Relief Homeopathic Nasal Solution Pump', '0.5 fl oz', 17.99, 'Walgreens', 'Zicam');
addProduct('Claritin 24 Hour Non-Drowsy Allergy Relief', '10 ea', 12.99, 'Walgreens', 'Claritin');
addProduct('Zyrtec 24 Hour Allergy Relief Liquid Gels', '40 ea', 35.99, 'Walgreens', 'Zyrtec');
addProduct('Zyrtec 24 Hour Allergy Relief Tablets', '30 ea', 20.99, 'Walgreens', 'Zyrtec');

// Row 4
addProduct('Mute Breathe More Snore Less Trial Sm Med Lg', '1 ea', 17.99, 'Walgreens', 'Mute');
addProduct('Walgreens Eye Allergy Relief Drops', '0.5 fl oz', 9.99, 'Walgreens', 'Walgreens');
addProduct('Zyrtec 24 Hour Allergy Relief Liquid Gels Antihistamine Cetirizine HCI', '25 ea', 20.99, 'Walgreens', 'Zyrtec');
addProduct('Walgreens 24 Hour Childrens Allergy Relief Cetirizine Oral Solution Grape', '4 fl oz', 13.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens 24 Hour Childrens Allergy Relief Cetirizine Oral Solution Bubble Gum', '4 fl oz', 13.99, 'Walgreens', 'Walgreens');

// Row 5
addProduct('Walgreens Childrens Allergy Relief Loratadine Dye-Free Chewable Tablets Grape', '30 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Allergy Relief Fluticasone Propionate Nasal Spray', '0.38 fl oz', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Summer Essentials Kit', '1 set', 6.29, 'Walgreens', 'Walgreens');
addProduct('XYZAL 24 Hour Allergy Relief Medicine Prescription Strength', '80 ea', 39.99, 'Walgreens', 'XYZAL');

console.log(`✅ Image 4 complete: ${allProducts.length - img4Start} products extracted`);

// ============================================================================
// IMAGE 5: 42 Products (Allergy, Cold, Flu, Eye Care, Nasal Care)
// ============================================================================
console.log('📸 Extracting Image 5 (42 products)...');
const img5Start = allProducts.length;

// Row 2
addProduct('Claritin Chewables 24 Hour Children Allergy Medicine Tablets', '30 ea', 29.99, 'Walgreens', 'Claritin');
addProduct('Benadryl Extra Strength Antihistamine Allergy Relief Tablets', '24 ea', 10.99, 'Walgreens', 'Benadryl');
addProduct('Afrin Saline Burst Extra Strength Daily Nasal Mist', '5 oz', 13.99, 'Walgreens', 'Afrin');
addProduct('Benadryl Allergy Relief Liquid Medicine for Adults Wild Cherry', '4 fl oz', 9.99, 'Walgreens', 'Benadryl');
addProduct('Boogie Micro-Mist Saline Inhaler', '1.7 oz', 21.99, 'Walgreens', 'Boogie');
addProduct('Allegra Childrens 12 Hour Allergy Relief Liquid Non-Drowsy', '8 fl oz', 21.99, 'Walgreens', 'Allegra');

// Row 3
addProduct('Benadryl Allergy Relief Liquid Cherry', '4 fl oz', 8.99, 'Walgreens', 'Benadryl');
addProduct('Walgreens 24 Hour Allergy Nasal Spray', '0.57 fl oz', 19.99, 'Walgreens', 'Walgreens');
addProduct('Navage Saltpod with Alkalol', '30 ea', 13.99, 'Walgreens', 'Navage');
addProduct('Childrens Benadryl Allergy Relief Liquid Cherry', '8 fl oz', 12.99, 'Walgreens', 'Childrens Benadryl');
addProduct('Vicks NyQuil Childrens Cold & Cough + Runny Nose Multi-Symptom Medicine Berry', '8 fl oz', 15.99, 'Walgreens', 'Vicks NyQuil');
addProduct('Benadryl Liqui-Gels Antihistamine Allergy Medicine & Cold Symptom Relief Dye-Free', '48 ea', 13.99, 'Walgreens', 'Benadryl');

// Row 4
addProduct('Benadryl Childrens Allergy Plus Congestion Relief Liquid Medicine Sugar-Free Grape', '4 fl oz', 8.99, 'Walgreens', 'Benadryl');
addProduct('Alaway Eye Drops Antihistamine Eye Itch Relief', '0.34 fl oz', 15.99, 'Walgreens', 'Alaway');
addProduct('ZzzQuil Sleep Nasal Strips Snoring Relief from Nasal Congestion Tan', '26 ea', 19.99, 'Walgreens', 'ZzzQuil');
addProduct('ZzzQuil Sleep Nasal Strips Clear Nasal Strips Snoring Relief from Nasal Congestion Clear', '26 ea', 19.99, 'Walgreens', 'ZzzQuil');

// Row 5
addProduct('Vicks Saline Nasal Rinse Starter Kit Drug Free No flavor', '1 set', 18.99, 'Walgreens', 'Vicks');
addProduct('Navage SaltPod Eucalyptus', '30 ea', 13.99, 'Walgreens', 'Navage');
addProduct('Vicks Sinex Saline Easy Mist Drug Free Ages 1 Month+', '1.7 oz', 29.99, 'Walgreens', 'Vicks Sinex');
addProduct('Dr Talbots Infant Daily Allergy Relief', '4 fl oz', 8.99, 'Walgreens', 'Dr Talbots');
addProduct('Walgreens 24 Hour Allergy Relief Fluticasone Nasal Spray', '0.62 fl oz', 22.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Allergy Relief Loratadine Dye-Free Chewable Tablets Grape', '60 ea', 34.99, 'Walgreens', 'Walgreens');

// Row 6
addProduct('Bausch + Lomb Lumify Eye Drops Redness Reliever Sterile', '0.08 fl oz', 17.99, 'Walgreens', 'Bausch + Lomb Lumify');
addProduct('Walgreens Free & Pure 24 Hour Allergy Relief Loratadine 10 mg Tablets', '30 ea', 17.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Sinus Pressure Pain & Cough Maximum Strength Caplets', '20 ea', 9.99, 'Walgreens', 'Walgreens');
addProduct('Breathe Right Extra Strength Nasal Strips Tan', '44 ea', 19.99, 'Walgreens', 'Breathe Right');
addProduct('Vicks Sinex Nasal Original Ultra Fine Mist Decongestant Medicine', '2 ea', 19.99, 'Walgreens', 'Vicks Sinex');
addProduct('Afrin 12 Hour Nasal Congestion Relief', '0.5 fl oz x 2 pack', 18.99, 'Walgreens', 'Afrin');

// Row 7
addProduct('Arm & Hammer Simply Saline Moisturize & Soothe Nasal Mist', '4.6 oz', 10.99, 'Walgreens', 'Arm & Hammer');
addProduct('Walgreens 24 Hour Allergy Relief Fluticasone Nasal Spray', '11.1 ml', 14.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Severe Moisturizing Ultra Fine Sinus Relief Mist', '0.5 fl oz', 9.99, 'Walgreens', 'Walgreens');

console.log(`✅ Image 5 complete: ${allProducts.length - img5Start} products extracted`);

// ============================================================================
// IMAGE 6: 30 Products (Allergy, Nasal Care, Eye Care)
// ============================================================================
console.log('📸 Extracting Image 6 (30 products)...');
const img6Start = allProducts.length;

// Row 1
addProduct('Walgreens 12 Hour Allergy Eye Itch Relief', '0.34 fl oz', 12.99, 'Walgreens', 'Walgreens');
addProduct('NeilMed Sinus Rinse Xylitol Kit with Refill Packets', '1 set', 16.99, 'Walgreens', 'NeilMed');
addProduct('Walgreens Free & Pure Dye-Free Allergy Relief Diphenhydramine Liquid Gels', '24 ea', 6.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Allergy Relief Diphenhydramine Capsules', '365 ea', 25.99, 'Walgreens', 'Walgreens');
addProduct('Astepro Allergy Antihistamine Nasal Spray', '0.78 fl oz x 2 pack', 48.99, 'Walgreens', 'Astepro');

// Row 2
addProduct('Simply Saline Adult Nasal Mist Extra Strength Plus with Eucalyptus', '4.6 fl oz', 10.99, 'Walgreens', 'Simply Saline');
addProduct('Walgreens Eye Allergy Itch Relief', '2.5 mL', 17.99, 'Walgreens', 'Walgreens');
addProduct('Mucinex Saline Nasal Spray & Sinus Rinse Nasal Decongestant', '4.5 Fl Oz', 13.49, 'Walgreens', 'Mucinex');
addProduct('Walgreens Free & Pure 24 Hour Allergy Relief Loratadine Dye-Free Tablets', '70 ea', 31.99, 'Walgreens', 'Walgreens Free & Pure');
addProduct('Walgreens Silicone Nose Pads', '2 pr', 4.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Childrens Allergy Relief Loratadine Dye-Free Chewable Tablets Bubble Gum', '30 ea', 24.99, 'Walgreens', 'Walgreens');
addProduct('Walgreens Eye Allergy Itch & Redness Relief', '0.17 fl oz', 16.99, 'Walgreens', 'Walgreens');

// Row 4
addProduct('Walgreens Multi-Symptom Allergy Gelcaps', '24 ea', 9.49, 'Walgreens', 'Walgreens');
addProduct('Little Remedies Saline Spray and Drops', '1 fl oz', 6.99, 'Walgreens', 'Little Remedies');

// Row 5
addProduct('Walgreens Squeeze Bottle Kit Sinus Wash', '1 set', 11.99, 'Walgreens', 'Walgreens');
addProduct('Vicks Vapor Pads Family Pack Lavender Rosemary', '12 ea', 15.99, 'Walgreens', 'Vicks');
addProduct('Vicks Personal Steam Inhaler', '1 ea', 59.99, 'Walgreens', 'Vicks');
addProduct('Walgreens 24 Hour Budesonide Nasal Spray', '0.29 fl oz', 24.99, 'Walgreens', 'Walgreens');
addProduct('Allegra Adult 24 Hour Allergy Tablets Non-Drowsy Antihistamine', '70 ea', 36.99, 'Walgreens', 'Allegra');
addProduct('Vicks Waterless Vaporizer Scent Pads', '12 ea', 12.49, 'Walgreens', 'Vicks');

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

// Deduplicate based on product name + size + pharmacy
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

// Merge with existing data
const mergedData = [...existingData, ...uniqueProducts];
console.log(`📊 After merge: ${mergedData.length} products`);
console.log('');

// Save to file
fs.writeFileSync('assets/medicationData.json', JSON.stringify(mergedData, null, 2), 'utf8');
console.log('💾 Saved to assets/medicationData.json');
console.log('');
console.log('🎉 FIRST BATCH COMPLETE! Ready for next batch.');

