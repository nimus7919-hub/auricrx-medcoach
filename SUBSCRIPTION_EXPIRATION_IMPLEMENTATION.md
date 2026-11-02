# Subscription Expiration Implementation

## What Was Implemented

### 1. **Subscription Expired Modal** (`src/components/SubscriptionExpiredModal.tsx`)
- Themed modal matching app design
- Multi-language support (EN, ES, FR, DE, ZH)
- Shows message about 30-day grace period
- Two buttons: "Subscribe Now" and "Later"
- Automatically logs out user after dismissal

### 2. **Automatic Expiration Detection** (App.js)
- Checks subscription status when user logs in
- Detects when `daysLeft === 0` or `status === 'expired'`
- Shows modal immediately when expired
- Automatically logs out user after modal is dismissed

### 3. **Grace Period Tracking** (Server)
- When subscription expires, sets `grace_expires_at = NOW() + 30 days`
- Grace period is automatically set when subscription status is checked
- Data is preserved during grace period

### 4. **Data Deletion After Grace Period** (Server)
- New endpoint: `POST /api/admin/cleanup-expired-accounts`
- Deletes all user data after grace period expires:
  - health_data
  - user_medications
  - user_supplements
  - user_symptoms
  - user_doctors
  - user_fasting_profiles
  - medication_contributions
  - supplement_contributions
- Marks profile as 'deleted' (keeps audit trail)
- Requires admin key for security

## How It Works

### Flow:
1. **User logs in** → Subscription status is checked
2. **If expired** (`daysLeft === 0`):
   - Modal appears immediately
   - User sees message about 30-day grace period
   - User can click "Subscribe Now" or "Later"
3. **After dismissal**:
   - User is automatically logged out
   - Data remains in cloud for 30 days
4. **Grace period tracking**:
   - `grace_expires_at` is set when subscription expires
   - Server tracks this date in database
5. **After 30 days**:
   - Admin cleanup job deletes all user data
   - Profile marked as 'deleted'

## Setting Up Automatic Cleanup

### Option 1: Using Render Cron Jobs
1. Go to Render dashboard
2. Add a Cron Job
3. Schedule: Daily at 2 AM (or your preferred time)
4. Command: `curl -X POST https://auricrx-medcoach.onrender.com/api/admin/cleanup-expired-accounts -H "x-admin-key: YOUR_SECRET_KEY"`

### Option 2: Using External Cron Service
Use a service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)

Set up a daily job that calls:
```
POST https://auricrx-medcoach.onrender.com/api/admin/cleanup-expired-accounts
Header: x-admin-key: YOUR_SECRET_KEY
```

### Option 3: Manual Trigger
You can manually trigger cleanup:
```bash
curl -X POST https://auricrx-medcoach.onrender.com/api/admin/cleanup-expired-accounts \
  -H "x-admin-key: YOUR_SECRET_KEY"
```

## Environment Variable

Add to your Render environment variables:
```
ADMIN_CLEANUP_KEY=your-secret-key-here
```

## Testing

### Test Expiration Modal:
1. Set a user's subscription to expired in database:
   ```sql
   UPDATE user_profiles 
   SET plan = 'expired', 
       current_period_end = NOW() - INTERVAL '1 day'
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. Log in as that user
3. Modal should appear immediately
4. User should be logged out after dismissing

### Test Grace Period:
1. Check that `grace_expires_at` is set:
   ```sql
   SELECT user_id, plan, grace_expires_at 
   FROM user_profiles 
   WHERE plan = 'expired';
   ```

2. Should show `grace_expires_at = NOW() + 30 days`

### Test Cleanup:
1. Set a user past grace period:
   ```sql
   UPDATE user_profiles 
   SET grace_expires_at = NOW() - INTERVAL '1 day'
   WHERE user_id = 'TEST_USER_ID';
   ```

2. Call cleanup endpoint
3. Verify data is deleted

## Database Schema

The following columns are used:
- `plan`: 'trial', 'pro', 'expired', 'deleted'
- `current_period_end`: When subscription/trial ends
- `grace_expires_at`: When grace period ends (30 days after expiration)

## User Experience

When subscription expires:
1. ✅ Modal appears immediately (cannot be ignored)
2. ✅ Clear message about 30-day grace period
3. ✅ Option to subscribe immediately
4. ✅ Automatic logout (data preserved)
5. ✅ Data deleted after 30 days if not renewed

## Notes

- Modal is non-dismissible (must click a button)
- User is always logged out after expiration
- Data is safe during grace period
- Cleanup job runs daily (must be set up)
- All deletions are logged for audit









