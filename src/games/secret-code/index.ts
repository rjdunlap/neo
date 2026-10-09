import { Circle, Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { shapePath, type ShapeKind } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { ignoredClues, makeCode, nextMove, planFor, score, STONES, suggestion, type CodePlan, type Guess, type Mark } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 6 },
};

/** Each stone has a shape as well as a color, so colors never have to be told apart by hue alone. */
const MARKS: ShapeKind[] = ['circle', 'triangle', 'square', 'star', 'heart'];

function stoneArt(color: number, r: number): Container {
  const c = new Container();
  const sw = swatch[STONES[color]];
  c.addChild(new Graphics().circle(0, 0, r).fill(sw.fill).stroke({ width: Math.max(3, r * 0.1), color: sw.line }).circle(-r * 0.35, -r * 0.35, r * 0.18).fill({ color: 0xffffff, alpha: 0.7 }));
  c.addChild(shapePath(new Graphics(), MARKS[color], r * 0.38).fill({ color: 0xffffff, alpha: 0.85 }));
  return c;
}

function markArt(mark: Mark, r: number): Graphics {
  const g = new Graphics().circle(0, 0, r).fill(mark === 'green' ? swatch.green.fill : mark === 'yellow' ? swatch.yellow.fill : 0xc9ccd6).stroke({ width: 3, color: 0xffffff });
  if (mark === 'green') g.moveTo(-r * 0.45, 0).lineTo(-r * 0.1, r * 0.4).lineTo(r * 0.5, -r * 0.4).stroke({ width: r * 0.28, color: 0xffffff, cap: 'round', join: 'round' });
  else if (mark === 'gray') g.moveTo(-r * 0.35, -r * 0.35).lineTo(r * 0.35, r * 0.35).moveTo(r * 0.35, -r * 0.35).lineTo(-r * 0.35, r * 0.35).stroke({ width: r * 0.22, color: 0xffffff, cap: 'round' });
  else g.circle(0, 0, r * 0.3).fill(0xffffff);
  return g;
}

function keyArt(): Graphics {
  const g = new Graphics();
  g.circle(-16, 0, 15).stroke({ width: 8, color: swatch.yellow.line });
  g.moveTo(-2, 0).lineTo(30, 0).moveTo(22, 0).lineTo(22, 12).moveTo(30, 0).lineTo(30, 10).stroke({ width: 8, color: swatch.yellow.line, cap: 'round' });
  return g;
}

class SecretCode implements Game {
  readonly plan: CodePlan;
  code: number[] = [];
  guess: (number | null)[] = [];
  history: Guess[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  readonly slots: Container[] = [];
  readonly tray: Container[] = [];
  readonly key: RoundButton;

  private readonly door = new Graphics();
  private readonly leaf = new Graphics();
  private readonly past = new Container();
  private readonly slotLayer = new Container();
  private readonly ghost = new Container();
  private view: View;
  private wrongs = 0;
  private hinted = false;
  /** Couch face-off score: every key turned across the round's doors (lower is better). */
  guesses = 0;
  // Couch play: a ring over the stone tray.
  private trayFocus = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.key = new RoundButton(keyArt(), swatch.white, 56, () => void this.tryKey());
    this.ghost.eventMode = 'none';
    this.ring.eventMode = 'none';
    ctx.stage.addChild(this.door, this.leaf, this.past, this.slotLayer, this.ghost, this.key, this.ring);
    for (let c = 0; c < this.plan.colors; c++) {
      const b = stoneArt(c, 46);
      b.hitArea = new Circle(0, 0, 56);
      onTap(b, () => this.add(c), { cooldown: 150 });
      this.tray.push(b);
      ctx.stage.addChild(b);
    }
  }

  start() {
    void this.next();
  }

  private slotX(i: number) {
    return this.view.w / 2 - 40 + (i - (this.plan.slots - 1) / 2) * 124;
  }

  private doorY() {
    return Math.max(430, this.view.h * 0.6);
  }

  resize(v: View) {
    this.view = v;
    const y = this.doorY();
    const w = this.plan.slots * 124 + 60;
    const x0 = this.slotX(0) - 92;
    this.door.clear().roundRect(x0 - 10, y - 92, w + 20, 184, 34).fill(wood.line).roundRect(x0, y - 82, w, 164, 28).fill(wood.fill).stroke({ width: 5, color: wood.light });
    this.slots.forEach((s, i) => s.position.set(this.slotX(i), y));
    this.ghost.children.forEach((s, i) => s.position.set(this.slotX(i), y));
    this.key.position.set(x0 + w + 80, y);
    const xs = spread(this.tray.length, 190, v.w - 110, 124);
    this.tray.forEach((b, i) => b.position.set(xs[i], v.h - 90));
    this.layoutPast();
  }

