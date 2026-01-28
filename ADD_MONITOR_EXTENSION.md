# Add LumisDeviceActivityMonitor Extension

You have successfully added 3 of the 4 required extensions. Here's how to add the final one:

## Current Status ✅
- ✅ LumisShieldExtension (custom shield screen)
- ✅ LumisShieldActionExtension (button handler)
- ✅ LumisDeviceActivityReport (activity report)
- ❌ LumisDeviceActivityMonitor (screen time tracker) **← Need to add this**

## Why You Need the Monitor Extension

The Monitor extension is the most important one - it actually tracks screen time usage in the background. Without it:
- Shield screens will show but won't update progress
- Screen time data won't be collected
- Focus score won't be calculated

## Add Monitor Extension in Xcode

### Step 1: Add Target

1. Open `ios/Lumis.xcworkspace` in Xcode
2. Select the "Lumis" project in left sidebar
3. At the bottom of targets list, click "+"
4. Select "Application Extension" → "Device Activity Monitor"
5. Name it: `LumisDeviceActivityMonitor`
6. Click "Finish"

### Step 2: Delete Auto-Generated Files

Xcode will create template files. Delete them:
1. In left sidebar, find `LumisDeviceActivityMonitor` folder
2. Delete these auto-generated files:
   - `DeviceActivityMonitorExtension.swift` (we have a better version)
   - Any other template files Xcode created

### Step 3: Add Custom Files

The files are already created at `ios/LumisDeviceActivityMonitor/`:
- `DeviceActivityMonitorExtension.swift` (screen time tracker)
- `Info.plist` (extension config)
- `LumisDeviceActivityMonitor.entitlements` (permissions)

To add them:
1. Right-click `LumisDeviceActivityMonitor` folder in Xcode
2. Choose "Add Files to Lumis..."
3. Navigate to `ios/LumisDeviceActivityMonitor/`
4. Select ALL 3 files
5. **UNCHECK** "Copy items if needed"
6. Select "Create groups"
7. In "Add to targets", check ONLY `LumisDeviceActivityMonitor`
8. Click "Add"

### Step 4: Configure App Groups

1. Select `LumisDeviceActivityMonitor` target
2. Go to "Signing & Capabilities" tab
3. Click "+ Capability"
4. Add "App Groups"
5. Check `group.com.nitant.lumis`

### Step 5: Embed in Main App

1. Select "Lumis" target (main app)
2. Go to "Build Phases" tab
3. Expand "Embed Foundation Extensions"
4. Click "+"
5. Add `LumisDeviceActivityMonitor.appex`

### Step 6: Set Build Settings

1. Select `LumisDeviceActivityMonitor` target
2. Go to "Build Settings" tab
3. Search for "Info.plist File"
4. Set to: `LumisDeviceActivityMonitor/Info.plist`
5. Search for "Code Sign Entitlements"
6. Set to: `LumisDeviceActivityMonitor/LumisDeviceActivityMonitor.entitlements`
7. Search for "iOS Deployment Target"
8. Set to: `16.0`

### Step 7: Verify Files Are Added

1. Select `LumisDeviceActivityMonitor` target
2. Go to "Build Phases" → "Compile Sources"
3. Should see: `DeviceActivityMonitorExtension.swift`
4. If missing, click "+" and add it

### Step 8: Build and Test

```bash
xcodebuild -project ios/Lumis.xcodeproj -target LumisDeviceActivityMonitor -configuration Debug -sdk iphoneos
```

Should see: `** BUILD SUCCEEDED **`

## What the Monitor Extension Does

### Screen Time Tracking
- Monitors device activity intervals (daily/hourly)
- Receives events every minute of app usage
- Saves data to App Group (`group.com.nitant.lumis`)

### Data Collected
- `totalScreenTimeSeconds`: Total screen time
- `productiveSeconds`: Time in productive apps
- `distractingSeconds`: Time in distracting apps
- `neutralSeconds`: Time in neutral apps
- `focusScore`: 0-100 score based on productivity

### How It Works
1. Main app schedules monitoring with `DeviceActivityCenter`
2. Extension runs in background
3. `eventDidReachThreshold` called every minute
4. Extension increments counters in shared UserDefaults
5. Main app reads data from shared UserDefaults

### Event Categories
Events are categorized by name prefix:
- `productive-*`: Email, work apps → increments `productiveSeconds`
- `distracting-*`: Social, games → increments `distractingSeconds`
- Other: Utilities, tools → increments `neutralSeconds`

### Focus Score Calculation
```
focusRatio = productiveSeconds / totalScreenTime
focusScore = min(100, (focusRatio * 100) + 20)
```
- Base 20 points + up to 80 based on productivity
- Higher score = more productive time

## Verification Checklist

After adding the extension:

- [ ] Target `LumisDeviceActivityMonitor` exists in project
- [ ] Files added (not copied) to correct target
- [ ] App Groups capability enabled
- [ ] Extension embedded in main app
- [ ] Info.plist path set correctly
- [ ] Entitlements path set correctly
- [ ] Deployment target is 16.0
- [ ] Build succeeds without errors

## Quick Test

```bash
# List all targets (should see all 4)
xcodebuild -project ios/Lumis.xcodeproj -list

# Should show:
# - Lumis
# - LumisShieldExtension
# - LumisShieldActionExtension
# - LumisDeviceActivityReport
# - LumisDeviceActivityMonitor ← This one

# Build monitor extension
xcodebuild -project ios/Lumis.xcodeproj -target LumisDeviceActivityMonitor -configuration Debug -sdk iphoneos
```

## Files Already Created ✅

All files are ready at `ios/LumisDeviceActivityMonitor/`:

**DeviceActivityMonitorExtension.swift** (155 lines)
- Screen time tracking logic
- Event handling (threshold events)
- Data saving to App Groups
- Focus score calculation

**Info.plist**
- Extension point: `com.apple.deviceactivity.monitor-extension`
- Principal class: `DeviceActivityMonitorExtension`

**LumisDeviceActivityMonitor.entitlements**
- Family Controls capability
- App Groups: `group.com.nitant.lumis`

## Next Steps

1. Add monitor extension target in Xcode (5 minutes)
2. Build all 4 extensions
3. Install on physical device
4. Test shield screen → should show custom Lumis branding ✨
5. Test screen time → should see data in app 📊

## All 4 Extensions Summary

| Extension | Purpose | Status |
|-----------|---------|--------|
| Shield | Custom block screen | ✅ Added |
| ShieldAction | Button handler | ✅ Added |
| Report | Activity report view | ✅ Added |
| Monitor | Screen time tracker | ❌ Need to add |

Once you add the Monitor extension, all functionality will be complete!
