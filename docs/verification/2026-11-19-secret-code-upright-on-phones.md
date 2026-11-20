# 2026-11-19 — Secret Code upright on phones (PR #1884)

**Changed:** Secret Code plays upright at every level (`upright: true`). The layout is now the pure `codeLayout` in `layout.ts`: the door hangs 400 up from the bottom edge, the tray spread widens from a 94 to a 113 pitch for five stones on 768 (x 160 to w-40), and level 12's two-of-us hidden-code panel, which sat at w-224 over the tries list, is scaled 0.6 at w-140 upright.
**Ran:** `npm run typecheck`; eslint; Secret Code and registry unit tests including the new per-level `upright.test.ts` (all 12 levels, five upright views).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=secret-code` by real touches: preschool 10, 1; prek 1, 3; school 2, 11, 9, 12, 5; `PHONE_SHOTS` screenshots of levels 5 and 12 viewed. Headless Chrome only.
**Not run:** build, offline, other suites (no shared files touched).
