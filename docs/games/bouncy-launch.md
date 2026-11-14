# Bouncy Launch

<!-- generated: from src/games/bouncy-launch; edit the text below the end mark (npm run game-docs) -->

**ID:** `bouncy-launch` · **Land:** Tinker Lab · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, measurement, numbers

| Band | Levels, easiest first |
| --- | --- |
| lap | 13, 1 |
| toddler | 1, 2, 8, 3 |
| preschool | 2, 8, 3, 4 |
| pre-K | 3, 4, 7, 5 |
| school | 4, 5, 7, 6, 9, 10, 12 |

| Level | Plays like |
| --- | --- |
| 1 | Tap the spring: boing! The pet bounces and lands softly |
| 2 | Pull back and let go; a bigger pull goes farther |
| 3 | Land on the cloud with the star |
| 4 | Land on a numbered cloud: "land on 3" |
| 5 | Farther or not as far as last time |
| 6 | Watch a shown pull and predict which cloud the pet will reach |
| 7 | Bring a friend a snack, learning from the last flight |
| 8 | Two big clouds: land on the near one or the far one |
| 9 | Two shown pulls fly; predict where a pull between them lands |
| 10 | A shown pull: tap the number on a 1 to 10 line where the pet will land, then see how close |
| 12 | The same pull on a light or a heavy planet: past the flag or before it? |
| 13 | Touch anywhere: the pet bounces, and each landing leaves a flower |

<!-- end generated -->

**Starts as:** lap opens on a touch anywhere that bounces the pet and leaves a flower where it lands (level 13); then tap the pet and it boings onto a cloud

**Grows into:** lap's own level 13 (five flowers); short/wrong-way pulls reply without a miss; pull back farther to fly farther, toddler and preschool level 8, *Near or far*, aims at one of two big clouds (a star marks it) in five shots; land on the star cloud, then a numbered cloud, farther or nearer than last time, then predict a shown pull's cloud using numbered landing flags; school level 9, *Between two flights*, shows a short and a long pull planting numbered flags, then a pull halfway between them with both as faint rings, and she predicts its cloud (unscored); school level 10, *Where on the line?*, shows a pull and a 1–10 number line, she taps her number, then the pull flies and a bar shows how far her number was from the landing (unscored); school level 12 compares the same shown pull on light/heavy toy planets, predicting before or past a home flag in three unscored pairs with requested help; pre-K and school also feed a bunny or duck standing on the grass, using the last flight's arc to correct the next pull; the last flight fades, and a compare miss shows the previous pull's radius

## Design notes

