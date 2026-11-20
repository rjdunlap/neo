# How drag games count a miss (read-through)

Read 2026-11-20 (docs only; origin of the question: [TotoLogic P9](../reviews/TOTOLOGIC.md#p9-a-read-through-of-how-drag-games-count-a-miss-docs-s)). Two smooth rounds (at most one miss, no hints) step a level up and two struggling rounds step it down ([difficulty](../../src/progress/difficulty.ts)), so what a game counts as a miss decides how fast it climbs. No test looks across games; this page is the cross-game read.

**Scope and method.** The 69 games that use `src/engine/drag.ts` or drag by another route (Fill & Dump, Rainbow Fingers). For each, the drop handler's wrong branch and the miss counter were read in code, and checked against the game's page in `docs/games/` for a stated rule. A read of code, not a play: nothing here was run.

## Result

**No game shows a boing or refusal for a clearly wrong drop and then counts nothing without saying so.** So the closeout queues no fix line for an uncounted wrong drop. What the read did find:

- **Only a minority use the shared helper.** `src/progress/coach.ts` (`missEvery`, `missOnRequest`) is used by Fill & Dump, Rainbow Fingers, Tide Line, Letter Trails and Word Monsters among the drag games (and by Picnic Pantry, Domino Pond, Sorting Machine, Duck Pond and Memory Desk, which do not drag). The other drag games keep their own `misses++` or a logic-side tally. They agree on the rule (a miss, a boing and a reason, a glow after two), which is a reason to move them to the helper over time, not a bug.
- **Counting on Check, not on the drop.** Placing is free and the check counts: Attic Finds, Bond Beads (and only if the build changed since the last Check), Circuit Garden (level 3), Far Lights (level 4), Food Web Workshop, Gadget Bench (a failing Give, never Try), Hat Band (level 4), Light Lab (Shine), Lost Layers, Movie Night (second unmet Premiere), Pet Kitchen (Serve), Fill & Dump, Sprout Shuffle (Check), Tangram Town (level 8).
- **Free by design, misses always 0** (documented, so the shell steps these up after two rounds): Chain Reaction, Domino Run, Gear Garden, Helper House, Playdate Workshop, Shape Buddies, Welcome Ways, Stamp Studio, Hat Band levels 1–3, Far Lights levels 1–2. These games' failures are experiments.
- **Free early, counted later:** Block Garden (from level 3), Jar Sort (from level 3), Lift-It (from level 5; levels 1–4 boing without counting, stated in code at `logic.ts` `countsMisses`), Swap Meet (from level 2), Word Glue and Look It Up (from level 2), Maker Lane (from level 2), Cut Along (strays from level 3), Keep House (level 2 first wrong room per figure is free).
- **Counted once per distinct wrong drop:** Look It Up, Timeline Trail, Word Glue; Crossword counts once per completed fill however many words are wrong; Lost Layers and Food Web Workshop once per check.
- **Everything else counts each wrong drop** with its own counter: Animal Snack, Color Garden, Critter Sort, Clap Syllables, Puzzle Pals, Rhyme Time, Shape Sorter, Sink Float, Size Parade, Spinner Fair, Second Chance Shed, Seesaw Balance, Teddy Doctor, Thought Bubbles, Read Do, Ready for Adventure, Rule Machine (the first prediction per machine is free), Peekaround Island (levels 4–5), and the rest of the table below.

## One table

Legend for the counter column: **coach** = shared `coach.ts`; **own** = the game's `misses++`; **logic** = a tally class in its `logic.ts`.

| Game | What is dragged | Wrong drop counts? | Counter |
| --- | --- | --- | --- |
| animal-snack | food to an animal | yes, all levels | own |
| attic-finds | clue chip, tools | on Check | logic |
| block-garden | pieces onto the bed | from level 3 | own |
| block-tower | blocks (no wrong drop) | answer and topple count | own |
| bond-beads | bead to bead | on Check, if build changed | logic |
| bug-builder | stamps | yes (count mode: wrong kind and Check) | own |
| chain-reaction | ramps | no, by design | none (dead `misses` field) |
| circuit-garden | wire pieces | level 3 Check | own |
| clap-syllables | word card to car | yes | own |
| color-garden | fruit to basket | yes (levels 9–10 cannot miss) | own |
| critter-sort | critter to hoop | yes | own |
| crossword | letter tiles | once per completed wrong fill | own |
| cut-along | scissors along a line | strays from level 3 | own |
| domino-run | dominoes | no, by design | none |
| far-lights | lights | Check at level 4; levels 1–2 none | logic |
| ferry-jam | boats (no wrong drop) | only a wrong blocker tap at level 10 | own |
| fill-dump | jug | wrong check | coach |
| food-web-workshop | badge to eater | on Show our web | logic |
| gadget-bench | parts to sockets | failing Give | logic |
| gear-garden | gears | no, by design | none |
| hat-band | hats | level 4 Check only | own |
| helper-house | sensor, handles | no, by design | none |
| inchworm | worms (past the end counts) | yes; ruler free | own |
| jar-sort | fruit between jars | from level 3 | own |
| keep-house | figures, tiles, labels | levels 2, 4 (bell), 5; 3 and 6 never | logic |
| lemonade-stand | tower friends | no; dearer boat tap at levels 5–6 | own |
| letter-trails | firefly along a letter | yes, once per stroke | coach |
| lift-it | rope end, wheels | from level 5 | own |
| light-lab | mirrors | on Shine | own |
| look-it-up | pictures to the visitor | from level 2, once per distinct pick | own |
| lost-layers | rock pieces, cards | on check | logic |
| maker-lane | bundle to a maker | from level 2 | logic |
| monster-munch | food to a monster | yes | own |
| movie-night | sound pads | second unmet Premiere | logic |
| number-trails | firefly along a numeral | yes, once per stroke | own |
| peekaround-island | friends to spots | levels 4–5 | own |
| peg-garden | seeds to rings | only the planted run | own |
| pet-kitchen | food to plates | on Serve | own |
| playdate-workshop | tokens | no, by design | none |
| puddle-lens | the lens (no wrong drop) | answer taps from level 3 | logic |
| puppet-stage | puppets to marks | no; a card acted early (level 5) or The end early (level 6) | own |
| puzzle-pals | pieces to the frame | yes (off-frame free) | own |
| quick-tricks | leaf, plank, sock, berries | yes (level 1 low leaf free) | own |
| rainbow-fingers | paint | yes at recall, mix, wheel | coach |
| read-do | word tiles | yes | own |
| ready-for-adventure | props, parts | yes | logic |
| rhyme-time | picture cards | yes (level 7 free) | own |
| rule-machine | cars, cards, predictions | yes; first prediction per machine free | logic |
| second-chance-shed | items to places | levels 2–4; 5–6 only a failed ring | logic |
| seesaw-balance | blocks on the seesaw | yes; removing free | own |
| shape-buddies | friends, tools | no, by design | none |
| shape-sorter | shapes to holes | yes (level 9 free) | logic |
| sink-float | items to baskets | sorting and salt tank only | own |
| size-parade | friends to slots | yes (lap first wrong free) | own |
| spinner-fair | cards, bars | yes; spins free | own |
| sprout-shuffle | routes, seeds | on Check | own |
| stamp-studio | stamps | no, creative | none |
| story-steps | picture cards | yes (repair and theater free) | own |
| swap-meet | toy to a friend | from level 2 | logic |
| tangram-town | pieces to shadows | yes; level 8 only on Check | own |
| teddy-doctor | tools | yes | own |
| thought-bubbles | cards to places | yes | logic |
| tide-line | pail | yes (level 1 none) | coach and own |
| timeline-trail | card to gap | once per distinct drop | logic |
| water-road | rings (mostly taps) | open-ring tap from level 2 | logic |
| weather-wardrobe | clothes | yes (level 8 try mode free) | own |
| welcome-ways | parts | no, by design | none |
| word-glue | picture to picture | from level 2, once per pair | logic |
| word-monsters | letters, taps | from level 2 | coach and own |

## Things worth a note (not fixes)

1. **Always-zero games step up after two rounds.** Games that report 0 misses and 0 hints are "smooth" every round, so the ladder climbs on rounds alone. Documented for Far Lights; the same holds for the always-0 list above. Whether a free-by-design round should step the level at all is a design question for the shell, not a counting bug.
2. **A few counters are conditional in ways only code states.** Lift-It levels 1–4 and Quick Tricks' free first tries are stated in code comments more than in their pages; worth a sentence on the page next time each is touched.
3. **Chain Reaction keeps a dead `misses` field** (`index.ts`, passed to `finish` as 0). Harmless; remove with the next edit there.
4. **Moving the own-counter games to `coach.ts`** would be a large mechanical change with no behaviour gain; it is not queued.

**Corrected in this change:** the Puppet Stage page said a wrong puppet or mark is a miss; the code counts only an early scene (level 5) or an early The end (level 6), so the page now says that.
