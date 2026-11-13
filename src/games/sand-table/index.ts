import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { wood } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  MOVED,
  MOVED_LINE,
  SAND,
  SAND_LINE,
  answerPad,
  breezeButton,
  drawBreezeLines,
  replayButton,
  windmill,
  drawBucket,
  drawPail,
  flagArt,
  grainDot,
  invitationCard,
  paddleArt,
  sandPicture,
} from './art';
import {
  LEVELS,
  COLS,
  GRAINS,
  HOLLOW_HILL,
  answer,
  apply,
  botStep,
  breezeHint,
  gainedBays,
  liftedColumns,
  puff,
  describeLandscape,
  describeSand,
  hintAction,
  lapDone,
  restart,
  sandLayout,
  startState,
  type SandAction,
  type SandEvent,
  type SandLayout,
  type SandResult,
  type SandState,
} from './logic';

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
  /** Lap's level 1: the whole screen under the tray, so a touch on the sky, bucket or frame pours onto the one heap. */
  readonly anywhere = new Container();
  finished = false;
  private gone = false;
  private idle = 0;
  /** Actions taken, for the ghost finger's short round. */
  taken = 0;
  private spillSaid = false;
  private lastDrawnBucket = -1;
  private lastDrawnPail = -1;
  // ---- Level 4 (the breeze) ----
  private readonly breeze = breezeButton(130);
  /** The Breeze button (level 4), in the flag's place. */
  readonly breezeNode = this.breeze.node;
  /** Replay (level 4), in the pail's place once the puff has run. */
  readonly replayNode = replayButton(130);
  /** Answer pads under the bays (level 4), shown after the puff. */
  readonly padNodes: Container[] = [];
  private readonly deco = windmill(70);
  private readonly windLines = new Graphics();
  /** The dashed outline of the tray before the puff, the moved-grain tint, the shimmer and the hint's dotted path. */
  private readonly marks = new Graphics();
  private readonly glow = new Graphics();
  /** What the drawn sand eases toward while a puff plays; null means the model's heights. */
  private target: number[] | null = null;
  /** Bumped by each puff or Start again, so an older animation stops touching the tray. */
  private run4 = 0;
  /** A puff animation is playing. */
  playing = false;
  private spin = 0;
  private gust = 0;
  private shimmer = 0;
  private glowPad: number | null = null;
  private path: { x: number; y: number }[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.state = startState(ctx.level, ctx.rng, ctx.band === 'lap');
    this.disp = [...this.state.h];
    this.speckles = Array.from({ length: 90 }, () => ({ x: ctx.rng.next(), y: ctx.rng.next() }));
    this.lay = sandLayout(this.view, this.state.plan.bays.length);
    this.bucket.addChild(this.bucketArt);
    this.pailNode.addChild(this.pailArt);
    this.rim.eventMode = 'none';
    this.fx.eventMode = 'none';
    this.sparkle.eventMode = 'none';
    this.marks.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.windLines.eventMode = 'none';
    this.deco.node.eventMode = 'none';
    ctx.stage.addChild(
      this.bg,
      this.table,
      this.surface,
      this.marks,
      this.rim,
      this.bucket,
      this.fx,
      this.sparkle,
    );
    if (this.state.lap) {
      // The drawings over it take no touches, so a tap on any of them reaches this layer; the bay (the tray) still sits above.
      for (const d of [this.bg, this.table, this.surface, this.bucket]) d.eventMode = 'none';
      this.anywhere.eventMode = 'static';
      onTap(this.anywhere, () => this.touchBay(0), { cooldown: 60 });
      ctx.stage.addChildAt(this.anywhere, 1);
    }
    const breezy = !!this.state.plan.breeze;

    this.state.plan.bays.forEach((_, b) => {
      const bay = new Container();
      bay.eventMode = 'static';
      onTap(bay, () => this.touchBay(b), { cooldown: 60 });
      this.bayNodes.push(bay);
      ctx.stage.addChild(bay);
      if (breezy) {
        const pad = answerPad(180, 100);
        onTap(pad, () => this.touchPad(b), { cooldown: 200 });
        pad.visible = false;
        this.padNodes.push(pad);
        ctx.stage.addChild(pad);
      } else {
        const paddle = paddleArt(180, 100);
        onTap(paddle, () => this.touchPaddle(b), { cooldown: 60 });
        // lap has no scoop: every touch pours
        paddle.visible = !this.state.lap;
        this.paddleNodes.push(paddle);
        ctx.stage.addChild(paddle);
      }
    });
    if (breezy) {
      ctx.stage.addChildAt(this.glow, ctx.stage.getChildIndex(this.marks));
      ctx.stage.addChild(this.windLines, this.deco.node, this.breezeNode, this.replayNode);
      onTap(this.breezeNode, () => this.touchBreeze(), { cooldown: 300 });
      onTap(this.replayNode, () => this.touchReplay(), { cooldown: 300 });
      this.replayNode.visible = false;
    }
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
    void this.ctx.instruct(
      this.state.lap ? 'sand.instruct.lap' : (`sand.instruct.${this.state.plan.level}` as 'sand.instruct.1'),
    );
    if (this.state.wind)
      void this.ctx.tw.wait(3.6).then(() => {
        if (!this.gone && !this.finished && !this.state.puff)
          void this.ctx.say(`sand.breeze.from-${this.state.wind}` as 'sand.breeze.from-left');
      });
    if (this.state.invite)
      void this.ctx.tw.wait(3.2).then(() => {
        if (!this.gone && !this.finished)
          void this.ctx.say(`sand.invite.${this.state.invite}` as 'sand.invite.tall');
      });
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
    this.anywhere.hitArea = new Rectangle(0, 0, v.w, v.h);
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
      for (const n of [this.paddleNodes[b], this.padNodes[b]]) {
        if (!n) continue;
        n.position.set(p.x + p.w / 2, p.y + p.h / 2);
        n.scale.set(p.w / 180);
        n.hitArea = new Rectangle(-90, -50, 180, 100);
      }
    });
    this.breezeNode.position.set(l.flag.x + l.flag.w / 2, l.flag.y + l.flag.h / 2);
    this.breezeNode.hitArea = new Rectangle(-l.flag.w / 2, -l.flag.h / 2, l.flag.w, l.flag.h);
    this.replayNode.position.set(l.pail.x + l.pail.w / 2, l.pail.y + l.pail.h / 2);
    this.replayNode.hitArea = new Rectangle(-l.pail.w / 2, -l.pail.h / 2, l.pail.w, l.pail.h);
    if (this.state.wind) {
      const left = this.state.wind === 'left';
      this.deco.node.position.set(left ? t.x + 46 : t.x + t.w - 46, t.y + 48);
    }
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
    this.rim
      .clear()
      .roundRect(t.x - 4, t.y + t.h - 10, t.w + 8, 16, 6)
      .fill(wood.light)
      .stroke({ width: 4, color: wood.line });
    // Rim marks at the top of the tray: the line a column cannot pass.
    this.rim
      .moveTo(t.x, t.y)
      .lineTo(t.x + t.w, t.y)
      .stroke({ width: 3, color: SAND_LINE, alpha: 0.35 });
    if (this.state.plan.breeze) this.drawMarks();
  }

  /** Level 4's marks: the shimmering top grains before the puff; after it, the moved-grain tint, the dashed outline and any hint path. */
  private drawMarks() {
    const g = this.marks.clear();
    const l = this.lay;
    const p = this.state.puff;
    if (!p) {
      const a = 0.55 + 0.45 * Math.sin(this.shimmer * 6);
      for (const c of liftedColumns(this.state.h, this.state.wind ?? 'left')) {
        const x = this.colX(c);
        const y = this.topY(this.disp[c]) + l.rowH * 0.45;
        g.circle(x, y, 11).fill({ color: 0xfff3a0, alpha: a * 0.8 });
        g.circle(x, y, 7).fill(SAND).stroke({ width: 2, color: MOVED_LINE, alpha: a });
      }
      return;
    }
    // where the sand grew keeps a different tint: one tinted grain per grain gained, just under the surface
    for (let c = 0; c < COLS; c++) {
      const grew = Math.round(Math.min(this.disp[c], p.after[c]) - p.before[c]);
      for (let k = 0; k < grew; k++)
        g.circle(this.colX(c), this.topY(this.disp[c]) + (k + 0.75) * l.rowH, Math.min(16, l.rowH * 0.32))
          .fill(MOVED)
          .stroke({ width: 3, color: MOVED_LINE });
    }
    // the surface from before, dashed
    const pts = p.before.map((h, c) => ({ x: this.colX(c), y: this.topY(h) }));
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      for (let k = 0; k < 3; k++) {
        const t0 = k / 3;
        const t1 = t0 + 0.2;
        g.moveTo(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0).lineTo(
          a.x + (b.x - a.x) * t1,
          a.y + (b.y - a.y) * t1,
        );
      }
    }
    g.stroke({ width: 4, color: wood.line, alpha: 0.8, cap: 'round' });
    for (const d of this.path) g.circle(d.x, d.y, 5).fill(MOVED_LINE);
  }

  update(dt: number) {
    let moving = false;
    const k = Math.min(1, dt * 9);
    const goal = this.target ?? this.state.h;
    if (this.state.plan.breeze) {
      moving = this.tickBreeze(dt) || moving;
    }
    for (let c = 0; c < COLS; c++) {
      const d = goal[c] - this.disp[c];
      if (Math.abs(d) > 0.004) {
        this.disp[c] += d * k;
        moving = true;
      } else this.disp[c] = goal[c];
    }
    if (moving) this.drawSurface();
    if (this.lastDrawnBucket !== this.state.bucket) {
      this.lastDrawnBucket = this.state.bucket;
      // level 4 has no pour: the bucket looks empty
      drawBucket(this.bucketArt, this.state.plan.breeze ? 0 : this.state.bucket / GRAINS);
    }
    if (this.lastDrawnPail !== this.state.pail) {
      this.lastDrawnPail = this.state.pail;
      drawPail(this.pailArt, this.state.pail);
      this.pailNode.visible = this.state.pail > 0;
    }
    if (!this.finished) {
      this.idle += dt;
      if (this.idle >= IDLE_SECONDS && this.state.bucket > 0 && !this.state.plan.breeze) {
        this.idle = 0;
        const bay = this.lay.bays[Math.floor(this.lay.bays.length / 2)];
        this.ctx.particles.burst(bay.x + bay.w / 2, this.lay.tray.y + this.lay.tray.h * 0.4, {
          kind: 'dot',
          colors: [0xfff3a0, 0xffffff],
          count: 8,
          speed: [40, 100],
          gravity: 0,
          life: [0.5, 0.8],
        });
      }
    }
  }

  // ---- Touches --------------------------------------------------------------------------------------------------

  private touchBay(b: number) {
    if (this.finished) return;
    if (this.state.plan.breeze) return this.touchTray4(b);
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
    if (this.state.lap) {
      // no flag at lap: the first heap is still greeted, and the round finishes after her pours
      if (this.state.flag && !wasUp) void this.ctx.say('sand.first-heap');
      if (lapDone(this.state)) void this.finale(0.9);
      return;
    }
    if (this.state.flag && !wasUp) this.raiseFlag();
  }

  private tip(towardX: number) {
    const { tw } = this.ctx;
    tw.kill(this.bucket);
    const dir = Math.sign(towardX - this.lay.bucket.x) || 1;
    void tw.to(this.bucket, { rotation: dir * 0.45 }, { duration: 0.1, ease: ease.outQuad }).then(() => {
      if (!this.gone) void tw.to(this.bucket, { rotation: 0 }, { duration: 0.22, ease: ease.outBack });
    });
  }

  private showPour(b: number, r: SandResult) {
    const bay = this.lay.bays[b];
    const cx = bay.x + bay.w / 2;
    sfx.whoosh();
    this.tip(cx);
    if (r.kind === 'empty') {
      sfx.knock();
      this.wiggle(this.paddleNodes);
      for (let i = 0; i < 4; i++)
        void this.grain(
          this.lay.bucket.x + (i - 1.5) * 12,
          this.lay.bucket.y + 50,
          this.lay.bucket.x + (i - 1.5) * 20,
          this.lay.bucket.y + 110,
          i * 0.08,
          0.3,
          true,
        );
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
    for (let i = 0; i < Math.min(8, r.moved); i++)
      void this.grain(
        this.pailNode.x,
        this.pailNode.y - 20,
        this.lay.bucket.x,
        this.lay.bucket.y + 30,
        i * 0.06,
        0.55,
        false,
      );
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
        void this.grain(this.lay.bucket.x, this.lay.bucket.y + 55, x, y, delay, 0.32, false).then(
          () => !this.gone && sfx.pluck(2 + e.height * 1, 0.22),
        );
      } else if (e.kind === 'slide') {
        if (slides++ < 2) void this.ctx.tw.wait(0.25 + slides * 0.08).then(() => !this.gone && sfx.tick());
      } else if (e.kind === 'lift') {
        const delay = lift++ * 0.13;
        void this.grain(
          this.colX(e.col),
          this.topY(this.disp[e.col]),
          this.lay.bucket.x,
          this.lay.bucket.y + 40,
          delay,
          0.4,
          false,
        );
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
  private async grain(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    delay: number,
    seconds: number,
    fadeOut: boolean,
  ) {
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

  // ---- Level 4: the breeze ---------------------------------------------------------------------------------

  /** Per frame at level 4: the windmill turns while the breeze blows, the lines fade, the top grains shimmer, a glow pulses. */
  private tickBreeze(dt: number): boolean {
    this.spin = Math.max(0, this.spin - dt * 1.2);
    this.breeze.blades.rotation += dt * (0.4 + this.spin * 9);
    this.deco.blades.rotation += dt * (0.3 + this.spin * 9);
    this.gust = Math.max(0, this.gust - dt * 0.8);
    const l = this.lay;
    const left = this.state.wind !== 'right';
    drawBreezeLines(
      this.windLines,
      left ? l.tray.x + 90 : l.tray.x + l.tray.w - 90,
      l.tray.y + 30,
      left ? 1 : -1,
      0.25 + this.gust * 0.75,
    );
    this.glow.clear();
    if (this.glowPad !== null) {
      const p = l.paddles[this.glowPad];
      const a = 0.45 + 0.3 * Math.sin(this.shimmer * 5);
      this.glow.roundRect(p.x - 14, p.y - 14, p.w + 28, p.h + 28, 30).fill({ color: 0xfff3a0, alpha: a });
    }
    this.shimmer += dt;
    return !this.state.puff;
  }

  private touchTray4(b: number) {
    this.idle = 0;
    if (!this.state.puff) {
      this.wiggle([this.breezeNode]);
      sfx.tick();
      void this.ctx.say('sand.breeze.ready');
      return;
    }
    if (this.playing) return void sfx.tick();
    const pad = this.padNodes[b];
    this.ctx.tw.kill(pad.scale);
    const s = pad.scale.x;
    pad.scale.set(s * 1.12);
    void this.ctx.tw.to(pad.scale, { x: s, y: s }, { duration: 0.35, ease: ease.outBack });
    const p = this.lay.paddles[b];
    this.ctx.particles.burst(p.x + p.w / 2, p.y + p.h / 2, {
      kind: 'dot',
      colors: [0xfff3a0, 0xffffff],
      count: 10,
      speed: [50, 120],
      gravity: 0,
      life: [0.4, 0.7],
    });
    void this.ctx.say('sand.choose-here');
  }

  private touchBreeze() {
    if (this.finished || this.state.puff || this.playing) return;
    this.idle = 0;
    this.taken++;
    const before = [...this.state.h];
    puff(this.state);
    this.breezeNode.visible = false;
    void this.ctx.say('sand.breeze.first');
    void this.playPuff(before, false).then((done) => {
      if (!done || this.gone || this.finished) return;
      this.replayNode.visible = true;
      for (const pad of this.padNodes) {
        pad.visible = true;
        pad.scale.set(0.2);
        void this.ctx.tw.to(
          pad.scale,
          { x: this.lay.paddles[0].w / 180, y: this.lay.paddles[0].w / 180 },
          {
            duration: 0.4,
            ease: ease.outBack,
          },
        );
      }
      void this.ctx.instruct('sand.ask');
    });
  }

  private touchReplay() {
    if (this.finished || !this.state.puff) return;
    if (this.playing) return void sfx.tick();
    this.idle = 0;
    void this.playPuff(this.state.puff.before, false);
  }

  /**
   * Play the round's one puff from the tray before it: the top grains lift, hop low downwind one at a time (the most downwind
   * first) and land with a pluck, then the settle slides. The model already holds the result; this only shows it.
   * Resolves true when it played to the end.
   */
  private async playPuff(before: readonly number[], withPath: boolean): Promise<boolean> {
    const p = this.state.puff;
    if (!p) return false;
    const token = ++this.run4;
    const { tw } = this.ctx;
    const live = () => !this.gone && token === this.run4;
    this.playing = true;
    this.path = [];
    this.target = [...before];
    for (let c = 0; c < COLS; c++) this.disp[c] = before[c];
    this.drawSurface();
    sfx.whoosh();
    this.spin = 1;
    this.gust = 1;
    await tw.wait(0.35);
    if (!live()) return false;
    for (const c of p.lifted) this.target[c]--;
    const hops = p.events.filter((e): e is Extract<SandEvent, { kind: 'hop' }> => e.kind === 'hop');
    for (let i = 0; i < hops.length; i++) {
      const e = hops[i];
      const x0 = this.colX(e.from);
      const y0 = this.topY(before[e.from]) + 4;
      const x1 = this.colX(e.to);
      const y1 = this.topY(this.target[e.to] + 1) + 4;
      if (withPath && i === 0)
        for (let k = 0; k <= 12; k++) {
          const t = k / 12;
          this.path.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 40 });
        }
      await this.hop(x0, y0, x1, y1, withPath && i === 0 ? 1.1 : 0.55);
      if (!live()) return false;
      this.target[e.to]++;
      sfx.pluck(2 + this.target[e.to], 0.22);
      await tw.wait(0.12);
      if (!live()) return false;
    }
    if (p.events.some((e) => e.kind === 'slide')) {
      await tw.wait(0.25);
      if (!live()) return false;
      sfx.tick();
    }
    this.target = null;
    await tw.wait(0.6);
    if (!live()) return false;
    this.playing = false;
    this.drawSurface();
    return true;
  }

  /** One grain hopping low along the surface. */
  private async hop(x0: number, y0: number, x1: number, y1: number, seconds: number) {
    const { tw } = this.ctx;
    const g = grainDot();
    g.tint = MOVED;
    g.position.set(x0, y0);
    this.fx.addChild(g);
    void tw.to(g, { x: x1 }, { duration: seconds, ease: ease.inOutSine });
    await tw.to(g, { y: Math.min(y0, y1) - 40 }, { duration: seconds * 0.45, ease: ease.outQuad });
    if (this.gone) return;
    await tw.to(g, { y: y1 }, { duration: seconds * 0.55, ease: ease.inQuad });
    if (!this.gone && !g.destroyed) g.destroy();
  }

  private touchPad(b: number) {
    if (this.finished || !this.state.puff) return;
    // the grains are still moving: watching counts nothing, and the answer waits until they land
    if (this.playing) return void sfx.tick();
    this.idle = 0;
    this.taken++;
    const r = answer(this.state, b);
    if (r.change === 'gained') {
      void this.finale4();
      return;
    }
    sfx.boing();
    this.wiggle([this.padNodes[b]]);
    void this.ctx.say(r.change === 'lost' ? 'sand.wrong.lost' : 'sand.wrong.same').then(() => {
      if (r.glow && !this.gone && !this.finished && this.glowPad !== null)
        void this.ctx.say('sand.hint.glow');
    });
    if (r.glow) this.glowAnswer();
  }

  private gaining(): number {
    const p = this.state.puff!;
    return gainedBays(this.state.plan, p.before, p.after)[0];
  }

  private glowAnswer() {
    this.glowPad = this.gaining();
    const p = this.lay.paddles[this.glowPad];
    this.ctx.particles.burst(p.x + p.w / 2, p.y, {
      kind: 'dot',
      colors: [0xfff3a0, 0xffffff],
      count: 14,
      speed: [60, 160],
      gravity: 0,
      life: [0.5, 0.9],
    });
  }

  private async finale4() {
    if (this.finished) return;
    this.finished = true;
    const { tw } = this.ctx;
    [5, 6, 8].forEach((n, i) => void tw.wait(i * 0.1).then(() => !this.gone && sfx.pluck(n, 0.25)));
    const p = this.lay.paddles[this.gaining()];
    this.ctx.particles.burst(p.x + p.w / 2, p.y, {
      kind: 'dot',
      colors: [0xfff3a0, 0xffffff, MOVED],
      count: 30,
      speed: [120, 320],
      gravity: 200,
      life: [0.6, 1],
    });
    await this.ctx.say(this.state.hill === HOLLOW_HILL ? 'sand.right.hollow' : 'sand.right.lee');
    if (this.gone) return;
    this.ctx.pet.cheer();
    sfx.tada();
    await tw.wait(1.2);
    if (this.gone) return;
    const { misses, hints } = this.state.quiz;
    this.ctx.finish({ misses, hints });
  }

  // ---- Finish ---------------------------------------------------------------------------------------------------

  /** `settle`: seconds to let the last pour land first (lap's own finish). */
  private async finale(settle = 0) {
    if (this.finished) return;
    this.finished = true;
    const { tw } = this.ctx;
    this.idle = 0;
    if (settle > 0) {
      await tw.wait(settle);
      if (this.gone) return;
    }
    if (this.state.plan.show) await this.walk();
    else {
      [4, 5, 6, 8, 9].forEach((s, i) => void tw.wait(i * 0.12).then(() => !this.gone && sfx.pluck(s, 0.25)));
      this.ctx.particles.burst(this.lay.tray.x + this.lay.tray.w / 2, this.lay.tray.y + this.lay.tray.h / 2, {
        kind: 'dot',
        colors: [0xfff3a0, 0xffffff, SAND],
        count: 30,
        speed: [120, 320],
        gravity: 200,
        life: [0.6, 1],
      });
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
    if (this.state.plan.breeze) {
      if (this.playing) return;
      const h = breezeHint(this.state);
      if (h === 'breeze') this.touchBreeze();
      else if (h === 'path') {
        void this.ctx.say('sand.hint.path');
        void this.playPuff(this.state.puff!.before, true);
      } else {
        this.glowAnswer();
        void this.ctx.say('sand.hint.glow');
      }
      return;
    }
    const a = hintAction(this.state);
    const target =
      'pour' in a ? this.lay.bays[a.pour] : 'scoop' in a ? this.lay.paddles[a.scoop] : this.lay.pail;
    this.ctx.particles.burst(target.x + target.w / 2, target.y + target.h / 2, {
      kind: 'dot',
      colors: [0xfff3a0, 0xffffff],
      count: 14,
      speed: [60, 160],
      gravity: 0,
      life: [0.5, 0.9],
    });
    this.run(a);
  }

  /** Start again: the seeded tray and a full bucket, at once. */
  restart() {
    if (this.finished) return;
    restart(this.state);
    if (this.state.plan.breeze) {
      // the authored hill and the Breeze button come back; misses and hints already counted stay
      this.run4++;
      this.playing = false;
      this.target = null;
      this.path = [];
      this.glowPad = null;
      this.breezeNode.visible = true;
      this.replayNode.visible = false;
      for (const pad of this.padNodes) pad.visible = false;
    }
    for (let c = 0; c < COLS; c++) this.disp[c] = this.state.h[c];
    this.fx.removeChildren().forEach((c) => c.destroy());
    this.drawSurface();
  }

  /** The ghost finger: a short round that ends with a visible change, then the flag. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const step = botStep(this.state, this.taken);
    if ('breeze' in step) return { tap: { on: this.breezeNode } };
    if ('answer' in step) return this.playing ? null : { tap: { on: this.padNodes[step.answer] } };
    if (this.state.lap) {
      if ('flag' in step) return null;
      // anywhere: the bucket, the sky beside it, then the sand itself
      const k = this.taken % 3;
      if (k === 2) return { tap: { on: this.bayNodes[0] } };
      const at = k === 0 ? this.lay.bucket : { x: this.view.w * 0.82, y: this.lay.bucket.y };
      return { tap: { on: this.anywhere, x: at.x, y: at.y } };
    }
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
  const hs = Array.from({ length: 9 }, (_, i) =>
    Math.max(0, 1 + Math.round(rng.next() * 2) + (i > 2 && i < 6 ? 1 : 0)),
  );
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
  challenge: 'space',
  skills: ['cause-and-effect', 'spatial', 'materials', 'making'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: describeSand,
  music: STYLES.paint,
  coplayHint: 'One taps a change in the sand; the other says (or points to) what changed. Then swap.',
  coplayHintLap: 'Let {name} tap a change in the sand, then say what changed and point to it together.',
  offScreen:
    'A tray of dry sand, rice or oats and a scoop: pour a heap, scoop some away, and watch the sides slide.',
  hubIcon: () => new SandIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SandTable(ctx),
};
