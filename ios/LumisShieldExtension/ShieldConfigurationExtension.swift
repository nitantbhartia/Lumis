import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return buildConfiguration()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return buildConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return buildConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return buildConfiguration()
    }

    private func buildConfiguration() -> ShieldConfiguration {
        let defaults = UserDefaults(suiteName: "group.com.nitant.lumis")

        // Read shared state from main app
        let goalMinutes = defaults?.integer(forKey: "dailyGoalMinutes") ?? 15
        let lightMinutes = defaults?.integer(forKey: "todayLightMinutes") ?? 0
        let remainingMinutes = max(0, goalMinutes - lightMinutes)
        let currentStreak = defaults?.integer(forKey: "currentStreak") ?? 0

        // Build dynamic subtitle based on progress
        let subtitle: String
        if remainingMinutes > 0 {
            if currentStreak > 0 {
                subtitle = "\(remainingMinutes) min of sunlight to unlock\n\(currentStreak) day streak"
            } else {
                subtitle = "\(remainingMinutes) min of sunlight to unlock"
            }
        } else {
            subtitle = "Goal complete! Open Lumis to unlock"
        }

        // Lumis sunrise color palette
        let warmBackground = UIColor(red: 1.0, green: 0.96, blue: 0.92, alpha: 1.0)
        let titleColor = UIColor(red: 0.2, green: 0.15, blue: 0.1, alpha: 1.0)
        let subtitleColor = UIColor(red: 0.45, green: 0.4, blue: 0.35, alpha: 1.0)
        let buttonColor = UIColor(red: 1.0, green: 0.55, blue: 0.25, alpha: 1.0) // Sunrise orange

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterial,
            backgroundColor: warmBackground,
            icon: UIImage(named: "ShieldIcon"),
            title: ShieldConfiguration.Label(
                text: "Get Some Sunlight First",
                color: titleColor
            ),
            subtitle: ShieldConfiguration.Label(
                text: subtitle,
                color: subtitleColor
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open Lumis",
                color: .white
            ),
            primaryButtonBackgroundColor: buttonColor,
            secondaryButtonLabel: nil
        )
    }
}
