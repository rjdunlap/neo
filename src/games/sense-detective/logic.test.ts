import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  check,
  checkSense,
  checkSet,
  checkTell,
  deciding,
  distinguishing,
  exhibitLayout,
  HEARD,
  hintEdit,
  ITS,
  makeRound,
  narrowingFor,
  observe,
  planFor,
  possible,
  SEEN,
  senseTouch,
  setKey,
  setTouch,
  Tally,
  TOY_IDS,
  TOYS,
  tellTarget,
  tellTouch,
  type Channel,
  type Observation,
  type Rect,
  type Round,
  type TellAnswer,
  type ToyId,
} from './logic';

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);

describe('Sense Detective: the toy table', () => {
  it('gives each toy one view and one distinct sound; bell and drum share a view', () => {
    expect(new Set(TOY_IDS.map((t) => TOYS[t].sound)).size).toBe(3);
    expect(TOYS.bell.view).toBe('round');
    expect(TOYS.drum.view).toBe('round');
    expect(TOYS.rattle.view).toBe('handled');
  });

  it('has words for every observation', () => {
    for (const t of TOY_IDS) {
      expect(SEEN[TOYS[t].view]).toBeTruthy();
      expect(HEARD[TOYS[t].sound]).toBeTruthy();
      expect(ITS[TOYS[t].sound]).toBeTruthy();
    }
  });
});

describe('Sense Detective: the possible set', () => {
  it('is the whole shelf with nothing revealed, never grows, and keeps the hidden toy', () => {
    const shelf: ToyId[] = ['bell', 'rattle', 'drum'];
    expect(possible(shelf, [])).toEqual(shelf);
    for (const hidden of shelf) {
      const record: Observation[] = [];
      let size = shelf.length;
      for (const ch of ['view', 'sound'] as const) {
        record.push(observe(hidden, ch));
        const now = possible(shelf, record);
        expect(now.length).toBeLessThanOrEqual(size);
        expect(now).toContain(hidden);
        size = now.length;
      }
    }
  });
});

describe('Sense Detective: rounds', () => {
  for (const level of [1, 2]) {
    it(`level ${level}: the shelf is the plan's pair, the hidden toy is on it, every toy comes up, same seed same round`, () => {
      const plan = planFor(level);
      const seen = new Set<ToyId>();
      for (const s of SEEDS) {
        const r = makeRound(level, new Rng(s));
        expect([...r.shelf].sort()).toEqual([...plan.shelf].sort());
        expect(r.channels).toEqual(plan.channels);
        expect(r.shelf).toContain(r.hidden);
        seen.add(r.hidden);
        expect(makeRound(level, new Rng(s))).toEqual(r);
      }
      expect([...seen].sort()).toEqual([...plan.shelf].sort());
    });
  }

  it('level 1: a look alone leaves exactly the hidden toy', () => {
    for (const s of SEEDS) {
      const r = makeRound(1, new Rng(s));
      expect(possible(r.shelf, [observe(r.hidden, 'view')])).toEqual([r.hidden]);
    }
  });

  it('level 2: a look leaves both toys, a listen alone (or after a look) leaves the hidden one', () => {
    for (const s of SEEDS) {
      const r = makeRound(2, new Rng(s));
      expect(possible(r.shelf, [observe(r.hidden, 'view')])).toHaveLength(2);
      expect(possible(r.shelf, [observe(r.hidden, 'sound')])).toEqual([r.hidden]);
      expect(possible(r.shelf, [observe(r.hidden, 'view'), observe(r.hidden, 'sound')])).toEqual([r.hidden]);
      expect(r.channels.some((c) => possible(r.shelf, [observe(r.hidden, c)]).length === 1)).toBe(true);
    }
  });
});

