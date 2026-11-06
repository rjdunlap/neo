import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  applyHelp, benchLayout, briefFor, corners, helpFor, LEVEL2_STEPS, need, nextMove, overlaps, PART_IDS, PARTS, passingDesigns, runPath, SOCKETS,
  socketConflict, Tally, handles, helpSteps, LEVEL4_CARTS, newCondition, targetDesign, type Condition, type Gadget, type PartId, type Rect, type Round,
} from './logic';

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const CONDS: Condition[] = ['smooth', 'bump', 'puddle', 'rain', 'dark'];
const forRounds = (level: number, fn: (r: Round, i: number, seed: number) => void) => {
  for (const seed of SEEDS) briefFor(level, new Rng(seed)).rounds.forEach((r, i) => fn(r, i, seed));
};
const ok = (g: Gadget, p: readonly Condition[]) => runPath(g, p).ok;

describe('runPath', () => {
  it('stops at the first unmet condition and its socket for every part and socket', () => {
    for (const c of CONDS.filter((x) => x !== 'smooth')) {
      const n = need(c)!;
      for (const s of SOCKETS) for (const p of [undefined, ...PART_IDS]) {
        const g: Gadget = p ? { [s]: p } : {};
        const r = runPath(g, ['smooth', c]);
        if (s === n.socket && p === n.part) expect(r.ok).toBe(true);
        else expect(r).toEqual({ ok: false, at: c, socket: n.socket, part: n.part });
      }
    }
  });
  it('passes smooth when empty, fails at the first other condition, and ignores decoys in free sockets', () => {
    expect(runPath({}, ['smooth']).ok).toBe(true);
    expect(runPath({}, ['smooth', 'dark', 'rain'])).toMatchObject({ ok: false, at: 'dark' });
    expect(ok({ top: 'umbrella' }, ['smooth', 'rain'])).toBe(true);
    expect(ok({ top: 'umbrella', under: 'flag', front: 'flag' }, ['smooth', 'rain'])).toBe(true);
    expect(ok({ top: 'umbrella', under: 'wheels' }, ['smooth', 'rain'])).toBe(true);
    expect(need('smooth')).toBeNull();
  });
});

describe('authoring', () => {
  it('has no socket conflict, starts with smooth and always has a passing design', () => {
    for (const level of [1, 2, 3]) {
      forRounds(level, (r, _i, seed) => {
        const msg = `level ${level} seed ${seed}`;
        expect(socketConflict(r.path), msg).toBe(false);
        expect(r.path[0], msg).toBe('smooth');
        if (level === 1) {
          const tray = Object.values(r.pair!.gadgets[r.pair!.passing]) as PartId[];
          expect(passingDesigns(r.path, tray, r.open).length, msg).toBeGreaterThan(0);
        } else {
          const placed = Object.values(level === 2 ? r.shown!.gadget : {}) as PartId[];
          expect(passingDesigns(r.path, [...r.tray, ...placed], r.open).length, msg).toBeGreaterThan(0);
        }
      });
    }
  });
  it('gives the same puzzle for the same seed', () => {
    for (const level of [1, 2, 3]) expect(briefFor(level, new Rng(77))).toEqual(briefFor(level, new Rng(77)));
  });
});

describe('level 1', () => {
  it('has three rounds of two gadgets differing in one socket, one passing', () => {
    for (const seed of SEEDS) expect(briefFor(1, new Rng(seed)).rounds).toHaveLength(3);
    forRounds(1, (r, _i, seed) => {
      const { gadgets, passing } = r.pair!;
      const diff = SOCKETS.filter((s) => gadgets[0][s] !== gadgets[1][s]);
      expect(diff, `seed ${seed}`).toHaveLength(1);
      expect(ok(gadgets[passing], r.path), `seed ${seed}`).toBe(true);
      const bad = runPath(gadgets[(1 - passing) as 0 | 1], r.path);
      expect(bad.ok).toBe(false);
      if (!bad.ok) expect(bad.at).toBe(r.path[1]);
    });
  });
  it('authors the first round: rain, Bunny, passing 0, umbrella vs flag on top', () => {
    for (const seed of SEEDS) {
      const r = briefFor(1, new Rng(seed)).rounds[0];
      expect(r.path).toEqual(['smooth', 'rain']);
      expect(r.neighbor.name).toBe('Bunny');
      expect(r.pair!.passing).toBe(0);
      expect(r.pair!.gadgets).toEqual([{ top: 'umbrella' }, { top: 'flag' }]);
    }
  });
});

