import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

public class LumisScreenTimeModule: Module {
    private var currentPickerController: UIViewController?
    
    public func definition() -> ModuleDefinition {
        Name("lumisscreentime")

        AsyncFunction("requestAuthorization") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                Task { @MainActor in
                    do {
                        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                        promise.resolve(true)
                    } catch {
                        promise.reject("AUTH_FAILED", error.localizedDescription)
                    }
                }
            } else {
                promise.reject("UNSUPPORTED", "Screen Time requires iOS 16 or later")
            }
        }

        AsyncFunction("getAuthorizationStatus") { (promise: Promise) in
            if #available(iOS 15.0, *) {
                let status = AuthorizationCenter.shared.authorizationStatus
                NSLog("[LumisScreenTime] getAuthorizationStatus: \(status)")
                promise.resolve(status == .approved)
            } else {
                promise.resolve(false)
            }
        }
        
        // Present the FamilyActivityPicker SwiftUI view
        AsyncFunction("showAppPicker") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                Task { @MainActor in
                    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                          let rootVC = windowScene.windows.first?.rootViewController else {
                        promise.reject("NO_ROOT_VC", "Could not find root view controller")
                        return
                    }
                    
                    // Find the topmost presented controller
                    var topVC = rootVC
                    while let presented = topVC.presentedViewController {
                        topVC = presented
                    }
                    
                    let pickerVC = FamilyActivityPickerHostingController()
                    pickerVC.onDismiss = {
                        self.currentPickerController = nil
                    }
                    pickerVC.onSelectionComplete = { selection in
                        NSLog("[LumisScreenTime] Selection complete: \(selection.applicationTokens.count) apps")
                        promise.resolve(true)
                    }
                    
                    self.currentPickerController = pickerVC
                    topVC.present(pickerVC, animated: true)
                }
            } else {
                promise.reject("UNSUPPORTED", "FamilyActivityPicker requires iOS 16 or later")
            }
        }
        
        // Activate shield on selected apps
        Function("activateShield") { () -> Bool in
            if #available(iOS 15.0, *) {
                guard let data = UserDefaults.standard.data(forKey: "LumisShieldedApps"),
                      let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) else {
                    NSLog("[LumisScreenTime] activateShield: No saved selection found")
                    return false
                }
                
                let store = ManagedSettingsStore()
                store.shield.applications = selection.applicationTokens
                store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(selection.categoryTokens)
                
                NSLog("[LumisScreenTime] Shield activated for \(selection.applicationTokens.count) apps and \(selection.categoryTokens.count) categories")
                return true
            }
            return false
        }
        
        // Deactivate all shields (called when session completes)
        Function("deactivateShield") { () -> Bool in
            if #available(iOS 15.0, *) {
                let store = ManagedSettingsStore()
                store.shield.applications = nil
                store.shield.applicationCategories = nil
                store.shield.webDomains = nil
                store.shield.webDomainCategories = nil
                NSLog("[LumisScreenTime] All shields deactivated")
                return true
            }
            return false
        }
        
        // Get count of selected apps
        Function("getSelectedAppCount") { () -> Int in
            if #available(iOS 15.0, *) {
                guard let data = UserDefaults.standard.data(forKey: "LumisShieldedApps"),
                      let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) else {
                    return 0
                }
                return selection.applicationTokens.count + selection.categoryTokens.count
            }
            return 0
        }
        
        // Check if shield is currently active
        Function("isShieldActive") { () -> Bool in
            if #available(iOS 15.0, *) {
                let store = ManagedSettingsStore()
                return store.shield.applications != nil || store.shield.applicationCategories != nil
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
