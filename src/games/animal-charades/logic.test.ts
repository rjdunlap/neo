import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { stepToMidi } from '../../audio/notes';
import {
  ANIMALS,
  DOES,
  MOTIONS,
  MOTION_OF,
  PHRASE,
  actedCard,
  allDeals,
  dealRound,
  describeLevel,
  guess,
  hintAction,
  petOrder,
  showMe,
  startState,
  LEVELS,
} from './logic';

describe('Animal Charades rules', () => {
  it('has six animals with six distinct motions, motion words and phrases', () => {
    expect(new Set(ANIMALS).size).toBe(6);
    expect(new Set(MOTIONS).size).toBe(6);
    expect(new Set(ANIMALS.map((a) => MOTION_OF[a])).size).toBe(6);
    expect(new Set(ANIMALS.map((a) => DOES[a])).size).toBe(6);
    for (const m of MOTIONS) {
      expect(PHRASE[m].length).toBeGreaterThan(0);
      expect(PHRASE[m].length).toBeLessThanOrEqual(4);
      for (const [t, step] of PHRASE[m]) {
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThan(3);
        expect(Number.isFinite(stepToMidi(step))).toBe(true);
      }
    }
  });

  it('deals exactly 60 rounds: 20 triples with any of their 3 members as the target', () => {
    const all = allDeals();
    expect(all).toHaveLength(60);
    expect(new Set(all.map((d) => `${d.triple}|${d.target}`)).size).toBe(60);
  });

  it('seeded rounds are valid and the targets rotate', () => {
    const targets = new Set<string>();
    const animalsSeen = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const d = dealRound(new Rng(seed));
      expect(new Set(d.animals).size).toBe(3);
      expect(d.target).toBeGreaterThanOrEqual(0);
      expect(d.target).toBeLessThan(3);
      // Three distinct animals have three distinct motions.
      expect(new Set(d.animals.map((a) => MOTION_OF[a])).size).toBe(3);
      targets.add(d.animals[d.target]);
      animalsSeen.add(d.animals.join());
    }
    expect(targets.size).toBe(6);
    expect(animalsSeen.size).toBeGreaterThan(20);
  });

  it('every tap sequence reaches the reveal in at most three taps, and the right card always does', () => {
    for (const d of allDeals()) {
      const deal = { animals: d.triple.map((i) => ANIMALS[i]) as never, target: d.target };
      expect(guess(startState(deal), d.target).phase).toBe('reveal');
      for (const order of [
        [0, 1, 2],
        [2, 1, 0],
        [1, 0, 2],
        [1, 2, 0],
      ]) {
        let s = startState(deal);
        let taps = 0;
        for (const c of order) {
          if (s.phase === 'reveal') break;
          s = guess(s, c);
          taps++;
        }
        expect(s.phase).toBe('reveal');
        expect(taps).toBeLessThanOrEqual(3);
        expect(s.misses).toBeLessThanOrEqual(2);
      }
    }
  });

  it('counts misses and hints deliberately', () => {
    const deal = dealRound(new Rng(5));
    const wrong = [0, 1, 2].filter((i) => i !== deal.target);
    let s = guess(startState(deal), wrong[0]);
    expect(s.misses).toBe(1);
    expect(hintAction(s)).toEqual({ kind: 'look' });
    s = guess(s, deal.target);
    expect(s.phase).toBe('reveal');
    expect(s.misses).toBe(1);
    // Two wrong cards glow the target; Show me ends it supported.
    let t = guess(guess(startState(deal), wrong[0]), wrong[1]);
    expect(t.misses).toBe(2);
    expect(hintAction(t)).toEqual({ kind: 'card', index: deal.target });
    t = showMe(t);
    expect(t.phase).toBe('reveal');
    expect(t.shown).toBe(true);
    expect(hintAction(t)).toBeNull();
    // The same wrong card twice is one miss.
    const u = guess(guess(startState(deal), wrong[0]), wrong[0]);
    expect(u.misses).toBe(1);
  });

  it('the pet guesses every dealt animal once in a fixed order, and her own turn never misses', () => {
    for (let seed = 0; seed < 50; seed++) {
      const o = petOrder(seed);
      expect([...o].sort()).toEqual([0, 1, 2]);
      expect(petOrder(seed)).toEqual(o);
    }
    expect(new Set(Array.from({ length: 50 }, (_, s) => petOrder(s).join())).size).toBeGreaterThan(1);
    for (let seed = 0; seed < 50; seed++) {
      const d = dealRound(new Rng(seed));
      expect(actedCard(d)).not.toBe(d.target);
    }
  });

  it('is one level for preschool and pre-K, and describes it', () => {
    expect(LEVELS.preschool).toEqual({ min: 1, max: 1 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 1 });
    expect(describeLevel(1)).toMatch(/Who is moving/);
  });
});

import { MOTION_SECONDS, pose } from './motion';
describe("the pet's motions", () => {
  it('are finite and pairwise different over the performance', () => {
    const sig = (m: (typeof MOTIONS)[number]) => {
      const out: number[] = [];
      for (let i = 0; i <= 30; i++) {
        const p = pose(m, (i / 30) * MOTION_SECONDS);
        for (const v of Object.values(p)) expect(Number.isFinite(v)).toBe(true);
        out.push(p.x, p.y, p.rot * 100, p.sx * 100, p.sy * 100);
      }
      return out;
    };
    const sigs = MOTIONS.map(sig);
    for (let a = 0; a < 6; a++)
      for (let b = a + 1; b < 6; b++) {
        const d = sigs[a].reduce((s, v, i) => s + Math.abs(v - sigs[b][i]), 0);
        expect(d).toBeGreaterThan(200);
      }
  });
  it('slide has no bounce and only stomp shakes', () => {
    for (let i = 0; i <= 30; i++) {
      const t = (i / 30) * MOTION_SECONDS;
      expect(pose('slide', t).y).toBe(0);
      for (const m of MOTIONS) if (m !== 'stomp') expect(pose(m, t).shake).toBe(0);
    }
  });
});
