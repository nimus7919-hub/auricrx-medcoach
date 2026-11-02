// OAuth client IDs come from app config for the selected build profile.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type GoogleAuthExtra = {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  expoClientId?: string;
  redirectScheme?: string;
  redirectPath?: string;
};

const rawExtra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as {
  googleAuth?: GoogleAuthExtra;
  auth?: { google?: GoogleAuthExtra };
  [key: string]: unknown;
};

const googleExtra = (rawExtra?.googleAuth ?? rawExtra?.auth?.google ?? {}) as GoogleAuthExtra;

function readEnv(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'undefined' && trimmed !== 'null' ? trimmed : undefined;
}

export const googleAuthConfig = {
  webClientId: googleExtra.webClientId,
  iosClientId: googleExtra.iosClientId,
  androidClientId: googleExtra.androidClientId,
  expoClientId: googleExtra.expoClientId,
  redirectScheme: readEnv('EXPO_PUBLIC_GOOGLE_REDIRECT_SCHEME') ?? googleExtra.redirectScheme ?? 'auricrx-medcoach',
  redirectPath: readEnv('EXPO_PUBLIC_GOOGLE_REDIRECT_PATH') ?? googleExtra.redirectPath ?? 'auth',
} as const;

export function getGoogleClientIdForPlatform(platform: string = Platform.OS): string | undefined {
  if (platform === 'ios') {
    return googleAuthConfig.iosClientId;
  }
  if (platform === 'android') {
    return googleAuthConfig.androidClientId;
  }
  return (
    googleAuthConfig.webClientId ??
    googleAuthConfig.expoClientId ??
    googleAuthConfig.iosClientId ??
    googleAuthConfig.androidClientId
  );
}

export function getExpoClientId(): string | undefined {
  return googleAuthConfig.expoClientId ?? googleAuthConfig.webClientId;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    googleAuthConfig.webClientId ||
      googleAuthConfig.iosClientId ||
      googleAuthConfig.androidClientId ||
      googleAuthConfig.expoClientId
  );
}




