import PremiumButton from "./../components/PremiumButton";
import { requestSearchLocationPermission } from "./../lib/locationPermission";
import { useState } from "react";
import { View, Text, ScrollView, Alert, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";
import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createPharmacies(getScope) {
  return () => {
    const { lang, pharmacies, setPharmacies, pharmaciesLoading, setPharmaciesLoading, pharmaciesError, setPharmaciesError, labsLoading, labsError, S, theme, userCountry, Header } = getScope();

    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    const [lastUpdated, setLastUpdated] = useState(null);

    // Use pre-loaded data from main App component
    // No need for local state - using pharmacies, pharmaciesLoading, pharmaciesError from main component

    // Refresh function - reloads data if needed
    const refreshPharmacies = async () => {
      try {
        setPharmaciesLoading(true);
        setPharmaciesError(null);
        
        const { status } = await requestSearchLocationPermission();
        if (status !== 'granted') {
          setPharmaciesError('Location permission denied. Please enable location services.');
          return;
        }
        
        const { coords } = await Location.getCurrentPositionAsync({});
        
        // Import the pharmacy search function
        const { findNearbyPharmacies } = await import('../../services/pharmacySearch');
        const nearbyPharmacies = await findNearbyPharmacies(coords.latitude, coords.longitude, lang, { noCache: true });
        
        setPharmacies(nearbyPharmacies);
        setLastUpdated(new Date());
        console.log('🏪 Refreshed pharmacies:', nearbyPharmacies.length);
      } catch (e) {
        console.error('Error refreshing pharmacies:', e);
        setPharmaciesError('Failed to refresh pharmacies. Please try again.');
      } finally {
        setPharmaciesLoading(false);
      }
    };

    const formatDistance = (miles) => {
      // Use location-based units: miles for USA, kilometers for other countries
      if (userCountry === 'US') {
        return `${miles.toFixed(1)} ${S.mi}`;
      } else {
        const km = miles * 1.60934;
        return `${km.toFixed(1)} ${S.km}`;
      }
    };

    const openDirections = (pharmacy) => {
      const q = encodeURIComponent(pharmacy.name);
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${pharmacy.lat},${pharmacy.lon}`,
        android: `geo:${pharmacy.lat},${pharmacy.lon}?q=${q}`,
        default: `https://www.google.com/maps/search/?api=1&query=${q}`,
      });
      Linking.openURL(url);
    };

    const callPharmacy = (pharmacy) => {
      // Debug logging
      console.log('🔍 callPharmacy DEBUG - RECEIVED DATA:', {
        pharmacyName: pharmacy.name,
        pharmacyPhone: pharmacy.phone,
        pharmacyWebsite: pharmacy.website,
        pharmacyRating: pharmacy.rating,
        pharmacyAddress: pharmacy.address,
        pharmacyId: pharmacy.id,
        fullPharmacyObject: pharmacy
      });
      
      // Use only the real phone number from the API
      const phoneNumber = pharmacy.phone;
      
      if (!phoneNumber) {
        console.log('❌ No phone number found for pharmacy:', pharmacy.name);
        // Show alert if no phone number available
        Alert.alert(
          'Phone Not Available',
          `No phone number found for ${pharmacy.name}. Please try calling them directly or visit their website.`,
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
        'Call Pharmacy',
        `Call ${pharmacy.name}?\n${phoneNumber}`,
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

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.pharmacyLocations} />
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, opacity: 0.8 }}>
              {pharmacies.length > 0 
                ? (S.foundPharmacies || 'Found {count} pharmacies nearby').replace('{count}', pharmacies.length)
                : (S.findNearbyPharmacies || 'Find nearby pharmacies')
              }
            </DynamicText>
            <PremiumButton 
              style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8 }]} 
              onPress={refreshPharmacies}
              disabled={labsLoading}
            >
              <DynamicText type="card" style={[styles.btnText, { fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                {labsLoading ? S.loading : S.refresh}
              </DynamicText>
            </PremiumButton>
          </View>

          {/* Error message */}
          {pharmaciesError && (
            <View style={{ backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2, padding: 12, borderRadius: 18, marginBottom: 16 }}>
              <DynamicText type="card" style={{ color: '#c62828', fontFamily: 'Inter_600SemiBold' }}>{pharmaciesError}</DynamicText>
          </View>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <DynamicText type="card" style={{ fontSize: 12, marginBottom: 16, fontFamily: 'Inter_500Medium', opacity: 0.7 }}>
              {S.lastUpdated}: {lastUpdated.toLocaleTimeString()}
            </DynamicText>
          )}

          {/* Pharmacies list */}
          {pharmacies.length > 0 ? (
            pharmacies.map((pharmacy, index) => (
              <View key={pharmacy.id || index} style={{ 
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
                {/* Pharmacy header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 12, 
                    backgroundColor: getCardBackgroundColor() + '80', 
                    borderColor: getCardBorderColor(),
                    borderWidth: 1,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ fontSize: 20 }}>🏪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_700Bold' }}>
                      {pharmacy.name}
                    </DynamicText>
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_500Medium', opacity: 0.7 }}>
                      {formatDistance(pharmacy.distanceMiles)} • {pharmacy.address}
                    </DynamicText>
                    {/* Additional info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <DynamicText type="card" style={{ fontSize: 10, fontFamily: 'Inter_400Regular', opacity: 0.6 }}>
                        {pharmacy.pickup ? '🏃 Pickup' : ''} {pharmacy.delivery ? '🚚 Delivery' : ''}
                      </DynamicText>
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
                    onPress={() => openDirections(pharmacy)}
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
              <Text style={{ color: theme.sub, fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>
                No pharmacies loaded yet
              </Text>
              <PremiumButton 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={refreshPharmacies}
              >
                <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>
                  Find Nearby Pharmacies
                </Text>
              </PremiumButton>
            </View>
          ) : null}

          {/* Loading indicator */}
          {pharmaciesLoading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular' }}>{S.loadingPharmacies}</Text>
            </View>
          )}
        </ScrollView>
    );
  };
}
