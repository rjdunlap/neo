import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
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
import type { Game, GameContext, GameModule } from '../types';
import { clothing, itemIcon } from './art';
import { ITEM_WORDS, ITEMS, itemsFor, outfits, wardrobePlan, WEATHERS, type Item, type Outfit, type WardrobePlan, type Weather } from './logic';

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
  weather: Weather = 'sunny';
  q = 0;
  taps = 0;
  readonly seen = new Set<Weather>();
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  done = false;

  private readonly sky = new Graphics();
  private readonly ground = new Graphics();
  private readonly fx = new Graphics();
  private readonly skyHit = new Container();
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
    this.pet.hitArea = new Circle(0, -125, 150);
    onTap(this.pet, () => {
      this.pet.poke();
      sfx.giggle();
      if (this.instruction && !this.busy) void ctx.say(this.instruction.id, this.instruction.vars);
    });
    this.skyHit.eventMode = 'static';
    if (this.plan.mode === 'play') onTap(this.skyHit, () => this.nextWeather());
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
    ctx.stage.addChild(this.sky, this.skyHit, this.ground, this.fx, this.forecast, this.suitcase, this.pet, this.tray, this.glow);
  }

  start() {
    if (this.plan.mode === 'play') {
      this.setWeather('sunny');
      this.dressFor('sunny');
      this.instruct('weather.play');
    } else this.ask();
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

  /** Free play: the pet changes into everything for the weather. */
  private dressFor(w: Weather) {
    this.undress();
    // Quick taps can change the weather again before everything is on; only dress for the current one.
    itemsFor(w).forEach((item, i) => void this.ctx.tw.wait(0.25 + i * 0.2).then(() => this.weather === w && !this.worn.has(item) && this.put(item)));
  }

  // Rounds -------------------------------------------------------------------------

  private get outfit() {
    return this.rounds[this.q];
  }

  private ask() {
    const o = this.outfit;
    this.wrong = 0;
    this.undress();
    this.packed.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.setWeather(o.weathers[0]);
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
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, delay: i * 0.07, ease: ease.outBack });
      this.options.push(opt);
      this.ctx.stage.addChild(node);
    });
    this.ctx.stage.addChild(this.glow);
    if (this.plan.mode === 'trip') this.instruct('weather.trip', { a: o.weathers[0], b: o.weathers[1] });
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

  /** Dresses the pet in one item, with a little pop. */
  private put(item: Item) {
    const c = clothing(item);
    this.pet.attach(c);
    this.worn.set(item, c);
    c.scale.set(0.6);
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.pet.hop(0.5);
    sfx.pop(8);
  }

  private undress() {
    for (const c of this.worn.values()) c.destroy({ children: true });
    this.worn.clear();
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
    if (this.options.length) {
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

  destroy() {
    this.ctx.pet.visible = true;
  }
}

function wardrobeArt(seed = 1): Container {
  const rng = new Rng(seed);
  const w = rng.pick(WEATHERS);
  const c = new Container();
  const item = itemIcon(rng.pick(itemsFor(w)), 120);
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
  levels: (b) => (b === 'prek' ? { min: 4, max: 6 } : b === 'preschool' ? { min: 3, max: 5 } : b === 'toddler' ? { min: 2, max: 4 } : { min: 1, max: 2 }),
  describeLevel: (l) => wardrobePlan(l).name,
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
