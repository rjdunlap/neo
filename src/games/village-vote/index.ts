import { Container, EventBoundary, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { GhostFinger } from '../../engine/ghost';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { fixedToy, paw, tallSlide, toy } from './art';
import {
  accessLayout,
  CARD,
  LEVELS,
  Election,
  fixture,
  layout,
  NAMES,
  playLayout,
  roundFor,
  toyName,
  uprightDrop,
  type Fix,
  type Option,
  type Point,
  type Stage,
} from './logic';
interface Control {
  node: Container;
  w: number;
  h: number;
  act: () => void;
}
export class VillageVote implements Game {
  readonly election;
  readonly root = new Container();
  readonly board = new Container();
  readonly glow = new Graphics();
  readonly ghost;
  readonly companion;
  readonly backdrop;
  options: Container[] = [];
  boards: Container[] = [];
  friends = new Map<string, Container>();
  controls: Control[] = [];
  /** Level 5's fix cards (add a step, a lower slide), present in the fix phase. */
  cards: Container[] = [];
  /** Level 5: where each friend stands at the built tall slide (for the glow). */
  private spots = new Map<string, Point>();
  /** Level 5: the opening "the tall slide won" beat on the counted board; taps wait for it. */
  private introducing = false;
  help!: Container;
  boxes;
  view: View;
  alive = true;
  busy = false;
  finished = false;
  private generation = 0;
  private pending: { control: Control; pointer: number } | null = null;
  private asked = new Set<Stage>();
  private replayed = false;
  private clock = 0;
  get misses() {
    return this.election.misses;
  }
  get hints() {
    return this.election.hints;
  }
  private cancel = (e: Event) => {
    if (e instanceof PointerEvent && this.pending && e.pointerId !== this.pending.pointer) return;
    this.release();
  };
  constructor(private ctx: GameContext) {
    this.election = new Election(ctx.demo ? fixture(ctx.level) : roundFor(ctx.level, ctx.rng));
    this.view = ctx.view;
    this.boxes = layout(this.view, this.election);
    this.companion = ctx.companion();
    this.companion.eventMode = 'none';
    ctx.track(this.companion);
    this.backdrop = new Backdrop(
      { sky: [0xffe2c4, cream], hills: [0xd8ecb0, 0xbfe39a], horizon: 0.42, seed: 127, clouds: 2, sun: true },
      this.view,
    );
    this.ghost = new GhostFinger(this.root, new EventBoundary(this.root));
    ctx.stage.addChild(this.backdrop, this.root);
    this.root.addChild(this.board, this.glow, this.companion, this.ghost.hand);
    this.glow.eventMode = 'none';
    this.ctx.listen(window, 'pointercancel', this.cancel, true);
    this.ctx.listen(window, 'blur', this.cancel);
  }
  start() {
    if (this.election.plan.level === 5) {
      void this.intro();
      return;
    }
    this.draw();
    this.instruct();
  }
  /** Level 5 opens on the counted vote: the tall slide has won, and it is built. */
  private async intro() {
    const e = this.election,
      gen = this.generation;
    this.introducing = true;
    this.busy = true;
    this.draw();
    const [n, a] = e.plan.options.map((o) => e.total(o)).sort((x, y) => y - x);
    await this.ctx.say('village-vote.won', { n, a });
    if (!this.alive || gen !== this.generation) return;
    this.introducing = false;
    this.busy = false;
    this.draw();
    this.instruct();
  }
  private instruct() {
    const e = this.election;
    if (e.plan.level === 5) {
      if (e.phase === 'access' || e.phase === 'fix')
        void this.ctx.instruct(e.phase === 'access' ? 'village-vote.access' : 'village-vote.fixes');
      return;
    }
    if (e.phase === 'runoff' && e.closed) {
      void this.ctx.instruct('village-vote.runoff', { thing: e.closed });
      return;
    }
    void this.ctx.instruct(
      e.phase === 'preference'
        ? 'village-vote.preference'
        : e.closed
          ? 'village-vote.recount'
          : e.plan.level >= 3
            ? 'village-vote.three'
            : e.plan.level === 2
              ? 'village-vote.pet-count'
              : 'village-vote.two',
    );
  }
  private release() {
    if (this.pending && !this.pending.control.node.destroyed) this.pending.control.node.alpha = 1;
    this.pending = null;
  }
  private button(p: Point, w: number, h: number, art: Container, act: () => void) {
    const n = new Container();
    n.position.set(p.x, p.y);
    n.addChild(
      new Graphics()
        .roundRect(-w / 2, -h / 2, w, h, 20)
        .fill(cream)
        .stroke({ width: 4, color: wood.line }),
      art,
    );
    n.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    art.eventMode = 'none';
    const control = { node: n, w, h, act };
    this.controls.push(control);
    this.board.addChild(n);
    onTap(n, (e) => {
      if (!this.alive || this.busy || this.finished || this.pending) return;
      n.alpha = 0.68;
      this.pending = { control, pointer: e.pointerId };
    });
    // onTap gives immediate down feedback; only a matching inside release commits the choice.
    n.on('pointerup', (e: FederatedPointerEvent) => {
      if (this.pending?.control !== control || this.pending.pointer !== e.pointerId) return;
      const local = n.toLocal(e.global),
        inside = Math.abs(local.x) <= w / 2 && Math.abs(local.y) <= h / 2;
      this.release();
      if (inside && this.alive && !this.busy && !this.finished) act();
    });
    n.on('pointerupoutside', (e: FederatedPointerEvent) => {
      if (this.pending?.pointer === e.pointerId) this.release();
    });
    return n;
  }
  private clear() {
    this.release();
    this.companion.removeFromParent();
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    this.controls = [];
    this.cards = [];
    this.spots.clear();
    this.friends.clear();
    this.options = [];
    this.boards = [];
  }
  private fitPet(p: Point) {
    const b = this.companion.bodyBounds(),
      s = Math.min(74 / b.width, 80 / b.height);
    this.companion.scale.set(s);
    this.companion.position.set(p.x - (b.x + b.width / 2) * s, p.y - (b.y + b.height / 2) * s);
    this.root.addChild(this.companion);
  }
  private draw() {
    this.clear();
    this.boxes = layout(this.view, this.election);
    const e = this.election;
    this.companion.visible = e.plan.level === 2;
    if (e.phase === 'playing' || e.phase === 'done') {
      this.drawPlay();
      return;
    }
    if (e.plan.level === 5 && !this.introducing) {
      this.drawAccess();
      return;
    }
    e.plan.options.forEach((o, i) => {
      const art = toy(o);
      art.y = -10;
      const name = label(toyName(o), 21);
      name.y = 44;
      art.addChild(name);
      const pick = this.button(this.boxes.options[i], 180, 120, art, () => {
        void this.choose(o);
      });
      // The fewest group's picture is closed this time: dimmed, still answering a tap with why.
      if (o === e.closed) pick.alpha = 0.4;
      this.options.push(pick);
      const marks = new Container();
      const count = e.marks(o),
        actual = e.total(o);
      const numeral = label(String(count), 32);
      numeral.position.set(-60, 0);
      marks.addChild(numeral);
      const g = new Graphics();
      for (let j = 0; j < count; j++)
        g.moveTo(-20 + j * 18, -16)
          .lineTo(-20 + j * 18, 16)
          .stroke({ width: 5, color: ink });
      marks.addChild(g);
      const caption = label(count === actual ? 'all counted' : 'counted so far', 17);
      caption.y = 32;
      marks.addChild(caption);
      const board = this.button(this.boxes.boards[i], 190, 105, marks, () => {
        void this.replay(o);
      });
      if (o === e.closed) board.alpha = 0.4;
      this.boards.push(board);
    });
    for (const v of e.voters) {
      const art = new Container(),
        isPet = v.id === 'pet';
      if (!isPet) {
        const c = friend(v.id, 0.23);
        c.position.set(-12, 35);
        art.addChild(c);
      }
      const raised = paw();
      raised.position.set(30, -23);
      art.addChild(raised);
      const next = e.closed ? e.waiting.find((w) => w.id === v.id)?.next : undefined;
      if (next) {
        // The second-choice badge (48 units, inside the panel): where this friend would go next.
        const badge = toy(next);
        badge.scale.set(0.4);
        badge.position.set(26, 36);
        art.addChild(badge);
      }
      if (e.selected === v.id) {
        art.y = -14;
        art.addChildAt(
          new Graphics().roundRect(-52, -52, 104, 104, 18).stroke({ width: 6, color: swatch.yellow.fill }),
          0,
        );
      }
      if (e.counted.has(v.id))
        art.addChild(
          new Graphics()
            .moveTo(-42, -35)
            .lineTo(-33, -24)
            .lineTo(-16, -44)
            .stroke({ width: 6, color: swatch.green.line }),
        );
      const n = this.button(this.boxes.voters[v.id], 110, 110, art, () => {
        if (next && e.select(v.id)) this.draw();
        else void this.count(v.id);
      });
      this.friends.set(v.id, n);
      if (isPet) this.fitPet(this.boxes.voters[v.id]);
    }
    if (e.phase === 'preference')
      this.fitPet({ x: 90, y: 420 + (this.view.upright ? uprightDrop(this.view) : 0) });
    this.drawHelp(this.boxes.help);
  }
  private drawHelp(p: Point) {
    const bulb = new Container();
    bulb.addChild(
      new Graphics()
        .circle(0, -9, 20)
        .fill(swatch.yellow.fill)
        .stroke({ width: 4, color: ink })
        .moveTo(-13, 19)
        .lineTo(13, 19)
        .stroke({ width: 6, color: ink }),
    );
    this.help = this.button(p, 110, 110, bulb, () => this.askForHint());
    this.root.addChild(this.glow, this.ghost.hand);
  }
  /**
   * Level 5 at the built tall slide: friends who can use it sit on a small slide; the ones its high first step leaves out
   * stand on the ground under a ladder whose first rung is out of reach. Once all are found, the two fix cards appear.
   */
  private drawAccess() {
    const e = this.election,
      scene = accessLayout(this.view, e.npc.length),
      big = tallSlide(false);
    big.scale.set(2.3);
    big.position.set(scene.toy.x, scene.toy.y);
    this.board.addChild(big);
    e.npc.forEach((v, i) => {
      const p = scene.voters[i],
        out = e.leftOut.includes(v.id),
        art = new Container();
      this.spots.set(v.id, p);
      if (out) {
        // A ladder foot beside her whose first rung is above her head: the step is the problem, never the friend.
        art.addChild(
          new Graphics()
            .moveTo(22, -52)
            .lineTo(22, 50)
            .moveTo(46, -52)
            .lineTo(46, 50)
            .moveTo(22, -40)
            .lineTo(46, -40)
            .stroke({ width: 5, color: wood.line }),
        );
        const c = friend(v.id, 0.15);
        c.position.set(-14, 46);
        art.addChild(c);
      } else {
        const mini = toy('tall-slide');
        mini.scale.set(0.5);
        mini.position.set(6, 22);
        art.addChild(mini);
        const c = friend(v.id, 0.19);
        c.position.set(-14, -10);
        art.addChild(c);
      }
      if (e.found.has(v.id))
        art.addChild(
          new Graphics()
            .moveTo(-42, -35)
            .lineTo(-33, -24)
            .lineTo(-16, -44)
            .stroke({ width: 6, color: swatch.green.line }),
        );
      const n = this.button(p, 110, 110, art, () => {
        void this.find(v.id);
      });
      this.friends.set(v.id, n);
    });
    // The cards appear once the last "too high" line has finished, when they can be tapped.
    if (e.phase === 'fix' && !this.busy)
      (['step', 'lower'] as const).forEach((f, i) => {
        const art = new Container(),
          pic = fixedToy(f);
        pic.scale.set(0.75);
        pic.y = -14;
        const name = label(f === 'step' ? 'add a step' : 'a lower slide', 21);
        name.y = 52;
        art.addChild(pic, name);
        this.cards.push(this.button(scene.cards[i], CARD.w, CARD.h, art, () => void this.pickFix(f)));
      });
    this.drawHelp(scene.help);
  }
  /** Level 5: tap a friend at the tall slide. */
  private async find(id: string) {
    const e = this.election,
      r = e.find(id);
    if (r === 'ignored') return;
    this.busy = true;
    const gen = this.generation;
    if (r === 'on-slide') sfx.boing();
    else sfx.pop();
    if (r === 'found' || r === 'all-found') this.draw();
    const line = r === 'on-slide' ? 'village-vote.on-slide' : 'village-vote.too-high';
    const spoken = this.ctx.say(line);
    const n = this.friends.get(id)!,
      y = n.y;
    // A hop: the found friend bounces; one on the slide waves from where it sits.
    for (const dy of [-16, 0]) {
      await this.ctx.tw.to(n, { y: y + dy }, { duration: 0.14 });
      if (!this.alive || gen !== this.generation) return;
    }
    if (r === 'all-found') {
      await spoken;
      if (!this.alive || gen !== this.generation) return;
      this.busy = false;
      this.draw();
      this.instruct();
      return;
    }
    this.busy = false;
  }
  /** Level 5: either fix is built, the voice names what each takes, and everyone plays. */
  private async pickFix(f: Fix) {
    const e = this.election;
    if (!e.chooseFix(f)) return;
    this.busy = true;
    const gen = this.generation;
    this.draw();
    sfx.bell(5);
    void this.ctx.say(f === 'step' ? 'village-vote.fix-step' : 'village-vote.fix-lower');
    await this.sharedPlay(gen);
  }
  private async choose(o: Option) {
    const e = this.election;
    if (e.phase === 'preference') {
      const from = { x: this.companion.x, y: this.companion.y };
      if (!e.choose(o)) return;
      this.busy = true;
      const gen = this.generation;
      this.draw();
      const target = { x: this.companion.x, y: this.companion.y };
      this.companion.position.set(from.x, from.y);
      await this.ctx.tw.to(this.companion, target, { duration: 0.5 });
      if (!this.alive || gen !== this.generation) return;
      e.arrived();
      this.asked.clear();
      this.busy = false;
      this.draw();
      this.instruct();
      return;
    }
    if (e.phase === 'runoff') {
      await this.send(o);
      return;
    }
    const result = e.declare(o);
    if (result === 'ignored') return;
    if (result === 'closed') {
      void this.ctx.say('village-vote.closed', { thing: o });
      return;
    }
    this.busy = true;
    const gen = this.generation;
    if (result === 'tie') {
      // A new decision: Hint speaks again before it shows the ghost (it still counts once per decision).
      this.asked.delete('declare');
      this.draw();
      sfx.bell(3);
      const [a] = e.comparison();
      await this.ctx.say('village-vote.tie', { n: a.total });
      if (!this.alive || gen !== this.generation) return;
      this.busy = false;
      this.instruct();
      return;
    }
    if (result === 'accepted') {
      this.draw();
      sfx.bell(5);
      void this.ctx.say('village-vote.result', { thing: e.winner });
      await this.sharedPlay(gen);
      return;
    }
    sfx.boing();
    this.draw();
    await this.ctx.say('village-vote.again');
    if (!this.alive || gen !== this.generation) return;
    await this.speakCounts(gen);
    if (!this.alive || gen !== this.generation) return;
    e.feedbackDone();
    this.busy = false;
    this.draw();
  }
  /** Run-off: walk the selected friend to the tapped picture, or say why not. */
  private async send(o: Option) {
    const e = this.election,
      id = e.selected,
      next = e.selectedNext,
      result = e.send(o);
    if (result === 'ignored') return;
    if (result === 'nudge' || result === 'closed') {
      void this.ctx.say(result === 'nudge' ? 'village-vote.nudge' : 'village-vote.closed', {
        thing: e.closed!,
      });
      return;
    }
    this.busy = true;
    const gen = this.generation,
      n = this.friends.get(id!)!;
    if (result === 'wrong') {
      // The friend shakes its head; its badge still shows where it would go.
      sfx.boing();
      const x = n.x;
      void this.ctx.say('village-vote.not-next', { thing: next! });
      for (const dx of [-10, 10, -6, 0]) {
        await this.ctx.tw.to(n, { x: x + dx }, { duration: 0.08 });
        if (!this.alive || gen !== this.generation) return;
      }
      e.feedbackDone();
      this.busy = false;
      this.draw();
      return;
    }
    sfx.pop();
    const to = layout(this.view, e).voters[id!];
    this.board.addChild(n);
    await this.ctx.tw.to(n, { x: to.x, y: to.y }, { duration: 0.45 });
    if (!this.alive || gen !== this.generation) return;
    this.busy = false;
    this.draw();
    if (result === 'recount') this.instruct();
  }
  private async speakCounts(gen: number) {
    for (const { option, total } of this.election.comparison()) {
      if (!this.alive || gen !== this.generation) return;
      await this.ctx.say(
        total === 0 ? 'village-vote.empty' : total === 1 ? 'village-vote.one' : 'village-vote.count',
        { n: total, thing: option },
      );
    }
  }
  private async count(id: string) {
    const r = this.election.count(id);
    if (!r) return;
    this.draw();
    await this.ctx.say(r.total === 1 ? 'village-vote.one' : 'village-vote.count', {
      n: r.total,
      thing: r.option,
    });
  }
  private async replay(o: Option) {
    if (this.election.phase !== 'counting') return;
    this.replayed = true;
    const n = this.election.marks(o);
    await this.ctx.say(
      n === 0
        ? this.election.total(o) === 0
          ? 'village-vote.empty'
          : 'village-vote.zero'
        : n === 1
          ? 'village-vote.one'
          : 'village-vote.count',
      { n, thing: o },
    );
  }
  askForHint() {
    if (!this.alive || this.busy || this.finished || !this.ghost.idle) return;
    const e = this.election;
    if (e.plan.level === 5) {
      // The fix is a free choice: Hint there only says the choice again and records no help.
      if (e.phase !== 'access') {
        this.instruct();
        return;
      }
      e.help();
      if (this.asked.has(e.stage)) this.ghost.start({ tap: { on: this.friends.get(e.unfound[0])! } });
      else {
        this.asked.add(e.stage);
        void this.ctx.say('village-vote.too-high').then(() => this.alive && this.instruct());
      }
      return;
    }
    e.help();
    if (this.asked.has(e.stage)) {
      this.ghost.start({ tap: { on: this.hintTarget() } });
      return;
    }
    this.asked.add(e.stage);
    if (e.phase === 'runoff') {
      this.instruct();
      return;
    }
    if (e.phase === 'preference') {
      void this.ctx.say('village-vote.free');
      return;
    }
    e.recount();
    this.draw();
    void this.showHint(this.generation);
  }
  /** What help points at: the right picture, or in the run-off the next friend and then its badge's picture. */
  private hintTarget(): Container {
    const e = this.election;
    if (e.phase === 'preference') return this.options[0];
    if (e.phase === 'runoff') {
      const next = e.selectedNext;
      return next ? this.options[e.plan.options.indexOf(next)] : this.friends.get(e.waiting[0].id)!;
    }
    return this.options[e.plan.options.indexOf(e.winner)];
  }
  private async showHint(gen: number) {
    this.busy = true;
    await this.speakCounts(gen);
    if (!this.alive || gen !== this.generation) return;
    const e = this.election;
    if (e.tied) {
      // Before the tie is found the most is shared: the hint names the tie and glows one tied picture.
      await this.ctx.say('village-vote.tie', { n: e.total(e.winner) });
      if (this.alive && gen === this.generation) this.busy = false;
      return;
    }
    const other = e.plan.options.filter((o) => o !== e.winner).map((o) => e.total(o));
    await this.ctx.say(other.length === 2 ? 'village-vote.compare-three' : 'village-vote.compare-two', {
      n: e.total(e.winner),
      a: other[0],
      b: other[1] ?? 0,
      thing: e.winner,
    });
    if (this.alive && gen === this.generation) this.busy = false;
  }
  private drawPlay() {
    const e = this.election,
      big = e.plan.level === 5 ? fixedToy(e.fix) : toy(e.winner);
    const scene = playLayout(this.view, e.voters.length);
    big.scale.set(2.3);
    big.position.set(scene.toy.x, scene.toy.y);
    this.board.addChild(big);
    const voters = [...e.voters].sort((a, b) => Number(b.id === 'pet') - Number(a.id === 'pet'));
    voters.forEach((v, i) => {
      const n = new Container(),
        p = scene.voters[i];
      n.position.set(p.x, p.y);
      n.eventMode = 'none';
      if (v.id === 'pet') this.fitPet(p);
      else {
        // The same friend as on the vote board; at level 5 the friends the step left out keep their size.
        const c = friend(v.id, e.leftOut.includes(v.id) ? 0.2 : 0.3);
        c.y = 45;
        n.addChild(c);
      }
      this.board.addChild(n);
      this.friends.set(v.id, n);
    });
  }
  private async sharedPlay(gen: number) {
    const voters = [...this.election.voters].sort((a, b) => Number(b.id === 'pet') - Number(a.id === 'pet'));
    for (const v of voters) {
      if (!this.alive || gen !== this.generation) return;
      const n = v.id === 'pet' ? this.companion : this.friends.get(v.id)!;
      const x = n.x,
        y = n.y;
      const toy = playLayout(this.view, 0).toy;
      await this.ctx.tw.to(n, { x: toy.x, y: toy.y + 15 }, { duration: 0.22 });
      if (!this.alive || gen !== this.generation) return;
      await this.ctx.tw.to(n, { x, y }, { duration: 0.22 });
    }
    if (!this.alive || gen !== this.generation || !this.election.complete()) return;
    this.finished = true;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  autotouch(): TouchIntent | null {
    if (!this.alive || this.busy || this.finished) return null;
    const e = this.election;
    if (e.phase === 'access') return { tap: { on: this.friends.get(e.unfound[0])! } };
    if (e.phase === 'fix') return { tap: { on: this.cards[0] } };
    if (e.phase === 'preference')
      return { tap: { on: this.options[e.plan.options.findIndex((o) => o !== e.winner)] } };
    if (e.phase === 'runoff') {
      const next = e.selectedNext;
      return {
        tap: { on: next ? this.options[e.plan.options.indexOf(next)] : this.friends.get(e.waiting[0].id)! },
      };
    }
    if (e.phase !== 'counting') return null;
    const next = e.voters.find((v) => !e.counted.has(v.id));
    if (next) return { tap: { on: this.friends.get(next.id)! } };
    if (!this.replayed) return { tap: { on: this.boards[0] } };
    return { tap: { on: this.options[e.plan.options.indexOf(e.winner)] } };
  }
  update(dt: number) {
    this.clock += dt;
    this.ghost.update(dt);
    this.glow.clear();
    const e = this.election;
    const width = 6 + Math.sin(this.clock * 5);
    if (e.glowing && e.phase === 'counting') {
      const p = this.boxes.options[e.plan.options.indexOf(e.winner)];
      this.glow.roundRect(p.x - 96, p.y - 66, 192, 132, 22).stroke({ width, color: swatch.yellow.fill });
    }
    if (e.glowing && e.phase === 'access')
      for (const id of e.unfound) {
        const p = this.spots.get(id);
        if (p)
          this.glow.roundRect(p.x - 61, p.y - 61, 122, 122, 22).stroke({ width, color: swatch.yellow.fill });
      }
    if (e.glowing && e.phase === 'runoff' && e.waiting.length) {
      const next = e.selectedNext;
      if (next) {
        const p = this.boxes.options[e.plan.options.indexOf(next)];
        this.glow.roundRect(p.x - 96, p.y - 66, 192, 132, 22).stroke({ width, color: swatch.yellow.fill });
      } else {
        const p = this.boxes.voters[e.waiting[0].id];
        this.glow.roundRect(p.x - 61, p.y - 61, 122, 122, 22).stroke({ width, color: swatch.yellow.fill });
      }
    }
  }
  resize(v: View) {
    this.generation++;
    this.release();
    this.ghost.stop();
    this.ctx.tw.kill(this.companion);
    for (const n of this.friends.values()) this.ctx.tw.kill(n);
    this.view = v;
    this.backdrop.resize(v);
    this.election.arrived();
    this.election.feedbackDone();
    this.busy = false;
    // A resize cuts level 5's opening line short: the slide is built and the round goes on.
    const intro = this.introducing;
    this.introducing = false;
    this.draw();
    if (this.election.phase === 'playing') {
      this.busy = true;
      void this.sharedPlay(this.generation);
    }
    // A resize can cut the tie line short; the run-off instruction is said again.
    if (
      this.election.phase === 'runoff' ||
      this.election.phase === 'fix' ||
      (intro && this.election.plan.level === 5)
    )
      this.instruct();
  }
  destroy() {
    this.alive = false;
    this.generation++;
    this.release();
    this.ghost.stop();
    this.ctx.tw.kill(this.companion);
    for (const n of this.friends.values()) this.ctx.tw.kill(n);
    this.ctx.untrack(this.companion);
  }
}
/** A friend, the same animal on every screen (by its ID). */
function friend(id: string, scale: number) {
  const c = new Critter(CRITTERS[Number(id.split('-')[1]) % 2 ? 'duck' : 'bunny']);
  c.alive = false;
  c.scale.set(scale);
  c.eventMode = 'none';
  return c;
}
class VoteIcon extends WigglyIcon {
  constructor() {
    const c = toy('slide'),
      p = paw();
    p.position.set(45, -65);
    c.addChild(p);
    super(c);
  }
}
export const villageVote: GameModule = {
  id: 'village-vote',
  name: 'Village Vote',
  titleLine: 'village-vote.title',
  region: 'cozy-village',
  challenge: 'numbers',
  skills: ['counting', 'comparing', 'group-decisions'],
  bands: ['preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => NAMES[Math.max(0, Math.min(NAMES.length - 1, l - 1))],
  music: STYLES.paint,
  upright: true,
  touchDemo: true,
  coplayHint:
    'Count aloud while she taps the paws, then swap roles. Choose freely for the pet. After a tie, be a latecomer she asks for a next choice. At the tall slide, ask her who can reach the first step.',
  offScreen: 'With a grown-up, let toy friends choose between two toys and count their preferences.',
  hubIcon: () => new VoteIcon(),
  sticker: (seed) => toy(new Rng(seed).pick(['slide', 'swing', 'sandpit'] as const)),
  create: (ctx) => new VillageVote(ctx),
};
