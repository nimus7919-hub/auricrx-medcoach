# Brand Name Aliases Guide

This document explains how brand name aliases work in the AuricRX MedCoach app and how to add new ones.

## How It Works

When users search for medications, the app automatically searches for both:
- **Brand names** (e.g., "Galvus Met", "Janumet")
- **Generic names** (e.g., "Metformin / Vildagliptin", "Metformin / Sitagliptin")

This is handled in `services/excelReaderRNCompatible.js` in the `getBrandNameAliases()` method.

## Current Brand Name Mappings (200+ medications)

### 💊 DIABETES MEDICATIONS

#### Metformin (Biguanides)
- **Glucophage / Glucophage XR** → Metformin, Metformina
- **Fortamet** → Metformin
- **Glumetza** → Metformin
- **Riomet** → Metformin
- **Treda** → Metformin (common in Mexico)
- **Dabex** → Metformin (common in Mexico)
- **Glafornil** → Metformin
- **Dianben** → Metformin

#### Metformin Combinations
- **Galvus Met** → Metformin + Vildagliptin
- **Janumet / Janumet XR** → Metformin + Sitagliptin
- **Jentadueto** → Metformin + Linagliptin
- **Kombiglyze** → Metformin + Saxagliptin
- **Kazano** → Metformin + Alogliptin
- **Synjardy / Synjardy XR** → Metformin + Empagliflozin
- **Xigduo / Xigduo XR** → Metformin + Dapagliflozin
- **Invokamet / Invokamet XR** → Metformin + Canagliflozin
- **Segluromet** → Metformin + Ertugliflozin
- **Glucovance** → Metformin + Glibenclamide
- **Metaglip** → Metformin + Glipizide
- **Avandamet** → Metformin + Rosiglitazone
- **ActoPlus Met** → Metformin + Pioglitazone

#### DPP-4 Inhibitors (Gliptins)
- **Januvia** → Sitagliptin
- **Galvus** → Vildagliptin
- **Onglyza** → Saxagliptin
- **Trajenta / Tradjenta** → Linagliptin
- **Nesina / Vipidia** → Alogliptin

#### SGLT2 Inhibitors (Gliflozins)
- **Jardiance** → Empagliflozin
- **Farxiga / Forxiga** → Dapagliflozin
- **Invokana** → Canagliflozin
- **Steglatro** → Ertugliflozin
- **Suglat** → Ipragliflozin

#### GLP-1 Receptor Agonists
- **Victoza / Saxenda** → Liraglutide
- **Ozempic / Wegovy** → Semaglutide
- **Rybelsus** → Semaglutide (oral)
- **Trulicity** → Dulaglutide
- **Bydureon / Byetta** → Exenatide
- **Adlyxin / Lyxumia** → Lixisenatide
- **Mounjaro / Zepbound** → Tirzepatide

#### Sulfonylureas
- **Amaryl** → Glimepiride
- **Diabeta / Micronase / Glynase** → Glyburide, Glibenclamida
- **Glucotrol / Glucotrol XL** → Glipizide
- **Diabinese** → Chlorpropamide
- **Tolinase** → Tolazamide
- **Daonil / Euglucon** → Glibenclamide (common in Mexico/Europe)

#### Thiazolidinediones (TZDs)
- **Actos** → Pioglitazone
- **Avandia** → Rosiglitazone

#### Insulin
- **Lantus / Basaglar / Toujeo** → Insulin Glargine
- **Tresiba** → Insulin Degludec
- **Levemir** → Insulin Detemir
- **Novolog / NovoRapid / Fiasp** → Insulin Aspart
- **Humalog** → Insulin Lispro
- **Apidra** → Insulin Glulisine
- **Humulin / Novolin** → Human Insulin

### ❤️ CARDIOVASCULAR MEDICATIONS

#### Statins (Cholesterol)
- **Lipitor** → Atorvastatin
- **Crestor** → Rosuvastatin
- **Zocor** → Simvastatin
- **Pravachol** → Pravastatin
- **Lescol** → Fluvastatin
- **Livalo** → Pitavastatin
- **Mevacor** → Lovastatin

