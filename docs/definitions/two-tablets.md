# Two Tablets (definition)

Defined 2026-11-26 as slice **AR5** of the [ancient river civilizations study](../deep-dives/subjects/ancient-river-civilizations.md#build-slices-in-order) ([PR #2237](https://github.com/rjdunlap/neo/pull/2237), branch `claude/define-ar5-two-tablets`). Docs only: no code, no registration, no save field. Decision 3 was taken 2026-10-23 on the developer's delegation: Two Tablets is a **separate Lantern Lake puzzle**, not River Tablets level 9, so the child's game stays eight levels of one action and Lantern Lake gains a decipherment puzzle it does not have. Game id `two-tablets`; grown-up name *Two Tablets*; spoken title "Two Tablets". The sign shapes are invented island signs (Decision 1), never real cuneiform or hieroglyphs, and no real language or person is named on screen.

**Fun action and purpose.** A scribe left two tablets: a line of picture-words with the island signs written under each, and a second line of signs nobody has read. She works out which sign makes which sound by comparing the two (the old trick of the Rosetta Stone: one message in two scripts), then reads the new line by choosing the picture-word each group of signs spells. The learning is **cross-referencing and elimination**: a sign can carry only one sound, a sound is carried by only one sign, so what the crib has already used rules possibilities out. It is a cryptogram with a crib, not guess-and-feedback.

## Overlap and reuse

- **Identity check.** **Secret Code** owns guess-and-feedback deduction (Mastermind): you guess and are scored. Here nothing is guessed against a hidden answer; every constraint is on the page and the reading is *forced*. **Logic Grid** and **Sudoku Garden** fill a grid by uniqueness but over arbitrary labels; here the labels are sounds with a meaning (words). **Word Search**, **Word Glue** and **River Tablets 7–8** use sound or word-parts but never ask for a mapping to be recovered. Two Tablets is new, so it earns its own registration, as decided.
- Reuse `onTap` (`src/engine/input.ts`) for signs, pictures and the Read button, Pet Kitchen's pattern of a fixed tray, River Tablets' clay-tablet drawing helpers (`src/games/river-tablets/art.ts`, imported by the build only if they already export what is needed; otherwise a small local copy rather than reshaping that file), `ctx.particles` for the finish, and `src/progress/coach.ts` for counting. The crib solver, reading check and hint are new and live in `logic.ts`.
- **Placement.** Lantern Lake (`src/content/lands.ts`), appended after `market-days`. The land already lists 25 games and pages by the [location-capacity](location-capacity.md) rule (children's side 6 + 6 with a signpost at a child band, the grown-up side by its own pages), so the capacity test the study asked for is a property already: `landLayout` returning null is caught by the lands test at every band. The build adds the game and runs that test first. It does not change `LAND_SPOTS`.
- **History on screen.** None spoken. The grown-up card carries one line, checked by the build against the study's Rosetta Stone and decipherment sources and cut if not supported: *Scholars learned to read old scripts by lining up one message written two ways.* No real sign, king, god or date is drawn.

## The model (`logic.ts`)

- **Signs and sounds.** Eight island **signs** `g0`..`g7` (distinct clay-stamped shapes) and eight **sounds** (spoken syllables). A **key** is a bijection from signs to sounds; the true key is hidden by the case and never saved.
- **Case `quay` (authored).** Sounds `lad der ta ble ba by ri ver`, true key `g0=lad g1=der g2=ta g3=ble g4=ba g5=by g6=ri g7=ver`. **Picture-words** (a drawing, and a spoken name of two sounds): *ladder* = lad+der, *table* = ta+ble, *baby* = ba+by, *rider* = ri+der, *river* = ri+ver. The authored order of sounds in a word is the order of its signs, one sign per sound.
- **Crib.** A list of *(picture-word, its signs)* pairs, shown as two aligned rows: pictures above, signs below. A crib fixes each of its signs' sounds. Tapping a crib sign speaks its sound and drops a **sound tile** into the key table beside the sign (free, unlimited, never a miss).
- **Unseen line.** Groups of signs, each with three **candidate** picture-words. A reading picks one candidate per group.
- **Level 1, *Find the missing sound*.** Crib: *ladder* `[g0 g1]`, *table* `[g2 g3]`, *baby* `[g4 g5]`, *rider* `[g6 g1]`. Seven signs are known; `g7` is unknown. Unseen line: one group `[g6 g7]` with candidates *river*, *rider*, *baby*.
- **Level 2, *Two unknown signs*.** Crib: *ladder*, *table*, *baby* only. Six signs are known; `g6` and `g7` are unknown. Unseen line, two groups: `[g6 g1]` with candidates *rider*, *ladder*, *river*; and `[g6 g7]` with candidates *river*, *rider*, *baby*. The first group fixes `g6` (a candidate must agree with `g1 = der`, and *ladder* needs `g6 = lad`, which `g0` already uses; *river* needs `g1 = ver`, but `g1 = der`). The second then fixes `g7`.
- **Reading check (`consistent(case, group, word)`).** A candidate is *consistent* when, for some key that agrees with the crib and is a bijection, every sign in the group carries the sound at its position in the word. **The solver (`keys(case)`)** enumerates every bijection that agrees with the crib (backtracking over the unknown signs, so at most 2! completions) and `readings(case, group)` lists the consistent candidates.
- **Facts proved by an exhaustive enumeration of all 8! = 40,320 bijections, to be pinned by test (checked by script while writing this definition):**
  - Level 1: the crib leaves exactly **1** key; group `[g6 g7]` has exactly one consistent candidate, *river*.
  - Level 2: the crib leaves exactly **2** keys (`g6=ri, g7=ver` and `g6=ver, g7=ri`); group `[g6 g1]` has exactly one consistent candidate, *rider* (only in the first key); group `[g6 g7]` has exactly one, *river* (only in the first key). Reading either group alone is enough to fix both signs; the two readings agree, and neither is consistent in the second key (it reads nothing). So the **reading is unique** and no candidate set is ever empty in the true key.
- **Seeded variation.** The seed assigns the eight sign shapes to `g0`..`g7` by a permutation and shuffles the candidate order, so the same puzzle looks different each time; the counts above are invariant under both. Further cases (new sounds and words) are a later slice, each needing its own enumeration test.

## Screen and controls

- Landscape 1024 × 768: two stacked tablets centred. The **crib tablet** above holds the pictures with their signs beneath; the **unseen tablet** below holds the line's signs and, under each group, three picture cards. Every sign and card is at least 100 logical units across on screen after scaling; the pet sits lower-left, clear of both tablets (`companion()` repeats the instruction). Portrait stacks the same layout vertically from `view`, never from `window`, with the **key table** (eight sign cells) as a single strip between the tablets; the Read button is at least 100 units and clear of the pet. The grown-up band's smaller minimum (64) is allowed only if a seeded case cannot fit; this definition does not need it.
- **Learning the key.** Tap a crib picture to hear its name; tap a crib sign to hear its sound and drop its tile into the key table. A sign never taps wrong: it is a lookup. Tapping an unknown sign in the unseen line says "Not on the first tablet yet."
- **Reading.** Tap a candidate card under a group to select it (lift and outline on touch-down); tap another to swap. **Read it** (button) commits every group at once. Nothing needs reading but the picture names, which the pet speaks.
- **After a right reading.** The signs in the group stamp their sounds into the key table, any previously unknown sign included, the pet reads the group aloud, and the tablet glows. Level 2's first right group fixes `g6`, which makes the second group readable by the same rule (it is not shown as already done).
- **Signs are never colour-only.** Each sign has a shape and a distinct clay stamp; the key table uses the same shapes. Colours come from `src/art/palette.ts`.
- Keys and a pad: arrows move a ring over signs and cards in reading order; Enter taps; Esc goes through `App.escape()`.

## Accounting, help and finishing

- A **miss** is a commit of **Read it** where a group's chosen candidate is not consistent. Selecting, swapping and tapping signs are free. At most one miss is counted per commit (a commit with both groups wrong is one miss, not two), and the pet names which group to look at again by pointing, never which candidate is right.
- **Hint rule (`readingHint`).** After two misses on a group, or on **Show me** (counted once per group at most), the hint does two things in order and counts **1 hint** each time it is used up: first it dims one *inconsistent* candidate of that group (reducing three candidates to two, a reduction proved by test), then, on a second request on the same group, it glows the matching position in the crib ("this sign is the *der* in *ladder*") and the consistent candidate. Following the glows always reaches the unique reading.
- **Undo** and **Restart** clear her selections and keep the seed; neither is counted.
- **Finish.** The last right commit lets the whole key stamp itself and the shell's celebration play; `ctx.finish({ misses, hints })` is called once. One sticker, as for every game. Nothing is kept: no creation, no journal entry.

## Levels and bands

| Level | Name | What changes |
| --- | --- | --- |
| 1 | *Find the missing sound* | Seven known signs, one unknown, one group; the missing sound is the one the crib has not used. |
| 2 | *Two unknown signs* | Six known, two unknown, two groups; a reading fixes a sign that the next group needs. |

**Bands.** `grownup` levels 1 to 2 (and, if the build agrees with the lands test, `school` level 1, as Market Days does; the default here is **grownup only**, since "M–G" is the study's audience). The build writes the `BandLevels` table, reads it with `rangeFor`, and gives `describeLevel` plain text:
- 1: `"Find the missing sound: match signs to sounds from the first tablet and read one group"`
- 2: `"Two unknown signs: read one group to learn a sign, then use it on the next"`

## Rule tests (`logic.test.ts`)

- **Exhaustive counts.** For each level, enumerate all 40,320 bijections and assert: level 1 leaves 1 key after the crib; level 2 leaves 2; both match the figures above. Run for every seeded shape permutation (the counts do not change).
- Each group has exactly one consistent candidate in the true key, and the other two are inconsistent in *every* key that agrees with the crib. No candidate is consistent in a key where it should not be (a count by enumeration, not by hand).
- The crib is aligned: every picture-word has exactly as many signs as sounds, signs are not repeated within a group beyond the case's own `g6`/`g1` reuse, and the crib never contains a sign the unseen line marks unknown.
- **Hint.** A first hint on a group removes an inconsistent candidate and never the consistent one; a second hint names the consistent candidate; repeated hints finish both levels; hints never touch a group already right.
- Misses: a commit counts a miss for a wrong group and not for a right one; one commit with two wrong groups is one miss; selecting without committing is never a miss.
- Layout (`tabletsLayout`, as `tabletLayout` is tested for River Tablets): every target at least 100 units at the four landscape views and the `UPRIGHT_VIEWS`, none overlapping `PET_CORNER` or `HOME_CORNER`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger.** The `autotouch()` bot taps each crib sign (the key fills), then selects a wrong candidate and presses Read for the one wrong-answer wobble, then picks the right candidates and reads. At level 2 it also asks for **Show me** once.
- **How-to card** (`howto.ts`, level-scoped): level 1 "Match each sign to its sound from the first tablet. Then read the new line."; level 2 "One sign is new on both lines. Read the line you can, and it tells you the sound."
- **Voice lines** in `voice.ts`: the instruction the pet repeats ("Two tablets, one message. Match the signs to their sounds, then read the new line."), the wrong-group line ("Look at that group again."), the hint lines (crib position and candidate), "Not on the first tablet yet." and the finish line ("You read it!"). Run `node scripts/content-barrels.mjs` after.
- **Registration.** `src/games/two-tablets/index.ts` exports a `GameModule` listed last in Lantern Lake's `games`, `challenge` set (a puzzle), skills `deduction`, `pattern recognition`, a hub icon (two clay tablets side by side) and sticker art (a clay tablet with a reed stylus). Stable id `two-tablets`; no save field, no pin special case, no bound to River Tablets' levels or pins.
- **Co-play and off-screen.** Two people share the crib: one reads signs aloud and the other finds the matching picture. Off-screen: write three short words on one page and invented symbols for their syllables on another, swap with a friend, and read each other's new line from the crib.
- **Couch play.** None. The couch catalog (`src/couch/`) is a separate route, and a one-player deduction puzzle with a selecting ring has nothing for a shared screen; it is not offered there. [COUCH-PLAY](../COUCH-PLAY.md) needs no change. A couch version, if ever wanted, would be a face-off ("who reads first") and its own definition.

## Check tier (for the build)

New game: lands test at every band after appending to Lantern Lake, typecheck, unit tests (the exhaustive counts run in milliseconds), **one** filtered scripted play of level 1 and level 2 with one wrong reading and one hint, one portrait screenshot, `fingerdemo` at level 2, and `npm run game-docs`. `npm run build` only if shared files or assets change. Docs: the game's page `docs/games/two-tablets.md`, the study's AR5 row, a verification entry.

## Open decisions

- **School access.** Default is `grownup` only. If the lands test and a read-through suggest level 1 is within reach of a larger school child, the build adds `school` level 1 (a one-line change) and says so.
- **More cases.** Not defined here. Each new case (new sounds and words) needs its own enumeration test and an authored candidate set whose wrong candidates are inconsistent in every crib-consistent key.
- **The one historical line.** Kept only if the build's source check supports it.
