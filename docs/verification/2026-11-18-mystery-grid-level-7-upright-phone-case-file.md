# 2026-11-18 — Mystery Grid level 7 upright phone case file (PR #1832)

**Changed:** Level 7 slides under pinned headers on an upright phone, with 88-unit squares and clue cards (44.7 CSS px at 390 × 844). Short views keep written clues above the spoken caption. Help brings its square into view, with an outline above the dense grid art.
**Ran:** Typecheck, scoped formatting and lint, links, diff check and 122 focused rule, thumb-size and upright layout tests. Chromium on port 5197: `logicgrid` with `LOGICGRID_FROM=7 LOGICGRID_PHONE=1` (390 × 640 and 390 × 844, swipe, native cancel, still tap, Help, rotation, one sticker and reviewed screenshots); `LOGICGRID_FROM=8` (existing sliding board to its sticker); `fingerdemo` at level 7, grown-up.
**Not run:** Offline, other levels and a separate local production build.
