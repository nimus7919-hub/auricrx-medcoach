import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAMILY_CIRCLE_FREE_MEMBER_LIMIT } from '../config/premiumFeatures';
import uiI18n from '../i18n';
import { getDateTimePickerLocale } from '../utils/dateTimeLocale';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthYear?: number;
  avatar?: string;
  createdAt: string;
  // F4: Adult invite-and-accept
  inviteCode?: string;
  inviteAccepted?: boolean;
  permissions?: {
    viewMeds: boolean;
    editDoses: boolean;
    receiveAlerts: boolean;
    shareDocuments?: boolean; // Family Documents: OFF by default, grant to let this member see/add their folder
  };
  // F5: Device-only adult profiles
  deviceOnly?: boolean;
  managedBy?: string; // User ID of manager
  // F6: Child profiles
  isChild?: boolean;
  guardianAttested?: boolean;
  excludeFromAI?: boolean;
  excludeFromSummaries?: boolean;
}

export interface DoseLog {
  id: string;
  memberId: string;
  memberName: string;
  medicationId?: string;
  medicationName: string;
  reminderId?: string;
  timestamp: string;
  markedBy: string;
  notes?: string;
}

export interface ShareConsent {
  memberId: string;
  agreedAt: string;
  expiresAt?: string;
}

const STORAGE_KEYS = {
  MEMBERS: 'familyCircle:members',
  DOSE_LOGS: 'familyCircle:doseLogs',
  SHARE_CONSENTS: 'familyCircle:shareConsents',
};

