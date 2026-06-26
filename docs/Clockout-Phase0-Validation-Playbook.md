# Clockout — Phase 0: Willingness-to-Pay Validation Playbook

> **Goal of Phase 0:** Spend ~$0–100 and ~2 weeks to answer ONE question before writing any production code:
>
> ### *"Will well-paid remote knowledge workers pay ~$7/mo for an app that automatically clocks them out of work?"*
>
> This is the #1 risk in the whole project. Market research validated the *demand* (people are burned out) and the *monetization model* (subscriptions work) — but it could NOT find a single standalone after-hours-disconnect app with proven revenue. So we prove willingness-to-pay *ourselves*, cheaply, before committing 6–8 weeks of build.

**Document version:** 1.0 · **Date:** 2026-06-26 · **Companion to:** Clockout-Product-Build-Spec.md

---

## 1. What "validated" actually means (hard gates)

Don't measure vague "interest." Measure **costly signals** — actions that cost the person something (money, email, a click that implies payment intent). Ranked weakest → strongest:

| Signal | Strength | Why |
|---|---|---|
| "This is a great idea!" comment | ❌ Worthless | Costs nothing, people are polite |
| Email signup to waitlist | 🟡 Weak-ish | Low cost, but a real micro-commitment |
| Clicks "Get Pro – $7/mo" then hits "coming soon" | 🟢 Strong | **Fake-door / smoke test** — simulated payment intent |
| Enters card / pre-pays (Stripe pre-order) | 🟢🟢 Strongest | Actual money on the line |

**We run all three layered**, so weak signals fund the funnel and strong signals make the decision.

### The decision thresholds (set BEFORE you start — no moving goalposts)

Define your funnel up front so you can't rationalize later:

- **GO (build the MVP):**
  - ≥ **300 unique visitors** driven to the page, AND
  - ≥ **8% email-signup rate** (≈ 25+ emails), AND
  - ≥ **2.5% "fake-door" paid-intent click-through** (≈ 8+ people who clicked the paid button), AND
  - ≥ **3 people** who actually pre-paid OR replied "take my money / when can I pay you."

- **PIVOT (rethink positioning, re-test once):**
  - Strong email signups (8%+) but near-zero paid-intent clicks → people like the *idea* but won't *pay*. Test a different price/angle, or reconsider B2B.

