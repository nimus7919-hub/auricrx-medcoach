import uiI18n from "../src/i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import GrowingTextInput from './GrowingTextInput';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../src/config/api';

const MedicationAutocomplete = forwardRef(function MedicationAutocomplete(
  { value, onChangeText, onSelect, enabled = true, onFocus, onBlur, style, ...props }, ref) {
  useUILanguage();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const selected = useRef(null);
  const blurTimer = useRef(null);
  useEffect(() => () => clearTimeout(blurTimer.current), []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setItems([]); setStatus('');
    if (!enabled || !focused || value.trim().length < 2 || value === selected.current) return;
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const response = await fetch(`${API_BASE}/api/meds/search?q=${encodeURIComponent(value.trim())}`, { signal: controller.signal });
        if (!response.ok) throw new Error(uiI18n.t("ui.searchUnavailable"));
        const result = await response.json();
        if (active) { setItems(Array.isArray(result) ? result : []); setStatus(result.length ? '' : 'empty'); }
      } catch { if (active) setStatus('unavailable'); }
    }, 300);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [value, focused, enabled]);
  return <View>
    <GrowingTextInput {...props} ref={ref} value={value} style={[styles.input, style]}
      onChangeText={text => { selected.current = null; setItems([]); onChangeText(text); }}
      onFocus={event => { clearTimeout(blurTimer.current); setFocused(true); onFocus?.(event); }}
      onBlur={event => { blurTimer.current = setTimeout(() => setFocused(false), 180); onBlur?.(event); }} />
    {enabled && focused && (items.length > 0 || status) && <View style={styles.dropdown}>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }} style={{ maxHeight: 220 }}>
        {items.map(item => <TouchableOpacity key={item.name} accessibilityRole="button"
          style={styles.row} onPress={() => { selected.current = item.name; setItems([]); setStatus(''); setFocused(false); onChangeText(item.name); onSelect?.(item); }}>
          <Text style={styles.name}>{item.name}</Text>
          {!!item.components.length && <Text style={styles.detail}>{item.components.map(c => typeof c === 'string' ? c : c.name).filter(Boolean).join(', ')}</Text>}
        </TouchableOpacity>)}
        {!!status && <Text accessibilityLiveRegion="polite" style={styles.detail}>{t(`medicationAutocomplete.${status}`)}</Text>}
      </ScrollView>
    </View>}
  </View>;
});
const styles = StyleSheet.create({
  input: { backgroundColor: '#112039', color: '#fff', borderColor: '#C9A646', borderWidth: 1, borderRadius: 12, padding: 16 },
  dropdown: { backgroundColor: '#112039', borderColor: '#C9A646', borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  row: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C9A646' },
  name: { color: '#F2D88A', fontSize: 15 }, detail: { color: '#fff', padding: 8, fontSize: 12 },
});
export default MedicationAutocomplete;
