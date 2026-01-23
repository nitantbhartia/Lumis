import ExpoModulesCore
import ManagedSettings
import SwiftUI
import FamilyControls

// MARK: - Models & Helpers

extension FamilyActivitySelection {
    var displayNames: [String] {
        var names: [String] = []
        for app in self.applications {
            if let name = app.localizedDisplayName { names.append(name) }
        }
        for category in self.categories {
            if let name = category.localizedDisplayName { names.append(name) }
        }
        return names.isEmpty ? ["Shielded App"] : names
    }
}

struct LumisIconProps: Record {
  @Field var tokenData: Data?
  @Field var isCategory: Bool = false
  @Field var size: Double = 40.0
  @Field var grayscale: Bool = true
}

// MARK: - Native Views

class LumisIconView: ExpoView {
  let hostingController = UIHostingController(rootView: AnyView(EmptyView()))
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    hostingController.view.backgroundColor = .clear
    addSubview(hostingController.view)
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    hostingController.view.frame = bounds
  }
  
  func update(props: LumisIconProps) {
    let decoder = PropertyListDecoder()
    
    if props.isCategory {
      if let data = props.tokenData,
         let token = try? decoder.decode(ActivityCategoryToken.self, from: data) {
         let selection = FamilyActivitySelection(categoryTokens: [token])
         hostingController.rootView = AnyView(
           IconContainer(selection: selection, size: props.size, grayscale: props.grayscale)
         )
      }
    } else {
      if let data = props.tokenData,
         let token = try? decoder.decode(ApplicationToken.self, from: data) {
         let selection = FamilyActivitySelection(applicationTokens: [token])
         hostingController.rootView = AnyView(
           IconContainer(selection: selection, size: props.size, grayscale: props.grayscale)
         )
      }
    }
  }
}

struct IconContainer: View {
  let selection: FamilyActivitySelection
  let size: Double
  let grayscale: Bool
  
  var body: some View {
    ZStack {
      Label(selection)
        .labelStyle(.iconOnly)
        .scaleEffect(size / 32.0)
        .frame(width: size, height: size)
        .grayscale(grayscale ? 1.0 : 0.0)
    }
    .frame(width: size, height: size)
  }
}

// Controller for the system app picker
class FamilyActivityPickerHostingController: UIViewController {
    var onSelectionComplete: ((FamilyActivitySelection) -> Void)?
    var onDismiss: (() -> Void)?
    
    private var selection = FamilyActivitySelection()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        
        let picker = FamilyActivityPicker(selection: $selection)
        let hostingController = UIHostingController(rootView: picker)
        
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.frame = view.bounds
        hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        hostingController.didMove(toParent: self)
        
        // Add Done/Cancel buttons
        let navBar = UINavigationBar(frame: CGRect(x: 0, y: 0, width: view.frame.width, height: 44))
        let navItem = UINavigationItem(title: "Select Apps")
        navItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(doneAction))
        navItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .cancel, target: self, action: #selector(cancelAction))
        navBar.setItems([navItem], animated: false)
        view.addSubview(navBar)
    }
    
    @objc func doneAction() {
        onSelectionComplete?(selection)
        dismiss(animated: true)
    }
    
    @objc func cancelAction() {
        onDismiss?()
        dismiss(animated: true)
    }
}

// MARK: - Main Module

public class LumisScreenTimeModule: Module {
    private var currentPickerController: UIViewController?
    
    private func getDefaults() -> UserDefaults? {
        return UserDefaults.standard
    }

    public func definition() -> ModuleDefinition {
        Name("lumisscreentime")

        Function("hello") { () -> String in
            return "Lumis Screen Time Module is Active!"
        }

        AsyncFunction("requestAuthorization") { () async throws -> Bool in
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                return AuthorizationCenter.shared.authorizationStatus == .approved
            } catch {
                return false
            }
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
                while let presented = topVC.presentedViewController {
                    topVC = presented
                }
                
                let pickerVC = FamilyActivityPickerHostingController()
                pickerVC.modalPresentationStyle = .formSheet
                pickerVC.onDismiss = {
                    promise.resolve(false)
                }
                pickerVC.onSelectionComplete = { selection in
                    let encoder = PropertyListEncoder()
                    var metadata: [[String: Any]] = []
                    var toggles: [[String: Any]] = []
                    
                    for app in selection.applications {
                        if let tokenData = try? encoder.encode(app.token) {
                            let item: [String: Any] = ["name": app.localizedDisplayName ?? "Shielded App", "isEnabled": true, "isCategory": false, "token": tokenData]
                            metadata.append(item)
                            // var jsItem = item; jsItem.removeValue(forKey: "token"); toggles.append(jsItem)
                            toggles.append(item)
                        }
                    }
                    
                    for category in selection.categories {
                        if let tokenData = try? encoder.encode(category.token) {
                            let item: [String: Any] = ["name": category.localizedDisplayName ?? "Category", "isEnabled": true, "isCategory": true, "token": tokenData]
                            metadata.append(item)
                            // var jsItem = item; jsItem.removeValue(forKey: "token"); toggles.append(jsItem)
                            toggles.append(item)
                        }
                    }
                    
                    self.getDefaults()?.set(metadata, forKey: "LumisAppMetadata")
                    promise.resolve(["success": true, "count": metadata.count, "toggles": toggles])
                }
                
                topVC.present(pickerVC, animated: true)
            }
        }

        Function("getAppToggles") { () -> [[String: Any]] in
            let metadata = self.getDefaults()?.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            return metadata.map { item in
                var newItem = item
                // newItem.removeValue(forKey: "token")
                return newItem
            }
        }
        
        Function("toggleApp") { (name: String, enabled: Bool) -> Bool in
            var metadata = self.getDefaults()?.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            for i in 0..<metadata.count {
                if metadata[i]["name"] as? String == name {
                    metadata[i]["isEnabled"] = enabled
                    self.getDefaults()?.set(metadata, forKey: "LumisAppMetadata")
                    return true
                }
            }
            return false
        }

        Function("activateShield") { () -> Bool in
            let metadata = self.getDefaults()?.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
            let decoder = PropertyListDecoder()
            var appTokens = Set<ApplicationToken>()
            var categoryTokens = Set<ActivityCategoryToken>()
            
            for item in metadata {
                guard let isEnabled = item["isEnabled"] as? Bool, isEnabled,
                      let tokenData = item["token"] as? Data else { continue }
                
                if item["isCategory"] as? Bool == true {
                    if let token = try? decoder.decode(ActivityCategoryToken.self, from: tokenData) { categoryTokens.insert(token) }
                } else {
                    if let token = try? decoder.decode(ApplicationToken.self, from: tokenData) { appTokens.insert(token) }
                }
            }
            
            let store = ManagedSettingsStore()
            store.shield.applications = appTokens.isEmpty ? nil : appTokens
            store.shield.applicationCategories = categoryTokens.isEmpty ? nil : .specific(categoryTokens)
            return true
        }
        
        Function("deactivateShield") { () -> Bool in
            let store = ManagedSettingsStore()
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            return true
        }
        
        Function("getSelectedAppCount") { () -> Int in
            let metadata = self.getDefaults()?.array(forKey: "LumisAppMetadata") as? [[String: Any]] ?? []
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
            Prop("iconProps") { (view: LumisIconView, props: LumisIconProps) in
                view.update(props: props)
            }
        }
    }
}
