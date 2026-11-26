import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { grass, swatch, wood } from '../../art/palette';
import { puffs, starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import type { CompanionRig } from '../../creatures/companion';
import type { PartName } from '../../creatures/parts';
import type { SpeciesId } from '../../creatures/species';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { rangeFor } from '../../progress/difficulty';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { WeatherFriends } from './friends';
import { anchorOf, clothing, itemIcon, PAIRED } from './art';
import {
  LEVELS,
  GROUND_TOUCH,
  ITEM_NAMES,
  tripPlays,
  MISFIT,
  ITEM_WORDS,
  ITEMS,
  itemToTap,
  packChoices,
  outfitFor,
  outfits,
  partFor,
  STICKER_ITEMS,
  STICKER_WEATHERS,
  suits,
  tempOf,
  wardrobeFor,
  wardrobePlan,
  WEATHERS,
  type Item,
  type Misfit,
  type Outfit,
  type WardrobePlan,
  type Weather,
} from './logic';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A small picture of a weather: a sun, a rain cloud, a snowflake or three wind curls with a leaf, centered on (0, 0). */
export function weatherIcon(w: Weather, size = 60): Graphics {
  const g = new Graphics();
  const s = size / 60;
  if (w === 'windy') {
    for (const [y, len] of [
      [-16, 44],
      [2, 56],
      [20, 40],
    ] as const) {
      const x0 = -len / 2;
      g.moveTo(x0 * s, y * s)
        .lineTo((x0 + len - 12) * s, y * s)
        .quadraticCurveTo((x0 + len + 4) * s, (y - 2) * s, (x0 + len) * s, (y - 12) * s)
        .quadraticCurveTo((x0 + len - 6) * s, (y - 18) * s, (x0 + len - 10) * s, (y - 10) * s);
    }
    g.stroke(line(swatch.blue.line, 5 * s));
    g.ellipse(-22 * s, 24 * s, 11 * s, 6 * s)
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 2 * s));
  } else if (w === 'sunny') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.moveTo(Math.cos(a) * 30 * s, Math.sin(a) * 30 * s).lineTo(Math.cos(a) * 42 * s, Math.sin(a) * 42 * s);
    }
    g.stroke(line(swatch.yellow.line, 5 * s))
      .circle(0, 0, 24 * s)
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line, 4 * s));
  } else if (w === 'rainy') {
    for (const x of [-16, 0, 16]) g.moveTo(x * s, 14 * s).lineTo((x - 5) * s, 32 * s);
    g.stroke(line(swatch.blue.fill, 5 * s));
    puffs(
      g,
      [
        [-18 * s, 0, 16 * s],
        [4 * s, -10 * s, 20 * s],
        [22 * s, 2 * s, 14 * s],
      ],
      swatch.white.light,
      swatch.white.line,
      4 * s,
    );
  } else {
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      g.moveTo(-Math.cos(a) * 30 * s, -Math.sin(a) * 30 * s).lineTo(
        Math.cos(a) * 30 * s,
        Math.sin(a) * 30 * s,
      );
    }
    g.stroke(line(swatch.blue.line, 6 * s))
      .circle(0, 0, 7 * s)
      .fill(swatch.blue.light);
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

const TRY_IDLE = 6;

interface Option {
  item: Item;
  node: Container;
  used: boolean;
}

/**
 * How each species stands in the wardrobe (RW05 slice 2b): its stage scale, and the size of the old pip's clothes on each
 * of its parts. The side-on river and glider have small faces, so they stand larger and their hats are smaller.
 */
const DRESS: Record<SpeciesId, { scale: number; parts: Partial<Record<PartName, number>> }> = {
  sprout: {
    scale: 0.8,
    parts: { head: 0.85, eyes: 0.8, ears: 0.85, neck: 0.85, tummy: 0.85, hands: 0.85, feet: 0.85 },
  },
  river: { scale: 1.2, parts: { head: 0.36, eyes: 0.3, ears: 0.4, neck: 0.42, feet: 0.45, back: 0.55 } },
  glider: { scale: 1.25, parts: { head: 0.34, eyes: 0.3, ears: 0.4, back: 0.55 } },
};

/** The parts' stacking, bottom first: pinned in this order, a coat lies under a scarf and boots, and a hat over the ears. */
const LAYERS: readonly PartName[] = ['tummy', 'feet', 'neck', 'hands', 'eyes', 'ears', 'head', 'back'];

