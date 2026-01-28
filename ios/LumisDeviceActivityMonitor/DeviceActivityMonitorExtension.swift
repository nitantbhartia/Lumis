//
//  DeviceActivityMonitorExtension.swift
//  LumisDeviceActivityMonitor
//
//  Created by nitant bhartia on 1/28/26.
//

import Foundation
import DeviceActivity
import ManagedSettings
import FamilyControls

/// Lumis DeviceActivity Monitor Extension
/// Tracks screen time usage and saves data to App Group shared defaults
/// The main Lumis app reads this data to display screen time on the dashboard
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")

    // MARK: - Interval Lifecycle

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

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        print("[LumisMonitor] Interval will start warning: \(activity.rawValue)")
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        print("[LumisMonitor] Interval will end warning: \(activity.rawValue)")
        // Capture final stats before interval ends
        saveFinalStats()
    }

    // MARK: - Event Handling

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        print("[LumisMonitor] Threshold reached: \(event.rawValue) for activity: \(activity.rawValue)")

        // Increment screen time counter each time threshold is hit
        // Each threshold = 1 minute of usage
        incrementScreenTime(for: event)
    }

    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
        print("[LumisMonitor] Event will reach threshold: \(event.rawValue)")
    }

    // MARK: - Data Management

    private func resetDailyData() {
        guard let defaults = sharedDefaults else {
            print("[LumisMonitor] Failed to access shared defaults")
            return
        }

        defaults.set(0, forKey: "totalScreenTimeSeconds")
        defaults.set(0, forKey: "productiveSeconds")
        defaults.set(0, forKey: "distractingSeconds")
        defaults.set(0, forKey: "neutralSeconds")
        defaults.set(0, forKey: "totalPickups")
        defaults.set(0, forKey: "totalNotifications")
        defaults.set([], forKey: "topApps")
        defaults.set(0, forKey: "focusScore")
        defaults.set(0.0, forKey: "focusRatio")
        defaults.set(ISO8601DateFormatter().string(from: Date()), forKey: "lastDataReset")
        defaults.synchronize()
        print("[LumisMonitor] Daily data reset")
    }

    private func incrementScreenTime(for event: DeviceActivityEvent.Name) {
        guard let defaults = sharedDefaults else {
            print("[LumisMonitor] Failed to access shared defaults")
            return
        }

        let currentSeconds = defaults.integer(forKey: "totalScreenTimeSeconds")

        // Add 60 seconds (1 minute) for each threshold hit
        let newTotal = currentSeconds + 60
        defaults.set(newTotal, forKey: "totalScreenTimeSeconds")
        defaults.set(ISO8601DateFormatter().string(from: Date()), forKey: "focusScoreTimestamp")

        // Track which category this event belongs to
        // Event names should be prefixed with category (e.g., "productive-email", "distracting-social")
        let eventName = event.rawValue.lowercased()
        if eventName.contains("productive") {
            let productive = defaults.integer(forKey: "productiveSeconds")
            defaults.set(productive + 60, forKey: "productiveSeconds")
        } else if eventName.contains("distracting") {
            let distracting = defaults.integer(forKey: "distractingSeconds")
            defaults.set(distracting + 60, forKey: "distractingSeconds")
        } else {
            let neutral = defaults.integer(forKey: "neutralSeconds")
            defaults.set(neutral + 60, forKey: "neutralSeconds")
        }

        defaults.synchronize()
        print("[LumisMonitor] Screen time: \(newTotal / 60) minutes")
    }

    private func saveFinalStats() {
        guard let defaults = sharedDefaults else {
            print("[LumisMonitor] Failed to access shared defaults")
            return
        }

        let totalSeconds = defaults.integer(forKey: "totalScreenTimeSeconds")
        let productiveSeconds = defaults.integer(forKey: "productiveSeconds")

        // Calculate focus score (0-100)
        if totalSeconds > 0 {
            let focusRatio = Double(productiveSeconds) / Double(totalSeconds)
            // Base 20 points + up to 80 points based on productivity ratio
            let focusScore = min(100, Int(focusRatio * 100) + 20)

            defaults.set(focusScore, forKey: "focusScore")
            defaults.set(focusRatio, forKey: "focusRatio")

            print("[LumisMonitor] Focus score: \(focusScore)% (ratio: \(focusRatio))")
        }

        defaults.set(ISO8601DateFormatter().string(from: Date()), forKey: "focusScoreTimestamp")
        defaults.synchronize()
        print("[LumisMonitor] Final stats saved - Total: \(totalSeconds)s, Productive: \(productiveSeconds)s")
    }
}
