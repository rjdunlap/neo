import { INVENTED, PAIRS, inventedName, type ChoiceWord, type NameLineId } from './logic.ts';

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

/** Level 7: the line for a name said as `first` then `last` while naming `head`'s thing, right or wrong. */
export function nameLine(head: string, first: string, last: string): NameLineId {
  return `wordglue.name.${head}.${first}-${last}` as NameLineId;
}

/** Every level-7 line written out in full, so each has a build-time clip and no invented name reaches device speech through a template. */
const named = Object.fromEntries(
  INVENTED.flatMap((row) => {
    const tiles = [row.head, ...row.details];
    return tiles.flatMap((first) =>
      tiles
        .filter((last) => last !== first)
        .map((last) => {
          const said = `${capitalize(first)}… ${last}.`;
          if (last === row.head) {
            const other = row.details.find((d) => d !== first)!;
            return [
              nameLine(row.head, first, last),
              [
                `${said} A ${inventedName(first, last)}: ${row.meanings[first]}! A ${inventedName(other, row.head)} would be right too.`,
              ],
            ];
          }
          return [
            nameLine(row.head, first, last),
            [
              `${said} A ${inventedName(first, last)} would be a ${last}! This is a ${row.head}, so ${row.head} goes last.`,
            ],
          ];
        }),
    );
  }),
) as Record<NameLineId, string[]>;

export const VOICE = {
  ...which,
  ...named,
  'wordglue.instruct.name': ["Here's a new thing! Nobody has named it yet. Tap two pictures to name it."],
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
