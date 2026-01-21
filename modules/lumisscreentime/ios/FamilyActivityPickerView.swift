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
        if let data = try? encoder.encode(selection) {
            UserDefaults.standard.set(data, forKey: "LumisShieldedApps")
            NSLog("[FamilyActivityPicker] Saved selection with \(selection.applicationTokens.count) apps")
        }
    }
    
    private func loadSelection() {
        if let data = UserDefaults.standard.data(forKey: "LumisShieldedApps"),
           let decoded = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
            selection = decoded
            NSLog("[FamilyActivityPicker] Loaded selection with \(selection.applicationTokens.count) apps")
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
class FamilyActivityPickerHostingController: UIHostingController<AnyView> {
    var onDismiss: (() -> Void)?
    var onSelectionComplete: ((FamilyActivitySelection) -> Void)?
    
    init() {
        let view = AnyView(EmptyView())
        super.init(rootView: view)
        
        let pickerView = FamilyActivityPickerView(
            isPresented: Binding(
                get: { true },
                set: { newValue in
                    if !newValue {
                        self.dismiss(animated: true) {
                            self.onDismiss?()
                        }
                    }
                }
            ),
            onSelectionComplete: { selection in
                self.onSelectionComplete?(selection)
            }
        )
        self.rootView = AnyView(pickerView)
        self.modalPresentationStyle = .pageSheet
    }
    
    @MainActor required dynamic init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
