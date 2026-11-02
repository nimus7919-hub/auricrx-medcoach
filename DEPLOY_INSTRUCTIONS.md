# Deploy Instructions - Subscription Payment Fix

## The Problem
The payment succeeded in Stripe, but the database wasn't updated because:
1. The `/success` endpoint didn't exist (404 error)
2. The webhook may not have been configured properly

## What Was Fixed
I added three new endpoints to `server/index.js`:
1. `/success` - Handles Stripe redirect after payment
2. `/api/stripe/verify-subscription` - Manual verification endpoint
3. Improved webhook handler that works without webhook secret

## Deployment Steps

### Option 1: Deploy via Git (Recommended)

1. **Commit the changes:**
   ```bash
   git add server/index.js
   git commit -m "Add subscription payment success handler and verification endpoint"
   git push
   ```

2. **Wait for Render to auto-deploy** (usually takes 2-5 minutes)
   - Check your Render dashboard for deployment status
   - Look for "Deploy succeeded" message

3. **Verify deployment:**
   - Check Render logs to see the server restart
   - Try the verification endpoint: `https://auricrx-medcoach.onrender.com/api/stripe/verify-subscription?customer_id=cus_TMeFLpcsxISaDq`

### Option 2: Manual Deploy in Render Dashboard

1. Go to your Render dashboard
2. Find your service (`auricrx-medcoach`)
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

### Option 3: Manual SQL Update (Quick Fix for Existing Payment)

If you can't deploy right now, you can manually update the database:

1. Go to your Neon SQL Editor
2. Run the SQL from `server/manually-update-subscription.sql`
3. This will set `plan = 'pro'` for your existing payment

## After Deployment

Once deployed, for future payments:
- The `/success` endpoint will automatically update subscriptions
- The webhook will also process payments (if configured)
- The manual verification endpoint will be available for troubleshooting

## Testing After Deployment

1. **Test the success endpoint:**
   ```
   https://auricrx-medcoach.onrender.com/success?session_id=YOUR_SESSION_ID
   ```

2. **Test the verification endpoint:**
   ```
   https://auricrx-medcoach.onrender.com/api/stripe/verify-subscription?customer_id=cus_TMeFLpcsxISaDq
   ```

3. **Check the database:**
   ```sql
   SELECT user_id, plan, current_period_end 
   FROM user_profiles 
   WHERE stripe_customer_id = 'cus_TMeFLpcsxISaDq';
   ```

## Quick Fix for Your Current Payment

**Right now, before deploying**, you can manually update the database:

1. Open Neon SQL Editor
2. Run this SQL:
   ```sql
   UPDATE user_profiles
   SET 
     plan = 'pro',
     current_period_end = NOW() + INTERVAL '30 days'
   WHERE stripe_customer_id = 'cus_TMeFLpcsxISaDq';
   ```

This will immediately update your subscription status in the database.

