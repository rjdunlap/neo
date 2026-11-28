# 2026-11-28 — Pad pointer follows moving things; Bubble Pop's bubbles

**Changed:**
- `src/app/pad-pointer.ts`: the hand stays on the thing it jumped to while it moves (until an arrow, a glide or a press lets it go), and an arrow tap jumps to a thing nearly straight ahead however far. `touchSpots` takes extra things from `Game.pointerSpots()`.
- `Game.pointerSpots()` (new, optional) and Bubble Pop's: its bubbles, which a touch anywhere pops by nearness, so they have no listener of their own.
- A sweep of all 204 touch games at 1366 by 768 (Enter on the card, then count what the hand can jump to): 180 have two or more targets; the 22 with one or none are the next batch.

**Ran:** `npx tsc --noEmit`; `npx vitest run src/app` (pad pointer 6 tests); scripted keys in Bubble Pop (toddler): the hand jumped from the top of the window to a rising bubble and rode it.

**Not run:** full `npm test` (CI runs it), browser suites; no physical controller (parked).
