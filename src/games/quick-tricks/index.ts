import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import { SecondShow } from './second-show';
import { encoreFor } from './second-logic';
import { ThirdShow } from './third-show';
import { showFor, THIRD_NAME } from './third-logic';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  bumpLine,
  castFor,
  friendsFor,
  GAP,
  GAPS,
  idleLeaves,
  ISLAND,
  judgeLeaf,
  leafDrop,
  leafLands,
  leafMiss,
  leavesFor,
  makeSocks,
  makeTwoSocks,
  nextLeaf,
  nextPlank,
  partnerOf,
  partnerSock,
  plankLengths,
  plankToPlace,
  planFor,
  reaches,
  reachesGap,
  sameSock,
  stillWet,
  STRETCH_TO,
  stretchReaches,
  tricksFor,
  twoPlankLengths,
  type Cast,
  type Crosser,
  type Leaf,
  type LeafUp,
  type OnGaps,
  type Sock,
  type Trick,
  type TricksPlan,
} from './logic';
import { rangeFor } from '../../progress/difficulty';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

// ----- drawings -----

function leafArt(width: number): Graphics {
  const h = Math.max(60, width * 0.28);
  return new Graphics()
    .moveTo(-width / 2, 0)
    .quadraticCurveTo(0, -h, width / 2, 0)
    .quadraticCurveTo(0, h * 0.55, -width / 2, 0)
    .fill(swatch.green.fill)
    .stroke(line(swatch.green.line, 5))
    .moveTo(-width / 2 + 16, 0)
    .lineTo(width / 2 - 12, -4)
    .stroke(line(swatch.green.line, 4));
}

function sockArt(sock: Sock, s = 2.2): Graphics {
  const sw = swatch[sock.color];
  const g = new Graphics()
    .moveTo(-12 * s, -30 * s)
    .lineTo(12 * s, -30 * s)
    .lineTo(12 * s, 4 * s)
    .quadraticCurveTo(34 * s, 4 * s, 34 * s, 18 * s)
    .quadraticCurveTo(34 * s, 30 * s, 16 * s, 30 * s)
    .lineTo(-6 * s, 30 * s)
    .quadraticCurveTo(-12 * s, 30 * s, -12 * s, 20 * s)
    .closePath()
    .fill(sw.fill)
    .stroke(line(sw.line, 5));
  if (sock.pattern === 'stripes')
    for (const y of [-22, -12, -2]) g.rect(-11 * s, y * s, 22 * s, 4 * s).fill(0xffffff);
  if (sock.pattern === 'dots')
    for (const [x, y] of [
      [-5, -20],
      [5, -10],
      [-4, 0],
      [18, 18],
      [6, 20],
    ])
      g.circle(x * s, y * s, 3 * s).fill(0xffffff);
  return g;
}

/** The sock monster: a fuzzy ball with a big grin, in the round's colour. */
function monsterArt(color: ColorName): Container {
  const c = new Container();
  const g = new Graphics();
  const ring: [number, number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ring.push([Math.cos(a) * 100, -110 + Math.sin(a) * 100, 30]);
  }
  puffs(g, [...ring, [0, -110, 96]], swatch[color].fill, swatch[color].line);
  g.circle(-36, -140, 22)
    .circle(36, -140, 22)
    .fill(0xffffff)
    .circle(-32, -136, 10)
    .circle(40, -136, 10)
    .fill(ink);
  g.moveTo(-44, -88).quadraticCurveTo(0, -40, 44, -88).closePath().fill(0x7a2e3e);
  g.rect(-30, -86, 16, 12).rect(14, -86, 16, 12).fill(0xffffff);
  c.addChild(g);
  return c;
}

function beetleArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (const x of [-18, 0, 18])
    g.moveTo(x, -10)
      .lineTo(x - 8, 2)
      .stroke(line(ink, 4));
  g.circle(30, -22, 14).fill(ink);
  g.ellipse(0, -26, 34, 24).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
  g.moveTo(0, -50).lineTo(0, -2).stroke(line(ink, 3));
  for (const [x, y] of [
    [-14, -32],
    [14, -32],
    [-12, -16],
    [12, -16],
  ])
    g.circle(x, y, 4).fill(ink);
  g.circle(34, -26, 3).fill(0xffffff);
  c.addChild(g);
  return c;
}

function snailArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-40, -4)
    .lineTo(34, -4)
    .quadraticCurveTo(50, -4, 48, -22)
    .lineTo(44, -40)
    .stroke(line(swatch.yellow.line, 4));
  g.roundRect(-44, -16, 92, 16, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  g.moveTo(40, -16).lineTo(46, -44).moveTo(48, -16).lineTo(58, -40).stroke(line(ink, 3));
  g.circle(46, -46, 4).circle(58, -42, 4).fill(ink);
  g.circle(-6, -36, 28).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
  g.moveTo(-6, -36)
    .arc(-6, -36, 16, 0, Math.PI * 1.6)
    .stroke(line(swatch.orange.line, 4));
  c.addChild(g);
  return c;
}

function ladybugArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (const x of [-16, 0, 16])
    g.moveTo(x, -10)
      .lineTo(x - 8, 2)
      .stroke(line(ink, 4));
  g.circle(30, -20, 13).fill(ink);
  g.circle(0, -24, 30).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
  g.moveTo(0, -54).lineTo(0, 6).stroke(line(ink, 3));
  for (const [x, y] of [
    [-14, -34],
    [14, -34],
    [-16, -16],
    [16, -16],
    [-6, -44],
    [6, -44],
  ])
    g.circle(x, y, 5).fill(ink);
  g.circle(34, -24, 3).fill(0xffffff);
  c.addChild(g);
  return c;
}

const CROSSER_ART: Record<Crosser, () => Container> = {
  beetle: beetleArt,
  snail: snailArt,
  ladybug: ladybugArt,
};

