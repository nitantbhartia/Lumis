import DeviceActivity
import SwiftUI

@main
struct LumisDeviceActivityReportExtension: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Total screen time report - runs when scheduled
        TotalActivityReport { totalActivity in
            TotalActivityView(activityReport: totalActivity)
        }
    }
}
