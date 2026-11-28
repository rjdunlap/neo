import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BUTTON, SIGN, campLayout } from './layout';
import {
  CAMP,
  LEVELS,
  N,
  TENTS,
  checkCounts,
  countIn,
  describeLevel,
  hintFor,
  judge,
  packWhy,
  touchingPairs,
  treeSides,
  type Hint,
  type Verdict,
} from './logic';

type Line =
  | 'campsite.left-1'
  | 'campsite.left-2'
  | 'campsite.left-3'
  | 'campsite.touch'
  | 'campsite.row'
  | 'campsite.col'
  | 'campsite.lonely'
  | 'campsite.share';

function tentShape(size: number, pennant: boolean): Container {
  const c = new Container();
  const s = size / 100;
  const g = new Graphics();
  g.poly([-40 * s, 30 * s, 0, -36 * s, 40 * s, 30 * s])
    .fill(swatch.orange.fill)
    .stroke({ width: 4, color: swatch.orange.line });
  g.poly([-12 * s, 30 * s, 0, 4 * s, 12 * s, 30 * s]).fill(ink);
  g.moveTo(0, -36 * s)
    .lineTo(0, 30 * s)
    .stroke({ width: 2, color: swatch.orange.line, alpha: 0.6 });
  c.addChild(g);
  if (pennant) {
    const f = new Graphics()
      .moveTo(0, -36 * s)
      .lineTo(0, -60 * s)
      .stroke({ width: 3, color: ink })
      .poly([0, -60 * s, 22 * s, -53 * s, 0, -46 * s])
      .fill(swatch.blue.fill);
    // A camper peeking out of the door.
    f.circle(0, 20 * s, 9 * s).fill(swatch.yellow.light);
    f.circle(-3 * s, 18 * s, 1.6 * s).fill(ink);
    f.circle(3 * s, 18 * s, 1.6 * s).fill(ink);
    c.addChild(f);
  }
  return c;
}

function treeShape(size: number): Graphics {
  const s = size / 100;
  return new Graphics()
    .rect(-7 * s, 8 * s, 14 * s, 30 * s)
    .fill(swatch.brown.fill)
    .stroke({ width: 3, color: swatch.brown.line })
    .circle(0, -8 * s, 30 * s)
    .fill(swatch.green.fill)
    .stroke({ width: 4, color: swatch.green.line })
    .circle(-11 * s, -14 * s, 9 * s)
    .fill({ color: swatch.green.light, alpha: 0.6 });
}

/** A count sign: the number wanted, then pips filled as tents go up (red past the number); a zero gets a crossed ring. */
function drawSign(g: Graphics, x: number, y: number, want: number, have: number, glow: boolean) {
  g.roundRect(x - SIGN.w / 2 + 6, y - SIGN.h / 2 + 6, SIGN.w - 12, SIGN.h - 12, 12)
    .fill(glow ? swatch.yellow.light : wood.light)
    .stroke({ width: glow ? 7 : 4, color: glow ? swatch.yellow.line : wood.line });
  const pips = Math.max(want, have);
  if (pips === 0) {
    g.circle(x, y + 16, 8).stroke({ width: 3, color: ink });
    g.moveTo(x - 6, y + 22)
      .lineTo(x + 6, y + 10)
      .stroke({ width: 3, color: ink });
    return;
  }
  for (let i = 0; i < pips; i++) {
    const px = x + (i - (pips - 1) / 2) * 18;
    const py = y + 16;
    if (i < Math.min(have, want)) g.circle(px, py, 7).fill(swatch.green.line);
    else if (i < want) g.circle(px, py, 7).stroke({ width: 3, color: swatch.green.line });
    else g.circle(px, py, 7).fill(swatch.red.fill);
  }
}