describe('Sense Detective: checking', () => {
  it('a guess is not knowledge: the hidden toy with an empty record (level 1) or only a look (level 2) is not yet', () => {
    for (const s of SEEDS.slice(0, 100)) {
      const r1 = makeRound(1, new Rng(s));
      expect(check(r1.shelf, [], r1.hidden).kind).toBe('notyet');
      const r2 = makeRound(2, new Rng(s));
      expect(check(r2.shelf, [observe(r2.hidden, 'view')], r2.hidden).kind).toBe('notyet');
    }
  });

  it('two rounds with the same record give the same result for the same card', () => {
    const shelf: ToyId[] = ['bell', 'drum'];
    const record = [observe('bell', 'view')];
    expect(check(shelf, record, 'drum')).toEqual(check(shelf, [observe('drum', 'view')], 'drum'));
  });

  it('misses name the clue that rules the card out; found needs exactly one left', () => {
    const v = check(['bell', 'rattle'], [observe('rattle', 'view')], 'bell');
    expect(v.kind).toBe('miss');
    if (v.kind === 'miss') expect(v.ruledOut).toEqual({ channel: 'view', value: 'handled' });
    expect(check(['bell', 'rattle'], [observe('rattle', 'view')], 'rattle').kind).toBe('found');
    const nv = check(['bell', 'drum'], [observe('drum', 'view')], 'bell');
    expect(nv).toEqual({ kind: 'notyet', other: 'drum' });
  });

  it('the deciding investigation leaves one toy', () => {
    for (const level of [1, 2]) {
      for (const s of SEEDS.slice(0, 100)) {
        const r = makeRound(level, new Rng(s));
        const ch = deciding(r, [])!;
        expect(possible(r.shelf, [observe(r.hidden, ch)])).toEqual([r.hidden]);
      }
    }
  });

  it('a scripted level 2 round: not yet, miss, same check no new miss, then found', () => {
    const r = {
      level: 2,
      shelf: ['bell', 'drum'] as ToyId[],
      hidden: 'drum' as ToyId,
      channels: ['view', 'sound'] as const,
    };
    const rec: Observation[] = [observe('drum', 'view')];
    expect(check(r.shelf, rec, 'bell').kind).toBe('notyet');
    rec.push(observe('drum', 'sound'));
    expect(check(r.shelf, rec, 'bell').kind).toBe('miss');
    expect(check(r.shelf, rec, 'drum').kind).toBe('found');
  });

  it('the bot looks first, then listens when the look is not enough, then selects and checks', () => {
    for (const level of [1, 2]) {
      for (const s of SEEDS.slice(0, 60)) {
        const r = makeRound(level, new Rng(s));
        const rec: Observation[] = [];
        let sel: ToyId | null = null;
        let found = false;
        for (let i = 0; i < 8 && !found; i++) {
          const m = senseTouch(r, rec, sel);
          if ('investigate' in m) {
            if (rec.length === 0) expect(m.investigate).toBe('view');
            rec.push(observe(r.hidden, m.investigate));
          } else if ('select' in m) sel = m.select;
          else found = check(r.shelf, rec, sel!).kind === 'found';
        }
        expect(found).toBe(true);
        if (level === 2) expect(rec).toHaveLength(2);
      }
    }
  });
});

