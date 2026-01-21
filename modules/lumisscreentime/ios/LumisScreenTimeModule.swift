import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class LumisScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("lumisscreentime")

    Function("hello") { () -> String in
      return "Hello from LumisScreenTime (Native)"
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      if #available(iOS 15.0, *) {
        Task { @MainActor in
          do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            promise.resolve(true)
          } catch {
            promise.reject("AUTH_FAILED", error.localizedDescription)
          }
        }
      } else {
        promise.resolve(false)
      }
    }
    
    Function("blockAllApps") { () -> Bool in
      if #available(iOS 15.0, *) {
        ManagedSettingsStore().shield.applications = .all()
        ManagedSettingsStore().shield.applicationCategories = .all()
        return true
      }
      return false
    }
    
    Function("unblockAllApps") { () -> Bool in
      if #available(iOS 15.0, *) {
        ManagedSettingsStore().shield.applications = nil
        ManagedSettingsStore().shield.applicationCategories = nil
        return true
      }
      return false
    }
    
    Function("areAppsBlocked") { () -> Bool in
      if #available(iOS 15.0, *) {
        return ManagedSettingsStore().shield.applications != nil
      }
      return false
    }
  }
}
