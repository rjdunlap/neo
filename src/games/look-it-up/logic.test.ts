import { describe, expect, it } from 'vitest';
import { computeView } from '../../engine/view';
import { Rng } from '../../engine/random';
import {
  ANIMALS,
  ANIMAL_IDS,
  AUTHORED,
  babyVisitorsOk,
  LEVELS,
  PAGE_ORDER,
  pageNumber,
  planFor,
  CHOICE,
  check,
  choicesFor,
  guideLayout,
  hintFor,
  lookTouch,
  makeRound,
  pictureOf,
  PICTURE_WORDS,
  ROW_H,
  TAB,
  acceptedFor,
  offeredFor,
  rightOf,
  says,
  SHARES,
  VisitTally,
  HELP_AFTER,
  type AnimalId,
  type Page,
  type Picture,
  type Rect,
  type Row,
} from './logic';

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
    for (const { fact } of allFacts)
      expect(fact.line).not.toMatch(/carrot|honey|bread|dirty|all bears|cold/i);
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
      for (const id of ANIMAL_IDS)
        by.set(ANIMALS[id].rows[r].picture, [...(by.get(ANIMALS[id].rows[r].picture) ?? []), id]);
      for (const [pic, ids] of by)
        if (ids.length > 1)
          expect([pic, ids.sort()]).toEqual(
            pic === 'grass' ? ['grass', ['cow', 'rabbit']] : ['pond', ['duck', 'frog']],
          );
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
      for (const row of ['eats', 'where'] as const)
        expect(new Set(r.tabs.map((t) => ANIMALS[t].rows[row].picture)).size).toBe(3);
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
      expect(hintFor(r, v, v.animal, true)).toEqual({ kind: 'choice', choice: pictureOf(v) });
      const r2 = makeRound(2, new Rng(seed));
      expect(hintFor(r2, r2.visits[0], r2.visits[0].animal, false).kind).toBe('choice');
    }
  });

  it('the bot plays a level to its end', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const r = makeRound(level, new Rng(9));
      let open: Page = r.open;
      let rowSeen = false;
      let visitor = 0;
      let touched = 0;
      let read = new Set<AnimalId>();
      for (let step = 0; step < 60; step++) {
        const m = lookTouch(r, { visitor, open, rowSeen, touched, read });
        if (!m) break;
        if ('label' in m) touched++;
        else if ('contents' in m) open = 'contents';
        else if ('line' in m) {
          open = m.line;
          rowSeen = false;
        } else if ('tab' in m) {
          open = m.tab;
          rowSeen = false;
        } else if ('row' in m) {
          rowSeen = true;
          if (open !== 'contents') read.add(open);
        } else if ('choice' in m) {
          expect(check(r, r.visits[visitor], m.choice).kind).toBe('right');
          // Level 6 reads both pages before the friend.
          if (level === 6) expect(read.size).toBe(2);
          visitor++;
          rowSeen = false;
          read = new Set();
        }
      }
      expect(level === 1 ? touched : visitor).toBe(3);
    }
  });
});

describe('Look It Up: layout', () => {
  const overlap = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    wide: computeView(1366, 1024),
    tall: computeView(820, 1180),
  };
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
      for (let i = 0; i < l.tabs.length; i++)
        for (let j = i + 1; j < l.tabs.length; j++) expect(overlap(l.tabs[i], l.tabs[j])).toBe(false);
      for (let i = 0; i < l.choices.length; i++)
        for (let j = i + 1; j < l.choices.length; j++)
          expect(overlap(l.choices[i], l.choices[j])).toBe(false);
      for (const c of l.choices) for (const t of l.tabs) expect(overlap(c, t)).toBe(false);
      for (const c of l.choices) expect(overlap(c, l.book)).toBe(false);
    });
  }
});

