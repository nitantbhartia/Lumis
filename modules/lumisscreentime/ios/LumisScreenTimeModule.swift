import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

public class LumisScreenTimeModule: Module {
    private var currentPickerController: UIViewController?
    
    private func getDefaults() -> UserDefaults? {
        // Use standard defaults for UI state persistence to ensure reliability
        return UserDefaults.standard
    }

    public func definition() -> ModuleDefinition {
        Name("lumisscreentime")

        Function("hello") { () -> String in
            NSLog("[LumisScreenTime] hello called")
            return "Lumis Screen Time Module is Active!"
        }

        // Request Screen Time permissions
        AsyncFunction("requestAuthorization") { () async throws -> Bool in
            NSLog("[LumisScreenTime] requestAuthorization called from JS")
            if #available(iOS 16.0, *) {
                do {
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                    let status = AuthorizationCenter.shared.authorizationStatus
                    NSLog("[LumisScreenTime] requestAuthorization: Success, new status: \(status)")
                    return status == .approved
                } catch {
                    NSLog("[LumisScreenTime] requestAuthorization: Error: \(error.localizedDescription)")
                    return false
                }
            } else {
                NSLog("[LumisScreenTime] requestAuthorization: Unsupported - Screen Time requires iOS 16 or later")
                return false
            }
        }

