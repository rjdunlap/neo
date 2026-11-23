# Key It Out

<!-- generated: from src/games/key-it-out; edit the text below the end mark (npm run game-docs) -->

**ID:** `key-it-out` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** following a key, reading a reference page, ruling things out

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | By the key: six sketches, every part showing; follow the key to each name |
| 2 | Unfinished sketches: nine sketches, four with a hidden part, so the key leaves names open |

<!-- end generated -->

**Starts as:** a page of pencil sketches of invented lake creatures and a field guide's identification key. At level 1 (*By the key*) six sketches show every part: choose one, answer the key's yes-or-no questions from what it shows, and tap the name the branch ends in. Three unstamped sketches carrying their right names at once are stamped together.

**Grows into:** level 2 (*Unfinished sketches*), nine sketches of which four hide one part behind reeds, a smudge or water, or leave the coat as an outline. A question about a hidden part opens both branches, so the key leaves two or three names open and the names already used settle the rest. Levels 3–4 (*Margin notes*, *Twelve in the guide*: habits, notes and a table) are defined, not built (batch `key-it-out 2`).

## Design notes

- [Definition](../definitions/key-it-out.md). The looks, the key builder, the fit rule, the chain (solver, hint order and difficulty filter), stamping, the full-page fault and the hint are in `logic.ts`; the sketch drawings are a pure recipe of shapes in `art.ts`, so a unit test checks that every part's values draw apart and a hidden part draws nothing of itself. Every board is generated from the round's seed; nothing is saved but the round's result.
- Choosing, reading, following branches, giving, moving and lifting names are free. Stamps say nothing about the other names. A page with every unstamped plate filled and no stamping is judged: a boing, the fault's sketch chosen and its question lit, and one miss per distinct full wrong page (the same page again replays the explanation, free). The second counted miss brings one hint; Help gives one at any time (a new hint counts once, the same one on the same page is free).
- **The note is fuller than the speech.** Spoken lines have no slots, so every one is a rendered clip: a fault speaks "The key reaches this name through a fanned tail. This one has a curled tail." The warden's note under the tabs carries the whole working with the sketch number and the names ("Sketch 4 is named Quorl. …"), as does the hint's ("… The key leaves Quorl and Plish. Plish is sketch 2. Name sketch 7 Quorl.").
- Upright: the chosen-sketch strip beside Home (back and next arrows, the sketch drawn large, its number over its name plate), the Sketches, Key and Help tabs, the note, then the open page above the caption bubble. Choosing a sketch on the Sketches page opens the Key page. The Key page scrolls inside its panel: a touch lights its target at once and acts on release, and a drag slides the rows. Sideways the Sketches page stays open on the left.
- Smallest target at 390 × 844: a key branch end or the name plate, 88 units (44.7 CSS px). At 390 × 625 with captions the strip, the tabs and three key rows fit above the caption bubble; level 2's eight rows slide.
- Tapping a stamped name in the key, or naming a stamped sketch, changes nothing and says the name or "That one is stamped already."
