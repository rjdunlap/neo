# 2026-11-28 — Progression loop slice 9: the school band

**Changed:**
- `src/content/shells.ts`: `earnsShells` is true for `school` as well as `grownup` (the developer, 2026-11-28: "I'm fine with school age kids getting it, yes"). Shells per round, the all-six bonus, seasons, the daily gift and the lodge follow from it.
- `src/content/shop.ts`: `sellsLooks(band)`, grown-ups only; `buy` refuses `band` for anyone else. A child's friend already has every thing and colour it can wear for free in Dress, so the shop never sells it. `DailyScene` shows the shop pill and opens the friend's page only for `sellsLooks`; `FriendPageScene` checks it too.
- Stamps come from the player's own band's games and ladder (`GameScene.finish`, the Lanterns sheet), so a grown-up's are unchanged and a school-age child's are the school games' goals.
- `DailyScene`: with no notes button (any band but grown-up), the lantern button takes that corner and the lodge sits beside it.
- Tests: the "a child gets none" checks use pre-K now; `school` is checked to earn; `sellsLooks` and the school refusal in `buy`.
- Docs: the definition's band table and slice 9, roadmap row 32.

**Ran:** `npx tsc --noEmit`; `src/content`, `src/progress`, `src/app` and `src/ui` tests (739 passed); full `npm test` (575 files, 20,920 passed, 5 skipped); `npm run build`. Headless Chromium as an iPhone 13 upright, "Bigger kid": Today's six showed 10 shells from the gift, a lodge button and a lantern button in the corner, and no shop pill; the Lanterns sheet listed the school games; the lodge built its footing for 80 shells.

**Not run:** no browser suite. Chrome emulation is not a real phone.
