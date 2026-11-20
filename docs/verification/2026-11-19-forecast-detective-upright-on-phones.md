# 2026-11-19 — Forecast Detective upright on phones (PR #1896)

**Changed:** Forecast Detective plays upright (`upright: true`). `forecastLayout` gained an `uprightForecast` branch (cards in rows of up to three beside the guide corner with Check last, a 240-tall scene, four flaps in one 648-wide row with the rule card above, all hung up from the bottom edge) because the sideways board is 774 wide and returned null on 768. Sideways plan unchanged.
**Ran:** typecheck; forecast-detective unit tests and the registry test, including the new `upright.test.ts` (levels 1–2, five upright views including 768 × 1024), which passed after one fix (the flaps row ran past the right edge).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=forecast-detective PHONE_BAND=school PHONE_SHOTS=1`: levels 1 and 2 completed; screenshot viewed, content hung from the bottom with sky above. Headless Chrome only.
**Not run:** build, full unit suite, the upright sweep, offline, `fingerdemo`, other suites.
