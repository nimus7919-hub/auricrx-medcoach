#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Checking Kotlin files for BuildConfig/R imports..."

# Resolve namespace from app/build.gradle if present; fallback to manifest or hardcoded package
NAMESPACE="$(awk -F'"' '/^\s*namespace\s+/ {print $2}' android/app/build.gradle || true)"
if [ -z "${NAMESPACE:-}" ]; then
  NAMESPACE="$(grep -Po '(?<=package=")[^"]+' android/app/src/main/AndroidManifest.xml | head -1 || true)"
fi
if [ -z "${NAMESPACE:-}" ]; then
  NAMESPACE="com.auricrx.medcoach"
fi

echo "📦 Detected namespace: ${NAMESPACE}"

PKG_PATH="${NAMESPACE//./\/}"
MAIN_DIR="android/app/src/main/java/${PKG_PATH}"
FILES=(
  "${MAIN_DIR}/MainActivity.kt"
  "${MAIN_DIR}/MainApplication.kt"
)

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️  $file not found (yet)."
    continue
  fi

  # Add BuildConfig import right after 'package' line if missing
  if ! grep -q "import ${NAMESPACE}\.BuildConfig" "$file"; then
    sed -i '/^package[[:space:]].*/a import '"${NAMESPACE}"'.BuildConfig' "$file"
    echo "✅ Added BuildConfig import to $(basename "$file")"
  else
    echo "ℹ️  BuildConfig import already present in $(basename "$file")"
  fi

  # Explicit R import prevents ambiguity and satisfies K2 in some edge cases
  if ! grep -q "import ${NAMESPACE}\.R" "$file"; then
    sed -i '/^package[[:space:]].*/a import '"${NAMESPACE}"'.R' "$file"
    echo "✅ Added R import to $(basename "$file")"
  else
    echo "ℹ️  R import already present in $(basename "$file")"
  fi

  echo "— first 40 lines of $(basename "$file") —"
  sed -n '1,40p' "$file"
  echo "--------------------------------------"
done

# For debugging, verify BuildConfig path that Gradle will generate (release)
echo "🔎 Will expect BuildConfig under: android/app/build/generated/source/buildConfig/*/${PKG_PATH}/BuildConfig.java"

