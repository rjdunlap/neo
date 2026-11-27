# Playdate Workshop, levels 4–6 (definition)

Defined 2026-11-27 as slice 6 of the [social-emotional study](../deep-dives/subjects/social-emotional.md#build-slices-in-order): the repair, revision and ask-first rounds the study proposes for `school` (about 6–8). Docs only: nothing is built. It extends the built game and its [levels 1–3 definition](playdate-workshop.md), whose model (`logic.ts` surfaces, tools, marks, allowed traces, `whyNot`, `check`, `previewOf`, `hintFor`, Undo), Plan and Make phases, screen rules, accounting rules and `workshopLayout` apply unchanged unless this page says otherwise. Fictional island friends only: nothing says how a real child should feel, and no line asks about her own friends.

**Fun action and purpose:** the same craft table, now with something that has gone slightly wrong or changed: a smudge on the banner, a friend's new idea halfway through, a friend who has not said yet what they want. She still operates the materials, so the payoff is the finished banner and pages held up. The learning purpose is **listening again, comparing two workable repairs, revising a plan when a stated request changes, and asking what someone wants rather than guessing** (Head Start P-SE social problem solving and expressing needs, extended; CASEL relationship skills as an anchor only; no standard code is claimed for ages 6–8, as the study says).

## Identity and overlap

- **Levels 1–3** are the table, requests and plans; this page adds a damaged start, a mid-round change and an unspoken request, all inside the one engine. No new game, no new tool beyond a *flower pad* (level 5) and a *patch* of paint-over art (level 4), and no relationship engine.
- **Story Theater Two Viewpoints** ([Story Steps 14](two-viewpoints.md)) hears two accounts of a mishap and chooses an ending in a narrated show. Here the mishap is an accident nobody is blamed for, and the work is operating shared materials to repair it: there are no accounts to weigh.
- **Common Ground** arranges a shared space against explicit requirements; this game sequences turns and tools and never scores tradeoffs.
- **Feelings Faces Ask First** is a separate design review (the study's slice 5). Level 6's Ask is a free tap that makes a friend say a request aloud; it never asks what a face feels.

## Level table and bands

| Level | Name | What she decides | Finish |
| --- | --- | --- | --- |
| 4 | **The smudged banner** | Which of two repairs fixes the smudge; then makes it (optionally *Try the other way*) | Every request met on the repaired banner |
| 5 | **A new idea** | A first plan; then, when a friend's request changes, which revised plan keeps what is good | Every request met under the *new* request |
| 6 | **Ask first** | Asks a friend who has not said what they want; then a plan that meets what was said | Every request met on the chosen plan |

Bands: **school 3–6** and unchanged preschool 1–1, prek 1–3, i.e. `school: { min: 3, max: 6 }` so level 3 is the warm-up for the older window; the band and land audit ([decision 1](#open-decisions)) runs in the build (Story Grove must still fit every band's page; fallback Painted Canyon). Pins and saved levels are unchanged: only new levels are appended.

## The additions to the model (`logic.ts`)

- **Smudge (level 4):** a mark `{ by: 'none', tool: 'smudge' }` the round starts with on one banner cell; it counts as a mark in that cell but is not a star. Actions that **cover** it (`stamp` or `roll` on that cell) replace it. The other cells hold stars already made (`by` A or B). A pure `cleanCells(banner)` is the count the requests read.
- **Requests are predicates as before** and may now read the surfaces' **starting marks**. They are authored per variation and checked by `check(state, request)`.
- **Changed request (level 5):** a request carries an optional `{ after: n, becomes: Request }`: once the trace holds `n` accepted actions, `activeRequest(state)` returns the new one. It is a pure function of the trace, so Undo past `n` restores the earlier request and its original bubble line without a separate rule. Allowed traces are enumerated against the active requests: a trace is allowed if every prefix of length ≥ `n` is a prefix of an allowed completion for the changed requests; before `n` any prefix of any plan card shown is allowed.
- **Unspoken request (level 6):** a request carries `spoken: boolean`. Unspoken requests show `?` in the bubble and are not read by `check` until *asked*. `ask(friend)` is a free action that sets `asked` for that friend and plays their authored line. The authored answer is chosen per variation from two (each ships with both answers solvable).
- **`previewOf(plan)`** now also returns, for an unspoken friend, `'unknown'`: that friend's bubble stays `?` with a pointing hand on the Ask button, and Make it on a card is **not started** (like an unmet plan) until every friend has been asked, so a plan is never made on a guess. Ask is never counted.
- **`whyNot`** gains one reason after `waiting` and before `turns`: `askFirst` (a make action or Make it while a friend is still unasked).

## Levels

### Level 4, The smudged banner

Both friends stand at a four-cell banner. Cell 3 shows a smudge (a paint puddle, with a small "oops" picture and no one at fault; the line says "The paint spilled" and never says who). A's bubble: banner with four stars, "I'd like our banner to have four stars." B's bubble: the already-made stars outlined, "I'd like to keep the stars we made." Plan cards:

- **Stamp over it:** `give(pad, X)` (either friend), then `stamp(cell 3)`: 2 steps. Meets both.
- **Roll over it together:** `give(roller, both)` then `roll(cell 3)`: 2 steps. Meets both (the roller marks the cell as `both`).
- **Start a new banner** (the draft that leaves a request out): a blank banner; its preview outlines B's kept stars. Make it behaves as Try it, as at level 3.

Two accepted repairs, two traces, the same finished banner. After Finish is available, **Try the other way** (free, any number of times) replays the other accepted repair from the smudged start as a ghosted run, so she can compare; it never becomes required. *Variations:* which cell is smudged (2, 3 or 4), which friend made which stars, cast and stamp picture, and the order of the three cards (seeded).

### Level 5, A new idea

The start is a clean four-cell banner and a first round like level 2: both friends say "Let's make a banner together" and the cards are **Take turns** with the pad. After her second accepted action (two stars on the banner), B's bubble **changes** with a small bell: "I have a flower stamp. Could the last two be flowers?" A's bubble keeps its own line ("I'd like to keep our stars", meaning the two made) so keeping is a stated request, not a rule of the game. The Plan phase returns with three cards, the two stars already on the banner:

- **Flowers for the last two:** `give(flower, X)`, then `stamp(cell 3)`, `pass`, `stamp(cell 4)` (either start): meets both.
- **Flowers for the last two, rolled:** the flower roller carried by both; `roll(cell 3)`, `roll(cell 4)`: meets both. (The roller art swaps its picture; one tool kind, as in level 2.)
- **Keep going with stars** (draft): the two stars continue with the pad; B's flower request is outlined.

Selecting, Try it and an unmet Make it are free as before; Make it on an accepted card continues on the **same banner** (the two stars stay). **Undo** past the change returns to the first request and its Plan card; nothing is lost. *Variation:* the changing friend, the new picture (flower, moon or leaf) and the change point (after 2 actions in every level-5 round, so the demonstration matches the how-to card).

### Level 6, Ask first

A's bubble speaks its request ("Let's make a banner together"). B's bubble shows `?` and a small **Ask** button beside it. Cards are those of level 3 (**Side by side**, **Banner, then my page**, **My page, then banner**, **Just the banner**). Try it shows A ticked and B `?`. Tapping Ask on B plays B's authored line, one of two per variation: *"I want to keep my own page"* (the level 3 request) or *"I'd like to help with the banner too"*. Under the second answer the banner is wanted by both, so **Just the banner**, **Banner, then my page** and **My page, then banner** are accepted and **Side by side** (no shared banner) is the one left unmet; under the first answer the cards are judged exactly as at level 3 (**Just the banner** unmet). `acceptedFor(answer)` lists them, and each variation's authored cards and answers are verified by [test 6](#rule-tests). Asking is always allowed, as often as she likes, and a second tap replays the same line. *Variation:* which friend is unspoken, the answer and the cast.

## Accounting, help and finishing

**Misses are always 0** (as in levels 1–3; the how-to note and a test state it). Decisions per level: 4 has *plan* and *make*; 5 has *plan*, *revise* (the Plan phase after the change) and *make*; 6 has *ask*, *plan* and *make*. Each decision counts at most one hint, as in the levels 1–3 table, so a round records at most 2, 3 and 3. The lightbulb in a decision speaks and glows `hintFor`'s step (for *ask*, the pointing hand on Ask; for *revise*, an accepted card). The pet's buttons follow the same table: **{pet} picks** counts *plan* (or *revise* if the change has happened); **{pet} asks** (level 6, Plan phase, an unspoken friend) counts *ask*; **{pet} makes it** counts *make*; **Help me make it** counts every decision the round reaches, so exactly 2, 3 and 3 hints. A round the pet completes records at least 1 hint, so assisted rounds never read as independent. Finish, the sticker, Watch again, Start again and the pause sheet are as in levels 1–3; `ctx.finish({ misses: 0, hints })` runs once.

## Screen and controls

`workshopLayout` is extended, not replaced: level 4 uses the level 3 Plan layout with three cards and a smudge in the banner (cells 120×120 as before); level 5's Plan phase after the change uses the same grid with a bell-marked bubble; level 6 adds an **Ask** button of at least 120×110 beside the unspoken bubble and the same two phases as level 3. The "Try the other way" button (level 4) takes the Watch again slot's size (120×110). The layout test runs every new level and both phases at the four lands views with the existing assertions, and **returns null rather than shrink** a target. Portrait stays the tightest case: levels 4–6 add no element to the Make phase that level 3 does not already carry.

## Speech (`voice.ts`, new lines)

Instructions use `ctx.instruct`; the rest `ctx.say`. Friends speak in the first person; no line blames, tells a friend to be kind or apologize, or names a feeling as right.

- `playdate.instruct.4`: "Oh, the paint spilled. Pick a way to fix the banner, then fix it."
- `playdate.instruct.5`: "The friends will make a banner. Listen: someone may have a new idea."
- `playdate.instruct.6`: "One friend hasn't said what they want. Ask them, then pick a plan."
- `playdate.request.spill`: "The paint spilled! I'd like four stars."; `playdate.request.keep`: "I'd like to keep the stars we made."
- `playdate.request.new`: "I have a new idea. Could the last two be flowers?"; `playdate.request.keepOwn`: "I'd like to keep our stars."
- `playdate.request.unknown` (the `?` bubble, read when tapped): "I'll tell you if you ask."; `playdate.ask.own`: "I want to keep my own page."; `playdate.ask.join`: "I'd like to help with the banner too."
- `playdate.why.askFirst`: "Ask me first!"; `playdate.preview.unknown`: "Ask me what I want."; `playdate.hint.ask`: "Tap Ask to hear what they want."; `playdate.pet.ask`: "{pet} asks them."; `playdate.compare`: "Here is the other way."

Both Portuguese and the other family languages follow the existing [family languages](../WAITING-ON-DEVELOPER.md) route at build time; nothing here depends on them.

## Rule tests

Added to `logic.test.ts`, all level 3 tests unchanged:

1. **Repairs:** level 4's two accepted cards finish with the same cleaned banner (four stars, none removed, the made stars untouched) by different traces; the draft leaves B's request `unmet`; covering the smudge is the only way to a finished banner; repeated taps on a finished cell add nothing; Undo restores the smudge.
2. **Change point:** level 5's active request equals the first before `n` actions and the changed one from `n`; Undo across `n` restores it; every accepted card's traces end with both requests `met` under the changed request and with the two earlier stars unchanged; the draft ends with the new request unmet; from every reachable state before and after `n` following `hintFor` reaches Finish.
3. **Ask:** before Ask, `previewOf` returns `unknown` for the friend and Make it is refused with `askFirst`; after Ask the accepted cards are exactly `acceptedFor(answer)`; Ask is idempotent and free.
4. **Accepted sets are non-empty:** for every authored variation of 4, 5 and 6, and both level 6 answers, at least two cards are accepted and the draft is unmet.
5. **Accounting:** misses are 0 for every input sequence; each decision counts at most one hint; Help me make it records exactly 2, 3 and 3 hints; pet-completed rounds record at least 1.
6. **Variations:** at least three authored variations per level pass tests 1–4 unchanged.
7. **Layout:** `workshopLayout` at four views for levels 4–6 and both phases.

## Ghost finger, how-to card and registration

- **`autotouch()`** continues the existing bot: level 4 selects Start a new banner, Try it (B's stars outline), selects Roll over it together, Make it, gives the roller to both, rolls the smudged cell, Finish. Level 5 selects Take turns, Make it, stamps twice, waits for the bell, selects the draft, Try it (outlines), selects Flowers for the last two, Make it, gives, stamps, passes, stamps, Finish. Level 6 taps Ask, then Just the banner (or Side by side by the answer), Try it, Make it, finishes. It waits for the finish so `fingerdemo` proves each level.
- **How-to card** (`howto.ts`): steps `{ from: 4, to: 4 }` "The paint spilled: pick a way to fix it; a plan that starts over leaves a friend out"; `{ from: 5, to: 5 }` "Listen for a new idea; you can change the plan and keep what you made"; `{ from: 6, to: 6 }` "Tap Ask to hear what a friend wants before you pick a plan". The all-level notes are unchanged.
- **Registration:** same ID, region, skills (add `repair`, `asking`), sticker and hub icon; `BandLevels` school 3–6; `describeLevel` lines "The smudged banner: fix the spill so both friends' requests are met", "A new idea: change the plan when a friend has a new request", "Ask first: ask a friend what they want, then pick a plan".
- **Art:** code-drawn from `src/art/palette.ts`: the smudge, the patch for covering it, the flower stamp and roller picture, the `?` bubble, the bell and the Ask button. No imported art or audio.
- **Co-play and off-screen:** one person asks and listens and the other makes, then swap. Off-screen: "With two toys and one paper, pretend something spills and talk about two ways to fix it; then ask 'what would you like?' before deciding." A play idea only, not advice.
- **Couch, journal, creations:** none, as before.

## Check tier

New levels on an existing interaction, built as one same-game batch (levels 4 and 5 first, 6 after, [READY](../READY.md)): typecheck, the game's rule tests, one browser play of the new top level with `fingerdemo` at it and one portrait screenshot of level 6 Plan. `npm run build` only if the lands test or registration changes shared files. Device and person checks stay parked ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).

## Open decisions

Each has a default the build uses; none needs the developer.

1. **Band and land.** Default: school 3–6 in Story Grove; the lands test decides at build time, with Painted Canyon as the fallback.
2. **Content reading.** Default: build the lines above and adjust wording after an early-childhood and accessibility read; only voice lines change. The spill is deliberately nobody's fault.
3. **Level 5 change point.** Default: after two actions, always. Alternative: seeded between one and three, rejected for now so the demonstration matches the card.
4. **Ask before preview.** Default: Try it works before Ask and shows `?`; Make it waits for Ask. Alternative: Ask required before Try it (rejected: free previews stay free).
