import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { finish, spring, squash } from '../../ui/buttons';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import { CAR_COLORS, TrafficLight, carArt, type Car } from './art';
import {
  RIGHT_CARD,
  SMART_PLAN,
  VEHICLES,
  simulate,
  smartHand,
  smartQueues,
  stuckLine,
  type Road,
  type RuleCard,
  type Waiting,
} from './logic';

/** Cars drawn at half size so a queue of three fits above the cards. */
const CAR_SCALE = 0.5;
const ROAD = 0x8e96a3;
const PLATE = 0xc9ced6;

/** What each rule card says in a few printed words (the spoken rule is in `voice.ts`), and its picture. */
const CARD_WORDS: Record<RuleCard, string> = {
  plate: 'Car on the plate: green',
  'always-ew': 'Always green: across',
  'always-ns': 'Always green: up',
  empty: 'Empty plate: green',
  both: 'Both plates need a car',
};

/**
 * The picture on a rule card: two small rows, one per road, each a plate (with a car on it or empty), an arrow and the
 * light that road gets. The three cards differ in what the lights do for the same plates, so the picture is the rule.
 */
function ruleArt(card: RuleCard): Container {
  const c = new Container();
  const g = new Graphics();
  // [car on the plate?, the road's light] for the east–west row and then the north–south row.
  const rows: Record<RuleCard, [[boolean, boolean], [boolean, boolean]]> = {
    plate: [
      [true, true],
      [false, false],
    ],
    'always-ew': [
      [false, true],
      [false, false],
    ],
    'always-ns': [
      [false, false],
      [false, true],
    ],
    empty: [
      [true, false],
      [false, true],
    ],
    both: [
      [true, false],
      [false, false],
    ],
  };
  rows[card].forEach(([car, green], i) => {
    const y = -34 + i * 56;
    g.roundRect(-96, y - 18, 64, 36, 10).fill(PLATE);
    if (car)
      g.roundRect(-88, y - 12, 48, 24, 8)
        .fill(swatch.blue.fill)
        .stroke({ width: 3, color: swatch.blue.line });
    g.poly([-20, y - 10, -4, y, -20, y + 10]).fill(ink);
    g.circle(40, y, 19)
      .fill(ink)
      .circle(40, y, 14)
      .fill(green ? swatch.green.fill : swatch.red.fill);
    // Arrow for the road: east–west points right, north–south points up, so the rows say which road they mean.
    if (i === 0) g.poly([68, y - 8, 84, y, 68, y + 8]).fill(ink);
    else g.poly([68, y + 8, 76, y - 8, 84, y + 8]).fill(ink);
  });
  c.addChild(g);
  return c;
}

type Card = Container & { rule: RuleCard; tried: boolean };

/**
 * Level 7, Smart light (the school window): the crossing runs itself. A plate under each road tells the light whether a car
 * waits; she chooses the rule card the light follows and watches the cars use it. A card that lets every car through
 * finishes a crossing; any other leaves a car waiting for good, which the helper explains, and she tries another card.
 * Nothing is timed, nothing crashes, and every retry is free (each wrong card is one miss, and two glow the right card).
 */
