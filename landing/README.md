# Clockout — Phase 0 validation site

A landing page + interactive demo to measure **willingness-to-pay** before building the
Android MVP. See [docs/Clockout-Phase0-Validation-Playbook.md](docs/Clockout-Phase0-Validation-Playbook.md)
for the full plan, decision gates, and distribution posts.

The page captures three layered signals (playbook §1):

| Signal | Where | Event |
|---|---|---|
| Email signup (curiosity) | hero + free tier | `email_signup` |
| **Pro early-bird click (paid intent)** | pricing fake-door | `pro_click` |
| Reserve / pre-pay (strongest) | fake-door modal | `reserve_submit` / `prepay_click` |

The phone on the right is an **interactive demo (sandbox)** — it never records a signup.

## Run locally

**Prerequisites:** Node.js

```bash
npm install
cp .env.example .env.local   # fill in to capture real signals (optional in dev)
npm run dev                  # http://localhost:3000
```

With no env vars set, the page runs and logs WTP events to the browser console so you can
see them fire — but nothing is recorded. To measure real demand, set the vars in
[.env.example](.env.example):

- `VITE_WAITLIST_ENDPOINT` — Formspree / Tally / Apps Script URL to POST captures to.
- `VITE_STRIPE_PAYMENT_LINK` — refundable pre-pay link (strongest signal).
- `VITE_PLAUSIBLE_DOMAIN` — analytics; enables visitor + event tracking.
- `VITE_WAITLIST_BASE` — honest baseline for the "Join N" counter (start at 0).

## Build

```bash
npm run build     # static output in dist/ — deploy to Vercel/Netlify/Cloudflare Pages
npm run lint      # tsc --noEmit
```

## Deploy (smoke test)

Static site — host on Vercel (config in `vercel.json`), Netlify (`netlify.toml`), or
Cloudflare Pages. **`VITE_*` vars are baked in at build time**, so if the host builds
from Git you must set them in the host's dashboard (your local `.env` is gitignored).

Pre-launch checklist:

- [ ] Set `VITE_PLAUSIBLE_DOMAIN` — without analytics you can't compute the funnel
      rates (visitors, Pro-click %) the GO/KILL decision needs.
- [ ] Delete any test rows from the Google Sheet.
- [ ] Point a real domain at it (converts better than `*.vercel.app` on Reddit/HN).
- [ ] Set absolute OG URLs once the domain is known (optional; relative works on most
      scrapers).

### Social preview image

`public/og-image.svg` is the source; scrapers need the rasterized PNG:

```bash
node scripts/make-og.mjs   # regenerates public/og-image.png from the SVG
```
