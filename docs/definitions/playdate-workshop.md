# Playdate Workshop, levels 1–3 (definition)

Defined 2026-10-22 as slice 1 of the [social-emotional study](../deep-dives/subjects/social-emotional.md#build-slices-in-order), from its [first game's proposed ladder](../deep-dives/subjects/social-emotional.md#first-games-proposed-ladder), its [commercial follow-up](../deep-dives/subjects/social-emotional.md#existing-game-follow-ups-and-priority) (chooser and maker roles, the solo pet) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#social-emotional-play-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: build waits on the developer (`decision`).** The [collected decision](../WAITING-ON-DEVELOPER.md) ("Social-emotional subject: identity, review and older placement") lists a new registration for this subject as unapproved, and asks the developer to confirm that operating the materials warrants a new game beside Story Theater. The packet below gives a default for each open choice, so the build (the study's slice 2) can start the day they are confirmed. An early-childhood/SEL educator and an accessibility reader are recommended to read the authored requests and endings before implementation ([decision 2](#open-decisions)); that is a recommendation for fictional screen play, not a gate. Nothing here is practical conflict advice, a calming instruction or a parent card. Levels 4–6 (mend the mark, a changed request, another agreement) are later packets.

**Fun action and purpose:** a little craft table with two critter friends, their pages, a stamp pad and (later) a big two-handled roller. Each friend says and shows what they would like. She gives the stamp pad to a friend, taps their page and a star thumps down; she passes the pad and the other friend stamps. At levels 2–3 she first picks a pictured plan for how the friends will use the materials, and can try it out before making it. The payoff is the two actual creations held up side by side. The learning purpose is **listening to stated requests and carrying out a shared-material plan that meets all of them**: taking turns with one tool, seeing that two different plans can make the same thing, and noticing when a plan leaves someone's request out (Head Start ELOF social-emotional goals on cooperation and peer relationships; CASEL relationship skills, as an anchor only: the study's [evidence limits](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits)). It claims nothing about empathy, kindness or a child's real friendships.

## Identity and overlap

Rechecked 2026-10-22 against the catalog and open proposals, as the study's decision 1 asked:

- **Story Theater** (Story Steps 12–13, Story Grove, school) chooses three fields, then Watch plays a narrated show; nothing she does after choosing changes it, and there is no material state. Here the **materials carry the rule**: who holds the pad, which page has its mark and whether it has been passed decide which taps work, and an out-of-turn tap is refused with the reason, for free. L3's side-by-side plan has several legal orders and either starting friend, so making it is play, not watching. A plan is chosen once; its making is done step by step by her (or by the pet, counted as help). If the build or the developer finds the Make phase reads as "tap the glowing next step", [decision 1](#open-decisions) names the fallback.
- **Stamp Studio** (Painted Canyon) is free composition for one artist: no requests, no other people's materials, nothing to pass. Here every mark is a friend's, made with a tool that friend holds, toward something a friend asked for; the stamps are one picture per round and there is no canvas to compose.
- **Owl Walk Home** (Story Grove) takes turns moving along a path with a shared goal; there are no materials, requests or plans to choose between.
- **Monster Munch / Pet Kitchen** share quantities fairly; Playdate Workshop never counts a fair share (the L2 banner's two stars each is the turn-taking rule's result, not a fairness check, and the roller plan has no per-friend count).
- **Feelings Faces** names expressed feelings; nothing here asks what a face feels. Requests are spoken and pictured in the first person, and faces stay calm and friendly throughout: no frown on a refusal, no happiness meter.
- **Common Ground / A Place for You** (proposed, older) arrange space against requests; this game sequences turns with materials and is preschool–pre-K.

## The model (`logic.ts`)