describe('Look It Up: the fixed book (levels 4 and 5)', () => {
  it('numbers the pages in the table order, cow first and the African penguin last', () => {
    expect(PAGE_ORDER).toEqual(['cow', 'pig', 'duck', 'rabbit', 'bear', 'frog', 'penguin']);
    expect(pageNumber('cow')).toBe(1);
    expect(pageNumber('penguin')).toBe(7);
    expect(LEVELS.school).toEqual({ min: 3, max: 6 });
    expect(planFor(4).mode).toBe('contents');
    expect(planFor(5).mode).toBe('baby');
    expect(planFor(6).mode).toBe('share');
  });

  it('level 4 opens on the contents page with distinct eats and where pictures, both rows asked, one right choice', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const r = makeRound(4, rng);
      expect(r.book).toBe('contents');
      expect(r.open).toBe('contents');
      expect(r.visits.map((v) => v.animal)).toEqual(r.tabs);
      for (const row of ['eats', 'where'] as const)
        expect(new Set(r.tabs.map((t) => ANIMALS[t].rows[row].picture)).size).toBe(3);
      expect(new Set(r.visits.map((v) => v.row))).toEqual(new Set(['eats', 'where']));
      for (const v of r.visits) {
        const basket = choicesFor(r, v, rng);
        expect(basket.filter((p) => check(r, v, p).kind === 'right')).toHaveLength(1);
        for (const p of basket) if (p !== pictureOf(v)) expect(check(r, v, p).kind).toBe('wrong');
      }
    }
  });

  it('level 5 never pairs duck with penguin, has at most one of piglet and duckling, and offers the three baby words', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const r = makeRound(5, rng);
      expect(r.open).toBe('contents');
      expect(new Set(r.tabs).size).toBe(3);
      expect(r.visits.every((v) => v.row === 'baby')).toBe(true);
      expect(r.tabs.includes('duck') && r.tabs.includes('penguin')).toBe(false);
      expect(r.tabs.filter((t) => t === 'pig' || t === 'duck').length).toBeLessThanOrEqual(1);
      const words = r.tabs.map((t) => PICTURE_WORDS[ANIMALS[t].rows.baby.picture]).sort();
      for (const v of r.visits) {
        const tags = choicesFor(r, v, rng);
        expect(tags.map((p) => PICTURE_WORDS[p as Picture]).sort()).toEqual(words);
        expect(tags.filter((p) => check(r, v, p).kind === 'right')).toHaveLength(1);
        expect(words).not.toContain('kitten');
      }
    }
    expect(babyVisitorsOk(['duck', 'penguin', 'cow'])).toBe(false);
    expect(babyVisitorsOk(['pig', 'duck', 'cow'])).toBe(false);
    expect(babyVisitorsOk(['rabbit', 'frog', 'bear'])).toBe(true);
  });

  it("the rabbit's tag says kit, though its caption also says kitten", () => {
    expect(PICTURE_WORDS[ANIMALS.rabbit.rows.baby.picture]).toBe('kit');
    expect(ANIMALS.rabbit.rows.baby.line).toMatch(/kitten, or kit/);
  });

  it('plays the authored first rounds from this page', () => {
    const four = makeRound(4, new Rng(1), true);
    expect(four.visits).toEqual([
      { animal: 'pig', row: 'where' },
      { animal: 'penguin', row: 'eats' },
      { animal: 'rabbit', row: 'where' },
    ]);
    expect(four.visits).toEqual(AUTHORED[4]);
    const five = makeRound(5, new Rng(1), true);
    expect(five.visits.map((v) => v.animal)).toEqual(['rabbit', 'frog', 'bear']);
    expect(five.open).toBe('contents');
    // The authored rounds keep the random rounds' rules.
    for (const row of ['eats', 'where'] as const)
      expect(new Set(four.tabs.map((t) => ANIMALS[t].rows[row].picture)).size).toBe(3);
    expect(babyVisitorsOk(five.tabs)).toBe(true);
  });

  it('hints lead Contents, the line, the row, then the choice', () => {
    for (const level of [4, 5]) {
      for (const seed of SEEDS.slice(0, 100)) {
        const r = makeRound(level, new Rng(seed));
        const v = r.visits[0];
        const other = ANIMAL_IDS.find((a) => a !== v.animal)!;
        expect(hintFor(r, v, other, false)).toEqual({ kind: 'contents' });
        expect(hintFor(r, v, 'contents', false)).toEqual({ kind: 'line', animal: v.animal });
        expect(hintFor(r, v, v.animal, false)).toEqual({ kind: 'row', row: v.row });
        expect(hintFor(r, v, v.animal, true)).toEqual({ kind: 'choice', choice: pictureOf(v) });
      }
    }
  });
});

