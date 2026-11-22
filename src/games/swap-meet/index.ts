import { Container, EventBoundary, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { GhostFinger } from '../../engine/ghost';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { friendArt, itemArt, stallArt } from './art';
import {
  LEVELS,
  accepted,
  deadEnd,
  goal,
  hint,
  hintLine,
  identity,
  layout,
  NAMES,
  netTrades,
  roundFor,
  routeReply,
  STALL,
  start,
  step,
  Tally,
  type Action,
  type Frame,
  type Friend,
  type Item,
  type Point,
} from './logic';
interface ObjectNode {
  source: Friend | number | null;
  item: Item;
  node: Container;
  /** Where it sits: `f<i>` a friend's panel, `b<i>` a basket tray, `s<i>` a stall shelf place. */
  at: string;
  drag?: DragHandle;
}
/** What each place holds in a frame, so animations match by place (the shelf's kite and Frog's kite are one kind). */
function places(f: Frame): Map<string, Item> {
  const m = new Map<string, Item>();
  f.friends.forEach((t, i) => m.set(`f${i}`, t.hold));
  f.basket.forEach((b, i) => m.set(`b${i}`, b.hold));
  f.stall?.shelf.forEach((x, i) => x && m.set(`s${i}`, x));
  return m;
}
/** Round-local objects only. Transactions settle after both objects have visibly crossed. */
class SwapMeet implements Game {
  readonly round;
  state;
  readonly tally = new Tally();
  readonly root = new Container();
  readonly board = new Container();
  readonly toys = new Container();
  readonly glow = new Graphics();
  readonly undo: RoundButton;
  readonly help: RoundButton;
  readonly companion;
  readonly ghost;
  readonly backdrop;
  boxes;
  objects: ObjectNode[] = [];
  panels: Container[] = [];
  busy = false;
  finished = false;
  alive = true;
  private view: View;
  private clock = 0;
  private cancelled = false;
  private owner: number | null = null;
  private hintTask = '';
  private asked = false;
  private generation = 0;
  /** Each stage's net trades (level 6 compares them), and the solver's next action cached by state. */
  private counts = [0, 0];
  private cached = { key: '', action: null as Action | null };
  readonly cards = new Container();
  /** The two route cards while level 6's question waits for a tap; the bot taps the one with fewer marks. */
  private routes: { card: Container; marks: number }[] = [];
  /** Resolves level 6's question once she taps a card; null when no question is waiting. */
  private pending: (() => void) | null = null;
  get misses() {
    return this.tally.misses;
  }
  get hints() {
    return this.tally.hints;
  }
  private cancel = (e: Event) => {
    if (e instanceof PointerEvent && this.owner !== null && e.pointerId !== this.owner) return;
    this.cancelled = true;
  };
  private outside = (e: PointerEvent) => {
    if (this.owner !== null && e.pointerId !== this.owner) return;
    const canvas = this.ctx.renderer.canvas,
      b = canvas.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)
      this.cancel(e);
  };
  constructor(private ctx: GameContext) {
    this.round = roundFor(ctx.level, ctx.rng);
    this.state = start(this.round);
    this.view = ctx.view;
    this.boxes = layout(this.view, this.state.frame.friends.length, this.state.frame.basket.length);
    this.backdrop = new Backdrop(
      {
        sky: [0xffe2c4, cream],
        hills: [swatch.green.light, 0xbfe39a],
        horizon: 0.45,
        clouds: 2,
        sun: true,
        seed: 127,
      },
      this.view,
    );
    this.undo = new RoundButton(arrowIcon(-1), swatch.blue, 50, () => {
      void this.perform({ undo: true });
    });
    const bulb = new Graphics()
      .circle(0, -8, 20)
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: ink })
      .moveTo(-13, 17)
      .lineTo(13, 17)
      .moveTo(-10, 28)
      .lineTo(10, 28)
      .stroke({ width: 6, color: ink });
    this.help = new RoundButton(bulb, swatch.yellow, 50, () => this.askForHint());
    this.companion = ctx.companion();
    this.companion.scale.set(0.36);
    this.companion.eventMode = 'none';
    ctx.track(this.companion);
    this.ghost = new GhostFinger(this.root, new EventBoundary(this.root));
    ctx.stage.addChild(this.backdrop, this.root);
    this.root.addChild(
      this.board,
      this.toys,
      this.glow,
      this.companion,
      this.undo,
      this.help,
      this.cards,
      this.ghost.hand,
    );
    this.glow.eventMode = 'none';
    // Capture precedes drag.ts's window fallback, which otherwise treats native cancel as a drop.
    this.ctx.listen(window, 'pointercancel', this.cancel, true);
    this.ctx.listen(window, 'pointerup', this.outside, true);
    this.ctx.listen(window, 'blur', this.cancel);
  }
  start() {
    this.draw();
    this.instruct();
  }
  private instruct() {
    const f = this.state.frame.friends[0],
      level = this.round.level,
      goalThing = { goal: this.round.goal ?? '' };
    if (level === 1)
      void this.ctx.instruct('swap-meet.one', { friend: f.id, thing: f.want, returned: f.hold });
    else if (this.state.frame.stall?.open) void this.ctx.instruct('swap-meet.stall-open');
    else if (level >= 4)
      void this.ctx.instruct(
        (['swap-meet.four', 'swap-meet.five', 'swap-meet.six'] as const)[level - 4],
        goalThing,
      );
    else void this.ctx.instruct(level === 2 ? 'swap-meet.two' : 'swap-meet.three');
  }
  /** The solver's next action, searched once per state rather than every frame. */
  private next(): Action | null {
    const key = identity(this.state);
    if (key !== this.cached.key) this.cached = { key, action: hint(this.round, this.state) };
    return this.cached.action;
  }
  private at(source: Friend | number): Point {
    return typeof source === 'number'
      ? this.boxes.basket[source]
      : this.boxes.friends[this.state.frame.friends.findIndex((f) => f.id === source)];
  }
  private point(at: string): Point {
    const i = Number(at.slice(1));
    return at[0] === 'f' ? this.boxes.friends[i] : at[0] === 'b' ? this.boxes.basket[i] : this.boxes.shelf[i];
  }
  /** Where an action's two ends are, for the glow and the ghost finger. */
  private ends(a: Action): Point[] {
    if ('undo' in a) return [this.boxes.undo];
    if ('sell' in a) return [this.boxes.basket[0], this.boxes.stall!];
    if ('buy' in a) return [this.boxes.basket[0], this.boxes.shelf[a.buy]];
    return [this.at(a.from), this.at(a.to)];
  }
  private inspect(id: Friend) {
    const f = this.state.frame.friends.find((f) => f.id === id)!;
    void this.ctx.say('swap-meet.inspect', { friend: id, thing: f.hold, want: f.want });
  }
  private clear() {
    this.owner = null;
    const kill = (n: Container) => {
      this.ctx.tw.kill(n);
      this.ctx.tw.kill(n.scale);
      for (const child of n.children) kill(child);
    };
    for (const layer of [this.board, this.toys]) kill(layer);
    for (const o of this.objects) {
      o.drag?.destroy();
      this.ctx.tw.kill(o.node);
      this.ctx.tw.kill(o.node.scale);
    }
    this.objects = [];
    for (const layer of [this.board, this.toys, this.cards])
      for (const n of layer.removeChildren()) n.destroy({ children: true });
    this.panels = [];
  }
  private object(item: Item, at: Point, source: Friend | number | null, where: string) {
    const n = new Container();
    n.addChild(itemArt(item));
    n.hitArea = new Rectangle(-60, -60, 120, 120);
    n.position.set(at.x, at.y);
    this.toys.addChild(n);
    const o: ObjectNode = { item, node: n, source, at: where };
    this.objects.push(o);
    if (source !== null) {
      o.drag = draggable(n, this.ctx.tw, {
        onPick: () => {
          this.cancelled = false;
          sfx.tick();
          if (typeof source === 'string') this.inspect(source);
          else void this.ctx.say('swap-meet.object', { thing: item });
        },
        onDrop: (x, y) => this.drop(o, x, y),
      });
      n.on('pointerdown', (e) => {
        if (o.drag?.dragging && this.owner === null) this.owner = e.pointerId;
      });
    } else n.eventMode = 'none';
  }
  private draw() {
    this.clear();
    this.board.visible = true;
    const f = this.state.frame;
    this.boxes = layout(this.view, f.friends.length, f.basket.length, !!f.stall);
    f.friends.forEach((trader, i) => {
      const at = this.boxes.friends[i],
        panel = new Container();
      panel.position.set(at.x, at.y);
      panel.addChild(
        new Graphics()
          .roundRect(-75, -72, 150, 145, 25)
          .fill(trader.done ? swatch.green.light : cream)
          .stroke({ width: 5, color: trader.done ? swatch.green.line : wood.line }),
      );
      const face = friendArt(trader.id);
      face.position.set(-72, -45);
      if (trader.id === 'frog') face.scale.set(0.8);
      panel.addChild(face);
      const bubble = new Container();
      bubble.position.set(83, -79);
      bubble.addChild(
        new Graphics()
          .roundRect(-51, -51, 102, 102, 25)
          .fill(0xffffff)
          .stroke({ width: 4, color: swatch.blue.line }),
      );
      const want = itemArt(trader.want);
      want.scale.set(0.75);
      bubble.addChild(want);
      bubble.eventMode = 'none';
      panel.addChild(bubble);
      if (trader.done) {
        const check = checkIcon(swatch.green.line);
        check.position.set(75, 48);
        panel.addChild(check);
      }
      panel.hitArea = new Rectangle(-75, -72, 150, 145);
      onTap(panel, () => this.inspect(trader.id), { cooldown: 300 });
      this.board.addChild(panel);
      this.panels.push(panel);
      this.object(trader.hold, at, this.round.level === 3 && !trader.done ? trader.id : null, `f${i}`);
    });
    f.basket.forEach((slot, i) => {
      const p = this.boxes.basket[i];
      const tray = new Graphics()
        .roundRect(p.x - 75, p.y - 70, 150, 140, 22)
        .fill(wood.light)
        .stroke({ width: 5, color: wood.line });
      tray.eventMode = 'none';
      this.board.addChild(tray);
      this.object(slot.hold, p, slot.active ? i : null, `b${i}`);
    });
    if (f.stall && this.boxes.stall) {
      // The shut stall is only a picture (no hit target); open, its goods are full-size drop targets for the purse.
      const body = stallArt(STALL.w, STALL.h, f.stall.open);
      body.position.set(this.boxes.stall.x, this.boxes.stall.y);
      this.board.addChild(body);
      if (f.stall.open)
        f.stall.shelf.forEach((x, i) => {
          const p = this.boxes.shelf[i];
          if (x) this.object(x, p, null, `s${i}`);
          else
            this.board.addChild(
              new Graphics().circle(p.x, p.y, 40).stroke({ width: 4, color: wood.line, alpha: 0.35 }),
            );
        });
    }
    f.rewards.forEach((item, i) => {
      const n = itemArt(item);
      n.scale.set(0.42);
      n.position.set(this.boxes.rewards.x + i * 75, this.boxes.rewards.y);
      this.board.addChild(n);
    });
    this.companion.visible = !!this.round.goal;
    if (this.companion.visible) {
      this.companion.position.set(this.boxes.goal.x - 90, this.boxes.goal.y + 45);
      const goalNode = itemArt(this.round.goal!);
      goalNode.position.set(this.boxes.goal.x, this.boxes.goal.y - 35);
      this.board.addChild(
        new Graphics()
          .roundRect(this.boxes.goal.x - 62, this.boxes.goal.y - 100, 124, 130, 20)
          .fill(cream)
          .stroke({ width: 4, color: swatch.teal.line }),
        goalNode,
      );
    }
    this.undo.position.set(this.boxes.undo.x, this.boxes.undo.y);
    this.undo.alpha = this.state.history.length ? 0.95 : 0.4;
    this.help.position.set(this.boxes.help.x, this.boxes.help.y);
  }
  private dragging() {
    return this.objects.some((o) => o.drag?.dragging);
  }
  private drop(o: ObjectNode, x: number, y: number): boolean {
    this.owner = null;
    if (!this.alive || this.busy || this.finished || this.cancelled || o.source === null) return false;
    const f = this.state.frame,
      stall = this.boxes.stall;
    if (f.stall && stall && Math.abs(x - stall.x) <= STALL.w && Math.abs(y - stall.y) <= STALL.h) {
      // The shut stall takes nothing; the open one buys any object and, for the purse, sells the good it lands on.
      if (!f.stall.open || typeof o.source !== 'number') return false;
      if (o.item !== 'purse') {
        void this.perform({ sell: true });
        return true;
      }
      const buy = this.boxes.shelf.findIndex(
        (p, i) => f.stall!.shelf[i] && Math.abs(x - p.x) <= 54 && Math.abs(y - p.y) <= 54,
      );
      if (buy < 0) {
        void this.ctx.say('swap-meet.purse-return');
        return false;
      }
      void this.perform({ buy });
      return true;
    }
    const candidates = this.state.frame.friends
      .map((f, i) => ({ f, at: this.boxes.friends[i] }))
      .filter(
        ({ f, at }) => !f.done && f.id !== o.source && Math.abs(x - at.x) <= 75 && Math.abs(y - at.y) <= 72,
      )
      .sort((a, b) => Math.hypot(x - a.at.x, y - a.at.y) - Math.hypot(x - b.at.x, y - b.at.y));
    const target = candidates[0]?.f;
    if (!target) return false;
    const a: Action = { from: o.source, to: target.id };
    if (!accepted(this.round, this.state, a)) {
      this.tally.reject(this.round, this.state);
      sfx.boing();
      const other =
        typeof o.source === 'string' ? this.state.frame.friends.find((f) => f.id === o.source) : null;
      if (deadEnd(this.round, this.state)) void this.ctx.say('swap-meet.dead-reject', { thing: o.item });
      else
        void this.ctx.say(other ? 'swap-meet.reciprocal' : 'swap-meet.reject', {
          friend: target.id,
          want: target.want,
          other: other?.id ?? '',
          otherWant: other?.want ?? '',
        });
      return false;
    }
    void this.perform(a);
    return true;
  }
  private async perform(a: Action) {
    if (!this.alive || this.busy || this.finished || this.dragging() || !accepted(this.round, this.state, a))
      return;
    this.busy = true;
    const gen = this.generation,
      next = step(this.round, this.state, a),
      before = this.state.frame;
    for (const o of this.objects) if (o.drag) o.drag.enabled = false;
    let motions: Promise<void>[] = [];
    if ('undo' in a) {
      // Exact predecessor locations, including an earlier level1 stage. Unused stage toys fade;
      // the two exchanging objects cross back before that stage is restored.
      const previous = next.frame;
      const priorStage = previous.stage !== before.stage;
      if (priorStage) {
        this.board.visible = false;
        for (const n of this.toys.children) n.visible = false;
        const oldFriend = friendArt(previous.friends[0].id);
        oldFriend.position.set(this.boxes.friends[0].x - 72, this.boxes.friends[0].y - 45);
        this.toys.addChild(oldFriend);
        const original = previous.friends[0],
          slot = previous.basket.findIndex((b) => b.hold === original.want),
          home = this.boxes.basket[slot];
        const received = new Container();
        received.addChild(itemArt(original.hold));
        received.position.set(this.boxes.rewards.x + (before.rewards.length - 1) * 75, this.boxes.rewards.y);
        this.toys.addChild(received);
        const offered = new Container();
        offered.addChild(itemArt(original.want));
        offered.position.set(this.boxes.friends[0].x, this.boxes.friends[0].y);
        this.toys.addChild(offered);
        motions = [
          this.ctx.tw.to(
            received,
            { x: this.boxes.friends[0].x, y: this.boxes.friends[0].y },
            { duration: 0.6 },
          ),
          this.ctx.tw.to(offered, { x: home.x, y: home.y }, { duration: 0.6 }),
        ];
      } else {
        // Match by place: an object stays where the earlier frame had it, else moves to a changed place that held
        // its kind, else (the purse after a sell) fades away.
        const was = places(previous),
          now = places(before),
          claimed = new Set<string>();
        motions = this.objects.map((o) => {
          if (was.get(o.at) === o.item) return Promise.resolve();
          const to = [...was].find(([k, v]) => v === o.item && now.get(k) !== v && !claimed.has(k))?.[0];
          if (!to) return this.ctx.tw.to(o.node, { alpha: 0 }, { duration: 0.6 });
          claimed.add(to);
          return this.ctx.tw.to(o.node, this.point(to), { duration: 0.6 });
        });
      }
      void this.ctx.say('swap-meet.undo');
    } else if ('sell' in a || 'buy' in a) {
      const carried = this.objects.find((o) => o.at === 'b0')!,
        place = 'sell' in a ? before.stall!.shelf.indexOf(null) : a.buy,
        shelf = this.boxes.shelf[place],
        basket = this.boxes.basket[0];
      // Selling, the object goes onto the shelf and the purse comes from the stall; buying, the reverse.
      const good =
        'buy' in a
          ? this.objects.find((o) => o.at === `s${place}`)!.node
          : this.toys.addChild(
              Object.assign(itemArt('purse'), { x: this.boxes.stall!.x, y: this.boxes.stall!.y }),
            );
      motions = [
        this.ctx.tw.to(carried.node, 'sell' in a ? shelf : this.boxes.stall!, { duration: 0.65 }),
        this.ctx.tw.to(good, basket, { duration: 0.65 }),
      ];
      if ('buy' in a)
        motions.push(motions[0].then(() => this.ctx.tw.to(carried.node, { alpha: 0 }, { duration: 0.2 })));
      void this.ctx.say('sell' in a ? 'swap-meet.sell' : 'swap-meet.buy', {
        thing: 'sell' in a ? carried.item : before.stall!.shelf[place]!,
      });
      sfx.bell(5);
    } else {
      const source = this.objects.find((o) => o.source === a.from)!,
        target = this.objects.find((o) => o.at === `f${before.friends.findIndex((f) => f.id === a.to)}`)!;
      const to = this.at(a.to),
        from = this.at(a.from);
      motions = [
        this.ctx.tw.to(source.node, to, { duration: 0.65 }),
        this.ctx.tw.to(target.node, from, { duration: 0.65 }),
      ];
      void this.ctx.say('swap-meet.accept', { thing: source.item, returned: target.item });
      sfx.bell(5);
    }
    await Promise.all(motions);
    if (!this.alive || gen !== this.generation) return;
    await this.ctx.tw.wait(0.22);
    if (!this.alive || gen !== this.generation) return;
    this.counts[before.stage] = netTrades(this.counts[before.stage] ?? 0, a);
    this.state = next;
    this.tally.changed();
    this.asked = false;
    this.hintTask = '';
    this.draw();
    this.busy = false;
    if (goal(this.round, this.state)) void this.finish();
    else if (this.state.frame.stage !== before.stage) this.instruct();
    // A free remark when a trade leaves nothing anyone wants; she is never undone for.
    else if (!('undo' in a) && deadEnd(this.round, this.state))
      void this.ctx.say('swap-meet.dead-end', { thing: this.state.frame.basket[0].hold });
  }
  private async finish() {
    if (this.finished || !this.alive) return;
    this.finished = true;
    this.busy = true;
    for (const o of this.objects) if (o.drag) o.drag.enabled = false;
    this.ctx.pet.cheer();
    if (this.round.level === 6) await this.question();
    if (!this.alive) return;
    if (this.round.goal === 'kite') {
      const kite = this.board.addChild(itemArt('kite'));
      kite.position.set(this.boxes.goal.x, this.boxes.goal.y - 35);
      void this.ctx.tw.to(kite, { x: this.boxes.goal.x + 70, y: this.boxes.goal.y - 190 }, { duration: 0.8 });
      await this.ctx.tw.wait(0.8);
    }
    if (!this.alive) return;
    sfx.tada();
    await this.ctx.say(this.round.goal ? 'swap-meet.goal' : 'swap-meet.done', {
      goal: this.round.goal ?? '',
    });
    if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  /**
   * Level 6's closing question over two route cards. Unscored: taps, glows and Help record nothing, and it awards
   * nothing on its own; any tap gets both counts and one fact about the routes, then the round finishes as usual.
   */
  private question(): Promise<void> {
    void this.ctx.instruct('swap-meet.question');
    return new Promise((done) => {
      this.pending = done;
      this.drawQuestion();
    });
  }
  /** The shade and two route cards, laid out from the current view; a resize draws them again while the question waits. */
  private drawQuestion() {
    for (const n of this.cards.removeChildren()) n.destroy({ children: true });
    this.routes = [];
    const done = this.pending;
    if (!done) return;
    const v = this.view,
      [first, second] = this.counts,
      start = this.round.stages[1].stall!.shelf,
      usedStall = JSON.stringify(this.state.frame.stall!.shelf) !== JSON.stringify(start);
    const shade = new Graphics().rect(0, 0, v.w, v.h).fill({ color: cream, alpha: 0.7 });
    shade.eventMode = 'static';
    this.cards.addChild(shade);
    const card = (x: number, stall: boolean, marks: number) => {
      const c = new Container();
      c.position.set(x, v.h * 0.48);
      c.addChild(
        new Graphics()
          .roundRect(-140, -125, 280, 250, 26)
          .fill(0xffffff)
          .stroke({ width: 6, color: swatch.blue.line }),
      );
      if (stall) {
        const s = stallArt(110, 58, true);
        s.position.set(0, -45);
        c.addChild(s);
      } else
        this.state.frame.friends.forEach((t, i) => {
          const face = friendArt(t.id);
          face.scale.set(t.id === 'frog' ? 0.5 : 0.2);
          face.position.set(-80 + i * 80 - (t.id === 'frog' ? 0 : 45), t.id === 'frog' ? -45 : -75);
          c.addChild(face);
        });
      const g = new Graphics();
      for (let i = 0; i < marks; i++)
        g.moveTo(-((marks - 1) * 30) / 2 + i * 30, 40)
          .lineTo(-((marks - 1) * 30) / 2 + i * 30, 95)
          .stroke({ width: 10, color: ink, cap: 'round' });
      c.addChild(g);
      c.hitArea = new Rectangle(-140, -125, 280, 250);
      onTap(c, () => {
        if (this.pending !== done || !this.alive) return;
        this.pending = null;
        this.routes = [];
        const r = routeReply(first, second);
        void this.ctx.say(r.line, r.params).then(() => done());
      });
      this.cards.addChild(c);
      this.routes.push({ card: c, marks });
    };
    card(v.w * 0.3, false, first);
    card(v.w * 0.7, usedStall, second);
  }
  askForHint() {
    if (!this.alive || this.busy || this.finished || this.dragging() || !this.ghost.idle) return;
    const a = this.next(),
      key = JSON.stringify(a);
    this.tally.help(this.round, this.state);
    if (!a) return;
    if (this.asked && this.hintTask === key) {
      const intent = this.autotouch();
      if (intent) this.ghost.start(intent);
      return;
    }
    this.asked = true;
    this.hintTask = key;
    const line = hintLine(this.round, this.state, a)!;
    void this.ctx.say(line.line, line.params);
  }
  autotouch(): TouchIntent | null {
    if (this.alive && this.routes.length)
      return { tap: { on: [...this.routes].sort((a, b) => a.marks - b.marks)[0].card } };
    if (!this.alive || this.busy || this.finished || this.dragging()) return null;
    const a = this.next();
    if (!a) return null;
    if ('undo' in a) return { tap: { on: this.undo } };
    const o = this.objects.find((o) => ('from' in a ? o.source === a.from : o.at === 'b0')),
      p = this.ends(a)[1];
    return o ? { drag: { on: o.node }, to: { on: this.toys, x: p.x, y: p.y } } : null;
  }
  update(dt: number) {
    this.clock += dt;
    this.ghost.update(dt);
    this.glow.clear();
    if (!this.tally.glowing || this.busy || this.finished) return;
    const a = this.next();
    if (!a) return;
    for (const p of this.ends(a))
      this.glow
        .roundRect(p.x - 78, p.y - 77, 156, 154, 25)
        .stroke({ width: 6 + Math.sin(this.clock * 5) * 2, color: swatch.yellow.fill });
  }
  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.alive) return;
    // A resize cancels a pending gesture/animation without committing it or creating help/misses.
    this.generation++;
    this.ghost.stop();
    this.busy = false;
    this.draw();
    if (this.finished) this.busy = true;
    if (this.pending) this.drawQuestion();
  }
  destroy() {
    this.alive = false;
    this.generation++;
    this.ghost.stop();
    this.clear();
    this.ctx.untrack(this.companion);
  }
}
class SwapIcon extends WigglyIcon {
  constructor() {
    const c = new Container(),
      a = itemArt('leaf'),
      b = itemArt('shell');
    a.position.set(-48, -24);
    b.position.set(48, 24);
    c.addChild(
      a,
      b,
      new Graphics()
        .moveTo(-35, 55)
        .lineTo(38, 55)
        .lineTo(22, 43)
        .moveTo(38, -60)
        .lineTo(-35, -60)
        .lineTo(-19, -48)
        .stroke({ width: 8, color: swatch.blue.line, cap: 'round', join: 'round' }),
    );
    super(c);
  }
}
export const swapMeet: GameModule = {
  id: 'swap-meet',
  name: 'Swap Meet',
  titleLine: 'swap-meet.title',
  region: 'cozy-village',
  challenge: 'logic',
  skills: ['matching', 'reciprocal-exchange', 'sequencing'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => NAMES[Math.max(0, Math.min(NAMES.length - 1, l - 1))],
  music: STYLES.paint,
  touchDemo: true,
  upright: true,
  coplayHint: 'Voice one friend’s pictured request while she chooses an offer, then exchange roles.',
  offScreen: {
    all: 'With a grown-up, each hold a toy and say which toy you would like to swap.',
    // School: levels 5–6's stall, with pretend shells and no real coins.
    school:
      'Play a pretend stall with a grown-up: a few toys, two buttons for shells. Count the trades with friends and at the stall, then switch.',
  },
  hubIcon: () => new SwapIcon(),
  sticker: (seed) => itemArt(new Rng(seed).pick(['leaf', 'shell', 'kite', 'flower'] as const)),
  create: (ctx) => new SwapMeet(ctx),
};
