import type { View } from '../../engine/view';
import type { Shape } from './logic';

/**
 * Where Cue Studio puts things, as a pure function of the view so a test can check every level on the upright phone
 * views (chunk 31, docs/definitions/phone-portrait.md). Off the upright area the numbers are what the scene always used
 * (the definitions' rectangles on a 1,024 × 768 area, or its 900-tall turn for a narrow window). Held upright (768 wide)
 * the controls stand up from the bottom edge (the five buttons beside the guide's corner, the action cards above them,
 * then the shelf or the rows), and the request and the pet sit between Home and that group, so nothing reaches past the
 * 768 edge however tall the phone is.
 */
export interface Point {
  x: number;
  y: number;
}

/** One pad's side, which is also its hit area. */
export const BOX = 112;
/** The request strips' width (levels 5 and 6). */
export const STRIP_W = 368;

export interface CueLayout {
  /** The pet's feet (its origin). */
  actor: Point;
  /** The bird's feet (level 6). */
  bird: Point;
  slots: Point[];
  cards: { W: Point; T: Point; S: Point };
  /** Play, Step, Undo, Show me and Finish, left to right. */
  buttons: Point[];
  /** Level 3's pictured request, or level 4's request pictures. */
  requests: Point[];
  signals: Point[];
  chips: Point[];
  cap: Point;
  ghosts: Point[];
  /** Level 5's and level 6's request strip. */
  strip: Point;
  receiver: Point;
  fanTile: Point;
  /** Level 6's dotted trails stop here (x) on the way to the actors. */
  trailEnd: number;
}

const GHOSTS = 2;

export function cueLayout(v: View, shape: Shape, slotCount: number, hasRequest: boolean): CueLayout {
  const one = slotCount === 1;
  const pt = (x: number, y: number): Point => ({ x, y });
  const out: CueLayout = {
    actor: pt(0, 0),
    bird: pt(0, 0),
    slots: [],
    cards: { W: pt(0, 0), T: pt(0, 0), S: pt(0, 0) },
    buttons: [],
    requests: [],
    signals: [],
    chips: [],
    cap: pt(0, 0),
    ghosts: [],
    strip: pt(0, 0),
    receiver: pt(0, 0),
    fanTile: pt(0, 0),
    trailEnd: 0,
  };
  if (v.upright) return uprightLayout(v, shape, slotCount, hasRequest, out);

  const portrait = v.h > v.w;
  const ox = Math.max(0, (v.w - 1024) / 2);
  // The definition's rectangles (top-left corners); each box's centre is half a box in.
  const oy = portrait ? Math.max(0, (v.h - 900) / 2) : Math.max(0, (v.h - 768) / 2);
  const at = (x: number, y: number) => pt(ox + x + BOX / 2, oy + y + BOX / 2);
  const slotX = (i: number) => (one ? 448 : 384 + i * 128);
  if (portrait) {
    out.actor = pt(ox + (hasRequest ? 800 : 512), oy + 360);
    for (let i = 0; i < slotCount; i++) out.slots.push(at(slotX(i), 420));
    // A little lower than the definition's 564/708, to leave room under the show's shelf.
    out.cards.W = at(384, 600);
    out.cards.T = at(512, 600);
    for (let i = 0; i < 5; i++) out.buttons.push(at(192 + i * 128, 748));
  } else {
    out.actor = pt(ox + 828, oy + 330);
    for (let i = 0; i < slotCount; i++) out.slots.push(at(slotX(i), 356));
    // 32 units left of the definition's 128/256, so the cards stand clear of the shelf.
    out.cards.W = at(96, 356);
    out.cards.T = at(224, 356);
    for (let i = 0; i < 5; i++) out.buttons.push(at(192 + i * 128, 532));
  }
  const stripAt = pt(ox + 384 + STRIP_W / 2, oy + (portrait ? 144 : 132) + BOX / 2);
  if (shape === 'rows') {
    if (!portrait) {
      out.cards.W = at(384, 132);
      out.cards.T = at(512, 132);
    }
    for (let row = 0; row < slotCount; row++) {
      const y = (portrait ? 300 : 260) + row * 128;
      out.requests.push(at(96, y));
      out.signals.push(at(240, y));
      out.slots[row] = at(384, y);
      // The chip is 72 wide, at the definition's x 512.
      out.chips.push(at(512 - (BOX - 72) / 2, y));
    }
    return out;
  }
  if (shape === 'pass') {
    const row = portrait ? 300 : 260;
    out.slots = Array.from({ length: slotCount }, (_, i) => at(384 + i * 128, row));
    out.receiver = at(384, row + 128);
    out.fanTile = at(512, row + 128);
    if (portrait) out.cards.S = at(640, 600);
    else {
      out.cards.W = at(96, 260);
      out.cards.T = at(224, 260);
      out.cards.S = at(224, 388);
    }
    out.strip = stripAt;
    // The pet about 150 tall and the bird about 120, each centred at the definition's point; both origins are at the feet.
    out.actor = pt(ox + 880, oy + (portrait ? 330 : 250) + 75);
    out.bird = pt(ox + 880, oy + (portrait ? 480 : 440) + 60);
    out.trailEnd = ox + 800;
    return out;
  }
  if (shape === 'repeat') {
    // Level 5 (the P4 definition's rectangles): the cap ends the shelf and the ghosts stand after it, so the pet moves
    // right, clear of the cap; it stands above that row.
    const y = out.slots[0].y;
    out.cap = pt(ox + 640 + BOX / 2, y);
    for (let i = 0; i < GHOSTS; i++) out.ghosts.push(pt(ox + 820 + i * 108, y));
    out.strip = stripAt;
    out.actor.x = ox + 880;
    return out;
  }
  for (let i = 0; i < 2; i++) out.requests.push(at(384 + i * 128, portrait ? 144 : 136));
  return out;
}

