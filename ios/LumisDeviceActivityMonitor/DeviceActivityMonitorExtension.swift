//
//  DeviceActivityMonitorExtension.swift
//  LumisDeviceActivityMonitor
//
//  Created by nitant bhartia on 1/27/26.
//

import Foundation
import DeviceActivity
import ManagedSettings
import FamilyControls

/// Extension that monitors device activity and saves usage data to App Group shared defaults.
/// The main Lumis app reads this data to display screen time on the dashboard.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        print("[LumisMonitor] Interval started: \(activity.rawValue)")

        // Reset daily counters at start of monitoring interval
        if activity.rawValue.contains("daily") {
            resetDailyData()
        }
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        print("[LumisMonitor] Interval ended: \(activity.rawValue)")

        // Save final stats and calculate focus score
        saveFinalStats()
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        print("[LumisMonitor] Threshold reached: \(event.rawValue)")

        // Increment screen time counter each time threshold is hit
        // Each threshold = 1 minute of usage
        incrementScreenTime()
    }

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        // Capture final stats before interval ends
        saveFinalStats()
    }

    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
    }

    // MARK: - Private Methods

    private func resetDailyData() {
        sharedDefaults?.set(0, forKey: "totalScreenTimeSeconds")
        sharedDefaults?.set(0, forKey: "productiveSeconds")
        sharedDefaults?.set(0, forKey: "distractingSeconds")
        sharedDefaults?.set(0, forKey: "neutralSeconds")
        sharedDefaults?.set(0, forKey: "totalPickups")
        sharedDefaults?.set(0, forKey: "totalNotifications")
        sharedDefaults?.set([], forKey: "topApps")
        sharedDefaults?.set(0, forKey: "focusScore")
        sharedDefaults?.set(0.0, forKey: "focusRatio")
        sharedDefaults?.set("", forKey: "focusScoreTimestamp")
        sharedDefaults?.synchronize()
        print("[LumisMonitor] Daily data reset")
    }

    private func incrementScreenTime() {
        let currentSeconds = sharedDefaults?.integer(forKey: "totalScreenTimeSeconds") ?? 0
        // Add 60 seconds (1 minute) for each threshold hit
        sharedDefaults?.set(currentSeconds + 60, forKey: "totalScreenTimeSeconds")
        sharedDefaults?.set(ISO8601DateFormatter().string(from: Date()), forKey: "focusScoreTimestamp")
        sharedDefaults?.synchronize()
        print("[LumisMonitor] Screen time: \((currentSeconds + 60) / 60) minutes")
    }

    private func saveFinalStats() {
        let totalSeconds = sharedDefaults?.integer(forKey: "totalScreenTimeSeconds") ?? 0
        let productiveSeconds = sharedDefaults?.integer(forKey: "productiveSeconds") ?? 0

        // Calculate focus score
        if totalSeconds > 0 {
            let focusRatio = Double(productiveSeconds) / Double(totalSeconds)
            let focusScore = min(100, Int(focusRatio * 100) + 20)

            sharedDefaults?.set(focusScore, forKey: "focusScore")
            sharedDefaults?.set(focusRatio, forKey: "focusRatio")
        }

        sharedDefaults?.set(ISO8601DateFormatter().string(from: Date()), forKey: "focusScoreTimestamp")
        sharedDefaults?.synchronize()
        print("[LumisMonitor] Final stats saved - Total: \(totalSeconds)s")
    }
}
