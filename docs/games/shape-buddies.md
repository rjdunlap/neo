# Shape Buddies

<!-- generated: from src/games/shape-buddies; edit the text below the end mark (npm run game-docs) -->

**ID:** `shape-buddies` · **Land:** Tinker Lab · **Ages:** preschool–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** shape and function, spatial planning, testing and revision

| Band | Levels, easiest first |
| --- | --- |
| preschool | 7 |
| pre-K | 7, 1, 2, 3, 8, 4, 5 |
| school | 1, 2, 3, 8, 4, 5, 6 |

| Level | Plays like |
| --- | --- |
| 1 | Reshape a bridge and cup; test and plant one seed |
| 2 | A step down: only a slope bridge reaches the low bank; test and plant one seed |
| 3 | Two make one: a flat friend and a cup friend make a spoon; test and plant one seed |
| 4 | Down and catch: a slope friend and a cup friend make a spoon down to a low bank; test and plant one seed |
| 5 | A cup on the ledge: a bridge and a cup, or one cup on the ledge, catches the seed |
| 6 | Which way round? Turn a slope friend to run down to the low bank; a cup catches |
| 7 | One friend, one job: a plank already crosses; make the one friend a cup at the catch |
| 8 | Your friend, my friend: two people take one friend each, in turns, to build level 3’s spoon (or one plays both) |

<!-- end generated -->

**Starts as:** reshape two paper friends (one friend at preschool), test a seed journey and plant it

**Grows into:** levels 1–8: flat or sloped bridge plus scoop catcher, then a lower far bank only a slope reaches, then a wide gap where a flat friend and a cup friend join into a spoon, then the same spoon with a raised near half whose handle slopes down, then a rocky crack whose ledge holds a cup (or a bridge and a cup at the catch), then (school) the stream mirrored, where a Turn button faces a slope down toward the low bank, and (preschool opening, pre-K entry) one friend that must become a cup to catch under a fixed plank, and (pre-K and school) level 3's spoon built by two people at one iPad taking turns, one friend each, after a Two of us or Just me seat question; undo, replay and free experiments

## Design notes

**Fun action:** reshape two paper friends, try their construction, then carry a caught seed to a pot. **Learning:** shape and function, spatial planning, testing and revision. Preschool plays level 7, pre-K levels 1–5 and 8 (opening at 7) and school 1–6 and 8; subject/home land Tinker Lab.

Tap a friend, choose Flat, Cup or Slope, then drag it to the bridge or catching dock. At level 1 flat and sloped bridges both work, and either friend can take either role. Try releases the seed along a fixed chute. A bridge carries it across the gap; a scoop at the receiver catches it and waits. Tap the pot to carry and tip the seed into it, grow a sprout and finish through the shell for one sticker. Each round draws a seeded seed kind (a bean, a sunflower seed or an acorn) with its own sprout (a curling vine, a stalk with a yellow petal ring or a two-leaf oak twig); this is art only and the friends' colours, rules and voice are unchanged.

A failed trial drops the seed onto a cushion and names the first unsupported role. Experiments, edits and occupied-dock drops are free: misses always stay zero. After two unsuccessful trials for the same role, or explicit Help, useful friend/tool/dock outlines glow; each role counts at most one hint across the round. Undo restores the last construction edit, including selection. Replay resets a caught seed without changing the construction. Undo and other edits also return a caught seed to the chute. A friend can be parked in its own spot to free its dock; occupied docks never evict the other friend. Input is locked during the run and carry.

**Level 2, A step down:** the far bank is one step lower (the left bank and chute, and the bridge dock, are raised 50 units). Only a Slope bridge reaches it: a Flat bridge stays up high and the seed drops into the stream (`buddies.stepFlat`); an empty, plain or scoop bridge says `buddies.stepBridge`. The cup role is unchanged. Misses stay 0, each role still counts at most one hint, and guidance suggests Slope. Spoken start is `buddies.start2`.

**Level 3, Two make one:** the gap is wide, so neither friend reaches alone. A flat friend goes to the near half (the bridge dock) and a cup friend to a 180-wide far half (the receiver); a dashed joining outline shows both places. When both halves are filled the friends hold hands, a bell clasps and they form a spoon. Try releases the seed; a failed trial names the first thing wrong through the pure `failureLine(s, level)` (level 3 uses `buddies.joinPath`, `joinSlope`, `joinShort` and `joinCup`), and the lines `buddies.start3` and `buddies.together` open and close the round. Both friends carry the spoon to the pot. Misses stay 0 and hint policy is unchanged; levels 1–2 keep their old failure lines. Planting one seed finishes the round. Co-play and off-screen suggestions got a level-3 sentence.

