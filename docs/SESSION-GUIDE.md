# Session guide

The operational detail behind [AGENTS.md](../AGENTS.md), in the order a session meets it: choose and claim, set up, build, check, close out, publish. AGENTS.md holds the rules and the check tiers; this file holds the how. The [docs map](README.md) says what every other document is for. Reasons and history are in the [workflow reviews](reviews/WORKFLOW-REVIEWS.md), which are not instructions.

## A session, start to finish

1. **Choose and claim.** Run `scripts/overlap.sh`, take the first line of [READY](READY.md)'s Next ten that nobody has claimed, and read its dive or definition by section. Name one complete [same-game batch](#same-game-batches), start a named branch from the latest `origin/main`, and publish a docs-only claim commit and draft PR before coding ([avoiding duplicate parallel work](#avoiding-duplicate-parallel-work)).
2. **Set up once.** Local dependencies, a strict port, the server URL written down; one branch and one worktree for the slice ([setting up a worktree](#setting-up-a-worktree)).
3. **Define the proof before coding.** State the fun action, learning purpose, bands, completion and miss/hint accounting. Name the rule properties to test and the exact browser suite, game filter and level, from the [README suite table](../README.md#browser-checks).
4. **Build the whole slice.** Rules, input and rendering, voice, the level-scoped how-to card and the bot all describe the same interaction ([rule details](#rule-details), [formatting](#formatting-and-minimal-lint)).
5. **Integrate, then check.** Refresh `origin/main` before the final run, then run the lightest [tier](../AGENTS.md#verification-budget) that proves the change ([keeping checks light](#keeping-checks-light), [scripted play](#scripted-play)). Record the tested commit, the levels played and what passed.
6. **Close out and publish.** Update the docs that own each fact ([where each doc update goes](#where-each-doc-update-goes)), push to the same PR, merge it when CI passes for the head commit and report ([reporting, merging and deploying](#reporting-merging-and-deploying)). Stop the session's servers and [release the worktree](#releasing-a-finished-worktree).

For a docs-only session, step 5 is `node scripts/check-links.mjs` and `git diff --check`; no TypeScript, unit, build or browser run is needed because the docs are published.

## Tools a session uses

| Tool | Does |
| --- | --- |
| `scripts/overlap.sh <game-id> <path>…` | Fetches, says how far behind the branch is, and lists the pull requests, worktrees and unmerged branches that match |
| `node scripts/peek.mjs outline\|section\|grep <file> …` | Reads a big file by its headings, one section, or matches cut short |
| `node scripts/ready.mjs` | Lists Next ten in pick order; `add "…"` and `add --before=NNN "…"` write a new line as its own file |
| `node scripts/verification.mjs new "Title (PR #n)"` | Makes the entry file `docs/verification/<date>-<slug>.md`; `latest [n]` lists the newest |
| `node scripts/check-links.mjs` | Checks relative links and heading anchors in README, AGENTS.md and `docs/`; `--fix-moved <live.md> <archive.md>` repoints links to sections that moved |
| `npm run game-docs`, `node scripts/content-barrels.mjs` | Rewrite the generated game docs (page blocks, README tables, GAMES.md); regather each game's `voice.ts` and `howto.ts` |
| `npm run new-game -- <id> …` | The [new game scaffold](NEW-GAME.md) |
| `scripts/concept-art.sh skip\|status\|restore` | Leaves the 150 MB of concept-art PNGs out of a code worktree, or brings them back |
| `scripts/snapshot-serve.sh` | Serves a frozen copy of the tree on `SNAP_PORT` (default 5180) in a per-worktree cache dir for a slow suite |
| `scripts/codex-image.sh` (the `codex-image` skill) | Asks for a generated image from a brief and reference images |
| Subagents `rules-tester`, `game-reviewer`, `docs-keeper` | Rule tests for a `logic.ts`; read-only game review; doc closeout (`.claude/agents/`, synced to Codex and Antigravity via `node scripts/sync-agents.mjs`) |
| `scripts/agent-guard.mjs` | PreToolUse hook (`.claude/settings.json`, `.codex/hooks.json`, `.agents/plugins/puddle-island/hooks.json`) blocking unfiltered `test:browser` and macOS `sed -i -e` |

## Avoiding duplicate parallel work

Before choosing a roadmap slice or making edits:

1. Fetch `origin` with pruning and make sure the new feature branch starts at the latest `origin/main`; fast-forward a clean local `main` first when needed. Never pull blindly into a dirty worktree.
2. Inspect active worktrees, unmerged local and remote branches, and open pull requests for the same roadmap chunk, game IDs or files. `scripts/overlap.sh <game-id> <path>…` does steps 1–2 in one compact printout (fetch, how far behind, then the matching pull requests, worktrees and unmerged branches); run it for each recheck below instead of separate `git fetch`, `gh pr list` and `git worktree list` calls. Work that is in flight counts even when it has not reached `main` yet.
3. If another branch is already implementing the slice, do not build a second version. Reconcile with that branch, help finish it, or choose the next non-overlapping ready slice unless the grown-up explicitly wants competing approaches.
4. Create a clearly named feature branch before substantial edits. Before coding, publish a small docs-only claim commit and draft pull request naming the game ID, exact batched level/content subtasks and dependencies, and expected files; put the branch/PR on the existing roadmap or deep-dive row. An uncommitted implementation in another worktree also claims that slice. Update that same PR as the playable work becomes coherent.

Fetch and inspect for overlap again immediately before publishing a follow-up commit, and once more before merging. If `origin/main` moved or overlapping work landed, integrate the current remote version and rerun the proportionate checks before publishing. Do the upstream integration before the final feature checks when practical. After integration, rerun checks for changed dependencies; a docs-only integration does not invalidate a passing game play-through. Record the tested commit (or base commit plus working diff), exact filters and server URL so reuse is inspectable.

## Same-game batches

Developer direction, 2026-10-21: an implementation slice is a predeclared same-game batch of usually 2–4 related level/content subtasks, so the game's rules, rendering, bot and checks are loaded once. [READY](READY.md) dispatches them; a READY line names its batch, written from the dive's "Build slices, in order" section. The [batch plans](GAME-BATCHES.md) written in October 2026 are built and are kept as scope references.

- **One of everything.** One queue item, claim, worker, branch, PR and closeout per batch. Keep a larger new interaction alone when it needs its own layout or proof; a new input or layout family, or an unresolved decision, is a reason to separate. A batch may include supporting content or feedback its levels share. Research still studies one game or subject per session.
- **Name it whole.** The claim names every included level or content item, source slice and dependency. Build prerequisite substeps first, in the same worker; do not finish a substep, merge it and open another chat for the rest. An unfinished batch resumes in its own worker.
- **Revalidate before claiming.** Check against current `origin/main` and every claim. If part has shipped or is owned elsewhere, remove that part; do not enlarge, duplicate or reimplement another worker's scope. If what remains is too large or a new gate appears, split at a complete playable boundary and requeue the remainder as its own line.
- **Stay in one game and one interaction family.** Do not append unrelated work to keep a chat alive. Existing decision and review gates are unchanged by batching.
- **Shared checks.** One final typecheck and relevant unit run, one build when any included change needs it, and the union of the necessary filtered browser cases. Rule tests cover every added level.
- **What to play.** The hardest new level of each distinct interaction and any easier entry with a materially different input or layout, with the batch's miss and hint cases, the relevant portrait view and the ghost finger at the new levels. Keep the story, couch, save and navigation checks a subtask requires.
- **No more than that.** Do not repeat identical checks per original slice or run a release suite because several levels ship together; if the union cannot fit the browser budget, split before claiming.
- **One closeout** marks every shipped substep in the dive, READY and the verification entry. The study cadence counts batches, not levels. New definitions and dives propose their first builds as batches.
- **Keep it bounded.** A longer conversation also carries more context on every turn, so start fresh after the batch merges; past about 150K tokens of context, checkpoint (see [keeping checks light](#keeping-checks-light)).

## Setting up a worktree

In a fresh worktree, run `scripts/concept-art.sh skip` unless the session does art, and `npm ci`; never borrow another worktree's `node_modules`. Choose an explicit available port, start Vite with `--strictPort`, and set `GAME_URL` to exactly that URL. Keep any custom Vite cache within that worktree; concurrent worktrees must not share a mutable cache. Stop the session's dev, preview and snapshot servers when its checks finish.

Antigravity worktrees (`~/.gemini/antigravity/worktrees/neo/`) keep their `.git` metadata in the main checkout, so git commands and `scripts/overlap.sh` need access to that `.git` directory.

**Concept art** (the developer, 2026-11-07): the originals are 113 PNGs, about 150 MB, under `docs/rework/concepts/`, and code sessions leave them out.

- `scripts/concept-art.sh skip` applies a per-worktree sparse checkout that drops the PNGs from disk and keeps the `.md` manifests and prompts; other worktrees are unaffected. `status` reports the state; `restore` brings the files back.
- An art session (`scripts/creature-art/prepare-sprite.mjs --set`, `scripts/art/import-inbox.mjs`) restores first; both scripts stop with the restore command if the PNGs are skipped. A `git add` outside the sparse definition is refused, so do not commit new originals from a skipped worktree.
- `scripts/check-links.mjs` treats a link to a tracked file the checkout left out as fine, and still fails on a truly missing file.
- A fresh clone (a cloud session, another machine): `git clone --filter=blob:none --no-checkout <url>`, then `scripts/concept-art.sh skip` and `git checkout main`; the PNG blobs are then never downloaded unless restored. A cloud `create_session` can also pass `blob_limit_kb` (for example 500); check `git ls-files` sizes before relying on a limit.

## Rule details

Specifics behind the short rules in [AGENTS.md](../AGENTS.md#rules-for-every-activity), with the developer's decisions:

- **Art and sound.** Generated/imported sprites were decided 2026-10-17; the developer is not expected to draw them. Rendering code-drawn art into a `RenderTexture`, as Puzzle Pals does, is supported. Spoken clips come from `src/content/voice-script.ts` (gathered from each game's `voice.ts`), cached offline, with device speech as the fallback for any line without a clip (decided 2026-10-23).
- **Music.** The Sing-Along Barn tune exception was decided 2026-10-23. A registry test lists the games that silence the island's loop; keep a style playing rather than calling `music.stop()`, because playheads read its clock.
- **Controls.** Continuous steering, slingshots, drawn loops and deliberate multi-touch may need custom pointer handling.
- **Speech.** Literacy activities may practice reading with replayable spoken support.
- **Grown-up wording** rule decided 2026-10-23.
- **How-to cards** (decided 2026-10-12): steps scoped to the levels they hold at; a test fails without a card or on level-relative wording such as "later levels". A couch-only game uses the controller demo ([DESIGN](DESIGN.md#application-and-scenes)).
- **Registry.** `src/games/registry.ts` builds `GAMES` from every `src/games/<id>/index.ts` and orders it by `LANDS`; no hand-written list.
- **Review.** Fix what `game-reviewer` finds before the doc closeout; hand the closeout to `docs-keeper` once code and checks are done so it stays out of the build session's context. Mark gaps explicitly.
- **Zones and bands.** Separate zone identity from learning band; before adding a band, audit band mappings, levels, places, routes, parent controls, voice, birthdays and saves together. A story that carries a chosen object, amount or tune needs the typed result specified in [DESIGN](DESIGN.md#proposed-story-results).
- **Reuse.** Choose examples by the mechanic being built ([reuse map](DESIGN.md#reuse-map)): characters and props in `src/art/`; input, motion and physics in `src/engine/` (`ball.ts` `simulate()` also drives rule tests); music and speech in `src/audio/`. Do not copy a game's assumptions about age, scoring, geometry or cleanup without checking them.
- **Couch play.** A couch game needs seeded boards, `COUCH_IDS`/`UNLOCK_TIERS`/catalog entries and a bot that finishes through `control()`; a grown-up-only game is a `GAMES` entry with `bands: ['grownup']`. A scripted check that opens a game directly turns `settings.howToCards` off or presses Play.
- **Ownership.** Added 2026-11-16 from Anthropic's Fable 5.2 prompting guide: when code is presented as someone else's, a model adds to the existing structure even when that duplicates code; when it is told the code is its own, it consolidates and fixes related problems. The developer wants the second. The cost is more output (the guide measured about 70–80% more) and changes nobody asked for, and a closing summary can leave small ones out, so every incidental change is named in the PR and anything that would outgrow the slice becomes its own READY line.

## Input and rendering pitfalls

Before writing pointer input, hit areas, couch controls, textures or long-lived drawings, read the [input and rendering pitfalls](DESIGN.md#input-and-rendering-pitfalls): Pixi 8 never forwards `pointercancel`; synthetic `pointerup` goes on the canvas; drags ride 40 units above the finger; hit areas use local units; decorations can steal taps; hit-testing uses the last frame; resolve close targets to the nearest; couch stages take no pointer input; free textures you own.

## Formatting and minimal lint

`npm ci` installs the app and typed-lint dependencies from the root lockfile. Run `npm run format` after code edits, then `npm run format:check` and `npm run lint`; pull-request CI runs both. Fix existing lint findings as their code is touched, then `npm run lint:prune`; do not grow the baseline. [Tooling, exclusions and blame history](CODE-QUALITY.md).

## Keeping checks light

- **Publishing does not widen the check scope.** A one-game fix or level keeps its filtered checks when merged to `main`; broader suites follow only the shared behavior a change touches (the [verification budget](../AGENTS.md#verification-budget) table, plus `picnic` for story flow).
- **Unit tests are the main proof.** Put rules in `logic.ts` and test each property you would otherwise check by playing: solvable, fair, valid targets, a hint that leads somewhere. Do not drive the browser to learn something a test can assert.
- **Do not repeat what is already recorded.** If the [coverage summary](VERIFICATION.md#coverage-summary) records a suite passing and the area has not changed since, it counts. Never re-run a passing suite after a comment, docs or test-only edit, or "to be sure".
- **One suite at a time, always with a filter.** Never start `npm run test:browser` with no `BROWSER_SUITE`. Take one or two screenshots per new screen, not a gallery.
- **Do not loop on a failing check.** Probe once with a small script. If the failure also happens on unchanged code, or looks like timing (Peg Garden's touch suite), record it as a known flake and move on.
- **Cap it.** A feature's browser checking should stay within about ten minutes of wall time and a small fraction of the session. If it would run longer, write the remaining check down as "not run" and go on building.
- **Snapshots for slow suites.** The couch suites take five to eight minutes; run them on a frozen copy of the tree on another port (`scripts/snapshot-serve.sh`) so edits continue.
- **Keep sessions and output small.** A turn re-reads the whole conversation, so context built up inside a session is most of what a slice costs. Take one declared [same-game batch](#same-game-batches) per session, keep that worker through every included substep and usage-window checkpoint, then start fresh after the whole batch merges; do not chain unrelated work. Past about 150K tokens of context, push a checkpoint (draft PR: what is done, what remains) and finish in a fresh session.
- **Keep output out of the context.** Delegate verbose work (a long suite log, a broad search) to a subagent that returns only the conclusion. Pipe test and suite output through `tail` or `grep` (`npm test 2>&1 | tail -15`, `npx vitest run <file> 2>&1 | tail -20`); on a failure, re-run once for the part that failed.
- **Read big files by section.** `docs/ROADMAP.md`, `VERIFICATION.md`, `IDEAS.md`, `GAMES.md`, `GAME-BATCHES.md`, `DESIGN.md` and the README are too large to read whole, and their lines run to 28 KB, so plain `grep` returns pages; so are definitions, deep dives (one section per built level) and game files over about 20 KB. Use `node scripts/peek.mjs outline|section|grep` (headings/declarations, one section, or matches cut short), then read a range with an offset and limit; never open one from the top to look around. In a definition, read only the sections for the levels being built.
- **Say what was skipped.** "Not run" is an acceptable entry for a check a session could have run. Chrome automation never establishes hardware, a real phone, iPad or controller, or a child's reaction, so never write that it did; but do not list those as open either. They are [parked](DEVICE-CHECKS.md) (the developer, 2026-11-09): there is no iPad yet and the developer's daughter is not old enough to play, and saying so in every entry and report told nobody anything.

Suite names, filters and durations are in the [README](../README.md#browser-checks); add cases for new games to `scripts/browser-check.mjs` and the README table rather than keeping a second inventory here. Browser scripts and one-off Playwright probes use `launchTestBrowser` and `createTestContext` from `scripts/test-browser.mjs` so Chromium audio and native text-to-speech stay silent; use `TEST_AUDIO=on` only for a deliberate audible check. Keep contexts isolated; never clear a real player's save.

When a browser check fails, probe with a small logging script before changing the test: many failures here were real bugs, such as a hint glow swallowing touches, a destroyed drawing freezing a show, and overlapping tap targets. Prove a fix by briefly restoring the old rule and watching the check fail.

Put one-off Playwright probes in `test-results/` so `import 'playwright'` resolves. Vite listens on IPv6 `localhost`, so use `GAME_URL=http://localhost:5173`. The island game is served at `classic/` and the site root is the creature-world rework (2026-10-19); the browser and offline harnesses add `classic/` to a bare origin. Before an offline run, confirm the preview serves the current build by comparing the `assets/index-*.js` name in the served page with `dist/index.html`.

## Scripted play

Dev-only `neo` exposes the app (`neo.scene`, `neo.view`, `neo.go.game(id, band)`); `kit` in `src/dev/testkit.ts` provides `tap`, `tapOn`, `drag`, `dragTo`, `line`, `until`, `sleep`, and `store`. Start on "Who's playing?" by clicking the first card (`.chooser__play`; the browser harness does it in `pickFirst()`) and wait about three seconds for the transition before navigating. Set the test profile band and `kit.store.stats(id).level`, then drive the game and inspect `neo.scene.game`.

Use scripted input for moving targets, then screenshots for visual review. Finish edits before a play-through: HMR can reload and kill a running script. To keep editing during a long run, serve a detached `git worktree` of HEAD on another port (with its own Vite `cacheDir`) and point `GAME_URL` at it. Re-check `neo.scene` after reloads. To clear an isolated profile's test data only, use `(await import('/node_modules/.vite/deps/idb-keyval.js')).del('neo.save')`.

## Where each doc update goes

Each fact has one owning document; update that one and link to it. This section is the one copy of the routing: `docs-keeper` reads it, and AGENTS.md only summarizes it.

- **A game added or changed:** its page `docs/games/<id>.md` and its how-to card. Below the page's generated block, by hand: the **Starts as** line (the README table shows it), the **Grows into** line and the design notes, which also hold what a later session needs to know about how a level was built (what counts as a miss, what a hint shows, where it departs from its definition).
- **Generated game docs:** after editing a page, run `npm run game-docs`, which writes the block (ID, land, ages, skills, each band's levels, every `describeLevel`), the README inventory tables and counts and the [GAMES.md](GAMES.md) index, and makes an empty page for a new game; `src/content/game-docs.test.ts` fails `npm test` when any is stale. On a merge conflict in README.md, GAMES.md or a generated block, take either side and run it again. A plan, definition or dive written before 2026-11-07 that names a game's "README row" or "GAMES.md entry" means its page now.
- **A definition built:** keep one line directly under the title of `docs/definitions/<id>.md`: `**Built:** levels 1–N (PR #…); to build level N+1, read “<that section's heading>”.` Update it rather than adding another, so a builder reads one section and not the file. Mark the slice built in its deep dive.
- **A READY slice landed:** remove its line (a Next ten line is its own file in `docs/ready/next/`, so `git rm` it, which never conflicts with another session's landing; a Queued line is deleted from [READY.md](READY.md)), and add a line for any slice the landing unblocks. Never add "built … PR" history to that list or to the roadmap's chunk table, and keep a chunk-table cell to one sentence. What the slice built is its verification entry and the game's page: there is no separate build note, and nothing is appended to the completed-work file in the archive (frozen 2026-11-18).
- **Refilling READY:** when Next ten holds fewer than five lines a routine could take, refill it in the same closeout from Queued (`node scripts/ready.mjs add "…"`, or `--before=NNN`, and delete the line from Queued), keeping READY’s study cadence (three follow-up definitions and one research slot per ten when eligible); update [the study backlog](STUDY-BACKLOG.md) and promote the first resulting unblocked build into a content slot.
- **Roadmap and plans:** edit the item's line in [ROADMAP.md](ROADMAP.md) (counts live only there and in the README). A plan or definition keeps no running counts or PR lists ("batches 1 to 24 are built", a status line naming every PR): each item carries its own built marker, and a tally every session rewrites is a merge conflict every time. Give each open item a status (ready, sketch, define, decision; `person` only for something a phone playtest must answer first). Move a built idea out of [IDEAS.md](IDEAS.md); label new ideas as proposals.
- **A call for the developer:** only one the developer alone can make (money, accounts, the child's data, an irreversible step) gets a row in [WAITING-ON-DEVELOPER.md](WAITING-ON-DEVELOPER.md); a dive's optional calls stay in the dive with their defaults and get no row.
- **Checks run:** a ~six-line entry (what changed, what ran, and any check a session could have run but did not) in its own file, made with `node scripts/verification.mjs new "Title (PR #n)"` as `docs/verification/<date>-<slug>.md`, and the [VERIFICATION.md](VERIFICATION.md) coverage-summary row, linking to that file: one row per suite or area, overwritten with the latest pass and its caveats, never a new row per slice (the entry holds the history).
- **Where entries live:** one file per entry means parallel sessions never edit the same lines, so never add a dated entry to VERIFICATION.md itself (`scripts/verification.test.mjs` fails `npm test` if one appears), and nothing needs archiving. Entries before 2026-11-12 stay in `docs/archive/VERIFICATION-<date>.md`.
- **What an entry never says:** "Not run" is an acceptable entry; never claim a check that was not run. Checks needing an iPad, a child, a TV or a controller are [parked](DEVICE-CHECKS.md): do not add them there, and do not write "device check open" or the like in an entry, a coverage row, a roadmap or READY line or a batch plan. A phone slice may replace its own line in that page's short phone-playtest list.
- **A review** (of another game or app, or of our own code, screens or workflow): its own page in `docs/reviews/` with numbered proposals (P1…), each saying what it would need first; a dated pointer section in [IDEAS.md](IDEAS.md); a row in the "Similar games" table of each affected deep dive or subject study and a note in an affected definition; a verification entry. No READY line unless a slice is ready without a decision. An app on a phone is played with [these tools](#playing-an-app-on-the-developers-android-phone).
- **Playtest notes:** what the developer or their wife says after playing on a phone goes in [OBSERVATIONS.md](OBSERVATIONS.md), pasted as given; a fix it asks for becomes a Next ten line under the phone lines (`node scripts/ready.mjs add --before=NNN "…"`).
- **A contract or system behavior changed:** [DESIGN.md](DESIGN.md), and only then.
- **A new document or folder under `docs/`:** a line in the [docs map](README.md) (`scripts/docs-map.test.mjs` fails `npm test` without one). Prefer a section in the doc that already owns the subject.
- **Superseded documents:** move to `docs/archive/` with a line in [its index](archive/README.md) (the same test), rather than leaving stale status in a live doc.

## Reporting, merging and deploying

Report briefly to the grown-up after each finished game or feature: what it does and which checks ran. Do not restate parked device or child checks, or the waiting list, in a report (the developer, 2026-11-09); mention a waiting row only when the work just finished is what it unblocks, and say what a phone playtest should look at only when the change is one a phone would show. Name every incidental change (a consolidation, a related fix, a stale doc) in the pull request.

When a requested task is complete and verified, commit it on its feature branch, push, and create or update its one pull request, unless the grown-up asks to leave it uncommitted or unmerged; do not open a new pull request for each follow-up commit on the same branch.

Every pull request runs `npm run format:check`, `npm run lint`, `npm test` and `npm run build` on its merge with `main` (`.github/workflows/ci.yml`). Wait for a completed run for the head commit (`gh run list --branch <branch> --limit 3 --json headSha,status,conclusion`; `gh pr checks <n> --watch` started right after a push can return before the run exists), then mark a draft ready (`gh pr ready <n>`) and merge the pull request on GitHub (`gh pr merge <n> --merge`) only when it passed for that commit: a pass on a stale base can still fail the deploy.

The merge to `main` deploys through `.github/workflows/deploy.yml` (which runs `npm test` and the build again, so a test that fails on `main` stops the deploy); the live site is [Puddle Island](https://rjdunlap.github.io/neo/) (island game at `classic/`). Never publish by pushing a local `main`: it can lag `origin/main` or hold another session's commits.

**Standing authorization (the developer, 2026-10-12): merge and deploy completed, verified changes through this repository workflow without asking for confirmation again.** This covers future requested work in this repository; it does not change platform approval controls, and a later instruction to leave work unmerged or undeployed takes precedence. Repo-local identity is `rjdunlap` with the GitHub no-reply email (public repository).

## Releasing a finished worktree

After publication and merge, remove a finished worktree only after checking its owning session is complete, its tip is in current `origin/main`, it has no uncommitted or untracked work, and no live PR still uses its branch. Preserve needed ignored screenshots, probes and local settings before removal.

Use the app's recoverable archive for a managed worktree when available; otherwise keep a recovery manifest with its path and commit, and back up needed artifacts before `git worktree remove`. Delete only merged feature branches after their worktree is released; preserve `main`, active branches and unmerged research. Do not force removal of a dirty worktree. Cleanup does not require closing the historical chat.

## Scheduled runs

Since 2026-11-10 two local desktop scheduled tasks (`neo-roadmap-slice-a` and `-b`, prompts in `~/.claude/scheduled-tasks/` on the developer's Mac) each take one READY slice per hourly run, in a fresh chat.

- **Off-peak schedule (2026-11-19).** To use the weekday off-peak hours, A and B run at `:29` and `:59` Monday to Friday only in hours 0–4 and 11–23 Pacific (nothing 5:00–10:59am, the assumed weekday peak), and the copies `neo-roadmap-slice-a-weekend` and `-b-weekend` run every hour on Saturday and Sunday. A task holds one cron expression, hence four tasks. **A change to the prompt goes into all four.**

- **Their prompts name these paths**, so keep them where they are, or change the prompts in the same step: `AGENTS.md`, `docs/READY.md` (Next ten, Queued), `docs/ROADMAP.md` (Next up), `docs/deep-dives/`, `docs/OBSERVATIONS.md`, `docs/WAITING-ON-DEVELOPER.md`, `scripts/overlap.sh` and the `docs-keeper` subagent.
- **Never bind a recurring job to a long-lived chat:** each firing re-reads that chat's whole context ([measured 2026-11-06](reviews/WORKFLOW-REVIEWS.md#token-review-2026-11-06)). A fresh-session run lacks the session tools (the same review).
- **Codex.** The Codex execution queue was paused 2026-11-03 and is [archived](archive/EXECUTION-QUEUE-2026-11-03.md); a Codex session a person starts works from the roadmap like any other.
- Usage limits never justify reporting unfinished work as complete.

## Playing an app on the developer's Android phone

For a reference review of an app that only runs on a phone (first used for [TotoLogic](reviews/TOTOLOGIC.md), 2026-11-11). Only when the developer plugs their phone in and asks; it is their personal phone.

**Set up.** On the Mac: `brew install android-platform-tools scrcpy whisper-cpp ffmpeg`, and the speech model `ggml-small.en.bin` (about 490 MB, from the whisper.cpp model list) saved as `$PLAYTEST_DIR/models/ggml-small.en.bin` or named in `WHISPER_MODEL`. On the phone: USB debugging on (the developer accepts the prompt), media volume at zero. Then `export PLAYTEST_DIR=/tmp/<app>` (default `/tmp/playtest`) and put `scripts/android-playtest` on `PATH`.

**The tools** (zsh, each with a usage comment at its top). Coordinates are always those of the half-size screenshot `shot` writes.

| Tool | Does |
| --- | --- |
| `shot <name>` | A screenshot: full-size PNG and a half-size JPG to look at |
| `ui` | What the screen says it holds (labels, centres, sizes, what is clickable); `UI_HIDE` drops lines by pattern. A canvas game labels nothing |
| `tap`, `swipe`, `trace` | A tap, a straight drag, one continuous touch through several points |
| `hear <name> [seconds] [x y]` | Records what the phone plays, digitally and with the phone still muted, and prints a transcript; taps a "say it again" button if given one (`REPLAY_TAP="x y"`) |
| `look <name>`, `act <name> <seconds> <command…>` | Hear the question again, then `ui` and `shot`; do one thing while recording, then the same |
| `both`, `vid` | Sound and screen recorded together with a contact sheet; screen frames two a second, for what moves too fast for screenshots |
| `findcolor <r> <g> <b>` | Centres of blobs near a colour, for moving targets |

**Rules that go with it.**

- Never type a password, create an account, buy, subscribe, rate or review; back out of any plan or payment screen without choosing. Tell the developer about a trial's renewal date if the app shows one.
- Do not raise the volume, read or use anything else on the phone, or delete the developer's files. Say what the session left behind (pictures an app saved, progress and stars on a child's profile, settings changed and restored, tools installed on the Mac).
- The write-up says who played and how: an adult design read by an assistant, speech transcribed by software and not heard, no child's reaction. It never counts as a phone playtest of the island ([parked checks](DEVICE-CHECKS.md)).
- This repository is public. A child's name, an account email and screenshots showing either stay out; so does a detailed bug list written for another app's developer. That note is written in the developer's voice, saved outside the repository, and sent by the developer, never by the assistant.
- Keep the play notes as you go (one line per thing seen, corrections marked as corrections); the review is written from them.

## Keeping AGENTS.md small

Every session and subagent re-reads AGENTS.md on every turn. Codex reads only its first 32 KiB by default and Antigravity caps each rule file at 24,000 bytes (`scripts/agent-guard.test.mjs` enforces both).

It was trimmed under the limit on 2026-10-23 and 2026-11-06 and crept back each time, because each session added a rule in place. Since 2026-11-07 it holds rules and pointers only (about 18 KB): add a new rule as one line there and its detail, reasons and dates here, in DESIGN.md or in the owning doc. The same goes for this guide and the subagent prompts (synced from `.claude/agents/` by `node scripts/sync-agents.mjs`): a rule lives in one place, and the others point to it.

This guide keeps every line under 600 characters, the width `node scripts/peek.mjs section` prints, so a session or subagent reading one section sees all of it (`scripts/docs-map.test.mjs`): split a long paragraph rather than extend it.
