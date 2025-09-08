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
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'api_error');
    return json.labs || [];
  } catch (e) {
    console.warn('❌ Labs API call failed, using fallback (mock)', e);
    // Fallback mock data with realistic coordinates and proper distance calculation
    // Using larger offsets to simulate real lab distances (0.01-0.05 degrees = 1-5 km)
    const mockLabs = [
      { 
        id: "mock-chopo", 
        name: "Laboratorio Chopo", 
        lat: lat+0.015, 
        lon: lon+0.015, 
        address: "123 Medical Center Dr", 
        distanceMiles: 0.8,
        testTypes: ['blood-work', 'pathology', 'infectious-disease'],
        phone: "1-800-CHOPO-LAB"
      },
      { 
        id: "mock-polanco", 
        name: "Laboratorio Polanco", 
        lat: lat+0.025, 
        lon: lon-0.010, 
        address: "456 Healthcare Ave", 
        distanceMiles: 1.2,
        testTypes: ['blood-work', 'imaging', 'cardiac'],
        phone: "1-800-POLANCO"
      },
      { 
        id: "mock-salud", 
        name: "Salud Digna", 
        lat: lat-0.020, 
        lon: lon+0.030, 
        address: "789 Wellness St", 
        distanceMiles: 1.5,
        testTypes: ['blood-work', 'imaging', 'infectious-disease'],
        phone: "1-800-SALUD"
      },
      { 
        id: "mock-diagnostico", 
        name: "Centro de Diagnóstico", 
        lat: lat-0.030, 
        lon: lon-0.025, 
        address: "321 Diagnostic Blvd", 
        distanceMiles: 2.1,
        testTypes: ['imaging', 'pathology'],
        phone: "1-800-DIAGNOSTIC"
      },
      { 
        id: "mock-clinica", 
        name: "Clínica Especializada", 
        lat: lat+0.040, 
        lon: lon+0.035, 
        address: "654 Specialty Rd", 
        distanceMiles: 2.8,
        testTypes: ['cardiac', 'specialty', 'pathology'],
        phone: "1-800-CLINICA"
      },
      { 
        id: "mock-radiologia", 
        name: "Centro de Radiología", 
        lat: lat+0.050, 
        lon: lon-0.040, 
        address: "987 Imaging Way", 
        distanceMiles: 3.2,
        testTypes: ['imaging'],
        phone: "1-800-RADIOLOGIA"
      }
    ];
    
    // Calculate actual distances using Haversine formula
    return mockLabs.map(lab => {
      const distanceKm = calculateDistance(lat, lon, lab.lat, lab.lon);
      return {
        ...lab,
        distanceMiles: distanceKm * 0.621371 // Convert km to miles
      };
    });
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
