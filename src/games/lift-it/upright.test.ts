import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  cardSpots,
  CARD,
  circleBox,
  counterBox,
  crateHook,
  crateRing,
  friendBox,
  HANDLE_HIT,
  handleAt,
  HOOK_HIT,
  ledgeSpots,
  liftLayout,
  PLANS,
  rectsOverlap,
  REPLAY_HIT,
  replaySpot,
  TIE_HIT,
  TRAY_HIT,
  type Rect,
} from './logic';

/**
 * Lift It held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views. The
 * targets are the hooks, handles, tray wheels, the tie button, the replay button and the answer cards; the friends and
 * the counter must stay in view and clear of Home, the help button and the guide. The plan decides whether the knot
 * moves (level 9) and so which layout is drawn.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
  ipadShape: computeView(768, 1024, NO_INSETS, true),
};

const inside = (v: { w: number; h: number }, r: Rect) =>
  r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
const chrome = (v: { w: number; h: number }): Rect[] => [
  { x: 0, y: 0, w: 115, h: 210 },
  { x: 0, y: v.h - 170, w: 150, h: 170 },
];

describe.each(Object.entries(views))('Lift It upright on %s', (_, v) => {
  it.each(PLANS.map((p) => [p.id, p] as const))(
    'level %i: targets are whole, apart and clear',
    (_id, plan) => {
      const L = liftLayout(v, plan.movableKnot);
      for (let h = 1; h <= 3; h++) {
        const ledge = ledgeSpots(L, v, h);
        const t: Target[] = [
          square('branch hook', L.branchHook, HOOK_HIT * 2),
          square('crate hook', crateHook(L, 0), HOOK_HIT * 2),
          square('ground handle', L.groundHandle, HANDLE_HIT * 2),
          square('ledge handle', ledge.handle, HANDLE_HIT * 2),
          square(
            'crate push handle',
            handleAt(L, v, 'direct', { w: 4, h, g: 3, l: 2 } as never, 0),
            HANDLE_HIT * 2,
          ),
          ...L.tray.map((p, i) => square(`tray wheel ${i + 1}`, p, TRAY_HIT * 2)),
          square('replay', replaySpot(v), REPLAY_HIT * 2),
        ];
        // The tie button is a circle beside the crate's wheel: its circle (not its box) stays apart from the hooks and handles.
        const tie = crateRing(L, 0);
        if (plan.movableKnot) {
          expect(inside(v, circleBox(tie, TIE_HIT))).toBe(true);
          for (const p of [L.branchHook, crateHook(L, 0), L.groundHandle, ledge.handle])
            expect(Math.hypot(p.x - tie.x, p.y - tie.y), `h${h} tie button`).toBeGreaterThanOrEqual(
              TIE_HIT + HOOK_HIT,
            );
        }
        // The push handle rides the crate, so it only has to be whole and clear, not apart from the crate's own hook.
        const apart = t.filter(
          (x) => x.what !== 'crate push handle' && (plan.movableKnot || x.what !== 'tie button'),
        );
        expect(uprightProblems(v, apart), `h${h}`).toEqual([]);
        for (const p of [...L.ground, ...ledge.pullers, ledge.waiting]) {
          expect(inside(v, friendBox(p)), `h${h} friend in view`).toBe(true);
          for (const c of chrome(v))
            expect(rectsOverlap(friendBox(p), c), `h${h} friend covers chrome`).toBe(false);
        }
        expect(rectsOverlap(counterBox(L, true), chrome(v)[0])).toBe(false);
        expect(inside(v, counterBox(L, true))).toBe(true);
        expect(crateRing(L, 3).y - 50).toBeGreaterThan(0);
      }
      for (const n of [2, 3, 4]) {
        const cs = cardSpots(v, n).map((c) => ({ x: c.x - CARD / 2, y: c.y - CARD / 2, w: CARD, h: CARD }));
        for (const c of cs) {
          expect(inside(v, c)).toBe(true);
          for (const k of chrome(v)) expect(rectsOverlap(c, k)).toBe(false);
        }
        for (let i = 0; i < cs.length - 1; i++) expect(rectsOverlap(cs[i], cs[i + 1])).toBe(false);
      }
      expect(circleBox(replaySpot(v), REPLAY_HIT).y).toBeGreaterThan(210);
    },
  );
});
