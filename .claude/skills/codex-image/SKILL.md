---
name: codex-image
description: Generate or edit raster images (creature art, wearables, eggs, scenes, art-queue requests) by handing a brief to Codex's built-in image_gen tool with scripts/codex-image.sh. Use when a Claude session needs real AI-generated bitmap art; not for code-drawn Pixi Graphics.
---

# Images through Codex

Claude has no image generator here; Codex does, on the developer's ChatGPT plan (no API key). `scripts/codex-image.sh` runs one `codex exec` image conversation, writes only into the output folder and returns Codex's report. Each run uses ChatGPT allowance, about 1–2 minutes and roughly 20K Codex tokens per image.

1. **Write the brief to a file**, not the command line: what to make, the exact file names and sizes, the style block and prompt from the source document, and which reference images to use for what. For an art-queue request, follow `docs/rework/art-requests/README.md` and its request row exactly; that README, not this skill, sets the rules (candidates, variants as edits of the chosen base, sizes, honest manifest).
2. **Run it.** Put one request's whole set (base candidates and their variants) in one run, so the edits happen in the same image conversation:
   ```bash
   scripts/codex-image.sh <out-dir> <brief.md> [reference.png ...]
   ```
   A run with more than two or three images can exceed the Bash timeout: start it with `run_in_background`. Use a scratch folder (or the request's destination folder) as `<out-dir>`; Codex cannot write anywhere else.
3. **Judge the files yourself** with Read at full size, as the brief's checklist says. To re-roll or fix a variant in the same conversation, write a short follow-up brief and run `scripts/codex-image.sh --resume <session-id> <out-dir> <follow-up.md>`; the session id is the first line the script prints.
4. **Record honestly**: the tool is "Codex built-in image_gen via scripts/codex-image.sh" (the model is not exposed), the prompts are the ones in `codex-report.md`. Move only kept, untouched originals into the repository.

If the script reports image_gen unavailable or a usage limit, record the blocker once and stop; never substitute another image source.
