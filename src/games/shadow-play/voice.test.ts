import { expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import {
  CUTOUTS,
  boardFor,
  follow,
  faceOnArrangements,
  firstWrong,
  hintFor,
  hintLine,
  inPool,
  missLine,
  openArrangements,
  sizeLine,
} from './logic';
import { VOICE } from './voice';

it('covers the detailed size, miss and mark lines for levels 1–2', () => {
  const ids = new Set<string>([
    'game.shadow-play',
    'shadow.start.lit',
    'shadow.start.dark',
    'shadow.next',
    'shadow.hint.done',
    'shadow.done',
  ]);
  for (const cutout of CUTOUTS) ids.add(sizeLine(cutout));
  // A miss or a hint is about one rail's cut-out, where it stands and where the outline wants it: gather each such
  // case once from the level 2 pool (level 1 never lights a wrong arrangement, and its hints are the same lines).
  const seen = new Set<string>();
  for (const solution of faceOnArrangements()) {
    if (!inPool(2, solution) && !inPool(1, solution)) continue;
    const key = solution.map((p) => `${p.cutout.shape}${p.cutout.h}@${p.mark}`).join();
    if (seen.has(key)) continue;
    seen.add(key);
    const board = { level: 2, solution, start: solution };
    for (const arr of openArrangements(solution.map((p) => p.cutout))) {
      const wrong = firstWrong(board, arr);
      if (wrong) ids.add(missLine(wrong, 2));
      const hint = hintFor(board, arr);
      if (hint) ids.add(hintLine(board, hint));
    }
  }
  expect([...ids].filter((id) => !(id in VOICE))).toEqual([]);
  expect(
    Object.keys(VOICE).filter(
      (id) => !/^shadow\.(check|start\.(turn|swap)|hint\.(swap|turn))/.test(id) && !ids.has(id),
    ),
  ).toEqual([]);
  for (const id of ids) expect(SCRIPT[id as keyof typeof SCRIPT]).toBeDefined();
}, 60_000);

it('keeps every line under the caption budget and free of slots', () => {
  for (const [id, [text]] of Object.entries(VOICE)) {
    expect(text.length, id).toBeLessThanOrEqual(180);
    expect(text, id).not.toMatch(/[{}]|undefined|NaN/);
  }
});

it('covers turns, swaps and all five mismatch reasons in the new levels', () => {
  const rng = new Rng(82);
  const steps = new Set<string>();
  const faults = new Set<string>();
  for (const level of [3, 4]) {
    for (let i = 0; i < 24; i++) {
      const board = boardFor(level, rng);
      for (const start of openArrangements(
        board.solution.map((p) => p.cutout),
        level,
      )) {
        const wrong = firstWrong(board, start);
        if (wrong) {
          faults.add(wrong.fault);
          if (!(missLine(wrong, level) in VOICE)) throw new Error('missing Light explanation');
        }
        let arr = start;
        for (let hint = hintFor(board, arr); hint; hint = hintFor(board, arr)) {
          steps.add(hint.kind);
          if (!(hintLine(board, hint) in VOICE)) throw new Error('missing Help instruction');
          arr = follow(arr, hint);
        }
      }
    }
  }
  expect([...steps].sort()).toEqual(['mark', 'swap', 'turn']);
  expect([...faults].sort()).toEqual(['narrow', 'shape', 'short', 'tall', 'wide']);
  for (const id of Object.keys(VOICE)) expect(SCRIPT[id as keyof typeof SCRIPT]).toBeDefined();
}, 15000);
