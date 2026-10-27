# The Arcade: a portal-style game grid

Requested by the developer, 2026-10-23: explore a web-portal or arcade way to browse the mini-games, with a grid of games, the bot demonstrations playing, topic tags and the games' names, researched from Kongregate, Newgrounds and Apple Arcade first. This packet holds the research, the plan and the first slice's scope. **Slice 1 is built in [PR #900](https://github.com/rjdunlap/neo/pull/900), reviewed against current main on 2026-10-26;** later slices are proposals.

## What the portals do (research, 2026-10-23)

Kongregate, the Poki and CrazyGames developer pages, Coolmath and Apple's Games-app pages were opened. Newgrounds refused every request (403), so its notes come from its community wiki and search excerpts. No design source was found for the PBS KIDS app.

| Portal | Patterns | Fit here |
| --- | --- | --- |
| [Kongregate](https://www.kongregate.com/) | Search; Hot, Featured and New tabs; about 26 genre chips; shelves with "View all"; card = thumbnail, corner badge (New, Updated, Hot, Top), title, star rating, play count. Category tiles include input type ("Mouse only") and length ("5 minute"). The game page has a "How to play" controls list and related games. A daily "Badge of the Day" calendar | Genre chips, input-type tags and a how-to panel fit. Ratings, play counts, Hot/Top and the daily badge are pressure and rank, so they are left out |
| [Newgrounds](https://newgrounds.wiki.gg/wiki/Portal) (wiki only) | Newest 60 submissions; Best of the Week and Best of All Time; 0–5 scores in colours; new work [judged by vote and deleted](https://newgrounds.wiki.gg/wiki/Under_Judgment); creator-set E/T/M/A ratings as a filter | Only the idea of an age label as a filter carries over. Voting, scores and mocking awards break the house rules |
| [Apple Games app / Arcade](https://www.macrumors.com/guide/ios-26-games-app) | A large hero carousel, a **Continue Playing** row in last-played order (one tap launches), themed shelves, category buttons under the hero. A game page shows when it was last played and a Play button. [App previews](https://developer.apple.com/support/app-previews/) autoplay muted, with a poster frame when autoplay is off | The hero, the played-before row and the poster frame are adopted. Leaderboards, challenges with deadlines and charts are not |
| [Poki](https://developers.poki.com/guide/your-game-page) and [CrazyGames](https://docs.crazygames.com/requirements/game-covers/) | Pill categories; a square grid with mixed tile sizes; a short muted clip that **plays on hover** and opens on the still cover so the switch is seamless | Previews that start from the still picture are adopted. Hover does not exist on an iPad, and many clips at once is what [Netflix viewers](https://www.tomsguide.com/news/how-to-turn-off-autoplay-on-netflix) asked to switch off |
| [Coolmath Games](https://www.coolmathgames.com/) | New This Week, numbered Top 10, categories with counts, an "Iconic characters" row, a random-game button, a one-line tagline per card, no ratings | Character-led cards and a tagline (the level's description) fit; Top 10 does not |
| PBS KIDS, Google's [kids-app guidance](https://developers.google.com/building-for-kids/designing-engaging-apps) | Each show is a recognisable character picture, icons over text-only buttons, navigation always visible | The card is the game's own picture; names are spoken |

**Adopt:** a picture-first card, the title small for grown-ups and spoken for her; one live preview (the spotlight) that begins from the card's picture; a played-before list; topic filters as picture tiles; tags that say subject, age and input; a how-to style detail beside the preview.

**Avoid:** ratings, play counts, Hot/Top/charts, leaderboards, timed challenges and countdowns, daily return hooks, ads, currency, sign-in, hover-only previews, many previews at once, dense small thumbnails and text-only chips.

## Design

**Where it lives.** At the root, the Arcade is a fifth Explore entry beside Places, Favorites, All games and Family play. It is another way to look at the same catalog, so nothing gates and nothing is hidden by band: every game is there, hers first, with an age tag on the others (which still play at `playBand`, as All games does). It is not a new land and changes no game. `classic/` keeps its map.

**One spotlight, still cards.** Every bot demonstration (`Demo`, the how-to card's window) plays the real game, and two cannot run at once: the drag helper keeps one app-wide "one thing moves at a time" lock and every ghost finger uses the same pointer ID (`GHOST_POINTER`). That matches the research anyway. So:

- A large spotlight window plays the selected game's bot at her current level, with effects lowered (`audio.hush`), as on the how-to card. A game with no bot shows its picture large instead.
- Grid cards show the game's own hub picture with its name on a pill and up to two tag pills under it.
- Until she taps something (preschool and up; at lap and toddler it stays on the first card until a tap, since [RW03](HOME-NAVIGATION.md#routes-and-meaning) asks for no carousel that advances itself), the spotlight works like an arcade cabinet's attract mode: after the demo finishes a round, or 20 seconds, it moves to the next card on the page. Once she taps a card it stays where she put it.
- First tap on a card spotlights it and says its title; a tap on the spotlighted card, or the big green Play button on the window, starts the game.

**Filters.** One "Topics" button opens a sheet of picture tiles: All games, Played before (last played first, from the round history) and each of the ten subjects, drawn with that subject's landmark and spoken by its existing subject line. The chosen filter shows on the button. No search and no text-only chips, so it works without reading.

**Tags.** Derived, never hand-kept: the subject (Senses, Music, Art, Animals, Numbers, Everyday, Shapes, Puzzles, Stories, Science), the age seen from her band ("Bigger kids", "Little ones"; hers needs no tag) and "Controller" for a game that couch play can also play. The spotlight adds the level's description and the game's skills.

**Paging.** Six cards a page with Explore's yellow arrows, not drag-scrolling: Pixi 8 never sends `pointercancel`, and telling a scroll from a tap is custom pointer code that a first slice does not need.

**Returning.** A game started here keeps the origin `{ explore: 'arcade', page }`, so the result's Back returns to the same page (and `originArt` shows the Arcade's picture). The chosen filter and spotlit game are remembered for the session, as Explore's pages are.

**Targets.** Cards 150 units, the Topics button and Play button at least 100, page arrows 120; Back and Home stay in the corner, and the bottom-left guide corner stays clear in landscape and portrait.

## Slices

| Slice | What | State |
| --- | --- | --- |
| 1 | The Arcade entry, the spotlight with attract mode, the paged grid with tags, the Topics sheet (All, Played before, ten subjects), return to page, layout and filter tests | Built 2026-10-23 ([PR #900](https://github.com/rjdunlap/neo/pull/900)); device check open |
| 2 | Shelves: horizontal rows (Played before, each subject) on one scrolling page, with tap-versus-scroll handling and a "see all" tile per row | Proposal |
| 3 | Still poster frames: render each game's demo once after a few seconds into a small `RenderTexture` (released on leave) so a card shows real play, not only the hub picture | Proposal; measure memory on the iPad first |
| 4 | Grown-up filters (band, controller/two-player, short/long) and a "Surprise me" button that only picks a card for the spotlight | Proposal |
| — | Ratings, play counts, charts, daily badges, timers | Not planned (house rules) |

## Files (slice 1)

`src/content/arcade.ts` (filters, ordering, tags; tested), `src/creatures/arcade-layout.ts` (the Arcade and its Topics sheet; tested), `src/creatures/home-layout.ts` (Explore's five entries, three over two; tested), `src/ui/icons.ts` (the cabinet picture), `src/app/scenes/ArcadeScene.ts`, `src/rework.ts` (route), `src/content/explore.ts` and `src/ui/origin-art.ts` (the fifth entry and its picture), `src/content/voice-script.ts`.

## For the developer

The Arcade departs from two RW03 working recommendations for Explore: it shows six or more cards a page (RW03: at most four), and its spotlight moves along the page by itself until she taps (RW03: no carousel that advances itself), which is off at lap and toddler. Both follow the request for a portal grid with the demos playing. Decided 2026-10-26 under the developer’s standing delegation: retain the portal grid and attract mode from preschool upward; lap and toddler keep the selected preview still. The larger grid is an optional Explore destination, and a tap stops the changing spotlight. Keep the iPad and child-observation checks in [DEVICE-CHECKS.md](../DEVICE-CHECKS.md); they can inform a later adjustment.

## Not established

How a child under three reacts to a preview that changes by itself; whether the attract mode should stop at lap and toddler; the iPad's frame rate with the spotlight running over the backdrop. These go to [DEVICE-CHECKS.md](../DEVICE-CHECKS.md).
