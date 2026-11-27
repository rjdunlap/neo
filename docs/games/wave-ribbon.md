# Wave Ribbon

<!-- generated: from src/games/wave-ribbon; edit the text below the end mark (npm run game-docs) -->

**ID:** `wave-ribbon` · **Land:** Tinker Lab · **Ages:** school–grown-up · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** waves, cause-and-effect, observation

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |
| grown-up | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Watch the pulse |
| 2 | Tall and small |
| 3 | Same speed, bigger wave |

<!-- end generated -->

**Starts as:** tap Send and a smooth pulse runs along a stretched ribbon to a little flag, while a beaded ring on a post rises and settles back in place: the wave travels, the bead only goes up and down. Replay and Step let her look closely, one quarter-second frame at a time, along a frozen time ruler.

**Grows into:** level 2 sends a small and a tall pulse (the other height stays as a faint dashed ribbon), then matches the pictured bead trace for the height asked for, with a sideways-bead picture as the common mistaken idea; both heights reach the flag at the same time mark. Level 3 (*Same speed, bigger wave*, also the grown-up band's starting level) puts two stacked ribbons on an A/B bench with Lane A and Lane B toggles, lets her run a contrasting pair against a shared time ruler, and checks **Same mark** against **Tall sooner** ([definition](../definitions/wave-ribbon.md)).

## Design notes

- **Rules** are closed-form in `logic.ts` (a raised-cosine pulse at a fixed speed; no solver), so a run is identical everywhere. Done waits on what she has watched (the bead at its peak and the crest at the flag), at level 2 on a correct Check of the trace card, and at level 3 on at least one contrasting run (`Small` vs `Tall`) plus a correct Check of **Same mark**.
- **Misses and help:** sending, replaying, stepping, switching height or lanes, testing equal pulses (`Small/Small` or `Tall/Tall`), and an early Check or Done are never misses; only a Check of a wrong picture is, once for the same unchanged choice, and it replays the pulse (or both lanes at level 3) and speaks why. The hand sends the unwatched height (`run-both`) or a contrasting pair (`run-contrast`), or glows the right card (`pick-trace` / `pick-claim`, which also glows after two wrong Checks); each identity counts once. Stepping up reflects interface progress, not mastery of wave physics.
- **Model limits:** a one-way pulse on a ribbon; it is not sound in air, and never claims tension, reflection or energy.
- **Pictures:** every control is a picture (play, round arrow, next arrow, a small or tall hump, top/bottom lane pills, the magnifier), so nothing is read; level 2's trace cards show the bead's height at each frame with the flag's tick at frame 10 on both bead cards, and level 3's hypothesis cards stamp Small and Tall flags on paired time rulers.
- **Upright:** the bench sits under Home and help, controls below; targets 100 units at every phone view (`upright.test.ts`).