describe('level 2', () => {
  it('shows a cart that fails exactly at the new condition, with one single-part fix', () => {
    forRounds(2, (r, i, seed) => {
      const msg = `seed ${seed} round ${i}`;
      const sh = r.shown!;
      expect(ok(sh.gadget, sh.path), msg).toBe(true);
      const res = runPath(sh.gadget, r.path);
      expect(res.ok, msg).toBe(false);
      if (!res.ok) expect(res.at, msg).toBe(r.path[r.path.length - 1]);
      expect(r.path[r.path.length - 1], msg).toBe(LEVEL2_STEPS[i].then);
      expect(sh.neighbor, msg).not.toBe(r.neighbor);
      let passes = 0;
      const winners: PartId[] = [];
      for (const s of SOCKETS) for (const p of [undefined, ...r.tray]) {
        const g: Gadget = { ...sh.gadget };
        if (p) g[s] = p; else delete g[s];
        if (p === sh.gadget[s]) continue;
        if (ok(g, r.path)) { passes++; winners.push(p!); }
      }
      expect(passes, msg).toBe(1);
      expect(r.tray, msg).toHaveLength(3);
      expect(new Set(r.tray).size, msg).toBe(3);
      expect(r.tray, msg).toContain(winners[0]);
    });
  });
  it('has three rounds in LEVEL2_STEPS order', () => {
    for (const seed of SEEDS) {
      const rs = briefFor(2, new Rng(seed)).rounds;
      expect(rs).toHaveLength(3);
      rs.forEach((r, i) => {
        expect(r.shown!.path[1]).toBe(LEVEL2_STEPS[i].first);
        expect(r.path[r.path.length - 1]).toBe(LEVEL2_STEPS[i].then);
      });
    }
  });
});

describe('level 3', () => {
  it('has exactly one passing build, position matters, decoys and the flag never help', () => {
    forRounds(3, (r, i, seed) => {
      const msg = `seed ${seed} round ${i}`;
      expect(r.open, msg).toHaveLength(2);
      expect(r.tray, msg).toHaveLength(4);
      expect(new Set(r.tray).size, msg).toBe(4);
      const designs = passingDesigns(r.path, r.tray, r.open);
      expect(designs, msg).toHaveLength(1);
      const [a, b] = r.open;
      const d = designs[0];
      expect(runPath({ [a]: d[b], [b]: d[a] }, r.path).ok, msg).toBe(false);
      expect(Object.values(d), msg).not.toContain('flag');
      const needed = r.path.map(need).filter(Boolean).map((n) => n!.part);
      const decoy = r.tray.find((p) => p !== 'flag' && !needed.includes(p))!;
      expect(PARTS[decoy].socket, msg).not.toBeNull();
      expect(r.open, msg).not.toContain(PARTS[decoy].socket);
      for (const s of r.open) {
        const other = r.open.find((x) => x !== s)!;
        expect(ok({ [s]: decoy }, r.path), msg).toBe(false);
        expect(ok({ [s]: decoy, [other]: d[other] }, r.path), msg).toBe(false);
      }
    });
    for (const seed of SEEDS) expect(briefFor(3, new Rng(seed)).rounds).toHaveLength(3);
  });
  it('authors the first round: rain then dark (top, front)', () => {
    for (const seed of SEEDS) {
      const r = briefFor(3, new Rng(seed)).rounds[0];
      expect(r.path).toEqual(['smooth', 'rain', 'dark']);
      expect(r.open).toEqual(['top', 'front']);
    }
  });
});

