# Code quality tools

From the repository root, `npm ci` installs both the app and the isolated lint package. Run `npm run format` to format maintained TypeScript, JavaScript, CSS, HTML, configuration and workflows. `npm run format:check` and `npm run lint` run in pull-request CI. Markdown, npm lockfiles, the generated voice-clip manifest and the two content barrels keep their generator/current layout; `.prettierignore` explains these exclusions. Refresh the content barrels with their own generator as usual.

The app builds with TypeScript 7. `typescript-eslint` currently supports TypeScript below 6.1, so this small package pins its own TypeScript 6 and lockfile. ESLint resolves that compiler here; it reads the app's `tsconfig.json`, but never builds or emits app code. The app's compiler and dependencies are unchanged. When updating lint dependencies, run `npm install --prefix tooling/lint`, commit that lockfile, and verify `npm ci` from the root.

Lint covers `src/**/*.ts`: floating promises and assertions to `any`. Production game files also reject direct `addEventListener` calls in favor of `ctx.listen`; shell/engine owners may register native listeners. Explicit `void` remains the way to mark intentional fire-and-forget work. Handle rejections where a promise can fail.

`eslint-suppressions.json` records the existing floating-promise counts per file/rule. These are unreviewed existing findings, not declarations that the calls are safe. New files and increased counts fail. The baseline is count-based: replacing an old violation in the same file may not raise the count, so review still matters. Fix findings as their code is touched, then run `npm run lint:prune` to remove stale entries. Do not regenerate the baseline to admit new findings. An intentional exception needs a narrow inline suppression and an explanation.

The formatting-only commit is listed in `.git-blame-ignore-revs`. Use `git blame --ignore-revs-file .git-blame-ignore-revs <file>`, or configure `git config blame.ignoreRevsFile .git-blame-ignore-revs` locally, to trace past it.
