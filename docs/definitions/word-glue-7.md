# Word Glue, level 7: Name the new thing (definition)

Defined 2026-11-23 as slice VW3 of the [vocabulary-and-word-parts study](../deep-dives/subjects/vocabulary-word-parts.md#build-slices-in-order), from its [candidates row](../deep-dives/subjects/vocabulary-word-parts.md#candidates-and-fit) VW3 and the [packet's](../deep-dives/subjects/RECOMMENDATIONS.md#vocabulary-and-word-parts-recommendations) line "any name that puts the thing last is accepted". It extends the built game ([levels 1–3](word-glue.md), [levels 5–6](word-glue-5-6.md)) and keeps its art, shelf, tap interaction, speech pattern and accounting unless this page says otherwise.

**Numbering.** The study's candidates row called Suffix Workshop (VW4) "Word Glue 7–8". Levels 5 and 6 are built and this rung follows them, so it is **level 7**; VW4, if its definition keeps it inside Word Glue, starts at level 8.

**Fun action and purpose.** A thing nobody has named sits on the table: a hat with a star and a bell on it. Three pictures wait below it (the hat, a star, a bell) and two empty name cards. "Here's a new thing! Nobody has named it yet. Tap two pictures to name it." She taps the star, then the hat; they fly into the name cards, the pet says "Star… hat. A star hat: a hat with a star on it! A bell hat would be right too," and the hat comes alive. The learning purpose is **coining a compound: the part that names what the thing is goes last, and the first part tells you something about it** (English compounds are head-final; CCSS L.2.4.d, using the meaning of the parts to predict the whole, here run the other way). Level 5 asked which part a real word names and level 6 used order to tell two real words apart; level 7 asks her to make a word that does not exist yet. Which first part she picks is her choice: both are true of the picture. Nothing is printed and nothing asks her to read.

## Identity and overlap

Rechecked 2026-11-23 against the catalog, the [games index](../GAMES.md) and `git log origin/main`: no island game asks her to build a name for a pictured thing from parts. It stays in Word Glue because it uses the same pictures, the same "parts make the whole" talk and level 5's rule; only the action changes from choosing to building. Ownership is unchanged: Clap the Syllables keeps a compound's beats, Opposites keeps un- and two meanings, Word Monsters keeps re-, -ing, -ed and -s, and Suffix Workshop (VW4) will own -er, -ful and -less.

## Bands and ladder

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 7 | **Name the new thing** | school | Which picture is the thing (it goes last) and which true detail goes first | Five asks, five different things |

**Bands:** school becomes **`{ min: 3, max: 7, order: [3, 5, 6, 7] }`**; lap to pre-K are unchanged. Level 4 stays out of school's order (a rule test already asserts it; it gains 7). A saved 7 carried into a younger band clamps to that band's top as any level does.

## The invented things (`INVENTED`, separate from `COMPOUNDS` and `PAIRS`)

Each row is one head (the thing) and two details drawn on it. Every picture is already drawn (`PICTURES` or Rhyme Time's shared pictures), so **no new part picture**; only the six invented things are new drawings. Names are spoken as two words with a short pause and stress on the first ("STAR hat"), as level 6's open compounds are; nothing is printed.

| Head | Details | Drawing | Comes alive | Accepted names and what each says |
| --- | --- | --- | --- | --- |
| hat | star, bell | a hat with a star on its front and a bell on its point | tips its brim; the bell swings | star hat: a hat with a star on it; bell hat: a hat with a bell on it |
| boat | tree, key | a boat with a little tree growing in its middle and a big key on its side | bobs; the tree's leaves sway | tree boat: a boat with a tree on it; key boat: a boat with a key on it |
| cake | shell, duck | a cake with shells round its edge and a duck sitting on top | the duck wiggles | shell cake: a cake with shells on it; duck cake: a cake with a duck on top |
| chair | sail, flower | a chair with a sail on its back and flowers on its legs | the sail puffs out | sail chair: a chair with a sail; flower chair: a chair with flowers on it |
| cup | frog, car | a cup with a frog on its side and a car on its handle | the frog hops round the rim | frog cup: a cup with a frog on it; car cup: a cup with a car on it |
| coat | moon, spoon | a coat with a moon on its back and spoons in its pockets | the spoons jiggle | moon coat: a coat with a moon on it; spoon coat: a coat with spoons in its pockets |

- **The head is unmistakable.** The head is drawn at made size (`MADE`, 210) and each detail is at most about a third of it, sitting on or in the head, never beside it. A capture strip of the six is the build's legibility check: in each, the big thing must read as the head before any detail.
- **Every accepted name is invented.** Neither accepted name of a row, joined or as two words, is a `COMPOUNDS` word, a `PAIRS` word, in `DENY` or in `OPAQUE`, and the build session checks each against a dictionary (Merriam-Webster or Cambridge) and drops a row whose name is a headword, as the level-1 build checked its list. Rows were chosen to avoid known ones: *moon cup*, *sun cup*, *mooncake*, *frog cake* and *shell house* were left out.
- **Why a separate table.** `makes`, `forms` and `distractorsFor` read `COMPOUNDS` only, so an invented row there would become a level-2 join or distractor; `INVENTED` leaves levels 1–6 untouched.

## Level 7, Name the new thing

- **Round.** Five of the six things, one ask each, in seeded order. The first round of a session is authored: hat, boat, cake, chair, cup.
- **Screen.** The invented thing at the top of the table at made size, playing its comes-alive motion once when asked; under it the **name**: two empty card outlines side by side at card size (`CARD`, 150) with a small pause dot between them; under that the **three tiles** (the head and its two details) at card size in a row. A new `nameLayout(view)` places them in landscape and on an upright phone (where the tiles may drop to 140 if the row needs it). Every tile and name card at least 140 units, no overlap, clear of Home and the guide corner, in the four views the layout tests use.
- **No position shortcut.** Per ask the seed shuffles the three tiles; across a round the head sits in each of the three positions at least once and in no position more than twice. Only looking at what the thing is answers every ask.
- **Action.** A tap (`onTap`). Touch-down lifts a tile and speaks its word. A tap sends the tile to the first empty name card; a tap on a tile in a name card sends it back to its place (free). When both cards hold a tile, the pet says the name with its pause and the game judges it.
- **An accepted name** (either detail first, the head last): the two tiles hop together into the thing with the pentatonic pop, the thing comes alive, the pet says the right line, which also offers the other name ("A bell hat would be right too"), and the thing goes to the shelf.
- **A name with the wrong part last** (the head first, or the two details): the name cards wobble with the soft boing and the pet says what that name would call: "A hat star would be a star! This is a hat, so hat goes last." The tiles go back to their places and the question is asked again. Neither detail is ever wrong as the first part: both are true of the picture, so the choice is hers.

## Accounting, help and finishing

The same shape as levels 5 and 6:

- **A miss** is a judged name with the wrong part last, each one counted, up to two per ask. **After two misses on one ask** the head's tile and the last name card glow and `hints++`, once per ask; Show a hint does the same, still once per ask. A third wrong name after the glow is followed by the supported finish: the head flies to the last card, the first card keeps her detail if she placed one (else the first detail on screen), and the right line plays with no further count.
- **Never a miss:** touching a tile to hear it (a touch-down not released on it), taking a tile back out of a name card, tapping the thing to hear the question again, taps during a join or a spoken line, and which detail she picks.
- **Finish:** after the fifth ask the shelf's things all play their animations, then `ctx.finish({ misses, hints })`; one sticker from the shell, with or without help. Nothing is kept or filed: the names are not saved.
- **Adaptation:** the ordinary rule. A random pair of taps is right one time in three, so a smooth round (at most one miss in five asks) is unlikely by chance; it shows only that she put the thing last in this toy with spoken words, not that she reads or spells compounds.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

- **Model.** `PLANS` gains level 7 (`NAME_LEVEL`). `INVENTED` holds `{ head, details: [a, b], meanings: { [detail]: string } }`. `makeRound(7, rng, authored)` builds the asks; an `Ask` at level 7 carries the invented row and its three tiles in screen order. A pure `judgeName(row, first, last)` returns `'right'` when `last` is the head and `first` a detail, else `'wrong'` with the word the name would call (`last`).
- **Over 500 seeds:** five asks, five distinct rows; three tiles per ask, the head and both details once each; the head in each position at least once and at most twice per round; the authored round matches.
- **Tables:** every tile is a drawn picture (in `PICTURES` or the shared set); every accepted name, joined and spaced, is outside `COMPOUNDS`, `PAIRS`, `DENY` and `OPAQUE`; every meaning is a non-empty string with no hyphen or bare affix; every row has a drawing key.
- **Judging:** for each row, all six ordered pairs of its three tiles are judged, exactly the two with the head last are right, and every wrong one names its last tile.
- **Bands:** school's order is `[3, 5, 6, 7]` and does not contain 4.
- **Accounting:** a scripted ask (wrong, wrong, Show a hint, wrong) counts two misses, one hint and ends in the supported name with her detail first; taking a tile back out, and judging a right name with either detail, count nothing.
- **Layout:** `nameLayout` at the four views: every tile and name card at least 140 units, no overlap, Home and guide corners clear, everything inside `view`; the upright tests gain level 7.

## Speech, how-to, ghost and registration

- **Voice lines** (`voice.ts`, `wordglue.name.*`, generated per full line from `INVENTED`, as level 6's `which` lines are, so every line has a build-time clip and no invented word reaches device speech through a template): `instruct.name` ("Here's a new thing! Nobody has named it yet. Tap two pictures to name it."); per row and detail a right line ("Star… hat. A star hat: a hat with a star on it! A bell hat would be right too."); per row and each of the four wrong orders a wrong line ("Hat… star. A hat star would be a star! This is a hat, so hat goes last."). That is six lines per row, 36 in all. Kokoro must say each two-word name with stress on the first word; the voice-clip build covers them.
- **How-to card** (`howto.ts`): step "Tap two pictures to name the new thing: the thing it is goes last" `{ from: 7, to: 7 }`; finish "Five new things are named and have come alive" `{ from: 7, to: 7 }`; notes "Either detail can go first: a star hat and a bell hat are both good names" `{ from: 7, to: 7 }` and "A name with the wrong part last is one miss and the pet says what that name would call; after two misses the thing and the last card glow, which counts as a hint" `{ from: 7, to: 7 }`. The existing English-only note widens to `{ from: 5, to: 7 }`.
- **Ghost finger:** `autotouch()` at level 7 touches the head first (touch-down and slide off, free), then taps a detail and the head.
- **Registration:** `describeLevel` gains the name; skills, land, icon and sticker unchanged. `npm run game-docs` regenerates the page's tables.
- **Co-play and off-screen:** at home, name a silly thing together ("a spoon with a hat on: a hat spoon or a spoon hat?"), the study's Silly Compounds card.

## Build batch

1. **Batch `word-glue 4`: level 7** (the `INVENTED` table and six drawings, `nameLayout`, the name cards, school's order, 36 voice lines, how-to, bot and tests). Built 2026-11-23 on `claude/word-glue-7`, [PR #2050](https://github.com/rjdunlap/neo/pull/2050) ([game page](../games/word-glue.md)); the dictionary check ran as a site-limited web search because both dictionaries refused direct fetches.

## Check tier

New-interaction tier: typecheck and unit tests (rule, layout, upright, registry, lands, how-to and voice-clip tests); one filtered `wordglue` play on an upright phone at level 7 with one wrong name, one hint and one detail taken back out; one upright screenshot mid-ask; a capture strip of the six invented things; `fingerdemo` at level 7; `npm run build`, because voice lines and art change. Whether a child hears the last part as the thing, and Kokoro's stress on the two-word names on a real phone, are not established by browser automation.

## Open decisions

None block the build. Defaults taken on the study's lean: level 7 is English-only like levels 5–6 (study decision 3); invented names are said as two words rather than run together, so device speech and Kokoro need no made-up spelling; the names are not kept, since a kept name would need saving and the shelf already shows the round's things.
