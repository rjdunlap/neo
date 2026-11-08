import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { stepLevel } from '../../progress/difficulty';
import {
  CAPTION_ROWS,
  captionPaper,
  CAPTIONS,
  captionStatus,
  CASE_CHECK_R,
  CASE_SLOT,
  checkExhibit,
  chooseNewPaper,
  exhibitGlow,
  exhibitLayout,
  exhibitState,
  exhibitTargets,
  helpExhibit,
  isCase,
  isExhibit,
  makeExhibitRound,
  NEW_H,
  NEW_PAPER_IDS,
  NEW_W,
  QUESTION_H,
  QUESTION_IDS,
  QUESTION_W,
  ROW_CAPTIONS,
  setCaption,
  STRIP,
  THUMB,
  useful,
  usefulPaper,
  type CaptionId,
  type ExhibitRound,
  type NewPaperId,
} from './cases';
import { atticFinds } from './index';
import { petCorner, planFor, shellButtons, type Rect } from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: { w: number; h: number }) =>
  a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;
const COPIES: NewPaperId[] = ['poster-copy', 'fair-copy'];
const rounds = (n = 500) => Array.from({ length: n }, (_, i) => makeExhibitRound(new Rng(i + 1)));

describe('Attic Finds level 9 model', () => {
  it('shows exactly the supported caption in each row; the overclaim and the narrower one stay open', () => {
    for (const row of CAPTION_ROWS) {
      const { start, supported, unsupported } = ROW_CAPTIONS[row];
      expect(captionStatus(supported), row).toBe('shown');
      expect(captionStatus(start), row).toBe('unknown');
      expect(captionStatus(unsupported), row).toBe('unknown');
      for (const c of [start, supported, unsupported]) expect(CAPTIONS[c].row).toBe(row);
    }
    // The shop's advert is what the poster shows; what children felt is not.
    expect(captionPaper('shop-said')).toBe('poster');
    expect(captionPaper('hilltop-had')).toBe('list');
    expect(captionPaper('fair-cranked')).toBe('drawing');
  });

  it('finds a new paper useful only when some reading settles the question: never a copy, never the other house', () => {
    expect(useful('seaside-list', 'seaside')).toBe(true);
    expect(useful('hilltop-drawing', 'hilltop-crank')).toBe(true);
    expect(useful('seaside-list', 'hilltop-crank')).toBe(false);
    expect(useful('hilltop-drawing', 'seaside')).toBe(false);
    for (const q of QUESTION_IDS) for (const c of COPIES) expect(useful(c, q)).toBe(false);
  });
});

describe('Attic Finds level 9 Check', () => {
  const round = makeExhibitRound(new Rng(7), true);
  const choices = (row: number) => [
    ROW_CAPTIONS[round.rows[row]].start,
    ROW_CAPTIONS[round.rows[row]].supported,
    ROW_CAPTIONS[round.rows[row]].unsupported,
  ];

  it('is done exactly when every caption is shown and the paper is useful; empty with no paper; one miss otherwise', () => {
    for (const a of choices(0))
      for (const b of choices(1))
        for (const c of choices(2)) {
          for (const paper of [null, ...round.offered]) {
            const s = exhibitState(round);
            [a, b, c].forEach((cap, i) => expect(setCaption(s, i, cap)).toBe(true));
            chooseNewPaper(s, paper);
            const res = checkExhibit(s);
            const allShown = [a, b, c].every((x) => captionStatus(x) === 'shown');
            if (!paper) expect(res.result).toBe('empty');
            else if (allShown && useful(paper, round.question)) expect(res.result).toBe('done');
            else {
              expect(res.result).toBe('miss');
              expect(s.misses).toBe(1);
              // Captions stay where she put them; a paper that could not answer hops back.
              expect(s.captions).toEqual([a, b, c]);
              expect(s.chosen).toBe(useful(paper, round.question) ? paper : null);
              if (res.result === 'miss') {
                expect(res.rows.map((r) => r.row)).toEqual(
                  [a, b, c].flatMap((x, i) => (captionStatus(x) === 'shown' ? [] : [i])),
                );
                expect(res.paper).toBe(
                  useful(paper, round.question)
                    ? null
                    : COPIES.includes(paper)
                      ? 'attic-finds.why-copy'
                      : 'attic-finds.why-wrong-place',
                );
              }
            }
          }
        }
  });

  it('gives each unsupported caption its row reason', () => {
    const s = exhibitState(round);
    chooseNewPaper(s, usefulPaper(round));
    const res = checkExhibit(s);
    expect(res.result).toBe('miss');
    if (res.result !== 'miss') return;
    const why = {
      love: 'attic-finds.why-all-loved',
      cranking: 'attic-finds.why-hilltop-crank',
      homes: 'attic-finds.why-seaside',
    };
    for (const { row, reason } of res.rows) expect(reason).toBe(why[round.rows[row]]);
  });

  it('refuses a caption from another row and a paper not offered', () => {
    const s = exhibitState(round);
    const other = CAPTION_ROWS.find((r) => r !== round.rows[0])!;
    expect(setCaption(s, 0, ROW_CAPTIONS[other].supported)).toBe(false);
    const absent = NEW_PAPER_IDS.find((p) => !round.offered.includes(p))!;
    expect(chooseNewPaper(s, absent)).toBe(false);
  });
});

