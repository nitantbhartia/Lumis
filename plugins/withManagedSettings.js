const { withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Config plugin to add ManagedSettings framework and Family Controls entitlement
 */
const withManagedSettings = (config) => {
    // 1. Add frameworks to Xcode project
    config = withXcodeProject(config, (config) => {
        const xcodeProject = config.modResults;

        // Add ManagedSettings.framework
        xcodeProject.addFramework('ManagedSettings.framework', {
            customFramework: false,
            weak: true
        });
        // Add FamilyControls.framework
        xcodeProject.addFramework('FamilyControls.framework', {
            customFramework: false,
            weak: true
        });
        // Add DeviceActivity.framework
        xcodeProject.addFramework('DeviceActivity.framework', {
            customFramework: false,
            weak: true
        });

        return config;
    });

    // 2. Add Family Controls entitlement
    config = withEntitlementsPlist(config, (config) => {
        config.modResults['com.apple.developer.family-controls'] = true;
        return config;
    });

    return config;
};

module.exports = withManagedSettings;
