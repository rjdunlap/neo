import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { flower, puffs, shapePath, type ShapeKind } from '../../art/shapes';
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
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  fits,
  frontAfterHalfTurn,
  makeScene,
  makeSeeScene,
  makeSkyScene,
  makeViewScene,
  mapPoint,
  skyFacing,
  namedHintTarget,
  nextPair,
  nextRequest,
  peekTouch,
  planFor,
  seeFacings,
  spotFacing,
  turnToFront,
  viewFacings,
  whereIs,
  WHERE_WORDS,
  type PeekPlan,
  type SkyKind,
  type SkyScene,
  type Where,
} from './logic';
import { rangeFor } from '../../progress/difficulty';

const VOICE: Record<CritterName, AnimalSound> = {
  pip: 'hop',
  duck: 'quack',
  pig: 'oink',
  cat: 'meow',
  bunny: 'hop',
  cow: 'moo',
  dog: 'woof',
  bear: 'growl',
};

/** Friends stand on a ring inside the island's top, drawn as an ellipse seen from the side. */
const RING = { x: 230, y: 86 };
const ISLAND = { x: 300, y: 110 };
const FRIEND_SCALE = 0.42;
/** Flower i stands between spots i and i + 1; four colours so every side of the island looks different. */
const FLOWERS = ['pink', 'yellow', 'purple', 'orange'] as const;
/** Level 7's picture cards: big enough to read a friend beside the tree, in a row clear of the corner buttons. */
const VIEW_CARD = { w: 270, h: 220, gap: 290, y: 126, art: 0.4 };
/** Level 8's maps: square cards in a row at the top; the island sits low enough that the crown clears them. */
const MAP_CARD = { size: 170, gap: 190, y: 115, island: 64, crown: 22, ring: 46, critter: 0.14 };

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
  c.addChild(
    puffs(
      new Graphics(),
      [
        [-80, -130, 70],
        [80, -130, 70],
        [0, -100, 75],
        [-55, -215, 75],
        [55, -215, 75],
        [0, -265, 70],
        [0, -180, 90],
      ],
      swatch.green.fill,
      swatch.green.line,
    ),
  );
  const apples = new Graphics();
  for (const [x, y] of [
    [-70, -170],
    [40, -240],
    [75, -120],
    [-20, -130],
  ])
    apples.circle(x, y, 11).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
  c.addChild(apples);
  return c;
}

/** Level 6's picture: a card on a little easel, small enough that the crown hides all of it from behind. */
function pictureArt(kind: ShapeKind, color: keyof typeof swatch): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-22, 0)
    .lineTo(-12, -40)
    .moveTo(22, 0)
    .lineTo(12, -40)
    .moveTo(0, -4)
    .lineTo(0, -40)
    .stroke({ width: 7, color: wood.line, cap: 'round' });
  g.roundRect(-36, -112, 72, 80, 12).fill(cream).stroke({ width: 5, color: wood.line });
  c.addChild(g);
  const s = shapePath(new Graphics(), kind, 24)
    .fill(swatch[color].fill)
    .stroke({ width: 4, color: swatch[color].line });
  s.position.set(0, -72);
  c.addChild(s);
  c.eventMode = 'none';
  return c;
}

/**
 * Level 7: the island as the friend on island spot `from` sees it, drawn small for a picture card. The friend
 * is not in their own picture; whoever stands across the tree from them is hidden by the crown, as on the island.
 */
