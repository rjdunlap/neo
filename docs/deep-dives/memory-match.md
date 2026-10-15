# Memory Match deep dive

*ID `memory-match` · preschool, pre-K, school · levels 1–11 on 2026-10-11 · `codex/memory-match-deep-dive` ([PR 153](https://github.com/rjdunlap/neo/pull/153))*

## The game today

Research snapshot below; since then spoken support (slice 1) and three seeded picture families at levels 1–5 (slice 2, [PR #264](https://github.com/rjdunlap/neo/pull/264)) and a fourth, vehicles (2026-10-14), are built, as are the dot arrangements at levels 6–7 (2026-10-14).

Tap two hidden cards; matching pairs stay face up until the whole board is finished. The fun is finding a remembered friend. The skill starts as visual matching and remembering locations, then becomes recognizing two representations of the same thing. One shell-awarded sticker finishes the board, including with help. Nothing is timed.

The source read for the original research session was `src/games/memory-match/index.ts`, `logic.ts` and `logic.test.ts`, the how-to, voice script, couch catalog, and the game's GAMES, IDEAS and roadmap entries. These are code-reading findings, not newly played rounds.

| Level | Plan | Current band windows | What she decides |
| --- | --- | --- | --- |
| 1 | Two picture pairs, four cards | preschool | Where the two identical pictures are |
| 2 | Three picture pairs, six cards | preschool | The same, with another pair |
| 3 | Four picture pairs, eight cards | preschool, pre-K | The same |
| 4 | Six picture pairs, twelve cards | preschool, pre-K | The same |
| 5 | Eight picture pairs, sixteen cards | preschool, pre-K | The same; the first five levels grow only by memory load |
| 6 | Numerals 1–4 and dots, eight cards | pre-K | Which quantity the numeral names |
| 7 | Numerals 1–8 and dots, sixteen cards | pre-K | The same with larger quantities |
| 8 | Shape and color, sixteen cards | pre-K, school | Both attributes must match: four shapes in red and blue |
| 9 | Capital and lowercase, sixteen cards | pre-K, school | Which letter is the same in its other case |
| 10 | Number words one–ten and numerals, twenty cards | school | Which written forms name the same number |
| 11 | Half, quarter, three quarters, six cards | school | Which equal-part picture the fraction words name |

**Pools.** Picture levels take the first N entries of eight fixed color/shape combinations; circles and stars recur in different colors. Level 8 uses circle, star, square and heart, each in red and blue. Number levels always use 1–4 or 1–8; level 10 always uses all ten number words. Only the eight letters in level 9 are drawn from a larger pool (26 capitals, shuffled once per round). Level 11 always uses the same three fractions of a 64-unit square. `makeDeck` gives every pair exactly one card of each side and shuffles positions; it does not select content. Sticker and hub art are a fixed heart card and star-backed card, independent of the deck.

**Support and accounting.** The first card immediately joins `seen`; the second joins after the comparison and wait. An unsuccessful pair counts as one miss only if the first card's partner was already seen. Unseen exploration is free, although it still gets the generic boing and reminder. Two known mismatches since a match glow the last first card's partner; a match clears the glow and resets that counter. The hint line says its friend was seen. This rule should remain inspectable and deliberate, including its dependence on which card is chosen first. `nextCard` drives both bots from seen positions; tests cover completion across deck sizes and seeds without a penalized mismatch.

**Couch.** Catalog demo level 2, trip levels 4 then 5, band preschool. The shared face-off alternates after an unsuccessful pair; a match earns another turn and one pair point. Automatic hints are absent in face-off. `control()` and `autoplay()` move a grid ring. Appending island levels does not change this catalog, trip rules or course versions. The proposed family-table split-seat mode is a separate, decision-dependent slice.

### Known gaps and checks to plan

1. **Level 10 word legibility needs review.** Four columns and five rows yield `(768 - 170) / 5 - 16 = 103.6` logical units in the base view; the width formula at 1024 is 180, so it does not constrain them. The twenty-card board narrowly fits the target minimum. Preserve a computed minimum of 100 and verify all supported logical views before choosing a new layout or adding cards. Do not solve legibility by increasing the board. The larger issue is the effective word size: 38 × 103.6 / 140 is about 28 units.
2. **How-to leakage.** The number-word step is `{ from: 10 }`, so it also appears for fractions at 11. Bound it to 10 and the fraction step to 11 before appending another mode.
3. **Reading support is incomplete.** Only fraction cards speak their contents; number words and uppercase/lowercase do not. Tapping an already-open first card currently does nothing, so it cannot replay a label. Add free spoken labels and replay without turning a replay into another choice, miss or hint. Listening-supported matching is not independent reading.
4. **A hint can become stale.** After a glow, an unrelated exploratory pair can select a new glowing partner without charging another hint; the line can claim a partner was seen when this newly selected partner was never seen. Plan a rule test tying the hint message to the evidence, rather than counting exploration as a mistake.
5. **Touch-down behavior already exists.** `onTap` invokes the choice on pointerdown and the face becomes visible immediately. Preserve that response and palm rejection when adding replay; check double taps do not pick the same card twice.
6. **Current tests do not inspect plans or visual equivalence.** Extract plans and content selection to `logic.ts`; add fraction bounds/equal parts, unique identities, plan windows, layout minima, and support-selection properties. Do not claim the tests read here passed this session.
7. **People and device checks.** Letterforms such as I/i and font-dependent a/A, word legibility, actual number/fraction speech, comfortable mismatch viewing time, and the preschool sixteen-card load remain unjudged. Keep larger-board practice optional through the grown-up level picker; do not call more cards deeper learning.

## Similar games

Six references were inspected on 2026-10-11. The proposals in the next sections are design inferences, not efficacy claims. Official rules and product pages were used where available; the two App Store descriptions were available in search results but their subsequent direct opens failed, so their details are provisional.

| Game | Kind | How progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Ravensburger first memory rules](https://www.ravensburger.org/spielanleitungen/ecm/Spielanleitungen/21204%20anl%201740710.pdf?ossl=pds_text_Spielanleitung) | Physical classic for young children | Multiple ways of playing with the same picture cards; naming revealed pictures supports familiarity | Familiar pictures and naming while revealing; vary play with a small deck | Reflex play and competitive grabbing |
| [Farmyard Heads and Tails](https://www.orchardtoys.com/products/farmyard-heads-and-tails-game) | Toddler physical matching | Face-up pairing can become hidden-card play; two parts form one animal | A visible matching start, then hiding; two related images can be a pair | Importing twelve pairs into a toddler screen; a winner requirement |
| [Shopping List](https://www.orchardtoys.com/products/shopping-list-game) | Picture memory and collecting | Find familiar groceries on a visible list; naming and remembering locations support collecting | The matching action has a small purpose: fill a basket | A race to finish and a long shared hidden board |
| [Zingo! 1-2-3 rules](https://legacy.thinkfun.com/wp-content/uploads/2015/09/Zingo123-7703-IN02.pdf) | Educational number matching | Counting and addition faces; free exploration before play | Change the representation or rule, rather than only adding tiles | First-to-call advantage, bingo competition and simultaneous speed |
| [Memory Match: Memory Lessons](https://apps.apple.com/us/app/memory-match-memory-lessons/id6449814564) | Current touch app; search description only | Board sizes, sound mode, local two-player turns, remembering lessons and helpers | Explicit location strategies and replayable help | Paid/limited helpers, rankings, online play and board-size inflation |
| [Match Sounds: Music Ear Puzzle](https://apps.apple.com/us/app/match-sounds-music-ear-puzzle/id1384334794) | Current audio matching app; search description only | Hidden sounds replace pictures; boards grow | A pair can be recognized by listening | Its advertised timer, brain-training claims and imported audio clips |

**Learning reference points.** [K.CC.B.4](https://www.thecorestandards.org/Math/Content/K/CC/) concerns connecting numbers and quantities; it motivates the existing numeral/dot cards, not a claim of alignment. [3.NF.A.1 and A.3](https://www.thecorestandards.org/Math/Content/3/NF/) motivate equal parts of a stated whole and equal values represented differently. [1.MD.B.3](https://www.thecorestandards.org/Math/Content/1/MD/) motivates the proposed hour/half-hour bridge. These goals need manipulation in Duck Pond, Pet Kitchen and Clock Tower too. Matching alone does not establish a concept or a reading skill; publisher age labels do not establish this child's readiness.

## What makes sense here

Keep the two-card discovery and small satisfying pair reward. More quantity should mainly mean new code-drawn decks, different dot arrangements and selected vocabulary, with each board having exactly one partner per card. Existing picture levels remain available and their IDs and pins remain unchanged.

The arc is visible picture matching for toddlers, small hidden familiar decks for preschool, representation and two-attribute matching for pre-K, then time, quantities composed two ways and equal fractions for school. A later audio or changing-rule mode needs a separate definition before entering this linear ladder: it may be easier than its predecessor, and a broad attribute relation can leave unmatchable cards after a legal choice.

## Proposed ladder

### Fresh content inside existing levels

- **Picture decks, levels 1–5:** shapes, eight island friends (including Pip) and six fruits plus balloon/flower are built ([PR #264](https://github.com/rjdunlap/neo/pull/264)); eight vehicles (car, bus, truck, train, boat, plane, rocket, tractor) are built as a fourth family (2026-10-14). Select N distinct identities before creating pairs. The two faces of a pair share identity, not a renderer index; code-drawn art only. Name each picture on reveal and replay. At level 8 keep the shape/color cross-product rule separate: a themed picture must not obscure either attribute.
- **Dots, levels 6–7:** scatter, rows and five-frame arrangements; paired numeral and dots must not have an answer-specific common color. Rotate among curated arrangements with adequate spacing. Quantities stay 1–4 and 1–8. Test actual count and positions within card bounds.
- **Letters, level 9:** keep the 26-letter pool and seeded eight-letter selection. First speak the letter name, including on lowercase; do not infer a sound from its appearance. Review letterform distinctions with a person; no new font or alphabet in this slice.
- **Number words, level 10:** show five pairs selected from 1–10 per board, instead of always twenty cards. This is a proposed change to quantity at an existing saved level, not a new ID. It needs the developer's choice below. Selection must reach all ten words across seeds; never use board position or color as the match. If ten pairs are retained, use a layout and text treatment that prove target and word-fit minima without scrolling.
- **Fractions, level 11:** keep the three values and word cards; vary the square's orientation and which equal parts are shaded. A half always has two equal parts here, a quarter and three quarters four. Circle sectors can follow as a later art slice after equal-area rendering is inspected. Each round uses one stated whole and no decorative fill that could be counted as part of it.
- **Support first:** bounded how-to, spoken contents and free replay, accurate hint wording, extracted plans and stable icon/sticker art. For a nonmatching unseen pair, explain the revealed cards without implying that exploring was wrong.

### New levels on top

These are proposals. Preserve school minimum 8, preschool 1–5 and pre-K 3–9. Extend school maximum one implemented slice at a time, eventually to 14 if accepted. Do not move existing IDs or pins. Level 12 can be easier than level 10's reading board; accept that explicitly or wait for the shared level-order decision.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12 | Same time | school | Three pairs: 2:00, 4:30, 7:00 as analog and digital cards | Which display names the same time; the hour hand moves halfway for half past | Unknown exploration stays free; a known mismatch names both times; after two misses glow the known partner and replay its time | Three distinct normalized times; exactly one partner each; correct hour/minute angles; all faces fit and targets remain at least 100 | M: inspect Clock Tower's drawing before sharing a small clock helper; spoken time labels; `autotouch` remains pair-ID based; scoped card; portrait legibility; couch remains 4–5 |
| 13 | Same total | school | Three pairs: two groups of 2 and 3 counters with 5; groups of 1 and 3 with 4; groups of 3 and 3 with 6 | Count or combine two visible parts and find the total | As above; known mismatch explains the two groups and their total; hint shows counting across the groups | Totals unique per board; operands 1–5, totals at most 10; no equation without a pictured quantity; partner is keyed to value | S–M: group art within the card, total speech; build from numeral/dot mode; bot unchanged; different from Duck Pond's action because here both representations remain visible once revealed |
| 14 | Same share | school | Three pairs: 1/2 with 2/4, 1/3 with 2/6, 2/3 with 4/6, all rectangles of the same dimensions | Equal shares can use different numbers of equal pieces | Unknown choices are free; a known mismatch compares how much is shaded; hint overlays subdivision after two misses | Rational values equal within each pair and distinct across pairs; every partition equal-area; same whole dimensions; numerator within denominator | M: rational-value rules and fine partition art; spoken fractions; no fraction arithmetic; a device/person review before claiming readiness; pairs stay at three |

### Younger-band openings

**Toddler 1–1 is a ready-to-define candidate:** four familiar cards, the same hidden two-pair rule, each reveal named. Complete both pairs; unseen exploration remains free, and two known misses retain supported completion. Co-play: the grown-up names a remembered place and the child turns it. A four-card opening does not require another saved level or change ordering. Do not use levels 1–2 while describing both as four cards: level 2 has six. Add the band only after registry/land capacity checks and scoped how-to review. A child's tolerance for hiding and waiting remains a person check.

A fully face-up matching start is appealing from Heads and Tails, but making level 1 visibly different by band needs a clear support/accounting definition. Prefer the hidden 1–1 opening first; keep the face-up sketch below until the developer settles how such modes live in the ladder. Lap play is not proposed from existing level 1: choosing two hidden cards is not the same as patting a picture.

### Levels below level 1 (waiting on the level-order decisions)

| Sketch | First round and decision | Mistakes/help | Future rule proof and cost |
| --- | --- | --- | --- |
| Picture friends, toddler | Two face-up pairs; tap one picture then its identical friend | A visible nonmatch names both and permits retry; two misses glow its friend; both pairs end the round | Exactly one partner, no hiding or timed flips; same card views and bot, plus a visible-mode flag |
| Find its friend, toddler | One model already up, two candidate cards up; tap its match; two model requests | A nonmatch gets a gentle explanation and two-miss glow | Distinct candidates and unique answer; request flow differs from the hidden board |
| Peek and pat, lap co-play | One large back; any tap reveals a friend, names it, and invites another tap; three reveals finish | No wrong action, misses or hints | Every accepted tap progresses; seeded friend variety; no pending callback after leaving; this is cause and effect rather than memory |

No numeric IDs assigned: appending these easier rounds at the top would reverse adaptation. The third also overlaps Peekaboo Barn, so build there unless an actual card-play use warrants a separate mode.

### Left out on purpose

More than twenty cards, faster flip-back, a preview countdown, moving cards, mandatory memorization, match streaks and paid hints. Do not turn the five picture levels into a race. Audio pairing stays a sketch: it overlaps Jelly Drums and Sound Garden; only a defined listening distinction warrants it, and it must use synthesized sounds with free replay and silenced background music. Animal/home associations overlap Animal Snack and Habitat Helpers; do not duplicate them as vocabulary quizzes without a new decision. A changing color/category rule cannot reuse `pair` or `knownMismatch` blindly: several legal partners can strand the final cards, so it needs a remaining-board matching proof first. No family seat system, kept-deck save or journal source is required for this ladder.

## Decisions for the developer

1. **Level 10 board:** lean five pairs sampled from all ten number words, retaining saved ID 10 and vocabulary; alternative retain ten pairs with legible words and proven large targets. This changes an implemented level's quantity and needs an explicit choice.
2. **School extensions 12–14:** lean yes, as optional bridges to Clock Tower/Pet Kitchen and quantity composition, with three pairs each. Place the easier clock round with `order`. The existing roadmap question about representation bridges still applies.
3. **Toddler window:** lean hidden level 1 only (1–1), naming familiar pictures; six-card level 2 remains preschool. Face-up play and lap sketches wait on level-order/mode decisions.
4. **Optional family split-seat play:** follows the roadmap's placement/seat decisions. Keep the existing couch turn-taking unchanged; do not add co-play seats or progress attribution in these slices.

## Build slices, in order

Slice 1 and the familiar-picture part of slice 2 are built ([PR #170](https://github.com/rjdunlap/neo/pull/170), [PR #264](https://github.com/rjdunlap/neo/pull/264)); remaining content and levels are future sessions. The audit above records the source as it stood before the support slice.

1. **Built: words and guards at existing levels** ([PR #170](https://github.com/rjdunlap/neo/pull/170)). Plans, picture identities and labels live in `logic.ts`; the number-word/fraction how-to lines are bounded. Every reveal speaks its contents, and the first open card replays freely without changing the choice or counters. Unseen exploration names both cards neutrally. After two known mismatches, a seen partner gets one stable glow until a match clears it; unrelated exploration cannot move that hint. Deck sizes, bands, icon/sticker art and couch scoring/turns are preserved. Rule tests cover plans, labels, equal parts and hint evidence. Actual device pronunciation and legibility remain open.
2. **Built: familiar picture decks** (`codex/memory-familiar-decks`, [PR #264](https://github.com/rjdunlap/neo/pull/264)). Scope: levels 1–5 select the original shapes, eight island friends (including Pip), or six fruits plus balloon/flower, with seeded distinct identities and matching spoken labels. No level/band, deck-size, matching/accounting, couch/course, sticker/icon or save changes. Dot arrangements and vehicles remain separate.

   **Built 2026-10-14: vehicles** as a fourth seeded family at levels 1–5 (`VEHICLES` in `logic.ts`, `vehicleArt` in `art.ts`); no level, band or accounting change. **Built 2026-10-14: dot arrangements** at levels 6–7 (`dotLayouts`/`selectDotLayouts` in `logic.ts`): each numeral-to-dots card shows its quantity in one of several curated arrangements (two columns, dice-like scatter, rows, five-frame), deduped, one layout per pair from the seeded rng, one dot colour on every card; quantities stay 1–4 and 1–8, no level, band or accounting change. Tests check count, spacing and bounds for 1–8 and that selection is seeded and reaches every arrangement. Original plan: seeded selection and unique-identity tests; spoken names; stable sticker. Tier: content, typecheck/rule tests and one screenshot of new art; a deck-selection regression only if interaction changes.
3. **Decision: level 10 quantity and fit.** Implement chosen policy, prove 100-unit card minima and word fit in supported views; test selection coverage if sampling. Tier: existing interaction fix, filtered regression at 10 and its ghost finger; portrait look. Broaden to couchgames only if changing shared grid movement/layout affects the couch's 12/16-card boards.
4. **Ready after support slice: varied fraction square pictures at 11.** Rotations and equal-area shading masks, preserving exactly three values and pairs. Tier: content, typecheck/rule tests and one screenshot; circle sectors are a separate optional slice.
5. **Claimed definition only (2026-10-15): level 12 clocks**, `codex/memory-clock-definition`, worker `01a13f9a-cca2-7160-b0c5-dad091c65593`, dispatch `memory-clock-definition-20261015T124701Z`. Expected files: this dive, `docs/ROADMAP.md`, `docs/EXECUTION-QUEUE.md`, and verification/archive records. No code, other levels, bands, couch, saves or open decisions. Definition checks: local links and diff only; implementation remains a later slice. Original build brief: Define and implement the small clock face, three-pair selection, spoken contents and scoped how-to. Tier: new level, typecheck/rule tests, one top-level browser play and `fingerdemo`, portrait legibility; build only if shared rendering changes. Freeze couch levels.
6. **Decision: levels 13 and 14, one per session.** Composition first, then equivalent fractions. Tier: new levels, their rule tests, one new top-level play and ghost-finger run each; no larger boards.
7. **Decision: toddler 1–1.** After familiar art and words, update the band table, how-to and inventory counts; test registry and all land layouts without shrinking targets. Tier: younger-band opening, unit/registry/land tests; one four-card play if band support changes behavior. Add person/device gaps to the roadmap.
8. **Define later:** face-up entries after level ordering; audio matching after an overlap check; split-seat play after family-table decisions. No solver or persistent creation system ahead of those defined needs.

## Research session outcome

The original deep-dive session built nothing: research and ideation only. Updated this write-up, tracker, idea rows, roadmap and verification log. Links and `git diff --check` checked; no code, tests, build or browser play. Source inspection found support and legibility gaps; it did not establish child readiness, actual device speech or a new gameplay regression.
