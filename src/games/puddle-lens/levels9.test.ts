import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { HOW_TO } from './howto';
import { VOICE } from './voice';
import {
  ANSWER_SIZE,
  CANDIDATES,
  CARD_SIZE,
  closingStop,
  corners,
  FILE_CASES,
  FILE_CASE_IDS,
  FILE_SAMPLES,
  FILE_SAMPLE_IDS,
  fileEvidenceAt,
  fileRoundFor,
  fileSeeLine,
  helpFor,
  judgeCase,
  lensLayout,
  LensTally,
  LEVELS,
  MIN_GROWNUP,
  MIN_LENS,
  planFor,
  ringBox,
  ringHits,
  SORT_SAMPLES,
  STOP_SIZE,
  STOPS,
  survivors,
  swimmerAt,
  WALL_SLIDES,
  type FileAnswer,
  type FileCardId,
  type FileCaseId,
  type Stop,
} from './logic';

const seeds = (n: number) => Array.from({ length: n }, (_, i) => i * 7919 + 1);
const views = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  'phone upright': computeView(390, 844),
};
/** The definition's case table: what stop 3 rules out, where the file closes, and the card that closes it. */
const TABLE: Record<FileCaseId, { out3: FileCardId[]; closes: Stop; right: FileCardId }> = {
  N1: { out3: ['bubble'], closes: 4, right: 'green-ball' },
  N2: { out3: ['swimmer', 'mud-speck'], closes: 3, right: 'bubble' },
  N3: { out3: ['onion-skin', 'swimmer'], closes: 3, right: 'cheek-cells' },
  N4: { out3: ['cheek-cells', 'mud-speck'], closes: 3, right: 'onion-skin' },
  N5: { out3: ['swimmer'], closes: 4, right: 'silt' },
  N6: { out3: ['bubble', 'green-ball'], closes: 3, right: 'swimmer' },
};
const answers = (id: FileCaseId): FileAnswer[] => [...FILE_CASES[id].candidates, 'cant-tell'];

describe('level 9 sample table', () => {
  it('every row shows nothing at stops 1–2, something by stop 4, and never less as the stop rises', () => {
    for (const id of FILE_SAMPLE_IDS) {
      const ev = FILE_SAMPLES[id].evidence;
      expect(ev.length).toBe(4);
      expect(ev[0]).toEqual([]);
      expect(ev[1]).toEqual([]);
      expect(ev[3].length).toBeGreaterThan(0);
      for (const e of ev[2]) expect(ev[3]).toContain(e);
    }
  });
  it('reused rows equal the built tables', () => {
    for (const id of ['swimmer', 'green-ball', 'silt', 'mud-speck', 'bubble'] as const) {
      expect(FILE_SAMPLES[id].evidence).toEqual(CANDIDATES[id].evidence);
      expect(FILE_SAMPLES[id].motion).toBe(CANDIDATES[id].motion);
    }
    for (const id of ['onion-skin', 'cheek-cells'] as const)
      expect(FILE_SAMPLES[id].evidence).toEqual(WALL_SLIDES[id].evidence);
    expect(fileEvidenceAt('sand-grain', SORT_SAMPLES.sand.deciding)).toEqual(SORT_SAMPLES.sand.evidence);
  });
  it('colour and motion are in no evidence set', () => {
    const allowed = ['edge', 'inside', 'hairs', 'empty', 'ragged', 'cracks', 'wall', 'soft-edge'];
    for (const id of FILE_SAMPLE_IDS)
      for (const stop of STOPS) for (const e of fileEvidenceAt(id, stop)) expect(allowed).toContain(e);
  });
});

describe('level 9 cases', () => {
  it('each case names its unknown among three different cards', () => {
    expect(FILE_CASE_IDS.length).toBe(6);
    expect(new Set(FILE_CASE_IDS.map((id) => FILE_CASES[id].unknown)).size).toBe(6);
    for (const id of FILE_CASE_IDS) {
      const c = FILE_CASES[id];
      expect(new Set(c.candidates).size).toBe(3);
      expect(c.candidates).toContain(c.unknown);
    }
  });
  it('survivors never grow with the stop, are all three at stops 1–2, and always keep the unknown', () => {
    for (const id of FILE_CASE_IDS) {
      const c = FILE_CASES[id];
      expect(survivors(c, 1).length).toBe(3);
      expect(survivors(c, 2).length).toBe(3);
      for (const stop of [2, 3, 4] as Stop[]) {
        const now = survivors(c, stop);
        expect(now).toContain(c.unknown);
        for (const s of now) expect(survivors(c, (stop - 1) as Stop)).toContain(s);
      }
    }
  });
  it('matches the definition: ruled out at stop 3, the closing stop, and the one card left there', () => {
    for (const id of FILE_CASE_IDS) {
      const c = FILE_CASES[id];
      const t = TABLE[id];
      const out3 = c.candidates.filter((s) => !survivors(c, 3).includes(s));
      expect([...out3].sort()).toEqual([...t.out3].sort());
      expect(closingStop(c)).toBe(t.closes);
      expect(survivors(c, t.closes)).toEqual([t.right]);
      expect(survivors(c, (t.closes - 1) as Stop).length).toBeGreaterThan(1);
      expect(c.unknown).toBe(t.right);
    }
  });
});

