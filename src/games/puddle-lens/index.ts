import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { buttonFace, handLensArt, leafArt, lensFrame, lensShine, noneIcon, pawArt, showIcon, stopPicture, swimmerArt, thingArt, viewLayer } from './art';
import {
  ART_R, clampGlass, DECIDING, dropScale, dropsFor, GLASS_R, helpFor, judgeSwimmers, judgeView, lensLayout, LensTally, LookTracker, looksFor,
  nearestSwimmer, planFor, questionsFor, STOPS, SWIMMER_LENGTH, swimmerAt, THINGS, windowOf, acceptedStops,
  type Drop, type LensLayout, type Looks, type PlanInfo, type Question, type SampleId, type Stop, type SwimmerVerdict,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
  school: { min: 4, max: 4 },
};

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

/** How much bigger the level-2 glass shows the table. */
const GLASS_ZOOM = 2;
/** Level 1: seconds a swell holds before it shrinks back by itself. */
const HOLD = 2;

class StopButton extends Container {
  readonly glow = new Graphics();
  private readonly face = new Container();
  constructor(readonly stop: Stop | 'answer', private readonly size: number, picture: Container, onPress: () => void) {
    super();
    this.glow.roundRect(-size / 2 - 14, -size / 2 - 14, size + 28, size + 28, 30).fill({ color: 0xfff3a0, alpha: 0.9 });
    this.glow.visible = false;
    this.addChild(this.glow, this.face, picture);
    picture.eventMode = 'none';
    this.setLit(false);
    this.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
    onTap(this, () => {
      this.flash();
      onPress();
    }, { cooldown: 150 });
  }
  setLit(on: boolean) {
    for (const c of this.face.removeChildren()) c.destroy();
    this.face.addChild(buttonFace(this.size, on));
  }
  /** Touch-down: a quick press. */
  private flash() {
    this.scale.set(0.92);
    setTimeout(() => !this.destroyed && this.scale.set(1), 120);
  }
}

class PuddleLens implements Game {
  readonly plan: PlanInfo;
  readonly tally = new LensTally();
  readonly looks: Looks;
  /** Level 3's drops and level 4's questions (the drop at level 4 is only for its swimmers). */
  readonly drops: Drop[];
  readonly questions: Question[];
  index = 0;
  stop: Stop = 1;
  finished = false;
  busy = false;
  /** Level 1: the thing under the lens is swollen (tap again to shrink it early). */
  swollen = false;
  layout: LensLayout | null = null;
  readonly tracker = new LookTracker();

  private alive = true;
  private clock = 0;
  /** Swimmers' own clock: it stops while any finger is on the glass. */
  private swimT = 0;
  private readonly fingers = new Set<number>();
  private view: View;
  private relayout = false;
  private turnId = 0;
  /** Bumped by Start again, so a step already under way does not carry on into the restarted round. */
  private epoch = 0;
  private movingSaid = false;
  private pawSeen = false;
  private pawSaid = false;
  private holdLeft = 0;

  private readonly backdrop: Backdrop;
  readonly board = new Container();
  lensHit: Container | null = null;
  private lensView: Container | null = null;
  private layers: Container[] = [];
  private swimmerNodes: Container[][] = [];
  private pointer: Graphics | null = null;
  stopButtons: StopButton[] = [];
  answer: StopButton | null = null;
  glass: Container | null = null;
  private drag: DragHandle | null = null;
  private under: Container | null = null;
  private underMask: Graphics | null = null;
  private thingTicks: Graphics[] = [];
  private glassAt: { x: number; y: number } | null = null;

