import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import PremiumButton from "./../components/PremiumButton";
import { requestSearchLocationPermission } from "./../lib/locationPermission";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";
import LocationRequiredPanel from "./../components/LocationRequiredPanel";
import { styles } from "./appStyles";
import { PremiumEntitlementService } from "../services/premiumEntitlementService";
import PremiumUpgradeScreen from "./PremiumUpgradeScreen";
import { resolveSearchLocation } from "../utils/resolveSearchLocation";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createPharmacies(getScope) {
  return () => {
  useUILanguage();
    const { lang, pharmacies, setPharmacies, pharmaciesLoading, setPharmaciesLoading, pharmaciesError, setPharmaciesError, labsLoading, labsError, S, theme, userCountry, Header } = getScope();

    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [entitlement, setEntitlement] = useState(null);
    const [locationBlocked, setLocationBlocked] = useState(false);
    
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
        feature="pharmacy" 
      />;
    }

    // Use pre-loaded data from main App component
    // No need for local state - using pharmacies, pharmaciesLoading, pharmaciesError from main component

    // Refresh function - reloads data if needed
    const refreshPharmacies = async () => {
      try {
        const ent = await PremiumEntitlementService.getInstance().checkPremiumAccess();
        if (!ent.hasPremiumAccess) {
          setEntitlement(ent);
          setShowUpgrade(true);
          return;
        }
        
        setPharmaciesLoading(true);
        setPharmaciesError(null);
        setLocationBlocked(false);
        setPharmacies([]);
        
        const { status } = await requestSearchLocationPermission();
        let coords = null;
        let positionError = null;
        if (status === 'granted') {
          try {
            const position = await Location.getCurrentPositionAsync({});
            coords = position.coords;
          } catch (error) {
            positionError = error;
          }
        }
        const resolved = resolveSearchLocation({ permissionStatus: status, coords, positionError });
        if (!resolved.ok) {
          setLocationBlocked(true);
          setPharmaciesError(uiI18n.t('locationSearch.locationOffMessage'));
          return;
        }
        
        const { findNearbyPharmacies } = await import('../../services/pharmacySearch');
        const nearbyPharmacies = await findNearbyPharmacies(resolved.coords.latitude, resolved.coords.longitude, lang, { noCache: true });
        
        setPharmacies(nearbyPharmacies);
        setLocationBlocked(false);
        setLastUpdated(new Date());
        console.log('🏪 Refreshed pharmacies:', nearbyPharmacies.length);
      } catch (e) {
        console.error('Error refreshing pharmacies:', e);
        setLocationBlocked(false);
        setPharmaciesError(uiI18n.t("localized.Pharmacies.refreshPharmacies.text47"));
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
          uiI18n.t("ui.phoneNotAvailable"),
          uiI18n.t("ui.noPhoneNumberFoundForValuePleaseTryCallingThemDirectlyOrVisitTheirWebsite_781fca", { value1: pharmacy.name }),
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
        uiI18n.t("ui.callPharmacy"),
        uiI18n.t("ui.callValueValue_59a584", { value1: pharmacy.name, value2: phoneNumber }),
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

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.pharmacyLocations} />
        <View style={{ backgroundColor: '#10243A', borderColor: '#C9A962', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: '#C9A962', fontSize: 12 }}>{uiI18n.t("localized.Pharmacies.text128")}</Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>{uiI18n.t("ui.fuenteProfecoQuienEsQuienEnLosPreciosCcBy40")}</Text>
        </View>
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, opacity: 0.8 }}>
              {pharmacies.length > 0 
                ? (S.foundPharmacies || uiI18n.t("pharmacies.foundPharmacies")).replace('{count}', pharmacies.length)
                : (S.findNearbyPharmacies || uiI18n.t("pharmacies.findNearbyPharmacies"))
              }
            </DynamicText>
            <PremiumButton 
              style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8 }]} 
              onPress={refreshPharmacies}
              disabled={pharmaciesLoading}
            >
              <DynamicText type="card" style={[styles.btnText, { fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                {pharmaciesLoading ? S.loading : S.refresh}
              </DynamicText>
            </PremiumButton>
          </View>

          {/* Location required / error */}
          {(locationBlocked || pharmaciesError === uiI18n.t('locationSearch.locationOffMessage')) ? (
            <LocationRequiredPanel onRetry={refreshPharmacies} style={{ marginBottom: 16 }} />
          ) : pharmaciesError ? (
            <View style={{ backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2, padding: 12, borderRadius: 18, marginBottom: 16 }}>
              <DynamicText type="card" style={{ color: '#c62828', fontFamily: 'Inter_600SemiBold' }}>{pharmaciesError}</DynamicText>
              <PremiumButton
                style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10, alignSelf: 'flex-start' }]}
                onPress={refreshPharmacies}
                disabled={pharmaciesLoading}
              >
                <DynamicText type="card" style={[styles.btnText, { fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                  {uiI18n.t('locationSearch.retry')}
                </DynamicText>
              </PremiumButton>
            </View>
          ) : null}

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
                        {pharmacy.pickup ? uiI18n.t("medications.filters.pickup") : ''} {pharmacy.delivery ? uiI18n.t("medications.filters.delivery") : ''}
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
              <Text style={{ color: theme.sub, fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>{uiI18n.t("ui.noPharmaciesLoadedYet")}</Text>
              <PremiumButton 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={refreshPharmacies}
              >
                <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{uiI18n.t("pharmacies.findNearbyPharmacies")}</Text>
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
