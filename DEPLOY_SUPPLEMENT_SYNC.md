# Quick Deployment Guide - Supplement Sync

## Prerequisites
✅ All code changes are complete  
✅ No linter errors  
✅ Database migration ready

## Deployment Steps

### 1. Update Database Schema (REQUIRED)

Run this migration on your Neon database:

```bash
cd server
psql $DATABASE_URL -f migrate-supplements-schema.sql
```

Or manually run the SQL:
```sql
ALTER TABLE user_supplements 
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS dosage_value TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS dosage_unit TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantity_value TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'taking',
  ADD COLUMN IF NOT EXISTS times TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS doses_left TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS remaining_quantity TEXT DEFAULT '0';
```

### 2. Deploy Backend (Server)

```bash
# If using Render or similar
git add .
git commit -m "Add supplement reminder sync with Neon database"
git push

# Server will auto-deploy on Render
```

### 3. Test Backend Endpoints

```bash
# Check if endpoints are working
curl https://auricrx-medcoach.onrender.com/api/supplements?userId=test

# Should return: { "ok": true, "supplements": [], "count": 0 }
```

### 4. Deploy Frontend (Mobile App)

```bash
# Build new version
eas build --platform android
# or
eas build --platform ios

# Or for development testing
npx expo start
```

## Verification

### Test Flow 1: Create Supplement Reminder
1. Open app → Go to Reminders
2. Click "Add Reminder"
3. Select type "Supplement"
4. Fill in details: 
   - Name: "Vitamin D3"
   - Brand: "Nature Made"
   - Dosage: "1000 IU"
   - Quantity: "100 softgels"
5. Save
6. **Check**: Go to Supplements card - should see Vitamin D3 there
7. **Check**: Restart app - should still be there (from database)

### Test Flow 2: Delete Supplement
1. Go to Supplements card
2. Find supplement created from reminder
3. Delete it
4. **Check**: Go to Reminders - corresponding reminder should be gone
5. **Check**: Restart app - supplement should NOT reappear

### Test Flow 3: Database Persistence
1. Create a supplement directly in Supplements card
2. Force close app
3. Reopen app
4. **Check**: Supplement should still be there (loaded from database)

## Rollback Plan

If something goes wrong:

1. **Revert code changes:**
```bash
git revert HEAD
git push
```

2. **Database is safe** - migration only adds columns, doesn't remove anything

## Success Criteria

- ✅ Users can create supplement reminders
- ✅ Supplement reminders sync to Supplements card
- ✅ Supplements persist across app restarts
- ✅ Deleting supplements also deletes reminders
- ✅ No errors in console
- ✅ Database soft-delete working (items don't reappear)

## Support

If you encounter issues:
1. Check server logs on Render dashboard
2. Check app console for errors
3. Verify database migration ran successfully
4. Test with a fresh user account

---

**Ready to deploy!** 🚀



