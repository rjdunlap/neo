import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  blockingBoard, boardBuilt, boardLayout, boltAt, built, canFinish, cardLayout, CARD_H, CARD_W, corners, coveringBoards, covered, done,
  emptyState, HEAD, HIT, hintBuild, holeAt, holeAtPoint, holeCount, hintMove, inRect, isFree, mirror, openHoles, overlaps, place,
  planFor, pose, poses, remove, removed, solve, startState, stuck, toView, toWall, WALL_H, WALL_W, woodpileLayout,
  type BoltLayout, type BoltPlan, type Hint, type Move, type Pose, type Pt, type Puzzle, type Rect, type State,
} from './logic';
import { PUZZLES } from './puzzles';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 4 },
  // Level 8 (Plenty of holes) sits between 5 and 6: parking bolts in holes before the planning holes carry.
  prek: { min: 2, max: 8, order: [2, 3, 4, 5, 8, 6] },
  // Level 9 (Put it back) builds the wall up again, after every take-apart level.
  school: { min: 4, max: 9, order: [4, 5, 8, 6, 7, 9] },
};

/** Board colours, each with its own pattern so colour is never the only cue; the pet names a board by its colour. */
const COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'] as const satisfies readonly ColorName[];
type BoardColor = (typeof COLORS)[number];
const PATTERN: Record<BoardColor, 'stripes' | 'spots' | 'rings'> = {
  red: 'stripes', green: 'spots', blue: 'rings', purple: 'stripes', yellow: 'rings', orange: 'spots',
};
/** Each fruit has its own outline (round, pear, oval, dimpled, pointed heart, curved) so shape, not only colour, tells them apart. */
const FRUITS = ['apple', 'pear', 'plum', 'orange', 'strawberry', 'banana'] as const;
type Fruit = (typeof FRUITS)[number];
/** Pip is the island's companion, never hidden behind boards. */
const FRIENDS: CritterName[] = ['cow', 'duck', 'pig', 'cat', 'dog', 'bunny', 'bear'];
/** A swing's length: the state has changed at once; this is only for show. */
const SWING = 0.6;
/** Level 6's, 8's and 9's authored first boards lead their first round of a session. */
const authoredShown = new Set<number>();

/* ---------------------------------------------------------------------------------------------- */
/* Art                                                                                            */
/* ---------------------------------------------------------------------------------------------- */

function boltArt(): Container {
  const c = new Container();
  c.addChild(
    new Graphics().circle(2, 4, 26).fill({ color: ink, alpha: 0.2 }),
    new Graphics().circle(0, 0, 26).fill(0xd7dbe3).stroke({ width: 4, color: 0x6b7280 })
      .circle(-7, -7, 7).fill({ color: 0xffffff, alpha: 0.6 })
      .moveTo(-12, 0).lineTo(12, 0).moveTo(0, -12).lineTo(0, 12).stroke({ width: 5, color: 0x6b7280, cap: 'round' }),
  );
  return c;
}

function holeArt(g: Graphics, x: number, y: number) {
  g.circle(x, y, 20).fill(0x6e5136).stroke({ width: 4, color: 0xb98a5c }).circle(x - 4, y - 4, 10).fill(0x4a3424);
}

function boardArt(w: number, h: number, color: BoardColor): Graphics {
  const c = swatch[color];
  const g = new Graphics();
  g.roundRect(-w / 2 + 4, -h / 2 + 8, w, h, 16).fill({ color: ink, alpha: 0.2 });
  g.roundRect(-w / 2, -h / 2, w, h, 16).fill(c.fill).stroke({ width: 5, color: c.line });
  // Wood grain.
  for (let y = -h / 2 + 22; y < h / 2 - 10; y += 26) {
    g.moveTo(-w / 2 + 14, y).bezierCurveTo(-w / 6, y - 6, w / 6, y + 6, w / 2 - 14, y).stroke({ width: 3, color: c.line, alpha: 0.25 });
  }
  const p = PATTERN[color];
  if (p === 'stripes') {
    for (let x = -w / 2 + 30; x < w / 2 - 10; x += 44) g.moveTo(x, -h / 2 + 6).lineTo(x - 20, h / 2 - 6).stroke({ width: 9, color: c.light, alpha: 0.75 });
  } else if (p === 'spots') {
    for (let y = -h / 2 + 28; y < h / 2 - 16; y += 46) for (let x = -w / 2 + 28 + ((y / 46) % 2 ? 22 : 0); x < w / 2 - 16; x += 46) g.circle(x, y, 9).fill({ color: c.light, alpha: 0.85 });
  } else {
    for (let y = -h / 2 + 34; y < h / 2 - 20; y += 60) for (let x = -w / 2 + 34; x < w / 2 - 20; x += 60) g.circle(x, y, 13).stroke({ width: 5, color: c.light, alpha: 0.85 });
  }
  return g;
}

function fruitArt(kind: Fruit): Graphics {
  const g = new Graphics();
  const line = (color: number) => ({ width: 4, color, join: 'round' as const });
  if (kind === 'apple') {
    const c = swatch.red;
    g.moveTo(0, -16).bezierCurveTo(-30, -32, -40, 12, -14, 28).bezierCurveTo(-6, 32, 6, 32, 14, 28).bezierCurveTo(40, 12, 30, -32, 0, -16).fill(c.fill).stroke(line(c.line));
  } else if (kind === 'pear') {
    const c = swatch.green;
    g.moveTo(0, -30).bezierCurveTo(14, -30, 12, -6, 24, 10).bezierCurveTo(34, 30, 14, 34, 0, 34).bezierCurveTo(-14, 34, -34, 30, -24, 10)
      .bezierCurveTo(-12, -6, -14, -30, 0, -30).fill(c.fill).stroke(line(c.line));
  } else if (kind === 'plum') {
    const c = swatch.purple;
    g.ellipse(0, 4, 26, 28).fill(c.fill).stroke(line(c.line));
    g.moveTo(0, -20).bezierCurveTo(8, -4, 8, 14, 0, 28).stroke({ width: 3, color: c.line, alpha: 0.5 });
  } else if (kind === 'orange') {
    const c = swatch.orange;
    g.circle(0, 4, 29).fill(c.fill).stroke(line(c.line));
    for (const [x, y] of [[-12, 14], [6, 20], [14, 2], [-2, -6], [-16, -4]]) g.circle(x, y, 2).fill({ color: c.line, alpha: 0.45 });
  } else if (kind === 'strawberry') {
    const c = swatch.red;
    g.moveTo(0, -18).bezierCurveTo(-26, -26, -38, 0, -16, 22).bezierCurveTo(-8, 30, -4, 34, 0, 36)
      .bezierCurveTo(4, 34, 8, 30, 16, 22).bezierCurveTo(38, 0, 26, -26, 0, -18).fill(c.fill).stroke(line(c.line));
    for (const [x, y] of [[-14, -6], [0, -4], [14, -6], [-8, 8], [8, 8], [-2, 20], [0, 30]]) g.ellipse(x, y, 2, 3).fill(swatch.yellow.light);
    // A leafy cap instead of a stalk.
    for (const a of [-1, 0, 1]) g.ellipse(a * 10, -20 + Math.abs(a) * 2, 8, 5).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.moveTo(0, -22).lineTo(1, -32).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
    return g;
  } else {
    const c = swatch.yellow;
    g.moveTo(-26, -24).bezierCurveTo(-34, 6, -10, 30, 26, 22).bezierCurveTo(30, 21, 30, 16, 26, 14)
      .bezierCurveTo(0, 16, -16, 0, -16, -24).closePath().fill(c.fill).stroke(line(c.line));
    g.moveTo(-23, -22).bezierCurveTo(-26, 2, -6, 22, 22, 18).stroke({ width: 3, color: c.line, alpha: 0.45 });
    // Brown tips at both ends instead of a stalk and leaf.
    g.roundRect(-26, -32, 9, 10, 3).fill(swatch.brown.line);
    g.circle(28, 18, 3.5).fill(swatch.brown.line);
    return g;
  }
  g.moveTo(0, -18).lineTo(3, -32).stroke({ width: 5, color: swatch.brown.line, cap: 'round' });
  g.ellipse(13, -30, 10, 5).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  g.ellipse(-10, -4, 5, 8).fill({ color: 0xffffff, alpha: 0.4 });
  return g;
}

