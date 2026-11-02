-- Check Subscription Status for a User
-- Replace 'YOUR_USER_ID' with your Firebase user ID (uid)

-- Option 1: Check specific user by user_id
SELECT 
  user_id,
  email,
  plan,
  stripe_customer_id,
  current_period_end,
  trial_start,
  trial_end,
  trial_eligible,
  created_at,
  updated_at,
  -- Calculate days remaining
  CASE 
    WHEN plan = 'pro' AND current_period_end IS NOT NULL THEN
      EXTRACT(DAY FROM (current_period_end - NOW()))::INTEGER
    WHEN plan = 'trial' AND trial_end IS NOT NULL THEN
      EXTRACT(DAY FROM (trial_end - NOW()))::INTEGER
    ELSE NULL
  END as days_remaining
FROM user_profiles
WHERE user_id = 'YOUR_USER_ID';  -- Replace with your Firebase user ID

-- Option 2: Check all users with pro subscriptions
SELECT 
  user_id,
  email,
  plan,
  stripe_customer_id,
  current_period_end,
  EXTRACT(DAY FROM (current_period_end - NOW()))::INTEGER as days_remaining,
  updated_at
FROM user_profiles
WHERE plan = 'pro'
ORDER BY current_period_end DESC;

-- Option 3: Check all recent subscriptions (last 24 hours)
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

-- Option 4: Use the helper function (if available)
SELECT get_user_subscription_status('YOUR_USER_ID') as status;  -- Replace with your Firebase user ID









