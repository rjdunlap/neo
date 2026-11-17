import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { HOW_TO } from './howto';
import { VOICE } from './voice';
import {
  CARD_SIZE,
  caseSeeLine,
  closingStop,
  FILE_CASE_IDS,
  FILE_CASES,
  FILE_SAMPLES,
  fileEvidenceAt,
  helpFor,
  isOpenCase,
  JIGGLE_MAX,
  jiggleAt,
  judgeCase,
  lensLayout,
  LensTally,
  LEVELS,
  MAX_ART_SCALE,
  MAX_SPEED,
  OPEN_CASE_IDS,
  openRoundFor,
  planFor,
  PLANS,
  rightClose,
  STOPS,
  survivors,
  swimmerAt,
  swimmerSpeed,
  unknownEvidenceAt,
  unknownMotion,
  WALL_SLIDES,
  type FileAnswer,
  type FileCardId,
  type OpenCaseId,
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
/** The definition's case table: what stop 3 rules out, and what closes the file at stop 4. */
const TABLE: Record<OpenCaseId, { out3: FileCardId[]; right: FileAnswer }> = {
  O1: { out3: ['bubble'], right: 'cant-tell' },
  O2: { out3: ['swimmer'], right: 'cant-tell' },
  O3: { out3: ['cheek-cells'], right: 'cork' },
  O4: { out3: ['cheek-cells'], right: 'onion-skin' },
  O5: { out3: [], right: 'green-ball' },
};
const answers = (id: OpenCaseId): FileAnswer[] => [...FILE_CASES[id].candidates, 'cant-tell'];

describe('level 11 sample rows', () => {
  it('the two tiny rows are the same in evidence and motion, and the open unknown shows exactly what they show', () => {
    expect(FILE_SAMPLES['tiny-living'].evidence).toEqual(FILE_SAMPLES['tiny-clay'].evidence);
    expect(FILE_SAMPLES['tiny-living'].motion).toBe(FILE_SAMPLES['tiny-clay'].motion);
    for (const stop of STOPS) {
      expect(unknownEvidenceAt('tiny-dot', stop)).toEqual(fileEvidenceAt('tiny-living', stop));
      expect(unknownEvidenceAt('tiny-dot', stop)).toEqual(fileEvidenceAt('tiny-clay', stop));
    }
    expect(fileEvidenceAt('tiny-living', 3)).toEqual([]);
    expect(fileEvidenceAt('tiny-living', 4)).toEqual(['dot']);
    expect(unknownMotion('tiny-dot')).toBe('drifts');
  });
  it('red onion skin shows what onion skin shows, so its colour decides nothing', () => {
    expect(FILE_SAMPLES['red-onion'].evidence).toEqual(FILE_SAMPLES['onion-skin'].evidence);
    expect(FILE_SAMPLES['red-onion'].evidence).toEqual(WALL_SLIDES['onion-skin'].evidence);
  });
  it('cork is walls at the first microscope stop and walls with nothing inside at the closest', () => {
    expect(fileEvidenceAt('cork', 3)).toEqual(['wall']);
    expect([...fileEvidenceAt('cork', 4)].sort()).toEqual(['empty', 'wall']);
  });
});

describe('level 11 cases', () => {
  it('there are five, each with three different cards, and none is a level-9 case', () => {
    expect(OPEN_CASE_IDS).toEqual(['O1', 'O2', 'O3', 'O4', 'O5']);
    for (const id of OPEN_CASE_IDS) {
      expect(new Set(FILE_CASES[id].candidates).size).toBe(3);
      expect(FILE_CASE_IDS as readonly string[]).not.toContain(id);
    }
  });
  it('survivors never grow with the stop and are all three at stops 1–2', () => {
    for (const id of OPEN_CASE_IDS) {
      const c = FILE_CASES[id];
      expect(survivors(c, 1).length).toBe(3);
      expect(survivors(c, 2).length).toBe(3);
      for (const stop of [2, 3, 4] as Stop[])
        for (const s of survivors(c, stop)) expect(survivors(c, (stop - 1) as Stop)).toContain(s);
    }
  });
  it('matches the definition: ruled out at stop 3, more than one card below stop 4, and the right close', () => {
    for (const id of OPEN_CASE_IDS) {
      const c = FILE_CASES[id];
      const out3 = c.candidates.filter((s) => !survivors(c, 3).includes(s));
      expect([...out3].sort(), id).toEqual([...TABLE[id].out3].sort());
      expect(closingStop(c), id).toBe(4);
      expect(survivors(c, 3).length, id).toBeGreaterThan(1);
      expect(rightClose(c), id).toBe(TABLE[id].right);
    }
  });
  it('O1 and O2 are open with exactly the two tiny cards standing at stop 4; O3–O5 leave one card', () => {
    for (const id of ['O1', 'O2'] as const) {
      expect(isOpenCase(FILE_CASES[id])).toBe(true);
      expect([...survivors(FILE_CASES[id], 4)].sort()).toEqual(['tiny-clay', 'tiny-living']);
    }
    for (const id of ['O3', 'O4', 'O5'] as const) {
      expect(isOpenCase(FILE_CASES[id])).toBe(false);
      expect(survivors(FILE_CASES[id], 4)).toEqual([TABLE[id].right]);
    }
    // No level-9 case is open, so level 9 plays as it did.
    for (const id of FILE_CASE_IDS) expect(isOpenCase(FILE_CASES[id])).toBe(false);
  });
});

describe('level 11 judging', () => {
  it('no oracle: below stop 4 every standing card gets the same free line, and can’t tell yet is right for now', () => {
    for (const id of OPEN_CASE_IDS) {
      const c = FILE_CASES[id];
      for (const stop of [1, 2, 3] as Stop[]) {
        for (const s of survivors(c, stop))
          expect(judgeCase(c, stop, s)).toEqual({ result: 'free', line: 'lens.could-be' });
        expect(judgeCase(c, stop, 'cant-tell')).toEqual({ result: 'free', line: 'lens.right-for-now' });
      }
    }
  });
  it('a card the view has ruled out is a miss at any stop, with the line for what the view shows', () => {
    for (const id of OPEN_CASE_IDS) {
      const c = FILE_CASES[id];
      for (const stop of STOPS)
        for (const s of c.candidates) {
          if (survivors(c, stop).includes(s)) continue;
          expect(judgeCase(c, stop, s)).toEqual({ result: 'miss', line: caseSeeLine(c, stop) });
        }
    }
  });
  it('on an open case only not enough evidence closes the file, only at stop 4, and naming either tiny card there is a miss', () => {
    for (const id of ['O1', 'O2'] as const) {
      const c = FILE_CASES[id];
      for (const stop of STOPS)
        for (const a of answers(id))
          expect(judgeCase(c, stop, a).result === 'right', `${id} ${stop} ${a}`).toBe(
            stop === 4 && a === 'cant-tell',
          );
      expect(judgeCase(c, 4, 'cant-tell')).toEqual({ result: 'right', line: 'lens.file.yes.open' });
      for (const s of ['tiny-living', 'tiny-clay'] as const)
        expect(judgeCase(c, 4, s)).toEqual({ result: 'miss', line: 'lens.file.see.dot' });
    }
  });
  it('on every other case not enough evidence is a miss at stop 4, and only the one card left closes it', () => {
    for (const id of ['O3', 'O4', 'O5'] as const) {
      const c = FILE_CASES[id];
      expect(judgeCase(c, 4, 'cant-tell')).toEqual({ result: 'miss', line: 'lens.file.can-tell-now' });
      for (const stop of STOPS)
        for (const a of answers(id))
          expect(judgeCase(c, stop, a).result === 'right', `${id} ${stop} ${a}`).toBe(
            stop === 4 && a === TABLE[id].right,
          );
    }
    expect(judgeCase(FILE_CASES.O3, 4, 'cork').line).toBe('lens.file.yes.cork');
    expect(judgeCase(FILE_CASES.O4, 4, 'onion-skin').line).toBe('lens.file.yes.red-onion');
    expect(judgeCase(FILE_CASES.O5, 4, 'green-ball').line).toBe('lens.file.yes.green-ball');
  });
  it('movement and colour never decide: the jiggling dot is judged exactly as the drifting one, red onion as onion skin', () => {
    const [o1, o2] = [FILE_CASES.O1, FILE_CASES.O2];
    expect(o2.jiggles).toBe(true);
    for (const stop of STOPS)
      for (const a of ['tiny-living', 'tiny-clay', 'cant-tell'] as const)
        expect(judgeCase(o2, stop, a)).toEqual(judgeCase(o1, stop, a));
    // "Alive because it moves" is never right.
    for (const stop of STOPS) expect(judgeCase(o2, stop, 'tiny-living').result).not.toBe('right');
    // The purple slide closes with the onion-skin card, and there is no card of its own to pick by colour.
    expect(FILE_CASES.O4.candidates as readonly string[]).not.toContain('red-onion');
    expect(rightClose(FILE_CASES.O4)).toBe('onion-skin');
  });
  it('the view line tells cork from onion skin by what is inside, and a dot is only a dot', () => {
    expect(caseSeeLine(FILE_CASES.O3, 3)).toBe('lens.wall.see.wall');
    expect(caseSeeLine(FILE_CASES.O3, 4)).toBe('lens.file.see.walls-empty');
    expect(caseSeeLine(FILE_CASES.O4, 3)).toBe('lens.wall.see.wall');
    expect(caseSeeLine(FILE_CASES.O4, 4)).toBe('lens.file.see.walls-inside');
    expect(caseSeeLine(FILE_CASES.O1, 3)).toBe('lens.file.see.only-dot');
    expect(caseSeeLine(FILE_CASES.O1, 4)).toBe('lens.file.see.dot');
    expect(caseSeeLine(FILE_CASES.O5, 4)).toBe('lens.look.inside');
    // Level 9's onion skin (no cork card on the table) keeps its built line.
    expect(caseSeeLine(FILE_CASES.N4, 4)).toBe('lens.wall.see.wall');
  });
  it('every line a verdict, a card or the fourth button can speak exists, and none names a banned word', () => {
    const lines = VOICE as Record<string, string[]>;
    for (const id of OPEN_CASE_IDS) {
      const c = FILE_CASES[id];
      for (const s of c.candidates) expect(lines[`lens.file.card.${s}`]).toBeDefined();
      for (const stop of STOPS) {
        expect(lines[caseSeeLine(c, stop)]).toBeDefined();
        for (const a of answers(id)) expect(lines[judgeCase(c, stop, a).line]).toBeDefined();
      }
    }
    for (const key of ['lens.file.instruct.open', 'lens.file.say.open', 'lens.say.cant-tell'])
      expect(lines[key]).toBeDefined();
    for (const [key, texts] of Object.entries(lines))
      if (key.startsWith('lens.file.'))
        for (const t of texts)
          expect(t).not.toMatch(
            /microbe|bacteri|germ|\bill|dirty|clean|magnif|species|purple|alive because/i,
          );
    // The tiny living card names no kind of living thing.
    expect(lines['lens.file.card.tiny-living']).toEqual(['A living thing too small to show its inside.']);
  });
});

describe('level 11 rounds', () => {
  it('three different files with one or two open cases, never none and never all three', () => {
    const opens = new Set<number>();
    const seen = new Set<string>();
    for (const seed of seeds(500)) {
      const files = openRoundFor(new Rng(seed), false);
      expect(files.length).toBe(3);
      expect(new Set(files.map((f) => f.case.id)).size).toBe(3);
      const open = files.filter((f) => isOpenCase(f.case)).length;
      expect(open).toBeGreaterThanOrEqual(1);
      expect(open).toBeLessThanOrEqual(2);
      opens.add(open);
      for (const f of files) {
        seen.add(f.case.id);
        expect(OPEN_CASE_IDS as readonly string[]).toContain(f.case.id);
        expect([...f.cards].sort()).toEqual([...f.case.candidates].sort());
      }
    }
    expect([...opens].sort()).toEqual([1, 2]);
    expect(seen.size).toBe(5);
  });
  it('the unknown stays near the middle, a slide of cells stays put, and the dot keeps under the speed limit', () => {
    for (const seed of seeds(100))
      for (const f of openRoundFor(new Rng(seed), false)) {
        for (const t of [0, 3, 11, 47]) {
          const p = swimmerAt(f.path, t);
          expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(0.56);
          if (unknownMotion(f.case.unknown) === 'still') expect(p).toMatchObject(swimmerAt(f.path, 0));
        }
        // Drop units per second, at the closest stop's file scale (0.45 of the drop's) and the largest lens.
        const drift = swimmerSpeed(f.path) * 200 * 1.7 * 0.45 * MAX_ART_SCALE;
        let wobble = 0;
        if (f.case.jiggles)
          for (let t = 0; t < 40; t += 0.05) {
            const [a, b] = [jiggleAt(seed % 6, t), jiggleAt(seed % 6, t + 0.01)];
            expect(Math.hypot(a.x, a.y)).toBeLessThanOrEqual(JIGGLE_MAX);
            wobble = Math.max(wobble, (Math.hypot(b.x - a.x, b.y - a.y) / 0.01) * MAX_ART_SCALE);
          }
        expect(drift + wobble).toBeLessThanOrEqual(MAX_SPEED);
      }
  });
  it('the authored round follows its story: the cork, the drifting dot, the green ball', () => {
    const [cork, dot, ball] = openRoundFor(new Rng(5), true).map((f) => f.case);
    expect([cork.id, dot.id, ball.id]).toEqual(['O3', 'O1', 'O5']);
    // Cork at stop 3 shows walls: animal cells is a miss, can't tell yet is right for now.
    expect(judgeCase(cork, 3, 'cheek-cells')).toEqual({ result: 'miss', line: 'lens.wall.see.wall' });
    expect(judgeCase(cork, 3, 'cant-tell')).toEqual({ result: 'free', line: 'lens.right-for-now' });
    // At stop 4 every box is empty: living plant cells is a miss, and walls only closes it.
    expect(judgeCase(cork, 4, 'onion-skin')).toEqual({ result: 'miss', line: 'lens.file.see.walls-empty' });
    expect(judgeCase(cork, 4, 'cork')).toEqual({ result: 'right', line: 'lens.file.yes.cork' });
    // The tiny dot at stop 4 is still a dot: the living card is a miss, and not enough evidence closes the file.
    expect(judgeCase(dot, 4, 'tiny-living')).toEqual({ result: 'miss', line: 'lens.file.see.dot' });
    expect(judgeCase(dot, 4, 'cant-tell')).toEqual({ result: 'right', line: 'lens.file.yes.open' });
    // The green ball: a dot at stop 3, and at stop 4 a green ball is right and not enough evidence would be a miss.
    expect(survivors(ball, 3).length).toBe(3);
    expect(judgeCase(ball, 4, 'green-ball').result).toBe('right');
    expect(judgeCase(ball, 4, 'cant-tell').result).toBe('miss');
  });
});

describe('level 11 help, tally and ladder', () => {
  it('Show a hint turns to stop 4 on every file, and on an open case the line is the dot line', () => {
    for (const id of OPEN_CASE_IDS)
      expect(helpFor(11, { file: FILE_CASES[id] })).toEqual({ do: 'turn', stop: 4 });
    expect(helpFor(11, {})).toBeNull();
    expect(caseSeeLine(FILE_CASES.O2, 4)).toBe('lens.file.see.dot');
  });
  it('a scripted open file (a named survivor, hint, hint again, the close) counts one miss and one hint', () => {
    const c = FILE_CASES.O1;
    const tally = new LensTally();
    if (judgeCase(c, 4, 'tiny-clay').result === 'miss') tally.miss();
    tally.hint();
    tally.hint();
    expect(judgeCase(c, 4, 'cant-tell').result).toBe('right');
    expect([tally.misses, tally.hints, tally.glow]).toEqual([1, 1, false]);
  });
  it('a grown-up plays 9–11, no other band moved, and the card covers level 11', () => {
    expect(rangeFor(LEVELS, 'grownup')).toMatchObject({ min: 9, max: 11 });
    expect(LEVELS.school).toEqual({ min: 4, max: 8 });
    expect(PLANS.length).toBe(11);
    expect(planFor(11).name).toMatch(/^Open cases/);
    for (const part of [HOW_TO.steps, HOW_TO.finish, HOW_TO.note]) {
      const lines = !part || typeof part === 'string' ? [] : part;
      expect(lines.some((s) => typeof s !== 'string' && (s.from ?? 1) <= 11 && (s.to ?? 99) >= 11)).toBe(
        true,
      );
    }
  });
});

describe('level 11 layout', () => {
  for (const [name, v] of Object.entries(views))
    it(`${name}: the same four-answer layout as level 9`, () => {
      const l = lensLayout(v, 11);
      expect(l).not.toBeNull();
      expect(l).toEqual(lensLayout(v, 9));
      expect(l!.choices.length).toBe(4);
      for (const c of l!.choices) expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(CARD_SIZE);
    });
});
