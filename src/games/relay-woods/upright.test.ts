import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { fixture, layout } from './logic';

/**
 * Relay Woods held upright (chunk 31, docs/definitions/phone-portrait.md): every level, both graph shapes and both
 * reflections on the upright phone views. The targets are each friend's stump (120), Start over and Help (130 × 100); the
 * request sign and the hop ribbon take no touch but must stay on screen and clear of Home and the guide.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
  ipadShape: computeView(768, 1024, NO_INSETS, true),
};

describe.each(Object.entries(views))('Relay Woods upright on %s', (_, v) => {
  for (let l = 1; l <= 4; l++)
    for (let variant = 0; variant < 2; variant++)
      for (const reflect of [false, true])
        it(`level ${l}, shape ${variant}${reflect ? ', reflected' : ''}: targets are whole, apart and clear`, () => {
          const p = fixture(l, variant);
          p.reflect = reflect;
          const b = layout(v, p);
          const t: Target[] = [
            ...Object.entries(b.nodes).map(([id, pt]) => square(`friend ${id}`, pt, 120)),
            { what: 'start over', x: b.reset.x, y: b.reset.y, w: 130, h: 100 },
            { what: 'help', x: b.help.x, y: b.help.y, w: 130, h: 100 },
          ];
          const info: Target[] = [
            { what: 'request', x: b.request.x, y: b.request.y, w: 400, h: 66 },
            {
              what: 'ribbon',
              x: b.ribbon.x,
              y: b.ribbon.y + (l === 4 ? 25 : 10),
              w: 300,
              h: l === 4 ? 73 : 43,
            },
          ];
          expect(uprightProblems(v, t)).toEqual([]);
          expect(
            uprightProblems(v, [...t, ...info], 0).filter(
              (s) => !s.includes('request') && !s.includes('ribbon'),
            ),
          ).toEqual([]);
          const clash = uprightProblems(v, [...t, ...info], 0).filter((s) => /request|ribbon/.test(s));
          expect(clash).toEqual([]);
        });
});
