# The question on screen, for readers (TotoLogic P3, definition)

*Status: defined 2026-11-17; slice 1 (the caption on a phone) built 2026-11-17 (PR #1774); slice 2 (beside a sound, and no room to spare) built 2026-11-17 (PR #1776); slice 3 is under way: its grown-up games built 2026-11-17 (PR #1777) and the school-only games (PRs #1778 and #1779), the pre-K-and-school games and those reaching school from younger bands still queued in [READY](../READY.md). The [build slices](#build-slices-in-order) say what differed.*

From the [TotoLogic review](../TOTOLOGIC.md#p3-the-question-on-screen-for-readers-a-definition-then-shell-m), proposal P3, and the [UX review](../UX-REVIEW-2026-11-09.md#1-with-sound-off-the-app-says-nothing-about-what-to-do)'s first finding: a phone is usually on silent, both people playing now can read, and a touch round says what it wants only out loud. The [decision of 2026-11-17](../archive/DECISIONS-2026-11-17.md#phone-play) settled who sees a caption: the `grownup` band always, the `school` band when speech is off or the phone is muted, younger bands never. This page settles the rest: what the caption shows, how its words are filled, how it changes within a round, what stands beside a sound, and where it sits on a phone without covering a target.

Couch play is not touched: it has had a caption of its own since it was built (`CouchScene`, `.couch-caption`).

## What is there today (`origin/main` at `cd899795a`, before slice 1; see the built note under the build slices)

- **The instruction is remembered, not shown.** `GameScene` keeps the last `ctx.instruct(id, vars)` as `this.instruction` and speaks it; a tap on the guide repeats it, unless the game's `sayWaitingAsk` says a waiting ask instead (`src/app/scenes/GameScene.ts`, `init` and `makeContext`). Every one of the 177 games calls `ctx.instruct`.
- **The words are already available as text.** `voice.line(id, vars)` (`src/audio/voice.ts`) picks one of the line's written options and fills `{name}`, `{pet}` and the game's own slots; `voice.speak(text)` says a finished string, and finds a rendered clip by that string. Couch play's caption is `voice.line(said, vars)` beside `voice.say(said, vars)`, which pick an option separately, so a line with two wordings can show one and say the other.
- **A muted line keeps its length.** With speech off, `voice.speak` still resolves after 600 ms plus 45 ms a character, so a round's pacing is the same with and without sound.
- **Nothing in a round can be read.** The how-to card before the round is the only text, and it describes the game, not the current question.
- **The board owns the whole view.** A game lays out from the `view` that `GameScene.resize` passes it; the upright check (`uprightProblems`, `src/games/upright-check.ts`) keeps targets out of two corners only: Home and the question mark (115 × 210 units, top left) and the guide (150 × 170 units, bottom left). Anywhere else may hold a target, so a caption drawn over the view would cover one in some game.
- **A phone has room the board does not need.** Upright, the view is 768 units wide and 1,662 tall on a 390 × 844 phone (1,366 on a 375 × 667 one), against a design area of 768 × 1,024. Sideways it is 768 tall and 1,662 wide (1,366 on the small phone) against 1,024 × 768.
- **How long the instructions are** (a count over every game's `voice.ts` on this commit, for the lines whose id is written out in an `instruct` call; 333 further calls compute their id and were not counted): 536 written options, half of them 54 characters or fewer, nine in ten 113 or fewer, 14 longer than 150, the longest 237; 270 carry a slot.

## Who sees it, and when

| Band at play (`playBand`) | The caption shows |
| --- | --- |
| `grownup` | Always, in every touch round. There is no switch to turn it off. |
| `school` | When the grown-ups' page has **Spoken voice** off, when its **Volume** is at zero, or when the new **Show the words** switch is on. |
| `lap`, `toddler`, `preschool`, `prek` | Never, whatever the switches say. Nothing a child must read appears. |

**The phone's own mute cannot be read.** A web page is not told about the silent switch or the volume buttons, so "the phone is muted" in the decision becomes a switch a grown-up sets: **Show the words (ages 6 and up)** on the grown-ups' page, off by default, saved per player as `settings.showWords` (a boolean, repaired to `false` on load, with a default and a test like the other settings). *This is the definition's reading of the decision, not something the decision spelled out.* The machine switch `VITE_SPEECH=off` does not turn the caption on: it is how the check servers run, and the browser suites for `school` games should keep the layouts they have.

The caption is hidden while the how-to card (and the demonstration on it), the pause sheet or the result is up.

## What it shows

**The line the guide would repeat.** The caption is the current `ctx.instruct` line, in a band drawn as the guide's speech: cream fill, ink text from `src/art/palette.ts`, a small tail toward the guide and a speaker picture at its end. Tapping the band does exactly what tapping the guide does (the waiting ask if there is one, otherwise the instruction again), so the band is a second, larger target for the same action and adds no new one. It answers on touch-down with a short squash.

**One wording, shown and said.** `GameScene` resolves the text once, `const text = voice.line(id, vars)`, shows it and speaks it with `voice.speak(text)`, so the eye and the ear always get the same option and the rendered clip is still found by its string. A repeat resolves again and the caption follows whatever is said. This is the helper the roadmap's language item calls `lineText(id)`: `voice.line` is the one place that turns an id and its slots into words, and when a second language arrives it is the place that switches. No new helper is added, and couch play's caption moves to the same resolve-once pattern in the first build slice.

**What the guide says in between.** A `ctx.say` or `ctx.sayIn` line (a hint, a reason, a name, praise) takes the instruction's place in the band for as long as it would be spoken, at least 1.5 seconds, in the same type but a lighter ink, then the instruction returns. A reader with the sound off gets the hint the sound would have carried. A new `ctx.instruct` during it wins at once.

**A length budget instead of a clipped line.** The band never cuts a line short and never scrolls. Text is 34 units (about 17 CSS pixels on a 390-wide phone); a line that does not fit at 34 is set at 28 (about 14 pixels). A unit test fills every instruction option's slots with a 12-character stand-in and fails for one longer than 180 characters; the first build slice shortens the few that are, or splits them into an instruction and a following `say`, which is also better speech. The figures are estimates from the character counts above and are measured with real text in the build.

## How it changes within a round

1. **A new instruction replaces the text at once** and the band pulses once (a 4% swell over a quarter of a second), so a changed question is noticed without sound. The same text again does not pulse.
2. **A waiting ask** (`sayWaitingAsk`, the U7 R4 pattern in eight games today) reaches the caption because those games say the waiting ask through `ctx.instruct`; the build checks each of the eight.
3. **A question asked through `ctx.say` leaves the caption stale**: it shows while it is spoken and then the old instruction returns. The rule is the one the contract already implies: the line the guide should repeat is said with `ctx.instruct`. Each build slice reads its games for a question said with `say` and moves it. *A rough size, by a text search and not by reading the games:* 89 written `say` lines contain a question mark outside hint and wrong-answer ids, in 49 games, five of them upright-ready today. Many of those are rhetorical ("Ready?") and need no change.

## Beside a sound

| What is heard | What is seen when the caption is on |
| --- | --- |
| The boing of a wrong answer | The guide tilts its head and the band gives two small sideways wobbles (6 units). The spoken hint that follows shows in the band. Never a cross, a red mark or a count. |
| The glow after two misses | Already a picture; unchanged. |
| A right answer's chime and praise | The game's own picture of success, as now; the praise line shows in the band. |
| A sound that is the round's content (a tune to match, a beat, a word to hear) | Not solved by a caption. The band shows the instruction and the round still needs sound. Which games those are, and whether the band should say so, is left to a later note after the phone playtest answers "with the sound off, could you tell what each game asked?". |

The shell does not see a miss today (a game calls `sfx.boing()` itself, 394 call sites), so the build gives `sfx` one optional listener for the boing, set by `GameScene` in `init` and cleared in `destroy`. Games are not edited for it.

## Where it sits

**Outside the board, on the side of the screen with room to spare.** The caption never overlaps the view the game lays out in. `GameScene` gives the game a smaller view and puts the band in the space it took.

**Upright (a phone held upright over an upright-ready game).** A strip 160 units tall across the bottom of the screen, below the guide (about 81 CSS pixels on a 390 × 844 phone, a little under a tenth of its height). The game's view is the screen's less 160 units of height; the guide, which sits at the bottom of the game's view, moves up with it, so the band is directly under the guide and its tail points up at it. Three lines at 34 units hold about 114 characters, four at 28 about 184. The bottom was chosen over the top because the proposal asks for the caption near the guide and the top left already holds Home and the question mark; the band is a strip a thumb rests near, so it takes the same touch-down rules as any target and nothing in it is destructive.

- **The check.** `UPRIGHT_VIEWS` gains a fourth view, the small phone less the strip (768 × 1,206 units), so every upright-ready game's existing layout test also proves the captioned layout. A game that fails only there gets its small placement fix in the same slice; one that needs a real layout is listed in READY and, until fixed, shows the bubble below on a small phone.
- **Shorter than that** (a view under 1,206 units tall after the strip): the bubble below.

**Sideways (a phone on its side, any game).** A rail 300 units wide down the left edge. The game's stage, Home, the question mark and the guide all move right by 300; the game's view is the screen's less 300 units of width. The band sits at the bottom of the rail with its tail pointing right at the guide, and grows upward with the text: about 15 characters a line at 34 units, 18 at 28, so the 180-character budget fits in the rail's 768 units of height. The rail shows when the view is at least 1,324 units wide, which holds for a 568 × 320 phone and everything wider.

**No room to spare (an iPad-shaped screen, a narrow window).** The band becomes a bubble above the guide that shows when the instruction changes, when a `say` line plays and when the guide is tapped, for as long as the line would be spoken, and then goes. It lets touches through to the board beneath it (`eventMode: 'none'`), so it can hide a target for a few seconds but can never take a tap. This is the second build slice, since neither current player is on such a screen.

**What the result, card and sheets see.** They lay out from the full view as now; the band is hidden while they show.

## What this is not

- Not a reading task for a child: the younger four bands never see it, and navigation still never needs reading.
- Not a transcript or a log: one line at a time, nothing kept.
- Not the how-to card: the card explains the game before the round and stays as it is.
- Not a translation surface yet: the caption shows the same English line the voice says.
- Not a claim about a real phone: where the strip feels right under a thumb, and whether 17 pixels reads comfortably, are for the phone playtest (the Sound question on the [playtest list](../DEVICE-CHECKS.md#what-the-phone-playtest-can-answer-now) already asks whether each game's ask was clear with the sound off).

## Build slices, in order

1. **The caption on a phone (built 2026-11-17, PR #1774; see below)** (shell tier: typecheck, unit tests, build, `uprightsweep` for the upright-ready `grownup` games, one filtered `phone` play; no offline check). `GameScene` resolves a line once and speaks that text; the band in `src/ui/` with a pure layout function and its test (strip, rail, type size, the 180-character budget test over every instruction option); the smaller game view upright and sideways; the fourth upright check view; `settings.showWords` with its repair, default, test and the grown-ups' page switch; hidden under the card, sheet and result; couch play's caption on the resolve-once pattern. The slice also shortens or splits the over-budget lines it finds and moves any question said with `say` in the upright-ready games.
2. **Beside a sound, and no room to spare (built 2026-11-17, PR #1776; see below)** (shell tier, the same suites): the boing listener with the guide's tilt and the band's wobble; `say` and `sayIn` lines in the band; the bubble for screens with no spare side.
3. **The rest of the games' questions** (existing-game tier, a few games a session): read the remaining games for a question said with `ctx.say` and move it to `ctx.instruct`, grown-up games first, then school. No shell change.

**Slice 1 built, and how it differs.** `src/ui/caption-layout.ts` (with its test) and `src/ui/caption-band.ts`; the strip upright (160 units) and the rail sideways (300 units, when the view is at least 1,324 wide); no strip or rail on an iPad-shaped screen (slice 2 gave it the bubble); `settings.showWords` and the grown-ups' switch "Show the words (ages 6 and up)".
- **`UPRIGHT_SCREENS`.** Besides the fourth round view (`captioned`, 768 × 1,206), `upright-check.ts` gained `UPRIGHT_SCREENS`, the three phones without it, which the screens that never show a caption check at (Home, Arcade, Friends, Dress, My mix, lands, the upright root, resident-check).
- **Settings never change mid-round**, because the grown-ups' page leaves the round, so the band decides who sees it once per round.
- **The suite is `uprightgames`** (it plays the upright-ready games); `uprightsweep` only surveys games that are not yet upright-ready, so it was not used.
- **Measured type:** three lines at 34 units or four at 28 fit the strip. The band's tail upright sits behind the guide and is barely visible.
- **Two real layouts found by the fourth view** and fixed in the slice: Lantern Lights and Island Bridges moved their button rows clear of the guide's corner.
- **Lines:** five instruction lines over the budget were shortened (`sort.newcomer`, `mail.any-order`, `code.detective`, `code.markit`, `story.untangle.start`; their rendered clips are stale, so device speech until re-rendered); three questions moved to `ctx.instruct` (`orchard.nextset`, `pattern.swapChoose`, `pantry.another`). Left as `say` on purpose: `size.next`, `safari.which`, `paint.memory.mix`, the who-am-i riddles, animal-snack's replies. No upright-ready grown-up game had a question said with `say`.
- **Couch play:** the caption resolves the line once; the pause sheet's "Repeat instruction" re-resolves and updates it.
- **Left for slice 2, since built:** `say`/`sayIn` lines in the band, the boing listener, the bubble for screens with no spare side.

**Slice 2 built, and how it differs.** `captionPlace` returns `'bubble'` wherever it used to return none with the caption on (an iPad-shaped screen, a narrow window, an upright screen shorter than the small phone, as "Shorter than that" asked); the game keeps the whole view. `CaptionLines` (pure, tested) holds the instruction and a line said in between, which takes its place while it is spoken and for at least 1.5 s, then gives the instruction back; a new instruction wins at once. `ctx.say` and `ctx.sayIn` resolve the line once with `voice.line`, speak that text and show it; `onBoing` (one listener, set by `GameScene`) makes the guide lean (`Companion.tilt`) and the band wobble, and counts nothing. No game was edited.
- **The guide leans its whole body**, not its head: the illustrated rigs have no separately turning head.
- **The bubble** sits 185 units above the foot of the view, as wide as its words (at most 640) and up to 200 units of text (six lines at 28 units); the budget test now also proves every instruction option fits it. It takes no touches (a touch on it is a touch on the board) and has no speaker picture; its tail points down at the guide.
- **In the bubble the wobble is seen only if the bubble is up**: the hint that follows a boing brings it up within the wobble. The guide's lean is always seen.
- **Any `say` line shows**, hint or not (a name, a count said aloud); nothing filters by line id. The `sayIn` voices (other characters) show in the same band with no speaker name (`voice.speakIn`).
- **Still open for slice 3:** unchanged, the games' questions still said with `say`.

**Slice 3, first session (grown-up games) built 2026-11-17, PR #1777.** All 23 `grownup` games were read for a question or a phase's ask said with `ctx.say`; two needed edits, the other 17 had none. The school-band games remain, a few a session.
- **Mystery Grid (`logic-grid`).** Once the grid is solved, "Who has the pie?" (`lg.who`, `.ball`, `.kite`, `.basket`) is said with `ctx.instruct`, so the caption keeps it through the answer step. On a second board (levels 1–2) the level's instruction is said again with `ctx.instruct` after "Here is another mystery!", so the question does not stay up while the next grid is marked (one short extra spoken line per second board).
- **Secret Code (`secret-code`).** `code.another`, `code.grownupbreak` and `code.swap` moved to `instruct` (each starts a phase, so the caption no longer shows the previous phase's line). The pet's first try at each code is an instruction: the full `code.markit` on the first code, a new short `code.markagain` on later ones (no rendered clip yet, so device speech until clips are re-rendered). Later tries still say `code.pettry`.
- **Left as `say` on purpose:** puddle-lens `lens.only-specks`, `lens.could-be`, `lens.right-for-now` (free replies that echo or prompt); species-comeback (already `instruct`); crossword's riddles (a round whose content is heard; whether the riddle should stay up is for the later sound-content note); ribbon-workshop's "See the gap?" hints; secret-code `code.pettry` and `code.sure`.
- **Possible follow-up, not queued:** in secret-code's two-seat mode, after the first exchange the turns alternate with no spoken line, so the caption keeps "Give each of the grown-up's stones its mark" while the grown-up places the next try. Fixing it means a spoken line every turn.

**Slice 3, second session (school games, first batch) built 2026-11-17, PR #1778.** Nine school-only games were read; six were edited, and drift-cards, forecast-detective and fruit-sums needed nothing (each phase's ask already uses `ctx.instruct`).
- **Meadow Pens (`meadow-pens`).** Every friend's request (`meadow.ask`, `.ask3`), the field question (`meadow.field-ask`) and levels 4–5's question (`meadow.ask4.grass`, `.ask4.fence`, `.ask5`) are said with `ctx.instruct`. At level 4 the question is the only place "grass" or "fence" is said, so a reader with the sound off could not tell which was asked once the line ended. The play test's context stub records asks sent through `instruct`, and a new test asserts the question is instructed at levels 4 and 5.
- **Measuring Post (`measuring-post`).** Each task's question (`measure.ask.*`, `measure.ask3.*`, `measure.kg.ask.3/4`) in `askQuestion`; `measure.kg.watch` stays `say`.
- **Bond Beads (`bond-beads`).** Level 4's `bondbeads.other`. When it was said, the next card says the level's instruction again with `ctx.instruct`, so the caption does not keep "the other shape" during a new card's first shape (one short extra spoken line per card after the first, only if the ask was said; an early touch still drops the ask).
- **Paint Mixer (`paint-mixer`).** Level 4's `pm.different-amount`; the next sample already re-instructs the level.
- **Story Weaver (`story-weaver`).** Level 3's `weaver.feel` and `weaver.because`. When she takes a tile back after one was asked, the guide's line goes back to what is asked now (`weaver.feel` if the feeling was taken back, `weaver.three` if a story tile was), one spoken line on that removal.
- **Food Web Workshop (`food-web-workshop`).** Show with no arrows repeats the level's ask through `ctx.instruct` (same words).
- **Left as `say` on purpose:** Story Weaver's level-1 page asks (`weaver.next.*`, with the 5-second nudge and the ask after turning the page) and the owl's questions (`weaver.owl.*`), each answered by one tile with nothing said when the next part opens, so an instruction would go stale (the level instruction stays true throughout); Bond Beads' names (`bondbeads.named.*`); Measuring Post's results.
- **Still to read:** the other school-only games (example-express, lemonade-stand, lost-layers, memory-desk, pond-typing, sea-lift, sprout-shuffle, trackway-tales; example-express waits while READY's level 3 line may be in flight), then the pre-K-and-school games, then games that reach school from younger bands. (orchard-rows and picnic-pantry were done in slice 1.)

**Slice 3, third session (school games, second batch) built 2026-11-17, PR #1779.** The last eight school-only games were read; two were edited, and the other six needed nothing because each phase's ask already goes through `ctx.instruct`.
- **Example Express (`example-express`).** Level 2's `ee.surprise`, said after the opening yellow circle goes to the wrong dock and ending "Choose an example to help it use shape.", is said with `ctx.instruct`, so the guide repeats it and the caption keeps it instead of the opening "Watch this yellow circle" line.
- **Lost Layers (`lost-layers`).** `lost-layers.instruct-tell` (level 1, after the first story is stamped) is said with `ctx.instruct`. At level 2, after a look that tells the stories apart (a stripe found or missing), a new short line `lost-layers.instruct-which` ("Now, which story is true? Tap it.") is said with `ctx.instruct`, because the look is spent and the opening instruction still asked her to pick a look (one short extra spoken line per level-2 round; no rendered clip yet, so device speech until clips are re-rendered).
- **Left as `say` on purpose:** Example Express's `ee.success` (an edit after a passed check withdraws the pass, so the line would go stale), the panel prompts (`ee.shelf`, `ee.tools`, `ee.test`, `ee.chooseDock`, `ee.selected`, `ee.placeExample`), the rule read-outs and the route results; Lost Layers' `maybe-another`, `not-yet-look`, `already-stamped` (replies to a press), look previews and hints.
- **Needed nothing:** Lemonade Stand (boat, tower and batch asks already `instruct`; `lemon.pick` and `lemon.pick.price` are nudges), Memory Desk (the level instruction, `md.next-sign` and `md.next-desk` already `instruct`; the `md.try-*` lines are nudges), Pond Typing (only replies), Sea Lift (every friend's ask already `instruct`), Sprout Shuffle (every phase's ask goes through its own `instruct` helper; `sprout.tester-ask` at an empty pot repeats the current instruction as a nudge), Trackway Tales (`instruct-replay` and `empty-slot` are nudges; `both-fit` is a reply and the level-3 instruction stays true).
- **Still to read:** the pre-K-and-school games, then games that reach school from younger bands. (All school-only games are now read.)
