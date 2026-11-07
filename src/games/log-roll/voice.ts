// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.log-roll': ['Log Roll!'],
  'log.go': ['Tip the log across the stones with the arrow buttons. A standing log tips onto two stones. A lying log can roll or stand up. Finish standing in the dark hollow with the golden rim.'],
  'log.edge': ['The log needs a stone under both ends. It stayed where it was. Try another direction, or Undo to find more room.'],
  'log.hint': ['Tip in the glowing direction. It starts a shortest route to stand in the hollow.'],
  'log.restart': ['The log is back at its starting stone. Try another route.'],
  'log.done': ['The log stands in its hollow! You planned where both ends would land.'],
} satisfies Record<string, string[]>;
