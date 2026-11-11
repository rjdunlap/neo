import { describe, expect, it } from 'vitest';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { machineLayout, type Rect } from './logic';

const target = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w,
  h: r.h,
});

describe.each(Object.entries(UPRIGHT_VIEWS))('Sorting Machine levels 1–3 upright on %s', (_, v) => {
  it.each([1, 2, 3])(
    'level %i: every target is full size, inside the view and clear of the pet and corners',
    (level) => {
      const l = machineLayout(level, v);
      expect(l).not.toBeNull();
      if (!l) return;
      const controls = [
        ...l.fixtures.map((r, i) => target(`friend ${i + 1}`, r)),
        target('Send', l.send),
        target('Slow', l.slow),
        ...(l.check ? [target('Check', l.check)] : []),
        ...(l.done ? [target('Done', l.done)] : []),
        ...(l.undo ? [target('Undo', l.undo)] : []),
      ];
      // The picker opens over the machine, under its slot: the slot and the picks are checked together, apart from the controls.
      expect(uprightProblems(v, [...controls, ...(l.slot ? [target('slot', l.slot)] : [])])).toEqual([]);
      expect(uprightProblems(v, [...controls, ...l.picks.map((r, i) => target(`pick ${i + 1}`, r))])).toEqual(
        [],
      );
    },
  );
});
