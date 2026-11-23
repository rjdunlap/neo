import {
  NAMES,
  PLANKS,
  POOL_IDS,
  check,
  code,
  hintFor,
  hintLine,
  kindWord,
  markings,
  missLine,
  pool,
  sentenceLine,
  solutions,
  suppositionWords,
  title,
  words,
  type Board,
  type Domain,
  type Kind,
  type Name,
  type Step,
} from './logic.ts';

type Lines = Record<string, string[]>;

function seatings(seats: number): Name[][] {
  const choices: Name[][] = [];
  for (const first of NAMES)
    for (const second of NAMES) {
      if (first === second) continue;
      if (seats === 2) choices.push([first, second]);
      else choices.push([first, second, NAMES.find((n) => n !== first && n !== second)!]);
    }
  return choices;
}

const cast = { 2: seatings(2), 3: seatings(3) };

const quoted = (sentenceCode: string) => `“${words(sentenceCode).slice(0, -1)}”`;

function explainMiss(board: Board, speaker: number, kind: Kind) {
  const name = title(board.seats[speaker]);
  const said = quoted(code(board.pattern[speaker], speaker, board.seats));
  return `${name} is marked ${kindWord(kind)}. With these marks, ${name}’s words, ${said}, are ${kind === 'straight' ? 'not so' : 'so'}.`;
}

function explainHint(board: Board, step: Step) {
  if (step.suppose) return suppositionWords(board, step);
  const speaker = title(board.seats[step.speaker]);
  const said = quoted(code(board.pattern[step.speaker], step.speaker, board.seats));
  if ('plank' in step) return `${speaker}’s words, ${said}, leave the ${step.plank} plank as the sound one.`;
  const name = title(board.seats[step.seat]);
  return `${speaker}’s words, ${said}, settle ${name}: ${name} ${step.kind === 'straight' ? 'speaks straight' : 'is Topsy'}.`;
}

/** Compute findings once per pattern. Every wrong or blank mark is equivalent to unknown for a hint. */
function spokenLines(): Lines {
  const out: Lines = {};
  for (const id of POOL_IDS) {
    for (const pattern of pool(id)) {
      const seats = pattern.length as 2 | 3;
      const solution = solutions(pattern)[0];
      const board: Board = { pattern, solution, seats: cast[seats][0] };
      const planks = solution.plank ? PLANKS : [null];
      const misses = new Set<`${number}:${Kind}`>();
      for (const marks of markings(seats))
        for (const plank of planks) {
          const verdict = check(board, marks, plank);
          if (verdict.kind === 'wrong') misses.add(`${verdict.speaker}:${marks[verdict.speaker]}`);
        }
      const starts = solution.kinds.reduce<Domain[][]>(
        (states, kind) =>
          states.flatMap((marks) => [
            [...marks, null],
            [...marks, kind],
          ]),
        [[]],
      );
      const hints = new Map<string, Step>();
      for (const marks of starts)
        for (const plank of new Set([null, solution.plank])) {
          const hint = hintFor(board, marks, plank);
          if (hint) hints.set(hintLine(board, hint), hint);
        }
      for (const names of cast[seats]) {
        const named = { ...board, seats: names };
        pattern.forEach((statement, speaker) => {
          out[sentenceLine(named, speaker)] ??= [words(code(statement, speaker, names))];
        });
        for (const miss of misses) {
          const [seat, kind] = miss.split(':') as [string, Kind];
          const speaker = Number(seat);
          out[missLine(named, speaker, kind)] ??= [explainMiss(named, speaker, kind)];
        }
        for (const hint of hints.values()) out[hintLine(named, hint)] ??= [explainHint(named, hint)];
      }
    }
  }
  return out;
}

const blanks = Object.fromEntries(
  NAMES.map((name) => [`bridge.blank.${name}`, [`Mark ${title(name)} first.`]]),
) as Record<`bridge.blank.${Name}`, string[]>;

export const VOICE = {
  'game.truth-bridge': ['Truth Bridge!'],
  'bridge.start': ['Mark who speaks straight and who is Topsy, then cross.'],
  'bridge.start.planks': ['Mark who speaks straight and who is Topsy. Choose the sound plank, then cross.'],
  'bridge.topsy': [
    'On Lantern Night, a Topsy islander says the opposite of what is so. Everyone else speaks straight.',
  ],
  'bridge.next': ['Two more at the gate. This time, one sentence helps you read the other.'],
  'bridge.blank.plank': ['Choose a plank first.'],
  'bridge.hint.done': ['Every sentence fits. Tap Cross.'],
  'bridge.done': ['Every sentence fits. Everyone is across!'],
  ...blanks,
  ...spokenLines(),
};
