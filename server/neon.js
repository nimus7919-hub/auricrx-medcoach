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
        ${contribution.userId || null}, ${contribution.verified}, 
        ${contribution.source}
      ) RETURNING *
    `;
    
    console.log('✅ Medication contribution saved to Neon:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save medication contribution:', error);
    throw error;
  }
}

async function getMedicationContributions(filters = {}) {
  try {
    let query = `SELECT * FROM medication_contributions WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    // Apply filters
    if (filters.search) {
      query += ` AND (medication_name ILIKE $${paramCount} OR store_name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }
    if (filters.medication) {
      query += ` AND medication_name ILIKE $${paramCount}`;
      params.push(`%${filters.medication}%`);
      paramCount++;
    }
    if (filters.store) {
      query += ` AND store_name ILIKE $${paramCount}`;
      params.push(`%${filters.store}%`);
      paramCount++;
    }
    if (filters.verified !== undefined) {
      query += ` AND verified = $${paramCount}`;
      params.push(filters.verified);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC`;

    const data = await neonClient(query, params);
    console.log(`📊 Retrieved ${data.length} medication contributions from Neon`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get medication contributions:', error);
    throw error;
  }
}

// User symptoms functions
async function saveUserSymptom(userId, symptom) {
  try {
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

// User doctors functions
async function saveUserDoctor(userId, doctor) {
  try {
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
    const { data, error } = await neonClient`
      INSERT INTO user_profiles (
        user_id, first_name, last_name, email, phone, 
        date_of_birth, gender, blood_type, allergies, 
        medical_conditions, emergency_contact_name, 
        emergency_contact_phone, language, timezone, 
        notifications_enabled
      ) VALUES (
        ${userId}, ${profile.firstName}, ${profile.lastName}, 
        ${profile.email}, ${profile.phone}, ${profile.dateOfBirth}, 
        ${profile.gender}, ${profile.bloodType}, 
        ${JSON.stringify(profile.allergies || [])}, 
        ${JSON.stringify(profile.medicalConditions || [])}, 
        ${profile.emergencyContactName}, ${profile.emergencyContactPhone}, 
        ${profile.language || 'en'}, ${profile.timezone}, 
        ${profile.notificationsEnabled !== false}
      ) 
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        blood_type = EXCLUDED.blood_type,
        allergies = EXCLUDED.allergies,
        medical_conditions = EXCLUDED.medical_conditions,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        language = EXCLUDED.language,
        timezone = EXCLUDED.timezone,
        notifications_enabled = EXCLUDED.notifications_enabled,
        updated_at = NOW()
      RETURNING *
    `;
    
    console.log('✅ User profile saved to Neon:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user profile:', error);
    throw error;
  }
}

async function getUserProfile(userId) {
  try {
    const data = await neonClient`
      SELECT * FROM user_profiles 
      WHERE user_id = ${userId}
    `;
    
    if (data.length === 0) return null;
    
    console.log(`📊 Retrieved profile for user ${userId}`);
    return data[0];
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
  // User doctors
  saveUserDoctor,
  getUserDoctors,
  // User profiles
  saveUserProfile,
  getUserProfile
};
