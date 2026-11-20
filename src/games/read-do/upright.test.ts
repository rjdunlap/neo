import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { centre, markLayout, readLayout, signLayout, type Box } from './layout';
import { makeTasks } from './logic';

const captionScreen = computeView(390, 625, NO_INSETS, true);
const views = {
  ...UPRIGHT_VIEWS,
  minimum: computeView(768, 1024, NO_INSETS, true),
  short: captionScreen,
};

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe.each(Object.entries(views))('Read & Do upright on %s', (_, view) => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])(
    'keeps every level %i control clear of the shell and captions',
    (level) => {
      const { band, mode } = captionPlace(view, true);
      const check = (boxes: Box[]) => {
        const targets = boxes.map((box, i) => ({ ...box, ...centre(box), what: `target ${i + 1}` }));
        expect(uprightProblems(view, targets)).toEqual([]);
        if (mode === 'bubble' && band) expect(boxes.filter((box) => overlaps(box, band))).toEqual([]);
      };

      if (level <= 3) {
        for (const task of makeTasks(level, new Rng(18))) {
          const layout = readLayout(view, task.words.length, task.choices.length);
          check([...layout.words, layout.speaker, ...layout.choices]);
        }
      } else if (level <= 6) {
        const layout = markLayout(view);
        check([...layout.words, layout.speaker, layout.socket, layout.send, layout.show, layout.stop]);
      } else {
        const layout = signLayout(view);
        const targets = [
          ...layout.row,
          layout.speaker,
          layout.wish,
          layout.send,
          layout.show,
          ...layout.tray,
        ];
        check(targets);
        expect(targets.filter((target) => overlaps(target, layout.stage))).toEqual([]);
        if (mode === 'bubble' && band) expect(overlaps(layout.stage, band)).toBe(false);
      }
    },
  );
});
