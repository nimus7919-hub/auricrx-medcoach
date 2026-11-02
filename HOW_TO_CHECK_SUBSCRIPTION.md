# How to Check Subscription/Payment Status

After a successful Stripe payment, the subscription data is stored in your **Neon database** in the `user_profiles` table. Here are several ways to check it:

## Method 1: Using SQL Query (Recommended)

### Step 1: Get Your Firebase User ID

Your Firebase user ID (uid) is what's stored as `user_id` in the database. You can find it:

**Option A: From the app logs**
- When you log in, check the console logs for your Firebase user ID
- Look for logs like: `🆔 Using authenticated user ID: [your-uid]`

**Option B: From Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `auricrx-medcoach`
3. Go to **Authentication** → **Users**
4. Find your user and copy the **User UID**

### Step 2: Run the SQL Query

1. Open your **Neon database console** (or your database management tool)
2. Run one of these queries:

```sql
-- Replace 'YOUR_FIREBASE_UID' with your actual Firebase user ID
SELECT 
  user_id,
  email,
  plan,                    -- Should be 'pro' after payment
  stripe_customer_id,      -- Your Stripe customer ID
  current_period_end,      -- When subscription expires
  updated_at,             -- Last update time
  -- Calculate days remaining
  CASE 
    WHEN plan = 'pro' AND current_period_end IS NOT NULL THEN
      EXTRACT(DAY FROM (current_period_end - NOW()))::INTEGER
    ELSE NULL
  END as days_remaining
FROM user_profiles
WHERE user_id = 'YOUR_FIREBASE_UID';
```

**Expected Results After Payment:**
- `plan` should be `'pro'`
- `stripe_customer_id` should have a value (like `cus_...`)
- `current_period_end` should be a future date (30 days from payment)
- `days_remaining` should be around 30 days

## Method 2: Check All Recent Subscriptions

To see all users who recently subscribed:

```sql
SELECT 
  user_id,
  email,
  plan,
  stripe_customer_id,
  current_period_end,
  updated_at,
  EXTRACT(DAY FROM (current_period_end - NOW()))::INTEGER as days_remaining
FROM user_profiles
WHERE plan = 'pro' 
  AND updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

## Method 3: Using the API Endpoint

You can also check via the API:

```bash
# Replace YOUR_TOKEN with your auth token
curl -X GET https://auricrx-medcoach.onrender.com/api/me/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Or in your app, the subscription status is automatically loaded and should show `plan: 'pro'` after a successful payment.

## Method 4: Check Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Customers** → Find your customer
3. Check **Subscriptions** tab to see active subscriptions
4. The customer ID should match `stripe_customer_id` in your database

## What Should Happen After Payment

When a payment succeeds:

1. **Stripe webhook** (`/api/stripe/webhook`) receives the event
2. Updates `user_profiles` table:
   - Sets `plan = 'pro'`
   - Sets `current_period_end` to 30 days from now
   - Stores `stripe_customer_id`

## Troubleshooting

### Payment not reflected in database?

1. **Check webhook logs** on your server:
   - Look for logs like: `✅ Updated user [uid] to pro plan`
   - Check if webhook was received: Look for `checkout.session.completed` events

2. **Verify webhook is configured**:
   - In Stripe Dashboard → **Developers** → **Webhooks**
   - Should point to: `https://auricrx-medcoach.onrender.com/api/stripe/webhook`
   - Check if events are being received

3. **Manually trigger webhook** (if needed):
   - In Stripe Dashboard → **Payments** → Find your payment
   - Click **Send test webhook** → Select `checkout.session.completed`

4. **Check database directly**:
   ```sql
   -- Check if user exists
   SELECT * FROM user_profiles WHERE user_id = 'YOUR_UID';
   
   -- Check if webhook updated it
   SELECT plan, current_period_end, updated_at 
   FROM user_profiles 
   WHERE user_id = 'YOUR_UID';
   ```

## Fields in user_profiles Table

After payment, these fields should be updated:

| Field | Description | Expected Value |
|-------|-------------|----------------|
| `plan` | Subscription plan | `'pro'` |
| `stripe_customer_id` | Stripe customer ID | `cus_...` |
| `current_period_end` | Subscription end date | Future timestamp (30 days) |
| `updated_at` | Last update time | Recent timestamp |









