import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { firstLevel, levelsInOrder, stepLevel } from '../../progress/difficulty';
import { SCRIPT } from '../../content/voice-script';
import { howToFor } from '../../content/howto';
import { PICTURE_MAX, STAMP_KINDS } from '../../content/creations';
import { stampStudio } from './index';
import {
  ABOVE_REACH,
  anchorPixel,
  ANCHOR_KINDS,
  LIMIT,
  meetsRelation,
  NEXT_TO,
  ON_ANCHOR,
  pixel,
  place,
  planFor,
  type Relation,
  relationAnchors,
  relationInvites,
  relationPhrase,
  relationTarget,
  RELATION_KINDS,
  roundPlan,
  SETS,
  stampDemo,
  stampLayout,
} from './logic';

/** Next to, between, above (level 13, dive slice 11): two printed animals, and three relations met by where a stamp lands. */
describe('Next to, between, above (level 13)', () => {
  const plan = planFor(13);
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
  /** Every pair of animal offsets a round can draw. */
  const rises = [-30, 0, 30];
  const layouts = rises.flatMap((a) =>
    rises.map((b) => [
      { dx: -170, dy: a },
      { dx: 170, dy: b },
    ]),
  );
  const relations: Relation[] = [
    { rel: 'between' },
    ...([0, 1] as const).flatMap((anchor) =>
      (['next', 'above', 'below'] as const).map((rel) => ({ rel, anchor })),
    ),
  ];

  it('is the thirteenth plan, on plain paper, with three invitations and nothing that changes the scene', () => {
    expect(plan.relate).toEqual({ count: 3 });
    expect(plan).toMatchObject({ color: true, move: true, transform: false });
    expect(plan.sets).toBeFalsy();
    expect(stampStudio.describeLevel(13)).toMatch(/next to, between, above/i);
    for (let seed = 0; seed < 40; seed++) {
      const round = roundPlan(13, new Rng(seed));
      expect(round.scene).toBeUndefined();
      expect(round.invites).toHaveLength(3);
      expect(round.anchors).toHaveLength(2);
      expect([...round.plan.kinds].sort()).toEqual(round.invites!.map((i) => i.kind).sort());
      for (const k of [...round.plan.kinds, ...round.anchors!.map((a) => a.kind)])
        expect(STAMP_KINDS).toContain(k);
    }
  });

  it('starts at pre-K, after Where does it go?, and leaves preschool, lap and toddler alone', () => {
    expect(levelsInOrder(stampStudio.levels('prek'))).toEqual([4, 5, 6, 12, 13]);
    expect(levelsInOrder(stampStudio.levels('school'))).toEqual([5, 6, 12, 13]);
    expect(levelsInOrder(stampStudio.levels('preschool'))).toEqual([3, 4, 5, 6, 12]);
    expect(levelsInOrder(stampStudio.levels('lap'))).toEqual([7, 8, 1, 10, 2]);
    expect(levelsInOrder(stampStudio.levels('toddler'))).toEqual([9, 10, 2, 11, 3]);
    expect(firstLevel(stampStudio.levels('prek'), stampStudio.entryLevels)).toBe(4);
    expect(stepLevel(12, 1, stampStudio.levels('school'))).toBe(13);
    expect(stepLevel(13, -1, stampStudio.levels('prek'))).toBe(12);
    expect(stampStudio.entryLevels).not.toContain(13);
  });

  it('draws two different animals, left and right, and three relations: next to one, between, above or below the other', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 80; seed++) {
      const rng = new Rng(seed);
      const [a, b] = relationAnchors(rng);
      expect(a.kind).not.toBe(b.kind);
      for (const x of [a, b]) expect(ANCHOR_KINDS).toContain(x.kind);
      expect([a.dx, b.dx]).toEqual([-170, 170]);
      const invites = relationInvites(rng);
      const rels = invites.map((i) => i.relation);
      expect(rels.map((r) => r.rel === 'between')).toContain(true);
      const next = rels.find((r) => r.rel === 'next')!;
      const vertical = rels.find((r) => r.rel === 'above' || r.rel === 'below')!;
      expect(next && vertical).toBeTruthy();
      if ('anchor' in next && 'anchor' in vertical) expect(next.anchor).not.toBe(vertical.anchor);
      // Three different suggested stamps, none of them a printed animal.
      expect(new Set(invites.map((i) => i.kind)).size).toBe(3);
      for (const i of invites) expect(RELATION_KINDS).toContain(i.kind);
      seen.add(rels[0].rel);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('keeps the animals at least 300 units apart and well inside every paper, at every offset', () => {
    for (const p of papers)
      for (const [a, b] of layouts) {
        const pa = anchorPixel(a, p.w, p.h);
        const pb = anchorPixel(b, p.w, p.h);
        expect(Math.hypot(pa.x - pb.x, pa.y - pb.y)).toBeGreaterThanOrEqual(300);
        for (const q of [pa, pb]) {
          expect(reachable(p, q.x, q.y), `${p.w}×${p.h}`).toBe(true);
          // `place` keeps the animal exactly where it was printed.
          const back = pixel(place(q.x, q.y, p.w, p.h), p.w, p.h);
          expect(back.x).toBeCloseTo(q.x);
          expect(back.y).toBeCloseTo(q.y);
        }
      }
  });

  it('meets each relation by the rule: within 160 beside, near the line between, higher or lower within 90 sideways', () => {
    const anchors = [
      { x: 200, y: 300 },
      { x: 540, y: 300 },
    ];
    expect(meetsRelation({ rel: 'next', anchor: 0 }, 330, 300, anchors)).toBe(true);
    expect(meetsRelation({ rel: 'next', anchor: 0 }, 200 + NEXT_TO + 1, 300, anchors)).toBe(false);
    expect(meetsRelation({ rel: 'next', anchor: 1 }, 330, 300, anchors)).toBe(false);
    expect(meetsRelation({ rel: 'between' }, 370, 300, anchors)).toBe(true);
    expect(meetsRelation({ rel: 'between' }, 370, 369, anchors)).toBe(true);
    expect(meetsRelation({ rel: 'between' }, 370, 372, anchors)).toBe(false);
    expect(meetsRelation({ rel: 'between' }, 120, 300, anchors)).toBe(false);
    expect(meetsRelation({ rel: 'above', anchor: 0 }, 200, 180, anchors)).toBe(true);
    expect(meetsRelation({ rel: 'above', anchor: 0 }, 200 + ABOVE_REACH + 1, 180, anchors)).toBe(false);
    expect(meetsRelation({ rel: 'above', anchor: 0 }, 200, 420, anchors)).toBe(false);
    expect(meetsRelation({ rel: 'below', anchor: 1 }, 540, 420, anchors)).toBe(true);
    // Beside but barely higher is not above.
    expect(meetsRelation({ rel: 'above', anchor: 0 }, 270, 290, anchors)).toBe(false);
    // On an animal meets nothing.
    for (const r of relations)
      for (const a of anchors) expect(meetsRelation(r, a.x + ON_ANCHOR - 1, a.y, anchors)).toBe(false);
  });

  it('gives every relation a reachable spot on every paper, and the ghost finger presses one that survives `place`', () => {
    for (const p of papers)
      for (const layout of layouts) {
        const pts = layout.map((a) => anchorPixel(a, p.w, p.h));
        for (const r of relations) {
          const t = relationTarget(r, pts);
          expect(reachable(p, t.x, t.y), `${JSON.stringify(r)} on ${p.w}×${p.h}`).toBe(true);
          const back = pixel(place(t.x, t.y, p.w, p.h), p.w, p.h);
          expect(meetsRelation(r, back.x, back.y, pts), `${JSON.stringify(r)} on ${p.w}×${p.h}`).toBe(true);
          // A small square around it meets too, so a finger's wobble still counts.
          for (const [dx, dy] of [
            [-20, -20],
            [20, 20],
            [-20, 20],
            [20, -20],
          ])
            expect(meetsRelation(r, t.x + dx, t.y + dy, pts)).toBe(true);
        }
      }
  });

  it('says each relation with the animals it names', () => {
    const anchors = [{ kind: 'cat' as const }, { kind: 'fish' as const }];
    expect(relationPhrase({ rel: 'next', anchor: 0 }, anchors)).toBe('next to the cat');
    expect(relationPhrase({ rel: 'between' }, anchors)).toBe('between the cat and the fish');
    expect(relationPhrase({ rel: 'above', anchor: 1 }, anchors)).toBe('above the fish');
    expect(relationPhrase({ rel: 'below', anchor: 0 }, anchors)).toBe('below the cat');
  });

  it('the ghost finger chooses the suggested stamp, presses its relation, then finishes', () => {
    const st = { stamps: [], kind: 'star' as const, color: 'red' as const };
    const at = { x: 0.4, y: 0.5 };
    expect(stampDemo(plan, { ...st, invite: { kind: 'kite', at } })).toEqual({ do: 'kind', kind: 'kite' });
    expect(stampDemo(plan, { ...st, kind: 'kite', invite: { kind: 'kite', at } })).toEqual({
      do: 'stamp',
      ...at,
    });
    expect(stampDemo(plan, st)).toEqual({ do: 'finish' });
  });

  it('keeps the kept picture, animals included, within the saved limit', () => {
    // Her stamps stop at LIMIT less the two animals, so the kept picture never passes what a save keeps.
    expect(LIMIT).toBeLessThanOrEqual(PICTURE_MAX);
  });

  it('suggests stamps and prints animals from sets that exist', () => {
    const all = Object.values(SETS).flatMap((s) => [...s.kinds]);
    for (const k of [...RELATION_KINDS, ...ANCHOR_KINDS]) expect(all).toContain(k);
    for (const k of RELATION_KINDS) expect(ANCHOR_KINDS).not.toContain(k);
  });

  it('has its lines and a how-to card that names the relations and the hint', () => {
    for (const id of ['stamp.places', 'stamp.elsewhere', 'stamp.relationsdone'])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeTruthy();
    const card = JSON.stringify(howToFor(stampStudio, 13));
    expect(card).toMatch(/between/);
    expect(card).toMatch(/hint/);
  });
});
