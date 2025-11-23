-- =====================================================
-- Create New Health Profile Table
-- Clean implementation with multiple choice goals
-- =====================================================

-- Step 1: Create the new health_profile table
CREATE TABLE IF NOT EXISTS health_profiles (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification
  user_id TEXT NOT NULL,
  
  -- Basic Information
  weight TEXT,
  height TEXT,
  weight_unit TEXT DEFAULT 'kg',
  height_unit TEXT DEFAULT 'cm',
  
  -- Health Conditions (boolean flags)
  diabetes BOOLEAN DEFAULT FALSE,
  hypoglycemia BOOLEAN DEFAULT FALSE,
  heart_conditions BOOLEAN DEFAULT FALSE,
  kidney_disease BOOLEAN DEFAULT FALSE,
  liver_disease BOOLEAN DEFAULT FALSE,
  eating_disorders BOOLEAN DEFAULT FALSE,
  pregnancy BOOLEAN DEFAULT FALSE,
  breastfeeding BOOLEAN DEFAULT FALSE,
  gastrointestinal_issues BOOLEAN DEFAULT FALSE,
  
  -- Other Health Conditions (JSON array)
  other_health_conditions JSONB DEFAULT '[]'::jsonb,
  
  -- Nutritional Status & Body Composition
  body_fat_level TEXT DEFAULT 'normal',
  muscle_mass TEXT DEFAULT 'normal',
  micronutrient_levels TEXT DEFAULT 'normal',
  hydration_level TEXT DEFAULT 'good',
  
  -- Mental Health & Cognitive Demands
  high_stress_environment BOOLEAN DEFAULT FALSE,
  intensive_mental_tasks BOOLEAN DEFAULT FALSE,
  anxiety BOOLEAN DEFAULT FALSE,
  depression BOOLEAN DEFAULT FALSE,
  
  -- Lifestyle & Activity Level
  activity_level TEXT DEFAULT 'moderate',
  physical_labor BOOLEAN DEFAULT FALSE,
  long_shifts BOOLEAN DEFAULT FALSE,
  sleep_quality TEXT DEFAULT 'good',
  
  -- Fasting Protocol Preferences
  preferred_fasting_type TEXT DEFAULT 'timeRestricted',
  max_fasting_hours INTEGER DEFAULT 16,
  fasting_frequency TEXT DEFAULT 'daily',
  
  -- Goals (MULTIPLE CHOICE - JSON array)
  -- Options: 'weightLoss', 'metabolicHealth', 'generalHealth', 'muscleGain', 'mentalClarity', 'longevity', 'diseasePrevention'
  health_goals JSONB DEFAULT '[]'::jsonb,
  primary_goal TEXT DEFAULT 'generalHealth',
  
  -- Medical Supervision
  medical_supervision BOOLEAN DEFAULT FALSE,
  self_monitoring BOOLEAN DEFAULT FALSE,
  wearable_devices BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id 
  ON health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_health_profiles_created_at 
  ON health_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_health_profiles_active 
  ON health_profiles(user_id, is_active) 
  WHERE is_active = TRUE;

-- Step 3: Enable Row Level Security
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy
DROP POLICY IF EXISTS health_profiles_policy ON health_profiles;
CREATE POLICY health_profiles_policy ON health_profiles
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Step 5: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_health_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS update_health_profiles_updated_at ON health_profiles;
CREATE TRIGGER update_health_profiles_updated_at
  BEFORE UPDATE ON health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_health_profiles_updated_at();

-- Step 7: Create helper function to get user health profile
CREATE OR REPLACE FUNCTION get_user_health_profile(p_user_id TEXT)
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
  health_goals JSONB,
  primary_goal TEXT,
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
    hp.id,
    hp.weight,
    hp.height,
    hp.weight_unit,
    hp.height_unit,
    hp.diabetes,
    hp.hypoglycemia,
    hp.heart_conditions,
    hp.kidney_disease,
    hp.liver_disease,
    hp.eating_disorders,
    hp.pregnancy,
    hp.breastfeeding,
    hp.gastrointestinal_issues,
    hp.other_health_conditions,
    hp.body_fat_level,
    hp.muscle_mass,
    hp.micronutrient_levels,
    hp.hydration_level,
    hp.high_stress_environment,
    hp.intensive_mental_tasks,
    hp.anxiety,
    hp.depression,
    hp.activity_level,
    hp.physical_labor,
    hp.long_shifts,
    hp.sleep_quality,
    hp.preferred_fasting_type,
    hp.max_fasting_hours,
    hp.fasting_frequency,
    hp.health_goals,
    hp.primary_goal,
    hp.medical_supervision,
    hp.self_monitoring,
    hp.wearable_devices,
    hp.is_active,
    hp.created_at,
    hp.updated_at
  FROM health_profiles hp
  WHERE hp.user_id = p_user_id
    AND hp.is_active = TRUE
  ORDER BY hp.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT '✅ Health Profile table created successfully!' AS status;