#### ACE Inhibitors
- **Zestril / Prinivil** → Lisinopril
- **Vasotec** → Enalapril
- **Altace** → Ramipril
- **Accupril** → Quinapril
- **Mavik** → Trandolapril
- **Lotensin** → Benazepril
- **Aceon** → Perindopril
- **Univasc** → Moexipril
- **Capoten** → Captopril

#### ARBs (Angiotensin Receptor Blockers)
- **Cozaar** → Losartan
- **Diovan** → Valsartan
- **Avapro** → Irbesartan
- **Atacand** → Candesartan
- **Micardis** → Telmisartan
- **Benicar** → Olmesartan
- **Edarbi** → Azilsartan
- **Teveten** → Eprosartan

#### Calcium Channel Blockers
- **Norvasc** → Amlodipine
- **Cardizem / Cartia / Tiazac** → Diltiazem
- **Procardia / Adalat** → Nifedipine
- **Calan / Isoptin** → Verapamil
- **Plendil** → Felodipine
- **DynaCirc** → Isradipine

#### Beta Blockers
- **Lopressor / Toprol XL** → Metoprolol
- **Tenormin** → Atenolol
- **Coreg** → Carvedilol
- **Bystolic** → Nebivolol
- **Inderal** → Propranolol
- **Sectral** → Acebutolol
- **Zebeta** → Bisoprolol

#### Diuretics
- **Lasix** → Furosemide
- **Bumex** → Bumetanide
- **Demadex** → Torsemide
- **HydroDIURIL / Microzide** → Hydrochlorothiazide
- **Aldactone** → Spironolactone
- **Inspra** → Eplerenone

#### Anticoagulants
- **Coumadin / Jantoven** → Warfarin
- **Xarelto** → Rivaroxaban
- **Eliquis** → Apixaban
- **Pradaxa** → Dabigatran
- **Savaysa** → Edoxaban
- **Plavix** → Clopidogrel
- **Effient** → Prasugrel
- **Brilinta** → Ticagrelor

### 💊 PAIN & INFLAMMATION

#### NSAIDs
- **Advil / Motrin** → Ibuprofen
- **Aleve / Naprosyn** → Naproxen
- **Celebrex** → Celecoxib
- **Voltaren / Cataflam** → Diclofenac
- **Indocin** → Indomethacin
- **Mobic** → Meloxicam
- **Relafen** → Nabumetone
- **Toradol** → Ketorolac

#### Acetaminophen
- **Tylenol / Panadol / Tempra** → Acetaminophen, Paracetamol

#### Aspirin
- **Aspirin Protect / Bayer / Ecotrin / Bufferin** → Aspirin

### 🌿 GASTROINTESTINAL

#### Proton Pump Inhibitors (PPIs)
- **Prilosec** → Omeprazole
- **Nexium** → Esomeprazole
- **Prevacid** → Lansoprazole
- **Protonix** → Pantoprazole
- **Aciphex** → Rabeprazole
- **Dexilant** → Dexlansoprazole

#### H2 Blockers
- **Zantac** → Ranitidine
- **Pepcid** → Famotidine
- **Tagamet** → Cimetidine
- **Axid** → Nizatidine

#### Antacids
- **Maalox** → Aluminum + Magnesium Hydroxide
- **Mylanta** → Aluminum + Magnesium + Simethicone
- **Tums** → Calcium Carbonate
- **Rolaids** → Calcium + Magnesium

### 🫁 RESPIRATORY

#### Asthma & COPD
- **Advair** → Fluticasone + Salmeterol
- **Symbicort** → Budesonide + Formoterol
- **Breo** → Fluticasone + Vilanterol
- **Dulera** → Mometasone + Formoterol
- **Spiriva** → Tiotropium
- **Ventolin / ProAir / Proventil** → Albuterol, Salbutamol
- **Xopenex** → Levalbuterol
- **Singulair** → Montelukast
- **Flovent** → Fluticasone
- **Pulmicort** → Budesonide
- **QVAR** → Beclomethasone

