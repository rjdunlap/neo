import type { Rng } from '../../engine/random';
export const STORIES = {
  flower: { name: 'A flower grows', steps: ['A seed rests in the soil.', 'A little sprout grows.', 'A bud grows on the stem.', 'The flower opens!'] },
  tower: { name: 'Build a tower', steps: ['One block sits on the ground.', 'We add a second block.', 'We add a third block.', 'A fourth block goes on top!'] },
  snow: { name: 'Make a snow friend', steps: ['We roll a big snowball.', 'We put another snowball on top.', 'We add a small snowball for the head.', 'A hat, a face, and a scarf. Hello, snow friend!'] },
  butterfly: { name: 'A butterfly grows', steps: ['A tiny egg rests on a leaf.', 'A caterpillar hatches and eats leaves.', 'The caterpillar changes inside a chrysalis.', 'A butterfly comes out and opens its wings!'] },
  sandcastle: { name: 'Build a sandcastle', steps: ['We fill a bucket with sand.', 'We tip the bucket over and make a tower.', 'We make more sand towers.', 'We put a flag on top!'] },
  sandwich: { name: 'Make a sandwich', steps: ['We start with a slice of bread.', 'We spread jam on the bread.', 'We add a slice of cheese.', 'We put the top slice on. Yum!'] },
  apple: { name: 'An apple tree grows', steps: ['An apple seed rests in the soil.', 'A little tree sprout grows.', 'The tree grows tall and green.', 'A red apple grows on the tree!'] },
  dog: { name: 'Wash the dog', steps: ['The dog is muddy.', 'We scrub the dog with soap.', 'We rinse the soap away.', 'The dog is clean and fluffy!'] },
  rain: { name: 'A rainy day', steps: ['The sun is shining.', 'Gray clouds come.', 'Rain falls down.', 'A rainbow shines over the puddles!'] },
  bedtime: { name: 'Get ready for bed', steps: ['We play with our toys.', 'We take a bubble bath.', 'We put on our pajamas.', 'We get tucked in. Goodnight!'] },
} as const;
export type StoryId = keyof typeof STORIES;
export const STORY_IDS = Object.keys(STORIES) as StoryId[];
/**
 * What a story's pictures look like. A picture from another story of the same family could be mistaken for this story's
 * (a seed in soil is a flower's or an apple tree's; a stack of things is a tower's, a snow friend's, a castle's or a
 * sandwich's), so a family is never a source of distractors for its own stories.
 */
export const STORY_FAMILY: Record<StoryId, 'stack' | 'seed' | 'metamorph' | 'wash' | 'weather' | 'bedtime'> = {
  tower: 'stack', snow: 'stack', sandcastle: 'stack', sandwich: 'stack',
  flower: 'seed', apple: 'seed', butterfly: 'metamorph', dog: 'wash', rain: 'weather', bedtime: 'bedtime',
};
export interface StoryCard { story: StoryId; stage: number }
/** `mixed`: the extra pictures come from two different stories (a story cannot be spotted by one end alone); otherwise from one. */
export const STORY_PLANS = [
  { count: 2, fixed: 'first', distractors: 1, mixed: false, stories: ['tower', 'snow', 'sandcastle', 'sandwich'], name: 'Finish a two-picture story, with the beginning shown' },
  { count: 3, fixed: 'first', distractors: 0, mixed: false, stories: ['tower', 'flower', 'sandcastle', 'sandwich'], name: 'Choose what comes next in a three-picture story' },
  { count: 3, fixed: 'none', distractors: 0, mixed: false, stories: ['tower', 'snow', 'sandcastle', 'sandwich', 'apple'], name: 'Put three story pictures in order' },
  { count: 3, fixed: 'none', distractors: 0, mixed: false, stories: ['flower', 'butterfly', 'apple', 'dog'], name: 'Put three pictures of a changing story in order' },
  { count: 4, fixed: 'none', distractors: 0, mixed: false, stories: STORY_IDS, name: 'Tell a whole story in four pictures' },
  { count: 4, fixed: 'ends', distractors: 2, mixed: false, stories: STORY_IDS, name: 'Fill the missing middle, leaving out pictures from another story' },
  { count: 4, fixed: 'none', distractors: 2, mixed: true, stories: STORY_IDS, name: 'Build a four-picture story from six mixed pictures' },
] as const;
export type StoryPlan = (typeof STORY_PLANS)[number];
export function sameCard(a: StoryCard, b: StoryCard): boolean { return a.story === b.story && a.stage === b.stage; }
export function storyPuzzle(plan: StoryPlan, rng: Rng) {
  const story: StoryId = rng.pick([...plan.stories]);
  const stages = plan.count === 2 ? [0, 3] : plan.count === 3 ? [0, 1, 3] : [0, 1, 2, 3];
  const sequence = stages.map((stage) => ({ story, stage }));
  const fixed = plan.fixed === 'none' ? [] : plan.fixed === 'first' ? [0] : [0, sequence.length - 1];
  const choices: StoryCard[] = sequence.filter((_, i) => !fixed.includes(i));
  // Extra pictures never come from the round's own family, and a mixed round takes its two from two different families.
  const others = STORY_IDS.filter((s) => STORY_FAMILY[s] !== STORY_FAMILY[story]);
  const other = rng.pick(others);
  const second = plan.mixed ? rng.pick(others.filter((s) => STORY_FAMILY[s] !== STORY_FAMILY[other])) : other;
  for (let i = 0; i < plan.distractors; i++) choices.push({ story: i === 0 ? other : second, stage: i * 3 });
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
