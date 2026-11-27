import { spread, type View } from '../../engine/view';

/**
 * Where Story Steps puts things, for every mode, as pure functions of the view so a test can check each one on the upright
 * phone views (chunk 31, docs/definitions/phone-portrait.md). Sideways the numbers are what the scenes always used; held
 * upright (768 wide) four 164-unit slots or a tray of four pictures do not fit in a row, so they stand in rows of two or three.
 */
export interface Point {
  x: number;
  y: number;
}
export interface Panel {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** `n` centers in rows of `cols`, the rows centered on `cx`, the first row at `y`. */
export function grid(n: number, cols: number, cx: number, y: number, stepX: number, stepY: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / cols),
      inRow = Math.min(cols, n - row * cols);
    return { x: cx + (i % cols) * stepX - ((inRow - 1) * stepX) / 2, y: y + row * stepY };
  });
}

/** A tray of `n` pictures of `size` beneath the slots: one row sideways, rows of at most `cols` held upright. */
function tray(v: View, n: number, size: number, bottom: number, cols: number) {
  const step = size + 28;
  const rows = Math.ceil(n / cols);
  const first = bottom - (rows - 1) * (size + 24);
  return grid(n, cols, v.w / 2, first, step, size + 24);
}

/** The slots and arrows between the neighbours in a row. */
function arrowsOf(slots: Point[], cols: number): Point[] {
  return slots.flatMap((p, i) =>
    i % cols < cols - 1 && i + 1 < slots.length ? [{ x: (p.x + slots[i + 1].x) / 2, y: p.y }] : [],
  );
}

/** The panel behind a tray's rows. */
function trayPanel(points: Point[], half: number, v: View): Panel {
  const top = Math.min(...points.map((p) => p.y)) - half - 22,
    bottom = Math.max(...points.map((p) => p.y)) + half + 22;
  return { x: 30, y: top, w: v.w - 60, h: bottom - top };
}

/** The main strip (levels 1 to 8): `count` slots and the loose pictures beneath. */
export function stripLayout(v: View, count: number, choices: number) {
  const size = choices > 4 ? 110 : 156;
  if (!v.upright) {
    const xs = spread(count, 85, v.w - 85, 212);
    const slots = xs.map((x) => ({ x, y: v.h * 0.4 }));
    const trayXs = spread(choices, 170, v.w - 40, choices > 4 ? 126 : 184);
    return {
      slots,
      arrows: arrowsOf(slots, count),
      tray: trayXs.map((x) => ({ x, y: v.h - 148 })),
      panel: { x: 155, y: v.h - 255, w: v.w - 190, h: 215 } as Panel,
      replay: { x: v.w - 70, y: 70 },
      size,
    };
  }
  const slots = grid(count, count > 3 ? 2 : count, v.w / 2, v.h * 0.27, 200, 200);
  const points = tray(v, choices, size, v.h - 250, choices > 4 ? 3 : 2);
  return {
    slots,
    arrows: arrowsOf(slots, count > 3 ? 2 : count),
    tray: points,
    panel: trayPanel(points, size / 2, v),
    replay: { x: v.w - 70, y: 70 },
    size,
  };
}

/** Predict the ending: three pictures, a blank for the fourth, two endings to choose between. */
export function predictLayout(v: View) {
  if (!v.upright) {
    const xs = spread(4, 100, v.w - 100, 210);
    return {
      slots: xs.map((x) => ({ x, y: v.h * 0.4 })),
      tray: spread(2, 260, v.w - 110, 230).map((x) => ({ x, y: v.h - 148 })),
      panel: { x: 155, y: v.h - 255, w: v.w - 190, h: 215 } as Panel,
      replay: { x: v.w - 70, y: 70 },
    };
  }
  const points = grid(2, 2, v.w / 2 + 40, v.h - 250, 200, 0);
  return {
    slots: grid(4, 2, v.w / 2, v.h * 0.27, 200, 200),
    tray: points,
    panel: trayPanel(points, 82, v),
    replay: { x: v.w - 70, y: 70 },
  };
}

/** Repair the story: four slots in a strip to tap and swap, with an undo. */
export function repairLayout(v: View) {
  const upright = v.upright;
  const slots = upright
    ? grid(4, 2, v.w / 2, v.h * 0.3, 200, 200)
    : spread(4, 115, v.w - 115, 220).map((x) => ({ x, y: v.h * 0.4 }));
  const rowY = slots.map((s) => s.y);
  const top = Math.min(...rowY) - 118,
    bottom = Math.max(...rowY) + 118;
  return {
    slots,
    arrows: arrowsOf(slots, upright ? 2 : 4),
    panel: { x: 30, y: top, w: v.w - 60, h: bottom - top } as Panel,
    replay: { x: v.w - 70, y: 70 },
    undo: { x: v.w - 70, y: v.h - 90 },
  };
}

