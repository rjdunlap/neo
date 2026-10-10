import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { makeHazel } from '../../art/lands';
import { cream, grass, swatch, wood } from '../../art/palette';
import { flower, starPoints } from '../../art/shapes';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import { checkStop, HOUSE_NODES, makeTrips, makeWoods, MAP_EDGES, MAP_NODES, planFor, POST_OFFICE, route, routeLength, SHORTER_EDGES, shorterRoutes, walk, woodsTouch, type MailPlan, type Sign, type WoodsHouse } from './logic';

/**
 * Mail Carrier in Wonder Woods: Hazel the squirrel postkeeper hands over letters for the woods. The houses
 * on the picture map show only signs, and the picture key says who lives behind each sign. On the map level
 * the child reads the letter (a neighbor's picture), finds that neighbor in the key, then taps the house with
 * their sign. On the route level two numbered letters come at once: she plans the walk by tapping the house
 * for letter 1, then letter 2, and the green arrow walks the plan along the paths.
 */

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A sign as a picture, about `r` in radius, centered on (0, 0). */
export function signArt(sign: Sign, r = 22): Graphics {
  const g = new Graphics();
  switch (sign) {
    case 'acorn':
      g.ellipse(0, r * 0.25, r * 0.62, r * 0.72).fill(wood.fill).stroke(line(wood.line, 3));
      g.moveTo(-r * 0.78, -r * 0.18).bezierCurveTo(-r * 0.7, -r * 0.85, r * 0.7, -r * 0.85, r * 0.78, -r * 0.18).closePath().fill(swatch.brown.line).stroke(line(swatch.brown.line, 3));
      g.moveTo(0, -r * 0.62).lineTo(r * 0.12, -r * 0.95).stroke(line(swatch.brown.line, 4));
      break;
    case 'mushroom':
      g.roundRect(-r * 0.28, -r * 0.1, r * 0.56, r * 0.95, r * 0.2).fill(cream).stroke(line(wood.line, 3));
      g.moveTo(-r * 0.95, 0).bezierCurveTo(-r * 0.9, -r * 1.05, r * 0.9, -r * 1.05, r * 0.95, 0).closePath().fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      for (const [x, y] of [[-0.45, -0.35], [0.1, -0.6], [0.5, -0.25]]) g.circle(x * r, y * r, r * 0.14).fill(0xffffff);
      break;
    case 'leaf':
      g.moveTo(0, -r).bezierCurveTo(r * 0.95, -r * 0.5, r * 0.7, r * 0.7, 0, r).bezierCurveTo(-r * 0.7, r * 0.7, -r * 0.95, -r * 0.5, 0, -r).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      g.moveTo(0, -r * 0.7).lineTo(0, r * 0.95).stroke(line(swatch.green.line, 3));
      break;
    case 'flower':
      flower(g, r, swatch.pink.fill, swatch.pink.line);
      break;
    case 'star':
      g.poly(starPoints(r, r * 0.45)).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
      break;
  }
  return g;
}

/** A sign on a round white plate, as it hangs on a house and stands in the key. */
function signBadge(sign: Sign, r = 30): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, r).fill(0xffffff).stroke(line(wood.line, 4)), signArt(sign, r * 0.68));
  return c;
}


export class WoodsHouseView extends Container {
  readonly glow = new Graphics().circle(0, -30, 78).fill({ color: 0xfff3a0, alpha: 0.9 });
  readonly flag = new Container();
  readonly resident: Critter;

