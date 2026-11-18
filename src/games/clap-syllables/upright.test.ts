import { expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CARS, LEVELS, makeQuestions, planFor, syllables } from './logic';
import {
  BIN_HEIGHT,
  CARD_SIZE,
  CAR_GAP,
  CAR_Y,
  ENGINE_X,
  PAD_RADIUS,
  REPLAY_RADIUS,
  binWidth,
  clapLayout,
  sortedSlot,
} from './layout';

const views = {
  ...UPRIGHT_VIEWS,
  short: computeView(375, 601, NO_INSETS, true),
  minimumPortrait: computeView(768, 1024, NO_INSETS, true),
  landscape: computeView(1024, 768, NO_INSETS),
};
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
];

it.each(Object.entries(views))('keeps cards, controls and drop destinations clear on %s', (_, view) => {
  for (const level of levels) {
    const plan = planFor(level);
    const clapping = plan.mode === 'along' || plan.mode === 'solo';
    const binCount = plan.mode === 'sort' ? plan.max : 0;
    for (const question of makeQuestions(plan, new Rng(31))) {
      const l = clapLayout(view, plan.mode, question.words.length, binCount, plan.max);
      const targets: Target[] = l.cards.map((p, i) => square(`card ${i + 1}`, p, CARD_SIZE[plan.mode] + 6));
      for (const [i, p] of l.bins.entries())
        targets.push({ what: `bin ${i + 1}`, ...p, w: binWidth(binCount) + 6, h: BIN_HEIGHT + 6 });
      for (const p of l.bins) {
        for (let slot = 0; slot < plan.count - binCount + 1; slot++) {
          const offset = sortedSlot(slot);
          const picture = square(
            'sorted picture',
            { x: p.x + offset.x, y: p.y + offset.y },
            (CARD_SIZE.sort + 6) * 0.38,
          );
          expect(uprightProblems(view, [...targets, picture], picture.w), `level ${level}`).toEqual([]);
        }
      }
      if (clapping) {
        targets.push(square('clap pad', l.pad, PAD_RADIUS * 2));
        const lastBead = l.beads[syllables(question.words[0]) - 1];
        expect(lastBead.y + 30).toBeLessThan(l.pad.y - 112);
      }
      if (plan.mode === 'match' || plan.mode === 'compare')
        targets.push(square('replay', l.replay, REPLAY_RADIUS * 2));
      if (plan.mode === 'train') {
        for (let i = 0; i < CARS; i++) {
          targets.push({
            what: `wagon ${i + 1} with its picture`,
            x: l.train.x + i * CAR_GAP,
            y: l.train.y + (CAR_Y - 56 + 70) / 2,
            w: 174,
            h: 70 - (CAR_Y - 56),
          });
        }
        targets.push({ what: 'engine', x: l.train.x + ENGINE_X + 15.5, y: l.train.y - 9.5, w: 177, h: 167 });
        expect(l.train.x - 87).toBeGreaterThanOrEqual(24);
        expect(view.w - (l.train.x + ENGINE_X + 104)).toBeGreaterThanOrEqual(24);
      }
      expect(uprightProblems(view, targets), `level ${level}`).toEqual([]);
    }
  }
});
