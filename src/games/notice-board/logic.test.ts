import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import {
  answerFor, AUTHORED, BADGES, FRIENDS, glowFor, HOME_CORNER, isItemDecoy, LOOKALIKE, makeRound, noticeBoardLayout, PET_CORNER,
  PLACES, Play, POOL_1, POOL_2, POOL_3, posterById, type Item, type Rect, type Round,
} from './logic';

const SEEDS = 300;
const seeds = Array.from({ length: SEEDS }, (_, i) => i + 1);
const roundFor = (level: number, seed: number) => makeRound(level, new Rng(seed));
const lines = SCRIPT as Record<string, readonly string[]>;
const distinct = <T,>(xs: T[]) => new Set(xs).size === xs.length;

describe('pools and authored rounds', () => {
  it('has the pool sizes from the definition', () => {
    expect(POOL_1).toHaveLength(11);
    expect(POOL_1.filter((p) => p.about)).toHaveLength(3);
    expect(POOL_2).toHaveLength(7);
    expect(POOL_3.filter((p) => p.purpose === 'sell')).toHaveLength(6);
    expect(POOL_3.filter((p) => p.purpose === 'tell')).toHaveLength(6);
    const ids = [...POOL_1, ...POOL_2, ...POOL_3].map((p) => p.id);
    expect(distinct(ids)).toBe(true);
  });
  it('gives a price to exactly the sell posters', () => {
    for (const p of POOL_3) expect(p.price !== undefined, p.id).toBe(p.purpose === 'sell');
    for (const p of [...POOL_1, ...POOL_2]) expect(p.price, p.id).toBeUndefined();
    for (const p of POOL_3) if (p.price) expect([1, 2, 3]).toContain(p.price);
  });
  it('authored level 1 has the about-a-friend poster second', () => {
    const r = makeRound(1, new Rng(1), true);
    expect(r.items.map((i) => i.poster.id)).toEqual(AUTHORED[1]);
    expect(r.items[1].poster.about).toBe(true);
    expect(r.items[1].subject).toBeDefined();
    expect(r.items[1].subject).not.toBe(answerFor(r.items[1]).kind === 'friend' ? (answerFor(r.items[1]) as { i: number }).i : -1);
  });
  it('authored level 2 starts with a stretched poster and has both truths', () => {
    const r = makeRound(2, new Rng(1), true);
    expect(r.items[0].truth).toBe('stretched');
    expect(r.items.map((i) => i.truth)).toContain('true');
  });
  it('authored level 3 includes the apple-tree decoy', () => {
    const r = makeRound(3, new Rng(1), true);
    expect(r.items.map((i) => i.poster.id)).toContain('tell-tree');
    expect(isItemDecoy(posterById('tell-tree'))).toBe(true);
    expect(new Set(r.items.map((i) => i.poster.purpose))).toEqual(new Set(['tell', 'sell']));
  });
  it('authored rounds are the same whatever the seed', () => {
    for (const lv of [1, 2, 3]) {
      const a = makeRound(lv, new Rng(5), true).items.map((i) => i.poster.id);
      const b = makeRound(lv, new Rng(99), true).items.map((i) => i.poster.id);
      expect(a).toEqual(b);
    }
  });
});

describe('level 1 rounds', () => {
  it('holds the maker rules across seeds', () => {
    for (const s of seeds) {
      const r = roundFor(1, s);
      expect(r.items).toHaveLength(3);
      expect(distinct(r.items.map((i) => i.poster.id)), `seed ${s}`).toBe(true);
      for (const it of r.items) {
        expect(it.poster.level).toBe(1);
        expect(it.bench).toHaveLength(3);
        const badges = it.bench.map((f) => f.badge);
        expect(distinct(badges)).toBe(true);
        expect(badges.includes('star') && badges.includes('sun'), `seed ${s} radial`).toBe(false);
        expect(distinct(it.bench.map((f) => f.name))).toBe(true);
        expect(it.bench.filter((f) => f.badge === it.stamp)).toHaveLength(1);
        const a = answerFor(it);
        expect(a.kind).toBe('friend');
        if (a.kind === 'friend') expect(it.bench[a.i].badge).toBe(it.stamp);
      }
      const about = r.items.filter((i) => i.poster.about);
      expect(about.length, `seed ${s}`).toBeGreaterThanOrEqual(1);
      for (const it of about) {
        expect(it.subject).toBeGreaterThanOrEqual(0);
        expect(it.subject).toBeLessThan(3);
        expect(it.bench[it.subject!].name).not.toBe(it.maker);
      }
    }
  });
  it('is deterministic per seed', () => {
    for (const lv of [1, 2, 3]) for (const s of seeds.slice(0, 40)) expect(roundFor(lv, s)).toEqual(roundFor(lv, s));
  });
});

