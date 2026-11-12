import Modal from '../components/BackModal';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import PremiumButton from "./../components/PremiumButton";
import { requestSearchLocationPermission } from "./../lib/locationPermission";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, Linking, Platform } from 'react-native';
import * as Location from "expo-location";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";
import { styles } from "./appStyles";
import { PremiumEntitlementService } from "../services/premiumEntitlementService";
import PremiumUpgradeScreen from "./PremiumUpgradeScreen";
import { FAB_SCROLL_PADDING } from "../layout/fabLayout";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createLabs(getScope) {
  return () => {
  useUILanguage();
    const { lang, labs, setLabs, labsLoading, setLabsLoading, labsError, setLabsError, S, theme, userCountry, Header } = getScope();

    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedLab, setSelectedLab] = useState(null);
    const [showTestTypes, setShowTestTypes] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [entitlement, setEntitlement] = useState(null);
    
    useEffect(() => {
      checkPremiumAccess();
    }, []);
    
    const checkPremiumAccess = async () => {
      const ent = await PremiumEntitlementService.getInstance().checkPremiumAccess();
      setEntitlement(ent);
      if (!ent.hasPremiumAccess) {
        setShowUpgrade(true);
      }
    };
    
    if (showUpgrade && entitlement) {
      return <PremiumUpgradeScreen 
        onClose={() => setShowUpgrade(false)} 
        entitlement={entitlement} 
        feature="lab" 
      />;
    }

    // Use pre-loaded data from main App component
    // No need for local state - using labs, labsLoading, labsError from main component

    // Refresh function - reloads data if needed
    const refreshLabs = async () => {
      try {
        const ent = await PremiumEntitlementService.getInstance().checkPremiumAccess();
        if (!ent.hasPremiumAccess) {
          setEntitlement(ent);
          setShowUpgrade(true);
          return;
        }
        
        setLabsLoading(true);
        setLabsError(null);
        
        const { status } = await requestSearchLocationPermission();
        if (status !== 'granted') {
          setLabsError(uiI18n.t("ui.locationPermissionDeniedPleaseEnableLocationServices"));
          return;
        }
        
        setLabsLoading(true);
        const { coords } = await Location.getCurrentPositionAsync({});
        
        // Import the lab search function
        const { findNearbyLabs, getTestTypesForLab } = await import('../../services/labSearch');
        const nearbyLabs = await findNearbyLabs(coords.latitude, coords.longitude, lang, { noCache: true });
        
        // Add test types to each lab
        const labsWithTests = nearbyLabs.map(lab => ({
          ...lab,
          testTypes: lab.testTypes || getTestTypesForLab(lab.name)
        }));
        
        setLabs(labsWithTests);
        setLastUpdated(new Date());
        console.log('🧪 Refreshed labs:', labsWithTests.length);
      } catch (e) {
        console.error('Error refreshing labs:', e);
        setLabsError(uiI18n.t("ui.failedToRefreshLabsPleaseTryAgain"));
      } finally {
        setLabsLoading(false);
      }
    };

    const formatDistance = (miles) => {
      // Use location-based units: miles for USA, kilometers for other countries
      console.log(`🧪 LAB formatDistance called with:`, { miles, userCountry });
      if (userCountry === 'US') {
        console.log(`🧪 LAB Using miles: ${miles.toFixed(1)} mi`);
        return `${miles.toFixed(1)} ${S.mi}`;
      } else {
        const km = miles * 1.60934;
        console.log(`🧪 LAB Conversion: ${miles} miles × 1.60934 = ${km} km`);
        console.log(`🧪 LAB Final display: ${km.toFixed(1)} km`);
        return `${km.toFixed(1)} ${S.km}`;
      }
    };

    const openDirections = (lab) => {
      const q = encodeURIComponent(lab.name);
            const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${lab.lat},${lab.lon}`,
        android: `geo:${lab.lat},${lab.lon}?q=${q}`,
              default: `https://www.google.com/maps/search/?api=1&query=${q}`,
            });
            Linking.openURL(url);
    };

    const callLab = (lab) => {
      // Debug logging
      console.log('🔍 callLab DEBUG - RECEIVED DATA:', {
        labName: lab.name,
        labPhone: lab.phone,
        labWebsite: lab.website,
        labRating: lab.rating,
        labAddress: lab.address,
        labId: lab.id,
        fullLabObject: lab
      });
      
      // Use only the real phone number from the API
      const phoneNumber = lab.phone;
      
      if (!phoneNumber) {
        console.log('❌ No phone number found for lab:', lab.name);
        // Show alert if no phone number available
        Alert.alert(
          uiI18n.t("ui.phoneNotAvailable"),
          uiI18n.t("ui.noPhoneNumberFoundForValuePleaseTryCallingThemDirectlyOrVisitTheirWebsite", { value1: lab.name }),
          [
            { text: uiI18n.t("adminProfile.ok"), style: 'cancel' }
          ]
        );
        return;
      }
      
      console.log('✅ Phone number found:', phoneNumber);
      
      // Clean up the phone number (remove spaces, dashes, etc.)
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneUrl = `tel:${cleanPhoneNumber}`;
      
      Alert.alert(
        uiI18n.t("ui.callLab"),
        uiI18n.t("ui.callValueValue", { value1: lab.name, value2: phoneNumber }),
        [
          { text: uiI18n.t("healthAnalytics.cancel"), style: 'cancel' },
          { 
            text: uiI18n.t("labs.buttons.call"), 
            onPress: () => {
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("common.pharmacy.callError"));
              });
            }
          }
        ]
      );
    };

    const showLabTestTypes = (lab) => {
      setSelectedLab(lab);
      setShowTestTypes(true);
    };

    const getTestTypeIcon = (testType) => {
      const icons = {
        'blood-work': '🩸',
        'imaging': '📷',
        'cardiac': '❤️',
        'pathology': '🔬',
        'infectious-disease': '🦠',
        'allergy': '🤧',
        'specialty': '⚕️'
      };
      return icons[testType] || '🧪';
    };

    const getTestTypeName = (testType) => {
      const names = {
        'blood-work': S.bloodWork,
        'imaging': S.imaging,
        'cardiac': S.cardiac,
        'pathology': S.pathology,
        'infectious-disease': S.infectiousDisease,
        'allergy': S.allergy,
        'specialty': S.specialty
      };
      return names[testType] || testType;
    };

    const getTestTypeDescription = (testType) => {
      const descriptions = {
        'blood-work': uiI18n.t("ui.completeBloodCountMetabolicPanelsLipidProfilesThyroidFunctionDiabetesScreeningVitaminLevel"),
        'imaging': uiI18n.t("ui.xRaysMriCtScansUltrasoundsMammographyBoneDensityTestsAndOtherDiagnosticImaging"),
        'cardiac': uiI18n.t("ui.ekgEcgStressTestsEchocardiogramsHolterMonitoringAndOtherHeartRelatedDiagnostics"),
        'pathology': uiI18n.t("ui.biopsiesCytologyHistologyCancerScreeningTumorMarkersAndGeneticTesting"),
        'infectious-disease': uiI18n.t("ui.covid19TestingFluTestsStdScreeningHepatitisPanelsHivTestingAndTuberculosisTests"),
        'allergy': uiI18n.t("ui.allergyTestingFoodAllergyPanelsEnvironmentalAllergyTestsPatchTestingAndRastTesting"),
        'specialty': uiI18n.t("ui.sleepStudiesPulmonaryFunctionTestsNeurologicalTestingEndocrinologyRheumatologyAndDermatolo")
      };
      return descriptions[testType] || uiI18n.t("ui.variousMedicalTestsAndDiagnosticsAvailable");
    };

    return (
      <>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: FAB_SCROLL_PADDING }}>
        <Header title={S.labsLocations} />
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, opacity: 0.8 }}>
              {labs.length > 0 
                ? (S.foundLabs || uiI18n.t("labs.foundLabs")).replace('{count}', labs.length)
                : (S.findNearbyLabs || uiI18n.t("labs.findNearbyLabs"))
              }
            </DynamicText>
            <PremiumButton 
              style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8 }]} 
              onPress={refreshLabs}
              disabled={labsLoading}
            >
              <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                {labsLoading ? S.loading : S.refresh}
              </Text>
            </PremiumButton>
          </View>

          {/* Error message */}
          {labsError && (
            <View style={{ backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2, padding: 12, borderRadius: 18, marginBottom: 16 }}>
              <DynamicText type="card" style={{ color: '#c62828', fontFamily: 'Inter_600SemiBold' }}>{labsError}</DynamicText>
            </View>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <DynamicText type="card" style={{ fontSize: 12, marginBottom: 16, fontFamily: 'Inter_500Medium', opacity: 0.7 }}>
              {S.lastUpdated}: {lastUpdated.toLocaleTimeString()}
            </DynamicText>
          )}

          {/* Labs list */}
          {labs.length > 0 ? (
            labs.map((lab, index) => (
              <View key={lab.id || index} style={{ 
                backgroundColor: getCardBackgroundColor() + 'CC', 
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                {/* Lab header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: theme.muted, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ fontSize: 20 }}>🧪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <DynamicText type="card" style={{ fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
                      {lab.name}
                    </DynamicText>
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                      {formatDistance(lab.distanceMiles)} • {lab.address}
                    </DynamicText>
                    {/* Test types preview */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                      {lab.testTypes && lab.testTypes.slice(0, 3).map((testType, idx) => (
                        <DynamicText key={idx} type="card" style={{ fontSize: 10, fontFamily: 'Inter_400Regular', marginRight: 8, opacity: 0.7 }}>
                          {getTestTypeIcon(testType)} {getTestTypeName(testType)}
                        </DynamicText>
                      ))}
                      {lab.testTypes && lab.testTypes.length > 3 && (
                        <DynamicText type="card" style={{ fontSize: 10, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                          +{lab.testTypes.length - 3} {S.moreLab.replace('+1 ', '')}
                        </DynamicText>
                      )}
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <PremiumButton 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.accent, 
                      borderRadius: 8, 
                      paddingVertical: 12, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => openDirections(lab)}
                  >
                    <Text style={{ fontSize: 16 }}>🗺️</Text>
                    <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>
                      {S.directions}
                    </DynamicText>
        </PremiumButton>
                </View>
              </View>
            ))
          ) : !labsLoading && !labsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <DynamicText type="card" style={{ fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>{uiI18n.t("ui.noLabsLoadedYet")}</DynamicText>
              <PremiumButton 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={refreshLabs}
              >
                <DynamicText type="card" style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{uiI18n.t("labs.findNearbyLabs")}</DynamicText>
              </PremiumButton>
            </View>
          ) : null}

          {/* Loading indicator */}
          {labsLoading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', opacity: 0.7 }}>{S.loadingLabs}</DynamicText>
            </View>
          )}
      </ScrollView>

        {/* Test Types Modal */}
        <Modal visible={showTestTypes} transparent animationType="slide" onRequestClose={() => setShowTestTypes(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={{ 
              backgroundColor: theme.card, 
              borderRadius: 16, 
              padding: 20, 
              maxHeight: '80%' 
            }}>
              <Text style={{ 
                color: theme.text, 
                fontSize: 14, 
                fontWeight: '600', 
                fontFamily: 'Inter_600SemiBold',
                marginBottom: 16 
              }}>
                {S.testTypes} - {selectedLab?.name}
              </Text>
              
              {selectedLab?.testTypes && (
                <ScrollView style={{ maxHeight: 400 }}>
                  {selectedLab.testTypes.map((testType, index) => (
                    <View key={index} style={{ 
                      backgroundColor: theme.muted, 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 8 
                    }}>
                      <Text style={{ 
                        color: theme.text, 
                        fontSize: 14, 
                        fontWeight: '600', 
                        fontFamily: 'Inter_600SemiBold',
                        marginBottom: 4 
                      }}>
                        {getTestTypeIcon(testType)} {getTestTypeName(testType)}
                      </Text>
                      <Text style={{ 
                        color: theme.sub, 
                        fontSize: 12, 
                        fontFamily: 'Inter_400Regular' 
                      }}>
                        {getTestTypeDescription(testType)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              <PremiumButton 
                style={{ 
                  backgroundColor: theme.accent, 
                  borderRadius: 8, 
                  paddingVertical: 12, 
                  alignItems: 'center',
                  marginTop: 16 
                }}
                onPress={() => setShowTestTypes(false)}
              >
                <Text style={{ 
                  color: '#ffffff', 
                  fontFamily: 'Inter_600SemiBold' 
                }}>
                  {S.close}
                </Text>
              </PremiumButton>
            </View>
          </View>
        </Modal>
      </>
  );
  };
}
