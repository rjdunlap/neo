import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter } from '../../art/critter';
import { grass, swatch, wood } from '../../art/palette';
import { puffs, starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { clothing, itemIcon } from './art';
import { GROUND_TOUCH, ITEM_NAMES, ITEM_WORDS, ITEMS, itemToTap, outfitFor, outfits, SLOTS, STICKER_ITEMS, wardrobePlan, WEATHERS, type Item, type Outfit, type WardrobePlan, type Weather } from './logic';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A small picture of a weather: a sun, a rain cloud or a snowflake, centered on (0, 0). */
export function weatherIcon(w: Weather, size = 60): Graphics {
  const g = new Graphics();
  const s = size / 60;
  if (w === 'sunny') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.moveTo(Math.cos(a) * 30 * s, Math.sin(a) * 30 * s).lineTo(Math.cos(a) * 42 * s, Math.sin(a) * 42 * s);
    }
    g.stroke(line(swatch.yellow.line, 5 * s)).circle(0, 0, 24 * s).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4 * s));
  } else if (w === 'rainy') {
    for (const x of [-16, 0, 16]) g.moveTo(x * s, 14 * s).lineTo((x - 5) * s, 32 * s);
    g.stroke(line(swatch.blue.fill, 5 * s));
    puffs(g, [[-18 * s, 0, 16 * s], [4 * s, -10 * s, 20 * s], [22 * s, 2 * s, 14 * s]], swatch.white.light, swatch.white.line, 4 * s);
  } else {
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      g.moveTo(-Math.cos(a) * 30 * s, -Math.sin(a) * 30 * s).lineTo(Math.cos(a) * 30 * s, Math.sin(a) * 30 * s);
    }
    g.stroke(line(swatch.blue.line, 6 * s)).circle(0, 0, 7 * s).fill(swatch.blue.light);
  }
  return g;
}

/** A touch on the grass at level 1, drawn for a moment where the finger landed. */
interface Burst {
  kind: (typeof GROUND_TOUCH)[Weather];
  x: number;
  y: number;
  t: number;
}

const BURST_LIFE = 0.9;

interface Option {
  item: Item;
  node: Container;
  used: boolean;
}

class WeatherWardrobe implements Game {
  readonly plan: WardrobePlan;
  readonly rounds: Outfit[];
  readonly pet: Critter;
  readonly options: Option[] = [];
  /** Clothing on the pet, by item. */
  readonly worn = new Map<Item, Container>();
  private readonly wornCenters = new Map<Item, { x: number; y: number }>();
  weather: Weather = 'sunny';
  q = 0;
  taps = 0;
  readonly seen = new Set<Weather>();
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  done = false;
  private changePhase: 'remove' | 'add' | null = null;

