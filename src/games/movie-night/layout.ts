/**
 * Where Movie Night puts things, as a pure function of the view (chunk 31, docs/definitions/phone-portrait.md), tested at
 * every level and phone view in `upright.test.ts`. Sideways keeps the strip in one row on the 1024-wide design area (an upright tablet keeps its 1024-wide layout too).
 * Held upright the strip is two columns of squares (reading left to right, then down), the request sits above it, the
 * little screen below it, and the sound pads and the four round buttons stand up from the bottom edge, clear of the guide.
 */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The little screen's height as a share of its width (the footage is drawn 320 wide). */
export const SCREEN_RATIO = 340 / 600;

export function layout(v: { w: number; h: number; upright?: true }, count: number) {
  const dx = (v.w - 1024) / 2,
    tall = v.h > v.w;
  const box = (x: number, y: number, w: number, h: number): Box => ({ x: x + dx, y, w, h });
  if (!v.upright) {
    // Sideways, and an upright tablet (1024 wide, taller than wide), keep the layout drawn for the 1024 area.
    return {
      slots: Array.from({ length: count }, (_, i) =>
        tall
          ? box(i % 2 ? 700 : 360, i < 2 ? 340 : 530, 240, 140)
          : box((1024 - (count - 1) * 200) / 2 + i * 200, 300, 160, 120),
      ),
      tray: Array.from({ length: 4 }, (_, i) => box(250 + i * 200, tall ? 800 : 490, 120, 110)),
      controls: Array.from({ length: 4 }, (_, i) => box(300 + i * 180, tall ? 1100 : 680, 120, 100)),
      request: box(540, tall ? 210 : 185, 740, 80),
      screen: box(560, tall ? 480 : 420, tall ? 700 : 600, tall ? 400 : 340),
      tall,
    };
  }
  const cx = v.w / 2;
  // Up from the bottom edge: the buttons beside the guide (bottom-left corner), the pads above them.
  const controlsY = v.h - 95,
    trayY = v.h - 235;
  const stackBottom = 415 + 165 + 70; // the lowest row of the strip: its center plus half a square
  const freeTop = stackBottom + 12 + 10,
    freeBottom = trayY - 55 - 12 - 10;
  // A tall phone's spare room goes above the screen: the strip and the request move down a little with it.
  const spare = freeBottom - freeTop;
  const lift = Math.max(0, spare - 396) * 0.5;
  const region = spare - lift;
  const sh = Math.min(396, region),
    sw = sh / SCREEN_RATIO;
  return {
    slots: Array.from({ length: count }, (_, i) =>
      box((i % 2 ? cx + 135 : cx - 135) - dx, 415 + lift + Math.floor(i / 2) * 165, 230, 140),
    ),
    tray: Array.from({ length: 4 }, (_, i) => box(cx - 255 + i * 170 - dx, trayY, 120, 110)),
    controls: Array.from({ length: 4 }, (_, i) => box(225 + i * 150 - dx, controlsY, 120, 100)),
    request: box(cx + 47 - dx, 262 + lift, 740, 80),
    screen: box(cx - dx, freeTop + lift + region / 2, sw, sh),
    tall,
  };
}

/**
 * Levels 4–5 (docs/definitions/movie-night.md#movie-night-45-mm3): three or four slots and four or five picture cards
 * instead of sound pads. Held upright it is `layout` with a five-card tray (120 wide, 16 between, so 664 of the 768).
 * Holding a card shows its one-second preview, so a preview box is always clear of the strip, the tray and the buttons:
 * upright it is the little screen's own place; sideways and on an upright tablet it is a smaller box beside the request,
 * or between the strip and the tray. Playback still uses the large `screen`, with the strip and the tray hidden.
 */
export function cutLayout(v: { w: number; h: number; upright?: true }, slotCount: number, cardCount: number) {
  const base = layout(v, slotCount);
  const dx = (v.w - 1024) / 2,
    tall = v.h > v.w;
  const box = (x: number, y: number, w: number, h: number): Box => ({ x: x + dx, y, w, h });
  const step = cardCount > 4 ? 136 : 170;
  if (v.upright) {
    const left = v.w / 2 - ((cardCount - 1) * step) / 2;
    return {
      ...base,
      tray: Array.from({ length: cardCount }, (_, i) => ({ ...base.tray[0], x: left + i * step })),
      preview: base.screen,
    };
  }
  if (tall) {
    // An upright tablet: the 1024-wide plan, the strip in two columns, the preview between it and the tray.
    return {
      ...base,
      slots: Array.from({ length: slotCount }, (_, i) =>
        box(i % 2 ? 700 : 360, 340 + Math.floor(i / 2) * 190, 240, 140),
      ),
      tray: Array.from({ length: cardCount }, (_, i) =>
        box(512 - ((cardCount - 1) * step) / 2 + i * step, 1000, 120, 110),
      ),
      controls: Array.from({ length: 4 }, (_, i) => box(300 + i * 180, 1160, 120, 100)),
      preview: box(530, 800, 440, 249),
    };
  }
  return {
    ...base,
    slots: Array.from({ length: slotCount }, (_, i) =>
      box((1024 - (slotCount - 1) * 200) / 2 + i * 200, 270, 160, 120),
    ),
    tray: Array.from({ length: cardCount }, (_, i) =>
      box(512 - ((cardCount - 1) * step) / 2 + i * step, 460, 120, 110),
    ),
    controls: Array.from({ length: 4 }, (_, i) => box(300 + i * 180, 650, 120, 100)),
    request: box(470, 100, 740, 80),
    preview: box(880, 100, 224, 127),
  };
}
