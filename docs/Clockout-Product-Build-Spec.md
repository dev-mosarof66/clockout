# Clockout — Product & Build Specification

> **Working title:** **Clockout**
> *(alternatives: OffHours · Unplug · Sundown · Detach)*
>
> **Tagline:** *Reclaim your evenings. The focus app that clocks you out of work — automatically.*

**Document version:** 1.0
**Date:** 2026-06-26
**Status:** Pre-build spec (validate willingness-to-pay before writing production code)

---

## 1. One-line description

**Clockout** is an Android-first focus & digital-boundary app that automatically detects your *work* apps and *work hours*, then nudges you to disconnect after hours — so remote professionals stop checking Slack at 10pm and get their personal time back.

Unlike generic blockers (Forest, AppBlock) or free OS tools (Digital Wellbeing, Screen Time), Clockout is **work-context-aware**: you don't manually configure a blocklist — it learns which apps are work and enforces the boundary for you.

---

## 2. Why this exists (validated problem)

All figures below survived adversarial fact-checking during market research:

| Evidence | Source |
|---|---|
| Meetings after 8pm are **up 16% YoY** | Microsoft Work Trend Index (first-party M365 telemetry, 2025) |
| **~29%** of workers are back in their inbox by 10pm | Microsoft Work Trend Index |
| **~1 in 5 Gen Z** remote workers "can't detach" at day's end | CoworkingCafe 2026 Remote Work Well-Being Survey (n=1,140) |
| Friction/interrupt nudges work: **57% reduction** in target-app opens | *one sec* — peer-reviewed PNAS 2023 study |
| Subscription = **68%** of wellness-app revenue (not ads) | Precedence Research |
| Small teams scale this category: **~$10M ARR with 11 people** | Opal (Speedinvest case study) |

**The gap:** existing tools make *you* configure a blocker. Nobody automates the actual job remote workers want done — *"end my workday for me."*

---

## 3. Target niche

**Primary:** Well-paid, "always-on" remote/hybrid **knowledge workers** — software engineers, designers, freelancers, and early-stage startup employees.

- **Why them:** high willingness-to-pay, tech-literate, concentrated in cheap-to-reach channels (Reddit, Product Hunt, Hacker News, X), and the after-hours-intrusion pain is most acute in their cultures.
- **Messaging hook:** the Gen Z "can't disconnect" angle (high emotional resonance) — but the *paying customer* is the established professional.

**Explicitly NOT targeting:** students (Opal owns that), or "everyone who wants less screen time" (too broad, competes head-on with incumbents).

---

## 4. Differentiation / moat

| Everyone else | Clockout |
|---|---|
| User manually picks apps to block | **Auto-detects work apps** from usage patterns + a starter list (Slack, Teams, Gmail, Outlook, Jira, Notion, etc.) |
| User sets fixed block schedules | **Learns work hours** and detects "you're still working" after hours |
| Blunt blocking ("app unavailable") | **Gentle nudge → escalating friction** (the proven *one sec* pattern) |
| Generic "screen time" framing | **Work/life boundary** framing — speaks to burnout, not addiction |
| Cloud-dependent | **On-device processing** — usage data never leaves the phone (privacy = selling point) |

The moat is **context-awareness + work-life framing**, not raw blocking (which the OS already does for free).

---

## 5. Monetization

- **Model:** Freemium subscription (NOT ads — ads pay poorly at small scale and clash with a wellbeing brand).
- **Price band:** **$5–10/mo**, with an annual discount (e.g., $6.99/mo or $49.99/yr). Validate exact point via paywall A/B test.
- **Free tier:** core after-hours nudge for up to ~3 work apps + basic stats. Enough to feel the value.
- **Premium tier ("Clockout Pro"):** unlimited apps, Strict Mode (bypass protection), smart auto-detection, weekly "evenings reclaimed" reports, multi-schedule (e.g., lunch breaks), wind-down routines, widgets.
- **Infra:** Use **RevenueCat** for cross-platform subscription management (handles receipts, trials, paywalls, analytics).
- **Trial:** 7-day free trial of Pro on install (proven pattern in category).

---

## 6. Features

### 6.1 MVP (v1.0 — ship this first, Android only)

**Core loop — the differentiator only. Resist scope creep.**

