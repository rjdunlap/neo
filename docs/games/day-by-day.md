# Day by Day

<!-- generated: from src/games/day-by-day; edit the text below the end mark (npm run game-docs) -->

**ID:** `day-by-day` · **Land:** Cozy Village · **Ages:** preschool–school · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** weekday order, yesterday and tomorrow, weather records, counting observations, comparing evidence, comparing bar records

| Band | Levels, easiest first |
| --- | --- |
| preschool | 9 |
| pre-K | 1, 2, 4 |
| school | 2, 4, 10, 3, 5, 6, 7, 8 |

| Level | Plays like |
| --- | --- |
| 1 | Place the days and record a pretend week |
| 2 | Tomorrow and yesterday, including the week turning |
| 3 | Yesterday, tomorrow and a sunny-day tally |
| 4 | A day beside any day |
| 5 | Count this weather, including none |
| 6 | Weather Window: compare two supplied weeks |
| 7 | Month wheel: the month before and after, round the year |
| 8 | Daylight records: compare two pretend records |
| 9 | Three little skies: match three pictured skies |
| 10 | Count beside the record |

<!-- end generated -->

**Starts as:** place spoken weekday cards and stamp a pretend week of weather into a seeded flower garden; preschool starts at level 9, matching three pictured skies

**Grows into:** yesterday, tomorrow across the week boundary, then count sunny records, or tomorrow and yesterday from any day; supplied-record counting bridge at 10; count any weather, including zero, at 5; compare two supplied weeks at 6; the month wheel at 7 and daylight records at 8 (school); preschool's entry, three little skies (9), then pre-K at 1

## Design notes

