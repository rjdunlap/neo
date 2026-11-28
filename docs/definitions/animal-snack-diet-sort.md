# Animal Snack level 11, *Plants, meat or both?* (definition)

**Status:** Built 2026-11-28 ([PR #2365](https://github.com/rjdunlap/neo/pull/2365); see [the game page](../games/animal-snack.md#design-notes)). Defined 2026-11-28 from the Next ten line and the [deep dive's sketch](../deep-dives/animal-snack.md#new-levels-on-top). The 2026-10-23 decision kept the diet sort a sketch until a curated, true table existed; READY queued this definition on 2026-11-28 on the condition that every diet is checked against cited sources, as the `EATS` table was, and the table below meets it. **Docs only:** no code, browser or device evidence. [OBSERVATIONS](../OBSERVATIONS.md) has no Animal Snack notes, so nothing below draws on observed play. The build is queued as its own Next ten line.

**Fun action and purpose.** One farm friend at a time walks up to the snack spot and asks, "What do I eat?" She taps one of three mats below it: *plants*, *both* or *meat*. The animal hops onto its mat and stays there, and the groups grow as the round goes on. The learning purpose is **sorting animals by what they truly eat: plant eaters, meat eaters, and animals that eat both**. Each sort is said back with two real foods ("Yes! The duck eats both: seeds and snails."). This is the kindergarten idea that animals need food and that different animals eat different things (NGSS K-LS1-1, cited in the deep dive as research context only). The grown-ups' page names what the level asks ("sort each animal by what it eats: plants, meat or both") and claims nothing more.

## Identity and overlap

Rechecked 2026-11-28 against the [catalog](../GAMES.md), [IDEAS](../IDEAS.md), the open definitions, [WAITING](../WAITING-ON-DEVELOPER.md) (which lists nothing for Animal Snack) and the open PRs.

- **Level 7, *Who eats it too?*** asks which animals eat one food (hay, fish, seeds and so on). This level asks the reverse question about one animal: *which kind* of food does it eat? It uses the same true-diet sourcing, now for each whole animal rather than for one food.
- **Look It Up** (`docs/definitions/look-it-up.md`) has cited "eats" facts for some of the same animals, but it is a lookup, not a sort. Nothing there groups animals by diet.
- **Sorting Machine** and the other sorting games sort by color, shape, size or a printed rule. None sorts living things by a fact about them. Life Story Lab (IDEAS) is about life cycles, not diets.
- The pick-a-mat tap is the same action as tapping an animal in *who* and *eats*. The decision (three groups, one of which means "in both") is new to the island, and it belongs here, because Animal Snack is the game about who eats what.

## The diet table (`DIET` in `logic.ts`)

Each of the eleven animals gets one kind and two foods it truly eats, which are spoken when it is sorted and in hints. **Neither of the game's cartoon favorites is used as evidence.** The dog's bone is a chew, not a diet. The bear's honey is made by bees from nectar, so it is neither clearly a plant food nor clearly meat. Both stay as snack-time favorites and are never said in this level. Every row carries a one-line source in its comment, as `EATS` does. The build opens each source once before shipping. **An animal whose row cannot be confirmed is left out of `DIET` and is never dealt**, as the dog was left out of level 7.

| Animal | Kind | Plant foods said | Meat food said | Source to cite |
| --- | --- | --- | --- | --- |
| Cow | plants | hay, corn | – | University of Kentucky "Forages for dairy cattle"; UW–Madison Extension corn silage (both already cited for `EATS`) |
| Horse | plants | hay, oats | – | University of Missouri Extension G2807; UMN Extension horse feeding (already cited) |
| Sheep | plants | grass, oats | – | Oregon State EC 1652; Ontario OMAFRA sheep feeding (already cited) |
| Bunny | plants | grass, hay | – | House Rabbit Society Chicago, "Hay! The grass roots of the diet" (already cited) |
| Cat | meat | – | fish | Cornell Feline Health Center, "Feeding your cat": an obligate carnivore (already cited) |
| Dog | both | grain | meat | MSD (Merck) Veterinary Manual, "Overview of Nutrition: Small Animals": nutritionally, dogs are omnivores, adapted to carbohydrate-rich food; VCA Hospitals "Plant-based diets for dogs" |
| Pig | both | corn | worms | Iowa Pork Industry Center "Feedstuffs" (corn, already cited); feralhogs.extension.org "Food habits of feral hogs" and Mississippi State wild pig behavior (roots plus earthworms and insects) |
| Duck | both | seeds | snails | Audubon field guide, Mallard (seeds, already cited); Cornell All About Birds, Mallard food (aquatic insects and snails in the breeding season) |
| Bear | both | apples | fish | NPS black bear pages (apples and fish near farms, already cited; berries, insects, fish and carrion) |
| Hen | both | corn | worms | poultry.extension.org "What does a chicken eat?" (omnivores: grain, insects, worms) and "Earthworms in poultry diets" |
| Mouse | both | grain | bugs | Animal Diversity Web, *Mus musculus* (seeds and grain, plus insects such as beetle larvae and caterpillars) |

The four plant eaters name two plants, and the cat names one meat food. The table's shape: `DIET: Partial<Record<CritterName, { kind: 'plants' | 'meat' | 'both'; a: string; b: string }>>`, where `a` and `b` are the two foods said (two plants for a plant eater, a plant then a meat food for *both*; the cat has `a: 'meat'` and `b: 'fish'`, and only `b` is said). The food words are speech only. Only the mats are drawn (below), never a worm, snail or bug.

**Only the cat eats meat alone.** Among the eleven, one animal is a meat eater, four eat plants and six eat both. That is true, so the level does not invent another meat eater. Instead:

- The real decision is *plants* or *both*: ten of the eleven animals land on one of those two mats, and which mat depends on a fact she has to know or learn (the duck eats snails, the horse eats no meat).
- The cat comes to about half the rounds, so the meat mat is sometimes empty. When it is, the closing line says so ("Nobody here eats only meat today.") instead of implying that every mat must fill.
- A second meat eater waits for the *wild friends* sketch (a fox, an owl or a frog would need new parts in `critter.ts`). This slice adds no art.

## Bands and ladder

| Level | Name | Bands | What she decides |
| --- | --- | --- | --- |
| 11 | *Plants, meat or both?* | school (after 10) | Which mat each animal belongs on |

- **ID 11**, the next free one (10 is *The long menu*). IDs are appended; no saved level moves.
- `LEVELS.school` becomes `{ min: 8, max: 11 }`, so no `order` is needed. It is the top of the school window. It asks for a science fact rather than reading, and the menu board's reading stays below it. Two smooth rounds at 10 step up to it, and two struggling rounds step back to 10, as standard. `prek` stays 5–8; the younger bands are unchanged.
- `describeLevel(11)` is the plan's name: "Plants, meat or both: tap the mat each animal belongs on".

## The plan and the round (`logic.ts`)

Append one plan: `{ mode: 'diet', animals: 5, rounds: 1, name: 'Plants, meat or both: tap the mat each animal belongs on' }` (a new `SnackMode`, `'diet'`). One round is one sort, so one sticker per sort.

- **`makeDietRound(rng)`** returns four or five animals in the order they walk up, from `DIET`'s confirmed animals:
  - with the cat (a fair coin): the cat plus two plant eaters and two that eat both;
  - without the cat: two plant eaters and two that eat both.
  - No mat ever holds more than two animals. Every round has both a plant eater and an animal that eats both, so the decision that matters comes up at least twice. The order is shuffled, but the cat is never first: the first animal shouldn't be the one with an obvious answer.
- **`dietTap(animal, mat)`** returns `'right'` or `'wrong'`, from `DIET[animal].kind`.
- **`dietLine(animal, mat)`** picks the spoken reply (below). It is a pure function, so the replies can be tested.

## Layout

- **Three mats in a row** across the snack spot, left to right: *plants* (green, a tuft of the grass snack art), *both* (green and red, with the grass and the fish side by side) and *meat* (red, the fish art). Behind them, two rounded outlines are drawn: a green one around *plants* and *both*, and a red one around *both* and *meat*. The middle mat reads as the place where the two groups overlap, like a Venn diagram, while every tap area stays a plain rectangle.
- **`dietMats(w)`** gives the three mats' boxes across `spotEdges(w)`. Each mat is at least 160 wide and 120 tall, with gaps of at least 16, at the upright 768 width and the 1024 landscape width. The whole mat is its tap area (plus a 12-unit margin that never reaches a neighbor).
- **The waiting animal** stands above the middle mat at `FRIEND_SCALE`, at the usual `friendFeet` height. Tapping it replays the question, free.
- **Sorted animals** hop onto their mat and shrink to `MAT_SCALE`, which the build sets so that two drawn critters fit a 160-wide mat side by side. They are **not tappable**: a touch on a mat that already holds animals is a tap on the mat. Every target she can touch is a whole mat or the waiting animal, so none drops below 100 units.
- Upright on a phone, the mats must stay clear of the corner guide and the pet. The build checks this once, at 390×844.

## Mistakes and hints

- **Right mat:** the animal hops on, nibbles once with its own bite sound, and the pet says the kind and both foods: `snack.dietplants` "Yes! The {animal} eats plants, like {a} and {b}.", `snack.dietmeat` "Yes! The {animal} eats meat, like {b}.", or `snack.dietboth` "Yes! The {animal} eats both: {a} and {b}." Then the next animal walks up.
- **Wrong mat:** a boing and a head shake. The animal stays waiting, it counts as one miss, and the reply gives one true food and asks a question instead of naming the mat:
  - An animal that eats both, put on *plants* or *meat*: `snack.dietalso` "The {animal} eats {mat food}, and {other food} too!" (the duck on *plants*: "The duck eats seeds, and snails too!").
  - A plant eater put on *both* or *meat*: `snack.dietnomeat` "The {animal} eats {a} and {b}. Does it eat meat?".
  - The cat put on *plants* or *both*: `snack.dietnoplants` "The cat eats {b}. Does it eat plants?".
- **The second miss on the same animal** glows its mat and counts one hint, as the second miss glows the answer on level 7. The glow stays until she taps the right mat. A third or later miss on that animal only repeats its reply and adds no further hint.
- **The finish:** when the last animal is sorted, `snack.dietdone` "Plant eaters, meat eaters, and both!" or, with no cat in the round, `snack.dietdonenomeat` "Plant eaters and both! Nobody here eats only meat today." Then the pet's turn and the round end, as on every level.

`misses` and `hints` go to `ctx.finish` as on level 7. One sticker per completed sort, with help or without. Nothing files a journal discovery: the discoveries are each animal eating its own favorite, which does not happen here.

## Voice (`voice.ts`)

- `'snack.diet': ['What does the {animal} eat? Plants, meat, or both? Tap its mat.']`, the `ctx.instruct` for each animal, which the pet repeats. The first animal of a round is preceded by `'snack.dietintro': ['Plant eaters eat plants. Meat eaters eat other animals, like fish and bugs. Some eat both!']`.
- The replies above: `snack.dietplants`, `snack.dietmeat`, `snack.dietboth`, `snack.dietalso`, `snack.dietnomeat`, `snack.dietnoplants`, `snack.dietdone`, `snack.dietdonenomeat`.

Run `node scripts/content-barrels.mjs` afterwards. Do not render clips during the build: device speech is the fallback, as for levels 7–10. If a voice-clip coverage test rejects a new fixed line, follow what that test allows rather than running Kokoro.

## How-to card (`howto.ts`)

- Steps, `from: 11, to: 11`: "One animal at a time asks what it eats." / "Tap the mat it belongs on: plants, both, or meat. The middle mat is for animals that eat plants and meat." / "Tap the animal to hear its question again."
- Finish, `from: 11, to: 11`: "The round ends when every animal stands on a mat."
- Note, `from: 11, to: 11`: "A wrong mat only shakes the animal's head, and it says one food it really eats. After two misses on one animal, its mat glows. Only the cat eats meat alone, so some rounds leave the meat mat empty."

## The ghost finger and the bot

`snackTouch` gets a `'diet'` case that returns the waiting animal's right mat, so `autotouch()` and the how-to demonstration tap the right mat and never a wrong one.

## Rule tests (`logic.test.ts`)

- Every `DIET` animal is in `ANIMALS`, and every animal in `ANIMALS` is either in `DIET` or listed as left out. The kinds are exactly the cow, horse, sheep and bunny for *plants*, the cat for *meat* and the other six for *both*, unless the build had to leave one out.
- `DIET` agrees with `EATS` and `NOT_EATS`. No plant eater appears under `fish` in `EATS`. The cat appears under no plant food. Every *both* animal's plant food is a plant.
- No `DIET` food is `'bone'` or `'honey'`.
- Over 400 seeds, `makeDietRound`:
  - deals four or five distinct animals;
  - deals at least one plant eater and at least one animal that eats both;
  - puts at most two animals on each mat;
  - deals the cat in between 35% and 65% of rounds, and never first;
  - deals only `DIET` animals.
- `dietTap` is right for exactly one mat per animal.
- `dietLine` for every animal and wrong mat gives the right reply key. Its foods come from that animal's row, and a wrong-mat reply never names the right mat's word ("plants", "meat" or "both") as an answer: the cat's and the plant eaters' replies end in a question, and `dietalso` names two foods.
- `dietMats` at widths 768 and 1024 gives three boxes, each at least 160 wide and 120 tall, that do not overlap, with gaps of at least 16, inside `spotEdges(w)`.
- `LEVELS.school.max` is 11. No other band contains 11. IDs 1–10 keep their plans.
- The bot (`snackTouch` in `'diet'`) finishes a seeded round with no misses.

## Verification tier for the build

A new mode with a new tap layout counts as a new interaction:

- `npm run typecheck`, the Animal Snack rule tests, and the content barrels and game-docs tests.
- **One** filtered scripted play of level 11 at school: one wrong mat, a second wrong mat for the hint glow, then the finish. Take one portrait phone screenshot of the three mats with sorted animals on them, plus a check of level 8 (the first school level) so the ladder still opens.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=animal-snack FINGER_LEVELS=11 FINGER_BAND=school`.
- Then `npm run game-docs` and the game page's design notes. `npm run build` only if shared files or assets change (they should not).

## Left out

- **A second meat eater**, or any new animal: that waits for the *wild friends* sketch, which needs new critter parts.
- **Dragging the animal** onto a mat: the waiting animal would have to stay at least 100 units while dragged, and a sorted animal would shrink below that. A tap on a mat keeps every target large and reuses the tap the game already has.
- **Drawn bugs, worms or snails**: the meat foods are spoken only. The meat mat shows the fish the game already draws.
- **Diet words beyond plants, meat and both** (herbivore, carnivore, omnivore): the how-to card may mention them for a grown-up, but the level never says them.
- **What people should eat**: nothing here speaks about people's food, health or "good" and "bad" foods.