function plankArt(length: number): Graphics {
  return new Graphics().roundRect(0, -12, length, 24, 10).fill(wood.fill).stroke(line(wood.line, 5));
}

/** A little umbrella that pops open over a flower. */
function umbrellaFlower(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(0, 0).lineTo(0, -60).stroke(line(swatch.green.line, 5));
  for (let i = 0; i < 5; i++)
    g.circle(Math.cos((i * Math.PI * 2) / 5) * 12, -60 + Math.sin((i * Math.PI * 2) / 5) * 12, 9).fill(
      swatch.pink.fill,
    );
  g.circle(0, -60, 7).fill(swatch.yellow.fill);
  const umbrella = new Graphics()
    .moveTo(-40, 0)
    .quadraticCurveTo(0, -46, 40, 0)
    .closePath()
    .fill(swatch.blue.fill)
    .stroke(line(swatch.blue.line, 4))
    .moveTo(0, 0)
    .lineTo(0, 30)
    .stroke(line(ink, 3));
  umbrella.label = 'umbrella';
  umbrella.position.set(0, -96);
  umbrella.scale.set(0);
  c.addChild(g, umbrella);
  return c;
}

interface DragItem {
  node: Container;
  drag: DragHandle;
  home: { x: number; y: number };
}

class QuickTricks implements Game {
  readonly plan: TricksPlan;
  /** The round's friends in the rain, the bridge's crosser and the monster's colour, who all bow at the end. */
  readonly cast: Cast;
  /** The show's tricks in order (all three, or two at a tiny show). */
  readonly tricks: Trick[];
  /** Which trick is showing (an index into `tricks`); past the last is the finale. */
  index = -1;
  misses = 0;
  hints = 0;
  /** Mistakes in this trick; the second brings a hint. */
  wrongs = 0;
  /** This trick's one hint has been given (the glow shows). */
  hinted = false;
  busy = true;
  /** The trick is done and the arrow waits for the child. */
  waiting = false;
  finished = false;
  items: DragItem[] = [];

  // Umbrella Up
  friends: Critter[] = [];
  leaves: (DragItem & { leaf: Leaf })[] = [];
  /** Two at once: where each leaf is held up (an offset from the middle), or null. */
  up: LeafUp[] = [];
  // Sock Gobbler
  held: Sock | null = null;
  /** Two at once: the two lost socks, and which have their partner. */
  heldTwo: Sock[] = [];
  paired: boolean[] = [];
  socks: (DragItem & { sock: Sock })[] = [];
  monster: Container | null = null;
  // Bridge Stretch
  handle: DragItem | null = null;
  planks: (DragItem & { length: number })[] = [];
  bridgeLength = 0;
  /** Two at once: the plank (index into `planks`) lying across each gap, or null. */
  onGaps: OnGaps = [];
  /** Springing back after letting go short of the far bank. */
  springing = false;
  beetle: Container | null = null;

