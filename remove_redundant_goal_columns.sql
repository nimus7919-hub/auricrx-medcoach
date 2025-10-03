-- Remove redundant goal columns from user_fasting_profiles table
-- Run this in your Neon SQL Editor

-- Drop the redundant columns
ALTER TABLE user_fasting_profiles DROP COLUMN IF EXISTS weight_loss_goal;
ALTER TABLE user_fasting_profiles DROP COLUMN IF EXISTS metabolic_health_goal;

-- Update the helper function to remove these fields from the return table
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
  medical_supervision BOOLEAN,
  self_monitoring BOOLEAN,
  wearable_devices BOOLEAN,
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
    ufp.medical_supervision,
    ufp.self_monitoring,
    ufp.wearable_devices,
    ufp.created_at,
    ufp.updated_at
  FROM user_fasting_profiles ufp
  WHERE ufp.user_id = p_user_id
    AND ufp.is_active = TRUE
  ORDER BY ufp.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
