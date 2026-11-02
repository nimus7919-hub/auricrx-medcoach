    -- =====================================================
    -- Complete Health Profile Table Migration
    -- This script recreates the user_fasting_profiles table
    -- with all required columns matching the application code
    -- =====================================================

    -- Step 1: Drop existing table if it exists (WARNING: This will delete all data!)
    -- Uncomment the next line ONLY if you want to start fresh
    -- DROP TABLE IF EXISTS user_fasting_profiles CASCADE;

    -- Step 2: Create the table with all columns
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

    -- Step 3: Create indexes
    CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_user_id 
    ON user_fasting_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_created_at 
    ON user_fasting_profiles(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_fasting_profiles_active 
    ON user_fasting_profiles(user_id, is_active) 
    WHERE is_active = TRUE;

    -- Step 4: Enable Row Level Security
    ALTER TABLE user_fasting_profiles ENABLE ROW LEVEL SECURITY;

    -- Step 5: Drop existing policy if it exists and create new one
    DROP POLICY IF EXISTS user_fasting_profiles_policy ON user_fasting_profiles;
    CREATE POLICY user_fasting_profiles_policy ON user_fasting_profiles
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

    -- Step 6: Create or replace trigger function for updated_at
    CREATE OR REPLACE FUNCTION update_user_fasting_profiles_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Step 7: Create trigger
    DROP TRIGGER IF EXISTS update_user_fasting_profiles_updated_at ON user_fasting_profiles;
    CREATE TRIGGER update_user_fasting_profiles_updated_at
    BEFORE UPDATE ON user_fasting_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_fasting_profiles_updated_at();

    -- Step 8: Add any missing columns (safe migration - won't break if columns exist)
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
    END IF;

    -- Add metabolic_health_goal if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_fasting_profiles' 
        AND column_name = 'metabolic_health_goal'
    ) THEN
        ALTER TABLE user_fasting_profiles 
        ADD COLUMN metabolic_health_goal BOOLEAN DEFAULT FALSE;
    END IF;
    END $$;

    -- Step 9: Create or replace helper function to get user fasting profile
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
    SELECT '✅ Health Profile table migration completed successfully!' AS status;