describe('Look It Up: the contents page layout', () => {
  const overlap = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  it('fits the landscape phone: three lines on the left above the pet corner, four on the right', () => {
    const view = computeView(1662, 768);
    const l = guideLayout(view, 3, 3, true);
    expect(l.tabs).toHaveLength(1);
    expect(l.lines).toHaveLength(7);
    const left = l.lines.filter((x) => x.x === l.lines[0].x);
    expect(left).toHaveLength(3);
    for (const line of left) expect(line.y + line.h).toBeLessThan(view.h - 170);
    for (const line of l.lines) {
      expect(line.h).toBeGreaterThanOrEqual(100);
      expect(line.w).toBeGreaterThanOrEqual(100);
      expect(overlap(line, { x: 0, y: view.h - 170, w: 160, h: 170 })).toBe(false);
    }
    for (let i = 0; i < 7; i++)
      for (let j = i + 1; j < 7; j++) expect(overlap(l.lines[i], l.lines[j])).toBe(false);
    expect(overlap(l.book, { x: 0, y: view.h - 170, w: 160, h: 170 })).toBe(false);
    for (const c of l.choices) expect(overlap(c, l.book)).toBe(false);
  });

  it('keeps the page rows where levels 1–3 had them', () => {
    const view = computeView(1662, 768);
    expect(guideLayout(view, 3, 3, true).rows).toEqual(guideLayout(view, 3, 3).rows);
  });
});

