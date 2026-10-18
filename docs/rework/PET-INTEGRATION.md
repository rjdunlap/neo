# Putting the creatures inside the games

A design review, written 2026-10-17 after the developer asked how the different pets can be more integrated into the games themselves, "sort of like Neopets". It reads the current code and proposes; nothing here is built or approved. The [cast](art-requests/CAST.md) and [game fit](art-requests/GAME-FIT.md) are its inputs; the work items that would own each piece are named.

## What "like Neopets" means here

In Neopets the pet is rarely the player character of a game. What makes the pets feel central is everything around the games: the games earn things the pet uses, the pet is drawn everywhere with its own look, species have their own items and foods, the pet reacts to what you bring it, and the world is populated by other players' pets. In Pokémon the creature **is** the actor, each species does something the others cannot, and meeting a new one is the event. Puddle Island can take the useful parts of both and leave the rest:

| Take | Leave (already ruled out by AGENTS.md and the brief) |
| --- | --- |
| The pet is drawn everywhere in her chosen look; what she makes in a game comes home to it; species have favourites and their own sounds; her own creatures populate the scenes; a species can do one visible thing in a game; meeting a wild creature is an event | Hunger and neglect, a currency, random events, battles, rarity, trading, daily quests, anything that waits or expires |

## Where the pet is today

