const fs = require('fs');

// Comprehensive extraction from ALL images
const allWalgreensProducts = [
  // IMAGE 1 - Cold & Flu Section
  { product: "Walgreens Cough Drops Honey Lemon", size: "200 ea", price: 6.99 },
  { product: "Walgreens Children's Pain & Fever Chewable Tablets Grape", size: "24 ea", price: 7.49 },
  { product: "Walgreens Maximum Strength Daytime and Nighttime Severe Cold & Flu Caplets", size: "48 ea", price: 18.99 },
  { product: "Walgreens Cough Drops Menthol", size: "30 ea", price: 2.49 },
  { product: "Walgreens Premium Saline Nasal Moisturizing Spray", size: "3 fl oz", price: 6.99 },
  { product: "Walgreens Non-Drowsy Nasal Decongestant PE Tablets", size: "36 ea", price: 10.99 },
  { product: "Walgreens Sugar-Free Cough Drops Menthol", size: "150 ea", price: 6.99 },
  
  // IMAGE 2 - More Cold Products
  { product: "Walgreens Cough Drops Cherry", size: "200 ea", price: 6.99 },
  { product: "Walgreens Children's Stuffy Nose & Cold Liquid Dye-Free Mixed Berry", size: "4 fl oz", price: 12.99 },
  { product: "Walgreens Day & Night Pack Severe Cold & Flu Liquid Caps", size: "24 ea", price: 12.99 },
  { product: "Walgreens Nighttime Severe Cold & Flu Liquid Maximum Strength Original", size: "12 fl oz", price: 12.99 },
  { product: "Walgreens Daytime Severe Cold & Flu Liquid Maximum Strength", size: "12 fl oz", price: 12.99 },
  { product: "Walgreens Saline Nasal Moisturizing Spray", size: "1.5 fl oz", price: 4.29 },
  
  // IMAGE 3 - Medical Devices & More
  { product: "Walgreens Digital 10 Second Flexible Tip Thermometer", size: "1 ea", price: 16.29 },
  { product: "Walgreens Zinc Cold Therapy Chewable Tablets", size: "25 ea", price: 9.99 },
  { product: "Walgreens Docosanol Cream 10%", size: "0.07 oz", price: 15.99 },
  { product: "Walgreens Nasal Spray Phenylephrine Hydrochloride 1%", size: "1 fl oz", price: 7.49 },
  { product: "Walgreens Maximum Strength Severe Sinus Congestion Caplets", size: "20 ea", price: 9.99 },
  { product: "Walgreens Sugar-Free Cough Drops Honey Lemon", size: "25 ea", price: 2.49 },
  { product: "Walgreens Children's Cold & Allergy Relief Liquid Grape", size: "8 fl oz", price: 13.99 },
  { product: "Walgreens Multi-Symptom Children's Cold Liquid Day & Night Pack Berry", size: "4 fl oz x 2 pack", price: 18.99 },
  { product: "Walgreens Cough & Cold HBP Tablets", size: "16 ea", price: 8.99 },
  { product: "Walgreens Cough DM Liquid Orange", size: "5 fl oz", price: 13.99 },
  
  // IMAGE 4 - Children's & Night Products
  { product: "Walgreens Nighttime Severe Cold & Flu Liquid Maximum Strength Mixed Berry", size: "12 fl oz", price: 12.99 },
  { product: "Walgreens Children's Cold and Cough Alcohol-Free Grape", size: "4 fl oz", price: 6.49 },
  { product: "Walgreens Children's Cold Cough & Sore Throat Liquid Berry", size: "4 fl oz", price: 12.99 },
  { product: "Walgreens Children's Dye-Free Cold & Cough Liquid Day & Night Combo Pack Flavor Free", size: "4 fl oz x 2 pack", price: 15.99 },
  { product: "Walgreens Daytime Cold & Flu Liquid", size: "12 fl oz", price: 9.99 },
  { product: "Walgreens Children's Cough & Chest Congestion Relief DM & Nighttime Cough Relief DM Grape & Fruit Punch", size: "4 fl oz x 2 pack", price: 12.99 },
  { product: "Walgreens Children's Cold & Cough Relief Liquid and Cold & Congestion Relief Liquid Grape", size: "4 fl oz x 2 pack", price: 11.99 },
  
  // IMAGE 5 - Extended Release & More
  { product: "Walgreens Cough DM Extended-Release Syrup Grape", size: "5 fl oz", price: 13.99 },
  { product: "Walgreens 12-Hour Children's Cough DM Liquid Grape", size: "3 fl oz", price: 12.49 },
  { product: "Walgreens Sugar-Free Cough Drops Honey Lemon", size: "150 ea", price: 6.99 },
  { product: "Walgreens Nighttime Cold & Flu Liquid Cherry", size: "12 fl oz", price: 9.99 },
  { product: "Walgreens Daytime & Nighttime Severe Cold & Flu Caplets", size: "24 ea", price: 12.99 },
  { product: "Walgreens Vapor Chest Rub Cough Suppressant Topical Analgesic", size: "1.76 oz", price: 5.29 },
  
  // IMAGE 6 - Liquid Caps & Combos
  { product: "Walgreens Cold Relief Plus Original", size: "36 ea", price: 12.99 },
  { product: "Walgreens Daytime & Nighttime Severe Cold & Flu Liquid Caps", size: "48 ea", price: 21.99 },
  { product: "Walgreens Daytime & Nighttime Cold & Flu Liquid Caps", size: "16 ea", price: 10.99 },
  { product: "Walgreens Infrared Digital Ear Thermometer", size: "1 ea", price: 43.99 },
  { product: "Walgreens Nasal Decongestant PE Tablets", size: "72 ea", price: 14.49 },
  { product: "Walgreens Children's Allergy Relief Loratadine Dye-Free Liquid Grape", size: "4 fl oz", price: 10.99 },
  { product: "Walgreens Free & Pure 12 Hour Mucus Relief DM Extended-Release Tablets Maximum Strength", size: "42 ea", price: 32.99 },
  
  // IMAGE 7 - Mucus Relief & More
  { product: "Walgreens Mucus Relief", size: "20 ea", price: 15.99 },
  { product: "Walgreens Cough & Chest Congestion DM Liquid Cherry", size: "6 fl oz", price: 9.99 },
  { product: "Walgreens Deluxe Nasal Aspirator", size: "1 ea", price: 13.49 },
  { product: "Walgreens Nighttime Cold & Flu Liquid Original", size: "12 fl oz", price: 9.99 },
  { product: "Walgreens Children's Multi-Symptom Cold + Flu Oral Suspension Grape", size: "4 fl oz", price: 7.99 },
  { product: "Walgreens Cough & Cold Syrup Day & Night", size: "6 fl oz x 2 pack", price: 19.99 },
  { product: "Walgreens Nighttime Cold & Flu Liquid Caps", size: "24 ea", price: 10.99 },
  { product: "Walgreens Free & Pure 12 Hour Mucus Relief ER Tablets Maximum Strength", size: "42 ea", price: 29.99 },
  { product: "Walgreens Tussin DM Max Cough + Congestion Relief Liquid Cough Medicine Raspberry Menthol", size: "4 oz", price: 8.99 },
  
  // IMAGE 8 - Night Relief Products
  { product: "Walgreens Nighttime Cold & Flu Relief Liquid Original", size: "8 fl oz", price: 8.99 },
  { product: "Walgreens Nighttime Cold & Flu Relief Liquid Cherry", size: "8 fl oz", price: 8.99 },
  { product: "Walgreens Children's Allergy Relief Diphenhydramine Liquid Bubble Gum", size: "8 fl oz", price: 8.99 },
  { product: "Walgreens Severe Congestion & Cough Liquid", size: "6 fl oz", price: 9.49 },
  { product: "Walgreens Cough + Congestion Relief Maximum Strength Liquid Cough Medicine Raspberry Menthol", size: "8 fl oz", price: 12.99 },
  { product: "Walgreens Docosanol Cream", size: "0.07 oz x 2 pack", price: 29.99 },
  
  // IMAGE 9 - Severe Cold Products
  { product: "Walgreens Daytime & Nighttime Severe Cold & Flu Liquid Severe Cooling", size: "12 fl oz x 2 pack", price: 21.99 },
  { product: "Walgreens Cold & Flu Softgels Maximum Strength", size: "16 ea", price: 11.99 },
  { product: "Walgreens Daytime & Nighttime Cold & Flu Relief Cold Medicine Combination Pack Cherry", size: "2 ea x 2 pack", price: 14.99 },
  { product: "Walgreens Severe Daytime Cold & Flu Relief Maximum Strength Liquid Cold Medicine", size: "8 fl oz", price: 10.99 },
  { product: "Walgreens Severe Congestion & Cough Liquid", size: "9 fl oz", price: 16.99 },
  { product: "Walgreens Daytime And Nighttime Cold And Flu Relief Combo Max Strength Liquid Original", size: "12 fl oz x 2 pack", price: 21.99 },
  { product: "Walgreens Daytime & Nighttime Severe Cold & Flu Liquid Maximum Strength Mixed Berry", size: "12 fl oz x 2 pack", price: 21.99 },
  { product: "Walgreens Children's Mucus Congestion & Cough Relief Berry", size: "6.8 oz", price: 13.99 },
  
  // IMAGE 10 - Sinus & Pain Relief
  { product: "Walgreens Daytime & Nighttime Sinus Pressure & Pain Caplets", size: "20 ea", price: 9.99 },
  { product: "Walgreens Mucus Relief DM Extended-Release Tablets", size: "20 ea", price: 15.99 },
  { product: "Walgreens WALG MUCUS RELIEF MULTI-SYMPTOM", size: "6 oz", price: 9.49 },
  { product: "Walgreens Cold & Flu High Blood Pressure Liquid Day & Night Pack", size: "16 fl oz", price: 16.99 },
  { product: "Walgreens Daytime And Nighttime Sinus Pressure & Pain Caplets", size: "40 ea", price: 25.99 },
  { product: "Walgreens Daytime Cold & Flu Liquid Caps", size: "16 ea", price: 9.99 },
  { product: "Walgreens Congestion & Headache Softgels", size: "16 ea", price: 11.99 },
  
  // IMAGE 11 - HBP & Elderberry Products
  { product: "Walgreens Daytime Cold & Flu High Blood Pressure Liquid Sugar Free", size: "8 fl oz", price: 9.99 },
  { product: "Walgreens Non-Drowsy Black Elderberry Cold & Flu Relief Tablets", size: "60 ea", price: 23.99 },
  { product: "Walgreens Night Cold & Flu Liquid Cherry", size: "12 fl oz x 2 pack", price: 14.99 },
  { product: "Walgreens Nighttime Severe Cold & Cough Packets Honey Lemon", size: "6 ea", price: 8.79 },
  { product: "Walgreens Adult Severe Tussin CF Max Liquid Natural Raspberry", size: "8 fl oz", price: 12.99 },
  { product: "Walgreens Daytime & Nighttime Flu Relief Packets Maximum Strength Honey Lemon", size: "6 ea x 2 pack", price: 14.99 },
  { product: "Walgreens Multi-Symptom Severe Cold Packets Honey Lemon Infused with Chamomile & White Tea", size: "6 ea", price: 8.79 },
  { product: "Walgreens Children's Cold Cough & Runny Nose Grape", size: "4 fl oz", price: 7.99 },
  
  // IMAGE 12 - Allergy & Extended Release
  { product: "Walgreens Cold Sore Treatment Device", size: "1 ea", price: 49.99 },
  { product: "Walgreens Mucus Relief DM Maximum Strength 12 Hour Extended-Release Tablets", size: "14 ea", price: 15.99 },
  { product: "Walgreens Mucus Relief DM Extended-Release Tablets", size: "40 ea", price: 24.99 },
  { product: "Walgreens Multi-Symptom Severe Cold & Nighttime Severe Cold & Cough Packets Honey Lemon Infused with Chamomile & White Tea", size: "6 ea x 2 pack", price: 14.99 },
  { product: "Walgreens WALG MUCUS RELIEF SEVERE CONGESTION", size: "6 oz", price: 9.49 },
  { product: "Walgreens Daytime Flu Relief Packets Maximum Strength Honey Lemon", size: "6 ea", price: 8.79 },
  { product: "Walgreens Children's Cold Cough & Sore Throat Bubblegum", size: "4 fl oz", price: 7.99 },
  { product: "Walgreens Walgreens DM", size: "4 oz", price: 12.99 },
  { product: "Walgreens Children's Nighttime Cold Cough & Congestion Honey", size: "8 fl oz", price: 10.99 },
  { product: "Walgreens Sore Throat Lozenges Cherry", size: "18 ea", price: 4.79 },
  
  // IMAGE 13 - Chest Congestion & Rubs
  { product: "Walgreens Chest Congestion Mucus Relief Tablets", size: "120 ea", price: 24.99 },
  { product: "Walgreens Oral Relief Sore Throat Spray Cherry", size: "6 fl oz", price: 7.99 },
  { product: "Walgreens No Drip Severe Anefrin Nasal Spray", size: "0.5 fl oz", price: 8.49 },
  { product: "Walgreens Chest Rub", size: "3.53 oz", price: 7.29 },
  { product: "Walgreens Baby Chest Rub", size: "1.76 oz", price: 6.99 },
  { product: "Walgreens Nighttime Severe Cold & Flu Softgels", size: "24 ea", price: 12.99 },
  { product: "Walgreens Daytime & Nighttime Cold & Flu Liquid Caps", size: "48 ea", price: 13.99 },
  { product: "Walgreens Cough Mucus Relief DM Immediate Release Tablets", size: "60 ea x 2 pack", price: 24.99 },
  { product: "Walgreens Free & Pure Cough Mucus Relief DM Softgels", size: "30 ea", price: 9.99 },
  { product: "Walgreens Daytime & Nighttime Sinus Relief Softgels Maximum Strength", size: "24 ea", price: 14.99 },
  { product: "Walgreens Cough Drops Strawberry", size: "30 ea", price: 2.49 },
  { product: "Walgreens Cold Flu & Sore Throat Softgels", size: "16 ea", price: 11.99 },
  { product: "Walgreens Black Elderberry Cold & Flu Relief Tablets", size: "30 ea", price: 10.99 },
  
  // IMAGE 14 - Sinus & Cold Products
  { product: "Walgreens Non-Drowsy Daytime and Nighttime Sinus & Cold Softgels", size: "24 ea", price: 11.49 },
  { product: "Walgreens Nighttime Severe Cold & Flu Original", size: "8 fl oz", price: 10.99 },
  { product: "Walgreens Cold & Flu Nighttime Syrup", size: "6 fl oz", price: 9.49 },
  { product: "Walgreens Children's Allergy Relief Chewable Dye-Free Tablets Cherry", size: "20 ea", price: 7.99 },
  { product: "Walgreens Children's Allergy Relief Chewable Dye-Free Tablets Grape", size: "20 ea", price: 7.99 },
  { product: "Walgreens Daytime Non-Drowsy Cold & Flu Liquid Caps", size: "24 ea", price: 10.99 },
  { product: "Walgreens Probiotic Gummies", size: "90 ea", price: 17.99 },
  { product: "Walgreens Immune Support Elderberry Gummies", size: "60 ea", price: 14.99 },
  { product: "Walgreens Non-Drowsy Daytime and Nighttime Cold & Flu Softgels", size: "24 ea", price: 11.49 },
  { product: "Walgreens Elderberry Liquid Dietary Supplement Sugar Free", size: "4 fl oz", price: 10.99 },
  { product: "Walgreens Daytime Cold & Flu Liquid Original", size: "8 fl oz", price: 8.99 },
  
  // IMAGE 15 - Maximum Strength Products
  { product: "Walgreens Daytime Severe Cold & Flu Liquid Maximum Strength Honey", size: "12 fl oz", price: 12.99 },
  { product: "Walgreens Children's Chest Rub", size: "1.76 oz", price: 5.49 },
  { product: "Walgreens Nighttime Cough Suppressant Cherry", size: "12 oz", price: 9.99 },
  { product: "Walgreens Vitamin C Supplement Drops Assorted Citrus", size: "140 ea", price: 7.99 },
  { product: "Walgreens Maximum Strength DM Max Cough & Chest Congestion Relief Honey & Berry", size: "6 fl oz", price: 9.49 },
  { product: "Walgreens Mucus Relief DM Maximum Strength 12 Hour Extended-Release Tablets", size: "28 ea", price: 28.99 },
  { product: "Walgreens WALG MUCUS RELIEF MULTI-SYMPTOM MAX", size: "6 oz", price: 9.49 },
  { product: "Walgreens Tussin DM Cough & Chest Congestion Liquid Raspberry", size: "8 fl oz", price: 9.99 },
  { product: "Walgreens Tussin DM Cough & Chest Congestion Liquid Raspberry", size: "4 fl oz", price: 7.99 },
  { product: "Walgreens 12 Hour Mucus Relief ER Tablets", size: "20 ea", price: 14.99 },
  { product: "Walgreens Day & Nighttime Cold & Flu Liquid Pack", size: "24 oz x 2 pack", price: 14.99 },
  { product: "Walgreens 12 Hour Mucus Relief ER Tablets Maximum Strength", size: "28 ea", price: 24.99 },
  
  // IMAGE 16 - Vapor & Topical Products
  { product: "Walgreens Sinus Congestion Mucus Relief PE Tablets", size: "30 ea", price: 9.99 },
  { product: "Walgreens Vapor Chest Rub Cough Suppressant Topical Analgesic Lavender", size: "1.76 oz", price: 5.29 },
  { product: "Walgreens Vapor Stick", size: "2.35 oz", price: 10.99 },
  { product: "Walgreens Adult Dye-Free Tussin DM Cough & Chest Congestion Liquid Cherry Menthol", size: "8 fl oz", price: 9.99 },
  { product: "Walgreens Nighttime Cold & Flu High Blood Pressure Liquid Sugar Free", size: "8 fl oz", price: 9.99 },
  { product: "Walgreens Flu HBP Maximum Strength Caplets", size: "24 ea", price: 10.99 },
  { product: "Walgreens Sore Throat & Cough Lozenges Mixed Berry", size: "18 ea", price: 4.79 },
  { product: "Walgreens Nighttime Severe Cold & Flu Liquid Vapor Ice", size: "12 fl oz", price: 12.99 },
  { product: "Walgreens Chest Congestion & Cough HBP Softgels", size: "20 ea", price: 10.99 },
  { product: "Walgreens WALG MUCUS SEVERE COUGH DAY/NIGHT", size: "6 oz x 2 pack", price: 19.99 },
  { product: "Walgreens WALG MUCUS DAY/NIGHT LIQUID", size: "6 oz x 2 pack", price: 19.99 },
  { product: "Walgreens Severe Cooling Throat Drops Menthol Ice", size: "45 ea", price: 5.99 },
  { product: "Walgreens Children's Vapor Stick", size: "1.25 oz", price: 6.99 },
  
  // IMAGE 17 - Relief & Spray Products
  { product: "Walgreens Cold Cough & Flu Relief Liquid Maximum Strength Natural Cherry", size: "12 fl oz", price: 12.99 },
  { product: "Walgreens Oral Relief Sore Throat Spray Maximum Strength Berry", size: "4 fl oz", price: 8.49 },
  { product: "Walgreens Allergy Relief Diphenhydramine HCl 50 mg Caplets Extra Strength", size: "24 ea", price: 8.99 },
  { product: "Walgreens Severe Cooling Throat Drops Honey Lemon", size: "45 ea", price: 5.99 },
  { product: "Walgreens Children's Cold + Cough + Mucus Daytime Honey", size: "8 fl oz", price: 10.99 },
  { product: "Walgreens Adult Tussin Chest Congestion Liquid Natural Cherry", size: "8 fl oz", price: 6.79 },
  { product: "Walgreens Nighttime Tussin DM Max Menthol Berry", size: "8 fl oz", price: 13.49 },
  { product: "Walgreens Daytime & Nighttime Maximum Strength Cold & Flu Softgels", size: "24 ea", price: 14.99 },
  { product: "Walgreens Tussin DM Max Honey", size: "4 fl oz", price: 8.99 },
  { product: "Walgreens Pain Reliever PM Extra Strength Rapid Release Gelcaps", size: "375 ea", price: 27.99 },
  { product: "Walgreens Children's Soothe Gummies", size: "24 ea", price: 9.29 },
  { product: "Walgreens Nighttime Severe Cold & Flu Liquid Maximum Strength Honey", size: "12 fl oz", price: 12.99 },
  { product: "Walgreens Children's Cough", size: "4 fl oz", price: 12.99 },
  { product: "Walgreens Docosanol Cream 10%", size: "0.07 oz", price: 15.99 }
];

// Remove duplicates based on product name and size
const uniqueProducts = [];
const seen = new Set();

for (const item of allWalgreensProducts) {
  const key = `${item.product}|${item.size}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueProducts.push(item);
  }
}

console.log('Total products extracted:', allWalgreensProducts.length);
console.log('Unique products after deduplication:', uniqueProducts.length);
console.log('\nSample products:');
uniqueProducts.slice(0, 10).forEach((p, i) => {
  console.log(`${i + 1}. ${p.product} - ${p.size} - $${p.price}`);
});

fs.writeFileSync('all-walgreens-extracted.json', JSON.stringify(uniqueProducts, null, 2));
console.log('\n✅ Saved to all-walgreens-extracted.json');

