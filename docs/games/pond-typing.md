# Pond Typing

<!-- generated: from src/games/pond-typing; edit the text below the end mark (npm run game-docs) -->

**ID:** `pond-typing` · **Land:** Story Grove · **Ages:** school · **Plays by:** controller

**Skills:** letters

| Band | Levels, easiest first |
| --- | --- |
| school | 1–6 |

| Level | Plays like |
| --- | --- |
| 1 | Finds a letter key: one group of four letters |
| 2 | Types a name, letter by letter |
| 3 | Types words, and the space bar between two words |
| 4 | Uses Shift for a capital at the start of a word or name |
| 5 | Copies a line with a capital, spaces and a full stop; uses Backspace |
| 6 | Mends a line with the arrow keys and Backspace |

<!-- end generated -->

**Starts as:** a keyboard-only couch game (a real or laptop keyboard): press the key on the bubble that waits

**Grows into:** type her name one letter at a time, then words and two-word phrases with the space bar; plays on the couch (not offered on the TV place) with an island course, Bubble Pond; a first wrong key is free, later ones count as misses and glow the key; levels 4–6 add sticky Shift capitals, copied lines/stops with Backspace, and caret repair; picture words, a pause-menu Show the key toggle and typed-key diagram lighting

## Design notes

*Keyboard-only couch game · after typing games, made gentle; [definition](../definitions/pond-typing.md).* A big bubble waits on the pond showing a letter, a name or a word; she presses the matching key and it pops with a note. Nothing drifts and nothing is timed. **Built: levels 1–6.** Level 1 is one letter (eight bubbles from one group of four consecutive letters: ABCD, EFGH, IJKL, MNOP, QRST, UVWX or WXYZ). Level 2 is her own name (the couch save's first name, capped at 12 letters, PIP if there is none; in a face-off both players type PIP so the twin boards stay fair). Level 3 is three words, then two two-word phrases that need the space bar (24 everyday picture-able nouns and adjectives and 8 phrases, no names or brands). Level4 copies a capitalized name and words with sticky Shift (or a held Shift chord); level 5 copies five model lines with a capital, spaces and a full stop, and Backspace removes visible mistakes; level 6 starts with one wrong internal letter and uses Left/Right, Backspace and insertion to mend it. Word pictures are shown at 3–4; lines reveal their picture only when exact. Esc offers a round-local Show the key toggle (default on); hints show the repair key even with it off. The how-to diagram lights the actual typed key, without an alphabet.

**Misses and help.** Counted per character: the first wrong key is free, each later one is a miss, and the second wrong key glows the right key (one hint a round, shared with the pause menu's "Glow the key"). The couch score is letters right the first time (higher is better). **Input.** The first game that reads typed letters: `CouchInput` fills `CouchControls.typed` from `KeyboardEvent.key` only while a typing game's round is on screen (repeats and Meta, Ctrl and Alt chords dropped; W and S are letters then and Space still presses). `GameModule.typing` marks such a game. **Couch.** Trip levels 1, 1, 2, 3, 4, 5 (demo level 2), in the last unlock tier, not offered on the TV place (it needs a keyboard), and a frozen course, **Bubble Pond** (version 2: six ponds, letters through line repair; character-only minimum 63, Shift/arrows/Backspace free; old version 1 runs restart, records retire without comparison), which the island landmark opens, since the game is controller-only. It lives in Story Grove, which turns pages once full (location capacity, PR #915). Rules and the word pool are in `src/games/pond-typing/logic.ts`; the course is in `course.ts`.
