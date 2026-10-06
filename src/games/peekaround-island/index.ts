import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { flower, puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { fits, makeScene, nextRequest, planFor, spotFacing, whereIs, WHERE_WORDS, type PeekPlan, type Where } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 5 },
};

const VOICE: Record<CritterName, AnimalSound> = { pip: 'hop', duck: 'quack', pig: 'oink', cat: 'meow', bunny: 'hop', cow: 'moo', dog: 'woof', bear: 'growl' };

/** Friends stand on a ring inside the island's top, drawn as an ellipse seen from the side. */
const RING = { x: 230, y: 86 };
const ISLAND = { x: 300, y: 110 };
const FRIEND_SCALE = 0.42;

/** A friend on the island or waiting on the shore. */
interface Friend {
  name: CritterName;
  node: Critter;
  /** Island spot 0–3, or -1 while waiting on the shore. */
  spot: number;
  drag?: DragHandle;
  /** The placement asked of this friend, while it waits. */
  want?: Where;
}

/** A big round tree on a short trunk: the crown hides whoever stands behind it. */
function treeArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-22, -70, 44, 80, 12).fill(wood.fill).stroke({ width: 5, color: wood.line });
  c.addChild(g);
  c.addChild(puffs(new Graphics(), [[-80, -130, 70], [80, -130, 70], [0, -100, 75], [-55, -215, 75], [55, -215, 75], [0, -265, 70], [0, -180, 90]], swatch.green.fill, swatch.green.line));
  const apples = new Graphics();
  for (const [x, y] of [[-70, -170], [40, -240], [75, -120], [-20, -130]]) apples.circle(x, y, 11).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
  c.addChild(apples);
  return c;
}

class PeekaroundIsland implements Game {
  readonly plan: PeekPlan;
  readonly friends: Friend[] = [];
  readonly left: RoundButton;
  readonly right: RoundButton;
  readonly tiles: { name: CritterName; node: Container }[] = [];
  /** Quarter turns so far; the drawing follows `spin.angle` toward it. */
  turns = 0;
  readonly spin = { angle: 0 };
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  hider: CritterName | null = null;

