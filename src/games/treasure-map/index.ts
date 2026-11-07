import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { flower, puffs, shapePath, starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { CompanionRig } from '../../creatures/companion';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { finish, spring, squash } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { LEVELS, riverWords, acrossWords, HALF, mirrorPath, mirrorReason, riverReason, upDownWords, type Mirror, flagWalk, slideWords, bestDig, distance, dugAt, ruledOutBy, stepsWord, stillFits, type FarDig, cardDone, cardFor, cardReason, CELL, cellCenter, clueDirection, compare, digSpot, directions, dressingFor, EMPTY_CARD, firstDirection, firstLeg, headersFor, inLine, lineSquares, makeFinds, name, ONE_LINE, nextCount, nextWay, planFor, squareAt, walkCard, type Card, type Doodle, type Find, type Headers, type MapPlan, type RowPicture, type Square } from './logic';

/** Level 9's squares are bigger: 120 units on screen. */
const LINE_SCALE = 1.2;
/** Levels 10 and 11 put the sign above the map when the view has this much height to spare (portrait), else beside it. */
const RIVER_SIGN_ABOVE = 400;

const PARCHMENT = 0xf3e2b8;
/** The three parchment tints a round's map is drawn on. */
const TINT_COLORS = [PARCHMENT, 0xf0d6a4, 0xf6e9cc];

function rowPicture(kind: RowPicture): Container {
  const c = new Container();
  const g = new Graphics();
  switch (kind) {
    case 'apple':
      c.addChild(prop('apple', 'red'));
      c.scale.set(0.6);
      return c;
    case 'balloon':
      c.addChild(prop('balloon', 'orange'));
      c.scale.set(0.45);
      return c;
    case 'heart':
      shapePath(g, 'heart', 22).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      break;
    case 'fish':
      g.poly([14, 0, 28, -10, 28, 10]).fill(swatch.blue.fill).ellipse(0, 0, 20, 12).fill(swatch.blue.fill).circle(-8, -3, 3).fill(ink);
      break;
    case 'star':
      g.poly(starPoints(22, 9)).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
      break;
    case 'flower':
      flower(g, 20, swatch.pink.fill, swatch.pink.line);
      break;
    case 'shell':
      g.moveTo(0, 18).lineTo(-22, -4).quadraticCurveTo(0, -30, 22, -4).closePath().fill(swatch.pink.light).stroke({ width: 3, color: swatch.pink.line });
      break;
  }
  c.addChild(g);
  return c;
}

/** A faint drawing in the map's free top-left corner, centered on (0, 0). Decoration only. */
function doodleArt(kind: Doodle): Graphics {
  const g = new Graphics();
  const pen = { width: 3, color: wood.line, alpha: 0.55, cap: 'round' as const };
  if (kind === 'compass') {
    g.circle(0, 0, 24).stroke(pen).poly([0, -30, 6, 0, 0, 30, -6, 0]).fill({ color: wood.line, alpha: 0.45 }).poly([-30, 0, 0, -6, 30, 0, 0, 6]).stroke(pen);
  } else if (kind === 'sun') {
    g.circle(0, 0, 13).stroke(pen);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.moveTo(Math.cos(a) * 19, Math.sin(a) * 19).lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
    }
    g.stroke(pen);
  } else {
    g.moveTo(-26, 4).lineTo(26, 4).lineTo(16, 18).lineTo(-16, 18).closePath().stroke(pen);
    g.moveTo(0, 4).lineTo(0, -26).lineTo(18, 0).lineTo(0, 0).stroke(pen);
    g.moveTo(-30, 26).quadraticCurveTo(-22, 20, -14, 26).quadraticCurveTo(-6, 32, 2, 26).quadraticCurveTo(10, 20, 18, 26).stroke(pen);
  }
  return g;
}

function thingArt(thing: Find['thing']): Graphics {
  const g = new Graphics();
  if (thing === 'tree') {
    g.rect(-6, 0, 12, 26).fill(wood.fill);
    puffs(g, [[-14, -8, 16], [14, -8, 16], [0, -22, 18]], swatch.green.fill, swatch.green.line, 4);
  } else if (thing === 'house') {
    g.rect(-22, -8, 44, 34).fill(swatch.white.fill).stroke({ width: 3, color: wood.line }).poly([-28, -8, 0, -32, 28, -8]).fill(swatch.red.fill).rect(-6, 10, 12, 16).fill(wood.fill);
  } else if (thing === 'boat') {
    g.poly([-30, 6, 30, 6, 20, 22, -20, 22]).fill(wood.fill).stroke({ width: 3, color: wood.line }).moveTo(0, 6).lineTo(0, -30).stroke({ width: 3, color: wood.line }).poly([2, -28, 24, 2, 2, 2]).fill(0xffffff);
  } else {
    g.rect(-3, -30, 6, 56).fill(wood.line).poly([3, -30, 30, -20, 3, -10]).fill(swatch.red.fill);
  }
  return g;
}

/** A card tile's size: a little bigger than a square, and small enough to sit beside the map in landscape. */
const TILE = 110;
const GAP = 12;
type TileKind = 'across' | 'acrossWay' | 'upDown' | 'upDownWay' | 'go';

