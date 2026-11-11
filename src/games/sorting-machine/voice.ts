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
} satisfies Record<string, string[]>;
