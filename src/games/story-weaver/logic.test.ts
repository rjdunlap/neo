import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  CONTROL_R, EVENTS, FEELINGS, PROBLEMS, PROBLEM_IDS, SUPPORTS, TILE_GAP, TILE_H, TILE_W, WHERE, WHO, WeaverRound,
  botStep, events, layout, missing, offeredFeelings, overlaps, pageText, planFor, slotBoxes, storyText,
  type Box, type Part, type Story,
} from './logic';

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const round = (level: number, seed = 1) => new WeaverRound(level, new Rng(seed));
const keys = <T extends object>(o: T) => Object.keys(o) as (keyof T & string)[];

/** A round at `level` with the friend, place and problem placed; `tryIdx`/`endIdx` pick the try/ending (or none). */
function built(level: number, problem = PROBLEM_IDS[0], withTry = true, withEnd = true) {
  const r = round(level);
  r.setActive('who'); r.place(r.tray()[0]);
  r.setActive('where'); r.place(r.tray()[0]);
  r.setActive('problem'); r.place(problem);
  if (withTry) r.place(PROBLEMS[problem].tries[0]); else r.setActive('ending');
  if (withEnd) { r.setActive('ending'); r.place(PROBLEMS[problem].endings[0]); }
  return r;
}

describe('content sets', () => {
  it('offers at least two of every tray set', () => {
    expect(keys(WHO).length).toBeGreaterThanOrEqual(2);
    expect(keys(WHERE).length).toBeGreaterThanOrEqual(2);
    expect(PROBLEM_IDS.length).toBeGreaterThanOrEqual(2);
    for (const level of [1, 2, 3]) {
      const r = round(level);
      for (const p of ['who', 'where', 'problem'] as Part[]) { r.active = p; expect(r.tray().length).toBeGreaterThanOrEqual(2); }
    }
    for (const p of PROBLEM_IDS) { expect(PROBLEMS[p].tries).toHaveLength(2); expect(PROBLEMS[p].endings).toHaveLength(3); }
  });
  it('has every try and ending in EVENTS, with the supports rows the because frame needs', () => {
    for (const p of PROBLEM_IDS) {
      for (const e of [...PROBLEMS[p].tries, ...PROBLEMS[p].endings]) expect(EVENTS[e], e).toBeTruthy();
      expect(SUPPORTS.sad).toContain(p);
      for (const e of PROBLEMS[p].endings) { expect(SUPPORTS.happy).toContain(e); expect(SUPPORTS.relieved).toContain(e); expect(SUPPORTS.sad).not.toContain(e); }
    }
    for (const f of FEELINGS) expect(SUPPORTS[f].length).toBeGreaterThanOrEqual(2);
  });
});

describe('composed text', () => {
  const texts: string[] = [];
  const check = (s: Story) => {
    for (const t of [...[1, 2, 3, 4].map((p) => pageText(s, p)), storyText(s)]) {
      if (t === '') continue;
      texts.push(t);
      expect(t).not.toMatch(/undefined|null|\s{2}|\bNaN\b/);
      expect(t.trim()).toBe(t);
      expect(t.endsWith('.')).toBe(true);
      expect(t.split('.').map((x) => x.trim()).filter((_, i, a) => i < a.length - 1)).not.toContain('');
      expect(t).not.toMatch(/\b(he|she|him|her|his|hers)\b/i);
    }
  };
  it('is clean for every reachable and partial combination', () => {
    for (const who of [undefined, ...keys(WHO)]) for (const where of [undefined, ...keys(WHERE)]) for (const problem of [undefined, ...PROBLEM_IDS]) {
      const tries = problem ? [undefined, ...PROBLEMS[problem].tries] : [undefined];
      const ends = problem ? [undefined, ...PROBLEMS[problem].endings] : [undefined];
      for (const t of tries) for (const ending of ends) {
        const base: Story = { who, where, problem, try: t, ending };
        check(base);
        for (const feeling of FEELINGS) {
          check({ ...base, feeling });
          for (const reason of events(base)) check({ ...base, feeling, reason });
        }
      }
    }
    expect(texts.length).toBeGreaterThan(1000);
  });
});

