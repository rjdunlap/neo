import { Circle, Container, Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { symbol } from '../shared';
import type { Game, GameContext, GameModule, HubIcon, TouchIntent } from '../types';
import { foodArt, Monster, MONSTER_COLORS, monsterSticker, MOUTH_Y } from './art';
import { complete, extras, missing, munchPlan, munchRounds, munchTouch, numberChoices, orderWords, wantsMore, type Food, type MunchPlan, type MunchRound, type Order } from './logic';

interface Snack {
  food: Food;
  node: Container;
  drag: DragHandle | null;
  eatenBy: Monster | null;
}

const plural = (food: Food) => `${food}s`;

class MonsterMunch implements Game {
  readonly plan: MunchPlan;
  readonly rounds: MunchRound[];
  readonly monsters: Monster[] = [];
  readonly snacks: Snack[] = [];
  readonly pads: { value: number; node: Container }[] = [];
  round = 0;
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  done = false;

  private readonly background = new Graphics();
  private readonly tray = new Graphics();
  private readonly sign = new Container();
  private readonly glow = new Graphics();
  readonly bell: RoundButton;
  private view: View;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = munchPlan(ctx.level);
    this.rounds = munchRounds(this.plan, ctx.rng);
    this.bell = new RoundButton(symbol('bell', 0, 34), swatch.yellow, 56, () => this.ring());
    this.bell.visible = this.plan.mode === 'exact' || this.plan.mode === 'two' || this.plan.mode === 'leftover';
    ctx.stage.addChild(this.background, this.tray, this.sign, this.bell, this.glow);
  }

  get current() {
    return this.rounds[this.round];
  }

  start() {
    this.deal();
  }

  private instruct(id: LineId, vars?: LineVars) {
    return this.ctx.instruct(id, vars);
  }

  // Setting up a round ------------------------------------------------------

  private deal() {
    const r = this.current;
    const { ctx } = this;
    this.wrong = 0;
    this.clear();
    for (let i = 0; i < r.monsters; i++) {
      const m = new Monster(MONSTER_COLORS[i % MONSTER_COLORS.length]);
      m.showTummy = this.plan.mode !== 'tap';
      m.refresh();
      m.gape(true);
      m.alpha = 0;
      void ctx.tw.to(m, { alpha: 1 }, { duration: 0.4, delay: i * 0.15 });
      onTap(m, () => { m.beam(0.6); sfx.giggle(); });
      m.hitArea = new Circle(0, -150, 140);
      this.monsters.push(m);
      ctx.stage.addChildAt(m, ctx.stage.getChildIndex(this.tray) + 1);
    }
    const foods: Food[] = ctx.rng.shuffle([...Array<Food>(r.tray.cookie).fill('cookie'), ...Array<Food>(r.tray.apple).fill('apple')]);
    foods.forEach((food, i) => {
      const node = foodArt(food);
      node.hitArea = new Circle(0, 0, 55);
      const snack: Snack = { food, node, drag: null, eatenBy: null };
      if (this.plan.mode === 'tap') {
        onTap(node, () => !snack.eatenBy && !this.done && this.feed(this.monsters[0], snack));
      } else {
        snack.drag = draggable(node, ctx.tw, {
          onPick: () => sfx.tick(),
          onDrop: (x, y) => this.drop(snack, x, y),
        });
      }
      node.scale.set(0);
      void ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, delay: 0.3 + i * 0.06, ease: ease.outBack });
      this.snacks.push(snack);
      ctx.stage.addChild(node);
    });
    this.drawSign(r.want);
    this.resize(this.view);
    switch (this.plan.mode) {
      case 'tap': void this.instruct('munch.tap'); break;
      case 'count': void this.instruct('munch.count'); break;
      case 'each': void this.instruct('munch.each'); break;
      case 'share': void this.instruct('munch.share'); break;
      case 'leftover': void this.instruct('munch.leftover'); break;
      default: void this.instruct('munch.want', { food: orderWords(r.want) });
    }
    this.busy = false;
  }

  private clear() {
    for (const s of this.snacks) {
      s.drag?.destroy();
      this.ctx.tw.kill(s.node);
      this.ctx.tw.kill(s.node.scale);
      s.node.destroy({ children: true });
    }
    this.snacks.length = 0;
    for (const m of this.monsters) {
      this.ctx.tw.kill(m);
      m.destroy({ children: true });
    }
    this.monsters.length = 0;
    this.clearPads();
    this.glow.clear();
  }

  private drawSign(want: Order) {
    this.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.sign.visible = this.plan.mode === 'exact' || this.plan.mode === 'two';
    if (!this.sign.visible) return;
    const board = new Graphics()
      .roundRect(-12, 60, 24, 90, 6)
      .fill(wood.fill)
      .stroke({ width: 5, color: wood.line })
      .roundRect(-140, -80, 280, 160, 22)
      .fill(wood.light)
      .stroke({ width: 7, color: wood.line });
    this.sign.addChild(board);
    const items: [number, Food][] = (['cookie', 'apple'] as Food[]).filter((f) => want[f] > 0).map((f) => [want[f], f]);
    items.forEach(([n, food], i) => {
      const one = items.length === 1;
      const x = one ? 0 : -68 + i * 136;
      const y = this.plan.dots ? -22 : 0;
      const text = label(String(n), 68, wood.line);
      text.position.set(one ? -45 : x - 28, y);
      const art = foodArt(food);
      art.scale.set(one ? 0.75 : 0.5);
      art.position.set(one ? 50 : x + 30, y);
      this.sign.addChild(text, art);
    });
    if (this.plan.dots) {
      const g = new Graphics();
      for (let i = 0; i < want.cookie; i++) g.circle((i - (want.cookie - 1) / 2) * 34, 46, 12).fill(wood.fill).stroke({ width: 3, color: wood.line });
      this.sign.addChild(g);
    }
  }

  // Feeding -------------------------------------------------------------------

  private drop(snack: Snack, x: number, y: number): boolean {
    if (this.busy || this.done) return false;
    let monster = this.monsters.find((m) => m.covers(x, y));
    // A plain tap on a cookie feeds it too while counting along.
    const home = snack.drag!.home;
    if (!monster && this.plan.mode === 'count' && Math.hypot(x - home.x, y - home.y) < 60) monster = this.monsters[0];
    if (!monster) return false;
    const r = this.current;
    if (this.plan.mode === 'each' && monster.count('cookie') >= r.want.cookie) {
      this.mistake(monster, 'munch.had');
      return false;
    }
    if ((this.plan.mode === 'exact' || this.plan.mode === 'two') && !wantsMore(r.want, this.have(monster), snack.food)) {
      this.mistake(monster, 'munch.enough', { kind: plural(snack.food) });
      return false;
    }
    this.feed(monster, snack);
    return true;
  }

  private have(m: Monster): Order {
    return { cookie: m.count('cookie'), apple: m.count('apple') };
  }

  private feed(monster: Monster, snack: Snack) {
    const { ctx } = this;
    snack.eatenBy = monster;
    if (snack.drag) snack.drag.enabled = false;
    monster.eat(snack.food);
    const mouth = monster.mouthPoint();
    ctx.tw.kill(snack.node);
    void ctx.tw.to(snack.node, { x: mouth.x, y: mouth.y }, { duration: 0.22, ease: ease.inQuad });
    void ctx.tw.to(snack.node.scale, { x: 0.3, y: 0.3 }, { duration: 0.22 }).then(() => { snack.node.visible = false; });
    sfx.munch();
    void ctx.tw.wait(0.22).then(() => sfx.munch());
    ctx.particles.burst(mouth.x, mouth.y, { colors: [snack.food === 'apple' ? swatch.red.fill : wood.fill], count: 6, speed: [80, 180], gravity: 500, size: [0.25, 0.4] });
    const left = this.snacks.filter((s) => !s.eatenBy).length;
    switch (this.plan.mode) {
      case 'tap':
        if (left === 0) void this.roundWon('munch.burp');
        else if (ctx.rng.chance(0.5)) void ctx.say('munch.yum');
        break;
      case 'count':
        void ctx.say('count', { n: monster.eaten.length });
        if (left === 0) void this.roundWon('munch.burp', {}, 1);
        break;
      case 'each':
        monster.gape(false);
        monster.beam();
        if (this.monsters.every((m) => m.count('cookie') >= this.current.want.cookie)) void this.roundWon('munch.everyone');
        else void ctx.say('munch.thanks');
        break;
      case 'share':
        if (left === 0) void this.checkShare();
        break;
      case 'leftover':
        monster.beam();
        break;
      default:
        break;
    }
    this.drawGlow();
  }

  private mistake(monster: Monster | null, id: LineId, vars?: LineVars) {
    this.misses++;
    this.wrong++;
    monster?.refuse();
    sfx.boing();
    if (this.wrong === 2) {
      this.hints++;
      void this.ctx.say(id, vars).then(() => this.ctx.say('munch.hint'));
    } else void this.ctx.say(id, vars);
    this.drawGlow();
  }

  /** The bell: "I think that's what you asked for." */
  private ring() {
    if (this.busy || this.done || !this.bell.visible) return;
    if (this.plan.mode === 'leftover') return void this.checkLeftover();
    const r = this.current;
    const have = this.have(this.monsters[0]);
    if (complete(r.want, have)) void this.roundWon('munch.right', { food: orderWords(r.want) });
    else this.mistake(null, 'munch.need', { have: orderWords(have), food: orderWords(missing(r.want, have), true) });
  }

  // Sharing -------------------------------------------------------------------

  private async checkShare() {
    // Let the last cookie go down before judging.
    this.busy = true;
    await this.ctx.tw.wait(0.7);
    const r = this.current;
    const back = extras(this.monsters.map((m) => m.count('cookie')), r.want.cookie);
    if (back.every((n) => n === 0)) {
      this.monsters.forEach((m) => m.beam(2));
      sfx.sparkle();
      await this.ctx.say('munch.fair');
      this.showPads(r.want.cookie);
      void this.instruct('munch.each-how');
      this.busy = false;
      return;
    }
    // Monsters with too many hand their extras back to the tray.
    this.mistake(null, 'munch.unfair');
    this.monsters.forEach((m, i) => {
      for (let k = 0; k < back[i]; k++) {
        m.giveBack('cookie');
        const snack = this.snacks.filter((s) => s.eatenBy === m).at(-1)!;
        snack.eatenBy = null;
        snack.drag!.enabled = true;
        snack.node.visible = true;
        snack.node.scale.set(1);
        const mouth = m.mouthPoint();
        snack.node.position.set(mouth.x, mouth.y);
        void this.ctx.tw.wait(0.3 + k * 0.15).then(() => snack.drag!.floatHome());
      }
    });
    this.busy = false;
    this.drawGlow();
  }

  /** What the pads are asking on leftover levels: first how many each, then how many are left. */
  asking: 'each' | 'left' = 'each';

  /**
   * The bell on leftover levels: fair is everyone the same with fewer cookies left than monsters.
   * Uneven shares give the extras back; an even share with enough left for another round is a nudge to keep going.
   */
  private async checkLeftover() {
    this.busy = true;
    const r = this.current;
    const counts = this.monsters.map((m) => m.count('cookie'));
    const left = this.snacks.filter((s) => !s.eatenBy).length;
    const even = counts.every((c) => c === counts[0]);
    if (even && left < this.monsters.length) {
      this.monsters.forEach((m) => m.beam(2));
      sfx.sparkle();
      await this.ctx.say('munch.fair');
      this.asking = 'each';
      this.showPads(r.want.cookie);
      void this.instruct('munch.each-how');
      this.busy = false;
      return;
    }
    if (even) {
      this.mistake(null, 'munch.more');
      this.busy = false;
      return;
    }
    this.mistake(null, 'munch.unfair');
    const back = extras(counts, Math.min(...counts));
    this.monsters.forEach((m, i) => {
      for (let k = 0; k < back[i]; k++) {
        m.giveBack('cookie');
        const snack = this.snacks.filter((s) => s.eatenBy === m).at(-1)!;
        snack.eatenBy = null;
        snack.drag!.enabled = true;
        snack.node.visible = true;
        snack.node.scale.set(1);
        const mouth = m.mouthPoint();
        snack.node.position.set(mouth.x, mouth.y);
        void this.ctx.tw.wait(0.3 + k * 0.15).then(() => snack.drag!.floatHome());
      }
    });
    this.busy = false;
    this.drawGlow();
  }

  private showPads(answer: number) {
    this.clearPads();
    for (const value of numberChoices(answer, this.ctx.rng)) {
      const node = new Container();
      node.addChild(
        new Graphics().circle(0, 6, 62).fill({ color: swatch.blue.line, alpha: 0.25 }).circle(0, 0, 62).fill(swatch.white.fill).stroke({ width: 7, color: swatch.blue.fill }),
        label(String(value), 64, swatch.blue.line),
      );
      onTap(node, () => this.pick(value, answer), { radius: 70 });
      node.scale.set(0);
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, delay: this.pads.length * 0.08, ease: ease.outBack });
      this.pads.push({ value, node });
      this.ctx.stage.addChild(node);
    }
    this.wrong = 0;
    this.resize(this.view);
  }

  private clearPads() {
    for (const p of this.pads) {
      this.ctx.tw.kill(p.node.scale);
      p.node.destroy({ children: true });
    }
    this.pads.length = 0;
  }

  private pick(value: number, answer: number) {
    if (this.busy || this.done) return;
    if (value !== answer) {
      this.mistake(null, 'munch.each-no');
      return;
    }
    sfx.bell(5 + answer, 0.3);
    if (this.plan.mode === 'leftover' && this.asking === 'each') {
      // Then the leftovers: they go to the pet, who has been waiting patiently.
      this.asking = 'left';
      void this.ctx.say('munch.each-yes', { n: answer });
      const left = this.current.left!;
      this.showPads(left);
      void this.instruct('munch.left-how');
      return;
    }
    if (this.plan.mode === 'leftover') {
      this.ctx.pet.cheer();
      void this.roundWon('munch.left-yes', { n: answer });
      return;
    }
    void this.roundWon('munch.each-yes', { n: answer });
  }

  // Rounds --------------------------------------------------------------------

  private async roundWon(id: LineId, vars: LineVars = {}, delay = 0.5) {
    this.busy = true;
    this.wrong = 0;
    this.glow.clear();
    await this.ctx.tw.wait(delay);
    this.monsters.forEach((m, i) => void this.ctx.tw.wait(i * 0.25).then(() => m.burp()));
    sfx.burp();
    this.ctx.pet.cheer();
    await this.ctx.say(id, vars);
    await this.ctx.tw.wait(0.6);
    this.round++;
    if (this.round < this.rounds.length) {
      this.deal();
      return;
    }
    this.done = true;
    void this.ctx.say('munch.done');
    await this.ctx.tw.wait(1);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Layout --------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    const rows = this.snacks.length > 7 ? 2 : 1;
    const trayTop = v.h - (rows === 2 ? 235 : 165);
    const sea = v.h * 0.36;
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.blue.light)
      .rect(0, sea, v.w, v.h - sea)
      .fill(swatch.teal.fill)
      .rect(0, sea + 50, v.w, v.h - sea - 50)
      .fill(swatch.yellow.light);
    for (let x = 0; x < v.w + 60; x += 60) this.background.circle(x, sea + 50, 31).fill(swatch.yellow.light);
    for (const [cx, cy, r] of [[v.w * 0.55, 95, 1], [v.w * 0.82, 210, 0.7]]) {
      puffs(this.background, [[-46 * r, 8 * r, 34 * r], [0, -12 * r, 46 * r], [46 * r, 8 * r, 34 * r]].map(([x, y, rr]) => [cx + x, cy + y, rr] as [number, number, number]), swatch.white.fill, swatch.white.fill, 0);
    }
    this.tray.clear().roundRect(160, trayTop, v.w - 190, v.h - trayTop - 15, 32).fill({ color: wood.light, alpha: 0.85 }).stroke({ width: 5, color: wood.fill });

    const n = this.monsters.length;
    const scale = n === 1 ? 0.95 : n === 2 ? 0.75 : 0.66;
    const xs = n === 1 ? [v.w * 0.62] : spread(n, 230, v.w - 50, n === 2 ? 340 : 290);
    this.monsters.forEach((m, i) => {
      m.scale.set(scale);
      m.position.set(xs[i], trayTop - 25);
    });

    const perRow = Math.ceil(this.snacks.length / rows);
    this.snacks.forEach((s, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, this.snacks.length - row * perRow);
      const x = spread(inRow, 180, v.w - 50, 125)[i % perRow];
      const y = rows === 2 ? trayTop + 62 + row * 100 : v.h - 90;
      if (s.drag) s.drag.home = { x, y };
      if (!s.eatenBy && !s.drag?.dragging) {
        this.ctx.tw.kill(s.node);
        s.node.position.set(x, y);
      }
    });

    this.sign.position.set(Math.max(230, v.w * 0.26), Math.min(240, trayTop - 220));
    this.bell.position.set(v.w - 85, 110);
    const px = spread(this.pads.length, v.w / 2 - 230, v.w / 2 + 230, 160);
    this.pads.forEach((p, i) => p.node.position.set(px[i], 170));
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done) return;
    const ring = (x: number, y: number, r: number) => g.circle(x, y, r).stroke({ width: 8, color: swatch.yellow.line });
    const r = this.current;
    if (this.pads.length) {
      const want = this.plan.mode === 'leftover' && this.asking === 'left' ? r.left : r.want.cookie;
      const p = this.pads.find((p) => p.value === want);
      if (p) ring(p.node.x, p.node.y, 76);
      return;
    }
    if (this.plan.mode === 'leftover' && this.monsters.every((m) => m.count('cookie') >= r.want.cookie)) {
      ring(this.bell.x, this.bell.y, 74);
      return;
    }
    if (this.plan.mode === 'exact' || this.plan.mode === 'two') {
      const need = missing(r.want, this.have(this.monsters[0]));
      if (need.cookie + need.apple === 0) ring(this.bell.x, this.bell.y, 74);
      else {
        const s = this.snacks.find((s) => !s.eatenBy && need[s.food] > 0);
        if (s?.drag) ring(s.drag.home.x, s.drag.home.y, 62);
      }
      return;
    }
    // Each and share: glow the monsters who still need cookies.
    for (const m of this.monsters.filter((m) => m.count('cookie') < r.want.cookie)) {
      const p = m.mouthPoint();
      ring(p.x, p.y + 30 * m.scale.y, 150 * m.scale.x);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.monsters.forEach((m) => m.update(dt));
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
  }

  /** The ghost finger: tap or carry the foods the sign asks for, ring the bell, and tap the number that is right. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.done || !this.monsters.length) return null;
    // Wait for the foods and the answer pads to finish popping in.
    if (this.snacks.some((s) => !s.eatenBy && s.node.scale.x < 0.95) || this.pads.some((p) => p.node.scale.x < 0.95)) return null;
    const r = this.current;
    const move = munchTouch(this.plan, {
      want: r.want,
      left: r.left,
      snacks: this.snacks.map((s) => ({ food: s.food, eaten: !!s.eatenBy })),
      fed: this.monsters.map((m) => this.have(m)),
      pads: this.pads.map((p) => p.value),
      asking: this.asking,
    });
    if (!move) return null;
    if (move === 'bell') return { tap: { on: this.bell } };
    if ('pad' in move) return { tap: { on: this.pads.find((p) => p.value === move.pad)!.node } };
    if ('tap' in move) return { tap: { on: this.snacks[move.tap].node }, pause: 0.25 };
    // Dropped on the monster's mouth, which is well inside the area that counts.
    return { drag: { on: this.snacks[move.give].node }, to: { on: this.monsters[move.to], x: 0, y: MOUTH_Y }, pause: 0.2 };
  }

  destroy() {
    this.snacks.forEach((s) => s.drag?.destroy());
  }
}

/** The map icon: a small hungry monster beside a cookie. */
class MunchIcon extends Container implements HubIcon {
  private readonly monster = new Monster('green');
  constructor() {
    super();
    this.monster.showTummy = false;
    this.monster.refresh();
    this.monster.gape(true);
    this.monster.scale.set(0.45);
    const cookie = foodArt('cookie');
    cookie.scale.set(0.6);
    cookie.position.set(85, -30);
    this.addChild(this.monster, cookie);
  }
  update(dt: number) {
    this.monster.update(dt);
  }
}

export const monsterMunch: GameModule = {
  id: 'monster-munch',
  name: 'Monster Munch',
  titleLine: 'game.monster-munch',
  region: 'counting-cove',
  skills: ['counting', 'one-to-one', 'sharing'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => (b === 'school' ? { min: 6, max: 8 } : b === 'prek' ? { min: 5, max: 7 } : b === 'preschool' ? { min: 4, max: 6 } : b === 'toddler' ? { min: 2, max: 4 } : { min: 1, max: 2 }),
  describeLevel: (l) => munchPlan(l).name,
  music: STYLES.bubbles,
  coplayHint: 'Count each cookie out loud with {name} as the monster munches.',
  offScreen: 'At snack time, share crackers between two plates so each has the same, and count them together.',
  hubIcon: () => new MunchIcon(),
  touchDemo: true,
  sticker: (seed) => monsterSticker(seed),
  create: (ctx) => new MonsterMunch(ctx),
};
