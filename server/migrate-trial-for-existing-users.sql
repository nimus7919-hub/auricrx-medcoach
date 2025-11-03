-- Manually start trial for existing users who don't have trial data
UPDATE user_profiles 
SET 
  plan = 'trial',
  trial_start = NOW(),
  trial_end = NOW() + INTERVAL '14 days',
  trial_used_at = NOW(),
  trial_eligible = FALSE
WHERE plan IS NULL 
   OR (plan = 'trial' AND trial_start IS NULL);

-- Verify the update
SELECT 
  user_id, 
  plan, 
  trial_start, 
  trial_end, 
  trial_used_at,
  trial_eligible,
  EXTRACT(DAY FROM (trial_end - NOW()))::INTEGER as days_left
FROM user_profiles 
WHERE plan = 'trial';

