ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email_hash text,
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS phone_hash text,
  ADD COLUMN IF NOT EXISTS device_hash text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_start timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_eligible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_granted_by text,
  ADD COLUMN IF NOT EXISTS grace_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS ux_profiles_email_hash 
  ON user_profiles(email_hash) 
  WHERE email_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_profiles_phone_hash 
  ON user_profiles(phone_hash) 
  WHERE phone_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_profiles_device_hash 
  ON user_profiles(device_hash);

CREATE INDEX IF NOT EXISTS ix_profiles_plan 
  ON user_profiles(plan);

CREATE INDEX IF NOT EXISTS ix_profiles_stripe_customer_id 
  ON user_profiles(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS health_data (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  device_info JSONB,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_health_data_user_id 
  ON health_data(user_id);

CREATE INDEX IF NOT EXISTS ix_health_data_type 
  ON health_data(data_type);

CREATE INDEX IF NOT EXISTS ix_health_data_created 
  ON health_data(created_at DESC);

CREATE INDEX IF NOT EXISTS ix_health_data_sync 
  ON health_data(user_id, data_type, updated_at DESC) 
  WHERE is_deleted = FALSE;

ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS health_data_user_isolation 
  ON health_data FOR ALL 
  USING (user_id = current_setting('app.current_user_id', true));

CREATE OR REPLACE FUNCTION update_health_data_sync()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.sync_version = OLD.sync_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS health_data_update_sync ON health_data;
CREATE TRIGGER health_data_update_sync
  BEFORE UPDATE ON health_data
  FOR EACH ROW
  EXECUTE FUNCTION update_health_data_sync();

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

UPDATE user_profiles 
SET 
  plan = 'trial',
  trial_start = NOW(),
  trial_end = NOW() + INTERVAL '14 days',
  trial_used_at = NOW(),
  trial_eligible = FALSE
WHERE plan IS NULL 
  OR (plan = 'trial' AND trial_used_at IS NULL);


