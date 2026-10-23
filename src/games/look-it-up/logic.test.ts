import { describe, expect, it } from 'vitest';
import { computeView } from '../../engine/view';
import { Rng } from '../../engine/random';
import { ANIMALS, ANIMAL_IDS, CHOICE, check, choicesFor, guideLayout, hintFor, lookTouch, makeRound, pictureOf, PICTURE_WORDS, ROW_H, TAB, type Rect, type Row } from './logic';

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const rows: Row[] = ['eats', 'where', 'baby'];
const allFacts = ANIMAL_IDS.flatMap((id) => rows.map((r) => ({ id, r, fact: ANIMALS[id].rows[r] })));

describe('Look It Up: the fact table', () => {
  it('has seven animals with three rows, each with a line, a picture word and two distinct sources', () => {
    expect(ANIMAL_IDS).toHaveLength(7);
    for (const { fact } of allFacts) {
      expect(fact.line.length).toBeGreaterThan(8);
      expect(PICTURE_WORDS[fact.picture]).toBeTruthy();
      expect(new Set(fact.sources).size).toBeGreaterThanOrEqual(2);
      for (const s of fact.sources) expect(s).toMatch(/^https:\/\//);
    }
  });

  it('keeps out the claims the sources do not support', () => {
    for (const { fact } of allFacts) expect(fact.line).not.toMatch(/carrot|honey|bread|dirty|all bears|cold/i);
  });

  it('asks eats and where in words that fit the answer', () => {
    for (const id of ANIMAL_IDS) {
      const a = ANIMALS[id];
      expect(a.rows.eats.ask).toMatch(/eat/);
      expect(a.rows.where.ask).toBeTruthy();
      if (a.rows.where.ask!.includes('live')) expect(a.rows.where.line).toMatch(/live/);
    }
  });

  it('shares pictures only between cow and rabbit (grass) and duck and frog (pond)', () => {
    for (const r of ['eats', 'where'] as const) {
      const by = new Map<string, string[]>();
      for (const id of ANIMAL_IDS) by.set(ANIMALS[id].rows[r].picture, [...(by.get(ANIMALS[id].rows[r].picture) ?? []), id]);
      for (const [pic, ids] of by) if (ids.length > 1) expect([pic, ids.sort()]).toEqual(pic === 'grass' ? ['grass', ['cow', 'rabbit']] : ['pond', ['duck', 'frog']]);
    }
  });
});

describe('Look It Up: rounds', () => {
  it('level 1 deals three distinct pages', () => {
    for (const seed of SEEDS) {
      const r = makeRound(1, new Rng(seed));
      expect(new Set(r.tabs).size).toBe(3);
      expect(r.visits).toHaveLength(0);
    }
  });

  it('level 2 has distinct foods on the tabs, a basket of exactly those, and a first turn to make', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const r = makeRound(2, rng);
      expect(new Set(r.tabs.map((t) => ANIMALS[t].rows.eats.picture)).size).toBe(3);
      expect(new Set(r.visits.map((v) => v.animal))).toEqual(new Set(r.tabs));
      expect(r.visits.every((v) => v.row === 'eats')).toBe(true);
      expect(r.open).not.toBe(r.visits[0].animal);
      for (const v of r.visits) {
        const basket = choicesFor(r, v, rng);
        expect([...basket].sort()).toEqual(r.tabs.map((t) => ANIMALS[t].rows.eats.picture).sort());
        expect(basket.filter((p) => check(r, v, p).kind === 'right')).toHaveLength(1);
        for (const p of basket) if (p !== pictureOf(v)) expect(check(r, v, p).kind).toBe('wrong');
      }
    }
  });

  it('level 3 keeps eats and where pictures distinct, asks both rows and has one right choice', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const r = makeRound(3, rng);
      for (const row of ['eats', 'where'] as const) expect(new Set(r.tabs.map((t) => ANIMALS[t].rows[row].picture)).size).toBe(3);
      expect(new Set(r.visits.map((v) => v.row))).toEqual(new Set(['eats', 'where']));
      for (const v of r.visits) {
        const basket = choicesFor(r, v, rng);
        expect(basket.every((p) => r.tabs.some((t) => ANIMALS[t].rows[v.row].picture === p))).toBe(true);
        expect(basket.filter((p) => check(r, v, p).kind === 'right')).toHaveLength(1);
      }
    }
  });

  it('a wrong choice names whose picture it is, and an empty drop is ignored', () => {
    const r = makeRound(2, new Rng(4));
    const v = r.visits[0];
    const other = r.tabs.find((t) => t !== v.animal)!;
    expect(check(r, v, ANIMALS[other].rows.eats.picture)).toEqual({ kind: 'wrong', owner: other });
    expect(check(r, v, null)).toEqual({ kind: 'ignore' });
  });
});

