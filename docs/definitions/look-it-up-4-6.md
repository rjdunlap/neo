# Look It Up, levels 4–6 (definition)

**Built:** levels 4–6 (PRs #2009, #2039). As built: level 6 computes its accepted friends from the captions by whole word with a plural (`SHARES`, `acceptedFor`, `offeredFor`) and its friend cards walk beside the visitor (see the game page); the the page number is printed at the foot of each page (beside the title it collided with “African penguin”); each contents row keeps its picture (scaled) with a small row icon beside the printed caption; the contents title band is 70 units upright (not 50) so the first line clears Home and help; the how-to demo plays the authored round without using up her own first round.

**Status: batch 1 (levels 4–5) and the level 6 batch built.** Defined 2026-11-22 as slice IR2 of the [informational-reading study](../deep-dives/subjects/informational-reading.md#build-slices-in-order), from its audience row for school (*Contents page*, *Picture or words?*, *Two pages together*) and its [candidates table](../deep-dives/subjects/informational-reading.md#candidates-and-fit) row IR2. The study's slice line said "after IR1 is played and decision 3 is answered"; the developer admitted Look It Up 4–6 for definition on the study's lean without waiting for play on [2026-11-17](../archive/DECISIONS-2026-11-17.md#games). It extends the built game ([levels 1–3 definition](look-it-up.md), [PR #830](https://github.com/rjdunlap/neo/pull/830); upright since [PR #1838](https://github.com/rjdunlap/neo/pull/1838)) and keeps its fact table, art, scene, drag-or-tap choices, speech pattern and accounting unless this page says otherwise. Two of the 1–3 definition's [decisions](look-it-up.md#decisions-taken) take effect here: printed fact sentences arrive with IR2 (decision 5), and the *Baby* row is first asked here (decision 6). Levels 4–5 are built; level 6 is not. **No new fact is added**: every sentence these levels print or match is already in the sourced [fact table](look-it-up.md#the-fact-table-logicts).

**Fun action and purpose.** The guide grows up. Level 4, *Contents page*: the picture tabs are gone; the guide opens on a contents page listing all seven animals with their faces, printed names and page numbers, and she finds a visitor's page from it, as in a real book (CCSS RI.1.5, "tables of contents … to locate key facts"). Level 5, *Picture or words?*: each visitor's baby needs a name tag; the page's picture shows the baby, but only the printed caption says what it is called, so she finds the words and gives the baby its printed tag (RI.1.6, "Distinguish between information provided by pictures … and information provided by the words"). Level 6, *Two pages together*: "Who else eats what a cow eats?" She reads one page for the fact, then other pages for the same words, and brings the friend over to share (RI.2.9 and RI.4.9, two texts on one topic). From level 4 every fact row shows its sentence in print; touching a row reads it aloud, as Read & Do's words do. With spoken support, a smooth round is not evidence of independent reading.

## Identity and overlap

Rechecked 2026-11-22 against the catalog and `git log origin/main`: no island game has a contents page, a printed caption to search, or a question that needs two texts. Read & Do reads one sign already in view; Notice Board weighs what a poster leaves out; Who Am I? eliminates by features. All three levels keep Look It Up's action (find the page, then the place on it, then act it out in the scene), so they extend this game rather than start another. The discovery journal is still not changed.

## Bands and ladder

`BandLevels`: `school: { min: 3, max: 6 }` after both batches (`max: 5` after the first); toddler, preschool and pre-K are unchanged. Levels append above 3 without renumbering, so saves and pins stay valid. No `order`.

| Level | `mode` | Name (`describeLevel`) | A round |
| --- | --- | --- | --- |
| 4 Contents page | `contents` | "Contents page: find the animal's name and page, then help" | Three visitors, *Eats* or *Where* |
| 5 Picture or words? | `baby` | "Picture or words? Read the baby's name, then give it its tag" | Three visitors, *Baby* |
| 6 Two pages together | `share` | "Two pages together: find who shares a fact with the visitor" | Three visitors, one question each |

## What changes from level 4 up

- **The book is a fixed book.** Pages 1–7 in the table's order: Cow 1, Pig 2, Duck 3, Rabbit 4, Brown bear 5, Frog 6, African penguin 7. Each page prints its number beside its title. A real book does not reorder, so neither does this one; a child who learns that the penguin is last has learned the book.
- **The contents page** lists all seven: each line shows the animal's face, its printed name and its page number. Touching a line lifts it on touch-down, speaks the name, and turns to that page. The face stays (the study's lean): the skill is using a contents page, not decoding names. Dropping the faces is [open decision 2](#open-decisions).
- **The tab column holds one button**, *Contents*: a 110-unit square in the first tab slot showing a small list icon. It turns back to the contents page from any page. Each round opens on the contents page.
- **Printed captions.** Every row shows its icon and its sentence in print. A page turn speaks the page's number and title only ("Page 4. Rabbit."); touching a row lights it and reads its sentence. Reading, re-reading and turning are always free. On a muted phone the print carries the page, which helps grown-up playtests.
- **Layout (`guideLayout(view, …)` with a new `contents` flag).** Caption text is 26 units (never below 24), wrapping to at most two lines in a 100-unit row beside an 80-unit icon. The longest sentence, the brown bear's *Eats* line (61 characters), takes two lines at the narrowest row: about 400 units of text width in landscape (book at most 520 wide) and about 480 upright (book 608 wide on the 768-unit phone views). Page state: title band 70 plus three 100-unit rows, as at level 3. Contents state: a 50-unit title band, then seven 100-unit lines in **two columns with 8-unit gaps**. On the landscape phone (1662 × 768) the book starts at y 100 and the left column, the one above the pet corner, holds **three** lines (bottom about y 474) while the right column holds four (bottom about y 582). The pet corner (below about y 598, left 160 units) stays clear. Upright, the book keeps y 140 and the two columns hold four and three; a name such as "African penguin" may wrap to two lines inside its line rather than shrink. Choices stay 130 units.

## Level 4, Contents page

**The round.** Three visitors whose *Eats* pictures differ and whose *Where* pictures differ, chosen from all seven by the level-3 rule (`pickTabs` with both rows, so cow and rabbit, and duck and frog, never visit together). Asks mix *Eats* and *Where* as at level 3, with both rows asked. The scene's choices are the three visitors' pictures for the asked row, so `check` and its "whose is that" miss line work unchanged. The other four pages are in the book and may be read freely; they never appear as choices.

**Authored first round:** the guide opens on its contents page. "Pig is hot. Where can a pig keep cool? Let's look it up!" She touches *Pig, 2*; the page turns ("Page 2. Pig."); she touches the *Where* row ("Pigs roll in mud to keep cool."); she taps the muddy pen. Then Penguin asks *Eats* (fish), then Rabbit asks *Where* (burrow).

**Hints** (`hintFor`, extended): on another animal's page, glow *Contents*; on the contents page, glow the visitor's line; on the visitor's page, the asked row until touched; then the right choice. One hint at most per visitor, as at 1–3.

## Level 5, Picture or words?

**An amendment to the study's rung, with its reason.** The study sketched "the page's picture shows two friends; the caption says which one is the answer". With real facts, staging two pictured friends where only a caption decides would mean inventing an ambiguity the sourced table does not hold. The *Baby* row already splits the two kinds of information honestly: the picture shows what the baby looks like, and only the words say what it is called. That is RI.1.6's distinction, and the 1–3 definition reserved the *Baby* row for this level (decision 6).

**The round.** Three visitors from the seven, each with its baby beside it (the built baby art). The ask, the same shape for every animal: "{Title}'s baby needs a name tag. What is a baby {kind} called? Let's look it up!" The scene offers three **printed name tags**, the round's three baby words (`PICTURE_WORDS` of each visitor's *Baby* picture: *calf*, *piglet*, *duckling*, *kit*, *cub*, *tadpole*, *chick*). Touching a tag lifts it and speaks its word (free). Dragging or tapping a tag gives it to the visitor's baby: the right tag hangs on the baby, which hops. The first *Baby* row she touches in a round adds one line: "The picture shows the baby. The words tell its name." (`lookitup.picture-words`).

**Truth rules for the tags.** A wrong tag must also be wrong in life:

- **Duck and penguin never visit in the same level-5 round.** A duckling is also called a chick, so a *chick* tag on a duckling would be marked wrong while true.
- The rabbit's caption says "a kitten, or kit"; its tag says **kit** only, and no round offers *kitten*.
- At most one of *piglet* and *duckling* per round, because their names give the parent away; the round still needs the page for the other two.

**Authored first round:** Rabbit (*kit*), Frog (*tadpole*), Brown bear (*cub*). The guide opens on the contents page.

**Misses** use the level-3 rule (one per distinct wrong tag per visitor): the baby shakes its head and the pet says "That tag says {word}. A {word} is a baby {owner kind}. Let's read the {kind}'s page." (`lookitup.miss.tag`). **Hints** run as at level 4 with the *Baby* row as the asked row, then the right tag.

## Level 6, Two pages together

**Matching is by the caption's words.** Each ask names a source animal and a row but not the fact: she must read the source page to learn the key word, then find another page whose sentence in the same row contains it. The answers are computed from the fact table's strings, so the table and the level cannot disagree.

**The questions** (`SHARES` in `logic.ts`; asks spoken and printed nowhere else):

| # | Visitor (source page, row) | Ask (then "Let's look it up!") | Key word | Accepted (caption contains it) | Offered as wrong (two drawn) | Never offered, and why |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Cow, *Eats* | "Cow wants a lunch friend. Who else eats what a cow eats?" | grass | Rabbit, Brown bear | Frog, African penguin | Pig: its sources list grasses (Erie Zoo, in the table). Duck: wild mallards graze grass at times (recalled) |
| 2 | Rabbit, *Eats* | "Rabbit wants a lunch friend. Who else eats what a rabbit eats?" | grass | Cow, Brown bear | Frog, African penguin | As question 1 |
| 3 | Frog, *Eats* | "Frog wants a lunch friend. Who else eats what a frog eats?" | bugs | Pig | Cow, Rabbit, African penguin | Duck: "Young ducklings may eat mostly aquatic insects" (Audubon, in the table). Brown bear: bears eat insects (recalled) |
| 4 | African penguin, *Eats* | "Penguin wants a lunch friend. Who else eats what an African penguin eats?" | fish | Brown bear | Cow, Rabbit, Frog | Duck: mallards take small fish at times (recalled). Pig: pigs eat almost anything (recalled) |
| 5 | Duck, *Where* | "Duck is going home. Who else needs that kind of place?" | pond | Frog | Cow, Rabbit, Brown bear, African penguin | Pig: a wallow can be a pond's edge |
| 6 | Frog, *Where* | "Frog is going to lay eggs. Who else needs that kind of place?" | pond | Duck | Cow, Rabbit, Brown bear, African penguin | As question 5 |

The words-versus-pictures payoff carries into this level: the brown bear's picture is berries, so in questions 1, 2 and 4 only its words show that it also eats grass, or sometimes fish.

**The round.** Three questions from three different key words (so at most one *grass* and one *pond* question), with the frog as visitor at most once. The scene shows three **friends**: one accepted animal (seeded when there are two) and two drawn from the "offered as wrong" column. Each is an animal from `animalArt` standing on a 130-unit card with its printed name. Tapping a friend walks it to the visitor. Right: the two share the fact (both munch the grass, both splash at the pond) and the pet says "{Friend}'s page says {key} too!" (`lookitup.share.right`). Wrong: the friend walks there and back and the pet reads that friend's row: "{caption} That page doesn't say {key}." (`lookitup.miss.share`). Misses follow the level-3 rule.

**Authored first round:** Cow (*grass*; offered Rabbit, Frog, African penguin), African penguin (*fish*; offered Brown bear, Cow, Frog), Duck (*pond*; offered Frog, Rabbit, Brown bear).

**Hints:** the visitor's own page (*Contents*, then its line), then its asked row; then the accepted friend's page and the same row; then the accepted friend. The state "both pages seen" decides which page the next glow points to.

## Accounting, help and finishing

The level-3 rule holds at every new level. Never a miss: the contents page, any page, *Contents*, touching a row, tag or contents line, tapping the visitor (it repeats the ask), a drop on empty ground or the book. A miss: a wrong choice, tag or friend given to the visitor, once per distinct choice. Two misses glow the next hint step (`GLOW_AFTER`); Show a hint does the same; `hints++` at most once per visitor. The supported finish follows the built `HELP_AFTER` (four wrong tries, the game page's recorded gap): the pet opens the page, reads the row and acts the answer out. After the last visitor the round finishes with `ctx.finish({ misses, hints })` and one sticker. Nothing is saved beyond the shell's usual record.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

- **`PLANS`** gains `contents`, `baby` and `share`. **`PAGE_ORDER`** is `ANIMAL_IDS` (the table's order), and the page number is its index plus one.
- **`Visit`** widens: `row` may be `'baby'` (level 5), and a level-6 visit carries `share: number` (an index into `SHARES`) with its offered friends. **`Round`** gains `book: 'tabs' | 'contents'`; `tabs` stays for levels 1–3.
- **The open page** is `AnimalId | 'contents'` in `hintFor`, `lookTouch` and the scene. `LookMove` gains `{ contents: true }` (the button) and `{ line: AnimalId }` (a contents line); `{ choice }` covers tags and friends.
- **`SHARES`**: `{ source, row, ask, key, never: AnimalId[] }`. `acceptedFor(share)` returns every other animal whose same-row line contains the key as a word (*ponds* counts for *pond*), computed from the table.
- **Tests:**
  - Every `SHARES` key appears in its source's caption; the accepted set is non-empty and matches the table above; no animal in `never` or offered as wrong has the key in its caption; the accepted, offered and never sets of each question cover the other six animals exactly once.
  - **Over 500 seeds per level:** level 4 visitors have distinct *Eats* and distinct *Where* pictures and both rows are asked; level 5 never pairs duck with penguin, has at most one of piglet and duckling, and offers exactly the round's three baby words; level 6 uses three different keys with the frog at most once, and each visit offers exactly one accepted friend and two from its offered-as-wrong list. Exactly one choice is right in every visit at every level.
  - The authored first rounds match this page.
  - `hintFor` leads contents, line, row, choice at levels 4–5, and both pages then the friend at level 6, in every reachable state. A scripted level-6 visit (a wrong friend, the same again, another wrong friend, Show a hint twice, a further wrong friend) counts two misses and one hint and ends with the supported finish.
  - **Layout:** `src/games/look-it-up/upright.test.ts` today assumes three tabs and treats every mode but `page` as three rows. Its `targets()` must branch by mode: at levels 4–6 the *Contents* button, then the contents state (seven lines) and the page state (three rows) as separate checks, then the three choices. A new landscape check covers the contents state at 1662 × 768: the left column ends above y 598 and every line is at least 100 tall. Since `LEVELS` drives the level list, raising school's max walks the new levels automatically.

## Speech, how-to, ghost and registration

- **New fixed lines** (`voice.ts`, clips rendered with the batch): `lookitup.instruct.contents` ("Find the animal's name on the contents page, then tap it."), `lookitup.picture-words`, `lookitup.hint.contents` ("Let's go back to the contents page."), `lookitup.hint.line` ("Find {title} on the contents page."), `lookitup.hint.second` ("Now find another page that says {key}."), `lookitup.miss.tag`, `lookitup.miss.share`, `lookitup.share.right`, and `lookitup.page` ("Page {n}. {title}."). Asks, captions and names come from the table through the existing `lookitup.say` and `lookitup.ask` slots, which stay on device speech.
- **How-to card** (`howto.ts`), level-scoped steps: "Tap the animal's name on the contents page to find its page; Contents takes you back" `{ from: 4, to: 6 }`; "Touch a sentence to hear it" `{ from: 4, to: 6 }`; "Give the baby the name tag its page says" `{ from: 5, to: 5 }`; "Read the visitor's page, then find another page that says the same thing" `{ from: 6, to: 6 }`. Note: "The picture shows what an animal looks like; the words can tell what the picture can't" `{ from: 5, to: 6 }`.
- **Ghost finger:** `autotouch()` follows `lookTouch`: *Contents*, the line, the row, then the choice; at level 6, the second page before the friend. Level 4's demonstration first opens one other page to show that looking is free.
- **Registration:** skills unchanged; `describeLevel` as in the ladder table. The game page's generated block and the README tables follow from `npm run game-docs`.
- **Art:** the contents page, its list icon, page numbers, printed captions (text from the palette's ink), name tags (a card on a string) and friend cards. No new animal or picture art.

## Build batches

1. **`look-it-up 2`: levels 4–5.** The fixed book, the contents page and button, printed captions, the *Baby* ask and name tags, upright and landscape layout, the tests above for 4–5, voice and how-to. School max becomes 5.
2. **`look-it-up 3`: level 6, after batch 1.** `SHARES`, friend cards, the two-page hint path, its tests, voice and how-to. School max becomes 6.

## Check tier

- **Each batch, new interaction tier:** `npm run typecheck`; unit tests (the rule tests above, with the difficulty, how-to, registry, lands, clips and `upright.test.ts` walks that read every level); one filtered scripted play with `BROWSER_SUITE=lookitup` on an upright phone viewport after the suite learns the new levels (batch 1: level 4 with one wrong picture and one hint, and the first level-5 visitor; batch 2: level 6 with one wrong friend and one hint); one upright phone screenshot (batch 1 on the contents page, batch 2 mid-share); `fingerdemo` at the new levels; `npm run build` and the offline check, because voice lines and clips are added. Record the tested commit, filter and server URL.
- **This docs slice:** `node scripts/check-links.mjs` and `git diff --check` only.

## Open decisions

Each has a default the build uses; none blocks a batch.

1. **Where a round opens.** Default: the contents page, every round, so each visitor starts with a look-up. Opening on the last page read is a one-line change if play shows the contents page feels repetitive.
2. **Faces on the contents page.** Default: kept, as the study leaned. If a reader skips the names, a later level could print names only; that is a new level, not a change to 4.
3. **Captions read on touch, not on turn.** Default: a turn speaks the page number and title only, on Read & Do's terms. If phone players miss that rows speak, the first page turn of a round could read its rows once.
4. **Pre-K.** Default: pre-K stays at 2–3; contents pages and printed captions are school work.
