import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class LumisScreenTimeModule: Module {
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
    
    // NOTE: Full app blocking requires FamilyActivityPicker (SwiftUI) to obtain ApplicationTokens.
    // This stub implementation will be replaced with a full SwiftUI flow later.
    Function("blockAllApps") { () -> Bool in
      if #available(iOS 15.0, *) {
        NSLog("[LumisScreenTime] blockAllApps called (stub implementation)")
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
        return store.shield.applicationCategories != nil
      }
      return false
    }
  }
}
