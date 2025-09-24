// server/supabase.js
// Supabase client configuration for persistent storage

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data, error } = await supabase
      .from(TABLES.MEDICATION_CONTRIBUTIONS)
      .insert([contribution])
      .select();
    
    if (error) throw error;
    console.log('✅ Medication contribution saved to Supabase:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save medication contribution:', error);
    throw error;
  }
}

async function getMedicationContributions(filters = {}) {
  try {
    let query = supabase.from(TABLES.MEDICATION_CONTRIBUTIONS).select('*');
    
    // Apply filters
    if (filters.search) {
      query = query.or(`medication_name.ilike.%${filters.search}%,store_name.ilike.%${filters.search}%`);
    }
    if (filters.medication) {
      query = query.eq('medication_name', filters.medication);
    }
    if (filters.store) {
      query = query.eq('store_name', filters.store);
    }
    if (filters.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`📊 Retrieved ${data.length} medication contributions from Supabase`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get medication contributions:', error);
    throw error;
  }
}

// User symptoms functions
async function saveUserSymptom(userId, symptom) {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_SYMPTOMS)
      .insert([{ user_id: userId, ...symptom }])
      .select();
    
    if (error) throw error;
    console.log('✅ User symptom saved to Supabase:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user symptom:', error);
    throw error;
  }
}

async function getUserSymptoms(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_SYMPTOMS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
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
    const { data, error } = await supabase
      .from(TABLES.USER_SUPPLEMENTS)
      .insert([{ user_id: userId, ...supplement }])
      .select();
    
    if (error) throw error;
    console.log('✅ User supplement saved to Supabase:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user supplement:', error);
    throw error;
  }
}

async function getUserSupplements(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_SUPPLEMENTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
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
    const { data, error } = await supabase
      .from(TABLES.USER_DOCTORS)
      .insert([{ user_id: userId, ...doctor }])
      .select();
    
    if (error) throw error;
    console.log('✅ User doctor saved to Supabase:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user doctor:', error);
    throw error;
  }
}

async function getUserDoctors(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_DOCTORS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
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
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .upsert([{ user_id: userId, ...profile }])
      .select();
    
    if (error) throw error;
    console.log('✅ User profile saved to Supabase:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to save user profile:', error);
    throw error;
  }
}

async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    console.log(`📊 Retrieved profile for user ${userId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get user profile:', error);
    throw error;
  }
}

module.exports = {
  supabase,
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
