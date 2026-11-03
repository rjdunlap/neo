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
export const WORDS = ['red', 'blue', 'yellow', 'green', 'pink', 'big', 'small', 'duck', 'cat', 'pig', 'dog', 'the', 'can', 'jump', 'sleep'] as const;
export type Word = typeof WORDS[number];
export interface Task { words: Word[]; choices: Choice[]; answer: Choice }
export const PLANS = [
  { name: 'Read a color word and choose a hat', rounds: 3 },
  { name: 'Read big or small and choose that animal\'s picture', rounds: 3 },
  { name: 'Read a sentence and make one of two animals jump or sleep', rounds: 4 },
] as const;
export const planFor = (level: number) => PLANS[Math.max(1, Math.min(3, level)) - 1];
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
