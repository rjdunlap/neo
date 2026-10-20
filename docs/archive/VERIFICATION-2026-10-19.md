# Verification 2026-10-19 (archived entries)

## 2026-10-19 — Medieval life subject research

- Added the [medieval-life study](../deep-dives/subjects/medieval-life.md) on `claude/subject-medieval-life` ([PR #581](https://github.com/rjdunlap/neo/pull/581), claimed 2026-10-18 and finished this session after a rebase onto `origin/main` 65734e65): opened England's history programmes (gov.uk), extracted the California HSS standards, the LACOE 6–8 C3 guide and the Nuffield *KS1 Castles: Homes in the Past* lesson locally from their PDFs (pypdf), read the Oldenburg release on the Bakenhus drawing study, the castle, arch, guild, market town, assize of bread and ale, tally stick, three-field system, canonical hours, Salisbury clock, scriptorium, stained glass, wool trade, Luttrell Psalter, Domesday, serfdom, rule of tincture, nine men's morris and Carcassonne pages, the Medievalists.net report on the Getty manuscript exhibition, English Heritage's medieval hub and the Townscaper, Foundation, Pentiment and Discovery Tour pages. Keep House is the first ladder (eight planning rungs, toddler–13+); Market Days the grown-up colouring puzzle; six existing-game modes, two records cases, a source case pack and two family cards.
- Updated the subject tracker, the roadmap's subject table, two notebook rows, [Medieval life recommendations](../deep-dives/subjects/RECOMMENDATIONS.md#medieval-life-recommendations) and developer decisions. Ran `node scripts/check-links.mjs` and `git diff --check`. No code, tests, build, browser or device checks: docs only.
- Open: placement and the capacity test, Market Days' home, a named medievalist, unfree-labour depth, the Church boundary, Keystone's physics; the Getty news page was not readable this session; no reference game played.

## 2026-10-19 — Generated creature art review (docs only)

- Reviewed the art request queue's R01–R15 (89 originals from [PR #564](https://github.com/rjdunlap/neo/pull/564) to [PR #585](https://github.com/rjdunlap/neo/pull/585)) in [ART-REVIEW-2026-10-19.md](../rework/ART-REVIEW-2026-10-19.md): contact sheets of every chosen base, portrait, `alt`, the pilot expressions, wearables, scenes and looks, and the prepared sprites at guide size on dark and card size on sky blue (`docs/rework/concepts/art-review-2026-10-19.png`).
- Ran `node scripts/creature-art/prepare-sprite.mjs --set <species> --check` for all nine species into a scratch folder (nothing written under `src/`): every set passed the 4 px alignment rule (widest drift 2 px), the paper key found flat white in every file, and no white fringe showed on dark at guide size.
- Added queue rows R17–R23 (two open, five blocked on named slices or decisions), the RW02b step 2 slice at the top of READY's Next ten with the wearables fit and second-wave preparation queued, the RW02b status, the roadmap row and a catalog-wide art decision for the developer.
- Ran `node scripts/check-links.mjs` and `git diff --check`. No code changed; no code checks.
- Not run: any rig or motion with the new sets, an iPad, 2× ink-edge quality, a child's reaction.
- Open: the step 2 slice; the developer's catalog-wide art decision.
