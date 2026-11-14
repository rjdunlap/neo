import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { prop, type PropKind } from '../../art/props';
import { flower, shapePath, SHAPES, MORE_SHAPES, type ShapeKind } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { nextSpot, routeStep } from '../../couch/focus';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  FLOWER,
  LEVELS,
  LOOKS,
  flowersIn,
  free,
  freeTiles,
  fullMask,
  heldSides,
  isFlower,
  lessonFor,
  makeBoard,
  matches,
  opensAtEnds,
  pairs,
  peekStacks,
  pickLook,
  planFor,
  present,
  removePair,
  reshuffle,
  solve,
  takeOf,
  type Pair,
  type Tile,
} from './logic';

const SHAPE_ART: readonly string[] = [...SHAPES, ...MORE_SHAPES];
/**
 * One of the four flower drawings inside the family's shared frame, a ring of pale pink petals: the frame says
 * "a flower, so it pairs with any flower", and the four flowers differ in petal count, outline and colour.
 */
function flowerArt(n: number) {
  const g = new Graphics();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    g.circle(Math.cos(a) * 29, Math.sin(a) * 29, 8);
  }
  g.fill(swatch.pink.light).stroke({ width: 2, color: swatch.pink.line });
  g.circle(0, 0, 27).fill(cream);
  if (n === 0) flower(g, 25, swatch.red.fill, swatch.red.line);
  else if (n === 1) {
    // A daisy: ten thin white petals round a yellow middle.
    for (const [width, color] of [
      [11, swatch.white.line],
      [7, swatch.white.fill],
    ] as const)
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI * 2) / 10;
        g.moveTo(Math.cos(a) * 8, Math.sin(a) * 8)
          .lineTo(Math.cos(a) * 21, Math.sin(a) * 21)
          .stroke({ width, color, cap: 'round' });
      }
    g.circle(0, 0, 8).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
  } else if (n === 2) {
    // A tulip: a three-pointed cup on a short stem.
    g.moveTo(0, 6).lineTo(0, 24).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
    g.poly([-15, -18, -7, -9, 0, -21, 7, -9, 15, -18, 15, -2, 9, 8, -9, 8, -15, -2])
      .fill(swatch.purple.fill)
      .stroke({ width: 3, color: swatch.purple.line, join: 'round' });
  } else {
    // Four round petals in a cross, with a white middle.
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      g.circle(Math.cos(a) * 12, Math.sin(a) * 12, 11);
    }
    g.fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line });
    g.circle(0, 0, 7).fill(swatch.white.fill).stroke({ width: 2, color: swatch.blue.line });
  }
  return g;
}
/** One picture 64–72 units across, in its look's colour; a container so Peek can scale it. */
function pictureArt(kind: number, look = 0) {
  const c = new Container();
  if (isFlower(kind)) {
    c.addChild(flowerArt(kind - FLOWER));
    return c;
  }
  const { art, color } = LOOKS[look][kind];
  if (SHAPE_ART.includes(art))
    c.addChild(
      shapePath(new Graphics(), art as ShapeKind, 30)
        .fill(swatch[color].fill)
        .stroke({ width: 4, color: swatch[color].line }),
    );
  else {
    // Props are drawn about 100–120 units across; this brings the widest to the star's 72.
    const p = prop(art as PropKind, color);
    p.scale.set(0.58);
    c.addChild(p);
  }
  return c;
}

/** Pictures differ by shape as well as color. The raised edge makes a covered tile read as a stack. */
function tileArt(kind: number, look = 0) {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-50, -48, 108, 108, 14).fill(swatch.brown.line));
  c.addChild(
    new Graphics()
      .roundRect(-54, -54, 108, 108, 14)
      .fill(cream)
      .stroke({ width: 3, color: swatch.brown.fill }),
  );
  const picture = pictureArt(kind, look);
  c.addChild(picture);
  return Object.assign(c, { picture });
}
interface Snapshot {
  tiles: Tile[];
  mask: number;
}

