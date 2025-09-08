// services/labSearch.ts
// Service for finding nearby medical laboratories and testing facilities

export type Lab = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  distanceMiles: number;
  logoUrl?: string;
  phone?: string;
  website?: string;
  testTypes?: string[];
  hours?: string;
  rating?: number;
};

export type LabTestType = {
  category: string;
  tests: string[];
};

// Common test types by category
export const LAB_TEST_CATEGORIES: Record<string, LabTestType> = {
  'blood-work': {
    category: 'Blood Work',
    tests: ['Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Lipid Panel', 'Thyroid Function', 'Diabetes Screening', 'Vitamin D', 'Iron Studies', 'Liver Function', 'Kidney Function']
  },
  'imaging': {
    category: 'Imaging',
    tests: ['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Mammography', 'Bone Density', 'Echocardiogram', 'Nuclear Medicine']
  },
  'cardiac': {
    category: 'Cardiac',
    tests: ['EKG/ECG', 'Stress Test', 'Echocardiogram', 'Holter Monitor', 'Cardiac Catheterization', 'Angiography']
  },
  'pathology': {
    category: 'Pathology',
    tests: ['Biopsy', 'Cytology', 'Histology', 'Cancer Screening', 'Tumor Markers', 'Genetic Testing']
  },
  'infectious-disease': {
    category: 'Infectious Disease',
    tests: ['COVID-19 Testing', 'Flu Testing', 'STD Testing', 'Hepatitis Panel', 'HIV Testing', 'Tuberculosis Test']
  },
  'allergy': {
    category: 'Allergy',
    tests: ['Allergy Testing', 'Food Allergy Panel', 'Environmental Allergy', 'Patch Testing', 'RAST Testing']
  },
  'specialty': {
    category: 'Specialty',
    tests: ['Sleep Studies', 'Pulmonary Function', 'Neurological Testing', 'Endocrinology', 'Rheumatology', 'Dermatology']
  }
};

// Map lab names to likely test types
export const LAB_TEST_MAPPING: Record<string, string[]> = {
  'chopo': ['blood-work', 'pathology', 'infectious-disease', 'allergy'],
  'polanco': ['blood-work', 'imaging', 'cardiac', 'pathology'],
  'salud digna': ['blood-work', 'imaging', 'infectious-disease'],
  'laboratorio': ['blood-work', 'pathology', 'infectious-disease'],
  'clinica': ['blood-work', 'imaging', 'cardiac', 'pathology', 'specialty'],
  'hospital': ['blood-work', 'imaging', 'cardiac', 'pathology', 'specialty'],
  'diagnostico': ['blood-work', 'imaging', 'pathology'],
  'medica': ['blood-work', 'imaging', 'cardiac', 'pathology'],
  'sonora': ['blood-work', 'imaging', 'pathology'],
  'especializada': ['pathology', 'specialty'],
  'radiologia': ['imaging'],
  'cardiologia': ['cardiac'],
  'dermatologia': ['pathology', 'allergy'],
  'endocrinologia': ['blood-work', 'specialty'],
  'neurologia': ['specialty'],
  'oncologia': ['pathology', 'imaging'],
  'pediatria': ['blood-work', 'imaging', 'infectious-disease']
};

import { API_BASE } from "../src/config/api";

// Haversine formula for calculating distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export async function findNearbyLabs(lat: number, lon: number, lang: string = 'en', opts?: { limit?: number; noCache?: boolean }): Promise<Lab[]> {
  try {
    // Search for medical laboratories and testing facilities
    const searchTerms = encodeURIComponent('medical laboratory,diagnostic center,clinical lab,blood test,imaging center');
    const limit = opts?.limit ?? 15;
    const noCache = opts?.noCache ? '&noCache=1' : '';
    const url = `${API_BASE}/labs/nearby?lat=${lat}&lon=${lon}&limit=${limit}&lang=${encodeURIComponent(lang)}&search=${searchTerms}${noCache}`;
    
    console.log('🔬 Labs API URL:', url);
    const res = await fetch(url);
    console.log('🔬 Labs API response status:', res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log('🔬 Labs API response:', json);
    if (!json.ok) throw new Error(json.error || 'api_error');
    console.log('✅ Labs API success:', json.labs?.length, 'labs');
    return json.labs || [];
  } catch (e) {
    console.error('❌ Labs API call failed:', e);
    throw new Error(`Failed to fetch labs: ${e.message}`);
  }
}

export function getTestTypesForLab(labName: string): string[] {
  const name = labName.toLowerCase();
  
  // Check for exact matches first
  for (const [key, testTypes] of Object.entries(LAB_TEST_MAPPING)) {
    if (name.includes(key)) {
      return testTypes;
    }
  }
  
  // Default fallback
  return ['blood-work', 'pathology'];
}

export function getTestDetails(testTypeKeys: string[]): { category: string; tests: string[] }[] {
  return testTypeKeys.map(key => LAB_TEST_CATEGORIES[key]).filter(Boolean);
}

export function formatTestTypes(testTypes: string[]): string {
  const details = getTestDetails(testTypes);
  return details.map(detail => detail.category).join(', ');
}
