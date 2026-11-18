# 2026-11-18 — Grown-ups page conversation cards (PR #1796)

**Changed:** The root's grown-ups' page can show up to two conversation cards from the three question games with saved rounds. The At home section reads the active profile's history directly. Not Always asks “What if it never stopped raining?” to keep the shared wording rule. The six planned cards were reread together for tone.

**Ran:** Typecheck, unit tests, production build, links and diff checks on base `760ff4f3d` plus the PR changes. The card tests caught temporary protective wording in Notice Board and a pebble in the under-two fixture. Both mutations were restored. `BROWSER_SUITE=talkcards GAME_URL=http://127.0.0.1:5198 npm run test:browser` passed in Chromium at 390×844. The fresh pre-K profile had no cards. A saved Notice Board round showed its card and source with no controls or horizontal scroll. Reviewed `test-results/browser/talkcards/parent-talk-cards.png`.

**Not run:** The rest of `grownups`, `world`, offline and game suites. The new case covers the panel change.
