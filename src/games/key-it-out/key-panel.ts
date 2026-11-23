import { Container, Graphics, Rectangle, type FederatedPointerEvent, type Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { TAP_TRAVEL } from '../../engine/drag';
import { palmOnGlass } from '../../engine/input';
import type { LifetimeContext } from '../../engine/lifetime';
import { label } from '../../ui/text';
import { paint, partShapes } from './art';
import { NAMES, isQ, questionWords, type Board, type Branch, type Page } from './logic';
import { ROW, maxScroll, rowParts, type Box, type Layout } from './layout';

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

/**
 * The Key page: one row per question, scrolling inside its panel when it is taller than the page. A touch lights its
 * target at once; it acts on release, unless the finger travelled, which slides the rows instead.
 */
export class KeyPanel extends Container {
  scroll = 0;
  private readonly rows = new Container();
  private readonly art = new Graphics();
  private readonly icons = new Graphics();
  private readonly press = new Graphics();
  private readonly edges = new Graphics();
  private readonly shade = new Graphics();
  private readonly clip = new Graphics();
  private texts: Text[] = [];
  private l!: Layout;
  private drag: {
    id: number;
    x: number;
    y: number;
    scroll: number;
    moved: boolean;
    target: KeyTarget | null;
  } | null = null;

  constructor(
    private readonly board: Board,
    life: LifetimeContext,
    private readonly act: (t: KeyTarget) => void,
    /** Whether the page takes touches now (not while the warden stamps or the page colours in). */
    private readonly live: () => boolean,
  ) {
    super();
    this.eventMode = 'static';
    for (const g of [this.art, this.icons, this.press, this.edges, this.shade]) g.eventMode = 'none';
    this.rows.eventMode = 'none';
    this.rows.addChild(this.shade, this.art, this.icons);
    this.addChild(this.clip, this.rows, this.press, this.edges);
    this.rows.mask = this.clip;
    this.on('pointerdown', (e) => this.down(e));
    this.on('globalpointermove', (e) => this.move(e));
    this.on('pointerup', (e) => this.up(e));
    this.on('pointerupoutside', (e) => {
      if (e.pointerId === this.drag?.id) this.endDrag();
    });
    // Pixi does not pass a cancelled touch on to display objects.
    life.listen(window, 'pointercancel', () => this.endDrag(), { capture: true });
  }

  get full() {
    return maxScroll(this.l, this.board.key.length);
  }

  place(l: Layout) {
    this.l = l;
    const p = l.page;
    this.position.set(p.x - p.w / 2, p.y - p.h / 2);
    this.hitArea = new Rectangle(0, 0, p.w, p.h);
    this.clip.clear().rect(0, 0, p.w, p.h).fill(0xffffff);
    this.setScroll(this.scroll);
  }

  setScroll(s: number) {
    this.scroll = Math.max(0, Math.min(this.full, s));
    this.rows.y = -this.scroll;
    const { w, h } = this.l.page;
    const bar = { color: wood.line, alpha: 0.45 };
    this.edges.clear();
    if (this.scroll > 0) this.edges.roundRect(8, 2, w - 16, 8, 4).fill(bar);
    if (this.scroll < this.full) this.edges.roundRect(8, h - 10, w - 16, 8, 4).fill(bar);
  }

  /** Slide so question `q`'s row is wholly in view, if it is not. */
  reveal(q: number) {
    const top = q * ROW - this.scroll;
    if (top < 0) this.setScroll(q * ROW - 6);
    else if (top + ROW > this.l.page.h) this.setScroll((q + 1) * ROW - this.l.page.h + 6);
  }

  /** A target's box in the panel's own coordinates, as it is now scrolled. */
  boxOf(t: KeyTarget): Box {
    const parts = rowParts(this.l, t.q);
    const b = parts[t.end];
    return { ...b, y: b.y - this.scroll };
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

  private targetAt(x: number, y: number): KeyTarget | null {
    const q = Math.floor((y + this.scroll) / ROW);
    if (q < 0 || q >= this.board.key.length) return null;
    const parts = rowParts(this.l, q);
    for (const end of ['yes', 'no'] as const) {
      const b = parts[end];
      if (Math.abs(x - b.x) <= b.w / 2 + 5 && Math.abs(y + this.scroll - b.y) <= ROW / 2) return { q, end };
    }
    return { q, end: 'question' };
  }

  private down(e: FederatedPointerEvent) {
    if (this.drag || palmOnGlass() || e.button > 0) return;
    const p = e.getLocalPosition(this);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const target = this.targetAt(p.x, p.y);
    this.drag = { id: e.pointerId, x: p.x, y: p.y, scroll: this.scroll, moved: false, target };
    if (target && this.live()) {
      const b = this.boxOf(target);
      this.press
        .clear()
        .roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 16)
        .fill({ color: ink, alpha: 0.16 });
    }
  }

  private move(e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    const p = e.getLocalPosition(this);
    if (!Number.isFinite(p.y)) return;
    // A finger that travels any way is not a tap; the rows follow only its travel past the threshold, so they do not jump.
    if (!d.moved) {
      if (Math.hypot(p.x - d.x, p.y - d.y) < TAP_TRAVEL) return;
      d.moved = true;
      d.y = p.y;
      this.press.clear();
    }
    this.setScroll(d.scroll - (p.y - d.y));
  }

  private up(e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.endDrag();
    if (!d.moved && d.target && !palmOnGlass()) this.act(d.target);
  }

  private endDrag() {
    this.drag = null;
    this.press.clear();
  }

  /** Draw every row from the page and what is lit. */
  draw(page: Page, chosenName: number | null, lights: KeyLights) {
    const l = this.l;
    const W = l.page.w;
    for (const t of this.texts) t.destroy();
    this.texts = [];
    this.art.clear();
    this.icons.clear();
    this.shade
      .clear()
      .roundRect(0, 0, W, Math.max(l.page.h, this.board.key.length * ROW), 22)
      .fill({ color: cream, alpha: 0.94 });
    const text = (s: string, size: number, x: number, y: number, color = ink, maxW = Infinity) => {
      const t = label(s, size, color);
      if (t.width > maxW) t.scale.set(maxW / t.width);
      t.position.set(x, y);
      this.rows.addChild(t);
      this.texts.push(t);
      return t;
    };
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
