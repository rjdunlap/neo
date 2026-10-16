# The Missing Melody: a third Island Errand (definition)

Defined 2026-10-16 for [chunk 7](../ROADMAP.md#chunks), the *different* episode that row asks for (the Woodland Picnic is chunk 22's and is defined in [woodland-picnic.md](woodland-picnic.md)). **Docs only: nothing here is built.** It reuses the Windy Picnic's step contract (`src/content/picnic.ts`, `PicnicScene`) and the generalization the Woodland Picnic's build makes; it adds no story framework.

**Fun action and purpose:** Wren, a small songbird who sings the morning song over Bumpy Hills, wakes with her song gone quiet: only faint shadows of its notes are left. She asks for three jobs: fill the song's notes back in, help her tell high sounds from low ones, and invite friends to sing it with her. Each job is an ordinary round of a game she already knows, and each finished job visibly changes the hilltop. When all three are done the friends gather, the morning song plays and the sun comes up. Learning purpose: the same as the three rounds (copying a short tune, hearing high and low, choosing friends to join a song), plus hearing that a song is made of notes that can be found again. No new game rules.

**Band and entry:** for the `preschool` band, from **Bumpy Hills** (the preschool place, `src/content/places.ts`), as a music-stand spot in the place, like the Windy Picnic's spot on the map and the Woodland Picnic's blanket in Wonder Woods. It is offered only on the preschool home spot, so a toddler keeps the Windy Picnic and an older child keeps theirs; nothing else changes for them. Nothing gates: every game stays playable on its own, and the story never unlocks or hides one. Each round plays at `preschool` (all three games support it, so `playBand` resolves to it).

## The steps

Three requests, in any order, like the Windy Picnic. The levels are inside each game's current `preschool` range (checked against source at `239296f`):

| Step ID | Wren asks | Game and story level | Why this level | What changes on the hilltop |
| --- | --- | --- | --- | --- |
| `notes` | "My song has gone faint. Can you tap its notes back in?" | Song Maker **4**, copy a 5-note song by tapping its shadows (preschool range 4–6) | The shadows *are* the faint song: a short, shown tune she fills in, with no reading or memory load | Five note-flowers bloom along a vine strung between two trees, low to high |
| `highlow` | "Some of my notes are high like me, and some are low like Frog. Which is which?" | Sound Garden **2**, high or low? bird or frog (preschool range 2–4) | Its bird-and-frog question is Wren's own; listening is the musical step the other two lack | Wren hops to the top branch and Frog to the stone below, ready to sing the high and low parts |
| `friends` | "A song is better together. Who will sing with us?" | Sing-Along Barn **3**, choose two friends to join the song (preschool range 2–3) | Choosing who joins is the social ask; two verses keep it short | Two friends from the barn wait on the hill, one on each side of the vine |

Like the Windy Picnic, finishing a round completes its step whatever its misses and hints, so help reaches the same ending. The round's result carries only misses and hints, so each consequence is a **fixed picture**: the morning song at the end is a stated tune from the story, not the notes she tapped, and the friends on the hill are the story's two, not the ones she chose. This episode therefore needs **no typed story result** ([proposed story results](../DESIGN.md#proposed-story-results)). If a later telling should play *her* tune or show *her* friends, that is the time to build the smallest typed result for that one step.

**Why not Jelly Drums or Beat Builder.** Jelly Drums 4 (copy two-note tunes) is already the Windy Picnic's invitation step at `preschool`, so a second story using it would repeat the same round. Beat Builder is the Woodland Picnic's beat step; a melody episode wants notes and pitch, not a beat. Song Maker, Sound Garden and Sing-Along Barn are in no story today.

**Why the Missing Melody and not a mixed-up delivery.** Chunk 7 named both. A delivery leans on Mail Carrier, which the Woodland Picnic's invitations step already uses, so it would repeat the most recent episode. The melody gives the youngest story-capable band (preschool) an episode of its own; the delivery stays a candidate in the [idea notebook](../IDEAS.md#story-episodes-and-the-personal-world).

## The scene, the ending and the keepsake

- **Opening:** the hilltop at dawn, Wren on a low branch, a bare vine between two trees and three request cards (a note, a bird over a frog, two friends), each a tap target of at least 100 units that starts its round. A done card turns over to its picture. Wren repeats the first unfinished request when tapped, as Juniper does in the Windy Picnic. The song's faint shadows show on the vine until the `notes` step is done.
- **Return:** a finished round comes back to the hilltop through the story's home route, says its done line and shows that step's change, as `go.picnic(step)` does today.
- **Ending:** when all three steps are done, the friends gather, Wren sings the stated morning song (five pentatonic notes from `src/audio/notes.ts`, the flowers lighting in turn), and the sun comes up over the hills. One keepsake, the **morning song card**, is kept the first time, like the Windy Picnic's photo; telling the story again never takes it away or adds another.
- **Again:** after the ending, "tell it again" clears this telling's steps and keeps the keepsake, exactly as the Windy Picnic does.
- **Music:** the hilltop sets a quiet style (`STYLES.quiet`) so the song is easy to hear; each game keeps its own `music` during its round.

## Rewards, leaving and resuming

- Stickers come only from each game's ordinary round finish (one per completed round). The story layer awards nothing; the keepsake is a story memento, as today.
- A story round plays the story's level and does **not** move the game's own saved level (GameScene already does this for `story`).
- Completing a step is idempotent: a step already done is not done twice, and a replayed or reloaded round cannot complete it again.
- Leaving mid-round returns to the hilltop with the step undone. Leaving the hilltop keeps the steps done so far; coming back resumes there. No timer, no reminder, nothing lost while away.
- Stopping is comfortable at every point: Home from the hilltop goes to Bumpy Hills.

## What the build changes

The build is one slice at the **story / navigation / save tier** (shell, save and navigation in the verification budget). **Build it after the Woodland Picnic**, which generalizes `PicnicStep`, `StoryRound.step`, `store.completeStep` and `go.picnic(step)` to a story ID plus step; this episode then adds data and a scene, not a second generalization. If it is somehow built first, it does that generalization itself, keeping the Windy Picnic's IDs and saved data unchanged, and the Woodland Picnic reuses it.

- **Save:** a new `stories.melody: StoryProgress` beside `stories.picnic` (and `stories.woodland`), with its default, repair in `migrate()` and migration tests (an old save gets an empty telling; an unknown step is dropped). The current `StoryProgress` shape (steps, ended, keepsake) is enough.
- **Scene:** a hilltop scene (or the shared story scene with this episode's data). Art is code-drawn: Wren (a new small songbird drawing in `src/art/`, palette colors), Frog (reuse Sound Garden's frog if it can be shared cleanly), the vine with note-flowers, two trees, the sunrise.
- **Entry:** a spot in Bumpy Hills' place layout that keeps every existing target at its size (`PlaceScene` and the subject layout both).
- **Voice:** asks, done lines and recaps for three steps, the opening, the ending and the keepsake in `voice-script.ts`.
- **Tests:** steps complete once; story levels stay inside each game's preschool range (a test reads `levels('preschool')`, so a later range change fails loudly); story rounds do not move saved levels; the ending needs all three; the stated song uses pentatonic notes; telling it again keeps the keepsake; migration of old saves.
- **Browser check:** a filtered `picnic`-style flow for this story (open from Bumpy Hills, finish one step with a miss, leave and resume, finish the other two, ending once, keepsake once), plus `world` for the new entry. One portrait screenshot of the hilltop.

Not in this slice: a typed story result, a toddler or prek version, a mixed-up delivery, any change to the Windy Picnic's or Woodland Picnic's steps, and couch play.
