# Clockout — Full-Version Build Plan (MVP → v1.1+)

> **Goal:** extend the shipped MVP into the *full* product — the Pro tier that
> justifies the subscription (Build Spec §5) and the v1.1 differentiation
> deepeners (Build Spec §6.2), then line up v2.0.
>
> **Reference:** [Clockout-Product-Build-Spec.md](./Clockout-Product-Build-Spec.md) §5–6,
> [Clockout-Engine-Implementation-Plan.md](./Clockout-Engine-Implementation-Plan.md).
> **Date:** 2026-06-27 · **Status:** in progress (Waves 1–3 + calendar implemented; iOS planned)

---

## 0. Where the MVP stands (baseline)

Built and compiling in a dev build:

- Work-app detection (onboarding list), work-hours setup, after-hours **engine**
  (UsageStats detection → native overlay nudge → foreground service), reclaim
  stats, onboarding + paywall, clock-out notifications.
- **Strict Mode** (a v1.1 item, already done).
- **Engine resilience (Phase F):** boot-restart receiver, battery-optimization
  whitelist + OEM autostart guidance.
- RevenueCat wired (currently on a **Test Store** key).

Known gaps to a *shippable* MVP (tracked separately, not this doc's focus):
device test matrix, real payments (Play products + `goog_` key), store/privacy
prep, analytics.

---

## 1. Premium tier definition (what "full version" sells — Spec §5)

| Pro feature | Spec ref | Status after MVP |
|---|---|---|
| Unlimited guarded apps (free ≈ 3) | §5 | ⬜ → **Wave 1** |
| Strict Mode | §5 / §6.2 #9 | ✅ |
| Weekly "evenings reclaimed" report | §5 / §6.2 #10 | ⬜ → **Wave 1** |
| Wind-down routine | §6.2 #11 | ⬜ → **Wave 1** |
| Smart auto-detection of work apps | §5 / §6.2 #8 | ✅ (Wave 2) |
| Auto-learning work hours | §6.2 #7 | ✅ (Wave 2) |
| Multi-schedule (lunch / deep-work blocks) | §5 / §6.3 #13 | ✅ (Wave 3) |
| Home-screen widgets | §6.3 #16 | ✅ (Wave 3) |
| Calendar awareness | §6.3 #14 | ✅ (Wave 4) |
| iOS | §6.3 #12 | 📋 plan (Wave 4) |
| B2B "right to disconnect" | §6.3 #15 | ⬜ → Wave 5 |

---

## 2. Delivery waves (sequenced by value ÷ effort)

### Wave 1 — Pure-JS Pro features (no rebuild needed) ← **implemented now**
Self-contained, ship on the existing engine, verifiable via `tsc` + `expo export`.

1. **Pro app-limit gate** — free tier guards up to `FREE_APP_LIMIT = 3` apps;
   selecting beyond it (when not Pro) shows an inline upsell → paywall. Pro =
   unlimited. Enforced in onboarding ([work-apps.tsx]) and the edit modal
   ([AppsModal.tsx]). Directly drives the upgrade decision.

2. **Weekly report** — `computeWeeklyReport()` derives, from the existing event
   log: evenings reclaimed this week, after-hours opens avoided, reclaim rate,
   week-over-week delta, best day, a 7-day bar series, and an **estimated
   hours reclaimed** figure (`reclaims × ~25 min`, clearly labelled an estimate).
   Surfaced as a dedicated **/weekly-report** screen + an opt-in **weekly
   reminder notification** (Sun 6pm) that deep-links to it.

3. **Wind-down routine** — a calm **/winddown** screen: a breathing beat plus a
   short, checkable end-of-day list (close the laptop, set Slack to away, turn on
   Do Not Disturb, step away). Launchable from Settings. DND is a *suggestion*,
   not an automated toggle (that needs Notification-Policy access — deferred).

**Data-model additions** (`OnboardingData`): `weeklyReport: boolean` (default on),
`windDown: boolean`. Constant `FREE_APP_LIMIT = 3`.

**Notifications:** scheduling unified into one `syncNotifications({schedule,
clockout, weekly})` so the clock-out and weekly reminders don't clobber each
other (both previously called `cancelAllScheduledNotificationsAsync`).

### Wave 2 — Native intelligence (needs engine rebuild) ← **implemented now**
4. **Smart-suggest work apps** — native `topPackages(days)` aggregates
   `queryUsageStats` foreground time over the last week, filters to launchable
   (non-system) apps, and returns the top 12. Onboarding ([work-apps.tsx]) shows
   a "Suggested from your usage" chip row for detected apps not yet picked —
   known ones map to our branded entries, unknown ones add as custom. Respects
   the free-tier limit.
5. **Auto-learning work hours** — native `usagePattern(packages, days)` walks
   `queryEvents` over 14 days, takes the **median** first/last foreground minute
   of the user's work apps per day (start floored / end ceiled to 30 min), and
   the weekdays with activity, plus a confidence score. A "Suggest from my usage"
   button in [work-hours.tsx] prefills start/end/days; always editable.

   Both degrade gracefully: `[]`/`null` in Expo Go, without Usage access, or on a
   build that predates the new module methods.

### Wave 3 — Boundaries & glanceability ← **implemented now**
6. **Multi-schedule** — kept `schedule` as the primary work window and added
   `extraWindows: GuardWindow[]` (Pro) — labelled windows (Lunch, Deep work, No
   early mtgs) guarded *inside* their hours even during work. Engine config gains
   an `extra` array; the service nudges when `!isWorkHours || inExtraWindow`.
   Managed in Settings → **Extra boundaries** (Pro-gated) via [BoundaryModal.tsx]
   (presets + steppers + days). Back-compat: existing single-schedule users are
   untouched (`extraWindows` defaults to `[]`).
7. **Home-screen widget** — a classic RemoteViews Android App Widget
   ([ClockoutWidget.kt] + `res/layout` + `res/xml`): shows clocked-in/out
   (computed from the schedule) + streak / evenings-reclaimed (pushed from JS via
   `writeWidgetData`, refreshed on stats change). Tap opens the app.

### Wave 4 — Expansion ← **calendar implemented; iOS planned**
8. **Calendar awareness (implemented, Android)** — `expo-calendar` reads timed,
   busy events for the next 36h ([lib/calendar.ts]); when `respectCalendar` (Pro)
   is on, those windows ride into the engine config as absolute-ms `busy[]`, and
   the service **suppresses the nudge while a real obligation is active**
   (`inBusyWindow`). Windows self-expire (refreshed each time the app runs).
   Toggle + permission flow in Settings → Boundary. Adds `READ_CALENDAR`.
9. **iOS** — a separate native project (not a port), gated on Apple's
   FamilyControls entitlement. Full plan in the sub-section below.

#### iOS — implementation plan (separate project)

iOS **cannot** poll the foreground app or draw arbitrary overlays like Android.
The whole model inverts: you don't detect-and-nudge — you **declare a schedule +
a set of apps to Apple, and the OS shields them for you**. Design around that
from day one (Spec §7.2 / §8).

**Stack:** Swift/SwiftUI + three Apple frameworks:
- **FamilyControls** — authorization + the opaque app picker (`FamilyActivityPicker`).
  You never see *which* apps; you get unguessable tokens.
- **DeviceActivity** — `DeviceActivitySchedule` (the work-hours window) + a
  `DeviceActivityMonitor` app extension that fires on interval start/end.
- **ManagedSettings** — `ManagedSettingsStore.shield.applications` to shield the
  selected apps; `ShieldConfiguration` + `ShieldActionDelegate` extensions to
  render the Clockout-branded nudge and handle "reclaim" / "open anyway".

**Sequence:**
1. **Apply for the FamilyControls (Distribution) entitlement** via Apple's form —
   approval-gated, slow. Do this *first*; nothing ships without it.
2. Expo: add an iOS target via a config plugin; create the **Monitor**, **Shield
   Configuration**, and **Shield Action** app extensions (can't be pure JS).
3. Onboarding (iOS): replace our app list with `FamilyActivityPicker`; store the
   `FamilyActivitySelection`. Work-hours → `DeviceActivitySchedule`.
4. On schedule start (after-hours), apply the shield; the shield UI *is* the
   nudge. Strict Mode = no unlock action; "open anyway" = a `ShieldAction` that
   briefly lifts the shield.
5. Map our concepts: `extraWindows` → extra `DeviceActivitySchedule`s; `strict`
   → omit the unlock action. **Calendar suppression is limited** (DeviceActivity
   is schedule-based, not event-driven) — likely out of scope for iOS v1.

**Constraints to set expectations:** requires macOS + Xcode + a **physical
device** (FamilyControls barely works in the simulator); the picker is opaque so
"auto-detect work apps" and per-app branding don't translate; reclaim-stats are
coarser. Treat iOS as a **distinct product** sharing only the brand and data
model, not the engine.

### Wave 5 — Growth / B2B
10. **B2B "right to disconnect"** — team seats, admin policy, light backend.
11. **Integrations** — auto-set Slack status to away, system DND toggle.

---

## 3. Cross-cutting (parallel to waves)

- **Analytics — ✅ implemented** (Spec §7.1/§9): a privacy-respecting,
  fetch-based **PostHog** client ([lib/analytics.ts]) — anonymous random ID, an
  allow-listed funnel (app_opened, onboarding_completed, paywall_viewed,
  checkout_started, trial_started/continued_free, reclaim/open_anyway,
  app_limit_hit, upgrade_pressed, protection_setup_done). **No usage content ever
  leaves the device.** Opt-out in Settings; inert until `EXPO_PUBLIC_POSTHOG_KEY`
  is set. Privacy policy + Play data-safety mapping drafted in
  [Clockout-Privacy-Policy.md].
- **Real monetization**: `goog_` key + Play Console products + service-account
  link + `pro` entitlement (see RevenueCat production checklist).
- **Store/legal**: privacy policy **drafted** ([Clockout-Privacy-Policy.md]) —
  still need the hosted URL, Data-safety form, listing, screenshots, rating.

---

## 4. Acceptance — "full version v1.1 done"
1. Free users are capped at 3 guarded apps with a working upsell; Pro is unlimited.
2. Weekly report shows real numbers from the event log; the weekly reminder fires
   and opens it.
3. The wind-down routine runs end-to-end and feels calm.
4. Smart-suggest proposes real frequently-used apps; auto-learn proposes a
   plausible schedule (Wave 2).
5. Multi-schedule guards more than one window without breaking single-schedule
   users (Wave 3).

## 5. Risks
- **Estimated-hours figure** must read as an estimate, never a hard claim
  (we don't measure session length) — labelled "~ … estimated".
- **Smart-suggest / auto-learn** accuracy (Spec open-question #2): always
  user-confirmed, never silent; "magic, not annoying".
- **Multi-schedule** is a data-model migration — guard with a version bump and a
  one-time migration from `schedule` → `schedules`.
- **Play policy**: each new permission (battery, future calendar) needs a clear
  data-safety declaration.

---

*Wave 1 is implemented in this pass; Waves 2+ are specced here and scheduled.*
