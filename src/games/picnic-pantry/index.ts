import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { hinted, missOnRequest, newRequestTally, nextRequest, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  bellArt,
  cardArt,
  controlArt,
  cushionArt,
  dishArt,
  iconArt,
  jarArt,
  JAR_SLOTS,
  outlineArt,
  picnicBlanket,
  placeArt,
  stickerArt,
  tokenArt,
} from './art';
import {
  allocation,
  CASES,
  countPhrase,
  countSentence,
  describeLevel,
  explain,
  fits,
  ingredientWord,
  jarName,
  LEVELS,
  makeRound,
  menusThatFit,
  numberWord,
  pantryLayout,
  remaining,
  repair,
  sameMenu,
  type Box,
  type PantryLayout,
  type Picnic,
  type Repair,
  type Triple,
} from './logic';

/** Quiet seconds before the next useful control glows by itself (once per picnic; shown, it is a hint). */
const IDLE_GLOW = 8;
const GUESTS: CritterName[] = ['cat', 'duck', 'bear', 'bunny'];
const TOKEN = 44;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface SlotArt {
  jar: number;
  node: Container;
  filled: boolean;
}

class PicnicPantry implements Game {
  readonly round: [Picnic, Picnic];
  /** Which picnic of the round: 0 or 1. */
  at = 0;
  /** Placed dishes in the order she placed them. */
  selection: number[] = [];
  /** The dish on each of the blanket's two places. */
  slots: (number | null)[] = [null, null];
  phase: 'plan' | 'laid' = 'plan';
  /** The optional, unjudged Another way? pass of this picnic. */
  again = false;
  /** Menus laid in this picnic, with what each left in the pantry. */
  laid: { menu: number[]; left: Triple }[] = [];
  readonly t = newRequestTally();
  finished = false;
  /** The control a hint is glowing on, if any. */
  hintStep: Repair | 'next' | null = null;
  readonly hintLabel = 'Show a hint';

  readonly jars: Container[] = [];
  /** The three cards in screen order; `cards[i]` shows dish `picnic.order[i]`. */
  readonly cards: Container[] = [];
  readonly places: Container[] = [];
  readonly bell = new Container();
  readonly nextButton = new Container();
  readonly anotherButton = new Container();

