# Plan: Fix Category Names and Native Metadata Resolution

The user is seeing "Unknown Category" and generic "layers" icons. This happens because the native ScreenTime bridge fails to resolve `localizedDisplayName` for certain categories, and the JS code is passing a hardcoded "category" string instead of the actual name to the icon helper.

## 1. Native Fix (Swift)
We will attempt to improve category name resolution in the native module. 
- In `LumisScreenTimeModule.swift`, we will try to get the name from the `category.token` if `localizedDisplayName` is nil, or provide better default names based on the total categories if we can't resolve them.
- Actually, I'll try to use a more robust way to get the name if possible, or at least log what's happening.

## 2. JS Fix (Icon Mapping)
The current code passes "category" to `getAppIcon` when `isCategory` is true. This prevents keyword matching for things like "Social" or "Entertainment".
- **Fix**: Pass `app.name` directly to `getAppIcon` in all locations.
- **Fix**: Update `getAppIcon` to return a `Shield` icon instead of `Layers` if the name is "Unknown Category" or "Category", as it looks more like a "protected" state.

## 3. Name Resolution
- Align the "Commitment" screen headline fallback with the "Success" screen and Dashboard. 
- Use "Nitant" as the ultimate fallback in the commitment headline so it doesn't look empty.

## Files to Modify
- `modules/lumisscreentime/ios/LumisScreenTimeModule.swift`
- `modules/lumisscreentime/ios/FamilyActivityPickerView.swift`
- `src/app/onboarding-commitment.tsx`
- `src/app/onboarding-success.tsx`
- `src/components/dashboard/ShieldCta.tsx`
