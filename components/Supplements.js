import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Image, Keyboard, Alert, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import SupplementRefillModal from './SupplementRefillModal';
import DynamicText from '../src/components/DynamicText';
import { useWallpaper } from '../src/contexts/WallpaperContext';

// Supplements component moved outside App to prevent remounting
const Supplements = ({ supplements, setSupplements, S, theme, onNavigateToDashboard, onNavigateToSettings }) => {
  // Mount/unmount detection
  const mounted = useRef(0);
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getSubTextColor } = useWallpaper();

  // Unit options for supplements (common supplement dosage forms and units)
  const dosageUnits = [
    // Mass units
    'mcg', 'mg', 'g', 'kg',
    // International units
    'IU',
    // Special vitamin units
    'mcg DFE', 'mg NE', 'mg alpha-tocopherol',
    // Probiotics
    'CFU', 'billion CFU',
    // Enzyme activity units
    'HUT', 'DU', 'FIP', 'ALU', 'GDU', 'FCC units',
    // Dosage forms - solids
    'tablet', 'tablets', 'capsule', 'capsules', 'softgel', 'softgels', 'caplet', 'caplets', 
    'lozenge', 'lozenges', 'gummy', 'gummies', 'chewable', 'chewables',
    // Dosage forms - powders
    'scoop', 'scoops', 'tsp', 'tbsp',
    // Dosage forms - liquids
    'mL', 'L', 'drop', 'drops', 'spray', 'sprays', 'puff', 'puffs', 'actuation', 'actuations',
    // Dosage forms - others
    'patch', 'patches', 'sachet', 'sachets', 'stick pack', 'stick packs',
    // Concentrations
    'mg/mL', 'mcg/mL', 'mg/5mL', '% w/w', '% w/v', '% v/v',
    // Ratios
    '1:1', '1:2', '1:5',
    // General
    'serving', 'servings', 'unit', 'units'
  ];
  useEffect(() => {
    mounted.current += 1;
    console.log(`[SUPPLEMENTS] MOUNT #${mounted.current}`);
    return () => console.log(`[SUPPLEMENTS] UNMOUNT #${mounted.current}`);
  }, []);

  useEffect(() => {
    console.log(`[SUPPLEMENTS] showAdd ->`, showAdd);
  }, [showAdd]);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [filter, setFilter] = useState('all');
  const [detailSupp, setDetailSupp] = useState(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [holdUntil, setHoldUntil] = useState('');
  const [addForm, setAddForm] = useState({ 
    name: '', 
    times: '', 
    status: 'taking', 
    startDate: '', 
    endDate: '', 
    notes: '', 
    dosesLeft: '', 
    dosageValue: '', 
    dosageUnit: 'mg',
    brand: '' 
  });
  const [addTimes, setAddTimes] = useState([]);
  const [editTimes, setEditTimes] = useState([]);
  const [showSuppTimePicker, setShowSuppTimePicker] = useState(false);
  const [timeTarget, setTimeTarget] = useState(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiAnalysisQuery, setAiAnalysisQuery] = useState('');
  const [lastSearchedSupplement, setLastSearchedSupplement] = useState('');
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    times: '', 
    status: 'taking', 
    startDate: '', 
    endDate: '', 
    notes: '', 
    dosesLeft: '', 
    dosageValue: '', 
    dosageUnit: 'mg',
    brand: '' 
  });
  const [editingSupplement, setEditingSupplement] = useState(null);

  // Unit dropdown states
  const [showDosageUnitDropdown, setShowDosageUnitDropdown] = useState(false);
  const [showEditDosageUnitDropdown, setShowEditDosageUnitDropdown] = useState(false);

  // Refs for unit buttons to measure their position
  const dosageUnitButtonRef = useRef(null);
  const editDosageUnitButtonRef = useRef(null);

  // State to store layout of unit buttons
  const [dosageUnitButtonLayout, setDosageUnitButtonLayout] = useState(null);
  const [editDosageUnitButtonLayout, setEditDosageUnitButtonLayout] = useState(null);


  // Add keyboard event listeners to prevent modal from closing due to keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      console.log('[SUPPLEMENTS] Keyboard shown - preventing modal close');
      setInputFocused(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('[SUPPLEMENTS] Keyboard hidden');
      // Don't immediately set inputFocused to false, let the input onBlur handle it
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Reset form when modal opens and track modal state changes
  useEffect(() => {
    console.log('[SUPPLEMENTS] Modal state changed - showAdd:', showAdd);
    if (showAdd) {
      setAddForm({ name: '', times: '', status: 'taking', startDate: '', endDate: '', notes: '', dosesLeft: '', dosageValue: '', dosageUnit: 'tablet', brand: '' });
    } else {
      setInputFocused(false); // Reset input focus when modal closes
    }
  }, [showAdd]);

  const onSuppTimePicked = (_, date) => {
    setShowSuppTimePicker(false);
    if (date) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const t = `${hh}:${mm}`;
      
      if (timeTarget === 'add') {
        setAddTimes(prev => [...prev, t]);
      } else if (timeTarget === 'edit') {
        setEditTimes(prev => [...prev, t]);
      }
    }
  };

  const filteredSupplements = supplements.filter(supp => 
    filter === 'all' || supp.status === filter
  );

  const getSuppStatuses = () => {
    const statuses = [
      { key: 'taking', label: S.taking || 'Taking', emoji: '💊', color: '#2dd4bf' },
      { key: 'onhold', label: S.onHold || 'On Hold', emoji: '⏸️', color: '#fbbf24' },
      { key: 'prn', label: S.prn || 'PRN', emoji: '🕒', color: '#60a5fa' },
      { key: 'finished', label: S.finished || 'Finished', emoji: '✅', color: '#a3e635' },
      { key: 'stopped', label: S.stopped || 'Stopped', emoji: '⛔', color: '#f87171' }
    ];
    console.log('[SUPPLEMENTS] Status labels:', statuses.map(s => ({ key: s.key, label: s.label })));
    return statuses;
  };

  const getStatusObj = (status) => {
    return getSuppStatuses().find(s => s.key === status) || getSuppStatuses()[0];
  };

  const getUtilityTags = (supp) => {
    const tags = [];
    if (supp.refillSoon) tags.push({ label: S.refillSoon, color: '#fbbf24', emoji: '🛒' });
    if (supp.dosesLeft && parseInt(supp.dosesLeft) < 10) tags.push({ label: S.lowStock, color: '#f87171', emoji: '⚠️' });
    return tags;
  };

  const findNearbySupplements = async (supplementName) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert(S.locationDenied, S.enableLocation);
      
      // Store the searched supplement name for "Search Again" functionality
      setLastSearchedSupplement(supplementName);
      
      // Get user's current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Show loading state
      setShowAiAnalysis(true);
      setAiAnalysisQuery('Searching for nearby stores...');
      
      // Search for supplement stores using the same API pattern as pharmacies
      const response = await fetch(`https://auricrx-medcoach.onrender.com/supplements/nearby?lat=${latitude}&lon=${longitude}&supplement=${encodeURIComponent(supplementName)}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.ok && data.stores && data.stores.length > 0) {
        // Format the results for display
        const storeList = data.stores.map(store => 
          `🏪 ${store.name}\n📍 ${store.address}\n💰 $${store.price || 'Price varies'}\n📏 ${store.distanceMiles ? `${store.distanceMiles.toFixed(1)} mi` : 'Distance unknown'}\n${store.pickup ? '✅ Pickup available' : ''}${store.delivery ? '🚚 Delivery available' : ''}\n`
        ).join('\n');
        
        const results = `Found ${data.stores.length} stores selling ${supplementName}:\n\n${storeList}`;
        setAiAnalysisQuery(results);
      } else {
        // Fallback to AI-powered search if no specific stores found
        const aiQuery = `Find nearby stores selling ${supplementName} supplement with price comparison. Include pharmacies, health stores, and supplement shops. Provide store names, addresses, and estimated prices.`;
        setAiAnalysisQuery(aiQuery);
      }
      
    } catch (error) {
      console.error('Error searching for supplements:', error);
      // Fallback to AI-powered search
      const aiQuery = `Find nearby stores selling ${supplementName} supplement with price comparison. Include pharmacies, health stores, and supplement shops. Provide store names, addresses, and estimated prices.`;
      setShowAiAnalysis(true);
      setAiAnalysisQuery(aiQuery);
    }
  };

  const addSupplement = () => {
    if (!addForm.name.trim()) return;
    const newSupp = {
      id: Date.now().toString(),
      name: addForm.name.trim(),
      brand: addForm.brand ? addForm.brand.trim() : '',
      dosage: `${addForm.dosageValue.trim()} ${addForm.dosageUnit}`.trim(),
      dosageValue: addForm.dosageValue.trim(),
      dosageUnit: addForm.dosageUnit,
      times: addTimes,
      status: addForm.status,
      startDate: addForm.startDate,
      endDate: addForm.endDate,
      notes: addForm.notes ? addForm.notes.trim() : '',
      dosesLeft: addForm.dosesLeft ? addForm.dosesLeft.trim() : '',
      refillSoon: false
    };
    setSupplements(prev => [...prev, newSupp]);
    setAddForm({ name: '', times: '', status: 'taking', startDate: '', endDate: '', notes: '', dosesLeft: '', dosageValue: '', dosageUnit: 'tablet', brand: '' });
    setAddTimes([]);
    setShowAdd(false);
  };

  const updateSupplement = () => {
    if (!editForm.name.trim() || !editingSupplement) return;
    setSupplements(prev => prev.map(supp => 
      supp.id === editingSupplement.id 
        ? {
            ...supp,
            name: editForm.name.trim(),
            brand: editForm.brand ? editForm.brand.trim() : '',
            dosage: `${editForm.dosageValue.trim()} ${editForm.dosageUnit}`.trim(),
            dosageValue: editForm.dosageValue.trim(),
            dosageUnit: editForm.dosageUnit,
            times: editTimes.join(', '),
            status: editForm.status,
            startDate: editForm.startDate,
            endDate: editForm.endDate,
            notes: editForm.notes ? editForm.notes.trim() : '',
            dosesLeft: editForm.dosesLeft ? editForm.dosesLeft.trim() : ''
          }
        : supp
    ));
    setEditForm({ name: '', times: '', status: 'taking', startDate: '', endDate: '', notes: '', dosesLeft: '', dosageValue: '', dosageUnit: 'tablet', brand: '' });
    setEditTimes([]);
    setEditingSupplement(null);
    setShowEdit(false);
  };

  const updateSupplementStatus = (suppId, newStatus) => {
    setSupplements(prev => prev.map(supp => 
      supp.id === suppId ? { ...supp, status: newStatus } : supp
    ));
    setShowStatusSheet(false);
  };

  const styles = StyleSheet.create({
    section: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.chip,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Inter_600SemiBold',
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
    },
    button: {
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingTop: 50, 
        paddingHorizontal: 20, 
        paddingVertical: 16,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.chip
      }}>
        <TouchableOpacity 
          onPress={onNavigateToDashboard} 
          style={{
            padding: 0,
            backgroundColor: 'transparent',
            marginLeft: -65,
          }}
        >
          <Image 
            source={require('../assets/AuricRX_home_button_across_screens.png')} 
            style={{
              width: 180,
              height: 70,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <DynamicText type="primary" style={{ 
          fontSize: 18, 
          fontFamily: 'Inter_800ExtraBold', 
          position: 'absolute', 
          left: '50%', 
          transform: [{ translateX: -50 }], 
          maxWidth: '60%' 
        }} numberOfLines={1}>
          {S.supplements}
        </DynamicText>

        <TouchableOpacity onPress={onNavigateToSettings} style={{ padding: 8 }}>
          <Text style={{ fontSize: 18, color: theme.accent }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        {/* Header with Filter and Add buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <TouchableOpacity 
            onPress={() => setShowFilterModal(true)}
            style={[styles.section, { backgroundColor: getCardBackgroundColor() + '80', padding: 12, width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderColor: getCardBorderColor() }]}
          >
            <Image source={require('../icon-library/filter-button-screen-med.png')} style={{ width: 22, height: 22, tintColor: getCardTextColor() }} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowAdd(true)}
            style={[styles.section, { backgroundColor: theme.accent + 'CC', borderColor: theme.accent, padding: 12, flex: 1 }]}
          >
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>+ {S.addSupplement}</DynamicText>
          </TouchableOpacity>
        </View>

        {/* Supplements List */}
        {filteredSupplements.map(supp => {
          const statusObj = getStatusObj(supp.status);
          const utilityTags = getUtilityTags(supp);

          return (
            <View
              key={supp.id}
              style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), marginBottom: 12, padding: 16 }]}
            >
              {/* Header row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>
                    {supp.name}
                  </DynamicText>
                  {supp.brand && (
                    <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                      {supp.brand}
                    </DynamicText>
                  )}
                  {supp.dosage && (
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_500Medium', opacity: 0.8, marginTop: 2 }}>
                      {supp.dosage}
                    </DynamicText>
                  )}
                  {supp.times && (
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_400Regular', opacity: 0.6, marginTop: 2 }}>
                      {supp.times}
                    </DynamicText>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setDetailSupp(supp);
                      setShowStatusSheet(true);
                    }}
                    style={{
                      backgroundColor: theme.accent,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: theme.accent
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                      Edit
                    </DynamicText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        S.deleteSupplement || 'Delete Supplement',
                        S.deleteSupplementConfirm || 'Are you sure you want to delete this supplement?',
                        [
                          { text: S.cancel || 'Cancel', style: 'cancel' },
                          { 
                            text: S.delete || 'Delete', 
                            style: 'destructive',
                            onPress: () => {
                              setSupplements(prev => prev.filter(s => s.id !== supp.id));
                            }
                          }
                        ]
                      );
                    }}
                    style={{
                      backgroundColor: '#ff4444',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#ff4444'
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                      Delete
                    </DynamicText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {filteredSupplements.length === 0 && (
          <View style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), padding: 20, alignItems: 'center' }]}>
            <DynamicText type="secondary" style={{ fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
              {S.noSupplementsFound}
            </DynamicText>
          </View>
        )}
      </View>
      </ScrollView>

      {/* Add Supplement Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{S.addSupplement}</DynamicText>
            
            <TextInput
              placeholder={S.supplementName}
              placeholderTextColor={getSubTextColor()}
              style={[styles.input, { 
                color: getCardTextColor(), 
                borderColor: getCardBorderColor(),
                backgroundColor: getCardBackgroundColor()
              }]}
              value={addForm.name}
              onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            
            <TextInput
              placeholder={S.brand}
              placeholderTextColor={getSubTextColor()}
              style={[styles.input, { 
                color: getCardTextColor(), 
                borderColor: getCardBorderColor(),
                backgroundColor: getCardBackgroundColor()
              }]}
              value={addForm.brand}
              onChangeText={(text) => setAddForm(prev => ({ ...prev, brand: text }))}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
            
            {/* Dosage Value and Unit */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                placeholder="30"
                placeholderTextColor={getSubTextColor()}
                value={addForm.dosageValue}
                onChangeText={(text) => setAddForm(prev => ({ ...prev, dosageValue: text }))}
                style={{
                  flex: 1,
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                keyboardType="numeric"
              />
              
              <TouchableOpacity
                ref={dosageUnitButtonRef}
                onPress={() => {
                  dosageUnitButtonRef.current?.measureInWindow((x, y, width, height) => {
                    setDosageUnitButtonLayout({ x, y, width, height });
                  });
                  setShowDosageUnitDropdown(true);
                }}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: getCardBorderColor(),
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  minWidth: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 4
                }}
              >
                <DynamicText 
                  type="card" 
                  style={{ 
                    fontSize: 14,
                    color: getCardTextColor(),
                    fontFamily: 'Inter_600SemiBold'
                  }}
                >
                  {addForm.dosageUnit}
                </DynamicText>
                <DynamicText 
                  type="sub" 
                  style={{ 
                    fontSize: 12,
                    color: getSubTextColor()
                  }}
                >
                  ▼
                </DynamicText>
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder={S.notesOptional}
              placeholderTextColor={getSubTextColor()}
              style={[styles.input, { 
                color: getCardTextColor(), 
                borderColor: getCardBorderColor(),
                backgroundColor: getCardBackgroundColor()
              }]}
              value={addForm.notes}
              onChangeText={(text) => setAddForm(prev => ({ ...prev, notes: text }))}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoCapitalize="sentences"
              autoCorrect={true}
              returnKeyType="default"
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity 
                onPress={() => setShowAdd(false)}
                style={[styles.button, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor(), flex: 1 }]}
              >
                <DynamicText type="card" style={{ color: getCardTextColor(), textAlign: 'center' }}>{S.cancel}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={addSupplement}
                style={[styles.button, { backgroundColor: theme.accent, flex: 1 }]}
              >
                <DynamicText type="card" style={{ color: '#fff', textAlign: 'center' }}>{S.addSupplement}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal visible={showStatusSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>Update Status</DynamicText>
            
            {getSuppStatuses().map(status => (
              <TouchableOpacity
                key={status.key}
                onPress={() => updateSupplementStatus(detailSupp?.id, status.key)}
                style={[styles.section, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor(), marginBottom: 8, padding: 12 }]}
              >
                <DynamicText type="card" style={{ color: getCardTextColor(), fontFamily: 'Inter_600SemiBold' }}>
                  {status.emoji} {status.label}
                </DynamicText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* AI Analysis Modal */}
      <Modal visible={showAiAnalysis} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <DynamicText type="card" style={styles.modalTitle}>AI Analysis</DynamicText>
              <TouchableOpacity onPress={() => setShowAiAnalysis(false)}>
                <DynamicText type="sub" style={{ fontSize: 18 }}>✕</DynamicText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <DynamicText type="card" style={{ color: getCardTextColor(), fontFamily: 'Inter_400Regular', lineHeight: 20 }}>
                {aiAnalysisQuery}
              </DynamicText>
            </ScrollView>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity 
                onPress={() => setShowAiAnalysis(false)}
                style={[styles.button, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor(), flex: 1 }]}
              >
                <DynamicText type="card" style={{ color: getCardTextColor(), textAlign: 'center' }}>Close</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setShowAiAnalysis(false);
                  if (lastSearchedSupplement) {
                    findNearbySupplements(lastSearchedSupplement);
                  }
                }}
                style={[styles.button, { backgroundColor: theme.accent, flex: 1 }]}
              >
                <DynamicText type="card" style={{ color: '#fff', textAlign: 'center' }}>Search Again</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Supplement Modal */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{S.editSupplement || 'Edit Supplement'}</DynamicText>
            
            <TextInput
              placeholder={S.supplementName}
              placeholderTextColor={getSubTextColor()}
              style={[styles.input, { 
                color: getCardTextColor(), 
                borderColor: getCardBorderColor(),
                backgroundColor: getCardBackgroundColor()
              }]}
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              placeholder={S.brand}
              placeholderTextColor={getSubTextColor()}
              style={[styles.input, { 
                color: getCardTextColor(), 
                borderColor: getCardBorderColor(),
                backgroundColor: getCardBackgroundColor()
              }]}
              value={editForm.brand}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, brand: text }))}
            />
            
            {/* Dosage Value and Unit */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                placeholder="30"
                placeholderTextColor={getSubTextColor()}
                value={editForm.dosageValue}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, dosageValue: text }))}
                style={{
                  flex: 1,
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                keyboardType="numeric"
              />
              
              <TouchableOpacity
                ref={editDosageUnitButtonRef}
                onPress={() => {
                  editDosageUnitButtonRef.current?.measureInWindow((x, y, width, height) => {
                    setEditDosageUnitButtonLayout({ x, y, width, height });
                  });
                  setShowEditDosageUnitDropdown(true);
                }}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: getCardBorderColor(),
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  minWidth: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 4
                }}
              >
                <DynamicText 
                  type="card" 
                  style={{ 
                    fontSize: 14,
                    color: getCardTextColor(),
                    fontFamily: 'Inter_600SemiBold'
                  }}
                >
                  {editForm.dosageUnit}
                </DynamicText>
                <DynamicText 
                  type="sub" 
                  style={{ 
                    fontSize: 12,
                    color: getSubTextColor()
                  }}
                >
                  ▼
                </DynamicText>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: getCardBackgroundColor(), 
                borderColor: getCardBorderColor(), 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }]}
              onPress={() => {
                setTimeTarget('edit');
                setShowSuppTimePicker(true);
              }}
            >
              <DynamicText type="card" style={{ color: editTimes.length > 0 ? getCardTextColor() : getSubTextColor() }}>
                {editTimes.length > 0 ? editTimes.join(', ') : S.selectTimes}
              </DynamicText>
              <DynamicText type="sub">🕐</DynamicText>
            </TouchableOpacity>
            
            <TextInput
              placeholder={S.notesOptional}
              placeholderTextColor={getSubTextColor()}
              style={[styles.input, { 
                color: getCardTextColor(), 
                borderColor: getCardBorderColor(),
                backgroundColor: getCardBackgroundColor()
              }]}
              value={editForm.notes}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, notes: text }))}
              multiline
            />
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity 
                onPress={() => setShowEdit(false)}
                style={[styles.button, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor(), flex: 1 }]}
              >
                <DynamicText type="card" style={{ color: getCardTextColor(), textAlign: 'center' }}>{S.cancel}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={updateSupplement}
                style={[styles.button, { backgroundColor: theme.accent, flex: 1 }]}
              >
                <DynamicText type="card" style={{ color: '#fff', textAlign: 'center' }}>{S.save || 'Save'}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Supplement Refill Modal */}
      {selectedSupplement && (
        <SupplementRefillModal
          visible={showRefillModal}
          onClose={() => {
            setShowRefillModal(false);
            setSelectedSupplement(null);
          }}
          supplement={{
            name: selectedSupplement.name,
            brand: selectedSupplement.brand,
            dosage: selectedSupplement.dosage,
            lastRefill: selectedSupplement.lastRefill
          }}
          strings={S}
          lang={S.language || 'en'}
        />
      )}

      {/* Time Picker */}
      {showSuppTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onSuppTimePicked}
        />
      )}

      {/* Dropdown Components */}
      <DosageUnitDropdown
        visible={showDosageUnitDropdown}
        units={dosageUnits}
        selectedUnit={addForm.dosageUnit}
        onSelect={(unit) => setAddForm(prev => ({ ...prev, dosageUnit: unit }))}
        onClose={() => setShowDosageUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={dosageUnitButtonLayout}
      />

      <DosageUnitDropdown
        visible={showEditDosageUnitDropdown}
        units={dosageUnits}
        selectedUnit={editForm.dosageUnit}
        onSelect={(unit) => setEditForm(prev => ({ ...prev, dosageUnit: unit }))}
        onClose={() => setShowEditDosageUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={editDosageUnitButtonLayout}
      />
    </View>
  );
};

// Dosage Unit Dropdown Component using Modal for top-level rendering
const DosageUnitDropdown = ({ visible, units, selectedUnit, onSelect, onClose, theme, getCardBackgroundColor, getCardBorderColor, getCardTextColor, buttonLayout }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{
          position: 'absolute',
          top: buttonLayout ? buttonLayout.y + buttonLayout.height + 10 : 200,
          left: buttonLayout ? buttonLayout.x : 60,
          width: buttonLayout ? buttonLayout.width : 200,
          backgroundColor: getCardBackgroundColor(),
          borderRadius: 8,
          borderWidth: 1,
          borderColor: getCardBorderColor(),
          maxHeight: 150,
          elevation: 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
        }}>
          <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
            {units.map((unit, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onSelect(unit);
                  onClose();
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderBottomWidth: index < units.length - 1 ? 0.5 : 0,
                  borderBottomColor: getCardBorderColor(),
                  backgroundColor: selectedUnit === unit ? theme.accent + '20' : 'transparent'
                }}
              >
                <DynamicText 
                  type="card" 
                  style={{ 
                    fontSize: 12,
                    color: selectedUnit === unit ? theme.accent : getCardTextColor(),
                    fontFamily: selectedUnit === unit ? 'Inter_600SemiBold' : 'Inter_400Regular'
                  }}
                >
                  {unit}
                </DynamicText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default Supplements;
