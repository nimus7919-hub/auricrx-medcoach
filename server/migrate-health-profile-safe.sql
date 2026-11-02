-- =====================================================
-- Safe Health Profile Table Migration
-- This script adds missing columns WITHOUT deleting data
-- Safe to run multiple times
-- =====================================================

-- Step 1: Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add weight_loss_goal if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fasting_profiles' 
    AND column_name = 'weight_loss_goal'
  ) THEN
    ALTER TABLE user_fasting_profiles 
    ADD COLUMN weight_loss_goal BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added column: weight_loss_goal';
  END IF;

  -- Add metabolic_health_goal if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fasting_profiles' 
    AND column_name = 'metabolic_health_goal'
  ) THEN
    ALTER TABLE user_fasting_profiles 
    ADD COLUMN metabolic_health_goal BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added column: metabolic_health_goal';
  END IF;

  -- Ensure other_health_conditions is JSONB (in case it was created as TEXT)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_fasting_profiles' 
    AND column_name = 'other_health_conditions'
    AND data_type != 'jsonb'
  ) THEN
    -- Convert to JSONB if it's not already
    ALTER TABLE user_fasting_profiles 
    ALTER COLUMN other_health_conditions TYPE JSONB 
    USING other_health_conditions::jsonb;
    RAISE NOTICE 'Converted other_health_conditions to JSONB';
  END IF;
END $$;

-- Step 2: Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_user_id 
  ON user_fasting_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_created_at 
  ON user_fasting_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_active 
  ON user_fasting_profiles(user_id, is_active) 
  WHERE is_active = TRUE;

-- Step 3: Ensure RLS is enabled
ALTER TABLE user_fasting_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate policy (drop and recreate to ensure it's correct)
DROP POLICY IF EXISTS user_fasting_profiles_policy ON user_fasting_profiles;
CREATE POLICY user_fasting_profiles_policy ON user_fasting_profiles
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Step 5: Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_user_fasting_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Ensure trigger exists
DROP TRIGGER IF EXISTS update_user_fasting_profiles_updated_at ON user_fasting_profiles;
CREATE TRIGGER update_user_fasting_profiles_updated_at
  BEFORE UPDATE ON user_fasting_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_fasting_profiles_updated_at();

-- Step 7: Update helper function to include all columns
CREATE OR REPLACE FUNCTION get_user_fasting_profile(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  weight TEXT,
  height TEXT,
  weight_unit TEXT,
  height_unit TEXT,
  diabetes BOOLEAN,
  hypoglycemia BOOLEAN,
  heart_conditions BOOLEAN,
  kidney_disease BOOLEAN,
  liver_disease BOOLEAN,
  eating_disorders BOOLEAN,
  pregnancy BOOLEAN,
  breastfeeding BOOLEAN,
  gastrointestinal_issues BOOLEAN,
  other_health_conditions JSONB,
  body_fat_level TEXT,
  muscle_mass TEXT,
  micronutrient_levels TEXT,
  hydration_level TEXT,
  high_stress_environment BOOLEAN,
  intensive_mental_tasks BOOLEAN,
  anxiety BOOLEAN,
  depression BOOLEAN,
  activity_level TEXT,
  physical_labor BOOLEAN,
  long_shifts BOOLEAN,
  sleep_quality TEXT,
  preferred_fasting_type TEXT,
  max_fasting_hours INTEGER,
  fasting_frequency TEXT,
  primary_goal TEXT,
  weight_loss_goal BOOLEAN,
  metabolic_health_goal BOOLEAN,
  medical_supervision BOOLEAN,
  self_monitoring BOOLEAN,
  wearable_devices BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ufp.id,
    ufp.weight,
    ufp.height,
    ufp.weight_unit,
    ufp.height_unit,
    ufp.diabetes,
    ufp.hypoglycemia,
    ufp.heart_conditions,
    ufp.kidney_disease,
    ufp.liver_disease,
    ufp.eating_disorders,
    ufp.pregnancy,
    ufp.breastfeeding,
    ufp.gastrointestinal_issues,
    ufp.other_health_conditions,
    ufp.body_fat_level,
    ufp.muscle_mass,
    ufp.micronutrient_levels,
    ufp.hydration_level,
    ufp.high_stress_environment,
    ufp.intensive_mental_tasks,
    ufp.anxiety,
    ufp.depression,
    ufp.activity_level,
    ufp.physical_labor,
    ufp.long_shifts,
    ufp.sleep_quality,
    ufp.preferred_fasting_type,
    ufp.max_fasting_hours,
    ufp.fasting_frequency,
    ufp.primary_goal,
    ufp.weight_loss_goal,
    ufp.metabolic_health_goal,
    ufp.medical_supervision,
    ufp.self_monitoring,
    ufp.wearable_devices,
    ufp.is_active,
    ufp.created_at,
    ufp.updated_at
  FROM user_fasting_profiles ufp
  WHERE ufp.user_id = p_user_id
    AND ufp.is_active = TRUE
  ORDER BY ufp.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT '✅ Safe Health Profile migration completed successfully!' AS status;

