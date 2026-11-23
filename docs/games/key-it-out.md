# Key It Out

<!-- generated: from src/games/key-it-out; edit the text below the end mark (npm run game-docs) -->

**ID:** `key-it-out` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** following a key, reading a reference page, ruling things out

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | By the key: six sketches, every part showing; follow the key to each name |
| 2 | Unfinished sketches: nine sketches, four with a hidden part, so the key leaves names open |
| 3 | Margin notes: every sketch hides a part and carries a note; the habits table settles names the key leaves open |
| 4 | Twelve in the guide: nine sketches and twelve names, so each sketch is settled from its own evidence |

<!-- end generated -->

**Starts as:** a page of pencil sketches of invented lake creatures and a field guide's identification key. At level 1 (*By the key*) six sketches show every part: choose one, answer the key's yes-or-no questions from what it shows, and tap the name the branch ends in. Three unstamped sketches carrying their right names at once are stamped together.

**Grows into:** level 2 (*Unfinished sketches*), nine sketches of which four hide one part behind reeds, a smudge or water, or leave the coat as an outline. A question about a hidden part opens both branches, so the key leaves two or three names open and the names already used settle the rest. Level 3 (*Margin notes*) hides one or two parts on every sketch and gives each a margin note ("Hums.", "Out at dusk.", "Eats snails."); a Table page lists each name's call, time and food, so a note rules out a name the key left open. Level 4 (*Twelve in the guide*) puts twelve names against nine sketches with one or two notes each: three names are never used, so "the only name left" stops being an argument and each sketch is settled from its own evidence.

## Design notes

- [Definition](../definitions/key-it-out.md). The looks, the key builder, the fit rule, the chain (solver, hint order and difficulty filter), stamping, the full-page fault and the hint are in `logic.ts` (levels 3–4 add each name's habits and the sketches' notes: a name fits only when the key and every note allow it, and the chain at level 4 has no "only one sketch left" step because three names are never sketched); the sketch drawings are a pure recipe of shapes in `art.ts`, so a unit test checks that every part's values draw apart and a hidden part draws nothing of itself. Every board is generated from the round's seed; nothing is saved but the round's result.
- Choosing, reading, following branches, giving, moving and lifting names are free. Stamps say nothing about the other names. A page with every unstamped plate filled and no stamping is judged: a boing, the fault's sketch chosen and its question lit (or, for a note the table disagrees with, the Table page opened at that name's row with the cell lit), and one miss per distinct full wrong page (the same page again replays the explanation, free). A page is judged by the naming that fills its last blank plate: at level 4, where three guide names are never used, swapping an unused name onto a full page is a free revision, not a new miss (a deviation from the definition's wording; at levels 1–3 every naming from a full page leaves a blank, so it changes nothing there). The second counted miss brings one hint; Help gives one at any time (a new hint counts once, the same one on the same page is free).
- **The note is fuller than the speech.** Spoken lines have no slots, so every one is a rendered clip: a fault speaks "The key reaches this name through a fanned tail. This one has a curled tail." The warden's note under the tabs carries the whole working with the sketch number and the names ("Sketch 4 is named Quorl. …"), as does the hint's ("… The key leaves Quorl and Plish. Plish is sketch 2. Name sketch 7 Quorl." or "… The key leaves Mollin and Yarrel. The note says it eats snails. The table says Yarrel eats berries. Name sketch 3 Mollin."). A table fault speaks "The table says this one clicks. The note says it hums."; a hint settled by a note speaks "A note and the table settle this sketch."
- Upright: the chosen-sketch strip beside Home (back and next arrows, the sketch drawn large, its number and margin notes over its name plate; tapping the notes reads them aloud, stopping when another sketch is chosen), the Sketches, Key, (levels 3–4) Table and Help tabs, the note, then the open page above the caption bubble. Choosing a sketch on the Sketches page opens the Key page. The Key page scrolls inside its panel: a touch lights its target at once and acts on release, and a drag slides the rows. The Table page scrolls the same way (the Key and Table share one scrolling-rows base, `scroll-rows.ts`): tapping a row's name gives it to the chosen sketch, and tapping a cell speaks it. A hint a note settles opens the Table at the right name's row; other hints open the Key. Sideways the Sketches page stays open on the left, beside the Key or the Table.
- Smallest target at 390 × 844: a key branch end or the name plate, 88 units (44.7 CSS px). At 390 × 625 with captions the strip, the tabs and three key rows fit above the caption bubble; level 2's eight rows slide, as do level 4's eleven key rows and twelve table rows.
- Tapping a stamped name in the key, or naming a stamped sketch, changes nothing and says the name or "That one is stamped already."