- **Friends:** `A` (left) and `B` (right), each a seeded critter from `CRITTERS` (kind and colour); the rules never depend on the cast.
- **Surfaces:** `pageA`, `pageB` (each holds one mark) and `banner` (`cells` marks: 4 at level 2, 2 at level 3). A round lays out only the surfaces its level or chosen plan uses.
- **Tools:** `pad` (one holder: `A`, `B` or `tray`) and, at levels 2–3, `roller` (level 2: carried by `both` or in the tray; level 3: one holder). Tools never run out or break.
- **Marks:** each surface keeps its marks in order as `{ by: 'A' | 'B' | 'both', tool }`; a full surface takes no more.
- **Actions:** `give(tool, friend | 'both')` (from the tray), `pass(tool)` (to the other friend), `stamp(surface)` (the friend holding the pad marks it), `roll(surface)` (the roller's holder marks the next cell). An action has a defined result in every state: it either extends the trace or is refused with a reason and changes nothing.
- **Requests** (authored per level, see [Levels](#levels)) are predicates over the finished surfaces and who made their marks. **Plans** are authored cards; each compiles to the finite set of **allowed traces** that carry it out. In the Make phase an action is accepted only if the trace so far plus that action is a prefix of some allowed trace of the chosen plan, so every plan is enforced by the same rule and a tiny enumerator lists every allowed trace. No reusable relationship engine.
- **Who marks:** a tap on a page means its owner marks it with the tool they hold; a tap on the banner means the pad's holder stamps it (or the roller's holders roll it).
- **Refusal reasons:** the allowed-trace rule alone decides whether an action is accepted; a pure `whyNot(state, action)` only explains a refusal, giving the first that applies: `full` (that surface has its mark), `notInPlan` (a surface or tool the plan does not use), `waiting` (the page's owner holds no tool), `turns` (the pad's holder has stamped since it was last passed and the plan takes turns), `myStep` (pass before the holder has made their planned mark), `chooseFirst` (a tool tapped while still in the tray: give it first), else `later` (that step comes later in the plan).
- **`check(state, request)`** returns `met` or `unmet(reason)` for each request; **`previewOf(plan)`** runs the plan's first allowed trace on a blank table and returns the finished surfaces and each request's result.
- **`hintFor(state)`** returns one next useful action: in the Plan phase, an accepted card (the selected one if it is accepted); in the Make phase, the first action of the shortest allowed completion from the current trace. Following it from any reachable state finishes the round.
- **Undo** restores the exact state before the last accepted action. At an empty Make trace, Undo (and the small chosen-plan card) returns to the Plan phase with that card still selected and the table blank. At level 1, Undo at an empty trace is disabled.
- **Authored first round** for each level so the how-to card and its demonstration open on the same table; later rounds are seeded from `ctx.rng` within the variation each level names. Each level ships **at least three authored variations** (cast, stamp picture and banner theme) that obey the same rules.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Stamp and pass** | preschool, pre-K | Who gets the pad first; giving, stamping and passing | Both pages have their star |
| 2 | **Two ways to make** | pre-K | Take turns with the pad, or roll it together; then make it | The banner has all four stars |
| 3 | **My page, our plan** | pre-K | A plan that meets both requests: side by side, or the banner and the page in either order; then make it | Every request on the chosen plan is met |

No toddler or lap window (the study: Owl Walk Home and Feelings Faces cover them), and no school window until levels 4–6 exist ([decision 3](#open-decisions)).

### First rounds

- **Level 1:** the pad sits in the tray between two pages. A's bubble shows a page with a star and A's face: "I'd like one star on my page." B's bubble the same for B. Give the pad to either friend (a tap on that friend), tap that friend's page (a star thumps down), tap the pad (it passes), tap the other page. The trace strip shows its three slots, give-free: *stamp, pass, stamp*, filling as she goes. Tapping the other page first gets B's calm "I'm waiting for the stamp pad." Allowed traces: `give(pad,A) stamp(pageA) pass stamp(pageB)` and the mirror. *Variation:* the cast, which friend is left, and the stamp picture (star, flower or fish).
- **Level 2:** both bubbles show one banner with four stars and both faces: "Let's make a banner together!" Two plan cards: **Take turns** (the pad with an arrow between the two faces) and **Roll it together** (the roller with both faces on its handles). Take turns: `give(pad,X)`, then `stamp(banner)` and `pass` alternating until four stars (X either friend), 8 steps. Roll together: `give(roller,both)`, `roll(banner)` ×4, 5 steps (a drag of the roller along the banner rolls the cells it passes). Both make the same banner; the traces differ. *Variation:* cast, banner theme and stamp picture.
- **Level 3:** A's bubble shows the banner with both faces, and a small "or" picture of two pages side by side: "Let's make a banner together. Or we could make our own pages side by side." B's bubble shows a page with B's face only: "I want to keep my own page." Four cards:
  - **Side by side** (pages A and B, the pad and the roller): give each friend one tool (either assignment, either order), then each marks their own page, in any interleaving after their own give. Meets both.
  - **Banner, then my page:** the banner's two cells in turns with the pad (either starter), then B stamps B's page (passing first if A holds the pad). Meets both.
  - **My page, then banner:** B is given the pad and stamps B's page, then the banner in turns (either starter). Meets both.
  - **Just the banner** (the draft that leaves a request out): the banner in turns, no page for B. Its preview leaves B's request outlined.

  *Variation:* cast, which friend asks for the page, banner theme and stamp picture; the four cards' order is seeded.

## Plan and Make

**Plan phase (levels 2–3):** the cards sit under the two request bubbles. A tap selects a card (it lifts). **Try it** plays `previewOf(card)`: the friends mime the plan in a quick ghosted run on the table, and each request ends either ticked or outlined, with that friend's spoken line ("That works for me." / "I still want my own page."). **Make it** on an accepted card starts the Make phase with blank surfaces and tools in the tray. **Make it on a card that leaves a request out does the same as Try it and stays in the Plan phase**: an unmet plan is never started, so Finish is never withheld halfway through. Selecting, previewing and Make it on an unmet card are free.

**Make phase:** the chosen card shrinks to the top of the table (a tap on it returns to the Plan phase, blanking the table, free). Inputs, all taps with drag alternatives: a tap on a friend gives them the tray's only tool (with two tools in the tray, tap a tool to lift it, then a friend; or drag a tool onto a friend with `src/engine/drag.ts`); a tap on a held pad passes it; a tap on a surface stamps or rolls there with the tool its plan says; the roller can be dragged along the banner. A refused action shakes the tapped thing gently and the relevant friend says the reason; nothing changes. **Undo** steps back one accepted action. When every request on the plan is met, a big pictured **Finish** and a **Watch again** (replays the trace from a blank table, free) appear.

## Accounting, help and finishing

**Misses are always 0 in this game.** Selecting cards, previews, Make it on an unmet card, refused actions, Undo, changing the plan and Watch again are free experiments, as the study requires; no boing for a plausible plan. The how-to note and a rule test state it, so nobody later "fixes" it.

**Decisions:** level 1 has one, *make* (give, stamp and pass); levels 2–3 have two, *plan* and *make*. Each decision counts **at most one hint**, so a round records at most 2.

| Help | When | What happens | Counts |
| --- | --- | --- | --- |
| Two previews of unmet plans in one round | Level 3 | A persistent glow outlines the unmet request (B's page); no card is chosen for her | Nothing |
| **Lightbulb** (on screen; also Show a hint on the pause sheet) | Any phase | The friend speaks `hintFor`'s step and it glows; tapping the glowing thing does it | 1 hint for the current decision, the first time |
| **{pet} picks** (the pet button, Plan phase) | Levels 2–3 | The pet selects a seeded accepted card and says so; she presses Make it | 1 hint for *plan* |
| **{pet} makes it** (the pet button, Make phase) | All levels | The pet carries out the rest of the trace one step at a time, pausing a beat on each | 1 hint for *make* |
| **Help me make it** (the pet button pressed in the Plan phase, then again) | All levels | The pet picks, then makes it | Raises the round to **2 hints**, at every level including level 1 |

The pet doing both roles therefore always costs exactly what Help me make it does, and no round the pet completes records zero hints. Assisted rounds finish through the shell with the usual sticker; they are not evidence of independent planning. Adaptation reads only hints here; the shell's ordinary rule applies.

**Finish:** tapping Finish has both friends hold up exactly the creations she made (pages, banner) with a soft chord and a cheer, about four seconds; a tap skips to the end pose. `ctx.finish({ misses: 0, hints })` runs once (a `finished` guard). One shell sticker. Home leaves at any moment without a reward or obligation. Nothing is saved between visits: no art, promises or preferences.

**Pause sheet:** Start again (blank table, Plan phase, keeping the round's hints) and Show a hint (`Scene.pauseActions`).

## Screen and controls

The Plan and Make phases are separate screen states, which is what lets level 3 fit in portrait: the cards are replaced by the table when making starts.

- **Request bubbles:** one above each friend, at least 260×150, distinguished by shape (round for the left, cloud for the right) and a portrait as well as colour. A tap replays the same authored line; it is never reassigned.
- **Plan phase:** up to four cards, each at least 280×180, in a 2×2 grid (levels 2–3); **Try it**, **Make it**, the lightbulb and the pet button in a row, each at least 120×110.
- **Make phase:** friends at the left and right, at least 140 wide, each with their page (at least 200×200) in front; the banner across the middle (cells at least 120×120); the tool tray between the pages, each tool at least 120×120; the small chosen card (at least 160×100) at the top centre; the trace strip of executed steps (chips 80 high, not tap targets) under it; Undo, the lightbulb and the pet button in a row, each at least 110×110. Finish (at least 200×150) and Watch again (at least 120×110) take the table's centre when done.
- **Companion:** `ctx.companion()` stands beside the pet button, clear of the guide's bottom-left corner; it mimes when it takes a role and cheers at Finish.
- **Sound:** synthesized only: a soft thump per stamp (a pentatonic step per friend from `src/audio/notes.ts`), a rolling purr for the roller, a slide for a pass, a gentle wobble for a refusal. The island's style keeps playing.

`workshopLayout(view, level, phase)` returns every rectangle. A test runs it at the four views the lands test uses, for every level and both phases, and asserts every child target at least 100 logical units each way (larger where stated), no overlaps, at least 30 units between neighbours, Home (top-left) and the guide's bottom-left corner clear, and everything inside `view`; if a view cannot fit, it returns null and the test fails rather than shrink. Rough count for the tightest case, level 3 Make in portrait 768×1024: bubbles 120–270, card and strip 290–410, banner 430–570, pages and tools 600–820, buttons 860–970 from x 230, which fits with 30-unit gaps.

### Layout sketches

**Landscape (1024×768), level 3, Plan phase:**

```
+------------------------------------------------------------+
| [Home]   (A: banner / or pages)     {B: my own page}       |
|            [ side by side ]   [ banner, then page ]        |
|            [ page, then banner ] [ just the banner ]       |
|  friend A                                       friend B   |
|            [Try it] [Make it] [bulb] [pet]                 |
|  guide                                                     |
+------------------------------------------------------------+
```

**Landscape, level 3, Make phase (side by side):**

```
+------------------------------------------------------------+
| [Home]   (A request)   [chosen card]   {B request}         |
|                      [ trace strip ]                       |
|  friend A                                       friend B   |
|  [ page A ]          [pad] [roller]           [ page B ]   |
|                     [undo] [bulb] [pet]                    |
|  guide                                                     |
+------------------------------------------------------------+
```

**Portrait (768×1024):** bubbles across the top, then the cards in a 2×2 grid (Plan) or the chosen card, trace strip, banner, then pages with the tray between them (Make), then the button row right of the guide's corner.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct` (the guide repeats them); everything else uses `ctx.say`. Friends speak in the first person, so no line needs a critter's name.

- `playdate.instruct.1`: "Both friends want a star on their own page. There's one stamp pad. Give it to a friend, then pass it."
- `playdate.instruct.2`: "The friends want to make one banner together. Pick a way to make it, then make it."
- `playdate.instruct.3`: "Listen to both friends. Pick a plan that works for both, then make it."
- `playdate.request.page`: "I'd like one star on my page."; `playdate.request.banner`: "Let's make a banner together!"; `playdate.request.bannerOr`: "Let's make a banner together. Or we could make our own pages side by side."; `playdate.request.own`: "I want to keep my own page."
- `playdate.why.full`: "That one is finished."; `.notInPlan`: "That's not in our plan."; `.waiting`: "I'm waiting for the stamp pad."; `.turns`: "We're taking turns. Pass it first."; `.myStep`: "Let me stamp first, then I'll pass it."; `.chooseFirst`: "Give it to a friend first."; `.later`: "That comes later in our plan."
- `playdate.preview.ok`: "That works for me."; `playdate.preview.own`: "I still want my own page."
- `playdate.hint.<action>`: "Give the stamp pad to a friend." / "Pass the pad." / "Stamp the page of the friend with the pad." / "Roll the banner." / "Try this plan."
- `playdate.pet.pick`: "{pet} picks this plan."; `playdate.pet.make`: "{pet} will help make it."; `playdate.done`: "Look what everyone made!"

No line says she or a friend should share, be kind or apologize, names a feeling as right, or asks the child about her own friends. Declining a banner (B's own page) is honoured in every accepted level 3 plan.

## Rule tests (`logic.test.ts`)

1. **Allowed traces enumerated:** for every level's cards, the enumerator lists every allowed trace; each accepted card's traces all end with every request `met`; level 1 has exactly the two orders; level 2's two cards produce identical banners with different traces; level 3's side-by-side plan accepts both tool assignments, both give orders and every interleaving, and both turn plans accept either banner starter.
2. **The draft leaves a request out:** "Just the banner" ends with B's own-page request `unmet`, and Make it on it changes nothing but the preview; no accepted card leaves any request unmet; B's own page exists and is marked only by B in every accepted level 3 trace.
3. **Refusals:** every action in every reachable state is either accepted (a prefix of an allowed trace) or refused with exactly the first matching `whyNot` reason, and a refusal leaves the state unchanged; repeated taps on a full surface add nothing.
4. **Undo:** undo restores the exact previous state after every action kind; undo at an empty trace returns to the Plan phase with the card selected (levels 2–3) and is disabled at level 1; Start again blanks the table and keeps hints.
5. **Hints lead somewhere:** from every reachable state, following `hintFor` reaches Finish within the shortest allowed completion's length, and its first step is accepted.
6. **Accounting:** misses are 0 for every input sequence; each decision counts at most one hint; Help me make it records exactly 2 hints at every level; the pet doing both roles records 2; any pet-completed round records at least 1; two unmet previews glow the request and count nothing.
7. **Variations:** at least three authored variations per level pass tests 1–2 unchanged, and seeded rounds stay within each level's variation.
8. **Layout:** `workshopLayout` at four views for every level and both phases, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` uses her controls at the current level. Level 1: give the pad to the *right* friend (showing the order is free), stamp their page, pass, stamp the other page, Finish. Level 2: select Take turns, Try it, Make it, give, then stamp and pass to four stars, Finish. Level 3: select Just the banner, Try it (B's request outlines), select Side by side, Make it, lift the roller onto B, give the pad to A, stamp A's page, roll B's page, Finish. It waits for the finish, so `fingerdemo` proves each level.
- **How-to card** (`src/content/howto.ts`). Goal: "Listen to what two friends would like, and help them make it with the craft things."
  - Steps: "Tap a friend to give them the stamp pad; tap their page to stamp, and tap the pad to pass it" `{ from: 1, to: 1 }`; "Pick a way to make it on a card; Try it shows what happens, Make it starts" `{ from: 2, to: 3 }`; "Make the plan: give the tools, stamp or roll, and pass the pad when it's the other friend's turn" `{ from: 2, to: 3 }`; "Both friends tell you what they want; a plan that leaves one out shows which" `{ from: 3, to: 3 }`.
  - Finish: "When both pages have their star, tap Finish" `{ from: 1, to: 1 }`; "When the banner is full, tap Finish" `{ from: 2, to: 2 }`; "When the plan is made and both friends have what they asked for, tap Finish" `{ from: 3, to: 3 }`.
  - Notes (all levels): "Nothing here counts as a miss: trying plans, out-of-turn taps and Undo are free. The lightbulb and the pet's help count as help."; "These are pretend friends' requests, not advice about real friendships."
- **Registration (default, [decision 1](#open-decisions)):** ID `playdate-workshop`, name "Playdate Workshop", spoken title `game.playdate-workshop` ("Playdate workshop"). Region (subject) `story-grove`. Skills `['taking turns', 'listening', 'planning', 'shared goals']`. Bands (`BandLevels`): preschool 1–1, prek 1–3. Hub icon: two pages with a stamp pad between them. Sticker (page `meadow`): a seeded banner with stars.
- **Art:** code-drawn in `src/games/playdate-workshop/art.ts` with `src/art/palette.ts` and `CRITTERS` from `src/art/critter.ts`: table, pages, banner, stamp pad, roller, request bubbles, plan cards (small pictures of each plan), trace chips. No imported art or audio.
- **Co-play:** one person is the planner (points to a card and says why) and the other the maker (gives, stamps, passes); swap next round. In solo play the pet fills either role through its button, counted as above. Profile or seat credit for a second person follows the existing [family-role decisions](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer) and is not promised here. **Off-screen** (spoken tip): "With two toys and one crayon, act out taking turns to make two pictures. Either of you can say no thanks." A play idea only, not advice.
- **Couch:** none. **Journal:** nothing filed. **Creations:** nothing kept.
- **Rework couplings:** uses the companion through `ctx.companion()`; nothing depends on the rework.

## Check tier

When the developer confirms decision 1, the build is one declared same-game batch in one worker and PR (the study's slice 2, all three levels): **new-game tier**: typecheck, unit tests, one scripted play through a filter at level 1 and level 3 (an out-of-turn tap, an unmet preview, a lightbulb hint, Help me make it), `fingerdemo` at 1 and 3, one portrait screenshot of the level 3 Make phase, and `npm run build` for the registry, lands, voice and how-to files. Level 2 is covered by its rule tests and `fingerdemo` at 2. One `browser-check.mjs` case and its README row. If the allowance cannot cover all three levels, the worker stops after a complete level 1 or 1–2 and leaves the PR draft with that checkpoint; it never ships a solver without play.

Device and person checks stay open: whether a three-year-old understands passing the pad from the friends' requests, whether pre-K children compare plans or just pick the first card, whether co-play roles are wanted, and how iPad speech says the first-person lines. Browser automation establishes none of these.

## What comes next

The study's slice 3 (Two Viewpoints within Story Theater) and its recommended next definition, **A Place for You** within Common Ground, are independent of this build. Levels 4–6 need their own packets (slice 6), and a school window opens only with them.

## Open decisions

Each has a default the build uses.

1. **New game and land.** Default: a new game (the overlap section says why operating the materials is not Story Theater), home land **Story Grove**, region `story-grove`. Story Grove holds 12 games today; `lands.test.ts` decides at build time. Fallback if its layout returns null: **Painted Canyon** (`treehouse` land, 6 games), beside Stamp Studio; the region stays `story-grove`. Alternative if the developer judges the Make phase too thin: fold the plan cards into Story Theater as a narrated choice, dropping the operated materials.
2. **Content reading.** Default: the requests, refusals and endings above, read by an early-childhood/SEL educator and an accessibility reader before implementation if one is available (recommended, not a gate). Alternative: build first and adjust wording after review; only voice lines change.
3. **Bands.** Default: preschool 1, pre-K 1–3; school waits for levels 4–6. Alternative: school 3 now, if school children should see it before 4–6 exist.
4. **Pet roles.** Default: the pet picking or making counts one hint for that decision, and both count two. Alternative: the pet's roles are free in solo play (only the lightbulb counts), accepting that a pet-made round would then read as smooth for adaptation.
5. **Roller drag.** Default: tapping a banner cell rolls one cell, and dragging the roller along it rolls the cells it passes. Alternative: drag only, if a tap per cell feels like stamping.

**Decided 2026-10-23 (on the developer's delegation):** every default stands; decision 1 is confirmed (a new game, Story Grove, fallback Painted Canyon), so the build is unblocked, and decision 2's reading is the building session's source check.
