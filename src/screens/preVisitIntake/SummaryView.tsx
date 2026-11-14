import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { IntakeSummary } from '../../services/preVisitIntake/types';
import { intakeStyles, useIntakePalette } from './intakeTheme';

/** Read-only rendering of the fixed-field summary. No edit affordances by design (Freddy, 14 Nov 2026). */
export default function SummaryView({ summary }: { summary: IntakeSummary }) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  const none = t('preVisitIntake.review.notMentioned');
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={[intakeStyles.label, { color: p.accent }]}>{label}</Text>
      {children}
    </View>
  );
  const line = (v: string | null) => <Text style={[intakeStyles.body, { color: v ? p.text : p.sub }]}>{v ?? none}</Text>;
  const list = (items: string[]) =>
    items.length ? (
      items.map((v, i) => (
        <Text key={i} style={[intakeStyles.body, { color: p.text }]}>{`• ${v}`}</Text>
      ))
    ) : (
      <Text style={[intakeStyles.body, { color: p.sub }]}>{none}</Text>
    );
  return (
    <View testID="intake-summary-readonly">
      <Field label={t('preVisitIntake.review.fields.mainConcern')}>{line(summary.mainConcern)}</Field>
      <Field label={t('preVisitIntake.review.fields.location')}>{line(summary.location)}</Field>
      <Field label={t('preVisitIntake.review.fields.duration')}>{line(summary.duration)}</Field>
      <Field label={t('preVisitIntake.review.fields.severity')}>
        {line(summary.severityReported != null ? t('preVisitIntake.review.severityValue', { value: summary.severityReported }) : null)}
      </Field>
      <Field label={t('preVisitIntake.review.fields.alsoMentioned')}>{list(summary.alsoMentioned)}</Field>
      <Field label={t('preVisitIntake.review.fields.questionsForDoctor')}>{list(summary.questionsForDoctor)}</Field>
      <Text style={[intakeStyles.small, { color: p.sub, fontStyle: 'italic', marginTop: 4 }]}>{t('preVisitIntake.review.footer')}</Text>
    </View>
  );
}
