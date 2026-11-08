// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.domino-run': ['Domino run!'],
  'domino-run.instruct-tap': ['Tap a domino and watch them all fall!'],
  'domino-run.instruct-gap': ['Put the domino in the gap, then tap the green one.'],
  'domino-run.instruct': ['Stand the dominoes in the gaps, then tap the green one to start the chain.'],
  'domino-run.instruct-fork': ['Two lines, two bells! Fill the gaps in both, then tap the green one.'],
  'domino-run.tall': ['Tall ones reach farther. A tall domino can reach over one empty space.'],
  'domino-run.grow': [
    'Only a giant can ring the gong. A domino can push one a little bigger, not much bigger.',
  ],
  'domino-run.too-far': [
    'Too far to reach! Try filling the gap.',
    "Oh! That one couldn't reach the next one.",
  ],
  'domino-run.too-heavy': ['Too big to push! A domino can push one size bigger, not two.'],
  'domino-run.too-heavy-giant': ["The little one can't push the giant. Try a middle one first."],
  'domino-run.ring': ['Ding! The bell rang!', 'All the way to the bell!'],
  'domino-run.ring-chime': ['Ting-a-ling! The chimes rang!'],
  'domino-run.ring-horn': ['Toot toot! The little boat honked!'],
  'domino-run.gong': ['Bong! The giant rang the gong!'],
  'domino-run.gong-drum': ['Boom! The giant banged the big drum!'],
  'domino-run.puddle': [
    'A big puddle! Only a giant can reach over it. Grow the chain to a giant right before the water.',
  ],
  'domino-run.pier': [
    'A low pier! Only a small domino fits under it. Stay small under the pier, then grow after it.',
  ],
  'domino-run.too-tall': ['Too tall to fit under the pier! Only a small one fits there.'],
  'domino-run.predict': ['Where will it stop? Tap the domino you think falls last.'],
  'domino-run.predict-right': ["You saw it coming! That's where it stopped."],
  'domino-run.predict-here': ['Ooh, it stopped here instead. Look where it stopped.'],
  'domino-run.start': ['Tap the green one!'],
  'domino-run.hint': ['Try the glowing domino where its shadow is.'],
  'domino-run.done': ['Every bell rang. What a chain!'],
} satisfies Record<string, string[]>;
