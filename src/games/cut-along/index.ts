import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor } from '../../progress/difficulty';
import { offTrail, tuneStep } from '../../learning/tracing/feedback';
import type { Point } from '../../learning/tracing/strokes';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  EDGE, LEVELS, OUTLINES, PAPER_W, RING_R, SNIP_EVERY, STRIP, boardsFor, botRoute, chooseOrder, countsStrays, cutsFor,
  differsLine, fringeMarks, hintStretch, judgeOutline, layoutFor, lengthTo, levelOf, markAt, markBox, pathOf, planFor,
  pieceColor, pieceLine, slotsFor, stickerShape, themeFor, tolerance, wrongReached, type Board, type Cut, type Layout, type Mark,
  type PieceId, type Rect, type Slot, type Theme,
  PAIR_PIECE, judgeLine, lineOfCut, makesLine, splitBoardsFor, splitSheet, twinOf, type SplitBoard,
  OWN_R, OWN_SIZE, OWN_XS, OWN_Y, botSpots, choiceAt, ownChoicesFor, pictureCut, placeIn, type PictureShape,
} from './logic';

/** One outline's cutting state: which way round, and how far the scissors have come. */
interface Track { cut: Cut; order: number | null; progress: number; tried: boolean }

interface Drag { id: number; prev: Point; track: Track | null; missed: boolean; stopped: boolean; travel: number; outside: boolean }

const PAPERS: ColorName[] = ['yellow', 'pink', 'blue', 'orange', 'green', 'purple', 'teal'];
/** A piece drawn in the picture (or a soft outline where it will go). */
function drawPiece(g: Graphics, piece: PieceId, r: Rect, ghost: boolean, theme: Theme) {
  const c = swatch[pieceColor(theme, piece)];
  const fill = ghost ? { color: 0xffffff, alpha: 0.35 } : { color: c.fill };
  const stroke = ghost ? { width: 3, color: swatch.white.line, alpha: 0.6 } : { width: 3, color: c.line, join: 'round' as const };
  const shape = (kind: keyof typeof OUTLINES) => {
    const pts = OUTLINES[kind].loop.flatMap(([x, y]) => [r.x + ((x + 1) / 2) * r.w, r.y + ((y + 1) / 2) * r.h]);
    g.poly(pts).fill(fill).stroke(stroke);
  };
  switch (piece) {
    case 'grass': {
      const pts: number[] = [r.x, r.y + r.h];
      for (let i = 0; i <= 5; i++) pts.push(r.x + (i / 5) * r.w, r.y + (i % 2 ? r.h * 0.45 : 0), r.x + ((i + 0.5) / 5) * r.w, r.y + r.h * 0.6);
      pts.push(r.x + r.w, r.y + r.h);
      g.poly(pts).fill(fill).stroke(stroke);
      break;
    }
    case 'tail': g.roundRect(r.x, r.y + r.h * 0.3, r.w, r.h * 0.4, r.h * 0.2).fill(fill).stroke(stroke); break;
    case 'plank':
      // A raft's log is rounded; a fence's plank is pointed.
      if (theme === 'raft') g.roundRect(r.x, r.y, r.w, r.h, r.w / 2).fill(fill).stroke(stroke);
      else g.poly([r.x, r.y + r.h * 0.15, r.x + r.w / 2, r.y, r.x + r.w, r.y + r.h * 0.15, r.x + r.w, r.y + r.h, r.x, r.y + r.h]).fill(fill).stroke(stroke);
      break;
    case 'mountain': g.poly([r.x, r.y + r.h, r.x + r.w * 0.3, r.y + r.h * 0.2, r.x + r.w * 0.5, r.y + r.h * 0.55, r.x + r.w * 0.72, r.y, r.x + r.w, r.y + r.h]).fill(fill).stroke(stroke); break;
    case 'sea': {
      g.moveTo(r.x, r.y + r.h);
      for (let i = 0; i <= 24; i++) g.lineTo(r.x + (i / 24) * r.w, r.y + r.h * 0.35 + Math.sin(i * 0.8) * r.h * 0.3);
      g.lineTo(r.x + r.w, r.y + r.h).closePath().fill(fill).stroke(stroke);
      break;
    }
    case 'hill': g.moveTo(r.x, r.y + r.h).quadraticCurveTo(r.x + r.w / 2, r.y - r.h * 0.9, r.x + r.w, r.y + r.h).closePath().fill(fill).stroke(stroke); break;
    case 'path': g.moveTo(r.x + r.w * 0.5, r.y).bezierCurveTo(r.x + r.w * 1.1, r.y + r.h * 0.4, r.x - r.w * 0.1, r.y + r.h * 0.6, r.x + r.w * 0.5, r.y + r.h).stroke({ ...stroke, width: ghost ? 10 : 16, color: ghost ? 0xffffff : c.fill }); break;
    case 'sun':
      if (theme === 'night' && !ghost) {
        // At night the circle is the moon: pale, with two craters.
        g.circle(r.x + r.w / 2, r.y + r.h / 2, r.w / 2).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
        g.circle(r.x + r.w * 0.38, r.y + r.h * 0.4, r.w * 0.1).circle(r.x + r.w * 0.62, r.y + r.h * 0.64, r.w * 0.07).fill({ color: swatch.yellow.line, alpha: 0.5 });
      } else shape('circle');
      break;
    case 'kite':
      shape('kite');
      if (!ghost) g.moveTo(r.x + r.w / 2, r.y).lineTo(r.x + r.w / 2, r.y + r.h).moveTo(r.x + r.w * 0.125, r.y + r.h * 0.375).lineTo(r.x + r.w * 0.875, r.y + r.h * 0.375).stroke({ width: 2, color: c.line });
      break;
    case 'window': shape('square'); if (!ghost) g.moveTo(r.x + r.w / 2, r.y).lineTo(r.x + r.w / 2, r.y + r.h).moveTo(r.x, r.y + r.h / 2).lineTo(r.x + r.w, r.y + r.h / 2).stroke({ width: 3, color: c.line }); break;
    case 'sail': case 'roof': shape('triangle'); break;
    case 'shell': {
      // A round shell with its spiral drawn in.
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.min(r.w, r.h) / 2;
      g.circle(cx, cy, R).fill(fill).stroke(stroke);
      if (!ghost) coil(g, cx, cy, R * 0.85, R * 0.12, 1.75, 1).stroke({ width: 3, color: c.line, cap: 'round' });
      break;
    }
    case 'snake': case 'coil': {
      // A snake lying in a coil, its head at the outside end; the second snake coils the other way.
      const flip = piece === 'coil' ? -1 : 1, cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.min(r.w, r.h) / 2;
      const body = Math.max(4, R * 0.28);
      coil(g, cx, cy, R * 0.8, R * 0.15, 1.5, flip).stroke({ width: ghost ? body * 0.7 : body, color: ghost ? 0xffffff : c.fill, alpha: ghost ? 0.5 : 1, cap: 'round', join: 'round' });
      const hx = cx - flip * R * 0.8;
      g.ellipse(hx, cy + R * 0.12, body * 0.8, body * 0.65).fill(fill).stroke(stroke);
      if (!ghost) g.circle(hx - flip * body * 0.3, cy + R * 0.02, Math.max(1.5, body * 0.16)).fill(ink);
      break;
    }
    case 'cat-tail': {
      // A tail rising from the cat and curling at the tip.
      const w = Math.max(4, r.w * 0.22), x0 = r.x + r.w * 0.3, top = r.y + r.h * 0.38, R = r.w * 0.34;
      g.moveTo(x0, r.y + r.h).lineTo(x0, top);
      coil(g, x0 + R, top, R, R * 0.35, 0.8, 1, true);
      g.stroke({ width: ghost ? w * 0.7 : w, color: ghost ? 0xffffff : c.fill, alpha: ghost ? 0.5 : 1, cap: 'round', join: 'round' });
      break;
    }
    default: shape(piece);
  }
}

