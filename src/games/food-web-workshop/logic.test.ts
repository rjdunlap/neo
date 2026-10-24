import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { overlaps, petCorner } from '../../content/lands';
import {
  applyHint, BADGE, CARD, caseRecords, check, connect, demoNext, dropTarget, firstFault, hintAction, layout, makeRound, newState, ORGANISMS,
  PLANS, planFor, RECORDS, restartState, same, SHOW, startArrows, STATION_R, undo, UNDO_R, type Arrow, type RecordId, type WebState,
} from './logic';

const LEVELS = [1, 2, 3];
const SEEDS = Array.from({ length: 200 }, (_, i) => i);
const stateFor = (level: number, seed: number): WebState => newState(makeRound(level, new Rng(seed)));
const sortedKey = (arrows: readonly Arrow[]) => arrows.map((a) => `${a.from}>${a.to}`).sort().join(',');
const recordKey = (s: WebState) => sortedKey(caseRecords(s.round.webCase));
const matchesRecord = (s: WebState, a: Arrow) => caseRecords(s.round.webCase).some((r) => r.from === a.from && r.to === a.to);

/** Random connect/undo walk over the round's three organisms. */
function wander(s: WebState, rng: Rng, steps: number) {
  const orgs = s.round.webCase.organisms;
  for (let i = 0; i < steps; i++) {
    if (rng.next() < 0.25) undo(s);
    else {
      const from = rng.pick(orgs);
      const to = rng.pick(orgs);
      connect(s, from, to);
    }
  }
}

describe('records and cases', () => {
  it('has six records over known organisms, none its own reverse', () => {
    expect(RECORDS).toHaveLength(6);
    expect(new Set(RECORDS.map((r) => r.id)).size).toBe(6);
    const used = new Set<string>();
    for (const plan of PLANS) for (const c of plan.cases) c.organisms.forEach((o) => used.add(o));
    for (const r of RECORDS) {
      expect(ORGANISMS).toContain(r.from);
      expect(ORGANISMS).toContain(r.to);
      expect(used.has(r.from) && used.has(r.to)).toBe(true);
      expect(r.from).not.toBe(r.to);
      expect(RECORDS.some((o) => o.from === r.to && o.to === r.from)).toBe(false);
    }
  });

  it('every case is acyclic, chains at levels 1-2 and a shared-plant branch at level 3', () => {
    for (const plan of PLANS) {
      for (const c of plan.cases) {
        const [a, b] = caseRecords(c);
        expect(new Set(c.organisms).size).toBe(3);
        for (const r of [a, b]) {
          expect(c.organisms).toContain(r.from);
          expect(c.organisms).toContain(r.to);
        }
        // two edges over three nodes cannot cycle unless they are mutual reverses
        expect(a.from === b.to && a.to === b.from).toBe(false);
        if (plan.level < 3) {
          expect(a.to).toBe(b.from);
          expect(a.from).not.toBe(b.to);
        } else {
          expect(a.from).toBe(b.from);
          expect(a.to).not.toBe(b.to);
        }
      }
    }
  });

  it('planFor clamps and matches levels', () => {
    expect(planFor(0).level).toBe(1);
    expect(planFor(9).level).toBe(3);
    expect(LEVELS.map((l) => planFor(l).level)).toEqual(LEVELS);
  });
});