*Distance-flight delight after Kass Basher (Neopets), a timed swing rather than a pull; the launcher reference is Toss the Turtle (Kongregate).* Tap the pet and it boings onto a cloud; later, pull back farther to fly farther, land on the star cloud, then a numbered cloud, farther or nearer than last time. A faint dotted arc remembers the last flight and fades. After a compare miss, a red ring marks the last successful pull's radius; two misses still count one preview hint. Level 8, **Near or far** (toddler and preschool only: toddler plays 1, 2, 8, 3 and preschool 2, 8, 3, 4): two big clouds sit at 0.2 and 0.8 of the strip with ±0.2 windows (about 28 pull units) and grass between, a star over one, and five seeded shots alternate near and far from a seeded start, spoken as "near" or "far" with no numerals. A short or long landing is a miss (`launch.short`, `launch.long`); two misses turn on the preview arc and pull ring and count one hint. The bigger-pull journal entry can file; couch and Cloud Hopper keep their own clouds. Level 7, Feed the friend (pre-K and school only; pre-K plays 3, 4, 7, 5 and school 4, 5, 7, 6, 9, 12): a seeded bunny or duck stands on the grass, no clouds, an apple at its feet, three shots at spots 0.12-0.92 along the strip and at least 0.2 apart; landing within ±0.09 of the strip feeds it (cheer, sparkle). A miss says short or long, the dotted arc and a puff ring stay at the last landing so the next pull can correct it, and two misses count one hint with the preview and a pull ring. Level 6 keeps numbered landing flags and shows a fixed pull: choose a numbered cloud, then watch, with predictions unscored. Pull levels squeak and wobble on touch; short or wrong-way pulls get a spoken nudge, and two unfinished pulls show a back-and-down arrow, without misses or hints. Cancellation returns the pet without launching. After two plainly different pulls in island play, the observed bigger-pull/farther-landing rule goes into the discovery journal. Couch and course rounds never report this discovery; whether watched prediction pulls should report it remains a developer decision. On the couch the spring squashes straight down instead of stretching sideways, and the game's twelve small clouds make the Cloud Hopper challenge course ([DESIGN](../DESIGN.md#couch-play)).

School-only level 9, **Between two flights** (three rounds): a short and a long shown pull fly and plant numbered flags (the pet hops back each time, and taps on clouds are ignored while they fly), then the pull halfway between them is shown with both watched pulls as faint rings at the spring, and she taps the cloud it will reach before watching. Predictions are unscored: a matching guess hears "You predicted cloud n!", a different one hears that the pull was between the two so the pet landed between the flags, on cloud n. Each round uses one of four midpoint sets on the five clouds (1-2-3, 2-3-4, 3-4-5, 1-3-5), three different sets per round and never the same middle twice running, so the spoken reason is always true. Watched pulls never count misses or hints and never file the bigger-pull journal entry; the keys do not squash the spring here; one sticker at the end.

School-only level 10, **Where on the line?** (three shots, 2026-11-13, PR #1630): a shown pull sits on the spring and a 1–10 number line (ten ticks, numerals) runs below the landing strip. A tap anywhere over the line (a full-width hit area from 230 units above the strip to the bottom edge) goes to the nearest tick, so the ticks are display marks about 56 units apart, not targets; her pick gets a yellow ring. "Let's see!" flies the pull, which lands on its tick centre with a numbered flag, and a yellow bar spans her number to the landing while the pet says "just where you said!", "just one away!" or "{gap} away." Unscored: no misses, no hints, no Show a hint button. `lineTargets` gives one answer in each third (1–3, 4–7, 8–10) in seeded order, consecutive answers at least two apart. Keys and couch do not fire at this level, and its pulls do not count toward the bigger-pull journal entry. School's order is now 4, 5, 7, 6, 9, 10, 12; no saved level was renumbered (10 was unused).

School-only level 12, **Planet Hop**, shows three home flights with distinct flags at 0.2, 0.3 and 0.4 of the strip, each followed by the same pull on a seeded light/heavy planet (both occur every round). Tap the full-height before/past region split at the flag. The choice rings immediately, then the flight and spoken rule explain the result; predictions never count as misses. Requested pause-sheet help rings the correct side and counts one hint. Light toy gravity is 0.5 (twice the reach, ×1.5 airtime), heavy is 2 (half the reach, ×0.8 airtime); the how-to identifies these as toy ratios, not real planet data. Lavender craters/sky island and orange ground/ringed horizon distinguish the worlds; landing notes and puffs reflect their pull. Three pairs finish one sticker, no journal entry. IDs 8, 10 and 11 remain reserved and younger bands/course behavior stay unchanged.


**A landing's line never holds the next shot (U7 fix batch 23, 2026-11-12).** A right landing's `praise` (levels 3, 4, 5, 8), level 7's `launch.fed` and level 6's `launch.predicted`/`launch.revealed` start as the pet lands; the hop and the next shot follow at once. The shot's instruction waits for the line, the guide or her first pull (the pull goes on); a level 6 pad pick drops it. The last shot's line is heard out before the finish. Levels 9 and 12 and course play are unchanged. The ghost finger and couch demo bot wait for an instruction.

**Level 13, Flower meadow (2026-11-13, PR #1620).** Lap-only, after the ladder (levels 1–12 unchanged) and first in lap's order (13, then 1); a saved 13 carried into an older band starts that band's first level. A touch anywhere on the screen, on the pet, or a controller press bounces the pet to the next of five seeded landings, one in each fifth of the grass (no clouds shown); each landing pops up a flower (pink, yellow, purple, red, blue, each with a pentatonic marimba note) that stays. A touch while the pet flies or hops back rings free (a pop and a few sparkles) and counts nothing; the round button still repeats the instruction ("Touch anywhere, and {pet} bounces!", `launch.anywhere`). Five landings finish the round. Nothing is ever a miss; there is no hint button and no journal observation.
