# Puppet Stage, levels 4–6: story cards and the premiere (definition)

Defined 2026-11-03 as slice 3 of the [theatre-and-puppetry study](../deep-dives/subjects/theatre-puppetry.md#build-slices-in-order) ([packet row TP2](../deep-dives/subjects/RECOMMENDATIONS.md#theatre-and-puppetry-recommendations)). It extends the built levels 1–3 ([definition](puppet-stage.md), PR #1028; [GAMES.md](../GAMES.md#puppet-stage)). The study's leans were adopted under the developer's [October 23 delegation](../archive/DECISIONS-2026-10-23.md#standing-rules), as TP1's were. Its gates are unchanged: the land stays Music Mountain, nothing is kept, and the listening and child checks are device checks, not build blockers. **Built 2026-11-03** ([PR #1159](https://github.com/rjdunlap/neo/pull/1159); deviations are in [GAMES.md](../GAMES.md#puppet-stage) and the [archive note](../archive/COMPLETED-2026-10-09.md#puppet-stage-levels-46-theatre-and-puppetry-tp2-2026-11-03)).

**Fun action and purpose.** A story card shows a scene: Bunny knocking at Bear's door. She brings Bunny up through the slot, walks it to the door and bobs it, and Bunny says "Knock, knock!" while the front row claps. Then she acts two cards in order. Then she acts a three-card show for three creature friends, who react only to what she showed.

The purpose is the kindergarten-to-grade-2 theatre core: *act out a story with characters and voices* (EYFS ELG; TH:Pr4.b.2 alter voice and body). She follows a picture card, keeps scenes in order, and works out that an audience knows only what was performed (Movie Night's shown-only rule, restated).

Each neighbour does something different:
- Story Theater (Story Steps 12–13) chooses and watches.
- Cue Studio orders cards that the companion performs.
- Movie Night places sounds on fixed footage.
- Here the story is under her finger, and she performs it herself.

No line claims that acting develops language, feelings or self-control. The grown-ups' card says what she does: she acts a story card with puppets.

## Overlap and reuse

- **Built stage, reused unchanged.** These come from levels 1–3: the stage, the four puppets and their `BASE_VOICE`, `WAY_VOICE`, `sayIn`, curtains and tassel (free at every level), the front row (`frontRowArt`: pig, dog, cow), Bow, the glow ring, `standAt` and the drag (`lift: 0`). No new engine helper, save field or render texture is needed.
- **New pieces.** Story cards in a marquee across the arch, peeking puppets in the apron, two painted places per card, and level 6's **The end** button.
- **Movie Night** supplies the shown-only rule, restated as `reactions(ticked)` below. The premiere here is *live* (she performs to the friends), not a replay, so no playback code is copied.
- **Cue Studio** owns the executable card sequence. These cards are a story she acts herself. The director's chair (TP3, cue cards she orders before a show) stays a later definition, after a written diff against Cue Studio (study decision 5).

## The model (`logic.ts`)

### Places and stories

- `type Place = 'door' | 'tree' | 'pond'`. A round paints **two** places in the backdrop (a little house front with a door, a tree, a pond).
  - Two places, not three, because three places do not fit the portrait stage at 100-unit spacing.
  - Each place has **two marks**, `P − APART/2` and `P + APART/2`. Two puppets can share a place and still stand `APART` (160) apart.
- `interface Scene { puppet: Puppet; place: Place; card: LineId; line: LineId; voice?: Way }`.
  - Every scene's action is **a bob at the place**: a tap on that puppet while it stands at one of the place's marks.
  - Walking there is the drag. Bringing it up is the peek (below).
- `interface Story { id: 'a' | 'b' | 'c'; cast: [Puppet, Puppet]; places: [Place, Place]; scenes: [Scene, Scene, Scene] }`.
  - `cast[0]` waits at the left peek and `cast[1]` at the right peek.
  - `places[0]` is painted left and `places[1]` right.

### `STORIES`: three authored cards

Each card has three scenes, one required puppet and place each. Scene 1's place is always the one away from its puppet's peek, so even level 4 has a walk, and a scene for a puppet that is already standing always moves it to the other place. Card a's scene 2 is the one near entrance: Bear pops up beside its own door.

| Card | Cast (left, right) | Places (left, right) | Scene 1 | Scene 2 | Scene 3 |
| --- | --- | --- | --- | --- | --- |
| **a** *Knock knock* | Bunny, Bear | tree, door | Bunny at the door: "Knock, knock!" (plus a synthesized two-tap knock) | Bear at the door: "Who's there? Oh, hello, Bunny!" | Bear at the tree: "Come and play by the tree!" |
| **b** *The lost hat* | Bunny, Duck | pond, tree | Bunny at the tree: "Where is my hat?" | Duck at the pond: "Quack! I found a hat!" | Bunny at the pond: "My hat! Thank you, Duck!" |
| **c** *Surprise!* | Duck, Cat | door, pond | Duck at the pond: "Time for my nap. Zzz." | Cat at the door: "Shh. I'll surprise Duck." | Cat at the pond: "Boo!" in `WAY_VOICE.tiny`, the sneaky scene; Duck jumps and says "Oh! You surprised me!" |

Card lines are the pet reading the card, through `ctx.say`:
- a: "Bunny knocks on Bear's door." / "Bear opens the door." / "Bear goes to the tree to play."
- b: "Bunny looks for her hat by the tree." / "Duck pops up in the pond." / "Bunny hops to the pond for her hat."
- c: "Duck naps by the pond." / "Cat sneaks in by the door." / "Cat tiptoes to the pond and says boo!"

Puppet lines use `ctx.sayIn` in the puppet's `BASE_VOICE`, or in `voice` where a scene sets one (only c3). While Cat is dragged in card c, it moves with a tiptoe gait. The gait is art only, never a requirement.

### Plans, judging and reactions

- **Plan.** `plan(level, band, rng)` for levels 4–6 draws a seeded story and a seeded `mirror` flag, giving six variants. The mirror swaps left and right for both places and cast.
  - Level 4 *One scene* uses scene 1 only.
  - Level 5 *Two scenes* uses scenes 1–2.
  - Level 6 *The whole show* uses all three.
  - `Plan` gains `story`, `mirror` and `scenes` (the used prefix). `puppets` is the cast; both peek at the start.
- **Marks.** `placeAt(x, layout)` returns the place whose centre is within `SNAP` of `x`, or `null`. `SNAP = min(120, placeGap / 2)`, so snap zones never overlap.
  - A release inside a place's snap zone stands the puppet on that place's nearest free mark. If both marks are taken, the puppet uses `standAt` as today and is not at the place.
  - A release elsewhere uses `standAt`.
  - A puppet dragged down onto the apron and released there sinks back to its peek (free).
- **Judging.** `judge(scenes, ticked, bob: { puppet, place })` returns one of four results:
  - `{ kind: 'scene', index }`: the bob is the first unticked scene.
  - `{ kind: 'early', index }`: it matches a later unticked scene.
  - `{ kind: 'again' }`: it matches a ticked scene, and the puppet says that line again.
  - `{ kind: 'free' }`: anything else.

  A scene ticks only in card order.
- **Reactions.** `reactions(scenes, ticked)` gives each front-row friend (friend *i* waits for scene *i*; at levels 4–5 the friends just clap) `clap` when scene *i* is ticked and `puzzled` when it is not. It depends on nothing but `ticked`: Movie Night's shown-only property.
- **Hint target.** `hintTarget` for a story level is the first unticked scene's puppet and place. Following it (drag the puppet to the place, tap it) ticks that scene in one drag and one tap.
- **Bands and ranges.** TP1 left room for these windows; level numbers are unchanged:
  - `prek: { min: 3, max: 5 }` and `school: { min: 4, max: 6 }`.
  - `lap`, `toddler` and `preschool` are unchanged. No `order` is needed.
  - `LEVEL_NAMES` gains 4 *One scene*, 5 *Two scenes* and 6 *The whole show*, and `describeLevel` gains three lines:
    - 4: "One scene: bring the puppet up, walk it to the place on the card and bob it."
    - 5: "Two scenes: act two cards in order."
    - 6: "The whole show: act three cards for three friends, who react only to what she showed."

## Screen and controls

- **Marquee cards** (`layout(level, view).cards`): 1–3 cards, each at least 120 × 100, 12 apart, hung across the arch at the top.
  - They are centred in the span from x 130 (clear of the corner buttons) to the tassel's left edge minus 12.
  - A card shows the scene's puppet head, the place and a speech mark, with dots 1–3. A ticked card gets a star stamp, and the next card lifts slightly.
  - Tapping a card has the pet read it (free).
- **Peeks** (`layout.peeks`, at levels 4–6 only): the two cast puppets wait under the floor at the stage's two ends, heads showing above the slot.
  - Each touch box is 140 × 100, entirely in the apron (from the floor line down), so it never overlaps a standing puppet or a curtain.
  - A touch-down raises the puppet through the slot there, and it follows her finger while held, as at level 1; the release decides where it stands.
- **The floor surface is off at 4–6.** Puppets come up only from their peeks, so a stray touch on the backdrop raises nobody.
- **Stage geometry at 4–6.**
  - Portrait: the stage's left edge is 130, still clear of the corner buttons' 0–120 column, and the stand keeps 30 from each curtain. The two places sit at `stand.min + APART/2` and `stand.max − APART/2` (about 178 apart at 768 × 1024).
  - Landscape: the right column is not used (the cards are in the marquee), so places sit about 380 apart at 1024 × 768.
  - The front row stays under the floor at the centre in landscape; in portrait it moves below the peeks. With no room (a short phone landscape), it is hidden, as level 3 does.
- **Buttons.** Bow is unchanged. At level 6, **The end** (130 × 110: closed curtains with a star) stands where Bow will appear. It shows after the first ticked scene and gives way to Bow at the cheer.
- **Level 4 flow.**
  1. The cast peeks, and the pet reads the card (`ctx.instruct('ps.instruct.4')`, then the card line).
  2. She brings the scene's puppet up, walks it to the place and taps it. It bobs and says its line, and the front row claps.
  3. The puppets bow and the round finishes.
- **Level 5 flow.** As level 4 with two cards. After scene 1 ticks, the second card lifts and the pet reads it. After scene 2, the bow.
- **Level 6 flow.**
  1. The friends wave from their seats, and the pet says the instruction and reads card 1.
  2. As each scene ticks, its friend claps and the next card lifts.
  3. After the third scene, all three friends cheer and Bow appears.
  4. If she taps **The end** earlier, the curtains close and open again. Friends whose scene was shown clap; the first puzzled friend's line is spoken: "Pig waited for Bunny to knock on the door."
  5. Bow appears either way. She may bow now (the round finishes) or keep acting; scenes she adds are clapped as they happen.
- **Touch-down feedback** is as at levels 1–3: a puppet lifts on touch-down, a card dips, The end's curtains twitch.

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 4 | nothing | the glow on the scene's puppet and place after three `free` bobs while the scene is open (at most one) | walks, peeks, sinking back, `again` bobs, card taps, curtains, tassel |
| 5 | an `early` bob (a later card's scene acted first): the pet says "Not yet! This card comes first," and the next card lifts | the glow after the second `early` miss, or the third `free` bob, on one open scene; at most one per scene | as level 4 |
| 6 | each tap on The end while any scene is unticked | the glow on the first unticked scene at the second early end; at most one per round | `early`, `free` and `again` bobs (the puppet just speaks), card taps, curtains, tassel, acting after an early end |

- **Supported finish.** Every round is completable:
  - The glow stays until the scene ticks.
  - At level 6, Bow follows any premiere.
  - One ordinary sticker comes through `ctx.finish({ misses, hints })`.
  - Nothing is kept; leaving early owes nothing.
- **Adaptation.** One early end, or one out-of-order card, is still a smooth round. A bot-followed glow is supported completion, not evidence that she can follow a card unaided.

## Rule tests (`logic.test.ts`)

- **Stories.**
  - Every card has two distinct cast puppets, two distinct places and three scenes, each naming a cast puppet and one of the card's places.
  - Scene 1's place is the one away from its puppet's peek.
  - A scene whose puppet already stands after the earlier scenes names the other place, so it needs a walk.
  - Every card and scene line exists in `voice-script.ts`, and only c3 sets a `voice`.
  - Mirroring keeps all of the above.
- **Plans.** Over 300 seeds per band and level:
  - Levels 4, 5 and 6 use 1, 2 and 3 scenes of a drawn story, and the same seed gives the same plan.
  - The `prek` and `school` windows are as above, and the earlier bands are unchanged.
- **Judging.**
  - `judge` ticks only the first unticked scene, reports `early` exactly for later unticked matches and `again` for ticked ones.
  - Following `hintTarget` from any state ticks the next scene, so every round finishes with at most one hint per scene.
- **Reactions.** `reactions` depends only on `ticked`: it is identical for any two bob histories with the same ticks, every friend claps when all are ticked, and the puzzled friends are exactly the unticked scenes.
- **Marks.**
  - Two puppets at one place stand exactly `APART` apart and both count as at the place.
  - Snap zones of the two places never overlap.
  - A release outside every snap zone is not at a place.
- **Layout** at the four views for levels 4–6:
  - Cards are at least 120 × 100 and peeks 140 × 100, and every input is at least 100.
  - Nothing sits under the guide (0–170 by the bottom 170) or the corner buttons (0–120 by 0–220).
  - Cards clear the tassel, peeks clear the curtains and Bow, and the place gap is at least `APART`.
  - Every mark is inside the stand range.
  - The existing levels 1–3 layout tests are unchanged.
- **Bot.** Its intent for every reachable state (drag a peek or a standing puppet to the next scene's mark, tap it, tap Bow) is a drag or tap on an existing input. It finishes levels 4–6 at `prek` and `school` and never taps The end early.
- **Registry, lands, how-to and off-screen tests** pass:
  - Music Mountain still fits one page at pre-K and school.
  - The how-to steps are scoped as below, with no "later levels" wording.
  - The new `prek` and `school` off-screen lines resolve.

## Ghost finger, how-to card, voice and registration

- **Ghost finger** (`autotouch()`, reading `game.state`, which gains `story`, `ticked` and `ended`): for the next unticked scene:
  - If its puppet is parked, drag from its peek to the place's nearest free mark.
  - If it is standing elsewhere, drag it there.
  - Then tap it. At level 6, after the cheer, tap Bow.

  It never taps The end, a card or a curtain, and it re-reads the layout after every resize.
- **How-to card** (`src/content/howto.ts`), with additions bounded by level:
  - Steps:
    - `{ from: 4, to: 4 }`: "Look at the story card. Bring that puppet up from under the stage, walk it to the place on the card and tap it to act the scene. Tap a card to hear it."
    - `{ from: 5, to: 5 }`: "Act the two cards in order; acting the second card first is one try."
    - `{ from: 6, to: 6 }`: "Act all three cards for the friends in the front row. Each friend claps for its scene; tap The end early and the friend who missed a scene says what it waited for."
  - Finish:
    - The existing `{ from: 2, … }` line becomes `{ from: 2, to: 3 }`.
    - Add `{ from: 4, to: 5, text: 'When every card is acted, the puppets bow and the round ends.' }`.
    - Add `{ from: 6, text: 'After the third scene, or after The end, tap Bow.' }`.
  - Notes:
    - The existing `{ from: 2, … }` note becomes `{ from: 2, to: 3 }`.
    - Add `{ from: 4, text: 'Acting somewhere else is never wrong; after three tries the puppet and its place glow. Play together: read each card aloud like a narrator while she moves the puppets, then swap.' }`.
    - The second sentence is the study's **director's chair** co-play role.
- **Co-play.** `coplayHint` is shown only at lap and toddler (`GameScene.begin`), so it stays as built. The director's chair lives on the how-to card note above. Showing `coplayHint` at older bands would be a shell change that this packet does not take.
- **Off-screen.** `offScreen` becomes `OffScreenLines`:
  - `all`: the existing spoon line.
  - `prek` and `school`: "Act a picture book with two spoons: you read the page, {name} gives the spoons their voices."
- **Voice lines** (no slots, so the pet's lines can render as clips later; puppet lines stay device speech by design):
  - `ps.instruct.4`: "Look at the card, then make the puppet do it!"
  - `ps.instruct.5`: "Two cards! Act them in order."
  - `ps.instruct.6`: "Put on the whole show for our friends!"
  - `ps.card.{a,b,c}{1,2,3}`: the card lines above.
  - `ps.sc.{a,b,c}{1,2,3}` and `ps.sc.c3-duck`: the scene lines.
  - `ps.order`: "Not yet! This card comes first."
  - `ps.waited.{a,b,c}{1,2,3}`, one per friend and scene, for example "Dog waited for Bear to open the door."
  - `ps.cheer`: "Hooray! The whole show!"
  - That is 33 lines. The existing `ps.this-one` and `ps.bow` are reused.
- **Registration.**
  - `bands` gains `school`.
  - `levels` uses the new windows, and `describeLevel` and `LEVEL_NAMES` are extended.
  - The skills gain `'acting-a-story'`.
  - The land stays Music Mountain, and the sticker is unchanged.
  - **Couch:** none.

## Check tier (for the build)

- **Batch `puppet-stage 2` (levels 4–6), new-interaction tier:**
  - `npm run typecheck`.
  - The rule tests above, plus the registry, lands, how-to and off-screen tests.
  - One scripted play through the `puppetstage` filter, extended:
    - level 4 with three off-card bobs (glow, one hint), then the scene;
    - level 5 with an out-of-order bob twice (miss, then the glow), then both cards;
    - level 6 with one early The end (miss, a puzzled friend, Bow shown), then the remaining scenes to the cheer and Bow.
  - One portrait screenshot of level 6 mid-show, with the cards and the front row.
  - `fingerdemo` at levels 4, 5 and 6.
  - `npm run build`, because the voice script and how-to change.
  - Record the tested commit, the filter and the server URL.
- **Not run in this docs slice:** everything except `node scripts/check-links.mjs` and `git diff --check`.
- **Device and person checks, open at the build (DEVICE-CHECKS):**
  - Does a four-year-old follow a picture card without reading, once the pet has read it?
  - Does a six-year-old prefer performing a card to watching Story Theater (the study's question)?
  - Is Cat's tiny "Boo!" audibly sneaky on the iPad's voice?
  - Do grown-ups find and use the narrator-and-swap note?

## Open decisions

Each has a default that the build uses; none blocks the batch.

1. **Bob-only scenes.** Default: every scene is a bob at a place, and entering is setup. The study's "Bear opens the door (drag Bear up through the slot by the door)" is acted as Bear brought to the door and bobbed. The alternative is a separate *enter* action, judged on a puppet's first release. That would need a way to take a puppet back down after a wrong entrance, so it is not taken.
2. **Two places per card.** Default: two, because three places at 100-unit spacing do not fit the 768-wide portrait stage with puppets sharing a place.
3. **The sneaky voice and the stand-in prop.** Default:
   - c3 speaks in the fixed tiny voice with a tiptoe gait, and nothing asks her to choose it.
   - Level 3's voice bubbles do not return at 6, and the study's "this is the horse" prop (any choice accepted) is not built here.
   - Both would add a fourth row of controls to an already full portrait screen. They are recorded as a later proposal (a level 7 candidate, before or beside TP3's director's chair).
4. **A live premiere.** Default: the friends watch the whole round and react as scenes tick, and The end judges early. Movie Night's Watch-then-Premiere replay is the alternative, at the cost of playback code and a second pass of the same scenes.
5. **The first early end counts.** Default: one miss, as the study's table says, with Bow offered at once. Movie Night instead makes its first unmet premiere free. The study's rule is kept because The end is a deliberate choice to stop, not a test run.
6. **Mirroring.** Default: on (six variants). Off if a child relies on a card's side.
7. **The director's chair as a how-to note.** Default: on the card, because `coplayHint` is early-band only. A shell change could show `coplayHint` at every band if another game needs it too.
