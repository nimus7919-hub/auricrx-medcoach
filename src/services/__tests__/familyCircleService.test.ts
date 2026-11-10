import FamilyCircleService from '../familyCircleService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('FamilyCircleService', () => {
  let service: FamilyCircleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = FamilyCircleService.getInstance();
  });

  describe('Family Invite Code Generation', () => {
    it('should generate unique invite codes', async () => {
      const member = {
        id: 'member-123',
        name: 'Test Member',
        relationship: 'Parent',
        createdAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([member]));

      const code1 = await service.generateInviteCode(member.id);
      const code2 = await service.generateInviteCode(member.id);

      expect(code1).toMatch(/^FC\d+[A-Z0-9]{6}$/); // Format: FC + timestamp + 6 chars
      expect(code1).not.toBe(code2); // Should be different each time
    });

    it('should store invite code with member', async () => {
      const member = {
        id: 'member-456',
        name: 'Jane Doe',
        relationship: 'Spouse',
        createdAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([member]));

      await service.generateInviteCode(member.id);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData[0].inviteCode).toMatch(/^FC\d+[A-Z0-9]{6}$/);
    });
  });

  describe('Invite Acceptance Flow', () => {
    it('should accept valid invite with permissions', async () => {
      const inviteCode = 'FC123456ABCDEF';
      const member = {
        id: 'member-789',
        name: 'John Smith',
        relationship: 'Child',
        inviteCode,
        createdAt: new Date().toISOString(),
      };

      const permissions = {
        viewMeds: true,
        editDoses: false,
        receiveAlerts: true,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([member]));

      const result = await service.acceptInvite(inviteCode, permissions);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('John Smith');
      expect(result?.inviteAccepted).toBe(true);
      expect(result?.permissions).toEqual(permissions);
    });

    it('should return null for invalid invite code', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const result = await service.acceptInvite('INVALID-CODE', {
        viewMeds: false,
        editDoses: false,
        receiveAlerts: false,
      });

      expect(result).toBeNull();
    });

    it('should store permissions with accepted invite', async () => {
      const inviteCode = 'FC987654ZYXWVU';
      const member = {
        id: 'member-101',
        name: 'Alice Brown',
        relationship: 'Sibling',
        inviteCode,
        createdAt: new Date().toISOString(),
      };

      const permissions = {
        viewMeds: true,
        editDoses: true,
        receiveAlerts: false,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([member]));

      await service.acceptInvite(inviteCode, permissions);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData[0].permissions).toEqual(permissions);
      expect(savedData[0].inviteAccepted).toBe(true);
    });
  });

  describe('Free Tier Limits', () => {
    it('should allow adding 1 member on free tier', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      const canAdd = await service.canAddMember(false); // false = not premium

      expect(canAdd.allowed).toBe(true);
    });

    it('should block adding 2nd member on free tier', async () => {
      const existingMember = {
        id: 'member-1',
        name: 'First Member',
        relationship: 'Spouse',
        createdAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingMember]));

      const canAdd = await service.canAddMember(false); // false = not premium

      expect(canAdd.allowed).toBe(false);
      expect(canAdd.reason).toBe('free_limit_reached');
    });

    it('should allow unlimited members with premium', async () => {
      const existingMembers = Array.from({ length: 10 }, (_, i) => ({
        id: `member-${i}`,
        name: `Member ${i}`,
        relationship: 'Family',
        createdAt: new Date().toISOString(),
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingMembers));

      const canAdd = await service.canAddMember(true); // true = premium

      expect(canAdd.allowed).toBe(true);
    });
  });

  describe('Member Revocation', () => {
    it('should remove member and stop alerts', async () => {
      const member = {
        id: 'member-to-remove',
        name: 'Removed Member',
        relationship: 'Friend',
        createdAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([member]));

      await service.revokeMemberAccess(member.id);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toEqual([]); // Member should be removed
    });
  });
});
