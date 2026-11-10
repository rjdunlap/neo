import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { entryId } from '../../content/journal';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  answerGlow,
  checkArt,
  curtainArt,
  farTrees,
  ghostRing,
  houseArt,
  iconArt,
  markRing,
  orderDots,
  PictureButton,
  postArt,
  postGlow,
  raysLight,
  ropeArt,
  shiftLine,
  sideLight,
  stopTicks,
  stripArt,
  Tassel,
  touchRing,
  windowArt,
  WindowLight,
} from './art';
import {
  LEVELS,
  boardsFor,
  brighterOf,
  closerHelp,
  CloserWalk,
  farLayout,
  fartherOf,
  FarTally,
  GLOW,
  GlowTaps,
  judgeBrighter,
  judgeFarther,
  judgeMatch,
  judgeOrder,
  LANES,
  look,
  movable,
  nearestStop,
  orderBoardsFor,
  OrderMarks,
  pairsFor,
  planFor,
  STOPS,
  type Board,
  type FarLayout,
  type Lane,
  type OrderBoard,
  type Pair,
  type PlanInfo,
  type Stop,
  openingStop,
  shiftOf,
  StepBoard,
  stopsOf,
  strongBoardsFor,
  strongOf,
  type StrongBoard,
} from './logic';

const INSTRUCT: LineId[] = [
  'far.instruct.glow',
  'far.instruct.closer',
  'far.instruct.brighter',
  'far.instruct.match',
  'far.instruct.farther',
  'far.instruct.order',
  'far.instruct.strong',
  'far.instruct.cant-tell',
];

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

/** A note per stop, rising toward the window (pentatonic steps). */
const stopNote = (s: Stop) => 9 - s;
/** A light at a distance between stops (while it floats): how bright it looks. */
const lookAt = (d: number) => GLOW / (d * d);

class FarLights implements Game {
  readonly plan: PlanInfo;
  readonly tally = new FarTally();
  readonly pairs: Pair[];
  readonly boards: Board[];
  /** Level 6: three lights to put in order, and the marks on the one in hand. */
  readonly orderBoards: OrderBoard[];
  marks: OrderMarks | null = null;
  /** Levels 7–8: a strong and a gentle light that look the same; level 8's board in hand (Both could fit, the step). */
  readonly strongBoards: StrongBoard[];
  stepBoard: StepBoard | null = null;
  /** Level 7: the gentle light's distance, animated through the opening look. Level 8: how far through the step (0 home, 1 stepped). */
  readonly gentle = { d: 1 };
  readonly stepAt = { t: 0 };
  /** Level 8: the hint after the step joins each faint ring to its light. */
  shiftHint = false;
  fitButton: PictureButton | null = null;
  stepButton: PictureButton | null = null;
  private shiftLines: Graphics[] = [];
  readonly taps = new GlowTaps();
  walk = new CloserWalk();
  index = 0;
  finished = false;
  busy = false;
  layout: FarLayout | null = null;
  /** Where each light rests in the strip, and the stop nearest it while it is dragged (what the window shows). */
  stops: Record<Lane, Stop> = { A: 4, B: 3 };
  live: Record<Lane, Stop> = { A: 4, B: 3 };
  /** Level 1: each light's distance, animated while it floats close and back. */
  readonly dist = [{ d: 4 }, { d: 4 }, { d: 4 }];

  private alive = true;
  private view: View;
  private relayout = false;
  private epoch = 0;
  private talking = false;
  private lastTouch = 1;
  private readonly board = new Container();
  private readonly backdrop = new Graphics();
  stripLights: Partial<Record<Lane, Container>> = {};
  windowLights: WindowLight[] = [];
  check: Container | null = null;
  /** Levels 5–6: the curtain over the strip, its tassel, and whether it is up. */
  curtain: Container | null = null;
  tassel: Tassel | null = null;
  lifted = false;
  /** Level 6: the strip's three display lights, one per window spot. */
  private sideLights: Container[] = [];
  private markArt: Container[] = [];
  private drags: DragHandle[] = [];
  private glows: Graphics[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const level = this.plan.level;
    const authored = !!ctx.demo || !authoredShown.has(level);
    if (!ctx.demo) authoredShown.add(level);
    this.pairs = level === 3 || level === 5 ? pairsFor(ctx.rng, authored) : [];
    this.boards = level === 4 ? boardsFor(ctx.rng, authored) : [];
    this.orderBoards = level === 6 ? orderBoardsFor(ctx.rng, authored) : [];
    this.strongBoards = level === 7 || level === 8 ? strongBoardsFor(ctx.rng, level, authored) : [];
    this.place();
    ctx.stage.addChild(this.backdrop, this.board);
  }

  start() {
    this.build();
    this.instructNow();
  }