  private readonly root = new Container();
  private readonly shelf = new Graphics();
  private blanket: Container | null = null;
  private readonly cushions: Graphics[] = [];
  private readonly friends: Critter[] = [];
  private readonly fx = new Container();
  private readonly glow = new Graphics();
  private readonly jarTokens: Container[] = [];
  private readonly placeArtAt: Container[] = [];
  private slotArt: SlotArt[][] = [[], []];
  private layout: PantryLayout;
  /** Bumped by every redraw, so a token still flying from an older picture lands nowhere. */
  private gen = 0;
  private idle = 0;
  private idleShown = false;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.round = makeRound(ctx.rng);
    this.layout = pantryLayout(ctx.view.w, ctx.view.h, !!ctx.view.upright);
    this.shelf.eventMode = 'none';
    this.root.addChild(this.shelf);
    for (let i = 0; i < 4; i++) {
      const cushion = cushionArt(84, i % 2 ? 'teal' : 'pink');
      cushion.eventMode = 'none';
      this.cushions.push(cushion);
    }
    for (let j = 0; j < 3; j++) {
      const jar = new Container();
      jar.hitArea = new Rectangle(-85, -90, 170, 180);
      onTap(jar, () => this.tapJar(j));
      this.jars.push(jar);
      this.root.addChild(jar);
    }
    for (let k = 0; k < 2; k++) {
      const place = new Container();
      place.hitArea = new Rectangle(-110, -115, 220, 230);
      onTap(place, () => this.tapPlace(k));
      this.places.push(place);
    }
    for (let i = 0; i < 3; i++) {
      const card = new Container();
      card.hitArea = new Rectangle(-118, -75, 236, 150);
      onTap(card, () => this.tapCard(i));
      this.cards.push(card);
    }
    this.bell.addChild(bellArt());
    this.bell.hitArea = new Circle(0, 0, 75);
    onTap(this.bell, () => this.ring());
    onTap(this.nextButton, () => this.next());
    onTap(this.anotherButton, () => this.anotherWay());
    for (const name of GUESTS) {
      const friend = ctx.track(new Critter(CRITTERS[name]));
      friend.eventMode = 'none';
      friend.visible = false;
      this.friends.push(friend);
    }
    this.fx.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.root);
    this.resize(ctx.view);
  }

  get picnic(): Picnic {
    return this.round[Math.min(this.at, 1)];
  }
  /** The card showing a dish. */
  cardOf(dish: number): Container {
    return this.cards[this.picnic.order.indexOf(dish)];
  }

  start() {
    void this.ctx.instruct('pantry.instruct');
  }

  // --- input ---

  private touched() {
    this.idle = 0;
    this.hintStep = null;
  }

  private tapJar(j: number) {
    if (this.finished) return;
    this.idle = 0;
    const c = this.picnic.case;
    const left = Math.max(0, remaining(c, this.selection)[j]);
    sfx.pop(2 + j * 2);
    this.bounce(this.jars[j]);
    if (left === 0) void this.ctx.say('pantry.jar-none', { ingredient: jarName(c, j) });
    else void this.ctx.say('pantry.jar', { ingredient: jarName(c, j), n: capital(numberWord(left)) });
  }

  private tapCard(i: number) {
    if (this.finished || this.phase !== 'plan') return;
    const dish = this.picnic.order[i];
    if (this.selection.includes(dish)) {
      this.putBack(dish);
      return;
    }
    if (this.selection.length === 2) {
      // The blanket is full: a wobble and a reminder, never a miss.
      this.idle = 0;
      sfx.tick();
      this.wobble(this.cards[i]);
      this.places.forEach((p) => this.bounce(p));
      void this.ctx.say('pantry.full');
      return;
    }
    this.place(dish);
  }

  private tapPlace(k: number) {
    if (this.finished || this.phase !== 'plan') return;
    const dish = this.slots[k];
    if (dish !== null) this.putBack(dish);
  }

  private place(dish: number) {
    this.touched();
    const c = this.picnic.case;
    const before = remaining(c, this.selection);
    const k = this.slots.indexOf(null);
    this.slots[k] = dish;
    this.selection.push(dish);
    this.draw();
    // Each token the jars could give hops from its jar to the dish, one by one, with a rising note.
    const gen = this.gen;
    let n = 0;
    const left = before.map((v) => Math.max(0, v));
    for (const slot of this.slotArt[k]) {
      if (!slot.filled) continue;
      const from = JAR_SLOTS[Math.min(3, Math.max(0, left[slot.jar] - 1))];
      left[slot.jar]--;
      const jar = this.jars[slot.jar];
      this.fly(
        c.ingredients[slot.jar],
        { x: jar.x + from.x, y: jar.y + from.y },
        { x: this.places[k].x + slot.node.x, y: this.places[k].y + slot.node.y },
        slot.node,
        n * 0.13,
        2 + n,
        gen,
      );
      n++;
    }
    void this.ctx.say('pantry.dish', {
      dish: c.dishes[dish].name,
      cost: countPhrase(c, c.dishes[dish].cost),
    });
  }

  private putBack(dish: number) {
    this.touched();
    const c = this.picnic.case;
    const before = remaining(c, this.selection).map((v) => Math.max(0, v));
    const k = this.slots.indexOf(dish);
    const from = { x: this.places[k].x, y: this.places[k].y + 55 };
    this.slots[k] = null;
    this.selection = this.selection.filter((d) => d !== dish);
    this.draw();
    // Its tokens go home; the other dish's outlines fill from the refilled jar (the redraw shows them filled).
    const gen = this.gen;
    const after = remaining(c, this.selection).map((v) => Math.max(0, v));
    let n = 0;
    for (let j = 0; j < 3; j++) {
      for (let s = before[j]; s < after[j]; s++) {
        const token = this.jarTokens[j].children[s];
        if (!token) continue;
        this.fly(
          c.ingredients[j],
          from,
          { x: this.jars[j].x + token.x, y: this.jars[j].y + token.y },
          token,
          n * 0.08,
          5 - Math.min(n, 4),
          gen,
        );
        n++;
      }
    }
    sfx.pop(4);
  }

  private ring() {
    if (this.finished || this.phase !== 'plan') return;
    const c = this.picnic.case;
    this.touched();
    this.bounce(this.bell);
    if (this.selection.length < 2) {
      sfx.tick();
      void this.ctx.say('pantry.need-two');
      return;
    }
    if (fits(c, this.selection)) {
      this.lay();
      return;
    }
    // A pair the pantry cannot cover: the plan stays as she left it. One miss in the first pass, free in Another way?
    const [why] = explain(c, this.selection);
    const due = !this.again && missOnRequest(this.t);
    if (this.again) sfx.tick();
    else sfx.boing();
    this.bounce(this.jars[why.jar]);
    for (const slots of this.slotArt) for (const s of slots) if (s.jar === why.jar) this.bounce(s.node);
    void this.ctx
      .say('pantry.short', {
        first: c.dishes[this.selection[0]].name,
        second: c.dishes[this.selection[1]].name,
        sum: numberWord(why.sum),
        ingredient: ingredientWord(c.ingredients[why.jar], why.sum),
        n: numberWord(why.pantry),
      })
      .then(() => {
        // Her second miss on this picnic brings the hint, for the plan as it stands by then.
        if (due && this.ctx.alive && !this.finished && this.phase === 'plan') this.showHint(true);
      });
    this.redrawGlow();
  }

  private lay() {
    const c = this.picnic.case;
    const menu = [...this.selection];
    const left = remaining(c, menu);
    const before = this.laid.find((l) => !sameMenu(l.menu, menu));
    const repeat = this.laid.some((l) => sameMenu(l.menu, menu));
    this.phase = 'laid';
    if (!repeat) this.laid.push({ menu, left });
    sfx.bell(4, 0.3);
    sfx.sparkle();
    this.ctx.pet.cheer();
    const gen = this.gen + 1;
    this.friends.forEach((f, i) => {
      f.visible = true;
      f.scale.set(0);
      void this.ctx.tw
        .to(f.scale, { x: 0.3, y: 0.3 }, { duration: 0.35, delay: 0.12 * i, ease: ease.outBack })
        .then(() => {
          if (gen === this.gen && this.ctx.alive) f.hop(0.7);
        });
    });
    this.draw();
    const now = countSentence(c, left);
    if (this.again && repeat) void this.ctx.say('pantry.same');
    else if (this.again && before)
      void this.ctx.say('pantry.compare', {
        now: now || 'Nothing',
        before: countPhrase(c, before.left) || 'nothing',
      });
    else if (now) void this.ctx.say('pantry.left', { leftovers: now });
    else void this.ctx.say('pantry.left-none');
  }

  /** Another way?: the dishes go back and the picnic may be laid again. Nothing in this pass is a miss or a hint. */
  private anotherWay() {
    if (this.finished || this.phase !== 'laid') return;
    this.touched();
    this.again = true;
    this.phase = 'plan';
    this.selection = [];
    this.slots = [null, null];
    sfx.pop(5);
    this.draw();
    void this.ctx.say('pantry.another');
  }

  private next() {
    if (this.finished || !(this.phase === 'laid' || this.again)) return;
    this.touched();
    sfx.pop(7);
    this.at++;
    if (this.at >= this.round.length) {
      this.finished = true;
      this.draw();
      this.ctx.finish(tally(this.t));
      return;
    }
    nextRequest(this.t);
    this.again = false;
    this.phase = 'plan';
    this.selection = [];
    this.slots = [null, null];
    this.laid = [];
    this.idleShown = false;
    this.build();
    void this.ctx.instruct('pantry.instruct');
  }

  // --- help ---

  private nextStep(): Repair {
    return repair(this.picnic.case, this.selection, {
      laid: this.laid.map((l) => l.menu),
      order: this.picnic.order,
    });
  }

  /** One repair step glows and, when asked for, is named. A hint already glowing is repeated without counting again. */
  private showHint(spoken: boolean) {
    const c = this.picnic.case;
    const step = this.nextStep();
    const same = JSON.stringify(step) === JSON.stringify(this.hintStep);
    if (!same) {
      this.hintStep = step;
      if (!this.again) hinted(this.t);
    }
    this.redrawGlow();
    if (!spoken) return;
    if (step === 'lay') void this.ctx.say('pantry.hint-lay');
    else if ('add' in step) void this.ctx.say('pantry.hint-add', { dish: c.dishes[step.add].name });
    else void this.ctx.say('pantry.hint-back', { dish: c.dishes[step.putBack].name });
  }

  askForHint() {
    if (this.finished) return;
    this.idle = 0;
    if (this.phase === 'laid') {
      // Nothing left to work out: Next glows, and it is not a hint.
      this.hintStep = 'next';
      this.redrawGlow();
      return;
    }
    this.showHint(true);
  }

  private hintBox(): Box | null {
    const l = this.layout;
    const step = this.hintStep;
    if (!step) return null;
    if (step === 'next') return l.next;
    if (step === 'lay') return l.bell;
    if ('add' in step) return l.cards[this.picnic.order.indexOf(step.add)];
    const k = this.slots.indexOf(step.putBack);
    return k < 0 ? null : l.places[k];
  }

  private redrawGlow() {
    this.glow.clear();
    const b = this.hintBox();
    if (!b) return;
    this.glow
      .roundRect(b.x - b.w / 2 - 6, b.y - b.h / 2 - 6, b.w + 12, b.h + 12, 30)
      .stroke({ width: 9, color: swatch.yellow.fill })
      .roundRect(b.x - b.w / 2 - 11, b.y - b.h / 2 - 11, b.w + 22, b.h + 22, 34)
      .stroke({ width: 3, color: swatch.yellow.line });
  }

  // --- drawing ---

  private bounce(node: Container) {
    this.ctx.tw.kill(node.scale);
    node.scale.set(1.12);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  private wobble(node: Container) {
    this.ctx.tw.kill(node);
    node.rotation = 0.07;
    void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.4, ease: ease.outElastic });
  }

  private fly(
    kind: Parameters<typeof tokenArt>[0],
    from: { x: number; y: number },
    to: { x: number; y: number },
    lands: Container,
    delay: number,
    step: number,
    gen: number,
  ) {
    const flyer = tokenArt(kind, TOKEN);
    flyer.position.set(from.x, from.y);
    lands.alpha = 0;
    this.fx.addChild(flyer);
    void this.ctx.tw.wait(delay).then(() => {
      if (gen === this.gen && this.ctx.alive) sfx.marimba(step, 0.3);
    });
    void this.ctx.tw
      .to(flyer, { x: to.x, y: to.y }, { duration: 0.3, delay, ease: ease.outQuad })
      .then(() => {
        if (gen !== this.gen || !this.ctx.alive) return;
        lands.alpha = 1;
        flyer.destroy({ children: true });
      });
  }

  private clearFlyers() {
    for (const f of this.fx.removeChildren()) {
      this.ctx.tw.kill(f);
      f.destroy({ children: true });
    }
  }

  /** A new picnic's jars and cards. */
  private build() {
    const { case: c, order } = this.picnic;
    this.jars.forEach((jar, j) => {
      jar.removeChildren().forEach((ch) => ch.destroy({ children: true }));
      const tokens = new Container();
      tokens.eventMode = 'none';
      this.jarTokens[j] = tokens;
      const art = jarArt(c.ingredients[j]);
      art.eventMode = 'none';
      jar.addChild(art, tokens);
    });
    this.cards.forEach((card, i) => {
      card.removeChildren().forEach((ch) => ch.destroy({ children: true }));
      card.addChild(cardArt(c, c.dishes[order[i]]));
    });
    this.draw();
  }

  /** The jars, the blanket's dishes with their tokens and outlines, and which controls show: always the true state. */
  private draw() {
    this.gen++;
    this.clearFlyers();
    const { case: c, order } = this.picnic;
    const left = remaining(c, this.selection);
    this.jarTokens.forEach((tokens, j) => {
      tokens.removeChildren().forEach((ch) => ch.destroy({ children: true }));
      for (let s = 0; s < Math.max(0, left[j]); s++) {
        const t = tokenArt(c.ingredients[j], TOKEN);
        t.position.set(JAR_SLOTS[s].x, JAR_SLOTS[s].y);
        tokens.addChild(t);
      }
    });
    const got = allocation(c, this.selection);
    this.places.forEach((place, k) => {
      this.placeArtAt[k]?.destroy({ children: true });
      const art = new Container();
      art.eventMode = 'none';
      this.placeArtAt[k] = art;
      place.addChild(art);
      this.slotArt[k] = [];
      const dish = this.slots[k];
      if (dish === null) {
        art.addChild(placeArt());
        return;
      }
      const picture = dishArt(c, c.dishes[dish], 120);
      picture.position.set(0, -40);
      art.addChild(picture);
      const cost = c.dishes[dish].cost;
      const mine = got[this.selection.indexOf(dish)];
      const total = cost[0] + cost[1] + cost[2];
      let i = 0;
      for (let j = 0; j < 3; j++) {
        for (let n = 0; n < cost[j]; n++) {
          const filled = n < mine[j];
          const node = filled ? tokenArt(c.ingredients[j], TOKEN) : outlineArt(c.ingredients[j], TOKEN);
          node.position.set((i - (total - 1) / 2) * 50, 62);
          art.addChild(node);
          this.slotArt[k].push({ jar: j, node, filled });
          i++;
        }
      }
    });
    this.cards.forEach((card, i) => (card.alpha = this.selection.includes(order[i]) ? 0.45 : 1));
    const laid = this.phase === 'laid';
    this.bell.alpha = laid || this.finished ? 0.4 : 1;
    this.nextButton.visible = laid || this.again;
    this.anotherButton.visible = laid && !this.finished;
    if (!laid) for (const f of this.friends) f.visible = false;
    this.redrawGlow();
  }

  resize(v: View) {
    const l = (this.layout = pantryLayout(v.w, v.h, !!v.upright));
    const at = (node: Container, b: { x: number; y: number }) => node.position.set(b.x, b.y);
    const first = l.jars[0],
      last = l.jars[2];
    this.shelf
      .clear()
      .roundRect(first.x - 105, first.y + 78, last.x - first.x + 210, 22, 8)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    this.blanket?.destroy({ children: true });
    this.blanket = picnicBlanket(l.blanket.w, l.blanket.h);
    at(this.blanket, l.blanket);
    this.jars.forEach((jar, j) => at(jar, l.jars[j]));
    this.places.forEach((p, k) => at(p, l.places[k]));
    this.cards.forEach((card, i) => at(card, l.cards[i]));
    this.cushions.forEach((cu, i) => at(cu, l.seats[i]));
    this.friends.forEach((f, i) => f.position.set(l.seats[i].x, l.seats[i].y + 6));
    at(this.bell, l.bell);
    for (const [node, kind, b] of [
      [this.nextButton, 'next', l.next],
      [this.anotherButton, 'another', l.another],
    ] as const) {
      node.removeChildren().forEach((ch) => ch.destroy({ children: true }));
      node.addChild(controlArt(kind, b.w, b.h));
      node.hitArea = new Rectangle(-b.w / 2, -b.h / 2, b.w, b.h);
      at(node, b);
    }
    // Back to front: shelf, blanket, cushions, places, friends, jars, cards, controls, flying tokens, the hint glow.
    this.root.addChild(
      this.shelf,
      this.blanket,
      ...this.cushions,
      ...this.places,
      ...this.friends,
      ...this.jars,
      ...this.cards,
      this.bell,
      this.anotherButton,
      this.nextButton,
      this.fx,
      this.glow,
    );
    if (this.jarTokens.length) this.draw();
    else this.build();
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.fx.children.length) return null;
    if (this.phase === 'laid') return { tap: { on: this.nextButton }, pause: 1.6 };
    const step = this.nextStep();
    if (step === 'lay') return { tap: { on: this.bell }, pause: 1.8 };
    if ('add' in step) return { tap: { on: this.cardOf(step.add) }, pause: 1.1 };
    return { tap: { on: this.places[this.slots.indexOf(step.putBack)] }, pause: 0.9 };
  }

  update(dt: number) {
    this.clock += dt;
    if (this.hintStep) this.glow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 5);
    if (this.finished || this.ctx.demo || this.again || this.phase !== 'plan' || this.idleShown) return;
    this.idle += dt;
    if (this.idle >= IDLE_GLOW) {
      this.idleShown = true;
      this.showHint(false);
    }
  }

  destroy() {
    this.finished = true;
    for (const f of this.friends) this.ctx.untrack(f);
    this.root.destroy({ children: true });
  }
}

const exampleCase = CASES[0];

export const game: GameModule = {
  id: 'picnic-pantry',
  name: 'Picnic Pantry',
  titleLine: 'game.picnic-pantry',
  region: 'cozy-village',
  challenge: 'logic',
  skills: ['planning', 'comparing', 'adding', 'everyday-life'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.stickers,
  upright: true,
  touchDemo: true,
  coplayHint:
    'One of you picks the first dish; the other finds a second that still fits. Then say why the third pair would not.',
  offScreen:
    'With buttons or blocks as pretend ingredients, write two dish cards and see if one pile can make both.',
  hubIcon: () => new WigglyIcon(iconArt(exampleCase)),
  sticker: (seed) => {
    const rng = new Rng(seed);
    const c = rng.pick(CASES);
    return stickerArt(c, rng.pick(menusThatFit(c)));
  },
  create: (ctx) => new PicnicPantry(ctx),
};