### 💊 ANTIBIOTICS

#### Penicillins
- **Amoxil** → Amoxicillin
- **Augmentin** → Amoxicillin + Clavulanate
- **Unasyn** → Ampicillin + Sulbactam

#### Cephalosporins
- **Keflex** → Cephalexin
- **Ceftin** → Cefuroxime
- **Rocephin** → Ceftriaxone
- **Suprax** → Cefixime

#### Macrolides
- **Zithromax / Z-Pak** → Azithromycin
- **Biaxin** → Clarithromycin
- **Erythrocin** → Erythromycin

#### Fluoroquinolones
- **Cipro** → Ciprofloxacin
- **Levaquin** → Levofloxacin
- **Avelox** → Moxifloxacin

#### Other Antibiotics
- **Bactrim / Septra** → Trimethoprim + Sulfamethoxazole
- **Flagyl** → Metronidazole
- **Cleocin** → Clindamycin
- **Vibramycin** → Doxycycline

### 🧠 MENTAL HEALTH

#### SSRIs
- **Prozac** → Fluoxetine
- **Zoloft** → Sertraline
- **Lexapro** → Escitalopram
- **Celexa** → Citalopram
- **Paxil** → Paroxetine
- **Luvox** → Fluvoxamine

#### SNRIs
- **Cymbalta** → Duloxetine
- **Effexor** → Venlafaxine
- **Pristiq** → Desvenlafaxine

#### Benzodiazepines
- **Xanax** → Alprazolam
- **Ativan** → Lorazepam
- **Valium** → Diazepam
- **Klonopin** → Clonazepam

#### Antipsychotics
- **Abilify** → Aripiprazole
- **Seroquel** → Quetiapine
- **Zyprexa** → Olanzapine
- **Risperdal** → Risperidone

### 🦴 OTHER CONDITIONS

#### Thyroid
- **Synthroid / Levoxyl** → Levothyroxine
- **Armour Thyroid** → Thyroid Desiccated
- **Cytomel** → Liothyronine

#### Osteoporosis
- **Fosamax** → Alendronate
- **Actonel** → Risedronate
- **Boniva** → Ibandronate
- **Prolia** → Denosumab
- **Forteo** → Teriparatide

#### Erectile Dysfunction
- **Viagra** → Sildenafil
- **Cialis** → Tadalafil
- **Levitra** → Vardenafil

#### Contraceptives
- **Postday / Plan B** → Levonorgestrel
- **Yasmin / Yaz** → Drospirenone + Ethinyl Estradiol
- **Ortho Tri-Cyclen** → Norgestimate + Ethinyl Estradiol

#### Allergy
- **Zyrtec** → Cetirizine
- **Claritin** → Loratadine
- **Allegra** → Fexofenadine
- **Benadryl** → Diphenhydramine
- **Flonase** → Fluticasone
- **Nasacort** → Triamcinolone

## How to Add New Brand Names

1. Open `services/excelReaderRNCompatible.js`
2. Find the `getBrandNameAliases()` method (around line 124)
3. Add a new entry in the format:

```javascript
'brand name': ['generic name 1', 'generic name 2', ...],
```

### Example:

```javascript
getBrandNameAliases() {
  return {
    'galvus met': ['metformin vildagliptin', 'metformina vildagliptina', 'vildagliptin metformin'],
    'your new brand': ['generic name', 'nombre generico'],
    // ... more entries
  };
}
```

### Tips:

- **Use lowercase** for brand names (the system normalizes everything)
- **Include both English and Spanish** generic names when applicable
- **Include word order variations** (e.g., "metformin vildagliptin" AND "vildagliptin metformin")
- The system is **bidirectional**: searching for the brand finds generics, and searching for generics finds the brand

## Testing

After adding new aliases:

1. Clear Metro cache: `npx expo start -c`
2. Reload the app
3. Test searching for both:
   - The brand name (e.g., "Galvus Met")
   - The generic name (e.g., "Metformin Vildagliptin")
