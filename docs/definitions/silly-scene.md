# Silly Scene levels 1–3 (definition)

Proposed touch game `silly-scene`, PP7 of the [puzzle-pages study](../deep-dives/subjects/puzzle-pages.md#build-slices-in-order) and the notebook's *Silly Scene* row ([IDEAS](../IDEAS.md)). Defined 2026-11-21. **Docs only:** no code, voice line, art or device evidence exists yet. Identity, land, bands and accounting take this page's defaults under [standing rule S8](../archive/DECISIONS-2026-10-23.md#standing-rules); the spoken reasons get the building session's source check under S1 (below).

A familiar picture (a pond garden, a beach, a farmyard) has one thing in it that cannot be true: a fish sitting in a tree, a pig with wings, rain falling up. She taps it; the pet laughs, says why in one short sentence ("Fish swim in water. There's no water up a tree!"), and the thing puts itself right (the fish flips down into the pond). The learning purpose is **checking a picture against what she knows about the world**: where animals live, what parts they have, which way things fall, and, at the top level, telling *silly but could happen* from *could not happen*. It makes no claim about a school, reading or reasoning outcome; a grown-up can watch whether she starts saying why before the pet does.

## Identity and overlap

Checked 2026-11-21 against the catalog and the open definitions, as the study asked:

- **Not Always** (Story Grove, built) asks whether a sentence about *all* the cards on screen is true, and every claim is about the cards only, never the real world (its decision 4). Silly Scene has no spoken claim to test; she compares a picture with the world outside it. The two share only "find the one that breaks it".
- **Who Am I?** (Barnyard, built) narrows a gallery by features to one hidden friend; every friend in it is a real, possible animal. Silly Scene uses animal facts (no wings, two legs, lives in water) only to spot an impossible picture, never to identify or classify.
- **Photo Safari** (Story Grove) finds a *named* animal and its *What changed?* mode compares two pictures. Here nothing is named: she decides which thing is wrong, so it is not a mode of either.
- **Picture Logic**, **Critter Spotter** and **Hidden Pond** (ideas) are hidden-picture or grid puzzles; Silly Scene's things are large and in plain sight. The difficulty is the judgment, never the search.

Because the action (judge a whole scene, tap the impossible part) and the learning (possible against impossible, with a reason) belong to neither built game, it is a **new small game**, not a mode.

## Ladder

A round is **one scene** and one sticker. Things stand in authored slots, each at least **120 × 120** units on screen.

| Level | Name | Bands | Scene | What she decides |
| --- | --- | --- | --- | --- |
| 1 | *Spot the silly thing* | preschool 1, pre-K 1 | 5 ordinary things and **1** impossible thing, the impossible one big and in the middle third | Which thing cannot be true |
| 2 | *Two silly things* | pre-K 2, school 2 | 6 ordinary things and **2** impossible things of different kinds | Keep looking after the first one |
| 3 | *Could it happen?* | school 3 | 5 ordinary things, **2** impossible things and **1** *silly but possible* thing (a dog wearing a hat) | Silly is not the same as impossible |

`BandLevels`: `preschool: { min: 1, max: 1 }`, `prek: { min: 1, max: 2 }`, `school: { min: 2, max: 3 }`. No `order`. A toddler or lap player opening it from the signpost plays at preschool level 1 through `playBand`.

## The model (`logic.ts`)

- **Backdrops.** Three for the first build: `pond` (grass, a pond with a lily pad, a tree, sky), `beach` (sand, sea, sky) and `farm` (grass, a far barn from `drawFarBarn`, a mud puddle, a fence). Each backdrop authors its **slots**: named places (`tree`, `pond`, `sky`, `sand`, `grass`…) with landscape and upright coordinates.
- **Things.** `{ id, kind: 'fine' | 'impossible' | 'possible', slot, art, why: LineId, fix? }`. A `fine` thing is where it belongs (a duck on the pond, an owl in the tree, a crab on the sand). An `impossible` thing has one **kind of wrong** (`place`, `part` or `direction`), a `why` line and a `fix` animation that puts it right. A `possible` thing is unusual but could really happen, with a `why` that says so.
- **Starting pool** (the building session may add to it, never weaken the checks):

  | Backdrop | Impossible (kind): reason | Fix |
  | --- | --- | --- |
  | pond | fish in the tree (place): "Fish swim in water. There's no water up a tree!" | flips down into the pond |
  | pond | turtle flying with the birds (part): "Turtles don't have wings, so they can't fly!" | lands on the rock |
  | pond | rain falling up from a cloud (direction): "Rain falls down, never up!" | the drops turn and fall |
  | beach | crab sitting on a cloud (place): "Crabs walk on the sand. They can't climb up a cloud!" | drops to the sand |
  | beach | fish walking on legs (part): "Fish don't have legs. They swim with fins!" | the legs pop off, it flops into the sea |
  | farm | pig with wings (part): "Pigs don't have wings!" | the wings puff away |
  | farm | hen with four legs (part): "Hens have two legs, not four!" | two legs puff away |
  | farm | apple falling up from the tree (direction): "Apples fall down from the tree, not up!" | the apple drops |

  *Possible* decoys (level 3): a dog wearing a hat (`hatArt`), a bunny sitting in a pail, a cat asleep on the barn roof, each with a line like "That's silly, but it could happen! A dog can wear a hat." Art is existing code-drawn pieces (`fishArt`, `turtleArt`, `owlArt`, `henArt`, `sheepArt`, `Critter` with `wings`, `hatArt`, the shore's `crab`, `gull`, `shell` and `pail`, `Cloud`, `Sun`, `pineArt`); the new drawing is only the fish's legs, the hen's extra legs and the rising drops.
- **Building a scene** (seeded, `ctx.rng`): pick a backdrop, pick the level's impossible things from its pool with **different kinds**, fill the remaining slots with `fine` things that belong there, and at level 3 one `possible` thing. **No thing is impossible only because of something else in the scene** (each judgment stands alone), and no `fine` thing is one of the pool's *possible* decoys.
- **The first round of each level** in a session is authored: level 1 is the pond with the fish in the tree; level 2 the farm with the winged pig and the falling-up apple; level 3 the beach with the crab on a cloud, the walking fish and the dog in a hat.
- `glowFor(scene, found)`: the first impossible thing not yet found, left to right.

## Screen and controls

- **The scene** fills the play area from `view` in `resize()`, never from `window`. Landscape (1024 × 768) uses a wide picture with the slots spread across it; upright (768 × 1024 to 768 × 1700) uses the backdrop's upright slot coordinates, the sky above and the ground below, so the scene grows taller rather than smaller. A pure `layout.ts` with a test over every level and view checks that every thing's target is at least 120 wide, that no two targets overlap, and that Home, "?" and the pet's corner stay clear. Ships `upright: true`.
- **Tap** (`onTap`): a thing lifts at touch-down. A found impossible thing gets a ring and a little star that stays, so she can see how many she has found; level 2 and 3 show empty rings in a corner for the ones still hidden (shape, not colour alone).
- **The pet** gives the instruction and laughs at each find. Tapping the pet repeats the instruction, free.

## Accounting, help and finishing

- **Free, never a miss:** tapping the sky, grass, water or any empty place; tapping a thing already found; tapping the pet.
- **Counted, one miss each, with a gentle boing and a spoken reason:** tapping a `fine` thing (it does its ordinary move and the pet says why it belongs: "Ducks swim on ponds. That's right where it lives!"); at level 3, tapping the `possible` thing ("That's silly, but it could happen! A dog can wear a hat."). The same thing tapped again costs nothing until she has found something new.
- **Help:** two misses before the next find glow `glowFor` (one hint, counted once per find). The pause sheet's **Show me** (`askForHint`) glows the same thing and counts one hint.
- **Finishing:** when every impossible thing is found and has put itself right, the scene gives a little cheer and the game calls `ctx.finish({ misses, hints })` once. Finding with help earns the ordinary one sticker. No timer, no score.
- **Speech** (`voice.ts`, `sillyscene.*`): `ctx.instruct` for "Something here is silly! Find the thing that can't be true." (level 1), "Two silly things are hiding. Find them both!" (level 2) and "Find the two things that can't really happen. Careful: some silly things could happen!" (level 3). Reasons, `fine` lines and `possible` lines go through `ctx.say`. Nothing needs reading.
- **Source check (S1):** each reason describes a pictured part, place or direction in one plain sentence. The building session checks each against a reputable source (a museum, university, government science agency or established early-years curriculum), lists the sources on the game page and in its verification entry, and drops any line it cannot support. No line says what *all* animals do beyond the pictured one's kind.

## Land, co-play and off the screen

**Home land: Puzzle Peaks** (18 games at this definition, with preschool games such as Memory Match and Pattern Train already there), beside the puzzle-pages games. The building session runs the lands test on every band; if a page would need to shrink, Story Grove (beside Not Always and Photo Safari) is the fallback, never smaller targets.

**Co-play:** the grown-up asks "why is it silly?" before she taps, and she answers before the pet does. **Off the screen:** at the table, say something silly ("the cat says moo!") and let her fix it, then swap.

## Build checks

Start from the [new-game scaffold](../NEW-GAME.md) (`--band preschool`). Rule tests: every level builds a scene with the right numbers of impossible, `fine` and `possible` things over a seed sweep; impossible things in one scene have different kinds; every impossible and `possible` thing has a reason line and every impossible thing a fix; no `fine` thing is a pool decoy; the authored first rounds match this page; `glowFor` always names an unfound impossible thing. The layout test above. Typecheck and unit tests; **one** filtered scripted play of level 1 and level 3 (one miss on a `fine` thing, one on the `possible` thing, one hint) and one upright screenshot; `fingerdemo` at level 1 (the ghost finger taps the silly thing); `npm run build` once for the voice lines and the land change. Expected files: `src/games/silly-scene/` (`index.ts`, `logic.ts`, `layout.ts`, `voice.ts`, `howto.ts`, tests), `src/content/lands.ts`, generated barrels, a browser-check case and `docs/games/silly-scene.md`.

## Settled and open

**Settled here:** `silly-scene`, a new small game in Puzzle Peaks; levels 1 (one silly thing), 2 (two of different kinds) and 3 (two plus a silly-but-possible decoy); a `fine` or `possible` tap is the only miss; the pet's reason and the fix animation after every find; upright from the first slice.

**Open, not blocking:** a later *Fix it* level where she drags the thing to where it belongs; more backdrops (a kitchen, snow); whether level 3's decoy is fair to a five-year-old (a phone playtest answers it).

The walking fish's reason is the most likely to change at the source check (some fish, such as frogfish, "walk" on their fins); the building session may reword it to the pictured legs or swap the thing for another from the pool.
