# Melt and Freeze

<!-- generated: from src/games/melt-freeze; edit the text below the end mark (npm run game-docs) -->

**ID:** `melt-freeze` · **Land:** Bubble Beach · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** states-of-matter, cause-and-effect, observation, prediction

| Band | Levels, easiest first |
| --- | --- |
| lap | 5, 1, 2 |
| toddler | 1–3 |
| preschool | 3, 4, 6 |
| pre-K | 4, 6, 7 |
| school | 6–7 |

| Level | Plays like |
| --- | --- |
| 1 | Sun and snow: tap the sun to melt an ice cube and the snowflake to freeze it again |
| 2 | Three things in turn: warm each one and see which melt, then cool the ones that did |
| 3 | Make it…: three request cards, each asking for the sun or the snowflake |
| 4 | Some do, some don’t: warm and cool a tray of four things together |
| 5 | One big ice cube: tap anywhere to melt it, then tap the snowflake to freeze it |
| 6 | Will it melt?: say what you think, then warm it and find out (a guess is never wrong) |
| 7 | Can it go back?: test each changed thing with the snowflake and file it under goes back or can’t go back |

<!-- end generated -->

**Starts as:** one big ice cube at lap. Three touches anywhere on the playfield shrink it into a puddle, then the snowflake appears to freeze it again.

**Grows into:** use the sun and snowflake to compare how different things change, make the changes shown on request cards, warm or cool a whole tray at once, and say what she thinks the sun will do before she finds out (level 6, from preschool), and test a changed thing with the snowflake to file it under goes back or can't go back (level 7, from pre-K).

## Design notes

*After warm-and-cool play with ice, butter and chocolate; [definition](../definitions/melt-and-freeze.md).* A thing sits on a little table with a big sun and a big snowflake at the bottom. Each tap is one warm or cool step: the sun slowly melts ice, butter or chocolate into a puddle with a drip and a chime, and the snowflake makes the puddle go hard again as the same thing. A stone or a spoon never changes. Tapping a thing wiggles it (free). Music is the island loop.

**Levels.** Level 1 *Sun and snow* (lap, toddler): one ice cube; the round ends after one melt and one freeze; after 14 s of rest with one change unseen the pet shows the other tool, and the snowflake pulses after three suns in a row. Level 2 *Three things in turn* (lap, toddler): ice, butter and stone first, then three seeded distinct things with at least one changer and one stayer; sun each, then snowflake the ones that melted. Level 3 *Make it…* (toddler, preschool): three request cards (melt the ice, make the butter puddle hard again, melt the chocolate, then seeded on changers, alternating direction). Level 4 *Some do, some don't* (preschool): two trays of four, sun and snowflake act on all four, a tray finishes when both tools were used. Level 5 *One big ice cube* (first at lap): each warming tap gets a rising pop and shrinks the cube. The snowflake appears once the melt animation ends. The round waits for the player’s taps and ends after the snowflake freezes the puddle. Lap play order is 5, 1, 2.

**Misses and help.** Only levels 3 and 7 count misses (level 7 is described below): each wrong tool is one miss and shows what that tool does, a spoken clue follows the first, the right tool glows from the second (one counted hint per request; Show a hint on the pause sheet does the same once), and on the third miss the pet taps the right tool. Levels 1, 2, 4 and 5 count none. Each thing that melted files a journal entry (`melt-freeze:ice`, `butter`, `chocolate`) and a stone or spoon that stayed in the warm files `melt-freeze:stays`. Co-play: ask her what the sun did, then the snowflake. Off-screen: an ice cube on a plate by a window. Start again is ignored while a change animates.

**A met request never holds the next one (U7 fix batch 4, 2026-11-11).** At level 3 `meltfreeze.same` starts and plays over the thing's exit and the next thing's arrival (0.85 s); the tools open as soon as the next thing stands. The next request's instruction is spoken when the lesson line ends, or at once if she taps a tool or asks for a hint first, so the pet never repeats a stale request. On the last request the line is heard out before the closing line.