describe('level 2 start', () => {
  it('has exactly one reversed and one correct arrow; one connect turns it and leaves the other', () => {
    const reversedSeen = new Set<string>();
    for (const seed of SEEDS) {
      const s = stateFor(2, seed);
      const recs = caseRecords(s.round.webCase);
      expect(s.arrows).toHaveLength(2);
      const rev = recs.filter((r) => s.arrows.some((a) => a.from === r.to && a.to === r.from));
      const good = recs.filter((r) => s.arrows.some((a) => a.from === r.from && a.to === r.to));
      expect(rev).toHaveLength(1);
      expect(good).toHaveLength(1);
      expect(rev[0].id).toBe(s.round.reversed);
      reversedSeen.add(rev[0].id);
      const goodArrow = { from: good[0].from, to: good[0].to };
      expect(connect(s, rev[0].from, rev[0].to)).toBe('turned');
      expect(s.arrows).toHaveLength(2);
      expect(s.arrows.some((a) => same(a, goodArrow))).toBe(true);
      expect(sortedKey(s.arrows)).toBe(recordKey(s));
      expect(check(s)).toEqual({ ok: true });
    }
    expect(reversedSeen.size).toBeGreaterThan(1);
  });

  it('levels 1 and 3 start empty, with no reversed record', () => {
    for (const level of [1, 3]) for (const seed of SEEDS) {
      const s = stateFor(level, seed);
      expect(s.arrows).toEqual([]);
      expect(s.round.reversed).toBeNull();
    }
  });
});

describe('check and accounting', () => {
  it('is ok exactly when the arrows equal the records', () => {
    for (const level of LEVELS) for (const seed of SEEDS.slice(0, 40)) {
      const s = stateFor(level, seed);
      const rng = new Rng(seed + 1000);
      for (let i = 0; i < 12; i++) {
        wander(s, rng, 1);
        const equal = sortedKey(s.arrows) === recordKey(s);
        expect(firstFault(s.arrows, s.round.webCase) === null).toBe(equal);
      }
    }
  });

  it('reports the first fault in order reversed, missing, extra and counts one miss per check', () => {
    const s = stateFor(1, 3);
    const [r1, r2] = caseRecords(s.round.webCase);
    const [a, , c] = [r1.from, r1.to, r2.to];
    // reversed + missing + extra at once: r1 reversed, r2 absent, extra a-c
    s.arrows = [{ from: r1.to, to: r1.from }, { from: a, to: c }];
    const res = check(s)!;
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fault.kind).toBe('reversed');
    expect(s.misses).toBe(1);
    s.arrows = [{ from: a, to: c }];
    const res2 = check(s)!;
    if (!res2.ok) expect(res2.fault.kind).toBe('missing');
    expect(s.misses).toBe(2);
    s.arrows = [{ from: r1.from, to: r1.to }, { from: r2.from, to: r2.to }, { from: a, to: c }];
    const res3 = check(s)!;
    if (!res3.ok) expect(res3.fault.kind).toBe('extra');
    expect(s.misses).toBe(3);
    expect(s.checks).toBe(3);
  });

  it('only a failed check adds a miss; hints count one; done after ok and a second check is null', () => {
    for (const level of LEVELS) for (const seed of SEEDS.slice(0, 40)) {
      const s = stateFor(level, seed);
      wander(s, new Rng(seed + 7), 15);
      expect(s.misses).toBe(0);
      expect(s.hints).toBe(0);
      const before = s.hints;
      const h = applyHint(s);
      expect(s.hints).toBe(h && h.kind !== 'check' ? before + 1 : before);
      expect(s.misses).toBe(0);
      while (applyHint(s)?.kind !== 'check') { /* mend */ }
      const misses = s.misses;
      expect(check(s)).toEqual({ ok: true });
      expect(s.done).toBe(true);
      expect(s.misses).toBe(misses);
      expect(check(s)).toBeNull();
      expect(s.checks).toBe(1);
      expect(s.misses).toBe(misses);
      expect(connect(s, s.round.stations[0], s.round.stations[1])).toBe('none');
      expect(undo(s)).toBeNull();
      expect(applyHint(s)).toBeNull();
    }
  });

  it('connect semantics: same, self and add leave sane state', () => {
    const s = stateFor(1, 5);
    const [x, y] = s.round.stations;
    expect(connect(s, x, x)).toBe('none');
    expect(connect(s, x, y)).toBe('added');
    expect(connect(s, x, y)).toBe('same');
    expect(connect(s, y, x)).toBe('turned');
    expect(s.arrows).toHaveLength(1);
    expect(s.arrows[0]).toEqual({ from: y, to: x });
    expect(s.undo).toHaveLength(2);
    expect(s.misses + s.hints + s.checks).toBe(0);
  });
});

