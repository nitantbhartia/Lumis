#!/bin/bash

# Post-prebuild script to preserve iOS extensions
# Run this after `npx expo prebuild`

set -e

echo "🔧 Setting up iOS DeviceActivity extensions..."

IOS_DIR="ios"
PROJECT_FILE="$IOS_DIR/Lumis.xcodeproj/project.pbxproj"

if [ ! -f "$PROJECT_FILE" ]; then
  echo "❌ Xcode project not found. Run 'npx expo prebuild' first."
  exit 1
fi

# Check if extensions already exist
if grep -q "LumisShieldExtension" "$PROJECT_FILE"; then
  echo "✅ Extensions already configured in Xcode project"
  exit 0
fi

echo "⚠️  Extensions not found in Xcode project"
echo ""
echo "📋 MANUAL SETUP REQUIRED:"
echo ""
echo "The iOS extensions need to be added manually in Xcode because Expo prebuild"
echo "regenerates the project and removes custom targets."
echo ""
echo "Two options:"
echo ""
echo "1. RECOMMENDED: Use bare workflow"
echo "   - Don't run 'npx expo prebuild --clean' after initial setup"
echo "   - Add extensions once in Xcode, then they'll persist"
echo "   - Run 'npx expo run:ios' instead"
echo ""
echo "2. Add extensions manually after each prebuild:"
echo "   - Follow the guide in XCODE_EXTENSION_SETUP.md"
echo "   - Takes ~10 minutes each time you run prebuild --clean"
echo ""
echo "📖 See XCODE_EXTENSION_SETUP.md for detailed instructions"
echo ""

exit 1
