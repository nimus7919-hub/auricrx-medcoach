// services/ocr.js
// Uses Google Vision with an API key from .env (EXPO_PUBLIC_GOOGLE_VISION_KEY)

import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY ||
  Constants?.expoConfig?.extra?.googleVisionKey ||
  '';

export async function extractMedsFromImage(imageUri) {
  if (!API_KEY) throw new Error('Google Vision API key is missing');

  // 1) Read the local image file as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2) Call Vision API
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: { languageHints: ['en', 'es', 'zh'] },
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Vision API error: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const text =
    data?.responses?.[0]?.fullTextAnnotation?.text ||
    data?.responses?.[0]?.textAnnotations?.[0]?.description ||
    '';

  if (!text) return [];

  return parseMedicationNames(text);
}

// --- Very simple parser to pull likely medication lines ---
function parseMedicationNames(text) {
  const lines = text
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const meds = new Set();
  const doseRe = /\b(\d+(?:\.\d+)?\s?(?:mg|mcg|g|iu|units|ml|mL))\b/i;
  const nameThenDose = /^([A-Za-z][A-Za-z0-9+\- ]{1,40})\s+(\d+(?:\.\d+)?\s?(?:mg|mcg|g|iu|units|ml|mL))/i;

  for (const line of lines) {
    const clean = line.replace(/^[•\-\*\u2022]+\s*/,'').replace(/^\d+[.)]\s*/,'').trim();
    if (/^(patient|nombre|name|diagn|rx|prescription|sig|directions|tomar|dose|dosis|refill|qty|quantity|date|fecha)\b/i.test(clean)) continue;

    const m = clean.match(nameThenDose);
    if (m) {
      meds.add(titleCase(m[1]) + ' ' + m[2].replace(/\s+/g, ''));
      continue;
    }
    if (doseRe.test(clean)) {
      const medPart = clean.split(doseRe)[0].replace(/\b(tablet|tablets|capsule|capsules|suspension)\b/gi,'').trim();
      if (medPart) meds.add(titleCase(medPart));
      continue;
    }
    if (clean.split(' ').length <= 3 && /^[A-Za-z][A-Za-z0-9+\- ]{1,40}$/.test(clean)) {
      meds.add(titleCase(clean));
    }
  }

  return Array.from(meds).slice(0, 20);
}

function titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bMc([a-z])/g, (_m, g1) => 'Mc' + g1.toUpperCase());
}
