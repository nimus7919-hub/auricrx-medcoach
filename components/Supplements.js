import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Image, Keyboard, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import SupplementRefillModal from './SupplementRefillModal';
import DynamicText from '../src/components/DynamicText';
import { useWallpaper } from '../src/contexts/WallpaperContext';

// Supplements component moved outside App to prevent remounting
const Supplements = ({ supplements, setSupplements, S, theme, lang, userCountry, user, onNavigateToDashboard, preloadedPharmacies, preloadedCoords, preloadedCurrency, preloadedFxMeta, reminders, setReminders }) => {
  // Mount/unmount detection
  const mounted = useRef(0);
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getSubTextColor } = useWallpaper();

  // Unit options for supplements (dosage strength units only - NOT package types)
  const dosageUnits = [
    // Mass units
    'Mcg', 'Mg', 'G', 'Kg',
    // International units
    'IU',
    // Special vitamin units
    'Mcg DFE', 'Mg NE', 'Mg alpha-tocopherol',
    // Probiotics
    'CFU', 'Billion CFU',
    // Enzyme activity units
    'HUT', 'DU', 'FIP', 'ALU', 'GDU', 'FCC units',
    // Liquid volumes
    'mL', 'L',
    // Concentrations
    'Mg/mL', 'Mcg/mL', 'Mg/5mL', '% w/w', '% w/v', '% v/v',
    // Ratios
    '1:1', '1:2', '1:5',
    // Powder measurements
    'Tsp', 'Tbsp', 'Scoop',
    // General
    'Unit', 'Units'
  ];

  // Quantity unit options (package/container types)
  const quantityUnits = [
    'Tablet', 'Tablets', 'Capsule', 'Capsules', 'Softgel', 'Softgels', 'Gel cap', 'Gel caps',
    'Caplet', 'Caplets', 'Lozenge', 'Lozenges', 'Gummy', 'Gummies', 'Chewable', 'Chewables',
    'mL', 'L', 'Bottle', 'Bottles', 'Vial', 'Vials', 'Ampoule', 'Ampoules',
    'Drop', 'Drops', 'Spray', 'Sprays', 'Puff', 'Puffs',
    'Patch', 'Patches', 'Suppository', 'Suppositories',
    'Sachet', 'Sachets', 'Stick pack', 'Stick packs', 'Scoop', 'Scoops',
    'Box', 'Boxes', 'Pack', 'Packs', 'Jar', 'Jars', 'Container', 'Containers',
    'Serving', 'Servings', 'Dose', 'Doses', 'Unit', 'Units'
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
    dosageUnit: 'Mg',
    quantityValue: '',
    quantityUnit: 'Tablet',
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
  const [showRefillLoading, setShowRefillLoading] = useState(false);
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
    dosageUnit: 'Mg',
    quantityValue: '',
    quantityUnit: 'Tablet',
    brand: '' 
  });
  const [editingSupplement, setEditingSupplement] = useState(null);

  // Unit dropdown states
  const [showDosageUnitDropdown, setShowDosageUnitDropdown] = useState(false);
  const [showEditDosageUnitDropdown, setShowEditDosageUnitDropdown] = useState(false);
  const [showQuantityUnitDropdown, setShowQuantityUnitDropdown] = useState(false);
  const [showEditQuantityUnitDropdown, setShowEditQuantityUnitDropdown] = useState(false);

  // Refs for unit buttons to measure their position
  const dosageUnitButtonRef = useRef(null);
  const editDosageUnitButtonRef = useRef(null);
  const quantityUnitButtonRef = useRef(null);
  const editQuantityUnitButtonRef = useRef(null);

  // State to store layout of unit buttons
  const [dosageUnitButtonLayout, setDosageUnitButtonLayout] = useState(null);
  const [editDosageUnitButtonLayout, setEditDosageUnitButtonLayout] = useState(null);
  const [quantityUnitButtonLayout, setQuantityUnitButtonLayout] = useState(null);
  const [editQuantityUnitButtonLayout, setEditQuantityUnitButtonLayout] = useState(null);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null); // 'startDate' or 'endDate'
  const [dateTarget, setDateTarget] = useState(null); // 'add' or 'edit'


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
          `🏪 ${store.name}\n📍 ${store.address}\n💰 $${store.price || S.priceVaries}\n📏 ${store.distanceMiles ? `${store.distanceMiles.toFixed(1)} mi` : S.distanceUnknown}\n${store.pickup ? `✅ ${S.pickupAvailable}` : ''}${store.delivery ? `🚚 ${S.deliveryAvailable}` : ''}\n`
        ).join('\n');
        
        const results = `${S.foundStores.replace('{count}', data.stores.length).replace('{name}', supplementName)}\n\n${storeList}`;
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

  const addSupplement = async () => {
    try {
      if (!addForm.name.trim()) return;
      
      const newSupp = {
        id: Date.now().toString(),
        name: addForm.name.trim(),
        brand: addForm.brand ? addForm.brand.trim() : '',
        dosage: `${addForm.dosageValue.trim()} ${addForm.dosageUnit}`.trim(),
        dosageValue: addForm.dosageValue.trim(),
        dosageUnit: addForm.dosageUnit,
        quantity: addForm.quantityValue ? `${addForm.quantityValue.trim()} ${addForm.quantityUnit}`.trim() : '',
        quantityValue: addForm.quantityValue ? addForm.quantityValue.trim() : '',
        quantityUnit: addForm.quantityUnit,
        times: addTimes,
        status: addForm.status,
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        notes: addForm.notes ? addForm.notes.trim() : '',
        dosesLeft: addForm.dosesLeft ? addForm.dosesLeft.trim() : '',
        remainingQuantity: addForm.quantityValue ? addForm.quantityValue : '0',
        refillSoon: false
      };
      
      // Save to local state first for immediate UI update
      setSupplements(prev => [...prev, newSupp]);
      
      // Save to database if user is authenticated
      if (user && user.uid) {
        try {
          const response = await fetch('https://auricrx-medcoach.onrender.com/api/supplements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              supplementName: newSupp.name,
              brand: newSupp.brand,
              dosageValue: newSupp.dosageValue,
              dosageUnit: newSupp.dosageUnit,
              quantityValue: newSupp.quantityValue,
              quantityUnit: newSupp.quantityUnit,
              status: newSupp.status,
              times: newSupp.times,
              startDate: newSupp.startDate,
              endDate: newSupp.endDate,
              notes: newSupp.notes,
              dosesLeft: newSupp.dosesLeft,
              remainingQuantity: newSupp.remainingQuantity
            })
          });
          
          const result = await response.json();
          
          if (result.ok) {
            console.log('✅ Supplement saved to database:', result.supplement);
            // Update with database ID
            setSupplements(prev => prev.map(s => 
              s.id === newSupp.id ? { ...s, dbId: result.supplement.id } : s
            ));
          } else {
            console.error('❌ Failed to save supplement to database:', result.message);
          }
        } catch (dbError) {
          console.error('❌ Database save error:', dbError);
          // Continue anyway - supplement is saved locally
        }
      }
      
      setAddForm({ name: '', times: '', status: 'taking', startDate: '', endDate: '', notes: '', dosesLeft: '', dosageValue: '', dosageUnit: 'Mg', quantityValue: '', quantityUnit: 'Tablet', brand: '' });
      setAddTimes([]);
      setShowAdd(false);
    } catch (error) {
      console.error('[SUPPLEMENTS] Error adding supplement:', error);
    }
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
            quantity: editForm.quantityValue ? `${editForm.quantityValue.trim()} ${editForm.quantityUnit}`.trim() : '',
            quantityValue: editForm.quantityValue ? editForm.quantityValue.trim() : '',
            quantityUnit: editForm.quantityUnit,
            times: editTimes.join(', '),
            status: editForm.status,
            startDate: editForm.startDate,
            endDate: editForm.endDate,
            notes: editForm.notes ? editForm.notes.trim() : '',
            dosesLeft: editForm.dosesLeft ? editForm.dosesLeft.trim() : ''
          }
        : supp
    ));
    setEditForm({ name: '', times: '', status: 'taking', startDate: '', endDate: '', notes: '', dosesLeft: '', dosageValue: '', dosageUnit: 'Mg', quantityValue: '', quantityUnit: 'Tablet', brand: '' });
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

  const handleRefillComplete = (supplementName) => {
    // Update the supplement's last refill date
    const currentDate = new Date().toISOString().split('T')[0];
    setSupplements(prev => prev.map(s => 
      s.name === supplementName ? { ...s, lastRefill: currentDate } : s
    ));
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

      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
      <View style={{ padding: 16 }}>
        {/* Header with Filter and Add buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: getCardBorderColor(),
              backgroundColor: getCardBackgroundColor(),
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <Image source={require('../icon-library/filter-button-screen-med.png')} style={{ width: 22, height: 22, tintColor: getCardTextColor() }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{
              flex: 1,
              backgroundColor: theme.accent,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
              {S.addSupplement}
            </DynamicText>
          </TouchableOpacity>
        </View>

        {/* Supplements List */}
        {filteredSupplements.map(supp => {
          const statusObj = getStatusObj(supp.status);
          const utilityTags = getUtilityTags(supp);

          return (
            <View
              key={supp.id}
              style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), padding: 12 }]}
            >
              {/* Header row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 }}>
                    {supp.name}
                  </DynamicText>
                  {supp.brand && (
                    <DynamicText type="card" style={{ fontSize: 13, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                      {supp.brand}
                    </DynamicText>
                  )}
                  {supp.dosage && (
                    <DynamicText type="card" style={{ fontSize: 11, fontFamily: 'Inter_500Medium', opacity: 0.8, marginTop: 1 }}>
                      {supp.dosage}
                    </DynamicText>
                  )}
                  {supp.quantity && (
                    <DynamicText type="card" style={{ fontSize: 11, fontFamily: 'Inter_500Medium', opacity: 0.8, marginTop: 1 }}>
                      {supp.quantity}
                    </DynamicText>
                  )}
                  {supp.times && (
                    <DynamicText type="sub" style={{ fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
                      {supp.times}
                    </DynamicText>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditForm({
                        ...supp,
                        dosageValue: supp.dosageValue || supp.dosage?.split(' ')[0] || '',
                        dosageUnit: supp.dosageUnit || supp.dosage?.split(' ').slice(1).join(' ') || 'Mg',
                        quantityValue: supp.quantityValue || supp.quantity?.split(' ')[0] || '',
                        quantityUnit: supp.quantityUnit || supp.quantity?.split(' ').slice(1).join(' ') || 'Tablet'
                      });
                      setEditTimes(supp.times ? (typeof supp.times === 'string' ? supp.times.split(', ') : supp.times) : []);
                      setEditingSupplement(supp);
                      setShowEdit(true);
                    }}
                    style={{
                      backgroundColor: theme.accent,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                      {S.edit}
                    </DynamicText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      // Show loading overlay immediately
                      setShowRefillLoading(true);
                      // Small delay to ensure loading modal renders
                      setTimeout(() => {
                        setSelectedSupplement(supp);
                        setShowRefillModal(true);
                        setShowRefillLoading(false);
                      }, 50);
                    }}
                    style={{
                      backgroundColor: '#2dd4bf',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#2c2c2c', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                      {S.refill}
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
                            onPress: async () => {
                              // Delete the supplement from local state first for immediate UI update
                              setSupplements(prev => prev.filter(s => s.id !== supp.id));
                              
                              // If this supplement was created from a reminder, also delete the reminder
                              if (supp.fromReminder && supp.reminderId && setReminders) {
                                console.log('🗑️ Also deleting corresponding reminder:', supp.reminderId);
                                setReminders(prev => prev.filter(r => r.id !== supp.reminderId));
                              }
                              
                              // Sync deletion to cloud if user is authenticated and supplement has database ID
                              if (user && user.uid && (supp.dbId || supp.id)) {
                                try {
                                  const supplementId = supp.dbId || supp.id;
                                  const response = await fetch(`https://auricrx-medcoach.onrender.com/api/supplements?userId=${user.uid}&supplementId=${supplementId}`, {
                                    method: 'DELETE'
                                  });
                                  
                                  const result = await response.json();
                                  
                                  if (result.ok) {
                                    console.log('✅ Supplement deleted from database');
                                  } else {
                                    console.error('❌ Failed to delete supplement from database:', result.message);
                                  }
                                } catch (dbError) {
                                  console.error('❌ Database delete error:', dbError);
                                  // Continue anyway - supplement is deleted locally
                                }
                              }
                            }
                          }
                        ]
                      );
                    }}
                    style={{
                      backgroundColor: '#f87171',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                      {S.delete}
                    </DynamicText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Counter and Took Button Row - Compact Corner */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <DynamicText type="card" style={{ fontSize: 10, fontFamily: 'Inter_500Medium', opacity: 0.8, marginRight: 4 }}>
                    {parseFloat(supp.remainingQuantity || supp.quantity?.replace(/[^\d.]/g, '') || '0')} {S.left}
                  </DynamicText>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={getSubTextColor()}
                    value={supp.tookAmount || ''}
                    onChangeText={(text) => {
                      setSupplements(prev => prev.map(s => 
                        s.id === supp.id 
                          ? { ...s, tookAmount: text }
                          : s
                      ));
                    }}
                    style={{
                      backgroundColor: getCardBackgroundColor(),
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: getCardBorderColor(),
                      width: 30,
                      height: 20,
                      fontSize: 10,
                      color: getCardTextColor(),
                      fontFamily: 'Inter_500Medium',
                      textAlign: 'center'
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const amount = parseFloat(supp.tookAmount || '0');
                      if (amount > 0) {
                        const currentRemaining = parseFloat(supp.remainingQuantity || supp.quantity?.replace(/[^\d.]/g, '') || '0');
                        const newRemaining = Math.max(0, currentRemaining - amount);
                        setSupplements(prev => prev.map(s => 
                          s.id === supp.id 
                            ? { ...s, remainingQuantity: `${newRemaining}`, tookAmount: '' }
                            : s
                        ));
                      }
                    }}
                    style={{
                      backgroundColor: '#2196F3',
                      borderRadius: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: '#2196F3',
                      height: 20
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#fff', fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>
                      {S.took}
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
      <Modal 
        visible={showAdd} 
        animationType="slide" 
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          setShowAdd(false);
          setInputFocused(false);
        }}
      >
        {/* Backdrop: closes on outside press */}
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} 
          activeOpacity={1}
          onPress={() => {
            if (!inputFocused && showAdd) {
              setShowAdd(false);
              setInputFocused(false);
            }
          }}
        >
          {/* Modal Content Container */}
          <View
            style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), marginHorizontal: 16, width: '90%', maxHeight: '80%', padding: 20 }]}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView 
              contentContainerStyle={{ padding: 16, width: '100%' }} 
              keyboardShouldPersistTaps="always"
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <DynamicText type="card" style={{ fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                  {S.addSupplement}
                </DynamicText>
                <TouchableOpacity onPress={() => {
                  setShowAdd(false);
                  setInputFocused(false);
                }}>
                  <DynamicText type="sub" style={{ fontSize: 18 }}>✕</DynamicText>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder={S.supplementName}
                placeholderTextColor={getSubTextColor()}
                value={addForm.name}
                onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              <TextInput
                placeholder={S.supplementBrand}
                placeholderTextColor={getSubTextColor()}
                value={addForm.brand}
                onChangeText={(text) => setAddForm(prev => ({ ...prev, brand: text }))}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              {/* Dosage Value and Unit */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  placeholder="1000"
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
                  onBlur={() => setTimeout(() => setInputFocused(false), 100)}
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
                      color: getCardTextColor() + '80'
                    }}
                  >
                    ▼
                  </DynamicText>
                </TouchableOpacity>
              </View>

              {/* Times Picker */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setTimeTarget('add');
                    setShowSuppTimePicker(true);
                  }}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: getCardBorderColor(),
                    flex: 1
                  }}
                >
                  <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                    {addTimes.length > 0 ? addTimes.join(', ') : S.selectTimes}
                  </DynamicText>
                  <DynamicText type="sub">⏰</DynamicText>
                </TouchableOpacity>
                
                {addTimes.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setAddTimes([])}
                    style={{
                      backgroundColor: '#f87171',
                      borderRadius: 8,
                      padding: 8,
                      width: 32,
                      height: 32,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
                      ×
                    </DynamicText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Start Date Picker */}
              <TouchableOpacity
                onPress={() => {
                  setDateTarget('add');
                  setDateField('startDate');
                  setShowDatePicker(true);
                }}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
              >
                <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                  {addForm.startDate || S.startDate}
                </DynamicText>
                <DynamicText type="sub">📅</DynamicText>
              </TouchableOpacity>

              {/* End Date Picker */}
              <TouchableOpacity
                onPress={() => {
                  setDateTarget('add');
                  setDateField('endDate');
                  setShowDatePicker(true);
                }}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
              >
                <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                  {addForm.endDate || S.endDateOptional}
                </DynamicText>
                <DynamicText type="sub">📅</DynamicText>
              </TouchableOpacity>

              <TextInput
                placeholder={S.notesOptional}
                placeholderTextColor={getSubTextColor()}
                value={addForm.notes}
                onChangeText={(text) => setAddForm(prev => ({ ...prev, notes: text }))}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                multiline
                numberOfLines={3}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                autoCapitalize="sentences"
                autoCorrect={true}
                returnKeyType="default"
              />

              {/* Quantity Value and Unit */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  placeholder="60"
                  placeholderTextColor={getSubTextColor()}
                  value={addForm.quantityValue}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, quantityValue: text }))}
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
                  onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  keyboardType="numeric"
                />
                
                <TouchableOpacity
                  ref={quantityUnitButtonRef}
                  onPress={() => {
                    quantityUnitButtonRef.current?.measureInWindow((x, y, width, height) => {
                      setQuantityUnitButtonLayout({ x, y, width, height });
                    });
                    setShowQuantityUnitDropdown(true);
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
                    {addForm.quantityUnit}
                  </DynamicText>
                  <DynamicText 
                    type="sub" 
                    style={{ 
                      fontSize: 12,
                      color: getCardTextColor() + '80'
                    }}
                  >
                    ▼
                  </DynamicText>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowAdd(false);
                    setInputFocused(false);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: getCardBorderColor(),
                    alignItems: 'center'
                  }}
                >
                  <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold' }}>{S.cancel}</DynamicText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={addSupplement}
                  style={{
                    flex: 1,
                    backgroundColor: theme.accent,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center'
                  }}
                >
                  <DynamicText type="card" style={{ color: '#fff', fontFamily: 'Inter_600SemiBold' }}>{S.addSupplement}</DynamicText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Update Modal */}
      <Modal visible={showStatusSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.modalTitle}>{S.updateStatus}</DynamicText>
            
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
      <Modal 
        visible={showEdit} 
        animationType="slide" 
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          setShowEdit(false);
          setInputFocused(false);
        }}
      >
        {/* Backdrop: closes on outside press */}
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} 
          activeOpacity={1}
          onPress={() => {
            if (!inputFocused && showEdit) {
              setShowEdit(false);
              setInputFocused(false);
            }
          }}
        >
          {/* Modal Content Container */}
          <View
            style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), marginHorizontal: 16, width: '90%', maxHeight: '80%', padding: 20 }]}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView 
              contentContainerStyle={{ padding: 16, width: '100%' }} 
              keyboardShouldPersistTaps="always"
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <DynamicText type="card" style={{ fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                  {S.editSupplement || 'Edit Supplement'}
                </DynamicText>
                <TouchableOpacity onPress={() => {
                  setShowEdit(false);
                  setInputFocused(false);
                }}>
                  <DynamicText type="sub" style={{ fontSize: 18 }}>✕</DynamicText>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder={S.supplementName}
                placeholderTextColor={getSubTextColor()}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              <TextInput
                placeholder={S.supplementBrand}
                placeholderTextColor={getSubTextColor()}
                value={editForm.brand}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, brand: text }))}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              {/* Dosage Value and Unit */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  placeholder="1000"
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
                  onBlur={() => setTimeout(() => setInputFocused(false), 100)}
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
                      color: getCardTextColor() + '80'
                    }}
                  >
                    ▼
                  </DynamicText>
                </TouchableOpacity>
              </View>

              {/* Times Picker */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setTimeTarget('edit');
                    setShowSuppTimePicker(true);
                  }}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: getCardBorderColor(),
                    flex: 1
                  }}
                >
                  <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                    {editTimes.length > 0 ? editTimes.join(', ') : S.selectTimes}
                  </DynamicText>
                  <DynamicText type="sub">⏰</DynamicText>
                </TouchableOpacity>
                
                {editTimes.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setEditTimes([])}
                    style={{
                      backgroundColor: '#f87171',
                      borderRadius: 8,
                      padding: 8,
                      width: 32,
                      height: 32,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
                      ×
                    </DynamicText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Start Date Picker */}
              <TouchableOpacity
                onPress={() => {
                  setDateTarget('edit');
                  setDateField('startDate');
                  setShowDatePicker(true);
                }}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
              >
                <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                  {editForm.startDate || S.startDate}
                </DynamicText>
                <DynamicText type="sub">📅</DynamicText>
              </TouchableOpacity>

              {/* End Date Picker */}
              <TouchableOpacity
                onPress={() => {
                  setDateTarget('edit');
                  setDateField('endDate');
                  setShowDatePicker(true);
                }}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
              >
                <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                  {editForm.endDate || S.endDateOptional}
                </DynamicText>
                <DynamicText type="sub">📅</DynamicText>
              </TouchableOpacity>

              <TextInput
                placeholder={S.notesOptional}
                placeholderTextColor={getSubTextColor()}
                value={editForm.notes}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, notes: text }))}
                style={{
                  backgroundColor: getCardBackgroundColor(),
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  color: getCardTextColor(),
                  fontFamily: 'Inter_400Regular',
                  borderWidth: 1,
                  borderColor: getCardBorderColor()
                }}
                multiline
                numberOfLines={3}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                autoCapitalize="sentences"
                autoCorrect={true}
                returnKeyType="default"
              />

              {/* Quantity Value and Unit */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  placeholder="60"
                  placeholderTextColor={getSubTextColor()}
                  value={editForm.quantityValue}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, quantityValue: text }))}
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
                  onBlur={() => setTimeout(() => setInputFocused(false), 100)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  keyboardType="numeric"
                />
                
                <TouchableOpacity
                  ref={editQuantityUnitButtonRef}
                  onPress={() => {
                    editQuantityUnitButtonRef.current?.measureInWindow((x, y, width, height) => {
                      setEditQuantityUnitButtonLayout({ x, y, width, height });
                    });
                    setShowEditQuantityUnitDropdown(true);
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
                    {editForm.quantityUnit}
                  </DynamicText>
                  <DynamicText 
                    type="sub" 
                    style={{ 
                      fontSize: 12,
                      color: getCardTextColor() + '80'
                    }}
                  >
                    ▼
                  </DynamicText>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowEdit(false);
                    setInputFocused(false);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: getCardBorderColor(),
                    alignItems: 'center'
                  }}
                >
                  <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold' }}>{S.cancel}</DynamicText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={updateSupplement}
                  style={{
                    flex: 1,
                    backgroundColor: theme.accent,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center'
                  }}
                >
                  <DynamicText type="card" style={{ color: '#fff', fontFamily: 'Inter_600SemiBold' }}>{S.save || 'Save'}</DynamicText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
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
            quantity: selectedSupplement.quantity,
            quantityUnit: selectedSupplement.quantityUnit,
            lastRefill: selectedSupplement.lastRefill
          }}
          strings={S}
          lang={lang}
          userCountry={userCountry}
          onRefillComplete={handleRefillComplete}
          preloadedPharmacies={preloadedPharmacies}
          preloadedCoords={preloadedCoords}
          preloadedCurrency={preloadedCurrency}
          preloadedFxMeta={preloadedFxMeta}
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

      {/* Quantity Unit Dropdowns */}
      <DosageUnitDropdown
        visible={showQuantityUnitDropdown}
        units={quantityUnits}
        selectedUnit={addForm.quantityUnit}
        onSelect={(unit) => setAddForm(prev => ({ ...prev, quantityUnit: unit }))}
        onClose={() => setShowQuantityUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={quantityUnitButtonLayout}
      />

      <DosageUnitDropdown
        visible={showEditQuantityUnitDropdown}
        units={quantityUnits}
        selectedUnit={editForm.quantityUnit}
        onSelect={(unit) => setEditForm(prev => ({ ...prev, quantityUnit: unit }))}
        onClose={() => setShowEditQuantityUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={editQuantityUnitButtonLayout}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate && dateTarget && dateField) {
              const formattedDate = selectedDate.toISOString().split('T')[0];
              if (dateTarget === 'add') {
                setAddForm(prev => ({ ...prev, [dateField]: formattedDate }));
              } else if (dateTarget === 'edit') {
                setEditForm(prev => ({ ...prev, [dateField]: formattedDate }));
              }
            }
          }}
        />
      )}

      {/* Refill Loading Overlay - Outside ScrollView */}
      {showRefillLoading && (
        <View 
          key="refill-loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
          <View style={{
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'center',
            width: 240,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Image
              source={require('../assets/dashboard Emojies/standard pill emoji.png')}
              style={{ width: 36, height: 36, marginBottom: 10 }}
            />
            <ActivityIndicator 
              key={Date.now()}
              size="large" 
              color={theme.accent} 
              animating={true}
              hidesWhenStopped={false}
              style={{ marginVertical: 10 }}
            />
            <Text style={{
              fontSize: 14,
              fontFamily: 'Inter_600SemiBold',
              marginBottom: 4,
              textAlign: 'center',
              color: theme.text,
            }}>
              {S?.searchingPharmacies || 'Searching for pharmacies...'}
            </Text>
            <Text style={{
              fontSize: 11,
              textAlign: 'center',
              color: theme.subtext,
            }}>
              {S?.pleaseWait || 'Please wait'}
            </Text>
          </View>
        </View>
      )}
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
