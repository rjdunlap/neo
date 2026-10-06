import { Container, Graphics } from 'pixi.js';
import { prop, FRUIT_FOR, type PropKind } from '../../art/props';
import { RAINBOW, swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import type { Game, GameContext, GameModule } from '../types';
import { basketAt, basketWidth, deal, planFor, type GardenPlan } from './logic';

const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 5 },
  preschool: { min: 3, max: 6 },
  prek: { min: 4, max: 6 },
};

const ITEM_SCALE = 0.78;
const BASKET = { fill: 0xd9a066, line: 0x9c6b3c, weave: 0xb9844f };

interface Item {
  view: Container;
  color: ColorName;
  drag: DragHandle;
  wrongs: number;
}

/** A woven basket lined with cloth of its color. Things dropped in stay in. */
class Basket extends Container {
  readonly color: ColorName;
  readonly inside = new Container();
  private readonly glow = new Graphics();
  private readonly body = new Container();
  private bounce = 0;
  private shake = 0;
  private clock = 0;
  glowing = false;

  constructor(
    color: ColorName,
    readonly w: number,
  ) {
    super();
    this.color = color;
    const sw = swatch[color];
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

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.view = ctx.view;
    this.backdrop = ctx.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.62, clouds: 2, sun: true, seed: 44 }, ctx.view),
    );
    const { colors, items } = deal(ctx.rng, this.plan);
    this.baskets = colors.map((c) => ctx.track(new Basket(c, basketWidth(this.plan))));
    ctx.stage.addChild(this.backdrop, this.tree, ...this.baskets, this.layer);

    this.items = items.map((color, i) => {
      const kind: PropKind = this.plan.fruit ? FRUIT_FOR[color]! : i % 2 ? 'balloon' : 'flower';
      const view = prop(kind, color);
      view.scale.set(ITEM_SCALE);
      const item: Item = { view, color, wrongs: 0, drag: null! };
      item.drag = draggable(view, ctx.tw, {
        onPick: () => {
          sfx.tick();
          void ctx.say(`color.${color}`);
        },
        onDrop: (x, y) => this.drop(item, x, y),
      });
      this.layer.addChild(view);
      return item;
    });
  }

  start() {
    void this.ctx.instruct('garden.start');
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
    const waiting = this.items.filter((i) => !i.drag.dragging);
    waiting.forEach((item, i) => {
      const row = Math.floor(i / perRow);
      const xs = spread(Math.min(perRow, waiting.length - row * perRow), cx - canopyW / 2 + 60, cx + canopyW / 2 - 60, 118);
      item.drag.home = { x: xs[i % perRow], y: rows === 1 ? 170 : 120 + row * 110 };
      item.view.position.set(item.drag.home.x, item.drag.home.y);
      // A pale patch behind each spot, so a green pear or flower still stands out from the leaves.
      t.circle(item.drag.home.x, item.drag.home.y, 50).fill({ color: 0xfffbe8, alpha: 0.8 });
    });

    const xs = spread(this.baskets.length, 150, v.w - 40, this.baskets[0].w + 30);
    this.baskets.forEach((b, i) => b.position.set(xs[i], v.h - 26));
  }

  update(dt: number) {
    this.clock += dt;
  }

  destroy() {
    for (const i of this.items) i.drag.destroy();
  }

  private drop(item: Item, x: number, y: number): boolean {
    if (this.finished) return false;
    // Anywhere over a basket (or just above it) counts.
    const basket = basketAt(this.baskets, x, y);
    if (!basket) return false;
    if (basket.color === item.color) {
      void this.place(item, basket);
      return true;
    }
    this.misses++;
    item.wrongs++;
    sfx.boing();
    basket.nope();
    if (this.clock - this.lastNag > 3) {
      this.lastNag = this.clock;
      void this.ctx.say('garden.wrong', { color: item.color });
    }
    if (item.wrongs === 2) {
      this.hints++;
      const right = this.baskets.find((b) => b.color === item.color);
      if (right) {
        right.glowing = true;
        void this.ctx.tw.wait(4).then(() => (right.glowing = false));
      }
    }
    return false;
  }

  /** It drops into the basket and stays there, peeking over the rim. */
  private async place(item: Item, basket: Basket) {
    item.drag.destroy();
    this.items = this.items.filter((i) => i !== item);
    basket.glowing = false;
    const v = item.view;
    const at = basket.inside.toLocal(v.getGlobalPosition());
    basket.inside.addChild(v);
    v.position.set(at.x, at.y);
    const slot = basket.inside.children.length - 1;
    void this.ctx.tw.to(v.scale, { x: 0.5, y: 0.5 }, { duration: 0.25 });
    await this.ctx.tw.to(v, { x: ((slot % 3) - 1) * 28, y: -30 - Math.floor(slot / 3) * 12 }, { duration: 0.25, ease: ease.outQuad });
    basket.happy();
    sfx.bell(4 + this.baskets.indexOf(basket), 0.25);
    this.ctx.particles.burst(basket.x, basket.y - 100, { kind: 'star', colors: [swatch[item.color].fill, 0xffffff], count: 8, speed: [100, 220], gravity: 0, life: [0.4, 0.7] });
    this.sorted++;
    if (this.sorted % 3 === 0) {
      this.ctx.pet.cheer();
      void this.ctx.say('praise');
    }
    if (this.items.length === 0) void this.finale();
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
  bands: ['toddler', 'preschool', 'prek'],
  levels: (band) => LEVELS[band],
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.colors === 1) return 'One basket: practice dragging';
    return `Sort ${p.items} ${p.fruit ? 'fruits' : 'balloons and flowers'} into ${p.colors} colors`;
  },
  music: STYLES.paint,
  coplayHint: 'Say each color with {name}: "red apple, red basket!"',
  offScreen: 'Sort socks or blocks into piles by color together.',
  hubIcon: () => new TreeIcon(),
  sticker,
  create: (ctx) => new ColorGarden(ctx),
};
