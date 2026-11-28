# Wave Ribbon, levels 1–3 (definition)

Defined 2026-11-27 (`agy/define-wave-ribbon`, PR #2277) as slice **E6** of the [energy and waves study](../deep-dives/subjects/energy-waves.md#wave-ribbon-a-distinct-second-game) and [recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#energy-and-waves-recommendations). **Levels 1–2 built 2026-11-27 (E7, PR #2284); level 3 and the grown-up band built 2026-11-27 (E7b, PR #2290):** levels 1–3 (`school: 1–3`, `grownup: 3`) are playable with rule tests, upright layout tests, voice, how-to card, ghost finger and the `waveribbon` browser suite.

**Ready to build under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules):** S4 uses a small handwritten analytic model in `src/games/wave-ribbon/logic.ts` (no physics library); S8 settles identity `wave-ribbon`, land `tinker-lab`, `school` first (with level 3 *about 10 and up*, plus `grownup` in E7b per S2), and free exploration with Check-only misses; S1 requires the building session to check every factual line and spoken explanation against the opened sources cited below. Proposed game ID `wave-ribbon`.

**Fun action and purpose:** tap **Send** to launch a single bright pulse down a stretched elastic ribbon toward a little pennant flag, and watch a beaded ring marker on the ribbon rise up and settle right back down on its post while the crest keeps travelling past it to the flag. Then compare a **Small** pulse and a **Tall** pulse on the same ribbon, and investigate whether making a pulse taller makes it reach the flag any sooner. The learning goal is **separating wave travel from local particle motion**, **comparing amplitude with pulse width and speed held fixed**, and **running a controlled A/B comparison against a pictured hypothesis**. There are no timers, lives, rhythm grades, or star scores.

## Opened sources and model boundaries (`S1`)

