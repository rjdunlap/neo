import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS, SLOT, TILE, WAYS_PER_ROUND, choosesSign, hintWay, judge, layoutFor, makeRound, opWord, planFor, stickerNumber,
  type Op, type TreeLayout,
} from './logic';

const FRUIT: ColorName[] = ['red', 'orange', 'yellow', 'green', 'purple', 'pink'];

/** A plus or a minus drawn from bars, so it never depends on a font having the glyph. */
function signArt(op: Op, size: number, color: number): Graphics {
  const t = size * 0.18, r = size / 2;
  const g = new Graphics().roundRect(-r, -t / 2, size, t, t / 2).fill(color);
  if (op === 'plus') g.roundRect(-t / 2, -r, t, size, t / 2).fill(color);
  return g;
}

/** A numbered fruit, centered on (0, 0) and 100 units across. */
function fruit(value: number, color: ColorName): Container {
  const c = new Container(), sw = swatch[color];
  c.addChild(new Graphics().ellipse(0, 44, 36, 7).fill({ color: ink, alpha: 0.12 })
    .circle(0, 4, 48).fill(sw.fill).stroke({ width: 5, color: sw.line })
    .moveTo(0, -42).quadraticCurveTo(4, -56, 12, -62).stroke({ width: 6, color: wood.line, cap: 'round' })
    .ellipse(20, -52, 17, 8).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line }));
  const n = label(`${value}`, value >= 10 ? 50 : 60, ink);
  n.position.set(0, 6);
  c.addChild(n);
  return c;
}

class FruitSums implements Game {
  readonly plan;
  readonly signs: boolean;
  readonly target: number;
  readonly tray: number[];
  readonly tiles: Container[] = [];
  readonly leaves = new Map<Op, Container>();
  readonly check = new Container();
  slotA: number | null = null;
  slotB: number | null = null;
  op: Op | null;
  /** Keys of the ways she has made, in order. */
  found: string[] = [];
  hintTile: number | null = null;
  busy = false;
  finished = false;
  misses = 0;
  hints = 0;
  private sumMisses = 0;
  private layout: TreeLayout;
  private clock = 0;
  private readonly backdrop: Backdrop;
  private readonly ropes = new Graphics();
  private readonly sign = new Container();
  private readonly signNumber;
  private readonly foundText = label('', 40, swatch.brown.line);
  private readonly slots = new Container();
  private readonly equals = new Graphics();
  private readonly fixedPlus: Graphics;
  private readonly opFace = new Container();
  private readonly checkMark = new Graphics();
  private readonly checkMade = label('', 64, swatch.red.line);
  private readonly pick = new Graphics();
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.signs = choosesSign(ctx.level);
    const round = makeRound(ctx.level, ctx.rng);
    this.target = round.target;
    this.tray = round.tray;
    this.op = this.signs ? null : 'plus';
    this.layout = layoutFor(ctx.view.w, ctx.view.h, this.tray.length, this.signs);
    this.backdrop = new Backdrop({ sky: [swatch.green.light, cream], hills: [grass, swatch.green.light], horizon: 0.3, clouds: 2, sun: true, seed: 57 }, ctx.view);
    this.glow.eventMode = this.pick.eventMode = this.foundText.eventMode = this.slots.eventMode = this.ropes.eventMode = this.equals.eventMode = 'none';

    this.signNumber = label(`${this.target}`, 84, ink);
    this.sign.addChild(tile(260, 120, 'yellow'), this.signNumber);
    this.sign.eventMode = 'none';

    for (const at of ['a', 'b'] as const) this.slots.addChild(this.slotArt(at));
    this.fixedPlus = signArt('plus', 56, swatch.brown.line);
    if (this.signs) this.slots.addChild(this.slotArt('op'));
    this.opFace.eventMode = 'none';

    this.checkMark.moveTo(-26, 4).lineTo(-8, 24).lineTo(28, -22).stroke({ width: 14, color: 0xffffff, cap: 'round', join: 'round' });
    this.check.addChild(tile(SLOT, SLOT, 'green'), this.checkMark, this.checkMade);
    this.checkMade.visible = false;
    this.check.hitArea = new Rectangle(-SLOT / 2, -SLOT / 2, SLOT, SLOT);
    onTap(this.check, () => this.tapCheck());