describe('Sense Detective: layout', () => {
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    wide: computeView(1366, 1024),
    tall: computeView(820, 1180),
  };
  const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const [name, view] of Object.entries(views)) {
    for (const cards of [2, 3])
      for (const channels of [1, 2])
        for (const tell of cards === 3 && channels === 1 ? [false, true] : [false]) {
          it(`fits ${cards} cards and ${channels} channel(s)${tell ? " with the can't-tell card and two clues" : ''} in ${name}`, () => {
            const l = exhibitLayout(view, cards, channels, tell, tell ? 2 : channels);
            expect(l.cantTell !== null).toBe(tell);
            if (tell) expect(l.strip.length).toBe(2);
            const all: Rect[] = [
              l.parcel,
              l.look,
              ...(l.listen ? [l.listen] : []),
              ...l.strip,
              ...l.shelf,
              l.check,
              ...(l.cantTell ? [l.cantTell] : []),
            ];
            all.forEach((r) => {
              expect(r.x).toBeGreaterThanOrEqual(0);
              expect(r.y).toBeGreaterThanOrEqual(0);
              expect(r.x + r.w).toBeLessThanOrEqual(view.w);
              expect(r.y + r.h).toBeLessThanOrEqual(view.h);
            });
            for (const r of [
              l.look,
              ...(l.listen ? [l.listen] : []),
              ...l.strip,
              ...l.shelf,
              l.check,
              ...(l.cantTell ? [l.cantTell] : []),
            ]) {
              expect(r.w).toBeGreaterThanOrEqual(100);
              expect(r.h).toBeGreaterThanOrEqual(100);
            }
            for (let i = 0; i < all.length; i++)
              for (let j = i + 1; j < all.length; j++) expect(hit(all[i], all[j]), `${i} ${j}`).toBe(false);
            // The pet's corner (bottom-left) and the home button (top-left) stay clear.
            const pet: Rect = { x: 0, y: view.h - 170, w: 160, h: 170 };
            const home: Rect = { x: 0, y: 0, w: 110, h: 110 };
            for (const r of all) {
              expect(hit(r, pet)).toBe(false);
              expect(hit(r, home)).toBe(false);
            }
          });
        }
  }
});

const permutations = <T>(xs: readonly T[]): T[][] =>
  xs.length <= 1
    ? [[...xs]]
    : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));
const subsets = <T>(xs: readonly T[]): T[][] =>
  xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((a) => [...a, x])], [[]]);
const records = (parcel: ToyId): Observation[][] => [
  [],
  [observe(parcel, 'view')],
  [observe(parcel, 'sound')],
  [observe(parcel, 'view'), observe(parcel, 'sound')],
];

describe('Sense Detective: levels 3-4 rounds', () => {
  it('level 3: two different parcels on a full shelf, one round at least, all variety occurs, same seed same round', () => {
    let rattleIn = 0;
    let twoRound = 0;
    const asParcel = new Set<ToyId>();
    for (const s of SEEDS) {
      const r = makeRound(3, new Rng(s));
      expect([...r.shelf].sort()).toEqual([...TOY_IDS].sort());
      expect(r.parcels).toHaveLength(2);
      expect(r.parcels[0]).not.toBe(r.parcels[1]);
      expect(r.hidden).toBe(r.parcels[0]);
      expect(r.channels).toEqual(['view']);
      expect(r.parcels.some((p) => TOYS[p].view === 'round')).toBe(true);
      for (const p of r.parcels) {
        expect(r.shelf).toContain(p);
        asParcel.add(p);
      }
      if (r.parcels.includes('rattle')) rattleIn++;
      if (r.parcels.every((p) => p !== 'rattle')) twoRound++;
      expect(makeRound(3, new Rng(s))).toEqual(r);
    }
    expect(rattleIn).toBeGreaterThan(0);
    expect(twoRound).toBeGreaterThan(0);
    expect([...asParcel].sort()).toEqual([...TOY_IDS].sort());
  });

  it('level 4: one parcel, bell or drum, a look leaves two, shelf is all three, same seed same round', () => {
    const seen = new Set<ToyId>();
    for (const s of SEEDS) {
      const r = makeRound(4, new Rng(s));
      expect([...r.shelf].sort()).toEqual([...TOY_IDS].sort());
      expect(r.parcels).toHaveLength(1);
      expect(['bell', 'drum']).toContain(r.parcels[0]);
      seen.add(r.parcels[0]);
      expect(r.channels).toEqual(['view', 'sound']);
      expect(possible(r.shelf, [observe(r.hidden, 'view')])).toHaveLength(2);
      expect(possible(r.shelf, [observe(r.hidden, 'view'), observe(r.hidden, 'sound')])).toEqual([r.hidden]);
      expect(makeRound(4, new Rng(s))).toEqual(r);
    }
    expect([...seen].sort()).toEqual(['bell', 'drum']);
  });

  it('the authored first rounds', () => {
    const a = makeRound(3, new Rng(7), true);
    expect(a.shelf).toEqual(['rattle', 'bell', 'drum']);
    expect(a.parcels).toEqual(['drum', 'rattle']);
    const b = makeRound(4, new Rng(7), true);
    expect(b.shelf).toEqual(['bell', 'rattle', 'drum']);
    expect(b.parcels).toEqual(['bell']);
    expect(makeRound(3, new Rng(1), true)).toEqual(makeRound(3, new Rng(99), true));
  });
});

