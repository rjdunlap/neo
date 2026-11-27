import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BOARD_H,
  BOARD_W,
  BUTTON,
  DROP_Y,
  FLOOR,
  LAST_SIZE,
  LEVELS,
  SIZES,
  STEP,
  canDrop,
  clampX,
  clonePond,
  describeLevel,
  drop,
  emptyPond,
  hintDrop,
  isStill,
  makeRound,
  planFor,
  pondLayout,
  step,
  type Plan,
  type Pond,
  type PondEvent,
  type Round,
} from './logic';

const INSTRUCT: Record<number, LineId> = {
  1: 'pond-merge.instruct-1',
  2: 'pond-merge.instruct-2',
  3: 'pond-merge.instruct-3',
};

// ---- Art: every size is its own shape and colour, so size is never colour alone ----

const BODY = [
  cream,
  swatch.yellow.fill,
  swatch.orange.light,
  swatch.green.fill,
  swatch.blue.light,
  0xffffff,
] as const;
const LINE = [
  swatch.orange.line,
  swatch.yellow.line,
  swatch.orange.line,
  swatch.green.line,
  swatch.blue.line,
  swatch.pink.line,
] as const;

/** A friend of one size, centred on (0, 0), filling its collision circle. */
function friendArt(size: number): Container {
  const r = SIZES[size].r;
  const g = new Graphics();
  const line = { width: Math.max(3, r / 12), color: LINE[size] };
  if (size === 0) {
    g.ellipse(0, 0, r * 0.88, r)
      .fill(BODY[0])
      .stroke(line);
    for (const [x, y] of [
      [-0.3, -0.35],
      [0.25, 0.1],
      [-0.1, 0.5],
    ])
      g.circle(x * r, y * r, r * 0.11).fill(swatch.orange.light);
    return new Container().addChild(g);
  }
  if (size === LAST_SIZE) {
    // The swan's neck and crest rise above the body, inside its circle.
    g.moveTo(r * 0.1, -r * 0.2)
      .bezierCurveTo(r * 0.9, -r * 0.5, r * 0.5, -r * 1.0, r * 0.15, -r * 0.8)
      .stroke({ width: r * 0.3, color: 0xffffff, cap: 'round' });
  }
  g.circle(0, 0, r * 0.94)
    .fill(BODY[size])
    .stroke(line);
  // A wing.
  g.ellipse(-r * 0.15, r * 0.2, r * 0.5, r * 0.3).fill({ color: LINE[size], alpha: 0.25 });
  // The crest grows with the size: tufts on a chick, a cap on a duck, a crown on a swan.
  if (size <= 2)
    for (let k = 0; k < size + 1; k++)
      g.circle((k - size / 2) * r * 0.2, -r * 0.92, r * 0.09).fill(LINE[size]);
  else if (size === 3)
    g.arc(0, 0, r * 0.94, Math.PI * 1.15, Math.PI * 1.85).stroke({
      width: r * 0.18,
      color: swatch.green.line,
    });
  else if (size === 4) g.ellipse(r * 0.2, -r * 0.9, r * 0.28, r * 0.12).fill(swatch.blue.line);
  else
    g.poly([
      -r * 0.2,
      -r * 0.82,
      -r * 0.1,
      -r * 1.0,
      0,
      -r * 0.85,
      r * 0.1,
      -r * 1.0,
      r * 0.2,
      -r * 0.82,
    ]).fill(swatch.yellow.fill);
  // Eye and bill.
  const bill = size >= 4 ? swatch.red.fill : swatch.orange.fill;
  g.poly([r * 0.5, -r * 0.02, r * (size >= 3 ? 0.98 : 0.8), r * 0.08, r * 0.5, r * 0.2]).fill(bill);
  g.circle(r * 0.28, -r * 0.2, Math.max(3, r * 0.1)).fill(ink);
  return new Container().addChild(g);
}

function buttonArt(kind: 'takeBack' | 'hint'): Container {
  const { w, h } = BUTTON;
  const color = kind === 'hint' ? 'yellow' : 'blue';
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2 + 5, w, h, 24)
    .fill(swatch[color].line)
    .roundRect(-w / 2, -h / 2, w, h, 24)
    .fill(swatch[color].fill)
    .stroke({ width: 4, color: swatch[color].line });
  const icon = new Graphics();
  if (kind === 'takeBack') {
    icon
      .moveTo(14, 18)
      .quadraticCurveTo(30, -18, -8, -16)
      .stroke({ width: 9, color: 0xffffff, cap: 'round' });
    icon.poly([-6, -34, -30, -14, -4, 0]).fill(0xffffff);
  } else {
    icon
      .circle(0, -8, 20)
      .fill(0xffffff)
      .roundRect(-10, 12, 20, 12, 4)
      .fill(swatch.yellow.line)
      .moveTo(-6, -8)
      .lineTo(0, 0)
      .lineTo(6, -8)
      .stroke({ width: 3, color: swatch.yellow.line });
  }
  const c = new Container();
  c.addChild(g, icon);
  c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  return c;
}

