import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { flower, puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { BEDS, makeRequests, matches, packetsFor, planFor, total, type GardenPlan, type Request } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 4 },
  preschool: { min: 3, max: 5 },
};

/** A smiling flower on a stem; its stem grows from the soil, then the head pops open. */
class Bloom extends Container {
  readonly stem = new Graphics();
  readonly head = new Container();
  constructor(readonly color: ColorName) {
    super();
    this.stem.moveTo(0, 0).lineTo(0, -130).stroke({ width: 8, color: swatch.green.line, cap: 'round' }).ellipse(16, -50, 18, 8).ellipse(-16, -80, 18, 8).fill(swatch.green.fill);
    const sw = swatch[color];
    const face = flower(new Graphics(), 42, sw.fill, sw.line);
    face.circle(-7, -3, 3).circle(7, -3, 3).fill(ink);
    face.moveTo(-7, 6).quadraticCurveTo(0, 12, 7, 6).stroke({ width: 3, color: ink, cap: 'round' });
    this.head.addChild(face);
    this.head.y = -140;
    this.addChild(this.stem, this.head);
  }
  async grow(tw: GameContext['tw']) {
    this.stem.scale.set(1, 0);
    this.head.scale.set(0);
    await tw.to(this.stem.scale, { y: 1 }, { duration: 0.5, ease: ease.outQuad });
    await tw.to(this.head.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }
}

interface Bed {
  node: Container;
  seed: ColorName | null;
  bloom: Bloom | null;
  seedArt: Container | null;
}

class GardenGrow implements Game {
  readonly plan: GardenPlan;
  readonly requests: Request[];
  readonly beds: Bed[] = [];
  readonly packets: { color: ColorName; node: Container }[] = [];
  readonly cloud = new Container();
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly glow = new Graphics();
  private readonly packetLayer = new Container();
  /** What was asked, in pictures: one little flower per seed wanted. */
  readonly sign = new Container();
  private view: View;
  private wrongs = 0;
  private glowColor: ColorName | null = null;
  private glowBeds = 0;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.requests = makeRequests(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 1, sun: true, seed: 37 }, ctx.view);
    const c = puffs(new Graphics(), [[-60, 10, 40], [0, -10, 55], [60, 10, 40], [-30, 30, 35], [30, 30, 35]], 0xffffff, 0xc9d6e6, 6);
    c.circle(-18, 6, 5).circle(18, 6, 5).fill(ink);
    c.moveTo(-10, 20).quadraticCurveTo(0, 28, 10, 20).stroke({ width: 4, color: ink, cap: 'round' });
    this.cloud.addChild(c);
    this.cloud.hitArea = new Rectangle(-110, -70, 220, 140);
    onTap(this.cloud, () => void this.rain(), { cooldown: 600 });
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.cloud, this.sign, this.packetLayer, this.glow);
    for (let i = 0; i < BEDS; i++) {
      const node = new Container();
      node.addChild(new Graphics().ellipse(0, 6, 56, 22).fill(wood.line).ellipse(0, 0, 50, 18).fill(0x8a5a36));
      node.hitArea = new Rectangle(-62, -200, 124, 240);
      const bed: Bed = { node, seed: null, bloom: null, seedArt: null };
      onTap(node, () => void this.tapBed(bed), { cooldown: 250 });
      this.beds.push(bed);
      ctx.stage.addChild(node);
    }
  }

  get request() {
    return this.requests[this.index];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const xs = spread(BEDS, 170, v.w - 60, 140);
    this.beds.forEach((b, i) => b.node.position.set(xs[i], v.h * 0.7));
    this.cloud.position.set(v.w / 2 + 60, 150);
    this.sign.position.set(v.w - 190, 300);
    const ps = spread(this.packets.length, 220, v.w - 120, 160);
    this.packets.forEach((p, i) => p.node.position.set(ps[i], v.h - 75));
  }

  update(dt: number) {
    this.clock += dt;
    this.cloud.x += Math.sin(this.clock * 0.6) * 0.2;
    for (const b of this.beds) if (b.bloom) b.bloom.head.rotation = 0.08 * Math.sin(this.clock * 2 + b.node.x);
    const g = this.glow.clear();
    if (this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 6);
    if (this.glowBeds && this.sign.children.length) {
      const b = this.sign.getLocalBounds();
      g.roundRect(this.sign.x + b.x - 8, this.sign.y + b.y - 8, b.width + 16, b.height + 16, 22).stroke({ width: pulse, color: swatch.yellow.fill });
    }
    if (this.glowColor) {
      const p = this.packets.find((x) => x.color === this.glowColor);
      if (p) g.roundRect(p.node.x - 66, p.node.y - 72, 132, 144, 24).stroke({ width: pulse, color: swatch.yellow.fill });
    }
    // Rings on the beds still to plant.
    const empty = this.beds.filter((b) => !b.seed);
    const planted = this.beds.length - empty.length;
    empty.slice(0, Math.max(0, this.glowBeds - planted)).forEach((b) => g.ellipse(b.node.x, b.node.y, 66, 28).stroke({ width: pulse, color: swatch.yellow.fill }));
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.glowColor = null;
    this.glowBeds = 0;
    const free = this.plan.mode === 'plant' || this.plan.mode === 'water';
    if (free) {
      this.busy = false;
      return this.ctx.instruct(this.plan.mode === 'plant' ? 'grow.plant' : 'grow.water');
    }
    if (this.index >= this.requests.length) return void this.finale();
    // Pick the last request's flowers for a bunch, so every bed is free again.
    if (this.index > 0) await this.pick();
    this.buildPackets();
    this.buildSign();
    this.busy = false;
    const r = this.request;
    const [a, b] = Object.entries(r.want) as [ColorName, number][];
    if (this.plan.mode === 'color') return this.ctx.instruct('grow.color', { color: a[0] });
    if (this.plan.mode === 'count') return this.ctx.instruct('grow.count', { n: a[1], color: a[0] });
    return this.ctx.instruct('grow.mix', { n: a[1], a: a[0], m: b[1], b: b[0] });
  }

  private buildSign() {
    this.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    const want = (Object.entries(this.request.want) as [ColorName, number][]).flatMap(([c, n]) => Array(n).fill(c) as ColorName[]);
    const w = want.length * 46 + 30;
    this.sign.addChild(new Graphics().roundRect(-w / 2, -40, w, 80, 18).fill(0xfff8ec).stroke({ width: 5, color: wood.line }).rect(-6, 40, 12, 60).fill(wood.fill));
    want.forEach((c, i) => {
      const f = flower(new Graphics(), 18, swatch[c].fill, swatch[c].line);
      f.x = -w / 2 + 38 + i * 46;
      this.sign.addChild(f);
    });
  }

  private buildPackets() {
    this.packetLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.packets.length = 0;
    for (const color of packetsFor(this.plan, this.request, this.ctx.rng)) {
      const node = new Container();
      const sw = swatch[color];
      node.addChild(new Graphics().roundRect(-54, -62, 108, 124, 16).fill(0xfff8ec).stroke({ width: 5, color: wood.line }));
      const f = flower(new Graphics(), 30, sw.fill, sw.line);
      f.y = -8;
      node.addChild(f, new Graphics().ellipse(0, 40, 30, 10).fill(0x8a5a36));
      node.hitArea = new Rectangle(-60, -68, 120, 136);
      onTap(node, () => void this.tapPacket(color, node), { cooldown: 250 });
      this.packets.push({ color, node });
      this.packetLayer.addChild(node);
    }
    this.resize(this.view);
  }

  private plantIn(bed: Bed, color: ColorName) {
    bed.seed = color;
    // A seed with a little marker stick in its color, so you can see what was planted.
    const s = new Container();
    s.addChild(new Graphics().ellipse(0, -8, 9, 12).fill(wood.fill).stroke({ width: 3, color: wood.line }).moveTo(30, 4).lineTo(30, -40).stroke({ width: 4, color: wood.line, cap: 'round' }));
    const tag = flower(new Graphics(), 15, swatch[color].fill, swatch[color].line);
    tag.position.set(30, -50);
    s.addChild(tag);
    bed.seedArt = s;
    bed.node.addChild(s);
    sfx.pop(5);
  }

  private async growBed(bed: Bed) {
    bed.seedArt?.destroy({ children: true });
    bed.seedArt = null;
    const bloom = new Bloom(bed.seed!);
    bed.bloom = bloom;
    bed.node.addChild(bloom);
    await bloom.grow(this.ctx.tw);
    sfx.bell(4 + this.beds.indexOf(bed), 0.25);
  }

  private async tapBed(bed: Bed) {
    if (this.finished) return;
    // A grown flower sings, at any time.
    if (bed.bloom) {
      sfx.marimba(3 + this.beds.indexOf(bed));
      void this.ctx.tw.to(bed.bloom.head.scale, { x: 1.2, y: 1.2 }, { duration: 0.12 }).then(() => this.ctx.tw.to(bed.bloom!.head.scale, { x: 1, y: 1 }, { duration: 0.2 }));
      return;
    }
    if (this.busy) return;
    const mode = this.plan.mode;
    if (mode === 'plant' || mode === 'water') {
      if (bed.seed) return;
      this.plantIn(bed, this.ctx.rng.pick(['red', 'yellow', 'pink', 'purple', 'orange', 'blue'] as ColorName[]));
      if (mode === 'plant') {
        this.busy = true;
        this.drops(bed.node.x);
        await this.growBed(bed);
        this.busy = false;
        await this.checkFull();
      }
      return;
    }
    // Counting levels: tap a planted seed to take it back out.
    if (bed.seed && (mode === 'count' || mode === 'mix')) {
      bed.seed = null;
      bed.seedArt?.destroy({ children: true });
      bed.seedArt = null;
      sfx.pop(3);
    }
  }

  private async tapPacket(color: ColorName, node: Container) {
    if (this.busy || this.finished) return;
    const bed = this.beds.find((b) => !b.seed);
    if (!bed) {
      sfx.boing();
      return;
    }
    if (this.plan.mode === 'color') {
      const want = Object.keys(this.request.want)[0] as ColorName;
      if (color !== want) {
        this.busy = true;
        this.misses++;
        this.wrongs++;
        sfx.boing();
        void this.ctx.tw.to(node, { rotation: 0.12 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.2, ease: ease.outBack }));
        await this.ctx.say('grow.notthat', { color, want });
        if (this.wrongs >= 2 && !this.glowColor) {
          this.hints++;
          this.glowColor = want;
        }
        this.busy = false;
        return;
      }
      this.busy = true;
      this.plantIn(bed, color);
      this.drops(bed.node.x);
      await this.growBed(bed);
      await this.done();
      return;
    }
    // Counting levels: plant now, rain later; count each seed aloud.
    this.plantIn(bed, color);
    void this.ctx.say('count', { n: this.beds.filter((b) => b.seed && !b.bloom).length });
  }

  private drops(x: number) {
    this.ctx.particles.burst(x, this.cloud.y + 40, { kind: 'dot', colors: [swatch.blue.fill, swatch.blue.light], count: 14, speed: [250, 420], angle: Math.PI / 2, spread: 0.25, gravity: 500, life: [0.5, 0.8] });
    sfx.splash();
  }

  /** Tap the cloud: rain on every bed with a seed. */
  private async rain() {
    if (this.busy || this.finished) return;
    const mode = this.plan.mode;
    if (mode === 'plant' || mode === 'color') {
      this.drops(this.cloud.x);
      return;
    }
    const seeded = this.beds.filter((b) => b.seed && !b.bloom);
    for (const b of this.beds) this.drops(b.node.x);
    if (!seeded.length) return;
    if (mode === 'water') {
      this.busy = true;
      await Promise.all(seeded.map((b) => this.growBed(b)));
      this.busy = false;
      return void this.checkFull();
    }
    const planted = seeded.map((b) => b.seed!);
    if (matches(this.request, planted)) {
      this.busy = true;
      await Promise.all(seeded.map((b) => this.growBed(b)));
      return void this.done();
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const need = total(this.request);
    await this.ctx.say(planted.length < need ? 'grow.fewer' : planted.length > need ? 'grow.more' : 'grow.colors', { n: planted.length, m: need });
    if (this.wrongs >= 2 && !this.glowBeds) {
      this.hints++;
      this.glowBeds = need;
    }
    this.busy = false;
  }

  private async checkFull() {
    if (this.beds.every((b) => b.bloom)) {
      this.busy = true;
      await this.ctx.tw.wait(0.4);
      return void this.finale();
    }
  }

  private async done() {
    this.busy = true;
    this.glowColor = null;
    this.glowBeds = 0;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('grow.yay');
    await this.ctx.tw.wait(0.3);
    await this.next();
  }

  /** The flowers go into a bunch; seeds left over are cleared. */
  private async pick() {
    const fade = this.beds.map((b) => (b.bloom ? this.ctx.tw.to(b.bloom, { alpha: 0, y: -40 }, { duration: 0.35 }) : Promise.resolve()));
    await Promise.all(fade);
    for (const b of this.beds) {
      b.bloom?.destroy({ children: true });
      b.seedArt?.destroy({ children: true });
      b.bloom = null;
      b.seedArt = null;
      b.seed = null;
    }
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    for (const b of this.beds) if (b.bloom) void this.ctx.tw.to(b.bloom.head.scale, { x: 1.25, y: 1.25 }, { duration: 0.3, ease: ease.outBack });
    await this.ctx.say('grow.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class GardenIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().ellipse(0, -16, 110, 26).fill(0x8a5a36));
    (['red', 'yellow', 'pink'] as ColorName[]).forEach((color, i) => {
      const b = new Bloom(color);
      b.scale.set(0.6);
      b.position.set(-60 + i * 60, -20);
      c.addChild(b);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const b = new Bloom(rng.pick(['red', 'yellow', 'pink', 'purple', 'orange', 'blue'] as ColorName[]));
  b.position.set(0, 90);
  c.addChild(b);
  return c;
}

export const gardenGrow: GameModule = {
  id: 'garden-grow',
  name: 'Garden Grow',
  titleLine: 'game.garden-grow',
  region: 'rainbow-meadow',
  skills: ['cause-and-effect', 'colors', 'counting', 'living-things'],
  bands: ['lap', 'toddler', 'preschool'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Say it together: "Plant the seed... rain, rain... it grows!" and wiggle up like a flower.',
  offScreen: 'Plant a bean in a cup and water it together; look at it each morning.',
  hubIcon: () => new GardenIcon(),
  sticker,
  create: (ctx) => new GardenGrow(ctx),
};
