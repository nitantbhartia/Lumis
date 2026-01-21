import DeviceActivity
import ManagedSettings
import ManagedSettingsUI
import UIKit

/// Custom shield configuration that appears when users try to open blocked apps.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return createLumisShieldConfiguration()
    }
    
    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return createLumisShieldConfiguration()
    }
    
    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return createLumisShieldConfiguration()
    }
    
    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return createLumisShieldConfiguration()
    }
    
    private func createLumisShieldConfiguration() -> ShieldConfiguration {
        // Lumis brand colors
        let backgroundColor = UIColor(red: 26/255, green: 26/255, blue: 46/255, alpha: 1) // #1A1A2E
        let amberColor = UIColor(red: 255/255, green: 179/255, blue: 71/255, alpha: 1) // #FFB347
        
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: backgroundColor,
            icon: nil,
            title: ShieldConfiguration.Label(
                text: "Morning Light Mission",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Get 16 minutes of sunlight to unlock your day.\nYour circadian clock is waiting.",
                color: UIColor.white.withAlphaComponent(0.7)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open Lumis",
                color: backgroundColor
            ),
            primaryButtonBackgroundColor: amberColor,
            secondaryButtonLabel: nil
        )
    }
}
