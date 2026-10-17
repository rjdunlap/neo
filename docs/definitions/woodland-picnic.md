# The Woodland Picnic: a second Island Errand (definition)

Defined 2026-10-16 for [chunk 22](../ROADMAP.md#chunks), from [W1 in the family experience review](../FAMILY-EXPERIENCE.md#w1-one-more-connected-adventure). **Built 2026-10-16 ([PR #479](https://github.com/rjdunlap/neo/pull/479)); the rules below are what shipped, with no typed story result, no Robot Path and no younger version.** It is the second story after the Windy Picnic (`src/content/picnic.ts`, `PicnicScene`), built on the same step contract, and it owns chunk 7's Woodland Picnic, so chunk 7 stays for a *different* episode.

**Fun action and purpose:** Hazel, the squirrel postkeeper, is throwing a picnic in Wonder Woods and asks for three jobs: send the invitations, pack the two baskets evenly, and practise the picnic beat. Each job is an ordinary round of a game she already knows, and each finished job visibly changes the clearing. When all three are done the friends walk in, the beat plays and the picnic happens. Learning purpose: the same as the three rounds (map reading, equal weights, copying a rhythm by ear), plus seeing that small jobs add up to one shared event. No new game rules.

**Band and entry:** for the `school` band, from **Wonder Woods** (the school place, `src/content/places.ts`), as a picnic-blanket spot in the place, like the Windy Picnic's spot on the map. It is offered only on the school home spot, so younger children keep the Windy Picnic and see nothing new. A `grownup` profile reaching Wonder Woods plays it the same way, with each game's band resolved by `playBand`. Nothing gates: every game stays playable on its own, and the story never unlocks or hides one.

## The steps

Three requests, in any order, like the Windy Picnic. The levels are inside each game's current `school` range (checked against source at `562b97c`):

| Step ID | Hazel asks | Game and story level | Why this level | What changes in the clearing |
| --- | --- | --- | --- | --- |
| `invitations` | "Will you take the invitations to my friends?" | Mail Carrier **6**, the Wonder Woods picture map (school range 4–8) | The map is already Hazel's woods; find each friend in the key, then the house with their sign | Each friend's house on the clearing's edge shows a flag, and a path of stepping stones lights toward the clearing |
| `baskets` | "Two baskets the same, so we can carry them on the pole." | Seesaw Balance **7**, two identical boxes: weigh both, then find one (school range 6–10) | Two identical boxes read as two identical baskets: the sharing/preparation activity W1 asks for | Two packed baskets hang level from a carrying pole beside the blanket |
| `beat` | "Let's learn the picnic beat so everyone can dance." | Beat Builder **3**, copy a beat by ear (school range 3–9) | Level 3 already draws Beat Builder's picnic stage (`PicnicStage`); four steps keep it short | A drum and a bell appear on a stump; the ending plays this beat |

Like the Windy Picnic, finishing a round completes its step whatever its misses and hints, so help reaches the same ending. The round's result carries only misses and hints, so each consequence is a **fixed picture**, not what she made: the picnic beat at the end is a stated beat from the story, not her copy. This first episode needs **no typed story result** ([proposed story results](../DESIGN.md#proposed-story-results)): nothing she chose changes the next scene. If a later episode should play *her* beat or follow *her* route, that is the time to build the smallest typed result for that one step.

**Why Robot Path is left out.** The roadmap's Wonder Woods row once listed Robot Path loops among the Woodland Picnic's games. W1 asks for a map, a sharing/preparation activity and one construction *or* music activity, limited to a few short steps. Mail Carrier's map already carries the route, Beat Builder already has a picnic stage, and a fourth step would lengthen the story past "a few". Robot Path stays a candidate for a later woodland errand (a delivery for a friend).

## The scene, the ending and the keepsake

- **Opening:** the clearing with an empty blanket, Hazel holding three request cards (a letter, two baskets, a drum), each a tap target of at least 100 units that starts its round. A done card turns over to its picture. Hazel repeats the first unfinished request when tapped, as Juniper does in the Windy Picnic.
- **Return:** a finished round comes back to the clearing (`go.game(id, band, { step, level })` → story's home route), says its done line, and shows that step's change, as `go.picnic(step)` does today.
- **Ending:** when all three steps are done, the friends walk in along the lit path, the stated picnic beat plays, and the blanket fills. One keepsake, the **woodland picnic photo**, is kept the first time, like the Windy Picnic's photo: telling the story again never takes it away or adds another.
- **Again:** after the ending, "tell it again" clears this telling's steps and keeps the keepsake, exactly as the Windy Picnic does.

## Rewards, leaving and resuming

- Stickers come only from each game's ordinary round finish (one per completed round). The story layer awards nothing; the keepsake is a story memento, as today.
- A story round plays the story's level and does **not** move the game's own saved level (GameScene already does this for `story`).
- Completing a step is idempotent: a step already done is not done twice, and a replayed or reloaded round cannot complete it again.
- Leaving mid-round returns to the clearing with the step undone. Leaving the clearing keeps the steps done so far; coming back resumes there. No timer, no reminder, nothing lost while away.
- Stopping is comfortable at every point: Home from the clearing goes to Wonder Woods.

## What the build changes

The build is one slice at the **story / navigation / save tier** (shell, save and navigation in the verification budget).

- **Save:** a new `stories.woodland: StoryProgress` beside `stories.picnic`, with its default, repair in `migrate()` and migration tests (an old save gets an empty telling; an unknown step is dropped). The current `StoryProgress` shape (steps, ended, keepsake) is enough.
- **Step IDs:** today `PicnicStep`, `StoryRound.step`, `store.completeStep` and `go.picnic(step)` know only the Windy Picnic. The build generalizes them to a story ID plus step, keeping the Windy Picnic's IDs and saved data unchanged. It does not add a quest framework, currency or world clock.
- **Scene:** a Woodland Picnic scene (or the picnic scene with a second story's data). Art is code-drawn: Hazel, the clearing, baskets on a pole, the drum and bell, flags.
- **Entry:** a spot in Wonder Woods' place layout that keeps every existing target at its size (`PlaceScene` and the subject layout both).
- **Voice:** asks, done lines and recaps for three steps, the opening and the ending in `voice-script.ts`.
- **Tests:** steps complete once; story levels stay inside each game's school range (a test reads `levels('school')`, so a later range change fails loudly); story rounds do not move saved levels; the ending needs all three; telling it again keeps the keepsake; migration of old saves.
- **Browser check:** a filtered `picnic`-style flow for this story (open from Wonder Woods, finish one step with a miss, leave and resume, finish the other two, ending once, keepsake once), plus `world` for the new entry. One portrait screenshot of the clearing.

Not in this slice: a typed story result, Robot Path, a younger-band version, any change to the Windy Picnic's steps, and couch play.