  private readonly backdrop: Backdrop;
  private readonly island = new Graphics();
  /** Everything standing on the island, sorted by depth so the tree hides what is behind it. */
  readonly world = new Container();
  private readonly tree = treeArt();
  private readonly flowers: { node: Graphics; spot: number }[] = [];
  private readonly card = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting = false;
  private clock = 0;
  private asked: Where[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0x7fd0e8, 0x5bb8d8], horizon: 0.42, clouds: 3, sun: true, seed: 57 }, ctx.view);
    this.world.sortableChildren = true;
    this.tree.zIndex = -0.3;
    this.tree.eventMode = 'static';
    this.tree.hitArea = new Circle(0, -170, 130);
    onTap(this.tree, () => this.turnBy(1, true), { cooldown: 600 });
    this.world.addChild(this.tree);
    // Flowers between the spots make the turning easy to see.
    for (let i = 0; i < 4; i++) {
      const color = (['pink', 'yellow', 'purple', 'orange'] as const)[i];
      const node = flower(new Graphics(), 22, swatch[color].fill, swatch[color].line);
      node.eventMode = 'none';
      this.flowers.push({ node, spot: i + 0.5 });
      this.world.addChild(node);
    }
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.island, this.world, this.card, this.glow);
    this.left = new RoundButton(arrowIcon(-1), swatch.white, 54, () => this.turnBy(-1));
    this.right = new RoundButton(arrowIcon(1), swatch.white, 54, () => this.turnBy(1));
    const canTurn = this.plan.mode === 'find' || this.plan.mode === 'named';
    this.left.visible = this.right.visible = canTurn;
    ctx.stage.addChild(this.left, this.right);
  }

  start() {
    void this.next();
  }

  private center() {
    return { x: this.view.w / 2, y: this.view.h * 0.6 };
  }

  /** Where island spot `s` stands right now, and how near the child it is (1 front, -1 behind). */
  private at(s: number) {
    const c = this.center();
    const a = (s + this.spin.angle) * (Math.PI / 2);
    return { x: c.x + Math.sin(a) * RING.x, y: c.y + Math.cos(a) * RING.y, depth: Math.cos(a) };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const c = this.center();
    const g = this.island.clear();
    g.ellipse(c.x, c.y + 40, ISLAND.x + 60, ISLAND.y + 36).fill({ color: 0xffffff, alpha: 0.35 });
    g.ellipse(c.x, c.y + 26, ISLAND.x, ISLAND.y).fill(wood.fill).stroke({ width: 6, color: wood.line });
    g.ellipse(c.x, c.y, ISLAND.x, ISLAND.y).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line });
    this.tree.position.set(c.x, c.y);
    this.left.position.set(c.x - 400, c.y + 20);
    this.right.position.set(c.x + 400, c.y + 20);
    const xs = spread(4, 200, v.w - 200, 136);
    this.tiles.forEach((t, i) => t.node.position.set(xs[i], 78));
    this.placeShore();
  }

  update(dt: number) {
    this.clock += dt;
    for (const f of this.flowers) {
      const p = this.at(f.spot);
      f.node.position.set(p.x, p.y);
      f.node.zIndex = p.depth;
      f.node.scale.set(0.8 + 0.2 * p.depth);
    }
    for (const f of this.friends) {
      if (f.spot < 0) continue;
      const p = this.at(f.spot);
      f.node.position.set(p.x, p.y);
      f.node.zIndex = p.depth;
      f.node.scale.set(FRIEND_SCALE * (0.85 + 0.15 * p.depth));
      // Hidden behind the tree: not tappable through it.
      f.node.eventMode = p.depth < -0.5 ? 'none' : 'static';
    }
    this.drawGlow();
  }

  destroy() {
    for (const f of this.friends) f.drag?.destroy();
  }

  // Scenes --------------------------------------------------------------------------------

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = false;
    const mode = this.plan.mode;
    if (mode === 'place' || mode === 'two') {
      if (this.index === 0) await this.fillShore();
      return void this.ask();
    }
    if (this.index >= this.plan.rounds) return void this.finale();
    await this.clearIsland();
    const scene = makeScene(this.plan, this.ctx.rng, this.hider ?? undefined);
    this.hider = scene.friends[scene.hider];
    scene.friends.forEach((name, i) => {
      const f = this.addFriend(name, spotFacing(scene.facing[i], this.turns));
      f.node.alpha = 0;
      void this.ctx.tw.to(f.node, { alpha: 1 }, { duration: 0.4 });
    });
    if (mode === 'who') this.buildCard(scene.friends);
    await this.ctx.tw.wait(0.5);
    this.busy = false;
    if (mode === 'find') return this.ctx.instruct('around.find');
    if (mode === 'named') return this.ctx.instruct('around.named', { who: this.hider });
    return this.ctx.instruct('around.who');
  }

  private addFriend(name: CritterName, spot: number): Friend {
    const node = new Critter(CRITTERS[name]);
    node.scale.set(FRIEND_SCALE);
    // Body-centred and large, whatever the scale.
    node.hitArea = new Circle(0, -125, 200);
    const f: Friend = { name, node, spot };
    onTap(node, () => this.tapFriend(f), { cooldown: 300 });
    this.ctx.track(node);
    (spot >= 0 ? this.world : this.ctx.stage).addChild(node);
    this.friends.push(f);
    return f;
  }

  private async clearIsland() {
    const gone = this.friends.splice(0);
    if (gone.length) await Promise.all(gone.map((f) => this.ctx.tw.to(f.node, { alpha: 0 }, { duration: 0.3 })));
    for (const f of gone) {
      f.drag?.destroy();
      this.ctx.untrack(f.node);
      f.node.destroy({ children: true });
    }
    this.card.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.tiles.length = 0;
  }

  // Turning -------------------------------------------------------------------------------

  private turnBy(dir: number, fromTree = false) {
    if (this.busy || this.finished) return;
    if (!this.left.visible) {
      // Levels without turning: the tree just rustles.
      if (fromTree) this.rustle();
      return;
    }
    void this.turn(dir);
  }

  private rustle() {
    sfx.squish();
    void this.ctx.tw.to(this.tree, { rotation: 0.05 }, { duration: 0.1 }).then(() => this.ctx.tw.to(this.tree, { rotation: 0 }, { duration: 0.25, ease: ease.outBack }));
  }

  private async turn(dir: number) {
    this.busy = true;
    const was = this.friends.map((f) => f.spot >= 0 && whereIs(f.spot, this.turns) === 'behind');
    this.turns += dir;
    sfx.whoosh();
    await this.ctx.tw.to(this.spin, { angle: this.turns }, { duration: 0.55 * Math.abs(dir), ease: ease.inOutSine });
    // Whoever just came out from behind the tree waves hello.
    this.friends.forEach((f, i) => {
      if (was[i] && whereIs(f.spot, this.turns) !== 'behind') {
        f.node.hop();
        sfx.animal(VOICE[f.name]);
      }
    });
    this.busy = false;
  }

  // Finding -------------------------------------------------------------------------------

  private tapFriend(f: Friend) {
    if (this.busy || this.finished || f.spot < 0) return;
    f.node.poke();
    sfx.animal(VOICE[f.name]);
    const mode = this.plan.mode;
    if (mode !== 'find' && mode !== 'named') return;
    if (f.name === this.hider) return void this.found(f);
    // Named: a friend in plain sight is not the one asked for.
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say('around.notthat', { what: f.name, who: this.hider! });
    if (this.wrongs >= 2) this.hint();
  }

  private async found(f: Friend) {
    this.busy = true;
    this.hinting = false;
    f.node.cheer();
    sfx.sparkle();
    this.ctx.particles.burst(f.node.x, f.node.y - 60, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    await this.ctx.say('around.found', { who: f.name });
    await this.ctx.tw.wait(0.4);
    await this.next();
  }

  // Who is hiding -------------------------------------------------------------------------

  /** A picture card of everyone on the island: tap the one you cannot see. */
  private buildCard(names: CritterName[]) {
    const order = this.ctx.rng.shuffle([...names]);
    for (const name of order) {
      const node = new Container();
      node.addChild(new Graphics().roundRect(-60, -64, 120, 128, 22).fill(cream).stroke({ width: 5, color: wood.line }));
      const c = new Critter(CRITTERS[name]);
      c.alive = false;
      c.scale.set(0.36);
      c.y = 52;
      node.addChild(c);
      node.hitArea = new Rectangle(-64, -68, 128, 136);
      onTap(node, () => void this.pick(name), { cooldown: 400 });
      this.card.addChild(node);
      this.tiles.push({ name, node });
    }
    this.resize(this.view);
  }

  private async pick(name: CritterName) {
    if (this.busy || this.finished || this.plan.mode !== 'who') return;
    const tile = this.tiles.find((t) => t.name === name)!;
    tile.node.scale.set(0.9);
    void this.ctx.tw.to(tile.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (name === this.hider) {
      this.busy = true;
      this.hinting = false;
      // Turn halfway round to see behind the tree.
      await this.turn(2);
      this.busy = true;
      const f = this.friends.find((x) => x.name === name)!;
      return this.found(f);
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const f = this.friends.find((x) => x.name === name)!;
    f.node.hop();
    sfx.animal(VOICE[f.name]);
    void this.ctx.say(whereIs(f.spot, this.turns) === 'front' ? 'around.here.front' : 'around.here.next');
    if (this.wrongs >= 2) this.hint();
  }

  // Placing -------------------------------------------------------------------------------

  /** Four friends wait on the shore for directions. */
  private async fillShore() {
    const names = this.ctx.rng.shuffle(['duck', 'pig', 'cat', 'bunny', 'cow', 'dog', 'bear'] as CritterName[]).slice(0, 4);
    for (const name of names) {
      const f = this.addFriend(name, -1);
      f.drag = draggable(f.node, this.ctx.tw, { onPick: () => sfx.tick(), onDrop: (x, y) => this.drop(f, x, y) });
      f.drag.enabled = false;
    }
    this.placeShore();
    await this.ctx.tw.wait(0.3);
  }

  private placeShore() {
    const waiting = this.friends.filter((f) => f.spot < 0);
    const xs = spread(waiting.length, 220, this.view.w - 120, 170);
    waiting.forEach((f, i) => {
      if (!f.drag) return;
      f.drag.home = { x: xs[i], y: this.view.h - 40 };
      if (!f.drag.dragging) f.node.position.set(xs[i], this.view.h - 40);
    });
  }

  private free() {
    return [0, 1, 2, 3].filter((s) => !this.friends.some((f) => f.spot === s));
  }

  /** The next direction: one friend (place) or two (two). */
  private async ask() {
    const waiting = this.friends.filter((f) => f.spot < 0);
    if (!waiting.length) return void this.finale();
    if (this.plan.mode === 'place') {
      const f = waiting[0];
      const req = nextRequest(this.free(), this.turns, this.asked, this.ctx.rng);
      this.asked.push(req.where);
      f.want = req.where;
      f.drag!.enabled = true;
      f.node.hop();
      this.busy = false;
      return this.ctx.instruct('around.place', { who: f.name, where: WHERE_WORDS[req.where] });
    }
    const [a, b] = waiting;
    const first = nextRequest(this.free(), this.turns, [], this.ctx.rng);
    const second = nextRequest(this.free().filter((s) => s !== first.spot), this.turns, [first.where], this.ctx.rng);
    a.want = first.where;
    b.want = second.where;
    for (const f of [a, b]) {
      f.drag!.enabled = true;
      f.node.hop();
    }
    this.busy = false;
    return this.ctx.instruct('around.two', { a: a.name, wa: WHERE_WORDS[first.where], b: b.name, wb: WHERE_WORDS[second.where] });
  }

  /** The nearest free spot to where the friend's feet were let go. */
  private spotNear(x: number, y: number): number {
    let best = -1;
    let bestD = 150;
    for (const s of this.free()) {
      const p = this.at(s);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  private drop(f: Friend, x: number, y: number): boolean {
    if (this.busy || this.finished || !f.want) return false;
    const s = this.spotNear(x, y);
    // Dropped away from the island: just floats back to the shore.
    if (s < 0) return false;
    if (!fits(f.want, s, this.turns)) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say(`around.hint.${f.want}`);
      if (this.wrongs >= 2) this.hint();
      return false;
    }
    this.ctx.tw.kill(f.node.scale);
    f.spot = s;
    f.drag!.enabled = false;
    const where = f.want;
    f.want = undefined;
    this.world.addChild(f.node);
    sfx.pop(6);
    this.wrongs = 0;
    this.hinting = false;
    void this.placed(f, where);
    return true;
  }

  private async placed(f: Friend, where: Where) {
    f.node.hop();
    const line = where === 'behind' ? 'around.placed.behind' : 'around.placed';
    // The other half of a pair is still waiting and can be placed while this one is named.
    if (this.friends.some((x) => x.want)) return void this.ctx.say(line, { who: f.name, where: WHERE_WORDS[where] });
    this.busy = true;
    await this.ctx.say(line, { who: f.name, where: WHERE_WORDS[where] });
    if (this.plan.mode === 'two') {
      // Look from the other side: front and behind swap.
      await this.ctx.say('around.otherside');
      await this.turn(2);
      this.busy = true;
      const front = this.friends.find((x) => x.spot >= 0 && whereIs(x.spot, this.turns) === 'front');
      if (front) {
        front.node.cheer();
        await this.ctx.say('around.now', { who: front.name, where: WHERE_WORDS.front });
      }
    }
    this.placeShore();
    await this.ctx.tw.wait(0.3);
    await this.next();
  }

  // Help ----------------------------------------------------------------------------------

  private hint() {
    if (this.hinting) return;
    this.hinting = true;
    this.hints++;
    if (this.plan.mode === 'named') void this.ctx.say('around.turn');
  }

  /** A pulsing ring: the arrows (named), the hider's picture (who), or the spots that fit (placing). */
  private drawGlow() {
    const g = this.glow.clear();
    if (!this.hinting || this.busy) return;
    const width = 6 + 2 * Math.sin(this.clock * 6);
    const ring = (x: number, y: number, rx: number, ry = rx) => g.ellipse(x, y, rx, ry).stroke({ width, color: swatch.yellow.fill });
    if (this.plan.mode === 'named') for (const b of [this.left, this.right]) ring(b.x, b.y, 70);
    else if (this.plan.mode === 'who') {
      const t = this.tiles.find((x) => x.name === this.hider);
      if (t) ring(t.node.x, t.node.y, 78, 82);
    } else {
      const wants = new Set(this.friends.filter((f) => f.want).map((f) => f.want!));
      for (const s of this.free()) {
        if (![...wants].some((w) => fits(w, s, this.turns))) continue;
        const p = this.at(s);
        ring(p.x, p.y, 70, 28);
      }
    }
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.glow.clear();
    sfx.tada();
    // Everyone comes out to play: a full spin of the island.
    void this.ctx.tw.to(this.spin, { angle: this.turns + 4 }, { duration: 1.6, ease: ease.inOutSine });
    for (const f of this.friends) f.node.cheer();
    await this.ctx.say('around.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class PeekIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().ellipse(0, -30, 120, 44).fill(wood.fill).stroke({ width: 5, color: wood.line }).ellipse(0, -44, 120, 44).fill(swatch.green.light).stroke({ width: 5, color: swatch.green.line }));
    const bunny = new Critter(CRITTERS.bunny);
    bunny.alive = false;
    bunny.scale.set(0.34);
    bunny.position.set(-52, -40);
    c.addChild(bunny);
    const tree = treeArt();
    tree.scale.set(0.62);
    tree.position.set(10, -40);
    c.addChild(tree);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const friend = new Critter(CRITTERS[rng.pick(['duck', 'pig', 'cat', 'bunny', 'cow', 'dog', 'bear'] as CritterName[])]);
  friend.alive = false;
  friend.scale.set(0.42);
  friend.position.set(rng.pick([-1, 1]) * 70, 90);
  const tree = treeArt();
  tree.scale.set(0.7);
  tree.position.set(0, 100);
  c.addChild(tree, friend);
  const g = new Graphics().ellipse(0, 100, 130, 22).fill({ color: ink, alpha: 0.08 });
  c.addChildAt(g, 0);
  return c;
}

export const peekaroundIsland: GameModule = {
  id: 'peekaround-island',
  name: 'Peekaround Island',
  titleLine: 'game.peekaround-island',
  region: 'puzzle-peaks',
  skills: ['object-permanence', 'perspective', 'spatial-words', 'reasoning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Hide a toy behind a cup, then turn the cup around together: "Where did it go? Behind!"',
  offScreen: 'Play hide-and-seek around a chair: "Am I in front of it, behind it, or next to it?"',
  hubIcon: () => new PeekIcon(),
  sticker,
  create: (ctx) => new PeekaroundIsland(ctx),
};