describe('hints', () => {
  it('with no fault returns check and counts nothing', () => {
    for (const level of LEVELS) for (const seed of SEEDS.slice(0, 40)) {
      const s = stateFor(level, seed);
      s.arrows = caseRecords(s.round.webCase).map((r) => ({ from: r.from, to: r.to }));
      expect(hintAction(s)).toEqual({ kind: 'check' });
      expect(applyHint(s)).toEqual({ kind: 'check' });
      expect(s.hints).toBe(0);
      expect(s.arrows).toHaveLength(2);
    }
  });

  it('from random reachable states each hint counts one, never touches a matching arrow, and reaches ok within three fixes', () => {
    for (const level of LEVELS) for (const seed of SEEDS) {
      const s = stateFor(level, seed);
      wander(s, new Rng(seed * 31 + level), 1 + (seed % 14));
      let fixes = 0;
      let last = firstFaultCount(s);
      while (firstFault(s.arrows, s.round.webCase)) {
        const matching = s.arrows.filter((a) => matchesRecord(s, a));
        const hints = s.hints;
        const act = applyHint(s)!;
        expect(act.kind).not.toBe('check');
        expect(s.hints).toBe(hints + 1);
        for (const m of matching) expect(s.arrows.some((a) => same(a, m))).toBe(true);
        const now = firstFaultCount(s);
        expect(now).toBeLessThan(last);
        last = now;
        fixes++;
        expect(fixes).toBeLessThanOrEqual(3);
      }
      expect(check(s)).toEqual({ ok: true });
      expect(s.misses).toBe(0);
    }
  });
});

function firstFaultCount(s: WebState) {
  // faults are exported only via firstFault; count by repeating the hint on a copy
  const copy: WebState = { ...s, arrows: [...s.arrows], undo: [...s.undo] };
  let n = 0;
  while (firstFault(copy.arrows, copy.round.webCase) && n < 10) {
    applyHint(copy);
    n++;
  }
  return n;
}

describe('undo and restart', () => {
  it('undo restores the exact previous arrows, step by step, and is a no-op when empty', () => {
    for (const level of LEVELS) for (const seed of SEEDS.slice(0, 60)) {
      const s = stateFor(level, seed);
      const rng = new Rng(seed + 55);
      const snapshots: string[] = [];
      for (let i = 0; i < 10; i++) {
        const before = sortedKey(s.arrows);
        const depth = s.undo.length;
        connect(s, rng.pick(s.round.webCase.organisms), rng.pick(s.round.webCase.organisms));
        if (s.undo.length > depth) snapshots.push(before);
      }
      while (snapshots.length) {
        expect(undo(s)).not.toBeNull();
        expect(sortedKey(s.arrows)).toBe(snapshots.pop());
      }
      expect(sortedKey(s.arrows)).toBe(sortedKey(startArrows(s.round)));
      expect(undo(s)).toBeNull();
      expect(sortedKey(s.arrows)).toBe(sortedKey(startArrows(s.round)));
      if (level === 2) expect(s.arrows).toHaveLength(2);
    }
  });

  it('a turned pre-drawn arrow turns back on undo and is never removed', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      const s = stateFor(2, seed);
      const start = sortedKey(s.arrows);
      const rec = caseRecords(s.round.webCase).find((r) => r.id === s.round.reversed)!;
      connect(s, rec.from, rec.to);
      undo(s);
      expect(sortedKey(s.arrows)).toBe(start);
      expect(undo(s)).toBeNull();
      expect(s.arrows).toHaveLength(2);
    }
  });

  it('restartState returns to the start, clears undo, keeps misses and hints', () => {
    for (const level of LEVELS) for (const seed of SEEDS.slice(0, 30)) {
      const s = stateFor(level, seed);
      wander(s, new Rng(seed), 8);
      check(s);
      applyHint(s);
      const { misses, hints, checks } = s;
      restartState(s);
      expect(sortedKey(s.arrows)).toBe(sortedKey(startArrows(s.round)));
      expect(s.undo).toEqual([]);
      expect([s.misses, s.hints, s.checks]).toEqual([misses, hints, checks]);
    }
  });
});

