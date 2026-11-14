import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { daysUntilRawChatDeletion } from '../../services/preVisitIntake/retention';
import type { IntakeSession, PreVisitIntakeClient } from '../../services/preVisitIntake/types';
import SummaryView from './SummaryView';
import ConfirmDialog from './ConfirmDialog';
import { intakeStyles, useIntakePalette } from './intakeTheme';
import { IntakePrimaryButton, IntakeSecondaryButton } from './IntakeButtons';
import { formatIntakeDate, IntakeError } from './IntakeSimpleSteps';

interface Props {
  client: PreVisitIntakeClient;
  appointmentId: string;
  appointmentTitle?: string;
  canStartNew: boolean;
  locale: 'en' | 'es';
  onStartNew: () => void;
  onClose: () => void;
  /** Lets the parent render the dialog above the frame. */
  renderDialog: (node: React.ReactNode) => void;
}

/** Past intake summaries for one appointment + "delete chat now". */
export default function IntakeHistory({ client, appointmentId, appointmentTitle, canStartNew, locale, onStartNew, onClose, renderDialog }: Props) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  const [sessions, setSessions] = useState<IntakeSession[] | null>(null);
  const [error, setError] = useState(false);
  const [openChat, setOpenChat] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setSessions(await client.listSessionsForAppointment(appointmentId));
    } catch {
      setError(true);
    }
  }, [client, appointmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const askDelete = (id: string) => {
    renderDialog(
      <ConfirmDialog
        visible
        testID="intake-delete-chat-dialog"
        title={t('preVisitIntake.history.deleteTitle')}
        body={t('preVisitIntake.history.deleteBody')}
        confirmLabel={t('preVisitIntake.history.deleteConfirm')}
        cancelLabel={t('preVisitIntake.common.cancel')}
        onCancel={() => renderDialog(null)}
        onConfirm={async () => {
          renderDialog(null);
          try {
            await client.deleteChat(id);
            await load();
          } catch {
            setError(true);
          }
        }}
      />
    );
  };

  if (error) return <IntakeError onRetry={load} onSkip={onClose} />;
  if (!sessions) return <ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />;

  return (
    <View testID="intake-history">
      <Text style={[intakeStyles.title, { color: p.text }]}>{t('preVisitIntake.history.title')}</Text>
      <Text style={[intakeStyles.subtitle, { color: p.sub }]}>
        {appointmentTitle ? `${appointmentTitle} · ` : ''}
        {t('preVisitIntake.history.subtitle')}
      </Text>
      {sessions.length === 0 ? (
        <Text style={[intakeStyles.body, { color: p.sub, marginBottom: 12 }]}>{t('preVisitIntake.history.empty')}</Text>
      ) : null}
      {sessions.map((s) => {
        const deleted = !!s.rawChatDeletedAt;
        return (
          <View key={s.id} testID={`intake-history-${s.id}`} style={[intakeStyles.card, { backgroundColor: p.card, borderColor: p.border }]}>
            <Text style={[intakeStyles.small, { color: p.accent, fontWeight: '700', marginBottom: 8 }]}>
              {t('preVisitIntake.history.sentOn', { doctor: s.doctorDisplayName, date: formatIntakeDate(s.sharedAt ?? s.updatedAt, locale).date })}
            </Text>
            {s.summary ? <SummaryView summary={s.summary} /> : null}
            {s.patientComment ? (
              <View style={{ marginTop: 10 }}>
                <Text style={[intakeStyles.label, { color: p.accent }]}>{t('preVisitIntake.history.commentLabel')}</Text>
                <Text style={[intakeStyles.body, { color: p.text }]}>{s.patientComment}</Text>
              </View>
            ) : null}
            <Text testID={`intake-retention-${s.id}`} style={[intakeStyles.small, { color: p.sub, marginTop: 10 }]}>
              {deleted
                ? t('preVisitIntake.history.chatDeleted')
                : t('preVisitIntake.history.chatAutoDelete', {
                    date: formatIntakeDate(s.rawChatDeleteAt, locale).date,
                    days: daysUntilRawChatDeletion(s.rawChatDeleteAt),
                  })}
            </Text>
            {!deleted && s.turns.length > 0 ? (
              <>
                <IntakeSecondaryButton
                  label={openChat === s.id ? t('preVisitIntake.history.hideChat') : t('preVisitIntake.history.showChat')}
                  onPress={() => setOpenChat(openChat === s.id ? null : s.id)}
                />
                {openChat === s.id
                  ? s.turns.map((turn) => (
                      <Text key={turn.id} style={[intakeStyles.small, { color: turn.role === 'patient' ? p.text : p.sub, marginTop: 6 }]}>
                        {(turn.role === 'patient' ? t('preVisitIntake.chat.youLabel') : t('preVisitIntake.chat.assistantLabel')) + ': ' + turn.text}
                      </Text>
                    ))
                  : null}
                <IntakeSecondaryButton testID={`intake-delete-chat-${s.id}`} label={t('preVisitIntake.history.deleteChat')} onPress={() => askDelete(s.id)} />
              </>
            ) : null}
          </View>
        );
      })}
      {canStartNew ? <IntakePrimaryButton testID="intake-history-start" label={t('preVisitIntake.history.start')} onPress={onStartNew} /> : null}
      <IntakeSecondaryButton label={t('preVisitIntake.common.close')} onPress={onClose} />
    </View>
  );
}
