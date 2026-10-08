# Puddle Island verification

**Read this first (2026-10-07).** How much to run for which change is the [verification budget in AGENTS.md](../AGENTS.md#verification-budget); the short version is rule tests first, one filtered browser pass for what is new, and the long suites only before a release. This log is for looking up what was already proven, not for reading end to end: newest entries are first, an entry should run to about six lines, and a suite recorded as passing for code that has not changed since does not need running again. The quickest broad check is `BROWSER_SUITE=smoke` (every game opens, survives stray taps, shows its how-to card and resizes to portrait; about seven seconds a game; `SMOKE_ONLY=id,id` for some).

This is a dated record of checks, newest first. It records what was actually run; "not run" is an honest entry.

## The discovery journal, and a fix to Animal Snack's first level (2026-10-07; checked in the working tree, not committed)

What changed: a discovery journal (`JournalScene`, reached from a new button in the treehouse): sixteen known entries (nine Sink or Float things, seven Animal Snack animals), filed from `RoundResult.discoveries` when a round actually showed them; the end of a round shows what is new; a bounded `journal` field in the save. **Found along the way:** at Animal Snack level 1 (lap, "munch") the animals were never laid out and stood stacked at the top-left corner, leaving an empty meadow; the existing play-through tapped through the same off-screen point and so passed. Fixed by laying the animals out whenever a round creates them.

- `npm run typecheck`, `npm test` (366 tests; new: the entry table covers every thing and animal exactly, every entry's game exists, each spoken observation is true to the game's data, finding, repeats, the twinkle, and a damaged or old save repaired and round-tripped) and `npm run build` passed. `BROWSER_SUITE=journal` passed with real play: a Sink or Float drop round files exactly the things dropped, an Animal Snack munch round the animals that ate, one sticker, the end-of-round card, the twinkle on the treehouse button until the journal is opened, an unfound card and a found card, the green arrow to the game at a supported band, the journal opening on the page with the new things, nothing found twice, a reload, and portrait. Screenshots were looked at.
- The Animal Snack fix: the `snack` play-through (`BROWSER_SUITE=woods WOODS_ONLY=snack`) now asserts the animals stand on screen; it failed on the old code at level 1 and passed on all five levels after the fix.
- Also run: `island`, `creations`, `room`, `picnic` and `smoke` for Sink or Float and Animal Snack (the celebration, room, save and two games' finish calls changed), `couchgames` for Sink or Float (a couch game whose finish changed), and the production offline check (the served bundle matched the build). Not run: `world`, the other couch suites.
- Not run, and open: the offline reload of a journal; whether a one-year-old notices the journal at all (it is a grown-up-and-older-child feature for now); and everything on a device.

## Pet room creations: a picture board and a tune plaque (2026-10-07; checked in the working tree, merged to `main` after the island work in `6492cef`)

What changed: a game can hand the shell something she made (`RoundResult.creation`); Stamp Studio sends its stamps and Song Maker's free levels send the lit jellies. After the round a tree house button beside the sticker keeps it, only on request. The treehouse shows the picture on a board and the song on a plaque (the pet looks at the picture, sings the song beat by beat), a newer one replaces the older (one earlier of each kind is kept), and a back arrow brings the earlier one back. A bounded `creations` field in the save, repaired on load (`src/content/creations.ts`).

- `npm run typecheck`, `npm test` (353 tests; new: what can be kept and the bounds, replacing, keeping a repeat, undo and redo, a tune's beats, and the save repaired, upgraded and round-tripped) and `npm run build` passed. `BROWSER_SUITE=creations` passed with real play: a three-stamp Stamp Studio picture and a second two-stamp one (offered, not kept until the button, one sticker each, a second tap changes nothing, the pet looks, replace then undo then undo again), a four-note free Song Maker song (kept, the pet sings it), tidy and a reload keep both, and the window, frame, plaque and board clear each other in portrait. Screenshots of the offer, the room and the portrait room were looked at.
- Also run, because the shell's end-of-round screen, the room and the save changed: `BROWSER_SUITE=island`, `room` and `picnic`, and the production offline check (the served bundle matched `dist/index.html`). Not run: `world` and the couch suites (no navigation or couch code changed).
- Not run, and open: a round that ends because the session's time is up goes straight to goodnight and offers nothing to keep; the offline reload of a room with creations; other media (Rainbow Fingers) and taking a creation down; and everything on a device, including whether a one-year-old would tap the tree house button or just enjoy the room.

## The child's island: a NEW sparkle and a favorites shelf (2026-10-07; checked in the working tree, not committed)

What changed: a twinkling star on every game with no finished round (`src/ui/sparkle.ts`, in both place layouts; a subject card twinkles while it holds one), a heart beside the sticker after a round that hearts or un-hearts the game, a shelf of up to five hearted games above a place's games (`src/ui/shelf.ts`) and a **Favorites** card first in the subject layout, and a bounded `favorites` list in the save (`src/content/shelf.ts` holds the rules).

- `npm run typecheck` and `npm test` passed (336 tests; new: the newness rule, toggling, the bound, repair, shelf choice for every band, and a save repaired, upgraded and round-tripped). `BROWSER_SUITE=island` passed: a fresh place twinkles on every game and has no shelf; one finished round (through the shell's `finish`, not a played game) gives one play and one sticker; the heart toggles on, off and on and never touches stickers; the game stops twinkling and stands on the shelf, which opens it; the subject layout leads with Favorites (gone again with no hearts); hearts survive a reload; a full shelf holds five in portrait clear of the arrows. Screenshots of the path and subject layouts, a full portrait shelf and the end-of-round screen were looked at (the heart first sat on the celebrating pet's head and was moved beside the sticker).
- Release-tier, for the whole commit (island, treehouse, how-to cards, three games, five more couch games): `npm run build`, `BROWSER_SUITE=world` (both layouts, every band and orientation) and `BROWSER_SUITE=picnic` (story rounds use the same end-of-round buttons) passed; so did `BROWSER_SUITE=couch` (a full trip and a face-off trip, about nine minutes) and `npm run test:offline` against the production preview, and `BROWSER_SUITE=couchgames` for all fourteen couch games, the five new ones (Pattern Train, Egg Catch, Robot Path, Frog Hop, Sink or Float) included. The first `couchgames` run stopped at Peg Garden's bot (its known flake: the round did not finish with 48 misses), which skipped the six games after it; those ran in a second run and passed, and Peg Garden passed on a single retry. The couch suites ran on a snapshot of the committed tree.
- Not run: a hearted shelf reloaded offline, and any touch on a device. Whether a one-year-old finds the heart, or how the twinkles feel across 49 unplayed games, is not established by Chrome.

## Critter Crossing (2026-10-07; checked in the working tree, not committed)

A bridge gate with a rule: visible on level 1, then a secret to work out by trying critters one at a time and guessing from three or four pictures (one rule, "not" a rule, or two together). Rule tests (logic) cover: every round has critters who cross and who wait; every wrong picture disagrees with the true rule about some critter, so trying everyone leaves exactly one picture; `bestTest` always narrows the pictures and never rules out the true one; the level kinds. A guess counts as a miss only if it contradicts something seen; a fair but unproven guess says to try another critter.

- `npm run typecheck` and `npm test` passed. One scripted play with real pointer input at levels 1, 2, 4 and 5: a wrong tap (level 1) and contradicted guesses counted misses, the right guess finished each round, one sticker per round of play. A screenshot of the guess cards at levels 4 and 5 (the cards were moved up to stay clear of the critters, which carry the evidence) and of round 1.
- Not run: `BROWSER_SUITE=world` after adding the game, the hint glow by eye, level 3, portrait by eye (the smoke suite resizes it), or anything on a device.

## The pet's treehouse (2026-10-07; checked in the working tree, not committed)

What changed: `RoomScene` (six free furnishings, a pet that plays, a frame for one sticker), a `room` field in the save (bounded, repaired, in backups), a treehouse button on the map, a sticker picker, and a fix for particle bursts that used `toGlobal` coordinates (offset by the view scale off 1024×768) in Treasure Map, Pixel Pictures, Bumper Garden and Light Lab.

- `npm run typecheck` and `npm test` passed (new: save repair of a damaged room, an old save gaining the starter room, a backup round trip, the room rules). `BROWSER_SUITE=room` passed: from the map, a drag saved a new floor spot, the lamp dimmed and restored the room, a shelf turned round, the pet used the bed, rug, plant and music box, a sticker hung and survived a reload without being used up, tidy restored the layout and kept the picture, emptying the frame and home worked. Screenshots of the room, the picker (three stickers, then eleven across two pages) and the map were looked at.
- The particle fix was found with a probe at 1280×960 (burst landed at 414,366 for a target of 331,293); that probe was not re-run after the fix and the four fixed games were not played.
- Release-tier checks for the save, map and route changes: `npm run build` passed; `BROWSER_SUITE=world` passed (about four and a half minutes; 65 games reachable at Starry Peak and 48 at Wonder Woods, both layouts and orientations); `npm run test:offline` passed against the production preview (the served bundle matched `dist/index.html`), though it does not open the room.
- Not run: the offline reload of a rearranged room, portrait screenshots of the room, the picnic and couch suites, and a real touch of the lamp or furnishings on a device.

## Grown-up how-to cards, the smoke suite, Garden Rows and Ferry Jam (2026-10-07; checked in the working tree, not committed)

What changed: every touch game has a how-to card (`src/content/howto.ts`, opened by holding a quiet `?` under the home button; it holds the round still and changes no progress), a generic `smoke` browser suite, `scripts/snapshot-serve.sh` for long suites, and two new games, **Garden Rows** (Latin-square flower beds, one solution each) and **Ferry Jam** (slide boats so the ferry reaches the dock; boats come from a frozen, solver-checked list). Drag got an optional `keepGrab`. The tree also holds the earlier uncommitted couch work (five controller-ready games, level-aware pet replay).

- `npm run typecheck` and `npm test` passed (310 tests in 87 files): new tests cover every game having a how-to card and a level line, Garden Rows (unique solutions for 60 seeds per level, valid hints, dead ends) and Ferry Jam (every frozen harbor well formed, solvable within its plan's slides, a hint that moves one closer).
- `BROWSER_SUITE=smoke` over all 69 games passed, in two runs because the first stopped at Little Helpers level 4 with `Cannot read properties of null (reading 'clear')` after stray taps; four reruns of that game (alone, and from it onward through Owl Walk Home) passed and the cause was not found. The suite now prints the stack if it happens again.
- One scripted play each, with real pointer input: Garden Rows (levels 2, 5 and 6; one deliberate clash counted one miss; a sticker) and Ferry Jam (levels 1, 3 and 5; boats dragged along the solver's route; a sticker). A screenshot each of the first screen, and of Starry Peak with the new icons.
- Not run: `npm run build`, the offline check, the `world` suite, portrait screenshots by eye (the smoke suite resized both to portrait without errors), the couch suites, and anything on a device. Garden Rows is not yet a couch game.

## Bouncy Launch's spring on the couch squashes straight down (2026-10-07, later; checked in the working tree on branch `couch-finale-and-course`, not committed)

Reported while playing Cloud Hopper: with a stick or keys the spring moved left and right (the pet was pulled straight back, so the coil leaned like a slingshot) instead of down like a spring. Now, in couch play, the spring squashes straight down by the power: stick down or right is more, up or left is less (`control()` reads both axes), the red plate and the pet ride down with it, the power persists between launches, a hint's outline marks where to push the plate to, and the launch uses the power directly. Touch play and the child's version are unchanged. The how-to text, the control rows and three spoken lines now say "push down". New check: `BROWSER_SUITE=couchcourse` asserts on every Cloud Hopper launch that the pet sits exactly on the spring's line and as far down as the power says, steering alternately sideways and down. Run against a copy served on another port, at low priority because the Mac was busy:

- `npm run typecheck` and `npm test` (290 tests) passed. `BROWSER_SUITE=couchcourse` passed on the new code, including the straight-down checks. `BROWSER_SUITE=arcade ARCADE_ONLY=launch` (Bouncy Launch 1–5 by touch) passed. `BROWSER_SUITE=couchgames` passed for Penguin Slide, Bouncy Launch (how-to, bot round), Bounce Back, Memory Match, Rhythm Neighbors, Light Lab, Secret Code and Bumper Garden. A one-off probe of the spring (`test-results/spring-probe.mjs`) read sideways offset 0 and downward offset 0 to 90 at powers 0 to 1 under down, up, right and left, launched, and found the spring back at the same squash after landing; screenshots of the full, relaxed and hint states were reviewed. Not re-run: the full `couch` suite (its two Bouncy Launch stops use the same code the course run covers).
- **Peg Garden's couch bot is unreliable, with or without these edits.** In the same `couchgames` run its round did not finish (73 misses). Six random boards each on this branch and on the committed code (`f148064`) under the same load: 3 of 6 finished on this branch, 0 of 6 on the committed code, and the frame gaps were steady at 16.6 ms, so it is not slow frames. It passed in earlier runs on the fixed board the suite uses. The bot's aim is chosen by simulating shots and the live game can differ, which the roadmap already notes for the touch suite. Not diagnosed; it affects the Peg Garden how-to demo and the browser check, not play by a person. New: `COUCH_ONLY=peg-garden,bumper-garden BROWSER_SUITE=couchgames` plays only those games.
- Not checked: how the squashing spring feels with a real stick, and whether a catapult arm would suit the launcher better (a cup that swings back would fit a finger's sideways pull; it would redraw the child's version too).

## Couch finale, keepsake, names, challenge courses and TV scaling (2026-10-07; checked in the working tree on branch `couch-finale-and-course`, not committed)

What changed: couch pages scale with the window (a CSS length `--u`, about 1.4 at 1080p) and the footer is one compact row, so every page fits a 1080p TV; a trip now ends with a **finale** (a Pixi night sky where six lanterns rise and light in the color of whoever took each stop, a face-off scoreboard, a six-stop recap, the games the trip opened) and the one **Lantern Night keepsake** (earned once, from the first finished trip, shown on the start page afterwards); optional **player names** typed on the setup page; a **Challenges** menu with three **courses** (Pond Practice, minimum 18, no dead ends; The Five Ponds, minimum 30; Cloud Hopper, twelve small clouds, minimum 12), a course page, a result, per-player records (helped and unhelped bests kept apart, last ten runs, two badges per course), one sticker per run, resume after a reload with the tries kept; a "sound is off" hint for controller-only sessions; the controller reminder under a round now fades after ten seconds (it covered Secret Code's stones); the couch save is version 3 (keepsake, names, courses; versions 1 and 2 upgrade). Contract additions: `GameContext.couch.course` (a resume point and a `progress` callback). The child's island and save are unchanged.

Run on macOS against the dev server, in headless Chrome through `BROWSER_EXECUTABLE`, with synthetic gamepads and keyboard events; no physical controller or TV. The slow suites ran against a copy of the working tree served on another port, so editing could continue; the code they ran is the final code except for comment-only edits and the test-script fixes noted below.

- `npm run typecheck` passed. `npm test` passed 290 tests in 84 files (253 in 79 before). `npm run build` passed. New or extended tests:
  - **Finale** (`finale.test.ts`): nothing before the sixth stop; a Together trip has no winner and every lantern shared; a face-off names a winner and never a loser, a tie or team stop counts for both players, a level score is "you both win the evening"; the games a trip opened and how many the next will; names used in the verdict and labels.
  - **Save** (`party.test.ts`): the keepsake is set once, by the first finished trip, never before the sixth stop, never overwritten by a later trip, and repaired when damaged or missing on a save that had finished a trip; names are cleaned, bounded to fourteen letters and survive a reload byte for byte.
  - **Course rules** (`course.test.ts`): a run settles once (a stale token or a run with parts left settles nothing); helped and unhelped bests are separate and only a beaten best is an improvement; help, once shown, stays on the run; badges are earned once and "perfect" needs the minimum with no hint; ten recent runs, newest first; repair of damaged data inside its limits (a damaged slide list stops at its first bad entry); records from an older course version are retired (three kept), never mixed in; the couch save round-trips with a run in progress.
  - **Registry** (`courses.test.ts`): every course is described the same way, its numbers agree with the rules spec, its game is on the couch and its level exists in that band, plural forms (an early draft said "3 launchs").
  - **Courses' own data:** every Pond Practice and Five Ponds board is tidy, has exactly one shortest route, makes its soft snow matter, and the solver's walk reaches the stated minimum (18 and 30); Pond Practice has no dead ends and the Five Ponds have traps; practice is no harder than the Five Ponds at any step. Cloud Hopper's twelve targets never repeat a cloud, use every cloud at least twice, and the exact pull lands with a window of at least four hundredths either way; the learning levels' clouds are as forgiving as before.
- **Browser runs**, all passing on the final code with no page errors:
  - `BROWSER_SUITE=couch` (about eight minutes): the earlier trip and face-off checks, plus the finale (six stops recapped, no scoreboard in Together, every Together lantern gold, a dated "Lantern Night" keepsake that is new once), a finished face-off trip (a 5 to 4 scoreboard with the leader marked, lanterns in each player's color or gold, no word "lost" or "loser", leaving by "Start another trip" tears the sky down and writes nothing).
  - `BROWSER_SUITE=couchcourse` (new, about seven minutes): the Challenges menu from the mode screen and the start page; Pond Practice, the Five Ponds and Cloud Hopper played with controller presses. Undone slides and missed launches count and are saved at once; the pause menu offers "Back to the course page" and no "different game"; a reload mid-pond or mid-cloud resumes at that part with its tries (and the player) kept; seven slides on a three-slide pond bring the hint and mark the run helped; two missed launches do the same; one sticker per run, not per part; helped and perfect runs land in the right category, badges are earned once, each player and course keeps its own record; a reload does not replay the fanfare or award twice; a run whose last part was done but not settled settles on resume (both a pond and a cloud course); the couch backup round-trips byte for byte; the child's save is identical throughout.
  - `BROWSER_SUITE=couchnames` (new): typing a name with W, S, space and backspace on the setup page types letters and presses no couch button; names reach the chooser, the course pages and the finale, and survive a reload.
  - `BROWSER_SUITE=couchgames`: all nine games' how-to screen, controller lighting, bot round and save.
  - Touch-play regressions after the edits to Penguin Slide and Bouncy Launch: `BROWSER_SUITE=arcade ARCADE_ONLY=launch` (Bouncy Launch 1–5) and `BROWSER_SUITE=woods WOODS_ONLY=penguin` (Penguin Slide 2–5) passed.
  - `npm run test:offline` passed against the production build (the served `assets/index-CQmxmRuh.js` matched `dist/index.html`). It does not exercise couch play, so a one-off probe (`test-results/prod-couch-smoke.mjs`, not a suite) drove the production build at 1080p: the start page, the scale, the Challenges menu, a Pond Practice round with its HUD, the pause menu and the saved record, with no errors.
- **Fit probes** (`test-results/`, exploratory, not suites): every couch page (start, modes, chooser, finished trips, finales, challenges menu and pages, a how-to screen, a round's bar) at five window sizes with scroll overflow measured, and every couch game's how-to screen and round bar at the same five sizes (45 each; all fit). At 1920 by 1080 and 1440 by 900 nothing scrolls; at 1366 by 768 a face-off finale scrolls 3 px; at 1024 by 768 the finale scrolls 30–63 px and the start page 7 px; in portrait the finale scrolls up to 150 px. Screenshots of the finale, the challenge pages, the how-to screens and Cloud Hopper's round were reviewed.
- **Found by these checks:** the first scaling pass pushed the chooser off a 1080p screen (the Shuffle button moved into the footer row and the lanterns beside the title); the finale's footer buttons were white on white, its columns overflowed in portrait, floating lanterns hid its title (it now sits on glass), and its face-off panel overflowed 1080p by 39 px (a redundant tally line went); the plural "launchs" (a unit test); the controller reminder covering Secret Code's stones, which was already so at 1024 by 768 (it fades now); the course test's first hint sequence was one slide short; comparing lantern colors by identity failed because a dynamic import can be a separate module instance (compared by value now); a click right after a new scene is ignored for 0.35 s (the test waits). The full `couch` suite's face-off Bounce Back stop failed in two earlier runs: with two gamepads connected the pet no longer fills in for the left paddle, and the bot only plays the right one, so rallies took 90 to 100 seconds (reproduced with two synthetic pads, 17 seconds without). That was already the test's weakness, not the finale's; the stop now drives both paddles through the sticks.
- **Not checked, and still open:** a real Pro Controller or Joy-Con and a TV (text size across a room, input delay, whether the stick feels right for Cloud Hopper's small clouds), actual device speech (headless Chrome has none) and sound, whether the finale's ceremony, the hint thresholds (three slides over, two missed launches) and the course minimums feel right, whether either course gives a reason to run again, the iPad, and mutation checks (nothing was temporarily broken to watch a new check fail). A bot passing a round proves the controls can finish it, not that they feel good. The one Bounce Back timeout above is explained by the pads, but I did not run the earlier failing suite again on the old code to prove it.

## Couch play: how-to screens, games that open with trips, face-off, six more couch games (2026-10-07; checked in the working tree, committed in `44cfbd0`, merged to `main` in `f148064`)

What changed: the couch route (`CouchScene`, `src/couch/`) gained a how-to-play screen before each game's first play (name, spoken goal, drawn controller that lights with a bot's presses, a window where the game's bot plays a real round), a name card afterwards and "How to play" in the pause menu; couch wording for spoken lines that said "tap" or "pull"; a trip-mode choice (Together or Face-off); face-off scoring (separate boards per turn scored against their own best, one shared board, or a team stop; ties and team stops score for both); games that open as trips are finished, with a NEW mark, a free shuffle and a teaser; save version 2 (`seen`, trip mode, reshuffle count, a pending first turn) with version 1 upgraded; and six more controller-ready games (Memory Match, Rhythm Neighbors, Light Lab, Secret Code, Peg Garden, Bumper Garden), each with `control()` and an `autoplay` bot, for nine in all. Optional contract additions: `Game.autoplay`, `RoundResult.score/scores`, `GameContext.couch`. The child's island and save are unchanged.

Run on macOS against the dev server, in headless Chrome through `BROWSER_EXECUTABLE`, with synthetic gamepads and keyboard events; no physical controller was used.

- `npm run typecheck` passed. `npm test` passed 253 tests in 79 files, and `npm run build` passed. New tests: the version 1 to 2 save upgrade (trips, stickers and the trip in progress kept); `seen` kept to real games; unlock tiers (every couch game in exactly one tier, one tier per completed trip, never taken back, non-finite counts safe); offers (three distinct opened games, stable across reload, avoiding the last two and preferring unplayed, free shuffle that survives a reload); two-turn face-off settlement (first turn saved, stale tokens refused, one sticker and one lantern per stop, scores placed with the right player whoever chose first, ties, team stops, either score direction, a face-off saved byte-for-byte through a backup, malformed face-off data repaired); the catalog (every game has a one-variant spoken goal, a demo level and every stop's level inside the game's real range, and a score rule where it compares scores); and the focus helper (every spot reachable from every other on 300 random mirror-sized boards).
- `BROWSER_SUITE=couch` passed (about eight minutes): the mode choice; the first play of each game shows its how-to screen (name, controller diagram, rows, goal) while the diagram lights with the bot, and the bot finishes a real round in the demo; Back leaves the game unchosen and nothing marked explained; Play marks it explained; a repeat shows the name card; pause then "How to play" leaves the paused round untouched and Start returns to the pause menu; six stops with the earlier checks (puzzle levels, launch misses and hints, two independent paddles, pause/blur/disconnect, portrait, seeded resume, backup round trip, controller title entry); the Penguin Slide and Bouncy Launch bots completing real rounds at the couch levels; the unlock announcement and teaser after a trip; a face-off trip where the first turn leaves the stop unsettled, a reload between turns keeps it, the second player's board differs, equal bot scores tie, a team stop scores for both, Memory Match alternates on a shared board and its pairs add up to the board, Rhythm Neighbors' bot completes on the beat, NEW marks only unexplained opened games, a shuffled offer survives a reload, and the child's save is byte-identical throughout.
- `BROWSER_SUITE=couchgames` passed (about five minutes): for each of the nine couch games, the how-to screen fits the page, its diagram lights with the bot, and the bot plays a real round through `control()` at the level a trip first schedules, settling one stop and one sticker with the child's save untouched.
- Touch-play regressions after the edits to nine existing games (one-game filters; `control()`, `autoplay` and the ring drawing are inert without a controller): Penguin Slide, Light Lab, Secret Code, Bouncy Launch, Bounce Back, Memory Match, Rhythm Neighbors and Bumper Garden each passed their own suite filter (`woods` penguin/light/code, `arcade` launch, `batch` bounce, `memory`, `creative` rhythm, `next` bumper). **Peg Garden's suite (`batch` `BATCH_ONLY=pegs`) did not pass, and I did not establish a passing baseline.** It failed in four of four runs on this machine, twice on the original file and twice with the edit, each time at a different level (2, 3, 4 and 5; the first level, drop mode, passed every time it was reached). The aimed levels chase shots computed by simulation against live frame timing, so it looks flaky here, but that is a guess: the failure was not diagnosed. The edit adds only code the touch path never reaches (a `control` and `autoplay` method, a shot counter in the finish result, and a guide drawn only when a controller has been used), so Peg Garden's touch play is unverified by that suite both before and after
- `npm run test:offline` passed against the production preview (the served `assets/index-*.js` matched `dist/index.html`): service worker, cached assets, trail navigation, a new-game completion and reward, the Windy Picnic, saved progress. It does not exercise couch play, which was only checked on the dev server.
- Screenshots reviewed for the how-to screens of all nine games, the mode choice, the second player's turn card, a face-off result, the chooser with NEW marks, the trip-complete screen, the name card and the game HUD; the how-to screen was also measured to fit 1024×768, 768×1024 and 1920×1080 for seven of the nine games (Peg Garden and Bumper Garden only at the default size, in `couchgames`). These were exploratory probes (`test-results/`), not a suite.

Not checked, and still open: a real Pro Controller or Joy-Con, a TV (text size across a room, input delay), whether the bots and demos feel like good examples, how many trips per unlocked group feels right, actual device speech (headless Chrome has none), and anything on the iPad. A bot completing a round proves the controls can finish it, not that they feel good. Two bugs found by the work and fixed along the way: the couch suite's keyboard entry was flaky because a key press shorter than a frame is never seen (keys are now held for 120 ms), and a restored backup was not byte-identical because `repairCouch` wrote a round's keys in a different order than `completeRound`.

## Party mode and original Switch feasibility (2026-10-06; documentation only)

Added the proposed three-choice, six-stop Island Party ahead of single-game scoring, plus Nintendo party references, cooperative game ideas, a separate controller/TV milestone, and the original-generation Switch development paths. Updated related direction notes consistently. No runtime code changed, developer registration occurred, or console access was obtained.

Checks performed: read current routes, session behavior, browser input/speech dependencies, Quick Tricks rules, and Bounce Back's touch implementation; consulted Nintendo's public browser/developer/game pages and Unity/Godot console guidance; checked 74 local link targets across seven documents (not their anchors), whitespace, and `git diff --check`. No controller, browser gameplay, build, offline, or physical Switch/iPad testing was performed for this documentation-only follow-up. Hardware pricing, developer acceptance/timing, middleware suitability, and port effort remain unverified.

## Play and progression roadmap review (2026-10-06; documentation only)

Added a research-informed proposal for longer adult play, a Penguin Slide course, local records and unique achievements, followed by a second game and the small room. Updated the roadmap and related direction notes so unavailable iPad/child observations remain open without blocking browser prototypes. No runtime features were implemented in this review.

Checks performed: inspected the round/celebration flow, result contract, save/adaptation model, and candidate game rules; checked the cited research and its applicability limits; checked the 12 newly added local documentation/code links; reviewed direction statements for consistency; ran `git diff --check`; confirmed the pre-existing deployment-status documentation edits were preserved. No game tests, browser play-through, production offline run, or physical-device checks were performed for these documentation-only changes.

## The Windy Picnic, Wonder Woods ladder steps, and four more games (2026-10-06, night; checked in the working tree, merged to `main` in `7066d5b`)

What changed: the Windy Picnic story pilot (a map destination, a journal and one keepsake; a new `stories` save field), Mail Carrier 6–7 (picture map and key, two planned stops), Seesaw Balance 8–9 (take the same off both sides), and Block Tower, Lasso Loops, Pet Says and Owl Walk Home (67 games). Shell changes: story rounds in `GameScene`, a `picnic` route, speech promises that stop after a game scene is destroyed, `Tweener.busy()`, a round button that no longer touches itself after its press destroys it, and grown-up tips that fill in every `{name}`.

Run on macOS against the dev server (and the production preview for the offline check), in headless Chrome through `BROWSER_EXECUTABLE`, before the commit. The merged code is the code checked here. The GitHub Pages deploy of `7066d5b` finished successfully; the live site itself was not opened or checked.

- `npm run typecheck` passed. `npm test` passed 223 tests in 75 files. `npm run build` passed. New rule tests:
  - **Windy Picnic:** each game step plays a real level of a band its game supports, for every child band (lap plays Pet Kitchen's toddler version); every request has a spoken ask, change and recap; every blanket puzzle has exactly one blanket that fits, two at lap and toddler, and at early school two striped blankets in different places so both clues are needed.
  - **Saves:** missing story progress defaults to untold; unknown or repeated steps are dropped and kept in story order; an ending needs every step and always keeps its keepsake; a keepsake survives a retelling; story progress survives backup and restore with older progress untouched.
  - **Mail Carrier map:** the path graph is connected, every walk follows the paths and never passes through another house, routes visit both stops in order, every house has a different neighbor and sign, trips never send both letters to one house, and planning checks next, later, already-planned and no-letter stops.
  - **Seesaw Balance 8–9:** every round starts level with the box not yet alone; taking one block from one side only tips it; taking the same off both sides (a box for a box, then blocks) always reaches a lone box across from exactly its weight in blocks.
  - **Block Tower:** the support rule (a middle exactly on an edge falls), fair heights and compare targets, two leaning towers of which exactly one stands (the third round's tops within one eighth of each other), stars reachable on the eighth grid but never with one block, and a hint search that finishes a good start and refuses a doomed one. Counting solutions showed the first rule draft let one block sit exactly half off the edge and reach the first star; the rule became strict and the stars were chosen from the counts (two blocks to half a block out has 4 ways; three blocks to five eighths has 12).
  - **Lasso Loops:** enough fireflies for every jar; totals, leftovers and groups agree; answer choices are distinct and positive and offer swapped tens and ones; fireflies sit one to a grid cell; loops (including a bent C shape) contain the right points; the hint group is close and free.
  - **Pet Says and Owl Walk Home:** no move twice in a row, "Pet says" opens with a real command and spaces its two tricks; owl hops skip occupied stones and fly home past the last stone of a color, and a simulation of random choices always brings every owl home.
- **Browser runs**, every level passing without page errors:
  - `BROWSER_SUITE=picnic` (new): enters from the map; the blanket request, two wrong blankets explained, the glow, then Juniper's blanket (no sticker, as it is not a game round); a reload halfway resumes with the blanket down and the next request glowing; the sandwich request plays Pet Kitchen 3 at pre-K without moving Pet Kitchen's saved level; "again" replays the story round (one more sticker, nothing done twice); the basket returns and the plates arrive; the journal recaps two requests and its arrow starts Jelly Drums 5; two wrong jellies are scored in that round; the friends arrive, the finale plays and the photo is saved; after a reload the picnic is set and calm and the journal offers a retelling, which keeps the photo and adds no sticker; an early-school telling asks for the place too. A portrait journal screenshot was reviewed.
  - `BROWSER_SUITE=woods WOODS_ONLY=mailmap`: Mail Carrier 6 (two wrong houses explained, then the house and key row glow) and 7 in portrait (letter 2's house first and a house with no letter as misses, a planned stop taken out again, the walk). `BROWSER_SUITE=batch BATCH_ONLY=mail` passed levels 1–5 again.
  - `BROWSER_SUITE=woods WOODS_ONLY=boxes`: Seesaw Balance 8, and 9 in portrait: two one-sided removals tip it without a miss and bring a glow on the next thing to take off, blocks put back, pairs taken off both sides, a lone box across from its weight, one wrong number. `BROWSER_SUITE=next NEXT_ONLY=seesaw` passed levels 1–7 again.
  - `BROWSER_SUITE=shortlist` (new), run game by game: Block Tower 1–6 (4 in portrait), Lasso Loops 1–5 (4 in portrait), Pet Says 1–5 (3 in portrait) and Owl Walk Home 1–4 (2 in portrait). Scores saved as intended: Block Tower's flag, compare and reach levels 2 misses and 1 hint, the others none; Lasso Loops 2 two wrong-sized loops and a ringed hint, 3–5 one wrong answer as well; Pet Says none (nothing is judged); Owl Walk Home 4 two shorter-hop choices and a glow, the others none.
  - `BROWSER_SUITE=world`: hatching, the map (now with the picnic), both place layouts, the parent panel, and every subject card in all five places in both orientations: 37, 48, 57, 63 and 46 games reachable.
  - `npm run test:offline` against a production build (an existing `vite preview` on port 4173 serving the rebuilt `dist/`): passed, with two new steps. The seeded save, which predates stories, gained the untold picnic when loaded; and offline, the picnic opened from the map, its blanket step was found by tapping, and the step survived an offline reload.
- **Found and fixed by these checks:**
  - The journal's arrow destroyed itself on press, and the round button's un-squish timer then touched it (a page error). The shared button now checks.
  - Lasso Loops passed a fractional pentatonic step to a bell while counting by fives (a Web Audio error). Fixed.
  - The world suite's quick launch-and-leave found Pet Says still running its introduction after the scene was gone, reading a destroyed object. Speech waits now stop when a game scene (or the picnic) is destroyed, as tweens already did; this protects every game.
  - Owl Walk Home's old card faded out and then cleared its whole holder, taking a quickly turned new card with it. Only the old card fades now.
  - Block Tower: the tap area for "take the top block off" sat under the blocks and never received touches; it now sits over them. The reach level enabled block drags while the round was starting and never refreshed them, allowed the middle block of a stack to be dragged, and returned a toppled block to the table instead of the tray. Typechecking caught a guard that would have ended Seesaw's new rounds without asking the weight.
  - The existing Seesaw Balance 5 ("parts") browser case failed whenever the round's target was 7 (about one run in four): piling weights largest first and skipping exact matches can never overload twice for 7. The case now takes an overload off and puts it on again.
- **Screenshot review** moved the picnic's requests clear of the sun (now cloudy and windy), widened the gap between Block Tower's friend and tower, drew why-it-fell lines over the blocks instead of under them, slowed toppling towers so their blocks land by their own tower, left the look-alike brown dog out of Mail Carrier's key, moved plan flags off the house signs, badged the jar numbers and shrank fireflies in full jars.
- **Not checked:**
  - A real iPad: drawing loops with a finger (and whether small hands close them), dragging blocks to an eighth of a block, the picnic's blanket targets, Mail Carrier's key at a child's viewing distance, two big Owl Walk Home taps in a row.
  - Device speech for the new lines, and whether "{pet} says" reads naturally with every pet name.
  - A child playing any of it: whether the picnic's requests, the journal and the keepsake make sense, whether a one-year-old enjoys stacking and tumbling, whether Pet Says works as co-play.
  - The combined flow (every suite in one run). Suites other than those above were not rerun after the shell changes; the world suite launches and leaves the last game of every subject in every band (landscape).

## Inchworm Measure (2026-10-06, late evening; committed in `dfe08a3`)

Inchworm Measure (pre-K–school, four levels) was committed in `dfe08a3` with rule tests and a browser case but no entry here. These checks ran on that code in a Linux cloud container:

- `npm run typecheck` passed. `npm test` passed 198 tests in 70 files, including Inchworm's rule tests. `npm run build` passed.
- `BROWSER_SUITE=woods WOODS_ONLY=worm` against the dev server, in headless Chromium through `BROWSER_EXECUTABLE`, passed all four levels:
  - Level 1 (lay worms and count) saved 0 misses and 0 hints.
  - Levels 2 (say the length) and 4 (read a ruler) tapped two wrong numbers before the right one; level 3 (compare) dropped one worm too many on the shorter thing twice. Each saved 2 misses and 1 hint.
  - Every level saved its round and sticker.
- The level 3 hint screenshot (landscape) shows yellow lines at each thing's end, as intended.

Observation for the iPad: the bucket worms' touch areas are 108×80 logical units and overlap where the worms stack, slightly under the 100-unit guideline in height.

Not checked: portrait layout, reload persistence, the offline check, physical iPad touch and speech, and a child's play.

## Pixel Pictures, Goodnight Room, and longer ladders (2026-10-06, evening; checked in the working tree, committed in `dfe08a3`)

*Added later the same evening:*
- **Animal Snack:** rule tests check that every animal has its own food and that questions are well formed. `WOODS_ONLY=snack` passed levels 1–5: animals and snacks tapped and dragged, wrong eaters and miscounts as misses, glow hints, saved scores and stickers.
- **Picture Graph:** rule tests check that every question about a generated graph has one clear answer (no ties for most or fewest; exactly one pair of equal bars when asked). `WOODS_ONLY=graph` passed levels 1–4: bars built by tapping, wrong graphs and answers as misses, glow hints. A screenshot found a critter hidden under the number pads; critters now keep clear of the right edge, and the check button hides during questions.
- **Treasure Map and Opposites:** rule tests check that squares are named and compared correctly, that finds sit on the map at different squares, and that step directions start on the map and turn; for Opposites, that every question has exactly one right card and every pairs card has exactly one opposite. `WOODS_ONLY=map` passed Treasure Map 1–4 and `WOODS_ONLY=opp` passed Opposites 1–4 (taps, misses, glow hints, saved scores and stickers). A gallery screenshot checked all 16 opposite pictures.
- **Photo Safari 6 (not) and Egg Catch 6 (predict):** rule tests check that on NOT levels only the target does something different, and that predicted eggs land somewhere new each time. `BROWSER_SUITE=batch BATCH_ONLY=safari FROM_LEVEL=5` passed Photo Safari 5–6. `WOODS_ONLY=predict` passed Egg Catch 6, and `BATCH_ONLY=eggs FROM_LEVEL=4` passed levels 4–5 again. The first predict run counted no misses because the steering layer swallowed bin taps; disabling it when routing fixed this.
- **Ramp Race:** rule tests check that higher ramps and slipperier floors always go farther, that every star is reachable (by exactly one height on the height level), and that the fair-test judge is right. `WOODS_ONLY=ramp` passed levels 1–4: ramps and floors changed by tapping, rolls, short and long rolls as misses with a ghost-ramp hint, and unfair tests as misses.
- **Critter Sort:** rule tests check that separate hoops never overlap, that overlapping ones do, that every part of the diagram gets a critter, and that exactly one offered rule fits on the guessing level. `WOODS_ONLY=sort` passed levels 1–4: critters dragged into hoops and the middle, wrong hoops explained, glow hints, and rules guessed. Screenshot review replaced a "?" sign that looked like a lollipop, and spread out crowded critters.
- **`BROWSER_SUITE=world` passed again with 57 games** (before Ramp Race and Critter Sort): every game is reachable on subject cards in all five places, in both orientations. The build passed.
- **Stop and Go:** rule tests check the light cycle (greens and reds of at least 3 seconds, a short yellow), that only going on red is a mistake, and that both roads green is unsafe. `WOODS_ONLY=go` passed levels 1–4, waiting for the real light: two taps on red, then cars sent and steps taken only on green; at the crossing, both roads green twice, then each road given its turn. A probe found the scene failing to start (cars were added before the light was on the stage) and a crossing hint that never appeared because passing cars reset the miss count.
- **Bubble Pop 10–11 (number bonds):** a rule test checks that every bubble has a partner that makes the total, whatever pair is popped first. `WOODS_ONLY=bonds` passed both levels: wrong pairs, a glowing pair hint, all pairs popped, and the rainbow bubble. The first run failed with 7 misses instead of 2: taps meant for one drifting bubble landed on another drawn on top. Taps now go to the nearest bubble's middle, and the run passes.
- **Rhyme Time:** rule tests check that no word is in two families and that each question shows exactly the intended rhymes (one match, one pair, or one odd one out). `WOODS_ONLY=rhyme` passed levels 1–4. A gallery screenshot of all 29 pictures found the moon drawn as a navy blob (now a crescent).
- **Beat Builder:** rule tests check that beats start on the drum, every row has a hit, three-row beats are never all sounds at once, and repeat beats really repeat. `WOODS_ONLY=beat` covered levels 1–5. The first full run failed one assertion at level 4. Three later runs of levels 3–5 passed, and the failure was not reproduced or explained; treat level 4's opening misses as worth watching.

- `npm run typecheck` passed. `npm test` passed: 177 tests across 60 files. New rule tests:
  - **Robot Path:** each counted or looped level's solution works within its slots, and the plain route doesn't fit without the new idea. Expanding slots and loops is tested, including which slot each step comes from.
  - **Word Monsters 7:** each family question offers its first sound, with the ending fixed and two families per round.
  - **Duck Pond 10:** rounds start with 3–9 ducks and never repeat back to back.
  - **Monster Munch 8:** leftovers are 1 to (monsters − 1), the tray holds every cookie, and shares are at least 2.
  - **Pixel Pictures:** every level has enough fitting pictures. Every logic puzzle is solvable by row and column logic alone, and every cell that logic decides agrees with the picture.
  - **Goodnight Room:** requests are only for things in the room, never repeated, and one or two at a time.
- **Browser runs**, each game on its own, every level passing without page errors:
  - `BROWSER_SUITE=robot` covered Robot Path 1–10. The first six still pass with the rewritten scene; 7–10 tap arrows repeatedly and the loop button, with collisions, the hint, and the running slot lit.
  - `BROWSER_SUITE=originals ORIGINALS_ONLY=ducks` covered Duck Pond 1–10. Level 10 counts on after wrong pads, and the missing ducks fill the pond.
  - `BROWSER_SUITE=third FROM_LEVEL=7` covered Feelings Faces, then Monster Munch 7–8. Level 8 hands back an unfair share, nudges an early bell, then asks how many each and how many left over.
  - `BROWSER_SUITE=woods` covered `WOODS_ONLY=families` (Word Monsters 7), `pixels` (Pixel Pictures 1–5) and `night` (Goodnight Room 1–4).
- **Screenshot review:** found the "sun" picture giving away the first sound in word families. It is hidden there now.
- **Not checked:**
  - The world suite and offline check after these additions. The catalog grew, but navigation and saves did not change.
  - Portrait for these levels.
  - A real iPad, and judging fun.

## Wonder Woods, the early-school band, and seven more games (2026-10-06, afternoon; checked in the working tree, committed in `dfe08a3`)

What changed:

- **A fifth band and place.** `school` ("Early school", 6–8) is the trail's fifth place, Wonder Woods.
- **Band tables.** Games now list only the bands they support (`BandLevels`, `rangeFor`); 29 existing games joined `school` at the top of their ladders.
- **Seven new games:** Light Lab, Penguin Slide, Secret Code, Frog Hop, Market Stall, Garden Grow and Clock Tower.
- **A new browser suite.** `woods` covers these games, Peekaround Island and Little Helpers level 6.

Headless Chrome only; checks kept to what changed.

- **Unit and build checks.** `npm run typecheck` and `npm run build` passed, and `npm test` passed 168 tests across 58 files. Highlights of the new rule tests:
  - **Light Lab:** every generated puzzle (300 seeds per level) has a known answer and starts unsolved, with no overlapping pieces. Pink flowers need light that has passed the pink glass. Following the hint mirror always solves.
  - **Penguin Slide:** slides stop at rocks, edges and soft snow. Every puzzle's shortest solution is within the level's range, and following the hint arrow eats every fish in the fewest slides.
  - **Secret Code:** marks never give more yellows than are missing. The real code never counts as ignoring a clue, even when guesses repeat a color. Suggested guesses fit every clue and always open the door.
  - **Frog Hop:** every start and answer is on the visible pads, and answers never repeat back to back.
  - **Market Stall:** amounts are 1–10 and makeable with the level's coins. The second way to pay always differs.
  - **Garden Grow:** requests fit the beds and the needed packets are offered. Plantings match in any order.
  - **Clock Tower:** times are spoken correctly ("quarter to 1"), times within a round are distinct, and exactly one picture matches when reading.
  - The save migration keeps `school` for the child and the celebrated trail position.
- **`BROWSER_SUITE=woods`.** Every level passed, driven like a finger: Light Lab 1–6, Penguin Slide 1–5 (level 3 in portrait), Peekaround Island 1–5, Little Helpers 6, Secret Code 1–6 (level 4 in portrait), Frog Hop 1–6, Market Stall 1–6, Garden Grow 1–5 and Clock Tower 1–6. Each level checks its misses and hints, where a level has them, plus the saved score and the sticker. Exploration is never counted as a miss: turning mirrors, sliding, live-beam levels and free planting. Each game passed in its own run; the suite was not run in one go.
- **`BROWSER_SUITE=world` passed in full.** Hatching, the five-place trail, birthdays, the parent gate, and subject cards with every game reachable in all five places in both orientations, with large targets and preserved returns.
  - The suite had failed twice for one reason: the test tapped an arrow again within the arrows' deliberate 400 ms debounce. It now waits.
  - This is probably also why the cancellation step failed in the earlier Codex run.
- **`npm run test:offline` passed** against a fresh build served on `localhost:4173` (the default `127.0.0.1` does not reach the IPv6-only preview).
- **Bugs found while testing, all fixed:**
  - **Secret Code:** the clue rule wrongly treated a gray mark as "not in the code" when the same color was green or yellow elsewhere in that guess (caught by a rule test). Its hint stones also covered the guess history; they now sit faintly in the empty slots.
  - **Garden Grow:** planted seeds showed no color, so a mixed-color request could not be checked by eye. Seeds now carry colored markers, and a picture sign shows the request and glows as part of the hint.
  - **Clock Tower:** "one hour later" rounds could repeat an answer.
  - **Light Lab:** the beam's glow stacked into bright dots where segments met.
  - **Market Stall:** the awning's scallops pointed up.
- **Test-only fixes:**
  - Little Helpers: tapping a bunch at its base calls a helper back, as designed, so the test now taps the fruit.
  - Rounds that have just become ready get a frame before the first tap.
- **Not checked:**
  - A real iPad, device speech, and judgments of fun and clarity (roadmap §1).
  - The 29 existing games at the `school` band. Their levels were covered at pre-K by earlier suites, not replayed from Wonder Woods.
  - The combined browser flow.
  - Portrait for most new levels. Only Penguin Slide 3, Secret Code 4 and the subject cards were played in portrait; the others were seen in landscape screenshots only.

## Peekaround Island and Little Helpers equal groups (2026-10-06, afternoon; checked in the working tree, committed in `dfe08a3`)

Checks were deliberately limited to save usage; the grown-up plans browser testing after the usage reset.

- `npm run typecheck`: passed. `npm test`: 147 tests across 51 files passed. New rule tests:
  - **Peekaround Island:** half a turn swaps front and behind and keeps sides as sides; exactly one friend hides, and it is the one asked about; the hider never repeats back to back; every placement request can be answered whichever fitting spot the child uses; all three words come up in a round; two-direction pairs stay answerable across the half turn.
  - **Little Helpers level 6:** every bunch is 2 or 3 fruits of 2 or 3 helpers each, below the crowd so one helper is spare; neighbouring bunches differ in shape; each round shows all three shapes; counting by groups reads "2, 4, 6".
- **Not checked:**
  - `npm run build` after these changes.
  - Any browser run. Neither game has a play-through case in `scripts/browser-check.mjs` yet, and nothing has been seen on screen: the island layout in both orientations, the tree hiding the back spot, drop spots, the who-is-hiding card under the home button, and the bunch layout clearing the waiting helpers.
  - A real iPad.

## Subject cards, Stamp Studio, Pet Kitchen, Rhythm Neighbors and Tangram Town (2026-10-06, midday; pushed in `17124e8`, partly checked)

Built by a Codex session that ran out of usage partway through checking; a Claude session then recorded the state from the logs Codex left in `test-results/` and opened two more lap levels. Headless Chrome only. Checks were deliberately deferred to save usage.

- **What changed:**
  - Subject cards: grown-up Finding games → Place layout, saved as `settings.placeLayout` with a migration default.
  - Four games: Stamp Studio, Pet Kitchen, Rhythm Neighbors and Tangram Town.
  - Quick Tricks 4–6 (a second show) and Seesaw Balance 7 were appended.
  - Rainbow Fingers and Fluffy Salon open their second free-play modes to lap play.
  - Photo Safari and Teddy Doctor open their level 2 to lap play.
- **Passed after the last source edit:**
  - `npm run typecheck` and `npm test` (142 tests across 50 files), rerun by the Claude session after the lap-range change.
  - `BROWSER_SUITE=creative` (`creative-final.log`): every level of all four new games, without page errors.
  - Quick Tricks levels 1–6 (`tricks-final.log`): without page errors.
- **Failed, then possibly fixed:**
  - `BROWSER_SUITE=world` (`world-subjects.log`) passed hatching, the trail, the parent gate, and reaching every game on subject cards in all four bands, in both orientations. That run predated the four new games.
  - It then failed the cancellation step. After a pointer cancel, the next tap on a subject card did not open it.
  - `SubjectPlaceScene.ts` was edited 30 seconds after Codex's probe (`test-results/probe-cancel.mjs`), presumably to fix this. The suite was not rerun.
- **Not checked:**
  - `npm run build`.
  - `BROWSER_SUITE=world` after the fix and with 43 games.
  - `npm run test:offline`, which now starts through subject cards.
  - Seesaw Balance 7 in the `next` suite.
  - The lap ranges of Photo Safari and Teddy Doctor (their level 2 play-throughs passed before, at other bands).
  - A real iPad, and judgments of fun and clarity.

## Seesaw Balance, Teddy Doctor, Bumper Garden and Quick Tricks (2026-10-06; checked in the working tree, pushed in `17124e8`)

Four new games (39 in the registry). Shared change: `engine/ball.ts` gained an optional ceiling and springy "kick" pegs (off unless a game sets them; the Peg Garden, Bounce Back and ball tests still pass). Checks were kept to what these changes touch, at the grown-up's request; headless Chrome only.

- `npm run typecheck` and `npm run build`: passed. `npm test`: 130 tests across 45 files passed. New rule tests:
  - **Seesaw Balance:** the seesaw leans toward the heavier side, more for a bigger difference, and is level only when equal; every round is winnable with a real choice (heavy enough or not, spare blocks, distinct presents, at least two ways to make each weight); counting rounds never repeat a number.
  - **Teddy Doctor:** each ailment has its own cure; rounds always offer what helps, with no repeated patient or problem back to back; check-up orders differ round to round; every body part is found at its own spot on every patient.
  - **Bumper Garden:** every flower spot can be bumped by some launch; no launch traps the ladybug (each comes back to the pot within 40 seconds); flowers never overlap; color and number levels set out the right flowers.
  - **Quick Tricks:** one leaf keeps one friend dry, and only the big leaf covers two; exactly one partner sock, with color and pattern both deciding at pre-K; exactly one plank long enough.
- `BROWSER_SUITE=next` (new; `NEXT_ONLY=seesaw|doctor|bumper|tricks`): every level passed, each game run on its own (some levels in a rerun from the fixed level onward after a fix; changes made after a level passed were visual only), with Seesaw Balance 6, Teddy Doctor 4, Bumper Garden 5 and Quick Tricks 3 in portrait. Input was driven like a finger:
  - things dragged onto trays and back off;
  - tools aimed at body parts;
  - flips timed as the ladybug comes down;
  - leaves, socks and planks dragged into place;
  - the arrow tapped between tricks.

  Each level checks its gentle misses and hints (comparing presents and testing are never misses), the saved score and the sticker. Bumper Garden's first goal shots are steered, using the simulation, onto paths that bloom nothing wanted, so the miss-then-hint path is tested every time.
- `BROWSER_SUITE=world` passed with the larger places. `npm run test:offline` passed against a fresh build, after updating it for Monster Munch's move to index 14 in Daisy Meadow (Bumper Garden joined Bubble Beach, an earlier subject).
- Screenshots were reviewed mid-round. Bugs found and fixed while testing:
  - **Teddy Doctor:** a tap on one boo-boo could bandage its overlapping neighbour (taps now go to the nearest boo-boo), and on the clue level a tool aimed at the feet counted for a sore tummy (it now has to land nearest the part that hurts).
  - **Quick Tricks:** the hint glow drawn over the partner sock swallowed the touch meant for it (overlay drawings now ignore touches); and the bridge drawing was destroyed with the scene before the finale, which froze the show.
  - **Bumper Garden:** the right flipper was drawn mirrored the wrong way, and a bloomed flower's spin turned its number.
  - **Seesaw Balance:** the sun crowded a raised tray.
  - Springy bumpers kept the ladybug up for up to 48 seconds; a gentler kick keeps flights to about 18 seconds at most.
- Not checked:
  - A real iPad: tipping as weight, spoken-only clues, half-screen flipping for small hands, and whether the arrow between tricks is understood.
  - The combined browser flow was not rerun for these additions.

## Combined flow, and rules for the original games (2026-10-06)

No new games. This pass finished the automated part of the roadmap's §1: the combined browser flow, plus rule tests and play-throughs for the seven earliest games that had no rule tests of their own. Headless Chrome only.

- Combined `npm run test:browser` (every suite in one run) at `da6860b`, before this pass's code changes: **passed** in about 59½ minutes with no page errors. It ran against a detached worktree of that commit served on its own port, so edits elsewhere could not reload it.
- Rules moved into `logic.ts` with unit tests for Bubble Pop, Jelly Drums, Peekaboo Barn, Duck Pond, Shape Sorter, Color Garden and Pattern Train. Every game now has rule tests. `npm test`: 118 tests across 41 files passed. New tests check:
  - **Bubble Pop:** every bubble is a 100-unit target, color levels always send the asked-for color when none is showing, and a tap on overlapping bubbles goes to the right one.
  - **Jelly Drums:** tunes use real jellies, are never one note over and over, and short tunes never repeat a jelly back to back.
  - **Peekaboo Barn:** a different animal in each hiding place, the one asked for is there, and never the same one twice in a row.
  - **Duck Pond:** lily pads offer three nearby numbers including the answer; adding and taking-away stories stay within 1–10, leave at least one duck, and fit the pond; there is always a spare duck on the bank.
  - **Shape Sorter:** a piece for every hole; holes sit apart inside the lid, and a drop anywhere on a hole's rim lands in that hole.
  - **Color Garden:** something for every basket; a drop anywhere over a basket lands in it, even with six baskets crowded together.
  - **Pattern Train:** the visible cars repeat exactly the planned unit, so each empty car has one answer.
- `BROWSER_SUITE=originals` (new; `ORIGINALS_ONLY=bubbles|jelly|peekaboo|ducks|shapes|garden`): all 48 levels passed in one run (about 20 minutes) without page errors, after each game had also passed on its own. Every level of the six is played the way a finger would: bubbles tapped where they drift, wrong pops at a spot clear of right bubbles, jellies tapped along a tune, hiding places, ducks and lily pads, and pieces and fruit dragged into holes and baskets. Each level checks two gentle misses and the hint where answers can be wrong, the saved miss/hint counts and the sticker. Bubble Pop 9, Duck Pond 9, Shape Sorter 7 and Color Garden 6 are played in portrait. The suite ends by reloading and checking every round's history. Bubble Pop's wrong-tap step was flaky at first (it waited for a wrong bubble well away from every right one); it now taps a spot on a wrong bubble that no right bubble reaches, and passed three runs in a row.
- Bugs found and fixed:
  - **A finished round and its sticker could be lost.** Saves wait 300 ms to batch changes; a reload in that window started the write as the page closed, and it never landed (3 of 3 tries). The shell now writes the round and sticker when it finishes (0 of 3 lost afterward).
  - **Color Garden:** with six baskets, a fruit dropped near the edge of the right basket counted against its neighbour as a miss. The nearest basket now wins. The browser check fails with the old rule.
  - **Bubble Pop:** in the finale, a bubble that floated off the top before its turn in the pop cascade was popped after being destroyed (a page error). Tapping where a wrong bubble overlapped the right one counted a miss; the right one now pops.
  - **Shape Sorter:** the hint glow was switched off by an unmanaged `setTimeout`, which could run after leaving the game and cut a second hint short; it now counts down in the scene's update.
  - **Peekaboo Barn** no longer asks for the same animal twice in a row, and **Jelly Drums** no longer plays a tune that is one jelly over and over.
- After the fixes: `npm run typecheck` and `npm run build` passed, `npm run test:offline` passed against a fresh production build, and the `originals` suite passed as above. A second combined flow on the fixed code was stopped partway at the grown-up's request: every step through Song Maker 5 passed (world, pattern, memory, letters, robot, expansion, third and part of fourth); the rest of that run did not happen.
- Not checked:
  - A real iPad.
  - Judgments of fun and clarity for the newest ten (see [ROADMAP.md](ROADMAP.md)).

## Follow-on batch (2026-10-05, late evening; committed in `9648f35` and deployed)

Ten games from the idea notebook's batch were implemented locally: Word Monsters, Peg Garden, Fluffy Salon, Sound Garden, Little Helpers, Egg Catch, Mail Carrier, Photo Safari, Bounce Back and Dot Link (35 in the registry). Shared additions: `engine/ball.ts` (deterministic ball and peg physics), a tweener guard for destroyed targets, and drum, knock, chirp and croak sounds. These results cover automated checks in headless Chrome only.

- `npm run typecheck` and `npm run build`: passed.
- `npm test`: 100 tests across 34 files passed. New rule tests:
  - **Word Monsters:** every letter has a sound line, there are no lookalike letters side by side, and words fill left to right.
  - **Peg Garden:** every numbered peg can be reached by some aim (simulated across 30 boards).
  - **Fluffy Salon:** requests never start already done, and the "what to fix next" logic picks the right tool.
  - **Sound Garden:** questions are balanced, and the echo judge accepts a wobbly rhythm but rejects the wrong one.
  - **Little Helpers:** fruit never needs more helpers than the crowd, and lifting needs exactly enough.
  - **Egg Catch:** the hint's gate settings reach every exit.
  - **Mail Carrier:** streets are numbered in order and every house gets mail.
  - **Photo Safari:** exactly one animal matches each request.
  - **Bounce Back:** wall-bounce prediction and paddle angles are right.
  - **Dot Link:** loops, gravity and refills work, and a move that counts always exists.
  - **Shared code:** tests for the ball physics and the tweener guard.
- `BROWSER_SUITE=batch` (new; `BATCH_ONLY=monsters|pegs|salon|garden|helpers|eggs|mail|safari|bounce|dots`): all 52 levels passed in one run without page errors. Input was driven the way a finger would:
  - drags into word slots and real fur strokes;
  - shots chosen by simulating the physics;
  - a held finger steering a basket or paddle;
  - a second finger standing in for the grown-up on Bounce Back;
  - lines drawn through dot centers.

  Each level checks its gentle misses, its hint, the saved miss/hint counts, and the sticker.
- `BROWSER_SUITE=world` re-passed after the places grew (Daisy Meadow now has 31 games).
- `npm run test:offline`: passed against a fresh build. It now pages twice to reach Monster Munch, which moved to index 13.
- Bugs found and fixed while testing:
  - Word Monsters colored lookalike neighbors the same.
  - Little Helpers could start a lift twice and skip a fruit.
  - Mail Carrier (and, latently, Scoop Shop) destroyed a letter or scoop mid-tween, which froze the scene. The tweener now ends such tweens instead.
  - Photo Safari's flash and bush caught taps meant for the animals.
  - Fluffy Salon's mirror overlapped a color, and top strands covered the pet's eyes.
  - Sound Garden's bush drew overlapping outlines.
- Not checked:
  - The full combined `npm run test:browser` flow was not rerun after these additions.
  - No real-iPad check.
  - Device speech for letter sounds ("buh", "mmm") is a stand-in; whether it is usable phonics needs listening on the device, and recorded voices should replace it.
  - Judgments on fun and clarity remain open (see [ROADMAP.md](ROADMAP.md)).

## Arcade-inspired games (2026-10-05, evening)

Duckling Parade, Scoop Shop, Roundup and Bouncy Launch were added (twenty-five games), based on research into Neopets, Kongregate and other Flash-portal games ([ARCADE-IDEAS.md](ARCADE-IDEAS.md)).

- `npm run typecheck` and `npm run build`: passed.
- `npm test`: 69 tests across twenty-two files passed. New tests check, for each game:
  - Duckling Parade: there are always enough right ducklings, patterns form only in order, and extras get sent back.
  - Scoop Shop: orders use only tubs on the counter, every order can be finished by following the hints, and wrong, extra and out-of-order scoops bounce.
  - Roundup: there are always enough animals, with a spare when counting; animals enter only through the gate; and the bell finds too many or too few.
  - Bouncy Launch: a bigger pull flies farther, every cloud is reachable and forgiving, a target never repeats twice in a row, and landings are judged short, long or compared correctly.
- `BROWSER_SUITE=arcade` (new): all 25 levels passed, driven like a finger would: tapping the grass, tapping tubs, a finger kept behind each animal, and real pull-and-release drags. Mistakes, hint glows, peeks, the bell and exact saved scores are checked.
- Full `npm run test:browser`: every suite before `arcade` passed in one run. The suite then found a Duckling Parade fairness bug (below). After the fix, `arcade` passed in full, Duckling Parade passed three runs in a row, and `stickers` passed.
- `npm run test:offline`: passed. It now taps Daisy Meadow's next arrow, because Monster Munch has moved to index 8.
- Bugs found and fixed while testing:
  - Steering could get stuck after a lost pointer-up.
  - Taps were caught by whatever was drawn above the input layer.
  - `onTap` radii were in the critters' scaled-down units.
  - Ducklings could wait at the pond's edge.
  - Walking past a wrong duckling, or tapping between two ducklings, counted as a miss.
  - Herded animals could never step through the gate (the fence padding blocked the opening) and could be jostled through fences.
  - Exact-count pens finished without the child counting, so they now wait for a bell.
  - Pen signs hid behind animals.
  - The springboard snapped the pet onto the fingertip.
  - A tall order bubble was clipped.
- Not checked: a real iPad (touch feel for herding and pulling especially).

## Deeper ladders for Rainbow Fingers and Splish Splash (same day, later)

Rainbow Fingers now has 6 levels and Splish Splash has 8, so preschool and pre-K no longer top out early.

- `npm run typecheck` and `npm run build`: passed.
- `npm test`: 57 tests across eighteen files passed. New tests cover color mixing, coloring pages (distinct colors; mixing pages use only mixable colors), coverage counting only inside a picture, and Splish Splash plans (every part asked once, pairs in any order, first-then pairs in order).
- `BROWSER_SUITE=early` (new): all 14 levels passed in headless Chrome. Coloring levels check that rainbow paint only reminds, and that two wrong colors count as two misses and light the right pot. Bath levels check that the wrong part is noticed and isn't washed. Saved miss/hint counts and stickers match.
- Full `npm run test:browser`: every suite before `early` passed. One `early` run failed on a test artifact (a wide scrub of the "then" part also cleaned the neighboring "first" part, which correctly unlocked it), so the test now wiggles only in the middle of the wrong part. `early` then passed twice, and `stickers` passed on its own.
- Screenshots reviewed. Fixed on review: picture interiors drawn white over the paint (the outline's erase now renders in the same pass as the ring), and a leaf that read as a cloud.
- Not checked: the offline PWA (no asset, navigation or persistence changes) and a real iPad. Pictures are laid out once, so rotating mid-page keeps the first layout.

## Age trail and fourth expansion (same day, later)

The map became the age selection: four places on a switchback trail, every one open, each laying out all the games for its band. Song Maker, Puzzle Pals, Weather Wardrobe, and Sink or Float were added (twenty-one games).

- `npm run typecheck` and `npm run build`: passed.
- `npm test`: 51 tests across sixteen files passed. New tests cover places (one per band, climbing the map), subjects, song generation (one note per beat, never a single pitch, patterns continue their first bar, higher rows sound higher), puzzle drops (each place found from its center and off-center, off-frame drops ignored, small boards forgiving), wardrobe outfits (items belong to one weather, needed items always offered, no ambiguous distractors), and sink-or-float sets (always both floaters and sinkers, surprises only where asked). Save tests now cover dropping the retired opened-regions list.
- `BROWSER_SUITE=world`: hatching, starting in her place, swiping (a swipe that starts on a game scrolls instead of opening it), arrows, launching from Starry Peak at pre-K levels, holding home back to the place, a birthday walk up the trail, the parent gate including a game played in another place, and settings.
- `BROWSER_SUITE=fourth`: all 26 levels of the four new games, with free play, two mistakes and a hint wherever answers can be wrong, guesses that never count as misses, exploring drops that never count, exact saved scores, stickers, Puddle Lagoon showing all four, and reload persistence.
- `npm run test:offline`: passed against a fresh production build, starting in Daisy Meadow and finishing Monster Munch offline.
- Screenshots of the map, every place, and every new level were reviewed. Fixed on review: a pet covering a place label (switchback layout), a clipped last landmark, a second purple pet as the Feelings landmark (now feeling balloons), song cards without row stripes, picture hills spilling past the frame, a ball hidden behind the dog, coat and boots overlapping, a forecast card over the sun, tiny mitten icons, two splashes sharing one spot, and a blue wave on a blue button.
- Code review fixes: a cancelled touch no longer freezes a place; quick weather taps can't leave the previous weather's clothes; an unfinished puzzle frees its picture; the listen level ignores taps until the tune has played once.

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
| Age trail map | Four open places, the pet at her own place, a birthday walk up the trail after a band increase, tapping any place to walk there and enter |
| Places | Start lands in her place; games laid out per band; swipes scroll and never open a game; arrows page; launching plays at the place's levels; holding home returns to the same place and scroll; the island button returns to the map |
| Parent gate | Both-corner hold opens the HTML panel; changing child name, pet name/color, band, and session length applies |
| Pattern Train | All nine levels, wrong choices, hint glow, bell audition/confirmation, two gaps, and saved rewards |
| Memory Match | All nine levels, unpenalized exploration, known-partner mistakes, hints, matches, and saved rewards |
| Letter Trails | Wrong strokes and hints, straight/rounded modes, short words, accented-name normalization, a full A–Z round, and saved rewards |
| Robot Path | All six levels, collisions, retry/clear, hint glow, route execution, and saved rewards |
| Size Parade | All eight levels, biggest/smallest comparisons, ascending/descending drag order, two misses then a hint, exact saved scoring, stickers, and portrait play |
| Bug Builder | All seven levels, guided matching, model copying, both mirror columns, reusable stamps, unpenalized outside drops, hints, saved scoring and stickers, and portrait play |
| Story Steps | All seven levels, ordering and missing-middle modes, unrelated distractors, replay of placed cards, completed-story narration, hints, saved scoring and stickers, and portrait play |
| Growing catalog | Scrolling Daisy Meadow with the arrows to an off-screen Size Parade, launching it, and returning to the same scroll; reward/history reload for every newer game |
| Sticker book | Five scenes, drag placement, normalized coordinates, reload persistence, removal back to the tray, tray paging, portrait resizing |
| Feelings Faces | Free-play bubbles for all four feelings, hugging a sad pet, face matching, named feelings, helpers for needs, event causes, friends' feelings, mistakes, hints, saved scoring and stickers, portrait play |
| Monster Munch | Tap feeding, counting along with tap and drag, one cookie each, exact orders with the bell, two-food orders, refusals, fair sharing with hand-backs, number pads, saved scoring and stickers |
| Song Maker | Free-play loops on the beat, shadow and card copying, pattern continuation, the by-ear level, mistakes, hints, saved scoring and stickers |
| Puzzle Pals | Two to twelve pieces, a pre-placed half at lap, unpenalized off-frame drops, wrong places, hint glow on piece and place, the picture coming alive, saved scoring and stickers |
| Weather Wardrobe | Tapping the sky through sun, rain and snow, picking one item, every item, and packing for a trip, explained wrong choices, hints, saved scoring and stickers |
| Sink or Float | Tap drops with floating and sinking, spoken results, free guesses, sorting with in-water tests for wrong sorts, hints, saved scoring and stickers |

Screenshots from the runs are in ignored `test-results/browser/` and `test-results/offline/`. The map, hatching, region pages, all new games, portrait layouts, and sticker scenes were visually reviewed. The map pet was moved clear of the Counting Cove label, and a sea-scene bubble was kept within the page border.

## Reproducing checks

See the [README](../README.md#browser-checks) for the maintained suite list, including `early` and `arcade`. Browser scripts use a fresh, isolated context. `BROWSER_EXECUTABLE` can select an installed Chrome executable, and `GAME_URL` can select another local server port. Set `BROWSER_SUITE` to one suite name, or omit it to run the combined flow. The standalone sticker suite supplies test stickers, while the combined flow uses the rewards earned by its game play-throughs. New suites in the working tree need their own recorded results; they are not covered by earlier entries here.

## Remaining device checks

A physical iPad was not available. Confirm Safari speech voices (including their offline availability), synthesized audio after the first touch, real finger tracing and dragging, orientation changes, Add to Home Screen, and Guided Access on the target iPad. Automated Chrome checks do not establish those device-specific behaviors.

Letter Trails currently supports capital A–Z. Accented Latin names normalize to these letters; unsupported names fall back to PIP. The previous remote design artifact was not imported in full; current decisions and this implementation's status live in the repository.
