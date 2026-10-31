# Critter Daily, reviewed for Puddle Island

*Reference review · 2026-10-30 · `claude/critter-daily-research-d94b87`. Documents only: nothing was built. Proposals here are proposals until the developer or a dispatch takes one.*

**What it is.** [Critter Daily](https://critterdaily.com/) is a free website of six small daily puzzles for adults, each led by one animal: Deep Cut (name rarely read Wikipedia pages; Digby the mole digs back through geological time), Mother Tongue (find a mystery language; Pip the parrot climbs its family tree), Ten Numbers (estimate ten amounts; Nutmeg the squirrel fills a jar with acorns), Burrow (seven letters, one minute; Clover the rabbit digs), Crisscross (a mini crossword; Webster the spider spins her web) and Borderline (whose land was this on a historical map; Homer the homing pigeon flies home). No account; puzzles are built from open data (Wikidata, Glottolog, wordfreq, Seshat's Cliopatria).

**How this was checked.** I opened the home page and Burrow in the app's browser pane, played one Burrow practice round (practice does not touch the daily puzzle), and downloaded and read every game's published page, stylesheet and script to see how the animals are drawn and moved. To see every pose at once I rendered the six critters from that code on a local study sheet in the session scratchpad; the sheet and the site's art stay out of this public repository, and this review describes the techniques in its own words.

**Recommendation in one paragraph.** Critter Daily's art is a different style from the island's (flat shapes, no outline, no shading; the [art bible](rework/ART-BIBLE.md) asks for an ink outline and soft cel shading), so the thing to take is not the look but **how little it takes to make an animal feel alive and useful**. Every animal *is* its game's progress meter: the score is where the critter has got to. Every pose is one function of the game's state. Motion comes from a handful of short loops, each turning one part around its own pivot. And the closer you get, the more an object wakes up (an egg that cracks, glows and wobbles faster). Four of those fit the island as proposals (P1–P4); two smaller ones (P5, P6) tidy what exists. The daily rotation, the one-minute timer, the rarity scoring, the stats and the napping animal on a lost puzzle stay out.

## What each game does with its animal

| Game | The animal's job | Poses | What moves |
| --- | --- | --- | --- |
| **Deep Cut** | Digby is the depth meter: each answer adds metres and he tunnels down past named geological periods; a signpost on the shaft labels each answer; the result medal shows the fossil of the period reached | Idle, wave (at the surface), digging | While digging: two front claws flick in turn (about a fifth of a second, alternating), the body bobs, four dirt crumbs fly up and fade; he slides down over 1.6 s with an ease-out while the new tunnel draws in behind him at the same pace |
| **Mother Tongue** | Pip perches on the deepest branch of the language's family tree that your guesses have uncovered; at the top a nest holds an egg | Perched, cheer (wings up) | Perched: a small hop every 1.6 s and a slow head tilt. The egg gains a crack per close guess (0–4), a glow that grows brighter and wider, and a wobble that speeds up from 2.6 s to 1.4 s. Solved: the chick hatches. Unsolved: the egg sleeps with floating z's |
| **Ten Numbers** | Nutmeg's glass jar fills with acorns to your share of the possible score; each answer's closeness is an acorn filled part-way, like a star rating | Idle, wave, cheer | Tail swish and a gentle bob always; a paw wave on top. The jar's fill is a patterned rectangle clipped to the jar shape and slid up |
| **Burrow** | Clover sits in a narrow column of soil bands; each word moves her down and lengthens the tunnel above her | Idle, wave, dig, cheer | Two plain transitions: the tunnel's height and her position, both 0.6 s ease-out. A wrong word shakes the letters; a found word pops into the list |
| **Crisscross** | Webster's orb web fills in with the share of squares filled; a finished fast solve adds dew drops | Wave, dangle (on a thread), cheer | A slow wave and a bob; the web's spiral is drawn up to the progress |
| **Borderline** | Homer flies along a dotted trail toward a flag as guesses get closer, and lands by it when the place is found | Stand, fly, cheer, nap | Wing flaps in flight; z's float up while napping |

Around the games: the home page lists the six animals as cards, each with one idle loop (a waving paw, a hop or a tail swish); a strip of the six faces at the top of every game is the navigation; loading lines speak as the animal ("Clover is stretching her paws…"); and both the system's reduce-motion setting and a motion setting in the site's settings (it sets `data-motion="less"` on the page) stop every loop.

## How the animals are drawn

- **Shapes.** Each animal is 12–35 plain ellipses, circles and a few curved paths, drawn around its own centre in a small coordinate box (about 60–90 units across), so the same drawing works as a 48 px status icon, a 76 px card and a large result picture.
- **One face recipe for the whole cast.** Dark eyes with one white glint, soft pink cheek circles, a pink nose, a short curved smile, a cream belly or muzzle, and one ink colour for lines. The island's [art bible](rework/ART-BIBLE.md#shared-rules-every-creature) already sets the same recipe (blush ovals, cream bellies, glossy dark eyes), which this confirms.
- **Poses are a function, not frames.** Each animal is one function that takes a pose (idle, wave, dig, cheer, nap…) and returns its drawing. Shared parts (body, head, tail) are reused; a pose swaps only what changes (a raised paw, eyes closed into happy arcs, wings up). The game never stores the art; it redraws the animal from its state.
- **Motion is a few loops around part pivots.** A waving paw, a claw, a wing or a tail is a single part given its own pivot point (the shoulder end, the tail root) and a short back-and-forth rotation (6–25 degrees, 0.2–1.8 s). A body bob is a 2-pixel up-and-down. Travel (digging deeper, flying along the trail) is one long ease-out move with the faster bob running underneath it, so the animal both arrives and keeps busy.
- **Progress is drawn, not counted.** The tunnel behind the mole is the same path at a growing length; the web spiral and the jar fill are drawn to a share between 0 and 1.

## Against the island's rules

| Critter Daily | Island rule or state | Verdict |
| --- | --- | --- |
| The animal is the progress meter | No shared in-round progress picture in `GameScene`; games show their own | **Take** (P1), counting completed steps only |
| An object that wakes up as you get closer | Hints glow after two misses; Bouncy Launch already asks "nearer" or "farther" in words; no picture that warms up for searching or estimating | **Take** (P2), as encouragement, never as a count of wrong guesses |
| Poses from state; part pivots; travel plus bob | `src/art/critter.ts` builds code-drawn critters from a spec with moods; the `CompanionRig` (`src/creatures/companion.ts`) already has `hop`, `cheer`, `spin`, `wiggle` and `poke`; the [illustrated rig](rework/CREATURE-ART.md) blinks, reacts to touch and holds a mood. Walking is written per game (Mail Carrier, Critter Crossing, Keep House, Caravan Days) | **Extend** (P3): a few more verbs and one shared travel helper |
| Tunnels, trails and webs drawn to a length | Places and land maps draw fixed paths | **Take** (P4) |
| The result picture is the thing learned (the fossil of the period reached) | One sticker per round, with seeded sticker art | **Confirms** (P5): small |
| Reduce-motion honoured everywhere, plus an in-app switch | Only a few games and the chooser read `prefers-reduced-motion`; no grown-up switch | **Take** (P6) |
| Loading lines written in the animal's voice | Navigation never requires reading | Optional; on the island it would be a spoken line in `voice-script.ts` |
| A strip of animal faces as navigation | Lands and the home spot | Already covered |
| New puzzles every midnight; a "come back tomorrow" countdown | Nothing expires or rotates | **Out** |
| Burrow's one-minute round | No round-ending timers | **Out** |
| Rarer answers dig deeper; result tiers; stats and streak screen | No speed, streak or score pressure; one sticker per completed round | **Out** |
| The pigeon naps or the egg sleeps on a lost puzzle | No losing and no guilt; a sleepy mood exists but must not mean "you failed" | **Out** as a failure face |
| Analytics scripts (three trackers) | Offline PWA with no tracking | **Out** |
| Reading-heavy play for adults | Navigation never requires reading | Not applicable |

## Proposals

| # | Proposal | Where it fits | Status |
| --- | --- | --- | --- |
| **P1** | **The companion walks the round.** A short path of stones, one per step of the round, drawn inside the game's own scene (along the top edge, or as part of the play picture), never across the bottom-left pet or the corner buttons; the creature steps to the next stone each time a step is done (a plate filled, a carriage coupled) and cheers at the last one. It counts completed steps only, never misses or time, and is skipped for free creative play. The definition must settle pet clearance and whether it is clutter at the `lap` and `toddler` bands (depth before pressure). Pilot inside one game with a fixed step count before any shell version | One game first; a shell helper only if a second game wants it | sketch |
| **P2** | **Warmer, not wrong.** For searching and estimating games, an object that wakes up as her answer gets closer: an egg that wobbles faster, a seed that glows and sprouts, a burrow whose light grows. It replaces nothing in the miss/hint rules and is never shown as a count of wrong tries | A hide-and-find or estimate game's own `logic.ts` (closeness) and art | sketch |
| **P3** | **More verbs and a travel helper.** Extend the rig's existing `hop`/`cheer`/`spin`/`wiggle` with a few held actions (dig, wave, flap, dangle, carry), each one part rotating around its own pivot in a short loop, plus one shared "travel": a single ease-out move with a quick bob underneath, for the games that now each write their own walking. Games and the welcome adventure then ask for an action by name instead of animating parts themselves | `src/art/critter.ts` and `src/art/creatures/illustrated.ts`; check the [reuse map](DESIGN.md#reuse-map) first | define |
| **P4** | **Paths that draw in.** A trail, tunnel, vine or river drawn to a growing length, so the way she went appears behind her (on the rework's places map, or in a digging or climbing game) | A small helper in `src/engine/` if two places need it | idea |
| **P5** | **The sticker shows what she reached.** Where a round has a destination that teaches (a layer reached, a creature found), the round's seeded sticker art can be that thing | Per game, at its next batch | confirms |
| **P6** | **Calm motion everywhere.** One shell check that honours the system's reduce-motion setting, plus a grown-up switch on the grown-ups' page, so idle loops, bobs and particles stop while taps still give feedback | `src/parent/panel.ts` and a shell helper; affects every game | define (not a developer-only call under the [standing rules](archive/DECISIONS-2026-10-23.md#standing-rules); the definition should audit which games' feedback is motion-only) |

No line goes to READY: every proposal needs a definition first.

## Not established

- How Critter Daily feels on an iPad or to a child: it is an adult site and was looked at only in Chrome.
- The site's other five games were opened and read but not played; their animations are described from their code, not from a played round.
- Whether the island's illustrated rig can rotate single parts as freely as flat shapes; the [rig notes](rework/CREATURE-ART.md#rendering-and-animation-cost) suggest the cost is small, and P3's definition should check it.