    this.tray.forEach((v, i) => {
      const c = fruit(v, FRUIT[i % FRUIT.length]);
      c.hitArea = new Rectangle(-TILE / 2, -TILE / 2, TILE, TILE);
      onTap(c, () => this.tapTile(i));
      this.tiles.push(c);
    });
    if (this.signs) {
      for (const op of this.plan.ops) {
        const leaf = new Container();
        leaf.addChild(tile(TILE, TILE, 'green'), signArt(op, 58, 0xffffff));
        leaf.hitArea = new Rectangle(-TILE / 2, -TILE / 2, TILE, TILE);
        onTap(leaf, () => this.tapLeaf(op));
        this.leaves.set(op, leaf);
      }
    }
    ctx.stage.addChild(this.backdrop, this.ropes, this.sign, this.foundText, this.slots, this.equals, this.fixedPlus, this.opFace,
      this.check, ...this.leaves.values(), this.pick, ...this.tiles, this.glow);
    this.fixedPlus.visible = !this.signs;
    this.fixedPlus.eventMode = 'none';
    this.resize(ctx.view);
  }

  private slotArt(at: 'a' | 'b' | 'op'): Graphics {
    const g = new Graphics().roundRect(-SLOT / 2, -SLOT / 2, SLOT, SLOT, 24).fill({ color: cream, alpha: 0.75 })
      .stroke({ width: 5, color: swatch.brown.line, alpha: 0.7 });
    g.label = at;
    return g;
  }

  start() {
    void this.ctx.instruct(this.signs ? 'fsums.start3' : 'fsums.start', { n: this.target });
  }

  destroy() { this.finished = true; }

  // ---- play ----

  private tapTile(i: number) {
    if (this.busy || this.finished) return;
    if (this.slotA === i) this.slotA = null;
    else if (this.slotB === i) this.slotB = null;
    else if (this.slotA === null) this.slotA = i;
    else this.slotB = i; // both full: the newest one is swapped for this fruit, which is free
    sfx.marimba(this.tray[i] % 8, 0.4);
    void this.ctx.say('fsums.num', { n: this.tray[i] });
    this.afterChange();
  }

  private tapLeaf(op: Op) {
    if (this.busy || this.finished) return;
    this.op = this.op === op ? null : op;
    sfx.bell(this.op === 'plus' ? 5 : 3, 0.3);
    if (this.op) void this.ctx.say(this.op === 'plus' ? 'fsums.plus' : 'fsums.minus');
    this.afterChange();
  }

  private afterChange() {
    this.checkMade.visible = false; this.checkMark.visible = true;
    this.place();
  }

  /** Move every piece to where the state says it is: fruit in their boxes or home, the chosen sign in its box and ringed. */
  private place(animate = true) {
    const l = this.layout;
    this.tiles.forEach((t, i) => {
      const to = i === this.slotA ? l.a : i === this.slotB ? l.b : l.tiles[i];
      if (animate) void this.ctx.tw.to(t.position, { x: to.x, y: to.y }, { duration: 0.22, ease: ease.outBack });
      else t.position.set(to.x, to.y);
    });
    this.opFace.removeChildren().forEach((c) => c.destroy());
    if (this.signs && this.op) {
      this.opFace.addChild(signArt(this.op, 56, swatch.brown.line));
      this.opFace.position.set(l.op.x, l.op.y);
    }
    this.pick.clear();
    const leaf = this.op && this.leaves.get(this.op);
    if (this.signs && leaf) this.pick.roundRect(leaf.x - TILE / 2 - 6, leaf.y - TILE / 2 - 6, TILE + 12, TILE + 12, 22).stroke({ width: 7, color: swatch.yellow.fill });
  }

  private tapCheck() {
    if (this.busy || this.finished) return;
    if (this.slotA === null || this.slotB === null || this.op === null) {
      sfx.pop(3);
      void this.ctx.say(this.signs ? 'fsums.fillsign' : 'fsums.fill');
      return;
    }
    const av = this.tray[this.slotA], bv = this.tray[this.slotB], op = this.op;
    const verdict = judge(av, op, bv, this.target, this.found);
    const words = { a: av, b: bv, op: opWord(op), n: this.target, m: verdict.made };
    if (verdict.kind === 'below') {
      sfx.pop(2);
      void this.ctx.say('fsums.below', words);
      return;
    }
    if (verdict.kind === 'same') {
      sfx.pop(4);
      void this.ctx.say('fsums.same');
      this.clearSlots();
      return;
    }
    if (verdict.kind === 'wrong') {
      this.misses++; this.sumMisses++;
      this.checkMark.visible = false; this.checkMade.text = `${verdict.made}`; this.checkMade.visible = true;
      sfx.boing();
      void this.hearWrong(words, this.lightHint());
      return;
    }
    void this.celebrate(words, verdict.key);
  }

  /** After two misses on a sum the first fruit of a way she has not found glows; that is one hint, counted when it appears. */
  private lightHint(): boolean {
    if (this.sumMisses < 2) return false;
    if (this.hintTile === null) {
      const way = hintWay(this.tray, this.plan.ops, this.target, this.found);
      if (!way) return false;
      this.hintTile = way.a; this.hints++;
    }
    return true;
  }

  private async hearWrong(words: { a: number; b: number; op: string; n: number; m: number }, hint: boolean) {
    await this.ctx.say('fsums.wrong', words);
    if (hint && !this.finished) await this.ctx.say('fsums.hint');
  }

  private async celebrate(words: { a: number; b: number; op: string; n: number }, key: string) {
    this.busy = true;
    this.found.push(key);
    this.foundText.text = this.found.map((k) => this.sentence(k)).join('     ');
    this.checkMark.visible = true; this.checkMade.visible = false;
    this.hintTile = null;
    sfx.sparkle();
    this.ctx.particles.burst(this.layout.check.x, this.layout.check.y, { kind: 'star', colors: [swatch.yellow.fill, swatch.green.fill, swatch.pink.fill], count: 18, speed: [120, 260], gravity: 300, life: [0.5, 0.9] });
    await this.ctx.say('fsums.right', words);
    if (this.found.length >= WAYS_PER_ROUND) {
      this.finished = true;
      await this.ctx.say('fsums.done', { n: this.target });
      await this.ctx.tw.wait(0.6);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.5);
    this.clearSlots();
    this.sumMisses = 0;
    await this.ctx.instruct('fsums.again', { n: this.target });
    this.busy = false;
  }

  /** "7 + 5 = 12" for a found way, rebuilt from its key. */
  private sentence(key: string): string {
    const [x, y] = key.slice(1).split(',').map(Number);
    return key[0] === '+' ? `${x} + ${y} = ${this.target}` : `${x} − ${y} = ${this.target}`;
  }

  private clearSlots() {
    this.slotA = this.slotB = null;
    if (this.signs) this.op = null;
    this.afterChange();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const l = this.layout = layoutFor(view.w, view.h, this.tray.length, this.signs);
    this.backdrop.resize(view);
    this.sign.position.set(l.sign.x, l.sign.y);
    this.foundText.position.set(l.found.x, l.found.y);
    this.ropes.clear()
      .moveTo(l.sign.x - 90, 0).lineTo(l.sign.x - 90, l.sign.y - 56).moveTo(l.sign.x + 90, 0).lineTo(l.sign.x + 90, l.sign.y - 56)
      .stroke({ width: 6, color: wood.line });
    const slotNodes = this.slots.children as Graphics[];
    for (const s of slotNodes) {
      const at = s.label === 'a' ? l.a : s.label === 'b' ? l.b : l.op;
      s.position.set(at.x, at.y);
    }
    this.fixedPlus.position.set(l.op.x, l.op.y);
    this.equals.clear().roundRect(l.equals.x - 22, l.equals.y - 16, 44, 9, 4).roundRect(l.equals.x - 22, l.equals.y + 7, 44, 9, 4).fill(swatch.brown.line);
    this.check.position.set(l.check.x, l.check.y);
    let k = 0;
    for (const leaf of this.leaves.values()) { leaf.position.set(l.leaves[k].x, l.leaves[k].y); k++; }
    this.place(false);
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.hintTile === null || this.finished) return;
    const t = this.tiles[this.hintTile];
    this.glow.circle(t.x, t.y + 4, 62 + 4 * Math.sin(this.clock * 5)).stroke({ width: 7, color: swatch.yellow.fill });
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const way = hintWay(this.tray, this.plan.ops, this.target, this.found);
    if (!way) return null;
    const want = [way.a, way.b], have = [this.slotA, this.slotB];
    for (let k = 0; k < 2; k++) {
      const h = have[k];
      if (h !== null && h !== want[k]) return { tap: { on: this.tiles[h] } };
    }
    if (have[0] === null) return { tap: { on: this.tiles[want[0]] }, pause: 0.35 };
    if (have[1] === null) return { tap: { on: this.tiles[want[1]] }, pause: 0.35 };
    if (this.signs && this.op !== way.op) {
      if (this.op !== null) return { tap: { on: this.leaves.get(this.op)! }, pause: 0.35 };
      return { tap: { on: this.leaves.get(way.op)! }, pause: 0.35 };
    }
    return { tap: { on: this.check } };
  }
}

