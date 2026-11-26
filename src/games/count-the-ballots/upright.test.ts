import { describe, it } from 'vitest';

// Grown-up games ship upright-ready: build each level's targets from the layout and run
// uprightProblems(view, targets, 64) over UPRIGHT_VIEWS, as src/games/word-code/upright.test.ts does.
describe("Count the Ballots" + ' upright', () => {
  it.todo('every level lays out on the upright views: targets at least 64 units, inside the view, clear of the pet and corners');
  it.todo('records the smallest target in CSS pixels at 390 x 844 (under about 44, the board zooms or scrolls)');
});