describe('help', () => {
  it('names a part belonging to a passing design and keeps correct work', () => {
    for (const seed of SEEDS.slice(0, 200)) {
      const rng = new Rng(seed);
      for (const r of briefFor(3, new Rng(seed)).rounds) {
        const design = passingDesigns(r.path, r.tray, r.open)[0];
        // Random starting gadgets over the open sockets.
        const g: Gadget = {};
        for (const s of r.open) { const p = rng.pick([undefined, ...r.tray]); if (p && !Object.values(g).includes(p)) g[s] = p; }
        const h = helpFor(g, r.path);
        if (ok(g, r.path)) { expect(h).toEqual({ kind: 'done' }); continue; }
        if (h.kind !== 'install') throw new Error('expected install');
        expect(design[h.socket], `seed ${seed}`).toBe(h.part);
        expect(h.replaces).toBe(g[h.socket] ?? null);
        const after = applyHelp(g, h);
        expect(after[h.socket]).toBe(h.part);
        for (const s of SOCKETS) if (s !== h.socket && g[s] && g[s] !== h.part) expect(after[s]).toBe(g[s]);
        // Progress: the first unmet condition moves on or the gadget passes.
        const next = runPath(after, r.path);
        expect(next.ok || r.path.indexOf(next.at) > r.path.indexOf(h.at)).toBe(true);
      }
    }
  });
  it('is done on a passing gadget and a wrong part is replaced only in the unmet socket', () => {
    expect(helpFor({ top: 'umbrella' }, ['smooth', 'rain'])).toEqual({ kind: 'done' });
    const g: Gadget = { top: 'flag', front: 'lantern' };
    const h = helpFor(g, ['smooth', 'rain', 'dark']);
    expect(h).toMatchObject({ kind: 'install', part: 'umbrella', socket: 'top', replaces: 'flag' });
    expect(applyHelp(g, h)).toEqual({ top: 'umbrella', front: 'lantern' });
    expect(applyHelp({ front: 'umbrella' }, { kind: 'install', part: 'umbrella', socket: 'top', replaces: null, at: 'rain' })).toEqual({ top: 'umbrella' });
  });
});

describe('Tally', () => {
  it('lights the glow once for two same-condition fails and ignores a third', () => {
    const t = new Tally();
    expect(t.tryFail('rain', undefined)).toBe(false);
    expect(t.tryFail('rain', undefined)).toBe(true);
    expect(t.glowing).toBe(true);
    expect(t.hints).toBe(1);
    expect(t.tryFail('rain', undefined)).toBe(false);
    expect(t.hints).toBe(1);
  });
  it('does not light for a different condition or a different part', () => {
    const t = new Tally();
    t.tryFail('rain', undefined);
    expect(t.tryFail('dark', undefined)).toBe(false);
    expect(t.tryFail('dark', 'flag')).toBe(false);
    expect(t.glowing).toBe(false);
    expect(t.hints).toBe(0);
  });
  it('counts misses: none, then glow with a hint, then install with a hint', () => {
    const t = new Tally();
    expect(t.miss()).toBe('none');
    expect(t.miss()).toBe('glow');
    expect(t.hints).toBe(1);
    expect(t.miss()).toBe('install');
    expect(t.hints).toBe(2);
    expect(t.misses).toBe(3);
  });
  it('counts help up to the unmet number, then only words', () => {
    const t = new Tally();
    expect(t.help(2)).toBe(true);
    expect(t.help(2)).toBe(true);
    expect(t.help(2)).toBe(false);
    expect(t.hints).toBe(2);
    expect(t.counted).toBe(2);
  });
  it('resets glow and counts on the next round but keeps misses and hints', () => {
    const t = new Tally();
    t.miss(); t.miss(); t.help(1);
    const [m, h] = [t.misses, t.hints];
    t.nextRound();
    expect(t.glowing).toBe(false);
    expect(t.counted).toBe(0);
    expect([t.misses, t.hints]).toEqual([m, h]);
    expect(t.miss()).toBe('none');
  });
});

