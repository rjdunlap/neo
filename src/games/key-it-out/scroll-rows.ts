import { Container, Graphics, Rectangle, type FederatedPointerEvent, type Text } from 'pixi.js';
import { ink, wood } from '../../art/palette';
import { TAP_TRAVEL } from '../../engine/drag';
import { palmOnGlass } from '../../engine/input';
import type { LifetimeContext } from '../../engine/lifetime';
import { label } from '../../ui/text';
import { ROW, maxScroll, type Box, type Layout } from './layout';

/**
 * A page of rows in the guide (the Key and the Table), scrolling inside its panel when it is taller than the page. A touch
 * lights its target at once; it acts on release, unless the finger travelled, which slides the rows instead.
 */
export abstract class ScrollRows<T> extends Container {
  scroll = 0;
  /** What scrolls: subclasses draw into it. */
  protected readonly rows = new Container();
  private readonly press = new Graphics();
  private readonly edges = new Graphics();
  private readonly clip = new Graphics();
  protected texts: Text[] = [];
  protected l!: Layout;
  private drag: {
    id: number;
    x: number;
    y: number;
    scroll: number;
    moved: boolean;
    target: T | null;
  } | null = null;

  constructor(
    life: LifetimeContext,
    private readonly act: (t: T) => void,
    /** Whether the page takes touches now (not while the warden stamps or the page colours in). */
    private readonly live: () => boolean,
  ) {
    super();
    this.eventMode = 'static';
    for (const g of [this.press, this.edges]) g.eventMode = 'none';
    this.rows.eventMode = 'none';
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

  /** How many rows the page has. */
  protected abstract get count(): number;
  /** The target under a point in the panel's coordinates, as it is now scrolled. */
  protected abstract targetAt(x: number, y: number): T | null;
  /** A target's box in the panel's coordinates before scrolling. */
  protected abstract boxAt(t: T): Box;

  get full() {
    return maxScroll(this.l, this.count);
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

  /** Slide so row `i` is wholly in view, if it is not. */
  reveal(i: number) {
    const top = i * ROW - this.scroll;
    if (top < 0) this.setScroll(i * ROW - 6);
    else if (top + ROW > this.l.page.h) this.setScroll((i + 1) * ROW - this.l.page.h + 6);
  }

  /** A target's box in the panel's own coordinates, as it is now scrolled. */
  boxOf(t: T): Box {
    const b = this.boxAt(t);
    return { ...b, y: b.y - this.scroll };
  }

  /** A label in the scrolling rows, shrunk to `maxW`; it is destroyed at the next `clearTexts`. */
  protected text(s: string, size: number, x: number, y: number, color = ink, maxW = Infinity) {
    const t = label(s, size, color);
    if (t.width > maxW) t.scale.set(maxW / t.width);
    t.position.set(x, y);
    this.rows.addChild(t);
    this.texts.push(t);
    return t;
  }

  protected clearTexts() {
    for (const t of this.texts) t.destroy();
    this.texts = [];
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
}
