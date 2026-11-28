// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.critter-crossing': ['Critter crossing!'],
  'cross.visible': ['Only critters {rule} can cross the bridge. Tap the critters that fit!'],
  'cross.hidden': [
    'The bridge gate has a secret rule! Tap a critter to try it. Watch who crosses, then guess the rule with the light bulb.',
  ],
  'cross.yes': ['The {who} can cross!', 'Yes! The {who} goes across!'],
  'cross.no': ['The {who} has to wait.', 'Not the {who}. It waits here.'],
  'cross.notfit': ['The {who} is not {rule}. Pick a critter that fits.'],
  'cross.more': ['Try a few more critters first!'],
  'cross.pick': ['What is the secret rule? Tap a picture.'],
  'cross.cont-yes': ['The {who} crossed, but that rule would turn it back.'],
  'cross.cont-no': ['The {who} had to wait, but that rule would let it cross.'],
  'cross.settle': ['Two pictures are still in the running! Which critter can settle it? Tap one to try it.'],
  'cross.same': [
    'Both pictures would say the same about that one. Try another!',
    'That one could not tell them apart.',
  ],
  'cross.maybe': ['That could be it so far! Try another critter to be sure.'],
  'cross.hint-test': ['Try the glowing critter. It will tell us a lot!'],
  'cross.hint-pick': ['Look at who crossed and who waited. Which picture fits?'],
  'cross.right': ['The rule is {rule}! Now we know.'],
  'cross.done': ['Everyone is across! What a clever detective!'],
  // Be the gate (level 9): each slot-free line carries {name}, so it stays on device speech until a clip pass.
  'cross.seats': [
    'Who is playing with you, {name}? Tap the two friends to play together, or one friend to play alone.',
  ],
  'cross.pick-own': ['You are the gate, {name}! Pick a rule from the pictures for your bridge.'],
  'cross.lookaway': ['Partner, shut your eyes! {name}, pick a secret rule for your gate.'],
  'cross.keeper-go': [
    'Open your eyes! Tap a critter to test {name}’s gate, or tap the light bulb when you know the rule.',
  ],
  'cross.judge': ['Does the {who} cross or wait? Tap the check or the cross.'],
  'cross.pet-try': ['Hmm, let me try the {who}. Does it cross or wait?'],
  'cross.gate-fits': ['Look at your sign! The {who} is {rule}, so it can cross.'],
  'cross.gate-notfit': ['Look at your sign! The {who} is not {rule}, so it has to wait.'],
  'cross.check-sign': ['Check your rule, {name}! Tap the sign if you need a peek.'],
  'cross.pet-guess': ['I know your rule! It is {rule}!'],
  'cross.swap': ['Swap seats! Now shut your eyes, {name}, while your partner picks a rule for the gate.'],
  'cross.crackit': ['Open your eyes, {name}! Try critters at the gate and guess your partner’s rule.'],
} satisfies Record<string, string[]>;
