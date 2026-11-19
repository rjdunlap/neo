import { spread, type View } from '../../engine/view';

/** The patient and a friend are drawn at this scale; their tap boxes (critter units) are in `index.ts`. */
export const SCALE = 1.25;
/** A patient's tap box in critter units (-175..175 across, -340..50 up and down) at `SCALE`, as the largest mode uses it. */
export const PATIENT_HIT = { w: 350 * SCALE, top: 340 * SCALE, bottom: 50 * SCALE };
/** The pair of `choose` mode: a narrower box each, so two stand side by side sideways. */
export const PAIR_HIT = { w: 250 * SCALE, top: 330 * SCALE, bottom: 40 * SCALE };
/** A tool's tap box, square, in units. */
export const TOOL_HIT = 124;
/** The check-up card, centered, in units. */
export const CARD = { w: 380, h: 140 };

/**
 * Teddy Doctor's fixed positions for a view (chunk 31, docs/definitions/phone-portrait.md). Sideways they are the old
 * ones: the patient on the left at 36%, the tools in two columns on the right, the card at the top right. Held upright
 * (768 wide, 1,206 or more tall) the patient stands centered at the foot, clear of the guide in the bottom-left corner,
 * the tools run in one row just above its tap box and the card sits above the tools; the two patients of `choose` mode
 * stand one above the other (two side by side would need 624 of the 618 units right of the guide).
 */
export function spotFor(v: View): { x: number; y: number } {
  return { x: v.upright ? v.w / 2 : v.w * 0.36, y: v.h - 100 };
}

/** Where the pair of `choose` mode stands: the hurt one's x and y, then the friend's. */
export function pairFor(v: View, hurtSide: number): [{ x: number; y: number }, { x: number; y: number }] {
  const spot = spotFor(v);
  if (!v.upright) {
    const xs = [v.w * 0.32, v.w * 0.73];
    return [
      { x: xs[hurtSide], y: spot.y },
      { x: xs[1 - hurtSide], y: spot.y },
    ];
  }
  const low = { x: v.w * 0.55, y: spot.y };
  const high = { x: v.w * 0.55, y: spot.y - 470 };
  return hurtSide === 0 ? [low, high] : [high, low];
}

/** Where the `n` tools rest. */
export function toolHomesFor(v: View, n: number): { x: number; y: number }[] {
  if (v.upright) {
    const y = v.h - 100 - PATIENT_HIT.top - TOOL_HIT / 2 - 50;
    return spread(n, 40, v.w - 40, 170).map((x) => ({ x, y }));
  }
  const cols = [v.w - 250, v.w - 110];
  return Array.from({ length: n }, (_, i) => ({
    x: cols[i % 2],
    y: 300 + Math.floor(i / 2) * 170 + (n === 1 ? 80 : 0),
  }));
}

/** Where the check-up card is centered. */
export function cardFor(v: View): { x: number; y: number } {
  if (!v.upright) return { x: v.w - 220, y: 110 };
  const tools = toolHomesFor(v, 1)[0].y;
  return { x: v.w / 2, y: tools - TOOL_HIT / 2 - 30 - CARD.h / 2 };
}
