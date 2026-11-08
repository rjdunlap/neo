# Code quality tools

From the repository root, `npm ci` installs the app and lint tools from one manifest and lockfile. Run `npm run format` to format maintained TypeScript, JavaScript, CSS, HTML, configuration and workflows. `npm run format:check` and `npm run lint` run in pull-request CI. Markdown, npm lockfiles, the generated voice-clip manifest and the two content barrels keep their generator/current layout; `.prettierignore` explains these exclusions. Refresh the content barrels with their own generator as usual.

The app builds with TypeScript 7.0.2, while ESLint 10 and typescript-eslint 8.72.1 use the TypeScript 6.0.3 compiler API. Two root npm aliases implement [Microsoft's supported side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60):

- `@typescript/native`: `npm:typescript@7.0.2` supplies `tsc` for the app's typecheck/build scripts.
- `typescript`: `npm:@typescript/typescript6@6.0.2` supplies the JavaScript API for typed linting and a separate `tsc6` executable. The compatibility package is version 6.0.2; its underlying compiler is locked to 6.0.3.

The ESLint config lives at the repository root and normal `eslint` imports work. No nested installation or `postinstall` is needed. Update dependencies through the root manifest and lockfile. When changing either compiler alias, verify `npx tsc --version` (7), `npx tsc6 --version` (6) and the existing lint gates, then run typecheck, units and build.

Lint covers `src/**/*.ts`: floating promises and assertions to `any`. Production game files also reject direct `addEventListener` calls in favor of `ctx.listen`; shell/engine owners may register native listeners. Explicit `void` remains the way to mark intentional fire-and-forget work. Handle rejections where a promise can fail.

`eslint-suppressions.json` records the existing floating-promise counts per file/rule. These are unreviewed existing findings, not declarations that the calls are safe. New files and increased counts fail. The baseline is count-based: replacing an old violation in the same file may not raise the count, so review still matters. Fix findings as their code is touched, then run `npm run lint:prune` to remove stale entries. Do not regenerate the baseline to admit new findings. An intentional exception needs a narrow inline suppression and an explanation.

The formatting-only commit is listed in `.git-blame-ignore-revs`. Use `git blame --ignore-revs-file .git-blame-ignore-revs <file>`, or configure `git config blame.ignoreRevsFile .git-blame-ignore-revs` locally, to trace past it.
