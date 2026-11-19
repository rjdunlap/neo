import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BIG_WORM_HIT,
  BUCKET_STEP,
  bucketHome,
  hopHit,
  PAD_HIT,
  padHome,
  rowY,
  U,
  unit,
  WORM_HIT,
  x0For,
} from './layout';
import { choices, isRuler, makeMeasures, PLANS, RULER, slideSlots, UNIT_SIZE } from './logic';

/**
 * Inchworm Measure held upright (chunk 31, docs/definitions/phone-portrait.md): every level, every measure the seeds
 * make, on the upright phone views. The tap targets are the answer pads, the pile of worms in the bucket (the worm
 * dragged from it goes to a row, which takes a drop anywhere near), the hopping worm and the short ruler she slides; the
 * things, the long ruler and the sand are scenery that must stay inside the view and clear of Home and the guide.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Inchworm Measure upright on %s', (_, v) => {
  describe.each(PLANS.map((p, i) => [i + 1, p] as const))('level %s', (_level, plan) => {
    const mode = plan.mode;
    const u = unit(v, mode);
    it.each([0, 1, 2, 3, 4, 5])('seed %s: every measure fits', (seed) => {
      for (const m of makeMeasures(plan, new Rng(seed))) {
        const x0 = x0For(v, mode, m);
        const targets: Target[] = [];
        const pads = choices(m, mode, new Rng(seed + 100)).length;
        const showsPads = mode !== 'lay';
        // Pads show once the measuring is done (the units level shows them with the bucket already emptied).
        const padT = (i: number): Target => ({
          what: `pad ${i}`,
          ...padHome(v, mode, i),
          w: PAD_HIT.w,
          h: PAD_HIT.h,
        });
        if (showsPads) for (let i = 0; i < pads; i++) targets.push(padT(i));
        // The bucket's three worms are one pile; big worms are two little ones long.
        const big = mode === 'units';
        if (!isWideMode(mode) && !big) {
          const hit = WORM_HIT;
          const top = bucketHome(v, 0).y - hit.h / 2;
          const bottom = bucketHome(v, 2).y + hit.h / 2;
          targets.push({
            what: 'bucket',
            x: bucketHome(v, 0).x,
            y: (top + bottom) / 2,
            w: hit.w,
            h: bottom - top,
          });
        }
        if (mode === 'hop') {
          // The chalk ticks, their numbers (to 95 below the row) and the pads under them clear each other.
          expect(rowY(v, mode, 0) + 95 + 15).toBeLessThan(padHome(v, mode, 0).y - PAD_HIT.h / 2);
          const { hw, hh } = hopHit(v, mode);
          const y = rowY(v, mode, 0) - 30;
          // The worm stands over the space before its nose: none at the start, space k after hop k.
          for (const worms of [0, m.length - 1]) {
            const x = x0 + (worms - 0.5) * u;
            expect(
              uprightProblems(v, [{ what: 'worm', x, y, w: 2 * hw * (u / U), h: 2 * hh * (u / U) }]),
            ).toEqual([]);
          }
        }
        if (mode === 'slide') {
          const half = (m.ruler! * u) / 2;
          const reach = Math.max(half + 16, 160);
          const y = rowY(v, mode, 0);
          // Waiting below the thing, then laid at each slot; its tap area is at least 320 wide and 120 tall.
          const spots = [
            { x: v.w / 2, y: y + 200 },
            ...slideSlots(m).map((at) => ({ x: x0 + (at + m.ruler! / 2) * u, y: y + 60 })),
          ];
          spots.forEach((p, i) => {
            const t = [...targets, { what: 'ruler', ...p, w: 2 * reach, h: 120 }];
            // Before the first lay no pads show; after the second they do.
            const withPads = i === 2 ? t : t.filter((x) => !x.what.startsWith('pad'));
            expect(uprightProblems(v, withPads), `lay ${i}`).toEqual([]);
          });
          // Both parts of the thing and the first ruler's end mark, and the chalk number above it, stay inside the view.
          expect(x0 + m.ruler! * u).toBeLessThanOrEqual(v.w);
          expect(x0 + m.length * u + 20).toBeLessThanOrEqual(v.w);
          expect(x0 + 2 * m.ruler! * u).toBeLessThanOrEqual(v.w);
          expect(x0).toBeGreaterThanOrEqual(40 - 1e-6);
          return;
        }
        expect(uprightProblems(v, targets), `${mode} ${JSON.stringify(m)}`).toEqual([]);
        // The things, the sand and the ruler stay on screen, and every row stands below the Home column.
        const rows = rowsOf(mode, m);
        rows.forEach((r, i) => {
          const y = rowY(v, mode, mode === 'rulersum' ? 0 : i);
          expect(y - 70, `row ${i} stays below Home and help`).toBeGreaterThanOrEqual(150);
          const left = x0 + r.start * u;
          const right = left + r.length * r.size * u;
          expect(left).toBeGreaterThanOrEqual(0);
          // The big and little worms' finished row shows its count 36 to the right of its end, a label about 70 wide.
          expect(right + (mode === 'units' ? 36 + 35 : 0)).toBeLessThanOrEqual(v.w);
        });
        if (isRuler(mode)) {
          const from = m.brk ?? 0;
          // The ruler's box and its snapped edge: 16 either side of the marks, the jag 32 left of the break.
          expect(x0 + from * u - (from > 0 ? 32 : 16)).toBeGreaterThanOrEqual(0);
          expect(x0 + RULER * u + 16).toBeLessThanOrEqual(v.w);
          const lowest = Math.max(...rows.map((_, i) => rowY(v, mode, mode === 'rulersum' ? 0 : i)));
          // The ruler, its numbers and the lit spaces end well above the pads.
          expect(lowest + 30 + 60).toBeLessThan(padHome(v, mode, 0).y - PAD_HIT.h / 2 - 40);
        } else if (!isWideMode(mode)) {
          const low = Math.max(...rows.map((_, i) => rowY(v, mode, i)));
          // The rows end above the bucket's pile.
          expect(low + 60).toBeLessThan(bucketHome(v, 0).y - 50);
          if (mode === 'compare' && m.jump) {
            // The sand pit runs from 40 left of the take-off board past the longest jump.
            const far = Math.max(m.length, m.other!.length) * u;
            expect(x0 - 40).toBeGreaterThanOrEqual(0);
            expect(x0 - 40 + far + 90).toBeLessThanOrEqual(v.w);
          }
        }
      }
    });
  });

  it('keeps the big worm in the bucket inside the view beside the pads', () => {
    const t: Target = {
      what: 'big worms',
      x: bucketHome(v, 0).x,
      y: (bucketHome(v, 0).y + bucketHome(v, 2).y) / 2,
      w: BIG_WORM_HIT.w,
      h: 2 * BUCKET_STEP + BIG_WORM_HIT.h,
    };
    expect(
      uprightProblems(v, [
        t,
        ...[0, 1, 2].map((i) => ({ what: `pad ${i}`, ...padHome(v, 'say', i), ...PAD_HIT })),
      ]),
    ).toEqual([]);
  });

  it('shows the wide levels in a smaller unit and the rest at worm size', () => {
    expect(unit(v, 'lay')).toBe(88);
    expect(unit(v, 'ruler')).toBe(68);
    expect(unit(v, 'slide')).toBe(56);
    // A 10-mark ruler and its box fit 768, and so do two lays of the longest long ruler.
    expect(10 * 68 + 32).toBeLessThanOrEqual(768);
    expect(12 * 56 + 80).toBeLessThanOrEqual(768);
  });
});

function isWideMode(mode: string) {
  return ['ruler', 'rulerdiff', 'rulersum', 'broken', 'hop', 'slide'].includes(mode);
}

/** Each row of a measure: where it starts, in units, how many units long and the size of the worms that lay it. */
function rowsOf(mode: string, m: ReturnType<typeof makeMeasures>[number]) {
  const row = (length: number, start = 0, size = 1) => ({ length, start, size });
  if (mode === 'units') return [row(m.length, 0, UNIT_SIZE[0]), row(m.other!.length, 0, UNIT_SIZE[1])];
  if (mode === 'compare' || mode === 'rulerdiff' || mode === 'rulersum')
    return [row(m.length, m.start ?? 0), row(m.other!.length, m.other!.start ?? 0)];
  return [row(m.length, m.start ?? 0)];
}

describe('Inchworm Measure sideways is unchanged', () => {
  const v = computeView(1024, 768, NO_INSETS, false);
  it('keeps the old units, starts and rows', () => {
    expect(unit(v, 'lay')).toBe(88);
    expect(unit(v, 'ruler')).toBe(74);
    expect(x0For(v, 'lay')).toBe(200);
    expect(x0For(v, 'ruler')).toBe(140);
    expect(rowY(v, 'compare', 1)).toBeCloseTo(768 * 0.52);
    expect(rowY(v, 'rulerdiff', 1)).toBeCloseTo(768 * 0.26 + 96);
    expect(rowY(v, 'say', 0)).toBeCloseTo(768 * 0.4);
    expect(padHome(v, 'say', 1)).toEqual({ x: 1024 - 110, y: 768 * 0.3 + 125 });
    expect(padHome(v, 'ruler', 1)).toEqual({ x: 1024 / 2, y: 768 - 110 });
    expect(bucketHome(v, 1)).toEqual({ x: 1024 - 170, y: 768 - 150 + 46 });
    expect(hopHit(v, 'hop')).toEqual({ hw: 76, hh: 64 });
  });
});
