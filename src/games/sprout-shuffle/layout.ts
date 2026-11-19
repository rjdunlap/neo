import { spread, type View } from '../../engine/view';

/**
 * Where Sprout Shuffle puts things, as pure functions of the view, so the sideways layouts and the upright phone's
 * (chunk 31, docs/definitions/phone-portrait.md) are both testable (`upright.test.ts`). One function per scene: levels
 * 1–3 (`shuffleLayout`, ./index.ts), level 4's pair cards (`pairsLayout`, ./pairs.ts), levels 5–6's hidden plant
 * (`hiddenLayout`, ./hidden.ts) and levels 7–8's conservatory (`conservatoryLayout` and `conservatoryFan`,
 * ./conservatory.ts). The sizes the drawings share live here too (./art.ts re-exports them). A sideways view and an
 * iPad held upright (1024 wide) are laid out as before; only the upright phone's 768-wide area differs.
 */

export interface Spot {
  x: number;
  y: number;
}

type V = Pick<View, 'w' | 'h'>;

// ——— Sizes ———

export const TILE = 120;
export const SLOT = 130;
export const BUD_W = 180;
export const BUD_H = 200;
export const CARD = 200;
export const CHECK_R = 70;
export const PACKET_R = 56;
export const PAIR_W = 220;
export const PAIR_H = 200;
export const LENS_R = 50;
export const CAN_R = 56;
export const SLOT_STEP = 76;
export const RECORD_W = 8 * SLOT_STEP + 40;
export const RECORD_H = 142;
/** Where a tester's tray sits under its feet, and its tiles' size. */
export const TESTER_TRAY_Y = 60;
export const TESTER_TILE = 72;
export const PLANT_W = 200;
export const PLANT_H = 240;
export const LENS_BIG_R = 65;
export const BRIEF_W = 260;
export const BRIEF_H = 180;
/** A round button is touched this far past its drawn edge (`RoundButton`). */
export const BUTTON_PAD = 14;
/** Bud cards in a fan are this far apart. */
export const FAN_GAP = 16;
/** Levels 5–6: the two plants' height, their tray tiles, a waiting bench tester's scale and a record sprout's height. */
export const HIDDEN_PLANT_H = 160;
export const TRAY_TILE = 72;
export const BENCH_S = 0.62;
export const SPROUT_H = 112;
/** Levels 7–8: the open fan's close button. */
export const CLOSE_R = 50;

/** The centre x of record slot `i`, relative to the card. */
export function slotX(i: number): number {
  return (i - 3.5) * SLOT_STEP;
}

/** The upright phone's 768-wide area (a sideways view and an iPad held upright are never under 1024 wide). */
export const narrow = (v: V) => v.w < 1020;

// ——— Levels 1–3: two plants, their trays, the sprout and the bud fan ———

/**
 * Plants left and right with their trays, the sprout between, the fan along the bottom (two by two when the view is
 * taller than wide). Upright on a phone the plants stand in from the edges so all four tray tiles are whole, the stack
 * starts lower (clear of Home) and is centred on a taller phone, the trays sit clear of the sprout's slots, and the
 * leaf and the seed packet go under the trays, where there is room for both, with the fan right under them.
 */
