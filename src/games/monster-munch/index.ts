import { Circle, Container, Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { symbol } from '../shared';
import type { Game, GameContext, GameModule, HubIcon, TouchIntent } from '../types';
import { drawPlace, FOOD_TINT, foodArt, Monster, monsterLooks, monsterSticker, MOUTH_Y, MUNCH_PLACES, type MunchPlace } from './art';
import { canCallFriend, friendsReady, munchAnswer, shareReturns, complete, extras, foodWord, FOODS, isTapMode, missing, munchHint, munchPlan, munchRounds, munchTouch, noFood, numberChoices, orderWords, wantsMore, type Food, type MunchQuestion, type MunchPlan, type MunchRound, type MunchTable, type Order } from './logic';

interface Snack {
  food: Food;
  node: Container;
  drag: DragHandle | null;
  eatenBy: Monster | null;
}


const LEVELS: BandLevels = {
  // Big bites (9) opens the lap band, One of each (10) sits between 3 and 4 at toddler.
  lap: { min: 1, max: 9, order: [9, 1, 2] },
  toddler: { min: 2, max: 10, order: [2, 3, 10, 4] },
  preschool: { min: 4, max: 6 },
  prek: { min: 5, max: 7 },
  school: { min: 6, max: 12, order: [6, 7, 12, 8, 11] },
};

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
  readonly cave: RoundButton;
  private view: View;
  private clock = 0;
  private looks: ReturnType<typeof monsterLooks> = [];
  /** Where this visit's feast happens. */
  private readonly place: MunchPlace;
  /** Big bites show cookies at this scale. */
  private get foodScale() {
    return this.plan.mode === 'big' ? 1.4 : 1;
  }

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = munchPlan(ctx.level);
    this.rounds = munchRounds(this.plan, ctx.rng);
    this.place = ctx.rng.pick(MUNCH_PLACES);
    this.bell = new RoundButton(symbol('bell', 0, 34), swatch.yellow, 56, () => this.ring());
    this.bell.visible = this.plan.mode === 'exact' || this.plan.mode === 'two' || this.plan.mode === 'leftover' || this.plan.mode === 'friends';
    const door = new Graphics().roundRect(-40, -45, 80, 95, 38).fill(wood.line)
      .circle(0, -10, 18).fill(swatch.green.fill).circle(-6, -14, 3).fill(wood.line).circle(6, -14, 3).fill(wood.line);
    this.cave = new RoundButton(door, swatch.purple, 60, () => this.callFriend());
    this.cave.visible = this.plan.mode === 'friends';
    ctx.stage.addChild(this.background, this.tray, this.sign, this.bell, this.cave, this.glow);
  }

  get current() {
    return this.rounds[this.round];
  }

  /** The food counted or shared this round. */
  get kind(): Food {
    return this.current.kinds[0];
  }

  /** Speech slot values for this round's food: "cookies", "berries". */
  private get kindVars(): LineVars {
    return { kind: foodWord(this.kind, 2) };
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
    this.asking = 'each';
    this.clear();
    const looks = this.looks = monsterLooks(r.monsters, ctx.rng);
    for (let i = 0; i < (this.plan.mode === 'friends' ? 1 : r.monsters); i++) this.addMonster(looks[i], i * 0.15);
    const foods: Food[] = ctx.rng.shuffle(r.kinds.flatMap((f) => Array<Food>(r.tray[f]).fill(f)));
    const big = this.plan.mode === 'big';
    foods.forEach((food, i) => {
      const node = foodArt(food);
      node.hitArea = new Circle(0, 0, big ? 80 : 55);
      const snack: Snack = { food, node, drag: null, eatenBy: null };
      if (isTapMode(this.plan.mode)) {
        onTap(node, () => !snack.eatenBy && !this.done && this.feed(this.monsters[0], snack));
      } else {
        snack.drag = draggable(node, ctx.tw, {
          onPick: () => sfx.tick(),
          onDrop: (x, y) => this.drop(snack, x, y),
        });
      }
      node.scale.set(0);
      void ctx.tw.to(node.scale, { x: this.foodScale, y: this.foodScale }, { duration: 0.35, delay: 0.3 + i * 0.06, ease: ease.outBack });
      this.snacks.push(snack);
      ctx.stage.addChild(node);
    });
    this.drawSign(r.want);
    this.resize(this.view);
    switch (this.plan.mode) {
      case 'tap': void this.instruct('munch.tap'); break;
      case 'big': void this.instruct('munch.big'); break;
      case 'eachkind': void this.instruct('munch.each-kind'); break;
      case 'count': void this.instruct('munch.count'); break;
      case 'each': void this.instruct('munch.each'); break;
      case 'friends': void this.instruct('munch.friends', { n: r.want[this.kind] }); break;
      case 'sharekind': void this.instruct('munch.share-kinds'); break;
      case 'share': void this.instruct('munch.share', this.kindVars); break;
      case 'leftover': void this.instruct('munch.leftover', this.kindVars); break;
      default: void this.instruct('munch.want', { food: orderWords(r.want) });
    }
    this.busy = false;
  }

  private addMonster(look = monsterLooks(1, this.ctx.rng)[0], delay = 0) {
    const m = new Monster(look);
    m.showTummy = !isTapMode(this.plan.mode);
    m.grows = this.plan.mode === 'big';
    m.refresh();
    m.gape(true);
    m.alpha = 0;
    void this.ctx.tw.to(m, { alpha: 1 }, { duration: 0.4, delay });
    onTap(m, () => {
      // At the tapping level the big friendly monster is the easiest thing to reach, so tapping it feeds it too.
      const next = isTapMode(this.plan.mode) && !this.busy && !this.done ? this.snacks.find((s) => !s.eatenBy) : undefined;
      if (next) this.feed(m, next);
      else { m.beam(0.6); sfx.giggle(); }
    });
    m.hitArea = new Circle(0, -150, 140);
    this.monsters.push(m);
    this.ctx.stage.addChildAt(m, this.ctx.stage.getChildIndex(this.tray) + 1);
  }

  /** A call reserves a whole share. An insufficient call is a free, reversible experiment. */
  private async callFriend() {
    if (this.busy || this.done || this.pads.length || !this.cave.visible) return;
    this.busy = true;
    if (canCallFriend(this.table())) {
      this.addMonster(this.looks[this.monsters.length]);
      this.resize(this.view);
      await this.ctx.say('munch.friend-hi');
    } else {
      const visitor = new Monster(monsterLooks(1, this.ctx.rng)[0]);
      visitor.showTummy = false;
      visitor.refresh();
      visitor.gape(true);
      visitor.scale.set(0.38);
      visitor.position.set(this.cave.x, this.cave.y - 65);
      this.ctx.stage.addChild(visitor);
      await this.ctx.say('munch.not-enough');
      await this.ctx.tw.to(visitor, { alpha: 0 }, { duration: 0.35 });
      visitor.destroy({ children: true });
    }
    this.busy = false;
    this.drawGlow();
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
    this.sign.visible = !this.pads.length && (this.plan.mode === 'exact' || this.plan.mode === 'two' || this.plan.mode === 'friends');
    if (!this.sign.visible) return;
    const board = new Graphics()
      .roundRect(-12, 60, 24, 90, 6)
      .fill(wood.fill)
      .stroke({ width: 5, color: wood.line })
      .roundRect(-140, -80, 280, 160, 22)
      .fill(wood.light)
      .stroke({ width: 7, color: wood.line });
    this.sign.addChild(board);
    // In FOODS order, as orderWords says them.
    const items: [number, Food][] = FOODS.filter((f) => want[f] > 0).map((f) => [want[f], f]);
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
    if (this.plan.mode === 'friends') {
      const each = label('each', 30, wood.line);
      each.position.set(0, -108);
      this.sign.addChild(each);
    }
    if (this.plan.dots) {
      const g = new Graphics();
      const n = want[this.kind];
      for (let i = 0; i < n; i++) g.circle((i - (n - 1) / 2) * 34, 46, 12).fill(wood.fill).stroke({ width: 3, color: wood.line });
      this.sign.addChild(g);
    }
  }

  // Feeding -------------------------------------------------------------------

  private drop(snack: Snack, x: number, y: number): boolean {
    if (this.busy || this.done) return false;
    const targets = this.monsters.filter((m) => m.covers(x, y));
    if (this.plan.mode === 'friends') targets.sort((a, b) => Math.hypot(a.mouthPoint().x - x, a.mouthPoint().y - y) - Math.hypot(b.mouthPoint().x - x, b.mouthPoint().y - y));
    let monster = targets[0];
    // A plain tap on a cookie feeds it too while counting along.
    const home = snack.drag!.home;
    if (!monster && this.plan.mode === 'count' && Math.hypot(x - home.x, y - home.y) < 60) monster = this.monsters[0];
    if (!monster) {
      // Dropped short: not a miss, but the nearest monster leans towards it, wondering.
      const near = this.monsters.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
      near.lean(x);
      void this.ctx.say('munch.hm');
      return false;
    }
    const r = this.current;
    if (this.plan.mode === 'each' && monster.count(this.kind) >= r.want[this.kind]) {
      this.mistake(monster, 'munch.had');
      return false;
    }
    if (this.plan.mode === 'eachkind' && !wantsMore(r.want, this.have(monster), snack.food)) {
      this.mistake(monster, 'munch.had-food');
      return false;
    }
    if (this.plan.mode === 'friends' && !wantsMore(r.want, this.have(monster), snack.food)) {
      this.mistake(monster, 'munch.enough', { kind: foodWord(snack.food, 2) });
      return false;
    }
    if ((this.plan.mode === 'exact' || this.plan.mode === 'two') && !wantsMore(r.want, this.have(monster), snack.food)) {
      this.mistake(monster, 'munch.enough', { kind: foodWord(snack.food, 2) });
      return false;
    }
    this.feed(monster, snack);
    return true;
  }

  private have(m: Monster): Order {
    const o = noFood();
    for (const f of FOODS) o[f] = m.count(f);
    return o;
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
    ctx.particles.burst(mouth.x, mouth.y, { colors: [FOOD_TINT[snack.food]], count: 6, speed: [80, 180], gravity: 500, size: [0.25, 0.4] });
    const left = this.snacks.filter((s) => !s.eatenBy).length;
    switch (this.plan.mode) {
      case 'tap':
      case 'big':
      case 'count':
        void ctx.say('count', { n: monster.eaten.length });
        if (left === 0) void this.roundWon('munch.burp', {}, 1);
        break;
      case 'each':
      case 'eachkind':
        monster.gape(false);
        monster.beam();
        if (this.monsters.every((m) => complete(this.current.want, this.have(m)))) void this.roundWon('munch.everyone');
        else void ctx.say('munch.thanks');
        break;
      case 'sharekind':
      case 'share':
        if (left === 0) void this.checkShare();
        break;
      case 'friends':
      case 'leftover':
        monster.beam();
        break;
      default: {
        // Exact and two: count each food of its kind, so the last number said is how many.
        const n = monster.count(snack.food);
        void ctx.say('munch.bite', { food: orderWords({ ...noFood(), [snack.food]: n }) });
        break;
      }
    }
    this.drawGlow();
  }

  /** A boing and a line; the second in a round adds the glow and a line naming what glows. Resolves when the speech ends. */
  private mistake(monster: Monster | null, id: LineId, vars?: LineVars): Promise<void> {
    this.misses++;
    this.wrong++;
    monster?.refuse();
    sfx.boing();
    let said = this.ctx.say(id, vars);
    if (this.wrong === 2) {
      this.hints++;
      const hint = munchHint(this.plan, this.table());
      if (hint) said = said.then(() => this.ctx.say(`munch.hint.${hint}`));
    }
    this.drawGlow();
    return said;
  }

  /** The bell: "I think that's what you asked for." */
  private ring() {
    if (this.busy || this.done || !this.bell.visible) return;
    if (this.pads.length) return;
    if (this.plan.mode === 'friends') return void this.checkFriends();
    if (this.plan.mode === 'leftover') return void this.checkLeftover();
    const r = this.current;
    const have = this.have(this.monsters[0]);
    if (complete(r.want, have)) void this.roundWon('munch.right', { food: orderWords(r.want) });
    else this.mistake(null, 'munch.need', { have: orderWords(have), food: orderWords(missing(r.want, have), true) });
  }

  // Sharing -------------------------------------------------------------------

  private async checkShare() {
    // Let the last bite go down before judging.
    this.busy = true;
    await this.ctx.tw.wait(0.7);
    const r = this.current;
    const back = shareReturns(r.want, this.monsters.map((m) => this.have(m)));
    if (back.every((o) => FOODS.every((f) => o[f] === 0))) {
      this.monsters.forEach((m) => m.beam(2));
      sfx.sparkle();
      await this.ctx.say('munch.fair');
      this.asking = 'each';
      this.showPads(r.want[this.kind]);
      void this.instruct('munch.each-how', this.kindVars);
      this.busy = false;
      return;
    }
    this.mistake(null, this.plan.mode === 'sharekind' ? 'munch.unfair-kinds' : 'munch.unfair', this.kindVars);
    for (const [i, m] of this.monsters.entries()) {
      for (const f of FOODS) this.returnFood(m, f, back[i][f]);
    }
    this.busy = false;
    this.drawGlow();
  }

  private returnFood(m: Monster, food: Food, n: number) {
    for (let k = 0; k < n; k++) {
      m.giveBack(food);
      const snack = this.snacks.filter((s) => s.eatenBy === m && s.food === food).at(-1)!;
      snack.eatenBy = null;
      snack.drag!.enabled = true;
      snack.node.visible = true;
      snack.node.scale.set(1);
      const mouth = m.mouthPoint();
      snack.node.position.set(mouth.x, mouth.y);
      void this.ctx.tw.wait(0.3 + k * 0.15).then(() => snack.drag!.floatHome());
    }
  }

  private async checkFriends() {
    this.busy = true;
    if (!friendsReady(this.table())) {
      await this.mistake(null, 'munch.friends-more', { n: this.current.want[this.kind] });
      this.busy = false;
      return;
    }
    this.monsters.forEach((m) => m.beam(2));
    sfx.sparkle();
    this.asking = 'friends';
    this.showPads(this.monsters.length);
    void this.instruct('munch.friends-how');
    this.busy = false;
  }

  /** What the pads are asking on leftover levels: first how many each, then how many are left. */
  asking: MunchQuestion = 'each';

  /**
   * The bell on leftover levels: fair is everyone the same with fewer foods left than monsters.
   * Uneven shares give the extras back; an even share with enough left for another round is a nudge to keep going.
   */
  private async checkLeftover() {
    this.busy = true;
    const r = this.current;
    const counts = this.monsters.map((m) => m.count(this.kind));
    const left = this.snacks.filter((s) => !s.eatenBy).length;
    const even = counts.every((c) => c === counts[0]);
    if (even && left < this.monsters.length) {
      this.monsters.forEach((m) => m.beam(2));
      sfx.sparkle();
      await this.ctx.say('munch.fair');
      this.asking = 'each';
      this.showPads(r.want[this.kind]);
      void this.instruct('munch.each-how', this.kindVars);
      this.busy = false;
      return;
    }
    if (even) {
      this.mistake(null, 'munch.more', this.kindVars);
      this.busy = false;
      return;
    }
    this.mistake(null, 'munch.unfair', this.kindVars);
    const back = extras(counts, Math.min(...counts));
    this.monsters.forEach((m, i) => {
      for (let k = 0; k < back[i]; k++) {
        m.giveBack(this.kind);
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
    this.sign.visible = false;
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
      const left = this.asking === 'left';
      const id = this.asking === 'friends' ? 'munch.friends-no' : left ? 'munch.left-no' : 'munch.each-no';
      void this.countAlong(this.mistake(null, id, this.questionVars), left);
      return;
    }
    sfx.bell(5 + answer, 0.3);
    if (this.plan.mode === 'sharekind' && this.asking === 'each') {
      this.asking = 'second';
      this.showPads(this.current.want[this.current.kinds[1]]);
      void this.instruct('munch.each-how', this.questionVars);
      return;
    }
    if ((this.plan.mode === 'leftover' || this.plan.mode === 'friends') && this.asking !== 'left') {
      // Then count the food still visible on the tray.
      this.asking = 'left';
      void this.ctx.say(this.plan.mode === 'friends' ? 'munch.friends-yes' : 'munch.each-yes', { n: answer });
      const left = this.current.left!;
      this.showPads(left);
      void this.instruct('munch.left-how', this.kindVars);
      return;
    }
    if (this.plan.mode === 'friends') {
      void this.roundWon('munch.friends-left-yes', { n: answer });
      return;
    }
    if (this.plan.mode === 'leftover') {
      this.ctx.pet.cheer();
      void this.roundWon('munch.left-yes', { n: answer });
      return;
    }
    void this.roundWon('munch.each-yes', { n: answer });
  }

  /**
   * After a wrong number: count one monster's tummy together, each icon ringed as it is said (or, for the leftovers, the
   * foods still on the tray), then she tries again.
   */
  private async countAlong(said: Promise<void>, leftovers: boolean) {
    this.busy = true;
    await said;
    if (leftovers) {
      const waiting = this.snacks.filter((s) => !s.eatenBy);
      if (!waiting.length) await this.ctx.say('count', { n: 0 });
      for (let i = 0; i < waiting.length; i++) {
        const node = waiting[i].node;
        void this.ctx.tw.to(node.scale, { x: 1.25, y: 1.25 }, { duration: 0.15 }).then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 }));
        await this.ctx.say('count', { n: i + 1 });
      }
    } else if (this.asking === 'friends') {
      for (const [i, m] of this.monsters.entries()) {
        m.beam(1);
        await this.ctx.say('count', { n: i + 1 });
      }
    } else {
      const m = this.monsters[0];
      const food = this.current.kinds[this.asking === 'second' ? 1 : 0];
      const indices = m.eaten.flatMap((f, i) => f === food ? [i] : []);
      for (const [i, index] of indices.entries()) {
        m.light(index);
        await this.ctx.say('count', { n: i + 1 });
      }
      m.light(-1);
    }
    this.busy = false;
  }

  private get questionVars(): LineVars {
    return { kind: foodWord(this.current.kinds[this.asking === 'second' ? 1 : 0], 2) };
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
    drawPlace(this.background, this.place, v.w, v.h);
    this.tray.clear().roundRect(160, trayTop, v.w - 190, v.h - trayTop - 15, 32).fill({ color: wood.light, alpha: 0.85 }).stroke({ width: 5, color: wood.fill });

    const n = this.monsters.length;
    const friends = this.plan.mode === 'friends';
    const scale = friends ? 0.52 : n === 1 ? 0.95 : n === 2 ? 0.75 : 0.66;
    const xs = friends ? spread(4, 245, v.w - 30, 200) : n === 1 ? [v.w * 0.62] : spread(n, 230, v.w - 50, n === 2 ? 340 : 290);
    this.monsters.forEach((m, i) => {
      m.scale.set(scale);
      m.position.set(xs[i], trayTop - 25);
    });

    const perRow = Math.ceil(this.snacks.length / rows);
    this.snacks.forEach((s, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, this.snacks.length - row * perRow);
      const x = spread(inRow, 180, v.w - 50, this.plan.mode === 'big' ? 170 : 125)[i % perRow];
      const y = rows === 2 ? trayTop + 62 + row * 100 : v.h - 90;
      if (s.drag) s.drag.home = { x, y };
      if (!s.eatenBy && !s.drag?.dragging) {
        this.ctx.tw.kill(s.node);
        s.node.position.set(x, y);
      }
    });

    this.sign.position.set(Math.max(230, v.w * 0.26), Math.min(240, trayTop - 220));
    this.bell.position.set(v.w - 85, 110);
    this.cave.position.set(155, trayTop - 170);
    const px = spread(this.pads.length, v.w / 2 - 230, v.w / 2 + 230, 160);
    this.pads.forEach((p, i) => p.node.position.set(px[i], 170));
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done) return;
    const ring = (x: number, y: number, r: number) => g.circle(x, y, r).stroke({ width: 8, color: swatch.yellow.line });
    const r = this.current;
    switch (munchHint(this.plan, this.table())) {
      case 'pad': {
        const want = munchAnswer(this.table());
        const p = this.pads.find((p) => p.value === want);
        if (p) ring(p.node.x, p.node.y, 76);
        return;
      }
      case 'call':
        ring(this.cave.x, this.cave.y, 76);
        return;
      case 'bell':
        ring(this.bell.x, this.bell.y, 74);
        return;
      case 'food': {
        const need = missing(r.want, this.have(this.monsters[0]));
        const s = this.snacks.find((s) => !s.eatenBy && need[s.food] > 0);
        if (s?.drag) ring(s.drag.home.x, s.drag.home.y, 62);
        return;
      }
      case 'monster':
        // The monsters who still need some.
        for (const m of this.monsters.filter((m) => !complete(r.want, this.have(m)))) {
          const p = m.mouthPoint();
          ring(p.x, p.y + 30 * m.scale.y, 150 * m.scale.x);
        }
        return;
    }
  }

  /** The table as the rules see it, for the ghost finger and the glow. */
  private table(): MunchTable {
    const r = this.current;
    return {
      want: r.want,
      kinds: r.kinds,
      left: r.left,
      snacks: this.snacks.map((s) => ({ food: s.food, eaten: !!s.eatenBy })),
      fed: this.monsters.map((m) => this.have(m)),
      pads: this.pads.map((p) => p.value),
      asking: this.asking,
    };
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
    const move = munchTouch(this.plan, this.table());
    if (!move) return null;
    if (move === 'call') return { tap: { on: this.cave } };
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
  levels: (b) => rangeFor(LEVELS, b),
  entryLevels: [9, 10],
  describeLevel: (l) => munchPlan(l).name,
  music: STYLES.bubbles,
  coplayHint: 'Count each bite out loud with {name} as the monster munches.',
  offScreen: 'At snack time, share crackers between two plates so each has the same, and count them together.',
  hubIcon: () => new MunchIcon(),
  touchDemo: true,
  sticker: (seed) => monsterSticker(seed),
  create: (ctx) => new MonsterMunch(ctx),
};
