# iOS Extensions Setup Guide

## Overview
This guide will help you add three iOS app extensions to the Lumis project:
1. **LumisShieldExtension** - Customizes the blocked app screen with Lumis branding
2. **LumisShieldActionExtension** - Handles button taps on the shield screen
3. **LumisDeviceActivityReport** - Collects detailed app usage data

All extension files are already created in the `ios/` directory. You just need to add them as targets in Xcode.

---

## Prerequisites
- Xcode 15+ installed
- Lumis project opened in Xcode (`ios/Lumis.xcworkspace`)

---

## Step 1: Add LumisShieldExtension

### 1.1 Create the Target
1. Open `ios/Lumis.xcworkspace` in Xcode
2. In the Project Navigator, select the **Lumis** project (blue icon at top)
3. At the bottom of the targets list, click the **+** button
4. Search for "**App Extension**"
5. Select "**Shield Configuration Extension**"
6. Click **Next**

### 1.2 Configure the Target
- **Product Name**: `LumisShieldExtension`
- **Team**: Select your development team
- **Organization Identifier**: `com.nitant`
- **Bundle Identifier**: `com.nitant.Lumis.LumisShieldExtension`
- **Language**: Swift
- Click **Finish**
- When prompted "Activate scheme?", click **Cancel**

### 1.3 Replace Generated Files
1. In the Project Navigator, find the new **LumisShieldExtension** folder
2. **Delete** all auto-generated files (keep the folder)
3. In Finder, navigate to `ios/LumisShieldExtension/`
4. **Drag** these files into the **LumisShieldExtension** folder in Xcode:
   - `ShieldConfigurationExtension.swift`
   - `Info.plist`
   - `LumisShieldExtension.entitlements`
5. When prompted, select:
   - ☑️ **Copy items if needed** (unchecked)
   - ☑️ **Create groups**
   - ☑️ Add to targets: **LumisShieldExtension**

### 1.4 Configure Build Settings
1. Select the **LumisShieldExtension** target
2. Go to **Build Settings** tab
3. Search for "**Code Signing Entitlements**"
4. Set to: `LumisShieldExtension/LumisShieldExtension.entitlements`
5. Search for "**Info.plist File**"
6. Set to: `LumisShieldExtension/Info.plist`
7. Go to **Signing & Capabilities** tab
8. Ensure these capabilities are added:
   - **Family Controls**
   - **App Groups**: `group.com.nitant.lumis`

---

## Step 2: Add LumisShieldActionExtension

### 2.1 Create the Target
1. In the Project Navigator, select the **Lumis** project
2. Click the **+** button at the bottom of targets list
3. Search for "**App Extension**"
4. Select "**Shield Action Extension**"
5. Click **Next**

### 2.2 Configure the Target
- **Product Name**: `LumisShieldActionExtension`
- **Team**: Select your development team
- **Organization Identifier**: `com.nitant`
- **Bundle Identifier**: `com.nitant.Lumis.LumisShieldActionExtension`
- **Language**: Swift
- Click **Finish**
- Click **Cancel** on "Activate scheme?" prompt

### 2.3 Replace Generated Files
1. Find the **LumisShieldActionExtension** folder in Project Navigator
2. **Delete** all auto-generated files
3. From `ios/LumisShieldActionExtension/`, **drag** into Xcode:
   - `ShieldActionExtension.swift`
   - `Info.plist`
   - `LumisShieldActionExtension.entitlements`
4. Add to target: **LumisShieldActionExtension**

### 2.4 Configure Build Settings
1. Select the **LumisShieldActionExtension** target
2. **Build Settings** → **Code Signing Entitlements**: `LumisShieldActionExtension/LumisShieldActionExtension.entitlements`
3. **Build Settings** → **Info.plist File**: `LumisShieldActionExtension/Info.plist`
4. **Signing & Capabilities** → Add:
   - **Family Controls**
   - **App Groups**: `group.com.nitant.lumis`

---

## Step 3: Add LumisDeviceActivityReport

### 3.1 Create the Target
1. In the Project Navigator, select the **Lumis** project
2. Click the **+** button at the bottom of targets list
3. Search for "**App Extension**"
4. Select "**Device Activity Report Extension**"
5. Click **Next**

### 3.2 Configure the Target
- **Product Name**: `LumisDeviceActivityReport`
- **Team**: Select your development team
- **Organization Identifier**: `com.nitant`
- **Bundle Identifier**: `com.nitant.Lumis.LumisDeviceActivityReport`
- **Language**: Swift
- Click **Finish**
- Click **Cancel** on "Activate scheme?" prompt

