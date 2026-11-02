-- Manual SQL Update for Existing Payment
-- Run this in your Neon SQL Editor to update the subscription status
-- Replace 'cus_TMeFLpcsxISaDq' with your actual Stripe customer ID if different

-- First, verify the customer ID exists
SELECT 
  user_id,
  email,
  stripe_customer_id,
  plan,
  current_period_end
FROM user_profiles
WHERE stripe_customer_id = 'cus_TMeFLpcsxISaDq';

-- If the above query returns a row, then update it:
UPDATE user_profiles
SET 
  plan = 'pro',
  current_period_end = NOW() + INTERVAL '30 days'  -- Set to 30 days from now
WHERE stripe_customer_id = 'cus_TMeFLpcsxISaDq';

-- Verify the update
SELECT 
  user_id,
  email,
  stripe_customer_id,
  plan,
  current_period_end,
  EXTRACT(DAY FROM (current_period_end - NOW()))::INTEGER as days_remaining
FROM user_profiles
WHERE stripe_customer_id = 'cus_TMeFLpcsxISaDq';









