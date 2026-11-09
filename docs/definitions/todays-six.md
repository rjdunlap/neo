# Today's six: the daily shuffle (definition D10)

Requested by the developer on 2026-11-03: a daily shuffle mode, reachable from a URL or the home screen, where each day six games are chosen at random and presented at a preset level from the profile's age (grown-up when the profile is not a child's), using only games and levels that make sense for that band, with a mix of kinds of challenge and things to learn, after Nintendo's Brain Age daily training. Action **D10** of the [discovery actions](../ROADMAP.md#discovery-actions). A trial already exists: **Today's six** at `?daily` on the site root ([PR #1088](https://github.com/rjdunlap/neo/pull/1088), 2026-11-01; `src/content/daily.ts`, `src/app/scenes/DailyScene.ts`). This definition turns the trial into the requested feature in three slices.

This is a shell feature, not a game. It adds no game ID, no learning claim of its own, no how-to card and no bot. Each of the six is an ordinary round of an existing game with that game's goal, card, demo, accounting and sticker.

## What the trial does today, and what changes

| | Trial (PR #1088) | Requested |
| --- | --- | --- |
| Entry | `?daily` on the root (and the island); after "Who's playing?" the six stand where Home would | Keep `?daily`, and add a **Today's six button on Home** so it is one tap from the normal flow; Back from the six goes Home |
| Who | The active profile's band | Same; a grown-up profile gets the grown-up set; no profile means "Who's playing?" first, as everywhere |
| Pool | Touch games listing the band; a grown-up gets grown-up and early-school games | Same, plus an explicit per-game eligibility rule and a registry test, so the pool is inspectable |
| Levels | Grown-ups: a seeded level from the top third of each game's ladder; children: their saved level | **Every band plays a preset level** from the band's own ladder, chosen with the day; a grown-up's pin wins; the round does not move her saved level |
| Mix | One subject (`region`, a land) per game before any repeats | **One kind of challenge per game** before any repeats, then the land spread; the seven kinds are below |
| Across days | Tick for a game played today; no streak, nothing missed | Same. Finishing all six gets a small flourish and nothing else |

## Brain Age, and what the island keeps

Brain Age's daily training offers a handful of short exercises (calculation, memory, reading, Stroop-style tests), stamps a calendar for each day trained, and measures a "brain age". The [planning rules](../ROADMAP.md#planning-rules) refuse the calendar, the score and the pressure: **no streak, no stamps across days, no measurement of the player, no timer, no notification, nothing marked missed.** What carries over is the shape: a short, varied, ready-made set for today, so nobody has to choose, and the whole set is done in one sitting. The six are a suggestion; All games stays one tap away, every game keeps its ordinary sticker, and Explore is unchanged.

## Requirements

### R1. Entry and return

- **URL:** `?daily` on the root keeps working (and on the island at `classic/` until the cutover). After "Who's playing?" it opens the six directly.
- **Home:** a round button on the root Home ("Today's six", a six-tile icon; spoken `daily.open` on open) next to the existing Explore button, laid out from `view` with the pet and corner buttons clear. It is always there; nothing gates it, and it is never the only way to a game.
- **Return:** the origin `{ daily: true }` already brings a round's Home back to the six. The six page's Back goes to Home when it was opened from Home or `?daily`; the tiles button still opens All games; the "who" button is not needed on the page.
- Couch play has no daily set.

### R2. Who it is for

- The active profile's band decides everything: a child's band gives a child's set, a `grownup` profile the grown-up set. "Adult if not a child" is the grown-up profile; a device with no profile goes through "Who's playing?" as everywhere, where a grown-up profile is one tap.
- Family members at the same band on the same day see the same six (one seed per day and band, like a newspaper's puzzle page). Per-profile seeding is an [open decision](#open-decisions).

### R3. The pool: games that make sense for the band

- A game is eligible for a band when it is touch-playable (`playsByTouch`), **lists that band itself** (no younger top-up; every band has far more than six games today: lap 53, toddler 74, preschool 95, pre-K 118, early school 109, grown-up 16), and is not opted out.
- **Opt-out:** a module may set `daily: false` for a round that does not suit a ready-made challenge (a free creation with no check, or a calendar-style round). The build lists the opt-outs; a registry test keeps the flag to real IDs and asserts every band still has at least six eligible games in at least five kinds.
- Grown-ups: the games made for grown-ups plus early-school games at their hardest, as in the trial, with two grown-up games first. Whether that blend is right is the developer's call after playing ([open decision](#open-decisions)).
- Story rounds, couch courses and controller-only games are never in the six.

### R4. The six and the mix

- **Seed:** the local calendar day (`dayKey`) and the band (`daySeed`); the same build gives the same six all day on every device at that band and a new six at her midnight. The page computes the six when it opens; a day change while she plays does not swap the six under her until the page is opened again. Adding a game to the registry changes later shuffles; that is fine.
- **Six distinct games.** When the band has fewer than six eligible games (none does today), the page shows what there is.
- **Kinds of challenge.** Each touch game names one `challenge` kind, from a small fixed list, in its module; a registry test fails for a touch game without one. The seven kinds, chosen so every band has several:

  | Kind | What the round asks | Examples (by ID) |
  | --- | --- | --- |
  | `numbers` | count, compare, add, measure | `lemonade-stand`, `seesaw-balance`, `orchard-rows` |
  | `words` | letters, sounds, words, reading, writing | `letter-trails`, `word-search` |
  | `logic` | patterns, rules, deduction, evidence | `rule-machine`, `not-always`, `picture-logic` |
  | `space` | building, routes, shapes, fitting, planning a layout | `ferry-jam`, `island-bridges`, `pixel-pictures` |
  | `music` | listening, rhythm, tunes | `sing-along-barn`, `little-conductor` |
  | `noticing` | memory, spotting, sorting what was seen, science observation | `critter-sort`, `habitat-helpers`, `day-by-day` |
  | `hands` | aiming, tracing, steering, timing a touch | `bubble-pop`, `roundup`, `dot-link` |

  The examples are a guide for the classification pass; the pass reads each game's `skills` and GAMES.md entry and gives it the kind its round mostly asks for.
- **Picking:** a seeded shuffle of the pool; take one game per kind until the kinds present at that band are used, then start the kinds again, preferring a land (`region`) not yet taken. The result at a band with seven kinds is six different kinds; at a band with fewer, at most two of a kind. Grown-ups take their two grown-up games first, then fill kinds.
- **Preset levels:** each pick gets a level from its game's ladder **at the band the round plays** (`playBand`), seeded with the day: the play-order ladder (`levelsInOrder`) with entry levels left out; grown-ups keep the trial's top third. A grown-up's pin for that game wins over the preset. The card shows the level as a dot row (no reading), and the intro's level arrows still work, so a grown-up can step it before Play.
- **Accounting:** the round finishes through the shell as any round: sticker, history, stats. It records with `adapt` off (as a story round does), so a preset level, which is the day's choice and not her progress, never steps her saved level up or down. Again and Next level on the celebration work as they do everywhere.

### R5. The page

- Six picture cards (the game's hub icon, its grown-up name, the level dots), a tick on each game with a finished round today (from round history, any level, as in the trial), portrait and landscape, every target at least 100 units.
- Tapping a card speaks the game's title and opens its intro with the how-to card as usual; a direct entry to a later level is what the how-to card is designed for.
- **All six done:** the page shows a small flourish (the pet cheers, a few particles; `daily.done` spoken) when every card is ticked. Nothing is recorded, nothing is awarded beyond the six ordinary stickers, and the cards stay playable.
- **Grown-ups' page:** one plain-HTML line that Today's six is a different mix each day, chosen by age, and that nothing is missed; optionally today's list with each level's `describeLevel` (slice 2).
- No new save field. If a record across days is ever wanted, it is a separate developer decision, not an extension of this one.

### R6. Play all six in order (optional)

- A **Play all** button hands the six, at their preset levels, to the [Little surprises](little-surprises.md) mix planner (D2b): the preview sheet, Next stop, Skip, pause and ending rules apply unchanged. The planner's level rule gains one named input, a per-item preset level, used only by the daily; D2b's own mixes keep `store.levelFor`.
- The ending returns to the six page with its ticks.

### R7. Voice

- `daily.open` (exists), `daily.done` (exists), and a line for the Home button's tap. Card taps use each game's `titleLine`. Navigation needs no reading.

## What the rule tests assert

In `src/content/daily.test.ts`, pure, over the real registry:

- The same day and band give the same six; a different day gives a different six at least once across thirty days; six distinct games.
- Every pick lists the band (grown-ups: `grownup` or `school`); no opted-out, story-only or controller-only game appears; every band has at least six eligible games in at least five kinds.
- Every pick's level is in `levels(playBand)` and is not an entry level; a pin is used when valid; grown-up levels are in the top third.
- Kinds: at a band with at least six kinds present, the six are six different kinds; otherwise no kind appears more than twice; lands do not repeat before they must.
- Grown-ups: the first two picks are grown-up games.
- Registry: every touch game has a `challenge` kind; `daily: false` names real IDs only.

## Slices

1. **Home entry and preset levels for every band** (status built, [PR #1174](https://github.com/rjdunlap/neo/pull/1174); `goodnight-room` is the one `daily: false` game, and only a round opened from the card with a start level records with `adapt` off, so a discovery opened from the six still adapts): the Home button, Back to Home, the origin's return, preset levels from the band's ladder with pins, the dot row on the card, recording with `adapt` off, the eligibility rule and `daily: false`, the grown-ups' page line, tests above except the kinds. Files: `src/content/daily.ts`, `src/content/daily.test.ts`, `src/app/scenes/DailyScene.ts`, `src/app/scenes/HomeScene.ts`, `src/creatures/home-layout.ts`, `src/app/scenes/GameScene.ts` (the `adapt` flag from the origin), `src/games/types.ts`, `src/games/registry.test.ts`, `src/content/voice-script.ts`, `src/parent/panel.ts`.
2. **Kinds of challenge** (status built, [PR #1175](https://github.com/rjdunlap/neo/pull/1175); `challenge` on all 163 touch games, kind-first pick with a land preference, the pet in the card page's guide corner and a small all-six flourish; `garden-rows` is a Latin-square bed, so it is `logic`, not `numbers`): the `challenge` field on every touch game (one classification pass, a table in the PR description), the registry test, the kind-first pick and its tests, and the all-six flourish. Files: every `src/games/*/index.ts`, `src/games/types.ts`, `src/content/daily.ts`, `daily.test.ts`, `DailyScene.ts`.
3. **Play all six** (status define until D2b's planner takes a preset level cleanly): the Play all button through the mix planner, its ending back to the six, and the planner's preset-level input with its event tests.

## Check tier

Shell/navigation: typecheck, unit tests, build, one filtered browser flow (Home, Today's six, one card, a finished round, back on the six with a tick, portrait screenshot), and the production offline check once for slice 1 because Home's navigation changes. `world` only if the island's route changes. Slice 2 is logic plus one screenshot. Slice 3 reuses D2b's filtered mix flow. An iPad and a child's reaction stay person checks.

## On a phone, and playing all six (built 2026-11-09)

On a phone the six are the whole root, R6's Play all is built as a play button plus a next-of-six tile on each daily round's result (not through the mix planner), and a grown-up's profile can leave a playtest note per game and day: [the daily playtest slice](phone-portrait.md#the-daily-playtest-slice-a-phone-is-todays-six-alone-built-2026-11-09).

## Open decisions

For [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md) after slice 1 is played:

- **Shared or per-profile six.** Proposed: shared per band and day (siblings at one band see the same six). Per-profile seeding is a one-line change if two children at a band should differ.
- **The grown-up blend.** Proposed: keep two grown-up games plus four early-school games at their hardest until the grown-up catalog (16 games) is large enough for six.
- **Recently played games.** Proposed: the six ignore history (a day's six are the day's). Avoiding the last few days' games would read history and is not needed.
- **The island at `classic/`.** Proposed: `?daily` only, no button, since the cutover removes it.