export function shuffleLayout(v: V, tryOne: boolean) {
  const up = narrow(v);
  // Upright, the whole stack (about 1,000 units from the blooms to the fan's feet) is centred on a taller phone.
  const off = up ? Math.max(0, (v.h - 1206) / 2) : 0;
  const px = up ? [150, v.w - 150] : [v.w * 0.17, v.w * 0.83];
  const plantFeet = up ? off + 370 : 300;
  const trayY = plantFeet + (up ? 110 : 90);
  const tiles = ([0, 1] as const).map((side) =>
    ([0, 1] as const).map((index): Spot => ({
      x: px[side] + (index === 0 ? -1 : 1) * (TILE / 2 + 12),
      y: trayY,
    })),
  );
  const slots = ([0, 1] as const).map((side): Spot => ({
    x: v.w / 2 + (side === 0 ? -1 : 1) * 90,
    y: plantFeet - 20,
  }));
  // Upright the two choice cards are three quarters size, so they stand between the plants instead of over them.
  const cardScale = up ? 0.75 : 1;
  const cardY = plantFeet - 70;
  const cards = [0, 1].map((i): Spot => ({
    x: v.w / 2 + (i === 0 ? -1 : 1) * ((CARD * cardScale) / 2 + 10),
    y: cardY,
  }));
  // Sideways the leaf sits left of centre and the seed packet right, both between the trays.
  const checkY = up ? trayY + TILE / 2 + 16 + CHECK_R + BUTTON_PAD : cardY + CARD / 2 + CHECK_R + 30;
  let buds: Spot[];
  if (v.h > v.w) {
    const first = up ? checkY + CHECK_R + BUTTON_PAD + 16 + BUD_H / 2 : v.h * 0.5 + 130;
    const cy = [first, first + BUD_H + 24];
    const cx = [v.w / 2 - BUD_W / 2 - 14, v.w / 2 + BUD_W / 2 + 14];
    buds = [0, 1, 2, 3].map((i) => ({ x: cx[i % 2], y: cy[Math.floor(i / 2)] }));
  } else {
    buds = spread(4, 150, v.w - 40, BUD_W + 30).map((x) => ({ x, y: v.h - BUD_H / 2 - 40 }));
  }
  return {
    plants: px.map((x): Spot => ({ x, y: plantFeet })),
    /** `tiles[side][index]`: a tray tile's home. */
    tiles,
    slots,
    sprout: { x: v.w / 2, y: plantFeet - 40 },
    cards,
    cardScale,
    check: { x: v.w / 2 - (tryOne ? 85 : 0), y: checkY },
    tryOne: { x: v.w / 2 + 85, y: checkY },
    buds,
  };
}

// ——— Level 4: the pair cards ———

const PAIRS_TOP = 100;
const CARD_GAP = 20;

/**
 * The vertical stack, bottom up: the three pair cards, their magnifiers, the leaf, the fan. Cards and fan shrink
 * together to the height, each to its own width; buttons never shrink. Before any fan opens, the friend and the bed
 * picture stand where the fan will be.
 */
export function pairsLayout(v: V) {
  const lensHit = LENS_R + BUTTON_PAD;
  const checkHit = CHECK_R + BUTTON_PAD;
  const fixed = PAIRS_TOP + 16 + 8 + 2 * lensHit + 16 + 2 * checkHit + 10;
  const tall = Math.max(0.6, (v.h - fixed) / (PAIR_H + BUD_H));
  const card = Math.min(1, tall, (v.w - 150 - 40) / (3 * PAIR_W + 2 * CARD_GAP));
  const fan = Math.min(1, tall, (v.w - 60) / (4 * BUD_W + 3 * FAN_GAP));
  const cardY = v.h - 16 - (PAIR_H / 2) * card;
  const xs = spread(3, 150, v.w - 40, PAIR_W * card + CARD_GAP);
  const lensY = cardY - (PAIR_H / 2) * card - 8 - lensHit;
  const checkY = lensY - lensHit - 16 - checkHit;
  const fanY = checkY - checkHit - 10 - (BUD_H / 2) * fan;
  const feet = fanY + (BUD_H / 2) * fan;
  return {
    cardScale: card,
    fanScale: fan,
    cards: xs.map((x): Spot => ({ x, y: cardY })),
    lenses: xs.map((x): Spot => ({ x, y: lensY })),
    check: { x: v.w / 2, y: checkY },
    buds: spread(4, 30, v.w - 30, BUD_W * fan + FAN_GAP).map((x): Spot => ({ x, y: fanY })),
    friend: { x: v.w / 2 - 150 * fan, y: feet, scale: 0.62 * fan },
    bed: { x: v.w / 2 + 110 * fan, y: feet - 95 * fan, scale: 0.95 * fan },
  };
}

// ——— Levels 5–6: the hidden plant, the tester, the record and the candidate cards ———

const HIDDEN_TOP = 100;

/**
 * Plants and trays in the top band, the record card under them, the candidate cards and the leaf along the bottom; a
 * view taller than 768 centres the same stack. `buds` is how many bud cards the open fan holds (0, 4, or 8 for both
 * candidates' fans together). Upright on a phone the top band is hidden plant, can, tester, seed packet from left to
 * right, so neither button lies over level 6's potted tester, and the cards and the leaf spread to the full width.
 */
