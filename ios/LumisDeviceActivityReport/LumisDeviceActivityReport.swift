//
//  LumisDeviceActivityReport.swift
//  LumisDeviceActivityReport
//
//  Created by nitant bhartia on 1/28/26.
//

import DeviceActivity
import ExtensionKit
import SwiftUI

@main
struct LumisDeviceActivityReport: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Create a report for each DeviceActivityReport.Context that your app supports.
        TotalActivityReport { totalActivity in
            TotalActivityView(totalActivity: totalActivity)
        }
        // Add more reports here...
    }
}
