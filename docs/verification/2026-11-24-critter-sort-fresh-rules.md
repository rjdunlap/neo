# 2026-11-24 — Critter Sort fresh rules (PR #2109)

**Changed:** Critter Sort level 6 Just a few can now draw `pink` (pig), `orange` (cat) or `yellow` (duck) as its one-hoop rule (`ENTRY_RULES`); level 1 and all two-hoop and harder levels keep the six `RULES`. New rules and sign icons are in the shared sorting `Rule` type.
**Ran:** typecheck; full `npm test` (509 files passed); critter-sort, crossing and learning vitest, including new rule tests (each new rule splits the drawn six; only level 6 draws it).
**Not run:** browser play, build (no shared assets changed), voice clip generation (the new rule words use device speech until the next clip batch).