/** An arrow pointing right (`dx` 1), left (-1), up (`dy` -1 in screen units) or down, centered on (0, 0). */
function arrowArt(dx: number, dy: number): Graphics {
  const g = new Graphics();
  const a = Math.atan2(dy, dx);
  const pt = (x: number, y: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const shaft = [[-30, -8], [6, -8], [6, -22], [34, 0], [6, 22], [6, 8], [-30, 8]].flatMap(([x, y]) => pt(x, y));
  return g.poly(shaft).fill(ink);
}

/** One footprint, toes towards `angle`, on the left or right foot. */
function footprint(g: Graphics, x: number, y: number, angle: number, side: number) {
  const px = x + Math.cos(angle + Math.PI / 2) * 10 * side;
  const py = y + Math.sin(angle + Math.PI / 2) * 10 * side;
  g.ellipse(px, py, 9, 6).fill({ color: wood.line, alpha: 0.5 });
  g.circle(px + Math.cos(angle) * 11, py + Math.sin(angle) * 11, 3.5).fill({ color: wood.line, alpha: 0.5 });
}

/** An outline card on level 8: a mini map, its squares this many units wide. */
const OUTLINE = 150;
const MINI = 24;

/** A raft square: a wooden deck the size of a map square, centered on (0, 0). */
function plankArt(): Graphics {
  const g = new Graphics().roundRect(-CELL / 2 + 6, -CELL / 2 + 6, CELL - 12, CELL - 12, 14).fill(wood.light).stroke({ width: 5, color: wood.line });
  for (const y of [-16, 16]) g.moveTo(-CELL / 2 + 14, y).lineTo(CELL / 2 - 14, y).stroke({ width: 3, color: wood.line, alpha: 0.5 });
  return g;
}

/** Levels 10 and 11: the river and road cross on the map's own sign as little strips. */
function riverStrip(w: number): Graphics {
  const g = new Graphics().roundRect(-w / 2, -12, w, 24, 10).fill(swatch.blue.light);
  g.moveTo(-w / 2 + 6, 0);
  for (let x = -w / 2 + 6; x < w / 2 - 6; x += 16) g.quadraticCurveTo(x + 4, -6, x + 8, 0).quadraticCurveTo(x + 12, 6, x + 16, 0);
  return g.stroke({ width: 3, color: swatch.blue.line, alpha: 0.8 });
}

function roadStrip(h: number): Graphics {
  const g = new Graphics().rect(-12, -h / 2, 24, h).fill(SAND);
  for (let y = -h / 2 + 6; y < h / 2 - 10; y += 22) g.moveTo(0, y).lineTo(0, y + 10);
  return g.stroke({ width: 3, color: wood.line, alpha: 0.5 });
}

const SAND = 0xe8c98a;

/** A small number tile as on level 6's card. */
function countTile(n: number): Container {
  const c = new Container();
  c.addChild(finish({ w: 56, h: 56, corner: 14 }, swatch.white, 0xfffaf0), label(String(n), 38, ink));
  return c;
}

/** The mirror mark: two arrows meeting at a line, across (the road) or up and down (the river). */
function mirrorMark(line: Mirror): Container {
  const c = new Container();
  const bar = new Graphics();
  if (line === 'road') bar.rect(-3, -26, 6, 52).fill(ink);
  else bar.rect(-26, -3, 52, 6).fill(ink);
  const a = arrowArt(line === 'road' ? 1 : 0, line === 'road' ? 0 : 1);
  const b = arrowArt(line === 'road' ? -1 : 0, line === 'road' ? 0 : -1);
  for (const [arrow, k] of [[a, -1], [b, 1]] as const) {
    arrow.scale.set(0.42);
    arrow.position.set(line === 'road' ? k * 22 : 0, line === 'road' ? 0 : k * 22);
    c.addChild(arrow);
  }
  c.addChild(bar);
  return c;
}

function chestArt(): Graphics {
  return new Graphics().roundRect(-30, -10, 60, 34, 6).fill(wood.fill).stroke({ width: 4, color: wood.line }).roundRect(-30, -28, 60, 22, 10).fill(wood.light).stroke({ width: 4, color: wood.line }).rect(-6, -12, 12, 14).fill(swatch.yellow.fill).circle(0, -30, 6).fill(swatch.yellow.light);
}

class TreasureMap implements Game {
  readonly plan: MapPlan;
  readonly finds: Find[];
  readonly headers: Headers;
  private readonly dressing: { tint: number; doodle: Doodle };
  readonly grid = new Container();
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  pirate: CompanionRig | null = null;

  private readonly paper = new Graphics();
  private readonly headerArt = new Container();
  private readonly marks = new Container();
  private readonly landmarks = new Container();
  private readonly sign = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting = false;
  private clock = 0;
  // Couch play: a ring over the square a press would dig, moved one square at a time.
  private cursor: Square = { col: 0, row: 0 };
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1.5;
  // Level 6: the card she writes, its tiles, and the footprints it leaves on the map.
  card: Card = { ...EMPTY_CARD };
  private readonly cardBox = new Container();
  private readonly tiles = new Map<TileKind, Container>();
  private readonly prints = new Graphics();
  private atEdge = false;
  /** The pet is walking a route, so a resize leaves it where it is. */
  private walking = false;
  /** Level 7: the digs so far and the distance each one said. */
  digs: FarDig[] = [];
  /** Level 7: squares already crossed out, so a second tap there repeats the reason and is not a second miss. */
  private ruledOut: Square[] = [];
  /** Level 8: first the flag's landing square, then which outline card is the whole raft slid. */
  part: 'flag' | 'cards' = 'flag';
  private readonly outlineBox = new Container();
  readonly outlineCards: Container[] = [];
  /** Level 8: outline cards already tried, so a second tap repeats the reason and is not a second miss. */
  private readonly tried = new Set<number>();
  private raftArt: Container | null = null;
  /** Level 8: a pulsing ring around the right outline card once the hint is on in the cards part. */
  private readonly cardGlow = new Graphics();
  /** Level 11: the line a thing mirrors across shimmers. */
  private readonly shimmer = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.finds = makeFinds(this.plan, ctx.rng);
    // Drawn after the finds, so the squares (and the couch's boards) stay the same as before.
    this.headers = headersFor(this.plan, ctx.rng);
    this.dressing = dressingFor(ctx.rng);
    this.glow.eventMode = 'none';
    this.marks.eventMode = 'none';
    this.sign.eventMode = 'none';
    this.landmarks.eventMode = 'none';
    this.ring.eventMode = 'none';
    this.headerArt.eventMode = 'none';
    this.shimmer.eventMode = 'none';
    this.grid.addChild(this.paper, this.headerArt, this.shimmer, this.marks, this.landmarks, this.glow);
    this.grid.eventMode = 'static';
    onTap(this.grid, (e) => void this.tapGrid(e), { cooldown: 250 });
    this.prints.eventMode = 'none';
    if (this.plan.mode === 'write') {
      this.grid.addChild(this.prints);
      for (const kind of ['across', 'acrossWay', 'upDown', 'upDownWay', 'go'] as const) {
        const tile = new Container();
        onTap(tile, () => this.pressTile(kind), { cooldown: 200 });
        this.tiles.set(kind, tile);
        this.cardBox.addChild(tile);
      }
    }
    if (this.plan.mode === 'slide') {
      for (let i = 0; i < 3; i++) {
        const card = new Container();
        card.hitArea = new Rectangle(-OUTLINE / 2, -OUTLINE / 2, OUTLINE, OUTLINE);
        onTap(card, () => void this.pickOutline(i), { cooldown: 250 });
        this.outlineCards.push(card);
        this.outlineBox.addChild(card);
      }
      this.cardGlow.eventMode = 'none';
      this.outlineBox.addChildAt(this.cardGlow, 0);
    }
    if (this.plan.mode === 'steps' || this.plan.mode === 'write') {
      this.pirate = ctx.companion();
      this.pirate.scale.set(0.3);
      this.pirate.eventMode = 'none';
      ctx.track(this.pirate);
      this.grid.addChild(this.pirate);
    }
    // Last, so the ring sits over the pet and the dig marks.
    this.grid.addChild(this.ring);
    ctx.stage.addChild(new Graphics().rect(0, 0, 4000, 4000).fill(0x9fd3e8), this.grid, this.sign, this.cardBox, this.outlineBox);
  }

  get find() {
    return this.finds[this.index];
  }

  start() {
    void this.next();
  }

  /** A square's middle, in grid coordinates (row 0 at the bottom, as on maps and graphs). */
  private cellAt(s: Square) {
    return cellCenter(s, this.plan.size);
  }

  resize(v: View) {
    this.view = v;
    const n = this.plan.size;
    const w = n * CELL;
    const k = this.plan.mode === 'line' ? LINE_SCALE : 1;
    this.grid.scale.set(k);
    this.grid.position.set(Math.max(240, (v.w - w * k) / 2 + 40 * k), Math.max(this.plan.mode === 'clues' ? 220 : 150, (v.h - w * k) / 2 + 40 * k));
    if (this.plan.mode === 'write') this.layoutCard(v, w);
    if (this.plan.mode === 'slide') this.layoutOutlines(w);
    this.grid.hitArea = new Rectangle(0, 0, w, w);
    if (this.crossed) return this.layoutRiver(v, w);
    const g = this.paper.clear();
    g.roundRect(-90, -80, w + 110, w + 100, 26).fill(TINT_COLORS[this.dressing.tint]).stroke({ width: 6, color: wood.line });
    for (let i = 0; i <= n; i++) g.moveTo(i * CELL, 0).lineTo(i * CELL, w).moveTo(0, i * CELL).lineTo(w, i * CELL).stroke({ width: 3, color: wood.line, alpha: 0.5 });
    this.headerArt.removeChildren().forEach((c) => c.destroy({ children: true }));
    const doodle = doodleArt(this.dressing.doodle);
    doodle.position.set(-45, -40);
    this.headerArt.addChild(doodle);
    const pictures = this.plan.mode === 'pictures' || this.plan.mode === 'line';
    const { cols, rows } = this.headers;
    for (let i = 0; i < n; i++) {
      // Column headers above, row headers to the left (row 1 at the bottom).
      const col = pictures ? new Graphics().circle(0, 0, 22).fill(swatch[cols[i]].fill).stroke({ width: 3, color: swatch[cols[i]].line }) : label(String.fromCharCode(65 + i), 36, ink);
      col.position.set(i * CELL + CELL / 2, -40);
      const row = pictures ? rowPicture(rows[i]) : label(String(i + 1), 36, ink);
      row.position.set(-45, (n - 1 - i) * CELL + CELL / 2);
      this.headerArt.addChild(col, row);
    }
    this.sign.position.set(v.w / 2 + 40, this.plan.mode === 'clues' ? 75 : 50);
    this.sign.visible = this.plan.mode !== 'write';
    if (this.pirate && this.find?.from && !this.walking) {
      const p = this.cellAt(this.find.from);
      this.pirate.position.set(p.x, p.y + 36);
    }
  }

  /** Levels 10 and 11: the river and the road name the squares. */
  private get crossed() {
    return this.plan.mode === 'river' || this.plan.mode === 'mirror';
  }

  /**
   * Levels 10 and 11: no headers, so the paper keeps a 20-unit margin. In landscape the map sits right and the two-row
   * sign stands to its left between the help button and the pet; where the view is tall enough, the sign sits above.
   */
  private layoutRiver(v: View, w: number) {
    const above = v.h - w >= RIVER_SIGN_ABOVE;
    if (above) {
      this.grid.position.set((v.w - w) / 2, Math.max(330, (v.h - w) / 2 + 60));
      this.sign.position.set(v.w / 2, this.grid.y - 145);
    } else {
      this.grid.position.set(v.w - w - 60, (v.h - w) / 2);
      this.sign.position.set(Math.max(240, this.grid.x - 130), v.h / 2);
    }
    this.sign.visible = true;
    const g = this.paper.clear();
    g.roundRect(-20, -20, w + 40, w + 40, 26).fill(TINT_COLORS[this.dressing.tint]).stroke({ width: 6, color: wood.line });
    for (let i = 0; i <= this.plan.size; i++) g.moveTo(i * CELL, 0).lineTo(i * CELL, w).moveTo(0, i * CELL).lineTo(w, i * CELL).stroke({ width: 3, color: wood.line, alpha: 0.5 });
    this.headerArt.removeChildren().forEach((c) => c.destroy({ children: true }));
    // Both sit on grid lines, drawn over them: a tap there still digs the square under the finger.
    const mid = HALF * CELL;
    const road = roadStrip(w);
    road.position.set(mid, w / 2);
    const river = riverStrip(w);
    river.position.set(w / 2, mid);
    const bridge = new Graphics().roundRect(mid - 22, mid - 18, 44, 36, 6).fill(wood.light).stroke({ width: 4, color: wood.line });
    for (const x of [-10, 0, 10]) bridge.moveTo(mid + x, mid - 14).lineTo(mid + x, mid + 14);
    bridge.stroke({ width: 2, color: wood.line, alpha: 0.6 });
    this.headerArt.addChild(road, river, bridge);
  }

  update(dt: number) {
    this.clock += dt;
    const sh = this.shimmer.clear();
    if (this.plan.mode === 'mirror' && this.find?.across && !this.finished) {
      const w = this.plan.size * CELL;
      const a = 0.45 + 0.25 * Math.sin(this.clock * 4);
      if (this.find.across === 'river') sh.roundRect(-6, HALF * CELL - 26, w + 12, 52, 20).fill({ color: swatch.yellow.light, alpha: a });
      else sh.roundRect(HALF * CELL - 26, -6, 52, w + 12, 20).fill({ color: swatch.yellow.light, alpha: a });
    }
    const ring = this.ring.clear();
    if (this.couchOn && !this.busy && !this.finished) {
      const at = this.cellAt(this.cursor);
      ring.roundRect(at.x - CELL / 2 + 6, at.y - CELL / 2 + 6, CELL - 12, CELL - 12, 16).stroke({ width: 8, color: swatch.teal.line });
    }
    const g = this.glow.clear();
    const cg = this.cardGlow.clear();
    if (!this.hinting || this.busy || !this.find) return;
    const pulse = 0.35 + 0.25 * Math.sin(this.clock * 5);
    const n = this.plan.size;
    const s = this.find.square;
    if (this.plan.mode === 'clues' && this.find.clues) {
      for (const clue of this.find.clues) {
        const from = this.cellAt(clue.landmark);
        const to = this.cellAt(this.find.square);
        g.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ width: 18, color: swatch.yellow.fill, alpha: pulse });
      }
      return;
    }
    if (this.plan.mode === 'far') {
      // The squares that still fit every dig, so she picks among them and the search stays hers.
      for (const sq of stillFits(this.digs, n)) {
        const c = this.cellAt(sq);
        g.roundRect(c.x - CELL / 2 + 4, c.y - CELL / 2 + 4, CELL - 8, CELL - 8, 12).fill({ color: swatch.yellow.fill, alpha: pulse });
      }
      return;
    }
    if (this.plan.mode === 'slide') {
      if (this.part === 'cards') {
        // The right card glows too, so the hint leads somewhere on the cards as well.
        const card = this.outlineCards[this.find.outlines!.findIndex((o) => o.kind === 'right')];
        cg.roundRect(card.x - OUTLINE / 2 - 10, card.y - OUTLINE / 2 - 10, OUTLINE + 20, OUTLINE + 20, 28).fill({ color: swatch.yellow.fill, alpha: pulse + 0.2 });
      }
      // The flag's walk, across then up or down: every square of the raft moves the same.
      for (const sq of flagWalk(this.find, n)) {
        const c = this.cellAt(sq);
        g.roundRect(c.x - CELL / 2 + 4, c.y - CELL / 2 + 4, CELL - 8, CELL - 8, 12).fill({ color: swatch.yellow.fill, alpha: pulse });
      }
      return;
    }
    if ((this.plan.mode === 'steps' || this.plan.mode === 'write') && this.find.from) {
      // The first leg lights up from the pet to the turning square, so she still counts the walk.
      for (const sq of firstLeg(this.find)) {
        const c = this.cellAt(sq);
        g.roundRect(c.x - CELL / 2 + 4, c.y - CELL / 2 + 4, CELL - 8, CELL - 8, 12).fill({ color: swatch.yellow.fill, alpha: pulse });
      }
      return;
    }
    if (this.plan.mode === 'mirror' && this.find.stands) {
      // From the thing to the line, then just as many across: she counts both halves.
      for (const sq of mirrorPath(this.find.stands, this.find.across!)) {
        const c = this.cellAt(sq);
        g.roundRect(c.x - CELL / 2 + 4, c.y - CELL / 2 + 4, CELL - 8, CELL - 8, 12).fill({ color: swatch.yellow.fill, alpha: pulse });
      }
      return;
    }
    if (this.plan.mode === 'line' && this.find.line) {
      // Only the line asked for lights up: any square on it is right.
      for (const sq of lineSquares(this.find.line, n)) {
        const c = this.cellAt(sq);
        g.roundRect(c.x - CELL / 2 + 4, c.y - CELL / 2 + 4, CELL - 8, CELL - 8, 12).fill({ color: swatch.yellow.fill, alpha: pulse });
      }
      return;
    }
    // The target's column and row light up (level 10 too: they cross where she digs).
    g.rect(s.col * CELL, 0, CELL, n * CELL).fill({ color: swatch.yellow.fill, alpha: pulse * 0.6 });
    g.rect(0, (n - 1 - s.row) * CELL, n * CELL, CELL).fill({ color: swatch.yellow.fill, alpha: pulse * 0.6 });
  }

  /** The ghost finger digs in the middle of the square asked for, once the last dig has finished. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.find) return null;
    if (this.plan.mode === 'write') {
      const want = cardFor(this.find);
      const c = this.card;
      const kind: TileKind = c.across !== want.across ? 'across' : c.acrossWay !== want.acrossWay ? 'acrossWay' : c.upDown !== want.upDown ? 'upDown' : c.upDownWay !== want.upDownWay ? 'upDownWay' : 'go';
      return { tap: { on: this.tiles.get(kind)!, x: 0, y: 0 } };
    }
    if (this.plan.mode === 'slide' && this.part === 'cards') {
      const i = this.find.outlines!.findIndex((o) => o.kind === 'right');
      return { tap: { on: this.outlineCards[i], x: 0, y: 0 } };
    }
    // Level 7's finger hunts honestly: a corner, then the square that best splits what still fits.
    const at = this.plan.mode === 'far' ? cellCenter(bestDig(this.digs, this.plan.size), this.plan.size) : digSpot(this.find, this.plan.size);
    return { tap: { on: this.grid, x: at.x, y: at.y } };
  }

  /** Couch play: the stick or the arrows move the ring a square at a time; the bottom button digs where it is. */
  control(input: CouchControls) {
    this.couchOn = true;
    // The couch's trips stop at level 5; the card and the outlines have no ring to pick them.
    if (this.busy || this.finished || !this.find || this.plan.mode === 'write' || this.plan.mode === 'slide' || this.crossed) return;
    const last = this.plan.size - 1;
    for (const p of input.players) {
      const c = this.cursor;
      if (p.direction === 0) c.col = Math.min(last, c.col + 1);
      else if (p.direction === 2) c.col = Math.max(0, c.col - 1);
      // Row 1 is at the bottom, so up on the stick is the next row up.
      else if (p.direction === 3) c.row = Math.min(last, c.row + 1);
      else if (p.direction === 1) c.row = Math.max(0, c.row - 1);
      if (p.action) return void this.dig({ ...c });
    }
  }

  /** The "watch me" demo: walk the ring along the column letters, then up or down the rows, to the square asked for, and dig. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || !this.find || this.botWait > 0) return out;
    const want = this.find.square;
    const c = this.cursor;
    if (want.col !== c.col) out.players[0].direction = want.col > c.col ? 0 : 2;
    else if (want.row !== c.row) out.players[0].direction = want.row > c.row ? 3 : 1;
    else {
      out.players[0].action = true;
      this.botWait = 1;
      return out;
    }
    this.botWait = 0.35;
    return out;
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = false;
    if (this.index >= this.finds.length) return void this.finale();
    const f = this.find;
    // Following directions starts where the pet stands, so the ring walks the same steps.
    if (f.from) this.cursor = { ...f.from };
    this.card = { ...EMPTY_CARD };
    this.atEdge = false;
    this.digs = [];
    this.ruledOut = [];
    this.part = 'flag';
    this.tried.clear();
    // The card names one chest, each hunt hides a new one and each raft is a new raft, so the last find's marks are cleared.
    if (this.plan.mode === 'write' || this.plan.mode === 'far' || this.plan.mode === 'slide' || this.plan.mode === 'line' || this.crossed) this.marks.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.resize(this.view);
    this.drawCard();
    this.drawLandmarks(f);
    this.drawSign(f);
    this.drawOutlines();
    this.busy = false;
    const mode = this.plan.mode;
    if (mode === 'river') {
      if (this.index === 0) await this.ctx.say('map.riverintro');
      return this.ctx.instruct('map.river', { across: acrossWords(f.square), updown: upDownWords(f.square) });
    }
    if (mode === 'mirror') return this.ctx.instruct('map.mirror', { thing: f.thing!, across: acrossWords(f.stands!), updown: upDownWords(f.stands!), line: f.across! });
    if (mode === 'line') return f.line!.axis === 'col' ? this.ctx.instruct('map.linecol', { color: this.headers.cols[f.line!.at] }) : this.ctx.instruct('map.linerow', { pic: this.headers.rows[f.line!.at] });
    if (mode === 'pictures') return this.ctx.instruct('map.pictures', { pic: this.headers.rows[f.square.row], color: this.headers.cols[f.square.col] });
    if (mode === 'letters') return this.ctx.instruct('map.letters', { sq: name(f.square), col: String.fromCharCode(65 + f.square.col), row: f.square.row + 1 });
    if (mode === 'place') return this.ctx.instruct('map.place', { thing: f.thing!, sq: name(f.square) });
    if (mode === 'write') return this.ctx.instruct('map.write');
    if (mode === 'far') return this.ctx.instruct('map.far');
    if (mode === 'slide') return this.ctx.instruct('map.slide', { dirs: slideWords(f.right!, f.up!) });
    if (mode === 'clues') return this.ctx.instruct('map.clues', { first: clueDirection(f.clues![0]), firstThing: f.clues![0].thing, second: clueDirection(f.clues![1]), secondThing: f.clues![1].thing });
    return this.ctx.instruct('map.steps', { dirs: directions(f) });
  }

  private drawLandmarks(f: Find) {
    this.landmarks.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.raftArt = null;
    if (this.plan.mode === 'slide') {
      // The raft, its squares drawn where they sit and the flag on its own square; it slides as one piece.
      const raft = new Container();
      for (const sq of f.raft!) {
        const plank = plankArt();
        plank.position.copyFrom(this.cellAt(sq));
        raft.addChild(plank);
      }
      const flag = thingArt('flag');
      flag.position.copyFrom(this.cellAt(f.from!));
      flag.scale.set(0.8);
      raft.addChild(flag);
      this.landmarks.addChild(raft);
      this.raftArt = raft;
    }
    if (this.plan.mode === 'write') {
      // The chest waits on its square; she writes the way there.
      const at = this.cellAt(f.square);
      const chest = chestArt();
      chest.position.set(at.x, at.y + 6);
      chest.scale.set(0.9);
      this.landmarks.addChild(chest);
    }
    if (this.plan.mode === 'mirror') {
      const at = this.cellAt(f.stands!);
      const art = thingArt(f.thing);
      art.position.set(at.x, at.y);
      art.scale.set(0.9);
      this.landmarks.addChild(art);
    }
    for (const clue of f.clues ?? []) {
      const at = this.cellAt(clue.landmark);
      const art = thingArt(clue.thing);
      art.position.set(at.x, at.y);
      art.scale.set(0.7);
      this.landmarks.addChild(art);
    }
  }

  /** The request in pictures and letters, so nothing depends on reading alone. */
  private drawSign(f: Find) {
    this.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    const bg = new Graphics().roundRect(-130, -42, 260, 84, 22).fill(0xffffff).stroke({ width: 5, color: wood.line });
    this.sign.addChild(bg);
    const mode = this.plan.mode;
    if (mode === 'river' || mode === 'mirror') return this.drawRiverSign(f, bg);
    if (mode === 'pictures') {
      const pic = rowPicture(this.headers.rows[f.square.row]);
      pic.x = -40;
      const color = swatch[this.headers.cols[f.square.col]];
      const dot = new Graphics().circle(40, 0, 24).fill(color.fill).stroke({ width: 3, color: color.line });
      this.sign.addChild(pic, dot);
    } else if (mode === 'line') {
      // Just the one header, with an arrow along its line: down the column, or across the row.
      const line = f.line!;
      const color = swatch[this.headers.cols[line.at]];
      const head = line.axis === 'col' ? new Graphics().circle(0, 0, 26).fill(color.fill).stroke({ width: 3, color: color.line }) : rowPicture(this.headers.rows[line.at]);
      head.x = -40;
      const arrow = line.axis === 'col' ? arrowArt(0, 1) : arrowArt(1, 0);
      arrow.x = 45;
      this.sign.addChild(head, arrow);
    } else if (mode === 'far') {
      // A hidden chest and a question mark: nothing on the sign points to a square.
      const chest = chestArt();
      chest.position.set(-45, 4);
      chest.scale.set(0.9);
      this.sign.addChild(chest, Object.assign(label('?', 56, ink), { x: 45 }));
    } else if (mode === 'steps') {
      this.sign.addChild(label(directions(f).replace(', then ', '  ·  '), 28, ink));
    } else if (mode === 'slide') {
      bg.clear().roundRect(-160, -42, 320, 84, 22).fill(0xffffff).stroke({ width: 5, color: wood.line });
      const flag = thingArt('flag');
      flag.position.set(-125, 4);
      flag.scale.set(0.8);
      const words = label(slideWords(f.right!, f.up!).replace(' and ', '  ·  '), 28, ink);
      words.x = 20;
      this.sign.addChild(flag, words);
    } else if (mode === 'clues') {
      bg.clear().roundRect(-165, -60, 330, 120, 22).fill(0xffffff).stroke({ width: 5, color: wood.line });
      f.clues!.forEach((clue, i) => {
        const y = i === 0 ? -30 : 30;
        const art = thingArt(clue.thing);
        art.position.set(-118, y);
        art.scale.set(0.58);
        const words = label(clueDirection(clue), 30, ink);
        words.position.set(-65, y);
        this.sign.addChild(art, words);
      });
    } else {
      const t = label(name(f.square), 44, ink);
      if (mode === 'place') {
        t.x = 40;
        const art = thingArt(f.thing);
        art.x = -50;
        this.sign.addChild(art);
      }
      this.sign.addChild(t);
    }
  }

  /** Levels 10 and 11's two-row sign: road and river with a count and an arrow, or the thing above its mirror line. */
  private drawRiverSign(f: Find, bg: Graphics) {
    bg.clear().roundRect(-90, -110, 180, 220, 22).fill(0xffffff).stroke({ width: 5, color: wood.line });
    if (this.plan.mode === 'river') {
      const w = riverWords(f.square);
      const road = roadStrip(70);
      road.position.set(-58, -52);
      const river = riverStrip(44);
      river.position.set(-58, 52);
      const n1 = countTile(w.across.n);
      n1.position.set(2, -52);
      const n2 = countTile(w.upDown.n);
      n2.position.set(2, 52);
      const a1 = arrowArt(w.across.side === 'right' ? 1 : -1, 0);
      a1.scale.set(0.6);
      a1.position.set(58, -52);
      const a2 = arrowArt(0, w.upDown.side === 'above' ? -1 : 1);
      a2.scale.set(0.6);
      a2.position.set(58, 52);
      this.sign.addChild(road, river, n1, n2, a1, a2);
      return;
    }
    const thing = thingArt(f.thing);
    thing.position.set(0, -50);
    thing.scale.set(0.9);
    const line = f.across === 'river' ? riverStrip(44) : roadStrip(60);
    line.position.set(-40, 55);
    const mark = mirrorMark(f.across!);
    mark.position.set(38, 55);
    this.sign.addChild(thing, line, mark);
  }

  private tapGrid(e: FederatedPointerEvent) {
    // Level 8's second part is on the cards: a tap on the map then is nothing.
    if (this.plan.mode === 'slide' && this.part !== 'flag' && !this.busy) sfx.tick();
    if (this.busy || this.finished || this.plan.mode === 'write' || (this.plan.mode === 'slide' && this.part !== 'flag')) return;
    const p = this.grid.toLocal(e.global);
    const guess = squareAt(p.x, p.y, this.plan.size);
    if (guess) return this.dig(guess);
  }

  /** A dig at a square, from a finger or the couch's ring. */
  private async dig(guess: Square) {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'far') return this.digFar(guess);
    if (this.plan.mode === 'line') return this.digLine(guess);
    if (this.crossed) return this.digCrossed(guess);
    const { col, row } = guess;
    const want = this.find.square;
    const result = compare(guess, want);
    if (result === 'right') return void (this.plan.mode === 'slide' ? this.flagLanded() : this.found());
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    // A little dig mark stays where she tried.
    const at = this.cellAt({ col, row });
    this.marks.addChild(new Graphics().moveTo(at.x - 14, at.y - 14).lineTo(at.x + 14, at.y + 14).moveTo(at.x + 14, at.y - 14).lineTo(at.x - 14, at.y + 14).stroke({ width: 6, color: wood.line, alpha: 0.6, cap: 'round' }));
    if (this.plan.mode === 'steps') await this.ctx.say('map.stepswrong', { dirs: directions(this.find) });
    else await this.ctx.say(result === 'column' ? 'map.col' : result === 'row' ? 'map.row' : 'map.neither');
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      const mode = this.plan.mode;
      if (mode === 'steps') void this.ctx.say('map.stepshint', { first: firstDirection(this.find) });
      else if (mode === 'slide') void this.ctx.say('map.slidehint', { dirs: slideWords(this.find.right!, this.find.up!) });
      else void this.ctx.say(mode === 'clues' ? 'map.cluehint' : 'map.hint');
    }
    this.busy = false;
  }

  /** Levels 10 and 11: a right dig opens the chest or draws the twin; a wrong one names the first part that was off. */
  private async digCrossed(guess: Square) {
    const f = this.find;
    const mirror = this.plan.mode === 'mirror';
    const reason = mirror ? mirrorReason(guess, f.stands!, f.across!) : riverReason(guess, f.square);
    if (!reason) return void (mirror ? this.mirrored() : this.found());
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const at = this.cellAt(guess);
    this.marks.addChild(new Graphics().moveTo(at.x - 14, at.y - 14).lineTo(at.x + 14, at.y + 14).moveTo(at.x + 14, at.y - 14).lineTo(at.x - 14, at.y + 14).stroke({ width: 6, color: wood.line, alpha: 0.6, cap: 'round' }));
    await this.ctx.say(reason.line, { ...reason.slots, thing: f.thing ?? '' });
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      if (mirror) void this.ctx.say('map.mirrorhint', { thing: f.thing!, line: f.across! });
      else void this.ctx.say('map.riverhint', { across: acrossWords(f.square), updown: upDownWords(f.square) });
    }
    this.busy = false;
  }

  /** Level 11's right tap: the twin appears turned over, upside down across the river and flipped across the road. */
  private async mirrored() {
    this.busy = true;
    this.hinting = false;
    const f = this.find;
    const at = this.cellAt(f.square);
    const twin = thingArt(f.thing);
    twin.position.set(at.x, at.y);
    twin.scale.set(0);
    this.marks.addChild(twin);
    const k = 0.9;
    await this.ctx.tw.to(twin.scale, { x: f.across === 'road' ? -k : k, y: f.across === 'river' ? -k : k }, { duration: 0.35, ease: ease.outBack });
    sfx.sparkle();
    const g = this.ctx.stage.toLocal(this.grid.toGlobal(at));
    this.ctx.particles.burst(g.x, g.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    await this.ctx.say('map.mirrored');
    await this.next();
  }

  /** Level 9's dig: any square in the line asked for is right; a dig elsewhere names the line it was in. */
  private async digLine(guess: Square) {
    const line = this.find.line!;
    if (inLine(guess, line)) return void this.found(guess);
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const at = this.cellAt(guess);
    this.marks.addChild(new Graphics().moveTo(at.x - 14, at.y - 14).lineTo(at.x + 14, at.y + 14).moveTo(at.x + 14, at.y - 14).lineTo(at.x - 14, at.y + 14).stroke({ width: 6, color: wood.line, alpha: 0.6, cap: 'round' }));
    const { cols, rows } = this.headers;
    if (line.axis === 'col') await this.ctx.say('map.linecolwrong', { got: cols[guess.col], want: cols[line.at] });
    else await this.ctx.say('map.linerowwrong', { got: rows[guess.row], want: rows[line.at] });
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      void this.ctx.say('map.linehint');
    }
    this.busy = false;
  }

  /**
   * Level 7's dig: the chest, or a distance. A dig that fits every distance so far is exploring and leaves a stack
   * of footprints, one per step; only a dig the distances already rule out is a miss, and it names the dig it disagrees with.
   */
  private async digFar(guess: Square) {
    const f = this.find;
    if (compare(guess, f.square) === 'right') return void this.found();
    this.busy = true;
    const again = dugAt(guess, this.digs);
    const against = again ? null : ruledOutBy(guess, this.digs);
    if (again) {
      sfx.tick();
      await this.ctx.say('map.faragain', { steps: stepsWord(again.said) });
    } else if (!against) {
      const said = distance(guess, f.square);
      this.digs.push({ square: guess, said });
      this.drawStack(guess, said);
      sfx.pop();
      await this.ctx.say('map.farsteps', { steps: stepsWord(said) });
    } else if (this.ruledOut.some((s) => s.col === guess.col && s.row === guess.row)) {
      sfx.tick();
      await this.ctx.say('map.farout', { got: stepsWord(distance(guess, against.square)), sq: name(against.square), said: stepsWord(against.said) });
    } else {
      this.ruledOut.push(guess);
      this.misses++;
      this.wrongs++;
      sfx.boing();
      const at = this.cellAt(guess);
      this.marks.addChild(new Graphics().moveTo(at.x - 14, at.y - 14).lineTo(at.x + 14, at.y + 14).moveTo(at.x + 14, at.y - 14).lineTo(at.x - 14, at.y + 14).stroke({ width: 6, color: wood.line, alpha: 0.6, cap: 'round' }));
      await this.ctx.say('map.farout', { got: stepsWord(distance(guess, against.square)), sq: name(against.square), said: stepsWord(against.said) });
      if (this.wrongs >= 2 && !this.hinting) {
        this.hinting = true;
        this.hints++;
        void this.ctx.say('map.farhint');
      }
    }
    this.busy = false;
  }

  /** A dug patch with a stack of footprints, one per step to the chest, and the number: a distance, never a direction. */
  private drawStack(s: Square, n: number) {
    const at = this.cellAt(s);
    const g = new Graphics().ellipse(at.x, at.y + 4, 42, 40).fill({ color: wood.fill, alpha: 0.22 });
    for (let i = 0; i < n; i++) {
      // Two columns, filled from the bottom, every print with its toes up.
      const x = at.x - 32 + (i % 2) * 20;
      const y = at.y + 30 - Math.floor(i / 2) * 25;
      g.ellipse(x, y, 6, 8).fill({ color: wood.line, alpha: 0.6 }).circle(x, y - 12, 3.5).fill({ color: wood.line, alpha: 0.6 });
    }
    const words = label(String(n), 46, ink);
    words.position.set(at.x + 22, at.y);
    const stack = new Container();
    stack.addChild(g, words);
    this.marks.addChild(stack);
  }

  /** A right dig; `dug` is the square she chose when more than one is right (level 9's line). */
  private async found(dug?: Square) {
    this.busy = true;
    this.hinting = false;
    const f = this.find;
    const at = this.cellAt(dug ?? f.square);
    if (f.line) {
      // The whole line shines, so every square of it reads as right.
      const shine = new Graphics();
      for (const sq of lineSquares(f.line, this.plan.size)) {
        const c = this.cellAt(sq);
        shine.roundRect(c.x - CELL / 2 + 4, c.y - CELL / 2 + 4, CELL - 8, CELL - 8, 12).fill({ color: swatch.yellow.fill, alpha: 0.7 });
      }
      this.marks.addChild(shine);
    }
    if (this.pirate && f.from && this.plan.mode === 'steps') {
      // The pet walks the directions, step by step: across, then up or down.
      const tw = this.ctx.tw;
      this.walking = true;
      const mid = this.cellAt({ col: f.square.col, row: f.from.row });
      for (const [to, n] of [[mid, Math.abs(f.right!)], [at, Math.abs(f.up!)]] as const) {
        const from = { x: this.pirate.x, y: this.pirate.y };
        for (let k = 1; k <= n; k++) {
          this.pirate.hop(0.5);
          await tw.to(this.pirate, { x: from.x + ((to.x - from.x) * k) / n, y: from.y + ((to.y + 36 - from.y) * k) / n }, { duration: 0.28 });
          void this.ctx.say('count', { n: k });
        }
      }
      this.walking = false;
    }
    if (this.plan.mode === 'write') this.landmarks.removeChildren().forEach((c) => c.destroy({ children: true }));
    const art = this.plan.mode === 'place' ? thingArt(f.thing) : chestArt();
    art.position.set(at.x, at.y);
    art.scale.set(0);
    this.marks.addChild(art);
    await this.ctx.tw.to(art.scale, { x: 1.4, y: 1.4 }, { duration: 0.3, ease: ease.outBack });
    sfx.sparkle();
    const g = this.ctx.stage.toLocal(this.grid.toGlobal(at));
    this.ctx.particles.burst(g.x, g.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    await this.ctx.say(this.plan.mode === 'place' ? 'map.placed' : 'map.found');
    await this.next();
  }

  /** Level 8: the flag's square is right. A flag waits there, and the question moves to the outline cards. */
  private async flagLanded() {
    this.busy = true;
    const f = this.find;
    sfx.pop();
    const ghost = thingArt('flag');
    ghost.position.copyFrom(this.cellAt(f.square));
    ghost.scale.set(0.8);
    ghost.alpha = 0.75;
    this.marks.addChild(ghost);
    this.part = 'cards';
    this.drawOutlines();
    this.busy = false;
    await this.ctx.instruct('map.slidecards');
  }

  /** Level 8's cards: the slid raft is right; a turned-over or wrongly slid one is a miss that says why, once. */
  private async pickOutline(i: number) {
    if (this.busy || this.finished || this.plan.mode !== 'slide' || this.part !== 'cards') return;
    const f = this.find;
    const o = f.outlines![i];
    const card = this.outlineCards[i];
    squash(card);
    spring(card, 90);
    if (o.kind === 'right') return void this.slideRaft();
    this.busy = true;
    const say = () => (o.kind === 'flipped' ? this.ctx.say('map.flipped') : this.ctx.say('map.slidefar', { got: slideWords(o.right, o.up), want: slideWords(f.right!, f.up!) }));
    if (this.tried.has(i)) {
      sfx.tick();
      await say();
      this.busy = false;
      return;
    }
    this.tried.add(i);
    this.misses++;
    this.wrongs++;
    sfx.boing();
    this.drawOutlines();
    await say();
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      void this.ctx.say('map.slidehint', { dirs: slideWords(f.right!, f.up!) });
    }
    this.busy = false;
  }

  /** The right card: the whole raft slides, every square the same, onto the outline. */
  private async slideRaft() {
    this.busy = true;
    this.hinting = false;
    const f = this.find;
    const raft = this.raftArt!;
    this.walking = true;
    sfx.whoosh();
    await this.ctx.tw.to(raft, { x: f.right! * CELL, y: -f.up! * CELL }, { duration: 0.9, ease: ease.inOutSine });
    this.walking = false;
    sfx.sparkle();
    const at = this.cellAt(f.square);
    const g = this.ctx.stage.toLocal(this.grid.toGlobal(at));
    this.ctx.particles.burst(g.x, g.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 16, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    await this.ctx.say('map.slid');
    await this.next();
  }

  /** Level 8's three outline cards beside the map, in a column as tall as the map. */
  private layoutOutlines(w: number) {
    const cardW = OUTLINE;
    this.grid.x = Math.max(240, (this.view.w - (w + 34 + cardW)) / 2);
    this.outlineBox.position.set(this.grid.x + w + 34 + cardW / 2, this.grid.y + w / 2);
    this.outlineCards.forEach((card, i) => card.position.set(0, (i - 1) * (OUTLINE + 12)));
  }

  /** Each card is a mini map: the raft where it starts, faint, and one outline drawn solid; a tried card is crossed out. */
  private drawOutlines() {
    if (this.plan.mode !== 'slide') return;
    this.outlineBox.visible = this.part === 'cards';
    const f = this.find;
    if (!f?.outlines) return;
    const n = this.plan.size;
    const half = (n * MINI) / 2;
    const at = (s: Square) => ({ x: -half + s.col * MINI + MINI / 2, y: -half + (n - 1 - s.row) * MINI + MINI / 2 });
    f.outlines.forEach((o, i) => {
      const card = this.outlineCards[i];
      card.removeChildren().forEach((c) => c.destroy({ children: true }));
      card.addChild(finish({ w: OUTLINE, h: OUTLINE, corner: 22 }, swatch.white, 0xfffaf0));
      const g = new Graphics();
      for (let k = 0; k <= n; k++) g.moveTo(-half + k * MINI, -half).lineTo(-half + k * MINI, half).moveTo(-half, -half + k * MINI).lineTo(half, -half + k * MINI);
      g.stroke({ width: 2, color: wood.line, alpha: 0.35 });
      for (const sq of f.raft!) {
        const c = at(sq);
        g.rect(c.x - MINI / 2 + 2, c.y - MINI / 2 + 2, MINI - 4, MINI - 4).fill({ color: wood.line, alpha: 0.18 });
      }
      for (const sq of o.cells) {
        const c = at(sq);
        g.roundRect(c.x - MINI / 2 + 1, c.y - MINI / 2 + 1, MINI - 2, MINI - 2, 4).fill(wood.light).stroke({ width: 3, color: wood.line });
      }
      // Where she put the flag, so every card is read from the same square.
      const flag = at(f.square);
      g.circle(flag.x, flag.y, 5).fill(swatch.red.fill);
      card.addChild(g);
      if (this.tried.has(i)) {
        card.alpha = 0.5;
        card.addChild(new Graphics().moveTo(-40, -40).lineTo(40, 40).moveTo(40, -40).lineTo(-40, 40).stroke({ width: 8, color: wood.line, alpha: 0.7, cap: 'round' }));
      } else card.alpha = 1;
    });
  }

  /** Level 6's card beside the map. */
  private layoutCard(v: View, w: number) {
    const cardW = TILE * 2 + GAP;
    // The view is always at least 1024 wide, so the card fits beside the map in either orientation. The map keeps
    // its 240 from the left (the corner buttons and the pet); the card sits just past the parchment.
    this.grid.x = Math.max(240, (v.w - (w + 34 + cardW)) / 2);
    this.cardBox.position.set(this.grid.x + w + 34 + cardW / 2, this.grid.y + w / 2);
    const x = (TILE + GAP) / 2;
    const y = [-TILE - GAP, 0, TILE + GAP];
    this.placeTile('across', -x, y[0]);
    this.placeTile('acrossWay', x, y[0]);
    this.placeTile('upDown', -x, y[1]);
    this.placeTile('upDownWay', x, y[1]);
    this.placeTile('go', 0, y[2]);
  }

  private placeTile(kind: TileKind, x: number, y: number) {
    this.tiles.get(kind)!.position.set(x, y);
  }

  /** Redraws the card's tiles from `card`, and the footprints it walks on the map. */
  private drawCard() {
    if (this.plan.mode !== 'write') return;
    const c = this.card;
    const ready = cardDone(c);
    for (const [kind, tile] of this.tiles) {
      tile.removeChildren().forEach((ch) => ch.destroy({ children: true }));
      const go = kind === 'go';
      const sw = go ? (ready ? swatch.green : swatch.white) : swatch.white;
      const w = go ? TILE * 2 : TILE;
      tile.addChild(finish({ w, h: TILE * (go ? 0.85 : 1), corner: 24 }, sw, go ? undefined : 0xfffaf0));
      tile.hitArea = new Rectangle(-w / 2, -TILE / 2, w, TILE);
      if (go) tile.addChild(label('Go', 44, ready ? 0xffffff : 0xb9ad94));
      else if (kind === 'across' || kind === 'upDown') {
        const n = kind === 'across' ? c.across : c.upDown;
        tile.addChild(label(n ? String(n) : '?', 56, n ? ink : 0xb9ad94));
      } else {
        const way = kind === 'acrossWay' ? c.acrossWay : c.upDownWay;
        if (!way) tile.addChild(label('?', 56, 0xb9ad94));
        else tile.addChild(kind === 'acrossWay' ? arrowArt(way, 0) : arrowArt(0, -way));
      }
    }
    // Footprints from the pet along the card so far: two to a square, left and right.
    const g = this.prints.clear();
    const f = this.find;
    if (!f?.from) return;
    let prev = this.cellAt(f.from);
    let side = 1;
    for (const sq of walkCard(f.from, c, this.plan.size).legs.flat()) {
      const to = this.cellAt(sq);
      const angle = Math.atan2(to.y - prev.y, to.x - prev.x);
      for (const t of [0.35, 0.75]) {
        footprint(g, prev.x + (to.x - prev.x) * t, prev.y + (to.y - prev.y) * t, angle, side);
        side = -side;
      }
      prev = to;
    }
  }

  /** A tap on a card tile: a count steps 1, 2, 3; an arrow turns; Go walks the card. Changing the card is free. */
  private pressTile(kind: TileKind) {
    if (this.busy || this.finished || this.plan.mode !== 'write') return;
    const tile = this.tiles.get(kind)!;
    squash(tile);
    spring(tile, 90);
    if (kind === 'go') return void this.go();
    sfx.tick();
    const c = this.card;
    if (kind === 'across') c.across = nextCount(c.across);
    else if (kind === 'upDown') c.upDown = nextCount(c.upDown);
    else if (kind === 'acrossWay') c.acrossWay = nextWay(c.acrossWay);
    else c.upDownWay = nextWay(c.upDownWay);
    this.drawCard();
    // Running off the map is said once as it happens, and is not a miss: only Go is a try.
    const edge = walkCard(this.find.from!, c, this.plan.size).edge;
    if (edge && !this.atEdge) void this.ctx.say('map.edge');
    this.atEdge = edge;
  }

  /** Go: the pet walks the card, counting; the chest if it ends there, otherwise a miss that names the line that was off. */
  private async go() {
    const f = this.find;
    if (!cardDone(this.card)) return void this.ctx.say('map.cardfill');
    this.busy = true;
    const card = { ...this.card };
    const walk = walkCard(f.from!, card, this.plan.size);
    const pet = this.pirate!;
    this.walking = true;
    for (const leg of walk.legs) {
      for (let k = 0; k < leg.length; k++) {
        const to = this.cellAt(leg[k]);
        pet.hop(0.5);
        await this.ctx.tw.to(pet, { x: to.x, y: to.y + 36 }, { duration: 0.28 });
        void this.ctx.say('count', { n: k + 1 });
      }
    }
    this.walking = false;
    const reason = cardReason(card, f);
    if (!reason) return void this.found();
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const at = this.cellAt(walk.end);
    this.marks.addChild(new Graphics().moveTo(at.x - 14, at.y - 14).lineTo(at.x + 14, at.y + 14).moveTo(at.x + 14, at.y - 14).lineTo(at.x - 14, at.y + 14).stroke({ width: 6, color: wood.line, alpha: 0.6, cap: 'round' }));
    await this.ctx.say(reason.line, reason.slots);
    // Back to the start; the card stays as she wrote it, to mend.
    const start = this.cellAt(f.from!);
    pet.hop(0.5);
    await this.ctx.tw.to(pet, { x: start.x, y: start.y + 36 }, { duration: 0.4 });
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
      void this.ctx.say('map.stepshint', { first: firstDirection(f) });
    }
    this.busy = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('map.done');
    await this.ctx.tw.wait(0.4);
    // On the couch, wrong digs are the face-off score (lower is better).
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.misses });
  }
}

class MapIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics().roundRect(-100, -200, 200, 180, 18).fill(PARCHMENT).stroke({ width: 5, color: wood.line });
    for (let i = 1; i < 4; i++) g.moveTo(-100 + i * 50, -200).lineTo(-100 + i * 50, -20).moveTo(-100, -200 + i * 45).lineTo(100, -200 + i * 45).stroke({ width: 3, color: wood.line, alpha: 0.4 });
    g.moveTo(10, -110).lineTo(40, -80).moveTo(40, -110).lineTo(10, -80).stroke({ width: 8, color: swatch.red.fill, cap: 'round' });
    c.addChild(g);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const chest = chestArt();
  chest.scale.set(2.4);
  c.addChild(chest);
  if (rng.chance(0.5)) c.addChild(new Graphics().poly(starPoints(20, 8).map((n, i) => n + (i % 2 ? -90 : 60))).fill(swatch.yellow.fill));
  return c;
}

export const treasureMap: GameModule = {
  id: 'treasure-map',
  name: 'Treasure Map',
  titleLine: 'game.treasure-map',
  region: 'rainbow-meadow',
  challenge: 'space',
  skills: ['coordinates', 'spatial-reasoning', 'directions', 'maps'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [ONE_LINE],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Trace the row and column with two fingers until they meet: "Across here, up there... dig!"',
  offScreen: 'Hide a toy in a muffin tin or egg carton and give clues: "third row, second cup".',
  hubIcon: () => new MapIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new TreasureMap(ctx),
};
