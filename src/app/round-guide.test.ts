import { describe, expect, it } from 'vitest';
import { FIRST, QUIET, RoundGuide } from './round-guide';

/** Runs quiet frames until a showing is due (marking it shown), or `limit` seconds pass. Returns the seconds it took. */
const untilDue = (g: RoundGuide, limit = 60, talking = false) => {
  let t = 0;
  while (t < limit) {
    t += 0.05;
    if (g.due({ dt: 0.05, talking, showing: false })) {
      g.showed();
      return t;
    }
  }
  return null;
};

describe('RoundGuide', () => {
  it('shows a first play soon after the instruction, then again every few seconds until a touch', () => {
    const g = new RoundGuide('preschool', true);
    expect(untilDue(g)).toBeCloseTo(FIRST.after, 1);
    expect(untilDue(g)).toBeCloseTo(FIRST.every, 1);
    g.touched();
    expect(untilDue(g)).toBeCloseTo(QUIET.preschool / 2, 1);
    expect(g.hints).toBe(0);
  });

  it('waits for the quiet board on a later round, and counts one hint however often it shows', () => {
    const g = new RoundGuide('school', false);
    expect(untilDue(g)).toBeCloseTo(QUIET.school, 1);
    expect(untilDue(g)).toBeCloseTo(QUIET.school, 1);
    expect(g.hints).toBe(1);
  });

  it('gives grown-ups much longer to think', () => {
    expect(untilDue(new RoundGuide('grownup', false))).toBeCloseTo(QUIET.grownup, 1);
    expect(QUIET.grownup).toBeGreaterThanOrEqual(2 * QUIET.school);
  });

  it('never counts a hint at lap or toddler, where a grown-up plays alongside', () => {
    for (const band of ['lap', 'toddler'] as const) {
      const g = new RoundGuide(band, false);
      untilDue(g);
      expect(g.hints).toBe(0);
    }
  });

  it('waits while a line is said, and while the hand is still showing', () => {
    const g = new RoundGuide('school', false);
    expect(untilDue(g, 40, true)).toBeNull();
    for (let i = 0; i < 400; i++) expect(g.due({ dt: 0.05, talking: false, showing: true })).toBe(false);
    expect(untilDue(g)).toBeCloseTo(QUIET.school, 1);
  });

  it('starts the quiet over on a touch', () => {
    const g = new RoundGuide('school', false);
    for (let t = 0; t < QUIET.school - 1; t += 0.05) g.due({ dt: 0.05, talking: false, showing: false });
    g.touched();
    expect(untilDue(g)).toBeCloseTo(QUIET.school, 1);
  });
});
