# Village Vote levels 1–6 (CC1 / CC4 / CC5)

**Built:** levels 1–6 (levels 1–3 PR #983; level 4 PR #2012; level 5 PR #2018; level 6 PR #2022). See the [game page](../games/village-vote.md).

Defined 2026-10-25 from the [community-civics study](../deep-dives/subjects/community-civics.md#first-games-proposed-ladder-village-vote), [recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#community-and-civics-recommendations) and [adopted October23 decisions](../archive/DECISIONS-2026-10-23.md#decisions). Worker `01a1732f-dac2-7d23-a542-8d7f0c2f45b0`, branch `codex/village-vote-cc1-definition`, claim `4796460e`, [PR #969](https://github.com/rjdunlap/neo/pull/969), base `da20f87c` plus docs diff. **CC1 defined the packet; CC4 built levels1–3 on2026-10-26 ([PR #983](https://github.com/rjdunlap/neo/pull/983)).** The implemented contract follows; current proof and remaining person/device gates are recorded below.

Fun action: tap raised paws, hear the count and choose the picture whose group has most votes; that toy is built and everyone plays. Learning purpose: count one vote per friend, compare visible groups and carry out a group preference even when the pet preferred something else. No vote about facts, moral claims, access or a friend's worth. No mayor/approval rating, persuasion exercise or claim of transfer to real group behavior. Existing quantity games own arithmetic practice; the group decision and shared result justify this identity.

## Scope, bands and complete rounds

Stable ID `village-vote`, spoken/grown-up title “Village Vote”, subject `cozy-village` (everyday skills), land `cozy-village` (Cozy Village): subject and destination remain separate catalog concepts. CC4 ranges: preschool 1–2, prek 1–3, school 3–3, default each minimum, order `min..max`. No lap/toddler/grownup registration or new band. School 3–6 is the ladder; levels 4–6 are [defined below](#levels-46-definition-cc5) and each stays unregistered until its batch is built. Stable IDs never renumber later.

| Level / grown-up description | Canonical opening example and action | Whole-round finish |
| --- | --- | --- |
| 1 Two choices — count two groups and select the larger | Four friends choose slide/swing, 3–1. Tap each raised paw to count aloud or tap the winning picture immediately. | One accepted winner; build it and show all four using it, then shell finish |
| 2 Your pet votes too — choose for the pet, then count everyone's votes | Four other friends choose slide/swing, 3–1. First tap either picture to cast the pet's one vote; it joins that group. Count all five and choose the larger group. | One accepted winner; all five use it. The pet goes first even if its preference lost |
| 3 Three choices — compare three tallies and select the largest | Seven friends choose slide/swing/sandpit, 4–2–1. Tap paws to make tally marks and hear counts; compare all three. | One accepted winner; all seven use it, then shell finish |

One election per round, not a sequence of correct taps. Any correct declaration completes even if no paws were tapped; counting is support/exploration, not a gate or accuracy score. No per-paw sticker, timed round, failure screen, penalty for a losing preference or fastest/fewest-taps reward. `ctx.finish({ misses, hints })` exactly once after shared play; the shell owns the single sticker, history and adaptation even with help. Leave freely at any phase. Everything built here is round-local: no square save, Keep, unlock, currency, project, new save field or creature arrival. Shared play uses an automatic brief loop and finishes without a reading/tiny button requirement; reduced motion still shows the winning thing and every participant beside/using it.

## Seeded votes and bounded generator

`logic.ts` owns plans, vote assignments, phase transitions, count state, acceptance and support targets. Use `ctx.rng` only, with separate semantic and cosmetic draws so layout does not rewrite votes. Every real round, including a first launch, chooses uniformly from these finite families then uniformly permutes option labels/positions and friend-to-option assignments. The opening examples above are fixed fixtures for the how-to and initial scripted play, not a persistent first-visit curriculum or hidden save flag. Stable friend IDs, option IDs and the pet ID determine votes, never x coordinates, color alone or tapping order. Same seed, level and pet choice produce the same final election.

| Level | Allowed count families before cosmetic permutation | Constraints |
| --- | --- | --- |
| 1 | (3,1), (4,2) | 4 or6 NPC friends, both groups nonempty, one unique larger group |
| 2 | (3,1), (4,0) **NPC counts before the pet votes** | Exactly4 NPCs plus1 pet. Either pet choice adds exactly1 to that group. Final counts (4,1)/(3,2) or (5,0)/(4,1), up to permutation: unique winner for every choice |
| 3 | (4,2,1), (3,2,2) | Exactly7 NPCs, all groups nonempty, unique maximum. Tied losing groups are fine; tied top groups never generated |

Option pool is slide, swing, sandpit; levels1/2 choose any two distinct pictures, level3 all three. These are fictional village toys all participants can use; accessibility/fix cases belong to level5. Each has a distinct silhouette and spoken name, not only a colored rectangle. Zero in level2's (4,0) is an intentionally empty pictured group; show an empty tally/zero and say “No votes here” when counted, never invent a friend. The canonical demo fixtures use slide then swing (sandpit third at3); real seeded rounds allow any visual slot to win. Level2 never adjusts NPC votes after seeing the pet pick and never secretly guarantees its win. The (3,1) family allows the pet to join either the winning or losing side; the (4,0) family does too. No pivotal tie/coin toss/run-off in CC1. Reject malformed/tied-top plans as programming errors before presentation; do not turn a bad seed into a child miss or silently pick the left picture.

Count families encode counts, then a seeded permutation assigns each of N unique NPC IDs exactly one option. Sum of NPC counts must match roster length. In level2 cast pet vote atomically once, freeze it for the election and change to counting phase. It remains visibly distinct from the guide: show the customized `ctx.companion()` in the crowd, and retain a clear repeat-instruction guide/control. No second active copy that looks like another voter. Other creatures' preferences remain fixed. Repeated/double taps during pet walking cannot add another vote or declare a winner; counting/declaring starts when it arrives. The phase cue and speech change from “Choose for your pet” to “Which picture has more votes?” so one tap is never both preference and answer. A different preference is available next round; no vote-change or Undo mechanic in these levels.

## Accepted taps, count model and declaration

Only `onTap` controls; all touch-downs give immediate lift/bounce. Count targets are whole friend/paw panels, not tiny paws. Each option has an ordered list of stable voters and a set of counted IDs. Tapping a new voter counts it once, adds one mark in that option's board and speaks its new counted total. Choosing friends out of visual order is valid. Re-tapping a counted voter replays that option's current total/marks, never increments it or counts a miss. Tally display is explicitly partial until all that group's paws have marks; distinguish counted/un-counted friends without color alone. Numeral always equals the number of counted marks. Full comparison after a declaration uses the immutable **actual votes**, not partial marks. Recount reveals/counts any remaining voters in the compared groups and leaves their totals visible. No mismatch between marks, voice and vote roster.

During counting, tapping an option picture is an intentional winner declaration. Accept iff its actual vote total equals the unique maximum across all options, regardless of partial count or the pet's preference. Ignore inactive/stale events, pointercancel/outside releases and decorative touches without misses. A tap on a number/tally area replays that group's count, never declares by accident; keep it separate from option choice hit areas. Empty-group board replay at2 says zero. Counting paws, replay, free pet voting and waiting never count as wrong.

Incorrect declaration: exactly one miss per completed deliberate tap, gentle boing, “Let's count again” plus truthful comparison of chosen and winning groups. At3 the top must exceed **each** alternative; do not compare only to the smallest. Leave votes unchanged and keep retry available. Repeated events for one tap cannot double count; lock declarations while feedback/recount is running and restore input using scene-owned scheduling. A second intentional wrong declaration after feedback may count again. Count replay requests can be coalesced so simultaneous speech cannot scramble totals; cancellation never loses logical votes.

## Help, supported finish and adaptation

Track round misses and one help flag. A manual Hint or automatic glow after two wrong declarations marks assistance **before** revealing the winning option. This round has one decision, so `hints` is0 independently or1 if any help was given; repeated glow/hints never inflate it to2. This is intentional: repeated support for this one task is not two distinct assisted tasks. Four misses can still satisfy the shell's struggle rule; a helped correct round can never count as smooth. Ordinary paw taps, instruction replay and count comparison feedback alone do not mark help unless they explicitly point out the answer. Therefore rejected-answer speech may recount groups but cannot say/highlight which picture to choose before help is recorded.

First Hint counts all groups, speaks the comparison and glows the correct picture. A further Hint offers the ghost-finger demonstration of the winning tap through normal input; assistance remains1. Automatic glow also records1 and is noninteractive so it cannot swallow taps. No hints needed for the free preference: if Hint there demonstrates an arbitrary pet choice, record help before acting and then guide the actual winner normally. Never call finish directly or force a preferred side to win. All children can retry or request supported completion without lost stickers. Record help across phase changes and animation/recount; no reset before finish. The shell's two smooth/two struggling rounds and played-band clamps remain unchanged.

## Voice, how-to and bot contract

CC4 adds all actual lines to `src/content/voice-script.ts`, under `village-vote.*`, with `ctx.instruct` for the phase's repeatable instruction and `ctx.say` for counts/feedback. Proposed lines below need the building session's source/wording review; no external reviewer or actual device acceptance is claimed by this packet.

| Phase | Proposed wording |
| --- | --- |
| Level1 | “Tap the paws to count. Which picture has more votes?” |
| Level2 preference | “What would your pet like? Choose a picture.” |
| Level2 counting | “Your pet voted too. Count the paws. Which picture has more votes?” |
| Level3 | “Count the paws at each picture. Which picture has the most votes?” |
| Count/replay | “One… two… three.” / “Three votes for the slide.” / “No votes here.” Use actual counted total, name and zero case |
| Wrong declaration | “Let's count again.” Then, for example, “Four votes for the slide. Two votes for the swing.” No false comparison with partial totals |
| Hint | “Four is more than two, and more than one. Choose the slide.” Use current actual totals; comparison to both others at3 |
| Result | “More friends wanted the swing. Let's all try it!” Level3 (3,2,2): “The slide has the most votes. Let's all try it!” |

Never say “everyone chose it,” “more than half” at3, that a preference is wrong, or that the biggest group is always right. At (3,2,2) the unique top is a plurality, not a majority; use “most” on card/voice. Happy pet and all friends use the winning toy without booing, disappointment duty, loss label or persuasion. A known tune is unnecessary; use synthesized pentatonic sound and existing music conventions.

One level-scoped how-to card: 1 tap paws/replay and choose larger; 2 free pet preference **then** declare, with pet possibly on smaller side; 3 three groups/partial tallies and most. Replayable spoken title/instructions, ordinary Play and real ghost-finger demonstration. Grown-up description names the action, without developmental/behavior claims. Co-play: grown-up counts aloud while child taps, then swap roles; nobody must supply a correct answer. A simple off-screen suggestion may mention counting toy friends' preferences with a grown-up; no practical family meeting card is authored/delivered by CC1.

`autotouch()` reads current phase, actual voter IDs/counts and transformed targets. At2 it first taps a picture, waits for the pet, then counts; demonstrate a losing-pet case in proof. Tap each uncounted friend once, replay one count, then tap any valid winner. No direct state mutation, finish call or predetermined leftmost answer. At3 count every group including tied losing totals. Respect voice/input readiness and use scene-owned bot timing. Demonstrate each distinct entry layout at1/2/3, deterministic seeds covering both pet choices, a smaller-side result and the (3,2,2) case. Destroy/resize/leave cancels pending bot/recount/build callbacks and releases listeners/tracked art/textures; guide replay cannot resolve into destroyed objects.

## Full-size layouts and current placement gate

CC4 lays out from safe-area `view` in `resize()`; no shrinking a crowd to fit. Every friend count control, option declaration, replay board and hint/repeat control needs at least100 logical units **after all parent transforms**. Proposed 120-square friend panels contain a large raised-paw drawing but the whole panel responds. Decorative paws/marks/glows/play animations are noninteractive. Count panels never overlap option declarations/replay boards or each other. All7 voters at3 remain visible together; no paging of votes or hiding a smaller group while comparing.

Proposed envelopes (x,y,w,h), not measured layout proof: at1024×768 landscape use three columns starting x=240,480,720, width200. Option pictures (column x,160,160,110), replay/tallies (column x,280,160,110), and up to four count panels per column in a 2×2 grid at x and x+110, y=420/540, each100 square. The biggest group is4; level1/2 center the two columns in the same safe space. Maximum content right edge930, bottom640; reserve y<150 for shell and x<210,y>560 for guide. Use symbols/marks/numeral that fit a160×110 board even at five votes, without shrinking the board's control. At2 the pet can make five in a group: use a **third** row at y=650, bottom750, in the right/center crowd area, keeping x>210 and checking actual bottom shell controls. Other groups need no empty fake friend controls.

At1024×1365 portrait use column starts x=240,480,720; options y=200, boards y=330; count grids at y=520/680/840, x and x+110,100-square panels. Keep x<210,y>1160 for guide, top150 for shell. Fill rows consistently per group; whitespace is intentional. Both orientations show each friend next to/below its chosen picture with clear column separation; no need to infer by color. These rectangular plans leave narrow gaps and are only candidate envelopes: CC4 must measure actual art, speech labels, safe insets, shell buttons and pet/guide at runtime, including level2 five-voter column and both orientations. Adjust positions/spacing within `view`, never targets below100. Review actual screenshot/hit geometry and nonblocking overlays before accepting these plans.

**Capacity at base `da20f87c`: Cozy Village has13 games**, not the research's historical12: splish-splash, feelings-faces, weather-wardrobe, scoop-shop, mail-carrier, teddy-doctor, market-stall, clock-tower, day-by-day, stop-and-go, pet-says, lemonade-stand, second-chance-shed. Village Vote alone would make14; Swap Meet ME2 is separately queued and could make15 if it lands first. Recount current main before CC4. `LAND_SPOTS=13` counts host/sign/arrows too; use current `visibleIn`, `olderIn` and `landPages` for every band/side. Fourteen games on one side split7/7 with room for host/arrows/sign, not fourteen smaller targets on one page. This arithmetic is not a fit test. Run registry/lands tests and actual view sweep using current Cozy Village scenery horizon, full-size game spots, host, guide, signpost and page arrows, including older-side routing and pages after another queued game lands.

Decision1 allows Cozy Village only after those checks. Maker Harbor/Storybook Square are proposed fallbacks; this packet creates neither and cannot silently register in them. If placement fails, checkpoint or separately define a real placement solution. Review root Explore/Places and classic launch/return at the actual page and `playBand`, icon/title/path, both orientations and safe insets; retain age places and navigation without reading. No registration/count increment until built.

## CC4 admission and required proof

Separate CC4 batch: Two choices, Your pet votes too, Three choices, one worker/branch/PR. Read current contracts/reuse/input pitfalls and existing overlap; building-session primary-source check of any child/card civics claim and wording remains required under October23's source-check rule. Existing study evidence is not a new curriculum/source review. CC1 manual semantic/current-source review is not independent game/rules review or a play test; this assigned worker uses no subagents.

CC4 meaningful rule tests must independently establish every finite family's totals/unique winner, exact roster, deterministic seed/permutation, both free choices at2 (one extra pet vote only; no ties), both winning/losing pet sides across seeds, correct zero/partial/replay marks, immutable votes, truth of each comparison, all valid declarations, wrong/repeated/stale input accounting, help capped at1 with assisted finish, and exactly one completion. Include incorrect fixtures that violate uniqueness/conservation or use partial tallies to choose a winner. Bot tests follow public taps through all levels and families. Never claim a tests pass from this document's enumerated tables.

Build tier: typecheck, unit tests, one filtered scripted play covering first/top level, wrong declaration and help, plus level2 free/lost preference and count/replay/phase boundaries, all three demos and one portrait screenshot at the densest case. Build because shared registration/lands/voice/card files change; add filtered browser case and README suite entry. Use only relevant world/offline checks if actual shared navigation/assets/persistence behavior changes; do not run a blanket release suite. Record tested commit/diff, exact filters/server URL; stop session servers. README inventory/GAMES/how-to updated by CC4; see current proof below.

Person/device gates stay open: iPad speech/count ordering, comfortable reach/legibility and cancellation in both orientations, whether a preschool child distinguishes choosing for the pet from counting a winner, whether a child accepts a losing preference and understands the shared result, enjoyment/replay and any real-world transfer. No Chrome automation establishes these. CC5 (ties/run-off, excluded friends/fixes, chipping in) is [defined below](#levels-46-definition-cc5) since the 2026-11-17 decisions lifted the play wait; Count the Ballots, history/culture, safety, practical cards and persistent square rules remain separate and gated.

## CC4 worker checkpoint (2026-10-25)

Worker `01a176ea-3190-7f83-80a3-e41d2259e4de`, branch `codex/village-vote-cc4`, base `4edc3828`. Whole levels1–3 batch only, with the files and exclusions listed in the batch plan; [PR #983](https://github.com/rjdunlap/neo/pull/983). This initial claim was docs-only; implementation/proof completed2026-10-26. Fresh ordinary account allowance and both window reset identities checked privately; coordinator exempt, no overlapping active implementation found; external Scoop #977 and dirty7918 preserved.

Building-session source review: opened [NCSS early-childhood position statement](https://www.socialstudies.org/position-statements/early-childhood-social-studies-context) and reviewed the accessible primary [C3 table11](https://www.socialstudies.org/sites/default/files/c3/c3-framework-for-social-studies-rev0617.pdf) extract. These support group decision experiences, not efficacy or transfer claims. The older C3 URL and Kim dissertation returned403; no new claim relies on that unread dissertation. Wording stays at counting fictional toy preferences, with “most” for3–2–2; no “everyone chose”, majority-of-all, moral correctness or behavior benefit claim. Manual source/wording/contract review only, no independent review or device/child acceptance. Read integration contracts, reuse map and input/rendering pitfalls. `onTap` answers on pointerdown: immediate feedback may use it, but preference/declaration commits require release/cancel handling to meet this packet. Pre-code current village layout/root+classic gate passed, as recorded below.

## CC4 implementation and review (2026-10-26)

Built two groups, free pet preference, and three tallies through one shared-play finish. Current source `53490baf` (claim plus coordinator-only integration) with final working diff; [verification](../archive/VERIFICATION-2026-10-26.md#2026-10-26--village-vote-13-cc4). Code uses the packet families, randomized winning slots and immutable round roster, partial marks/replay, inside-release declarations, one help flag and exactly-once shell finish. Code-drawn art reuses palette/critter/companion; no new imported assets, saves, navigation contract, Keep or unlock. The historical envelopes above are superseded by `logic.ts`'s measured110-square layout: three columns325/575/825, full boards/pictures and Hint at90/280; all seven voters visible, five-voter column reaches three rows.

Pre-code isolated prospective catalog audit recounted14 existing Cozy Village games,15 with this entry. All48 band/side/page/view cases (landscape, portrait, landscape phone) fitted at the current0.4 horizon, with scenery clear; existing lands/village tests also sweep four views, all counts/arrows and resident clearance. Prospective classic/root launch-return checks used a temporary test entry; final play checked the actual registration/icon/page/playBand and both return origins, including the younger signpost. No fallback land or smaller targets.

Manual implementation review (no subagents, per assignment) found and fixed winner always in the first slot, lower-left crowd intrusion and Hint's corner overlap with shell help. Final edge probe briefly restores old Hint y235 and fails hit-testing, then restores280 and passes every control center/corner. Native cancel/outside/secondary pointer, partial/repeated/zero counts, losing pet preference, both choices on both level2 families, capped support/ghost-assisted finish, resize and destroy continuations are covered. Final screenshots of five votes and seven voters in portrait inspected. All three clean real card demos passed7.6/10.6/11.6 demo seconds. No independent reviewer or actual child/device acceptance is claimed; CC5 is defined below.

## Levels 4–6 definition (CC5)

Defined 2026-11-22 from the study's [proposed ladder](../deep-dives/subjects/community-civics.md#first-games-proposed-ladder-village-vote), its *Decided 2026-10-23* leans (decisions 4 and 6) and the [decisions of 2026-11-17](../archive/DECISIONS-2026-11-17.md#games), which lifted the wait on play. Read against the current `src/games/village-vote/` (levels 1–3, phone-upright layout). Docs only; each level is its own build batch below, and no level is registered before its batch lands.

Fun action: the vote now has consequences she acts on: a tie sends friends to their next choice, the built toy turns out to leave some friends out until she picks a fix, and the toy is paid for by tapping shells from everyone's purses into one jar. Learning purpose: a run-off as an action (the fewest group's votes move on, then count again); that a choice most people wanted can still leave others out and can be changed so everyone can use it; and a shared cost paid in more than one way. Not taught: that a majority is right, that anyone deserves less, or any real election rule beyond the pictured run-off. No claim of transfer to real group behaviour.

### Bands and ladder

| Level | Grown-up description (`NAMES`) | Bands |
| --- | --- | --- |
| 4 *A tie* | A tie — move the fewest group's votes to their next choice, then choose most | school |
| 5 *Everyone can use it* | Everyone can use it — find who the built toy leaves out, then choose a fix | school |
| 6 *Chip in* | Chip in — fill the shared jar from the friends' purses | school |

School grows 3–3 → 3–4 → 3–5 → 3–6, one batch at a time; preschool 1–2 and pre-K 1–3 are unchanged; default stays each band's minimum and `order` stays `min..max`. Each batch extends `LEVELS.school.max`, adds its `NAMES` row and lifts `describeLevel`'s clamp (today `Math.min(2, l - 1)`) to the new top. Levels 5 and 6 are upper-school by content and live at school's top as the band rule requires. Stable IDs 4–6 are fixed here; nothing renumbers.

### Level 4, *A tie*

**Round.** Three pictures and a crowd whose top two groups tie, counted as at level 3 (paw taps, partial tallies, replay). Tapping either tied picture is not a miss: the voice says "It's a tie!" with both totals, the fewest group's picture dims ("closed this time"), and each friend in that group shows a small picture of its **second choice** (a 48-unit badge drawn inside its own panel, decorative). She taps one of those friends (it lifts), then the toy picture it shows; it walks there and adds a mark. When every friend of the closed group has moved, the phase returns to counting and she taps the picture with the most votes now; that toy is built and everyone, the moved friends included, plays on it.

**Seeded families** (counts before cosmetic permutation; the closed group's second choices are part of the family):

| Family | First choices | Closed group's second choices | Run-off |
| --- | --- | --- | --- |
| A (opening fixture) | 3–3–2 (8 friends) | both to one tied picture | 5–3 |
| B | 3–3–1 (7) | the one friend to either tied picture | 4–3 |
| C | 2–2–1 (5) | the one friend to either tied picture | 3–2 |

The generator never gives the two friends in family A different second choices: a 1–1 split would make 4–4, a second tie. Which tied picture gains is a seeded choice, so either slot can win. The opening fixture (`fixture(4, 0)`) is slide 3, swing 3, sandpit 2, both sandpit friends' second choice the swing, so the swing wins 5–3.

**Taps.**

- Tapping the fewest picture before the tie is found: a miss, "Let's count again" and the true three-way comparison (as level 3).
- After the tie: tapping a closed-group friend selects it (tapping another switches; tapping it again deselects). Tapping the toy its badge shows moves it. Tapping the other tied toy while a friend is selected: a miss; the friend shakes its head and the voice says "This friend's next choice is the swing." Tapping the closed picture: ignored with "The sandpit is closed this time"; no miss.
- Tapping a tied picture with no friend selected while closed-group friends remain: a nudge ("Move every friend from the sandpit first"), no miss.
- After every friend has moved: tapping the picture with most votes completes; the other tied picture is a miss with the true comparison ("Five is more than three").
- Paw taps and tally replays stay free throughout; moved friends count in their new group, and their marks move with them.

**Model changes the builder makes.** `validate()` rejects a tied top only for levels 1–3, and for level 4 requires a tie between exactly the top two, a strictly smaller third group, and second choices on every closed-group friend that point to a tied option and agree (family A). `Vote` gains an optional `next?: Option`. `Election` gains a `runoff` phase, a `closed: Option | null`, a `moved` set, a `select(id)`/`send(option)` pair, and `winner` reads the totals after moves (a moved voter counts for its `next`). The level-1–3 behaviour, fixtures and tests are unchanged.

### Level 5, *Everyone can use it*

**Round.** The vote is already counted: two pictures, tallies full, and the **tall slide** (a fourth option, `tall-slide`, used only here) has won. Hazel says "The tall slide won, five to three. Let's build it!" and it is built. Some friends stand at the bottom: its first step is drawn clearly higher than they can reach. "Who can't use it? Tap them." She taps each friend left at the bottom (it bounces, and the voice says "The first step is too high"). When all are found, two fix cards appear, *add a step* and *a lower slide*. Either is accepted: the fix is built, the voice names what each costs ("A step was quick to add. A lower slide meant building it again."), and all friends play.

**Seeded families.** Votes 5–3 (8 friends) or 4–2 (6); the tall slide is in either picture slot. Left out: one to three friends, all drawn as the smallest size and all from the group that wanted the other toy (the study's point, that a choice most wanted can leave the others out), but the round never says how anyone voted. Opening fixture: 5–3, the three who wanted the swing left out.

**Taps.** Tapping a friend who is already on the slide: a miss, "This friend is on the slide!" Tapping a found friend again: replays its line, free. The fix choice is free and never wrong. Tapping a fix card before every left-out friend is found cannot happen (the cards appear after).

**Wording rule.** The problem is the slide's step, never the friends: never "too small", "too little", "can't climb", "lost twice", "they didn't vote for it" or that anyone should have voted differently. The left-out friends are drawn content, waiting, not sad.

**Model.** `OPTIONS` gains `tall-slide` outside levels 1–4's pool (`roundFor` at 1–4 never draws it). A level-5 plan carries `leftOut: string[]` (voter IDs); `validate()` checks they are 1–3 IDs of the losing group. `Election` gains `found` and a `fix: 'step' | 'lower' | null`; the finish waits for the fix.

### Level 6, *Chip in*

**Round.** The vote is already counted and the winning toy is pictured on the board with its cost. "The swing costs twelve shells. Tap the purses to fill the jar." Six friends stand in two rows, each holding a purse with its shells shown. Each tap on a purse moves one shell into the jar (a clink, the jar's new total spoken, one of its marked slots filled). The jar takes exactly its cost and then stops: the toy is built, and the voice names how it was filled, "Everyone gave the same." when every purse gave the same number, or "Some friends gave more." otherwise. Nothing ever names who gave least, and nothing calls a plan fair or unfair (decision 4's lean). Shells left in purses stay with their friends.

**Seeded families.**

| Family | Cost | Purses (permuted) | Ways to fill the jar | An equal-shares way |
| --- | --- | --- | --- | --- |
| Equal (opening fixture) | 12 | 2, 2, 2, 2, 2, 2 | 1 (every purse gives 2) | yes, the only one |
| Uneven A | 10 | 1, 1, 2, 2, 3, 3 | 19 | none (a 1-shell purse caps equal shares at 6) |
| Uneven B | 12 | 1, 2, 2, 3, 3, 3 | 20 | none |

The first school round uses Equal. The second draws from the uneven families. Subsequent rounds draw from all three. The rule tests enumerate the contribution plans for each family.

**Taps.** An empty purse ignores taps with "That purse is empty"; no miss. Taps after the jar is full are ignored. There is no wrong tap at this level, so it records no misses.

**Model.** A level-6 plan carries `funding` with `cost` and `purses: number[]` beside the voters; `Election` gains `jar` and `given: number[]` and a `give(i)` that refuses an empty purse or a full jar. The vote shown is a fixed two-picture count (as level 5), any winner slot.

### Accounting, help and finishing

The 1–3 rule holds (wrong declarations count misses; counting, replays and free choices never do), with these rows. Help uses `src/progress/coach.ts`; the Hint button and the automatic glow after two misses work as at 1–3.

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 4 | tapping the fewest picture before the tie; sending a friend to the wrong tied toy; declaring the smaller group after the run-off | at most one per stage: the run-off stage (glow on the selected friend's toy, then the ghost) and the final declaration (glow on the winner); so 0–2 a round | the tied picture's "It's a tie!" tap, the closed picture, a declaration before every friend has moved, paws, replays |
| 5 | tapping a friend who is on the slide | at most one: the glow on the left-out friends, then the ghost | found friends tapped again, the fix choice |
| 6 | none | at most one: Hint glows a purse that still has shells, then the ghost finger taps it | empty purses, taps after the jar is full |

Two smooth rounds (at most one miss, no hints) step up and two struggling rounds (at least four misses or two hints) step down, clamped to the band. Level 4 is the only level where two hints in one round are possible, because it has two separate decisions; level 6 can never struggle, which is acceptable at the top of the ladder. A round finished with a glow or the ghost is one sticker and is not counted as independent mastery. `ctx.finish` is called exactly once, after everyone has played on the toy.

### Rule tests (`logic.test.ts`)

- **Level 4:** every family's first choices tie exactly the top two with a strictly smaller third; every closed-group friend has a second choice that is a tied option, and in family A they agree; moving all of them always gives a unique winner (no 4–4); the winner after moves equals an independent instant run-off over (first, second) ballots computed in the test; a bad fixture with a 1–1 split, a three-way tie or a second choice on the closed option is rejected; `send` refuses the wrong toy (one miss), the closed toy (no miss) and a send with nothing selected; a declaration before every friend has moved is a nudge, not a miss; hints never exceed one per stage.
- **Level 5:** the tall slide wins every seeded vote; `leftOut` is 1–3 IDs of the losing group; tapping an on-slide friend is one miss; both fix cards finish; levels 1–4's `roundFor` never draws `tall-slide`.
- **Level 6:** every family's purses total at least the cost; the equal family has exactly one way and it is equal shares; each uneven family has at least two ways (enumerated in the test) and no equal-shares way; `give` refuses empty purses and a full jar; the jar never exceeds its cost; the spoken summary is "same" exactly when every purse gave the same number.
- **All:** same seed gives the same round; `finish` once; existing 1–3 tests unchanged.

### Voice, how-to and ghost finger

Lines go in `voice.ts` (then `node scripts/content-barrels.mjs` and the clip generation), `ctx.instruct` for each phase's repeatable instruction:

| Line | Proposed wording |
| --- | --- |
| Level 4 tie | "It's a tie! Three votes and three votes." |
| Level 4 run-off | "The sandpit has fewest. Where would those friends go next? Tap a friend, then its picture." |
| Level 4 recount | "Count again. Which picture has the most votes now?" |
| Level 4 wrong send / closed / nudge | "This friend's next choice is the swing." / "The sandpit is closed this time." / "Move every friend from the sandpit first." |
| Level 5 | "The tall slide won, five to three. Let's build it!" / "Who can't use it? Tap them." / "The first step is too high." / "This friend is on the slide!" / "How could everyone use it? Add a step, or a lower slide." |
| Level 5 fix | "A step was quick to add. A lower slide meant building it again. Now everyone can play!" (and the mirror line for the lower slide) |
| Level 6 | "The swing costs twelve shells. Tap the purses to fill the jar." / the jar's total / "Still two to go." (on instruction replay) / "That purse is empty." / "The jar is full! Everyone gave the same." / "The jar is full! Some friends gave more." |

Never say "fair", "unfair", "greedy", "poor", who gave least, that the left-out friends are small or lost, or that a tie is bad. How-to card steps scoped `from: 4, to: 4` (tie, then move each closed-group friend to the toy on its badge, then choose most), `from: 5, to: 5` (find who cannot climb, then choose either fix) and `from: 6, to: 6` (tap purses until the jar is full; any way is fine). Each batch extends `autotouch()` through public taps only: at 4 it counts, taps a tied picture, moves each friend to its badge's toy and declares; at 5 it taps each left-out friend then a fix card; at 6 it taps purses round-robin until the jar is full. Co-play: at 4, a grown-up can be the latecomer whose second choice she asks; at 6, a grown-up names a purse and she taps it. Off-screen: the family meeting card stays its own slice (CC7).

### Upright phone layout (candidate envelopes)

The upright view (768 × 1024 design, `uprightDrop` below) is the first check: each batch extends `upright.test.ts` to its level, every family, and every phase (before the tie, mid run-off, after moves; the play scene with left-out friends and fix cards; the purses and jar), at 100 units with the existing `uprightProblems`.

- **Level 4:** the level-3 columns (x 144 / 384 / 624, voters at ±58, rows 600 / 725 / 850 + drop). Eight friends at 3–3–2 need two rows; after the run-off a five-vote column needs three rows, the same depth level 2's five-vote column already passes. The badge sits inside each friend's 110 panel, so it adds no target.
- **Level 5:** the play scene's friends (`playLayout`, rows of four at a 180 pitch) become tappable 110 targets; the fix cards (about 220 × 160 each) go in a row below the friends, about y 880 upright, clear of the Hint at (w − 90, h − 100). Landscape keeps the cards beside the toy.
- **Level 6:** six purses as 110 targets in a 3 × 2 grid on the three columns (y about 600 and 760 upright), the jar (about 200 wide, cost slots visible) at about y 400 under the pictured winner. Landscape uses the level-3 columns at y about 480 and 610 with the jar beside the board.

These are starting points; the builder measures art, speech labels, safe insets and the guide at runtime and moves things within `view`, never shrinking a target below 100.

### Build batches

1. **`village-vote 2` (level 4, *A tie*)**, built 2026-11-22.
2. **`village-vote 3` (level 5, *Everyone can use it*)**, built 2026-11-22.
3. **`village-vote 4` (level 6, *Chip in*)**, built 2026-11-22. The jar and purses use the shared cockle shell drawing from `src/art/shore.ts`. Whole purses use `onTap`.

### Check tier

- **Each batch, new interaction tier:** `npm run typecheck`; unit tests (the rule tests above plus the difficulty, how-to, registry, lands, clips and `upright.test.ts` walks that read every level); one filtered `BROWSER_SUITE=villagevote` play on an upright phone viewport at the new level, after the suite learns it (level 4: one wrong send and the glow; level 5: one tap on a friend on the slide, then a fix; level 6: one empty-purse tap and a full jar), with one hint; one upright phone screenshot at the densest phase (level 4 after moves, level 5 with the fix cards, level 6 mid-fill); `fingerdemo` at the new level; `npm run build`, because voice lines and clips are added. Record the tested commit, filter and server URL.
- **This docs slice:** `node scripts/check-links.mjs` and `git diff --check`; the level-6 plan counts and the level-4 split check came from one uncommitted throwaway script.

### Open decisions

Each has a default the build uses; none blocks batch 2.

1. **Who picks the closed group's next choice at level 4.** Default: the badge shows it and she carries it out. If play shows the badge is too easy to ignore, the friend could instead say its choice aloud when selected.
2. **Level 5's left-out friends always from the losing side.** Default: yes, as the study proposes, without ever saying so. If play suggests it reads as a punishment, draw them from either group.
3. **Level 6 naming.** Default: name the plan ("same" or "some gave more") and judge neither, decision 4's lean.