/** A spiral path from the outer radius at the far left (far right when mirrored) inward, clockwise (or not). */
function coil(g: Graphics, cx: number, cy: number, outer: number, inner: number, turns: number, sign: number, joined = false): Graphics {
  const n = Math.ceil(turns * 40);
  for (let i = 0; i <= n; i++) {
    const u = i / n, t = u * turns * 2 * Math.PI, rr = outer - (outer - inner) * u;
    const x = cx - sign * rr * Math.cos(t), y = cy - rr * Math.sin(t);
    if (i === 0 && !joined) g.moveTo(x, y); else g.lineTo(x, y);
  }
  return g;
}

/** The host's picture behind the pieces: sky, ground and whatever the pieces belong to. */
function drawScene(g: Graphics, theme: Theme, w: number, h: number, slots: readonly Slot[]) {
  g.roundRect(0, 0, w, h, 18).fill(theme === 'night' ? swatch.blue.line : swatch.blue.light).stroke({ width: 5, color: swatch.white.line });
  g.rect(4, h * 0.7, w - 8, h * 0.3 - 4).fill(theme === 'night' ? swatch.green.line : swatch.green.light);
  const boat = (y: number) => {
    g.poly([w * 0.56, h * y, w * 0.94, h * y, w * 0.86, h * (y + 0.1), w * 0.62, h * (y + 0.1)]).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
    g.rect(w * 0.745, h * (y - 0.36), w * 0.015, h * 0.36).fill(swatch.brown.line);
  };
  switch (theme) {
    case 'hedgehog':
      g.ellipse(w * 0.5, h * 0.6, w * 0.4, h * 0.18).fill(swatch.brown.light).stroke({ width: 3, color: swatch.brown.line });
      g.circle(w * 0.86, h * 0.64, w * 0.09).fill(swatch.brown.light).stroke({ width: 3, color: swatch.brown.line });
      g.circle(w * 0.88, h * 0.61, w * 0.015).circle(w * 0.95, h * 0.66, w * 0.02).fill(ink);
      break;
    case 'kite':
      g.poly([w * 0.3, h * 0.12, w * 0.42, h * 0.26, w * 0.3, h * 0.42, w * 0.18, h * 0.26]).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      g.moveTo(w * 0.3, h * 0.42).lineTo(w * 0.55, h * 0.95).stroke({ width: 2, color: ink, alpha: 0.4 });
      break;
    case 'gift':
      g.rect(w * 0.2, h * 0.38, w * 0.6, h * 0.46).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      g.ellipse(w * 0.43, h * 0.33, w * 0.07, h * 0.05).ellipse(w * 0.57, h * 0.33, w * 0.07, h * 0.05).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
      break;
    case 'fence': g.rect(w * 0.08, h * 0.62, w * 0.86, h * 0.05).fill(swatch.brown.light); break;
    case 'raft':
      g.rect(4, h * 0.56, w - 8, h * 0.44 - 4).fill(swatch.blue.fill);
      g.circle(w * 0.84, h * 0.16, w * 0.08).fill(swatch.yellow.fill);
      break;
    case 'river':
      g.rect(4, h * 0.64, w - 8, h * 0.36 - 4).fill(swatch.blue.light);
      g.roundRect(w * 0.04, h * 0.14, w * 0.92, h * 0.16, h * 0.06).roundRect(w * 0.04, h * 0.52, w * 0.92, h * 0.1, h * 0.04).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      g.circle(w * 0.8, h * 0.14, w * 0.05).fill(cream).circle(w * 0.81, h * 0.14, w * 0.025).fill(ink);
      break;
    case 'night':
      for (const [x, y] of [[0.1, 0.1], [0.3, 0.2], [0.5, 0.08], [0.2, 0.36], [0.58, 0.3], [0.42, 0.42]]) g.circle(w * x, h * y, w * 0.012);
      g.fill({ color: swatch.white.fill, alpha: 0.7 });
      break;
    case 'harbour':
      g.rect(w * 0.08, h * 0.4, w * 0.48, h * 0.38).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
      g.moveTo(w * 0.32, h * 0.26).quadraticCurveTo(w * 0.24, h * 0.32, w * 0.3, h * 0.38).stroke({ width: 2, color: ink, alpha: 0.4 });
      boat(0.7);
      break;
    case 'pond': g.ellipse(w * 0.5, h * 0.86, w * 0.3, h * 0.06).fill(swatch.blue.fill); break;
    case 'garland':
      g.moveTo(w * 0.04, h * 0.18).quadraticCurveTo(w * 0.5, h * 0.36, w * 0.96, h * 0.18).stroke({ width: 3, color: ink, alpha: 0.45 });
      break;
    case 'boats':
      g.rect(w * 0.1, h * 0.52, w * 0.32, h * 0.3).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
      boat(0.72);
      break;
    case 'twos':
      // A house waiting for two windows, two boats for two sails, and a fence with two boards missing.
      g.poly([w * 0.03, h * 0.36, w * 0.26, h * 0.16, w * 0.49, h * 0.36]).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      g.rect(w * 0.06, h * 0.36, w * 0.4, h * 0.32).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
      g.rect(w * 0.5, h * 0.62, w * 0.46, h * 0.1).fill(swatch.blue.fill);
      for (const x of [0.52, 0.76]) {
        g.poly([w * x, h * 0.57, w * (x + 0.2), h * 0.57, w * (x + 0.17), h * 0.64, w * (x + 0.03), h * 0.64]).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
        g.rect(w * (x + 0.09), h * 0.28, w * 0.012, h * 0.29).fill(swatch.brown.line);
      }
      g.rect(w * 0.04, h * 0.8, w * 0.44, h * 0.03).rect(w * 0.04, h * 0.89, w * 0.44, h * 0.03).fill(swatch.brown.light);
      for (const x of [0.03, 0.22, 0.41]) g.rect(w * x, h * 0.76, w * 0.06, h * 0.2).fill(swatch.brown.fill).stroke({ width: 2, color: swatch.brown.line });
      break;
    case 'garden': {
      // A garden path: a snail waiting for its shell, flowers, and a sitting cat when a tail is wanted.
      g.moveTo(w * 0.3, h * 0.94).quadraticCurveTo(w * 0.5, h * 0.8, w * 0.7, h * 0.72).stroke({ width: h * 0.06, color: swatch.brown.light, cap: 'round' });
      g.ellipse(w * 0.22, h * 0.72, w * 0.16, h * 0.04).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      g.moveTo(w * 0.07, h * 0.71).lineTo(w * 0.04, h * 0.6).moveTo(w * 0.1, h * 0.71).lineTo(w * 0.1, h * 0.6).stroke({ width: 2, color: swatch.green.line });
      g.circle(w * 0.04, h * 0.6, w * 0.012).circle(w * 0.1, h * 0.6, w * 0.012).fill(ink);
      for (const [x, y, col] of [[0.48, 0.2, 'pink'], [0.6, 0.12, 'yellow'], [0.12, 0.2, 'purple']] as const) {
        g.circle(w * x, h * y, w * 0.035).fill(swatch[col].fill).circle(w * x, h * y, w * 0.012).fill(swatch.yellow.light);
      }
      if (slots.some((s) => s.piece === 'cat-tail')) {
        g.ellipse(w * 0.76, h * 0.56, w * 0.09, h * 0.12).fill(swatch.orange.light).stroke({ width: 3, color: swatch.orange.line });
        g.circle(w * 0.72, h * 0.38, w * 0.07).fill(swatch.orange.light).stroke({ width: 3, color: swatch.orange.line });
        g.poly([w * 0.66, h * 0.35, w * 0.67, h * 0.27, w * 0.7, h * 0.32]).poly([w * 0.74, h * 0.32, w * 0.77, h * 0.27, w * 0.78, h * 0.35]).fill(swatch.orange.line);
        g.circle(w * 0.7, h * 0.38, w * 0.01).circle(w * 0.745, h * 0.38, w * 0.01).fill(ink);
      }
      break;
    }
    default: // meadow, mountains and day: sky and ground only
  }
}

