//
//  ShieldConfigurationExtension.swift
//  LumisShieldExtension
//
//  Created by nitant bhartia on 1/28/26.
//

import ManagedSettings
import ManagedSettingsUI
import UIKit

// Lumis custom shield configuration with brand colors and dynamic progress
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
        // Read current progress from App Group shared defaults
        let defaults = UserDefaults(suiteName: "group.com.nitant.lumis")
        let goalMinutes = defaults?.integer(forKey: "dailyGoalMinutes") ?? 15
        let lightMinutes = defaults?.integer(forKey: "todayLightMinutes") ?? 0
        let currentStreak = defaults?.integer(forKey: "currentStreak") ?? 0

        let remainingMinutes = max(0, goalMinutes - lightMinutes)
        let isGoalComplete = lightMinutes >= goalMinutes

        // Sunrise color palette matching Lumis brand
        let backgroundColor = UIColor(red: 1.0, green: 0.96, blue: 0.92, alpha: 1.0) // #FFF5EB
        let titleColor = UIColor(red: 1.0, green: 0.55, blue: 0.25, alpha: 1.0) // #FF8D40
        let subtitleColor = UIColor(red: 0.45, green: 0.35, blue: 0.25, alpha: 1.0) // Warm brown
        let buttonColor = UIColor(red: 1.0, green: 0.55, blue: 0.25, alpha: 1.0) // #FF8D40

        // Dynamic messaging based on progress
        let titleText: String
        let subtitleText: String

        if isGoalComplete {
            titleText = "Daily Goal Complete! ☀️"
            subtitleText = currentStreak > 0 ? "🔥 \(currentStreak) day streak!" : "Great work today!"
        } else {
            titleText = "Get Some Sunlight First ☀️"
            subtitleText = "\(remainingMinutes) min of sunlight to unlock"
        }

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterial,
            backgroundColor: backgroundColor,
            icon: nil,
            title: ShieldConfiguration.Label(
                text: titleText,
                color: titleColor
            ),
            subtitle: ShieldConfiguration.Label(
                text: subtitleText,
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
