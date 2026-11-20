import type { View } from '../../engine/view';
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** Upright: the controls row's bottom edge (plan y 720) sits 40 above the view's bottom. */
const UP_FLOOR_SHIFT = 760;
/** Panels replace one another; hidden shelf targets never sit over live slots. */
export function layout(v: View) {
  const up = !!v.upright,
    // Upright, the 580-wide middle of the plan sits on the 768 width and everything hangs up from the bottom edge.
    dx = up ? v.w / 2 - 550 : (v.w - 1024) / 2,
    tall = v.h > v.w,
    dy = up ? v.h - UP_FLOOR_SHIFT : tall ? (v.h - 768) * 0.5 : 0;
  const box = (x: number, y: number, w = 128, h = 112): Box => ({ x: x + dx, y: y + dy, w, h });
  return {
    request: box(550, 115),
    rule: box(550, 220),
    replay: up ? box(870, 220, 100, 100) : box(915, 220, 100, 100),
    slots: [290, 460, 630, 800].map((x) => box(x, 365, 136, 128)),
    docks: [box(430, 515, 144, 112), box(690, 515, 144, 112)],
    shelf: [290, 460, 630, 800].map((x) => box(x, 365, 136, 128)),
    // Level 3: all eight parcels in two rows with their caption beneath, and Examples beside both docks.
    shelf8: [345, 490].flatMap((y) => [290, 460, 630, 800].map((x) => box(x, y, 136, 128))),
    shelfCaption: up ? box(625, 587, 560, 40) : box(550, 587, 600, 40),
    lesson: [box(300, 515, 140, 112), box(530, 515, 144, 112), box(740, 515, 144, 112)],
    // Upright the four sit at a 146 pitch from x 160, clear of the guide corner and inside 768.
    controls: (up ? [396, 542, 688, 834] : [300, 480, 660, 840]).map((x) => box(x, 670, 140, 100)),
    parcel: box(550, 385, 160, 140),
    prev: box(270, 385, 100, 100),
    next: box(830, 385, 100, 100),
    tools: [box(320, 370), box(550, 370), box(780, 370), box(550, 530)],
    tall,
  };
}
