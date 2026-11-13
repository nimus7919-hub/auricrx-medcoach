import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Document {
  id: string;
  title: string;
  type: 'lab' | 'prescription' | 'visit' | 'imaging' | 'other';
  familyMemberId?: string;
  memberName?: string;
  date: string;
  uri: string;
  pages?: string[];
  notes?: string;
  createdAt: string;
}

export interface LabValue {
  id: string;
  documentId?: string;
  testName: string;
  value: string;
  unit?: string;
  date: string;
  familyMemberId?: string;
  memberName?: string;
  notes?: string;
}

export interface DoctorQuestion {
  id: string;
  question: string;
  category?: string;
  createdAt: string;
  answered?: boolean;
  answer?: string;
}

const STORAGE_KEYS = {
  DOCUMENTS: 'labDocuments:documents',
  LAB_VALUES: 'labDocuments:labValues',
  DOCTOR_QUESTIONS: 'labDocuments:doctorQuestions',
};

class LabDocumentService {
  private static instance: LabDocumentService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new LabDocumentService();
    }
    return this.instance;
  }

  async getDocuments(memberId?: string, type?: string): Promise<Document[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      let docs: Document[] = data ? JSON.parse(data) : [];
      
      if (memberId) {
        docs = docs.filter(d => d.familyMemberId === memberId);
      }
      if (type) {
        docs = docs.filter(d => d.type === type);
      }
      
      return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  async addDocument(doc: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
    const documents = await this.getDocuments();
    const newDoc: Document = {
      ...doc,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    documents.push(newDoc);
    await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    return newDoc;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const documents = await this.getDocuments();
    const index = documents.findIndex(d => d.id === id);
    if (index !== -1) {
      documents[index] = { ...documents[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    }
  }

  async deleteDocument(id: string): Promise<void> {
    const documents = await this.getDocuments();
    const filtered = documents.filter(d => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filtered));
  }

  async getLabValues(memberId?: string, testName?: string): Promise<LabValue[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAB_VALUES);
      let values: LabValue[] = data ? JSON.parse(data) : [];
      
      if (memberId) {
        values = values.filter(v => v.familyMemberId === memberId);
      }
      if (testName) {
        values = values.filter(v => v.testName.toLowerCase().includes(testName.toLowerCase()));
      }
      
      return values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error loading lab values:', error);
      return [];
    }
  }

  async addLabValue(value: Omit<LabValue, 'id'>): Promise<LabValue> {
    const values = await this.getLabValues();
    const newValue: LabValue = {
      ...value,
      id: `labval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    values.push(newValue);
    await AsyncStorage.setItem(STORAGE_KEYS.LAB_VALUES, JSON.stringify(values));
    return newValue;
  }

  async deleteLabValue(id: string): Promise<void> {
    const values = await this.getLabValues();
    const filtered = values.filter(v => v.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.LAB_VALUES, JSON.stringify(filtered));
  }

  async getDoctorQuestions(): Promise<DoctorQuestion[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_QUESTIONS);
      const questions: DoctorQuestion[] = data ? JSON.parse(data) : [];
      return questions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error loading doctor questions:', error);
      return [];
    }
  }

  async addDoctorQuestion(question: Omit<DoctorQuestion, 'id' | 'createdAt'>): Promise<DoctorQuestion> {
    const questions = await this.getDoctorQuestions();
    const newQuestion: DoctorQuestion = {
      ...question,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    questions.push(newQuestion);
    await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_QUESTIONS, JSON.stringify(questions));
    return newQuestion;
  }

  async updateDoctorQuestion(id: string, updates: Partial<DoctorQuestion>): Promise<void> {
    const questions = await this.getDoctorQuestions();
    const index = questions.findIndex(q => q.id === id);
    if (index !== -1) {
      questions[index] = { ...questions[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_QUESTIONS, JSON.stringify(questions));
    }
  }

  async deleteDoctorQuestion(id: string): Promise<void> {
    const questions = await this.getDoctorQuestions();
    const filtered = questions.filter(q => q.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_QUESTIONS, JSON.stringify(filtered));
  }

  /** Glossary entry ids — copy lives in i18n `labOrganizer.glossaryTerms.*`. */
  getLabGlossaryKeys(): string[] {
    return [
      'glucose',
      'hemoglobin',
      'cholesterol',
      'creatinine',
      'triglycerides',
      'tsh',
      'hba1c',
      'alt',
      'ast',
      'wbc',
    ];
  }

  /** @deprecated Prefer getLabGlossaryKeys() + t('labOrganizer.glossaryTerms.<id>') */
  getLabGlossary(): { [key: string]: { en: string; es: string } } {
    // Kept for any legacy callers; UI should use i18n so language settings apply.
    const keys = this.getLabGlossaryKeys();
    const out: { [key: string]: { en: string; es: string } } = {};
    for (const key of keys) {
      out[key] = { en: key, es: key };
    }
    return out;
  }
}

export default LabDocumentService;
