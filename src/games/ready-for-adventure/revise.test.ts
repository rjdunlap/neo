import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  PROP_ORDER,
  applyCheck,
  askReviseHint,
  botEdit,
  check,
  diff,
  edit,
  firstRound,
  hintFor,
  makeReviseRound,
  nextEdits,
  request,
  restartRevise,
  reviseLayout,
  reviseState,
  startRevise,
  type ReviseState,
} from './revise';
import { propPic } from './art';

const seeds = Array.from({ length: 200 }, (_, i) => i + 1);
const bags = Array.from({ length: 16 }, (_, m) => PROP_ORDER.filter((_, i) => m & (1 << i)));
const withBag = (s: ReviseState, bag: readonly string[]) => {
  s.bag = new Set(bag as never);
  return s;
};

/** Follow hints and Checks until the round is done; returns the number of edits made. */
const solve = (s: ReviseState) => {
  let edits = 0;
  for (let i = 0; i < 40; i++) {
    const e = botEdit(s);
    if (e) {
      edit(s, e);
      edits++;
      continue;
    }
    const o = applyCheck(s);
    if (o.kind === 'pass' && o.next === 'done') return edits;
  }
  throw new Error('did not finish');
};

describe('Ready for Adventure level 4 rules', () => {
  it('rounds: two different 1-3 prop requests, one or two edits apart, ball appears', () => {
    let ball = 0;
    const kinds = new Set<string>();
    for (const seed of seeds) {
      const r = makeReviseRound(new Rng(seed));
      const [a, b] = r.requests;
      kinds.add(r.change);
      for (const q of r.requests) {
        expect(q.length).toBeGreaterThanOrEqual(1);
        expect(q.length).toBeLessThanOrEqual(3);
        expect(new Set(q).size).toBe(q.length);
      }
      expect([...a].sort()).not.toEqual([...b].sort());
      const s = withBag(reviseState(r), a);
      s.phase = 2;
      const d = diff(s).distance;
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(2);
      expect([...r.order].sort()).toEqual([...PROP_ORDER].sort());
      if (a.includes('ball') || b.includes('ball')) ball++;
    }
    expect(ball).toBeGreaterThan(0);
    expect([...kinds].sort()).toEqual(['add', 'drop', 'swap']);
  });

  it('the authored first round is flag + drum, then flag + bell by swap', () => {
    const r = firstRound();
    expect(r.requests).toEqual([
      ['flag', 'drum'],
      ['flag', 'bell'],
    ]);
    expect(r.change).toBe('swap');
  });

  it('any bag reaches any request by free edits that commute and touch only their prop', () => {
    for (const seed of seeds.slice(0, 40)) {
      const r = makeReviseRound(new Rng(seed));
      for (const phase of [1, 2] as const) {
        for (const bag of bags) {
          const s = withBag(reviseState(r), bag);
          s.phase = phase;
          let steps = 0;
          while (diff(s).distance > 0 && steps++ < 8) {
            const e = nextEdits(s)[0];
            expect(edit(s, e)).toBe(true);
          }
          expect(diff(s).distance).toBe(0);
          expect(s.misses).toBe(0);
        }
      }
    }
    const s = reviseState(firstRound());
    edit(s, { pack: 'ball' });
    edit(s, { unpack: 'bell' });
    const t = reviseState(firstRound());
    edit(t, { unpack: 'bell' });
    edit(t, { pack: 'ball' });
    expect([...s.bag]).toEqual([...t.bag]);
    expect([...s.bag]).toEqual(['ball']);
  });

  it('check passes iff the bag equals the request as a set; empty is free; nothing changes', () => {
    for (const seed of seeds.slice(0, 40)) {
      const s = startRevise(new Rng(seed));
      for (const bag of bags) {
        withBag(s, bag);
        const before = JSON.stringify([[...s.bag], s.misses, s.hints, s.phase]);
        const r = check(s);
        expect(JSON.stringify([[...s.bag], s.misses, s.hints, s.phase])).toBe(before);
        const want = request(s);
        const same = bag.length === want.length && bag.every((p) => want.includes(p));
        if (bag.length === 0) expect(r.kind).toBe('empty');
        else if (same) expect(r.kind).toBe('pass');
        else {
          expect(r.kind).toBe('mismatch');
          const d = diff(s);
          if (r.kind === 'mismatch') expect(r.why === 'extra' ? d.surplus : d.missing).toContain(r.prop);
        }
      }
    }
  });

  it('phases: a phase 1 pass starts phase 2 with the bag untouched; a phase 2 pass is done', () => {
    for (const seed of seeds.slice(0, 40)) {
      const s = startRevise(new Rng(seed));
      withBag(s, request(s));
      const o = applyCheck(s);
      expect(o).toEqual({ kind: 'pass', next: 'change' });
      expect(s.phase).toBe(2);
      expect([...s.bag].sort()).toEqual([...s.round.requests[0]].sort());
      expect(nextEdits(s).length).toBeGreaterThan(0);
      withBag(s, request(s));
      expect(applyCheck(s)).toEqual({ kind: 'pass', next: 'done' });
    }
  });

  it('accounting: bad Check misses; two in a row glow and count a hint then reset; closer edits reset', () => {
    const s = reviseState(firstRound());
    expect(applyCheck(s)).toEqual({ kind: 'empty' });
    edit(s, { pack: 'ball' });
    const a = applyCheck(s);
    expect(a).toMatchObject({ kind: 'mismatch', prop: 'ball', why: 'extra', glowed: false });
    expect([s.misses, s.hints]).toEqual([1, 0]);
    const b = applyCheck(s);
    expect(b).toMatchObject({ glowed: true });
    expect([s.misses, s.hints, s.badChecks]).toEqual([2, 1, 0]);
    expect(s.glow).toEqual({ prop: 'ball', edit: 'unpack' });
    // An edit that gets closer resets the counter.
    applyCheck(s);
    expect(s.badChecks).toBe(1);
    edit(s, { unpack: 'ball' });
    expect(s.badChecks).toBe(0);
    expect(s.glow).toBeNull();
    // Free actions count nothing.
    const m = [s.misses, s.hints];
    edit(s, { pack: 'flag' });
    edit(s, { unpack: 'flag' });
    expect(askReviseHint(s)).toBe('glow');
    expect(askReviseHint(s)).toBe('repeat');
    expect([s.misses, s.hints]).toEqual([m[0], m[1] + 1]);
  });

  it('the Check counter does not carry into phase 2, and misses add across phases', () => {
    const s = reviseState(firstRound());
    withBag(s, ['flag', 'drum', 'ball']);
    applyCheck(s);
    expect(s.badChecks).toBe(1);
    edit(s, { unpack: 'ball' });
    applyCheck(s);
    expect(s.phase).toBe(2);
    expect(s.badChecks).toBe(0);
    applyCheck(s);
    expect(s.misses).toBe(2);
  });

  it('hints lead somewhere: surplus first, then missing, reaching done within distance edits', () => {
    for (const seed of seeds.slice(0, 40)) {
      for (const bag of bags) {
        const s = withBag(startRevise(new Rng(seed)), bag);
        const d = diff(s);
        const h = hintFor(s);
        if (d.distance === 0) expect(h).toBeNull();
        else if (d.surplus.length) expect(h).toEqual({ unpack: d.surplus[0] });
        else expect(h).toEqual({ pack: d.missing[0] });
        let n = 0;
        while (hintFor(s) && n < 10) {
          edit(s, hintFor(s)!);
          n++;
        }
        expect(n).toBe(d.distance);
        expect(diff(s).distance).toBe(0);
      }
      const s = startRevise(new Rng(seed));
      solve(s);
      expect(s.phase).toBe(2);
    }
  });

  it('start again returns to an empty phase 1, keeping misses and hints', () => {
    const s = reviseState(firstRound());
    edit(s, { pack: 'ball' });
    applyCheck(s);
    s.phase = 2;
    restartRevise(s);
    expect(s.phase).toBe(1);
    expect(s.bag.size).toBe(0);
    expect(s.misses).toBe(1);
  });

  it('the four props have different silhouettes', () => {
    const look = { flagShape: 0, ribbonPattern: 0, drumPattern: 0 };
    const sizes = PROP_ORDER.map((p) => {
      const b = propPic(p, true, look).getLocalBounds();
      return `${Math.round(b.width)}x${Math.round(b.height)}`;
    });
    expect(new Set(sizes).size).toBe(4);
  });

  it('the layout fits at four views, targets 100+ apart from each other and clear of corners', () => {
    const views = [
      computeView(1024, 768),
      computeView(768, 1024),
      computeView(844, 390),
      computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    ];
    for (const v of views) {
      const l = reviseLayout(v);
      expect(l, `${v.w}x${v.h}`).not.toBeNull();
      for (const r of [...l!.slots, ...l!.shelf, l!.bag, l!.check]) {
        expect(r.w).toBeGreaterThanOrEqual(100);
        expect(r.h).toBeGreaterThanOrEqual(100);
      }
      expect(l!.card.w).toBeGreaterThanOrEqual(260);
      expect(l!.card.h).toBeGreaterThanOrEqual(150);
      expect(l!.bag.w).toBeGreaterThanOrEqual(220);
      expect(l!.bag.h).toBeGreaterThanOrEqual(200);
      for (let i = 0; i < 4; i++) {
        expect(l!.slots[i].w).toBeGreaterThanOrEqual(140);
        for (let j = i + 1; j < 4; j++) {
          const a = l!.slots[i],
            b = l!.slots[j];
          const gx = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
          const gy = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
          expect(Math.max(gx, gy)).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});
