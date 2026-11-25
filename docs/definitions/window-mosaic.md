# Pixel Pictures, Window Mosaic: level 13 (definition)

**Status:** defined 2026-11-25, not built. Build it as one new level of `pixel-pictures`; read [The level](#the-level) and [Registration](#registration-and-files).

Defined as slice **R6** of the [fractions study](../deep-dives/subjects/fractions.md#build-slices-in-order), from its [candidates row](../deep-dives/subjects/fractions.md#candidates-and-fit) and [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#fractions-recommendations). It is **one level of an existing game, not a new game**: the study said to merge Window Mosaic into an existing art or fitting game "if fractions do not change the action", and here they change what the tap means, not the tap. Every [open decision](#open-decisions) has a default the build uses.

**Fun action and purpose:** a window of sixteen panes hangs on the wall with eight panes colored in. She colors a second, empty window so the same amount is colored, but in a shape that does not look like the first. Then the pet slides the panes across one for one to show that nothing was left over. The learning goal is that **the same amount can be colored in very different shapes**, so a window with a long thin border, many separate colored bits or a different outline is not "more" or "less" colored. That is equal area, kept apart from perimeter and from the number of separate pieces, the two things a young eye uses instead.

## References and source check

No new source was opened. The study's [anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits) apply: area partitioned into equal parts, with the whole kept visible. The mixed-up cues this level is built against are the common ones: a shape with a longer edge looks bigger, and a pattern in many separate bits looks like more. The study asked for the area and division language to be read before build. Under the [October 23 record](../archive/DECISIONS-2026-10-23.md#standing-rules) the building session reads every voice line against the [voice table](#voice) as that source check, and records that it did.

## Overlap

Checked against `origin/main` at `03f72418e` (GAMES entries, `src/games/pixel-pictures/`, the Tangram Town and Puzzle Pals pages).

| Game | What it already owns | Why Window Mosaic is different, and why it lives in Pixel Pictures |
| --- | --- | --- |
| Pixel Pictures 1–12 | Tap squares on a small grid to copy, mirror, solve or write a picture; level 10 is a free picture; 4×4 boards and 100-unit squares exist | The same board and the same tap. No level has a count as the goal or compares shapes. **This is the owner:** a new game would only repeat its grid, palette and Done button |
| Tangram Town 1–9 | Fitting whole shapes into a silhouette; two triangles equal a square (level 7) | Pieces move and turn there. Here nothing is placed or turned: panes are only colored or not, and the shapes are never fitted |
| Puzzle Pals | Putting cut pieces back in a picture | No area claim, no second picture to match |
| Ribbon Workshop 1–7 | Fractions as lengths of one ribbon | A length, not an area. The ribbon stays there |
| Frog Hop 9–10, Memory Match 11, Pet Kitchen 14–15 | Positions on a line, naming pictured halves, equal shares of food | Memory Match 11 names half a picture; none asks for the same amount in a different shape |
| Duck Pond, Picture Graph | A fraction of a collection | Counting a collection, not covering a window |

## The model (`logic.ts`)

Everything is integer panes. A window is a 4×4 grid of equal panes held as a 16-bit mask, row-major from the top left, and **nothing is compared in pixels**. There is no polygon engine and no cutting.

- **Constants:** `MOSAIC_SIZE = 4`, `MOSAIC_PANES = 16`, `MOSAIC_AMOUNT = 8` (half the window).
- **Models:** four authored masks of eight panes each, all four frozen, with the numbers the tests re-derive:

  | Model | Rows (`X` colored) | Separate colored groups | Edge length around the colored panes |
  | --- | --- | --- | --- |
  | Left half | `XX..` `XX..` `XX..` `XX..` | 1 | 12 |
  | Two bars | `XXXX` `....` `....` `XXXX` | 2 | 20 |
  | Two corners | `XX..` `XX..` `..XX` `..XX` | 2 | 16 |
  | Checkerboard | `X.X.` `.X.X` `X.X.` `.X.X` | 8 | 32 |

  A group is panes joined along a side, not along a corner. Edge length counts every pane side next to an uncolored pane or the window frame.
- **Same shape:** two masks are the same shape when one is the other turned in quarter turns or flipped (the eight symmetries of the square). `canonical(mask)` is the smallest mask over those eight. The two checkerboards are therefore one shape.
- **Tag 1, *Color the same amount*:** her window starts empty, the model hangs beside or above it, and she taps panes to color or uncolor them. `check()` judges:

  | Verdict | When | Counts |
  | --- | --- | --- |
  | `empty` | nothing colored | nothing |
  | `fewer`, `more` | the colored count is not 8 | one miss |
  | `same` | exactly 8, but `canonical` equals the model's | nothing; the pet asks for a shape that looks different, and her panes stay |
  | `right` | exactly 8 and a different shape | finishes the tag |

  Any different shape of eight is right, including a scatter of single panes. No shape she makes is called wrong: a count is the only thing that can miss.
- **Tag 2, *Which window matches?*** The model is shown with three windows to choose from. Exactly one has 8 colored panes. Of the other two, one has 6 and one has 10 colored panes. The right window never has the model's group count or edge length, and **at least one wrong window has the model's edge length and at least one has its group count**, so neither can be used as the test. The sets are authored in a pool (`MOSAIC_SETS`) and chosen by seed; a test enforces these rules over the whole pool. A tap on a wrong window is one miss.
- **Proof, after tag 2:** the pet lifts the model's colored panes one at a time, in reading order, and each lands on one of her colored panes. Eight go, eight land, none are left. It is shown, never asked, and it does not count a tap or a miss. A line says that different shapes can hold the same amount (see [Voice](#voice)).
- **Hint:** `hintAction(state)` is the first step of the shortest route to an accepted state. On tag 1 with fewer than 8 colored it is the first uncolored pane (in reading order) whose coloring does not leave her window the same shape as the model's; with more than 8, the first colored pane to clear; with exactly 8 and the same shape, the first colored pane to clear (the next hint then adds a pane elsewhere). On tag 2 it is the right window.

Every state can be enumerated: 2¹⁶ colorings, so the tests check the verdict for every one of them against a plain count and `canonical`.

## The level

| Level | Mode | Name (`describeLevel`) | What it adds |
| --- | --- | --- | --- |
| 13 | `mosaic` | *Same amount, new shape: color a second window so half of it is colored* | The amount is the goal and the shape is free. A count, not a copy |

`school` only, because it relies on half of sixteen as a number. A round is two tags over one model and gives one sticker. The seed picks the model (each of the four once in four rounds before one repeats), the window and pane colors, and which choice window is on which side, never the counts. This is one idea to meet, not a drill, and the definition adds no second level to pad it out. A harder ladder (a quarter of the window, a third on a 3×3 window) is a later definition, not this one.

### First round

Model: the left half. Tag 1: she colors her window; the pet is content with any eight that do not look like the left half turned or flipped. Tag 2: three windows, the right one the checkerboard or the corners (never one sharing the model's edge length of 12), the wrong ones with 6 and 10 panes, one of them also a single block (edge length 12). Then the proof, then the sticker.

## Screen and controls

Level 13 is a `mosaic` mode of `pixel-pictures`, played upright like the rest of that game.

- **Tag 1:** her window is the board, 4×4 at 100 units a pane, the existing `CELL`, tap to toggle. Taps use `onTap` as levels 1–2 do. The model window hangs above it at 40 units a pane, as the copy model does in portrait. A second, smaller tap target is not needed: the **Check** button is the existing green check at the existing `DONE_RADIUS`, clear of Home and Help. No color palette: one color, drawn from `src/art/palette.ts`.
- **Tag 2:** the three choice windows sit in a row under the model, each at most 200 units wide and never narrower than 100 on its shortest side after scaling. The whole window is the target, not a pane. Where the view is under 700 units wide they shrink to fit and a stacked column is used before any shrinks below 100.
- **Help, Home, Back:** unchanged. The guide and pet are the existing corner guide.
- Counts are never shown as digits on screen, and no pane is numbered. The pet may say a number in the [voice](#voice), the one place a number is spoken.

## Accounting, help and finishing

- **Misses:** a wrong count on `check()` (`fewer`, `more`) and a wrong window on tag 2, each one miss. `same` and `empty` are free. Retry is always available.
- **Hints:** the Help button or the glow after two misses plays `hintAction`. Using it counts as a hint, as elsewhere. A round finished with help still gives its one sticker; it is supported, not independent.
- **Finish:** `ctx.finish({ misses, hints })` at the end of the proof. The game awards nothing, saves no creation and draws no celebration of its own.
- Her colored window is not kept; it is a means to the question, as in levels 1–2. The grown-up page needs no new line beyond the generated level description.

## Rule tests (`logic.test.ts`)

1. All four models have exactly 8 panes, and their group counts and edge lengths equal the table above.
2. `canonical` is the same for a mask and each of its eight symmetries, and the two checkerboards share it.
3. For every one of the 2¹⁶ masks, `check()` returns `empty` for 0, `fewer` below 8, `more` above 8, `same` when 8 and `canonical` matches the model, and `right` otherwise, for each model.
4. Every `MOSAIC_SETS` entry has one window of 8, one of 6 and one of 10; the right window's group count and edge length both differ from the model's; at least one wrong window matches the model's edge length and at least one matches its group count.
5. A seeded round never shows the same model in consecutive rounds, and the right window is on each side across seeds.
6. `hintAction` from every reachable state is a legal action, and applying it repeatedly reaches `right` in at most 8 steps, for each model.
7. Level 13 appears in the school band's order after 12 and before 10, and in no other band.

## Ghost finger, how-to card, voice and registration

- **How-to card:** a short card for level 13 in `howto.ts`: a window with some panes colored, a finger tapping panes in a second window until the colored amount looks the same, then three windows and the finger on the matching one.
- **Ghost finger:** `autotouch()` colors eight panes in a shape different from the model (the bot picks the first eight in reading order that are not the same shape), taps the check, and on tag 2 taps the right window, so `fingerdemo` at level 13 finishes a round. Its steps read `hintAction`.

### Voice

Lines live in `voice.ts`; the building session reads each against these:

| Moment | Line |
| --- | --- |
| Tag 1 start (`ctx.instruct`) | "Color this window so the same amount is colored. Make the shape different!" |
| `fewer` | "A little more to color." |
| `more` | "That is too much. Take some away." |
| `same` | "That is the same shape, turned around. Try a shape that looks different." |
| Tag 2 start (`ctx.instruct`) | "Which window has the same amount colored?" |
| Wrong window | "Not that one. Look at how much is colored, not where." |
| Proof | "Every colored pane has a partner. Nothing is left over!" |
| Finish | "Different shapes, the same amount. Half the window is colored." |

Do not run the voice-clip renderer in this slice; device speech is the fallback until a `Better voice` pass.

### Registration and files

Level 13 appended to `PLANS` as `mode: 'mosaic'`, `size: 4`, `colors: 1`, `pictures: 1`, with `school` order `[3, 4, 5, 6, 7, 8, 11, 12, 13, 10]` (13 after 12, 10 still last as the free level). No new game ID, land, band, skill, save field or sticker; check the existing skills list and add none unless it already has an area skill.

Expected files: `src/games/pixel-pictures/logic.ts`, `logic.test.ts`, `index.ts`, `layout.ts`, `howto.ts`, `voice.ts`, a new `mosaic.ts` if `index.ts` would grow past its current shape, `docs/games/pixel-pictures.md`, [`docs/deep-dives/pixel-pictures.md`](../deep-dives/pixel-pictures.md), the [fractions study](../deep-dives/subjects/fractions.md), and a verification entry.

## Check tier

New interaction, per the [verification budget](../SESSION-GUIDE.md#keeping-checks-light): typecheck, unit tests, **one** filtered scripted play of level 13 (a wrong count on tag 1, a hint, a wrong window on tag 2) and a portrait screenshot, then `fingerdemo` at level 13. `npm run build` only if shared files or assets change.

## Open decisions

1. **Registration.** Default: level 13 of Pixel Pictures (above). The alternative is a new small game, not taken because it would repeat the grid, tap, check and sticker of Pixel Pictures for one level.
2. **The word "half".** Default: the pet says it once, after the proof, and no digit appears on screen. Nothing else on the screen names a fraction.
3. **Shapes that are the same turned.** Default: the check treats a turned or flipped copy of the model as `same`, free and not a miss, and asks for a new shape. If that feels like a rule against her, change it to accept any 8, and the proof stays.
4. **Level numbering.** Default: 13, the next free stable ID, placed with `order` and never renumbered.
