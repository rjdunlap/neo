// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'window.rain': [
    'Here are two pretend weeks, A and B. Which has more rainy days? Tap the week tabs to look at both records. Tap a summary to hear it, then the arrow to check. Tap the rain picture to hear this question again.',
  ],
  'window.sun': [
    'Now compare the sunny days in both pretend weeks. Are their totals equal or different? Tap both week tabs to look. Hear a summary, then tap the arrow to check.',
  ],
  'window.page': ['Week {week}. All seven days are here.'],
  'window.record': ['In pretend week {week}, {day} was {weather}.'],
  'window.more': ['Week {week} has more {weather} days.'],
  'window.equal': ['Both weeks have the same number of {weather} days. Their totals are equal.'],
  'window.different': ['The weeks have different numbers of {weather} days. Their totals are not equal.'],
  'window.counter': [
    'Look at the {weather} records on both pages. Week A has {a} and week B has {b}. You can count each matching picture once.',
  ],
  'window.evidence': ['The records show {a} {weather} days in week A and {b} in week B.'],
  'window.done': [
    'We used the records to compare two pretend weeks. These records tell us about these weeks. They do not tell us what the weather will do next.',
  ],

  'month.after': [
    'The months go round and round the year, and January comes right after December. Which month comes after {month}? Tap a month to hear it, then tap the arrow.',
  ],
  'month.before': [
    'The months go round and round the year. Which month comes before {month}? Tap a month to hear it, then tap the arrow.',
  ],
  'month.name': ['{month}.'],
  'month.counter': [
    'Not that one. The month before {month} is {before}, and the month after {month} is {after}.',
  ],
  'month.hint.after': ['Look at the glowing months. After {month} comes {answer}. Tap it, then the arrow.'],
  'month.hint.before': ['Look at the glowing months. Before {month} comes {answer}. Tap it, then the arrow.'],
  'month.yes.after': ['After {month} comes {answer}!'],
  'month.yes.before': ['Before {month} comes {answer}!'],
  'month.yes.wrap': ['After {month} comes {answer}. The year goes round to the start again!'],
  'month.yes.wrapback': ['Before {month} comes {answer}. The year goes back round to the end!'],
  'month.done': ['We turned the month wheel! The months go round and round.'],
  'game.day-by-day': ['Day by Day!'],
  'skies.first': ['Here is a sky picture. Is it sunny, cloudy or rainy? Tap the matching weather picture.'],
  'skies.next': ['Here is another sky picture. Tap the weather picture that matches it.'],
  'skies.record': ['Sky {n} is {weather}.'],
  'skies.hint': ['Look at the sky picture. This sky is {weather}. Find the matching picture.'],
  'skies.done': ['Three little skies! We matched sunny, cloudy and rainy.'],
  'week.place': [
    'Find {day} for our pretend week. Tap a card to hear its name, then tap the arrow to place it.',
  ],
  'week.next': [
    'We just placed {day}. What day comes next? Tap a card to hear it, then tap the arrow to place it.',
  ],
  'week.name': ['{day}.'],
  'week.weather': ["Look at {day}'s pretend sky. Tap the matching weather picture to record it."],
  'week.record': ['{day} was {weather} in our pretend week.'],
  'week.tomorrow': [
    'The week repeats after Sunday. If today is {day}, what day is tomorrow? Choose a card, then tap the arrow.',
  ],
  'week.yesterday': [
    'The week repeats. If today is {day}, what day was yesterday? Choose a card, then tap the arrow.',
  ],
  'week.tomorrowyes': ['Tomorrow is {day}. Sunday goes round to Monday!'],
  'week.yesterdayyes': ['Yesterday was {day}. Sunday comes just before Monday!'],
  'week.tomorrowany': ['If today is {day}, what day is tomorrow? Choose a card, then tap the arrow.'],
  'week.yesterdayany': ['If today is {day}, what day was yesterday? Choose a card, then tap the arrow.'],
  'week.tomorrowanyyes': ['Tomorrow is {day}. {day} comes right after {today}!'],
  'week.yesterdayanyyes': ['Yesterday was {day}. {day} comes right before {today}!'],
  'week.tomorrowhint': ['After {today} comes {day}. Tap its card, then the arrow.'],
  'week.yesterdayhint': ['Just before {today} was {day}. Tap its card, then the arrow.'],
  'week.countrecord': [
    'This pretend week is already recorded. The suns have outlines to help us count. Tap records to hear and mark them, then choose how many sunny days.',
  ],
  'week.countrecordhint': ['Count each outlined sun once, then choose the total.'],
  'week.countrecorddone': ['We read the pretend week and counted its sunny days!'],
  'week.weathertally': [
    'Look back at our weather records. How many days were {weather}? Tap records to mark them as you count, then choose the total. If there are none, choose zero.',
  ],
  'week.weathertallyhint': [
    'Count each {weather} record once. There are {n} {weather} days in our pretend week.',
  ],
  'week.zerohint': ['None of our records show {weather} weather. No {weather} days means zero. Choose zero.'],
  'week.weathertotal': ['{n} {weather} days! We counted the weather records.'],
  'week.tally': [
    'Look back at our weather records. How many days were sunny? Tap records to mark them as you count, then choose the total.',
  ],
  'week.dayhint': ['We need {day} here. Tap its card, then the arrow.'],
  'week.weatherhint': ['Look at the sky picture. This day is {weather}. Find the matching picture.'],
  'week.tallyhint': ['Count each sun once. There are {n} sunny days in our pretend week.'],
  'week.total': ['{n} sunny days! We counted the weather records.'],
  'week.done': ['A whole pretend week! We placed the days and recorded their weather.'],
} satisfies Record<string, string[]>;
