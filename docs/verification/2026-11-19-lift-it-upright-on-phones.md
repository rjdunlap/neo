# 2026-11-19 — Lift It upright on phones

**Changed:** Lift It plays upright (`upright: true`). `liftLayout` stretches the rungs up a tall phone (cap 330, stopping before the top rung's ledge handle meets the top-right button); level 9's crate sits at x 300 upright with its ground friends to its right (they were under the guide and the waiting friend was drawn past the 768 edge); the knot counter sits below the Home and help column; the autotouch bot's downward stroke stops short of the view bottom. Sideways is unchanged.
**Ran:** `npm run typecheck`; eslint; vitest for Lift It (new `upright.test.ts` over levels 1–9 on six upright views: targets, friends, counter, cards), the registry and lands (132 passed).
**Ran:** `BROWSER_SUITE=uprightgames` for Lift It, school levels 3–9 and preschool 1–2 by real touches; screenshots looked at (the scene fills a tall phone, level 9's friends in view). Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, other browser suites.