function basketArt(w: number, h: number): Graphics {
  const g = new Graphics().roundRect(-w / 2, -h / 2 + 18, w, h - 18, 22).fill(wood.fill).stroke({ width: 5, color: wood.line });
  for (let y = -h / 2 + 34; y < h / 2 - 8; y += 18) g.moveTo(-w / 2 + 8, y).lineTo(w / 2 - 8, y).stroke({ width: 3, color: wood.line, alpha: 0.6 });
  g.moveTo(-w / 2 + 20, -h / 2 + 20).bezierCurveTo(-w / 2 + 20, -h / 2 - 22, w / 2 - 20, -h / 2 - 22, w / 2 - 20, -h / 2 + 20).stroke({ width: 7, color: wood.line, cap: 'round' });
  return g;
}

function toolboxArt(): Graphics {
  const c = swatch.red;
  return new Graphics()
    .roundRect(-60, -30, 120, 64, 12).fill(c.fill).stroke({ width: 5, color: c.line })
    .moveTo(-62, -6).lineTo(62, -6).stroke({ width: 4, color: c.line })
    .roundRect(-26, -50, 52, 26, 10).stroke({ width: 8, color: 0x6b7280 })
    .rect(-10, -10, 20, 10).fill(0xd7dbe3).stroke({ width: 3, color: 0x6b7280 });
}

function wallArt(): Graphics {
  const g = new Graphics().roundRect(-16, -16, WALL_W + 32, WALL_H + 32, 26).fill(0xe8c79a).stroke({ width: 6, color: wood.line });
  for (let y = 18; y < WALL_H; y += 40) for (let x = 18; x < WALL_W; x += 40) g.circle(x, y, 4).fill({ color: wood.line, alpha: 0.3 });
  return g;
}