describe('Look It Up: two pages together (level 6)', () => {
  const others = (id: AnimalId) => ANIMAL_IDS.filter((a) => a !== id);
  /** The definition's table: accepted and offered as wrong, written out so a caption edit fails here. */
  const TABLE: [AnimalId[], AnimalId[]][] = [
    [
      ['rabbit', 'bear'],
      ['frog', 'penguin'],
    ],
    [
      ['cow', 'bear'],
      ['frog', 'penguin'],
    ],
    [['pig'], ['cow', 'rabbit', 'penguin']],
    [['bear'], ['cow', 'rabbit', 'frog']],
    [['frog'], ['cow', 'rabbit', 'bear', 'penguin']],
    [['duck'], ['cow', 'rabbit', 'bear', 'penguin']],
  ];

  it('computes each question from the captions: the key is on the source page, and the sets match the table', () => {
    SHARES.forEach((q, i) => {
      expect(says(ANIMALS[q.source].rows[q.row].line, q.key), q.ask).toBe(true);
      expect(acceptedFor(q).sort()).toEqual([...TABLE[i][0]].sort());
      expect(offeredFor(q).sort()).toEqual([...TABLE[i][1]].sort());
      for (const id of [...offeredFor(q), ...q.never])
        expect(says(ANIMALS[id].rows[q.row].line, q.key)).toBe(false);
      // Accepted, offered and left out cover the other six animals exactly once.
      expect([...acceptedFor(q), ...offeredFor(q), ...q.never].sort()).toEqual(others(q.source).sort());
      expect(q.ask).not.toMatch(new RegExp(q.key, 'i'));
    });
  });

  it('matches whole words, with a plural allowed', () => {
    expect(says('Ducks live near ponds and lakes.', 'pond')).toBe(true);
    expect(says('Cows live in a grassy field.', 'grass')).toBe(false);
    expect(says('Frogs eat slugs, snails and bugs.', 'bugs')).toBe(true);
  });

  it('deals three different keys, the frog at most once, one accepted friend and two offered as wrong', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      const r = makeRound(6, rng);
      expect(r.open).toBe('contents');
      expect(r.book).toBe('contents');
      expect(r.visits).toHaveLength(3);
      const qs = r.visits.map((v) => SHARES[v.share!.q]);
      expect(new Set(qs.map((q) => q.key)).size).toBe(3);
      expect(qs.filter((q) => q.source === 'frog').length).toBeLessThanOrEqual(1);
      for (const v of r.visits) {
        const q = SHARES[v.share!.q];
        expect(v.animal).toBe(q.source);
        expect(v.row).toBe(q.row);
        expect(acceptedFor(q)).toContain(v.share!.friend);
        expect(v.share!.wrong).toHaveLength(2);
        expect(new Set(v.share!.wrong).size).toBe(2);
        for (const w of v.share!.wrong) expect(offeredFor(q)).toContain(w);
        const friends = choicesFor(r, v, rng);
        expect(friends.sort()).toEqual([v.share!.friend, ...v.share!.wrong].sort());
        expect(friends.filter((f) => check(r, v, f).kind === 'right')).toEqual([v.share!.friend]);
        for (const w of v.share!.wrong) expect(check(r, v, w)).toEqual({ kind: 'wrong', owner: w });
        expect(check(r, v, 'grass').kind).toBe('ignore');
      }
    }
  });

  it('plays the authored first round from the definition', () => {
    const r = makeRound(6, new Rng(1), true);
    expect(
      r.visits.map((v) => [v.animal, SHARES[v.share!.q].key, v.share!.friend, ...v.share!.wrong]),
    ).toEqual([
      ['cow', 'grass', 'rabbit', 'frog', 'penguin'],
      ['penguin', 'fish', 'bear', 'cow', 'frog'],
      ['duck', 'pond', 'frog', 'rabbit', 'bear'],
    ]);
    for (const v of r.visits) {
      const q = SHARES[v.share!.q];
      expect(acceptedFor(q)).toContain(v.share!.friend);
      for (const w of v.share!.wrong) expect(offeredFor(q)).toContain(w);
    }
    // The authored round is a copy: playing it never changes the table.
    r.visits[0].share!.wrong.pop();
    expect(AUTHORED[6][0].share!.wrong).toHaveLength(2);
  });

  it("hints walk the visitor's page and row, then the friend's page and row, then the friend", () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const r = makeRound(6, new Rng(seed));
      for (const v of r.visits) {
        const friend = v.share!.friend;
        const stranger = ANIMAL_IDS.find((a) => a !== v.animal && a !== friend)!;
        const none = new Set<AnimalId>();
        const own = new Set<AnimalId>([v.animal]);
        const both = new Set<AnimalId>([v.animal, friend]);
        expect(hintFor(r, v, 'contents', false, none)).toEqual({ kind: 'line', animal: v.animal });
        expect(hintFor(r, v, stranger, false, none)).toEqual({ kind: 'contents' });
        expect(hintFor(r, v, friend, false, none)).toEqual({ kind: 'contents' });
        expect(hintFor(r, v, v.animal, false, none)).toEqual({ kind: 'row', row: v.row });
        expect(hintFor(r, v, v.animal, true, own)).toEqual({ kind: 'contents' });
        expect(hintFor(r, v, 'contents', false, own)).toEqual({ kind: 'line', animal: friend });
        expect(hintFor(r, v, friend, false, own)).toEqual({ kind: 'row', row: v.row });
        // Both pages read: the friend, wherever the book is open.
        for (const open of ['contents', stranger, v.animal, friend] as Page[])
          expect(hintFor(r, v, open, false, both)).toEqual({ kind: 'choice', choice: friend });
        // Reading the friend's page first still sends her to the visitor's own page.
        expect(hintFor(r, v, friend, true, new Set([friend]))).toEqual({ kind: 'contents' });
        expect(rightOf(v)).toBe(friend);
      }
    }
  });

  it('a scripted visit counts two misses and one hint, then the pet finishes it', () => {
    const r = makeRound(6, new Rng(1), true);
    const v = r.visits[0];
    const [a, b] = v.share!.wrong;
    const t = new VisitTally();
    const steps = [t.wrong(a), t.wrong(a), t.wrong(b)];
    expect(steps.map((s) => s.firstGlow)).toEqual([false, true, false]);
    expect(t.hint()).toBe(false);
    expect(t.hint()).toBe(false);
    const last = t.wrong(a);
    expect([t.misses, t.hints]).toEqual([2, 1]);
    expect(t.attempts).toBe(HELP_AFTER);
    expect(last.help).toBe(true);
    expect(steps.some((s) => s.help)).toBe(false);
  });
});