class WeatherWardrobe implements Game {
  readonly plan: WardrobePlan;
  readonly rounds: Outfit[];
  readonly pet: CompanionRig;
  /** What this companion can wear (decided 2026-10-23: fewer parts per species). */
  readonly wearable: Item[];
  readonly options: Option[] = [];
  /** Clothing on the pet, by item: a piece on each point of its part (two boots), the first one answering a touch. */
  readonly worn = new Map<Item, Container[]>();
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
  /** Level 8: seconds since she last touched anything, and how long the stopped weather still bounces off the pet. */
  private idle = 0;
  private shield = 0;
  /** Level 9: the grey scene before she picks a sky, and the sky cards. */
  private blank = false;
  private readonly skyCards: { weather: Weather; node: Container }[] = [];

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
  private readonly caseSlots = new Graphics();
  private readonly packed = new Container();
  private drops: { x: number; y: number; v: number; d: number }[] = [];
  private view: View;
  private clock = 0;
  private instruction: { id: LineId; vars?: LineVars } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = wardrobePlan(ctx.level);
    // The pet is the one getting dressed, so the corner guide steps out; tapping the big pet repeats instead.
    ctx.pet.visible = false;
    this.pet = ctx.companion();
    this.wearable = wardrobeFor(this.pet.species, (p) => this.pet.partPoints(p).length > 0);
    this.rounds = outfits(this.plan, ctx.rng, this.wearable);
    this.pet.scale.set(DRESS[this.pet.species].scale);
    for (const p of LAYERS) this.pet.part(p);
    const body = this.pet.touchArea(30);
    // At level 1 and when changing, the worn clothes answer too, so the pet's area reaches each of them without taking the sky.
    this.pet.hitArea =
      this.plan.mode === 'change' || this.plan.mode === 'play'
        ? { contains: (x, y) => body.contains(x, y) || this.onWorn(x, y) }
        : body;
    onTap(this.pet, () => {
      // A quiet poke: clothes hang on its parts, and a rear or a flap would throw them about.
      this.pet.poke(true);
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
      this.caseSlots,
      this.packed,
    );
    this.suitcase.visible = this.plan.mode === 'trip';
    ctx.stage.addChild(
      this.sky,
      this.skyHit,
      this.ground,
      this.groundHit,
      this.burstFx,
      this.fx,
      this.forecast,
      this.suitcase,
      this.pet,
      this.tray,
      this.glow,
    );
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
    if (this.plan.mode === 'sky') {
      const card = this.skyCards.find((c) => c.weather === this.outfit.answer);
      return card ? { tap: { on: card.node } } : null;
    }
    const item = itemToTap(this.outfit, this.packedItems());
    if (this.changePhase === 'remove') {
      const worn = this.outfit.remove?.find((i) => this.worn.has(i));
      const node = worn ? this.worn.get(worn)?.[0] : null;
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
    // Seven taps once every weather has shown: each of the four comes round at least twice (sunny opens the game).
    if (this.taps >= 7 && this.seen.size === WEATHERS.length) {
      this.done = true;
      void this.ctx.tw
        .wait(2.2)
        .then(() => {
          this.pet.cheer();
          return this.ctx.say('weather.ready');
        })
        .then(() => this.ctx.finish({ misses: 0, hints: 0 }));
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
    else if (kind === 'leaves') sfx.whoosh();
    else sfx.pluck(5 + this.ctx.rng.int(0, 4), 0.3);
  }

  /** Whether a point in the pet's own space lands on a worn item's touch area. */
  private onWorn(x: number, y: number) {
    if (!this.worn.size) return false;
    const global = this.pet.toGlobal({ x, y });
    for (const pieces of this.worn.values()) {
      for (const c of pieces) {
        const p = c.toLocal(global);
        if ((c.hitArea as Rectangle | null)?.contains(p.x, p.y)) return true;
      }
    }
    return false;
  }

  /** Free play: a touch on the clothes wiggles the nearest worn item and says its name. */
  private nameWorn(e: FederatedPointerEvent) {
    e.stopPropagation();
    if (this.done) return;
    let best: { item: Item; c: Container; d: number } | null = null;
    for (const [item, pieces] of this.worn) {
      for (const c of pieces) {
        const p = c.toLocal(e.global);
        const area = c.hitArea as Rectangle | null;
        if (!area || !Number.isFinite(p.x) || !area.contains(p.x, p.y)) continue;
        const d = Math.hypot(p.x - (area.x + area.width / 2), p.y - (area.y + area.height / 2));
        if (!best || d < best.d) best = { item, c, d };
      }
    }
    if (!best) return;
    const { item, c } = best;
    this.named++;
    this.ctx.tw.kill(c);
    c.rotation = 0;
    void this.ctx.tw
      .to(c, { rotation: 0.18 }, { duration: 0.08 })
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
    outfitFor(w, this.ctx.rng, this.wearable).forEach(
      (item, i) =>
        void this.ctx.tw
          .wait(0.25 + i * 0.2)
          .then(() => this.weather === w && !this.worn.has(item) && this.put(item, (e) => this.nameWorn(e))),
    );
  }

  // Rounds -------------------------------------------------------------------------

  private get outfit() {
    return this.rounds[this.q];
  }

  private ask() {
    const o = this.outfit;
    this.wrong = 0;
    this.changePhase = this.plan.mode === 'change' ? 'remove' : null;
    this.idle = 0;
    this.shield = 0;
    this.undress();
    this.packed.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'sky') {
      this.askSky(o);
      return;
    }
    this.blank = false;
    this.setWeather(o.weathers[0]);
    if (this.plan.mode === 'change') {
      o.remove?.forEach((item) => this.put(item, () => this.removeWorn(item)));
      o.keep?.forEach((item) => this.put(item, () => this.removeWorn(item), true));
    }
    this.drawForecast(o);
    this.caseSlots.clear();
    if (o.packings) {
      o.needed.forEach((_, i) => {
        this.caseSlots
          .roundRect(this.slotX(i) - 20, -60, 40, 40, 8)
          .fill(swatch.white.fill)
          .stroke(line(swatch.orange.line, 3));
      });
    }
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
      void this.ctx.tw.to(
        node.scale,
        { x: 1, y: 1 },
        { duration: 0.35, delay: i * 0.07, ease: ease.outBack },
      );
      this.options.push(opt);
      this.ctx.stage.addChild(node);
    });
    this.ctx.stage.addChild(this.glow);
    if (this.plan.mode === 'change')
      this.instruct(o.keep ? 'weather.keep.remove' : 'weather.change.remove', { weather: o.weathers[1] });
    else if (this.plan.mode === 'try') this.instruct('weather.try', { weather: o.weathers[0] });
    else if (o.packings) {
      const days = o.weathers[0] === 'rainy' ? 'rain' : 'snow';
      const spaces = o.needed.length === 3 ? 'three' : 'two';
      this.instruct(`weather.light.${days}.${spaces}`);
    } else if (this.plan.mode === 'trip')
      this.instruct('weather.trip', { a: o.weathers[0], b: o.weathers[1] });
    else if (o.temp) this.instruct('weather.temp', { weather: o.weathers[0], temp: o.temp });
    else
      this.instruct(this.plan.mode === 'pick' ? 'weather.pick' : 'weather.all', { weather: o.weathers[0] });
    this.resize(this.view);
    this.busy = false;
  }

  /** Level 9: the pet stands in a grey scene already dressed; she picks the sky it is dressed for. */
  private askSky(o: Outfit) {
    this.blank = true;
    this.drops = [];
    this.drawWeather();
    this.pet.setMood('calm', 0.6);
    o.worn?.forEach((item) => this.put(item));
    this.drawForecast(o);
    for (const opt of this.options) opt.node.destroy({ children: true });
    this.options.length = 0;
    for (const c of this.skyCards) c.node.destroy({ children: true });
    this.skyCards.length = 0;
    o.skies?.forEach((weather, i) => {
      const node = new Container();
      node.addChild(tile(124, 124), weatherIcon(weather, 96));
      node.hitArea = new Rectangle(-70, -70, 140, 140);
      onTap(node, () => this.chooseSky(weather));
      node.scale.set(0);
      void this.ctx.tw.to(
        node.scale,
        { x: 1, y: 1 },
        { duration: 0.35, delay: i * 0.07, ease: ease.outBack },
      );
      this.skyCards.push({ weather, node });
      this.ctx.stage.addChild(node);
    });
    this.ctx.stage.addChild(this.glow);
    this.instruct('weather.which');
    this.resize(this.view);
    this.busy = false;
  }

  private chooseSky(weather: Weather) {
    if (this.busy || this.done) return;
    const o = this.outfit;
    if (weather !== o.answer) {
      // The wrong sky plays over the pet for a moment, shows its weather's trouble, then clears.
      this.misses++;
      this.wrong++;
      this.busy = true;
      sfx.boing();
      this.blank = false;
      this.setWeather(weather);
      const fx = this.misfitFx(MISFIT[weather]);
      const hint = this.wrong === 2;
      if (hint) this.hints++;
      void (async () => {
        const said = this.ctx.say('weather.sky.wrong', { weather });
        const x = this.pet.x;
        for (const dx of [-5, 5, -5, 5, 0]) await this.ctx.tw.to(this.pet, { x: x + dx }, { duration: 0.07 });
        this.pet.x = x;
        await this.ctx.tw.wait(0.4);
        fx.destroy();
        this.pet.setMood('calm', 0.6);
        this.blank = true;
        this.drops = [];
        this.drawWeather();
        await said;
        if (hint) await this.ctx.say('weather.hint');
        this.busy = false;
        this.drawGlow();
      })();
      return;
    }
    this.busy = true;
    this.wrong = 0;
    this.blank = false;
    this.setWeather(weather);
    sfx.bell(7, 0.3);
    this.drawGlow();
    void this.ctx.tw.wait(0.6).then(() => this.finishRound());
  }

  private finishRound() {
    this.pet.cheer();
    sfx.sparkle();
    return this.ctx
      .say('weather.ready')
      .then(() => this.ctx.tw.wait(0.4))
      .then(() => {
        this.q++;
        if (this.q < this.rounds.length) this.ask();
        else {
          this.done = true;
          this.ctx.finish({ misses: this.misses, hints: this.hints });
        }
      });
  }

  private choose(opt: Option) {
    if (this.busy || this.done || opt.used) return;
    const o = this.outfit;
    this.idle = 0;
    if (!packChoices(o, this.packedItems()).includes(opt.item)) {
      if (o.packings) {
        this.rejectPacking(opt);
        return;
      }
      // Level 8 has no mistakes: anything goes on, shows what it does, and hops back.
      // A thermometer round's temperature things are wrong for the other temperature, and say so in its terms.
      const temp = this.plan.thermo ? tempOf(opt.item) : null;
      const why: { id: LineId; vars: LineVars } = temp
        ? { id: 'weather.temp.wrong', vars: { item: ITEM_WORDS[opt.item], temp } }
        : { id: 'weather.wrong', vars: { item: ITEM_WORDS[opt.item], weather: ITEMS[opt.item] } };
      if (this.plan.mode !== 'try') {
        this.misses++;
        this.wrong++;
        sfx.boing();
        if (this.wrong === 2) {
          this.hints++;
          void this.ctx.say(why.id, why.vars).then(() => this.ctx.say('weather.hint'));
        } else void this.ctx.say(why.id, why.vars);
      }
      this.tryOn(opt, temp ? (temp === 'cold' ? 'hot' : 'cold') : undefined);
      this.drawGlow();
      return;
    }
    opt.used = true;
    opt.node.alpha = 0.35;
    this.wrong = 0;
    sfx.bell(5 + this.options.filter((o) => o.used).length, 0.3);
    if (this.plan.mode === 'trip') this.pack(opt);
    else this.put(opt.item);
    if (this.plan.mode === 'try') this.shield = 2.2;
    const left = packChoices(o, this.packedItems());
    this.drawGlow();
    if (left.length) {
      void this.ctx.say('weather.yes');
      return;
    }
    this.busy = true;
    void this.ctx.tw.wait(0.6).then(async () => {
      if (this.plan.mode === 'trip') await this.unpack();
      await this.finishRound();
    });
  }

  private packedItems(): Set<Item> {
    return new Set(this.options.filter((option) => option.used).map((option) => option.item));
  }

  private rejectPacking(opt: Option) {
    this.misses++;
    this.wrong++;
    sfx.boing();
    this.ctx.tw.kill(opt.node);
    opt.node.rotation = -0.12;
    void this.ctx.tw.to(opt.node, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic });
    const useful = this.outfit.weathers.some((weather) => suits(opt.item, weather));
    const said = useful
      ? this.ctx.say('weather.light.space')
      : this.ctx.say('weather.wrong', { item: ITEM_WORDS[opt.item], weather: ITEMS[opt.item] });
    if (this.wrong === 2) {
      this.hints++;
      const round = this.q;
      void said.then(() => {
        if (this.q === round && this.wrong >= 2 && !this.busy) return this.ctx.say('weather.hint');
      });
    }
    this.drawGlow();
  }

  /** Replay the packed choices in forecast order. Shared clothes stay on as the weather changes. */
  private async unpack() {
    for (const { weather, items } of tripPlays(this.outfit, [...this.packedItems()])) {
      this.undress(items);
      this.setWeather(weather);
      if (this.outfit.packings && this.worn.has('boots')) void this.ctx.say('weather.light.boots');
      await this.ctx.tw.wait(0.6);
      for (const item of items) {
        if (this.worn.has(item)) continue;
        this.put(item);
        await this.ctx.tw.wait(0.55);
      }
      await this.ctx.tw.wait(0.5);
    }
  }

  /**
   * Hangs an item on the companion (RW05 slice 2b): a piece on its part's point, or one on each for a pair, each the old
   * pip's drawing placed by its `anchorOf` and sized for the species. A held thing goes in the hand on her right. Returns
   * the pieces at their worn size.
   */
  private hang(item: Item): Container[] {
    const part = partFor(item, this.pet.species);
    const k = DRESS[this.pet.species].parts[part] ?? 0.5;
    const points = this.pet.partPoints(part);
    let nodes = this.pet.part(part).map((node, i) => ({ node, x: points[i].x }));
    if (!PAIRED.has(item)) nodes = nodes.sort((a, b) => b.x - a.x).slice(0, 1);
    return nodes.map(({ node, x }) => {
      const side = x < this.pet.touch.x ? -1 : 1;
      const c = clothing(item, PAIRED.has(item) ? [side] : undefined);
      const a = anchorOf(item, side);
      c.pivot.set(a.x, a.y);
      c.scale.set(k);
      node.addChild(c);
      return c;
    });
  }

  /** Dresses the pet in one item, with a little pop; `touched` makes the worn item answer a touch. */
  private put(item: Item, touched?: (e: FederatedPointerEvent) => void, tight = false) {
    const pieces = this.hang(item);
    // Each piece answers (both boots), at least 104 units across on screen whatever its own size; the first one's middle is the bot's target.
    if (touched)
      pieces.forEach((c, i) => {
        // A keeper answers only where it is drawn: it is never the target, and a wide area would steal taps from what must come off.
        const least = tight ? 0 : 104 / (c.scale.x * this.pet.scale.x);
        const b = c.getLocalBounds();
        const width = Math.max(least, b.width + (tight ? 0 : 48)),
          height = Math.max(least, b.height + (tight ? 0 : 48));
        const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        if (i === 0) this.wornCenters.set(item, center);
        c.hitArea = new Rectangle(center.x - width / 2, center.y - height / 2, width, height);
        c.eventMode = 'static';
        onTap(c, touched);
      });
    this.worn.set(item, pieces);
    for (const p of pieces) {
      const k = p.scale.x;
      p.scale.set(0.6 * k);
      void this.ctx.tw.to(p.scale, { x: k, y: k }, { duration: 0.3, ease: ease.outBack });
    }
    this.pet.hop(0.5);
    sfx.pop(8);
  }

  private removeWorn(item: Item) {
    if (this.changePhase !== 'remove' || this.busy || this.done) return;
    if (this.outfit.keep?.includes(item)) {
      this.keepMiss(item);
      return;
    }
    if (!this.outfit.remove?.includes(item)) return;
    const worn = this.worn.get(item);
    if (!worn) return;
    this.worn.delete(item);
    this.wornCenters.delete(item);
    for (const p of worn) p.destroy({ children: true });
    this.pet.hop(0.45);
    sfx.pop(6);
    if (this.outfit.remove?.every((i) => !this.worn.has(i))) {
      this.changePhase = 'add';
      this.wrong = 0;
      this.setWeather(this.outfit.weathers[1]);
      this.options.forEach((o) => {
        o.node.visible = true;
      });
      this.resize(this.view);
      this.instruct('weather.change.add', { weather: this.outfit.weathers[1] });
    }
  }

  /** Level 11: she took off something that still fits the new weather. A miss; it stays on, wiggles, and the spoken reason says why. */
  private keepMiss(item: Item) {
    const w = this.outfit.weathers[1];
    this.misses++;
    this.wrong++;
    sfx.boing();
    this.wiggle(item, 1.25);
    const said = this.ctx.say('weather.keep.wrong', { item: ITEM_WORDS[item], weather: w });
    if (this.wrong === 2) {
      // Two in a row: one hint, and the thing that has to come off wiggles.
      this.hints++;
      void said.then(() => this.ctx.say('weather.keep.hint'));
      const next = this.outfit.remove?.find((i) => this.worn.has(i));
      if (next) this.wiggle(next, 1.4);
    }
  }

  private wiggle(item: Item, k: number) {
    for (const p of this.worn.get(item) ?? []) {
      const base = p.scale.x;
      this.ctx.tw.kill(p.scale);
      void this.ctx.tw
        .to(p.scale, { x: base * k, y: base * k }, { duration: 0.14 })
        .then(() => this.ctx.tw.to(p.scale, { x: base, y: base }, { duration: 0.45, ease: ease.outElastic }));
    }
  }

  private undress(keep: readonly Item[] = []) {
    for (const [item, pieces] of this.worn) {
      if (keep.includes(item)) continue;
      for (const c of pieces) c.destroy({ children: true });
      this.worn.delete(item);
      this.wornCenters.delete(item);
    }
  }

  /**
   * A wrong item goes on for under a second, shows what the weather does to it (drops on the lenses, sweat, a frosty cap),
   * then hops back to its tile. The tap that started it counts however the caller scores it.
   */
  private tryOn(opt: Option, kind: Misfit = MISFIT[this.weather]) {
    const { ctx, pet } = this;
    this.busy = true;
    opt.node.alpha = 0.35;
    const pieces = this.hang(opt.item);
    for (const p of pieces) {
      const k = p.scale.x;
      p.scale.set(0.6 * k);
      void ctx.tw.to(p.scale, { x: k, y: k }, { duration: 0.2, ease: ease.outBack });
    }
    sfx.pop(8);
    const fx = this.misfitFx(kind);
    // A shiver or a fan-wiggle on the pet's whole body, then back to where it stood.
    const x = pet.x;
    void (async () => {
      for (const dx of [-5, 5, -5, 5, 0]) await ctx.tw.to(pet, { x: x + dx }, { duration: 0.07 });
      pet.x = x;
      if (kind === 'blown') {
        // The wind takes it: the piece lifts off the pet, tumbles up and away, and its tile gets it back below.
        sfx.whoosh();
        await Promise.all(
          pieces.map((p) =>
            ctx.tw.to(
              p,
              { x: p.x + 110, y: p.y - 170, rotation: 0.7, alpha: 0.2 },
              { duration: 0.5, ease: ease.outQuad },
            ),
          ),
        );
      } else await ctx.tw.wait(0.25);
      for (const p of pieces) p.destroy({ children: true });
      fx.destroy();
      pet.setMood('happy', 0.4);
      const back = itemIcon(opt.item, 96);
      back.position.copyFrom(this.middle());
      ctx.stage.addChild(back);
      await ctx.tw.to(back, { x: opt.node.x, y: opt.node.y }, { duration: 0.3, ease: ease.outBack });
      back.destroy({ children: true });
      opt.node.alpha = 1;
      this.busy = false;
    })();
  }

  /** The weather's trouble drawn on the pet (drops, sweat or frost), with its little sound and mood; the caller destroys it. */
  private misfitFx(kind: Misfit): Graphics {
    const { ctx, pet } = this;
    // Drawn about the old pip's head (0, −214), carried to this species' head at no less than half size.
    const fx = new Graphics();
    const head = pet.partPoints('head')[0] ?? { x: 0, y: -214 };
    fx.pivot.set(0, -214);
    fx.position.set(head.x, head.y);
    fx.scale.set(Math.max(0.5, DRESS[pet.species].parts.head ?? 1));
    pet.attach(fx);
    if (kind === 'wet') {
      for (const [x, y] of [
        [-46, -176],
        [4, -150],
        [52, -184],
        [-14, -214],
      ])
        fx.circle(x, y, 9).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
      pet.setMood('surprised', 0.9);
      [7, 5, 4].forEach((s, i) => void ctx.tw.wait(0.12 + i * 0.1).then(() => sfx.bell(s, 0.2)));
    } else if (kind === 'hot') {
      for (const side of [-1, 1])
        fx.poly([side * 112, -250, side * 100, -226, side * 124, -226])
          .fill(swatch.blue.light)
          .stroke(line(swatch.blue.line, 3))
          .circle(side * 112, -222, 12)
          .fill(swatch.blue.light);
      pet.setMood('calm', 0.9);
      [4, 5, 7].forEach((s, i) => void ctx.tw.wait(0.12 + i * 0.1).then(() => sfx.bell(s, 0.2)));
    } else if (kind === 'blown') {
      // Three wind curls streaming past the head, the way the sky icon draws them.
      for (const [y, len] of [
        [-262, 120],
        [-232, 150],
        [-200, 110],
      ] as const) {
        const x0 = -170;
        fx.moveTo(x0, y)
          .lineTo(x0 + len - 20, y)
          .quadraticCurveTo(x0 + len + 6, y - 4, x0 + len, y - 22)
          .quadraticCurveTo(x0 + len - 12, y - 32, x0 + len - 18, y - 16);
      }
      fx.stroke(line(swatch.blue.line, 7));
      pet.setMood('surprised', 0.9);
      [4, 6, 9].forEach((s, i) => void ctx.tw.wait(0.08 + i * 0.08).then(() => sfx.bell(s, 0.18)));
    } else {
      puffs(
        fx,
        [
          [-46, -298, 26],
          [0, -318, 32],
          [48, -298, 26],
        ],
        swatch.white.fill,
        swatch.blue.light,
        4,
      );
      pet.setMood('surprised', 0.9);
      [7, 4, 2].forEach((s, i) => void ctx.tw.wait(0.12 + i * 0.1).then(() => sfx.bell(s, 0.2)));
    }
    return fx;
  }

  private slotX(i: number) {
    return (i - (this.outfit.needed.length - 1) / 2) * 44;
  }

  /** The flight ends in suitcase coordinates, even if the case moves during a rotation. */
  private pack(opt: Option) {
    const i = this.packedItems().size - 1;
    const dest = this.outfit.packings ? { x: this.slotX(i), y: -40 } : { x: -57 + i * 38, y: -150 };
    const icon = itemIcon(opt.item, 96);
    icon.position.set(opt.node.x - this.suitcase.x, opt.node.y - this.suitcase.y);
    this.packed.addChild(icon);
    void this.ctx.tw.to(icon.scale, { x: 0.38, y: 0.38 }, { duration: 0.45 });
    void this.ctx.tw.to(icon, dest, { duration: 0.45, ease: ease.inOutSine }).then(() => sfx.clunk());
  }

  // Weather ------------------------------------------------------------------------

  private setWeather(w: Weather) {
    this.weather = w;
    this.seen.add(w);
    if (w === 'rainy') sfx.splash();
    if (w === 'snowy') sfx.sparkle();
    if (w === 'windy') sfx.whoosh();
    if (w === 'sunny')
      [5, 7, 9].forEach((s, i) => void this.ctx.tw.wait(i * 0.12).then(() => sfx.bell(s, 0.2)));
    if (w !== 'sunny' && !this.worn.size) this.pet.setMood('surprised', 0.8);
    if (w !== 'windy') this.pet.rotation = 0;
    const v = this.view;
    // Rain falls fast, snow drifts down, and in wind the "drops" are leaves that stream across the screen (`v` is sideways speed).
    this.drops = Array.from(
      { length: w === 'sunny' ? 0 : w === 'rainy' ? 70 : w === 'windy' ? 18 : 55 },
      () => ({
        x: this.ctx.rng.range(0, v.w),
        y: this.ctx.rng.range(0, v.h),
        v:
          w === 'rainy'
            ? this.ctx.rng.range(500, 700)
            : w === 'windy'
              ? this.ctx.rng.range(260, 420)
              : this.ctx.rng.range(40, 80),
        d: this.ctx.rng.range(0, 6),
      }),
    );
    this.drawWeather();
  }

  private drawWeather() {
    const v = this.view;
    const groundY = v.h * 0.62;
    const w = this.weather;
    const s = this.sky
      .clear()
      .rect(0, 0, v.w, groundY + 20)
      .fill(this.blank ? swatch.white.line : w === 'snowy' ? swatch.white.light : swatch.blue.light);
    if (this.blank) {
      // Level 9's grey, weatherless scene: no sun, clouds, rain or snow until she picks a sky.
      this.skyHit.hitArea = new Rectangle(0, 0, v.w, groundY);
      this.groundHit.hitArea = new Rectangle(0, groundY, v.w, v.h - groundY);
      this.ground
        .clear()
        .rect(0, groundY, v.w, v.h - groundY)
        .fill(swatch.white.light);
      return;
    }
    if (w === 'rainy') s.rect(0, 0, v.w, groundY + 20).fill({ color: swatch.white.line, alpha: 0.4 });
    if (w === 'windy') {
      // The clouds move in `update()`; the sky itself keeps a low sun peeking out so wind reads as its own weather, not grey.
      s.circle(v.w * 0.22, 200, 44)
        .fill(swatch.yellow.light)
        .stroke(line(swatch.yellow.line, 5));
    } else if (w === 'sunny') {
      const cx = v.w * 0.84;
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        s.moveTo(cx + Math.cos(a) * 72, 120 + Math.sin(a) * 72).lineTo(
          cx + Math.cos(a) * 96,
          120 + Math.sin(a) * 96,
        );
      }
      s.stroke(line(swatch.yellow.line, 8))
        .circle(cx, 120, 58)
        .fill(swatch.yellow.fill)
        .stroke(line(swatch.yellow.line));
    } else {
      for (const [x, y, k] of [
        [0.2, 110, 1.2],
        [0.55, 80, 1],
        [0.86, 130, 1.1],
      ] as const) {
        puffs(
          s,
          [
            [-60 * k, 8, 40 * k],
            [0, -14, 54 * k],
            [60 * k, 8, 40 * k],
          ].map(([dx, dy, r]) => [v.w * x + dx, y + dy, r] as [number, number, number]),
          swatch.white.fill,
          w === 'rainy' ? swatch.white.line : swatch.blue.light,
          6,
        );
      }
    }
    this.skyHit.hitArea = new Rectangle(0, 0, v.w, groundY);
    this.groundHit.hitArea = new Rectangle(0, groundY, v.w, v.h - groundY);
    const g = this.ground
      .clear()
      .rect(0, groundY, v.w, v.h - groundY)
      .fill(w === 'snowy' ? swatch.white.fill : grass);
    if (w === 'rainy')
      for (const [x, y] of [
        [0.25, 0.72],
        [0.78, 0.7],
      ])
        g.ellipse(v.w * x, v.h * y, 90, 18).fill(swatch.blue.light);
    if (w === 'snowy')
      for (const [x, y] of [
        [0.2, 0.68],
        [0.82, 0.7],
      ])
        g.ellipse(v.w * x, v.h * y, 110, 22).fill(swatch.blue.light);
    if (w === 'sunny')
      for (let i = 0; i < 6; i++)
        g.poly(
          starPoints(9, 4).map((p, k) => p + (k % 2 ? v.h * 0.7 + (i % 2) * 30 : v.w * (0.1 + i * 0.16))),
        ).fill(swatch.yellow.light);
    if (w === 'windy') {
      // Grass tufts bent the way the wind goes.
      for (let i = 0; i < 7; i++) {
        const x = v.w * (0.06 + i * 0.145),
          y = v.h * (0.7 + (i % 2) * 0.06);
        for (const dx of [-14, 0, 14])
          g.moveTo(x + dx, y).quadraticCurveTo(x + dx + 18, y - 26, x + dx + 44, y - 30);
      }
      g.stroke(line(swatch.green.line, 5));
    }
  }

  private drawForecast(o: Outfit) {
    this.forecast.removeChildren().forEach((c) => c.destroy());
    if (this.plan.thermo && o.temp) {
      this.forecast.addChild(thermometer(o.temp));
      return;
    }
    if (this.plan.mode !== 'trip') return;
    const card = new Graphics()
      .roundRect(-110, -55, 220, 110, 24)
      .fill(swatch.white.fill)
      .stroke(line(swatch.white.line, 4));
    const a = weatherIcon(o.weathers[0], 56);
    const b = weatherIcon(o.weathers[1], 56);
    a.x = -55;
    b.x = 55;
    const arrow = new Graphics()
      .moveTo(-12, 0)
      .lineTo(12, 0)
      .moveTo(4, -9)
      .lineTo(13, 0)
      .lineTo(4, 9)
      .stroke(line(swatch.white.line, 5));
    this.forecast.addChild(card, a, b, arrow);
  }

  // Layout -------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.drawWeather();
    this.pet.position.set(
      this.plan.mode === 'trip' ? v.w * 0.42 : v.w / 2,
      v.h - (this.plan.mode === 'play' ? 70 : 178),
    );
    this.suitcase.position.set(v.w * 0.7, v.h - 178);
    // The thermometer stands in the top corner beside the sky; the trip's forecast card sits at the top centre.
    if (this.plan.thermo) this.forecast.position.set(v.w - 80, 130);
    else this.forecast.position.set(v.w / 2, 90);
    this.tray.clear();
    if (this.plan.packLight || this.plan.thermo) this.layoutLightTrip(v);
    else if (this.options.length && this.changePhase !== 'remove') {
      this.tray.roundRect(160, v.h - 160, v.w - 190, 148, 30).fill({ color: swatch.white.fill, alpha: 0.85 });
      const xs = spread(this.options.length, 175, v.w - 40, 150);
      this.options.forEach((o, i) => {
        this.ctx.tw.kill(o.node);
        o.node.position.set(xs[i], v.h - 86);
      });
    }
    if (this.skyCards.length) {
      this.tray.roundRect(160, v.h - 160, v.w - 190, 148, 30).fill({ color: swatch.white.fill, alpha: 0.85 });
      const xs = spread(this.skyCards.length, 175, v.w - 40, 150);
      this.skyCards.forEach((c, i) => {
        this.ctx.tw.kill(c.node);
        c.node.position.set(xs[i], v.h - 86);
      });
    }
    this.drawGlow();
  }

  private layoutLightTrip(v: View) {
    const columns = v.upright ? 3 : 6;
    const rows = Math.ceil(this.options.length / columns);
    // Leave the two rows above the short-phone caption. A sideways row fits below the bubble.
    const top = v.h - (v.upright ? 440 + rows * 150 : 165);
    const displayY = v.upright ? top - 28 : v.h - 450;
    this.pet.position.set(v.w * (v.upright ? 0.33 : 0.26), displayY);
    this.suitcase.position.set(v.w * 0.7, displayY - 6);
    const width = Math.min(columns * 150 + 24, v.w - 24);
    this.tray
      .roundRect((v.w - width) / 2, top, width, rows * 150, 30)
      .fill({ color: swatch.white.fill, alpha: 0.85 });
    for (let start = 0; start < this.options.length; start += columns) {
      const row = this.options.slice(start, start + columns);
      const left = (v.w - (row.length - 1) * 150) / 2;
      row.forEach(({ node }, i) => {
        node.position.set(left + i * 150, top + 75 + (start / columns) * 150);
      });
    }
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done || !this.outfit) return;
    const sky = this.skyCards.find((c) => c.weather === this.outfit.answer);
    if (this.plan.mode === 'sky') {
      if (sky)
        g.roundRect(sky.node.x - 72, sky.node.y - 72, 144, 144, 26).stroke({
          width: 8,
          color: swatch.yellow.line,
        });
      return;
    }
    const item = itemToTap(this.outfit, this.packedItems());
    const target = this.options.find((o) => o.item === item);
    if (target)
      g.roundRect(target.node.x - 72, target.node.y - 72, 144, 144, 26).stroke({
        width: 8,
        color: swatch.yellow.line,
      });
  }

  update(dt: number) {
    this.clock += dt;
    this.pet.update(dt);
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    if (this.plan.mode === 'try' && !this.busy && !this.done && this.options.length) {
      this.idle += dt;
      if (this.idle > TRY_IDLE) {
        // Not a hint: the fitting tile only wiggles, and nothing is counted.
        this.idle = 0;
        const fit = this.options.find((o) => !o.used && this.outfit.needed.includes(o.item));
        if (fit) {
          const x = fit.node.x;
          this.ctx.tw.kill(fit.node);
          void this.ctx.tw
            .to(fit.node, { x: x + 10 }, { duration: 0.07 })
            .then(() => this.ctx.tw.to(fit.node, { x: x - 10 }, { duration: 0.1 }))
            .then(() => this.ctx.tw.to(fit.node, { x }, { duration: 0.3, ease: ease.outElastic }));
        }
      }
    }
    const v = this.view;
    this.drawBursts(dt);
    const fx = this.fx.clear();
    if (this.shield > 0) this.drawShield(fx, dt);
    // The lean belongs to wind alone: level 9's grey scene after a wrong windy sky stands the pet straight again.
    if (this.blank || this.weather !== 'windy') this.pet.rotation = 0;
    if (this.blank) return;
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
    } else if (this.weather === 'windy') this.drawWind(fx, dt);
  }

  /** Wind: clouds drift across the sky, leaves stream sideways and bob, and the pet leans into it. */
  private drawWind(fx: Graphics, dt: number) {
    const v = this.view;
    const groundY = v.h * 0.62;
    const gust = Math.sin(this.clock * 1.7) * 0.5 + 0.5;
    for (const [x, y, k, speed] of [
      [0.1, 100, 1.1, 70],
      [0.45, 70, 0.9, 95],
      [0.8, 120, 1.0, 60],
    ] as const) {
      // Each cloud is stretched flat by the wind and wraps round once it leaves on the right.
      const cx = ((v.w * x + this.clock * speed) % (v.w + 260)) - 130;
      puffs(
        fx,
        [
          [-70 * k, 6, 32 * k],
          [0, -10, 44 * k],
          [70 * k, 6, 32 * k],
          [120 * k, 12, 22 * k],
        ].map(([dx, dy, r]) => [cx + dx, y + dy, r] as [number, number, number]),
        swatch.white.fill,
        swatch.white.line,
        5,
      );
    }
    for (const d of this.drops) {
      d.x += d.v * (0.7 + 0.6 * gust) * dt;
      d.y += Math.sin(this.clock * 3 + d.d) * 60 * dt;
      if (d.x > v.w + 30) [d.x, d.y] = [-30, this.ctx.rng.range(groundY * 0.3, v.h - 40)];
      const r = 7 + (d.d % 3) * 2;
      const tilt = 0.3 + Math.sin(this.clock * 4 + d.d) * 0.5;
      fx.moveTo(d.x, d.y)
        .quadraticCurveTo(
          d.x + r * 1.6 * Math.cos(tilt),
          d.y - r * 1.4,
          d.x + r * 3 * Math.cos(tilt),
          d.y + r * 0.3 * Math.sin(tilt),
        )
        .quadraticCurveTo(d.x + r * 1.6 * Math.cos(tilt), d.y + r * 1.4, d.x, d.y)
        .closePath();
    }
    fx.fill(swatch.green.fill).stroke({ width: 2, color: swatch.green.line });
    // A lean into the wind that the gusts push a little further, pivoting at the feet; `setWeather` stands it straight again.
    this.pet.rotation = -0.045 - 0.035 * gust;
  }

  /** Level 8: the fitting item stops the weather, so a few drops, flakes or sun sparks bounce off the pet. */
  private drawShield(fx: Graphics, dt: number) {
    this.shield = Math.max(0, this.shield - dt);
    const t = 2.2 - this.shield;
    const color =
      this.weather === 'sunny'
        ? swatch.yellow.fill
        : this.weather === 'rainy'
          ? swatch.blue.fill
          : this.weather === 'windy'
            ? swatch.green.fill
            : swatch.white.fill;
    const mid = this.middle();
    // The old pip's body reached about 120 units from its middle at 0.8.
    const reach = (this.pet.touch.r * this.pet.scale.x) / 120;
    for (let i = 0; i < 7; i++) {
      const phase = (t * 1.6 + i / 7) % 1;
      const a = -Math.PI / 2 + (i - 3) * 0.42;
      const r = (150 + 90 * phase) * reach;
      fx.circle(mid.x + Math.cos(a) * r, mid.y + Math.sin(a) * r * 0.9, 8 * (1 - phase) + 3).fill({
        color,
        alpha: 1 - phase,
      });
    }
  }

  /** The middle of the pet's body on the stage. */
  private middle(): { x: number; y: number } {
    return this.ctx.stage.toLocal(this.pet.toGlobal({ x: this.pet.touch.x, y: this.pet.touch.y }));
  }

  private drawBursts(dt: number) {
    const g = this.burstFx.clear();
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.t += dt;
      if (b.t >= BURST_LIFE) {
        this.bursts.splice(i, 1);
        continue;
      }
      const k = b.t / BURST_LIFE;
      const alpha = 1 - k;
      if (b.kind === 'splash') {
        g.ellipse(b.x, b.y, 30 + 90 * k, 8 + 22 * k).stroke({ width: 6, color: swatch.blue.fill, alpha });
        for (const dx of [-1, 0, 1])
          g.circle(b.x + dx * (24 + 40 * k), b.y - 70 * Math.sin(Math.PI * k) - 6, 8).fill({
            color: swatch.blue.fill,
            alpha,
          });
      } else if (b.kind === 'crunch') {
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3 + 0.3;
          g.circle(
            b.x + Math.cos(a) * 60 * k,
            b.y + Math.sin(a) * 30 * k - 30 * Math.sin(Math.PI * k),
            12 * (1 - k * 0.5),
          )
            .fill({ color: swatch.white.fill, alpha })
            .stroke({ width: 2, color: swatch.blue.light, alpha });
        }
      } else if (b.kind === 'leaves') {
        // A handful of leaves scatter downwind from the touch, each on its own arc.
        for (let j = 0; j < 5; j++) {
          const x = b.x + (30 + j * 22) * k * 3,
            y = b.y - Math.sin(Math.PI * k) * (40 + j * 14) + (j - 2) * 10;
          const r = 9 + (j % 2) * 3;
          g.ellipse(x, y, r * 1.6, r * 0.8)
            .fill({ color: swatch.green.fill, alpha })
            .stroke({ width: 2, color: swatch.green.line, alpha });
        }
      } else {
        const grow = Math.min(1, b.t / 0.25);
        const top = b.y - 70 * grow;
        g.moveTo(b.x, b.y)
          .lineTo(b.x, top)
          .stroke({ width: 7, color: swatch.green.line, alpha, cap: 'round' });
        for (let j = 0; j < 5; j++) {
          const a = (j * 2 * Math.PI) / 5;
          g.circle(b.x + Math.cos(a) * 22 * grow, top + Math.sin(a) * 22 * grow, 16 * grow).fill({
            color: swatch.pink.fill,
            alpha,
          });
        }
        g.circle(b.x, top, 13 * grow).fill({ color: swatch.yellow.fill, alpha });
      }
    }
  }

  destroy() {
    this.pet.rotation = 0;
    this.ctx.pet.visible = true;
  }
}

