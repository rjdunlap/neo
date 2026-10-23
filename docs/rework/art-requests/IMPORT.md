# Importing generated art

How a generated image, from ChatGPT or any image tool, gets from a download to the game in one command. Written 2026-10-23 with `scripts/art/import-inbox.mjs`. It reuses the existing preparation tools: `scripts/creature-art/prepare-sprite.mjs` for creatures and friends ([its arguments](../../../src/art/creatures/illustrated/README.md#preparing-a-sprite)), and the `sharp` WebP step that prepared Home's backdrop ([src/art/home/README.md](../../../src/art/home/README.md)).

## The one command

```bash
node scripts/art/import-inbox.mjs            # file, record and prepare everything in the inbox
node scripts/art/import-inbox.mjs --dry-run  # show what it would do
node scripts/art/import-inbox.mjs --choose land-meadow-2.png   # pick among several candidates, then prepare
```

`sharp` arrives with the dev dependencies, so run `npm ci` first in a fresh worktree. Pass `--tool "<text>"` when the images came from something other than ChatGPT, so the manifest records the right tool.

## What it does

| Step | Rule |
| --- | --- |
| **Read** | Every file in `docs/rework/concepts/inbox/`. Git ignores that folder's images, so a stray download is never committed |
| **Name** | `land-<place>` (the eleven short names R23 and R26 use), `<species>-<asset>` for the nine species (`base`, `blink`, `happy`, `surprised`, `sleepy`, `sad`, `portrait`, `alt`, `nohead`, `noarms`), and `duck-base` / `duck-portrait`. A trailing `-a`, `-2` or ` (1)` only tells candidates apart. Any other name is refused and left in the inbox |
| **Size** | The [art bible's](../ART-BIBLE.md#image-requirements-so-it-can-be-cut-and-animated) minimums: a backdrop at least 1536 × 1024 and landscape, a creature at least 1536 × 1024 either way round, and a portrait at least 1024 × 1024. Only PNG is accepted. A smaller image is refused, never upscaled |
| **File** | The original moves byte for byte to `docs/rework/concepts/generated/<stem>-<n>.png`, where `n` is the next free candidate number |
| **Record** | One row per file in the [generated manifest](../concepts/generated/README.md): request, date, tool, a prompt pointer to the [ChatGPT batch](CHATGPT-BATCH.md), and whether it is chosen |
| **Choose** | A stem with one new candidate and nothing already chosen is chosen. Several candidates, or a re-roll of something already chosen, wait for `--choose <file>`, which marks that file and un-marks the others. A coding session picks with the [review checklist](../ART-BIBLE.md#review-checklist) at full size and at 120 px wide |
| **Prepare** | **Backdrop:** `src/art/locations/<land-id>.webp` (quality 82, warned if over 1 MiB, since the offline precache drops files over 3 MiB) and a 480 × 360 Places card `<land-id>-card.webp`. **Creature or friend:** `prepare-sprite.mjs --set <name> --shrink 2` into the species' folder (`src/art/creatures/illustrated/`, `src/art/creatures/cast/` or `src/art/friends/`). The script keys out a flat background or passes a transparent one through, and stops if an expression variant drifted from its base |

The rules are pure functions in `scripts/art/inbox-core.mjs`, tested by `inbox-core.test.mjs`.

## Where integration needs code, and where it does not

The script prepares files into the folders the game reads. Showing a new **kind** of image takes one build slice, done once:

| Kind | Wired by | After that slice |
| --- | --- | --- |
| Home backdrop | RW06 slice 2 (built) | Re-prepare with the README's command; the code is unchanged |
| Companion species (pilot three, second-wave six) | RW02b steps 2–3 (built; production loading of the six is [POLISH slice 2](../POLISH.md#slice-2-residents-in-six-locations-and-her-own-friend-at-home)) | A re-rolled variant needs only the script, but a moved anchor needs its `*_ART` table checked |
| Location backdrop and Places card | [POLISH slice 4](../POLISH.md#slice-4-the-illustrated-rainbow-meadow-and-postcards-in-places) | **Only the script**: the loader finds `src/art/locations/<land-id>.webp` by name, and a location without a file keeps its code-drawn scenery |
| Friend (the duck) | [POLISH slice 6](../POLISH.md#slice-6-the-duck-pilot) | Another game's duck is a small code change per game until the developer decides how far the friends go |

## After an import

1. Look at the prepared files (the sprite step's `--check` previews land in `test-results/`).
2. Update the request's row in the [queue](QUEUE.md): status `done`, and a result line naming the chosen files and any caveat.
3. Commit the originals, the manifest and the prepared files together (`art: R23 meadow backdrop`). Images and docs alone take docs-tier checks (`node scripts/check-links.mjs`, `git diff --check`). If a prepared file lands in `src/` and is wired, add the integration slice's check tier.

## Terms

ChatGPT's images fall under the [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/#content), the same terms the manifest already records for the built-in tool ([generating service terms](../concepts/generated/README.md#generating-service-terms)). The repository is public, so record the tool honestly; ChatGPT does not always show the model, so the default says "model as shown in ChatGPT".
