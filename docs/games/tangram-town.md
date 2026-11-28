# Tangram Town

<!-- generated: from src/games/tangram-town; edit the text below the end mark (npm run game-docs) -->

**ID:** `tangram-town` · **Land:** Rainbow Meadow · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** shape-composition, rotation, spatial-reasoning

| Band | Levels, easiest first |
| --- | --- |
| toddler | 10, 1, 2 |
| preschool | 2–4 |
| pre-K | 3–6 |
| school | 5–9 |

| Level | Plays like |
| --- | --- |
| 1 | Two big shapes, already the right way up, make a house, tree, lamp, tent, shovel or broom |
| 2 | Fit two shapes to build a boat, flag, lamp, tent, fish, shovel or broom |
| 3 | Turn the shapes with quarter-turn snaps |
| 4 | Two triangles make a square; three shapes fill a picture |
| 5 | Build a rocket, houseboat, castle, robot or ship from four shapes |
| 6 | Fill a silhouette; ask for outlines and the next turn when needed |
| 7 | Build a house two ways: a square or two triangles can make its wall |
| 8 | Find a shape facing the wrong way, turn it, then check the repaired picture |
| 9 | Flip a leaning shape to match its outline: a flip makes a mirror that no turn can |
| 10 | One piece home: one shape is already in the picture; move the other onto its shadow |

<!-- end generated -->

**Starts as:** one shape home: a house, tree or lamp with one of its two shapes already in place, the other moved onto its shadow (toddler, level 10); then fit two big shapes into a house, tree or boat

**Grows into:** thirty pictures across level pools (including two-piece shovel and broom pictures at 1–3), spoken shape names on first pickup for toddler–pre-K, quarter-turn snaps, two triangles making a wall, a four-piece rocket, houseboat, castle, robot or ship, silhouettes with optional help; a house wall built from one square or two triangles (7), turning/checking a broken picture (8), and flipping a leaning parallelogram to fix a picture (9)

## Design notes

*After tangrams and silhouette puzzles.* Each of levels 1–6 draws one of 4–12 pictures from its pool (twenty-four in all: house, tree, boat, sailboat, flag, cottage, truck, tower, ferry, rocket, houseboat, lamp, bus, castle, tent, barn, robot, fish, lighthouse, pine, bridge, shovel, ship, broom; the broom joins an upright rectangle handle to a triangular brush at levels 1–3; the shovel joins a rectangular handle to a trapezoid blade at levels 1–3; the bridge, a rectangle deck over two upside-down hull piers, and the pine, a roof over an upside-down hull on a square trunk, are only in the level 6 silhouette pool), built from shuffled large pieces. At toddler, preschool and pre-K, each physical piece says its geometric name once on pickup (square, triangle, rectangle or trapezoid); two separate triangles each name themselves. The roof is a triangle and the hull is a trapezoid. The four-piece robot at levels 5–6 joins a square head, rectangular body and two triangular feet. The four-piece ship at level 5 joins a hull, an upright rectangular mast and a triangular sail on each side. Picking it up again stays quiet; names are support, not hints. School play has no pickup speech. Quarter-turn controls rotate the selected piece; identical triangles and symmetric rectangle/square rotations are accepted. Later silhouettes can reveal outlines and orient the next piece through help. Off-board drops and turning are exploration. Wrong placements on the picture get a spoken hint and a glow after two misses. Help affects hint accounting.

**Level 7 (school), one wall two ways:** four turned pieces wait beside a house silhouette: roof, square and two complementary triangles. Cover its wall with the square or with both triangles, and add the roof; either complete cover ends the round with one sticker, leaving the spare shapes in the tray. An accepted partial cover always has a completion. The square cannot overlap a placed triangle, and spare-wall drops return freely with a spoken explanation. Ordinary wrong shapes/turns near an open slot retain the gentle miss and two-miss glow. Help chooses a missing piece from the shortest surviving cover, preferring the square until a triangle is placed; then it follows the triangles. The ghost finger follows the same rule through real turn taps and drags. Completion names the two or three pieces used without marking either build wrong. School extends to 5–7; other bands and saved IDs/pins are preserved.

**Level 8 (school), Fix the picture:** a seeded assembled picture has exactly one non-symmetric shape facing the wrong way, with faint correct outlines behind it. Tap a piece to select it, turn it in place with the round arrow, then use the green check. Turns and selections are free revision; four turns restore a piece. Wrong checks count one miss and explain the mismatch; two wrong checks glow an actual mismatch and count one hint. Requested help selects an actual mismatch without turning it, counting once while the support is visible; if everything matches, it suggests Check for free. A correct check finishes with one sticker and a repair explanation. Eight picture kinds have distinct selectable centers; wrong-shape swaps are unbuilt. School extends to 5–8, preserving younger bands and saved IDs/pins.

**Level 9 (school), Flip it:** a repair round like level 8, but the one wrong shape is always the new parallelogram (it leans like a backslash), mirrored and/or quarter-turned away from its slot; every other piece is already right, and the faint outline shows the target, which always leans right. A purple flip button joins the turn button and the green check (the `flip` slot in `townLayout`, under check at y=670, tested in `upright.test.ts`). Flip mirrors the selected piece and a turn rotates it; both, like selecting, are free revision, and two flips undo. The rule `looksSame` compares geometric corners after flip then turn, so a mirror image is not matched by any turn (a turn alone cannot fix a lean). Six pictures carry exactly one parallelogram each: kite, sled, scarf, dock, step and ramp. Wrong checks count one miss and explain with `tangram.flip-try`; two wrong checks glow the actual mismatch and count one hint (`tangram.flip-hint`); requested help selects it without fixing it. `fixFor` and `repairAction` give the bot and help the truthful next step (select, flip, turn or check, now able to return `{flip:true}`). A correct check finishes with one sticker and `tangram.flipped`. School extends to 5–9, other bands and saved IDs/pins unchanged. Keeping a built picture in the treehouse is the separate level 10 slice.

Tap-then-place (levels 1–3): a tray piece can also be placed by tapping it (it is held at its tray home) and then tapping a shadow, with the tapped point as the piece's middle; a wrong shadow is the same miss as the same drag, and letting go, switching or tapping empty ground is free. At level 3 she turns first, then taps the piece and its shadow. Levels 4–9 are unchanged, and the how-to card still shows the drag.

**Upright on a phone (2026-11-19).** `townLayout` in `layout.ts` places the board, tray and button column, tested over every level and five upright views (plus 360 × 800 and 768 × 1024) in `upright.test.ts`. Held upright the tray pieces rest in rows of two (four 150-unit touch circles in a row did not fit between the guide corner and the 768-wide edge), the lowest row stays clear of the guide and the cream tray panel grows to match; the board and the turn, help and check column are unchanged. Sideways keeps the old layout.

**Level 10 (toddler, played first), one piece home:** one of level 1's two-shape pictures (house, tree, lamp, tent, shovel or broom) starts with one of its shapes already in place, and the other waits alone in the tray the right way up. A drop within about 110 of its shadow snaps it home (the other levels take about 76); a tap on the shape and then on the shadow places it too, as at levels 1–3. A drop anywhere else simply returns it, with no boing and no miss, so the round always finishes; the help hand glows the shadow and counts as help. The shape still says its name when first picked up. It is listed in `entryLevels`, so a saved level 10 carried into preschool starts that band at its easiest level. *Pick the missing piece* (a built picture with one empty slot and a wrong piece that never fits) is the second half of dive slice 8 and is not built.
