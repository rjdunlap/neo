import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { newTally, missEvery, hinted, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton, finish as finishArt } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { LineId } from '../../content/voice-script';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  clearIcon,
  doneIcon,
  handcart,
  hintIcon,
  jobTile,
  plannerPicture,
  plannerSticker,
  rowIcon,
  runIcon,
  slotArt,
  undoIcon,
} from './art';
import { plannerLayout, type PlannerLayout, type Spot } from './layout';
import {
  LEVELS,
  boardKey,
  cloneBoard,
  countJourneys,
  describeLevel,
  emptyBoard,
  firstConflict,
  hint,
  isComplete,
  jobById,
  makeRound,
  place,
  referencePlan,
  remove,
  rowOf,
  stepOf,
  stepsUsed,
  type Board,
  type VillageRound,
} from './logic';

const PLACE_NAME = { hill: 'Hill', mill: 'Mill', bench: 'Bench' } as const;
/** Seconds a step takes to play. */
const STEP_TIME = 0.45;

interface Tile {
  id: string;
  node: Container;
  handle: DragHandle;
}

class VillagePlanner implements Game {
  private readonly round: VillageRound;
  private board: Board;
  private readonly history: Board[] = [];
  private readonly tally = newTally();
  private readonly failed = new Set<string>();
  private L: PlannerLayout;
  private busy = true;
  private finished = false;
  private time = 0;
  private cursor = -1;
  private done = new Set<string>();
  private tripsShown: number | null = null;
  private trace: { a: string; b: string } | null = null;
  private glow: { job?: string; slot?: ['bench' | 'cart', number]; run?: boolean; tray?: boolean } = {};
  private readonly shake = new Map<string, number>();
  private cardOpen = false;

  private readonly root = new Container();
  private readonly paper = new Graphics();
  private readonly slotLayer = new Container();
  private readonly labels = new Container();
  private readonly trayZone = new Graphics();
  private readonly tileLayer = new Container();
  private readonly fx = new Graphics();
  private readonly cardLayer = new Container();
  private readonly tripsText: Text;
  private readonly stepTexts: Text[] = [];
  private readonly slots: { bench: Container[]; cart: Container[] } = { bench: [], cart: [] };
  private readonly tiles = new Map<string, Tile>();
  private readonly buttons: RoundButton[];
  private readonly cartIcon = handcart();

  constructor(private readonly ctx: GameContext) {
    this.round = makeRound(ctx.level, ctx.rng);
    const p = this.round.puzzle;
    this.board = emptyBoard(p);
    this.L = plannerLayout(ctx.view, p.maxSteps, p.jobs.length);
    this.paper.eventMode = this.fx.eventMode = this.labels.eventMode = this.trayZone.eventMode = 'none';
    this.cartIcon.scale.set(0.9);
    this.cartIcon.visible = false;
    this.cartIcon.eventMode = 'none';
    this.tripsText = label('', 34, ink);
    this.labels.addChild(this.tripsText);
    for (let t = 0; t < p.maxSteps; t++) {
      const n = label(String(t + 1), 30, ink);
      n.alpha = 0.7;
      this.stepTexts.push(n);
      this.labels.addChild(n);
      for (const row of ['bench', 'cart'] as const) {
        const s = new Container();
        s.addChild(slotArt(row, this.L.slot));
        s.eventMode = 'none';
        this.slots[row].push(s);
        this.slotLayer.addChild(s);
      }
    }
    const benchSign = rowIcon('bench');
    const cartSign = rowIcon('cart');
    benchSign.label = 'bench-sign';
    cartSign.label = 'cart-sign';
    this.labels.addChild(benchSign, cartSign);
    this.rowSigns = [benchSign, cartSign];
    this.round.tray.forEach((id) => this.makeTile(id));
    const r = this.L.button / 2;
    this.buttons = [
      new RoundButton(undoIcon(), swatch.white, r, () => this.undo()),
      new RoundButton(clearIcon(), swatch.white, r, () => this.clear()),
      new RoundButton(hintIcon(), swatch.white, r, () => this.showHint()),
      new RoundButton(runIcon(), swatch.green, r, () => void this.run()),
    ];
    this.cardLayer.visible = false;
    this.root.addChild(
      this.paper,
      this.slotLayer,
      this.labels,
      this.trayZone,
      this.fx,
      this.tileLayer,
      this.cardLayer,
      ...this.buttons,
    );
    ctx.stage.addChild(this.root);
    this.fx.addChild(this.cartIcon);
    this.resize(ctx.view);
  }

  private rowSigns: Container[] = [];

