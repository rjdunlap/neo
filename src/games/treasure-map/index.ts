import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { flower, puffs, starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { CELL, cellCenter, clueDirection, compare, COLUMN_COLORS, digSpot, directions, makeFinds, name, planFor, ROW_PICTURES, squareAt, type Find, type MapPlan, type Square } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 5 },
};

const PARCHMENT = 0xf3e2b8;

function rowPicture(i: number): Container {
  const c = new Container();
  const g = new Graphics();
  switch (ROW_PICTURES[i]) {
    case 'apple':
      c.addChild(prop('apple', 'red'));
      c.scale.set(0.6);
      return c;
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

function chestArt(): Graphics {
  return new Graphics().roundRect(-30, -10, 60, 34, 6).fill(wood.fill).stroke({ width: 4, color: wood.line }).roundRect(-30, -28, 60, 22, 10).fill(wood.light).stroke({ width: 4, color: wood.line }).rect(-6, -12, 12, 14).fill(swatch.yellow.fill).circle(0, -30, 6).fill(swatch.yellow.light);
}

class TreasureMap implements Game {
  readonly plan: MapPlan;
  readonly finds: Find[];
  readonly grid = new Container();
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  pirate: Critter | null = null;

  private readonly paper = new Graphics();
  private readonly headers = new Container();
  private readonly marks = new Container();
  private readonly landmarks = new Container();
  private readonly sign = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting = false;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.finds = makeFinds(this.plan, ctx.rng);
    this.glow.eventMode = 'none';
    this.marks.eventMode = 'none';
    this.sign.eventMode = 'none';
    this.landmarks.eventMode = 'none';
    this.grid.addChild(this.paper, this.headers, this.marks, this.landmarks, this.glow);
    this.grid.eventMode = 'static';
    onTap(this.grid, (e) => void this.tapGrid(e), { cooldown: 250 });
    if (this.plan.mode === 'steps') {
      this.pirate = new Critter(ctx.petSpec);
      this.pirate.scale.set(0.3);
      this.pirate.eventMode = 'none';
      ctx.track(this.pirate);
      this.grid.addChild(this.pirate);
    }
    ctx.stage.addChild(new Graphics().rect(0, 0, 4000, 4000).fill(0x9fd3e8), this.grid, this.sign);
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
    this.grid.hitArea = new Rectangle(0, 0, w, w);
    const g = this.paper.clear();
    g.roundRect(-90, -80, w + 110, w + 100, 26).fill(PARCHMENT).stroke({ width: 6, color: wood.line });
    for (let i = 0; i <= n; i++) g.moveTo(i * CELL, 0).lineTo(i * CELL, w).moveTo(0, i * CELL).lineTo(w, i * CELL).stroke({ width: 3, color: wood.line, alpha: 0.5 });
    this.headers.removeChildren().forEach((c) => c.destroy({ children: true }));
    const pictures = this.plan.mode === 'pictures';
    for (let i = 0; i < n; i++) {
      // Column headers above, row headers to the left (row 1 at the bottom).
      const col = pictures ? new Graphics().circle(0, 0, 22).fill(swatch[COLUMN_COLORS[i]].fill).stroke({ width: 3, color: swatch[COLUMN_COLORS[i]].line }) : label(String.fromCharCode(65 + i), 36, ink);
      col.position.set(i * CELL + CELL / 2, -40);
      const row = pictures ? rowPicture(i) : label(String(i + 1), 36, ink);
      row.position.set(-45, (n - 1 - i) * CELL + CELL / 2);
      this.headers.addChild(col, row);
    }
    this.sign.position.set(v.w / 2 + 40, this.plan.mode === 'clues' ? 75 : 50);
    if (this.pirate && this.find?.from) {
      const p = this.cellAt(this.find.from);
      this.pirate.position.set(p.x, p.y + 36);
    }
  }

  update(dt: number) {
    this.clock += dt;
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
    // The target's column and row light up.
    g.rect(s.col * CELL, 0, CELL, n * CELL).fill({ color: swatch.yellow.fill, alpha: pulse * 0.6 });
    g.rect(0, (n - 1 - s.row) * CELL, n * CELL, CELL).fill({ color: swatch.yellow.fill, alpha: pulse * 0.6 });
  }

  /** The ghost finger digs in the middle of the square asked for, once the last dig has finished. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.find) return null;
    const at = digSpot(this.find, this.plan.size);
    return { tap: { on: this.grid, x: at.x, y: at.y } };
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = false;
    if (this.index >= this.finds.length) return void this.finale();
    const f = this.find;
    this.resize(this.view);
    this.drawLandmarks(f);
    this.drawSign(f);
    this.busy = false;
    const mode = this.plan.mode;
    if (mode === 'pictures') return this.ctx.instruct('map.pictures', { pic: ROW_PICTURES[f.square.row], color: COLUMN_COLORS[f.square.col] });
    if (mode === 'letters') return this.ctx.instruct('map.letters', { sq: name(f.square), col: String.fromCharCode(65 + f.square.col), row: f.square.row + 1 });
    if (mode === 'place') return this.ctx.instruct('map.place', { thing: f.thing!, sq: name(f.square) });
    if (mode === 'clues') return this.ctx.instruct('map.clues', { first: clueDirection(f.clues![0]), firstThing: f.clues![0].thing, second: clueDirection(f.clues![1]), secondThing: f.clues![1].thing });
    return this.ctx.instruct('map.steps', { dirs: directions(f) });
  }

  private drawLandmarks(f: Find) {
    this.landmarks.removeChildren().forEach((c) => c.destroy({ children: true }));
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
      const pic = rowPicture(f.square.row);
      pic.x = -40;
      const dot = new Graphics().circle(40, 0, 24).fill(swatch[COLUMN_COLORS[f.square.col]].fill).stroke({ width: 3, color: swatch[COLUMN_COLORS[f.square.col]].line });
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

  private async tapGrid(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const p = this.grid.toLocal(e.global);
    const guess = squareAt(p.x, p.y, this.plan.size);
    if (!guess) return;
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
      void this.ctx.say('map.hint');
    }
    this.busy = false;
  }

  private async found() {
    this.busy = true;
    this.hinting = false;
    const f = this.find;
    const at = this.cellAt(f.square);
    if (this.pirate && f.from) {
      // The pet walks the directions, step by step: across, then up or down.
      const tw = this.ctx.tw;
      const mid = this.cellAt({ col: f.square.col, row: f.from.row });
      for (const [to, n] of [[mid, Math.abs(f.right!)], [at, Math.abs(f.up!)]] as const) {
        const from = { x: this.pirate.x, y: this.pirate.y };
        for (let k = 1; k <= n; k++) {
          this.pirate.hop(0.5);
          await tw.to(this.pirate, { x: from.x + ((to.x - from.x) * k) / n, y: from.y + ((to.y + 36 - from.y) * k) / n }, { duration: 0.28 });
          void this.ctx.say('count', { n: k });
        }
      }
    }
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

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('map.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
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
