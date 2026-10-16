# Mode gallery N4: Bubble Pop's intro shows modes, not only numbers

**Definition, 2026-10-16 (docs only).** Roadmap [chunk 20](../ROADMAP.md#chunks), source pilot [N4](../FAMILY-EXPERIENCE.md#n4-show-modes-not-only-numbers). It turns N4 into one build slice: a named, pictured mode on Bubble Pop's existing intro card, with a small ladder of the band's levels in play order. Nothing here is built, and no other game is in scope.

Nothing here changes levels, bands, `order`, saves, pins, stickers, misses, hints, the bot or the demonstration. The level arrows, Play, Back and the "?" card keep their current behavior; the slice only adds a name, a picture and a ladder to what the card already shows.

## What exists (read from `origin/main` at `3564945`)

| Where | Today |
| --- | --- |
| `src/ui/howto-card.ts` (`HowToPanel`) | The intro card: header (icon and title), a `THIS LEVEL · <id>` label, the `describeLevel` text with two held arrows to its left (`STEP_RADIUS` 38, held `STEP_HOLD` 0.35 s, the arrow at an end dimmed), goal, steps, finish, note, then Play and Back. A demonstration window sits beside the text on a wide screen (`DEMO_WIDE` 400) or above it on a tall one. Long cards step their text down through `SCALES`; buttons keep their size. Card width is `min(view.w - 60, 1000)` wide, `min(view.w - 60, 760)` tall |
| `src/app/scenes/GameScene.ts` | `init()` takes the level from `store.levelFor` (a pin wins) or a one-round `startLevel`; `openIntro()` passes `pick: { range, step }` when the band has more than one level; `stepIntroLevel()` moves `this.level` with `stepLevel` and calls `card.show(howToFor(mod, level), demoAt(level))`. Back leaves; nothing is saved until the round finishes through `recordRound` |
| `src/progress/difficulty.ts` | `levelsInOrder(range)` gives the band's IDs easiest first (`order` if present, else `min..max`); `stepLevel` walks that order |
| `src/content/howto.ts` | `howToFor(mod, level)` builds `HowToCard { title, levelNumber, level, goal, steps, finish, note }` |
| `src/games/bubble-pop/` | Fifteen plans in `logic.ts` (`PLANS`, `planFor`); `LEVELS`: lap `{ 1–15, order [15, 1, 2, 3] }`, toddler 1–6, preschool 4–9, pre-K 6–12, school 10–14. `describeLevel` is a sentence per mode; the grown-up sees level IDs like 15 before 1 on lap, which is the confusion N4 names |

## The slice: a mode name, a picture and a ladder on the intro

### Names and pictures (Bubble Pop data)

A table in `src/games/bubble-pop/logic.ts`, one entry per level, keyed by level ID. Names are short and distinct within every band; the picture kind is data, drawn in a new `src/games/bubble-pop/mode-art.ts` with `Graphics` and palette colors (no sprites).

| Level | Name | Picture (about 112 × 112, code-drawn) | Spoken line (`bubble.mode.<id>`) |
| --- | --- | --- | --- |
| 15 | Pop anywhere | one big bubble and an open palm | "Pop anywhere! Pat the screen and the nearest bubble pops." |
| 1 | Pop the bubbles | three plain bubbles | "Pop the bubbles! Tap any bubble." |
| 2 | More bubbles | four plain bubbles, smaller | "More bubbles to pop!" |
| 3 | Lots of bubbles | five plain bubbles, smaller still | "Lots of bubbles, a little faster!" |
| 4 | Two colors | bubbles in two colors, one ringed | "Two colors. Pop only the color I say." |
| 5 | Three colors | three colors, one ringed | "Three colors. Pop only the color I say." |
| 6 | Five colors | five colors, one ringed | "Five colors. Pop only the color I say." |
| 7 | Count to 5 | bubbles 1, 2, 3 with dots | "Count to 5. Pop the numbers in order." |
| 8 | Count to 7 | bubbles 1, 2, 3 … 7, with dots | "Count to 7. Pop the numbers in order." |
| 9 | Count to 10 | bubbles 1, 2, 3 … 10 | "Count to 10. Pop the numbers in order." |
| 10 | Make 5 | two bubbles, 2 and 3, a sign showing 5 | "Make 5. Pop two bubbles that make 5 together." |
| 11 | Make 10 | two bubbles, 4 and 6, a sign showing 10 | "Make 10. Pop two bubbles that make 10 together." |
| 12 | Start at a number | a sign showing 4, then bubbles 4, 5, 6 | "Start at the number on the sign and count up." |
| 13 | Count back | a sign showing 5, then bubbles 5, 4, 3 | "Count back, one less each time, down to 1." |
| 14 | Tens and fives | bubbles 10, 20, 30 | "Count by tens or by fives." |

The pictures use the same numerals, dots and sign the round draws, so a grown-up who has seen the picture recognizes the round. Count and bond pictures show fixed example numbers, never the round's seeded draw (the card is built before the round and must not consume the round's RNG).

