import ExpoModulesCore
import ManagedSettings
import FamilyControls
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
            if #available(iOS 16.1, *) {
                return LumisLiveActivityManager.shared.startActivity(
                    goalMinutes: goalMinutes,
                    remainingSeconds: remainingSeconds,
                    luxLevel: luxLevel
                )
            }
            return nil
        }

        Function("updateLiveActivity") { (remainingSeconds: Int, luxLevel: Int, creditRate: Double, isIndoors: Bool) in
            if #available(iOS 16.1, *) {
                LumisLiveActivityManager.shared.updateActivity(
                    remainingSeconds: remainingSeconds,
                    luxLevel: luxLevel,
                    creditRate: creditRate,
                    isIndoors: isIndoors
                )
            }
        }

        Function("endLiveActivity") {
            if #available(iOS 16.1, *) {
                LumisLiveActivityManager.shared.endActivity()
            }
        }

        Function("isLiveActivityActive") { () -> Bool in
            if #available(iOS 16.1, *) {
                return LumisLiveActivityManager.shared.isActivityActive()
            }
            return false
        }

        Function("areLiveActivitiesEnabled") { () -> Bool in
            if #available(iOS 16.1, *) {
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
        }
    }
}