export class SmartLight implements Game {
  done = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private view: View;
  private clock = 0;
  private readonly backdrop: Backdrop;
  private readonly road = new Graphics();
  private readonly plates = new Graphics();
  private readonly carLayer = new Container();
  private readonly cardLayer = new Container();
  private readonly glow = new Graphics();
  private readonly lights: Record<Road, TrafficLight> = {
    ew: new TrafficLight(false),
    ns: new TrafficLight(false),
  };
  private readonly queue: Record<Road, Car[]> = { ew: [], ns: [] };
  private readonly cards: Card[] = [];
  private start0: Waiting = { ew: 1, ns: 2 };
  private hand: RuleCard[] = [];
  private wrongs = 0;
  private hinting = false;
  private bubble: Container | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0xc8ecb0, 0x9edb86],
        horizon: 0.5,
        clouds: 2,
        sun: true,
        seed: 66,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.plates.eventMode = 'none';
    this.road.eventMode = 'none';
    for (const t of Object.values(this.lights)) {
      t.twoLamp = true;
      t.set('red');
      t.scale.set(0.6);
      t.eventMode = 'none';
    }
    ctx.stage.addChild(
      this.backdrop,
      this.road,
      this.plates,
      this.carLayer,
      this.lights.ew,
      this.lights.ns,
      this.cardLayer,
      this.glow,
    );
    this.newCrossing();
    this.resize(ctx.view);
  }

  start() {
    this.busy = false;
    void this.ctx.instruct('go.smart');
  }

  // Layout ---------------------------------------------------------------------------------------

  private junction() {
    return { x: this.view.w * 0.5, y: this.view.h * 0.22 };
  }

  /** Where the car `i` places back from the junction waits: east–west cars to its left, north–south cars below it. */
  private slot(road: Road, i: number) {
    const j = this.junction();
    return road === 'ew' ? { x: j.x - 105 - i * 92, y: j.y + 12 } : { x: j.x + 15, y: j.y + 105 + i * 82 };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const j = this.junction();
    const r = this.road.clear();
    const bottom = v.h * 0.66;
    r.rect(0, j.y - 50, v.w, 100).fill(ROAD);
    for (let x = 20; x < v.w; x += 90) r.rect(x, j.y - 4, 50, 8).fill(0xffffff);
    r.rect(j.x - 50, 0, 100, bottom).fill(ROAD);
    r.rect(j.x - 50, j.y - 50, 100, 100).fill(0x9ba3ae);
    this.lights.ew.position.set(j.x - 66, j.y - 54);
    this.lights.ns.position.set(j.x + 106, j.y + 96);
    this.drawPlates();
    this.layoutCars(true);
    this.layoutCards();
  }

  private drawPlates() {
    const p = this.plates.clear();
    for (const road of ['ew', 'ns'] as Road[]) {
      const s = this.slot(road, 0);
      const on = this.queue[road].length > 0;
      const [w, h] = road === 'ew' ? [96, 66] : [66, 96];
      p.roundRect(s.x - w / 2 - (road === 'ns' ? 15 : 0), s.y - h / 2 - (road === 'ew' ? 15 : 0), w, h, 14)
        .fill(on ? swatch.green.light : PLATE)
        .stroke({ width: 5, color: on ? swatch.green.line : 0x9aa1ad });
    }
  }

  private layoutCars(snap = false) {
    for (const road of ['ew', 'ns'] as Road[])
      this.queue[road].forEach((c, i) => {
        const s = this.slot(road, i);
        if (snap) c.position.set(s.x, s.y);
        else void this.ctx.tw.to(c, { x: s.x, y: s.y }, { duration: 0.35, ease: ease.outQuad });
      });
  }

  private layoutCards() {
    const v = this.view;
    // The cards sit right of the guide's corner, so it never covers one.
    const left = 150;
    const right = v.w - 24;
    const gap = 20;
    const w = Math.min(300, (right - left - gap * 2) / 3);
    const h = Math.min(230, v.h * 0.3);
    const x0 = (left + right) / 2 - (w * 3 + gap * 2) / 2 + w / 2;
    this.cards.forEach((card, i) => {
      card.position.set(x0 + i * (w + gap), v.h * 0.66 + (v.h * 0.34) / 2 - 6);
      card.scale.set(w / 300);
      card.hitArea = new Rectangle(-150, -h / (2 * (w / 300)), 300, h / (w / 300));
    });
  }

  // The crossing and the cards ------------------------------------------------------------------

  private makeCar(road: Road, i: number) {
    const car = carArt(
      CAR_COLORS[(i + (road === 'ns' ? 2 : 0) + this.done) % CAR_COLORS.length],
      this.ctx.rng.pick(VEHICLES),
    );
    car.scale.set(CAR_SCALE);
    if (road === 'ns') car.rotation = -Math.PI / 2;
    car.eventMode = 'none';
    this.carLayer.addChild(car);
    this.queue[road].push(car);
    return car;
  }

  /** Sets out a fresh crossing (new queues, a new hand of cards) for the round's next part. */
  private newCrossing() {
    this.start0 = smartQueues(this.ctx.rng);
    this.hand = smartHand(this.ctx.rng);
    this.wrongs = 0;
    this.hinting = false;
    this.cards.splice(0).forEach((c) => c.destroy({ children: true }));
    this.hand.forEach((rule) => this.addCard(rule));
    this.resetCars();
    if (this.view) this.layoutCards();
  }

  /** Puts the starting queues back (after a try, so the same cards can be tried again). */
  private resetCars() {
    this.bubble?.destroy({ children: true });
    this.bubble = null;
    for (const road of ['ew', 'ns'] as Road[]) {
      this.queue[road].splice(0).forEach((c) => c.destroy({ children: true }));
      for (let i = 0; i < this.start0[road]; i++) this.makeCar(road, i);
      this.lights[road].set('red');
    }
    this.drawPlates();
    this.layoutCars(true);
  }

  private addCard(rule: RuleCard) {
    const card = new Container() as Card;
    card.rule = rule;
    card.tried = false;
    const face = finish({ w: 292, h: 230, corner: 34 }, swatch.blue, cream);
    const art = ruleArt(rule);
    art.position.set(-4, -22);
    const words = label(CARD_WORDS[rule], 24);
    words.position.set(0, 86);
    card.addChild(face, art, words);
    onTap(card, () => void this.pick(card), { cooldown: 300 });
    this.cardLayer.addChild(card);
    this.cards.push(card);
  }

  private async pick(card: Card) {
    if (this.busy || this.finished) return;
    this.busy = true;
    squash(card);
    spring(card, 0.1);
    sfx.bell(6, 0.22);
    this.hinting = false;
    await this.ctx.say(`go.smart.rule.${card.rule}` as const);
    await this.run(card);
  }

  /** Lets the cars use the card's rule, one second at a time, then shows the result. */
  private async run(card: Card) {
    const { steps, left } = simulate(card.rule, this.start0);
    for (const step of steps) {
      for (const road of ['ew', 'ns'] as Road[]) this.lights[road].set(step.green === road ? 'green' : 'red');
      if (step.passed) {
        const road = step.passed;
        const car = this.queue[road].shift()!;
        sfx.whoosh();
        void this.ctx.tw
          .to(car, road === 'ew' ? { x: this.view.w + 150 } : { y: -150 }, {
            duration: 0.9,
            ease: ease.inQuad,
          })
          .then(() => car.destroy({ children: true }));
        this.layoutCars();
        this.drawPlates();
      }
      await this.ctx.tw.wait(1);
    }
    if (left.ew + left.ns === 0) return this.cleared();
    await this.stuck(card, left);
  }

  /** The card let every car through. */
  private async cleared() {
    sfx.tada();
    this.done++;
    await this.ctx.say('go.smart.clear');
    if (this.done >= SMART_PLAN.goal) return void this.finale();
    await this.ctx.tw.wait(0.4);
    this.newCrossing();
    this.busy = false;
    void this.ctx.instruct('go.smart');
  }

  /** The card left a car waiting forever: a thought clock over it, the reason spoken, and the queue comes back for another try. */
  private async stuck(card: Card, left: Waiting) {
    this.misses++;
    this.wrongs++;
    card.tried = true;
    card.alpha = 0.55;
    sfx.boing();
    const road: Road = left.ew > 0 ? 'ew' : 'ns';
    const front = this.queue[road][0];
    if (front) this.showClock(front);
    await this.ctx.say(stuckLine(card.rule));
    await this.ctx.tw.wait(0.6);
    this.resetCars();
    if (this.wrongs >= 2 && !this.hinting) {
      this.hinting = true;
      this.hints++;
    }
    this.busy = false;
  }

  /** A small clock over a waiting car: it is still there and will stay. */
  private showClock(car: Car) {
    const b = new Container();
    const g = new Graphics()
      .circle(0, 0, 34)
      .fill(0xffffff)
      .stroke({ width: 5, color: ink })
      .moveTo(0, 0)
      .lineTo(0, -20)
      .moveTo(0, 0)
      .lineTo(14, 8)
      .stroke({ width: 5, color: ink, cap: 'round' });
    b.addChild(g);
    b.position.set(car.x, car.y - 80);
    b.eventMode = 'none';
    this.carLayer.addChild(b);
    this.bubble = b;
    b.scale.set(0.2);
    void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    await this.ctx.say('go.smart.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.hinting || this.busy) return;
    const card = this.cards.find((c) => c.rule === RIGHT_CARD);
    if (!card) return;
    const b = card.getBounds();
    g.roundRect(b.x - 10, b.y - 10, b.width + 20, b.height + 20, 36).stroke({
      width: 7 + 2 * Math.sin(this.clock * 6),
      color: swatch.yellow.light,
    });
  }

  /** The ghost finger: tap the card that lets every car through. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const card = this.cards.find((c) => c.rule === RIGHT_CARD);
    return card ? { tap: { on: card } } : null;
  }

  destroy() {}
}
