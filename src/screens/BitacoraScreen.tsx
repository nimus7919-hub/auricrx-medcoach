import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import BitacoraRawChart from '../components/BitacoraRawChart';
import { useWallpaper } from '../contexts/WallpaperContext';
import DoctorModeService from '../services/doctorModeService';
import type { BitacoraEntry, BitacoraEntryType, GlucoseTiming } from '../doctor/types';

type EntryTab = BitacoraEntryType;

export default function BitacoraScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor } = useWallpaper();
  const service = DoctorModeService.getInstance();

  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<EntryTab>('blood_pressure');

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [glucose, setGlucose] = useState('');
  const [glucoseTiming, setGlucoseTiming] = useState<GlucoseTiming>('fasting');
  const [weight, setWeight] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await service.listBitacoraEntries();
      setEntries(list);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setGlucose('');
    setWeight('');
    setSymptoms('');
    setNote('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (tab === 'blood_pressure') {
        const s = Number(systolic);
        const d = Number(diastolic);
        if (!s || !d) {
          Alert.alert(t('common.error'), t('doctorMode.bitacora.bpRequired'));
          return;
        }
        await service.addBitacoraEntry({
          type: 'blood_pressure',
          systolic: s,
          diastolic: d,
          pulse: pulse ? Number(pulse) : undefined,
          note: note || undefined,
        });
      } else if (tab === 'glucose') {
        const g = Number(glucose);
        if (!g) {
          Alert.alert(t('common.error'), t('doctorMode.bitacora.glucoseRequired'));
          return;
        }
        await service.addBitacoraEntry({
          type: 'glucose',
          glucoseMgDl: g,
          glucoseTiming,
          note: note || undefined,
        });
      } else if (tab === 'weight') {
        const w = Number(weight);
        if (!w) {
          Alert.alert(t('common.error'), t('doctorMode.bitacora.weightRequired'));
          return;
        }
        await service.addBitacoraEntry({
          type: 'weight',
          weightKg: w,
          note: note || undefined,
        });
      } else {
        if (!symptoms.trim()) {
          Alert.alert(t('common.error'), t('doctorMode.bitacora.symptomsRequired'));
          return;
        }
        await service.addBitacoraEntry({
          type: 'symptoms',
          symptomsText: symptoms.trim(),
          note: note || undefined,
        });
      }
      resetForm();
      await load();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.bitacora.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const bpPoints = useMemo(
    () =>
      entries
        .filter((e) => e.type === 'blood_pressure' && typeof e.systolic === 'number')
        .slice(0, 20)
        .reverse()
        .map((e) => ({
          xLabel: e.timestamp.slice(5, 10),
          value: e.systolic as number,
        })),
    [entries]
  );
  const glucosePoints = useMemo(
    () =>
      entries
        .filter((e) => e.type === 'glucose' && typeof e.glucoseMgDl === 'number')
        .slice(0, 20)
        .reverse()
        .map((e) => ({
          xLabel: e.timestamp.slice(5, 10),
          value: e.glucoseMgDl as number,
        })),
    [entries]
  );
  const weightPoints = useMemo(
    () =>
      entries
        .filter((e) => e.type === 'weight' && typeof e.weightKg === 'number')
        .slice(0, 20)
        .reverse()
        .map((e) => ({
          xLabel: e.timestamp.slice(5, 10),
          value: e.weightKg as number,
        })),
    [entries]
  );

  const tabs: { key: EntryTab; label: string }[] = [
    { key: 'blood_pressure', label: t('doctorMode.bitacora.bp') },
    { key: 'glucose', label: t('doctorMode.bitacora.glucose') },
    { key: 'weight', label: t('doctorMode.bitacora.weight') },
    { key: 'symptoms', label: t('doctorMode.bitacora.symptoms') },
  ];

  const cardBg = getCardBackgroundColor();
  const border = getCardBorderColor();
  const accent = getAccentColor();

  const formatEntry = (e: BitacoraEntry) => {
    if (e.type === 'blood_pressure') {
      return `${e.systolic}/${e.diastolic}${e.pulse ? ` · ${e.pulse}` : ''}`;
    }
    if (e.type === 'glucose') {
      const timing = e.glucoseTiming
        ? t(`doctorMode.bitacora.timing.${e.glucoseTiming}`)
        : '';
      return `${e.glucoseMgDl} mg/dL${timing ? ` · ${timing}` : ''}`;
    }
    if (e.type === 'weight') return `${e.weightKg} kg`;
    return e.symptomsText || '';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
        <DynamicText type="card" style={styles.title}>{t('doctorMode.bitacora.title')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.close}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <DynamicText type="card" style={styles.disclaimer}>
          {t('doctorMode.bitacora.disclaimer')}
        </DynamicText>

        <View style={styles.tabRow}>
          {tabs.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              onPress={() => setTab(tb.key)}
              style={[
                styles.tab,
                { borderColor: border, backgroundColor: tab === tb.key ? accent : cardBg },
              ]}
            >
              <DynamicText
                type="card"
                style={[styles.tabText, tab === tb.key && { color: '#17130B' }]}
              >
                {tb.label}
              </DynamicText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          {tab === 'blood_pressure' && (
            <>
              <TextField label={t('doctorMode.bitacora.systolic')} value={systolic} onChangeText={setSystolic} keyboardType="numeric" border={border} />
              <TextField label={t('doctorMode.bitacora.diastolic')} value={diastolic} onChangeText={setDiastolic} keyboardType="numeric" border={border} />
              <TextField label={t('doctorMode.bitacora.pulse')} value={pulse} onChangeText={setPulse} keyboardType="numeric" border={border} />
            </>
          )}
          {tab === 'glucose' && (
            <>
              <TextField label={t('doctorMode.bitacora.glucoseMgDl')} value={glucose} onChangeText={setGlucose} keyboardType="numeric" border={border} />
              <View style={styles.timingRow}>
                {(['fasting', 'after_meal', 'other'] as GlucoseTiming[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGlucoseTiming(g)}
                    style={[styles.chip, { borderColor: border, backgroundColor: glucoseTiming === g ? accent : 'transparent' }]}
                  >
                    <DynamicText type="card" style={[styles.chipText, glucoseTiming === g && { color: '#17130B' }]}>
                      {t(`doctorMode.bitacora.timing.${g}`)}
                    </DynamicText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {tab === 'weight' && (
            <TextField label={t('doctorMode.bitacora.weightKg')} value={weight} onChangeText={setWeight} keyboardType="numeric" border={border} />
          )}
          {tab === 'symptoms' && (
            <TextField label={t('doctorMode.bitacora.symptomsText')} value={symptoms} onChangeText={setSymptoms} border={border} multiline />
          )}
          <TextField label={t('doctorMode.bitacora.noteOptional')} value={note} onChangeText={setNote} border={border} multiline />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accent }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#17130B" />
            ) : (
              <DynamicText type="card" style={styles.saveText}>{t('doctorMode.bitacora.save')}</DynamicText>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.bitacora.charts')}</DynamicText>
          <DynamicText type="card" style={styles.sectionDesc}>{t('doctorMode.bitacora.chartsHint')}</DynamicText>
          <BitacoraRawChart title={t('doctorMode.bitacora.systolic')} points={bpPoints} unit="mmHg" accent={accent} />
          <BitacoraRawChart title={t('doctorMode.bitacora.glucose')} points={glucosePoints} unit="mg/dL" accent={accent} />
          <BitacoraRawChart title={t('doctorMode.bitacora.weight')} points={weightPoints} unit="kg" accent={accent} />
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.bitacora.history')}</DynamicText>
          {loading && <ActivityIndicator color={accent} />}
          {!loading && entries.length === 0 && (
            <DynamicText type="card" style={styles.empty}>{t('doctorMode.bitacora.empty')}</DynamicText>
          )}
          {entries.map((e) => (
            <View key={e.id} style={[styles.row, { borderBottomColor: border }]}>
              <View style={{ flex: 1 }}>
                <DynamicText type="card" style={styles.rowType}>
                  {t(`doctorMode.bitacora.types.${e.type}`)}
                </DynamicText>
                <DynamicText type="card" style={styles.rowValue}>{formatEntry(e)}</DynamicText>
                {!!e.note && <DynamicText type="card" style={styles.rowNote}>{e.note}</DynamicText>}
              </View>
              <DynamicText type="card" style={styles.rowTime}>
                {new Date(e.timestamp).toLocaleString()}
              </DynamicText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  border,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  border: string;
  keyboardType?: 'numeric' | 'default';
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <DynamicText type="card" style={styles.label}>{label}</DynamicText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        style={[styles.input, { borderColor: border, minHeight: multiline ? 72 : 44 }]}
        placeholderTextColor="#8a8070"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080E1B' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' },
  close: { fontSize: 16, opacity: 0.85 },
  content: { flex: 1, padding: 16 },
  disclaimer: { fontSize: 13, opacity: 0.8, marginBottom: 12, lineHeight: 18 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  label: { fontSize: 12, marginBottom: 4, opacity: 0.85 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF5E4',
    fontSize: 15,
  },
  timingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12 },
  saveBtn: { marginTop: 6, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveText: { color: '#17130B', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionDesc: { fontSize: 12, opacity: 0.75, marginBottom: 8 },
  empty: { opacity: 0.7, marginTop: 8 },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  rowType: { fontSize: 12, fontWeight: '600', opacity: 0.8 },
  rowValue: { fontSize: 15, marginTop: 2 },
  rowNote: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  rowTime: { fontSize: 11, opacity: 0.65, maxWidth: 110, textAlign: 'right' },
});
