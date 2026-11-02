# Health Profile Table Migration Guide

## Overview
This guide explains how to migrate the `user_fasting_profiles` table to fix the missing `weight_loss_goal` and `metabolic_health_goal` columns.

## Migration Options

### Option 1: Safe Migration (Recommended - Preserves Data)
**File:** `server/migrate-health-profile-safe.sql`

This migration:
- ✅ Adds missing columns without deleting data
- ✅ Safe to run multiple times
- ✅ Preserves all existing health profile data
- ✅ Updates indexes, triggers, and functions

**When to use:** If you have existing health profile data you want to keep.

**How to run:**
```bash
cd server
psql $DATABASE_URL -f migrate-health-profile-safe.sql
```

### Option 2: Complete Rebuild (Fresh Start)
**File:** `server/migrate-recreate-health-profile-table.sql`

This migration:
- ⚠️ Can drop and recreate the table (commented out by default)
- ✅ Creates a completely fresh table structure
- ⚠️ Will delete all existing data if uncommented

**When to use:** If you're okay with losing existing data or starting fresh.

**How to run:**
```bash
cd server
# Review the file first - uncomment DROP TABLE if you want to start fresh
psql $DATABASE_URL -f migrate-recreate-health-profile-table.sql
```

## What Gets Fixed

1. **Missing Columns:**
   - `weight_loss_goal` (BOOLEAN)
   - `metabolic_health_goal` (BOOLEAN)

2. **Database Objects:**
   - Indexes (for performance)
   - Row Level Security (RLS) policies
   - Triggers (for auto-updating `updated_at`)
   - Helper function `get_user_fasting_profile()`

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_fasting_profiles' 
AND column_name IN ('weight_loss_goal', 'metabolic_health_goal');

-- Should return 2 rows
```

## Testing

After migration, test saving a health profile:

1. Open the app
2. Go to Settings → Health Profile Settings
3. Fill in some information
4. Click Save
5. Check server logs - should see "✅ Fasting profile saved successfully"

## Troubleshooting

### Error: "column already exists"
- This is fine! The migration checks for existence first
- Just means the column was already added

### Error: "permission denied"
- Make sure you're using a database user with CREATE/ALTER permissions
- Check your Neon database connection string

### Error: "relation does not exist"
- The table doesn't exist yet
- Run the complete rebuild migration instead

## Next Steps

1. ✅ Run the safe migration
2. ✅ Test saving a health profile
3. ✅ Commit changes to GitHub
4. ✅ Deploy to production

## Files Changed

- `server/neon.js` - Fixed INSERT and UPDATE statements
- `server/migrate-health-profile-safe.sql` - Safe migration (NEW)
- `server/migrate-recreate-health-profile-table.sql` - Complete rebuild (NEW)

---

**Status:** Ready to deploy! 🚀

