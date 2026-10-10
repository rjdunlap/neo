import { describe, expect, it } from 'vitest';
import { allowedParts, askedParts, MUD_BOX, nearMud, nextToScrub, PART_SPOTS, PLANS, planFor, SCRUB_R, scrubPath, wrongTouches, type Part } from './logic';

describe('Splish Splash', () => {
  it('asks for every part exactly once, one or two at a time', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'parts')) {
      const seen = [];
      for (let i = 0; i < plan.parts.length; i += askedParts(plan, i).length) {
        const asked = askedParts(plan, i);
        expect(asked.length).toBe(plan.pairs ? 2 : 1);
        seen.push(...asked);
      }
      expect(seen).toEqual(plan.parts);
      expect(new Set(plan.parts).size).toBe(plan.parts.length);
    }
  });

  it('lets a pair be washed in any order, unless the level says first-then', () => {
    const anyOrder = PLANS.find((p) => p.pairs && !p.ordered)!;
    const [a, b] = askedParts(anyOrder, 0);
    expect(allowedParts(anyOrder, 0, () => false)).toEqual([a, b]);
    expect(allowedParts(anyOrder, 0, (p) => p === b)).toEqual([a]);

    const inOrder = PLANS.find((p) => p.ordered)!;
    const [first, then] = askedParts(inOrder, 0);
    expect(allowedParts(inOrder, 0, () => false)).toEqual([first]);
    expect(allowedParts(inOrder, 0, (p) => p === first)).toEqual([then]);
  });

  it('clamps levels to the ladder', () => {
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });

  it('scrubs the right splotch next: any muddy one when free, and only what the question allows otherwise', () => {
    const free = PLANS[0];
    expect(nextToScrub(free, 0, () => false)).toBe(free.parts[0]);
    expect(nextToScrub(free, 0, (p) => p === free.parts[0])).toBe(free.parts[1]);
    expect(nextToScrub(free, 0, () => true)).toBeNull();
    for (const plan of PLANS.filter((p) => p.mode === 'parts')) {
      // Play the whole level: each part asked for is the next to be scrubbed, in the order the level says.
      const done = new Set<Part>();
      let index = 0;
      const order: Part[] = [];
      for (let guard = 0; guard < 20 && index < plan.parts.length; guard++) {
        const part = nextToScrub(plan, index, (p) => done.has(p));
        expect(part, `${plan.parts} at ${index}`).not.toBeNull();
        expect(askedParts(plan, index)).toContain(part);
        order.push(part!);
        done.add(part!);
        if (askedParts(plan, index).every((p) => done.has(p))) index += askedParts(plan, index).length;
      }
      expect(order).toEqual(plan.parts);
      expect(nextToScrub(plan, plan.parts.length, () => true)).toBeNull();
    }
  });

  it('draws a scrub path that leaves no mud behind on any splotch, however the mud falls', () => {
    const sizes = new Set(Object.values(PART_SPOTS).flat().map(([, , size]) => size));
    expect(sizes.size).toBeGreaterThanOrEqual(4);
    for (const size of sizes) {
      const reach = SCRUB_R / size;
      const path = scrubPath(size);
      expect(path.length).toBeGreaterThanOrEqual(2);
      const near = (x: number, y: number) =>
        path.slice(1).some((b, i) => {
          const a = path[i];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const t = dx || dy ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy))) : 0;
          return Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy)) < reach;
        });
      // Every point of the box the mud can lie in is inside the brush's reach, so the whole splotch goes and the 75% that counts as clean is always met.
      for (let x = -MUD_BOX.x; x <= MUD_BOX.x; x += 2) for (let y = -MUD_BOX.y; y <= MUD_BOX.y; y += 2) expect(near(x, y), `size ${size} at ${x},${y}`).toBe(true);
      // And the path stays on the splotch's texture (120 by 96), where the game takes a touch as scrubbing it.
      for (const p of path) expect(Math.abs(p.x) <= 60 && Math.abs(p.y) <= 48).toBe(true);
    }
  });

  it('does not tell a child off for brushing a neighbor while she scrubs the part she was asked for', () => {
    expect(wrongTouches(['ears'], ['ears', 'head'])).toEqual([]);
    expect(wrongTouches(['ears'], ['head'])).toEqual(['head']);
    expect(wrongTouches(['ears'], [])).toEqual([]);
    expect(wrongTouches(['nose'], ['tummy', 'nose'])).toEqual([]);
    // A finger still within reach of what it scrubbed is not told off for rubbing on, but one that is not is.
    expect(wrongTouches(['ears'], ['head'], true)).toEqual([]);
    expect(wrongTouches(['ears'], ['head'], false)).toEqual(['head']);
    // The reaches really do overlap, so the rule matters: scrubbing the path of every splotch of every level, some point is also near another part.
    let overlaps = 0;
    for (const plan of PLANS.filter((p) => p.mode === 'parts')) {
      for (let index = 0; index < plan.parts.length; index += askedParts(plan, index).length) {
        const asked = askedParts(plan, index);
        for (const part of asked) {
          for (const [px, py, size] of PART_SPOTS[part]) {
            for (const step of scrubPath(size)) {
              // The point in body units, then which splotches of the whole level it is near.
              const body = { x: px + step.x * size, y: py + step.y * size };
              const near = plan.parts.filter((q) => PART_SPOTS[q].some(([qx, qy, qs]) => nearMud((body.x - qx) / qs, (body.y - qy) / qs, qs)));
              expect(near).toContain(part);
              if (near.some((q) => !asked.includes(q))) overlaps++;
              // Scrubbing the asked splotch is never "not that part", whatever neighbors are muddy.
              const before = asked.slice(0, asked.indexOf(part));
              expect(wrongTouches(allowedParts(plan, index, (q) => before.includes(q)), near)).toEqual([]);
            }
          }
        }
      }
    }
    expect(overlaps).toBeGreaterThan(0);
  });

  it('forgives a stroke rubbing on past a splotch it cleaned, but not a slide on to another part', () => {
    const spots = Object.entries(PART_SPOTS).flatMap(([part, list]) => list.map(([x, y, size]) => ({ part: part as Part, x, y, size })));
    /** Whether a point on Pip is within the reach of a splotch, as the game measures it: in that splotch's own texture units. */
    const within = (p: { x: number; y: number }, m: { x: number; y: number; size: number }) => nearMud((p.x - m.x) / m.size, (p.y - m.y) / m.size, m.size);
    // The whole scrub path of a splotch lies within that splotch's own reach, so a stroke that goes on after it is clean stays forgiven.
    for (const m of spots) for (const step of scrubPath(m.size)) expect(within({ x: m.x + step.x * m.size, y: m.y + step.y * m.size }, m)).toBe(true);
    // A finger that scrubbed one part and slides to the middle of a splotch of another part, outside the first's reach, is still told off for it
    // (the "first this, then that" levels keep their correction).
    let slides = 0;
    for (const a of spots) {
      for (const b of spots) {
        if (a.part === b.part || within(b, a)) continue;
        slides++;
        expect(wrongTouches([a.part], [b.part], false)).toEqual([b.part]);
      }
    }
    expect(slides).toBeGreaterThan(8);
    // The overlap that needs forgiving is real: the far end of the second ear's stroke is near the head, and inside the first ear's own reach.
    expect(within({ x: -74 + 22, y: -226 }, { x: -74, y: -226, size: 0.7 })).toBe(true);
    expect(nearMud((-74 + 22 - 6) / 0.9, (-226 + 214) / 0.9, 0.9)).toBe(true);
  });
});
