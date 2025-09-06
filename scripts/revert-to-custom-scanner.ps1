# scripts/revert-to-custom-scanner.ps1
# Revert from ML Kit scanner back to custom solution

Write-Host "🔄 Reverting to custom document scanner solution..." -ForegroundColor Yellow

# Remove ML Kit scanner files
Write-Host "🗑️ Removing ML Kit scanner files..." -ForegroundColor Red
if (Test-Path "src/modules/scanner/scan.ts") {
    Remove-Item "src/modules/scanner/scan.ts" -Force
    Write-Host "  ✅ Removed src/modules/scanner/scan.ts" -ForegroundColor Green
}

if (Test-Path "src/screens/ScanScreen.tsx") {
    Remove-Item "src/screens/ScanScreen.tsx" -Force
    Write-Host "  ✅ Removed src/screens/ScanScreen.tsx" -ForegroundColor Green
}

# Restore custom scanner files from backup
Write-Host "📁 Restoring custom scanner files from backup..." -ForegroundColor Blue
if (Test-Path "backup/custom-scanner/DocumentCamera.tsx") {
    Copy-Item "backup/custom-scanner/DocumentCamera.tsx" "src/components/DocumentCamera.tsx" -Force
    Write-Host "  ✅ Restored DocumentCamera.tsx" -ForegroundColor Green
}

if (Test-Path "backup/custom-scanner/realTimeEdgeDetection.ts") {
    Copy-Item "backup/custom-scanner/realTimeEdgeDetection.ts" "src/lib/realTimeEdgeDetection.ts" -Force
    Write-Host "  ✅ Restored realTimeEdgeDetection.ts" -ForegroundColor Green
}

if (Test-Path "backup/custom-scanner/edgeDetection.ts") {
    Copy-Item "backup/custom-scanner/edgeDetection.ts" "src/lib/edgeDetection.ts" -Force
    Write-Host "  ✅ Restored edgeDetection.ts" -ForegroundColor Green
}

if (Test-Path "backup/custom-scanner/ocr.ts") {
    Copy-Item "backup/custom-scanner/ocr.ts" "src/lib/ocr.ts" -Force
    Write-Host "  ✅ Restored ocr.ts" -ForegroundColor Green
}

# Remove ML Kit scanner from DocScanScreen.tsx
Write-Host "🔧 Removing ML Kit scanner integration from DocScanScreen..." -ForegroundColor Blue

# Read the current DocScanScreen.tsx
$docScanContent = Get-Content "src/screens/DocScanScreen.tsx" -Raw

# Remove ML Kit imports and references
$docScanContent = $docScanContent -replace "import ScanScreen from './ScanScreen';", ""
$docScanContent = $docScanContent -replace "  const \[showMlKitScanner, setShowMlKitScanner\] = useState\(false\);", ""

# Remove ML Kit button from modal
$docScanContent = $docScanContent -replace "              <TouchableOpacity \s*style=\[styles\.newScanModalButton, styles\.mlkitButton\]\s*onPress=\{\(\) => \{\s*setShowNewScanModal\(false\);\s*triggerHaptic\('medium'\);\s*setShowMlKitScanner\(true\);\s*\}\s*\}\s*>\s*<Text style=\{styles\.newScanModalButtonIcon\}>🤖</Text>\s*<Text style=\{styles\.newScanModalButtonText\}>Auto Scanner</Text>\s*<Text style=\{styles\.newScanModalButtonSubtext\}>ML Kit detection</Text>\s*</TouchableOpacity>", ""

# Remove ML Kit scanner modal
$docScanContent = $docScanContent -replace "  // Show ML Kit Scanner when requested\s*if \(showMlKitScanner\) \{\s*return \(\s*<ScanScreen\s*onClose=\{\(\) => setShowMlKitScanner\(false\)\}\s*onScanComplete=\{\(result\) => \{\s*if \(result\.success && result\.imageUri\) \{\s*// Add the scanned image to pages\s*setPages\(prev => \[\.\.\.prev, result\.imageUri!\]\);\s*setShowMlKitScanner\(false\);\s*showSuccessFeedback\('✅ Document scanned successfully!'\);\s*\}\s*\}\s*/>\s*\);\s*\} ", ""

# Remove ML Kit button style
$docScanContent = $docScanContent -replace "  mlkitButton: \{\s*backgroundColor: '#7c3aed',\s*borderColor: '#7c3aed',\s*\},", ""

# Write the cleaned content back
Set-Content "src/screens/DocScanScreen.tsx" -Value $docScanContent -NoNewline

Write-Host "  ✅ Removed ML Kit scanner integration" -ForegroundColor Green

# Uninstall ML Kit scanner package
Write-Host "📦 Uninstalling ML Kit scanner package..." -ForegroundColor Blue
npm uninstall @infinitered/react-native-mlkit-document-scanner
Write-Host "  ✅ Uninstalled @infinitered/react-native-mlkit-document-scanner" -ForegroundColor Green

Write-Host "✅ Revert to custom scanner complete!" -ForegroundColor Green
Write-Host "🎯 Your app now uses the custom document scanner solution." -ForegroundColor Cyan
Write-Host "📱 Run 'npx expo start' to test the reverted app." -ForegroundColor Cyan
