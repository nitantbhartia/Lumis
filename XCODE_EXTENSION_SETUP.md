# Xcode Extension Setup Guide

## Problem
The extension files exist but aren't added as targets in the Xcode project, so they're not being built or embedded in the app.

## Solution: Add Extensions Manually in Xcode

### Step 1: Add LumisShieldExtension Target

1. Open `ios/Lumis.xcworkspace` in Xcode
2. Click on the project name "Lumis" in the left sidebar
3. At the bottom of the targets list, click the "+" button
4. Select "Application Extension" (under "iOS")
5. Choose "Shield Configuration" from the list
6. Name it: `LumisShieldExtension`
7. Click "Finish"
8. **IMPORTANT**: Xcode will generate template files - delete them immediately
9. In the left sidebar, right-click the `LumisShieldExtension` folder → "Add Files to Lumis"
10. Navigate to `ios/LumisShieldExtension/`
11. Select ALL files (ShieldConfigurationExtension.swift, Info.plist, entitlements)
12. Make sure "Copy items if needed" is UNCHECKED
13. Make sure "Create groups" is selected
14. In "Add to targets", check ONLY `LumisShieldExtension`
15. Click "Add"

### Step 2: Add LumisShieldActionExtension Target

1. Click "+" again to add another target
2. Select "Application Extension" → "Shield Action"
3. Name it: `LumisShieldActionExtension`
4. Click "Finish"
5. Delete auto-generated files
6. Right-click folder → "Add Files to Lumis"
7. Navigate to `ios/LumisShieldActionExtension/`
8. Add all files, check ONLY `LumisShieldActionExtension` target

### Step 3: Add LumisDeviceActivityMonitor Target

1. Click "+" to add target
2. Select "Application Extension" → "Device Activity Monitor"
3. Name it: `LumisDeviceActivityMonitor`
4. Click "Finish"
5. Delete auto-generated files
6. Add files from `ios/LumisDeviceActivityMonitor/`
7. Check ONLY `LumisDeviceActivityMonitor` target

### Step 4: Add LumisDeviceActivityReport Target

1. Click "+" to add target
2. Select "Application Extension" → "Device Activity Report"
3. Name it: `LumisDeviceActivityReport`
4. Click "Finish"
5. Delete auto-generated files
6. Add files from `ios/LumisDeviceActivityReport/`
7. Check ONLY `LumisDeviceActivityReport` target

### Step 5: Configure App Groups for ALL Targets

For EACH target (including main Lumis app):

1. Select the target
2. Go to "Signing & Capabilities" tab
3. Click "+ Capability"
4. Add "App Groups"
5. Check the box for `group.com.nitant.lumis`
   - If it doesn't exist, click "+" and create it
6. Repeat for ALL 5 targets:
   - Lumis (main app)
   - LumisShieldExtension
   - LumisShieldActionExtension
   - LumisDeviceActivityMonitor
   - LumisDeviceActivityReport

### Step 6: Embed Extensions in Main App

1. Select "Lumis" target (main app)
2. Go to "Build Phases" tab
3. Expand "Embed Foundation Extensions" (or "Embed App Extensions")
4. Click "+" button
5. Add all 4 extension targets:
   - LumisShieldExtension.appex
   - LumisShieldActionExtension.appex
   - LumisDeviceActivityMonitor.appex
   - LumisDeviceActivityReport.appex

### Step 7: Fix Info.plist Conflicts

For EACH extension target:

1. Select the extension target
2. Go to "Build Settings" tab
3. Search for "Info.plist"
4. Under "Packaging", set "Info.plist File" to:
   - LumisShieldExtension: `LumisShieldExtension/Info.plist`
   - LumisShieldActionExtension: `LumisShieldActionExtension/Info.plist`
   - LumisDeviceActivityMonitor: `LumisDeviceActivityMonitor/Info.plist`
   - LumisDeviceActivityReport: `LumisDeviceActivityReport/Info.plist`
5. Go to "Build Phases" tab
6. Expand "Copy Bundle Resources"
7. If you see "Info.plist" in the list, select it and click "-" to remove it
   - Info.plist should NOT be in Copy Bundle Resources

### Step 8: Set Deployment Target

For each extension target:

1. Select the target
2. Go to "Build Settings" tab
3. Search for "iOS Deployment Target"
4. Set to: `16.0` (for Shield/Monitor extensions) or `18.0` (for Report extension)

### Step 9: Verify File References

For each extension, make sure the files are properly referenced:

1. Select extension target
2. Go to "Build Phases" → "Compile Sources"
3. Should see the .swift file(s) listed
4. If missing, click "+" and add the Swift file

### Step 10: Build and Test

1. Select "Lumis" scheme at the top
2. Build (Cmd+B)
3. Fix any errors
4. Install on physical device (extensions don't work in simulator)
5. Grant Screen Time permission in the app
6. Block an app
7. Try to open the blocked app → should see custom Lumis shield screen

## Troubleshooting

### "Multiple commands produce Info.plist"
- Go to Build Phases → Copy Bundle Resources
- Remove Info.plist from the list

### Shield screen not showing custom branding
- Verify App Groups capability is enabled on ALL targets
- Check that `group.com.nitant.lumis` is checked
- Verify extensions are embedded in main app (Build Phases)

### Screen time data not updating
- Check that DeviceActivityMonitor extension is embedded
- Verify Family Controls authorization is granted
- Check console logs for "[LumisMonitor]" messages
- Test on physical device only

### Build errors about missing files
- Make sure files are added to correct target
- Check Build Phases → Compile Sources
- Verify file paths in Build Settings

## Verification Checklist

- [ ] All 4 extension targets exist in project
- [ ] Each extension has correct files added (not copied)
- [ ] App Groups capability enabled on all 5 targets
- [ ] All extensions embedded in main app (Build Phases)
- [ ] Info.plist NOT in Copy Bundle Resources for extensions
- [ ] Deployment targets set correctly
- [ ] Project builds without errors
- [ ] Tested on physical device (not simulator)
- [ ] Family Controls permission granted
- [ ] Shield screen shows custom Lumis branding
- [ ] Screen time data appears in app

## Quick Test

After setup, test the shield screen:

1. Open Lumis app
2. Grant Screen Time permission
3. Go to Settings → Block an app (e.g., Safari)
4. Exit Lumis
5. Try to open Safari
6. **Expected**: Custom Lumis screen with "Get Some Sunlight First ☀️"
7. **If you see**: Generic "Restricted" → Extensions not properly configured

## Files Location

All extension files are ready in:
- `ios/LumisShieldExtension/`
- `ios/LumisShieldActionExtension/`
- `ios/LumisDeviceActivityMonitor/`
- `ios/LumisDeviceActivityReport/`

Do NOT modify these files - just add them as targets in Xcode.