  /** The board's instruction; level 7 first plays its opening look, then instructs. */
  private instructNow() {
    if (this.plan.level === 7) void this.openingLook(false);
    else void this.ctx.instruct(INSTRUCT[this.plan.level - 1]);
  }

  destroy() {
    this.alive = false;
    for (const d of this.drags) d.destroy();
    this.drags = [];
  }

  resize(v: View) {
    this.view = v;
    if (this.busy || this.drags.some((d) => d.dragging)) {
      this.relayout = true;
      return;
    }
    this.build();
  }

  update() {
    if (this.plan.level === 1) this.windowLights.forEach((w, i) => w.setLook(lookAt(this.dist[i].d)));
    else if (this.plan.level === 6) {
      // Past the last board (the finale) the lights keep the last board's looks.
      const b = this.orderBoards[Math.min(this.index, this.orderBoards.length - 1)];
      this.windowLights.forEach((w, i) => w.setLook(look(GLOW, b.stops[i])));
    } else if (this.plan.level >= 7) {
      const b = this.strongBoards[Math.min(this.index, this.strongBoards.length - 1)];
      const l = this.layout;
      LANES.forEach((lane, i) => {
        const w = this.windowLights[i];
        if (!w) return;
        const d = this.plan.level === 7 && lane !== strongOf(b) ? this.gentle.d : b[lane].stop;
        w.setLook(b[lane].glow / (d * d));
        if (this.plan.level === 8 && l) w.x = l.spots[i].x - this.stepAt.t * shiftOf(b[lane].stop);
      });
      if (this.plan.level === 8) this.drawShiftLines();
    } else
      for (const lane of LANES) this.windowLights[lane === 'A' ? 0 : 1]?.setLook(look(GLOW, this.live[lane]));
  }

  /** The round's current pair or board sets where the lights rest. */
  private place() {
    const level = this.plan.level;
    if (level === 2) this.stops = { ...this.walk.at };
    else if (level === 3 || level === 5) {
      const p = this.pairs[this.index];
      this.stops = { A: p.A, B: p.B };
    } else if (level === 4) {
      const b = this.boards[this.index];
      this.stops = { [b.ref]: b.r, [movable(b)]: b.m } as Record<Lane, Stop>;
    } else if (level === 6) this.marks = new OrderMarks(this.orderBoards[this.index]);
    else if (level === 7 || level === 8) {
      const b = this.strongBoards[this.index];
      this.stops = { ...stopsOf(b) };
      this.ctx.tw.kill(this.gentle);
      this.ctx.tw.kill(this.stepAt);
      this.gentle.d = openingStop(b);
      this.stepAt.t = 0;
      this.shiftHint = false;
      this.stepBoard = level === 8 ? new StepBoard(b) : null;
    }
    this.lifted = false;
    this.live = { ...this.stops };
  }

  private settle() {
    this.busy = false;
    if (this.relayout && this.alive && !this.finished) this.build();
  }

  private say(id: LineId) {
    return this.ctx.say(id);
  }

  /** A short line while dragging, skipped while another is still being said. */
  private chirp(id: LineId) {
    if (this.talking) return;
    this.talking = true;
    void this.say(id).then(() => (this.talking = false));
  }

  // ----- building -----

  private build() {
    this.relayout = false;
    for (const d of this.drags) d.destroy();
    this.drags = [];
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    this.stripLights = {};
    this.windowLights = [];
    this.glows = [];
    this.check = null;
    this.curtain = null;
    this.tassel = null;
    this.sideLights = [];
    this.markArt = [];
    this.fitButton = null;
    this.stepButton = null;
    this.shiftLines = [];
    const v = this.view;
    this.backdrop.clear().rect(0, 0, v.w, v.h).fill(0x3a4372);
    const level = this.plan.level;
    const l = (this.layout = farLayout(v, level));
    if (!l || this.finished) return;

    if (l.strip && l.house) {
      this.board.addChild(stripArt(l.strip), houseArt(l.house));
      if (level === 6) this.board.addChild(stopTicks(l.stopX, l.strip));
      else
        for (const lane of LANES)
          for (const s of STOPS) this.board.addChild(postArt(l.stopX[s - 1], l.laneY[lane], s));
    }
    this.board.addChild(windowArt(l.window));
    if (level === 8) this.buildStep(l);

    const count = level === 1 || level === 6 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const w = new WindowLight(l.touchR);
      w.position.set(l.spots[i].x, l.spots[i].y);
      this.board.addChild(w);
      this.windowLights.push(w);
      if (level !== 2 && level !== 4) {
        w.hitArea = new Circle(0, 0, l.touchR);
        onTap(w, () => this.tapWindow(i), { cooldown: 200 });
      }
    }
    this.update();

