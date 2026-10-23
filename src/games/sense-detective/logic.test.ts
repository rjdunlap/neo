import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { check, deciding, exhibitLayout, HEARD, ITS, makeRound, observe, planFor, possible, SEEN, senseTouch, TOY_IDS, TOYS, type Observation, type Rect, type ToyId } from './logic';

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
    const r = { level: 2, shelf: ['bell', 'drum'] as ToyId[], hidden: 'drum' as ToyId, channels: ['view', 'sound'] as const };
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
          if ('investigate' in m) { if (rec.length === 0) expect(m.investigate).toBe('view'); rec.push(observe(r.hidden, m.investigate)); }
          else if ('select' in m) sel = m.select;
          else found = check(r.shelf, rec, sel!).kind === 'found';
        }
        expect(found).toBe(true);
        if (level === 2) expect(rec).toHaveLength(2);
      }
    }
  });
});

describe('Sense Detective: layout', () => {
  const views = { landscape: computeView(1024, 768), portrait: computeView(768, 1024), wide: computeView(1366, 1024), tall: computeView(820, 1180) };
  const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const [name, view] of Object.entries(views)) {
    for (const cards of [2, 3]) for (const channels of [1, 2]) {
      it(`fits ${cards} cards and ${channels} channel(s) in ${name}`, () => {
        const l = exhibitLayout(view, cards, channels);
        const all: Rect[] = [l.parcel, l.look, ...(l.listen ? [l.listen] : []), ...l.strip, ...l.shelf, l.check];
        all.forEach((r) => {
          expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w); expect(r.y + r.h).toBeLessThanOrEqual(view.h);
        });
        for (const r of [l.look, ...(l.listen ? [l.listen] : []), ...l.strip, ...l.shelf, l.check]) { expect(r.w).toBeGreaterThanOrEqual(100); expect(r.h).toBeGreaterThanOrEqual(100); }
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(hit(all[i], all[j]), `${i} ${j}`).toBe(false);
        // The pet's corner (bottom-left) and the home button (top-left) stay clear.
        const pet: Rect = { x: 0, y: view.h - 170, w: 160, h: 170 };
        const home: Rect = { x: 0, y: 0, w: 110, h: 110 };
        for (const r of all) { expect(hit(r, pet)).toBe(false); expect(hit(r, home)).toBe(false); }
      });
    }
  }
});