describe('level 2 rounds', () => {
  const witnessSlots = [0, 0, 0];
  it('holds the witness rules across seeds', () => {
    for (const s of seeds) {
      const r = roundFor(2, s);
      expect(r.items).toHaveLength(3);
      expect(distinct(r.items.map((i) => i.poster.topic)), `seed ${s}`).toBe(true);
      const truths = r.items.map((i) => i.truth);
      expect(truths).toContain('true');
      expect(truths).toContain('stretched');
      const slots = r.items.map((i) => i.witness!);
      expect(new Set(slots).size, `seed ${s}`).toBeGreaterThanOrEqual(2);
      for (const it of r.items) {
        witnessSlots[it.witness!]++;
        expect(it.bench).toHaveLength(3);
        const w = it.bench.filter((f) => f.memory === it.poster.place);
        expect(w, `seed ${s}`).toHaveLength(1);
        expect(it.bench[it.witness!].memory).toBe(it.poster.place);
        const others = it.bench.filter((_, i) => i !== it.witness);
        expect(others.filter((f) => f.memory === 'heard')).toHaveLength(1);
        const away = others.find((f) => f.memory !== 'heard')!.memory;
        expect(away).not.toBe(it.poster.place);
        expect(away).not.toBe(LOOKALIKE[it.poster.place]);
        expect(it.bench.map((f) => f.badge)).not.toContain(it.stamp);
        expect(distinct([it.maker, ...it.bench.map((f) => f.name)])).toBe(true);
        expect(answerFor(it)).toEqual({ kind: 'friend', i: it.witness });
      }
    }
    const total = witnessSlots.reduce((a, b) => a + b, 0);
    for (const n of witnessSlots) {
      expect(n / total).toBeGreaterThan(0.25);
      expect(n / total).toBeLessThan(0.42);
    }
  });
});

describe('level 3 rounds', () => {
  it('holds the purpose rules across seeds', () => {
    for (const s of seeds) {
      const r = roundFor(3, s);
      expect(r.items).toHaveLength(4);
      expect(distinct(r.items.map((i) => i.poster.id)), `seed ${s}`).toBe(true);
      const sells = r.items.filter((i) => i.poster.purpose === 'sell').length;
      expect(sells, `seed ${s}`).toBeGreaterThanOrEqual(1);
      expect(sells).toBeLessThanOrEqual(3);
      expect(4 - sells).toBeGreaterThanOrEqual(1);
      expect(4 - sells).toBeLessThanOrEqual(3);
      expect(r.items.some((i) => isItemDecoy(i.poster)), `seed ${s}`).toBe(true);
      for (const it of r.items) {
        expect(it.poster.level).toBe(3);
        expect(answerFor(it)).toEqual({ kind: 'basket', purpose: it.poster.purpose });
        expect(POOL_3.filter((p) => p.id === it.poster.id)).toHaveLength(1);
      }
    }
  });
});

