import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { entryId } from '../../content/journal';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { drawClay, floatIcon, sameWeightIcon, sinkIcon, thingArt } from './art';
import { ALL_SHAPES, CLAY_SHAPES, floats, rightBasket, shapesFor, sinkPlan, thingsFor, type ClayExperiment, type ClayShape, type SinkPlan, type Thing } from './logic';

interface Item {
  thing: Thing;
  node: Container;
  drag: DragHandle | null;
  /** Dropped in the water or sorted into a basket. */
  done: boolean;
}

/** Something in the water: floaters bob at the surface, sinkers rest on the bottom. */
interface Wet {
  node: Container;
  floats: boolean;
  slot: number;
  phase: number;
  settled: boolean;
}

class SinkFloat implements Game {
  readonly plan: SinkPlan;
  readonly items: Item[] = [];
  readonly wet: Wet[] = [];
  /** Guess levels: the thing being guessed about, one at a time. */
  current = 0;
  guessing = false;
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;

  private readonly background = new Graphics();
  private readonly tankBack = new Graphics();
  private readonly tankFront = new Graphics();
  private readonly tray = new Graphics();
  private readonly glow = new Graphics();
  readonly floatButton = new Container();
  readonly sinkButton = new Container();
  private readonly baskets = new Graphics();
  private readonly basketFill = { float: 0, sink: 0 };
  private tank = { l: 0, r: 0, top: 0, surface: 0, bottom: 0 };
  private view: View;
  private clock = 0;
  private nextSlot = 0;
  /** Things she has watched go into the water this round: the discoveries for her journal. */
  private readonly seen = new Set<Thing>();
  // Couch play on guessing levels: a ring on Float (left) or Sink (right).
  private pick = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1.5;
  // Make it float (level 7): one lump of clay, three shape tiles, and the experiment under way.
  readonly experiments: ClayExperiment[] = [];
  experiment = 0;
  readonly tiles: { shape: ClayShape; node: Container; icon: Graphics }[] = [];
  /** The shape tiles take a tap. */
  choosing = false;
  /** Sinking trials in this experiment: experiments, never misses. */
  sunk = 0;
  private hinted = false;
  private glowOn = false;
  private readonly clay = new Container();
  private readonly clayArt = new Graphics();
  clayShape: ClayShape | 'ball' = 'ball';
  private clayAt: 'shelf' | 'moving' | 'float' | 'bottom' = 'shelf';
  private readonly leak = { water: 0 };
  private drawnWater = 0;
  private sameWeight: Container | null = null;
  askForHint?: () => void;
  hintLabel?: string;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = sinkPlan(ctx.level);
    ctx.stage.addChild(this.background, this.tankBack, this.tray, this.baskets);
    if (this.plan.mode === 'shape') this.buildClay();
    for (const thing of this.plan.mode === 'shape' ? [] : thingsFor(this.plan, ctx.rng)) {
      const node = new Container();
      node.addChild(thingArt(thing));
      node.hitArea = new Rectangle(-60, -60, 120, 120);
      const item: Item = { thing, node, drag: null, done: false };
      if (this.plan.mode === 'sort') item.drag = draggable(node, ctx.tw, { onPick: () => sfx.tick(), onDrop: (x, y) => this.sort(item, x, y) });
      else if (this.plan.mode !== 'guess') onTap(node, () => this.tapDrop(item));
      this.items.push(item);
      ctx.stage.addChild(node);
    }
    for (const [button, icon, guess] of [[this.floatButton, floatIcon(), true], [this.sinkButton, sinkIcon(), false]] as const) {
      button.addChild(tile(150, 130), icon);
      icon.scale.set(1.3);
      button.hitArea = new Rectangle(-85, -75, 170, 150);
      onTap(button, () => this.guess(guess));
      button.visible = this.plan.mode === 'guess';
      ctx.stage.addChild(button);
    }
    this.ring.eventMode = 'none';
    ctx.stage.addChild(this.tankFront, this.glow, this.ring);
  }

  private buildClay() {
    this.experiments.push(...shapesFor(this.plan, this.ctx.rng));
    this.clay.addChild(this.clayArt);
    this.clay.visible = false;
    this.ctx.stage.addChild(this.clay);
    for (const shape of ALL_SHAPES) {
      const node = new Container();
      const icon = new Graphics();
      icon.scale.set(0.95);
      icon.y = -6;
      node.addChild(tile(150, 130), icon);
      node.hitArea = new Rectangle(-85, -75, 170, 150);
      node.visible = false;
      onTap(node, () => this.tryShape(shape));
      this.tiles.push({ shape, node, icon });
      this.ctx.stage.addChild(node);
    }
    this.askForHint = () => this.showClayHint();
    this.hintLabel = 'Show a hint';
  }

  start() {
    if (this.plan.mode === 'shape') void this.nextExperiment();
    else if (this.plan.mode === 'guess') void this.nextGuess();
    else void this.ctx.instruct(this.plan.mode === 'sort' ? 'sink.sort' : 'sink.drop');
  }

  /**
   * The ghost finger on the how-to card: tap each thing to drop it in, guess the right button for it, or carry it to its basket.
   * (A guess is never a wrong answer here, but a demonstration shows the plain right one.)
   */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.plan.mode === 'shape') return this.choosing ? { tap: { on: this.tileFor('boat').node } } : null;
    if (this.plan.mode === 'guess') {
      if (!this.guessing) return null;
      return { tap: { on: rightBasket(this.items[this.current].thing) === 'float' ? this.floatButton : this.sinkButton } };
    }
    const item = this.items.find((i) => !i.done && !i.node.destroyed && !i.drag?.dragging);
    if (!item) return null;
    if (this.plan.mode !== 'sort') return { tap: { on: item.node } };
    return { drag: { on: item.node }, to: { on: this.baskets, x: this.view.w * 0.87, y: this.basketY(rightBasket(item.thing)) } };
  }

  // Dropping things in ----------------------------------------------------------------

  private tapDrop(item: Item) {
    if (item.done || this.finished) return;
    item.done = true;
    void this.splash(item).then(() => {
      if (this.plan.mode === 'say') void this.ctx.say(floats(item.thing) ? 'sink.floats' : 'sink.sinks');
      if (this.items.every((i) => i.done)) void this.end();
    });
  }

  /** Arcs a thing over the tank and into the water; floaters bob, sinkers drift to the bottom. */
  private async splash(item: Item) {
    const t = this.tank;
    const tw = this.ctx.tw;
    this.seen.add(item.thing);
    // Reserve the spot now: several things can be in the air at once.
    const slot = this.nextSlot++;
    const x = this.slotX(slot);
    const node = item.node;
    this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.tankFront));
    tw.kill(node);
    await tw.to(node, { x, y: t.top - 70 }, { duration: 0.45, ease: ease.outQuad });
    await tw.to(node, { y: t.surface }, { duration: 0.25, ease: ease.inQuad });
    sfx.splash();
    this.ctx.particles.burst(x, t.surface, { colors: [swatch.blue.fill, swatch.blue.light], count: 14, speed: [150, 320], gravity: 700, angle: -Math.PI / 2, spread: 1.4, size: [0.3, 0.5] });
    const wet: Wet = { node, floats: floats(item.thing), slot, phase: this.ctx.rng.range(0, 6), settled: false };
    this.wet.push(wet);
    if (wet.floats) {
      await tw.to(node, { y: t.surface - 8 }, { duration: 0.3, ease: ease.outBack });
      sfx.pop(9);
    } else {
      for (let i = 0; i < 3; i++) void tw.wait(0.2 + i * 0.25).then(() => sfx.pop(3 - i));
      this.ctx.particles.burst(x, t.surface + 40, { kind: 'ring', colors: [swatch.white.fill], count: 6, speed: [20, 60], gravity: -120, angle: -Math.PI / 2, spread: 0.6, life: [0.8, 1.2] });
      await tw.to(node, { y: t.bottom - 38 }, { duration: 1.1, ease: ease.inOutSine });
      sfx.clunk();
    }
    wet.settled = true;
  }

  private slotX(slot: number) {
    const t = this.tank;
    const n = Math.max(this.items.length, 5);
    return t.l + 60 + ((t.r - t.l - 120) * (slot % n)) / Math.max(1, n - 1);
  }

  // Guessing --------------------------------------------------------------------------

  private async nextGuess() {
    const item = this.items[this.current];
    if (!item) return void this.end();
    this.guessing = true;
    const node = item.node;
    node.scale.set(0);
    void this.ctx.tw.to(node.scale, { x: 1.2, y: 1.2 }, { duration: 0.35, ease: ease.outBack });
    void this.ctx.instruct('sink.guess', { thing: item.thing });
  }

  private guess(floatsGuess: boolean) {
    if (!this.guessing || this.finished) return;
    this.guessing = false;
    const item = this.items[this.current];
    item.done = true;
    (floatsGuess ? this.floatButton : this.sinkButton).scale.set(0.9);
    void this.ctx.tw.to((floatsGuess ? this.floatButton : this.sinkButton).scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    // A guess is never a wrong answer: the water shows what happens, and surprises are celebrated too.
    void this.splash(item).then(async () => {
      const result = floats(item.thing);
      await this.ctx.say(result ? 'sink.floats' : 'sink.sinks');
      if (result === floatsGuess) {
        this.ctx.pet.cheer();
        await this.ctx.say('sink.right');
      } else {
        sfx.sparkle();
        await this.ctx.say('sink.surprise');
      }
      this.current++;
      this.resize(this.view);
      void this.nextGuess();
    });
  }

  // Sorting ---------------------------------------------------------------------------

  private basketAt(x: number, y: number): 'float' | 'sink' | null {
    const v = this.view;
    const bx = v.w * 0.87;
    if (Math.abs(x - bx) > 110) return null;
    if (Math.abs(y - this.basketY('float')) < 95) return 'float';
    if (Math.abs(y - this.basketY('sink')) < 95) return 'sink';
    return null;
  }

  private basketY(kind: 'float' | 'sink') {
    return kind === 'float' ? this.view.h * 0.3 : this.view.h * 0.56;
  }

  private sort(item: Item, x: number, y: number): boolean {
    if (this.busy || this.finished || item.done) return false;
    const basket = this.basketAt(x, y);
    if (!basket) return false;
    const right = (basket === 'float') === floats(item.thing);
    item.done = true;
    item.drag!.enabled = false;
    if (right) {
      this.wrong = 0;
      sfx.bell(5 + this.items.filter((i) => i.done).length, 0.3);
      this.toBasket(item, basket);
      this.after();
      return true;
    }
    // Not quite: test it in the water, then it goes where it belongs.
    this.misses++;
    this.wrong++;
    if (this.wrong === 2) this.hints++;
    sfx.boing();
    void this.ctx.say('sink.oops');
    this.busy = true;
    void this.splash(item).then(async () => {
      await this.ctx.say(floats(item.thing) ? 'sink.floats' : 'sink.sinks');
      if (this.wrong >= 2) void this.ctx.say('sink.hint');
      this.wet.splice(this.wet.findIndex((w) => w.node === item.node), 1);
      this.toBasket(item, floats(item.thing) ? 'float' : 'sink');
      this.busy = false;
      this.after();
    });
    this.drawGlow();
    return true;
  }

  private toBasket(item: Item, kind: 'float' | 'sink') {
    const n = this.basketFill[kind]++;
    const x = this.view.w * 0.87 - 50 + (n % 3) * 50;
    const y = this.basketY(kind) - 10 - Math.floor(n / 3) * 30;
    this.ctx.tw.kill(item.node);
    void this.ctx.tw.to(item.node, { x, y }, { duration: 0.35, ease: ease.outQuad });
    void this.ctx.tw.to(item.node.scale, { x: 0.55, y: 0.55 }, { duration: 0.35 });
  }

  private after() {
    this.drawGlow();
    if (this.items.every((i) => i.done) && !this.busy) void this.end();
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    await this.ctx.tw.wait(1.4);
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say('sink.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries: [...this.seen].map((t) => entryId('sink-float', t)) });
  }

  // Make it float ----------------------------------------------------------------------

  private tileFor(shape: ClayShape) {
    return this.tiles.find((t) => t.shape === shape)!;
  }

  private setClay(shape: ClayShape | 'ball') {
    this.clayShape = shape;
    this.leak.water = this.drawnWater = 0;
    drawClay(this.clayArt, shape, this.experiments[this.experiment].color);
  }

  /** A fresh lump: it is shown sinking first, then the tiles ask her to change its shape. */
  private async nextExperiment() {
    const e = this.experiments[this.experiment];
    if (!e) return void this.end();
    const tw = this.ctx.tw;
    this.sunk = 0;
    this.hinted = this.glowOn = false;
    this.sameWeight?.destroy({ children: true });
    this.sameWeight = null;
    for (const t of this.tiles) drawClay(t.icon, t.shape, e.color);
    this.setClay('ball');
    this.clay.visible = true;
    this.clay.alpha = 1;
    this.clay.rotation = 0;
    this.clayAt = 'shelf';
    this.clay.scale.set(0);
    this.resize(this.view);
    await tw.to(this.clay.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    await this.ctx.say('sink.clay-sinks');
    await this.dunk();
    await this.lift();
    this.choosing = true;
    this.resize(this.view);
    void this.ctx.instruct('sink.clay-ask');
  }

  private tryShape(shape: ClayShape) {
    if (!this.choosing || this.finished) return;
    this.choosing = false;
    this.glowOn = false;
    const node = this.tileFor(shape).node;
    node.scale.set(0.9);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.resize(this.view);
    void this.trial(shape);
  }

  /** One trial: squash the clay into the shape, drop it in, and say what happened and why. */
  private async trial(shape: ClayShape) {
    const tw = this.ctx.tw;
    sfx.squish();
    await tw.to(this.clay.scale, { x: 1.3, y: 0.6 }, { duration: 0.15, ease: ease.outQuad });
    this.setClay(shape);
    await tw.to(this.clay.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    const floated = await this.dunk();
    await this.ctx.say(CLAY_SHAPES[shape].line);
    if (floated) {
      this.ctx.pet.cheer();
      sfx.sparkle();
      const icon = (this.sameWeight = sameWeightIcon(this.experiments[this.experiment].color));
      icon.eventMode = 'none';
      this.ctx.stage.addChildAt(icon, this.ctx.stage.getChildIndex(this.glow));
      icon.scale.set(0);
      this.resize(this.view);
      void tw.to(icon.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      await this.ctx.say('sink.clay-same');
      await tw.wait(0.6);
      this.experiment++;
      if (this.experiment >= this.experiments.length) return void this.end();
      await tw.to(this.clay, { alpha: 0 }, { duration: 0.4 });
      return void this.nextExperiment();
    }
    this.sunk++;
    await this.lift();
    if (this.sunk >= 2) this.showClayHint();
    this.choosing = true;
    this.resize(this.view);
  }

  /** The boat tile glows with a spoken clue: after two sinking trials, or when she asks. One hint per experiment. */
  private showClayHint() {
    if (this.finished || this.plan.mode !== 'shape') return;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    this.glowOn = true;
    this.drawGlow();
    void this.ctx.say('sink.clay-hint');
  }

  /** Arcs the clay into the middle of the tank. A boat bobs; a leaky boat fills through its hole first; the rest sink. */
  private async dunk(): Promise<boolean> {
    const t = this.tank;
    const tw = this.ctx.tw;
    const node = this.clay;
    const x = (t.l + t.r) / 2;
    this.clayAt = 'moving';
    tw.kill(node);
    await tw.to(node, { x, y: t.top - 70 }, { duration: 0.45, ease: ease.outQuad });
    await tw.to(node, { y: t.surface }, { duration: 0.25, ease: ease.inQuad });
    sfx.splash();
    this.ctx.particles.burst(x, t.surface, { colors: [swatch.blue.fill, swatch.blue.light], count: 14, speed: [150, 320], gravity: 700, angle: -Math.PI / 2, spread: 1.4, size: [0.3, 0.5] });
    if (this.clayShape === 'boat' || this.clayShape === 'leaky') {
      await tw.to(node, { y: t.surface - 8 }, { duration: 0.3, ease: ease.outBack });
      this.clayAt = 'float';
      if (this.clayShape === 'boat') {
        sfx.pop(9);
        return true;
      }
      await tw.wait(0.4);
      for (let i = 0; i < 4; i++) void tw.wait(i * 0.25).then(() => this.ctx.particles.burst(node.x + 14, node.y + 30, { kind: 'ring', colors: [swatch.white.fill], count: 3, speed: [20, 50], gravity: -120, angle: -Math.PI / 2, spread: 0.5, life: [0.6, 1] }));
      await tw.to(this.leak, { water: 1 }, { duration: 1, ease: ease.inOutSine });
      this.clayAt = 'moving';
    }
    for (let i = 0; i < 3; i++) void tw.wait(0.2 + i * 0.25).then(() => sfx.pop(3 - i));
    this.ctx.particles.burst(x, t.surface + 40, { kind: 'ring', colors: [swatch.white.fill], count: 6, speed: [20, 60], gravity: -120, angle: -Math.PI / 2, spread: 0.6, life: [0.8, 1.2] });
    await tw.to(node, { y: t.bottom - 30, rotation: this.clayShape === 'leaky' ? 0.25 : 0 }, { duration: this.clayShape === 'flat' ? 1.5 : 1.1, ease: ease.inOutSine });
    sfx.clunk();
    this.clayAt = 'bottom';
    await tw.wait(0.3);
    return false;
  }

  /** A sunk shape comes out of the water and back to the shelf as the lump, so every trial starts from the same clay. */
  private async lift() {
    const tw = this.ctx.tw;
    this.clayAt = 'moving';
    await tw.to(this.clay, { y: this.tank.top - 70, rotation: 0 }, { duration: 0.5, ease: ease.outQuad });
    sfx.squish();
    this.setClay('ball');
    await tw.to(this.clay, this.shelf(), { duration: 0.4, ease: ease.inOutSine });
    this.clayAt = 'shelf';
  }

  private shelf() {
    return { x: this.view.w * 0.86, y: this.view.h * 0.42 };
  }

  // Layout -----------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    const counter = v.h * 0.74;
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light).rect(0, counter, v.w, v.h - counter).fill(wood.light).rect(0, counter - 8, v.w, 12).fill(wood.fill);
    const sorting = this.plan.mode === 'sort';
    const guessing = this.plan.mode === 'guess';
    const shaping = this.plan.mode === 'shape';
    const l = 190;
    const r = sorting || guessing || shaping ? v.w * 0.72 : v.w - 60;
    this.tank = { l, r, top: 150, surface: 230, bottom: counter };
    const t = this.tank;
    this.tankBack.clear().roundRect(l, t.top, r - l, t.bottom - t.top, 24).fill({ color: swatch.white.fill, alpha: 0.5 }).rect(l + 6, t.surface, r - l - 12, t.bottom - t.surface - 6).fill({ color: swatch.blue.fill, alpha: 0.35 });
    const front = this.tankFront.clear();
    front.moveTo(l + 6, t.surface);
    for (let x = l + 6; x <= r - 6; x += 20) front.lineTo(x, t.surface + Math.sin(x / 30) * 4);
    front.stroke({ width: 4, color: swatch.blue.fill, alpha: 0.8 });
    front.roundRect(l, t.top, r - l, t.bottom - t.top, 24).stroke({ width: 8, color: swatch.white.fill }).roundRect(l + 18, t.top + 20, 14, 120, 7).fill({ color: swatch.white.fill, alpha: 0.6 });

    const b = this.baskets.clear();
    if (sorting) {
      for (const kind of ['float', 'sink'] as const) {
        const y = this.basketY(kind);
        b.roundRect(v.w * 0.87 - 100, y - 70, 200, 140, 26).fill(kind === 'float' ? swatch.blue.light : swatch.white.light).stroke({ width: 6, color: wood.line });
      }
      this.drawBasketIcons(v);
    }

    const waiting = this.items.filter((i) => !i.done);
    this.tray.clear();
    if (shaping) this.layoutClay(v);
    else if (!guessing) {
      this.tray.roundRect(160, v.h - 150, v.w - 190, 136, 30).fill({ color: swatch.white.fill, alpha: 0.6 });
      const xs = spread(waiting.length, 180, v.w - 40, 140);
      waiting.forEach((item, i) => {
        if (item.drag) item.drag.home = { x: xs[i], y: v.h - 82 };
        if (!item.drag?.dragging) {
          this.ctx.tw.kill(item.node);
          item.node.position.set(xs[i], v.h - 82);
        }
      });
    } else {
      // The thing to guess about waits on the right, with the two guess buttons below the tank.
      this.items.forEach((item, i) => {
        item.node.visible = i <= this.current || item.done;
        if (i === this.current && !item.done) item.node.position.set(v.w * 0.86, v.h * 0.38);
      });
      this.floatButton.position.set(v.w * 0.36, v.h - 85);
      this.sinkButton.position.set(v.w * 0.62, v.h - 85);
    }
    for (const w of this.wet) {
      w.node.x = this.slotX(w.slot);
      if (w.settled) w.node.y = w.floats ? t.surface - 8 : t.bottom - 38;
    }
    this.drawGlow();
  }

  private layoutClay(v: View) {
    const t = this.tank;
    const e = this.experiments[Math.min(this.experiment, this.experiments.length - 1)];
    const xs = spread(3, 150, v.w - 40, 200);
    for (const tl of this.tiles) {
      tl.node.position.set(xs[e.order.indexOf(tl.shape)], v.h - 85);
      tl.node.visible = this.choosing || this.sunk > 0 || this.clayShape !== 'ball';
      tl.node.alpha = this.choosing ? 1 : 0.5;
    }
    const x = (t.l + t.r) / 2;
    if (this.clayAt === 'shelf') this.clay.position.copyFrom(this.shelf());
    else if (this.clayAt === 'float') this.clay.x = x;
    else if (this.clayAt === 'bottom') this.clay.position.set(x, t.bottom - 30);
    this.sameWeight?.position.copyFrom(this.shelf());
  }

  private readonly basketIcons: Container[] = [];
  private drawBasketIcons(v: View) {
    if (!this.basketIcons.length) {
      for (const icon of [floatIcon(), sinkIcon()]) {
        icon.alpha = 0.5;
        icon.scale.set(1.2);
        this.basketIcons.push(icon);
        this.ctx.stage.addChildAt(icon, this.ctx.stage.getChildIndex(this.baskets) + 1);
      }
    }
    this.basketIcons[0].position.set(v.w * 0.87, this.basketY('float') + 30);
    this.basketIcons[1].position.set(v.w * 0.87, this.basketY('sink') + 30);
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.plan.mode === 'shape') {
      if (!this.glowOn || !this.choosing || this.finished) return;
      const b = this.tileFor('boat').node;
      g.roundRect(b.x - 92, b.y - 82, 184, 164, 30).stroke({ width: 8, color: swatch.yellow.line });
      return;
    }
    if (this.wrong < 2 || this.finished || this.plan.mode !== 'sort') return;
    const next = this.items.find((i) => !i.done);
    if (!next) return;
    const y = this.basketY(floats(next.thing) ? 'float' : 'sink');
    g.roundRect(this.view.w * 0.87 - 108, y - 78, 216, 156, 30).stroke({ width: 8, color: swatch.yellow.line });
    if (next.drag) g.roundRect(next.drag.home.x - 66, next.drag.home.y - 66, 132, 132, 24).stroke({ width: 8, color: swatch.yellow.line });
  }

  /** Couch play on guessing levels: left and right choose float or sink; the bottom button makes the guess. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.plan.mode === 'shape') {
      if (!this.choosing || this.finished) return;
      for (const p of input.players) {
        if (p.direction === 0) this.pick = Math.min(2, this.pick + 1);
        else if (p.direction === 2) this.pick = Math.max(0, this.pick - 1);
        if (p.action) return void this.tryShape(this.experiments[this.experiment].order[this.pick]);
      }
      return;
    }
    if (this.plan.mode !== 'guess' || !this.guessing || this.finished) return;
    for (const p of input.players) {
      if (p.direction === 0) this.pick = 1;
      else if (p.direction === 2) this.pick = 0;
      if (p.action) this.guess(this.pick === 0);
    }
  }

  /** The "watch me" demo: a player who knows how things behave in water, choosing and pressing. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.plan.mode === 'shape') {
      if (!this.choosing || this.finished || this.botWait > 0) return out;
      const want = this.experiments[this.experiment].order.indexOf('boat');
      if (want === this.pick) out.players[0].action = true;
      else out.players[0].direction = want > this.pick ? 0 : 2;
      this.botWait = want === this.pick ? 1.2 : 0.6;
      return out;
    }
    if (!this.guessing || this.finished || this.botWait > 0) return out;
    const want = floats(this.items[this.current].thing) ? 0 : 1;
    if (want === this.pick) {
      out.players[0].action = true;
      this.botWait = 1.2;
    } else {
      out.players[0].direction = want === 1 ? 0 : 2;
      this.botWait = 0.6;
    }
    return out;
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    const ring = this.ring.clear();
    if (this.couchOn && this.choosing && !this.finished) {
      const b = this.tileFor(this.experiments[this.experiment].order[this.pick]).node;
      ring.roundRect(b.x - 92, b.y - 82, 184, 164, 30).stroke({ width: 8, color: swatch.teal.line });
    }
    if (this.plan.mode === 'shape') {
      if (this.leak.water !== this.drawnWater) {
        this.drawnWater = this.leak.water;
        drawClay(this.clayArt, this.clayShape, this.experiments[this.experiment].color, this.leak.water);
      }
      if (this.clayAt === 'float') {
        this.clay.y = this.tank.surface - 8 + Math.sin(this.clock * 2.4) * 4;
        this.clay.rotation = Math.sin(this.clock * 1.8) * 0.08;
      }
    }
    if (this.couchOn && this.guessing && !this.finished) {
      const b = this.pick === 0 ? this.floatButton : this.sinkButton;
      ring.roundRect(b.x - 92, b.y - 82, 184, 164, 30).stroke({ width: 8, color: swatch.teal.line });
    }
    for (const w of this.wet) {
      if (!w.settled || !w.floats) continue;
      w.node.y = this.tank.surface - 8 + Math.sin(this.clock * 2.4 + w.phase) * 4;
      w.node.rotation = Math.sin(this.clock * 1.8 + w.phase) * 0.08;
    }
  }

  destroy() {
    for (const i of this.items) i.drag?.destroy();
  }
}

function tankArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics()
    .roundRect(-90, -150, 180, 150, 18)
    .fill({ color: swatch.white.fill, alpha: 0.6 })
    .rect(-84, -100, 168, 94)
    .fill({ color: swatch.blue.fill, alpha: 0.45 })
    .roundRect(-90, -150, 180, 150, 18)
    .stroke({ width: 6, color: swatch.white.line });
  c.addChild(g);
  const floater = thingArt(rng.pick(['duck', 'boat', 'ball'] as Thing[]));
  floater.scale.set(0.6);
  floater.position.set(-34, -108);
  const sinker = thingArt(rng.pick(['rock', 'key', 'coin'] as Thing[]));
  sinker.scale.set(0.5);
  sinker.position.set(36, -24);
  c.addChild(floater, sinker);
  return c;
}

export const sinkFloat: GameModule = {
  id: 'sink-float',
  liveController: true,
  name: 'Sink or Float',
  titleLine: 'game.sink-float',
  region: 'tinker-lab',
  skills: ['science', 'prediction', 'sorting'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => (b === 'school' ? { min: 5, max: 7 } : b === 'prek' ? { min: 4, max: 6 } : b === 'preschool' ? { min: 3, max: 5 } : b === 'toddler' ? { min: 2, max: 4 } : { min: 1, max: 2 }),
  describeLevel: (l) => sinkPlan(l).name,
  music: STYLES.bubbles,
  coplayHint: 'Before each splash, ask {name}: will it float or sink? Every guess is a good guess.',
  offScreen: 'At bath time, test a spoon, a cup, a toy and a sponge: which float and which sink?',
  hubIcon: () => new WigglyIcon(tankArt()),
  touchDemo: true,
  sticker: (seed) => tankArt(seed),
  create: (ctx) => new SinkFloat(ctx),
};
