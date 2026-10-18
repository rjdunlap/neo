# RW03: home and navigation packet

[Work item / issue #487](WORK-ITEMS.md#rw03-home-and-navigation-packet) · [PR #501](https://github.com/rjdunlap/neo/pull/501) · 2026-10-17

**Exploration delivered; production routes unchanged.** Working recommendation, using RW01's provisional world language and RW02's three creature silhouettes. Open the [interactive wireframe](home-navigation.html) in a browser (or serve the repository with `python3 -m http.server 5193` and visit `/docs/rework/home-navigation.html`). This is the **one RW03 preview entry**. It is a standalone local document, not an app flag, new save, renderer or production Home. It uses drawn symbols, sample games and session-memory state; no player data, network requests, real rewards or game launches. Its captions expose state for review. Speech replay uses browser speech if available; displayed captions remain inspectable when it is unavailable.

## Recommendation and bounded choices

Home is a place where the selected creature plays, with three meaningful exits: **adventure/continue**, **creature play**, **Explore**. A room object opens collection/dress within creature play, rather than adding a fourth equal tile. A saved picture/tune is a tangible room object there. One chosen project remains the primary invitation until finished or explicitly put aside. No rotating quests, urgency, streaks or loss while away. The invitation says what the child will do, not a mastery claim.

| Presentation | Immediate choices and spoken/pictured cue | Depth on deliberate entry |
| --- | --- | --- |
| Lap | Creature is the large play target; one familiar toy and Explore picture. No multi-step project obligation | Toy repeats one action. A grown-up can use Explore and favorites; project invitation is shared play only when RW04 defines it |
| Toddler | Creature/toy and Explore; one pictured shared invitation replaces the toy only when intentionally chosen | Collection through the creature's basket, one creature/garment per page; no management grid |
| Preschool/pre-K | Three actions: invitation/continue (picture of next task), creature play, Explore | RW04 chooses the actual welcome steps; these are not invented by navigation |
| School | Same three actions, plus a pictured project breadcrumb/detail on the primary card | Child can inspect completed/next project steps and a chosen collection goal; tools/workshops appear in Explore, not a wall of Home games |

The wireframe offers lap/toddler/school review presets; the younger toy is intentionally **not** a disguised version of the school project. All child actions use pictures plus replayable short speech; text supplements them. Production uses `voice-script.ts`, palette and Pixi input helpers. The prototype's symbols are schematic, not approved icons or a substitute for RW02 art. Review at 1024×768 and 768×1024; each child target is at least 100 CSS px here, with down feedback. Production must prove 100 logical units after scaling, safe areas, bottom-left guide and corner clearance, cancel/lost-release handling and TurnPrompt policy. This document cannot prove finger reach.

## Routes and meaning

**Home means the active person's creature home, from anywhere in the island. Back means the named place that opened this activity.** Use house versus return-arrow pictures and distinct spoken labels (e.g. “Home” / “Back to music”). Do not label both Home. At Home, Back is absent; Who's playing is a separate person icon. Esc/Start opens the existing pause sheet, never silently abandons a round.

```text
Chooser --touch--> Home --Explore--> Places / Favorites / All games / Family play
                     |                    |                |
                     |                    +--> workshop --> game intro --> round --> result
                     +--> creature play --> collection --> dress
                     +--> invitation / Continue --> project --> game --> project step / ending
Chooser --Enter/pad--> existing Couch play --leave--> chooser
Home/Explore --explicit Family play--> Couch play --leave--> calling Home/Explore
```

| Context | Back | Home / leaving | Resume / side effects |
| --- | --- | --- | --- |
| Explore category, index page, workshop/library | Exact caller, preserving filter, page and focus | Home | Browsing changes no progress; profile switch clears visit memory |
| Collection → dress | Collection, then creature play | Home | Selection applies on explicit “Come with me”; equipment applies on explicit item choice/removal; ownership never deleted |
| Ordinary game intro | Original browse origin | Home | Full current-level how-to/demo; leaving before Play awards nothing |
| Ordinary active round | Pause sheet offers “Leave to [origin]”; no score for unfinished work | Explicit Home ends that unfinished round | No serialized physics/board promises. Reopen as a fresh round at normal saved/pinned level |
| Ordinary result | Original browse origin, even after multiple Next game hops | Home | Shell already settled once; Again repeats finished level; Next level stays in game; pending Keep is left only by deliberate navigation, never auto-kept |
| Project step round | Project page, not workshop/catalog | Home preserves completed steps | Interrupted step restarts fresh; completed steps remain. Resume reopens the first incomplete step's introduction after showing the project page |
| Project ending/replay | Project page | Home shows usable consequence | Apply reward once by project/step token; replay cannot duplicate adoption/item; stickers remain round-owned |
| Profile chooser | Explicit cancel returns to prior Home only if selection unchanged | Selecting person opens their Home (or existing couch input route) | Use `selectPlayer`; invalidate old scene callbacks, clear browse/suggestion memory. Save only completed work; never carry one person's project into another |

Reload begins at the chooser under current front-door policy, then the selected person's Home. Home Continue derives from durable completed project steps, not an in-memory scene pointer. After reset/restore, resolve the new current model and discard stale callbacks. For a project put aside, an explicit project-library entry can resume it; no silent replacement of its state. RW07 defines any multiple-project bound only if the pilot needs more than one.

## Complete catalog without a crowded home

Explore has four pictured entries: **Places**, **Favorites**, **All games**, **Family play**. Places reuses the eleven current land memberships and hosts; a workshop/library is a small subject/action shelf within that navigation (prototype: Music workshop → Song Maker / Sing-Along Barn). It is an organization of existing games, not a newly registered land or proposed region made real. Pages show at most four game cards with large previous/next targets and spoken page context. Index order is stable, searchable by a grown-up if useful, and independent of unlocks. No carousel that advances itself. Retain page/focus for the visit and on game return; don't remember it across people.

All games must enumerate every direct-play registration by its stable ID, using `GAMES` plus appropriate grown-up/couch lookup, not a copied list in a new system. Default shelf emphasizes current-band suitability; deliberate “Other ages” exposes every younger/older supported band with spoken input/age context. `playBand` remains the normal default resolver, and any deliberate different-band choice must be explicit and tested, never a silent pin change. Existing favorites of every age remain owned and visible in Favorites; label their actual supported play band and input. Empty favorites offers All games, not fake recommendations. No pet, chapter or collection goal can block direct access to a learning subject. Family/grown-up entries remain explicit and route to their proper shell, not child `GAMES`.

| Current destination/source | Future responsibility / disposition in RW08 |
| --- | --- |
| `MapScene`, `LANDS` | Explore Places retains land identity/hosts/membership; replace the map-as-front-door presentation, not catalog IDs |
| `PlaceScene`, `SubjectPlaceScene`, `places.ts`, `settings.placeLayout` | Replace duplicate age-place catalogs with one Explore index and age suitability controls. Retire old scene/layout switch and session caches after all callers move; age/birthday remains profile information, not access gates |
| `LandScene` | Keep or adapt as bounded place/workshop shelf; preserve return page and signposted other ages. Remove only if the replacement supplies these responsibilities |
| `RoomScene` | Home/creature play owns active companion, clothing, toys and displayed creations; retain sticker ownership/placements |
| `JournalScene` / creations | Library owns actual discoveries and kept picture/tune replay, with direct game replay returning to that library page. Do not manufacture journal entries from invitations |
| Favorites / hearts (`shelf.ts`) | Explore Favorites, all ages and correct input; hearts on results remain unchanged |
| Picnic / Woodland Picnic | Existing resumable stories become explicit project/library entries, not rewritten as the new welcome project; retain their own completion identity |
| Chooser / parent panel / couch | Keep person selection and plain HTML family controls; explicit family entry and return origin; independent couch save/course/score/unlock rules |

## Landed D1b and controller reconciliation

Audited `src/content/discovery.ts`, `src/app/discovery.ts`, `src/app/origin.ts`, `src/app/routes.ts`, `src/app/chooser.ts` and `GameScene.ts` on base `97efae1`; [D1b #483](https://github.com/rjdunlap/neo/pull/483) and its [frozen packet](../DISCOVERY.md#d1b-build-packet-one-direct-next-game) are implemented baseline, while earlier study sections remain proposals.

- Retain the fixed lap/toddler touch pool (`bubble-pop`, `sing-along-barn`, `fill-dump`), current/last exclusions, unplayed then oldest-completion selection and fixed tie order. No school recommendation, new pool, itinerary, autoplay or Home-generated Next game service is authorized here.
- Keep pictured Next game and Another distinct from green Again and orange Next level. Preserve stable offer through resize, Heart and Keep; new game resolves live band/pin with ordinary intro, `again=false`, no cached level override. Another/preview never changes plays/stickers/mastery.
- D1b's current blue **Home** actually returns to the original land/place/journal. At RW08 relabel that existing action **Back to [origin]**, preserving its destination through every Next game/Again/Next level hop. Add the true Home house only with separately proven layout. Until RW08, shipped wording/behavior stays unchanged. Missing origin then resolves to new Home. New workshop/library origins carry a bounded typed identity/page, not an arbitrary serialized scene or unbounded history stack. Replace old origin variants only after their callers move.
- Retain native cancellation, fresh-press navigation latch, profile owner/epoch invalidation and one-time settlement. Projects/story results still exclude D1b offers. The wireframe's lap result uses the same pictured pool sequence, but does not execute production selection code or claim regression proof.
- Chooser touch opens island; Enter/pad opens couch with the selected person as Player 1 today. Keep this split at cutover until separately implemented island controller navigation exists. GameScene already accepts controller input where `controllerPlays`/`liveController` permit it, including touch return; do not infer that Home or every game is controller-ready. Existing controller-only `go.game` uses `FIRST_COURSE` and couch lookup; its ignored explicit level is a known contract limitation, not silently fixed here. Show the controller requirement before entry and preserve calling browse origin on couch leave. Do not change trip/face-off/finale/course behavior or transfer couch scores into child progress.

## Exact downstream acceptance

These are build gates for later slices, not claims that their dependency packets are all ready.

| Item | Interaction / return-route acceptance before completion |
| --- | --- |
| RW05 | From Home creature → collection, select a different owned individual with an explicit travel action; Back/Home show that individual, guide and pet-sensitive game agree; reload/profile-switch/reset cannot reuse old individual callbacks. Dress entry uses individual identity, not species as ownership. Focused large-pet/guide tests plus current-format save/offline proof |
| RW06 | Home → creature play → collection → dress → Back returns collection → Back creature play; Home from dress returns Home. One toy repeats freely, one accessory toggles/removes without ownership loss, one actual kept creation displays/replays. Both orientations, 100-unit controls, cancel and destroy checks; reload restores selected look, another profile sees its own room |
| RW07 | Home Continue → project page → first incomplete step intro → round → project page/ending. Home or leave mid-step then reload/chooser/Continue repeats only unfinished step; no completion/reward until finish. Supported completion adopts once, kept creation visibly used, direct play stays independent. RW04 supplies actual steps/results; navigation does not assume them |
| RW08 | Chooser touch → Home; every Explore registration reachable through bounded pages including younger favorites, other ages and family/grown-up. Workshop → game → D1b hops → Back returns identical workshop/page; Home returns Home. Intro leave, pause exit, project interrupted/reload, profile switch and controller/couch origin all match this packet. Retire old default map/age-place route branches/layout setting, stale origin variants/caches and all temporary preview entries only after equivalent callers migrate. Preserve land/catalog IDs, actual journal/creations, stories and couch contracts; no permanent classic/v2 toggle |

RW08 removes this HTML preview (retaining the packet and proof in Git/history or archived docs) and any RW06 temporary development entry when the ordinary Home replaces them. RW05 absorbs/removes RW02's `/?creatures` renderer preview per its own packet. No additional RW03 runtime flag is needed. Do not delete `go.hub`/`go.place` callers blindly: audit chooser/hatch/birthday, parent launch, stories, result fallbacks, sticker/room/library returns, dev harness and controller returns together. Publish the route replacement as one coherent cutover with navigation/offline proof.

## Short observed-play script and open observations

Run with a consenting family, without coaching beyond replaying speech. Record actions, help, misroutes and recovery, not success percentages from this tiny observation. Try lap/toddler co-play, preschool and school separately.

1. From Home ask “Find something to play.” Note first choice, speech use, accidental actions and whether the creature is understood as touchable.
2. Choose creature → collection → dress → take companion along; return Home. Ask which creature will join a game. Change/remove a look; ownership must remain clear.
3. Explore → Music workshop → game → result; at lap/toddler compare Next game, Another, Again and Next level. Ask to go back to music, then Home. Note confusion before explaining.
4. Heart a younger favorite; use school Home → Explore Favorites to find it, then find a different activity in All games. Test an empty-favorites profile and a controller-only item with the appropriate input.
5. Begin welcome project, leave mid-step, switch person, reload and return to original profile. Ask to continue and explain what stayed done. Finish with help and use the visible reward at Home; replay must not duplicate it.

**Not run:** real-child comprehension/appeal, device speech/reach, actual game/controller/couch integration, save/reload/offline flows or educational outcomes. The document prototype simulates route state, not these systems. Production proof belongs to RW05–RW08. Desktop review snapshots: [landscape](concepts/rw03-landscape.png), [portrait](concepts/rw03-portrait.png). These are scrolling document wireframes; production must fit its logical view. Prototype inspection evidence is recorded in [verification](../archive/VERIFICATION-2026-10-17.md#2026-10-17--rw03-home-and-navigation-packet).
