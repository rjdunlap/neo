# Day by Day — first playable slice

Built on `codex/day-by-day`: [PR #147](https://github.com/rjdunlap/neo/pull/147). Game ID: `day-by-day`.

The fun action is making a pretend week unfold: place a day, record its pictured weather, and see a little flower garden grow. The learning goal is weekday order, yesterday and tomorrow, and reading a week of observations. All seven days happen in one round; nothing uses the device date or asks for a daily return.

- **Level 1 (pre-K):** begin on Monday. Tap one of three day cards to hear its name (free exploration), then tap the large placing arrow to put it in the next slot. Match that day's visible sunny, cloudy or rainy weather on three large picture buttons. Repeat through Sunday. The next day is spoken explicitly. Seven weather records finish the round.
- **Level 2 (pre-K and school):** the same week, with the next-day prompt asking what follows the preceding day. Afterwards answer two spoken questions about tomorrow and yesterday; include Sunday to Monday and Monday to Sunday so the repeating week is explicit. Week cards replay their names and weather for free.
- **Level 3 (school):** the same week and two day questions, then count sunny records. Tap week records to mark or unmark them without changing the weather; choose the total from three numbers. Supported completion stays available.

A mistaken confirmation or weather/number answer gets a boing and spoken explanation. Free card naming, replay and counting marks never count as mistakes. Two misses on one question glow the answer, once, and add one hint. One shell-awarded sticker per complete week, including with help. A garden is a playful day counter, not a claim that weather alone grows plants. Months, seasons and caterpillar life cycles stay proposed.

Use code-drawn palette art and synthesized sound, seeded weather and distractors, `onTap`, spoken `ctx.instruct` / `ctx.say`, and a ghost-finger bot. Board and controls stay at least 100 logical units with the corner guide clear in landscape and portrait. Return through Cozy Village, whose Clock Tower already introduces time. A grown-up can take weather recording while the child names days; off screen, lay out seven cards for a pretend week and talk through yesterday and tomorrow.

Expected files: `src/games/day-by-day/{index,logic,logic.test}.ts`, registry, lands, voice script, how-to, `scripts/browser-check.mjs`, README, GAMES, IDEAS, ROADMAP and VERIFICATION. Checks: typecheck, unit tests, build for catalog integration, one filtered first/top-level scripted play (mistake, hint, reward and portrait), and the filtered finger demonstration. No shared navigation or persistence behavior changes.
