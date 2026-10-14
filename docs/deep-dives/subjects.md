# Subject deep-research sessions: other sciences, history and technology

**Requested by the developer, 2026-10-14:** add research sessions for the sciences beyond physics, for a range of history subjects, and for technology (could it expand beyond coding?). These sit beside the per-game [deep dives](README.md): a game deep dive researches one built game; a **subject session** researches one subject and returns candidates, modes for existing games, and a ladder for one first game. Physics already has [its own plan](../PHYSICS-GAMES.md).

**A subject session is research and ideation only: documents, no code**, with the same rule as a game deep dive (nothing under `src/`, `scripts/` or `public/`; no tests; do not build a slice, however small). The roadmap's chunk 28 points here. Nothing below is built, scheduled or promised; the shelf is for deciding what is worth building and in what order. The long-term direction reaches about age eleven ([Later horizons](../ROADMAP.md#later-horizons-elementary)); she is about one, so these are long-horizon plans and must not delay the nearer waves.

## The procedure (one session, one subject)

1. **Claim it.** Fetch `origin`, run `scripts/overlap.sh <subject-id> docs/deep-dives/subjects/<subject-id>.md`, check this table and open pull requests. Make the first commit a docs-only claim (set the row to **in progress**) and publish a draft pull request straight away.
2. **Read what is there.** The subject's rows in [IDEAS.md](../IDEAS.md) (grep the game names below), [GAMES.md](../GAMES.md) for the built games it touches, the [gap table](../IDEAS.md#gaps-in-the-catalog), the [roadmap's zone concepts](../ROADMAP.md#zone-concepts) and the [rules for every activity](../../AGENTS.md#rules-for-every-activity).
3. **Find the curriculum anchors.** The official standards by grade band (NGSS for science, the C3 Framework and national or state history standards for history, CSTA and ISTE for technology), opened at their source. Record which codes you actually opened. A standard is a guide, never a gate.
4. **Find what children can do and understand at each age.** Developmental research or teacher guidance, with the caveat when it is thin. Record a gap as a gap.
5. **Research five to ten similar games or apps**, plus a physical or unplugged equivalent. For each note how its progression grows, what to borrow, and what Puddle Island must leave out (timers, lives, streaks, ads, purchases, shame, scarcity). Open the source; mark anything recalled.
6. **Check fit with the island.** Which ideas fit the rules; which belong to an existing game as a mode (prefer that when the action is the same); what needs new infrastructure; which land or zone would hold it. Run the same test on every idea: *a fun action with a clear learning purpose*.
7. **Write it up** as `docs/deep-dives/subjects/<subject-id>.md` from the template below, ending with an ordered list of build slices, each sized for one session. Then update the tracker row, the idea notebook's candidate table and the roadmap, and add a short VERIFICATION entry (docs only).

### Template

*Subject, ID, bands, date, session.* **Anchors** (standards opened, with codes) · **What children can do** (by age, with caveats) · **On the island today** (built games, notebook rows, gaps) · **Similar games and apps** (table: game, kind, how progression grows, borrow, leave out) · **What fits** (and what does not, and why) · **Candidates** (table: name, fun action, learning goal, bands, effort, new infrastructure) · **A first game's ladder** (levels, first rounds, what she decides, mistakes and hints, a rule test, cost) · **Experience and presentation** (the first unsupported action, touch-down feedback, replay variety) · **Decisions for the developer** · **Build slices, in order** · **What was built**: nothing; say what ran.

### Ground rules for the history sessions

History is the subject most likely to need care. Every session must write down, before proposing anything:

- **No violence as the fun.** No conquering, battles, weapons play or points for winning wars. When a history involves war, enslavement, displacement or genocide, say how it is acknowledged for the age (often by not depicting it at all in a young band) and put the depth question under *Decisions for the developer*.
- **No pretending to authority.** Indigenous and living cultures, religion and contested events need sources written by the people concerned or by recognized museums and educators, and may need review by someone from that community before anything ships. Mark an idea *needs review* rather than drafting a stereotype.
- **Everyday life before dates.** The early bands learn *then and now*, before and after, long ago, changes in homes, food, tools and toys. Dates, centuries and named leaders are for school-age bands, and the island never needs a child to read.
- **Evidence over trivia.** Prefer sorting, ordering, comparing two sources and asking what changed over quizzes of facts. A rule test can check ordering and consistency; it cannot check historical truth, so a human review is a named step.

## Tracker

Status values as in the [game tracker](README.md#tracker): **not started**, **in progress**, **designed**, **building**, **done**. Bands: L lap, T toddler, P preschool, K pre-K, S school (about 6–8, up to 12), G grown-up. Zones are the [roadmap's working proposals](../ROADMAP.md#zone-concepts).

### Sciences

| ID | Subject | Anchors to open | Island games it touches | Likely zone | Bands | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `life-science` | Animals and plants: needs, parts, life cycles, habitats and food chains | NGSS K-LS1, 1-LS1/3, 2-LS2, 3-LS (check codes) | Habitat Helpers, Garden Grow, Photo Safari, Animal Snack; Caterpillar Week (proposed), Fossil Dig (proposed) | Discovery Marsh | P–S | not started |
| `ecosystems` | Ecosystems, food webs, adaptation, populations (grades 3–5) | NGSS 3-LS, 5-LS2 | Habitat Helpers (a later mode), Critter Sort | Discovery Marsh | S | not started |
| `earth-materials` | Rocks, soil, minerals, fossils, landforms, erosion | NGSS 2-ESS, 4-ESS1/2 | Fossil Dig (proposed), Sand Table (proposed), Mole Mine | Discovery Marsh | K–S | not started |
| `weather-water` | Weather, the water cycle, seasons and climate | NGSS K-ESS2/3, 3-ESS2 | Weather Wardrobe, Day by Day, Lemonade Stand, Garden Grow | Discovery Marsh | T–S | not started |
| `space` | Sun, moon, stars, planets, seasons and day length | NGSS 1-ESS1, 5-ESS1 | Light Lab, Moon Window (proposed), Skywatch Isles | Skywatch Isles | K–S | not started |
| `matter` | States of matter, mixing, materials and changes (solid, liquid, gas; dissolving) | NGSS 2-PS1, 5-PS1; PhET States of Matter | Fill and Dump, Pet Kitchen, Water Paths and Sand Table (proposed) | Tinker Lab | P–S | not started |
| `energy-waves` | Electricity, magnets, light and sound (circuits, vibration) | NGSS 1-PS4, 3-PS2, 4-PS3, 4-PS4 | Light Lab, Sound Garden, Magnet Fishing and Circuit Garden (proposed) | Tinker Lab | P–S | not started |
| `body-health` | The senses, the body, food, sleep, hygiene and feelings | NGSS K-LS1, health frameworks | Teddy Doctor, Feelings Faces, Pet Kitchen, Goodnight Room | Cozy Village | T–S | not started |
| `inquiry` | Fair tests, evidence and data: predict, test, compare, record | NGSS science practices | Sink or Float, Photo Safari, Picture Graph | Discovery Marsh | K–S | not started |

### History

| ID | Subject | Anchors to open | Island games it touches | Likely zone | Bands | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `time-change` | Past, present and future; then and now; family and personal timelines; building a timeline | C3 Framework D2.His (change and continuity); a national early-years history guide | Day by Day, Story Steps, Day-by-Day's weekday model | Storybook Square | T–S | not started |
| `daily-life-long-ago` | Everyday life in the past: homes, food, tools, clothes and toys, across cultures | C3 and UK Key Stage 1 history | Weather Wardrobe, Pet Kitchen, Market Stall | Storybook Square | P–S | not started |
| `deep-time` | Dinosaurs, early life and prehistory; how fossils tell us | NGSS 3-LS4, 4-ESS1; museum education | Fossil Dig (proposed) | Discovery Marsh | K–S | not started |
| `ancient-river-civilizations` | Egypt and Mesopotamia: farming along rivers, writing, cities | C3; museum guides | Letter Trails (writing), Secret Code (signs) | Storybook Square | S | not started |
| `ancient-mediterranean` | Greece and Rome: voting, building, trade and sport | C3; museum guides | Market Stall, Island Bridges | Storybook Square | S | not started |
| `china-india-silk-road` | Early China and India, trade routes and the inventions that travelled (paper, compass, silk) | C3; museum guides | Mail Carrier, Treasure Map, Market Stall | Storybook Square | S | not started |
| `americas-africa` | The Maya, the Andes, West Africa and Indigenous peoples | C3; sources by the peoples concerned | None yet | undecided | S | not started; **needs review** by a knowledgeable community before drafting |
| `medieval-life` | Castles, guilds, markets and monasteries (no battles) | C3; museum guides | Block Tower, Market Stall | Storybook Square | S | not started |
| `exploration-maps` | Navigation, maps, ships and trade (acknowledging, not depicting, colonization) | C3; museum guides | Mail Carrier, Treasure Map, Peekaround Island | Skywatch Isles | S | not started; **needs review** |
| `inventions` | Inventors and the wheel, the printing press, the bulb and flight; how an idea spreads | C3; science and technology museums | Wobble Works, Gear Garden and Chain Reaction | Maker Harbor | P–S | not started |
| `community-civics` | Rules, voting, jobs and how a community runs; local history | C3 civics strand | Market Stall, Lemonade Stand, Little Helpers | Storybook Square | P–S | not started |

### Technology

The island's technology today is one thread: Robot Path (sequences, loops, conditions) with Secret Code and Chain Reaction nearby. These sessions ask what *else* belongs under technology, and whether it earns its place.

| ID | Subject | Anchors to open | Island games it touches | Likely zone | Bands | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `programming` | Beyond the first routine: sequences, loops, conditions, events, functions, variables and debugging | CSTA K-2 and 3-5 (the search did not return the benchmarks; open them at source); ScratchJr, Lightbot (20 puzzles across basics, procedures and loops by the app's own count), Kodable | Robot Path, Secret Code | Skywatch Isles | K–S | not started |
| `how-computers-work` | Input, output, memory, codes and binary, logic gates | CSTA; ISTE 1.1.d (understand how technology works); Rocky's Boots and Robot Odyssey as precedents | Sorting Machine and Circuit Garden (proposed), Secret Code, Number Nook | Tinker Lab | P–S | not started |
| `networks-citizenship` | Networks, the internet and being kind and safe online, taught with stories and unplugged games (nothing connects to a real network) | ISTE Digital Citizen; district K–5 curricula | Windy Picnic style stories, Story Theater | Storybook Square | K–S | not started |
| `data-ai-literacy` | Sorting, patterns and classification; "teaching" a sorter with examples and seeing where it errs | CSTA data and analysis; AI4K12 (open at source) | Critter Sort, Picture Graph, Pattern Train | Skywatch Isles | S | not started |
| `engineering-design` | The design loop: ask, imagine, plan, make, test, improve; materials and constraints | NGSS K-2-ETS1, 3-5-ETS1 | Bug Builder, Block Tower, Chain Reaction, Ferry Jam | Maker Harbor | P–S | not started |
| `machines-tools` | Everyday tools, simple machines and how things work (a vehicle, a clock, a lock) | NGSS K-2-ETS1; Tinybop Simple Machines | Seesaw Balance, Ramp Race; Lift It (proposed) | Maker Harbor | P–S | not started |
| `making-media` | Making pictures, sound, animation and stories with technology: a flipbook, a stop-motion, a recorded song | ISTE Creative Communicator | Pixel Pictures, Song Maker, Stamp Studio, Rainbow Fingers | Paint Pier | P–S | not started |
| `robots-automation` | Sensors, actions and automation in the real world: thermostat, door, traffic light | CSTA; ISTE | Robot Path, Stop and Go | Skywatch Isles | K–S | not started |

## Suggested order (non-binding)

- **A. Closest to what is built:** `weather-water`, `matter`, `life-science`, `programming`.
- **B. New ideas with a clear first game:** `time-change`, `space`, `how-computers-work`, `energy-waves`, `inventions`.
- **C. Everything else** in any order. `americas-africa` and `exploration-maps` wait for a decision on review (see *Decisions* below).

## Decisions for the developer

- **Who reviews the sensitive history subjects?** Indigenous cultures, living religions and colonization should not be drafted without a reviewer; until there is one, those sessions record questions rather than game ideas.
- **Is there a history zone?** The roadmap's zones (Storybook Square, Discovery Marsh, Skywatch Isles, Maker Harbor) already host most of these, but a dedicated time-travel place is possible. Decide after the first two history sessions.
- **How much of this is wanted before she is old enough to use it?** The sessions are research, so cheap, but each adds candidates that compete with nearer waves; the roadmap's order governs.

## What was built

Nothing. This page is the plan; no session has run. Docs only: links and `git diff --check`.
