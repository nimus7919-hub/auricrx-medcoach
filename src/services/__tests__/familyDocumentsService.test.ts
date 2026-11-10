import FamilyDocumentsService from '../familyDocumentsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('FamilyDocumentsService', () => {
  let service: FamilyDocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = FamilyDocumentsService.getInstance();
  });

  describe('Permission Gating', () => {
    it('should allow read-only access without premium (view, export, delete)', () => {
      const access = service.canAccessMemberDocuments('member-1', false);

      expect(access.canView).toBe(true);
      expect(access.canDelete).toBe(true);
      expect(access.canAdd).toBe(false); // Cannot add without premium
    });

    it('should allow add/edit with premium and shareDocuments permission', () => {
      const access = service.canAccessMemberDocuments('member-1', true, {
        shareDocuments: true,
      });

      expect(access.canView).toBe(true);
      expect(access.canDelete).toBe(true);
      expect(access.canAdd).toBe(true); // Can add with premium + permission
    });

    it('should deny add/edit with premium but no shareDocuments permission', () => {
      const access = service.canAccessMemberDocuments('member-1', true, {
        shareDocuments: false,
      });

      expect(access.canView).toBe(true);
      expect(access.canDelete).toBe(true);
      expect(access.canAdd).toBe(false); // Cannot add without shareDocuments permission
    });

    it('should allow add/edit for guardians (no permission required)', () => {
      const access = service.canAccessMemberDocuments('child-member-1', true, undefined);

      expect(access.canView).toBe(true);
      expect(access.canDelete).toBe(true);
      expect(access.canAdd).toBe(true); // Guardian can add for their children
    });

    it('should deny add/edit after trial expires (no premium)', () => {
      const access = service.canAccessMemberDocuments('member-1', false, {
        shareDocuments: true,
      });

      expect(access.canView).toBe(true); // Read-only still allowed
      expect(access.canDelete).toBe(true); // Delete still allowed
      expect(access.canAdd).toBe(false); // Cannot add after trial expires
    });
  });

  describe('Document Management', () => {
    it('should add a document for a family member', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const doc = await service.addDocument({
        memberId: 'member-1',
        memberName: 'John Doe',
        name: 'Lab Result',
        category: 'lab_result',
        tags: ['blood test'],
        uploadedBy: 'user-123',
      });

      expect(doc.id).toBeTruthy();
      expect(doc.memberId).toBe('member-1');
      expect(doc.name).toBe('Lab Result');
      expect(doc.category).toBe('lab_result');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should get documents for a specific member', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          memberId: 'member-1',
          memberName: 'John',
          name: 'Prescription',
          category: 'prescription',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
        {
          id: 'doc-2',
          memberId: 'member-2',
          memberName: 'Jane',
          name: 'Vaccine',
          category: 'vaccine',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

      const docs = await service.getDocumentsForMember('member-1');

      expect(docs).toHaveLength(1);
      expect(docs[0].memberId).toBe('member-1');
      expect(docs[0].name).toBe('Prescription');
    });

    it('should delete a document', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          memberId: 'member-1',
          memberName: 'John',
          name: 'Prescription',
          category: 'prescription',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

      await service.deleteDocument('doc-1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'familyDocuments:all',
        JSON.stringify([])
      );
    });

    it('should delete all documents for a member when member is removed', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          memberId: 'member-1',
          memberName: 'John',
          name: 'Prescription',
          category: 'prescription',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
        {
          id: 'doc-2',
          memberId: 'member-2',
          memberName: 'Jane',
          name: 'Vaccine',
          category: 'vaccine',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

      await service.deleteAllDocumentsForMember('member-1');

      const savedDocs = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedDocs).toHaveLength(1);
      expect(savedDocs[0].memberId).toBe('member-2');
    });

    it('should export documents as JSON', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          memberId: 'member-1',
          memberName: 'John',
          name: 'Prescription',
          category: 'prescription',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

      const exported = await service.exportDocumentsForMember('member-1');

      expect(exported).toContain('"memberId": "member-1"');
      expect(exported).toContain('"name": "Prescription"');
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('Document Categories', () => {
    it('should count documents by category', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          memberId: 'member-1',
          memberName: 'John',
          name: 'Prescription 1',
          category: 'prescription',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
        {
          id: 'doc-2',
          memberId: 'member-1',
          memberName: 'John',
          name: 'Prescription 2',
          category: 'prescription',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
        {
          id: 'doc-3',
          memberId: 'member-1',
          memberName: 'John',
          name: 'Lab Result',
          category: 'lab_result',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDocs));

      const counts = await service.getDocumentCountsByCategory('member-1');

      expect(counts.prescription).toBe(2);
      expect(counts.lab_result).toBe(1);
      expect(counts.vaccine).toBe(0);
    });
  });
});
