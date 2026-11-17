# Cue Studio 4–6: signals, a repeat and a passed cue

**Built:** levels 4 (P4a, `claude/cue-studio-which-signal`) and 5 (P4b, `claude/cue-studio-repeated-phrase`, PR #1722); to build level 6, read “Level 6: Pass the cue”. Level 4 shipped the lean under S8: school range 3–4, entry 3, ordinary adaptation; level 5 widened it to 3–5. Level 4 differences from the spec: voice ids use hyphens (`cue.when-bell-wave`, `cue.unset-bell`, `cue.signal-miss-bell-wave`, `cue.signals-check`, `cue.signals-success`, `cue.help-signals-check`); one board is drawn behind both rows; a result chip keeps what its row last did after an edit but drops its tick or cross. Level 5 differences: voice ids use hyphens (`cue.repeat-goal`, `cue.repeat`, `cue.repeat-off`, `cue.once`, `cue.phrase-wave-turn` and `-turn-wave`, `cue.phrase-miss-<first|second>-<wave|turn>`, `cue.phrase-fix-<first|second>-<wave|turn>`, `cue.help-repeat`); the pet moves right to centre x 880 but keeps its built height (its origin is at its feet, so it stands above the slot row and the ghosts fit beneath it at x 772–976); `mismatch()` still returns a number, with `REPEAT = 2` for the cap, rather than a typed target; `isProgram` was not extended (Repeat is a typed boolean set only by `toggleRepeat`, Help and Undo); “Repeat with an empty slot … Play performs the prefix” was built as the filled move played once; `newStudio`'s third argument changed from a boolean to a shape (`'show' | 'rows' | 'repeat'`). Voice-wording source check done 2026-11-16 (see Spoken support). Level 6 (P4c) is not built.

P4 definition, 2026-11-16, `claude/define-cue-studio-p4`. Docs only. Builds on the built levels 1–3 ([definition](cue-studio.md), [game page](../games/cue-studio.md)) and the [programming study's ladder](../deep-dives/subjects/programming.md#first-games-proposed-ladder-cue-studio). Levels 4 and 5 are built (see Built above); level 6 is not. Each level below is one separate build session, in order 4, 5, 6.

## Scope and identity

The same studio, the same saved companion and the same edit, run and Check controls. Each new level adds exactly one programming idea to the two-command show she already edits:

- **4 Which signal?** An event starts an action. Two pictured signals each hold one action, and she fires either signal herself, in any order.
- **5 A repeated phrase.** One bounded Repeat plays a two-move phrase exactly twice.
- **6 Pass the cue.** The pet's show sends one leaf to a second actor, a bird, whose own rule runs when the leaf arrives.

Each stays a requested-repair level on level 3's rules: free experiments, a deliberate Check, wrong Checks as the only misses, graduated help and a supported finish. None of them is a free-creation level. Levels 1–3, their accounting, saves and IDs are unchanged. The levels must stay distinct from level 3's ordering puzzle. Level 4 is accepted per signal, not by position. Level 5 is accepted on the played trace, whichever way it is written. Level 6 is accepted on a trace that crosses two actors. If a build ends up as "the same two slots with new icons", reopen this definition rather than registering the level.

**Excluded:** a variable repeat count, nested or unbounded loops, more than one Repeat, wall-clock or timed events, parallel actors writing at once, cycles (the bird never sends), more than one message kind in flight, saving or remixing programs, couch or controller play, a practical puppet card, shared interpreter infrastructure (another game has to need it first), and shell, save or navigation changes.

## Bands and entry: lean, under standing rule S8

The 2026-10-23 mapping kept school at 3–3 so that "no unseen harder concept follows success". Standing rule S8 in the [decision record](../archive/DECISIONS-2026-10-23.md#standing-rules) lets a build adopt a definition's stated lean for band questions. The inquiry decision is the precedent: it let level 5 step up to 6 by the ordinary rule. The lean here:

- **Ranges grow one rung per build.** School is 3–4 once level 4 lands, 3–5 with level 5, and 3–6 with level 6. The default entry stays 3. Pre-K stays 1–2. No preschool, toddler or grownup level is added.
- **Ordinary adaptation.** Two smooth rounds (at most one miss, no hints) step up, and two struggling rounds step down, by `src/progress/difficulty.ts`. Level 3 finishes only on a successful Check, so a step up rests on a real request, never on free creation.
- **Not unseen.** Every new level opens with its own spoken instruction, its own level-scoped how-to card (the card shows every round), and a free first try before any Check. Pins and the grown-ups' level picker keep working within the range.
- **Alternative:** keep school at 3–3 and reach levels 4–6 only by pin. The developer can choose this at any time. The level-4 build records which one it shipped.

Level descriptions: 4 "Which signal: give the bell and the flower each a move, then check them"; 5 "A repeated phrase: play a two-move phrase twice with Repeat"; 6 "Pass the cue: the pet's show sends a leaf and the bird answers".

## Level 4: Which signal?

**What is on screen:** two event rows. Each row has the following, left to right:

- a request pad showing a signal over an action (tap it to hear "When the bell rings, wave");
- a signal pad: a bell, or a flower, each with its own shape and a spoken name;
- one action slot, filled from the same Wave and Turn palette;
- a non-interactive result chip showing what that row did the last time it fired.

The authored request is bell→Wave and flower→Turn. A seeded variant (`ctx.rng`, two authored cases) reverses it to bell→Turn and flower→Wave. Both slots start empty, so the first decision is binding, not repair.

| Item | Behavior |
| --- | --- |
| Fire a signal | Tap a signal pad. The pad rings or opens, a small copy of its icon floats over the pet, and the pet performs that row's action. The chip shows signal→action. Free, any order, any number of times. An empty row fires to a shrug with "Nothing is set for the bell yet": no action, no miss and no hint. |
| Play and Step | Hidden at this level. The signal pads are how a show runs, and the Undo, Help and Check/Finish positions are unchanged. |
| Edit | Same insert, select, replace and Undo rules as levels 2–3, with slot 0 belonging to the bell row and slot 1 to the flower row. A tap with no selection fills the first empty row. Every edit clears a successful Check. |
| Check | Needs both rows filled; otherwise it gently points at the empty row, with no miss. Check fires each signal once, visibly, bell first then flower, with the signal icon over the pet each time. Acceptance is **per row**: each row's bound action equals that row's requested action. The order Check fires them in is presentation only, and the result can never depend on it. Each row's chip marks match or no match. |
| Feedback | A failed Check is one miss, with a gentle boing. It names the first mismatching row by its signal, never by position: "When the flower showed, Pip waved. The picture asks for a turn." All bindings are kept. |
| No hidden input | Only pads she can see and tap fire events. Check fires only those same two signals, and nothing fires on a timer or by itself. |

Accepted: exactly the requested binding. Wrong bindings are the other three. Same action in both rows is a mismatch on one row; the swapped binding is a mismatch on both, and the bell row is named first.

## Level 5: A repeated phrase

**What is on screen:**

- a request strip: one replay target showing the four-move trace as two bracketed pairs, for example wave turn | wave turn;
- the two-slot shelf;
- a **Repeat** cap at the shelf's right end: a loop arrow with two dots, shaped so it doesn't rely on colour or a digit.

Tapping the cap toggles it. When it is on, a bracket wraps both slots and two ghost copies of the slots appear faintly after the cap, showing what the second pass will play. The ghosts can't be tapped.

The authored request is (Wave, Turn) twice. A seeded variant asks for (Turn, Wave) twice. The shelf starts empty with Repeat off.

| Item | Behavior |
| --- | --- |
| Meaning | Repeat on: the body (both slots) plays exactly twice, so the trace is four moves. Repeat off: the two slots play once, so the trace is two moves. There are no other counts, no nesting, and the body is always both slots. |
| Toggle | Turning Repeat on or off is an edit: it can be undone, and it clears playback and Check eligibility. Repeat with an empty slot is incomplete. Play performs the prefix, but Check points at the empty slot with no miss. |
| Play and Step | Free. Play runs the expanded trace. Step advances one executed move, so a repeated show takes four presses, and the slot that is acting glows on both passes. Each slot has two trace dots, one for each pass, so the second pass shows visibly. |
| Check | The expanded actual trace must equal the four-move request. Repeat off with the right pair fails at move 3: "Your show played wave, turn once. The picture asks for it twice." Repeat on with a wrong body fails at the first wrong slot, named with first/second wording. One miss per failed Check. |
| Two forms | A flat four-slot shelf is **not offered**. The study allows it "if offered", but four slots plus the actor don't fit the 1024-wide view at 112 units. The comparison it was for is still visible: the ghosts after the cap show the expanded form, and the trace dots light four times. No score rewards the shorter program. |

## Level 6: Pass the cue

**What is on screen:** two actors in the right-hand column, the pet above and a code-drawn bird below, holding a folded paper fan. There are two rows:

- **Pet row:** two slots. The palette is Wave, Turn and **Send** (a leaf with an arrow; spoken "Send a leaf").
- **Bird row:** a receiver tile that toggles between a leaf and a shell when tapped ("When a leaf comes" / "When a shell comes"), followed by a fixed, non-interactive picture of the bird's action: it opens the fan.

The request strip shows three pictured steps: the pet waves, the pet sends a leaf, and the bird opens its fan.

| Item | Behavior |
| --- | --- |
| Semantics | The pet's slots run left to right. A Send launches one leaf, which flies along a fixed path to the bird. **Delivery is synchronous:** if the receiver matches, the bird opens its fan to completion before the pet's next command starts. If the receiver doesn't match, the leaf lands beside the bird, the bird doesn't react and the leaf fades. That isn't a mistake; the trace records the Send with a "nobody listening" mark. Two Sends make two deliveries, so at most four actions run. The bird never sends, so there are no cycles. Results come from commands only, never from how long the animation takes. |
| Trace | A tagged trace (`P:W`, `P:T`, `P:S`, `B:F`). Small badges numbered 1, 2, 3 and so on light on the pet slot, the receiver tile and the fan picture as each action runs, so the order can be seen crossing the rows. |
| Edits | Pet slots use the level-2/3 select-and-replace rules with three cards. Toggling the receiver is an edit: it can be undone and clears Check. There's no empty receiver. |
| Play and Step | Free. Step advances one pet command, and a delivery belongs to the Send's step. The first Play is a free watch. |
| Starts | Two authored cases, picked by seed. **A**: pet [Wave, Send] with the receiver set to shell. The fan never opens, and one repair (the receiver) fixes it. **B**: pet [Send, Wave] with the receiver set to leaf. The fan opens before the wave, and two repairs (one per slot) fix it. Both are reachable, and every repair reduces the mismatch. |
| Check and feedback | The tagged trace must equal [P:W, P:S, B:F]. Feedback names the first difference in terms of the actors: "The leaf came, but the bird was listening for a shell." or "The bird opened its fan before Pip waved." One miss per failed Check, and every command is kept. |

Level 6 is the study's L-sized rung: a second actor, a flight path and tagged traces. It is its own build session, and if it runs long it checkpoints in a draft PR.

## Misses, help and a supported finish (levels 4–6)

The accounting is level 3's, with nothing new:

- **Misses:** only a full explicit failed Check counts one. Firing signals, Play, Step, the free first watch, edits, Undo, empty or incomplete controls and a "nobody listening" leaf are never errors.
- **The clue:** two failed Checks supply the earliest-mismatch clue, counted as one hint. Asking Help before that supplies the same clue, also counted once.
- **Repairs:** each later Help repairs that one target, counts one hint and demonstrates it. Help then moves on to the next mismatch.
- **Help identities:** `clue:<target>` and `repair:<target>`, where the target is `row:bell`, `row:flower`, `slot:0`, `slot:1`, `repeat` or `receiver`. These identities survive Undo and Start again, so the same assistance is never charged twice.
- **When the program is already correct:** Help points to Check, which still performs the show visibly, and then Finish is offered.

**How each level maps the earliest mismatch to a target:**

| Level | Earliest mismatch | Target the clue and repair use |
| --- | --- | --- |
| 4 | — | The first mismatching row |
| 5 | A slot is wrong | That body slot |
| 5 | Both slots are right but the trace is two moves short | `repeat` (repair turns it on) |
| 6 | An action out of place | The pet slot |
| 6 | The fan is missing after a Send | `receiver` |

Every starting program therefore has a fully supported path to Finish. Finish calls `ctx.finish({ misses, hints })` once for the ordinary sticker, and the round never auto-finishes. A helped finish is not reported as mastery.

## Interruptions

A run here means a signal firing, a Play or Step, a repeat pass, a leaf in flight, or a Check.

| Case | Behavior at levels 4–6 |
| --- | --- |
| Tap while busy | While any run is in progress, signal pads, Play, Step, Check, Finish, edits, the Repeat cap and the receiver are guarded. A second signal tap during a firing is ignored with a gentle pulse; it is never queued. |
| Pause | Freezes the current animation and the leaf in place, and resumes from the same point. |
| Resize | Keeps the program, selection, Repeat, receiver, run position and accounting. Hit areas, the leaf path and the trace badges are recomputed from `view`, so a leaf in flight is redrawn at the same fraction of its new path. |
| Start again | Cancels the run through the existing run-id guard and restores the authored start: empty rows (level 4), an empty shelf with Repeat off (level 5), or the seeded start (level 6). Misses and help identities are kept. |
| Leave or destroy | Cancels the run, hides any leaf and releases its tween, and awards nothing. |
| Late callbacks | A callback from a cancelled run, a destroyed scene or a pre-edit program never sets "played" or "checked", never adds a trace entry and never finishes. The existing `dead` and `runId` guards cover every new await. |

## Rules model to keep in `logic.ts`

The rules stay local to the game; no shared interpreter.

- `Studio` gains optional, level-scoped state: `repeat: boolean` (level 5) and `receiver: 'leaf' | 'shell'` (level 6). Level 4 reuses the two slots as rows, with a pure `fire(s, row)` that returns that row's action or null.
- A pure `run(s)` returns the executed trace: plain `Cue[]` for levels 1–5, where level 5 is the body twice when Repeat is on, and a tagged `Act[]` for level 6.
- A pure `checkRows(s)` handles level 4.
- `mismatch(s)` returns a typed target rather than a slot index.
- `isProgram` accepts `S` only in a level-6 studio and rejects malformed rows, repeats or receivers without running them.
- The plans gain levels 4–6 with their request, any variant and start. `LEVELS.school.max` rises with each build.

## Layout (from the built `resize()`, not the original spec)

The built game uses 112-unit boxes with gaps of at least 16. Landscape is centred in a 1024×768 box. Portrait is centred in a 1024×900 box, with the palette at y 600 and the controls at y 748. The actor's scale is `min(1.3, 190 / height)`, so the actor stands about 190 units tall. The coordinates below are top-left corners in those boxes; landscape is listed first, then portrait.

**All levels:**

- The five control positions stay at x 192, 320, 448, 576 and 704: at y 532 in landscape and y 748 in portrait.
- Guide clearance: in landscape nothing interactive enters x 0…160 at y 500 and below; in portrait the guide keeps x 0…160 at y 660 and below.
- The top 0…128 stays clear for the shell.

**Level 4:**

- Palette: landscape at y 132, x 384 and 512 (the request strip isn't needed); portrait unchanged at y 600.
- Rows: landscape at y 260 and y 388; portrait at y 300 and y 428.
- Within each row: request pad at x 96, signal pad at x 240, slot at x 384, and a 72-wide result chip at x 512.
- The pet stays where it is built (landscape centre x 828, y 330; portrait x 800, y 360). Everything interactive in the rows ends by x 584, clear of the pet.

**Level 5:**

- Request strip: one 368×112 target at x 384 (landscape y 132, portrait y 144).
- Slots: x 384 and 512; Repeat cap at x 640. Landscape y 356, portrait y 420.
- Ghost copies sit beyond the cap and are scenery.
- The palette is where it is built.
- The pet moves to centre x 880 (visual about x 788…972) so that it clears the cap, which ends at x 752.

**Level 6:**

- Request strip at the same place as level 5.
- Pet row at y 260 (landscape) or y 300 (portrait), slots at x 384 and 512.
- Bird row at y 388 (landscape) or y 428 (portrait): receiver at x 384, fan picture at x 512.
- Palette, landscape: Wave at x 96, y 260; Turn at x 224, y 260; Send at x 224, y 388 (it clears the guide by staying right of x 160).
- Palette, portrait: y 600 at x 384, 512 and 640.
- Right-hand column at centre x 880. The pet is scaled to about 150 tall, centred at landscape y 250 or portrait y 330. The bird is about 120 tall, centred at landscape y 440 or portrait y 480.
- The leaf flies down that column.

These are specification rectangles, not a fit proof. Each build asserts non-overlapping request, row, palette, control, guide and navigation bounds at the harness's portrait and landscape views, including compact views, before inspecting one portrait screenshot. Targets are never scaled below 100.

## Spoken support, how-to and demonstration

These are planned voice IDs; levels 4 and 5 are built with hyphenated ids (see Built above), so treat the dotted names below as proposals for level 6 and the rest as the original spec. `ctx.instruct` carries each level's goal and `ctx.say` the rest.

**Source check (done 2026-11-16, a session check that replaces an educator review under the 2026-10-23 programming decision):** the ScratchJr teaching link (sites.bc.edu/scratchjr/teach) is dead (HTTP 410) and scratchjr.org/learn/blocks returns no readable text, so two live sources were read instead. [CS Unplugged Kidbots, "Fitness unplugged"](https://www.csunplugged.org/en/topics/kidbots/unit-plan/fitness-unplugged/) words a loop for ages 5–7 as "whatever is in the hula hoop will be repeated" with a number for how many times, and starts a program on a spoken signal ("When the Tester says 'Go' …"). The [Scratch Wiki Repeat block page](https://en.scratch-wiki.info/wiki/Repeat_()_(block)) says "Blocks held inside this block will loop a given number of times". These support "When the bell rings, wave." (level 4) and "Repeat two times." / "plays them again" (level 5). The level 6 wording (send and receive a message) still needs its own check at that build.

| ID | Speech |
| --- | --- |
| `cue.signals` | "The bell and the flower each start a move. Give each one a move, try them, then check." |
| `cue.bell`, `cue.flower` | "The bell." / "The flower." |
| `cue.when.<signal>.<cue>` | "When the bell rings, wave." (one line per signal and action) |
| `cue.unset.<signal>` | "Nothing is set for the bell yet." |
| `cue.rowMismatch.<signal>.<actual>.<wanted>` | "When the flower showed, Pip turned. The picture asks for a wave." |
| `cue.repeatGoal` | "The picture plays two moves, then plays them again. Use Repeat to say it twice." |
| `cue.repeat`, `cue.once` | "Repeat two times." / "Your show played once. The picture asks for it twice." |
| `cue.pass` | "Pip's show can send a leaf to the bird. Fix the show so the bird opens its fan at the end." |
| `cue.send`, `cue.listen.<leaf|shell>` | "Send a leaf." / "When a leaf comes." |
| `cue.nobody` | "The leaf came, but the bird was listening for a shell." |
| `cue.tooSoon` | "The bird opened its fan before Pip waved." |

How-to cards, one per level:

- **Level 4:** tap a signal to try it; choose a move for each signal; Check; Finish.
- **Level 5:** choose two moves; tap Repeat; watch them play twice; Check; Finish.
- **Level 6:** watch where the leaf goes; change the pet's moves or what the bird listens for; Check; Finish.

Ghost finger (`autotouch`), operating the real controls:

- **Level 4:** Wave into the bell row, Turn into the flower row, fire the flower, fire the bell, Check, Finish.
- **Level 5:** Wave, Turn, Repeat, Play, Check, Finish.
- **Level 6, case A:** Play, tap the receiver, Check, Finish.
- **Level 6, case B:** Play, select slot 1, Wave, select slot 2, Send, Check, Finish.

The bot reads public state to choose targets but never mutates it. The wrong-Check and help paths belong to the filtered browser play, not the demonstration.

Co-play: one grown-up rings an imaginary bell and the other does the bound move, then they swap the rules. This is a suggestion line only; no practical card ships with this packet.

## Build slices and checks

| Slice | Complete exit | Tier |
| --- | --- | --- |
| **P4a: build level 4** (built) | Signal rows, free firing, per-row Check, help targets, how-to, voice, ghost finger, school range 3–4 (or pin-only, recorded) | New interaction: typecheck; unit tests; one filtered play of levels 3 and 4 with an empty fire, one wrong Check and help; portrait screenshot; build only if shared files change |
| **P4b: build level 5** (built) | Repeat cap, ghosts, expanded trace, help on `repeat`, range 3–5 | New interaction, same shape, at level 5 |
| **P4c: build level 6** | Second actor, Send, receiver, synchronous delivery, tagged trace, both seeded starts, range 3–6 | New interaction at level 6. L-sized: checkpoint as a draft if it runs long |

Rule tests each build adds:

- **Level 4:** all nine bindings, including empty rows; per-row acceptance is independent of firing order; the right row is named; a fire never edits anything.
- **Level 5:** expansion is exactly two passes; Repeat on an incomplete body is incomplete; every wrong body and the Repeat-off case fail at the right target; help repairs Repeat at most once.
- **Level 6:** both starts are reachable and each repair reduces the mismatch; a matched delivery runs before the next pet command; an unmatched Send never runs the bird; [S,S] stays at most four actions; malformed `S` or receivers are rejected.
- **All three:** idempotent help identities across Undo and restart; only wrong Checks miss; no late callback finishes the round.

Device, child and speech evidence stay parked; Chrome establishes none of it.