describe('seeded rounds', () => {
  it('seeds 0-199 give valid cases, station orders and reversed records, deterministically', () => {
    for (const level of LEVELS) {
      const seenCases = new Set<number>();
      const seenOrders = new Set<string>();
      for (const seed of SEEDS) {
        const r = makeRound(level, new Rng(seed));
        const again = makeRound(level, new Rng(seed));
        expect(again).toEqual(r);
        expect(planFor(level).cases).toContain(r.webCase);
        seenCases.add(planFor(level).cases.indexOf(r.webCase));
        expect([...r.stations].sort()).toEqual([...r.webCase.organisms].sort());
        seenOrders.add(r.stations.join());
        if (level === 2) expect(r.webCase.records).toContain(r.reversed as RecordId);
        else expect(r.reversed).toBeNull();
      }
      expect(seenCases.size).toBe(2);
      expect(seenOrders.size).toBeGreaterThan(3);
    }
  });
});

describe('layout', () => {
  const views = [
    { name: 'landscape', v: { w: 1024, h: 768, scale: 1 } },
    { name: 'wide', v: { w: 1366, h: 768, scale: 1 } },
    { name: 'portrait', v: { w: 1024, h: 1365, scale: 1 } },
  ];
  type Item = { name: string; rect: { x: number; y: number; w: number; h: number }; circle?: { x: number; y: number; r: number }; owner?: number };
  const sq = (c: { x: number; y: number }, w: number, h = w) => ({ x: c.x - w / 2, y: c.y - h / 2, w, h });
  const circleRect = (c: { x: number; y: number; r: number }, r: { x: number; y: number; w: number; h: number }) => {
    const dx = c.x - Math.max(r.x, Math.min(c.x, r.x + r.w));
    const dy = c.y - Math.max(r.y, Math.min(c.y, r.y + r.h));
    return dx * dx + dy * dy < c.r * c.r;
  };
  const hit = (a: Item, b: Item) => {
    if (a.circle && b.circle) return Math.hypot(a.circle.x - b.circle.x, a.circle.y - b.circle.y) < a.circle.r + b.circle.r;
    if (a.circle) return circleRect(a.circle, b.rect);
    if (b.circle) return circleRect(b.circle, a.rect);
    return overlaps(a.rect, b.rect);
  };

  for (const { name, v } of views) {
    for (const cards of [1, 2]) {
      it(`${name} view, ${cards} card(s): everything on screen, big, clear of the corners, no overlaps`, () => {
        const L = layout(v, cards);
        const items: Item[] = [];
        L.cards.forEach((p, i) => items.push({ name: `card${i}`, rect: sq(p, CARD.w, CARD.h) }));
        L.stations.forEach((p, i) => items.push({ name: `station${i}`, rect: sq(p, 2 * STATION_R), circle: { ...p, r: STATION_R }, owner: i }));
        L.badges.forEach((p, i) => items.push({ name: `badge${i}`, rect: sq(p, BADGE), owner: i }));
        items.push({ name: 'show', rect: sq(L.show, SHOW.w, SHOW.h) });
        items.push({ name: 'undo', rect: sq(L.undo, 2 * UNDO_R), circle: { ...L.undo, r: UNDO_R } });
        expect(L.cards).toHaveLength(cards);

        const pet = petCorner(v.h);
        const buttons = { x: 0, y: 0, w: 130, h: 230 };
        for (const it of items) {
          expect(it.rect.x, it.name).toBeGreaterThanOrEqual(0);
          expect(it.rect.y, it.name).toBeGreaterThanOrEqual(0);
          expect(it.rect.x + it.rect.w, it.name).toBeLessThanOrEqual(v.w);
          expect(it.rect.y + it.rect.h, it.name).toBeLessThanOrEqual(v.h);
          expect(Math.min(it.rect.w, it.rect.h), it.name).toBeGreaterThanOrEqual(100);
          const clear = (r: { x: number; y: number; w: number; h: number }) => (it.circle ? !circleRect(it.circle, r) : !overlaps(it.rect, r));
          expect(clear(pet), `${it.name} vs pet`).toBe(true);
          expect(clear(buttons), `${it.name} vs home`).toBe(true);
        }
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          if (a.owner !== undefined && a.owner === b.owner) continue; // a badge sits on its own station
          expect(hit(a, b), `${a.name} vs ${b.name}`).toBe(false);
        }
      });
    }

    it(`${name} view: station drop circles are apart and drops resolve to the nearest station`, () => {
      const L = layout(v, 2);
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        expect(Math.hypot(L.stations[i].x - L.stations[j].x, L.stations[i].y - L.stations[j].y)).toBeGreaterThan(2 * STATION_R + 80);
      }
      for (let own = 0; own < 3; own++) {
        // dropped on its own station: nothing
        expect(dropTarget(L.stations, own, L.stations[own].x, L.stations[own].y)).toBeNull();
        for (let t = 0; t < 3; t++) {
          if (t === own) continue;
          expect(dropTarget(L.stations, own, L.stations[t].x, L.stations[t].y)).toBe(t);
        }
      }
      // a badge's own rest spot is never a drop on another station
      L.badges.forEach((b, own) => expect(dropTarget(L.stations, own, b.x, b.y)).toBeNull());
      // random points: result is the nearest other station within reach, else null
      const rng = new Rng(9);
      for (let n = 0; n < 500; n++) {
        const x = rng.range(0, v.w);
        const y = rng.range(0, v.h);
        const own = rng.int(0, 2);
        const got = dropTarget(L.stations, own, x, y);
        const others = [0, 1, 2].filter((i) => i !== own).map((i) => ({ i, d: Math.hypot(L.stations[i].x - x, L.stations[i].y - y) })).sort((p, q) => p.d - q.d);
        expect(got).toBe(others[0].d < 170 ? others[0].i : null);
      }
    });
  }
});

