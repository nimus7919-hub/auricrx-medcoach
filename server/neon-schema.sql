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

-- Supplement contributions table
CREATE TABLE IF NOT EXISTS supplement_contributions (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contribution data
  supplement_name TEXT NOT NULL,
  brand TEXT,
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

-- User medications table
CREATE TABLE IF NOT EXISTS user_medications (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification
  user_id TEXT NOT NULL,
  
  -- Medication data
  medication_name TEXT NOT NULL,
  strength_value TEXT,
  strength_unit TEXT,
  status TEXT NOT NULL, -- 'taking', 'onhold', 'finished', 'stopped'
  times TEXT[], -- Array of times like ['08:00', '20:00']
  start_date DATE,
  end_date DATE,
  notes TEXT,
  doses_left TEXT,
  quantity_value TEXT,
  quantity_unit TEXT,
  last_refill DATE,
  
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

CREATE INDEX IF NOT EXISTS idx_user_medications_user_id ON user_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medications_active ON user_medications(is_active);
CREATE INDEX IF NOT EXISTS idx_user_medications_status ON user_medications(status);

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

CREATE TRIGGER update_user_medications_updated_at BEFORE UPDATE ON user_medications
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
ALTER TABLE user_medications ENABLE ROW LEVEL SECURITY;
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

-- User medications policies
CREATE POLICY user_medications_isolation ON user_medications
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

-- Get user medications for current user
CREATE OR REPLACE FUNCTION get_user_medications(p_user_id TEXT)
RETURNS TABLE (
  id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  medication_name TEXT,
  strength_value TEXT,
  strength_unit TEXT,
  status TEXT,
  times TEXT[],
  start_date DATE,
  end_date DATE,
  notes TEXT,
  doses_left TEXT,
  quantity_value TEXT,
  quantity_unit TEXT,
  last_refill DATE,
  is_active BOOLEAN
) AS $$
BEGIN
  PERFORM set_user_context(p_user_id);
  
  RETURN QUERY
  SELECT 
    um.id,
    um.created_at,
    um.medication_name,
    um.strength_value,
    um.strength_unit,
    um.status,
    um.times,
    um.start_date,
    um.end_date,
    um.notes,
    um.doses_left,
    um.quantity_value,
    um.quantity_unit,
    um.last_refill,
    um.is_active
  FROM user_medications um
  WHERE um.user_id = p_user_id
  ORDER BY um.created_at DESC;
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
-- USER AUTHENTICATION SYSTEM
-- ========================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Authentication data
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- User profile
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Security
  last_login TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  language TEXT DEFAULT 'en',
  timezone TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Session data
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  device_info JSONB,
  ip_address TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);

-- Phone verification codes table
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Verification data
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0
);

-- Email verification codes table
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Verification data
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0
);

-- Indexes for user authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_phone_verification_phone ON phone_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verification_expires ON phone_verification_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_codes(expires_at);

-- User fasting profiles table
CREATE TABLE IF NOT EXISTS user_fasting_profiles (
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
  
  -- Goals
  primary_goal TEXT DEFAULT 'generalHealth',
  weight_loss_goal BOOLEAN DEFAULT FALSE,
  metabolic_health_goal BOOLEAN DEFAULT FALSE,
  
  -- Medical Supervision
  medical_supervision BOOLEAN DEFAULT FALSE,
  self_monitoring BOOLEAN DEFAULT FALSE,
  wearable_devices BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for fasting profiles
CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_user_id ON user_fasting_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_created_at ON user_fasting_profiles(created_at);

-- Enable RLS for fasting profiles
ALTER TABLE user_fasting_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for fasting profiles
CREATE POLICY IF NOT EXISTS user_fasting_profiles_policy ON user_fasting_profiles
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_fasting_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_user_fasting_profiles_updated_at
  BEFORE UPDATE ON user_fasting_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_fasting_profiles_updated_at();

-- Helper function to get user fasting profile
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
    ufp.created_at,
    ufp.updated_at
  FROM user_fasting_profiles ufp
  WHERE ufp.user_id = p_user_id
    AND ufp.is_active = TRUE
  ORDER BY ufp.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

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
