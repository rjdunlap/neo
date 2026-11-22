import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import {
  answerFor,
  AUTHORED,
  BADGES,
  FRIENDS,
  glowFor,
  HOME_CORNER,
  isItemDecoy,
  LOOKALIKE,
  makeRound,
  noticeBoardLayout,
  PET_CORNER,
  PLACES,
  Play,
  POOL_1,
  POOL_2,
  POOL_3,
  POOL_4,
  POOL_5,
  AUTHORED_SLOTS,
  LEFT_OUT,
  planFor,
  LEVELS,
  posterById,
  type Item,
  type Rect,
  type Round,
} from './logic';

const SEEDS = 300;
const seeds = Array.from({ length: SEEDS }, (_, i) => i + 1);
const roundFor = (level: number, seed: number) => makeRound(level, new Rng(seed));
const lines = SCRIPT as Record<string, readonly string[]>;
const distinct = <T>(xs: T[]) => new Set(xs).size === xs.length;

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
    expect(r.items[1].subject).not.toBe(
      answerFor(r.items[1]).kind === 'friend' ? (answerFor(r.items[1]) as { i: number }).i : -1,
    );
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
    for (const lv of [1, 2, 3])
      for (const s of seeds.slice(0, 40)) expect(roundFor(lv, s)).toEqual(roundFor(lv, s));
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
      expect(
        r.items.some((i) => isItemDecoy(i.poster)),
        `seed ${s}`,
      ).toBe(true);
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
    for (const lv of [1, 2, 3])
      for (const s of seeds.slice(0, 60)) {
        const p = new Play(roundFor(lv, s));
        let last: ReturnType<Play['tapFriend']> | undefined;
        let guard = 0;
        while (!p.done && guard++ < 10) {
          const t = p.target()!;
          last = p.tap(t);
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
    for (const lv of [1, 2, 3])
      for (const s of seeds) {
        const r: Round = roundFor(lv, s);
        for (const it of r.items) {
          const g = glowFor(it);
          expect(g).toEqual(answerFor(it));
          if (lv === 1)
            expect(g).toEqual({ kind: 'friend', i: it.bench.findIndex((f) => f.name === it.maker) });
          if (lv === 2) expect(g).toEqual({ kind: 'friend', i: it.witness });
          if (lv === 3) expect(g).toEqual({ kind: 'basket', purpose: it.poster.purpose });
          const p = new Play({ level: lv, items: [it] });
          const out = p.tap(g);
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
  const views = [
    { w: 1024, h: 768 },
    { w: 1366, h: 1024 },
    { w: 768, h: 1024 },
    { w: 1024, h: 1366 },
  ];
  const overlap = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const v of views)
    for (const lv of [1, 2, 3, 4, 5]) {
      it(`fits level ${lv} at ${v.w}x${v.h}`, () => {
        const l = noticeBoardLayout(v, lv);
        expect(l.friends).toHaveLength(3);
        expect(l.baskets).toHaveLength(lv === 3 ? 2 : 0);
        expect(!!l.photo).toBe(lv === 2 || lv >= 4);
        const named: [string, Rect][] = [
          ['poster', l.poster],
          ...l.friends.map((r, i): [string, Rect] => [`friend${i}`, r]),
          ...l.baskets.map((r, i): [string, Rect] => [`basket${i}`, r]),
        ];
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
        named.forEach(([na, a], i) =>
          named.forEach(([nb, b], j) => {
            if (i < j) expect(overlap(a, b), `${na}/${nb}`).toBe(false);
          }),
        );
        if (l.photo && v.h > v.w) expect(l.photo.x).toBeGreaterThanOrEqual(l.poster.x + l.poster.w);
      });
    }
});

describe('voice', () => {
  const has = (id: string) => expect(lines[id], id).toBeDefined();
  it('has the lines every poster, badge and place needs', () => {
    for (const p of [...POOL_1, ...POOL_2, ...POOL_3, ...POOL_4, ...POOL_5])
      has(`noticeboard.poster.${p.id}`);
    for (const k of LEFT_OUT) if (k !== 'price') has(`noticeboard.omit.${k}`);
    for (const p of POOL_4) if (p.omit === 'price') has(`noticeboard.omit.price${p.price}`);
    for (const p of POOL_5) {
      has(`noticeboard.club.${p.club}`);
      has(`noticeboard.tried.${p.club}`);
    }
    for (const p of POOL_1) has(`noticeboard.why.${p.id}`);
    for (const p of POOL_3) has(`noticeboard.want.${p.id}`);
    for (const p of POOL_2) {
      has(`noticeboard.stretched.${p.topic}`);
      has(`noticeboard.label.${p.topic}`);
    }
    for (const b of BADGES) has(`noticeboard.notme.${b}`);
    for (const pl of PLACES) has(`noticeboard.elsewhere.${pl}`);
    for (const k of [
      'instruct.1',
      'instruct.2',
      'instruct.3',
      'instruct.4',
      'instruct.5',
      'best',
      'already',
      'nothere',
      'gosee',
      'askother',
      'heard',
      'saw',
      'true',
      'tell',
      'sell',
      'hint',
      'done',
    ])
      has(`noticeboard.${k}`);
  });
  it('keeps the tone kind and never names a friend species', () => {
    const ids = Object.keys(lines).filter((k) => k.startsWith('noticeboard.'));
    expect(ids.length).toBeGreaterThan(50);
    const bad = /\b(wrong|fake|lie|lies|trick|scam)\b/i;
    const species = new RegExp(`\\b(${FRIENDS.join('|')})\\b`, 'i');
    for (const id of ids)
      for (const text of lines[id]) {
        expect(bad.test(text), `${id}: ${text}`).toBe(false);
        expect(species.test(text), `${id}: ${text}`).toBe(false);
      }
  });
});

// Levels 4 and 5 (docs/definitions/notice-board-4-5.md) -----------------------------------------------------------

/** Each slot holds the answer between 25% and 42% of all posters over the seeds, and every round uses at least two slots. */
function expectFairSlots(level: number, slotOf: (it: Item) => number) {
  const counts = [0, 0, 0];
  let total = 0;
  for (const s of seeds) {
    const used = new Set<number>();
    for (const it of roundFor(level, s).items) {
      const k = slotOf(it);
      counts[k]++;
      total++;
      used.add(k);
    }
    expect(used.size).toBeGreaterThanOrEqual(2);
  }
  for (const c of counts) {
    expect(c / total).toBeGreaterThanOrEqual(0.25);
    expect(c / total).toBeLessThanOrEqual(0.42);
  }
}

describe('levels 4 and 5: pools, plans and authored rounds', () => {
  it('has eight true level-4 posters, every left-out kind an answer, and no other list holding its own omit', () => {
    expect(POOL_4).toHaveLength(8);
    expect(new Set(POOL_4.map((p) => p.omit))).toEqual(new Set(LEFT_OUT));
    for (const p of POOL_4) {
      expect(p.others!.length).toBeGreaterThan(0);
      expect(p.others).not.toContain(p.omit);
      // A level-4 poster draws no shells: only the stand shows a price.
      expect(p.purpose).toBe('tell');
      if (p.omit === 'price') expect([2, 3]).toContain(p.price);
      else expect(p.price).toBeUndefined();
    }
  });
  it('has six level-5 club cases with distinct clubs', () => {
    expect(POOL_5).toHaveLength(6);
    expect(new Set(POOL_5.map((p) => p.club)).size).toBe(6);
  });
  it('school climbs 1 to 5 by the ordinary ladder; pre-K stays 1 to 2', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 5 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 2 });
    expect(planFor(4).mode).toBe('omit');
    expect(planFor(5).mode).toBe('club');
  });
  it('authored rounds: level 4 lemonade, pie, kites (three different kinds); level 5 tried-it in slots 2, 0, 1', () => {
    for (const s of [1, 7, 42]) {
      const r4 = makeRound(4, new Rng(s), true);
      expect(r4.items.map((it) => it.poster.id)).toEqual(AUTHORED[4]);
      expect(new Set(r4.items.map((it) => it.poster.omit)).size).toBe(3);
      expect(r4.items.map((it) => it.tags!.indexOf(it.poster.omit!))).toEqual([...AUTHORED_SLOTS[4]]);
      const r5 = makeRound(5, new Rng(s), true);
      expect(r5.items.map((it) => it.poster.id)).toEqual(AUTHORED[5]);
      expect(r5.items.map((it) => it.tried)).toEqual([2, 0, 1]);
    }
  });
});