  private makeTile(id: string) {
    const p = this.round.puzzle;
    const j = jobById(p, id);
    const node = new Container();
    node.addChild(jobTile(id, j.place, j.requires, this.L.tile));
    this.tileLayer.addChild(node);
    const handle = draggable(node, this.ctx.tw, {
      tapToPlace: true,
      onPick: () => {
        if (this.busy || this.finished) return;
        sfx.tick();
        this.sayJob(id);
      },
      onDrop: (x, y) => this.drop(id, x, y),
    });
    this.tiles.set(id, { id, node, handle });
  }

  start() {
    this.busy = false;
    this.refresh();
    void this.ctx.instruct('village-planner.start' as LineId);
  }

  resize(view: View) {
    const p = this.round.puzzle;
    const L = (this.L = plannerLayout(view, p.maxSteps, p.jobs.length));
    this.paper.clear();
    L.panels.forEach((pn, i) =>
      this.paper
        .roundRect(pn.x, pn.y, pn.w, pn.h, 26)
        .fill(i === 0 ? 0xf1e0b4 : 0xe7cf98)
        .stroke({ width: 5, color: 0xb59b66 }),
    );
    this.trayZone.clear().roundRect(L.trayZone.x, L.trayZone.y, L.trayZone.w, L.trayZone.h, 22);
    this.trayZone.fill({ color: 0xffffff, alpha: 0.001 });
    for (let t = 0; t < p.maxSteps; t++) {
      this.slots.bench[t].position.set(L.bench[t].x, L.bench[t].y);
      this.slots.cart[t].position.set(L.cart[t].x, L.cart[t].y);
      this.stepTexts[t].position.set(L.stepNums[t].x, L.stepNums[t].y);
    }
    this.rowSigns[0].position.set(L.benchLabel.x, L.benchLabel.y);
    this.rowSigns[1].position.set(L.cartLabel.x, L.cartLabel.y);
    this.tripsText.position.set(L.trips.x, L.trips.y);
    this.buttons.forEach((b, i) => b.position.set(L.buttons[i].x, L.buttons[i].y));
    this.settle(false);
    this.layoutCard();
  }

  /** Where a job's tile sits: its slot when placed, otherwise its own spot in the tray. */
  private homeOf(id: string): Spot {
    const at = stepOf(this.board, id);
    if (at >= 0) return (this.board.bench[at] === id ? this.L.bench : this.L.cart)[at];
    return this.L.tray[this.round.tray.indexOf(id)];
  }

  private slotAt(row: 'bench' | 'cart', step: number): Spot {
    return (row === 'bench' ? this.L.bench : this.L.cart)[step];
  }

  /** Put every tile at its home; `glide` moves it there rather than jumping. */
  private settle(glide: boolean) {
    this.tiles.forEach((t) => {
      const home = this.homeOf(t.id);
      t.handle.home = { x: home.x, y: home.y };
      if (t.handle.dragging || t.handle.held) return;
      this.ctx.tw.kill(t.node);
      if (glide) void this.ctx.tw.to(t.node, { x: home.x, y: home.y }, { duration: 0.18 });
      else t.node.position.set(home.x, home.y);
    });
    this.refresh();
  }

  private refresh() {
    const trips = this.tripsShown ?? countJourneys(this.round.puzzle, this.board);
    this.tripsText.text = `Cart trips: ${trips}`;
    this.tiles.forEach((t) => {
      t.handle.enabled = !this.busy && !this.finished;
    });
  }

  private pushHistory() {
    this.history.push(cloneBoard(this.board));
  }

  private sayJob(id: string) {
    const p = this.round.puzzle;
    const j = jobById(p, id);
    if (j.requires.length === 0) void this.ctx.say('village-planner.job' as LineId, { job: j.name });
    else
      void this.ctx.say('village-planner.job.needs' as LineId, {
        job: j.name,
        needs: j.requires.map((n) => jobById(p, n).name).join(' and '),
      });
  }

