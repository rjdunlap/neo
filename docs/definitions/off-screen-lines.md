# Per-band off-screen lines: scope and review boundaries (definition)

Defined 2026-10-22 from the [off-screen companions study](../deep-dives/subjects/off-screen-companions.md#build-slices-in-order) and its [recommendations packet](../deep-dives/subjects/RECOMMENDATIONS.md#off-screen-companions-recommendations). It joins the study's slices 1–3 (the `{name}` fix and small-object swap, the word-list test, `offScreenFor`) into **one build batch** for the grown-ups' page, because the per-band type is what makes a removal-only swap possible without rewriting a line for every band, and the test is what keeps the swap true. The At-home card (slice 4), talk-about lines (5), upper-school challenge lines (6) and printable cards (7) are out of scope.

**Status: built 2026-10-26/27 ([PR #1006](https://github.com/rjdunlap/neo/pull/1006)).** The `OffScreenLines` type, `offScreenFor`/`offScreenIdeas`, the panel's `{name}` fix, the removal-only lap/toddler swaps, seven of the eight school lines and the word-list test shipped; no new sentence was written at lap or toddler. Differences from this definition: Seesaw Balance gained a lap band the same day, so lap gets the same no-coins entry as toddler; Garden Grow's `all` line drops its "look at it each morning" clause everywhere (the every-band test forbids "each morning"); Log Roll's grown-up line says "should finish standing" (the test forbids "must"). **Open gap:** Bumper Garden's school line is held, because the game lists bands lap–prek only and a `school` key would never resolve; it keeps today's plain string until the game gains a school band or a pre-K placement is decided (the 2026-10-23 decision did not cover it). Original text: the build was to write no new sentence at lap or toddler (it only deletes a small object, swaps in a large soft ball, or withholds the line), and new sentences appear only at school, avoid bath, food, water, sun and small objects, and are authored in full [below](#new-school-lines).

Re-audited on `origin/main` at `5a4bf744`: **113 games carry an `offScreen` line** (the study counted 93 at `d840a77`), and **59 of them reach lap or toddler** (the study's loop counted only lap). The panel still prints at most two lines and still shows Weather Wardrobe's literal `{name}` (`src/parent/panel.ts`, `weekSummary`).

## What the grown-up sees

Nothing new on the page's layout: the same "Off-screen idea" paragraphs, at most two, chosen exactly as today (games she played in the last seven days, else the first two games her band lists). What changes is the sentence: it is the one for **the band she plays that game at** (`playBand(g.bands, profile.band)`, the band every launch uses), with her name in place of `{name}`, and at lap or toddler it never names a small loose object. A game whose line is withheld at her band is skipped, so the page still shows two when two exist. Nothing is tracked, ticked, counted or due; ignoring it costs nothing.

## The contract (`src/games/types.ts`, `src/content/offscreen.ts`)

- **Type.** `offScreen?: string | OffScreenLines`, with `type OffScreenLines = { all: string } & Partial<Record<Band, string | null>>`. A plain string stays valid, so the 97 games this batch does not touch change nothing. `all` is the line for every band without its own entry; a band key gives that band its own sentence; `null` withholds the line at that band. Keys may name only bands in the game's `bands` (a test checks).
- **Resolver.** A pure `offScreenFor(mod, band, childName): string | null` in a new `src/content/offscreen.ts`: take `playBand(mod.bands, band)`, then that band's entry if the key is present (including `null`), else `all` (or the plain string), then `replaceAll('{name}', childName.trim() || 'your little one')`, matching the co-play tip's fallback in `GameScene.showTip`. No other templating.
- **Panel.** `weekSummary` builds its ideas from `offScreenFor(g, store.data.profile.band, store.data.profile.name)`, drops nulls, and keeps the first two; the printed text stays escaped through `esc`.
- **Readers.** `grep` for `offScreen` on `5a4bf744` finds one consumer (the panel) besides the games' own declarations; the build re-checks and routes any other reader through the resolver.
- **Shape decision.** The type serves both answers to the study's decision 3 (one line per band, or one line plus a school extra): the default adopts the study's lean, **a band entry only where the bands differ**. Nothing in this batch depends on the answer.

## Lap and toddler: removal only

Every line reachable at lap or toddler that fails the [word list](#rule-tests-srccontentoffscreentestts) on `5a4bf744`, and what the build does at **those two bands only**; the game's other bands keep today's sentence unchanged as `all`.

| Game (bands) | Today | At lap and toddler | Kind of change |
| --- | --- | --- | --- |
| Dot Link (lap–pre-K) | "Line up colored blocks or buttons, then count how many of each color." | "Line up colored blocks, then count how many of each color." | Delete "or buttons" |
| Fill and Dump `fill-dump` (lap–preschool) | "Give a big bowl and some soft toys, blocks or dry beans in a tub: filling, dumping and scooping is the same game." | "Give a big bowl and some soft toys or blocks in a tub: filling, dumping and scooping is the same game." | Delete "dry beans" |
| Peg Garden (lap–pre-K) | "Roll a marble down a tilted tray with toy blocks as bumpers." | "Roll a large soft ball down a tilted tray with toy blocks as bumpers." | Swap the marble for a large soft ball (decision 1's named substitute) |
| Scoop Shop (lap–school) | "Play ice cream shop with colored pom-poms or blocks stacked in a cup." | "Play ice cream shop with blocks stacked in a cup." | Delete "colored pom-poms or" |
| Seesaw Balance (toddler–school) | "Hang two cups from a coat hanger and add spoons or coins until it hangs level." | "Hang two cups from a coat hanger and add spoons until it hangs level." | Delete "or coins" (toddler only; the game has no lap band) |
| Swing Pals (lap–school) | "Tie a sock to a string and swing it short and long: count the swings together. At the playground, push in time and feel it go higher." | "At the playground, push in time and feel it go higher." | Delete the string sentence (a cord, added to the list here) |
| Story Steps (toddler–school) | "Talk through photos of a familiar activity, or draw the steps for planting a seed together." | "Talk through photos of a familiar activity." | Delete the seed clause |
| Garden Grow (lap–pre-K) | "Plant a bean in a cup and water it together; look at it each morning." | **No line** (`null`) | Withhold: a bean, a water cup and a daily routine are the whole sentence, so no deletion leaves a line; a new one waits for the reviewer |
| Weather Wardrobe (lap–pre-K) | "…let {name} pick one thing to wear…" | Unchanged text; the resolver substitutes her name | The page bug, fixed in the resolver |

The same edits at preschool and up are **not** made: those children are past the under-3 small-parts threshold the study cites, and today's sentences stay as written. The study's sibling caveat for small items at P/K is a reviewer's wording, not part of this batch.

**Flagged, not changed** (each is existing advice; any new wording falls under the reviewer rule): food lines (Monster Munch, Rainbow Fingers, Pet Kitchen, Fruit Slice's knife at toddler, Animal Snack's pretend snack is a toy and passes), bath lines (Sink or Float, Splish Splash), Bubble Pop's soap, Cut Along's scissors at toddler, Draw the Pattern's sand, Feelings Faces' and Fluffy Salon's mirror (indoor, not the sun), and Owl Walk Home naming two bought board games (a purchase suggestion; the word test catches only "buy"). They go on the reviewer's list in the Waiting row.

## New school lines

Eight games that span lap to school get a `school` entry: a build or test with a result, predicting first where it fits (the study's S audience and its Chain Reaction / Light Lab pattern). Household things only, no bath, food, water, sun, purchase, minutes, "must", "every day" or obligation, each at most 140 characters. Their lap-to-pre-K bands keep today's sentence. These are the batch's only new sentences.

| Game | School line |
| --- | --- |
| Block Tower | "Build two towers from the same blocks, one wide at the bottom and one narrow. Guess which stands taller before it wobbles, then try." |
| Bouncy Launch | "Make a ramp from a book and roll a ball off it. Mark where it lands with a sock, tilt the book and guess the new spot first." |
| Bounce Back | "Roll a ball at a wall from three different spots. Before each roll, point to where it will come back, then check." |
| Bumper Garden | "Roll a ball down a tilted tray with cups as bumpers. Say which cup it will hit first, move one cup, and guess again." |
| Mail Carrier | "Draw a map of your rooms with a number on each door, hide a note behind one and give directions to find it." |
| Puzzle Pals | "Cut an old card into six pieces yourself, mix them up, then swap puzzles with someone and put theirs together." |
| Jelly Drums | "Line up pots by size and guess which one will sound lowest before you tap it. Then play a tune from low to high." |
| Teddy Doctor | "Give a teddy a check-up: measure how tall it is with blocks or a ruler, and write it on a chart with what will help." |

Scoop Shop and Swing Pals, already in the removal table, keep today's sentence at school; their `all` covers it.

## Rule tests (`src/content/offscreen.test.ts`)

All pure, over `GAMES` (grown-up games included) and every band each game lists, through `offScreenFor` (so `{name}` is tested after substitution, with a sample name):

- **Under 3.** At `lap` and `toddler`, no resolved line contains (case-insensitive, word-bounded, plural-aware) *marble, coin, button, bean, bead, pebble, rubber band, battery, balloon, small ball, dry bean, pom-pom, seed, string*. The study's list plus this re-audit's pom-pom, seed and string; "dry" alone is not listed, since Quick Tricks' "keep a toy dry" is fine.
- **Every band.** No resolved line contains `{` or `}`, a number of minutes, "every day", "each morning", "must" or "buy".
- **Shape.** Every `OffScreenLines` key is a band the game lists; its `all` is non-empty; every band-specific entry is at most 140 characters (plain strings are not re-measured, since Sing-Along Barn and Shape Buddies run longer and are untouched).
- **Withholding.** `offScreenFor` returns `null` for Garden Grow at lap and toddler and its `all` at pre-K; the panel's idea list skips a null and still takes two when two exist (a pure helper for the selection, so this needs no DOM).
- **Name.** Weather Wardrobe's line with a name contains that name; with a blank name it contains "your little one".
- **Bands.** For a game without a `school` key, a school child gets `all`; for a profile band a game does not list, the resolver uses `playBand`, the same band the launch would.
- **Proof the test bites.** During the build, restore one deleted word (Peg Garden's marble) and watch the under-3 test fail, then put the swap back.

## Check tier

**Shell** for a types and panel change, kept light: `npm run typecheck`, `npm test` (with the new file), `npm run build` (a shared type changed). No game interaction changes, so no game suite, `fingerdemo` or `world` run. One browser look at the grown-ups' page is optional; if taken, one screenshot of the ideas at a lap profile and one at school, with a test profile. Not established by any of this: whether a family reads or uses a line, and the safety of any line beyond the three classes it avoids.

## Docs at closeout

GAMES.md and the README rows stay unchanged (no game behaviour). DESIGN.md gains one sentence where the grown-ups' page is described (lines resolved per band through `offScreenFor`, `null` withholds). The study's build slices 1–3 are marked built; the Waiting row keeps the reviewer question for new under-3, bath, food, water and sun lines; the IDEAS row stays a proposal for the At-home card.

## Open decisions

1. **The removal-only swap without a reviewer** (Waiting row; lean no, since it removes a risk and adds no instruction). This gates the merge. If the answer is "reviewer first", the build may still land the resolver, the `{name}` fix, the type and the school lines, with the under-3 swaps and their word test held.
2. **The eight school lines.** Read with the same row; the default is that they ship as written, since none touches the reviewed classes.
3. **One line per band, or one plus a school extra** (study decision 3): the type serves both; default as the study leans.
4. **Who reviews new under-3, bath, food, water and sun lines**, and the flagged list above: the standing reviewer question (Waiting item 1). Not needed for this batch.
5. **Garden Grow's lap and toddler line.** Withheld until a reviewed sentence exists; a candidate for the reviewer is "Look at a plant or flower together and touch a leaf: soft, smooth, bumpy?"

**Decided 2026-10-23 (on the developer's delegation):** the removal-only swaps need no reviewer and the eight school lines ship as written, so the build may merge; one line per band only where the bands differ; new under-3, bath, food, water or sun lines, Garden Grow's lap and toddler line and printable cards are not drafted for now.
