# How the new companions fit the games

A review of the 97 games and the island scenes, made 2026-10-17 to decide what each generated species must come with. It reads the current code (`src/art/pet.ts`, `src/art/critter.ts`, `GameScene`, the ten large-pet games); it proposes nothing that is built. RW05 owns the integration.

## Where the pet appears today

| Surface | What it does with the pet | What that asks of a species |
| --- | --- | --- |
| **Every game** (`GameScene`) | The saved pet stands bottom-left as the **guide** at a small scale, repeats the instruction when tapped, blinks, and shows a mood; at the end it appears as the celebration's star | A full-body side view that reads at roughly a third of its stage size; `base`, `blink`, `happy`, `surprised`; a tap reaction |
| **Ten large-pet games** | `new Critter(ctx.petSpec)` builds a big pet that is the activity itself (table below) | Expression variants, hops, named body parts and wearable slots |
| **Sixty-odd other games** | Use `ctx.pet` only to speak and emote through the guide | Nothing beyond the guide row |
| **Island scenes** (map, lands, places, treehouse room, Woodland Picnic) | The pet walks with her and stands by the host | The guide row's needs, plus idle motion that does not fight the scene |
| **Chooser and hatching** | An egg per unhatched profile, cracked in four taps; the hatched pet in the profile's colour | An egg image; a portrait for the card |

The pet is one species today (`CRITTERS.pip`) in one of eight colours (`PET_COLORS`). Nine other critter kinds are **friends**, not pets: the duck appears in fifteen games, the bunny in eight, the cow, cat and bear in three each, the pig and dog in two, and they host the lands.

## What the games ask of a companion

The ten games that build a large pet, and what each needs from it. "Parts" are places the game must find on the body; "moods" are the `Critter` moods it sets; "attach" means it hangs something on the pet.

| Game | Parts and slots | Moods | Motion | Attach |
| --- | --- | --- | --- | --- |
| Splish Splash | tummy, head, cheeks, ears, nose (the mud lands on named parts) | happy | scrubbed, wiggles | mud patches |
| Feelings Faces | the face | **happy, sad, sleepy, surprised** (the whole game) | hop | — |
| Weather Wardrobe | head (sun hat, beanie), eyes (sunglasses), body (raincoat), hand (umbrella), feet (boots), neck (scarf), hands (mittens) | happy, surprised | hop | eight clothes |
| Pet Says | nose, tummy, ears, head, toes (touch targets); clap, stomp, wave, jump, spin, wiggle, up, down (moves) | happy, surprised, sing | hop, spin, wiggle | — |
| Bouncy Launch | the whole body | happy | flies in an arc, lands | — |
| Bounce Back | the whole body (holds a paddle on the far side) | happy | slides | — |
| Fluffy Salon | the body's fur region (strands grow out of it); built on the head's scalp instead (see the note below) | happy | — | fur strands |
| Stop and Go | the whole body | happy, sleepy | hop | — |
| Mail Carrier | the whole body (walks between mailboxes) | happy | hop | — |
| Treasure Map | the whole body | happy | hop | — |

**Fluffy Salon routing note (RW05 slice 2, 2026-10-20).** The fur is built on the head's scalp (`scalpFor(bodyBounds())`, pinned to `part('head')`), not the whole-body fur region this row first named, because only the head is pinned on the river and glider.

Across the catalog the moods set on the pet are happy, surprised, sleepy, sad, calm and sing. Every species set therefore carries `base` (calm), `blink`, `happy` (also the singing face), `surprised`, `sleepy` and `sad`; nothing else is asked for.

## Anchor points a rigging session records

For each prepared species, in sprite pixels, in the `*_ART` table beside its rig (as `GLIDER_ART` does today):

- **Face:** eyes (centres and radii, for the lids), nose, cheeks, mouth.
- **Slots:** head (hat and crown), eyes (sunglasses), neck (scarf and collar), hands (mittens, umbrella, paddle), feet (boots), back (riding, carrying, Tote's shell), tummy, ears, tail.
- **Regions:** the body polygon for Fluffy Salon's fur and Splish Splash's mud; the pinned area for the mesh (face and body) and the moving parts (wing, tail, leaves, ribbons, crest) with their root and tip.
- **Touch:** the body-centred hit circle at stage scale, at least 100 logical units.
- **Misfits:** every slot or part the species lacks, with its reason, as `misfit.scarf` records for the glider.

A species without a part does not break a game. Two policies are open for RW05: a **stand-in point** (the glider's "toes" are its lower ribbon root) or **inviting another friend** ("Lumen can't wear boots. Who else is home?"), which gives owning several creatures a reason. The companion table in [CAST.md](CAST.md#species-briefs) marks each species' misfits so either policy can be built.

How the companions can go further than the guide and the ten games, as the cast, with talents and with what a round makes, is the [integration review](../PET-INTEGRATION.md).

## A companion contract, for RW05 to write

What `ctx.pet`/`ctx.petSpec` become, in words, so the games above keep working with any species:

- A `Companion` exposes the `Critter` surface the games already call: `setMood`, `currentMood`, `hop`, `blink`, `attach(slot, child)`, `scale`, plus `part(name)` returning a point or `null` and `misfit(name)` returning a reason or `null`.
- The species picks the renderer (the illustrated mesh rig); the individual picks the look (colour variant), name and worn items; the game asks only the contract.
- The guide is the same object at a smaller scale, with `blink` and `happy` swapped under the mesh exactly as at stage scale.
- Games keep their `logic.ts` untouched: Splish Splash's parts list and Pet Says' moves are data, and the rig maps them.

## Collection surfaces that need textures

| Surface | Image | Request |
| --- | --- | --- |
| Collection and chooser cards | the species `portrait` over the card paper, tinted in the species colour | every species set, R07 |
| Home (RW06) | the treehouse scene, day and dusk, creatures drawn by code on its empty foreground | R06 |
| Hatching and the chooser's egg | one egg shape in three starter colours | R08 |
| Dressing (RW06) | crown, scarf and Weather Wardrobe's seven other items | R04, R05 |
| Looks (RW10) | colour variants of a species' base | R15 |

## What stays code-drawn

- **The friends and hosts.** An illustrated companion will stand beside a flat `Graphics` duck in Duck Pond. That is acceptable for the pilot: the art bible keeps the same plum-ink outline, blush and glossy-eye treatment as the critters, so they share a family resemblance. Whether to redraw the friends is a catalog-wide decision to make after RW05 is seen on an iPad, not a request in this queue.
- **Stickers, hub icons, land backdrops, props and particles.** Unchanged by the creature direction. Habitat kits (Night Garden first) remain their own study and would dress lands, not companions.
- **Fur.** Fluffy Salon's strands are drawn in code over the body region; no texture is generated for them.

## Not established here

- iPad performance of several mesh rigs at once (the pilot measured one in headless Chromium only).
- Whether a child recognizes the nine silhouettes at card size, or prefers one.
- Whether the raincoat and boots can be fitted to varied bodies as images, or stay code-drawn.