describe('Attic Finds level 9 rounds, help and registration', () => {
  it('offers the useful paper, the other house and one copy, with permutations; seeds repeat', () => {
    for (const [i, r] of rounds().entries()) {
      expect(r).toEqual(makeExhibitRound(new Rng(i + 1)));
      expect([...r.rows].sort()).toEqual([...CAPTION_ROWS].sort());
      for (const row of CAPTION_ROWS)
        expect([...r.strips[row]].sort()).toEqual(Object.values(ROW_CAPTIONS[row]).sort());
      expect(r.offered).toHaveLength(3);
      expect(r.offered.filter((p) => useful(p, r.question))).toHaveLength(1);
      expect(r.offered.filter((p) => COPIES.includes(p))).toHaveLength(1);
      expect(r.offered).toContain('seaside-list');
      expect(r.offered).toContain('hilltop-drawing');
      expect([...r.papers].sort()).toEqual(['drawing', 'list', 'poster']);
    }
    expect(new Set(rounds().map((r) => r.question)).size).toBe(2);
  });

  it('starts on the authored exhibit: the Seaside question, rows in table order', () => {
    const r = makeExhibitRound(new Rng(3), true);
    expect(r.question).toBe('seaside');
    expect(r.rows).toEqual(['love', 'cranking', 'homes']);
  });

  it('following the glow from any state reaches done, and help counts once', () => {
    for (const r of rounds(60)) {
      const s = exhibitState(r);
      chooseNewPaper(
        s,
        r.offered.find((p) => !useful(p, r.question))!,
      );
      checkExhibit(s);
      expect(s.glow).toBe(false);
      chooseNewPaper(
        s,
        r.offered.find((p) => !useful(p, r.question))!,
      );
      checkExhibit(s);
      expect([s.misses, s.hints, s.glow]).toEqual([2, 1, true]);
      expect(helpExhibit(s)).toBe(false);
      for (let guard = 0; guard < 8; guard++) {
        const g = exhibitGlow(s);
        if (!g) break;
        if (g.kind === 'caption') setCaption(s, g.row, g.answer);
        else chooseNewPaper(s, g.answer);
      }
      expect(checkExhibit(s).result).toBe('done');
      expect([s.misses, s.hints]).toEqual([2, 1]);
    }
  });

  it('never counts reading, changing captions, swapping papers or an empty Check', () => {
    const r: ExhibitRound = makeExhibitRound(new Rng(11));
    const s = exhibitState(r);
    for (const row of [0, 1, 2]) for (const c of r.strips[r.rows[row]] as CaptionId[]) setCaption(s, row, c);
    for (const p of r.offered) chooseNewPaper(s, p);
    chooseNewPaper(s, null);
    expect(checkExhibit(s).result).toBe('empty');
    expect([s.misses, s.hints]).toEqual([0, 0]);
  });

  it('adds level 9 to school only, stepping up from 8', () => {
    expect(planFor(9).mode).toBe('mend');
    expect(isExhibit(planFor(9)) && isCase(planFor(9))).toBe(true);
    expect(isExhibit(planFor(8))).toBe(false);
    expect(atticFinds.levels('school')).toEqual({ min: 2, max: 9, order: [2, 5, 6, 7, 8, 9] });
    expect(atticFinds.levels('prek')).toEqual({ min: 1, max: 5, order: [1, 2, 5] });
    expect(stepLevel(8, 1, atticFinds.levels('school'))).toBe(9);
    expect(atticFinds.describeLevel(9)).toMatch(/^Mend the exhibit/);
  });

  it('lays out thumbnails, captions, the open strip, the question row and Check as large, separate targets', () => {
    expect(
      Math.min(THUMB, STRIP, QUESTION_W, QUESTION_H, CASE_SLOT, NEW_W, NEW_H, 2 * CASE_CHECK_R),
    ).toBeGreaterThanOrEqual(100);
    for (const [name, v] of Object.entries(VIEWS)) {
      const L = exhibitLayout(v);
      expect(L, name).not.toBeNull();
      const ts = exhibitTargets(L!);
      for (const [i, a] of ts.entries()) {
        expect(inside(a.r, v), `${name} ${a.label} inside`).toBe(true);
        expect(overlap(a.r, petCorner(v)), `${name} ${a.label}/pet`).toBe(false);
        for (const b of shellButtons(v)) expect(overlap(a.r, b), `${name} ${a.label}/shell`).toBe(false);
        for (const b of ts.slice(i + 1))
          expect(overlap(a.r, b.r), `${name} ${a.label}/${b.label}`).toBe(false);
      }
    }
  });
});
