import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PRE_VISIT_INTAKE_CONFIG } from '../../config/preVisitIntake';
import { getPreVisitIntakeClient } from '../../services/preVisitIntake';
import {
  initialIntakeState,
  intakeReducer,
  isAppointmentEligible,
  requiresDiscardConfirmation,
  type IntakeOutcome,
} from '../../services/preVisitIntake/flow';
import type { IntakeDoctor, IntakeSession, IntakeTurn, PreVisitIntakeClient } from '../../services/preVisitIntake/types';
import IntakeFrame from './IntakeFrame';
import IntakeChat from './IntakeChat';
import SummaryReview from './SummaryReview';
import IntakeHistory from './IntakeHistory';
import ConfirmDialog from './ConfirmDialog';
import { IntakePaletteProvider } from './intakeTheme';
import {
  DoneStep,
  IntakeError,
  OfferCard,
  SelectAppointmentStep,
  SelectDoctorStep,
  type IntakeAppointmentOption,
} from './IntakeSimpleSteps';

export interface PreVisitIntakeFlowProps {
  appointments: (IntakeAppointmentOption & { status?: string })[];
  /** 'book' = offered right after saving an appointment; 'history' = past summaries for one appointment. */
  mode: 'book' | 'history';
  initialAppointmentId?: string | null;
  justBookedId?: string | null;
  onClose: (outcome: IntakeOutcome) => void;
  dark?: boolean;
  /** Injected in tests; defaults to the flag-selected client (mock or http). */
  client?: PreVisitIntakeClient;
  now?: () => Date;
  /** Incremented by the host (e.g. Android back) to request a close; the flow decides whether to confirm. */
  closeRequestToken?: number;
}

const STEP_INDEX: Record<string, number> = { selectAppointment: 1, selectDoctor: 2, offer: 3, chat: 4, review: 5 };
const TOTAL_STEPS = 5;

export default function PreVisitIntakeFlow(props: PreVisitIntakeFlowProps) {
  return (
    <IntakePaletteProvider dark={props.dark !== false}>
      <FlowInner {...props} />
    </IntakePaletteProvider>
  );
}

