import { Circle, Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { coinArt } from '../market-stall';
import { boardArt, bulbArt, cupArt, eventIcon, forecastIcon, miniStand, pitcherArt } from './art';
import {
  affordable, BATCHES, batchCost, helps, insight, makeWeek, planFor, priceChoice, rating, sellDay, settle, START_PURSE, WEATHER_WORD,
  type Day, type Help, type Insight, type Row, type StandPlan,
} from './logic';

const LEVELS: BandLevels = {
  school: { min: 1, max: 4 },
};

const ROW_H = 100;
const HEAD_H = 84;
/** The first table column (the day and its weather), then one narrow column per number. */
const DAY_W = 84;
const COL_W = 56;
const CARD_W = 120;
/** The cups on the counter are drawn at 0.8 so twelve fit in two rows under the awning. */
const CUP_SCALE = 0.8;
const FRIENDS = (Object.keys(CRITTERS) as CritterName[]).filter((n) => n !== 'pip');
const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

type Cell = 'made' | 'sold' | 'left' | 'shells';

/** Where everything sits for the current view; recomputed on every resize. */
interface Metrics {
  panelX: number;
  panelW: number;
  cx: number;
  top: number;
  counterY: number;
  ground: number;
  cardsY: number;
  priceY: number;
}

class LemonadeStand implements Game {
  readonly plan: StandPlan;
  readonly week: Day[];
  readonly rows: Row[] = [];
  readonly cards: { n: number; node: Container; box: Graphics }[] = [];
  readonly coins: { value: number; node: Container; ring: Graphics }[] = [];
  readonly tableRows: { row: Row; node: Container }[] = [];
  readonly open: RoundButton;
  readonly help: RoundButton;
  /** The shells in the purse as shown now (purse level). */
  purse = START_PURSE;
  index = -1;
  made: number | null = null;
  price: number | null = null;
  /** Shells the ferry captain gives at the start of the next day (purse level). */
  restock = 0;
  misses = 0;
  /** Days on which she asked for help. */
  hints = 0;
  busy = true;
  finished = false;

  private view: View;
  private clock = 0;
  private readonly backdrop: Backdrop;
  private readonly wash = new Graphics();
  private readonly blanket = new Container();
  private readonly standArt = new Graphics();
  private readonly signText: Text;
  private readonly tray = new Container();
  private readonly crowd = new Container();
  private readonly soldOut = new Container();
  private readonly tally = new Container();
  private readonly tallyCups: Text;
  private readonly tallyShells: Text | null;
  private readonly banner = new Container();
  private readonly bannerBox = new Graphics();
  private readonly dayText: Text;
  private readonly weatherSlot = new Container();
  private readonly eventSlot = new Container();
  private readonly purseChip = new Container();
  private readonly purseText: Text;
  private readonly table = new Container();
  private readonly tableBox = new Graphics();
  private readonly tableBody = new Container();
  private readonly glow = new Graphics();
  private readonly picnic: Critter[] = [];
  private readonly trayCups: Container[] = [];
  private readonly friends = new Set<Critter>();
  private m: Metrics;
  private dayCoins = 0;
  private helpAt = 0;
  private helpedToday = false;
  private lit: number[] = [];
  private litUntil = 0;
  private reading = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.week = makeWeek(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 2, sun: false, seed: 91 }, ctx.view);
    this.wash.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.crowd.eventMode = 'none';
    this.tray.eventMode = 'none';
    this.soldOut.eventMode = 'none';
    this.tally.eventMode = 'none';
    this.blanket.eventMode = 'none';
    this.standArt.eventMode = 'none';
    this.banner.eventMode = 'none';

    this.signText = label('LEMONADE', 30, ink);
    this.signText.eventMode = 'none';

    // The "SOLD OUT" sign hangs on the counter once the cups have run out.
    const board = boardArt(190, 64);
    const soText = label('SOLD OUT', 32, swatch.red.line);
    this.soldOut.addChild(board, soText);
    this.soldOut.visible = false;

    // What has happened today, big enough to read from the other side of the room: cups sold, and shells earned.
    const chip = (y: number, icon: Container) => {
      const c = new Container();
      c.position.set(0, y);
      icon.position.set(-34, 0);
      c.addChild(boardArt(124, 56), icon);
      this.tally.addChild(c);
      const t = label('0', 40, ink);
      t.position.set(24, 0);
      c.addChild(t);
      return t;
    };
    const twoChips = priceChoice(this.plan);
    const cupIcon = cupArt();
    cupIcon.scale.set(0.7);
    this.tallyCups = chip(twoChips ? -32 : 0, cupIcon);
    if (twoChips) {
      const coin = coinArt(1);
      coin.scale.set(0.55);
      this.tallyShells = chip(32, coin);
    } else this.tallyShells = null;
    this.tally.visible = false;

    // The banner: the day, the weather, the event and (on the purse level) the purse.
    this.dayText = label('', 26, ink);
    this.banner.addChild(this.bannerBox, this.dayText, this.weatherSlot, this.eventSlot);
    this.purseText = label(String(START_PURSE), 40, ink);
    if (this.plan.purse) {
      const pouch = new Graphics();
      pouch.ellipse(0, 6, 24, 22).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 4));
      pouch.poly([-10, -12, 10, -12, 6, -22, -6, -22]).fill(swatch.brown.light).stroke(line(swatch.brown.line, 3));
      const shell = coinArt(1);
      shell.scale.set(0.42);
      shell.position.set(0, 8);
      this.purseChip.addChild(pouch, shell, this.purseText);
      this.banner.addChild(this.purseChip);
    }

    // The table of days.
    this.table.addChild(this.tableBox, this.tableBody);
    this.drawHeader();

    // The friends having a picnic share what is left.
    const rug = new Graphics();
    rug.poly([-70, -6, 70, -6, 92, 30, -92, 30]).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) rug.poly([-60 + i * 24 - j * 4, -2 + j * 16, -38 + i * 24 - j * 4, -2 + j * 16, -38 + i * 24 - j * 8, 14 + j * 16, -60 + i * 24 - j * 8, 14 + j * 16]).fill({ color: 0xffffff, alpha: 0.8 });
    this.blanket.addChild(rug);
    for (const [name, x] of [['bear', -34], ['bunny', 34]] as [CritterName, number][]) {
      const c = new Critter(CRITTERS[name]);
      c.scale.set(0.3);
      c.position.set(x * 0.9, 8);
      ctx.track(c);
      this.picnic.push(c);
      this.blanket.addChild(c);
    }

    // Batches of cups.
    for (const n of BATCHES) {
      const node = new Container();
      const box = new Graphics();
      node.addChild(box);
      const rows = Math.ceil(n / 4);
      const cup = (i: number) => {
        const c = cupArt();
        c.scale.set(0.5);
        c.position.set(((i % 4) - 1.5) * 25, (this.plan.purse ? -22 : -14) + (Math.floor(i / 4) - (rows - 1) / 2) * 25);
        return c;
      };
      for (let i = 0; i < n; i++) node.addChild(cup(i));
      const num = label(String(n), 36, ink);
      num.position.set(0, this.plan.purse ? 36 : 44);
      node.addChild(num);
      if (this.plan.purse) {
        const coin = coinArt(1);
        coin.scale.set(0.4);
        coin.position.set(-18, 66);
        const cost = label(String(batchCost(n)), 26, ink);
        cost.position.set(10, 66);
        node.addChild(coin, cost);
      }
      node.hitArea = new Rectangle(-CARD_W / 2 - 6, -this.cardH() / 2 - 6, CARD_W + 12, this.cardH() + 12);
      onTap(node, () => this.pickBatch(n), { cooldown: 140 });
      this.cards.push({ n, node, box });
    }
    this.drawCards();

    // Prices, when she gets to choose one.
    if (priceChoice(this.plan)) {
      for (const value of this.plan.prices) {
        const node = new Container();
        const ring = new Graphics();
        const art = coinArt(value);
        art.scale.set(1.5);
        node.addChild(ring, art);
        node.hitArea = new Circle(0, 0, 66);
        onTap(node, () => this.pickPrice(value), { cooldown: 140 });
        this.coins.push({ value, node, ring });
      }
    }

    const openArt = new Container();
    openArt.addChild(label('OPEN', 30, ink));
    this.open = new RoundButton(openArt, swatch.green, 56, () => void this.openStand());
    this.help = new RoundButton(bulbArt(), swatch.yellow, 56, () => void this.askHelp());

    ctx.stage.addChild(
      this.backdrop, this.wash, this.blanket, this.standArt, this.signText, this.tray, this.soldOut, this.crowd, this.tally, this.banner, this.table, this.glow,
      ...this.coins.map((c) => c.node), ...this.cards.map((c) => c.node), this.open, this.help,
    );
    this.m = this.metrics();
    this.resize(ctx.view);
  }

  private cardH() {
    return this.plan.purse ? 160 : 130;
  }

  private metrics(): Metrics {
    const v = this.view;
    const panelW = DAY_W + this.columns().length * COL_W + 12;
    const panelX = v.w - panelW - 18;
    const right = panelX - 14;
    // The stand sits left of the middle of the space beside the table, leaving the customers' spot on its right clear.
    const cx = Math.min(Math.max(400, (150 + right) / 2), right - 275);
    // Spare height (a portrait window) goes above the stand, so the controls stay at the bottom.
    const extra = Math.max(0, v.h - 768);
    const top = 138 + extra * 0.5;
    const counterY = top + 150;
    return { panelX, panelW, cx, top, counterY, ground: counterY + 108, cardsY: v.h - 150, priceY: v.h - 300 };
  }

  // ---------------------------------------------------------------- layout and drawing

  resize(v: View) {
    this.view = v;
    this.m = this.metrics();
    const m = this.m;
    this.backdrop.resize(v);
    this.drawWash();
    this.drawStand();
    this.signText.position.set(m.cx, m.counterY + 70);
    this.tray.position.set(m.cx, m.counterY - 4);
    this.soldOut.position.set(m.cx, m.counterY - 66);
    this.tally.position.set(m.cx + 218, m.top + (priceChoice(this.plan) ? 80 : 56));
    this.blanket.position.set(170, m.ground + 14);
    // Banner
    const right = m.panelX - 14;
    const bw = right - 150;
    this.banner.position.set(150 + bw / 2, 24 + 48);
    this.bannerBox.clear().roundRect(-bw / 2, -48 + 5, bw, 96, 22).fill(wood.line).roundRect(-bw / 2, -48, bw, 96, 22).fill(0xfffaf0).stroke(line(wood.line, 5));
    this.dayText.position.set(-bw / 2 + 70, 0);
    this.weatherSlot.position.set(-bw / 2 + 170, 0);
    this.eventSlot.position.set(-bw / 2 + 262, 0);
    this.purseChip.position.set(bw / 2 - 118, 0);
    this.purseText.position.set(52, 0);
    // The table
    this.table.position.set(m.panelX, 40);
    const rows = Math.max(this.plan.days, 1);
    this.tableBox.clear().roundRect(0, 5, m.panelW, HEAD_H + rows * ROW_H + 8, 24).fill(wood.line).roundRect(0, 0, m.panelW, HEAD_H + rows * ROW_H + 8, 24).fill(0xfff1d6).stroke(line(wood.line, 5));
    this.tableBody.position.set(0, HEAD_H);
    // Controls
    const cards = this.cards.length;
    const x0 = 150 + CARD_W / 2;
    this.cards.forEach((c, i) => c.node.position.set(x0 + i * (CARD_W + 14), m.cardsY));
    this.open.position.set(x0 + (cards - 1) * (CARD_W + 14) + CARD_W / 2 + 14 + 56, m.cardsY);
    this.coins.forEach((c, i) => c.node.position.set(280 + i * 140, m.priceY));
    this.help.position.set(190, m.top + 84);
  }

  private drawWash() {
    const day = this.week[Math.max(0, this.index)];
    const v = this.view;
    const w = this.wash.clear();
    if (!day || day.weather === 'sunny') return;
    w.rect(0, 0, v.w, v.h).fill({ color: day.weather === 'rainy' ? 0x5c6f8f : 0x9aa6b8, alpha: day.weather === 'rainy' ? 0.3 : 0.16 });
  }

  private drawStand() {
    const m = this.m;
    const s = this.standArt.clear();
    const cx = m.cx;
    s.rect(cx - 142, m.top + 30, 14, m.counterY - m.top - 30).rect(cx + 128, m.top + 30, 14, m.counterY - m.top - 30).fill(wood.fill);
    const stripe = 280 / 6;
    for (let i = 0; i < 6; i++) s.rect(cx - 140 + i * stripe, m.top, stripe, 30).fill(i % 2 ? 0xffffff : swatch.yellow.fill);
    s.rect(cx - 140, m.top, 280, 30).stroke(line(swatch.yellow.line, 5));
    for (let i = 0; i < 6; i++) {
      s.moveTo(cx - 140 + i * stripe, m.top + 30).arc(cx - 140 + i * stripe + stripe / 2, m.top + 30, stripe / 2, Math.PI, 0, true).fill(i % 2 ? 0xffffff : swatch.yellow.fill);
    }
    s.roundRect(cx - 160, m.counterY, 320, 34, 12).fill(wood.fill).stroke(line(wood.line, 6));
    s.rect(cx - 145, m.counterY + 34, 290, 74).fill(wood.light).stroke(line(wood.line, 5));
  }

  private drawHeader() {
    const h = this.table;
    const names: Record<Cell, string> = { made: 'MADE', sold: 'SOLD', left: 'LEFT', shells: 'SHELLS' };
    this.columns().forEach((col, i) => {
      const x = DAY_W + i * COL_W + COL_W / 2;
      const icon = col === 'shells' ? coinArt(1) : cupArt(col !== 'left');
      icon.scale.set(col === 'shells' ? 0.55 : 0.62);
      icon.position.set(x, 28);
      if (col === 'sold') {
        const tick = new Graphics().moveTo(-9, 2).lineTo(-2, 10).lineTo(11, -8).stroke(line(swatch.green.line, 5));
        tick.position.set(x + 12, 40);
        h.addChild(icon, tick);
      } else h.addChild(icon);
      const t = label(names[col], 14, ink, '600');
      t.position.set(x, 64);
      h.addChild(t);
    });
    const day = label('DAY', 14, ink);
    day.position.set(DAY_W / 2, 64);
    h.addChild(day);
  }

  private columns(): Cell[] {
    return priceChoice(this.plan) ? ['made', 'sold', 'left', 'shells'] : ['made', 'sold', 'left'];
  }

  private drawCards() {
    const h = this.cardH();
    for (const c of this.cards) this.paintCard(c.box, false, true, h);
  }

  private paintCard(box: Graphics, selected: boolean, ok: boolean, h = this.cardH()) {
    box.clear();
    box.roundRect(-CARD_W / 2, -h / 2 + 5, CARD_W, h, 18).fill(swatch.white.line);
    box.roundRect(-CARD_W / 2, -h / 2, CARD_W, h, 18).fill(ok ? 0xffffff : 0xe4e4ea).stroke(selected ? { width: 8, color: swatch.green.fill } : { width: 4, color: swatch.white.line });
  }

  private paintCoin(c: { value: number; ring: Graphics }, selected: boolean) {
    c.ring.clear();
    if (selected) c.ring.circle(0, 0, 64).fill({ color: swatch.green.light, alpha: 0.9 }).stroke({ width: 8, color: swatch.green.fill });
  }

  // ---------------------------------------------------------------- the round

  start() {
    void this.nextDay();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.clock < this.litUntil) {
      const pulse = 6 + 2 * Math.sin(this.clock * 6);
      for (const i of this.lit) {
        g.roundRect(this.m.panelX - 2, 40 + HEAD_H + i * ROW_H - 2, this.m.panelW + 4, ROW_H + 4, 20).stroke({ width: pulse, color: swatch.yellow.fill });
      }
    }
  }

  destroy() {
    for (const c of this.friends) this.ctx.untrack(c);
    this.friends.clear();
    for (const c of this.picnic) this.ctx.untrack(c);
  }

  private highlight(rows: number[], seconds = 4.5) {
    this.lit = rows;
    this.litUntil = this.clock + seconds;
  }

  private forecastLine(day: Day): LineId {
    return day.event === 'ferry' ? 'lemon.forecast.ferry' : day.event === 'quiet' ? 'lemon.forecast.quiet' : 'lemon.forecast';
  }

  private chooseLine(): LineId {
    return this.plan.purse ? 'lemon.choose.purse' : priceChoice(this.plan) ? 'lemon.choose.price' : 'lemon.choose';
  }

  private async nextDay() {
    this.busy = true;
    this.index++;
    this.helpAt = 0;
    this.helpedToday = false;
    this.made = null;
    this.price = priceChoice(this.plan) ? null : this.plan.prices[0];
    this.lit = [];
    if (this.index >= this.week.length) return void this.wrapUp();
    const day = this.week[this.index];
    this.showForecast(day);
    this.clearTray();
    this.soldOut.visible = false;
    this.tally.visible = false;
    this.refreshControls();
    if (this.restock > 0) {
      const n = this.restock;
      this.restock = 0;
      this.setPurse(this.purse + n);
      this.floatText(`+${n}`, this.view.w * 0.5, 130, swatch.green.line);
      await this.ctx.say('lemon.restock', { n });
    }
    this.busy = false;
    await this.ctx.say(this.forecastLine(day), { day: this.index + 1, weather: WEATHER_WORD[day.weather] });
    void this.ctx.instruct(this.chooseLine());
  }

  private showForecast(day: Day) {
    this.dayText.text = `DAY ${this.index + 1}\nof ${this.week.length}`;
    for (const slot of [this.weatherSlot, this.eventSlot]) slot.removeChildren().forEach((c) => c.destroy({ children: true }));
    const place = (slot: Container, icon: Container, word: string, delay: number) => {
      icon.y = -10;
      const cap = label(word, 20, ink);
      cap.y = 34;
      slot.addChild(icon, cap);
      slot.scale.set(0.01);
      void this.ctx.tw.to(slot.scale, { x: 1, y: 1 }, { duration: 0.35, delay, ease: ease.outBack });
    };
    place(this.weatherSlot, forecastIcon(day.weather, 62), WEATHER_WORD[day.weather], 0);
    if (day.event) place(this.eventSlot, eventIcon(day.event, 62), day.event === 'ferry' ? 'ferry visit' : 'quiet day', 0.15);
    this.drawWash();
    if (day.weather === 'rainy') sfx.splash();
    else if (day.weather === 'sunny') [5, 7, 9].forEach((s, i) => void this.ctx.tw.wait(i * 0.1).then(() => sfx.bell(s, 0.18)));
  }

  /** Cards the purse cannot pay for are dimmed, and the open sign shows whether the stand is ready. */
  private refreshControls() {
    for (const c of this.cards) {
      const ok = affordable(this.plan, this.purse, c.n);
      this.paintCard(c.box, this.made === c.n, ok);
      c.node.alpha = ok ? 1 : 0.6;
      c.node.scale.set(1);
    }
    for (const c of this.coins) this.paintCoin(c, this.price === c.value);
    this.open.alpha = this.made !== null && this.price !== null ? 1 : 0.6;
  }

  private pickBatch(n: number) {
    if (this.busy || this.finished) return;
    if (!affordable(this.plan, this.purse, n)) {
      sfx.tick();
      void this.ctx.say('lemon.toomuch', { n: batchCost(n), purse: this.purse });
      return;
    }
    this.made = n;
    this.fillTray(n);
    sfx.pop(5 + (BATCHES as readonly number[]).indexOf(n) * 2);
    this.refreshControls();
    const c = this.cards.find((x) => x.n === n)!;
    c.node.scale.set(1.08);
    void this.ctx.tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  private pickPrice(value: number) {
    if (this.busy || this.finished) return;
    this.price = value;
    sfx.bell(4 + value * 2, 0.25);
    this.refreshControls();
    const c = this.coins.find((x) => x.value === value)!;
    c.node.scale.set(1.12);
    void this.ctx.tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  // ---------------------------------------------------------------- the tray of cups

  private cupSpot(i: number) {
    return { x: ((i % 6) - 2.5) * 40, y: -26 - Math.floor(i / 6) * 44 };
  }

  private clearTray() {
    this.trayCups.splice(0).forEach((c) => c.destroy({ children: true }));
  }

  private fillTray(n: number) {
    this.clearTray();
    for (let i = 0; i < n; i++) {
      const cup = cupArt();
      const spot = this.cupSpot(i);
      cup.position.set(spot.x, spot.y);
      cup.scale.set(0.01);
      this.tray.addChild(cup);
      this.trayCups.push(cup);
      void this.ctx.tw.to(cup.scale, { x: CUP_SCALE, y: CUP_SCALE }, { duration: 0.2, delay: i * 0.025, ease: ease.outBack });
    }
  }

  // ---------------------------------------------------------------- opening the stand

  /** Make a gentle nudge on the things she has not chosen yet. This is not a miss. */
  private nudge(nodes: Container[]) {
    for (const n of nodes) {
      n.scale.set(1.12);
      void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    }
  }

  private async openStand() {
    if (this.busy || this.finished) return;
    if (this.made === null) {
      sfx.tick();
      this.nudge(this.cards.map((c) => c.node));
      void this.ctx.say('lemon.pick');
      return;
    }
    if (this.price === null) {
      sfx.tick();
      this.nudge(this.coins.map((c) => c.node));
      void this.ctx.say('lemon.pick.price');
      return;
    }
    this.busy = true;
    this.lit = [];
    const row = sellDay(this.plan, this.week[this.index], this.index, this.made, this.price);
    void this.ctx.say('lemon.open');
    if (this.plan.purse) {
      this.setPurse(this.purse - row.cost);
      this.floatText(`-${row.cost}`, this.m.cx, this.m.top - 10, swatch.red.line);
    }
    this.tally.visible = true;
    this.dayCoins = 0;
    this.setTally(0, 0);
    await this.serve(row);
    this.rows.push(row);
    await this.addRow(row);
    await this.remark(row);
    if (this.plan.purse) {
      const s = settle(this.purse, row);
      this.restock = s.restock;
    }
    await this.ctx.tw.wait(0.6);
    await this.nextDay();
  }

  private setTally(cups: number, shells: number) {
    this.tallyCups.text = String(cups);
    if (this.tallyShells) this.tallyShells.text = String(shells);
  }

  private setPurse(n: number) {
    this.purse = n;
    this.purseText.text = String(n);
  }

  private floatText(text: string, x: number, y: number, color: number) {
    const t = label(text, 44, color);
    t.position.set(x, y);
    t.eventMode = 'none';
    this.ctx.stage.addChild(t);
    void Promise.all([this.ctx.tw.to(t, { y: y - 70 }, { duration: 0.9 }), this.ctx.tw.to(t, { alpha: 0 }, { duration: 0.5, delay: 0.5 })]).then(() => t.destroy());
  }

  private friend(): Critter {
    const c = new Critter(CRITTERS[this.ctx.rng.pick(FRIENDS)]);
    c.scale.set(0.42);
    c.alpha = 0;
    this.ctx.track(c);
    this.friends.add(c);
    this.crowd.addChild(c);
    return c;
  }

  private gone(c: Critter) {
    this.friends.delete(c);
    this.ctx.untrack(c);
    c.destroy({ children: true });
  }

  /** Friends come one after another: each who finds a cup buys it, and the rest watch the cups run out. */
  private async serve(row: Row) {
    const m = this.m;
    const serveX = m.cx + 215;
    const step = Math.max(0.2, Math.min(0.42, 3.6 / row.wanted));
    const leaving: Promise<void>[] = [];
    let sold = 0;
    for (let k = 0; k < row.wanted; k++) {
      const f = this.friend();
      f.position.set(serveX + 150, m.ground + 6);
      const served = k < row.sold;
      await this.ctx.tw.to(f, { x: serveX, alpha: 1 }, { duration: step * (served ? 0.4 : 0.3), ease: ease.outQuad });
      if (served) {
        const cup = this.trayCups.pop()!;
        const to = { x: serveX - m.cx - 38, y: m.ground - 86 - m.counterY + 4 };
        void this.ctx.tw.to(cup, to, { duration: step * 0.3, ease: ease.outQuad }).then(() => {
          if (!cup.destroyed) cup.destroy({ children: true });
        });
        f.cheer();
        sfx.pop(4 + (k % 5) * 2);
        sold++;
        this.dayCoins += row.price;
        this.setTally(sold, this.dayCoins);
        if (this.plan.purse) this.setPurse(this.purse + row.price);
        if (priceChoice(this.plan)) this.ctx.particles.burst(serveX - 20, m.counterY - 60, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 4, speed: [80, 200], gravity: 0, life: [0.3, 0.6] });
        await this.ctx.tw.wait(step * 0.3);
      } else {
        if (k === row.sold) this.showSoldOut();
        f.setMood('sad', 1.4);
        await this.ctx.tw.wait(step * 0.25);
      }
      leaving.push(
        Promise.all([this.ctx.tw.to(f, { alpha: 0 }, { duration: step * 0.35 }), this.ctx.tw.to(f.scale, { x: 0.5, y: 0.5 }, { duration: step * 0.35 })]).then(() => this.gone(f)),
      );
    }
    await Promise.all(leaving);
    // Whatever is left goes to the picnic.
    if (row.left > 0) await this.picnicRun();
  }

  private showSoldOut() {
    this.soldOut.visible = true;
    this.soldOut.scale.set(0.01);
    void this.ctx.tw.to(this.soldOut.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    sfx.bell(2, 0.2);
  }

  private async picnicRun() {
    const m = this.m;
    const to = { x: this.blanket.x - m.cx + (this.ctx.rng.chance(0.5) ? -22 : 22), y: this.blanket.y - 52 - m.counterY };
    const cups = this.trayCups.splice(0);
    await Promise.all(
      cups.map((cup, i) =>
        this.ctx.tw
          .to(cup, { x: to.x + (i % 3) * 16 - 16, y: to.y - Math.floor(i / 3) * 10 }, { duration: 0.5, delay: i * 0.07, ease: ease.outQuad })
          .then(() => this.ctx.tw.to(cup, { alpha: 0 }, { duration: 0.25 }))
          .then(() => cup.destroy({ children: true })),
      ),
    );
    for (const c of this.picnic) c.cheer();
    sfx.giggle();
  }

  // ---------------------------------------------------------------- the table

  private makeRow(row: Row): Container {
    const c = new Container();
    const w = this.m.panelW;
    c.addChild(new Graphics().roundRect(5, 4, w - 10, ROW_H - 8, 16).fill(row.day % 2 ? 0xfff7e6 : 0xffffff).stroke(line(wood.line, 3)));
    const wi = forecastIcon(row.weather, 44);
    wi.position.set(DAY_W / 2, 32);
    c.addChild(wi);
    if (row.event) {
      const ev = eventIcon(row.event, 30);
      ev.position.set(DAY_W / 2 - (priceChoice(this.plan) ? 22 : 0), 78);
      c.addChild(ev);
    }
    if (priceChoice(this.plan)) {
      const coin = coinArt(row.price);
      coin.scale.set(0.45);
      coin.position.set(DAY_W / 2 + (row.event ? 22 : 0), 78);
      c.addChild(coin);
    }
    const values: Record<Cell, number> = { made: row.made, sold: row.sold, left: row.left, shells: row.shells };
    this.columns().forEach((col, i) => {
      const t = label(String(values[col]), 40, ink);
      t.position.set(DAY_W + i * COL_W + COL_W / 2, ROW_H / 2);
      c.addChild(t);
    });
    c.hitArea = new Rectangle(0, 0, w, ROW_H);
    onTap(c, () => void this.readRow(row), { cooldown: 300 });
    return c;
  }

  private async addRow(row: Row) {
    const node = this.makeRow(row);
    node.position.set(40, row.day * ROW_H);
    node.alpha = 0;
    this.tableBody.addChild(node);
    this.tableRows.push({ row, node });
    sfx.marimba(6 + row.day, 0.35);
    await Promise.all([this.ctx.tw.to(node, { x: 0, alpha: 1 }, { duration: 0.4, ease: ease.outBack })]);
    this.highlight([row.day], 1.4);
  }

  /** Tap a row: hear its numbers, so the table never needs reading. */
  private async readRow(row: Row) {
    // Not while the pet is making the closing comparison.
    if (this.finished || this.index >= this.week.length) return;
    const token = ++this.reading;
    this.highlight([row.day], 3);
    const vars: LineVars = { day: row.day + 1, weather: WEATHER_WORD[row.weather], made: row.made, sold: row.sold, left: row.left, shells: row.shells, cost: row.cost, purse: this.purse };
    await this.ctx.say(row.unserved > 0 ? 'lemon.row.out' : row.left > 0 ? 'lemon.row.left' : 'lemon.row.good', vars);
    if (token !== this.reading) return;
    if (this.plan.purse) await this.ctx.say('lemon.row.cost', vars);
    else if (priceChoice(this.plan)) await this.ctx.say('lemon.row.shells', vars);
  }

  /** What the pet says about the day. None of it is a mistake: it is what the evidence shows. */
  private async remark(row: Row) {
    const r = rating(row);
    if (r === 'good') {
      this.ctx.pet.cheer();
      [6, 8, 10].forEach((step, i) => void this.ctx.tw.wait(i * 0.1).then(() => sfx.bell(step, 0.22)));
    } else sfx.bell(8, 0.2);
    const vars: LineVars = { n: r === 'out' ? row.unserved : row.left };
    await this.ctx.say(r === 'out' ? 'lemon.out' : r === 'left' ? 'lemon.left' : r === 'loss' ? 'lemon.loss' : 'lemon.good', vars);
  }

  // ---------------------------------------------------------------- help and the end

  private helpLine(h: Help): LineId {
    const price = priceChoice(this.plan) ? '.price' : '';
    switch (h.kind) {
      case 'out': return `lemon.help.out${price}` as LineId;
      case 'left': return `lemon.help.left${price}` as LineId;
      case 'good': return `lemon.help.good${price}` as LineId;
      case 'other': return 'lemon.help.other';
      case 'event': return h.vars.event === 'ferry' ? 'lemon.help.event.ferry' : 'lemon.help.event.quiet';
      case 'weather': return 'lemon.help.weather';
      default: return 'lemon.help.price';
    }
  }

  /** The Help button: the pet says one true thing about today, pointing at table rows it is about. Asking again says another. */
  private async askHelp() {
    if (this.busy || this.finished) return;
    const list = helps(this.plan, this.week[this.index], this.rows);
    const h = list[this.helpAt % list.length];
    this.helpAt++;
    // Help is counted once for the day, however many times she asks.
    if (!this.helpedToday) {
      this.helpedToday = true;
      this.hints++;
    }
    this.highlight(h.rows);
    this.ctx.pet.cheer();
    await this.ctx.say(this.helpLine(h), h.vars);
  }

  private insightLine(i: Insight): LineId {
    switch (i.kind) {
      case 'price': return 'lemon.sum.price';
      case 'weather': return 'lemon.sum.weather';
      case 'best': return 'lemon.sum.best';
      case 'right': return 'lemon.sum.right';
      default: return 'lemon.sum.plain';
    }
  }

  /** At the end of the round the table is the thing to look at: the choices fade away. */
  private hideControls() {
    for (const node of [...this.cards.map((c) => c.node), ...this.coins.map((c) => c.node), this.open, this.help]) void this.ctx.tw.to(node, { alpha: 0 }, { duration: 0.4 });
  }

  private async wrapUp() {
    this.tally.visible = false;
    this.soldOut.visible = false;
    this.hideControls();
    const found = insight(this.plan, this.rows);
    this.highlight(found.rows, 6);
    await this.ctx.say(this.insightLine(found), found.vars);
    await this.ctx.tw.wait(0.5);
    this.finished = true;
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('lemon.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class StandIcon extends WigglyIcon {
  constructor() {
    super(miniStand());
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const pitcher = pitcherArt();
  pitcher.scale.set(1.2);
  pitcher.position.set(-14, 96);
  c.addChild(pitcher);
  // A little pile of lemons by its foot.
  for (let i = 0; i < 2 + rng.int(0, 1); i++) {
    const lemon = prop('lemon', 'yellow');
    lemon.scale.set(0.5);
    lemon.position.set(-100 + i * 30 + rng.int(-4, 4), 96 - (i % 2) * 22);
    lemon.rotation = rng.range(-0.4, 0.4);
    c.addChild(lemon);
  }
  const cup = cupArt();
  cup.scale.set(1.5);
  cup.position.set(84, 62);
  c.addChild(cup);
  return c;
}

export const lemonadeStand: GameModule = {
  id: 'lemonade-stand',
  name: 'Lemonade Stand',
  titleLine: 'game.lemonade-stand',
  region: 'cozy-village',
  skills: ['forecasting', 'comparing', 'money', 'data'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  offScreen: 'Run a real juice stand at a picnic: guess how many cups to pour from the weather, then count what is left and write it in a table.',
  hubIcon: () => new StandIcon(),
  sticker,
  create: (ctx) => new LemonadeStand(ctx),
};