describe('layout', () => {
  const views = { landscape: computeView(1024, 768), portrait: computeView(768, 1024) };
  const cases: [number, number, number][] = [[1, 2, 0], [2, 3, 3], [3, 3, 4], [4, 4, 4]];
  for (const [name, v] of Object.entries(views)) {
    for (const [level, tiles, tray] of cases) {
      it(`fits level ${level} in ${name}`, () => {
        const l = benchLayout(level, tiles, tray, v)!;
        expect(l).not.toBeNull();
        const all: Rect[] = [l.request, ...l.tiles, ...l.boards, ...l.hands, ...l.tray, l.strip, ...(l.tryButton ? [l.tryButton] : []), ...(l.giveButton ? [l.giveButton] : [])];
        for (const b of l.boards) { expect(b.w).toBeGreaterThanOrEqual(220); expect(b.h).toBeGreaterThanOrEqual(180); }
        for (const r of [...l.hands, ...l.tray]) { expect(r.w).toBeGreaterThanOrEqual(100); expect(r.h).toBeGreaterThanOrEqual(100); }
        for (const b of [l.tryButton, l.giveButton]) if (b) { expect(b.w).toBeGreaterThanOrEqual(110); expect(b.h).toBeGreaterThanOrEqual(110); }
        expect(l.tiles).toHaveLength(tiles);
        expect(l.tray).toHaveLength(tray);
        for (const r of all) {
          expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h).toBe(true);
          for (const c of corners(v)) expect(overlaps(r, c)).toBe(false);
        }
        all.forEach((a, i) => all.forEach((b, j) => { if (i < j) expect(overlaps(a, b)).toBe(false); }));
        if (level === 1) {
          expect(l.boards).toHaveLength(2);
          expect(l.hands).toHaveLength(2);
          expect(l.tryButton).toBeNull();
          expect(l.giveButton).toBeNull();
        } else {
          expect(l.boards).toHaveLength(1);
          expect(l.hands).toHaveLength(0);
          expect(l.tryButton).not.toBeNull();
          expect(l.giveButton).not.toBeNull();
        }
      });
    }
  }
  it('is null or valid on a phone', () => {
    const v = computeView(844, 390);
    for (const [level, tiles, tray] of cases) {
      const l = benchLayout(level, tiles, tray, v);
      if (l) {
        for (const r of [...l.hands, ...l.tray]) { expect(r.w).toBeGreaterThanOrEqual(100); expect(r.h).toBeGreaterThanOrEqual(100); }
        for (const b of l.boards) { expect(b.w).toBeGreaterThanOrEqual(220); expect(b.h).toBeGreaterThanOrEqual(180); }
      }
    }
  });
});

describe('nextMove', () => {
  it('level 1: failing Try, passing Try, then Give', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      for (const r of briefFor(1, new Rng(seed)).rounds) {
        const p = r.pair!.passing;
        const f = (1 - p) as 0 | 1;
        expect(nextMove(r, {}, [false, false], false, 1)).toEqual({ tryGadget: f });
        const t = [false, false]; t[f] = true;
        expect(nextMove(r, {}, t, false, 1)).toEqual({ tryGadget: p });
        expect(nextMove(r, {}, [true, true], false, 1)).toEqual({ give: p });
      }
    }
  });
  it('level 2: try the shown cart, then the named drag, then try and give', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      for (const r of briefFor(2, new Rng(seed)).rounds) {
        const g = r.shown!.gadget;
        expect(nextMove(r, g, [false], false, 2)).toEqual({ tryCart: true });
        const h = helpFor(g, r.path);
        if (h.kind !== 'install') throw new Error('expected install');
        expect(nextMove(r, g, [true], false, 2)).toEqual({ drag: h.part, to: h.socket });
        const done = applyHelp(g, h);
        expect(nextMove(r, done, [true], false, 2)).toEqual({ tryCart: true });
        expect(nextMove(r, done, [true], true, 2)).toEqual({ giveCart: true });
      }
    }
  });
  it('level 3: an empty gadget drags a needed part', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      for (const r of briefFor(3, new Rng(seed)).rounds) {
        const m = nextMove(r, {}, [false], false, 3);
        if (!('drag' in m)) throw new Error('expected drag');
        const n = r.path.map(need).filter(Boolean).map((x) => x!);
        expect(n.some((x) => x.part === m.drag && x.socket === m.to)).toBe(true);
      }
    }
  });
});

// ——— Level 4, Fix-It Day ———