  readonly layer = new Container();
  readonly next: RoundButton;
  private readonly back = new Graphics();
  private readonly rain = new Graphics();
  private readonly glow = new Graphics();
  private readonly bridge = new Graphics();
  private drops: { x: number; y: number; v: number }[] = [];
  /** Leaves held up over the friends, which the rain rolls off. */
  private leafAt: { x: number; y: number; width: number }[] = [];
  private wiggle = 0;
  private view: View;
  private clock = 0;
  private waitClock = 0;
  /** A tiny show: quiet time on a trick with nothing moving, before the pet says the instruction again. */
  private quietClock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.cast = castFor(this.plan, ctx.rng);
    this.tricks = tricksFor(this.plan);
    this.next = new RoundButton(arrowIcon(1), swatch.green, 56, () => void this.advance());
    this.next.visible = false;
    // Drawings over the scene must not catch touches meant for what is under them (a hint glow sits on the answer).
    for (const g of [this.rain, this.glow, this.bridge]) g.eventMode = 'none';
    // The bridge is drawn under the scene (so the beetle walks on it) and lives as long as the game.
    ctx.stage.addChild(this.back, this.bridge, this.layer, this.rain, this.glow, this.next);
  }

  get trick(): Trick | 'finale' {
    return this.tricks[this.index] ?? 'finale';
  }

  /** The middle of the stage, where friends stand. */
  private get cx() {
    return this.view.w * 0.36;
  }

  private get groundY() {
    return this.view.h - 110;
  }

  start() {
    void this.ctx.say(this.plan.tiny ? 'tricks.start-two' : 'tricks.start').then(() => this.advance());
  }

  resize(v: View) {
    this.view = v;
    this.next.position.set(v.w - 100, v.h - 100);
    this.drawBack();
  }

  private drawBack() {
    const v = this.view;
    const g = this.back.clear();
    const t = this.trick;
    if (t === 'umbrella') {
      g.rect(0, 0, v.w, v.h)
        .fill(0xc9d9e8)
        .rect(0, this.groundY, v.w, v.h - this.groundY)
        .fill(swatch.green.light);
      const c = this.cx;
      // Three friends stand wider: the cloud stretches over all of them.
      const more: [number, number, number][] =
        this.plan.friends === 3
          ? [
              [c + 230, 130, 62],
              [c + 170, 160, 56],
              [c - 200, 150, 50],
            ]
          : [];
      puffs(
        g,
        [[c - 120, 130, 60], [c, 110, 80], [c + 120, 130, 60], [c - 50, 160, 56], [c + 60, 160, 56], ...more],
        0xeef2f6,
        0x9fb1c2,
      );
    } else if (t === 'socks') {
      g.rect(0, 0, v.w, v.h)
        .fill(0xfff1d6)
        .rect(0, this.groundY, v.w, v.h - this.groundY)
        .fill(wood.light);
      g.moveTo(v.w * 0.52, 150)
        .quadraticCurveTo(v.w * 0.76, 190, v.w - 40, 150)
        .stroke(line(0x9c8a7a, 4));
    } else if (t === 'bridge') {
      const bankY = this.bankY;
      const [l, r] = this.banks;
      g.rect(0, 0, v.w, v.h)
        .fill(0xbfe6ff)
        .rect(0, bankY + 40, v.w, v.h)
        .fill(swatch.blue.fill);
      g.roundRect(-20, bankY, l + 20, v.h - bankY + 20, 20)
        .fill(swatch.green.fill)
        .stroke(line(swatch.green.line));
      g.roundRect(r, bankY, v.w - r + 20, v.h - bankY + 20, 20)
        .fill(swatch.green.fill)
        .stroke(line(swatch.green.line));
      // Two at once: a little island splits the river into a narrow and a wide gap.
      if (this.plan.bridge === 'two')
        g.roundRect(this.gap(0)[1], bankY, ISLAND, v.h * 0.2, 20)
          .fill(swatch.green.fill)
          .stroke(line(swatch.green.line));
    }
  }

  private get bankY() {
    return this.view.h * 0.56;
  }

  /** The near and far edges of the river (with two gaps, the island between them). */
  private get banks(): [number, number] {
    if (this.plan.bridge === 'two') return [this.cx - 220, this.cx - 220 + GAPS[0] + ISLAND + GAPS[1]];
    return [this.cx - GAP / 2, this.cx + GAP / 2];
  }

  /** Two at once: the near and far edges of gap g (0 the narrow one, 1 the wide one). */
  private gap(g: number): [number, number] {
    const lo = this.banks[0] + (g === 0 ? 0 : GAPS[0] + ISLAND);
    return [lo, lo + GAPS[g]];
  }

  // ----- moving between tricks -----

  private async advance() {
    // The arrow only moves on once the trick is done (a hidden button can still catch a tap).
    if (this.finished || (this.index >= 0 && !this.waiting)) return;
    this.next.visible = false;
    this.waiting = false;
    await this.clearTrick();
    this.index++;
    this.wrongs = 0;
    this.hinted = false;
    this.busy = true;
    this.drawBack();
    const t = this.trick;
    if (t === 'umbrella') await this.setUmbrella();
    else if (t === 'socks') await this.setSocks();
    else if (t === 'bridge') await this.setBridge();
    else return this.finale();
    this.busy = false;
  }

  private async clearTrick() {
    for (const item of this.items) item.drag.destroy();
    this.items = [];
    this.leaves = [];
    this.socks = [];
    this.planks = [];
    this.handle = null;
    this.up = [];
    this.heldTwo = [];
    this.paired = [];
    this.onGaps = [];
    for (const f of this.friends) this.ctx.untrack(f);
    this.friends = [];
    this.monster = null;
    this.beetle = null;
    this.drops = [];
    this.leafAt = [];
    this.rain.clear();
    this.bridge.clear();
    if (this.layer.children.length) await this.ctx.tw.to(this.layer, { alpha: 0 }, { duration: 0.25 });
    this.layer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.layer.alpha = 1;
  }

  /** The trick worked: a payoff, then the arrow for the next one. */
  private async done(line: Parameters<GameContext['say']>[0]) {
    this.busy = true;
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say(line);
    await this.ctx.tw.wait(0.6);
    this.waiting = true;
    this.waitClock = 0;
    this.next.visible = true;
    this.next.scale.set(0);
    void this.ctx.tw.to(this.next.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private miss() {
    this.misses++;
    this.wrongs++;
    if (this.wrongs === 2) this.hint();
    sfx.boing();
  }

  /** At most one hint per trick: the glow lights the answer. */
  private hint() {
    if (this.hinted) return;
    this.hinted = true;
    this.hints++;
  }

  private addDrag(
    node: Container,
    x: number,
    y: number,
    onDrop: (x: number, y: number) => boolean,
    hit: Rectangle,
    onPick?: () => void,
  ): DragItem {
    node.position.set(x, y);
    node.hitArea = hit;
    const item = { node, home: { x, y } } as DragItem;
    item.drag = draggable(node, this.ctx.tw, {
      onPick: () => {
        sfx.tick();
        onPick?.();
      },
      onDrop,
    });
    this.layer.addChild(node);
    this.items.push(item);
    return item;
  }

  // ----- Umbrella Up -----

  private async setUmbrella() {
    const offsets = friendsFor(this.plan);
    this.friends = offsets.map((dx, i) => {
      const c = this.ctx.track(new Critter(CRITTERS[this.cast.friends[i]]));
      c.scale.set(0.5);
      c.position.set(this.cx + dx, this.groundY);
      c.setMood('sad');
      this.layer.addChild(c);
      return c;
    });
    const flower = umbrellaFlower();
    flower.label = 'flower';
    flower.position.set(this.cx + ({ 1: 190, 2: 290, 3: 370 } as const)[this.plan.friends], this.groundY);
    this.layer.addChild(flower);
    const leaves = leavesFor(this.plan);
    this.up = leaves.map(() => null);
    leaves.forEach((leaf, i) => {
      // Leaves wait on the right, out of the rain.
      const x = this.view.w - 40 - leaf.width / 2;
      const y = 300 + i * 140;
      const node = new Container();
      node.addChild(leafArt(leaf.width));
      // Two at once: a leaf already up can be lifted down again (revision is free).
      const lift = this.plan.two ? () => this.liftLeaf(i) : undefined;
      const item = this.addDrag(
        node,
        x,
        y,
        (lx, ly) => this.dropLeaf(item as DragItem & { leaf: Leaf }, lx, ly),
        new Rectangle(-Math.max(60, leaf.width / 2), -60, Math.max(120, leaf.width), 110),
        lift,
      );
      Object.assign(item, { leaf });
      this.leaves.push(item as DragItem & { leaf: Leaf });
    });
    await this.ctx.instruct(
      this.plan.friends === 1
        ? `tricks.umbrella-${this.cast.friends[0]}`
        : this.plan.two
          ? 'tricks.umbrella-three'
          : 'tricks.umbrella-two',
    );
  }

  /** Friends' head height and the cloud's bottom. */
  private get rainSpan() {
    return { top: this.groundY - 125, sky: 200 };
  }

  private dropLeaf(item: DragItem & { leaf: Leaf }, x: number, y: number): boolean {
    if (this.busy || this.waiting) return false;
    if (this.plan.two) return this.dropLeafTwo(item, x, y);
    const { top, sky } = this.rainSpan;
    const result = leafLands(
      this.plan,
      judgeLeaf(item.leaf, x - this.cx, y, friendsFor(this.plan), top, sky),
    );
    if (result === 'away') return false;
    if (result === 'below') {
      // In front of the friends, not over them. At the first level that is a free try: the rain shows it.
      if (leafMiss(this.plan, result)) this.miss();
      else sfx.boing();
      void this.ctx.say(
        this.plan.friends === 1 ? `tricks.above-${this.cast.friends[0]}` : 'tricks.above-two',
      );
      return false;
    }
    if (result === 'partly') {
      this.miss();
      void this.ctx.say('tricks.still-wet');
      return false;
    }
    // Up it goes, over everyone: the rain rolls off onto the flower, which opens an umbrella of its own. A tiny show's leaf
    // (perhaps dropped in front) floats up right over the friend.
    const at = { x: this.plan.tiny ? this.cx + friendsFor(this.plan)[0] : x, y: top - 40 };
    void this.ctx.tw.to(item.node, at, { duration: 0.2, ease: ease.outQuad });
    item.drag.enabled = false;
    this.leafAt = [{ x: at.x, y: at.y, width: item.leaf.width }];
    this.allDry();
    return true;
  }

  /** Everyone is under a leaf: the rain rolls off onto the flower, which opens an umbrella of its own. */
  private allDry() {
    for (const f of this.friends) {
      f.setMood('happy', 3);
      f.cheer();
    }
    const flower = this.layer.getChildByLabel('flower')!;
    const umbrella = flower.getChildByLabel('umbrella')!;
    void this.ctx.tw.wait(0.8).then(() => {
      sfx.pop(9);
      return this.ctx.tw.to(umbrella.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    });
    void this.done('tricks.dry');
  }

  /**
   * Two at once: a leaf over some friends stays up (no miss) and the pet says who is still wet. With both leaves up and someone
   * still wet, a leaf has to move: the pet says so and the glow shows which one and where (counted as the trick's hint).
   */
  private dropLeafTwo(item: DragItem & { leaf: Leaf }, x: number, y: number): boolean {
    const { top, sky } = this.rainSpan;
    const result = judgeLeaf(item.leaf, x - this.cx, y, friendsFor(this.plan), top, sky);
    if (result === 'away') return false;
    if (result === 'below') {
      this.miss();
      void this.ctx.say('tricks.above-two');
      return false;
    }
    const i = this.leaves.indexOf(item);
    this.up[i] = x - this.cx;
    const idle = idleLeaves(this.plan, this.up, i);
    if (idle.includes(i)) {
      // Over friends another leaf already keeps dry: it floats home (free) rather than hide under that leaf.
      this.up[i] = null;
      void this.ctx.say(`tricks.wet-${this.cast.friends[this.showDry()[0]]}`);
      return false;
    }
    void this.ctx.tw.to(item.node, { x, y: top - 40 }, { duration: 0.2, ease: ease.outQuad });
    sfx.pop(5);
    for (const l of idle) {
      this.up[l] = null;
      void this.leaves[l].drag.floatHome();
    }
    const wet = this.showDry();
    if (!wet.length) {
      for (const l of this.leaves) l.drag.enabled = false;
      this.allDry();
    } else if (this.up.every((u) => u !== null)) {
      this.hint();
      void this.ctx.say('tricks.leaf-move');
    } else void this.ctx.say(`tricks.wet-${this.cast.friends[wet[0]]}`);
    return true;
  }

  /** A leaf that was up is picked up again: whoever it covered gets wet. */
  private liftLeaf(i: number) {
    if (this.up[i] === null || this.busy || this.waiting) return;
    this.up[i] = null;
    this.showDry();
  }

  /** Moods and the rain follow the leaves that are up; returns who is still wet. */
  private showDry(): number[] {
    const wet = stillWet(this.plan, this.up);
    const { top } = this.rainSpan;
    const leaves = leavesFor(this.plan);
    this.leafAt = this.up.flatMap((u, l) =>
      u === null ? [] : [{ x: this.cx + u, y: top - 40, width: leaves[l].width }],
    );
    this.friends.forEach((f, i) => f.setMood(wet.includes(i) ? 'sad' : 'happy'));
    return wet;
  }

  private updateRain(dt: number) {
    const g = this.rain.clear();
    if (this.trick !== 'umbrella' || this.finished) return;
    const { sky } = this.rainSpan;
    const offsets = friendsFor(this.plan);
    const mid = this.cx + (Math.min(...offsets) + Math.max(...offsets)) / 2;
    const spread = this.plan.two ? Math.max(...offsets) - Math.min(...offsets) + 420 : 420;
    const more = this.plan.two ? 1.5 : 1;
    if (this.drops.length < 40 * more && Math.random() < dt * 30 * more)
      this.drops.push({ x: mid + (Math.random() - 0.5) * spread, y: sky, v: 420 + Math.random() * 120 });
    for (const d of this.drops) {
      d.y += d.v * dt;
      const leaf = this.leafAt.find((l) => Math.abs(d.x - l.x) < l.width / 2);
      // Under the leaf: drops roll off its edge to the side.
      if (leaf && d.y > leaf.y - 20 && d.y < leaf.y + 10) {
        d.x += (d.x > leaf.x ? 1 : -1) * 600 * dt;
        d.y = leaf.y - 14;
      }
      g.moveTo(d.x, d.y)
        .lineTo(d.x - 2, d.y + 12)
        .stroke(line(swatch.blue.fill, 4));
    }
    this.drops = this.drops.filter((d) => d.y < this.groundY + 10);
  }

  // ----- Sock Gobbler -----

  private async setSocks() {
    const two = this.plan.two ? makeTwoSocks(this.ctx.rng) : null;
    const { held, choices } = two ?? makeSocks(this.plan, this.ctx.rng);
    this.held = held instanceof Array ? held[0] : held;
    this.heldTwo = two ? [...two.held] : [];
    this.paired = this.heldTwo.map(() => false);
    const m = monsterArt(this.cast.monster);
    m.position.set(this.cx - 40, this.groundY);
    // The lost sock in one hand (two at once: one in each hand).
    (two ? two.held : [this.held]).forEach((sock, k) => {
      const holding = sockArt(sock, 1.6);
      holding.label = `held${k}`;
      holding.position.set(k === 0 ? 120 : -150, -120);
      holding.rotation = k === 0 ? 0.3 : -0.3;
      m.addChild(holding);
    });
    this.layer.addChild(m);
    this.monster = m;
    const v = this.view;
    // Up to four socks in a row; five go in two rows (three over two) so each stays easy to grab.
    const rows = choices.length > 4 ? [choices.slice(0, 3), choices.slice(3)] : [choices];
    const across = rows[0].length;
    const spots = rows.flatMap((row, r) =>
      row.map((_, i) => ({
        x: v.w * 0.56 + ((i + 0.5 + (r === 1 ? 0.5 : 0)) * (v.w * 0.42)) / across,
        y: 260 + r * 190,
      })),
    );
    choices.forEach((sock, i) => {
      const node = new Container();
      node.addChild(sockArt(sock));
      const item = this.addDrag(
        node,
        spots[i].x,
        spots[i].y,
        (x, y) => this.dropSock(item as DragItem & { sock: Sock }, x, y),
        new Rectangle(-60, -80, 140, 160),
      );
      Object.assign(item, { sock });
      this.socks.push(item as DragItem & { sock: Sock });
    });
    await this.ctx.instruct(
      two ? 'tricks.socks-two' : this.plan.patterns ? 'tricks.socks-both' : 'tricks.socks',
    );
  }

  private dropSock(item: DragItem & { sock: Sock }, x: number, y: number): boolean {
    if (this.busy || this.waiting || !this.monster) return false;
    const m = this.monster;
    if (Math.hypot(x - m.x, y - (m.y - 110)) > 190) return false;
    if (this.plan.two) return this.dropSockTwo(item);
    if (!sameSock(item.sock, this.held!)) {
      this.miss();
      m.rotation = 0;
      void this.ctx.tw
        .to(m, { rotation: 0.12 }, { duration: 0.08 })
        .then(() => this.ctx.tw.to(m, { rotation: -0.12 }, { duration: 0.12 }))
        .then(() => this.ctx.tw.to(m, { rotation: 0 }, { duration: 0.08 }));
      void this.ctx.say(item.sock.color !== this.held!.color ? 'tricks.not-color' : 'tricks.not-pattern');
      return false;
    }
    // A pair! It wears them on its head like ears and wiggles.
    item.drag.enabled = false;
    item.node.visible = false;
    this.wearPair(this.held!, 0);
    void this.done('tricks.partner');
    return true;
  }

  /** The monster takes the lost sock out of its hand and wears the pair on its head like ears (the second pair lower down). */
  private wearPair(sock: Sock, k: number) {
    const m = this.monster!;
    m.getChildByLabel(`held${k}`)?.destroy();
    for (const side of [-1, 1]) {
      const ear = sockArt(sock, 1.5);
      ear.position.set(side * (k === 0 ? 56 : 116), k === 0 ? -214 : -170);
      ear.rotation = side * (k === 0 ? 0.5 : 1.1) + Math.PI;
      m.addChild(ear);
    }
    this.wiggle = 2.5;
    sfx.giggle();
  }

  /** Two at once: a partner for either lost sock makes its pair; the other still waits. */
  private dropSockTwo(item: DragItem & { sock: Sock }): boolean {
    const m = this.monster!;
    const k = partnerOf(this.heldTwo, this.paired, item.sock);
    if (k < 0) {
      this.miss();
      m.rotation = 0;
      void this.ctx.tw
        .to(m, { rotation: 0.12 }, { duration: 0.08 })
        .then(() => this.ctx.tw.to(m, { rotation: -0.12 }, { duration: 0.12 }))
        .then(() => this.ctx.tw.to(m, { rotation: 0 }, { duration: 0.08 }));
      const lost = this.heldTwo.filter((_, i) => !this.paired[i]);
      void this.ctx.say(
        lost.some((h) => h.color === item.sock.color) ? 'tricks.not-pattern' : 'tricks.not-color',
      );
      return false;
    }
    this.paired[k] = true;
    item.drag.enabled = false;
    item.node.visible = false;
    this.wearPair(this.heldTwo[k], k);
    if (this.paired.every(Boolean)) void this.done('tricks.partner');
    else void this.ctx.say('tricks.one-pair');
    return true;
  }

  // ----- Bridge Stretch -----

  private async setBridge() {
    const [l, r] = this.banks;
    const y = this.bankY;
    const beetle = CROSSER_ART[this.cast.crosser]();
    beetle.position.set(l - 90, y);
    this.layer.addChild(beetle);
    this.beetle = beetle;
    if (this.plan.bridge === 'two') {
      const lengths = twoPlankLengths(this.ctx.rng);
      this.onGaps = GAPS.map(() => null);
      const v = this.view;
      lengths.forEach((length, i) => {
        const node = new Container();
        const art = plankArt(length);
        art.x = -length / 2;
        node.addChild(art);
        const home = { x: Math.min(v.w - length / 2 - 30, r + 30 + length / 2), y: y + 70 + i * 112 };
        // A plank lying across a gap can be lifted off again for free; picking it up frees its gap.
        const item = this.addDrag(
          node,
          home.x,
          home.y,
          (x, py) => this.placePlankTwo(item as DragItem & { length: number }, x, py),
          new Rectangle(-Math.max(60, length / 2), -55, Math.max(120, length), 110),
          () => {
            const was = this.onGaps.indexOf(i);
            if (was >= 0 && !this.busy) this.onGaps[was] = null;
          },
        );
        Object.assign(item, { length });
        this.planks.push(item as DragItem & { length: number });
      });
      await this.ctx.instruct(`tricks.bridge-two-${this.cast.crosser}`);
    } else if (this.plan.bridge === 'stretch') {
      this.bridgeLength = 80;
      const node = new Container();
      node.addChild(
        new Graphics().circle(0, 0, 30).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line)),
      );
      const item = this.addDrag(
        node,
        l + this.bridgeLength,
        y,
        (x) => this.letGo(x),
        new Rectangle(-55, -55, 110, 110),
      );
      item.drag.home = { x: l + 80, y };
      this.handle = item;
      // The handle rides 40 above the finger; the plank follows it along the bank's level.
      node.on('globalpointermove', () => {
        if (item.drag.dragging) this.bridgeLength = Math.max(60, Math.min(GAP + 160, node.x - l));
      });
      await this.ctx.instruct(`tricks.bridge-${this.cast.crosser}`);
    } else {
      plankLengths(this.ctx.rng).forEach((length, i) => {
        const node = new Container();
        const art = plankArt(length);
        art.x = -length / 2;
        node.addChild(art);
        const item = this.addDrag(
          node,
          r + 60 + Math.max(length, 200) / 2,
          y + 130 + i * 0,
          (x, py) => this.placePlank(item as DragItem & { length: number }, x, py),
          new Rectangle(-Math.max(60, length / 2), -55, Math.max(120, length), 110),
        );
        Object.assign(item, { length });
        this.planks.push(item as DragItem & { length: number });
      });
      // Spread the planks out on the far bank and below it, so each is easy to grab.
      const v = this.view;
      this.planks.forEach((p, i) => {
        p.home = { x: Math.min(v.w - p.length / 2 - 30, r + 30 + p.length / 2), y: y + 80 + i * 95 };
        p.drag.home = p.home;
        p.node.position.set(p.home.x, p.home.y);
      });
      await this.ctx.instruct(`tricks.bridge-choose-${this.cast.crosser}`);
    }
  }

  private letGo(x: number): boolean {
    if (this.busy || this.waiting) return false;
    const [l] = this.banks;
    const length = x - l;
    if (stretchReaches(this.plan, length)) {
      this.bridgeLength = GAP + 40;
      this.handle!.node.position.set(l + this.bridgeLength, this.bankY);
      this.handle!.drag.enabled = false;
      void this.cross();
      return true;
    }
    // Boing: it springs back short (the frame loop shrinks it).
    this.springing = true;
    if (this.plan.countShort) this.miss();
    else sfx.boing();
    void this.ctx.say('tricks.too-short');
    return false;
  }

  private placePlank(item: DragItem & { length: number }, x: number, y: number): boolean {
    if (this.busy || this.waiting) return false;
    const [l, r] = this.banks;
    if (x < l - 80 || x > r + 80 || Math.abs(y - this.bankY) > 160) return false;
    if (!reaches(item.length)) {
      this.miss();
      void this.ctx.say('tricks.too-short-choose');
      return false;
    }
    item.drag.enabled = false;
    void this.ctx.tw.to(item.node, { x: l + item.length / 2 - 10, y: this.bankY }, { duration: 0.2 });
    void this.cross();
    return true;
  }

  /**
   * Two at once: a plank dropped over a gap that reaches it lies across; one too short is a miss, and if the plank it needs is lying
   * across the other gap the pet says that one could move. A gap that already holds a plank sends a new one home for free.
   */
  private placePlankTwo(item: DragItem & { length: number }, x: number, y: number): boolean {
    if (this.busy || this.waiting || Math.abs(y - this.bankY) > 160) return false;
    const near = GAPS.map((_, g) => this.gap(g))
      .map(([lo, hi], g) => ({ g, d: Math.abs(x - (lo + hi) / 2), ok: x > lo - 60 && x < hi + 60 }))
      .filter((c) => c.ok);
    if (!near.length) return false;
    const g = near.sort((a, b) => a.d - b.d)[0].g;
    if (this.onGaps[g] !== null) return false;
    const i = this.planks.indexOf(item);
    const lengths = this.planks.map((p) => p.length);
    if (!reachesGap(item.length, GAPS[g])) {
      this.miss();
      void this.ctx.say(
        bumpLine(lengths, i, g, this.onGaps) === 'move' ? 'tricks.plank-move' : 'tricks.too-short-choose',
      );
      return false;
    }
    this.onGaps[g] = i;
    const [lo, hi] = this.gap(g);
    void this.ctx.tw.to(item.node, { x: (lo + hi) / 2, y: this.bankY }, { duration: 0.2 });
    if (this.onGaps.every((p) => p !== null)) {
      for (const p of this.planks) p.drag.enabled = false;
      void this.cross();
    } else {
      sfx.clunk();
      void this.ctx.say('tricks.one-gap');
    }
    return true;
  }

  /** The beetle trundles across, and the bridge takes a bow. */
  private async cross() {
    this.busy = true;
    sfx.clunk();
    const [, r] = this.banks;
    const b = this.beetle!;
    await this.ctx.tw.to(b, { x: r + 110 }, { duration: 1.6, ease: ease.inOutSine });
    this.wiggle = 2;
    sfx.giggle();
    await this.done('tricks.across');
  }

  // ----- the frame loop -----

  update(dt: number) {
    this.clock += dt;
    this.updateRain(dt);
    const [l] = this.banks;
    const b = this.bridge.clear();
    if (this.trick === 'bridge' && this.plan.bridge === 'stretch' && !this.finished) {
      // A springy plank from the near bank to the handle, sagging a little.
      if (this.springing && !this.handle?.drag.dragging) {
        this.bridgeLength += (80 - this.bridgeLength) * Math.min(1, dt * 12);
        if (this.bridgeLength < 82) this.springing = false;
      }
      const len = this.bridgeLength;
      const sag = this.wiggle > 0 ? 18 * Math.sin(this.clock * 10) * Math.min(1, this.wiggle) : 6;
      b.moveTo(l - 10, this.bankY)
        .quadraticCurveTo(l + len / 2, this.bankY + sag, l + len, this.bankY)
        .stroke(line(wood.line, 30))
        .moveTo(l - 10, this.bankY)
        .quadraticCurveTo(l + len / 2, this.bankY + sag, l + len, this.bankY)
        .stroke(line(wood.fill, 20));
      if (this.handle && !this.handle.drag.dragging && this.handle.drag.enabled) this.handle.node.x = l + len;
      if (this.handle?.drag.dragging) this.handle.node.y = this.bankY - 40;
    }
    if (this.monster && this.wiggle > 0)
      this.monster.rotation = 0.1 * Math.sin(this.clock * 14) * Math.min(1, this.wiggle);
    this.wiggle = Math.max(0, this.wiggle - dt);
    if (this.waiting) {
      this.waitClock += dt;
      if (this.waitClock > 10) {
        this.waitClock = 0;
        void this.ctx.say('tricks.next');
      }
    }
    if (this.plan.tiny) this.sayAgainWhenQuiet(dt);
    this.drawGlow();
  }

  /** A tiny show has no misses and so no hint: after ten quiet seconds on a trick the pet says what to do again instead. */
  private sayAgainWhenQuiet(dt: number) {
    const t = this.trick;
    if (
      this.busy ||
      this.waiting ||
      this.finished ||
      this.springing ||
      this.items.some((i) => i.drag.dragging) ||
      (t !== 'umbrella' && t !== 'bridge')
    ) {
      this.quietClock = 0;
      return;
    }
    this.quietClock += dt;
    if (this.quietClock < 10) return;
    this.quietClock = 0;
    void this.ctx.say(
      t === 'umbrella' ? `tricks.umbrella-${this.cast.friends[0]}` : `tricks.bridge-${this.cast.crosser}`,
    );
  }

  private drawGlow() {
    const g = this.glow.clear();
    // Nothing to light between tricks (the pieces are cleared before the next trick's are set).
    if (!this.hinted || this.waiting || this.finished || !this.items.length) return;
    const a = 0.5 + 0.35 * Math.sin(this.clock * 6);
    const t = this.trick;
    if (this.plan.two) return this.drawGlowTwo(g, a);
    if (t === 'umbrella') {
      const { top } = this.rainSpan;
      const offsets = friendsFor(this.plan);
      const mid = this.cx + offsets.reduce((s, o) => s + o, 0) / offsets.length;
      g.ellipse(mid, top - 40, this.plan.friends === 2 ? 230 : 130, 40).fill({ color: 0xfff3a0, alpha: a });
      const big = this.leaves.at(-1);
      if (big && this.plan.friends === 2)
        g.ellipse(big.home.x, big.home.y, big.leaf.width / 2 + 20, 60).fill({ color: 0xfff3a0, alpha: a });
    } else if (t === 'socks') {
      const partner = this.socks.find((s) => sameSock(s.sock, this.held!));
      if (partner)
        g.roundRect(partner.home.x - 70, partner.home.y - 85, 150, 170, 24).fill({
          color: 0xfff3a0,
          alpha: a,
        });
    } else if (t === 'bridge') {
      const [, r] = this.banks;
      if (this.plan.bridge === 'stretch')
        g.circle(r + 50, this.bankY, 60).fill({ color: 0xfff3a0, alpha: a });
      const right = this.planks.find((p) => reaches(p.length));
      if (right)
        g.roundRect(right.home.x - right.length / 2 - 14, right.home.y - 34, right.length + 28, 68, 20).fill({
          color: 0xfff3a0,
          alpha: a,
        });
    }
  }

  /** Two at once: the glow lights the next unfinished target and the piece that goes there, wherever it is now. */
  private drawGlowTwo(g: Graphics, a: number) {
    const fill = { color: 0xfff3a0, alpha: a };
    const t = this.trick;
    if (t === 'umbrella') {
      const move = nextLeaf(this.plan, this.up);
      if (!move) return;
      const leaf = this.leaves[move.leaf];
      g.ellipse(this.cx + move.x, this.rainSpan.top - 40, leaf.leaf.width / 2 + 30, 40).fill(fill);
      g.ellipse(leaf.node.x, leaf.node.y, leaf.leaf.width / 2 + 20, 60).fill(fill);
    } else if (t === 'socks') {
      const partner = this.socks.find(
        (s) => s.node.visible && partnerOf(this.heldTwo, this.paired, s.sock) >= 0,
      );
      if (partner) g.roundRect(partner.home.x - 70, partner.home.y - 85, 150, 170, 24).fill(fill);
    } else if (t === 'bridge') {
      const move = nextPlank(
        this.planks.map((p) => p.length),
        this.onGaps,
      );
      if (!move) return;
      const [lo, hi] = this.gap(move.gap);
      g.roundRect(lo - 10, this.bankY - 30, hi - lo + 20, 60, 20).fill(fill);
      const p = this.planks[move.plank];
      g.roundRect(p.node.x - p.length / 2 - 14, p.node.y - 34, p.length + 28, 68, 20).fill(fill);
    }
  }

  // ----- the finale -----

  private async finale() {
    this.finished = true;
    const v = this.view;
    this.back
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(0xffe3f1)
      .rect(0, this.groundY, v.w, v.h - this.groundY)
      .fill(swatch.green.light);
    // Everyone from the show takes a bow together.
    const cast: Container[] = [];
    const friends = this.cast.friends.map((kind) => {
      const f = this.ctx.track(new Critter(CRITTERS[kind]));
      f.scale.set(0.5);
      f.setMood('happy');
      return f;
    });
    // Only those who were in this show bow (a tiny show has no sock monster).
    const monster = this.tricks.includes('socks') ? [monsterArt(this.cast.monster)] : [];
    for (const m of monster) m.scale.set(0.7);
    const crosser = CROSSER_ART[this.cast.crosser]();
    crosser.scale.set(1.4);
    cast.push(...friends, ...monster, crosser);
    cast.forEach((c, i) => {
      c.position.set(v.w * (0.5 + (i - (cast.length - 1) / 2) * (0.66 / cast.length)), this.groundY + 20);
      this.layer.addChild(c);
      void this.ctx.tw
        .wait(0.3 + i * 0.25)
        .then(() => this.ctx.tw.to(c, { y: c.y - 30 }, { duration: 0.2, ease: ease.outQuad }))
        .then(() => this.ctx.tw.to(c, { y: c.y + 30 }, { duration: 0.25, ease: ease.inQuad }));
    });
    this.friends = friends;
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(v.w / 2, v.h * 0.3, {
      kind: 'confetti',
      colors,
      count: 70,
      speed: [200, 600],
      gravity: 600,
      life: [1.2, 2],
    });
    sfx.tada();
    await this.ctx.say('tricks.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /**
   * The ghost finger: carry the leaf that covers everyone over the friends, the partner sock to the monster, and a stretched handle or
   * the long enough plank across the river; then the green arrow once the trick has had its payoff.
   */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.waiting) return { tap: { on: this.next } };
    if (this.busy || this.springing) return null;
    if (this.plan.two) return this.autotouchTwo();
    switch (this.trick) {
      case 'umbrella': {
        const drop = leafDrop(this.plan, this.rainSpan.top);
        return {
          drag: { on: this.leaves[drop.leaf].node },
          to: { on: this.layer, x: this.cx + drop.x, y: drop.y },
        };
      }
      case 'socks': {
        const sock =
          this.socks[
            partnerSock(
              this.held!,
              this.socks.map((s) => s.sock),
            )
          ];
        return sock && this.monster
          ? { drag: { on: sock.node }, to: { on: this.monster, x: 0, y: -110 } }
          : null;
      }
      case 'bridge': {
        if (this.handle)
          return {
            drag: { on: this.handle.node },
            to: { on: this.layer, x: this.banks[0] + STRETCH_TO, y: this.bankY - 40 },
          };
        const plank = this.planks[plankToPlace(this.planks.map((p) => p.length))];
        return plank ? { drag: { on: plank.node }, to: { on: this.layer, x: this.cx, y: this.bankY } } : null;
      }
      default:
        return null;
    }
  }

  /** The ghost finger at Two at once: the wider leaf over the pair, then the small one over the friend on their own; each partner sock; the middle and long planks to their gaps. */
  private autotouchTwo(): TouchIntent | null {
    switch (this.trick) {
      case 'umbrella': {
        const move = nextLeaf(this.plan, this.up);
        return move
          ? {
              drag: { on: this.leaves[move.leaf].node },
              to: { on: this.layer, x: this.cx + move.x, y: this.rainSpan.top - 40 },
            }
          : null;
      }
      case 'socks': {
        const sock = this.socks.find(
          (s) => s.node.visible && partnerOf(this.heldTwo, this.paired, s.sock) >= 0,
        );
        return sock && this.monster
          ? { drag: { on: sock.node }, to: { on: this.monster, x: 0, y: -110 } }
          : null;
      }
      case 'bridge': {
        const move = nextPlank(
          this.planks.map((p) => p.length),
          this.onGaps,
        );
        if (!move) return null;
        const [lo, hi] = this.gap(move.gap);
        return {
          drag: { on: this.planks[move.plank].node },
          to: { on: this.layer, x: (lo + hi) / 2, y: this.bankY },
        };
      }
      default:
        return null;
    }
  }

  destroy() {
    for (const item of this.items) item.drag.destroy();
  }
}