describe('Sense Detective: checkSet', () => {
  it('matches the set definition for every shelf order, parcel, record and subset', () => {
    for (const shelf of permutations<ToyId>(TOY_IDS)) {
      for (const parcel of TOY_IDS) {
        for (const record of records(parcel)) {
          const left = possible(shelf, record);
          for (const sel of subsets(shelf)) {
            for (const narrowing of [false, true]) {
              const v = checkSet(shelf, record, sel, narrowing);
              if (sel.length === 0) {
                expect(v.kind).toBe('empty');
                continue;
              }
              if (record.length === 0) {
                expect(v.kind).toBe('look-first');
                continue;
              }
              const bad = sel.filter((t) => !left.includes(t));
              const same = bad.length === 0 && left.every((t) => sel.includes(t));
              if (bad.length > 0) {
                expect(v.kind).toBe('miss');
                if (v.kind === 'miss') {
                  expect(v.ruledOut.sort()).toEqual([...bad].sort());
                  expect(left).not.toContain(v.first);
                  expect(TOYS[v.first][v.obs.channel]).not.toBe(v.obs.value);
                  expect(record).toContainEqual(v.obs);
                }
              } else if (!same) {
                expect(v.kind).toBe('one-more');
                if (v.kind === 'one-more') {
                  expect(left).toContain(v.missing);
                  expect(sel).not.toContain(v.missing);
                }
              } else {
                expect(v.kind).toBe(narrowing ? 'so-far' : 'right');
                if (v.kind === 'so-far' || v.kind === 'right')
                  expect([...v.left].sort()).toEqual([...left].sort());
              }
            }
          }
        }
      }
    }
  });

  it('level 4 narrowing: the look gives so-far with two toys, the listen narrows to the parcel, the look set then misses', () => {
    for (const s of SEEDS.slice(0, 100)) {
      const r = makeRound(4, new Rng(s));
      const p = r.parcels[0];
      const look = [observe(p, 'view')];
      const both = [...look, observe(p, 'sound')];
      const lookSet = possible(r.shelf, look);
      expect(lookSet).toHaveLength(2);
      const so = checkSet(r.shelf, look, lookSet, true);
      expect(so.kind).toBe('so-far');
      expect(checkSet(r.shelf, both, [p], false).kind).toBe('right');
      expect(checkSet(r.shelf, both, lookSet, false).kind).toBe('miss');
    }
  });

  it('guesses are not knowledge: same record gives the same verdict whatever the parcel', () => {
    const shelf: ToyId[] = ['bell', 'rattle', 'drum'];
    const a = [observe('bell', 'view')];
    const b = [observe('drum', 'view')];
    for (const sel of subsets(shelf))
      for (const n of [false, true]) {
        expect(checkSet(shelf, a, sel, n)).toEqual(checkSet(shelf, b, sel, n));
      }
  });
});

