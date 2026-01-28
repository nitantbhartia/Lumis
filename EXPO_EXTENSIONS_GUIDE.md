# Working with Expo and iOS Extensions

## The Problem

When you run `npx expo prebuild --clean`, Expo **completely regenerates** the `ios/` directory from scratch. This deletes:
- Custom Xcode targets (your extensions)
- Manual Xcode configurations
- App Groups capabilities you added manually
- Any embedded extensions

This is why your extensions keep disappearing.

## The Solution

You have **two options** for working with custom iOS extensions in Expo:

---

## Option 1: Bare Workflow (RECOMMENDED)

Once you add extensions to Xcode, **stop using `--clean` flag**.

### Initial Setup (One Time)

1. Run prebuild ONCE to generate iOS project:
   ```bash
   npx expo prebuild --platform ios
   ```

2. Add extensions in Xcode (follow `XCODE_EXTENSION_SETUP.md`)
   - Takes ~10 minutes
   - Add all 4 extension targets
   - Configure App Groups
   - Embed extensions

3. **NEVER run `npx expo prebuild --clean` again**

### Daily Development Workflow

```bash
# Start development
npx expo start

# Or run on device/simulator
npx expo run:ios

# Build for distribution
eas build --platform ios
```

### When to Run Prebuild Again

Only run `npx expo prebuild` (without `--clean`) when:
- You add new native dependencies
- You change app.json native config (bundle ID, version, etc.)
- Expo SDK major update

**Even then, use without `--clean`:**
```bash
npx expo prebuild --platform ios
# Then re-check extensions are still in Xcode
```

### Advantages
✅ Extensions persist between builds
✅ Faster development (no re-adding extensions)
✅ Can customize native code freely
✅ Standard Expo + native development

### Disadvantages
❌ `ios/` folder is now committed to git (larger repo)
❌ Need to manage native changes manually

---

## Option 2: Fully Managed + Manual Re-setup

Use `--clean` and re-add extensions every time.

### Workflow

1. Make React Native/TS changes
2. When ready for native build:
   ```bash
   npx expo prebuild --platform ios --clean
   ```
3. Open Xcode
4. Re-add all 4 extensions manually (10 min)
5. Build and test

### Advantages
✅ Clean iOS project each time
✅ Easier to troubleshoot native issues

### Disadvantages
❌ Must re-add extensions after every `prebuild --clean`
❌ Time-consuming (10 min setup each time)
❌ Easy to forget steps

---

## Option 3: EAS Build with config plugin (Advanced)

Create an Expo config plugin that runs during EAS Build to add extensions automatically.

**Status**: Requires custom plugin development (complex)

---

## Recommended Approach for Lumis

Use **Option 1: Bare Workflow**

### Setup Steps

1. **One-time setup:**
   ```bash
   # Generate iOS project (if not already done)
   npx expo prebuild --platform ios

   # Add extensions in Xcode
   # Follow XCODE_EXTENSION_SETUP.md
   ```

2. **Commit the ios/ folder to git:**
   ```bash
   git add ios/
   git commit -m "feat: add iOS DeviceActivity extensions"
   ```

3. **Daily development:**
   ```bash
   # Start dev server
   bun run ios

   # Or
   npx expo start --ios
   ```

4. **When adding new packages:**
   ```bash
   # Install package
   bun add some-package

   # Prebuild WITHOUT --clean
   npx expo prebuild --platform ios

   # Verify extensions still exist in Xcode
   ```

### Important: Never Use These Commands

❌ `npx expo prebuild --clean`
❌ `npx expo prebuild -p ios --clean`
❌ `rm -rf ios && npx expo prebuild`

These will delete your extensions!

### Safe Commands

✅ `npx expo prebuild --platform ios` (without --clean)
✅ `npx expo run:ios`
✅ `bun run ios`
✅ `eas build --platform ios`

---

## Checking if Extensions Still Exist

Quick check:
```bash
./scripts/setup-extensions.sh
```

Or manually:
```bash
xcodebuild -project ios/Lumis.xcodeproj -list
```

Should show:
- Lumis (main app)
- LumisShieldExtension
- LumisShieldActionExtension
- LumisDeviceActivityMonitor
- LumisDeviceActivityReport

If you only see "Lumis", the extensions were deleted.

---

## What To Commit to Git

### Option 1 (Bare Workflow - Recommended)
```
✅ Commit:
- ios/ (entire folder)
- android/
- package.json
- app.json

❌ Don't commit:
- node_modules/
- .expo/
```

### Option 2 (Managed - Not Recommended)
```
✅ Commit:
- package.json
- app.json
- XCODE_EXTENSION_SETUP.md (for re-setup)

❌ Don't commit:
- ios/ (regenerated each time)
- android/
- node_modules/
- .expo/
```

---

## Troubleshooting

### "My extensions disappeared again!"

**Cause**: You ran `npx expo prebuild --clean`

**Fix**:
1. Re-add extensions in Xcode (10 min)
2. Add to `.gitignore` a reminder:
   ```
   # IMPORTANT: DO NOT RUN npx expo prebuild --clean
   # It will delete iOS extensions!
   ```

### "I need to clean the iOS project"

Instead of `--clean`, try:
```bash
# Clean Xcode build cache
rm -rf ios/build/
rm -rf ~/Library/Developer/Xcode/DerivedData/Lumis-*

# Then rebuild
npx expo run:ios
```

### "I updated Expo SDK and extensions are gone"

Major Expo updates may require `--clean`. After updating:
```bash
npx expo prebuild --clean --platform ios
# Then re-add extensions manually (follow guide)
```

---

## Summary

| Approach | Extensions Persist? | Time Cost | Recommended? |
|----------|-------------------|-----------|--------------|
| Bare workflow (no --clean) | ✅ Yes | 10 min once | ✅ **YES** |
| Managed + manual re-add | ❌ No | 10 min each time | ❌ No |
| Config plugin | ✅ Yes | Complex dev time | ⚠️ Advanced |

**For Lumis: Use bare workflow, commit `ios/` folder, never use `--clean` flag.**

---

## Quick Reference

```bash
# ✅ SAFE - Do this
npx expo run:ios
bun run ios
npx expo prebuild --platform ios  # without --clean

# ❌ DANGEROUS - Don't do this
npx expo prebuild --clean
npx expo prebuild -p ios --clean
rm -rf ios
```

## Next Steps

1. Add extensions in Xcode (follow XCODE_EXTENSION_SETUP.md)
2. Test that shield and screen time work
3. Commit `ios/` folder to git
4. Use `npx expo run:ios` for development
5. Never use `--clean` flag again
