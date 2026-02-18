# CLAUDE.md — Project Instructions

TCF v2.3 Consent Management Platform demo. Next.js 16 / React 19 / TypeScript / pnpm.

## Critical: Module Loading

**Always use `require()` for `@iabtechlabtcf/*` packages — never ESM import.**
ESM builds have circular dependencies that break under Turbopack.

```ts
// ✅ correct
const { TCString } = require("@iabtechlabtcf/core");

// ✅ types-only ESM import is fine
import type { TCModel } from "@iabtechlabtcf/core";

// ❌ never
import { TCString } from "@iabtechlabtcf/core";
```

## Key Files

| File | Role |
|------|------|
| `src/lib/tcf/tcf-manager.ts` | Core TCF logic — init, encode, decode, pub/sub |
| `src/lib/tcf/constants.ts` | CMP_ID=2, category→purpose mapping, cookie name |
| `src/components/CookieConsent.tsx` | vanilla-cookieconsent UI, calls `updateTcfConsent()` |
| `src/components/TcStringDisplay.tsx` | Raw TC string display + reset |
| `src/components/TcStringDecoder.tsx` | Decoded consent breakdown with data-testid attributes |
| `public/gvl/vendor-list.json` | Local GVL (tcfPolicyVersion=5, v2.3) |

## Consent Category Mapping

| Category | TCF Purposes | Special Features |
|----------|--------------|------------------|
| necessary | 1 | — |
| analytics | 7, 8, 9, 10 | — |
| marketing | 2, 3, 4, 5, 6 | SF 1, SF 2 |

## TCF v2.3 Rules

- `policyVersion` = 5 (library default, GVL has tcfPolicyVersion=5)
- `vendorsDisclosed` segment is **mandatory** — always call `model.setAllVendorsDisclosed()` on new models
- Old v2.2 cookies (vendorsDisclosed.maxId === 0) must be upgraded on load — see `initTcf()` in tcf-manager.ts

## GVL

Served locally from `/public/gvl/` — never fetch from vendor-list.consensu.org (CORS blocked).
Must be fully loaded (`await gvl.readyPromise`) before calling `TCString.encode()`.

## Testing

```bash
pnpm test        # runs all Playwright e2e tests (auto-starts dev server)
pnpm dev         # dev server on localhost:3000
```

Tests use `data-testid` attributes. Key testids in TcStringDecoder:
`tc-decoder`, `purpose-{1-10}-consent`, `purpose-{1-10}-li`, `sf-{1-2}-consent`,
`tc-decoder-gvl-version`, `tc-decoder-cmp-id`, `tc-decoder-vendors-disclosed`.

## Conventions

- UI labels in Polish, code and comments in English
- Inline styles (no CSS modules) in components — consistent with existing code
- TC string state via pub/sub in `tcf-manager.ts`, consumed with `useSyncExternalStore`
