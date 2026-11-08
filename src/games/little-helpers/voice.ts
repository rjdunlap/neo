// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.little-helpers': ['Little helpers!'],
  'helpers.tap': ['Tap it! A little helper will carry it home.'],
  'helpers.send': ['Tap it to send helpers. This one needs {n}!'],
  'helpers.count': ['This one needs {n} helpers. Send them, then blow the whistle!'],
  'helpers.more': ['{m} helpers are here. It needs {n}. How many more?'],
  'helpers.heavy': ['Too heavy! It needs {n} helpers.'],
  'helpers.extra': ['Too many! It only needs {n}.'],
  'helpers.groups': [
    '{n} of them, and each one needs {m} helpers. Tap each one to send it a team, then blow the whistle!',
  ],
  'helpers.team.full': ['This one has {m}! Try another one.'],
  'helpers.split': [
    '{total} helpers, and two things to carry. One needs {a}, and one needs {b}. Send helpers to each, then blow the whistle!',
  ],
  'helpers.split.wrong': ['Not yet! One needs {a} and one needs {b}. {a} and {b} make {total}.'],
  'helpers.split.total': ['{a} and {b} make {total}!'],
  'helpers.strong': [
    'This one needs {n}. Big helpers count for two! Send any team that makes {n}, then blow the whistle.',
  ],
  'helpers.strong.short': ['Too heavy! It needs {n}. A big helper counts for two.'],
  'helpers.strong.extra': ['Too many! It only needs {n}. A big helper counts for two.'],
  'helpers.groups.short': ['Too heavy! {m} helpers for each one. Count by {m}: {list}.'],
  'helpers.groups.extra': ['Too many! {m} helpers for each one. Count by {m}: {list}.'],
  'helpers.groups.total': ['{n} groups of {m} make {total}!'],
  'helpers.lift': ['Heave ho!', 'Lift!'],
  'helpers.done': ['Everything is home! Thank you, helpers!'],
  'helpers.busy': ['Everyone is busy helping!', 'All the helpers are already helping!'],
  'helpers.whistle.empty': ['Send some helpers first! Tap it.'],
  'helpers.whistle.fill': ['Send helpers to fill every ring. When the rings are all full, blow the whistle!'],
  'helpers.whistle.notfull': [
    'Not full yet! Fill every ring.',
    'Some rings are still empty. Send more helpers!',
  ],
  'helpers.full': ["It's full! Blow the whistle!", 'Every ring is full. Blow the whistle!'],
  'helpers.more.short': ['{m} are here. It needs {n}. {gap} more!'],
} satisfies Record<string, string[]>;
