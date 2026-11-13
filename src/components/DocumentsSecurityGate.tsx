import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import DynamicText from './DynamicText';
import { vip } from '../theme/vip';
import DocumentsSecurityService from '../services/documentsSecurityService';

type Props = {
  children: React.ReactNode;
  onClose: () => void;
};

/**
 * Wraps the Documents vault: biometric/device lock, idle + background re-lock,
 * app-switcher privacy cover, Android screenshot blocking while open.
 */
export default function DocumentsSecurityGate({ children, onClose }: Props) {
  const { t } = useTranslation();
  const security = DocumentsSecurityService.getInstance();

  const [booting, setBooting] = useState(true);
  const [lockEnabled, setLockEnabled] = useState(true);
  const [locked, setLocked] = useState(true);
  const [needsPrompt, setNeedsPrompt] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [noCredentialContinue, setNoCredentialContinue] = useState(false);
  const [appCovered, setAppCovered] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const coverApp = useCallback((covered: boolean) => {
    setAppCovered(covered);
  }, []);

  const applyLock = useCallback(async () => {
    security.lockSession();
    setLocked(true);
    await security.clearPlaintextCache();
  }, [security]);

  const runUnlock = useCallback(async () => {
    setAuthBusy(true);
    setStatusMessage(null);
    try {
      const capability = await security.getAuthCapability();
      if (capability === 'none') {
        setNoCredentialContinue(true);
        setStatusMessage(t('documentsSecurity.noCredentialsMessage'));
        return;
      }

      const result = await security.authenticateForDocuments(
        t('documentsSecurity.unlockPrompt'),
        t('common.cancel')
      );

      if (result.ok) {
        setLocked(false);
        setNoCredentialContinue(false);
        setStatusMessage(null);
      } else if (result.reason === 'error') {
        setStatusMessage(t('documentsSecurity.authError'));
      }
    } finally {
      setAuthBusy(false);
    }
  }, [security, t]);

  const continueWithoutLock = useCallback(async () => {
    security.unlockSession();
    setLocked(false);
    setNoCredentialContinue(false);
    setStatusMessage(null);
  }, [security]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const init = await security.initializeLockPreference();
      if (cancelled) return;
      setLockEnabled(init.enabled);
      setNeedsPrompt(init.needsPrompt);

      if (!init.enabled && !init.needsPrompt) {
        security.unlockSession();
        setLocked(false);
      } else if (init.needsPrompt) {
        // Wait for prompt decision before unlock attempt
        setLocked(true);
      } else {
        setLocked(true);
      }
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [security]);

  // One-time enable prompt for existing users
  useEffect(() => {
    if (booting || !needsPrompt) return;
    // Rendered as in-gate UI (not Alert) so it stays navy/gold and i18n-friendly
  }, [booting, needsPrompt]);

  // Auto-prompt unlock when lock is enabled and gate is locked
  useEffect(() => {
    if (booting || needsPrompt || !lockEnabled || !locked || authBusy || noCredentialContinue) return;
    runUnlock();
  }, [booting, needsPrompt, lockEnabled, locked, authBusy, noCredentialContinue, runUnlock]);

  // Idle re-lock inside Documents
  useEffect(() => {
    if (!lockEnabled || locked) {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }
    security.markActive();
    idleTimerRef.current = setInterval(() => {
      if (security.isIdleExpired()) {
        applyLock();
      }
    }, 15_000);
    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [lockEnabled, locked, security, applyLock]);

  // Background re-lock + privacy cover
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (next === 'inactive' || next === 'background') {
        coverApp(true);
        if (lockEnabled) {
          applyLock();
        }
      }

      if (next === 'active' && (prev === 'inactive' || prev === 'background')) {
        coverApp(false);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [lockEnabled, applyLock, coverApp]);

  // Android screenshot blocking while Documents is open
  useEffect(() => {
    let active = true;
    (async () => {
      if (Platform.OS === 'android') {
        await security.preventScreenshots();
      }
    })();
    return () => {
      if (!active) return;
      active = false;
      security.allowScreenshots();
      security.clearPlaintextCache();
    };
  }, [security]);

  const onUserActivity = useCallback(() => {
    security.markActive();
  }, [security]);

  const acceptEnableLock = async () => {
    await security.setLockEnabled(true);
    setLockEnabled(true);
    setNeedsPrompt(false);
    setLocked(true);
  };

  const declineEnableLock = async () => {
    await security.setLockEnabled(false);
    setLockEnabled(false);
    setNeedsPrompt(false);
    security.unlockSession();
    setLocked(false);
  };

  if (booting) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={vip.colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root} onTouchStart={onUserActivity} onStartShouldSetResponder={() => {
      onUserActivity();
      return false;
    }}>
      {/* Keep children mounted once unlocked at least once so vault state survives brief covers;
          while locked / prompting, hide content under the gate UI. */}
      <View
        style={[styles.content, (locked || needsPrompt) && styles.contentHidden]}
        pointerEvents={locked || needsPrompt ? 'none' : 'auto'}
        importantForAccessibility={locked || needsPrompt ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </View>

      {needsPrompt && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <DynamicText type="card" style={styles.title}>
              {t('documentsSecurity.enableTitle')}
            </DynamicText>
            <DynamicText type="card" style={styles.body}>
              {t('documentsSecurity.enableMessage')}
            </DynamicText>
            <TouchableOpacity style={styles.primaryBtn} onPress={acceptEnableLock}>
              <DynamicText type="button" style={styles.primaryBtnText}>
                {t('documentsSecurity.enableCta')}
              </DynamicText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={declineEnableLock}>
              <DynamicText type="card" style={styles.secondaryBtnText}>
                {t('documentsSecurity.notNow')}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!needsPrompt && lockEnabled && locked && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <DynamicText type="card" style={styles.title}>
              {t('documentsSecurity.lockedTitle')}
            </DynamicText>
            <DynamicText type="card" style={styles.body}>
              {statusMessage || t('documentsSecurity.lockedMessage')}
            </DynamicText>
            {noCredentialContinue ? (
              <>
                <TouchableOpacity style={styles.primaryBtn} onPress={continueWithoutLock}>
                  <DynamicText type="button" style={styles.primaryBtnText}>
                    {t('documentsSecurity.continueAnyway')}
                  </DynamicText>
                </TouchableOpacity>
                <DynamicText type="card" style={styles.hint}>
                  {t('documentsSecurity.setupScreenLockHint')}
                </DynamicText>
              </>
            ) : (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={runUnlock}
                disabled={authBusy}
              >
                {authBusy ? (
                  <ActivityIndicator color={vip.colors.navy} />
                ) : (
                  <DynamicText type="button" style={styles.primaryBtnText}>
                    {t('documentsSecurity.unlockCta')}
                  </DynamicText>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <DynamicText type="card" style={styles.secondaryBtnText}>
                {t('common.close')}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {appCovered && (
        <View style={styles.privacyCover} pointerEvents="none">
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidCover]} />
          )}
          <DynamicText type="card" style={styles.privacyLabel}>
            {t('documentsSecurity.privacyCover')}
          </DynamicText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: vip.colors.navy,
  },
  content: {
    flex: 1,
  },
  contentHidden: {
    opacity: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: vip.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: vip.radius.card,
    borderWidth: 1,
    borderColor: vip.colors.line,
    backgroundColor: vip.colors.glass,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: vip.colors.gold,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: vip.colors.white,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: vip.colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: vip.colors.gold,
    borderRadius: vip.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: vip.colors.onGold,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: vip.colors.goldLight,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  privacyCover: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  androidCover: {
    backgroundColor: vip.colors.navy,
  },
  privacyLabel: {
    color: vip.colors.gold,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
});
