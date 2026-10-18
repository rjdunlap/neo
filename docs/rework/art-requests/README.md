# Creature art requests (the routine's brief)

Written 2026-10-17. This folder is the work list for an **image-generating routine** (a Codex routine or any session with an image tool) that runs over several days and leaves generated creature art in the repository, ready for a coding session to cut and rig. It follows the developer's decisions of 2026-10-17: generated sprites are allowed, the assistant makes the art, and the [illustrated, mesh-animated glider](../GENERATED-CREATURE-PILOT.md#pilot-result-2026-10-17) is the direction.

| File | Holds |
| --- | --- |
| [CAST.md](CAST.md) | The first collection: nine species (three pilot, six second wave) with silhouette, home land, signature interaction, wearable slots and possible later forms |
| [QUEUE.md](QUEUE.md) | The ordered requests, one per run, each with its file names, sizes, prompts and a status the routine updates |
| [GAME-FIT.md](GAME-FIT.md) | How the new companions fit the 97 games: what the corner guide and the ten large-pet games demand of a species, the misfit table, and what stays code-drawn |
| [../PET-INTEGRATION.md](../PET-INTEGRATION.md) | The review of how the creatures go further into the games: cast, talents, what comes home, discovery; it names the poses a casting slice would add to the queue |
| [../ART-BIBLE.md](../ART-BIBLE.md), [../ART-PROMPTS.md](../ART-PROMPTS.md) | The look every image must match, and the ready-to-paste prompts for the three pilot species |
| [../concepts/generated/](../concepts/generated/README.md) | Where the originals go, with one manifest row per file |

## What a run does

One run completes **one request** from [QUEUE.md](QUEUE.md): the first row whose status is `open` and whose "after" column is satisfied. A request is a whole set (a species with all its variants, or one group of wearables), because the variants must be edits of the approved base made in the same conversation, with the base attached.

1. **Start clean.** `git fetch --prune origin`. Work on the branch `codex/art-queue` (create it from `origin/main` if it does not exist; otherwise rebase or merge `origin/main` into it). Read this file, [QUEUE.md](QUEUE.md) and the [art bible](../ART-BIBLE.md). Do not read the whole rework folder.
2. **Check the tool.** If no image-generation tool is available in this run, add a dated line to the [run log](QUEUE.md#run-log) saying so and stop. Never substitute a screenshot, a crop of the concept sheet, a traced drawing or a stock image.
3. **Generate the base.** Open a fresh image conversation per request. Attach the [concept sheet](../concepts/art-directions-2026-10-16.png) and, from request R02 on, the approved glider base (the file the manifest marks chosen). Paste the art bible's style block, then the request's base prompt. Make three candidates.
4. **Choose.** Judge each candidate with the [review checklist](../ART-BIBLE.md#review-checklist) at full size and shrunk to about 120 px wide. Keep the best; keep one runner-up only if it is a real alternative; delete the rest. Reject every candidate and re-roll (at most twice more) rather than accept a wrong silhouette, an open outline, a prop, a ground shadow or a part touching the edge.
5. **Make the variants** listed in the request, as edits of the chosen base ("Edit this exact image. Change only …"). Reject a variant whose outline, proportions, markings, framing or camera moved; re-roll it. A variant that will not hold still after three tries is recorded as `missing` in the request, not faked.
6. **Save the originals**, untouched (no resize, crop, recompression or screenshot), as `docs/rework/concepts/generated/<species>-<asset>-<n>.png` (`n` counts candidates of that asset; the chosen one is marked in the manifest). Wearables and scenes use the names the request gives. If the tool returns a transparent PNG, keep it; a flat white background is the fallback.
7. **Record.** Add a manifest row per kept file in [generated/README.md](../concepts/generated/README.md) (request ID, date, tool and model, prompt or prompt pointer, chosen). Set the request's status in the queue table and fill its result line (which files are chosen, which variants are missing, anything a rigging session must know). Add a line to the run log.
8. **Publish.** `node scripts/check-links.mjs` and `git diff --check`, then commit (`art: R0n <species> set`) and push `codex/art-queue`. Open the pull request "Art queue: generated creature assets" if it does not exist, otherwise update it. Images and docs only: no `src/` change, no code checks. If the branch adds no `src/` change and the links pass, merge it into `main` and push, as AGENTS.md's standing authorization allows; the next run starts from the merged main. Keep one run's additions under about 12 MB.
9. **Stop** after one request. Do not start the next; do not cut, rig or integrate anything.

## Rules the routine keeps

- **One look.** Every image obeys the [art bible](../ART-BIBLE.md): plum-ink closed outline, upper-left light, big glossy eyes, cream belly, body facing the viewer's right, nothing but the creature on a plain background. A beautiful image that breaks these rules is rejected.
- **Variants line up.** `blink`, `happy`, `surprised`, `sleepy`, `sad` and `alt` are the same image with one named feature changed. The rig swaps them under the same mesh, so a drifted variant is useless.
- **Sizes.** Creature images 1536 × 1024 (portrait 1024 × 1536 only where the request says so), the creature filling about 85 % of the long side with a clear margin. Portraits, wearables, eggs and the card paper are 1024 × 1024. Scenes are 1536 × 1024. Larger is fine; smaller is not (the pilot sprite was visibly soft on a 2× iPad).
- **No new species or assets.** Only what the queue lists. An idea for another creature or item goes in the run log as a note, not into the generator.
- **No hand-back.** The developer is not expected to draw, pick candidates or clean images. Where the routine is unsure, it chooses, says why in the result line, and the coding session can re-roll later.
- **Honest records.** Record the tool and model actually used and the prompt actually sent, including any edits to the prompt. Say when a variant is missing. Do not claim child appeal, iPad readability or animation quality; those are for the preparation session and device checks.
- **Usage terms.** Note the generating service's output terms in the manifest the first time a tool is used; the repository is public.

## What happens after the routine

A coding session picks up a `done` request: it prepares the sprite set with `node scripts/creature-art/prepare-sprite.mjs --set <species>` ([arguments](../../../src/art/creatures/illustrated/README.md#preparing-a-sprite); it takes a transparent or flat background and refuses a drifted variant), marks the anchor points listed in [GAME-FIT.md](GAME-FIT.md#anchor-points-a-rigging-session-records), reuses the weight-field mesh rig per species, and sets the request to `prepared`. RW05 then consumes the prepared species. None of that is the routine's job.
