// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  // Circuit Garden: a toy lantern lights only when the wires make a complete loop through it and back to the battery.
  'game.circuit-garden': ['Circuit Garden!'],
  'circuit.instruct.1': ['Join the gap so the lantern has a way back to the battery.'],
  'circuit.instruct.2': ['Try the switch. Watch the lantern on and off.'],
  'circuit.closed': ['The connections make a complete loop through the lamp.'],
  'circuit.open': ['There is a break. The lantern is off.'],
  'circuit.supply-break': ['Join this gap from the battery to the lamp.'],
  'circuit.return-break': ['Join this gap back to the battery.'],
  'circuit.unseen-on': ['Try the switch to see the lantern on.'],
  'circuit.unseen-off': ['Try the switch to see the lantern off.'],
  'circuit.can-finish': ['You saw it! Press the tick when you are done.'],
  'circuit.instruct.3': ['Mend the two gaps. Then check if the lantern lights.'],
  'circuit.check-first': ['Check your connections. Press the magnifier to see if the lantern lights.'],
  'circuit.checked': ['The lantern lights. You can finish.'],
} satisfies Record<string, string[]>;