/** A board on the wall, drawn round its middle, with its bolt heads on it. */
class BoardView extends Container {
  readonly bolts = new Map<number, Container>();
  constructor(readonly w: number, readonly h: number, readonly color: BoardColor) {
    super();
    this.addChild(boardArt(w, h, color));
    this.eventMode = 'none';
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game                                                                                       */
/* ---------------------------------------------------------------------------------------------- */

interface Swing { from: number; to: number; t: number }
type Press = { bolt: number; at: Pt; dragging: boolean } | { wall: Pt };

class BoltBoards implements Game {
  readonly plan: BoltPlan;
  puzzle!: Puzzle;
  state: number[] = [];
  history: number[][] = [];
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The bolt lifted and waiting for a hole (levels 6–8). */
  lifted: number | null = null;
  hinted: Hint | null = null;
  scene = 0;
  private sceneMisses = 0;
  private sinceHint = 0;
  private par = 0;
  private colors: BoardColor[] = [];
  private fruits: Fruit[] = [];
  private friendKind: CritterName = 'cow';
  private used = new Set<number>();
  private layout!: BoltLayout;
  private press: Press | null = null;
  private clock = 0;
  private lastSaid = -Infinity;
  private undoPulse = 0;
  private shimmer: { bolts: number[]; t: number } | null = null;
  private solved = new Map<string, Move[] | null | undefined>();
  private swingSaid = false;
  /** Level 9: building the wall up from the woodpile. */
  readonly build: boolean;
  /** Level 9: the board lifted from the woodpile (or tapped while hanging), whose holes glow. */
  picked: number | null = null;
  /** Level 9: the wall can no longer be finished; undo is the answer. */
  dead = false;
  private slots: Rect[] = [];
  private pileArts: (Container | null)[] = [];
  private pileWobble = 0;

  /** Display: the board views, the pivot bolt each turns about, its base rotation, a swing and a wobble. */
  private views: BoardView[] = [];
  private pivots: (number | null)[] = [];
  private rots: number[] = [];
  private swings: (Swing | null)[] = [];
  private wobbles: number[] = [];
  private shown: Pose[] = [];

  private readonly wall = new Container();
  private readonly wallBack = new Container();
  private readonly holes = new Graphics();
  private readonly behind = new Container();
  private readonly parked = new Container();
  private readonly boardLayer = new Container();
  private readonly glow = new Graphics();
  private readonly fly = new Container();
  private readonly hitLayer = new Graphics();
  private readonly basket = new Container();
  private readonly basketFill = new Container();
  private readonly toolbox = new Container();
  private readonly undoButton: RoundButton;
  private readonly woodpile = new Container();
  private readonly pileGlow = new Graphics();
  private readonly card = new Container();
  private fruitViews: Container[] = [];
  private friend: Critter | null = null;
  private liftedView: Container | null = null;
  private readonly onCancel = () => this.letGo(true);

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.build = !!this.plan.build;
    this.boardLayer.sortableChildren = true;
    for (const c of [this.wallBack, this.holes, this.behind, this.parked, this.boardLayer, this.glow, this.fly]) c.eventMode = 'none';
    this.wall.eventMode = 'none';
    this.wall.addChild(this.wallBack, this.holes, this.behind, this.parked, this.boardLayer, this.glow, this.fly);
    this.wallBack.addChild(wallArt());
    this.basket.addChild(basketArt(150, 120), this.basketFill);
    this.basket.eventMode = 'none';
    this.toolbox.addChild(toolboxArt());
    this.toolbox.eventMode = 'none';
    this.undoButton = new RoundButton(againIcon(), swatch.white, 54, () => this.undo());
    this.hitLayer.eventMode = 'static';
    this.hitLayer.on('pointerdown', (e) => this.down(e));
    this.hitLayer.on('pointermove', (e) => this.move(e));
    this.hitLayer.on('pointerup', (e) => this.up(e));
    this.hitLayer.on('pointerupoutside', () => this.letGo(true));
    for (const c of [this.woodpile, this.pileGlow, this.card]) c.eventMode = 'none';
    this.basket.visible = this.toolbox.visible = !this.build;
    this.woodpile.visible = this.pileGlow.visible = this.card.visible = this.build;
    ctx.stage.addChild(this.wall, this.toolbox, this.basket, this.woodpile, this.card, this.pileGlow, this.hitLayer, this.undoButton);
    window.addEventListener('pointercancel', this.onCancel);
    this.layout = boardLayout(ctx.view, this.build);
    this.buildScene();
  }

  start() {
    this.resize(this.ctx.view);
    this.wall.alpha = 0;
    void this.ctx.tw.to(this.wall, { alpha: 1 }, { duration: 0.3 }).then(() => { this.busy = false; });
    void this.ctx.instruct(this.instruction());
  }

  resize(v: View) {
    this.letGo(true);
    this.layout = boardLayout(v, this.build);
    const L = this.layout;
    this.wall.position.set(L.x, L.y);
    this.wall.scale.set(L.scale);
    this.hitLayer.clear().rect(0, 0, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 });
    this.hitLayer.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.basket.position.set(L.basket.x, L.basket.y);
    this.undoButton.position.set(L.undo.x, L.undo.y);
    this.toolbox.position.set(L.toolbox.x, L.toolbox.y);
    if (this.build) {
      this.slots = woodpileLayout(v, this.puzzle.boards.length);
      const c = cardLayout(v, L);
      this.card.position.set(c.x, c.y);
      this.drawWoodpile();
      this.drawCard();
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.views.forEach((v, i) => {
      const s = this.swings[i];
      let rot = this.rots[i];
      if (s) {
        s.t += dt;
        if (s.t >= SWING) this.swings[i] = null;
        // Two small overshoots, damped, ending exactly on the new pose.
        else rot = s.to + (s.from - s.to) * Math.cos(s.t * 2 * Math.PI / 0.27) * Math.exp(-s.t / 0.1);
      }
      if (this.wobbles[i] > 0) {
        this.wobbles[i] = Math.max(0, this.wobbles[i] - dt);
        rot += Math.sin(this.wobbles[i] * 40) * 0.05 * (this.wobbles[i] / 0.4);
      }
      v.rotation = rot;
    });
    // A pressed bolt turns under the finger.
    const press = this.press;
    if (press && 'bolt' in press && !press.dragging) {
      const v = this.boltView(press.bolt);
      if (v) v.rotation += dt * 5;
    }
    if (this.build) {
      this.pileWobble = Math.max(0, this.pileWobble - dt);
      this.pileArts.forEach((a) => { if (a) a.rotation = Math.sin(this.pileWobble * 40) * 0.08 * (this.pileWobble / 0.4); });
    }
    this.undoButton.scale.set(this.undoPulse > 0 ? 1 + 0.08 * Math.sin(this.clock * 8) : 1);
    if (this.undoPulse > 0) this.undoPulse -= dt;
    this.drawGlow(dt);
  }

  destroy() {
    window.removeEventListener('pointercancel', this.onCancel);
  }

  /** Start again: every bolt back in its board. Misses and hints already made still count. */
  restart() {
    if (this.finished || this.busy) return;
    this.letGo(true);
    this.state = this.build ? emptyState(this.puzzle) : startState(this.puzzle);
    this.history = [];
    this.hinted = null;
    this.sinceHint = 0;
    this.picked = null;
    this.dead = false;
    this.placeAll();
    if (this.build) { this.drawWoodpile(); this.drawCard(); }
  }

  /** The ghost finger: the hint each step, highest board first at 1–5 and 8 (then an open hole), the solver's path (bolt, then hole) at 6–7. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.press || this.swings.some((s) => s)) return null;
    const h = this.hint();
    if (!h) return null;
    if ('undo' in h) return { tap: { on: this.undoButton }, pause: 0.6 };
    const m = h.move;
    if (this.build) {
      // Level 9: pick the hinted bolt's board (its slot, or its body while it hangs), then tap its hole.
      const i = this.puzzle.bolts[m.bolt].board;
      const q = this.picked === i ? toView(this.layout, this.puzzle.bolts[m.bolt]) : this.pickPoint(i);
      return { tap: { on: this.hitLayer, x: q.x, y: q.y }, pause: 0.5 };
    }
    if (this.plan.holes && this.lifted === m.bolt) {
      const q = toView(this.layout, holeAt(this.puzzle, m.hole!));
      return { tap: { on: this.hitLayer, x: q.x, y: q.y }, pause: 0.5 };
    }
    const q = toView(this.layout, this.puzzle.bolts[m.bolt]);
    return { tap: { on: this.hitLayer, x: q.x, y: q.y }, pause: this.plan.holes ? 0.3 : 0.5 };
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Scenes                                                                                         */
  /* -------------------------------------------------------------------------------------------- */

  private pickPuzzle(): Puzzle {
    const rng = this.ctx.rng;
    if (this.plan.build) {
      // Level 9: the authored board first in a session, then boards from the level-3 and level-4 lists, by scene.
      if (this.scene === 0 && !authoredShown.has(9) && !this.ctx.demo) {
        authoredShown.add(9);
        return PUZZLES[9][0];
      }
      const id = this.plan.build[this.scene], list = PUZZLES[id], key = (k: number) => id * 1000 + k;
      const choices = list.map((_, k) => k).filter((k) => !this.used.has(key(k)));
      const k = rng.pick(choices.length ? choices : list.map((_, k) => k));
      this.used.add(key(k));
      return rng.chance(0.5) ? mirror(list[k]) : list[k];
    }
    const list = PUZZLES[this.plan.id];
    if (this.plan.id === 1 && this.scene === 0) return list[0];
    if ((this.plan.id === 6 || this.plan.id === 8) && this.scene === 0 && !authoredShown.has(this.plan.id) && !this.ctx.demo) {
      authoredShown.add(this.plan.id);
      this.used.add(0);
      return list[0];
    }
    const from = this.plan.id === 1 ? 1 : 0;
    const choices = list.map((_, k) => k).filter((k) => k >= from && !this.used.has(k));
    const k = rng.pick(choices.length ? choices : list.map((_, k) => k).slice(from));
    this.used.add(k);
    return rng.chance(0.5) ? mirror(list[k]) : list[k];
  }

  private buildScene() {
    this.puzzle = this.pickPuzzle();
    this.state = this.build ? emptyState(this.puzzle) : startState(this.puzzle);
    this.picked = null;
    this.dead = false;
    this.history = [];
    this.solved.clear();
    this.sceneMisses = 0;
    this.sinceHint = 0;
    this.hinted = null;
    this.lifted = null;
    this.swingSaid = false;
    const p = this.puzzle;
    if (this.plan.par) this.par = this.solveAt(this.state)?.length ?? 0;
    this.colors = this.ctx.rng.shuffle([...COLORS]).slice(0, p.boards.length);
    this.fruits = p.boards.map(() => this.ctx.rng.pick(FRUITS));
    this.friendKind = this.ctx.rng.pick(FRIENDS);

    for (const v of this.views) v.destroy({ children: true });
    for (const f of this.fruitViews) f.destroy({ children: true });
    this.friend?.destroy({ children: true });
    this.friend = null;
    this.basketFill.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.views = p.boards.map((d, i) => {
      const v = this.boardLayer.addChild(new BoardView(d.w, d.h, this.colors[i]));
      v.zIndex = d.z;
      return v;
    });
    p.bolts.forEach((b, k) => {
      const d = p.boards[b.board];
      const head = this.views[b.board].addChild(boltArt());
      head.position.set(b.x - d.x, b.y - d.y);
      this.views[b.board].bolts.set(k, head);
    });
    this.pivots = p.boards.map(() => null);
    this.rots = p.boards.map(() => 0);
    this.swings = p.boards.map(() => null);
    this.wobbles = p.boards.map(() => 0);
    const start = poses(p, startState(p));
    if (this.build) {
      // No fruit or friend behind the boards at level 9: the picture card is the goal.
      this.fruitViews = [];
    } else if (this.plan.goal === 'all') {
      this.fruitViews = p.boards.map((_, i) => {
        const f = this.behind.addChild(fruitArt(this.fruits[i]));
        const q = start[i] as Pt;
        f.position.set(q.x, q.y);
        f.scale.set(1.2);
        return f;
      });
    } else {
      this.fruitViews = [];
      const c = new Critter(CRITTERS[this.friendKind]);
      c.scale.set(0.5);
      c.position.set(p.friend!.x, p.friend!.y + 62);
      this.friend = this.behind.addChild(c);
      this.ctx.track(c);
    }
    this.placeAll();
    if (this.build) {
      this.slots = woodpileLayout(this.ctx.view, p.boards.length);
      this.drawWoodpile();
      this.drawCard();
    }
  }

  private instruction(): LineId {
    switch (this.plan.id) {
      case 1: return 'bolt.instruct';
      case 2: return 'bolt.instruct-two';
      case 3: case 4: return 'bolt.instruct-all';
      case 5: return 'bolt.instruct-friend';
      case 6: return 'bolt.instruct-holes';
      case 8: return 'bolt.instruct-park';
      case 9: return 'bolt.instruct-build';
      default: return 'bolt.instruct-holes-friend';
    }
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Drawing the state                                                                              */
  /* -------------------------------------------------------------------------------------------- */

  private boltView(b: number) {
    return this.views[this.puzzle.bolts[b].board]?.bolts.get(b);
  }

  /** Put board `i` in a pose, turning about bolt `pivot` (or its middle). */
  private setPose(i: number, q: Pose, pivot: number | null) {
    const v = this.views[i], d = this.puzzle.boards[i];
    if (q.kind === 'down') {
      v.visible = false;
      return;
    }
    v.visible = true;
    v.alpha = 1;
    this.pivots[i] = pivot;
    this.rots[i] = q.rot;
    if (pivot === null) {
      v.pivot.set(0, 0);
      v.position.set(q.x, q.y);
    } else {
      const b = this.puzzle.bolts[pivot];
      v.pivot.set(b.x - d.x, b.y - d.y);
      v.position.set(b.x, b.y);
    }
    v.rotation = q.rot;
  }

  /** Every board, bolt, fruit and parked bolt straight to where the state puts it. */
  private placeAll() {
    const qs = poses(this.puzzle, this.state);
    qs.forEach((q, i) => {
      this.ctx.tw.kill(this.views[i]);
      this.swings[i] = null;
      this.setPose(i, q, q.kind === 'hanging' ? q.bolt : null);
    });
    this.shown = qs;
    this.drawBolts();
    this.fruitViews.forEach((f, i) => {
      this.ctx.tw.kill(f);
      f.visible = qs[i].kind !== 'down';
      const q = poses(this.puzzle, startState(this.puzzle))[i] as Pt;
      f.position.set(q.x, q.y);
      f.alpha = 1;
    });
    this.fillBasket();
  }

  /** Bolt heads on their boards, parked bolts in their holes, and the holes. */
  private drawBolts() {
    const p = this.puzzle, s = this.state;
    p.bolts.forEach((_, b) => {
      const v = this.boltView(b);
      if (v) { v.visible = s[b] === b && this.lifted !== b; v.rotation = 0; v.scale.set(1); }
    });
    this.parked.removeChildren().forEach((c) => c.destroy({ children: true }));
    s.forEach((h, b) => {
      if (h < 0 || h === b) return;
      const at = holeAt(p, h), art = this.parked.addChild(boltArt());
      art.position.set(at.x, at.y);
      art.alpha = 0.9;
    });
    this.holes.clear();
    for (let h = 0; h < holeCount(p); h++) {
      // Level 9 shows only the picked board's empty holes: she plans from the picture, not from the wall.
      if (this.build && (this.picked === null || p.bolts[h].board !== this.picked || s[h] === h)) continue;
      const at = holeAt(p, h);
      holeArt(this.holes, at.x, at.y);
    }
  }

  private fillBasket() {
    this.basketFill.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.goal !== 'all') return;
    const qs = poses(this.puzzle, this.state);
    let n = 0;
    qs.forEach((q, i) => {
      if (q.kind !== 'down') return;
      const f = this.basketFill.addChild(fruitArt(this.fruits[i]));
      f.scale.set(0.5);
      f.position.set(-40 + (n % 4) * 27, -4 - Math.floor(n / 4) * 14);
      n++;
    });
  }

  /** Animate from the shown poses to the state's: a swing about the holding bolt, a soft slide down, or back up. */
  private animatePoses() {
    const qs = poses(this.puzzle, this.state);
    qs.forEach((q, i) => {
      const was = this.shown[i];
      if (was.kind === q.kind && (q.kind !== 'hanging' || (was.kind === 'hanging' && was.bolt === q.bolt))) return;
      const v = this.views[i];
      if (q.kind === 'down') {
        this.swings[i] = null;
        const wall = toWall(this.layout, { x: 0, y: this.ctx.view.h + 60 });
        void this.ctx.tw.to(v, { y: Math.max(v.y + 200, wall.y + this.puzzle.boards[i].h), alpha: 0 }, { duration: 0.55, ease: ease.inQuad }).then(() => {
          v.visible = false;
          sfx.clunk();
        });
        this.dropFruit(i);
        return;
      }
      if (was.kind === 'down') {
        this.ctx.tw.kill(v);
        this.setPose(i, q, q.kind === 'hanging' ? q.bolt : null);
        v.alpha = 0;
        void this.ctx.tw.to(v, { alpha: 1 }, { duration: 0.25 });
        // Level 9: a board's first bolt swings it up on that bolt.
        if (this.build && q.kind === 'hanging') { this.swings[i] = { from: q.rot + 0.7, to: q.rot, t: 0 }; v.rotation = q.rot + 0.7; sfx.squeak(4); }
        const f = this.fruitViews[i];
        if (f) { this.ctx.tw.kill(f); f.visible = true; f.alpha = 1; const s = poses(this.puzzle, startState(this.puzzle))[i] as Pt; f.position.set(s.x, s.y); }
        return;
      }
      // Pinned and hanging share the holding bolt: turn about it.
      const pivot = q.kind === 'hanging' ? q.bolt : (was as { bolt: number }).bolt;
      const from = this.rots[i];
      this.setPose(i, q, pivot);
      this.swings[i] = { from, to: q.rot, t: 0 };
      v.rotation = from;
      sfx.squeak(4);
    });
    this.shown = qs;
  }

  private dropFruit(i: number) {
    const f = this.fruitViews[i];
    if (!f) return;
    const to = toWall(this.layout, this.layout.basket);
    void this.ctx.tw.to(f, { y: f.y - 40 }, { duration: 0.18, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(f, { x: to.x, y: to.y - 20, alpha: 0.2 }, { duration: 0.45, ease: ease.inQuad }))
      .then(() => {
        f.visible = false;
        sfx.marimba(5 + (i % 4), 0.4);
        this.fillBasket();
      });
  }

  private drawGlow(dt: number) {
    const g = this.glow.clear();
    if (this.build) this.pileGlow.clear();
    if (this.finished) return;
    const p = this.puzzle, pulse = 6 + 2 * Math.sin(this.clock * 6);
    if (this.build) return this.drawBuildGlow(g, pulse);
    if (this.lifted !== null && this.plan.litHoles) {
      for (const h of openHoles(p, this.state)) {
        const at = holeAt(p, h);
        g.circle(at.x, at.y, 34 + pulse / 2).stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.9 });
      }
    }
    if (this.shimmer) {
      this.shimmer.t -= dt;
      if (this.shimmer.t <= 0) this.shimmer = null;
      else for (const b of this.shimmer.bolts) g.circle(p.bolts[b].x, p.bolts[b].y, HEAD + 10).stroke({ width: 5, color: 0xffffff, alpha: Math.min(1, this.shimmer.t * 2) });
    }
    const h = this.hinted;
    if (h && 'move' in h) {
      const b = p.bolts[h.move.bolt];
      if (this.lifted !== h.move.bolt) g.circle(b.x, b.y, HIT + pulse).stroke({ width: pulse, color: swatch.yellow.fill });
      if (h.move.hole !== undefined) {
        const at = holeAt(p, h.move.hole);
        g.circle(at.x, at.y, HIT - 10 + pulse).stroke({ width: pulse, color: swatch.yellow.fill, alpha: this.lifted === h.move.bolt ? 1 : 0.5 });
      }
    }
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Touch                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  private wallPoint(e: FederatedPointerEvent): Pt | null {
    const at = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(at.x)) return null;
    return toWall(this.layout, at);
  }