describe('the owl question', () => {
  it('lists missing parts in fixed order', () => {
    expect(missing({})).toEqual(['where', 'problem', 'ending']);
    expect(missing({ where: 'pond' })).toEqual(['problem', 'ending']);
    expect(missing({ where: 'pond', ending: 'hat.tree' })).toEqual(['problem']);
    expect(missing({ where: 'pond', problem: 'hat' })).toEqual(['ending']);
  });
  it('asks the first missing part, then places it and clears the question', () => {
    const r = round(2); r.place(r.tray()[0]);
    expect(r.read()).toBe('where'); expect(r.owlAsk).toBe('where');
    expect(r.glowing()).toEqual(r.tray());
    const res = r.place(r.tray()[0]);
    expect(res.answered).toBe(true); expect(r.owlAsk).toBeNull();
    expect(r.read()).toBe('problem');
    expect(r.misses + r.hints).toBe(0);
  });
  it('never questions a complete story and ends level 2', () => {
    const r = built(2, 'mud', true, true);
    expect(r.read()).toBeNull(); expect(r.phase).toBe('done'); expect(r.owlAsk).toBeNull();
  });
  it('lets her decline once a friend is placed, and not before', () => {
    const r = round(2);
    expect(r.decline()).toBe(false);
    r.place(r.tray()[0]); r.read();
    expect(r.decline()).toBe(true); expect(r.phase).toBe('done'); expect(r.misses + r.hints).toBe(0);
  });
  it('level 2 afterAnswer ends a story completed by the answer', () => {
    const r = built(2, 'rain', false, false); r.setActive('ending');
    expect(r.read()).toBe('ending');
    expect(r.place(PROBLEMS.rain.endings[1]).answered).toBe(true);
    expect(r.afterAnswer()).toBe(true); expect(r.phase).toBe('done');
  });
});

describe('offered feelings', () => {
  it('only offers supported feelings, none early, at least three when frame opens', () => {
    for (const p of PROBLEM_IDS) for (const t of [undefined, ...PROBLEMS[p].tries]) for (const ending of PROBLEMS[p].endings) {
      const s: Story = { problem: p, try: t, ending };
      const off = offeredFeelings(s);
      expect(off.length).toBeGreaterThanOrEqual(3);
      for (const f of off) expect(events(s).some((e) => SUPPORTS[f].includes(e)), `${f} ${p}`).toBe(true);
      expect(offeredFeelings({ problem: p, try: t })).toEqual([]);
      expect(offeredFeelings({ ending })).toEqual([]);
    }
  });
});

describe('level 3 because accounting', () => {
  /** A story at level 3 with feeling sad (supported only by the problem), so try and ending are unsupported reasons. */
  const sadRound = () => {
    const r = built(3, 'hat'); r.setActive('feeling'); r.place('sad');
    return r;
  };
  it('charges the first unsupported reason nothing, then one miss each; glow and one hint at the second miss', () => {
    const r = sadRound();
    expect(r.phase).toBe('reason');
    const [prob, tr, end] = r.tray();
    expect(r.chooseReason(tr).kind).toBe('free'); expect([r.misses, r.hints]).toEqual([0, 0]);
    expect(r.chooseReason(end)).toEqual({ kind: 'miss', glow: false }); expect([r.misses, r.hints]).toEqual([1, 0]);
    expect(r.glowing()).toEqual([]);
    expect(r.chooseReason(tr)).toEqual({ kind: 'miss', glow: true }); expect([r.misses, r.hints]).toEqual([2, 1]);
    expect(r.glowing()).toEqual([prob]);
    expect(r.showHint()).toBe(false); expect(r.hints).toBe(1);
    r.chooseReason(end); expect(r.hints).toBe(1);
    expect(r.chooseReason(prob).kind).toBe('yes'); expect(r.phase).toBe('done'); expect(r.story.reason).toBe(prob);
  });
  it('hint button glows only supporting tiles and counts once', () => {
    const r = sadRound();
    expect(r.showHint()).toBe(true); expect(r.hints).toBe(1);
    for (const g of r.glowing()) expect(SUPPORTS.sad).toContain(g);
    r.chooseReason(r.tray()[1]); r.chooseReason(r.tray()[2]); r.chooseReason(r.tray()[1]);
    expect(r.hints).toBe(1);
  });
  it('a supported first reason finishes without cost', () => {
    const r = built(3, 'tower'); r.setActive('feeling'); r.place('happy');
    expect(r.chooseReason(r.story.ending!).kind).toBe('yes'); expect(r.phase).toBe('done'); expect(r.misses + r.hints).toBe(0);
  });
});

