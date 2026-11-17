import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PRE_VISIT_INTAKE_CONFIG } from '../../config/preVisitIntake';
import type { IntakeSession, IntakeSummary, PreVisitIntakeClient } from '../../services/preVisitIntake/types';
import SummaryView from './SummaryView';
import { intakeStyles, useIntakePalette } from './intakeTheme';
import { IntakePrimaryButton, IntakeSecondaryButton } from './IntakeButtons';
import { IntakeError } from './IntakeSimpleSteps';

interface Props {
  client: PreVisitIntakeClient;
  sessionId: string;
  doctorName: string;
  onShared: (session: IntakeSession) => void;
  onDontSend: () => void;
}

export default function SummaryReview({ client, sessionId, doctorName, onShared, onDontSend }: Props) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  const [summary, setSummary] = useState<IntakeSummary | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setSummary(await client.getSummary(sessionId));
    } catch {
      setError(true);
    }
  }, [client, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await client.addComment(sessionId, comment);
      const session = await client.confirmAndShare(sessionId);
      onShared(session);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <IntakeError onRetry={load} onSkip={onDontSend} />;
  if (!summary) return <ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />;

  return (
    <View testID="intake-review">
      <Text style={[intakeStyles.title, { color: p.text }]}>{t('preVisitIntake.review.title')}</Text>
      <Text style={[intakeStyles.subtitle, { color: p.sub }]}>{t('preVisitIntake.review.readOnlyNote')}</Text>
      <View style={[intakeStyles.card, { backgroundColor: p.card, borderColor: p.border }]}>
        <SummaryView summary={summary} />
      </View>
      <View style={[intakeStyles.card, { backgroundColor: p.card, borderColor: p.border }]}>
        <Text style={[intakeStyles.label, { color: p.accent }]}>{t('preVisitIntake.review.commentLabel')}</Text>
        <TextInput
          testID="intake-comment-input"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={PRE_VISIT_INTAKE_CONFIG.MAX_COMMENT_LENGTH}
          placeholder={t('preVisitIntake.review.commentPlaceholder', { doctor: doctorName })}
          placeholderTextColor={p.sub}
          style={{ minHeight: 84, borderWidth: 1.5, borderColor: p.border, borderRadius: 14, padding: 12, color: p.text, backgroundColor: p.bg, fontSize: 15, textAlignVertical: 'top' }}
        />
        <Text style={[intakeStyles.small, { color: p.sub, marginTop: 6 }]}>{t('preVisitIntake.review.commentHint')}</Text>
      </View>
      <Text style={[intakeStyles.small, { color: p.sub }]}>{t('preVisitIntake.review.recipient', { doctor: doctorName })}</Text>
      <IntakePrimaryButton testID="intake-share" label={t('preVisitIntake.review.share', { doctor: doctorName })} disabled={busy} onPress={share} />
      <IntakeSecondaryButton testID="intake-dont-send" label={t('preVisitIntake.review.dontSend')} disabled={busy} onPress={onDontSend} />
    </View>
  );
}
