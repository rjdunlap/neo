import type { Rng } from '../../engine/random';
import type { StoryCard } from './logic';

/** Endings are authored alternatives, not random unrelated distractors. The last shown picture carries the evidence. */
export const PREDICTIONS = [
  { id: 'clouds', story: 'rain', stages: [0, 0, 1], clue: 'dark clouds', supported: 2, other: 0, opening: ['The sun shines over the grass.', 'We look up at the sky.', 'Dark clouds cover the sky.'], endings: ['Rain falls from the dark clouds.', 'The sky is sunny again.'], reason: 'The dark clouds point to rain next.' },
  { id: 'push', story: 'tower', stages: [0, 1, 2], clue: 'a hand pushing the tower', supported: 0, other: 3, opening: ['We start a block tower.', 'We add another block.', 'A hand pushes the tall tower sideways.'], endings: ['The pushed tower falls down.', 'Another block goes on top.'], reason: 'The hand is pushing the tower sideways, so the blocks will fall.' },
  { id: 'bucket', story: 'sandcastle', stages: [0, 1, 0], clue: 'the full bucket tipping beside the sand tower', supported: 2, other: 1, opening: ['We fill a bucket with sand.', 'We make one sand tower.', 'Another full bucket tips beside our sand tower.'], endings: ['The bucket makes another sand tower.', 'Only one sand tower stands on the beach.'], reason: 'The full bucket is tipping beside the tower, so another tower will join it.' },
  { id: 'bread', story: 'sandwich', stages: [0, 1, 2], clue: 'the top slice of bread coming down', supported: 3, other: 1, opening: ['We put bread on a plate.', 'We spread jam on the bread.', 'Cheese is on the jam, and the top bread comes down.'], endings: ['The top bread closes the sandwich.', 'The jam bread stays open.'], reason: 'The top bread is coming down onto the cheese, so the sandwich will close.' },
  { id: 'bud', story: 'flower', stages: [0, 1, 2], clue: 'pink petals opening on the bud', supported: 3, other: 2, opening: ['We plant a seed.', 'The sprout grows leaves.', 'Pink petals begin to open on the bud.'], endings: ['The pink flower opens.', 'The pink bud stays closed.'], reason: 'Pink petals are opening on the bud, so a flower comes next.' },
  { id: 'apple', story: 'apple', stages: [0, 1, 2], clue: 'a red apple growing on the branch', supported: 3, other: 2, opening: ['We plant an apple seed.', 'A little tree grows.', 'A red apple begins to grow on a branch.'], endings: ['The tree has ripe red apples.', 'The branches have no apples.'], reason: 'A red apple is growing on the branch, so the tree will have apples.' },
  { id: 'wings', story: 'butterfly', stages: [0, 1, 2], clue: 'wings coming out of the chrysalis', supported: 3, other: 1, opening: ['An egg rests on a leaf.', 'A caterpillar grows and eats.', 'Wings begin to come out of the chrysalis.'], endings: ['A butterfly opens its wings.', 'The caterpillar stays on the leaf.'], reason: 'Wings are coming out of the chrysalis, so a butterfly comes next.' },
  { id: 'sleep', story: 'bedtime', stages: [0, 1, 2], clue: 'the pillow and blanket ready beside the pajamas', supported: 3, other: 0, opening: ['We play with toys.', 'We take a bath.', 'Our pajamas, pillow, and blanket are ready for bed.'], endings: ['We get tucked in and sleep.', 'We play with toys again.'], reason: 'The pillow and blanket are ready with the pajamas, so getting tucked in comes next.' },
] as const;
export type Prediction = typeof PREDICTIONS[number];
export const PREDICTION_PLAN = { name: 'Use a visible clue to choose what will happen next' } as const;
export function predictionPuzzle(rng: Rng) {
  const story = rng.pick(PREDICTIONS);
  return { story, choices: rng.shuffle([0, 1] as const), supported: 0 as const };
}
export function predictionCard(p: Prediction, ending: number): StoryCard {
  return p.id === 'push' && ending === 0 ? { story: 'towerFall', stage: 1 } : { story: p.story, stage: ending === 0 ? p.supported : p.other };
}
/** The first unsupported prediction is exploration. Repeating it counts, and assistance is recorded only once. */
export function predictionFeedback(ending: number, unsupported: number) {
  return { complete: ending === 0, miss: ending !== 0 && unsupported > 0, hint: ending !== 0 && unsupported === 1 };
}
