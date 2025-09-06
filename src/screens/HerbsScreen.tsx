import React, { useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, TextInput, Modal, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HERBS, Herb } from '../data/herbs';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (screenWidth - 48) / COLUMN_COUNT; // 48 = padding (16) * 2 + gap (16)

interface HerbsScreenProps {
  onClose: () => void;
  theme?: any;
}

export default function HerbsScreen({ onClose, theme }: HerbsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null);
  const [currentLang] = useState<'en' | 'es' | 'zh'>('en'); // Default to English

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
      style={[styles.herbCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.chip }]}
      onPress={() => setSelectedHerb(item)}
    >
      <Image source={item.image} style={styles.herbImage} />
      <Text style={[styles.herbName, { color: currentTheme.text }]}>{item.names[currentLang]}</Text>
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
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{selectedHerb.names[currentLang]}</Text>
              <TouchableOpacity onPress={() => setSelectedHerb(null)}>
                <Text style={[styles.closeButton, { color: currentTheme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Image source={selectedHerb.image} style={styles.modalImage} />
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: currentTheme.sub }]}>Origin:</Text>
                <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                  {selectedHerb.details.origin[currentLang]}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: currentTheme.sub }]}>Poisonous:</Text>
                <Text style={[
                  styles.detailValue,
                  { color: selectedHerb.details.poisonous ? '#EF4444' : '#10B981' }
                ]}>
                  {selectedHerb.details.poisonous ? 'Yes' : 'No'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: currentTheme.sub }]}>Summary:</Text>
                <Text style={[styles.detailSummary, { color: currentTheme.text }]}>
                  {selectedHerb.details.summary[currentLang]}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient colors={[currentTheme.bgStart || '#faf8f5', currentTheme.bgEnd || '#f5f2ed']} style={[styles.container, { paddingTop: 1 }]}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <TouchableOpacity onPress={onClose} style={styles.homeButton}>
          <Image 
            source={require('../../assets/AuricRX_home_button.png')} 
            style={styles.homeButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={[styles.title, { position: 'absolute', left: '50%', transform: [{ translateX: -50 }], color: currentTheme.text }]}>Herbs & Supplements</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: currentTheme.card, color: currentTheme.text, borderColor: currentTheme.chip }]}
          placeholder="Search herbs..."
          placeholderTextColor={currentTheme.sub}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredHerbs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: currentTheme.sub }]}>No herbs found</Text>
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
    </LinearGradient>
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
    borderBottomColor: '#2A2A2D',
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
    color: '#2c2c2c',
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
    backgroundColor: '#151517',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
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
    backgroundColor: '#151517',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    alignItems: 'center',
  },
  herbImage: {
    width: ITEM_WIDTH - 32,
    height: ITEM_WIDTH - 32,
    borderRadius: 12,
    marginBottom: 8,
  },
  herbName: {
    color: '#F3C96A',
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
    color: '#B8B8BA',
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
    color: '#F3C96A',
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
