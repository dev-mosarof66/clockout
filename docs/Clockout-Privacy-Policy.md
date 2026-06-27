# Clockout — Privacy Policy

**Effective date:** _[fill in before publishing]_
**Contact:** _[your support email]_

Clockout helps you disconnect from work after hours. This policy explains exactly
what the app does and does not do with your data. The short version: **your usage
data stays on your phone.**

---

## 1. What stays on your device (never transmitted)

These are processed **entirely on-device** and are **never sent to us or anyone**:

- **App-usage signals** — which apps are in the foreground and when, read via
  Android's Usage Access, used only to detect a guarded work app opening after
  hours. This is read in the moment and not stored or uploaded.
- **Your settings** — work apps, schedule, extra boundaries, Strict Mode, etc.,
  stored locally on the device.
- **Your reclaim history** — when you reclaim or open an app after hours, stored
  locally to power your stats and weekly report.
- **Calendar (optional, Pro)** — if you enable "Respect my calendar," Clockout
  reads your event **times** on-device to skip the nudge during real meetings.
  Calendar content (titles, attendees, etc.) is not read for any other purpose
  and is never transmitted.

Uninstalling the app, or using **Reset** in Settings, deletes this local data.

## 2. What we collect (only if you allow it)

- **Anonymous product analytics (opt-out).** If left enabled, Clockout sends a
  small set of **anonymous app events** (e.g. "app opened," "onboarding
  completed," "paywall viewed," "evening reclaimed") to our analytics provider,
  **PostHog**, tied only to a **random, app-generated ID** — not your name,
  email, account, or device identifiers. We **never** send which apps you use,
  your schedule, your calendar, or any content. You can turn this off any time in
  **Settings → Privacy & about → Anonymous analytics**.
- **Subscription data.** If you start a Pro trial or subscribe, **Google Play**
  processes the payment and **RevenueCat** (our subscription manager) receives an
  anonymous app-user ID and the purchase receipt to validate your entitlement. We
  never receive your card details.

We do **not** sell your data, show ads, or require an account.

## 3. Permissions and why

| Permission | Why | Required? |
|---|---|---|
| Usage access | Detect which app opened, to nudge after hours | Yes (core) |
| Display over other apps | Show the nudge over the work app | Yes (core) |
| Notifications | Clock-out + weekly reminders | Optional |
| Calendar | Skip the nudge during real meetings | Optional (Pro) |
| Ignore battery optimizations | Keep the guard alive overnight | Optional |

## 4. Data retention & deletion

On-device data lives only on your device until you reset or uninstall. Anonymous
analytics events are retained by PostHog per their retention settings. To request
deletion of analytics tied to your random ID, contact us at the email above.

## 5. Children

Clockout is intended for adults managing their own work-life boundaries and is not
directed at children under 13.

## 6. Changes

We'll update this page and the effective date when our practices change.

---

## Appendix — Google Play Data safety mapping

Use this when filling out the Play Console **Data safety** form:

- **Data collected:**
  - *App activity → App interactions* — anonymous product analytics. Collected,
    **not linked** to identity, processing **can be disabled** by the user.
    Purpose: Analytics / App functionality.
  - *Purchases* — handled by Google Play Billing + RevenueCat (subscription
    status). Purpose: App functionality.
- **Data NOT collected / on-device only:** app usage signals, schedule/settings,
  reclaim history, calendar — declare these are processed on-device and not
  transmitted.
- **Data shared:** none sold; analytics/subscription data is processed by our
  service providers (PostHog, RevenueCat) acting on our behalf.
- **Security:** data in transit to PostHog/RevenueCat is encrypted (HTTPS).
- **Account deletion:** no account; data deletion via uninstall/reset + contact
  for analytics.
