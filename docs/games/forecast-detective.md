# Forecast Detective

<!-- generated: from src/games/forecast-detective; edit the text below the end mark (npm run game-docs) -->

**ID:** `forecast-detective` · **Land:** Tinker Lab · **Ages:** school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** weather, evidence, deduction, uncertainty

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Which way is the wind? Open clues, pick the one weather they leave |
| 2 | A postcard didn't come: one weather, or Can't tell yet |

<!-- end generated -->

**Starts as:** lift the flaps on a wind vane, two island postcards and a thermometer, then pick tomorrow's weather card and Check

**Grows into:** levels 1–2 under a pretend rule the game says out loud (tomorrow's sky comes on the wind from the island it blows from; freezing turns rain to snow): opening clues, the rule card and a not-yet Check are free; a Check that a clue rules out, or that claims more than the open clues allow, is a miss with a spoken reason, and the same Check again counts nothing. Two misses cross out the ruled-out cards, glow the answer and bob a useful flap (one hint); Show a hint opens the most useful clue or crosses out cards. Level 2 hides one postcard: name the weather if the rest decide, or tap Can't tell yet. A right Check plays night, morning and the sky sliding to the town. Tinker Lab

## Design notes

*Levels 1–2 · after the weather and water study; [definition](../definitions/forecast-detective.md).* A harbour town sits between Hill Isle (west) and Lighthouse Isle (east). Four covered flaps hold the clues: the town's wind vane, a postcard from each island showing its sky today, and the thermometer. She lifts a flap (the pet says the clue), then picks one of four weather cards and presses Check. The rule is disclosed on a card before any answer: in this pretend world tomorrow's sky comes on the wind from the island it blows from, and freezing turns rain to snow. Checking, not guessing, is the action; the lesson is that evidence narrows the possibilities and that "can't tell yet" can be the right answer.

Levels (school 1–2): 1 "Which way is the wind?": all four clues can be opened; the first round is authored, then rounds where the postcards differ, with rain upwind at least one round in three. 2 "A postcard didn't come": one clue is missing and its flap stays shut, so she names the weather when the rest decide it or taps Can't tell yet when they cannot; rounds alternate can-tell and can't-tell. Pick-a-weather has five cards at level 2 (the four plus Can't tell yet), shown in two rows in portrait.

Misses and hints: opening clues, the rule card and a not-yet Check (the open clues do not yet decide it) are free. A Check that an open clue rules out, or that claims more than the open clues allow (an overclaim at level 2), is a miss with a spoken reason. The same Check again (same answer, same open clues) counts nothing. Two misses cross out the ruled-out cards, glow the answer and bob a useful flap (one hint, once a round). Show a hint opens the most useful clue (one hint), or crosses out ruled-out cards (counted only if something new is crossed out). A right Check plays night then morning, the late postcard arriving and the upwind sky sliding to the town; once a session the pet adds "Real weather is trickier…". Nothing is kept beyond round history.

Deviations from the definition: the most useful clue is the one leaving the fewest weathers, ties (including when no clue shrinks the set yet) broken in the order wind, upwind postcard, thermometer, downwind postcard, and `usefulClue` returns null only once the round is decided or no available clue is closed, since the literal "null when none reduces" rule would strand hints (for example the authored level 1 after the thermometer); added the line `forecast.ruledout.islands` ("{a} has {skyA} and {b} has {skyB}, so it can't be {weather}.") for a closed wind with both postcards ruling a weather out, where the definition's wind form would be false; added `forecast.glow` and `forecast.hint.cross`. Tinker Lab.
