# Mystery Friend: Photo Safari levels 14–15 (definition)

Defined 2026-11-16 as slice **SL5** of the [speaking-and-listening study](../deep-dives/subjects/speaking-listening.md#build-slices-in-order), from the notebook's [Mystery Friend seed](../IDEAS.md#how-the-research-lands-on-rows-already-here) and the study's [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#speaking-and-listening-recommendations). This page is docs only. The build is one new-interaction slice (two levels), queued in [READY](../READY.md). Every open call below has a default the build can use.

**Fun action and purpose:** a visiting friend has picked one meadow animal for a secret photo; the photo lies face down in its thought bubble. She taps a picture question ("Is it sleeping?", "Is it by the tree?"), the friend answers yes or no, and the animals that don't fit walk to the edge and sit down. When one is left it sparkles, and her tap takes the photo, which flips over to match. The learning goal is **asking questions that narrow** (CCSS SL.1.3, ask and answer questions to gather information): a question about a feature several friends share sends several away at once, where naming one friend ("Is it you?") tests only one. That is the difference between *constraint-seeking* and *hypothesis-scanning* questions in the notebook seed (Mosher and Hornsby 1966, **recalled**) and in Ruggeri and Lombrozo 2015 (a **search summary** of the abstract, as the study labels it): questions shift from guessing one answer to narrowing the set between about 7 and 11. Nothing here establishes that the game teaches that shift. **No new source was opened for this definition.**

## Overlap and host

Three built rounds sit close by. Each puts her on a different side of the question:

| Built round | Who holds the information | Her action |
| --- | --- | --- |
| [Who Am I?](who-am-i.md) 1–3 | The pet gives a clue | She taps away friends the clue rules out (the listener) |
| Peekaboo Barn 15, *Guess who!* | The pet gives two clues | She finds the one friend with both (the listener) |
| Photo Safari 10–11, *Tell me which / both* | She sees the sparkly target | She tells the pet with picture chips (the speaker) |
| **Mystery Friend (this page)** | The friend knows; she does not | **She chooses the question** (the asker) |

The new action is choosing what to ask, so this is a new interaction. **Default host: Photo Safari, levels 14 and 15.** Its meadow already has the attribute data (each friend's animal, doing word and place), the chip tray and its icons, the visiting friend with a thought bubble (level 10), the thumbs art (level 9) and the photo payoff. A question is a level-10 chip, so no new picture vocabulary or art is needed. The notebook's version with hats, bows and colours would need new accessory art and a new game; it stays a later option ([open decision 1](#open-decisions)).

The notebook's first rung (a grown-up asks and the board shrinks) is the Who Am I? action, so it becomes a **co-play line**, not a level: "Take turns: one of you picks an animal secretly, the other asks 'Is it sleeping?' questions." It is added to Photo Safari's `coplayHint` (one sentence after the current one) in the build.

## Bands and level IDs

Levels 12 and 13 are taken (the toddler and lap entries), so the new IDs are **14 and 15**. Both are **school only**. The study lists SL5 for K–U (about 4–12), and the notebook for pre-K to school; at runtime ages up to 12 are `school`, and a pre-K opening of level 14 waits until a child has played it ([open decision 2](#open-decisions)), as level 10's did. The school order becomes `[4, 5, 6, 7, 8, 9, 10, 11, 14, 15]` with max 15; 12 and 13 stay out of school's order. No saved level or pin is renumbered.

| ID | Name (`describeLevel`) | Friends | Questions offered | The step |
| --- | --- | --- | --- | --- |
| 14 | Mystery friend: tap a picture question, and the friends who don't fit step away | 4: two doing words × two places, one friend each | 4 chips (both doing words, both places) | Every first question halves; the second question has one useful kind and one useless kind |
| 15 | Best question: which picture question sends the most friends away? | 6 (all six animals): two doing words × three places, one each | 5 chips (two doing words, three places) | Questions differ: a doing word splits 3/3, a place 2/4, naming one friend 1/5 |

Each round has **four mysteries** (`photos: 4`); each mystery is a fresh scene and secret. Swimming is excluded (it would tie a doing word to the pond, as levels 5 and 7 exclude it); the pond may still be a place.

## The model (`logic.ts`)

The Photo Safari solver is reused unchanged: `Sighting`, `Chip`, `fits(chips, sightings)`. New, small and pure:

- `MYSTERY_LEVEL = 14`, `BEST_LEVEL = 15`, and two plans `{ mode: 'mystery', photos: 4, animals: 4 | 6, best?: true, name }` added to `PLANS_BY_ID`. `SafariMode` gains `'mystery'`.
- `makeMysteryScene(plan, rng)`: pick distinct animals, two different non-swimming actions and two (level 14) or three (level 15) different places, and deal every action × place pair to exactly one friend; `target` is the seeded secret. Because the pairs are all different, **doing and place questions alone can single out every friend**.
- `mysteryChips(scene)`: the scene's doing words and places as `Chip`s, in a fixed order (doing words first, then places in `SPOTS` order) so the tray never reshuffles between mysteries. Name questions are **not chips**: tapping a friend asks "Is it you?" (below), so `Chip` gains no `animal` kind.
- `answer(chip, scene) = fits([chip], [secret]).length === 1`: the friend's yes or no is always the truth about the secret.
- `split(chip, remaining)`: `{ yes, no }`, the indices of the remaining friends that fit and that don't. After an answer, the remaining set becomes `yes` or `no`.
- `unhelpful(chip, remaining)`: true when every remaining friend fits it or none does (the answer is already known, so nobody leaves).
- `bestQuestions(chips, remaining)`: the not-yet-asked chips that are not unhelpful, with the smallest `|yes − no|`. Ties are all best.
- `MysteryPlay` state: `remaining`, `asked` (chip → answer), `unhelpfulCount`, `misses`, `hints`, and pure transitions `ask(play, chip)` and `guess(play, i)` that return an outcome the scene speaks and animates (`'narrowed' | 'unhelpful' | 'repeat' | 'found' | 'wrong-guess' | 'not-it' | 'snap'`).
- `botMove(play)`: the first best chip; when one friend remains, that friend.

## Screen and controls

Reuse level 10's layout and parts; nothing is new art except a face-down polaroid back.

- **The visiting friend** stands top right at (`w − 110`, 250), as at level 10, with its thought bubble holding a **face-down polaroid** (the polaroid frame with a question mark on its back). `eventMode = 'none'`. When the mystery is solved the polaroid flips (scale-x tween) to show the found friend.
- **The meadow** uses Tell's raised ground, `min(0.78 h, h − 200)`. Level 14 uses level 7's two shared places (x at 0.30 and 0.76 of the width). Level 15 needs **three shared places**: `sightingPositions` grows a three-place case at 0.18, 0.50 and 0.82 of the width, two friends each, about ±60 units apart. At the narrowest view (phone upright, 768 wide) that keeps neighbouring friends about 120 units apart; a rule test pins it.
- **The tray** reuses Tell's chips (140 × 120, the same icons and words, touch area `Rectangle(-75, -65, 150, 130)`, dip on touch-down, the chip's word echoed with `safari.chip`). There is **no Tell button**: tapping a chip asks it. Landscape: one row (four chips are 608 units wide, five 764), centred between x 150 and `w − 40`. **Portrait or any view narrower than 900 units: two rows**, two over two at 14, three over two at 15, bottom rows at `h − 78` and `h − 218`, so nothing shrinks below 100 units. The ground lifts by 140 when the tray has two rows.
- **An asked chip** greys and wears a small thumb (up or down, from level 9's art at chip scale) and stays in place. Tapping it again repeats its answer and counts for nothing.
- **Friends who don't fit** walk a few steps toward the nearest edge and sit, at 0.5 alpha with `eventMode = 'none'`; they stay in sight, so she sees the group shrink. The next mystery brings them all back.
- **Tapping a standing friend** asks "Is it you?" (nearest-body taps, as now). A yes when one friend remains takes the photo. The busy guard of level 10 blocks taps while friends walk.

## Answers, unhelpful questions and accounting

Free questions are explorations, never wrong answers (AGENTS: experiments are welcome). Only guessing a friend among several can be a miss.

- **A useful question** (it splits the remaining friends): the friend answers ("Yes, it is sleeping!" or "No, it isn't by the tree."), thumbs on the chip, the friends who don't fit step away. At level 15, if a strictly better split was available, the pet adds one neutral note after the walk ("Two went home. A doing word could send three!"), at most once per mystery. Never a miss or a hint.
- **An unhelpful question** (everyone left fits it, or no one does): the friend still answers truthfully, then the pet says why nothing moved: "Everyone left is by the tree, so nobody goes home. Try a question that only some of them fit." Never a miss. **The second unhelpful question in one mystery** makes the pet suggest and glow the best chips; that glow is **one hint** (the help the step rule should count). Unhelpful chips stay offered, so the experiment stays available.
- **Tapping a friend while three or more stand:** if it is the secret, it is found (the photo is taken; lucky, not a miss). If not, it is **one miss**: a gentle boing, the friend steps away, and the pet hints: "Not me! A picture question can send lots of friends away at once." Two misses in one mystery glow the best chips (one hint).
- **Tapping a friend while two stand:** a fair guess, never a miss. If wrong, the friend steps away: "Not me, so it's the other one!"
- **One friend left:** it sparkles (level 10's gold star), and a tap anywhere on it takes the photo. The polaroid flips, the album gains the photo, and the next mystery begins.
- **The help button** at any time glows the best chips and counts one hint.

`ctx.finish({ misses, hints })` after the fourth photo: one sticker, with or without help. With these rules, a smooth round (at most one miss, no hint) is one where she mostly asks questions that split; a struggling round (four misses or two hints) is one of repeated guessing or repeated unhelpful questions. Neither depends on luck, since a lucky guess is never counted against her.

## Voice lines (`voice.ts`)

About 14 lines, each with a written fallback for device speech:

- `safari.mystery` (instruct, level 14): "My friend picked one animal for a secret photo. Tap a picture question to find out who!"
- `safari.best` (instruct, level 15): "Which picture question sends the most friends home? Tap one to ask."
- `safari.ask-yes` / `safari.ask-no`: "Yes, it is {what}!" / "No, it isn't {what}." (`what` from `chipPhrase`.)
- `safari.unhelpful-all` / `safari.unhelpful-none`: "Everyone left is {what}, so nobody goes home." / "Nobody left is {what}, so nobody goes home." Then `safari.unhelpful-try`: "Try a question that only some of them fit."
- `safari.better`: "{n} went home. A {kind} could send {m}!" (`kind`: "doing word" or "place word").
- `safari.not-me`: "Not me! A picture question can send lots of friends away at once."
- `safari.not-me-two`: "Not me, so it's the other one!"
- `safari.last`: "Only one friend left. Take its photo!"
- `safari.found`: "It's the {animal}! Snap!"
- `safari.repeat`: "We asked that one: {answer}."
- `safari.glow`: "Try one of the shiny questions."

Run `node scripts/content-barrels.mjs` after adding them. Speech is checked for clarity on a real device later; the build makes no phonics claim.

## How-to card and ghost finger

- **How-to card** (`howto.ts`, levels 14 and 15): the face-down polaroid, a finger tapping a doing-word chip, two friends stepping away; level 15's line: "Ask the question that sends the most away."
- **Ghost finger** (`autotouch()`): taps `botMove`'s chip each time, then the last friend. In the scripted play the bot takes one wrong guess with three standing (one miss) and presses help once (one hint).

## Rule tests (`logic.test.ts`)

Over many seeds at 14 and 15:

1. Every action × place pair appears exactly once; no swimming; the secret is one of the friends.
2. **Every friend can be singled out** by doing and place questions alone (a breadth search over chips from the full set ends at that friend).
3. `answer` matches the secret's attributes for every chip.
4. **No question is more balanced than a best one**: for every reachable remaining set, every `bestQuestions` chip has the minimum `|yes − no|` among non-unhelpful unasked chips, and none of them is unhelpful.
5. While two or more friends remain, at least one best chip exists, and asking it leaves fewer friends (the hint always leads somewhere).
6. `unhelpful` is true exactly when the split leaves one side empty.
7. At level 15 the first move's best chips are the doing words (3/3), and a place splits 2/4: the gradient the level teaches exists on every board.
8. Following `botMove` finishes every mystery in at most three questions plus the snap; following a random policy of chips and guesses always finishes too.
9. Accounting: a wrong guess with three or more standing adds one miss; with two standing, none; the second unhelpful question in a mystery adds one hint once; a lucky guess adds nothing.
10. Layout: at 1024 × 768, 1366 × 768 and 768 × 1660, the three-place positions keep neighbouring friends at least 100 units apart and above the tray's top row; two-row trays keep 6 units between neighbouring touch areas.
11. School's order and range include 14 and 15; the lap, toddler, preschool and pre-K ranges are unchanged; `describeLevel` names both.

## Check tier for the build

A new interaction in an existing game: typecheck and unit tests; one filtered scripted play (`BROWSER_SUITE=batch BATCH_ONLY=safari SAFARI_LEVELS=14,15`) with one wrong guess and one hint (the `batch` safari case gains a mystery branch: tap chips, then the last friend); `fingerdemo` at 14; one portrait screenshot of level 15's two-row tray. `npm run build` because the how-to and voice script are shared.

## Open decisions

Each has a default the build uses.

1. **Host:** Photo Safari 14–15 (default) or a separate Mystery Friend game with hats, bows and colours as the notebook pictures it. Default: Photo Safari, because it needs no new attribute art; a separate game would need accessory art and its own land slot, and is a later option only if the meadow's questions feel thin in play.
2. **Pre-K opening of 14:** none at first (default), as for level 10; reconsider after a child has played it at school.
3. **The level-15 better-question note:** spoken once per mystery (default) or never. If a playtest finds it nagging, drop it; nothing is counted either way.

## Left for later

- Mixed boards where some questions split three ways badly and the best is not a doing word every time (a level-16 variant with three doing words × two places, which needs three friends per shared place).
- The notebook's accessory attributes (hat, bow, colour), with the host decision.
- SL4 *Which one?* (asking back when a request fits two) and SL3/SL6 stay in the study's order.
