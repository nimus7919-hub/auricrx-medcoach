import React, { useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, TextInput, Modal, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HERBS, Herb } from '../data/herbs';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (screenWidth - 48) / COLUMN_COUNT; // 48 = padding (16) * 2 + gap (16)

interface HerbsScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any; // Translation helper
  currentLang?: 'en' | 'es' | 'zh'; // Current language from app
}

export default function HerbsScreen({ onClose, theme, S, currentLang = 'en' }: HerbsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null);
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  
  // Debug logging
  console.log('🌿 HerbsScreen - getCardBackgroundColor:', getCardBackgroundColor());
  console.log('🌿 HerbsScreen - getCardBorderColor:', getCardBorderColor());
  console.log('🌿 HerbsScreen - getCardTextColor:', getCardTextColor());
  
  // Create translation function from S object
  const t = (key: string) => {
    if (S && typeof S === 'object' && S[key]) {
      return S[key];
    }
    return key; // fallback to key if translation not found
  };

  // Default theme if not provided
  const defaultTheme = {
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#d4af37',
    chip: '#e8e3d8',
  };
  
  const currentTheme = theme || defaultTheme;

  const filteredHerbs = useMemo(() => {
    if (!searchQuery.trim()) return HERBS;
    
    const query = searchQuery.toLowerCase();
    return HERBS.filter(herb => 
      herb.names[currentLang].toLowerCase().includes(query) ||
      herb.details.origin[currentLang].toLowerCase().includes(query) ||
      herb.details.summary[currentLang].toLowerCase().includes(query)
    );
  }, [searchQuery, currentLang]);

  const renderHerbItem = ({ item }: { item: Herb }) => (
    <TouchableOpacity 
      style={[styles.herbCard, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}
      onPress={() => setSelectedHerb(item)}
    >
      <Image source={item.image} style={styles.herbImage} />
      <DynamicText type="card" style={styles.herbName}>{item.names[currentLang]}</DynamicText>
    </TouchableOpacity>
  );

  const renderHerbDetails = () => {
    if (!selectedHerb) return null;

    return (
      <Modal
        visible={!!selectedHerb}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedHerb(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'F0' }]}>
            <View style={styles.modalHeader}>
              <DynamicText type="card" style={styles.modalTitle}>{selectedHerb.names[currentLang]}</DynamicText>
              <TouchableOpacity onPress={() => setSelectedHerb(null)}>
                <DynamicText type="card" style={styles.closeButton}>✕</DynamicText>
              </TouchableOpacity>
            </View>
            
            <Image source={selectedHerb.image} style={styles.modalImage} />
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <DynamicText type="secondary" style={styles.detailLabel}>{t('origin')}:</DynamicText>
                <DynamicText type="card" style={styles.detailValue}>
                  {selectedHerb.details.origin[currentLang]}
                </DynamicText>
              </View>
              
              <View style={styles.detailRow}>
                <DynamicText type="secondary" style={styles.detailLabel}>{t('poisonous')}:</DynamicText>
                <DynamicText type="card" style={[
                  styles.detailValue,
                  { color: selectedHerb.details.poisonous ? '#EF4444' : '#10B981' }
                ]}>
                  {selectedHerb.details.poisonous ? t('yes') : t('no')}
                </DynamicText>
              </View>
              
              <View style={styles.detailRow}>
                <DynamicText type="secondary" style={styles.detailLabel}>{t('summary')}:</DynamicText>
                <DynamicText type="card" style={styles.detailSummary}>
                  {selectedHerb.details.summary[currentLang]}
                </DynamicText>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: 1, backgroundColor: 'transparent' }]}>
      <View style={[styles.header, { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: getCardBackgroundColor() + 'CC', 
        borderBottomColor: getCardBorderColor() 
      }]}>
        <TouchableOpacity onPress={onClose} style={styles.homeButton}>
          <Image 
            source={require('../../assets/AuricRX_home_button_across_screens.png')} 
            style={styles.homeButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <DynamicText type="primary" style={[styles.title, { position: 'absolute', left: '50%', transform: [{ translateX: -50 }] }]}>Herbs</DynamicText>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.content, { backgroundColor: 'transparent' }]}>
        <View style={[styles.searchInput, { 
          backgroundColor: getCardBackgroundColor() + 'CC', 
          borderColor: getCardBorderColor(),
          borderWidth: 3, // Make border more obvious
          borderRadius: 20, // Make it more rounded
          minHeight: 56, // Make container taller
          paddingVertical: 8 // Add vertical padding to container
        }]}>
          <TextInput
            style={{
              color: '#ffffff', // Force white color
              fontSize: 14, // Smaller font size
              fontFamily: 'Inter_400Regular', 
              flex: 1,
              backgroundColor: 'transparent',
              borderWidth: 0,
              padding: 16, // More padding
              margin: 0,
              textAlign: 'left',
              textAlignVertical: 'center',
              includeFontPadding: false,
              textDecorationLine: 'none',
              minHeight: 48 // Ensure minimum height
            }}
            placeholder="Search herbs..."
            placeholderTextColor="#ffffff80" // Force white placeholder for testing
            value={searchQuery}
            onChangeText={(text) => {
              console.log('🌿 HerbsScreen - TextInput onChangeText:', text);
              setSearchQuery(text);
            }}
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor="#ffffff"
            underlineColorAndroid="transparent"
            keyboardType="default"
            returnKeyType="search"
            editable={true}
            multiline={false}
            onFocus={() => console.log('🌿 HerbsScreen - TextInput onFocus')}
            onBlur={() => console.log('🌿 HerbsScreen - TextInput onBlur')}
          />
        </View>

        {filteredHerbs.length === 0 ? (
          <View style={styles.emptyState}>
            <DynamicText type="secondary" style={styles.emptyStateText}>{t('noHerbsFound')}</DynamicText>
          </View>
        ) : (
          <FlatList
            data={filteredHerbs}
            renderItem={renderHerbItem}
            keyExtractor={item => item.id}
            numColumns={COLUMN_COUNT}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.herbsList}
          />
        )}
      </View>

      {renderHerbDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  homeButton: {
    padding: 0,
    backgroundColor: 'transparent',
    marginLeft: -65,
  },
  homeButtonIcon: {
    width: 180,
    height: 70,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
    minHeight: 48, // Ensure minimum height
    justifyContent: 'center', // Center content vertically
  },
  searchInputText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#ffffff', // Force white color in base style
  },
  herbsList: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  herbCard: {
    width: ITEM_WIDTH,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  herbImage: {
    width: ITEM_WIDTH - 32,
    height: ITEM_WIDTH - 32,
    borderRadius: 12,
    marginBottom: 8,
  },
  herbName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#151517',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    flex: 1,
  },
  closeButton: {
    color: '#6B7280',
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    gap: 8,
  },
  detailLabel: {
    color: '#B8B8BA',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  detailSummary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
});
