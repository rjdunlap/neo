import { expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import {
  CUTOUTS,
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

it('has a spoken line for every size, miss and hint the pools can produce, and no others', () => {
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
      if (wrong) ids.add(missLine(wrong));
      const hint = hintFor(board, arr);
      if (hint) ids.add(hintLine(board, hint));
    }
  }
  expect([...ids].filter((id) => !(id in VOICE))).toEqual([]);
  expect(Object.keys(VOICE).filter((id) => !ids.has(id))).toEqual([]);
  expect(Object.keys(VOICE)).toHaveLength(306);
  for (const id of ids) expect(SCRIPT[id as keyof typeof SCRIPT]).toBeDefined();
}, 60_000);

it('keeps every line under the caption budget and free of slots', () => {
  for (const [id, [text]] of Object.entries(VOICE)) {
    expect(text.length, id).toBeLessThanOrEqual(180);
    expect(text, id).not.toMatch(/[{}]|undefined|NaN/);
  }
});
