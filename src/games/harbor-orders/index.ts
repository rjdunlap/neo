import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { finish, spring, squash } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { boat, closedDoor, dock, goodArt, icon, workshopArt } from './art';
import { layout, type Box } from './layout';
import {
  arrangement,
  emptyPlan,
  fills,
  generate,
  goodsWords,
  LEVELS,
  listWords,
  describeLevel,
  MAX_MORNINGS,
  nextHint,
  planCounts,
  rowCounts,
  RoundCredit,
  send,
  sendWorking,
  shape,
  stepGood,
  totals,
  WORKSHOPS,
  type Hint,
  type Plan,
} from './logic';

const WORKSHOP_LINES = ['harbor-orders.oar', 'harbor-orders.anchor', 'harbor-orders.bell'] as const;
const GOOD_COLORS = [swatch.orange, swatch.blue, swatch.purple] as const;
const BUTTONS = ['− Morning', '+ Morning', 'Help', 'Send it'] as const;

type Control = { node: Container; face: Container };
const GOODS_PLURAL = ['crates', 'boats', 'lanterns'] as const;

function control(parent: Container, action: () => void): Control {
  const node = new Container();
  const face = new Container();
  face.eventMode = 'none';
  node.addChild(face);
  parent.addChild(node);
  onTap(node, () => {
    squash(face);
    spring(face);
    action();
  });
  return { node, face };
}

function position(control: Control, box: Box, ...children: Container[]) {
  control.node.position.set(box.x, box.y);
  control.node.hitArea = new Rectangle(-box.w / 2, -box.h / 2, box.w, box.h);
  replace(control.face, ...children);
}

function replace(parent: Container, ...children: Container[]) {
  for (const child of parent.removeChildren()) child.destroy({ children: true });
  if (children.length) parent.addChild(...children);
}

function slab(box: Box, color: number, edge: number): Graphics {
  return new Graphics()
    .roundRect(-box.w / 2, -box.h / 2, box.w, box.h, 15)
    .fill(color)
    .stroke({ width: 3, color: edge });
}

function ring(box: Box): Graphics {
  return new Graphics()
    .roundRect(-box.w / 2 + 3, -box.h / 2 + 3, box.w - 6, box.h - 6, 13)
    .stroke({ width: 6, color: swatch.yellow.line })
    .roundRect(-box.w / 2 + 7, -box.h / 2 + 7, box.w - 14, box.h - 14, 10)
    .stroke({ width: 3, color: cream });
}

class Round implements Game {
  private readonly root = new Container();
  private readonly headers = new Container();
  private readonly note = new Container();
  private readonly jetty = new Container();
  private readonly ship = new Container();
  private readonly orderCard: Control;
  private readonly signs: Control[];
  private readonly squares: Control[][];
  private readonly buttons: Control[];
  private readonly board;
  private readonly shape;
  /** The goods on this board, in tapping order. */
  private readonly goods: number[];
  private readonly credit;
  private L;
  private hint: Hint | null = null;
  private noteText = '';
  private revision = 0;
  private autoHint = false;
  private sailing = false;
  private finished = false;
  private voyage = 0;
  private shipment = 0;
  readonly plan: Plan;

  constructor(private readonly ctx: GameContext) {
    this.board = generate(ctx.level, ctx.rng);
    this.shape = shape(ctx.level);
    this.goods = Array.from({ length: this.shape.goods }, (_, good) => good);
    this.credit = new RoundCredit(this.shape.goods);
    this.plan = emptyPlan(this.shape.workshops, ctx.level === 1 ? this.board.solution.mornings : 1);
    this.L = layout(ctx.view, this.shape.workshops, this.shape.goods);
    ctx.stage.addChild(this.root);
    this.root.addChild(this.jetty, this.headers, this.note);
    const hull = boat();
    hull.scale.set(1.7);
    this.ship.addChild(hull);
    this.root.addChild(this.ship);
    this.orderCard = control(this.root, () => this.readOrder());
    const workshops = WORKSHOPS.slice(0, this.shape.workshops);
    this.signs = workshops.map((_, i) => control(this.root, () => this.readSign(i)));
    this.squares = workshops.map((_, i) =>
      Array.from({ length: MAX_MORNINGS }, (_, j) => control(this.root, () => this.choose(i, j))),
    );
    this.buttons = [
      control(this.root, () => this.changeMornings(-1)),
      control(this.root, () => this.changeMornings(1)),
      control(this.root, () => this.askForHint()),
      control(this.root, () => this.sendOrder()),
    ];
    this.noteText = this.idleNote();
    this.resize(ctx.view);
  }