interface Shown {
  node: Container;
  size: number;
  /** Seconds left of the pop that follows a merge. */
  pop: number;
}
interface Bubble {
  node: Container;
  t: number;
}
interface Snapshot {
  pond: Pond;
  index: number;
  quiet: number;
}

/** How long a merged friend swells. */
const POP_TIME = 0.35;
const BUBBLE_TIME = 0.9;
/** The most fixed steps run in one frame, so a stalled tab does not spend a long time catching up. */
const MAX_STEPS = 12;

class PondMerge implements Game {
  private readonly root = new Container();
  private readonly back: Backdrop;
  private readonly board = new Container();
  private readonly basin = new Graphics();
  private readonly guide = new Graphics();
  private readonly friends = new Container();
  private readonly ghost = new Container();
  private readonly held = new Container();
  private readonly next = new Container();
  private readonly strip = new Container();
  private readonly stripIcons: Container[] = [];
  private readonly ring = new Graphics();
  private readonly input = new Container();
  private readonly buttons = { takeBack: buttonArt('takeBack'), hint: buttonArt('hint') };
  private readonly plan: Plan;
  private readonly round: Round;
  private pond: Pond;
  private index = 0;
  private history: Snapshot[] = [];
  private shown = new Map<number, Shown>();
  private bubbles: Bubble[] = [];
  private heldSize = -1;
  private heldX = BOARD_W / 2;
  private grab: number | null = null;
  private queued: number | null = null;
  private acc = 0;
  private clock = 0;
  /** Drops in a row with no merge; the ghost shows by itself after `dropsSoft`. */
  private quiet = 0;
  private autoHinted = false;
  private hints = 0;
  private ghostShown = false;
  private told = { pop: false, lift: false };
  private done = false;
  private finishing = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.round = makeRound(this.plan, ctx.rng);
    this.pond = emptyPond(this.round.goal);
    this.back = ctx.track(
      new Backdrop(
        {
          sky: [0xc8f0ec, 0xfff6e0],
          hills: [0xa9e0d6, 0xc5e7a8, 0xa8dc8f],
          horizon: 0.5,
          clouds: 2,
          sun: true,
          seed: 211,
        },
        ctx.view,
      ),
    );
    this.back.eventMode = 'none';
    for (const g of [
      this.basin,
      this.guide,
      this.friends,
      this.ghost,
      this.held,
      this.next,
      this.strip,
      this.ring,
    ])
      g.eventMode = 'none';
    this.ghost.visible = false;
    this.ghost.alpha = 0.55;
    this.input.eventMode = 'static';
    this.input.hitArea = new Rectangle(-60, -40, BOARD_W + 120, BOARD_H + 40);
    this.input.cursor = 'pointer';
    this.input.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.input.on('globalpointermove', (e: FederatedPointerEvent) => this.move(e));
    this.input.on('pointerup', (e: FederatedPointerEvent) => this.up(e.pointerId));
    this.input.on('pointerupoutside', (e: FederatedPointerEvent) => this.up(e.pointerId));
    this.input.on('pointercancel', () => this.cancel());
    ctx.listen(window, 'pointerup', (e) => this.up(e.pointerId));
    ctx.listen(window, 'pointercancel', () => this.cancel());
    onTap(this.buttons.takeBack, () => this.takeBack(), { cooldown: 250 });
    onTap(this.buttons.hint, () => this.askForHint(), { cooldown: 300 });
    this.board.addChild(this.basin, this.guide, this.friends, this.ghost, this.held, this.input);
    this.buildStrip();
    this.root.addChild(
      this.back,
      this.strip,
      this.board,
      this.next,
      this.buttons.takeBack,
      this.buttons.hint,
    );
    ctx.stage.addChild(this.root);
    this.drawBasin();
    this.resize(ctx.view);
  }

  start() {
    this.loadHeld();
    void this.ctx.instruct(INSTRUCT[this.plan.level] ?? INSTRUCT[1]);
  }

  // ---- Drawing ----

  private drawBasin() {
    const g = this.basin.clear();
    // The water, in a round-bottomed bowl; the solver's floor is flat, so the bowl's curve only shows beside the walls.
    g.roundRect(-8, DROP_Y + 40, BOARD_W + 16, FLOOR - DROP_Y - 40 + 22, 46)
      .fill({ color: swatch.blue.light, alpha: 0.75 })
      .stroke({ width: 6, color: swatch.blue.line });
    g.roundRect(-8, FLOOR - 60, BOARD_W + 16, 82, 40).fill({ color: swatch.blue.fill, alpha: 0.18 });
    for (const [x, y] of [
      [60, FLOOR + 6],
      [340, FLOOR - 4],
    ])
      g.ellipse(x, y, 34, 9).fill({ color: swatch.green.fill, alpha: 0.7 });
  }

  private buildStrip() {
    for (let k = 0; k <= LAST_SIZE; k++) {
      const icon = friendArt(k);
      icon.scale.set((8 + k * 3.4) / SIZES[k].r);
      this.stripIcons.push(icon);
      this.strip.addChild(icon);
    }
    this.strip.addChild(this.ring);
  }

  private placeStrip(l: ReturnType<typeof pondLayout>) {
    this.stripIcons.forEach((icon, k) =>
      icon.position.set(l.strip.x + l.strip.dx * k, l.strip.y + l.strip.dy * k),
    );
    const goal = this.round.goal;
    this.ring
      .clear()
      .circle(l.strip.x + l.strip.dx * goal, l.strip.y + l.strip.dy * goal, 8 + goal * 3.4 + 8)
      .stroke({ width: 5, color: swatch.yellow.fill });
  }

  private makeShown(size: number): Shown {
    const node = new Container();
    node.addChild(friendArt(size));
    this.friends.addChild(node);
    return { node, size, pop: 0 };
  }

  private nextSize(): number {
    return this.round.items[this.index % this.round.items.length];
  }

  /** The friend waiting at the top, and the one after it peeking at the side. */
  private loadHeld() {
    this.heldSize = this.nextSize();
    this.held.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.held.addChild(friendArt(this.heldSize));
    this.heldX = clampX(this.heldSize, this.heldX);
    this.next.removeChildren().forEach((c) => c.destroy({ children: true }));
    const peek = friendArt(this.round.items[(this.index + 1) % this.round.items.length]);
    peek.scale.set(0.55);
    this.next.addChild(peek);
    this.drawGuide();
  }

  private drawGuide() {
    const g = this.guide.clear();
    if (this.finishing || this.done) return;
    const r = SIZES[this.heldSize]?.r ?? 22;
    for (let y = DROP_Y + r + 14; y < FLOOR - 10; y += 26)
      g.circle(this.heldX, y, 3).fill({ color: ink, alpha: 0.18 });
  }

  // ---- Touch ----

  private local(e: FederatedPointerEvent) {
    return this.board.toLocal(e.global);
  }

  private down(e: FederatedPointerEvent) {
    if (this.grab !== null || this.finishing || this.done || palmOnGlass()) return;
    this.grab = e.pointerId;
    this.queued = null;
    this.setHeldX(this.local(e).x);
    sfx.tick();
  }

  private move(e: FederatedPointerEvent) {
    if (this.grab !== e.pointerId) return;
    this.setHeldX(this.local(e).x);
  }

  private up(id: number) {
    if (this.grab === null || this.grab !== id) return;
    this.grab = null;
    this.release();
  }

  private cancel() {
    this.grab = null;
    this.queued = null;
  }

  private setHeldX(x: number) {
    this.heldX = clampX(this.heldSize, x);
    this.drawGuide();
  }

  /** Let go: drop now, or at the end of the short gap after the last drop. */
  private release() {
    if (this.finishing || this.done) return;
    if (canDrop(this.pond)) this.dropHeld(this.heldX);
    else this.queued = this.heldX;
  }

  private dropHeld(x: number) {
    this.history.push({ pond: clonePond(this.pond), index: this.index, quiet: this.quiet });
    const events = drop(this.pond, this.heldSize, x);
    sfx.pop(2 + this.heldSize);
    this.index++;
    this.quiet++;
    this.clearGhost();
    this.apply(events);
    this.loadHeld();
    if (!this.autoHinted && this.quiet >= this.round.dropsSoft) {
      this.autoHinted = true;
      this.hints++;
      this.showGhost();
    }
  }

  // ---- Help ----

  /** Show a ghost drop for the friend at the top: the pause sheet's hint and the Hint button. */
  askForHint() {
    if (this.finishing || this.done) return;
    this.hints++;
    this.showGhost();
    void this.ctx.say('pond-merge.hint');
  }

  private showGhost() {
    const x = hintDrop(this.pond, this.heldSize);
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.ghost.addChild(friendArt(this.heldSize));
    this.ghost.position.set(x, DROP_Y);
    this.ghost.visible = true;
    this.ghostShown = true;
  }

  private clearGhost() {
    this.ghost.visible = false;
    this.ghostShown = false;
  }

  /** Free, and never counted: return to the pond before the last drop. */
  private takeBack() {
    if (this.finishing || this.done) return;
    const snap = this.history.pop();
    if (!snap) {
      this.buttons.takeBack.scale.set(0.9);
      return;
    }
    this.pond = snap.pond;
    this.index = snap.index;
    this.quiet = snap.quiet;
    this.queued = null;
    this.clearGhost();
    for (const s of this.shown.values()) s.node.destroy({ children: true });
    this.shown.clear();
    this.sync(false);
    this.loadHeld();
    sfx.whoosh();
    void this.ctx.say('pond-merge.take-back');
  }

  // ---- The pond ----

  private apply(events: PondEvent[]) {
    let lifted = false;
    for (const e of events) {
      if (e.kind === 'merge') {
        sfx.marimba(e.size + 1);
        this.quiet = 0;
        this.ctx.particles.burst(this.board.x + e.x, this.board.y + e.y, {
          colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill],
          count: 8 + e.size * 3,
        });
        if (!this.told.pop) {
          this.told.pop = true;
          void this.ctx.say('pond-merge.pop');
        }
      } else if (e.kind === 'lift') {
        lifted = true;
        sfx.whoosh();
        if (!this.told.lift) {
          this.told.lift = true;
          void this.ctx.say('pond-merge.lift');
        }
      } else if (e.kind === 'goal') void this.win();
    }
    this.sync(lifted);
  }

  /** Make the display match the pond: new friends appear, merged ones change picture and swell, lifted ones float up as bubbles. */
  private sync(lifted: boolean) {
    const alive = new Set<number>();
    for (const p of this.pond.pieces) {
      alive.add(p.id);
      let s = this.shown.get(p.id);
      if (!s) {
        s = this.makeShown(p.size);
        this.shown.set(p.id, s);
      } else if (s.size !== p.size) {
        s.node.removeChildren().forEach((c) => c.destroy({ children: true }));
        s.node.addChild(friendArt(p.size));
        s.size = p.size;
        s.pop = POP_TIME;
      }
      s.node.position.set(p.x, p.y);
      const k = s.pop > 0 ? 1 + 0.3 * Math.sin((Math.PI * s.pop) / POP_TIME) : 1;
      s.node.scale.set(k);
    }
    for (const [id, s] of this.shown) {
      if (alive.has(id)) continue;
      this.shown.delete(id);
      if (lifted) {
        s.node.alpha = 0.9;
        this.bubbles.push({ node: s.node, t: 0 });
      } else s.node.destroy({ children: true });
    }
  }

  private async win() {
    if (this.finishing) return;
    this.finishing = true;
    this.clearGhost();
    this.drawGuide();
    this.held.visible = false;
    sfx.tada();
    const big = this.pond.pieces.find((p) => p.size >= this.round.goal);
    if (big)
      this.ctx.particles.burst(this.board.x + big.x, this.board.y + big.y, {
        colors: [swatch.yellow.fill, swatch.orange.fill, swatch.pink.fill, swatch.blue.fill],
        count: 40,
      });
    void this.ctx.say('pond-merge.done');
    await this.ctx.tw.wait(1.8);
    if (!this.ctx.alive) return;
    this.done = true;
    this.ctx.finish({ misses: 0, hints: this.hints });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.finishing && this.done) return;
    this.acc = Math.min(this.acc + dt, MAX_STEPS * STEP);
    const events: PondEvent[] = [];
    let steps = 0;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      events.push(...step(this.pond));
      steps++;
    }
    for (const s of this.shown.values()) s.pop = Math.max(0, s.pop - dt);
    if (steps || events.length) this.apply(events);
    else this.sync(false);
    if (this.queued !== null && canDrop(this.pond) && !this.finishing) {
      const x = this.queued;
      this.queued = null;
      this.heldX = clampX(this.heldSize, x);
      this.dropHeld(this.heldX);
    }
    // The friend waiting at the top sways a little, dims while the last one is still falling clear, and follows the finger.
    const ready = canDrop(this.pond);
    this.held.alpha = ready ? 1 : 0.35;
    this.held.position.set(this.heldX + (this.grab === null ? 3 * Math.sin(this.clock * 2.2) : 0), DROP_Y);
    if (this.ghostShown) this.ghost.alpha = 0.45 + 0.2 * Math.sin(this.clock * 5);
    for (const b of this.bubbles) {
      b.t += dt;
      b.node.y -= 90 * dt;
      b.node.alpha = Math.max(0, 0.9 * (1 - b.t / BUBBLE_TIME));
    }
    this.bubbles = this.bubbles.filter((b) => {
      if (b.t < BUBBLE_TIME) return true;
      b.node.destroy({ children: true });
      return false;
    });
    for (const b of Object.values(this.buttons)) b.scale.set(Math.min(1, b.scale.x + dt * 3));
  }

  resize(v: View) {
    this.back.resize(v);
    const l = pondLayout(v);
    this.board.position.set(l.board.x, l.board.y);
    this.buttons.takeBack.position.set(l.takeBack.x, l.takeBack.y);
    this.buttons.hint.position.set(l.hint.x, l.hint.y);
    this.placeStrip(l);
    // The next friend waits beside the buttons (sideways) or above the board's corner (upright).
    if (v.upright) this.next.position.set(l.board.x + BOARD_W - 30, l.strip.y);
    else this.next.position.set(l.hint.x, l.board.y + 70);
  }

  /** Where the hint rule would drop the friend at the top (no hint is counted; the ghost finger and the browser suite use it). */
  hintX(): number {
    return hintDrop(this.pond, this.heldSize);
  }

  /** The ghost finger: put a finger on the friend at the top, slide to where the hint says, and let go. */
  autotouch(): TouchIntent | null {
    if (this.finishing || this.done || this.grab !== null || this.queued !== null) return null;
    if (!canDrop(this.pond) || !this.pond.pieces.every(isStill)) return null;
    const x = this.hintX();
    const at = (px: number) => ({ on: this.board, x: px, y: DROP_Y });
    return { trace: at(this.heldX), via: [at(x)], receiver: this.input, pause: 0.5 };
  }

  destroy() {
    this.grab = null;
    this.queued = null;
    this.finishing = true;
    this.done = true;
    this.root.destroy({ children: true });
  }
}

