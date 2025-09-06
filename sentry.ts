// sentry.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? '',
  enableInExpoDevelopment: true,
  debug: __DEV__,        // logs to console in dev
  tracesSampleRate: 1.0, // enable performance traces (optional)
});
