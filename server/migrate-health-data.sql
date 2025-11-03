-- Add missing columns to existing health_data table
ALTER TABLE health_data
  ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS ix_health_data_type ON health_data(data_type);
CREATE INDEX IF NOT EXISTS ix_health_data_created ON health_data(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_health_data_sync ON health_data(user_id, data_type, updated_at DESC) WHERE is_deleted = FALSE;

-- Enable RLS if not already enabled
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DROP POLICY IF EXISTS health_data_user_isolation ON health_data;
CREATE POLICY health_data_user_isolation ON health_data FOR ALL 
  USING (user_id = current_setting('app.current_user_id', true));

-- Create sync version update function
CREATE OR REPLACE FUNCTION update_health_data_sync()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.sync_version IS NOT NULL THEN
    NEW.sync_version = OLD.sync_version + 1;
  ELSE
    NEW.sync_version = 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sync version updates
DROP TRIGGER IF EXISTS health_data_update_sync ON health_data;
CREATE TRIGGER health_data_update_sync
  BEFORE UPDATE ON health_data
  FOR EACH ROW
  EXECUTE FUNCTION update_health_data_sync();

