# Upgrade Node.js - Safe Instructions

## Option 1: Direct Upgrade (Simpler, replaces Node 18 everywhere)

### Download & Install
1. Go to: https://nodejs.org/
2. Download Node.js **20.19.4 LTS** (Windows Installer .msi - 64-bit)
3. Run the installer (it will replace Node 18)
4. Close ALL terminal windows
5. Open a NEW PowerShell

### Verify Installation
```powershell
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### Clean This Project
```powershell
cd "C:\Users\Freddy Hernandez\auricrx-medcoach"
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
npm install
npx expo start --clear
```

---

## Option 2: nvm-windows (Better, switch between Node versions)

### Install nvm-windows
1. Go to: https://github.com/coreybutler/nvm-windows/releases
2. Download **nvm-setup.exe** (latest release)
3. Run the installer
4. Close ALL terminal windows
5. Open a NEW PowerShell **as Administrator**

### Install & Use Node 20
```powershell
nvm install 20.19.4
nvm use 20.19.4
nvm list    # Verify it's active

node --version    # Should show v20.19.4
```

### Clean This Project
```powershell
cd "C:\Users\Freddy Hernandez\auricrx-medcoach"
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
npm install
npx expo start --clear
```

### Switch Back to Node 18 (if needed for other projects)
```powershell
nvm use 18
```

---

## What Will Happen After Upgrade:

✅ **Will Work:**
- This React Native/Expo project (better performance)
- All modern npm packages
- Metro bundler (no more errors)
- React Native 0.79.5 (can upgrade from 0.76.6)

⚠️ **Might Need Attention:**
- Other projects using Node 18 (use nvm to switch)
- Global npm packages (may need reinstall)
- Old legacy projects (test them)

---

## Rollback Plan (if something goes wrong):

### With Direct Upgrade:
1. Download Node 18.20.4 from https://nodejs.org/download/release/v18.20.4/
2. Reinstall it
3. Restore your project

### With nvm-windows:
```powershell
nvm use 18    # Instantly switch back
```

---

## My Recommendation:

Use **nvm-windows** (Option 2) - it's safer and more flexible. You can:
- Keep both Node 18 and Node 20
- Switch between them per project
- No risk to other projects

Then we can also upgrade React Native back to 0.79.5 for latest features.


