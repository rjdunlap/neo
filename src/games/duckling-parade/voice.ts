// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.duckling-parade': ['Duckling parade!'],
  'parade.tap': ['Tap the grass to walk Mama Duck. Find her ducklings!'],
  'parade.walk': ['Tap the grass or lead with a finger to help Mama Duck find her ducklings, then take them to the pond!'],
  'parade.count': ['Bring {n} ducklings to the pond!'],
  'parade.color': ['Find the {color} ducklings!'],
  'parade.colorcount': ['Bring {n} {color} ducklings to the pond!'],
  'parade.pattern': ['Make a pattern: {pattern}!'],
  'parade.spare': ['Leave the spare duckling in the meadow. Bring the ducklings that make this pattern: {pattern}!'],
  'parade.home': ['Everyone is here! Take them to the pond!'],
  'parade.notme': ["Quack! I'm {color}. Find {want}!"],
  'parade.next': ['Next comes {want}!'],
  'parade.extra': ["With these arrivals, that is {count} ducklings altogether. We need {n} in the pond."],
  'parade.more': ['{k} in the pond. We need {n}!'],
  'parade.done': ['Everyone is home!', 'Splash! All home!'],
} satisfies Record<string, string[]>;