  private swinging(b: number) {
    return !!this.swings[this.puzzle.bolts[b].board];
  }

  /** Touch-down: a free bolt brightens and starts to turn; a covered one makes the board on top wobble. */
  private down(e: FederatedPointerEvent) {
    this.letGo(false);
    if (this.busy || this.finished || palmOnGlass()) return;
    if (this.build) return this.buildDown(e);
    const at = this.wallPoint(e);
    if (!at) return;
    const hit = boltAt(this.puzzle, this.state, at);
    if (hit && !this.swinging(hit.bolt)) {
      if (!hit.free) return this.coveredTap(hit.bolt);
      this.press = { bolt: hit.bolt, at, dragging: false };
      const v = this.boltView(hit.bolt);
      if (v && this.lifted !== hit.bolt) v.scale.set(1.15);
      sfx.tick();
      return;
    }
    this.press = { wall: at };
  }

  /** Levels 6–8: a pressed free bolt that travels becomes a drag, riding 40 units above the finger. */
  private move(e: FederatedPointerEvent) {
    const press = this.press;
    if (!press || !('bolt' in press) || !this.plan.holes) return;
    const at = this.wallPoint(e);
    if (!at) return;
    if (!press.dragging && Math.hypot(at.x - press.at.x, at.y - press.at.y) * this.layout.scale > 24) {
      press.dragging = true;
      this.lift(press.bolt);
    }
    if (press.dragging && this.liftedView) this.liftedView.position.set(at.x, at.y - 40 / this.layout.scale);
  }