  constructor(readonly house: WoodsHouse, readonly index: number) {
    super();
    this.glow.visible = false;
    const g = new Graphics();
    g.rect(-42, -54, 84, 60).fill(cream).stroke(line(wood.line, 4));
    g.poly([-52, -50, 0, -96, 52, -50]).fill(swatch.brown.fill).stroke(line(wood.line, 4));
    g.roundRect(-13, -28, 26, 34, 6).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 3));
    const badge = signBadge(house.sign, 27);
    badge.position.set(0, -112);
    this.resident = new Critter(CRITTERS[house.resident]);
    this.resident.scale.set(0.2);
    this.resident.position.set(34, 6);
    this.resident.visible = false;
    this.flag.position.set(-88, -64);
    this.addChild(this.glow, g, this.resident, badge, this.flag);
    this.hitArea = new Circle(0, -50, 72);
  }

  /** A planned stop's number on a little flag, or none. */
  setFlag(n: number | null) {
    this.flag.removeChildren().forEach((c) => c.destroy());
    if (n === null) return;
    const g = new Graphics().moveTo(0, 0).lineTo(0, -46).stroke(line(wood.line, 4)).roundRect(0, -46, 36, 26, 5).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 3));
    const t = label(String(n), 20, 0xffffff);
    t.position.set(18, -33);
    this.flag.addChild(g, t);
  }

  async peek(tw: GameContext['tw'], happy: boolean) {
    this.resident.visible = true;
    this.resident.setMood(happy ? 'happy' : 'surprised', 1.2);
    this.resident.scale.set(0.05);
    await tw.to(this.resident.scale, { x: 0.2, y: 0.2 }, { duration: 0.25, ease: ease.outBack });
    if (happy) this.resident.cheer();
  }
}

interface KeyRow {
  house: number;
  node: Container;
  glow: Graphics;
}

