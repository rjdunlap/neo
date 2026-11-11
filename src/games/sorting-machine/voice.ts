// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.sorting-machine': ['Sorting Machine!'],
  'sm.instruct.1': [
    'Tap a friend, then tap Send. Watch the sensor read the friend, and see what the door does!',
  ],
  'sm.instruct.hat': [
    'The sign says friends with a hat may come in. Pick the sensor the machine needs, then Check every friend.',
  ],
  'sm.instruct.whiskers': [
    'The sign says friends with whiskers may come in. Pick the sensor the machine needs, then Check every friend.',
  ],
  'sm.instruct.boots': [
    'The sign says friends with boots may come in. Pick the sensor the machine needs, then Check every friend.',
  ],
  'sm.instruct.both.hat-whiskers': [
    'The sign says only friends with a hat and whiskers may come in. Pick the gate the machine needs, then Check every friend.',
  ],
  'sm.instruct.both.hat-boots': [
    'The sign says only friends with a hat and boots may come in. Pick the gate the machine needs, then Check every friend.',
  ],
  'sm.instruct.both.whiskers-boots': [
    'The sign says only friends with whiskers and boots may come in. Pick the gate the machine needs, then Check every friend.',
  ],
  'sm.pick-friend': ['Tap a friend first, then Send.'],
  'sm.pick-first': ['Pick a sensor first. Tap the empty slot.'],
  'sm.door-open': ['The sensor read yes, so the door opened!'],
  'sm.door-shut': ['The sensor read no, so the door stayed shut.'],
  'sm.value-true': ['A star: the sensor read yes.'],
  'sm.value-false': ['A ring: the sensor read no.'],
  'sm.value-incomplete': ['A question mark: the machine has no sensor to read with yet.'],
  'sm.picked': ['Sensor in! Send a friend to try it, or tap Check.'],
  'sm.check-pass': ['Every friend got the door the sign wants. The machine is right!'],
  'sm.check-fail.hat': [
    "That door doesn't match the sign. The sign says friends with a hat may come in. Look at what the sensor read.",
  ],
  'sm.check-fail.whiskers': [
    "That door doesn't match the sign. The sign says friends with whiskers may come in. Look at what the sensor read.",
  ],
  'sm.check-fail.boots': [
    "That door doesn't match the sign. The sign says friends with boots may come in. Look at what the sensor read.",
  ],
  'sm.pick-gate-first': ['Pick a gate first. Tap the empty slot.'],
  'sm.gate-true': ['A star after the gate: the gate says yes.'],
  'sm.gate-false': ['A ring after the gate: the gate says no.'],
  'sm.gate-incomplete': ['A question mark: the machine has no gate to join the sensors yet.'],
  'sm.picked.and': [
    'The and gate is in. It says yes only when both sensors say yes. Send a friend to try it, or tap Check.',
  ],
  'sm.picked.or': [
    'The or gate is in. It says yes when either sensor says yes. Send a friend to try it, or tap Check.',
  ],
  'sm.check-fail.both.hat-whiskers': [
    "That door doesn't match the sign. The sign says only friends with both a hat and whiskers may come in. Look at what each sensor read.",
  ],
  'sm.check-fail.both.hat-boots': [
    "That door doesn't match the sign. The sign says only friends with both a hat and boots may come in. Look at what each sensor read.",
  ],
  'sm.check-fail.both.whiskers-boots': [
    "That door doesn't match the sign. The sign says only friends with both whiskers and boots may come in. Look at what each sensor read.",
  ],
  'sm.send-other': ['Send the other friend too.'],
  'sm.done': ['You watched the sensor read each friend, and the door answered. Nice looking!'],
  'sm.help.send': ['Try this friend, and watch what the sensor reads.'],
  'sm.help.installed': ['I put in the sensor the sign asks for. Tap Check to try every friend.'],
  'sm.help.send.both': ['Try this friend, and watch what each sensor reads.'],
  'sm.help.installed.gate': ['I put in the gate the sign asks for. Tap Check to try every friend.'],
  // Festival Signals (levels 8–9): one line per pair wherever a badge is named, so device speech never fills a template.
  'sm.fs.instruct.8.hat-whiskers': [
    'Build a machine that lights the lantern for a friend with just one badge: a hat or whiskers, but not both. Tap a slot to choose its part.',
  ],
  'sm.fs.instruct.8.hat-boots': [
    'Build a machine that lights the lantern for a friend with just one badge: a hat or boots, but not both. Tap a slot to choose its part.',
  ],
  'sm.fs.instruct.8.whiskers-boots': [
    'Build a machine that lights the lantern for a friend with just one badge: whiskers or boots, but not both. Tap a slot to choose its part.',
  ],
  'sm.fs.instruct.9.hat-whiskers': [
    'This lantern lights for a hat or whiskers, but it should rest when a friend has both. Try the friend with both, then fix the machine.',
  ],
  'sm.fs.instruct.9.hat-boots': [
    'This lantern lights for a hat or boots, but it should rest when a friend has both. Try the friend with both, then fix the machine.',
  ],
  'sm.fs.instruct.9.whiskers-boots': [
    'This lantern lights for whiskers or boots, but it should rest when a friend has both. Try the friend with both, then fix the machine.',
  ],
  'sm.fs.check-fail.00.hat-whiskers': [
    'The friend with no badge lit the lantern, but the sign says it rests without a hat or whiskers.',
  ],
  'sm.fs.check-fail.01.hat-whiskers': [
    'The friend with only whiskers left the lantern dark, but the sign says it lights for just whiskers.',
  ],
  'sm.fs.check-fail.10.hat-whiskers': [
    'The friend with only a hat left the lantern dark, but the sign says it lights for just a hat.',
  ],
  'sm.fs.check-fail.11.hat-whiskers': [
    'The friend with both a hat and whiskers lit the lantern, but the sign says it rests for both.',
  ],
  'sm.fs.check-fail.00.hat-boots': [
    'The friend with no badge lit the lantern, but the sign says it rests without a hat or boots.',
  ],
  'sm.fs.check-fail.01.hat-boots': [
    'The friend with only boots left the lantern dark, but the sign says it lights for just boots.',
  ],
  'sm.fs.check-fail.10.hat-boots': [
    'The friend with only a hat left the lantern dark, but the sign says it lights for just a hat.',
  ],
  'sm.fs.check-fail.11.hat-boots': [
    'The friend with both a hat and boots lit the lantern, but the sign says it rests for both.',
  ],
  'sm.fs.check-fail.00.whiskers-boots': [
    'The friend with no badge lit the lantern, but the sign says it rests without whiskers or boots.',
  ],
  'sm.fs.check-fail.01.whiskers-boots': [
    'The friend with only boots left the lantern dark, but the sign says it lights for just boots.',
  ],
  'sm.fs.check-fail.10.whiskers-boots': [
    'The friend with only whiskers left the lantern dark, but the sign says it lights for just whiskers.',
  ],
  'sm.fs.check-fail.11.whiskers-boots': [
    'The friend with both whiskers and boots lit the lantern, but the sign says it rests for both.',
  ],
  'sm.fs.empty-slot': ['This slot needs a part, and a signal for each of its inputs.'],
  'sm.fs.off-path': ["That slot isn't wired to the lantern yet."],
  'sm.fs.part.and': ['And: it says yes only when both of its signals say yes.'],
  'sm.fs.part.or': ['Or: it says yes when either of its signals says yes.'],
  'sm.fs.part.not': ['Not: it flips its signal. Yes becomes no, and no becomes yes.'],
  'sm.fs.help.run': ['Watch this friend, and read each slot. The sign wants something else for this one.'],
  'sm.fs.help.fixed': [
    'I set one thing for you, and kept the rest of your machine. Send a friend to see what changed.',
  ],
  'sm.fs.help.check': ['Your machine matches the sign on every row. Tap Check.'],
  'sm.fs.check-pass': ["Every friend's lantern matches the sign. The machine is right!"],
} satisfies Record<string, string[]>;
