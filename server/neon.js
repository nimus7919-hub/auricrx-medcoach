// server/neon.js
// Neon database client for persistent storage

const { neon } = require('@neondatabase/serverless');

// Neon configuration
const neonClient = neon(process.env.DATABASE_URL);

// Database schema for your full app
const TABLES = {
  MEDICATION_CONTRIBUTIONS: 'medication_contributions',
  USER_SYMPTOMS: 'user_symptoms',
  USER_SUPPLEMENTS: 'user_supplements',
  USER_DOCTORS: 'user_doctors',
  USER_PROFILES: 'user_profiles'
};

// Medication contributions functions
async function saveMedicationContribution(contribution) {
  try {
    // Validate user_id is provided
    if (!contribution.userId) {
      throw new Error('user_id is required for data isolation');
    }

    const { data, error } = await neonClient`
      INSERT INTO medication_contributions (
        medication_name, strength, price, quantity, store_name, 
        store_address, pharmacy_id, currency, user_location, 
        user_id, verified, source
      ) VALUES (
        ${contribution.medicationName}, ${contribution.strength}, 
        ${contribution.price}, ${contribution.quantity}, 
        ${contribution.storeName}, ${contribution.storeAddress}, 
        ${contribution.pharmacyId}, ${contribution.currency}, 
        ${JSON.stringify(contribution.userLocation)}, 
        ${contribution.userId}, ${contribution.verified}, 
        ${contribution.source}
      ) RETURNING *
    `;
    
    console.log('✅ Medication contribution saved to Neon for user:', contribution.userId);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save medication contribution:', error);
    throw error;
  }
}

