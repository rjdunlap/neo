import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { wood } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { SAND, SAND_LINE, drawBucket, drawPail, flagArt, grainDot, invitationCard, paddleArt, sandPicture } from './art';
import {
  COLS, GRAINS, apply, botStep, describeLandscape, describeSand, hintAction, restart, sandLayout, startState,
  type SandAction, type SandEvent, type SandLayout, type SandResult, type SandState,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 3 },
};

const IDLE_SECONDS = 6;

class SandTable implements Game {
  readonly state: SandState;
  /** Heights as drawn: they ease toward the model's, so a settle looks like sliding. */
  private readonly disp: number[];
  private view: View;
  private lay: SandLayout;
  private readonly bg = new Sprite(gradientTexture(0xbfe8fb, 0xfdeec6));
  private readonly table = new Graphics();
  private readonly surface = new Graphics();
  private readonly rim = new Graphics();
  private readonly speckles: { x: number; y: number }[];
  private readonly fx = new Container();
  private readonly bucket = new Container();
  private readonly bucketArt = new Graphics();
  readonly bayNodes: Container[] = [];
  readonly paddleNodes: Container[] = [];
  readonly pailNode = new Container();
  private readonly pailArt = new Graphics();
  readonly flagNode = flagArt(130);
  private invitation: Container | null = null;
  private readonly sparkle = new Graphics();
  finished = false;
  private gone = false;
  private idle = 0;
  /** Actions taken, for the ghost finger's short round. */
  taken = 0;
  private spillSaid = false;
  private lastDrawnBucket = -1;
  private lastDrawnPail = -1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.state = startState(ctx.level, ctx.rng);
    this.disp = [...this.state.h];
    this.speckles = Array.from({ length: 90 }, () => ({ x: ctx.rng.next(), y: ctx.rng.next() }));
    this.lay = sandLayout(this.view, this.state.plan.bays.length);
    this.bucket.addChild(this.bucketArt);
    this.pailNode.addChild(this.pailArt);
    this.rim.eventMode = 'none';
    this.fx.eventMode = 'none';
    this.sparkle.eventMode = 'none';
    ctx.stage.addChild(this.bg, this.table, this.surface, this.rim, this.bucket, this.fx, this.sparkle);

    this.state.plan.bays.forEach((_, b) => {
      const bay = new Container();
      bay.eventMode = 'static';
      onTap(bay, () => this.touchBay(b), { cooldown: 60 });
      this.bayNodes.push(bay);
      const paddle = paddleArt(180, 100);
      onTap(paddle, () => this.touchPaddle(b), { cooldown: 60 });
      this.paddleNodes.push(paddle);
      ctx.stage.addChild(bay, paddle);
    });
    onTap(this.pailNode, () => this.touchPail(), { cooldown: 120 });
    onTap(this.flagNode, () => this.touchFlag(), { cooldown: 300 });
    this.flagNode.visible = false;
    this.pailNode.visible = false;
    ctx.stage.addChild(this.pailNode, this.flagNode);

