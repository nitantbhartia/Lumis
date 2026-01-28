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
        // For now, categorize all usage as neutral since we're tracking all apps together
        // TODO: In the future, we can use FamilyActivitySelection to separate productive/distracting apps
        // and create separate events for each category
        let eventName = event.rawValue.lowercased()

        if eventName.contains("productive") {
            // If event name explicitly says productive (future enhancement)
            let productive = defaults.integer(forKey: "productiveSeconds")
            defaults.set(productive + 60, forKey: "productiveSeconds")
        } else if eventName.contains("distracting") {
            // If event name explicitly says distracting (future enhancement)
            let distracting = defaults.integer(forKey: "distractingSeconds")
            defaults.set(distracting + 60, forKey: "distractingSeconds")
        } else {
            // Default: count as neutral usage
            // This is reasonable since we're tracking all apps together
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
        let distractingSeconds = defaults.integer(forKey: "distractingSeconds")

        // Calculate focus score (0-100)
        if totalSeconds > 0 {
            let focusRatio = Double(productiveSeconds) / Double(totalSeconds)
            let distractingRatio = Double(distractingSeconds) / Double(totalSeconds)

            // Calculate score based on time distribution:
            // - High score (70-100): Mostly productive or neutral usage
            // - Medium score (40-69): Mixed usage
            // - Low score (0-39): Mostly distracting usage

            var focusScore: Int

            if distractingSeconds == 0 && productiveSeconds == 0 {
                // All neutral usage - give moderate score (50)
                focusScore = 50
            } else {
                // Score formula: productive adds points, distracting removes points
                // Start at 50, productive adds up to +50, distracting removes up to -50
                let productiveBonus = Int(focusRatio * 50)
                let distractingPenalty = Int(distractingRatio * 50)
                focusScore = 50 + productiveBonus - distractingPenalty
                focusScore = max(0, min(100, focusScore))
            }

            defaults.set(focusScore, forKey: "focusScore")
            defaults.set(focusRatio, forKey: "focusRatio")

            print("[LumisMonitor] Focus score: \(focusScore)% (productive: \(productiveSeconds)s, distracting: \(distractingSeconds)s, total: \(totalSeconds)s)")
        }

        defaults.set(ISO8601DateFormatter().string(from: Date()), forKey: "focusScoreTimestamp")
        defaults.synchronize()
        print("[LumisMonitor] Final stats saved - Total: \(totalSeconds)s, Productive: \(productiveSeconds)s")
    }
}