  start() {
    void this.ctx.instruct('harbor-orders.start');
  }

  private get mornings() {
    return this.plan[0].length;
  }

  private get made() {
    return totals(this.board.order, planCounts(this.board.order, this.plan));
  }

  private idleNote() {
    const n = this.board.solution.mornings;
    return this.ctx.level === 1
      ? `The order needs ${n} mornings. Choose what each workshop makes.`
      : `Find the fewest mornings that can fill ${this.shape.goods === 2 ? 'both' : 'all three'} lines of the order.`;
  }

  private readOrder() {
    if (this.finished) return;
    const wanted = this.board.order.wanted.map((n, good) => goodsWords(n, good));
    this.noteText = `The order asks for ${listWords(wanted)}.`;
    this.drawNote();
    void this.ctx.say('harbor-orders.order');
  }

  private readSign(i: number) {
    if (this.finished) return;
    const rates = this.board.order.rates[i].map((n, good) => goodsWords(n, good));
    this.noteText = `The ${WORKSHOPS[i]} can make ${listWords(rates, 'or')} each morning.`;
    this.drawNote();
    void this.ctx.say(WORKSHOP_LINES[i]);
  }

  private changed(square = false) {
    this.revision++;
    this.autoHint = false;
    const row = square && this.hint?.kind === 'row' ? this.hint : null;
    if (row && rowCounts(this.plan[row.row], this.shape.goods).some((n, i) => n !== row.counts[i])) {
      this.noteText = this.rowWorking(row);
    } else {
      this.hint = null;
      this.noteText = this.idleNote();
    }
    this.draw();
  }

  private choose(i: number, j: number) {
    if (this.finished || j >= this.mornings) return;
    const good = stepGood(this.plan[i][j], this.shape.goods);
    this.plan[i][j] = good;
    sfx.pluck(2 + good * 2, 0.13);
    this.changed(true);
  }

  private changeMornings(delta: -1 | 1) {
    if (this.finished || this.ctx.level === 1) return;
    if (this.mornings + delta < 1 || this.mornings + delta > MAX_MORNINGS) {
      sfx.tick();
      return;
    }
    this.plan.forEach((row) => {
      if (delta === -1) row.pop();
      else row.push(null);
    });
    sfx.tick();
    this.changed();
  }

  private sendOrder() {
    if (this.finished) return;
    const result = send(this.board.order, this.board.solution, this.plan);
    if (result.kind === 'ready') {
      void this.shipOrder();
      return;
    }
    const revision = ++this.revision;
    this.hint = null;
    this.noteText = sendWorking(result);
    this.draw();
    this.autoHint = this.credit.miss(this.plan, result) || this.autoHint;
    if (result.kind === 'spare') sfx.boing();
    void this.ctx.say(`harbor-orders.${result.kind}`).then(() => {
      if (this.autoHint && this.ctx.alive && revision === this.revision) {
        this.autoHint = false;
        this.showHint();
      }
    });
  }

  readonly hintLabel = 'Help';

  askForHint() {
    if (this.finished) return;
    this.revision++;
    this.autoHint = false;
    sfx.tick();
    this.showHint();
  }

  private showHint() {
    const { order, solution } = this.board;
    const hint = nextHint(order, solution, this.plan);
    this.hint = hint;
    this.credit.help(this.plan, hint);
    if (hint.kind === 'row') {
      this.noteText = this.rowWorking(hint);
      const revision = this.revision;
      void this.ctx.say(WORKSHOP_LINES[hint.row]).then(() => {
        if (this.ctx.alive && revision === this.revision) void this.ctx.say('harbor-orders.row');
      });
    } else {
      const n = solution.mornings;
      this.noteText = {
        add: `The order needs at least ${n} mornings. Add a morning.`,
        remove: `${n} mornings are enough. Take a morning away.`,
        send: 'This plan fills the order. Send it.',
      }[hint.kind];
      void this.ctx.say(`harbor-orders.${hint.kind}`);
    }
    this.draw();
  }

