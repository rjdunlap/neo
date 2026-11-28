# Critter Sort level 10: Pick the signs (definition)

**Built:** level 10 (PR #2371), built 2026-11-28; this is the last level in the Critter Sort ladder, so no further section to read.

Defined 2026-11-28 on `claude/define-critter-sort-pick-the-signs` ([PR #2367](https://github.com/rjdunlap/neo/pull/2367)) as slice 9 of the [Critter Sort deep dive](../deep-dives/critter-sort.md#build-slices-in-order), from its [level 10 row](../deep-dives/critter-sort.md#new-levels-on-top). Decision 3 there was settled on 2026-10-23: this level is **play only**, and nothing is kept in the treehouse or the journal. Every [open decision](#open-decisions) below has a default the build uses, so none waits on the developer.

**What it adds:** level 10 of `critter-sort` (`src/games/critter-sort/`), filling the ID that has been reserved for it. Six critters wait on the grass beside two empty overlapping hoops. Three picture signs are offered, and she taps two of them to put them on the hoops. Then she sorts the six critters by **her own** rules: left, right, the middle for both, or the leaf mat for neither.

**Learning goal:** a sort is made by a rule, and the person sorting can choose it. The same six critters make a different diagram under different signs. Level 4 asks her to work a rule out from a finished sort, and level 8 has the game change the rule. Level 10 puts the rule in her hands, then holds her to it. It builds on Common Core K.MD.B.3, which asks children to classify objects into given categories; choosing the categories herself goes one step past it. It makes no claim beyond that.

## Bands and ladder

| Band | Now | After | Where it sits |
| --- | --- | --- | --- |
| `school` | `{ min: 2, max: 13, order: [2, 12, 3, 13, 4, 5, 7, 8, 9, 11] }` | `{ min: 2, max: 13, order: [2, 12, 3, 13, 4, 5, 7, 8, 9, 10, 11] }` | After *This but not that*: by this point she has sorted under every kind of given sign and worked a rule out from a finished sort |
| `preschool`, `prek` | unchanged | unchanged | Not offered. The overlapping diagram is already a pre-K level, but choosing two rules and then keeping to them is a second step that pre-K does not need yet |

ID 10 is outside every band's order today, so no saved level or pin can hold it, and the grown-ups' pin list (which follows the order) never offered it. Nothing is renumbered. `planFor(10)` currently falls through to level 9's plan, because `PLANS` has nine entries. The build adds an explicit branch for 10, like the one for `COUNT_PLAN`. `entryLevels` stays `[6]`.

## The plan

`PICK_PLAN: SortPlan = { mode: 'pick', critters: 6, rounds: 2, scarf: true, name: 'Pick the signs: choose two of three pictured signs for the overlapping hoops, then sort six critters by your own rules' }`.

- `scarf: true` gives the seven-rule pool of levels 7–9 (`rulesFor`), so the offer has room to vary.
- There is no worked example: the rules are not known until she picks them.
- `hasNeitherMat('pick')` is true. Every critter must reach a hoop or the mat, as at level 3.

## A round, step by step

Two rounds make one sticker. Each round deals a new seeded group of six critters and three offered signs.

### 1. Choose (never counted)

1. The hoops start empty, with blank sign boards above them. The three offered signs sit in a row **across the empty hoops** at the hoops' height (`layout.choices` x positions, `centers[0].y`). They use level 4's guess tiles: 140 × 120 drawn, with a 148 × 128 hit area. They sit there rather than in level 4's bottom row because, upright on a phone, the bottom row of loose critters is at `h - 25`, which would overlap a tray at `h - 90`. The empty hoops hold nothing to cover yet.
2. Spoken (`ctx.instruct('sortpick.choose')`): "You choose the rules! Tap two signs to put on the hoops."
3. The first tap sends that sign to the left board and the second to the right board, each with a short tween. A sign already on a board cannot be tapped from the tray again, so the same sign never goes on both hoops.
4. Until the first critter is dropped, tapping a board's sign sends it back to its tray place. That is free.
5. When both boards are full, the third sign fades out and is untracked. The tray is gone before any critter can be dragged. Critters are not draggable while she is choosing (`drag.enabled = false`), and a tap on one says the choosing line again.
6. Spoken (`ctx.instruct('sortpick.go', { a, b })`): "Your hoops! One is for critters {a}, the other for critters {b}. Critters that fit both go in the middle. Critters that fit neither go on the leaf mat." The pet repeats this line from then on.

### 2. Sort by her rules

1. From here it is level 3's `venn` behaviour with the explicit leaf mat, and `round.rules` set to her two choices in board order. `placeOf`, `sortPlaceAt`, `spotFor`, `hintFor` (with `mat`) and `nextToSort` are used unchanged.
2. **The signs lock at the first drop.** Changing a rule after sorting has started would have to undo placed critters, and level 8 already teaches re-sorting. The [alternative](#open-decisions) is a "new signs" button.
3. **The middle or a one-sign part may be empty.** Her choice can be two signs no critter shares (`brown` and `white`), or one sign whose critters all fit the other too. That is a true result about her rules, not a fault. When the round finishes with an empty middle, she hears `sortpick.nomiddle`: "No critter fits both of your signs, so the middle stays empty. That is a real answer!" An empty one-sign part needs no line, because the diagram already shows it.
4. When all six are placed: `sortpick.yay`, "You made your own sort! Your hoops were critters {a} and critters {b}." Round 2 deals new critters and a new offer.

## Misses, hints and glow

- **Choosing is never a miss**, and neither is taking a sign back. Signs are not right or wrong.
- A critter dropped in the wrong part, judged against **her** signs, is one miss with the existing spoken reasons: `sort.isnot`, `sort.both`, `sort.mat.yes` and `sort.mat.hoop`, filled with her rules' words. A wrong drop on the leaf mat explains which hoop it belongs in, as at level 3.
- Putting a critter back on bare grass is free.
- Two wrong drops in a row light the existing `hintFor` glow on the critter just missed and its right part, counted as one hint.
- Nothing about her choice is saved, filed or shown later: no treehouse creation, no journal entry, no "favourite rule".

## Logic (`logic.ts`)

- `SortMode` gains `'pick'`. `PICK_PLAN` sits beside `COUNT_PLAN`, and `planFor(10)` returns it. `PLANS` indices never move.
- `makePickRound(plan, rng, avoid?)` deals six critters as `makeRound` does: all different, and the scarf drawn only because the plan has `scarf`. It then picks three offered rules from `rulesFor(plan)`. It retries until the [offer constraints](#offer-constraints) hold. `avoid` is the previous round's offered set (sorted and joined), and a round never repeats it. The round returns `{ rules: [], critters, options }`, and the scene fills `rules` with her choices.
- `hasNeitherMat` returns true for `'pick'`. `examplePlaces('pick')` is `[]`.
- `pickOrder(round, rng): [Rule, Rule]` is the ghost finger's choice: a seeded random two of the three, which is all the deep dive asked of the bot. Sorting then follows `nextToSort` with the mat.

### Offer constraints

For every ordered pair (A, B) of the three offered rules (six assignments):

1. Each hoop holds at least one critter: some critter fits A, and some critter fits B.
2. Neither sign takes everything: some critter fits neither A nor B, so the leaf mat is in play. Without this, picking two signs that cover the group would leave the mat unused, and she would learn nothing about "neither".
3. The two signs sort the group differently: some critter fits A but not B, or fits B but not A. Otherwise both hoops would hold the same critters and the middle would be the whole sort.

Constraint 3 only rules out pairs that split this group the same way. A pair may still leave the middle empty (point 3 of [sorting](#2-sort-by-her-rules)), and that stays allowed.

## Rule tests (`logic.test.ts`)

Seeds 0–199 throughout.

1. **Every choice works.** For every round and every ordered pair of its offered signs, the three [offer constraints](#offer-constraints) hold, and `placeOf` gives every critter exactly one of `left`, `right`, `both`, `out`.
2. **Real choice.** Three distinct offered rules, all from `rulesFor(PICK_PLAN)`. At least two of the three pairs give different diagrams (some critter changes place), so the choice changes the sort.
3. **Fresh rounds.** Round 2's offered set never equals round 1's. The six critters are all different, by kind, hat and scarf.
4. **Hints lead somewhere.** From any partly sorted state under any chosen pair, `nextToSort(..., mat = true)` returns an unplaced critter and its place. After a miss, `hintFor` returns the missed critter.
5. **Ladder.** `planFor(10)` is `PICK_PLAN`, while `planFor(9)` and `planFor(11)` are unchanged. The school order is the old order with 10 inserted between 9 and 11, so every earlier ID keeps its relative place. Pre-K and preschool are unchanged.
6. **Older levels untouched.** The existing suite passes unchanged. `makeRound` is not edited, so earlier levels deal exactly as before.

## Scene (`index.ts`)

- The `options` list holds the three tray tiles, as at level 4. A `phase: 'choose' | 'sort'` field gates drags and taps.
- The board signs are drawn only after a choice. `ruleIcon(rule)` is reused, so there is no new art.
- While choosing, `busy` stays false. Tile taps use `onTap` with a 350 ms cooldown, and the tiles keep level 4's touch-down feedback.
- `destroy()` already removes `options`. The tray fade's tween is scene-owned (`ctx.tw`), and its completion checks that the round is still current, as the example line does today.
- `autotouch()`: tap the two tiles `pickOrder` names, wait for `sortpick.go`, then drag as at level 3.

## Voice lines (`voice.ts`)

New: `sortpick.choose`, `sortpick.go`, `sortpick.nomiddle` and `sortpick.yay`, with the texts above (prefix `sortpick`, which the clip renderer skips, so they stay on device speech and need no rendered clip in a cloud build). Then run `node scripts/content-barrels.mjs`. Device speech says them until the next clip batch, as for the fresh rules.

## How-to card (`howto.ts`)

- Add `{ from: 10, to: 10, text: 'Tap two of the three signs to put them on the hoops (tap a sign on a hoop to take it back before sorting). Then drag each critter to the hoop its sign fits, the middle for both, or the leaf mat for neither.' }`.
- Audit: every existing Critter Sort line is scoped to its own ID today (`from`/`to` pairs for 2–13, `to: 1` for 1), so none shows at 10. The build re-checks this by reading the card at level 10.
- **Co-play:** "Ask why she picked those two signs, then you pick two and she sorts yours." There is no right answer and nothing is recorded.
- **Off-screen:** sort the laundry or the toy box by a rule she chooses, then by one you choose, and see how the piles change.

## Build and check tier

**New interaction**, because choosing and placing signs is a new action. The drag, hoops, mat, hint and sort bot are unchanged.

- Run `npm run typecheck`, `npm run format:check` and `npm run lint`.
- Run Critter Sort's rule tests, plus `howto.test.ts`, `registry.test.ts`, `barrels.test.ts` and `game-docs.test.ts`.
- One filtered scripted play of level 10 at the school band, upright at 390 × 844:
  - pick two signs, take one back and pick again;
  - make one wrong drop, then two in a row for the hint;
  - finish both rounds and see the sticker.
- Take one portrait screenshot of the choosing tray across the empty hoops, checking the shell's top corners and the pet's clearance.
- Run `BROWSER_SUITE=fingerdemo FINGER_ONLY=critter-sort FINGER_LEVELS=10 FINGER_BAND=school`.
- No `npm run build`, because no shared file or asset changes. No `world`, couch or offline suite.

### Expected files

- Code: `src/games/critter-sort/{logic.ts, logic.test.ts, index.ts, layout.ts, voice.ts, howto.ts}`, the generated barrels, and the Critter Sort case in `scripts/browser/suites/woods-batch.mjs`.
- At closeout: `docs/games/critter-sort.md` (with `npm run game-docs`), the deep dive's slice 9 and level-10 row, this definition's status line, the Next ten line, a verification entry and its coverage row.

## Open decisions

Each has a default the build uses.

1. **How many signs are offered.** Default: **three, pick two**, so there is a real choice and one sign is left out. The alternative is two signs she only arranges, but swapping left and right does not change which critters go together.
2. **Changing signs after sorting starts.** Default: **locked at the first drop.** The alternative is a "new signs" button that hops every critter back to the grass with no misses, as level 8's sign flip does. It is worth adding if a playtest shows her wanting to change her mind.
3. **One hoop or two.** Default: **two overlapping.** Overlapping hoops give every critter exactly one right place under any pair she picks. Separate hoops would leave a critter that fits both signs with no right place. A one-hoop variant (pick one of three) would be easier but would duplicate level 4's three tiles without the sorting.
4. **Pre-K.** Default: **school only.** Revisit after a playtest of the school level.
