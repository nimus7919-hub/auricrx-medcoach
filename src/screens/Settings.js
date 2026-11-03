import { resetSearchLocationConsent } from "../lib/locationPermission";
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import { useTimeFormat } from "./../hooks/useTimeFormat";
import { formatTime } from "./../utils/time";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createSettings(getScope) {
  return () => {
  useUILanguage();
    const { setRoute, setPrivacyOpen, handleSignOut, handleCancelMembership, handleRestartMembership, lang, notificationsEnabled, setNotificationsEnabled, emailNotifications, setEmailNotifications, smsNotifications, setSmsNotifications, selectedAIDoctor, setSelectedAIDoctor, dataCollection, setDataCollection, analytics, setAnalytics, subscriptionStatus, t, currentLanguage, handleLanguageChange, S, theme, setExpandedSections, CollapsibleSection, Header, RowSwitch, SwitchRow } = getScope();

    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    const { timeFormat, setTimeFormat, getTimeFormatOptions, getTimeFormatLabel } = useTimeFormat({
      translations: {
        useDeviceSetting: t('settings.useDeviceSetting'),
        twelveHour: t('settings.twelveHour'),
        twentyFourHour: t('settings.twentyFourHour'),
      }
    });
    
    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };
    
    return (
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
        scrollsToTop={false}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <Header title={S.settings} />
        
        <CollapsibleSection title={S.profile} sectionKey="profile" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', marginBottom: 12, opacity: 0.7 }}>{S.appDescription}</DynamicText>
            <TouchableOpacity 
              onPress={() => setRoute('admin-profile')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_700Bold', 
                fontSize: 15,
                textAlign: 'center'
              }}>{S.profile}</DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.healthProfile} sectionKey="healthProfile" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity 
              onPress={() => setRoute('health-profile')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_700Bold', 
                fontSize: 15,
                textAlign: 'center',
                marginBottom: 4,
                width: '100%',
                alignSelf: 'center'
              }}>{S.healthProfileSettings}</DynamicText>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_400Regular', 
                fontSize: 12, 
                opacity: 0.7,
                textAlign: 'center'
              }}>
                {S.fastingProfileDescription}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.myDoctorAI} sectionKey="aiDoctor" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ marginBottom: 12 }}>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_600SemiBold', 
                fontSize: 14,
                marginBottom: 8,
                opacity: 0.8
              }}>{S.selectAI || uiI18n.t("ai.selectAI")}</DynamicText>
              
              <TouchableOpacity 
                onPress={() => setSelectedAIDoctor('alfred')}
                style={[styles.settingsButton, {
                  backgroundColor: selectedAIDoctor === 'alfred' ? theme.muted : getCardBackgroundColor() + 'CC',
                  borderColor: selectedAIDoctor === 'alfred' ? theme.accent : getCardBorderColor(),
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold', 
                  fontSize: 15,
                  textAlign: 'center'
                }}>💬 {S.alfred || uiI18n.t("ai.alfred")}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setSelectedAIDoctor('mimi')}
                style={[styles.settingsButton, {
                  backgroundColor: selectedAIDoctor === 'mimi' ? theme.muted : getCardBackgroundColor() + 'CC',
                  borderColor: selectedAIDoctor === 'mimi' ? theme.accent : getCardBorderColor(),
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold', 
                  fontSize: 15,
                  textAlign: 'center'
                }}>💬 {S.mimi || uiI18n.t("ai.mimi")}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setSelectedAIDoctor('pawlmer')}
                style={[styles.settingsButton, {
                  backgroundColor: selectedAIDoctor === 'pawlmer' ? theme.muted : getCardBackgroundColor() + 'CC',
                  borderColor: selectedAIDoctor === 'pawlmer' ? theme.accent : getCardBorderColor(),
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center'
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold', 
                  fontSize: 15,
                  textAlign: 'center'
                }}>🐱 {S.pawlmer || uiI18n.t("ai.pawlmer")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </CollapsibleSection>
        
        <TouchableOpacity onPress={() => setPrivacyOpen(true)} style={{ padding: 16 }}><Text style={{ color: theme.text }}>{uiI18n.t("localized.Settings.text189")}</Text></TouchableOpacity>
        <CollapsibleSection title={S.wallpaper} sectionKey="wallpaper" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity 
              onPress={() => setRoute('wallpaper')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_700Bold', 
                fontSize: 15,
                textAlign: 'center',
                marginBottom: 4
              }}>{S.changeWallpaper}</DynamicText>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_400Regular', 
                fontSize: 12, 
                opacity: 0.7,
                textAlign: 'center'
              }}>
                {S.chooseWallpaperDescription}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={t('settings.timeFormat')} sectionKey="timeFormat" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <DynamicText type="card" style={{ 
              fontFamily: 'Inter_400Regular', 
              fontSize: 12, 
              opacity: 0.7,
              marginBottom: 12,
              textAlign: 'center'
            }}>
              {t('settings.timeFormatDescription')}
            </DynamicText>
            
            {getTimeFormatOptions().map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setTimeFormat(option.value)}
                style={{
                  backgroundColor: timeFormat === option.value ? theme.muted : getCardBackgroundColor(),
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: timeFormat === option.value ? theme.accent : getCardBorderColor(),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_600SemiBold', 
                  fontSize: 14
                }}>
                  {option.label}
                </DynamicText>
                {timeFormat === option.value && (
                  <DynamicText type="card" style={{ 
                    fontSize: 16
                  }}>
                    ✓
                  </DynamicText>
                )}
              </TouchableOpacity>
            ))}
            
            {/* Preview */}
            <View style={{
              backgroundColor: getCardBackgroundColor() + '50',
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
              borderWidth: 1,
              borderColor: getCardBorderColor() + '50'
            }}>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_500Medium', 
                fontSize: 12, 
                opacity: 0.8,
                textAlign: 'center',
                marginBottom: 4
              }}>
                {t('settings.preview')}:
              </DynamicText>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_600SemiBold', 
                fontSize: 14,
                textAlign: 'center'
              }}>
                {formatTime('13:30', { format: timeFormat })}
              </DynamicText>
            </View>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.notifications} sectionKey="notifications" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <RowSwitch
              label={S.pushNotifications}
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <RowSwitch
              label={S.emailNotifications}
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
            <RowSwitch
              label={S.smsNotifications}
              value={smsNotifications}
              onValueChange={setSmsNotifications}
            />
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.security} sectionKey="security" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity 
              onPress={() => setRoute('admin-profile')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold' }}>{S.changePassword}</DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.privacy} sectionKey="privacy" onToggle={toggleSection}>
          <TouchableOpacity style={{ padding: 16 }} onPress={async () => {
            try {
              await resetSearchLocationConsent();
              Alert.alert(uiI18n.t("locationSearch.reset"), uiI18n.t("locationSearch.resetDone"));
            } catch {
              Alert.alert(uiI18n.t("locationSearch.reset"), uiI18n.t("locationSearch.resetError"));
            }
          }}>
            <DynamicText type="card">{uiI18n.t("locationSearch.reset")}</DynamicText>
          </TouchableOpacity>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <RowSwitch
              label={S.dataCollection}
              value={dataCollection}
              onValueChange={setDataCollection}
            />
            <RowSwitch
              label={S.analytics}
              value={analytics}
              onValueChange={setAnalytics}
            />
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.language} sectionKey="language" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <SwitchRow
              label={S.english}
              value={currentLanguage === 'en'}
              onValueChange={() => handleLanguageChange('en')}
            />
            <SwitchRow
              label={S.spanish}
              value={currentLanguage === 'es'}
              onValueChange={() => handleLanguageChange('es')}
            />
            <SwitchRow
              label={S.portuguese}
              value={currentLanguage === 'pt'}
              onValueChange={() => handleLanguageChange('pt')}
            />
            <SwitchRow
              label={S.french}
              value={currentLanguage === 'fr'}
              onValueChange={() => handleLanguageChange('fr')}
            />
            <SwitchRow
              label={S.german}
              value={currentLanguage === 'de'}
              onValueChange={() => handleLanguageChange('de')}
            />
            <SwitchRow
              label={S.chinese}
              value={currentLanguage === 'zh'}
              onValueChange={() => handleLanguageChange('zh')}
            />
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.help} sectionKey="help" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', marginBottom: 12, opacity: 0.7 }}>{S.emailUs}</DynamicText>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.accent }}>{S.emailAddress}</DynamicText>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.subscription || uiI18n.t("settings.subscription")} sectionKey="subscription" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            {subscriptionStatus && (
              <View style={{ marginBottom: 12 }}>
                {/* Status: Pro (only show days if cancelled) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  <DynamicText type="card" style={{ 
                    fontFamily: 'Inter_600SemiBold', 
                    fontSize: 14,
                    opacity: 0.8,
                    marginRight: 8
                  }}>
                    {S.status || uiI18n.t("ai.status")}:
                  </DynamicText>
                  <DynamicText type="card" style={{ 
                    fontFamily: 'Inter_700Bold', 
                    fontSize: 14,
                    color: subscriptionStatus.plan === 'pro' ? '#22c55e' : '#f59e0b',
                    marginRight: 8
                  }}>
                    {subscriptionStatus.plan === uiI18n.t("settings.proPlan") ? (S.proPlan || uiI18n.t("settings.proPlan")) : (S.trial || uiI18n.t("settings.trial"))}
                  </DynamicText>
                  {/* Only show days if subscription is cancelled */}
                  {subscriptionStatus.subscription_cancelled_at && subscriptionStatus.daysLeft !== undefined && subscriptionStatus.daysLeft >= 0 && (
                    <DynamicText type="card" style={{ 
                      fontFamily: 'Inter_400Regular', 
                      fontSize: 12,
                      opacity: 0.7
                    }}>
                      ({subscriptionStatus.daysLeft} {S.daysUntilCancellation || uiI18n.t("settings.daysUntilCancellation")})
                    </DynamicText>
                  )}
                </View>
              </View>
            )}
            
            <DynamicText type="card" style={{ marginBottom: 12 }}>{uiI18n.t("settings.proPlan")}{t('subscriptionPlans.month')} / {t('subscriptionPlans.year')}
            </DynamicText>

            {/* Cancel or Restart Button */}
            {subscriptionStatus && subscriptionStatus.subscription_cancelled_at ? (
              <TouchableOpacity 
                onPress={handleRestartMembership}
                style={[styles.settingsButton, {
                  backgroundColor: '#22c55e',
                  borderColor: '#16a34a',
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#22c55e',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold',
                  color: '#ffffff',
                  fontSize: 15,
                  textAlign: 'center'
                }}>
                  {S.restartMembership || uiI18n.t("settings.restartMembership")}
                </DynamicText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={handleCancelMembership}
                style={[styles.settingsButton, {
                  backgroundColor: '#f59e0b',
                  borderColor: '#d97706',
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold',
                  color: '#ffffff',
                  fontSize: 15,
                  textAlign: 'center'
                }}>
                  {S.cancelMembership || uiI18n.t("settings.cancelMembership")}
                </DynamicText>
              </TouchableOpacity>
            )}
          </View>
        </CollapsibleSection>
        
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <TouchableOpacity 
            onPress={handleSignOut}
            style={[styles.settingsButton, {
              backgroundColor: '#dc2626',
              borderColor: '#b91c1c',
              borderWidth: 2,
              borderRadius: 18,
              paddingVertical: 16,
              paddingHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#dc2626',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }]}
          >
            <DynamicText type="card" style={{ 
              fontFamily: 'Inter_700Bold',
              color: '#ffffff',
              fontSize: 16,
              textAlign: 'center'
            }}>
              {S.signOut}
            </DynamicText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
}