describe('Sense Detective: hints and bot', () => {
  const diff = (shelf: readonly ToyId[], record: readonly Observation[], sel: readonly ToyId[]) => {
    const left = possible(shelf, record);
    return shelf.filter((t) => sel.includes(t) !== left.includes(t)).length;
  };

  it('every hint edit reduces the difference by one and repeating reaches right', () => {
    for (const shelf of permutations<ToyId>(TOY_IDS))
      for (const parcel of TOY_IDS)
        for (const record of records(parcel).slice(1)) {
          for (const start of subsets(shelf).filter((x) => x.length > 0)) {
            let sel = start;
            for (let guard = 0; guard < 6; guard++) {
              const d = diff(shelf, record, sel);
              const e = hintEdit(shelf, record, sel);
              if ('check' in e) {
                expect(d).toBe(0);
                break;
              }
              expect(d).toBeGreaterThan(0);
              sel = 'remove' in e ? sel.filter((t) => t !== e.remove) : [...sel, e.add];
              expect(diff(shelf, record, sel)).toBe(d - 1);
            }
            expect(checkSet(shelf, record, sel, false).kind).toBe('right');
          }
        }
  });

  it('accounting: level 3 authored round gives misses 1, hints 0', () => {
    const r = makeRound(3, new Rng(1), true);
    const t = new Tally();
    const submit = (pi: number, sel: ToyId[], record: Observation[]) => {
      const v = checkSet(r.shelf, record, sel, false);
      if (v.kind === 'miss') t.miss(setKey(pi, 0, sel, record));
      return v.kind;
    };
    let rec = [observe(r.parcels[0], 'view')];
    expect(submit(0, ['bell'], rec)).toBe('one-more');
    expect(submit(0, ['rattle', 'bell', 'drum'], rec)).toBe('miss');
    expect(submit(0, ['bell', 'drum'], rec)).toBe('right');
    t.nextParcel();
    rec = [observe(r.parcels[1], 'view')];
    expect(submit(1, ['rattle'], rec)).toBe('right');
    expect([t.misses, t.hints]).toEqual([1, 0]);
  });

  it('accounting: level 4 authored round gives misses 1, hints 0', () => {
    const r = makeRound(4, new Rng(1), true);
    const p = r.parcels[0];
    const t = new Tally();
    let rec = [observe(p, 'view')];
    let sel: ToyId[] = ['bell', 'rattle', 'drum'];
    let v = checkSet(r.shelf, rec, sel, true);
    expect(v.kind).toBe('miss');
    expect(t.miss(setKey(0, 0, sel, rec))).toBe(false);
    sel = ['bell', 'drum'];
    expect(checkSet(r.shelf, rec, sel, true).kind).toBe('so-far');
    rec = [...rec, observe(p, 'sound')];
    sel = ['bell'];
    v = checkSet(r.shelf, rec, sel, false);
    expect(v.kind).toBe('right');
    expect([t.misses, t.hints]).toEqual([1, 0]);
  });

  it('two misses on a parcel glow with one hint; a later hint adds nothing; unchanged resubmit counts nothing', () => {
    const rec = [observe('drum', 'view')];
    const t = new Tally();
    expect(t.miss(setKey(0, 0, ['rattle'], rec))).toBe(false);
    expect(t.miss(setKey(0, 0, ['rattle'], rec))).toBe(false);
    expect(t.misses).toBe(1);
    expect(t.miss(setKey(0, 0, ['rattle', 'bell'], rec))).toBe(true);
    expect([t.misses, t.hints]).toEqual([2, 1]);
    t.hint();
    expect(t.hints).toBe(1);
    expect(setKey(0, 0, ['bell', 'rattle'], rec)).toBe(setKey(0, 0, ['rattle', 'bell'], rec));
    t.nextParcel();
    expect(t.miss(setKey(1, 0, ['rattle'], rec))).toBe(false);
    expect([t.misses, t.hints]).toEqual([3, 1]);
  });

  it('the bot finishes every level 3/4 round on every parcel, investigating view before any check', () => {
    for (const level of [3, 4])
      for (const s of SEEDS.slice(0, 200)) {
        const r: Round = makeRound(level, new Rng(s), s % 2 === 0);
        for (const p of r.parcels) {
          let record: Observation[] = [];
          let sel: ToyId[] = [];
          let listenOpen = false;
          let narrowing = level === 4;
          let done = false;
          for (let step = 0; step < 20 && !done; step++) {
            const m = setTouch(r, record, sel, listenOpen);
            if ('investigate' in m) record = [...record, observe(p, m.investigate)];
            else if ('toggle' in m)
              sel = sel.includes(m.toggle) ? sel.filter((t) => t !== m.toggle) : [...sel, m.toggle];
            else {
              expect(record.some((o) => o.channel === 'view')).toBe(true);
              const v = checkSet(r.shelf, record, sel, narrowing);
              expect(v.kind).not.toBe('miss');
              if (v.kind === 'so-far') {
                listenOpen = true;
                narrowing = false;
              } else if (v.kind === 'right') {
                expect(sel).toContain(p);
                done = true;
              } else throw new Error(`bot reached ${v.kind}`);
            }
          }
          expect(done).toBe(true);
        }
      }
  });
});