  /** A tile let go at (x, y): into the nearest matching slot, back to the tray, or home with a spoken reason. */
  private drop(id: string, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const p = this.round.puzzle;
    const j = jobById(p, id);
    const tile = this.tiles.get(id)!;
    const half = this.L.slot / 2 + 12;
    let best: { row: 'bench' | 'cart'; step: number; d: number } | null = null;
    for (const row of ['bench', 'cart'] as const)
      for (let step = 0; step < p.maxSteps; step++) {
        const s = this.slotAt(row, step);
        if (Math.abs(x - s.x) > half || Math.abs(y - s.y) > half) continue;
        const d = Math.hypot(x - s.x, y - s.y);
        if (!best || d < best.d) best = { row, step, d };
      }
    if (!best) {
      // Back in the tray: anywhere over the tray's paper, or loose space away from the board.
      const z = this.L.trayZone;
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        if (stepOf(this.board, id) >= 0) {
          this.pushHistory();
          this.board = remove(this.board, id);
        }
        this.glow = {};
        this.settle(true);
        this.ctx.tw.kill(tile.node);
        void this.ctx.tw.to(tile.node, { x: tile.handle.home.x, y: tile.handle.home.y }, { duration: 0.18 });
        return true;
      }
      return false;
    }
    const want = rowOf(j);
    if (best.row !== want) {
      sfx.boing();
      void this.ctx.say((want === 'cart' ? 'village-planner.cart' : 'village-planner.bench') as LineId);
      return false;
    }
    const other = this.board[best.row][best.step];
    if (other && other !== id) {
      this.shake.set(id, 0.4);
      this.shake.set(other, 0.4);
      sfx.boing();
      void this.ctx.say(
        (want === 'cart' ? 'village-planner.cartfull' : 'village-planner.benchfull') as LineId,
      );
      return false;
    }
    if (other !== id) {
      const next = place(p, this.board, id, best.step);
      if (!next) return false;
      this.pushHistory();
      this.board = next;
    }
    this.glow = {};
    this.trace = null;
    sfx.pop(best.step + (want === 'cart' ? 2 : 0));
    this.settle(true);
    const home = tile.handle.home;
    this.ctx.tw.kill(tile.node);
    void this.ctx.tw.to(tile.node, { x: home.x, y: home.y }, { duration: 0.15 });
    return true;
  }

  private undo() {
    if (this.busy || this.finished) return;
    const prev = this.history.pop();
    if (!prev) return;
    this.board = prev;
    this.glow = {};
    this.trace = null;
    this.settle(true);
  }

  private clear() {
    if (this.busy || this.finished) return;
    if (!this.history.length && this.round.puzzle.jobs.every((j) => stepOf(this.board, j.id) < 0)) return;
    this.pushHistory();
    this.board = emptyBoard(this.round.puzzle);
    this.glow = {};
    this.trace = null;
    this.settle(true);
  }

  /** Hint: the best next placement, a job to send back, or "this plan works". A placement or send-back is a counted hint. */
  private showHint() {
    if (this.busy || this.finished) return;
    const p = this.round.puzzle;
    const h = hint(p, this.board);
    this.glow = {};
    if (h.kind === 'run') {
      this.glow = { run: true };
      sfx.pop(6);
      void this.ctx.say('village-planner.works' as LineId);
      return;
    }
    hinted(this.tally);
    sfx.pop(6);
    if (h.kind === 'put') {
      this.glow = { job: h.job, slot: [rowOf(jobById(p, h.job)), h.step] };
      void this.ctx.say('village-planner.put' as LineId, { job: jobById(p, h.job).name, step: h.step + 1 });
    } else {
      this.glow = { job: h.job };
      void this.ctx.say('village-planner.back' as LineId, {
        job: jobById(p, h.job).name,
        needs: jobById(p, h.needs).name,
      });
    }
  }

  /** Play the plan step by step; the first job that runs before what it needs stops it. */
  private async run() {
    if (this.busy || this.finished) return;
    const p = this.round.puzzle;
    if (!isComplete(p, this.board)) {
      sfx.tick();
      this.glow = { tray: true };
      void this.ctx.say('village-planner.place' as LineId);
      return;
    }
    this.busy = true;
    this.glow = {};
    this.trace = null;
    this.done.clear();
    this.tiles.forEach((t) => t.handle.cancel());
    this.refresh();
    const conflict = firstConflict(p, this.board);
    const last = conflict ? conflict.step : stepsUsed(this.board) - 1;
    for (let t = 0; t <= last; t++) {
      this.cursor = t;
      if (conflict && t === conflict.step) break;
      for (const id of [this.board.bench[t], this.board.cart[t]]) if (id) this.done.add(id);
      this.tripsShown = countJourneys(p, {
        bench: this.board.bench,
        cart: this.board.cart.map((x, i) => (i <= t ? x : null)),
      });
      this.refresh();
      sfx.pop(t + 2);
      await this.ctx.tw.wait(STEP_TIME);
      if (!this.ctx.alive) return;
    }
    if (conflict) {
      this.trace = { a: conflict.job, b: conflict.needs };
      this.tripsShown = null;
      this.refresh();
      sfx.boing();
      const key = boardKey(this.board);
      let due = false;
      if (!this.failed.has(key)) {
        this.failed.add(key);
        due = missEvery(this.tally);
      }
      void this.ctx.say('village-planner.wait' as LineId, {
        job: jobById(p, conflict.job).name,
        needs: jobById(p, conflict.needs).name,
      });
      this.cursor = -1;
      this.done.clear();
      this.busy = false;
      this.refresh();
      if (due) this.showHint();
      return;
    }
    this.cursor = -1;
    const trips = countJourneys(p, this.board);
    this.tripsShown = trips;
    this.refresh();
    sfx.tada();
    if (trips <= p.minTrips) {
      void this.ctx.say('village-planner.trips' as LineId, { trips });
      return this.complete();
    }
    // The card waits for the line, so the caption bubble is gone before the buttons appear.
    await this.ctx.say('village-planner.more' as LineId);
    if (!this.ctx.alive) return;
    this.openCard(trips);
  }

  private tripNames(): string {
    const p = this.round.puzzle;
    const names: string[] = [];
    let at = '';
    for (const id of this.board.cart) {
      if (!id) continue;
      const pl = PLACE_NAME[jobById(p, id).place];
      if (pl !== at) names.push(pl);
      at = pl;
    }
    return names.join(' › ');
  }

  private openCard(trips: number) {
    this.cardOpen = true;
    this.buildCard(trips);
    this.cardLayer.visible = true;
  }

  private buildCard(trips: number) {
    this.cardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const L = this.L;
    const panel = new Graphics()
      .roundRect(L.card.x, L.card.y, L.card.w, L.card.h, 26)
      .fill(cream)
      .stroke({ width: 6, color: 0xb59b66 });
    panel.eventMode = 'static';
    this.cardLayer.addChild(panel);
    const text = label(
      `${this.tripNames()} · ${trips} trips\nDone in ${trips} trips: a ${this.round.puzzle.minTrips}-trip plan also works!`,
      26,
      ink,
    );
    text.position.set(L.cardText.x, L.cardText.y);
    this.cardLayer.addChild(text);
    const btn = (
      spot: Spot,
      name: string,
      icon: Container | null,
      sw: typeof swatch.green,
      fn: () => void,
    ) => {
      const b = new Container();
      b.addChild(finishArt({ w: L.cardButton.w, h: L.cardButton.h, corner: 30 }, sw));
      const t = label(name, 30, ink);
      if (icon) {
        icon.scale.set(0.8);
        icon.x = -t.width / 2 - 30;
        t.x = 24;
      }
      b.addChild(t);
      if (icon) b.addChild(icon);
      b.position.set(spot.x, spot.y);
      onTap(b, fn, { cooldown: 400 });
      b.hitArea = {
        contains: (x: number, y: number) =>
          Math.abs(x) <= L.cardButton.w / 2 && Math.abs(y) <= L.cardButton.h / 2,
      };
      this.cardLayer.addChild(b);
    };
    btn(L.cardButtons[0], 'Done', doneIcon(), swatch.green, () => this.cardDone());
    btn(L.cardButtons[1], 'Try fewer trips', null, swatch.white, () => this.cardTry());
  }

  private layoutCard() {
    if (this.cardOpen) this.buildCard(countJourneys(this.round.puzzle, this.board));
  }

  private closeCard() {
    this.cardOpen = false;
    this.cardLayer.visible = false;
    this.cardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  private cardDone() {
    if (!this.cardOpen) return;
    this.closeCard();
    this.complete();
  }

  /** Keep the plan on the board for another go at fewer trips. Free. */
  private cardTry() {
    if (!this.cardOpen) return;
    this.closeCard();
    this.tripsShown = null;
    this.done.clear();
    this.busy = false;
    this.refresh();
  }

  private complete() {
    this.finished = true;
    this.refresh();
    void this.ctx.say('village-planner.done' as LineId);
    void this.ctx.tw.wait(1.2).then(() => {
      if (!this.ctx.alive) return;
      this.ctx.finish(tally(this.tally));
    });
  }

  update(dt: number) {
    this.time += dt;
    const L = this.L;
    const g = this.fx.clear();
    const pulse = 4 + Math.sin(this.time * 6) * 3;
    const ring = (x: number, y: number, size: number, color: number) =>
      g
        .roundRect(
          x - size / 2 - 8 - pulse,
          y - size / 2 - 8 - pulse,
          size + 16 + 2 * pulse,
          size + 16 + 2 * pulse,
          22,
        )
        .stroke({ width: 7, color });
    if (this.cursor >= 0) {
      const x = L.bench[this.cursor].x;
      g.roundRect(
        x - L.slot / 2 - 4,
        L.bench[0].y - L.slot / 2 - 6,
        L.slot + 8,
        L.cart[0].y - L.bench[0].y + L.slot + 12,
        18,
      ).stroke({
        width: 6,
        color: swatch.orange.fill,
      });
      const cartId = this.board.cart[this.cursor];
      this.cartIcon.visible = !!cartId;
      this.cartIcon.position.set(x + 28, L.cart[0].y + 34);
    } else this.cartIcon.visible = false;
    if (this.glow.job && !this.finished) {
      const t = this.tiles.get(this.glow.job);
      if (t) ring(t.node.x, t.node.y, L.tile, swatch.yellow.line);
    }
    if (this.glow.slot) {
      const s = this.slotAt(this.glow.slot[0], this.glow.slot[1]);
      ring(s.x, s.y, L.slot, swatch.yellow.line);
    }
    if (this.glow.run)
      g.circle(L.buttons[3].x, L.buttons[3].y, L.button / 2 + 10 + pulse).stroke({
        width: 7,
        color: swatch.yellow.line,
      });
    if (this.glow.tray) {
      this.tiles.forEach((t) => {
        if (stepOf(this.board, t.id) < 0) ring(t.node.x, t.node.y, L.tile, swatch.yellow.line);
      });
    }
    this.done.forEach((id) => {
      const t = this.tiles.get(id);
      if (!t) return;
      const x = t.node.x + L.tile / 2 - 14;
      const y = t.node.y + L.tile / 2 - 14;
      g.circle(x, y, 17).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      g.moveTo(x - 8, y)
        .lineTo(x - 2, y + 7)
        .lineTo(x + 9, y - 7)
        .stroke({ width: 4, color: 0xffffff, cap: 'round', join: 'round' });
    });
    if (this.trace) {
      const a = this.tiles.get(this.trace.a);
      const b = this.tiles.get(this.trace.b);
      if (a && b) {
        const wob = Math.sin(this.time * 24) * 3;
        g.moveTo(b.node.x, b.node.y)
          .lineTo(a.node.x + wob, a.node.y)
          .stroke({ width: 8, color: swatch.red.fill, cap: 'round' });
        ring(a.node.x, a.node.y, L.tile, swatch.red.fill);
        ring(b.node.x, b.node.y, L.tile, swatch.red.fill);
      }
    }
    this.shake.forEach((left, id) => {
      const t = this.tiles.get(id);
      const next = left - dt;
      if (!t) return this.shake.delete(id);
      if (next <= 0) {
        this.shake.delete(id);
        t.node.rotation = 0;
      } else {
        this.shake.set(id, next);
        t.node.rotation = Math.sin(this.time * 50) * 0.08 * (next / 0.4);
      }
    });
  }

  /** The ghost finger: drag each job to its place in the fewest-trips plan, then tap Run plan. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.cardOpen) return null;
    const p = this.round.puzzle;
    const plan = referencePlan(p);
    for (const j of [...p.jobs].sort((a, b) => stepOf(plan, a.id) - stepOf(plan, b.id))) {
      const step = stepOf(plan, j.id);
      const row = rowOf(j);
      if (this.board[row][step] === j.id) continue;
      const occupant = this.board[row][step];
      if (occupant)
        return {
          drag: { on: this.tiles.get(occupant)!.node },
          to: {
            on: this.trayZone,
            x: this.L.trayZone.x + this.L.trayZone.w / 2,
            y: this.L.trayZone.y + this.L.trayZone.h / 2,
          },
          pause: 0.35,
        };
      return { drag: { on: this.tiles.get(j.id)!.node }, to: { on: this.slots[row][step] }, pause: 0.35 };
    }
    return { tap: { on: this.buttons[3] }, pause: 0.6 };
  }

  destroy() {
    this.tiles.forEach((t) => t.handle.destroy());
    this.ctx.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'village-planner',
  name: 'Village Planner',
  titleLine: 'village-planner.title',
  region: 'cozy-village',
  challenge: 'logic',
  skills: ['planning', 'dependency reasoning'],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint:
    'One person places the bench jobs and the other schedules the cart stops, then check whether any job waits on another.',
  offScreen:
    'Pick two errands in different rooms or shops and one tool you have to share, and decide which order makes the fewest back-and-forth trips.',
  hubIcon: () => new WigglyIcon(plannerPicture()),
  touchDemo: true,
  upright: true,
  sticker: () => plannerSticker(),
  create: (ctx) => new VillagePlanner(ctx),
};
