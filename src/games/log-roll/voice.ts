// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.log-roll': ['Log Roll!'],
  'log.go': [
    'Tip the log across the stones with the arrow buttons. A standing log tips onto two stones. A lying log can roll or stand up. Finish standing in the dark hollow with the golden rim.',
  ],
  'log.go.cradle': [
    'Tip the log across the stones with the arrow buttons. This time the finish is the wooden cradle on two stones. Lay the log down across both of them.',
  ],
  'log.go.moss': [
    'Tip the log to the hollow. The green moss is too soft to stand on. Lie the log across it to pass.',
  ],
  'log.moss': ['The moss is too soft to stand on. Lie the log across it. It stayed where it was.'],
  'log.go.bridge': [
    'Stand the log on the purple ring to raise the two bridge stones. A lying log does not press the switch. Then roll across and stand in the hollow. Undo can take back the press.',
  ],
  'log.switch': ['A lying log does not press this switch. Stand the log on the purple ring.'],
  'log.raised': ['The standing log pressed the switch! The bridge stays raised. Roll across to the hollow.'],
  'log.hint.bridge': [
    'Tip in the glowing direction. This shortest route stands on the switch before crossing the bridge.',
  ],
  'log.done.bridge': [
    'You raised the bridge and reached the hollow! You planned the switch and the crossing.',
  ],
  'log.cradle': ['Standing does not fit the cradle. Lie the log down across both cradle stones.'],
  'log.edge': [
    'The log needs a stone under both ends. It stayed where it was. Try another direction, or Undo to find more room.',
  ],
  'log.hint': ['Tip in the glowing direction. It starts a shortest route to stand in the hollow.'],
  'log.hint.cradle': ['Tip in the glowing direction. It starts a shortest route to lie in the cradle.'],
  'log.restart': ['The log is back at its starting stone. Try another route.'],
  'log.done': ['The log stands in its hollow! You planned where both ends would land.'],
  'log.done.cradle': ['The log lies in its cradle! You planned the last roll to land on both stones.'],
} satisfies Record<string, string[]>;
