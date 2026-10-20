import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { allowedParts, askedParts, askedPhrase, cleanPhrase, IdleNudge, MUD_BOX, NAME_GAP, Namer, NUDGE_AFTER, PHRASES, nearMud, nearestIndex, nextToScrub, PART_SPOTS, PATS_PER_PATCH, PLANS, planFor, SCRUB_R, scrubPath, wrongTouches, type Part } from './logic';

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
    const brushes = new Set(PLANS.map((p) => p.brush ?? 1));
    expect(brushes).toContain(1.6);
    for (const brush of brushes) for (const size of sizes) {
      const reach = (SCRUB_R * brush) / size;
      const path = scrubPath(size, brush);
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
      for (let x = -MUD_BOX.x; x <= MUD_BOX.x; x += 2) for (let y = -MUD_BOX.y; y <= MUD_BOX.y; y += 2) expect(near(x, y), `size ${size} brush ${brush} at ${x},${y}`).toBe(true);
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

  it('Pat the bubbles (level 9): every touch makes progress, a round ends in few touches, and a touch anywhere reaches a patch', () => {
    const plan = planFor(9);
    expect(plan.mode).toBe('pat');
    const patches = plan.parts.flatMap((p) => PART_SPOTS[p]);
    expect(patches.length * PATS_PER_PATCH).toBeLessThanOrEqual(12);
    // Pats anywhere on the screen (a grid, off the pet too) always pick a patch, and the same pats finish every patch.
    const points = patches.map(([x, y]) => ({ x, y }));
    const pats = patches.map(() => 0);
    for (let n = 0; n < patches.length * PATS_PER_PATCH * 4; n++) {
      const open = points.filter((_, i) => pats[i] < PATS_PER_PATCH);
      if (!open.length) break;
      const i = nearestIndex(open, ((n * 97) % 1200) - 600, ((n * 61) % 900) - 700);
      expect(i).not.toBeNull();
      pats[points.indexOf(open[i!])]++;
    }
    expect(pats.every((c) => c === PATS_PER_PATCH)).toBe(true);
    expect(nearestIndex([], 0, 0)).toBeNull();
  });

  it('has a spoken word for every part that reads naturally in every bath line', () => {
    const parts = Object.keys(PART_SPOTS) as Part[];
    for (const p of parts) {
      expect(PHRASES[p].word.length).toBeGreaterThan(0);
      // Pairs on the body are spoken as plurals: "Those are my ears", not "That's my ears".
      expect(PHRASES[p].plural).toBe(PART_SPOTS[p].length === 2);
    }
    expect(askedPhrase(['ears', 'nose'])).toBe('my ears and my nose');
    expect(cleanPhrase(['ears', 'nose'])).toBe('ears and nose');
    // Every bath line fills in from the phrase table: no doubled "my", no part id or brace left behind.
    const lines = (Object.keys(SCRIPT) as (keyof typeof SCRIPT)[]).filter((id) => id.startsWith('bath.'));
    for (const id of lines)
      for (const text of SCRIPT[id] as string[])
        for (const p of parts) {
          const filled = text
            .replace('{touched}', PHRASES[p].word)
            .replace(/\{(part|a|b)\}/g, id === 'bath.cleanpart' || id === 'bath.named' ? PHRASES[p].word : askedPhrase([p]))
            .replace('{pet}', 'Pip');
          expect(filled, id).not.toMatch(/[{}]|my my/);
        }
  });

  it('names each part once a round, never over the opening instruction or straight after another name', () => {
    const namer = new Namer();
    const parts: Part[] = ['tummy', 'head', 'cheeks', 'ears'];
    const said: [Part, number][] = [];
    // A busy finger touches a part every tenth of a second for a minute; the opening instruction lasts the first two seconds.
    for (let t = 0; t < 60; t += 0.1) {
      const part = parts[Math.floor(t * 3) % parts.length];
      const named = namer.touch(part, t, t < 2);
      if (named) said.push([named, t]);
    }
    expect(said.map(([p]) => p).sort()).toEqual([...parts].sort());
    expect(said[0][1]).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < said.length; i++) expect(said[i][1] - said[i - 1][1]).toBeGreaterThanOrEqual(NAME_GAP);
    // A name held back is tried again at the next touch, not lost.
    const fresh = new Namer();
    expect(fresh.touch('nose', 0, true)).toBeNull();
    expect(fresh.touch('nose', 0.1)).toBe('nose');
    expect(fresh.touch('nose', 9)).toBeNull();
    // Something else just said makes the next name wait.
    fresh.spoke(10);
    expect(fresh.touch('ears', 10 + NAME_GAP / 2)).toBeNull();
    expect(fresh.touch('ears', 10 + NAME_GAP)).toBe('ears');
  });

  it('never nudges while she scrubs, and nudges once each quiet spell', () => {
    const idle = new IdleNudge();
    // Touches every few seconds, up to just under the limit: no nudge in ten minutes.
    let fired = 0;
    for (let t = 0, sinceTouch = 0; t < 600; t += 1 / 60, sinceTouch += 1 / 60) {
      if (sinceTouch > NUDGE_AFTER - 0.5) {
        idle.touch();
        sinceTouch = 0;
      }
      if (idle.tick(1 / 60)) fired++;
    }
    expect(fired).toBe(0);
    // Left alone for thirty seconds after a touch: once every NUDGE_AFTER seconds.
    idle.touch();
    for (let t = 0; t < 30; t += 1 / 60) if (idle.tick(1 / 60)) fired++;
    expect(fired).toBe(Math.floor(30 / NUDGE_AFTER));
  });

  it('gives the free levels a palm-sized brush and keeps the asked-for levels precise', () => {
    for (const plan of PLANS) expect(plan.brush ?? 1, plan.mode).toBe(plan.mode === 'free' ? 1.6 : 1);
  });
});
