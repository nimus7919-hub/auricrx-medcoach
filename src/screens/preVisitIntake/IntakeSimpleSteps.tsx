import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { IntakeDoctor } from '../../services/preVisitIntake/types';
import { intakeStyles, useIntakePalette } from './intakeTheme';
import { IntakePrimaryButton, IntakeSecondaryButton } from './IntakeButtons';

export interface IntakeAppointmentOption {
  id: string;
  title: string;
  startDate: string;
  location?: string;
  doctorName?: string;
}

export function formatIntakeDate(iso: string, locale: 'en' | 'es', withTime = false): { date: string; time: string } {
  const d = new Date(iso);
  const tag = locale === 'es' ? 'es-MX' : 'en-US';
  return {
    date: d.toLocaleDateString(tag, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: withTime ? d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' }) : '',
  };
}

function Option({ selected, onPress, testID, children }: { selected: boolean; onPress: () => void; testID?: string; children: React.ReactNode }) {
  const p = useIntakePalette();
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[intakeStyles.option, { borderColor: selected ? p.gold : p.border, backgroundColor: selected ? p.muted : p.card }]}
    >
      {children}
    </TouchableOpacity>
  );
}

export function SelectAppointmentStep(props: {
  appointments: IntakeAppointmentOption[];
  selectedId: string | null;
  justBookedId?: string | null;
  locale: 'en' | 'es';
  onSelect: (id: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  return (
    <View>
      <Text style={[intakeStyles.title, { color: p.text }]}>{t('preVisitIntake.selectAppointment.title')}</Text>
      <Text style={[intakeStyles.subtitle, { color: p.sub }]}>{t('preVisitIntake.selectAppointment.subtitle')}</Text>
      {props.appointments.length === 0 ? (
        <Text style={[intakeStyles.body, { color: p.sub, marginBottom: 12 }]}>{t('preVisitIntake.selectAppointment.empty')}</Text>
      ) : (
        props.appointments.map((a) => {
          const { date, time } = formatIntakeDate(a.startDate, props.locale, true);
          return (
            <Option key={a.id} testID={`intake-appt-${a.id}`} selected={props.selectedId === a.id} onPress={() => props.onSelect(a.id)}>
              {props.justBookedId === a.id ? (
                <View style={[intakeStyles.badge, { backgroundColor: p.gold }]}>
                  <Text style={[intakeStyles.badgeText, { color: p.onAccent }]}>{t('preVisitIntake.selectAppointment.justBooked')}</Text>
                </View>
              ) : null}
              <Text style={[intakeStyles.body, { color: p.text, fontWeight: '700' }]}>{a.title}</Text>
              <Text style={[intakeStyles.small, { color: p.sub }]}>{t('preVisitIntake.selectAppointment.dateAt', { date, time })}</Text>
              {a.location ? <Text style={[intakeStyles.small, { color: p.sub }]}>{a.location}</Text> : null}
            </Option>
          );
        })
      )}
      <IntakePrimaryButton
        testID="intake-appt-continue"
        label={t('preVisitIntake.selectAppointment.continue')}
        disabled={!props.selectedId}
        onPress={props.onContinue}
      />
      <IntakeSecondaryButton testID="intake-skip" label={t('preVisitIntake.offer.notNow')} onPress={props.onSkip} />
    </View>
  );
}

export function SelectDoctorStep(props: {
  doctors: IntakeDoctor[] | null;
  selectedId: string | null;
  demo: boolean;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  return (
    <View>
      <Text style={[intakeStyles.title, { color: p.text }]}>{t('preVisitIntake.selectDoctor.title')}</Text>
      <Text style={[intakeStyles.subtitle, { color: p.sub }]}>{t('preVisitIntake.selectDoctor.subtitle')}</Text>
      {props.demo ? (
        <View style={[intakeStyles.badge, { backgroundColor: p.chip }]}>
          <Text style={[intakeStyles.badgeText, { color: p.text }]}>{t('preVisitIntake.common.demoBadge')}</Text>
        </View>
      ) : null}
      {props.doctors === null ? (
        <ActivityIndicator color={p.gold} style={{ marginVertical: 16 }} />
      ) : props.doctors.length === 0 ? (
        <Text style={[intakeStyles.body, { color: p.sub, marginBottom: 12 }]}>{t('preVisitIntake.selectDoctor.empty')}</Text>
      ) : (
        props.doctors.map((d) => (
          <Option key={d.id} testID={`intake-doctor-${d.id}`} selected={props.selectedId === d.id} onPress={() => props.onSelect(d.id)}>
            <Text style={[intakeStyles.body, { color: p.text, fontWeight: '700' }]}>{d.displayName}</Text>
          </Option>
        ))
      )}
      <IntakePrimaryButton
        testID="intake-doctor-continue"
        label={t('preVisitIntake.selectDoctor.continue')}
        disabled={!props.selectedId}
        onPress={props.onContinue}
      />
      <IntakeSecondaryButton label={t('preVisitIntake.common.back')} onPress={props.onBack} />
      <IntakeSecondaryButton testID="intake-skip" label={t('preVisitIntake.offer.notNow')} onPress={props.onSkip} />
    </View>
  );
}

export function OfferCard(props: { doctorName: string; retentionDays: number; busy: boolean; onStart: () => void; onBack: () => void; onSkip: () => void }) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  return (
    <View testID="intake-offer-card" style={[intakeStyles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={[intakeStyles.badge, { backgroundColor: p.gold }]}>
        <Text style={[intakeStyles.badgeText, { color: p.onAccent }]}>{t('preVisitIntake.optionalBadge')}</Text>
      </View>
      <Text style={[intakeStyles.title, { color: p.text }]}>{t('preVisitIntake.offer.title')}</Text>
      <Text style={[intakeStyles.body, { color: p.text, marginBottom: 10 }]}>{t('preVisitIntake.offer.body', { doctor: props.doctorName })}</Text>
      <Text style={[intakeStyles.small, { color: p.sub, marginBottom: 8 }]}>{t('preVisitIntake.offer.optional')}</Text>
      <Text style={[intakeStyles.small, { color: p.sub, marginBottom: 8 }]}>
        {t('preVisitIntake.offer.privacy', { doctor: props.doctorName, days: props.retentionDays })}
      </Text>
      <Text style={[intakeStyles.small, { color: p.sub }]}>{t('preVisitIntake.offer.notMedical')}</Text>
      <IntakePrimaryButton testID="intake-offer-start" label={t('preVisitIntake.offer.start')} disabled={props.busy} onPress={props.onStart} />
      <IntakeSecondaryButton testID="intake-skip" label={t('preVisitIntake.offer.notNow')} onPress={props.onSkip} />
      <IntakeSecondaryButton label={t('preVisitIntake.common.back')} onPress={props.onBack} />
    </View>
  );
}

export function DoneStep(props: { outcome: 'shared' | 'discarded'; doctorName: string; rawChatDeleteAt: string | null; locale: 'en' | 'es'; onClose: () => void }) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  const shared = props.outcome === 'shared';
  return (
    <View testID={`intake-done-${props.outcome}`} style={[intakeStyles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <Text style={[intakeStyles.title, { color: p.text }]}>
        {shared ? t('preVisitIntake.done.sharedTitle', { doctor: props.doctorName }) : t('preVisitIntake.done.discardedTitle')}
      </Text>
      <Text style={[intakeStyles.body, { color: p.sub }]}>{shared ? t('preVisitIntake.done.sharedBody') : t('preVisitIntake.done.discardedBody')}</Text>
      {shared && props.rawChatDeleteAt ? (
        <Text style={[intakeStyles.small, { color: p.sub, marginTop: 8 }]}>
          {t('preVisitIntake.done.retention', { date: formatIntakeDate(props.rawChatDeleteAt, props.locale).date })}
        </Text>
      ) : null}
      <IntakePrimaryButton testID="intake-done-close" label={t('preVisitIntake.done.backToAppointments')} onPress={props.onClose} />
    </View>
  );
}

export function IntakeError({ onRetry, onSkip }: { onRetry?: () => void; onSkip: () => void }) {
  const { t } = useTranslation();
  const p = useIntakePalette();
  return (
    <View testID="intake-error" style={[intakeStyles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <Text style={[intakeStyles.body, { color: p.text }]}>{t('preVisitIntake.common.errorGeneric')}</Text>
      {onRetry ? <IntakePrimaryButton label={t('preVisitIntake.common.retry')} onPress={onRetry} /> : null}
      <IntakeSecondaryButton label={t('preVisitIntake.offer.notNow')} onPress={onSkip} />
    </View>
  );
}
