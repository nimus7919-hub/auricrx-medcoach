-- Neon Database Schema for AuricRX Medical Coach
-- Run this in your Neon SQL editor

-- Medication contributions table
CREATE TABLE IF NOT EXISTS medication_contributions (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contribution data
  medication_name TEXT NOT NULL,
  strength TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity TEXT,
  store_name TEXT NOT NULL,
  store_address TEXT,
  pharmacy_id TEXT,
  currency TEXT DEFAULT 'USD',
  
  -- User data
  user_location JSONB,
  user_id TEXT,
  
  -- Status
  verified BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'user_contribution'
);

-- User symptoms table
CREATE TABLE IF NOT EXISTS user_symptoms (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification
  user_id TEXT NOT NULL,
  
  -- Symptom data
  symptom_name TEXT NOT NULL,
  severity INTEGER CHECK (severity >= 1 AND severity <= 10),
  duration TEXT,
  frequency TEXT,
  notes TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE
);

-- User supplements table
CREATE TABLE IF NOT EXISTS user_supplements (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification
  user_id TEXT NOT NULL,
  
  -- Supplement data
  supplement_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);

-- User doctors table
CREATE TABLE IF NOT EXISTS user_doctors (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification
  user_id TEXT NOT NULL,
  
  -- Doctor data
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  
  -- Contact preferences
  preferred_contact_method TEXT,
  country_code TEXT
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification
  user_id TEXT NOT NULL UNIQUE,
  
  -- Profile data
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Medical data
  blood_type TEXT,
  allergies TEXT[],
  medical_conditions TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Preferences
  language TEXT DEFAULT 'en',
  timezone TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medication_contributions_user_id ON medication_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_contributions_medication_name ON medication_contributions(medication_name);
CREATE INDEX IF NOT EXISTS idx_medication_contributions_store_name ON medication_contributions(store_name);
CREATE INDEX IF NOT EXISTS idx_medication_contributions_verified ON medication_contributions(verified);

CREATE INDEX IF NOT EXISTS idx_user_symptoms_user_id ON user_symptoms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_symptoms_active ON user_symptoms(is_active);

CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id ON user_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_active ON user_supplements(is_active);

CREATE INDEX IF NOT EXISTS idx_user_doctors_user_id ON user_doctors(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_medication_contributions_updated_at BEFORE UPDATE ON medication_contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_symptoms_updated_at BEFORE UPDATE ON user_symptoms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_supplements_updated_at BEFORE UPDATE ON user_supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_doctors_updated_at BEFORE UPDATE ON user_doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS) FOR USER ISOLATION
-- ========================================

-- Enable RLS on all tables
ALTER TABLE medication_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation
-- Each user can only see and modify their own data

-- Medication contributions policies
CREATE POLICY user_medication_contributions_isolation ON medication_contributions
  FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

-- User symptoms policies
CREATE POLICY user_symptoms_isolation ON user_symptoms
  FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

-- User supplements policies
CREATE POLICY user_supplements_isolation ON user_supplements
  FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

-- User doctors policies
CREATE POLICY user_doctors_isolation ON user_doctors
  FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

-- User profiles policies
CREATE POLICY user_profiles_isolation ON user_profiles
  FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

-- ========================================
-- HELPER FUNCTIONS FOR USER CONTEXT
-- ========================================

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_user_context(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- USER-SPECIFIC QUERY FUNCTIONS
-- ========================================

-- Get medication contributions for current user
CREATE OR REPLACE FUNCTION get_user_medication_contributions(
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  medication_name TEXT,
  strength TEXT,
  price DECIMAL(10,2),
  quantity TEXT,
  store_name TEXT,
  store_address TEXT,
  pharmacy_id TEXT,
  currency TEXT,
  user_location JSONB,
  verified BOOLEAN,
  source TEXT
) AS $$
BEGIN
  -- Set user context
  PERFORM set_user_context(p_user_id);
  
  -- Return user's contributions
  RETURN QUERY
  SELECT 
    mc.id,
    mc.created_at,
    mc.medication_name,
    mc.strength,
    mc.price,
    mc.quantity,
    mc.store_name,
    mc.store_address,
    mc.pharmacy_id,
    mc.currency,
    mc.user_location,
    mc.verified,
    mc.source
  FROM medication_contributions mc
  WHERE mc.user_id = p_user_id
  ORDER BY mc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user symptoms for current user
CREATE OR REPLACE FUNCTION get_user_symptoms(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  symptom_name TEXT,
  severity INTEGER,
  duration TEXT,
  frequency TEXT,
  notes TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  PERFORM set_user_context(p_user_id);
  
  RETURN QUERY
  SELECT 
    us.id,
    us.created_at,
    us.symptom_name,
    us.severity,
    us.duration,
    us.frequency,
    us.notes,
    us.is_active
  FROM user_symptoms us
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user supplements for current user
CREATE OR REPLACE FUNCTION get_user_supplements(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  supplement_name TEXT,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  PERFORM set_user_context(p_user_id);
  
  RETURN QUERY
  SELECT 
    us.id,
    us.created_at,
    us.supplement_name,
    us.dosage,
    us.frequency,
    us.start_date,
    us.end_date,
    us.notes,
    us.is_active
  FROM user_supplements us
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user doctors for current user
CREATE OR REPLACE FUNCTION get_user_doctors(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  doctor_name TEXT,
  specialty TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  preferred_contact_method TEXT,
  country_code TEXT
) AS $$
BEGIN
  PERFORM set_user_context(p_user_id);
  
  RETURN QUERY
  SELECT 
    ud.id,
    ud.created_at,
    ud.doctor_name,
    ud.specialty,
    ud.phone_number,
    ud.email,
    ud.address,
    ud.notes,
    ud.preferred_contact_method,
    ud.country_code
  FROM user_doctors ud
  WHERE ud.user_id = p_user_id
  ORDER BY ud.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user profile for current user
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_type TEXT,
  allergies TEXT[],
  medical_conditions TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  language TEXT,
  timezone TEXT,
  notifications_enabled BOOLEAN
) AS $$
BEGIN
  PERFORM set_user_context(p_user_id);
  
  RETURN QUERY
  SELECT 
    up.id,
    up.created_at,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    up.date_of_birth,
    up.gender,
    up.blood_type,
    up.allergies,
    up.medical_conditions,
    up.emergency_contact_name,
    up.emergency_contact_phone,
    up.language,
    up.timezone,
    up.notifications_enabled
  FROM user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SECURITY NOTES
-- ========================================

-- IMPORTANT: To use RLS effectively, you need to:
-- 1. Set the user context before each query: SELECT set_user_context('user123');
-- 2. Use the helper functions for user-specific queries
-- 3. Always filter by user_id in your application code
-- 4. Never trust client-side user_id - validate on server

-- Example usage:
-- SELECT set_user_context('user123');
-- SELECT * FROM medication_contributions; -- Only returns user123's data
-- SELECT * FROM get_user_medication_contributions('user123', 10, 0);
