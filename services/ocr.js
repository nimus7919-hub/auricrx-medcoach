// Simple OCR stub: you can replace `mockExtract` with a real cloud OCR call later.
export async function extractMedsFromImage(imageUri) {
  // TODO: Replace with your OCR provider (Google Vision, Azure OCR, etc.)
  // const text = await callYourOcrApi(imageUri);
  // const meds = parseMedicationNames(text);
  // return meds;

  // Temporary demo: look for capitalized tokens resembling meds
  const meds = await mockExtract(imageUri);
  return meds;
}

async function mockExtract(_uri) {
  // Pretend OCR read these from the image:
  return [
    'Linaclotide',
    'Galvusmet',
    'Atorvastatin',
    'Clopidogrel',
    'Aspirin Protect',
  ];
}
