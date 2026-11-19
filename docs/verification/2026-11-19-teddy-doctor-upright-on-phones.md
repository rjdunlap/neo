# 2026-11-19 — Teddy Doctor upright on phones (PR #1843)

**Changed:** Teddy Doctor plays upright (`upright: true`). Its fixed positions moved into a pure `layout.ts`; held upright the patient stands centered at the foot clear of the guide, the tools run in one row above its tap box with the check-up card above them, and level 7's two friends stand one above the other (side by side needed 624 units of the 618 right of the guide). Sideways is unchanged.
**Ran:** `npm run typecheck`; prettier; vitest for Teddy Doctor (new `upright.test.ts` over every level and five upright views, passed first time) and the registry.
**Ran:** `BROWSER_SUITE=uprightgames` filtered to toddler levels 1, 7 and 3, each completed with one sticker; screenshots of levels 7 and 3 looked at. Headless Chrome only.
**Not run:** build, offline, other browser suites, school levels 5, 6 and 8 in the browser (covered by the unit test).
