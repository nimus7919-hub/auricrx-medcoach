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
  getUserProfile
};
