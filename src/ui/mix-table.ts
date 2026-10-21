import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../art/palette';
import { sfx } from '../audio/sfx';
import { draggable, type DragHandle } from '../engine/drag';
import { onTap } from '../engine/input';
import type { Tweener } from '../engine/tween';
import type { View } from '../engine/view';
import type { GameModule } from '../games/types';
import { MIX_MAX } from '../content/mix';
import { HoldButton, RoundButton } from './buttons';
import { picture } from './discovery';
import { arrowIcon, playIcon } from './icons';

/** What the table's controls ask for; the host edits the held lineup, speaks, and shows the table again. */
export interface TableActions {
  /** A tap on a filled slot: its title. */
  hear(p: number): void;
  /** A tap on a pool tile: at the end of the lineup, if there is room. */
  add(id: string): void;
  move(from: number, to: number): void;
  /** Dragged off the row. False when it is the last stop, which slides back. */
  remove(p: number): boolean;
  reset(): void;
  play(): void;
  back(): void;
}

export const SLOT = 130;
const SLOT_XS = [170, 316, 462, 608, 754];
const POOL_XS = [220, 366, 512, 658, 804];
/** How far below the row's centre a dragged stop must be let go to leave the lineup. */
const OFF_ROW = 110;

/** The table's places in the usable view: a landscape layout, or a tall one (with Play and Reset at the bottom) once the view has room. */
export function tableLayout(view: View) {
  const ox = (view.w - 1024) / 2;
  if (view.h >= 1300) {
    const bottom = view.h - 145;
    return { tall: true, ox, rowY: 260, play: { x: 512, y: bottom }, poolRows: [520, 680, 840], arrowsY: 680, reset: { x: 220, y: bottom } };
  }
  return { tall: false, ox, rowY: 190, play: { x: 905, y: 190 }, poolRows: [400, 560], arrowsY: 480, reset: { x: 512, y: 700 } };
}
export const perPage = (view: View) => tableLayout(view).poolRows.length * POOL_XS.length;

/** A pale square with a game's picture: yellow in the lineup, blue in the pool. */
function gameTile(mod: GameModule, color: typeof swatch.yellow): Container {
  const tile = new Container();
  const face = new Container();
  face.addChild(new Graphics().roundRect(-SLOT / 2, -SLOT / 2, SLOT, SLOT, 22).fill(color.light).stroke({ width: 4, color: color.line }), picture(mod, 0, -4, 96));
  face.eventMode = 'none';
  tile.addChild(face);
  tile.hitArea = new Rectangle(-SLOT / 2, -SLOT / 2, SLOT, SLOT);
  return tile;
}

/** The picnic blanket, small: Reset's picture (back to Little surprises). */
function blanketIcon(): Graphics {
  const g = new Graphics().poly([-30, 14, 30, 14, 22, -14, -22, -14]).fill(swatch.red.light).stroke({ width: 4, color: swatch.red.line });
  for (let i = -1; i <= 1; i++) g.circle(i * 14, -26, 5).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
  return g;
}

/**
 * Make my mix (D5a): the lineup row (one to five stops, dragged to reorder or off the row to rest), the pool of her home
 * spot's games in pages (a tap adds one), Play, Back and a held Reset. Pictures carry the meaning; every target is at least
 * 100 across and nothing scales down to fit.
 */
export class MixTable extends Container {
  private readonly scrim = new Graphics();
  private readonly panels = new Graphics();
  private readonly outlines = new Graphics();
  private readonly row = new Container();
  private readonly poolLayer = new Container();
  readonly backButton: RoundButton;
  readonly playButton: RoundButton;
  readonly resetButton: HoldButton;
  readonly prevButton: RoundButton;
  readonly nextButton: RoundButton;
  private stops: { tile: Container; handle: DragHandle; x: number }[] = [];
  private poolTiles: { tile: Container; id: string }[] = [];
  private lineupMods: readonly GameModule[] = [];
  private pool: readonly GameModule[] = [];
  private view: View | null = null;
  page = 0;
  private dragging = -1;
  private cancelled = false;
  private wiggling = 0;
  private readonly onCancel = () => { this.cancelled = true; };
  /** A key or pad press closes the table, as Back does: the table is touch only. */
  private readonly onKey = (e: KeyboardEvent) => { if (!e.repeat) this.actions.back(); };

