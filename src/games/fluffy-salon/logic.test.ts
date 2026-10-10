import { describe as group, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { anchors, describe, makeRequests, MAX_LENGTH, MIN_LENGTH, needs, PLAY_STROKES, PLANS, REACH, SEG, salonMove, STRANDS, strandPoints, strokePath, TOUR, toolFor, touchStrands, type Pt, type SalonState, type Strand, type Tool } from './logic';

const head = (length: number, curl: number, color: Strand['color'], n = 20): Strand[] => Array.from({ length: n }, () => ({ length, curl, color }));

group('Fluffy Salon', () => {
  it('never starts a request already done, and names each look', () => {
    for (const plan of PLANS.filter((p) => p.requests > 0)) {
      for (let seed = 1; seed <= 200; seed++) {
        const rs = makeRequests(plan, new Rng(seed));
        expect(rs).toHaveLength(plan.requests);
        expect(new Set(rs.map((r) => describe(r.look))).size).toBe(rs.length);
        for (const r of rs) {
          const parts = Object.keys(r.look).length;
          expect(parts, plan.name).toBe(plan.mode === 'ask' ? 1 : plan.mode === 'two' ? 2 : 3);
          expect(needs(r.look, head(r.start.length, r.start.curl, r.start.color))).not.toBeNull();
        }
      }
    }
  });

  it('says what to fix first, and which tool fixes it', () => {
    const look = { length: 'long' as const, color: 'pink' as const, curl: 'curly' as const };
    expect(needs(look, head(60, 0.1, 'blue'))).toBe('longer');
    expect(needs(look, head(200, 0.1, 'blue'))).toBe('pink');
    expect(needs(look, head(200, 0.1, 'pink'))).toBe('curlier');
    expect(needs(look, head(200, 0.9, 'pink'))).toBeNull();
    expect(toolFor('longer')).toBe('grow');
    expect(toolFor('shorter')).toBe('cut');
    expect(toolFor('straighter')).toBe('comb');
    expect(toolFor('pink')).toBe('pink');
    expect(describe(look)).toBe('long, curly and pink');
    expect(describe({ length: 'short', color: 'blue' })).toBe('short and blue');
  });

  it('counts a color only when most of the fur has it', () => {
    const mixed = [...head(100, 0.3, 'pink', 15), ...head(100, 0.3, 'blue', 5)];
    expect(needs({ color: 'pink' }, mixed)).toBe('pink');
    expect(needs({ color: 'pink' }, [...head(100, 0.3, 'pink', 17), ...head(100, 0.3, 'blue', 3)])).toBeNull();
  });

  it('moved the fur\'s geometry and tool effects out of the game unchanged: who is reached, and what each tool does', () => {
    const an = anchors();
    expect(an).toHaveLength(STRANDS);
    const strands = (length: number, curl = 0.3): Strand[] => an.map(() => ({ length, curl, color: 'blue' as const }));
    // A finger far from the head touches nothing.
    const far = strands(100);
    expect(touchStrands('grow', far, an, { x: 900, y: 900 })).toEqual({ touched: 0, snipped: [] });
    expect(far.every((s) => s.length === 100)).toBe(true);
    // At a root, grow adds 9 to each strand within reach (and no other), up to the longest hair.
    const root = an[0];
    const grown = strands(100);
    const { touched } = touchStrands('grow', grown, an, { x: root.x, y: root.y });
    expect(touched).toBe(grown.filter((s) => s.length === 109).length);
    expect(touched).toBeGreaterThan(1);
    expect(grown.filter((s) => s.length !== 100 && s.length !== 109)).toHaveLength(0);
    const capped = strands(MAX_LENGTH - 2);
    touchStrands('grow', capped, an, root);
    expect(Math.max(...capped.map((s) => s.length))).toBe(MAX_LENGTH);
    // Combing and curling move the curl by 0.06 and stay between 0 and 1; a color replaces the strand's.
    const curls = strands(100, 0.98);
    touchStrands('curl', curls, an, root);
    expect(Math.max(...curls.map((s) => s.curl))).toBe(1);
    const combs = strands(100, 0.02);
    touchStrands('comb', combs, an, root);
    expect(Math.min(...combs.map((s) => s.curl))).toBe(0);
    const painted = strands(100);
    touchStrands('pink', painted, an, root);
    expect(painted.some((s) => s.color === 'pink')).toBe(true);
    // A snip cuts the strand back to the first point of it the finger reaches, never to the tip, never shorter than the least, and reports what fell.
    const long = strands(130);
    const pts = strandPoints(an[0], long[0]);
    const at = pts[4];
    const cut = touchStrands('cut', long, an, at);
    const k = pts.findIndex((q) => Math.hypot(q.x - at.x, q.y - at.y) < REACH);
    expect(long[0].length).toBe(Math.max(MIN_LENGTH, k * SEG));
    expect(cut.snipped.length).toBeGreaterThan(0);
    expect(cut.snipped.every((x) => x.color === 'blue')).toBe(true);
    // A finger that reaches only the tip (30 units beyond it, 42 from the point before) has nothing to cut back to: the strand stays.
    const all = strandPoints(an[0], { length: 130, curl: 0.3, color: 'blue' });
    const [before, tip] = [all.at(-2)!, all.at(-1)!];
    const len = Math.hypot(tip.x - before.x, tip.y - before.y);
    const beyond = { x: tip.x + ((tip.x - before.x) / len) * 30, y: tip.y + ((tip.y - before.y) / len) * 30 };
    const tipTouch = strands(130);
    touchStrands('cut', tipTouch, an, beyond);
    expect(tipTouch[0].length).toBe(130);
  });

  /** The ghost hand's pointer moves each frame, at most 0.05 s apart (the app caps the step) and 420 units a second: 21 units. */
  const sweep = (tool: Tool, back: boolean, strands: Strand[], spacing: number) => {
    const an = anchors();
    const path: Pt[] = strokePath(tool, back);
    for (let k = 1; k < path.length; k++) {
      const [a, b] = [path[k - 1], path[k]];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      for (let d = 0; d <= len; d += spacing) touchStrands(tool, strands, an, { x: a.x + ((b.x - a.x) * d) / len, y: a.y + ((b.y - a.y) * d) / len });
    }
  };

  it('does every request with a few sweeps even at the slowest frame rate, inside the one-at-a-time level\'s 15 seconds', () => {
    // The hand's time for a sweep: travel back to the start (the least, as sweeps alternate), press, a leg of at least half a second per corner, lift, rest.
    const seconds = (tool: Tool) => 0.45 + 0.22 + (strokePath(tool).length - 1) * 0.5 + 0.2 + 0.1;
    for (const spacing of [7, 14, 21]) {
      for (const plan of PLANS.filter((p) => p.requests > 0)) {
        let worst = 0;
        for (let seed = 1; seed <= 100; seed++) {
          for (const r of makeRequests(plan, new Rng(seed))) {
            const strands: Strand[] = anchors().map(() => ({ ...r.start }));
            let time = 0;
            let tool: Tool = 'grow';
            let strokes = 0;
            for (let back = false; needs(r.look, strands) && strokes < 12; back = !back, strokes++) {
              const next = toolFor(needs(r.look, strands)!);
              // Taking another tool costs a tap: travel, press, lift and rest.
              if (next !== tool) { time += 1.7; tool = next; }
              sweep(next, back, strands, spacing);
              time += seconds(next);
            }
            expect(needs(r.look, strands), `${plan.mode} seed ${seed} at ${spacing}`).toBeNull();
            if (r.look.length === 'short') {
              const avg = strands.reduce((a, s) => a + s.length, 0) / STRANDS;
              expect(avg).toBeGreaterThan(20);
            }
            worst = Math.max(worst, time);
          }
        }
        // The hint timer is 15 s on the one-at-a-time level; the other levels have none.
        if (plan.mode === 'ask') expect(worst, `${plan.mode} at ${spacing}`).toBeLessThan(12);
      }
    }
  }, 15_000);

  it('plays a whole level touch by touch: the tour in free play, then the mirror; a request, then the mirror only when it is done', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const requests = makeRequests(plan, rng);
        const used = new Set<Tool>();
        let mirrorShown = false;
        for (let r = 0; r < Math.max(1, requests.length); r++) {
          const req = requests[r];
          const st: SalonState = { mode: plan.mode, look: req?.look ?? null, strands: anchors().map(() => ({ ...(req?.start ?? { length: 55, curl: 0.3, color: 'pink' as const }) })), tool: 'grow', strokes: 0, mirror: false };
          let finished = false;
          for (let step = 0, back = false; step < 60 && !finished; step++) {
            const m = salonMove(st);
            if (!m) { expect(plan.mode).toBe('ask'); expect(needs(req.look, st.strands)).toBeNull(); finished = true; break; }
            if (m.do === 'tool') st.tool = m.tool;
            else if (m.do === 'stroke') {
              sweep(st.tool, back, st.strands, 21);
              back = !back;
              used.add(st.tool);
              if (!req) { st.strokes++; st.mirror = st.strokes >= 1; }
            } else {
              // The mirror is only ever looked in when nothing is left to do.
              if (req) expect(needs(req.look, st.strands)).toBeNull();
              mirrorShown = true;
              finished = true;
            }
          }
          expect(finished, `${plan.mode} seed ${seed} request ${r}`).toBe(true);
        }
        if (plan.mode === 'play') expect([...used]).toEqual(['grow']);
        if (plan.mode === 'tools') expect(TOUR.every((t) => used.has(t))).toBe(true);
        if (plan.mode === 'two' || plan.mode === 'match') expect(mirrorShown).toBe(true);
      }
    }
    expect(PLAY_STROKES).toBeGreaterThanOrEqual(2);
  });
});