describe('accounting', () => {
  const wrongFriend = (it: Item) => [0, 1, 2].find((i) => i !== (answerFor(it) as { i: number }).i)!;
  const rightFriend = (it: Item) => (answerFor(it) as { i: number }).i;
  const wrongBasket = (it: Item) => (it.poster.purpose === 'tell' ? 'sell' : 'tell') as 'tell' | 'sell';

  it('counts each wrong friend as one miss, repeats included, and never blocks the answer', () => {
    for (const lv of [1, 2]) {
      const p = new Play(roundFor(lv, 7));
      const w = wrongFriend(p.item);
      expect(p.tapFriend(w).kind).toBe('miss');
      expect(p.tapFriend(w).kind).toBe('miss');
      expect(p.misses).toBe(2);
      expect(p.tapFriend(rightFriend(p.item)).kind).toBe('right');
      expect(p.misses).toBe(2);
      expect(p.index).toBe(1);
    }
  });
  it('counts wrong baskets, and free taps count nothing', () => {
    const p = new Play(roundFor(3, 7));
    expect(p.tapFriend(0)).toEqual({ kind: 'free' });
    expect(p.tapFriend(2)).toEqual({ kind: 'free' });
    expect(p.misses).toBe(0);
    expect(p.tapBasket(wrongBasket(p.item)).kind).toBe('miss');
    expect(p.tapBasket(wrongBasket(p.item)).kind).toBe('miss');
    expect(p.misses).toBe(2);
    expect(p.tapBasket(p.item.poster.purpose).kind).toBe('right');
    const q = new Play(roundFor(1, 7));
    expect(q.tapBasket('tell')).toEqual({ kind: 'free' });
    expect(q.tapBasket('sell')).toEqual({ kind: 'free' });
    const q2 = new Play(roundFor(2, 7));
    expect(q2.tapBasket('sell')).toEqual({ kind: 'free' });
    expect(q2.misses + q2.hints + q.misses + q.hints).toBe(0);
  });
  it('two misses on a poster glow and count exactly one hint; the third miss adds none', () => {
    const p = new Play(roundFor(1, 3));
    const w = wrongFriend(p.item);
    expect((p.tapFriend(w) as { glow: boolean }).glow).toBe(false);
    expect(p.glowing).toBe(false);
    expect((p.tapFriend(w) as { glow: boolean }).glow).toBe(true);
    expect(p.glowing).toBe(true);
    expect(p.hints).toBe(1);
    expect((p.tapFriend(w) as { glow: boolean }).glow).toBe(false);
    expect(p.hints).toBe(1);
    expect(p.requestHint()).toBe(false);
    expect(p.hints).toBe(1);
  });
  it('Show me counts one hint and misses after it add none; Show me twice adds none', () => {
    const p = new Play(roundFor(3, 3));
    expect(p.requestHint()).toBe(true);
    expect(p.hints).toBe(1);
    expect(p.glowing).toBe(true);
    expect(p.requestHint()).toBe(false);
    p.tapBasket(wrongBasket(p.item));
    p.tapBasket(wrongBasket(p.item));
    expect(p.hints).toBe(1);
    expect(p.misses).toBe(2);
  });
  it('a right answer resets the glow and the hint for the next poster', () => {
    const p = new Play(roundFor(2, 11));
    p.requestHint();
    p.tapFriend(rightFriend(p.item));
    expect(p.glowing).toBe(false);
    expect(p.posterMisses).toBe(0);
    const w = wrongFriend(p.item);
    p.tapFriend(w);
    p.tapFriend(w);
    expect(p.glowing).toBe(true);
    expect(p.hints).toBe(2);
  });
  it('plays every level to the end and then ignores taps', () => {
    for (const lv of [1, 2, 3]) for (const s of seeds.slice(0, 60)) {
      const p = new Play(roundFor(lv, s));
      let last: ReturnType<Play['tapFriend']> | undefined;
      let guard = 0;
      while (!p.done && guard++ < 10) {
        const t = p.target()!;
        last = t.kind === 'friend' ? p.tapFriend(t.i) : p.tapBasket(t.purpose);
        expect(last.kind).toBe('right');
      }
      expect(p.done).toBe(true);
      expect((last as { done: boolean }).done).toBe(true);
      expect(p.misses + p.hints).toBe(0);
      expect(p.target()).toBeNull();
      expect(p.tapFriend(0)).toEqual({ kind: 'free' });
      expect(p.tapBasket('tell')).toEqual({ kind: 'free' });
      expect(p.requestHint()).toBe(false);
    }
  });
});

