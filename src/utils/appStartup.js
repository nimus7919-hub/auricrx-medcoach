import Constants from 'expo-constants';
import CrashLogger from './crashLogger';

export const USING_EXPO_GO = Constants.appOwnership === "expo";

console.log('🚀 AuricRx MedCoach App Starting...', { USING_EXPO_GO });

if (typeof global !== 'undefined' && !global.__unhandledRejectionHandlerSet) {
  global.__unhandledRejectionHandlerSet = true;
  
  // Capture unhandled promise rejections
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
  
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    console.error('💥 GLOBAL ERROR HANDLER:', { error, isFatal, message: error?.message, stack: error?.stack });
    CrashLogger.logUnhandledError(error, isFatal).catch(e => {
      console.error('Failed to log crash:', e);
    });
    
    // Call original handler if it exists
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections
  if (typeof Promise !== 'undefined' && Promise.reject) {
    const originalReject = Promise.reject;
    Promise.reject = function(reason) {
      console.error('💥 UNHANDLED PROMISE REJECTION:', reason);
      CrashLogger.logUnhandledRejection(reason).catch(e => {
        console.error('Failed to log unhandled rejection:', e);
      });
      return originalReject.call(this, reason);
    };
  }
}

console.log('✅ Global error handlers initialized');
