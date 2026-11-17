# Picnic Pantry

<!-- generated: from src/games/picnic-pantry; edit the text below the end mark (npm run game-docs) -->

**ID:** `picnic-pantry` · **Land:** Cozy Village · **Ages:** school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** planning, comparing, adding, everyday-life

| Band | Levels, easiest first |
| --- | --- |
| school | 1 |

| Level | Plays like |
| --- | --- |
| 1 | Two dishes, one pantry: pick two of three dishes that three jars can cover (about 9 and up) |

<!-- end generated -->

**Starts as:** tap two of three dish cards and watch their tokens hop out of three pantry jars; ring the basket bell to lay a picnic for four friends when the pantry can cover both dishes

**Grows into:** level 1 is the whole game so far: four frozen cases where exactly two of the three pairs fit, a round of two picnics, and an optional, unjudged Another way? after each that compares the leftovers of the two menus. Deeper rungs (batch counts, guest preferences, a changed pantry, making a case for a partner) each need their own definition

## Design notes

*Level 1 · [definition](../definitions/picnic-pantry.md) · cooking-and-recipes slice C6b.* The learning purpose is reasoning about a shared, limited supply: two dishes that each fit the pantry alone may not fit it together, the reason is one ingredient both draw on, and more than one menu can be right. Every dish and count is invented puzzle data; nothing is a recipe, a quantity or advice about food, and no line calls a menu better or a leftover waste (a rule test reads the voice lines for those words).

**The screen.** Three jars on a shelf (each shows its tokens in a 2 by 2 stack and its picture on a tag), a blanket with two dish places and four cushions, three dish cards (picture, name, the cost as a row of token pictures, two small cushions for "serves two"), and the basket bell. A tap on a card places the dish on the first empty place and its tokens hop from the jars one by one with a rising note; a token a jar cannot give is an empty dashed outline in that ingredient's shape. Tokens are handed out in the order she placed the dishes, so the dish placed first is always whole and the outlines sit beside the second (`allocation`). A tap on a placed dish or its dimmed card puts it back. A tap on a jar says what is left. The jars and outlines are always the true state; nothing turns red or sounds before the bell.

**The bell.** Fewer than two dishes: a soft tick and "Four friends need two dishes", free. A pair that fits: four friends pop onto the cushions around the two dishes she chose and the pet says what is left in the pantry. A pair that does not fit: a boing, the short jar and that ingredient's tokens and outlines beside both dishes bounce, and the pet says the reason with the real numbers ("Crunch and Apple Bowl need four apples together. The pantry has two."). The plan stays as she left it.

**Misses and help.** Only a bell on a pair that does not fit, in a picnic's first pass, is a miss. Placing, putting back, jar taps, the third card on a full blanket (a wobble) and a bell with fewer than two dishes are free. The second miss on a picnic shows a hint; so does Show a hint on the pause sheet, and so does eight quiet seconds, once a picnic. A hint is one `repair` step (the dish to put back, the card to add, or the bell glows, and an asked-for hint names it); she still makes the tap. The same glow asked for again is not counted twice. Three hints always carry a picnic to its finish, and that supported round still earns the sticker.

**Another way?** After a picnic is laid, Next and Another way? appear. Another way? sends the dishes back for an unjudged pass: a different menu that fits gets a spoken comparison of the two sets of leftovers, the same menu is recognised, and a pair that does not fit explains itself with a tick; none of it is a miss or a hint, and Next stays on screen throughout.

**Layout.** `pantryLayout` puts the shelf across the top, the cards in a column at the right and the bell bottom-right when sideways; on an upright phone the cards become one row under the blanket with the bell beside it. Every target is at least 100 units and clear of Home, help and the pet (rule tests at three upright phone views and three sideways windows). The ghost finger places the dish that is in both menus, a partner, rings the bell and taps Next, twice.

**Where the grown-ups' wording lives.** The definition's sentence for grown-ups (what the game asks, "about 9 and up", and that the dishes are pretend) is the how-to card's goal and note and the level description; the grown-ups' page shows those, and has no per-game paragraph of its own.