  update() {
    // A hint stone shows only while its slot is empty.
    this.ghost.children.forEach((s, i) => (s.visible = this.guess[i] === null));
    const ring = this.ring.clear();
    const stone = this.couchOn && !this.finished ? this.tray[this.trayFocus] : undefined;
    if (stone) ring.circle(stone.x, stone.y, 62).stroke({ width: 8, color: swatch.teal.line });
  }

  destroy() {}

  /** Couch play: left and right choose a stone; the bottom button places it, or turns the key once every slot is full; the left button takes the last stone back. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished) return;
    for (const p of input.players) {
      if (p.direction === 0) this.trayFocus = Math.min(this.tray.length - 1, this.trayFocus + 1);
      else if (p.direction === 2) this.trayFocus = Math.max(0, this.trayFocus - 1);
      if (p.undo) {
        const last = this.guess.map((g) => g !== null).lastIndexOf(true);
        if (last >= 0) this.clear(last);
      }
      if (p.action) {
        if (this.guess.includes(null)) this.add(this.trayFocus);
        else void this.tryKey();
      }
    }
  }

  /** The "watch me" demo: a player who reasons from the clues, trying a code that fits every mark so far. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || this.botWait > 0) return out;
    const move = nextMove(this.plan, this.history, this.code, this.guess);
    if ('key' in move) {
      out.players[0].action = true;
      this.botWait = 1;
      return out;
    }
    const want = move.stone;
    if (want === this.trayFocus) {
      out.players[0].action = true;
      this.botWait = 0.5;
    } else {
      out.players[0].direction = want > this.trayFocus ? 0 : 2;
      this.botWait = 0.35;
    }
    return out;
  }

  /** The ghost finger on the how-to card: tap the stone the clues point to, slot by slot, then the key. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const move = nextMove(this.plan, this.history, this.code, this.guess);
    return 'key' in move ? { tap: { on: this.key }, pause: 0.9 } : { tap: { on: this.tray[move.stone] }, pause: 0.3 };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = false;
    if (this.index >= this.plan.codes) return void this.finale();
    this.code = makeCode(this.plan, this.ctx.rng);
    this.history = [];
    this.past.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.leaf.clear();
    this.guess = Array(this.plan.slots).fill(null);
    this.slotLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.slots.length = 0;
    for (let i = 0; i < this.plan.slots; i++) {
      const s = new Container();
      s.addChild(new Graphics().circle(0, 0, 50).fill(wood.line).circle(0, 0, 44).fill(0x7a5230));
      s.hitArea = new Circle(0, 0, 58);
      onTap(s, () => this.clear(i), { cooldown: 150 });
      this.slots.push(s);
      this.slotLayer.addChild(s);
    }
    this.resize(this.view);
    this.busy = false;
    if (this.index > 0) return;
    if (this.plan.repeats) return this.ctx.instruct('code.repeat');
    return this.ctx.instruct(this.plan.yellow ? 'code.yellow' : 'code.yesno');
  }

  /** Tap a stone in the tray: it goes into the first empty slot. */
  private add(color: number) {
    if (this.busy || this.finished) return;
    const i = this.guess.indexOf(null);
    if (i < 0) {
      sfx.boing();
      return;
    }
    this.guess[i] = color;
    const s = stoneArt(color, 40);
    s.scale.set(0.3);
    s.eventMode = 'none';
    this.slots[i].addChild(s);
    void this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    sfx.pop(4 + color);
  }

  /** Tap a filled slot: the stone goes back. */
  private clear(i: number) {
    if (this.busy || this.finished || this.guess[i] === null) return;
    this.guess[i] = null;
    this.slots[i].removeChildAt(1).destroy({ children: true });
    sfx.pop(3);
  }