describe('Sense Detective: level 4 needs the listen', () => {
  it('a Check after so far but before the listen is still so far, never right', () => {
    const r = makeRound(4, new Rng(1), true);
    const look = [observe(r.hidden, 'view')];
    expect(narrowingFor(r, look)).toBe(true);
    expect(checkSet(r.shelf, look, possible(r.shelf, look), narrowingFor(r, look)).kind).toBe('so-far');
    const both = [...look, observe(r.hidden, 'sound')];
    expect(narrowingFor(r, both)).toBe(false);
    expect(checkSet(r.shelf, both, [r.hidden], narrowingFor(r, both)).kind).toBe('right');
    expect(narrowingFor(makeRound(3, new Rng(1), true), look)).toBe(false);
  });
});

describe('Sense Detective: level 5, can we tell?', () => {
  it('two different parcels on a full shelf, one round at least, rattle and two-toy rounds both occur, authored first round', () => {
    let oneToy = 0;
    let twoToy = 0;
    const seen = new Set<ToyId>();
    for (const s of SEEDS) {
      const r = makeRound(5, new Rng(s));
      expect([...r.shelf].sort()).toEqual([...TOY_IDS].sort());
      expect(r.parcels.length).toBe(2);
      expect(r.parcels[0]).not.toBe(r.parcels[1]);
      expect(r.parcels.some((p) => TOYS[p].view === 'round')).toBe(true);
      expect(r.channels).toEqual(['view']);
      for (const p of r.parcels) {
        seen.add(p);
        if (possible(r.shelf, [observe(p, 'view')]).length === 1) oneToy++;
        else twoToy++;
      }
      expect(makeRound(5, new Rng(s))).toEqual(r);
    }
    expect(oneToy).toBeGreaterThan(0);
    expect(twoToy).toBeGreaterThan(0);
    expect(seen.size).toBe(3);
    const a = makeRound(5, new Rng(1), true);
    expect([a.shelf, a.parcels]).toEqual([
      ['drum', 'bell', 'rattle'],
      ['drum', 'rattle'],
    ]);
    expect(planFor(5).name).toBe('Can we tell?');
  });

  it("the tell verdict: a round parcel allows only can't tell; a rattle parcel only the rattle", () => {
    for (const shelf of permutations(TOY_IDS))
      for (const p of TOY_IDS) {
        const rec = [observe(p, 'view')];
        const v = (a: TellAnswer) => checkTell(shelf, rec, a).kind;
        if (TOYS[p].view === 'round') {
          expect(v('cant-tell')).toBe('cant-tell');
          expect(v('bell')).toBe('both-fit');
          expect(v('drum')).toBe('both-fit');
          expect(v('rattle')).toBe('miss');
        } else {
          expect(v('rattle')).toBe('right');
          expect(v('cant-tell')).toBe('can-tell');
          expect(v('bell')).toBe('miss');
          expect(v('drum')).toBe('miss');
        }
        expect(checkTell(shelf, [], 'bell').kind).toBe('look-first');
        expect(checkTell(shelf, rec, null).kind).toBe('empty');
      }
    const m = checkTell(TOY_IDS, [observe('drum', 'view')], 'rattle');
    expect(m.kind === 'miss' && TOYS.rattle[m.obs.channel] !== m.obs.value).toBe(true);
    const b = checkTell(TOY_IDS, [observe('bell', 'view')], 'bell');
    expect(b.kind === 'both-fit' && b.other).toBe('drum');
  });

  it('guesses are not knowledge: the bell and drum parcels give the same verdict for every answer', () => {
    for (const a of [...TOY_IDS, 'cant-tell'] as TellAnswer[]) {
      expect(checkTell(TOY_IDS, [observe('bell', 'view')], a)).toEqual(
        checkTell(TOY_IDS, [observe('drum', 'view')], a),
      );
    }
  });

  it('listening always tells two possible toys apart, and hearing the parcel leaves exactly it', () => {
    for (const shelf of permutations(TOY_IDS))
      for (const p of TOY_IDS) {
        const rec = [observe(p, 'view')];
        const left = possible(shelf, rec);
        if (left.length === 1) {
          expect(distinguishing(shelf, rec)).toBeNull();
          continue;
        }
        expect(distinguishing(shelf, rec)).toBe('sound');
        expect(checkSense(shelf, rec, 'sound')).toBe('right');
        expect(checkSense(shelf, rec, 'view')).toBe('miss');
        expect(checkSense(shelf, rec, null)).toBe('empty');
        expect(possible(shelf, [...rec, observe(p, 'sound')])).toEqual([p]);
      }
    expect(distinguishing(TOY_IDS, [])).toBe('sound');
  });

  it('the hint target is the right answer in each stage', () => {
    for (const p of TOY_IDS) {
      const rec = [observe(p, 'view')];
      const t = tellTarget(TOY_IDS, rec, 'answer');
      const v = checkTell(TOY_IDS, rec, t as TellAnswer).kind;
      expect(['right', 'cant-tell']).toContain(v);
      if (v === 'cant-tell')
        expect(checkSense(TOY_IDS, rec, tellTarget(TOY_IDS, rec, 'sense') as Channel)).toBe('right');
    }
  });

  it('accounting: the authored level 5 round gives misses 2, hints 0 (one miss per parcel, no glow)', () => {
    const r = makeRound(5, new Rng(1), true);
    const t = new Tally();
    let rec = [observe(r.parcels[0], 'view')];
    expect(checkTell(r.shelf, rec, 'bell').kind).toBe('both-fit');
    expect(checkTell(r.shelf, rec, 'cant-tell').kind).toBe('cant-tell');
    expect(checkSense(r.shelf, rec, 'view')).toBe('miss');
    expect(t.miss(setKey(0, 1, ['view'], rec))).toBe(false);
    expect(checkSense(r.shelf, rec, 'sound')).toBe('right');
    t.nextParcel();
    rec = [observe(r.parcels[1], 'view')];
    expect(checkTell(r.shelf, rec, 'cant-tell').kind).toBe('can-tell');
    expect(t.miss(setKey(1, 0, ['cant-tell'], rec))).toBe(false);
    expect(checkTell(r.shelf, rec, 'rattle').kind).toBe('right');
    expect([t.misses, t.hints]).toEqual([2, 0]);
  });

  it('the bot finishes every level 5 parcel with no miss, looking before any check', () => {
    for (const s of SEEDS.slice(0, 200)) {
      const r = makeRound(5, new Rng(s), s % 2 === 0);
      for (const p of r.parcels) {
        let record: Observation[] = [];
        let stage: 'answer' | 'sense' = 'answer';
        let chosen: TellAnswer | Channel | null = null;
        let done = false;
        for (let step = 0; step < 12 && !done; step++) {
          const m = tellTouch(r, record, stage, chosen);
          if ('investigate' in m) record = [...record, observe(p, m.investigate)];
          else if ('choose' in m) chosen = m.choose;
          else {
            expect(record.some((o) => o.channel === 'view')).toBe(true);
            if (stage === 'answer') {
              const v = checkTell(r.shelf, record, chosen as TellAnswer);
              if (v.kind === 'right') {
                expect(v.toy).toBe(p);
                done = true;
              } else if (v.kind === 'cant-tell') {
                stage = 'sense';
                chosen = null;
              } else throw new Error(`bot reached ${v.kind}`);
            } else {
              expect(checkSense(r.shelf, record, chosen as Channel)).toBe('right');
              expect(possible(r.shelf, [...record, observe(p, 'sound')])).toEqual([p]);
              done = true;
            }
          }
        }
        expect(done).toBe(true);
      }
    }
  });
});
