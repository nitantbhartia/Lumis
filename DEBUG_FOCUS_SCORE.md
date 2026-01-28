# Debug: Focus Score Not Updating

## Issue
Focus score stuck at 0% even though monitoring is active.

## Root Cause
iOS 18+ changed how DeviceActivity threshold events work:
- `threshold: DateComponents(minute: 1)` triggers **once** after 1 minute of TOTAL usage
- It does NOT trigger repeatedly every minute
- The Monitor extension never receives `eventDidReachThreshold` calls

## Why This Happens
In iOS 18+:
- Threshold events are one-time triggers, not continuous
- Empty `applications: Set()` with a threshold doesn't reliably fire events
- The DeviceActivityMonitor extension needs actual app selections or different approach

## Current Monitoring Setup
```swift
let events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
    DeviceActivityEvent.Name("com.lumis.usage.all"): DeviceActivityEvent(
        applications: Set(), // Empty = all apps
        categories: Set(),
        webDomains: Set(),
        threshold: DateComponents(minute: 1) // ❌ Only fires ONCE
    )
]
```

## Solutions

### Option 1: Use Interval Callbacks (Simplest)
Instead of threshold events, use `intervalDidEnd` to calculate stats:
- Monitor runs daily (midnight to midnight)
- At interval end (11:59 PM), calculate total usage
- **Limitation**: Only updates once per day

### Option 2: Use Actual App Selection (Recommended)
```swift
// User selects apps they want to track
let selection = FamilyActivitySelection()
// Show FamilyActivityPicker to let user choose apps
```

Then create events for those specific apps:
```swift
let events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
    DeviceActivityEvent.Name("tracked.apps"): DeviceActivityEvent(
        applications: selection.applicationTokens,
        threshold: DateComponents(minute: 1) // Works with specific apps
    )
]
```

### Option 3: Poll Screen Time Data (Quick Fix)
Query iOS ScreenTime database directly from the app:
- Use ScreenTimeAPI (iOS 15+)
- Poll every few minutes when app is active
- Calculate focus score from query results
- **Limitation**: Only updates when app is open

## Recommendation

For immediate fix: **Option 3** - Poll from app
For proper solution: **Option 2** - Let users select apps to track

## Implementation: Option 3 (Quick Fix)

Add to `LumisScreenTimeModule.swift`:

```swift
Function("getRealtimeScreenTime") { () async -> [String: Any] in
    let store = ManagedSettingsStore()
    // Read shield.applications to see what's being tracked
    let trackedApps = store.shield.applications

    // Calculate approximate usage based on time since app install
    // This is a rough estimate until proper tracking is set up
    let roughEstimateMinutes = calculateEstimate()

    // Write to shared defaults
    let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
    sharedDefaults?.set(roughEstimateMinutes * 60, forKey: "totalScreenTimeSeconds")
    sharedDefaults?.set(roughEstimateMinutes * 60, forKey: "neutralSeconds")
    sharedDefaults?.set(50, forKey: "focusScore")
    sharedDefaults?.synchronize()

    return ["screenTimeMinutes": roughEstimateMinutes, "focusScore": 50]
}
```

## Why Focus Score Shows 0%

1. Monitor extension waiting for `eventDidReachThreshold`
2. Event never fires because threshold only triggers once
3. No data written to `totalScreenTimeSeconds`
4. Focus score calculation sees 0 seconds → 0% score

## Next Steps

1. **Short term**: Show estimated focus score (50%) until tracking works
2. **Medium term**: Implement app selection UI for proper tracking
3. **Long term**: Use iOS 16+ Family Activity Picker for granular control

## Console Logs You Won't See

Because threshold events don't fire, you'll NEVER see:
```
[LumisMonitor] Threshold reached
[LumisMonitor] Screen time: X minutes
[LumisMonitor] Focus score: 50%
```

You WILL see (once per day):
```
[LumisMonitor] Interval started
[LumisMonitor] Interval ended
```
