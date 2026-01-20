import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class LumisScreenTimeModule: Module {
  private let store = ManagedSettingsStore()
  
  public func definition() -> ModuleDefinition {
    Name("LumisScreenTime")

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      if #available(iOS 16.0, *) {
        Task { @MainActor in
          do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            promise.resolve(true)
          } catch {
            print("[LumisScreenTime] Authorization error: \(error)")
            promise.reject("AUTH_FAILED", "Screen Time authorization failed: \(error.localizedDescription)")
          }
        }
      } else if #available(iOS 15.0, *) {
        Task {
          do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            promise.resolve(true)
          } catch {
            print("[LumisScreenTime] Authorization error: \(error)")
            promise.reject("AUTH_FAILED", "Screen Time authorization failed: \(error.localizedDescription)")
          }
        }
      } else {
        promise.reject("UNSUPPORTED", "iOS 15+ required for Screen Time features")
      }
    }
    
    // Block all apps (shield them)
    Function("blockAllApps") {
      if #available(iOS 15.0, *) {
        // Block all applications
        self.store.shield.applications = .all()
        self.store.shield.applicationCategories = .all()
        print("[LumisScreenTime] All apps blocked")
        return true
      }
      return false
    }
    
    // Unblock all apps (remove shields)
    Function("unblockAllApps") {
      if #available(iOS 15.0, *) {
        self.store.shield.applications = nil
        self.store.shield.applicationCategories = nil
        print("[LumisScreenTime] All apps unblocked")
        return true
      }
      return false
    }
    
    // Check if apps are currently blocked
    Function("areAppsBlocked") { () -> Bool in
      if #available(iOS 15.0, *) {
        return self.store.shield.applications != nil || self.store.shield.applicationCategories != nil
      }
      return false
    }
  }
}
