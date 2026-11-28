# 2026-11-28 — Pad pointer follows moving things; Bubble Pop's bubbles

**Changed:**
- `src/app/pad-pointer.ts`: the hand stays on the thing it jumped to while it moves (until an arrow, a glide or a press lets it go), and an arrow tap jumps to a thing nearly straight ahead however far. `touchSpots` takes extra things from `Game.pointerSpots()`.
- `Game.pointerSpots()` (new, optional) and Bubble Pop's: its bubbles, which a touch anywhere pops by nearness, so they have no listener of their own.
- A sweep of all 204 touch games at 1366 by 768 (Enter on the card, then count what the hand can jump to): 180 had two or more targets. Of the rest, the ones whose pieces are heard by one layer now list them: Sea Lift (request card, number cards, landings), Pixel Pictures (every square), Recipe Workshop (pots, toppers, spoon, bowls…), Pile Match (every piece), Thought Bubbles (the picture's parts on the pointing level), Duckling Parade (loose ducklings) and Puddle Gobble (things on the sand). A place with nothing drawn is a point in stage units. The tracing and drawing games (Cut Along, Draw the Pattern, Dot Link, Letter Trails, Lasso Loops, Vine Snip) are left to the glide with the button held.

**Ran:** `npx tsc --noEmit`; `npx vitest run src/app` (pad pointer 6 tests); scripted keys in Bubble Pop (toddler): the hand jumped from the top of the window to a rising bubble and rode it. The sweep again on the seven games: 5 to 36 targets each (Thought Bubbles 0 off its pointing level, as expected); Pile Match and Pixel Pictures moved piece to piece and square to square by arrows.

**Not run:** full `npm test` (CI runs it), browser suites; no physical controller (parked).
