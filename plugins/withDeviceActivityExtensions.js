const {
  withXcodeProject,
  withEntitlementsPlist,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo Config Plugin to add DeviceActivity extensions to iOS project
 * This ensures extensions survive `npx expo prebuild --clean`
 */
const withDeviceActivityExtensions = (config) => {
  // Add entitlements to main app
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.family-controls"] = true;
    config.modResults["com.apple.security.application-groups"] = [
      "group.com.nitant.lumis",
    ];
    return config;
  });

  // Add extensions to Xcode project
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const appName = config.modRequest.projectName || "Lumis";

    console.log("📱 Adding DeviceActivity extensions to Xcode project...");

    // Extension configurations
    const extensions = [
      {
        name: "LumisShieldExtension",
        type: "com.apple.ManagedSettingsUI.shield-configuration-service",
        principalClass: "ShieldConfigurationExtension",
        files: ["ShieldConfigurationExtension.swift"],
      },
      {
        name: "LumisShieldActionExtension",
        type: "com.apple.ManagedSettingsUI.shield-action-service",
        principalClass: "ShieldActionExtension",
        files: ["ShieldActionExtension.swift"],
      },
      {
        name: "LumisDeviceActivityMonitor",
        type: "com.apple.deviceactivity.monitor-extension",
        principalClass: "DeviceActivityMonitorExtension",
        files: ["DeviceActivityMonitorExtension.swift"],
      },
      {
        name: "LumisDeviceActivityReport",
        type: "com.apple.deviceactivity.report-extension",
        principalClass: "DeviceActivityReportApp",
        files: [
          "DeviceActivityReportExtension.swift",
          "TotalActivityView.swift",
          "TotalActivityReport.swift",
        ],
      },
    ];

    for (const ext of extensions) {
      try {
        // Create extension target
        const target = xcodeProject.addTarget(
          ext.name,
          "app_extension",
          ext.name,
          `${config.modRequest.platformProjectRoot}/${ext.name}`
        );

        if (!target) {
          console.warn(`⚠️  Failed to add target: ${ext.name}`);
          continue;
        }

        console.log(`✅ Added target: ${ext.name}`);

        // Add source files
        const groupKey = xcodeProject.findPBXGroupKey({
          name: ext.name,
        });

        for (const file of ext.files) {
          const filePath = `${ext.name}/${file}`;
          xcodeProject.addSourceFile(
            filePath,
            { target: target.uuid },
            groupKey
          );
        }

        // Add Info.plist
        xcodeProject.addResourceFile(
          `${ext.name}/Info.plist`,
          { target: target.uuid },
          groupKey
        );

        // Add frameworks
        xcodeProject.addFramework("DeviceActivity.framework", {
          target: target.uuid,
          link: true,
        });
        xcodeProject.addFramework("FamilyControls.framework", {
          target: target.uuid,
          link: true,
        });
        xcodeProject.addFramework("ManagedSettings.framework", {
          target: target.uuid,
          link: true,
        });

        if (ext.name.includes("Shield")) {
          xcodeProject.addFramework("ManagedSettingsUI.framework", {
            target: target.uuid,
            link: true,
          });
        }

        // Set build settings
        xcodeProject.updateBuildProperty(
          "PRODUCT_NAME",
          `"${ext.name}"`,
          null,
          target.uuid
        );
        xcodeProject.updateBuildProperty(
          "INFOPLIST_FILE",
          `"${ext.name}/Info.plist"`,
          null,
          target.uuid
        );
        xcodeProject.updateBuildProperty(
          "CODE_SIGN_ENTITLEMENTS",
          `"${ext.name}/${ext.name}.entitlements"`,
          null,
          target.uuid
        );
        xcodeProject.updateBuildProperty(
          "IPHONEOS_DEPLOYMENT_TARGET",
          "16.0",
          null,
          target.uuid
        );
        xcodeProject.updateBuildProperty(
          "TARGETED_DEVICE_FAMILY",
          '"1,2"',
          null,
          target.uuid
        );
        xcodeProject.updateBuildProperty(
          "SWIFT_VERSION",
          "5.0",
          null,
          target.uuid
        );

        // Add to main app dependencies
        const mainTarget = xcodeProject.getTarget(
          "com.apple.product-type.application"
        );
        if (mainTarget) {
          xcodeProject.addTargetDependency(mainTarget.uuid, [target.uuid]);
        }

        // Embed extension
        xcodeProject.addBuildPhase(
          [],
          "PBXCopyFilesBuildPhase",
          "Embed Foundation Extensions",
          mainTarget.uuid,
          "app_extension",
          `"${ext.name}.appex"`
        );
      } catch (error) {
        console.warn(`⚠️  Error adding extension ${ext.name}:`, error.message);
      }
    }

    console.log("✅ DeviceActivity extensions added successfully");

    return config;
  });

  return config;
};

module.exports = withDeviceActivityExtensions;
