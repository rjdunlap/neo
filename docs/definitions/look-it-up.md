# Look It Up, levels 1–3 (definition)

Defined 2026-10-22 as slice IR1 of the [informational-reading study](../deep-dives/subjects/informational-reading.md#build-slices-in-order), from its [first game's ladder](../deep-dives/subjects/informational-reading.md#a-first-games-ladder-look-it-up) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#informational-reading-recommendations). *Look It Up* is a working name.

**Status: ready to build, no review gate.** The developer chose **real animal facts** on 2026-10-22 and delegated the study's other decisions to this packet; they are settled under [Decisions taken](#decisions-taken). Every fact in the [fact table](#the-fact-table-logicts) was checked against at least two sources that two research subagent passes opened that day. The build re-reads that table, and a test keeps each fact's two sources beside it. No specialist reviewer is required, and nothing waits on a person. The developer may read the table at any time, but the build does not wait for it.

**Fun action and purpose:** the pet is looking after animals visiting the barnyard. A picture guide stands open on a book stand, with picture tabs down its side. "Cow is hungry. What does a cow eat? Let's look it up!" She taps the cow's face, the page turns, and the pet reads "Cows eat grass." She gives the cow the grass and it munches. The learning purpose is **a book's features help you find a fact**, from CCSS RI.1.5 ("Know and use various text features (e.g., headings, tables of contents, glossaries, electronic menus, icons) to locate key facts"). RI.K.7 adds that a picture and its words go together. The facts are real and taught: what each animal eats, where it lives, and what its baby is called.

## Identity and overlap

- **Animal Snack** feeds cartoon favourites (bear honey; the bunny's carrot became grass on 2026-10-22). Look It Up's *Eats* row gives each animal's **main** food from its sources: rabbits eat grass, brown bears mostly berries, grass and roots. The two games are allowed to differ, and Animal Snack is not changed here. See [Animal Snack's favourites](#animal-snacks-favourites).
- **Who Am I?** (defined, Barnyard) narrows a gallery by clues about features. Look It Up never eliminates: she finds a page, not a suspect, and its rows are food, place and baby, never body features.
- **Habitat Helpers** builds a garden from a small food/water/shelter model for Bunny and Duck. Look It Up reads real places from a page and builds nothing.
- **Read & Do** reads one printed sign into a picture. Look It Up searches a book of several pages; the study's decision 1 explains why this is a new game, not a Read & Do level.
- **Photo Safari** and **Peekaboo Barn** name animals. Here the name is the page title, and the fact is what she looks for.
- **The discovery journal is not changed**, and nothing is filed in it.

## The fact table (`logic.ts`)

Seven animals the island already draws. Each page names its kind where a fact holds only for that kind (brown bear, African penguin, common frog). Every sentence is spoken exactly as written, and each row's picture is what she touches or chooses.

| Animal (page title) | Eats (sentence · picture) | Where (sentence · picture) | Baby (sentence · picture) |
| --- | --- | --- | --- |
| **Cow** | "Cows eat grass." · grass tuft | "Cows live in a grassy field." · field | "A baby cow is called a calf." · calf |
| **Pig** | "Pigs eat plants, roots and bugs." · leafy plant with its root | "Pigs roll in mud to keep cool." · muddy pen | "A baby pig is called a piglet." · piglet |
| **Duck** (mallard) | "Ducks eat seeds and water plants." · seeds | "Ducks live near ponds and lakes." · pond | "A baby duck is called a duckling." · duckling |
| **Rabbit** (wild) | "Rabbits eat grass." · grass tuft | "Rabbits live in a burrow under the ground." · burrow (a small hole in a grassy bank) | "A baby rabbit is called a kitten, or kit." · kit |
| **Brown bear** | "Brown bears eat berries, grass and roots, and sometimes fish." · berries | "A brown bear sleeps in a den all winter." · den (a large cave) | "A baby bear is called a cub." · cub |
| **Frog** (common frog) | "Frogs eat slugs, snails and bugs." · snail | "Frogs lay their eggs in a pond." · pond | "A baby frog is called a tadpole." · tadpole |
| **African penguin** | "African penguins catch fish in the sea." · fish | "African penguins live on a rocky beach." · rocky beach | "A baby penguin is called a chick." · chick (brown and downy) |

**Questions.** Each animal asks its *Where* question in words that fit its answer, so no question says "live" when the answer is about keeping cool or winter sleep. Every *Eats* question is "{Animal} is hungry. What does a {kind} eat?"

| Animal | *Where* question (the pet says it, then "Let's look it up!") |
| --- | --- |
| Cow | "Cow wants some fresh air. Where do cows live?" |
| Pig | "Pig is hot. Where can a pig keep cool?" |
| Duck | "Duck wants a swim. Where do ducks live?" |
| Rabbit | "Rabbit wants to go home. Where do rabbits live?" |
| Brown bear | "Bear is sleepy. Where does a brown bear sleep in winter?" |
| Frog | "Frog has eggs to lay. Where does a frog lay its eggs?" |
| African penguin | "Penguin wants to rest. Where do African penguins live?" |

**Shared pictures**, which the round rules keep apart: cow and rabbit share *grass*; duck and frog share *pond*.

**Sources, by fact.** Every source was opened on 2026-10-22 by one of two research subagent passes; quotes are verbatim. In `logic.ts` each row carries the URLs below as `sources`, at least two each.

| Animal | Row | Sources and supporting quotes |
| --- | --- | --- |
| Cow | Eats | [SF Zoo docents](https://www.sfzoodocents.org/notebook/FactSheets/MAMMALIA/ARTIODACTYLA/CattleDomestic.pdf): "Wild diet: grasses, stems" · [Smithsonian National Zoo, Kids' Farm cows](https://nationalzoo.si.edu/node/11298): "Ensuring the cows have enough grass to graze on" |
| Cow | Where | [SF Zoo docents](https://www.sfzoodocents.org/notebook/FactSheets/MAMMALIA/ARTIODACTYLA/CattleDomestic.pdf): "Habitat: open grass lands, rangelands" · [Smithsonian National Zoo, Kids' Farm cows](https://nationalzoo.si.edu/node/11298): "spending lots of time grazing" |
| Cow | Baby | [SF Zoo docents](https://www.sfzoodocents.org/notebook/FactSheets/MAMMALIA/ARTIODACTYLA/CattleDomestic.pdf): "more calves are born in spring" · [Smithsonian National Zoo, cow](https://nationalzoo.si.edu/node/6882): "Calves are cattle of either sex that are 1 year old or younger." |
| Pig | Eats | [Minnesota Zoo, pig](https://mnzoo.org/blog/animals/pig): "foraging for food scraps, roots, nuts and insects" · [Erie Zoo, pot-bellied pig](https://www.eriezoo.org/animal-areas/barn-area/pot-bellied-pig): "Leafy greens, wild vegetables, roots, grasses, shrubs, insects" · [NatGeo Kids, pig](https://kids.nationalgeographic.com/animals/mammals/facts/pig): "leaves, roots, and fruit" |
| Pig | Where | [NatGeo Kids, pig](https://kids.nationalgeographic.com/animals/mammals/facts/pig): "rolling in mud to cool off" · [University of Missouri Extension](https://extension.missouri.edu/news/sweating-like-a-pig): "When pigs roll in mud, the mud cools and coats their skin to prevent sunburn" · [Minnesota Zoo, pig](https://mnzoo.org/blog/animals/pig): "This protective coating of mud helps them cool down" |
| Pig | Baby | [NatGeo Kids, pig](https://kids.nationalgeographic.com/animals/mammals/facts/pig): "young called piglets" · [Minnesota Zoo, pig](https://mnzoo.org/blog/animals/pig): "Piglet : newborn or baby" |
| Duck | Eats | [Audubon, mallard](https://www.audubon.org/field-guide/bird/mallard): "Majority of diet is plant material, including seeds, stems, and roots" · [Mass Audubon, mallards](https://www.massaudubon.org/nature-wildlife/birds/mallards): "vegetable matter such as grains, acorns, and aquatic vegetation" |
| Duck | Where | [RSPB, mallard](https://www.rspb.org.uk/birds-and-wildlife/mallard): "probably the first birds you'll see when visiting a pond or lake" · [NatGeo Kids, mallard](https://kids.nationalgeographic.com/animals/birds/facts/mallard-duck): "You'll find mallard ducks near ponds, marshes, streams, and lakes" |
| Duck | Baby | [RSPB, mallard](https://www.rspb.org.uk/birds-and-wildlife/mallard): "up to 13 adorable ducklings" · [Audubon, mallard](https://www.audubon.org/field-guide/bird/mallard): "Young ducklings may eat mostly aquatic insects" |
| Rabbit | Eats | [PTES, rabbit](https://ptes.org/get-informed/facts-figures/rabbit/): "Diet Grasses, cereal crops, root vegetables and young shoots of meadow plants" · [YPTE, rabbit](https://ypte.org.uk/factsheets/rabbit/print): "Food: mainly grasses, clovers and other green plants" · [RSPCA, rabbit diet myths](https://www.rspca.org.uk/adviceandwelfare/pets/rabbits/diet/myths): "In the wild, rabbits graze on grass and other plants" |
| Rabbit | Where | [The Wildlife Trusts, rabbit](https://www.wildlifetrusts.org/wildlife-explorer/mammals/rabbit): "underground burrow systems known as 'warrens'" · [PTES, rabbit](https://ptes.org/get-informed/facts-figures/rabbit/): "rarely venture further than 200 metres from the safety of their burrows" |
| Rabbit | Baby | [PTES, rabbit](https://ptes.org/get-informed/facts-figures/rabbit/): "3 – 7 young (kittens) per litter" · [The Wildlife Trusts, rabbit](https://www.wildlifetrusts.org/wildlife-explorer/mammals/rabbit): photo captioned "Rabbit kit" |
| Brown bear | Eats | [NPS Kenai Fjords, brown bear](https://home.nps.gov/kefj/learn/nature/brown-bear.htm): "more than 75 percent vegetable matter consisting of berries, flowers, grasses, herbs, and roots" · [NPS, brown bears](https://www.nps.gov/subjects/bears/brown-bears.htm): "plants, berries, fish, and small mammals" |
| Brown bear | Where | [NPS, brown bears](https://www.nps.gov/subjects/bears/brown-bears.htm): most brown bears "hibernate in dens during winter" · [NatGeo Kids, brown bear](https://kids.nationalgeographic.com/animals/mammals/facts/brown-bear): "the fattened bear waddles into a den" |
| Brown bear | Baby | [NPS Kenai Fjords, brown bear](https://home.nps.gov/kefj/learn/nature/brown-bear.htm): "the cubs will be born while the mother is still in hibernation" · [NatGeo Kids, brown bear](https://kids.nationalgeographic.com/animals/mammals/facts/brown-bear): "so the cub grows quickly" |
| Frog | Eats | [The Wildlife Trusts, common frog](https://www.wildlifetrusts.org/wildlife-explorer/amphibians/common-frog): "feast on slugs and snails" · [Froglife, common frog](https://www.froglife.org/info-advice/amphibians-and-reptiles/common-frog-2/): "insects, slugs and worms" |
| Frog | Where | [The Wildlife Trusts, common frog](https://www.wildlifetrusts.org/wildlife-explorer/amphibians/common-frog): "breeding in ponds during the spring" · [Froglife, common frog](https://www.froglife.org/info-advice/amphibians-and-reptiles/common-frog-2/): breeding in "puddles, ponds, lakes, and canals" |
| Frog | Baby | [The Wildlife Trusts, common frog](https://www.wildlifetrusts.org/wildlife-explorer/amphibians/common-frog): "hatch into the familiar tadpoles" · [Woodland Trust, common frog](https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/animals/reptiles-and-amphibians/common-frog/): "Tadpoles are brown in colour to begin with" |
| African penguin | Eats | [San Diego Zoo Wildlife Alliance fact sheet](https://ielc.libguides.com/sdzg/factsheets/africanpenguin): "Primarily consume small, shoaling, pelagic fishes" · [Lincoln Park Zoo penguin fact sheet](https://www.lpzoo.org/wp-content/uploads/2020/06/Penguins-Fact-Sheet-2016-FINAL-1.pdf): "African penguins feed primarily on pelagic schooling fish, such as anchovies, pilchard and herring" · [Maryland Zoo, African penguin](https://www.marylandzoo.org/animal/african-penguin/): "They feed on small fish such as sardines and anchovies" |
| African penguin | Where | [San Diego Zoo Wildlife Alliance fact sheet](https://ielc.libguides.com/sdzg/factsheets/africanpenguin): "low-lying, rock-strewn islands" · [Maryland Zoo, African penguin](https://www.marylandzoo.org/animal/african-penguin/): "lives along the rocky coastline of southwest Africa" |
| African penguin | Baby | [San Diego Zoo Wildlife Alliance fact sheet](https://ielc.libguides.com/sdzg/factsheets/africanpenguin): "Chick: first down brown" · [Maryland Zoo, African penguin](https://www.marylandzoo.org/animal/african-penguin/): "caring for the chicks once they hatch" |

Two notes: the frog's tadpole sources show the stage but do not use the words *baby frog*; and *kit* for a baby rabbit has one European-rabbit source (other *kit* pages are about cottontails), which is why the line also says *kitten*.

**Choices the table makes:**

- **The pig's line leaves out corn.** "Farm pigs eat lots of corn" is true of US farms but not of farms that feed wheat or barley.
- **The rabbit's baby is "a kitten, or kit".** The sources disagree: PTES says *kittens* and the Wildlife Trusts caption a photo *rabbit kit*, so the line gives both, and the label tag says *kit* so a small child does not hear a cat.
- **The frog's *Where* row says where it lays its eggs.** Common frogs spend most of the year on land, so the line does not say a frog lives in a pond.
- **Narrow facts name their kind.** "Penguins live where it is cold" and "all bears sleep all winter" are both wrong as general claims, so the penguin page says *African penguin* and the bear page says *brown bear*.
- **The cow's field** is true of grazing cattle; many dairy cows live mostly in barns.
- **No turtle.** Water turtles, sea turtles and tortoises differ, and children's media mixes them up; a turtle page would also crowd the pond.
- **The tadpole** is the usual children's-book wording; strictly, a froglet comes between tadpole and frog.
- **Nothing about milk, bread for ducks, or "pigs are dirty".** The pig's line says why pigs use mud.
- **Pictures that could be confused are drawn apart:** the den is a large cave and the burrow a small hole in a bank; the pig's food is a leafy plant with its root, not seeds; the fish belongs only to the penguin.

## Levels

| Level | Name | Bands (default) | What she decides | Round |
| --- | --- | --- | --- | --- |
| 1 | **Talking labels** | toddler, preschool | Nothing to get wrong: touch each label to hear it | Three pages |
| 2 | **Find the page** | preschool, pre-K | Which tab is the visitor's page, then which food it shows | Three visitors, *Eats* |
| 3 | **The fact box** | pre-K, school | Which page, which row (*Eats* or *Where*), then which thing in the scene | Three visitors, mixed rows |

**Bands:** toddler 1, preschool 1–2, pre-K 2–3, school 3. IR2 (levels 4–6) adds school 4–6 later.

### First rounds

- **Level 1 (authored):** the guide lies open on the cow's page. A cow stands in a field, a grass tuft before it, a calf at its side. Three label tags each have a line to their picture: *cow*, *grass*, *calf*. She touches *grass*: the tag lights and speaks "grass", and the grass tuft wiggles. Touching the calf lights the *calf* tag the same way. When all three have spoken, the pet reads the page's three sentences, the cow steps out of the book and munches, and the page turns by itself to the duck (*duck*, *seeds*, *duckling*), then the bear (*bear*, *berries*, *cub*).
- **Level 2 (authored):** the guide is open on the duck's page. Three tabs show the cow, duck and bear. The cow walks in. "Cow is hungry. What does a cow eat? Let's look it up!" She taps the bear tab: the page turns and reads "Brown bears eat berries…" (free). She taps the cow tab: "Cows eat grass." The basket holds grass, seeds and berries. She drags the seeds to the cow; it shakes its head kindly and the pet says "Let's look in the guide" (one miss). She drags the grass: the cow munches. Then the bear, then the duck.
- **Level 3 (authored):** tabs for the rabbit, pig and penguin; the guide opens on the pig's page. The scene shows three places: a burrow in a grassy bank, a muddy pen and a rocky beach. "Rabbit wants to go home. Where do rabbits live? Let's look it up!" She taps the rabbit tab; its fact box has three rows, each with a picture icon (a bowl for *Eats*, a map pin for *Where*, an egg for *Baby*). She touches the *Where* row: "Rabbits live in a burrow under the ground." She leads the rabbit to the burrow and it pops inside. Next the penguin is hungry: the scene's places give way to a basket holding fish, a plant with its root and grass; she finds *Eats* on the penguin's page. Then the pig: "Pig is hot. Where can a pig keep cool?" She finds *Where* and taps the muddy pen; it rolls in the mud.

## The model (`logic.ts`)

- **`ANIMALS`** is the fact table: `{ id, title, art, rows: { eats, where, baby } }`, where each row is `{ line, picture, sources }`. `picture` is a key into the game's art (`grass`, `rootPlant`, `seeds`, `berries`, `snail`, `fish`; `field`, `mudPen`, `pond`, `burrow`, `den`, `rockyBeach`; `calf`, `piglet`, `duckling`, `kit`, `cub`, `tadpole`, `chick`).
- **Level 1 round:** three distinct animals, the first round authored (cow, duck, bear); each page shows its animal, its *Eats* picture and its *Baby* picture with three tags (name, food, baby).
- **Level 2 round:** three tab animals whose *Eats* pictures are all different, so cow and rabbit are never tabs together. The visitors are those three in a seeded order. The basket holds the three tab animals' foods. The opening page is never the first visitor's, and after a visitor is fed the guide stays where she left it.
- **Level 3 round:** three tab animals with distinct *Eats* pictures **and** distinct *Where* pictures, so duck and frog are never tabs together either. Each visitor asks one row; the three asks include both rows. The choices in the scene are the three tab animals' pictures for that row.
- **Check** `check(round, visitor, choice)` returns `right`, `wrong` (with the animal the choice belongs to, so the pet can say whose it is), or `ignore` (a drop on empty ground or on the guide).
- **Hint** `hintFor(round, visitor, step)` returns the visitor's tab while the open page is another's; once it is open, the asked row at level 3; then the right choice.
- **The first round of each level is authored**, so the how-to card and its demonstration open on the same story.

## Screen and controls

- **The layout** is `guideLayout(view)`. In landscape the book is on the left half and the scene with its basket or places on the right. In portrait the book is on top and the scene below. The bottom-left pet and top-left home stay clear in all four views the lands test uses.
- **Tabs** stand down the book's right edge, each a 110-unit square face, with three per round. **Fact rows** are 100 units tall across the page. **Label tags** are at least 160 by 100. Scene choices and basket foods are at least 130 units. The book page is at least 380 units wide.
- **Turning a page:** a tap on a tab starts the turn on touch-down (the tab lifts, the corner curls), and the page speaks its title and sentences once it lands. Tapping the open page's own tab re-reads it. Turning is never timed and never counted.
- **Label tags and rows** light and speak on touch-down. At level 1, touching a tag's picture lights the tag too.
- **Choices** drag with `src/engine/drag.ts` onto the visitor (food) or are tapped (places): a tapped place walks the visitor there. At level 2 a tapped food also flies to the visitor, so a slip never stalls. A drop resolves to the nearest target, as AGENTS requires for close targets.
- **The visitor** stands in the scene between asks; tapping it repeats the pet's question (`ctx.instruct`).
- **Printing:** the page title and label tags are printed words, always spoken on touch (print awareness, ELOF IT-LC 11 and P-LIT 2). Fact sentences are spoken, not printed, at these levels; nothing asks her to read. IR2 adds printed captions on Read & Do's terms.
- **Pause sheet:** Start again (the same seeded round from its first visitor, keeping misses and hints) and Show a hint (`Scene.pauseActions`).
- **Music:** Barnyard's style keeps playing.

## Accounting, help and finishing

- **Level 1** has no misses and no hints.
- **Never a miss (levels 2–3):** turning to any page, re-reading a page, touching a row or label, tapping the visitor, a drop on empty ground or on the book.
- **A miss** is a wrong choice given to the visitor, counted once per distinct wrong choice per visitor. The visitor shakes its head kindly. The pet says whose that is and points back to the guide: "Those are seeds. Ducks eat seeds. Let's look in the guide for the cow." A wrong place walks the visitor there and back: "That's a pond. Ducks live near ponds and lakes."
- **After two misses on one visitor** the hint glows the visitor's tab, or the asked row once its page is open, then the right choice; `hints++` at most once per visitor. Show a hint does the same, still at most once per visitor.
- **Supported finish:** a third miss after the glow lets the pet open the page, read the row and give the right choice itself, with no further count, so every round can finish.
- **Finish:** after the last visitor every animal in the round waves from the scene, and the game calls `ctx.finish({ misses, hints })`; the shell gives one ordinary sticker, with or without help. Nothing is kept or filed.
- **Adaptation:** the ordinary rule (`src/progress/difficulty.ts`). A smooth level-3 round shows she found a pictured fact in a pictured guide with spoken support. It is not evidence of independent reading or of learning beyond this toy.

## Speech (`voice-script.ts`)

Lines live under `lookitup.*`:

- `intro` and `instruct.labels` ("Touch a word to hear it.").
- `ask.eats` ("{animal} is hungry. What does a {kind} eat? Let's look it up!") and `ask.where` (the animal's own *Where* question from the table, followed by "Let's look it up!").
- `miss.food` ("Those are {food}. {owner line} Let's look in the guide for the {kind}.") and `miss.place` (the same shape for a place).
- `hint` ("Find the {kind}'s face on a tab."), `hint.row` ("Look in the box for the {row} picture.") and `done`.

Page titles, label words, every fact sentence **and every animal's two questions** come from the fact table, so a reader checks each question beside its answer in one place. `ask.eats` and `ask.where` above are only the fallback shape: each animal's row carries its own `ask`, with a reason that fits the answer (see the asks column).

## Rule tests (`logic.test.ts`)

- **Table:** seven animals; every row has a non-empty `line`, a `picture` with art, and **two distinct source URLs**; no sentence contains *carrot*, *honey*, *bread*, *dirty*, *all bears* or *cold*; every animal has an *Eats* and a *Where* question, and no *Where* question says *live* where its answer does not. *Eats* pictures are shared only by cow and rabbit, and *Where* pictures only by duck and frog.
- **Level 1, over 500 seeds:** three distinct animals; the authored first round matches.
- **Level 2, over 500 seeds:** three tab animals with distinct *Eats* pictures; the basket is exactly their foods; the opening page is not the first visitor's; `check` of each visitor's own food is `right` and every other basket food is `wrong`.
- **Level 3, over 500 seeds:** three tab animals with distinct *Eats* and *Where* pictures; both rows are asked; every scene choice is a tab animal's picture for the asked row; exactly one choice is right for each ask.
- **Hints and accounting:** `hintFor` leads tab, then row, then choice in every state. A scripted level-2 visitor (wrong food, the same again, the other wrong food, Show a hint twice, a third wrong) counts two misses and one hint and ends with the supported finish.
- **Layout:** `guideLayout` at the four views: tabs at least 110, rows and tags at least 100 tall, choices at least 130, no overlap, the home and pet corners clear, everything inside `view`.
- **Registry, lands and how-to tests** pass with the new game, including Barnyard on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` touches each label at level 1. At levels 2–3 it taps the visitor's tab (`hintFor`), at level 3 touches the asked row, then drags the right food or taps the right place. Level 2's demonstration first taps one other tab to show that looking is free.
- **How-to card** (`src/content/howto.ts`). Goal: "Use the picture guide to find out about each animal, then help it."
  - Steps: "Touch a word on the page to hear it" `{ from: 1, to: 1 }`; "Tap the animal's face on a tab to turn to its page, then give it the food the page shows" `{ from: 2, to: 2 }`; "Tap the animal's tab, touch the food or place picture in its box, then help it" `{ from: 3, to: 3 }`.
  - Finish: "Every visitor has been helped."
  - Notes: "The facts are real and come from zoos and wildlife groups" (all levels); "Nothing can go wrong here" `{ from: 1, to: 1 }`; "Turning pages is always free; only a wrong food or place given to the animal is a miss, and after two misses the right tab or picture glows, which counts as a hint" `{ from: 2, to: 3 }`.
- **Registration:**
  - ID `look-it-up`, name "Look It Up" (placeholder), spoken title `game.look-it-up`.
  - Region (subject) `story-grove`, the language subject; home land **Barnyard**.
  - Skills `['text-features', 'informational-reading', 'animal-facts']`. Bands as above.
  - Hub icon: an open book with a cow's face on a tab.
  - Sticker (page `farm`): a seeded animal from the table with its baby.
- **Art** (code-drawn in `src/games/look-it-up/art.ts`, colours from `src/art/palette.ts`):
  - *Reuse:* cow, pig, duck, bear and bunny (`CRITTERS`), with the adults tinted to read as the page's kind: the duck a mallard (brown body, green head), not the yellow cartoon duck that reads as a duckling, and the rabbit brown, not the white pet bunny; `frogArt`, `penguinArt` and `fishArt` (`src/art/animals.ts`); seeds from Animal Snack's `foodArt` (the build lifts it into `src/art/` only if it reuses it unchanged).
  - *New pictures:* grass tuft, leafy plant with its root, berries, snail; field, muddy pen, pond, burrow, den, rocky beach.
  - *New babies:* calf, piglet, duckling, kit and cub as small, rounder critters with the same spec; a tadpole; a brown, downy penguin chick.
  - *New book:* the guide, the page turn, tabs, row icons and label tags.
- **Co-play:** *Ask me, I'll look it up*: the child picks an animal and asks; the grown-up finds the page with the child's finger on the tabs; then they swap. **Off-screen** (spoken tip): "Find an animal book at home and look for what one animal eats."
- **Couch:** none.
- **Rework couplings:** none required and nothing saved. A guide of the island's creatures could later belong to collecting, which the [rework brief](../rework/README.md) decides.

## Animal Snack's favourites

The same research checked Animal Snack's foods against the sources. Cow hay and duck seeds are main foods. Pig apple is real but occasional. Bear honey is a minor food (bears raiding hives want the bee grubs). Bunny carrot is **misleading**: carrots are a sugary pet treat and wild rabbits do not eat them (RSPCA, opened). Look It Up does not depend on Animal Snack changing. Changing the bunny's favourite to grass, hay or dandelion leaves is a separate small Animal Snack fix, offered as a follow-up rather than done here. **Done 2026-10-22:** the bunny now eats grass (a tuft on a clump of earth), and its journal line says so.

## Check tier

Look It Up 1–3 uses the new-game tier:

- Typecheck and unit tests: the properties above, plus the registry, lands and how-to tests.
- One scripted play through a new `browser-check.mjs` case (and its README row) at levels 1 and 3, with one wrong food and one hint.
- One portrait screenshot at level 3.
- `fingerdemo` at levels 1 and 3.
- `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open:

- How the iPad's speech says each fact sentence.
- Whether a three-year-old understands that a face on a tab opens that animal's page.
- Tab and row legibility in portrait.
- Whether a child takes the real facts home ("rabbits eat grass").

Browser automation establishes none of these.

## What comes next

**IR2, levels 4–6** (a contents page with printed names, a caption that decides between two pictured animals, and a question that needs two pages) is defined after a child has played level 3. The *Baby* row, read but never asked in IR1, is IR2's first new question. The study's [build slices](../deep-dives/subjects/informational-reading.md#build-slices-in-order) hold the order.

## Decisions taken

The developer delegated these on 2026-10-22, with one direction: real animal facts. None blocks the build.

1. **A new game.** Searching a book of pages is a different action from reading one sign, so this is not a Read & Do level.
2. **Real animal facts**, as the developer asked: seven animals, three rows each, two opened sources per fact. They need no reviewer gate, because the facts are general and sourced and none is advice or about people. The study's earlier lean toward island-invented facts is withdrawn.
3. **Home land: Barnyard.** It has 9 games today, 10 after Who Am I?, and Puzzle Peaks already lays out 13. Story Grove (12) stays free for Word Glue. The fallback is Story Grove if Barnyard's layout test fails. The subject stays `story-grove`.
4. **Bands:** toddler 1, preschool 1–2, pre-K 2–3, school 3.
5. **No printed fact sentences in IR1.** Titles and tags are printed and spoken; captions come with IR2.
6. **The *Baby* row is read in IR1 and first asked in IR2.** A baby that looks like a small parent would be matched by looks, not looked up.
7. **Animal Snack is not changed here**; its bunny's carrot is a separate follow-up.
