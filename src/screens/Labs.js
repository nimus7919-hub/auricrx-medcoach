import PremiumButton from "./../components/PremiumButton";
import { requestSearchLocationPermission } from "./../lib/locationPermission";
import { useState } from "react";
import { View, Text, ScrollView, Alert, Modal, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";
import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createLabs(getScope) {
  return () => {
    const { lang, labs, setLabs, labsLoading, setLabsLoading, labsError, setLabsError, S, theme, userCountry, Header } = getScope();

    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedLab, setSelectedLab] = useState(null);
    const [showTestTypes, setShowTestTypes] = useState(false);

    // Use pre-loaded data from main App component
    // No need for local state - using labs, labsLoading, labsError from main component

    // Refresh function - reloads data if needed
    const refreshLabs = async () => {
      try {
        setLabsLoading(true);
        setLabsError(null);
        
        const { status } = await requestSearchLocationPermission();
        if (status !== 'granted') {
          setLabsError('Location permission denied. Please enable location services.');
          return;
        }
        
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
        setLabsError('Failed to refresh labs. Please try again.');
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
          'Phone Not Available',
          `No phone number found for ${lab.name}. Please try calling them directly or visit their website.`,
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }
      
      console.log('✅ Phone number found:', phoneNumber);
      
      // Clean up the phone number (remove spaces, dashes, etc.)
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneUrl = `tel:${cleanPhoneNumber}`;
      
      Alert.alert(
        'Call Lab',
        `Call ${lab.name}?\n${phoneNumber}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert('Error', 'Unable to make phone call');
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
        'blood-work': 'Complete blood count, metabolic panels, lipid profiles, thyroid function, diabetes screening, vitamin levels, and more.',
        'imaging': 'X-rays, MRI, CT scans, ultrasounds, mammography, bone density tests, and other diagnostic imaging.',
        'cardiac': 'EKG/ECG, stress tests, echocardiograms, Holter monitoring, and other heart-related diagnostics.',
        'pathology': 'Biopsies, cytology, histology, cancer screening, tumor markers, and genetic testing.',
        'infectious-disease': 'COVID-19 testing, flu tests, STD screening, hepatitis panels, HIV testing, and tuberculosis tests.',
        'allergy': 'Allergy testing, food allergy panels, environmental allergy tests, patch testing, and RAST testing.',
        'specialty': 'Sleep studies, pulmonary function tests, neurological testing, endocrinology, rheumatology, and dermatology tests.'
      };
      return descriptions[testType] || 'Various medical tests and diagnostics available.';
    };

    return (
      <>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.labsLocations} />
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, opacity: 0.8 }}>
              {labs.length > 0 
                ? (S.foundLabs || 'Found {count} labs nearby').replace('{count}', labs.length)
                : (S.findNearbyLabs || 'Find nearby labs')
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
              <DynamicText type="card" style={{ fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                No labs loaded yet
              </DynamicText>
              <PremiumButton 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={refreshLabs}
              >
                <DynamicText type="card" style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>
                  Find Nearby Labs
                </DynamicText>
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
        <Modal visible={showTestTypes} transparent animationType="slide">
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
