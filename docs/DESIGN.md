# Puddle Island: design and architecture

## Vision

Puddle Island is a home-made iPad learning game for the developer's daughter, who is about to turn one in October 2026. It is being built ahead of when she may use it, with room to grow through age six. The inspiration is the discovery and playful learning of Jumpstart, the companion and world of Neopets, and the variety of small games found on Kongregate.

The original request was to begin with design, architecture, and game ideas before coding. The follow-up asked for more minigames and modes that scale in difficulty as they are played. The project now has seventeen games and three expansions described in [ROADMAP.md](ROADMAP.md).

The developer is not an artist. All game artwork is generated in code with PixiJS Graphics, and sounds and music are synthesized with Web Audio. The visual direction should be achievable with the shared shape, animal, scenery, and particle builders, without sprites or an external asset pipeline.

## Play principles

- Large touch targets (at least 100 logical units), immediate touch-down feedback, and forgiving dragging.
- Spoken instructions; reading is never required to play. Tapping the pet repeats the instruction.
- Gentle feedback for mistakes, hints, and a glow after two misses. No failure screens.
- Predictable rewards: one sticker for each completed round.
- No ads, purchases, streaks, or timers that end a round. Session length is a grown-up setting, with a gentle goodnight flow.
- Early play supports a grown-up and child playing together. Games can include co-play prompts and related off-screen activities.
- Difficulty changes quietly within a chosen age band. Grown-ups can pin a level.

## Current implementation

Status checked against the repository on 2026-10-05. The island expansion is implemented; validation results are tracked in [VERIFICATION.md](VERIFICATION.md).

| Area | Current behavior |
| --- | --- |
| Platform | TypeScript, Vite, PixiJS 8; installable PWA with an offline asset cache |
| Navigation | Start screen, hatching, ten-region island map, region scenes, game host, sticker book, goodnight scene |
| Games | Bubble Pop, Rainbow Fingers, Jelly Drums, Peekaboo Barn, Splish Splash, Duck Pond, Shape Sorter, Color Garden, Pattern Train, Memory Match, Letter Trails, Robot Path, Size Parade, Bug Builder, Story Steps, Feelings Faces, Monster Munch |
| Progression | Per-game level ladders, automatic adjustment within age bands, grown-up level pins |
| Pet | Four-tap hatching, eight colors, spoken name choices and grown-up name entry; customized guide shared across scenes |
| Rewards | Five illustrated pages with free sticker placement and a paged tray; positions saved as page fractions |
| Saves | Version 2 local IndexedDB record with migration from version 1, pet and world state, sticker placement, backup and restore |
| Grown-up controls | Child name, pet name and color, age band, session length, sound settings, play history, level settings, and which band opens each clouded game |
| Audio | Synthesized sound effects and music, device speech driven by line IDs |

The current age bands in `src/progress/bands.ts` are lap (18–24 months), toddler (2–3 years), preschool (3–4 years), and pre-K (5–6 years). These are application groupings, not developmental assessments.

Each game supplies level ranges for the bands it supports. Two consecutive smooth rounds at the current level (at most one miss and no hints) move up; two struggling rounds (at least four misses or at least two hints per round) move down. Both changes stay within the selected band's range. Modes can change the task itself, rather than merely adding more objects.

## Architecture

### Application and scenes

`src/app/App.ts` owns the Pixi application, scene transitions, logical view, and frame loop. `Scene.ts` provides content, particle, and UI layers plus tracked updates. `routes.ts` creates scenes, while `session.ts` handles the session timer. The 1024×768 design area fits the display; layouts respond to the available logical width and height.

The game shell in `GameScene.ts` owns navigation, the guide pet, instructions, co-play prompts, saving, difficulty progression, stickers, and celebrations. This lets a new minigame concentrate on its own activity.

### Minigame contract

Each `src/games/<id>/index.ts` exports a `GameModule`, registered in `src/games/registry.ts`. Metadata includes its region, supported bands, level ranges and descriptions, spoken title, music, hub icon, and sticker drawing. `create(ctx)` returns a game with `start`, `update`, `resize`, and `destroy` methods.

A game draws into `ctx.stage`, uses the shared input, drag, tween, particle, and voice helpers, and reports completion through `ctx.finish({ misses, hints })`. Spoken lines belong in `src/content/voice-script.ts`. Shared art and audio should be reused so new activities feel part of the same world.

### Art, input, and sound

- `src/art/`: palette, parametric critters, props, shapes, scenery, particles, and sticker framing.
- `src/engine/`: view scaling, random generation, tweens, touch filtering, and dragging.
- `src/audio/`: audio unlock and buses, instruments, sound effects, generative music, and speech.

Use the shared palette and pentatonic note steps. Route taps through `onTap` and drags through `drag.ts` for consistent cooldown, palm rejection, and finger offset behavior.

### Persistence and grown-up UI

`src/progress/save.ts` defines the save record and `migrate()`, which repairs incomplete or invalid input. `store.ts` persists it through `idb-keyval`. New fields need defaults, migration behavior, and tests so existing progress survives updates.

The current save contains profile, settings, game statistics and recent round history, and earned sticker records. It also stores pet customization, opened regions, the highest band visited on the map, and optional normalized sticker placements. Invalid or unknown placement pages become unplaced stickers; legacy saves keep their progress and start with an unhatched pet.