  private readonly down = (e: PointerEvent) => this.fingers.add(e.pointerId);
  private readonly up = (e: PointerEvent) => this.fingers.delete(e.pointerId);

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const level = this.plan.level;
    const authored = !!ctx.demo || !authoredShown.has(level);
    if (!ctx.demo) authoredShown.add(level);
    this.looks = looksFor(ctx.rng, authored);
    this.drops = level === 3 ? dropsFor(ctx.rng, authored) : level === 4 ? [dropsFor(ctx.rng, false).find((d) => d.swimmers.length)!] : [];
    this.questions = level === 4 ? questionsFor(ctx.rng, authored) : [];
    this.backdrop = new Backdrop({ sky: [0x9fd8f5, 0xfff6e0], hills: [0x9fd8f5, 0x7cc7ec, 0xffe7a3], horizon: 0.42, clouds: 2, sun: true, seed: 131 }, ctx.view);
    ctx.stage.addChild(this.backdrop, this.board);
    window.addEventListener('pointerdown', this.down);
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.up);
  }

  start() {
    this.build();
    const level = this.plan.level;
    if (level === 4) void this.ctx.say('lens.instruct.enough').then(() => { if (this.alive) void this.askQuestion(); });
    else void this.instruct(level === 1 ? 'lens.instruct.tap' : level === 2 ? 'lens.instruct.over' : 'lens.instruct.anyone');
  }

  destroy() {
    this.alive = false;
    this.drag?.destroy();
    this.drag = null;
    window.removeEventListener('pointerdown', this.down);
    window.removeEventListener('pointerup', this.up);
    window.removeEventListener('pointercancel', this.up);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (this.busy || this.drag?.dragging) {
      this.relayout = true;
      return;
    }
    this.build();
  }

  private settle() {
    this.busy = false;
    if (this.relayout && this.alive && !this.finished) this.build();
  }

  /** The sample under the lens now. */
  get sample(): SampleId {
    const level = this.plan.level;
    if (level <= 2) return THINGS[Math.min(this.index, 2)];
    if (level === 4) return this.questions[0].sample;
    return this.drops[this.index]?.swimmers.length ? 'drop' : 'drop-empty';
  }

  private get drop(): Drop | null {
    if (this.plan.level === 3) return this.drops[this.index] ?? null;
    return this.plan.level === 4 && this.sample === 'drop' ? this.drops[0] : null;
  }

  get question(): Question | undefined {
    return this.questions[this.index];
  }

  private instruct(id: LineId, vars?: LineVars) {
    return this.ctx.instruct(id, vars);
  }

  private say(id: LineId, vars?: LineVars) {
    return this.ctx.say(id, vars);
  }

  // ----- building -----

  private build() {
    this.relayout = false;
    this.drag?.destroy();
    this.drag = null;
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    this.lensHit = this.lensView = this.pointer = this.glass = this.under = this.underMask = this.answer = null;
    this.layers = [];
    this.swimmerNodes = [];
    this.stopButtons = [];
    this.thingTicks = [];
    if (this.finished) return;
    const l = lensLayout(this.view, this.plan.level);
    this.layout = l;
    if (!l) return;
    if (this.plan.level === 2) return this.buildTable(l);
    this.buildLens(l);
  }

  private buildLens(l: LensLayout) {
    const level = this.plan.level;
    const { x, y, r } = l.lens;
    // The puddle-side table the slide lies on.
    const table = new Graphics().roundRect(x - r - 60, y + r * 0.55, r * 2 + 120, r * 0.7, 30).fill(wood.light).stroke({ width: 6, color: wood.line });
    table.eventMode = 'none';
    this.board.addChild(table);
    if (l.paw) {
      const paw = pawArt(this.petColor, l.paw.r);
      paw.position.set(l.paw.x, l.paw.y);
      paw.eventMode = 'none';
      this.board.addChild(paw);
    }
    const view = new Container();
    view.position.set(x, y);
    view.scale.set(r / ART_R);
    const mask = new Graphics().circle(x, y, r).fill(0xffffff);
    view.mask = mask;
    for (const stop of STOPS) {
      const layer = viewLayer(this.sample, stop, this.looks);
      layer.alpha = stop === this.stop ? 1 : 0;
      const drop = this.drop;
      const nodes: Container[] = [];
      if (drop && stop >= 3) {
        for (const s of drop.swimmers) {
          const node = swimmerArt(s.shape, SWIMMER_LENGTH * dropScale(stop), stop === 4);
          layer.addChild(node);
          nodes.push(node);
        }
      }
      this.swimmerNodes.push(nodes);
      view.addChild(layer);
      this.layers.push(layer);
    }
    view.addChild(lensShine(ART_R));
    view.eventMode = 'none';
    this.board.addChild(view, mask);
    this.lensView = view;
    const frame = lensFrame(r, level >= 3);
    frame.position.set(x, y);
    frame.eventMode = 'none';
    this.board.addChild(frame);
    if (level >= 3) {
      // The dial's pointer on the brass ring shows which stop the lens is at.
      const pointer = new Graphics().moveTo(r + 2, 0).lineTo(r + 30, -12).lineTo(r + 30, 12).closePath().fill(0x7a5a1c);
      pointer.position.set(x, y);
      pointer.rotation = this.stopAngle(this.stop);
      pointer.eventMode = 'none';
      for (const s of STOPS) {
        const a = this.stopAngle(s);
        frame.addChild(new Graphics().circle(Math.cos(a) * (r + 14), Math.sin(a) * (r + 14), 6).fill(0xfff3c0));
      }
      this.board.addChild(pointer);
      this.pointer = pointer;
    }
    const hit = new Container();
    hit.position.set(x, y);
    hit.hitArea = new Circle(0, 0, r);
    onTap(hit, (e: FederatedPointerEvent) => this.tapLens(hit.toLocal(e.global)), { cooldown: 200 });
    this.board.addChild(hit);
    this.lensHit = hit;
    if (level >= 3) {
      l.stops.forEach((rect, i) => {
        const stop = STOPS[i];
        const b = new StopButton(stop, rect.w, stopPicture(stop), () => void this.turnTo(stop, true));
        b.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2);
        this.board.addChild(b);
        this.stopButtons.push(b);
      });
      if (l.answer) {
        const a = l.answer;
        const b = new StopButton('answer', a.w, level === 3 ? noneIcon() : showIcon(), () => void (level === 3 ? this.answerNone() : this.show()));
        b.position.set(a.x + a.w / 2, a.y + a.h / 2);
        this.board.addChild(b);
        this.answer = b;
      }
      this.markStop();
    }
    this.placeSwimmers();
  }

  private get petColor(): ColorName {
    return (this.ctx.pet.color as ColorName) ?? 'orange';
  }

  /** Where each stop's mark sits on the brass ring: across the top, closest at the right. */
  private stopAngle(stop: Stop) {
    return -Math.PI * (0.85 - (stop - 1) * 0.2);
  }

  private buildTable(l: LensLayout) {
    const t = l.table!;
    const top = new Graphics().roundRect(t.x, l.things[0].y - 120, t.w, 360, 34).fill(wood.light).stroke({ width: 6, color: wood.line });
    top.eventMode = 'none';
    this.board.addChild(top);
    const flat = new Container();
    const zoomed = new Container();
    flat.eventMode = zoomed.eventMode = 'none';
    zoomed.addChild(new Graphics().roundRect(t.x, l.things[0].y - 120, t.w, 360, 34).fill(wood.light));
    l.things.forEach((ring, i) => {
      for (const [into, close] of [[flat, false], [zoomed, true]] as const) {
        const g = thingArt(THINGS[i], this.looks, ring.r * 2, close);
        g.position.set(ring.x, ring.y);
        into.addChild(g);
      }
      const tick = new Graphics().circle(0, 0, 22).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line }).moveTo(-10, 0).lineTo(-3, 8).lineTo(11, -9).stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
      tick.position.set(ring.x + ring.r * 0.8, ring.y - ring.r * 0.8);
      tick.visible = this.tracker.looked.has(i);
      this.thingTicks.push(tick);
    });
    if (l.paw) {
      for (const into of [flat, zoomed]) {
        const paw = pawArt(this.petColor, l.paw.r);
        paw.position.set(l.paw.x, l.paw.y);
        into.addChild(paw);
      }
    }
    this.board.addChild(flat, ...this.thingTicks);
    const mask = new Graphics().circle(0, 0, GLASS_R).fill(0xffffff);
    zoomed.mask = mask;
    this.board.addChild(zoomed, mask);
    this.under = zoomed;
    this.underMask = mask;
    const glass = new Container();
    glass.addChild(handLensArt(GLASS_R), lensShine(GLASS_R));
    glass.hitArea = new Circle(0, 0, GLASS_R + 20);
    const at = this.glassAt ? clampGlass(this.glassAt, t) : l.rest!;
    glass.position.set(at.x, at.y);
    this.board.addChild(glass);
    this.glass = glass;
    this.drag = draggable(glass, this.ctx.tw, {
      onPick: () => sfx.pop(6),
      onMove: (x, y) => (this.glassAt = { x, y }),
      onDrop: (x, y) => {
        const p = clampGlass({ x, y }, t);
        glass.position.set(p.x, p.y);
        this.glassAt = p;
        if (this.relayout) queueMicrotask(() => this.alive && !this.busy && this.build());
        return true;
      },
    });
    this.placeGlass();
  }

  /** The level-2 glass shows the table twice as big under it. */
  private placeGlass() {
    if (!this.glass || !this.under || !this.underMask) return;
    const g = this.glass.position;
    this.underMask.position.set(g.x, g.y);
    this.under.scale.set(GLASS_ZOOM);
    this.under.position.set(g.x * (1 - GLASS_ZOOM), g.y * (1 - GLASS_ZOOM));
  }

  // ----- every frame -----

  update(dt: number) {
    this.clock += dt;
    if (this.fingers.size === 0) this.swimT += dt;
    this.placeSwimmers();
    this.placeGlass();
    const glowStops: Stop[] = [];
    if (!this.finished && this.tally.glow) {
      if (this.plan.level === 3) glowStops.push(DECIDING);
      else if (this.question) glowStops.push(...acceptedStops(this.question));
    }
    for (const b of this.stopButtons) {
      b.glow.visible = glowStops.includes(b.stop as Stop);
      if (b.glow.visible) b.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 6);
    }
    if (this.finished || !this.alive) return;
    if (this.plan.level === 1 && this.swollen) {
      this.holdLeft -= dt;
      if (this.holdLeft <= 0) void this.shrink();
    }
    if (this.plan.level === 2 && this.glass && !this.busy) this.updateLooking(dt);
  }

  /** Swimmers drift on their own seeded paths, inside the drop. */
  private placeSwimmers() {
    const drop = this.drop;
    if (!drop) return;
    this.swimmerNodes.forEach((nodes, i) => {
      const scale = dropScale(STOPS[i]);
      nodes.forEach((n, k) => {
        const p = swimmerAt(drop.swimmers[k], this.swimT);
        n.position.set(p.x * scale, p.y * scale);
        n.rotation = p.angle;
      });
    });
  }

  /** Swimmers' centres now, in screen units from the lens's centre, at the current stop. */
  private swimmerSpots(): { x: number; y: number }[] {
    const drop = this.drop;
    const l = this.layout;
    if (!drop || !l || this.stop < 3) return [];
    const k = (dropScale(this.stop) * l.lens.r) / ART_R;
    return drop.swimmers.map((s) => {
      const p = swimmerAt(s, this.swimT);
      return { x: p.x * k, y: p.y * k };
    });
  }

  // ----- level 1: tap the lens -----

  private tapLens(at: { x: number; y: number }) {
    if (this.finished) return;
    const level = this.plan.level;
    if (level === 1) {
      if (this.swollen) return void this.shrink();
      if (!this.busy) void this.swell();
      return;
    }
    if (level === 3 && !this.busy) {
      const spot = nearestSwimmer(at, this.swimmerSpots(), this.layout?.lens.r ?? 0);
      return void this.judge(judgeSwimmers(this.drops[this.index], this.stop, { kind: 'tap', swimmer: spot }), spot);
    }
  }

  private async swell() {
    const [near, close] = [this.layers[0], this.layers[1]];
    if (!near || !close) return;
    this.busy = true;
    const e = this.epoch;
    close.scale.set(0.36);
    sfx.bell(4, 0.25);
    void this.ctx.tw.to(near, { alpha: 0 }, { duration: 0.3 });
    void this.ctx.tw.to(close, { alpha: 1 }, { duration: 0.3 });
    await this.ctx.tw.to(close.scale, { x: 1, y: 1 }, { duration: 0.55, ease: ease.outBack });
    if (!this.alive || e !== this.epoch) return;
    sfx.sparkle();
    const l = this.layout!;
    this.ctx.particles.burst(l.lens.x, l.lens.y - l.lens.r * 0.6, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 10, speed: [80, 200], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    void this.say('lens.bigger');
    this.swollen = true;
    this.holdLeft = HOLD;
  }

  private async shrink() {
    if (!this.swollen) return;
    const e = this.epoch;
    this.swollen = false;
    const [near, close] = [this.layers[0], this.layers[1]];
    void this.ctx.tw.to(near, { alpha: 1 }, { duration: 0.35 });
    void this.ctx.tw.to(close, { alpha: 0 }, { duration: 0.35 });
    await this.ctx.tw.to(close.scale, { x: 0.36, y: 0.36 }, { duration: 0.4 });
    if (!this.alive || e !== this.epoch) return;
    this.index++;
    this.tally.next();
    if (this.index >= 3) {
      await this.ctx.tw.wait(1.5);
      return void this.finale();
    }
    // The next thing slides in under the lens.
    this.relayout = false;
    this.build();
    const view = this.layers[0];
    view.x = ART_R * 2.2;
    sfx.whoosh();
    await this.ctx.tw.to(view, { x: 0 }, { duration: 0.5, ease: ease.outCubic });
    if (!this.alive || e !== this.epoch) return;
    this.settle();
  }

  // ----- level 2: the hand lens -----

  private updateLooking(dt: number) {
    const l = this.layout;
    if (!l || !this.glass) return;
    const g = this.glass.position;
    // A drag in progress is looking too; only the glass's centre counts.
    const looked = this.tracker.update(dt, g, l.things);
    if (looked !== null) {
      this.thingTicks[looked].visible = true;
      this.thingTicks[looked].scale.set(0);
      void this.ctx.tw.to(this.thingTicks[looked].scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      sfx.bell(3 + this.tracker.looked.size * 2, 0.3);
      this.tally.next();
      void this.say('lens.bigger');
      if (this.tracker.done) void this.finishTable();
    }
    if (l.paw) {
      const d = Math.hypot(l.paw.x - g.x, l.paw.y - g.y);
      if (d < 50) this.pawSeen = true;
      else if (this.pawSeen && !this.pawSaid && d > GLASS_R + l.paw.r) {
        this.pawSaid = true;
        void this.say('lens.same-paw');
      }
    }
  }

  private async finishTable() {
    this.busy = true;
    const e = this.epoch;
    if (this.drag) this.drag.enabled = false;
    await this.ctx.tw.wait(1);
    if (this.alive && e === this.epoch) void this.finale();
  }

  // ----- levels 3–4: the dial -----

  /** Turn the dial to `stop`, a click and a rising note for each stop on the way. */
  async turnTo(stop: Stop, byHand = false) {
    if (this.finished || (this.busy && byHand)) return;
    const id = ++this.turnId;
    while (this.stop !== stop) {
      const from = this.stop;
      const next = (from + Math.sign(stop - from)) as Stop;
      this.stop = next;
      sfx.tick();
      sfx.bell(2 + next * 2, 0.22);
      const a = this.layers[from - 1];
      const b = this.layers[next - 1];
      if (a) void this.ctx.tw.to(a, { alpha: 0 }, { duration: 0.3 });
      if (b) void this.ctx.tw.to(b, { alpha: 1 }, { duration: 0.3 });
      if (this.pointer) void this.ctx.tw.to(this.pointer, { rotation: this.stopAngle(next) }, { duration: 0.2 });
      this.markStop();
      await this.ctx.tw.wait(0.22);
      if (!this.alive || id !== this.turnId) return;
    }
    if (this.plan.level === 3 && this.stop >= DECIDING && this.drop && !this.movingSaid) {
      this.movingSaid = true;
      void this.say('lens.moving');
    }
  }

  private markStop() {
    for (const b of this.stopButtons) b.setLit(b.stop === this.stop);
  }

  private answerNone() {
    if (this.busy || this.finished) return;
    void this.judge(judgeSwimmers(this.drops[this.index], this.stop, { kind: 'none' }), null);
  }

  private async judge(v: SwimmerVerdict, swimmer: number | null) {
    if (v.result === 'free') return void this.say(v.line);
    if (v.result === 'miss') {
      this.tally.miss();
      sfx.boing();
      return void this.say(v.line);
    }
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    this.ctx.pet.cheer();
    const node = swimmer !== null ? this.swimmerNodes[this.stop - 1]?.[swimmer] : null;
    if (node) void this.ctx.tw.to(node.scale, { x: 1.25, y: 1.25 }, { duration: 0.18 }).then(() => { if (!node.destroyed) void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.18 }); });
    await this.say(v.line);
    await this.ctx.tw.wait(0.6);
    if (!this.alive || e !== this.epoch) return;
    this.index++;
    this.tally.next();
    if (this.index >= this.drops.length) return void this.finale();
    this.nextView();
  }

  /** The next drop or question: the dial goes back to the eyes and the slide changes (level 3) or stays (level 4). */
  private nextView() {
    this.turnId++;
    this.stop = 1;
    this.movingSaid = false;
    this.relayout = false;
    this.build();
    sfx.whoosh();
    this.busy = false;
    if (this.plan.level === 4) void this.askQuestion();
  }

  private askQuestion() {
    const q = this.question;
    if (!q || this.finished) return;
    return this.instruct(`lens.ask.${q.feature}` as LineId);
  }

  private async show() {
    const q = this.question;
    if (this.busy || this.finished || !q) return;
    const v = judgeView(q, this.stop);
    if (v !== 'ok') {
      this.tally.miss();
      sfx.boing();
      return void this.say(v === 'too-small' ? 'lens.too-small' : 'lens.too-close', { thing: q.thing });
    }
    this.busy = true;
    const e = this.epoch;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.say('lens.just-right', { what: q.what });
    await this.ctx.tw.wait(0.5);
    if (!this.alive || e !== this.epoch) return;
    this.index++;
    this.tally.next();
    if (this.index >= this.questions.length) return void this.finale();
    this.settle();
    void this.askQuestion();
  }

  // ----- help, restart, finish -----

  askForHint() {
    if (this.finished || this.busy || this.drag?.dragging) return;
    const l = this.layout;
    const level = this.plan.level;
    const help = helpFor(level, { glass: this.glass?.position, things: l?.things, looked: this.tracker.looked, question: this.question });
    if (!help) return;
    this.tally.hint();
    void this.say('lens.hint');
    if (help.do === 'tap-lens') {
      if (!this.swollen) void this.swell();
    } else if (help.do === 'glide' && this.glass && l) {
      const to = l.things[help.to];
      // The glide holds the table still (a resize waits for it) and the glass cannot be grabbed until it lands.
      this.busy = true;
      if (this.drag) this.drag.enabled = false;
      const e = this.epoch;
      void this.ctx.tw.to(this.glass, { x: to.x, y: to.y }, { duration: 0.8, ease: ease.outCubic }).then(() => {
        if (!this.alive || e !== this.epoch) return;
        this.glassAt = { x: to.x, y: to.y };
        if (this.drag) this.drag.enabled = true;
        this.settle();
      });
    } else if (help.do === 'turn') void this.turnTo(help.stop);
  }

  hintLabel = 'Show a hint';

  /** Start again: the same round from its first question, misses and hints kept. */
  restart() {
    if (this.finished) return;
    this.epoch++;
    this.index = 0;
    this.stop = 1;
    this.turnId++;
    this.swollen = false;
    this.movingSaid = this.pawSeen = this.pawSaid = false;
    this.tracker.looked.clear();
    this.glassAt = null;
    this.tally.next();
    this.busy = false;
    this.build();
    if (this.plan.level === 4) void this.askQuestion();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    const v = this.lensView;
    if (v) void this.ctx.tw.to(v, { rotation: 0.05 }, { duration: 0.2 }).then(() => { if (!v.destroyed) void this.ctx.tw.to(v, { rotation: 0 }, { duration: 0.2 }); });
    await this.say('lens.done');
    await this.ctx.tw.wait(0.8);
    if (this.alive) this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  // ----- the ghost finger -----

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layout) return null;
    const level = this.plan.level;
    if (level === 1) return this.swollen || !this.lensHit ? null : { tap: { on: this.lensHit } };
    if (level === 2) {
      if (!this.glass || this.drag?.dragging) return null;
      const help = helpFor(2, { glass: this.glass.position, things: this.layout.things, looked: this.tracker.looked });
      if (!help || help.do !== 'glide') return null;
      const to = this.layout.things[help.to];
      if (Math.hypot(to.x - this.glass.x, to.y - this.glass.y) <= 10) return null;
      return { drag: { on: this.glass }, to: { on: this.board, x: to.x, y: to.y }, pause: 0.8 };
    }
    const want: Stop = level === 3 ? DECIDING : windowOf(this.question!)[0];
    if (this.stop !== want) {
      const next = (this.stop + Math.sign(want - this.stop)) as Stop;
      return { tap: { on: this.stopButtons[next - 1] }, pause: 0.6 };
    }
    if (level === 3 && this.drop && this.lensHit) {
      const spots = this.swimmerSpots();
      const k = spots.findIndex((s) => Math.hypot(s.x, s.y) < (this.layout?.lens.r ?? 0) * 0.8);
      if (k >= 0) return { tap: { on: this.swimmerNodes[this.stop - 1][k] }, receiver: this.lensHit };
      // Swimmers are here but drifting near the edge: wait for one rather than say No swimmers.
      if (this.drop.swimmers.length) return null;
    }
    return this.answer ? { tap: { on: this.answer } } : null;
  }
}

class LensIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const leaf = leafArt('round', 110, true);
    leaf.y = -80;
    const lens = handLensArt(62);
    lens.position.set(-6, -96);
    c.addChild(leaf, lens);
    super(c);
    this.hitArea = new Circle(0, -90, 110);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const looks = looksFor(rng, false);
  const sample = rng.pick(['leaf', 'drop'] as const);
  const view = viewLayer(sample, sample === 'leaf' ? 4 : 3, looks);
  if (sample === 'drop') {
    const s = swimmerArt(rng.pick(['round', 'long', 'bean'] as const), 150, false);
    s.rotation = rng.range(-0.6, 0.6);
    view.addChild(s);
  }
  view.scale.set(0.42);
  const mask = new Graphics().circle(0, 0, ART_R * 0.42).fill(0xffffff);
  view.mask = mask;
  c.addChild(view, mask, lensFrame(ART_R * 0.42, true));
  return c;
}

export const puddleLens: GameModule = {
  id: 'puddle-lens',
  name: 'Puddle Lens',
  titleLine: 'game.puddle-lens',
  region: 'tinker-lab',
  skills: ['observation', 'magnification', 'scale', 'science'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  touchDemo: true,
  coplayHint: 'Slide and lens: ask {name} for a view ("show me the little boxes!"), then check it together.',
  offScreen: 'Look at a leaf with just your eyes. What would a lens show?',
  hubIcon: () => new LensIcon(),
  sticker,
  create: (ctx) => new PuddleLens(ctx),
};
