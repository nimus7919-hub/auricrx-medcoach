// src/screens/MedicationDataAdminScreen.tsx
// Admin screen to view and export collected medication data

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput, FlatList } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import medicationDataCollector from '../../services/medicationDataCollector';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Contribution {
  id: string;
  timestamp: string;
  medicationName: string;
  strength: string;
  price: number;
  quantity: string;
  storeName: string;
  storeAddress: string;
  currency: string;
  verified: boolean;
  source: string;
}

export default function MedicationDataAdminScreen({ onClose }: { onClose: () => void }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({
    totalContributions: 0,
    uniqueMedications: 0,
    uniqueStores: 0,
    verifiedContributions: 0,
    averagePrice: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await medicationDataCollector.getContributions();
      const allContributions = result.contributions || [];
      setContributions(allContributions);
      setFilteredContributions(allContributions);
      
      const stats = result.statistics || medicationDataCollector.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      Alert.alert('Error', 'Failed to load medication data');
    }
  };

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    try {
      const result = await medicationDataCollector.getContributions({
        search: text,
        limit: 100
      });
      setFilteredContributions(result.contributions || []);
    } catch (error) {
      console.error('❌ Search failed:', error);
      // Fallback to local filtering
      if (!text.trim()) {
        setFilteredContributions(contributions);
        return;
      }

      const filtered = contributions.filter(contrib => 
        contrib.medicationName.toLowerCase().includes(text.toLowerCase()) ||
        contrib.storeName.toLowerCase().includes(text.toLowerCase()) ||
        contrib.strength.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredContributions(filtered);
    }
  };

  const exportToCSV = async () => {
    try {
      // Try to get CSV from server first
      const API_BASE = process.env.NODE_ENV === 'production' 
        ? 'https://auricrx-medcoach.onrender.com' 
        : 'http://localhost:4000';
      
      const response = await fetch(`${API_BASE}/medication-contributions/export?format=csv`);
      
      if (response.ok) {
        const csvContent = await response.text();
        const fileName = `medication_contributions_${new Date().toISOString().split('T')[0]}.csv`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Medication Data'
          });
          Alert.alert('Success', 'Data exported successfully!');
        } else {
          Alert.alert('Error', 'Sharing not available on this device');
        }
      } else {
        throw new Error('Server export failed');
      }
    } catch (error) {
      console.error('❌ Server export failed, trying local:', error);
      try {
        // Fallback to local export
        const csvContent = medicationDataCollector.exportToCSV();
        const fileName = `medication_contributions_${new Date().toISOString().split('T')[0]}.csv`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Medication Data'
          });
          Alert.alert('Success', 'Data exported successfully!');
        } else {
          Alert.alert('Error', 'Sharing not available on this device');
        }
      } catch (fallbackError) {
        console.error('❌ Local export also failed:', fallbackError);
        Alert.alert('Error', 'Failed to export data');
      }
    }
  };

  const exportToJSON = async () => {
    try {
      const jsonContent = medicationDataCollector.exportToJSON();
      const fileName = `medication_contributions_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Medication Data'
        });
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        Alert.alert('Error', 'Sharing not available on this device');
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all collected medication data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationDataCollector.clearAllContributions();
              await loadData();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const renderContribution = ({ item }: { item: Contribution }) => (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: item.verified ? '#10b981' : '#f59e0b'
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
            {item.medicationName}
          </Text>
          <Text style={{ color: colors.sub, fontSize: 14 }}>
            {item.strength} • {item.quantity}
          </Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
            {item.currency} {item.price.toFixed(2)}
          </Text>
          <Text style={{ color: colors.sub, fontSize: 12 }}>
            {item.storeName} • {item.storeAddress}
          </Text>
          <Text style={{ color: colors.sub, fontSize: 10 }}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ 
            color: item.verified ? '#10b981' : '#f59e0b', 
            fontSize: 12, 
            fontWeight: '600' 
          }}>
            {item.verified ? '✓ Verified' : '⚠ Pending'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        backgroundColor: colors.card,
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.muted
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
            Medication Data Admin
          </Text>
          <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
            <Text style={{ color: colors.sub, fontSize: 24 }}>×</Text>
          </Pressable>
        </View>
      </View>

      {/* Statistics */}
      <View style={{ padding: spacing.lg }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: spacing.md }}>
          Statistics
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <View style={{ backgroundColor: colors.muted, padding: spacing.md, borderRadius: radius.lg, flex: 1, minWidth: 120 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {statistics.totalContributions}
            </Text>
            <Text style={{ color: colors.sub, fontSize: 12 }}>Total Contributions</Text>
          </View>
          <View style={{ backgroundColor: colors.muted, padding: spacing.md, borderRadius: radius.lg, flex: 1, minWidth: 120 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {statistics.uniqueMedications}
            </Text>
            <Text style={{ color: colors.sub, fontSize: 12 }}>Unique Medications</Text>
          </View>
          <View style={{ backgroundColor: colors.muted, padding: spacing.md, borderRadius: radius.lg, flex: 1, minWidth: 120 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {statistics.uniqueStores}
            </Text>
            <Text style={{ color: colors.sub, fontSize: 12 }}>Unique Stores</Text>
          </View>
          <View style={{ backgroundColor: colors.muted, padding: spacing.md, borderRadius: radius.lg, flex: 1, minWidth: 120 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {statistics.verifiedContributions}
            </Text>
            <Text style={{ color: colors.sub, fontSize: 12 }}>Verified</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <TextInput
          style={{
            backgroundColor: colors.muted,
            borderRadius: radius.md,
            padding: spacing.md,
            color: colors.text,
            fontSize: 16
          }}
          value={searchTerm}
          onChangeText={handleSearch}
          placeholder="Search medications, stores, or strength..."
          placeholderTextColor={colors.sub}
        />
      </View>

      {/* Export Actions */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable 
            onPress={exportToCSV}
            style={{ 
              flex: 1, 
              backgroundColor: '#10b981', 
              borderRadius: radius.pill, 
              paddingVertical: spacing.md, 
              alignItems: 'center' 
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>Export CSV</Text>
          </Pressable>
          <Pressable 
            onPress={exportToJSON}
            style={{ 
              flex: 1, 
              backgroundColor: '#3b82f6', 
              borderRadius: radius.pill, 
              paddingVertical: spacing.md, 
              alignItems: 'center' 
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>Export JSON</Text>
          </Pressable>
        </View>
        <Pressable 
          onPress={clearAllData}
          style={{ 
            backgroundColor: '#ef4444', 
            borderRadius: radius.pill, 
            paddingVertical: spacing.md, 
            alignItems: 'center', 
            marginTop: spacing.sm 
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Clear All Data</Text>
        </Pressable>
      </View>

      {/* Contributions List */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: spacing.md }}>
          Contributions ({filteredContributions.length})
        </Text>
        <FlatList
          data={filteredContributions}
          keyExtractor={(item) => item.id}
          renderItem={renderContribution}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </View>
  );
}
