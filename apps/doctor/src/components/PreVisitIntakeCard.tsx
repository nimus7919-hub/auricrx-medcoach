import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TFunction } from 'i18next';
import type { IntakeSession } from '@auricrx/doctor-core';
import { sideFromRegionId } from '@auricrx/doctor-core';
import { colors } from '../theme/colors';
import BodyPainMapDiagram from './BodyPainMapDiagram';

function field(value: string | null | undefined, notMentioned: string): string {
  const v = (value || '').trim();
  return v ? v : notMentioned;
}

export default function PreVisitIntakeCard({
  session,
  t,
  patientLabel,
}: {
  session: IntakeSession;
  t: TFunction;
  patientLabel?: string;
}) {
  const [showChat, setShowChat] = useState(false);
  const summary = session.summary;
  const notMentioned = t('doctorMode.preVisitIntake.notMentioned');
  const severity =
    summary?.severityReported != null
      ? t('doctorMode.preVisitIntake.severitySaid', { n: summary.severityReported })
      : notMentioned;
  const chatGone = Boolean(session.rawChatDeletedAt) || session.turns.length === 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('doctorMode.preVisitIntake.title')}</Text>
      {patientLabel ? <Text style={styles.meta}>{patientLabel}</Text> : null}
      {session.sharedAt ? (
        <Text style={styles.meta}>
          {t('doctorMode.preVisitIntake.confirmedAt')} · {new Date(session.sharedAt).toLocaleString()}
        </Text>
      ) : null}
      {session.appointmentStartIso ? (
        <Text style={styles.meta}>
          {t('doctorMode.preVisitIntake.appointmentStart')} · {new Date(session.appointmentStartIso).toLocaleString()}
        </Text>
      ) : null}
      <Text style={styles.sub}>{t('doctorMode.preVisitIntake.subtitle')}</Text>
      {summary ? (
        <>
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.mainConcern')}</Text>
          <Text style={styles.text}>{field(summary.mainConcern, notMentioned)}</Text>
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.location')}</Text>
          <Text style={styles.text}>{field(summary.location, notMentioned)}</Text>
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.duration')}</Text>
          <Text style={styles.text}>{field(summary.duration, notMentioned)}</Text>
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.severity')}</Text>
          <Text style={styles.text}>{severity}</Text>
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.alsoMentioned')}</Text>
          {summary.alsoMentioned.length === 0 ? (
            <Text style={styles.text}>{notMentioned}</Text>
          ) : (
            summary.alsoMentioned.map((line, i) => (
              <Text key={i} style={styles.text}>
                {line}
              </Text>
            ))
          )}
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.questionsForDoctor')}</Text>
          {summary.questionsForDoctor.length === 0 ? (
            <Text style={styles.text}>{notMentioned}</Text>
          ) : (
            summary.questionsForDoctor.map((line, i) => (
              <Text key={i} style={styles.text}>
                {line}
              </Text>
            ))
          )}
        </>
      ) : (
        <Text style={styles.meta}>{t('doctorMode.preVisitIntake.empty')}</Text>
      )}
      {session.bodyPainMap && session.bodyPainMap.markers.length > 0 ? (
        <>
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.bodyMap.title')}</Text>
          <Text style={styles.sub}>{t('doctorMode.preVisitIntake.bodyMap.subtitle')}</Text>
          <BodyPainMapDiagram payload={session.bodyPainMap} t={t} />
          {session.bodyPainMap.markers.map((m, i) => {
            const side = sideFromRegionId(m.regionId);
            const sideLabel =
              side === 'left'
                ? t('doctorMode.preVisitIntake.bodyMap.sideLeft')
                : side === 'right'
                  ? t('doctorMode.preVisitIntake.bodyMap.sideRight')
                  : t('doctorMode.preVisitIntake.bodyMap.sideNone');
            const feel =
              m.feels.length > 0
                ? m.feels.map((f) => t(`doctorMode.preVisitIntake.bodyMap.feelWords.${f}`)).join(', ')
                : notMentioned;
            const onset = m.onset
              ? t(`doctorMode.preVisitIntake.bodyMap.onsetWords.${m.onset}`)
              : notMentioned;
            const intensity =
              m.intensity != null
                ? t('doctorMode.preVisitIntake.bodyMap.intensitySaid', { n: m.intensity })
                : notMentioned;
            return (
              <View key={`${m.regionId}-${i}`} style={styles.marker}>
                <Text style={styles.text}>
                  {i + 1}. {m.layerLabel} · {m.regionLabel}
                </Text>
                <Text style={styles.meta}>
                  {t('doctorMode.preVisitIntake.bodyMap.layer')}: {m.layerLabel}
                </Text>
                <Text style={styles.meta}>
                  {t('doctorMode.preVisitIntake.bodyMap.region')}: {m.regionLabel}
                </Text>
                <Text style={styles.meta}>
                  {t('doctorMode.preVisitIntake.bodyMap.side')}: {sideLabel}
                </Text>
                <Text style={styles.meta}>
                  {t('doctorMode.preVisitIntake.bodyMap.intensity')}: {intensity}
                </Text>
                <Text style={styles.meta}>
                  {t('doctorMode.preVisitIntake.bodyMap.feels')}: {feel}
                </Text>
                <Text style={styles.meta}>
                  {t('doctorMode.preVisitIntake.bodyMap.onset')}: {onset}
                </Text>
                {m.note ? (
                  <Text style={styles.comment}>
                    {t('doctorMode.preVisitIntake.bodyMap.note')}: {m.note}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </>
      ) : null}
      {session.patientComment ? (
        <>
          <Text style={styles.label}>{t('doctorMode.preVisitIntake.comment')}</Text>
          <Text style={styles.comment}>{session.patientComment}</Text>
        </>
      ) : null}
      {chatGone ? (
        <Text style={styles.meta}>{t('doctorMode.preVisitIntake.chatDeleted')}</Text>
      ) : (
        <>
          <TouchableOpacity
            onPress={() => setShowChat((v) => !v)}
            accessibilityRole="link"
            accessibilityLabel={t(
              showChat ? 'doctorMode.preVisitIntake.hideConversation' : 'doctorMode.preVisitIntake.viewConversation'
            )}
          >
            <Text style={styles.link}>
              {t(showChat ? 'doctorMode.preVisitIntake.hideConversation' : 'doctorMode.preVisitIntake.viewConversation')}
            </Text>
          </TouchableOpacity>
          {showChat &&
            session.turns.map((turn) => (
              <Text key={turn.id} style={styles.turn}>
                {turn.role}: {turn.text}
              </Text>
            ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 8 },
  text: { color: colors.text, fontSize: 14, marginBottom: 2 },
  comment: { color: colors.text, fontSize: 14, marginBottom: 4, fontStyle: 'italic' },
  meta: { color: colors.sub, fontSize: 13, marginBottom: 4 },
  sub: { color: colors.sub, fontSize: 13, marginBottom: 8, lineHeight: 18 },
  link: { color: colors.accent, fontSize: 14, marginTop: 10, textDecorationLine: 'underline' },
  turn: { color: colors.sub, fontSize: 13, marginTop: 6, lineHeight: 18 },
  marker: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
});
