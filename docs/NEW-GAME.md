# Start a new game

After choosing and claiming an approved slice, run from the repository root:

```bash
npm run new-game -- lantern-path --name "Lantern Path" \
  --land puzzle-peaks --region puzzle-peaks --band preschool --challenge space \
  --dry-run
```

This example is a proposed ID, not a game or a ready definition. Remove `--dry-run` to create the starter. All six values are required; the command validates the land, subject, band and challenge against the current source definitions. `--land` is the destination; `--region` is the subject, which can differ. The starter lists one band and level 1; implement the definition's full ladder in `logic.ts`.

The command creates:

- `src/games/<id>/index.ts`: typed module, round lifecycle, placeholder art and demonstration method.
- `logic.ts` and `logic.test.ts`: ladder and pending rule tests, with rules kept independent of Pixi.
- `voice.ts` and `howto.ts`: spoken title/instruction and the grown-ups' card, gathered into the content barrels automatically.
- `scripts/browser/suites/<id>-play.mjs`: a harness-compatible test stub.
- `docs/games/<id>.md`: hand-written sections ready for the inventory generator.

It appends the ID to the selected land. The registry discovers the module from the folder; do not edit `src/games/registry.ts`. The preview lists all paths without writing. Existing output files, game folders, symbolic-link destinations and camel-case voice alias collisions are refused. There is no overwrite option. Use this in your isolated feature worktree and inspect the diff.

The starter is unfinished: `start()` throws, rule tests are pending, `autotouch()` returns no action, and the browser stub deliberately fails. These prevent an empty interaction from being mistaken for playable work. Do not merge a generated starter as a finished game.

Implement the approved rules, seeded generation, learning purpose, input, feedback, assistance and completion through `ctx.finish`. Use the shared palette, input helpers, scene-owned resources and coach accounting; lay out from `view` with pet clearance and large targets. Replace placeholder art and prose, fill in meaningful property tests, implement the demonstration and then set `touchDemo: true`. Add other modes or `art.ts` as needed rather than growing one large file.

Finish integration:

1. Register the browser stub in `scripts/browser/registry.mjs`: import its `createSuite`, install it, add a unique suite name to `SUITES` and dispatch its returned method in `runSuite`. Use a neighboring suite as the example. Add its filter and duration to the README browser table.
2. Run `npm run game-docs` to generate the page's inventory block, README inventory and GAMES index. Run `node scripts/content-barrels.mjs` again if you added or renamed voice/how-to files.
3. Follow [AGENTS.md](../AGENTS.md#adding-or-extending-a-minigame) for lands/layout checks, how-to coverage, first/top level play, wrong-answer/hint accounting, demonstration, documentation and publication. The scaffold chooses no factual content, placement exception, keepable creation, discovery or couch behavior.

For generator changes, run `npx vitest run scripts/new-game.test.mjs`. Templates live beside the script in `scripts/new-game/`; they are text assets rather than modules that the app discovers. The integration tests exercise real source metadata and content-barrel generation in temporary repositories; they never create a game in the live catalog.
