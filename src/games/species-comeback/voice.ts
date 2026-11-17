// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.species-comeback': ['Species comeback!'],
  'comeback.intro': [
    "Very few of the island's pond turtles were left. With the right pairs, they can come back.",
  ],
  'comeback.instruct-pair': [
    '{n} nests this spring. Tap two turtles for each nest. No brothers and sisters together!',
  ],
  'comeback.instruct-pair-cousins': [
    '{n} nests this spring. No brothers and sisters, and no cousins either!',
  ],
  'comeback.more-pairs': ['Fill every nest before Spring. {n} to go.'],
  'comeback.kin': ["{who} is {a}'s {ra} and {b}'s {rb}. They are close family."],
  'comeback.same-sex': ['A nest needs a mother and a father. Try one of each.'],
  'comeback.name': ['This is {who}.'],
  'comeback.undo': ['Back to the tree.'],
  'comeback.spring': ['Every nest is full. Press Spring!'],
  'comeback.hatched': ['Hatchlings!', 'A new row of hatchlings!'],
  'comeback.needs': [
    'The young turtles need still water, logs for sunning, soft sand for nests and water plants to hide in. Which place has them all?',
  ],
  'comeback.site-ok': ['Everything they need!'],
  'comeback.missing-water': ['No still water there. The stream runs too fast.'],
  'comeback.missing-logs': ['No logs there for sunning.'],
  'comeback.missing-sand': ['No soft sand to dig a nest there.'],
  'comeback.missing-plants': ['No water plants to hide and find food in there.'],
  'comeback.note-room': [
    "The keeper's note says: room for {n} nests this spring. Keep the pairs as far apart in the family as you can.",
  ],
  'comeback.note-big': ["The keeper's note says: a big spring! We need as many hatchlings as we can raise."],
  'comeback.plans': [
    'Plan A has {a} pairs, and {r} of them are related. Plan B has {b} pairs, and none are related. Both follow the rule. Which plan fits the note?',
  ],
  'comeback.plan-wrong-room': [
    'Plan A has more pairs, but some of them are related. The note asks for pairs far apart.',
  ],
  'comeback.plan-wrong-big': [
    'Plan B keeps every pair far apart, but it has fewer pairs. The note asks for as many hatchlings as we can raise.',
  ],
  'comeback.reason-ask': ['That plan fits this year. Why does it fit?'],
  'comeback.reason-ok': ['Yes, that is why. Now press Spring!'],
  'comeback.reason-wrong-more': ['Not that one. The other plan has more pairs.'],
  'comeback.reason-wrong-apart': ["Not that one. The other plan's pairs are less closely related."],
  'comeback.reason-wrong-every': ['No plan uses every turtle. One is always left without a pair.'],
  'comeback.hint-plan': ['The glowing plan fits the note.'],
  'comeback.hint-reason': ['The glowing card says why.'],
  'comeback.hint-pair': ['Try the two glowing turtles together.'],
  'comeback.hint-undo': ['These nests leave someone without a pair. Try undoing the glowing nest.'],
  'comeback.hint-site': ['The glowing places have everything on the card.'],
  'comeback.done': ['More turtles on the island this year!'],
} satisfies Record<string, string[]>;
