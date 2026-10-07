import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { BODY, danceSeconds, makeTurns, MOVE_WORDS, MOVES, PLANS } from './logic';

describe('Pet Says', () => {
  it('names every move, and never asks for the same move twice in a row', () => {
    for (const m of [...MOVES, ...BODY]) expect(MOVE_WORDS[m].length).toBeGreaterThan(2);
    for (const plan of PLANS) for (let seed = 1; seed <= 300; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns).toHaveLength(plan.turns);
      const flat = turns.flatMap((t) => t.moves);
      if (plan.mode !== 'freeze') flat.slice(1).forEach((m, i) => expect(m).not.toBe(flat[i]));
      if (plan.mode === 'body') for (const t of turns) expect(BODY).toContain(t.moves[0]);
      if (plan.mode === 'pairs') for (const t of turns) expect(t.moves).toHaveLength(2);
    }
  });

  it('starts "Pet says" with a real one, and spaces out the two tricks', () => {
    const plan = PLANS.find((p) => p.mode === 'says')!;
    for (let seed = 1; seed <= 300; seed++) {
      const turns = makeTurns(plan, new Rng(seed));
      expect(turns[0].says).toBe(true);
      const tricks = turns.map((t, i) => (t.says ? -1 : i)).filter((i) => i >= 0);
      expect(tricks).toHaveLength(2);
      expect(tricks[1] - tricks[0]).toBeGreaterThanOrEqual(2);
    }
  });

  it('dances for a few seconds before each freeze, never the same twice running', () => {
    let last = 0;
    const rng = new Rng(5);
    for (let i = 0; i < 100; i++) {
      const s = danceSeconds(rng, last);
      expect(s >= 3 && s <= 7).toBe(true);
      expect(s).not.toBe(last);
      last = s;
    }
  });
});
