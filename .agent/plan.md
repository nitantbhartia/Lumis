# Implementation Plan: Lumis Premium UX Refinement

This plan details the upgrade of Lumis's UX and UI, drawing inspiration from industry leaders (Opal, Rise Science, Gentler Streak, SunDose) to create a premium, compassionate, and highly functional light-tracking experience.

## Goal
Transform Lumis from a functional utility into a high-end health companion with sophisticated visualizations, a supportive tone, and rock-solid native app blocking.

---

## Phase 1: Technical Foundation (Stabilization)
*Refining the bridge between React Native and the Apple Screen Time API.*

- [ ] **Verify Native Linking**: Confirm `lumisscreentime` module is correctly autolinked and functional on-device.
- [ ] **Native Resilience**: Ensure the `ManagedSettingsStore` usage is thread-safe and doesn't cause startup crashes.
- [ ] **Permission Flow**: Finalize the Screen Time authorization flow with clear error messages and an "Emergency Bypass" for testing on free developer accounts.

## Phase 2: Opal-Inspired Screen Time Blocking (UX)
*The "Shield" should feel like a premium benefit, not a punishment.*

- [ ] **Shield UI Redesign**: Update the `shield.tsx` screen with heavy glassmorphism, high-end typography, and a "vibe" that feels protective.
- [ ] **Active Focus State**: Add a prominent "Shield Active" status indicator on the dashboard that mimics Opal's session visualization.
- [ ] **Compassionate Locking**: Use supportive copy when an app is blocked (e.g., "Protecting your morning light window" vs "App Blocked").

## Phase 3: Rise Science-Inspired Circadian Visualization (Visuals)
*Transforming raw data into biological insights.*

- [ ] **The "Energy Curve"**: Implement a circadian rhythm visualization on the dashboard using clean, smooth gradients (blues for night, vibrant oranges for morning).
- [ ] **Light Sensitivity Window**: Clearly visualize the "Critical Light Window" (first 2 hours after waking) on the main chart.
- [ ] **Premium Gradients**: Update all progress rings and charts to use the sophisticated color palettes inspired by Rise.

## Phase 4: Gentler Streak-Inspired Tone & Compassion (Vibe)
*Moving away from "grinding" toward "biological health."*

- [ ] **Compassionate Tone Audit**: Rewrite notifications and success messages to be encouraging and soft (Gentler Streak style).
- [ ] **Supportive Feedback**: If a user misses their target, use a "Gentle Nudge" approach rather than a failure state.
- [ ] **Soft Animations**: Refine all transitions using `react-native-reanimated` with spring behaviors that feel "organic" and calm.

## Phase 5: SunDose-Inspired Light Interface (Tools)
*Making the camera-based sensor measurement feel like a pro tool.*

- [ ] **Calibration Overhaul**: Redesign the Lux meter with real-time wave visualizations or "light particle" effects.
- [ ] **Real-world Feedback**: Add clear haptic "ticks" that correspond to light intensity during the sensor check.
- [ ] **Frictionless Onboarding**: Ensure the transition from calibration to the dashboard is seamless and satisfying.
