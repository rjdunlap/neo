# Puddle Island verification

Checked locally on 2026-10-05. The island expansion and second expansion are implemented: fifteen games, including the Robot Path stretch goal and the newer Size Parade, Bug Builder, and Story Steps. No commit, push, or deployment was performed.

## Third expansion (re-verified the same day)

The second expansion was re-verified independently before more work: typecheck, unit tests, build, and the full browser suite all passed again. A separate scripted tap-through of map → landmark → region page arrows confirmed which games each band reaches with real clicks: lap 6 (Puzzle Peaks, Tinker Lab, Rainbow Meadow and Story Grove under clouds, by design), toddler 11, preschool 14, pre-K 15. No game was unreachable at its bands.

Then Feelings Faces and Monster Munch were added (seventeen games), with polish from the review: the grown-up zone lists clouded games and the band that opens each, regions remember their page when a game ends, page dots are outlined, region ground stays green, and pending saves are written when the page is hidden.

- `npm run typecheck` and `npm run build`: passed.
- `npm test`: 43 tests across thirteen files passed, including new tests for Feelings Faces question generation (answer appears once, distinct options, no back-to-back repeats, one helper per need, one feeling per event) and Monster Munch rules (tray sizes, spare food for exact orders, refusals, fair-share extras, number choices, spoken order wording).
- `npm run test:browser` (all suites): passed without page errors, including the new `third` suite.
- `BROWSER_SUITE=third npm run test:browser`: all 14 new levels passed, with free play and a hug at lap, two mistakes and a hint glow on every question level, early bell rings, refusals from full monsters, an unfair share handed back, wrong number pads, exact saved miss/hint counts, stickers, lap regions showing both games, portrait layout, and reload persistence.
- `npm run test:offline`: passed against a fresh production build.
- Screenshots of every new level, with pink, purple and teal pets, were reviewed; a pink-on-pink room and a rain burst that read as a stain were fixed.

## Automated checks (second expansion)

- `npm run typecheck`: passed.
- `npm test`: 36 tests across eleven files passed. Coverage includes version-one save migration; invalid pet, world, and sticker data; region availability as bands increase; memory scoring; all 26 capital stroke paths; solvable robot boards; unique size ordering; mirror geometry; story solvability and distractors; and complete region-page coverage.
- `npm run build`: passed, including generated service worker and a 31-entry precache.
- `npm run test:browser`: the final combined flow passed in an isolated Chrome context without page errors, from the initial play-button press and hatching through all new games and placement of the rewards it earned. The world, pattern, memory, letters, robot, and sticker suites also passed individually.
- `BROWSER_SUITE=expansion npm run test:browser`: all 22 new levels passed in an isolated Chrome context, with wrong answers, hints, portrait play, exact saved miss/hint counts, stickers, reload persistence, and forward/backward region paging.
- `npm run test:offline`: passed against the production preview in an isolated Chrome context. After the service worker installed, the browser was taken offline, reloaded, navigated through the toddler map and Puzzle Peaks, completed Size Parade, earned a sticker, and retained that save through another offline reload. Cached fonts and the absence of the dev test helper were also checked. The original expansion had separately passed this flow with Pattern Train.

## Browser coverage

| Area | Verified |
| --- | --- |
| Hatching | Four egg taps, eight color choices, spoken-name choices, custom HTML name entry, and confirmation |
| Persistence | Hatched pet and customization survive reload; old-save behavior is covered by unit tests |
| Map | Clouds for unavailable places, birthday reveal after a band increase, ten places open at pre-K, landmark navigation |
| Region routes | Launching a game and holding its home button returns to that region; the island button returns to the map |
| Parent gate | Both-corner hold opens the HTML panel; changing child name, pet name/color, band, and session length applies |
| Pattern Train | All nine levels, wrong choices, hint glow, bell audition/confirmation, two gaps, and saved rewards |
| Memory Match | All nine levels, unpenalized exploration, known-partner mistakes, hints, matches, and saved rewards |
| Letter Trails | Wrong strokes and hints, straight/rounded modes, short words, accented-name normalization, a full A–Z round, and saved rewards |
| Robot Path | All six levels, collisions, retry/clear, hint glow, route execution, and saved rewards |
| Size Parade | All eight levels, biggest/smallest comparisons, ascending/descending drag order, two misses then a hint, exact saved scoring, stickers, and portrait play |
| Bug Builder | All seven levels, guided matching, model copying, both mirror columns, reusable stamps, unpenalized outside drops, hints, saved scoring and stickers, and portrait play |
| Story Steps | All seven levels, ordering and missing-middle modes, unrelated distractors, replay of placed cards, completed-story narration, hints, saved scoring and stickers, and portrait play |
| Growing catalog | Two landmarks per page, both page arrows, launching Size Parade from the second page, and reward/history reload for all three new games |
| Sticker book | Five scenes, drag placement, normalized coordinates, reload persistence, removal back to the tray, tray paging, portrait resizing |
| Feelings Faces | Free-play bubbles for all four feelings, hugging a sad pet, face matching, named feelings, helpers for needs, event causes, friends' feelings, mistakes, hints, saved scoring and stickers, portrait play |
| Monster Munch | Tap feeding, counting along with tap and drag, one cookie each, exact orders with the bell, two-food orders, refusals, fair sharing with hand-backs, number pads, saved scoring and stickers |

Screenshots from the runs are in ignored `test-results/browser/` and `test-results/offline/`. The map, hatching, region pages, all new games, portrait layouts, and sticker scenes were visually reviewed. The map pet was moved clear of the Counting Cove label, and a sea-scene bubble was kept within the page border.

## Reproducing checks

See the [README](../README.md#browser-checks). Browser scripts use a fresh, isolated context. `BROWSER_EXECUTABLE` can select an installed Chrome executable, and `GAME_URL` can select another local server port. `BROWSER_SUITE=world|pattern|memory|letters|robot|expansion|third|stickers` runs a single development suite; omit it to run the combined flow. The standalone sticker suite supplies test stickers, while the combined flow uses the rewards earned by its game play-throughs.

## Remaining device checks

A physical iPad was not available. Confirm Safari speech voices (including their offline availability), synthesized audio after the first touch, real finger tracing and dragging, orientation changes, Add to Home Screen, and Guided Access on the target iPad. Automated Chrome checks do not establish those device-specific behaviors.

Letter Trails currently supports capital A–Z. Accented Latin names normalize to these letters; unsupported names fall back to PIP. The previous remote design artifact was not imported in full; current decisions and this implementation's status live in the repository.
