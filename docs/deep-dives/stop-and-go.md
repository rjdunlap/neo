# Stop and Go deep dive

*ID `stop-and-go` · bands lap, toddler, preschool · levels 1–4 on 2026-10-17 · session `claude/dive-stop-and-go` ([PR #535](https://github.com/rjdunlap/neo/pull/535))*

## The game today

A road, round smiling cars and a three-lamp traffic light in Cozy Village. The action is waiting for a cue and then acting on it; the learning purpose is the meaning of red, yellow and green, practice in waiting, and (at the top) taking turns. Nothing is timed: the light keeps cycling for as long as she likes, and waiting is never wrong. Code: `src/games/stop-and-go/index.ts`, `logic.ts`, `logic.test.ts`; [GAMES.md](../GAMES.md#stop-and-go); how-to card `'stop-and-go'` in `src/content/howto.ts`; voice lines `go.*` in `src/content/voice-script.ts`.

| Level | Plan | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | `toy`: tap the light, 8 taps | lap 1, toddler 1–2 | Nothing to get wrong: each tap steps green → yellow → red, and the car zooms round on green |
| 2 | `send`: the light runs itself; send 5 cars | toddler, preschool | Whether the light is green now: tap the front car on green; yellow is a spoken nudge, red is the one miss |
| 3 | `walk`: red light, green light with the pet; 8 steps | preschool | Whether to tap the feet button: step on green, freeze on red |
| 4 | `cross`: two roads, two lights she controls; 6 cars (3 per road) | preschool | Which road goes next; both green at once is the one miss (cars just wait) |

**Content pools.** One car drawing in six colors (`CAR_COLORS`), one backdrop (seed 66), one fixed cycle (`CYCLE`: green 3.5 s, yellow 1.4 s, red 3.5 s), the pet at level 3. Every round of a level looks and times the same.

**Accounting.** Level 1 has no misses. Levels 2–3: going on red is a miss; two misses turn on the hint glow (`hints++`). Level 4: both roads green is a miss; misses count across the round, and the glow rings the green light whose road has fewer cars.

**Known gaps found reading the code (not fixed: docs-only session).**

1. **The lap car ignores her.** At level 1 only the light listens (`tapCar` returns unless the mode is `send`). A one-year-old reaches for the car, the big friendly thing, and nothing happens.
2. **Back cars are silent.** At level 2 only the front car answers; a tap on the second or third car gets no touch-down acknowledgement at all.
3. **The hint points at the wrong thing.** At levels 2–3 the glow rings the *light* while it is green, but the action is the car or the feet. A hint should lead to what to touch.
4. **The walk hint never clears.** `walk()` never resets `wrongs` or `hinting` after a good step (only `tapCar` does), so once the glow is on it stays on for the rest of a level-3 round, and the next red tap adds misses without a fresh hint.
5. **"Great driving!" at the walk level.** `go.done` is said at every level, including the pet's walk to the flag.
6. **Colour is the only state cue.** Lamp position helps (red always top), but the car itself does nothing different on red and green, and red/green colour blindness (about 1 in 12 boys, recalled) makes position the only cue. A toddler also needs motion and sound per state.
7. **A fixed rhythm.** With one fixed cycle a child can tap by rhythm instead of looking; replay never varies.
8. **No help when she is stuck at the crossing.** If both lights are red and she does nothing, nothing prompts her; the only hint is for the both-green mistake.

**Couch, journal, picnic.** Not in couch play, no journal entry, no story step. Person checks: none recorded for this game.

## Similar games

Opened pages are linked; *recalled* marks what was not re-checked at a source this session; *search summary* marks a page seen only through a search result.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Red Light, Green Light (*recalled*) | Playground game | A caller turns away and back; harder by shorter phases and trick calls | Step on go, freeze on stop (already level 3) | Being sent back to the start; the caller's speed tricks |
| Red Light, Purple Light circle-time games ([McClelland et al. 2019](https://docs.lib.purdue.edu/celpubs/37), opened) | Preschool self-regulation games | Arbitrary colour cues, then rule switches (stop on purple) | Clear cues held long enough, said aloud together | Claiming it trains self-regulation: the 2019 trial's HTKS gain was not significant (p = 0.082); only maths was. Red-means-go switches conflict with a real road cue |
| Dance-mat go/no-go fishing task ([Frontiers in Physiology 2019, PMC6805719](https://pmc.ncbi.nlm.nih.gov/articles/PMC6805719/), opened) | Research task for 3–4-year-olds | Go blocks, then mixed blocks with 30% no-go | Story framing ("let the shark go home"), distinct pictures, a modelled practice round | Its 2-second response window: a measurement device, not play. 3–4-year-olds made ~29% false alarms, so the stop cue must be forgiving |
| [Traffic Rush](https://www.commonsensemedia.org/app-reviews/traffic-rush) (opened) | Touch arcade, 9+ | More traffic from four directions; tap a car to stop it, swipe to speed it | A four-way crossing seen from above; tap-to-hold as a control | One collision ends the game, high scores, a daily record |
| [Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways) (opened) | Strategy | New houses and buildings arrive; weekly tool choices, traffic lights alternate the flow | Cars that *arrive over time* and a light that alternates two flows | The overflow timer that ends the game; pressure from growth |
| Sago Mini Road Trip ([iGameMom](https://igamemom.com/have-fun-on-road-trips-with-sago-mini/), opened; stoplight among roadside sights per a [Horn Book review](https://www.hbook.com/story/sago-mini-road-trip-app-review), *search summary*) | Toddler free play, 2–5 | Different destination, car and roadside sights each trip | Varied silly vehicles; nothing negative for driving through things | It has no rules to learn; Stop and Go keeps one clear rule per level |
| LEGO DUPLO World ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/lego-duplo-world), *search summary*) | Toddler sandbox | Themed play sets (trains, vehicles, police) | Calm, no scores or timers | Paid content packs |
| Crossy Crash Traffic Panic and Traffic Jelly (*search summary*) | Arcade, 9+ | Tap lights or cars to avoid crashes as traffic grows | Tapping the lights, not the cars, as the control | Crashes, rising speed |
| Frogger and Crossy Road (*recalled*) | Arcade | Faster lanes, longer runs | — | Lives, being run over, an endless run against the clock |
| Wooden toy traffic lights and road mats (*recalled*) | Physical toy | A grown-up narrates; lights switch by hand | Level 1 as a toy: every press does something visible | — |

**Developmental and safety references.** Go/no-go tasks can be used from about age 3 but young children are very sensitive to timing and need the stop rule said explicitly ([PMC6805719](https://pmc.ncbi.nlm.nih.gov/articles/PMC6805719/) and the reviews it cites). Executive-function transfer evidence is mixed ([subjects.md](subjects.md) `executive-function`), so the game describes itself as *practice in waiting*, not training. Road safety: "Just because the signal says 'walk' doesn't mean it's safe to cross without caution", children should "stop, look, and listen for cars before stepping into an intersection", and children through third grade should not cross without an adult ([Maryland Zero Deaths](https://zerodeathsmd.gov/news/teaching-kids-about-pedestrian-safety/), opened, adapting NHTSA's K–5 curriculum; NHTSA's own page refused the fetch). The subject plan marks `safety` as **needs an expert reviewer**.

## What makes sense here

Stop and Go is the one game where time passing *is* the mechanic: the light changes by itself and she waits. That makes three guardrails non-negotiable for every level: no phase ever shortens below the current 3 seconds of green and red, nothing speeds up as she improves, and waiting is never counted. Depth comes from *what* the cue is and *who* it is for, not from speed.

The long-term arc: **lap** makes things go and stop by touch (cause and effect); **toddler** waits for a light that changes by itself; **preschool** moves her own body (the pet) on the cue and helps two roads take turns; **pre-K** (the window the roadmap already names, [Next up item 19](../ROADMAP.md#next-up)) reads *which* light is hers and runs a crossing where cars keep arriving; **school** only if a sensor/automation level is approved (the `robots-automation` subject names a traffic light) and only with the pedestrian signal after a safety review.

Fits: fresh vehicles and varied (seeded, bounded) phase lengths, every touch acknowledged, a lap entry where the car itself is the toy, lanes with their own lights, arrivals at the crossing, two-person roles at the crossing. Does not fit: crashes, scores or throughput counts, rule switches where red means go (it teaches the opposite of a real cue, and Pet Says owns rule play with *Quiet dance*), dodging traffic (Frogger), and anything that tells a child it is safe to cross on a signal alone. Ducklings crossing behind a stop sign is the proposed [Crossing Guard](../IDEAS.md) idea; it stays separate.

Rework fit ([creature-world brief](../rework/README.md)): vehicles are a natural collection (a bus, a tractor, a boat, a bike that join the village road permanently through play), and the companion could ride in the car's window. Both depend on the rework's unlock and companion systems, so they are decisions, not ready slices.

## Experience and presentation

**First unsupported action.** Lap: touch the car or the light and something visibly goes or stops. Toddler: wait while the light is red, then tap the car on green. Preschool: press the feet only on green; at the crossing, turn one light green.

**Pleasure and feedback.** Touch-down: the touched car bounces and toots a two-note horn (pentatonic, `sfx.bell` pair), the light's lamp flashes. Consequence: on green the car squats, puffs exhaust and zooms; on red it brakes with a squash (scale 1.1 × 0.9, back to 1) and idles with a small rumble wiggle. Return to readiness: the next car rolls up to the line.

**Make waiting pleasant, not empty (art/feel example).** On red the waiting car idles: a tiny up-and-down wiggle every 0.6 s, eyes looking up at the light, a soft `puffs()` cloud from the exhaust; the green turn adds `sfx.tick`, a headlight blink (the existing yellow headlight circle flashes white) and the car's eyes widening. No countdown digits, bars or ticking clocks: those would be a timer. These motions also give every state a non-colour cue (gap 6).

**Variety on replay without changing the rule.** Vehicle kind and colour, seeded phase lengths within bounds, backdrop time of day (morning, sunset), which road has more cars, the order cars arrive in at level 6.

**Reasoning versus memory and motor precision.** Targets stay large (the car hit area is 160 × 120; the feet button 128 across); there is no aiming. The only demand is noticing the state; level 5 adds choosing which of two lights applies. No reading: lamps and symbols carry the meaning, and every cue is spoken on tap.

**Supported completion and stopping.** Every round ends after its goal with help or without; the hint glow sits on the thing to touch on green. Stopping mid-round loses nothing.

**Co-play.** The coplay hint already has the grown-up chant "red means stop". At the crossing (levels 4 and 6) two people can each own one road's light and talk about whose turn it is; one person can still play both. Off-screen: red light, green light in the hallway (already the `offScreen` line).

**Needs a person or device.** Whether a one-year-old reaches for the car or the light first; whether red and green read on an iPad in daylight; whether waiting through a red feels pleasant at toddler age or makes her tap repeatedly; whether the arrivals level (6) is fun or slow for a four-year-old.

## Proposed ladder

### Fresh content inside existing levels

- **Every touch counts (levels 1–2).** At level 1 a car tap toots and bounces, and on green drives round (it counts toward the 8 touches, like a light tap). At level 2 a tap on a back car toots and bounces; it is neither a miss nor a send.
- **The hint points at the action.** Levels 2–3: on green the glow rings the front car or the feet, not the light. Level 3 clears `wrongs`/`hinting` after a good step, as level 2 does after a send.
- **Per-state motion and sound** (as in the art example): idle wiggle on red, headlight blink and tick on green, squash on a red tap.
- **Done lines per level:** `go.done` stays for cars; a `go.done.walk` line ("You made it to the flag!") for level 3.
- **Varied phases.** `cycleFor(rng)`: green and red each 3–4.2 s, yellow 1.4 s, seeded per round. A rule test asserts every green and red is at least 3 s, any non-green stretch is under the bot's 6-second patience, and the bot still finishes levels 2–3.
- **Vehicles.** A pool of six code-drawn vehicles (car, bus, bike with a rider, tractor, ice-cream van, digger), seeded per round, each with the same face and hit area; the sticker draws from it. Fresh art only, no rule change.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | Whose light? | preschool, pre-K | Two lanes, each with its own light: a car lane with the big light and a bike lane with a small bike-shaped light; their cycles are offset. Send 6 vehicles | Which vehicle's own light is green now | Sending on its own red is a miss ("The bike's light is red"); yellow a nudge; two misses glow the vehicle whose light is green | From any moment one of the two lights turns green within 6 s; both are red at some moment of every cycle; the bot finishes; each lane's own light alone decides a send | Second light art and lane layout, 3 voice lines, bot (`rightNow` per lane), how-to steps 5–5 |
| 6 | Busy crossing | pre-K | Level 4's crossing, but 8 cars arrive one at a time on both roads in a seeded order; a waiting car shows a small thought cloud with its road's arrow | When to hand over: turn one road red, the other green, as cars arrive | Both green is the one miss, as at 4; if both lights stay red with cars waiting, the pet points at the busier road after a quiet spell (not a miss or hint); two misses glow as at 4 | Every seeded arrival order is finished by `crossTouch` with no unsafe state; arrivals never exceed 3 waiting on one road; finishing needs at least two hand-overs | Arrival scheduler in `logic.ts`, thought cloud, an idle point (also fixes gap 8 at level 4), bot reuses `crossTouch` |
| 7 | Smart light (decision) | school | A light with a plate under each road: she chooses the light's rule card ("green for the road with a car on the plate") and watches cars use it | Which rule card lets every car through | A rule that leaves a car waiting forever shows it waiting, explained; free retries | Each offered card's simulation; the right card finishes | `robots-automation` tie-in; needs the school window decision |
| 8 | Walk signal (decision) | pre-K, school | The pet and a grown-up critter at the curb, holding hands; a walking figure and a red hand; on the walking figure she taps the pet's eyes to look left, right, then steps | Wait for the figure, then look both ways | A step on the red hand is a miss; stepping without looking is a nudge, never a pass | The figure shows for at least 3 s; the look steps come before every step | Safety wording needs the reviewer; supersedes IDEAS' "5, Walk signal" (renumbered, since 5 is proposed above) |

### Younger-band openings

- **Lap entry, level 9 *Go car, stop car*.** One car loops round an oval road without stopping on its own. Two huge lamps (each at least 150 across) sit low on screen: green makes it drive with puffs, red makes it brake with a squash and idle; tapping the car toots. No misses are possible; the round ends after 8 touches. Lap order `[9, 1]`; `entryLevels` not needed (toddler does not include 9). A rule test asserts the ladder's lap order and that every touch changes something. It is the toy level stripped to two states, the classic stop/go cause and effect a one-year-old can see.

### Easier entries and levels between existing ones

- **Toddler level 10 *Wait for green* (decision).** Between 1 and 2: one car, a two-lamp light (no yellow) that changes by itself with long phases; a red tap makes the car rumble "wait!". Lean: red at 10 is a nudge, not a miss, as a bridge to level 2's miss. Toddler order would be `[1, 10, 2]`, `entryLevels: [10]`. The accounting is the developer's call because it departs from "a wrong answer is a miss".

No renumbering: 5–10 are new stable IDs; 1–4 are unchanged.

### Left out on purpose

- Shorter phases, a faster cycle, throughput counts, high scores, crashes, honking impatience.
- Rule switches where red means go (HTKS-style); Pet Says owns rule play.
- Dodging traffic; Crossing Guard's ducklings stay a separate proposal.
- Couch play: a child's waiting game has no grown-up face-off worth adding.

## Decisions for the developer

1. **Walk signal (level 8)** — ship only after the safety expert review named in [subjects.md](subjects.md); lean: build it with stop-look-listen and a held hand, never "safe because it says walk".
2. **School window and Smart light (level 7)** — lean: wait for the `robots-automation` subject study.
3. **Toddler level 10 accounting** — lean: red is a nudge, not a miss, at 10 only.
4. **Rework hooks** — vehicles that join the road permanently through play (a garage collection), and the companion as the driver. Lean: companion driver first, once RW companion art is settled; the vehicle collection waits for the rework's unlock system.

## Build slices, in order

1. **Every touch counts and the hint points at the action** (existing-game bug fix; gaps 1–6): car taps at level 1, back-car toots at level 2, glow on the car/feet, level 3 hint reset, per-state motion and sound, `go.done.walk`. Checks: typecheck, the rule tests, one filtered regression play (levels 1 and 3, a red tap twice), `fingerdemo` at level 2 since the glow target moves.
2. **Varied phases and vehicles** (content in existing levels): `cycleFor(rng)` with its bounded-phase test, six vehicles, the sticker pool. Checks: typecheck, rule tests, one browser play of level 2 and `fingerdemo` at it.
3. **Lap entry 9 *Go car, stop car*** (new interaction): lap order `[9, 1]`, how-to step for 9, bot taps green and red alternately. Checks: new-interaction tier (scripted play at 9 and 1, one portrait screenshot).
4. **Level 5 *Whose light?* and the pre-K window** (new level): preschool 2–5, pre-K 3–5. Checks: typecheck, rule tests, play of 5, `fingerdemo` at 5.
5. **Level 6 *Busy crossing*** with the idle point that also helps level 4: pre-K 3–6. Checks: typecheck, rule tests, play of 6, `fingerdemo` at 6.
6. *(Decision 3)* Toddler level 10 *Wait for green*.
7. *(Decision 2)* Level 7 *Smart light* and a school window.
8. *(Decision 1)* Level 8 *Walk signal* after the safety review.
9. *(Decision 4)* Companion driver; vehicle collection with the rework's unlocks.

## What was built in this session

Nothing: research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
