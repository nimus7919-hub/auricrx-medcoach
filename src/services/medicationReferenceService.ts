/**
 * Medication Reference Service
 * 
 * Provides static, sourced reference information about medication pairings.
 * This is NOT a personalized interaction checker or clinical decision support tool.
 * 
 * COMPLIANCE: Designed for COFEPRIS compliance (Mexico medical device regulations).
 * - Shows unedited source text only
 * - No severity ratings, recommendations, or clinical advice
 * - No "no interactions found" messages
 * - Always directs users to consult healthcare providers
 */

import { validateComplianceText } from '../config/complianceFeatures';

/**
 * Reference source information
 */
export interface ReferenceSource {
  id: string;
  name: string;
  nameEs: string;
  url: string;
  lastChecked: string; // ISO date string
  version?: string;
}

/**
 * Medication reference entry
 */
export interface MedicationReferenceEntry {
  id: string;
  medication1: string;
  medication2: string;
  sourceText: string; // Unedited text from the source
  sourceTextEs: string; // Spanish translation of source text
  sourceId: string; // Reference to ReferenceSource
  sourceUrl?: string; // Direct link to this specific entry
  lastUpdated: string; // ISO date string
}

/**
 * Fixed, versioned list of reference sources
 */
export const REFERENCE_SOURCES: readonly ReferenceSource[] = [
  {
    id: 'dailymed',
    name: 'DailyMed (U.S. National Library of Medicine)',
    nameEs: 'DailyMed (Biblioteca Nacional de Medicina de EE.UU.)',
    url: 'https://dailymed.nlm.nih.gov/',
    lastChecked: '2026-11-10',
    version: 'November 2026'
  },
  {
    id: 'medlineplus',
    name: 'MedlinePlus Drug Information',
    nameEs: 'MedlinePlus Información de Medicamentos',
    url: 'https://medlineplus.gov/druginformation.html',
    lastChecked: '2026-11-10',
    version: 'November 2026'
  },
  {
    id: 'cofepris_ipp',
    name: 'COFEPRIS IPP (Información Para Prescribir)',
    nameEs: 'COFEPRIS IPP (Información Para Prescribir)',
    url: 'https://www.gob.mx/cofepris',
    lastChecked: '2026-11-10',
    version: 'November 2026'
  }
];

/**
 * Static medication reference entries
 * NOTE: In production, this would be loaded from a versioned data file
 */
const REFERENCE_ENTRIES: readonly MedicationReferenceEntry[] = [
  {
    id: 'warfarin_nsaids',
    medication1: 'Warfarin',
    medication2: 'NSAIDs',
    sourceText: 'The concomitant use of warfarin with many classes of medications, including NSAIDs, may increase the risk of bleeding. Monitor patients receiving warfarin and NSAIDs for signs and symptoms of bleeding.',
    sourceTextEs: 'El uso concomitante de warfarina con muchas clases de medicamentos, incluidos los AINE, puede aumentar el riesgo de sangrado. Monitorear a los pacientes que reciben warfarina y AINE en busca de signos y síntomas de sangrado.',
    sourceId: 'dailymed',
    sourceUrl: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9f4f22d0-b592-45cc-9f45-7d23f456048c',
    lastUpdated: '2026-11-10'
  },
  // Additional entries would be added here in production
];

/**
 * Medication Reference Service
 */
export class MedicationReferenceService {
  private static instance: MedicationReferenceService;

  static getInstance(): MedicationReferenceService {
    if (!MedicationReferenceService.instance) {
      MedicationReferenceService.instance = new MedicationReferenceService();
    }
    return MedicationReferenceService.instance;
  }

  /**
   * Search for reference entries matching two medications
   * @returns Array of matching reference entries (may be empty)
   */
  searchReferences(med1: string, med2: string): MedicationReferenceEntry[] {
    const med1Lower = med1.toLowerCase().trim();
    const med2Lower = med2.toLowerCase().trim();

    return REFERENCE_ENTRIES.filter(entry => {
      const entry1Lower = entry.medication1.toLowerCase();
      const entry2Lower = entry.medication2.toLowerCase();

      return (
        (entry1Lower.includes(med1Lower) && entry2Lower.includes(med2Lower)) ||
        (entry1Lower.includes(med2Lower) && entry2Lower.includes(med1Lower))
      );
    });
  }

  /**
   * Get a reference source by ID
   */
  getSource(sourceId: string): ReferenceSource | undefined {
    return REFERENCE_SOURCES.find(source => source.id === sourceId);
  }

  /**
   * Get all reference sources
   */
  getAllSources(): readonly ReferenceSource[] {
    return REFERENCE_SOURCES;
  }

  /**
   * Validate that reference text complies with regulations
   */
  validateReferenceEntry(entry: MedicationReferenceEntry): boolean {
    if (__DEV__) {
      validateComplianceText(entry.sourceText, `Reference entry ${entry.id} (English)`);
      validateComplianceText(entry.sourceTextEs, `Reference entry ${entry.id} (Spanish)`);
    }
    return true;
  }

  /**
   * Get pairing notice text (for when automatic notices are enabled)
   * This is the ONLY acceptable automatic notice text per legal requirements
   */
  getPairingNoticeText(sourceName: string, sourceDate: string, language: 'en' | 'es'): string {
    if (language === 'es') {
      return `Estos medicamentos aparecen juntos en ${sourceName} (consultado el ${sourceDate}). Esto no es una evaluación de tu caso. Consulta a tu farmacéutico o médico.`;
    } else {
      return `These medicines appear together in ${sourceName} (checked ${sourceDate}). This is not an assessment of your situation. Ask your pharmacist or doctor.`;
    }
  }

  /**
   * Get the "no match found" disclaimer text
   */
  getNoMatchDisclaimerText(language: 'en' | 'es'): string {
    if (language === 'es') {
      return 'La ausencia de un aviso no significa que una combinación sea segura.';
    } else {
      return 'Not seeing a notice doesn\'t mean a combination is safe.';
    }
  }
}

export default MedicationReferenceService;