export function hiddenLayout(v: V, buds = 0) {
  const up = narrow(v);
  const off = Math.max(0, (v.h - 768) / 2);
  const feet = off + HIDDEN_TOP + HIDDEN_PLANT_H + 20;
  const trayY = feet + 60;
  const hx = up ? 130 : v.w * 0.28;
  const tx = up ? 500 : v.w * 0.72;
  const tray = (x: number) => [-1, 1].map((d): Spot => ({ x: x + d * (TRAY_TILE / 2 + 8), y: trayY }));
  const recordY = trayY + 48 + 10 + RECORD_H / 2;
  const cardY = Math.min(v.h - 16 - CARD / 2, recordY + RECORD_H / 2 + 26 + CARD / 2 + (off > 0 ? 40 : 0));
  // The cards' row stays right of the guide's corner sideways; upright the stack is centred well above it.
  const xs = spread(3, up ? 40 : 150, v.w - 40, CARD + 50);
  // The fan covers the plants' band while open.
  const top = off + HIDDEN_TOP + 4;
  const bottom = trayY + 48;
  // Two fans side by side share one row in landscape, with a wider gap between them and clear of the corner buttons, and stack in portrait.
  const pair = buds > 4;
  const rows = pair && v.h > v.w ? 2 : 1;
  const perRow = Math.max(1, buds / rows);
  const split = pair && rows === 1 ? 40 : 0;
  const left = pair && rows === 1 ? 130 : 40;
  const budScale = Math.min(
    1,
    (bottom - top - 24 - (rows - 1) * FAN_GAP) / (rows * BUD_H),
    (v.w - 40 - left - split) / (perRow * BUD_W + (perRow - 1) * FAN_GAP),
  );
  const bx = spread(perRow, left, v.w - 40, BUD_W * budScale + FAN_GAP);
  const rowH = BUD_H * budScale + FAN_GAP;
  return {
    hiddenPlant: { x: hx, y: feet },
    testerPlant: { x: tx, y: feet },
    hiddenTiles: tray(hx),
    testerTiles: tray(tx),
    cover: { x: hx, y: trayY },
    banner: { x: hx, y: feet - HIDDEN_PLANT_H - 34 },
    can: { x: up ? 300 : v.w / 2, y: feet - 90 },
    tryOne: { x: up ? v.w - 78 : v.w - 90, y: feet - 90 },
    record: { x: v.w / 2, y: recordY },
    /** Where record sprout `i` stands. */
    sprout: (i: number): Spot => ({ x: v.w / 2 + slotX(i), y: recordY + RECORD_H / 2 - 18 }),
    /** The two candidate cards; the leaf takes the third place of the row. */
    cards: [xs[0], xs[1]].map((x): Spot => ({ x, y: cardY })),
    check: { x: xs[2], y: cardY },
    /** Level 6: the bench under the waiting testers, and where each waits (the potted one stands at `testerPlant`). */
    bench: { x: (xs[0] + xs[1]) / 2, y: cardY + 82 },
    benchPlants: [xs[0], xs[1]].map((x): Spot => ({ x, y: cardY + 22 })),
    panel: { top, bottom },
    budScale,
    buds: Array.from({ length: buds }, (_, i): Spot => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      return {
        x: bx[col] + (split ? (col < perRow / 2 ? -split / 2 : split / 2) : 0),
        y: (top + bottom) / 2 + (row - (rows - 1) / 2) * rowH,
      };
    }),
  };
}

// ——— Levels 7–8: the conservatory ———

/**
 * The brief on top, the two pots under it, and the bench of `n` plant cards. Landscape: the lenses stand left of the
 * pots and the leaves right, the bench along the bottom. Portrait: lenses and leaves in one row under the pots, the
 * bench in one or two rows under that. Upright on a phone that row of four buttons uses the whole width, so no two
 * touch, and the two finished beds stand inside the view.
 */
