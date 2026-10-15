# Subject deep-research sessions: sciences, history, technology and life skills

**Requested by the developer, 2026-10-14:** add research sessions for the sciences beyond physics, for a range of history subjects, for technology (could it expand beyond coding?), and (same day, after the question "other subjects, life skills, recipes, exercise?") for life skills. **The goal, stated the same day: games for toddlers, preschoolers, elementary children, middle schoolers *and* the parents.** So every session must answer for every audience, not only the school years. A game deep dive researches one built game; a **subject session** researches one subject and returns candidates, modes for existing games, and a ladder for one first game. Physics already has [its own plan](../PHYSICS-GAMES.md).

**A subject session is research and ideation only: documents, no code**, with the same rule as a game deep dive (nothing under `src/`, `scripts/` or `public/`; no tests; do not build a slice, however small). The roadmap's chunk 28 points here. Nothing below is built, scheduled or promised. The long-term direction reaches about age eleven ([Later horizons](../ROADMAP.md#later-horizons-elementary)); she is about one, so the nearer rungs matter first (see the order below).

## The audiences

| Code | Who | Runtime band | Notes |
| --- | --- | --- | --- |
| **L** | Lap, under 2 | `lap` | Touch causes a pleasing event, a grown-up shares the action |
| **T** | Toddler, 2 | `toddler` | One goal, one tool |
| **P / K** | Preschool (3), pre-K (4–5) | `preschool`, `prek` | A character's request, sorting, sequencing, short plans |
| **S** | School, about 6–8 | `school` | Evidence, debugging, equivalent solutions |
| **U** | **Upper school, about 9–12** | `school` (its top levels) | A *planning* split, not a runtime band. Today the island has almost nothing designed for it |
| **M** | **Middle school and early teens, about 11–14** | none yet | The decision below: `school` stops at 12 and `grownup` starts at 13 |
| **G** | Grown-ups: parents, grandparents and teens 13+ | `grownup` | The island's Lantern Lake puzzles, couch play and the family table |