**Level 4, Down and catch:** level 3's wide gap with the near half raised 50 units, like level 2's bridge dock, and the far half at the low bank. Exactly a Slope at the near half and a Cup at the far half catch the seed (either friend in either role); the handle slopes down the step to the cup. A flat near half stays up high and stops short (`buddies.downFlat`); no near half, or a plain or cup one, says `buddies.downPath`; the far half reuses `joinShort` and `joinCup`. The scene draws the raised near bank, a stepped dashed outline, a sloped clasp and step-aware seed paths, and the carried handle stays up the step. Heading "A spoon that slopes down"; spoken start `buddies.start4`. Misses stay 0, two failed Tries for a role charge one hint, and the bot is unchanged (it follows guidance).

**Level 5, A cup on the ledge:** level 1's narrow gap is now a rocky crack (grey walls) with a wooden ledge under the gap dock, labelled "Gap". Two families catch: a Flat or Slope at the gap with a Cup at the catch, or a Cup standing on the ledge in the gap (the other friend anything; two cups catch in the gap first). Level 1's cup over open water still fails. A plain or empty gap says `buddies.ledgeNeed`, a missing cup `buddies.cup`. Guidance finishes what she started (a bridge at the gap gets a Cup at the catch, otherwise a Cup goes to the gap) and never changes a friend already in a working role; the carry to the pot starts from the catching dock. After her first catch the pet says `buddies.otherWay` once, naming the other family. Heading "A bridge, or a cup on the ledge"; spoken start `buddies.start5`. Misses stay 0, hints once per role.

**Level 6, Which way round? (school only):** level 2 mirrored: the chute is on the right, the pot on the left and the far bank on the left is one step lower. Friends have a facing, and a fourth bottom button, **Turn ↔** (level 6 only), turns the selected friend. Only a Slope turned to run down toward the low bank plus a Cup at the catch is caught (4 constructions). An unturned slope says `buddies.turnSlope`; a flat bridge says `buddies.stepFlat`. A Turn is free and undoable (Undo covers turns), misses stay 0, and when only a turn is needed the hint glow rings Turn instead of the Slope tool; the bot taps Turn. Spoken start `buddies.start6`; the cup tips toward the pot on the mirrored stream.

**Level 7, One friend, one job (preschool; pre-K entry):** one friend and a fixed wooden plank that already spans the gap (scenery, not selectable or draggable); a cup is needed at the catch. Only Cup at the catch is caught. Flat or Slope there says `buddies.oneRoll` ("The seed rolled off the end. Make your friend a cup."); a plain or empty friend says `buddies.cup`. Misses stay 0, at most one hint, spoken start `buddies.start7`. Bands are preschool 7–7, pre-K 1–7 with `order` [7, 1, 2, 3, 4, 5] and `entryLevels` [7], school 1–6; it appears on Tinker Lab's preschool page.

**Level 8, Your friend, my friend (pre-K and school; not an entry level):** level 3's wide gap and spoon with two people at one iPad. The round opens on two 112-unit seat buttons (`buddies.seats`): **Two of us** and **Just me** (the same seat art as Secret Code, in `src/art/seats.ts`). Just me plays like level 3 with hints unchanged. In Two of us friend 0 is hers and goes first; only the turn holder's friend moves, the other is dimmed and a tap on it wobbles it and says whose turn it is (`buddies.turnTeal`, `turnPurple`, `turnPink`, `turnBlue`) with no miss or hint. Shape changes keep the turn; every real drop (to a dock or the park, changed or not, past a 70-unit movement threshold; a plain tap does not) passes it. A failed Try and Help hand the turn to the friend whose role broke, Undo restores the holder and Replay returns the turn to her. Hints are charged per friend, and Two of us finishes with misses 0 and hints `max(hints on hers, 1)` through `sharedResult` (`buddies.shared`). Pre-K `order` [7, 1, 2, 3, 8, 4, 5], school [1, 2, 3, 8, 4, 5, 6]; spoken start `buddies.start8`.

Rules use a finite inspectable trace, independent of collision/frame timing. The ghost finger uses selection, tools, drags, Try and the pot through the same handlers as touch play. Colors are seeded; geometry and solvability are fixed. Co-play asks which shape can hold the seed; off screen, slide a large soft toy across cardboard into a bowl. At level 2, ask why the flat one did not work this time; off screen, add a step-down ramp. No controller or second-seat mode. Future arrangements remain proposals.
