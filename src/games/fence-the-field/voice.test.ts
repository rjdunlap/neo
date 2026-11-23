import { describe, expect, it } from 'vitest';
import {
  FULL,
  PLANS,
  best,
  completes,
  drop,
  hint,
  openPlots,
  openRails,
  petChoices,
  petReply,
  sound,
  type Pools,
} from './logic';
import pools from './pools.json';
import { VOICE } from './voice';

const has = (key: string) => key in VOICE;

describe('Fence the Field voice', () => {
  it('has a line for every count a field of nine can name', () => {
    for (let n = 0; n <= 9; n++) expect(has(`fence.target.${n}`) && has(`fence.score.${n}`)).toBe(true);
    for (let n = 1; n <= 9; n++) expect(has(`fence.handed.${n}`)).toBe(true);
    for (let n = 0; n <= 8; n++) expect(has(`fence.only.${n}`)).toBe(true);
    expect((VOICE as Record<string, string[]>)['fence.score.5'][0]).toBe('Five for you, four for me.');
  });

  it('has a line for everything the pools and a hinted play-out produce', () => {
    const used = new Set<string>(['fence.start', 'fence.your-turn', 'fence.again', 'fence.down']);
    for (const plan of PLANS)
      for (const start of (pools as Pools)[plan.level]) {
        const target = best(start);
        used.add(`fence.target.${target}`);
        let mask = start,
          her = 0,
          turn = true;
        while (mask !== FULL) {
          let e: number;
          if (turn) {
            // Every unsound rail she could lay here, with what the pet's answer hands over and what it leaves her.
            const reach = her + best(mask);
            for (const x of openRails(mask).filter((r) => !sound(mask, r))) {
              const handed = petReply(mask, x).handed;
              if (handed) used.add(`fence.handed.${handed}`);
              used.add(`fence.only.${reach - drop(mask, x)}`);
            }
            const h = hint(mask, plan.level);
            used.add(`fence.hint.${h.kind}`);
            e = h.rail;
          } else e = petChoices(mask)[0];
          const k = completes(mask, e).length;
          mask |= 1 << e;
          if (turn) her += k;
          if (!k) turn = !turn;
        }
        expect(her).toBe(target);
        expect(openPlots(mask)).toBe(0);
        used.add(`fence.score.${her}`);
      }
    expect([...used].filter((key) => !has(key))).toEqual([]);
    // Each level's own hint is among the lines play reaches.
    for (const kind of ['claim', 'safe', 'run1', 'run2', 'leave-two'])
      expect(used.has(`fence.hint.${kind}`)).toBe(true);
  });
});
