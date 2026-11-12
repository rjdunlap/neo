# Never swallow a tap (U7, definition)

*Status: defined 2026-11-10. U7a–U7c built 2026-11-10 ([U7a](#u7a-as-built-2026-11-10), [U7b](#u7b-as-built-2026-11-10), [U7c](#u7c-as-built-2026-11-10)); U7d classified for the games ready for upright play 2026-11-10 ([the lines page](never-swallow-a-tap-lines.md)); the other games' reading is queued.*

From the [adversarial UX review](../UX-REVIEW-2026-11-09.md#8-taps-are-dropped-and-screens-are-slow-to-answer), finding 8 and recommendation U7: a tap that does nothing, or a screen that takes seconds to answer, reads to a child as "it's broken" and to a grown-up as "it froze". The review asked for two things: let a second tap interrupt a spoken name, and show the pressed picture as chosen while a screen changes. This page settles what each means in the code, and adds the measurement the slow screens need first.

**Where it shows.** On a phone the root is **Who's playing?**, then Today's six and the games (`App.phoneOnly`); Home, Explore, the Arcade, the library and creature play are not reached there. So the phone parts are the chooser, Today's six's cards and in-game taps, and they come first. Home, Explore and the Arcade are tablet and computer screens and follow.

## What is there today (`origin/main` at `4fc6e429`)

- **In a game, a tapped thing's name holds input.** Day by Day's card pick sets `busy`, awaits `ctx.say('week.name')`, then clears `busy` (`src/games/day-by-day/index.ts`, around line 398); every handler returns early while `busy`, so the arrow ignores her for the length of the line. Nothing shows it is busy.
- **With sound off, a line still lasts.** `voice.speak` keeps a muted line's pacing: it resolves after 600 ms plus 45 ms a character (`src/audio/voice.ts`, around line 89), so a muted "Tuesday" holds Day by Day for about a second. The review ran with `VITE_SPEECH=off`, standing in for an iPad's silent switch.
- **`voice.stop()` does not end a line's promise in every path.** It bumps the turn, cuts a playing clip and cancels device speech; the muted timer is never cut, and whether a cancelled utterance fires `end` or `error` depends on the engine (the 1.5 s + 90 ms a character fallback timer resolves it otherwise). So "a second tap calls `voice.stop()`" alone would not fix what the review measured.
- **The root waits before it leaves.** Each scene's `leave` (Home, Explore, the Arcade, Today's six, the library, creature play) plays the picture's line, or a squish, and changes screen after the line or a cap, whichever is first: 0.9 s on Home, 1.1 s elsewhere, 0.2 s with no line. A second tap while leaving does nothing. The pressed button squashes on touch-down (`squash` in `src/ui/buttons.ts`) and springs back, so by the time the screen moves nothing shows which picture she chose; Home shows only her friend's cheer.
- **The change itself is short.** `App.show` (`src/app/App.ts`) blocks taps, snapshots the old screen (`picture`, a `generateTexture` of the whole root), destroys it, runs `next.init()` and `resize`, then grows, shrinks or fades over 0.3–0.35 s (`TRANSITION_SECONDS`).
- **The gap the code does not explain.** The cap plus the transition comes to about 1.3 s; the review measured two to four seconds from a tap on a Home or menu picture to the new screen, and four to five seconds for the chooser to fade in on launch. *Hypotheses, to be measured (R1):* the next scene's `init()` (building cards, backdrops and the companion rig), the old screen's snapshot at full resolution, and, for the chooser, the profile reads (`store.peek` for each player) and the app's first load before it.

## Requirements

### R1. Measure before cutting

The build's first step, before any change: performance marks in `App.show` at the tap (the time the leaving scene's `leave` was called, passed through as it is for `growBox`), at `next.init()` done, at the first transition frame and at settled, plus the chooser's marks from page start to its cards shown. A dev-only probe (`test-results/`, through `launchTestBrowser`) reads them for: Home → Explore, Explore → the Arcade, Today's six → a game, a game's result → Today's six, and the chooser on a cold and a warm load, each three times with speech off at 1024 × 768 and 390 × 844. The numbers, before and after, go in the slice's verification entry. If the measurement finds a cause outside this page's hypotheses, the slice fixes what is inside its files and writes the rest down as a new line rather than growing.

### R2. A pressed picture stays chosen

- On touch-down the chosen picture squashes as now, then **holds a chosen look** (it stays pressed, with a thick white ring drawn round its outline) until the screen changes; the scene's other choices **dim to 60%** at the same moment, so it is plain which tap counted. The look is one shared helper in `src/ui/buttons.ts` (`chosen(node, others)`), used by every root `leave`.
- A second tap on the **same** picture while leaving does nothing, as now. A tap on a **different** picture does nothing either: the first choice stands (the screen is already going), and the dim says so.
- Taps during `App.show`'s transition stay blocked (`blocker`); the chosen look carries into the grow, since the new screen grows out of that picture's box.

### R3. The screen starts changing at once

- `leave` starts the change within **0.3 s** of touch-down (the squash's beat, 0.2 s), not after the line. The line keeps playing over the transition and into the new screen: `App.show` does not stop speech, and the next scene's own first line cuts it as any new line does.
- Where R1 finds `init()` or the snapshot slow, the build makes the change start before the expensive part (snapshot at the view's scale rather than the device's resolution, or build the next scene's heavy layers over the first frames), whichever the numbers point to, and keeps the transition's look.
- **Target**, measured as in R1 with speech off: the transition's first frame within 0.5 s of the tap, settled within 1 s, on a computer; the phone figures are recorded, not gated (a desktop browser is not a phone).
- **The chooser:** its cards show as soon as the profile index is read; each card's picture fills in when its save is read, instead of waiting for every `store.peek`. The fade-in stays under 0.4 s. Target: cards on screen within 1 s of the app's first frame on a warm load.

### R4. A tapped name never holds input

The rule, for every game: **a line that names or answers what she just tapped never holds input.** The game updates its state, starts the line, and takes the next tap at once; a new tap's line cuts the old one (`voice.speak` already cuts a clip and cancels device speech).

- **Which lines.** Cuttable and never awaited before input reopens: a tapped thing's name (a card, a day, a letter, a colour), a right answer's short confirmation, a free choice's reaction. **Held**, as now: the instruction (`ctx.instruct`), which she needs to hear to know what to do, a hint after a miss, and a step's spoken result where the next step depends on hearing it (Day by Day's `week.record`, "Tuesday was rainy", before the next day is asked). A held line still shows it is holding: R5.
- **The shell's part.** `voice.stop()` ends every pending line's promise at once (the muted timer included, so a muted line can be cut), and a new `say` resolves the one it cuts. A unit test in `src/audio/voice.test.ts` asserts both with speech muted. This keeps games that await a line from waiting out a line nobody hears.
- **The Day by Day pilot.** The card pick (`week.name`) stops awaiting: `busy` clears as the line starts, and a tap on the arrow, or another card, acts at once and cuts the name. A wrong pick's boing and hint stay held. The `week` suite's "interrupted speech" case is extended to tap the arrow during the name and see the day placed.
- **The other games** are classified, not swept: a grep at `4fc6e429` finds about 120 game folders that both set a busy-style flag and await `ctx.say`, which is an upper bound on games that might hold a name, not evidence that they do. A docs-only step reads each and lists, per game, the awaited lines that name a tapped thing (R4's cuttable kind); fixes then go in by game batch as each game is next worked on, at the existing-game bug-fix tier. Phone-ready games (upright-ready, on Today's six) first.

### R5. A held line shows it

While a game holds input for an instruction or a hint, the corner guide (her friend) shows it is talking with a gentle bob (the guide has no talking look today; `makeGuide` in `src/creatures/companion.ts`), and a tap on the board during the hold gives the soft UI tap (`sfx.tick`) rather than nothing. This is shell work in `GameScene`'s `say`/`instruct` wrappers, so every game gets it without its own change; a game whose own large pet stands in for the guide (AGENTS: spoken support) shows it on that pet instead.

## What the rule tests assert

- `voice.test.ts`: with speech muted, `say` then `stop()` resolves the first promise at once; `say` then a second `say` resolves the first when the second starts.
- A `chosen` helper test in `src/ui/`: the chosen node keeps its pressed scale and ring, every other node passed is at 60% alpha, and undoing it (a scene that stays, such as an aborted `leave`) restores both.
- The root scenes' `leave` tests (or `src/app/screen-keys.test.ts`-style tests over the real scenes): `go` is called within 0.3 s of the tap with the line still pending; a second tap while leaving calls nothing.
- Day by Day's rule or scene test: after a card pick, the arrow is accepted before `week.name` resolves; `week.record` still holds.
- `chooser.test.ts`: cards are built from the profile index before every `peek` resolves, and each fills in when its save arrives.

## Slices and check tier

1. **U7a, the shell and the phone's way in** (shell tier): R1, R2, R3 for the chooser and Today's six, and R4's shell part (`voice.stop`). Files: `src/audio/voice.ts` and its test, `src/ui/buttons.ts`, `src/app/App.ts` (marks; the snapshot only if R1 points there), `src/app/scenes/DailyScene.ts`, `src/app/scenes/ChooserScene.ts` and `src/app/chooser.test.ts`. Checks: typecheck, unit tests, build, the R1 probe before and after, `BROWSER_SUITE=phonefit` (the upright root pass: Today's six to a round and back) and `BROWSER_SUITE=profiles` (the chooser). No `world`: no route changes. No offline check: persistence and assets do not change.
2. **U7b, Day by Day and the held-line look** (existing-game bug fix plus shell): R4's pilot and R5. Files: `src/games/day-by-day/index.ts`, `src/app/scenes/GameScene.ts` (the guide's talking look and the wait tick), `src/creatures/companion.ts` (the bob). Checks: typecheck, unit tests, `BROWSER_SUITE=week WEEK_LEVELS=1,4` (a tap on the arrow during the name), and `fingerdemo` at Day by Day's first and last levels only if the bot's timing changes. Build, since `GameScene` is shared.
3. **U7c, the tablet root** (shell tier, after U6a and U6b): R2 and R3 for Home, Explore, the Arcade, the library and creature play. Files: those scenes' `leave` helpers (`HomeScene`, `ExploreScene`, `ArcadeScene`, `LibraryScene`, `PlayScene`). Checks: typecheck, unit tests, build, the R1 probe, `BROWSER_SUITE=home` (its main flow walks every one of these screens). No `world` unless a route changes.
4. **U7d, classify the rest** (docs only; [done 2026-11-12](never-swallow-a-tap-lines.md), every land read): R4's list of awaited name lines per game, written into this page or a short table beside it, and a READY line per game batch that holds any.

Each slice is one session. U7a can ship alone: it is the phone's part.

### U7a as built (2026-11-10)

- **Measured (R1).** `src/engine/timing.ts` marks the tap, the change's start, the next scene built, its first frame and settled; `scripts/tap-timing.mjs` reads them (numbers in the [verification entry](../archive/VERIFICATION-2026-11-10.md#2026-11-10--u7a-the-phones-way-in)). The waits were the cause: a tap waited for its line or the cap (1.1 s on Today's six, a flat 1.3 s on the chooser), stretched further because `tw` clamps a frame to 50 ms. `init()` and the snapshot together took 1–7 ms, so neither was cut.
- **Built.** `voice.stop()` and a new line end every pending line (R4's shell part). Today's six goes through `WayOut` (`src/app/leave.ts`) with `chosen` (`src/ui/buttons.ts`): the pressed card or button stays pressed with a white ring, the others dim to 60%, and the screen changes after a 0.2 s beat (R2, R3). The chooser waits the same beat.
- **Decided while building.** A Today's six card no longer says the game's name: the game says it as it opens, and the six's line would be cut after a syllable. The chooser keeps its giggle but drops its spoken greeting (`start.hi`) for the same reason, since the next screen's first line follows within half a second. The chooser keeps its own chosen look: the card pops and the others fade to 25%, stronger than 60%.
- **Not built, by measurement.** The chooser's cards before every save is read (R3's last point): with six players its cards showed 62–87 ms after its first screen, so there was nothing to gain, and its `chooser.test.ts` rule test is unwritten. If a real phone shows a slow chooser, it comes back.
- **Left for U7b (built, below).** The result's Back (`GameScene.leaveSaying`) still waits up to 1.1 s for its line. That is about 1.2–1.4 s from tap to change, on every phone round.

### U7b as built (2026-11-10)

- **Measured.** `scripts/tap-timing.mjs` medians (speech off, three runs), before → after, a result → Today's six. Phone 390×844: the change starts 1235 → 329 ms, settled 1567 → 697 ms. Computer 1024×768: the change starts 1356 → 443 ms, first frame 1358 → 445 ms, settled 1900 → 1025 ms. Today's six → a game is unchanged (about 183–208 ms). Numbers in the [verification entry](../archive/VERIFICATION-2026-11-10.md#2026-11-10--u7b-the-phones-rounds-never-hold-a-tap).
- **Built (R4 pilot).** Day by Day's card pick (`choose`) no longer awaits `week.name`: `busy` clears as the line starts, so the arrow or another card acts at once and cuts the name. `week.record`, the instructions and the hints still hold.
- **Built (R5).** `src/app/held-line.ts` (`HeldLines`) follows every line a game starts through `ctx.say`, `ctx.instruct` and `ctx.sayIn` in `GameScene`. While one is pending the corner guide bobs (`Companion.talking`, eased in and out, added to the hop). A board tap (not the guide, Back or help; not on the how-to card or the result) during a pending line gets `sfx.tick` on the next frame, but only if the tap made no sound and started no line.
- **Built (the result's Back).** `GameScene.leaveSaying` (the result's Back, the in-round Back and Home, the how-to card's Back) starts its word and changes screen after `LEAVE_BEAT` (0.2 s, `src/app/leave.ts`) on a guarded window timer, not the scene tweens, which stand still under the how-to card.
- **Decided while building.** The tick rule needed to know whether the game answered: every `sfx` call now counts itself in `src/audio/sound-count.ts` (`soundCount`), so a game that answered the tap is never double-sounded. `nav-meaning.test.ts` was updated for the beat.
- **Not built.** The large-pet games' star does not bob: a bob would move the star's attach points and drop targets, so the corner guide is the only talking look. Leftover for any game with a large pet, if a phone playtest shows the held line is unclear there.

### U7c as built (2026-11-10)

- Home, Explore, the Arcade, the library and creature play take the first navigation tap through `WayOut`. The chosen picture stays squashed with a white ring, the other choices dim to 60%, and scene touches stop for the 0.2 s beat. The spoken line starts with the tap and can play through the change until the destination speaks.
- Explore's existing grows into a location or a favorite carry the pressed picture into the transition. The other exits keep their crossfades. In creature play, tapping the Friends nest starts the pet's cheer and opens Friends on the beat. Arcade card previews, Topics, and Little surprises' tap and hold still act within their own screens.

**Dependencies.** U7c edits the same root scenes as U6a (the Arcade), U6b (Explore, Home's routes) and phone-portrait shell slice 3 (creature play, the library, the Arcade). All three landed before U7c. U7a's `DailyScene` change is the `leave` helper and the card's tap only, which U6b (the All games button's target) does not touch, so U7a may go before or after U6. `classic/` is untouched: its map and menus are a separate shell and are not reached from a phone's root.
### U7d as classified (2026-11-10)

- The 25 games ready for upright play were read ([the lines page](never-swallow-a-tap-lines.md)): two hold input on a line R4 forbids, `animal-snack` (`snack.yum` in *who* rounds, `snack.full`) and `far-lights` (six right-answer lines), and [fix batch 1](never-swallow-a-tap-lines.md#fix-batches) is built (2026-11-10, PR #1488).
- Eight games praise a finished board before the next one; that is an optional second batch that waits for a playtest note. Every other awaited line is a closing line or a proper hold.
- Bubble Beach's 13 other games were read 2026-11-11 ([their rows](never-swallow-a-tap-lines.md#bubble-beach)): seven hold a cut line; [fix batch 3](never-swallow-a-tap-lines.md#fix-batches) is built (2026-11-11, PR #1532) and so is batch 4 (2026-11-11, PR #1534).
- The other 120 games were classified a land at a time, finishing with Tinker Lab on 2026-11-12 ([the reading](never-swallow-a-tap-lines.md), fix batches 5 to 26; batches 5, 6 and 7 are built, 2026-11-12, PRs #1545, #1546 and #1547); nothing was played or timed.

## Open decisions

For [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md) after U7a is played, none blocking:

- **A different picture after a first tap.** Decided: the first choice stands while the screen changes (R2). The alternative, letting a later tap redirect, was rejected for making the screen she lands on depend on the timing of two taps.
- **Which lines hold.** Decided per R4: instructions, hints and a step's spoken result hold; names and confirmations do not. A game where real play shows she needs to hear a name before moving on can hold it, written down in that game's GAMES entry.
