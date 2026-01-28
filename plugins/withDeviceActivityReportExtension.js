const {
    withXcodeProject,
    withInfoPlist,
    IOSConfig,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const EXTENSION_NAME = 'LumisDeviceActivityReport';
const EXTENSION_BUNDLE_ID_SUFFIX = 'DeviceActivityReport';

/**
 * Config plugin to add DeviceActivityReport extension for Screen Time data collection
 */
const withDeviceActivityReportExtension = (config) => {
    config = withXcodeProject(config, async (config) => {
        const xcodeProject = config.modResults;
        const projectRoot = config.modRequest.projectRoot;
        const platformProjectRoot = config.modRequest.platformProjectRoot;

        const bundleIdentifier = config.ios?.bundleIdentifier || 'com.nitant.lumis';
        const extensionBundleId = `${bundleIdentifier}.${EXTENSION_BUNDLE_ID_SUFFIX}`;

        // Paths
        const extensionSourcePath = path.join(projectRoot, 'ios', EXTENSION_NAME);
        const targetPath = path.join(platformProjectRoot, EXTENSION_NAME);

        // Check if extension source files exist
        if (!fs.existsSync(extensionSourcePath)) {
            console.warn(`[withDeviceActivityReportExtension] Extension source not found at ${extensionSourcePath}`);
            return config;
        }

        // Copy extension files if needed
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }

        // Copy all Swift files
        const files = fs.readdirSync(extensionSourcePath);
        for (const file of files) {
            const srcPath = path.join(extensionSourcePath, file);
            const destPath = path.join(targetPath, file);
            fs.copyFileSync(srcPath, destPath);
        }

        // Generate a unique target ID
        const targetUuid = xcodeProject.generateUuid();
        const productUuid = xcodeProject.generateUuid();
        const buildConfigListUuid = xcodeProject.generateUuid();
        const debugConfigUuid = xcodeProject.generateUuid();
        const releaseConfigUuid = xcodeProject.generateUuid();
        const sourcesBuildPhaseUuid = xcodeProject.generateUuid();
        const frameworksBuildPhaseUuid = xcodeProject.generateUuid();
        const resourcesBuildPhaseUuid = xcodeProject.generateUuid();
        const containerItemProxyUuid = xcodeProject.generateUuid();
        const targetDependencyUuid = xcodeProject.generateUuid();
        const copyFilesBuildPhaseUuid = xcodeProject.generateUuid();

        // Find the main app target
        const mainTarget = xcodeProject.getFirstTarget();
        if (!mainTarget) {
            console.error('[withDeviceActivityReportExtension] Could not find main target');
            return config;
        }

        // Add extension group
        const extensionGroupKey = xcodeProject.pbxCreateGroup(EXTENSION_NAME, EXTENSION_NAME);

        // Add files to the extension group
        const swiftFiles = files.filter(f => f.endsWith('.swift'));
        const plistFiles = files.filter(f => f.endsWith('.plist') && !f.includes('entitlements'));
        const entitlementFiles = files.filter(f => f.includes('entitlements'));

        // Track file references
        const fileRefs = [];
        const buildFileRefs = [];

        for (const swiftFile of swiftFiles) {
            const fileRef = xcodeProject.addFile(
                `${EXTENSION_NAME}/${swiftFile}`,
                extensionGroupKey,
                { target: targetUuid, lastKnownFileType: 'sourcecode.swift' }
            );
            if (fileRef) {
                fileRefs.push({ uuid: fileRef.uuid, name: swiftFile });
            }
        }

        // Add target - using low-level API since addTarget doesn't support extensions well
        const target = {
            uuid: targetUuid,
            pbxNativeTarget: {
                isa: 'PBXNativeTarget',
                buildConfigurationList: buildConfigListUuid,
                buildPhases: [
                    sourcesBuildPhaseUuid,
                    frameworksBuildPhaseUuid,
                    resourcesBuildPhaseUuid,
                ],
                buildRules: [],
                dependencies: [],
                name: EXTENSION_NAME,
                productName: EXTENSION_NAME,
                productReference: productUuid,
                productType: 'com.apple.product-type.app-extension',
            },
        };

        // Add product reference
        xcodeProject.addToPbxFileReferenceSection({
            uuid: productUuid,
            isa: 'PBXFileReference',
            explicitFileType: 'wrapper.app-extension',
            includeInIndex: 0,
            path: `${EXTENSION_NAME}.appex`,
            sourceTree: 'BUILT_PRODUCTS_DIR',
        });

        // Add to products group
        const productsGroup = xcodeProject.pbxGroupByName('Products');
        if (productsGroup) {
            xcodeProject.addToPbxGroup({ uuid: productUuid, basename: `${EXTENSION_NAME}.appex` }, productsGroup.uuid);
        }

        // Build configurations for extension
        const commonBuildSettings = {
            ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: 'AccentColor',
            CLANG_ANALYZER_NONNULL: 'YES',
            CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: 'YES_AGGRESSIVE',
            CLANG_CXX_LANGUAGE_STANDARD: '"gnu++20"',
            CLANG_ENABLE_OBJC_WEAK: 'YES',
            CLANG_WARN_DOCUMENTATION_COMMENTS: 'YES',
            CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: 'YES',
            CLANG_WARN_UNGUARDED_AVAILABILITY: 'YES_AGGRESSIVE',
            CODE_SIGN_ENTITLEMENTS: `${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements`,
            CODE_SIGN_STYLE: 'Automatic',
            CURRENT_PROJECT_VERSION: '1',
            GENERATE_INFOPLIST_FILE: 'YES',
            INFOPLIST_FILE: `${EXTENSION_NAME}/Info.plist`,
            INFOPLIST_KEY_CFBundleDisplayName: 'Lumis Activity Report',
            INFOPLIST_KEY_NSHumanReadableCopyright: '',
            IPHONEOS_DEPLOYMENT_TARGET: '16.0',
            LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
            MARKETING_VERSION: '1.0',
            MTL_ENABLE_DEBUG_INFO: 'INCLUDE_SOURCE',
            MTL_FAST_MATH: 'YES',
            PRODUCT_BUNDLE_IDENTIFIER: extensionBundleId,
            PRODUCT_NAME: '"$(TARGET_NAME)"',
            SKIP_INSTALL: 'YES',
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: 'DEBUG',
            SWIFT_EMIT_LOC_STRINGS: 'YES',
            SWIFT_OPTIMIZATION_LEVEL: '-Onone',
            SWIFT_VERSION: '5.0',
            TARGETED_DEVICE_FAMILY: '"1,2"',
            DEVELOPMENT_TEAM: '', // Will be set by Xcode
        };

        // Note: The actual Xcode project modification is complex
        // This plugin sets up the files; the target needs to be added manually in Xcode
        // or via a more comprehensive plugin solution

        console.log(`[withDeviceActivityReportExtension] Extension files prepared at ${targetPath}`);
        console.log('[withDeviceActivityReportExtension] You need to add the extension target manually in Xcode:');
        console.log('  1. Open Lumis.xcworkspace in Xcode');
        console.log('  2. File > New > Target > Device Activity Report Extension');
        console.log(`  3. Name it "${EXTENSION_NAME}" with bundle ID "${extensionBundleId}"`);
        console.log('  4. Replace generated files with existing ones in ios/LumisDeviceActivityReport/');
        console.log('  5. Add App Group entitlement: group.com.nitant.lumis');

        return config;
    });

    return config;
};

module.exports = withDeviceActivityReportExtension;
