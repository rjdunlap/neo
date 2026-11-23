// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.look-it-up': ['Look it up!'],
  'lookitup.say': ['{text}'],
  'lookitup.ask': ["{text} Let's look it up!"],
  'lookitup.instruct.labels': ['Touch a word to hear it.'],
  'lookitup.miss': ["{what} {fact} Let's look in the guide for the {kind}."],
  'lookitup.instruct.contents': ["Find the animal's name on the contents page, then tap it."],
  'lookitup.page': ['Page {n}. {title}.'],
  'lookitup.picture-words': ['The picture shows the baby. The words tell its name.'],
  'lookitup.hint.contents': ["Let's go back to the contents page."],
  'lookitup.hint.line': ['Find {title} on the contents page.'],
  'lookitup.miss.tag': ["That tag says {word}. A {word} is a baby {owner}. Let's read the {kind}'s page."],
  'lookitup.hint.second': ['Now find another page that says {key}.'],
  'lookitup.share.right': ["{friend}'s page says {key} too!"],
  'lookitup.miss.share': ["{caption} That page doesn't say {key}."],
  'lookitup.done': ['Every visitor has been helped. Thank you!'],
} satisfies Record<string, string[]>;
