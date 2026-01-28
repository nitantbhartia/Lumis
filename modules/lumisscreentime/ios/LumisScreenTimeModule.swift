import ExpoModulesCore
import ManagedSettings
import FamilyControls
import DeviceActivity
import UIKit
import ActivityKit

// NOTE: DO NOT IMPORT SwiftUI here. 
// It conflicts with Expo's 'View' function name.
// All SwiftUI views and the classes that host them are in LumisScreenTimeUI.swift

public class LumisScreenTimeModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LumisScreenTime")

        Function("hello") { () -> String in "Lumis Screen Time Module is Active!" }

        Function("clearMetadata") {
            UserDefaults.standard.removeObject(forKey: "LumisAppMetadata")
            UserDefaults.standard.synchronize()
        }

        AsyncFunction("requestAuthorization") { () async throws -> Bool in
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            return AuthorizationCenter.shared.authorizationStatus == .approved
        }

        AsyncFunction("getAuthorizationStatus") { () async -> String in
            let status = AuthorizationCenter.shared.authorizationStatus
            switch status {
            case .approved: return "approved"
            case .denied: return "denied"
            case .notDetermined: return "notDetermined"
            @unknown default: return "unknown"
            }
        }
        
        AsyncFunction("showAppPicker") { (promise: Promise) in
            DispatchQueue.main.async {
                guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                      let window = windowScene.windows.first(where: { $0.isKeyWindow }) ?? windowScene.windows.first,
                      let rootVC = window.rootViewController else {
                    promise.reject("NO_ROOT_VC", "Could not find root view controller")
                    return
                }
                var topVC = rootVC
                while let presented = topVC.presentedViewController { topVC = presented }
                
                let pickerVC = FamilyActivityPickerHostingController()
                let jsonDecoder = JSONDecoder()
                if let blob = UserDefaults.standard.data(forKey: "LumisSelectionBlob") {
                    if let existing = try? jsonDecoder.decode(FamilyActivitySelection.self, from: blob) { pickerVC.initialSelection = existing }
                }
                pickerVC.modalPresentationStyle = .formSheet
                pickerVC.onDismiss = { promise.resolve(false) }
                pickerVC.onSelectionComplete = { selection in
                    let jsonEncoder = JSONEncoder()
                    if let selectionData = try? jsonEncoder.encode(selection) {
                        UserDefaults.standard.set(selectionData, forKey: "LumisSelectionBlob")
                        UserDefaults.standard.synchronize()
                    }
                    var displayList: [[String: Any]] = []
                    func getSafeName(_ name: String?, fallback: String) -> String {
                        if let n = name, !n.isEmpty {
                            let clean = n.trimmingCharacters(in: .whitespacesAndNewlines)
                            let lower = clean.lowercased()
                            if lower != "unknown app" && lower != "unknown" && !lower.contains("unknown") && lower != "unim" { return clean }
                        }
                        return fallback
                    }
                    for app in selection.applications {
                        let name = app.localizedDisplayName ?? ""
                        let safeName = getSafeName(name, fallback: "Shielded App")
                        let b64Token = (try? jsonEncoder.encode(app.token))?.base64EncodedString()
                        displayList.append(["name": safeName, "isEnabled": true, "isCategory": false, "tokenData": b64Token as Any])
                    }
                    for category in selection.categories {
                        let name = category.localizedDisplayName ?? ""
                        let safeName = getSafeName(name, fallback: "Category")
                        let b64Token = (try? jsonEncoder.encode(category.token))?.base64EncodedString()
                        displayList.append(["name": safeName, "isEnabled": true, "isCategory": true, "tokenData": b64Token as Any])
                    }
                    UserDefaults.standard.set(displayList, forKey: "LumisAppMetadata")
                    UserDefaults.standard.synchronize()
                    promise.resolve(["success": true, "count": displayList.count, "toggles": displayList])
                }
                topVC.present(pickerVC, animated: true)
            }
        }

        Function("getAppToggles") { () -> [[String: Any]] in
            UserDefaults.standard.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
        }
        
        Function("toggleApp") { (name: String, enabled: Bool) -> Bool in
            var metadata = UserDefaults.standard.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            for i in 0..<metadata.count {
                if metadata[i]["name"] as? String == name {
                    metadata[i]["isEnabled"] = enabled
                    UserDefaults.standard.set(metadata, forKey: "LumisAppMetadata")
                    UserDefaults.standard.synchronize()
                    return true
                }
            }
            return false
        }

        Function("activateShield") { () -> Bool in
            let metadata = UserDefaults.standard.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            let jsonDecoder = JSONDecoder()
            guard let blob = UserDefaults.standard.data(forKey: "LumisSelectionBlob"),
                  let selection = try? jsonDecoder.decode(FamilyActivitySelection.self, from: blob) else { return false }
            let hasEnabledApps = metadata.contains { ($0["isEnabled"] as? Bool) == true }
            let store = ManagedSettingsStore()
            if hasEnabledApps {
                store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
                store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : .specific(Set(selection.categoryTokens))
            } else {
                store.shield.applications = nil
                store.shield.applicationCategories = nil
            }
            return true
        }
        
        Function("deactivateShield") { () -> Bool in
            let store = ManagedSettingsStore()
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            return true
        }
        
        Function("getSelectedAppCount") { () -> Int in
            let metadata = UserDefaults.standard.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            return metadata.filter { ($0["isEnabled"] as? Bool) == true }.count
        }
        
        Function("isShieldActive") { () -> Bool in
            let store = ManagedSettingsStore()
            let hasApps = !(store.shield.applications?.isEmpty ?? true)
            var hasCategories = false
            if let policy = store.shield.applicationCategories {
                if case .specific(let categories, _) = policy { hasCategories = !categories.isEmpty }
                else if case .all = policy { hasCategories = true }
            }
            return hasApps || hasCategories
        }

        View(LumisIconView.self) {
            Prop("tokenData") { (view: LumisIconView, data: String?) in
                view.lastProps.tokenData = data
                view.updateFromProps()
            }
            Prop("appName") { (view: LumisIconView, name: String?) in
                view.lastProps.appName = name
                view.updateFromProps()
            }
            Prop("isCategory") { (view: LumisIconView, isCat: Bool) in
                view.lastProps.isCategory = isCat
                view.updateFromProps()
            }
            Prop("variant") { (view: LumisIconView, variant: String?) in
                view.lastProps.variant = variant ?? "icon"
                view.updateFromProps()
            }
            Prop("size") { (view: LumisIconView, size: Double?) in
                view.lastProps.size = size ?? 40.0
                view.updateFromProps()
            }
            Prop("grayscale") { (view: LumisIconView, grayscale: Bool?) in
                view.lastProps.grayscale = grayscale ?? false
                view.updateFromProps()
            }
        }

        // MARK: - Live Activity Functions

        Function("startLiveActivity") { (goalMinutes: Int, remainingSeconds: Int, luxLevel: Int) -> String? in
            if #available(iOS 16.2, *) {
                return LumisLiveActivityManager.shared.startActivity(
                    goalMinutes: goalMinutes,
                    remainingSeconds: remainingSeconds,
                    luxLevel: luxLevel
                )
            }
            return nil
        }

        Function("updateLiveActivity") { (remainingSeconds: Int, luxLevel: Int, creditRate: Double, isIndoors: Bool) in
            if #available(iOS 16.2, *) {
                LumisLiveActivityManager.shared.updateActivity(
                    remainingSeconds: remainingSeconds,
                    luxLevel: luxLevel,
                    creditRate: creditRate,
                    isIndoors: isIndoors
                )
            }
        }

        Function("endLiveActivity") {
            if #available(iOS 16.2, *) {
                LumisLiveActivityManager.shared.endActivity()
            }
        }

        Function("isLiveActivityActive") { () -> Bool in
            if #available(iOS 16.2, *) {
                return LumisLiveActivityManager.shared.isActivityActive()
            }
            return false
        }

        Function("areLiveActivitiesEnabled") { () -> Bool in
            if #available(iOS 16.2, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // MARK: - Shield Data Sync (for ShieldConfigurationExtension)

        Function("updateShieldData") { (goalMinutes: Int, lightMinutes: Int, currentStreak: Int) in
            // Write to shared App Group UserDefaults so ShieldConfigurationExtension can read it
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
            sharedDefaults?.set(goalMinutes, forKey: "dailyGoalMinutes")
            sharedDefaults?.set(lightMinutes, forKey: "todayLightMinutes")
            sharedDefaults?.set(currentStreak, forKey: "currentStreak")
            sharedDefaults?.synchronize()

            // Debug logging
            print("[LumisScreenTime] Shield data updated - Goal: \(goalMinutes)m, Light: \(lightMinutes)m, Streak: \(currentStreak)")
            print("[LumisScreenTime] Verifying write - Goal: \(sharedDefaults?.integer(forKey: "dailyGoalMinutes") ?? -1)")
        }

        // MARK: - Focus Score Functions

        /// Schedule DeviceActivityCenter monitoring for the morning focus window.
        /// This sets up the report extension to run 60 minutes after wake time.
        AsyncFunction("scheduleFocusScoreReport") { (wakeHour: Int, wakeMinute: Int) async throws -> Bool in
            let center = DeviceActivityCenter()

            // Create schedule for 60 minutes after wake time
            let startComponents = DateComponents(hour: wakeHour, minute: wakeMinute)
            var endComponents = DateComponents(hour: wakeHour + 1, minute: wakeMinute)

            // Handle hour overflow (e.g., wake at 23:30 -> end at 00:30)
            if (wakeHour + 1) >= 24 {
                endComponents.hour = (wakeHour + 1) % 24
            }

            let schedule = DeviceActivitySchedule(
                intervalStart: startComponents,
                intervalEnd: endComponents,
                repeats: true
            )

            // Store wake time in App Group for the extension to read
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
            sharedDefaults?.set(String(format: "%02d:%02d", wakeHour, wakeMinute), forKey: "scheduledWakeTime")
            sharedDefaults?.synchronize()

            do {
                try center.startMonitoring(
                    DeviceActivityName("com.lumis.focusWindow"),
                    during: schedule
                )
                print("[FocusScore] Scheduled monitoring for \(wakeHour):\(wakeMinute) - \(endComponents.hour ?? 0):\(endComponents.minute ?? 0)")
                return true
            } catch {
                print("[FocusScore] Failed to schedule monitoring: \(error)")
                return false
            }
        }

        /// Stop monitoring the focus window.
        Function("stopFocusScoreMonitoring") {
            let center = DeviceActivityCenter()
            center.stopMonitoring([DeviceActivityName("com.lumis.focusWindow")])
            print("[FocusScore] Stopped monitoring")
        }

        /// Get the current Focus Score from App Group UserDefaults.
        /// This reads data written by the DeviceActivityReport extension.
        Function("getFocusScore") { () -> [String: Any] in
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")

            let score = sharedDefaults?.integer(forKey: "focusScore") ?? 0
            let timestamp = sharedDefaults?.string(forKey: "focusScoreTimestamp") ?? ""
            let distractingMinutes = sharedDefaults?.integer(forKey: "distractingMinutes") ?? 0
            let sunlightBonus = sharedDefaults?.bool(forKey: "sunlightBonusApplied") ?? false
            let focusRatio = sharedDefaults?.double(forKey: "focusRatio") ?? 0.0
            let penaltyDeductions = sharedDefaults?.integer(forKey: "penaltyDeductions") ?? 0

            return [
                "score": score,
                "timestamp": timestamp,
                "distractingMinutes": distractingMinutes,
                "sunlightBonusApplied": sunlightBonus,
                "focusRatio": focusRatio,
                "penaltyDeductions": penaltyDeductions
            ]
        }

        /// Record a shield pickup (user attempted to open blocked app).
        /// This increments the penalty counter for Focus Score calculation.
        Function("recordShieldPickup") {
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
            let currentPickups = sharedDefaults?.integer(forKey: "shieldPickups") ?? 0
            sharedDefaults?.set(currentPickups + 1, forKey: "shieldPickups")
            sharedDefaults?.synchronize()
            print("[FocusScore] Recorded shield pickup. Total: \(currentPickups + 1)")
        }

        /// Mark that user has achieved 120 seconds of outdoor lux today.
        /// This enables the sunlight bonus multiplier for Focus Score.
        Function("markLuxDetected") {
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
            sharedDefaults?.set(true, forKey: "todayLuxDetected")
            sharedDefaults?.synchronize()
            print("[FocusScore] Lux threshold (120s) achieved - sunlight bonus enabled")
        }

        /// Reset daily focus data counters.
        /// Call this at the start of each new day.
        Function("resetDailyFocusData") {
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
            sharedDefaults?.set(0, forKey: "shieldPickups")
            sharedDefaults?.set(false, forKey: "todayLuxDetected")
            sharedDefaults?.set(0, forKey: "focusScore")
            sharedDefaults?.removeObject(forKey: "focusScoreTimestamp")
            sharedDefaults?.synchronize()
            print("[FocusScore] Daily focus data reset")
        }

        /// Get the 7-day average distracting minutes for "Time Saved" badge.
        Function("getAvgDistractingMinutes") { () -> Int in
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
            return sharedDefaults?.integer(forKey: "avgDistractingMinutes7Day") ?? 0
        }

        // MARK: - Detailed Usage Data Functions

        /// Get detailed usage stats for the current day.
        Function("getDetailedUsageStats") { () -> [String: Any] in
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")

            return [
                "totalScreenTimeSeconds": sharedDefaults?.integer(forKey: "totalScreenTimeSeconds") ?? 0,
                "productiveSeconds": sharedDefaults?.integer(forKey: "productiveSeconds") ?? 0,
                "distractingSeconds": sharedDefaults?.integer(forKey: "distractingSeconds") ?? 0,
                "neutralSeconds": sharedDefaults?.integer(forKey: "neutralSeconds") ?? 0,
                "totalPickups": sharedDefaults?.integer(forKey: "totalPickups") ?? 0,
                "totalNotifications": sharedDefaults?.integer(forKey: "totalNotifications") ?? 0,
                "topApps": sharedDefaults?.stringArray(forKey: "topApps") ?? [],
                "focusScore": sharedDefaults?.integer(forKey: "focusScore") ?? 0,
                "focusRatio": sharedDefaults?.double(forKey: "focusRatio") ?? 0.0,
                "timestamp": sharedDefaults?.string(forKey: "focusScoreTimestamp") ?? ""
            ]
        }

        /// Get hourly breakdown data for charts.
        Function("getHourlyBreakdown") { () -> [[String: Any]] in
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")

            guard let data = sharedDefaults?.data(forKey: "hourlyBreakdown") else {
                return []
            }

            struct HourlyUsageData: Codable {
                let hour: Int
                let productiveSeconds: Int
                let distractingSeconds: Int
                let neutralSeconds: Int
            }

            guard let hourlyData = try? JSONDecoder().decode([HourlyUsageData].self, from: data) else {
                return []
            }

            return hourlyData.map { item in
                [
                    "hour": item.hour,
                    "productiveSeconds": item.productiveSeconds,
                    "distractingSeconds": item.distractingSeconds,
                    "neutralSeconds": item.neutralSeconds
                ]
            }
        }

        /// Get app usage data for the list view.
        Function("getAppUsageData") { () -> [[String: Any]] in
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")

            guard let data = sharedDefaults?.data(forKey: "appUsageData") else {
                return []
            }

            struct AppUsageData: Codable {
                let bundleIdentifier: String
                let displayName: String
                let category: String
                let totalSeconds: Int
                let numberOfPickups: Int
                let numberOfNotifications: Int
                let tokenData: String?
            }

            guard let appData = try? JSONDecoder().decode([AppUsageData].self, from: data) else {
                return []
            }

            return appData.map { app in
                var result: [String: Any] = [
                    "bundleIdentifier": app.bundleIdentifier,
                    "displayName": app.displayName,
                    "category": app.category,
                    "totalSeconds": app.totalSeconds,
                    "numberOfPickups": app.numberOfPickups,
                    "numberOfNotifications": app.numberOfNotifications
                ]
                if let token = app.tokenData {
                    result["tokenData"] = token
                }
                return result
            }
        }

        /// Get usage data for a specific date (historical).
        Function("getUsageForDate") { (dateKey: String) -> [String: Any]? in
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")

            guard let history = sharedDefaults?.dictionary(forKey: "usageHistory") as? [String: Data],
                  let reportData = history[dateKey] else {
                return nil
            }

            struct DailyUsageReport: Codable {
                let date: String
                let totalScreenTimeSeconds: Int
                let productiveSeconds: Int
                let distractingSeconds: Int
                let neutralSeconds: Int
                let totalPickups: Int
                let totalNotifications: Int
                let focusScore: Int
                let focusRatio: Double
                let topApps: [String]
            }

            guard let report = try? JSONDecoder().decode(DailyUsageReport.self, from: reportData) else {
                return nil
            }

            return [
                "date": report.date,
                "totalScreenTimeSeconds": report.totalScreenTimeSeconds,
                "productiveSeconds": report.productiveSeconds,
                "distractingSeconds": report.distractingSeconds,
                "neutralSeconds": report.neutralSeconds,
                "totalPickups": report.totalPickups,
                "totalNotifications": report.totalNotifications,
                "focusScore": report.focusScore,
                "focusRatio": report.focusRatio,
                "topApps": report.topApps
            ]
        }

        /// Get available history dates.
        Function("getAvailableHistoryDates") { () -> [String] in
            let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
            guard let history = sharedDefaults?.dictionary(forKey: "usageHistory") as? [String: Data] else {
                return []
            }
            return Array(history.keys).sorted().reversed()
        }

        // MARK: - Refresh Screen Time Data

        /// Triggers a refresh of screen time data by presenting a hidden DeviceActivityReport view.
        /// This causes iOS to run the report extension which populates usage data.
        AsyncFunction("refreshScreenTimeData") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                DispatchQueue.main.async {
                    // Get the root view controller
                    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                          let window = windowScene.windows.first(where: { $0.isKeyWindow }) ?? windowScene.windows.first,
                          let rootVC = window.rootViewController else {
                        print("[LumisScreenTime] Could not find root view controller")
                        promise.resolve(false)
                        return
                    }

                    // Find the topmost presented controller
                    var topVC = rootVC
                    while let presented = topVC.presentedViewController {
                        topVC = presented
                    }

                    // Create the report view controller
                    let reportVC = DeviceActivityReportHostingController()
                    reportVC.modalPresentationStyle = .overCurrentContext
                    reportVC.view.backgroundColor = .clear
                    reportVC.view.isHidden = true // Keep it hidden

                    reportVC.onDataCollected = {
                        // Data has been collected, dismiss and resolve
                        reportVC.dismiss(animated: false) {
                            print("[LumisScreenTime] Screen time data refreshed")
                            promise.resolve(true)
                        }
                    }

                    // Present the hidden view controller
                    topVC.present(reportVC, animated: false) {
                        // Give the report extension time to run
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                            // If callback hasn't fired yet, dismiss anyway
                            if reportVC.presentingViewController != nil {
                                reportVC.dismiss(animated: false) {
                                    promise.resolve(true)
                                }
                            }
                        }
                    }
                }
            } else {
                promise.resolve(false)
            }
        }

        // MARK: - Daily Activity Monitoring

        /// Start monitoring all device activity for the full day.
        /// This triggers the DeviceActivityMonitor extension to collect usage data.
        AsyncFunction("startDailyMonitoring") { () async throws -> Bool in
            let center = DeviceActivityCenter()

            // Create a schedule that covers the full day (midnight to midnight)
            let schedule = DeviceActivitySchedule(
                intervalStart: DateComponents(hour: 0, minute: 0),
                intervalEnd: DateComponents(hour: 23, minute: 59),
                repeats: true
            )

            // Create events to track usage at regular intervals
            // The extension will be notified when these thresholds are reached
            let events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
                DeviceActivityEvent.Name("com.lumis.usage.distracting"): DeviceActivityEvent(
                    applications: Set(), // Empty means all apps
                    categories: Set(),
                    webDomains: Set(),
                    threshold: DateComponents(minute: 1) // Trigger every minute
                )
            ]

            do {
                try center.startMonitoring(
                    DeviceActivityName("com.lumis.dailyActivity"),
                    during: schedule,
                    events: events
                )
                print("[LumisScreenTime] Daily monitoring started")
                return true
            } catch {
                print("[LumisScreenTime] Failed to start daily monitoring: \(error)")
                return false
            }
        }

        /// Stop daily activity monitoring.
        Function("stopDailyMonitoring") {
            let center = DeviceActivityCenter()
            center.stopMonitoring([DeviceActivityName("com.lumis.dailyActivity")])
            print("[LumisScreenTime] Daily monitoring stopped")
        }

        /// Check if daily monitoring is active.
        Function("isDailyMonitoringActive") { () -> Bool in
            let center = DeviceActivityCenter()
            return center.activities.contains(DeviceActivityName("com.lumis.dailyActivity"))
        }
    }
}