/** The big round-tipped scissors, blades along +x from the pivot at (0, 0), about 120 long. */
class Scissors extends Container {
  private readonly top = new Graphics();
  private readonly bottom = new Graphics();
  open = 0;
  constructor() {
    super();
    const blade = (g: Graphics, sign: number, color: number) => {
      g.moveTo(-6, 0).lineTo(58, sign * 4).arc(58, 0, 7, sign > 0 ? Math.PI / 2 : -Math.PI / 2, sign > 0 ? -Math.PI / 2 : Math.PI / 2, sign > 0)
        .lineTo(-6, -sign * 2).closePath().fill(0xe8edf5).stroke({ width: 3, color: swatch.white.line, join: 'round' });
      g.ellipse(-34, sign * 16, 22, 14).fill(color).stroke({ width: 4, color: ink, alpha: 0.35 }).ellipse(-34, sign * 16, 11, 6).fill(cream);
    };
    blade(this.top, -1, swatch.red.fill);
    blade(this.bottom, 1, swatch.red.fill);
    this.addChild(this.bottom, this.top, new Graphics().circle(0, 0, 6).fill(swatch.white.line));
    this.eventMode = 'none';
  }
  set opening(k: number) {
    this.open = k;
    this.top.rotation = -0.38 * k;
    this.bottom.rotation = 0.38 * k;
  }
}

class CutAlong implements Game {
  private readonly level: number;
  private readonly plan: ReturnType<typeof planFor>;
  private readonly tol: number;
  private layout: Layout;
  private readonly back = new Graphics();
  private readonly paper = new Container();
  private readonly sheetG = new Graphics();
  private readonly lineG = new Graphics();
  private readonly slitG = new Graphics();
  private readonly cueG = new Graphics();
  private readonly scissors = new Scissors();
  private readonly bee = new Graphics();
  private readonly picture = new Container();
  private readonly sceneG = new Graphics();
  private readonly piecesG = new Graphics();
  private readonly layer = new Container();
  private readonly flyers = new Container();
  /** Level 11's cut piece, waiting above everything for her to carry it into the picture. */
  private readonly hand = new Container();

  // Level 1
  private marks: Mark[] = [];
  private snipped = new Set<number>();
  // Levels 2–7
  private cuts: Cut[] = [];
  // Level 8
  private boards: Board[] = [];
  // Level 10
  private splits: SplitBoard[] = [];
  // Level 11: the shapes each sheet offers, whether she is still choosing, the piece she carries, and where pieces went.
  private choices: PictureShape[][] = [];
  private choosing = false;
  private held: { holder: Container; inner: Graphics; piece: PieceId; handle: DragHandle } | null = null;
  private owned: { piece: PieceId; x: number; y: number }[] = [];
  private spots: { x: number; y: number }[] = [];
  private index = 0;
  private tracks: Track[] = [];
  private active: Track | null = null;
  private slots: Slot[] = [];
  private placed = new Set<number>();

  private drag: Drag | null = null;
  private busy = true;
  private finished = false;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private glow = false;
  private beeShown = false;
  private clock = 0;
  private lastEvent = 0;
  private wiggle = 0;
  private snipAt = 0;
  private note = -1;
  private paperColor: ColorName = 'yellow';
  private theme: Theme = 'meadow';

