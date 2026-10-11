import type { Rng } from '../../engine/random';

export const COLORS = ['red', 'blue', 'yellow'] as const;
export const ANIMALS = ['duck', 'cat'] as const;
export const ACTIONS = ['jump', 'sleep'] as const;
export type Choice =
  | { kind: 'hat'; color: typeof COLORS[number] }
  | { kind: 'size'; size: 'big' | 'small' }
  | { kind: 'action'; animal: typeof ANIMALS[number]; action: typeof ACTIONS[number] };
export const WORDS = ['red', 'blue', 'yellow', 'big', 'small', 'duck', 'cat', 'the', 'can', 'jump', 'sleep'] as const;
export type Word = typeof WORDS[number];
export interface Task { words: Word[]; choices: Choice[]; answer: Choice }
export const PLANS = [
  { name: 'Read a color word and choose a hat', rounds: 3 },
  { name: 'Read big duck or small duck and choose its picture', rounds: 2 },
  { name: 'Read a sentence and make the duck or cat jump or sleep', rounds: 4 },
] as const;
export const planFor = (level: number) => PLANS[Math.max(1, Math.min(3, level)) - 1];
export function meaning(c: Choice): Word[] {
  if (c.kind === 'hat') return [c.color];
  if (c.kind === 'size') return [c.size, 'duck'];
  return ['the', c.animal, 'can', c.action];
}
export const matches = (task: Task, choice: Choice) => meaning(choice).join(' ') === task.words.join(' ');
export const answerIndex = (task: Task) => task.choices.findIndex(c => matches(task, c));

/** Every round sees the whole small pool once; positions change independently of the printed words. */
export function makeTasks(level: number, rng: Rng): Task[] {
  const choices: Choice[] = level <= 1 ? COLORS.map(color => ({ kind: 'hat', color }))
    : level === 2 ? (['big', 'small'] as const).map(size => ({ kind: 'size', size }))
    : ANIMALS.flatMap(animal => ACTIONS.map(action => ({ kind: 'action', animal, action })));
  return rng.shuffle([...choices]).map(answer => ({ answer, words: meaning(answer), choices: rng.shuffle([...choices]) }));
}