- **The guide** stands bottom-left in every game at scale 0.42 (`GameScene`). It blinks and idles. A tap squashes it, plays a giggle and repeats the instruction. That is all it does: it does not react to a right answer, a miss, a hint or a round's end, and the celebration hides it and shows a fresh copy as the star.
- **Ten games build it large** as the activity itself (the table in [GAME-FIT.md](art-requests/GAME-FIT.md#what-the-games-ask-of-a-companion)).
- **46 voice lines** say `{pet}` by name; none differ by species, since there is one.
- **Twenty-seven games name friends in their rules** (`logic.ts` mentions `duck`, `bunny`, `cat`, `pig`, `dog`, `cow` or `bear`) and eight kinds are code-drawn. The friends are the cast of the island; the pet watches them.

So the pet is present but passive, and the world's cast is fixed. Integration means making the companion do things and letting her creatures become the cast.

## Six ways in, cheapest first

### 1. A guide with a job (every game, RW05)

The guide becomes the selected companion and gets reactions the shell already knows about:

- **Mood from play:** `happy` on a right answer, `surprised` on a miss, `sleepy` while nothing happens for a while, the species' touch reaction on a tap. `GameScene` sees every miss, hint and finish, so no game changes.
- **A species sound:** one pentatonic chirp per species (`src/audio/notes.ts`), as the RW02 packet proposed, for the tap and the celebration.
- **A species celebration:** the star at the end is the companion doing its signature move (the glider loops, Bramble rolls, Trill fans its crest), instead of a generic copy.
- **Its paw is the ghost finger.** The how-to demonstration's `GhostFinger` could be the companion's hand or wing, so the creature shows her the game. Touch-only; the pointer stays on a desktop.
- **A few species lines.** Keep `{pet}` lines shared; add a small set per species for the guide's own voice ("Trill hums along", "Mossback plods over to look"). Sparingly: speech is a cost on device.

Cost: shell only, plus the companion contract GAME-FIT proposes. This is the floor; it makes every one of the 97 games feel like hers.

### 2. Her creatures are the cast (the Neopets feel, RW05 then a proof slice)

Many friend roles are shapes a rule needs, not particular animals. Where a species fits the role, an owned creature can take it, and the game stays the same:

| Role a rule needs | Games | Which owned creatures fit | Keep |
| --- | --- | --- | --- |
| Friends in a size order | Size Parade, Seesaw Balance, Block Tower's friend-height towers | All nine, by their natural sizes: Bramble 190 < Sprout 200 < Tote 220 < Trill 230 < Dapple 260 < Lumen 280 < Mossback 300 < River 330 < Glider 380 across | The size differences must stay visible at game scale; the rule's ordering is data |
| Someone who hides | Peekaboo Barn, Peekaround Island, Goodnight Room, Photo Safari's "who is asleep" | Any; Tote tucks into its shell, Bramble curls, Mossback pulls in | Every species needs the pose the game shows (asleep, behind, peeking) |
| A customer or guest | Scoop Shop, Market Stall, Lemonade Stand, Monster Munch's eaters, Pet Kitchen's sharers, Picnic guests | Any; the companion plus the creatures at home | Fair-share and count rules stay about plates and coins, not about who |
| A patient or someone to care for | Teddy Doctor, Splish Splash (already the pet), Weather Wardrobe (already the pet) | Any with the named parts; misfits fall back | Named body parts: the misfit table decides |
| Someone who sings or sounds | Sound Garden, Sing-Along Barn, Rhythm Neighbors, Beat Builder's players | Trill, Lumen (soft), the companion's chirp | The heard pitch references in `logic.ts` stay the rule; the singer is a skin |
| Things to count or graph | Duck Pond, Picture Graph, Memory Match's friend deck, Pattern Train's animal cars, Critter Sort, Critter Crossing | Any, as long as kinds stay distinguishable | Counting needs identical repeated items; use one species per group |
| **A word** | Clap the Syllables, Rhyme Time, Read & Do, Word Monsters, Story Steps' pictures | **Not swappable:** "cat" rhymes with "hat"; "duck" has one syllable. The friend is the language content | Leave the code-drawn friends here |

Rules for a swap, from the habitat-kit decision: `logic.ts` keeps naming roles as data; the rig supplies the pose or the game falls back to the code-drawn friend; one proof in two games before any wider swap. The payoff is large: a child who owns Tote and Trill sees them queue at the bridge, line up by size and sleep in the goodnight room. Only owned creatures appear, so a new player sees the friends she knows today.

### 3. One visible talent per species (the Pokémon feel, RW11)

Each species does one thing the others cannot, inside a game, as the **visible result of her learning action**, never as the answer:

| Species | Talent | Where it shows |
| --- | --- | --- |
| Sprout | its leaves grow a flower on a right answer | the guide, Garden Grow |
| River | floats on its back and balances the thing she chose | Sink or Float, Seesaw Balance, Pet Kitchen's sharing |
| Cloud glider | carries a light thing across a gap she planned | Robot Path's star, Island Bridges, Treasure Map |
| Tote | collects what she counted into its shell | Lasso Loops, Fill and Dump, Little Helpers |
| Trill | sings the note or echoes the tune she made | Song Maker, Jelly Drums, Sound Garden, Clap the Syllables |
| Dapple | turns the colour she mixed or chose | Color Garden, Rainbow Fingers, Stamp Studio |
| Bramble | curls up and rolls where she aimed | Bouncy Launch, Peg Garden, Bumper Garden, Ramp Race |
| Mossback | carries the block or part she picked to where it goes | Block Tower, Chain Reaction, Little Helpers |
| Lumen | lights the dark scene or the path she traced | Goodnight Room, Letter Trails, Number Trails, Owl Walk |

The brief's rules hold: the talent changes what she sees or can try, not the task; a game stays playable with any companion (the default actor does the same job without the flourish); no species is the only way to a subject. RW11 defines one first; the table is the menu.

### 4. What a round makes comes home to the creature (RW06, RW07, RW10)

Neopets' items without a shop: a round's result becomes something the creature wears, eats, plays with or hangs up. Pictures and tunes already do this (`RoundResult.creation`, kept only on request, bounded slots). Extend the kinds:

| Game | What she made | What it becomes |
| --- | --- | --- |
| Fluffy Salon | a hairstyle | the creature's hair stays that way until she changes it (the most Neopets-like single change; today it resets) |
| Weather Wardrobe | an outfit | worn at home until she changes it |
| Pet Kitchen, Scoop Shop, Monster Munch, Animal Snack | a meal | a feeding moment at home: the creature eats it and is pleased; no hunger, nothing if she never cooks |
| Song Maker, Beat Builder | a tune | already kept; it becomes the creature's own song, hummed at home |
| Bug Builder, Tangram Town, Shape Buddies | a bug, a picture, a paper friend | a toy on the home's shelf the creature plays with |
| Garden Grow, Color Garden | flowers | the home's garden bed |
| Pixel Pictures | a pattern | a blanket or scarf (the existing "cloth to creature" hook) |

Everything is optional, bounded and permanent: nothing wears out, spoils or waits. Supported completion makes the same thing.

### 5. Meeting a creature inside a game (RW10 with RW07-style projects)

Discovery is the event in Pokémon, and the journal already files what a round showed (`RoundResult.discoveries`). A second-wave species can first appear **wild** in a fitting game in its home land: Lumen glowing in Photo Safari's night scene, Tote in Peekaboo Barn's beach, Dapple blending into a Peekaround Island tree, Trill answering in Sound Garden. Seeing it makes a journal entry ("seen, not yet a friend"); the collection book shows the silhouette and the project that welcomes it; finishing that project, with or without help, adopts it. No chance, no rarity, no schedule: the same creature appears for every child who plays that game in that land.

### 6. Two creatures, two roles (co-play, later)

Games with two sides can seat two of her creatures: Bounce Back's second paddle, Owl Walk's second owl, Rhythm Neighbors' two parts, Critter Crossing's queue. Useful once a child owns three or more; not a first slice.

## Favourites and personality

Each species gets a short list of favourites (a food, a colour, a note) and one dislike that is only funny. A choice in a game that matches gets a flavour reaction ("Trill loves blueberries!"), a mismatch gets a shrug; **neither is ever a miss or a hint**, and the round's rules do not change. This is the cheapest way to make the creatures feel like someone, and it needs only data in `src/creatures/` and a few voice lines.

## What this asks of the art

The queue's species sets cover the guide, the large-pet games and the celebration. Casting (way 2) adds a few poses that a mesh cannot fake: **asleep** (Goodnight Room), **peeking from behind** (Peekaboo, Peekaround) and **carrying** (Mossback, Little Helpers). Add them to the [queue](art-requests/QUEUE.md) as `alt` requests only when a casting slice is chosen, so no image is made for a game that never swaps.

## Recommended order

1. **RW05:** the companion contract and way 1 (moods from play, the species sound and celebration). Every game gains at once.
2. **One casting proof:** Size Parade and Goodnight Room with owned creatures, falling back to the friends. Two games, as the habitat-kit rule asks, before anything wider.
3. **One "comes home":** Fluffy Salon's style persists on the creature. Small, visible, exactly the Neopets feeling.
4. **One talent** after RW11 defines it: Trill in Song Maker or Mossback in Block Tower.
5. Discovery inside games with the second wave's first project.

## Decisions for the developer

- Whether owned creatures replace the friends **by default** where they fit, or only when she chooses (a lean: by default, since she owns them; the friends remain where the role is a word).
- Which "comes home" results persist first (a lean: hair and outfit, since both already exist as choices in a game).
- Whether talents may change a game's **look** in a way the how-to card and ghost finger must know about (a lean: no; a talent is a flourish on the result, so cards and bots stay as they are).

## Not established

Child recognition of her own creatures in a crowd of friends, whether a species' talent reads as "mine did that", and the device cost of several rigs in one scene. These stay with [device checks](../DEVICE-CHECKS.md) once a slice exists.