- **KILL (don't build; switch to fallback):**
  - < 4% email rate AND < 1% paid-intent after 300+ real visitors → demand isn't there at this price/positioning. Fall back to the **desk-worker habit/wellness tracker** (easier build, proven-but-modest revenue).

> These numbers are deliberately conservative. A real, painful problem with a clear solution converts cold traffic at these rates or better. If it can't clear this bar with free marketing, it won't survive paid acquisition later.

---

## 2. The landing page (full copy — paste-ready)

Build a single-page site. Tooling options (pick one, all ship in a day):
- **Fastest:** Carrd ($19/yr) or Framer (free tier) — drag-and-drop.
- **More control:** Next.js + Vercel (free) if you want to reuse code later.
- **Form/waitlist backend:** Tally or Typeform (free) → email captured; or use a waitlist tool like **GetWaitlist** / **LaunchList** (gives referral mechanics + position counter for free).

### 2.1 Above the fold

> **Headline:**
> # Your workday should end. Your phone disagrees.

> **Sub-headline:**
> Clockout automatically detects when you're still in Slack at 9pm — and gently logs you out of work so you can actually have an evening. Built for remote professionals who can't stop checking.

> **Primary CTA button:** `Get early access →`
> **Secondary line under button:** *Join 0 remote workers reclaiming their evenings.* *(update the number live as signups roll in — social proof)*

> **Hero visual:** a phone mockup showing the nudge screen: *"It's 9:40pm. Work's done. Sure you want to open Slack?"* with **[Close & reclaim my evening]** and a faint *open anyway*.

### 2.2 Problem section ("Sound familiar?")

> ## You "logged off" hours ago. So why are you still working?
>
> - 📈 After-8pm meetings are up **16%** — and **29%** of workers are back in their inbox by 10pm.
> - 🌙 Nearly **1 in 5** younger remote workers say they simply *can't switch off* at the end of the day.
> - 🔁 You open Slack "just to check one thing" — and lose your evening.
>
> Screen Time and Digital Wellbeing weren't built for this. They make *you* do the work of setting up blockers. You won't. (Nobody does.)

### 2.3 Solution section ("How Clockout works")

> ## It clocks you out, so you don't have to think about it.
>
> **1. It learns your work apps.** Slack, Teams, Gmail, Jira — Clockout knows which apps are "work" (you confirm in 10 seconds).
>
> **2. It knows when you're off.** Set your hours once. Clockout watches for work apps opening after hours.
>
> **3. It gently stops you.** Open Slack at 9:40pm and Clockout pauses you with a breath and a question: *"Work's done. Sure?"* One tap to reclaim your evening.
>
> **No willpower required. No blocklists to babysit. Your data never leaves your phone.**

### 2.4 Differentiation ("Why not just use Screen Time?")

> | | Screen Time / Digital Wellbeing | Generic blockers | **Clockout** |
> |---|---|---|---|
> | Knows which apps are *work* | ❌ | ❌ | ✅ |
> | Auto-detects "you're still working" | ❌ | ❌ | ✅ |
> | Gentle nudge, not blunt block | ❌ | ❌ | ✅ |
> | Built for work-life boundaries | ❌ | ❌ | ✅ |
> | Data stays on your device | ✅ | ⚠️ | ✅ |

### 2.5 The pricing / fake-door (THE critical test)

> ## Pricing
>
> **Free** — Clock out of up to 3 work apps. Basic evening stats.
> `[ Join early access ]`
>
> **Clockout Pro — $6.99/mo** *(or $49.99/yr)*
> Unlimited work apps · Strict Mode · Auto-learn your hours · Weekly "evenings reclaimed" report · Wind-down routines.
> `[ Get Pro early-bird → ]`  ← **THIS IS THE FAKE-DOOR BUTTON**
>
> *Early-bird founders lock in $4.99/mo for life.*

**Fake-door mechanics:** clicking **"Get Pro early-bird"** does NOT charge. It opens a modal:

> ### You're in. 🎉 (Almost.)
> Clockout Pro launches in a few weeks. Want to **lock in the $4.99/mo founder price**?
> - **Option A (strong signal):** *Reserve my spot* → enter email → "We'll email you a founder link at launch."
> - **Option B (strongest signal):** *Pre-pay $4.99 and skip the line* → Stripe Payment Link. **Fully refundable, charged only at launch.** (Even 3–5 of these = a real green light.)

Track **every click** on the Pro button separately from free signups. That click *is* your willingness-to-pay metric.

### 2.6 FAQ (handles objections + reduces "is this real?" doubt)

- **Is this another screen-time app?** No — Clockout only cares about *work* apps after *work* hours. It's a boundary app, not a digital-detox app.
- **Android or iOS?** Android first (it's launching in weeks). iOS is on the roadmap — drop your email to vote for it.
- **Will it drain my battery / spy on me?** Everything runs on-device. Your usage data never touches our servers.
- **When can I get it?** Early access in a few weeks. Founders get it first + a locked-in price.

### 2.7 Final CTA

> ## Take your evenings back.
> `[ Get early access → ]`
> *No spam. One email when Clockout launches.*

---

## 3. The 2-week execution sprint

### Days 1–2 — Build the asset
- [ ] Buy domain (e.g., `clockout.app`, `getclockout.com`, `clockout.so` — check availability; ~$10–40).
- [ ] Build landing page (Carrd/Framer). Paste copy from §2.
- [ ] Wire up: free email capture + **separate** Pro-button click tracking + a Stripe Payment Link (pre-order, refundable).
- [ ] Add analytics: Plausible/PostHog (privacy-friendly) or just GA4. Track: visitors, email rate, **Pro-click rate**, pre-pays.
- [ ] Make the phone-mockup nudge visual (Figma → export, or a quick mockup tool).

### Days 3–10 — Drive traffic (see §4 for exact posts)
- [ ] Post to Reddit communities (staggered, not all at once).
- [ ] Post "upcoming" on Product Hunt.
- [ ] Show HN / build-in-public X thread.
- [ ] DM/post in 2–3 remote-work Slack/Discord communities.
- [ ] Reply to relevant existing threads ("I can't stop checking Slack at night") with genuine help + soft mention.

### Days 11–14 — Measure & decide
- [ ] Tally the funnel against §1 thresholds.
- [ ] Email/DM everyone who clicked Pro: *"You clicked early-bird — mind a 2-min call or 3 questions?"* (qualitative gold).
- [ ] Make the **GO / PIVOT / KILL** call. Write it down.

---

## 4. Distribution — channels + paste-ready posts

**Golden rule:** lead with the *problem and a real point of view*, not "check out my app." Communities punish promo; they reward usefulness. In most posts, the link is soft or in a comment.

### 4.1 Reddit (highest-signal, free)

Target subs: r/remotework, r/digitalnomad, r/productivity, r/cscareerquestions (after-hours pings resonate hard), r/overemployed, r/workfromhome, r/getdisciplined.

**Read each sub's self-promo rules first.** Many require you to be a participant, not a drive-by. Comment in the community for a few days before posting.

**Post template (problem-first, build-in-public framing):**

> **Title:** I kept checking Slack at 10pm even after "logging off." So I'm building something to stop me.
>
> **Body:**
> Remote for 4 years. The thing that's quietly wrecked me isn't workload — it's that the workday never *ends*. I'd close the laptop and 20 minutes later I'm back in Slack "just to check one thing."
>
> Screen Time / Digital Wellbeing didn't help — they make *you* set up blockers and I never stuck with it. So I'm building a small app that just... knows which apps are work, knows when you're off, and gently stops you from sliding back in after hours. No blocklists to babysit.
>
> Two honest questions for this community:
> 1. Do you actually have this problem, or is it just me?
> 2. If something automatically "clocked you out" of work apps after hours — would you use it? Would you *pay* for it?
>
> (Building in public — happy to share where it's at if anyone wants. Not trying to spam; genuinely want to know if this is worth finishing.)

→ Drop the link in a **comment** when people ask (they will, if the post resonates).

### 4.2 Product Hunt — "Upcoming"

Create an **Upcoming** page (collects emails pre-launch). Teaser copy:

> **Clockout** — Reclaim your evenings. The app that automatically clocks you out of work after hours, so remote workers stop checking Slack at 10pm. Android first. Founders lock in early-bird pricing.

### 4.3 Hacker News — Show HN / Ask HN

HN loves build-in-public and honest problem framing. Best as an **Ask HN** during validation:

> **Ask HN: Do you check work apps after hours — and would you pay an app to stop you?**
>
> I'm a remote dev and I can't stop opening Slack/email late at night even after "logging off." OS screen-time tools didn't fix it (too manual). I'm prototyping an app that auto-detects work apps + work hours and gently blocks the after-hours slide back in. Before I build it properly: is this a real problem for others here, and is it worth paying for, or a vitamin nobody buys? Landing page in comments if useful.

### 4.4 X / LinkedIn — build-in-public

**X thread opener:**
> I'm a remote worker and the workday literally never ends. Closed my laptop at 6, back in Slack by 9:40. Every night.
>
> Screen Time doesn't fix it — too manual.
>
> So I'm building "Clockout": it knows your work apps + hours, and gently logs you out after hours. 🧵 + early access 👇

**LinkedIn** (great for the *professional* niche + B2B "right to disconnect" angle):
> Post the same problem framing, but lean into burnout / right-to-disconnect. LinkedIn's audience = exactly the paying professional. Tag the post with #remotework #worklifebalance #burnout.

### 4.5 Niche communities (Slack/Discord)
- Remote-work communities (e.g., We Work Remotely community, Running Remote, Nomad List, indie-hacker Slacks).
- Digital wellbeing / minimalism Discords.
- Post the problem-first version, ask for honest feedback, soft-link.

### 4.6 Direct outreach (low volume, high signal)
DM 15–20 remote professionals you know or find:
> "Quick one — do you ever catch yourself checking Slack/email late at night even after you've 'finished'? Building a tiny app to stop exactly that and trying to figure out if it's just me. 2-min reaction would mean a lot: [link]"

---

## 5. Qualitative layer (do this alongside the numbers)

Numbers tell you *if*; conversations tell you *why* and *what to build*. For everyone who clicks Pro or pre-pays, get them talking. **5 customer-discovery questions** (Mom-Test style — ask about their past behavior, never pitch):

1. "Walk me through the last time you checked work after hours — what happened?"
2. "What have you already tried to stop doing that? Why did it stop working?"
3. "How much does this actually bother you — annoyance, or real problem?"
4. "What would have to be true for you to pay for something that fixed it?"
5. "Is there anything I *haven't* asked that matters here?"

**Watch for:** specific painful stories (good), "I'd totally use that" with no past pain (bad — politeness), and people who've *paid for adjacent tools* before (Opal, Freedom, RescueTime) = your highest-WTP buyers.

---

## 6. Tooling checklist (cheap/free)

| Need | Tool | Cost |
|---|---|---|
| Landing page | Carrd / Framer / Next.js+Vercel | $0–19 |
| Domain | Namecheap / Cloudflare | $10–40 |
| Email capture + referral waitlist | GetWaitlist / LaunchList / Tally | Free |
| Pre-order payments | Stripe Payment Link | Free (only fees if charged) |
| Analytics | Plausible / PostHog / GA4 | Free tier |
| Mockups | Figma | Free |
| Scheduling discovery calls | Cal.com | Free |

Total realistic spend: **$30–100.**

---

## 7. Common Phase 0 mistakes (avoid these)

- ❌ **Counting "likes" as validation.** Only costly signals count (email, paid-intent click, pre-pay).
- ❌ **Pitching in discovery calls.** Ask about their *past behavior*, don't sell. Selling biases every answer.
- ❌ **Spamming all channels day 1.** Stagger; be a community member first or you'll get banned and learn nothing.
- ❌ **Moving the goalposts.** Set §1 thresholds now; honor them even if the result stings.
- ❌ **Vanity traffic.** 1,000 random visitors who don't fit the niche < 100 remote knowledge workers. Drive *targeted* traffic.
- ❌ **Skipping the fake-door.** An email list proves curiosity, not WTP. The Pro-button click is the whole point.
- ❌ **No refund clarity on pre-pay.** Always "fully refundable, charged only at launch" — it's ethical and it removes the friction excuse, so a pre-pay becomes a *pure* WTP signal.

---

## 8. The decision (end of week 2)

Fill this in and commit to it:

```
Unique targeted visitors:        ______   (gate: ≥300)
Email signup rate:               ______%  (gate: ≥8%)
Pro-button (paid-intent) rate:   ______%  (gate: ≥2.5%)
Actual pre-pays / "take my money": ____   (gate: ≥3)

Qualitative read (1–2 lines on the strongest pattern you heard):
__________________________________________________________

DECISION:  ☐ GO (build Android MVP)   ☐ PIVOT (re-test angle/price)   ☐ KILL (switch to wellness-tracker fallback)
```

- **GO →** proceed to Phase 1 (Android MVP, §10 of the build spec). You now have a warm waitlist to launch to.
- **PIVOT →** strong curiosity but weak WTP. Re-test with B2B framing ("right to disconnect" for teams) or a different price. One re-test, then decide.
- **KILL →** demand/WTP isn't there at this positioning. Pivot to the desk-bound-worker habit/wellness tracker — lower ceiling, easier build, proven (if modest) revenue. No code wasted. *That's a Phase 0 win, not a loss.*

---

*The entire point of Phase 0: turn the one unverifiable assumption from market research — "does this sell standalone?" — into a measured fact for under $100, before risking 6–8 weeks of build.*