  constructor(private readonly ctx: GameContext) {

    this.level = levelOf(ctx.level);
    this.plan = planFor(this.level);
    this.tol = tolerance(this.level);
    this.layout = layoutFor(ctx.view, this.level);
    if (this.plan.mode === 'own') { this.choices = ownChoicesFor(ctx.rng); this.spots = botSpots(ctx.rng); }
    if (this.plan.mode === 'fits') this.boards = boardsFor(ctx.rng);
    else if (this.plan.mode === 'two') this.splits = splitBoardsFor(ctx.rng);
    else if (this.plan.mode === 'cut') this.cuts = cutsFor(this.level, ctx.rng);
    // The how-to card's demonstration plays one piece.
    if (ctx.demo) { this.cuts = this.cuts.slice(-1); this.boards = this.boards.slice(0, 1); this.splits = this.splits.slice(0, 1); this.choices = this.choices.slice(0, 1); }
    const pieces: PieceId[] = this.plan.mode === 'snip' ? Array(ctx.demo ? 1 : 3).fill('grass') : this.cuts.map((c) => c.piece);
    this.theme = themeFor(this.level, ctx.rng);
    this.slots = slotsFor(this.level, this.theme, pieces);
    if (this.plan.mode === 'fits') this.fillUnusedGaps();

    this.paper.addChild(this.sheetG, this.lineG, this.slitG, this.cueG, this.scissors, this.bee);
    this.picture.addChild(this.sceneG, this.piecesG);
    for (const g of [this.back, this.sheetG, this.lineG, this.slitG, this.cueG, this.bee, this.sceneG, this.piecesG]) g.eventMode = 'none';
    this.paper.eventMode = 'none';
    this.flyers.eventMode = 'none';
    this.hand.eventMode = 'passive';
    this.layer.eventMode = 'static';
    this.layer.on('pointerdown', (e) => this.down(e));
    this.layer.on('globalpointermove', (e) => this.move(e));
    this.layer.on('pointerup', (e) => this.up(e));
    this.layer.on('pointerupoutside', (e) => this.up(e));
    // Pixi does not pass a cancelled touch on, so the window is watched for it.
    this.ctx.listen(window, 'pointercancel', this.cancel, { capture: true });
    onTap(this.picture, () => void this.ctx.instruct(this.instructLine()), { cooldown: 600 });
    ctx.stage.addChild(this.back, this.paper, this.picture, this.flyers, this.layer, this.hand);
    this.nextSheet();
    this.resize(ctx.view);
  }

  /** At level 8 the gaps this round does not use are already filled. */
  private fillUnusedGaps() {
    const used = new Set<string>(this.boards.map((b) => b.gap));
    this.slots.forEach((s, i) => { if (!used.has(s.piece)) this.placed.add(i); });
  }

  private instructLine(): LineId {
    if (this.level === 9) return 'cut.instruct.round';
    if (this.plan.mode === 'own') return this.held ? 'cut.place' : this.choosing ? 'cut.instruct.own' : 'cut.instruct.ring';
    if (this.plan.mode === 'two') return `cut.instruct.two.${this.splits[Math.min(this.index, this.splits.length - 1)].need}`;
    return this.plan.mode === 'snip' ? 'cut.instruct.snip' : this.plan.mode === 'fits' ? 'cut.instruct.fits' : 'cut.instruct.ring';
  }

  private get pieceCount() {
    if (this.plan.mode === 'own') return this.choices.length;
    return this.plan.mode === 'snip' ? this.slots.length : this.plan.mode === 'fits' ? this.boards.length : this.plan.mode === 'two' ? this.splits.length : this.cuts.length;
  }

  /** Lay out the next sheet (or the next strip, or the next board). */
  private nextSheet() {
    this.paperColor = PAPERS[(this.index * 3 + this.level) % PAPERS.length];
    this.wrong = 0; this.glow = false; this.beeShown = false; this.active = null;
    if (this.plan.mode === 'snip') {
      this.marks = fringeMarks(this.ctx.rng);
      this.snipped = new Set();
      this.tracks = [];
    } else if (this.plan.mode === 'fits') {
      this.tracks = this.boards[this.index].cuts.map((cut) => ({ cut, order: null, progress: 0, tried: false }));
    } else if (this.plan.mode === 'two') {
      this.tracks = this.splits[this.index].cuts.map((cut) => ({ cut, order: null, progress: 0, tried: false }));
    } else if (this.plan.mode === 'own') {
      this.tracks = [];
      this.choosing = true;
    } else {
      this.tracks = [{ cut: this.cuts[this.index], order: null, progress: 0, tried: false }];
      this.active = this.tracks[0];
    }
    this.note = -1; this.snipAt = 0;
    this.drawPaper();
  }

  private get s() { return this.layout.paper.s; }
  private toPaper(p: Point): { x: number; y: number } { return { x: p[0] * this.s, y: p[1] * this.s }; }

  /* ------------------------------------------------------------ drawing */

