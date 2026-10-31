# Literature and meaning: what a character wants, what a character knows, how the picture shows it, and who is telling

**Subject:** `literature-meaning` · **Audiences:** L, T, P, K, S, U, M and G, as defined in the [subject tracker](../subjects.md#the-audiences) · **Requested:** the tracker's [follow-up additions](../subjects.md#additional-gaps-from-the-follow-up-review) row (story clues, character motives, narrator viewpoint, illustration and comparing versions) · **Researched:** 2026-10-31 · **Session:** `claude/research-literature-meaning`, [PR #1064](https://github.com/rjdunlap/neo/pull/1064).

**Research and proposals only; nothing here is built.** The island already orders a story (Story Steps 1–7, 9–10), chooses a cause (Story Steps 8), predicts an ending from a clue (Story Steps 11), changes one choice and compares the show (Story Theater, Story Steps 12–13), composes a story for a reader (Story Weaver) and gives puppets their own voices (Puppet Stage). What it never asks is the reader's question about the people *inside* a story: **what does this character want, what does this character know, and how do we know?** That is the step from following events to understanding characters (CCSS RL.K.3 to RL.3.3 and RL.3.6), and it is the one this study fills.

**Recommendation.** Define **Thought Bubbles 1–3** (LM1), a new game in Story Grove: a short picture story plays on a little stage, then a friend in it gets an empty **thought bubble** and she drags a picture into it. Level 1 *What does she want?* reads a goal from what the friend is reaching for or looking at; level 2 *Where will he look?* asks where a friend will look for his ball after it was moved, sometimes while he was out of the room and sometimes while he watched through the window, so the answer depends on **what he saw**; level 3 *How do we know?* asks why a friend did something surprising and then has her tap the place in the picture that shows it (the illustration as evidence). Every story is invented and pictured; nothing has to be read. A belief model (who was present at each event) lives in `logic.ts`, so a rule test can check every answer.

## Anchors opened at their source

Standards are curriculum destinations, not gates, and none shows that a game teaches them.

| Official anchor | What this study takes from it | Boundary |
| --- | --- | --- |
| [CCSS RL.K](https://www.thecorestandards.org/ELA-Literacy/RL/K/) **1, 3, 7, 9** (opened) | RL.K.3: "With prompting and support, identify characters, settings, and major events in a story"; RL.K.7: "describe the relationship between illustrations and the story in which they appear (e.g., what moment in a story an illustration depicts)"; RL.K.9: "compare and contrast the adventures and experiences of characters in familiar stories" | *With prompting and support* is the island's spoken pet. Kindergarten names characters and events; it does not yet ask what they think |
| [CCSS RL.2](https://www.thecorestandards.org/ELA-Literacy/RL/2/) **3, 6, 7, 9** (opened) | RL.2.3: "Describe how characters in a story respond to major events and challenges"; RL.2.6: "Acknowledge differences in the points of view of characters, including by speaking in a different voice for each character"; RL.2.9: "Compare and contrast two or more versions of the same story (e.g., Cinderella stories) by different authors or from different cultures" | RL.2.6's voices are Puppet Stage's; RL.2.9's versions are LM5 below, and a real cultural version needs a reviewer |
| [CCSS RL.3](https://www.thecorestandards.org/ELA-Literacy/RL/3/) **1, 2, 3, 6, 7** (opened) | RL.3.1: answers "referring explicitly to the text as the basis for the answers"; RL.3.3: "Describe characters in a story (e.g., their traits, motivations, or feelings)"; RL.3.6: "Distinguish their own point of view from that of the narrator or those of the characters"; RL.3.7: how "illustrations contribute to what is conveyed by the words" | Level 3's *How do we know?* is RL.3.1 with a picture as the text; level 2's *what he saw* is a character's point of view against hers (RL.3.6). RL.3.2's moral is LM6 (a sketch) |
| [CCSS RL.6](https://www.thecorestandards.org/ELA-Literacy/RL/6/) **1, 3, 6** (opened) | RL.6.1: "Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text"; RL.6.6: "Explain how an author develops the point of view of the narrator or speaker" | The M rung: *who is telling?* (LM4), where a narrator can only tell what they saw |

## What people can do, and what remains uncertain

- **Inference does not wait for reading.** Kendeou, Bohn-Gettler, White and van den Broek 2008 ([abstract opened](https://experts.umn.edu/en/publications/childrens-inference-generation-across-different-media/)) followed children aged 4 and 6 to 6 and 8 with aural, televised and written stories: "children's inference generation skills were highly inter-related across different media", and inference contributed to narrative comprehension beyond basic language skills and vocabulary. **Consequence:** a pictured, spoken story is a fair place to practise the reader's inferences before she reads; the game claims nothing about reading.
- **False belief around four.** Wellman, Cross and Watson's 2001 *Child Development* meta-analysis of 178 studies (**search summaries and abstract only; the PDF was not opened**) is summarised as a consistent shift from below-chance to above-chance performance on false-belief tasks across the preschool years, commonly placed around four. **Consequence:** level 2's moved-ball story sits at pre-K's top and school; it is not offered to toddlers or preschool, and a wrong answer at four is ordinary, not a concern.
- **Thought bubbles are understood early.** Wellman, Hollander and Schult 1996, "Young children's understanding of thought bubbles and of thoughts" (*Child Development* 67; **citation and citing papers via search only, not opened**), is cited as finding that three-year-olds understand that a thought bubble shows what someone is thinking and that it can be wrong. **Consequence:** the bubble is a fair device from pre-K; whether this child reads it that way is a person check.
- **Goals before feelings.** A recent picture-story study by HSE University researchers in *Scientific Reports* (**press summaries only; the host failed to load**) reports that five- and six-year-olds answered questions about a protagonist's goals better than questions about internal states. A Japanese study of 3- to 6-year-olds (search summary) reports trait-motive-behaviour understanding present at 3–4 and fuller at 5–6. **Consequence:** level 1 reads a *goal* from a visible reach or gaze; feelings stay with Feelings Faces, and *why* waits for level 3 at school.
- **Shared reading talk.** Dialogic reading (Whitehurst and colleagues, 1988; What Works Clearinghouse intervention reports 2006–2010, **search summaries, reports not opened**) has the adult prompt, evaluate, expand and repeat, with completion, recall, open-ended, wh- and distancing prompts. **Consequence:** the grown-ups' story-talk card (LM3) borrows the idea of asking rather than telling, in our own words, with no learning claim.
- **Older range is thin.** No study of 11–14-year-olds' engagement with narrative-viewpoint games was found; recorded as a gap, as the tracker's older-range note already says.

| Age | What fits (from the sources above, with recalled parts marked) |
| --- | --- |
| L · about 1 | Looking where a reader points; hearing a voice for each character; no inference |
| T · 2–3 | Naming who is in the picture and what they are doing (RL.K.3's start) |
| P · 3–4 | What a character wants from what they reach for (goals first) |
| K · 4–5 | Where a friend will look when they did not see a move (false belief, around four); which picture shows a moment |
| S · 6–8 | Why a character did something, and pointing to the picture that shows it (RL.3.1, 3.3, 3.7) |
| U · 9–12 | Two characters who know different things; a narrator who can only tell what they saw (RL.3.6); comparing two versions (RL.2.9); a story's lesson (RL.3.2) |
| M · 11–14 | Who is telling and what they left out (RL.6.6); evidence for an inference (RL.6.1) |
| G · grown-up | A who-knew-what deduction for themselves; story talk at bedtime |

## On the island today

- **Built story games:** Story Steps 1–13 (ordering, cause, mixed-up and untangled strips, *What will happen?*, Story Theater), Story Weaver 1–3 (compose, an owl who asks, *because*), Puppet Stage 1–3 (voices), Read & Do (printed signs acted out), Goodnight Room and Rhyme Time (read-aloud traditions). Each is in [GAMES.md](../../GAMES.md).
- **Built minds, briefly:** Feelings Faces 12 *Ask first* shows a friend's wish in a thought bubble after she asks (the wish is told, not inferred); Relay Woods' proposed *Postcard or envelope* gives every carrier who saw a postcard a bubble of it ([networks study](networks-citizenship.md)), a privacy lesson using the same "you know what you saw" picture. Notice Board 2 (defined) asks *who saw it* to judge a poster's source; that is source reliability, not a character's mind.
- **Proposed overlaps:** *Two Viewpoints* ([social-emotional study](social-emotional.md#candidates-and-fit)) replays one mishap from two stated accounts as a Story Theater mode; it owns *two people describe a quarrel differently*. Philosophy-reasoning's *What if?* (PR5) and the Story Steps dive's journal stay with Story Steps.
- **Gaps:** nothing asks what a character wants, knows or believes; nothing asks her to point to the picture evidence for an answer; nothing compares two versions of one story; no narrator exists in any game.
- **Audiences already served:** L–K have story order and voices; S has cause, prediction and composition; U and M have nothing on character, viewpoint or versions.

## Similar games, apps and physical play

| Game | Kind | How progression grows | Borrow | Leave out |
| --- | --- | --- | --- | --- |
| Nosy Crow, *Little Red Riding Hood* (2013; reviews via search summaries, HBook returned 403) | iPad storybook app, 3–8 | Three forks in the road choose a route; each route holds a small activity; replays reach different endings | A familiar story told on a stage with choices that change it; voices for each character | Microphone blowing; buying further titles inside |
| Living Books, *Arthur's Teacher Trouble* (Broderbund 1993; COMPUTE! 1993 and Wikipedia via search summaries) | CD-ROM storybook | Read-aloud pages with clickable hot spots in every scene | Tapping anything in a picture speaks; the picture rewards looking | Hot spots unrelated to the story (the 1998 *Boston Globe* "more fun than educational" note) |
| Jon Scieszka and Lane Smith, *The True Story of the 3 Little Pigs!* (book; second-grade lesson plans via search, for example Alabama's *Another Side of the Story*) | Picture book | The wolf retells the familiar tale his way; classes chart both versions | One event told by two tellers; "which teller saw what?" | A villain's violence as the joke; the young bands do not need wolves eating pigs |
| Sally-Anne / moved-object stories (classic false-belief task, recalled) | Research task, physical dolls | One move while a character is away | The whole of level 2's story shape, told kindly (tidying, not tricking) | A test framing; a pass or fail |
| *Unpacking* (Witch Beam 2021; Common Sense 9+, reviews via search; BAFTA narrative award) | Game, 9+ | Room by room, a life is inferred from objects, with no dialogue | **The object as evidence**: a picture detail says who someone is, which is level 3 | Nothing needed |
| *Return of the Obra Dinn* (Lucas Pope 2018, recalled) | Deduction game, 13+ | Name each sailor from scenes; answers confirm three at a time | Confirming in threes for a grown-up deduction (LM7); never wrong forever | Death scenes; this is a reference for the mechanic only |
| Dialogic reading (Whitehurst; WWC reports via search) | Unplugged, adult and child | Prompt, evaluate, expand, repeat across rereads | The story-talk card's "what does she want? how do you know?" | Quizzing; correcting a child's reading of a picture |
| Unplugged: hide a toy while a teddy "sleeps", then ask where teddy will look; tell a bedtime story from the cat's side | Off screen | The grown-up asks "how do you know?" | The co-play role and the card | — |

## What fits

- **A character's mind is the learning.** Dragging a picture into a friend's bubble makes "what she wants" and "what he thinks" a thing she places, and the friend then acts on it, so the story shows her whether the bubble made sense.
- **Belief follows sight.** Level 2's answer is computed: a character believes the last place they *saw*. Half the stories let the friend watch through the window, so "the old place" is not a trick that always wins; that is what makes it reasoning rather than a rule.
- **Evidence is a place in the picture.** Level 3 asks her to point to the umbrella by the door or the empty bowl, which is RL.3.1's "referring explicitly to the text" with a picture as the text.
- **A new game rather than a Story Steps level.** Story Steps' action is arranging a strip; Thought Bubbles' is reading a character and placing a thought. Story Steps is 13 levels deep already. The cost is a 17th game in Story Grove, which pages (the lands test decides; fallback Cozy Village).
- **Does not fit:** reading comprehension quizzes on printed passages, a reading-level score, feelings as right and wrong answers (Feelings Faces owns feelings, and only with care), any real folktale or religious story without a named reviewer, villains or scares as the fun.

## An answer for every audience

| Audience | First action | Deeper rung |
| --- | --- | --- |
| **L** · about 1 | *None on screen, and why:* no inference yet; Goodnight Room and Puppet Stage serve looking and voices. Card line: point and name who is in the picture | none |
| **T** · 2–3 | *None new, and why:* naming characters and actions is Story Steps 1–2 and Photo Safari | none |
| **P** · 3–4 | *None new, and why:* goals are pre-K's first rung; preschool plays Story Steps | none |
| **K** · 4–5 (pre-K) | Thought Bubbles 1 *What does she want?*: drag what the friend is reaching for into her bubble | Thought Bubbles 2 *Where will he look?* (pre-K top) |
| **S** · 6–8 | Thought Bubbles 2 with window stories mixed in | Thought Bubbles 3 *How do we know?*: a reason, then the picture evidence |
| **U** · 9–12, top of `school` with an "about 9 and up" note | Thought Bubbles 4 *Two bubbles* (LM2, define after 1–3): fill two friends' bubbles who saw different things | *Who is telling?* (LM4): which friend could have told this version, from what they saw |
| **M** · 11–14, future band; today `school`'s top | *Who is telling?* with a teller who leaves something out (RL.6.6) | *Two tellings* (LM5, sketch): compare an island story told by two friends; invented stories only unless a reviewer is named |
| **G** · for themselves | **Who Knew** (LM7, Lantern Lake, sketch): a small house of friends, a list of events and who was in which room; mark what each friend believes; answers confirm three at a time. After a Lantern Lake capacity test |
| **G** · with the child | **The hider** at Thought Bubbles 2: the grown-up says where the ball goes while the friend is out, the child fills the bubble, then they swap; the pet steps aside |
| **G** · tool for the grown-ups' page | **Story-talk card** (LM3, plain HTML): at any picture book, "what does she want?", "does he know that?", "how do you know? show me in the picture", "who is telling this?"; hide a toy while teddy sleeps; no learning claim |

## Candidates and recommended order

| Candidate | Fun action | Learning goal | Audiences | Effort | New infrastructure |
| --- | --- | --- | --- | --- | --- |
| **LM1 Thought Bubbles 1–3** · new game | Watch a tiny picture story, then drag a picture into a friend's thought bubble; tap the picture evidence | Character goals, beliefs from what was seen, evidence in the illustration (RL.K.3, RL.2.3, RL.3.1, 3.3, 3.6, 3.7) | K, S | M | A stage with a door and a window, a thought-bubble drop target, a short story player, an authored story pool and a belief model in `logic.ts` |
| **LM2 Thought Bubbles 4** · two bubbles, U | Two friends, two bubbles, different things seen | Two characters' points of view at once (RL.3.6) | U | S–M | A second bubble; more authored stories |
| **LM3 Story-talk card** · grown-ups' page | Questions for any picture book | Talk about characters and evidence | G page, K–U via the grown-up | S | Plain HTML |
| **LM4 Who is telling?** · Thought Bubbles 5, U–M | Hear a version of the story; tap the friend who could have told it (who was there for every part told) | Narrator viewpoint (RL.3.6, RL.6.6) | U, M | M | A told version from the same event list; define after LM2 |
| **LM5 Two tellings** · sketch | Two friends tell one island event; find what each left out | Comparing versions (RL.2.9) | U, M | M | Waits on LM4; real folktale versions need a named reviewer |
| **LM6 What did Fox learn?** · sketch | Two short island fables; pick the lesson card that fits both | A story's message (RL.3.2) | U | M | Invented fables only; lessons are not moralising; a reviewer for wording |
| **LM7 Who Knew** · Lantern Lake, sketch | Mark each friend's belief from room-by-room events | Belief reasoning as a grown-up puzzle | G, M | M | Shares LM1's belief model; after a Lantern Lake capacity test |

**Order:** LM1, LM3, LM2, LM4. LM5–LM7 are sketches.

## A first game's ladder: Thought Bubbles 1–3

The scene is a small cottage room on a stage: a door on the left, a window at the back, two or three places to keep things (a red box, a blue basket, a shelf). A story of two to four beats plays with the pet narrating; the replay button (100 units) plays it again for free. Then one friend gets an empty bubble, and three picture cards wait below (each at least 110 units). She drags a card into the bubble; the bubble swells on touch-down. A filled bubble makes the friend **act on it** (reach for that thing, walk to that place), so the story shows the consequence.

| Level | First round | What she decides | Mistakes and hints | Rule test |
| --- | --- | --- | --- | --- |
| **1 · What does she want?** · pre-K 1, school 1 | Bunny stands under a tree and reaches up at an apple; a ball and a kite lie nearby. Cards: apple, ball, kite | The thing the friend's reach or gaze points to | A wrong card: the friend looks at it and shakes her head, the pet says "Bunny is reaching up. What is up there?", one miss; two misses glow the right card (one hint). Right: Bunny gets the apple with the pet's help | Each story has exactly one cued object (the reach or gaze target); distractors are in the scene and never cued; the cued object differs across a round's three stories |
| **2 · Where will he look?** · pre-K 2, school 2 | Bear puts his ball in the red box and goes out of the door; Squirrel tidies it into the blue basket; Bear comes back. Cards: red box, blue basket, shelf. Other stories: Bear watches through the window while it moves | Where the friend *thinks* the thing is, from what he saw | The first unsupported pick in a story is free and shown: the pet replays the moment ("Was Bear in the room when it moved?"); a repeated unsupported pick is one miss; the second glows the beat that decides it and then the right card (one hint). Right: Bear looks there; if it moved while he was out, Squirrel shows him, kindly | The belief model returns the last place the friend saw; a round mixes away and watching stories, and the answer is the old place exactly when the friend was away; never three of one kind in a row; nobody is tricked (every move is tidying, sharing or a gust of wind) |
| **3 · How do we know?** · school 3 | Duck takes an umbrella on a sunny morning. Cards: "it will rain" (the window shows dark clouds coming), "she likes red", "it's her birthday". After the right reason: "Show me how you know" | Which reason the story supports, then where the picture shows it | A wrong reason is one miss: the pet says what the picture would need ("Is there a birthday cake?"); two misses glow the clue (one hint). Pointing: any tap on the picture speaks what is there and is free; the clue sparkles and completes the round | Each story has exactly one supported reason and one clue region; every distractor reason has no supporting region; clue regions are at least 100 units and never overlap a card |

**Cost:** M. A stage, the bubble drop target on `src/engine/drag.ts`, a story player of beats (reusing Story Theater's narrated scenes where the art fits), a pool of about eight stories per level, the belief model and its tests. The bot reads `logic.ts` (the cued object, the believed place, the reason then the clue). No new save field; nothing kept. Story Grove's 17th game, so the lands test must page rather than shrink (fallback Cozy Village).

## Experience and presentation

- **The first unsupported action** is dragging a picture into the bubble and watching the friend act on it: the consequence is the feedback.
- **Touch-down feedback:** the card lifts, the bubble swells and its edge brightens when the card is over it.
- **Replay variety:** a seeded story from a pool per level, which friend plays which part, which places hold the thing, and at level 2 away or watching.
- **Off-screen:** the story-talk card's teddy game.

## Fit with the creature-world rework

Creatures with their own wants and their own view of the island are a natural rework thread (a creature that did not see something), but nothing here depends on rework infrastructure; the cast here is the island friends until the rework's cast settles.

## Decisions for the developer

Under the [October 23 standing rules](../../archive/DECISIONS-2026-10-23.md#standing-rules) the defining session adopts each lean; only the person checks wait.

1. **Identity.** A new game, Thought Bubbles, rather than Story Steps 14–16: the action is reading a character, not ordering a strip, and Story Steps is already 13 levels. **Lean: new game.**
2. **Land.** Story Grove (a 17th game, paged by `LAND_SPOTS`), fallback Cozy Village. **Lean: Story Grove if the lands test passes.**
3. **Kindness of the moved-ball story.** Things move by tidying, sharing, a gust of wind or a puppy, never a trick or a theft; the friend who was away is helped, never laughed at. **Lean: as stated.**
4. **Words.** "Thinks", "wants", "saw" and "how do we know" in speech; *point of view*, *inference* and *narrator* on the grown-up card only. **Lean: as stated.**
5. **Real stories and versions.** All stories are invented island stories; comparing versions of real folktales (RL.2.9) and fables waits for a named reviewer, as the subject ground rules require. **Lean: invented only.**

**Device and person checks (for DEVICE-CHECKS once built):** does a four- or five-year-old read the empty bubble as "what he thinks", or as a place to put the right object; does the window story feel fair after the away story, or like a trick; does *show me how you know* feel like finding treasure or like a test?

## Build slices, in order

1. **LM1 · Define Thought Bubbles 1–3** (docs only): the stage, the bubble and cards at 110 units, the authored story pools (about eight per level) and their beats, the belief model and its rule tests, the away/watching mix, accounting, how-to steps, voice lines, the land decision and the bot.
2. **Build Thought Bubbles 1–3** (new-game tier).
3. **LM3 · Story-talk card** (grown-ups' page, plain HTML).
4. **LM2 · Define Thought Bubbles 4** after 1–3 are played; then **LM4 Who is telling?**
5. LM5, LM6 and LM7 stay sketches (LM5 and LM6 need a reviewer for any real story; LM7 waits on a Lantern Lake capacity test).

## What was built and what ran

Nothing built. The research session ran `git fetch origin --prune` and `scripts/overlap.sh` for the queue's earlier lines and this subject (no claim), opened CCSS RL.K, RL.2, RL.3 and RL.6 and the Kendeou et al. 2008 abstract, and used search summaries for Wellman, Cross and Watson 2001, Wellman, Hollander and Schult 1996, the HSE picture-story study (its host did not resolve), the What Works Clearinghouse dialogic-reading reports, the Nosy Crow and Living Books reviews (HBook returned 403), *Unpacking*'s reviews and the Scieszka lesson plans; *Obra Dinn* and the Sally-Anne task are recalled. At closeout: `node scripts/check-links.mjs` and `git diff --check`.
