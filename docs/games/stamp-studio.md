# Stamp Studio

<!-- generated: from src/games/stamp-studio; edit the text below the end mark (npm run game-docs) -->

**ID:** `stamp-studio` · **Land:** Painted Canyon · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** composition, creative-expression, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| lap | 7, 8, 1, 2 |
| toddler | 9, 2, 3 |
| preschool | 3–5 |
| pre-K | 4–6 |
| school | 5–6 |

| Level | Plays like |
| --- | --- |
| 1 | Press one kind of stamp onto a picture |
| 2 | Make a picture with two kinds of stamps |
| 3 | Choose colors, stamp, and rearrange a picture |
| 4 | Turn stamps and make them big or small |
| 5 | Make an imaginary garden, then tell its story |
| 6 | Make two friends on an adventure; every story is welcome |
| 7 | Pat the paper: eight big soft stamps make a picture |
| 8 | Leaf prints: pat the mud and the leaf leaves its shape |
| 9 | Two feet: a duck foot and a cat paw each leave their own print |

<!-- end generated -->

**Starts as:** pat one huge star (eight pats finish the picture), or press one or two seeded stamp kinds onto a picture; arrow nudges after five, full paper finishes itself; from level 3 a music note plays the picture back left to right; levels 8–9 press a leaf, a duck foot or a cat paw into soft mud, each leaving its own print

**Grows into:** three seeded kinds and a starting color at level 3; choose colors, arrange or bin a selected stamp, change size and orientation, tell a picture story; any creation can finish, with matching button/stamp colors and the kept picture frozen at Finish

## Design notes

*After Mario Paint and Kid Pix.* Lap level 7, *Pat the paper*, is the first lap level: one huge soft star stamp (170 units) lands under each pat with its sound, pats close together are all kept, and the eighth pat finishes the picture by itself (no miss, no hint, no arrow needed). Two simple lap modes offer one or two distinct seeded kinds from star, flower, fish and cat. Levels 1–3 start in a seeded existing color; level 3 offers three distinct seeded kinds. Later modes offer colors, moving stamps, two sizes, quarter-turn rotation and spoken garden/story invitations. Any picture is valid; the green arrow can finish after the first stamp. Buttons show the current stamping color; each stamp kind is named once per round. Undo removes the latest stamp; at levels 3+ the bin removes the stamp picked up, releasing its drag and selection. At levels 1–2 the arrow wiggles after five stamps, and the 24th stamp finishes automatically. At levels 3+ a full paper stays editable, with one spoken reminder. Coordinates stay normalized when resizing. The green arrow freezes a copy of the picture immediately; late Undo, transform, color and stamp choices cannot edit it during the celebration, and a held stamp settles at its last accepted position. That finished picture can be kept on the treehouse picture board. At levels 3–6 (not 1, 2 or 7), once a stamp is down, a music-note button left of the paper plays the picture: stamps sound left to right (ties top first) on the pentatonic scale, higher on the paper higher in pitch (C4–E5), each popping with a yellow scan bar, spaced up to 0.4 s apart and never more than 5.5 s in all. Pressing again restarts, a stamp removed mid-play is skipped, and finishing stops it. Nothing is scored, the saved picture is unchanged and the how-to ghost finger does not press it.

**Levels 8–9, Trace Prints** (`TracePrints` in `trace.ts`; lap `{1–8, order [7, 8, 1, 2]}`, toddler `{2–9, order [9, 2, 3]}`; other bands unchanged). The paper is a soft mud tray and a maker leaves its own fresh print; nothing is checked, so there are no misses and no hints, and nothing is kept for the treehouse. Level 8, *Leaf prints* (lap): every pat presses one big green leaf (seeded tilt up to 20 degrees either way) and the leaf lifts away leaving its print; the eighth pat finishes the picture by itself. Level 9, *Two feet* (toddler): two 120-across buttons, a duck foot (chosen first, quack) and a cat paw (meow); choosing says the name once, each print has its own shape, the pair line is spoken once, and the tenth print finishes by itself. The green arrow works after the first print and the back arrow smooths the latest print. A print always stays wholly on the mud (the margin is the larger of half its width and its farthest reach, plus 5, so a tilted leaf stays in). No fossil, long-ago or stone wording. Off-screen: after a walk in wet sand, snow or a puddle, look back at your footprints together and find whose are whose.