4. Both searches should return the same medications

## Examples of Searches That Work

✅ **"Galvus Met"** → Finds all "Metformin / Vildagliptin" products
✅ **"Metformin Vildagliptin"** → Also finds "Galvus Met" branded products
✅ **"Janumet"** → Finds all "Metformin / Sitagliptin" products
✅ **"Glucophage"** → Finds all "Metformin" products

## Complete Database Statistics

✅ **Total Brand Names:** 500+
✅ **Categories:** 25+
✅ **Languages:** English & Spanish
✅ **Geographic Coverage:** USA, Mexico, International

### Major Categories Added:

- **Biologics & Immunology (30+)**: Humira, Enbrel, Remicade, Stelara, Cosentyx, Skyrizi, Rinvoq, Xeljanz, Dupixent, Otezla, etc.
- **High-Value Specialty (50+)**: Keytruda, Opdivo, Eliquis, Xarelto, Botox, Ocrevus, Tysabri, Tecfidera, Copaxone, etc.
- **HIV/Hepatitis (30+)**: Truvada, Descovy, Biktarvy, Genvoya, Harvoni, Sovaldi, Epclusa, Mavyret, etc.
- **GLP-1 Agonists**: Ozempic, Wegovy, Saxenda, Mounjaro, Zepbound, Victoza, Trulicity, Bydureon, etc.
- **ADHD Medications (15+)**: Adderall, Vyvanse, Concerta, Ritalin, Strattera, Intuniv, Focalin, etc.
- **Migraine (15+)**: Imitrex, Aimovig, Ajovy, Emgality, Nurtec, Ubrelvy, Maxalt, Zomig, etc.
- **Sleep Aids (10+)**: Ambien, Lunesta, Sonata, Restoril, Belsomra, Rozerem, etc.
- **Urinary/Prostate (15+)**: Flomax, Avodart, Proscar, Vesicare, Myrbetriq, Detrol, etc.
- **Ophthalmology (20+)**: Xalatan, Lumigan, Restasis, Xiidra, Alphagan, Cosopt, etc.
- **Dermatology (15+)**: Retin-A, Differin, Epiduo, Protopic, Elidel, Dupixent, Aldara, etc.
- **Hormones & Fertility (30+)**: Premarin, Estrace, AndroGel, Clomid, Femara, Gonal-F, etc.
- **Weight Loss (8+)**: Wegovy, Saxenda, Qsymia, Contrave, Xenical, Adipex, etc.
- **Cough & Cold (10+)**: Mucinex, Robitussin, Sudafed, Tessalon, Delsym, Afrin, etc.
- **Laxatives & Bowel (15+)**: Miralax, Linzess, Amitiza, Trulance, Motegrity, etc.
- **Antiemetics (15+)**: Zofran, Phenergan, Reglan, Emend, Diclegis, etc.
- **Muscle Relaxants (8+)**: Flexeril, Soma, Robaxin, Zanaflex, Skelaxin, etc.
- **Gout (8+)**: Uloric, Colcrys, Zurampic, Krystexxa, etc.

### Special Features:

✅ **Extended Release Formulations**: Includes XR, CR, LA, ER variants
✅ **Combination Products**: Multi-drug combinations properly mapped
✅ **Mexican Brands**: Treda, Dabex, Daonil, Euglucon, and more
✅ **OTC Products**: Tylenol, Advil, Claritin, Mucinex, Tums, etc.
✅ **Biosimilars Ready**: Infrastructure for future biosimilar additions

## Notes

- The alias system uses **fuzzy matching**, so slight variations in spelling will still work
- Accents are automatically removed during normalization
- The system searches for **partial matches**, so "Galvus" will find "Galvus Met"
- **Bidirectional search**: Brand names find generics, and vice versa
- Supports both English and Spanish medication names
- Automatically handles word order variations (e.g., "Metformin Vildagliptin" = "Vildagliptin Metformin")