function icon(): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-18, -110, 36, 110, 8).fill(wood.fill).stroke({ width: 4, color: wood.line })
    .circle(0, -190, 92).circle(-66, -148, 62).circle(66, -148, 62).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line })
    .circle(0, -190, 88).circle(-66, -148, 58).circle(66, -148, 58).fill(swatch.green.fill));
  [[-40, -195, 3], [34, -205, 5], [-82, -140, 7], [72, -138, 4]].forEach(([x, y, n], i) => {
    const f = fruit(n, FRUIT[i]); f.scale.set(0.62); f.position.set(x, y); c.addChild(f);
  });
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const pair = stickerNumber(seed);
  const f = fruit(pair, FRUIT[Math.abs(Math.floor(seed)) % FRUIT.length]);
  f.scale.set(1.5);
  c.addChild(tile(260, 260, 'green'), f);
  return c;
}

export const fruitSums: GameModule = {
  id: 'fruit-sums', name: 'Fruit Sums', titleLine: 'game.fruit-sums', region: 'counting-cove',
  skills: ['adding', 'taking-away', 'number-sense', 'operations'], bands: ['school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.stickers,
  coplayHint: 'Ask {name} for a different way to make the same number, then take turns: one of you picks the first fruit and the other finds its partner.',
  offScreen: 'Pick a number, then make it with two handfuls of pebbles or buttons in as many different ways as you can find.',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new FruitSums(ctx),
  touchDemo: true,
};
