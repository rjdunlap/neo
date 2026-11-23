# Thought Bubbles

<!-- generated: from src/games/thought-bubbles; edit the text below the end mark (npm run game-docs) -->

**ID:** `thought-bubbles` · **Land:** Story Grove · **Ages:** pre-K–school · **Challenge:** words · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** characters, perspective, inference, listening

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |
| school | 1–4 |

| Level | Plays like |
| --- | --- |
| 1 | What does she want? A friend reaches for one of three things |
| 2 | Where will he look? Was the friend there when his thing moved? |
| 3 | How do we know? The reason, then where the picture shows it |
| 4 | Two bubbles (about 9 and up): two friends saw different things |

<!-- end generated -->

**Starts as:** a short picture story on a cottage stage, then drag one of three picture cards into a friend's empty thought bubble

**Grows into:** level 1 (pre-K): what the friend reaches for (a paw reach and a lean point at it; a decoy sits near). Level 2: where the friend will look, from whether he saw the move (an away story, where the mover kindly shows where it went, or a watching story through the window); the first pick counts, and a wrong place replays the move with "Was he in the room when it moved?". Level 3 (school): why he did it (three picture reasons), then tap the clue in the picture. Level 4 (school, about 9 and up): two friends share a thing that is moved twice while one or both are out; each gets a thought bubble and she drags the place each thinks it is, in either order, then each walks to its place. A wrong card or place is a miss; the friend never walks to a wrong place; a non-clue tap is free and named; two misses on a story glow the answer (one hint), Show me glows the target (one hint). One sticker per round of three stories. Invented island stories about pictured things only. Story Grove

## Design notes

*Levels 1–4 · after the literature-and-meaning study; [definition](../definitions/thought-bubbles.md).* A short picture story plays on a code-drawn cottage stage (a door on the left, a window at the back); then a friend in it gets an empty thought bubble and she drags one of three picture cards (150 × 170) into it. Every story is an invented island story about pictured things; nothing is told, the goal, the belief or the reason is read from what the picture showed.

Levels: 1 "What does she want?" (pre-K 1, school 1): a paw reaches and the friend leans toward what he wants; a decoy sits near. 2 "Where will he look?" (pre-K 2, school 2): the friend looks for the thing where he last saw it, away stories (he was out when it moved; the mover kindly shows where it went) mixed with watching stories (he saw it through the window). The first pick counts; a wrong place replays the move with "Was he in the room when it moved?" and the friend never walks to a wrong place. 3 "How do we know?" (school 3): pick the picture reason he did it, then tap the clue region in the picture. A non-clue tap is free and named; the third asks again and glows the clue (one hint). One sticker per round of three stories.

**Phone.** Levels 1–3 play upright on a phone since 2026-11-22 (`upright: true`; PR #2020). The portrait branch of `thoughtLayout` already fit, so only `upright.test.ts` (four phone views, every level) was added; the content ends about halfway down a tall 390 × 844 phone, which level 4's upright re-layout is to use (see the [definition](../definitions/thought-bubbles-4.md)). `THOUGHT_BUBBLES_PHONE=1` makes the `thoughtbubbles` browser suite play levels 1–3 on a touch phone.

Misses and hints: a wrong card or place is a miss. Two misses on a story glow the answer (one hint; at level 2 after the replayed beat); Show me from the pause sheet glows the current target (one hint). Music `STYLES.paint`. No save fields, journal entries or couch play. Voice lines `thought.*` (device speech; only the title `game.thought-bubbles` has a rendered clip). Story Grove is its home land (the 18th game, second page). Not built: who is telling (LM4, Thought Bubbles 5) is [defined](../definitions/thought-bubbles-5.md) (2026-11-23) and queued. The grown-ups' story-talk card (LM3) is [built](../definitions/talk-cards.md). Open: the device and person checks in DEVICE-CHECKS.

**What the guide repeats.** The story's own question at levels 2 and 3 (e.g. "Where will Bunny look for her book?") is an instruction (`ctx.instruct`) said after the level instruction, and is skipped if she already answered during it; level 3's "Show me how you know. Tap it in the picture." is one too, once the bubble is filled. Hints, card names and story lines stay `say`.

**Level 4, "Two bubbles" (school 4; PR #2023; [definition](../definitions/thought-bubbles-4.md)).** Two friends share a thing that is put away and moved twice; one or both owners are out for a move. Each friend gets a thought bubble and she drags the place each thinks it is, in either order. Six templates, five patterns (three "different", two "same"); the first round is authored and dealt rounds keep every habit that ignores who was in the room at two or more misses a round. Pre-K stays at levels 1–2. Narration is beat by beat (`beatsOf`); `LEVELS.school` is 1–4.

Misses and hints are per bubble: `Tally` counts wrong cards and glows by bubble index (`wrong(bubble)`, `showMe(stage, bubble)`), not by a `newQuestion()` reset, because the bubbles fill in either order. A wrong card is one miss and replays that friend's last-seen beat with the pet's question; two misses on one bubble glow its card and bubble as one hint; Show me glows the first unfilled bubble. A right card floats home and leaves its picture; a filled bubble refuses drops, free. The per-template `.helped` line names no friend (lines are slot-free; two friends at the wrong place are shown once together). The owners stand beside the red box and between the two floor places so no friend hides a place; a friend who stays "in the room and watches" (no rug or reading prop); a finder hops on its place rather than picking the thing up, so the second friend can still be shown it. The level 4 demonstration plays two of the three stories (47.4 s; the full round took 69.6 s against the 75 s cap).

Layout: `thoughtLayout(view, level)` returns `bubbles`. Landscape stacks two bubbles in the right column with Replay under them; upright puts them side by side above the stage with Replay under the cards at the right, and on a tall phone the block moves down by 55% of the height beyond 1024 units so the cards sit lower. Level 2's move animation is the shared `moveThing` helper (levels 2 and 4); 57 new voice clips are rendered (`scripts/voice-clips/render.mjs`).
