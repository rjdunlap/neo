import { Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { LifetimeContext } from '../../engine/lifetime';
import { habitIcon } from './art';
import { NAMES, cellWords, type Board, type Page } from './logic';
import { ROW, tableParts, type Box } from './layout';
import { ScrollRows } from './scroll-rows';

/** What a touch on the Table page means: a row's name (`cell` -1), or its call, time or food cell. */
export type TableTarget = { row: number; cell: number };

/** What the page shows lit: a hint's row, and a fault's row and the cell its note disagrees with. */
export interface TableLights {
  hintName: number | null;
  fault: { name: number; habit: number } | null;
}

/** The Table page (levels 3–4): one row per guide creature, in alphabetical order: its name, call, time and food. */
export class TablePanel extends ScrollRows<TableTarget> {
  private readonly art = new Graphics();
  private readonly icons = new Graphics();
  private readonly shade = new Graphics();

  constructor(
    private readonly board: Board,
    life: LifetimeContext,
    act: (t: TableTarget) => void,
    live: () => boolean,
  ) {
    super(life, act, live);
    for (const g of [this.art, this.icons, this.shade]) g.eventMode = 'none';
    this.rows.addChild(this.shade, this.art, this.icons);
  }

  protected get count() {
    return this.board.guide.length;
  }

  protected boxAt(t: TableTarget): Box {
    const parts = tableParts(this.l, t.row);
    return t.cell < 0 ? parts.name : parts.cells[t.cell];
  }

  /** The row of `name`. */
  rowOf(name: number) {
    return this.board.guide.findIndex((c) => c.name === name);
  }

  protected targetAt(x: number, y: number): TableTarget | null {
    const row = Math.floor((y + this.scroll) / ROW);
    if (row < 0 || row >= this.count) return null;
    const parts = tableParts(this.l, row);
    if (x < parts.name.x + parts.name.w / 2 + 4) return { row, cell: -1 };
    const cell = parts.cells.findIndex((b) => x <= b.x + b.w / 2 + 4);
    return { row, cell: cell < 0 ? 2 : cell };
  }

  /** Draw every row from the page and what is lit. */
  draw(page: Page, chosenName: number | null, lights: TableLights) {
    const l = this.l;
    const W = l.page.w;
    this.clearTexts();
    this.art.clear();
    this.icons.clear();
    this.shade
      .clear()
      .roundRect(0, 0, W, Math.max(l.page.h, this.count * ROW), 22)
      .fill({ color: cream, alpha: 0.94 });
    this.board.guide.forEach((c, i) => {
      const parts = tableParts(l, i);
      const top = i * ROW;
      const isFault = lights.fault?.name === c.name;
      if (isFault || lights.hintName === c.name)
        this.art
          .roundRect(4, top + 4, W - 8, ROW - 8, 18)
          .fill(isFault ? swatch.red.light : swatch.yellow.light);
      if (i > 0)
        this.art
          .moveTo(16, top)
          .lineTo(W - 16, top)
          .stroke({ width: 2, color: wood.light });
      // The name, which gives itself to the chosen sketch, with the number of the sketch it sits on.
      const b = parts.name;
      const on = page.names.indexOf(c.name);
      const stamped = on >= 0 && page.stamped[on];
      const hinted = lights.hintName === c.name;
      this.art
        .roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 16)
        .fill(stamped ? 0xe6e2da : c.name === chosenName ? swatch.green.light : 0xffffff)
        .stroke({ width: hinted ? 6 : 3, color: hinted ? swatch.yellow.line : wood.line });
      this.text(NAMES[c.name], 28, b.x, b.y, stamped ? 0x9c98a6 : ink, b.w - 20);
      if (on >= 0) {
        this.art
          .circle(b.x + b.w / 2 - 18, b.y - b.h / 2 + 18, 15)
          .fill(stamped ? 0x9c98a6 : swatch.blue.fill);
        this.text(String(on + 1), 20, b.x + b.w / 2 - 18, b.y - b.h / 2 + 18, 0xffffff);
      }
      // The call, time and food: an icon over its word.
      c.habits!.forEach((v, h) => {
        const cb = parts.cells[h];
        const bad = isFault && lights.fault!.habit === h;
        this.art
          .roundRect(cb.x - cb.w / 2, cb.y - cb.h / 2, cb.w, cb.h, 14)
          .fill(bad ? 0xffffff : { color: 0xffffff, alpha: 0.55 })
          .stroke({ width: bad ? 6 : 2, color: bad ? swatch.red.line : wood.light });
        habitIcon(this.icons, h, v, cb.x, cb.y - 18, 0.62);
        this.text(cellWords(h, v), 22, cb.x, cb.y + 24, ink, cb.w - 10);
      });
    });
  }
}
