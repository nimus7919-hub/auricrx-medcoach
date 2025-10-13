# Distance Calculation Bug - Farmacia Miranda Case

## 🐛 **Confirmed Bug**
- **Expected**: 6.4 km (Google Maps)
- **Showing**: 2.7 km (App)
- **Ratio**: 2.7 / 6.4 = 0.42 (showing 42% of correct distance)

## 🔍 **Investigation Added**

### Server-Side Logs (server/index.js)
Added comprehensive logging to track Distance Matrix API response:

```javascript
console.log('🗺️ Distance Matrix API FULL RESPONSE (first element):', ...);
console.log('🗺️ RAW element.distance for ${place.name}:', ...);
console.log('📍 ${place.name}: RAW API: ${distanceMeters}m = ${distanceKm}km = ${distanceMiles} mi');
console.log('📍 ${place.name}: FINAL distanceMiles being sent to client: ${place.distanceMiles}');
```

### Client-Side Logs (MedicationRefillModal.tsx)
Added detailed conversion logging:

```javascript
console.log('🔍 Conversion: ${mi} miles × 1.60934 = ${km} km');
console.log('🔍 Final display:', `${km.toFixed(1)} km`);
```

## 📊 **Expected Log Output**

### For Farmacia Miranda (6.4 km real distance):

**Server logs should show:**
```
📍 Farmacia Miranda: X.X mi (straight-line) → RAW API: 6400m = 6.40km = 3.98 mi (driving)
📍 Farmacia Miranda: FINAL distanceMiles being sent to client: 3.98
```

**Client logs should show:**
```
🔍 formatDistance called with: { mi: 3.98, useKm: true, userCountry: 'MX' }
🔍 Conversion: 3.98 miles × 1.60934 = 6.40 km
🔍 Final display: 6.4 km
```

## 🎯 **Next Steps**

1. **Restart the server** to load the new logging
2. **Clear Metro bundler cache** and restart the app
3. **Search for "Farmacia Miranda"** in the pharmacy locations
4. **Check server terminal** for the distance logs
5. **Check app console** for the client-side logs
6. **Report back** what the logs show

## 🔧 **Possible Root Causes**

### Hypothesis 1: Server sending wrong unit
- Server might be sending kilometers but labeling as miles
- **Check**: Look for `distanceMiles: 2.7` in server response (should be `3.98`)

### Hypothesis 2: Client receiving cached/old data
- Old data might have incorrect distances
- **Fix**: Force cache refresh

### Hypothesis 3: Double conversion bug
- Distance might be converted twice somewhere
- **Check**: Look for multiple formatDistance calls

### Hypothesis 4: Wrong conversion factor
- Some code might be using 0.621371 instead of 1.60934
- **Check**: Grep for all conversion factors

## 🚀 **Commands to Run**

```bash
# 1. Restart server (if running locally)
cd server
npm start

# 2. Clear React Native cache and restart
npx expo start --clear

# 3. Or kill all ports and restart fresh
npx kill-port 8081 19000 19001 19002
npx expo start --clear
```

## 📝 **Information Needed**

Please run the app and send me:
1. **Server console logs** for Farmacia Miranda (look for 📍 emoji)
2. **App console logs** when viewing that pharmacy (look for 🔍 emoji)
3. **Screenshot** of the distance showing in the app

This will tell us exactly where the conversion is going wrong!

