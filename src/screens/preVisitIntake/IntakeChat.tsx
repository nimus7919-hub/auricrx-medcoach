import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PRE_VISIT_INTAKE_CONFIG, type PreVisitIntakeInputMode } from '../../config/preVisitIntake';
import { normalizePatientText } from '../../services/preVisitIntake/flow';
import type { IntakeTurn, PreVisitIntakeClient } from '../../services/preVisitIntake/types';
import { intakeStyles, useIntakePalette } from './intakeTheme';
import { IntakePrimaryButton, IntakeSecondaryButton } from './IntakeButtons';

interface Props {
  client: PreVisitIntakeClient;
  sessionId: string;
  initialTurns: IntakeTurn[];
  onFinished: () => void;
  onLeave: () => void;
  onError: () => void;
}

/** Text composer. The input-mode seam: only 'text' exists in v1; voice is not built. */
function Composer({ mode, value, onChange, onSend, disabled }: { mode: PreVisitIntakeInputMode; value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean }) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  // Any non-text mode falls back to text until a voice design is approved.
  void mode;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      <TextInput
        testID="intake-chat-input"
        value={value}
        onChangeText={onChange}
        placeholder={t('preVisitIntake.chat.placeholder')}
        placeholderTextColor={p.sub}
        multiline
        maxLength={PRE_VISIT_INTAKE_CONFIG.MAX_MESSAGE_LENGTH}
        editable={!disabled}
        style={{ flex: 1, minHeight: 46, maxHeight: 120, borderWidth: 1.5, borderColor: p.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: p.text, backgroundColor: p.card, fontSize: 15 }}
      />
      <IntakePrimaryButton testID="intake-chat-send" label={t('preVisitIntake.chat.send')} disabled={disabled || !value.trim()} onPress={onSend} style={{ marginTop: 0, paddingHorizontal: 16 }} />
    </View>
  );
}

export default function IntakeChat({ client, sessionId, initialTurns, onFinished, onLeave, onError }: Props) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  const [turns, setTurns] = useState<IntakeTurn[]>(initialTurns);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const assistantCount = turns.filter((x) => x.role === 'assistant').length;
  const patientCount = turns.filter((x) => x.role === 'patient').length;
  const total = PRE_VISIT_INTAKE_CONFIG.MAX_FOLLOW_UPS + 1;

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [turns.length]);

  const send = async () => {
    const text = normalizePatientText(draft, PRE_VISIT_INTAKE_CONFIG.MAX_MESSAGE_LENGTH);
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await client.sendMessage(sessionId, text);
      setTurns((prev) => [...prev, res.patientTurn, ...(res.reply ? [res.reply] : [])]);
      setDraft('');
      if (res.done) setDone(true);
    } catch {
      onError();
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={24}>
      <Text style={[intakeStyles.title, { color: p.text }]}>{t('preVisitIntake.chat.title')}</Text>
      <Text style={[intakeStyles.small, { color: p.sub, marginBottom: 8 }]}>
        {t('preVisitIntake.chat.questionCount', { current: Math.min(assistantCount, total), total })} · {t('preVisitIntake.chat.textOnly')}
      </Text>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
        {turns.map((turn) => {
          const mine = turn.role === 'patient';
          return (
            <View
              key={turn.id}
              testID={`intake-turn-${turn.role}`}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '86%',
                marginBottom: 10,
                padding: 12,
                borderRadius: 16,
                borderWidth: mine ? 0 : 1.5,
                borderColor: p.border,
                backgroundColor: mine ? p.gold : p.card,
              }}
            >
              <Text style={[intakeStyles.small, { color: mine ? p.onAccent : p.accent, fontWeight: '700', marginBottom: 2 }]}>
                {mine ? t('preVisitIntake.chat.youLabel') : t('preVisitIntake.chat.assistantLabel')}
              </Text>
              <Text style={[intakeStyles.body, { color: mine ? p.onAccent : p.text }]}>{turn.text}</Text>
            </View>
          );
        })}
        {sending ? <ActivityIndicator color={p.gold} style={{ alignSelf: 'flex-start', margin: 8 }} /> : null}
        {done ? <Text style={[intakeStyles.small, { color: p.sub, textAlign: 'center', marginTop: 4 }]}>{t('preVisitIntake.chat.doneHint')}</Text> : null}
      </ScrollView>
      {done ? null : (
        <Composer mode={PRE_VISIT_INTAKE_CONFIG.INPUT_MODE} value={draft} onChange={setDraft} onSend={send} disabled={sending} />
      )}
      <IntakePrimaryButton
        testID="intake-chat-finish"
        label={t('preVisitIntake.chat.finish')}
        disabled={sending || patientCount === 0}
        onPress={onFinished}
      />
      <IntakeSecondaryButton testID="intake-chat-leave" label={t('preVisitIntake.chat.leave')} onPress={onLeave} />
    </KeyboardAvoidingView>
  );
}