Drawn directly from the opened primary sources in the [energy and waves study](../deep-dives/subjects/energy-waves.md#anchors-and-evidence-limits):

| Opened source | What it supports in Wave Ribbon | Boundary / what is never claimed |
| --- | --- | --- |
| [NGSS grade 4: waves](https://www.nextgenscience.org/topic-arrangement/4waves) (`4-PS4-1`) | Describing wave patterns in terms of amplitude and wavelength | No interference, standing waves, or quantitative wave arithmetic in levels 1–3 |
| [NGSS middle school: waves](https://www.nextgenscience.org/topic-arrangement/mswaves-and-electromagnetic-radiation) (`MS-PS4-1`, `MS-PS4-2`) | Relating amplitude cleanly on a simple wave model; distinguishing matter motion from wave propagation | Air sound is longitudinal compression and requires matter; never place this transverse ribbon inside air or call it literal sound |
| [ASA: Wave Basics](https://exploresound.org/2018/08/wave-basics/) (PhET *Wave on a String* lesson) | Comparing a marked point's local up-and-down motion with crest travel; holding medium/speed fixed while varying one control at a time | Single finite pulse in levels 1–3; repeating frequency (`"more wiggles"`) belongs to a separate later repeating-driver slice, not here |
| [Wieman & Perkins, 2006](https://jila.colorado.edu/sites/default/files/group-files/nphys283.pdf) | Immediate visual feedback, replayable runs, and paired representations (`Step` + trace cards) | No claim of stiffness, tension-speed derivation, boundary reflection, or energy dissipation (`A²` energy belongs to a later fixed-frequency slice) |

Sound-off play is 100% complete: every observation, step mark, trace card, and hypothesis check is carried visually by the ribbon, bead post, pennant, and frozen time ruler.

## Overlap and reuse

| Game / proposal | What it already owns | Why `wave-ribbon` is distinct |
| --- | --- | --- |
| **Sound Garden** (Music Mountain) | Singing voice, pitch/pace/contour, rhythm play | Musical expression; never models spatial propagation along a medium |
| **Sound Workshop** (proposed M8) | Attack/decay envelope shaping at fixed pitch | Musical synthesis/timbre; Wave Ribbon owns spatial disturbance travel |
| **Circuit Garden** (Tinker Lab) | Two-terminal electrical loops and switches | Atomic whole-circuit connectivity; Wave Ribbon models travelling pulses |
| **Light Lab** (Tinker Lab) | Straight light rays, mirrors, tinted glass | Ray-optic path routing, not transverse medium motion |
| **Ramp Race** (Tinker Lab) | Rigid ball/car rolling down slopes with friction comparison | Rolling-object kinematics, not a wave moving through a stationary medium |
| **Swing Pals** (Tinker Lab) | Pendulum period vs rope length and painted swing beats | Fixed-pivot oscillation; Wave Ribbon shows a pulse propagating past a marker |

Reuse `onTap` (`src/engine/input.ts`), `RoundButton` / shared button chrome, pentatonic feedback steps (`src/audio/notes.ts`), `rangeFor`, `uprightProblems` (`src/games/upright-check.ts`), and `ctx.finish({ misses, hints })`. No new engine helper, save field, or audio system is needed.

## Analytic model (`src/games/wave-ribbon/logic.ts`)

An ideal, one-way transverse teaching model on a horizontal ribbon of fixed length, evaluated deterministically from closed-form functions (same bit-for-bit results in Node and Safari; no ODE solver or physics library).

- **Fixed constants (board units, `x` rightward from driver at `0`, `dy` upward displacement):**
  - `L_RIBBON = 560` (driver clamp at `x = 0`, right tie-post at `x = 560`)
  - `X_MARKER = 240` (vertical dotted guide post; beaded ring marker stays strictly at `x = X_MARKER` for every `t`)
  - `X_FLAG = 480` (pennant post with arrival tick)
  - `V_WAVE = 240` units/s (constant propagation speed across all levels 1–3 and all presets)
  - `W_PULSE = 1.0` s (fixed single-pulse duration; spatial pulse width `V_WAVE * W_PULSE = 240` units)
  - `AMPLITUDES = { small: 28, medium: 48, tall: 72 }` board units (`2.57×` contrast between `small` and `tall`, unmistakable on a 375 px phone)
  - `DT_STEP = 0.25` s, `STEP_COUNT = 12`, `T_RUN = 3.00` s (`STEP_COUNT * DT_STEP`), `T_ARRIVE = 2.50` s (`ARRIVAL_STEP = 10`)
- **Closed-form pulse envelope (smooth finite raised-cosine / Hann pulse):**
  - `g(u) = (u >= 0 && u <= W_PULSE) ? 0.5 * (1 - Math.cos((2 * Math.PI * u) / W_PULSE)) : 0`
  - `displacementAt(x, t, amp) = amp * g(t - x / V_WAVE)` (screen coordinate `y = yRest - displacementAt(x, t, amp)`)
  - `crestX(t) = V_WAVE * (t - W_PULSE / 2)` (crest enters ribbon at `t = 0.50` s, reaches marker at `t = 1.50` s, reaches pennant at `t = 2.50` s)
  - `markerState(t, amp) = { x: X_MARKER, dy: displacementAt(X_MARKER, t, amp) }`
  - `arrivalTime(amp) = X_FLAG / V_WAVE + W_PULSE / 2 = 2.50` s (`step 10` for **every** `amp` — exact arrival invariance)
- **Fixed sample instants (`k = 0..12`, `t_k = k * 0.25` s):**
  - `k = 0` (`0.00` s): ribbon flat at rest
  - `k = 2` (`0.50` s): crest at driver (`x = 0`, `dy = amp`)
  - `k = 6` (`1.50` s): crest at marker (`x = 240`, `dy = amp`, peak marker lift)
  - `k = 8` (`2.00` s): marker settled back to rest (`x = 240`, `dy = 0`)
  - `k = 10` (`2.50` s): crest at pennant (`x = 480`, arrival bell/flash & frozen mark at `10`)
  - `k = 12` (`3.00` s): tail clears pennant (`dy = 0` at marker and pennant)
- **Public pure API in `logic.ts`:**
  - `planFor(level)` — returns level config (`id`, `name`, `mode`: `'observe' | 'compare-trace' | 'compare-speed'`).
  - `makeRound(plan, rng)` — builds the round's deterministic brief:
    - Level 1: fixed single `medium` pulse; seeded ribbon palette pair (`ribbonColor`, `markerColor`, both high-contrast from `palette.ts`).
    - Level 2: `targetPreset` chosen deterministically from `rng.pick(['small', 'tall'])`, plus card display order `rng.shuffle(['small', 'tall', 'sideways'])`.
    - Level 3: initial bench selection defaults to `['small', 'small']` (so the player chooses a contrasting test, never given the informative run pre-selected) and card display order `rng.shuffle(['same-time', 'tall-sooner'])`.
  - `sampleRibbon(t, amp, samples = 56)` — returns `samples + 1` `(x, dy)` points along `[0, L_RIBBON]` for crisp polyline rendering.
  - `markerTrace(amp)` — returns the 13 `(k, dy)` marker heights for `k = 0..12` (used by trace thumbnails and step overlays).
  - `isInformativePair(a, b)` — `a !== b` (at Level 3, distinguishes contrasting amplitudes from repeating the same amplitude).
  - `waveLayout(view)` — pure responsive layout placing the ribbon bench, presets, cards, and action bar cleanly in both landscape (`1024 × 768`+) and upright views (`UPRIGHT_VIEWS`: `768 × 1206`, `768 × 1366`, `768 × 1662`, and `768 × 1024`).

## Levels and completion gates

| ID | Name (`describeLevel`) | Controls & presets | What she decides | Completion gate |
| --- | --- | --- | --- | --- |
| 1 | Watch the pulse | Single `medium` (`48`) pulse; `Send`, `Replay`, `Step`, `Help`, `Done` | Launch a pulse, watch the bead move up/down in place while the crest reaches the flag, inspect with `Replay` / `Step` | `Done` enables once `seenCompleteRun` is true (a run or step sequence displayed both marker peak `k >= 6` and pennant arrival `k >= 10`) |
| 2 | Tall and small | `Small` (`28`) & `Tall` (`72`) presets; `Send`, `Replay`, `Step`; 3 pictured trace cards; `Help`, `Check`, `Done` | Send both `Small` and `Tall` pulses (either order), compare marker height at fixed arrival time, pick the card matching the asked preset and press `Check` | Both `seenSmall` and `seenTall` reached arrival (`k >= 10`), then `Check` passes on `targetPreset`, enabling `Done` |
| 3 | Same speed, bigger wave | Two-lane A/B bench (`Small`/`Tall` picker per lane); `Send`, `Replay`, `Step`; 2 hypothesis cards (`Same mark` vs `Tall sooner`); `Help`, `Check`, `Done` | Choose two **different** amplitudes on the bench, run both side by side against the frozen time ruler, pick the matching claim and press `Check` | At least one informative contrasting run (`a !== b`) reached arrival (`k >= 10`), then `Check` passes on `same-time`, enabling `Done` |

**Bands (`BandLevels`):**
- **E7 (Batch 1, new game, levels 1–2):** `bands: ['school']`, `LEVELS = { school: { min: 1, max: 2 } }`.
- **E7b (Batch 2, level 3, older amplitude-vs-arrival case):** `bands: ['school', 'grownup']`, `LEVELS = { school: { min: 1, max: 3 }, grownup: { min: 3, max: 3 } }` (about 10 and up at school top, 13+ starting directly at 3; no `order` needed, levels 1–2 never renumbered). All targets remain `>= 100` logical units across every band.

### First rounds

- **Level 1 (`Watch the pulse`):** a stretched coral-orange ribbon sits across the bench with a bright driver paddle on the left, a vertical dotted post holding a round bead at `x = 240`, and a waving pennant at `x = 480`. Tapping **Send** clicks the driver once and sends a smooth hump gliding rightward. The bead rides straight up along its dotted post (`y = yRest - 48` at `1.50` s) and settles right back to `0` (`2.00` s) while the hump continues to the pennant (`2.50` s), chiming and raising a frozen arrival tick at step `10`. Tapping **Replay** replays the run; tapping **Step** advances one `0.25` s frame (`k = 0..12`), leaving a faint trail of previous marker dots so the vertical-only motion stays visible.
- **Level 2 (`Tall and small`):** preset buttons **Small** and **Tall** select the next pulse height (never changing width or speed). After she has run both `Small` and `Tall` at least once in either order (with the previous preset's ribbon curve shown as a faint dashed overlay for comparison), three large pictured trace cards unlock for selection:
  1. **Small card:** small vertical bead trace (`A = 28`) on the post, arrival tick at `10`.
  2. **Tall card:** tall vertical bead trace (`A = 72`) on the post, arrival tick at `10`.
  3. **Sideways-bead card (misconception):** bead arrow sliding horizontally along the ribbon toward the flag.
  A small driver badge beside the cards pictures the requested pulse (`Small` or `Tall`, seeded). Choosing a card and tapping **Check** checks it.
- **Level 3 (`Same speed, bigger wave`):** two stacked equal-length ribbons (**Lane A** and **Lane B**) share a frozen `0..12` time-mark ruler with an arrival marker at `10`. Lane A and Lane B each have a large `Small / Tall` toggle. Tapping **Send** launches both lanes simultaneously from `t = 0`. If she runs `(Small, Small)` or `(Tall, Tall)`, both lanes match identically and the pet says gently *"Both pulses are the same size. Switch one lane to compare small and tall."* (`misses = 0`). Once she runs a contrasting pair (`Small` vs `Tall`), both arrival ticks light up together at step `10`, and she chooses between two pictured hypothesis cards:
  - **Same mark:** two flags stamped at identical step `10` for Small and Tall.
  - **Tall sooner:** Tall flag stamped early at step `6`, Small at step `10`.

## Screen, controls and layout (`waveLayout`)

Use `ctx.companion()` at bottom-left for instruction replay (`ctx.instruct`). All buttons and cards use `onTap`, immediate touch-down highlight/scale, and `>= 100 × 100` logical hit areas with `>= 16`-unit separation and zero overlap with Home/`?` (`x: 0..115, y: 0..210`) or the bottom-left guide pet (`x: 0..150, y: (view.h - 170)..view.h`). Scenery and the ribbon bench have `eventMode = 'none'`.

- **Landscape (`1024 × 768`+, `view.w >= 1024`):**
  - Ribbon bench: `x = 170..960, y = 40..330` (ribbon span `x = 260..820`, rest line `y = 220` in levels 1–2; Lane A `y = 170` and Lane B `y = 300` in level 3).
  - Presets row (levels 2–3): centered at `y = 390` (`Small` at `430`, `Tall` at `590`, each `130 × 100`; in level 3, `Lane A` toggle at `410`, `Lane B` toggle at `610`, each `160 × 100`).
  - Trace / hypothesis cards: centered at `y = 520` (level 2: 3 cards `200 × 108` at `x = 270, 520, 770`; level 3: 2 cards `250 × 108` at `x = 370, 670`).
  - Bottom action bar (`y = 680`, `y = 630..730`): up to 5 buttons in `x = 220..920` (`Send` `128×100`, `Replay` `112×100`, `Step` `112×100`, `Help` `104×100`, `Check`/`Done` `128×100`), `>= 24`-unit gaps, clear of bottom-left pet (`x <= 150`).
- **Upright (`768 × 1024`, `768 × 1206`, `768 × 1366`, `768 × 1662`):**
  - Ribbon bench: `x = 34..734, y = 215..465` (clears Home/`?` `y <= 210`; ribbon span `x = 104..664`, rest line `y = 365` in levels 1–2; Lane A `y = 320` and Lane B `y = 445` in level 3).
  - Presets row (levels 2–3): `y = 535` (`150 × 100` at `x = 260` and `x = 508`).
  - Trace / hypothesis cards: `y = 665` (level 2: 3 cards `210 × 110` at `x = 144, 384, 624`; level 3: 2 cards `280 × 110` at `x = 224, 544`).
  - Action bar Row 1 (`y = view.h - 225`): `Send` (`150×100` at `x = 255`), `Replay` (`140×100` at `x = 425`), `Step` (`140×100` at `x = 595`).
  - Action bar Row 2 (`y = view.h - 100`): `Help` (`130×100` at `x = 275`), `Check`/`Done` (`180×100` at `x = 515`), every target `x0 >= 180` (clear of `0..150` pet).

**Sound:** synthesized gentle pluck on driver launch (`src/audio/notes.ts` pentatonic step), rising/falling soft marimba step as the bead passes its peak, bright chime at pennant arrival, gentle boing on incorrect Check. Island music stays gentle (`STYLES.calm` / `STYLES.tinker` or `STYLES.paint`, never `music.stop()`).

**Resize, pause, restart, destroy:** resizing repositions controls via `waveLayout(view)` while preserving observation flags, last run traces, and current preset/lane choices. Pause freezes active animation time without advancing `t` or setting observations. Restart restores initial round state (`seen* = false`, clears trace/selection) while retaining round `misses`, `hints`, and assistance identities. `destroy()` stops playback, removes scene-owned listeners, and guards any queued speech/callbacks.

## Exploration, misses, help and adaptation

- **Free exploration (`misses = 0`):** tapping `Send`, `Replay`, `Step`, switching presets (`Small`/`Tall`), changing lane toggles, running same-size uninformative pairs (`Small/Small`) at level 3, selecting/changing a card before `Check`, or tapping `Done` before the observation/Check gate is **never a miss**.
- **Check misses (levels 2–3 only):** tapping **Check** when the selected card does not match the evidence increments `misses` by `1` (debounced so tapping Check again on an already-checked unchanged wrong choice does not double-count), plays a gentle boing, **replays** the relevant run(s) highlighting the marker/equal arrival ticks, and speaks the concise mismatch reason. Tapping Check before observing both runs (level 2) or a contrasting pair (level 3) nudges what to test next with `0` misses.
- **Help identities (`hints++` once per identity):**
  - Level 1: `'send-pulse'` — triggers `Send` (if never run) or glows `Done` once observed.
  - Level 2: `'run-both'` (switches to an unseen preset and sends it) and `'pick-trace'` (glows the matching trace card; automatic glow after 2 wrong Checks shares this identity and counts at most once).
  - Level 3: `'run-contrast'` (sets Lane A = `Small`, Lane B = `Tall` and taps `Send`) and `'pick-claim'` (glows `Same mark`; automatic glow after 2 wrong Checks shares this identity).
- **Finish:** `ctx.finish({ misses, hints })` is called once from **Done** after the completion gate passes, awarding one ordinary sticker even with help. Uses the global adaptation rule (`difficulty.ts`: two smooth rounds step up, two struggling rounds step down, pins respected) — noting in docs that stepping up reflects interface progression, not independent physics mastery.

## Speech, how-to card, ghost finger and co-play

Draft `src/games/wave-ribbon/voice.ts` lines (`wave-ribbon.*`):

| Key | Draft line |
| --- | --- |
| `game.wave-ribbon` | `"Wave Ribbon."` |
| `wave-ribbon.instruct.1` | `"Tap Send. Watch the bead and the flag."` |
| `wave-ribbon.instruct.2` | `"Send a small pulse and a tall pulse. Then pick the matching picture."` |
| `wave-ribbon.instruct.3` | `"Test a small pulse and a tall pulse. Check which picture fits the marks."` |
| `wave-ribbon.observe-first` | `"Tap Send and watch the pulse reach the flag."` |
| `wave-ribbon.need-both` | `"Send both small and tall first so you can compare them."` |
| `wave-ribbon.same-size` | `"Both lanes have the same pulse. Switch one to compare small and tall."` |
| `wave-ribbon.pick-card` | `"Tap a picture first, then press Check."` |
| `wave-ribbon.wrong-height` | `"Watch how high the bead goes on this pulse."` |
| `wave-ribbon.wrong-sideways` | `"The bead goes up and down in place. Only the wave travels."` |
| `wave-ribbon.equal-arrival` | `"Look at the time marks. Both pulses reach the flag at the same mark."` |
| `wave-ribbon.ready-done` | `"You got it! Tap Done."` |

- **How-to card (`src/content/howto.ts`):**
  - Goal: `"Send pulses along the ribbon and watch how the bead and wave move."`
  - Steps:
    - `"Tap Send to launch a pulse, and try Replay or Step to watch closely"` `{ from: 1, to: 1 }`
    - `"Send both Small and Tall pulses, then pick the matching bead picture"` `{ from: 2, to: 2 }`
    - `"Set Lane A and Lane B to different sizes, tap Send, and check which claim matches the time marks"` `{ from: 3, to: 3 }`
  - Finish: `"Tap Done after watching the pulse reach the flag"` `{ from: 1, to: 1 }`; `"Pick the matching picture, tap Check, then Done"` `{ from: 2, to: 3 }`.
  - Note: `"Sending, replaying, stepping, and trying same-size tests are always free."`
- **Ghost finger (`autotouch()`):** `touchDemo: true`. Never mutates state directly; taps real controls (`Send` -> wait for `t >= T_ARRIVE` -> `Done` at level 1; `Small` -> `Send` -> `Tall` -> `Send` -> matching card -> `Check` -> `Done` at level 2; toggle `Lane B` to `Tall` -> `Send` -> `Same mark` card -> `Check` -> `Done` at level 3).
- **Co-play (`coplayHint`):** `"Before tapping Send, one person points to where the bead will be when the wave reaches the flag, then watch together and swap."`

## Placement audit, rule tests and build slices

- **Placement (`origin/main` checked 2026-11-27):** `src/content/lands.ts` currently lists 30 games in `tinker-lab` (through `draw-a-ramp`); `landPages` automatically splits lands exceeding `LAND_SPOTS = 13` into balanced pages rather than shrinking targets. Registering `wave-ribbon` as the 31st entry in `tinker-lab` (`school` first; `grownup` appended in E7b) must pass `src/content/lands.test.ts` across every band and viewport (`VIEWS` and `WITH_UPRIGHT`).
- **Rule tests (`src/games/wave-ribbon/logic.test.ts`):**
  - Closed-form determinism (`displacementAt`, `sampleRibbon`, `markerTrace` bit-identical, finite, zero `NaN`/`Infinity`).
  - Finite support (`displacementAt(x, t, amp) === 0` outside `0 < t - x / V_WAVE < W_PULSE`; peak at `t = 1.50` s for `X_MARKER`).
  - Zero sideways marker drift (`markerState(t, amp).x === X_MARKER` for all `t` and `amp`).
  - Equal arrival invariance (`arrivalTime('small') === arrivalTime('tall') === 2.50` s, step `10`).
  - Level-2 card distinguishability (`small`, `tall`, `sideways` have distinct geometries) and Level-3 `isInformativePair(a, b)` rejects `(small, small)` / `(tall, tall)` and accepts `(small, tall)` / `(tall, small)`.
  - `waveLayout(view)` passes `uprightProblems(view, targets, 100)` across `1024 × 768` and all `UPRIGHT_VIEWS` (`768 × 1206`, `768 × 1366`, `768 × 1662`, `768 × 1024`) with zero overlaps or out-of-bounds targets.
- **Build slices (in order):**
  - **E7 (Batch 1 — new game, levels 1–2):** register `wave-ribbon` in `tinker-lab` (`bands: ['school']`, `levels: { school: { min: 1, max: 2 } }`), implement `logic.ts`, levels 1–2 (`Watch the pulse`, `Tall and small`), `Replay`/`Step`, voice, how-to, `autotouch()`, `upright: true`, rule tests, and new-game tier verification (typecheck, units, filtered scripted play of levels 1 & 2 including wrong Check + Help, `fingerdemo`, portrait screenshot, `build`).
  - **E7b (Batch 2 — level 3, older amplitude-vs-arrival case):** append level 3 (`Same speed, bigger wave`, A/B lane bench and two-hypothesis Check/replay, `bands: ['school', 'grownup']`, `school: { min: 1, max: 3 }`, `grownup: { min: 3, max: 3 }`), new-interaction tier verification (wrong hypothesis replay + equal-mark highlight, same-size uninformative test nudge, Help, `fingerdemo` at level 3, portrait screenshot).

**E6 verification:** docs-only (`node scripts/check-links.mjs`, `git diff --check`). No code, unit tests, build, browser checks, hardware or child observation claimed.
