# Example Express 1–3 (D1)

Defined 2026-10-24 from the [data and AI literacy study](../deep-dives/subjects/data-ai-literacy.md#first-games-proposed-ladder-example-express), [recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#data-and-ai-literacy-recommendations) and [October 23 decisions](../archive/DECISIONS-2026-10-23.md#decisions). Worker `01a171a1-fcdd-70b0-aeff-8baa24cddb58`, branch `codex/example-express-d1`, [PR #955](https://github.com/rjdunlap/neo/pull/955). **Definition only.** D2 builds levels 1–2; D3 adds level 3 in a separate session.

Fun action: teach a toy parcel depot with pictured examples, pull Send to see its route, then change the examples to repair a surprising delivery. Learning purpose: distinguish the requested delivery policy, supplied labels, the rule fitted from those labels and its behavior on other parcels. Constructing sensors/gates belongs to Sorting Machine; guessing an unchanged hidden rule belongs to Critter Sort. This game earns its identity through changing training data and observing a refit.

Proposed stable ID `example-express`, science subject `tinker-lab`; school 1–2 for D2, extended to 1–3 by D3, default 1. The upper-school audience uses school; no new band, pre-K window or grownup registration here. No saved project, new save fields, external AI service, camera, microphone or real-person labels. Sorter Inspector, all-six-rule inspector, missing sensors, contradictions, social classifications, Sample Safari, Paper Sorter and later levels stay outside D1. The existing shell owns adaptation, history, one sticker per completed round, guide and celebration.

## Parcel universe, policy and actual fitting

Dock A is the pictured **Tree dock**, dock B the pictured **House dock**; letters are adult notation only. Different silhouettes, repeated spoken labels and parcel-shape glyphs on the request avoid color-only or reading-dependent navigation. First request: “Circles to the tree. Squares to the house.” Features are authored data, never image recognition. Every parcel has one color, one shape and one large stamp, all visually distinct.

| ID | Color | Shape | Stamp | Requested dock |
| --- | --- | --- | --- | --- |
| 0 | blue | circle | leaf | A |
| 1 | blue | circle | star | A |
| 2 | blue | square | leaf | B |
| 3 | blue | square | star | B |
| 4 | yellow | circle | leaf | A |
| 5 | yellow | circle | star | A |
| 6 | yellow | square | leaf | B |
| 7 | yellow | square | star | B |

Exactly six rules, in permanent tie order:

1. Blue → A, yellow → B.
2. Yellow → A, blue → B.
3. Circle → A, square → B.
4. Square → A, circle → B.
5. Leaf → A, star → B.
6. Star → A, leaf → B.

For nonempty labelled training set T, count each rule's disagreements with the supplied dock labels; select the rule with the smallest count, then earliest index above. Every occupied example has weight one. Slot position, insertion order, requested policy and test results never influence this fit. Recompute after every add/remove/relabel/reset/Undo. Never replace a fitted rule with the requested rule, even in help. Empty T yields “Needs examples,” no route and no default classifier. A selected but not yet labelled parcel contributes nothing until a dock is chosen; it reserves one slot, so pending labels cannot bypass the four-card capacity. Cancel a pending insertion to release its slot. Help resolves or removes any pending card through the same legal action graph. There are four bounded slots and no duplicate parcel IDs within T; the shelf remains available for removing/reusing a card. Conflicting duplicates are reserved for a later case.

Only the selected rule is shown, as two large feature-to-dock pictures with replayable speech. Highlight which visible examples disagree with it without calling their author wrong. No confidence percentage, thinking/feeling claim or all-six inspector. A source-checked adult explanation may describe the fixed tie rule; the child need not inspect six alternatives. Never silently change tie order. D2/D3 use the exact seeds below; seeded RNG may vary harmless scenery only. Later feature/policy permutations need recomputed labels, evaluations and accepted sets.

## Complete seeds and all accepted sets

A state below is a set of (parcel ID, supplied dock) pairs; physical slot permutations are equivalent. Acceptance always evaluates the fitted rule, never membership in a preferred recipe. Every successful Check visibly sends its evaluation parcels, then offers **All delivered**; that button alone calls `ctx.finish({ misses, hints })` once. Any subsequent training edit invalidates success. Tests, help, animations and a repeated Check never independently award.

| Level | Initial state and available action | Evaluation / acceptance |
| --- | --- | --- |
| **1 Show, then send** | Locked examples 0→A, 2→B, visibly contrastive with color/stamp held fixed. Slots 3–4 contain fixed parcels 5 and 7 awaiting labels. Tap either card then a dock; relabel freely. No alternate shelf or removal of these four cards in this introductory round. | After both labels are supplied, Check sends fresh parcels 1 and 3 (A, B). Of the four possible complete label pairs, only (5→A, 7→B) passes: fitter rule 3. The other pairs select rule 2, 1, 1 respectively for (A,A), (B,A), (B,B), so at least one evaluation fails. Missing labels keep Check available with the incomplete-submission response below. |
| **2 A surprising parcel** | Locked examples 0→A, 7→B. Fitter chooses rule 1 over tied shape/stamp. Opening free Test sends 4: actual B, required A. Offer repair shelf in order [4→A, 3→B, 5→A, 2→B], each prelabelled by the request. Two open slots, at most two additions, removable/replaceable; no relabel of supplied cards. | Check uses practice tray [4,3,1,6], required [A,B,A,B]. Empty addition set fails. **Every singleton and every two-card subset of the four offered cards passes: 4 + 6 = 10 accepted repairs**, including either order/slot. Any addition makes shape fit with zero errors and disqualifies both color rules; stamp may still tie, and shape wins. Do not demand both counterexample cards or one particular repair. |
| **3 Choose the lesson** | Four empty editable slots, shelf IDs 0–7; select any unused parcel, choose either dock, remove/relabel/replace freely. No locked cards; at most four labelled examples. Request unchanged. | Visible practice tray [0,3,5,6], required [A,B,A,B]. Accept **all** T with 1 ≤ size(T) ≤ 4 whose fitter selects rule 3; this is exactly equivalent to passing the tray because each other rule disagrees on it. This includes some imperfect labels. Never reject a passing set because it differs from the request-labelled recipe. |

Level 3's complete accepted family can be enumerated without listing slot permutations: choose a subset of 0–7 of size at most four, choose A/B for each, fit by the six-rule rule above, retain exactly those selecting rule 3. Accepted counts by size 1/2/3/4 are **0/16/48/148 (212 total)**. Restricting to labels that all match the request gives 0/16/48/68 (132 total); those 132 are useful help destinations, not the full acceptance rule. Example shortest clean lesson: {0→A, 2→B}. A noisy passing set remains valid: explain that the sorter uses shape and point out any inconsistent example without adding a miss or demanding correction. The goal is the requested route, not maximum training accuracy.

All trays remain inspectable and can be replayed one parcel at a time. Level 1's two cases are fresh relative to its fixed training cards. Level 2's failure and evaluation are practice, and shelf cards may become training. Level 3's tray is visible from the start and may overlap training: call it **practice**, never hidden/fresh validation. In this eight-parcel toy, selecting rule 3 also satisfies every parcel; an optional “All eight checked” claim requires actually checking all eight in logic/playback. No held-out reliability, general AI ability or real-world fairness claim follows from this small universe.

## Tests, Check and accounting

**Test one / Send** runs the selected parcel through the current fitted rule and shows both actual and requested docks. Exploring a test, making a prediction (if offered), labelling, removing, replacing, Undo and observing a machine error are free: zero misses/hints. The initial level-2 surprise is free and must be shown before the repair shelf opens; cancellation leaves the introduction replayable. Repeating a test never trains the fitter, changes labels or unlocks a different success route.

**Check delivery** is a separate deliberate submission, with a different pictured button and replayable label. Snapshot the training state and evaluate once per completed Check. While busy, ignore duplicate presses; Stop/Home/cancellation abandons the Check without a verdict or count. On completion, one failed Check adds exactly **one miss**, regardless of how many parcels fail. Repeated completed failed Checks each count again. Empty/incomplete submissions also count one miss and say which example needs a label (level 1) or “Give the sorter an example” (levels 2–3); no fabricated route. No counters run per frame or per failed parcel.

For a failed fitted Check, point to the first failing parcel in tray order, show its actual route and the requested route, with gentle boing and speech. After two failed Checks in the round, glow a solver-backed useful card/slot or dock. The glow is support but adds **no automatic hint** under this study's accounting; misses already record the submission difficulty. It follows the current useful action after edits; do not glow a stale target. Tests and the automatic introductory demonstration never count as a miss or requested hint.

**Show me** adds one hint only when it performs one useful training change. Compute a shortest legal path from the current state to an accepted state using the same fitter and acceptance predicate, prefer request-consistent destinations when shortest paths tie, then break ties by slot index, operation (remove, relabel A, relabel B, insert), parcel ID and dock A before B. Locked examples/level-1 fixed parcel identities remain locked. Insertion includes the demonstrated dock choice as one help transaction; show both taps. A path's remaining length must decrease after each help transaction, so repeated help always reaches a passing state within finite capacity, even from a full wrong set. Do not charge again for replaying the same demonstration or tapping while it runs. At an already passing state Help says “Check the deliveries,” without a hint. It never presses Check or All delivered for her.

The automatic glow uses the same next solver action without mutating T; Undo restores example state, never counters or the introductory-surprise flag. Reset restores the current level's seed, invalidates success and preserves round counters; it never gives another free failed Check. Undo/reset/relabel remain available after a verdict. Failed routes leave parcels available for replay. No lives, score, deadline, hidden examples requirement or refusal of supported completion. The shell's two-smooth/two-struggling adaptation uses these counters; assisted or easy completion establishes no independent mastery.

## Speech, how-to and visible demonstration

All future lines live in `src/content/voice-script.ts`: request/title, both docks/features, selected rule, Needs examples, free Test actual/requested route, incomplete Check, failed Check, current solver action and success. `ctx.instruct` repeats the current level's request/action through `ctx.companion()`; other speech uses `ctx.say`. Speech says “The sorter used color” or “The sorter used shape,” not that it understands, feels bad or needs care. It must speak the **fitted** rule and current trace, never a desired answer that the model did not produce.

| Level | Proposed spoken instruction / level-scoped how-to | Ghost-finger obligation |
| --- | --- | --- |
| 1 | “Circles to the tree. Squares to the house. Give these two examples their docks, then check.” Card: tap parcel, tap pictured dock; Check; All delivered. | Visibly label 5→A then 7→B using real targets; Check shows fresh 1/3; All delivered finishes once. |
| 2 | “Watch this yellow circle. The sorter used color. Choose an example to help it use shape.” Card: watch free surprise; choose a labelled shelf card and open slot; Send; Check. | Show 4 taking the wrong route for free, add one accepted repair (4→A) through shelf/slot input, replay it taking A, then Check/finish. Do not silently install rule 3. |
| 3 | “Choose examples for circles to the tree and squares to the house. Test your lesson, then check.” Card: choose parcel/dock/slot, remove or relabel, test practice, Check. | Build {0→A,2→B} through the same selection/label/slot controls, Test 5 then Check/finish. Demonstrate data choice, not a revealed solution with no input. |

Pet replay, dock/rule replay and Show me must remain distinguishable. No navigation depends on reading A/B, IDs or a table. Spoken examples are drafts pending the building session's source and device checks. Optional co-play: one person curates, one chooses a test, then swap; solo companion supplies narration. No new multiplayer system or off-screen card ships in D1.

## Input, layout and capacity requirements

Tap-select/tap-slot and tap-select/tap-dock must complete every action. Dragging an example is an optional equivalent using `src/engine/drag.ts`; touch-down depresses the card/slot immediately. Use `onTap`, palm rejection, cancellation handling and scene-owned timing. Sending a parcel blocks training edits until Stop or arrival; Stop restores the editable state and preserves only completed verdicts. Resizing or leaving cancels moving demonstrations safely, preserves training/counters within the round and never invents a verdict. Destroy releases listeners, drags, tweens and owned textures.

Lay out from `view` and the guaranteed safe rectangle in `resize()`. Landscape plan within 1024×768 logical: top request/selected rule (y100–220), four 112-unit example slots (y250–362), shelf and selected-card controls (y400–512), bottom action row to the right of the pet (y580–692). Use a separate expanded **Examples** panel when the eight-card shelf is open: 4×2 cards at least 112 units, with full-size Previous/Back/label/slot controls on staged pages as needed. Never overlay live shelf targets on slots beneath it. Inspect/test tray similarly shows one large parcel at a time with 100-unit previous/next controls and four noninteractive progress marks; opening it does not erase examples. Selected-rule display is noninteractive except for a separate 100-unit replay target.

Portrait iPad's 768×1024 CSS viewport yields a taller logical view under `computeView`; use that additional height for shelf/tray staging rather than assuming 768 logical width or scaling a landscape screenshot. At minimum verify 1024×768, 768×1024 and safe-inset variants: every active card, dock, slot, Test, Check, Help, Undo, Reset, Stop, Back and finish target ≥100 logical units **after local scaling**, no hit overlap, readable request/rule, corner shell buttons and bottom-left companion clear. The coordinates above reserve regions, not proof of fit. Prototype must revise/stage panels if the actual content does not fit; never shrink targets or add a dense six-rule table.

Tinker Lab is only the candidate destination. At this definition's base, `src/content/lands.ts` lists **16** games there, including Welcome Ways; a previous 15-game count is stale. D2 must run the actual added-entry `landLayout`/page capacity checks at every band, younger/older side, orientation and safe view, audit classic land entry/age-home path and creature-world Places mapping, then choose an existing destination if capacity fails. No proposed Skywatch Isles destination, new land or silent reassignment. Placement must be established before registration/merge; D1 establishes none.

Assets remain Pixi palette drawings and synthesized pentatonic sounds. No imported/recorded audio or generated art is required by this packet. Navigation, result/reward and persistence use existing contracts; no special fitter save or training analytics.

## Review and downstream proof gates

D1 records a finite design, not evidence that children understand it. Before either build merges, the building session source-checks its actual spoken/how-to/model explanations against the study's opened CSTA 2026 E2–E5-ALG-ML-02 / MS-ALG-ML-06/07/08 and AI4K12 Big Idea 3 draft 3-A/3-C, cites the reviewed sources here and records results in VERIFICATION under October23 S1. Retain the distinction between authored classification, training accuracy, practice coverage and claims outside the toy; do not import source standards as age guarantees. No outside/developer reviewer is required by S1. Pre-K still needs a person check after a prototype; older registrations and other unresolved developer/device decisions remain in their existing records.

D2 implements only levels 1–2: typecheck, unit properties, one filtered first/top scripted play including a failed Check and Show me, portrait review and ghost-finger demonstrations at both levels. Build for registration/shared content; navigation/offline checks only for affected contracts. D3 separately implements level 3 on the same interaction: typecheck, game rule tests, top-level play and fingerdemo, plus any actual changed-contract tier. Neither build is authorized as part of this definition session.

Required rule proof: exact feature table and all six predicates; minimum-error/tie/empty behavior; slot-order invariance; every L1 label combination; all 11 L2 legal addition sets (one failing, ten passing); all 1–4-card labelled L3 sets, accepted counts and slot permutations; true counterexample actual/required routes; locked/unique/capacity restrictions; noisy accepted examples; hint paths terminate from every legal state without changing fit; free Test versus completed Check counting, cancelled/repeated Check, two-miss glow, help/Undo/reset and once-only finish. Unit tests should assert properties independent of a duplicated implementation. Browser proof must establish visible input, explanation traces, recovery/cancellation, layout and reward behavior; a solver alone proves no touch comfort or enjoyment.

D1 sanity enumeration (ignored local probe, not shipped game code) reproduced L1's four complete label states, L2's subset fits and L3's 212 accepted sets. The build must independently implement and test these properties. Docs verification: links and diff only; no local typecheck, gameplay, assets, device speech, child/coplayer observations or learning outcome established.