// ---- The hub icon and the sticker ----

function pondPicture(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(
    new Graphics()
      .ellipse(0, 20, 130, 40)
      .fill(swatch.blue.light)
      .stroke({ width: 5, color: swatch.blue.line })
      .ellipse(-70, 24, 20, 6)
      .fill({ color: swatch.green.fill, alpha: 0.8 }),
  );
  const swan = friendArt(5);
  swan.scale.set(0.6);
  swan.position.set(20, -22);
  const duckling = friendArt(rng.int(1, 2));
  duckling.scale.set(0.8);
  duckling.position.set(-70, -50);
  c.addChild(swan, duckling);
  return c;
}

class PondMergeIcon extends WigglyIcon {
  constructor() {
    const art = pondPicture(3);
    art.position.set(0, -40);
    super(art);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(
    new Graphics()
      .ellipse(0, 40, 110, 34)
      .fill(swatch.blue.light)
      .stroke({ width: 5, color: swatch.blue.line })
      .ellipse(rng.range(-60, 60), 48, 16, 5)
      .fill({ color: swatch.green.fill, alpha: 0.8 }),
  );
  const swan = friendArt(5);
  swan.scale.set(0.95);
  swan.position.set(rng.range(-20, 20), -10);
  c.addChild(swan);
  return c;
}

export const game: GameModule = {
  id: 'pond-merge',
  name: 'Pond Merge',
  titleLine: 'game.pond-merge',
  region: 'tinker-lab',
  challenge: 'space',
  skills: ['ordering', 'planning', 'revision'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.bubbles,
  upright: true,
  touchDemo: true,
  coplayHint: 'Guess which two will touch before you let go.',
  offScreen:
    'Sort a handful of coins, buttons or blocks from smallest to biggest, then line up what two of each would make.',
  hubIcon: () => new PondMergeIcon(),
  sticker,
  create: (ctx) => new PondMerge(ctx),
};