describe('level 1 and edits', () => {
  it('advances pages 1, 2, 3, offers three friends and places, and ends on the ending', () => {
    const r = round(1);
    expect(r.tray()).toHaveLength(3); expect(r.currentPage).toBe(1);
    r.place(r.tray()[0]); expect(r.currentPage).toBe(1);
    expect(r.tray()).toHaveLength(3); r.place(r.tray()[0]); expect(r.currentPage).toBe(2);
    r.place(r.tray()[0]); expect(r.currentPage).toBe(2); expect(r.active).toBe('try');
    r.place(r.tray()[0]); expect(r.currentPage).toBe(3);
    const res = r.place(r.tray()[0]);
    expect(res.storyDone).toBe(true); expect(r.phase).toBe('done');
  });
  it('skipTry works only once, with a problem and no try', () => {
    const r = round(1);
    expect(r.skipTry()).toBeNull();
    r.place(r.tray()[0]); r.place(r.tray()[0]); r.place(r.tray()[0]);
    expect(r.skipTry()).toBe(2); expect(r.currentPage).toBe(3); expect(r.skipTry()).toBeNull();
    const t = built(1, 'hat', true, false); expect(t.skipTry()).toBeNull();
  });
  it('changing or removing the problem clears try and ending', () => {
    const r = built(2, 'hat');
    r.setActive('problem');
    expect(r.place('mud').cleared).toEqual(['try', 'ending']);
    expect(r.story.try).toBeUndefined(); expect(r.story.ending).toBeUndefined();
    const q = built(2, 'hat');
    expect(q.remove('problem')).toEqual(['problem', 'try', 'ending']);
    expect(q.story.problem).toBeUndefined(); expect(q.story.try).toBeUndefined(); expect(q.story.ending).toBeUndefined();
  });
});

describe('ghost finger', () => {
  it('finishes every seed and level with no misses or hints', () => {
    for (const level of [1, 2, 3]) for (const seed of SEEDS) {
      const r = round(level, seed);
      let steps = 0;
      while (r.phase !== 'done' && steps++ < 40) {
        const b = botStep(r, seed);
        expect(b, `l${level} s${seed}`).not.toBeNull();
        if (!b) break;
        if ('tile' in b) {
          if (r.phase === 'reason') r.chooseReason(b.tile);
          else { const res = r.place(b.tile); if (level === 2 && res.answered) r.afterAnswer(); }
        } else if ('slot' in b) r.setActive(b.slot);
        else if ('skip' in b) r.skipTry();
        else if ('read' in b) r.read();
        else r.decline();
      }
      expect(r.phase, `l${level} s${seed}`).toBe('done');
      expect([r.misses, r.hints]).toEqual([0, 0]);
    }
  });
});

describe('layout', () => {
  const views = [{ w: 1024, h: 768 }, { w: 1366, h: 1024 }, { w: 1024, h: 1366 }, { w: 1180, h: 820 }, { w: 1024, h: 1300 }];
  it('fits, never overlaps, and keeps targets large', () => {
    for (const v of views) for (const pages of [3, 4]) {
      const L = layout(v, pages);
      const ctl = L.controls.map((c) => ({ x: c.x - CONTROL_R, y: c.y - CONTROL_R, w: 2 * CONTROL_R, h: 2 * CONTROL_R }));
      const boxes: [string, Box][] = [...L.pages.map((b, i) => [`page${i}`, b] as [string, Box]), ['strip', L.strip], ['tray', L.tray], ['owl', L.owl], ['pet', L.pet], ['corner', L.corner], ...ctl.map((b, i) => [`ctl${i}`, b] as [string, Box])];
      const tag = `${v.w}x${v.h} p${pages}`;
      for (const [n, b] of boxes) {
        expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h, `${tag} ${n} inside`).toBe(true);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i][1], boxes[j][1]), `${tag} ${boxes[i][0]} x ${boxes[j][0]}`).toBe(false);
      L.pages.forEach((b, i) => slotBoxes(b, i + 1 > 4 ? 4 : i + 1).forEach((s) => { expect(s.w).toBeGreaterThanOrEqual(100); expect(s.h).toBeGreaterThanOrEqual(100); }));
      for (const n of [2, 3, 4, 5, 6]) {
        const t = L.tiles(n);
        for (const c of t) {
          expect(c.x - TILE_W / 2 >= L.tray.x - 0.01 && c.x + TILE_W / 2 <= L.tray.x + L.tray.w + 0.01, `${tag} tile x`).toBe(true);
          expect(c.y - TILE_H / 2 >= L.tray.y - 0.01 && c.y + TILE_H / 2 <= L.tray.y + L.tray.h + 0.01, `${tag} tile y`).toBe(true);
        }
        for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
          expect(Math.max(Math.abs(t[i].x - t[j].x) - TILE_W, Math.abs(t[i].y - t[j].y) - TILE_H), `${tag} gap`).toBeGreaterThanOrEqual(TILE_GAP - 0.01);
        }
      }
      expect(TILE_W).toBeGreaterThanOrEqual(140); expect(TILE_H).toBeGreaterThanOrEqual(120);
      expect(2 * CONTROL_R).toBeGreaterThanOrEqual(112);
    }
  });
});

describe('plans', () => {
  it('names no grade or age', () => {
    for (const l of [1, 2, 3]) expect(planFor(l).name).not.toMatch(/\b(grade|years?|ages?|aged|reading level)\b/i);
  });
});