export class WoodsMail implements Game {
  readonly plan: MailPlan;
  readonly woods: WoodsHouse[];
  readonly trips: number[][];
  readonly houses: WoodsHouseView[] = [];
  readonly key: KeyRow[] = [];
  readonly go = new RoundButton(playIcon(), swatch.green, 48, () => void this.walkPlan());
  readonly letters = new Container();
  /** The trip being delivered. */
  index = -1;
  /** Houses tapped into the plan so far (route level). */
  planned: number[] = [];
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly board = new Container();
  private readonly paper = new Graphics();
  private readonly paths = new Graphics();
  private readonly preview = new Graphics();
  private readonly decor = new Container();
  private readonly office = new Container();
  private readonly keyCard = new Graphics();
  private readonly routeChoicesLayer = new Container();
  private readonly routeChoiceButtons: { node: Container; glow: Graphics }[] = [];
  private shorterHouse: number | null = null;
  private readonly walker: Critter;
  private readonly hazel = makeHazel();
  private wrongs = 0;
  private rect = { x: 0, y: 0, w: 0, h: 0 };
  /** The node the walker stands at, unless it is on its way somewhere. */
  private walkerAt = POST_OFFICE;
  private walking = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.woods = makeWoods(ctx.rng);
    this.trips = makeTrips(this.plan, ctx.rng);
    this.walker = new Critter(ctx.petSpec);
    this.walker.scale.set(0.2);
    ctx.track(this.walker);
    this.decor.eventMode = 'none';
    this.paths.eventMode = 'none';
    this.preview.eventMode = 'none';
    const tree = new Graphics()
      .roundRect(-34, -90, 68, 96, 18).fill(wood.fill).stroke(line(wood.line, 5)).ellipse(0, -36, 16, 24).fill(wood.line)
      .circle(-34, -100, 34).circle(0, -126, 40).circle(34, -100, 34).fill(swatch.green.fill);
    this.hazel.node.scale.set(0.24);
    this.hazel.node.position.set(-62, 8);
    ctx.track(this.hazel.critter);
    this.office.addChild(tree, this.hazel.node);
    this.office.eventMode = 'none';
    this.board.addChild(this.paper, this.decor, this.paths, this.preview, this.office);
    this.woods.forEach((house, i) => {
      const h = new WoodsHouseView(house, i);
      onTap(h, () => this.tapHouse(i), { cooldown: 350 });
      ctx.track(h.resident);
      this.houses.push(h);
      this.board.addChild(h);
    });
    this.board.addChild(this.walker);
    ctx.stage.addChild(this.board, this.keyCard, this.routeChoicesLayer, this.letters, this.go);
    // The picture key: who lives behind each sign. Tapping a row says it.
    const rows = this.woods.map((house, i) => ({ house, i })).sort((a, b) => a.house.resident.localeCompare(b.house.resident));
    for (const { house, i } of rows) {
      const node = new Container();
      const glow = new Graphics().roundRect(-118, -42, 236, 84, 18).fill({ color: 0xfff3a0, alpha: 0.95 });
      glow.visible = false;
      const who = new Critter(CRITTERS[house.resident]);
      who.alive = false;
      who.scale.set(0.27);
      who.position.set(-62, 30);
      const arrow = new Graphics().moveTo(-12, 0).lineTo(14, 0).stroke(line(wood.line, 5)).poly([10, -9, 22, 0, 10, 9]).fill(wood.line);
      const badge = signBadge(house.sign, 30);
      badge.position.set(62, 0);
      node.addChild(glow, who, arrow, badge);
      node.hitArea = new Rectangle(-118, -45, 236, 90);
      onTap(node, () => void this.ctx.say('mail.key', { animal: house.resident, sign: house.sign }), { cooldown: 500 });
      this.key.push({ house: i, node, glow });
      ctx.stage.addChild(node);
    }
    if (this.plan.mode === 'shorter') this.createRouteChoiceButtons();
    this.go.visible = false;
  }

  start() {
    void this.next();
  }

  /** The map fills the left of the screen, clear of the pet's corner; the key and letters stand on the right. */
  resize(v: View) {
    const keyW = 260;
    const x = 150;
    const y = 104;
    const w = v.w - keyW - 40 - x;
    const h = v.h - 24 - y;
    this.rect = { x: 0, y: 0, w, h };
    this.board.position.set(x, y);
    this.paper.clear().roundRect(0, 0, w, h, 26).fill(0xf6ecd6).stroke(line(wood.line, 6));
    this.drawDecor();
    this.paths.clear();
    for (const [a, b] of MAP_EDGES) {
      const p = this.at(a);
      const q = this.at(b);
      this.paths.moveTo(p.x, p.y).lineTo(q.x, q.y);
    }
    if (this.plan.mode === 'shorter') {
      const [a, b] = SHORTER_EDGES.at(-1)!;
      const p = this.at(a), q = this.at(b);
      this.paths.moveTo(p.x, p.y).lineTo(q.x, q.y);
    }
    if (this.plan.mode === 'shorter') {
      for (const [a, b, stones] of SHORTER_EDGES) {
        const p = this.at(a), q = this.at(b);
        for (let k = 1; k <= stones; k++) {
          const t = k / (stones + 1);
          this.paths.circle(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, 5).fill(wood.line);
        }
      }
    }
    this.paths.stroke({ width: 22, color: wood.light, cap: 'round', join: 'round' });
    for (const [a, b] of MAP_EDGES) {
      const p = this.at(a);
      const q = this.at(b);
      const n = Math.max(1, Math.round(Math.hypot(q.x - p.x, q.y - p.y) / 34));
      for (let k = 1; k < n; k++) this.paths.circle(p.x + ((q.x - p.x) * k) / n, p.y + ((q.y - p.y) * k) / n, 3).fill(wood.line);
    }
    this.office.position.copyFrom(this.at(POST_OFFICE));
    this.office.y += 40;
    this.houses.forEach((hv, i) => {
      const p = this.at(HOUSE_NODES[i]);
      hv.position.set(p.x, p.y + 40);
    });
    if (!this.walking) this.walker.position.copyFrom(this.feet(this.walkerAt));
    this.drawPreview();
    const kx = v.w - keyW / 2 - 20;
    const top = 250;
    const rowH = Math.min(100, (v.h - 30 - top) / this.key.length);
    this.keyCard.clear().roundRect(kx - keyW / 2, top - 30, keyW, rowH * this.key.length + 40, 22).fill(0xfffdf6).stroke(line(wood.line, 5));
    this.key.forEach((r, i) => r.node.position.set(kx, top + rowH * (i + 0.5) - 10));
    this.routeChoiceButtons.forEach((b, i) => b.node.position.set(kx, v.h * (i === 0 ? 0.62 : 0.81)));
    this.letters.position.set(kx, 118);
    this.go.position.set(x + w - 70, y + h - 70);
  }

  update() {}

  /** The ghost finger: tap the house of the letter's neighbor; on the route level plan each stop in letter order, then the walk button. */
  autotouch(): TouchIntent | null {
    const trip = this.trip;
    if (this.busy || this.finished || !trip) return null;
    const touch = woodsTouch(this.plan.mode, trip, this.planned);
    if (!touch) return null;
    if (this.plan.mode === 'shorter') {
      if (this.shorterHouse === null) return { tap: { on: this.houses[trip[0]], y: -50 } };
      const button = this.routeChoiceButtons[0]?.node;
      return button ? { tap: { on: button } } : null;
    }
    return touch === 'go' ? { tap: { on: this.go } } : { tap: { on: this.houses[touch.house], y: -50 } };
  }

  destroy() {}

  /** A map node in board coordinates, inside a margin so houses stay on the paper. */
  private at(n: number) {
    const m = 70;
    const { w, h } = this.rect;
    return { x: m + MAP_NODES[n].x * (w - 2 * m), y: m + 40 + MAP_NODES[n].y * (h - 2 * m - 40) };
  }

  /** Where the walker stands at a node: at the post office's door, or on the path in front of a house. */
  private feet(n: number) {
    const p = this.at(n);
    return n === POST_OFFICE ? { x: p.x + 40, y: p.y + 44 } : { x: p.x - 52, y: p.y + 44 };
  }

  private drawDecor() {
    this.decor.removeChildren().forEach((c) => c.destroy());
    const g = new Graphics();
    const { w, h } = this.rect;
    // A stream across the bottom corner and some pines and flowers between the paths.
    g.moveTo(w * 0.62, h).bezierCurveTo(w * 0.7, h * 0.86, w * 0.92, h * 0.9, w, h * 0.78).stroke({ width: 26, color: swatch.blue.light, cap: 'round' });
    for (const [fx, fy] of [[0.3, 0.06], [0.6, 0.3], [0.95, 0.3], [0.05, 0.45], [0.36, 0.72], [0.75, 0.7], [0.62, 0.05]]) {
      const x = fx * w;
      const y = fy * h + 30;
      g.poly([x - 18, y, x, y - 40, x + 18, y]).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 3));
      g.rect(x - 3, y, 6, 8).fill(wood.line);
    }
    for (const [fx, fy] of [[0.22, 0.88], [0.8, 0.86], [0.55, 0.42], [0.03, 0.92]]) g.ellipse(fx * w, fy * h, 30, 12).fill(grass);
    this.decor.addChild(g);
  }

  /** The planned walk, drawn as a dotted purple line. */
  private drawPreview() {
    this.preview.clear();
    if (this.plan.mode === 'shorter' && this.shorterHouse !== null) {
      const [short, long] = shorterRoutes(this.shorterHouse);
      this.drawPath(short, 0x36a76c, 7);
      this.drawPath(long, 0xd29a32, 7);
      return;
    }
    if (this.plan.mode !== 'route' || !this.planned.length) return;
    const r = route(this.planned);
    for (let i = 1; i < r.length; i++) {
      const p = this.at(r[i - 1]);
      const q = this.at(r[i]);
      const n = Math.max(1, Math.round(Math.hypot(q.x - p.x, q.y - p.y) / 22));
      for (let k = 0; k < n; k++) this.preview.circle(p.x + ((q.x - p.x) * k) / n, p.y + ((q.y - p.y) * k) / n, 6).fill(swatch.purple.fill);
    }
  }

  get trip(): number[] | undefined {
    return this.trips[this.index];
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.planned = [];
    this.go.visible = false;
    for (const h of this.houses) {
      h.glow.visible = false;
      h.setFlag(null);
    }
    for (const r of this.key) r.glow.visible = false;
    this.drawPreview();
    const trip = this.trip;
    if (!trip) return void this.finale();
    this.drawLetters(trip);
    this.letters.scale.set(0);
    sfx.whoosh();
    await this.ctx.tw.to(this.letters.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    this.busy = false;
    const who = (i: number) => this.woods[i].resident;
    if (this.plan.mode === 'map') {
      if (this.index === 0) await this.ctx.instruct('mail.map', { animal: who(trip[0]) });
      else await this.ctx.instruct('mail.map-for', { animal: who(trip[0]) });
    } else if (this.plan.mode === 'shorter') {
      await this.ctx.instruct('mail.shorter-for', { animal: who(trip[0]) });
    } else {
      if (this.index === 0) await this.ctx.say('mail.route');
      await this.ctx.instruct('mail.route-for', { first: who(trip[0]), second: who(trip[1]) });
    }
  }

  private drawLetters(trip: number[]) {
    this.letters.removeChildren().forEach((c) => c.destroy({ children: true }));
    const two = trip.length > 1;
    trip.forEach((h, i) => {
      const env = new Container();
      const w = two ? 118 : 200;
      const g = new Graphics().roundRect(-w / 2, -54, w, 108, 12).fill(0xffffff).stroke(line(0xb9c6d1, 5));
      g.moveTo(-w / 2, -54).lineTo(0, 4).lineTo(w / 2, -54).stroke(line(0xd6dde4, 4));
      const who = new Critter(CRITTERS[this.woods[h].resident]);
      who.alive = false;
      who.scale.set(0.26);
      who.position.set(0, 50);
      env.addChild(g, who);
      if (two) {
        const n = new Graphics().circle(-w / 2 + 6, -50, 18).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 3));
        const t = label(String(i + 1), 22, 0xffffff);
        t.position.set(-w / 2 + 6, -50);
        env.addChild(n, t);
      }
      env.x = two ? (i - 0.5) * 128 : 0;
      this.letters.addChild(env);
    });
  }

  private tapHouse(i: number) {
    const trip = this.trip;
    if (!trip || this.busy || this.finished) return;
    if (this.plan.mode === 'shorter') return void this.chooseShorterHouse(i, trip[0]);
    if (this.plan.mode === 'map') return void this.deliverOne(i, trip[0]);
    this.planStop(i, trip);
  }

  private async chooseShorterHouse(index: number, target: number) {
    if (this.shorterHouse !== null || this.busy) return;
    const h = this.houses[index];
    if (index !== target) {
      this.miss();
      await h.peek(this.ctx.tw, false);
      await this.ctx.say('mail.map-wrong', { sign: h.house.sign, resident: h.house.resident, animal: this.woods[target].resident });
      h.resident.visible = false;
      if (this.wrongs >= 2) this.hint(target);
      return;
    }
    this.shorterHouse = index;
    this.keyCard.visible = false;
    this.key.forEach((r) => { r.node.visible = false; r.glow.visible = false; });
    this.routeChoiceButtons.forEach((b) => { b.node.visible = true; b.glow.visible = false; });
    const [short, long] = shorterRoutes(index);
    this.drawPreview();
    const shortStones = routeLength(short), longStones = routeLength(long);
    for (let i = 0; i < 2; i++) {
      const node = this.routeChoiceButtons[i].node;
      const title = node.children[2] as ReturnType<typeof label>;
      title.text = `${i === 0 ? 'Short' : 'Long'} · ${i === 0 ? shortStones : longStones} stones`;
      const g = new Graphics();
      const count = i === 0 ? shortStones : longStones;
      const gap = Math.min(22, 160 / count);
      for (let j = 0; j < count; j++) g.circle((j - (count - 1) / 2) * gap, 20, 5).fill(i === 0 ? 0x36a76c : 0xd29a32);
      node.addChild(g);
    }
    await this.ctx.instruct('mail.shorter', { animal: this.woods[target].resident });
  }

  private drawPath(path: number[], color: number, width: number) {
    for (let i = 1; i < path.length; i++) {
      const p = this.at(path[i - 1]), q = this.at(path[i]);
      this.preview.moveTo(p.x, p.y).lineTo(q.x, q.y).stroke({ color, width, cap: 'round' });
    }
  }

  private async chooseShorterPath(choice: number) {
    if (this.busy || this.shorterHouse === null) return;
    const [short, long] = shorterRoutes(this.shorterHouse);
    if (choice !== 0) {
      this.miss();
      sfx.boing();
      await this.ctx.say('mail.shorter-hint', { n: routeLength(short), m: routeLength(long) });
      if (this.wrongs >= 2) {
        this.hints++;
        this.routeChoiceButtons[0].glow.visible = true;
        this.wrongs = 0;
      }
      return;
    }
    this.busy = true;
    this.routeChoiceButtons[0].glow.visible = true;
    this.routeChoiceButtons.forEach((b) => { b.node.eventMode = 'none'; });
    for (let i = 1; i < short.length; i++) {
      const edge = SHORTER_EDGES.find(([a, b]) => (a === short[i - 1] && b === short[i]) || (b === short[i - 1] && a === short[i]));
      await this.walkTo(short.slice(i - 1, i + 1), 0.32 * (edge?.[2] ?? 1));
    }
    await this.welcome(this.shorterHouse);
    await this.walkTo(walk(HOUSE_NODES[this.shorterHouse], POST_OFFICE), 0.12);
    this.routeChoicesLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.routeChoiceButtons.length = 0;
    this.createRouteChoiceButtons();
    this.shorterHouse = null;
    this.keyCard.visible = true;
    this.key.forEach((r) => { r.node.visible = true; });
    this.preview.clear();
    this.busy = false;
    await this.next();
  }

  private createRouteChoiceButtons() {
    const options = [0, 1].map((i) => {
      const node = new Container();
      const glow = new Graphics().roundRect(-118, -54, 236, 108, 22).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.visible = false;
      const plate = new Graphics().roundRect(-112, -50, 224, 100, 20).fill(0xfffdf6).stroke(line(wood.line, 5));
      const title = label(i === 0 ? 'Short path' : 'Long path', 23, wood.line);
      title.y = -23;
      node.addChild(glow, plate, title);
      node.hitArea = new Rectangle(-118, -54, 236, 108);
      onTap(node, () => void this.chooseShorterPath(i), { cooldown: 350 });
      this.routeChoicesLayer.addChild(node);
      return { node, glow };
    });
    this.routeChoiceButtons.push(...options);
    this.routeChoiceButtons.forEach((b) => { b.node.visible = false; b.node.eventMode = 'static'; });
    this.layoutRouteChoices();
  }

  private layoutRouteChoices() {
    const keyW = 260;
    const kx = this.ctx.view.w - keyW / 2 - 20;
    this.routeChoiceButtons.forEach((b, i) => b.node.position.set(kx, this.ctx.view.h * (i === 0 ? 0.62 : 0.81)));
  }

  /** Map level: the right house gets a walk and a happy neighbor; a wrong one says who lives there. */
  private async deliverOne(i: number, target: number) {
    const h = this.houses[i];
    if (i !== target) {
      this.miss();
      void h.peek(this.ctx.tw, false);
      const t = this.woods[target];
      await this.ctx.say('mail.map-wrong', { sign: h.house.sign, resident: h.house.resident, animal: t.resident });
      h.resident.visible = false;
      if (this.wrongs >= 2) this.hint(target);
      return;
    }
    this.busy = true;
    await this.walkTo([...walk(POST_OFFICE, HOUSE_NODES[i])]);
    await this.welcome(i);
    await this.walkTo(walk(HOUSE_NODES[i], POST_OFFICE), 0.12);
    await this.next();
  }

  /** Route level: tap houses in letter order to plan; tap a planned house to take it (and later stops) out. */
  private planStop(i: number, trip: number[]) {
    const h = this.houses[i];
    const check = checkStop(trip, this.planned, i);
    if (check === 'planned') {
      this.planned = this.planned.slice(0, this.planned.indexOf(i));
      sfx.whoosh();
      void this.ctx.say('mail.route-undo');
    } else if (check === 'ok') {
      this.planned.push(i);
      sfx.pop(6 + this.planned.length);
      this.wrongs = 0;
      for (const x of this.houses) x.glow.visible = false;
      for (const r of this.key) r.glow.visible = false;
      if (this.planned.length === trip.length) {
        this.go.visible = true;
        void this.ctx.instruct('mail.route-ready');
      }
    } else {
      this.miss();
      if (check === 'later') void this.ctx.say('mail.route-later', { animal: h.house.resident, n: trip.indexOf(i) + 1 });
      else {
        void h.peek(this.ctx.tw, false).then(() => this.ctx.tw.wait(1.2)).then(() => (h.resident.visible = false));
        void this.ctx.say('mail.route-nobody', { resident: h.house.resident });
      }
      if (this.wrongs >= 2) this.hint(trip[this.planned.length]);
    }
    this.houses.forEach((x, k) => x.setFlag(this.planned.includes(k) ? this.planned.indexOf(k) + 1 : null));
    this.go.visible = this.planned.length === trip.length;
    this.drawPreview();
  }

  private miss() {
    this.misses++;
    this.wrongs++;
    sfx.boing();
  }

  /** Two misses: the key row and the house for the letter that's due both glow. */
  private hint(house: number) {
    this.hints++;
    this.wrongs = 0;
    this.houses[house].glow.visible = true;
    const row = this.key.find((r) => r.house === house);
    if (row) row.glow.visible = true;
    const t = this.woods[house];
    void this.ctx.say(this.plan.mode === 'route' ? 'mail.route-hint' : 'mail.map-hint', { animal: t.resident, sign: t.sign, n: this.planned.length + 1 });
  }

  /** Walks the plan along the paths, delivering at each stop in turn. */
  private async walkPlan() {
    const trip = this.trip;
    if (!trip || this.busy || this.planned.length !== trip.length) return;
    this.busy = true;
    this.go.visible = false;
    let at = POST_OFFICE;
    for (const i of this.planned) {
      await this.walkTo(walk(at, HOUSE_NODES[i]));
      at = HOUSE_NODES[i];
      await this.welcome(i);
      this.houses[i].setFlag(null);
    }
    await this.walkTo(walk(at, POST_OFFICE), 0.12);
    await this.next();
  }

  private async walkTo(nodes: number[], perEdge = 0.32) {
    this.walking = true;
    for (const n of nodes.slice(1)) {
      const p = this.feet(n);
      this.walker.hop(0.5);
      await this.ctx.tw.to(this.walker, { x: p.x, y: p.y }, { duration: perEdge, ease: ease.inOutSine });
      this.walkerAt = n;
    }
    this.walking = false;
  }

  private async welcome(i: number) {
    const h = this.houses[i];
    sfx.pop(8);
    await h.peek(this.ctx.tw, true);
    const p = h.getGlobalPosition();
    const local = this.ctx.stage.toLocal(p);
    this.ctx.particles.burst(local.x, local.y - 100, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 6, speed: [60, 140], gravity: -40, size: [0.3, 0.45] });
    await this.ctx.say('mail.thanks');
    h.resident.visible = false;
    h.glow.visible = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    this.hazel.critter.cheer();
    for (const h of this.houses) void h.peek(this.ctx.tw, true);
    await this.ctx.say('mail.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