  private up(e: FederatedPointerEvent) {
    const press = this.press;
    if (!press) return;
    this.press = null;
    const at = this.wallPoint(e);
    if (this.busy || this.finished || !at) return this.letGo(true);
    if (this.build) return this.buildTap(at);
    if ('bolt' in press) {
      const v = this.boltView(press.bolt);
      if (v) { v.scale.set(1); v.rotation = 0; }
      if (press.dragging) {
        const drop = { x: at.x, y: at.y - 40 / this.layout.scale };
        const h = holeAtPoint(this.puzzle, this.state, drop);
        if (h === null) return this.putBack();
        return this.place(h);
      }
      const b = this.puzzle.bolts[press.bolt];
      if (Math.hypot(b.x - at.x, b.y - at.y) > HIT + 20) return;
      if (!this.plan.holes) return this.take({ bolt: press.bolt });
      // Tap the lifted bolt again: it goes back. Tap another: that one is lifted instead.
      if (this.lifted === press.bolt) return this.putBack();
      return this.lift(press.bolt);
    }
    if (this.lifted === null) return;
    const h = holeAtPoint(this.puzzle, this.state, at);
    if (h === null) return this.putBack();
    this.place(h);
  }

  /** The press ends without acting; with `drop`, a lifted bolt goes back too (cancel, leaving, a resize, a lost release). */
  private letGo(drop: boolean) {
    const press = this.press;
    this.press = null;
    if (press && 'bolt' in press) {
      const v = this.boltView(press.bolt);
      if (v) { v.scale.set(1); v.rotation = 0; }
    }
    if (drop && this.lifted !== null) this.putBack();
  }