function viewArt(from: number, friends: readonly { name: CritterName; spot: number }[]): Container {
  const c = new Container();
  c.sortableChildren = true;
  c.addChild(
    new Graphics()
      .ellipse(0, 26, ISLAND.x, ISLAND.y)
      .fill(wood.fill)
      .stroke({ width: 8, color: wood.line })
      .ellipse(0, 0, ISLAND.x, ISLAND.y)
      .fill(swatch.green.light)
      .stroke({ width: 8, color: swatch.green.line }),
  );
  c.children[0].zIndex = -2;
  const place = (node: Container, spot: number, scale: number) => {
    const a = (spot - from) * (Math.PI / 2);
    node.position.set(Math.sin(a) * RING.x, Math.cos(a) * RING.y);
    node.zIndex = Math.cos(a);
    node.scale.set(scale * (0.85 + 0.15 * Math.cos(a)));
    c.addChild(node);
  };
  // Bigger than on the island, so the colours still read on a small card.
  FLOWERS.forEach((color, i) =>
    place(flower(new Graphics(), 40, swatch[color].fill, swatch[color].line), i + 0.5, 1),
  );
  const tree = treeArt();
  tree.zIndex = -0.3;
  c.addChild(tree);
  for (const f of friends) {
    if (f.spot < 0 || f.spot === from) continue;
    const critter = new Critter(CRITTERS[f.name]);
    critter.alive = false;
    place(critter, f.spot, 0.7);
  }
  c.eventMode = 'none';
  return c;
}

/** Her side: a little rowboat, on every map's bottom edge and in the water in front of the island. */
function boatArt(scale = 1): Graphics {
  const g = new Graphics();
  g.moveTo(-40, -8)
    .lineTo(40, -8)
    .lineTo(28, 10)
    .lineTo(-28, 10)
    .closePath()
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: swatch.red.line, join: 'round' });
  g.moveTo(-40, -8).lineTo(40, -8).stroke({ width: 5, color: wood.line, cap: 'round' });
  g.scale.set(scale);
  g.eventMode = 'none';
  return g;
}

/**
 * Level 8: a map of the island seen from the sky, her side (the boat) at the bottom: the tree's crown in the
 * middle, a friend at each map facing and the flowers between them.
 */
function mapArt(kind: SkyKind, scene: SkyScene, turns: number): Container {
  const c = new Container();
  const { size, island, crown, ring } = MAP_CARD;
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, 22)
    .fill(cream)
    .stroke({ width: 5, color: wood.line });
  g.circle(0, -6, island).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line });
  FLOWERS.forEach((color, i) => {
    const p = mapPoint(skyFacing(kind, i + 0.5 + turns, scene.k), ring);
    g.circle(p.x, p.y - 6, 7)
      .fill(swatch[color].fill)
      .stroke({ width: 2, color: swatch[color].line });
  });
  g.circle(0, -6, crown).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  g.circle(7, -12, 4).fill(swatch.red.fill);
  c.addChild(g);
  scene.friends.forEach((name, i) => {
    const p = mapPoint(skyFacing(kind, scene.facing[i], scene.k), ring);
    const critter = new Critter(CRITTERS[name]);
    critter.alive = false;
    critter.scale.set(MAP_CARD.critter);
    // Feet below the point, so the body sits on it.
    critter.position.set(p.x, p.y - 6 + 18);
    c.addChild(critter);
  });
  const boat = boatArt(0.42);
  boat.y = size / 2 - 10;
  c.addChild(boat);
  return c;
}