describe('Look It Up: hints', () => {
  it('lead the tab, then the row at level 3, then the choice', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const r = makeRound(3, new Rng(seed));
      const v = r.visits[0];
      const wrongPage = r.tabs.find((t) => t !== v.animal)!;
      expect(hintFor(r, v, wrongPage, false)).toEqual({ kind: 'tab', animal: v.animal });
      expect(hintFor(r, v, v.animal, false)).toEqual({ kind: 'row', row: v.row });
      expect(hintFor(r, v, v.animal, true)).toEqual({ kind: 'choice', picture: pictureOf(v) });
      const r2 = makeRound(2, new Rng(seed));
      expect(hintFor(r2, r2.visits[0], r2.visits[0].animal, false).kind).toBe('choice');
    }
  });

  it('the bot plays a level to its end', () => {
    for (const level of [1, 2, 3]) {
      const r = makeRound(level, new Rng(9));
      let open = r.open;
      let rowSeen = false;
      let visitor = 0;
      let touched = 0;
      for (let step = 0; step < 40; step++) {
        const m = lookTouch(r, { visitor, open, rowSeen, touched });
        if (!m) break;
        if ('label' in m) touched++;
        else if ('tab' in m) { open = m.tab; rowSeen = false; }
        else if ('row' in m) rowSeen = true;
        else { expect(check(r, r.visits[visitor], m.choice).kind).toBe('right'); visitor++; rowSeen = false; }
      }
      expect(level === 1 ? touched : visitor).toBe(3);
    }
  });
});

describe('Look It Up: layout', () => {
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const views = { landscape: computeView(1024, 768), portrait: computeView(768, 1024), wide: computeView(1366, 1024), tall: computeView(820, 1180) };
  for (const [name, view] of Object.entries(views)) {
    it(`fits ${name} with full-size targets and the pet corner clear`, () => {
      const l = guideLayout(view);
      expect(l.tabs.every((t) => t.w >= TAB && t.h >= TAB)).toBe(true);
      expect(l.rows.every((r) => r.h >= ROW_H)).toBe(true);
      expect(l.choices.every((c) => c.w >= CHOICE && c.h >= CHOICE)).toBe(true);
      expect(l.book.w).toBeGreaterThanOrEqual(380);
      const all = [...l.tabs, ...l.choices, l.book];
      for (const r of all) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(view.w);
        expect(r.y + r.h).toBeLessThanOrEqual(view.h);
        expect(overlap(r, { x: 0, y: view.h - 170, w: 160, h: 170 })).toBe(false);
        expect(overlap(r, { x: 0, y: 0, w: 110, h: 90 })).toBe(false);
      }
      for (let i = 0; i < l.tabs.length; i++) for (let j = i + 1; j < l.tabs.length; j++) expect(overlap(l.tabs[i], l.tabs[j])).toBe(false);
      for (let i = 0; i < l.choices.length; i++) for (let j = i + 1; j < l.choices.length; j++) expect(overlap(l.choices[i], l.choices[j])).toBe(false);
      for (const c of l.choices) for (const t of l.tabs) expect(overlap(c, t)).toBe(false);
      for (const c of l.choices) expect(overlap(c, l.book)).toBe(false);
    });
  }
});