async function getMedicationContributions(filters = {}) {
  try {
    // Validate user_id is provided for data isolation
    if (!filters.userId) {
      throw new Error('user_id is required for data isolation');
    }

    // Use the secure user-specific function with correct syntax
    const data = await neonClient`
      SELECT * FROM get_user_medication_contributions(
        ${filters.userId}, 
        ${filters.limit || 100}, 
        ${filters.offset || 0}
      )
    `;
    
    console.log(`📊 Retrieved ${data.length} medication contributions for user ${filters.userId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get medication contributions:', error);
    throw error;
  }
}

// User symptoms functions
async function saveUserSymptom(userId, symptom) {
  try {
    // Set user context for RLS
    await neonClient`SELECT set_user_context(${userId})`;
    
    const { data, error } = await neonClient`
      INSERT INTO user_symptoms (
        user_id, symptom_name, severity, duration, 
        frequency, notes, is_active
      ) VALUES (
        ${userId}, ${symptom.symptomName}, ${symptom.severity}, 
        ${symptom.duration}, ${symptom.frequency}, 
        ${symptom.notes}, ${symptom.isActive || true}
      ) RETURNING *
    `;
    
    console.log('✅ User symptom saved to Neon:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user symptom:', error);
    throw error;
  }
}

async function getUserSymptoms(userId) {
  try {
    const data = await neonClient`
      SELECT * FROM user_symptoms 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `;
    
    console.log(`📊 Retrieved ${data.length} symptoms for user ${userId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get user symptoms:', error);
    throw error;
  }
}

// User supplements functions
async function saveUserSupplement(userId, supplement) {
  try {
    // Set user context for RLS
    await neonClient`SELECT set_user_context(${userId})`;
    
    const { data, error } = await neonClient`
      INSERT INTO user_supplements (
        user_id, supplement_name, dosage, frequency, 
        start_date, end_date, notes, is_active
      ) VALUES (
        ${userId}, ${supplement.supplementName}, ${supplement.dosage}, 
        ${supplement.frequency}, ${supplement.startDate}, 
        ${supplement.endDate}, ${supplement.notes}, 
        ${supplement.isActive || true}
      ) RETURNING *
    `;
    
    console.log('✅ User supplement saved to Neon:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user supplement:', error);
    throw error;
  }
}

// User medications functions
async function saveUserMedication(userId, medication) {
  try {
    console.log('🔍 Attempting to save medication for user:', userId);
    console.log('🔍 Medication data:', medication);
    
    // First, check if user_medications table exists
    try {
      await neonClient`SELECT 1 FROM user_medications LIMIT 1`;
      console.log('✅ user_medications table exists');
    } catch (tableError) {
      console.error('❌ user_medications table does not exist:', tableError.message);
      throw new Error('user_medications table does not exist. Please run the schema setup.');
    }
    
    // Set user context for RLS
    try {
      await neonClient`SELECT set_user_context(${userId}::text)`;
      console.log('✅ User context set for RLS');
    } catch (contextError) {
      console.log('⚠️ Could not set user context, proceeding without RLS:', contextError.message);
      // Continue without RLS if the function doesn't exist
    }
    
    const result = await neonClient`
      INSERT INTO user_medications (
        user_id, medication_name, strength_value, strength_unit, status, times, 
        start_date, end_date, notes, doses_left, quantity_value, quantity_unit, 
        last_refill, is_active
      ) VALUES (
        ${userId}, ${medication.medicationName}, ${medication.strengthValue}, 
        ${medication.strengthUnit}, ${medication.status}, ${medication.times}, 
        ${medication.startDate}, ${medication.endDate}, ${medication.notes}, 
        ${medication.dosesLeft}, ${medication.quantityValue}, ${medication.quantityUnit}, 
        ${medication.lastRefill}, ${medication.isActive || true}
      ) RETURNING *
    `;
    
    console.log('🔍 Database result:', result);
    
    if (!result || result.length === 0) {
      throw new Error('No data returned from database insert');
    }
    
    console.log('✅ User medication saved to Neon:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Failed to save user medication:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error code:', error.code);
    throw error;
  }
}

async function getUserSupplements(userId) {
  try {
    const data = await neonClient`
      SELECT * FROM user_supplements 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `;
    
    console.log(`📊 Retrieved ${data.length} supplements for user ${userId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get user supplements:', error);
    throw error;
  }
}

async function getUserMedications(userId) {
  try {
    const data = await neonClient`
      SELECT * FROM get_user_medications(${userId})
    `;
    
    console.log(`📊 Retrieved ${data.length} medications for user ${userId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get user medications:', error);
    throw error;
  }
}

// User doctors functions
async function saveUserDoctor(userId, doctor) {
  try {
    // Set user context for RLS
    await neonClient`SELECT set_user_context(${userId})`;
    
    const { data, error } = await neonClient`
      INSERT INTO user_doctors (
        user_id, doctor_name, specialty, phone_number, 
        email, address, notes, preferred_contact_method, 
        country_code
      ) VALUES (
        ${userId}, ${doctor.doctorName}, ${doctor.specialty}, 
        ${doctor.phoneNumber}, ${doctor.email}, ${doctor.address}, 
        ${doctor.notes}, ${doctor.preferredContactMethod}, 
        ${doctor.countryCode}
      ) RETURNING *
    `;
    
    console.log('✅ User doctor saved to Neon:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user doctor:', error);
    throw error;
  }
}

async function getUserDoctors(userId) {
  try {
    const data = await neonClient`
      SELECT * FROM user_doctors 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `;
    
    console.log(`📊 Retrieved ${data.length} doctors for user ${userId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get user doctors:', error);
    throw error;
  }
}

// User profiles functions
async function saveUserProfile(userId, profile) {
  try {
    const result = await neonClient`
      INSERT INTO user_profiles (
        user_id, first_name, last_name, email, phone, 
        language, notifications_enabled
      ) VALUES (
        ${userId}, ${profile.first_name}, ${profile.last_name}, 
        ${profile.email}, ${profile.phone}, 
        ${profile.country || 'en'}, true
      ) 
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        language = EXCLUDED.language,
        updated_at = NOW()
      RETURNING *
    `;
    
    console.log('✅ User profile saved to Neon:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Failed to save user profile:', error);
    throw error;
  }
}

async function getUserProfile(userId) {
  try {
    const result = await neonClient`
      SELECT * FROM user_profiles 
      WHERE user_id = ${userId}
    `;
    
    if (result.length === 0) return null;
    
    console.log(`📊 Retrieved profile for user ${userId}`);
    return result[0];
  } catch (error) {
    console.error('❌ Failed to get user profile:', error);
    throw error;
  }
}

// Save user fasting profile
async function saveUserFastingProfile(userId, profileData) {
  try {
    console.log('💾 Saving fasting profile for user:', userId);
    
    // Set user context for RLS
    await neonClient`SELECT set_user_context(${userId}::text)`;
    
    // Check if profile already exists
    const existingProfile = await neonClient`
      SELECT id FROM user_fasting_profiles 
      WHERE user_id = ${userId} AND is_active = TRUE
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    if (existingProfile.length > 0) {
      // Update existing profile
      const result = await neonClient`
        UPDATE user_fasting_profiles SET
          weight = ${profileData.weight || null},
          height = ${profileData.height || null},
          weight_unit = ${profileData.weightUnit || 'kg'},
          height_unit = ${profileData.heightUnit || 'cm'},
          diabetes = ${profileData.diabetes || false},
          hypoglycemia = ${profileData.hypoglycemia || false},
          heart_conditions = ${profileData.heartConditions || false},
          kidney_disease = ${profileData.kidneyDisease || false},
          liver_disease = ${profileData.liverDisease || false},
          eating_disorders = ${profileData.eatingDisorders || false},
          pregnancy = ${profileData.pregnancy || false},
          breastfeeding = ${profileData.breastfeeding || false},
          gastrointestinal_issues = ${profileData.gastrointestinalIssues || false},
          other_health_conditions = ${JSON.stringify(profileData.otherHealthConditions || [])}::jsonb,
          body_fat_level = ${profileData.bodyFatLevel || 'normal'},
          muscle_mass = ${profileData.muscleMass || 'normal'},
          micronutrient_levels = ${profileData.micronutrientLevels || 'normal'},
          hydration_level = ${profileData.hydrationLevel || 'good'},
          high_stress_environment = ${profileData.highStressEnvironment || false},
          intensive_mental_tasks = ${profileData.intensiveMentalTasks || false},
          anxiety = ${profileData.anxiety || false},
          depression = ${profileData.depression || false},
          activity_level = ${profileData.activityLevel || 'moderate'},
          physical_labor = ${profileData.physicalLabor || false},
          long_shifts = ${profileData.longShifts || false},
          sleep_quality = ${profileData.sleepQuality || 'good'},
          preferred_fasting_type = ${profileData.preferredFastingType || 'timeRestricted'},
          max_fasting_hours = ${profileData.maxFastingHours || 16},
          fasting_frequency = ${profileData.fastingFrequency || 'daily'},
          primary_goal = ${profileData.primaryGoal || 'generalHealth'},
          medical_supervision = ${profileData.medicalSupervision || false},
          self_monitoring = ${profileData.selfMonitoring || false},
          wearable_devices = ${profileData.wearableDevices || false},
          updated_at = NOW()
        WHERE id = ${existingProfile[0].id}
        RETURNING id, created_at, updated_at
      `;
      
      console.log('✅ Fasting profile updated successfully');
      return result[0];
    } else {
      // Create new profile
      const result = await neonClient`
        INSERT INTO user_fasting_profiles (
          user_id, weight, height, weight_unit, height_unit,
          diabetes, hypoglycemia, heart_conditions, kidney_disease, liver_disease,
          eating_disorders, pregnancy, breastfeeding, gastrointestinal_issues,
          other_health_conditions, body_fat_level, muscle_mass, micronutrient_levels,
          hydration_level, high_stress_environment, intensive_mental_tasks,
          anxiety, depression, activity_level, physical_labor, long_shifts,
          sleep_quality, preferred_fasting_type, max_fasting_hours, fasting_frequency,
          primary_goal, weight_loss_goal, metabolic_health_goal,
          medical_supervision, self_monitoring, wearable_devices
        ) VALUES (
          ${userId},
          ${profileData.weight || null},
          ${profileData.height || null},
          ${profileData.weightUnit || 'kg'},
          ${profileData.heightUnit || 'cm'},
          ${profileData.diabetes || false},
          ${profileData.hypoglycemia || false},
          ${profileData.heartConditions || false},
          ${profileData.kidneyDisease || false},
          ${profileData.liverDisease || false},
          ${profileData.eatingDisorders || false},
          ${profileData.pregnancy || false},
          ${profileData.breastfeeding || false},
          ${profileData.gastrointestinalIssues || false},
          ${JSON.stringify(profileData.otherHealthConditions || [])}::jsonb,
          ${profileData.bodyFatLevel || 'normal'},
          ${profileData.muscleMass || 'normal'},
          ${profileData.micronutrientLevels || 'normal'},
          ${profileData.hydrationLevel || 'good'},
          ${profileData.highStressEnvironment || false},
          ${profileData.intensiveMentalTasks || false},
          ${profileData.anxiety || false},
          ${profileData.depression || false},
          ${profileData.activityLevel || 'moderate'},
          ${profileData.physicalLabor || false},
          ${profileData.longShifts || false},
          ${profileData.sleepQuality || 'good'},
          ${profileData.preferredFastingType || 'timeRestricted'},
          ${profileData.maxFastingHours || 16},
          ${profileData.fastingFrequency || 'daily'},
          ${profileData.primaryGoal || 'generalHealth'},
          ${profileData.medicalSupervision || false},
          ${profileData.selfMonitoring || false},
          ${profileData.wearableDevices || false}
        )
        RETURNING id, created_at, updated_at
      `;
      
      console.log('✅ Fasting profile created successfully');
      return result[0];
    }
  } catch (error) {
    console.error('❌ Error saving fasting profile:', error);
    throw error;
  }
}

// Get user fasting profile
async function getUserFastingProfile(userId) {
  try {
    console.log('📖 Loading fasting profile for user:', userId);
    
    // Set user context for RLS
    await neonClient`SELECT set_user_context(${userId}::text)`;
    
    const result = await neonClient`
      SELECT * FROM get_user_fasting_profile(${userId})
    `;
    
    if (result.length > 0) {
      const profile = result[0];
      console.log('✅ Fasting profile loaded successfully');
      
      // Convert database fields to app format
      return {
        weight: profile.weight || '',
        height: profile.height || '',
        weightUnit: profile.weight_unit || 'kg',
        heightUnit: profile.height_unit || 'cm',
        diabetes: profile.diabetes || false,
        hypoglycemia: profile.hypoglycemia || false,
        heartConditions: profile.heart_conditions || false,
        kidneyDisease: profile.kidney_disease || false,
        liverDisease: profile.liver_disease || false,
        eatingDisorders: profile.eating_disorders || false,
        pregnancy: profile.pregnancy || false,
        breastfeeding: profile.breastfeeding || false,
        gastrointestinalIssues: profile.gastrointestinal_issues || false,
        otherHealthConditions: profile.other_health_conditions || [],
        customHealthCondition: '',
        bodyFatLevel: profile.body_fat_level || 'normal',
        muscleMass: profile.muscle_mass || 'normal',
        micronutrientLevels: profile.micronutrient_levels || 'normal',
        hydrationLevel: profile.hydration_level || 'good',
        highStressEnvironment: profile.high_stress_environment || false,
        intensiveMentalTasks: profile.intensive_mental_tasks || false,
        anxiety: profile.anxiety || false,
        depression: profile.depression || false,
        activityLevel: profile.activity_level || 'moderate',
        physicalLabor: profile.physical_labor || false,
        longShifts: profile.long_shifts || false,
        sleepQuality: profile.sleep_quality || 'good',
        preferredFastingType: profile.preferred_fasting_type || 'timeRestricted',
        maxFastingHours: profile.max_fasting_hours || 16,
        fastingFrequency: profile.fasting_frequency || 'daily',
        primaryGoal: profile.primary_goal || 'generalHealth',
        medicalSupervision: profile.medical_supervision || false,
        selfMonitoring: profile.self_monitoring || false,
        wearableDevices: profile.wearable_devices || false
      };
    } else {
      console.log('ℹ️ No fasting profile found for user');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading fasting profile:', error);
    throw error;
  }
}

module.exports = {
  neonClient,
  TABLES,
  // Medication contributions
  saveMedicationContribution,
  getMedicationContributions,
  // User symptoms
  saveUserSymptom,
  getUserSymptoms,
  // User supplements
  saveUserSupplement,
  getUserSupplements,
  // User medications
  saveUserMedication,
  getUserMedications,
  // User doctors
  saveUserDoctor,
  getUserDoctors,
  // User profiles
  saveUserProfile,
  getUserProfile,
  // User fasting profiles
  saveUserFastingProfile,
  getUserFastingProfile
};