  private drawPaper() {
    const s = this.s, sheet = this.sheetG.clear(), lines = this.lineG.clear();
    const color = swatch[this.paperColor];
    if (this.plan.mode === 'snip') {
      sheet.rect(STRIP.x * s, STRIP.y * s, STRIP.w * s, STRIP.h * s).fill(color.fill).stroke({ width: 4, color: color.line });
      this.marks.forEach((m, i) => {
        if (this.snipped.has(i)) return;
        lines.moveTo(m.x * s, s).lineTo(m.x * s, (1 - m.length) * s).stroke({ width: 14, color: ink, alpha: 0.75, cap: 'round' });
      });
    } else if (this.choosing) {
      // Level 11 offers three shapes, drawn small with a soft tile behind each; she taps the one she wants.
      sheet.rect(0, 0, PAPER_W * s, s).fill(color.fill).stroke({ width: 4, color: color.line });
      this.choices[this.index].forEach((k, i) => {
        const cx = OWN_XS[i] * s, cy = OWN_Y * s;
        sheet.roundRect(cx - 0.19 * s, cy - 0.19 * s, 0.38 * s, 0.38 * s, 18).fill({ color: 0xffffff, alpha: 0.4 });
        // Drawn whole, not dashed: this is a picture to choose from, and the cut itself is dashed once she has chosen.
        lines.poly(OUTLINES[k].loop.flatMap(([x, y]) => [(OWN_XS[i] + x * OWN_R) * s, (OWN_Y + y * OWN_R) * s]))
          .fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 5, color: ink, alpha: 0.7, join: 'round' });
      });
    } else {
      const sh = this.tracks[0].cut.sheet;
      sheet.rect(sh.x * s, sh.y * s, sh.w * s, sh.h * s).fill(color.fill).stroke({ width: 4, color: color.line });
      const thick = this.level <= 2 ? 12 : 7;
      // At level 10 each line has a cut from either end; its dashes are drawn once.
      this.tracks.forEach((t, i) => { if (this.plan.mode !== 'two' || i % 2 === 0) this.dashes(lines, t.cut.orders[0], thick); });
      const fit = this.fitTrack();
      if (this.glow && fit) {
        const pts = fit.cut.orders[0];
        lines.moveTo(pts[0][0] * s, pts[0][1] * s);
        pts.forEach((p) => lines.lineTo(p[0] * s, p[1] * s));
        lines.stroke({ width: 20, color: swatch.yellow.fill, alpha: 0.55, cap: 'round', join: 'round' });
        this.dashes(lines, pts, thick);
      }
    }
    this.drawSlit();
  }

  /** A dashed line along the points, about 18 units on and 12 off. */
  private dashes(g: Graphics, pts: readonly Point[], width: number) {
    const s = this.s;
    let run = 0, on = true;
    g.moveTo(pts[0][0] * s, pts[0][1] * s);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      run += Math.hypot(b[0] - a[0], b[1] - a[1]) * s;
      if (on) g.lineTo(b[0] * s, b[1] * s); else g.moveTo(b[0] * s, b[1] * s);
      if (run >= (on ? 18 : 12)) { run = 0; on = !on; }
    }
    g.stroke({ width, color: ink, alpha: 0.7, cap: 'round' });
  }

  /** The outline (level 8) or line (level 10) that works: at level 10 the cut from whichever end she has started. */
  private fitTrack(): Track | null {
    if (this.plan.mode === 'fits') return this.tracks[this.boards[this.index].fits];
    if (this.plan.mode !== 'two') return null;
    const i = 2 * this.splits[this.index].fits;
    return this.tracks[i + 1].progress > 0 ? this.tracks[i + 1] : this.tracks[i];
  }

  /** At level 10, the cut from the other end of the same line; a line cut from one end hides the other end's ring. */
  private twin(t: Track): Track | null {
    return this.plan.mode === 'two' ? this.tracks[twinOf(this.tracks.indexOf(t))] : null;
  }
  private startable(t: Track): boolean { return t.progress > 0 || !(this.twin(t)?.progress); }

  private drawSlit() {
    const g = this.slitG.clear(), s = this.s;
    for (const t of this.tracks) {
      if (t.progress <= 0) continue;
      const pts = pathOf(t.cut, t.order).slice(0, t.progress + 1);
      g.moveTo(pts[0][0] * s, pts[0][1] * s);
      pts.forEach((p) => g.lineTo(p[0] * s, p[1] * s));
      g.stroke({ width: 5, color: cream, cap: 'round', join: 'round' }).stroke({ width: 1.5, color: ink, alpha: 0.6 });
    }
    this.placeScissors();
  }

  private placeScissors() {
    const sc = this.scissors;
    if (this.plan.mode === 'snip') {
      // The scissors wait beside the next mark.
      const next = this.marks.findIndex((_, i) => !this.snipped.has(i));
      sc.visible = next >= 0 && !this.busy;
      if (next >= 0) { sc.position.set(this.marks[next].x * this.s, (STRIP.y + 0.08) * this.s); sc.rotation = Math.PI / 2; }
      return;
    }
    const t = this.active;
    sc.visible = !!t && !this.finished;
    if (!t) return;
    const pts = pathOf(t.cut, t.order), here = pts[t.progress], ahead = pts[Math.min(pts.length - 1, t.progress + 3)];
    sc.position.set(here[0] * this.s, here[1] * this.s);
    if (ahead !== here) sc.rotation = Math.atan2(ahead[1] - here[1], ahead[0] - here[0]);
  }

  private drawPicture() {
    const { w, h } = this.layout.picture;
    this.sceneG.clear(); drawScene(this.sceneG, this.theme, w, h, this.slots);
    const g = this.piecesG.clear();
    this.slots.forEach((slot, i) => drawPiece(g, slot.piece, { x: slot.x * w, y: slot.y * h, w: slot.w * w, h: slot.h * h }, !this.placed.has(i), this.theme));
    const side = OWN_SIZE * w;
    for (const o of this.owned) drawPiece(g, o.piece, { x: o.x * w - side / 2, y: o.y * h - side / 2, w: side, h: side }, false, this.theme);
  }

  /* ------------------------------------------------------------ input */

  private local(e: FederatedPointerEvent): Point {
    const p = this.paper.toLocal(e.global);
    return [p.x / this.s, p.y / this.s];
  }

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.drag || palmOnGlass()) return;
    const p = this.local(e);
    this.lastEvent = this.clock;
    if (this.plan.mode === 'snip') {
      this.drag = { id: e.pointerId, prev: p, track: null, missed: false, stopped: false, travel: 0, outside: false };
      if (!this.snipMark(p)) this.wiggle = 0.5;
      return;
    }
    if (this.choosing) {
      // Any offered shape is a fine choice; a touch between them chooses nothing.
      const i = choiceAt(p);
      if (i === null) { sfx.tick(); return; }
      this.choose(i);
      return;
    }
    // A touch on the scissors (or a start ring) carries on; anywhere else the scissors wiggle to show where they are.
    const reach = (RING_R + 12) / this.s;
    let best: Track | null = null, bestD = Infinity;
    for (const t of this.tracks) {
      if (!this.startable(t)) continue;
      const at = pathOf(t.cut, t.order)[t.progress];
      const d = Math.hypot(p[0] - at[0], p[1] - at[1]);
      if (d <= reach && d < bestD) { best = t; bestD = d; }
    }
    if (!best) { this.wiggle = 0.5; sfx.tick(); return; }
    this.active = best;
    this.drag = { id: e.pointerId, prev: pathOf(best.cut, best.order)[best.progress], track: best, missed: false, stopped: false, travel: 0, outside: false };
    this.scissors.opening = 1;
    this.placeScissors();
  }

  private move(e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id || this.busy || this.finished) return;
    this.lastEvent = this.clock;
    const to = this.local(e);
    d.outside = to[0] < -EDGE / this.s || to[0] > PAPER_W + EDGE / this.s || to[1] < 0 || to[1] > 1 + EDGE / this.s;
    if (this.plan.mode === 'snip') { this.snipMark(to); d.prev = to; return; }
    const t = d.track;
    if (!t || d.stopped) return;
    const before = t.progress, pts = pathOf(t.cut, t.order);
    const next = chooseOrder(t.cut, t.order, t.progress, d.prev, to, this.tol);
    t.order = next.order; t.progress = next.progress;
    d.prev = to;
    if (t.progress === before) {
      const checkpoint = pts[t.progress];
      if (countsStrays(this.level) && !d.missed && offTrail(to, checkpoint, this.tol)) {
        d.missed = true;
        this.miss('cut.back-to-scissors');
      }
      return;
    }
    this.advanced(t, before);
  }

  private advanced(t: Track, before: number) {
    const pts = pathOf(t.cut, t.order), s = this.s;
    const gone = (lengthTo(pts, t.progress) - lengthTo(pts, before)) * s;
    this.snipAt += gone;
    while (this.snipAt >= SNIP_EVERY) {
      this.snipAt -= SNIP_EVERY;
      sfx.snip();
      this.scissors.opening = this.scissors.open > 0.5 ? 0.1 : 1;
    }
    const step = tuneStep(t.progress, pts.length);
    if (step !== this.note) { this.note = step; sfx.bell(5 + step, 0.12); }
    this.drawSlit();
    if (this.plan.mode === 'fits' && !judgeOutline(this.boards[this.index], this.tracks.indexOf(t)) && wrongReached(t.progress, pts.length)) {
      void this.wrongOutline(t);
      return;
    }
    if (this.plan.mode === 'two' && !judgeLine(this.splits[this.index], lineOfCut(this.tracks.indexOf(t))) && wrongReached(t.progress, pts.length)) {
      void this.wrongOutline(t);
      return;
    }
    if (t.progress === pts.length - 1) void this.cutDone(t);
  }

  private up(e: FederatedPointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.release();
  }

  private readonly cancel = (e: PointerEvent) => {
    if (this.drag && e.pointerId === this.drag.id) this.release();
  };

  private release() {
    this.drag = null;
    this.scissors.opening = 0.3;
    // After the hint lights the next stretch, a paper bee flies it once she lifts.
    if (this.glow && !this.beeShown && this.active && this.lightsStretch) { this.beeShown = true; void this.flyBee(this.active); }
  }

  /* ------------------------------------------------------------ rules */

  /** Levels that light the next stretch for a hint (levels 8 and 10 glow the piece or line that works instead). */
  private get lightsStretch() { return this.plan.mode === 'cut' || this.plan.mode === 'own'; }

  /** Level 11: the chosen shape grows to full size with its lead-in and ring, and she cuts it as at level 7. */
  private choose(i: number) {
    const kind = this.choices[this.index][i];
    this.choosing = false;
    this.tracks = [{ cut: pictureCut(kind), order: null, progress: 0, tried: false }];
    this.active = this.tracks[0];
    sfx.pop(5 + i);
    this.drawPaper();
    void this.ctx.instruct('cut.instruct.ring');
  }

  /** Level 11: the cut piece lifts off the paper and waits for her to carry it anywhere into the picture. */
  private holdPiece(t: Track) {
    const s = this.s, color = swatch[this.paperColor], p = this.layout.paper;
    const inner = new Graphics().poly(t.cut.outline!.flatMap((q) => [q[0] * s, q[1] * s])).fill(color.fill).stroke({ width: 4, color: color.line });
    const b = inner.getLocalBounds();
    inner.pivot.set(b.x + b.width / 2, b.y + b.height / 2);
    const holder = new Container();
    holder.addChild(inner);
    holder.position.set(p.x + b.x + b.width / 2, p.y + b.y + b.height / 2);
    this.hand.addChild(holder);
    const fit = (OWN_SIZE * this.layout.picture.w) / Math.max(b.width, b.height);
    const handle = draggable(holder, this.ctx.tw, {
      onPick: () => void this.ctx.tw.to(inner.scale, { x: fit, y: fit }, { duration: 0.2, ease: ease.outQuad }),
      onDrop: (x, y) => { void this.placePiece(x, y); return true; },
    });
    this.held = { holder, inner, piece: t.cut.piece, handle };
    void this.ctx.tw.to(holder, { y: holder.y - 20 }, { duration: 0.25, ease: ease.outQuad });
    void this.ctx.say('cut.place');
  }

  /** Let go at (x, y) on the stage: inside the picture it stays where she put it; anywhere else it floats to the middle. */
  private async placePiece(x: number, y: number) {
    const h = this.held;
    if (!h || this.finished) return;
    h.handle.enabled = false;
    const pic = this.layout.picture, q = this.picture.toLocal({ x, y }, this.hand);
    const at = placeIn(q.x / pic.w, q.y / pic.h);
    const to = this.hand.toLocal(this.picture.toGlobal({ x: at.x * pic.w, y: at.y * pic.h }));
    const fit = (OWN_SIZE * pic.w) / Math.max(h.inner.width / h.inner.scale.x, h.inner.height / h.inner.scale.y);
    await Promise.all([
      this.ctx.tw.to(h.holder, { x: to.x, y: to.y }, { duration: 0.35, ease: ease.inOutSine }),
      this.ctx.tw.to(h.inner.scale, { x: fit, y: fit }, { duration: 0.35, ease: ease.inOutSine }),
    ]);
    if (this.held !== h) return;
    h.handle.destroy();
    h.holder.destroy({ children: true });
    this.held = null;
    this.owned.push({ piece: h.piece, ...at });
    this.drawPicture();
    sfx.pop(7);
    await this.ctx.say(pieceLine(this.theme, h.piece) as LineId);
    this.nextPiece();
  }

  /** On to the next sheet, or the end of the round. */
  private nextPiece() {
    this.index++;
    if (this.index >= this.pieceCount) return void this.finish();
    this.nextSheet();
    this.busy = false;
    this.placeScissors();
    void this.ctx.instruct(this.instructLine());
  }

  private snipMark(p: Point): boolean {
    const i = markAt(this.marks, this.snipped, p, this.s);
    if (i === null) return false;
    this.snipped.add(i);
    sfx.snip();
    sfx.bell(5 + this.snipped.size, 0.12);
    this.scissors.opening = 1;
    this.curl(i);
    this.drawPaper(); this.placeScissors();
    if (this.snipped.size === this.marks.length) void this.pieceDone(null);
    return true;
  }

  /** A snipped fringe curls up a little. */
  private curl(i: number) {
    const m = this.marks[i], s = this.s;
    const g = new Graphics().moveTo(0, 0).quadraticCurveTo(10, -m.length * s * 0.5, 0, -m.length * s).stroke({ width: 4, color: swatch[this.paperColor].line });
    g.position.set(m.x * s, s);
    this.sheetG.parent?.addChildAt(g, 1);
    this.curls.push(g);
  }
  private curls: Graphics[] = [];

  private miss(line: LineId) {
    this.misses++; this.wrong++;
    sfx.boing();
    void this.ctx.say(line);
    if (this.wrong % 2 === 0) {
      this.hints++;
      this.glow = true; this.beeShown = false;
      this.drawPaper();
    }
  }

  /** A fifth into an outline that does not fit (level 8) or a line that makes the wrong pair (level 10): once each, a miss. */
  private async wrongOutline(t: Track) {
    const i = this.tracks.indexOf(t), twin = this.twin(t);
    if (this.drag) this.drag.stopped = true;
    this.busy = true;
    if (!t.tried) {
      t.tried = true; if (twin) twin.tried = true;
      this.misses++; this.wrong++; if (this.wrong % 2 === 0) { this.hints++; this.glow = true; }
    }
    sfx.boing();
    await this.ctx.say(this.plan.mode === 'two' ? makesLine(this.splits[this.index], lineOfCut(i)) : differsLine(this.boards[this.index], i));
    // Its slit closes back up; the outline (or line) that works is still uncut.
    t.progress = 0; t.order = null;
    if (twin) { twin.progress = 0; twin.order = null; }
    this.active = null;
    this.busy = false;
    this.drawPaper();
  }

  private async cutDone(t: Track) {
    if (this.drag) this.drag.stopped = true;
    await this.pieceDone(t);
  }

  /** The piece drops free and floats into its place in the picture (at level 10, both halves, each into one of a pair). */
  private async pieceDone(t: Track | null) {
    this.busy = true;
    this.placeScissors();
    sfx.sparkle();
    if (this.plan.mode === 'own' && t) {
      this.sheetG.clear(); this.lineG.clear(); this.slitG.clear(); this.cueG.clear();
      this.scissors.visible = false;
      this.holdPiece(t);
      return;
    }
    const s = this.s, color = swatch[this.paperColor];
    const parts: { poly: readonly Point[]; slot: number }[] = [];
    if (!t) {
      parts.push({ poly: [[STRIP.x, STRIP.y], [STRIP.x + STRIP.w, STRIP.y], [STRIP.x + STRIP.w, STRIP.y + STRIP.h], [STRIP.x, STRIP.y + STRIP.h]], slot: this.index });
    } else if (this.plan.mode === 'two') {
      const board = this.splits[this.index], piece = PAIR_PIECE[board.need];
      const pair = this.slots.flatMap((sl, i) => (sl.piece === piece ? [i] : []));
      splitSheet(board.sheet, board.lines[board.fits]).forEach((poly, k) => parts.push({ poly, slot: pair[k] }));
    } else {
      const cut = t.cut, sh = cut.sheet;
      const poly = cut.outline ?? [...[...cut.orders[0]].sort((a, b) => a[0] - b[0]), [sh.x + sh.w, sh.y + sh.h] as Point, [sh.x, sh.y + sh.h] as Point];
      const slot = this.plan.mode === 'fits'
        ? this.slots.findIndex((sl) => sl.piece === (this.boards[this.index].gap === 'roof' ? 'roof' : this.boards[this.index].gap))
        : this.index;
      parts.push({ poly, slot });
    }
    const p = this.layout.paper, pic = this.layout.picture;
    const flying = parts.map(({ poly, slot }) => {
      const piece = new Graphics().poly(poly.flatMap((q) => [q[0] * s, q[1] * s])).fill(color.fill).stroke({ width: 4, color: color.line });
      const holder = new Container();
      holder.addChild(piece);
      const b = piece.getLocalBounds();
      piece.position.set(-b.x - b.width / 2, -b.y - b.height / 2);
      holder.position.set(p.x + b.x + b.width / 2, p.y + b.y + b.height / 2);
      this.flyers.addChild(holder);
      const sl = this.slots[slot], sw = sl.w * pic.w, sh = sl.h * pic.h;
      // At level 10 a long piece turns to lie the way its gap does (a fence board stands up).
      const turn = this.plan.mode === 'two' && (b.width > b.height * 1.2) !== (sw > sh * 1.2);
      const k = turn ? Math.min(sw / b.height, sh / b.width) : Math.min(sw / b.width, sh / b.height);
      return { holder, slot, turn, k, tx: pic.x + (sl.x + sl.w / 2) * pic.w, ty: pic.y + (sl.y + sl.h / 2) * pic.h };
    });
    // The rest of the sheet clears while the piece floats.
    this.sheetG.clear(); this.lineG.clear(); this.slitG.clear(); this.cueG.clear();
    this.curls.forEach((c) => c.destroy()); this.curls = [];
    this.scissors.visible = false;
    await Promise.all(flying.map((f) => this.ctx.tw.to(f.holder, { y: f.holder.y + 30 }, { duration: 0.25, ease: ease.outQuad })));
    await Promise.all(flying.flatMap((f) => [
      this.ctx.tw.to(f.holder, { x: f.tx, y: f.ty, rotation: f.turn ? Math.PI / 2 : 0 }, { duration: 0.7, ease: ease.inOutSine }),
      this.ctx.tw.to(f.holder.scale, { x: f.k, y: f.k }, { duration: 0.7, ease: ease.inOutSine }),
    ]));
    for (const f of flying) { f.holder.destroy({ children: true }); this.placed.add(f.slot); }
    this.drawPicture();
    sfx.pop(7);
    await this.ctx.say(pieceLine(this.theme, this.slots[flying[0].slot].piece) as LineId);
    this.nextPiece();
  }

  private async finish() {
    this.finished = true;
    sfx.tada();
    void this.ctx.tw.to(this.picture.scale, { x: 1.08, y: 1.08 }, { duration: 0.3, ease: ease.outBack }).then(() => this.ctx.tw.to(this.picture.scale, { x: 1, y: 1 }, { duration: 0.3 }));
    await this.ctx.say('cut.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** A small paper bee flies the lit stretch and back: a drawing, not the ghost finger. */
  private async flyBee(t: Track) {
    const pts = hintStretch(pathOf(t.cut, t.order), t.progress), s = this.s;
    const bee = this.bee.clear().ellipse(-8, -10, 9, 6).ellipse(8, -10, 9, 6).fill({ color: 0xffffff, alpha: 0.9 })
      .ellipse(0, 0, 14, 10).fill(swatch.yellow.fill).stroke({ width: 3, color: ink })
      .moveTo(-3, -9).lineTo(-3, 9).moveTo(4, -9).lineTo(4, 9).stroke({ width: 3, color: ink });
    bee.visible = true;
    const route = [...pts, ...[...pts].reverse()];
    for (const p of route) {
      if (this.finished || this.drag) break;
      await this.ctx.tw.to(bee, { x: p[0] * s, y: p[1] * s - 26 }, { duration: 0.07 });
    }
    bee.visible = false;
  }

  /* ------------------------------------------------------------ shell */

  start() {
    this.busy = false;
    this.placeScissors();
    void this.ctx.instruct(this.instructLine());
  }

  resize(v: View) {

    this.layout = layoutFor(v, this.level);
    const { paper, picture } = this.layout;
    this.back.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.paper.position.set(paper.x, paper.y);
    this.picture.position.set(picture.x + picture.w / 2, picture.y + picture.h / 2);
    this.picture.pivot.set(picture.w / 2, picture.h / 2);
    this.picture.hitArea = new Rectangle(0, 0, picture.w, picture.h);
    this.layer.hitArea = new Rectangle(paper.x - EDGE, paper.y, paper.w + 2 * EDGE, paper.h + EDGE);
    this.drawPaper();
    this.drawPicture();
    this.curls.forEach((c) => c.destroy());
    this.curls = [];
    this.marks.forEach((_, i) => { if (this.snipped.has(i)) this.curl(i); });
    // A piece waiting to be carried moves with the paper.
    if (this.held && !this.held.handle.dragging && this.held.handle.enabled) {
      this.held.holder.position.set(paper.x + paper.w / 2, paper.y + paper.h * 0.4);
      this.held.handle.home = { x: this.held.holder.x, y: this.held.holder.y };
    }
  }

  update(dt: number) {
    this.clock += dt;
    // A finger that left the screen without a release: after half a second of silence outside the paper, it has lifted.
    if (this.drag?.outside && this.clock - this.lastEvent > 0.5) this.release();
    const sc = this.scissors;
    if (this.wiggle > 0) {
      this.wiggle = Math.max(0, this.wiggle - dt);
      sc.scale.set(1 + 0.15 * Math.sin(this.wiggle * 30));
    } else sc.scale.set(1);
    if (!this.drag && sc.open > 0.3) sc.opening = Math.max(0.3, sc.open - dt * 2);
    this.drawCue();
  }

  /** The green start rings, and after two misses the next stretch lit in yellow dots. */
  private drawCue() {
    const g = this.cueG.clear(), s = this.s;
    if (this.busy || this.finished || this.plan.mode === 'snip') return;
    const pulse = 1 + 0.05 * Math.sin(this.clock * 4);
    for (const t of this.tracks) {
      if (t.progress > 0 || !this.startable(t)) continue;
      const at = t.cut.orders[0][0];
      g.circle(at[0] * s, at[1] * s, RING_R * pulse).fill({ color: swatch.green.light, alpha: 0.45 }).stroke({ width: 7, color: swatch.green.fill });
    }
    if (this.glow && this.active && this.lightsStretch) {
      for (const p of hintStretch(pathOf(this.active.cut, this.active.order), this.active.progress)) g.circle(p[0] * s, p[1] * s, 7).fill(swatch.yellow.fill);
    }
  }

  askForHint() {
    if (this.held && !this.finished) return void this.ctx.say('cut.place');
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'snip' || !countsStrays(this.level) || this.choosing) return void this.ctx.say(this.instructLine());
    if (!this.glow) { this.glow = true; this.hints++; this.beeShown = false; this.drawPaper(); }
  }

  /** The ghost finger: the next mark at level 1, otherwise the cut from where the scissors wait (circles counterclockwise). */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.held) {
      // Level 11: carry the piece to this piece's seeded spot in the picture.
      if (this.held.handle.dragging || !this.held.handle.enabled) return null;
      const pic = this.layout.picture, spot = this.spots[Math.min(this.index, this.spots.length - 1)];
      return { drag: { on: this.held.holder, x: 0, y: 0 }, to: { on: this.picture, x: spot.x * pic.w, y: spot.y * pic.h }, pause: 0.4 };
    }
    if (this.busy || this.drag) return null;
    if (this.choosing) return { tap: { on: this.paper, x: OWN_XS[0] * this.s, y: OWN_Y * this.s }, receiver: this.layer, pause: 0.4 };
    if (this.plan.mode === 'snip') {
      const m = this.marks.findIndex((_, i) => !this.snipped.has(i));
      if (m < 0) return null;
      const box = markBox(this.marks[m], this.s);
      return { tap: { on: this.paper, x: this.marks[m].x * this.s, y: (box.y + box.h * 0.6) * this.s }, receiver: this.layer, pause: 0.25 };
    }
    const t = this.fitTrack() ?? this.active;
    if (!t) return null;
    const route = botRoute(t.cut, pathOf(t.cut, t.order), t.progress).map((p) => ({ on: this.paper, ...this.toPaper(p) }));
    if (route.length < 2) return null;
    return { trace: route[0], via: route.slice(1), receiver: this.layer, pause: 0.3 };
  }

  destroy() {
    this.drag = null;
    this.layer.removeAllListeners();
    this.held?.handle.destroy();
    this.held = null;
  }
}

