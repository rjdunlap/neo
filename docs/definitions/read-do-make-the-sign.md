# Read & Do — Make the sign (level 7, WC3): write a sign for a reader

WC3 definition, 2026-11-03, branch `claude/define-read-do-make-the-sign`. This is dive slice 3 of the [Read & Do dive](../deep-dives/read-do.md#build-slices-in-order), from the [writing study](../deep-dives/subjects/writing-composition.md). **Docs only:** no game change, code or device evidence. It settles what the dive left open: the stage and wish tables, `act()` and its spoken reasons, the trays, the edit gestures, the hint rule, the layout at the four views, the bot and the check tier.

## Scope and identity

**Fun action.** The pet shows a wish as a picture, for example the small cat asleep. She drags word tiles into a sign that already reads *The ▢ .*, presses **Show it** to watch the animals act her sign, then **Send** when she thinks it matches.

**Learning purpose.** Writing for a reader who acts on the exact words. The words she chooses, and their order, decide who moves and what they do. A size word is needed when two of the same animal stand on stage.

**What it is.** Level 7 of `read-do`, school only. No new game, land, band, keyboard or free text.

**Overlap:**
- Levels 1–3 read a fixed sign.
- Levels 4–6 (SS1, [definition](read-do-capital-stop.md)) dress a sign whose words are already right.
- Levels 8–9 (KE1 *Mend the sign*) start from an authored broken sign.
- Level 7 alone starts from an empty sign and owns composing it.

**Depends on batch read-do 2 (levels 4–6).** That batch adds the things this level reuses: the sign row, Send, Show it, the `The` capital and the stop, and the words *jumps* and *sleeps* in `WORDS`, `WORD_LINES` and the voice script. School's range is `min..max`, so level 7 cannot ship before 4–6. The build line is ordered after that batch.

## Where it sits in the ladder

- **School:** the range becomes `{ min: 1, max: 7 }`.
- **Pre-K:** unchanged at `{ min: 1, max: 5, order: [1, 2, 4, 5] }`. A pre-K opening for 7 waits on observation (dive decision S8).
- **`PLANS[6]`:** `{ name: 'Build a sign from word tiles so the animals do what the pet wishes', rounds: 3 }`.
- **`planFor`:** its clamp rises to the plan count.
- **`describeLevel`:** reads the plan name, as it does today.

## The sign, the stage and the wish

**The sign.**
- It always begins with a locked `The` tile (capital already on) and ends with a locked full stop. Neither can be dragged, toggled or judged here, so level 7 never re-judges SS1's conventions.
- She fills **one to three** word slots between them.
- The grammar is `The (big|small)? animal action .`:
  - animals: duck, cat, pig, dog;
  - actions: jumps, sleeps.

**The stage.** Each actor is an animal with a size, `big` or `small`, drawn at level 2's scales (0.42 and 0.23). There are two kinds:
- **Solo:** one animal with a seeded size.
- **Pair:** a big and a small animal of the same kind.

**`act(sign, stage)`.** `sign` is the words between `The` and the stop; `stage` is its actors. It returns one of four outcomes:

| Outcome | When | Example on stage |
| --- | --- | --- |
| `act { actor, action }` | The words parse, and exactly one actor fits the animal (and the size, if given) | *The pig jumps.* with one pig |
| `which` | It parses and two actors fit | *The cat sleeps.* with a big and a small cat |
| `none` | It parses and no actor fits | *The small pig jumps.* with only a big pig; *The dog jumps.* with no dog |
| `unreadable` | It does not parse: no animal, no action, two sizes, two animals, two actions, or the words out of order | *The pig.*, *The jumps pig.*, *The big small cat sleeps.* |

**A size word on a solo stage is read literally.**
- It acts when it matches: *The big pig jumps.* with a big pig is `act`.
- It is `none` when it does not: *The small pig jumps.* with a big pig.
- So a solo round has two accepted signs: the short one and the one with the correct size. The pet's wish card always shows the animal at its stage size, so the size she sees is the size it is.

**Accepted.** A sign is accepted when `act()` returns `act` and both actor and action equal the wish. Any such sign is accepted, not only the shortest.

**Wrong act.** When `act()` returns `act` but the actor or action differs from the wish, Send reports *wrong act*, not one of the three other failures.

### The round's three signs (seeded)

Each round has three signs, built by `makeSigns(rng)`.

| Sign | Stage | Wish | Shortest accepted sign |
| --- | --- | --- | --- |
| 1 | Solo: animal A, seeded size | A, seeded action | *The A action.* |
| 2 | Pair: big B and small B | Seeded size of B, seeded action | *The size B action.* |
| 3 | Pair: big C and small C | The size sign 2 did not use; seeded action | *The size C action.* |

Variety rules:
- A, B and C are three different animals, shuffled from the four.
- Across the three wishes, *jumps* and *sleeps* each appear at least once.
- Signs 2 and 3 cover both sizes.
- The seed fixes the whole round, so a replay never changes a puzzle.

### Trays

- **Six tiles per sign:** *big*, *small*, the stage animal, one decoy animal, *jumps* and *sleeps*. The decoy is a seeded animal not on that stage, so using it gives `none`.
- The order is seeded and shuffled.
- **Tiles move; they are not copied.** There is one of each word. A placed tile leaves a faint dotted outline in its tray slot and returns to that slot when taken out.
- Every wish's shortest accepted sign is in its tray. A rule test asserts this.

## What she does

Three edit gestures. All of them are free, all use `src/engine/drag.ts`, and tiles ride 40 units above the finger:

1. **Insert.** Drag a tray tile over the sign. It resolves to the **nearest gap** by the tile's x position: before the first slot word, between two of them, or after the last. While a tile hovers, the row spreads open at that gap (neighbours slide 58 units apart). On drop it closes with a soft pentatonic tick.
2. **Move.** Drag a sign word to another gap in the same row.
3. **Take out.** Drag a sign word off the row. It floats back to its tray slot.

Removal and moving belong to level 7, not to KE1. Without them a misplaced word would be stuck, and the level-7 hint can name a word to take out. KE1's new verbs are the swap (drop onto a word) and the authored broken signs; the dive's level-8 cost cell is corrected to say so.

**Full sign.** A tile dropped on a sign that already holds three words floats home, and the pet says `read.make.full` once per sign. Free.

**Gaps are not targets.** The 8-unit spaces between tiles are never hit-tested. Only the nearest-gap rule decides where a tile goes.

**The row's drop zone.** A dragged tile's centre counts as "over the sign" inside this rectangle:
- y within 90 of the row (95–275);
- x from the left edge of `The` to 60 beyond the stop.

Anywhere else, a tray tile floats home and a sign word goes back to its tray slot.

**Show it** (free, never a miss or hint):
- The speaker reads the sign word by word with the existing highlight.
- The animals act out `act()`'s outcome with the reactions below.
- There is no verdict, and it does not compare with the wish.
- It works on any sign, including an empty or unreadable one.

**Send:** the same read-back and reaction, then the verdict against the wish. An **empty sign** (no slot words) is not sent: the pet repeats the instruction and nothing is counted, since there is nothing to judge.

**Tap a word** (tray or sign) to hear it, as levels 1–3 do. Free.

**Reactions** are all gentle; each returns the animals to their places afterwards:
- **`act`:** that actor jumps (the existing arc) or sleeps (sleepy mood and Z). Others stay idle.
- **`which`:** both fitting actors tilt toward each other with `setMood('surprised')`.
- **`none`:** a small `?` label over the stage; every actor looks around.
- **`unreadable`:** the sign row gives one small wobble; the animals stay put.

## Mistakes, hints and accounting

**Free, never counted:**
- every insert, move and take-out, and every drop that floats home;
- a cancelled drag, including `pointercancel`;
- Show it, the speaker and tapping words;
- a full-sign drop;
- Send on an empty sign.

**A miss** is a Send on a non-empty sign that is not accepted. That is one miss per failed Send, whatever the outcome: wrong act, `which`, `none` or `unreadable`. An incomplete sign (*The pig.*) counts, because a sentence that names nobody or no action is the writing point here; only the empty sign is exempt. The boing is soft, the reaction plays, the pet speaks the outcome's reason, and her tiles stay where she left them.

**Hint.** Two failed Sends on one sign start a glow and count **one hint** for that sign. The glow follows her edits without a second charge. It always shows the next step of a pure rule, `hintFor(sign, stage, wish)`:

1. **Already accepted:** glow Send.
2. **Her sign is an in-order subsequence of some accepted sign:** take the shortest such accepted sign and glow the tray tile for its first word she does not have yet, with a dotted outline at the gap it belongs in. The pet names the word (`read.make.hint.add`, then its word line).
3. **Otherwise:** glow the leftmost sign word at which her sign stops being an in-order subsequence of any accepted sign: the word to take out (`read.make.hint.out`).

Each step either takes out a word or adds one while staying a subsequence. Following the glow therefore always reaches an accepted sign within three steps of removal plus three of insertion, and never needs a fourth slot word.

**No "do it for me"** (the dive's default). The game has misses, so no `askForHint` is added.

**Adaptation and completion:**
- A round of three signs with at most one miss and no hints is smooth. The shell's two-smooth-up, two-struggling-down rule applies unchanged.
- Exploring with Show it is never struggling.
- After the third sign: `read.done`, then one sticker through `ctx.finish({ misses, hints })`.
- No timer, lives or speed credit. Assisted completion is not evidence of independent writing.

## Voice (planned IDs, not yet in `voice-script.ts`)

`ctx.instruct` gives the goal; `ctx.say` gives everything else. The wording is a draft for ordinary review. Lines with `{…}` follow the `read.meaning` pattern; each word is also spoken through its own `WORD_LINES` entry when read back.

| ID | Draft |
| --- | --- |
| `read.make.instruction` | "Here's my wish! Make a sign so the animals do it. Drag words into the sign, tap Show it to try it, then Send." |
| `read.make.yes` | "The animals did just what I wished: {words}." |
| `read.make.other` | "They did what the sign says: {words}. Look at my wish again." |
| `read.make.which` | "Which {animal}? The sign doesn't say." |
| `read.make.none` | "There's no {words} here." (`{words}` is the size and animal, e.g. *small pig*) |
| `read.make.mixed` | "The animals are puzzled. A sign needs who, then what they do." |
| `read.make.full` | "The sign is full. Take a word out first." |
| `read.make.hint.add` | "Try this word." |
| `read.make.hint.out` | "Take this word out." |

The wish is **never spoken as words**: saying "small cat sleeps" would turn writing into dictation. A tap on the wish card says only "That's my wish." (`read.make.wish`). There is no new vocabulary: *jumps* and *sleeps* come with batch read-do 2.

## Layout and presentation

`computeView` scales by the smaller ratio, so the four views the lands test uses (landscape 1024×768, portrait 1024×1365, phone 1662×768, notch 1561×768 in logical units) all have `w ≥ 1024` and `h ≥ 768`. **Landscape is the binding case**; the others only add room. All x positions are relative to `w/2`.

| Element | Centre | Size | Landscape span |
| --- | --- | --- | --- |
| Sign row: `The`, up to three slots, stop | y 185, x `w/2 + (i − 2) × 116` for five slots | 108 × 100 tiles | 226–798 × 135–235 |
| Speaker (unchanged) | `w/2 + 365`, 185 | 110 × 100 | 822–932 × 135–235 |
| Stage | Solo `w/2`; pair `w/2 ∓ 110`, at 0.43h | scale 1.3, as in `act` today | between the card (282) and Show it (767); the layout test measures it |
| Wish card (cream bubble, tail toward the pet) | `w/2 − 330`, 0.43h | 200 × 160 | 82–282 × 250–410 |
| Show it | `w/2 + 330`, 0.43h − 40 | 150 × 100 | 767–917 × 240–340 |
| Send | `w/2 + 330`, 0.43h + 80 | 150 × 100 | 767–917 × 360–460 |
| Tray: six tiles | y = h − 120, x `w/2 + (i − 2.5) × 116` | 108 × 100 | 168–856 × 598–698 |

**The row stays at its full five-slot width.** Empty slots show as one dotted socket while the sign is empty, and the row is laid out as five slots whatever she has placed, so tiles never jump when a word goes in. The right edge (798) is clear of the speaker (822).

**Clearances against `GameScene`** (home at 62,62, help at 62,160, pet at 74,h − 18):
- The wish card starts at y 250, below help's bottom (about 210).
- The tray's left edge (168) is right of the pet's corner, the "start rows at about 150" rule in `spread`.
- Show it starts at y 240, below the speaker's bottom (235).
- Send ends at 460, above the tray's top (598).

**Where SS1 put Send.** The SS1 definition placed Send at 0.88h, which would collide with this tray. Level 7 uses the right-hand column instead. If batch read-do 2 lands with Send low, the build moves Send for level 7 only (a per-level layout), or moves it for every level if that fits.

**Layout function.** The build exposes `signLayout(view, level)` returning every rectangle. A test asserts at the four views:
- every target is at least 100 units each way;
- nothing overlaps;
- everything is inside `view`;
- home, help and the pet's corner are clear.

**Not decorated with the answer.** No tile is coloured to match the wish, and no gap is highlighted until the glow. The wish card is the existing `picture()` for the wished actor at its size, mid-action.

## Co-play, off-screen, how-to and bot

- **Co-play:** a grown-up whispers a wish ("make the small dog sleep") and she writes it; then swap, so the grown-up writes and she acts it out.
- **Off-screen:** write *The big dog sleeps.* on a card for a toy to act out, and let the toy be confused when the sign says only *the dog* with two dogs there.
- **How-to card:** one `LevelLine` from 7 to 7: drag words into the sign, Show it to try it, Send when the animals match the wish. No "later levels" wording.
- **Bot:** `autotouch()` returns `null` while busy. Otherwise it follows `hintFor`:
  - a `{ drag, to }` from the tray tile to its gap's centre;
  - a `{ drag, to }` from a sign word to its tray slot;
  - `{ tap: Send }` once the sign is accepted.

  From an empty sign it builds the shortest accepted sign, so it never makes a failed Send. The fingerdemo at 7 proves it.

## Rule tests the build needs

In `logic.test.ts`:

- **`act()` table:** every row of the table above, on solo and pair stages; a size-less sign on a pair stage is `which`; a mismatched size on a solo stage is `none`; the decoy animal is always `none`; out-of-order, doubled and incomplete signs are `unreadable`.
- **Acceptance:** for many seeds, every sign's shortest accepted sign uses only its tray's words and is accepted. On solo stages, both accepted forms are accepted and the wrong size is not. A sign whose `act` differs from the wish is never accepted.
- **Seeded rounds:** three different animals; both actions and both pair sizes covered; the decoy is never on stage; the same seed gives the same round.
- **Hints lead somewhere:** from every sign reachable from the tray (every ordered choice of up to three tiles), repeatedly applying `hintFor` reaches an accepted sign within six steps, never needs a fourth slot word, and every added tile is in the tray.
- **Layout:** `signLayout` at the four views, as above.
- **Voice:** every `read.make.*` ID exists in the voice script.

## Settled and open

**Settled by this packet:**
- level 7, school only;
- three signs per round: solo, then two pairs;
- locked `The` and stop;
- one to three slot words, with insert, move and take-out all free;
- size read literally on a solo stage;
- an empty Send is free, and any other failed Send is one miss;
- one hint per sign by the `hintFor` rule;
- no "do it for me" and no `askForHint`;
- the wish is never spoken;
- the right-hand Show it and Send column.

**Gates:**
1. Batch read-do 2 (levels 4–6) built first.
2. The building session's ordinary content review of the wish tables and the `read.make.*` wording (standing rule S1).
3. The touch layout proof at the four views once built.

**Open for observation, not for the build:** whether a pre-K opening for 7 is worth adding.

## Device and person checks

Added to [DEVICE-CHECKS.md](../DEVICE-CHECKS.md) when the level is built, not claimed now:
- whether the drag into a gap is comfortable in portrait on an iPad;
- whether the `which` and `none` reactions read as funny rather than as failure;
- iPad speech for "Which cat? The sign doesn't say." and the other `read.make.*` lines.

## Build order and check tier

1. **`logic.ts`:** the stage and wish types; `makeSigns`; `act()`; acceptance; `hintFor`; `signLayout`; `PLANS[6]`; then the rule tests.
2. **`index.ts`:**
   - the wish card;
   - the tray and the three drag gestures with nearest-gap resolution and the spreading row;
   - Show it and Send for level 7;
   - the reactions and the glow;
   - `autotouch()`;
   - school `max: 7`.
3. **Content:** voice lines in `src/content/voice-script.ts`; the how-to `LevelLine` in `src/content/howto.ts`; a `readdo` level-7 case in `scripts/browser-check.mjs`; the README row and the [GAMES.md](../GAMES.md) entry.

**Check tier: new interaction.**
- Typecheck, and unit tests including registry, lands, how-to and layout.
- One filtered `readdo` play of level 7, with one failed Send (a `which` on a pair stage) and a second to raise the glow and its hint, then on to the sticker.
- One portrait screenshot of the tray and the spread row.
- `fingerdemo` at 7.
- One `npm run build` for the voice lines.