const OLD_PARTS: PartId[] = ['wheels', 'float', 'umbrella', 'lantern', 'flag'];
/** The old single-part rule, kept as a reference table: condition -> the one part and socket that handles it. */
const OLD_RULE: Record<string, { part: PartId; socket: 'under' | 'top' | 'front' }> = {
  bump: { part: 'wheels', socket: 'under' },
  puddle: { part: 'float', socket: 'under' },
  rain: { part: 'umbrella', socket: 'top' },
  dark: { part: 'lantern', socket: 'front' },
};
const oldRun = (g: Gadget, path: readonly Condition[]) => {
  for (const c of path) {
    const n = OLD_RULE[c];
    if (!n) continue;
    if (g[n.socket] !== n.part) return { ok: false, at: c, socket: n.socket, part: n.part };
  }
  return { ok: true };
};
/** Every assembly (each socket empty or one part, no part twice) of `parts` over the three sockets. */
function assemblies(parts: readonly PartId[]): Gadget[] {
  const out: Gadget[] = [];
  const walk = (i: number, g: Gadget) => {
    if (i === SOCKETS.length) { out.push({ ...g }); return; }
    walk(i + 1, g);
    for (const p of parts) {
      if (Object.values(g).includes(p)) continue;
      g[SOCKETS[i]] = p;
      walk(i + 1, g);
      delete g[SOCKETS[i]];
    }
  };
  walk(0, {});
  return out;
}
const bumpPuddle = (r: Round) => r.path.filter((c) => c === 'bump' || c === 'puddle');
/** The shelf's single-job part for today's new condition. */
const obvious = (r: Round) => need(newCondition(r)!)!.part;

describe('paddle wheels model', () => {
  it('pass bump and puddle in under only, and nothing anywhere else', () => {
    for (const c of CONDS) for (const s of SOCKETS) {
      expect(handles('paddles', s, c), `${s} ${c}`).toBe(s === 'under' && (c === 'bump' || c === 'puddle'));
    }
    expect(PARTS.paddles.fixes).toEqual(['bump', 'puddle']);
    for (const s of SOCKETS) for (const c of CONDS) expect(handles(undefined, s, c)).toBe(false);
    expect(ok({ under: 'paddles' }, ['smooth', 'bump', 'puddle'])).toBe(true);
    expect(ok({ top: 'paddles' }, ['smooth', 'bump'])).toBe(false);
    expect(ok({ front: 'paddles' }, ['smooth', 'puddle'])).toBe(false);
    expect(ok({ under: 'paddles' }, ['smooth', 'rain'])).toBe(false);
  });
  it('keep the old rule exactly for every assembly of the five old parts', () => {
    const conds = CONDS.filter((c) => c !== 'smooth');
    const paths: Condition[][] = [['smooth']];
    for (const a of conds) { paths.push(['smooth', a]); for (const b of conds) { paths.push(['smooth', a, b]); for (const c of conds) paths.push(['smooth', a, b, c]); } }
    const all = assemblies(OLD_PARTS);
    expect(all.length).toBeGreaterThan(100);
    for (const g of all) for (const p of paths) expect(runPath(g, p), JSON.stringify([g, p])).toEqual(oldRun(g, p));
  });
  it('need never names the paddle wheels, and levels 1-3 never hold them', () => {
    for (const c of CONDS) expect(need(c)?.part).not.toBe('paddles');
    for (const level of [1, 2, 3]) {
      forRounds(level, (r, _i, seed) => {
        const parts = [...r.tray, ...r.pair?.gadgets.flatMap((g) => Object.values(g)) ?? [], ...Object.values(r.shown?.gadget ?? {})];
        expect(parts, `level ${level} seed ${seed}`).not.toContain('paddles');
      });
    }
  });
});

