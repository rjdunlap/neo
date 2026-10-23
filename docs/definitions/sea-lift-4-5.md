# Sea Lift levels 4–5: How far? and Twin stops (definition)

Defined 2026-10-22 on `claude/define-sea-lift-4-5` ([PR #823](https://github.com/rjdunlap/neo/pull/823)) as slice IN2 of the [integers study](../deep-dives/subjects/integers.md#build-slices-in-order), from its [ladder](../deep-dives/subjects/integers.md#a-first-games-ladder-sea-lift) (levels 4–5) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#integers-recommendations). It extends the built [Sea Lift 1–3](sea-lift.md) (`src/games/sea-lift/`) and changes none of its rules.

**Status: defined; the build waits on one read.** The study's [decision 8](../deep-dives/subjects/integers.md#decisions-for-the-developer) asks a mathematics educator to read the level-4 card distractors before they are built. The [card table](#the-level-4-card-table-for-the-educator) below is what they read; the Waiting row "Sea Lift 4–5: the educator's read of the level-4 cards" holds it. Level 5 needs no reviewer, but it sits above level 4 on the ladder, so both build in one batch once the read is done. The [open decisions](#open-decisions) all have defaults.

**What it adds:** two new school levels at the top of the ladder.

- **Level 4, *How far?*** Two friends wait at two stops, usually on opposite sides of the water. "How many stops from the fish to the duck?" Three big number cards. She taps one; the lift rides from one friend to the other, ticking each stop, and the friend says how far it was. Learning: **the distance between two numbers across zero** (England Year 6: "use negative numbers in context, and calculate intervals across 0"; CCSS 6.NS.C.7 and 6.NS.C.8's distance on a line).
- **Level 5, *Twin stops*.** A friend rides in the lift: "My twin lives just as far from the water, on the other side." She taps the twin's stop. One case a round is a friend at the dock, whose twin is at the water too. Learning: **opposites**, the same distance from zero on the other side, and zero as its own opposite (CCSS 6.NS.C.6.a).

Levels 1–3 keep their IDs, plans, pins, authored rounds and rules. This adds no band, land, game, save field, journal entry, creation, couch entry or asset.

## Identity and overlap

- The **number cards** are new to Sea Lift but not to the island: Lift It's level 5 and Meadow Pens' level 2 use the same three-card choice. Here the cards are counts of stops, always positive; no card carries a sign.
- **Frog Hop** keeps whole-number distance on its horizontal line. Its G3 *Below zero* sketch stays unbuilt ([Sea Lift decision 1](sea-lift.md#open-decisions)).
- Levels 6–7 (*Lower, or closer to the water?* and *Back to the water*) are **not** defined here; they wait on study decisions 2 and 8.

## The model (`logic.ts`)

- `LEVELS` becomes `{ school: { min: 1, max: 5 } }`; `PLANS` gains `{ id: 4, name: 'How far?' }` and `{ id: 5, name: 'Twin stops' }`; `LevelId` widens to `1 | 2 | 3 | 4 | 5`.
- **Level 4 case** `HowFar = { from: { friend, stop: a }, to: { friend, stop: b }, cards: [number, number, number] }`. The answer is `|a − b|`.
  - **Across the water** (most cases): `a` and `b` have opposite signs, neither is 0, and `|a| ≠ |b|` (an equal pair is level 5's business and would make the magnitude mistake 0).
  - **One side** (at most one case a round, never the first): both below the water, `a ≠ b`, e.g. −5 and −2.
  - **Cards** are exactly three distinct numbers: the answer; the **magnitude mistake** (across: `||a| − |b||`, ignoring the water, as in "4 − 3 = 1"; one side: `|a| + |b|`, adding the numerals); and the **both-ends mistake** (`answer + 1`, counting both friends' landings rather than the rides between them). The table below shows these never collide. Their order on screen is seeded, so the right card is not always in one place.
  - A round is five cases: at least four across the water, both friends' sides appearing first at least once (one case starting above, one starting below), and no two consecutive cases with the same answer.
- **Level 5 case** `Twin = { friend, stop: s }`, with `s` in −5..5. The answer is `−s`.
  - A round is five cases: exactly one at the dock (`s = 0`, never the first), at least two above and two below, and the four nonzero cases with four different distances from the water.
  - The friend rides in the lift from `s`. Twin landings share a side of the zig-zag (opposites have the same parity), so a twin is the same ledge mirrored across the water.
- **Check** `check(state, x)`: level 4 takes a card value, level 5 a stop. Results are `right`, `wrong` (with the answer) or `ignore`. At level 4 a landing tap and an already-dimmed card are `ignore`; at level 5 the friend's own stop is `ignore` when `s ≠ 0` (the lift is already there), and at the dock it is the answer.
- **Hint** `hintFor(state)`: the right card at level 4, the twin's landing at level 5.
- The **first round of each level is authored** (below) so the how-to card and its demonstration tell the same story; later rounds are seeded from `ctx.rng` within these rules.

## The level-4 card table for the educator

The rule, with the authored round and the edge cases a reviewer would want:

| Friends (from → to) | Right | Magnitude mistake | Both-ends mistake | Note |
| --- | --- | --- | --- | --- |
| fish −3 → duck 4 | **7** | 1 (4 − 3) | 8 | Authored 1: the study's friends, with its 1 and 7 |
| penguin −1 → bunny 5 | **6** | 4 | 7 | Authored 2 |
| cat 2 → turtle −5 | **7** | 3 (5 − 2) | 8 | Authored 3: starts above |
| fish −5 → penguin −2 | **3** | 7 (5 + 2) | 4 | Authored 4: one side, below the water |
| pig 3 → fish −2 | **5** | 1 | 6 | Authored 5: answers in the round run 7, 6, 7, 3, 5 |
| −1 → 2 (seeded minimum) | 3 | 1 | 4 | Smallest across-the-water answer |
| −5 → 4 (seeded maximum) | 9 | 1 | 10 | Largest; −5 → 5 is excluded (equal distances) |
| −1 → −2 (one side, minimum) | 1 | 3 | 2 | Smallest one-side answer |

Why the three never collide: across the water the answer is `|a| + |b|`, the magnitude mistake is smaller and at least 1 (the distances differ), and `answer + 1` is larger. On one side the answer is `|a| − |b|`, the added numerals are larger, and they could equal `answer + 1` only if `2 × |b| = 1`. Every card is between 1 and 10.

**What the educator is asked:** the study's example offered 7, 1 and 4, its third card being one friend's own distance from the water. This packet uses `answer + 1` instead, because a friend's own distance can equal the magnitude mistake (−2 → 4 gives 2 and 2) and so cannot be a third distinct card in every case; the educator may prefer the study's card with a collision rule. Then: whether "4 − 3 = 1" (subtracting the numerals across zero) and "counting both landings" are the two mistakes worth a card at this age, whether one same-side case (where adding the numerals is the mistake) belongs in a round, and whether the card should say "stops" under each number. Defaults are as written; a changed distractor is a rule-test change, not a redesign.

## Screen and controls

- The shaft, landings, car, friends, ticks and splash are level 1–3's, unchanged.
- **Level 4:** the two friends stand on their landings; the car waits at the first-named friend's stop. The request card shows the two friends' faces with a double-headed arrow between them. The **three number cards** sit in a column in the free space left of the even landings, below a shortened request card. `cardLayout(view)` returns their boxes: each at least 120×110 logical units, at least 16 apart, inside `view`, clear of the home box (`HOME_BOX`), the guide's bottom-left corner (`PET_CORNER`), every landing and the request card. Feasibility, landscape 1024×768: the left column runs from x 250 to the even landings at x 445, and three 140×110 cards with 16-unit gaps take 362 units of height below a request card shortened to 170. Like `shaftLayout`, it returns null rather than shrink, and a test runs it at the four views the layout test already uses. A card squashes at touch-down; a used wrong card dims.
- **Level 5:** the friend rides in the car at its stop, with a request card showing a second, matching friend face with a question mark and an arrow toward the water. When she taps a landing the car rides there as at levels 1–3. **The twin is the same friend**, so the cast rule of levels 1–3 (land friends above the water, sea friends below) bends only here and visibly: a land friend's twin below the water wears a round diving bubble, and a sea friend's twin above the water sits in a little water bowl on its ledge, both code-drawn in `art.ts`. The twin appears on its landing only once she has found it.
- Taps during a ride are ignored. Nothing is timed. The pause sheet's Start again and Show a hint work as at levels 1–3.

### First rounds

- **Level 4 (authored, the table's first five rows):** the fish waits at −3, the duck at 4, the car beside the fish. "How many stops from the fish to the duck?" Cards 1, 7 and 8. She taps 1: the card bounces back, and the car rides up from the fish counting, "One, two, three: the water. One, two, three, four." It returns to the fish (one miss) and the 1 dims. She taps 7: the car rides to the duck, ticking seven stops and splashing at the water, and the duck says "Seven stops! Thank you." Then the four other rows.
- **Level 5 (authored):** the duck rides at 4: "My twin lives just as far from the water, on the other side." She taps −4: the car ticks down four stops, splashes, ticks four more, and the twin duck waves from the ledge below. Then a fish at −2 (twin at 2), the cat at 5, a turtle at the dock ("I live at the water. Where does my twin live?", answer: the dock), and a penguin at −3.

## Accounting, help and finishing

- **A miss** is a wrong card (level 4) or a wrong stop (level 5), counted once per distinct wrong answer per case.
  - Level 4: the car rides from one friend to the other and the friend counts it aloud in two parts, naming the water but not the total ("three stops to the water, and four more"; on one side, the stops alone). The car returns and the card dims.
  - Level 5: the car rides to the wrong stop; two brackets measure from the water to the friend's stop and to this one, and the friend says what it is ("That is two below the water. I live four above."). The car returns.
- **Never a miss:** tapping a friend (replays their line), a landing at level 4, a dimmed card, the friend's own stop at level 5 (the friend says "I'm here already"), the car, water, sky or sea; taps during a ride; replays.
- **After two misses on one case** the right card or landing glows (and at level 5 the two equal brackets are drawn from the water) and `hints++`, at most once a case. Show a hint in the pause sheet does the same.
- **Supported finish:** at level 5, a third miss after the glow plays the right ride by itself, counted aloud, so every round finishes. Level 4 needs none: each wrong card dims, so after two misses only the glowing right card is left to tap.
- **Finish:** after the fifth case the friends wave, then `ctx.finish({ misses, hints })`; one ordinary sticker from the shell. Nothing is kept or filed.
- **Adaptation:** the ordinary rule. Level 5 is reached from level 4 by two smooth rounds; both are school levels, so a school player's range simply grows to 5.

## Speech (`voice-script.ts`)

New lines under `sealift.*`, every number spelled out and no bare sign: `instruct.howfar` ("How many stops from one friend to the other? Tap the number."), `instruct.twin` ("Each friend has a twin just as far from the water, on the other side. Tap where the twin lives."), `ask.howfar` (with `{a}` and `{b}`: "How many stops from the {a} to the {b}?"), `ask.twin` ("My twin lives just as far from the water, on the other side."), `ask.twin.dock` ("I live at the water. Where does my twin live?"), `howfar.right` (with `{n}`: "{n} stops! Thank you."), `howfar.count` (with `{to}` and `{more}`: "{to} stops to the water, and {more} more."), `twin.right` ("There's my twin!"), `miss.twin` (with `{where}` and `{mine}`: "That is {where}. I live {mine}."), `twin.here` ("I'm here already."). Stops below zero are still spoken "N below the water" ([decision 2](#open-decisions)); "minus" and "negative" do not appear.

## Rule tests (`logic.test.ts`)

- **Level 4, over 500 seeds and the authored round:** every stop in −5..5; across-the-water cases have opposite signs, neither 0, and different distances; at most one one-side case, both below, never first; exactly three distinct cards, exactly one equal to `|a − b|`, the other two being the magnitude mistake and `answer + 1`; every card 1–10; at least one case starting above and one below; no two consecutive equal answers; across seeds the right card appears in each of the three positions.
- **Level 5, over 500 seeds and the authored round:** every twin is `−s` and in range; exactly one dock case, never first; at least two above and two below; four different nonzero distances; twin and friend landings share a side of the zig-zag.
- **Check and hints:** a scripted level-4 case (wrong card, the same card again, the other wrong card, Show a hint twice, then right) counts two misses, one hint and finishes the case; a level-5 tap on the friend's own stop is `ignore`, and at the dock the dock is `right`; `hintFor` is the answer in every state; at level 5, the supported finish after a third miss.
- **Layout:** `cardLayout` at the four views; cards at least 120×110, not overlapping each other, any landing, the request card, the home box or the guide's corner, and inside `view`.
- **Registry and how-to tests** pass with the new range and lines (the card's level-scoped steps, no "later levels" wording).

## Ghost finger, how-to card, registration

- **Ghost finger:** `autotouch()` taps the right card at level 4 (`hintFor`) and the twin's landing at level 5. Level 4's demonstration first taps the fish once to show the free replay.
- **How-to card** (`src/content/howto.ts`), steps added with level scopes: "Two friends wait at two stops; tap the card that says how many stops apart they are. The ride counts it out" `{ from: 4, to: 4 }`; "A friend in the lift has a twin just as far from the water on the other side; tap the twin's stop" `{ from: 5, to: 5 }`. The existing level-1–3 notes stay; add for 4: "A wrong card is one miss: the lift rides it out, counting to the water and on" `{ from: 4, to: 4 }`; for 5: "A friend at the water is their own twin" `{ from: 5, to: 5 }`. The goal stays as written.
- **Registration:** `levels` and `describeLevel` read the new plans; bands unchanged (school only). Skills gain `'distance'` and `'opposites'` (skills are free strings in `GameModule`; Opposites already uses `'opposites'`).
- **Co-play:** at level 5 the grown-up names a stop and she names its twin, then swap. **Off-screen:** unchanged.

## Check tier

New levels with one new interaction (the number cards) in an existing game: typecheck and unit tests (the properties above plus registry and how-to tests); one scripted play through `browser-check.mjs`'s `sea-lift` case extended to level 4 (one wrong card, one hint, the dimmed card) and level 5 (the dock case, one wrong stop); one portrait screenshot of level 4's card column beside the shaft; `fingerdemo` at levels 4 and 5; `npm run build`, because the voice and how-to files change.

Device and person checks stay open: whether a school child reads the numerals on the cards as counts of stops rather than stops, whether the two-part count ("three to the water, and four more") helps, and how the iPad says the new lines.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** Decision 1: for the level-4 card table, the building session checks it against reputable sources (museums, universities, government science agencies, established curricula), lists them here and records the check in its VERIFICATION entry; no outside reviewer is needed. Decisions 2–4 keep their defaults; the build no longer waits on a named educator.

Each has a default; the build waits only on the educator's read in decision 1.

1. **The level-4 card table.** Default as [above](#the-level-4-card-table-for-the-educator): the magnitude mistake and the both-ends mistake, with one same-side case a round. Waits on the mathematics educator (study decision 8), who is not named yet.
2. **Words for below zero at levels 4–5.** Default: still "N below the water"; the study's decision 6 would allow "negative three" or "minus three" from level 4, but no device speech check has been done and the cards carry no sign, so nothing here needs the word.
3. **Twin wording.** Default "twin". Alternative: "partner" or "mirror friend", if a grown-up finds "twin" confusing beside identical-looking friends.
4. **Bands.** Default: school 1–5, no change. Levels 4–5 are upper-school content inside the school band; a separate window waits on the study's decision 2 with levels 6–7.