    if (this.state.invite) {
      this.invitation = invitationCard(this.state.invite);
      ctx.stage.addChild(this.invitation);
    }
    this.layout(this.view);
  }

  start() {
    void this.ctx.instruct(`sand.instruct.${this.state.plan.level}` as 'sand.instruct.1');
    if (this.state.invite) void this.ctx.tw.wait(3.2).then(() => { if (!this.gone && !this.finished) void this.ctx.say(`sand.invite.${this.state.invite}` as 'sand.invite.tall'); });
  }

  resize(v: View) {
    this.view = v;
    this.layout(v);
  }

  destroy() {
    this.gone = true;
  }

  // ---- Layout and drawing ---------------------------------------------------------------------------------------

  private layout(v: View) {
    this.lay = sandLayout(v, this.state.plan.bays.length);
    const l = this.lay;
    this.bg.width = v.w;
    this.bg.height = v.h;
    const t = l.tray;
    this.table
      .clear()
      .roundRect(t.x - 30, t.y - 26, t.w + 60, t.h + 52, 30)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line })
      .roundRect(t.x - 4, t.y - 4, t.w + 8, t.h + 8, 10)
      .fill(0xfff8e6);
    this.bucket.position.set(l.bucket.x, l.bucket.y);
    this.state.plan.bays.forEach((_, b) => {
      const r = l.bays[b];
      const bay = this.bayNodes[b];
      bay.position.set(r.x + r.w / 2, r.y + r.h / 2);
      bay.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      const p = l.paddles[b];
      this.paddleNodes[b].position.set(p.x + p.w / 2, p.y + p.h / 2);
      this.paddleNodes[b].scale.set(p.w / 180);
    });
    this.pailNode.position.set(l.pail.x + l.pail.w / 2, l.pail.y + l.pail.h / 2);
    this.pailNode.hitArea = new Rectangle(-l.pail.w / 2, -l.pail.h / 2, l.pail.w, l.pail.h);
    this.flagNode.position.set(l.flag.x + l.flag.w / 2, l.flag.y + l.flag.h / 2);
    this.flagNode.hitArea = new Rectangle(-l.flag.w / 2, -l.flag.h / 2, l.flag.w, l.flag.h);
    this.invitation?.position.set(l.bucket.x + 190, l.bucket.y - 10);
    this.lastDrawnBucket = -1;
    this.lastDrawnPail = -1;
    this.drawSurface();
  }

  /** x of a column's centre, and y of the sand's top over it at `h` grains. */
  private colX = (c: number) => this.lay.tray.x + (c + 0.5) * this.lay.colW;
  private topY = (h: number) => this.lay.tray.y + this.lay.tray.h - h * this.lay.rowH;

  private drawSurface() {
    const l = this.lay;
    const t = l.tray;
    const g = this.surface.clear();
    const pts = this.disp.map((h, c) => ({ x: this.colX(c), y: this.topY(h) }));
    g.moveTo(t.x, t.y + t.h);
    g.lineTo(t.x, pts[0].y);
    g.lineTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      g.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    g.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    g.lineTo(t.x + t.w, pts[pts.length - 1].y);
    g.lineTo(t.x + t.w, t.y + t.h);
    g.closePath().fill(SAND).stroke({ width: 4, color: SAND_LINE, join: 'round' });
    for (const s of this.speckles) {
      const x = t.x + s.x * t.w;
      const col = Math.min(COLS - 1, Math.floor(s.x * COLS));
      const y = t.y + t.h - s.y * (this.disp[col] * l.rowH);
      if (this.disp[col] * l.rowH > 8) g.circle(x, y, 2.2).fill({ color: SAND_LINE, alpha: 0.55 });
    }
    // The tray's front lip, so the sand sits inside it.
    this.rim.clear().roundRect(t.x - 4, t.y + t.h - 10, t.w + 8, 16, 6).fill(wood.light).stroke({ width: 4, color: wood.line });
    // Rim marks at the top of the tray: the line a column cannot pass.
    this.rim.moveTo(t.x, t.y).lineTo(t.x + t.w, t.y).stroke({ width: 3, color: SAND_LINE, alpha: 0.35 });
  }

  update(dt: number) {
    let moving = false;
    const k = Math.min(1, dt * 9);
    for (let c = 0; c < COLS; c++) {
      const d = this.state.h[c] - this.disp[c];
      if (Math.abs(d) > 0.004) { this.disp[c] += d * k; moving = true; } else this.disp[c] = this.state.h[c];
    }
    if (moving) this.drawSurface();
    if (this.lastDrawnBucket !== this.state.bucket) {
      this.lastDrawnBucket = this.state.bucket;
      drawBucket(this.bucketArt, this.state.bucket / GRAINS);
    }
    if (this.lastDrawnPail !== this.state.pail) {
      this.lastDrawnPail = this.state.pail;
      drawPail(this.pailArt, this.state.pail);
      this.pailNode.visible = this.state.pail > 0;
    }
    if (!this.finished) {
      this.idle += dt;
      if (this.idle >= IDLE_SECONDS && this.state.bucket > 0) {
        this.idle = 0;
        const bay = this.lay.bays[Math.floor(this.lay.bays.length / 2)];
        this.ctx.particles.burst(bay.x + bay.w / 2, this.lay.tray.y + this.lay.tray.h * 0.4, { kind: 'dot', colors: [0xfff3a0, 0xffffff], count: 8, speed: [40, 100], gravity: 0, life: [0.5, 0.8] });
      }
    }
  }

  // ---- Touches --------------------------------------------------------------------------------------------------

  private touchBay(b: number) {
    if (this.finished) return;
    this.run({ pour: b });
  }

  private touchPaddle(b: number) {
    if (this.finished) return;
    this.run({ scoop: b });
  }

  private touchPail() {
    if (this.finished || this.state.pail <= 0) return;
    this.run({ pail: true });
  }

  private touchFlag() {
    if (this.finished || !this.state.flag) return;
    void this.finale();
  }

  /** Resolve a tap at once and show it. Every tap answers: nothing waits and nothing is ignored. */
  private run(a: SandAction) {
    this.idle = 0;
    this.taken++;
    const wasUp = this.state.flag;
    const r = apply(this.state, a);
    if ('pour' in a) this.showPour(a.pour, r);
    else if ('scoop' in a) this.showScoop(a.scoop, r);
    else this.showPail(r);
    if (this.state.flag && !wasUp) this.raiseFlag();
  }

  private tip(towardX: number) {
    const { tw } = this.ctx;
    tw.kill(this.bucket);
    const dir = Math.sign(towardX - this.lay.bucket.x) || 1;
    void tw.to(this.bucket, { rotation: dir * 0.45 }, { duration: 0.1, ease: ease.outQuad }).then(() => { if (!this.gone) void tw.to(this.bucket, { rotation: 0 }, { duration: 0.22, ease: ease.outBack }); });
  }

  private showPour(b: number, r: SandResult) {
    const bay = this.lay.bays[b];
    const cx = bay.x + bay.w / 2;
    sfx.whoosh();
    this.tip(cx);
    if (r.kind === 'empty') {
      sfx.knock();
      this.wiggle(this.paddleNodes);
      for (let i = 0; i < 4; i++) void this.grain(this.lay.bucket.x + (i - 1.5) * 12, this.lay.bucket.y + 50, this.lay.bucket.x + (i - 1.5) * 20, this.lay.bucket.y + 110, i * 0.08, 0.3, true);
      void this.ctx.say('sand.empty');
      return;
    }
    this.playEvents(r.events);
  }

  private showScoop(b: number, r: SandResult) {
    const node = this.paddleNodes[b];
    this.ctx.tw.kill(node.scale);
    const s = node.scale.x;
    node.scale.set(s * 0.9);
    void this.ctx.tw.to(node.scale, { x: s, y: s }, { duration: 0.25, ease: ease.outBack });
    sfx.brush();
    if (r.kind === 'empty') {
      void this.ctx.say('sand.nothing-here');
      return;
    }
    this.playEvents(r.events);
  }

  private showPail(r: SandResult) {
    sfx.sparkle();
    this.ctx.tw.kill(this.pailNode.scale);
    this.pailNode.scale.set(0.9);
    void this.ctx.tw.to(this.pailNode.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    for (let i = 0; i < Math.min(8, r.moved); i++) void this.grain(this.pailNode.x, this.pailNode.y - 20, this.lay.bucket.x, this.lay.bucket.y + 30, i * 0.06, 0.55, false);
    void this.ctx.say('sand.pail');
  }

  /** Grains falling, lifting and spilling, as the model's events list them; the drawn sand eases to the new heights by itself. */
  private playEvents(events: SandEvent[]) {
    let drop = 0;
    let slides = 0;
    let lift = 0;
    for (const e of events) {
      if (e.kind === 'drop') {
        const x = this.colX(e.col);
        const delay = drop++ * 0.13;
        const y = this.topY(this.state.h[e.col]) - 4;
        void this.grain(this.lay.bucket.x, this.lay.bucket.y + 55, x, y, delay, 0.32, false).then(() => !this.gone && sfx.pluck(2 + e.height * 1, 0.22));
      } else if (e.kind === 'slide') {
        if (slides++ < 2) void this.ctx.tw.wait(0.25 + slides * 0.08).then(() => !this.gone && sfx.tick());
      } else if (e.kind === 'lift') {
        const delay = lift++ * 0.13;
        void this.grain(this.colX(e.col), this.topY(this.disp[e.col]), this.lay.bucket.x, this.lay.bucket.y + 40, delay, 0.4, false);
      } else if (e.kind === 'spill') {
        void this.spill(e);
      }
    }
  }

  private async spill(e: Extract<SandEvent, { kind: 'spill' }>) {
    const l = this.lay;
    await this.ctx.tw.wait(0.45);
    if (this.gone) return;
    sfx.bell(10, 0.2);
    void this.grain(this.colX(e.col), l.tray.y, l.pail.x + l.pail.w / 2, l.pail.y + 20, 0, 0.45, false);
    if (e.first && !this.spillSaid) {
      this.spillSaid = true;
      void this.ctx.say('sand.spill');
    }
  }

  /** One grain tweened from one place to another. */
  private async grain(x0: number, y0: number, x1: number, y1: number, delay: number, seconds: number, fadeOut: boolean) {
    const { tw } = this.ctx;
    if (delay > 0) await tw.wait(delay);
    if (this.gone) return;
    const g = grainDot();
    g.position.set(x0, y0);
    this.fx.addChild(g);
    const fall = y1 >= y0;
    void tw.to(g, { x: x1 }, { duration: seconds, ease: ease.outQuad });
    if (!fall) {
      await tw.to(g, { y: Math.min(y0, y1) - 70 }, { duration: seconds * 0.45, ease: ease.outQuad });
      await tw.to(g, { y: y1 }, { duration: seconds * 0.55, ease: ease.inQuad });
    } else {
      await tw.to(g, { y: y1 }, { duration: seconds, ease: ease.inQuad });
    }
    if (fadeOut && !this.gone) await tw.to(g, { alpha: 0 }, { duration: 0.2 });
    if (!this.gone) g.destroy();
  }

  private wiggle(nodes: Container[]) {
    for (const n of nodes) {
      this.ctx.tw.kill(n);
      n.rotation = 0.08;
      void this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.4, ease: ease.outBack });
    }
  }

  private raiseFlag() {
    this.flagNode.visible = true;
    this.flagNode.scale.set(0.2);
    sfx.bell(8, 0.3);
    void this.ctx.tw.to(this.flagNode.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
    if (!this.finished) void this.ctx.say('sand.first-heap');
  }

  // ---- Finish ---------------------------------------------------------------------------------------------------

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    const { tw } = this.ctx;
    this.idle = 0;
    if (this.state.plan.show) await this.walk();
    else {
      [4, 5, 6, 8, 9].forEach((s, i) => void tw.wait(i * 0.12).then(() => !this.gone && sfx.pluck(s, 0.25)));
      this.ctx.particles.burst(this.lay.tray.x + this.lay.tray.w / 2, this.lay.tray.y + this.lay.tray.h / 2, { kind: 'dot', colors: [0xfff3a0, 0xffffff, SAND], count: 30, speed: [120, 320], gravity: 200, life: [0.6, 1] });
      await this.ctx.say('sand.done');
    }
    if (this.gone) return;
    this.ctx.pet.cheer();
    sfx.tada();
    await tw.wait(1.2);
    if (this.gone) return;
    this.ctx.finish({ misses: 0, hints: 0 });
  }

  /** Level 3's Show: the pet walks the landscape along the column tops, then names it. */
  private async walk() {
    const { tw } = this.ctx;
    const rig = this.ctx.companion();
    rig.scale.set(0.24);
    this.ctx.track(rig);
    this.ctx.stage.addChild(rig);
    const at = (c: number) => ({ x: this.colX(c), y: this.topY(this.state.h[c]) + 6 });
    rig.position.set(at(0).x - 60, at(0).y);
    for (let c = 0; c < COLS; c++) {
      if (this.gone) return;
      const p = at(c);
      sfx.pluck(3 + this.state.h[c], 0.16);
      await tw.to(rig, { x: p.x, y: p.y }, { duration: 0.24, ease: ease.outQuad });
    }
    await this.ctx.say(`sand.show.${describeLandscape(this.state.h)}` as 'sand.show.flat');
    this.ctx.untrack(rig);
    rig.destroy({ children: true });
  }

  // ---- Help -----------------------------------------------------------------------------------------------------

  /** The pause sheet's Show a hint: one useful action, really made, counting nothing. */
  askForHint() {
    if (this.finished) return;
    const a = hintAction(this.state);
    const target = 'pour' in a ? this.lay.bays[a.pour] : 'scoop' in a ? this.lay.paddles[a.scoop] : this.lay.pail;
    this.ctx.particles.burst(target.x + target.w / 2, target.y + target.h / 2, { kind: 'dot', colors: [0xfff3a0, 0xffffff], count: 14, speed: [60, 160], gravity: 0, life: [0.5, 0.9] });
    this.run(a);
  }

  /** Start again: the seeded tray and a full bucket, at once. */
  restart() {
    if (this.finished) return;
    restart(this.state);
    for (let c = 0; c < COLS; c++) this.disp[c] = this.state.h[c];
    this.fx.removeChildren().forEach((c) => c.destroy());
    this.drawSurface();
  }

  /** The ghost finger: a short round that ends with a visible change, then the flag. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const step = botStep(this.state, this.taken);
    if ('flag' in step) return this.state.flag ? { tap: { on: this.flagNode } } : null;
    if ('pour' in step) return { tap: { on: this.bayNodes[step.pour] } };
    if ('scoop' in step) return { tap: { on: this.paddleNodes[step.scoop] } };
    return { tap: { on: this.pailNode } };
  }
}

class SandIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const heap = sandPicture([0, 1, 2, 3, 4, 3, 2, 1, 0], false);
    heap.scale.set(0.7);
    heap.position.set(30, 20);
    const pail = new Graphics();
    drawPail(pail, 0);
    pail.scale.set(1.1);
    pail.position.set(-90, -10);
    c.addChild(heap, pail);
    super(c);
  }
}

/** A seeded little sand landscape with a shell on top. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const hs = Array.from({ length: 9 }, (_, i) => Math.max(0, 1 + Math.round(rng.next() * 2) + (i > 2 && i < 6 ? 1 : 0)));
  const c = sandPicture(hs, true);
  c.scale.set(0.6);
  c.position.y = 30;
  return c;
}

export const sandTable: GameModule = {
  id: 'sand-table',
  name: 'Sand Table',
  titleLine: 'game.sand-table',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'spatial', 'materials', 'making'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: describeSand,
  music: STYLES.paint,
  coplayHint: 'One taps a change in the sand; the other says (or points to) what changed. Then swap.',
  offScreen: 'A tray of dry sand, rice or oats and a scoop: pour a heap, scoop some away, and watch the sides slide.',
  hubIcon: () => new SandIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SandTable(ctx),
};
