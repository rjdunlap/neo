import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { firstLevel, levelsInOrder, stepLevel } from '../../progress/difficulty';
import { SCRIPT } from '../../content/voice-script';
import { howToFor } from '../../content/howto';
import { stampStudio } from './index';
import {
  meetsWord,
  pixel,
  place,
  PLACE_KINDS,
  PLACE_WORDS,
  placeInvites,
  placeTarget,
  planFor,
  roundPlan,
  SETS,
  stampDemo,
  stampLayout,
  STAMP_KINDS,
  type PlaceWord,
} from './logic';

/** Where does it go? (level 12, dive slice 10): place words on the Farm scene, met only by where a stamp lands. */
describe('Where does it go? (level 12)', () => {
  const plan = planFor(12);
  /** Every paper a round can be played on: the design views and phones, sideways and upright. */
  const papers = [
    { w: 1024, h: 768 },
    { w: 1400, h: 768 },
    { w: 768, h: 1024, upright: true as const },
    { w: 768, h: 1660, upright: true as const },
    computeView(844, 390),
    computeView(390, 844, NO_INSETS, true),
    computeView(375, 667, NO_INSETS, true),
  ].map((v) => stampLayout(v, 3, false).paper);
  /** A stamp's centre can sit anywhere `place` allows: 70 units inside the paper's edge. */
  const reachable = (p: { w: number; h: number }, x: number, y: number) =>
    x >= 70 && x <= p.w - 70 && y >= 70 && y <= p.h - 70;

  it('is the twelfth plan, on the Farm scene, with three invitations and nothing that changes the scene', () => {
    expect(plan.invite).toEqual({ count: 3 });
    expect(plan).toMatchObject({ color: true, move: true, transform: false, prompt: 'places' });
    expect(plan.sets).toBeFalsy();
    expect(stampStudio.describeLevel(12)).toMatch(/where does it go/i);
    for (let seed = 0; seed < 40; seed++) {
      const round = roundPlan(12, new Rng(seed));
      expect(round.scene).toBe('farm');
      expect(round.invites).toHaveLength(3);
      // One suggested stamp per place, all offered, all real stamp kinds.
      expect([...round.plan.kinds].sort()).toEqual(round.invites!.map((i) => i.kind).sort());
      for (const k of round.plan.kinds) expect(STAMP_KINDS).toContain(k);
    }
  });

  it('closes the preschool, pre-K and school ladders, leaving the lap and toddler ones alone', () => {
    expect(levelsInOrder(stampStudio.levels('preschool'))).toEqual([3, 4, 5, 6, 12]);
    expect(levelsInOrder(stampStudio.levels('prek'))).toEqual([4, 5, 6, 12]);
    expect(levelsInOrder(stampStudio.levels('school'))).toEqual([5, 6, 12]);
    expect(levelsInOrder(stampStudio.levels('lap'))).toEqual([7, 8, 1, 10, 2]);
    expect(levelsInOrder(stampStudio.levels('toddler'))).toEqual([9, 10, 2, 11, 3]);
    // First levels are unchanged, and 6 steps up to 12.
    expect(firstLevel(stampStudio.levels('preschool'), stampStudio.entryLevels)).toBe(3);
    expect(firstLevel(stampStudio.levels('school'), stampStudio.entryLevels)).toBe(5);
    expect(stepLevel(6, 1, stampStudio.levels('prek'))).toBe(12);
    expect(stepLevel(12, -1, stampStudio.levels('school'))).toBe(6);
    expect(stampStudio.entryLevels).not.toContain(12);
  });

  it('draws three distinct words a round, each with a stamp from its own list', () => {
    const firsts = new Set<PlaceWord>();
    for (let seed = 0; seed < 60; seed++) {
      const invites = placeInvites(new Rng(seed));
      expect(new Set(invites.map((i) => i.word)).size).toBe(3);
      for (const i of invites) expect(PLACE_KINDS[i.word]).toContain(i.kind);
      firsts.add(invites[0].word);
    }
    expect(firsts.size).toBe(3);
  });

  it('gives every word a reachable square of at least 130 by 130 units on every paper', () => {
    for (const p of papers)
      for (const word of PLACE_WORDS) {
        let found = false;
        for (let x0 = 70; x0 + 130 <= p.w - 70 && !found; x0 += 10)
          for (let y0 = 70; y0 + 130 <= p.h - 70 && !found; y0 += 10) {
            let all = true;
            for (let dx = 0; dx <= 130 && all; dx += 13)
              for (let dy = 0; dy <= 130 && all; dy += 13) all = meetsWord(word, x0 + dx, y0 + dy, p.w, p.h);
            found = all;
          }
        expect(found, `${word} on ${p.w}×${p.h}`).toBe(true);
      }
  });

  it('is total, uses only the position, and no point meets two words', () => {
    for (const p of papers)
      for (let x = 0; x <= p.w; x += 17)
        for (let y = 0; y <= p.h; y += 17) {
          const met = PLACE_WORDS.filter((word) => meetsWord(word, x, y, p.w, p.h));
          // Every point on the farm is exactly one place: sky, grass or water.
          expect(met, `${x},${y} on ${p.w}×${p.h}`).toHaveLength(1);
        }
  });

  it('presses the ghost finger well inside the named place, and that press survives `place`', () => {
    for (const p of papers)
      for (const word of PLACE_WORDS) {
        const t = placeTarget(word, p.w, p.h);
        expect(reachable(p, t.x, t.y), `${word} target on ${p.w}×${p.h}`).toBe(true);
        const back = pixel(place(t.x, t.y, p.w, p.h), p.w, p.h);
        expect(meetsWord(word, back.x, back.y, p.w, p.h)).toBe(true);
      }
  });

  it('the ghost finger chooses the suggested stamp, presses its place, then finishes', () => {
    const p = papers[0];
    const st = { stamps: [], kind: 'cow' as const, color: 'red' as const };
    const at = place(placeTarget('water', p.w, p.h).x, placeTarget('water', p.w, p.h).y, p.w, p.h);
    expect(stampDemo(plan, { ...st, invite: { kind: 'duck', at } })).toEqual({ do: 'kind', kind: 'duck' });
    expect(stampDemo(plan, { ...st, kind: 'duck', invite: { kind: 'duck', at } })).toEqual({
      do: 'stamp',
      ...at,
    });
    expect(stampDemo(plan, st)).toEqual({ do: 'finish' });
  });

  it('suggests stamps that belong in their place, from sets that exist', () => {
    const all = Object.values(SETS).flatMap((s) => [...s.kinds]);
    for (const word of PLACE_WORDS) for (const k of PLACE_KINDS[word]) expect(all).toContain(k);
    expect(SETS.farm.kinds).toContain('cow');
    expect(SETS.farm.kinds).toContain('duck');
  });

  it('has its lines and a how-to card that names the places and the hint', () => {
    for (const id of ['stamp.places', 'stamp.elsewhere', 'stamp.placesdone'])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeTruthy();
    const card = JSON.stringify(howToFor(stampStudio, 12));
    expect(card).toMatch(/sky/);
    expect(card).toMatch(/hint/);
  });
});