  /** Levels 6–8: lift a free bolt out, ready for a hole. */
  private lift(b: number) {
    if (this.lifted === b) return;
    if (this.lifted !== null) this.putBack();
    this.lifted = b;
    const v = this.boltView(b);
    if (v) v.visible = false;
    const art = this.fly.addChild(boltArt());
    const at = this.puzzle.bolts[b];
    art.position.set(at.x, at.y - 14);
    art.scale.set(1.2);
    this.liftedView = art;
    sfx.ratchet(3);
  }

  /** The lifted bolt goes back in its own hole, for free. */
  private putBack() {
    const b = this.lifted;
    this.lifted = null;
    this.liftedView?.destroy({ children: true });
    this.liftedView = null;
    if (b === null) return;
    const v = this.boltView(b);
    if (v) { v.visible = this.state[b] === b; v.scale.set(1); v.rotation = 0; }
    sfx.pop(2);
  }

  /** Levels 6–8: the lifted bolt into hole `h`, if it is open. */
  private place(h: number) {
    const b = this.lifted;
    if (b === null) return;
    const r = remove(this.puzzle, this.state, b, true, h);
    if (!removed(r)) {
      this.putBack();
      if (r.refused === 'hole-closed') {
        sfx.boing();
        this.sayOnce('bolt.hole-closed');
        if (!this.plan.litHoles) this.miss();
      }
      return;
    }
    const art = this.liftedView!;
    this.liftedView = null;
    this.lifted = null;
    const to = holeAt(this.puzzle, h);
    void this.ctx.tw.to(art, { x: to.x, y: to.y }, { duration: 0.22, ease: ease.outQuad }).then(() => {
      art.destroy({ children: true });
      sfx.clunk();
    });
    this.commit(r.state);
  }

  /** Levels 1–5: the bolt spins out and flies into the toolbox. */
  private take(m: Move) {
    const r = remove(this.puzzle, this.state, m.bolt, false);
    if (!removed(r)) return;
    const at = this.puzzle.bolts[m.bolt];
    const art = this.fly.addChild(boltArt());
    art.position.set(at.x, at.y);
    const to = toWall(this.layout, this.layout.toolbox);
    sfx.ratchet(3);
    void this.ctx.tw.to(art, { rotation: Math.PI * 3, y: at.y - 30 }, { duration: 0.25, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(art, { x: to.x, y: to.y - 20, alpha: 0.4 }, { duration: 0.4, ease: ease.inQuad }))
      .then(() => art.destroy({ children: true }));
    this.commit(r.state);
  }

  /** A move is made: the state changes at once and the boards catch up. */
  private commit(next: number[]) {
    this.hinted = null;
    this.history.push(this.state);
    this.state = next;
    this.sinceHint++;
    const before = this.shown.map((q) => q.kind);
    this.drawBolts();
    this.animatePoses();
    const after = this.shown.map((q) => q.kind);
    if (!this.swingSaid && after.some((k, i) => k === 'hanging' && before[i] === 'pinned')) {
      this.swingSaid = true;
      this.sayOnce('bolt.swing');
    } else if (after.some((k, i) => k === 'down' && before[i] !== 'down')) {
      this.sayOnce('bolt.down', 4);
    }
    if (done(this.puzzle, this.state, this.plan.goal)) return void this.sceneDone();
    if (this.plan.holes) {
      // Level 8 never dead-ends (a rule test searches every state), so it skips the search after each move.
      if (stuck(this.puzzle, this.state, this.plan) || (this.plan.par && this.solveAt(this.state) === null)) {
        this.undoPulse = 4;
        void this.ctx.say('bolt.stuck');
        return;
      }
      // No wander hint at level 8 (no par): with holes to spare, every move is progress.
      if (this.plan.par && this.sinceHint >= Math.max(6, 2 * this.par)) this.showHint();
    }
  }

  /** Undo, as often as she likes and free: the last bolt goes back where it was. */
  private undo() {
    if (this.busy || this.finished || !this.history.length) return;
    this.letGo(true);
    this.hinted = null;
    this.undoPulse = 0;
    this.state = this.history.pop()!;
    if (this.build) {
      if (this.picked !== null && boardBuilt(this.puzzle, this.state, this.picked)) this.picked = null;
      this.dead = !canFinish(this.puzzle, this.state);
      if (this.dead) this.undoPulse = 4;
      sfx.pop(2);
    }
    this.drawBolts();
    this.animatePoses();
    this.fillBasket();
    if (this.build) { this.drawWoodpile(); this.drawCard(); }
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Level 9: putting the wall back                                                                 */
  /* -------------------------------------------------------------------------------------------- */

  /** Touch-down: a woodpile slot lifts its board at once; anywhere else waits for the release. */
  private buildDown(e: FederatedPointerEvent) {
    const at = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(at.x)) return;
    const k = this.slots.findIndex((r) => inRect(r, at));
    if (k >= 0) {
      if (pose(this.puzzle, this.state, k).kind === 'down') this.pick(k);
      return;
    }
    const w = toWall(this.layout, at);
    this.press = { wall: w };
    if (this.pickedHoleAt(w) !== null) sfx.tick();
  }

  /** A tap on the wall: a hole of the picked board, else the body of a hanging board to pick, else the woodpile wobbles. */
  private buildTap(at: Pt) {
    const b = this.pickedHoleAt(at);
    if (b !== null) return this.tryPlace(b);
    const i = this.bodyAt(at);
    if (i !== null) return this.pick(i);
    if (this.picked === null) this.pileWobble = 0.4;
  }

  private pick(i: number) {
    if (this.picked === i) return;
    this.picked = i;
    sfx.tick();
    this.drawBolts();
    this.drawWoodpile();
  }

  /** The nearest empty hole of the picked board within reach of a touch. */
  private pickedHoleAt(at: Pt): number | null {
    const p = this.puzzle, i = this.picked;
    if (i === null) return null;
    let best: number | null = null, dist = HIT;
    p.bolts.forEach((q, b) => {
      if (q.board !== i || this.state[b] !== -1) return;
      const d = Math.hypot(q.x - at.x, q.y - at.y);
      if (d <= dist) { best = b; dist = d; }
    });
    return best;
  }

  /** The board under a touch, if the topmost one there hangs from one bolt and still misses one. */
  private bodyAt(at: Pt): number | null {
    const p = this.puzzle, qs = poses(p, this.state);
    let top: number | null = null;
    qs.forEach((q, i) => {
      if (overlaps(p, i, q, at, 1) && (top === null || p.boards[i].z > p.boards[top].z)) top = i;
    });
    return top !== null && qs[top].kind === 'hanging' && !boardBuilt(p, this.state, top) ? top : null;
  }

  /** Where the ghost finger picks board `i`: its slot, or a point on its hanging body that resolves to it. */
  private pickPoint(i: number): Pt {
    const p = this.puzzle, q = pose(p, this.state, i);
    if (q.kind === 'down') {
      const r = this.slots[i];
      return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    }
    const d = p.boards[i], c = Math.cos(q.rot), sn = Math.sin(q.rot);
    for (const [u, v] of [[0, 0], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3], [0, 0.4], [0.4, 0], [-0.4, 0], [0, -0.4]]) {
      const x = u * d.w, y = v * d.h, pt = { x: q.x + x * c - y * sn, y: q.y + x * sn + y * c };
      if (this.bodyAt(pt) === i && this.pickedHoleAt(pt) === null) return toView(this.layout, pt);
    }
    return toView(this.layout, q);
  }

