# Story Steps: Laundry Day (definition)

Defined 2026-11-25 on `claude/define-laundry-day` ([PR #2200](https://github.com/rjdunlap/neo/pull/2200)), slice **H7** of the [everyday-life-long-ago study](../deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order), from its [candidate row](../deep-dives/subjects/daily-life-long-ago.md#candidates-and-overlap-decisions) "Laundry Day" and the [overlap decision](../deep-dives/subjects/daily-life-long-ago.md#on-the-island-today) that it is an appended story of the built `story-steps` game (`src/games/story-steps/`, [page](../games/story-steps.md)), not a registration. Nothing is built yet; the [build line](../READY.md#next-ten) is in Next ten.

**What it adds:** one **eleventh story**, `laundry`, *Wash the picnic blanket*, in the same four-picture, one-camera form as the ten that exist. No new level, band, land, save field, journal entry or game registration. It reaches every level that draws from all the stories (5–7, 9 and 10), plus level 4's pool.

**Fun action and purpose:** the same as the rest of Story Steps, placing pictures so a short task makes sense. Here the order is a **dependency**: the blanket must be scrubbed before it is hung up, and hung up before it is dry. That is the learning the study asked for, "move task pictures so a friend can finish a household job; sequence and explain dependency", in a household task a toddler's family does every week and an island pet can do beside her.

**What it deliberately is not.** The study gates real household history on [H6](../deep-dives/subjects/daily-life-long-ago.md#build-slices-in-order) (a located, sourced, community-reviewed packet), which is not ready. So this story claims no time, place, culture, century or "how people used to". It is a fictional island chore, like the bird box and the fish churn of Attic Finds. It never says *old*, *long ago* or *traditional*, shows no appliance and no product, and teaches no real washing technique or chemical handling: the picture shows a tub of suds, a line and a peg, and nothing a child could copy that is unsafe. The study's labour-and-harm decision (5) does not arise: the chore is chosen and shared, not assigned. A real-history Laundry Day, if H6 ever yields one, would be a separate story with its own review.

## The story

| Stage | Picture | Spoken sentence (also the card's pictureText) |
| --- | --- | --- |
| 0 | The picnic blanket spread out with one big jam spot | The picnic blanket has a jam spot. |
| 1 | The blanket in a round tub of suds, a hand scrubbing | We scrub the blanket in the tub. |
| 2 | The wet blanket hanging from a line by two pegs, drips falling | We hang the wet blanket on the line. |
| 3 | The same blanket dry and spotless, folded over a picnic basket | The blanket is dry and ready for a picnic! |

`STORIES.laundry = { name: 'Wash the picnic blanket', steps: [...] }`. The four sentences are all different, each under the existing stories' length, and read by the existing narration unchanged. The blanket is the picnic blanket prop Story Theater already draws (`theater-art.ts`), so the build reuses its palette choices where they fit and the same object appears in both. Each picture is drawn with Pixi `Graphics` from `src/art/palette.ts` in `art.ts`, one `case 'laundry'` beside `dog`, at the same camera and size as the other nine; no new texture or asset.

**Every position has one answer.** Cards belong to a known story and stage, so the unique-answer property holds: the jam spot (0) precedes scrubbing (1) precedes hanging (2) precedes dry (3). A card from another story is never mistaken for one of these because of the family rule below.

## Rules it touches

| Rule | Change |
| --- | --- |
| `STORY_FAMILY` | `laundry: 'wash'`, with `dog`. A suds-and-scrub picture looks alike in both, so neither is ever a distractor for the other, and `canPairStories` already refuses the same family |
| `canPairStories` (level 10 untangle) | Also refuse `laundry` with `bedtime` in both orders, for the same reason `dog` and `bedtime` are refused (the bubble bath and the tub of suds look alike). One shared helper replaces the hard-coded dog/bedtime test: a list of `LOOKALIKE_PAIRS` that holds both, so the next story is added in one place |
| Level 4 pool (`flower`, `butterfly`, `apple`, `dog`) | Add `laundry`. It is a changing-story and a three-picture draw from it (stages chosen as the plan already does) is unambiguous |
| Levels 1–3 pools | Unchanged: they are the stories where each picture is built on the one before, which a laundry sequence is not (a scrubbed blanket is not built on a spotted one), so toddlers and preschool at levels 1–3 never see it |
| Levels 5–7, 9 | Draw from `STORY_IDS`, so `laundry` joins automatically; the extra-picture rules (never a lookalike family, two different kinds at level 7) already cover it |
| Level 10 | Stages 0, 1, 3 of each story; with `laundry` stages 0/1/3 are the spot, the scrub and the dry blanket, three pictures that never appear in the other row's story |
| Level 8 cause pairs, level 11 predictions, Story Theater | Unchanged |

## Bands, levels and accounting

No range changes: toddler 1–2, preschool 2–5, pre-K 4–8 and school 6–13 stay as they are, and saved levels, pins and the save format are untouched. The story simply appears in the seeded draw of the levels above. Misses, hints and the one sticker follow each level's existing rules; assisted completion stays assisted. Because the story is drawn at random, a new `seed` can show it at any of those levels, and `describeLevel` is unchanged.

**Controls, voice and how-to.** No new control. The story sentences are the card voice lines in `voice.ts` (device speech until a clip is rendered; no spoken clip is required to ship, so the build runs no Kokoro). The how-to cards and the ghost finger (`autotouch`) are generic over `STORIES` and need no change. `node scripts/content-barrels.mjs` is run if `voice.ts` changes.

**Co-play and off-screen.** The existing Story Steps suggestions stand. A natural off-screen line for the game page: do the real thing together, wash a doll's blanket or a cloth in a bowl, and let her say what comes next. It is a household moment, with no claim about the past.

## Build slice (queued)

One session, existing-game content tier: typecheck, the `story-steps` unit tests with their counts updated (`STORY_IDS` is eleven; every story four different sentences; `STORY_FAMILY` covers all; `canPairStories` refuses laundry with dog and with bedtime in both orders; the level 4 pool and the draws at levels 5–7, 9 and 10 stay solvable for every seed that picks `laundry`), the upright layout test unchanged, one drawn screenshot of the four pictures, and one filtered `story` browser play of a level whose seed shows it. Docs: the game page's Design notes and its "ten sequencing stories" line, `npm run game-docs`, the study's H7 row and a verification entry.

## Open decisions

- **Whether to ask a family reviewer about the sentences.** They are plain and generic, so the default here is that none is needed; a reviewer is for H6's real-history story, not this one.
- **Where else the picnic blanket could appear.** Story Theater's blanket and this story's blanket share art on purpose; making the theater prop show the jam spot is out of scope.