/** A picture thermometer (level 13): a tube with a bulb, the red column high on a hot day and the blue one low on a cold day, with a snowflake or sun beside it. */
function thermometer(temp: 'cold' | 'hot'): Container {
  const c = new Container();
  const hot = temp === 'hot';
  const fill = hot ? swatch.red : swatch.blue;
  const card = new Graphics()
    .roundRect(-62, -100, 124, 200, 28)
    .fill(swatch.white.fill)
    .stroke(line(swatch.white.line, 4));
  const tube = new Graphics()
    .roundRect(-12, -78, 24, 130, 12)
    .fill(swatch.white.fill)
    .stroke(line(swatch.white.line, 4))
    .circle(0, 62, 24)
    .fill(fill.fill)
    .stroke(line(fill.line, 4));
  const top = hot ? -62 : 14;
  const column = new Graphics().roundRect(-6, top, 12, 62 - top, 6).fill(fill.fill);
  const mark = new Graphics();
  for (const y of [-56, -28, 0, 28]) mark.moveTo(18, y).lineTo(34, y);
  mark.stroke(line(swatch.white.line, 3));
  const icon = weatherIcon(hot ? 'sunny' : 'snowy', 40);
  icon.position.set(-44, hot ? -60 : 40);
  c.addChild(card, tube, column, mark, icon);
  return c;
}

function wardrobeArt(seed = 1): Container {
  const rng = new Rng(seed);
  // Pinned to the original three weathers and eight items: a seed's sticker looks as it did before wind.
  const w = rng.pick(STICKER_WEATHERS);
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
  challenge: 'logic',
  skills: ['reasoning', 'vocabulary', 'everyday-life'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  uprightLevels: [12, 13],
  levels: (b) => rangeFor(LEVELS, b),
  entryLevels: [8, 9],
  describeLevel: (l) => wardrobePlan(l).name,
  touchDemo: true,
  music: STYLES.hub,
  coplayHint: 'Look out the real window with {name}: what is the weather today, and what would we wear?',
  coplayHintLap:
    'Look out the real window with {name} and say what you see: "It\'s sunny! Let\'s wear a hat."',
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
  create: (ctx) => (ctx.level === 10 ? new WeatherFriends(ctx, weatherIcon) : new WeatherWardrobe(ctx)),
};