describe('level 4 rounds', () => {
  it('deals three distinct posters, each with the tags {omit, thing, other}', () => {
    for (const s of seeds) {
      const r = roundFor(4, s);
      expect(r.level).toBe(4);
      expect(new Set(r.items.map((it) => it.poster.id)).size).toBe(3);
      for (const it of r.items) {
        const tags = it.tags!;
        expect(tags).toHaveLength(3);
        expect(new Set(tags).size).toBe(3);
        expect(tags).toContain(it.poster.omit);
        expect(tags).toContain('thing');
        const other = tags.find((t) => t !== 'thing' && t !== it.poster.omit)!;
        expect(it.poster.others).toContain(other);
        expect(it.bench).toHaveLength(0);
      }
    }
  });
  it('moves the left-out tag fairly between slots', () => {
    expectFairSlots(4, (it) => it.tags!.indexOf(it.poster.omit!));
  });
});

describe('level 5 rounds', () => {
  it('seats one seller, one tried-it and one heard-it friend with three distinct badges, never star with sun', () => {
    for (const s of seeds) {
      const r = roundFor(5, s);
      expect(new Set(r.items.map((it) => it.poster.id)).size).toBe(3);
      for (const it of r.items) {
        const mem = it.bench.map((f) => f.memory).sort();
        expect(mem).toEqual(['heard', 'sells', 'tried']);
        expect(it.bench[it.seller!].memory).toBe('sells');
        expect(it.bench[it.tried!].memory).toBe('tried');
        expect(it.maker).toBe(it.bench[it.seller!].name);
        // The door's badge is the seller's.
        expect(it.stamp).toBe(it.bench[it.seller!].badge);
        const badges = it.bench.map((f) => f.badge);
        expect(new Set(badges).size).toBe(3);
        expect(badges.includes('star') && badges.includes('sun')).toBe(false);
        expect(new Set(it.bench.map((f) => f.name)).size).toBe(3);
      }
    }
  });
  it('moves the tried-it friend fairly between slots', () => {
    expectFairSlots(5, (it) => it.tried!);
  });
});