  /** Bolt `b` into its hole: a covered hole is one miss while the wall can still be finished, and free at a dead end. */
  private tryPlace(b: number) {
    const p = this.puzzle, r = place(p, this.state, b);
    if (!('state' in r)) {
      if (r.refused !== 'covered') return;
      const top = coveringBoards(p, this.state, p.boards[p.bolts[b].board].z, p.bolts[b], HEAD)[0];
      if (top !== undefined) this.wobbles[top] = 0.4;
      sfx.boing();
      if (this.dead) return this.sayCovers();
      this.sayOnce('bolt.hole-closed');
      return this.miss();
    }
    this.hinted = null;
    this.history.push(this.state);
    const before = this.shown.map((q) => q.kind);
    this.state = r.state;
    const i = p.bolts[b].board;
    if (boardBuilt(p, this.state, i)) this.picked = null;
    this.drawBolts();
    this.animatePoses();
    const head = this.boltView(b);
    if (head) { head.rotation = -Math.PI * 3; void this.ctx.tw.to(head, { rotation: 0 }, { duration: 0.3, ease: ease.outQuad }); }
    sfx.ratchet(7, -1);
    this.drawWoodpile();
    this.drawCard();
    if (!this.swingSaid && this.shown.some((q, k) => q.kind === 'hanging' && before[k] === 'down')) {
      this.swingSaid = true;
      this.sayOnce('bolt.swing');
    }
    if (built(p, this.state)) return void this.sceneDone();
    this.dead = !canFinish(p, this.state);
    if (this.dead) {
      this.undoPulse = 4;
      this.lastSaid = -Infinity;
      this.sayCovers();
    }
  }

  /** At a dead end the pet names the board that covers a hole still waiting, and it wobbles. */
  private sayCovers() {
    const top = blockingBoard(this.puzzle, this.state);
    if (top === null) return;
    this.wobbles[top] = 0.4;
    this.undoPulse = 4;
    this.sayOnce(`bolt.covers.${this.colors[top]}` as LineId);
  }

