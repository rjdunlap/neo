# Monster Munch deep dive

*ID `monster-munch` · bands lap, toddler, preschool, pre-K, school · levels 1–8 on 2026-10-17 · session `claude/dive-monster-munch` ([PR #549](https://github.com/rjdunlap/neo/pull/549))*

## The game today

A code-drawn monster on a beach gapes, chews, burps and shows what it has eaten in a tummy window. Cookies (and at 6, apples) sit on a wooden tray. The action is feeding; the learning purpose is quantity: one-to-one, counting out an amount, an order of two kinds, fair shares and what is left over. Counting Cove (`lands.ts`, with Duck Pond, Little Helpers, Pet Kitchen, Frog Hop and others). Code: `src/games/monster-munch/index.ts`, `logic.ts`, `logic.test.ts`, `art.ts`; [GAMES.md](../GAMES.md#monster-munch); how-to card `'monster-munch'` in `src/content/howto.ts`; voice lines `munch.*` in `src/content/voice-script.ts`. No couch entry; no journal entries; not in a story.

| Level | Plan (`MUNCH_PLANS`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | `tap`: 1 round, 6 cookies | lap 1–2 | Nothing to get wrong: tap a cookie and it flies into the mouth |
| 2 | `count`: 1 round, 5 cookies | lap, toddler | Drag (or tap in place) each cookie; the monster counts aloud; no misses possible |
| 3 | `each`: 2 rounds, 2 then 3 monsters, one spare cookie | toddler | Who still needs one; a second cookie to a fed monster is a miss |
| 4 | `exact` 1–4 with dots under the number, bell | toddler, preschool | When she has fed enough, then ring the bell; an extra is refused (a miss), an early bell is a miss |
| 5 | `exact` 3–7, number only | preschool, pre-K | The same from a numeral |
| 6 | `two`: 1–3 cookies and 1–2 apples | preschool, pre-K, school | Two counts at once |
| 7 | `share`: 2–3 per monster, 2 or 3 monsters | pre-K, school | Deal the whole tray fairly; checked when the tray empties, extras fly back; then tap how many each (three pads) |
| 8 | `leftover`: 1 to monsters−1 cookies left over, bell | pre-K, school | When no more can be shared fairly; then how many each and how many left (those go to the pet) |

**Content pools.** Two foods (`cookie`, `apple`), one monster body in three colours (`MONSTER_COLORS`: green, purple, orange), one beach backdrop, a tray of at most 10 (`TRAY_MAX`). Rounds vary only the amounts.

**Accounting.** Levels 1–2 have no misses. From 3, a refused food, a wrong bell, an unfair share or a wrong pad is a miss with a boing; the second miss in a round (or a question) says `munch.hint` and turns on a glow at the next useful thing (`hints++`).

**Level resolution, verified in `src/progress/difficulty.ts`.** The game uses a plain `levels()` function, so each band is numeric `min..max`. A `LevelRange` may carry an `order` (stepping follows it; a saved ID left out lands on the nearest listed ID) and `GameModule.entryLevels` lists easy high IDs that `landing()` sends to a band's easiest level when that band does not list them. So any appended ID below the top of the ladder needs an explicit `order` in every band whose `min..max` would otherwise swallow it, and an `entryLevels` declaration if a birthday could carry it into a band without it.

**Known gaps found reading the code (not fixed: docs-only session).**

1. **The card says the monster counts aloud when it does not.** The card's step for levels 1–2 says "it counts aloud" and for 4–5 "it counts aloud". Only `count` mode (2) says `count` per bite; `tap` mode says a random "Yum!" half the time, and `exact`/`two` (4–6) say nothing per bite.
2. **The level-7 card tells her to ring the bell.** `bell.visible` is false in `share` mode; the check runs by itself when the tray empties.
3. **"Let us count one monster together" counts nothing.** A wrong pad (`pick`) says `munch.each-no` and calls `mistake()`; no monster's tummy is counted.
4. **One hint line for every mode.** `munch.hint` is "Look at the glow!" whether the glow is on a cookie, the bell, a monster or a pad.
5. **Lap taps on the monster only giggle.** At level 1 a one-year-old reaches for the big friendly monster; tapping it beams and giggles but feeds nothing, so the cookie (55-unit hit radius, in a row on the tray) is the only way on.
6. **Lap and toddler rounds are single.** Levels 1 and 2 are one round each (6 and 5 cookies), then the celebration.
7. **Refusal does the counting for her at 4–6.** Because a full monster refuses another, she can keep feeding until refused and then ring. The refusal is a miss, so adaptation still sees it, but the decision "I have enough" is never hers to get wrong by overshooting. Kept as is (see [decisions](#decisions-for-the-developer)).
8. **No variety on replay.** One monster drawing, one backdrop, two foods.
9. **Wrong-drop silence.** A cookie dropped short of a monster floats home with no sound; at toddler levels that reads as "nothing happened".

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Cookie Monster Munch* (Atari / Children's Computer Workshop, 1983; [Wikipedia](https://en.wikipedia.org/wiki/Sesame_Street_video_games), modes from a [Giant Bomb](https://www.giantbomb.com/games/3030-3151/) search summary, page itself blocked) | Console maze | Carry cookies through a maze to a jar; a first mode has no time limit and ends with Cookie Monster eating the jar's cookies one at a time; later modes add a timer, a chase and a hidden maze | The payoff of watching every collected cookie eaten one by one, counted | The timer and the chase (the IDEAS *Munch Maze* seed is a separate navigation game) |
| *Feed the Monster* (Curious Learning / IRC; [Norad](https://norad.no/en/front/thematic-areas/education/innovation/eduapp4syria/feed-the-monster-available-in-25-languages), [store listing](https://skich.app/games/feed-the-monster-turkish)) | Touch literacy app | Collect monster eggs and feed them letters so they grow into new friends; collectable, evolvable monsters; free, no ads | A monster family met and kept through play, growing because she played, never because it was neglected | Evolution as a reward for accuracy; letters (not this game's axis) |
| *Moose Math*, Moose Juice ([App Store](https://apps.apple.com/us/app/moose-math-by-duck-duck-moose/id660345152), [Common Sense](https://www.commonsense.org/education/reviews/moose-math-by-duck-duck-moose); recipe-card and "remove extra" details from a review summary) | Touch app, ages 3–7 | Drag the right number and kind of fruit into a blender from a picture recipe; later recipes are additions and some ask to take extras out; finished levels build a town | Two-kind picture orders; a permanent town piece for a finished level, which fits the rework's permanent unlocks | Addition-card recipes (Duck Pond and Fruit Sums own sums) |
| *Toca Kitchen 2* ([Toca Boca parents' page](https://tocaboca.com/for-parents/toca-kitchen-2-ios), [Microsoft Store](https://microsoft.com/en-us/p/toca-kitchen-2/9wzdncrdlkxl)) | Touch toy | No levels: characters with their own tastes react to food (hot sauce, sour lemon, loud burps) | Big, funny eating reactions; the burp is a feature | Open cooking with no quantity; likes and dislikes (Animal Snack owns who eats what) |
| *My Very Hungry Caterpillar* (StoryToys; [App Store](https://apps.apple.com/app/id978304432)) | Touch toy, toddlers | Tap to hatch and feed; the more the caterpillar grows, the more activities unlock | A lap-friendly feed-by-tap with a body that visibly fills | Care obligations (sleep, feeding schedules) and in-app purchases |
| *Gracie & Friends*, Breakfast Time (GBH / First8 Studios; [activity guide](https://first8studios.org/gracieandfriends/guide/equipartitioning/lesson1/breakfast-time.html), [cookie share](https://first8studios.org/gracieandfriends/guide/equipartitioning/lesson1/cookie-share.html)) | Touch app with a classroom guide | Equipartitioning: share foods among a changing number of friends, then cut wholes; a reset arrow after a mistake; an adult prompts "are the shares equal?" | A varying number of friends per round; the reset; grown-up talk prompts for co-play | Cutting wholes (Pet Kitchen owns fractions) |
| PhET *Mean: Share and Balance* (search summary: a [teacher's write-up](https://freetech4teach.teachermade.com/?p=1191) describes levelling water cups; the sim page did not render here, any cookies/plates screen is **recalled**) | Simulation, grades 6+ | Even out uneven amounts to find the mean | Evening out uneven tummies as an older rung (the IDEAS *Share Fairly* seed) | Statistics vocabulary below ages 8–10 |
| *Hungry Hungry Hippos* (Hasbro board game, **recalled**) | Physical, ages 4+ | None: race to swallow marbles | The joy of a gulping mouth, sound and a tally | The race against other players |
| Snack-time sharing at home (the game's own `offScreen` line) | Physical | Two plates, then three, then crackers that do not come out even | Dealing one each round the table, which is how young children share | — |

**Learning references.** [Common Core K.CC](https://www.thecorestandards.org/Math/Content/K/CC/) (opened): K.CC.B.4a "pairing each object with one and only one number name" (levels 2–3), K.CC.B.4b "the last number name said tells the number of objects counted" (4–5), K.CC.B.5 "given a number from 1-20, count out that many objects" (4–6). [3.OA.A.2](https://www.thecorestandards.org/Math/Content/3/OA/) (opened): interpret a quotient both as the number in each share and as the number of shares, which is what new level 11 adds beside 7–8. Frydman and Bryant, "Sharing and the understanding of number equivalence by young children", *Cognitive Development* 3 (1988), 323–339 (citation confirmed; the finding that young children share by dealing one at a time is **recalled**). The roadmap's elementary horizon for this group of games (`ROADMAP.md`, "Duck Pond, Monster Munch, Little Helpers…") names division with visible leftovers.

## What makes sense here

**The game's axis is quantity through feeding**: one each, exactly this many, two kinds, fair, left over. Neighbours own the rest, and this dive stays out of their way:

- **Who eats what** (food–animal matching, likes and dislikes) is [Animal Snack](animal-snack.md)'s axis.
- **Counting on / how many more** is Little Helpers' level 5 and Duck Pond's make ten; **equal groups** and partition without remainders are [Little Helpers](little-helpers.md) (its *Share the crowd* is gated as "here or left to Monster Munch").
- **Take away** is Duck Pond (levels 7–8, *Bye-bye ducks* at 12). **Fixed-size groups drawn with a loop** are Lasso Loops. **Fractions** are Pet Kitchen.

The [short-ladder audit](../archive/IDEAS-SHORT-LADDER-AUDITS-2026-10-09.md#short-ladder-audit-2026-10-09) left this game at 8 ("fair shares with leftovers is the right end"). That holds for *partitive* sharing. Two things are still missing and are squarely this game's: the other meaning of division (how many friends can each have two? 3.OA.A.2, with the leftover visible, as the roadmap's horizon says), and fair sharing of a two-kind tray, which joins level 6's orders to level 7's shares. Both reuse the existing feeding, bell and pads. The PhET-style *even it out* is real and fits, but at ages 8–10 it is a band-window call.

**Younger end.** Level 1 is the right kind of lap rung but asks a one-year-old to hit a cookie in a row; a bigger, three-bite entry where the monster itself is a target fits her now. Between toddler 3 (one each) and 4 (count out N) there is a gap: one each of two kinds, which uses level 3's dealing with level 6's orders at toddler size.

**Arc by band.** Lap: big bites, then tap-feed, then count along. Toddler: one each, one of each, then count out up to 4 with dots. Preschool: exact orders, two kinds. Pre-K: fair shares, leftovers. School: fair shares of two kinds, how many friends can eat, and (gated) evening out.

## Experience and presentation

- **First unsupported action:** at level 1, a tap on a cookie (after slice 1, on the monster too). Nothing to read, nothing to get wrong.
- **What makes it pleasurable:** the gulp. The food flies in, two munch sounds, crumbs, the tummy icon appears, and at the end a burp and "Excuse me!" (Toca Kitchen 2 shows how much the burp carries). Touch-down already answers on cookies (`onPick` tick) and the monster (giggle); slice 1 adds a soft "hm?" and a lean towards the cookie when a drop falls short, so no touch is silent.
- **Concrete art and sound example (slice 3):** at *Big bites* the monster's belly ellipse in `art.ts` scales 1.0 → 1.08 per bite with `ease.outBack`, the crumb burst grows, and the last bite plays a three-note pentatonic tummy rumble (`notes.ts`, low to high) before `sfx.burp()`. All `Graphics` and Web Audio, no new assets.
- **Variety without changing the rule (slice 2):** foods (cookie, apple, carrot, berry, cracker; any two at 6), monster looks (horns, one big eye, fuzzy back via the existing `puffs()`; five palette colours), places (beach, cave mouth, picnic blanket), tray arrangements and amounts. The rule and its tests stay food-agnostic.
- **Reasoning versus memory and motor:** everything she needs is on screen (the sign, the tummy window, the tray). Dragging is one object at a time, 40 units above the finger; amounts stay ≤ 10 so foods stay large. No speed anywhere.
- **Supported ending and replay:** the glow after two misses always leads to the next useful thing; a wrong pad counts one monster's tummy aloud (slice 1); every round ends fed and burping. The celebration's again/next buttons handle replay. Experiments are not misses: dropping short, tapping the monster and dragging and returning a food stay free.
- **Co-play:** one person feeds, the other speaks for a monster ("I want one more!"); at sharing levels each person can "be" a monster and say whether it is fair. Solo stays complete.
- **Person/device checks:** whether a one-year-old taps the monster or the cookie at *Big bites*; whether the refusal at 4–6 reads as playful or as rejection; whether counting aloud per bite keeps pace with fast feeding on device speech; whether the burp delights or startles.

## Proposed ladder

### Fresh content inside existing levels

- **Count every bite where the card says so** (slice 1): `tap` mode counts each bite, and `exact`/`two` count each food of its kind ("two cookies!") so the last number said is the amount (K.CC.B.4b). Fix the card's wording at 7 (no bell).
- **A wrong pad counts one monster** (slice 1): the first monster's tummy icons light one by one, counted, before she tries again.
- **Hint lines per target** (slice 1): `munch.hint.food` ("This one!"), `.bell` ("Ring the bell now!"), `.monster` ("Who still needs one?"), `.pad`.
- **Two rounds at 1 and 2** (slice 1): level 1 4 then 6 cookies; level 2 3 then 5. The bot already plays any count.
- **Foods, monsters and places** (slice 2): a `FOODS` pool of five, two kinds per round at 6, any one kind at 4–5 and 7–8; `orderWords` stays generic; monster variants and three backdrops by seeded RNG; the sticker draws from the same pool.
- **Wrong-drop answer** (slice 1): a short "hm?" and the nearest monster leans.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | **How many friends?** | school (`order` after 8) | A tray of 7 cookies; the sign shows "2 each" with two dots; one monster waits and a cave door beside it opens a new friend on each tap (up to 4) | How many friends can have two each: call a friend, deal two, repeat; ring the bell when another friend could not have two; then pads: "How many friends ate?" and "How many left over?" | A friend with one cookie when the bell rings, or a fed friend given a third, is a miss (extras fly back, as at 8); calling a friend with too few cookies left is not a miss: the friend looks at the tray and says "Not enough for me!" and goes back in (an experiment). Two misses glow the next useful thing (cave, a hungry friend, the bell, the pad) | Every round: 2–3 each, 2–4 friends possible, 0 to each−1 left over (zero allowed here, unlike 8), tray ≤ 10; the bot calls exactly the right number and never overfeeds; quotient and remainder pads hold the answer | Cave-door art and a `call` touch for the bot; four monsters on screen (today's layout stops at three; a layout check at four in portrait, and every monster's hit area ≥ 100 units); voice lines (`munch.friends`, `.not-enough`, `.friends-how`); one how-to step; school `order` |
| 12 | **Share two kinds** | school (`order` between 7 and 8) | 2 monsters; a tray of 4 cookies and 2 apples | Deal both kinds fairly; then "How many cookies each?" and "How many apples each?" | Checked when the tray empties, as at 7: unequal cookies or apples fly back, a miss; a wrong pad counts one monster's cookies (or apples) aloud | Every round shares both kinds evenly; each kind 1–3 per monster; tray ≤ 10; `munchTouch` deals each kind to the monster with fewest of that kind | Reuses 6's two-food tummy and 7's check; two pad questions; how-to step |

### Younger-band openings

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | **Big bites** | lap entry (`order: [9, 1, 2]`) | One monster, three big cookies (scale 1.4, hit radius 80) | Nothing to judge: a tap on a cookie *or on the monster* feeds the next cookie; the belly grows each bite; burp | No misses; taps on the background make the monster look there and giggle | Three cookies, all hit circles ≥ 100 units on screen in every view; the bot feeds all three | Belly scale and rumble in `art.ts`; `munch.big`; how-to step; `entryLevels: [9, 10]`; two rounds (3 then 3) |

### Easier entries and levels between existing ones

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | **One of each** | toddler (`order: [2, 3, 10, 4]`) | 2 monsters; a tray of 2 cookies and 2 apples, one spare of each | Give each monster a cookie *and* an apple | A second of the same food to a monster is refused (a miss, `munch.had-food`), like level 3; two misses glow monsters still missing something and the food they lack | Tray always has monsters+1 of each food; every monster ends with exactly one of each; the bot never gives a second of a kind | Reuses 3's dealing and 6's two-food tummy; `munch.each-kind`; how-to step |

**Band tables after slices 3–5** (convert `levels()` to a `BandLevels` table read with `rangeFor`): lap `{ min: 1, max: 9, order: [9, 1, 2] }`; toddler `{ min: 2, max: 10, order: [2, 3, 10, 4] }`; preschool `{ min: 4, max: 6 }`; pre-K `{ min: 5, max: 7 }`; school `{ min: 6, max: 12, order: [6, 7, 12, 8, 11] }`. `entryLevels: [9, 10]`, so a lap 9 carried to toddler lands on 2 and a toddler 10 carried to preschool lands on 4. A test walks a birthday from each band and asserts the landing is in the next band's order. Plans become keyed by ID (`munchPlan` indexes the array, so 9–12 append to `MUNCH_PLANS` in ID order; no renumbering).

### Left out on purpose

- **Who likes what** (a monster with favourite foods): Animal Snack's axis.
- **Already eaten some / how many more**: Little Helpers 5 and Duck Pond 10.
- **Too many! take some back** (Moose Juice's remove-the-extra): take away is Duck Pond's; a refused extra already shows "enough".
- **Cutting a cookie in halves**: Pet Kitchen.
- **Munch Maze** (IDEAS): a navigation game, not quantity; stays a separate idea.
- **Healthy versus treat** judgements: foods are just foods; nothing is scolded.
- **A hungry monster that waits for her, or eats less if she stays away**: no neglect, no obligations.

## Decisions for the developer

1. **Level 13 *Even it out* and its window.** Monsters start with uneven tummies (5, 1, 3); she moves cookies from one monster to another until all have the same; then "how many each?" (the fair share as an average, IDEAS *Share Fairly*, PhET). Lean: build it for school as the top of the order, since the band reaches 12 and moving between monsters is a new, satisfying action; the alternative is to wait for an older band.
2. **Refusal at 4–6** (gap 7). Keep refusal (a miss) or let her overfeed and have the bell hand extras back. Lean: keep it at 4 (dots) and 6; at 5 let the monster accept extras and give them back only when the bell rings, so "enough" is her call. Small change, but it alters accounting.
3. **Rework hooks.** The monsters as a creature family met here (a new look joins the collection after a first feast, permanently, through play, with supported completion reaching it); her companion at the table eating the leftovers at 8 and 11 (it already gets them, via `ctx.pet`); foods and places unlocked permanently as she plays. Lean: the companion at the table first, once the rework's companion art lands; collectible monster looks with the rework's unlock rules (RW05+). Never hunger, decay or waiting while she is away.

## Build slices, in order

1. **Truthful card, counted bites and a wrong pad that counts** (existing-game bug fix; gaps 1–6, 9): count aloud at 1 and 4–6, the level-7 card without the bell, `munch.each-no` lights and counts one tummy, hint lines per target, monster taps feed at level 1, two rounds at 1–2, the short-drop "hm?". Checks: typecheck, the rule tests, one filtered regression play (levels 1, 4 and 7, one wrong pad), `fingerdemo` at 1.
2. **Foods, monsters and places** (content in existing levels): the `FOODS` pool, two kinds per round at 6, monster variants, three backdrops, the sticker pool; rule tests that every food reads in `orderWords` and the tray fits. Checks: typecheck, rule tests, one browser play of level 6 and `fingerdemo` at 6.
3. **Lap entry 9 *Big bites*** with the `BandLevels` conversion and `entryLevels` (new interaction): belly growth, rumble, monster-tap feeding; the birthday-landing test. Checks: new-interaction tier (scripted play at 9 and 1, one portrait screenshot).
4. **Toddler 10 *One of each*** (new level on 3's interaction): toddler order `[2, 3, 10, 4]`. Checks: typecheck, rule tests, play of 10, `fingerdemo` at 10.
5. **School 12 *Share two kinds*** (new level on 7's interaction): school order gains 12 between 7 and 8. Checks: typecheck, rule tests, play of 12, `fingerdemo` at 12.
6. **School 11 *How many friends?*** (new interaction: the cave door, quotitive sharing with a visible leftover): school order ends at 11. Checks: new-interaction tier (scripted play at 11 and 8, one wrong bell, one hint, one portrait screenshot).
7. *(Decision 2)* Overfeed and hand back at 5.
8. *(Decision 1)* Level 13 *Even it out*.
9. *(Decision 3)* Companion at the table; collectible monster looks with the rework's unlocks.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links (`node scripts/check-links.mjs`) and `git diff --check` ran.