describe('hints lead somewhere', () => {
  it('glowFor is the maker, the witness or the right basket, and is not a wrong answer', () => {
    for (const lv of [1, 2, 3]) for (const s of seeds) {
      const r: Round = roundFor(lv, s);
      for (const it of r.items) {
        const g = glowFor(it);
        expect(g).toEqual(answerFor(it));
        if (lv === 1) expect(g).toEqual({ kind: 'friend', i: it.bench.findIndex((f) => f.name === it.maker) });
        if (lv === 2) expect(g).toEqual({ kind: 'friend', i: it.witness });
        if (lv === 3) expect(g).toEqual({ kind: 'basket', purpose: it.poster.purpose });
        const p = new Play({ level: lv, items: [it] });
        const out = g.kind === 'friend' ? p.tapFriend(g.i) : p.tapBasket(g.purpose);
        expect(out.kind).toBe('right');
      }
    }
  });
  it('Play.target follows the current poster', () => {
    const p = new Play(roundFor(1, 4));
    expect(p.target()).toEqual(glowFor(p.round.items[0]));
    const t = p.target()!;
    if (t.kind === 'friend') p.tapFriend(t.i);
    expect(p.target()).toEqual(glowFor(p.round.items[1]));
  });
});

describe('layout', () => {
  const views = [{ w: 1024, h: 768 }, { w: 1366, h: 1024 }, { w: 768, h: 1024 }, { w: 1024, h: 1366 }];
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const v of views) for (const lv of [1, 2, 3]) {
    it(`fits level ${lv} at ${v.w}x${v.h}`, () => {
      const l = noticeBoardLayout(v, lv);
      expect(l.friends).toHaveLength(3);
      expect(l.baskets).toHaveLength(lv === 3 ? 2 : 0);
      expect(!!l.photo).toBe(lv === 2);
      const named: [string, Rect][] = [['poster', l.poster], ...l.friends.map((r, i): [string, Rect] => [`friend${i}`, r]),
        ...l.baskets.map((r, i): [string, Rect] => [`basket${i}`, r])];
      if (l.photo) named.push(['photo', l.photo]);
      for (const [n, r] of named) {
        expect(r.w, n).toBeGreaterThanOrEqual(100);
        expect(r.h, n).toBeGreaterThanOrEqual(100);
        expect(r.x, n).toBeGreaterThanOrEqual(0);
        expect(r.y, n).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w, n).toBeLessThanOrEqual(v.w);
        expect(r.y + r.h, n).toBeLessThanOrEqual(v.h);
        expect(r.x < PET_CORNER && r.y + r.h > v.h - PET_CORNER, `${n} in pet corner`).toBe(false);
        expect(r.x < HOME_CORNER && r.y < HOME_CORNER, `${n} in home corner`).toBe(false);
      }
      named.forEach(([na, a], i) => named.forEach(([nb, b], j) => { if (i < j) expect(overlap(a, b), `${na}/${nb}`).toBe(false); }));
      if (l.photo && v.h > v.w) expect(l.photo.x).toBeGreaterThanOrEqual(l.poster.x + l.poster.w);
    });
  }
});

describe('voice', () => {
  const has = (id: string) => expect(lines[id], id).toBeDefined();
  it('has the lines every poster, badge and place needs', () => {
    for (const p of [...POOL_1, ...POOL_2, ...POOL_3]) has(`noticeboard.poster.${p.id}`);
    for (const p of POOL_1) has(`noticeboard.why.${p.id}`);
    for (const p of POOL_3) has(`noticeboard.want.${p.id}`);
    for (const p of POOL_2) { has(`noticeboard.stretched.${p.topic}`); has(`noticeboard.label.${p.topic}`); }
    for (const b of BADGES) has(`noticeboard.notme.${b}`);
    for (const pl of PLACES) has(`noticeboard.elsewhere.${pl}`);
    for (const k of ['instruct.1', 'instruct.2', 'instruct.3', 'heard', 'saw', 'true', 'tell', 'sell', 'hint', 'done']) has(`noticeboard.${k}`);
  });
  it('keeps the tone kind and never names a friend species', () => {
    const ids = Object.keys(lines).filter((k) => k.startsWith('noticeboard.'));
    expect(ids.length).toBeGreaterThan(50);
    const bad = /\b(wrong|fake|lie|lies|trick|scam)\b/i;
    const species = new RegExp(`\\b(${FRIENDS.join('|')})\\b`, 'i');
    for (const id of ids) for (const text of lines[id]) {
      expect(bad.test(text), `${id}: ${text}`).toBe(false);
      expect(species.test(text), `${id}: ${text}`).toBe(false);
    }
  });
});
