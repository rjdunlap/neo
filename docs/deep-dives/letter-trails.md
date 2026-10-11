# Letter Trails deep dive

*ID `letter-trails` · bands preschool, pre-K, school · levels 1–8 on 2026-10-11 · session `claude/tender-faraday-xt9q70` ([PR 122](https://github.com/rjdunlap/neo/pull/122))*

## The game today

A firefly sits on the start of a letter's first stroke. She drags it along a faint trail; it only moves forward through ordered checkpoints, so a shortcut across a curve does not count, and a moving yellow dot runs ahead along the stroke to show the way. A finished stroke sparkles and she lifts and puts the firefly down on the next stroke (a new touch for every stroke; the code waits for the lift). When the last stroke is done the letter becomes a code-drawn picture for 2.6 seconds with a spoken line ("A is for apple"). `skills`: letters, fine-motor, writing. Story Grove (`lands.ts`, first in its list, with Story Steps, Word Monsters, Photo Safari, Goodnight Room, Rhyme Time, Opposites and Clap the Syllables). Music `STYLES.paint`. **Not a couch game, not in the journal, not in the picnic.** There is no `logic.ts`: the plan table, the choice of letter or word, the tolerance per level and the miss rule all sit in `index.ts`; the stroke data and `advanceTrace` are in `strokes.ts` with a test file.

Strokes are capitals only, in a 0–1 box, 48 strokes for 26 letters (E has four, B, F, H, I and R three, a dozen letters one). Curves are polylines sampled every 0.025 of the box. The trace box is `min(view.h − 260, view.w − 360, 520)` units: 508 on a 1024×768 view, 408 in portrait. The corridor is 0.095 of the box on levels 1–2 and 0.075 after (about 48 and 38 units either side at 508; 39 and 31 at 408). The firefly's touch area is 112 units across. A **miss** is one drag that wanders more than twice the corridor (about 76–97 units at 508) from the next checkpoint: the firefly stays where it was, the voice says "Come back to the firefly", and a second wandering drag on the same stroke glows a ring on the firefly and counts one hint (once per stroke). Lifting never loses progress.

| Level | Plan | Bands whose window includes it | One round |
| --- | --- | --- | --- |
| 1 | `ILT` "straight strokes" | preschool | One of I (3 strokes), L (1), T (2); corridor 0.095 |
| 2 | `EFH` "more straight strokes" | preschool | One of E (4 strokes), F (3), H (3); corridor 0.095 |
| 3 | `AKMNVWXYZ` "diagonal strokes" | preschool, pre-K | One of nine letters; M, N, W and Z are one zig-zag stroke |
| 4 | `CGOQSU` "rounded strokes" | preschool, pre-K | One of six |
| 5 | `BDJPR` "straight and rounded" | preschool, pre-K | One of five |
| 6 | all 26 capitals | preschool, pre-K | One letter, drawn at random from 26 |
| 7 | short word | pre-K, school | CAT, DOG or SUN (3–5 strokes); a picture after each letter |
| 8 | the child's name | pre-K, school | `nameLetters(childName)` (A–Z only, up to 40 letters, `PIP` if empty); a picture after each letter |

Bands (`LEVELS`): preschool 1–6, pre-K 3–8, school 7–8. A school child therefore only ever meets three fixed words and her name. Mistakes teach: a wandering drag boings and says "Come back to the firefly. We can take our time"; two on one stroke glow the firefly. `misses` is the number of wandering drags and `hints` the number of strokes that reached two.

**What each round draws from.** 26 stroke tables, 26 pictures (`letterPicture`: apple, ball, cat, duck, egg, fish, grapes, house, ice cream, jelly, kite, leaf, moon, nest, orange, pig, queen, rainbow, sun, tree, umbrella, violin, whale, xylophone, yo-yo, zebra; C, D and P are the `Critter`s), four voice lines in use (`trails.start`, `trails.stroke`, `trails.wrong`, `trails.picture`) and one unused (`trails.word`, "Let us draw {word}!"). The same pictures are the sticker (`letterPicture` of the seed's letter), the hub icon's letter A, and **Word Monsters level 4's prompt pictures**. The how-to card has a step per level boundary (`{ from: 7 }`) and the ghost finger plays every level (`autotouch` follows the real turns of the stroke).

**Known gaps, read from the code (nothing was played or run; this session has no installed dependencies).**

1. **Three capitals start at the bottom.** The HWT teaching-order sheet I opened says "All capitals start at the top. Strokes are made in the correct sequence." In `LETTERS`, the first stroke of A, M and N begins at y = 1; every other letter's first stroke starts in the top 15% of the box (a scan of the file). So the firefly makes a child draw A, M and N upward, the reverse of the habit the sheet is after, and that habit is the point of the game. Her name is the likeliest place to meet them. What is convention (one pen lift or two for M, N, W, Z, K) is separate and waits on the stroke-convention decision; only the *start* is fixed here.
2. **Two things to check against a chart, not fix.** I's three-stroke form (stem plus two bars) and T's order (bar, then stem) are choices; I opened no source that settles either. They are listed for the chart check, not changed.
3. **Level 7's "word" is not shown as a word.** The letter pictures play after each letter, so DOG shows a duck, an orange and grapes and never a dog. `trails.word` was written for the word and is never played. The pool is three words forever.
4. **Level 8 can run for minutes.** `nameLetters` keeps up to 40 letters, every letter adds a 2.6 s picture and a 0.2 s pause, and a name of eight letters is about 14 strokes. Word Monsters' planned name level caps at eight.
5. **Accounting grows with length.** Every wandering drag counts one miss and `wrong` resets on each stroke, so a hint can count once per stroke. Four misses or two hints make a round "struggling" (`difficulty.ts`). A single letter at level 4 has one stroke to get four misses from; a name with 14 strokes has 14 chances, so the step-down fires more easily on long rounds. Every multi-letter level added on top inherits this.
6. **The level cap is a literal.** The constructor clamps with `Math.min(8, …)` and `LEVELS` holds 8 as a number, so a ninth plan would play as level 8.
7. **The how-to is unbounded above 6.** Its step and finish lines use `{ from: 7 }` with no `to`; on any later level that is not a word or name they would be false (a test does not catch it).
8. **No rule is under test.** Which letters a level offers, which words, the name rule and the tolerance per level are untested because they are not in a `logic.ts`. `strokes.test.ts` covers the data and `advanceTrace` only.
9. **The ladder is by shape, not by what a hand can do first.** Level 3 asks for nine diagonal letters, including M, N, W and Z, before level 4's rounds. Pre-writing norms put copying a circle before a diagonal ([a practitioner checklist I opened](https://www.growinghandsonkids.com/pre-writing-skills-checklist-kids.html): circle 3, diagonal 4½, X 5). Tracing is easier than copying and IDs cannot be renumbered, so this is recorded as an inversion rather than a change.
10. **The hint adds nothing.** The ring appears around the firefly, which is parked at the last checkpoint and is exactly where she is told to go; a child who is lost needs the next stretch shown.
11. **The sticker and the pictures are one thing.** `sticker()` uses `letterPicture`, so redrawing one picture changes the art of every saved sticker (the sticker is its seed, not a stored picture).
12. **Letter names are spoken by device speech.** "Follow the firefly to draw {letter}" and "{letter} is for {word}" pass a bare capital to the voice. Whether the iPad says "A" as the letter and not the article is the open check in the [roadmap](../ROADMAP.md#needs-a-person-or-a-device) that Word Monsters also depends on.
13. **Two pictures are poor sound anchors** (I is for ice cream, O orange, X xylophone begin with other sounds). Harmless here because the game claims no sounds; Word Monsters level 4 reuses these pictures with first-sound prompts, so a redraw is shared (see "Who owns what").
14. **Not a bug, checked.** Moving across a pen lift never draws (the next stroke needs a new touch); a drag cannot skip a curve (`advanceTrace` and its test); a finger returning from far away must meet the current checkpoint; the firefly's touch area is 112 units and `draggable` handles cancel, lost release and one finger at a time; the demonstration route keeps every real turn. Corridor sizes, whether a three-year-old can use them, and how the portrait and phone views look were **not** played here.

## Similar games

Tracing apps copy each other, so the references run from classroom method to current apps. **Opened** means I read the page or file; **search summary only** means I saw only a search result's summary. App-store listings are marketing claims.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *LetterSchool* ([listing](https://apps.apple.com/us/app/-/id435476174), **search summary only**) | paid tablet app | Three steps for each letter: tap the dots in order to learn where to start, trace it, then write it from memory. A parent chooses the handwriting style (Handwriting Without Tears, D'Nealian or Zaner-Bloser); the Gold level lets an adult see the child's actual writing. A review says its scoring is path-following, not handwriting evaluation | **Tap, trace, write** as a guide that fades; a start that is shown before it is drawn; the style as a choice | Paid levels and an adult progress screen. Whether the writing step is judged is the part nobody can verify |
| *Writing Wizard* ([listing](https://apps.apple.com/us/app/-/id1305242235), **search summary only**) | paid tablet app | Shapes, then letters, numbers and words; "5 Stars" mode traces a letter or word five times, each time harder; a finished trace plays an animation; parents can add their own words with recorded audio | Several tries in one round with the support dropping each time; **the grown-up's own word list**; shapes before letters | Paid letters and word packs; reports |
| **Handwriting Without Tears** teaching order ([the teacher's guide sheet](https://legacyd7.lwtears.com/files/HWT-TEACHING-ORDER-PRINT.pdf), **opened**) | classroom programme | Capitals first, in groups: Frog Jump (F E D P B R N M), Starting Corner (H K L U V W X Y Z), Center Starters (C O Q G S A I T J). Lowercase in five groups: c o s v w t, then a d g (begin with a "magic c"), u i e l k y j, p r n m h b, f q x z. "All capitals start at the top"; "all lowercase letters (except d and e) begin at the top"; b and d, g and q are taught in different groups to avoid reversals | The **order and the groups** for lowercase; the start-at-the-top rule; separating mirror pairs. It is *one* programme's convention, not a standard | The Gray Blocks and Mat Man props. Its cursive teaching is a separate sequence |
| *Montessori sandpaper letters* ([Montessori Mom](https://montessorimom.com/sandpaper-letters/), **search summary only**) | classroom material | Trace a rough letter with two fingers in the writing direction while the teacher says its sound; three letters at a time, chosen to look and sound different; lowercase usually first | The touch-and-say pairing; a small contrasting set; saying the sound as she traces | The lowercase-first order (the HWT order is capitals first and the island's ladder already starts there) |
| *ABC Star* and similar free tracing apps ([listing](https://apple.co/2Tnyq0b), **search summary only**) | paid/free apps, ages 1–6 | Solid and dotted guide lines; upper- and lowercase, then numbers | A guide that is **solid, then dotted** | Anything beyond what the listing says |
| **Multisensory handouts** ([NHS Wales OT](https://bcuhb.nhs.wales/services/hospital-services/occupational-therapy/childrens-occupational-therapy/service-areas/east-area-wrexham-and-flintshire/forms-and-pdfs/ecot-s009-multi-sensory-letter-formation/), [programme 1](https://sbuhb.nhs.wales/files/children-and-young-people/ot/develop-letter-formation-using-multi-sensory-techniques-programme-1-done-pdf/), **search summary only**) | clinic handouts | Round letters first in shaving foam or a sand tray, then "down, up and over" letters; air writing before finger tracing; always finished on lined paper | The **off-screen** suggestions for every level; round-letters-first as a reason to keep level 4 early; paper as the real goal | Their claims of benefit beyond practice (they are practitioner opinion, not trials) |
| **Pre-writing strokes** ([a practitioner checklist](https://www.growinghandsonkids.com/pre-writing-skills-checklist-kids.html), **opened**) | developmental checklist | Vertical line (imitates at 2, copies at 3), horizontal (2½ and 3), circle (2½ and 3), cross (3½ and 4), square (4), diagonal (4½), X (5), triangle (5) | The order for a shapes-before-letters entry; ages as rough guidance only | Treating the ages as norms; they differ between sources and this one is a blog |
| **Name writing** (Puranik and Lonigan, [PMC3309424](https://pmc.ncbi.nlm.nih.gov/articles/PMC3309424), **opened**; [Reading Rockets summary](https://www.readingrockets.org/research-by-topic/contributions-emergent-literacy-skills-name-writing-letter-writing-and-spelling), **search summary only**) | research | Children 3 to 5 (n = 372) showed writing features in this order: linearity, segmentation, simple units, left-to-right direction, then complex characters, random letters and invented spelling. Name writing is a distinct, easier task | Her own name as the best first word; a tolerant start (any line is welcome) | Using name writing to judge her overall writing: the authors caution against it |
| **Does tracing teach letters?** ([Longcamp and colleagues 2005 via secondary summaries](https://www.psychologicalscience.org/observer/getting-it-in-writing), [Zemlock and colleagues 2018](https://can.lab.indiana.edu/publications/pub-files/2018-zemlock-vinci-booher-and-james-read-writ.pdf), **search summaries only**) | research | Preschoolers who wrote or traced handwritten forms recognised letters better than those who typed or only looked | A reason for the game to exist: movement helps letter recognition | A claim about **finger on glass** replacing pencil: I found no study comparing finger and pencil in preschool, so the grown-up's page says pencil and paper are the real goal |
| **Standards** ([Common Core L.K.1.a](https://www.thecorestandards.org/ELA-Literacy/L/K/1/a/), **opened**) | standard | "Print many upper- and lowercase letters" (kindergarten) | The reason a pre-K window may include the first lowercase | Treating it as a grade gate: nothing gates here |

*Khan Academy Kids and Starfall* turned up nothing I could cite about tracing progression, so they are not in the table.

## What makes sense here

**Letter Trails' own axis is the hand: how a letter is formed.** It is not a reading game (Word Monsters owns sounds and spelling) and not a drawing game (Rainbow Fingers and Stamp Studio own free marks). What the game can teach, and what the sources agree on, is **where a stroke starts and which way it goes**, learned by feeling the movement. Five points shape the plan.

- **Fix the start first.** The programme sheet's rule is the one rule here that a test can assert: every first stroke starts at the top. Three capitals break it.
- **Fade the guide, don't judge the drawing.** LetterSchool's tap, trace, write and Writing Wizard's five tries both lower the support in steps. The island can do it without grading a freehand scribble, which is a judgment no test can make: the checkpoints and their order stay exactly as they are, and only what is drawn fades (a ribbon, then dots, then a start dot). A wandering drag brings the ribbon back. This keeps "an acceptable alternative solution" defined: the same path, the same direction, the same stroke order, and no other.
- **Little letters, in a source's order.** Kindergarten asks for both cases, and the one source I opened teaches lowercase in five small groups with the mirror pairs apart. Lowercase needs a four-line frame and 26 new stroke tables, and the stroke convention is the roadmap's unsettled decision, so the lean is to adopt that programme's groups as an order and wait for the developer's call on the chart.
- **Words and names, in their own pictures.** Level 7 should end on the word's picture (the dog), not a letter's. Her name, her pet's name and the names of people she loves are the best words; the name today is all capitals, which is not how she will write it.
- **Shapes before letters is a younger band, not a first round.** A line, a circle, a cross. That is a real entry for toddlers, but level 1 as it stands is a three-stroke I that boings on a wander, which is not it.

**Who owns what.**

- *Word Monsters* owns sounds, spelling and building words from sounds; Letter Trails owns forming the letters. Both use the same words and the same `letterPicture` table, so **any change to a picture or a word list goes through one shared table**, coupled to Word Monsters' [fresh content 7](word-monsters.md#fresh-content-inside-existing-levels) (igloo and octopus drawings) and its level 4. Word Monsters also plans to move `nameLetters` to a shared place; this plan keeps it where it is until that slice exists.
- *Number Trails* ([chunk 4](../ROADMAP.md#next-up)) is the proposed numeral twin: a `DIGITS` table beside `LETTERS` and the same `advanceTrace`. Whether it is a mode of this game or its own game is **the developer's call** (decision 5); this plan keeps digits out of the letter levels either way.
- *Rainbow Fingers* owns free, unguided marks (lap and toddler finger painting). *Lasso Loops* owns drawn loops around things. *Dot Link* joins matching dots. A shapes entry here differs in having one guided path and a firefly, and the lap band is left to Rainbow Fingers (see "Left out").
- *Rhyme Time* and *Clap the Syllables* are untouched.

**Arc by band.** Toddler: shapes with the firefly (waits). Preschool: straight, round and crossing capitals, then a letter three times with the guide fading. Pre-K: all 26 capitals, her name, the first little letters. School: little letters in groups, words in lowercase with their picture, her name written as a name, then words that matter to her (her pet's name, a grown-up's list). Grown-up: cursive, joined words (a sketch).

## Proposed ladder

### Fresh content inside existing levels

Saves, IDs and the sticker do not change for any of this. Every drawing is code-drawn and every sound synthesized or spoken.

1. **Every capital starts at the top** (all levels). Re-draw A as a stroke down from the apex, then the second leg, then the bar, and M and N from top-left, keeping the number of lifts you decide in decision 1. Test: the first point of every letter's first stroke is in the top quarter of the box; the existing sampling and `advanceTrace` tests still hold; **prove it by restoring the old data and watching the new test fail on exactly A, M and N**.
2. **A `logic.ts`** (all levels). Move the plan table, `letterFor(level, rng)`, the word pool, the name rule and the tolerance per level out of `index.ts` into a testable module; make `LEVELS.school.max` and the constructor clamp follow the plan length; bound the how-to lines. Test: each level offers only its own letters; level 6 can offer all 26; no word contains a letter without strokes; tolerance is non-increasing across levels 1–8.
3. **Name and word guards** (levels 7–8). Names are capped at eight letters (what Word Monsters plans); a longer name traces its first eight and the sign shows the whole name in print (decision 4). Report at most one miss per letter and one hint per letter, so a long round does not step her down faster than a short one (decision 3). Letter pictures after each letter shrink to a short flourish and the **word's own picture** plays at the end: the dog, the cat, the sun. `trails.word` is used. Test: a name of any length never exceeds eight letters or a bounded number of strokes; per-letter miss capping; every word in the pool has a picture.
4. **More words** (level 7). The pool grows from three to about twenty pictured words that are also Word Monsters' build words (cat, dog, sun, pig, hat, cup, cap, can, box, bed, hen, net, bus, rug, map…), each with a drawn picture from the shared table, in capitals. A round draws one. Test: each word's letters all have strokes; each word has a picture; at most five letters.
5. **A hint that shows the way** (all levels). After two wandering drags on one stroke the firefly flies the next stretch of the trail by itself and comes back (counted once, as the ring is today). Test: the replay path equals the next checkpoints; one hint per stroke.
6. **Start arrows, a rising tune and trail looks** (all levels). A small arrow at the start of each stroke; the firefly's note climbs a pentatonic step for every fifth of a stroke; the ink changes with the round's seed (teal, rainbow, glitter, sand). Music is not silenced because she is not making a tune. Test: looks never change the accepted path (a seed does not move a checkpoint).
7. **Journal entries** (all levels). Twenty-six "A is for apple" entries with a spoken line, filed by `RoundResult.discoveries` only when that letter was traced to its end; the unfound card says "trace A in Letter Trails". Test: every letter has an entry with a line and a source; `cleanJournal` drops unknown ids. The save's journal bound is "known ids only", so this adds 26 ids and no new field.
8. **Letter-name lines** (all levels). The prompts say the letter's *name* ("ay", "bee", "cee"…) as respelled lines rather than a bare capital, if the speech check says the voice mangles "A" or "I". Test: a line for each of 26 letters. Waits on the device check.
9. **Co-play and off-screen matched to each level.** Co-play: "say the letter's name together as it draws", "you be the firefly: trace it on my back". Off-screen: writing in sand, salt or shaving foam, air writing, then paper ([the NHS handout](https://bcuhb.nhs.wales/services/hospital-services/occupational-therapy/childrens-occupational-therapy/service-areas/east-area-wrexham-and-flintshire/forms-and-pdfs/ecot-s009-multi-sensory-letter-formation/), search summary only).

### New levels on top

IDs are appended, never inserted. **Windows (lean):** preschool 1–6 and school's lower bound 7 stay as they are; pre-K 3–8 becomes **3–10**; school 7–8 becomes **7–17** (18 follows decision 6). Each level slice raises `LEVELS.school.max`, updates `describeLevel` and the how-to `LevelLine`s and teaches the ghost-finger bot its rule (`autotouch` follows checkpoints, so most levels need no change). Levels 10–15 need the four-line frame and 26 lowercase stroke tables and **wait on the stroke-convention decision**.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Three times | pre-K, school | One capital from levels 1–6. The firefly guides the first try with a solid ribbon, the second with dots, the third with only the start dot. One sticker for the three | following the stroke from less and less guide; the first level where the hand, not the eye, leads (LetterSchool's trace-then-write, Writing Wizard's five tries) | A wandering drag brings the ribbon back for that stroke; the hint is the show-me replay; no try can fail. **Acceptance is unchanged**: the same checkpoints, the same direction and stroke order, nothing freehand | the visible guide per try is solid, dotted, start-only; `advanceTrace` is called with the same points on all three; a missed try restores the ribbon; the bot completes all three | M. A guide-style switch in the draw code and a `logic.ts` plan; no new art. 9 is shorter than 8 (accept the inversion) |
| 10 | Little letters like their capitals | pre-K, school | A four-line frame (top, middle, base) with a tiny capital beside it. "c" drawn in the middle space | forming c o s v w t in the lower-case size (programme group 1) | Same as the capitals: a wander boings, two glow; the capital beside it is a free peek | every stroke lies in the frame's bands (x-height, or ascender for t); the first point is at the top (d and e excepted, see level 12); the group's letters are the programme's; the six letters have a picture | L. 26 lowercase stroke tables are authored in tranches with the levels that use them; a frame drawn in `Graphics`; a stroke-convention decision (decision 1) |
| 11 | Magic c | school | The frame, and "a": start like a c, then a line down | a, d, g, which start with the same curve, then a line; ascender and descender placement | As level 10 | a d g strokes start on the c-curve; d's ascender and g's descender reach the top and bottom lines; b and d are never in one level's pool | M. Needs level 10's frame |
| 12 | Lines and hooks | school | "i" with its dot, "l", "t" crossed low | u i e l k y j (programme group 3); e and d are the two that do not start at the top | As level 10 | the letters are the group's; the dot of i and j is a second stroke; heights are right | M |
| 13 | Down, up and over | school | "n": down the stem, back up, over the hump | p r n m h b (programme group 4) | As level 10 | b and d never appear in one level; stems reach the right line; p's descender reaches the bottom | M |
| 14 | The last four | school | "q", with a hint that its tail turns right | f q x z; q is separate from g by design (programme note) | As level 10 | q's tail turns right, g's left (mirror pair), f starts with its hook | M |
| 15 | Big and little | school | A capital sits ghosted beside the frame; trace the matching little letter | pairing the two cases while forming the small one (K.1.a: both cases) | As level 10; the capital is shown, never judged | every letter appears with its own capital; any of the 26; no letter is asked twice in a round | S–M. Reuses 10–14's tables and Word Monsters' "Big and little" idea (no overlap: that one matches, this one writes) |
| 16 | Little words | school | The word "cat" in little letters, then its picture | writing a short word with the letters joined by spacing only (not cursive) | Same; the word's own picture is the reward; no letter picture | every word has a picture and strokes in the frame; at most five letters; the pool shares Word Monsters' words | M. Needs the shared words-and-pictures table and 10–14's tables |
| 17 | My name | pre-K, school | "D" then "ana": a capital first, small letters after (how a name is written) | writing her own name as it is written; Puranik and Lonigan: name writing as its own easier task | Same; each letter says its name as it is traced | the name starts with a capital and continues in small letters; names are capped at eight letters; accents fall away; `PIP` is the fallback; no letter without strokes | M. Level 8 stays all capitals so no saved play changes; the pet name needs nothing here |
| 18 | Words that matter (decision 6) | school | Her pet's name, then a word a grown-up has typed: "Mum", "Nana", "Biscuit" | writing the words that are hers | Same | the list is bounded (at most six words of at most eight letters, A–Z only); an empty list falls back to the pet and her name | M–L. A bounded "my words" list in the grown-ups' page and the save (repair, migration, backup tests); a pet name in the `GameContext`: **shell tier**, not the new-levels tier |

**Inversions to accept or fold into the level-order decision:** 9 is shorter than 8; 10 (a single little letter) is shorter than 8 (the whole name) and 17 is harder than 16 for a child whose name is long. The order follows the programme's capitals-then-lowercase sequence, then words, then names.

**Sketches (not levels yet):** **Cursive** for the later school years (a joined word is one continuous firefly path, which suits the checkpoint rule; the programme's cursive poster lists c a d g as a first group, search summary only; it is a new stroke-data set and a style decision); a **greeting card** (trace "happy birthday" and keep it as a picture, which needs a new creation kind); **left-handed mirror** support (the firefly and corridor are symmetric, but the beacon's direction is not).

### For grown-ups: targeting, off-screen and the couch

**What a grown-up can aim at.** `describeLevel` is the one line the grown-ups' page shows next to "Stay on N" (today "Follow straight strokes: I, L, T"). The picker lists the levels of her band's range, so a pre-K player can be pinned 3–10 and a school player 7–17. The how-to card's held arrows move a round without changing her saved level. The text below is the proposed `describeLevel` (the skill and one example), with the standard and an off-screen idea.

| Level | Skill, as a grown-up reads it | Standard | If she is stuck, off screen |
| --- | --- | --- | --- |
| 1 | Following a line: I, L, T | pre-writing: line | Draw big lines in sand or salt, saying "down" |
| 2 | Straight strokes with a turn: E, F, H | pre-writing: cross | Tape lines on the floor and walk them |
| 3 | Diagonal strokes: A, K, M, V, X | pre-writing: diagonal, X | Air-write a V with a whole arm |
| 4 | Round strokes: C, O, S, U | pre-writing: circle | Shaving foam on a tray, circles first |
| 5 | Mixed strokes: B, D, J, P, R | L.K.1.a | Paper letters to trace with two fingers |
| 6 | Any capital | L.K.1.a | Pick a letter from a book and trace it on the back |
| 7 | Tracing a short word: CAT | L.K.1.a, name and word writing | Write the word with a finger in a tray |
| 8 | Tracing her own name | name writing | Her name on a card with a start dot for each stroke |
| 9 | The same letter three times with a fading guide | trace then write | Trace, then dotted, then a start dot, on paper |
| 10–14 | Little letters in five small groups | L.K.1.a | Write on lined paper with a finger first |
| 15 | Big and little together | L.K.1.a, RF.K.1.d | Match capital and small letters on cards |
| 16 | A short word in little letters | L.K.1.a | A word on paper with a picture beside it |
| 17 | Her name, the way it is written | name writing | Write her name on a drawing |
| 18 | Words that matter to her | name and word writing | A card for someone she loves |

*Finger tracing is a bridge, not a replacement:* I found no study comparing finger tracing to pencil in preschool, and the page for grown-ups should say that paper and pencil are where the skill is used.

**Couch play today.** Letter Trails has no couch entry. A zero-lift trace with a controller is not a task worth a face-off, and a duel over who traces faster would reward speed. Left out.

### Younger-band openings

**Toddler is not a clean kind-C opening.** Kind C opens level 1 unchanged to the next band down. Level 1 is I, L or T with a corridor of 0.095, and I is three strokes; a vertical line is copied at about three on the practitioner checklist, and a wandering drag boings. The honest options:

1. **Kind C in a lighter form (needs a person check, probably fails as is).** A toddler pool at level 1 chosen on `ctx.band` of single strokes only (L, V, C: one stroke each) with a wider corridor, no boing and no miss counting. This is a small slice but it changes level 1's meaning for one band.
2. **Kind D: a Shape Trails entry below level 1** (the next section). This is the lean, because it also fits the pre-writing order. It waits on the level-order decisions.

Either way the couplings are the same: Story Grove and Daisy Meadow (toddler's home spot) gain a game, `landLayout` runs for the toddler band in the `lands` test, the README and roadmap counts rise (Letter Trails would be in toddler's list), and a person has to try it with a two-year-old. **Lap is left out** (see below).

### Levels below level 1 (waiting on the level-order decisions)

These wait on [how levels are ordered and whether a band's range may skip](../ROADMAP.md#waiting-on-the-developer). IDs are assigned when built (19 and up); a cheap order is an appended slice for the younger band, easy to hard, with its own range per band.

| Entry | Band | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- |
| **Shape Trails: lines and a circle** | toddler (and preschool) | One long vertical line, then a horizontal one, then a big circle, with the firefly and a wide corridor (about 0.14). The finished shape becomes a picture (a tree trunk, a ball, a sun) | following a single guided path | No boing: a wander just waits for her; two wanders show the way; no miss counting | corridor width ≥ 100 units on screen; every shape closes or ends where it starts; shapes are single strokes | M. Shape tables share `strokes.ts`; three pictures, reusing existing letter pictures where one fits (ball, sun) |
| **Shape Trails: cross and square** | preschool | A plus (two strokes), then a square (one stroke with four corners) | where one stroke ends and the next starts | As level 1 | the cross is two strokes; the square starts at the top-left corner and goes clockwise | S–M. Pictures: a kite |
| **Shape Trails: diagonals, X and triangle** | pre-K | A slope, an X (two strokes), a triangle | the diagonal, hardest on the checklist | As level 2 | triangle closes; X strokes cross at the middle | S–M |
| **Just a squiggle** (decision 7) | lap | Nothing guided: the firefly follows her finger anywhere and leaves a glowing trail | nothing: cause and effect | none | not built; Rainbow Fingers already owns this | — |

### Left out on purpose

- **Grades, stars, scores for neatness or accuracy, and "perfect" rounds.** LetterSchool's own scoring is path-following (a review's words, search summary only), and nothing here ranks.
- **A freehand "write it from memory" that is judged.** No test can say what counts as the letter; level 9 keeps the checkpoints.
- **Timers, speed and a trace-it-fast mode.** A letter waits for her.
- **Paid word packs and adult progress reports** (Writing Wizard's model). One sticker per completed round is the reward.
- **Lap play.** A lap child's scribble is Rainbow Fingers' level 1; a guided path adds nothing for her yet.
- **A second script and accented letters.** Accents fall away to A–Z (`nameLetters`); other scripts need their own stroke data.
- **A couch trace face-off.**
- **Claiming that tracing teaches handwriting.** The evidence I found is for practice by hand in general; the page for grown-ups says so.

## Decisions for the developer

1. **The stroke convention** for capitals, lowercase and, if it becomes a mode, numerals (the existing [roadmap row](../ROADMAP.md#waiting-on-the-developer)). Lean: follow the programme whose sheet I opened (groups and start-at-the-top) and check each stroke against its chart before encoding; fix only the *starts* of A, M and N now (slice 1) and leave the number of pen lifts for M, N, W, Z and K as drawn (one zero-lift stroke each), because a single stroke is more forgiving. Or choose another programme, or let a grown-up pick one as LetterSchool does (a bigger slice).
2. **Levels on top and windows.** Lean: 9 Three times, 10–15 little letters (waiting on 1), 16 Little words, 17 My name, in pre-K 3–10 and school 7–17 (no lower bound moves). Accept the small inversions, or fold them into the level-order decision.
3. **How misses count in long rounds.** Lean: at most one miss and one hint per letter, so a name of eight letters cannot step her down faster than a single letter; or keep the raw counts (words are harder, a step-down returns her to single letters).
4. **What a long name does.** Lean: trace the first eight letters, and the sign at the end shows the whole name in print. Or spread a long name over two rounds, or ask a grown-up for a short form.
5. **Numerals: a mode of Letter Trails or Number Trails as its own game.** Lean: its own game (chunk 4 already claims it), sharing the stroke module. This plan builds no digit levels.
6. **A grown-up's word list** (level 18): a bounded "my words" entry on the grown-ups' page and in the save, plus the pet's name in the `GameContext`. Lean: yes, after levels 16 and 17. Or only her name and the pet's name.
7. **Younger bands.** Lean: toddler through Shape Trails below level 1 (kind D, waiting on the level-order decisions), and no lap entry (Rainbow Fingers owns scribbling). Or a lighter toddler pool at level 1 now, with a person check first.
8. **Pre-K lowercase.** Lean: only levels 9 and 10 for pre-K (the tracing aid and the first little letters), the rest school. Or none until school.
9. **Person checks to add:** whether a three-year-old can use the 0.095 corridor on a tablet and in portrait; whether the iPad voice says capital letter names ("A", "I") as letters; whether a two-year-old follows a firefly along a long line; whether the show-me hint reads as help; whether the dotted and start-only tries are clear to a five-year-old; and whether the biggest and smallest trace boxes keep every touch target at least 100 units at every view.

## Build slices, in order

Each is sized for one session. A slice that adds a level is built in level order so saved IDs stay unbroken, raises `LEVELS.school.max`, and updates `describeLevel`, the how-to `LevelLine`s, the README row and [GAMES.md](../GAMES.md).

1. **Capitals start at the top, and a `logic.ts`** (ready, no decision beyond the lean in 1). Fresh 1 and 2: re-draw A, M and N from the top; move the plan, letter choice, word pool, name rule and tolerance into `logic.ts`; make the level cap follow the plan; bound the how-to lines; add a pinned sticker test (seeds 0–99); use `trails.word`. Tier: typecheck and the Letter Trails rule tests, with the first-point test shown failing on the old data; `fingerdemo` at level 3 (the bot traces A, M and N) and level 8; no other browser run.
2. **Words with their own picture, a name cap and per-letter counting** (ready; decisions 3 and 4 lean). Fresh 3 and 4. Tier: rule tests, one portrait screenshot of the word picture, `fingerdemo` at 7 and 8. Coupling: reuse Word Monsters' `wordPicture`; do not start while its slice 2 is in flight on the same table.
3. **A hint that shows the way, start arrows, a rising tune and trail looks** (ready). Fresh 5 and 6. Tier: rule tests, `fingerdemo` at 1 and 4.
4. **Journal entries** (ready). Fresh 7. Tier: typecheck, journal and save tests, no browser.
5. **Letter-name lines** (after the iPad speech check). Fresh 8.
6. **Level 9, Three times** (ready after slices 1–3). Tier: rule tests, one scripted play of three tries with one wander (the ribbon comes back), `fingerdemo` at 9, one screenshot of the dotted and start-only tries.
7. **Lowercase frame and level 10** (decision 1; a new interaction in the frame). Tier: unit tests, one scripted play (first and last letter, a wrong drag, a hint), one portrait screenshot.
8. **Levels 11–14**, one group per slice, each with its stroke tables (b/d and g/q kept apart).
9. **Level 15, Big and little**, then **16, Little words** (needs slice 2's table).
10. **Level 17, My name.**
11. **Level 18, Words that matter** (decision 6; shell and save tier: typecheck, unit tests, build, the `grownups` suite).
12. **Shape Trails** (waits on the level-order decisions and a person check with a toddler).
13. **Cursive** (a sketch; define after 17).

## What was built in this session

Nothing: a deep dive session is research and ideation only. `git diff --check` and a relative-link check ran on the changed docs. Nothing was run in a browser or as a test, and this session had no installed dependencies: every gap above is read from `index.ts`, `strokes.ts`, `pictures.ts`, `strokes.test.ts`, `howto.ts`, `voice-script.ts`, `journal.ts`, `save.ts` and the docs, plus one scan of the strokes file for first points, and each should be confirmed by the slice that fixes it.
