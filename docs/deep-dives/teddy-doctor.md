# Teddy Doctor deep dive

*ID `teddy-doctor` · bands lap–school · levels 1–6 on 2026-10-17 · session `claude/dive-teddy-doctor` ([PR #525](https://github.com/rjdunlap/neo/pull/525))*

## The game today

Soft-toy patients (bear, cat, dog, bunny, pig) visit a little clinic. A patient stands on a mat on the left. The reusable tools sit in a two-column tray on the right and are dragged onto the body; they always return to the tray. The game teaches body-part words, listening to a request, noticing what someone needs (empathy), and following a sequence. The care is pretend: the [body/health study](subjects/body-health.md) records that the existing symptom/tool pairings are pretend behavior and not verified care instructions, and the [cells and microbes study](subjects/cells-microbes.md) keeps hygiene, illness and treatment off the island.

Ranges (`LEVELS` in `index.ts`): lap 1–2, toddler 1–3, preschool 2–5, pre-K 3–6, school 5–6. No `order` and no `entryLevels`. `planFor` indexes `PLANS` by array position and clamps to the last plan.

| Level | Plan (`mode`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | Tap the boo-boos (`play`), 2 patients | L, T | Where the boo-boos are. A tap goes to the nearest boo-boo within about 90 patient units; a tap farther away does nothing |
| 2 | Bandage the named part (`part`), 3 patients | L, T, P | Which of three visible boo-boos is on the part she hears ("on my ear"). The bandage is **dragged**. A drop on another part is a miss: "That is my nose. Where is my ear?" |
| 3 | See what is wrong and choose what helps (`tool`), 3 patients, 3 tools | T, P, K | Which tool goes with a visible symptom (stars for a bump, a drip, a sad tummy, shivering feet, a scrape). A drop anywhere on the body counts |
| 4 | Listen, then the right thing in the right place (`clue`), 3 patients, 4 tools | P, K | The same pairing from speech alone, and the body part too (the nearest part is judged) |
| 5 | Check-up from a picture card (`card`), 2 patients | P, K, S | Stethoscope (tummy), thermometer (mouth), flashlight (ear) in the order on the card |
| 6 | Check-up in the order said (`told`), 2 patients | K, S | The same three in the spoken order; the card shows "?" until each step is done |

**Content pools:** 5 patients (never the same twice in a row); 4 scrape places (head, ear, tummy, feet); 5 ailments, each with its own tool (scrape→bandage, bump→ice on head, sniffles→tissue on nose, tummy→warm bottle on tummy, cold→socks on feet), never the same twice in a row; 3 check-up steps in the 6 possible orders, never the same order twice in a row. Two levels draw from only 3 items.

**Mistakes and hints:** a boing, a surprised face and a spoken hint. The second mistake on a patient counts one hint and lights the wanted tool and, at levels 2 and 4, the body part. Rule tests (`logic.test.ts`) cover the demonstration at every level, one cure per ailment, the variety guarantees, boo-boo places on the body, mirrored feet and ears, and that parts are distinct.

**Known gaps found reading the code:**
- **The first touch can be dead.** `tapAt` ignores a tap more than about 90 units from a boo-boo, with no sound or motion. `busy` stays true until the instruction finishes, so every tap during "Oh no, boo-boos! Tap them…" is dropped. At level 3 both a `say` and an `instruct` are awaited before she can act. A one-year-old's first taps are exactly these.
- **The how-to card says "tap" at levels 2 and 3**, but both are drags (`onTap` is attached only in `play` mode). The last step, `{ from: 6 }`, has no `to`, so it would claim any level appended above 6.
- **Lap includes level 2, which is a drag.** No person has checked whether a lap player can make it. Not changed silently here (see decisions).
- The [IDEAS](../IDEAS.md) audit rows say "leave": the ladder already ends in a sequenced check-up. This dive overrides that with two appended levels that add new decisions, not more load.

**Couch:** none. **Browser case:** `BROWSER_SUITE=next NEXT_ONLY=doctor` (levels `FROM_LEVEL`..6, hard-coded `level <= 6`, with a per-mode score assertion). **Person check open:** [DEVICE-CHECKS](../DEVICE-CHECKS.md) lists Teddy Doctor's spoken-only clues (level 4).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Toca Doctor (Toca Boca), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-doctor), [Common Sense Education](https://www.commonsense.org/education/reviews/toca-doctor) and [BridgingApps](https://bridgingapps.org/bridgingapps-reviewed-app-toca-doctor/) (search summaries) | Touch app, about 20 body puzzles | No clear difficulty curve: four problems at a time, repetitive "though enjoyably so"; nearly wordless | Problems shown visually; each a small concrete action with a funny result. BridgingApps notes therapists use it for body parts and following directions, with the adult supplying the words: Teddy Doctor speaks them | Blood, shots and swallowed-object gags; unclear what to tap next; no feedback (both reviews) |
| Toca Pet Doctor, [Common Sense Media](https://www.commonsensemedia.org/app-reviews/toca-pet-doctor), [Cool Mom Tech](https://coolmomtech.com/2014/02/toca-pet-doctor-app-lets-kids-care-animals-without-ever-touching-real-litter-box/) (search summary) | Touch app, 15 animals in a waiting room | None: free play, no points; each visit runs sick → treated → fed → asleep | **A waiting room where she chooses who to help**, and visible clues on the animal; an ending where the patient settles happily | No spoken instructions; the young need an adult to start |
| Dr. Panda's Hospital, [Common Sense Media](https://www.commonsensemedia.org/app-reviews/dr-pandas-hospital) | Touch app, 10 procedures | Choose a patient; waiting room → room → test → recovery; stickers per cure | One sticker per patient helped, a test before the treatment | Bone resets, bacteria-killing, shots; "More Apps" links out; "could offer more feedback" |
| Doc McStuffins: Pet Vet (Disney Junior), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/doc-mcstuffins-pet-vet), [The Mouse for Less](https://www.themouseforless.com/blog_world/review-of-doc-mcstuffins-pet-vet-app/) (search summaries, pages not opened) | Licensed touch app | Badges to level up and earn a special stethoscope | Narrated instructions so non-readers can start; toy patients | Badge-driven level-ups as the reason to play |
| *Daniel Tiger's Neighborhood*, "Daniel Visits the Doctor" ([episode archive](https://www.neighborhoodarchive.com/dtn/episodes/102b/)) | TV episode (not a game) | — | A check-up of **heart, eyes, throat, height and weight**; the doctor checks Tigey too; "when we do something new, let's talk about what we'll do"; then Daniel helps a nervous friend | A sticker "for cooperating": here a sticker is for finishing the round, help included |
| Teddybear Hospital (medical-student outreach), [prospective cohort study, PMC11486973](https://pmc.ncbi.nlm.nih.gov/articles/PMC11486973/); [systematic review, BMJ Open 2021](https://bmjopen.bmj.com/content/11/1/e041506) (search summary) | Physical role play, ages 3–12 | Stations: the child's own toy is measured for **length, weight and temperature**, listened to, its wound cleaned and dressed | Measuring the toy as a check-up step. Study, ages 4–6: knowledge of equipment and anatomy rose and self-rated anxiety fell slightly (non-randomized; the review calls the evidence limited) | Injections, organ puzzles, healthy/unhealthy food sorting (the island makes no food prescriptions) |
| Doctor's kit toys (Melissa & Doug Get Well kit, [retailer listing](https://modernbrands.com.au/products/melissa-doug-get-well-doctors-kit-play-set)) | Physical pretend play | Open-ended | The tool set (stethoscope, thermometer, otoscope, bandage). Its empathy claims are seller copy, not evidence | — |
| JumpStart Baby / Toddlers, "Dress Teddy" ([MobyGames](https://www.mobygames.com/game/99805/jumpstart-baby/); body-part naming recalled, as in IDEAS) | 1998–2000 CD-ROM for 9–24 months | Any key press moves on | Teddy names the body part each thing goes on: words said as the action happens | — |
| Pokémon Center healing (recalled, not opened) | Console RPG convention | Fixed | A creature that comes back happy and keeps the visit in its story | Healing as a resource tied to fights |

**Developmental references.** CDC, [milestones by 18 months](https://www.cdc.gov/act-early/milestones/18-months.html): "Follows one-step directions without any gestures" and "Points to show you something interesting"; its tips say to encourage pretend play and to "start to teach your child the names for body parts by pointing them out". The page lists no body-part milestone, so the game claims exposure to body words for lap play, not mastery. A [Children's Healthcare of Atlanta handout](https://www.choa.org/-/media/Files/Childrens/medical-services/rehabilitation/developmental-milestones.pdf) (search summary) gives simple pretend such as feeding a doll near 18 months and several actions strung together by 2. No school standard is claimed; ordering words (*first, before, after, last*) are ordinary language-comprehension practice.

## What makes sense here

- **Every touch should do something at lap level.** Toca's nearly wordless play needed an adult; here the patient speaks and reacts. Fix level 1 before adding anything: the reach and the spoken part are ready now; acknowledging taps during the instruction or away from the patient is [V2](../FAMILY-EXPERIENCE.md)'s touch-acknowledgment work, which applies to one other tap game only after a person reviews the Animal Snack pilot, so it waits (as Sound Garden's level 1 does).
- **Name the part as the bandage goes on.** JumpStart's Dress Teddy and the CDC tip point to the same thing: body words said during the action. This is this dive's pick for the body/health study's **B7** ("a single additional body-word variation in Pet Says, Teddy Doctor *or* Sound Garden"). Pet Says and Sound Garden are not widened by it.
- **Noticing who needs help** (Toca Pet Doctor's and Dr. Panda's waiting rooms) fits a toddler: two friends, one with a visible boo-boo and a sad face. It is empathy as noticing, before a tool is involved.
- **Measuring belongs in a check-up.** Daniel Tiger's check-up and the Teddybear Hospital stations both weigh and measure. A scale and a height chart add check-up steps without making any care claim: they treat nothing and pair no symptom with a remedy. The [zoo study](subjects/zoo-animals.md) already assigns a keeper's cooperative weigh-in ("steps on the scale when asked") to Teddy Doctor.
- **Older play: a request with flexible order.** Level 6 already asks her to hold three steps in memory; a fourth would be load, not depth. Instead, the patient states *one rule* ("look in my ear before my temperature"), and every order that keeps the rule is right. That is reasoning about *before/after/first/last*, with acceptable alternative solutions.
- **Not ready, because of the care-claim boundary:** new symptom→remedy pairings (hiccups → a sip of water, sleepy → a blanket), a clean-then-cover routine, and a diagnose-then-treat level. Each states practical care, which the body/health study keeps under review. They stay as decisions.
- **Creature-world arc.** Today the patients are the stock critters. When the [rework](../rework/README.md) has its creatures, the clinic is a natural place to meet them: a creature arrives with a boo-boo and goes home happy, and the journal keeps a thank-you. That waits on the rework's cast and journal (see decisions). Nothing is lost or neglected: a patient never gets sicker while she is away.

**Long-term arc:** lap taps that make bandages appear and hear the part named → toddler noticing who is hurt → preschool body words and seeing what helps → pre-K listening for where and what → school check-ups with a stated order rule.

## Experience and presentation

- **First unsupported action:** at level 1 she touches the teddy. Today a tap near a boo-boo works and a tap elsewhere is silent, and taps during the opening line are dropped. Proposed now: any touch on the patient, once the line is spoken, bandages the nearest remaining boo-boo with the squish and star burst, the patient giggles and pokes, and the pet says the part ("My ear!"). Gated on V2: accepting taps during the opening line (which needs a per-patient guard so a fast finish cannot let the old intro clear `busy` during the next patient's), and a poke for touches that land during a spoken line.
- **Touch-down and return to readiness:** a picked tool already ticks and rides above the finger; it always flies home to the tray. A drop off the patient does nothing and needs nothing more.
- **Variety without changing the rule:** patient, scrape places, ailment, check-up order and, after slice 2, which three of five check-up steps.
- **Reasoning, not reading, memory or precision:** nothing is read. Level 6 is the only memory load and stays the top memory demand. Level 8 replaces memory with a rule that is said again on request (the corner guide repeats the instruction). Drops are judged by the nearest body part, so precision is never the test.
- **Supported ending:** the glow after two misses always shows a tool and place that work; at level 8 it shows a tool that may go next.
- **Co-play:** the grown-up plays the patient (the existing co-play tip). At level 8 a grown-up can make up their own rule aloud ("my ear first!") and the child can follow it. The solo game is unchanged.
- **Art/feel example (code-drawn):** the scale is a `Graphics` rounded platform with a dial; when it is dropped on the feet the patient hops onto it, a needle tweens from 0 with `ease.outBack`, `sfx.tick` plays per step of the needle, and the pet says "Weigh me: just right!". The height chart is a striped `roundRect` that slides up behind the patient, with a star that pops at the top of the head.
- **Needs a person or device:** whether a lap player can drag a bandage at level 2; whether a toddler at level 7 looks at the faces or taps the nearer friend; whether "before" and "after" are heard clearly in device speech at level 8.

## Proposed ladder

### Fresh content inside existing levels

- **Level 1, any touch on the patient counts and the part is named** (B7). Once the line is spoken, any touch on the patient bandages the nearest remaining boo-boo; the pet names the part. Taps during the opening line wait on V2 (above). Rule test: from any point on the patient's hit area the nearest-boo-boo choice returns a remaining boo-boo, and each `SCRAPE_PARTS` part has a voice word.
- **How-to truth.** Levels 2 and 3 say "drag the bandage to…" and "drag what helps onto the patient"; level 6's step becomes `{ from: 6, to: 6 }`.
- **Two more check-up steps: a scale and a height chart** for levels 5 and 6. `Check` grows to five (scale → feet, height chart → head), and each round draws three of the five, never the same set and order twice in a row. Spoken: "weigh me" and "see how tall I am". Rule test: steps are distinct and from the pool, the demonstration lands each on its part, consecutive rounds differ. No care claim: measuring is not treating.

### New levels on top

Appended with stable IDs. `order` places 7 in the toddler window, `entryLevels: [7]` keeps birthdays and pins safe in bands that do not list it.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Who needs help?** | toddler (order 1, 7, 2, 3) | Two friends side by side on the mat. One has a big boo-boo and a sad face; the other smiles. "Who has a boo-boo?" Tap the hurt friend: they step to the middle, and a tap on the boo-boo puts on the bandage (level 1's action). 3 pairs | Which friend needs help, from the face and the boo-boo | Tapping the smiling friend: a boing, a giggle and "I feel fine! Who has a boo-boo?" Default: a miss. After two, the hurt friend glows | Exactly one hurt friend per pair, the two are different kinds, the hurt one is not on the same side every round, both friends' hit areas are at least 100 units apart on screen | Two-patient layout at a smaller scale with body-centered hit areas; voice; how-to step; bot (tap the hurt friend, then the boo-boo); extend the `next` browser case past 6 with this mode's score |
| 8 | **Before and after** | school (order 5, 6, 8) | A check-up of three steps. The card shows the three tools in no order. The patient says one rule: "Please look in my ear before you check my temperature." Any order that keeps the rule finishes. 2 patients; the second has two rules ("…and listen to my heart first"), which still leaves one order | Which step can go next under the rule; there are several right orders | A step that breaks the rule: a boing and the rule restated ("I asked for my ear before my temperature"). Default: a miss. After two, every tool that may go next glows | Every round's rules allow at least two orders (round 1) or at least one (round 2), never only the trivial "say the order" case of three rules; the judge accepts exactly the orders that keep the rules; the hint lights only tools that may go next; the bot finishes a valid order | Rules in `logic.ts` (`first`, `last`, `before`); voice lines per rule shape; card in "unordered" style; extend the `next` case and its score; how-to step `{ from: 8, to: 8 }` |

### Younger-band openings

- **Lap:** slice 1 makes level 1 a true lap toy. Level 7 is toddler only by default; a lap window waits on a person watching (decision 2).
- **Toddler:** level 7 between 1 and 2, so a toddler meets noticing before naming.

### Easier entries and levels between existing ones

Level 7 is the easier entry (between 1 and 2 for toddlers), placed by `order` and declared in `entryLevels`. No saved level or pin is renumbered. `planFor` must keep clamping safely; add a rule test that every level in every band's range maps to its own plan, so an appended ID never falls back to level 6's.

### Left out on purpose

- A fourth spoken check-up step: memory load, not a new decision.
- Shots, blood, bones, germs, organs, food sorting, medicine: outside the island's pretend-care boundary.
- A timer in the waiting room, patients who get worse, or lost patients: no pressure or neglect.
- Triage ("who is the most hurt?"): ranks suffering, which is not a game for her age.
- Couch play: a care role-play has no fair face-off.

## Decisions for the developer

1. **New ailments and care routines** (gated by the body/health practical-care review). Proposed: hiccups → a sip of water at the mouth; sleepy → a blanket; a scrape that is washed before it is covered; a level 9 *Find out what is wrong* (a check-up result, such as a warm thermometer, leads to a comfort item). Lean: keep comfort items only (a blanket, a cuddle, a cool cloth), never medicine, and name a reviewer before building any of them.
2. **Level 7's windows and accounting.** Defaults the build uses: toddler only (order 1, 7, 2, 3); tapping the friend who is fine is a miss. Alternatives: a lap window after a person watches a toddler and a lap player; tapping the happy friend as a free look.
3. **Level 8's windows and accounting.** Defaults: school only (5, 6, 8); breaking the rule is a miss. Alternative: a pre-K window after it is watched.
4. **Lap and the level 2 drag.** Lap's range includes a drag. Lean: keep 1–2 until a person watches a lap player try it; if they cannot, lap becomes 1 and 7.
5. **Creature-world hooks** (after the rework's cast and journal). Defaults: (a) a patient helped files a thank-you card in the journal, through `RoundResult.discoveries`, showing only what the round showed; (b) her own companion (`ctx.petSpec`) is sometimes the patient, which needs body spots for the pet art; (c) rework creatures join the patient pool when they exist. None is ready; none unlocks or gates the game. Kept apart from RW04's adventure.

## Build slices, in order

1. **The whole patient counts, the part named, a true how-to** (existing-game bug fix on an unchanged interaction; in progress on `claude/teddy-doctor-support-truth`): at level 1 any touch on the patient, once the line is spoken, bandages the nearest boo-boo; the pet says the part (B7's body word; voice lines); levels 2–3 how-to wording says drag; level 6's step capped `{ from: 6, to: 6 }`; a rule test that every band's levels map to their own plan. Checks: `npm run typecheck`, Teddy Doctor's rule tests and the how-to test, `BROWSER_SUITE=next NEXT_ONLY=doctor FROM_LEVEL=1` (runs 1–6), `fingerdemo` at 1.
2. **Weigh and measure** (content in levels 5–6): a scale and a height chart join the check-up, three of five per round. Checks: typecheck, rule tests (distinct steps, demonstration parts, variety), `BROWSER_SUITE=next NEXT_ONLY=doctor FROM_LEVEL=5`, `fingerdemo` at 5.
3. **Level 7 Who needs help?** (new level, two-patient layout): `PLANS`, `LEVELS` with toddler `order: [1, 7, 2, 3]`, `entryLevels: [7]`, voice, how-to, bot, the `next` browser case extended past 6. Checks: the new-interaction tier (one scripted play with a wrong friend and a hint, `fingerdemo` at 7, one portrait screenshot).
4. **Level 8 Before and after** (new level on the existing drag; after slice 2 if it uses five steps, otherwise on three): rule shapes in `logic.ts`, a judge that accepts every valid order, hint and bot that agree with it, school `order: [5, 6, 8]`. Checks: typecheck, rule tests, one browser play at 8, `fingerdemo` at 8.

Gated: level 1 taps during the spoken line and a poke for busy touches (V2's person check, with the per-patient guard above); decisions 1, 4 and 5; the lap and pre-K windows in decisions 2 and 3.

## What was built in this session

Nothing: research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
