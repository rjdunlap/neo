# Compare kept tunes (W2)

Defined 2026-11-15 for [roadmap chunk 22](../ROADMAP.md#chunks). The first build is a small addition to [creature play](../rework/HOME.md#built-slice-2-2026-10-20): hear two kept Song Maker tunes in quick succession and see where their patterns differ.

## The visit

After keeping two different tunes, open Home → Play with your friend and tap the tune plaque. A comparison panel opens with two playable grids, **On display** and **Other tune**, side by side. Both show the notes in their actual beat columns with the existing pitch colors. Each grid has a play glyph and a spoken label. With sound off, the active grid's outline and moving beat highlight show which pattern is playing and when it ends.

Tap either grid to play it once from its first beat. Tap the other to hear it from its first beat and clear the first grid's highlight. After playback, either grid can be played again. The two choices let a player compare a rest, a repeated pitch or a change in the last few notes. A co-player can point to a column and ask what changes there, then tap both grids to find out. There is no quiz or score.

Each grid and the panel's close control use pictured targets of at least 100 logical units, with immediate touch-down feedback. Keep both grids visible at 768 × 1024 and in landscape. A panel scrim takes touches outside the controls so that neither the ball nor a room exit can fire through it. Close returns to the same creature-play scene. The app's ordinary pause behavior still applies. If the newcomer in the basket is already singing, the plaque acknowledges the touch and can open once the song ends.

## Which tunes are available

| On display | Other slot | Tapping the wall plaque |
| --- | --- | --- |
| Present | Present | Open the comparison panel, without starting a tune. |
| Present | Empty | Play the on-display tune with the companion, as today. |
| Empty | Either | Give the current empty-plaque response. A tune taken down remains hidden until restored. |

The two grids read the current profile's `store.creations.tune.current` and `.previous`. The labels describe the current display order because an undo can swap the two. Listening never changes those slots. A new tune is still kept by deliberate request after a Song Maker round. The comparison uses the established bounded tune format, including the same save repair, replacement and restoration behavior. The visitor earns no sticker, progress or journal entry.

## Build boundary

Keep the panel within root `PlayScene`. Use `TunePlaque` and `singTune` from `src/ui/creation-art.ts` and touch targets laid out from `View`. Use scene-owned waits and a playback identity checked between beats and before cleanup. Switching grids or closing the panel invalidates the old playback immediately. A note already sounding can decay naturally. Old playback may neither emit another beat nor clear the new highlight. Leave, scene destruction and player changes release the panel and its playback. Rotate with the panel open to relayout it without starting another tune.

This slice covers listening in creature play. Editing a saved tune and resuming a project would each need their own definition.

## Build acceptance

- Extend the creature-play layout tests at 768 × 1024 and a landscape fixture. Check all three hit boxes and clearance from one another and the view edges. Inspect a portrait screenshot with two distinct tunes visible.
- Extend the filtered `home` browser flow with two kept tunes with distinct phrases. Open the plaque, play the displayed tune, switch mid-phrase, replay the other tune, and leave during playback. Check that the old highlight clears, only the active grid advances, and no new beats run after closing. Check the single-tune shortcut, the empty plaque with a taken-down tune, and a second profile with no tune.
- Compare saved creation slots, stickers, history and journal before and after listening. Use the shell tier for the build. The panel is local to creature play and uses the existing tune data and routes, so the filtered `home` flow covers the affected entry and exit.
