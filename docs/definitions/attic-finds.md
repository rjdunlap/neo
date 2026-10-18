# Attic Finds, levels 1–2 (definition)

Defined 2026-10-18 as slice **H1** of the [everyday-life-long-ago study](../deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/daily-life-long-ago.md#first-games-proposed-ladder-attic-finds), the [time/change study's bounded follow-up](../deep-dives/subjects/time-change.md#attic-finds-a-bounded-follow-up) (T5; this is the one shared definition, not a second game) and the [IDEAS rows](../IDEAS.md#candidates). Docs only: no game, ID registration, voice line or save field exists yet. **Ready to build:** every open call below has a default the build can use. Everything in it is fictional island make-believe, so no historian is needed before this slice; the study's reviewer decisions gate only later real-object content.

**Fun action and purpose:** an unfamiliar thing sits on the attic floor with a big crank on its side. She turns it over, peers at its worn and painted parts through a magnifier, cranks it, and the thing comes alive: a wooden bird bobs up out of its box, a tin fish bobs in its jar. Then she picks the picture of what it did, and at level 2 she points at the part that **proves** the crank does it (the rod behind, not the painted star). The learning goal is **reading an object**: look before guessing, try it and watch, and connect one visible clue to what the thing does. It is cause and effect at preschool and the first step of object evidence at pre-K and school; no historical date, culture or "old versus new" is claimed or shown.

## References

None was played; pages and documents were read. The study's own [similar-games table](../deep-dives/subjects/daily-life-long-ago.md#similar-games-and-apps) (Unpacking, Assemble With Care, A Little to the Left, Hidden Folks, Storyteller) still applies; these add the inspect-and-try shape.

| Reference | What it shows | What Attic Finds takes or rejects |
| --- | --- | --- |
| [Pitt Rivers Museum, *Learning from Objects*](https://prm.web.ox.ac.uk/sites/default/files/prm/documents/media/learningfromobjects.pdf) (Key Stage 2 handling session) | Pupils handle mystery objects and work out what each is for; the follow-up brings objects into the classroom to see whether others can work out their use | **The shape of a round:** look, handle, try, then say what it does. Rejects writing, worksheets and real objects: the island's things are invented and nothing is handled off screen |
| [Kingston Museums, *ArtiFACT or Fiction* mini-book](https://www.kingstonmuseums.ca/sites/kingstonmuseums.ca/files/files/March%20of%20the%20Museums%20Activity%20Booklet%202022.pdf) (family activity) | Families pick which of three stories about an object is true | Level 1's two pictured answers after a trial. Rejects three written stories and a right answer she cannot test: here the object itself shows the answer when cranked |
| [Age of Revolution, *Mystery objects*](https://ageofrevolution.org/wp-content/uploads/2018/10/Mystery-objects.pdf) (ages 7–14) | Teams invent plausible uses for an object image and others guess the real one; labels are matched to objects | The idea that a wrong guess is good thinking, not a failure (free predictions). Rejects the bluffing game and image-only objects: every object here can be turned and cranked |
| [Metamorphabet](https://apps.apple.com/app/id858010121), Vectorpark ([SLJ review](https://www.slj.com/story/playing-with-the-alphabet-metamorphabet-touch-and-go)) | Poking, prodding, dragging and spinning a letter transforms it; the toy rewards touching everything | The first unsupported action is touching the object, and every touch answers (a lid lifts, the crank clicks). Rejects a toy with no question: the trial and the pick give the looking a purpose |
| [Sago Mini Toolbox](https://www.commonsensemedia.org/app-reviews/sago-mini-toolbox), Sago Mini (ages 2–4) | Eight tools on fifteen scripted projects; a saw works by rubbing or tapping, and imperfect aim still works | Forgiving tool input: a tap on the crank turns it a full turn, a rub turns it too. Rejects the scripted "tool where the arrow points": here she chooses where to look and what to try |
| [Simple Machines](https://apps.apple.com/us/app/-/id936966570), Tinybop ([SLJ](https://www.slj.com/story/sandbox-science-on-the-ipad)) | Alter a machine and test it; the handbook carries the explanation, the scene carries the experiment | Try first, explain after, in the pet's voice. Rejects six machine types and any mechanism building: Attic Finds inspects a finished object (building a crank scene is [Puppet Workshop's](../deep-dives/subjects/machines-tools.md#build-slices-in-order)) |
| [NPS, *What is that used for?*](https://www.nps.gov/teachers/classrooms/what-is-that-used-for.htm) (the study opened it) | Artifact investigation moves from observation to comparison to explanation | Level 2's evidence question ("which part shows it?") before any comparison; steps 3–7 of the study's ladder add comparison and sources later |

## Overlap

- **Puppet Workshop** and **Gear Garden** (machines/tools study) build and transmit motion; Attic Finds never assembles anything, and its crank's linkage is authored and fixed. If Puppet Workshop is built, its bobbing bird must be a different drawing from this one, and neither game takes the other's ID.
- **Quick Tricks'** proposed *Wind the Music Box* is a gesture trick with a finale; Attic Finds has no gesture test and no circle-tracing, a tap on the crank is a full turn.
- **Photo Safari** finds a described thing in a scene; **Teddy Doctor** taps parts of one body. Attic Finds borrows Teddy Doctor's nearest-target touch resolution for clue spots on one large object, and nothing from Photo Safari's scenes.
- **Sink or Float** owns unpenalized predictions; level 1's trial cards follow that rule exactly (a prediction is never a miss).
- **Peekaboo Barn** opens doors to reveal animals; the fish churn's little door is a clue spot that opens, not a peekaboo game, and no animal hides behind it.
- **Timeline Trail / Island Archive** (time/change) own order and dates; **Unpack the Room** owns arranging; **Story Steps** owns sequencing. Attic Finds shows no date, timeline or room.
- **Lift It** (defined) is force and distance on a pulley; the crank here lifts nothing heavy and no paw count appears.
- No shipped game inspects an object by turning it over. A later music box, lantern or churn is Attic Finds content, never a new registration.

## The model

- **An object** is an authored record: `id`, two **sides** (`front`, `back`), a `crank` on the front, an `effect` the crank causes, three **clue spots** and the pet's line for each. Each clue spot has a `side`, a position in that side's drawing, a spoken description and a `supports` set of claim IDs.
- **Effects** are `bob` (a part rises and falls while the crank turns) and `roll` (the object travels along the shelf). Each crank turn is four notches; the effect plays once per turn, for 1.2 s, and can be replayed by cranking again at any time.
- **Claims** are pictured sentences. This slice uses one, `crank-moves`: "the crank makes the {part} bob" (crank icon, arrow, the part with up-and-down arrows). The study's later steps add `opens`, `hand-turned` and source claims.
- **The evidence predicate:** `supports(clue, claim)` is `claim ∈ clue.supports`. A clue entails a claim only through a visible link in the model: the rod joint supports `crank-moves` because the drawing shows the crank's shaft pushing the rod that holds the bird. Paint supports nothing. A worn handle supports `hand-turned` (unused in this slice) and not `crank-moves`.
- **The two first-build objects:**

  | Object | Front (what she sees first) | Back (after Turn) | Effect | Clue spots and what each supports |
  | --- | --- | --- | --- | --- |
  | `bird-box` | A square wooden box with a lid, a crank on its right side, a painted yellow star on its face | The back panel is open: a bent rod runs from the crank's shaft up to the bird's perch | `bob`: the bird rises out of the lid and sinks back | star (front): `{}`, "That's paint. A pretty star." · handle (front): `{hand-turned}`, "The handle is shiny where paws held it." · rod joint (back): `{crank-moves}`, "The crank's shaft pushes this rod. The rod holds the bird." |
  | `fish-churn` | A tall green jar with a crank on its lid, a little door with a hook low on the front, a tin fish seen through the glass | The back shows the rod going down from the crank through the lid to the fish | `bob`: the fish bobs up and down in the jar | door (front): `{opens}`, "A little door with a hook. It opens, but nothing moves it." · handle (front): `{hand-turned}` · rod joint (back): `{crank-moves}`, "The crank turns this rod. The rod holds the fish." |

  Both objects share the motion under different dress on purpose, as the study asks: the second object shows that the same hidden rod explains the same bob. A rolling third object is [decision 6](#open-decisions).
- **A round** is two **encounters**, one per object, in a seeded order. An encounter seeds the starting side (front or back), the detail window's clue arrangement (a permutation of three), and which trial card is left (`bob` or `roll`). The causal rules, effects and clue supports never vary with the seed.
- **The trial cards** are always the pair `{bob, roll}` as two pictures of this object doing each: the bird bobbing out of its box, or the box rolling along the shelf on little wheels it does not have. Exactly one matches `effect`.

## Screen and controls

- **Landscape (1024×768 design area):** the attic: a slanted roof line, a round window top-right, a **shelf** across the top (found objects land there, left to right), and the object on a rug at the center, about 420 units tall, drawn from its current side. The pet is the corner guide, bottom-left, with 150 units kept clear. All targets are at least 100 logical units after scaling.
- **Turn** (104-unit round button, right of the object, an arrow curling around a box): the object flips to its other side in 0.4 s with a wooden knock; its clue spots swap to that side's. Pressing again flips back. Free, any time.
- **The crank** (a 110-unit handle on the object): a tap turns it one full turn (four clicks); a rub along it turns it too. The effect plays with the turn. Free, any time, including during feedback.
- **Clue spots** (three per object, 100-unit circles placed on the drawing, nearest-spot resolution when two are close; a spot on the hidden side is not tappable until Turn shows it): a tap opens the **detail window**, a 300-unit round magnifier at top-right of the object showing that spot large, with the pet's line spoken. Tapping another spot moves the window; tapping anywhere else closes it. A spot she has opened once gets a small tick, which is bookkeeping, never a score.
- **Trial cards** (level 1; two 130×130 pictured cards in a strip bottom-right, out of the pet's corner): tapping one is a prediction. The card lifts, the crank turns by itself one full turn, the object does its real effect, and the pet names it ("It bobbed!"). Then the question turns to **"Which one happened?"** on the same two cards (a small tick badge appears on each): a tap picks. Both stay tappable to try again.
- **Claim card and Check** (level 2; the claim card, 300×130, sits above the object with an empty 110-unit **clue slot** on its right; **Check**, a 104-unit green button, sits beside the slot and is dim until the slot holds a clue): the three **clue chips** (100-unit round thumbnails of the three spots) sit in a row under the claim card. A chip she has not looked at yet shows a "?"; tapping it opens that spot's detail window instead of choosing it (turning the object first if the spot is on the hidden side). A looked-at chip is dragged (`src/engine/drag.ts`) or tapped then slot-tapped into the slot; a chip in the slot can be swapped freely. Check submits.
- **Portrait:** the shelf stays at the top, the object sits in the upper middle, the trial cards or the claim card and chips move to a row beneath it, Turn stays at the object's right, and the pet keeps its corner. `atticLayout(view, level)` returns every rectangle and a test asserts the sizes at the four views.
- **Shelf and finish:** a found object shrinks onto the next shelf spot with a chime; the second object then slides in from the side. When both are shelved the bird and fish both bob together once and the round finishes.
- **Sound and music:** synthesized wooden clicks per crank notch (`sfx`), a rising pentatonic pair for the bob, a soft knock for Turn, a chime for the shelf; the land's music keeps playing (not `silenced`, nothing here makes music).

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Try it** | preschool, pre-K | Which side to look at, which clues to open, which trial to run first, and which card shows what happened | Both objects shelved after a matching pick each |
| 2 | **Show the clue** | pre-K, school | Which clue to put in the claim's slot, when to Check, and whether to Turn or crank again first | Both objects shelved after a supported Check each |

Steps 3–7 of the study's ladder (Same need, Context, Two sources, What can we tell?, Mend the exhibit) are later definitions (H4, H5) appended above 2; the lap/toddler opening A is H3 and goes below 1 with `order` so a saved level never shifts.

### First rounds

- **Level 1, encounter 1 (bird-box, front, star left of handle, `bob` card on the left):** the pet: "Something's in the attic! What does it do? Look all over, then try it." The crank sits in plain view. If nothing is touched for 6 s the crank wiggles once (an invitation, never a hint). Tapping the star opens the window: "That's paint. A pretty star." Turn shows the rod. Tapping the `roll` card: the card lifts, the crank turns, the bird bobs, "It bobbed!"; the cards ask "Which one happened?"; tapping `bob` shelves the box with a cheer. Encounter 2 is the fish churn, starting on its back.
- **Level 2, encounter 1 (fish-churn, front):** the claim card shows the crank, an arrow and the fish with up-down arrows; the pet: "The crank makes the fish bob. Show me the part that proves it." The three chips show "?" until looked at. Tapping the door chip opens the door spot ("A little door with a hook. It opens, but nothing moves it."); dragging it to the slot and pressing Check: the door jiggles, nothing else moves, "The door opens, but it doesn't move the fish," one miss. Turn, tap the rod joint, drag its chip in, Check: the rod lights, the crank turns, the fish bobs with the rod pushing it, "The rod! The crank turns the rod, and the rod moves the fish." Shelf. Encounter 2 is the bird box.

## Accounting, help and finishing

- **Never a miss:** turning, cranking, opening any clue, repeating the instruction, a trial card (a prediction), swapping a chip in the slot before Check, pressing Check with an empty slot (the slot wiggles and the pet repeats "Put a clue here first," nothing counted), repeated taps during feedback (ignored), or a pick/Check repeated after the encounter is already done.
- **Level 1 records no misses.** A wrong "Which one happened?" pick gets the gentle boing, the crank turns by itself and the object does its effect again while the pet names it; the pick stays open. After two wrong picks on one object the matching card glows and `hints++` once for that object. Adaptation at level 1 therefore moves only through hints ([decision 2](#open-decisions)).
- **A miss (level 2):** a Check whose slotted clue does not support the claim. The response is specific and visible: the chosen part does what it does (the door jiggles, the star shimmers, the handle gleams) and nothing else moves, with the pet's reason; the chip returns to its row. After two misses on one claim the supporting clue's chip glows (and, if its spot is on the hidden side, Turn glows until the object is turned) and `hints++` once for that claim.
- **Show a hint** in the pause sheet (`Scene.pauseActions`): at level 1 the crank turns by itself and the pet names the effect; at level 2 the glow above. Each request counts `hints++` at most once per object or claim; asked again on the same one it only repeats the words. Start again rebuilds the same seeded round and keeps misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` after both encounters, with or without help: one ordinary sticker from the shell. No creation, discovery or journal entry is filed in this build ([decision 5](#open-decisions)).

## Rule tests (`logic.test.ts`)

- **Objects:** each has exactly two sides, a crank on the front, an effect in `{bob, roll}`, exactly three clue spots with distinct IDs, and a spoken line per spot; every clue's `supports` names only known claim IDs.
- **Evidence:** for `crank-moves` every object has **exactly one** supporting clue, and it sits on the `back` side (so Turn is part of the proof in this slice); every other clue's `supports` excludes it; `supports` is a pure lookup (the same answer every call, no state).
- **Trials:** the offered pair is always `{bob, roll}`; exactly one card equals the object's effect; `outcome(object, card)` returns the object's real effect for both cards (a prediction never changes what happens).
- **Rounds:** for every plan over 500 seeds, two encounters with distinct objects, each a valid start side, a permutation of its three clues and a card order; the same seed gives the same round; both objects appear first across the seeds.
- **Hints:** `glowTarget(object, 'crank-moves')` is the supporting clue, and following it finishes the encounter; at level 1 the glowed card equals the effect.
- **Accounting:** a scripted encounter at level 2 with door, star, rod produces misses 2, hints 1; a second request for help on the same claim leaves hints at 1; at level 1 any sequence yields misses 0.
- **Layout:** `atticLayout` at the four views for both levels: every target ≥ 100 units, the pet's corner clear, the detail window inside `view`, the shelf's two spots inside `view`.
- **Registry, lands and how-to tests** pass with the new game, including Story Grove still fitting on one screen at every band with a tenth game.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` at level 1: tap one front clue spot (window opens), tap away, tap Turn, tap the rod spot, tap the `roll` card (watch the bob), then tap the `bob` card. At level 2: tap the "?" chip of a front clue (window), tap Turn, tap the rod chip (window), drag the rod chip to the slot, tap Check. It never submits an unsupported Check. The same bot drives the scripted play, and its first level-1 trial is deliberately the wrong prediction so the demonstration shows that a guess costs nothing.
- **How-to card** (`src/content/howto.ts`). Goal: "Look an attic thing over, turn it and crank it, then show what it does."
  - Steps: "Tap the parts to see them up close. Tap Turn to see the back" (all levels); "Tap a picture to try it. Watch what really happens" `{ from: 1, to: 1 }`; "Then tap the picture of what it did" `{ from: 1, to: 1 }`; "Drag the part that proves the crank moves it into the card's slot, then tap Check" `{ from: 2, to: 2 }`; "Crank it again any time to watch" (all levels).
  - Finish: "Both things sit on the shelf."
  - Notes: "Looking, turning and trying are never counted against her" (all levels); `{ from: 1, to: 1 }`: "A guess before the crank turns is never a miss; after two wrong picks the right picture glows, which counts as a hint"; `{ from: 2, to: 2 }`: "A Check with a part that does not move the bird or fish counts as a miss; after two the right part glows, which counts as a hint"; and always: "Everything in the attic is made up for the island; nothing here is a real old thing."
- **Voice lines** under `attic-finds.*`: `intro`, `instruct-try` (1), `instruct-prove` (2), `which-happened`, `bobbed`, `rolled` (for a later roller), `clue-star`, `clue-handle`, `clue-rod-bird`, `clue-rod-fish`, `clue-door`, `not-that` (with `{part}`), `empty-slot`, `proved` (with `{part}`), `shelf`, `hint-watch`, `hint-glow`, `done`. `{pet}` is optional in each.
- **Registration:** ID `attic-finds`, name "Attic Finds", spoken title `game.attic-finds`. Region (subject) `story-grove` by default ([decision 4](#open-decisions)). Skills `['observation', 'cause-and-effect', 'evidence', 'prediction']` (free strings; `evidence` is new). Bands: preschool 1–1, pre-K 1–2, school 2–2 ([decision 1](#open-decisions)). Home land **Story Grove** by default (9 games today, 10 with this one; [decision 3](#open-decisions)). Hub icon: a wooden box with a crank and a bird peeking out. Sticker: a seeded attic find (the bird or the fish) on a shelf.
- **Co-play:** one person cranks, the other finds the clue; at level 2 both say which part they would pick before Check. **Off-screen** (optional, the study's wording review still applies before any printed card): with a willing grown-up, look at one ordinary thing already in the home that has a handle or a lid, and say what it is for; "I don't know" is a fine answer. No antiques, no taking anything apart.
- **Couch:** none. Nothing here suits a controller face-off.
- **Rework couplings:** none required and nothing saved. The shelf is a natural source of home items for [RW06](../rework/WORK-ITEMS.md#rw06-playable-home-and-customization) (a found bird box in the treehouse) and of pages for the [RW10](../rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) collection book; both are the rework's to define, and a found object must then be a permanent possession, never something that is lost, wears out or waits.

## Check tier

New-game tier. Typecheck and unit tests (the rule properties above plus registry, lands and how-to tests). One scripted play through a new `browser-check.mjs` case (its README row is part of the build), filtered to level 1 and level 2, with one wrong prediction, one wrong pick, one unsupported Check and one requested hint; one portrait screenshot at level 2 with the detail window open. `fingerdemo` at both levels, since the level-2 bot must turn, open a chip and drag it. `npm run build`, because the registry, lands, voice and how-to files change.

Device checks stay open: whether a three-year-old reads the crank as "turn me" and the Turn button as "flip it over" on an iPad; whether the back-side rod reads as "connected to the bird" at the drawn size; device speech of the clue lines.

## Open decisions

Each has a default the build uses. None blocks it. The study's decisions 1–2 (fictional scope and younger finish; placement and windows) are settled here as defaults.

1. **Bands.** Default preschool 1, pre-K 1–2, school 2 (a one-level school window until H4 appends 3–4). Alternative: leave school out until H4 lands. The lap/toddler opening A (giant handle, three activations, free finish) is H3 and is not in this build.
2. **Accounting.** Default: level 1 records no misses, so adaptation there moves only through hints, as the study asks for observation-only steps; level 2's unsupported Check is a miss. Alternative: no misses at pre-K either, counting only from school.
3. **Home land.** Default Story Grove (10 with this game), the study's destination. Alternatives: Treehouse (4 games; an attic above the treehouse is the natural scene, and the shelf would sit beside RW06's home) or Tinker Lab (14th game; its capacity at every band is the question).
4. **Region (subject).** Default `story-grove`. Alternative `tinker-lab` if the developer reads it as a mechanism game rather than an evidence game; `REGION_IDS` has no history subject and this slice does not add one.
5. **Journal.** Default: no discovery filed. Alternative: file "a crank turns a rod inside" once level 2 has shown the rod proving it, as Seesaw Balance files only what a round showed.
6. **A third object.** Default: not in the first build. Alternative: a wheeled hen whose crank makes it `roll` along the shelf, so level 1's pick is not always `bob`; it needs the roll animation and a third round order, and is content, not a new level.
7. **Real objects.** Default: none; the attic stays invented, and the speech and card say so. Any real tool, toy or source waits on the study's decisions 3–5 (named historian, located packet, treatment of labor and harm) and is a separate content slice.
