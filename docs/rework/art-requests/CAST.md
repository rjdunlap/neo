# The first collection: nine species

Written 2026-10-17 from the [rework brief](../README.md#creature-collection-and-expansion), which asks for a first collection planned across several shape and habitat families with only three creatures implemented first. Names, colours and homes are **provisional** (the art bible's rule: change them here and in the bible before generating). Nothing here is a save field, a route or a registered game.

## How the collection works, in one paragraph

Like Neopets, each creature is an individual the child names, dresses and keeps in a home; like Pokémon, each species is met somewhere specific, through an authored adventure, and the collection book shows who is known and who could be next. The child starts with one companion (the sprout, the current pet Pip's successor), meets a second through [Welcome a New Friend](../WELCOME-ADVENTURE.md), and the rest through later projects. The chosen companion travels into every game as the corner guide and, in ten games, as the big pet on screen ([GAME-FIT.md](GAME-FIT.md)). Species differ by **shape family** (how they are built and move) and **home** (the land where they are met), so each reads by silhouette alone at card size and brings one interaction the others do not. Nothing decays, expires or is lost while the child is away.

## Shape families and homes

| Family | How it moves | Species | Home land |
| --- | --- | --- | --- |
| Round sitter | hops, squashes, waddles | **Sprout** | Rainbow Meadow (the starter; also the treehouse home) |
| Long walker | a wave runs along the back, rears up | **River** | Counting Cove (the pond) |
| Glider | floats, beats one great wing, loops | **Cloud glider** | Puzzle Peaks (the high sky) |
| Sideways scuttler | scuttles, hides in a shell, waves claws | **Tote** | Bubble Beach (tide pools) |
| Plump hopper-bird | hops, fans a crest, sings | **Trill** | Music Mountain |
| Clinging climber | creeps, grips, curls a tail, changes colour | **Dapple** | Treehouse (the art land) |
| Spiky roller | trundles, curls into a ball, uncurls | **Bramble** | Cozy Village (the hedge) |
| Shelled carrier | plods, carries things on its back | **Mossback** | Tinker Lab |
| Round-winged flutterer | flutters, glows in the dark | **Lumen** | Story Grove (its Night Garden dressing) |

Barnyard keeps its farm cast as hosts and friends; Lantern Lake stays a grown-up land. A tenth, later species could be a gentle giant for the older bands and a warm red one for the palette; neither is requested.

## Species briefs

Each brief follows the rework brief's list: silhouette, locomotion, personality, discovery story, signature interaction, wearable slots and possible later forms. Colours are palette targets (`src/art/palette.ts` fills, with the art bible's shadow tones). "Slots" and "misfits" use the RW02 table: a species either has the slot or records why not.

### Pilot three (art bible rows exist)

**Sprout** · teal `#5EC4C2` · about 200 units tall
- *Silhouette:* squat and round, wider than tall, round ears, stubby arms, two-leaf sprout on top.
- *Locomotion:* hops and lands with a squash; the leaves sway and spin.
- *Personality:* eager, a little clumsy, laughs first.
- *Discovery:* the starter. The chooser's egg hatches a sprout, as it does today.
- *Signature interaction:* its leaves grow a flower when it is happy; pats make it giggle.
- *Slots:* head (around the sprout), neck, hands, feet, back, tummy, cheeks, ears, nose. No misfits: the sprout fits every game.
- *Later form (RW11, concept only):* a blossom opens between the leaves.

**River** · caramel `#C8956A` · about 330 units long
- *Silhouette:* long and low, small lifted head, whiskers, broad dark paddle tail.
- *Locomotion:* a slow wave runs down the back; rears onto its hind legs to look.
- *Personality:* curious, tidy, carries things to the right place.
- *Discovery:* met at Counting Cove's pond.
- *Signature interaction:* floats on its back and balances a thing on its tummy (sharing, counting, Sink or Float).
- *Slots:* head, neck (a collar), hands (small front paws), feet, back, tummy, tail. No misfits.
- *Later form:* a sleek "stream" coat with a pale stripe.

**Cloud glider** · lavender `#B79BE0` · about 380 units across
- *Silhouette:* a manta-like ray, one great swept wing, cloud markings, two long ribbon tails.
- *Locomotion:* floats; beats the wing; loops the loop when tapped.
- *Personality:* calm, dreamy, shows up above things.
- *Discovery:* met on Puzzle Peaks, above the clouds.
- *Signature interaction:* carries a light thing across a gap on its back (bridges, routes, Robot Path's star).
- *Slots:* head, eyes, cheeks, ears, back (riding), tail (ribbons). *Misfits:* neck (the head runs into the wing), hands and feet (none), tummy only as the cream underside in the raised-wing `alt` image.
- *Later form:* a sunset wing (peach with pink clouds).

### Second wave (new rows go into the art bible when generated)

**Tote** · coral `#FF9A3C` (shadow `#D9731A`), shell sand-yellow `#FFD54A` with a pink lip · about 220 units tall
- *Silhouette:* a round little hermit crab: a chubby orange body with a cream face, big eyes **on the face** (no eye stalks), two big rounded claws held up like mittens, four short legs, and a spiral shell on its back that is clearly a separate shape.
- *Locomotion:* scuttles sideways in little hops; pops into the shell and peeks out.
- *Personality:* shy then proud; collects.
- *Discovery:* met in Bubble Beach's tide pool, looking for a new shell.
- *Signature interaction:* **its shell is replaceable.** The child can give it a shell she made or found: a painted shell, a cup, a tiny pot. The most Neopets-like customization in the cast, and a home for kept creations.
- *Slots:* head, eyes, cheeks, hands (claws: mittens and sunglasses fit), feet (small), **back = the shell slot**. *Misfits:* neck (no neck; a scarf would hide the face), tummy (under the shell), ears, nose (a tiny dot only).
- *Later form:* a shell with a window, or a shell garden.

**Trill** · sunny yellow `#FFD54A` (shadow `#D9A520`), crest coral-pink `#FF9AC1`, beak orange `#FF9A3C` · about 230 units tall
- *Silhouette:* a plump round songbird, a fanned crest of three big soft feathers, tiny wings held to the sides, two long tail feathers, little orange feet. Not a duck: the Barnyard's duck stays a friend, not a companion.
- *Locomotion:* hops with both feet; fans the crest; bounces on the beat.
- *Personality:* loud, cheerful, copies sounds.
- *Discovery:* met on Music Mountain, singing back whatever it hears.
- *Signature interaction:* sings a pentatonic note when tapped, and echoes a tune the child made (Song Maker, Jelly Drums, Sound Garden).
- *Slots:* head (crest), eyes, neck, tummy, feet (boots fit), back, tail. *Misfits:* hands (wings cannot hold an umbrella or wear mittens), ears, nose (a beak; "nose" taps land on the beak).
- *Later form:* a longer tail with a second colour.

**Dapple** · leaf green `#7CCF5A` (shadow `#4A9A35`), with soft spots in pink, yellow and sky blue · about 260 units long
- *Silhouette:* a chubby chameleon on four grippy feet, a big domed head with huge round eyes, a short curled tail, a gentle crest line along the back. Three-quarter view, standing on nothing (no branch).
- *Locomotion:* creeps one slow step at a time, then a quick dash; curls and uncurls the tail.
- *Personality:* quiet, watchful, playful once it trusts you.
- *Discovery:* met in the Treehouse land, blending into a painting.
- *Signature interaction:* **changes colour** to the one it is shown (Color Garden, Rainbow Fingers, Stamp Studio): the live preview of the child's colour choice.
- *Slots:* head, eyes, cheeks, neck, tummy, hands (front feet), feet, back, tail. *Misfits:* ears (none; a hat sits on the dome), nose (a tiny bump).
- *Later form:* a rainbow dapple coat.

**Bramble** · berry purple `#9A6CF0` (shadow `#6C45C4`), cream face and belly · about 190 units tall
- *Silhouette:* a small round hedgehog whose "spikes" are soft rounded tufts, like a hairdo, over the back and head; a cream face with a small dark nose, tiny legs, a stub tail.
- *Locomotion:* trundles; curls into a ball and rolls; uncurls with a pop.
- *Personality:* cosy, sleepy, loves bedtime and snacks.
- *Discovery:* met under Cozy Village's hedge at dusk.
- *Signature interaction:* curls into a ball the child can roll (Bouncy Launch, Peg Garden's pearl, Bumper Garden); carries a berry on a tuft.
- *Slots:* head (among the tufts), eyes, cheeks, ears (small), nose, neck, tummy, hands (small), feet, back. No hard misfits; hats sit among the tufts.
- *Later form:* tufts tipped in a second colour.

**Mossback** · sky blue `#4FA3F7` (shadow `#2F78C9`), shell mossy green `#7CCF5A` with a tiny flower · about 300 units long
- *Silhouette:* a sturdy little tortoise with a high rounded shell, a round head on a short neck, four stumpy legs, a tiny tail; a soft moss tuft and one small flower grow on the shell.
- *Locomotion:* plods; pulls the head in and out; the flower nods.
- *Personality:* patient, steady, the one who finishes.
- *Discovery:* met in Tinker Lab, carrying parts for a machine.
- *Signature interaction:* **carries things on its shell** across a scene (Chain Reaction's parts, Block Tower's blocks, Little Helpers' fruit); a flat back to stack on.
- *Slots:* head, eyes, cheeks, neck, tummy (the plastron shows from the side), hands and feet (four legs), **back = carrying slot**, tail. *Misfits:* ears (none).
- *Later form:* the shell garden blooms.

**Lumen** · dusk pink `#FF9AC1` wings with purple `#9A6CF0` edges and soft yellow `#FFD54A` glow spots, cream fuzzy body · about 280 units across
- *Silhouette:* a plump fuzzy moth: a round cream body with a big fluffy ruff, two feathery antennae, and two **big round upright wings** (so it never reads as the glider's swept triangle). Side view, wings half open.
- *Locomotion:* flutters in small arcs; settles; the wings pulse with a soft glow.
- *Personality:* gentle, a night owl, likes quiet.
- *Discovery:* met in Story Grove at night, in its Night Garden dressing, lighting the way.
- *Signature interaction:* **glows in the dark**: lights a dark scene (Goodnight Room, the home at dusk) and follows a traced path (Letter Trails' firefly, Number Trails).
- *Slots:* head (between the antennae), eyes, cheeks, neck (the ruff takes a scarf), tummy (the fuzzy body), back (wings). *Misfits:* hands and feet (tiny legs), ears, nose, tail.
- *Later form:* wings with a second glow pattern.

## Starter, discovery and the ten large-pet games

- **Starter:** the sprout hatches from today's egg. A lean, for RW05 to decide: let the chooser offer **three starter eggs** (sprout, river, glider) once all three are prepared, Pokémon's first choice; the other two are then met in later projects, so the collection still grows.
- **Discovery:** each species has a home land and an adventure hook above. [Welcome a New Friend](../WELCOME-ADVENTURE.md) adopts the second species; later projects can adopt the rest. Supported completion adopts the same creature.
- **Games:** a species that lacks a part a game needs (boots for the glider, a tummy for Tote) does not break the game. [GAME-FIT.md](GAME-FIT.md) lists the needs; RW05 decides between a stand-in point and inviting another friend from home, which is itself a reason to own several.
