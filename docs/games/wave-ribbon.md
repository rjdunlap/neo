# Wave Ribbon

<!-- generated: from src/games/wave-ribbon; edit the text below the end mark (npm run game-docs) -->

**ID:** `wave-ribbon` · **Land:** Tinker Lab · **Ages:** school · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** waves, cause-and-effect, observation

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | Watch the pulse |
| 2 | Tall and small |

<!-- end generated -->

**Starts as:** tap Send and a smooth pulse runs along a stretched ribbon to a little flag, while a beaded ring on a post rises and settles back in place: the wave travels, the bead only goes up and down. Replay and Step let her look closely, one quarter-second frame at a time, along a frozen time ruler.

**Grows into:** level 2 sends a small and a tall pulse (the other height stays as a faint dashed ribbon), then matches the pictured bead trace for the height asked for, with a sideways-bead picture as the common mistaken idea; both heights reach the flag at the same time mark. Level 3 (an A/B bench with a claim to check) and the grown-up band are queued ([definition](../definitions/wave-ribbon.md)).

## Design notes

- **Rules** are closed-form in `logic.ts` (a raised-cosine pulse at a fixed speed; no solver), so a run is identical everywhere. Done waits on what she has watched (the bead at its peak and the crest at the flag), and at level 2 on a correct Check of the picture.
- **Misses and help:** sending, replaying, stepping, switching height and an early Check or Done are never misses; only a Check of a wrong picture is, once for the same unchanged choice, and it replays the asked-for pulse and speaks why. The hand sends the unwatched height (`run-both`) or glows the matching picture (`pick-trace`, which also glows after two wrong Checks); each identity counts once. Stepping up reflects interface progress, not mastery of wave physics.
- **Model limits:** a one-way pulse on a ribbon; it is not sound in air, and never claims tension, reflection or energy.
- **Pictures:** every control is a picture (play, round arrow, next arrow, a small or tall hump, the magnifier), so nothing is read; the trace cards show the bead's height at each frame with the flag's tick at frame 10 on both bead cards.
- **Upright:** the bench sits under Home and help, controls below; targets 100 units at every phone view (`upright.test.ts`).
