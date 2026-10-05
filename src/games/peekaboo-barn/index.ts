import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { RAINBOW, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease, type Tweener } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import type { Game, GameContext, GameModule } from '../types';

type Animal = 'cow' | 'duck' | 'pig' | 'cat' | 'dog' | 'bunny' | 'bear';

const ANIMALS: Record<Animal, { sound: AnimalSound; word: string }> = {
  cow: { sound: 'moo', word: 'Moo' },
  duck: { sound: 'quack', word: 'Quack quack' },
  pig: { sound: 'oink', word: 'Oink oink' },
  cat: { sound: 'meow', word: 'Meow' },
  dog: { sound: 'woof', word: 'Woof woof' },
  bunny: { sound: 'hop', word: 'Hop hop' },
  bear: { sound: 'growl', word: 'Grrr' },
};
const NAMES = Object.keys(ANIMALS) as Animal[];

type CoverKind = 'hay' | 'bush' | 'crate' | 'door';
const COVERS: CoverKind[] = ['hay', 'bush', 'door', 'crate'];

interface Plan {
  /** free: tap to reveal. find: animals peek, "where's the cow?". remember: they show, hide, then the question. */
  mode: 'free' | 'find' | 'remember';
  spots: number;
  /** Reveals (free) or questions (find, remember). */
  goal: number;
}

const PLANS: Plan[] = [
  { mode: 'free', spots: 3, goal: 8 },
  { mode: 'free', spots: 4, goal: 12 },
  { mode: 'find', spots: 2, goal: 5 },
  { mode: 'find', spots: 3, goal: 6 },
  { mode: 'find', spots: 4, goal: 6 },
  { mode: 'remember', spots: 2, goal: 5 },
  { mode: 'remember', spots: 3, goal: 5 },
  { mode: 'remember', spots: 4, goal: 6 },
];

const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 5 },
  preschool: { min: 4, max: 8 },
  prek: { min: 6, max: 8 },
};

const GRASS = 0x9edb86;
const CRITTER_SCALE = 0.55;
/** Where a critter's feet sit, relative to the bottom of its cover. The cover's top is at -150. */
const POSE = { hidden: 90, peek: -82, out: -145 };
type Pose = keyof typeof POSE;

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Something to hide behind, about 230 wide and 150 tall, standing on (0, 0). */
function drawCover(kind: CoverKind, grass = true): Graphics {
  const g = new Graphics();
  switch (kind) {
    case 'hay':
      g.moveTo(-118, 0).bezierCurveTo(-118, -120, -60, -152, 0, -152).bezierCurveTo(60, -152, 118, -120, 118, 0).closePath();
      g.fill(0xf2c94c).stroke(line(0xc99a2e));
      for (const [x, y] of [[-70, -40], [-30, -90], [20, -60], [60, -100], [80, -36], [-10, -124]]) {
        g.moveTo(x, y).lineTo(x + 18, y - 10).stroke(line(0xc99a2e, 4));
      }
      break;
    case 'bush':
      puffs(g, [[-70, -58, 58], [0, -86, 66], [70, -58, 58], [-92, -26, 36], [92, -26, 36], [0, -40, 60]], 0x7cc463, 0x4e9e3a);
      for (const [x, y] of [[-60, -80], [30, -110], [74, -50], [-20, -40]]) g.circle(x, y, 8).fill(swatch.red.fill);
      break;
    case 'crate':
      g.roundRect(-110, -150, 220, 150, 10).fill(wood.fill).stroke(line(wood.line));
      g.moveTo(-100, -100).lineTo(100, -100).moveTo(-100, -50).lineTo(100, -50).stroke(line(wood.line, 4));
      g.moveTo(-96, -140).lineTo(96, -10).stroke(line(wood.line, 5));
      break;
    case 'door':
      g.roundRect(-110, -150, 220, 150, 8).fill(0xd9534f).stroke(line(0x9e2f2c));
      g.roundRect(-96, -136, 192, 122, 6).stroke(line(0xffffff, 6));
      g.moveTo(-96, -136).lineTo(96, -14).moveTo(96, -136).lineTo(-96, -14).stroke(line(0xffffff, 6));
      break;
  }
  // A strip of grass in front hides anything tucked down below.
  return grass ? g.roundRect(-130, -6, 260, 120, 20).fill(GRASS) : g;
}

