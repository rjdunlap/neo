# Common Ground, level 1: A Place for You (definition)

**Status:** defined 2026-11-25, docs only; nothing is built. Build it as a **new game** `common-ground` with one school level; read [The model](#the-model-logicts) and [Registration](#registration-and-files). Every [open decision](#open-decisions) has a default the build uses.

Defined as slice **4** of the [social-emotional study](../deep-dives/subjects/social-emotional.md#build-slices-in-order), from its [A Place for You](../deep-dives/subjects/social-emotional.md#a-place-for-you-common-grounds-younger-entry) section and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#social-emotional-play-recommendations). The [October 23 record](../archive/DECISIONS-2026-10-23.md#standing-rules) settled that Common Ground sits at school top and `grownup` on existing bands, with no new band, and that fictional screen rounds go ahead after the building session's source check. The older two-person negotiation case in the study stays a later level of this game; it is not defined here and nothing below depends on it.

**Fun action and purpose:** a friend comes to visit and a small room is empty. She hears what the friend would like, drags a cushion and a book basket onto a floor of six squares, may add a plant, and presses *Visit*. The friend walks in, sits on the cushion by the window and reads from the basket. The learning purpose is **designing for someone else from what they said**: hearing two stated requests, turning each into a place, noticing when a move breaks a request, and seeing that many different rooms keep the same promise (the friend asked for two things, not for one room). It is the recipient-design idea of a client who describes a space, with every wish stated and none hidden. No taste of the friend's is a hidden answer.

## Overlap

Checked against `origin/main` at `0e1e6122c` (GAMES entries and the `src/games/` folders named below).

| Game | What it already owns | Why this is different |
| --- | --- | --- |
| Toy Drawer, Tap Then Place | Fitting footprints into limited cells; place-then-check | The objects are the same; the goal there is a fit. Here the goal is a *request someone else stated*, judged by a rule over cells |
| Playdate Workshop 1–3 | Two friends' pictured requests, a plan for shared materials, operating it | Materials and turns, not space. This is the only game where a request says *where* |
| Village Planner, Picnic Pantry | Ordering jobs with shared resources; menu quantities | A schedule and a count. No spatial request |
| Treehouse (the pet's room) | The saved companion's personal space | This is a temporary visitor scene. Nothing is saved, owned or decorated for keeps |
| Make One for Me (an idea) | Building a puzzle for someone else | The friend here supplies a request, not a puzzle, and uses the placed things |

The study's reasons stand: a new game, not a mode of Story Theater, because the action (arranging on a floor against stated rules) is not choosing or watching a story step.

## The model (`logic.ts`)

Everything is integers on a 2-row, 3-column floor. Cells are numbered row-major `0 1 2 / 3 4 5`. Nothing is compared in pixels.

- **Pieces:** `cushion` (the sitting place), `basket` (the books) and an optional `plant`. A piece is on a cell or in the tray; one piece to a cell. `place(state, piece, cell)` onto an occupied cell swaps the two pieces (a piece with nowhere to go returns to the tray), so a drop is never refused.
- **Fixture:** one pictured fixture on a wall, either the **window** on the top wall or the **door** on the bottom wall. "By the fixture" means the row against that wall: the top row (`0 1 2`) for the window, the bottom row (`3 4 5`) for the door.
- **Two requests, both hard:** (1) the cushion is *by the fixture* (in its row); (2) the basket is *beside the cushion*, meaning orthogonally adjacent (left, right, above or below), shown once with a little arrow picture. Diagonal is not beside.
- **The plant is extra.** It may be omitted or on any free cell. It never changes whether the requests are met, and a placed plant never blocks a request: the check ignores it.
- **Judging (`check(state)`):** `unplaced` when the cushion or basket is in the tray; otherwise `ok`, or `cushion` (not in the fixture's row), or `basket` (not beside the cushion), or `both`. A Visit is **accepted** only on `ok`.
- **Counts the tests re-derive:** with the window, the cushion has 3 cells; the basket has 2 neighbours when the cushion is in a corner cell (`0`, `2`) and 3 when it is in the middle (`1`), so **7** cushion-and-basket pairs; the plant may be omitted or on any of the **4** other cells, so **35 accepted arrangements** (and the door gives the mirror-image 35). Over all placements (6 cells for the cushion, 5 for the basket, then the plant omitted or on 1 of 4 free cells) there are **150** complete arrangements, 35 accepted and 115 not, per fixture.
- **Seeded appearance only.** The seed picks the fixture (window or door), the friend (bunny, cat, owl or mouse), the object pair (a cushion and a book basket, or a rug and a toy box, drawn as the same two pieces) and colors. It never changes the rules or the counts. Each fixture appears once before it repeats.
- **`hintAction(state)`** is one legal move that brings the arrangement closer to `ok`, never the only answer: the cushion not placed goes on the middle cell of the fixture's row (the cell with the most neighbours); a cushion outside the row moves to the nearest row cell; a basket in the tray or not beside the cushion goes on the first free cell beside the cushion in reading order. After it, no other piece is moved.

Every complete state can be enumerated (at most 6·5·5 = 150 with the plant, 30 without): the tests check the verdict for all of them against a plain adjacency rule.

## The level

| Level | Name (`describeLevel`) | What it is |
| --- | --- | --- |
| 1 | *A place for you: arrange two things so a friend's two requests are kept* | One friend, two requests, three pieces, any arrangement that keeps both |

`school` only (about 6–8). A round is one visit and gives one sticker. Younger bands get nothing: the pre-K opening waits until the pictured requests and layout have been seen on a phone. Later levels, each its own definition: **2, a request changed after the preview** (the friend asks for the basket on the other side, and the arrangement is revised), **3, two residents** with compatible requirements and different preferences (this connects to the older negotiation case already in the study), and then that case itself. None is built or reserved here beyond the next free stable IDs (2, 3, …).

### First round

Fixture: the window. Friend: the bunny. "I'd like my cushion by the window, and my book basket right beside it." She drags the cushion to the top-left, the basket to the cell under it, adds a plant at the bottom-right, presses *Visit*, and the bunny sits down to read.

## Screen and controls

Played upright and landscape; the layout reads `view` in `resize()`.

- **The room:** a 2×3 floor, each cell `min(160, (view.w − 80) / 3)` units, never under 100. The fixture is drawn on its wall above or below the floor, the friend waits by it at one corner of the floor. In portrait the tray sits under the room; in landscape it sits to the side.
- **The tray:** three pieces, each a 100-unit target at least, with a 10-unit pad. Drag with `src/engine/drag.ts`; a drop snaps to the nearest cell. A drop off the floor returns the piece to the tray. A piece already on the floor drags to another cell (swap if it is occupied). **No drop is ever wrong:** placing is exploration; only *Visit* judges.
- **Request bubbles:** two pictured bubbles above the room, each with the item and its place picture (a cushion with the window; a basket with an arrow to the cushion). A tap on a bubble replays its words. Each bubble gets a green tick when its request is kept in the current arrangement, so she can see what changed after a move without a miss. (Defaults, [decision 3](#open-decisions).)
- **Visit:** a large button, disabled until the cushion and basket are placed. The friend walks to the cushion if both requests are kept; otherwise the friend stops, and the unmet request's bubble pulses.
- **Help, Home, Back** unchanged. The pet is the existing corner guide, away from the floor in both orientations.
- Nothing is read for navigation; the bubbles and the voice carry the requests.

## Accounting, help and finishing

- **Misses:** a *Visit* that is not `ok` is one miss, and it names the one unmet request it can (`cushion`, `basket`; `both` names the cushion first). Moving pieces is free and never a miss. Retry is always available and her arrangement is never erased.
- **Hints:** Help, or the glow after two misses, plays `hintAction`: the piece and its target cell glow, and a tap or drag completes it. Using it counts as a hint.
- **Assisted ending:** after two hints in a round, a third hint is *carried out by the pet*, so every round can finish alone. The round still gives its one sticker; it is supported, not independent, as everywhere ([AGENTS](../../AGENTS.md#adding-or-extending-a-minigame)).
- **Adaptation:** one level only, so `difficulty.ts` has nothing to step; misses and hints are still recorded through `ctx.finish({ misses, hints })`.
- **Finish:** after the friend has read for a moment the voice says the finishing line and the shell awards the sticker. The game saves no room, creates no kept creation and draws no celebration of its own. The friend's plant remark is warm for any plant placement, and for none.

## Speech (`voice.ts`)

`{name}` is her name. The building session reads each line against the [source check](../deep-dives/subjects/social-emotional.md#anchors-and-evidence-limits) it finds: the friend only states what the friend asks for, never a feeling the child must guess, and nothing treats an arrangement as the person's fault. Lines are written to carry `{name}` or an item word so they stay on device speech, as the other recent batches did.

| Moment | Line |
| --- | --- |
| Start (`ctx.instruct`) | "{name}, a friend is coming! Listen to what they'd like." |
| Request (window) | "I'd like my cushion by the window, and my book basket right beside it." |
| Request (door) | "I'd like my cushion by the door, and my book basket right beside it." |
| Visit pressed with the cushion misplaced | "Hmm, my cushion is not by the window yet." |
| Visit with the basket misplaced | "My basket is not beside my cushion yet." |
| Hint | "Try the glowing piece, {name}. It goes in the glowing place." |
| Both kept (the friend sits) | "Just right. Thank you, {name}!" |
| Plant added | "A plant! That is a nice extra." |
| No plant | "Cozy, just like I asked." |
| Finish | "You listened and made a place for your friend." |

Do not run the voice-clip renderer in the build slice; device speech is the fallback until a `Better voice` pass.

## Rule tests (`logic.test.ts`)

1. For both fixtures, `check` over all 150 complete arrangements returns `ok` for exactly 35 and the right reason code for the rest; the counts 7 pairs and 35 accepted equal the plain rule.
2. Adjacency is orthogonal only: a diagonal cushion-and-basket pair is `basket`; the three corner cells have two neighbours and the middle top and bottom cells have three.
3. The plant never changes a verdict: for every arrangement the verdict with and without the plant equals the verdict of the cushion and basket alone.
4. `place` is a swap on an occupied cell and never refuses a drop; a piece never ends on two cells.
5. `hintAction` from every reachable incomplete state is a legal move, and applying it repeatedly reaches `ok` in at most three moves; it never moves a piece that already satisfies a request.
6. Each seeded round shows both fixtures across seeds, never the same fixture twice in a row, and the friend and colors never change the rule or the counts.
7. Level 1 appears in the `school` band only; every other band has none.

## Ghost finger, how-to card and registration

- **How-to card:** a short card in `howto.ts`, level 1 only: a friend's two request bubbles, a finger dragging the cushion by the window and the basket beside it, then pressing *Visit*.
- **Ghost finger:** `autotouch()` follows `hintAction`: it drags the next piece the hint names, then adds the plant on a free cell some of the time, then taps *Visit*. A unit test runs 50 seeds and every one reaches `ok` with no miss. `fingerdemo` plays level 1 once.

### Registration and files

A new `GameModule` `common-ground`: grown-up name *Common Ground*, spoken title "A place for you", `challenge` set, skills `listening`, `perspective` and `spatial reasoning` (add them to the skills list only if not already there), `bands: ['school']`, level 1 only, music a quiet `STYLES` entry, hub icon and sticker art (the finished room, drawn with `pictureThumb`-style seeded art, pinned to its seed so a sticker keeps its picture), co-play suggestion (a grown-up says one request aloud and the child places it) and an off-screen suggestion (arrange real cushions for a toy visitor). **Land: Story Grove** (the subject pages are by theme; it lists `thought-bubbles` and `playdate-workshop` already), with Painted Canyon as the fallback if the lands test reports the page full at school. Run `node scripts/content-barrels.mjs` after writing `voice.ts` and `howto.ts`.

Expected files: `src/games/common-ground/` (`index.ts`, `logic.ts`, `logic.test.ts`, `art.ts`, `howto.ts`, `voice.ts`), `src/content/lands.ts`, `docs/games/common-ground.md` (`npm run game-docs`), the README tables, `docs/GAMES.md`, the social-emotional study and a verification entry.

## Check tier

New game: typecheck, unit tests, **one** filtered scripted play (level 1: one `Visit` with the cushion misplaced, then a hint, then a kept arrangement with a plant), one portrait screenshot, then `fingerdemo` at level 1. `npm run build` because the lands and registry files change. Whether a 6–8-year-old wants to play it, and whether a grown-up sees it as more than a toy, stay person checks, not gates.

## Open decisions

1. **Registration.** Default: a new game `common-ground` on school only, per the October 23 record. The alternative (a mode of Story Theater) was rejected: the action is arranging, not choosing a story step.
2. **Land.** Default: Story Grove, with Painted Canyon as the lands-test fallback.
3. **The ticks on the bubbles.** Default: show a tick for each request that is currently kept, so she sees the effect of a move without a miss. If it makes *Visit* feel pointless, hide the ticks and let *Visit* alone judge; the rule tests do not change.
4. **The plant.** Default: it is optional and never judged. The alternative (a third request, "the plant by the other wall") belongs to a later level, not this one.
5. **Pre-K.** Default: none until the pictured requests have been seen on a phone.