/** The upright 768-wide layout; see `cueLayout`. */
function uprightLayout(
  v: View,
  shape: Shape,
  slotCount: number,
  hasRequest: boolean,
  out: CueLayout,
): CueLayout {
  const pt = (x: number, y: number): Point => ({ x, y });
  const cx = v.w / 2;
  const one = slotCount === 1;
  // Controls up from the bottom edge: the five buttons stand right of the guide's corner (x 160 on).
  const yB = v.h - 40 - BOX / 2;
  for (let i = 0; i < 5; i++) out.buttons.push(pt(216 + i * 120, yB));
  const yC = yB - BOX / 2 - 44 - BOX / 2;
  const cardPitch = 130;
  if (shape === 'pass') {
    out.cards.W = pt(cx - cardPitch, yC);
    out.cards.T = pt(cx, yC);
    out.cards.S = pt(cx + cardPitch, yC);
  } else {
    out.cards.W = pt(cx - cardPitch / 2, yC);
    out.cards.T = pt(cx + cardPitch / 2, yC);
  }
  // The pet stands about 190 tall, with its signal picture floating above its head.
  const ACTOR = 260;
  const GAP = 36;
  const place = (lowerTop: number, topH: number) => {
    // The top block rides at 40% of the spare height under Home, so a tall phone's request is not pushed to the top.
    const free = Math.max(0, lowerTop - 140 - topH);
    return 140 + free * 0.4;
  };
  if (shape === 'rows') {
    const y2 = yC - BOX / 2 - 30 - 72;
    const y1 = y2 - 128;
    // The landscape rows (96 to 584, board margins included) shift 44 right to centre.
    const dx = 44 + 56;
    for (let row = 0; row < slotCount; row++) {
      const y = row ? y2 : y1;
      out.requests.push(pt(96 + dx, y));
      out.signals.push(pt(240 + dx, y));
      out.slots[row] = pt(384 + dx, y);
      out.chips.push(pt(492 + dx, y));
    }
    out.actor = pt(cx, place(y1 - 62 - 20, ACTOR) + ACTOR);
    return out;
  }
  if (shape === 'pass') {
    const y2 = yC - BOX / 2 - 30 - 62;
    const y1 = y2 - 128;
    // The landscape rows and actor column shifted left 262 to fit 768.
    const dx = -262 + 56;
    out.slots = Array.from({ length: slotCount }, (_, i) => pt(384 + i * 128 + dx, y1));
    out.receiver = pt(384 + dx, y2);
    out.fanTile = pt(512 + dx, y2);
    const petX = 880 - 262;
    out.actor = pt(petX, y1 + 9);
    out.bird = pt(petX, y2 + 56);
    out.trailEnd = 800 - 262;
    // The strip stands left of the pet's column, above the pet's head.
    const headTop = y1 + 9 - 150 - 36;
    out.strip = pt(340, place(headTop, BOX) + BOX / 2);
    return out;
  }
  const ySlot = yC - BOX / 2 - 100 - BOX / 2;
  if (shape === 'repeat') {
    // The shelf, cap and ghosts in one row: the landscape numbers shifted 272 left.
    const dx = -272 + 56;
    out.slots = Array.from({ length: slotCount }, (_, i) => pt(384 + i * 128 + dx, ySlot));
    out.cap = pt(640 + dx, ySlot);
    for (let i = 0; i < GHOSTS; i++) out.ghosts.push(pt(820 + i * 108 - 272, ySlot));
    const lowerTop = ySlot - BOX / 2 - 18 - 50;
    const top = place(lowerTop, BOX + GAP + ACTOR);
    out.strip = pt(cx, top + BOX / 2);
    out.actor = pt(cx, top + BOX + GAP + ACTOR);
    return out;
  }
  // The plain show (levels 1 to 3).
  out.slots = Array.from({ length: slotCount }, (_, i) => pt(one ? cx : cx - 64 + i * 128, ySlot));
  const lowerTop = ySlot - BOX / 2 - 18 - 50;
  const topH = hasRequest ? BOX + GAP + ACTOR : ACTOR;
  const top = place(lowerTop, topH);
  if (hasRequest) {
    for (let i = 0; i < 2; i++) out.requests.push(pt(cx - 64 + i * 128, top + BOX / 2));
    out.actor = pt(cx, top + BOX + GAP + ACTOR);
  } else out.actor = pt(cx, top + ACTOR);
  return out;
}