  constructor(private readonly tw: Tweener, private readonly actions: TableActions) {
    super();
    this.scrim.eventMode = 'static'; // nothing on the home spot can be touched under the table
    this.backButton = new RoundButton(arrowIcon(-1), swatch.white, 50, () => actions.back());
    this.playButton = new RoundButton(playIcon(), swatch.green, 70, () => actions.play());
    this.resetButton = new HoldButton(blanketIcon(), swatch.white, 56, 0.6, () => actions.reset(), swatch.red.line);
    this.prevButton = new RoundButton(arrowIcon(-1), swatch.white, 50, () => this.turn(-1));
    this.nextButton = new RoundButton(arrowIcon(1), swatch.white, 50, () => this.turn(1));
    this.outlines.eventMode = this.panels.eventMode = 'none';
    this.addChild(this.scrim, this.panels, this.outlines, this.poolLayer, this.row,
      this.backButton, this.playButton, this.resetButton, this.prevButton, this.nextButton);
    // Registered before any stop's drag handle, so a cancelled finger is known before the drop is reported.
    window.addEventListener('pointercancel', this.onCancel, true);
    window.addEventListener('keydown', this.onKey);
  }

  get lineup(): readonly string[] { return this.lineupMods.map(m => m.id); }
  get pageCount(): number { return this.view ? Math.max(1, Math.ceil(this.pool.length / perPage(this.view))) : 1; }

  show(lineup: readonly GameModule[], pool: readonly GameModule[], view: View) {
    this.lineupMods = lineup;
    this.pool = pool;
    this.view = view;
    this.page = Math.min(this.page, this.pageCount - 1);
    for (const s of this.stops) this.release(s.tile, s.handle);
    this.stops = lineup.map((mod, p) => {
      const tile = gameTile(mod, swatch.yellow);
      const handle = draggable(tile, this.tw, {
        lift: 0,
        keepGrab: true,
        onPick: () => { this.dragging = p; this.cancelled = false; sfx.tick(); },
        onMove: (x) => this.makeRoom(p, x),
        onDrop: (x, y) => this.drop(p, x, y),
      });
      return { tile, handle, x: 0 };
    });
    this.row.addChild(...this.stops.map(s => s.tile));
    this.buildPool();
    this.layout(view);
  }

  private buildPool() {
    for (const t of this.poolTiles) this.release(t.tile);
    const view = this.view!;
    const n = perPage(view);
    const shown = this.pool.slice(this.page * n, this.page * n + n);
    const ids = this.lineup;
    this.poolTiles = shown.map(mod => {
      const tile = gameTile(mod, swatch.blue);
      const count = ids.filter(id => id === mod.id).length;
      if (count) {
        const dots = new Graphics();
        for (let i = 0; i < count; i++) dots.circle((i - (count - 1) / 2) * 16, SLOT / 2 - 14, 6).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
        dots.eventMode = 'none';
        tile.addChild(dots);
      }
      onTap(tile, () => { tile.scale.set(1.08); this.actions.add(mod.id); });
      return { tile, id: mod.id };
    });
    this.poolLayer.addChild(...this.poolTiles.map(t => t.tile));
  }

  private release(tile: Container, handle?: DragHandle) {
    handle?.destroy();
    this.tw.kill(tile);
    this.tw.kill(tile.scale);
    tile.destroy({ children: true });
  }

  private turn(d: 1 | -1) {
    this.page = (this.page + d + this.pageCount) % this.pageCount;
    sfx.whoosh();
    this.buildPool();
    if (this.view) this.layout(this.view);
  }

  /** The slot nearest a dragged stop's x, among the filled ones. */
  private nearest(x: number): number {
    const ox = this.view ? tableLayout(this.view).ox : 0;
    let best = 0;
    for (let i = 1; i < this.stops.length; i++) if (Math.abs(ox + SLOT_XS[i] - x) < Math.abs(ox + SLOT_XS[best] - x)) best = i;
    return best;
  }

  /** The other stops slide to leave a gap where the dragged one would land. */
  private makeRoom(from: number, x: number) {
    const ox = this.view ? tableLayout(this.view).ox : 0;
    const to = this.nearest(x);
    let slot = 0;
    this.stops.forEach((s, i) => {
      if (i === from) return;
      if (slot === to) slot++;
      s.x = ox + SLOT_XS[slot++];
    });
  }

  private drop(p: number, x: number, y: number): boolean {
    this.dragging = -1;
    const s = this.stops[p];
    const home = s.handle.home;
    const back = () => { this.restoreSlots(); return false; };
    if (this.cancelled) return back();
    if (Math.hypot(x - home.x, y - home.y) < 14) { this.actions.hear(p); return back(); }
    if (y - home.y > OFF_ROW) return this.actions.remove(p) || back();
    const to = this.nearest(x);
    if (to === p) return back();
    sfx.pop();
    this.actions.move(p, to);
    return true;
  }

  private restoreSlots() {
    const ox = this.view ? tableLayout(this.view).ox : 0;
    this.stops.forEach((s, i) => { s.x = ox + SLOT_XS[i]; });
  }

