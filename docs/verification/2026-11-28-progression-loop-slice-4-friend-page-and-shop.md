# 2026-11-28 — Progression loop slice 4: the friend's page and shop

**Changed:**
- `src/content/shop.ts` (new, pure): `SHOP_IDS` (nine things to wear, fourteen colours), `priceOf` (60 to 250 for things to wear, 50 a colour, 120 a paint-shelf colour), `hasLook` (bought, already on, or the friend's own colour), `buy` (earning band only, once, never below zero), `cleanShop`, `shopName`. `SaveData.shop` with defaults and repair; `store.buy`; `store.recolor` also accepts a bought colour.
- `src/app/scenes/FriendPageScene.ts` (new, route `friendPage`): choose a friend (three species, free), then the friend on a stage with priced cards and a paged colour row; a tap tries a thing on, Buy pays for it, a thing owned goes on and off free.
- Today's six: for a band that earns, a pill beside the corner friend ("Choose a friend" or "<name>'s shop"); a tap on it or the friend opens the page.
- Docs: the definition's slice 4, DESIGN's save row, roadmap row 32.

**Ran:** `npx tsc --noEmit`; eslint and prettier on the changed files; `node scripts/check-links.mjs`; full `npm test` (558 files, 20,607 passed, 5 skipped); `npm run build`. Headless Chromium as an iPhone 13, upright and sideways, on the dev server: picked Grown-up, set 400 shells, opened the page from the six, chose River (Pebble), tried on and bought the sun hat (100) and pink (50), tried the flower crown (250, Buy shown with 250 left); the save held 250 shells, `wear:sunhat` and `color:pink`, and the six showed the pink River in its hat with "Pebble's shop".

**Not run:** no browser suite. Chrome emulation is not a real phone.