class TilePairs implements Game {
  tiles: Tile[];
  mask: number;
  /** Held tiles, in the order tapped: up to one, or two on a three-alike board. */
  selected: number[] = [];
  hinted: Pair | null = null;
  cursor = 0;
  misses = 0;
  hints = 0;
  undos = 0;
  shuffles = 0;
  busy = false;
  finished = false;
  readonly board = new Container();
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly shuffleButton = new Container();
  readonly peekButton = new Container();
  private readonly peekLabel = label('Peek', 24);
  private peeking = false;
  nodes: ReturnType<typeof tileArt>[] = [];
  private readonly peekPictures = new Container<Container>();
  /** The round's picture set, chosen once by the seed; undo and shuffle keep it. */
  private readonly look: number;
  private history: Snapshot[] = [];
  private readonly ring = new Graphics();
  private readonly tally = label('', 30);
  private readonly help = label('Clear the top · open a left or right side', 23, ink, '500');
  private readonly held = new HeldDirection();
  /** Touch layout (buttons, tappable tiles) until a key or pad is used; couch play never has it. */
  private touch: boolean;
  private view: View;
  private readonly buttons = [this.undoButton, this.hintButton, this.shuffleButton, this.peekButton];
  private botWait = 0.6;
  private route: Pair[] | null = null;
  private sinceMatch = 0;
  /** Removed tiles still lifting away: drawn until their fade ends, never tappable. */
  private readonly leaving = new Set<Container>();
  /** Level 8's flower family is in play, so the help line says any two flowers pair. */
  private readonly flowers: boolean;
  /** A designed lesson level's habit, spoken after the stuck line (levels 17–21). */
  private readonly lesson: ReturnType<typeof lessonFor>;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.touch = !ctx.couch;
    this.tiles = makeBoard(ctx.level, ctx.rng);
    this.look = pickLook(ctx.rng);
    this.flowers = flowersIn(planFor(ctx.level)) > 0;
    this.lesson = lessonFor(ctx.level);
    this.mask = fullMask(this.tiles);
    this.ring.eventMode = this.tally.eventMode = this.help.eventMode = 'none';
    this.peekPictures.eventMode = 'none';
    ctx.stage.addChild(this.board, this.peekPictures, this.ring, this.tally, this.help);
    for (const [node, text, act] of [
      [this.undoButton, label('Undo ↶', 24), () => this.undo()],
      [this.hintButton, label('Hint ◇', 24), () => this.askForHint()],
      [this.shuffleButton, label('Shuffle ↺', 24), () => this.restart()],
      [this.peekButton, this.peekLabel, () => this.togglePeek()],
    ] as const) {
      node.addChild(tile(160, 100, 'purple'), text);
      node.hitArea = new Rectangle(-80, -50, 160, 100);
      node.visible = this.touch;
      onTap(node, act);
      ctx.stage.addChild(node);
    }
    this.rebuild();
  }
  /** Level 14: a move takes three alike. */
  private get three() {
    return takeOf(this.tiles) === 3;
  }
  start() {
    void this.ctx.instruct(
      this.touch
        ? this.flowers
          ? 'tile-pairs.go-flowers'
          : this.three
            ? 'tile-pairs.go-three'
            : opensAtEnds(this.tiles)
              ? 'tile-pairs.go-ends'
              : 'tile-pairs.go'
        : 'couch.how.tile-pairs',
    );
  }

  private snapshot(): Snapshot {
    return { tiles: this.tiles.map((t) => ({ ...t })), mask: this.mask };
  }
  private rebuild() {
    for (const node of this.nodes) {
      this.settle(node);
      node.destroy({ children: true });
    }
    this.leaving.clear();
    this.nodes = this.tiles.map((t, i) => {
      const c = tileArt(t.kind, this.look);
      c.hitArea = new Rectangle(-54, -54, 108, 108);
      onTap(
        c,
        () => {
          if (this.touch) this.choose(i);
        },
        { cooldown: 80 },
      );
      if (!this.touch) c.eventMode = 'none';
      this.board.addChild(c);
      return c;
    });
    for (const picture of this.peekPictures.removeChildren()) picture.destroy({ children: true });
    for (const { kind } of this.tiles) this.peekPictures.addChild(pictureArt(kind, this.look));
    this.route = solve(this.tiles, this.mask);
    this.cursor = freeTiles(this.tiles, this.mask)[0] ?? 0;
    this.resize(this.view);
    this.draw();
  }
  resize(v: View) {
    this.view = v;
    const frame = tilePairsLayout(v, this.tiles);
    this.board.position.copyFrom(frame.board);
    this.peekPictures.position.copyFrom(frame.board);
    this.nodes.forEach((n, i) => n.position.copyFrom(frame.tiles[i]));
    this.tally.position.set(v.w / 2, 66);
    this.help.position.set(v.w / 2, 104);
    this.buttons.forEach((n, i) => n.position.copyFrom(frame.buttons[i]));
    this.draw();
  }
  private draw() {
    const stacks = this.peeking ? peekStacks(this.tiles, this.mask) : [];
    const covering = new Set(stacks.flatMap((stack) => stack.slice(1)));
    this.peekLabel.text = this.peeking ? 'Close peek' : 'Peek';
    const bricks = this.tiles.some((t) => !Number.isInteger(t.x));
    this.nodes.forEach((n, i) => {
      if (this.leaving.has(n)) return;
      n.visible = present(this.mask, i);
      const open = free(this.tiles, this.mask, i);
      // On half steps (level 13) a see-through blocked brick shows the pictures below through it, so a blocked
      // tile there stays solid and is greyed instead.
      n.alpha = this.peeking ? (covering.has(i) ? 0.25 : 1) : open || bricks ? 1 : 0.58;
      n.tint = !this.peeking && bricks && !open ? swatch.white.line : swatch.white.fill;
      n.picture.visible = true;
    });
    this.peekPictures.visible = this.peeking;
    for (const picture of this.peekPictures.children) picture.visible = false;
    for (const stack of stacks) {
      const base = this.nodes[stack[0]];
      // The tower's four-deep stacks read in two rows, so each picture stays large enough to tell apart.
      const rows = stack.length > 3 ? 2 : 1,
        per = Math.ceil(stack.length / rows),
        spacing = 96 / per;
      stack.forEach((i, depth) => {
        this.nodes[i].picture.visible = false;
        const picture = this.peekPictures.children[i];
        const col = depth % per,
          row = Math.floor(depth / per);
        picture.position.set(
          base.x + (col - (per - 1) / 2) * spacing,
          base.y + (row - (rows - 1) / 2) * spacing,
        );
        // Pictures reach about 72 units across (the star's points), so neighbours keep a gap.
        picture.scale.set(Math.min(0.75, (spacing - 4) / 72));
        picture.visible = true;
      });
    }
    const remaining = this.tiles.filter((_, i) => present(this.mask, i)).length;
    // "Pairs open" is the consequence to watch: what the last pair uncovered shows up here as new choices.
    const open = pairs(this.tiles, this.mask).length,
      moves = this.three ? (open === 1 ? 'set of three' : 'sets of three') : open === 1 ? 'pair' : 'pairs';
    this.tally.text = `${remaining} tiles · ${open} ${moves} open · ${this.undos} undos · ${this.shuffles} shuffles`;
    this.help.text = this.peeking
      ? stacks.length
        ? stacks.some((stack) => stack.length > 3)
          ? 'Stacks read from the bottom, left to right, row by row'
          : 'Each stack reads from bottom to top, left to right'
        : 'All remaining pictures are visible'
      : this.route === null
        ? 'No clearing route · Undo or Shuffle keeps you playing'
        : this.flowers
          ? 'Any two flowers pair · clear the top · open a side'
          : this.three
            ? 'Three alike · clear the top · open a left or right side'
            : opensAtEnds(this.tiles)
              ? 'Clear the top · open the edge above or below'
              : 'Clear the top · open a left or right side';
    const g = this.ring.clear();
    const outline = (i: number, color: number, width: number) => {
      if (!present(this.mask, i)) return;
      const n = this.nodes[i];
      g.roundRect(this.board.x + n.x - 51, this.board.y + n.y - 51, 102, 102, 12).stroke({ width, color });
    };
    for (const i of covering) outline(i, swatch.brown.fill, 2);
    // Short sides: a tile held in only by the tiles above and below it gets a thin shadow on those two edges, so
    // the axis that counts on this board shows where it blocks.
    if (opensAtEnds(this.tiles) && !this.peeking)
      this.tiles.forEach((_, i) => {
        if (!present(this.mask, i) || this.leaving.has(this.nodes[i]) || free(this.tiles, this.mask, i))
          return;
        const held = heldSides(this.tiles, this.mask, i);
        if (!held.before || !held.after) return;
        const n = this.nodes[i],
          x = this.board.x + n.x,
          y = this.board.y + n.y;
        for (const edge of [-1, 1])
          g.roundRect(x - 40, y + edge * 47 - 4, 80, 8, 4).fill({ color: ink, alpha: 0.4 });
      });
    if (!this.touch && !this.finished) outline(this.cursor, ink, 4);
    for (const i of this.selected) outline(i, swatch.blue.line, 7);
    for (const i of this.hinted ?? []) outline(i, swatch.orange.line, 7);
  }
  togglePeek() {
    if (this.busy || this.finished || !this.ctx.alive) return;
    this.peeking = !this.peeking;
    sfx.tick();
    this.draw();
    if (this.peeking) void this.ctx.say('tile-pairs.peek');
  }
  private choose(i: number) {
    if (this.busy || this.finished || !this.ctx.alive || !present(this.mask, i)) return;
    if (this.peeking) {
      this.togglePeek();
      return;
    }
    if (!free(this.tiles, this.mask, i)) {
      sfx.squeak();
      void this.ctx.say(opensAtEnds(this.tiles) ? 'tile-pairs.blocked-ends' : 'tile-pairs.blocked');
      return;
    }
    this.cursor = i;
    if (this.selected.includes(i)) {
      this.selected = this.selected.filter((k) => k !== i);
      this.draw();
      return;
    }
    if (!this.selected.length) {
      this.selected = [i];
      sfx.tick();
      this.draw();
      return;
    }
    const a = this.selected[0];
    if (!matches(this.tiles[a].kind, this.tiles[i].kind)) {
      // A pair's two picks both go; on a three-alike board the different tile is not picked and the held ones stay.
      if (!this.three) this.selected = [];
      this.misses++;
      this.sinceMatch++;
      sfx.boing();
      const flowerMiss = isFlower(this.tiles[a].kind) || isFlower(this.tiles[i].kind);
      void this.ctx.say(
        flowerMiss ? 'tile-pairs.flowers' : this.three ? 'tile-pairs.mismatch-three' : 'tile-pairs.mismatch',
      );
      if (this.sinceMatch >= 2) this.askForHint();
      this.draw();
      return;
    }
    if (this.selected.length + 1 < takeOf(this.tiles)) {
      this.selected = [...this.selected, i];
      sfx.tick();
      this.draw();
      return;
    }
    const group = [...this.selected, i];
    this.selected = [];
    this.history.push(this.snapshot());
    const wasFree = new Set(freeTiles(this.tiles, this.mask));
    this.mask = removePair(this.mask, group);
    this.hinted = null;
    this.sinceMatch = 0;
    this.route = solve(this.tiles, this.mask);
    const nowFree = freeTiles(this.tiles, this.mask);
    this.cursor = nowFree[0] ?? 0;
    sfx.pop(3);
    for (const k of group) this.liftAway(this.nodes[k]);
    this.draw();
    for (const k of nowFree) if (!wasFree.has(k)) this.pulse(this.nodes[k]);
    if (!this.mask) void this.complete();
    else if (!this.route) this.stuck();
  }
  /**
   * No route is left. On a lesson level, when the first pair taken left no route, the board's lesson follows the
   * stuck line unless an undo or shuffle has already moved on; taking the losing pair is a legal move, so nothing is counted.
   */
  private stuck() {
    const mask = this.mask,
      tiles = this.tiles,
      // The lesson describes the board's first choice (`lessonHolds`), so it follows only a dead end left by the
      // first pair taken; a later dead end gets the stuck line alone.
      firstPairTrap = fullMask(tiles) - mask === pairBits(tiles, mask);
    void this.ctx.say('tile-pairs.stuck').then(() => {
      if (this.lesson && firstPairTrap && this.mask === mask && this.tiles === tiles)
        void this.ctx.say(`tile-pairs.lesson.${this.lesson}`);
    });
  }
  /** Stop a tile's own animations (their promises never resolve) and put its size back. */
  private settle(node: Container) {
    this.ctx.tw.kill(node);
    this.ctx.tw.kill(node.scale);
    node.scale.set(1);
  }
  /** A removed tile lifts and fades instead of vanishing, so the eye is on the spot it opens. */
  private liftAway(node: Container) {
    this.settle(node);
    this.leaving.add(node);
    node.eventMode = 'none';
    this.board.addChild(node);
    void this.ctx.tw.to(node.scale, { x: 1.1, y: 1.1 }, { duration: 0.3 });
    void this.ctx.tw.to(node, { y: node.y - 30, alpha: 0 }, { duration: 0.3 }).then(() => {
      if (!this.leaving.delete(node)) return;
      node.visible = false;
    });
  }
  /** A tile the pair just freed (uncovered, or a side opened) swells once as it brightens. */
  private pulse(node: Container) {
    this.settle(node);
    void this.ctx.tw
      .to(node.scale, { x: 1.14, y: 1.14 }, { duration: 0.16, delay: 0.12 })
      .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.24 }));
  }
  private undo() {
    if (this.busy || this.finished || !this.ctx.alive) return;
    this.peeking = false;
    const last = this.history.pop();
    if (!last) {
      this.selected = [];
      this.hinted = null;
      this.draw();
      return;
    }
    this.undos++;
    this.tiles = last.tiles;
    this.mask = last.mask;
    this.selected = [];
    this.hinted = null;
    this.sinceMatch = 0;
    this.rebuild();
    sfx.tick();
  }
  askForHint() {
    if (this.busy || this.finished || !this.ctx.alive) return;
    // Recovery itself is counted once; the hint then identifies a genuinely useful pair.
    if (!this.route) this.restart();
    const pair = this.route?.[0];
    if (!pair || this.hinted) return;
    this.peeking = false;
    this.hints++;
    this.hinted = pair;
    this.selected = [];
    this.cursor = pair[0];
    this.draw();
    void this.ctx.say(this.three ? 'tile-pairs.hint-three' : 'tile-pairs.hint');
  }
  /** Shuffle is the couch pause menu's restart action. Removed tiles stay removed; each rearrangement counts. */
  restart() {
    if (this.busy || this.finished || !this.ctx.alive) return;
    this.history.push(this.snapshot());
    this.peeking = false;
    this.tiles = reshuffle(this.tiles, this.mask, this.ctx.rng);
    this.mask = fullMask(this.tiles);
    this.shuffles++;
    this.hints++;
    this.selected = [];
    this.hinted = null;
    this.rebuild();
    void this.ctx.say(this.three ? 'tile-pairs.shuffle-three' : 'tile-pairs.shuffle');
  }
  private async complete() {
    this.busy = this.finished = true;
    this.ring.clear();
    this.ctx.pet.cheer();
    sfx.tada();
    this.ctx.particles.burst(this.view.w / 2, this.view.h / 2, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.teal.fill],
      count: 20,
    });
    await this.ctx.say('tile-pairs.done');
    if (!this.ctx.alive) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.undos + this.shuffles });
  }
  update(_dt: number) {}
  destroy() {}

  /** The first key or pad press on the island: the buttons go and the cursor ring shows. Couch play is already here. */
  private useController() {
    if (!this.touch) return;
    this.touch = false;
    for (const b of this.buttons) b.visible = false;
    for (const n of this.nodes) n.eventMode = 'none';
    this.draw();
  }

  /** A finger came back after keys: the buttons and tappable tiles return. */
  touchReturned() {
    if (this.touch || this.finished || !this.ctx.alive) return;
    this.touch = true;
    for (const b of this.buttons) b.visible = true;
    for (const n of this.nodes) if (!this.leaving.has(n)) n.eventMode = 'static';
    this.draw();
  }

  control(input: CouchControls, dt: number) {
    this.useController();
    if (this.busy || this.finished || !this.ctx.alive) return;
    const open = freeTiles(this.tiles, this.mask),
      spots = open.map((i) => this.nodes[i].position);
    for (const dir of this.held.poll(input, dt)) {
      this.cursor = open[nextSpot(spots, Math.max(0, open.indexOf(this.cursor)), dir)] ?? this.cursor;
      this.draw();
    }
    if (input.players.some((p) => p.action)) this.choose(this.cursor);
    else if (input.players.some((p) => p.undo)) this.undo();
  }
  private botTarget(): number | null {
    const pair = this.route?.[0];
    if (!pair) return null;
    // Cancel a held tile that is not in the route's next move, then tap that move's tiles not yet held.
    const stray = this.selected.find((i) => !pair.includes(i));
    if (stray !== undefined) return stray;
    return pair.find((i) => !this.selected.includes(i)) ?? null;
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.ctx.alive) return null;
    const to = this.botTarget();
    if (to === null) return { tap: { on: this.shuffleButton } };
    return { tap: { on: this.nodes[to] }, pause: 0.32 };
  }
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.ctx.alive || this.botWait > 0) return out;
    const to = this.botTarget();
    if (to === null) return out;
    const p = out.players[0];
    p.active = true;
    if (to === this.cursor) {
      p.action = true;
      this.botWait = 0.3;
      return out;
    }
    const open = freeTiles(this.tiles, this.mask);
    const dir = routeStep(
      open.map((i) => this.nodes[i].position),
      open.indexOf(this.cursor),
      open.indexOf(to),
    );
    p.direction = dir;
    this.botWait = 0.12;
    return out;
  }
}

