# Testing Shield Data Sync

## Check if data is being written:

1. After going through onboarding and selecting apps, check the Metro logs for:
   ```
   [LumisScreenTime] Shield data updated - Goal: Xm, Light: Ym, Streak: Z
   [LumisScreenTime] Verifying write - Goal: X
   ```

2. When you try to open a blocked app, check logs for:
   ```
   [ShieldExtension] Building config - Goal: Xm, Light: Ym, Remaining: Zm, Streak: Z
   [ShieldExtension] UserDefaults suite: SUCCESS
   ```

## If you see "UserDefaults suite: FAILED"
This means the App Group isn't properly configured in Xcode and you need to:
1. Run `npx expo prebuild --clean`
2. Open the project in Xcode
3. Check App Groups capability is enabled for both main app and extensions

## If you DON'T see the ShieldExtension logs at all
This means the extension isn't being loaded. You need to build the app in Xcode.
