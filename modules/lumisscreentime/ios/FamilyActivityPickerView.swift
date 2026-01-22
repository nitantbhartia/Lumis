import SwiftUI
import FamilyControls

@available(iOS 16.0, *)
struct FamilyActivityPickerView: View {
    @State private var selection = FamilyActivitySelection()
    @Binding var isPresented: Bool
    var onSelectionComplete: (FamilyActivitySelection) -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color(hex: "FFB347"), Color(hex: "FF8C00")],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                    
                    Text("Choose Apps to Shield")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.primary)
                    
                    Text("These apps will be locked until you complete your morning light session.")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                .padding(.vertical, 24)
                .background(Color(UIColor.systemBackground))
                
                // Apple's FamilyActivityPicker
                FamilyActivityPicker(selection: $selection)
                    .ignoresSafeArea()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                    .foregroundColor(.gray)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        saveSelection()
                        onSelectionComplete(selection)
                        isPresented = false
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color(hex: "FF8C00"))
                }
            }
        }
        .onAppear {
            loadSelection()
        }
    }
    
    private func saveSelection() {
        let encoder = PropertyListEncoder()
        let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
        
        // 1. Save the full selection for system use
        if let data = try? encoder.encode(selection) {
            sharedDefaults?.set(data, forKey: "LumisShieldedApps")
            NSLog("[FamilyActivityPicker] Saved selection with \(selection.applicationTokens.count) apps")
        }
        
        // 2. Extract and save individual app details for the React Native UI
        // This allows us to show a list of toggles in the app
        var appsMetadata: [[String: Any]] = []
        
        // We use applicationTokens directly if we want to be safe, 
        // but getting names requires iterating through the selection.applications
        for app in selection.applications {
            if let tokenData = try? encoder.encode(app.token) {
                appsMetadata.append([
                    "name": app.localizedDisplayName ?? "Unknown App",
                    "token": tokenData,
                    "isEnabled": true
                ])
            }
        }
        
        // Also handle categories if any
        for category in selection.categories {
            if let tokenData = try? encoder.encode(category.token) {
                appsMetadata.append([
                    "name": category.localizedDisplayName ?? "Unknown Category",
                    "token": tokenData,
                    "isEnabled": true,
                    "isCategory": true
                ])
            }
        }
        
        sharedDefaults?.set(appsMetadata, forKey: "LumisAppMetadata")
        NSLog("[FamilyActivityPicker] Saved \(appsMetadata.count) app metadata items for UI")
    }
    
    private func loadSelection() {
        let sharedDefaults = UserDefaults(suiteName: "group.com.nitant.lumis")
        if let data = sharedDefaults?.data(forKey: "LumisShieldedApps"),
           let decoded = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
            selection = decoded
            NSLog("[FamilyActivityPicker] Loaded selection with \(selection.applicationTokens.count) apps from shared group")
        }
    }
}

// Color extension for hex support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// UIKit hosting controller for presenting from React Native
@available(iOS 16.0, *)
class FamilyActivityPickerHostingController: UIHostingController<FamilyActivityPickerWrapper> {
    var onDismiss: (() -> Void)?
    var onSelectionComplete: ((FamilyActivitySelection) -> Void)?
    
    private var selectionModel = SelectionModel()
    
    init() {
        let model = SelectionModel()
        self.selectionModel = model
        
        let wrapper = FamilyActivityPickerWrapper(model: model)
        super.init(rootView: wrapper)
        
        model.onDone = { [weak self] selection in
            // USE THE SELECTION PARAMETER - this is what the SwiftUI view passes
            let appCount = selection.applicationTokens.count
            let catCount = selection.categoryTokens.count
            NSLog("[HostingController] onDone - RECEIVED selection with Apps: \(appCount), Categories: \(catCount)")
            self?.onSelectionComplete?(selection)
            self?.dismiss(animated: true)
        }
        model.onCancel = { [weak self] in
            self?.onDismiss?()
            self?.dismiss(animated: true)
        }
        
        self.modalPresentationStyle = .formSheet
    }
    
    @MainActor required dynamic init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

@available(iOS 16.0, *)
class SelectionModel: ObservableObject {
    @Published var selection = FamilyActivitySelection()
    var onDone: ((FamilyActivitySelection) -> Void)?
    var onCancel: (() -> Void)?
    
    private func getDefaults() -> UserDefaults {
        if let defaults = UserDefaults(suiteName: "group.com.nitant.lumis") {
            return defaults
        }
        return UserDefaults.standard
    }
    
    init() {
        // Load existing selection
        let defaults = UserDefaults.standard // Use standard for now to match Module
        if let data = defaults.data(forKey: "LumisShieldedApps"),
           let decoded = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
            selection = decoded
            print("[SelectionModel] Loaded selection: \(selection.applicationTokens.count) apps")
        }
    }
    
    func save() {
        let defaults = UserDefaults.standard // Use standard for now
        
        // 1. Save raw selection for re-loading the picker next time
        if let data = try? PropertyListEncoder().encode(selection) {
            defaults.set(data, forKey: "LumisShieldedApps")
        }
        
        // 2. Save metadata for UI (JS side)
        // We replicate this here just in case, but the Module also does it.
        // Doing it here ensures the "View" has logic to persist its own state.
        
        var appsMetadata: [[String: Any]] = []
        let encoder = PropertyListEncoder()
        
        print("[SelectionModel] Saving selection: \(selection.applicationTokens.count) apps")
        
        for app in selection.applications {
            if let tokenData = try? encoder.encode(app.token) {
                appsMetadata.append([
                    "name": app.localizedDisplayName ?? "Unknown App",
                    "token": tokenData,
                    "isEnabled": true
                ])
            }
        }
        
        for category in selection.categories {
            if let tokenData = try? encoder.encode(category.token) {
                appsMetadata.append([
                    "name": category.localizedDisplayName ?? "Category",
                    "token": tokenData,
                    "isEnabled": true,
                    "isCategory": true
                ])
            }
        }
        
        defaults.set(appsMetadata, forKey: "LumisAppMetadata")
        defaults.synchronize()
        print("[SelectionModel] Saved \(appsMetadata.count) items to UserDefaults.standard")
    }
}

@available(iOS 16.0, *)
struct FamilyActivityPickerWrapper: View {
    @ObservedObject var model: SelectionModel
    @State private var localSelection = FamilyActivitySelection()
    @State private var showDebugAlert = false
    @State private var debugMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                VStack(spacing: 8) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.orange)
                    
                    Text("Select Apps to Block")
                        .font(.title2.bold())
                    
                    Text("Tap categories or search for specific apps.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.vertical, 20)
                
                FamilyActivityPicker(selection: $localSelection)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        model.onCancel?()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        let appCount = localSelection.applicationTokens.count
                        let catCount = localSelection.categoryTokens.count
                        debugMessage = "Apps: \(appCount), Categories: \(catCount)"
                        
                        // Show debug alert first
                        showDebugAlert = true
                    }
                    .fontWeight(.semibold)
                }
            }
            .alert("Selection Debug", isPresented: $showDebugAlert) {
                Button("OK") {
                    // Now actually save and dismiss
                    model.selection = localSelection
                    model.save()
                    model.onDone?(localSelection)
                }
            } message: {
                Text(debugMessage)
            }
        }
        .onAppear {
            localSelection = model.selection
        }
    }
}
