# Visual identity V1–V2: a Barnyard sheet and an Animal Snack pilot

**Definition, 2026-10-15; slices 1–2 built 2026-10-16.** Roadmap [chunk 21](../ROADMAP.md#chunks), source pilots [V1 and V2](../FAMILY-EXPERIENCE.md#visual-character-and-game-feel). This turns two of the review's pilots into build slices: an art and feedback sheet for one land (the Barnyard) and a touch-acknowledgment pilot in one game (Animal Snack). V3–V6 are not defined here. V4's Animal Snack example ("the fed friend chews its own way") already shipped as food eaten its own way ([PR #366](https://github.com/rjdunlap/neo/pull/366)), so a V4 slice would need a different game.

Nothing here changes levels, bands, saves, stickers, misses, hints or the bot. Each build slice below is one game or one scene, uses existing helpers, and adds no shared helper until a second implemented use needs it (the review's rule).

## V1 · The Barnyard as a place

### Baseline at definition (read from `origin/main`, 2026-10-15)

| Where | What it draws today |
| --- | --- |
| Map spot (`barn()`, `src/art/lands.ts`) | A red barn with a white roof trim, a white X door and a round loft window, standing on a grass ellipse, with three fence posts and two rails to its right. This is the land's only landmark |
| Land scene (`LandScene`) | The shared `Backdrop` with the land's colors (sky `0xbfe6fb`→`0xfff6e0`, three green hills, three clouds, a sun), the cow host and the six games' icons. **No barn and no fence**: inside the land nothing says "farm" except the cow and the icons |
| Land music | `tune(53, 'marimba', 96)` |
| Peekaboo Barn | Its own barn `Graphics`, plus seeded settings (`barnyard`, `garden`, `beach`, `bedroom`), so only some rounds are on a farm |
| Duckling Parade | Seeded meadow treatments (flowers or reeds, [PR #397](https://github.com/rjdunlap/neo/pull/397)); the meadow sets its own hill colors. V1 extends this and never replaces it |
| Roundup | `Backdrop` horizon 0.26; fenced pens with gates (the only fences in the land's games) |
| Egg Catch | `Backdrop` with a sunset sky, horizon 0.72 |
| Animal Snack | `Backdrop` horizon 0.5 with a picnic blanket |
| Critter Sort | `Backdrop` horizon 0.3, no sun |

The five plain backdrops share nearly the same sky and hill greens, so a screenshot of any of them could come from several other lands.

### The sheet

The Barnyard is a **red barn behind a split-rail fence on straw-yellow ground**, and the cow keeps a **milk pail** beside her. These four things are its identity; every Barnyard drawing uses at least the barn silhouette or the fence edge.

| Element | Drawing (palette, `Graphics`) | Where it appears | Rules |
| --- | --- | --- | --- |
| **Landmark: the barn** | The map barn's silhouette: gable roof with white trim, X door, round loft. Far away it is a flat red shape with the white trim only (no door detail below about 60 units tall) | The land scene on the horizon behind the host; a small far barn on the horizon of each game backdrop that has room above the play area | Behind everything playable; `eventMode = 'none'`; never inside a target's hit area; never the brightest red on screen when a red object is playable |
| **Ground edge: fence and straw** | A split rail (two `wood.light` rails on posts, `wood.line` outline) along the land's ground line, and a straw-yellow band (`swatch.yellow.light`) of path where the host stands | The land scene's ground line; Roundup already has fences and keeps its own | Rails sit below the horizon and above the icons' labels; they do not cross a game icon, the signpost or the corner buttons. `landLayout` is unchanged and still returns null rather than shrink a target |
| **Host prop: a milk pail** | A small grey pail with a handle beside the cow | Land scene only | Decorative, `eventMode = 'none'`; the cow stays the tappable host |
| **Sound motif** | Three marimba notes from the land's own pentatonic steps (`src/audio/notes.ts`), played once when the land opens, in the land music's instrument | Land scene, the first time per session (with the greeting, which lands already remember per session) | No new audio files; does not replace the land loop; not played in games |

**Idle → touch → action → consequence → settle (the land scene).** Idle: the barn and fence stand still; the clouds drift as today. Touch: the scenery takes no touches (only the host, icons, sun, clouds and corner buttons do, as now). Settle: nothing new animates after the greeting. The motif is the only new sound.

**Game backgrounds, one game per slice.** A far barn on the horizon is the translation: about 60–90 logical units tall, drawn into the backdrop layer under every playable object, at a horizontal position chosen so it is not behind a target in landscape or in a portrait-shaped view. Egg Catch's high horizon (0.72) and Animal Snack's blanket leave the most room; Critter Sort and Roundup have low horizons and may skip the barn and use only the fence colors. Peekaboo Barn already has a barn and is left alone. Duckling Parade's barn, if any, sits behind the meadow treatment and uses the meadow's hills.

**Acceptance for each V1 slice.** One small screenshot (the map spot and the land scene at about thumbnail size, or the game at one portrait and one landscape view) where the barn or fence is visible without its label; playable objects still read first; scenery has `eventMode = 'none'` and the game's existing hit-target checks pass unchanged; palette colors and `Graphics` only. Whether the land is recognizable to a child without the label is a [device check](../DEVICE-CHECKS.md#needs-a-person-or-a-device), not established by a screenshot.

## V2 · Animal Snack: an answer to every touch

### The dead windows today

`onTap` (`src/engine/input.ts`) fires on touch-down. Animal Snack's handlers then return without any drawing or sound while `busy` is set ([dive gap 7](../deep-dives/animal-snack.md#the-game-today)). An eat (`eat()`) is a 0.35 s glide plus three 0.1 s bites, about **0.65 s**. The windows differ by level:

| Level | What sets `busy` | Dead window |
| --- | --- | --- |
| 1 *munch* (tap an animal) | `tapFriend` around `eat()`; the "yum" speech is not awaited | ~0.65 s |
| 2 *float* (tap a snack) | `tapSnack` around `eat()`; speech not awaited | ~0.65 s |
| 3 *who* (tap the right animal) | A right answer: `eat()`, the **awaited** "yum" speech, then `next()` builds the next question | ~0.65 s plus a spoken sentence, the longest by far (seconds, device speech dependent) |
| 4 *match* (drag) | `drop()` never sets `busy` | None for drags; a tap on an animal pokes it as now |
| 5 *count* (tap snacks, ring) | `tapSnack` around `eat()`; `ring()` around its **awaited** "that's how many", "too many" or "more" speech | ~0.65 s per snack; a sentence after the bell |

Separately, `onTap`'s cooldowns (animal 350 ms, snack 300 ms, speaker bubble 400 ms) drop a repeat on the **same** object before the handler runs. **Those are out of scope for this pilot**: they guard against a double-fire from one touch, and the shared helper is not changed for one game. So the pilot meets "every intentional touch is answered" for touches on a different object, or the same object after its cooldown, not for a second touch within the cooldown.

### The pilot

While `busy` (and not `finished`), a touch gets a **local acknowledgment that never feeds**:

- **An animal**: `Critter.poke()` (its spring squish and a short surprised face), with no animal voice and no food. `poke()` is spring-based on the critter's body, not a tween on the node, so repeated pokes are safe; `eat()` already calls it on every bite.
- **A snack still on the blanket** (`!item.eaten`, visible): a small wiggle of the snack's drawing. Because `eat()` calls `tw.kill(node)` and then reads `node.scale.x` as the starting size, the wiggle must **not** tween the snack node's own scale or position: wiggle the `Graphics` child inside the container `foodArt` returns (its rotation or scale), and leave the node at its base scale 1.2. An eaten or hidden snack gets nothing.
- **Sound**: the existing quiet `sfx.tick()`, at most once per object per acknowledgment.
- The bell (a `RoundButton`) and the speaker bubble are left as they are.

Boundaries: an acknowledged touch does not queue a feeding, does not count a miss or hint (a wrong animal tapped during a right answer's speech at level 3 is **not** a miss), and does not change `eatenCount`, `wrongs`, `glowing`, `idle` or `shouldNudge`. `autotouch()` still returns `null` while busy, so the bot and its demonstration are unchanged. After `finished`, nothing answers (the celebration owns the screen). Destroying the scene mid-wiggle must not touch a destroyed node: use `ctx.tw` (scene-owned) and the existing node guards.

**Idle → touch → action → consequence → settle (one level-2 snack).** Idle: snacks rest on the blanket; after six idle seconds a friend squishes (the existing nudge). Touch: on touch-down the snack starts its 0.65 s trip; a second snack touched during it wiggles once (about 0.2 s) with a tick. Action: the first snack glides to the mouth (0.35 s). Consequence: three bites (0.1 s each) with crumbs, the animal's voice and a hop; the "yum" sentence. Settle: the wiggled snack is back at rest and can be tapped normally once `busy` clears; nothing was queued.

**Rules to test (`logic.ts`).** Put the decision in a pure helper, for example `busyTouch(mode, busy, finished, target)` returning `'poke' | 'wiggle' | null`, and test that it returns `null` when not busy (the normal handler runs), `null` after finishing, `null` for an eaten snack, and never changes a passed-in counts object. The existing rule tests and `snackTouch` tests stay as they are.

## Build slices, in order

1. **V2 · Animal Snack busy-touch acknowledgment** (built 2026-10-16, [#446](https://github.com/rjdunlap/neo/pull/446)). The pilot above. Tier: existing game, unchanged interaction: `npm run typecheck`, Animal Snack's rule tests, one filtered regression play (`WOODS_ONLY=snack`) with a rapid second tap at level 2 and at level 3 that checks misses, hints and fed count are unchanged. `fingerdemo` is not needed (the bot's action is unchanged). Whether the old window felt laggy and whether the wiggle reads as "wait" stay the dive's person check (decision 7).
2. **V1 · Barnyard land scene: barn, fence edge, pail and motif** (built 2026-10-16, [#460](https://github.com/rjdunlap/neo/pull/460)). Land scene only, no game changes. Tier: shared visuals, no navigation change: typecheck, unit tests (the lands layout test must still fit every band in four views), `npm run build` (shared `src/art/lands.ts` or `LandScene` changes), and one small probe that opens the Barnyard and takes a portrait and a landscape screenshot. The `world` suite has no filter and navigation is unchanged, so it is not run.
3. **V1 · a far barn in one game background**, one game per slice, Animal Snack or Egg Catch first. Tier: existing game: typecheck, rule tests, one portrait and one landscape screenshot, one filtered regression play. Peekaboo Barn is excluded; Duckling Parade keeps its meadow treatments. Animal Snack claimed 2026-10-21 on `claude/animal-snack-far-barn` (files: `src/games/animal-snack/index.ts`, `logic.ts`, `logic.test.ts`, possibly `src/art/lands.ts`).
4. **Apply V2's lesson to one other tap game** only after a person has played slice 1 (the review's rule).

## Left out on purpose

- A shared "acknowledge" helper, a universal particle pass, imported art or audio, and changes to `onTap` cooldowns.
- Landmarks for other lands; each would be its own sheet after the Barnyard has been seen.
- V3 (Fill and Dump materials), V4, V5 (comfort settings, which touch saves) and V6 (a grown-up board).
