# Stop and Go

<!-- generated: from src/games/stop-and-go; edit the text below the end mark (npm run game-docs) -->

**ID:** `stop-and-go` · **Land:** Cozy Village · **Ages:** lap–school · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** self-control, colors, safety, turn-taking

| Band | Levels, easiest first |
| --- | --- |
| lap | 9, 1 |
| toddler | 1, 10, 2 |
| preschool | 2–5 |
| pre-K | 3–6 |
| school | 7 |

| Level | Plays like |
| --- | --- |
| 1 | Tap the traffic light: red stops the car, green makes it go |
| 2 | The light changes by itself: tap a car only when the light is green |
| 3 | Red light, green light: step toward the flag on green, freeze on red |
| 4 | Traffic helper: let one road go at a time at the crossing |
| 5 | Whose light? A car lane and a bike lane each have their own light: send the front one whose own light is green |
| 6 | Busy crossing: cars arrive one at a time on both roads; hand over one road at a time |
| 7 | Smart light: the crossing runs itself; choose the rule card that lets every car through |
| 9 | Go car, stop car: one big lamp, and a touch anywhere turns it: green, the car goes round; red, it stops (lap's first level) |
| 10 | Wait for green: a red and green light changes by itself; tap the car when it is green (a tap on red is only a "wait!", never a miss) |

<!-- end generated -->

**Starts as:** lap entry: one big lamp, a touch anywhere turns it, green drives a looping car and red stops it; then tap the traffic light: red stops the car, green makes it go (the car toots and hops when tapped too)

**Grows into:** wait for green with one car and a two-lamp light (toddler), send a car only on green, red light, green light with the pet, a two-road crossing that takes turns, two lanes with their own lights (send the one whose light is green), a busy crossing where cars arrive one at a time, and (school) a smart light she programs by choosing a rule card

## Design notes

*After red light, green light and toy traffic lights.* A road, smiling cars and a three-lamp traffic light. Level 9, *Go car, stop car*, is the lap entry (lap order 9 then 1): a car loops round an oval road without stopping by itself, and one big lamp (240 across, on a short pole above the road, starting red, a play triangle on green and a stop bar on red, so the cue is not colour alone) answers a touch anywhere by turning to the colour the car is not obeying: green and it drives with puffs, red and it parks; every touch, and a tap on the car (which toots), counts as one of eight touches, and nothing is a miss or a hint. On the lap level the light is a toy: tapping it steps green, yellow, red, and the car zooms off on green; the car answers too (a tap toots a two-note horn and hops, and on green drives round), every car tap counts as one of the round's eight touches, and turning the light red squashes the waiting car. Then the light cycles by itself (long greens and reds of 3 to 4.2 seconds, drawn afresh for each round so tapping to a rhythm does not work, and a short yellow); each round's vehicle is one of six (car, bus, bike with a rider, tractor, ice-cream van, digger), all with the same face and headlamp, and the sticker draws from the same pool and the child sends the front car only on green; on the walk level the pet steps toward a flag on green ("red light, green light"). Going on red is a gentle miss (the car squashes); yellow is only a nudge (the front car toots and the pet says to wait); a tap on a car behind the front one just toots and hops, never a send or a miss; waiting is never wrong and nothing is timed. On red the cars idle with a small rumble bob, and on green a tick sounds and every waiting car blinks its headlight, so the state is not colour alone. At levels 2 and 3 the hint (after two misses) glows around the front car or the feet button, and only while the light is green; at the walk level a good step clears the misses and the glow, and the flag ends with "You made it to the flag! Great stopping and going." The top level is a two-road crossing with two lights the child controls: each road has three cars, and both roads green at once is the one mistake (cars just wait). At the crossing, misses count across the round, and the hint glows the green light that should turn red. A play-through found two bugs: cars added before the light was on the stage (now a car layer), and the first crossing design letting one road finish the round without any decision. **Level 5, *Whose light?*** (preschool 2–5, pre-K 3–5) has two lanes, a car lane with the big light and a bike lane with a small bike-shaped light, each on its own seeded cycle; the lights take turns with a short both-red gap, and she sends the front vehicle only when its own light is green. Sending on its own red is a miss with a lane-specific line ("The bike's light is red"), and the hint glows the front vehicle of the green lane. **Level 6, *Busy crossing*** (pre-K 3–6) is the crossing with eight cars arriving one at a time on both roads in a seeded order (never more than three waiting on one road), each waiting car showing a thought cloud with its road's arrow; both green is still the one miss. If both lights stay red with cars waiting for 6 seconds, the busier road's light rings and a line is spoken (an idle point, never a miss or a hint); it also applies at level 4. **Level 10, *Wait for green*** (toddler, played between 1 and 2: order `[1, 10, 2]`, `entryLevels: [9, 10]`; mode `wait`, `WAIT_PLAN`) is one car and a two-lamp light (red and green, no yellow) that changes by itself on long seeded phases of 4 to 5 seconds. Tapping the car on green sends it; on red the car rumbles and the pet says "Wait! Wait for green." (`go.wait`). A red tap is a nudge, never a miss and never a hint (the developer's accounting call was settled on 2026-10-23: a nudge at 10 only), so misses and hints are always 0 here; level 2 keeps red as a miss. The round ends after 3 cars are sent. The ghost finger reuses the car-at-front-until-green logic (`GO_TARGET.wait = 'car'`).

**Level 7, Smart light (school 7–7).** The crossing runs itself; each round shows three rule cards (the right "plate" card plus two of four wrong ones: always east-west, always north-south, empty, both) and she taps one to watch `simulate()` run it on seeded queues (1–3 cars a road, never equal). A wrong card strands a car (clock bubble, spoken reason, cars reset, same cards retried), never a crash or both green. Each wrong card is one miss; two misses in a crossing glow the right card (one hint); a cleared crossing resets the count; three crossings finish the round. Cards are a picture plus a short printed label and speak their rule on tap. Code is in `smart.ts` (`SmartLight`), with shared drawing in `art.ts`. It uses the sideways layout, not upright.