class Round implements Game {
  private readonly root = new Container();
  private readonly ground = new Graphics();
  private readonly over = new Graphics();
  private readonly signs = new Graphics();
  private readonly supply = new Container();
  private readonly treeLayer = new Container();
  private readonly tentLayer = new Container();
  private readonly signLabels = new Container();
  private readonly heading = label('Pitch one tent beside each tree', 28, ink);
  readonly cells: Container[] = [];
  readonly checkButton = new Container();
  readonly hintButton = new Container();
  private readonly tentNodes = new Map<number, Container>();
  tents: number[] = [];
  /** Every full wrong camp checked this round: checking one again is free. */
  readonly checked = new Set<string>();
  private glow: Hint | null = null;
  /** The last checked camp's outlined trees (pairing), cleared on any edit. */
  private flagged: number[] = [];
  /** A tapped tree whose sides are lit, and for how long. */
  private lit: { tree: number; time: number } | null = null;
  private finishIn = -1;
  private time = 0;
  cell = 120;
  /** The view from the last resize: the shell may move the round onto the upright area after it is built. */
  private view: View;
  private readonly tallyCount = newTally();
  get misses() {
    return this.tallyCount.misses;
  }
  get hints() {
    return this.tallyCount.hints;
  }
  finished = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    for (let s = 0; s < N * N; s++) {
      const node = new Container();
      onTap(node, () => this.tapSquare(s));
      this.cells.push(node);
      this.root.addChild(node);
    }
    for (const layer of [
      this.ground,
      this.over,
      this.signs,
      this.treeLayer,
      this.tentLayer,
      this.supply,
      this.signLabels,
    ])
      layer.eventMode = 'none';
    this.heading.eventMode = 'none';
    this.root.addChildAt(this.ground, 0);
    this.root.addChild(this.treeLayer, this.over, this.tentLayer, this.signs, this.signLabels, this.supply);
    for (const [node, text, action] of [
      [this.checkButton, 'Check camp', () => this.checkCamp()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
    ] as const) {
      node.addChild(tile(BUTTON.w, BUTTON.h, node === this.checkButton ? 'green' : 'purple'));
      node.hitArea = new Rectangle(-BUTTON.w / 2, -BUTTON.h / 2, BUTTON.w, BUTTON.h);
      node.addChild(label(text, 26, ink));
      onTap(node, () => {
        node.scale.set(0.94);
        void ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.15 });
        action();
      });
    }
    ctx.stage.addChild(this.root, this.heading, this.checkButton, this.hintButton);
    this.resize(ctx.view);
  }

  start() {
    // The opening shows where a tree's tent may go.
    this.lit = { tree: CAMP.trees[0], time: 3 };
    this.draw();
    void this.ctx.instruct('campsite.start');
  }

  private tapSquare(s: number) {
    if (this.finished || !this.ctx.alive) return;
    if (CAMP.trees.includes(s)) {
      this.lit = { tree: s, time: 2.5 };
      sfx.tick();
      this.draw();
      void this.ctx.say('campsite.tree');
      return;
    }
    const had = this.tents.includes(s);
    if (!had && this.tents.length >= TENTS) {
      sfx.tick();
      void this.ctx.say('campsite.full');
      return;
    }
    this.glow = null;
    this.flagged = [];
    if (had) {
      this.tents = this.tents.filter((t) => t !== s);
      this.tentNodes.get(s)?.destroy({ children: true });
      this.tentNodes.delete(s);
      sfx.tick();
    } else {
      this.tents.push(s);
      this.addTent(s, true);
      sfx.pop(this.tents.length);
    }
    this.draw();
  }

  private addTent(s: number, pop: boolean) {
    const node = tentShape(this.cell * 0.9, this.finished);
    node.position.copyFrom(this.center(s));
    this.tentLayer.addChild(node);
    this.tentNodes.set(s, node);
    if (pop) {
      node.scale.set(0.4);
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    }
  }

  /** Check camp: free while short or already checked; a new full wrong camp is one miss, and every second one brings the hint. */
  checkCamp() {
    if (this.finished || !this.ctx.alive) return;
    const v = judge(CAMP, this.tents);
    if (v.kind === 'solved') {
      this.finish();
      return;
    }
    const miss = checkCounts(this.checked, CAMP, this.tents);
    this.flagged = v.kind === 'pairing' ? v.trees : [];
    this.draw();
    if (v.kind === 'short') {
      sfx.tick();
      void this.ctx.say(`campsite.left-${v.left}` as Line);
      return;
    }
    sfx.boing();
    const said = this.ctx.say(this.lineFor(v));
    // The reason is heard first; the hint it brings follows, for the camp as it is by then.
    if (miss && missEvery(this.tallyCount))
      void said.then(() => {
        if (this.ctx.alive && !this.finished) this.showHint();
      });
  }

  private lineFor(v: Exclude<Verdict, { kind: 'solved' } | { kind: 'short' }>): Line {
    if (v.kind === 'touch') return 'campsite.touch';
    if (v.kind === 'count') return v.axis === 'row' ? 'campsite.row' : 'campsite.col';
    return v.trees.length === 1 ? 'campsite.lonely' : 'campsite.share';
  }

  private finish() {
    this.finished = true;
    this.glow = null;
    this.flagged = [];
    for (const [s, node] of this.tentNodes) {
      node.destroy({ children: true });
      this.tentNodes.delete(s);
    }
    for (const s of this.tents) this.addTent(s, false);
    sfx.tada();
    sfx.clap();
    this.ctx.particles.burst(this.view.w / 2, this.view.h / 2, {
      colors: [swatch.orange.fill, swatch.yellow.fill, swatch.green.fill, swatch.blue.fill],
      count: 40,
      kind: 'dot',
    });
    this.draw();
    void this.ctx.say('campsite.done');
    this.finishIn = 1.8;
  }

  /** The next help, glowing on the board and said aloud; counts one hint. */
  private showHint() {
    const h = hintFor(CAMP, this.tents);
    if (!h) return;
    hinted(this.tallyCount);
    this.glow = h;
    this.draw();
    if (h.kind === 'pack') void this.ctx.say(`campsite.pack-${packWhy(CAMP, h.cell)}`);
    else void this.ctx.say(`campsite.hint-${h.step}`);
  }

  askForHint() {
    if (!this.finished) this.showHint();
  }

  private center(s: number) {
    const { first } = campLayout(this.view);
    return { x: first.x + (s % N) * this.cell, y: first.y + Math.floor(s / N) * this.cell };
  }

  private draw() {
    const c = this.cell;
    const lay = campLayout(this.view);
    const o = this.over.clear();
    if (this.lit)
      for (const s of treeSides(CAMP, this.lit.tree)) {
        const p = this.center(s);
        o.roundRect(p.x - c / 2 + 6, p.y - c / 2 + 6, c - 12, c - 12, 14).fill({
          color: swatch.yellow.light,
          alpha: 0.8,
        });
      }
    for (const [a, b] of touchingPairs(this.tents))
      for (const s of [a, b]) {
        const p = this.center(s);
        o.circle(p.x, p.y, c * 0.46).stroke({ width: 6, color: swatch.red.line });
      }
    const ringTree = (s: number, color: number) => {
      const p = this.center(s);
      o.circle(p.x, p.y, c * 0.47).stroke({ width: 7, color });
    };
    for (const t of this.flagged) ringTree(t, swatch.red.line);
    if (this.glow) {
      const p = this.center(this.glow.cell);
      o.roundRect(p.x - c / 2 + 3, p.y - c / 2 + 3, c - 6, c - 6, 14).stroke({
        width: 8,
        color: this.glow.kind === 'pack' ? swatch.red.fill : swatch.yellow.line,
      });
      if (this.glow.kind === 'pitch' && this.glow.also.tree !== undefined)
        ringTree(this.glow.also.tree, swatch.yellow.line);
    }
    const glowRow = this.glow?.kind === 'pitch' ? this.glow.also.row : undefined;
    const g = this.signs.clear();
    for (let r = 0; r < N; r++)
      drawSign(
        g,
        lay.rowSignX,
        lay.first.y + r * c,
        CAMP.rows[r],
        countIn(this.tents, 'row', r),
        glowRow === r,
      );
    for (let col = 0; col < N; col++)
      drawSign(
        g,
        lay.first.x + col * c,
        lay.colSignY,
        CAMP.cols[col],
        countIn(this.tents, 'col', col),
        false,
      );
    // The supply: unused tents filled, pitched ones as outlines.
    this.supply.removeChildren().forEach((k) => k.destroy({ children: true }));
    for (let i = 0; i < TENTS; i++) {
      const t = tentShape(64, false);
      t.position.set(lay.supply.x + (i - 1) * 90, lay.supply.y + 6);
      t.alpha = i < TENTS - this.tents.length ? 1 : 0.25;
      this.supply.addChild(t);
    }
  }

  private drawGround() {
    const c = this.cell;
    const lay = campLayout(this.view);
    const g = this.ground.clear();
    for (let s = 0; s < N * N; s++) {
      const p = this.center(s);
      g.rect(p.x - c / 2, p.y - c / 2, c, c)
        .fill((Math.floor(s / N) + s) % 2 ? swatch.green.light : 0xc9ecb6)
        .stroke({ width: 2, color: swatch.green.line, alpha: 0.5 });
    }
    g.rect(lay.first.x - c / 2, lay.first.y - c / 2, N * c, N * c).stroke({ width: 5, color: ink });
    this.treeLayer.removeChildren().forEach((k) => k.destroy());
    for (const t of CAMP.trees) {
      const tree = treeShape(c * 0.9);
      tree.position.copyFrom(this.center(t));
      this.treeLayer.addChild(tree);
    }
    this.signLabels.removeChildren().forEach((k) => k.destroy());
    const number = (n: number, x: number, y: number) => {
      const t = label(String(n), 30, ink);
      t.position.set(x, y - 12);
      this.signLabels.addChild(t);
    };
    for (let r = 0; r < N; r++) number(CAMP.rows[r], lay.rowSignX, lay.first.y + r * c);
    for (let col = 0; col < N; col++) number(CAMP.cols[col], lay.first.x + col * c, lay.colSignY);
  }

  update(dt: number) {
    this.time += dt;
    if (this.lit) {
      this.lit.time -= dt;
      if (this.lit.time <= 0) {
        this.lit = null;
        this.draw();
      }
    }
    if (this.finishIn >= 0) {
      this.finishIn -= dt;
      for (const [, node] of this.tentNodes) node.scale.y = 1 + Math.sin(this.time * 10) * 0.05;
      if (this.finishIn < 0 && this.ctx.alive) {
        this.finishIn = -1;
        this.ctx.finish({ misses: this.tallyCount.misses, hints: this.tallyCount.hints });
      }
      return;
    }
    // Touching tents wobble.
    const bad = new Set(touchingPairs(this.tents).flat());
    for (const [s, node] of this.tentNodes) node.rotation = bad.has(s) ? Math.sin(this.time * 18) * 0.1 : 0;
  }

  resize(view: View) {
    this.view = view;
    const lay = campLayout(view);
    this.cell = lay.cell;
    this.heading.position.set(lay.heading.x, lay.heading.y);
    this.checkButton.position.set(lay.check.x, lay.check.y);
    this.hintButton.position.set(lay.hint.x, lay.hint.y);
    this.cells.forEach((node, s) => {
      node.position.copyFrom(this.center(s));
      node.hitArea = new Rectangle(-this.cell / 2, -this.cell / 2, this.cell, this.cell);
    });
    this.drawGround();
    for (const [s, node] of this.tentNodes) {
      node.destroy({ children: true });
      this.tentNodes.delete(s);
    }
    for (const s of this.tents) this.addTent(s, false);
    this.draw();
  }

  /** The ghost finger: the three deductions (or a tent to pack up), then Check camp. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const h = hintFor(CAMP, this.tents);
    if (!h) return { tap: { on: this.checkButton }, pause: 0.8 };
    return { tap: { on: this.cells[h.cell] }, pause: 0.7 };
  }

  destroy() {
    this.root.destroy({ children: true });
    this.heading.destroy();
    this.checkButton.destroy({ children: true });
    this.hintButton.destroy({ children: true });
  }
}

function picture() {
  const c = new Container();
  c.addChild(
    new Graphics().roundRect(-45, -45, 90, 90, 16).fill(swatch.green.light).stroke({ width: 4, color: ink }),
  );
  const tree = treeShape(54);
  tree.position.set(-20, 0);
  const tent = tentShape(56, true);
  tent.position.set(20, 14);
  c.addChild(tree, tent);
  return c;
}

export const game: GameModule = {
  id: 'campsite',
  name: 'Campsite',
  titleLine: 'game.campsite',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: [
    'Reasoning from constraints: row and column counts and the no-touching rule rule squares out until each tree has one place left for its tent',
  ],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  upright: true,
  coplayHint: 'One of you reads out a count sign and the other pitches the tent it allows.',
  offScreen:
    'Draw a four-by-four grid with three trees, write the counts beside it, and use buttons for tents.',
  music: STYLES.quiet,
  touchDemo: true,
  hubIcon: () => new WigglyIcon(picture()),
  sticker: (_seed) => picture(),
  create: (ctx) => new Round(ctx),
};