describe('demoNext', () => {
  it('replays each card before its arrow and reaches an ok check for every level and seed 0-49', () => {
    for (const level of LEVELS) for (const seed of SEEDS.slice(0, 50)) {
      const s = stateFor(level, seed);
      const replayed = new Set<RecordId>();
      const recs = caseRecords(s.round.webCase);
      let finished = false;
      for (let step = 0; step < 20 && !finished; step++) {
        const t = demoNext(s, replayed)!;
        expect(t).not.toBeNull();
        if (t === 'show') {
          expect(check(s)).toEqual({ ok: true });
          finished = true;
        } else if ('card' in t) {
          replayed.add(t.card);
        } else {
          const rec = recs.find((r) => r.from === t.drag.from && r.to === t.drag.to)!;
          expect(rec).toBeDefined();
          expect(replayed.has(rec.id)).toBe(true);
          expect(['added', 'turned']).toContain(connect(s, t.drag.from, t.drag.to));
        }
      }
      expect(finished).toBe(true);
      expect(s.misses).toBe(0);
      expect(s.hints).toBe(0);
      expect(demoNext(s, replayed)).toBeNull();
    }
  });
});

describe('voice', () => {
  it('has every line the game speaks', async () => {
    const { SCRIPT } = await import('../../content/voice-script');
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
    const used = new Set([...src.matchAll(/'(web\.[a-z0-9.-]+|game\.food-web-workshop)'/g)].map((m) => m[1]));
    expect(used.size).toBeGreaterThan(20);
    for (const id of used) expect(SCRIPT, id).toHaveProperty([id]);
    for (const r of RECORDS) expect(SCRIPT).toHaveProperty([`web.card.${r.id}`]);
    for (const o of ORGANISMS) expect(SCRIPT).toHaveProperty([`web.name.${o}`]);
  });
});
