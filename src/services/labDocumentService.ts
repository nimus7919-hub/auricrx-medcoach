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

  getLabGlossary(): { [key: string]: { en: string; es: string } } {
    return {
      'glucose': {
        es: 'Glucosa: Azúcar en la sangre. Mide el nivel de energía disponible.',
        en: 'Glucose: Sugar in the blood. Measures available energy level.'
      },
      'hemoglobin': {
        es: 'Hemoglobina: Proteína que transporta oxígeno en la sangre.',
        en: 'Hemoglobin: Protein that carries oxygen in the blood.'
      },
      'cholesterol': {
        es: 'Colesterol: Grasa en la sangre. El colesterol total, HDL (bueno) y LDL (malo) ayudan a evaluar riesgo cardiovascular.',
        en: 'Cholesterol: Fat in the blood. Total cholesterol, HDL (good) and LDL (bad) help assess cardiovascular risk.'
      },
      'creatinine': {
        es: 'Creatinina: Producto de desecho muscular. Indica qué tan bien funcionan los riñones.',
        en: 'Creatinine: Muscle waste product. Indicates how well the kidneys are working.'
      },
      'triglycerides': {
        es: 'Triglicéridos: Tipo de grasa en la sangre.',
        en: 'Triglycerides: Type of fat in the blood.'
      },
      'tsh': {
        es: 'TSH (Hormona Estimulante de la Tiroides): Controla la producción de hormonas tiroideas. Indica función tiroidea.',
        en: 'TSH (Thyroid Stimulating Hormone): Controls thyroid hormone production. Indicates thyroid function.'
      },
      'hba1c': {
        es: 'HbA1c (Hemoglobina Glicosilada): Promedio de glucosa en sangre durante 2-3 meses. Importante para monitoreo de diabetes.',
        en: 'HbA1c (Glycated Hemoglobin): Average blood glucose over 2-3 months. Important for diabetes monitoring.'
      },
      'alt': {
        es: 'ALT (Alanina Aminotransferasa): Enzima del hígado.',
        en: 'ALT (Alanine Aminotransferase): Liver enzyme.'
      },
      'ast': {
        es: 'AST (Aspartato Aminotransferasa): Enzima presente en hígado, corazón y músculos.',
        en: 'AST (Aspartate Aminotransferase): Enzyme present in liver, heart and muscles.'
      },
      'wbc': {
        es: 'Leucocitos (WBC): Glóbulos blancos que combaten infecciones.',
        en: 'White Blood Cells (WBC): Fight infections.'
      },
    };
  }
}

export default LabDocumentService;