  private readonly sky = new Graphics();
  private readonly ground = new Graphics();
  private readonly fx = new Graphics();
  private readonly skyHit = new Container();
  private readonly groundHit = new Container();
  private readonly burstFx = new Graphics();
  /** Level 1's grass touches still showing. */
  readonly bursts: Burst[] = [];
  /** Level 1: how many times she touched a worn item and heard its name. */
  named = 0;
  private readonly tray = new Graphics();
  private readonly glow = new Graphics();
  private readonly forecast = new Container();
  private readonly suitcase = new Container();
  private readonly packed = new Container();
  private drops: { x: number; y: number; v: number; d: number }[] = [];
  private view: View;
  private clock = 0;
  private instruction: { id: LineId; vars?: LineVars } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = wardrobePlan(ctx.level);
    this.rounds = outfits(this.plan, ctx.rng);
    // The pet is the one getting dressed, so the corner guide steps out; tapping the big pet repeats instead.
    ctx.pet.visible = false;
    this.pet = new Critter(ctx.petSpec);
    this.pet.scale.set(0.8);
    const body = new Circle(0, -125, 150);
    // At level 1 the worn clothes answer too, so the pet's area reaches each of them without taking the sky.
    this.pet.hitArea =
      this.plan.mode === 'change' ? new Circle(0, -220, 370) : this.plan.mode === 'play' ? { contains: (x, y) => body.contains(x, y) || this.onWorn(x, y) } : body;
    onTap(this.pet, () => {
      this.pet.poke();
      sfx.giggle();
      if (this.instruction && !this.busy) void ctx.say(this.instruction.id, this.instruction.vars);
    });
    this.skyHit.eventMode = 'static';
    if (this.plan.mode === 'play') {
      onTap(this.skyHit, () => this.nextWeather());
      onTap(this.groundHit, (e) => this.touchGround(e), { cooldown: 60 });
    }
    this.suitcase.addChild(
      new Graphics()
        .roundRect(-28, -128, 56, 26, 10)
        .stroke(line(wood.line, 8))
        .roundRect(-80, -110, 160, 110, 16)
        .fill(swatch.orange.fill)
        .stroke(line(swatch.orange.line))
        .rect(-80, -70, 160, 10)
        .fill(swatch.orange.line),
      this.packed,
    );
    this.suitcase.visible = this.plan.mode === 'trip';
    ctx.stage.addChild(this.sky, this.skyHit, this.ground, this.groundHit, this.burstFx, this.fx, this.forecast, this.suitcase, this.pet, this.tray, this.glow);
  }

  start() {
    if (this.plan.mode === 'play') {
      this.burstFx.eventMode = 'none';
      this.setWeather('sunny');
      this.dressFor('sunny');
      this.instruct('weather.play');
    } else this.ask();
  }

  /** The ghost finger on the how-to card: tap the sky to change the weather (free play), or the next thing that fits the weather. */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    if (this.plan.mode === 'play') {
      const sky = this.skyHit.hitArea as Rectangle;
      return { tap: { on: this.skyHit, x: sky.width * 0.7, y: sky.height * 0.3 } };
    }
    if (this.busy) return null;
    const item = itemToTap(this.outfit, new Set(this.options.filter((o) => o.used).map((o) => o.item)));
    if (this.changePhase === 'remove') {
      const worn = this.outfit.remove?.find((i) => this.worn.has(i));
      const node = worn ? this.worn.get(worn) : null;
      const center = worn ? this.wornCenters.get(worn) : null;
      return node && center ? { tap: { on: node, x: center.x, y: center.y }, pause: 0.35 } : null;
    }
    const option = this.options.find((o) => o.item === item);
    return option ? { tap: { on: option.node } } : null;
  }

  private instruct(id: LineId, vars?: LineVars) {
    this.instruction = { id, vars };
    void this.ctx.instruct(id, vars);
  }

  // Free play: tap the sky ----------------------------------------------------------

  private nextWeather() {
    if (this.done) return;
    const next = WEATHERS[(WEATHERS.indexOf(this.weather) + 1) % WEATHERS.length];
    this.taps++;
    this.setWeather(next);
    this.dressFor(next);
    void this.ctx.say(`weather.${next}`);
    if (this.taps >= 6 && this.seen.size === WEATHERS.length) {
      this.done = true;
      void this.ctx.tw.wait(2.2).then(() => {
        this.pet.cheer();
        return this.ctx.say('weather.ready');
      }).then(() => this.ctx.finish({ misses: 0, hints: 0 }));
    }
  }

  /** Free play: the grass answers the weather where she touched it. */
  private touchGround(e: FederatedPointerEvent) {
    if (this.done) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(p.x)) return;
    const kind = GROUND_TOUCH[this.weather];
    this.bursts.push({ kind, x: p.x, y: p.y, t: 0 });
    if (this.bursts.length > 8) this.bursts.shift();
    if (kind === 'splash') sfx.splash();
    else if (kind === 'crunch') sfx.squish();
    else sfx.pluck(5 + this.ctx.rng.int(0, 4), 0.3);
  }

  /** Whether a point in the pet's own space lands on a worn item's touch area. */
  private onWorn(x: number, y: number) {
    if (!this.worn.size) return false;
    const global = this.pet.toGlobal({ x, y });
    for (const c of this.worn.values()) {
      const p = c.toLocal(global);
      if ((c.hitArea as Rectangle | null)?.contains(p.x, p.y)) return true;
    }
    return false;
  }

  /** Free play: a touch on the clothes wiggles the nearest worn item and says its name. */
  private nameWorn(e: FederatedPointerEvent) {
    e.stopPropagation();
    if (this.done) return;
    let best: { item: Item; c: Container; d: number } | null = null;
    for (const [item, c] of this.worn) {
      const p = c.toLocal(e.global);
      const area = c.hitArea as Rectangle | null;
      const center = this.wornCenters.get(item);
      if (!center || !Number.isFinite(p.x) || !area?.contains(p.x, p.y)) continue;
      const d = Math.hypot(p.x - center.x, p.y - center.y);
      if (!best || d < best.d) best = { item, c, d };
    }
    if (!best) return;
    const { item, c } = best;
    this.named++;
    this.ctx.tw.kill(c);
    c.rotation = 0;
    void this.ctx.tw.to(c, { rotation: 0.18 }, { duration: 0.08 })
      .then(() => this.ctx.tw.to(c, { rotation: -0.12 }, { duration: 0.12 }))
      .then(() => this.ctx.tw.to(c, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic }));
    sfx.pop(9);
    this.pet.setMood('happy', 0.8);
    void this.ctx.say('weather.name', { item: ITEM_NAMES[item] });
  }

  /** Free play: the pet changes into a whole outfit for the weather, one thing per slot. */
  private dressFor(w: Weather) {
    this.undress();
    // Quick taps can change the weather again before everything is on; only dress for the current one.
    outfitFor(w, this.ctx.rng).forEach((item, i) => void this.ctx.tw.wait(0.25 + i * 0.2).then(() => this.weather === w && !this.worn.has(item) && this.put(item, (e) => this.nameWorn(e))));
  }

  // Rounds -------------------------------------------------------------------------

  private get outfit() {
    return this.rounds[this.q];
  }

  private ask() {
    const o = this.outfit;
    this.wrong = 0;
    this.changePhase = this.plan.mode === 'change' ? 'remove' : null;
    this.undress();
    this.packed.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.setWeather(o.weathers[0]);
    if (this.plan.mode === 'change') o.remove?.forEach((item) => this.put(item, () => this.removeWorn(item)));
    this.drawForecast(o);
    for (const opt of this.options) opt.node.destroy({ children: true });
    this.options.length = 0;
    o.options.forEach((item, i) => {
      const node = new Container();
      node.addChild(tile(124, 124), itemIcon(item, 96));
      node.hitArea = new Rectangle(-70, -70, 140, 140);
      const opt: Option = { item, node, used: false };
      onTap(node, () => this.choose(opt));
      node.scale.set(0);
      node.visible = this.plan.mode !== 'change';
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, delay: i * 0.07, ease: ease.outBack });
      this.options.push(opt);
      this.ctx.stage.addChild(node);
    });
    this.ctx.stage.addChild(this.glow);
    if (this.plan.mode === 'change') this.instruct('weather.change.remove', { weather: o.weathers[1] });
    else if (this.plan.mode === 'trip') this.instruct('weather.trip', { a: o.weathers[0], b: o.weathers[1] });
    else this.instruct(this.plan.mode === 'pick' ? 'weather.pick' : 'weather.all', { weather: o.weathers[0] });
    this.resize(this.view);
    this.busy = false;
  }

  private choose(opt: Option) {
    if (this.busy || this.done || opt.used) return;
    const o = this.outfit;
    if (!o.needed.includes(opt.item)) {
      this.misses++;
      this.wrong++;
      sfx.boing();
      this.ctx.tw.kill(opt.node);
      const x = opt.node.x;
      void this.ctx.tw.to(opt.node, { x: x + 12 }, { duration: 0.06 }).then(() => this.ctx.tw.to(opt.node, { x }, { duration: 0.25, ease: ease.outElastic }));
      if (this.wrong === 2) {
        this.hints++;
        void this.ctx.say('weather.wrong', { item: ITEM_WORDS[opt.item], weather: ITEMS[opt.item] }).then(() => this.ctx.say('weather.hint'));
      } else void this.ctx.say('weather.wrong', { item: ITEM_WORDS[opt.item], weather: ITEMS[opt.item] });
      this.drawGlow();
      return;
    }
    opt.used = true;
    opt.node.alpha = 0.35;
    this.wrong = 0;
    sfx.bell(5 + this.options.filter((o) => o.used).length, 0.3);
    if (this.plan.mode === 'trip') this.pack(opt);
    else this.put(opt.item);
    const left = o.needed.filter((i) => !this.options.find((x) => x.item === i)?.used);
    this.drawGlow();
    if (left.length) {
      void this.ctx.say('weather.yes');
      return;
    }
    this.busy = true;
    void this.ctx.tw.wait(0.6).then(async () => {
      this.pet.cheer();
      sfx.sparkle();
      await this.ctx.say('weather.ready');
      await this.ctx.tw.wait(0.4);
      this.q++;
      if (this.q < this.rounds.length) this.ask();
      else {
        this.done = true;
        this.ctx.finish({ misses: this.misses, hints: this.hints });
      }
    });
  }

  /** Dresses the pet in one item, with a little pop; `touched` makes the worn item answer a touch. */
  private put(item: Item, touched?: (e: FederatedPointerEvent) => void) {
    const c = clothing(item);
    if (touched) {
      const b = c.getLocalBounds();
      const width = Math.max(130, b.width + 48), height = Math.max(130, b.height + 48);
      const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      this.wornCenters.set(item, center);
      c.hitArea = new Rectangle(center.x - width / 2, center.y - height / 2, width, height);
      c.eventMode = 'static';
      onTap(c, touched);
    }
    this.pet.attach(c);
    // A coat goes on under everything else, so a scarf put on first still shows over it.
    if (SLOTS[item] === 'body') for (const node of this.worn.values()) this.pet.attach(node);
    this.worn.set(item, c);
    c.scale.set(0.6);
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.pet.hop(0.5);
    sfx.pop(8);
  }

  private removeWorn(item: Item) {
    if (this.changePhase !== 'remove' || this.busy || this.done || !this.outfit.remove?.includes(item)) return;
    const worn = this.worn.get(item);
    if (!worn) return;
    this.worn.delete(item);
    this.wornCenters.delete(item);
    worn.destroy({ children: true });
    this.pet.hop(0.45);
    sfx.pop(6);
    if (this.outfit.remove?.every((i) => !this.worn.has(i))) {
      this.changePhase = 'add';
      this.setWeather(this.outfit.weathers[1]);
      this.options.forEach((o) => { o.node.visible = true; });
      this.resize(this.view);
      this.instruct('weather.change.add', { weather: this.outfit.weathers[1] });
    }
  }

  private undress() {
    for (const c of this.worn.values()) c.destroy({ children: true });
    this.worn.clear();
    this.wornCenters.clear();
  }

  /** Trips: the item hops into the suitcase and shows on its lid. */
  private pack(opt: Option) {
    const icon = itemIcon(opt.item, 96);
    icon.position.copyFrom(opt.node.position);
    this.ctx.stage.addChild(icon);
    const dest = { x: this.suitcase.x, y: this.suitcase.y - 60 };
    void this.ctx.tw.to(icon, { x: dest.x, y: dest.y }, { duration: 0.45, ease: ease.inOutSine });
    void this.ctx.tw.to(icon.scale, { x: 0.4, y: 0.4 }, { duration: 0.45 }).then(() => {
      icon.destroy({ children: true });
      sfx.clunk();
      const n = this.packed.children.length;
      const mini = itemIcon(opt.item, 38);
      mini.position.set(-57 + (n % 4) * 38, -150 - Math.floor(n / 4) * 40);
      this.packed.addChild(mini);
    });
  }

  // Weather ------------------------------------------------------------------------

  private setWeather(w: Weather) {
    this.weather = w;
    this.seen.add(w);
    if (w === 'rainy') sfx.splash();
    if (w === 'snowy') sfx.sparkle();
    if (w === 'sunny') [5, 7, 9].forEach((s, i) => void this.ctx.tw.wait(i * 0.12).then(() => sfx.bell(s, 0.2)));
    if (w !== 'sunny' && !this.worn.size) this.pet.setMood('surprised', 0.8);
    const v = this.view;
    this.drops = Array.from({ length: w === 'sunny' ? 0 : w === 'rainy' ? 70 : 55 }, () => ({ x: this.ctx.rng.range(0, v.w), y: this.ctx.rng.range(0, v.h), v: w === 'rainy' ? this.ctx.rng.range(500, 700) : this.ctx.rng.range(40, 80), d: this.ctx.rng.range(0, 6) }));
    this.drawWeather();
  }

  private drawWeather() {
    const v = this.view;
    const groundY = v.h * 0.62;
    const w = this.weather;
    const s = this.sky.clear().rect(0, 0, v.w, groundY + 20).fill(w === 'snowy' ? swatch.white.light : swatch.blue.light);
    if (w === 'rainy') s.rect(0, 0, v.w, groundY + 20).fill({ color: swatch.white.line, alpha: 0.4 });
    if (w === 'sunny') {
      const cx = v.w * 0.84;
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        s.moveTo(cx + Math.cos(a) * 72, 120 + Math.sin(a) * 72).lineTo(cx + Math.cos(a) * 96, 120 + Math.sin(a) * 96);
      }
      s.stroke(line(swatch.yellow.line, 8)).circle(cx, 120, 58).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
    } else {
      for (const [x, y, k] of [[0.2, 110, 1.2], [0.55, 80, 1], [0.86, 130, 1.1]] as const) {
        puffs(s, [[-60 * k, 8, 40 * k], [0, -14, 54 * k], [60 * k, 8, 40 * k]].map(([dx, dy, r]) => [v.w * x + dx, y + dy, r] as [number, number, number]), swatch.white.fill, w === 'rainy' ? swatch.white.line : swatch.blue.light, 6);
      }
    }
    this.skyHit.hitArea = new Rectangle(0, 0, v.w, groundY);
    this.groundHit.hitArea = new Rectangle(0, groundY, v.w, v.h - groundY);
    const g = this.ground.clear().rect(0, groundY, v.w, v.h - groundY).fill(w === 'snowy' ? swatch.white.fill : grass);
    if (w === 'rainy') for (const [x, y] of [[0.25, 0.72], [0.78, 0.7]]) g.ellipse(v.w * x, v.h * y, 90, 18).fill(swatch.blue.light);
    if (w === 'snowy') for (const [x, y] of [[0.2, 0.68], [0.82, 0.7]]) g.ellipse(v.w * x, v.h * y, 110, 22).fill(swatch.blue.light);
    if (w === 'sunny') for (let i = 0; i < 6; i++) g.poly(starPoints(9, 4).map((p, k) => p + (k % 2 ? v.h * 0.7 + (i % 2) * 30 : v.w * (0.1 + i * 0.16)))).fill(swatch.yellow.light);
  }

  private drawForecast(o: Outfit) {
    this.forecast.removeChildren().forEach((c) => c.destroy());
    if (this.plan.mode !== 'trip') return;
    const card = new Graphics().roundRect(-110, -55, 220, 110, 24).fill(swatch.white.fill).stroke(line(swatch.white.line, 4));
    const a = weatherIcon(o.weathers[0], 56);
    const b = weatherIcon(o.weathers[1], 56);
    a.x = -55;
    b.x = 55;
    const arrow = new Graphics().moveTo(-12, 0).lineTo(12, 0).moveTo(4, -9).lineTo(13, 0).lineTo(4, 9).stroke(line(swatch.white.line, 5));
    this.forecast.addChild(card, a, b, arrow);
  }

  // Layout -------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.drawWeather();
    this.pet.position.set(this.plan.mode === 'trip' ? v.w * 0.42 : v.w / 2, v.h - (this.plan.mode === 'play' ? 70 : 178));
    this.suitcase.position.set(v.w * 0.7, v.h - 178);
    this.forecast.position.set(v.w / 2, 90);
    this.tray.clear();
    if (this.options.length && this.changePhase !== 'remove') {
      this.tray.roundRect(160, v.h - 160, v.w - 190, 148, 30).fill({ color: swatch.white.fill, alpha: 0.85 });
      const xs = spread(this.options.length, 175, v.w - 40, 150);
      this.options.forEach((o, i) => {
        this.ctx.tw.kill(o.node);
        o.node.position.set(xs[i], v.h - 86);
      });
    }
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done || !this.outfit) return;
    const target = this.options.find((o) => !o.used && this.outfit.needed.includes(o.item));
    if (target) g.roundRect(target.node.x - 72, target.node.y - 72, 144, 144, 26).stroke({ width: 8, color: swatch.yellow.line });
  }

  update(dt: number) {
    this.clock += dt;
    this.pet.update(dt);
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    const v = this.view;
    this.drawBursts(dt);
    const fx = this.fx.clear();
    if (this.weather === 'rainy') {
      for (const d of this.drops) {
        d.y += d.v * dt;
        if (d.y > v.h) [d.y, d.x] = [-20, this.ctx.rng.range(0, v.w)];
        fx.moveTo(d.x, d.y).lineTo(d.x - 4, d.y + 20);
      }
      fx.stroke({ width: 3, color: swatch.blue.fill, alpha: 0.7 });
    } else if (this.weather === 'snowy') {
      for (const d of this.drops) {
        d.y += d.v * dt;
        d.x += Math.sin(this.clock + d.d) * 20 * dt;
        if (d.y > v.h) [d.y, d.x] = [-10, this.ctx.rng.range(0, v.w)];
        fx.circle(d.x, d.y, 5 + (d.d % 3));
      }
      fx.fill(swatch.white.fill).stroke({ width: 2, color: swatch.blue.light });
    }
  }

  private drawBursts(dt: number) {
    const g = this.burstFx.clear();
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.t += dt;
      if (b.t >= BURST_LIFE) { this.bursts.splice(i, 1); continue; }
      const k = b.t / BURST_LIFE;
      const alpha = 1 - k;
      if (b.kind === 'splash') {
        g.ellipse(b.x, b.y, 30 + 90 * k, 8 + 22 * k).stroke({ width: 6, color: swatch.blue.fill, alpha });
        for (const dx of [-1, 0, 1]) g.circle(b.x + dx * (24 + 40 * k), b.y - 70 * Math.sin(Math.PI * k) - 6, 8).fill({ color: swatch.blue.fill, alpha });
      } else if (b.kind === 'crunch') {
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3 + 0.3;
          g.circle(b.x + Math.cos(a) * 60 * k, b.y + Math.sin(a) * 30 * k - 30 * Math.sin(Math.PI * k), 12 * (1 - k * 0.5)).fill({ color: swatch.white.fill, alpha }).stroke({ width: 2, color: swatch.blue.light, alpha });
        }
      } else {
        const grow = Math.min(1, b.t / 0.25);
        const top = b.y - 70 * grow;
        g.moveTo(b.x, b.y).lineTo(b.x, top).stroke({ width: 7, color: swatch.green.line, alpha, cap: 'round' });
        for (let j = 0; j < 5; j++) {
          const a = (j * 2 * Math.PI) / 5;
          g.circle(b.x + Math.cos(a) * 22 * grow, top + Math.sin(a) * 22 * grow, 16 * grow).fill({ color: swatch.pink.fill, alpha });
        }
        g.circle(b.x, top, 13 * grow).fill({ color: swatch.yellow.fill, alpha });
      }
    }
  }

  destroy() {
    this.ctx.pet.visible = true;
  }
}

