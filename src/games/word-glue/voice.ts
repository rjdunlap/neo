import { PAIRS, type ChoiceWord } from './logic.ts';

// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

type LineKind = 'name' | 'ask' | 'right' | 'wrong';
type Slug<T extends string> = T extends `${infer A} ${infer B}` ? `${A}-${B}` : T;
type ChoiceLine = `wordglue.which.${Slug<ChoiceWord>}.${LineKind}`;

export function choiceLine(word: string, kind: LineKind): ChoiceLine {
  return `wordglue.which.${word.replaceAll(' ', '-')}.${kind}` as ChoiceLine;
}

const which = Object.fromEntries(
  PAIRS.flatMap(([left, right]) =>
    [
      [left, right],
      [right, left],
    ].flatMap(([entry, other]) => {
      return [
        [choiceLine(entry.word, 'name'), [`${capitalize(entry.word)}!`]],
        [choiceLine(entry.word, 'ask'), [`Which is the ${entry.word}?`]],
        [
          choiceLine(entry.word, 'right'),
          [`${capitalize(entry.word)}: ${entry.meaning}. And that one is a ${other.word}!`],
        ],
        [
          choiceLine(entry.word, 'wrong'),
          [`That's a ${other.word}, ${other.meaning}. Which is the ${entry.word}?`],
        ],
      ];
    }),
  ),
) as Record<ChoiceLine, string[]>;

export const VOICE = {
  ...which,
  'game.word-glue': ['Word Glue!'],
  'wordglue.instruct.stick': ['Stick them together!'],
  'wordglue.instruct.big': ['Touch anywhere to stick them together!'],
  'wordglue.instruct.make': ['Make a {word}!'],
  'wordglue.ask': ['I need a {head}!'],
  'wordglue.word': ['{word}!'],
  'wordglue.join': ['{first}… {second}… {word}!'],
  'wordglue.miss.make': ['{word}: {first}… and {second}.'],
  'wordglue.miss.for': ["That's a {made}, {meaning}. Who needs a {head} now?"],
  'wordglue.instruct.kind': ['Is a {word} a {a} or a {b}?'],
  'wordglue.kind.right': ['Yes! A {word} is a {second}: {meaning}.'],
  'wordglue.kind.wrong': ["A {word} isn't a {first}. It's a {second}: {meaning}."],
  'wordglue.hint': ['These two go together.'],
  'wordglue.done': ['Look at everything we made!'],
} satisfies Record<string, string[]>;
