-- Supabase Database Schema for AuricRX Medical Coach
-- Run this in your Supabase SQL editor

-- Medication contributions table
CREATE TABLE IF NOT EXISTS medication_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- User doctors table
CREATE TABLE IF NOT EXISTS user_doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Row Level Security (RLS) policies
ALTER TABLE medication_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public access to medication contributions (for admin interface)
CREATE POLICY "Allow public access to medication contributions" ON medication_contributions
  FOR ALL USING (true);

-- Allow users to access their own data
CREATE POLICY "Users can access their own symptoms" ON user_symptoms
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can access their own supplements" ON user_supplements
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can access their own doctors" ON user_doctors
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can access their own profile" ON user_profiles
  FOR ALL USING (user_id = current_setting('app.user_id', true));

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