1. **Work-app detection**
   - Onboarding: pre-seeded list of common work apps (Slack, Teams, Gmail, Outlook, Zoom, Jira, Notion, Asana, Linear, GitHub, etc.) — user confirms/edits.
   - Smart suggestion: surface frequently-used apps via `UsageStatsManager` and ask "Is this work?"

2. **Work-hours definition**
   - Simple setup: set start/end of workday + working days.
   - v1: manual. (Auto-learning is v1.1.)

3. **After-hours nudge (the heart of the product)**
   - When a work app is opened *outside* work hours, intercept with a full-screen nudge: *"It's 9:40pm. Work's done. Sure you want to open Slack?"*
   - Proven *one sec*-style friction: a 3–5 second pause / breath before access is granted.
   - Options on the nudge: **"Close & reclaim my evening"** (primary) or **"Open anyway"** (secondary, with a gentle log).

4. **Reclaim stats**
   - Simple dashboard: "Evenings reclaimed this week," after-hours opens avoided, current streak.

5. **Onboarding + paywall**
   - Clean 4–5 screen onboarding that sells the outcome, ends on the 7-day Pro trial paywall.

6. **Notifications / reminders**
   - Optional end-of-workday "You're clocked out 🎉" notification.

### 6.2 v1.1 — Differentiation deepeners

