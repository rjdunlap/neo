# RW11: Optional forms and useful talents (definition)

Defined 2026-11-26 for [RW11](WORK-ITEMS.md#rw11-optional-forms-and-useful-talents) ([issue #495](https://github.com/rjdunlap/neo/issues/495)), docs only. It builds on the [RW05 model](CREATURE-COLLECTION.md), the [RW06 look and Dress](HOME.md#the-saved-look) and the [RW10 book and goals](COLLECTION-BOOK.md). Being defined authorizes no build; the three slices at the end are lines in Next ten, in order.

## Summary

- **One form, two branches, on the sprout.** The sprout's "blossom opens between the leaves" ([the cast](art-requests/CAST.md#pilot-three-art-bible-rows-exist)) is the first form. It has two kinds, a **sun blossom** and a **moon blossom**, each grown from a real Garden Grow flower she plants. Which one she meets first is her choice of seed packet; both stay available afterwards.
- **A form is a look, not a new creature.** The individual keeps its id, name, colour and history. The original sprout is always the first card in Dress and is never replaced; she can take the blossom off at any time.
- **One talent: the sun-and-moon switch.** In creature play a lamp picture turns the room to evening and back. Each form answers it in its own way and the plain sprout, the river and the glider each answer too, so every favourite takes part. It is an experiment she can run, not a task.
- **Nothing here is mastery.** The blossom does not answer a game, appears in no game, and its pages never count as learning evidence. A round that helped her plant still grows the blossom.
- **Where it plays.** Dress, the book and creature play, which are the tablet and computer route. The phone root is Today's six alone, so this slice adds nothing to the phone and invents no entry for it ([as RW10 says](COLLECTION-BOOK.md#what-exists-today)).

## What exists today

| Piece | Where | What RW11 uses |
| --- | --- | --- |
| Individuals, `look: { color, worn }`, `store.wear()` | `SaveData.creatures`, [RW05](CREATURE-COLLECTION.md), [RW06](HOME.md#the-saved-look) | `look` gains one optional field; the repair rules are the same shape |
| An item is a prepared sprite pinned to a point of the rig, with a per-species fit or a recorded misfit | `src/art/creatures/wearables.ts` (`Fit`, `pin`, `ride`) | The blossom is drawn the same way, so it rides the leaves with no tracking code and needs no new expression sets |
| Colour is a hue turn of the body | `hueTurn()`, `src/creatures/companion.ts` | A pinned sprite is not turned, so the petals keep their own colour when she picks a different body colour |
| Dress, one card per item that fits, a head slot with crown, sun hat and beanie | `DressScene`, [HOME.md](HOME.md#dressing) | One more row of cards, **Form** |
| Goals in the book, a done-state derived from the save, a requested recipe on a launched level | [COLLECTION-BOOK.md](COLLECTION-BOOK.md#goals), Paint Mixer level 5 | The form goal is the same shape, with Garden Grow level 2 and a requested flower kind |
| Creature play: the ball toy, the companion going to look at things | `PlayScene`, [HOME.md](HOME.md#creature-play-playscene) | A second toy beside the ball, the lamp |
| Garden Grow level 2: plant seeds, then tap the cloud so it rains and they bloom | [`docs/games/garden-grow.md`](../games/garden-grow.md) | The experience that earns a form |

## The form

**The sprout's two blossoms.** A sun blossom is a wide, open, golden flower with a round face; a moon blossom is a closed-petal bell in pale blue that opens a little at night. Each is one prepared sprite of the same box and anchor as the nine wearables, cut and prepared by the assistant with the reproducible steps and source art kept in the repository ([RW02b](GENERATED-CREATURE-PILOT.md)); nothing else about the sprout is redrawn. The two kinds come from two of Garden Grow's flower kinds, a warm one and a cool one, chosen at build time from `logic.ts` so that the flower on the packet and the blossom on her friend are the same picture.

**Where it sits.** Between the two leaves, above the head, pinned with `ride` on the leaves so it sways with them. It adds no height beyond the leaf tips, so the guide's footprint test (which already covers the widest outfit) needs no new case beyond "the blossom is inside the leaf-tip height".

**Body and wearable compatibility, decided now so the build only checks it:**

| Part of the look | With a blossom |
| --- | --- |
| Body colour | Free. The hue turn moves the body only; the petals are a pinned sprite and keep their colour. |
| Head slot (crown, sun hat, beanie) | **Shared.** A form takes the head slot: choosing one takes a worn head item off, visibly, as one hat replaces another today, and putting a head item on takes the form off. Saved data never needs to fight about it: if a save holds both, the form is drawn and the hat is kept but not drawn, which is the misfit rule RW06 already uses. |
| Face, neck, body, held, hands, feet (sunglasses, scarf, raincoat, umbrella, mittens, boots) | Unaffected. The build proves it with a rectangle test: the blossom's footprint touches no other fitted item's footprint on the sprout. |
| River and glider | **No form yet.** Their later forms (the river's stream coat, the glider's sunset wing) are named in the cast and stay concepts; the model below carries a form id per species so they can be added later, but no art, goal or test is written for them here. |
| The Graphics fallback rig | Not drawn, as for every wearable (`wearItem` works on the illustrated rig only). |

**The record.** Two fields, both bounded and repaired on load, with defaults and tests beside the creature repair in `migrate()`:

- `creatures.forms: FormId[]`, at most 8: the forms **the profile has grown**. A form is an unlock that stays, like a furnishing; nothing wears out and a second sprout can use it too. `FormId` is a stable string such as `sprout:sun` and `sprout:moon`. Unknown ids are dropped, repeats keep the first, the list is cut at 8.
- `look.form: FormId | null` on an individual: the form it shows. It repairs to `null` unless the id is in `creatures.forms` **and** belongs to that individual's species. The original look is `null`, so choosing it is always possible.

Two writes go through the store like `meet()` and `wear()`: `store.growForm(id, token)`, idempotent on its token (`garden:<kind>`), which adds to `forms`; and `store.setForm(creatureId, id | null)`, which changes one individual's look, writes at once and takes a worn head item off. An id the profile does not own changes nothing. Reset keeps creatures and so keeps forms. Undo, restore, backups and profile isolation carry them with the rest of `creatures`.

**Growth follows play she can see.** The goal below earns a form; a form is never given for time, for streaks or for a count of rounds. The first form arrives on the round's end screen as a blossom opening on her friend, then it goes back to the book, which she opens by choice.

## The experience that grows it: a flower she plants

RW10's goal shape ([COLLECTION-BOOK.md](COLLECTION-BOOK.md#goals)) gets a third kind, `form`, with one row per blossom:

| Goal | Reachable when | Done when | Path |
| --- | --- | --- | --- |
| `form:sprout:sun`, `form:sprout:moon` | Band `preschool` or `prek`, an owned sprout, and the form not yet in `creatures.forms` | `forms` holds the id (derived, never separately stored) | `go.game('garden-grow', band, undefined, false, { book: true }, 2)` with the **requested kind** |

- **The choice is a picture, not a quiz.** The goal page shows two seed packets, one warm and one cool, each with the closed blossom pictured on it. Both are always offered while neither is grown; once one is grown the other stays offered, so she can grow both. Tapping a packet launches the level with that packet first in her hand.
- **The requested kind.** Level 2 today lets her plant any seeds and then make it rain. From the book, the first seed she plants is the requested kind (as Paint Mixer's level-5 bucket is the requested recipe), and the round ends when the rain has made a flower of that kind bloom. She can plant more seeds and other kinds as she likes; nothing she does can stop that first flower. The game reports which kind bloomed, and the shell grows the form only from that report, so the blossom is exactly what she grew.
- **Help counts the same.** Hints, misses or the ghost finger still bloom the flower: one sticker per round as always, and the form is a look, not a score. A replay of a grown form is allowed and grows nothing twice (the token makes it idempotent), so there is nothing to farm.
- **Put-down test.** The page never shows a goal as nearly full, never counts rounds, and stopping is as plain as playing ([the RW10 rule](COLLECTION-BOOK.md#the-put-down-test)). Garden Grow's other levels, its journal and its ladder are unchanged.
- **Preschool and pre-K only,** because that is where level 2 and the book's goals page both sit; school and younger bands see the original sprout, and a profile that changes band keeps what it grew.

## The talent: the sun-and-moon switch

A **lamp**, a 120-unit picture of a sun and a moon on one switch, sits on the floor of creature play beside the ball (a second toy; nothing else is added, and Home's single toy for the youngest stays the ball). Tapping it turns the room to evening, with the backdrop dimmed by a scene-owned tween, and tapping it again turns the room back. It has no timer, no count and no end, and the room is day again whenever she comes back, so nothing is left running.

Every creature answers, so any favourite can take part and nothing is a prize:

| Companion | In the evening | Back in the day |
| --- | --- | --- |
| Sprout with a moon blossom | The bell opens and gives a soft glow that lights a small circle of floor | The bell closes |
| Sprout with a sun blossom | The petals fold in | The petals open wide |
| Plain sprout, river, glider | A `sleepy` mood with a yawn | A `happy` hop |
| Any, on the way | The companion walks to the lamp first, the way it goes to look at the ball | |

It changes what she can **do and look at**: the room, the glow, which flower is open when. It never decides anything in a game, is in no game, and replaces no action: a species' action that a subject might need (the glider's carrying, the river's balancing) is not touched. The fallback the rework asks for is therefore built in: **nothing in any subject ever needs a form or the lamp**, and a companion without a form takes every game exactly as before.

**Fantasy stays fantasy.** The pages that mention it say "your friend's flower" and "a new look", never that real plants do this; the real facts about flowers stay in Garden Grow and the journal. Forms are not journal entries, are not read by the learning recap ([RW09](LEARNING-RECAP.md)) and are not evidence of anything she can do. `creatures.forms` is separate from `journal.found` for exactly that reason.

**Voice** (added to `src/content/voice-script.ts`, no reading needed): `form.pick` for the goal page's instruction, `form.sun` and `form.moon` on a packet's touch, `form.grown` ("A blossom for {pet}!"), `dress.form` on the Form row, `play.lamp` on the lamp's touch, and a few varied `play.evening` lines. Sound: the existing pentatonic sparkle for a blossom opening; a soft chime on the switch, synthesized.

## Not in this packet

Breeding, battles, statistics, abilities that make a creature "better", a form for the river or the glider, forms that change body size or the guide's footprint, a form that requires a time of day, a third blossom, any form earned outside the book, the phone entry (no phone route reaches Dress, the book or creature play), and a shared "talent framework". The lamp is the only use; a **second real use** (for example the glider's sunset wing doing something in the lamp's evening, or a form that does something in the library) is what earns shared infrastructure, and it is a new definition.

## Decisions (defaults the build uses)

1. **Both blossoms stay available;** growing one does not close the other. Reason: a kept choice would turn a creative choice into a loss, which the rules forbid. Changing it later is a one-line goal-row change.
2. **A form is per profile, worn per individual.** Two sprouts can show different looks; growing it once serves every sprout she has.
3. **The form shares the head slot** rather than adding a slot, so Dress, the repair rule and the save stay small. A separate "top" slot would be a second sprite place with a second collision test, and a hat plus a blossom is not a feature anyone has asked for.
4. **The blossom is a pinned sprite, not a new set of six expression pictures.** This costs two sprites instead of twelve and keeps the colour hue turn unchanged. The cost is that the blossom does not change with the sprout's mood; it responds only to the lamp and the leaves' sway, which the build records as a known limit.
5. **Preschool and pre-K only** for the goal. School and older bands see no goal page for it; a grown-up's profile that earned one keeps it.

## Build slices, in order

1. **The form in the model and in Dress** (build claimed 2026-11-26 on `claude/rw11-form-model-dress`). `creatures.forms`, `look.form`, repair and the two store writes with tests, the blossom pair prepared and pinned on the sprout, a Form row in Dress that offers a blossom only when `forms` holds it, the head-slot sharing, the rectangle and guide-footprint tests, and a development seed (`kit.growForm`) so the look can be seen before the goal exists. *Proof:* typecheck, the save and companion unit tests, one portrait screenshot of the sprout in each blossom with a scarf and with boots, and a Dress play.
2. **The goal in the book.** The `form` goal kind, the two packets, Garden Grow level 2 with the requested kind and its bloom report, the round-end blossom, and the book's origin rule (the same adapt-off rule as the colour goal). *Proof:* typecheck, pure goal and growth tests, one filtered Garden Grow play from the book (with a miss and a hint), and a screenshot of the goal page.
3. **The lamp.** The second toy in creature play, the five answers in the table, the dimming and the glow, scene-owned timers and the cleanup test. *Proof:* typecheck, a unit test of each answer's choice by companion and form, and one filtered play of creature play with a moon-blossom sprout.
