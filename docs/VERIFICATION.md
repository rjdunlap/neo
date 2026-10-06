# Puddle Island verification

This is a dated record of checks, newest expansion first. The newest entry covers subject cards and four more games (43, in the working tree, only partly checked); the next ones cover four games (39, in the working tree) and a combined run with rule tests for the original games, both on 2026-10-06; the follow-on batch below covers all 35 games deployed on 2026-10-05; earlier sections describe earlier snapshots and retired navigation. These results do not automatically validate later working-tree changes or establish what is deployed. Outstanding work and device checks are tracked in [ROADMAP.md](ROADMAP.md).

## Subject cards, Stamp Studio, Pet Kitchen, Rhythm Neighbors and Tangram Town (2026-10-06, midday; working tree, partly checked)

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

## Seesaw Balance, Teddy Doctor, Bumper Garden and Quick Tricks (2026-10-06; working tree, not committed)

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