function icon(): Container {
  const c = new Container();
  const g = new Graphics().rect(-110, -200, 220, 150).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
  for (let x = -100; x < 100; x += 26) g.moveTo(x, -125).lineTo(x + 14, -125);
  g.stroke({ width: 7, color: ink, alpha: 0.7, cap: 'round' });
  const sc = new Scissors();
  sc.opening = 0.8; sc.scale.set(1.1); sc.position.set(-40, -125);
  c.addChild(g, sc);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const shape = stickerShape(seed), color = swatch[PAPERS[Math.floor(Math.abs(seed)) % PAPERS.length]];
  const pts = OUTLINES[shape].loop.flatMap(([x, y]) => [x * 95, y * 95]);
  c.addChild(tile(260, 260, 'white'), new Graphics().poly(pts).fill(color.fill).stroke({ width: 6, color: color.line, join: 'round' }));
  return c;
}

export const cutAlong: GameModule = {
  id: 'cut-along', name: 'Cut Along', titleLine: 'game.cut-along', region: 'treehouse', challenge: 'hands',
  skills: ['fine-motor', 'shapes', 'spatial-reasoning'], bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b), describeLevel: (l) => planFor(l).name,
  music: STYLES.paint,
  coplayHint: 'Name the place in the picture the next piece is for, and let {name} cut it out.',
  offScreen: 'With child-safe scissors and a grown-up beside her, snip a fringe along a paper strip, then cut along a fat straight line.',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new CutAlong(ctx),
  touchDemo: true,
};
