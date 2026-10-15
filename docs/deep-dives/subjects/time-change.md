# Time and change: then and now, before and after, timelines

**Subject:** `time-change` · **Audiences:** L, T, P, K, S, U, M, G ([definitions](../subjects.md#the-audiences)) · **Date:** 2026-10-15 · **Session:** `claude/time-change-research`, [PR #385](https://github.com/rjdunlap/neo/pull/385).

Research and proposals only; no implementation. Recommend developing the notebook's existing **Timeline Trail** seed first. Its action is to hang one picture **before, between or after** the pictures already on a line, so the line grows one decision at a time. It starts in **the island's own made-up past** (the pet's egg, a sapling, the dock being built), so every order is authored and testable and nothing needs a historian before it ships. Its later levels add evidence inside a picture, things that **stayed the same**, an older thing that is fancier than the newer one, and an honest "both places fit". Its top case, **Island Archive**, is a deduction puzzle for upper-school children and parents. Real objects and dates come later and need review. Smaller follow-ups are **Attic Finds**, about what a found object was for, and two grown-ups' page cards. The [roadmap packets](../../ROADMAP.md#time-and-change-recommendations) are definitions to write before builds, not a new scheduled queue.

## Anchors and evidence limits

| Opened source | What was read and implication |
| --- | --- |
| [C3 Framework](https://www.socialstudies.org/standards/c3), NCSS 2017 revision, printed pp. 45–48 (Dimension 2, History) | **D2.His.1.K-2** "Create a chronological sequence of multiple events"; **.3-5** use a sequence to compare developments at the same time. **D2.His.2.K-2** compare life in the past with today; **.6-8** classify developments as *change and/or continuity*. **D2.His.4.K-2** compare past and present perspectives. **D2.His.9/10.K-2** kinds of sources and how they show the past; **.6-8** limits of the record. **D2.His.11.K-2** identify maker, date or place *from information within the source itself*. **D2.His.14.K-2** possible reasons; **D2.His.16.K-2** pick the more likely reason; **.3-5** use evidence to support a claim. C3 describes itself as ideas that help organize "the curriculum and content states select" (its introduction): a guide, not prescribed content |
| [England's national curriculum: history](https://www.gov.uk/government/publications/national-curriculum-in-england-history-programmes-of-study/national-curriculum-in-england-history-programmes-of-study), Key Stages 1–2 | KS1: an awareness of the past "using common words and phrases relating to the passing of time"; changes *within living memory* before events *beyond* it. KS2: a "chronologically secure" knowledge. Supports the order *own life → living memory → long ago* |
| [Colorado preschool social studies](https://www.cde.state.co.us/sites/default/files/documents/cpp/download/standards/prek_socstudies_in_high_quality_settings.pdf), History 1, "Change and sequence over time" | Preschool evidence outcomes: time words (past, present, future, before, now, later); select pictures showing past, present and future; sequence a simple set of activities; one example of change over time, *including their own growth*. Its inquiry question asks about events in the past of "an adult you know", which is inclusive wording to reuse. A state guide, not a Head Start indicator; the Head Start ELOF was not opened for this subject |

**What people can do with time (opened):**

- **Busby Grant and Suddendorf (2009)**, [*European Journal of Developmental Psychology* 6(6)](https://researchportalplus.anu.edu.au/en/publications/preschoolers-begin-to-differentiate-the-times-of-events-from-thro/), abstract read. Three-year-olds placed events from years ago further along a past timeline than recent events, but did not separate future events by distance. Four-year-olds separated daily from more distant future events. Five-year-olds separated all three distances in past and future. **Implication:** past before future, and near before far.
- **Tillman (2017)**, [*Constructing the Concept of Time*](https://escholarship.org/uc/item/4w67t91d), UC San Diego dissertation (with Barner), abstract read. Children aged 3 to 8 learn the *relative order* of time words (hour > minute; yesterday is past, tomorrow future) before their actual distances. **Preschoolers do not spontaneously lay time out left to right**; kindergarteners and adults do, and the linear map grows with schooling and cultural exposure. **Implication:** a left-to-right line is a convention the game must *show* (a pictured "long ago" end and a pictured "now" end, spoken), not assume. For the youngest, use a two-picture *which came first*, not a line.
- **Barton (2002)**, "Oh, That's a Tricky Piece!", *The Elementary School Journal* 103(2); [abstract via THEN/HiER](https://www.thenhier.ca/en/node/316.html) only. Children aged 6 to 12 in Northern Ireland put historical pictures in order and explained why. Knowledge of material life and their own experience helped. **Looking for progress** and anchoring-and-adjusting did not. **Implication:** if "newer looks fancier" always works, the game teaches the strategy that fails. Rounds need continuities and an older thing that is grander than its newer replacement.

**Limits.** No study was found of a game that teaches historical sequence to under-fives, or of tween or parent engagement with these proposals. The [tracker's tween evidence](../subjects.md#what-the-search-found-about-the-older-range-2026-10-14) gives hypotheses only. Barton's full text was not opened. The C3 codes are guides, not gates or a claim of alignment.

## What people can do: proposals by age

Starting points to observe, not age tests. Every instruction stays spoken and replayable; no step needs reading or real dates.

| Audience | Supported starting point and limit |
| --- | --- |
| L, under 2 | Shares "when you were little" with a grown-up over a real photo. No ordering task is supported; a then/now toy would just be a cause-and-effect reveal |
| T, about 2 | Little and big, before and after inside one short story (Story Steps' building stories). Ordering across distant times is not established |
| P, about 3 | Which of **two** pictures of the same thing came first (an egg and a chick). Order, not distance. No line yet |
| K, about 4–5 | Insert a third picture before, between or after two; then a short line with an explained left/right convention. Near and far future only after past order is secure |
| S, about 6–8 | Lines of four or five; use a visible clue inside the picture (D2.His.11.K-2); begin "stayed the same" (continuity) |
| U, about 9–12 | Classify change and continuity, resist the "progress" heuristic, accept two valid places when the evidence cannot decide, and point to the clue that proves a place (D2.His.16.3-5) |
| M, about 11–14 | Would choose the Island Archive case: a self-contained deduction with real challenge and no time pressure. Place it at `school`'s top levels through 12 and on the `grownup` shelf from 13; no new band |
| G | A cozy deduction puzzle for themselves, a describer–placer co-play role, and plain-HTML family cards about their own past |

## On the island today

Source audit of [GAMES](../../GAMES.md), the [notebook](../../IDEAS.md), `src/content/lands.ts`, `src/content/creations.ts` and `src/progress/save.ts`. This is not new browser verification.

| Built game or proposal | Reuse and boundary |
| --- | --- |
| **Story Steps**, toddler–school | Drags four pictures of one short story into order, with missing middles and a cause at level 8. **Any "put N cards of one story in order" round belongs here**, not in a new game. Timeline Trail differs by *inserting into a growing line across long spans* and by evidence and continuity |
| **Day by Day**, pre-K–school | Yesterday, tomorrow and the repeating week; deliberately ignores the device date. Months and daylight keep their own decision gates. Nothing here changes it |
| **Clock Tower**, pre-K–school | Clock time. Measuring time is not this subject |
| **Garden Grow**, **Life Story Lab** ([life-science study](life-science.md)) | Growth and life cycles over compressed time. Life Story Lab owns the life-cycle ribbon; Timeline Trail may *show* a growing tree as a clue, never teach its biology |
| **Timeline Trail**, notebook ([JumpStart table](../../IDEAS.md#new-ideas-from-jumpstart)) | "A clothesline of long ago and now … a candle, a lamp, a bulb", marked M plus review. This study keeps the clothesline and the identity and moves the real objects to a later, reviewed rung |
| **Floe Bridge**, notebook | Ordering by a stated rule, listing life-cycle pictures among others. A *rule* order, not a time order; no overlap beyond the drag |
| **Fossil Dig**, notebook | Layers: deeper is older. Belongs to `deep-time` |
| Stickers (`save.ts`) | Each sticker has an `at` timestamp, but a missing one repairs to 0. Creations keep one picture and one tune with a backup, not a history. See the decisions below before any personal timeline |

**Boundaries with other tracker rows:** candle → lamp → bulb and inventions spreading belong to `inventions`; homes, toys and clothes long ago to `daily-life-long-ago`; fossils and dinosaurs to `deep-time`. This subject owns the *thinking tools*: order, before/after, then/now, change and continuity, and evidence from a source.

**Gaps.** No built game asks about the past at all. Lap and toddler have growth stories but no "long ago". Upper school, the early teens and parents have nothing in history.

**Where it would live.** Story Grove holds Story Steps and is the nearest built land; Storybook Square remains a proposed zone. Adding a game to any land needs the `landLayout` capacity check, not smaller targets. Lantern Lake is the grown-up home if Island Archive registers there.

## Similar games, apps and unplugged play

Opened sources are linked; search excerpts are marked. Digital precedents are thin: one first-party design talk (Unpacking) was opened, and no reference game was played.

| Reference / kind | How progression grows | Borrow | Leave out / evidence limit |
| --- | --- | --- | --- |
| **Timeline** (Asmodee), card game, 8+ ([Major Fun review](https://www.majorfun.com/timeline/)) | One card at a time, before or after the cards already on the line; the line gets longer, so the comparisons get finer | **The insertion action** and a line that grows; each placement judged only against what is already there | Hidden real dates, race-to-empty winning, discarding wrong cards. Our wrong card slides back with its reason |
| **Unpacking** (Witch Beam, 2021), cozy puzzle ([GDC 2022 report](https://www.gamedeveloper.com/gdc2022/gdc-2022-unpacking-a-narrative-through-1-000-household-items)) | Seven life stages, each a new home; recurring objects and changing tastes tell a life without words | A life story told by **objects that recur and change**; no timer, no score, a calm finish | Adult relationship themes. Its Wikipedia and review details were search excerpts only |
| **Storyteller** (Benmergui, Annapurna, 2023), panel puzzle (search excerpts only) | Arrange characters in comic panels so the story matches a title; several solutions accepted | Accepting any arrangement that satisfies the goal | Hardest puzzles have no hints; mature themes |
| **JumpStart 3rd Grade: Mystery Mountain** (1999), already in the notebook | History questions, a time machine, points before travel | The time-visit framing, if any | The quiz show, points and gates; cited from the notebook, not reopened |
| **Then-and-now toy sorts** (Twinkl, Flip Education; search excerpts only) | Sort pictures of old and new toys into two groups | The two-group start for the youngest | A worksheet that rewards "old looks worn": exactly Barton's progress trap |
| **Walk around the Sun**, Montessori birthday ritual ([Guidepost](https://www.guidepostmontessori.com/blog/celebrating-a-montessori-birthday)) | The child carries a globe around a sun once per year of life, while a grown-up shares a photo and memory for each year; month labels for 3–6 | A family page card: one's own life as the first timeline (Colorado's "own growth") | A real candle near a toddler; the island has no photos or camera, so this stays off-screen |
| **Mystery objects**, Pitt Rivers Museum KS2 workshop ([session sheet](https://prm.web.ox.ac.uk/sites/default/files/prm/documents/media/learningfromobjects.pdf)) | Handle unknown objects, ask questions to work out their use, look at materials; at home, borrow objects from family | Attic Finds: inspect, guess, then see it in use, with **guessing never a miss** | Real cultural objects without review |
| **StoryCorps Great Thanksgiving Listen** (search excerpts only) | Students 13+ interview an elder for about 40 minutes and record it | Starter questions such as asking about childhood, for a page card | Recording (the island has no microphone); the assumption that every child has a grandparent |

## What fits, and what does not

- **Fits:** Timeline Trail as a new game, because inserting into a growing line, reading a clue and classifying continuity are not Story Steps' fixed-length story order. **A test before building:** if a level reduces to dragging four cards of one story into four slots, it becomes a Story Steps level instead.
- **Fits as levels, not games:** "stayed the same" and "both places fit" are Timeline Trail levels. A street-then-and-now *spot what changed* round is tried as a Timeline Trail level first, and becomes its own game only if spotting turns into the main action.
- **Fits as a small new game, later:** Attic Finds, if inspecting an object (turning, tapping three clue spots) stays the action. A version that only picks one of three answers is a quiz and does not qualify.
- **Fits the grown-ups' page:** a Walk Around the Sun card and a "When you were little" question card, both needing review.
- **Does not fit:** real dates or named leaders below school; a quiz of facts; progress as the rule; anything about war or conquest; a microphone, camera or photo upload; a personal timeline that reads the device clock or shows empty stretches between visits (that would be a soft absence signal, and Day by Day deliberately ignores the date).

## An answer for every audience

| Audience | First action | Deeper rung |
| --- | --- | --- |
| **L** | *None as a game:* no ordering is supported, and a then/now reveal would only repeat existing tap toys. Page card: look at a photo together and say "when you were little" | Same card, a second photo: "and now" |
| **T** | Existing Story Steps building stories (a tower grows) and Garden Grow | Story Steps level 2; nothing new proposed |
| **P** | Timeline Trail 1: two pictures of the pet's egg and the pet now; tap the one from long ago | 2: hang a third picture before, between or after |
| **K** | Timeline Trail 2–3, with the line's two ends pictured and spoken | 4: a clue inside the picture decides the place |
| **S** | Timeline Trail 3–4 | 5: a "still here" ribbon for what did not change |
| **U** | Timeline Trail 5 | 6–7: a fancy older thing, two valid places, point to the proof |
| **M** | Island Archive at `school`'s top level (through 12) | The same case on the `grownup` shelf from 13; no new band |
| **G, play** | **Island Archive**: six to eight undated island pictures whose overlapping clues allow one order or a stated set of orders | A second case where one picture really is undecidable and the answer is to say so |
| **G, play with** | Describer and placer: one person sees the new card and describes it, the other hangs it (co-play suggestion text) | Swap, and argue about a "both fit" card |
| **G, page** | **Walk Around the Sun** card (a paper sun, a globe or ball, one photo per year) | **When You Were Little** card: questions for "an adult you know", never assuming grandparents (both *need review*) |

## Candidates and priority

| Name | Fun action | Learning goal | Audiences | Effort | New infrastructure | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| **Timeline Trail** | Hang pictures on the pet's clothesline before, between or after; then play the line as a flipbook and watch the place grow | Sequence, then/now, evidence in a source, change and continuity (D2.His.1, 2, 11, 16) | P–U; G via its case | M | None: drag, `onTap`, code-drawn scenes | **1** |
| **Island Archive** (Timeline Trail case) | Order undated pictures from overlapping clues | Reasoning from evidence and the limits of the record (D2.His.10.6-8) | U, M, G | M | A clue-constraint checker in `logic.ts` | 2 |
| **Attic Finds** | Turn over a made-up island object, tap three clue spots, guess its use, then see it in use | Questions about a source (D2.His.12.K-2), materials | P–U | M | None | 3 |
| **Walk Around the Sun** card | Off-screen family ritual | One's own growth as the first timeline | L–S, G | S | Page text only | 4, after review |
| **When You Were Little** card | Ask an adult you know about their childhood | Living memory, perspectives (D2.His.4.K-2) | P–M, G | S | Page text only | 4, after review |
| **Real things then and now** (Timeline Trail rung) | The same line with real everyday objects | Material history, which Barton found children use well | S–M | M | Content review | Later; coordinate with `inventions` and `daily-life-long-ago` |

## First game's proposed ladder: Timeline Trail

**Scene.** A clothesline between two posts. The left post carries a faded, soft-edged picture and the spoken words "long ago"; the right post carries the island as it is today, with her pet, and the word "now". The pet says the convention every round until level 4 (Tillman: the direction has to be taught). Pictures are code-drawn scenes of **three island places across their own made-up history**, each with four or five stages: the pet's egg → hatchling → now; a sapling → young tree → big tree with a swing; an empty shore → a little dock → a dock with a boat shed and a lantern. A finished line **plays as a flipbook**: the place grows in front of her. That is the fun. When a line holds two places (level 4 on), the flipbook plays each place's strand in turn along the shared line, so a clue shared between them (the small tree behind the dock) lights up in both.

| Level | Bands (proposed) | What she does | Decision added |
| --- | --- | --- | --- |
| 1 | preschool, pre-K | Two pictures of one thing; tap the one from long ago and it flies to the left post | Order of two |
| 2 | preschool, pre-K, school | A line of two; drag a third picture into one of three glowing gaps | Insertion |
| 3 | pre-K, school | Build a line of four, one card at a time; each card is checked against the cards already hung | A growing line |
| 4 | pre-K, school | Two places share a line: the dock picture shows the tree in the background, still a sapling, so it hangs early | A clue inside the picture (D2.His.11.K-2) |
| 5 | school | A "still here" ribbon under the line takes things that are the same in every picture (the big rock, the bread oven); one round's older merry-go-round is grander than the bench that replaced it | Change and continuity; resisting "newer is fancier" (D2.His.2.6-8; Barton) |
| 6 | school | One card fits two gaps because nothing in it tells; both are accepted, and the pet says "we can't tell, both fit" | The limits of the evidence (D2.His.10.6-8) |
| 7 | school | After hanging, tap the part of the picture that proves the place | Claim from evidence (D2.His.16.3-5) |
| 8 | school top; `grownup` registration to decide | **Island Archive:** six to eight pictures, clues that overlap (a roof repainted, a boat arrives, the tree grows), one order or a stated set | Deduction across many clues |

### Rules, support and completion contract to define

- **Rules in `logic.ts`.** Each place is an authored list of stages with a hidden index; continuity items are identical in every stage. A card's valid gaps are the ones its index allows given the cards already hung. At clue levels, tests check that every card's valid gaps are decided by a visible clue, except level 6's deliberately undecided card, which must have exactly two. Island Archive's checker accepts every order consistent with the clue constraints. Tests prove that each board is solvable, that every hint points to a valid gap or clue, and that a progress-only heuristic (always place the more detailed picture later) **fails** at least one placement per level 5 round. That last test enforces Barton's warning.
- **Mistakes.** A card dropped in a wrong gap slides back with a boing and its reason ("the tree here is still small, so this picture is from long ago"). Two misses on the same card glow its gap and count one hint. Looking, replaying the line and hearing a card's description are free. Level 6's second valid gap is not a miss. Level 7's tap on a wrong spot repeats the question gently.
- **Completion.** All cards hung, then the flipbook plays; one sticker, help or not. A how-to card per level, a ghost-finger `autotouch()` that drags a card to its gap, voice lines in `voice-script.ts`, 100-unit cards and gaps that still fit the line in portrait (a line of four or five, wrapping into two rows if needed).
- **No real dates or facts** in levels 1–8. The real-object rung is a separate, reviewed definition.

## Island Archive: the older and family case

Six to eight pictures from the island's archive box, none dated. Clues overlap: the lighthouse has a red roof in three, then a blue one; the ferry appears only once the dock exists; the tree's swing is in two; one picture shows the lighthouse being painted. One order fits, or a stated small set where a picture is honestly undecidable and the right answer is to place it in either. There is an undo, free inspection by zooming a picture, and a supported finish that glows the next constrained card after two misses. Its appeal to 12- and 13-year-olds and parents is untested; it is the M answer and the G "play" form, with no timer and no score beyond the sticker.

## Attic Finds: a bounded follow-up

A made-up island object (a butter churn-like crank, a pet-sized lantern, a hand-wound music box) sits in the treehouse attic. She turns it and taps three glowing spots (a handle worn shiny, a crank, a little door), each of which the pet describes. Then she picks which of three pictures shows it in use, and the object comes alive doing it. Guesses before the pick are exploration, not misses. It stays fictional until a reviewer approves real objects, and becomes a new game only if inspecting stays central.

## Experience and presentation

The long-ago end is soft and sepia-tinted in palette colors and the now end is bright, so the direction is visible without reading. The flipbook payoff animates the place stage by stage with a soft page-turn sound on pentatonic steps. Use the island's existing music style; nothing here makes music. The pet holds the clothes pegs. A card being dragged lifts and sways like washing. No clock, calendar or date appears anywhere in the first eight levels.

## Decisions for the developer

- **Who reviews real-world history content,** and when may a real-object rung (candle, lamp, bulb) begin? This also gates the `inventions` and `daily-life-long-ago` sessions.
- **A personal timeline from stickers?** Stickers carry `at`, but old saves repair it to 0, and a dated strip would show the gaps between visits, which cuts against "nothing waits". Lean: no, unless it shows order only and never dates or gaps.
- **Land.** Story Grove (built, capacity check needed) or the proposed Storybook Square.
- **Island Archive's registration:** one case at `school`'s top levels and the same case on the `grownup` shelf, or one of the two.
- **The page cards:** a named reviewer for the wording, especially family-structure inclusivity and the candle in the Montessori ritual (lean: a paper sun).

## Build slices, in order

1. **Define Timeline Trail 1–4** (docs packet): the three places' stage art, gap rules, speech, how-to steps per level, ghost finger, both layouts and the land capacity audit.
2. **Build levels 1–3** with rule tests (insertion validity, solvable boards, hints that lead to a gap). New game tier: one scripted play and one portrait screenshot.
3. **Add level 4**, a clue inside the picture, with the test that every clue decides its card.
4. **Add levels 5–6:** the continuity ribbon, the counter-progress card with its failing-heuristic test, and the two-valid-places card.
5. **Add level 7**, pointing at the proof.
6. **Define and build Island Archive** after the registration decision.
7. **Write the two page cards** after a named review.
8. **Define Attic Finds** with fictional objects.
9. **Real things then and now**, only after a reviewer, coordinated with the `inventions` and `daily-life-long-ago` sessions.

## What was built and what ran

Docs only: this study, the tracker row, the notebook's Timeline Trail row, the roadmap packet and a verification entry. Relative links and `git diff --check`. No game, band, card or engine work; children's and parents' reactions, independent understanding and transfer remain open.