/** A hiding place: an animal tucked behind a cover, which can peek over the top or pop all the way out. */
class Spot extends Container {
  animal: Animal = 'cow';
  pose: Pose = 'hidden';
  hint = false;
  private critter: Critter | null = null;
  private readonly holder = new Container();
  private readonly cover: Graphics;
  private shake = 0;
  private clock = Math.random() * 3;

  constructor(
    kind: CoverKind,
    private readonly tw: Tweener,
  ) {
    super();
    this.cover = drawCover(kind);
    this.addChild(this.holder, this.cover);
    this.hitArea = new Rectangle(-130, -340, 260, 350);
  }

  /** Puts a new animal behind the cover (it starts hidden). */
  setAnimal(animal: Animal) {
    this.critter?.destroy({ children: true });
    this.animal = animal;
    this.critter = new Critter(CRITTERS[animal]);
    this.critter.scale.set(CRITTER_SCALE);
    this.critter.y = POSE.hidden;
    this.pose = 'hidden';
    this.holder.addChild(this.critter);
  }

  async go(pose: Pose) {
    const c = this.critter;
    if (!c) return;
    this.pose = pose;
    this.tw.kill(c);
    if (pose === 'out') {
      c.poke();
      await this.tw.to(c, { y: POSE.out }, { duration: 0.35, ease: ease.outBack });
      c.cheer();
    } else {
      await this.tw.to(c, { y: POSE[pose] }, { duration: pose === 'hidden' ? 0.3 : 0.45, ease: pose === 'hidden' ? ease.inQuad : ease.outCubic });
    }
  }

  wiggle() {
    this.shake = 1;
  }

  update(dt: number) {
    this.clock += dt;
    this.critter?.update(dt);
    if (this.hint && this.shake <= 0 && Math.sin(this.clock * 2.5) > 0.98) this.shake = 1;
    this.shake = Math.max(0, this.shake - dt * 2);
    this.cover.rotation = 0.06 * Math.sin(this.shake * 25) * this.shake;
  }
}