Daylight records (level 8, school only, built 2026-11-27, PR #2302): two supplied, explicitly pretend records from one pretend town ("taken at different times of year") sit as two panels, each five aligned bars on a toy scale of ten drawn over a faint ten-long track. A longer bar is more daylight; the bars are not hours and the level names no season, hemisphere or cause (decision 3). Question one has one record longer on every aligned bar by at least two (which side is seeded); question two is the equality example, either the same record twice or a different pair with the other side longer, asked as same or different. `makeDaylight` and `daylightTrue` in `logic.ts` make exactly one summary true. Tapping a record says its name and highlights it, with no hold; the arrow confirms a chosen summary and only a wrong confirm is a miss. Two misses on a question add one hint that glows the longer record (both when the question is same or different) and the true summary. The ghost finger visits both records, then answers. The wide layout sits the records right of the replay button; the upright layout stacks them. The `daylight.` lines have no rendered clips yet and use device speech.

Month wheel (level 7, school only, built 2026-11-24, PR #2101): twelve month cards (100x100) sit on an ellipse ring, January at the top and clockwise, with an arrow to confirm. Three questions from `monthQuestions` in `logic.ts` use six distinct months: one across the year's turn (after December or before January), then one before and one after. A tap on a card says its name and selects it; the arrow confirms. A wrong confirm is a miss and the line names both neighbours; two wrong answers give one hint that glows the named month and the answer. No month lengths, seasons or holidays. The bot taps the answer, then the arrow. The new `month.` lines have no rendered clips yet and use device speech; the ring layout is tested at three view sizes (`month-wheel.test.ts`). School order is now [2, 4, 10, 3, 5, 6, 7].

Three little skies (level 9, preschool only, built 2026-11-23): three pictured skies (one sunny, one cloudy, one rainy, seeded order) are matched one at a time with the existing weather buttons. Records are numbered 1 to 3 with the caption "Sky N of 3"; there is no weekday, week, today, yesterday or tomorrow claim. A wrong tap gets a boing and a spoken hint naming the weather; two wrong taps on one sky glow the matching button (one hint). It finishes after three records with one sticker. Bands are preschool, pre-K and school; entryLevels are [10, 9], so pre-K starts at 1 and school at 2 when leaving 9, and no saved level is renumbered. Voice lines are `skies.*` (three clips, prefix added in `scripts/voice-clips/clips.mjs`).

On an upright phone, the calendar keeps all seven day cards at full size across two rows. Weather Window uses the same two rows on each week page. The week-turn path curves around the records, and short phones place the arrow beside the area used for spoken captions.

Make a whole pretend week in one round: tap one of three day cards to hear its name, then tap the placing arrow to commit it. Record each day's code-drawn sky by choosing sunny, cloudy or rainy. Each recorded day opens another flower in a playful garden; this is a day counter, not a plant-growth model. Nothing follows the device date or requires daily returns. At levels 1–3, a teal placement thread and settling cream weather stamp show what was recorded. A seeded wooden box, cream pot row or teal-edged bed varies the garden without changing questions. During the boundary questions a dotted return path connects Sunday and Monday, with both records outlined as free visible evidence.

Level 1 explicitly names the next day and finishes after seven weather records. Level 2 asks what follows the preceding day, then asks tomorrow after Sunday and yesterday before Monday, explaining the repeating week. Level 3 adds a tally of sunny records: tap week cards to mark or unmark them as you count, then choose the total. Tapping recorded cards replays their day and weather. Card naming, replay and counting marks are free support; only mistaken day confirmations or weather/number answers count as misses. Each wrong answer gets a boing and spoken explanation; two on the same question glow its answer and add one hint. One sticker per complete week, even with help. Level 4 builds the week as at 2, then asks tomorrow after one seeded day and yesterday before a different one, in shuffled order, with no tally; across rounds every day is an anchor. Its hint glows the answer card only. Level 10, Count beside the record, supplies a seeded seven-day week with three suns among rain/clouds. Suns are outlined from the start as baseline support (zero hints); all records replay and mark/unmark freely, and one correct total finishes regardless of marks. Wrong totals ask her to count each outlined sun once; two misses glow the correct number and add one hint, only once. Pre-K order stays [1, 2, 4]; school order is [2, 4, 10, 3, 5, 6]. Level 5 builds the week and asks two varied relative-day questions, then counts a seeded sunny/cloudy/rainy category. Its authored total ranges from zero to seven; zero means no matching record. The requested weather stays pictured, replay/marks remain free and optional, and two wrong totals highlight matching records and the answer once. The ghost finger marks the requested category. Level 3 retains its original all-category week and sunny-only tally. Entry metadata [10] preserves IDs and pins and starts a band without this bridge at its own easiest level. Level 6, Weather Window, supplies two immutable seven-day records on large Week A/B pages. No day/weather re-entry is required. Two questions compare rainy-day totals and whether sunny-day totals are equal (including zero = zero). Tap either summary to hear/select it, then tap the separate arrow to commit; only a wrong confirmation counts as a miss. The pictured question replays; all fourteen records can be replayed/marked freely, with separate reversible marks per page. Two misses per question add one hint, outline matching records on either page and glow the true summary; further misses do not add hints for that question. Correct summaries use the actual A/B counts, and two correct confirmations finish with one shell sticker regardless of marks. The seeded pool varies records, which week has more rain, equality/difference and summary positions. A ghost finger visits both pages and relevant records before confirming. Months, daylight and a younger entry remain decision-gated; life cycles belong to Life Story Lab.

The card's name never holds input: picking a card starts its name and the arrow or another card acts at once, cutting the line; only the weather record, the instructions and the hints are held.

**Replayed records and relative answers never hold the next question (U7 fix batch 13, 2026-11-12).** A replayed record's `week.record` starts with input open and her next record tap cuts it; a right relative's yes line starts and the next question shows at once (at levels 3 and 5 it also plays over the tally's number cards), the spoken ask waiting for the line and said at her first tap or by the guide. In the Weather Window a tab's, record's or summary's line starts with input open, the first `window.evidence` starts as the second board is dealt, and the second is heard out before `window.done`. The weather pick's `week.record` and the last relative's line stay held.
