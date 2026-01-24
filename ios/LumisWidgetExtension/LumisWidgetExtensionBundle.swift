//
//  LumisWidgetExtensionBundle.swift
//  LumisWidgetExtension
//
//  Created by nitant bhartia on 1/24/26.
//

import WidgetKit
import SwiftUI

@main
struct LumisWidgetExtensionBundle: WidgetBundle {
    var body: some Widget {
        LumisWidgetExtensionLiveActivity()
        if #available(iOS 17.0, *) {
            LumisWidgetExtension()
        }
        if #available(iOS 18.0, *) {
            LumisWidgetExtensionControl()
        }
    }
}
