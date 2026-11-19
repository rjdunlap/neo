import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BOX, cueLayout, STRIP_W } from './layout';
import { LEVELS, PLANS, shapeOf } from './logic';

/**
 * Cue Studio held upright (chunk 31, docs/definitions/phone-portrait.md): every level's layout on the upright phone
 * views. Targets are the slots, the action cards, the five buttons, and each level's request pictures, signals, Repeat
 * cap, request strip and bird receiver.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };

describe.each(Object.entries(views))('Cue Studio upright on %s', (_, v) => {
  it.each(Array.from({ length: LEVELS.school!.max }, (_l, i) => i + 1))('level %s', (level) => {
    const plan = PLANS.find((p) => p.level === level)!;
    const shape = shapeOf(plan);
    const L = cueLayout(v, shape, plan.slots, !!plan.request);
    const t: Target[] = [];
    L.slots.forEach((p, i) => t.push(square(`slot ${i}`, p, BOX)));
    t.push(square('card wave', L.cards.W, BOX), square('card turn', L.cards.T, BOX));
    if (shape === 'pass') t.push(square('card send', L.cards.S, BOX));
    ['play', 'step', 'undo', 'show me', 'finish'].forEach((w, i) => t.push(square(w, L.buttons[i], BOX)));
    if (shape === 'rows')
      for (let r = 0; r < plan.slots; r++) {
        t.push(square(`request ${r}`, L.requests[r], BOX), square(`signal ${r}`, L.signals[r], BOX));
        // The result chip is scenery 72 wide, never tapped.
        t.push(square(`chip ${r}`, L.chips[r], 72));
      }
    if (shape === 'show' && plan.request)
      L.requests.forEach((p, i) => t.push(square(`request ${i}`, p, BOX)));
    if (shape === 'repeat') {
      t.push(square('cap', L.cap, BOX), { what: 'strip', ...L.strip, w: STRIP_W, h: BOX });
      // The ghosts are 96-wide scenery copies of the slots, never tapped.
      L.ghosts.forEach((p, i) => t.push(square(`ghost ${i}`, p, 96)));
    }
    if (shape === 'pass') {
      t.push(square('receiver', L.receiver, BOX), square('fan tile', L.fanTile, BOX));
      t.push({ what: 'strip', ...L.strip, w: STRIP_W, h: BOX });
      // The pet about 150 tall and the bird about 120, both standing at their feet; about 150 wide.
      t.push({ what: 'pet', x: L.actor.x, y: L.actor.y - 75, w: 150, h: 150 });
      t.push({ what: 'bird', x: L.bird.x, y: L.bird.y - 60, w: 150, h: 120 });
    } else if (L.actor.y > 0) {
      // The pet, about 190 tall with its signal picture 70 above, 190 wide.
      t.push({ what: 'pet', x: L.actor.x, y: L.actor.y - 130, w: 190, h: 260 });
    }
    // Chips and ghosts are scenery under 100 units; every other rule still applies to them.
    const problems = uprightProblems(v, t).filter((m) => !/^(chip|ghost) \d is \d+ units$/.test(m));
    expect(problems, `level ${level}`).toEqual([]);
    // The slots' shelf (18 margin each side) and the buttons stay inside the view; the pet's trail ends before it.
    expect(L.buttons[0].x - BOX / 2).toBeGreaterThanOrEqual(150);
    expect(L.buttons[4].x + BOX / 2).toBeLessThanOrEqual(v.w);
    expect(L.slots[0].x - BOX / 2 - 18).toBeGreaterThanOrEqual(0);
    // Controls stand up from the bottom edge, whatever the height.
    expect(v.h - (L.buttons[0].y + BOX / 2)).toBeLessThanOrEqual(60);
    if (shape === 'pass') expect(L.trailEnd).toBeGreaterThan(L.slots[1].x + BOX / 2 + 26);
  });
});
