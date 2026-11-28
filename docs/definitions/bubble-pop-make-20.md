# Bubble Pop level 20, *Make 20* (definition)

**Status:** Built 2026-11-28 ([PR #2363](https://github.com/rjdunlap/neo/pull/2363)) from the [deep dive's sketch](../deep-dives/bubble-pop.md#new-levels-on-top) ("a make 20 bonds level, 11 + 9"). `bubble.mode.20` carries `{pet}` (`Make 20 with {pet}. Pop two bubbles that make 20 together.`) so both new lines (`bubble.mode.20` and `bubble.ten20`) stay on device speech without Kokoro clip renders. [OBSERVATIONS](../OBSERVATIONS.md) has no Bubble Pop notes, so nothing below draws on observed play.

**Fun action and purpose.** The same bonds play as levels 10 (*Make 5*) and 11 (*Make 10*): ten numbered bubbles drift in place, she taps one to hold it and taps the one that makes the sign's number with it, and both pop. Here the sign says 20 and the bubbles carry 1 to 19. The learning purpose is **the pairs that make 20, found through making ten**: every pair but 10 and 10 is a number below 10 and a teen whose ones make ten with it (3 and 17, because 3 and 7 make 10 and the ten makes 20). That is 1.OA.C.6's "making ten" strategy and 2.OA.B.2's fluency within 20; the how-to card claims nothing beyond naming what the level asks.

## Identity and overlap

Rechecked 2026-11-28 against the [catalog](../GAMES.md), the open definitions, [IDEAS](../IDEAS.md) and `git log origin/main`.

- **Duck Pond 10** (*Make ten*) and **Frog Hop's crossing ten** hold making ten itself; neither asks for a total past ten as one fixed whole, as the deep dive and the READY line say.
- **Fruit Sums 2** (*Make a number up to 20 by adding two fruit, two different ways*) asks for teen sums, but the target changes every round and she finds two ways to one sum. *Make 20* keeps one whole for the whole round and asks for five of its pairs, the complements of 20 as a family, in the same hold-then-partner action as *Make 10*. That repetition against one whole is what bonds levels are for, so this stays in Bubble Pop as a new level on an existing interaction, not a new game.
- **Lasso Loops**, **Puddle Gobble 12** (*Two pails*) and **Sum Crates** add within 20 in other shapes (tens and ones, planning two totals, partitions in a grid); none asks for the pairs of 20.
- Evens and odds stay Duck Pond's (decided 2026-10-23); nothing here pairs objects.

## Bands and ladder

| Level | Name | Bands | What she decides |
| --- | --- | --- | --- |
| 20 | *Make 20* | school (after 14) | Which bubble makes 20 with the one she holds |

- **ID 20**, the next free one (19 is *Blow, then pop*). IDs are appended; no saved level moves.
- `LEVELS.school` becomes `{ min: 10, max: 20, order: [10, 11, 12, 13, 14, 20] }`. It is the top of the school ladder: it builds on *Make 10* but asks more (two-digit partners) than the counting runs at 12–14, so she reaches it by two smooth rounds at 14, and two struggling rounds step her back to 14 as standard. `prek` stays 6–12; lap, toddler and preschool are unchanged.
- `describeLevel(20)` comes from the existing bonds branch: "Pop two bubbles that make 20 together (5 pairs)". The mode card is `20: { name: 'Make 20', line: 'bubble.mode.20', picture: { kind: 'bond', numbers: [3, 17], sum: 20 } }`.

## The plan (`logic.ts`)

Append one plan: `{ mode: 'bonds', goal: 5, speed: 32, most: 10, colors: 0, radius: [54, 62], sum: 20 }`, the same pace, count and size as level 11, so ten bubbles of at least 108 units fit an upright phone as level 11's do and no target shrinks for the two-digit numerals.

- **Pairs.** `bondNumbers(20, 5, rng)` already does the right thing: the smaller numbers are drawn without repeats from 1 to 10, each with its partner 20 − a, so a round holds five different pairs and every bubble has exactly one partner. The 10 + 10 pair can come up; its two bubbles are partners of each other, as 5 + 5 already is on level 11.
- **No dots.** `showsDots(20)` stays false: quantity support faded at level 11, and dots past ten would crowd the bubble.
- **Sign.** `signFor` already returns `{ kind: 'bond', n: 20, dots: false }`; the sign's numeral is sized by its width (`Math.max(48, numeral.width)`), so 20 needs no new drawing. The build checks it once in a portrait screenshot.
- **New helper `tenFor(a, sum)`** for the hint line: when `sum` is 20, it returns `{ small, ones, big }` with `small = min(a, 20 − a)`, `big = 20 − small` and `ones = big − 10`, so `small + ones` is 10 and `small + big` is 20; it returns null for any other sum, and for the 10 + 10 pair (`ones` would be 0).

## Mistakes and hints

- **A pair that does not make 20** wobbles with the boing, counts one miss and says the existing `bubble.notmade` line ("3 and 15 make 18. We need 20."); the hold is let go, as on levels 10 and 11.
- **The second miss in a row** is the hint, as on 10 and 11, with one change for this level: the pair that glows is **the first bubble of her last try and its partner** (always on screen, because partners pop together), rather than any pair that works, and the pet says the new line `bubble.ten20`: "{small} and {ones} make 10, so {small} and {big} make 20." For the 10 + 10 pair it says `bubble.made` ("10 and 10 make 20!") instead. The hint line replaces `bubble.notmade` on that tap, so two lines are never queued. Levels 10 and 11 keep their behaviour.
- The idle glow on a held bubble's partner (not counted as a hint) is unchanged.
- Holding a bubble reads its number aloud, as now; tapping the held bubble again lets it go.

One sticker per completed round, with help or without; `misses` and `hints` go to `ctx.finish` as on level 11.

## Voice (`voice.ts`)

- `'bubble.mode.20': ['Make 20. Pop two bubbles that make 20 together.']`
- `'bubble.ten20': ['{small} and {ones} make 10, so {small} and {big} make 20.']`

The instruction is the existing `bubble.bonds` with `n: 20`. Run `node scripts/content-barrels.mjs` after. Do not render clips in the build: device speech is the fallback. Level 19's build found that a voice-clip coverage test rejects a new fixed line that has no clip; if `bubble.mode.20` trips it, follow whatever that test allows (level 19 gave its lines a slot) rather than running Kokoro.

## How-to card (`howto.ts`)

- Steps, `from: 20, to: 20`: "The sign at the top shows 20, the number the two bubbles make together." and "Tap a bubble to hold it, then tap the bubble that makes 20 with it. Tap the held bubble again to let it go." and "Most pairs are a small number and a teen: the small number and the teen's ones make 10, then the ten makes 20 (3 and 17). 10 and 10 is a pair too."
- Finish, `from: 20, to: 20`: "The round ends when the last pair is popped."
- Note, `from: 20, to: 20`: "A pair that does not make 20 only wobbles and its total is said; after two in a row, the first bubble of the try and its partner glow and the pet says how making 10 gets there."

## Rule tests (`logic.test.ts`)

- The existing "bonds levels give every bubble a partner" test covers plan 20 once it is in `PLANS`; add that the five smaller numbers of a round are distinct and that every number is 1 to 19.
- `tenFor`: for every `a` from 1 to 19 except 10, `small + ones === 10`, `small + big === 20`, `big − 10 === ones` and `{small, big}` is `{a, 20 − a}`; null for 10 and for any sum other than 20.
- The hint names a pair that is on screen: for seeded rounds, after any set of popped pairs, every live bubble's partner is live.
- `LEVELS.school.order` contains 20 exactly once, last; no other band contains 20; IDs 1–19 keep their plans.
- `signFor(plan20, 20, [])` is a bond sign for 20 without dots; `modeCardFor(20)` is *Make 20*.
- The bot (`bubbleToPop` with `sum: 20`) finishes a seeded round, as the existing bot test does for 10 and 11.

## Verification tier for the build

New levels on an existing interaction: `npm run typecheck`, the Bubble Pop rule tests and the content barrels and game-docs tests, one browser play of level 20 at school (one wrong pair, a second for the hint, then the finish) with one portrait phone screenshot of the sign and ten bubbles, and `BROWSER_SUITE=fingerdemo FINGER_ONLY=bubble-pop FINGER_LEVELS=20 FINGER_BAND=school`. Then `npm run game-docs` and the game page's design notes.

## Left out

- **Dots, ten-frames or split bubbles** that show the ten inside a teen: the hint says it instead, and a picture of tens would make this a place-value level, which Lasso Loops holds.
- **Make 20 with three bubbles**, or other totals past 10 (make 12, make 15): one whole per level keeps the ladder short; any further total is a new READY line.
- **Subtraction wording** ("20 take away 3"): bonds levels never say arithmetic beyond "make".
