# Location capacity: a land takes a new game by turning a page

Documentation packet, 2026-10-24, [PR #914](https://github.com/rjdunlap/neo/pull/914), branch `claude/location-capacity`, source base `edd6a74b`. It defines the READY line found by the [genetics G2 placement check](../deep-dives/subjects/genetics.md#build-slices-in-order) ([PR #912](https://github.com/rjdunlap/neo/pull/912)). **Built 2026-10-24 ([PR #915](https://github.com/rjdunlap/neo/pull/915), `claude/location-pages`).** `LAND_SPOTS` stayed 13: the capacity sweep confirmed it, so it was not lowered. Beach, Painted Canyon and Music Mountain failed the sweep and their scenery plans were reworked (a shared `scanPlace` in `src/app/scenes/meadow.ts` keeps their minimum things); the other locations passed unchanged. The "contract text" below is now in DESIGN, ISLAND-REVAMP and AGENTS. The text that follows is the definition as written, in the future tense.

**Recommendation.** A land whose screen would hold more than **13 spots** splits its games into pages of about equal size. Each page has the host, its share of the games, the signpost, and pictured arrow spots at both ends of the path. Every page fits on one screen through the same `landLayout`, and no target shrinks. A twelfth location, or splitting a land into two `LandId`s, stays the developer's call ([alternatives](#alternatives-considered)). It is not needed for this.

## What the probe found

On `origin/main` at `edd6a74b`, a throwaway vitest probe was run against `landLayout`, `visibleIn` and `olderIn`, then deleted. Every land's horizon is 0.4. "Spots" means host, games and signpost together.

- **Only 4:3 iPad landscape (1024×768) binds.** There `landLayout` fits at most 14 spots (13 games plus the host), in three rows of 160×146 boxes at y≈325, 532 and 738. At ten or more spots the rows reach the bottom edge. Portrait (1024×1365) fits 23 or more, the phone 26, the notched phone 23.
- **The scenery fills up before the layout does.** Rainbow Meadow passes `meadow.test.ts` with 13 spots (prek, 12 games) and fails at 14: no free 40-unit cell is left for its six flowers. Tinker Lab and Puzzle Peaks pass at 14 today only because their scenery asks for less.
- **Scene tests only check the counts the catalog happens to produce.** Each `src/app/scenes/<location>.test.ts` lays out `visibleIn`/`olderIn` for each band. Music Mountain has never been tested above 7 spots and Painted Canyon never above 8. One added band-limited game adds a signpost and breaks them (Painted Canyon at preschool n=7, Music Mountain at toddler n=6). Fullness is also not monotone: in landscape, two full rows at 9 spots are tighter than three rows at 10–13.
- **Today's largest screens:** 12 games at school in Rainbow Meadow, Counting Cove, Cozy Village, Story Grove, Puzzle Peaks (plus signpost) and Tinker Lab (plus signpost); 13 at grown-up in Puzzle Peaks and Tinker Lab; 12 behind Lantern Lake's signpost at every child band, and 12 behind Puzzle Peaks' at lap.

A full field cannot keep its scenery by re-planning, because at 14 spots the 4:3 field has no free cell left. Whatever rule is chosen, capacity has to become a tested property, not an accident of the catalog.

## The rule

- **Screen budget `LAND_SPOTS = 13`** (provisional; the build confirms it by the sweep below). This counts every spot on one screen: host, games, signpost and arrows. It equals the most that the tightest scenery (Rainbow Meadow) passes today.
- **One page when it fits.** If `1 + n + (sign ? 1 : 0) ≤ LAND_SPOTS`, where `n` is the number of games on the side being shown (hers, or the bigger kids'), the land looks exactly as it does today: no arrows and no change.
- **Otherwise, balanced pages.** A paged screen holds at most `K = LAND_SPOTS − 3 − (sign ? 1 : 0)` games: 9 with a signpost, 10 without. The 3 is the host plus both arrow slots. The page count is `ceil(n / K)`. Games split in stable land order, earlier pages taking the extra one, so page sizes differ by at most one: 13 → 7 + 6, 22 → 8 + 7 + 7. Adding a game never turns a full screen into a nearly empty second page.
- **A paged screen's path:** host, ← (except on the first page), its games, → (except on the last page), signpost. The arrows are `landLayout` spots like the signpost. They come from the same rows, and their touch area is the 100-plus-unit `spotRect`, so `landLayout` gets one extra count (`arrows: 0 | 1 | 2`), returns `prev`/`next` spots, stays pure and still returns null rather than shrink a box. An arrow is drawn as a path marker with a big arrow picture, never a word, and gives touch-down feedback like a game spot.
- **Both sides page.** The bigger kids' side behind the signpost uses the same rule (Lantern Lake's 12 at a child band, for example, become 6 + 6 with a signpost). The signpost is on every page, in the last spot, and counts against the budget. Turning it opens the other side at that side's remembered page, or its first.
- **Order and gating.** Pages follow `land.games` order filtered by band. Nothing is locked, hidden by progress or rotated; every game is at most a few arrow taps away; page 2 is not "harder".

## Speech, suggestions, keys

- **Turning a page** reuses Explore's `explore.page` line ("{n} more!"), with `n` set to the new page's game count, and the same transition as Explore's arrows. The prev arrow says the same line. No new voice line is needed. The first visit's land line is unchanged.
- **The host's suggestion** (`suggest`) still picks from every game on the side being shown. If the suggested game is on another page, the land turns to that page (with the page line) and then the game glows. Tapping the host never suggests a game she cannot see.
- **Keys and a pad:** the ring over the field includes the arrows in path order. Pressing one turns the page and puts the ring on the new page's first game.

## Return routes and memory

- `Origin`'s `{ land: LandId }` gains an optional bounded `page` (an integer, clamped on arrival to the current page count, the way `clampPage` does in `src/content/explore.ts`). Home or Back from a game returns to the page it was opened from. The same holds through Next game, Again and Next level.
- Each land remembers the page of each side for the session, next to `olderOpen` in `LandScene`. `forgetLands()` clears it when another player comes to the screen. Nothing is saved: no `SaveData` field and no repair, since origins are not persisted.
- `go.land(id, page?)`. Explore Places, the map and the root's location entry open the remembered page, or the first.

## Both scenes

Classic `LandScene` and the root's `LocationScene`, which extends it, share all of this. Each location's scenery plan already keeps out the field's spots through the shared `meadowKeepOut(layout, view)`. That function adds the `prev`/`next` spots, so every plan avoids the arrows without per-scene code. Postcards (`resultPlace`/`ResultBackdrop`) draw no spots and are unaffected. PlaceScene (the home spot path), Explore's four-card pages and couch play are unchanged.

## Tests the build adds (the acceptance)

1. **Capacity sweep in every location test.** Each `src/app/scenes/<location>.test.ts` replaces its catalog-count loop with a sweep: `games = 1 … LAND_SPOTS − 1` with the sign off, `1 … LAND_SPOTS − 2` with it on, and every arrow count (0, 1, 2) the budget allows, in all four views. Each case keeps the scene's existing minimums (Meadow's six flowers, Canyon's spring, cactus and animal, and so on), stays on screen and off every keep-out. A new game can then never break a location this way again.
2. **`lands.test.ts`:** for every land, band and side, the pages are a partition of the side's games in order; sizes differ by at most one; every page is within `LAND_SPOTS`; `landLayout` is non-null for every page in every view; a land that fits shows one page with no arrows. Every arrow's `spotRect` is at least 100 units each way.
3. **`origin.test.ts`/routes:** Back from a game opened on page 2 returns to page 2. An out-of-range page clamps. `forgetLands()` resets pages.
4. **Fixing what the sweep finds.** Painted Canyon and Music Mountain are known to fail above their catalog counts. The build reworks those plans (and any other the sweep catches) to pass the full sweep, keeping each place's minimum things. It does not lower `LAND_SPOTS`. If some plan truly cannot reach 13 at 4:3 landscape after rework, the build lowers `LAND_SPOTS` island-wide (not below 11), records the measured value here and in DESIGN, and accepts that more screens page.

**Today's screens that change** (the only ones above 13 spots), all pages of 6 or 7:

- Puzzle Peaks and Tinker Lab at school, and Tinker Lab at prek: 12 games plus a signpost become 6 + 6.
- Both lands at grown-up: 13 games become 7 + 6.
- Lantern Lake's bigger-kids side at every child band, and Puzzle Peaks' at lap: 12 plus a signpost become 6 + 6.

Every other screen in today's catalog stays as it is.

## Contract text the build changes (done in the build)

- [DESIGN.md](../DESIGN.md) **Lands** paragraph: "its games on one screen through `landLayout`" becomes "each page of its games on one screen", with `LAND_SPOTS`, balanced pages and arrows; the integration-contracts row for island lands follows.
- [ISLAND-REVAMP.md](../rework/ISLAND-REVAMP.md#the-location-in-the-new-shell) "One screen" bullet: adds the page rule. Its "no land above the 13 that `landLayout` already fits" becomes "no page above `LAND_SPOTS`".
- `AGENTS.md`, step 5 ("every land still fits on one screen at every band") and the Island lands row: change to "every land page fits on one screen at every band; a full land pages, never shrinks".

## Check tier for the build

Shell and navigation tier: typecheck, unit tests, build, the `world` browser suite (navigation changed), and the production offline check. Add one scripted look at a paged land: the root's Rainbow Meadow with a test-only extra game, or Tinker Lab at school, in landscape and portrait. Take one screenshot each and confirm that the arrows turn the page, that a game launched from page 2 returns to page 2, and that the host's suggestion turns to the right page. No new game registers in this slice.

## Downstream

After this build, `sprout-shuffle` (genetics G2), `food-web-workshop`, `cue-studio` and [#733](https://github.com/rjdunlap/neo/pull/733)'s `species-comeback` can register in their decided lands. Each still runs its own placement check, which now means only "its land's pages pass the sweep".

## Alternatives considered

- **Re-plan the scenery around a full field.** Ruled out: at 14 spots the 4:3 field has no free cell, and the problem returns with the next game.
- **Smaller boxes.** Ruled out by the contract (`landLayout` never shrinks a target below 140×130), and it would only move the limit.
- **Split a land into two `LandId`s, or add a twelfth location** (ISLAND-REVAMP names Savanna). Each needs a new map spot (the map already holds 13), a voice line, a host or resident, a backdrop, art requests and a scenery plan, and it moves games' homes. It is a fine later choice for content reasons. It is the developer's call, not a capacity fix, and it would not stop the next full land.
- **Page only on overflow, keeping today's 14-spot screens.** Rejected because the limit would then differ from land to land (Tinker Lab 14, Meadow 13), and the sweep needs one island-wide budget.