**Level 6, *Will it melt?* (built 2026-11-18, PR #1803; [definition](../definitions/melt-and-freeze-predictions.md)).** One thing on the table and two picture cards, "it melts" and "it stays", drawn as pictures of that thing. She taps a card (it lifts and is ringed; tapping the other changes her mind), then the sun, and the thing melts or stays. "Just like you thought!" follows a match and "Surprise! Now we know." follows a mismatch; both are warm and neither is a miss. A round is four things, two that melt and two that stay; the authored first round is lolly, shell, chocolate, spoon, then seeded from the pool (ice, butter, chocolate, lolly, stone, spoon, shell). There is no snowflake at this level. The sun is dimmed and waits until she has guessed: a sun tap before a guess asks the question again and the cards bob. Nothing is counted: 0 misses and 0 hints always, Show a hint explains the level (uncounted), and after 14 s of rest the pet repeats the question. One sticker. Journal: the lolly's melt files `melt-freeze:lolly` ("Ice lolly"), and `melt-freeze:stays` has new found and find text (ID unchanged).

**Pool and journal.** Levels 1–4 keep their original five things as an explicit `EARLY` list (`EARLY_CHANGERS`, `EARLY_STAYERS` in `logic.ts`, guarded by a test), so the new substances `lolly` (pink puddle with its stick; the voice says "freezes") and `shell` never reach them. `CHANGERS`, every melting thing including the lolly, feeds the journal. The journal now holds 88 entries (level 7 added `melt-freeze:goes-back` and `cant-go-back`). Preschool order is 3, 4, 6; pre-K plays 4, 6 and 7; school plays 6–7. The skills gained `prediction`.

**Where level 6 departs from its definition.** (1) It was built in two sessions, level 6 first. (2) Pre-K's range is [4, 6] and the school band waits for level 7. (3) "Now tap the sun and see!" goes through `ctx.instruct`, so after a guess the guide repeats the step that is actually next. (4) The co-play line ("Ask {name} why she thinks so") is not added: `GameModule` has no per-level co-play tip, and the tip shows only at lap and toddler. (5) The "it melts" card for a thing with no puddle of its own (stone, spoon, shell) shows a plain puddle in its colour. (6) Held upright, the sun stands alone, centred in the bottom row. (7) The forbidden-words test also bans toaster, pan, cook and burn for now. (8) The how-to goal line is unchanged until level 7, which would name can't-go-back.

**Level 7, *Can it go back?* (built 2026-11-18, PR #1806; [definition](../definitions/melt-and-freeze-predictions.md)).** Mode `sort`. A changed thing arrives and she files it by tapping one of two bins: *goes back* (a round arrow) or *can't go back* (an arrow ending at a bar), each keeping small pictures of what was filed. The authored first round is the butter puddle, toast, the lolly puddle and the popped kernel; later rounds are both cooked things and two of the four puddles. The snowflake is a free test: the puddle freezes again, toast and the kernel stay as they are. The `cooked` state and the `bread` and `kernel` rows are new; they only ever appear changed, with the faint outline of what they were beside them. There is no sun at this level. A wrong bin is the only miss: the thing hops back with a boing and the clue (the voice table's `sort.stuck` wording) names what the test showed. From the second wrong bin the right bin glows (one counted hint per thing; Show a hint also runs the test and glows the bin, once per thing). The third wrong bin is a supported finish: the pet files it. Filing before testing is allowed and judged; the game runs the snowflake first. Each of the two journal entries is filed only if the round showed it.

**Where level 7 departs from its definition.** (1) The bins sit exactly where level 6's cards sit (150 units landscape, 160 upright), and upright the snowflake stands alone, centred. (2) No level 7 co-play line (the module has no per-level tip, as at level 6); the paper-tearing off-screen line ("Tear a piece of paper together, then ask: can it go back?") goes to the school band only, and pre-K keeps the ice cube. (3) Toast and the kernel are named on arrival ("This was bread. Now it's toast.") before the question, and the question is dropped if she has already tapped. (4) A right filing also speaks "It went hard again. It can go back!" or "It stays changed. It can't go back." (5) The wrong-bin clue uses `sort.stuck`, not the "It's still toast" wording in the accounting section. (6) No rest prompt at level 7. (7) Start again also clears the glow and the tested flag; the counts stay. (8) Spoken clips were not regenerated: device speech is the fallback, as at level 6. (9) Review fixes: Start again during the pause before a question no longer asks it twice; a thing mid-hop or arriving takes its place after the screen turns; the next question waits for the lesson line rather than a fixed pause. The how-to goal line now names can't-go-back.
