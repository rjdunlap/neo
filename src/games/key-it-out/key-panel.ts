import { Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { LifetimeContext } from '../../engine/lifetime';
import { paint, partShapes } from './art';
import { NAMES, isQ, questionWords, type Board, type Branch, type Page } from './logic';
import { ROW, rowParts, type Box } from './layout';
import { ScrollRows } from './scroll-rows';

/** What a touch on the Key page means: a question, or one of its two branch ends. */
export type KeyTarget = { q: number; end: 'question' | 'yes' | 'no' };

/** What the page shows lit: the questions followed, the branch ends taken, a hint's path and a fault's question. */
export interface KeyLights {
  trail: readonly number[];
  taken: ReadonlySet<string>;
  hint: ReadonlySet<number>;
  hintName: number | null;
  fault: number | null;
}

/** Where a part's own drawing sits in the creature, so a question's icon shows the asked value on its own. */
const PART_MID = [
  { x: -66, y: -58 },
  { x: 8, y: 6 },
  { x: 102, y: -20 },
  { x: 13, y: 82 },
];
const ICON_K = [0.55, 0.42, 0.55, 0.5];

/** A question's icon: the asked part, drawn with the asked value. */
export function partIcon(g: Graphics, part: number, v: number, x: number, y: number) {
  const k = ICON_K[part];
  const m = PART_MID[part];
  const shapes =
    part === 0
      ? [{ k: 'circle' as const, x: -66, y: -34, r: 30, f: 'body' as const }, ...partShapes(0, v)]
      : partShapes(part, v);
  paint(g, shapes, x - m.x * k, y - m.y * k, k, { colour: false, sw: swatch.white });
}

/** The Key page: one row per question, its number, icon and words, and its Yes and No ends. */
export class KeyPanel extends ScrollRows<KeyTarget> {
  private readonly art = new Graphics();
  private readonly icons = new Graphics();
  private readonly shade = new Graphics();

  constructor(
    private readonly board: Board,
    life: LifetimeContext,
    act: (t: KeyTarget) => void,
    live: () => boolean,
  ) {
    super(life, act, live);
    for (const g of [this.art, this.icons, this.shade]) g.eventMode = 'none';
    this.rows.addChild(this.shade, this.art, this.icons);
  }

  protected get count() {
    return this.board.key.length;
  }

  protected boxAt(t: KeyTarget): Box {
    return rowParts(this.l, t.q)[t.end];
  }

  /** The branch end that gives `name`. */
  endOf(name: number): KeyTarget {
    for (let q = 0; q < this.board.key.length; q++)
      for (const end of ['yes', 'no'] as const) {
        const b = this.board.key[q][end];
        if (!isQ(b) && b.name === name) return { q, end };
      }
    throw new Error(`no branch gives ${name}`);
  }

  protected targetAt(x: number, y: number): KeyTarget | null {
    const q = Math.floor((y + this.scroll) / ROW);
    if (q < 0 || q >= this.board.key.length) return null;
    const parts = rowParts(this.l, q);
    for (const end of ['yes', 'no'] as const) {
      const b = parts[end];
      if (Math.abs(x - b.x) <= b.w / 2 + 5 && Math.abs(y + this.scroll - b.y) <= ROW / 2) return { q, end };
    }
    return { q, end: 'question' };
  }

  /** Draw every row from the page and what is lit. */
  draw(page: Page, chosenName: number | null, lights: KeyLights) {
    const l = this.l;
    const W = l.page.w;
    this.clearTexts();
    this.art.clear();
    this.icons.clear();
    this.shade
      .clear()
      .roundRect(0, 0, W, Math.max(l.page.h, this.board.key.length * ROW), 22)
      .fill({ color: cream, alpha: 0.94 });
    const text = this.text.bind(this);
    this.board.key.forEach((q, i) => {
      const parts = rowParts(l, i);
      const top = i * ROW;
      const lit = lights.trail.includes(i);
      if (lights.hint.has(i) || lights.fault === i || lit)
        this.art
          .roundRect(4, top + 4, W - 8, ROW - 8, 18)
          .fill(
            lights.fault === i
              ? swatch.red.light
              : lights.hint.has(i)
                ? swatch.yellow.light
                : swatch.teal.light,
          );
      if (i > 0)
        this.art
          .moveTo(16, top)
          .lineTo(W - 16, top)
          .stroke({ width: 2, color: wood.light });
      // The number, the icon and the question.
      const qb = parts.question;
      this.art.circle(36, top + ROW / 2, 26).fill(lit ? swatch.teal.fill : wood.light);
      text(String(i + 1), 30, 36, top + ROW / 2);
      partIcon(this.icons, q.part, q.value, 100, top + ROW / 2);
      // The question wraps onto two lines in a narrow panel rather than shrinking.
      const words = text(questionWords(q.part, q.value), 25, 0, top + ROW / 2);
      words.style.wordWrap = true;
      words.style.wordWrapWidth = Math.max(120, qb.w - 140);
      words.style.align = 'left';
      if (words.height > ROW - 12) words.scale.set((ROW - 12) / words.height);
      words.anchor.set(0, 0.5);
      words.x = 136;
      for (const end of ['yes', 'no'] as const) {
        const b = parts[end];
        const branch: Branch = q[end];
        const taken = lights.taken.has(`${i}${end}`);
        const named = !isQ(branch);
        const name = named ? branch.name : null;
        const on = name === null ? -1 : page.names.indexOf(name);
        const stamped = on >= 0 && page.stamped[on];
        const hinted = name !== null && name === lights.hintName;
        const fill = stamped
          ? 0xe6e2da
          : name !== null && name === chosenName
            ? swatch.green.light
            : named
              ? 0xffffff
              : wood.light;
        this.art
          .roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 16)
          .fill(fill)
          .stroke({
            width: taken || hinted ? 6 : 3,
            color: hinted ? swatch.yellow.line : taken ? swatch.teal.line : named ? wood.line : wood.fill,
          });
        text(end === 'yes' ? 'Yes' : 'No', 18, b.x - b.w / 2 + 26, b.y - b.h / 2 + 16, 0x6b6b78);
        if (named) {
          text(NAMES[name!], 28, b.x, b.y + 8, stamped ? 0x9c98a6 : ink, b.w - 16);
          if (on >= 0) {
            this.art
              .circle(b.x + b.w / 2 - 18, b.y - b.h / 2 + 18, 15)
              .fill(stamped ? 0x9c98a6 : swatch.blue.fill);
            text(String(on + 1), 20, b.x + b.w / 2 - 18, b.y - b.h / 2 + 18, 0xffffff);
          }
        } else text(`→ ${(branch as { q: number }).q + 1}`, 30, b.x + 8, b.y + 6);
      }
    });
  }
}
