# Plan: Enhance Shielded Categories UX

The user suggested improving the UX for app categories by showing specific category icons and names.

## Proposed Icon Mapping
We will map common Apple ScreenTime categories to specific Lucide icons:
- **Social Networking**: `Users`
- **Games**: `Gamepad2`
- **Entertainment**: `Play`
- **Creativity**: `Palette`
- **Productivity**: `Clock`
- **Education**: `GraduationCap`
- **Shopping**: `ShoppingBag`
- **Travel**: `Plane`
- **Utilities**: `Settings`
- **Default/Other**: `Layers`

## Logic Changes
1.  **Update `getAppIcon`**:
    *   Enhance the helper in `onboarding-success.tsx`, `ShieldCta.tsx`, and `onboarding-commitment.tsx`.
    *   Add keyword matching for category names.
2.  **Update Text Labels**:
    *   Modify `getShieldingText` and `getCompactLabel`.
    *   If 1 or 2 categories are selected, show their names (e.g., "Social & Games shielded").
    *   If more are selected, use the plural count (e.g., "3 categories shielded").
    *   Maintain the "X apps" suffix if individual apps are also selected.

## Files to Modify
- `src/app/onboarding-success.tsx`
- `src/components/dashboard/ShieldCta.tsx`
- `src/app/onboarding-commitment.tsx`

## Status
- [ ] Implement enhanced `getAppIcon` mapping
- [ ] Update success screen text logic
- [ ] Update dashboard CTA text logic
- [ ] Sync commitment screen visuals