        AsyncFunction("getAuthorizationStatus") { () async -> String in
            if #available(iOS 16.0, *) {
                let status = AuthorizationCenter.shared.authorizationStatus
                var statusString = "unknown"
                switch status {
                case .approved: statusString = "approved"
                case .denied: statusString = "denied"
                case .notDetermined: statusString = "notDetermined"
                @unknown default: statusString = "unknown"
                }
                NSLog("[LumisScreenTime] getAuthorizationStatus: \(statusString)")
                return statusString
            }
            return "unsupported"
        }
        
        // Present the FamilyActivityPicker SwiftUI view
        AsyncFunction("showAppPicker") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                DispatchQueue.main.async {
                    NSLog("[LumisScreenTime] showAppPicker called")
                    
                    // Check authorization status first
                    let status = AuthorizationCenter.shared.authorizationStatus
                    if status != .approved {
                        NSLog("[LumisScreenTime] showAppPicker: Not approved (status: \(status))")
                        let alert = UIAlertController(title: "Shielding Error", message: "Screen Time is not authorized. Please grant permission first.", preferredStyle: .alert)
                        alert.addAction(UIAlertAction(title: "OK", style: .default))
                        
                        // Try to find window to present alert
                        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                           let window = windowScene.windows.first(where: { $0.isKeyWindow }),
                           let rootVC = window.rootViewController {
                            rootVC.present(alert, animated: true)
                        }
                        
                        promise.reject("NOT_AUTHORIZED", "Screen Time matches not authorized")
                        return
                    }

                    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                          let window = windowScene.windows.first(where: { $0.isKeyWindow }) ?? windowScene.windows.first,
                          let rootVC = window.rootViewController else {
                        NSLog("[LumisScreenTime] Error: No root view controller found")
                        promise.reject("NO_ROOT_VC", "Could not find root view controller")
                        return
                    }
                    
                    // Find the topmost presented controller
                    var topVC = rootVC
                    while let presented = topVC.presentedViewController {
                        topVC = presented
                    }
                    NSLog("[LumisScreenTime] Presenting from: \(type(of: topVC))")
                    
                    let pickerVC = FamilyActivityPickerHostingController()
                    pickerVC.modalPresentationStyle = .formSheet
                    pickerVC.onDismiss = {
                        NSLog("[LumisScreenTime] Picker dismissed")
                        self.currentPickerController = nil
                        promise.resolve(false)
                    }
                    pickerVC.onSelectionComplete = { selection in
                        NSLog("[LumisScreenTime] Selection complete callback received")
                        let appCount = selection.applicationTokens.count
                        let categoryCount = selection.categoryTokens.count
                        
                        var response: [String: Any] = [
                            "success": true,
                            "count": appCount + categoryCount
                        ]
                        
                        var metadata: [[String: Any]] = []
                        var toggles: [[String: Any]] = []
                        let encoder = PropertyListEncoder()
                        
                        // Process Apps - Iterate Application objects to get names AND tokens
                        for app in selection.applications {
                            let name = app.localizedDisplayName ?? "Unknown App"
                            if let tokenData = try? encoder.encode(app.token) {
                                let item: [String: Any] = [
                                    "name": name,
                                    "isEnabled": true,
                                    "isCategory": false,
                                    "token": tokenData
                                ]
                                metadata.append(item)
                                
                                var jsItem = item
                                jsItem.removeValue(forKey: "token")
                                toggles.append(jsItem)
                            }
                        }
                        
                        // Process Categories
                        for category in selection.categories {
                            let name = category.localizedDisplayName ?? "Unknown Category"
                            if let tokenData = try? encoder.encode(category.token) {
                                let item: [String: Any] = [
                                    "name": name,
                                    "isEnabled": true,
                                    "isCategory": true,
                                    "token": tokenData
                                ]
                                metadata.append(item)
                                
                                var jsItem = item
                                jsItem.removeValue(forKey: "token")
                                toggles.append(jsItem)
                            }
                        }
                        
                        response["toggles"] = toggles
                        
                        // Save COMPLETE metadata (with tokens) to UserDefaults for activateShield
                        let defaults = self.getDefaults()
                        defaults?.set(metadata, forKey: "LumisAppMetadata")
                        defaults?.synchronize()
                        NSLog("[LumisScreenTime] Saved \(metadata.count) items to LumisAppMetadata")
                        
                        self.currentPickerController = nil
                        promise.resolve(response)
                    }
                    
                    self.currentPickerController = pickerVC
                    topVC.present(pickerVC, animated: true) {
                        NSLog("[LumisScreenTime] Picker presented successfully")
                    }
                }
            } else {
                promise.reject("UNSUPPORTED", "FamilyActivityPicker requires iOS 16 or later")
            }
        }
        
        // Get list of apps for the toggle UI
        Function("getAppToggles") { () -> [[String: Any]] in
            let defaults = self.getDefaults()
            let metadata = defaults?.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            return metadata.map { item in
                var newItem = item
                newItem.removeValue(forKey: "token") // Don't send token data to JS
                return newItem
            }
        }
        
        // Update a single app's toggle status
        Function("toggleApp") { (name: String, enabled: Bool) -> Bool in
            let defaults = self.getDefaults()
            var metadata = defaults?.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            
            for i in 0..<metadata.count {
                if metadata[i]["name"] as? String == name {
                    metadata[i]["isEnabled"] = enabled
                    defaults?.set(metadata, forKey: "LumisAppMetadata")
                    defaults?.synchronize()
                    NSLog("[LumisScreenTime] Toggled \(name) to \(enabled)")
                    return true
                }
            }
            return false
        }

        // Activate shield on selected apps
        Function("activateShield") { () -> Bool in
            if #available(iOS 16.0, *) {
                let status = AuthorizationCenter.shared.authorizationStatus
                NSLog("[LumisScreenTime] activateShield: Status is \(status)")
                guard status == .approved else { 
                    NSLog("[LumisScreenTime] activateShield: Failed - Not authorized")
                    return false 
                }

                let defaults = self.getDefaults()
                let metadata = defaults?.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
                NSLog("[LumisScreenTime] activateShield: Found \(metadata.count) items in metadata")
                
                let decoder = PropertyListDecoder()
                var appTokens = Set<ApplicationToken>()
                var categoryTokens = Set<ActivityCategoryToken>()
                
                for item in metadata {
                    guard let isEnabled = item["isEnabled"] as? Bool, isEnabled,
                          let tokenData = item["token"] as? Data else { 
                        NSLog("[LumisScreenTime] activateShield: Skipping item \(item["name"] ?? "unknown") - isEnabled: \(item["isEnabled"] ?? "nil")")
                        continue 
                    }
                    
                    if item["isCategory"] as? Bool == true {
                        if let token = try? decoder.decode(ActivityCategoryToken.self, from: tokenData) {
                            categoryTokens.insert(token)
                            NSLog("[LumisScreenTime] activateShield: Added category token for \(item["name"] ?? "category")")
                        } else {
                            NSLog("[LumisScreenTime] activateShield: Failed to decode category token for \(item["name"] ?? "category")")
                        }
                    } else {
                        if let token = try? decoder.decode(ApplicationToken.self, from: tokenData) {
                            appTokens.insert(token)
                            NSLog("[LumisScreenTime] activateShield: Added app token for \(item["name"] ?? "app")")
                        } else {
                            NSLog("[LumisScreenTime] activateShield: Failed to decode app token for \(item["name"] ?? "app")")
                        }
                    }
                }
                
                NSLog("[LumisScreenTime] activateShield: Final counts - Apps: \(appTokens.count), Categories: \(categoryTokens.count)")
                
                // Use the default store for maximum reliability
                let store = ManagedSettingsStore()
                store.shield.applications = appTokens.isEmpty ? nil : appTokens
                store.shield.applicationCategories = categoryTokens.isEmpty ? nil : .specific(categoryTokens)
                
                // Also update the named store if it was being used
                let namedStore = ManagedSettingsStore(named: .init("LumisStore"))
                namedStore.shield.applications = appTokens.isEmpty ? nil : appTokens
                namedStore.shield.applicationCategories = categoryTokens.isEmpty ? nil : .specific(categoryTokens)
                
                return true
            }
            return false
        }
        
        // Deactivate all shields (called when session completes)
        Function("deactivateShield") { () -> Bool in
            if #available(iOS 16.0, *) {
                let store = ManagedSettingsStore()
                store.shield.applications = nil
                store.shield.applicationCategories = nil
                store.shield.webDomains = nil
                store.shield.webDomainCategories = nil

                let namedStore = ManagedSettingsStore(named: .init("LumisStore"))
                namedStore.shield.applications = nil
                namedStore.shield.applicationCategories = nil
                namedStore.shield.webDomains = nil
                namedStore.shield.webDomainCategories = nil
                
                NSLog("[LumisScreenTime] All shields deactivated in all stores")
                return true
            }
            return false
        }
        
        // Get count of selected apps
        Function("getSelectedAppCount") { () -> Int in
            let defaults = UserDefaults.standard
            let metadata = defaults.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            NSLog("[LumisScreenTime] getSelectedAppCount: checking standard defaults, found \(metadata.count) items")
            let enabledCount = metadata.filter { ($0["isEnabled"] as? Bool) == true }.count
            NSLog("[LumisScreenTime] getSelectedAppCount: enabled count is \(enabledCount)")
            return enabledCount
        }
        
        // Check if shield is currently active
        Function("isShieldActive") { () -> Bool in
            if #available(iOS 16.0, *) {
                let store = ManagedSettingsStore()
                let hasApps = !(store.shield.applications?.isEmpty ?? true)
                var hasCategories = false
                if let policy = store.shield.applicationCategories {
                    if case .specific(let categories, _) = policy {
                        hasCategories = !categories.isEmpty
                    } else if case .all = policy {
                        hasCategories = true
                    }
                }
                
                if hasApps || hasCategories { return true }
                
                let namedStore = ManagedSettingsStore(named: .init("LumisStore"))
                let hasAppsNamed = !(namedStore.shield.applications?.isEmpty ?? true)
                var hasCategoriesNamed = false
                if let policy = namedStore.shield.applicationCategories {
                    if case .specific(let categories, _) = policy {
                        hasCategoriesNamed = !categories.isEmpty
                    }
                }
                return hasAppsNamed || hasCategoriesNamed
            }
            return false
        }
        
        // Legacy stubs for backwards compatibility
        Function("blockAllApps") { () -> Bool in
            if #available(iOS 15.0, *) {
                NSLog("[LumisScreenTime] blockAllApps called - use activateShield instead")
                return true
            }
            return false
        }
        
        Function("unblockAllApps") { () -> Bool in
            if #available(iOS 15.0, *) {
                let store = ManagedSettingsStore()
                store.shield.applications = nil
                store.shield.applicationCategories = nil
                store.shield.webDomains = nil
                store.shield.webDomainCategories = nil
                NSLog("[LumisScreenTime] unblockAllApps called - shields cleared")
                return true
            }
            return false
        }
        
        Function("areAppsBlocked") { () -> Bool in
            if #available(iOS 15.0, *) {
                let store = ManagedSettingsStore()
                return store.shield.applicationCategories != nil || store.shield.applications != nil
            }
            return false
        }
    }
}