  /** All five slots are full: one gentle wiggle of the row. Not a wrong answer: no boing, no glow. */
  wiggle() { this.wiggling = 0.4; }

  layout(view: View) {
    this.view = view;
    const L = tableLayout(view);
    const { ox, rowY } = L;
    this.scrim.clear().rect(0, 0, view.w, view.h).fill({ color: wood.light, alpha: 0.92 });
    const poolTop = L.poolRows[0] - SLOT / 2 - 20, poolBottom = L.poolRows[L.poolRows.length - 1] + SLOT / 2 + 20;
    this.panels.clear()
      .roundRect(ox + SLOT_XS[0] - SLOT / 2 - 20, rowY - SLOT / 2 - 20, SLOT_XS[4] - SLOT_XS[0] + SLOT + 40, SLOT + 40, 32).fill({ color: 0xffffff, alpha: 0.8 })
      .roundRect(ox + POOL_XS[0] - SLOT / 2 - 20, poolTop, POOL_XS[4] - POOL_XS[0] + SLOT + 40, poolBottom - poolTop, 32).fill({ color: 0xffffff, alpha: 0.6 });
    // Room for more: a faint dashed outline in each empty slot.
    this.outlines.clear();
    for (let i = this.stops.length; i < MIX_MAX; i++) {
      const cx = ox + SLOT_XS[i], h = SLOT / 2 - 6;
      for (let k = -h; k < h; k += 20) {
        const e = Math.min(k + 10, h);
        this.outlines.moveTo(cx + k, rowY - h).lineTo(cx + e, rowY - h).moveTo(cx + k, rowY + h).lineTo(cx + e, rowY + h)
          .moveTo(cx - h, rowY + k).lineTo(cx - h, rowY + e).moveTo(cx + h, rowY + k).lineTo(cx + h, rowY + e);
      }
    }
    this.outlines.stroke({ width: 4, color: ink, alpha: 0.25, cap: 'round' });
    this.stops.forEach((s, i) => {
      s.x = ox + SLOT_XS[i];
      s.handle.home = { x: s.x, y: rowY };
      if (i !== this.dragging) s.tile.position.set(s.x, rowY);
    });
    this.poolTiles.forEach((t, i) => t.tile.position.set(ox + POOL_XS[i % 5], L.poolRows[Math.floor(i / 5)]));
    this.backButton.position.set(65, 65);
    this.playButton.position.set(ox + L.play.x, L.play.y);
    this.resetButton.position.set(ox + L.reset.x, L.reset.y);
    const paged = this.pageCount > 1;
    this.prevButton.visible = this.nextButton.visible = paged;
    this.prevButton.position.set(ox + 60, L.arrowsY);
    this.nextButton.position.set(ox + 964, L.arrowsY);
  }

  /** Every target as a box in view units, for the layout test and scripted checks. */
  targets(): { name: string; x: number; y: number; w: number; h: number }[] {
    const box = (name: string, c: Container, w: number) => ({ name, x: c.x - w / 2, y: c.y - w / 2, w, h: w });
    return [
      box('back', this.backButton, 100), box('play', this.playButton, 140), box('reset', this.resetButton, 112),
      ...(this.prevButton.visible ? [box('prev', this.prevButton, 100), box('next', this.nextButton, 100)] : []),
      ...this.stops.map((s, i) => box(`slot${i}`, s.tile, SLOT)),
      ...this.poolTiles.map((t, i) => box(`pool${i}`, t.tile, SLOT)),
    ];
  }

  slotAt(p: number): Container | undefined { return this.stops[p]?.tile; }
  /** A pool tile on the current page, by game ID. */
  poolTile(id: string): Container | undefined { return this.poolTiles.find(t => t.id === id)?.tile; }

  update(dt: number) {
    this.resetButton.update(dt);
    this.stops.forEach((s, i) => {
      if (i === this.dragging || s.handle.dragging) return;
      s.tile.x += (s.x - s.tile.x) * Math.min(1, dt * 14);
    });
    for (const t of this.poolTiles) t.tile.scale.set(Math.max(1, t.tile.scale.x - dt * 0.6));
    if (this.wiggling > 0) {
      this.wiggling = Math.max(0, this.wiggling - dt);
      this.row.x = Math.sin(this.wiggling * 40) * 10 * this.wiggling / 0.4;
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    window.removeEventListener('pointercancel', this.onCancel, true);
    window.removeEventListener('keydown', this.onKey);
    for (const s of this.stops) { s.handle.destroy(); this.tw.kill(s.tile); this.tw.kill(s.tile.scale); }
    this.stops = [];
    super.destroy(options);
  }
}
