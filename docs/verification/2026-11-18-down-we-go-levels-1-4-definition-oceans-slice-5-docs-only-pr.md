# 2026-11-18 — Down We Go levels 1–4 definition (oceans slice 5, docs only, PR #1807)

**Changed:** Defined Down We Go (a lantern on a knotted rope, the sun dial, the deepest-ledge question, then cloudy water and the halving rule) as one new game for pre-K 1–2 and school 2–4, and queued its levels 1–2 build in READY. Updated the oceans study, recommendations, study backlog, roadmap and ideas rows.

**Ran:** `node scripts/check-links.mjs` and `git diff --check`. Source check by quoted-passage fetches of four NOAA Ocean Service pages (light_travel, kelp, seaweed, turbidity), NOAA Ocean Exploration's bioluminescence page and the University of Hawai‘i "Light in the Ocean" page. One finding: kelp is algae, so no line calls seaweed a plant (the lines say seaweed makes its food with sunlight). One claim only partly supported: the multiplying/halving rule, left for the build's own source check. Land capacity read from `src/content/lands.ts`: Bubble Beach holds 14 games; a 15th keeps the school side at two pages, and the pre-K side goes from one page to two with a twelfth pre-K game.

**Not run:** typecheck, unit tests, build and browser suites (no code changed). The lands test is the build's check.
