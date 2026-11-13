// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.moon-window': ['Moon window!'],

  // Moon Window: a round window on the night sky, a Later button, cards that match and compare how much is lit.
  'moonwindow.intro': ['Look out of the window!'],
  'moonwindow.instruct.look': ['Press the button to see how the Moon looks later.'],
  'moonwindow.instruct.big': ['Touch anywhere to see how the Moon looks later.'],
  'moonwindow.instruct.same': ['Which card looks the same as the window?'],
  'moonwindow.instruct.more': ['Which Moon shows more light?'],
  'moonwindow.instruct.less': ['Which Moon shows less light?'],
  'moonwindow.view.none': ['No Moon to see this time.'],
  'moonwindow.view.slice': ['A thin slice of Moon.'],
  'moonwindow.view.half': ['Half of it is lit.'],
  'moonwindow.view.most': ['Most of it is lit.'],
  'moonwindow.view.full': ['All of it is lit! A full Moon.'],
  'moonwindow.later': ['Some days later…'],
  'moonwindow.miss.same': ['This one has {has}. The window has {want}.'],
  'moonwindow.miss.compare': ['This one has {a}. That one has {b}.'],
  'moonwindow.right': ['It fits! The same Moon.', 'The same! It fits.'],
  'moonwindow.hint': ['Try the glowing card.'],
  'moonwindow.done': ['You looked at the Moon so carefully!', 'What a lot of Moon to see!'],
} satisfies Record<string, string[]>;