describe('level 4 rules', () => {
  it('builds yesterday and today as authored, over 500 seeds', () => {
    forRounds(4, (r, _i, seed) => {
      const msg = `seed ${seed}`;
      const y = r.yesterday!;
      expect(ok(y.gadget, y.path), msg).toBe(true);
      expect(r.path[0]).toBe('smooth');
      expect(r.path).toHaveLength(4);
      expect(new Set(r.path).size).toBe(4);
      expect(socketConflict(r.path), msg).toBe(true);
      expect(bumpPuddle(r), msg).toHaveLength(2);
      const nc = newCondition(r)!;
      expect(['bump', 'puddle']).toContain(nc);
      expect(y.path).not.toContain(nc);
      const f = runPath(y.gadget, r.path);
      expect(f, msg).toMatchObject({ ok: false, at: nc });
      // The obvious fix fails at the old condition.
      const swapped: Gadget = { ...y.gadget, under: obvious(r) };
      const o = runPath(swapped, r.path);
      expect(o.ok, msg).toBe(false);
      if (!o.ok) expect(['bump', 'puddle'].includes(o.at) && o.at !== nc, msg).toBe(true);
      // No assembly without paddles passes.
      const noPaddles = assemblies(r.tray.filter((p) => p !== 'paddles'));
      expect(noPaddles.some((g) => ok(g, r.path)), msg).toBe(false);
      expect(r.open).toEqual([...SOCKETS]);
      expect(r.tray).toHaveLength(4);
      expect(r.tray).toContain('paddles');
      expect(r.tray.slice(0, 2).sort()).toEqual(['paddles', obvious(r)].sort());
    });
  });
  it('has a passing set that always uses paddles in under and the third part, with a one-part fewest fix', () => {
    forRounds(4, (r, _i, seed) => {
      const msg = `seed ${seed}`;
      const y = r.yesterday!;
      const designs = passingDesigns(r.path, r.tray, SOCKETS);
      expect(designs.length, msg).toBeGreaterThan(0);
      const third = Object.entries(y.gadget).find(([s]) => s !== 'under')!;
      for (const d of designs) {
        expect(d.under, msg).toBe('paddles');
        expect(d[third[0] as keyof Gadget], msg).toBe(third[1]);
      }
      const diffs = designs.map((d) => SOCKETS.filter((s) => d[s] !== y.gadget[s]).length);
      expect(Math.min(...diffs), msg).toBe(1);
      const fewest = designs[diffs.indexOf(1)];
      expect(fewest.under).toBe('paddles');
      expect(helpSteps(y.gadget, r), msg).toBe(1);
    });
  });
  it('matches the authored first round and the round table', () => {
    for (const seed of SEEDS) {
      const b = briefFor(4, new Rng(seed));
      const [r1] = b.rounds;
      expect(r1.neighbor.name).toBe('Bunny');
      expect(r1.yesterday!.path).toEqual(['smooth', 'bump', 'dark']);
      expect(r1.yesterday!.gadget).toEqual({ under: 'wheels', front: 'lantern' });
      expect(r1.path).toEqual(['smooth', 'bump', 'puddle', 'dark']);
      expect(r1.tray[0]).toBe('float');
      expect(r1.tray[1]).toBe('paddles');
      expect(b.rounds).toHaveLength(3);
      const carts = b.rounds.map((r) => r.yesterday!.gadget.under);
      expect(carts).toEqual(LEVEL4_CARTS.map((c) => (c.old === 'bump' ? 'wheels' : 'float')));
      expect(new Set(carts)).toEqual(new Set(['wheels', 'float']));
      const thirds = b.rounds.map((r) => (r.yesterday!.gadget.top ? 'rain' : 'dark'));
      expect(new Set(thirds)).toEqual(new Set(['rain', 'dark']));
      expect(thirds[0]).toBe('dark');
      expect(thirds[2]).toBe('rain');
      expect(new Set(b.rounds.map((r) => r.neighbor.name)).size).toBe(3);
    }
  });
  it('gives the same puzzle for the same seed', () => {
    expect(briefFor(4, new Rng(31))).toEqual(briefFor(4, new Rng(31)));
  });
});

describe('level 4 help', () => {
  it('reaches a pass within three steps from every assembly, keeping what belongs to the target', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      for (const r of briefFor(4, new Rng(seed)).rounds) {
        for (const start of assemblies(r.tray)) {
          let g = start;
          let steps = 0;
          while (!ok(g, r.path)) {
            expect(steps, `seed ${seed} ${JSON.stringify(start)}`).toBeLessThan(3);
            const target = targetDesign(g, r)!;
            expect(target).not.toBeNull();
            const h = helpFor(g, r.path, r);
            if (h.kind !== 'install') throw new Error('expected install');
            const next = applyHelp(g, h);
            for (const s of SOCKETS) if (g[s] && g[s] === target[s]) expect(next[s], `seed ${seed} ${JSON.stringify(g)}`).toBe(g[s]);
            g = next;
            steps++;
          }
          expect(helpFor(g, r.path, r)).toEqual({ kind: 'done' });
        }
      }
    }
  });
  it('installs the paddle wheels from the cart and from the obvious fix', () => {
    forRounds(4, (r, _i, seed) => {
      for (const g of [r.yesterday!.gadget, { ...r.yesterday!.gadget, under: obvious(r) }]) {
        expect(helpFor(g, r.path, r), `seed ${seed}`).toMatchObject({ kind: 'install', part: 'paddles', socket: 'under' });
      }
    });
  });
  it('agrees with and without the round on levels 1-3 for every assembly of their trays', () => {
    for (const level of [2, 3]) {
      for (const seed of SEEDS.slice(0, 40)) {
        for (const r of briefFor(level, new Rng(seed)).rounds) {
          const parts = [...r.tray, ...Object.values(r.shown?.gadget ?? {})] as PartId[];
          for (const g of assemblies([...new Set(parts)])) expect(helpFor(g, r.path, r)).toEqual(helpFor(g, r.path));
        }
      }
    }
    for (const seed of SEEDS.slice(0, 40)) {
      for (const r of briefFor(1, new Rng(seed)).rounds) {
        for (const g of r.pair!.gadgets) expect(helpFor(g, r.path, r)).toEqual(helpFor(g, r.path));
      }
    }
  });
});

