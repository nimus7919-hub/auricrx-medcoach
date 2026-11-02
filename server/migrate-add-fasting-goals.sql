-- Migration to add weight_loss_goal and metabolic_health_goal columns
-- if they don't exist in user_fasting_profiles table

ALTER TABLE user_fasting_profiles 
  ADD COLUMN IF NOT EXISTS weight_loss_goal BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS metabolic_health_goal BOOLEAN DEFAULT FALSE;

-- Display success message
SELECT 'Migration completed successfully! weight_loss_goal and metabolic_health_goal columns added.' AS status;

