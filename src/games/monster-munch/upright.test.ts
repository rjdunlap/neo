import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { FOOD_HIT, MONSTER_H, MONSTER_W, munchLayout, trayRows } from './layout';
import { MUNCH_PLANS, munchRounds } from './logic';

/**
 * Monster Munch held upright (chunk 31, docs/definitions/phone-portrait.md): every level's rounds at the upright phone
 * views. Targets are the foods (a 110 circle, 160 for big bites), the monsters (the drop and tap area), the bell, the cave
 * door and the three answer pads (140); the sign is drawn only, but must stand clear of the others.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const SEEDS = [3, 7922, 15841, 23760, 31679];

describe.each(Object.entries(views))('Monster Munch upright on %s', (_, v) => {
  MUNCH_PLANS.forEach((plan, idx) => {
    it(`plan ${idx + 1} (${plan.mode}): foods, monsters, bell, cave, pads and sign fit, apart and clear of Home and the guide`, () => {
      for (const seed of SEEDS) {
        for (const r of munchRounds(plan, new Rng(seed))) {
          const friends = plan.mode === 'friends';
          const snacks = Object.values(r.tray).reduce((a, b) => a + b, 0);
          // Seated at the start, and with every friend called in.
          for (const seated of friends ? [1, r.monsters] : [r.monsters]) {
            for (const pads of [0, 3]) {
              const lay = munchLayout(v, {
                mode: plan.mode,
                monsters: seated,
                snacks,
                pads,
                lapFeed: plan.mode === 'big',
              });
              expect(lay.upright).toBe(true);
              const t: Target[] = [];
              const hit = (plan.mode === 'big' ? 80 : FOOD_HIT) * 2;
              // Big bites show one cookie at a time, all resting in the same spot.
              lay.snacks
                .slice(0, plan.mode === 'big' ? 1 : snacks)
                .forEach((p, i) => t.push({ what: `food ${i}`, x: p.x, y: p.y, w: hit, h: hit }));
              lay.monsterX.slice(0, seated).forEach((x, i) =>
                t.push({
                  what: `monster ${i}`,
                  x,
                  y: lay.baseline - (MONSTER_H * lay.scale) / 2,
                  w: MONSTER_W * lay.scale,
                  h: MONSTER_H * lay.scale,
                }),
              );
              if (pads)
                lay.pads.forEach((p, i) => t.push({ what: `pad ${i}`, x: p.x, y: p.y, w: 140, h: 140 }));
              const bellOn = ['exact', 'two', 'leftover', 'friends'].includes(plan.mode);
              if (bellOn) t.push({ what: 'bell', x: lay.bell.x, y: lay.bell.y, w: 112, h: 112 });
              if (friends) t.push({ what: 'cave', x: lay.cave.x, y: lay.cave.y, w: 120, h: 120 });
              // The sign shows only before the pads, on the three plans that ask for an order.
              if (!pads && ['exact', 'two', 'friends'].includes(plan.mode))
                t.push({ what: 'sign', x: lay.sign.x, y: lay.sign.y + 35, w: 280, h: 230 });
              expect(uprightProblems(v, t, 100), `seed ${seed} seated ${seated} pads ${pads}`).toEqual([]);
              // Hung up from the bottom edge: never mid-screen on a tall phone.
              expect(v.h - (lay.tray.y + lay.tray.h)).toBeLessThanOrEqual(100);
              // Every food rests on the tray.
              lay.snacks.forEach((p) => {
                expect(p.x - FOOD_HIT).toBeGreaterThanOrEqual(lay.tray.x - 1e-6);
                expect(p.x + FOOD_HIT).toBeLessThanOrEqual(lay.tray.x + lay.tray.w + 1e-6);
                expect(p.y + FOOD_HIT).toBeLessThanOrEqual(lay.tray.y + lay.tray.h);
              });
              // The sign never reaches the monsters' heads.
              expect(lay.sign.y + 150).toBeLessThanOrEqual(lay.baseline - MONSTER_H * lay.scale);
            }
          }
          expect(trayRows(snacks, true).perRow).toBeLessThanOrEqual(5);
        }
      }
    });
  });
});

describe('Monster Munch sideways layout is unchanged', () => {
  it('keeps the tray, monsters and foods where they were', () => {
    const v = computeView(1024, 768);
    const lay = munchLayout(v, { mode: 'share', monsters: 2, snacks: 8, pads: 0, lapFeed: false });
    expect(lay.upright).toBe(false);
    expect(lay.tray).toEqual({ x: 160, y: 533, w: 834, h: 220 });
    expect(lay.baseline).toBe(508);
    expect(lay.snacks[0].y).toBe(595);
    expect(lay.pads).toEqual([]);
  });
});
