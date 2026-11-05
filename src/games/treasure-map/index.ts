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
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { finish, spring, squash } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { cardDone, cardFor, cardReason, CELL, cellCenter, clueDirection, compare, digSpot, directions, dressingFor, EMPTY_CARD, firstDirection, firstLeg, headersFor, makeFinds, name, nextCount, nextWay, planFor, squareAt, walkCard, type Card, type Doodle, type Find, type Headers, type MapPlan, type RowPicture, type Square } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 6 },
};

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
    this.grid.addChild(this.paper, this.headerArt, this.marks, this.landmarks, this.glow);
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
    if (this.plan.mode === 'steps' || this.plan.mode === 'write') {
      this.pirate = ctx.companion();
      this.pirate.scale.set(0.3);
      this.pirate.eventMode = 'none';
      ctx.track(this.pirate);
      this.grid.addChild(this.pirate);
    }
    // Last, so the ring sits over the pet and the dig marks.
    this.grid.addChild(this.ring);
    ctx.stage.addChild(new Graphics().rect(0, 0, 4000, 4000).fill(0x9fd3e8), this.grid, this.sign, this.cardBox);
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
    this.grid.position.set(Math.max(240, (v.w - w) / 2 + 40), Math.max(this.plan.mode === 'clues' ? 220 : 150, (v.h - w) / 2 + 40));
    if (this.plan.mode === 'write') this.layoutCard(v, w);
    this.grid.hitArea = new Rectangle(0, 0, w, w);
    const g = this.paper.clear();
    g.roundRect(-90, -80, w + 110, w + 100, 26).fill(TINT_COLORS[this.dressing.tint]).stroke({ width: 6, color: wood.line });
    for (let i = 0; i <= n; i++) g.moveTo(i * CELL, 0).lineTo(i * CELL, w).moveTo(0, i * CELL).lineTo(w, i * CELL).stroke({ width: 3, color: wood.line, alpha: 0.5 });
    this.headerArt.removeChildren().forEach((c) => c.destroy({ children: true }));
    const doodle = doodleArt(this.dressing.doodle);
    doodle.position.set(-45, -40);
    this.headerArt.addChild(doodle);
    const pictures = this.plan.mode === 'pictures';
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

  update(dt: number) {
    this.clock += dt;
    const ring = this.ring.clear();
    if (this.couchOn && !this.busy && !this.finished) {
      const at = this.cellAt(this.cursor);
      ring.roundRect(at.x - CELL / 2 + 6, at.y - CELL / 2 + 6, CELL - 12, CELL - 12, 16).stroke({ width: 8, color: swatch.teal.line });
    }
    const g = this.glow.clear();
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
    if ((this.plan.mode === 'steps' || this.plan.mode === 'write') && this.find.from) {
      // The first leg lights up from the pet to the turning square, so she still counts the walk.
      for (const sq of firstLeg(this.find)) {
        const c = this.cellAt(sq);
        g.roundRect(c.x - CELL / 2 + 4, c.y - CELL / 2 + 4, CELL - 8, CELL - 8, 12).fill({ color: swatch.yellow.fill, alpha: pulse });
      }
      return;
    }
    // The target's column and row light up.
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
    const at = digSpot(this.find, this.plan.size);
    return { tap: { on: this.grid, x: at.x, y: at.y } };
  }

  /** Couch play: the stick or the arrows move the ring a square at a time; the bottom button digs where it is. */
  control(input: CouchControls) {
    this.couchOn = true;
    // The couch's trips stop at level 5; the card has no ring to set it.
    if (this.busy || this.finished || !this.find || this.plan.mode === 'write') return;
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
    // The card names one chest, so the last find's chest and tries are cleared.
    if (this.plan.mode === 'write') this.marks.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.resize(this.view);
    this.drawCard();
    this.drawLandmarks(f);
    this.drawSign(f);
    this.busy = false;
    const mode = this.plan.mode;
    if (mode === 'pictures') return this.ctx.instruct('map.pictures', { pic: this.headers.rows[f.square.row], color: this.headers.cols[f.square.col] });
    if (mode === 'letters') return this.ctx.instruct('map.letters', { sq: name(f.square), col: String.fromCharCode(65 + f.square.col), row: f.square.row + 1 });
    if (mode === 'place') return this.ctx.instruct('map.place', { thing: f.thing!, sq: name(f.square) });
    if (mode === 'write') return this.ctx.instruct('map.write');
    if (mode === 'clues') return this.ctx.instruct('map.clues', { first: clueDirection(f.clues![0]), firstThing: f.clues![0].thing, second: clueDirection(f.clues![1]), secondThing: f.clues![1].thing });
    return this.ctx.instruct('map.steps', { dirs: directions(f) });
  }

  private drawLandmarks(f: Find) {
    this.landmarks.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'write') {
      // The chest waits on its square; she writes the way there.
      const at = this.cellAt(f.square);
      const chest = chestArt();
      chest.position.set(at.x, at.y + 6);
      chest.scale.set(0.9);
      this.landmarks.addChild(chest);
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
    if (mode === 'pictures') {
      const pic = rowPicture(this.headers.rows[f.square.row]);
      pic.x = -40;
      const color = swatch[this.headers.cols[f.square.col]];
      const dot = new Graphics().circle(40, 0, 24).fill(color.fill).stroke({ width: 3, color: color.line });
      this.sign.addChild(pic, dot);
    } else if (mode === 'steps') {
      this.sign.addChild(label(directions(f).replace(', then ', '  ·  '), 28, ink));
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

  private tapGrid(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.plan.mode === 'write') return;
    const p = this.grid.toLocal(e.global);
    const guess = squareAt(p.x, p.y, this.plan.size);
    if (guess) return this.dig(guess);
  }

  /** A dig at a square, from a finger or the couch's ring. */
  private async dig(guess: Square) {
    if (this.busy || this.finished) return;
    const { col, row } = guess;
    const want = this.find.square;
    const result = compare(guess, want);
    if (result === 'right') return void this.found();
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
      else void this.ctx.say(mode === 'clues' ? 'map.cluehint' : 'map.hint');
    }
    this.busy = false;
  }

  private async found() {
    this.busy = true;
    this.hinting = false;
    const f = this.find;
    const at = this.cellAt(f.square);
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
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Trace the row and column with two fingers until they meet: "Across here, up there... dig!"',
  offScreen: 'Hide a toy in a muffin tin or egg carton and give clues: "third row, second cup".',
  hubIcon: () => new MapIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new TreasureMap(ctx),
};