function FlowInner({ appointments, mode, initialAppointmentId, justBookedId, onClose, client: injected, now, closeRequestToken }: PreVisitIntakeFlowProps) {
  const { t, i18n } = useTranslation();
  const locale: 'en' | 'es' = String(i18n?.language || 'es').startsWith('es') ? 'es' : 'en';
  const client = useMemo(
    () => injected ?? getPreVisitIntakeClient((key, lng) => String(i18n.t(`preVisitIntake.mockQuestions.${key}`, { lng }))),
    [injected, i18n]
  );
  const [state, dispatch] = useReducer(intakeReducer, initialIntakeState({ appointmentId: initialAppointmentId ?? null, mode }));
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(initialAppointmentId ?? null);
  const [pendingDoctorId, setPendingDoctorId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<IntakeDoctor[] | null>(null);
  const [firstTurns, setFirstTurns] = useState<IntakeTurn[]>([]);
  const [shared, setShared] = useState<IntakeSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [dialog, setDialog] = useState<React.ReactNode>(null);

  const eligible = useMemo(
    () => appointments.filter((a) => isAppointmentEligible({ id: a.id, startDate: a.startDate, status: a.status }, now ? now() : new Date())),
    [appointments, now]
  );
  const appointment = appointments.find((a) => a.id === state.appointmentId) ?? null;
  const doctor = doctors?.find((d) => d.id === state.doctorId) ?? null;

  useEffect(() => {
    if (state.step === 'closed') onClose(state.outcome);
  }, [state.step, state.outcome, onClose]);

  useEffect(() => {
    if (state.step !== 'selectDoctor' || doctors !== null) return;
    let alive = true;
    client
      .listEligibleDoctors()
      .then((list) => alive && setDoctors(list))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [state.step, doctors, client]);

  const start = async () => {
    if (!appointment || !doctor || busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await client.startSession({
        appointmentId: appointment.id,
        appointmentStartIso: appointment.startDate,
        doctorId: doctor.id,
        locale,
        consent: {
          acceptedAt: new Date().toISOString(),
          noticeVersion: PRE_VISIT_INTAKE_CONFIG.CONSENT_NOTICE_VERSION,
          emergencyDisclaimerVersion: PRE_VISIT_INTAKE_CONFIG.EMERGENCY_NOTICE_VERSION,
        },
      });
      setFirstTurns(res.session.turns.length ? res.session.turns : [res.firstMessage]);
      dispatch({ type: 'SESSION_STARTED', sessionId: res.session.id });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const discardAndFinish = useCallback(
    async (thenClose: boolean) => {
      setLeaveOpen(false);
      if (state.sessionId) {
        try {
          await client.discard(state.sessionId);
        } catch {
          // Draft was never shared; the server also expires unconfirmed drafts.
        }
      }
      dispatch({ type: 'DISCARDED' });
      if (thenClose) dispatch({ type: 'CLOSE' });
    },
    [client, state.sessionId]
  );

  const requestClose = () => {
    if (requiresDiscardConfirmation(state.step)) setLeaveOpen(true);
    else if (state.step === 'selectAppointment' || state.step === 'selectDoctor' || state.step === 'offer') dispatch({ type: 'SKIP' });
    else dispatch({ type: 'CLOSE' });
  };

  const lastToken = React.useRef(closeRequestToken);
  useEffect(() => {
    if (closeRequestToken === undefined || closeRequestToken === lastToken.current) return;
    lastToken.current = closeRequestToken;
    requestClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeRequestToken]);

  const stepIdx = STEP_INDEX[state.step];
  const frameStep = stepIdx ? { current: stepIdx, total: TOTAL_STEPS } : null;
  const skip = () => dispatch({ type: 'SKIP' });

  let content: React.ReactNode = null;
  if (error && state.step !== 'chat' && state.step !== 'review') {
    content = <IntakeError onRetry={() => { setError(false); if (state.step === 'selectDoctor') setDoctors(null); }} onSkip={requestClose} />;
  } else if (state.step === 'selectAppointment') {
    content = (
      <SelectAppointmentStep
        appointments={eligible}
        selectedId={pendingAppointmentId}
        justBookedId={justBookedId}
        locale={locale}
        onSelect={setPendingAppointmentId}
        onContinue={() => pendingAppointmentId && dispatch({ type: 'SELECT_APPOINTMENT', appointmentId: pendingAppointmentId })}
        onSkip={skip}
      />
    );
  } else if (state.step === 'selectDoctor') {
    content = (
      <SelectDoctorStep
        doctors={doctors}
        selectedId={pendingDoctorId}
        demo={client.mode === 'mock'}
        onSelect={setPendingDoctorId}
        onContinue={() => pendingDoctorId && dispatch({ type: 'SELECT_DOCTOR', doctorId: pendingDoctorId })}
        onBack={() => dispatch({ type: 'BACK' })}
        onSkip={skip}
      />
    );
  } else if (state.step === 'offer' && doctor) {
    content = (
      <OfferCard
        doctorName={doctor.displayName}
        retentionDays={PRE_VISIT_INTAKE_CONFIG.RAW_CHAT_RETENTION_DAYS_AFTER_APPOINTMENT}
        busy={busy}
        onStart={start}
        onBack={() => dispatch({ type: 'BACK' })}
        onSkip={skip}
      />
    );
  } else if (state.step === 'chat' && state.sessionId) {
    content = (
      <IntakeChat
        client={client}
        sessionId={state.sessionId}
        initialTurns={firstTurns}
        onFinished={() => dispatch({ type: 'CHAT_FINISHED' })}
        onLeave={() => setLeaveOpen(true)}
        onError={() => setError(true)}
      />
    );
  } else if (state.step === 'review' && state.sessionId && doctor) {
    content = (
      <SummaryReview
        client={client}
        sessionId={state.sessionId}
        doctorName={doctor.displayName}
        onShared={(s) => {
          setShared(s);
          dispatch({ type: 'SHARED' });
        }}
        onDontSend={() =>
          setDialog(
            <ConfirmDialog
              visible
              testID="intake-discard-dialog"
              title={t('preVisitIntake.review.discardTitle')}
              body={t('preVisitIntake.review.discardBody')}
              confirmLabel={t('preVisitIntake.review.discardConfirm')}
              cancelLabel={t('preVisitIntake.common.cancel')}
              onCancel={() => setDialog(null)}
              onConfirm={() => {
                setDialog(null);
                discardAndFinish(false);
              }}
            />
          )
        }
      />
    );
  } else if (state.step === 'done' && (state.outcome === 'shared' || state.outcome === 'discarded')) {
    content = (
      <DoneStep
        outcome={state.outcome}
        doctorName={doctor?.displayName ?? shared?.doctorDisplayName ?? ''}
        rawChatDeleteAt={shared?.rawChatDeleteAt ?? null}
        locale={locale}
        onClose={() => dispatch({ type: 'CLOSE' })}
      />
    );
  } else if (state.step === 'history' && state.appointmentId) {
    const appt = appointments.find((a) => a.id === state.appointmentId);
    content = (
      <IntakeHistory
        client={client}
        appointmentId={state.appointmentId}
        appointmentTitle={appt?.title}
        canStartNew={!!appt && eligible.some((a) => a.id === appt.id)}
        locale={locale}
        onStartNew={() => {
          setPendingAppointmentId(state.appointmentId);
          dispatch({ type: 'START_FROM_HISTORY' });
        }}
        onClose={() => dispatch({ type: 'CLOSE' })}
        renderDialog={setDialog}
      />
    );
  }

  // Chat error keeps the chat mounted state simple: show the error card with skip (discard) option.
  if (error && (state.step === 'chat' || state.step === 'review')) {
    content = <IntakeError onRetry={() => setError(false)} onSkip={() => setLeaveOpen(true)} />;
  }

  return (
    <View style={{ flex: 1 }} testID={`intake-step-${state.step}`}>
      <IntakeFrame step={frameStep} onClose={requestClose} scroll={state.step !== 'chat'}>
        {content}
      </IntakeFrame>
      <ConfirmDialog
        visible={leaveOpen}
        testID="intake-leave-dialog"
        title={t('preVisitIntake.chat.leaveTitle')}
        body={t('preVisitIntake.chat.leaveBody')}
        confirmLabel={t('preVisitIntake.chat.leaveConfirm')}
        cancelLabel={t('preVisitIntake.chat.keepGoing')}
        onConfirm={() => discardAndFinish(true)}
        onCancel={() => setLeaveOpen(false)}
      />
      {dialog}
    </View>
  );
}