/** Untangle two stories: a row each with its anchor picture, six pictures in the tray. */
export function untangleLayout(v: View) {
  if (!v.upright) {
    const xs = spread(3, 320, v.w - 110, 210);
    const ys = [v.h * 0.29, v.h * 0.56];
    return {
      anchors: ys.map((y) => ({ x: 195, y })),
      slots: ys.map((y) => xs.map((x) => ({ x, y }))),
      arrows: ys.map((y) => [0, 1].map((i) => ({ x: (xs[i] + xs[i + 1]) / 2, y }))),
      tray: spread(6, 215, v.w - 80, 126).map((x) => ({ x, y: v.h - 135 })),
      panel: { x: 155, y: v.h - 235, w: v.w - 185, h: 195 } as Panel,
      replay: { x: v.w - 70, y: 70 },
    };
  }
  const ys = [v.h * 0.27, v.h * 0.27 + 230];
  const xs = [270, 450, 630];
  const points = tray(v, 6, 110, v.h - 250, 3);
  return {
    anchors: ys.map((y) => ({ x: 100, y })),
    slots: ys.map((y) => xs.map((x) => ({ x, y }))),
    arrows: ys.map((y) => [0, 1].map((i) => ({ x: (xs[i] + xs[i + 1]) / 2, y }))),
    tray: points,
    panel: trayPanel(points, 55, v),
    replay: { x: v.w - 70, y: 70 },
  };
}

/** Story Theater: the stage, three groups of two choices and four buttons. */
export function theaterLayout(v: View) {
  const extra = Math.max(0, v.h - 768);
  if (!v.upright) {
    const row = v.h - 210 - extra * 0.45;
    const centers = [v.w / 2 - 326, v.w / 2, v.w / 2 + 326];
    return {
      title: { x: v.w / 2, y: 112 + extra * 0.12 },
      stage: { x: v.w / 2, y: 284 + extra * 0.3 },
      stageScale: 1,
      caption: { x: v.w / 2, y: 426 + extra * 0.3 },
      labels: centers.map((x) => ({ x, y: row - 85 })),
      choices: [0, 1, 2, 3, 4, 5].map((i) => ({
        x: centers[Math.floor(i / 2)] + (i % 2 === 0 ? -80 : 80),
        y: row,
      })),
      buttons: [0, 1, 2, 3].map((i) => ({ x: 260 + (i * (v.w - 360)) / 3, y: v.h - 62 - extra * 0.25 })),
      compare: [-420, 420],
    };
  }
  // Upright: the stage is drawn at 0.85, the groups stand one above another and the buttons in two rows of two. Taller
  // screens spread what is left between them.
  const spare = Math.max(0, v.h - 1206);
  const groupTop = 520 + spare * 0.3;
  const labels = [0, 1, 2].map((g) => ({ x: v.w / 2, y: groupTop + g * 150 }));
  return {
    title: { x: v.w / 2, y: 140 + spare * 0.05 },
    stage: { x: v.w / 2, y: 290 + spare * 0.12 },
    stageScale: 0.85,
    caption: { x: v.w / 2, y: 428 + spare * 0.2 },
    labels,
    choices: [0, 1, 2, 3, 4, 5].map((i) => ({
      x: v.w / 2 + (i % 2 === 0 ? -90 : 90),
      y: labels[Math.floor(i / 2)].y + 68,
    })),
    buttons: grid(4, 2, v.w / 2 + 40, groupTop + 480, 180, 118),
    compare: [-200, 200],
  };
}

/** Two Viewpoints: the stage, two friend cards, four ending cards and four buttons. */
export function viewpointsLayout(v: View) {
  if (!v.upright) {
    const extra = Math.max(0, v.h - 768);
    const cx = v.w / 2;
    return {
      title: { x: cx, y: 56 },
      stage: { x: cx, y: 205 + extra * 0.1 },
      stageScale: 0.8,
      caption: { x: cx, y: 332 + extra * 0.12 },
      friends: [-110, 110].map((dx) => ({ x: cx + dx, y: 412 + extra * 0.15, w: 164, h: 100 })),
      endings: [-264, -88, 88, 264].map((dx) => ({ x: cx + dx, y: 532 + extra * 0.3, w: 156, h: 100 })),
      buttons: [-270, -90, 90, 270].map((dx) => ({ x: cx + dx, y: v.h - 80 - extra * 0.2, w: 148, h: 100 })),
    };
  }
  // Upright: everything stands in one column; taller screens spread what is left between the groups.
  const spare = Math.max(0, v.h - 1206);
  const cx = v.w / 2;
  return {
    title: { x: cx, y: 140 + spare * 0.05 },
    stage: { x: cx, y: 278 + spare * 0.1 },
    stageScale: 0.85,
    caption: { x: cx, y: 404 + spare * 0.15 },
    friends: [-110, 110].map((dx) => ({ x: cx + dx, y: 524 + spare * 0.25, w: 180, h: 106 })),
    endings: grid(4, 2, cx, 682 + spare * 0.4, 220, 122).map((p) => ({ ...p, w: 148, h: 106 })),
    buttons: grid(4, 2, cx + 40, 956 + spare * 0.6, 180, 118).map((p) => ({ ...p, w: 148, h: 106 })),
  };
}
