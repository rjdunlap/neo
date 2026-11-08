import type { View } from '../../engine/view';
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** No board scaling: input boxes stay large inside the safe view. Levels 5–7 pass `level` for their own boards. */
export function layout(view: View, rises: number, choices: number, visitors: number, level = 1) {
  const x = (view.w - 1024) / 2;
  const tall = view.h > view.w;
  const box = (cx: number, cy: number, w = 144, h = w): Box => ({ x: x + cx, y: cy, w, h });
  const buttons = {
    undo: box(tall ? 330 : 95, tall ? 1090 : 410, 120),
    remove: box(tall ? 510 : 235, tall ? 1090 : 410, 120),
    help: box(tall ? 690 : 100, tall ? 1090 : 280, 120),
  };
  if (level >= 5) {
    // Smaller cards and tray (120) make room for the corner or the two side strips.
    const down = tall ? 180 : 0;
    const visitorBoxes = Array.from({ length: visitors }, (_, i) =>
      box(330 + i * 140, tall ? 240 : 205, 120),
    );
    const tray = Array.from({ length: choices }, (_, i) => box(330 + i * 140, tall ? 900 : 705, 120));
    const tryBox = box(860, tall ? 1090 : 212);
    if (level === 5) {
      // A switchback seen from the side: the lower ramp climbs left to the landing, the upper ramp climbs right to the door.
      const ground = 640 + down;
      return {
        sockets: [
          box(690, ground - 50, 160, 100),
          box(450, ground - 100, 160),
          box(690, ground - 150, 160, 100),
          box(850, ground - 278, 144, 156),
        ],
        tray,
        visitors: visitorBoxes,
        try: tryBox,
        ...buttons,
        boardY: ground - 70,
        ground,
        doorBase: ground - 200,
        left: x,
        tall,
      };
    }
    const boardY = tall ? 600 : 450,
      ground = boardY + 70;
    return {
      sockets: [
        box(450, boardY),
        box(610, boardY),
        box(790, boardY - 40, 144, 200),
        box(530, boardY + 130, 320, 100),
        box(530, boardY - 130, 320, 100),
      ],
      tray,
      visitors: visitorBoxes,
      try: tryBox,
      ...buttons,
      boardY,
      ground,
      doorBase: ground - 88,
      left: x,
      tall,
    };
  }
  const boardY = tall ? 600 : 430;
  return {
    sockets: [
      ...(rises === 2 ? [450, 610] : [530]).map((cx) => box(cx, boardY, 160)),
      box(790, boardY - 40, 144, 200),
    ],
    tray: Array.from({ length: choices }, (_, i) => box(320 + i * 180, tall ? 880 : 640)),
    visitors: Array.from({ length: visitors }, (_, i) => box(330 + i * 180, tall ? 240 : 215)),
    try: box(860, tall ? 1090 : 215),
    ...buttons,
    boardY,
    ground: boardY + 70,
    doorBase: boardY + 70 - 44 * rises,
    left: x,
    tall,
  };
}
