# 📄 PDF Functionality Issues - Diagnosis & Fix

## 🐛 **Reported Issues**

1. ❌ **PDF viewing not working** - Can't view PDFs inside the app
2. ❌ **ID export not working** - Can't export both ID images as a single PDF
3. ❌ **General PDF export failing** - Documents not exporting as PDF

## 🔍 **Root Cause Analysis**

### **Most Likely Cause: Development Build vs Expo Go**

The PDF functionality uses **native modules** that require a custom development build:
- `expo-print` - Requires native code
- `react-native-webview` - Requires native code  
- `expo-file-system` - Works in Expo Go
- `expo-sharing` - Works in Expo Go

**If you're using Expo Go**: ❌ PDF features won't work
**If you're using Development Build**: ✅ Should work (if build includes these modules)

### **Check What You're Running:**

```javascript
// In App.js, you have:
const USING_EXPO_GO = Constants.appOwnership === "expo";
console.log('🚀 AuricRx MedCoach App Starting...', { USING_EXPO_GO });
```

**Look for this log when app starts!**

---

## 📦 **Current Package Versions**

| Package | Version | Native? | Expo Go? |
|---------|---------|---------|----------|
| `expo-print` | ~14.1.4 | ✅ Yes | ❌ No |
| `react-native-webview` | 13.13.5 | ✅ Yes | ❌ No |
| `expo-file-system` | ~18.1.11 | ✅ Yes | ✅ Yes |
| `expo-sharing` | ~13.1.5 | ✅ Yes | ✅ Yes |

---

## 🔧 **Fixes to Apply**

### **Option 1: Use Development Build (Recommended)**

You need a **custom development build** that includes these native modules.

**Command:**
```bash
eas build --profile development --platform android
```

Then install the APK on your device and use **that** instead of Expo Go.

### **Option 2: Update Packages for Node 22 Compatibility**

Some packages might need updates for Node.js 22:

```bash
npm install expo-print@latest react-native-webview@latest
```

**Current versions:**
- `expo-print`: ~14.1.4 (SDK 53 compatible ✅)
- `react-native-webview`: 13.13.5 (might need update)

**Latest compatible:**
- `react-native-webview`: Should be `13.13.5` for SDK 53

### **Option 3: Add Fallback for Missing Native Modules**

Add graceful degradation in `MedicalDocumentsScreen.tsx`:

```typescript
// At the top of the component
const [printAvailable, setPrintAvailable] = useState(true);

useEffect(() => {
  // Check if expo-print is available
  const checkPrintAvailability = async () => {
    try {
      if (!Print || !Print.printToFileAsync) {
        console.warn('⚠️ expo-print not available - PDF features disabled');
        setPrintAvailable(false);
      }
    } catch (error) {
      console.warn('⚠️ expo-print check failed:', error);
      setPrintAvailable(false);
    }
  };
  
  checkPrintAvailability();
}, []);

// Then in createIDPDF and other PDF functions:
if (!printAvailable) {
  Alert.alert(
    'Feature Not Available',
    'PDF export requires a development build. Please use the custom AuricRX app instead of Expo Go.',
    [{ text: 'OK' }]
  );
  return null;
}
```

---

## 🧪 **Diagnostic Steps**

### **1. Check Console Logs**

When you try to use PDF features, look for:

```
✅ Good signs:
- "📄 Generating PDF from ID document..."
- "✅ PDF created successfully: file://..."
- "Converting PDF to data URI for PDF.js..."

❌ Bad signs:
- "Cannot find native module 'RNPrint'"
- "expo-print is not available in Expo Go"
- "WebView not available"
- Errors from expo-print or react-native-webview
```

### **2. Test Each Feature**

**A. View Existing PDF:**
- Upload a PDF document
- Try to view it
- Check console for WebView/PDF.js errors

**B. Export ID as PDF:**
- Have front + back ID images
- Try "Export as PDF"
- Check console for expo-print errors

**C. Export Document as PDF:**
- Try exporting any document as PDF
- Check console for Print.printToFileAsync errors

---

## 🎯 **Recommended Action Plan**

### **Immediate (Quick Test):**

1. **Check if you're using Expo Go or Development Build**
   - Look for the console log: `USING_EXPO_GO: true/false`
   
2. **If using Expo Go**: ❌ PDF won't work
   - Solution: Build and install development build
   
3. **If using Development Build**: ✅ Should work
   - If still failing, check console for specific errors

### **Long-term (Robust Solution):**

1. **Always use Development Build for production features**
   ```bash
   eas build --profile development --platform android
   ```

2. **Add feature detection** to gracefully handle missing modules

3. **Update documentation** to note that PDF features require development build

---

## 📱 **Development Build vs Expo Go**

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| PDF Generation | ❌ | ✅ |
| PDF Viewing | ❌ | ✅ |
| WebView | ❌ | ✅ |
| Image Picker | ✅ | ✅ |
| File System | ✅ | ✅ |
| Camera | ✅ | ✅ |

**Bottom line**: For PDF features, you **MUST** use a development build, not Expo Go.

---

## 🚀 **Next Steps**

**Tell me:**
1. Are you using **Expo Go** or a **Development Build**?
2. What specific error do you see when trying PDF features?
3. Do you see any console errors related to `expo-print` or `WebView`?

Based on your answer, I'll provide the exact fix! 🎯

