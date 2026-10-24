# Cue Studio 1–3: a tiny executable performance

P1 definition, 2026-10-22, [PR #834](https://github.com/rjdunlap/neo/pull/834), worker `01a1664d-d24f-7b92-b6de-d9039e09f58a`, branch `codex/define-cue-studio`. Based on the [programming study](../deep-dives/subjects/programming.md) and [recommendation packet](../deep-dives/subjects/RECOMMENDATIONS.md#programming-recommendations). **Docs only; no game, registration, code or device evidence.** The rules below are a concrete proposal for developer review, not approval of the outstanding decisions.

**Built 2026-10-23 (levels 1–2, pre-K, Tinker Lab), [PR #917](https://github.com/rjdunlap/neo/pull/917), `claude/cue-studio`.** Layout deviations from the specification below: the landscape palette sits 32 units further left (x 96 and 224) and the portrait palette is at y 600 with the controls at y 748, so the cards and buttons clear the shelf. Level 3 (requested repair with Check, school) is claimed for P3 on `codex/cue-studio-p3` (2026-10-24). Scope: requested/actual traces, wrong-Check accounting, local repair, graduated help, Undo and restart, school 3–3, level-scoped card/voice and ghost finger. Expected files: `src/games/cue-studio/*`, voice script/how-to, browser harness, README and game/roadmap/study/verification closeout docs. No later programming levels or shell/save changes.

## Scope and identity

Fun action: give the saved companion a tiny show to perform, watch each command light as it acts, then change the show. Learning purpose: distinguish choosing a symbolic instruction from executing it, follow order, and revise the first mismatch against a visible request. Only Wave and Turn, at most two slots, one actor and one terminating trace. IDs 1–3 and `cue-studio` are provisional until identity is accepted; no saved IDs are reserved by this definition.

The editor must earn a new game: the player can replace either command independently and see the changed trace, including two different orders ending in the same pose. Story Theater owns narrative choices/endings; Dance Workshop and Song Maker own timed musical composition; Puppet Workshop owns physical mechanisms; Robot Path owns routes. If the eventual experience is only selecting a canned animation or ending, reopen identity and consolidate instead of registering this candidate. Existing Robot Path decisions, including its routine/couch work, are untouched.

P2 onward is **not undertaken here**. Events, repeats, messages, older language/data cases, practical puppet cards, couch/controller support, recording, keeping/remixing programs, new saves and shared interpreter infrastructure are excluded. Programs are transient local arrays; leaving discards them without losing any earned reward. No shell, navigation or persistence change is requested. Root Explore and classic land/origin routes would use their existing contracts if a build is approved.

## Finite command and editing rules

| Item | Exact proposed behavior |
| --- | --- |
| Wave (`W`) | Companion raises and lowers a paw once; a hand-shaped icon and spoken “Wave.” Returns to the neutral initial pose. One trace token `W`. |
| Turn (`T`) | One complete spin in place, with a circular-arrow icon and spoken “Turn all the way around.” No directional or distance state. Returns to the same neutral pose. One trace token `T`. |
| Execution | Read occupied slots left to right. Each token completes before the next starts. Final pose alone never determines acceptance. Replay starts at neutral and clears the previous trace. Logical results depend on commands, never animation duration. |
| Insert/select | Initially no selection; tap an action tile to append into the first empty slot. Tap an occupied slot to select it, then tap an action to replace it; tap it again or the empty shelf to deselect. A selected empty slot still inserts at the first empty position: no holes. Selected command has outline and marker, independent of color. |
| Full shelf | With no selection, an action tap gently pulses the two occupied slots and says “Choose a place to change.” Never silently overwrite or count a miss. Same-command replacement leaves the program unchanged. |
| Undo | Restore the immediately preceding program edit, including a help edit; keep one bounded snapshot. Undo after Undo is inert. Playback/selection/help explanation are not edits. Empty Undo is inert with a quiet visual response. |
| Play and Step | Play performs the current prefix; Step performs one command per press, starting at neutral after an edit or completed trace. Prefix playback is welcome but cannot finish an incomplete show. Completing a full stepped trace satisfies playback just as Play does. |
| Edit invalidation | Every real edit/Undo clears playback eligibility and a successful Check. A new complete run is needed before Finish. Selection alone changes neither. |
| Busy/empty | While an action is playing, show its slot/trace marker and guard repeat Play/Step/Check/Finish and edits. Empty Play/Step or incomplete Check gently indicates the empty slot, with zero misses/hints. Leaving/restart/cancel never completes a partial run. |

All action, slot and control targets give immediate touch-down feedback and use shared `onTap`; drag is unnecessary in this first packet. Palm rejection/cancellation and cleanup use the existing shell/input contracts. Pause freezes a run; restart clears local program/run state to the authored round start, retaining round miss/help accounting and supplied-assistance identities so restarting cannot erase assistance. Destroy cancels/guards animation continuations, listeners and owned resources; late callbacks cannot restore eligibility or award completion.

## Three complete rounds and all alternatives

| Level | First action, growth and accepted result | Finish |
| --- | --- | --- |
| 1 **Make a move** | Empty one-slot shelf. Choose Wave or Turn, then Play. Accept exactly `[W]` or `[T]`; replay/change as often as desired. | A complete playback of the current one-command program enables pictured Finish. No Check and no wrong creation. |
| 2 **My little show** | Empty two-slot shelf. Choose two commands, watch and optionally replace either one. Accept exactly `[W,W]`, `[W,T]`, `[T,W]`, `[T,T]`. | A complete current two-command playback enables Finish. No required variety, preferred order or Check. |
| 3 **Fix the cue** | Request shows `[W,T]` above starting `[T,W]`. First Play is a free watch, with separate requested and actual trace rows. Replace slot one with Wave and slot two with Turn, in either editing order. | Only an explicit successful Check enables Finish. Check runs the current full program and compares trace tokens. Exactly `[W,T]` succeeds; `[W,W]` mismatches slot two, `[T,W]` and `[T,T]` mismatch slot one. Play/Step can freely explore every alternative. |

One round is one complete show, not three hidden trials. Level 3's first request/start pair is fixed; a future seeded authored variant may reverse them to request `[T,W]` from `[W,T]`, accepting only that pictured trace. No other variation is needed for the first slice. Request/trace remain visible; no verbal memory task. A run does not auto-finish: after ordinary or supported success the player deliberately presses Finish, calling `ctx.finish({ misses, hints })` once for the normal sticker. Leaving earlier is comfortable and awards nothing. No countdown, applause timer, optimization score or repeated obligation.

## Misses, help and a supported ending

Only a full, explicit failed level-3 Check counts one miss, once at its end. Give a gentle boing and replayable concrete feedback about the earliest differing action: for the initial program, “The turn came first. The picture asks for a wave first.” Preserve all commands. Ordinary Play, Step, prediction, the first watch, free creation, empty/incomplete controls and editing never count as errors. Rechecking the unchanged full wrong program is another explicit Check and another miss.

After two failed Checks, outline the earliest mismatch and show its requested action beside it. This is one supplied clue and counts one hint. Help before that supplies the same clue and counts it once; showing it again for the same slot/request costs nothing. The next Help replaces that slot with the pictured command, counts one additional hint for that supplied repair, and demonstrates that action. Repeating Help repairs the next mismatch, if any, at one hint per new repair. Undo/repeating a supplied repair never charges that same assistance twice. Keep assistance identities locally per round (clue/repair and slot); after an edit move the displayed clue to the current earliest mismatch without charging for redisplaying already supplied information.

When correct, Help points to Check; Check still visibly performs the whole requested trace, then Finish is available. Thus the initial swapped program always has a two-repair supported path. Do not conceal assistance after success, report independent mastery, or abandon a child at a wrong program.

At levels 1–2, Help fills the first empty slot with Wave and demonstrates its insertion; once full it demonstrates playback. Count each newly supplied insertion once and the first playback demonstration once; replays of help are free. These are offered choices, never corrections to the child's creation. The player can change them and Finish any accepted show after playback. Misses stay zero, actual help remains counted. Normal instruction repeats, how-to viewing, slot/action names and free request replay never count as help.

## Bands and adaptation: proposal awaiting decision

The study's provisional pre-K 1–3/school 2–6 range would let two zero-miss creative rounds push a child into requested repair. The current shell uses the same smooth/struggling rule for all games. **Do not fabricate misses/hints, infer mastery from creation, or quietly add a new adaptation policy.**

Concrete conservative option for developer choice: initial `prek` range 1–2 and `school` range 3–3, with default entries 1 and 3 respectively. Two smooth pre-K creative rounds may move 1→2, but stay within creation; level 3 is a separate school request with a full introduction/free watch. School stays on 3 regardless of help; no unseen harder concept follows success. Existing pins and the shell's manual level picker remain respected within each approved range. Descriptions say “choose one action,” “make any two-action show,” and “repair the pictured order,” without skill grades. No preschool registration before observation, no lap/toddler coding claim, no older/grownup registration now. This narrows the research proposal; it is **not an approved band mapping**. If the developer instead wants both modes in one band, P2 stays gated until entry/adaptation behavior is explicitly settled; a future shell policy needs its own defined scope.

## Land, layouts, art and sound

Tinker Lab is the programming-first recommendation; Story Grove is the alternative only if identity becomes primarily storytelling. At source `ec0addb6`, each already has twelve listed games in `src/content/lands.ts`. That is an audit observation, not evidence a thirteenth fits. Neither destination nor a catalog rearrangement is approved. Location capacity is built (2026-10-24, [definition](location-capacity.md)): a full land turns a page, so a thirteenth game no longer breaks the screen. Before registration, run the existing `landLayout` capacity sweep for every band/four views with the proposed addition; a null result now means a plan fails the sweep and is fixed, not a developer placement decision. Do not shrink targets, invent a land or depend on Maker Harbor/Skywatch Isles.

Use the saved `ctx.companion()` and existing palette/code-drawn hand and spin icons. Optional short pentatonic action sounds are synthesized; meaning and trace remain clear with sound off. Existing quiet music style is sufficient because this is untimed non-musical action composition. No new asset generation/import is needed. “Turn” is a full spin, not an ambiguous facing change.

The following are target rectangles in the existing logical view (minimum 1024×768, expanded in the spare dimension), **a layout specification, not a screenshot or touch-fit pass**. Minimum touch boxes 112×112, gaps at least 16; decorations never intercept touches.

- Landscape: reserve top 0–128 for shell corners/instruction. Place the companion at `(824, 300)`, within visual bounds x736…920/y136…330. At level 3 request slots (112 square) start x384 and512, y136; they do not overlap the actor. Editor slots start x384 and512 at y356; actual trace markers stay with these slots. Palette Wave/Turn at x128/256, y356; selected slot remains distinct from request. One-slot mode centers its slot. Controls Play, Step, Undo, Help and Check/Finish start x192,320,448,576,704 at y532, each112 square. Level 3 Check changes to Finish only after success; a later edit restores Check. Bottom-left x0…160/y500…768 remains clear for the guide. All interactive rectangles end by x816/y644; spare space is scenery.
- Taller portrait logical view: use the same 1024-wide horizontal bounds, stage/request at y144…360; editor y420, palette y564; control row y708, all five112-wide boxes with16 gaps. Anchor the shell guide bottom-left; reserve x0…160 below y660 and keep controls at x192 or greater. Expand scenery below without stretching controls. In a short view use the landscape arrangement. Resizing during playback preserves commands, selection, run position and accounting, then recomputes hit areas from `view`.

Before claiming fit, a build must assert nonoverlapping request/editor/control/guide/navigation bounds at the harness's actual portrait/landscape views (including compact supported views), then inspect one portrait screenshot. Request boxes replay speech, so they too need full hit areas. No downscaling below100, offscreen required control or hidden trace is acceptable. Touch portrait TurnPrompt behavior remains owned by the app.

## Spoken support, how-to and demonstration

Planned voice IDs below are content specifications, not additions to `voice-script.ts`. Use `ctx.instruct` for the repeatable goal and `ctx.say` for names, feedback and help. The normal corner guide repeats the instruction; use no second large guide over the editing area.

| Context / planned ID | Proposed speech |
| --- | --- |
| `cue.title` | “Cue Studio.” |
| `cue.one` | “Choose a move. Then press Play to see {pet} do it.” |
| `cue.two` | “Choose two moves. Press Play to watch your show.” |
| `cue.repair` | “The picture asks for a wave, then a turn. Watch the show. Change the moves, then check it.” |
| `cue.wave`, `cue.turn` | “Wave.” / “Turn all the way around.” |
| `cue.selected` / `cue.full` | “Choose a move for this place.” / “Choose a place to change.” |
| `cue.empty` / `cue.incomplete` | “Choose a move first.” / “There is an empty place. Choose a move for it.” |
| `cue.play`, `cue.step`, `cue.undo`, `cue.help`, `cue.check`, `cue.finish` | “Play.” / “One move.” / “Undo.” / “Show me.” / “Check the show.” / “Finish my show.” |
| `cue.mismatch` | Name actual and requested actions at the first differing ordinal using authored first/second variants; never say the final pose is wrong. |
| `cue.success` | “The moves match the picture. You can finish your show.” |
| Creative finish-ready | “That is your show. Play again, change it, or finish.” |

How-to goal: “Choose moves for the pet and watch their order.” Level-scoped steps: level1 choose one/play/finish; level2 choose two/play/optionally select and replace/finish; level3 replay request/watch/select each mismatch and replace/check/finish. Explain Undo and that Play is always free; only level3 mentions matching or Check. Do not promise a creative program matches one preferred answer.

A future `autotouch()` must operate the exact controls, with a visible ghost finger: level1 choose Wave→Play→Finish; level2 Wave→Turn→Play→select slot one→Turn→Play→Finish (a valid repeated-action show); level3 watch `[T,W]`→select/replace slot one→select/replace slot two→Check→Finish. Its supported variant presses Help, follows each supplied repair, then Check/Finish. It may inspect public game state to choose a target but cannot mutate the array or call success directly. Wrong-Check/help paths belong in the filtered browser check; the ordinary demonstration stays clean. A demonstrated click on a selection must be visibly distinct from its replacement click.

Solo pet supplies the pictured request. Co-play suggestion for a later how-to: one person points to the desired pictured order, the other edits, then exchange roles; the solo round retains its fixed request, with no multiplayer/save/credit feature. The optional off-screen puppet card remains a separate reviewed packet: this definition supplies no practical materials or physical instructions.

## Gates, future proof and closeout

Developer choices remain open in [Waiting](../WAITING-ON-DEVELOPER.md): (1) separate executable-editor identity; (2) initial bands, entry and creative/Check adaptation, including the conservative option above; (3) land/capacity and any resulting catalog change. Early-years CS language review is recommended and not claimed complete; a named practical-card reviewer remains required before such a card ships. Existing [device/person checks](../DEVICE-CHECKS.md) remain open: independent command→Play use, meaningful repair, preschool readiness, iPad speech/sound-off icons, target comfort, trace understanding and voluntary replay. Broad reasoning transfer and tween/parent appeal remain unestablished.

After those choices, P2 can be claimed as **one same-game batch: levels1–2**, using the chosen ranges, both editor sizes, all four two-command alternatives, free experiments and deliberate/helped finish. P3 is a separate requested-repair interaction depending on P2 and the approved accounting/entry policy. These are handoff boundaries, not implementation done by P1. P4–P7 and Robot Path stay in their own study packets.

Future rule tests should enumerate both one-command and all four two-command programs, every mismatch and all legal single-slot replacements; prove trace order, termination/neutral reset, complete-only finish, edit invalidation, correct Check, bounded Undo and idempotent assistance identities. Test that each repair reduces mismatch count, wrong Checks alone count misses, duplicate clue display is free, help survives Undo/restart, and helped completion still awards once. Reject malformed arrays/tokens without running. Test busy/empty controls, partial Step/Play, pause/resize/destruction and no late completion. Seed variants deterministically; prove both requested traces attainable. Geometry tests cover100-unit targets after scaling and shell/land capacity; registry/how-to/voice/demo checks apply only if registration is approved.

Future build tiers remain those in the study/AGENTS: P2 new game (typecheck, units, filtered first/top play with inert/help cases, portrait; build for shared integration); P3 new interaction (wrong Check, earliest mismatch clue, repairs, Undo and supported finish; top-level ghost finger). Navigation/assets/persistence integration adds only its applicable checks. Hardware/child evidence cannot come from Chrome. P1 itself runs only relative Markdown links/anchors and `git diff --check`; no local typecheck, unit, build, browser or device run.