describe('levels 4 and 5 accounting', () => {
  const r4 = () => makeRound(4, new Rng(3), true);
  const r5 = () => makeRound(5, new Rng(3), true);
  const wrongTags = (it: Item) => [0, 1, 2].filter((i) => it.tags![i] !== it.poster.omit);

  it('level 4: dimmed tags are free, then the thing tag and the other tag are one miss each', () => {
    const p = new Play(r4());
    const right = p.item.tags!.indexOf(p.item.poster.omit!);
    expect(p.tapTag(right)).toEqual({ kind: 'free' });
    expect(p.tapFriend(0)).toEqual({ kind: 'free' });
    expect(p.misses).toBe(0);
    expect(p.seeStand()).toBe(true);
    expect(p.seeStand()).toBe(false);
    const [a, b] = wrongTags(p.item);
    expect(p.tapTag(a).kind).toBe('miss');
    const second = p.tapTag(b);
    expect(second).toMatchObject({ kind: 'miss', glow: true });
    expect([p.misses, p.hints]).toEqual([2, 1]);
    expect(p.tapTag(right).kind).toBe('right');
    // The next poster's stand starts hidden again.
    expect(p.standOut).toBe(false);
  });

  it('level 5: a wrong friend before the door is free and opens it; after, one miss; a right pick before is right', () => {
    const p = new Play(r5());
    const it = p.item;
    const seller = it.seller!;
    const heard = [0, 1, 2].find((i) => i !== it.seller && i !== it.tried)!;
    expect(p.tapFriend(heard)).toEqual({ kind: 'peek', item: it });
    expect(p.doorOpen).toBe(true);
    expect(p.misses).toBe(0);
    expect(p.tapFriend(seller).kind).toBe('miss');
    expect(p.tapFriend(heard)).toMatchObject({ kind: 'miss', glow: true });
    expect([p.misses, p.hints]).toEqual([2, 1]);
    expect(p.tapFriend(it.tried!).kind).toBe('right');
    expect(p.doorOpen).toBe(false);
    // Right before the door: right at once.
    expect(p.tapFriend(p.item.tried!).kind).toBe('right');
    expect(p.misses).toBe(2);
  });

  it('level 5: opening the door is free, and a seller tapped after it is a miss', () => {
    const p = new Play(r5());
    expect(p.openDoor()).toBe(true);
    expect(p.openDoor()).toBe(false);
    expect(p.tapFriend(p.item.seller!).kind).toBe('miss');
  });

  it('plays both levels to the end through the glow target, after looking first', () => {
    for (const lv of [4, 5])
      for (const s of seeds.slice(0, 60)) {
        const p = new Play(roundFor(lv, s));
        let guard = 0;
        while (!p.done && guard++ < 10) {
          if (lv === 4) p.seeStand();
          else p.openDoor();
          expect(p.tap(p.target()!).kind).toBe('right');
        }
        expect(p.done).toBe(true);
        expect([p.misses, p.hints]).toEqual([0, 0]);
        expect(p.tapTag(0)).toEqual({ kind: 'free' });
        expect(p.tapFriend(0)).toEqual({ kind: 'free' });
      }
  });

  it('hints lead somewhere: glowFor is the left-out tag and the tried-it friend', () => {
    for (const s of seeds) {
      for (const it of roundFor(4, s).items) {
        const g = glowFor(it);
        expect(g.kind).toBe('tag');
        if (g.kind === 'tag') expect(it.tags![g.i]).toBe(it.poster.omit);
      }
      for (const it of roundFor(5, s).items) expect(glowFor(it)).toEqual({ kind: 'friend', i: it.tried });
    }
  });
});