describe('level 9 judging', () => {
  it('below the close every standing card gets the same free line, and can’t tell yet is right for now there and only there', () => {
    for (const id of FILE_CASE_IDS) {
      const c = FILE_CASES[id];
      for (const stop of STOPS) {
        const standing = survivors(c, stop);
        const tell = judgeCase(c, stop, 'cant-tell');
        if (standing.length > 1) {
          expect(tell).toEqual({ result: 'free', line: 'lens.right-for-now' });
          for (const s of standing)
            expect(judgeCase(c, stop, s)).toEqual({ result: 'free', line: 'lens.could-be' });
        } else expect(tell).toEqual({ result: 'miss', line: 'lens.file.can-tell-now' });
      }
    }
  });
  it('a ruled-out card is a miss at any stop, with the line for what the view shows', () => {
    for (const id of FILE_CASE_IDS) {
      const c = FILE_CASES[id];
      for (const stop of STOPS)
        for (const s of c.candidates) {
          if (survivors(c, stop).includes(s)) continue;
          expect(judgeCase(c, stop, s)).toEqual({ result: 'miss', line: fileSeeLine(c.unknown, stop) });
        }
    }
  });
  it('only the unknown’s own card closes a file, and only from its closing stop', () => {
    for (const id of FILE_CASE_IDS) {
      const c = FILE_CASES[id];
      for (const stop of STOPS)
        for (const a of answers(id)) {
          const right = judgeCase(c, stop, a).result === 'right';
          expect(right).toBe(a === c.unknown && stop >= closingStop(c));
        }
      expect(judgeCase(c, 4, c.unknown).line).toBe(`lens.file.yes.${c.unknown}`);
    }
  });
  it('every line a verdict or a card can speak exists, and none names a banned word', () => {
    const lines = VOICE as Record<string, string[]>;
    for (const id of FILE_CASE_IDS) {
      const c = FILE_CASES[id];
      for (const s of c.candidates) expect(lines[`lens.file.card.${s}`]).toBeDefined();
      for (const stop of STOPS)
        for (const a of answers(id)) expect(lines[judgeCase(c, stop, a).line]).toBeDefined();
    }
    for (const [key, texts] of Object.entries(lines))
      if (key.startsWith('lens.file.'))
        for (const t of texts) expect(t).not.toMatch(/microbe|bacteri|germ|\bill|dirty|clean|magnif|\d/i);
  });
  it('the view line never says what the slide is', () => {
    // An empty middle outranks an edge, and a dot is said only where no evidence shows yet.
    expect(fileSeeLine('bubble', 3)).toBe('lens.look.empty');
    expect(fileSeeLine('silt', 3)).toBe('lens.file.see.only-dot');
    expect(fileSeeLine('silt', 4)).toBe('lens.look.ragged');
    expect(fileSeeLine('green-ball', 4)).toBe('lens.look.inside');
    expect(fileSeeLine('cheek-cells', 3)).toBe('lens.wall.see.soft');
    expect(fileSeeLine('onion-skin', 4)).toBe('lens.wall.see.wall');
  });
});

describe('level 9 rounds', () => {
  it('three files, no unknown twice, at least one that closes only at the closest stop, each with its three cards', () => {
    for (const seed of seeds(500)) {
      const files = fileRoundFor(new Rng(seed), false);
      expect(files.length).toBe(3);
      expect(new Set(files.map((f) => f.case.unknown)).size).toBe(3);
      expect(files.some((f) => closingStop(f.case) === 4)).toBe(true);
      for (const f of files) expect([...f.cards].sort()).toEqual([...f.case.candidates].sort());
    }
  });
  it('the card order varies, so the right card has no fixed place', () => {
    const places = new Set<number>();
    for (const seed of seeds(200))
      for (const f of fileRoundFor(new Rng(seed), false)) places.add(f.cards.indexOf(f.case.unknown));
    expect(places.size).toBe(3);
  });
  it('the unknown stays near the middle of the view, and a still one stays put', () => {
    for (const seed of seeds(100))
      for (const f of fileRoundFor(new Rng(seed), false)) {
        for (const t of [0, 3, 11, 47]) {
          const p = swimmerAt(f.path, t);
          expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(0.56);
          if (FILE_SAMPLES[f.case.unknown].motion === 'still') expect(p).toMatchObject(swimmerAt(f.path, 0));
        }
      }
  });
  it('the authored round follows its story: the bubble, the silt, the cheek cells', () => {
    const [bubble, silt, cheek] = fileRoundFor(new Rng(5), true).map((f) => f.case);
    expect([bubble.id, silt.id, cheek.id]).toEqual(['N2', 'N5', 'N3']);
    // The bubble: a swimmer is free at the hand lens, a miss at the microscope, and an air bubble closes the file.
    expect(judgeCase(bubble, 2, 'swimmer')).toEqual({ result: 'free', line: 'lens.could-be' });
    expect(judgeCase(bubble, 3, 'swimmer')).toEqual({ result: 'miss', line: 'lens.look.empty' });
    expect(judgeCase(bubble, 3, 'bubble')).toEqual({ result: 'right', line: 'lens.file.yes.bubble' });
    // The silt: only a dot at stop 3, so a swimmer is a miss, can't tell yet is right for now, and stop 4 closes it.
    expect(judgeCase(silt, 3, 'swimmer')).toEqual({ result: 'miss', line: 'lens.file.see.only-dot' });
    expect(judgeCase(silt, 3, 'cant-tell')).toEqual({ result: 'free', line: 'lens.right-for-now' });
    expect(judgeCase(silt, 3, 'green-ball')).toEqual({ result: 'free', line: 'lens.could-be' });
    expect(judgeCase(silt, 4, 'silt')).toEqual({ result: 'right', line: 'lens.file.yes.silt' });
    // The cheek cells: the hint turns to stop 3 and says the soft-edge line.
    expect(helpFor(9, { file: cheek })).toEqual({ do: 'turn', stop: 3 });
    expect(fileSeeLine(cheek.unknown, 3)).toBe('lens.wall.see.soft');
    expect(judgeCase(cheek, 3, 'cheek-cells').result).toBe('right');
  });
});

