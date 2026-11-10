import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FamilyDocument {
  id: string;
  memberId: string; // Which family member this belongs to
  memberName: string;
  name: string;
  category: 'prescription' | 'lab_result' | 'vaccine' | 'insurance' | 'other';
  tags: string[];
  photoUri?: string;
  scanData?: string; // Base64 or local file path
  createdAt: string;
  updatedAt: string;
  uploadedBy: string; // User ID who uploaded (guardian for children, self for adults)
  notes?: string;
}

const STORAGE_KEYS = {
  FAMILY_DOCUMENTS: 'familyDocuments:all',
};

class FamilyDocumentsService {
  private static instance: FamilyDocumentsService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new FamilyDocumentsService();
    }
    return this.instance;
  }

  /**
   * Get all documents for a specific family member
   * @param memberId The family member ID
   * @returns Array of documents for that member
   */
  async getDocumentsForMember(memberId: string): Promise<FamilyDocument[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAMILY_DOCUMENTS);
      if (!stored) return [];
      
      const allDocuments: FamilyDocument[] = JSON.parse(stored);
      return allDocuments.filter(doc => doc.memberId === memberId);
    } catch (error) {
      console.error('Error getting family documents:', error);
      return [];
    }
  }

  /**
   * Get all documents across all family members
   */
  async getAllDocuments(): Promise<FamilyDocument[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.FAMILY_DOCUMENTS);
      if (!stored) return [];
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error getting all family documents:', error);
      return [];
    }
  }

  /**
   * Add a new document for a family member
   * @param document The document to add
   * @returns The saved document with generated ID
   */
  async addDocument(
    document: Omit<FamilyDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FamilyDocument> {
    try {
      const newDocument: FamilyDocument = {
        ...document,
        id: `familydoc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existing = await this.getAllDocuments();
      const updated = [...existing, newDocument];
      
      await AsyncStorage.setItem(STORAGE_KEYS.FAMILY_DOCUMENTS, JSON.stringify(updated));
      
      return newDocument;
    } catch (error) {
      console.error('Error adding family document:', error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(documentId: string, updates: Partial<FamilyDocument>): Promise<void> {
    try {
      const existing = await this.getAllDocuments();
      const index = existing.findIndex(doc => doc.id === documentId);
      
      if (index === -1) {
        throw new Error('Document not found');
      }

      existing[index] = {
        ...existing[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.FAMILY_DOCUMENTS, JSON.stringify(existing));
    } catch (error) {
      console.error('Error updating family document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const existing = await this.getAllDocuments();
      const filtered = existing.filter(doc => doc.id !== documentId);
      
      await AsyncStorage.setItem(STORAGE_KEYS.FAMILY_DOCUMENTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting family document:', error);
      throw error;
    }
  }

  /**
   * Delete all documents for a specific family member
   * Used when a family member is removed
   */
  async deleteAllDocumentsForMember(memberId: string): Promise<void> {
    try {
      const existing = await this.getAllDocuments();
      const filtered = existing.filter(doc => doc.memberId !== memberId);
      
      await AsyncStorage.setItem(STORAGE_KEYS.FAMILY_DOCUMENTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting member documents:', error);
      throw error;
    }
  }

  /**
   * Export all documents for a member as JSON (always accessible, even after trial)
   */
  async exportDocumentsForMember(memberId: string): Promise<string> {
    const documents = await this.getDocumentsForMember(memberId);
    return JSON.stringify(documents, null, 2);
  }

  /**
   * Check if a user can add/edit documents for a member
   * Read-only access is always granted (export, view, delete)
   * @param memberId The family member
   * @param hasPremium Whether user has active premium
   * @returns { canAdd: boolean, canView: boolean, canDelete: boolean }
   */
  canAccessMemberDocuments(
    memberId: string,
    hasPremium: boolean,
    permissions?: { shareDocuments?: boolean }
  ): { canAdd: boolean; canView: boolean; canDelete: boolean } {
    // View, export, and delete are always allowed (read-only access after trial)
    const canView = true;
    const canDelete = true;
    
    // Add/edit requires active premium AND shareDocuments permission (for invited adults)
    const canAdd = hasPremium && (permissions?.shareDocuments !== false);
    
    return { canAdd, canView, canDelete };
  }

  /**
   * Get document counts by category for a member
   */
  async getDocumentCountsByCategory(memberId: string): Promise<Record<string, number>> {
    const documents = await this.getDocumentsForMember(memberId);
    const counts: Record<string, number> = {
      prescription: 0,
      lab_result: 0,
      vaccine: 0,
      insurance: 0,
      other: 0,
    };

    documents.forEach(doc => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });

    return counts;
  }
}

export default FamilyDocumentsService;
