//
//  LumisWidgetExtensionLiveActivity.swift
//  LumisWidgetExtension
//
//  Created by nitant bhartia on 1/24/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes (must match main app's LumisLiveActivity.swift)

struct LumisTrackingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var remainingSeconds: Int
        public var luxLevel: Int
        public var creditRate: Double
        public var isIndoors: Bool

        public init(remainingSeconds: Int, luxLevel: Int, creditRate: Double, isIndoors: Bool) {
            self.remainingSeconds = remainingSeconds
            self.luxLevel = luxLevel
            self.creditRate = creditRate
            self.isIndoors = isIndoors
        }
    }

    public var goalMinutes: Int
    public var startTime: Date

    public init(goalMinutes: Int, startTime: Date = Date()) {
        self.goalMinutes = goalMinutes
        self.startTime = startTime
    }
}

// MARK: - Live Activity Widget

struct LumisWidgetExtensionLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LumisTrackingAttributes.self) { context in
            // Lock Screen / Banner UI
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 4) {
                        Image(systemName: context.state.isIndoors ? "house.fill" : "sun.max.fill")
                            .foregroundColor(context.state.isIndoors ? .orange : .yellow)
                            .font(.system(size: 20))
                        Text("\(context.state.luxLevel)")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundColor(.white)
                        Text("lux")
                            .font(.system(size: 10))
                            .foregroundColor(.white.opacity(0.7))
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 2) {
                        if context.state.creditRate < 1.0 {
                            Text("0.5x")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.orange)
                        }
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(formatTime(context.state.remainingSeconds))
                            .font(.system(size: 32, weight: .light, design: .rounded))
                            .foregroundColor(.white)
                            .monospacedDigit()
                        Text("remaining")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(0.6))
                            .textCase(.uppercase)
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    // Progress bar
                    let progress = 1.0 - (Double(context.state.remainingSeconds) / Double(context.attributes.goalMinutes * 60))
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.white.opacity(0.2))
                                .frame(height: 6)

                            RoundedRectangle(cornerRadius: 4)
                                .fill(
                                    LinearGradient(
                                        colors: context.state.isIndoors
                                            ? [Color.orange, Color.orange.opacity(0.7)]
                                            : [Color.yellow, Color.orange],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: max(0, geo.size.width * progress), height: 6)
                        }
                    }
                    .frame(height: 6)
                    .padding(.horizontal, 8)
                    .padding(.top, 8)
                }
            } compactLeading: {
                // Compact leading - sun icon
                Image(systemName: context.state.isIndoors ? "house.fill" : "sun.max.fill")
                    .foregroundColor(context.state.isIndoors ? .orange : .yellow)
                    .font(.system(size: 14))
            } compactTrailing: {
                // Compact trailing - time remaining
                Text(formatTimeCompact(context.state.remainingSeconds))
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                    .monospacedDigit()
            } minimal: {
                // Minimal - just sun icon with progress
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.3), lineWidth: 2)
                    Circle()
                        .trim(from: 0, to: 1.0 - (Double(context.state.remainingSeconds) / Double(context.attributes.goalMinutes * 60)))
                        .stroke(context.state.isIndoors ? Color.orange : Color.yellow, lineWidth: 2)
                        .rotationEffect(.degrees(-90))
                    Image(systemName: "sun.max.fill")
                        .foregroundColor(context.state.isIndoors ? .orange : .yellow)
                        .font(.system(size: 10))
                }
            }
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%d:%02d", mins, secs)
    }

    private func formatTimeCompact(_ seconds: Int) -> String {
        let mins = seconds / 60
        if mins > 0 {
            return "\(mins)m"
        }
        return "\(seconds)s"
    }
}

// MARK: - Lock Screen View

struct LockScreenView: View {
    let context: ActivityViewContext<LumisTrackingAttributes>

    var body: some View {
        HStack(spacing: 16) {
            // Left: Sun icon with lux
            VStack(spacing: 4) {
                Image(systemName: context.state.isIndoors ? "house.fill" : "sun.max.fill")
                    .font(.system(size: 28))
                    .foregroundColor(context.state.isIndoors ? .orange : .yellow)

                Text("\(context.state.luxLevel) lux")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .frame(width: 70)

            // Center: Timer
            VStack(spacing: 2) {
                Text(formatTime(context.state.remainingSeconds))
                    .font(.system(size: 36, weight: .light, design: .rounded))
                    .monospacedDigit()

                HStack(spacing: 4) {
                    Text("remaining")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    if context.state.creditRate < 1.0 {
                        Text("(0.5x)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.orange)
                    }
                }
            }
            .frame(maxWidth: .infinity)

            // Right: Progress ring
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 4)

                let progress = 1.0 - (Double(context.state.remainingSeconds) / Double(context.attributes.goalMinutes * 60))
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        LinearGradient(
                            colors: context.state.isIndoors
                                ? [.orange, .red]
                                : [.yellow, .orange],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 4, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))

                Text("\(Int(progress * 100))%")
                    .font(.system(size: 12, weight: .semibold))
            }
            .frame(width: 50, height: 50)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            LinearGradient(
                colors: [
                    Color(red: 0.56, green: 0.64, blue: 0.78).opacity(0.95),
                    Color(red: 0.95, green: 0.65, blue: 0.46).opacity(0.95)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }

    private func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%d:%02d", mins, secs)
    }
}

// MARK: - Preview

extension LumisTrackingAttributes {
    fileprivate static var preview: LumisTrackingAttributes {
        LumisTrackingAttributes(goalMinutes: 20)
    }
}

extension LumisTrackingAttributes.ContentState {
    fileprivate static var outdoors: LumisTrackingAttributes.ContentState {
        LumisTrackingAttributes.ContentState(
            remainingSeconds: 720,
            luxLevel: 8500,
            creditRate: 1.0,
            isIndoors: false
        )
    }

    fileprivate static var indoors: LumisTrackingAttributes.ContentState {
        LumisTrackingAttributes.ContentState(
            remainingSeconds: 420,
            luxLevel: 350,
            creditRate: 0.5,
            isIndoors: true
        )
    }
}

@available(iOS 18.0, *)
#Preview("Notification", as: .content, using: LumisTrackingAttributes.preview) {
    LumisWidgetExtensionLiveActivity()
} contentStates: {
    LumisTrackingAttributes.ContentState.outdoors
    LumisTrackingAttributes.ContentState.indoors
}
