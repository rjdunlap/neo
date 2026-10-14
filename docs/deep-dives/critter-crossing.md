# Critter Crossing deep dive

*ID `critter-crossing` · bands pre-K, school · levels 1–5 on 2026-10-14 (pre-K 1–3, school 2–5) · session `claude/critter-crossing-deep-dive` ([PR #303](https://github.com/rjdunlap/neo/pull/303))*

## The game today

A bridge gate lets some critters across by a rule. She sends critters to the gate one at a time; one crosses, or waits on the bank with a red mark. At level 1 the sign shows the rule; from level 2 it is a secret, and once enough critters have been tried (`minTests`) the light bulb wakes and she picks the true rule from three or four pictures. Nobody ever falls. Trying a critter is never a mistake; a guess is a miss only if it contradicts something she already saw, and a fair but unproven guess says "try another critter". After two wrong guesses the hint glows the critter whose answer rules out the most pictures (`bestTest`), then the one picture still standing. Rules and tests are in `src/games/critter-crossing/logic.ts`; the rules themselves (`hat`, `brown`, `white`, `floppy`, `pointy`, `whiskers`) and `fits()` come from Critter Sort.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | The gate shows its rule (one picture); 5 critters | pre-K | Which critters fit the sign |
| 2 | Secret one-picture rule, 4 critters, 3 pictures, 2 tests first | pre-K, school | Who to try next; which picture matches who crossed |
| 3 | Secret one-picture rule, 5 critters, 4 pictures, 2 tests | pre-K, school | The same with more choices |
| 4 | Secret two-part rule ("both"), 6 critters, 4 pictures, 3 tests | school | A critter must fit both parts |
| 5 | Secret "one", "not" or "both", 6 critters, 4 pictures, 3 tests | school | Use all the evidence to tell kinds of rule apart |

Each level plays two rounds (`rounds: 2`). Pools: six rules, seven animals (`cow duck pig cat bear dog bunny`) and a hat on or off, so a critter is one of 14 pictures; a round draws 4–6 distinct ones, never all crossing or all waiting. The "not" and "both" wrong pictures are lookalikes that share a half of the truth or are its opposite, and every round is built so trying everyone leaves exactly one picture standing.

**Known gaps.**
- School starts at level 2, so a school child meets only four plans, and only two of them add anything new (levels 4 and 5).
- A critter has only two independent features (animal and hat). "Brown", "white", "floppy", "pointy" and "whiskers" are all functions of the animal, so a "both" rule often reduces to one animal, and "hat and X" is the only truly independent pairing. Richer rules need another visible feature, which is shared with Critter Sort's `SortCritter`.
- Evidence is held only by the red marks and who has crossed; there is no tidy "crossed / waited" shelf to look back at, which is the memory load levels 4–5 lean on.
- Only prek and school play it; there is no preschool or younger entry. Level 1 is the only place the sign is visible, and it never shows "not" or "both".
- Couch: none. Journal: no entries. Picnic: none.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Zoombinis, Allergic Cliffs ([TERC detailed guide](https://www.terc.edu/zoombinis/wp-content/uploads/sites/16/2021/01/ZoombinisDetailedGuide.pdf), [overview](https://mathequity.terc.edu/gw/html/ZoombinisReview.html)) | Hidden-rule bridges | Each puzzle has four difficulty levels; Allergic Cliffs asks which trait one of two bridges rejects, and the other bridge takes the rest | Two bridges as a way to see the rule from both sides; trait rules that get more than one part | Pegs lost per wrong guess and a collapse when they run out |
| Zoombinis, Pizza Pass | Hidden-rule experiment | Build a pizza, read the troll's reaction, infer his rule within limited tries | Choosing the test yourself and reading the answer | The try limit |
| Thinkin' Things, Fripple Shop ([COMPUTE! review](https://www.atarimagazines.com/compute/issue168/78_Thinkin_things.php)) | Attribute sorting with and/not/or | Boolean words arrive one at a time and difficulty rises as the child does well | Introducing "or" after "and" and "not" | Reading of the words; here the rule is a picture |
| Rocky's Boots, Gertrude's Secrets ([Wikipedia](https://en.wikipedia.org/wiki/Rocky%27s_Boots)) | Logic machines | Gates (AND, OR, NOT) are joined, then tested on what passes | A visible gate that can be tested; the long arc toward Sorting Machine | Circuit building, which belongs to the grown-up/older horizon |
| Eleusis ([Wikipedia](https://en.wikipedia.org/wiki/Eleusis_(card_game)), [Pagat](https://www.pagat.com/eights/eleusis.html)) | Card game, a secret rule | One player invents a rule, the others infer it from which plays are accepted | The role swap: she makes the rule and the pet guesses; picking a test that could be wrong | Scoring and rounds that punish a wrong guess |
| 20 questions / "which one?" yes-no games | Spoken play | The questioner learns to ask a question that splits the options | The idea behind `bestTest`: a good test splits what is left | None needed |
| Existing: Critter Sort, Memory Match, Pattern Train | Sibling games | One rule per hoop; two hoops; guess the rule | Wording and art already match | — |

The sources were read through search summaries only; the TERC guide and the Fripple review were not opened in full, and Thinkin' Things' exact ladder is not established here. Eleusis shows the shape of the activity (infer from accepted and refused plays); its mixed feedback and rule-making are the useful parts.

## What makes sense here

Fit the rules: no timers, tries limits, lives or penalties for trying. The game already gets the hardest thing right: experiments are free and only a contradicted guess is a miss. The long arc is **sort by a rule → guess a hidden rule → combine rules (and, not, or) → choose the best test → make a rule for someone else**, which is the Critter Sort → Critter Crossing → Rule Parade → Sorting Machine path in [IDEAS](../IDEAS.md). Within this game that means three things:

1. **"Or"** is the missing connective. Fripple Shop and Rocky's Boots both reach for and, not, or; this game stops at and and not.
2. **Choosing the test.** Today the hint does the clever part (`bestTest`). A level where *she* decides which critter will settle two rival pictures turns the hint's logic into her action, and that is the most transferable skill here (a good test can prove a guess wrong).
3. **Role swap.** Being the gatekeeper for the pet (Eleusis' prophet) lets her make a rule, which is creative rather than a right-or-wrong answer.

Left to wait: a third feature on the critters (needs Critter Sort too), grouping two bridges, and anything that adds speed or a count of tries.

## Experience and presentation

- **First unsupported action:** tapping a critter to send it to the gate. There is nothing to get wrong; the answer arrives as a visible consequence (cross or wait with a red mark).
- **Consequence and readiness:** a crossing critter hops over and the bridge sways; a waiting one gets a mark and stays on the bank. The next critter is ready at once. A concrete addition inside the existing code-drawn tools: a **bank shelf**, two rows of small copies (crossed / waited) that fill as she tries critters, drawn with `critter.ts` at a small scale and kept out of the tap targets, so the evidence is one glance and not a memory.
- **Variety on replay:** seeded animal/hat mixes and which rule is secret, never the rule of the game. Two rounds per level.
- **Reasoning versus reading and motor:** no reading, large taps, 100-unit targets already hold. The memory load of 6 critters grows at levels 4–5; the bank shelf is how to keep that off the child.
- **Supported ending:** a hint glow and, after enough tries, the single picture left. The round always finishes with a sticker, with help.
- **Co-play:** a grown-up asks "what do you think the gate likes?" before she picks; off-screen: a basket of toys and a secret rule ("only the red ones may come in") for a grown-up to run (Eleusis for small children).
- **Needs a person or device:** whether "or" is understood by spoken wording alone, whether the bank shelf reads at tablet size beside the six critters, and speech for new rule words (device speech is never established by a bot).

## Proposed ladder

### Fresh content inside existing levels

- **A bank shelf** of crossed/waited copies, on every hidden level (no rules change). Rule test: none beyond existing; this is a drawing change checked by a screenshot.
- **Alternate spoken hints** that name the tried critter ("the cat with the hat crossed") instead of the generic line. Voice lines only.
- **A third critter feature** (a bow or a scarf) is the real content gain, but it lives in `SortCritter`/`fits()` and is shared with Critter Sort, so it is its own slice and needs a check that Critter Sort's rule tests still hold.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | Either one | school 6–8 | A secret "or" gate such as "hat or whiskers"; 6 critters, 4 pictures, 3 tests | Which critter to try next, then which picture; "or" looks different from "and" because most critters cross | The usual rule: a miss only for a guess the evidence already refutes; hint glows `bestTest` | `or` gates have crossing and waiting critters; trying everyone leaves exactly one picture; "and" and "or" lookalikes are told apart by at least one critter; `bestTest` never rules out the truth | `Gate` gets a kind (`or`), `gateWords`, `gateKey`, new voice words ("or"), the picture for "or" in the options, how-to line, bot unchanged |
| 7 | Settle it | school 6–9 | Two pictures are still standing after some tries; the waiting critters can answer | Which waiting critter would settle the two rival pictures; tapping one that both pictures answer the same way is a free experiment with a gentle "they'd both say the same", never a miss | Experiments are free; two "same" tries glow a critter that splits them (counted as one hint) | A generated round always has at least one splitter and at least one non-splitter among the waiting critters; the splitter ends with one picture left | New round shape, new copy, bot picks the splitter |
| 8 | Be the gate (proposal) | school | She picks a rule from the pictures; the pet sends critters and she taps cross or wait | Applying her own rule to each critter | A tap that disagrees with her rule says "that one fits" and is not a miss; no scoring | The pet's guess is correct when the answers are consistent | New interaction (role swap), a family-role slice; see decisions |

### Younger-band openings

Level 1 is already simple enough to open to preschool in principle (five critters, a sign with one picture), but it would need a preschool band entry in the game's `LEVELS` table and an audit of the home spot, voice and old saves. Left as a decision below. A lap or toddler opening is not proposed.

### Easier entries and levels between existing ones

- **A visible "not" gate** (the sign shows the picture with a red slash) placed between levels 1 and 2 as an appended entry ID and `order` slot, so pre-K sees "not" before it has to infer it. Declare it in `entryLevels`. Rule test: a visible `not` round has critters on both sides; the bot sends the critters that do not fit.
- **A school start at 2** is deliberate: a school child skips the sign-only level. Keep it.

### Left out on purpose

Try limits, a pegs-style cost for trying, a countdown, a score, a "the gate bites" fail state, hiding already-tried critters, two simultaneous bridges (that is Critter Sort's two hoops), and a Rocky's Boots circuit builder (a grown-up/older horizon, in [IDEAS](../IDEAS.md)).

## Decisions for the developer

1. **Open Critter Crossing to preschool at level 1?** Needs a preschool row in the levels table and an audit of voice and saves; recommend yes, after the visible "not" entry exists.
2. **A third critter feature (bow or scarf), shared with Critter Sort.** It enlarges both games' rule pools; recommend yes, as its own slice with both games' rule tests run.
3. **Role swap (level 8) and its seat credit** follow the family-role decisions already listed under [Waiting on the developer](../WAITING-ON-DEVELOPER.md#waiting-on-the-developer); not buildable until those are made.

## Build slices, in order

1. **Bank shelf** (crossed / waited copies on hidden levels). Screenshot in landscape and portrait, `fingerdemo` for `critter-crossing`; no rule change. Tier: existing-game bug fix on an unchanged interaction.
2. **Level 6, Either one**: `or` gates, words, lookalikes, voice, how-to, README and GAMES lines, ghost finger. Tier: typecheck, that game's rule tests, one browser play of the new top level and `fingerdemo` at it.
3. **Level 7, Settle it**: the splitter-choosing round. Same tier as slice 2.
4. **Visible "not" entry** between levels 1 and 2 with `order` and `entryLevels`. Rule tests, one play, `fingerdemo`.
5. **Third critter feature**, shared with Critter Sort (after decision 2): rule tests for both games plus the fairness test across the larger pool.
6. **Preschool opening** (after decision 1): levels table, registry and lands tests, voice.
7. **Be the gate** (after decision 3): a new interaction; its own definition first.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Only documents changed; links and `git diff --check` were run. The genre sources were read through search summaries, not opened in full.
