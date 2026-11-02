-- Update get_user_subscription_status function to include subscription_cancelled_at
-- Run this in your Neon SQL Editor to update the function

CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_profile user_profiles%ROWTYPE;
  v_days_left INTEGER;
  v_plan_status TEXT;
BEGIN
  SELECT * INTO v_profile 
  FROM user_profiles 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'USER_NOT_FOUND'
    );
  END IF;
  
  CASE v_profile.plan
    WHEN 'trial' THEN
      IF v_profile.trial_end IS NULL THEN
        v_days_left := 0;
        v_plan_status := 'unknown';
      ELSIF NOW() > v_profile.trial_end THEN
        v_days_left := 0;
        v_plan_status := 'expired';
      ELSE
        v_days_left := EXTRACT(DAY FROM (v_profile.trial_end - NOW()))::INTEGER;
        v_plan_status := 'active';
      END IF;
      
    WHEN 'pro' THEN
      IF v_profile.current_period_end IS NULL THEN
        v_days_left := -1;
        v_plan_status := 'unknown';
      ELSIF NOW() > v_profile.current_period_end THEN
        v_days_left := 0;
        v_plan_status := 'expired';
      ELSE
        v_days_left := EXTRACT(DAY FROM (v_profile.current_period_end - NOW()))::INTEGER;
        v_plan_status := 'active';
      END IF;
      
    WHEN 'expired' THEN
      v_days_left := 0;
      v_plan_status := 'expired';
      
    ELSE
      v_days_left := 0;
      v_plan_status := 'unknown';
  END CASE;
  
  RETURN json_build_object(
    'plan', v_profile.plan,
    'daysLeft', v_days_left,
    'status', v_plan_status,
    'subscription_cancelled_at', v_profile.subscription_cancelled_at,
    'trial', json_build_object(
      'eligible', COALESCE(v_profile.trial_eligible, true),
      'startedAt', v_profile.trial_start,
      'endsAt', v_profile.trial_end,
      'usedAt', v_profile.trial_used_at,
      'grantedBy', v_profile.trial_granted_by
    ),
    'graceExpiresAt', v_profile.grace_expires_at,
    'currentPeriodEnd', v_profile.current_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

