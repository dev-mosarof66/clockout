# Clockout — After-Hours Engine (Feature #3) Implementation Plan

> **Goal:** ship the *real* core loop — automatically detect a guarded work app opening
> outside work hours and fire the breathing nudge over it. Today the nudge UI, app list,
> and schedule exist; this plan adds the **detection + overlay + foreground service** that
> makes it fire on its own.
>
> **Reference:** Build Spec §6.1 #3 ("the heart of the product"), §7.1 architecture, §8 risks.
> **Date:** 2026-06-26 · **Status:** planning

---

## 0. Key decisions (lock these before building)

| Decision | Choice | Why |
|---|---|---|
| Stack | **Stay in Expo** + Expo Modules (Kotlin) + config plugin | Reuse the entire RN app we've built; only the engine is native |
| Detection method | **`UsageStatsManager` foreground polling (~1s)**, not AccessibilityService | §8: Google scrutinizes Accessibility misuse; polling is policy-safer |
| Overlay rendering | **Native overlay (Kotlin/Compose)** mirroring the RN nudge | Most reliable to draw over other apps; RN-activity reuse is fiddly (fallback option) |
| Config source of truth | JS writes apps + schedule to **SharedPreferences**; service reads it | Service must run/decide even when JS isn't alive |
| Event logging | Service writes outcomes to a shared store; JS reads on resume | Keeps stats working without JS running |
| Build/test | **Local dev build** (`expo run:android`) or **EAS dev build** | Native code can't run in Expo Go |

**Division of labor:** I write all Kotlin / config-plugin / JS glue. **You run the Android
build and test on a real device** and report results — native code can't be verified by the
`expo export` bundling I've used so far; it needs Gradle + a device.

---

## Phase A — Dev-build foundation
**Outcome:** the app runs as a development build (not Expo Go), ready for native code.

- [ ] Add `expo-dev-client`.
- [ ] `npx expo prebuild` → generates `android/`.
- [ ] `npx expo run:android` on a device/emulator → app launches as a dev build.
- [ ] Confirm all existing screens/notifications still work in the dev build.

**Verify:** app boots from the dev client; everything we built still works.
**Risk:** first prebuild can surface config issues (plugins, package name). Set the Android
`package`/`scheme` explicitly.

---

## Phase B — Permission UX (JS, reuses our primer pattern)
**Outcome:** the three special permissions can be granted, with status surfaced in-app.

Three grants, each a settings-style flow like the notification primer we built:
- [ ] **Usage access** — `Settings.ACTION_USAGE_ACCESS_SETTINGS` + status check.
- [ ] **Display over other apps** — `Settings.ACTION_MANAGE_OVERLAY_PERMISSION` + `Settings.canDrawOverlays()`.
- [ ] **Notifications** — already done.
- [ ] A **"Set up protection" screen** (in onboarding after work-hours, and re-accessible from Settings) that shows each permission's state with an Enable button → deep-links to the right settings page; re-checks on `AppState` resume.
- [ ] A small **status banner on Home** when a required permission is missing ("Clockout can't guard you yet — finish setup").

**Verify:** each permission flips to "granted" after the user enables it; banner clears.

---

## Phase C — Native module skeleton (Expo Module, Kotlin)
**Outcome:** a callable `ClockoutEngine` native module bridged to JS.

