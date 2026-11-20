import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout, PEEK, type Box } from './logic';

/**
 * Rule Machine held upright (chunk 31, docs/definitions/phone-portrait.md): every level at the upright phone views.
 * Targets are what she taps: the hopper, the tray's cars, the prediction pads, the rule shelf, the Peek eye and level 6's
 * card slots. Everything hangs up from the bottom edge so a tall phone's spare height is sky.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const t = (what: string, b: Box): Target => ({ what, x: b.x, y: b.y, w: b.w, h: b.h });

describe.each(Object.entries(views))('Rule Machine upright on %s', (_, v) => {
  for (const level of [1, 2, 3, 4, 5, 6]) {
    it(`level ${level} lays out inside the view, apart and hung up from the bottom`, () => {
      const l = layout(v, level);
      const note = `level ${level} at ${Math.round(v.w)} x ${Math.round(v.h)}`;
      // Pads and cars share the bottom row (a round shows one set); the shelf sits with the cars or alone.
      const base: Target[] = [t('hopper', l.hopper)];
      l.slots.forEach((b, i) => base.push(t(`slot ${i}`, b)));
      if (level === 4) base.push(t('peek', { ...l.peek, w: PEEK, h: PEEK }));
      const sets: [string, Box[]][] = [
        ['pad', l.pads],
        ['car', level <= 5 && level >= 2 ? l.tray : []],
      ];
      for (const [what, boxes] of sets) {
        const targets = [...base, ...boxes.map((b, i) => t(`${what} ${i}`, b))];
        if (what === 'car' || level !== 6) l.shelf.forEach((b, i) => targets.push(t(`card ${i}`, b)));
        expect(uprightProblems(v, targets), `${note} ${what}`).toEqual([]);
      }
      const low = Math.max(...[...l.tray, ...l.pads, ...l.shelf].map((b) => b.y + b.h / 2));
      expect(low, `${note} bottom`).toBeGreaterThan(v.h - 330);
    });
  }
});
