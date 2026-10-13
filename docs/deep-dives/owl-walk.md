# Owl Walk Home deep dive

*ID `owl-walk` · bands toddler, preschool, pre-K · levels 1–4 on 2026-10-12 · session `claude/owl-walk-gameplay-review-a26902` ([PR #248](https://github.com/rjdunlap/neo/pull/248))*

This dive started from a play-through by the developer: at level 2 the owls did not seem to take turns, and the player was tapping the owl rather than choosing a stone, so the colors and shapes taught nothing. Both observations are correct and come from how the rules are built (see the gaps below). The dive therefore spends most of its space on one question first: what is this game for, given what the catalog already teaches?

## The game today

A night path of stepping stones runs in two rows to a nest in a tree. She turns over a color card from a deck and taps an owl; the owl hops, stone by stone with a marimba note each, to the **next free stone of the card's color ahead of it**, skipping a stone another owl stands on, or flies straight to the nest when no stone of that color is left. Every stone and card also carries a shape (red heart, blue circle, yellow star, green triangle). Everyone wins together: the sun only rises when every owl is home, and there is no clock. Rainbow Meadow (`lands.ts`, with Shape Sorter, Color Garden, Dot Link, Tangram Town, Garden Grow and Treasure Map); region `rainbow-meadow`; `skills`: colors, taking turns, shared goals, comparing distances; music `STYLES.lullaby`. Not a couch game (the roadmap's couch-scoring item "considered and set aside" it). The ladder (`PLANS` in `logic.ts`; `LEVELS` in `index.ts`: toddler 1–2, preschool 1–3, pre-K 2–4):

| Level | Mode | Owls, colors, stones | Bands whose window includes it | What she does |
| --- | --- | --- | --- | --- |
| 1 | `one` | 1, 3, 10 | toddler, preschool | Flip a card, tap the owl. The game finds the stone and hops it |
| 2 | `turns` | 2, 4, 12 | toddler, preschool, pre-K | The same, then the pet takes a turn (it hops the owl that goes farthest). She taps whichever owl she likes |
| 3 | `choose` | 3, 4, 14 | preschool, pre-K | The same with three owls. `choose` is not read anywhere except the opening line, so the rules are level 2's |
| 4 | `farthest` | 3, 4, 16 | pre-K | Each owl shows a numbered ring where this card would land it; she taps the owl with the biggest number. A shorter hop is a miss with both numbers said; two misses glow the best owl and count one hint |

**What a round draws from.** Four stone colors (the plan uses the first 3 or 4), each tied one-to-one to a shape; three owl colors (purple, brown, pink); one backdrop (a purple-to-blue night, seed 77); stones laid out in two rows by `stoneAt`. `makePath` deals every color once per round, shuffled, so a color never repeats side by side and each appears at least twice. `drawCard` picks a color uniformly from the plan's colors and ignores the board.

**What the rules do, measured.** I played greedy farthest-owl turns on 2,000 seeded boards per level in a throwaway script outside the repo (it only imported `logic.ts`; nothing under `src/` changed):

| Level | Turns to bring everyone home | Share of turns where the owl chosen changes the hop length | Share of moves that are a long flight home (from more than three stones away) |
| --- | --- | --- | --- |
| 1 | about 5.6 (one owl, so about 5.6 taps of her own) | n/a | 1% |
| 2 | about 8.5 (about 4 hers) | 74% | 4% |
| 3 | about 12.4 (about 6 hers) | 84% | 10% |
| 4 | about 13.9 (about 7 hers) | 85% | 6% |

So the owl she taps really does matter most of the time, but nothing tells her so until level 4, and about one move in ten at levels 3 and 4 is the "no stone of that color ahead, fly home" rule, which is never explained.

**Couplings.** How-to: a goal plus four step lines scoped by `LevelLine` (`howto.ts`); level 1's says "tap the owl". A ghost finger (`touchDemo`, `autotouch()` taps the deck, then the owl `owlToHop` picks). Voice: `owl.*` lines, including `owl.tap-owl` ("Now tap an owl. It hops to the next {color} stone."). Browser: `BROWSER_SUITE=shortlist SHORTLIST_ONLY=owls` plays levels 1–4 (a wrong owl and a hint at level 4, scores `[0, 0]` at levels 1–3 and `[2, 1]` at 4); `fingerdemo` plays 1–4 clean. No journal entry, picnic step, creation or couch entry.

**Known gaps** (read from the code and the simulation; none seen on a device).

1. **The tap goes to the owl, and the game does the matching.** `hop()` finds the stone. She never decides which stone, reads a color against a stone, or notices that a stone is next. The two things the game is about (match the card, find the next one ahead) are done for her, and the instruction literally says "tap an owl". This is the developer's observation, and it holds at every level.
2. **The owls do not take turns; the players do.** The turn belongs to the child, then the pet; any owl can move on any turn. At level 2 she cannot tell why one owl rather than the other, because nothing says it matters (it does, 74% of the time).
3. **Level 3 plays like level 2.** `choose` is only an intro line, so the "choose which owl" in the how-to and `describeLevel` has no rule behind it. Nothing at 2 or 3 lets her *use* a choice.
4. **Shape duplicates color.** Each shape appears with exactly one color, so a card's heart never says more than its red. It helps a child who cannot tell the colors apart, but she is never asked to match by shape.
5. **Fly-home is never said.** When no stone of the card's color is ahead the owl crosses the whole path to the nest. It is a fair rule, but the only voice is "Home in the nest!", after the fact.
6. **Only level 4 can miss.** Levels 1–3 score `[0, 0]` every time, so they never step down and always read as smooth (two smooth rounds step up). Adaptation gets no signal there.
7. **The pet models the choice but not the match.** It says "{color}! I will hop this owl" and hops. It never says what it looked for.
8. **Stone art is too small to become targets as drawn.** Each stone is an 88 by 44 ellipse. Stones are spaced 136, 109, 91 and 78 units apart at levels 1–4 in the 1024-wide view (`stoneAt`), so a stone tap needs hit areas of at least 100 units resolved to the nearest stone, as Bubble Pop and Teddy Doctor do, or a bigger stone with fewer per row.
9. **Waiting owls overlap.** In the woods the owls stand 62 units apart with hit circles about 114 across; the nearest-owl routing hides it.
10. **Flipping the deck while the pet is mid-turn is guarded, but the pet's turn is long.** It says "My turn!", flips, says the color, says "I will hop this owl" and hops, about eight seconds with nothing for her to do. Adding narration lengthens it; it needs a person's eyes.

## Similar games

**Opened and read** is marked; **search summary only** means I saw the search result's summary, not the page. The first row is the game this one is named after.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Hoot Owl Hoot!* (Peaceable Kingdom 2010, ages 4+; [rulebook summary](https://rulespal.com/hoot-owl-hoot/rulebook) and [review](https://hexagamers.com/hoot-owl-hoot-review/), **search summary only**) | cooperative board game, 2–4 players | Each player holds three color cards face up; on a turn play one and move *any* owl to the next unoccupied space of that color, flying over owls; sun cards advance the sunrise; all owls home before sunrise wins. Adding owls (3 to 6) makes it harder; groups plan so one card sets up another player's move | **The group decides which owl, and talks about it**; the open hands; the fly-over; more owls as depth | The sun cards: the sunrise is a clock that makes everyone lose together |
| *First Orchard* (HABA, ages 2+; [listing](https://flyingpigtoys.com/collections/haba/products/my-very-first-games-first-orchard), **search summary only**) | cooperative first game | Roll a color die, pick fruit of that color from the trees into one shared basket; a raven walks a short path | **The match is the action**: a two-year-old picks the fruit herself. One big thing to hold, one basket to share | The raven race and the loss |
| *Candy Land* (Hasbro; Koster's [post](https://www.raphkoster.com/?p=2454) on the "no decisions" critique, **search summary only**) | race game | Turn a card, move to the next square of that color. Critics (Steven Johnson, as Koster quotes him) say the game never asks a decision; defenders say that is the point at three, because it isolates turn-taking and color matching. A 2025 edition lists a cooperative mode (retailer text only) | **The rule: the next square of the card's color** is a perfect first rule. The level-1 and level-2 game is a cooperative Candy Land | The winner and loser; and the lack of any decision, which is this dive's main finding |
| *Count Your Chickens* (Peaceable Kingdom, ages 3+; [review](https://www.gamesforyoungminds.com/blog/2019/5/16/count-your-chickens), **search summary only**) | cooperative counting game | Spin, walk Mother Hen that many spaces, counting aloud together, and take that many chicks to the coop; a fox returns a chick | **Counting the hop aloud, together** | The fox and the race against the hen |
| Siegler and Ramani's number board games ([Siegler 2009](https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/SieglerBoardGamesCDPerp2009.pdf), **opened** in [Frog Hop's dive](frog-hop.md#similar-games)) | research board games, Head Start 4–5-year-olds | Numbered squares, a spinner, and *saying the numbers of the squares you pass*; a linear track helped numeracy, a circular one did not. As I recall from Ramani and Siegler's 2008 study (not opened here, so unverified) their control group played a color-only board game and gained no number knowledge | **A reminder of what color games do not teach**: the number gain came from the numbers on the squares, said aloud | The spinner; the numbers-on-squares, which Frog Hop owns |
| Stanford Preschool Math, [Follow the Path](https://preschoolmath.stanford.edu/resource/following-the-path/) (**search summary only**) | classroom activity | Each child *predicts* the square the piece will land on before counting the move, then checks | **Predict, then count to check**, for the level 4 numerals (an unscored prediction) | The die; the number cards |
| Frog Hop, Color Garden, Shape Sorter, Pattern Train (this catalog) | the same island | Counted hops on numerals; sorting by color and shade; matching by shape; sequence by color and shape | They already teach the single skills (see below) | Nothing to import; the point is not to repeat them |

**Developmental sources** (all **search summary only**; the preschool results are small studies and several test three- and five-year-olds only).

- **Cooperative versus competitive.** One preschool study found cooperative and competitive board games brought out similar amounts of prosocial behavior and that children enjoyed the cooperative ones more ([Eriksson et al.](https://radar.brookes.ac.uk/radar/file/39aa8b01-9333-4551-8a23-792f5b0907ad/1/sjop.12708.pdf)), with an unreliable measure of competitiveness. That supports "everyone wins together"; it does not say a game teaches because it is cooperative.
- **Planning together is not automatic at three.** Three-year-olds planned ahead less well in a joint task with a partner than alone, and as well with a machine as alone ([Playing for us](https://research-portal.st-andrews.ac.uk/en/publications/playing-for-us-the-influence-of-joint-action-on-planning-in-three/)). So the toddler and preschool windows should keep each turn one decision; a plan that spans two people's moves belongs to pre-K and later.
- **Giving reasons starts to appear around five.** Pairs of five-year-olds building a zoo made their reasons explicit and reached agreement more often than three-year-olds ([Köymen et al. 2014](https://www.eva.mpg.de/documents/Elsevier/K%C3%B6ymen_Reasoning_CogDev_2014_2084146.pdf)). That suits a pre-K "why this owl?" and the helper-check level below, and not anything younger.
- **Gap.** I found nothing solid on color-matching games for this age, or on shape-versus-color matching as a skill. The skills this dive names are design intent, not measured outcomes.

## What makes sense here

**What the catalog already teaches, by skill.**

| Skill | Built | Planned (notebook and roadmap) | So Owl Walk should not be justified by it |
| --- | --- | --- | --- |
| Naming and matching a color | Color Garden (sorting, light and dark), Rainbow Fingers, Dot Link, Goodnight Room level 8, Memory Match | Same Pick (two people pick the same picture) | Yes: color matching alone is the most-covered skill on the island |
| Matching a shape | Shape Sorter, Tangram Town, Pattern Train | Shape Buddies' shared roles | Yes |
| Counted hops on a line | Frog Hop (numbers on the pads), Duck Pond | The Island Party Board's dice sum (school) | Yes: Frog Hop owns counted hops on numerals |
| Following an ordered route | Robot Path, Treasure Map | Row Together's river and forks | Partly |
| A second person with a job | Bounce Back's paddle, Pet Says' green arrow, Owl Walk's turns (the [Mario Party pass](../IDEAS.md#mario-party-and-the-family-table-2026-10-11) finds only these three give a second person a job) | Buddy Delivery, Row Together, Make One for Me (maker and breaker), Skip Rope, Tilt Together | Owl Walk is the only built **turn-taking** game; the planned ones are mostly roles in a single shared action, for school or for two grown-ups |
| A choice that helps *us* | Nothing built outside Bounce Back's goals | Row Together's fork, the party board's captain at a fork | **Owl Walk is the only one for the youngest bands** |

**The goal I recommend: choose the move that helps all of us, together with a partner who thinks aloud.** Matching a card to a stone is the entry action (it is the Candy Land rule, a good first rule for a toddler), not the point. The things only this game can teach are the three Hoot Owl Hoot is built on: *the next one ahead* (an ordered path and a rule about "next"), *which of several things should move* (comparing options by what they would do), and *a partner whose turn comes after yours* (turn-taking with someone who shows her their reasoning). Everyone wins together, with no loss, which is the cooperative frame the notebook already values.

The arc across the bands, by what she decides:

| Band | She decides | Where in the ladder |
| --- | --- | --- |
| **Lap** | Nothing; she taps and the owl hops and the stones sing | Proposed level 5 (Stepping stones), see decision 6 |
| **Toddler** | Which stone matches the card; whose turn it is | Levels 1 and 2, reworked |
| **Preschool** | Which stone, then (level 3) which owl, with a free choice; color or shape (level 6) | 3, 6 |
| **Pre-K** | Which owl carries us farthest; two cards for the team | 4, 7 |
| **School** (a sketch, not a commitment) | Is the helper's move the best one, and why | 8 |

**How it sits beside the planned shared-play rows.** Two planned rows are close to this game and the answer for each is to keep Owl Walk distinct:

- **Island Race** ([IDEAS](../IDEAS.md), "a grown-up and child take turns: tap the spinner, and hop that color or number of steps along a path", after Candy Land and Chutes and Ladders) is level 1–2 of Owl Walk Home already. That candidate is **covered by Owl Walk Home**; this dive's levels are what would make it more than Candy Land, so the notebook should not build a second path game for the same age.
- **The Island Party Board** (school; two people share a boat, both roll a die, the pet hops the **sum**, spaces open minigames and forks) shares a path and a partner but not the action. Its learning is adding to 12 and picking at a fork; its audience is school and Game night. Owl Walk stays the toddler-to-pre-K card game with a partner, and the party board stays the dice game for school. If the board is built, Owl Walk's levels 7–8 (two cards, check the helper) are the younger rehearsal for its fork decisions, not a duplicate of them.

The rest (Same Pick, Make One for Me, Row Together, Skip Rope, Mystery Friend) are different actions: a secret pick, a puzzle built for someone, rowing, a shared count, a question game. The family review's "Play with someone" row names Owl Walk Home as the existing starting point; this dive gives it a ladder.

What I would not do, and why: add the sun deadline (the clock the notebook's rule says to drop); deal each player a hand of three cards before there is a reason (hands are for level 7); make it a race between owls; make the owls "score". Hoot Owl Hoot's lesson is the talk about the move, so the pet should talk.

## Experience and presentation

- **First unsupported action.** Tap the deck; the card turns over and the stones that match twinkle; tap the stone the owl should go to. Nobody has to supply the answer: the card and the stones are both on screen. At levels 1–2 *all* the matching stones ahead twinkle (the set), and she picks the first one (the "next" rule). By level 3 the twinkle is gone and she scans.
- **Touch-down and consequence.** A touched stone squashes down and sends a ring across it at touch-down, before the judgment; the owl then hops stone by stone (the marimba notes are already pentatonic), lands with a small wing flap, and the stone keeps a soft glow as a footprint. A wrong stone gets the usual gentle boing and a line that names what she touched ("that is a blue circle; we need a red heart"), never a bare "no".
- **A concrete art and sound example.** The **fireflies**: when a card turns, a handful of tiny `Graphics` dots drift up from every matching stone ahead of the owl and settle, so the card's color becomes visible *on the path*. It uses the particle layer and the stone's own swatch colors, adds no assets, and fades out at level 3 (the scaffold fading as the skill arrives). After two misses the right stone's fireflies brighten (the hint). A second small sound: a stone that is the answer plays the owl's landing note a step higher than the wrong-stone boing, so the sound explains the choice even with the speaker low.
- **What varies on replay without changing the rule.** The path's shape (two rows today; a gentle S-curve; three rows), the number of stones, the owl colors, the scenery (the IDEAS row says *paths and seasons*: a snowy night, an autumn night), and the nest (a tree, a hollow log). The seeded generator keeps each board solvable.
- **Reasoning versus reading, memory and motor.** No reading anywhere. No memory: the card stays face up until the owl lands. Motor: every stone target is at least 100 units with the touch resolved to the nearest stone (the layout cost is in gap 8); the level 5 toy uses five fat stones.
- **Supported ending and replay.** Two misses on a turn make the right stone twinkle (one hint); a third has the pet hop the owl there with "let us go together", which is supported completion and adds nothing further. The sun rises when everyone is home and the usual celebration gives the sticker. "Again" builds a new board from a new seed.
- **Roles.** Solo, the pet is her partner and, from level 2, *shows* the match: it says "blue circle, the next blue stone is there" and touches that stone with a visible paw ripple, the same action she does. In co-play a grown-up can take the pet's turn by tapping the pet (decision 5). Per the [seat contract](../IDEAS.md#the-seat-contract), only her own turns feed `difficulty.ts`; the grown-up's are scaffolding, and a round the grown-up mostly plays is supported completion.
- **What needs a person or a device, not a bot.** Whether a two-year-old taps the stone rather than the owl; whether the twinkle reads as "these match" or as decoration; whether three-year-olds follow "next" or tap any matching stone; whether the pet's narrated turn feels too long (gap 10); device speech for "heart, circle, star, triangle" and the color names; target spacing on an iPad; and whether "fly home" reads once it is said.

## Proposed ladder

### Fresh content inside existing levels

Levels 1–4 keep their IDs, plan names and owl/stone counts. The change is the input and the support, in place. The plan names stay true ("Flip a color card, then hop the owl…"), the how-to lines change, and a saved level means the same difficulty of game.

| Level | Reworked first round | What she decides | Mistakes and hints | A rule test asserts |
| --- | --- | --- | --- | --- |
| 1 | One owl. The card turns; the matching stones ahead twinkle; she taps the stone | Which stone is **next** | A wrong color names what she touched and what we need; the right color but not the next one says "is there a red one closer?"; a stone behind the owl says it only walks forward. Two misses: the right stone's twinkle brightens (one hint). Third: the pet hops it | A new `judgeStone(path, spots, owl, color, tapped)` returns `next`, `far`, `behind`, `occupied`, `wrong-color` or `nest`; `next` equals `hop()`; the deck at levels 1–2 only draws colors that have a free stone ahead of the owl whose turn it is |
| 2 | Two owls; **each owl has its own player**: purple is hers and brown the pet's, with a spotlight and "Purple owl's turn". When one owl is home, both players help the other, taking turns | Which stone is next, on her owl | As level 1. The pet's turn shows the same action: it narrates the color, the next stone, and taps it | The turn order never gives a turn to an owl at home and never stalls when one owl finishes first (200 seeds); every drawn card at levels 1–2 has a landing stone |
| 3 | Three owls, shared by both players. She taps an owl (it lifts and glows) and then its stone. No twinkle. The first card with no stone ahead of the chosen owl teaches the nest: "No red stones ahead, so the owl flies home. Tap the nest" | Which owl (a free choice, never a miss), then which stone | The owl step is never a miss; the stone step is judged as level 1. Fly-home: tapping a stone when none is ahead says so; tapping the nest when a stone is ahead says "there is still a red stone" | `judgeStone` returns `nest` exactly when `hop()` goes home; the deck can draw a no-match card at level 3 and above |
| 4 | As today, plus the hops counted aloud as the owl walks. After the farthest owl is chosen she taps its stone (decision for the prototype: let the numbered ring on the stone be the answer, so she compares two numbers and taps the bigger) | The farthest owl, by comparing numerals | A shorter hop: both numbers said, as now; two misses glow the farthest owl (one hint) | `judgeFarthest` accepts every owl in `farthest()` and no other; ties accept any |

Also inside the levels: the pet narrates *why* ("blue circle, the next blue one", and at level 4 "this one goes 3"); `describeLevel` and the how-to stop claiming a choice at level 3 that the rules did not have; the `voice-script` instruction stops saying "tap an owl" and says "tap the stone".

### New levels on top

IDs are appended, never renumbered. Windows are placed with the built `order` and `entryLevels` (see the next section).

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | **Stepping stones** (an easy entry) | lap, toddler | Five fat stones and a nest. No cards. Tap any stone ahead and the owl hops there, each stone it passes singing a pentatonic note | Nothing wrong exists; she explores | None. A tap behind the owl is a soft tick. Reaching the nest cheers; one sticker | The nest is reachable from every stone; each stone's hit area is at least 100 units and none overlap at every view (the lands test's idea); a tap behind is never a miss | S–M: reuses stones and owls; five-stone layout, a lap band in `LEVELS`, bot, how-to. **Puts the game on her own home spot** (decision 6) |
| 6 | **Color or shape** | preschool, pre-K | Stones are three colors by three shapes (nine kinds, independent). A card shows only a color or only a shape; the owl goes to the next stone with that one | Which attribute the card gives, and the next stone that has it | A wrong stone names the attribute that failed ("that is a star; we need a heart"); two misses twinkle the right stone | Every card has a landing stone ahead; each color and each shape appears at least twice; shape is independent of color; the misses name the correct attribute | M: path generator with two attributes, new stone art (combination marks), card faces, voice lines for shape names, bot. Waits on the iPad speech check for shape names (decision 7) |
| 7 | **Our two cards** (a sketch) | pre-K, school | The team turns two cards (one hers, one the pet's), face up. The previews show where each card would land each owl | Which card goes to which owl so that together we get the most stones home | Any pair that reaches the best total is right; a worse pair says both totals; two misses glow the best pair. An unscored guess first, as in Sink or Float | The best total over all card-to-owl assignments is found; every best pair is accepted; no assignment is trapped or illegal | M–L: previews for two cards, a new answer mode, bot. Define after pre-K play of level 4 |
| 8 | **Check the helper** (a sketch) | pre-K, school | The pet proposes a card and an owl ("I will hop pink"). She taps the green check, or taps a better owl | Is this the best move, and which is better | If the helper was best and she changed it, both numbers are said; if it was worse and she agreed, the helper says "ooh, purple goes four". Two misses glow the best owl | The pet's proposals include both best and non-best moves in a round; "better" exists exactly when the proposal is not in `farthest()` | M: pet-as-learner voice, proposals, bot. A school-window question (decision 8) |

### Younger-band openings

Level 5 is the opening. It is a free toy, with no cards and no wrong answer, so it fits the lap band's rule of a response to every touch. It would add `lap: { min: 5, max: 5 }` to `LEVELS`, which makes Owl Walk appear on the home spot for her own band today. That is decision 6.

### Easier entries and levels between existing ones

Append 5 and 6 and place them with the built `order` support, declaring `entryLevels` for 5 as an easy entry so a birthday lands on it. Proposed windows, in step order: lap `[5]`; toddler `[5, 1, 2]`; preschool `[1, 2, 6, 3]`; pre-K `[2, 3, 6, 4, 7]`; school `[4, 7, 8]` only if decision 8 says yes. No saved level or pin moves. The exact API and the entry rules are in `src/progress/difficulty.ts` and the Block Tower and Opposites windows, which a build session should copy rather than re-derive.

### Left out on purpose

- **The sunrise as a deadline** (Hoot Owl Hoot's sun cards): a clock that makes everyone lose together. The notebook's rule keeps the shared goal and drops the clock.
- **A par or "home in N turns"** as an end condition. Possible as a later unscored challenge (decision 4); not now.
- **Numbers on the stones**: Frog Hop owns counted hops on a numbered line. Owl Walk counts the hops aloud, and level 4's numerals stay the only written numbers.
- **Two attributes at once ("red star")** and a "not blue" card: Pattern Train, Critter Sort and Memory Match already work on two-attribute reasoning.
- **A race between owls, owl scores, an owl that "wins"**: it would replace the shared win.
- **Hands of three cards with a sun deck**: Hoot Owl Hoot's full game. Level 7's two cards are the small step toward it, if a person likes it.
- **A couch mode**: the roadmap set it aside (Owl Walk Home's hops are not scored on a seeded board).

## Decisions for the developer

1. **The goal. Decided (the developer, 2026-10-12: "I'll follow your lead on the goal"):** Owl Walk Home's goal is "choose the move that helps all of us"; matching a card to a stone is the entry action, not the point, because color and shape matching is the most-covered skill on the island. Decisions 2–9 are still leans.
2. **Rework levels 1–3 in place, or leave them and append a stone-tap track?** *Lean: in place.* The plan names stay true, levels 1–3 cannot miss today, and nobody has a saved round that depends on the owl tap. The cost is that a child saved at level 2 sees a different action after the update.
3. **Level 2's owls.** Each owl has its own player (purple hers, brown the pet's, both helping the last owl), or the owls stay shared from level 2? *Lean: assigned at 2, shared from 3.* It makes "taking turns" visible to a toddler; a child who can follow it can then have a free choice of owl.
4. **Stakes without a clock.** Add an unscored "can we get home in fewer turns?" later? *Lean: no for now.* The sun is the ending; revisit after a child plays level 4.
5. **A grown-up in the second seat.** Tapping the pet hands its turn to a person; credit and adaptation stay with the first seat, per the seat contract. *Lean: yes, small, after the stone taps.*
6. **A lap opening (level 5).** It puts Owl Walk on her own home spot now. *Lean: yes if level 5 stays a free toy with no cards.*
7. **Shape independent of color (level 6).** It needs spoken shape names checked on the iPad. *Lean: build after the speech check; until then levels 1–4 keep their one-to-one shapes.*
8. **A school window (levels 7–8).** *Lean: a sketch only; define after pre-K play of level 4.*
9. **The fly-home rule.** Teach it at level 3 and make the nest tap the answer. *Lean: yes.*

## Build slices, in order

1. **Truthful words and counted hops** (voice, how-to, `describeLevel`). The words stop claiming a choice at level 3 that the rules do not have; the fly-home rule is said when it happens; the hops are counted aloud on the way (reuse Frog Hop's counted-hop lines); the pet says what it looked for. No rule changes. *Tier: typecheck, the owl rule tests, the how-to tests; one filtered `shortlist` play of level 3 and `fingerdemo` at 3.* Ready.
2. **Level 1: tap the stone.** `judgeStone` and the deck policy in `logic.ts` with tests; the stone hit areas and nearest-stone routing; the twinkle; the third-miss pet hop; a new `autotouch()`; the how-to and voice lines. *Tier: new interaction: typecheck, unit tests, one scripted play of level 1 (a wrong color, a wrong "far" stone, a hint), one portrait screenshot, `fingerdemo` at level 1.* Ready after decision 2.
3. **Level 2: each owl has a player.** Assigned owls and the turn order with the finish rule; the pet's narrated paw touch; the spotlight. *Tier: the same filtered play at 2 and `fingerdemo` at 2.* Needs decision 3.
4. **Levels 3 and 4: choose an owl, fly home, and the ring answer.** The selection step; the no-match card and the nest tap; level 4's counted hops and answer. *Tier: filtered play at 3 and 4 (the scores `[0, 0]` and `[2, 1]` change, so the existing assertions are updated) and `fingerdemo` at 3 and 4.* Needs decision 9.
5. **Level 5, Stepping stones, and the lap band.** Needs decision 6. *Tier: new level on an existing interaction: typecheck, unit tests, one browser play of the new level, `fingerdemo` at it.*
6. **Level 6, Color or shape.** Needs decision 7 and the iPad speech check. *Tier: new interaction: as slice 2.*
7. **A grown-up in the second seat.** Needs decision 5.
8. **Levels 7 and 8.** Sketches; define first after a person has played level 4.

Every slice also updates the README row, the `GAMES.md` entry, the how-to card and the `fingerdemo` bot, and records a short VERIFICATION entry.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Checked: the docs-only tier (local links and `git diff --check`). The one number table above came from a read-only throwaway script outside the repo (`logic.ts` imported, nothing under `src/` changed).
