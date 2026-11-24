# 2026-11-24 — Weather Wardrobe two-weather items and level 11 (PR #2098)

**Changed:** Added the `ALSO` two-weather items table (rain boots also suit snowy, the raincoat also suits windy) and pre-K level 11, Keep what still fits (a keeper that still fits the new weather; taking it off is a miss with a spoken reason). A glider plays level 11 as level 7. Single-answer levels never offer a two-weather item against its second weather.
**Ran:** Typecheck; `npm test` (three failures found and fixed: registry order, game-docs, voice clips); the game's unit tests (19 pass, including the table, ambiguity and level 11 on every species); `BROWSER_SUITE=wardrobe7` (plays levels 7 and 11 with two keeper misses and a hint; passed at 768x1024 portrait, with a level 11 screenshot); `fingerdemo` with `FINGER_ONLY=weather-wardrobe FINGER_LEVELS=11`. Markdown link and whitespace checks.
**Not run:** `npm run build`, offline and other browser suites (no shared files changed).
