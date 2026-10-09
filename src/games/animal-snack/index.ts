import { Circle, Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { entryId } from '../../content/journal';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { symbol, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { eaterOf, FAVORITE, makeRounds, planFor, snackTouch, type Food, type SnackPlan, type SnackRound } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 4 },
  preschool: { min: 3, max: 5 },
};

const VOICE: Partial<Record<CritterName, AnimalSound>> = { cow: 'moo', bunny: 'hop', dog: 'woof', cat: 'meow', duck: 'quack', pig: 'oink', bear: 'growl' };
const ANIMAL_WORDS: Partial<Record<CritterName, string>> = { cow: 'cow', bunny: 'bunny', dog: 'dog', cat: 'cat', duck: 'duck', pig: 'pig', bear: 'bear' };
const FOOD_WORDS: Record<Food, string> = { hay: 'hay', carrot: 'carrot', bone: 'bone', fish: 'fish', seeds: 'seeds', apple: 'apple', honey: 'honey' };

function foodArt(food: Food): Container {
  const c = new Container();
  const g = new Graphics();
  const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });
  switch (food) {
    case 'hay':
      g.roundRect(-34, -24, 68, 48, 10).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      for (const y of [-12, 0, 12]) g.moveTo(-28, y).lineTo(28, y + 3).stroke(line(swatch.yellow.line, 3));
      g.rect(-4, -24, 8, 48).fill(swatch.red.fill);
      break;
    case 'carrot':
      g.poly([-12, -18, 12, -18, 0, 34]).fill(swatch.orange.fill).stroke(line(swatch.orange.line));
      g.ellipse(-8, -28, 6, 14).ellipse(8, -28, 6, 14).fill(swatch.green.fill);
      break;
    case 'bone':
      g.roundRect(-26, -7, 52, 14, 7).fill(0xffffff).stroke(line(swatch.white.line));
      for (const x of [-28, 28]) for (const y of [-8, 8]) g.circle(x, y, 10).fill(0xffffff).stroke(line(swatch.white.line));
      break;
    case 'fish':
      g.poly([18, 0, 36, -14, 36, 14]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.ellipse(0, 0, 26, 15).fill(swatch.blue.fill).stroke(line(swatch.blue.line)).circle(-12, -3, 3.5).fill(ink);
      break;
    case 'seeds':
      g.ellipse(0, 14, 34, 12).fill(wood.light);
      for (const [x, y] of [[-16, 8], [-4, 2], [10, 8], [20, 14], [-10, 16], [4, 14], [0, -4], [-20, 16]]) g.ellipse(x, y, 5, 3).fill(wood.line);
      break;
    case 'apple':
      c.addChild(prop('apple', 'red'));
      return c;
    case 'honey':
      g.roundRect(-26, -18, 52, 46, 14).fill(swatch.yellow.fill).stroke(line(swatch.orange.line));
      g.rect(-28, -26, 56, 12).fill(wood.fill).stroke(line(wood.line, 3));
      g.moveTo(-26, -4).quadraticCurveTo(-18, 8, -10, -4).stroke(line(swatch.orange.fill, 6));
      break;
  }
  c.addChild(g);
  return c;
}

interface Friend {
  name: CritterName;
  node: Critter;
}

interface SnackItem {
  food: Food;
  node: Container;
  drag?: DragHandle;
  eaten: boolean;
}

