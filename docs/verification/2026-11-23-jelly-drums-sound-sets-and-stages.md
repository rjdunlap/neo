# 2026-11-23 — Jelly Drums sound sets and stages (PR #2078)

**Changed:** a round's instrument now comes from its seed (`soundSetFor`): marimba on Music Mountain, bells on a moon stage, or a soft hum (`sfx.hum`) on a beach bandstand, all on the same five steps; stage drawing in `src/games/jelly-drums/stages.ts`.
**Ran:** typecheck, full `npm test` (507 files, 18850 tests passed), lint, format check, `npm run build`, and `BROWSER_SUITE=originals ORIGINALS_ONLY=jellysets` (touch phone; each set upright at level 1 and sideways at level 5) passed, with six screenshots (`jelly-drums-set-{marimba,bells,hum}-{upright,sideways}`).
**Not run:** the full `originals` suite and `fingerdemo` (rules and bot unchanged), offline. Whether the bells and hum sound good on a phone speaker is for a phone playtest.
