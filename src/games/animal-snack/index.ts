import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { entryId } from '../../content/journal';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { symbol, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BITE, BITE_SIZES, busyTouch, countedFood, eaterOf, FAVORITE, FOOD_WORDS, makeRounds, nearestFriend, SCENE_SPECS, sceneFor, SOUND_WORDS, planFor, shouldNudge, snackTouch, VOICE, type Food, type Scene, type SnackPlan, type SnackRound } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 4 },
  preschool: { min: 3, max: 5 },
};

const ANIMAL_WORDS: Partial<Record<CritterName, string>> = { cow: 'cow', bunny: 'bunny', dog: 'dog', cat: 'cat', duck: 'duck', pig: 'pig', bear: 'bear' };

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

  /** Where snack time is today, from the round's seed; `showScene` swaps it (the dev screenshots do). */
  scene: Scene;
  private backdrop: Backdrop | null = null;
  /** The scene's furniture behind the animals: a tree, a fence and vegetable rows, or the moon and stars. */
  private readonly decor = new Container();
  private readonly stars = new Graphics();
  private nextFall = 3;
  /** The feeding spot the snacks sit in: blanket, trough, tub or bowl. */
  private readonly spot = new Graphics();
  private readonly bubble = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Container | null = null;
  private clock = 0;
  private idle = 0;
  private nudgeIndex = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = makeRounds(this.plan, ctx.rng);
    // After the rounds, so the scene never changes which animals a seed deals.
    this.scene = sceneFor(ctx.rng);
    this.glow.eventMode = 'none';
    this.decor.eventMode = 'none';
    this.spot.eventMode = 'none';
    // In a sound question the bubble is a speaker: tapping it plays the clue again (free, never a hint).
    onTap(this.bubble, () => { if (!this.busy && this.round?.by === 'sound') this.playClue(); }, { cooldown: 400 });
    this.bubble.hitArea = new Rectangle(-80, -60, 160, 120);
    this.bubble.eventMode = 'none';
    this.bell = new RoundButton(symbol('bell', 0, 34), swatch.yellow, 56, () => void this.ring());
    this.bell.visible = this.plan.mode === 'count';
    ctx.stage.addChild(this.decor, this.spot, this.bubble, this.glow, this.bell);
    this.showScene(this.scene);
  }

  /** Rebuild the sky, hills, furniture and feeding spot for a scene. Animals and snacks stay where they are. */
  showScene(scene: Scene) {
    this.scene = scene;
    const old = this.backdrop;
    this.backdrop = new Backdrop(SCENE_SPECS[scene].backdrop, this.view);
    this.ctx.stage.addChildAt(this.backdrop, 0);
    if (old) {
      this.ctx.stage.removeChild(old);
      old.destroy({ children: true });
    }
    this.nextFall = this.clock + 3;
    this.resize(this.view);
  }

  get round() {
    return this.rounds[Math.min(this.index, this.rounds.length - 1)];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop?.resize(v);
    this.drawDecor(v);
    this.drawSpot(v);
    const xs = spread(this.friends.length, 200, v.w - 60, 270);
    this.friends.forEach((f, i) => f.node.position.set(xs[i], v.h * 0.64));
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

  /** The snacks' place at the bottom: a picnic blanket in the meadow, a trough in the orchard, a tin tub in the garden, a big bowl at dusk. */
  private drawSpot(v: View) {
    const g = this.spot.clear();
    const left = 170;
    const right = v.w - 50;
    const mid = (left + right) / 2;
    switch (SCENE_SPECS[this.scene].spot) {
      case 'blanket':
        g.roundRect(left, v.h - 150, right - left, 130, 26).fill(swatch.red.light).stroke({ width: 5, color: swatch.red.fill });
        break;
      case 'trough':
        for (const x of [left + 40, right - 40]) g.rect(x - 12, v.h - 60, 24, 45).fill(wood.line);
        g.roundRect(left, v.h - 145, right - left, 110, 14).fill(wood.fill).stroke({ width: 5, color: wood.line });
        g.rect(left + 8, v.h - 137, right - left - 16, 26).fill(wood.light);
        for (const x of [left + 90, mid, right - 90]) g.moveTo(x, v.h - 105).lineTo(x, v.h - 48).stroke({ width: 4, color: wood.line, alpha: 0.5 });
        break;
      case 'tub': {
        const tin = { fill: 0xc9d3de, line: 0x7f8a99, light: 0xe6ecf2 };
        for (const x of [left - 6, right + 6]) g.circle(x, v.h - 100, 22).stroke({ width: 7, color: tin.line });
        g.poly([left - 10, v.h - 145, right + 10, v.h - 145, right - 20, v.h - 25, left + 20, v.h - 25]).fill(tin.fill).stroke({ width: 5, color: tin.line, join: 'round' });
        g.rect(left - 14, v.h - 152, right - left + 28, 16).fill(tin.light).stroke({ width: 5, color: tin.line });
        for (const y of [v.h - 95, v.h - 55]) g.moveTo(left + 4 + (y - (v.h - 145)) * 0.25, y).lineTo(right - 4 - (y - (v.h - 145)) * 0.25, y).stroke({ width: 3, color: tin.line, alpha: 0.45 });
        break;
      }
      case 'bowl':
        g.moveTo(left, v.h - 130).lineTo(right, v.h - 130).quadraticCurveTo(right - 20, v.h - 30, right - 70, v.h - 25).lineTo(left + 70, v.h - 25).quadraticCurveTo(left + 20, v.h - 30, left, v.h - 130).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line, join: 'round' });
        g.ellipse(mid, v.h - 130, (right - left) / 2, 20).fill(swatch.blue.light).stroke({ width: 5, color: swatch.blue.line });
        g.moveTo(left + 60, v.h - 60).quadraticCurveTo(mid, v.h - 40, right - 60, v.h - 60).stroke({ width: 6, color: swatch.blue.light, alpha: 0.6, cap: 'round' });
        break;
    }
  }

  /** The scene's furniture, behind the animals and out of their way: nothing here takes a touch. */
  private drawDecor(v: View) {
    for (const c of this.decor.removeChildren()) {
      this.ctx.tw.kill(c);
      if (c !== this.stars) c.destroy({ children: true });
    }
    this.stars.clear();
    const ground = v.h * 0.5;
    const g = new Graphics();
    const fence = (color: number, rail: number) => {
      for (let x = -10; x <= v.w + 10; x += 96) g.roundRect(x - 8, ground - 30, 16, 60, 5).fill(color).stroke({ width: 3, color: rail });
      for (const y of [ground - 12, ground + 10]) g.rect(-20, y, v.w + 40, 8).fill(color).stroke({ width: 3, color: rail });
    };
    switch (this.scene) {
      case 'orchard': {
        g.rect(96, ground - 70, 36, 140).fill(wood.fill).stroke({ width: 5, color: wood.line });
        for (const [x, y, r] of [[114, ground - 90, 72], [60, ground - 60, 50], [170, ground - 60, 50], [86, ground - 130, 46], [146, ground - 128, 46]] as const) g.circle(x, y, r).fill(swatch.green.fill);
        for (const [x, y, r] of [[114, ground - 90, 60], [86, ground - 130, 34], [146, ground - 128, 34]] as const) g.circle(x, y, r).fill(0x8fdc6a);
        for (const [x, y] of [[70, ground - 70], [118, ground - 130], [160, ground - 80], [100, ground - 100], [150, ground - 120]] as const) g.circle(x, y, 10).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
        for (const [x, y] of [[240, ground + 36], [300, ground + 50]] as const) g.circle(x, y, 10).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
        break;
      }
      case 'garden': {
        fence(wood.light, wood.line);
        for (let x = 40, i = 0; x <= v.w - 40; x += 58, i++) {
          const y = ground + 58;
          if (i % 2 === 0) g.circle(x, y, 17).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line }).circle(x, y, 8).fill(swatch.green.fill);
          else {
            g.poly([x - 9, y + 12, x + 9, y + 12, x, y + 30]).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
            for (const dx of [-10, 0, 10]) g.moveTo(x, y + 12).quadraticCurveTo(x + dx, y - 6, x + dx * 1.6, y - 18).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
          }
        }
        break;
      }
      case 'dusk': {
        const moonX = Math.min(v.w * 0.72, v.w - 170);
        g.circle(moonX, 130, 38).fill(0xfff3c4).stroke({ width: 4, color: 0xe6cf8e });
        g.circle(moonX - 12, 118, 7).circle(moonX + 10, 140, 5).circle(moonX + 14, 112, 4).fill(0xf1e3ad);
        const rng = new Rng(19);
        for (let i = 0; i < 16; i++) this.stars.circle(rng.range(20, v.w - 20), rng.range(40, ground - 90), rng.range(2.5, 4.5)).fill(0xffffff);
        fence(0x3a4a3e, 0x2b3a30);
        break;
      }
    }
    this.decor.addChild(g, this.stars);
  }

  /** The orchard drops one apple from the tree now and then, a picture of where apples come from; it is never a snack. */
  private dropApple(v: View) {
    const apple = prop('apple', 'red');
    apple.eventMode = 'none';
    apple.position.set(150, v.h * 0.5 - 100);
    apple.scale.set(0.7);
    this.decor.addChild(apple);
    void this.ctx.tw.to(apple, { y: v.h * 0.5 + 44, rotation: 0.6 }, { duration: 0.7, ease: ease.inQuad })
      .then(() => this.ctx.tw.to(apple, { alpha: 0 }, { duration: 1.2, delay: 1.5 }))
      .then(() => { if (!apple.destroyed) apple.destroy({ children: true }); });
  }

  update(dt: number) {
    this.clock += dt;
    this.backdrop?.update(dt);
    if (this.scene === 'dusk') this.stars.alpha = 0.75 + 0.25 * Math.sin(this.clock * 2.2);
    if (this.scene === 'orchard' && this.clock >= this.nextFall) {
      this.nextFall = this.clock + 9;
      this.dropApple(this.view);
    }
    if (!this.busy && !this.finished) this.idle += dt;
    if (shouldNudge(this.plan.mode, this.idle, this.busy, this.finished) && this.friends.length) {
      this.idle = 0;
      const friend = this.friends[this.nudgeIndex++ % this.friends.length];
      friend.node.poke();
      const snack = this.snacks.find((s) => !s.eaten && s.food === FAVORITE[friend.name]);
      const p = snack?.node ?? this.mouth(friend);
      this.ctx.particles.burst(p.x, p.y, { colors: [swatch.yellow.fill, swatch.white.fill], count: 5, speed: [20, 50], gravity: 0, size: [0.2, 0.3] });
    }
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
      onTap(node, (e) => {
        this.idle = 0;
        const p = this.ctx.stage.toLocal(e.global);
        const i = nearestFriend(this.friends.map((friend) => ({ x: friend.node.x, y: friend.node.y - 125 * friend.node.scale.y })), p.x, p.y);
        if (i >= 0) void this.tapFriend(this.friends[i]);
      }, { cooldown: 350 });
      this.ctx.track(node);
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.spot));
      this.friends.push(f);
    }
    // Animals made after the shell's resize (every round) would otherwise wait at the corner for a snack tray to place them.
    this.resize(this.view);
  }

  /** Snacks at the feeding spot: tappable on the float and count levels, draggable for matching. */
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
    this.idle = 0;
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
    this.showBubble(food, mode === 'count' ? r.n : undefined, r.by === 'sound');
    this.busy = false;
    if (mode === 'who' && r.by === 'sound') {
      const done = this.ctx.instruct('snack.whosound', { sound: SOUND_WORDS[r.ask!]! });
      this.playClue();
      return done;
    }
    if (mode === 'who') return this.ctx.instruct('snack.who', { food: FOOD_WORDS[food] });
    return this.ctx.instruct('snack.count', { animal: ANIMAL_WORDS[r.ask!]!, n: r.n!, food: countedFood(food, r.n!) });
  }

  /** One snack for each animal, shuffled, for floating and matching. */
  private refill() {
    this.setSnacks(this.ctx.rng.shuffle(this.friends.map((f) => FAVORITE[f.name]!)));
  }

  private playClue() {
    const voice = VOICE[this.round.ask!];
    if (voice) sfx.animal(voice);
  }

  private showBubble(food: Food, n?: number, sound = false) {
    this.bubble.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.bubble.eventMode = sound ? 'static' : 'none';
    if (sound) {
      const g = new Graphics().roundRect(-80, -60, 160, 120, 40).fill(0xffffff).stroke({ width: 5, color: swatch.white.line });
      const horn = new Graphics().poly([-40, -14, -20, -14, 6, -38, 6, 38, -20, 14, -40, 14]).fill(ink);
      const waves = new Graphics();
      for (const r of [22, 40]) waves.arc(8, 0, r, -0.9, 0.9).stroke({ width: 7, color: ink, cap: 'round' });
      this.bubble.addChild(g, horn, waves);
      return;
    }
    const counting = n !== undefined;
    const g = new Graphics().roundRect(counting ? -100 : -80, -60, counting ? 200 : 160, counting ? 150 : 120, 40).fill(0xffffff).stroke({ width: 5, color: swatch.white.line });
    const art = foodArt(food);
    art.scale.set(1.4);
    this.bubble.addChild(g, art);
    if (counting) {
      art.x = -42;
      const number = label(String(n), 48);
      number.position.set(45, 0);
      const dots = new Graphics();
      for (let i = 0; i < n; i++) dots.circle((i - (n - 1) / 2) * 28, 60, 9).fill(ink);
      this.bubble.addChild(number, dots);
    }
  }

  private async eat(f: Friend, node: Container) {
    this.fed.add(f.name);
    const m = this.mouth(f);
    this.ctx.tw.kill(node);
    await this.ctx.tw.to(node, { x: m.x, y: m.y }, { duration: 0.35, ease: ease.inOutSine });
    const start = node.scale.x;
    const kind = BITE[FAVORITE[f.name]!];
    for (const left of BITE_SIZES) {
      sfx.bite(kind);
      this.ctx.particles.burst(m.x, m.y, { colors: [wood.fill, swatch.yellow.light], count: 3, speed: [40, 110], gravity: 500, size: [0.15, 0.3] });
      f.node.poke();
      await this.ctx.tw.to(node.scale, { x: start * left, y: start * left }, { duration: 0.1 });
    }
    node.visible = false;
    const voice = VOICE[f.name];
    if (voice) sfx.animal(voice);
    f.node.cheer();
    this.ctx.particles.burst(m.x, m.y, { colors: [wood.fill, swatch.yellow.light], count: 6, speed: [80, 180], gravity: 500, size: [0.25, 0.4] });
  }

  private async tapFriend(f: Friend) {
    if (busyTouch(this.busy, this.finished, { friend: true })) {
      f.node.poke();
      sfx.tick();
      return;
    }
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
    this.miss(f, FAVORITE[want]!, this.round.by === 'sound' ? want : undefined);
  }

  /** A wrong animal shakes its head and says what it eats instead. */
  private miss(f: Friend, food: Food, soundOf?: CritterName) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    f.node.setMood('surprised', 1);
    void this.ctx.tw.to(f.node, { rotation: 0.08 }, { duration: 0.1 }).then(() => this.ctx.tw.to(f.node, { rotation: -0.08 }, { duration: 0.15 })).then(() => this.ctx.tw.to(f.node, { rotation: 0 }, { duration: 0.1 }));
    if (soundOf) {
      // A wrong animal answers in its own voice, so the mistake is also a second listen.
      const voice = VOICE[f.name];
      if (voice) sfx.animal(voice);
      void this.ctx.say('snack.notme', { animal: ANIMAL_WORDS[f.name]!, sound: SOUND_WORDS[soundOf]! });
    } else void this.ctx.say('snack.nothanks', { animal: ANIMAL_WORDS[f.name]!, mine: FOOD_WORDS[FAVORITE[f.name]!], food: FOOD_WORDS[food] });
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      this.glowing = this.friends.find((x) => x.name === eaterOf(food))?.node ?? null;
    }
  }

  private async tapSnack(item: SnackItem) {
    this.idle = 0;
    if (busyTouch(this.busy, this.finished, { snack: { eaten: item.eaten, visible: item.node.visible } })) return this.wiggle(item);
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

  /** A snack touched while busy wiggles its drawing, never the node, which eat() reads its starting size from. */
  private wiggle(item: SnackItem) {
    const art = item.node.children[0];
    if (!art || art.destroyed) return;
    sfx.tick();
    this.ctx.tw.kill(art);
    art.rotation = 0;
    void this.ctx.tw.to(art, { rotation: 0.18 }, { duration: 0.05 })
      .then(() => this.ctx.tw.to(art, { rotation: -0.18 }, { duration: 0.1 }))
      .then(() => this.ctx.tw.to(art, { rotation: 0 }, { duration: 0.05 }));
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
    } else await this.ctx.say('snack.more', { animal: ANIMAL_WORDS[r.ask!]!, n: r.n!, have: fed.length });
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
