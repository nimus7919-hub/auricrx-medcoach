-- Fix: Create phone_verification_codes table if it doesn't exist, then create indexes

-- Step 1: Create table if it doesn't exist
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

-- Step 2: Create indexes (safe - will only create if table exists)
CREATE INDEX IF NOT EXISTS idx_phone_verification_phone ON phone_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verification_expires ON phone_verification_codes(expires_at);

-- Success message
SELECT '✅ Phone verification codes table and indexes created successfully!' AS status;

