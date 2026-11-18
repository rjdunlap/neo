# Melt and Freeze, levels 6–7: predictions and the can't-go-back sort (definition)

**Built:** levels 6–7 (level 6 PR #1803, level 7 PR #1806, both 2026-11-18); nothing left to build here. Level 6 departed from this packet in eight small ways and level 7 in several more, listed in the [game page](../games/melt-freeze.md#design-notes).

Defined 2026-11-17 as the definition half of slice 3 of the [matter study](../deep-dives/subjects/matter.md#build-slices-in-order). Levels 1–4 and the lap opening are built ([definition](melt-and-freeze.md), [game page](../games/melt-freeze.md)); this packet appends to the same game, table, sun and snowflake, and everything not restated here is unchanged. **Level 6 built 2026-11-18 (PR #1803); level 7 built 2026-11-18 (PR #1806).** Nothing here needs a decision from the developer: the 2026-10-23 decisions (a new game, journal entries per discovery, no reviewer for levels without a dial, steam, a flame or real-heating advice) cover it, and the choices this packet makes inside them are listed under [choices made here](#choices-made-here).

**The level IDs.** The study and the first definition call these "levels 5–6". Level ID 5 has since been taken by the lap opening *One big ice cube* (2026-11-12), and saved levels and pins are never renumbered, so this packet assigns **ID 6 to the prediction round** and **ID 7 to the can't-go-back sort**. The study's later rungs (three states, the sealed-jar scale, the dial, the particle lens) will take IDs from 8 upward when their own packets are written; the study's ladder table keeps its original numbering as a research record, with a note pointing here.

**Fun action and purpose.** Level 6, *Will it melt?*: a thing sits on the table and she says what she thinks the sun will do, by tapping one of two picture cards, before she warms it and finds out. The learning purpose is **say what you think first, then test it; a surprise teaches as much as a right guess** (NGSS 2-PS1-1's observed properties, and the practice of predicting before testing). Level 7, *Can it go back?*: a changed thing arrives (a puddle, a slice of toast, a popped kernel) and she files it under **goes back** or **can't go back**, with the snowflake there to test it. The learning purpose is **some changes can be undone and some cannot** (NGSS 2-PS1-4).

## The model (`logic.ts`)

The state table stays authored. Three substances are added, and one state.

| id | Starts as | Changed form | Sun on the start form | Snowflake on the changed form | Used at levels |
| --- | --- | --- | --- | --- | --- |
| `lolly` | an ice lolly on its stick | a pink puddle beside the stick | melts | freezes back (voice says "freezes", as for ice) | 6, 7 |
| `shell` | a sea shell | none | stays | not applicable | 6 |
| `bread` | (a slice of bread: outline only, never on the table) | a slice of toast | not offered | **stays toast** | 7 |
| `kernel` | (a corn kernel: outline only, never on the table) | a popped kernel | not offered | **stays popped** | 7 |

- **State** gains `cooked`: `'solid' | 'melted' | 'cooked'`. A substance record gains `cooked: string | null` (`'a slice of toast'`, `'a popped kernel'`; `null` for every other substance). `bread` and `kernel` have `melted: null`, `reversible: false`.
- **Step.** `step(s, 'cooked', tool)` is `'cooked'` for both tools: nothing here un-toasts or un-pops. All existing rows are unchanged.
- **Toast and the popped kernel arrive already changed.** The game never shows bread becoming toast or a kernel popping, never draws a toaster, pan, flame, glow or steam, and no round puts `bread` or `kernel` on the table as `solid`. This is deliberate and it is the reason these two levels need no dial and no reviewer: the sun is a warm step that truthfully melts ice, butter and chocolate, and it does not truthfully toast bread. The thing's faint "what it was" outline (the same device a puddle already uses) shows a bread slice beside the toast and a kernel beside the popped one, so she can see what it would have to go back *to*.
- **Levels 1–4 keep their five things.** Today `CHANGERS`, `STAYERS` and `ALL_SUBSTANCES` are computed from the table and feed level 2's draw, level 3's requests, level 4's trays and the journal's per-changer entries. The build freezes those levels' pool as an explicit list (`EARLY: Substance[] = ['ice', 'butter', 'chocolate', 'stone', 'spoon']`, with its changers and stayers derived from it) before adding a row, so no existing round can draw a lolly, a shell, bread or a kernel, and a test says so.
- **Plans.** `PLANS` gains two entries, so `meltPlan(6)` and `meltPlan(7)` resolve: mode `predict`, "Will it melt?: say what you think, then warm it and find out (a guess is never wrong)"; mode `sort`, "Can it go back?: test each changed thing with the snowflake and file it under goes back or can't go back".

### Level 6, *Will it melt?* (mode `predict`)

- **Pool:** the six things that can stand on the table as themselves: `ice`, `butter`, `chocolate`, `lolly` (melt) and `stone`, `spoon`, `shell` (stay).
- **Round:** `predictFor(rng, authored)` returns **four distinct things, two that melt and two that stay**, in an order where the first two are one of each. The authored first round is `lolly`, `shell`, `chocolate`, `spoon` (the two new things first, so a child arriving from level 4 meets something she has not already watched).
- **One thing's turn:** the thing arrives; the pet asks "Will the {thing} melt?" through `ctx.instruct` (it is a question, so it is the line the guide repeats and the caption keeps); the two picture cards are open and the sun is dimmed. She taps a card; it lifts and stays lit as "what you thought". The sun opens; she taps it; the thing melts or stays, with the existing animation and line; then one of two lines names the match or the surprise. A melted thing gets no snowflake at this level (level 7 owns going back); it leaves as a puddle with its outline.
- `PredictRound` holds the index, the guess and the result for each thing, so the accounting below is tested apart from the drawing.

### Level 7, *Can it go back?* (mode `sort`)

- **Pool:** four things that go back, each arriving `melted` (`ice`, `butter`, `chocolate`, `lolly`), and two that cannot, each arriving `cooked` (`bread`, `kernel`).
- **Round:** `sortFor(rng, authored)` returns **four things in turn: both that cannot go back and two of the four that can**, never three alike in a row. The authored first round is the butter puddle, the toast, the lolly puddle, the popped kernel.
- **One thing's turn:** the thing arrives with its outline; the pet asks "Can it go back?" through `ctx.instruct`. The **snowflake is open from the start and is the test**: tapping it is always free. A puddle goes hard again (and the snowflake's tap on the now-hard thing says the existing "already hard" line); toast stays toast ("Still toast."). She files the thing by tapping one of the two bins. **Filing before testing is allowed**: the game then runs the snowflake itself, so every filing is followed or preceded by the evidence, and the answer is judged against what the test shows.
- **Truth:** `goesBack(s)` is `SUBSTANCES[s].reversible`; the right bin for a thing is `goesBack(s) ? 'back' : 'stuck'`.
- `SortRound` mirrors `MakeRound` (index, per-thing wrong count, hinted flag, supported finish), so its accounting is tested the same way.

### Bands and ranges

```ts
export const LEVELS: BandLevels = {
  lap: { min: 1, max: 5, order: [5, 1, 2] },
  toddler: { min: 1, max: 3 },
  preschool: { min: 3, max: 6, order: [3, 4, 6] },
  prek: { min: 4, max: 7, order: [4, 6, 7] },
  school: { min: 6, max: 7 },
};
```

`bands` gains `prek` and `school`. Preschool grows by the prediction round only; pre-K opens on the tray (which files the first journal entries and shows the "some do, some don't" contrast the predictions lean on), then predicts, then sorts; school plays the two new levels. Level 5 stays the lap opening and is in no other band's order. The home land stays Bubble Beach, where the game now also shows at pre-K and school; the lands test decides whether those pages still fit, and a full land pages rather than shrinks. No saved level or pin moves: IDs 1–5 keep their meaning.

## Screen and controls

- **Prediction cards (level 6):** two cards, each at least **140 logical units**, tapped with `onTap`. *It melts*: the thing above an arrow to a puddle. *It stays*: the thing above an arrow to the same thing. Both are redrawn with the thing on the table so the cards are pictures of *this* thing, never words. They sit where level 3's request card sits in landscape (above the table, side by side) and between the table and the tools in portrait. Touch-down lifts a card at once. A second tap on the other card before the sun is tapped changes her mind freely.
- **Bins (level 7):** two bins at least **150 units** wide, tapped with `onTap` (no drag: the thing hops to the tapped bin). *Goes back*: a round arrow that returns to its start. *Can't go back*: a straight arrow that ends at a short bar. Each bin keeps small pictures of what has been filed in it this round, so the sorted set stays visible. The sun is not drawn at level 7 (nothing here is warmed).
- **Layout:** `tableLayout(view, 1)` already places one thing and the tools; it gains `cards` (two boxes) for level 6 and `bins` (two boxes) for level 7, audited in the same four views as the existing layout test plus the upright phone fixture if the game is upright by then (it is not marked `upright` today; these levels do not change that). Bins and cards never cover the thing, the pet corner or the home and corner buttons.
- **Sounds and music:** the existing drip, chime and crystal chime; a bin gets a soft pentatonic tick on touch-down and a two-note rise when a thing lands in the right one. The island loop plays.
- **Pause sheet:** Start again (the thing in play returns to how it arrived; counts and filed things stay) and Show a hint.

## Accounting, help and finishing

- **Level 6 counts nothing.** A guess is an experimental prediction and is never a wrong answer: `misses` and `hints` are 0 for any sequence of taps. A guess that turns out different gets the surprise line in the same warm voice as a match, with no boing. Show a hint says how the level works ("Tap what you think. Then tap the sun and see!") and is not counted. After 14 s of rest the pet repeats the question; nothing is tapped for her, because there is no right card to show.
- **Level 7 counts a wrong bin only.** Tapping the snowflake, tapping the thing, and filing before testing are never misses. A thing filed in the wrong bin is **one miss** per wrong filing: it hops back to the table with a gentle boing, the snowflake test runs if she had not run it, and the spoken hint names what the test showed ("It went hard again. It can go back!" / "It's still toast. It can't go back."). From the **second** wrong filing of a thing the right bin glows and `hints++` once for that thing; Show a hint runs the test and glows the right bin, also once per thing. A **third** wrong filing is a supported finish: the pet files it. Assisted completion is not mastery evidence.
- **Finish:** `ctx.finish({ misses, hints, discoveries })`, one ordinary sticker with or without help. Adaptation is the ordinary rule: level 6's rounds are always smooth, so it steps up on its own and never steps down; level 7 can step down to 6 at pre-K and school after two struggling rounds.
- **Discoveries.** Level 6 files the existing per-thing entry for each thing she watched melt (`melt-freeze:ice`, `butter`, `chocolate`, and a new `melt-freeze:lolly`), and `melt-freeze:stays` when a thing stayed; that entry's `found` text is reworded so it no longer names only the stone and the spoon ("some things stayed the same in the warm"), its ID unchanged. Level 7 files two new entries, each only if the round showed it: `melt-freeze:goes-back` (name "Goes back"; found: "a puddle went hard again in the cool") when a puddle was tested or filed, and `melt-freeze:cant-go-back` (name "Can't go back"; found: "toast stayed toast and a popped kernel stayed popped") when toast or the kernel was. That is three new entries (`lolly`, `goes-back`, `cant-go-back`); the build re-derives the journal's total and corrects the count the roadmap states. A creation is not kept.

## Speech (`voice.ts` and the journal lines)

New lines under `meltfreeze.*`, all checked by the existing forbidden-words test (no temperature, "hot", "liquid", "solid", "steam", oven, stove, toaster, microwave or kettle, and no advice about heating food); the build adds `toaster`, `pan`, `cook` and `burn` to that test's list.

| Line | Says |
| --- | --- |
| `instruct.predict` | "Will the {thing} melt? Tap what you think!" |
| `predict.test` | "Now tap the sun and see!" |
| `predict.match` | "Just like you thought!" / "You called it!" |
| `predict.surprise` | "Surprise! Now we know." / "Oh! Not what we thought. Now we know." |
| `stays.shell`, `stays.thing` | "The shell stays a shell." / "It stays just the same." |
| `instruct.sort` | "Can it go back? Test it, then choose!" |
| `sort.toast`, `sort.popped` | "This was bread. Now it's toast." / "This was a little kernel. Now it's popped." |
| `sort.still.toast`, `sort.still.popped` | "Still toast." / "Still popped." |
| `sort.back`, `sort.stuck` | "It went hard again. It can go back!" / "It stays changed. It can't go back." |
| `hint.predict` | "Tap what you think. Then tap the sun and see!" |
| `done.predict`, `done.sort` | "You guessed, and then you looked. That's how we find out!" / "Some changes go back. Some don't!" |

The lolly's freeze uses `meltfreeze.freeze.ice` ("It freezes!"), so the test "says freezes only of ice" becomes "only of ice and the lolly". Journal lines: `journal.melt.lolly` ("The ice lolly melts in the warm sun and freezes again in the cold."), `journal.melt.goes-back` ("A puddle of butter or chocolate can go hard again. That change goes back."), `journal.melt.cant-go-back` ("Toast can't be bread again. Some changes can't go back."). Spoken clips are regenerated by the repository's voice script at build.

## Rule tests (`logic.test.ts`)

- **Table:** `bread` and `kernel` have a `cooked` form, no `melted` form and `reversible: false`; `lolly` melts and is reversible; `shell` never changes; ids unique and the five original ids unchanged.
- **Step:** `cooked` is fixed under both tools for every substance that has it; every existing reversibility test still passes.
- **Levels 1–4 untouched:** over many seeds, level 2's three things, level 3's requests and level 4's trays draw only from the five original things; the journal still has exactly one per-changer entry for `ice`, `butter` and `chocolate` plus the new `lolly`.
- **Level 6 rounds:** four distinct things from the six, two that melt and two that stay, the first two one of each; the authored first round as stated; no `bread` or `kernel`.
- **Level 6 accounting:** any scripted sequence (a guess, a changed guess, a wrong guess, Show a hint three times, extra sun taps) finishes with 0 misses and 0 hints; the outcome line is `predict.match` exactly when the guess equals `melts(thing)`.
- **Level 7 rounds:** four in turn, both cooked things and two distinct puddles, never three alike in a row; every thing arrives `melted` or `cooked`, never `solid`; the authored first round as stated.
- **Level 7 truth and accounting:** the right bin equals what the snowflake test shows for every thing in the pool; right bin first: no miss, tested or not; one wrong filing: one miss and a hint line; a second: one more miss, a glow and one hint; Show a hint twice: one hint; a third wrong filing: supported finish; snowflake taps never count.
- **Hints:** each hint names the bin the test supports.
- **Discoveries:** each id a round can file has a journal entry; a round that showed no toast or kernel cannot file `cant-go-back` (impossible by construction at level 7, stated as a test so a later pool change cannot break it silently).
- **Layout:** `cards` and `bins` at least their stated sizes, no overlap with the thing, tools, pet corner or buttons, inside `view`, in all audited views.
- **Voice:** the forbidden-words test over the new lines; the freezes rule as amended.
- **Registry, lands and how-to tests** pass with the two new bands.

## Ghost finger, how-to card and registration

- **Ghost finger (`autotouch()`):** level 6: for each thing, tap the card that matches what the thing does, then the sun (the demonstration shows a match; the surprise is hers to find). Level 7: tap the snowflake, then the right bin. Both finish inside the demonstration window.
- **How-to card (`howto.ts`):** steps "Tap the card that shows what you think the sun will do, then tap the sun to find out" `{ from: 6, to: 6 }`; "Tap the snowflake to test the changed thing, then tap where it belongs: goes back, or can't go back" `{ from: 7, to: 7 }`. Finish: "Four things guessed and tested" `{ from: 6, to: 6 }`; "Four things filed" `{ from: 7, to: 7 }`. Notes: "A guess is never a mistake; a surprise is the point" `{ from: 6, to: 6 }`; "Testing is free. A thing filed in the wrong place comes back with a hint, and after two the right place glows" `{ from: 7, to: 7 }`. The goal line becomes "Warm and cool things, and see which ones melt, which go hard again, and which changes can't go back."
- **Registration:** `bands` adds `prek` and `school`; skills add `prediction` if the skills list has it (else unchanged). Co-play at these levels: "Ask {name} why she thinks so before she taps the sun." Off-screen stays the ice cube by the window; an addition for level 7 names only changes with no heat: "Tear a piece of paper together, then ask: can it go back?" No toasting, popping, stove or kettle activity is suggested.
- **Art (`art.ts`, palette colours):** the lolly and its pink puddle with the stick, a shell, toast with a bread outline, a popped kernel with a kernel outline, two prediction cards, two bins. Nothing glows, smokes or steams.

## Build batches and check tier

One build session if the art stays small, otherwise two (level 6, then level 7); each is **new levels on an existing interaction plus one new interaction** (the bins), so: typecheck; unit tests (the properties above with the registry, lands, journal and how-to tests); one filtered scripted play extending `scripts/browser/suites/melt-freeze-play.mjs` at level 6 (one surprise guess) and level 7 (one wrong bin, one hint); `fingerdemo` at 6 and 7; one portrait screenshot of level 7 with a thing filed in each bin; `npm run build`, because the journal, voice and lands files change.

## Choices made here

These sit inside the 2026-10-23 decisions and are recorded so the build does not reopen them.

1. **New IDs 6 and 7**, not a renumbering, because ID 5 is the lap opening.
2. **Toast and the popped kernel arrive changed.** The alternative (a hotter tool that toasts on screen) is the dial under another name and stays with the science reviewer.
3. **Bins are tapped, not dragged,** so one thing and two large targets fit a phone held upright without a new drag path.
4. **Filing before testing is allowed and is judged**, with the test then shown; the alternative (bins locked until she taps the snowflake) removes the only decision a school-age player has.
5. **A lolly and a shell join level 6** so the prediction is not a replay of level 4's five things; both are cold or inert things with no heating involved.
6. **Pre-K opens at the tray (level 4)** so a child who starts at pre-K still meets the contrast before predicting.

## What comes next

Both levels are built. Next: the study's three states, sealed-jar scale and fair dial (its slice 4) need their own packet and the building session's source check for the dial and steam; **Stir and See** can be defined once this table is built, since its outcome record reuses the substance record.