describe('level 4 tally', () => {
  it('lights the glow once on a repeated assembly, counts Show a hint once, and says the conflict once for free', () => {
    const t = new Tally();
    // Try the cart: stops at the new condition (puddle on round 1).
    expect(t.tryFail('puddle', 'wheels', { under: 'wheels', front: 'lantern' })).toBe(false);
    expect(t.stopped('puddle')).toBe(false);
    // Float cart stops at bump.
    expect(t.tryFail('bump', 'float', { under: 'float', front: 'lantern' })).toBe(false);
    expect(t.stopped('bump')).toBe(true);
    expect(t.hints).toBe(0);
    // The cart again: the glow lights once.
    expect(t.tryFail('puddle', 'wheels', { under: 'wheels', front: 'lantern' })).toBe(true);
    expect(t.glowing).toBe(true);
    expect(t.hints).toBe(1);
    expect(t.tryFail('puddle', 'wheels', { under: 'wheels', front: 'lantern' })).toBe(false);
    expect(t.hints).toBe(1);
    // The conflict line never repeats and never adds a hint.
    expect(t.stopped('bump')).toBe(false);
    expect(t.stopped('puddle')).toBe(false);
    expect(t.hints).toBe(1);
    // Show a hint counts once, then only the words.
    expect(t.help(1)).toBe(true);
    expect(t.help(1)).toBe(false);
    expect(t.help(1)).toBe(false);
    expect(t.hints).toBe(2);
    expect(t.misses).toBe(0);
    // A new round resets the glow and the conflict line.
    t.nextRound();
    expect(t.glowing).toBe(false);
    expect(t.stopped('bump')).toBe(false);
    expect(t.stopped('puddle')).toBe(true);
    expect(t.tryFail('puddle', 'wheels', { under: 'wheels' })).toBe(false);
  });
  it('does not say the conflict until both the bump and the puddle have stopped her', () => {
    const t = new Tally();
    expect(t.stopped('puddle')).toBe(false);
    expect(t.stopped('puddle')).toBe(false);
    expect(t.stopped('dark')).toBe(false);
    expect(t.stopped('bump')).toBe(true);
    expect(t.hints).toBe(0);
  });
});

describe('level 4 nextMove', () => {
  it('plays a bot round to a passing Give in 200 seeded briefs', () => {
    for (const seed of SEEDS.slice(0, 200)) {
      for (const r of briefFor(4, new Rng(seed)).rounds) {
        let g: Gadget = { ...r.yesterday!.gadget };
        const tried = [false];
        let triedOk = false;
        const moves: string[] = [];
        let gave = false;
        for (let i = 0; i < 8 && !gave; i++) {
          const m = nextMove(r, g, tried, triedOk, 4);
          moves.push(Object.keys(m)[0] + ':' + Object.values(m)[0]);
          if ('tryCart' in m) { tried[0] = true; triedOk = ok(g, r.path); }
          else if ('drag' in m) {
            g = applyHelp(g, { kind: 'install', part: m.drag, socket: m.to, replaces: g[m.to] ?? null, at: 'bump' });
            triedOk = false;
          } else if ('giveCart' in m) { expect(ok(g, r.path), `seed ${seed}`).toBe(true); gave = true; }
          else throw new Error('unexpected move');
        }
        expect(gave, `seed ${seed} ${moves.join(' ')}`).toBe(true);
        expect(moves[0]).toBe('tryCart:true');
        expect(moves[1]).toBe('drag:paddles');
        expect(moves.length).toBeLessThanOrEqual(6);
      }
    }
  });
});