### A small optional contract

`GameModule` gains one optional field, used only by Bubble Pop in this slice:

```ts
/** A short name, a picture and a spoken explanation for a level, shown on the intro and "?" cards. */
levelCard?: (level: number) => { name: string; line: LineId; picture: () => Container };
```

`howToFor` copies it into an optional `HowToCard.mode` (name, line, picture factory). A game without it shows the card exactly as today; no other game's card, test or layout changes.

### On the intro card

| Row | What it shows |
| --- | --- |
| Label | `THIS LEVEL · Count back` with the ID kept small after it (`level 13`), since the grown-ups' page and pins still speak in IDs |
| Arrows and picture | The two held arrows, unchanged, then the picture tile (112 × 112, pale blue, rounded). The `describeLevel` sentence moves under this row at the full text width, so the narrow wide-screen column does not squeeze it |
| Ladder | One row of small pictures for every level in `levelsInOrder(mod.levels(band))`, the resolved played band only (lap: 15, 1, 2, 3; pre-K: 6 to 12). The level on the card is outlined; the level `store.levelFor` suggested when the card opened has a small green "next up" dot; a pinned level has a small pin. Decorative only: `eventMode = 'none'`, no taps, so the arrows stay the one deliberate way to choose. Tiles are `floor((inner − gaps) / n)` units, capped at 84; if that falls under 48 the ladder is omitted (never two rows, never a shrunk Play) |

**Interaction.** A tap on the picture tile speaks its line, replayable, and does nothing else: no level change, no hint, no progress. A held arrow changes the level as today and redraws the label, picture, outline, steps and demonstration; it does not speak (no repeated announcement while stepping). The "next up" dot and the pin mark do not move while stepping; they describe saved state, not the selection.

**The "?" card in a round** shows the label and picture (tap to hear) without arrows or the ladder.

**What saves.** Exactly as now: looking, stepping, listening and Back save nothing; finishing the round records it at the chosen level through `recordRound` (her saved level moves there by the existing rule; a pin stays). No mode key, mastery meter or new save field. If a real branching mode ever needs separate progress, stable mode keys and a migration are defined then (N4).

### Layout acceptance

Measured in the `howto` suite's landscape and portrait windows (1024 × 768 and 768 × 1024), plus one phone-sized portrait screenshot, at Bubble Pop's lap and pre-K bands (the shortest and longest ladders):

- Play and Back keep their current sizes and stay on screen; the card still fits through the existing `SCALES` steps.
- The picture tile is at least 100 units after any card scaling; the ladder is not a target.
- The ladder never overlaps the demonstration window or the arrows; in a wide layout it stays in the text column.
- The outline, dot and pin are told apart by shape as well as color.

## Build slice

1. **Bubble Pop mode gallery** (built 2026-10-16, [PR #412](https://github.com/rjdunlap/neo/pull/412); one deviation: beside a demonstration the ladder sits under the demo window, its tiles 4 units apart, rather than in the text column, where it never fit 1024×768; it is dropped before anything else if the card cannot fit at the smallest text scale. Lap and pre-K show it in both orientations at 1024×768 and 768×1024). Files: `src/games/types.ts` (the optional field), `src/games/bubble-pop/logic.ts` (the table), a new `mode-art.ts`, `index.ts` (wiring), `src/content/howto.ts` (`HowToCard.mode`), `src/ui/howto-card.ts` (label, tile, ladder), `src/app/scenes/GameScene.ts` (pass the suggested and pinned levels to the card), `src/content/voice-script.ts` (fifteen lines), and tests. Tests: every level in every Bubble Pop band's `levelsInOrder` has a card; names are distinct within a band; every line exists; a module without `levelCard` yields a card with no `mode` (so no other game changes); stepping on the intro never calls `store` writes. Tier: **shell** (a shared card and scene change): typecheck, unit tests, build, then `BROWSER_SUITE=howtolevel` and `BROWSER_SUITE=howto HOWTO_ONLY=bubble-pop` (the two suites that lean on the card), one portrait and one landscape screenshot of the lap and pre-K intros. No `world` or offline run (navigation and persistence are unchanged). Device speech and whether a grown-up finds the ladder clearer than numbers stay person checks.

A second game (Pet Says' lap order 13, 1, 2 or Jelly Drums' entry level are the next clearest cases) only after this one has been looked at by a grown-up; do not extract a shared ladder helper until then.