export function conservatoryLayout(v: V, n: number) {
  const up = narrow(v);
  const portrait = v.h > v.w;
  const top = portrait ? Math.max(0, (v.h - 1180) / 2) : Math.max(0, (v.h - 768) / 2);
  const briefY = top + 20 + BRIEF_H / 2;
  const potScale = portrait ? 0.85 : 1;
  const potCardY = top + (portrait ? 230 : 210) + (PLANT_H * potScale) / 2;
  const potRim = potCardY + (PLANT_H * potScale) / 2 - 6;
  const potX = [v.w * 0.38, v.w * 0.62];
  let benchTop: number;
  let benchBottom: number;
  let benchPos: Spot[];
  const bs = portrait ? 0.9 : 1;
  if (portrait) {
    const rowY = potRim + 130 + 90;
    benchTop = rowY - 16;
    const rows = n > 3 ? 2 : 1;
    const perRow = Math.ceil(n / rows);
    const rowH = PLANT_H * bs + 24;
    const xs = spread(perRow, 150, v.w - 40, PLANT_W * bs + 60);
    benchPos = Array.from({ length: n }, (_, k) => ({
      x: xs[k % perRow],
      y: rowY + rowH / 2 + Math.floor(k / perRow) * rowH,
    }));
    benchBottom = rowY + rows * rowH;
  } else {
    const y = top + 768 - 16 - PLANT_H / 2;
    benchPos = spread(n, 150, v.w - 40, PLANT_W + 30).map((x) => ({ x, y }));
    benchTop = y - PLANT_H / 2 - 8;
    benchBottom = y + PLANT_H / 2 + 8;
  }
  const row = (): Record<'spots' | 'rim' | 'check' | 'finish', Spot> => {
    const y = potRim + 130;
    const xs = up ? spread(4, 30, v.w - 30, 190) : spread(4, 150, v.w - 40, 190);
    return { spots: { x: xs[0], y }, rim: { x: xs[1], y }, check: { x: xs[2], y }, finish: { x: xs[3], y } };
  };
  const ctrl = portrait
    ? row()
    : {
        spots: { x: potX[0] - PLANT_W / 2 - 30 - LENS_BIG_R, y: top + 270 },
        rim: { x: potX[0] - PLANT_W / 2 - 30 - LENS_BIG_R, y: top + 410 },
        check: { x: potX[1] + PLANT_W / 2 + 30 + CHECK_R, y: top + 280 },
        finish: { x: potX[1] + PLANT_W / 2 + 30 + CHECK_R, y: top + 430 },
      };
  const bedY = briefY + 30;
  const bedOut = up ? 264 : 290;
  return {
    brief: { x: v.w / 2, y: briefY },
    potScale,
    potCardY,
    potRim,
    potX,
    benchPos,
    /** A bench card's scale. */
    bs,
    benchTop,
    benchBottom,
    ctrl,
    beds: [-1, 1].map((d): Spot => ({ x: v.w / 2 + d * bedOut, y: bedY })),
    bedScale: up ? 0.7 : 0.8,
  };
}

/**
 * An open fan covers the bench: one row of four in landscape, two by two in portrait, where the panel is two rows of
 * buds tall even over a one-row bench, so a bud never shrinks below its full size.
 */
export function conservatoryFan(v: V, n: number) {
  const g = conservatoryLayout(v, n);
  const portrait = v.h > v.w;
  const top = g.benchTop;
  const bottom = portrait ? Math.max(g.benchBottom, top + 2 * BUD_H + FAN_GAP + 24) : g.benchBottom;
  const rows = portrait ? 2 : 1;
  const perRow = 4 / rows;
  const left = 150;
  const right = v.w - 40 - 2 * CLOSE_R - 20;
  const scale = Math.min(
    1,
    (bottom - top - 24 - (rows - 1) * FAN_GAP) / (rows * BUD_H),
    (right - left) / (perRow * BUD_W + (perRow - 1) * FAN_GAP),
  );
  const bx = spread(perRow, left, right, BUD_W * scale + FAN_GAP);
  const rowH = BUD_H * scale + FAN_GAP;
  return {
    panel: { top, bottom },
    // Upright on a phone the star stands just above this corner of the panel, so the close button sits under its reach.
    close: { x: v.w - 20 - CLOSE_R - 8, y: top + CLOSE_R + (narrow(v) ? BUTTON_PAD + 12 : 8) },
    scale,
    buds: [0, 1, 2, 3].map((i): Spot => ({
      x: bx[i % perRow],
      y: (top + bottom) / 2 + (Math.floor(i / perRow) - (rows - 1) / 2) * rowH,
    })),
  };
}