  /** The woodpile: one slot per board, the board lying small in it until it is up; the picked one lifts. */
  private drawWoodpile() {
    this.woodpile.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.pileArts = [];
    const p = this.puzzle;
    this.slots.forEach((r, i) => {
      const pad = new Graphics().roundRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 18).fill({ color: wood.light, alpha: 0.85 }).stroke({ width: 4, color: wood.line, alpha: 0.6 });
      this.woodpile.addChild(pad);
      if (pose(p, this.state, i).kind !== 'down') { this.pileArts.push(null); return; }
      const d = p.boards[i];
      const art = boardArt(d.w, d.h, this.colors[i]);
      art.scale.set(Math.min(0.5 * this.layout.scale, (Math.min(150, r.w) - 24) / d.w, (Math.min(120, r.h) - 24) / d.h));
      art.position.set(r.x + r.w / 2, r.y + r.h / 2 + (this.picked === i ? -10 : 4));
      this.woodpile.addChild(art);
      this.pileArts.push(art);
    });
  }

  /** The picture card: the finished wall small, with a tick on each board that already matches it. */
  private drawCard() {
    this.card.removeChildren().forEach((c) => c.destroy({ children: true }));
    const p = this.puzzle, goal = poses(p, startState(p));
    this.card.addChild(new Graphics().roundRect(3, 5, CARD_W, CARD_H, 14).fill({ color: ink, alpha: 0.18 })
      .roundRect(0, 0, CARD_W, CARD_H, 14).fill(cream).stroke({ width: 4, color: wood.line }));
    const sc = Math.min((CARD_W - 20) / WALL_W, (CARD_H - 30) / WALL_H);
    const inner = this.card.addChild(new Container());
    inner.position.set((CARD_W - WALL_W * sc) / 2, 22);
    inner.scale.set(sc);
    inner.addChild(new Graphics().roundRect(0, 0, WALL_W, WALL_H, 30).fill(0xe8c79a));
    const order = p.boards.map((_, i) => i).sort((a, b) => p.boards[a].z - p.boards[b].z);
    const ticks = new Graphics();
    for (const i of order) {
      const q = goal[i];
      if (q.kind === 'down') continue;
      const d = p.boards[i], art = inner.addChild(boardArt(d.w, d.h, this.colors[i]));
      art.position.set(q.x, q.y);
      art.rotation = q.rot;
      if (boardBuilt(p, this.state, i)) {
        ticks.moveTo(q.x - 40, q.y).lineTo(q.x - 10, q.y + 30).lineTo(q.x + 45, q.y - 35)
          .stroke({ width: 34, color: 0xffffff, cap: 'round', join: 'round' })
          .moveTo(q.x - 40, q.y).lineTo(q.x - 10, q.y + 30).lineTo(q.x + 45, q.y - 35)
          .stroke({ width: 18, color: swatch.green.line, cap: 'round', join: 'round' });
      }
    }
    inner.addChild(ticks);
    this.card.addChild(new Graphics().circle(CARD_W / 2, 10, 9).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line }));
  }

  /** Level 9's glows: the picked board's empty holes (open ones bright, covered ones dim), its slot, and the hint. */
  private drawBuildGlow(g: Graphics, pulse: number) {
    const p = this.puzzle, s = this.state, pg = this.pileGlow;
    if (this.picked !== null) {
      p.bolts.forEach((q, b) => {
        if (q.board !== this.picked || s[b] !== -1) return;
        if (covered(p, s, b)) g.circle(q.x, q.y, 32).stroke({ width: 5, color: 0x6b7280, alpha: 0.45 });
        else g.circle(q.x, q.y, 34 + pulse / 2).stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.9 });
      });
      const r = this.slots[this.picked];
      if (r && pose(p, s, this.picked).kind === 'down') pg.roundRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4, 20).stroke({ width: 6, color: 0xffffff });
    }
    const h = this.hinted;
    if (!h || !('move' in h)) return;
    const b = h.move.bolt, i = p.bolts[b].board;
    if (this.picked === i) {
      g.circle(p.bolts[b].x, p.bolts[b].y, HIT + pulse).stroke({ width: pulse, color: swatch.yellow.fill });
      return;
    }
    const q = pose(p, s, i);
    if (q.kind === 'down') {
      const r = this.slots[i];
      if (r) pg.roundRect(r.x - pulse / 2, r.y - pulse / 2, r.w + pulse, r.h + pulse, 22).stroke({ width: pulse, color: swatch.yellow.fill });
    } else {
      const cs = corners(p, i, q);
      g.poly(cs.flatMap((c) => [c.x, c.y])).stroke({ width: pulse, color: swatch.yellow.fill });
    }
  }

  /** A covered bolt waits: the board on top wobbles, its free bolts shimmer and the pet names it. A miss from level 4. */
  private coveredTap(b: number) {
    const p = this.puzzle, bolt = p.bolts[b];
    const over = coveringBoards(p, this.state, p.boards[bolt.board].z, bolt, HEAD);
    if (!over.length) return;
    const top = over[0];
    this.wobbles[top] = 0.4;
    this.shimmer = { bolts: p.bolts.map((_, k) => k).filter((k) => p.bolts[k].board === top && isFree(p, this.state, k)), t: 1.2 };
    sfx.boing();
    this.sayOnce(`bolt.on-top.${this.colors[top]}` as LineId);
    if (this.plan.coveredMiss) this.miss();
  }

  private sayOnce(id: LineId, gap = 2.5) {
    if (this.clock - this.lastSaid < gap) return;
    this.lastSaid = this.clock;
    void this.ctx.say(id);
  }

  private miss() {
    this.misses++;
    this.sceneMisses++;
    if (this.sceneMisses % 2 === 0) this.showHint();
  }

  private solveAt(s: State) {
    const k = s.join(',');
    if (!this.solved.has(k)) this.solved.set(k, solve(this.puzzle, s, this.plan));
    return this.solved.get(k);
  }

  private hint(): Hint | null {
    if (this.build) {
      const h = hintBuild(this.puzzle, this.state);
      return h && 'bolt' in h ? { move: { bolt: h.bolt } } : h;
    }
    if (done(this.puzzle, this.state, this.plan.goal)) return null;
    if (!this.plan.holes || !this.plan.par) return hintMove(this.puzzle, this.state, this.plan);
    const path = this.solveAt(this.state);
    return path && path.length ? { move: path[0] } : this.history.length ? { undo: true } : null;
  }

  /** The hint glows until she makes a move; each glow counts once. */
  private showHint() {
    if (this.finished || this.hinted) return;
    const h = this.hint();
    if (!h) return;
    // Level 9: at a dead end the hint is the undo arrow, as level 6–7's "Stuck!", and is not counted.
    if (this.build && 'undo' in h) return this.sayCovers();
    this.hinted = h;
    this.hints++;
    this.sinceHint = 0;
    if ('undo' in h) {
      this.undoPulse = 4;
      void this.ctx.say('bolt.stuck');
    } else void this.ctx.say('bolt.hint');
  }

  /** A scene is done: the friend runs out, or the last fruit lands; then the next scene or the finish. */
  private async sceneDone() {
    this.busy = true;
    this.letGo(true);
    await this.ctx.tw.wait(0.7);
    if (this.build) {
      sfx.bell(9);
      await this.ctx.say('bolt.built');
    }
    if (this.friend) {
      const f = this.friend;
      sfx.sparkle();
      void this.ctx.say('bolt.friend-free');
      f.hop?.();
      await this.ctx.tw.to(f, { y: f.y - 30 }, { duration: 0.2, ease: ease.outQuad });
      await this.ctx.tw.to(f, { y: f.y + 30 }, { duration: 0.2, ease: ease.inQuad });
      await this.ctx.tw.to(f, { x: WALL_W + 200 }, { duration: 0.9, ease: ease.inOutSine });
    }
    this.scene++;
    if (this.scene < this.plan.scenes) {
      await this.ctx.tw.to(this.wall, { alpha: 0 }, { duration: 0.25 });
      this.buildScene();
      await this.ctx.tw.to(this.wall, { alpha: 1 }, { duration: 0.25 });
      this.busy = false;
      return;
    }
    this.finished = true;
    sfx.tada();
    this.ctx.pet.cheer();
    if (!this.build) await this.ctx.say('bolt.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/* ---------------------------------------------------------------------------------------------- */

class BoltIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const plum = fruitArt('plum');
    plum.position.set(30, -70);
    plum.scale.set(0.8);
    const plank = boardArt(150, 70, 'orange');
    plank.position.set(0, -50);
    plank.rotation = -0.12;
    c.addChild(plum, plank);
    for (const x of [-48, 48]) {
      const b = boltArt();
      b.scale.set(0.6);
      b.position.set(x, -50 + x * -0.12);
      c.addChild(b);
    }
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const color = rng.pick(COLORS);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 80).fill(swatch.yellow.light).stroke({ width: 6, color: swatch.yellow.line }));
  const plank = boardArt(130, 64, color);
  plank.rotation = rng.range(-0.4, 0.4);
  c.addChild(plank);
  const b = boltArt();
  b.scale.set(0.9);
  b.position.set(rng.range(-30, 30), -40);
  c.addChild(b);
  return c;
}

export const boltBoards: GameModule = {
  id: 'bolt-boards',
  name: 'Bolt Boards',
  titleLine: 'game.bolt-boards',
  region: 'tinker-lab',
  challenge: 'space',
  skills: ['cause-and-effect', 'planning', 'spatial-reasoning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: 'Say which board is on top, and she takes its bolts out.',
  offScreen: 'Unscrew the big bolts on a toy tool bench, or stack books and take them off from the top down.',
  hubIcon: () => new BoltIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BoltBoards(ctx),
};
