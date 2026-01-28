//
//  ShieldActionExtension.swift
//  LumisShieldActionExtension
//
//  Created by nitant bhartia on 1/28/26.
//

import ManagedSettings

// Lumis shield action handler - keeps shield active to enforce sunlight requirement
class ShieldActionExtension: ShieldActionDelegate {

    override func handle(action: ShieldAction, for application: ApplicationToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        // Keep shield active - force user to open Lumis from home screen
        // This prevents bypassing the sunlight requirement
        handleAction(action, completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction, for webDomain: WebDomainToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        // Keep shield active for blocked websites
        handleAction(action, completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction, for category: ActivityCategoryToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        // Keep shield active for blocked categories
        handleAction(action, completionHandler: completionHandler)
    }

    private func handleAction(_ action: ShieldAction, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            // User tapped "Open Lumis" button
            // Keep shield active - they must open Lumis from home screen
            completionHandler(.defer)

        case .secondaryButtonPressed:
            // Secondary button (if we add one later)
            completionHandler(.defer)

        @unknown default:
            // Unknown action - keep shield active
            completionHandler(.defer)
        }
    }
}
