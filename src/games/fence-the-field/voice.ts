/**
 * Fence the Field's spoken lines (docs/definitions/fence-the-field.md). The list is finite: a field has nine plots, so
 * every count a line names is written out here, and `voice.test.ts` checks a line exists for each one play can reach.
 */
const N = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const counted = (key: string, from: number, to: number, say: (n: number) => string) =>
  Object.fromEntries(
    Array.from({ length: to - from + 1 }, (_, i) => [`${key}.${from + i}`, [say(from + i)]]),
  ) as Record<string, string[]>;

export const VOICE = {
  'game.fence-the-field': ['Fence the Field'],
  'fence.start': ['Lay one rail each. Close a plot to claim it and go again. Get as many as you can.'],
  ...counted('fence.target', 0, 9, (n) => `You can get ${N[n]}.`),
  ...counted('fence.handed', 1, 9, (n) => `That handed me ${N[n]}.`),
  ...counted('fence.only', 0, 8, (n) => `Now you could only get ${N[n]}. Try another rail.`),
  ...counted('fence.score', 0, 9, (n) => `${cap(N[n])} for you, ${N[9 - n]} for me.`),
  'fence.hint.claim': ['Close this plot: it has three rails.'],
  'fence.hint.safe': ['This rail makes no plot ready.'],
  'fence.hint.run1': ['Every rail gives something. Give the run of one: it costs least.'],
  'fence.hint.run2': ["Give the two by the middle rail, so they can't come back to you."],
  'fence.hint.run3': ['Every rail gives something. Give the run of three: it costs least.'],
  'fence.hint.loop': ['Every rail gives something. Give the loop: it costs least.'],
  'fence.hint.give': ['Give this one: it costs least.'],
  'fence.hint.leave-two': [
    'Take all but the last two, then lay the far rail. The pet must take two and open the next run for you.',
  ],
  'fence.your-turn': ['Your turn.'],
  'fence.again': ['My turn again.'],
  'fence.down': ['That rail is down already.'],
};