### 3.3 Replace Generated Files
1. Find the **LumisDeviceActivityReport** folder in Project Navigator
2. **Delete** all auto-generated files
3. From `ios/LumisDeviceActivityReport/`, **drag** into Xcode:
   - `DeviceActivityReportExtension.swift`
   - `TotalActivityReport.swift`
   - `TotalActivityView.swift`
   - `Info.plist`
   - `LumisDeviceActivityReport.entitlements`
4. Add to target: **LumisDeviceActivityReport**

### 3.4 Configure Build Settings
1. Select the **LumisDeviceActivityReport** target
2. **Build Settings** → **Code Signing Entitlements**: `LumisDeviceActivityReport/LumisDeviceActivityReport.entitlements`
3. **Build Settings** → **Info.plist File**: `LumisDeviceActivityReport/Info.plist`
4. **Signing & Capabilities** → Add:
   - **Family Controls**
   - **App Groups**: `group.com.nitant.lumis`

---

## Step 4: Embed Extensions in Main App

1. Select the **Lumis** (main app) target
2. Go to **General** tab
3. Scroll to **Frameworks, Libraries, and Embedded Content** section
4. Scroll further down to **Embedded Binaries** (or it might say **Embed App Extensions**)
5. Click the **+** button
6. Add all three extensions:
   - `LumisShieldExtension.appex`
   - `LumisShieldActionExtension.appex`
   - `LumisDeviceActivityReport.appex`
7. Ensure they're set to **Embed & Sign**

---

## Step 5: Build and Test

### 5.1 Clean Build
1. Product → Clean Build Folder (Cmd+Shift+K)
2. Product → Build (Cmd+B)
3. Fix any build errors

### 5.2 Test Shield Branding
1. Run the app on a simulator or device
2. Go to Shield settings and select apps to block
3. Activate the shield
4. Try to open a blocked app
5. You should see the **custom Lumis shield screen** with:
   - "Get Some Sunlight First ☀️" title
   - Dynamic progress subtitle
   - Sunrise-colored "Open Lumis" button

### 5.3 Test Screen Time Data
1. Use the app throughout the day
2. Navigate to Focus Analytics screen
3. You should now see:
   - Per-app usage data
   - Hourly breakdown charts
   - Pickups and notifications
   - App categories (productive/distracting)

---

## Troubleshooting

### Build Errors
- **Missing entitlements**: Verify entitlements files are added to the target
- **Code signing**: Ensure all extensions have the same team as main app
- **Missing files**: Check that all Swift files are in the target membership

### Shield Not Showing Custom UI
- Verify **LumisShieldExtension** is embedded in main app
- Check that **App Groups** capability is enabled
- Ensure `syncShieldDisplayData()` is called before activating shield

### No Screen Time Data
- Verify **LumisDeviceActivityReport** is embedded
- Check Screen Time permission is granted
- Call `refreshScreenTimeData()` to trigger data collection
- Monitor console logs for `[DeviceActivityReport]` messages

---

## Notes

- All extensions share data via App Groups: `group.com.nitant.lumis`
- Extensions run in separate processes from the main app
- Changes to extension code require rebuilding the main app
- Extensions cannot be debugged directly (use print statements + Console.app)

---

## Files Created

Shield Extensions:
- `ios/LumisShieldExtension/ShieldConfigurationExtension.swift`
- `ios/LumisShieldExtension/Info.plist`
- `ios/LumisShieldExtension/LumisShieldExtension.entitlements`
- `ios/LumisShieldActionExtension/ShieldActionExtension.swift`
- `ios/LumisShieldActionExtension/Info.plist`
- `ios/LumisShieldActionExtension/LumisShieldActionExtension.entitlements`

Report Extension:
- `ios/LumisDeviceActivityReport/DeviceActivityReportExtension.swift`
- `ios/LumisDeviceActivityReport/TotalActivityReport.swift`
- `ios/LumisDeviceActivityReport/TotalActivityView.swift`
- `ios/LumisDeviceActivityReport/Info.plist`
- `ios/LumisDeviceActivityReport/LumisDeviceActivityReport.entitlements`

Monitor Extension (already exists):
- `ios/LumisDeviceActivityMonitor/DeviceActivityMonitorExtension.swift`
- `ios/LumisDeviceActivityMonitor/Info.plist`
- `ios/LumisDeviceActivityMonitor/LumisDeviceActivityMonitor.entitlements`
