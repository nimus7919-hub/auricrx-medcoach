-- Migration to update user_supplements table to match new schema
-- This adds fields to support the supplement reminder sync functionality

-- Add new columns to user_supplements table
ALTER TABLE user_supplements 
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS dosage_value TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS dosage_unit TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantity_value TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'taking',
  ADD COLUMN IF NOT EXISTS times TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS doses_left TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS remaining_quantity TEXT DEFAULT '0';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_active 
  ON user_supplements(user_id, is_active) 
  WHERE is_active = true;

-- Update the updated_at timestamp trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_supplements if it doesn't exist
DROP TRIGGER IF EXISTS update_user_supplements_updated_at ON user_supplements;
CREATE TRIGGER update_user_supplements_updated_at 
  BEFORE UPDATE ON user_supplements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Display success message
SELECT 'Migration completed successfully! user_supplements table updated.' AS status;