class PeekabooBarn implements Game {
  private readonly plan: Plan;
  private readonly backdrop: Backdrop;
  private readonly barn = new Graphics();
  private readonly spots: Spot[];
  private view: View;
  private done = 0;
  private misses = 0;
  private hints = 0;
  private missesThisQuestion = 0;
  private target: Animal | null = null;
  private busy = true;
  private finished = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = PLANS[Math.min(PLANS.length, Math.max(1, ctx.level)) - 1];
    this.view = ctx.view;
    this.backdrop = ctx.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, GRASS], horizon: 0.56, clouds: 3, sun: true, seed: 21 }, ctx.view),
    );
    const covers = ctx.rng.shuffle([...COVERS]).slice(0, this.plan.spots);
    this.spots = covers.map((kind) => {
      const s = ctx.track(new Spot(kind, ctx.tw));
      onTap(s, () => void this.tapped(s), { cooldown: 250 });
      return s;
    });
    ctx.stage.addChild(this.backdrop, this.barn, ...this.spots);
  }

  start() {
    if (this.plan.mode === 'free') {
      this.dealAnimals();
      this.busy = false;
      void this.ctx.instruct('peek.free');
    } else {
      void this.question();
    }
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const cx = v.w / 2;
    const gap = this.plan.spots === 4 ? 232 : 260;
    this.spots.forEach((s, i) => s.position.set(cx + (i - (this.plan.spots - 1) / 2) * gap, v.h - 40));
    this.drawBarn(cx, this.backdrop.groundY + 30);
  }

  update() {}

  destroy() {}

  /** Different animals in each spot. */
  private dealAnimals() {
    const picks = this.ctx.rng.shuffle([...NAMES]);
    this.spots.forEach((s, i) => s.setAnimal(picks[i]));
  }

  private say(animal: Animal) {
    sfx.animal(ANIMALS[animal].sound);
  }

  private async tapped(spot: Spot) {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'free') return this.freeTap(spot);
    if (spot.pose === 'out') return;

    if (spot.animal === this.target) {
      this.busy = true;
      this.spots.forEach((s) => (s.hint = false));
      void spot.go('out');
      this.say(spot.animal);
      this.ctx.pet.cheer();
      this.done++;
      await this.ctx.say('peek.yes', { animal: spot.animal });
      await this.ctx.tw.wait(0.6);
      await Promise.all(this.spots.map((s) => s.go('hidden')));
      await this.ctx.tw.wait(0.3);
      if (this.done >= this.plan.goal) void this.finale();
      else void this.question();
      return;
    }

    // Not that one: it says hello anyway, then hides again.
    this.busy = true;
    this.misses++;
    this.missesThisQuestion++;
    const back: Pose = this.plan.mode === 'find' ? 'peek' : 'hidden';
    void spot.go('out');
    this.say(spot.animal);
    await this.ctx.say('peek.notit', { other: spot.animal, animal: this.target! });
    await spot.go(back);
    if (this.missesThisQuestion === 2) {
      this.hints++;
      const right = this.spots.find((s) => s.animal === this.target);
      if (right) {
        right.hint = true;
        right.wiggle();
      }
    }
    this.busy = false;
  }

  private async freeTap(spot: Spot) {
    if (spot.pose === 'out') {
      this.say(spot.animal);
      return;
    }
    const animal = spot.animal;
    void spot.go('out');
    this.say(animal);
    void this.ctx.say('peek.found', { word: ANIMALS[animal].word, animal });
    this.done++;
    if (this.done % 4 === 0) this.ctx.pet.cheer();
    if (this.done >= this.plan.goal) {
      this.busy = true;
      await this.ctx.tw.wait(1.4);
      void this.finale();
      return;
    }
    await this.ctx.tw.wait(2.4);
    if (this.finished) return;
    await spot.go('hidden');
    // Someone new sneaks in, never the same as a neighbour.
    const taken = this.spots.map((s) => s.animal);
    spot.setAnimal(this.ctx.rng.pick(NAMES.filter((n) => !taken.includes(n))));
  }

  private async question() {
    this.busy = true;
    this.missesThisQuestion = 0;
    this.dealAnimals();
    const present = this.spots.map((s) => s.animal);
    this.target = this.ctx.rng.pick(present);
    if (this.plan.mode === 'find') {
      // Everyone peeks over the top, so there's something to look at.
      for (const s of this.spots) {
        void s.go('peek');
        await this.ctx.tw.wait(0.15);
      }
    } else {
      // Show and tell, then everyone hides.
      void this.ctx.say('peek.look');
      for (const s of this.spots) {
        void s.go('out');
        this.say(s.animal);
        await this.ctx.tw.wait(0.7);
      }
      await this.ctx.tw.wait(1.4);
      await Promise.all(this.spots.map((s) => s.go('hidden')));
    }
    await this.ctx.tw.wait(0.3);
    await this.ctx.instruct('peek.where', { animal: this.target });
    this.busy = false;
  }

  /** Everybody out for a bow. */
  private async finale() {
    this.finished = true;
    this.dealAnimals();
    for (const s of this.spots) {
      void s.go('out');
      this.say(s.animal);
      await this.ctx.tw.wait(0.3);
    }
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    await this.ctx.tw.wait(1.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private drawBarn(cx: number, y: number) {
    const red = 0xd9534f;
    const dark = 0x9e2f2c;
    this.barn
      .clear()
      .poly([cx - 170, y - 170, cx, y - 290, cx + 170, y - 170])
      .fill(dark)
      .stroke(line(0x7a2422))
      .rect(cx - 150, y - 175, 300, 175)
      .fill(red)
      .stroke(line(dark))
      .roundRect(cx - 60, y - 120, 120, 120, 6)
      .fill(0x6b2b2a)
      .stroke(line(0xffffff, 6))
      .circle(cx, y - 220, 24)
      .fill(0xfff1c1)
      .stroke(line(0xffffff, 6));
  }
}

/** The hub's barn, with someone popping up from behind the haystack now and then. */
class BarnIcon extends Container {
  private readonly peeker = new Container();
  private critter: Critter;
  private clock = 0;
  private next = 1.5;
  private turn = 0;

  constructor() {
    super();
    const red = 0xd9534f;
    const barn = new Graphics()
      .poly([-130, -150, -40, -230, 50, -150])
      .fill(0x9e2f2c)
      .stroke(line(0x7a2422))
      .rect(-118, -155, 156, 155)
      .fill(red)
      .stroke(line(0x9e2f2c))
      .roundRect(-78, -100, 76, 100, 6)
      .fill(0x6b2b2a)
      .stroke(line(0xffffff, 5));
    this.critter = new Critter(CRITTERS.cow);
    this.critter.scale.set(0.34);
    this.peeker.addChild(this.critter);
    this.peeker.position.set(78, 60);
    const hay = new Graphics()
      .moveTo(10, 0)
      .bezierCurveTo(10, -70, 40, -92, 78, -92)
      .bezierCurveTo(116, -92, 146, -70, 146, 0)
      .closePath()
      .fill(0xf2c94c)
      .stroke(line(0xc99a2e, 5))
      .roundRect(0, -4, 160, 76, 10)
      .fill(GRASS);
    this.addChild(barn, this.peeker, hay);
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    this.next -= dt;
    if (this.next <= 0) {
      this.next = 3;
      this.turn++;
      const who = NAMES[this.turn % NAMES.length];
      this.critter.destroy({ children: true });
      this.critter = new Critter(CRITTERS[who]);
      this.critter.scale.set(0.34);
      this.peeker.addChild(this.critter);
      this.critter.cheer();
    }
    // Up for a second and a half, then down again.
    const t = 3 - this.next;
    const up = t < 0.3 ? t / 0.3 : t < 1.8 ? 1 : t < 2.1 ? 1 - (t - 1.8) / 0.3 : 0;
    this.peeker.y = 60 - up * 140;
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const who = new Critter(CRITTERS[rng.pick(NAMES)]);
  who.alive = false;
  who.scale.set(CRITTER_SCALE);
  who.y = POSE.peek;
  c.addChild(who, drawCover(rng.pick(['hay', 'bush', 'door'] as CoverKind[]), false));
  return c;
}

export const peekabooBarn: GameModule = {
  id: 'peekaboo-barn',
  name: 'Peekaboo Barn',
  titleLine: 'game.peekaboo-barn',
  region: 'barnyard',
  skills: ['object-permanence', 'animal-words', 'memory'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => LEVELS[band],
  describeLevel: (level) => {
    const p = PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];
    if (p.mode === 'free') return `Tap to find who's hiding, ${p.spots} hiding places`;
    if (p.mode === 'find') return `"Where's the cow?" with ${p.spots} animals peeking`;
    return `Remember who hid where, ${p.spots} hiding places`;
  },
  music: STYLES.hub,
  coplayHint: 'Make the animal sounds together: "Moo!" Then say its name.',
  offScreen: 'Play peekaboo with stuffed animals under a blanket. Ask "Where did the cow go?"',
  hubIcon: () => new BarnIcon(),
  sticker,
  create: (ctx) => new PeekabooBarn(ctx),
};
