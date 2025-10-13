# Distance Display Issue - Diagnostic Report

## Issue Reported
User reports that "KM distance is messed up in the Pharmacy & lab locations cards"

## Current Implementation Analysis

### Server Side (`server/index.js`)
1. **Straight-line distance**: `haversineMi(lat1, lon1, lat2, lon2)` 
   - Uses Earth radius = 3958.8 miles
   - Returns distance in **MILES** ✅

2. **Driving distance** (Distance Matrix API):
   ```javascript
   const distanceMeters = element.distance.value; // API returns meters
   const distanceKm = distanceMeters / 1000;       // Convert to KM
   const distanceMiles = distanceKm * 0.621371;    // Convert KM to MILES
   place.distanceMiles = Number(distanceMiles.toFixed(2)); // Store as MILES
   ```
   - API returns **METERS**
   - Converted to **KM**
   - Converted to **MILES** ✅
   - Stored in `distanceMiles` field

3. **Data sent to client**: 
   ```json
   {
     "distanceMiles": 2.45  // in MILES
   }
   ```

### Client Side

#### App.js (lines 4255-4263)
```javascript
const formatDistance = (miles) => {
  if (userCountry === 'US') {
    return `${miles.toFixed(1)} ${S.mi}`;  // Display in miles
  } else {
    const km = miles * 1.60934;             // Convert miles to km
    return `${km.toFixed(1)} ${S.km}`;      // Display in km
  }
};
```

#### MedicationRefillModal.tsx (lines 391-401)
```javascript
function formatDistance(mi?: number) {
  if (mi == null) return '';
  if (!useKm) {
    return `${mi.toFixed(1)} mi`;  // Display in miles
  }
  const km = mi * 1.60934;          // Convert miles to km
  return `${km.toFixed(1)} km`;     // Display in km
}
```

#### SupplementRefillModal.tsx (lines 447-456)
Same logic as MedicationRefillModal

## Mathematical Verification

**Example: 1 mile**
- Server calculates: 1.0 miles
- Server sends: `distanceMiles: 1.0`
- Client receives: 1.0 (in miles)
- Client displays (non-US): 1.0 * 1.60934 = 1.6 km ✅ CORRECT

**Example: 5 kilometers (real distance)**
- Server calculates: 5 km = 3.10686 miles
- Server sends: `distanceMiles: 3.11`
- Client receives: 3.11 (in miles)
- Client displays (non-US): 3.11 * 1.60934 = 5.0 km ✅ CORRECT

## Potential Issues to Investigate

1. **Mock Data**: Are you using mock pharmacy data? Mock data has hardcoded distances.
   
2. **Caching**: Old cached data might have incorrect distances.

3. **User Country Detection**: If `userCountry` is incorrectly detected, miles might be shown as km or vice versa.

4. **Multiple Conversions**: Is the distance being converted multiple times somewhere?

5. **Frontend State**: Check if distanceMiles is being overwritten somewhere in the frontend.

## Recommended Debugging Steps

1. **Check console logs**: Look for distance calculations in server logs:
   ```
   📍 Pharmacy: 2500m = 2.50km = 1.55 mi (driving)
   ```

2. **Check frontend logs**: MedicationRefillModal logs distance formatting:
   ```
   🔍 formatDistance called with: { mi: 1.55, useKm: true, userCountry: 'MX' }
   🔍 Using kilometers: 2.5 km
   ```

3. **Verify userCountry**: Check what country is detected:
   ```javascript
   console.log('userCountry:', userCountry);
   ```

4. **Clear cache**: Force fresh pharmacy data with `noCache=true`

## Quick Fix Options

If distances are showing incorrectly:

### Option A: Server sending KM instead of Miles
If server is accidentally sending KM:
- Remove the `* 0.621371` conversion on server
- Update field name to `distanceKm`

### Option B: Double conversion issue
If client is converting twice:
- Add console logs to track conversions
- Verify data at each step

### Option C: Wrong conversion factor
Current: 1 mile = 1.60934 km
- This is correct ✅
- But check if somewhere uses wrong factor

## Files Modified
- `server/index.js` - Improved logging and clarified conversion steps
- Added `distanceMeters` variable to make conversion explicit

## Next Steps
1. User needs to specify what exactly is wrong:
   - Are distances too large?
   - Are distances too small?
   - Are they in wrong units?
   - Example: "Says 10 km but should be 2 km"

2. Check server logs when fetching pharmacies
3. Check client logs in MedicationRefillModal
4. Verify userCountry detection

