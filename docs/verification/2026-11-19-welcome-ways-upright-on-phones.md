# 2026-11-19 — Welcome Ways upright on phones (PR #1858)

**Changed:** Welcome Ways plays upright (`upright: true`). `layout.ts` gained an `uprightLayout` branch (`view.upright`): the board shifts left (`left = view.w / 2 - 667`) so the 650-wide board and house fit the 768-wide view; visitor cards stand in a centred row at the top; the tray and the four buttons (undo, out, show me, try) stand up from the bottom edge, starting right of the guide corner; a taller phone moves the board down (0.4 of the slack above 1206). Sideways layout unchanged.
**Ran:** `npm run typecheck`, Welcome Ways and registry tests (101 passed), eslint and prettier, including the new `upright.test.ts` over levels 1–7 and five views (phone, small, tall, captioned, 375 × 601), which passed first time.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=welcome-ways` at school levels 3, 5 and 7 completed, one sticker each; screenshots of levels 5 and 7 viewed. Headless Chrome only.
**Gap:** browser plays of school level 6 (same layout as 7), pre-K 4 and toddler 1 were not obtained: the harness repeatedly failed to list the game (`unknown selection`, empty list), a harness flake as the same invocation passed at other levels; the unit test covers those levels.
**Not run:** build, offline, other suites.
