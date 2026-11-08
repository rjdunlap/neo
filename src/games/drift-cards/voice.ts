// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.drift-cards': ['Drift cards!'],
  'drift.instruct.1': [
    'The arrows show which way the sea is moving. Where will the card wash up? Tap a beach.',
  ],
  'drift.instruct.2': ['{friend} wants a card. Which boat should drop it?'],
  'drift.landed': ['Found by {friend} on the {beach} beach!'],
  'drift.first': ['It went this way. Follow the arrows with it next time.'],
  'drift.wrong.1': ['Not there. Follow the arrows: it goes {dir}, then {dir2}.'],
  'drift.wrong.2': ["That one reached {friend2}. Which boat's arrows lead to {friend}?"],
  'drift.hint.1': ['Follow it all the way.'],
  'drift.hint.2': ['Try this boat.'],
  'drift.real': [
    'Scientists drop wooden drift cards into the sea and ask the people who find them to say where. That shows where the water went.',
  ],
  'drift.done': ['Every card was found!'],
  'drift.instruct.3': [
    'Some of the sea is foggy. The cards came back from these beaches. Which arrows fit every card?',
  ],
  'drift.wrong.3': ['With these arrows, card {n} would wash up here, but {friend} found it there.'],
  'drift.hint.3': ["Card {n} can't land where it was found with this one."],
  'drift.hint.3fit': ['These arrows send every card home. Press the green check.'],
  'drift.right.3': ['Yes! These arrows send every card to the beach where it was found.'],
  'drift.limits': ['Real currents change with the wind and the tides. This pretend sea stays still.'],
} satisfies Record<string, string[]>;