**Where the catalog stands (2026-10-14, counted from `bands:` in each game's `index.ts`):** of 94 games, 39 reach lap, 51 toddler, 63 preschool, 76 pre-K, 61 school and 11 grown-up. Four are school-only and eleven grown-up-only. "School" is a wide band (6–12) designed mostly for 6–8, so 9–12 and the early teens are the thinnest, and the grown-up shelf is 11 puzzles. Sessions should help fill those gaps, not add yet more 3–6 content.

## What every session must answer

For **each audience above** (leave a cell *none, and why* rather than blank):

- **A first action** she or they can try without an adult supplying the answer.
- **A deeper rung** that adds a decision (not speed).
- For **G (grown-ups)**, give an answer in all three forms where sensible: a game *for a parent to play for themselves* (a cozy puzzle in Lantern Lake), a game *a parent plays with the child* (a co-play role; see the [family table](../ROADMAP.md#next-up)), and a *tool for the grown-ups' page* (plain HTML: an off-screen activity card, a conversation prompt, a recipe card). The page stays plain HTML (`src/parent/panel.ts`).
- For **M**, say what a 12- or 13-year-old would choose to play, using the tween evidence in the next section, and whether it belongs to `school`'s top levels or to a future band.

### What the search found about the older range (2026-10-14)

- A study of 56 tweens (Self-Determination Theory) found they wanted a range of play with real challenge (autonomy and competence) and places to step back and be with friends (relatedness), and another study found tweens spend much of their play time on physical or talkative play ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9255119/)). That is play-ground evidence, not game design.
- A preference study of children 6 to 12 (average age 9) recommended curiosity through variation and discovery, with achievement, learning and social contact ([SciTePress](https://www.scitepress.org/PublishedPapers/2018/65848/65848.pdf)); the sample skews younger than 11–14.
- The initial search found **no study of educational-game engagement in middle school**. Follow-up: the [social-emotional study](subjects/social-emotional.md#anchors-and-evidence-limits) opened a randomized game trial with ages 11–14, with no between-group gain in empathic accuracy. That narrows the evidence gap; it does not establish engagement with our M-band proposals or real-world transfer.
- Middle-school science, from district scope-and-sequence documents, is energy, chemical change and structure of matter, plate tectonics and rock cycling, genetics, ecosystems, forces, waves and astronomy ([New Jersey map](https://www.nj.gov/education/standards/science/Docs/Accessible_version_Middle_School_Scope_and_Sequence_Map.pdf), [NGSS Appendix L](https://nap.nationalacademies.org/read/18290/chapter/18)). The Common Core ratio and statistics standards did not load; open [corestandards.org](https://www.corestandards.org/) before using them.

## The procedure (one session, one subject)

1. **Claim it.** Fetch `origin`, run `scripts/overlap.sh <subject-id> docs/deep-dives/subjects/<subject-id>.md`, check this table and open pull requests. Make the first commit a docs-only claim (set the row to **in progress**) and publish a draft pull request straight away.
2. **Read what is there.** The subject's rows in [IDEAS.md](../IDEAS.md) (grep the game names below), [GAMES.md](../GAMES.md) for the built games it touches, the [gap table](../IDEAS.md#gaps-in-the-catalog), the [roadmap's zone concepts](../ROADMAP.md#zone-concepts) and the [rules for every activity](../../AGENTS.md#rules-for-every-activity).
3. **Find the curriculum anchors.** The official standards by grade band (NGSS for science, the C3 Framework and national or state standards for history, CSTA and ISTE for technology, CASEL for social-emotional learning, WHO and AAP for movement and screens), opened at their source. Record which codes you actually opened. A standard is a guide, never a gate.
4. **Find what people can do and understand at each age,** from toddler to teen. Developmental research or teacher guidance, with the caveat when it is thin. Record a gap as a gap.
5. **Research five to ten similar games or apps,** plus a physical or unplugged equivalent. For each note how its progression grows, what to borrow, and what Puddle Island must leave out (timers, lives, streaks, ads, purchases, shame, scarcity). Open the source; mark anything recalled.
6. **Check fit with the island.** Which ideas fit the rules; which belong to an existing game as a mode (prefer that when the action is the same); what needs new infrastructure; which land or zone would hold it. Test every idea: *a fun action with a clear learning purpose*.
7. **Write it up** as `docs/deep-dives/subjects/<subject-id>.md` from the template below, ending with an ordered list of build slices, each sized for one session. Then update the tracker row, the notebook's candidate table and the roadmap, and add a short VERIFICATION entry (docs only).

### Template

*Subject, ID, audiences, date, session.* **Anchors** (standards opened, with codes) · **What people can do** (by age, toddler to teen, with caveats) · **On the island today** (built games, notebook rows, gaps, and which audiences already have something) · **Similar games and apps** (table: game, kind, how progression grows, borrow, leave out) · **What fits** (and what does not, and why) · **An answer for every audience** (table: audience, first action, deeper rung, or *none, and why*; for G the three forms) · **Candidates** (table: name, fun action, learning goal, audiences, effort, new infrastructure) · **A first game's ladder** (levels, first rounds, what she decides, mistakes and hints, a rule test, cost) · **Experience and presentation** (the first unsupported action, touch-down feedback, replay variety, an off-screen activity) · **Decisions for the developer** · **Build slices, in order** · **What was built**: nothing; say what ran.

### Ground rules

- **No violence as the fun.** No conquering, battles, weapons play or points for winning wars. When a history involves war, enslavement, displacement or genocide, say how it is acknowledged for the age (often by not depicting it at all in a young band) and put the depth question under *Decisions for the developer*.
- **No pretending to authority.** Indigenous and living cultures, religion, contested events, body safety and medical or food-safety advice need sources written by the people concerned or by recognized experts, and may need a named reviewer before anything ships. Mark an idea *needs review* rather than drafting it.
- **Everyday life before dates.** The early bands learn *then and now*, before and after, long ago. Dates, centuries and named leaders are for school-age bands, and the island never needs a child to read.
- **Evidence over trivia.** Prefer sorting, ordering, comparing two sources and asking what changed over quizzes of facts. A rule test can check ordering and consistency; it cannot check historical truth, so a human review is a named step.
- **The body and food stay neutral.** No fitness tracking, calories, weight talk, "good food and bad food", streaks, or shame. The island has no camera, microphone or body tracking, so movement is shown by the pet and done off-screen by the family.
- **Real-world instructions need a reviewer.** A cooking card for a one-year-old, a stretch, a road-safety rule: each is advice. Cite a recognized source and have a person review it before it is spoken or printed.

## Tracker

Status values as in the [game tracker](README.md#tracker): **not started**, **in progress**, **designed**, **building**, **done**. Audience codes are in the table above. Zones are the [roadmap's working proposals](../ROADMAP.md#zone-concepts). **G** is the form a grown-up gets (play, play-with, page card).

### Sciences

| ID | Subject | Anchors to open | Island games it touches | Likely zone | Audiences | G form | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `life-science` | Animals and plants: needs, parts, life cycles, habitats and seed dispersal | Head Start P-SCI 1–6; NGSS K-LS1-1, 1-LS1/3, 2-LS2-1/2, 3-LS1-1, 3-LS4-3, 4-LS1-1, MS-LS1-4; Kew and Smithsonian (opened in study) | Habitat Helpers, Garden Grow, Photo Safari, Animal Snack; Caterpillar Week developed as Life Story Lab | Rainbow Meadow / Barnyard; Discovery Marsh proposed | L–M; G | seed-route puzzle; shared experiment; reviewed observation card later | designed 2026-10-14: [study](subjects/life-science.md), [PR #330](https://github.com/rjdunlap/neo/pull/330); [Seed Travelers, Life Story Lab and existing-game mode packets](../ROADMAP.md#life-science-recommendations); docs only, biology/model and practical-card review open |
| `ecosystems` | Ecosystems, food webs, adaptation, populations | NGSS 3-LS, 5-LS2, MS-LS2 | Habitat Helpers (a later mode), Critter Sort | Discovery Marsh | S–M | balance-an-ecosystem puzzle | not started |
| `earth-materials` | Rocks, soil, minerals, fossils, landforms, plate tectonics, erosion | NGSS 2-ESS, 4-ESS1/2, MS-ESS2 | Fossil Dig and Sand Table (proposed), Mole Mine | Discovery Marsh | K–M | strata and fossil deduction puzzle | not started |
| `weather-water` | Weather, the water cycle, seasons and climate | NGSS K-ESS2/3, 3-ESS2, MS-ESS2 | Weather Wardrobe, Day by Day, Lemonade Stand, Garden Grow | Discovery Marsh | T–M | watershed routing puzzle | designed 2026-10-14: [study](subjects/weather-water.md), [PR #313](https://github.com/rjdunlap/neo/pull/313); Rain Garden first, Drop's Journey and Forecast Detective follow-ups; Weather Window stays in Day by Day; docs-only proposals |
| `space` | Sun, moon, stars, planets, seasons, day length | NGSS 1-ESS1-1/2, 5-ESS1-1/2, MS-ESS1-1/2/3 (opened in study) | Light Lab, Day by Day, Moon Window (proposed); Zoom Walk and Planet Hop reuse | Tinker Lab first if capacity permits; Skywatch Isles remains proposed | L–G through separate modes/candidates | Observatory Files / Orbit Garden; observer–model-maker co-play; reviewed page card | designed 2026-10-14: [study](subjects/space.md), [PR #335](https://github.com/rjdunlap/neo/pull/335); [Moon Window, Orbit Garden and Observatory Files packets](../ROADMAP.md#space-science-recommendations); daylight stays in Day by Day; docs-only proposals |
| `matter` | States of matter, mixing, materials, chemical change | NGSS 2-PS1, 5-PS1, MS-PS1; PhET States of Matter | Fill and Dump, Pet Kitchen, Water Paths and Sand Table (proposed) | Tinker Lab | P–M | mixing and phase puzzles | **designed** ([study](subjects/matter.md), 2026-10-14, PR #324) |
| `energy-waves` | Electricity, magnets, light, sound and energy | Head Start P-SCI 1–6; NGSS 1-PS4-1/2/3/4, 3-PS2-3/4, 4-PS3-2/4, 4-PS4-1/3, MS-PS4-1/2/3, MS-PS3-2/5 (opened in study) | Light Lab, Sound Garden; Circuit Garden and Magnet Fishing existing seeds; Sound Workshop overlap | Tinker Lab if capacity permits; older destination unresolved | L–M; G, distinct entry points | lantern workshop; builder/observer co-play; reviewed page card later | designed 2026-10-14: [study](subjects/energy-waves.md), [PR #343](https://github.com/rjdunlap/neo/pull/343); [Circuit Garden and Wave Ribbon packets](../ROADMAP.md#energy-and-waves-recommendations); docs only, model/range/placement and practical-card review open |
| `body-health` | The senses, the body, food, sleep, hygiene and feelings | NGSS K-LS1, MS-LS1; health frameworks | Teddy Doctor, Feelings Faces, Pet Kitchen, Goodnight Room | Cozy Village | L–U | a family card; no tracking | not started |
| `inquiry` | Fair tests, evidence and data: predict, test, compare | NGSS science practices | Sink or Float, Photo Safari, Picture Graph | Discovery Marsh | K–M | experiment-deduction puzzle | not started |
| `genetics` | Traits, inheritance and variation | NGSS 1-LS3, 3-LS3, MS-LS3 | Critter Sort, Bug Builder | Discovery Marsh | K–M | Punnett-style cozy puzzle; needs care | not started |

### History

| ID | Subject | Anchors to open | Island games it touches | Likely zone | Audiences | G form | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `time-change` | Past, present and future; then and now; timelines | C3 D2.His (change and continuity) | Day by Day, Story Steps | Storybook Square | T–M | timeline-ordering puzzle | not started |
| `daily-life-long-ago` | Everyday life in the past: homes, food, tools, clothes, toys, across cultures | C3; UK Key Stage 1 history | Weather Wardrobe, Pet Kitchen, Market Stall | Storybook Square | P–U | spot-the-anachronism puzzle | not started |
| `deep-time` | Dinosaurs, early life, prehistory, how fossils tell us | NGSS 3-LS4, 4-ESS1; museum education | Fossil Dig (proposed) | Discovery Marsh | K–U | fossil strata puzzle | not started |
| `ancient-river-civilizations` | Egypt and Mesopotamia: farming along rivers, writing, cities | C3; museum guides | Letter Trails, Secret Code | Storybook Square | S–M | sign-decoding puzzle | not started |
| `ancient-mediterranean` | Greece and Rome: voting, building, trade, sport | C3; museum guides | Market Stall, Island Bridges | Storybook Square | S–M | mosaic and numeral puzzles | not started |
| `china-india-silk-road` | Early China and India, trade routes and inventions that travelled | C3; museum guides | Mail Carrier, Treasure Map, Market Stall | Storybook Square | S–M | trade-route puzzle | not started |
| `americas-africa` | The Maya, the Andes, West Africa, Indigenous peoples | C3; sources by the peoples concerned | None yet | undecided | S–M | **needs review** | not started; **needs review** |
| `medieval-life` | Castles, guilds, markets, monasteries (no battles) | C3; museum guides | Block Tower, Market Stall | Storybook Square | S–M | guild-market logic | not started |
| `exploration-maps` | Navigation, maps, ships and trade (acknowledging, not depicting, colonization) | C3; museum guides | Mail Carrier, Treasure Map, Peekaround Island | Skywatch Isles | S–M | navigation puzzle | not started; **needs review** |
| `inventions` | Inventors and the wheel, printing press, bulb, flight; how an idea spreads | C3; science and technology museums | Wobble Works, Gear Garden, Chain Reaction | Maker Harbor | P–M | build-the-invention puzzle | not started |
| `community-civics` | Community helpers, jobs, rules, voting, how a community runs, local history | C3 civics strand | Market Stall, Lemonade Stand, Little Helpers | Storybook Square | P–M | village-council cozy puzzle | not started |

### Technology

The island's technology today is one thread: Robot Path (sequences, counted moves, bounded loops, prediction and repair) with Secret Code and Chain Reaction nearby. Robot Path does not yet implement conditionals, variables or functions. These sessions ask what *else* belongs under technology.

| ID | Subject | Anchors to open | Island games it touches | Likely zone | Audiences | G form | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `programming` | Sequences, loops, conditions, events, functions, variables, debugging | CSTA 2026 PK–12 and historical 2017; CAL-ScratchJr trial; official ScratchJr and Kidbots guidance (opened in study) | Robot Path, Story Steps; Machine Line existing seed | Tinker Lab / Story Grove if capacity permits; Skywatch Isles remains proposed | L–M; G, distinct entry points | Parcel Programs puzzle; author/tester role swaps; reviewed puppet card later | designed 2026-10-14: [study](subjects/programming.md); [Cue Studio, Machine Line and Parcel Programs packets](../ROADMAP.md#programming-recommendations); [PR #338](https://github.com/rjdunlap/neo/pull/338); docs only, identity/ranges/placement and practical-card review open |
| `how-computers-work` | Input, output, memory, codes and binary, logic gates | CSTA; ISTE 1.1.d; Rocky's Boots and Robot Odyssey as precedents | Secret Code, Number Nook; Sorting Machine and Circuit Garden (proposed) | Tinker Lab | P–M | logic-gate and binary puzzles | in progress: `codex/how-computers-work-research`; docs-only subject study, notebook and roadmap recommendations, verification |
| `networks-citizenship` | Networks, the internet and being kind and safe online, taught with stories and unplugged games (nothing connects to a real network) | ISTE Digital Citizen; district K–5 curricula | Windy Picnic-style stories, Story Theater | Storybook Square | K–M | a conversation-prompt card | not started |
| `data-ai-literacy` | Sorting, patterns, classification, "teaching" a sorter with examples | CSTA data and analysis; AI4K12 (open at source) | Critter Sort, Picture Graph, Pattern Train | Skywatch Isles | S–M | train-a-classifier puzzle | not started |
| `engineering-design` | The design loop: ask, plan, make, test, improve; constraints | NGSS K-2-ETS1, 3-5-ETS1, MS-ETS1 | Bug Builder, Block Tower, Chain Reaction, Ferry Jam | Maker Harbor | P–M | build-and-optimize puzzle | not started |
| `machines-tools` | Everyday tools, simple machines, how things work | NGSS K-2-ETS1-2, 3-5-ETS1-3, MS-ETS1-2; Head Start; year 5 Forces (opened in study) | Seesaw Balance, Ramp Race; Gear Garden, Lift It, Mobile Maker (proposed) | Tinker Lab; Maker Harbor proposed | L–M, G | mechanism puzzles; shared moving scenes; reviewed page card | designed 2026-10-14: [study](subjects/machines-tools.md); [Gear Garden, Lift It and Puppet Workshop definitions](../ROADMAP.md#machines-and-tools-recommendations); Mobile Maker stays in Seesaw Balance; docs only, practical tool/build cards need review |
| `making-media` | Pictures, sound, animation, stories with technology: a flipbook, stop-motion, a recorded song | ISTE Creative Communicator | Pixel Pictures, Song Maker, Stamp Studio, Rainbow Fingers | Paint Pier | T–M | a shared family project | not started |
| `robots-automation` | Sensors, actions and automation in the real world: thermostat, door, traffic light | CSTA; ISTE | Robot Path, Stop and Go | Skywatch Isles | K–M | automation puzzles | not started |

### Life skills

Added after the developer asked about recipes and exercise. This group is the nearest to the youngest players: most rows start at lap or toddler.

| ID | Subject | Anchors to open | Island games it touches | Likely zone | Audiences | G form | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `cooking-recipes` | Recipes, kitchen actions, picture procedures, measuring, scaling and menu planning | Head Start P-SCI 1/3/4/5; CCSS K.CC, 3–4.NF, 6.RP; Illinois Extension, NAEYC, CDC, FoodSafety.gov (opened in study) | Pet Kitchen, Scoop Shop, Monster Munch, Fill and Dump | Cozy Village | L–M; G | pantry puzzle; shared chef/requester; reviewed page card later | designed 2026-10-14: [study](subjects/cooking-recipes.md), [PR #320](https://github.com/rjdunlap/neo/pull/320); [Recipe Workshop, Pet Kitchen measures and Picnic Pantry packets](../ROADMAP.md#cooking-and-recipes-recommendations); no games built; practical recipes/cards **need a named food-safety reviewer** |
| `movement-exercise` | Movement, dance, stretching and yoga, led by the pet and done off-screen (no camera, microphone or tracking) | WHO under-5 guidance and 2024 fact sheet; AAP toddler play; SHAPE 2024 dance indicators (opened in study) | Pet Says (freeze dance), Brain Break, Jelly Drums; Stomp Steps and Belly Breaths (proposed) | Music Mountain | L–M | a family movement card; a stretch break | designed: [study](subjects/movement-exercise.md), [PR #311](https://github.com/rjdunlap/neo/pull/311); Dance Workshop first round and [Adventure Walk / Animal Charades follow-ups](../ROADMAP.md#movement-and-family-play-recommendations) ready to define; Mirror Partners stays in Pet Says; physical prompts **need a named reviewer** |
| `routines-self-care` | Handwashing, teeth, dressing, setting the table, tidying up, sleep, getting ready in order | Head Start IT-PMP 9 / P-PMP 4; AAP routines; Sesame/NCPMI visual supports; Harvard planning guidance (opened in study) | Weather Wardrobe, Splish Splash, Goodnight Room, Day by Day; Toy Drawer and Unpack the Room (proposed) | Cozy Village | L–U | a routine-chart card | designed 2026-10-14: [study](subjects/routines-self-care.md); [Ready for Adventure, Toy Drawer and Village Planner packets](../ROADMAP.md#routines-and-self-care-recommendations); real care instructions/cards need a named reviewer; docs-only proposals |
| `social-emotional` | Feelings, turn-taking, sharing, empathy, friendship and repairing a quarrel; no moralizing or shame | CASEL's five competencies ([CASEL](https://casel.org/casel-gateway-preschool-thru-high-school-sel)) | Feelings Faces, Story Theater, Owl Walk Home; Belly Breaths (proposed) | Story Grove | T–M | conversation cards; co-op games | designed 2026-10-14: [study](subjects/social-emotional.md), [PR #321](https://github.com/rjdunlap/neo/pull/321); [Playdate Workshop, Common Ground and Two Viewpoints packets](../ROADMAP.md#social-emotional-play-recommendations); [commercial/tabletop follow-up](subjects/social-emotional.md#commercial-and-tabletop-follow-up-requested-2026-10-14), [PR #325](https://github.com/rjdunlap/neo/pull/325): A Place for You within Common Ground and existing Dream Cards ready to define; story/prop extensions stay in their games; docs-only proposals |
| `executive-function` | Working memory, impulse control, flexible rules (evidence that these transfer to other skills is mixed, so say so) | Developmental research (open at source) | Pet Says, Stop and Go, Brain Break, Memory Match; Rule Parade (proposed) | Puzzle Peaks | P–M | rule-switching puzzles | not started |
| `nature-sustainability` | Gardening, recycling and sorting, caring for animals, seasons outdoors | NGSS K-ESS3, 3-5; environmental education guides | Garden Grow, Critter Sort, Habitat Helpers | Discovery Marsh | T–M | nature-walk bingo card; compost cozy puzzle | not started |
| `visual-art` | Color, line, shape, famous painters' styles, drawing and crafts | Early-years art guidance; museum education (open at source) | Rainbow Fingers, Color Garden, Stamp Studio, Pixel Pictures; Draw a Song (proposed) | Paint Pier | L–M | art-history puzzles; a shared painting | not started |
| `music-instruments` | Instrument families, the orchestra, rhythm patterns, composers; tempo and arrangement | National Core Arts Standards; Carnegie Hall; NAEYC (opened in study) | Jelly Drums, Song Maker, Beat Builder, Rhythm Neighbors, Sing-Along Barn, Sound Garden | Music Mountain if capacity permits; older placement unresolved | L–M; G | Hat Band arrangement puzzle; shared leader/listener; reviewed page card later | designed 2026-10-14: [study](subjects/music-instruments.md), [PR #340](https://github.com/rjdunlap/neo/pull/340); [Little Conductor, Song Maker and Hat Band packets](../ROADMAP.md#music-and-instruments-recommendations); Sound Workshop later; docs-only proposals |
| `geography-cultures` | Maps of home and the world, continents, habitats, foods, clothing, festivals | C3 geography strand; sources by the peoples concerned | Mail Carrier, Treasure Map, Peekaround Island | Skywatch Isles | P–M | map puzzles; recipes from the world | not started; **needs review** |
| `safety` | Road, water and fire safety first; body safety later and only with an expert | Safety organizations; a pediatric or child-protection reviewer | Crossing Guard (proposed), Stop and Go | Cozy Village | K–S | a family safety card | not started; **needs an expert reviewer** |
| `money-economy` | Needs and wants, saving, trade, fairness (a check of what Lemonade Stand and Maker Harbor already cover) | Financial-education frameworks (open at source) | Market Stall, Lemonade Stand, Maker Harbor (proposed) | Maker Harbor | P–M | household-budget cozy puzzle | not started |
| `off-screen-companions` | The off-screen activity for each game, for the grown-ups' page: what a parent and child do with a real jar, a wooden spoon or a song | WHO on caregiver time; early-years play guidance | Every game's `offScreen` field | the grown-ups' page | L–U | the whole point; plain HTML | **designed** ([study](subjects/off-screen-companions.md), 2026-10-14, PR #322) |

## Suggested order (non-binding)

The long horizon is real, but the nearest rungs serve a one-year-old, so the order starts there.

- **A. The youngest and the family:** `movement-exercise`, `routines-self-care`, `cooking-recipes`, `social-emotional`, `off-screen-companions`.
- **B. Closest to what is built:** `weather-water`, `matter`, `life-science`, `programming`, `music-instruments`.
- **C. A gap in the catalog is wide here:** upper school and early-teen content (`space`, `energy-waves`, `how-computers-work`, `inventions`, `data-ai-literacy`, `time-change`) and parent puzzles.
- **D. Everything else** in any order. `americas-africa`, `exploration-maps`, `geography-cultures` and `safety` wait for a reviewer decision.

## Decisions for the developer

- **Is there a middle band?** The `school` band is 6 to 12 and `grownup` starts at 13, and [the family review](../FAMILY-EXPERIENCE.md) already says a tween band is a separate decision with a migration audit. This plan answers it for *content* (the M audience) but not for *routing*. Options: stretch `school`'s top levels to 14; add a band around 10 to 14; or let 13+ play grown-up puzzles earlier. Lean: write the M answers in the sessions first, then decide with real candidates in hand.
- **Who reviews what?** Sensitive history, food safety for toddlers, pediatric movement and child safety each need a named reviewer before any card is printed or any line is spoken. Until then those sessions record questions only.
- **Is there a history zone?** The roadmap's zones already host most of these; a dedicated time-travel place is possible. Decide after the first two history sessions.
- **How much grown-up content?** The island's grown-up shelf is 11 puzzles; every session now proposes more. A parent's play, play-with and page tool may each want a different home (Lantern Lake, the family table, the grown-ups' page).

## What was built

No game implementation from these sessions. Thirteen subjects are researched: [Movement/exercise](subjects/movement-exercise.md), [weather/water](subjects/weather-water.md), [routines/self-care](subjects/routines-self-care.md), [cooking/recipes](subjects/cooking-recipes.md), [social-emotional play](subjects/social-emotional.md), [off-screen companions](subjects/off-screen-companions.md), [matter](subjects/matter.md), [machines/tools](subjects/machines-tools.md), [life science](subjects/life-science.md), [space](subjects/space.md), [programming](subjects/programming.md), [music/instruments](subjects/music-instruments.md) and [energy/waves](subjects/energy-waves.md) are researched (2026-10-14); their linked roadmap packets name the next definitions. Physical prompts, practical care and real recipes/cards retain their reviewer dependencies. Other subjects remain as marked in the tracker; waves A and B are complete; wave C has space and energy/waves researched and `how-computers-work` next, unless the grown-up names another. Docs only: links and `git diff --check`.