/** A curtain with a sock, a leaf and a little bridge peeking out, for the hub and stickers. */
function showArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics()
    .roundRect(-110, -200, 220, 200, 20)
    .fill(swatch.red.fill)
    .stroke(line(swatch.red.line));
  g.roundRect(-96, -186, 192, 176, 14).fill(0xfff1d6);
  c.addChild(g);
  const leaf = leafArt(110);
  leaf.position.set(-40, -140);
  const sock = sockArt(
    {
      color: rng.pick(['blue', 'yellow', 'purple'] as const),
      pattern: rng.pick(['stripes', 'dots'] as const),
    },
    1,
  );
  sock.position.set(44, -110);
  const plank = plankArt(130);
  plank.position.set(-65, -40);
  c.addChild(leaf, sock, plank);
  c.hitArea = new Circle(0, -100, 110);
  return c;
}

export const quickTricks: GameModule = {
  id: 'quick-tricks',
  name: 'Quick Tricks',
  titleLine: 'game.quick-tricks',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['spatial-words', 'matching', 'length', 'problem-solving'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [8],
  describeLevel: (level) =>
    showFor(level) === 'second'
      ? encoreFor(level).name
      : showFor(level) === 'third'
        ? THIRD_NAME
        : planFor(level).name,
  music: STYLES.stickers,
  touchDemo: true,
  coplayHint: 'Be the audience! Clap after each trick and ask {name} what happened.',
  offScreen:
    'Put on a tiny show: keep a toy dry under a leaf, match a pair of socks, make a bridge from a book.',
  hubIcon: () => new WigglyIcon(showArt(1)),
  sticker: (seed) => showArt(seed),
  create: (ctx) =>
    showFor(ctx.level) === 'second'
      ? new SecondShow(ctx)
      : showFor(ctx.level) === 'third'
        ? new ThirdShow(ctx)
        : new QuickTricks(ctx),
};
