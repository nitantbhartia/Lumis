import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Activity Attributes

@available(iOS 16.1, *)
public struct LumisTrackingAttributes: ActivityAttributes {
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

// MARK: - Live Activity Manager

@available(iOS 16.1, *)
public class LumisLiveActivityManager {
    public static let shared = LumisLiveActivityManager()
    private var currentActivity: Activity<LumisTrackingAttributes>?

    private init() {}

    public func startActivity(goalMinutes: Int, remainingSeconds: Int, luxLevel: Int) -> String? {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("[LumisLiveActivity] Activities not enabled")
            return nil
        }

        // End any existing activity first
        endActivity()

        let attributes = LumisTrackingAttributes(goalMinutes: goalMinutes)
        let initialState = LumisTrackingAttributes.ContentState(
            remainingSeconds: remainingSeconds,
            luxLevel: luxLevel,
            creditRate: 1.0,
            isIndoors: false
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialState, staleDate: nil),
                pushType: nil
            )
            currentActivity = activity
            print("[LumisLiveActivity] Started activity: \(activity.id)")
            return activity.id
        } catch {
            print("[LumisLiveActivity] Failed to start: \(error)")
            return nil
        }
    }

    public func updateActivity(remainingSeconds: Int, luxLevel: Int, creditRate: Double, isIndoors: Bool) {
        guard let activity = currentActivity else {
            print("[LumisLiveActivity] No active activity to update")
            return
        }

        let updatedState = LumisTrackingAttributes.ContentState(
            remainingSeconds: remainingSeconds,
            luxLevel: luxLevel,
            creditRate: creditRate,
            isIndoors: isIndoors
        )

        Task {
            await activity.update(
                ActivityContent(state: updatedState, staleDate: Date().addingTimeInterval(60))
            )
        }
    }

    public func endActivity() {
        guard let activity = currentActivity else { return }

        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
            print("[LumisLiveActivity] Ended activity: \(activity.id)")
        }
        currentActivity = nil
    }

    public func isActivityActive() -> Bool {
        return currentActivity != nil
    }
}

// MARK: - Fallback for older iOS versions

public class LumisLiveActivityManagerFallback {
    public static let shared = LumisLiveActivityManagerFallback()
    private init() {}

    public func startActivity(goalMinutes: Int, remainingSeconds: Int, luxLevel: Int) -> String? {
        print("[LumisLiveActivity] Live Activities not available on this iOS version")
        return nil
    }

    public func updateActivity(remainingSeconds: Int, luxLevel: Int, creditRate: Double, isIndoors: Bool) {}
    public func endActivity() {}
    public func isActivityActive() -> Bool { return false }
}
