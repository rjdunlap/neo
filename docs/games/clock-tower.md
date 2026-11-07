# Clock Tower

<!-- generated: from src/games/clock-tower; edit the text below the end mark (npm run game-docs) -->

**ID:** `clock-tower` · **Land:** Cozy Village · **Ages:** pre-K–school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** telling-time, daily-routines, number-sense

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–4 |
| school | 2–7 |

| Level | Plays like |
| --- | --- |
| 1 | Turn the short hand to the hour: "3 o'clock" (the long hand stays at 12) |
| 2 | Set both hands for o'clock times |
| 3 | Half past: the long hand at 6, the short hand between two numbers |
| 4 | Quarter past and quarter to |
| 5 | Match the clock to a pictured appointment with a visible, replayable time |
| 6 | One hour later: set the clock an hour after the time shown (o'clock and half past) |
| 7 | Five-minute times: count by fives to set 3:25 (the long hand stops at any number) |

<!-- end generated -->

**Starts as:** turn the short hand to an o'clock time

**Grows into:** both hands, half past, quarter past and to, matching visible fictional appointments with free time replay, one hour later with old/new clock explanation, five-minute times with spoken fives and a help arc; visible replayable requests and marked hand controls

## Design notes

*After teaching clocks and JumpStart's clock activities.* Drag the clock's hands; the outer ring takes the long hand and the middle the short one, and each snaps to the marks the level uses. The short hand slides between numbers as the minutes pass, like real gears. Levels: the hour hand alone, o'clock, half past, quarter past and to, matching the clock to one of three visible fictional appointments, one hour later, and (school, level 7) five-minute times such as 3:25, counting by fives with small helper numbers around the rim. A wrong time is read back aloud ("The clock says half past 4. We want 3 o'clock"); two misses show faint yellow target hands. On the hour, the tower chimes the hour. Four correct tasks complete a round. Setting levels keep a digital request sign on screen; tapping it repeats the instruction without counting a miss or hint. The one-hour-later sign shows the starting time, not the answer. A circle marks the short hour hand and a diamond the long minute hand; a length/shape key and spoken guidance explain middle versus edge selection. Five-minute speech uses explicit words such as “three twenty five” rather than a colon. Level 6 compares a faint old clock with an animated one-hour advance after each check, including 11→12 and 12→1, with unchanged minutes explained aloud. Level 7 marks zero at 12, explains a full turn as 60 minutes into the next hour, and adds spoken fives with an animated arc from zero to the target minute when help appears after two misses. Both explanations use the current task’s times; the comparison and arc take no touches. Level 3 always includes half past and level 6 always includes both wraparounds. Level 5 supplies a fresh pretend plan on each task: three existing event pictures with analog and digital times. Tap a picture to answer; tap its separate time area to hear the appointment for free, without submitting or changing misses/hints. The first board shows lunch 12:00, park 3:00 and bath 6:30; subsequent boards seed three distinct o'clock/half-past times and pictures from breakfast, school, lunch, park, bath and bed. Four distinct target times complete the round, including with help. Wrong picture choices receive a comparison hint; two on a task glow the matching card and count one hint. The visible board supplies the evidence, never a required family routine. A native cancellation listener releases a canceled hand and is removed on destroy. Actual device pronunciation remains unchecked.