function wardrobeArt(seed = 1): Container {
  const rng = new Rng(seed);
  const w = rng.pick(WEATHERS);
  const c = new Container();
  const item = itemIcon(rng.pick(STICKER_ITEMS.filter((i) => ITEMS[i] === w)), 120);
  item.y = -70;
  const icon = weatherIcon(w, 60);
  icon.position.set(70, -150);
  c.addChild(item, icon);
  return c;
}

export const weatherWardrobe: GameModule = {
  id: 'weather-wardrobe',
  name: 'Weather Wardrobe',
  titleLine: 'game.weather-wardrobe',
  region: 'cozy-village',
  skills: ['reasoning', 'vocabulary', 'everyday-life'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (b) => (b === 'prek' ? { min: 4, max: 7 } : b === 'preschool' ? { min: 3, max: 5 } : b === 'toddler' ? { min: 2, max: 4 } : { min: 1, max: 2 }),
  describeLevel: (l) => wardrobePlan(l).name,
  touchDemo: true,
  music: STYLES.hub,
  coplayHint: 'Look out the real window with {name}: what is the weather today, and what would we wear?',
  offScreen: 'Before going out, let {name} pick one thing to wear for the weather, like a hat or boots.',
  hubIcon: () => {
    const c = new Container();
    const umbrella = itemIcon('umbrella', 150);
    umbrella.y = -95;
    const boots = itemIcon('boots', 70);
    boots.position.set(-10, -20);
    c.addChild(umbrella, boots);
    return new WigglyIcon(c);
  },
  sticker: (seed) => wardrobeArt(seed),
  create: (ctx) => new WeatherWardrobe(ctx),
};