const PICTURES: [ShapeKind, keyof typeof swatch][] = [
  ['star', 'yellow'],
  ['heart', 'red'],
  ['circle', 'blue'],
  ['triangle', 'purple'],
];

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
  /** Level 6: the picture standing on an island spot. */
  private picture: { node: Container; spot: number } | null = null;
  /** Levels 6 and 7: the side each scene's picture (6) or named friend (7) faces her from. */
  private sceneOrder: number[] = [];
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting = false;
  private clock = 0;
  private asked: Where[] = [];
  /** Level 8: the scene and its three map cards; a wrong card already tried repeats its reason without a miss. */
  private sky: SkyScene | null = null;
  private readonly maps: { kind: SkyKind; node: Container; tried: boolean }[] = [];
  private readonly boat: Graphics | null = null;
  /** Level 8: the bird's-view cloud and birds while they drift. */
  private readonly flyover = new Container();
  /** Level 5: waiting for her guess of who will be in front after the half turn. */
  private predicting: ((name: CritterName) => void) | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0x7fd0e8, 0x5bb8d8],
        horizon: 0.42,
        clouds: 3,
        sun: true,
        seed: 57,
      },
      ctx.view,
    );
    this.world.sortableChildren = true;
    this.tree.zIndex = -0.3;
    this.tree.eventMode = 'static';
    this.tree.hitArea = new Circle(0, -170, 130);
    onTap(this.tree, () => this.turnBy(1, true), { cooldown: 600 });
    this.world.addChild(this.tree);
    // Flowers between the spots make the turning easy to see.
    for (let i = 0; i < 4; i++) {
      const color = FLOWERS[i];
      const node = flower(new Graphics(), 22, swatch[color].fill, swatch[color].line);
      node.eventMode = 'none';
      this.flowers.push({ node, spot: i + 0.5 });
      this.world.addChild(node);
    }
    this.glow.eventMode = 'none';
    this.flyover.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.island);
    if (this.plan.mode === 'sky') {
      this.boat = boatArt();
      ctx.stage.addChild(this.boat);
    }
    ctx.stage.addChild(this.world, this.card, this.flyover, this.glow);
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
    // Level 7's cards take the top: the island sits low enough that the crown clears them.
    const y =
      this.plan.mode === 'view'
        ? Math.max(this.view.h * 0.6, VIEW_CARD.y + VIEW_CARD.h / 2 + 350)
        : this.plan.mode === 'sky'
          ? Math.max(this.view.h * 0.6, 545)
          : this.view.h * 0.6;
    return { x: this.view.w / 2, y };
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
    g.ellipse(c.x, c.y + 26, ISLAND.x, ISLAND.y)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    g.ellipse(c.x, c.y, ISLAND.x, ISLAND.y)
      .fill(swatch.green.light)
      .stroke({ width: 6, color: swatch.green.line });
    this.tree.position.set(c.x, c.y);
    this.boat?.position.set(c.x, c.y + 165);
    this.left.position.set(c.x - 400, c.y + 20);
    this.right.position.set(c.x + 400, c.y + 20);
    // The picture card: centred when it fits, else in the room right of the corner buttons, tiles never overlapping.
    const n = this.tiles.length;
    if (this.plan.mode === 'sky') {
      const xs = spread(this.maps.length, 200, v.w - 200, MAP_CARD.gap);
      this.maps.forEach((m, i) => m.node.position.set(xs[i], MAP_CARD.y));
    } else if (this.plan.mode === 'view') {
      const xs = spread(n, 130, v.w - 20, VIEW_CARD.gap);
      this.tiles.forEach((t, i) => t.node.position.set(xs[i], VIEW_CARD.y));
    } else {
      const xs = n * 136 <= v.w - 400 ? spread(n, 200, v.w - 200, 136) : spread(n, 140, v.w - 40, 136);
      this.tiles.forEach((t, i) => t.node.position.set(xs[i], 78));
    }
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
    if (this.picture) {
      const p = this.at(this.picture.spot);
      this.picture.node.position.set(p.x, p.y);
      this.picture.node.zIndex = p.depth;
      this.picture.node.scale.set(0.85 + 0.15 * p.depth);
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

  /** Turn to reveal the hider, choose the hidden friend, or carry the named friend to a fitting island spot. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const move = peekTouch(
      this.plan.mode,
      this.turns,
      this.hider,
      this.friends,
      this.predicting !== null,
      this.maps.map((m) => m.kind),
    );
    if (!move) return null;
    if (move.kind === 'map') return { tap: { on: this.maps[move.index].node } };
    if (move.kind === 'turn') return { tap: { on: this.right } };
    if (move.kind === 'tile') {
      const tile = this.tiles.find((t) => t.name === move.name);
      return tile ? { tap: { on: tile.node } } : null;
    }
    const friend = this.friends.find((f) => f.name === move.name);
    if (move.kind === 'friend') return friend ? { tap: { on: friend.node, x: 0, y: -125 } } : null;
    const at = this.at(move.spot);
    return friend?.drag && !friend.drag.dragging
      ? { drag: { on: friend.node, x: 0, y: -125 }, to: { on: this.ctx.stage, x: at.x, y: at.y } }
      : null;
  }

  destroy() {
    this.predicting = null;
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
    if (mode === 'see') return this.seeScene();
    if (mode === 'view') return this.viewScene();
    if (mode === 'sky') return this.skyScene();
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
    if (gone.length)
      await Promise.all(gone.map((f) => this.ctx.tw.to(f.node, { alpha: 0 }, { duration: 0.3 })));
    for (const f of gone) {
      f.drag?.destroy();
      this.ctx.untrack(f.node);
      f.node.destroy({ children: true });
    }
    if (this.picture) {
      this.picture.node.destroy({ children: true });
      this.picture = null;
    }
    this.clearCard();
  }

  private clearCard() {
    this.card.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.tiles.length = 0;
    this.maps.length = 0;
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
    void this.ctx.tw
      .to(this.tree, { rotation: 0.05 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(this.tree, { rotation: 0 }, { duration: 0.25, ease: ease.outBack }));
  }

  private async turn(dir: number) {
    this.busy = true;
    const was = this.friends.map((f) => f.spot >= 0 && whereIs(f.spot, this.turns) === 'behind');
    this.turns += dir;
    sfx.whoosh();
    await this.ctx.tw.to(
      this.spin,
      { angle: this.turns },
      { duration: 0.55 * Math.abs(dir), ease: ease.inOutSine },
    );
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
    if (mode === 'see') return void this.seeTap(f);
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
    this.ctx.particles.burst(f.node.x, f.node.y - 60, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
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
      node.addChild(
        new Graphics().roundRect(-60, -64, 120, 128, 22).fill(cream).stroke({ width: 5, color: wood.line }),
      );
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
    if (this.busy || this.finished) return;
    const tile = this.tiles.find((t) => t.name === name)!;
    tile.node.scale.set(0.9);
    void this.ctx.tw.to(tile.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.predicting) {
      // A prediction is a guess to test, never a wrong answer.
      sfx.tick();
      const settle = this.predicting;
      this.predicting = null;
      this.busy = true;
      return settle(name);
    }
    if (this.plan.mode === 'view') return this.viewPick(name);
    if (this.plan.mode !== 'who') return;
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

  // Who can't see it --------------------------------------------------------------------

  /** A picture on one spot and friends round it: the one across the tree cannot see it. */
  private async seeScene() {
    if (!this.sceneOrder.length) this.sceneOrder = seeFacings(this.ctx.rng);
    const scene = makeSeeScene(this.sceneOrder[this.index], this.ctx.rng, this.hider ?? undefined);
    this.hider = scene.friends[scene.blocked];
    const [kind, color] = this.ctx.rng.pick(PICTURES);
    const node = pictureArt(kind, color);
    node.alpha = 0;
    this.world.addChild(node);
    this.picture = { node, spot: spotFacing(scene.picture, this.turns) };
    void this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.4 });
    scene.friends.forEach((name, i) => {
      const f = this.addFriend(name, spotFacing(scene.facing[i], this.turns));
      f.node.alpha = 0;
      void this.ctx.tw.to(f.node, { alpha: 1 }, { duration: 0.4 });
    });
    await this.ctx.tw.wait(0.5);
    // Behind the tree from her side: she cannot see it either.
    if (scene.picture === 2) await this.ctx.say('around.see.hidden');
    this.busy = false;
    return this.ctx.instruct('around.see');
  }

  /** Turn the island so the tapped friend is in front: her view becomes theirs. */
  private async seeTap(f: Friend) {
    this.busy = true;
    const right = f.name === this.hider;
    if (!right) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
    } else this.hinting = false;
    const d = turnToFront(f.spot, this.turns);
    if (d) await this.turn(d);
    this.busy = true;
    if (!right) {
      f.node.hop();
      await this.ctx.say('around.see.can');
      if (this.wrongs >= 2) this.hint();
      this.busy = false;
      return;
    }
    f.node.cheer();
    sfx.sparkle();
    this.ctx.particles.burst(f.node.x, f.node.y - 60, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    this.ctx.pet.cheer();
    await this.ctx.say('around.see.cant');
    await this.ctx.tw.wait(0.4);
    await this.next();
  }

  // What does the duck see ---------------------------------------------------------------

  /** Three friends round the tree, one named, and a picture card from each friend's side. */
  private async viewScene() {
    if (!this.sceneOrder.length) this.sceneOrder = viewFacings(this.ctx.rng);
    const scene = makeViewScene(this.sceneOrder[this.index], this.ctx.rng, this.hider ?? undefined);
    this.hider = scene.friends[scene.viewer];
    scene.friends.forEach((name, i) => {
      const f = this.addFriend(name, spotFacing(scene.facing[i], this.turns));
      f.node.alpha = 0;
      void this.ctx.tw.to(f.node, { alpha: 1 }, { duration: 0.4 });
    });
    this.buildViews();
    await this.ctx.tw.wait(0.5);
    this.busy = false;
    return this.ctx.instruct('around.view', { who: this.hider });
  }

  private buildViews() {
    const spots = this.friends.map((f) => ({ name: f.name, spot: f.spot }));
    for (const { name, spot } of this.ctx.rng.shuffle([...spots])) {
      const node = new Container();
      const { w, h } = VIEW_CARD;
      node.addChild(
        new Graphics()
          .roundRect(-w / 2, -h / 2, w, h, 24)
          .fill(cream)
          .stroke({ width: 5, color: wood.line }),
      );
      const art = viewArt(spot, spots);
      art.scale.set(VIEW_CARD.art);
      art.y = 40;
      node.addChild(art);
      node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
      onTap(node, () => void this.pick(name), { cooldown: 400 });
      this.card.addChild(node);
      this.tiles.push({ name, node });
    }
    this.resize(this.view);
  }

  /** The island turns to the side of the picture she chose, so the island and the picture match. */
  private async viewPick(name: CritterName) {
    this.busy = true;
    const right = name === this.hider;
    if (!right) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
    } else this.hinting = false;
    const f = this.friends.find((x) => x.name === name)!;
    const d = turnToFront(f.spot, this.turns);
    if (d) await this.turn(d);
    this.busy = true;
    if (!right) {
      f.node.hop();
      sfx.animal(VOICE[f.name]);
      await this.ctx.say('around.view.that', { who: name });
      if (this.wrongs >= 2) this.hint();
      this.busy = false;
      return;
    }
    f.node.cheer();
    sfx.sparkle();
    const tile = this.tiles.find((t) => t.name === name)!;
    this.ctx.particles.burst(tile.node.x, tile.node.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    this.ctx.pet.cheer();
    await this.ctx.say('around.view.right', { who: name });
    await this.ctx.tw.wait(0.4);
    await this.next();
  }

  // From the sky --------------------------------------------------------------------------

  /** Friends round the tree, one maybe hidden behind it, and three maps of the island from the sky. */
  private async skyScene() {
    const scene = makeSkyScene(this.index, this.ctx.rng, this.hider ?? undefined);
    this.sky = scene;
    const hidden = scene.hidden === null ? null : scene.friends[scene.hidden];
    if (hidden) this.hider = hidden;
    scene.friends.forEach((name, i) => {
      const f = this.addFriend(name, spotFacing(scene.facing[i], this.turns));
      f.node.alpha = 0;
      void this.ctx.tw.to(f.node, { alpha: 1 }, { duration: 0.4 });
    });
    for (const kind of scene.maps) {
      const node = mapArt(kind, scene, this.turns);
      const half = MAP_CARD.size / 2 + 4;
      node.hitArea = new Rectangle(-half, -half, half * 2, half * 2);
      onTap(node, () => void this.skyPick(kind), { cooldown: 400 });
      this.card.addChild(node);
      this.maps.push({ kind, node, tried: false });
    }
    this.resize(this.view);
    await this.ctx.tw.wait(0.5);
    if (hidden) await this.ctx.say('around.sky.hidden', { who: hidden });
    this.busy = false;
    return this.ctx.instruct('around.sky');
  }

  private async skyPick(kind: SkyKind) {
    if (this.busy || this.finished || !this.sky) return;
    const scene = this.sky;
    const card = this.maps.find((m) => m.kind === kind)!;
    card.node.scale.set(0.9);
    void this.ctx.tw.to(card.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    this.busy = true;
    if (kind === 'true') {
      this.hinting = false;
      sfx.whoosh();
      void this.ctx.tw.to(card.node.scale, { x: 1.12, y: 1.12 }, { duration: 0.35, ease: ease.outBack });
      const hidden =
        scene.hidden === null ? null : this.friends.find((f) => f.name === scene.friends[scene.hidden!]);
      if (hidden) {
        hidden.node.hop(1.4);
        sfx.animal(VOICE[hidden.name]);
      }
      this.birdsView();
      this.ctx.pet.cheer();
      await this.ctx.say('around.sky.right');
      await this.ctx.tw.wait(0.4);
      return this.next();
    }
    // A wrong card counts once; tapped again, it just says why again.
    if (!card.tried) {
      card.tried = true;
      this.misses++;
      this.wrongs++;
    }
    sfx.boing();
    if (kind === 'mirror') {
      const sides = scene.friends.filter((_, i) => scene.facing[i] === 1 || scene.facing[i] === 3);
      for (const name of sides) this.friends.find((f) => f.name === name)?.node.hop();
      if (sides.length === 2) await this.ctx.say('around.sky.mirror', { a: sides[0], b: sides[1] });
      else await this.ctx.say('around.sky.mirror.one', { who: sides[0] });
    } else {
      // Show what that map would need: the island turns to match it, then back.
      const d = scene.k === 3 ? -1 : 1;
      await this.turn(d);
      this.busy = true;
      await this.ctx.say('around.sky.turned');
      await this.turn(-d);
      this.busy = true;
    }
    if (this.wrongs >= 2) this.hint();
    this.busy = false;
  }

  /** The bird's view: a cloud puff and two birds drift across the top. */
  private birdsView() {
    const c = new Container();
    c.addChild(
      puffs(
        new Graphics(),
        [
          [-40, 0, 28],
          [0, -12, 34],
          [40, 0, 28],
        ],
        0xffffff,
        0xdcefff,
      ),
    );
    for (const [x, y] of [
      [90, -30],
      [130, -6],
    ])
      c.addChild(
        new Graphics()
          .moveTo(x - 14, y - 6)
          .quadraticCurveTo(x - 6, y - 10, x, y)
          .quadraticCurveTo(x + 6, y - 10, x + 14, y - 6)
          .stroke({ width: 4, color: ink, cap: 'round' }),
      );
    c.position.set(-160, 240);
    this.flyover.addChild(c);
    void this.ctx.tw
      .to(c, { x: this.view.w + 160 }, { duration: 2.4, ease: ease.inOutSine })
      .then(() => c.destroy({ children: true }));
  }

  // Placing -------------------------------------------------------------------------------

  /** Friends wait on the shore for directions: three for one at a time (one spot stays free), four for two pairs. */
  private async fillShore() {
    const count = this.plan.mode === 'two' ? this.plan.rounds * 2 : this.plan.rounds;
    const names = this.ctx.rng
      .shuffle(['duck', 'pig', 'cat', 'bunny', 'cow', 'dog', 'bear'] as CritterName[])
      .slice(0, count);
    for (const name of names) {
      const f = this.addFriend(name, -1);
      f.drag = draggable(f.node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => this.drop(f, x, y),
      });
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
    const [first, second] = nextPair(this.free(), this.turns, this.ctx.rng);
    a.want = first.where;
    b.want = second.where;
    for (const f of [a, b]) {
      f.drag!.enabled = true;
      f.node.hop();
    }
    this.busy = false;
    return this.ctx.instruct('around.two', {
      a: a.name,
      wa: WHERE_WORDS[first.where],
      b: b.name,
      wb: WHERE_WORDS[second.where],
    });
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
    if (this.friends.some((x) => x.want))
      return void this.ctx.say(line, { who: f.name, where: WHERE_WORDS[where] });
    this.busy = true;
    await this.ctx.say(line, { who: f.name, where: WHERE_WORDS[where] });
    if (this.plan.mode === 'two') {
      // Before looking from the other side, she guesses who will be in front: the one behind comes round.
      const coming = frontAfterHalfTurn(this.friends, this.turns);
      const guess = coming ? await this.predict() : null;
      await this.ctx.say('around.otherside');
      await this.turn(2);
      this.busy = true;
      const front = this.friends.find((x) => x.spot >= 0 && whereIs(x.spot, this.turns) === 'front');
      if (front) {
        front.node.cheer();
        if (guess && guess !== front.name) await this.ctx.say('around.cameround');
        await this.ctx.say('around.now', { who: front.name, where: WHERE_WORDS.front });
      }
    }
    this.placeShore();
    await this.ctx.tw.wait(0.3);
    await this.next();
  }

  /** A picture card of the friends on the island: tap who will be in front once the island turns around. */
  private async predict(): Promise<CritterName> {
    this.buildCard(this.friends.filter((f) => f.spot >= 0).map((f) => f.name));
    const guess = new Promise<CritterName>((resolve) => (this.predicting = resolve));
    this.busy = false;
    void this.ctx.instruct('around.predict');
    const name = await guess;
    this.clearCard();
    return name;
  }

  // Help ----------------------------------------------------------------------------------

  private hint() {
    if (this.hinting) return;
    this.hinting = true;
    this.hints++;
    if (this.plan.mode === 'see') return void this.ctx.say('around.see.hint');
    if (this.plan.mode === 'view') return void this.ctx.say('around.view.hint', { who: this.hider! });
    if (this.plan.mode === 'sky') return void this.ctx.say('around.sky.hint');
    if (this.plan.mode !== 'named') return;
    const hider = this.hiderFriend();
    if (hider && namedHintTarget(hider.spot, this.turns) === 'hider')
      void this.ctx.say('around.tapthem', { who: hider.name });
    else void this.ctx.say('around.turn');
  }

  private hiderFriend() {
    return this.friends.find((f) => f.name === this.hider && f.spot >= 0);
  }

  /** A pulsing ring: the arrows or, once in view, the friend asked for (named), the hider's picture (who), or the spots that fit (placing). */
  private drawGlow() {
    const g = this.glow.clear();
    if (!this.hinting || this.busy) return;
    const width = 6 + 2 * Math.sin(this.clock * 6);
    const ring = (x: number, y: number, rx: number, ry = rx) =>
      g.ellipse(x, y, rx, ry).stroke({ width, color: swatch.yellow.fill });
    if (this.plan.mode === 'named') {
      const hider = this.hiderFriend();
      if (hider && namedHintTarget(hider.spot, this.turns) === 'hider')
        ring(hider.node.x, hider.node.y - 60, 90, 110);
      else for (const b of [this.left, this.right]) ring(b.x, b.y, 70);
    } else if (this.plan.mode === 'sky') {
      const m = this.maps.find((x) => x.kind === 'true');
      if (m) ring(m.node.x, m.node.y, MAP_CARD.size / 2 + 14);
    } else if (this.plan.mode === 'see') {
      const f = this.hiderFriend();
      if (f) ring(f.node.x, f.node.y - 60, 90, 110);
    } else if (this.plan.mode === 'who' || this.plan.mode === 'view') {
      const t = this.tiles.find((x) => x.name === this.hider);
      const [rx, ry] = this.plan.mode === 'view' ? [VIEW_CARD.w / 2 + 14, VIEW_CARD.h / 2 + 14] : [78, 82];
      if (t) ring(t.node.x, t.node.y, rx, ry);
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
    c.addChild(
      new Graphics()
        .ellipse(0, -30, 120, 44)
        .fill(wood.fill)
        .stroke({ width: 5, color: wood.line })
        .ellipse(0, -44, 120, 44)
        .fill(swatch.green.light)
        .stroke({ width: 5, color: swatch.green.line }),
    );
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
  const friend = new Critter(
    CRITTERS[rng.pick(['duck', 'pig', 'cat', 'bunny', 'cow', 'dog', 'bear'] as CritterName[])],
  );
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
  challenge: 'space',
  skills: ['object-permanence', 'perspective', 'spatial-words', 'reasoning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Hide a toy behind a cup, then turn the cup around together: "Where did it go? Behind!"',
  offScreen: 'Play hide-and-seek around a chair: "Am I in front of it, behind it, or next to it?"',
  hubIcon: () => new PeekIcon(),
  sticker,
  create: (ctx) => new PeekaroundIsland(ctx),
};
