# Fold and press: Mirror Brush's fold button in Rainbow Fingers (definition)

Defined 2026-10-17 for [chunk 4](../ROADMAP.md) (*Mirror Brush's fold button*), from the sketch **Fold!** in [Rainbow Fingers' deep dive](../deep-dives/rainbow-fingers.md#new-levels-on-top) and the *Mirror Brush* row in [IDEAS](../IDEAS.md). The dive's fresh-content item 5 already plans the **live mirror**: crease pages at levels 1–2, where each dab is copied to the other side as she paints. This definition covers the other half of Mirror Brush, which IDEAS kept back: **a fold button that presses the paper closed and prints one side onto the other**, as a butterfly blot does. Bug Builder's level 10, *Fold a friend*, keeps the step where she predicts the unfolded half ([dive](../deep-dives/bug-builder.md)). Nothing here asks her to predict.

**Fun action and purpose:** she paints wet color on a page with a dashed crease down the middle. Then she taps the big fold button. The right half of the paper swings over, presses with a soft squish and swings back open, and her painting now has a matching mirror twin. The learning goal is exposure to mirror symmetry and to cause and effect, in the safe form IDEAS settled on: the fold does the work, so nothing is wrong and nothing is scored. Preschool guidance is to show children symmetry without expecting symmetrical work. Children match symmetric pairs no better than chance until about 8 to 9 ([Shao and Gentner, 2019](https://groups.psych.northwestern.edu/gentner/papers/ShaoGentner_2019-Symmetry.pdf)). Line symmetry is a grade 4 standard ([4.G.A.3](https://thecorestandards.org/Math/Content/4/G/A/3/)). So the toy belongs at the young end, and prediction waits for Bug Builder.

## References

| Reference | What it does | What we take |
| --- | --- | --- |
| Hervé Tullet, *Mix It Up!* (Chronicle, 2014; [Publishers Weekly](https://www.publishersweekly.com/9781452137353), [Kirkus](https://kirkusreviews.com/book-reviews/herve-tullet/mix-it-up)) | The reader closes the book "so the colors squish together," and opening it shows the printed result | The close–press–open rhythm and its "squish" as the whole fun; one big obvious action |
| Butterfly blot painting ([UGA](https://ladb.uga.edu/activity/butterfly-blots)) | Paint one half, fold, press, open. For young children, draw a line on the crease so they see where to paint | A dashed crease and faint wings on the page. Paint on both halves prints both ways, as real paint does |
| *Silk* by Yuri Vishnevsky ([National Math Festival](https://nationalmathfestival.org/resources/silk-interactive-generative-art)) | Each stroke is mirrored at once, so a pattern appears with little effort | Already used by the live-mirror crease pages; the fold page adds a separate moment where the copy appears |
| *Little Canvas* and *Symmetry Lab* (App Store listings in [the dive](../deep-dives/rainbow-fingers.md)) | Symmetry painting apps with an always-on mirror | Contrast: an always-on mirror hides the cause. A button she presses shows that the fold makes the copy |
| Bug Builder's *Fold a friend* ([dive](../deep-dives/bug-builder.md)) | School band: predict which bug a fold will make, then watch the fold | Kept separate. This page never asks for a prediction, so the two do not overlap |

## Where it lives: a page type, not a new level

Fold pages are a **seeded page type at level 2** (*Paint pots*: lap 1–2, toddler 1–3, preschool 2–5), not a new level ID. A new ID would have to be appended after 7, and IDs 8–12 are already planned in the dive as color-mixing levels. Level 2 is where she first picks a pot color, so a print is in colors she chose. It is also the youngest level where she can sensibly aim for a button. Level 1 keeps only plain and crease pages.

- **The page draw** (a pure `pageKind(level, rng)` in `logic.ts`): level 1 gives plain or crease (the dive's one in three). Level 2 gives plain, crease or fold, about a third each. Level 3 and up always give plain (they are coloring pages with pictures).
- **If the crease pages are not built yet**, this slice builds the shared pieces they need: `mirrorX`, the dashed crease and the faint wings. Level 2 then draws plain or fold, half each, and the crease slice adds its third later. The two slices can land in either order. Lean: crease first, because it is already "ready" in the dive.
- **Bands:** a lap child can play a fold page, because a stray tap on the button just makes a print, and there is a co-play line for it. Preschool reaches it at its lowest level only. School does not reach level 2; Bug Builder's fold covers that age.

## First round (a fold page)

1. The paper has a dashed crease down the vertical middle and two faint wing outlines, one each side (code-drawn, `palette.ts` paper tints, `eventMode = 'none'`). The pots are where level 2 puts them. The pet says the instruction through `ctx.instruct('paint.fold')`: "Paint one side. Then press fold!"
2. She paints with a finger, as on any level 2 page. Painting is welcome on either half and on the crease. Nothing is clipped.
3. After her first mark (a stroke or a bloom), the **fold button** pops in with `outBack`: a `RoundButton` of radius 52 (104 across) at the bottom centre, on the crease line. It uses a new `foldIcon()` (a sheet with a curved arrow). The pet wiggles once toward it.
4. **She taps fold.** Strokes in progress lift, and touches on the paper are ignored for about 1.2 s. The fold animation runs:
   - A snapshot of the right half swings over by tweening `scale.x` from 1 to −1 about the crease, darkening a little halfway.
   - A soft press: a short synthesized squish (Web Audio filtered noise, no file) and a slight paper squash.
   - The half swings back open. The mirror print is now part of the painting, and a pentatonic bell plays.
   - The pet says one of three `paint.folded` lines: "Squish… open! It matches!", "Look, two sides the same!", "A butterfly print!"
5. She can paint more and fold again as often as she likes. A later fold prints only what she painted since the last fold, so marks already printed are not printed twice (see the rule).
6. **Finish:** unchanged. The frame button appears after the usual count of strokes (once the dive's slice 2 lands, any five touches). A fold counts as one stroke toward it. She is never required to fold, and tapping the frame hangs the painting as on any level 2 page.

**The print rule:** at a fold, every mark made since the last fold gets a mirrored copy across the crease (`x → 1 − x` in the paper's normalized space). Paint on the right prints to the left as well, as real paint would. A mark whose distance to the crease is less than its own radius is not copied, because it already sits across the fold. On screen, the build copies the painting's `RenderTexture` to one reusable scratch texture and draws the scratch over the painting, flipped about the crease, at alpha 0.85, since a blot print is a little lighter. A texture cannot be drawn into itself, which is why it needs the scratch. The scratch is created on the first fold and destroyed in `destroy()`.

## What she decides

What to paint, which colors, which side, and when to fold. Every choice is welcome: one dab makes a two-dot print, and a whole page makes a dense butterfly. The fold teaches by showing her: the copy appears only when she presses.

## Misses, hints and glow

- **No misses.** Folding a blank or symmetric page, folding again, or painting on the crease are all free play.
- **No hints counted.** A nudge with no accounting: if the page has paint and she has not touched the screen for eight seconds, the fold button wiggles and the pet points. This is the dive's free-play nudge, aimed at the button. It never glows, and nothing counts toward `hints`.
- **Adaptation:** `ctx.finish({ misses: 0, hints: 0 })` as on any level 2 round. A free page is not evidence of mastery, which matches level 2 today.

## Rule tests (`logic.test.ts`)

- `mirrorX` is an involution (`mirrorX(mirrorX(x)) === x`), maps 0.5 to itself and keeps every value inside 0..1.
- `foldMarks(marks, since)` returns the old marks, the marks since `since`, and one mirrored copy of each new mark. A mark within its radius of the crease gets no copy. A second fold with no new marks adds nothing. Every result stays inside 0..1. Flowers are mirrored as flowers in the same color.
- `foldMarks` respects `PAINTING_MAX_MARKS`: past the cap it uses the existing halving, and the result is never over the cap. The kept painting's format does not change.
- `pageKind`: levels ≥ 3 always give plain; level 1 never gives fold; level 2 gives all three. Over 300 seeds each kind at level 2 lands between 25% and 42%. The same seed always gives the same kind.
- `foldButtonPlace(w, h)` for the four standard views: centred on the crease, at least 104 across, inside the view, clear of the pet's box and of the home and frame buttons (a centre at least 104 from each).
- The extended `paintStep`: on a fold page with at least two strokes, it returns `{ do: 'fold' }` exactly once before `{ do: 'frame' }`. On plain and crease pages it never returns `fold`.
- `foldScribbleArea(w, h)` (the bot's left-half area): every `scribble` point is at least `BRUSH_RADIUS` left of the crease. So the demonstration paints one side, and the print visibly makes the other.

## Ghost-finger bot

`autotouch()` on a fold page: tap a pot (as level 2 does now), draw two wavy strokes from `scribble` inside `foldScribbleArea`, tap the fold button, wait while the fold runs (`folding` is false again), then tap the frame. On plain and crease pages the bot is unchanged. The how-to card's demonstration plays whichever page kind the seeded round would draw. The scripted check below therefore restarts until it gets a fold page (one in three, so about six tries at most) instead of adding a dev-only override.

## How-to card (`howto.ts`, `rainbow-fingers`)

- New step, `{ from: 2, to: 2, text: 'Some pages have a fold down the middle: paint, then tap the fold button to press the paper closed and print a matching copy on the other side.' }`. It is true at level 2 whatever page is drawn, because it says "some pages".
- New note line, `{ from: 2, to: 2, text: 'Folding is never needed: any painting can be hung up, and folding again only prints the new paint.' }`. It joins the existing level 1–2 note.
- No "later levels" wording, so the level-relative test is satisfied.

## Couplings

- **Art:** `foldIcon()` in `src/ui/icons.ts`; the dashed crease and faint wings (shared with crease pages); a half-paper snapshot sprite for the swing. All code-drawn, and every texture is freed in `destroy()`.
- **Voice** (`voice-script.ts`): `paint.fold` (instruction, repeated by the pet) and `paint.folded` with three wordings. No other new lines.
- **Sound:** a synthesized squish and the existing `sfx.bell`. Music stays `STYLES.paint`.
- **Saved painting:** mirrored marks are ordinary `PaintingMark`s, so `creations.ts` and the treehouse frame need no change, and old saves are unaffected. In the rework, a kept painting is something she made, not an unlock. Nothing is gated, rotated or timed.
- **Journal (optional):** if the dive's `'paint'` journal source (decision 7) lands first, a "butterfly print" entry can be filed on her first fold through `RoundResult.discoveries`. Otherwise there is no journal work.
- **Co-play and off-screen:** co-play, "Paint a dot together, then press fold and guess where it lands." Off-screen: the dive's *fold-and-press butterfly with a spoonful of paint* is the real thing.
- **Couch:** none. It is a calm, scoreless toy, as the dive says for Rainbow Fingers.
- **Docs at build:** the GAMES.md entry, the README row (no count change) and IDEAS: retire Mirror Brush's fold-button half and point Fold! here.

## Check tier for the build

*New interaction on an existing game:* typecheck, unit tests (the rules above and the how-to test), then **one** scripted play of level 2 restarted until the round is a fold page (paint, fold, fold again with nothing new, frame), `fingerdemo` at level 2 on a fold page, and one portrait screenshot just after the print. `npm run build` only if a shared file changes (`icons.ts` is shared, so yes).

## Open developer decisions

1. **Where the fold appears.** Lean: level 2 only, about one page in three, as above. The alternative is a fold button on every level 1–2 page, which is simpler but takes away the plain toy page.
2. **Fold button versus dragging the paper closed.** Lean: the button, since a toddler can tap a 104-unit target but cannot reliably drag a page edge across the screen. A corner drag stays a sketch for older bands.
3. **Person check (add to DEVICE-CHECKS when built):** does a two-year-old connect the press to the copy, and is the squish pleasant rather than startling?

None of these gates the build: the leans are the defaults.
