# Claude Code Project Memory

## Critical Constraints (Token Efficiency)
- **Think First**: Propose plan in Plan Mode before code changes
- **Scope Control**: Read ≤3 files unless requested
- **No Verbosity**: Concise explanations only
- **Session**: Suggest `/clear` when task complete

## Stack
Expo SDK 53 + RN 0.76.7, bun, NativeWind v4, Tailwind v3, Reanimated v3, Zustand, React Query, Expo Router, zeego, lucide-react-native

## Structure
- `src/app/` - Expo Router routes, (tabs)/ for tab navigation
- `src/components/` - Reusable UI
- `src/lib/state/` - Zustand stores (lumis-store, auth-store, social-store)
- `src/lib/` - utils: cn.ts, sensors.ts, screen-time.ts, notifications.ts

## Coding Standards
**TypeScript**: Strict mode. Explicit types: `useState<Type[]>([])`, optional chaining `?.`, nullish `??`
**State**: React Query for async, Zustand for local. Use selectors: `useStore(s => s.foo)`. Persist via AsyncStorage sparingly
**Styling**: NativeWind + cn() helper. CameraView/LinearGradient/Animated = style prop only (no className)
**Components**: Pressable > TouchableOpacity. Custom modals > Alert.alert()
**SafeArea**: Import from react-native-safe-area-context. Skip in tab stacks with headers
**Routing**: Expo Router file-based. ONE "/" route. Dynamic: `useLocalSearchParams()`. Modals: `presentation: "modal"`

## Forbidden Files
Do not edit: patches/, babel.config.js, metro.config.js, app.json, tsconfig.json, nativewind-env.d.ts

## Common Mistakes
- Horizontal ScrollViews need `style={{ flexGrow: 0 }}`
- CameraView from expo-camera (not deprecated Camera)
- No Node.js buffer in RN
- reanimated/gesture-handler docs may be outdated - check current
- react-native-keyboard-controller for keyboard handling

## Development Environment
- Standard Expo development workflow (npx expo)
- User works in IDE with full code/terminal access
- Git/deployment managed by user
- Logs via Metro bundler and console

## Lumis App Context
**Purpose**: Gamified daylight exposure rewards screen time unlock
**Auth**: Passwordless (Apple/Google/Email OTP), biometric auto-login
**Key Screens**: Onboarding → Dashboard → Tracking (light sensor) → Shield (app blocking) → Analytics → Achievements → Premium
**Stores**: lumis-store (progress, calibration, streaks), auth-store (user, tokens), social-store
**Sensors**: expo-lux-sensor, expo-sensors, expo-camera
**Native Module**: lumisscreentime (custom, in /modules/)
**Design**: Warm sunrise palette (dawn → sunset), Outfit + Syne fonts, iOS-inspired

## Reference Commands
- Dev: `npx expo start` (or `bun run ios` / `bun run android`)
- Install: `bun add <package>` (using bun, not npm)
- Fonts: `bun add @expo-google-fonts/{font-name}`
- Build: `npx expo prebuild` → native build
- TypeCheck: `npx tsc --noEmit`
- Avoid new packages except @expo-google-fonts or pure JS utils

## Skills Available
- ai-apis-like-chatgpt - AI API integration
- expo-docs - Expo SDK modules
- frontend-app-design - UI/UX design
