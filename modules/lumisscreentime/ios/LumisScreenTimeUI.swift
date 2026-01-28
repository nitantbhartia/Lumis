import SwiftUI
import ExpoModulesCore
import FamilyControls
import ManagedSettings
import DeviceActivity

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

// MARK: - Device Activity Report View

/// A native view that embeds the DeviceActivityReport to trigger data collection.
/// When this view is rendered, iOS automatically runs the report extension and populates data.
@available(iOS 16.0, *)
public class DeviceActivityReportView: ExpoView {
    private var hostingController: UIHostingController<AnyView>?
    private var currentFilter: DeviceActivityFilter?

    public required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        backgroundColor = .clear
        setupDefaultReport()
    }

    private func setupDefaultReport() {
        // Create a filter for today's activity
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? now

        let filter = DeviceActivityFilter(
            segment: .daily(during: DateInterval(start: startOfDay, end: endOfDay))
        )

        updateReport(with: filter)
    }

    public func updateReport(with filter: DeviceActivityFilter) {
        currentFilter = filter

        // Remove existing hosting controller
        hostingController?.view.removeFromSuperview()
        hostingController?.removeFromParent()

        // Create the DeviceActivityReport view
        let reportView = DeviceActivityReport(
            DeviceActivityReport.Context(rawValue: "Total Activity"),
            filter: filter
        )

        let wrappedView = AnyView(
            reportView
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.clear)
        )

        hostingController = UIHostingController(rootView: wrappedView)
        hostingController?.view.backgroundColor = .clear

        if let hc = hostingController {
            addSubview(hc.view)
            hc.view.frame = bounds
            hc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        }
    }

    public func setDateRange(startDate: Date, endDate: Date) {
        let filter = DeviceActivityFilter(
            segment: .daily(during: DateInterval(start: startDate, end: endDate))
        )
        updateReport(with: filter)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        hostingController?.view.frame = bounds
    }
}

/// Props for DeviceActivityReportView
public struct DeviceActivityReportProps: Record {
    public init() {}
    @Field public var startDate: Double? // Unix timestamp in ms
    @Field public var endDate: Double?   // Unix timestamp in ms
}

/// ExpoView wrapper for React Native
@available(iOS 16.0, *)
public class LumisActivityReportView: ExpoView {
    private let reportView: DeviceActivityReportView

    public required init(appContext: AppContext? = nil) {
        reportView = DeviceActivityReportView(appContext: appContext)
        super.init(appContext: appContext)
        backgroundColor = .clear
        addSubview(reportView)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        reportView.frame = bounds
    }

    public func updateDateRange(startTimestamp: Double?, endTimestamp: Double?) {
        let calendar = Calendar.current
        let now = Date()

        let startDate: Date
        let endDate: Date

        if let start = startTimestamp {
            startDate = Date(timeIntervalSince1970: start / 1000)
        } else {
            startDate = calendar.startOfDay(for: now)
        }

        if let end = endTimestamp {
            endDate = Date(timeIntervalSince1970: end / 1000)
        } else {
            endDate = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now)) ?? now
        }

        reportView.setDateRange(startDate: startDate, endDate: endDate)
    }
}

// MARK: - Device Activity Report Hosting Controller for Background Refresh

/// A UIViewController that hosts a DeviceActivityReport view to trigger data collection.
/// Present this view controller (hidden) to cause iOS to run the report extension.
@available(iOS 16.0, *)
public class DeviceActivityReportHostingController: UIViewController {
    public var onDataCollected: (() -> Void)?
    private var hostingController: UIHostingController<AnyView>?

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        view.isHidden = true

        // Create a filter for today's activity
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? now

        let filter = DeviceActivityFilter(
            segment: .daily(during: DateInterval(start: startOfDay, end: endOfDay))
        )

        // Create the DeviceActivityReport view - this triggers the extension
        let reportView = DeviceActivityReport(
            DeviceActivityReport.Context(rawValue: "Total Activity"),
            filter: filter
        )

        let wrappedView = AnyView(
            reportView
                .frame(width: 1, height: 1) // Minimal size since it's hidden
                .opacity(0)
        )

        hostingController = UIHostingController(rootView: wrappedView)
        hostingController?.view.backgroundColor = .clear
        hostingController?.view.isHidden = true

        if let hc = hostingController {
            addChild(hc)
            view.addSubview(hc.view)
            hc.view.frame = CGRect(x: 0, y: 0, width: 1, height: 1)
            hc.didMove(toParent: self)
        }

        // The report extension runs when the view appears
        // Give it time to collect data, then call the completion handler
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.onDataCollected?()
        }
    }
}