class AnimalSnack implements Game {
  readonly plan: SnackPlan;
  readonly rounds: SnackRound[];
  readonly friends: Friend[] = [];
  readonly snacks: SnackItem[] = [];
  readonly bell: RoundButton;
  index = -1;
  /** 'munch' and 'float': snacks eaten so far. */
  eatenCount = 0;
  /** Animals she has seen eat their favorite food this round: the discoveries for her journal. */
  private readonly fed = new Set<CritterName>();
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly blanket = new Graphics();
  private readonly bubble = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Container | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = makeRounds(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 2, sun: true, seed: 73 }, ctx.view);
    this.glow.eventMode = 'none';
    this.bubble.eventMode = 'none';
    this.bell = new RoundButton(symbol('bell', 0, 34), swatch.yellow, 56, () => void this.ring());
    this.bell.visible = this.plan.mode === 'count';
    ctx.stage.addChild(this.backdrop, this.blanket, this.bubble, this.glow, this.bell);
  }

  get round() {
    return this.rounds[Math.min(this.index, this.rounds.length - 1)];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const xs = spread(this.friends.length, 200, v.w - 60, 270);
    this.friends.forEach((f, i) => f.node.position.set(xs[i], v.h * 0.64));
    this.blanket.clear().roundRect(170, v.h - 150, v.w - 220, 130, 26).fill(swatch.red.light).stroke({ width: 5, color: swatch.red.fill });
    const loose = this.snacks.filter((s) => !s.eaten);
    const fx = spread(loose.length, 220, v.w - 80, 140);
    loose.forEach((s, i) => {
      if (s.drag?.dragging) return;
      s.node.position.set(fx[i], v.h - 85);
      if (s.drag) s.drag.home = { x: fx[i], y: v.h - 85 };
    });
    this.bubble.position.set(v.w / 2, 120);
    this.bell.position.set(v.w - 80, 110);
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) {
      const b = this.glowing.getBounds();
      g.roundRect(b.x - 12, b.y - 12, b.width + 24, b.height + 24, 30).stroke({ width: 6 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
    }
  }

  /** The ghost finger: tap the animals or snacks, carry a snack to the animal that eats it, count out the number asked for and ring the bell. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.index < 0) return null;
    const move = snackTouch(this.plan, {
      friends: this.friends.map((f) => f.name),
      snacks: this.snacks.map((s) => ({ food: s.food, eaten: s.eaten })),
      ask: this.round.ask,
      n: this.round.n,
      eatenCount: this.eatenCount,
    });
    if (!move) return null;
    if (move === 'bell') return { tap: { on: this.bell } };
    // An animal's body is the middle of its tap area, and a snack dropped there lands within reach of its mouth.
    if ('friend' in move) return { tap: { on: this.friends[move.friend].node, y: -125 } };
    if ('snack' in move) return { tap: { on: this.snacks[move.snack].node } };
    return { drag: { on: this.snacks[move.give].node }, to: { on: this.friends[move.to].node, y: -200 } };
  }

  destroy() {
    for (const s of this.snacks) s.drag?.destroy();
  }

  private mouth(f: Friend) {
    return { x: f.node.x, y: f.node.y - 150 * f.node.scale.y };
  }

  private setFriends(names: CritterName[]) {
    for (const f of this.friends.splice(0)) {
      this.ctx.untrack(f.node);
      f.node.destroy({ children: true });
    }
    for (const name of names) {
      const node = new Critter(CRITTERS[name]);
      node.scale.set(0.6);
      node.hitArea = new Circle(0, -125, 190);
      const f: Friend = { name, node };
      onTap(node, () => void this.tapFriend(f), { cooldown: 350 });
      this.ctx.track(node);
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.blanket));
      this.friends.push(f);
    }
    // Animals made after the shell's resize (every round) would otherwise wait at the corner for a snack tray to place them.
    this.resize(this.view);
  }

  /** Snacks on the blanket: tappable on the float and count levels, draggable for matching. */
  private setSnacks(foods: Food[]) {
    for (const s of this.snacks.splice(0)) {
      s.drag?.destroy();
      s.node.destroy({ children: true });
    }
    for (const food of foods) {
      const node = foodArt(food);
      node.scale.set(1.2);
      node.hitArea = new Circle(0, 0, 55);
      const item: SnackItem = { food, node, eaten: false };
      if (this.plan.mode === 'match') item.drag = draggable(node, this.ctx.tw, { onPick: () => sfx.tick(), onDrop: (x, y) => this.drop(item, x, y) });
      else onTap(node, () => void this.tapSnack(item), { cooldown: 300 });
      this.snacks.push(item);
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.glowing = null;
    const mode = this.plan.mode;
    if (mode === 'munch' || mode === 'float' || mode === 'match') {
      if (this.index > 0) return void this.finale();
      this.setFriends(this.round.animals);
      if (mode !== 'munch') this.refill();
      this.busy = false;
      return this.ctx.instruct(mode === 'munch' ? 'snack.munch' : mode === 'float' ? 'snack.float' : 'snack.match');
    }
    if (this.index >= this.rounds.length) return void this.finale();
    const r = this.round;
    this.setFriends(r.animals);
    const food = FAVORITE[r.ask!]!;
    if (mode === 'count') this.setSnacks(Array<Food>(5).fill(food));
    else this.setSnacks([]);
    this.showBubble(food);
    this.busy = false;
    if (mode === 'who') return this.ctx.instruct('snack.who', { food: FOOD_WORDS[food] });
    return this.ctx.instruct('snack.count', { animal: ANIMAL_WORDS[r.ask!]!, n: r.n!, food: FOOD_WORDS[food] });
  }

  /** One snack for each animal, shuffled, for floating and matching. */
  private refill() {
    this.setSnacks(this.ctx.rng.shuffle(this.friends.map((f) => FAVORITE[f.name]!)));
  }

  private showBubble(food: Food) {
    this.bubble.removeChildren().forEach((c) => c.destroy({ children: true }));
    const g = new Graphics().roundRect(-80, -60, 160, 120, 40).fill(0xffffff).stroke({ width: 5, color: swatch.white.line });
    const art = foodArt(food);
    art.scale.set(1.4);
    this.bubble.addChild(g, art);
  }

  private async eat(f: Friend, node: Container) {
    this.fed.add(f.name);
    const m = this.mouth(f);
    this.ctx.tw.kill(node);
    await this.ctx.tw.to(node, { x: m.x, y: m.y }, { duration: 0.35, ease: ease.inOutSine });
    await this.ctx.tw.to(node.scale, { x: 0.2, y: 0.2 }, { duration: 0.15 });
    node.visible = false;
    sfx.munch();
    const voice = VOICE[f.name];
    if (voice) sfx.animal(voice);
    f.node.cheer();
    this.ctx.particles.burst(m.x, m.y, { colors: [wood.fill, swatch.yellow.light], count: 6, speed: [80, 180], gravity: 500, size: [0.25, 0.4] });
  }

  private async tapFriend(f: Friend) {
    if (this.busy || this.finished) return;
    const mode = this.plan.mode;
    if (mode === 'munch') {
      this.busy = true;
      const node = foodArt(FAVORITE[f.name]!);
      const m = this.mouth(f);
      node.position.set(m.x, m.y - 80);
      node.eventMode = 'none';
      this.ctx.stage.addChild(node);
      await this.eat(f, node);
      node.destroy({ children: true });
      void this.ctx.say('snack.yum', { animal: ANIMAL_WORDS[f.name]!, food: FOOD_WORDS[FAVORITE[f.name]!] });
      this.eatenCount++;
      this.busy = false;
      if (this.eatenCount >= this.plan.rounds) void this.finale();
      return;
    }
    if (mode !== 'who') {
      f.node.poke();
      const voice = VOICE[f.name];
      if (voice) sfx.animal(voice);
      return;
    }
    const want = this.round.ask!;
    if (f.name === want) {
      this.busy = true;
      this.glowing = null;
      const node = foodArt(FAVORITE[want]!);
      node.position.set(this.bubble.x, this.bubble.y);
      node.eventMode = 'none';
      this.ctx.stage.addChild(node);
      this.bubble.removeChildren().forEach((c) => c.destroy({ children: true }));
      await this.eat(f, node);
      node.destroy({ children: true });
      await this.ctx.say('snack.yum', { animal: ANIMAL_WORDS[f.name]!, food: FOOD_WORDS[FAVORITE[f.name]!] });
      return void this.next();
    }
    this.miss(f, FAVORITE[want]!);
  }

  /** A wrong animal shakes its head and says what it eats instead. */
  private miss(f: Friend, food: Food) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    f.node.setMood('surprised', 1);
    void this.ctx.tw.to(f.node, { rotation: 0.08 }, { duration: 0.1 }).then(() => this.ctx.tw.to(f.node, { rotation: -0.08 }, { duration: 0.15 })).then(() => this.ctx.tw.to(f.node, { rotation: 0 }, { duration: 0.1 }));
    void this.ctx.say('snack.nothanks', { animal: ANIMAL_WORDS[f.name]!, mine: FOOD_WORDS[FAVORITE[f.name]!], food: FOOD_WORDS[food] });
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      this.glowing = this.friends.find((x) => x.name === eaterOf(food))?.node ?? null;
    }
  }

  private async tapSnack(item: SnackItem) {
    if (this.busy || this.finished || item.eaten) return;
    if (this.plan.mode === 'float') {
      this.busy = true;
      item.eaten = true;
      const f = this.friends.find((x) => x.name === eaterOf(item.food))!;
      await this.eat(f, item.node);
      void this.ctx.say('snack.yum', { animal: ANIMAL_WORDS[f.name]!, food: FOOD_WORDS[item.food] });
      this.eatenCount++;
      this.busy = false;
      if (this.eatenCount >= this.plan.rounds) return void this.finale();
      if (this.snacks.every((s) => s.eaten)) this.refill();
      return;
    }
    if (this.plan.mode === 'count') {
      this.busy = true;
      item.eaten = true;
      const f = this.friends.find((x) => x.name === this.round.ask)!;
      await this.eat(f, item.node);
      void this.ctx.say('count', { n: this.snacks.filter((s) => s.eaten).length });
      this.busy = false;
    }
  }

  private drop(item: SnackItem, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    // The animal nearest the drop, if it's close enough to mean it.
    const near = this.friends.map((f) => ({ f, d: Math.hypot(f.node.x - x, f.node.y - 120 - y) })).sort((a, b) => a.d - b.d)[0];
    if (!near || near.d > 200) return false;
    if (near.f.name !== eaterOf(item.food)) {
      this.miss(near.f, item.food);
      return false;
    }
    item.eaten = true;
    if (item.drag) item.drag.enabled = false;
    this.glowing = null;
    this.wrongs = 0;
    void this.eat(near.f, item.node).then(() => {
      void this.ctx.say('snack.yum', { animal: ANIMAL_WORDS[near.f.name]!, food: FOOD_WORDS[item.food] });
      if (this.snacks.every((s) => s.eaten)) void this.next();
    });
    return true;
  }

  /** Count levels: the bell says "that's how many". Too many come back to the basket. */
  private async ring() {
    if (this.busy || this.finished || this.plan.mode !== 'count') return;
    const r = this.round;
    const fed = this.snacks.filter((s) => s.eaten);
    if (fed.length === r.n) {
      this.busy = true;
      this.glowing = null;
      sfx.bell(7, 0.3);
      await this.ctx.say('snack.full', { animal: ANIMAL_WORDS[r.ask!]!, n: r.n! });
      return void this.next();
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (fed.length > r.n!) {
      for (const s of fed.slice(r.n)) {
        s.eaten = false;
        s.node.visible = true;
        s.node.scale.set(1.2);
      }
      this.resize(this.view);
      await this.ctx.say('snack.toomany', { n: r.n! });
    } else await this.ctx.say('snack.more', { n: r.n!, have: fed.length });
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      this.glowing = fed.length === r.n ? this.bell : this.snacks.find((s) => !s.eaten)?.node ?? null;
    }
    this.busy = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    for (const f of this.friends) f.node.cheer();
    await this.ctx.say('snack.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries: [...this.fed].map((a) => entryId('animal-snack', a)) });
  }
}

class SnackIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const bunny = new Critter(CRITTERS.bunny);
    bunny.alive = false;
    bunny.scale.set(0.62);
    c.addChild(bunny);
    const carrot = foodArt('carrot');
    carrot.position.set(70, -60);
    carrot.rotation = -0.4;
    c.addChild(carrot);
    super(c);
  }
}

/** An animal beside the food it loves (also the picture for its journal entry). */
export function snackPicture(name: CritterName): Container {
  const c = new Container();
  const critter = new Critter(CRITTERS[name]);
  critter.alive = false;
  critter.scale.set(0.55);
  critter.y = 90;
  const food = foodArt(FAVORITE[name]!);
  food.position.set(70, 50);
  c.addChild(critter, food);
  return c;
}

function sticker(seed: number): Container {
  return snackPicture(new Rng(seed).pick(['cow', 'bunny', 'dog', 'cat', 'duck', 'pig', 'bear'] as CritterName[]));
}

export const animalSnack: GameModule = {
  id: 'animal-snack',
  name: 'Animal Snack',
  titleLine: 'game.animal-snack',
  region: 'barnyard',
  skills: ['animals', 'words', 'matching', 'counting'],
  bands: ['lap', 'toddler', 'preschool'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Make the animal sounds together, and say what each one eats: "The bunny eats a carrot. Crunch!"',
  offScreen: 'At snack time, offer a stuffed animal a pretend snack: "What does teddy like to eat?"',
  hubIcon: () => new SnackIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new AnimalSnack(ctx),
};