  private rowWorking(hint: Extract<Hint, { kind: 'row' }>) {
    const empty = this.board.solution.mornings - hint.counts.reduce((a, b) => a + b, 0);
    const jobs = [
      ...hint.counts.flatMap((n, good) => (n ? [`${n} for ${GOODS_PLURAL[good]}`] : [])),
      ...(empty ? [`${empty} left empty`] : []),
    ];
    return `The ${WORKSHOPS[hint.row]}: ${jobs.join(', ')}.`;
  }

  private async shipOrder() {
    this.finished = true;
    this.hint = null;
    const n = this.board.solution.mornings;
    this.noteText = `${n} mornings. No plan fills this order in ${n - 1}.`;
    this.draw();
    const spoken = this.ctx.say('harbor-orders.done');
    for (const good of this.goods) {
      await this.ctx.tw.wait(0.22);
      if (!this.ctx.alive) return;
      this.shipment++;
      sfx.bell(2 + good * 2, 0.24);
      this.drawShip();
    }
    this.sailing = true;
    await spoken;
    if (!this.ctx.alive) return;
    await this.ctx.say('harbor-orders.shortest');
    if (!this.ctx.alive) return;
    this.ctx.pet.cheer();
    this.ctx.finish(tally(this.credit.score));
  }

  private drawShip() {
    const { x, y, w } = this.L.jetty;
    this.ship.position.set(x - w * 0.16 + this.voyage * w * 0.65, y + 5);
    this.ship.alpha = 1 - this.voyage ** 3;
    for (const child of this.ship.children.slice(1)) child.destroy();
    for (const good of this.goods.slice(0, this.shipment)) {
      const cargo = goodArt(good);
      cargo.scale.set(0.56);
      cargo.position.set((good - (this.shape.goods - 1) / 2) * 22, -11);
      this.ship.addChild(cargo);
    }
  }

  update(dt: number) {
    if (!this.sailing || this.voyage >= 1) return;
    this.voyage = Math.min(1, this.voyage + dt / 1.1);
    const { x, y, w } = this.L.jetty;
    this.ship.position.set(x - w * 0.16 + this.voyage * w * 0.65, y + 5);
    this.ship.alpha = 1 - this.voyage ** 3;
  }

  resize(view: View) {
    this.L = layout(view, this.shape.workshops, this.shape.goods);
    const { jetty } = this.L;
    this.jetty.position.set(jetty.x, jetty.y);
    replace(this.jetty, dock(jetty.w, jetty.h));
    this.drawShip();
    this.draw();
  }

  private draw() {
    this.drawOrder();
    this.drawNote();
    const headers = this.L.rows[0].squares.slice(0, this.mornings).map((b, j) => {
      const t = label(`Morning ${j + 1}`, 19);
      t.position.set(b.x, this.L.headersY);
      return t;
    });
    replace(this.headers, ...headers);
    this.L.rows.forEach((row, i) => {
      this.drawSign(i, row.sign);
      row.squares.forEach((box, j) => {
        this.squares[i][j].node.visible = j < this.mornings;
        if (j < this.mornings) this.drawSquare(i, j, box);
      });
    });
    this.drawButtons();
  }

  private drawOrder() {
    const b = this.L.order;
    const made = this.made;
    const face = slab(b, cream, wood.line);
    const title = label('Harbor order', 31);
    title.y = -b.h / 2 + 25;
    const compact = b.w < 400;
    const n = this.shape.goods;
    const items = this.goods.flatMap((good) => {
      const wanted = this.board.order.wanted[good];
      const full = made[good] >= wanted;
      const x = compact ? 0 : (good - (n - 1) / 2) * (n === 2 ? 300 : 205);
      const y = compact ? good * 45 - 10 - (n - 2) * 22 : 18;
      const image = goodArt(good);
      image.position.set(x - 78, y);
      const counts = label(`${made[good]} / ${wanted}`, 34);
      counts.position.set(x + 7, y);
      const status = new Graphics()
        .circle(x + 84, y, 15)
        .fill(full ? swatch.green.light : swatch.white.light);
      if (full) {
        status
          .moveTo(x + 76, y)
          .lineTo(x + 82, y + 6)
          .lineTo(x + 92, y - 6)
          .stroke({ width: 4, color: swatch.green.line, cap: 'round', join: 'round' });
      } else {
        status.circle(x + 84, y, 13).stroke({ width: 2, color: swatch.white.line });
      }
      return [image, counts, status];
    });
    position(this.orderCard, b, face, title, ...items);
  }

