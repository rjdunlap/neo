# Read & Do — Capital and stop A–C: get a sign ready for a reader

SS1 definition, 2026-10-22, [PR #839](https://github.com/rjdunlap/neo/pull/839), branch `claude/define-read-do-capital-stop`. Based on the [spelling-sentences study](../deep-dives/subjects/spelling-sentences.md#first-modes-proposed-ladder-ss1-capital-and-stop) and the [keyboarding study's KE3 handoff](../deep-dives/subjects/keyboarding-editing.md#candidates). **Docs only; no game change, registration, code or device evidence.** The rules below are a proposal for developer review. Build waits on the gates listed under [Settled and open](#settled-and-open).

## Scope and identity

Fun action: a short sign stands beside an animal; she dresses its first word with a capital and stamps a full stop on its end, then **Send** lets the animal act it out and the pet reads it back. Learning purpose: a written sentence begins with a capital letter and ends with a full stop, so a reader can see where it starts and stops. This is a convention for a reader, never a claim that an unpunctuated sign has no meaning: the preview and the animal act out either version.

It is an **existing-game mode of `read-do`** (`src/games/read-do/`): no new game, keyboard, free text, land, registration, band or shared editor. Overlap: Read & Do levels 1–3 own reading a fixed sign and choosing its picture; WC3 *Make the sign* owns composing from word tiles and KE1 *Mend the sign* owns the edit verbs (take a word out, put one in, swap one). SS1 owns **only the two conventions** on a sign whose words are already right, and never changes a word. Excluded: names, contractions, quotation marks, question marks and exclamation marks (SS3 and later), commas, spelling, and any judgement of how a child talks or writes at home.

## Where it sits in the ladder

The study's A–C are working labels, not saved level IDs. The Read & Do game dive (not yet run) assigns the IDs and must not renumber built levels 1–3, so this packet writes the steps against **"the next three consecutive levels after level 3, in the order A, B, C"** and the dive confirms the numbers (the likely IDs are 4, 5 and 6, but that is a gate, not a claim).

| Step | Name | Proposed bands | Round |
| --- | --- | --- | --- |
| A | *Start the sign* | pre-K, school | The stop is already on the sign; she gives the first word its capital |
| B | *Finish the sign* | pre-K, school | The capital is already there; she stamps the full stop |
| C | *Ready for a reader* | school | Both are missing; she does both, in either order |

`rangeFor` would list `prek` for A–B and `school` for A–C (so pre-K ends at B and school ends at C, matching the study); the dive checks that against `LEVELS` (`prek` 1–2, `school` 1–3 today) and the how-to's `LevelLine` wording. The default for a band stays the lowest step it holds. Nothing gates, and pre-K's entry to A is subject to the comprehension check in [Device and person checks](#device-and-person-checks) before any learning claim.

## The sentence table (for ordinary content review)

Every sign is a three-word clause: **the + animal + action**, with a small seeded pool. Words and meanings are the ones a child already meets in Read & Do.

- **Animals:** `duck`, `cat`, `pig`, `dog` (all in `CRITTERS`).
- **Actions:** `jumps`, `sleeps`. A jump is the existing arc; sleep is the existing sleepy mood with the Z.
- **Clauses:** the eight combinations, e.g. `the duck jumps`, `the cat sleeps`, `the pig jumps`, `the dog sleeps`. No names, no brands, no unusual spellings, none ending in a letter that a stamp could be confused with.
- **Singular verb forms (`jumps`, `sleeps`) replace level 3's `can jump`/`can sleep`.** This needs two new words per action in `WORD_LINES` and voice lines (`read.jumps`, `read.sleeps`, `read.pig`, `read.dog`), the only new spoken words. Reviewing the table means checking the eight clauses, the two verb forms and the pet's wording below.
- Case: tiles show the word as `the` (lower case) or `The` (capital) by the toggle; the rest of the clause never changes case.

A round is **three seeded signs** from the pool, drawn without repeating a clause inside a round and varying actors and actions so the same word does not lead every round. The seed fixes which convention is missing on each sign (A: the capital; B: the stop; C: both), so a replayed round never changes its puzzle.

## What she does

The sign is a row of the three word tiles (the existing unscaled 108-by-100 targets, spaced 116 apart) with a **separate full-stop socket** after the last word. Two controls are new:

- **The first word is a toggle tile.** Tapping *the* gives *The*; tapping again gives back *the*. Pressed-state feedback is immediate on touch-down; the glyph changes size and case, not just colour. The tile's hit area is unchanged (108 by 100) and the printed glyph size is independent of hit size.
- **The full stop is a stamp.** A 100-unit stamp sits on the stage beside the sign. Dragging it onto the end socket (via `src/engine/drag.ts`) places it; **tapping the stamp then the socket also places it**, and tapping a placed stop returns it to the stamp. A drop away from the socket returns the stamp freely. There is exactly one end socket, so a duplicate stop is impossible.
- **Send** is a large button (at least 100 units) at the sign's right. It checks **only the convention that step asks for** (A: capital; B: stop; C: both). No convention not asked about is ever judged.

Preview and listening are always free and never a miss or hint: the speaker (existing 110-by-100 replay target) reads the sign word by word whatever its state; tapping a word says it; **Show it** (a second button, or the speaker double-purposed only if the dive proves it fits) has the animal act the sign as it stands, with no verdict. The pet names the missing convention only after a failed Send or help.

## Mistakes, hints and accounting

- **Free, never counted:** preview, listening, toggling back and forth, dragging the stamp, a drop away from the socket, cancelling a drag (including `pointercancel`), removing the stop, Show it, and tapping Send with nothing changed **on a sign already correct** (it simply sends).
- **A miss** is a **Send that fails the requested convention**: one boing, then the pet names where a sentence *starts* (A) or *stops* (B), or the first missing one (C: capital before stop, consistently), and the edits stay as she left them. Each failed Send is one miss.
- **Hint:** two failed Sends **on one sign** glow the control she needs once and count **one hint** for that sign. The glow stays through retries without a second charge. Help she asks for (`Show a hint` from the pause sheet) glows the same control, counts one hint per sign, and adds nothing if the glow has already charged.
- **Supported finish:** after the glow, she can apply the shown change and Send; there is **no automatic apply**. Whether a "do it for me" control exists is left to the dive; if it does, it charges one hint if none was charged on that sign and ends the sign as help, never as independent mastery.
- **Adaptation:** misses and hints feed the shell's two-smooth-up, two-struggling-down rule unchanged; a round of three signs with at most one miss total and no hints is smooth. Assisted completion is not evidence of independent knowledge, and a child who is only exploring the toggle is not marked as struggling.
- **Completion:** after all three signs, **one sticker per completed round, including with help**, through `ctx.finish({ misses, hints })` (the existing `read.done` line). No timer, no lives, no streak, no speed credit. Conventional correctness, not fast completion, is what finishes a sign.

## Voice (planned IDs, not yet in `voice-script.ts`)

Use `ctx.instruct` for the goal and `ctx.say` for everything else; wording is a draft for ordinary review.

- `read.cap.instruction`: “A sentence starts with a big letter. Tap the first word to make it big, then Send.”
- `read.stop.instruction`: “A sentence ends with a full stop. Put the stop at the end, then Send.”
- `read.both.instruction`: “Get the sign ready for a reader: a big letter at the start and a full stop at the end.”
- `read.cap.missing`: “A sentence starts with a big letter. Tap the first word.”
- `read.stop.missing`: “A sentence ends with a full stop. Put the stop at the end.”
- `read.ready`: “Now a reader can see where it starts and stops: {words}.”
- `read.stamp`: the stop's name when picked up: “Full stop.”
- The punctuation is **named explicitly** in speech; text-to-speech prosody is never the rule checker, and the pet never reads a stop as silence.

The speech check for “first word”, “big letter” and “full stop” on the iPad is a device check, not assumed.

## Layout and presentation

- **Landscape (1024×768 design area, expanded):** the sign row centered at y≈185 as today (three tiles plus socket 116 apart fits within 1024); the speaker to the right as now; the stamp rests at the left of the row's second line (around x240, y300); the actor stays at y≈0.43·h; Send sits at about x 512, y 0.88·h under the actor, clear of the bottom-left pet.
- **Portrait:** the same row; the stamp moves under the sign; Send stays centered; nothing below 100 units. A test pass at four views (as `landLayout` does) belongs to the build.
- The sign is **not decorated with the answer**: no coloured first-letter hint and no highlighted socket until a failed Send, help or the glow. The socket shows as a plain dotted square.
- **Presentation:** Send lets the animal perform, with a short read-back (the existing word-by-word highlight) and a comfortable ending. The stop's click is a soft pentatonic tick from `src/audio/notes.ts`, never an explosion. Replays vary animal and action from the table. A before/after view, if added, never calls the original sign unreadable.

## Voice-of-the-game checks the build must keep

- Every sign has exactly one accepted capital state and exactly one accepted end state for its step; Send is the only judge.
- Both orders succeed in C and every intermediate state replays safely.
- Unchanged words and the actor mapping survive any edit (the toggle changes only case of the first word).
- Hints lead somewhere: the glow always lands on a control she still needs.

## Co-play, off-screen and bot

- **Co-play:** write the sign on a card and read it together; ask “where does it start?” and “where does it stop?”. Hearing it is free support.
- **Off-screen:** write a short sentence about a toy, first with a big letter and a full stop, and read it to someone. Not a replacement for the child's own writing, and her own writing is never corrected from here.
- **How-to card:** add steps scoped by `LevelLine` (A, B, C wording) that say only what the level on it asks; no “later levels” wording.
- **Bot:** `autotouch()` supplies a ghost-finger intent per step: tap the first word (A, C), tap the stamp then the socket or drag it (B, C), then tap Send. The bot must be able to play every new level.

## Rule tests the build needs

Enumerate the small edit-state space (capital on/off × stop on/off) and prove every reviewed sign completable and every failed Send leaves the edits intact; Send accepts exactly the requested convention per step (A ignores the stop's state, B ignores the capital's, C needs both, but in either order); the stop cannot be duplicated and a drop elsewhere returns it; the glow names a control she still needs and charges one hint per sign; seeded selection covers the pool without one fixed first answer and never repeats a clause in a round; replay never changes the puzzle; the table contains only the listed animals and actions; all new voice IDs exist.

## Settled and open

**Settled by this packet (proposal):** SS1 is a mode of Read & Do (no new game, land or registration); three signs per round; three-word clauses from the eight-clause table; stamp-and-toggle controls with a separate Send; misses are failed Sends only; one hint per sign after two failed Sends or on request; help is never mastery; one sticker per round.

**Gates that remain (no implementation is authorized):**

1. **Read & Do game dive** (queued, `deep-dives/README.md` tracker): assigns the level IDs and order after built 1–3, confirms the pre-K and school ranges, and reconciles this packet with WC3 *Make the sign* and KE1 *Mend the sign* (shared tile row and drag code; one level-ID order for all three).
2. **Ordinary content review** of the eight clauses, the two new verb forms and the voice wording above.
3. **Touch layout proof** at the four views and 100-unit targets once built.
4. **Developer decision, if raised by the dive:** whether a “do it for me” control exists (default: no; apply the shown change by hand).

## Device and person checks

Added to [DEVICE-CHECKS.md](../DEVICE-CHECKS.md) at build time, not claimed now: iPad speech for “first word”, “big letter” and “full stop”; touch reach of the 100-unit stamp and Send in portrait; whether a pre-K child understands “first word” and “end of the sentence” well enough to attempt step A. No learning claim before these.

## Build order (for the dive)

1. The Read & Do dive settles IDs and order. 2. `logic.ts`: sign state, step plans, seeded selection, acceptance and hints (typecheck and rule tests). 3. `index.ts`: toggle tile, stamp and socket, Send; voice lines; how-to steps and bot. Then the new-interaction check tier: typecheck, unit tests, one filtered play (`readdo`, first and last new level, one failed Send, one hint) and one portrait screenshot.
