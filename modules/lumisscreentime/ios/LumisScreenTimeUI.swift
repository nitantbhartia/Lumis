import SwiftUI
import ExpoModulesCore
import FamilyControls
import ManagedSettings

// MARK: - Native GUI Components (SwiftUI Based)

public struct LumisIconProps: Record {
  public init() {}
  @Field public var tokenData: String?
  @Field public var appName: String?
  @Field public var isCategory: Bool = false
  @Field public var variant: String = "icon"
  @Field public var size: Double = 40.0
  @Field public var grayscale: Bool = true
}

public class LumisIconView: ExpoView {
  let hostingController = UIHostingController(rootView: AnyView(EmptyView()))
  public var lastProps = FlatLumisProps()
  public struct FlatLumisProps {
      public var tokenData: String?; public var appName: String?; public var isCategory: Bool = false
      public var variant: String = "icon"; public var size: Double = 40.0; public var grayscale: Bool = false
      public init() {}
  }
  public func updateFromProps() {
      update(tokenData: lastProps.tokenData, name: lastProps.appName, isCategory: lastProps.isCategory, 
             variant: lastProps.variant, size: lastProps.size, grayscale: lastProps.grayscale)
  }
  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    hostingController.view.backgroundColor = .clear 
    addSubview(hostingController.view)
  }
  public override func layoutSubviews() { super.layoutSubviews(); hostingController.view.frame = bounds }
  public func update(tokenData: String?, name: String?, isCategory: Bool, variant: String, size: Double, grayscale: Bool) {
    let decoder = JSONDecoder()
    var finalToken: Any? = nil
    if let base64Data = tokenData, let data = Data(base64Encoded: base64Data) {
        if isCategory { finalToken = try? decoder.decode(ActivityCategoryToken.self, from: data) }
        else { finalToken = try? decoder.decode(ApplicationToken.self, from: data) }
    }
    hostingController.rootView = AnyView(
        IconContainer(token: finalToken, size: size, grayscale: grayscale, variant: variant, isCategory: isCategory, fallbackName: name ?? "App")
    )
  }
}

struct IconContainer: View {
  let token: Any?; let size: Double; let grayscale: Bool; let variant: String
  let isCategory: Bool; let fallbackName: String
  var body: some View {
      renderContent().grayscale(grayscale ? 1.0 : 0.0).frame(maxWidth: .infinity)
  }
  func renderContent() -> AnyView {
      if let appToken = token as? ApplicationToken {
          return AnyView(Label(appToken).labelStyle(variant == "title" ? AnyLabelStyle(titleOnly: true) : AnyLabelStyle(titleOnly: false)).font(.system(size: 11, weight: .bold)))
      } else if let catToken = token as? ActivityCategoryToken {
          return AnyView(Label(catToken).labelStyle(variant == "title" ? AnyLabelStyle(titleOnly: true) : AnyLabelStyle(titleOnly: false)).font(.system(size: 11, weight: .bold)))
      } else {
          if variant == "title" { return AnyView(SwiftUI.Text(fallbackName).font(.system(size: 11, weight: .medium)).foregroundColor(.white)) }
          else { return AnyView(ZStack { RoundedRectangle(cornerRadius: size * 0.22).fill(Color.white.opacity(0.1)); Image(systemName: isCategory ? "folder.fill" : "shield").foregroundColor(.white.opacity(0.6)) }.frame(width: size, height: size)) }
      }
  }
}

struct AnyLabelStyle: LabelStyle {
    let titleOnly: Bool
    func makeBody(configuration: Configuration) -> some View {
        if titleOnly { configuration.title.foregroundColor(.white).lineLimit(1) }
        else { configuration.icon }
    }
}

struct PickerWrapper: View {
    @State var selection: FamilyActivitySelection
    var onSelectionComplete: ((FamilyActivitySelection) -> Void)
    var onDismiss: (() -> Void)
    init(selection: FamilyActivitySelection, onSelectionComplete: @escaping (FamilyActivitySelection) -> Void, onDismiss: @escaping () -> Void) {
        self._selection = State(initialValue: selection)
        self.onSelectionComplete = onSelectionComplete
        self.onDismiss = onDismiss
    }
    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { onDismiss() } }
                    ToolbarItem(placement: .confirmationAction) { Button("Done") { onSelectionComplete(selection) } }
                }
                .navigationTitle("Select Apps").navigationBarTitleDisplayMode(.inline)
        }
    }
}

public class FamilyActivityPickerHostingController: UIViewController {
    public var onSelectionComplete: ((FamilyActivitySelection) -> Void)?
    public var onDismiss: (() -> Void)?
    public var initialSelection: FamilyActivitySelection?
    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        let wrapper = PickerWrapper(selection: initialSelection ?? FamilyActivitySelection(), onSelectionComplete: { [weak self] sel in self?.onSelectionComplete?(sel); self?.dismiss(animated: true) }, onDismiss: { [weak self] in self?.onDismiss?(); self?.dismiss(animated: true) })
        let hostingController = UIHostingController(rootView: wrapper)
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.frame = view.bounds
        hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]; hostingController.didMove(toParent: self)
    }
}
