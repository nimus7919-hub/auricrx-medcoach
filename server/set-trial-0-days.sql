-- ========================================
-- SET PRO PLAN TO TRIAL WITH 0 DAYS LEFT
-- ========================================
-- This script changes a user from 'pro' plan to 'trial' plan
-- with 0 days remaining (trial_end = NOW) to test expiration logic
--
-- STEP 1: First, find your user by checking pro plan users
-- ========================================

-- Option 1: List all users with 'pro' plan
SELECT 
  user_id,
  email,
  plan,
  stripe_customer_id,
  trial_start,
  trial_end,
  current_period_end
FROM user_profiles 
WHERE plan = 'pro'
ORDER BY updated_at DESC;

-- Option 2: Find by email (replace with your email)
-- SELECT 
--   user_id,
--   email,
--   plan,
--   stripe_customer_id
-- FROM user_profiles 
-- WHERE email = 'your-email@example.com';

-- Option 3: Find by stripe_customer_id (replace with your customer ID)
-- SELECT 
--   user_id,
--   email,
--   plan,
--   stripe_customer_id
-- FROM user_profiles 
-- WHERE stripe_customer_id = 'cus_xxxxxxxxxxxxx';

-- ========================================
-- STEP 2: Update to trial with 0 days left
-- ========================================
-- Choose ONE of the update queries below based on how you want to identify the user

-- Option A: Update by user_id (replace 'YOUR_USER_ID' with your Firebase user ID)
UPDATE user_profiles
SET 
  plan = 'trial',
  trial_start = NOW() - INTERVAL '14 days',  -- Trial started 14 days ago
  trial_end = NOW() - INTERVAL '1 second',   -- Trial ended 1 second ago (0 days left, immediately expired)
  trial_used_at = NOW() - INTERVAL '14 days', -- Trial was used 14 days ago
  trial_eligible = FALSE,                     -- Trial already used
  current_period_end = NULL                   -- Clear pro plan period
WHERE user_id = 'YOUR_USER_ID';  -- ⚠️ REPLACE WITH YOUR USER_ID

-- Option B: Update by email (replace with your email)
-- UPDATE user_profiles
-- SET 
--   plan = 'trial',
--   trial_start = NOW() - INTERVAL '14 days',
--   trial_end = NOW() - INTERVAL '1 second',  -- Immediately expired
--   trial_used_at = NOW() - INTERVAL '14 days',
--   trial_eligible = FALSE,
--   current_period_end = NULL
-- WHERE email = 'your-email@example.com';  -- ⚠️ REPLACE WITH YOUR EMAIL

-- Option C: Update by stripe_customer_id (replace with your customer ID)
-- UPDATE user_profiles
-- SET 
--   plan = 'trial',
--   trial_start = NOW() - INTERVAL '14 days',
--   trial_end = NOW() - INTERVAL '1 second',  -- Immediately expired
--   trial_used_at = NOW() - INTERVAL '14 days',
--   trial_eligible = FALSE,
--   current_period_end = NULL
-- WHERE stripe_customer_id = 'cus_xxxxxxxxxxxxx';  -- ⚠️ REPLACE WITH YOUR CUSTOMER ID

-- ========================================
-- STEP 3: Verify the update
-- ========================================
-- Run this to confirm the change (replace with your identifier)
SELECT 
  user_id,
  email,
  plan,
  trial_start,
  trial_end,
  trial_used_at,
  trial_eligible,
  EXTRACT(DAY FROM (trial_end - NOW()))::INTEGER as days_left,
  CASE 
    WHEN plan = 'trial' AND trial_end IS NOT NULL AND NOW() > trial_end THEN 'expired'
    WHEN plan = 'trial' AND trial_end IS NOT NULL AND NOW() <= trial_end THEN 'active'
    ELSE 'unknown'
  END as trial_status
FROM user_profiles 
WHERE user_id = 'YOUR_USER_ID';  -- ⚠️ REPLACE WITH YOUR USER_ID

-- ========================================
-- EXPECTED RESULT:
-- - plan: 'trial'
-- - days_left: 0 (or negative since trial_end is in the past)
-- - trial_status: 'expired'
-- ========================================
--
-- WHAT HAPPENS WHEN YOU TEST:
-- ========================================
-- 1. When the app loads, it calls /api/me/subscription
--    - This will return: plan='trial', daysLeft=0, status='expired'
--    - The app will detect expiration and show SubscriptionExpiredModal
--
-- 2. When you try to use protected features (sync, etc.):
--    - The verifyUser middleware checks: plan = 'trial' AND trial_end < NOW()
--    - Since trial_end is in the past, it will:
--      a. Update plan to 'expired' in the database
--      b. Return 401 with reason: 'SUBSCRIPTION_EXPIRED'
--      c. Block access to the feature
--
-- 3. In the UI:
--    - TrialWidget in the top bar will show "Trial Expired" in red
--    - SubscriptionExpiredModal will appear when the app loads
--    - User will be prompted to upgrade
--
-- ========================================
-- TO REVERT BACK TO PRO PLAN:
-- ========================================
-- UPDATE user_profiles
-- SET 
--   plan = 'pro',
--   current_period_end = NOW() + INTERVAL '30 days',
--   trial_end = NULL
-- WHERE user_id = 'YOUR_USER_ID';  -- ⚠️ REPLACE WITH YOUR USER_ID

