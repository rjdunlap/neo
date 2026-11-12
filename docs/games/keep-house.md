# Keep House

<!-- generated: from src/games/keep-house; edit the text below the end mark (npm run game-docs) -->

**ID:** `keep-house` · **Land:** Cozy Village · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** matching, spatial-reasoning, reasons, checking

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1 |
| preschool | 1–3 |
| pre-K | 2–4 |
| school | 4–6 |

| Level | Plays like |
| --- | --- |
| 1 | Who's at the door: tap each castle door and a worker comes out with their tool (2 doors under 3, else 3; nothing counted) |
| 2 | Who works where: drag each of three figures to the room its tool belongs in (two yards; a first wrong room per figure is free) |
| 3 | The cook's walk: put the kitchen, then the stable, on a near or far spot and watch whether the soup arrives hot (never a miss) |
| 4 | Fit the household: five rooms on a 3 × 3 plan to five needs, then ring the bell to check (two plans; a miss per unmet need) |
| 5 | Read the ruin: drag a picture label onto each roofless room its remains say it was (two ruins; a miss per wrong label) |
| 6 | Stone or timber: build the hall for a lord's purse and stay, then watch the years (never a miss) |

<!-- end generated -->

**Starts as:** tap a castle door to see who lives and works inside, and put the household where its work is, the way a castle was a home and a workplace

**Grows into:** levels 1–6: tap each door and the well and a figure comes out (nothing counted); drag each of three figures to the room where its work is (a figure's first wrong room is free, each later one a miss, and the second miss glows the right room, one hint per yard); put the kitchen then the stable on a near or far spot and watch whether the soup arrives hot (never a miss; a cold arrival lifts the tile back and offers Keep it, twice counts one hint); fit five room tiles on a 3 × 3 plan to five spoken needs and ring the Finish bell (each unmet need at the bell is a miss, an empty bell is not, and the second miss glows the next move, one hint per plan; two plans per round). Levels 5–6 (school): drag five picture labels onto four roofless rooms of a 3 × 3 ruin by their remains (clues shared by two rooms so a deciding clue decides; a wrong label is a miss, the second miss in a ruin glows the deciding clue, one hint; tapping a room hears its clues free; two ruins), then choose a lord's hall in timber or stone, tap the rows to look and Build to play the years in 5-year steps (the fitting choice finishes; the other is never a miss, Build again is free, Keep it twice counts one hint; two lords). One spoken history line at levels 2–6 and on the card. Nothing is kept. Market Days not built. Cozy Village

## Design notes

*Levels 1–6 · [definition](../definitions/keep-house.md) · medieval-life slices ML2 and ML3.* She keeps house in the island's castle, a home and a workplace: she finds who lives behind each door, sends each person to the room where their work is, watches whether the soup reaches the hall hot, and fits five rooms to five spoken needs. Toddler plays level 1, preschool levels 1–3, pre-K 2–4, school 4–6. Nothing is kept and no journal entry is made; the sticker is the round's only reward. Music is `STYLES.hub`.

**1 Who's at the door:** two closed doors at toddler, three otherwise, and the well; a tap opens a door and the person comes out with their tool and a sound (cook, groom, bell-ringer, steward) and the well splashes. Nothing is counted (0 misses, 0 hints); a closed door glows after eight idle seconds, recording nothing. **2 Who works where:** two yards of three figures; she drags each to the room where its work is (kitchen, stable, yard and so on) and the figure starts work. **3 The cook's walk:** she puts the kitchen then the stable on a near or far spot and watches the walk to the hall; from the near spot it arrives hot, from the far spot cold. **4 Fit the household:** five room tiles on a 3 × 3 plan with a well, a gate, a shaded corner and a sunny side, and five need cards (each tappable to hear again); she places the rooms, then rings the Finish bell, the one commit, and the unmet needs are named. Two plans per round; at the end the household walks in. **5 Read the ruin:** a 3 × 3 ruin with four roofless rooms and five picture labels (table, pot, hay, bed, chest); she drags a label onto the room its remains say it was (a wide hearth, a round oven, stone mangers, a window seat, steps down); a hearth or drain is shared by two rooms so one deciding clue decides; tapping a room hears its clues free; two ruins per round. **6 Stone or timber:** a lord's hall for a purse and a stay; she taps the timber and stone rows to look, then Build plays the years in 5-year steps (timber is cheaper and is rebuilt, stone costs more and stands); the fitting choice finishes; two lords per round.

**Misses and help.** Level 1 has none. Level 2: a figure's first wrong room is free (it says, in the figure's terms, why it cannot work there); each later wrong room for that figure is one miss; at two misses the right room glows, one hint per yard; Help is the same glow. Level 3: a placement is never a miss; a cold arrival lifts the tile back and shows Keep it; Keep it twice counts one hint and the placement stands (the reason is spoken on every second Keep it). Level 4: an empty bell is not a miss; each unmet need at the bell is one miss; at two misses a breadth-first-search glow (`hintFor`) marks the next move, one hint per plan; every seed has at least two solutions. Level 5: each label dropped on a room it was not is one miss (a spare label dropped on a room counts too); after a ruin's second miss the deciding clue glows (one hint per ruin); a room look is free. Level 6: neither build is a miss; the fitting build finishes; Build again (the same Build button, with an arrow) is free; Keep it on the other build twice counts one hint.

**History.** One line is spoken once at the start of levels 2–4 and printed on the card: "This is the island's castle, like the castles people built long ago: a home, and a workplace for everyone in it." The castle is the island's own with island names; no real castle, family or date, and no weapon, dungeon or siege, is on screen or spoken. Voice lines `kh.*` (title clip "Keep House!" rendered). Home land Cozy Village (its 19th game; the lands test passes, so decision 2's Story Grove fallback is not used); region cozy-village; skills matching, spatial-reasoning, reasons, checking. The ghost finger plays every level (each door and the well; each figure to its workplace; the tile to the near spot; each room to the solver's first solution, then the bell). Co-play: steward and mason (one reads the needs, the other places). No off-screen line and no couch version. Levels 5–6 add two more lines, shipped as the definition's fallbacks with no source check yet done: "The stones that stayed tell us which room was which" (level 5) and "Stone took much longer to build than timber, and lasted much longer" (level 6); the Beaumaris figures (about 400 masons, 2,000 other workers, pay late, never finished) are on the level 6 how-to note only. The ghost finger also plays levels 5 and 6. Market Days is not built (ML4); there is no reduced-motion variant because the engine has no shared flag. Rule tests: [`logic.test.ts`](../../src/games/keep-house/logic.test.ts) (plans over 300 seeds per level, the household table, level-1 invariants, level-2 drop, first-free and glow, level-3 hot, cold, keep and help, level-4 check on authored layouts, solutions, moves and bell accounting, the level-5 clue sets and deciding clue, the level-6 consequences, hints from 200 random layouts over 50 seeds each moving one nearer and reaching a solution in at most five, layout at landscape, portrait, phone and notch).

**A ruin clue never holds the next label (U7 fix batch 12, 2026-11-12).** At level 5 a settled label's deciding clue `kh.clue.*` and `kh.was.*` start and the other labels open at once; picking a label, a look or a wrong drop cuts the pair, and the figure fades after. A ruin's last label is still heard out before the household returns.
