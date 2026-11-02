# Debug Crash Logs Guide

## What Was Added

I've added comprehensive crash logging and debugging to help identify why the app closes unexpectedly.

### 1. **Global Error Handlers**
- Catches unhandled errors and promise rejections
- Logs all crashes to AsyncStorage
- Logs are saved even if the app crashes

### 2. **Crash Logger Utility** (`src/utils/crashLogger.js`)
- Saves crash logs to AsyncStorage
- Keeps last 50 crash logs
- Includes timestamp, error message, stack trace, and context

### 3. **Enhanced Logging**
- Added detailed logging around:
  - App initialization
  - Authentication state changes
  - Auth restoration
  - User data loading
  - Sign-in process

## How to View Crash Logs

### Option 1: From Console (During Development)
When a crash occurs, you'll see:
```
💥 CRASH LOG: { timestamp, message, stack, context, platform }
💥 GLOBAL ERROR HANDLER: { error, isFatal, message, stack }
💥 UNHANDLED PROMISE REJECTION: [reason]
```

### Option 2: From AsyncStorage (Programmatically)
You can add this to your Settings screen or create a debug screen:

```javascript
import CrashLogger from './src/utils/crashLogger';

// View all crash logs
const logs = await CrashLogger.getLogs();
console.log('Crash logs:', logs);

// Get as formatted string
const logsString = await CrashLogger.getAllLogsAsString();
console.log(logsString);

// Clear logs
await CrashLogger.clearLogs();
```

### Option 3: Add to Settings Screen
Add a button to view crash logs in your Settings screen:

```javascript
<TouchableOpacity onPress={async () => {
  const logs = await CrashLogger.getLogs();
  Alert.alert('Crash Logs', JSON.stringify(logs, null, 2));
}}>
  <Text>View Crash Logs</Text>
</TouchableOpacity>
```

## What to Look For

When the app closes unexpectedly, check the logs for:

1. **Auth-related errors**:
   - Look for `context: 'auth_restoration'` or `context: 'auth_state_change'`
   - Check for Firebase authentication errors

2. **Unhandled promise rejections**:
   - Look for `type: 'unhandled_rejection'`
   - These often cause silent crashes

3. **Fatal errors**:
   - Look for `isFatal: true`
   - These are the most likely cause of app crashes

4. **Recent timestamps**:
   - Check logs with timestamps just before the crash
   - Look at the stack trace to identify the exact line

## Common Crash Scenarios Logged

1. **Authentication Restoration**: When restoring auth state on app start
2. **Auth State Changes**: When Firebase auth state changes
3. **User Data Fetching**: When loading user data from server
4. **Unhandled Promise Rejections**: Any uncaught promise rejections
5. **Global Errors**: Any unhandled JavaScript errors

## Next Steps

1. **Run the app** and try to reproduce the crash
2. **Check console logs** for crash messages
3. **View crash logs** from AsyncStorage using the methods above
4. **Share the crash logs** with the error details so we can identify the root cause

## Debugging Tips

- If you see "Auth restoration" errors, the issue is likely in Firebase initialization
- If you see "Unhandled promise rejection", look for async operations without `.catch()`
- If you see "Fatal error", check the stack trace for the exact location
- Check the `context` field in crash logs for additional debugging info