- [ ] Create a local Expo module `clockout-engine` (Kotlin).
- [ ] Methods: `hasUsageAccess()`, `hasOverlayPermission()`, `startMonitoring()`, `stopMonitoring()`, `isRunning()`, `writeConfig(appsJson, scheduleJson)`.
- [ ] Config plugin: add manifest permissions (`PACKAGE_USAGE_STATS`, `SYSTEM_ALERT_WINDOW`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`) + service/receiver declarations.
- [ ] JS wrapper `lib/engine.ts` mirroring the module.

**Verify:** JS can call the methods; permission checks return correct booleans on device.

---

## Phase D — Foreground service + detection loop
**Outcome:** a persistent service that knows when a guarded app opens after hours.

- [ ] **Foreground `Service`** with a persistent (low-importance) notification: "Clockout is guarding your evenings."
- [ ] **Polling loop** (~1s, Handler/Coroutine): query `UsageStatsManager.queryEvents` / `queryUsageStats` for the current foreground package.
- [ ] **Decision logic:** `foregroundPkg ∈ guardedApps` **AND** `now` outside `schedule` (start/end + working day) → trigger nudge (debounced so it fires once per app-open, not every poll).
- [ ] Read **guarded apps + schedule** from SharedPreferences (written by JS via `writeConfig`).
- [ ] Map our app *ids* (slack, gmail…) → real Android **package names** (e.g. `com.Slack`, `com.google.android.gm`) in a lookup table.

**Verify:** logcat shows "nudge would fire" when you open a guarded app after hours; nothing during work hours / for non-guarded apps.
**Risk:** polling battery cost — keep interval ≥1s, pause loop during work hours.

---

## Phase E — The nudge overlay
**Outcome:** the breathing nudge actually appears over the work app.

- [ ] Draw a full-screen **overlay window** (`WindowManager` + `TYPE_APPLICATION_OVERLAY`) from the service.
- [ ] Render the nudge (native Compose) mirroring [Nudge.tsx](../mobile/components/Nudge.tsx): "It's 9:42 PM. Work's done." + 3s breathing pause + **Close & reclaim** / **Open anyway** (hidden under Strict Mode).
- [ ] On **reclaim** → send user to home screen (or just dismiss) + record event.
- [ ] On **open anyway** → dismiss, allow the app + record event.
- [ ] Record outcomes to the shared store; JS reads them on resume to update stats.

**Verify on device:** open Slack at an after-hours time → nudge overlays within ~1–2s → both choices behave + log.
**Risk:** rendering reliably over other apps; test across OEMs.

---

## Phase F — Resilience (battery / restart)
**Outcome:** the service survives reboots and aggressive OEMs.

- [ ] **`BOOT_COMPLETED`** receiver → restart monitoring after reboot.
- [ ] **Battery-optimization whitelist** prompt (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) in setup, with OEM guidance (Xiaomi/Samsung "Autostart").
- [ ] Use `FOREGROUND_SERVICE_SPECIAL_USE` (Android 14+) and document the use case.
- [ ] Restart-on-crash handling (`START_STICKY`).

**Verify:** reboot device → monitoring resumes; service stays alive overnight.
**Risk:** §8's #1 device risk — some OEMs still kill it; mitigate with the whitelist prompt.

---

## Phase G — Integration & polish
**Outcome:** the engine is wired to the app's state and stats.

- [ ] `start/stopMonitoring` driven by onboarding completion + the Settings boundary state.
- [ ] `writeConfig` whenever apps/schedule change (alongside our existing store updates).
- [ ] Real nudge outcomes feed the **stats store** → Home dashboard shows real numbers from real interceptions.
- [ ] **Strict Mode** enforced by the overlay (no "open anyway").
- [ ] **Smart-suggest** (MVP #1 stretch): surface frequently-used packages via UsageStats → "Is this a work app?"
- [ ] Test matrix: 2–3 OEMs, Android 10–14, work-hours vs off-hours, reboot, Strict on/off.

**Verify:** end-to-end — onboard → grant permissions → open a guarded app after hours → real nudge → Home stats update.

---

## Acceptance criteria (Feature #3 "done")
1. With permissions granted, opening a **guarded app outside work hours** shows the nudge within ~2s, on a real device.
2. It does **not** fire during work hours, for non-guarded apps, or on non-working days.
3. Reclaim / Open-anyway both work and **log to stats** (Home reflects real numbers).
4. Survives a reboot; stays alive overnight on a mainstream device.
5. Strict Mode removes the bypass.

## Risks & mitigations (from §8)
| Risk | Mitigation |
|---|---|
| OEM battery killers | Foreground service + battery-opt whitelist prompt + OEM autostart guidance |
| Play policy (screen-time category) | Prefer UsageStats over Accessibility; frame as personal wellbeing; clear data-safety form (on-device) |
| Permission friction (3 special grants) | Branded primers + a clear "Set up protection" checklist; let users finish later |
| Polling battery cost | ≥1s interval; pause loop during work hours; stop when all apps unguarded |

## Rough effort
A: ~0.5 day · B: ~1 day · C: ~1 day · D: ~1–2 days · E: ~2 days · F: ~1 day · G: ~1–2 days.
**~8–10 focused days** for a solid Android MVP engine (excluding device-testing iteration).
