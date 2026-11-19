import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { Election, FAMILIES, fixture, layout, OPTIONS, playLayout } from './logic';

/**
 * Village Vote held upright (chunk 31, docs/definitions/phone-portrait.md): every level and vote family at the upright
 * phone views, before and after the pet has voted and in the sharing scene. Targets are the toy buttons (180 × 120), the
 * tally boards (190 × 105), the paws (110) and the "?" (110).
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Village Vote upright on %s', (_, v) => {
  for (const level of [1, 2, 3]) {
    FAMILIES[level].forEach((_f, family) => {
      for (const pet of level === 2 ? OPTIONS.slice(0, 2) : [null]) {
        it(`level ${level} family ${family}${pet ? ` pet votes ${pet}` : ''}: buttons, tallies, paws and the pet fit and apart`, () => {
          const e = new Election(fixture(level, family));
          if (pet) {
            e.choose(pet);
            e.arrived();
          }
          const lay = layout(v, e);
          const t: Target[] = [];
          lay.options.forEach((p, i) => t.push({ what: `toy ${i}`, x: p.x, y: p.y, w: 180, h: 120 }));
          lay.boards.forEach((p, i) => t.push({ what: `tally ${i}`, x: p.x, y: p.y, w: 190, h: 105 }));
          for (const [id, p] of Object.entries(lay.voters))
            t.push({ what: `paw ${id}`, x: p.x, y: p.y, w: 110, h: 110 });
          t.push({ what: 'help', x: lay.help.x, y: lay.help.y, w: 110, h: 110 });
          expect(uprightProblems(v, t, 100)).toEqual([]);
          // The sharing scene's friends (never tapped) stay inside the view and off the guide.
          const play = playLayout(v, e.voters.length);
          const p: Target[] = play.voters.map((q, i) => ({
            what: `friend ${i}`,
            x: q.x,
            y: q.y,
            w: 110,
            h: 110,
          }));
          p.push({ what: 'toy', x: play.toy.x, y: play.toy.y, w: 200, h: 200 });
          expect(uprightProblems(v, p, 100)).toEqual([]);
        });
      }
    });
  }
});

describe('Village Vote sideways layout is unchanged', () => {
  it('keeps the buttons, paws and the play scene where they were', () => {
    const v = computeView(1024, 768);
    const lay = layout(v, new Election(fixture(3, 0)));
    expect(lay.options).toEqual([
      { x: 325, y: 220 },
      { x: 575, y: 220 },
      { x: 825, y: 220 },
    ]);
    expect(lay.boards[0]).toEqual({ x: 325, y: 350 });
    expect(lay.voters['friend-0']).toEqual({ x: 267, y: 480 });
    expect(lay.help).toEqual({ x: 90, y: 280 });
    const play = playLayout(v, 7);
    expect(play.toy).toEqual({ x: 562, y: 300 });
    expect(play.voters[0]).toEqual({ x: 300, y: 500 });
    expect(play.voters[5]).toEqual({ x: 480, y: 650 });
  });
});
