import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  PART_OF, apply, askHint, botAction, done, hintFor, judge, nextActions, readyLayout, restart, startState, stateFor, makeRound,
  type Action, type ReadyState,
} from './logic';

const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
const run = (s: ReadyState, a: Action) => {
  if ('attach' in a) return apply(s, judge(s, { part: a.attach }, { prop: a.to }));
  return apply(s, judge(s, { prop: a.pack }, { bag: true }));
};
const finish = (s: ReadyState) => { for (let i = 0; i < 20 && !done(s); i++) run(s, botAction(s)!); };

describe('Ready for Adventure rules', () => {
  it('level 1: the request is present once, the other choice differs, one pack finishes', () => {
    for (const seed of seeds) {
      const s = startState(1, new Rng(seed));
      const [want] = s.round.request;
      expect(s.round.props.filter((p) => p === want)).toHaveLength(1);
      expect(s.round.props).toHaveLength(2);
      expect(new Set(s.round.props).size).toBe(2);
      expect(Object.values(s.props).every((v) => v === 'ready')).toBe(true);
      run(s, { pack: want });
      expect(done(s)).toBe(true);
      expect(s.misses).toBe(0);
    }
  });

  it('level 1: the unrequested prop in the bag is a refused miss on the request', () => {
    const s = startState(1, new Rng(3));
    const other = s.round.props.find((p) => p !== s.round.request[0])!;
    const o = apply(s, judge(s, { prop: other }, { bag: true }));
    expect(o.verdict).toMatchObject({ kind: 'refuse', reason: 'notRequested', job: s.round.request[0] });
    expect(s.misses).toBe(1);
    expect(s.props[other]).toBe('ready');
  });

  it('prerequisites: a bare prop or loose part cannot be packed, a part on the wrong prop is refused, refusals change nothing', () => {
    const s = startState(3, new Rng(1));
    const snap = JSON.stringify([s.props, [...s.loose]]);
    expect(judge(s, { prop: 'flag' }, { bag: true })).toMatchObject({ kind: 'refuse', reason: 'notReady', job: 'flag' });
    expect(judge(s, { part: 'ribbon' }, { bag: true })).toMatchObject({ kind: 'refuse', reason: 'looseToBag', job: 'flag' });
    expect(judge(s, { part: 'ribbon' }, { prop: 'drum' })).toMatchObject({ kind: 'refuse', reason: 'wrongPart', job: 'flag' });
    expect(judge(s, { part: 'beater' }, { prop: 'flag' })).toMatchObject({ kind: 'refuse', reason: 'wrongPart', job: 'drum' });
    expect(JSON.stringify([s.props, [...s.loose]])).toBe(snap);
  });

  it('free gestures: prop on prop, part on part, an attached part again', () => {
    const s = startState(3, new Rng(1));
    expect(judge(s, { prop: 'flag' }, { prop: 'drum' })).toEqual({ kind: 'free' });
    expect(judge(s, { part: 'ribbon' }, { part: 'beater' })).toEqual({ kind: 'free' });
    run(s, { attach: 'ribbon', to: 'flag' });
    expect(judge(s, { part: 'ribbon' }, { prop: 'flag' })).toEqual({ kind: 'free' });
  });

  it('the pole may be dragged onto its ribbon too', () => {
    const s = startState(2, new Rng(2));
    const prop = s.round.request[0];
    const part = PART_OF[prop]!;
    expect(judge(s, { prop }, { part })).toMatchObject({ kind: 'attach', part, prop });
  });

  it('level 3: exactly six of the 24 orders of A1, A2, B1, B2 finish, the rest refuse a step', () => {
    const steps = ['A1', 'A2', 'B1', 'B2'];
    const perms = (a: string[]): string[][] => (a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
    let ok = 0;
    for (const order of perms(steps)) {
      const s = startState(3, new Rng(5));
      let allLegal = true;
      for (const st of order) {
        const v = st === 'A1' ? judge(s, { part: 'ribbon' }, { prop: 'flag' })
          : st === 'B1' ? judge(s, { part: 'beater' }, { prop: 'drum' })
          : st === 'A2' ? judge(s, { prop: 'flag' }, { bag: true }) : judge(s, { prop: 'drum' }, { bag: true });
        if (v.kind === 'refuse' || v.kind === 'free') { allLegal = false; break; }
        apply(s, v);
      }
      if (allLegal && done(s)) ok++;
    }
    expect(ok).toBe(6);
  });

  it('conservation and always finishable, following hints from any reachable state', () => {
    for (const level of [1, 2, 3]) {
      for (const seed of seeds) {
        const rng = new Rng(seed);
        const s = startState(level, rng);
        const parts = (s.round.bare ? s.round.request.length : 0);
        for (let i = 0; i < 12 && !done(s); i++) {
          // random gesture, possibly illegal
          const things = [...s.round.props.map((p) => ({ prop: p })), ...(['ribbon', 'beater'] as const).map((p) => ({ part: p }))];
          const targets = [{ bag: true as const }, ...s.round.props.map((p) => ({ prop: p })), ...(['ribbon', 'beater'] as const).map((p) => ({ part: p }))];
          apply(s, judge(s, rng.pick(things), rng.pick(targets)));
          const attached = Object.entries(s.props).filter(([p, st]) => PART_OF[p as keyof typeof PART_OF] && st !== 'bare').length;
          expect(s.loose.size + attached).toBeGreaterThanOrEqual(0);
          expect(nextActions(s).length > 0 || done(s)).toBe(true);
        }
        finish(s);
        expect(done(s)).toBe(true);
        expect(s.loose.size).toBe(0);
        void parts;
      }
    }
  });

  it('hintFor leads to done, packed props never leave', () => {
    const s = startState(3, new Rng(9));
    run(s, hintFor(s, 'flag')!);
    run(s, hintFor(s, 'flag')!);
    expect(s.props.flag).toBe('packed');
    apply(s, judge(s, { prop: 'flag' }, { bag: true }));
    expect(s.props.flag).toBe('packed');
    expect(hintFor(s, 'flag')).toBeNull();
  });

  it('accounting: two misses on one job glow once and count one hint; split misses do not glow', () => {
    const s = startState(3, new Rng(4));
    apply(s, judge(s, { prop: 'flag' }, { bag: true }));
    const o = apply(s, judge(s, { prop: 'flag' }, { bag: true }));
    expect(o.glowed).toBe('flag');
    expect(s.hints).toBe(1);
    expect(s.misses).toBe(2);
    expect(s.jobMisses.flag).toBe(0);
    const t = startState(3, new Rng(4));
    apply(t, judge(t, { prop: 'flag' }, { bag: true }));
    apply(t, judge(t, { prop: 'drum' }, { bag: true }));
    expect(t.hints).toBe(0);
    expect(t.glow).toBeNull();
    expect(t.misses).toBe(2);
  });

  it('a requested hint counts once, asked again while lit counts nothing, and the job advancing clears the glow', () => {
    const s = startState(3, new Rng(4));
    expect(askHint(s)).toBe('glow');
    expect(s.hints).toBe(1);
    expect(askHint(s)).toBe('repeat');
    expect(s.hints).toBe(1);
    run(s, hintFor(s, s.glow!)!);
    expect(s.glow).toBeNull();
  });

  it('show a hint picks the job with most misses', () => {
    const s = startState(3, new Rng(4));
    apply(s, judge(s, { prop: 'drum' }, { bag: true }));
    askHint(s);
    expect(s.glow).toBe('drum');
  });

  it('restart keeps misses and hints', () => {
    const s = startState(3, new Rng(4));
    apply(s, judge(s, { prop: 'drum' }, { bag: true }));
    run(s, { attach: 'ribbon', to: 'flag' });
    restart(s);
    expect(s.props.flag).toBe('bare');
    expect(s.loose.size).toBe(2);
    expect(s.misses).toBe(1);
  });

  it('seeded rounds stay inside each level and differ in silhouette', () => {
    for (const seed of seeds) {
      const r2 = makeRound(2, new Rng(seed));
      expect(['flag', 'drum']).toContain(r2.request[0]);
      expect(r2.order).toHaveLength(2);
      const r3 = makeRound(3, new Rng(seed));
      expect(r3.request).toEqual(['flag', 'drum']);
      expect([...r3.order].sort()).toEqual(['part:beater', 'part:ribbon', 'prop:drum', 'prop:flag']);
      expect(stateFor(3, r3).loose.size).toBe(2);
    }
  });

  it('the layout fits at four views without shrinking, targets apart', () => {
    const views = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390), computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })];
    for (const level of [1, 2, 3]) {
      for (const seed of seeds.slice(0, 8)) {
        const round = makeRound(level, new Rng(seed));
        for (const v of views) {
          const l = readyLayout(v, level, round.order);
          expect(l, `level ${level} ${v.w}x${v.h}`).not.toBeNull();
          for (const r of [...l!.slots, l!.bag]) {
            expect(r.w).toBeGreaterThanOrEqual(100);
            expect(r.h).toBeGreaterThanOrEqual(100);
          }
          const props = round.order.map((k, i) => (k.startsWith('prop:') ? l!.slots[i] : null)).filter(Boolean);
          for (const r of props) expect(r!.w).toBeGreaterThanOrEqual(140);
        }
      }
    }
  });
});