7. **Auto-learning work hours** — detect typical login/logout patterns and suggest schedule.
8. **Auto-detect new work apps** — flag newly frequent apps and ask to classify.
9. **Strict Mode** — bypass protection (can't disable Clockout in a moment of weakness) — gated to Pro.
10. **Weekly report** — "You reclaimed 6.2 hours of personal time this week" email/notification.
11. **Wind-down routine** — at clock-out, optionally trigger a short routine (breathing, "shut the laptop," DND toggle suggestion).

### 6.3 v2.0 — Expansion

12. **iOS version** (native, using Screen Time / DeviceActivity / FamilyControls — see §8).
13. **Multiple boundaries** — lunch breaks, deep-work blocks, "no meetings before 10am."
14. **Calendar awareness** — read calendar to detect genuine after-hours obligations vs. compulsive checking.
15. **Team / B2B angle** — companies buy seats to support "right to disconnect" policies (real legislative tailwind in EU/France/Australia).
16. **Home screen widgets** — streak + "clocked in/out" status.
17. **Integrations** — auto-set Slack status to "away," toggle system DND, etc.

### 6.4 Explicitly OUT of scope for MVP
- ❌ Generic website blocking (the OS + AppBlock already do this)
- ❌ Social/gamification features (Forest owns the tree-planting niche)
- ❌ Detailed screen-time analytics dashboards (Digital Wellbeing does it free)
- ❌ iOS (phase 2 — its APIs are gated and slower to build; see risks)

---

## 7. Technical architecture

### 7.1 Recommended stack (Android MVP)

- **Language:** **Kotlin (native)** — strongly recommended over Flutter/React Native for v1, because the core features depend on Android system APIs that are unreliable through cross-platform bridges.
- **UI:** Jetpack Compose.
- **Key Android APIs:**
  - `UsageStatsManager` (PACKAGE_USAGE_STATS permission) — detect which app is in the foreground / usage patterns.
  - `AccessibilityService` **or** foreground-app polling — to detect a work app opening in real time and trigger the nudge overlay.
  - `SYSTEM_ALERT_WINDOW` (overlay permission) — draw the full-screen nudge over the work app.
  - Foreground `Service` + `WorkManager` — keep monitoring alive within battery rules.
  - `NotificationManager` — clock-out notifications.
- **Local storage:** Room (SQLite) — usage data and settings stay **on-device** (privacy selling point).
- **Subscriptions:** RevenueCat SDK.
- **Auth (minimal):** anonymous device ID for v1; optional Google sign-in for cross-device later. Avoid mandatory accounts at MVP — friction kills conversion.
- **Analytics:** Firebase Analytics or PostHog (privacy-respecting), + RevenueCat for revenue events.
- **Backend:** **Near-zero.** Almost everything runs on-device. A small backend is only needed later for the weekly-report email and B2B.

### 7.2 iOS (v2.0)

- **Language:** Swift / SwiftUI.
- **Frameworks:** **FamilyControls + DeviceActivity + ManagedSettings** (Apple's Screen Time API).
- **Critical:** requires the **FamilyControls entitlement** — Apple-approval-gated. Apply early; expect review friction.
- iOS *cannot* freely read "which work app you're in" the way Android can — the nudge model must adapt to Apple's shielding APIs (you select app categories/apps via Apple's picker, and the OS enforces). Design the iOS UX around this constraint from the start.

---

## 8. Platform constraints & key risks

| Risk | Detail | Mitigation |
|---|---|---|
| **iOS API lockdown** | Screen Time control is gated behind FamilyControls entitlement; can't freely detect "work apps." | Ship **Android-first**; treat iOS as a separate design, not a port. Apply for entitlement early. |
| **Android Accessibility scrutiny** | Google rejects/removes apps misusing AccessibilityService. | Prefer `UsageStatsManager` foreground polling where possible; if using Accessibility, document the wellbeing use case clearly in the Play listing and data-safety form. |
| **Battery / background limits** | Aggressive OEMs (Xiaomi, Samsung) kill background services. | Foreground service with persistent notification; guide users through battery-optimization whitelist in onboarding. |
| **App Store policy (screen-time category)** | Both stores scrutinize screen-time/parental-style apps. | Frame as personal wellbeing/productivity (self-use, adult), not surveillance. Clear privacy policy: data stays on device. |
| **Thin moat vs. free tools** | Digital Wellbeing + AppBlock cover basic blocking. | Lead 100% on **auto-detection + work-life framing**, never on "blocking." |
| **Unproven standalone WTP** | No standalone after-hours-disconnect app with verified revenue was found in research. | **Validate willingness-to-pay BEFORE building** (see §10). This is the #1 risk. |

---

## 9. Success metrics

- **Validation (pre-build):** ≥X paid-waitlist signups or pre-commits from a smoke test (target: enough to justify build — e.g., 100+ email signups or 20+ "$7/mo reserve" clicks).
- **Activation:** % of installs that complete onboarding + classify ≥1 work app.
- **Aha moment:** first after-hours nudge accepted ("Close & reclaim").
- **Retention:** D7 / D30 retention; weekly "evenings reclaimed" trend.
- **Revenue:** trial→paid conversion (category benchmark ~varies; aim 3–5%+), MRR, churn.

---

## 10. Roadmap (de-risked sequencing)

**Phase 0 — Validate WTP (this week, no code):**
- Landing page + paid waitlist ("$7/mo — reserve your spot").
- Post to r/remotework, r/digitalnomad, r/cscareerquestions, Product Hunt "upcoming," Hacker News.
- **Gate:** only proceed to build if WTP signal is strong. If weak → pivot to the desk-worker habit/wellness-tracker fallback.

**Phase 1 — Android MVP (4–8 weeks solo):**
- Features 1–6 (§6.1). Native Kotlin. RevenueCat. On-device. Ship to Play Store.

**Phase 2 — Differentiation (v1.1):**
- Auto-learning, Strict Mode, weekly reports (§6.2).

**Phase 3 — Expand (v2.0):**
- iOS, calendar awareness, B2B "right to disconnect" angle (§6.3).

---

## 11. Valuation context (exit potential)

For reference, from marketplace research (treat as directional, not current):
- Solo-buildable trackers sell on Flippa (e.g., a habit tracker doing ~$517/mo **sold**).
- A larger fitness app (28K subs, ~€556K revenue) **listed at $1.75M**.
- Typical small-app valuation anchor: **~2.5x revenue / ~4x profit (SDE)** (Acquire.com median ~3.9x profit, stable 2024–2025).

A profitable Clockout in the low-thousands MRR is a realistic flip candidate; the B2B "right to disconnect" angle is the path to a larger outcome.

---

## 12. Open questions to resolve before/during build

1. Does the paid-waitlist smoke test produce a strong enough WTP signal to justify the build?
2. Can work vs. personal apps be auto-detected reliably enough to feel "magic" rather than annoying?
3. What's the real trial→paid conversion at $6.99/mo vs $49.99/yr? (A/B test.)
4. Will Google approve the Accessibility/UsageStats use case cleanly under current Play policy?

---

*Built from validated deep-research findings (2026-06-26). Verified claims only; refuted figures (e.g., specific competitor pricing/ARR) deliberately excluded.*
