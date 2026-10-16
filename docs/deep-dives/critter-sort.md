# Critter Sort deep dive

*ID `critter-sort` · bands pre-K, school · levels 1–9 and 11 (pre-K order 6, 1, 2, 3; school 2, 3, 4, 5, 7, 8, 9, 11) · session `claude/critter-sort-deep-dive` ([PR #316](https://github.com/rjdunlap/neo/pull/316))*

## The game today

Critters, some in top hats, are dragged into hoops whose signs are pictures of a rule. Dropping a critter in the wrong part of the diagram is a miss with a spoken reason (`sort.isnot`, `sort.both`, `sort.not.in/out`); putting it back on the grass is never a miss. Two wrong drops in a row light the hint. Rules, rounds and the bot's order are in `src/games/critter-sort/logic.ts`; the geometry is `hoopCenters`/`sortPlaceAt`/`neitherMat`/`spotFor`. Levels 2, 3 and 5 require an explicit outside answer on a leaf mat; a correct drop explains why the critter belongs there. The hint and ghost finger sort the mat too, and completion waits for every critter. Levels 1 and 6 retain the free leave-it-out choice.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | One hoop, 5 critters, 2 rounds | pre-K | Which critters fit the sign |
| 2 | Two separate hoops, 6 critters, some fit neither | pre-K, school | Left, right, or place it on the leaf mat |
| 3 | Overlapping hoops, the middle is "both" | pre-K, school | Left, right, middle, or neither |
| 4 | Already sorted, 3 rounds: tap the picture of the rule (3 pictures) | school | What the hoop's rule is |
| 5 | One hoop with a red-lined picture ("not"), 3 rounds | school | The critters that do not fit the picture go in; the others go on the leaf mat |
| 6 | Just a few: three critters, one already in the hoop | pre-K, first in its order | Carry the other critter that fits; the outsider can stay on the grass |
| 7 | Five sorted examples and one newcomer, 3 diagrams | school | Place the newcomer, including neither |
| 8 | Sort the same six twice under a new sign | school | Revise the sort when the rule changes |
| 9 | One A/not-B hoop and leaf mat, 2 diagrams | school | Fit the first picture but exclude the second |
| 11 | Sort, freely count each part, compare, 2 diagrams | school | Which part has more (one, two or three) |

**Pools.** Seven animals (`cow duck pig cat bear dog bunny`) times a hat on or off make 14 distinct pictures. Six rules: `hat`, `brown` (bear, dog), `white` (cow, bunny), `floppy` (cow, dog), `pointy` (pig, cat), `whiskers` (cat, bunny). Two-hoop rule pairs are `SEPARATE` (3 pairs) or `OVERLAPPING` (6 pairs). A round never repeats the previous round's rules and has all-different critters; every part of the diagram in play gets a critter, and the guess round offers exactly one rule that sorts the shown critters that way (all rule-tested).

**Known gaps.**
- **Only one independent feature.** Five of the six rules are functions of the animal; only the hat is independent. "Both" is therefore often one animal, and the pool is small enough that a child will see the same pairs within a session. A third feature is already a pending decision shared with Critter Crossing.
- **The hint is not about the miss** (fixed 2026-10-14: `hintFor` points at the critter she just missed). Before, after two wrong drops `hinting` becomes the first unplaced critter that belongs in a hoop (`sorters.find`), not the one she just got wrong, so the glow can jump to an unrelated critter.
- **The guessing level can be passed by elimination alone** and has no "now sort one more" step to prove she holds the rule.
- **No preschool** (pre-K now has the level 6 entry; preschool still waits on decision 1). The school window starts at 2; picture signs and spoken phrases support the rules.
- **Count and second look built.** School level 8 re-sorts the same six by a new rule; level 11 counts each sorted part and compares quantities.
- Couch: none. Journal: no entries. Picnic: none. Controller: none (touch only; the demo is a ghost finger).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Zoombinis, Mudball Wall and Allergic Cliffs ([TERC guide](https://www.terc.edu/edge/wp-content/uploads/sites/30/2021/03/zoombinisandmathplay-1.pdf)) | Attribute puzzles | Puzzles of the first path are about sorting, grouping and comparing; Island Odyssey adds Venn diagrams ([overview](https://www.giantbomb.com/games/3030-26546/)) | Reading a result from the whole group; using a Venn to explain who is where | Try limits and pegs lost |
| Thinkin' Things, Fripple Shop ([TERC review](https://mathequity.terc.edu/gw/html/Thinkin3review.html), [COMPUTE!](https://atarimagazines.com/compute/issue168/78_Thinkin_things.php)) | Boolean orders | Customers ask for "spots and big eyes", then "but not curly hair"; difficulty rises as the child does well; ages about 4 to 8 | "A but not B" as the step after "both" and "not" | The reading of the words, the shop till |
| Hula-hoop Venn sorting ([Still Playing School](https://www.stillplayingschool.com/2014/05/hula-hoop-venn-diagram-sorting.html), [OISE lesson](https://www.oise.utoronto.ca/robertson/lesson-plans/introduction-venn-diagrams), [Science Sparks](https://www.science-sparks.com/make-venn-diagram-hula-hoop/)) | Physical play | One attribute first; two separate hoops; overlap them; let the children choose what each hoop stands for; one piece placed in the middle as the example | A worked example already in the middle; child-chosen labels; sorting toy people by clothing | Worksheets |
| Dimensional Change Card Sort ([Doebel and Zelazo meta-analysis, via summary](https://pmc.ncbi.nlm.nih.gov/articles/PMC1855149), [protocol](https://cdn.vanderbilt.edu/vu-my/wp-content/uploads/sites/412/2012/09/14084326/DCCS.pdf)) | Developmental task | The same cards are sorted by one rule, then by another; most 3-year-olds keep sorting by the first rule, most 5-year-olds switch | Re-sorting the same critters by a new sign; saying the rule aloud each time helps young children switch | The pass/fail scoring |
| Rocky's Boots, Gertrude's Secrets ([Wikipedia](https://en.wikipedia.org/wiki/Rocky%27s_Boots)) | Logic machines | Gates joined, then tested | The long arc to Sorting Machine (older horizon) | Circuit building |
| Counting and classifying standards (CCSS K.MD.B.3; **recalled, not opened**) | Standard | Sort objects into given categories, count each category, sort the categories by count | A count of each part as the last step | None |
| Existing: Critter Crossing, Pattern Train, Memory Match | Siblings | Hidden rules; "and", "not", "or" | Same rule pool and wording; Crossing already shares `fits()` | — |

The search tool returned summaries only; none of these pages was opened in full. The DCCS ages (most 3-year-olds fail the switch, most 5-year-olds pass) and the labeling finding are the search summary's reading of the cited papers.

## What makes sense here

The game already gets the key thing right: dropping a critter back on the grass is free, and a miss always names the rule. The arc is **one rule → two rules → both → what is the rule → not**, and the next steps are the ones physical hoop play and Fripple Shop point at:

1. **A place for "neither", and a worked example.** Hoop teachers put one piece in the middle first; here the first critter of a round can already sit in its place, and the built leaf mat for "neither" makes the outside answer explicit.
2. **A newcomer.** The diagram is already sorted and one more critter arrives (IDEAS round three). It is the same decision with no fixed pile to scan.
3. **A new rule for the same critters** (DCCS). Flexible categories are the point of sorting: the same six critters, a new sign.
4. **"A but not B"**, after "both" and "not".
5. **Her choice of signs** (OISE): free creative choice, then sorting by her own rule.
6. **Count each part**, the standards' last step, as a calm question and not a test.

Left for other games: animal classes (mammal, bird, fish) and habitats belong to Habitat Helpers and the subjects plan; parts of speech to Word Jobs; Sort Four and the logic machine to the 7–11 horizon in [IDEAS](../IDEAS.md). Lives, tries, timers and a score stay out.

## Experience and presentation

- **First unsupported action:** pick up a critter and drop it in the hoop. The first round of level 1 is one hoop and one picture, and she can try any critter first.
- **What feels good, and the consequence:** a drag already ticks on pick-up and pops with a rising feel on a right drop (`sfx.pop(6)`, `cheer()`). Built 2026-10-15: a code-drawn **leaf mat** (a few `Graphics` leaves) in the grass for "neither", with a spoken reason and synthesized rustle (`sfx.whoosh()`) on correct placement. Correct placements rise through pentatonic pop steps (`sfx.pop(6 + number placed)`). Shining hoop rims remain a presentation proposal.
- **Return to readiness:** a wrong drop sends the critter home, which is the draggable's behavior now; nothing blocks the next drag.
- **Variety on replay:** which rule, which critters, which hoop is left or right, and which critter starts sorted. The rule of the game never changes.
- **Reasoning versus reading and motor:** no reading; the signs are pictures, spoken once. Targets are 100+ units. Memory load stays at six critters; the neither mat and the worked example keep the unsorted pile from being the whole picture.
- **Supported ending:** two wrong drops glow the right place for the critter she missed (built); the guessing level's two-miss hint grows the right picture. A sticker follows every finished round, with help.
- **Co-play:** a grown-up asks "why does the dog go in the middle?" (already the hint text); a second child can be the "newcomer" who chooses the next critter. Off-screen: two hula hoops and a basket of toys or socks, the existing suggestion; later, choose the signs with her (Level 10).
- **Needs a person or device:** whether a 3–4-year-old reads the picture signs without help; whether the leaf mat is understood as "neither"; device speech for the new lines; whether the "not" red line reads on a small iPad.

## Proposed ladder

### Fresh content inside existing levels

- **Rules from the art that exists.** The critter art already differs in coat color and features (cow spots and horns, duck bill and wings, pig pink, cat orange, bunny long ears, bear round ears). Colors like pink, yellow and orange each fit only one animal, so they are good only as the *one hoop* rules at the easy entry; "long ears" and "round ears" likewise. A rule test must show any new rule splits the drawn six (at least one in, one out). Real variety in the two-hoop levels needs a second independent feature (Decision 2).
- **A worked example.** One critter in each part is sorted before the round starts, at levels 1–3 (spoken "the cow is already here"). It does not change the rules; the round ends when the rest are placed.
- **Neither mat** (see slice 1): applies to levels 2, 3, 5 and the new levels.

### New levels on top

IDs are appended, never renumbered. 6 is the easy entry; 7–11 are the new top. Band windows below need the `order` and `entryLevels` declarations in Decision 1.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Just a few (**pre-K part built 2026-10-14**; preschool waits on decision 1) | preschool, pre-K (an entry placed before 1) | 3 critters, one hoop, the rule is "wearing a hat" or a single-animal color; one is already inside | Which of the two left critters belongs | A wrong drop is a miss with the spoken reason; one hint glow on the right one | Every round has 1–2 critters that fit, none ambiguous | New plan only; voice reuses `sort.one`; ghost finger unchanged |
| 7 | Where does the new one go? (**school built 2026-10-15**) | school (pre-K optional, not built) | Hoops already sorted by the shown rules; one new critter appears at the foot | The part of the diagram the newcomer belongs in, including "neither" | The usual spoken reason; after two misses the right part glows | The new critter's place is derivable from the shown rules; all four places occur across seeds | Needs the neither mat; new voice line; ghost finger drags the newcomer |
| 8 | A new sign (**school built 2026-10-16**) | school | Six critters sorted by one rule; the sign turns over to a second rule and the critters hop out | Move each critter to its place under the new sign | A wrong drop is a miss with the reason; the spoken sign names the new rule every time | The two rules split the same six differently and both leave something in and out | New transition art; voice `sort.again`; bot sorts twice |
| 9 | This but not that (**school built 2026-10-16**) | school | One hoop with sign A and a red-lined sign B inside it | Critters that fit A and not B | Spoken reason names both parts | Every answer exists (at least one in, one fit-A-but-B, one neither) | New sign layout; voice; how-to line |
| 10 | Pick the signs | school | Critters in the middle; two signs on the table to choose from | Which signs go on the hoops (free), then the sorting by her own rule | Choosing signs is never counted; only dropping a critter against her own signs is a miss | Signs offered always make at least one critter fit each; no pair makes an empty hoop | Needs Decision 3 on whether a creation is kept; no new bot beyond a random choice |
| 11 | How many? (**school built 2026-10-16**) | school | After a sort, tap each critter in a part to count it aloud | The count for each part, then which part has more | Tapping to count is free; only the "which has more" answer can miss | Counts match `placeOf` for every seed; the "more" answer is unambiguous | Spoken numbers already exist; a small number badge; links to Picture Graph |

### Younger-band openings

- **Preschool at level 6** (decision 1): three critters, one hoop, one is sorted already. Needs a `preschool` row in `LEVELS`, a how-to line, registry/lands audits, and a voice check. No toddler opening is proposed: the habit of sorting is better served by Animal Snack and Roundup.

### Easier entries and levels between existing ones

Level 6 is an easy entry appended with a stable ID: preschool `order: [6, 1]`, pre-K `order: [6, 1, 2, 3]` (so the entry is available before the older level 1), school currently `order: [2, 3, 4, 5, 7, 8, 9, 11]`; its proposed full ladder is `[2, 3, 4, 5, 7, 8, 9, 10, 11]`. `entryLevels: [6]` so birthdays land safely. A pre-K child who has saved level 1 keeps it. Nothing is renumbered.

### Left out on purpose

Timers, tries, lives, a score; sorting animals by class (Habitat Helpers); parts-of-speech sorting (Word Jobs); a circuit builder (Sorting Machine, older horizon); a touchscreen "three hoops" Venn (too much for one board, and Critter Crossing covers the logic family); couch play (not a natural fit).

## Decisions for the developer

1. **Open Critter Sort to preschool with the level 6 entry?** Recommend yes; it needs the levels table, voice and saves audit in slice 3.
2. **A third critter feature (bow or scarf), shared with Critter Crossing.** Already listed in [Waiting on the developer](../WAITING-ON-DEVELOPER.md); recommend yes. A size feature (big/little) would be a no-new-art alternative but needs larger hit areas on the small critter.
3. **Is a chosen-signs sort (level 10) worth keeping in the treehouse?** Recommend no creation slot yet; treat it as play only.

## Build slices, in order

1. **Neither mat, a hint on the critter she missed, and worked examples — built.** The hint landed 2026-10-14, examples in [PR #418](https://github.com/rjdunlap/neo/pull/418), and the leaf mat at levels 2, 3 and 5 in [PR #423](https://github.com/rjdunlap/neo/pull/423) (2026-10-15). Correct outside drops are explicit, bare grass stays free, and hints, completion and the ghost finger include the mat. [Verification](../VERIFICATION.md#2026-10-15--critter-sort-neither-mat).
2. **Fresh rules** from existing art (single-animal rules for easy entry only), with the split test. Tier: rules (typecheck and that game's tests).
3. **Level 6 and the preschool opening** (level 6 for pre-K built 2026-10-14 with `order` [6, 1, 2, 3] and `entryLevels` [6]; the preschool row waits on decision 1): plan, `order` and `entryLevels`, registry and lands tests, how-to, voice. Tier: new levels: unit tests, one browser play of level 6 and `fingerdemo`.
4. **Level 7 Where does the new one go? — built** (school only), [PR #426](https://github.com/rjdunlap/neo/pull/426). Five sorted examples, one newcomer, three diagrams; explicit neither mat and existing mistake/hint/bot support. School order `[2, 3, 4, 5, 7]`; IDs and pins preserved. [Proof](../VERIFICATION.md#2026-10-15--critter-sort-level-7-newcomer).
5. **Level 8 A new sign — built** (school only), [PR #428](https://github.com/rjdunlap/neo/pull/428). Sort the same six twice under two different pictured/spoken splitting rules; sign flip, hop back to grass, explicit leaf mat and bot on both passes. School appends ID 8; existing IDs/pins and pre-K unchanged. [Proof](../VERIFICATION.md#2026-10-16--critter-sort-level-8-a-new-sign).
6. **Level 9 This but not that — built** (school only), [PR #436](https://github.com/rjdunlap/neo/pull/436), `codex/critter-sort-nine`, dispatch `critter-sort-nine-20261016T090734Z`. One A/not-B hoop and leaf mat, both-part spoken explanations, seeded accepted/A-and-B/neither witnesses, two diagrams and a clean ghost finger. School appends ID 9; existing IDs/pins and pre-K unchanged. [Proof](../VERIFICATION.md#2026-10-16--critter-sort-level-9-this-but-not-that).
7. **Level 11 How many? — built** (school only), [PR #439](https://github.com/rjdunlap/neo/pull/439), `codex/critter-sort-eleven`, worker `01a14435-4fa4-75c2-bc0c-802e92b789e9`, dispatch `critter-sort-eleven-20261016T101434Z`. Two separate hoops plus the mat contain one, two and three critters. Sort, freely tap to count each part aloud with badges/rings, then choose the uniquely largest part; repeated counting taps do not inflate totals. Two wrong comparisons reveal totals/glow and count one hint. School appends 11, skipping 10; IDs/pins preserved. [Proof](../VERIFICATION.md#2026-10-16--critter-sort-level-11-how-many). Excludes level 10, third feature, bands and saves; device/child checks open.
8. **Third critter feature** (decision 2), shared with Critter Crossing: both games' rule tests plus the fairness test across the larger pool.
9. **Level 10 Pick the signs** (after decision 3): its own definition first.

## What was built in this session

On 2026-10-14 a build session (`claude/critter-sort-just-a-few`) added level 6 for pre-K and the `hintFor` fix; checks in [VERIFICATION](../archive/VERIFICATION-2026-10-14.md#2026-10-14--critter-sort-level-6-just-a-few-and-the-missed-critter-hint). On 2026-10-16 a build session (`claude/critter-sort-worked-example`, [PR #418](https://github.com/rjdunlap/neo/pull/418)) added the worked example at levels 1, 2, 3 and 5 (`SortPlan.example`/`fitting`, `examplePlaces`, `exampleIndices`; voice `sort.example`/`sort.examples`). On 2026-10-15, `codex/critter-sort-neither-mat` ([PR #423](https://github.com/rjdunlap/neo/pull/423)) completed slice 1 with the explicit mat, spoken reasons and mat-aware hints/completion/bot. The deep dive session itself:

Nothing: a deep dive session is research and ideation only. Links and `git diff --check` ran. The genre sources were read through search summaries, not opened in full.
