import DeviceActivity
import SwiftUI

struct TotalActivityReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .init(rawValue: "Total Activity")

    let content: (ActivityReport) -> TotalActivityView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> ActivityReport {
        // Aggregate all device activity data
        var totalScreenTime: TimeInterval = 0
        var totalPickups = 0
        var totalNotifications = 0
        var appUsageData: [AppUsageInfo] = []
        var hourlyData: [Int: HourlyUsage] = [:]

        // Initialize hourly data
        for hour in 0..<24 {
            hourlyData[hour] = HourlyUsage(hour: hour, totalSeconds: 0, productiveSeconds: 0, distractingSeconds: 0, neutralSeconds: 0)
        }

        // Process each activity segment
        for await activityData in data {
            // Get user's activity
            let user = activityData.user

            // Process each activity segment
            for await segment in activityData.activitySegments {
                let segmentDuration = segment.totalActivityDuration
                totalScreenTime += segmentDuration

                // Get the hour for this segment
                let calendar = Calendar.current
                let hour = calendar.component(.hour, from: segment.dateInterval.start)
                hourlyData[hour]?.totalSeconds += Int(segmentDuration)
            }

            // Process category activity
            for await categoryActivity in activityData.categoryActivity {
                let category = categoryActivity.category
                let duration = categoryActivity.totalActivityDuration

                // Categorize based on category token
                // Social, Entertainment, Games are typically "distracting"
                // Productivity, Education are "productive"
                // Everything else is "neutral"
                let categoryName = category.localizedDisplayName ?? "Unknown"
                let isDistracting = isDistractingCategory(categoryName)
                let isProductive = isProductiveCategory(categoryName)

                let hour = Calendar.current.component(.hour, from: Date())
                if isDistracting {
                    hourlyData[hour]?.distractingSeconds += Int(duration)
                } else if isProductive {
                    hourlyData[hour]?.productiveSeconds += Int(duration)
                } else {
                    hourlyData[hour]?.neutralSeconds += Int(duration)
                }
            }

            // Process individual app activity
            for await appActivity in activityData.applicationActivity {
                let app = appActivity.application
                let duration = appActivity.totalActivityDuration
                let pickups = appActivity.numberOfPickups
                let notifications = appActivity.numberOfNotifications

                totalPickups += pickups
                totalNotifications += notifications

                let appName = app.localizedDisplayName ?? "Unknown App"
                let bundleId = app.bundleIdentifier ?? "unknown"
                let categoryName = app.category?.localizedDisplayName ?? "Other"

                // Encode the app token for native icon display
                var tokenDataString: String? = nil
                if let token = app.token {
                    if let tokenData = try? JSONEncoder().encode(token) {
                        tokenDataString = tokenData.base64EncodedString()
                    }
                }

                appUsageData.append(AppUsageInfo(
                    bundleIdentifier: bundleId,
                    displayName: appName,
                    category: categoryName,
                    totalSeconds: Int(duration),
                    numberOfPickups: pickups,
                    numberOfNotifications: notifications,
                    tokenData: tokenDataString
                ))
            }
        }

        // Sort apps by usage time (descending)
        appUsageData.sort { $0.totalSeconds > $1.totalSeconds }

        // Take top 10 apps
        let topApps = Array(appUsageData.prefix(10))

        // Calculate productive/distracting/neutral totals
        var productiveSeconds = 0
        var distractingSeconds = 0
        var neutralSeconds = 0

        for app in appUsageData {
            if isDistractingCategory(app.category) {
                distractingSeconds += app.totalSeconds
            } else if isProductiveCategory(app.category) {
                productiveSeconds += app.totalSeconds
            } else {
                neutralSeconds += app.totalSeconds
            }
        }

        // Calculate focus score (0-100)
        let focusRatio = totalScreenTime > 0 ? Double(productiveSeconds) / totalScreenTime : 0
        let focusScore = min(100, Int(focusRatio * 100) + 20) // Base 20 + productivity ratio

        // Save to shared UserDefaults for main app to read
        saveToSharedDefaults(
            totalScreenTime: totalScreenTime,
            productiveSeconds: productiveSeconds,
            distractingSeconds: distractingSeconds,
            neutralSeconds: neutralSeconds,
            totalPickups: totalPickups,
            totalNotifications: totalNotifications,
            topApps: topApps,
            hourlyData: Array(hourlyData.values).sorted { $0.hour < $1.hour },
            focusScore: focusScore,
            focusRatio: focusRatio
        )

        return ActivityReport(
            totalScreenTime: totalScreenTime,
            productiveSeconds: productiveSeconds,
            distractingSeconds: distractingSeconds,
            neutralSeconds: neutralSeconds,
            totalPickups: totalPickups,
            totalNotifications: totalNotifications,
            topApps: topApps,
            focusScore: focusScore,
            focusRatio: focusRatio
        )
    }

    private func isDistractingCategory(_ category: String) -> Bool {
        let distracting = ["Social", "Entertainment", "Games", "Social Networking"]
        return distracting.contains { category.localizedCaseInsensitiveContains($0) }
    }

    private func isProductiveCategory(_ category: String) -> Bool {
        let productive = ["Productivity", "Education", "Developer Tools", "Business", "Finance", "Health & Fitness"]
        return productive.contains { category.localizedCaseInsensitiveContains($0) }
    }

    private func saveToSharedDefaults(
        totalScreenTime: TimeInterval,
        productiveSeconds: Int,
        distractingSeconds: Int,
        neutralSeconds: Int,
        totalPickups: Int,
        totalNotifications: Int,
        topApps: [AppUsageInfo],
        hourlyData: [HourlyUsage],
        focusScore: Int,
        focusRatio: Double
    ) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis") else {
            print("[DeviceActivityReport] Failed to access shared UserDefaults")
            return
        }

        // Save basic stats
        sharedDefaults.set(Int(totalScreenTime), forKey: "totalScreenTimeSeconds")
        sharedDefaults.set(productiveSeconds, forKey: "productiveSeconds")
        sharedDefaults.set(distractingSeconds, forKey: "distractingSeconds")
        sharedDefaults.set(neutralSeconds, forKey: "neutralSeconds")
        sharedDefaults.set(totalPickups, forKey: "totalPickups")
        sharedDefaults.set(totalNotifications, forKey: "totalNotifications")
        sharedDefaults.set(focusScore, forKey: "focusScore")
        sharedDefaults.set(focusRatio, forKey: "focusRatio")
        sharedDefaults.set(ISO8601DateFormatter().string(from: Date()), forKey: "focusScoreTimestamp")

        // Save top app names
        let topAppNames = topApps.map { $0.displayName }
        sharedDefaults.set(topAppNames, forKey: "topApps")

        // Save app usage data as JSON
        if let appData = try? JSONEncoder().encode(topApps) {
            sharedDefaults.set(appData, forKey: "appUsageData")
        }

        // Save hourly breakdown as JSON
        if let hourlyDataEncoded = try? JSONEncoder().encode(hourlyData) {
            sharedDefaults.set(hourlyDataEncoded, forKey: "hourlyBreakdown")
        }

        // Save to history for looking back at past data
        saveToHistory(
            sharedDefaults: sharedDefaults,
            totalScreenTime: totalScreenTime,
            productiveSeconds: productiveSeconds,
            distractingSeconds: distractingSeconds,
            neutralSeconds: neutralSeconds,
            totalPickups: totalPickups,
            totalNotifications: totalNotifications,
            topApps: topApps,
            focusScore: focusScore,
            focusRatio: focusRatio
        )

        // Sync immediately
        sharedDefaults.synchronize()

        print("[DeviceActivityReport] Saved screen time data: \(Int(totalScreenTime))s total, \(topApps.count) apps tracked")
    }

    private func saveToHistory(
        sharedDefaults: UserDefaults,
        totalScreenTime: TimeInterval,
        productiveSeconds: Int,
        distractingSeconds: Int,
        neutralSeconds: Int,
        totalPickups: Int,
        totalNotifications: Int,
        topApps: [AppUsageInfo],
        focusScore: Int,
        focusRatio: Double
    ) {
        // Get today's date key
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayKey = dateFormatter.string(from: Date())

        // Create a daily report
        let dailyReport = DailyUsageReport(
            date: todayKey,
            totalScreenTimeSeconds: Int(totalScreenTime),
            productiveSeconds: productiveSeconds,
            distractingSeconds: distractingSeconds,
            neutralSeconds: neutralSeconds,
            totalPickups: totalPickups,
            totalNotifications: totalNotifications,
            focusScore: focusScore,
            focusRatio: focusRatio,
            topApps: topApps.map { $0.displayName }
        )

        // Get existing history
        var history = sharedDefaults.dictionary(forKey: "usageHistory") as? [String: Data] ?? [:]

        // Encode and save today's report
        if let reportData = try? JSONEncoder().encode(dailyReport) {
            history[todayKey] = reportData
        }

        // Keep only last 30 days
        let sortedKeys = history.keys.sorted().reversed()
        if sortedKeys.count > 30 {
            let keysToRemove = sortedKeys.dropFirst(30)
            for key in keysToRemove {
                history.removeValue(forKey: key)
            }
        }

        sharedDefaults.set(history, forKey: "usageHistory")
        print("[DeviceActivityReport] Saved history for \(todayKey)")
    }
}

// MARK: - Data Models

struct ActivityReport {
    let totalScreenTime: TimeInterval
    let productiveSeconds: Int
    let distractingSeconds: Int
    let neutralSeconds: Int
    let totalPickups: Int
    let totalNotifications: Int
    let topApps: [AppUsageInfo]
    let focusScore: Int
    let focusRatio: Double
}

struct AppUsageInfo: Codable {
    let bundleIdentifier: String
    let displayName: String
    let category: String
    let totalSeconds: Int
    let numberOfPickups: Int
    let numberOfNotifications: Int
    let tokenData: String? // Base64 encoded ApplicationToken for native icon
}

struct HourlyUsage: Codable {
    let hour: Int
    var totalSeconds: Int
    var productiveSeconds: Int
    var distractingSeconds: Int
    var neutralSeconds: Int
}

// MARK: - Daily Usage Report for History

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
