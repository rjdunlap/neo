import { Container, Graphics } from 'pixi.js';
import { cream, swatch, wood, type ColorName } from '../art/palette';
import { flower, musicNote } from '../art/shapes';
import type { PictureCreation, TuneCreation } from '../content/creations';
import { stampArt } from '../games/stamp-studio/art';

/** The picture board on the treehouse wall, in logical units. */
export const BOARD = { w: 260, h: 200 };
/** The tune plaque beside it. */
export const PLAQUE = { w: 160, h: 130 };

const frame = (w: number, h: number) =>
  new Graphics()
    .roundRect(-w / 2 + 4, -h / 2 + 8, w, h, 18).fill({ color: 0x000000, alpha: 0.12 })
    .roundRect(-w / 2, -h / 2, w, h, 18).fill(wood.fill).stroke({ width: 6, color: wood.line })
    .roundRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 10).fill(cream).stroke({ width: 3, color: wood.line });

/**
 * The board with her picture on it: every stamp where she put it, as big as it was (a little smaller than in the
 * studio), turned the way she turned it. Empty, it shows a soft star that invites a first picture.
 */
export function pictureBoard(picture: PictureCreation | null): Container {
  const c = new Container();
  c.addChild(frame(BOARD.w, BOARD.h));
  const paperW = BOARD.w - 28;
  const paperH = BOARD.h - 28;
  // Keep the largest stamp inside the paper, as the studio does.
  const margin = 26;
  if (!picture) {
    const hint = stampArt('star', 'yellow', 34);
    hint.alpha = 0.3;
    c.addChild(hint);
    return c;
  }
  if ('stamps' in picture) {
    for (const s of picture.stamps) {
      const art = stampArt(s.kind, s.color, 48);
      art.scale.set(0.46 * s.size);
      art.rotation = (s.turns * Math.PI) / 2;
      art.position.set(-paperW / 2 + margin + s.x * (paperW - 2 * margin), -paperH / 2 + margin + s.y * (paperH - 2 * margin));
      art.eventMode = 'none';
      c.addChild(art);
    }
    return c;
  }

  if ('pixels' in picture) {
    const areaW = paperW - 20;
    const areaH = paperH - 20;
    const cell = Math.min(areaW / picture.size, areaH / picture.size);
    const x0 = -(cell * picture.size) / 2;
    const y0 = -(cell * picture.size) / 2;
    const bySpot = new Map(picture.pixels.map((pixel) => [`${pixel.x}:${pixel.y}`, pixel.color]));
    const pixels = new Graphics();
    for (let y = 0; y < picture.size; y++) {
      for (let x = 0; x < picture.size; x++) {
        const color = bySpot.get(`${x}:${y}`);
        pixels
          .roundRect(x0 + x * cell + 1, y0 + y * cell + 1, cell - 2, cell - 2, Math.min(3, cell * 0.1))
          .fill(color ? swatch[color].fill : (x + y) % 2 ? 0xffffff : 0xf4f4f8)
          .stroke({ width: 1.5, color: 0xd8d8e2 });
      }
    }
    pixels.eventMode = 'none';
    c.addChild(pixels);
    return c;
  }

  // Preserve the paper's shape and redraw each saved mark; no bitmap or imported asset is stored.
  const areaW = paperW - 12;
  const areaH = paperH - 12;
  const w = Math.min(areaW, areaH * picture.aspect);
  const h = Math.min(areaH, areaW / picture.aspect);
  const x0 = -w / 2;
  const y0 = -h / 2;
  const unit = Math.min(w, h);
  const dabs = new Graphics();
  for (const mark of picture.marks) {
    const x = x0 + mark.x * w;
    const y = y0 + mark.y * h;
    if (mark.shape === 'dab') dabs.circle(x, y, mark.r * unit).fill(mark.color);
    else {
      const color = swatch[mark.color];
      const art = flower(new Graphics(), mark.r * unit, color.fill, color.line);
      art.position.set(x, y);
      art.eventMode = 'none';
      c.addChild(art);
    }
  }
  dabs.eventMode = 'none';
  c.addChildAt(dabs, 1);
  return c;
}

const ROW_COLORS: ColorName[] = ['pink', 'orange', 'yellow', 'green', 'blue'];

/**
 * The tune plaque: her song as a little grid of colored jellies, lit where a note sits, with a play triangle under
 * it. `lightColumn` shows the beat that is sounding while it plays.
 */
export class TunePlaque extends Container {
  private readonly dots = new Graphics();
  private tune: TuneCreation | null = null;

  constructor() {
    super();
    this.dots.eventMode = 'none';
    this.addChild(frame(PLAQUE.w, PLAQUE.h), this.dots);
  }

  set(tune: TuneCreation | null) {
    this.tune = tune;
    this.lightColumn(-1);
  }

  lightColumn(col: number) {
    const g = this.dots.clear();
    if (!this.tune) {
      // Nothing yet: a soft note that invites a first song.
      musicNote(g, 60, wood.light);
      return;
    }
    const cols = this.tune.cols;
    const rows = this.tune.rows;
    const areaW = PLAQUE.w - 56;
    const areaH = PLAQUE.h - 70;
    const cell = Math.min(areaW / cols, areaH / rows);
    const x0 = -(cell * (cols - 1)) / 2;
    const y0 = -PLAQUE.h / 2 + 30 + (areaH - cell * (rows - 1)) / 2 - 4;
    if (col >= 0 && col < cols) g.roundRect(x0 + col * cell - cell / 2, y0 - cell / 2, cell, cell * rows, cell / 2).fill({ color: swatch.yellow.light, alpha: 0.75 });
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const on = this.tune.notes.some((n) => n.col === k && n.row === r);
        const sw = swatch[ROW_COLORS[r % ROW_COLORS.length]];
        const x = x0 + k * cell;
        const y = y0 + r * cell;
        if (on) g.circle(x, y, cell * 0.36).fill(sw.fill).stroke({ width: 3, color: sw.line });
        else g.circle(x, y, cell * 0.2).fill({ color: wood.line, alpha: 0.2 });
      }
    }
    // A green play triangle says "touch to hear it".
    g.poly([-9, PLAQUE.h / 2 - 40, -9, PLAQUE.h / 2 - 14, 12, PLAQUE.h / 2 - 27]).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line, join: 'round' });
  }
}