  private async tryKey() {
    if (this.busy || this.finished) return;
    if (this.guess.includes(null)) {
      sfx.boing();
      return void this.ctx.say('code.fill');
    }
    this.busy = true;
    this.guesses++;
    const stones = this.guess as number[];
    const ignored = ignoredClues(this.plan, this.history, stones);
    const marks = score(this.code, stones, this.plan.yellow);
    this.history.push({ stones: [...stones], marks });
    sfx.knock();
    // Marks pop up under each slot, then the guess moves up into the list above the door.
    const y = this.doorY();
    const badges = marks.map((m, i) => {
      const b = markArt(m, 22);
      b.position.set(this.slotX(i) + 36, y + 36);
      b.scale.set(0);
      this.ctx.stage.addChild(b);
      return b;
    });
    for (const b of badges) {
      await this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.18, ease: ease.outBack });
      sfx.tick();
    }
    const green = marks.filter((m) => m === 'green').length;
    if (green === this.plan.slots) {
      await this.ctx.tw.wait(0.3);
      badges.forEach((b) => b.destroy());
      return void this.open();
    }
    if (ignored.length) {
      // The only mistake here: putting a stone where a mark already said it can't go.
      this.misses++;
      this.wrongs++;
      sfx.boing();
      await this.ctx.say('code.ignored', { color: STONES[stones[ignored[0]]] });
    } else if (this.plan.yellow) await this.ctx.say('code.marks', { g: green, y: marks.filter((m) => m === 'yellow').length });
    else await this.ctx.say('code.green', { g: green });
    await this.ctx.tw.wait(0.4);
    badges.forEach((b) => b.destroy());
    this.addPast(this.history.at(-1)!);
    // Keep the stones that were green; the rest come back to the tray.
    marks.forEach((m, i) => {
      if (m !== 'green') this.clear0(i);
    });
    if (!this.hinted && (this.wrongs >= 2 || this.history.length >= this.plan.slots + 4)) this.hint();
    this.busy = false;
  }

  private clear0(i: number) {
    if (this.guess[i] === null) return;
    this.guess[i] = null;
    this.slots[i].removeChildAt(1).destroy({ children: true });
  }

  /** Faint stones in the empty slots: a guess that fits every clue so far. */
  private hint() {
    this.hinted = true;
    this.hints++;
    const idea = suggestion(this.plan, this.history, this.code);
    idea.forEach((c) => {
      const s = stoneArt(c, 40);
      s.alpha = 0.4;
      this.ghost.addChild(s);
    });
    this.resize(this.view);
    void this.ctx.say('code.hint');
  }

  private addPast(g: Guess) {
    const row = new Container();
    g.stones.forEach((c, i) => {
      const s = stoneArt(c, 24);
      s.x = i * 76;
      const m = markArt(g.marks[i], 13);
      m.position.set(i * 76 + 22, 18);
      row.addChild(s, m);
    });
    this.past.addChild(row);
    this.layoutPast();
  }

  /** The latest guesses stack above the door, newest nearest it; older ones fade. */
  private layoutPast() {
    const rows = this.past.children;
    const top = 120;
    const bottom = this.doorY() - 150;
    const fit = Math.max(1, Math.floor((bottom - top) / 62) + 1);
    rows.forEach((r, i) => {
      const fromEnd = rows.length - 1 - i;
      r.visible = fromEnd < fit;
      r.alpha = fromEnd === fit - 1 && fit > 1 ? 0.5 : 1;
      r.position.set(this.view.w / 2 - 40 - ((this.plan.slots - 1) * 76) / 2, bottom - fromEnd * 62);
    });
  }

  private async open() {
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    sfx.sparkle();
    const y = this.doorY();
    const x0 = this.slotX(0) - 92;
    const w = this.plan.slots * 124 + 60;
    // Light pours out of the doorway.
    this.leaf.clear().roundRect(x0, y - 82, w, 164, 28).fill({ color: 0xfff3a0, alpha: 0.9 });
    this.leaf.alpha = 0;
    await this.ctx.tw.to(this.leaf, { alpha: 1 }, { duration: 0.35 });
    this.ctx.particles.burst(this.view.w / 2, y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 24, speed: [150, 380], gravity: 0, life: [0.6, 1] });
    this.ctx.pet.cheer();
    await this.ctx.say('code.open');
    await this.ctx.tw.wait(0.5);
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('code.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.guesses });
  }
}

class CodeIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-90, -200, 180, 200, 30).fill(wood.fill).stroke({ width: 6, color: wood.line }));
    [0, 1, 2].forEach((color, i) => {
      const s = stoneArt(color, 22);
      s.position.set(-55 + i * 55, -100);
      c.addChild(s);
      const m = markArt((['green', 'yellow', 'gray'] as Mark[])[i], 10);
      m.position.set(-40 + i * 55, -80);
      c.addChild(m);
    });
    c.addChild(new Graphics().circle(60, -150, 9).fill(ink));
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().roundRect(-80, -100, 160, 200, 30).fill(0xfff3a0).stroke({ width: 8, color: wood.line }));
  for (let i = 0; i < 3; i++) {
    const s = stoneArt(rng.int(0, 4), 26);
    s.position.set(-50 + i * 50, 0);
    c.addChild(s);
  }
  return c;
}

export const secretCode: GameModule = {
  id: 'secret-code',
  name: 'Secret Code',
  titleLine: 'game.secret-code',
  region: 'puzzle-peaks',
  skills: ['deduction', 'using-evidence', 'colors', 'reasoning'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'After each try, say what the marks tell you: "Red is right! Blue is in the code, but somewhere else."',
  offScreen: 'Hide three toys in a row behind your back and let her guess the order, saying which ones are in the right spot.',
  hubIcon: () => new CodeIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SecretCode(ctx),
};