describe('level 9 help, tally and ladder', () => {
  it('Show a hint turns to each file’s closing stop', () => {
    for (const id of FILE_CASE_IDS)
      expect(helpFor(9, { file: FILE_CASES[id] })).toEqual({ do: 'turn', stop: closingStop(FILE_CASES[id]) });
    expect(helpFor(9, {})).toBeNull();
  });
  it('a scripted file (ruled-out card, hint, hint again, right card) counts one miss and one hint', () => {
    const c = FILE_CASES.N2;
    const tally = new LensTally();
    if (judgeCase(c, 3, 'swimmer').result === 'miss') tally.miss();
    tally.hint();
    tally.hint();
    expect(judgeCase(c, 3, 'bubble').result).toBe('right');
    expect([tally.misses, tally.hints, tally.glow]).toEqual([1, 1, false]);
  });
  it('a grown-up plays level 9, and no other band’s range moved', () => {
    expect(rangeFor(LEVELS, 'grownup').min).toBe(9);
    expect(LEVELS.school).toEqual({ min: 4, max: 8 });
    expect(planFor(9).level).toBe(9);
    expect(planFor(9).name).toMatch(/^Name the slide/);
    for (const part of [HOW_TO.steps, HOW_TO.finish]) {
      const lines = typeof part === 'string' ? [] : part;
      expect(lines.some((s) => typeof s !== 'string' && (s.from ?? 1) <= 9 && (s.to ?? 99) >= 9)).toBe(true);
    }
  });
});

describe('level 9 layout', () => {
  for (const [name, v] of Object.entries(views))
    it(name, () => {
      const l = lensLayout(v, 9);
      expect(l).not.toBeNull();
      if (!l) return;
      expect(l.answer).toBeNull();
      expect(l.stops.length).toBe(4);
      expect(l.choices.length).toBe(4);
      for (const s of l.stops) expect(Math.min(s.w, s.h)).toBeGreaterThanOrEqual(STOP_SIZE);
      for (const c of l.choices) {
        expect([CARD_SIZE, ANSWER_SIZE]).toContain(Math.min(c.w, c.h));
        expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(MIN_GROWNUP);
      }
      expect(l.lens.r * 2).toBeGreaterThanOrEqual(MIN_LENS);
      const rects = [...l.stops, ...l.choices, ...(l.paw ? [ringBox(l.paw)] : [])];
      for (const r of [...rects, ringBox(l.lens)]) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(v.w);
        expect(r.y + r.h).toBeLessThanOrEqual(v.h);
      }
      rects.forEach((a, i) =>
        rects.forEach((b, j) => {
          if (i < j)
            expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
        }),
      );
      for (const r of rects)
        for (const k of corners(v))
          expect(r.x < k.x + k.w && k.x < r.x + r.w && r.y < k.y + k.h && k.y < r.y + r.h).toBe(false);
      for (const k of corners(v)) expect(ringHits(l.lens, k)).toBe(false);
      for (const r of rects) expect(ringHits(l.lens, r)).toBe(false);
    });
  it('the cards are full-size answers wherever four fit, and never under four in the space of three', () => {
    for (const [name, v] of Object.entries(views)) {
      const l = lensLayout(v, 9)!;
      const size = l.choices[0].w;
      expect(size, name).toBeGreaterThanOrEqual(CARD_SIZE);
      // The lens is no smaller than level 8's for it.
      if (size === ANSWER_SIZE) expect(l.lens.r, name).toBeGreaterThanOrEqual(lensLayout(v, 8)!.lens.r);
    }
    expect(lensLayout(views.landscape, 9)!.choices[0].w).toBe(ANSWER_SIZE);
    expect(lensLayout(views.portrait, 9)!.choices[0].w).toBe(ANSWER_SIZE);
  });
});
