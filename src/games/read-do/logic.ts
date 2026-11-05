import type { Rng } from '../../engine/random';

export const COLORS = ['red', 'blue', 'yellow', 'green', 'pink'] as const;
export const ANIMALS = ['duck', 'cat', 'pig', 'dog'] as const;
export const ACTIONS = ['jump', 'sleep'] as const;
export const SIZES = ['big', 'small'] as const;
export type Animal = typeof ANIMALS[number];
export type Choice =
  | { kind: 'hat'; color: typeof COLORS[number] }
  | { kind: 'size'; size: typeof SIZES[number]; animal: Animal }
  | { kind: 'action'; animal: Animal; action: typeof ACTIONS[number] };
export const WORDS = ['red', 'blue', 'yellow', 'green', 'pink', 'big', 'small', 'duck', 'cat', 'pig', 'dog', 'the', 'can', 'jump', 'sleep', 'jumps', 'sleeps'] as const;
export type Word = typeof WORDS[number];
export interface Task { words: Word[]; choices: Choice[]; answer: Choice }
export const PLANS = [
  { name: 'Read a color word and choose a hat', rounds: 3 },
  { name: 'Read big or small and choose that animal\'s picture', rounds: 3 },
  { name: 'Read a sentence and make one of two animals jump or sleep', rounds: 4 },
  { name: 'Start the sign: give its first word a capital, then Send', rounds: 3 },
  { name: 'Finish the sign: stamp a full stop on its end, then Send', rounds: 3 },
  { name: 'Ready for a reader: a capital at the start and a full stop at the end', rounds: 3 },
] as const;
export const planFor = (level: number) => PLANS[Math.max(1, Math.min(PLANS.length, level)) - 1];
export function meaning(c: Choice): Word[] {
  if (c.kind === 'hat') return [c.color];
  if (c.kind === 'size') return [c.size, c.animal];
  return ['the', c.animal, 'can', c.action];
}
export const matches = (task: Task, choice: Choice) => meaning(choice).join(' ') === task.words.join(' ');
export const answerIndex = (task: Task) => task.choices.findIndex(c => matches(task, c));

const task = (answer: Choice, choices: Choice[], rng: Rng): Task => ({ answer, words: meaning(answer), choices: rng.shuffle(choices) });

/**
 * Level 1: three different answer colors from five, each with two other seeded hats. Level 2: big, small and a
 * seeded third size, each on a different seeded animal, with both pictures that animal (only the size word decides).
 * Level 3: a seeded pair of animals, every animal-and-action sentence once, so both words still matter.
 */
export function makeTasks(level: number, rng: Rng): Task[] {
  if (level <= 1) return rng.shuffle([...COLORS]).slice(0, 3).map(color => {
    const others = rng.shuffle(COLORS.filter(c => c !== color)).slice(0, 2);
    return task({ kind: 'hat', color }, [color, ...others].map(c => ({ kind: 'hat', color: c })), rng);
  });
  if (level === 2) {
    const animals = rng.shuffle([...ANIMALS]).slice(0, 3);
    const sizes = rng.shuffle<typeof SIZES[number]>(['big', 'small', rng.pick(SIZES)]);
    return animals.map((animal, i) => task({ kind: 'size', size: sizes[i], animal }, SIZES.map(size => ({ kind: 'size', size, animal })), rng));
  }
  const pair = rng.shuffle([...ANIMALS]).slice(0, 2);
  const choices: Choice[] = pair.flatMap(animal => ACTIONS.map(action => ({ kind: 'action', animal, action })));
  return rng.shuffle([...choices]).map(answer => task(answer, [...choices], rng));
}

/** Levels 4–6 (SS1 A–C): which convention Send checks. A ignores the stop, B ignores the capital, C needs both. */
export type Step = 'cap' | 'stop' | 'both';
export const VERBS = ['jumps', 'sleeps'] as const;
export const stepFor = (level: number): Step | null => level === 4 ? 'cap' : level === 5 ? 'stop' : level >= 6 ? 'both' : null;
/** The edit state of a sign: whether its first word has its capital and whether the full stop is in the end socket. */
export interface Marks { capital: boolean; stop: boolean }
export interface Sign { animal: Animal; verb: typeof VERBS[number]; words: Word[]; start: Marks }
/** The convention still missing for the step, the capital first; null when Send accepts the sign. */
export function missing(step: Step, marks: Marks): 'cap' | 'stop' | null {
  if (step !== 'stop' && !marks.capital) return 'cap';
  if (step !== 'cap' && !marks.stop) return 'stop';
  return null;
}
/** The sign as printed in its current state, e.g. "The duck jumps." */
export const printed = (sign: Sign, marks: Marks) =>
  (marks.capital ? 'The' : 'the') + ' ' + sign.words.slice(1).join(' ') + (marks.stop ? '.' : '');
export const actionOf = (sign: Sign): Choice => ({ kind: 'action', animal: sign.animal, action: sign.verb === 'jumps' ? 'jump' : 'sleep' });

/**
 * Three seeded signs from the eight *the + animal + jumps/sleeps* clauses: three different animals and both actions,
 * so no word leads every sign. The step fixes what is missing (A: the capital; B: the stop; C: both).
 */
export function makeSigns(level: number, rng: Rng): Sign[] {
  const step = stepFor(level) ?? 'both';
  const start: Marks = { capital: step === 'stop', stop: step === 'cap' };
  const animals = rng.shuffle([...ANIMALS]).slice(0, 3);
  const verbs = rng.shuffle<typeof VERBS[number]>(['jumps', 'sleeps', rng.pick(VERBS)]);
  return animals.map((animal, i) => ({ animal, verb: verbs[i], words: ['the', animal, verbs[i]], start: { ...start } }));
}
