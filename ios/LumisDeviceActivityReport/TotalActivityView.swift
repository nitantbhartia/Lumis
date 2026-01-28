//
//  TotalActivityView.swift
//  LumisDeviceActivityReport
//
//  Created by nitant bhartia on 1/28/26.
//

import SwiftUI

struct TotalActivityView: View {
    let totalActivity: String

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.bar.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)

            Text("Lumis Screen Time")
                .font(.title2)
                .fontWeight(.semibold)

            Text(totalActivity)
                .font(.title3)
                .foregroundColor(.primary)

            Text("Activity data synced to main app")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

#Preview {
    TotalActivityView(totalActivity: "1h 23m")
}
