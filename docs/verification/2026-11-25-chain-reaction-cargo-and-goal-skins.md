# 2026-11-25 — Chain Reaction cargo and goal skins (PR #2162)

**Changed:** On the plain machines (levels 1–3, 7 and 10) the cargo is now a marble, an acorn or a duckling and the goal a bell, a squirrel's bowl or a pond, cycling machine by machine from a seeded offset; the spoken lines slot the cargo and goal words. Every ramp the cargo meets plays a rising pentatonic step (left ramps lower, right ramps higher). The prediction, two-marble, chime and gate machines keep the marble and the bell.
**Ran:** `src/games/chain-reaction` unit tests including the new `skins.test.ts`, barrels and game-docs tests; typecheck, lint, format check; `BROWSER_SUITE=machines` (levels 1, 6–11 pass); a portrait screenshot of level 7 showing the bowl goal.
**Not run:** a screenshot of the acorn and duckling pictures themselves (only the bowl was seen), `fingerdemo` (the bot's taps and drags did not change), the full `npm test` (left to PR CI), build, offline, real phone.
