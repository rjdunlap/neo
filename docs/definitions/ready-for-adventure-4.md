# Ready for Adventure, level 4: The request changed (definition)

Defined 2026-11-25 as RA4, [slice 5](../deep-dives/subjects/routines-self-care.md#build-slices-in-order) of the routines-and-self-care study, from the [level 4 row](../deep-dives/subjects/routines-self-care.md#first-games-proposed-ladder) and the school row of its age table. Docs only: no code, ID, voice line, art or save field exists yet. Levels 1–3 are built and unchanged ([definition](ready-for-adventure.md), [page](../games/ready-for-adventure.md)); level 5, *One workbench*, is a separate later packet. Every prop is still imaginary parade gear: no washing, dressing, food, toilet or sleep step is drawn or spoken, so the practical-care reviewer does not gate this.

**Built 2026-11-25 (PR #2177):** `revise.ts`, `revise-scene.ts`, `parade.ts`; the seeded rounds draw from the same change kinds, and the authored flag + drum then flag + bell round (`firstRound`) is kept for tests, not forced on a first play.

**Fun action and purpose:** the card shows what the parade needs and she packs it, then taps **Check**. The companion cheers, and then the parade changes: a new card slides in. Now the bag must be repaired, not rebuilt: take out what is no longer wanted, put in what is new, tap Check again, and the revised parade plays. The learning purpose is **compare a plan with the plan's new goal and repair only the difference** (Head Start P-PMP 4 and 5: flexible, revisable plans), which the first three levels never ask because their request never changes and packed is final.

## Identity and school window

- **Why a school window:** levels 1–3 decide *what is ready* and *which job first*; level 4 decides *what is different* between a bag and a card, and treats the first answer as a draft that can be revised. A six-to-eight-year-old has the number sense to match a set of up to three pictures against another, plus optional word labels (below), and the earlier levels' satisfying drag is kept. This is the study's own school entry, so the answer to "is the new decision worth a school window" is **yes, provisionally**; the person check ([DEVICE-CHECKS](../DEVICE-CHECKS.md)) is parked.
- **Not Story Steps or Weather Wardrobe:** neither revises an answer after it was accepted. **Not Second Chance Shed or a "redo" game:** nothing here is a mistake being repaired; the *request* changes through no fault of hers, and an unrevised bag is simply a bag for the old request.
- **Not Village Planner:** a pending proposal for ages 9–12 about shared resources and fewer journeys. Nothing here counts journeys, trades off or optimises.
- **Land fit:** Barnyard lists 13 games, of which 11 show at `school`; this makes 12. The land pages rather than shrinks (`landLayout` returns null instead of a smaller target), and `lands.test.ts` sweeps every count, so no land change is needed. Cozy Village is not involved (its decor failed at 12).

## The model (`logic.ts`, additions)

- **Props:** `flag`, `drum`, `bell`, `ball`. At level 4 every prop is `ready`: there is no `bare` state, so the prerequisite rule is retired for this level, not removed (levels 2–3 keep it).
- **A request change:** a level 4 `Round` carries `requests: [PropId[], PropId[]]` (size 1–3 each, props distinct within a request, the two sets different) and `phase: 1 | 2`; `request` stays the current phase's set so existing code keeps reading it. The change kind is seeded:

  | Kind | Weight | Example | Edits needed |
  | --- | --- | --- | --- |
  | `swap` | 3 | flag + drum → flag + bell | take one out, put one in |
  | `drop` | 1 | flag + drum + bell → flag + bell | take one out |
  | `add` | 1 | flag + bell → flag + bell + drum | put one in |

  Every change needs at least one edit and at most two. The ball is requestable at level 4 (its silhouette, a ball, differs from the others).
- **Actions:** `pack(prop)` (a prop on the bench goes into the bag) and `unpack(prop)` (a prop in the bag goes back to the bench). Both are legal at any time, in any state, for any prop, and both are **free**: nothing is refused, so no bag can be unsolvable, and packing an unrequested prop is play, not a miss (level 1's `notRequested` refusal does not exist here).
- **`diff(state)`:** the props in the bag but not on the card (`surplus`) and the props on the card but not in the bag (`missing`); `distance = surplus + missing`.
- **`check(state)`:** the one deliberate comparison. `distance == 0` → `pass`; otherwise `mismatch` naming the first surplus (card order does not matter; the first by fixed prop order) else the first missing. An **empty bag** Check is `empty`: free, spoken ("Nothing is in the bag yet"), never a miss, because she has not yet made a deliberate comparison.
- **Phases:** a `pass` in phase 1 starts the change (phase 2, the new card; the bag is untouched, so the revision starts from what she packed); a `pass` in phase 2 is `done`. A change cannot make the round unsolvable: any bag reaches any request by `distance` edits.
- **`nextEdits(state)`** returns every edit that lowers `distance`; **`hintFor(state)`** returns one: remove the first surplus, else pack the first missing (teaching the comparison before the addition). Both are empty only when `distance == 0`.
- **`pickRound(level 4, rng)`** seeds the first request (two props for `swap` and `drop`, one or two for `add`, sized so that the second request has 1–3 props), the change kind, the bench order and the flag and pattern variations. The authored first round is the study's: flag + drum, then flag + bell by `swap`.

## Gestures and accounting

The bench, the bag shelf and the Check button are targets; both drag and tap-select, tap-place work as at levels 1–3 and call the same `judge`.

| Gesture | Result | Counts |
| --- | --- | --- |
| Bench prop into the bag, or a tap on a bench prop, then the bag | Packs; it appears on the **bag shelf** | Nothing |
| Shelf prop dragged out to the bench, or tapped (one tap) | Unpacks; it hops back to its bench slot | Nothing |
| Any other release or tap on scenery | Floats home / wiggle | Nothing |
| Tap the card | Speaks the current request ("Let's bring the flag and the bell") | Nothing |
| **Check** on an empty bag | "Nothing is in the bag yet." | Nothing |
| **Check** when `distance == 0` | Pass: the cheer in phase 1 then the change, the parade in phase 2 | Nothing |
| **Check** when `distance > 0` | Names the first difference: "The card shows the bell. The drum is still in the bag." Float of the named prop; **bag stays as it is** | **1 miss** for this request |

**Two bad Checks on the same request** (the second without the bag having come closer in between) glow the next edit (`hintFor`: the surplus prop with a dotted arc to the bench, or the missing prop with an arc to the bag) and count **1 hint**; that request's counter then resets. **Any edit that lowers `distance` also resets the counter**, so a child who is steadily repairing is never pushed toward a hint, and the counter never carries over to the other phase. **Show a hint** (pause sheet) glows `hintFor` and counts 1 hint; asked again while a glow shows, it repeats the speech and counts nothing. **Assisted action:** a tap on the glowing prop makes the companion do that edit, counting nothing more. So a supported round always finishes, and the how-to card says assisted completion is not independent mastery. Check, replay of the request, pack and unpack are never hints.

**Finishing:** the phase 2 pass zips the bag and plays the **parade of the revised set only** (about six seconds); a tap skips to the end pose. `ctx.finish({ misses, hints })` runs once at the parade's end or skip (`finished` guard). One shell sticker per round, with or without help. **Start again** (pause sheet) restores the same round's phase 1 bench and keeps the round's misses and hints, as at levels 1–3. Per-round accounting is the whole round: misses and hints from both phases add.

## Screen and controls

- **Card:** top centre, at least 260×150, the requested props' silhouettes in colour. At level 4 a small printed word sits under each picture (reading-lite, optional: the voice line always speaks it and no step requires reading). When the request changes the old card flips to the new one with a short "swish"; the changed pictures get a soft ring for two seconds (never colour alone).
- **Bench:** a single row of the four props, each at least 140×140, wide gaps. **Bag shelf:** a row of four slots (each at least 110×110) above the bag, filled left to right as props are packed, so a packed prop is always visible and always reachable; tapping or dragging one takes it out. The bag itself (at least 220×200) is the drop target.
- **Check:** a round button with a tick, at least 120×120, beside the bag, labelled with the word "Check" at level 4 only, always visible, never disabled. A press shows touch-down feedback at once.
- **Companion:** stands behind the bench's left end (as at levels 1–3); it cheers on a passing Check and points at the new card on a change.

`readyLayout(view, 4, order)` returns the card, bench slots, shelf slots, bag, Check button, companion spot and parade lane. A test runs it at the four lands-test views and asserts: every target at least 100 logical units each way; no overlaps; at least 40 units between bench slots; the Home button and the guide's corner clear; everything inside `view`. Portrait puts the bench in a 2×2 and the shelf below the card; if a view cannot fit the row it returns null and the test fails rather than shrinking anything.

## Speech (`voice.ts`, additions)

`ctx.instruct` for the instruction; everything else `ctx.say`. All lines keyed in `voice.ts`; none mentions real routines.

- `ready.instruct.4`: "Pack what the card shows. Then tap Check."
- `ready.changed`: "The parade changed! Look at the new card."
- `ready.checkpass.1`: "Yes, that matches the card!" (phase 1) · `ready.checkpass.2`: "Now it matches. Off to the parade!"
- `ready.checkempty`: "Nothing is in the bag yet."
- `ready.check.extra.<flag|drum|bell|ball>`: "The {prop} is not on the card. Take it out." · `ready.check.missing.<…>`: "The card shows the {prop}. Put it in the bag." (eight lines, one per prop and kind, no runtime substitution beyond `{pet}`)
- `ready.hint.unpack-<prop>` / `ready.hint.pack-<prop>`: the glow's speech (the existing `ready.hint.pack-flag`, `-drum` and `-bell` are reused; `ball` and the four `unpack` lines are new).
- `ready.request.<…>` lines extend to the new combinations as slots (`ready.request.flag-bell`, `drum-bell` and so on), generated rather than hand-listed for pairs and triples.
- `ready.parade`: reuses the existing line.

New lines needing spoken clips are rendered by the build session's `scripts/voice-clips` pass or fall back to device speech; the build keeps the lines short, new ones in `voice.ts`, then runs `node scripts/content-barrels.mjs`.

## Rule tests (`logic.test.ts`, additions)

1. **Rounds:** every seeded level 4 round has `requests[0] != requests[1]`, both of size 1–3 with distinct props, a `diff` of 1–2 edits for the change, and ball in at least one seeded round over 200 seeds.
2. **Any bag, any request:** from every one of the 16 bags and each seeded request, any sequence of pack and unpack edits reaches `distance == 0`; edits are free, commute (pack a then unpack b = unpack b then pack a) and never change anything but their prop.
3. **Check:** `check` passes iff the bag equals the request (as a set, order and pack order irrelevant); an empty bag is `empty`; a mismatch names a prop that is actually surplus or missing; a Check changes no state.
4. **Phases:** a phase 1 pass starts phase 2 with the bag untouched; a phase 2 pass is `done`; no request change leaves a state with no `nextEdits`.
5. **Accounting:** a mismatching Check is one miss; the second bad Check on the same request with no closer edit between gives one glow and one hint and resets; an edit that lowers `distance` resets the counter; the counter never carries to phase 2; empty Check, pack, unpack, request replay and a repeated hint ask count nothing; misses and hints add across phases.
6. **Hints lead somewhere:** following `hintFor` from any bag reaches `done` in at most `distance` edits per phase; the first edit it names is a surplus when any exists.
7. **Finish once:** the `finished` guard ignores a second finish after a skipped parade.
8. **Silhouettes and layout:** the four props have different silhouette IDs; `readyLayout` at four views per [Screen and controls](#screen-and-controls) (and still passes for levels 1–3).

## Ghost finger, how-to card and registration

- **Ghost finger:** `autotouch()` at level 4 drags the two requested props to the bag, taps Check, waits for the change, then follows `hintFor`: taps the surplus prop on the shelf to take it out, drags the missing prop to the bag, taps Check, and waits for the parade. `fingerdemo` at level 4 therefore shows the revision, not just packing.
- **How-to card** (`src/games/ready-for-adventure/howto.ts`, `from: 4, to: 4`): "Pack what the card shows, then tap Check"; "When the card changes, take out what is not on it and add what is new; tap Check again"; "Check names what is different, and a wrong Check counts as a miss; two in a row on one card light up the next step and count as help". Goal and the notes about dragging or tapping, help, and pretend parade things continue to apply (`from` extended to 4).
- **Registration:** `PLANS` gains `{ level: 4, name: 'The request changed' }` (levels 1–3 and their IDs untouched, nothing renumbered); `LEVELS` becomes toddler 1–1, preschool 1–2, pre-K 2–3, **school 3–4** (3 as the step-down for a struggling six-year-old, so it is not a dead end); `bands` gains `school`; `describeLevel` gains "Pack, then repair the bag when the request changes". The Barnyard land, region, skills (`planning`, `sequencing`, `prerequisites`, `everyday-life`) and sticker are unchanged; skills gain `revision`. Existing `prek` pins and saved rounds are unaffected. Journal: nothing filed. Saves: nothing new.
- **Co-play:** the grown-up changes the card by asking "What if the parade wanted the bell instead of the drum?" and asks which one thing to change. **Off-screen** (spoken tip): "Plan three things for a pretend parade. Now one changes; what is the smallest fix?"
- **Docs on build:** `docs/games/ready-for-adventure.md` gets the level 4 line in Starts as and Grows into, then `npm run game-docs`; the roadmap line is removed; a verification entry.

## Check tier (for the build)

A new level on an existing interaction with **new interactions** (unpack, Check, request change), so the new-game row: typecheck, rule tests (`npx vitest run src/games/ready-for-adventure src/content/barrels.test.ts src/content/game-docs.test.ts src/content/lands.test.ts`), one filtered scripted play at level 4 with one bad Check, one hint and its assisted tap, the change and the parade finish, one portrait screenshot, and `fingerdemo` at level 4. `npm run build` only if shared files or assets change. Device and person checks stay parked.

## Open decisions

None blocks the build; each has a default.

1. **Preparation at level 4.** Default: every prop starts ready, so level 4 isolates compare-and-repair. Alternative: a seeded round where the new prop arrives bare (reuses levels 2–3's attach), adding a prerequisite on top of the revision; defer until a school child shows the plain version is easy.
2. **Which edit a hint names.** Default: the first surplus, else the first missing. Alternative: the missing one first, if watching shows that taking something out feels punishing.
3. **School range 3–4 or 4 only.** Default 3–4 (step-down exists). Alternative: 4–4, if a school child should never meet the two-job bench again.
4. **A Check on a bag with an extra prop but all the requested ones.** Default: a mismatch (miss), because the comparison is about the whole bag. Alternative: a free note, "An extra {prop} is in the bag", if watching shows the extra is play rather than a mistake.
