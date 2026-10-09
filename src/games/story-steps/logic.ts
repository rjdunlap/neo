import type { Rng } from '../../engine/random';
export const STORIES = {
  flower: { name: 'A flower grows', steps: ['A seed rests in the soil.', 'A little sprout grows.', 'A bud grows on the stem.', 'The flower opens!'] },
  tower: { name: 'Build a tower', steps: ['One block sits on the ground.', 'We add a second block.', 'We add a third block.', 'A fourth block goes on top!'] },
  snow: { name: 'Make a snow friend', steps: ['We roll a big snowball.', 'We put another snowball on top.', 'We add a small snowball for the head.', 'A hat, a face, and a scarf. Hello, snow friend!'] },
  butterfly: { name: 'A butterfly grows', steps: ['A tiny egg rests on a leaf.', 'A caterpillar hatches and eats leaves.', 'The caterpillar changes inside a chrysalis.', 'A butterfly comes out and opens its wings!'] },
} as const;
export type StoryId = keyof typeof STORIES;
export interface StoryCard { story: StoryId; stage: number }
export const STORY_PLANS = [
  { count: 2, fixed: 'first', distractors: 1, stories: ['tower', 'snow'], name: 'Finish a two-picture story, with the beginning shown' },
  { count: 3, fixed: 'first', distractors: 0, stories: ['tower', 'flower'], name: 'Choose what comes next in a three-picture story' },
  { count: 3, fixed: 'none', distractors: 0, stories: ['tower', 'snow'], name: 'Put three building pictures in order' },
  { count: 3, fixed: 'none', distractors: 0, stories: ['flower', 'butterfly'], name: 'Put three growing pictures in order' },
  { count: 4, fixed: 'none', distractors: 0, stories: ['tower', 'snow', 'flower', 'butterfly'], name: 'Tell a whole story in four pictures' },
  { count: 4, fixed: 'ends', distractors: 2, stories: ['tower', 'snow', 'flower', 'butterfly'], name: 'Fill the missing middle, leaving out pictures from another story' },
  { count: 4, fixed: 'none', distractors: 2, stories: ['tower', 'snow', 'flower', 'butterfly'], name: 'Build a four-picture story from six mixed pictures' },
] as const;
export type StoryPlan = (typeof STORY_PLANS)[number];
export function sameCard(a: StoryCard, b: StoryCard): boolean { return a.story === b.story && a.stage === b.stage; }
export function storyPuzzle(plan: StoryPlan, rng: Rng) {
  const story: StoryId = rng.pick([...plan.stories]);
  const stages = plan.count === 2 ? [0, 3] : plan.count === 3 ? [0, 1, 3] : [0, 1, 2, 3];
  const sequence = stages.map((stage) => ({ story, stage }));
  const fixed = plan.fixed === 'none' ? [] : plan.fixed === 'first' ? [0] : [0, sequence.length - 1];
  const choices: StoryCard[] = sequence.filter((_, i) => !fixed.includes(i));
  const other = rng.pick((Object.keys(STORIES) as StoryId[]).filter((s) => s !== story));
  for (let i = 0; i < plan.distractors; i++) choices.push({ story: other, stage: i * 3 });
  return { story, sequence, fixed, choices: rng.shuffle(choices) };
}

/** The first slot of the strip that is still empty: pictures go in from the beginning of the story, one after another. */
export const nextSlot = (sequence: readonly StoryCard[], placed: ReadonlySet<number>) => sequence.findIndex((_, i) => !placed.has(i));

/**
 * What a capable child does next: carry the picture that comes next in the story to the first empty slot. A picture from
 * another story is never picked. The ghost finger follows this.
 */
export function nextPicture<C extends { card: StoryCard; placed: boolean }>(sequence: readonly StoryCard[], placed: ReadonlySet<number>, choices: readonly C[]): { choice: C; slot: number } | undefined {
  const slot = nextSlot(sequence, placed);
  const choice = slot < 0 ? undefined : choices.find((c) => !c.placed && sameCard(c.card, sequence[slot]));
  return choice ? { choice, slot } : undefined;
}
