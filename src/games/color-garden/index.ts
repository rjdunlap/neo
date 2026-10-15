import { Container, Graphics } from 'pixi.js';
import { prop, FRUIT_FOR } from '../../art/props';
import { RAINBOW, swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { basketAt, basketWidth, deal, DROP_ABOVE, nextToSort, planFor, type GardenPlan, type Rule, type SortKey } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

/** The two blues of level 7: multiplied tints over white and blue props, and the basket cloth to match. */
const SHADE_LOOK = {
  'light-blue': { base: 'white' as ColorName, tint: 0xa9d3ff, cloth: { fill: 0xa9d3ff, line: 0x6f9fd6 } },
  'dark-blue': { base: 'blue' as ColorName, tint: 0x5a7fb5, cloth: { fill: 0x1c51b2, line: 0x143a80 } },
};
const shadeLook = (key: SortKey) => SHADE_LOOK[key as keyof typeof SHADE_LOOK] as (typeof SHADE_LOOK)[keyof typeof SHADE_LOOK] | undefined;
/** Level 8's kind baskets: a plain cloth, with the thing itself on the band. */
const KIND_CLOTH = { fill: 0xfff3d6, line: 0xc9a86a };
const kindOf = (key: SortKey) => (key === 'kind-fruit' ? 'fruit' : key === 'kind-balloon' ? 'balloon' : undefined);
const kindIcon = (key: SortKey) => prop(key === 'kind-fruit' ? FRUIT_FOR.red! : 'balloon', 'red');
const clothOf = (key: SortKey) => (kindOf(key) ? KIND_CLOTH : shadeLook(key)?.cloth ?? swatch[key as ColorName]);
const shadeOf = (key: SortKey) => (key === 'light-blue' ? 'light' : 'dark');

const LEVELS: BandLevels = {
  lap: { min: 9, max: 9, order: [9] },
  toddler: { min: 1, max: 9, order: [9, 1, 2, 3, 4, 5] },
  preschool: { min: 3, max: 8 },
  prek: { min: 4, max: 8 },
};

const ITEM_SCALE = 0.78;
const BASKET = { fill: 0xd9a066, line: 0x9c6b3c, weave: 0xb9844f };

interface Item {
  view: Container;
  key: SortKey;
  drag?: DragHandle;
  home: { x: number; y: number };
  wrongs: number;
}

/** A woven basket lined with cloth of its color. Things dropped in stay in. */
class Basket extends Container {
  readonly key: SortKey;
  readonly inside = new Container();
  private readonly glow = new Graphics();
  private readonly body = new Container();
  private bounce = 0;
  private shake = 0;
  private clock = 0;
  glowing = false;

  constructor(
    key: SortKey,
    readonly w: number,
  ) {
    super();
    this.key = key;
    const sw = clothOf(key);
    const h = 96;
    const top = -h;
    const back = new Graphics().ellipse(0, top, w / 2, 20).fill(sw.fill).stroke({ width: 5, color: sw.line });
    const front = new Graphics()
      .moveTo(-w / 2, top)
      .lineTo(w / 2, top)
      .lineTo(w / 2 - 16, 0)
      .lineTo(-w / 2 + 16, 0)
      .closePath()
      .fill(BASKET.fill)
      .stroke({ width: 6, color: BASKET.line, join: 'round' });
    for (let y = top + 22; y < -8; y += 22) front.moveTo(-w / 2 + 8, y).lineTo(w / 2 - 8, y).stroke({ width: 3, color: BASKET.weave });
    for (let x = -w / 2 + 24; x < w / 2 - 10; x += 26) front.moveTo(x, top + 4).lineTo(x * 0.9, -4).stroke({ width: 3, color: BASKET.weave });
    // The color band is the big, unmissable cue.
    front.roundRect(-w / 2 + 6, top + 26, w - 12, 28, 10).fill(sw.fill).stroke({ width: 4, color: sw.line });
    if (kindOf(key)) {
      const icon = kindIcon(key);
      icon.scale.set(0.3);
      icon.position.set(0, top + 52);
      front.addChild(icon);
    }
    this.inside.y = top + 6;
    this.body.addChild(back, this.inside, front);
    this.addChild(this.glow, this.body);
  }

  happy() {
    this.bounce = 1;
  }

  nope() {
    this.shake = 1;
  }

  update(dt: number) {
    this.clock += dt;
    this.bounce = Math.max(0, this.bounce - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 2.5);
    const b = Math.sin(this.bounce * Math.PI) * 0.12;
    this.body.scale.set(1 + b, 1 - b);
    this.body.x = 8 * Math.sin(this.shake * 22) * this.shake;
    this.glow.clear();
    if (this.glowing) this.glow.ellipse(0, -48, this.w / 2 + 26, 76 + 4 * Math.sin(this.clock * 8)).fill({ color: 0xfff3a0, alpha: 0.7 });
  }
}

class ColorGarden implements Game {
  private readonly plan: GardenPlan;
  private readonly backdrop: Backdrop;
  private readonly tree = new Graphics();
  private readonly layer = new Container();
  private readonly baskets: Basket[];
  private items: Item[] = [];
  private view: View;
  private sorted = 0;
  private misses = 0;
  private hints = 0;
  private clock = 0;
  private lastNag = -10;
  private finished = false;
  private readonly rule?: Rule;
  private sign?: Container;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.view = ctx.view;
    this.backdrop = ctx.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.62, clouds: 2, sun: true, seed: 44 }, ctx.view),
    );
    const { colors, items, kinds, looks, rule } = deal(ctx.rng, this.plan);
    this.rule = rule;
    this.sign = this.rule ? this.makeSign(this.rule, colors) : undefined;
    this.baskets = colors.map((c) => ctx.track(new Basket(c, basketWidth(this.plan))));
    ctx.stage.addChild(this.backdrop, this.tree, ...this.baskets, this.layer);
    if (this.sign) ctx.stage.addChild(this.sign);

    this.items = items.map((color, i) => {
      const shade = shadeLook(color);
      const kind = kinds[i];
      const view = prop(kind, shade ? shade.base : (looks?.[i] ?? (color as ColorName)));
      if (shade) view.tint = shade.tint;
      view.scale.set(ITEM_SCALE);
      const item: Item = { view, key: color, wrongs: 0, home: { x: 0, y: 0 } };
      if (this.plan.tap) {
        onTap(view, () => {
          const basket = nextToSort([item], this.baskets)?.basket;
          if (!basket || !this.items.includes(item) || this.finished) return;
          sfx.tick();
          void ctx.say(`color.${color as ColorName}`);
          void this.place(item, basket);
        }, { radius: 60 / ITEM_SCALE });
      } else item.drag = draggable(view, ctx.tw, {
        onPick: () => {
          sfx.tick();
          void ctx.say(color === 'kind-fruit' ? 'garden.is.fruit' : color === 'kind-balloon' ? 'garden.is.balloon' : shadeLook(color) ? (color === 'light-blue' ? 'tone.light' : 'tone.dark') : `color.${color as ColorName}`);
        },
        onDrop: (x, y) => this.drop(item, x, y),
      });
      this.layer.addChild(view);
      return item;
    });
  }

  /** The sign over the tree: either the baskets' two colors or a fruit and a balloon. It stays all round. */
  private makeSign(rule: Rule, keys: SortKey[]): Container {
    const sign = new Container();
    sign.eventMode = 'none';
    sign.addChild(new Graphics().roundRect(-90, -48, 180, 96, 22).fill(0xfffbe8).stroke({ width: 6, color: 0x9c6b3c }));
    [-1, 1].forEach((side, i) => {
      const key = [...keys].sort()[i];
      if (rule === 'color') {
        const sw = swatch[key as ColorName];
        sign.addChild(new Graphics().roundRect(side * 44 - 32, -28, 64, 56, 14).fill(sw.fill).stroke({ width: 4, color: sw.line }));
      } else {
        const icon = kindIcon(key);
        icon.scale.set(0.4);
        icon.position.set(side * 44, 24);
        sign.addChild(icon);
      }
    });
    return sign;
  }

  start() {
    void this.ctx.instruct(this.plan.tap ? 'garden.tap' : this.rule ? this.rule === 'color' ? 'garden.rule.color' : 'garden.rule.kind' : this.plan.shades ? 'garden.shades' : 'garden.start');
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const cx = v.w / 2;
    const rows = this.plan.items > 6 ? 2 : 1;
    const perRow = Math.ceil(this.plan.items / rows);
    const canopyW = Math.max(360, perRow * 118 + 100);
    const t = this.tree.clear();
    t.roundRect(cx - 34, 200, 68, v.h * 0.62 - 180, 20).fill(0x9c6b3c).stroke({ width: 6, color: 0x7a5230 });
    const n = 7;
    const canopy: [number, number, number][] = Array.from({ length: n }, (_, i) => [
      cx + (i - (n - 1) / 2) * (canopyW / n),
      150 + (i % 2) * 40,
      canopyW / n + 30,
    ]);
    puffs(t, canopy, 0x7cc463, 0x4e9e3a);

    // Fruit waiting on the tree.
    const waiting = this.items.filter((i) => !i.drag?.dragging);
    waiting.forEach((item, i) => {
      const row = Math.floor(i / perRow);
      const xs = spread(Math.min(perRow, waiting.length - row * perRow), cx - canopyW / 2 + 60, cx + canopyW / 2 - 60, 118);
      item.home = { x: xs[i % perRow], y: rows === 1 ? 170 : 120 + row * 110 };
      if (item.drag) item.drag.home = item.home;
      item.view.position.set(item.home.x, item.home.y);
      // A pale patch behind each spot, so a green pear or flower still stands out from the leaves.
      t.circle(item.home.x, item.home.y, 50).fill({ color: 0xfffbe8, alpha: 0.8 });
    });

    const xs = spread(this.baskets.length, 150, v.w - 40, this.baskets[0].w + 30);
    this.baskets.forEach((b, i) => b.position.set(xs[i], v.h - 26));
    this.sign?.position.set(v.w - 110, 90);
  }

  update(dt: number) {
    this.clock += dt;
  }

  /** The ghost finger uses the round's own action: tap to hop, or drag to sort. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const next = nextToSort(this.items.filter((i) => !i.drag?.dragging && !i.view.destroyed), this.baskets);
    if (next && this.plan.tap) return { tap: { on: next.item.view } };
    return next ? { drag: { on: next.item.view }, to: { on: next.basket, x: 0, y: -DROP_ABOVE } } : null;
  }

  destroy() {
    for (const i of this.items) i.drag?.destroy();
  }

  private drop(item: Item, x: number, y: number): boolean {
    if (this.finished) return false;
    // Anywhere over a basket (or just above it) counts.
    const basket = basketAt(this.baskets, x, y);
    if (!basket) return false;
    if (basket.key === item.key) {
      void this.place(item, basket);
      return true;
    }
    this.misses++;
    item.wrongs++;
    sfx.boing();
    basket.nope();
    if (this.clock - this.lastNag > 3) {
      this.lastNag = this.clock;
      void (kindOf(item.key)
        ? this.ctx.say('garden.kind.wrong', { kind: kindOf(item.key)! })
        : this.ctx.say(shadeLook(item.key) ? 'garden.shade.wrong' : 'garden.wrong', shadeLook(item.key) ? { shade: shadeOf(item.key) } : { color: item.key }));
    }
    if (item.wrongs === 2) {
      this.hints++;
      const right = this.baskets.find((b) => b.key === item.key);
      if (right) {
        right.glowing = true;
        void this.ctx.tw.wait(4).then(() => (right.glowing = false));
      }
    }
    return false;
  }

  /** It drops into the basket and stays there, peeking over the rim. */
  private async place(item: Item, basket: Basket) {
    item.drag?.destroy();
    item.view.eventMode = 'none';
    item.view.removeAllListeners();
    this.items = this.items.filter((i) => i !== item);
    basket.glowing = false;
    const v = item.view;
    const at = basket.inside.toLocal(v.getGlobalPosition());
    basket.inside.addChild(v);
    v.position.set(at.x, at.y);
    const slot = basket.inside.children.length - 1;
    const target = { x: ((slot % 3) - 1) * 28, y: -30 - Math.floor(slot / 3) * 12 };
    void this.ctx.tw.to(v.scale, { x: 0.5, y: 0.5 }, { duration: this.plan.tap ? 0.6 : 0.25 });
    if (this.plan.tap) {
      // Lift straight away, then arc down into the basket; there is no drop target to choose.
      await this.ctx.tw.to(v, { x: (at.x + target.x) / 2, y: at.y - 65 }, { duration: 0.18, ease: ease.outQuad });
    }
    await this.ctx.tw.to(v, target, { duration: this.plan.tap ? 0.42 : 0.25, ease: this.plan.tap ? ease.inQuad : ease.outQuad });
    basket.happy();
    sfx.bell(4 + this.baskets.indexOf(basket), 0.25);
    this.ctx.particles.burst(basket.x, basket.y - 100, { kind: 'star', colors: [clothOf(item.key).fill, 0xffffff], count: 8, speed: [100, 220], gravity: 0, life: [0.4, 0.7] });
    this.sorted++;
    if (!this.plan.tap && this.sorted % 3 === 0) {
      this.ctx.pet.cheer();
      void this.ctx.say('praise');
    }
    if (this.sorted === this.plan.items && !this.finished) void this.finale();
  }

  private async finale() {
    this.finished = true;
    for (const b of this.baskets) {
      b.happy();
      sfx.bell(5 + this.baskets.indexOf(b), 0.2);
      await this.ctx.tw.wait(0.15);
    }
    void this.ctx.say('garden.done');
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, 160, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.tw.wait(2);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** The hub's little fruit tree with a basket underneath. */
class TreeIcon extends Container {
  private readonly fruit: Container[] = [];
  private clock = 0;

  constructor() {
    super();
    const tree = new Graphics().roundRect(-18, -150, 36, 150, 10).fill(0x9c6b3c).stroke({ width: 5, color: 0x7a5230 });
    puffs(tree, [[-70, -180, 62], [0, -215, 70], [70, -180, 62]], 0x7cc463, 0x4e9e3a, 5);
    this.addChild(tree);
    (['red', 'yellow', 'purple'] as ColorName[]).forEach((c, i) => {
      const f = prop(FRUIT_FOR[c]!, c);
      f.scale.set(0.45);
      f.position.set([-70, 4, 70][i], [-176, -220, -170][i]);
      this.fruit.push(f);
      this.addChild(f);
    });
    const basket = new Basket('green', 110);
    basket.position.set(96, 4);
    basket.scale.set(0.7);
    this.addChild(basket);
  }

  update(dt: number) {
    this.clock += dt;
    this.fruit.forEach((f, i) => (f.rotation = 0.12 * Math.sin(this.clock * 2 + i * 1.7)));
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const basket = new Basket(rng.pick(RAINBOW), 170);
  basket.update(0);
  const colors = rng.shuffle([...RAINBOW]).slice(0, 3);
  colors.forEach((col, i) => {
    const f = prop(FRUIT_FOR[col]!, col);
    f.scale.set(0.6);
    f.position.set((i - 1) * 46, -10);
    basket.inside.addChild(f);
  });
  c.addChild(basket);
  return c;
}

export const colorGarden: GameModule = {
  id: 'color-garden',
  name: 'Color Garden',
  titleLine: 'game.color-garden',
  region: 'rainbow-meadow',
  skills: ['colors', 'sorting', 'fine-motor'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  entryLevels: [9],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.tap) return 'Tap four fruits: each hops to its own color basket';
    if (p.colors === 1) return 'One basket: practice dragging';
    if (p.rule) return `Sort ${p.items} fruits and balloons by color or by kind, as the sign says`;
    if (p.shades) return `Sort ${p.items} balloons and flowers into light blue and dark blue`;
    return `Sort ${p.items} ${p.fruit ? 'fruits' : p.mixed ? 'fruits, balloons and flowers' : 'balloons and flowers'} into ${p.colors} colors`;
  },
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Say each color with {name}: "red apple, red basket!"',
  offScreen: 'Sort socks or blocks into piles by color together.',
  hubIcon: () => new TreeIcon(),
  sticker,
  create: (ctx) => new ColorGarden(ctx),
};
