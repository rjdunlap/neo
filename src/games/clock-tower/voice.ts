// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.clock-tower': ['Clock tower!'],
  'clock.hour': ['Turn the short hand to make it {time}. Then ring the bell!'],
  'clock.set': ['Make the clock say {time}. Turn the hands, then ring the bell!'],
  'clock.control.hour': ['Touch the middle of the clock to turn the short hour hand.'],
  'clock.controls': [
    'Touch the middle to turn the short hour hand. Touch near the edge to turn the long minute hand. Tap the time sign to hear the request again.',
  ],
  'clock.read': [
    'Here is a pretend plan for a friend. Which picture has the same time as the big clock? Tap a picture to choose. Tap its time to hear it.',
  ],
  'clock.later': ['The clock says {time}. Make it say one hour later, then ring the bell!'],
  'clock.shows': ['The clock says {now}. We want {time}.'],
  'clock.later.wrong': [
    'That says {now}. Watch: {from} becomes {time}, one hour later. The minutes stay the same.',
  ],
  'clock.later.example': ['One hour later: {from} becomes {time}. The minutes stay the same.'],
  'clock.earlier': ['The clock says {time}. Make it say one hour earlier, then ring the bell!'],
  'clock.earlier.wrong': [
    'That says {now}. Watch: {from} goes back to {time}, one hour earlier. The minutes stay the same.',
  ],
  'clock.earlier.example': ['One hour earlier: {from} goes back to {time}. The minutes stay the same.'],
  'clock.half-later': ['The clock says {time}. Make it say half an hour later, then ring the bell!'],
  'clock.half-later.wrong': ['That says {now}. Halfway around from {from} is {time}, thirty minutes later.'],
  'clock.half-later.wrong.cross': [
    'That says {now}. Thirty minutes from {from} crosses twelve to {time}, in the next hour.',
  ],
  'clock.half-later.example': ['Half an hour after {from} is {time}, thirty minutes around the clock.'],
  'clock.how-long': [
    'The clock starts at {from} and ends at {time}. How long was that? Choose the hours and the half hour, then ring the bell!',
  ],
  'clock.how-long.wrong': [
    'That is {chosen}. From {from}, that would end at {end}, but the clock ends at {time}. Try again.',
  ],
  'clock.how-long.zero': ['That is no time at all. The clock moves from {from} to {time}. Try again.'],
  'clock.how-long.help': ['{count} Choose the same hours and half hour.'],
  'clock.five.zero': [
    'At 12, the digital clock shows zero minutes. A full turn is sixty minutes: the next hour starts at zero.',
  ],
  'clock.five.help': ['Count from zero by fives: {counts} minutes. Copy the yellow hands for {time}.'],
  'clock.read.wrong': [
    'Compare both hands on the big clock with the little clocks beside the pictures. You can tap each time to hear it.',
  ],
  'clock.hint': ['Look at the yellow hands. Turn yours to match them.'],
  'clock.hint.read': ['The glowing picture matches the clock.'],
  'clock.itis': ['In this pretend plan, {event} is at {time}!'],
  'clock.appointment': ['In this pretend plan, {event} is at {time}.'],
  'clock.yay': ['Ding dong! Right on time!', 'Tick tock, you did it!'],
  'clock.done': ['The clock tower is right on time. Thank you!'],
} satisfies Record<string, string[]>;
