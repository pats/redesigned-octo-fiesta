# TCF v2.3 CMP Demo

A sample **Consent Management Platform (CMP)** implementation compliant with the **IAB Transparency & Consent Framework v2.3**.

The app demonstrates how user consent is collected, encoded into a TC String, and how to read back exactly what the user agreed to.

**Live demo:** https://redesigned-octo-fiesta.vercel.app/

## What is TCF?

The **Transparency & Consent Framework (TCF)** is a standard developed by IAB Europe that defines a unified way for websites to collect and signal user consent to advertising and analytics vendors. Once consent is collected, it is encoded into a **TC String** — a compressed base64url value stored in the `euconsent-v2` cookie — which downstream ad-tech vendors read to determine what data processing is permitted.

TCF v2.3 (mandatory from 28 February 2026) makes the **Disclosed Vendors** segment required in every TC String, removing ambiguity about which vendors were actually shown to the user.

## How it works

1. On first visit a cookie consent banner is shown
2. The user accepts all categories or only the necessary ones
3. The choice is encoded into a TC String per the TCF v2.3 spec and saved in a cookie
4. The home page displays the raw TC String and its decoded breakdown — showing exactly which Purposes (1–10) and Special Features (1–2) the user consented to

## Consent mapping

| Category | TCF Purposes | Special Features |
|----------|--------------|------------------|
| Necessary | Purpose 1 — store/access device info | — |
| Analytics | Purposes 7–10 — measurement, market research | — |
| Marketing | Purposes 2–6 — ad personalisation | SF 1 (geolocation), SF 2 (fingerprinting) |

## Stack

- **Next.js 16** (App Router, React 19)
- **vanilla-cookieconsent 3** — consent banner UI
- **@iabtechlabtcf/core + cmpapi** — official IAB SDK for TC String encoding/decoding and `window.__tcfapi` CMP API
- **Playwright** — end-to-end tests

## Running locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Tests

```bash
pnpm test
```

The e2e suite covers: TC String generation after consent, Disclosed Vendors segment presence (TCF v2.3 requirement), correct per-purpose/SF consent decoding, and cookie persistence across page reloads.