class FamilyCircleService {
  private static instance: FamilyCircleService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new FamilyCircleService();
    }
    return this.instance;
  }

  async getMembers(): Promise<FamilyMember[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEMBERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading family members:', error);
      return [];
    }
  }

  async canAddMember(hasPremiumAccess: boolean): Promise<{ allowed: boolean; reason?: string }> {
    const members = await this.getMembers();
    
    if (hasPremiumAccess) {
      return { allowed: true };
    }
    
    if (members.length >= FAMILY_CIRCLE_FREE_MEMBER_LIMIT) {
      return { 
        allowed: false, 
        reason: `free_limit_reached` // Free tier allows ${FAMILY_CIRCLE_FREE_MEMBER_LIMIT} member(s)
      };
    }
    
    return { allowed: true };
  }

  async addMember(member: Omit<FamilyMember, 'id' | 'createdAt'>): Promise<FamilyMember> {
    const members = await this.getMembers();
    const newMember: FamilyMember = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    members.push(newMember);
    await AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return newMember;
  }

  async updateMember(id: string, updates: Partial<FamilyMember>): Promise<void> {
    const members = await this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
      members[index] = { ...members[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }
  }

  async deleteMember(id: string): Promise<void> {
    const members = await this.getMembers();
    const filtered = members.filter(m => m.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
  }

  async getDoseLogs(memberId?: string): Promise<DoseLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DOSE_LOGS);
      const logs: DoseLog[] = data ? JSON.parse(data) : [];
      if (memberId) {
        return logs.filter(log => log.memberId === memberId);
      }
      return logs;
    } catch (error) {
      console.error('Error loading dose logs:', error);
      return [];
    }
  }

  async recordDose(log: Omit<DoseLog, 'id' | 'timestamp'>): Promise<DoseLog> {
    const logs = await this.getDoseLogs();
    const newLog: DoseLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    logs.push(newLog);
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    await AsyncStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(logs));
    return newLog;
  }

  async getShareConsent(memberId: string): Promise<ShareConsent | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SHARE_CONSENTS);
      const consents: ShareConsent[] = data ? JSON.parse(data) : [];
      const consent = consents.find(c => c.memberId === memberId);
      if (consent && consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
        return null;
      }
      return consent || null;
    } catch (error) {
      console.error('Error loading share consent:', error);
      return null;
    }
  }

  async recordShareConsent(memberId: string, expiresInDays?: number): Promise<void> {
    const consents = (await AsyncStorage.getItem(STORAGE_KEYS.SHARE_CONSENTS)) || '[]';
    const parsed: ShareConsent[] = JSON.parse(consents);
    const filtered = parsed.filter(c => c.memberId !== memberId);
    
    const newConsent: ShareConsent = {
      memberId,
      agreedAt: new Date().toISOString(),
      expiresAt: expiresInDays 
        ? new Date(Date.now() + expiresInDays * 86400000).toISOString() 
        : undefined,
    };
    
    filtered.push(newConsent);
    await AsyncStorage.setItem(STORAGE_KEYS.SHARE_CONSENTS, JSON.stringify(filtered));
  }

  async generateWeeklySummary(memberId?: string): Promise<string> {
    const logs = await this.getDoseLogs(memberId);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weekLogs = logs.filter(log => new Date(log.timestamp) >= weekAgo);
    
    const members = await this.getMembers();
    const locale = getDateTimePickerLocale();
    const memberName = memberId
      ? members.find(m => m.id === memberId)?.name
      : uiI18n.t('familyCircle.summaryFamily');
    
    let summary = `${uiI18n.t('familyCircle.weeklySummary')} - ${memberName}\n`;
    summary += `${uiI18n.t('familyCircle.summaryPeriod')}: ${weekAgo.toLocaleDateString(locale)} - ${new Date().toLocaleDateString(locale)}\n\n`;
    
    if (weekLogs.length === 0) {
      summary += `${uiI18n.t('familyCircle.summaryNoDoses')}\n`;
    } else {
      summary += `${weekLogs.length}\n\n`;
      
      const byMed = new Map<string, number>();
      weekLogs.forEach(log => {
        byMed.set(log.medicationName, (byMed.get(log.medicationName) || 0) + 1);
      });
      
      summary += `${uiI18n.t('familyCircle.summaryByMed')}:\n`;
      byMed.forEach((count, med) => {
        summary += `- ${med}: ${count}\n`;
      });
    }
    
    summary += `\n---\n${uiI18n.t('familyCircle.summaryGeneratedBy')}`;
    return summary;
  }

  // F4: Generate invite code for adult member
  async generateInviteCode(memberId: string): Promise<string> {
    const inviteCode = `FC${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await this.updateMember(memberId, { inviteCode });
    return inviteCode;
  }

  // F4: Accept invite with permissions
  async acceptInvite(
    inviteCode: string,
    permissions: { viewMeds: boolean; editDoses: boolean; receiveAlerts: boolean }
  ): Promise<FamilyMember | null> {
    const members = await this.getMembers();
    const member = members.find(m => m.inviteCode === inviteCode);
    
    if (!member) {
      return null;
    }

    await this.updateMember(member.id, {
      inviteAccepted: true,
      permissions,
    });

    return { ...member, inviteAccepted: true, permissions };
  }

  // F4: Revoke member access (leave Family Circle)
  async revokeMemberAccess(memberId: string): Promise<void> {
    await this.deleteMember(memberId);
    // Note: This will also stop alerts as member is removed
  }

  // F7: Schedule caregiver alert with compliant notification copy
  async scheduleCaregiverAlert(
    memberId: string,
    memberName: string,
    medicationName: string,
    doseTime: string
  ): Promise<void> {
    // TODO: Integrate with expo-notifications
    // F7 Block C: Minimal lock screen, detailed in-app
    
    const lockScreenTitle = uiI18n.t('familyCircle.caregiverAlertTitle', { name: memberName });
    const lockScreenBody = uiI18n.t('familyCircle.caregiverAlertBody', { detail: doseTime });
    
    const inAppTitle = uiI18n.t('familyCircle.caregiverAlertTitle', { name: memberName });
    const inAppBody = uiI18n.t('familyCircle.caregiverAlertBody', { detail: `${doseTime} — ${medicationName}` });
    const inAppFooter = uiI18n.t('familyCircle.alertDisclaimer');
    
    console.log('F7 Caregiver alert scheduled:', {
      lockScreenTitle,
      lockScreenBody,
      inAppTitle,
      inAppBody,
      inAppFooter,
      medication: medicationName,
      member: memberName,
    });
    
    // TODO: When implementing notifications:
    // - Lock screen: Use lockScreenTitle + lockScreenBody (minimal)
    // - In-app detail: Use inAppTitle + inAppBody + inAppFooter
    // - Include alertDisclaimer from i18n when showing in-app
  }
}

export default FamilyCircleService;
