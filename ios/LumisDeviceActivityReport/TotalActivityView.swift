import SwiftUI
import DeviceActivity

struct TotalActivityView: View {
    let activityReport: ActivityReport

    var body: some View {
        // This view is rendered by the system when the report runs
        // We mainly use this to trigger the data collection
        // The actual UI is in React Native
        VStack {
            Text("Screen Time: \(formatDuration(activityReport.totalScreenTime))")
                .font(.headline)
            Text("Focus Score: \(activityReport.focusScore)%")
                .font(.subheadline)
        }
        .padding()
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let totalMinutes = Int(seconds) / 60
        let hours = totalMinutes / 60
        let mins = totalMinutes % 60
        if hours > 0 {
            return "\(hours)h \(mins)m"
        }
        return "\(mins)m"
    }
}
