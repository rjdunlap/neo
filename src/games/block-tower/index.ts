import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { symbol, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { compare, finish, makeRounds, makeStand, middleFrom, nextReach, planFor, REACH, reached, stackMove, standingTower, topples, W, type ReachRound, type StandRound, type TowerPlan, type TowerRound } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 2, max: 3 },
  preschool: { min: 3, max: 4 },
  prek: { min: 4, max: 5 },
  school: { min: 5, max: 6 },
};

/** A block's size in logical units; positions in the logic are eighths of BW. */
const BW = 104;
const BH = 62;
/** The tallest tower the basket builds, so it always fits on screen. */
const MAX_BLOCKS = 9;
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const px = (eighths: number) => (eighths * BW) / W;

function blockArt(color: ColorName): Graphics {
  const sw = swatch[color];
  return new Graphics()
    .roundRect(-BW / 2, -BH, BW, BH, 10)
    .fill(sw.fill)
    .stroke(line(sw.line, 5))
    .circle(0, -BH / 2, 13)
    .fill(sw.light);
}

const colorFor = (i: number) => RAINBOW[i % RAINBOW.length];

/** A dashed line from (x0, y0) to (x1, y1). */
function dashed(g: Graphics, x0: number, y0: number, x1: number, y1: number, color: number, width = 4) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.floor(len / 18));
  for (let i = 0; i < n; i += 2) {
    const a = i / n;
    const b = Math.min(1, (i + 1) / n);
    g.moveTo(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a).lineTo(x0 + (x1 - x0) * b, y0 + (y1 - y0) * b);
  }
  g.stroke(line(color, width));
}

interface Flying {
  node: Container;
  vx: number;
  vy: number;
  vr: number;
  floor: number;
  age: number;
}

interface TrayBlock {
  node: Container;
  drag: DragHandle;
  /** Eighths from the table edge, once on the stack. */
  x: number | null;
}

class BlockTower implements Game {
  readonly plan: TowerPlan;
  readonly rounds: TowerRound[];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The child's tower, bottom first. */
  stack: Container[] = [];
  /** Bear's tower on the compare level. */
  bearStack: Container[] = [];
  /** Tumble and friend levels: the tower is full and waiting to be knocked down. */
  full = false;
  readonly bin = new Container();
  readonly bell: RoundButton;
  /** Taps anywhere on the lap levels. */
  readonly input = new Graphics();
  /** The tower you can tap to take the top block off (flag and compare levels). */
  readonly towerHit = new Container();
  friend: Critter | null = null;
  bear: Critter | null = null;
  // Which tower will stand?
  stand: StandRound | null = null;
  standTowers: Container[][] = [];
  guess: number | null = null;
  // Reach the star.
  reachRound: ReachRound | null = null;
  tray: TrayBlock[] = [];
  readonly ghost = new Graphics();
  readonly hintGhost = new Graphics();

