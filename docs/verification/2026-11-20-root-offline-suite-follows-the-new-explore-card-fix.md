# 2026-11-20 — Root offline suite follows the new Explore card (fix)

**Changed:** `scripts/offline/root.mjs` clicked fixed canvas coordinates written when Explore's first picture was Places. The "Little surprises" picture was later added first, so the click at (282, 197) landed on it, opened a Bubble Pop how-to card and the save never recorded Counting Cove. The test now clicks Places at (512, 197) and its comment lists the five pictures. The app was right; the test was stale.
**Ran:** `npm run build` then `OFFLINE_SUITE=root` against a preview of that build: failed before the change with the reported message, passed after ("Home → Explore → Counting Cove offline twice; location and owned progress survive reload"). Screenshots read to confirm the Explore pictures and the places grid.
**Not run:** The classic offline suite (unchanged, passing per the earlier entry), unit tests and browser suites (no app code changed).
