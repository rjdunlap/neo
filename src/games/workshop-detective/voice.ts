import { PAIR_IDS, SHARED_LINES, pairLines } from './logic.ts';

/** Every line whole, with no slot, so each gets a rendered clip: 17 per lever pair and the shared ones. */
const perPair = Object.fromEntries(
  PAIR_IDS.flatMap((pair) => Object.entries(pairLines(pair)).map(([id, text]) => [id, [text]])),
);
const shared = Object.fromEntries(Object.entries(SHARED_LINES).map(([id, text]) => [id, [text]])) as Record<
  keyof typeof SHARED_LINES,
  string[]
>;

export const VOICE = {
  'game.workshop-detective': ['Workshop Detective'],
  'workshop-detective.start': ['One note is right. Mark what the records show, then test.'],
  ...shared,
  ...perPair,
};
