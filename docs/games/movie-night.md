# Movie Night

<!-- generated: from src/games/movie-night; edit the text below the end mark (npm run game-docs) -->

**ID:** `movie-night` · **Land:** Painted Canyon · **Ages:** preschool–school · **Challenge:** music · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** combining pictures and sound, matching sound to a pictured event, choosing what a show includes and puts first, revision

| Band | Levels, easiest first |
| --- | --- |
| preschool | 1 |
| pre-K | 1–3 |
| school | 2–5 |

| Level | Plays like |
| --- | --- |
| 1 | Sound for the show: any sound on any picture |
| 2 | Right on time: splash on Duck’s landing |
| 3 | Two moments: knock on the door tap, hello on the wave |
| 4 | Pick the shots: show the find, then the smile |
| 5 | Keep the surprise: the box before it opens |

<!-- end generated -->

**Starts as:** put synthesized sounds on fixed filmed pictures, preview freely and premiere to three friends

**Grows into:** levels 1–3: any sound anywhere; Splash on Duck’s landing; Knock on the door tap and Hello on the wave. Levels 4–5 swap sounds for scarce picture cards: choose which silent shots go in a short show, and in what order, so the audience learns what it asked (the find, then the smile; the box before it opens, the kite kept a surprise). Undo, Return, Stop and supported repairs; Bow finishes one show. Painted Canyon

## Design notes

*Fixed footage and sound placement; [definition](../definitions/movie-night.md).* Put reusable synthesized sound pads on already filmed pictures: Duck waddles, jumps and lands in the pond, or Bunny arrives, knocks, Bear opens the door and both wave. Each picture has one socket. Drag, or tap a pad then a picture; Return or drag a chip back to the tray removes it, and Undo restores one edit. The same glyph identifies a sound on its pad, picture and pictured request. Playback cues it at the action, with a visible pulse even when muted. The island music is silenced.

Levels: **1 Sound for the show** accepts any nonempty strip after Watch; **2 Right on time** asks for Splash on Duck’s landing; **3 Two moments** asks for Knock on the door tap and Hello on the wave. Hello is a brief two-note musical convention, explained by the spoken label. Preschool 1; pre-K 1–3; school 2–3. Watch is always free, while Premiere checks only requested matches. First unmet Premiere is free; the second adds one miss and one automatic hint; each further unmet Premiere adds one miss. The first unmet socket and its matching pad glow after the automatic hint. Free choices never miss. Show me in the shell pause sheet repairs one missing match for one hint and auditions that shot; help on an already matching strip costs nothing. Level 1 has no corrective Help.

Bow alone finishes, once, after a qualifying showing of the current strip. Any edit invalidates that showing. Stop, resize or exit cancel unfinished playback without judgement. Undo never rolls back accounting. A free opening model leaves level 1 empty for her choices; all three levels have a ghost-finger demo. Co-play: swap placing and watching, or let a grown-up look away until the premiere. No shot reordering, inferred emotions, storage, unlocks, camera or microphone; no broader film-literacy outcome is claimed. Device listening/touch and child/coplayer observation remain open.

*Held upright on a phone.* `layout.ts` is a pure function of the view. Upright, the strip is two columns of 230 × 140 squares, the request sits above it, the little screen fills the space between the strip and the pads, and the four sound pads and four round buttons sit up from the bottom edge, clear of the guide. Sideways and an upright tablet keep the 1024 layout; the old tall layout was that 1024-wide plan with a 1100-high control row, which fell off a 1024-tall tablet view and ran off a 768-wide screen, so the tablet plan stays separate from the phone one. `upright.test.ts` covers levels 1–3 on the three phone views, the captioned view and a short 375 × 601 view.

*Levels 4–5, Pick the shots and Keep the surprise (MM4, built 2026-11-24).* The accepted strips are derived from each card's authored facts in `cut.ts`, not listed: level 4 accepts 6 of the 24 full strips (the hat found, Bunny smiling, the smile after the find; the cloud is always welcome) and level 5 accepts 30 of 120 (the opening shot is in, a box shot comes before it, no kite shot comes before it; the butterfly is always welcome). Cards are scarce: each sits in the tray or in exactly one slot; drag tray to slot, slot to slot (a swap), or slot back to the tray, or tap a card then a slot; touch a card to see its shot play on the little screen. Premiere opens only when every slot is full and Watch plays any nonempty strip. Accounting is as in levels 1–3 (the first unmet Premiere is free, the second adds one miss and one automatic hint that glows the next repair, each further adds a miss). Show me applies the repair rule: take the accepted strip nearest the current one (ties to the first in card order, which is the definition’s list order at level 4 and lexicographic by card position at level 5), set its first differing slot to its card, one hint each; on an accepted strip it costs nothing. `layout.ts` `cutLayout` gives a five-card tray 120 wide with 16 between on the upright phone, and a preview box clear of every target sideways and on an upright tablet; `upright.test.ts` covers both levels on every phone view. Footage is drawn in `cut-art.ts`; speech lines for levels 4–5 use device speech until clips are rendered. Browser play: `BROWSER_SUITE=movienight` (`MOVIE_PHONE=1` for the upright phone) and `fingerdemo` at levels 4 and 5.