function sticker(seed: number) {
  const rng = new Rng(seed),
    c = new Container(),
    kind = rng.int(0, 5);
  for (const x of [-40, 40]) {
    const t = tileArt(kind);
    t.scale.set(0.75);
    t.position.set(x, x / 5);
    t.rotation = x / 400;
    c.addChild(t);
  }
  return c;
}
/** The bits of the tiles taken from the full board, when exactly two are gone (one pair); otherwise -1. Lesson boards only. */
function pairBits(tiles: readonly Tile[], mask: number): number {
  const gone = fullMask(tiles) & ~mask;
  let n = 0;
  for (let i = 0; i < tiles.length; i++) if (gone & (1 << i)) n++;
  return n === 2 ? gone : -1;
}
export function tilePairsLayout(v: View, tiles: readonly Tile[]) {
  const cols = Math.max(...tiles.map((t) => t.x)) + 1;
  const rows = Math.max(...tiles.map((t) => t.y)) + 1;
  return {
    board: { x: v.w / 2 - (cols - 1) * 60, y: (v.h - 110) / 2 - (rows - 1) * 58 },
    tiles: tiles.map((t) => ({ x: t.x * 120 + t.z * 6, y: t.y * 116 - t.z * 6 })),
    buttons: [-1.5, -0.5, 0.5, 1.5].map((i) => ({ x: v.w / 2 + i * 180, y: v.h - (v.upright ? 230 : 70) })),
  };
}

export const tilePairs: GameModule = {
  id: 'tile-pairs',
  upright: true,
  liveController: true,
  name: 'Tile Pairs',
  titleLine: 'game.tile-pairs',
  region: 'puzzle-peaks',
  challenge: 'noticing',
  skills: ['spatial-planning', 'matching'],
  bands: ['grownup'],
  inputs: ['touch', 'controller'],
  touchDemo: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint:
    'Look together for a matching pair whose tops and one side are open. Notice what removing it uncovers.',
  offScreen:
    'Lay matching playing cards face up in short rows. Remove matching end cards and notice which choices open the middle.',
  hubIcon: () => {
    const c = sticker(5);
    c.position.y = -100;
    return new WigglyIcon(c);
  },
  sticker,
  create: (ctx) => new TilePairs(ctx),
};