  private readonly room = new Graphics();
  private readonly marks = new Graphics();
  /** Why something fell: ghost outlines and middle lines, drawn over the blocks. */
  private readonly explain = new Graphics();
  private readonly layer = new Container();
  private readonly glow = new Graphics();
  private readonly table = new Graphics();
  private flying: Flying[] = [];
  private view: View;
  private wrongs = 0;
  private hinted = false;
  private glowTop = false;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = this.plan.mode === 'reach' ? REACH.map(() => ({ target: 0 })) : makeRounds(this.plan, ctx.rng);
    this.bell = new RoundButton(symbol('bell', 0, 30), swatch.yellow, 54, () => void this.check());
    const basket = new Graphics()
      .poly([-70, -60, 70, -60, 56, 0, -56, 0]).fill(wood.fill).stroke(line(wood.line, 5))
      .moveTo(-62, -36).lineTo(62, -36).stroke(line(wood.line, 4));
    const peek = new Container();
    ['red', 'blue', 'yellow'].forEach((c, i) => {
      const b = blockArt(c as ColorName);
      b.scale.set(0.55);
      b.position.set(-40 + i * 40, -50 - (i % 2) * 10);
      peek.addChild(b);
    });
    this.bin.addChild(peek, basket);
    this.bin.hitArea = new Rectangle(-85, -110, 170, 125);
    onTap(this.bin, () => this.fromBin(), { cooldown: 250 });
    onTap(this.towerHit, () => this.takeTop(), { cooldown: 250 });
    this.ghost.visible = false;
    this.hintGhost.visible = false;
    this.ghost.eventMode = 'none';
    this.hintGhost.eventMode = 'none';
    this.marks.eventMode = 'none';
    this.explain.eventMode = 'none';
    this.glow.eventMode = 'none';
    const mode = this.plan.mode;
    const basketModes = mode === 'flag' || mode === 'match';
    this.bin.visible = this.bell.visible = this.towerHit.visible = basketModes;
    // The tower's tap area has no drawing, so it can sit over the blocks it stands for.
    ctx.stage.addChild(this.room, this.table, this.marks, this.glow, this.layer, this.explain, this.towerHit, this.ghost, this.hintGhost, this.bin, this.bell);
    if (mode === 'tumble' || mode === 'friend') {
      // Lap play: a tap anywhere stacks, so the input layer goes last, on top.
      onTap(this.input, () => this.lapTap(), { cooldown: 200 });
      ctx.stage.addChild(this.input);
    }
  }

  get round(): TowerRound {
    return this.rounds[this.index];
  }

  private get floor() {
    return this.view.h - 70;
  }

  /** Where the child's tower stands. */
  private get towerX() {
    const v = this.view;
    return this.plan.mode === 'match' ? v.w * 0.58 : v.w * 0.45;
  }

  private get bearX() {
    return this.view.w * 0.3;
  }

  private get edge() {
    return this.view.w * 0.42;
  }

  private get tableTop() {
    return this.floor - 170;
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    const f = v.h - 70;
    this.room.clear().rect(0, 0, v.w, v.h).fill(cream).rect(0, f, v.w, v.h - f).fill(wood.light).rect(0, f - 6, v.w, 8).fill(wood.fill);
    // A window, for a playroom feel.
    this.room.roundRect(v.w * 0.72, 70, 170, 130, 12).fill(swatch.blue.light).stroke(line(wood.line, 6)).moveTo(v.w * 0.72 + 85, 70).lineTo(v.w * 0.72 + 85, 200).moveTo(v.w * 0.72, 135).lineTo(v.w * 0.72 + 170, 135).stroke(line(wood.line, 5));
    this.input.clear();
    this.input.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.bin.position.set(v.w - 120, f + 20);
    this.bell.position.set(v.w - 120, f - 190);
    this.layoutTowers();
    this.drawMarks();
    this.layoutReach();
  }

  update(dt: number) {
    this.clock += dt;
    for (const f of this.flying) {
      f.age += dt;
      f.vy += 1900 * dt;
      f.node.x += f.vx * dt;
      f.node.y += f.vy * dt;
      f.node.rotation += f.vr * dt;
      if (f.node.y > f.floor) {
        f.node.y = f.floor;
        f.vy *= -0.3;
        f.vx *= 0.55;
        f.vr *= 0.4;
      }
      if (f.age > 1.3) f.node.alpha = Math.max(0, 1 - (f.age - 1.3) * 2.5);
    }
    for (const f of this.flying.filter((x) => x.node.alpha <= 0)) f.node.destroy();
    this.flying = this.flying.filter((x) => !x.node.destroyed);
    this.drawGlow();
  }

  /** The ghost finger on the how-to card: stack by tapping, ring the bell at the target, pick the tower that stands, or carry blocks out to the star. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.rounds[this.index]) return null;
    switch (this.plan.mode) {
      case 'tumble':
      case 'friend':
        // A tap anywhere stacks a block, and the next one after the tower is full knocks it down.
        return { tap: { on: this.input, x: this.towerX, y: this.floor - 250 }, pause: 0.3 };
      case 'flag':
      case 'match': {
        const move = stackMove(this.stack.length, this.round.target);
        if (move === 'ring') return { tap: { on: this.bell } };
        if (move === 'take') return { tap: { on: this.towerHit, x: this.towerX, y: this.floor - BH / 2 } };
        return { tap: { on: this.bin, x: 0, y: -50 }, pause: 0.3 };
      }
      case 'stand': {
        if (!this.stand || this.guess !== null) return null;
        return { tap: { on: this.standTowers[standingTower(this.stand)][0], x: 0, y: -BH / 2 } };
      }
      case 'reach': {
        const round = this.reachRound;
        const placed = this.placed;
        const next = round ? nextReach(placed.map((t) => t.x!), round) : undefined;
        const block = this.tray.find((t) => t.x === null && !t.drag.dragging);
        if (next === undefined || !block) return null;
        return { drag: { on: block.node }, to: { on: this.ctx.stage, x: this.edge + px(next), y: this.tableTop - placed.length * BH } };
      }
    }
  }

  destroy() {
    for (const t of this.tray) t.drag.destroy();
  }

  // Layout ----------------------------------------------------------------------------------------

  private layoutTowers() {
    this.stack.forEach((b, i) => {
      if (!this.ctx.tw.busy(b)) b.position.set(this.towerX, this.floor - i * BH);
    });
    this.bearStack.forEach((b, i) => b.position.set(this.bearX, this.floor - i * BH));
    this.bear?.position.set(this.bearX - 120, this.floor);
    if (this.friend) this.friend.position.set(this.towerX + BW / 2 + 30 + 135 * this.friend.scale.x, this.floor);
    const n = Math.max(1, this.stack.length);
    this.towerHit.hitArea = new Rectangle(this.towerX - 75, this.floor - n * BH - 30, 150, Math.max(110, n * BH + 40));
    if (this.stand) {
      this.standTowers.forEach((t, i) => t.forEach((b, k) => b.position.set(this.standX(i) + px(this.stand!.towers[i][k]), this.floor - k * BH)));
    }
  }

  private standX(i: number) {
    return this.view.w * (i ? 0.68 : 0.32);
  }

  /** Height lines and signs: the friend's height, the flag, ropes holding the leaning towers. */
  private drawMarks() {
    const g = this.marks.clear();
    for (const c of [...g.children]) c.destroy();
    if (this.index < 0 || this.finished) return;
    const mode = this.plan.mode;
    const r = this.round;
    if (mode === 'friend' && r) {
      const y = this.floor - r.target * BH;
      dashed(g, this.towerX - 70, y, this.towerX + BW / 2 + 30 + 135 * (this.friend?.scale.x ?? 1), y, swatch.purple.fill);
    }
    if (mode === 'flag' && r) {
      const x = this.towerX + 130;
      const y = this.floor - r.target * BH;
      g.rect(x - 4, y - 10, 8, this.floor - y + 10).fill(wood.line);
      g.poly([x, y - 10, x + 92, y + 22, x, y + 54]).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
      dashed(g, this.towerX - 70, y, x, y, swatch.red.line);
      const n = label(String(r.target), 30, 0xffffff);
      n.position.set(x + 30, y + 22);
      g.addChild(n);
    }
    if (mode === 'stand' && this.stand && this.guess === null) {
      // Ropes from a beam hold both towers until the guess is in.
      g.rect(0, 40, this.view.w, 22).fill(wood.fill);
      this.standTowers.forEach((t) => {
        const top = t[t.length - 1];
        g.moveTo(top.x, 62).lineTo(top.x, top.y - BH).stroke(line(swatch.white.line, 4));
      });
    }
  }

  // Rounds ----------------------------------------------------------------------------------------

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = false;
    this.glowTop = false;
    this.full = false;
    await this.clear();
    if (this.index >= this.rounds.length) return this.finale();
    const r = this.round;
    switch (this.plan.mode) {
      case 'tumble':
        this.drawMarks();
        if (this.index === 0) await this.ctx.instruct('tower.tumble');
        break;
      case 'friend':
        this.friend = this.ctx.track(new Critter(CRITTERS[r.friend!]));
        this.friend.scale.set((r.target * BH) / 250);
        this.layer.addChild(this.friend);
        this.layoutTowers();
        this.drawMarks();
        this.friend.cheer();
        await this.ctx.instruct('tower.friend', { friend: r.friend! });
        break;
      case 'flag':
        this.drawMarks();
        await this.ctx.instruct('tower.flag', { n: r.target });
        break;
      case 'match': {
        if (!this.bear) {
          this.bear = this.ctx.track(new Critter(CRITTERS.bear));
          this.bear.scale.set(0.42);
          this.layer.addChild(this.bear);
        }
        this.layoutTowers();
        for (let i = 0; i < r.bear!; i++) {
          const b = blockArt('brown');
          b.position.set(this.bearX, this.floor - i * BH);
          this.layer.addChild(b);
          this.bearStack.push(b);
          b.scale.set(0);
          sfx.clunk();
          await this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.18, ease: ease.outBack });
        }
        this.bear.cheer();
        await this.ctx.instruct(r.ask === 'same' ? 'tower.match-same' : r.ask === 'taller' ? 'tower.match-taller' : 'tower.match-shorter');
        break;
      }
      case 'stand':
        await this.buildStand();
        break;
      case 'reach':
        this.buildReach();
        await this.ctx.instruct('tower.reach');
        break;
    }
    this.busy = false;
  }

  /** Knocks everything from the last round away and tidies up. */
  private async clear() {
    for (const t of this.tray) t.drag.destroy();
    const gone = [...this.stack, ...this.bearStack, ...this.standTowers.flat(), ...this.tray.map((t) => t.node)];
    for (const b of gone) {
      this.ctx.tw.kill(b);
      void this.ctx.tw.to(b, { alpha: 0 }, { duration: 0.25 }).then(() => b.destroy());
    }
    this.stack = [];
    this.bearStack = [];
    this.standTowers = [];
    this.tray = [];
    this.stand = null;
    this.guess = null;
    this.reachRound = null;
    this.ghost.visible = this.hintGhost.visible = false;
    this.table.clear();
    if (this.friend) {
      this.ctx.untrack(this.friend);
      this.friend.destroy({ children: true });
      this.friend = null;
    }
    this.layoutTowers();
    if (gone.length) await this.ctx.tw.wait(0.3);
  }

  // Stacking: tap anywhere (lap), or the basket ------------------------------------------------------

  private lapTap() {
    if (this.busy || this.finished) return;
    if (this.full) return void this.knock();
    this.addBlock();
    const r = this.round;
    if (this.stack.length >= r.target) {
      this.full = true;
      this.busy = true;
      void this.ctx.tw.wait(0.4).then(async () => {
        if (this.plan.mode === 'friend') {
          this.friend?.cheer();
          sfx.giggle();
          await this.ctx.say('tower.as-tall', { friend: r.friend! });
        }
        this.busy = false;
        await this.ctx.instruct('tower.knock');
      });
    }
  }

  private fromBin() {
    if (this.busy || this.finished || this.stack.length >= MAX_BLOCKS) return;
    this.glowTop = false;
    this.addBlock();
  }

  /** A block drops from above onto the top of the tower, and the count is said. */
  private addBlock() {
    const i = this.stack.length;
    const b = blockArt(colorFor(i));
    b.position.set(this.towerX, -BH);
    this.layer.addChild(b);
    this.stack.push(b);
    this.layoutTowers();
    void this.ctx.tw.to(b, { y: this.floor - i * BH }, { duration: 0.35, ease: ease.outBack }).then(() => {
      sfx.clunk();
      sfx.bell(3 + Math.min(9, i), 0.22);
    });
    void this.ctx.say('count', { n: i + 1 });
  }

  /** Tap your tower to take its top block back to the basket. */
  private takeTop() {
    if (this.busy || this.finished) return;
    const b = this.stack.pop();
    if (!b) return;
    this.glowTop = false;
    sfx.whoosh();
    this.layoutTowers();
    void this.ctx.tw.to(b, { x: this.bin.x, y: this.bin.y - 60, alpha: 0 }, { duration: 0.35, ease: ease.inQuad }).then(() => b.destroy());
  }

  /** A big, giggly tumble. */
  private async knock() {
    this.busy = true;
    sfx.rumble();
    sfx.giggle();
    this.ctx.pet.cheer();
    void this.ctx.say('tower.crash');
    this.tumble(this.stack, this.towerX);
    this.stack = [];
    this.friend?.cheer();
    await this.ctx.tw.wait(1.4);
    void this.next();
  }

  /** Blocks fly off with a cartoon bounce. A leaning tower (`lean` ±1) just topples over to that side. */
  private tumble(blocks: Container[], from: number, lean = 0) {
    for (const node of blocks) {
      this.ctx.tw.kill(node);
      const away = lean || Math.sign(node.x - from + this.ctx.rng.range(-1, 1));
      const [vx, vy] = lean ? [this.ctx.rng.range(60, 150), this.ctx.rng.range(80, 200)] : [this.ctx.rng.range(120, 420), this.ctx.rng.range(250, 650)];
      this.flying.push({ node, vx: away * vx, vy: -vy, vr: away * this.ctx.rng.range(2, 5), floor: this.floor - BH / 2 + 20, age: 0 });
      node.pivot.set(0, -BH / 2);
      node.y -= BH / 2;
    }
  }

  /** The bell: is the tower up to the flag, or the right height next to Bear's? */
  private async check() {
    if (this.busy || this.finished) return;
    this.busy = true;
    const r = this.round;
    const have = this.stack.length;
    const result = compare(have, r.target);
    if (result === 'right') {
      sfx.bell(10, 0.35);
      if (this.plan.mode === 'match') {
        this.bear?.cheer();
        await this.ctx.say('tower.match-right', { have, bear: r.bear! });
      } else await this.ctx.say('tower.right', { n: have });
      await this.ctx.tw.wait(0.3);
      this.tumble(this.bearStack, this.bearX, -1);
      this.bearStack = [];
      return void this.knock();
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.plan.mode === 'match') await this.ctx.say('tower.match-wrong', { bear: r.bear!, have, want: r.target });
    else await this.ctx.say(result === 'short' ? 'tower.short' : 'tower.tall');
    if (result === 'tall') this.glowTop = true;
    if (this.wrongs >= 2) {
      // Count them together: the child's blocks bounce one by one.
      if (!this.hinted) {
        this.hinted = true;
        this.hints++;
      }
      await this.ctx.say('tower.count-hint');
      for (const [k, b] of this.stack.entries()) {
        void this.ctx.tw.to(b.scale, { x: 1.12, y: 1.12 }, { duration: 0.15 }).then(() => this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.15 }));
        sfx.bell(3 + k, 0.2);
        await this.ctx.say('count', { n: k + 1 });
      }
      await this.ctx.say('tower.want', { n: r.target });
    }
    this.busy = false;
  }

  // Which tower will stand? ------------------------------------------------------------------------

  private async buildStand() {
    // The third round's towers reach almost as far, so only the rule tells them apart.
    this.stand = makeStand(this.ctx.rng, this.index >= 2);
    this.standTowers = this.stand.towers.map((t, i) => t.map((_, k) => {
      const b = blockArt(colorFor(i * 3 + k));
      this.layer.addChild(b);
      return b;
    }));
    this.layoutTowers();
    this.drawMarks();
    this.standTowers.forEach((t, i) => {
      for (const b of t) {
        b.hitArea = new Rectangle(-BW / 2 - 20, -BH - 30, BW + 40, BH + 40);
        onTap(b, () => void this.predict(i), { cooldown: 400 });
      }
    });
    await this.ctx.instruct('tower.stand');
  }

  /** A guess (never wrong in itself), then the ropes let go and we see. */
  async predict(i: number) {
    if (this.busy || this.finished || !this.stand || this.guess !== null) return;
    this.busy = true;
    this.guess = i;
    sfx.pop(8);
    const heart = new Graphics().moveTo(0, 18).bezierCurveTo(-30, -6, -16, -28, 0, -12).bezierCurveTo(16, -28, 30, -6, 0, 18).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 4));
    const top = this.standTowers[i][2];
    heart.position.set(top.x, top.y - BH - 40);
    this.layer.addChild(heart);
    await this.ctx.tw.wait(0.6);
    sfx.whoosh();
    this.drawMarks();
    await this.ctx.tw.wait(0.5);
    const fall = 1 - this.stand.stands;
    const tower = this.standTowers[fall];
    const k = topples(this.stand.towers[fall], null);
    const lean = Math.sign(this.stand.towers[fall][2]);
    // Show why with a ghost of the fallen tower and the middle line of its top blocks.
    const g = this.explain.clear();
    const x0 = this.standX(fall);
    const offs = this.stand.towers[fall];
    for (let j = 0; j < offs.length; j++) g.roundRect(x0 + px(offs[j]) - BW / 2, this.floor - (j + 1) * BH, BW, BH, 10).stroke({ width: 3, color: ink, alpha: 0.35 });
    const mid = x0 + px(middleFrom(offs, k));
    const below = x0 + px(offs[k - 1]);
    dashed(g, mid, this.floor - (offs.length + 0.5) * BH, mid, this.floor - (k - 1) * BH, swatch.red.fill, 5);
    g.moveTo(below + (lean * BW) / 2, this.floor - k * BH - 10).lineTo(below + (lean * BW) / 2, this.floor - k * BH + 18).stroke(line(swatch.red.line, 6));
    sfx.rumble();
    this.tumble(tower.slice(k), x0, lean);
    this.standTowers[fall] = tower.slice(0, k);
    // And the middle line for the tower that stands: over the block below.
    const up = this.stand.stands;
    const ux = this.standX(up);
    const uoffs = this.stand.towers[up];
    const umid = ux + px(middleFrom(uoffs, 1));
    dashed(g, umid, this.floor - 3.5 * BH, umid, this.floor - BH, swatch.green.fill, 5);
    await this.ctx.tw.wait(1);
    await this.ctx.say(i === up ? 'tower.stand-yes' : 'tower.stand-no');
    heart.destroy();
    await this.ctx.tw.wait(0.6);
    this.explain.clear();
    void this.next();
  }

  // Reach the star ----------------------------------------------------------------------------------

  private buildReach() {
    this.reachRound = REACH[this.index];
    for (let i = 0; i < this.reachRound.blocks; i++) {
      const node = blockArt(colorFor(i + 2));
      node.hitArea = new Rectangle(-BW / 2 - 10, -BH - 30, BW + 20, BH + 40);
      this.layer.addChild(node);
      const t: TrayBlock = {
        node,
        x: null,
        drag: draggable(node, this.ctx.tw, {
          onPick: () => this.pick(t),
          onMove: (x, y) => this.aim(x, y),
          onDrop: (x, y) => this.place(t, x, y),
        }),
      };
      this.tray.push(t);
    }
    this.layoutReach();
  }

  /** The stack on the table, bottom first. */
  get placed(): TrayBlock[] {
    return this.tray.filter((t) => t.x !== null).sort((a, b) => a.node.y > b.node.y ? -1 : 1);
  }

  private layoutReach() {
    const round = this.reachRound;
    if (!round) return;
    const v = this.view;
    const e = this.edge;
    const top = this.tableTop;
    const g = this.table.clear();
    g.rect(-20, top, e + 20, 26).fill(wood.fill).stroke(line(wood.line, 5));
    g.rect(40, top + 26, 22, this.floor - top - 26).rect(e - 70, top + 26, 22, this.floor - top - 26).fill(wood.line);
    const sx = e + px(round.star);
    const highest = top - (round.blocks + 0.6) * BH;
    dashed(g, sx, top + 20, sx, highest, swatch.yellow.line, 5);
    g.poly([0, -30, 9, -10, 30, -9, 13, 5, 19, 27, 0, 15, -19, 27, -13, 5, -30, -9, -9, -10].map((n, i) => n + (i % 2 ? highest - 10 : sx))).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
    const loose = this.tray.filter((t) => t.x === null);
    loose.forEach((t, i) => {
      const home = { x: v.w - 330 + i * 120, y: this.floor + 30 };
      t.drag.home = home;
      if (!t.drag.dragging && !this.ctx.tw.busy(t.node)) t.node.position.set(home.x, home.y);
    });
    const placed = this.placed;
    placed.forEach((t, k) => {
      if (!t.drag.dragging && !this.ctx.tw.busy(t.node)) t.node.position.set(e + px(t.x!), top - k * BH);
    });
    // Blocks in the tray move freely; on the stack only the top one lifts off again.
    for (const t of this.tray) if (!t.drag.dragging) t.drag.enabled = t.x === null || t === placed[placed.length - 1];
  }

  /** The slot a block over (x, y) would drop into: the next level up, snapped to eighths. */
  private slot(x: number, y: number): number | null {
    const e = this.edge;
    if (x < e - 2 * BW || x > e + 1.6 * BW || y > this.tableTop + 40) return null;
    return Math.max(-12, Math.min(10, Math.round(((x - e) / BW) * W)));
  }

  private pick(t: TrayBlock) {
    sfx.tick();
    t.x = null;
  }

  private aim(x: number, y: number) {
    const s = this.slot(x, y);
    this.ghost.visible = s !== null;
    if (s === null) return;
    const k = this.placed.length;
    this.ghost.clear().roundRect(-BW / 2, -BH, BW, BH, 10).stroke({ width: 4, color: ink, alpha: 0.5 });
    this.ghost.position.set(this.edge + px(s), this.tableTop - k * BH);
  }

  private place(t: TrayBlock, x: number, y: number): boolean {
    this.ghost.visible = false;
    const s = this.slot(x, y);
    if (this.busy || this.finished || s === null) {
      t.x = null;
      this.layoutReach();
      return false;
    }
    const placedBelow = this.placed.filter((p) => p !== t);
    // A block lifted from the middle of the stack can't be put back on top of itself.
    if (placedBelow.length >= this.reachRound!.blocks) return false;
    t.x = s;
    this.hintGhost.visible = false;
    const k = placedBelow.length;
    void this.ctx.tw.to(t.node, { x: this.edge + px(s), y: this.tableTop - k * BH }, { duration: 0.15, ease: ease.outQuad }).then(() => void this.settled());
    sfx.clunk();
    return true;
  }

  /** After a block lands: does it all stand, and does anything touch the star? */
  private async settled() {
    const round = this.reachRound;
    if (!round || this.busy) return;
    const stack = this.placed;
    const xs = stack.map((t) => t.x!);
    const falls = topples(xs, 0);
    if (falls >= 0) {
      this.busy = true;
      this.misses++;
      this.wrongs++;
      // The ghosts of the falling blocks stay a moment with the line through their middle.
      const g = this.explain.clear();
      const mid = this.edge + px(middleFrom(xs, falls));
      const under = falls === 0 ? this.edge : this.edge + px(xs[falls - 1]) + BW / 2;
      for (let j = falls; j < xs.length; j++) g.roundRect(this.edge + px(xs[j]) - BW / 2, this.tableTop - (j + 1) * BH, BW, BH, 10).stroke({ width: 3, color: ink, alpha: 0.35 });
      dashed(g, mid, this.tableTop - (xs.length + 0.3) * BH, mid, this.tableTop - falls * BH + 30, swatch.red.fill, 5);
      g.moveTo(under, this.tableTop - falls * BH - 8).lineTo(under, this.tableTop - falls * BH + 20).stroke(line(swatch.red.line, 6));
      sfx.rumble();
      const down = stack.slice(falls);
      for (const t of down) {
        t.x = null;
        t.drag.enabled = false;
      }
      // Fly a copy so the real block can float home to the tray.
      for (const t of down) t.node.visible = false;
      const copies = down.map((t) => {
        const c = blockArt(colorFor(this.tray.indexOf(t) + 2));
        c.position.copyFrom(t.node.position);
        this.layer.addChild(c);
        return c;
      });
      this.tumble(copies, this.edge - 200, 1);
      await this.ctx.say(falls === 0 ? 'tower.fell-table' : 'tower.fell-block');
      this.explain.clear();
      // Back in the tray, fading in.
      this.layoutReach();
      for (const t of down) {
        t.node.visible = true;
        t.drag.enabled = true;
        t.node.alpha = 0;
        void this.ctx.tw.to(t.node, { alpha: 1 }, { duration: 0.3 });
      }
      this.busy = false;
      if (this.wrongs >= 2) this.reachHint();
      return;
    }
    this.layoutReach();
    if (reached(xs, round.star)) {
      this.busy = true;
      sfx.sparkle();
      sfx.tada();
      const sx = this.edge + px(round.star);
      this.ctx.particles.burst(sx, this.tableTop - (round.blocks + 0.6) * BH - 10, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 18, speed: [150, 320], gravity: 0, life: [0.6, 1] });
      for (const t of this.tray) t.drag.enabled = false;
      await this.ctx.say('tower.star');
      await this.ctx.tw.wait(0.6);
      return void this.next();
    }
    if (stack.length === round.blocks) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      await this.ctx.say('tower.not-yet');
      if (this.wrongs >= 2) this.reachHint();
    }
  }

  /** A glowing place for the next block that leads to the star, or a glow on the top block to take off. */
  private reachHint() {
    const round = this.reachRound!;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    const xs = this.placed.map((t) => t.x!);
    const way = finish(xs, round);
    if (way && way.length) {
      this.hintGhost.clear().roundRect(-BW / 2, -BH, BW, BH, 10).fill({ color: 0xfff3a0, alpha: 0.7 }).stroke({ width: 4, color: swatch.yellow.line });
      this.hintGhost.position.set(this.edge + px(way[0]), this.tableTop - xs.length * BH);
      this.hintGhost.visible = true;
      void this.ctx.say('tower.reach-hint');
    } else {
      this.glowTop = true;
      void this.ctx.say('tower.reach-off');
    }
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (!this.glowTop || this.finished) return;
    const stack = this.plan.mode === 'reach' ? this.placed.map((t) => t.node) : this.stack;
    const top = stack[stack.length - 1];
    if (!top) return;
    const a = 0.55 + 0.3 * Math.sin(this.clock * 6);
    g.roundRect(top.x - BW / 2 - 16, top.y - BH - 16, BW + 32, BH + 32, 18).fill({ color: 0xfff3a0, alpha: a });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.drawMarks();
    sfx.tada();
    await this.ctx.say('tower.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class TowerIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    ['red', 'yellow', 'blue', 'green'].forEach((color, i) => {
      const b = blockArt(color as ColorName);
      b.position.set((i % 2) * 12 - 6, -i * BH);
      c.addChild(b);
    });
    const falling = blockArt('purple');
    falling.position.set(96, -2.6 * BH);
    falling.rotation = 0.5;
    c.addChild(falling);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const n = rng.int(3, 4);
  for (let i = 0; i < n; i++) {
    const b = blockArt(rng.pick(RAINBOW));
    b.scale.set(0.8);
    b.position.set(rng.int(-8, 8), 90 - i * BH * 0.8);
    c.addChild(b);
  }
  return c;
}

export const blockTower: GameModule = {
  id: 'block-tower',
  name: 'Block Tower',
  titleLine: 'game.block-tower',
  region: 'tinker-lab',
  skills: ['stacking', 'measuring height', 'comparing', 'balance'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  touchDemo: true,
  coplayHint: 'Stack real blocks or cups with {name} and knock them down together: "One, two, three... crash!"',
  offScreen: 'Build towers with cups or books: which is taller? Then try leaning a stack over the edge of a table.',
  hubIcon: () => new TowerIcon(),
  sticker,
  create: (ctx) => new BlockTower(ctx),
};
