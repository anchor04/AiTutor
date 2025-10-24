#!/bin/bash
set -e

echo "🧹 Fixing iOS build environment..."

# 1️⃣ Ensure correct Xcode path
echo "📍 Setting active developer directory..."
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
echo "✅ Using Xcode path: $(xcode-select -p)"

# 2️⃣ Fix permissions on developer directories
echo "🔧 Fixing permissions on ~/Library/Developer..."
sudo chown -R $(whoami) ~/Library/Developer

# 3️⃣ Clean caches and build artifacts
echo "🧼 Cleaning DerivedData and build folders..."
sudo rm -rf ~/Library/Developer/Xcode/DerivedData || true
rm -rf ios/build || true

# 4️⃣ Reset CocoaPods
echo "📦 Re-installing pods..."
cd ios
pod deintegrate || true
pod install
cd ..

# 5️⃣ Refresh JS dependencies
if [ -d "node_modules" ]; then
  echo "🧾 Cleaning node_modules cache..."
  rm -rf node_modules
fi

echo "📦 Installing npm packages..."
npm install

# 6️⃣ Run the iOS build
echo "🚀 Building and launching on simulator..."
npx react-native run-ios

echo "✅ All done! Your environment and build have been fully reset."
