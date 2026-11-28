# Stir and See

<!-- generated: from src/games/stir-see; edit the text below the end mark (npm run game-docs) -->

**ID:** `stir-see` · **Land:** Bubble Beach · **Ages:** toddler–school · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** mixtures, cause-and-effect, observation, prediction

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 1–4 |
| pre-K | 3–4 |
| school | 4–5 |

| Level | Plays like |
| --- | --- |
| 1 | Stir it: tap the spoon to stir sugar, then sand, into a cup of water |
| 2 | Three spoons: stir in three things and see one vanish, one sink and one float |
| 3 | Which one disappears?: three stirred cups; find the one the picture asks for |
| 4 | What will it do?: say what you think, then stir it in and see (a guess is never wrong) |
| 5 | Sort the cups: look in each stirred cup and put it with vanished, sank or floated |

<!-- end generated -->

**Starts as:** a clear cup of water and a big spoon: each tap stirs something in, and she sees sugar vanish into the water (a faint shimmer says it is still in there) and sand sink to the bottom and stay.

**Grows into:** three spoons with one of each outcome (a leaf floats on top), finding the cup a picture asks for, guessing what a thing will do before stirring it in (never scored), and sorting six just-stirred cups into vanished, sank and floated.

## Design notes

Built from [the definition](../definitions/stir-and-see.md) (levels 1–5); level 6, How many spoons?, waits on its science reviewer and IDs from 6 are kept for it.

- **The model** (`logic.ts`): an authored outcome table for six materials, and `stir()`, which keeps a vanished thing as a shimmer, grows a heap in spoons and keeps a floater in one piece. The water level is not state.
- **Level 3 accounting:** a wrong cup is one miss, counted once per question per cup (the same wrong cup again shows it again but counts nothing). Every wrong tap gives the clue for the outcome asked for; the second wrong tap makes the right cup glow and counts one hint; the third is a supported finish (the pet taps the right cup). With only two wrong cups per question, "third wrong tap" counts repeats.
- **Level 5:** a cup arrives still swirling from the stir, so what it holds is hidden until she taps it (always free). Filing before looking is allowed: the cup settles first, then the tray is judged. A wrong tray is one miss each time, the right tray glows from the second (one hint per cup), the pet files it on the third.
- **Levels 1, 2 and 4** count nothing. At levels 1–2 a long rest makes the pet tap the spoon, so the round always finishes.
- **Journal:** one entry per outcome she saw (`vanishes`, `settles`, `floats`) and `still-there` when she tapped a cup with a shimmer.
- **Look:** upright-ready; upright the cup, cards and spoon are drawn larger than sideways. Shimmer and sparkles stay below the paper pass's alpha so they stay soft.
- **Words:** levels 1–5 never say react, reaction, chemical, melt, taste, eat, drink, sweet, fizz or dissolve (tested).
- **Speech:** the title and the four journal lines sit under `stirsee.*`, which the rendered-clip set does not include, so they play by device speech (a cloud session cannot render Kokoro clips; rendering on the Mac needs a chosen prefix).
- **Controller:** like the other island touch games, it has no pad controls; pads play only the couch catalog's games.