Grown-up controls are plain HTML in `src/parent/panel.ts`. The parent gate is on the island map and requires holding both top corners for three seconds.

### Delivery and verification

Vite builds a static site; `vite-plugin-pwa` generates the manifest and offline cache. Pushes to `main` deploy through GitHub Actions. Commit and push only when asked.

Unit tests cover saves, difficulty, game registry constraints, view geometry, critters, and the musical scale. The dev-only `neo` and `kit` browser helpers support scripted play-throughs. New game verification should include a completed round, wrong answers, hints, and resizing. Production offline behavior must be checked with the built app, separately from the dev server.

## Island and new activities

`src/content/world.ts` owns the ten stable region IDs, eight pet colors, and five sticker-page IDs. `regions.ts` supplies each region's normalized map position, generated landmark, spoken title, and backdrop. Story Grove hosts Letter Trails and Story Steps. Puzzle Peaks hosts Pattern Train, Memory Match, and Size Parade; Tinker Lab hosts Bug Builder and Robot Path. Region scenes show two large landmarks at a time, with arrow navigation and page dots, so additional games cannot overlap existing choices.

The map shows only clouds over regions without activities for the selected band. Opened region IDs and the highest band visited are saved. Increasing that band reveals newly available regions with a party once; decreasing and restoring a band does not replay the birthday. A registry test enforces that regions stay playable at later bands.

Pattern Train advances from AB through AAB/ABB and ABC, animal patterns, missing middle cars, bell patterns, and two-car gaps. Bell choices can be auditioned before confirming. Memory Match grows from four to sixteen cards, then teaches number/dot, two-attribute, and upper/lowercase matches. Exploring unseen cards does not count as a miss.

Letter Trails defines all 26 capitals as ordered strokes. A firefly and moving beacon guide the finger; successive checkpoints enforce the trail while tolerating imprecise motion. Each finished letter becomes a code-drawn illustration with a spoken association. Top levels spell short words and the child's name. Accented Latin names normalize to A–Z; names with no supported letters fall back to PIP. Additional scripts would need their own stroke data.

Robot Path uses a visible arrow program, a play button, and editable steps. Its six levels add turns, grid size, rocks, and longer routes. Every board has a tested solution within its program limit. The standard gentle mistake feedback and hint glow apply across the new games.

The second expansion broadens toddler play and introduces measurement, symmetry, and causal storytelling. Each new game supports toddler, preschool, and pre-K and uses the existing save, adaptive difficulty, and reward systems; no save migration is needed.

- **Size Parade:** four levels ask for the biggest or smallest friend across four short questions. Four later levels ask the child to drag three or five friends into an ascending or descending line. Friends share an appearance and baseline, so size determines the answer; positions are shuffled. A fixed large hit area keeps the smallest friend easy to select.
- **Bug Builder:** two guided levels show pale matching shape outlines; two copy levels use a separate small model; three mirror levels ask for matching wings, ending with two columns and six spots. Reusable stamps return to the tray. The final palette contains repeated shapes and colors, requiring both attributes to match. Drops outside a spot are exploration, not mistakes.
- **Story Steps:** seven levels progress from a shown beginning through three- and four-picture ordering, missing middles, and unrelated distractors. Four stories depict a flower, a block tower, a snow friend, and a butterfly. Completed pictures are narrated in sequence; the replay button reads only already placed pictures. Cards belong to a known story and stage, so every missing position has one answer.

These activities open Puzzle Peaks, Tinker Lab, and Story Grove at toddler. Band labels remain parent-selected starting points rather than assessments.

The third expansion adds two games that start at lap, because the child is youngest now and each lap region previously had a single activity. Both support all four bands.

- **Feelings Faces (Cozy Village):** the critter gained `sad` and `calm` moods, with brows and a tear so feelings read even at sticker size. Lap play is cause and effect: four feeling bubbles change the big pet's face, with a matching sound, and tapping a sad pet gives it a hug. Later levels match the pet's face, find a named feeling, choose what helps a need (a hug, a pillow, an apple, or a scarf), watch a small event and choose how the pet feels (the pet stays `calm` until answered, so the event carries the answer), and find which of four friends feels a named feeling. The big pet replaces the corner guide and repeats the instruction when tapped.
- **Monster Munch (Counting Cove):** a code-drawn monster gapes, chews, burps, and shows eaten food in a tummy window. It complements Duck Pond rather than repeating it: lap levels feed by tapping, toddler levels count along and give one cookie to each monster, and preschool levels ask for an exact order (cookies, or cookies and apples) that the child completes by ringing a bell. A full monster refuses another of that food, which counts as a miss. Pre-K shares cookies fairly among two or three monsters; unequal shares hand the extras back to the tray, then the child says how many each monster got.

Pure rules live in each game's `logic.ts` with unit tests for answer uniqueness, tray sizes, refusals, and fair shares.

## Document provenance

This local document reconstructs the design from the user's original brief, supplied continuation plan, and current source code. It is not a copy of the full earlier design document or its roughly 30-game idea catalog.

The [historical design artifact](https://claude.ai/code/artifact/a7666bb8-0fdf-429b-b5df-2ab53a112913) is retained only as a reference. Working on the project does not require access to that service. Keep current decisions and status in this repository.