    if (level === 6 && l.strip) {
      const b = this.orderBoards[this.index];
      for (let i = 0; i < 3; i++) {
        const side = sideLight();
        side.position.set(l.stopX[b.stops[i] - 1], l.lanes3[i]);
        this.board.addChild(side);
        this.sideLights.push(side);
      }
    } else if (l.strip) for (const lane of LANES) this.buildStripLight(lane, l);
    if (l.strip && l.tassel) this.buildCurtain(l);
    if (level === 8) this.buildButtons(l);
    this.drawMarks();
    if (level === 4 && l.check) {
      const c = checkArt(l.check.w);
      c.position.set(l.check.x + l.check.w / 2, l.check.y + l.check.h / 2);
      c.hitArea = new Rectangle(-l.check.w / 2, -l.check.h / 2, l.check.w, l.check.h);
      onTap(c, () => this.pressCheck(), { cooldown: 300 });
      this.board.addChild(c);
      this.check = c;
    }
    this.showGlow();
  }

  /** Levels 5–6: the curtain over the strip (up if this board's answer is in) and its tassel. */
  private buildCurtain(l: FarLayout) {
    const curtain = curtainArt(l.strip!);
    if (this.lifted) curtain.scale.y = 0.06;
    this.board.addChild(curtain);
    this.curtain = curtain;
    const t = new Tassel(l.tassel!.y - l.strip!.y);
    t.position.set(l.tassel!.x, l.tassel!.y);
    t.hitArea = new Circle(0, 0, l.tassel!.r);
    onTap(t, () => this.pullTassel(), { cooldown: 300 });
    this.board.addChild(t);
    this.tassel = t;
  }

  /** Level 8: the far trees, which never move, and once she has stepped the faint rings where the lights were (with the hint's lines). */
  private buildStep(l: FarLayout) {
    this.board.addChild(farTrees(l.window));
    if (!this.stepBoard?.stepped) return;
    LANES.forEach((_lane, i) => {
      const r = ghostRing();
      r.position.set(l.spots[i].x, l.spots[i].y);
      this.board.addChild(r);
      if (this.shiftHint) {
        const g = shiftLine(0);
        g.position.set(l.spots[i].x, l.spots[i].y);
        this.board.addChild(g);
        this.shiftLines.push(g);
      }
    });
    this.drawShiftLines();
  }

  /** The hint's lines, from each faint ring to where its light is now. */
  private drawShiftLines() {
    const l = this.layout;
    if (!l) return;
    this.shiftLines.forEach((g, i) => {
      const dx = (this.windowLights[i]?.x ?? l.spots[i].x) - l.spots[i].x;
      g.clear().moveTo(0, 0).lineTo(dx, 0).stroke({ width: 4, color: 0xfff1a8, alpha: 0.9, cap: 'round' });
    });
  }

  /** Level 8: Both could fit, and once she has said it, the step. */
  private buildButtons(l: FarLayout) {
    const sb = this.stepBoard;
    if (!l.fit || !l.step || !sb) return;
    const fit = new PictureButton(l.fit.w, 'fit');
    fit.position.set(l.fit.x + l.fit.w / 2, l.fit.y + l.fit.h / 2);
    fit.hitArea = new Rectangle(-l.fit.w / 2, -l.fit.h / 2, l.fit.w, l.fit.h);
    onTap(fit, () => this.pressFit(), { cooldown: 300 });
    const step = new PictureButton(l.step.w, 'step');
    step.position.set(l.step.x + l.step.w / 2, l.step.y + l.step.h / 2);
    step.hitArea = new Rectangle(-l.step.w / 2, -l.step.h / 2, l.step.w, l.step.h);
    onTap(step, () => void this.pressStep(), { cooldown: 300 });
    step.visible = sb.fit;
    this.board.addChild(fit, step);
    this.fitButton = fit;
    this.stepButton = step;
  }

  /** Level 6: each light's order dots and ring, in the window and on its strip light; the tassel glows once all three are marked. */
  private drawMarks() {
    for (const m of this.markArt) m.destroy();
    this.markArt = [];
    const m = this.marks;
    const l = this.layout;
    if (this.plan.level !== 6 || !m || !l) return;
    for (let i = 0; i < 3; i++) {
      const n = m.markOf(i);
      if (!n) continue;
      const w = this.windowLights[i];
      const ring = markRing(l.touchR - 4, n <= m.locked);
      const dots = orderDots(n, l.touchR + 18);
      w.addChild(ring, dots);
      const side = orderDots(n, 0);
      side.scale.set(0.6);
      side.position.set(this.sideLights[i].x + 48, this.sideLights[i].y);
      this.board.addChildAt(side, this.board.getChildIndex(this.curtain ?? this.sideLights[i]));
      this.markArt.push(ring, dots, side);
    }
    if (this.tassel) this.tassel.glow.visible = m.full && !this.busy;
  }

  private buildStripLight(lane: Lane, l: FarLayout) {
    const level = this.plan.level;
    const light = new Container();
    const ring = touchRing(34);
    ring.alpha = 0;
    light.addChild(level >= 7 ? raysLight(this.strongBoards[this.index][lane].glow) : sideLight(), ring);
    light.position.set(l.stopX[this.stops[lane] - 1], l.laneY[lane]);
    light.hitArea = new Circle(0, 0, l.touchR);
    const moored = level === 4 && this.boards[this.index].ref === lane;
    if (moored) light.addChild(ropeArt());
    this.board.addChild(light);
    this.stripLights[lane] = light;
    const flash = () => {
      ring.alpha = 1;
      void this.ctx.tw.to(ring, { alpha: 0 }, { duration: 0.5 });
    };
    if (level >= 5) {
      // Behind the curtain the strip only shows where the lights are.
      light.eventMode = 'none';
      return;
    }
    if (level === 3 || moored) {
      // Lights in the strip bob when tapped but do not answer.
      onTap(light, () => {
        flash();
        this.bob(light);
      });
      return;
    }
    const left = l.stopX[0];
    const right = l.stopX[3];
    const drag = draggable(light, this.ctx.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => {
        flash();
        sfx.pop(6);
      },
      onMove: (x) => {
        light.position.set(Math.min(right, Math.max(left, x)), l.laneY[lane]);
        const s = nearestStop(light.x, l.stopX);
        if (s !== this.live[lane]) this.cross(lane, this.live[lane], s);
      },
      onDrop: (x) => {
        const s = nearestStop(Math.min(right, Math.max(left, x)), l.stopX);
        if (s !== this.live[lane]) this.cross(lane, this.live[lane], s);
        light.y = l.laneY[lane];
        void this.ctx.tw.to(light, { x: l.stopX[s - 1] }, { duration: 0.2, ease: ease.outCubic });
        this.rest(lane, s);
        if (this.relayout) queueMicrotask(() => this.alive && !this.busy && this.build());
        return true;
      },
    });
    this.drags.push(drag);
  }

  /** A light passed from one stop to the next: a note, and at level 2 a word. */
  private cross(lane: Lane, from: Stop, to: Stop) {
    const step = Math.sign(to - from) as 1 | -1;
    for (let s = from + step; step > 0 ? s <= to : s >= to; s += step) sfx.bell(stopNote(s as Stop));
    this.live[lane] = to;
    if (this.plan.level === 2) {
      const said = this.walk.cross(lane, from, to);
      if (said) this.chirp(said === 'brighter' ? 'far.brighter' : 'far.dimmer');
    }
  }

  private rest(lane: Lane, s: Stop) {
    this.stops[lane] = s;
    this.live[lane] = s;
    if (this.plan.level === 2) {
      this.walk.rest(lane, s);
      if (this.walk.done && !this.busy) void this.finishWalk();
    }
  }

  private bob(c: Container) {
    const y = c.y;
    void this.ctx.tw.to(c, { y: y - 14 }, { duration: 0.15, ease: ease.outQuad }).then(() => {
      if (!c.destroyed) void this.ctx.tw.to(c, { y }, { duration: 0.2, ease: ease.inQuad });
    });
  }

  private showGlow() {
    for (const g of this.glows) g.destroy();
    this.glows = [];
    const l = this.layout;
    if (!l || !this.tally.glow) return;
    if (this.plan.level === 8) {
      // The lights move with the step, so the glow rides on the light.
      const k = this.answerSpot()!;
      const g = answerGlow(l.touchR);
      this.windowLights[k].addChildAt(g, 0);
      this.glows.push(g);
    } else if (this.plan.level === 3 || this.plan.level >= 5) {
      const k = this.answerSpot();
      if (k === null) return;
      const g = answerGlow(l.touchR);
      g.position.set(l.spots[k].x, l.spots[k].y);
      this.board.addChildAt(g, this.board.getChildIndex(this.windowLights[0]));
      this.glows.push(g);
    } else if (this.plan.level === 4) {
      const b = this.boards[this.index];
      const g = postGlow(l.stopX[b.r - 1], l.laneY[movable(b)]);
      this.board.addChildAt(g, this.board.getChildIndex(this.stripLights[movable(b)]!));
      this.glows.push(g);
    }
  }

  /** The window spot the answer glow and hint point at (levels 3, 5 and 6). */
  private answerSpot(): number | null {
    const level = this.plan.level;
    if (level === 6) return this.marks?.nextRight ?? null;
    if (level >= 7) return strongOf(this.strongBoards[this.index]) === 'A' ? 0 : 1;
    const p = this.pairs[this.index];
    return (level === 5 ? fartherOf(p) : brighterOf(p)) === 'A' ? 0 : 1;
  }

  // ----- level 1: glow -----

  private tapWindow(i: number) {
    if (this.finished) return;
    const w = this.windowLights[i];
    w.ring.alpha = 1;
    void this.ctx.tw.to(w.ring, { alpha: 0 }, { duration: 0.5 });
    this.lastTouch = i;
    if (this.plan.level === 1) void this.float(i);
    else if (this.plan.level === 3) void this.answer(i === 0 ? 'A' : 'B');
    else if (this.plan.level === 5) void this.answerFarther(i === 0 ? 'A' : 'B');
    else if (this.plan.level === 6) this.mark(i);
    else if (this.plan.level === 7) void this.answerStrong(i === 0 ? 'A' : 'B');
    else if (this.plan.level === 8) void this.tapStep(i === 0 ? 'A' : 'B');
  }

  /** A counted tap: the light floats close and glows up, holds, then drifts back. Its glow never changes; only its distance. */
  private async float(i: number) {
    if (!this.taps.tap(i)) return;
    this.tally.next();
    const e = this.epoch;
    const proxy = this.dist[i];
    void this.notes(e);
    await this.ctx.tw.to(proxy, { d: 1 }, { duration: 0.8, ease: ease.outCubic });
    if (!this.alive || e !== this.epoch) return;
    void this.say('far.so-bright');
    await this.ctx.tw.wait(1.5);
    if (!this.alive || e !== this.epoch) return;
    await this.ctx.tw.to(proxy, { d: 4 }, { duration: 1.2, ease: ease.inOutSine });
    if (!this.alive || e !== this.epoch) return;
    this.taps.back(i);
    if (this.taps.done) {
      await this.ctx.tw.wait(1);
      if (this.alive && e === this.epoch) void this.finale();
    }
  }

  /** Three rising notes as a light floats close. */
  private async notes(e: number) {
    for (let k = 0; k < 3; k++) {
      if (!this.alive || e !== this.epoch) return;
      sfx.bell(6 + k);
      await this.ctx.tw.wait(0.27);
    }
  }

  // ----- level 2: come closer -----

  private async finishWalk() {
    this.busy = true;
    this.hold(true);
    const e = this.epoch;
    await this.ctx.tw.wait(1);
    if (!this.alive || e !== this.epoch) return;
    await this.say('far.not-bigger');
    if (this.alive && e === this.epoch) void this.finale();
  }

  // ----- level 3: which looks brighter? -----

  private async answer(lane: Lane) {
    if (this.busy) return;
    const p = this.pairs[this.index];
    if (judgeBrighter(p, lane) === 'dimmer') {
      sfx.boing();
      this.tally.miss();
      this.showGlow();
      void this.say('far.wrong-brighter');
      return;
    }
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    const s = this.stripLights[lane];
    if (s) this.bob(s);
    await this.say('far.right-brighter');
    if (this.alive && e === this.epoch) this.next();
  }

  // ----- levels 5 and 6: behind the curtain -----

  private async answerFarther(lane: Lane) {
    if (this.busy || this.lifted) return;
    if (judgeFarther(this.pairs[this.index], lane) === 'nearer') {
      sfx.boing();
      this.tally.miss();
      this.showGlow();
      void this.say('far.wrong-farther');
      return;
    }
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    await this.say('far.right-farther');
    if (!this.alive || e !== this.epoch) return;
    await this.lift(e);
    if (!this.alive || e !== this.epoch) return;
    await this.ctx.tw.wait(1.4);
    if (this.alive && e === this.epoch) this.next();
  }

  /** Level 6: a tap marks a light with the next dots, or clears its mark and every later one (free). */
  private mark(i: number) {
    const m = this.marks;
    if (this.busy || !m) return;
    const did = m.tap(i);
    if (did === 'marked') sfx.bell(5 + m.markOf(i));
    else if (did === 'cleared') sfx.pop(4);
    else this.bob(this.windowLights[i]);
    this.drawMarks();
    this.showGlow();
  }

  private async pullTassel() {
    const t = this.tassel;
    if (!t || this.finished) return;
    t.ring.alpha = 1;
    void this.ctx.tw.to(t.ring, { alpha: 0 }, { duration: 0.5 });
    const m = this.marks;
    // Level 5's curtain lifts only after her answer; an early pull, or one with marks missing, is a free bob.
    if (this.busy || this.lifted || !m || !m.full) return void this.bob(t);
    const v = judgeOrder(m.board, m.picks);
    if (v !== 'right') {
      sfx.boing();
      this.tally.miss();
      m.dropWrong();
      this.drawMarks();
      this.showGlow();
      void this.say(v === 0 ? 'far.order-first' : 'far.order-last');
      return;
    }
    this.busy = true;
    t.glow.visible = false;
    const e = this.epoch;
    sfx.sparkle();
    await this.say('far.order-right');
    if (!this.alive || e !== this.epoch) return;
    await this.lift(e);
    if (!this.alive || e !== this.epoch) return;
    await this.ctx.tw.wait(1.2);
    if (this.alive && e === this.epoch) this.next();
  }

  /** The curtain lifts (0.6 s) on a soft rising run. */
  private async lift(e: number) {
    const c = this.curtain;
    if (!c) return;
    void this.say('far.curtain');
    void (async () => {
      for (const step of [5, 6, 7, 8, 9]) {
        if (!this.alive || e !== this.epoch) return;
        sfx.bell(step, 0.18);
        await this.ctx.tw.wait(0.12);
      }
    })();
    await this.ctx.tw.to(c.scale, { y: 0.06 }, { duration: 0.6, ease: ease.inOutSine });
    if (this.alive && e === this.epoch) this.lifted = true;
  }

  // ----- level 7: strong and gentle -----

  /**
   * The opening look: both lights at the strong light's stop, so the strong one plainly looks brighter; then the gentle
   * light glides nearer until both look the same. Busy throughout, so taps, hints and the ghost finger wait. A hint
   * replays it (the gentle light slides back out first) and ends by pulsing the strong light.
   */
  private async openingLook(replay: boolean) {
    const b = this.strongBoards[this.index];
    const strong = strongOf(b);
    const gentle = b[strong === 'A' ? 'B' : 'A'];
    const e = this.epoch;
    const ok = () => this.alive && e === this.epoch;
    this.busy = true;
    if (replay) {
      await this.ctx.tw.to(this.gentle, { d: openingStop(b) }, { duration: 0.6, ease: ease.inOutSine });
      if (!ok()) return;
    }
    this.gentle.d = openingStop(b);
    await this.ctx.tw.wait(0.4);
    if (!ok()) return;
    if (!replay) {
      this.pulse(this.windowLights[strong === 'A' ? 0 : 1]);
      await this.say('far.strong-look');
      if (!ok()) return;
    }
    sfx.bell(stopNote(gentle.stop), 0.2);
    await this.ctx.tw.to(this.gentle, { d: gentle.stop }, { duration: 1.2, ease: ease.inOutSine });
    if (!ok()) return;
    if (!replay) {
      await this.say('far.same-now');
      if (!ok()) return;
    }
    this.busy = false;
    this.settle();
    if (replay) this.pulse(this.windowLights[strong === 'A' ? 0 : 1]);
    else void this.ctx.instruct('far.instruct.strong');
  }

  private async answerStrong(lane: Lane) {
    if (this.busy || this.lifted) return;
    if (judgeFarther(stopsOf(this.strongBoards[this.index]), lane) === 'nearer') {
      sfx.boing();
      this.tally.miss();
      this.showGlow();
      void this.say('far.wrong-strong');
      return;
    }
    await this.reveal(lane, 'far.right-strong');
  }

  /** A right answer at levels 7–8: the farther light bobs, the curtain lifts on both glows' rays, then the next board. */
  private async reveal(lane: Lane, line: LineId) {
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    const s = this.stripLights[lane];
    if (s) this.bob(s);
    await this.say(line);
    if (!this.alive || e !== this.epoch) return;
    await this.lift(e);
    if (!this.alive || e !== this.epoch) return;
    await this.ctx.tw.wait(1.6);
    if (this.alive && e === this.epoch) this.next();
  }

  // ----- level 8: can't tell yet -----

  private async tapStep(lane: Lane) {
    const sb = this.stepBoard;
    if (this.busy || this.lifted || !sb) return;
    const v = sb.tap(lane);
    if (v === 'maybe') {
      // A guess before the step: never a miss.
      sfx.pop(5);
      if (sb.fit) {
        void this.say('far.step');
        if (this.stepButton) this.pulse(this.stepButton);
      } else {
        void this.say('far.maybe');
        if (this.fitButton) this.pulse(this.fitButton);
      }
      return;
    }
    if (v === 'nearer') {
      sfx.boing();
      this.tally.miss();
      this.showGlow();
      void this.say('far.wrong-step');
      return;
    }
    await this.reveal(lane, 'far.right-step');
  }

  /** Both could fit: the right call before the step (never counted either way); the step button appears. */
  private pressFit() {
    const sb = this.stepBoard;
    const btn = this.fitButton;
    if (!sb || !btn || this.busy || this.finished || this.lifted) return;
    btn.ring.alpha = 1;
    void this.ctx.tw.to(btn.ring, { alpha: 0 }, { duration: 0.5 });
    if (sb.pressFit() === 'again') {
      if (!sb.stepped && this.stepButton) this.pulse(this.stepButton);
      else this.bob(btn);
      return;
    }
    for (const step of [6, 8]) sfx.bell(step, 0.25);
    void this.say('far.both-fit');
    if (this.stepButton) {
      this.stepButton.visible = true;
      this.pulse(this.stepButton);
    }
  }

  /** The step to the side (1 s): each light shifts by its toy shift against the far trees; again steps back. Free. */
  private async pressStep() {
    const sb = this.stepBoard;
    const btn = this.stepButton;
    if (!sb || !btn || !sb.fit || this.busy || this.finished || this.lifted) return;
    const first = !sb.stepped;
    sb.step();
    this.busy = true;
    const e = this.epoch;
    // The first step rebuilds to add the faint rings, so the flash goes on the rebuilt button.
    if (first && this.layout) this.build();
    const flash = this.stepButton;
    if (flash) {
      flash.ring.alpha = 1;
      void this.ctx.tw.to(flash.ring, { alpha: 0 }, { duration: 0.5 });
    }
    sfx.pop(4);
    void this.ctx.tw.wait(0.2).then(() => this.alive && e === this.epoch && sfx.pop(6));
    await this.ctx.tw.to(
      this.stepAt,
      { t: this.stepAt.t < 0.5 ? 1 : 0 },
      { duration: 1, ease: ease.inOutSine },
    );
    if (!this.alive || e !== this.epoch) return;
    this.busy = false;
    this.settle();
  }

  // ----- level 4: make them match -----

  private async pressCheck() {
    if (this.busy || this.finished || this.drags.some((d) => d.dragging)) return;
    const b = this.boards[this.index];
    const v = judgeMatch(b, this.stops[movable(b)]);
    if (v !== 'same') {
      sfx.boing();
      this.tally.miss();
      this.showGlow();
      void this.say(v === 'too-bright' ? 'far.too-bright' : 'far.too-dim');
      return;
    }
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    for (const lane of LANES) if (this.stripLights[lane]) this.bob(this.stripLights[lane]!);
    await this.say('far.same');
    if (this.alive && e === this.epoch) this.next();
  }

  private next() {
    this.index++;
    this.tally.next();
    const level = this.plan.level;
    const total =
      level === 3 || level === 5
        ? this.pairs.length
        : level === 6
          ? this.orderBoards.length
          : level >= 7
            ? this.strongBoards.length
            : this.boards.length;
    if (this.index >= total) return void this.finale();
    this.place();
    this.busy = false;
    this.build();
    this.instructNow();
  }

  // ----- help, restart, finish -----

  hintLabel = 'Show a hint';

  askForHint() {
    if (this.finished || this.busy || this.drags.some((d) => d.dragging) || !this.layout) return;
    const level = this.plan.level;
    const l = this.layout;
    if (level === 1) {
      const free = [0, 1, 2].filter((i) => !this.taps.moving.has(i));
      if (!free.length || this.taps.count >= 3) return;
      const i = free.reduce((a, b) => (Math.abs(b - this.lastTouch) < Math.abs(a - this.lastTouch) ? b : a));
      this.tally.hint();
      void this.say('far.hint');
      this.pulse(this.windowLights[i]);
      void this.float(i);
      return;
    }
    if (level === 3 || level === 5) {
      if (this.lifted) return;
      this.tally.hint();
      void this.say('far.hint');
      this.pulse(this.windowLights[this.answerSpot()!]);
      return;
    }
    if (level === 7) {
      if (this.lifted) return;
      this.tally.hint();
      void this.say('far.hint');
      void this.openingLook(true);
      return;
    }
    if (level === 8) {
      const sb = this.stepBoard;
      if (this.lifted || !sb) return;
      this.tally.hint();
      void this.say('far.hint');
      if (!sb.fit) return void (this.fitButton && this.pulse(this.fitButton));
      // Said Both could fit but not stepped yet: the step button (a departure: the definition names no hint here).
      if (!sb.stepped) return void (this.stepButton && this.pulse(this.stepButton));
      if (!this.shiftHint) {
        this.shiftHint = true;
        this.build();
      }
      if (this.stepAt.t < 0.5 && this.stepButton) this.pulse(this.stepButton);
      this.pulse(this.windowLights[this.answerSpot()!]);
      return;
    }
    if (level === 6) {
      // The next right light gets its mark, locked; asking again marks the one after, free.
      const s = this.marks?.hint() ?? null;
      if (s === null) return void (this.tassel && this.pulse(this.tassel));
      this.tally.hint();
      void this.say('far.hint');
      sfx.bell(5 + this.marks!.markOf(s));
      this.drawMarks();
      this.showGlow();
      this.pulse(this.windowLights[s]);
      return;
    }
    const lane = level === 2 ? closerHelp(this.stops)?.lane : movable(this.boards[this.index]);
    if (!lane) return;
    const to = level === 2 ? closerHelp(this.stops)!.to : this.boards[this.index].r;
    const light = this.stripLights[lane];
    if (!light) return;
    this.tally.hint();
    void this.say('far.hint');
    if (this.stops[lane] === to) return void this.pulse(light);
    // The glide holds the lights: a finger cannot grab one (and kill the glide) until it lands.
    this.busy = true;
    this.hold(true);
    const e = this.epoch;
    void this.ctx.tw.to(light, { x: l.stopX[to - 1] }, { duration: 0.8, ease: ease.inOutSine }).then(() => {
      if (!this.alive || e !== this.epoch) return;
      this.cross(lane, this.live[lane], to);
      this.busy = false;
      this.hold(false);
      this.rest(lane, to);
      if (!this.busy) this.settle();
    });
  }

  /** Hold every draggable light still (a hint's glide, the finish). */
  private hold(on: boolean) {
    for (const d of this.drags) d.enabled = !on;
  }

  private pulse(c: Container) {
    void this.ctx.tw.to(c.scale, { x: 1.25, y: 1.25 }, { duration: 0.25 }).then(() => {
      if (!c.destroyed) void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3 });
    });
  }

  /** Start again: the same round from its first board, misses and hints kept. */
  restart() {
    if (this.finished) return;
    this.epoch++;
    this.index = 0;
    this.walk = new CloserWalk();
    this.taps.count = 0;
    this.taps.moving.clear();
    for (const p of this.dist) {
      this.ctx.tw.kill(p);
      p.d = 4;
    }
    this.tally.next();
    this.busy = false;
    this.place();
    this.build();
    if (this.plan.level === 7) void this.openingLook(false);
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.hold(true);
    sfx.tada();
    this.ctx.pet.cheer();
    for (const c of [...Object.values(this.stripLights), ...this.windowLights]) if (c) this.bob(c);
    await this.say('far.done');
    await this.ctx.tw.wait(0.8);
    if (!this.alive) return;
    const discoveries = this.plan.level === 7 ? [entryId('far-lights', 'strong-far')] : undefined;
    this.ctx.finish({
      misses: this.tally.misses,
      hints: this.tally.hints,
      ...(discoveries ? { discoveries } : {}),
    });
  }

  // ----- the ghost finger -----

  autotouch(): TouchIntent | null {
    const l = this.layout;
    if (this.finished || this.busy || !l || this.drags.some((d) => d.dragging)) return null;
    const level = this.plan.level;
    if (level === 1) {
      if (this.taps.moving.size || this.taps.count >= 3) return null;
      return { tap: { on: this.windowLights[this.taps.count % 3] } };
    }
    if (level === 3 || level === 5)
      return this.lifted ? null : { tap: { on: this.windowLights[this.answerSpot()!] } };
    if (level === 7)
      return this.lifted ? null : { tap: { on: this.windowLights[this.answerSpot()!] }, pause: 0.5 };
    if (level === 8) {
      const sb = this.stepBoard;
      if (!sb || this.lifted || !this.fitButton || !this.stepButton) return null;
      if (!sb.fit) return { tap: { on: this.fitButton }, pause: 1 };
      if (!sb.stepped) return { tap: { on: this.stepButton }, pause: 1 };
      return { tap: { on: this.windowLights[this.answerSpot()!] }, pause: 0.5 };
    }
    if (level === 6) {
      const m = this.marks;
      if (!m || !this.tassel) return null;
      const right = m.rightSoFar;
      if (m.full && right === 3) return { tap: { on: this.tassel }, pause: 1 };
      // A wrong mark is cleared first, then the next right light is marked.
      const spot = right < m.picks.length ? m.picks[right] : m.nextRight!;
      return { tap: { on: this.windowLights[spot] }, pause: 0.5 };
    }
    const b = level === 4 ? this.boards[this.index] : null;
    const help = b ? { lane: movable(b), to: b.r as Stop } : closerHelp(this.stops);
    if (!help) return null;
    const at = this.stops[help.lane];
    if (at === help.to) return b && this.check ? { tap: { on: this.check }, pause: 1 } : null;
    const next = (at + Math.sign(help.to - at)) as Stop;
    const light = this.stripLights[help.lane];
    if (!light) return null;
    return {
      drag: { on: light },
      to: { on: this.board, x: l.stopX[next - 1], y: l.laneY[help.lane] },
      lift: 0,
      pause: 0.3,
    };
  }
}

class FarIcon extends WigglyIcon {
  constructor() {
    const art = iconArt(200);
    art.y = -100;
    super(art);
    this.hitArea = new Circle(0, -100, 110);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const near = rng.pick([1, 2] as const);
  const far = rng.pick([3, 4] as const);
  return iconArt(150, look(GLOW, near), look(GLOW, far));
}

export const farLights: GameModule = {
  id: 'far-lights',
  name: 'Far Lights',
  titleLine: 'game.far-lights',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['observation', 'comparing', 'distance', 'brightness'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint:
    'Hand over the lake: cover the top strip with your hand, let {name} pick the brighter light from the window, then lift your hand to see which is nearer.',
  offScreen: 'Tonight, look out of a window. Does a near light or a far light look brighter?',
  hubIcon: () => new FarIcon(),
  sticker,
  create: (ctx) => new FarLights(ctx),
};
