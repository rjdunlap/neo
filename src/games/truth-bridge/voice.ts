import {
  KINDS,
  NAMES,
  code,
  fits,
  markings,
  sentencesFor,
  settle,
  title,
  words,
  type Domain,
  type Kind,
  type Name,
} from './logic.ts';

/**
 * Truth Bridge's spoken lines. The cast and the sentence kinds are closed, so every sentence, miss explanation and
 * hint is a whole line with no slot and gets a rendered clip. The lists are built from the rules: a miss line exists
 * for each speaker, marked kind and sentence that can fail to fit, and a hint line for each sentence and the islander
 * and kind it can settle. `voice.test.ts` checks that the level pools can produce every one of them and nothing else.
 * Their ids are computed, so they are not in the `LineId` union: the game casts the ids `logic.ts` builds.
 */
type Lines = Record<string, string[]>;

const is = (name: Name, kind: Kind) =>
  `${title(name)} ${kind === 'straight' ? 'speaks straight' : 'is Topsy'}`;
const quoted = (sentenceCode: string) => `“${words(sentenceCode).slice(0, -1)}”`;

/** Every seating of two or three of the cast. */
function seatings(): Name[][] {
  const out: Name[][] = [];
  const seat = (seats: Name[]) => {
    if (seats.length >= 2) out.push(seats);
    if (seats.length < 3) for (const name of NAMES) if (!seats.includes(name)) seat([...seats, name]);
  };
  seat([]);
  return out;
}

const sentences: Lines = {};
const misses: Lines = {};
const hints: Lines = {};

for (const seats of seatings()) {
  const domainSets = seats.reduce<Domain[][]>(
    (sets) => sets.flatMap((set) => [null, ...KINDS].map((d) => [...set, d])),
    [[]],
  );
  seats.forEach((speaker, seat) => {
    for (const sentence of sentencesFor(seat, seats.length)) {
      const said = code(sentence, seat, seats);
      const pattern = seats.map(() => sentence);
      sentences[`bridge.s.${said}`] = [words(said)];
      for (const kinds of markings(seats.length)) {
        if (fits(sentence, seat, kinds)) continue;
        misses[`bridge.miss.${speaker}.${kinds[seat]}.${said}`] = [
          `${title(speaker)} is marked ${kinds[seat] === 'straight' ? 'Straight' : 'Topsy'}. With these marks, ${title(speaker)}’s words, ${quoted(said)}, are ${kinds[seat] === 'straight' ? 'not so' : 'so'}.`,
        ];
      }
      for (const domains of domainSets)
        for (const step of settle(pattern, seat, domains) ?? [])
          hints[`bridge.hint.${speaker}.${said}.${seats[step.seat]}.${step.kind}`] = [
            `${title(speaker)}’s words, ${quoted(said)}, settle ${title(seats[step.seat])}: ${is(seats[step.seat], step.kind)}.`,
          ];
    }
  });
}

const blanks = Object.fromEntries(
  NAMES.map((name) => [`bridge.blank.${name}`, [`Mark ${title(name)} first.`]]),
) as Record<`bridge.blank.${Name}`, string[]>;

export const VOICE = {
  'game.truth-bridge': ['Truth Bridge!'],
  'bridge.start': ['Mark who speaks straight and who is Topsy, then cross.'],
  'bridge.topsy': [
    'On Lantern Night, a Topsy islander says the opposite of what is so. Everyone else speaks straight.',
  ],
  'bridge.next': ['Two more at the gate. This time, one sentence helps you read the other.'],
  'bridge.hint.done': ['Every sentence fits. Tap Cross.'],
  'bridge.done': ['Every sentence fits. Everyone is across!'],
  ...blanks,
  ...sentences,
  ...misses,
  ...hints,
};
