# Stamp Studio

<!-- generated: from src/games/stamp-studio; edit the text below the end mark (npm run game-docs) -->

**ID:** `stamp-studio` · **Land:** Painted Canyon · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** composition, creative-expression, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| lap | 7, 8, 1, 10, 2 |
| toddler | 9, 10, 2, 11, 3 |
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
| 10 | Follow the sparkle: tap the glowing spot and a stamp lands there |
| 11 | Stamp a duck!: find the animal the voice asks for |

<!-- end generated -->

**Starts as:** pat one huge star (eight pats finish the picture), or press one or two seeded stamp kinds onto a picture; arrow nudges after five, full paper finishes itself; from level 3 a music note plays the picture back left to right; levels 8–9 press a leaf, a duck foot or a cat paw into soft mud, each leaving its own print; level 10 follows a glowing spot, five taps, a stamp at each; level 11 asks for three animal stamps in turn before free stamping

**Grows into:** three seeded kinds and a starting color at level 3; choose from seven colors, arrange or bin a selected stamp, change size (small, middle, big) and orientation, tell a picture story; any creation can finish, with matching button/stamp colors and the kept picture frozen at Finish

## Design notes

*After Mario Paint and Kid Pix.* Lap level 7, *Pat the paper*, is the first lap level: one huge soft star stamp (170 units) lands under each pat with its sound, pats close together are all kept, a pat on the teal around the paper presses a star at the nearest place on it, and the eighth pat finishes the picture by itself (no miss, no hint; the star button, green arrow and back arrow are not shown, so nothing ends or undoes it early). Two simple lap modes offer one or two distinct seeded kinds from star, flower, fish and cat. Levels 1–3 start in a seeded existing color; level 3 offers three distinct seeded kinds. Later modes offer colors, moving stamps, two sizes, quarter-turn rotation and spoken garden/story invitations. Any picture is valid; the green arrow can finish after the first stamp. Buttons show the current stamping color; each stamp kind is named once per round. Undo removes the latest stamp; at levels 3+ the bin removes the stamp picked up, releasing its drag and selection. At levels 1–2 the arrow wiggles after five stamps, and the 24th stamp finishes automatically. At levels 3+ a full paper stays editable, with one spoken reminder. Coordinates stay normalized when resizing. The green arrow freezes a copy of the picture immediately; late Undo, transform, color and stamp choices cannot edit it during the celebration, and a held stamp settles at its last accepted position. That finished picture can be kept on the treehouse picture board. At levels 3–6 (not 1, 2 or 7), once a stamp is down, a music-note button left of the paper plays the picture: stamps sound left to right (ties top first) on the pentatonic scale, higher on the paper higher in pitch (C4–E5), each popping with a yellow scan bar, spaced up to 0.4 s apart and never more than 5.5 s in all. Pressing again restarts, a stamp removed mid-play is skipped, and finishing stops it. Nothing is scored, the saved picture is unchanged and the how-to ghost finger does not press it.

**Levels 8–9, Trace Prints** (`TracePrints` in `trace.ts`; added to lap `{1–8}` and toddler `{2–9}`; other bands unchanged). The paper is a soft mud tray and a maker leaves its own fresh print; nothing is checked, so there are no misses and no hints, and nothing is kept for the treehouse. Level 8, *Leaf prints* (lap): every pat presses one big green leaf (seeded tilt up to 20 degrees either way) and the leaf lifts away leaving its print; the eighth pat finishes the picture by itself. Level 9, *Two feet* (toddler): two 120-across buttons, a duck foot (chosen first, quack) and a cat paw (meow); choosing says the name once, each print has its own shape, the pair line is spoken once, and the tenth print finishes by itself. The green arrow works after the first print and the back arrow smooths the latest print. A print always stays wholly on the mud (the margin is the larger of half its width and its farthest reach, plus 5, so a tilted leaf stays in). No fossil, long-ago or stone wording. Off-screen: after a walk in wet sand, snow or a puddle, look back at your footprints together and find whose are whose.

**Level 10, Follow the sparkle (lap and toddler; lap order `[7, 8, 1, 10, 2]`, toddler `[9, 10, 2, 3]`, `entryLevels` 7–10).** A soft glowing spot (170 units across, breathing between about 162 and 178, never under 160) sits on the paper. A tap in the glow stamps at its centre; a tap anywhere else, on the paper or the teal around it, stamps where it fell (off the paper, at the nearest place on it); the glow then moves to the next spot either way, so nothing is a miss and nothing is a hint. The five spots are the paper's four corners and its middle, each nudged a little and shuffled by the seeded RNG (`sparkleSpots`, `SPARKLE`, `sparklePixel`, `sparkleTap`), at least 200 units apart on the smallest paper sideways and upright, wholly on the paper and never used twice. The fifth stamp finishes the picture through the usual wake-up, and it can be kept as usual. No green arrow, back arrow or stamp button is shown (as at level 7); the stamp kind and color are seeded per round like levels 1–3, and the stamps are not counted aloud. Toddler has no level 1, so 10 sits directly before 2 and Two feet (9) stays toddler's first level; no band's starting level changed. The ghost finger taps the glow's centre five times. The co-play tip no longer says the green arrow finishes any creation (levels 7 and 10 show no arrow); it ends "Any picture is a finished picture."

**Seven colors and three sizes (levels 3–6).** The colors run red, orange, yellow, green, blue, purple, pink; discs are 108 units across, in one row sideways and two rows on an upright phone (`colorSpots`). The size button cycles middle, big (1.5), small (0.7); an older saved 1.3 counts as big. Yellow takes a darker gold outline so it reads on the cream paper. Sizes are not spoken yet.

**Sounds, counting and the wake-up (levels 1-7, 11).** Each kind has its own sound (Pat the paper's stars ring too): the star a bell and the flower a marimba (each climbs five pentatonic steps per press, then starts round), the fish a splash, the cat a meow, the duck a quack. Levels 1-3 count the stamps on the paper aloud, one to ten, each number said once a round (after an undo a new press is silent); the count uses device speech, so a quick tap after choosing a stamp can cut its name. The green arrow wakes the stamps one by one in the order they were placed, 0.3 s apart and within 2.5 s in all, each bouncing with its sound; on a crowded paper the meows, splashes and quacks sound at most one per half second, though every stamp still bounces. Then the round finishes with the sparkle.

**Level 11, Stamp a duck! (toddler; `order: [9, 10, 2, 11, 3]`, `entryLevels` 7–11).** Adds `'duck'` (`stampArt` with seamless outline and orange bill, `'A duck'`, `quack` sound) to `STAMP_KINDS` (`STICKER_KINDS` keeps the original four so saved stickers 0–99 stay pinned). Level 11 offers the three animal stamps (`cat`, `fish`, `duck`) in a seeded starting color and order (`roundPlan`); `animalAsks` picks three distinct asks starting away from the preselected kind (`asks[0] !== selected`). Each ask uses `ctx.instruct('stamp.ask', { animal })` ("Stamp a duck!"); matching advances the ask and enters free play after three (`ctx.instruct('stamp.free')`, revealing the green finish arrow). A wrong stamp still prints and sounds, triggers `sfx.boing()` and `ctx.say('stamp.wrong', { got, want })` ("That's a cat! Find the duck."), and counts via `missOnRequest` (`coach.ts`); after two wrong presses on an ask (`ASK_HINT_AFTER`), `hinted` increments hints and `choiceGlow` (`eventMode = 'none'`) pulses behind the asked stamp button until it is stamped. Pressing at the 24-stamp limit while asks remain replaces the oldest stamp so asks cannot lock up. The finished picture can be kept on the treehouse picture board.