  private drawNote() {
    const b = this.L.note;
    const t = label(this.noteText, b.w < 400 ? 22 : 27, ink, '500');
    t.style.wordWrap = true;
    t.style.wordWrapWidth = b.w - 24;
    if (t.height > b.h - 12) t.scale.set((b.h - 12) / t.height);
    this.note.position.set(b.x, b.y);
    replace(this.note, slab(b, swatch.white.light, swatch.teal.line), t);
  }

  private drawSign(i: number, b: Box) {
    const face = slab(b, swatch.teal.line, ink);
    const sign = workshopArt(i);
    sign.position.set(-52, -23);
    const title = label(WORKSHOPS[i], 24, cream);
    title.position.set(13, -23);
    const n = this.shape.goods;
    const rates = this.goods.flatMap((good) => {
      const x = (good - (n - 1) / 2) * (n === 2 ? 76 : 50);
      const image = goodArt(good);
      image.scale.set(n === 2 ? 0.67 : 0.5);
      image.position.set(x - (n === 2 ? 13 : 10), 16);
      const rate = label(String(this.board.order.rates[i][good]), n === 2 ? 25 : 22, cream);
      rate.position.set(x + (n === 2 ? 17 : 12), 16);
      return [image, rate];
    });
    const mark = this.hint?.kind === 'row' && this.hint.row === i;
    position(this.signs[i], b, face, sign, title, ...rates, ...(mark ? [ring(b)] : []));
  }

  private drawSquare(i: number, j: number, b: Box) {
    const good = this.plan[i][j];
    const color = good === null ? swatch.brown : GOOD_COLORS[good];
    const face = slab(b, color.light, color.line);
    if (good === null) {
      position(this.squares[i][j], b, face, closedDoor());
      return;
    }
    const image = goodArt(good);
    image.position.set(0, -13);
    const quantity = label(String(this.board.order.rates[i][good]), 27);
    quantity.y = 22;
    position(this.squares[i][j], b, face, image, quantity);
  }

  private drawButtons() {
    const ready = fills(this.board.order, this.made);
    const colors = [swatch.brown, swatch.teal, swatch.yellow, ready ? swatch.green : swatch.white];
    const hints = ['remove', 'add', null, 'send'];
    this.buttons.forEach((button, i) => {
      const b = this.L.controls[i];
      button.node.visible = this.ctx.level > 1 || i >= 2;
      button.node.alpha =
        (i === 0 && this.mornings === 1) || (i === 1 && this.mornings === MAX_MORNINGS) ? 0.55 : 1;
      const face = finish({ w: b.w, h: b.h, corner: 17 }, colors[i]);
      const text = label(BUTTONS[i], 25);
      const mark = this.hint && hints[i] === this.hint.kind;
      position(button, b, face, text, ...(mark ? [ring(b)] : []));
    });
  }

  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const { mornings, plans } = this.board.solution;
    if (this.mornings < mornings) return this.tap(this.buttons[1]);
    if (this.mornings > mornings) return this.tap(this.buttons[0]);
    if (fills(this.board.order, this.made)) return this.tap(this.buttons[3]);
    const target = plans.find((p) => p.every((row) => row.reduce((a, b) => a + b, 0) === mornings))!;
    for (const [i, row] of this.plan.entries()) {
      const wanted = arrangement(target[i], mornings);
      for (const [j, good] of row.entries()) {
        if (good !== wanted[j]) return this.tap(this.squares[i][j]);
      }
    }
    return null;
  }

  private tap({ node }: Control): TouchIntent {
    return { tap: { on: node, x: node.x, y: node.y }, pause: 0.19 };
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'harbor-orders',
  name: 'Harbor Orders',
  titleLine: 'game.harbor-orders',
  region: 'cozy-village',
  challenge: 'logic',
  skills: [
    'Assign work to fill an order in the fewest mornings',
    'Compare what each workshop gives up to make one good',
  ],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  touchDemo: true,
  hubIcon: () => new WigglyIcon(icon()),
  sticker: () => icon(),
  upright: true,
  create: (ctx) => new Round(ctx),
  coplayHint: 'One person explains their plan. The other looks for a way to send it sooner.',
  offScreen: {
    all: 'Pick two jobs that both people can do. Compare how long each job takes, then decide who does which.',
  },
};
