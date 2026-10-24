import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { entryId } from '../../content/journal';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { drawTable, ghostArt, iconArt, puddleArt, snowArt, solidArt, sunArt, targetArt } from './art';
import { MakeRound, meltPlan, melts, requestsFor, sayAfter, step, SUBSTANCES, tableLayout, thingsFor, toolFor, traysFor, type Plan, type State, type Substance, type TableLayout, type Tool } from './logic';

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

interface Thing {
  id: Substance;
  state: State;
  node: Container;
  solid: Graphics;
  puddle: Graphics;
  ghost: Graphics;
  /** Level 2: the sun has been tried on it. */
  warmed: boolean;
}

/** Seconds of rest at level 1 before the pet taps the tool she has not tried, so the first round always finishes. */
const REST_BEFORE_HELP = 14;

class MeltFreeze implements Game {
  readonly plan: Plan;
  readonly things: Thing[] = [];
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  /** Level 1: both changes seen once each ends the round. */
  seenMelt = false;
  seenFreeze = false;
  private sunStreak = 0;
  private rest = 0;
  /** Level 2: the thing in turn. */
  index = 0;
  private turnThings: Substance[] = [];
  /** Level 3. */
  round: MakeRound | null = null;
  /** Level 4: the trays and the tools used on the one in play. */
  trays: Substance[][] = [];
  tray = 0;
  readonly used = new Set<Tool>();
  private readonly changed = new Set<Substance>();
  private seenStay = false;

  private readonly background = new Graphics();
  private readonly table = new Graphics();
  private readonly glow = new Graphics();
  readonly sunButton = new Container();
  readonly snowButton = new Container();
  private readonly pulse = { sun: 0, snow: 0 };
  private readonly card = new Container();
  private cardArt: Container | null = null;
  private layout: TableLayout;
  private view: View;
  private clock = 0;
  private glowOn: Tool | null = null;
  askForHint?: () => void;
  hintLabel?: string;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = meltPlan(ctx.level);
    const authored = !!ctx.demo || !authoredShown.has(ctx.level);
    authoredShown.add(ctx.level);
    ctx.stage.addChild(this.background, this.table);
    if (this.plan.mode === 'watch') this.show(['ice']);
    else if (this.plan.mode === 'turn') {
      this.turnThings = thingsFor(ctx.rng, authored);
      this.show([this.turnThings[0]]);
    } else if (this.plan.mode === 'make') {
      this.round = new MakeRound(requestsFor(ctx.rng, authored));
      this.show([this.round.request.thing], this.round.request.from);
      this.card.addChild(tile(170, 170));
      ctx.stage.addChild(this.card);
      this.showCard();
      this.askForHint = () => this.hint();
      this.hintLabel = 'Show a hint';
    } else {
      this.trays = traysFor(ctx.rng, authored);
      this.show(this.trays[0]);
    }
    for (const [button, art, tool] of [[this.sunButton, sunArt(), 'sun'], [this.snowButton, snowArt(), 'snow']] as const) {
      art.scale.set(1.15);
      button.addChild(tile(150, 150), art);
      button.hitArea = new Rectangle(-80, -80, 160, 160);
      onTap(button, () => this.useTool(tool));
      ctx.stage.addChild(button);
    }
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.glow);
    this.layout = tableLayout(ctx.view, this.things.length);
  }

  /** Puts a set of things on the table, each hard unless told otherwise, replacing what was there. */
  private show(ids: Substance[], state: State = 'solid') {
    for (const t of this.things) t.node.destroy({ children: true });
    this.things.length = 0;
    for (const id of ids) {
      const node = new Container();
      const solid = solidArt(id);
      const puddle = puddleArt(id);
      const ghost = ghostArt(id);
      node.addChild(puddle, ghost, solid);
      node.hitArea = new Rectangle(-70, -110, 140, 150);
      const thing: Thing = { id, state: melts(id) ? state : 'solid', node, solid, puddle, ghost, warmed: false };
      this.pose(thing);
      onTap(node, () => this.wiggle(thing));
      this.things.push(thing);
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.table) + 1);
    }
    this.used.clear();
    this.layout = tableLayout(this.view, this.things.length);
    this.place();
  }

  /** Draws a thing as its state says, with no animation. */
  private pose(t: Thing) {
    const melted = t.state === 'melted';
    t.solid.scale.set(1, melted ? 0.05 : 1);
    t.solid.alpha = melted ? 0 : 1;
    t.puddle.scale.set(melted ? 1 : 0);
    t.puddle.alpha = melted ? 1 : 0;
    t.ghost.alpha = melted ? 0.22 : 0;
  }

  start() {
    if (this.plan.mode === 'watch') void this.ctx.instruct('meltfreeze.instruct.watch');
    else if (this.plan.mode === 'turn') void this.ctx.instruct('meltfreeze.instruct.both');
    else if (this.plan.mode === 'make') this.askRequest();
    else void this.ctx.instruct('meltfreeze.instruct.tray');
  }

  /** The ghost finger: the sun, then the snowflake, for whatever is on the table; the right tool for a request. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const tap = (tool: Tool): TouchIntent => ({ tap: { on: tool === 'sun' ? this.sunButton : this.snowButton } });
    switch (this.plan.mode) {
      case 'watch':
        return !this.seenMelt ? tap('sun') : !this.seenFreeze ? tap('snow') : null;
      case 'turn': {
        const t = this.things[0];
        if (!t) return null;
        return !t.warmed ? tap('sun') : t.state === 'melted' ? tap('snow') : null;
      }
      case 'make':
        return this.round && !this.round.finished ? tap(toolFor(this.round.request)) : null;
      case 'tray':
        return !this.used.has('sun') ? tap('sun') : !this.used.has('snow') ? tap('snow') : null;
    }
  }

  private wiggle(t: Thing) {
    if (this.ctx.tw.busy(t.node)) return;
    sfx.tick();
    void this.ctx.tw.to(t.node, { rotation: 0.12 }, { duration: 0.1 }).then(() => this.ctx.tw.to(t.node, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }));
  }

  // Tools -------------------------------------------------------------------------------

  /** A tool is pressed: brightens at once, then every thing on the table takes one step. */
  private useTool(tool: Tool) {
    if (this.finished) return;
    // Touch-down feedback at once, even while the table is still changing; the step itself waits for a still table.
    this.pulse[tool] = 1;
    if (tool === 'sun') sfx.pop(7);
    else sfx.pluck(11);
    if (this.busy) return;
    this.rest = 0;
    switch (this.plan.mode) {
      case 'watch':
        return void this.watchTap(tool);
      case 'turn':
        return void this.turnTap(tool);
      case 'make':
        return void this.makeTap(tool);
      case 'tray':
        return void this.trayTap(tool);
    }
  }

  /** One thing takes a step; a change is animated and spoken, a no-change only spoken. Resolves when the table is still again. */
  private async apply(t: Thing, tool: Tool): Promise<boolean> {
    const before = t.state;
    const after = step(t.id, before, tool);
    const line = sayAfter(t.id, before, tool);
    if (after === before) {
      void this.ctx.say(line);
      return false;
    }
    t.state = after;
    void this.ctx.say(line);
    if (after === 'melted') await this.melt(t);
    else await this.freeze(t);
    return true;
  }

  /** The hard thing sinks into a spreading puddle over about 1.2 s, with a drip and a soft chime. */
  private async melt(t: Thing) {
    const tw = this.ctx.tw;
    sfx.squish();
    void tw.to(t.puddle.scale, { x: 1, y: 1 }, { duration: 1.2, ease: ease.outQuad });
    void tw.to(t.puddle, { alpha: 1 }, { duration: 0.4 });
    void tw.wait(0.5).then(() => {
      sfx.pop(2);
      this.ctx.particles.burst(t.node.x + 30, t.node.y - 10, { colors: [swatch.blue.light, swatch.white.fill], count: 5, speed: [40, 120], gravity: 500, angle: Math.PI / 2, spread: 0.6, size: [0.25, 0.4] });
    });
    await tw.to(t.solid.scale, { y: 0.05 }, { duration: 1.1, ease: ease.inOutSine });
    await tw.to(t.solid, { alpha: 0 }, { duration: 0.15 });
    void tw.to(t.ghost, { alpha: 0.22 }, { duration: 0.3 });
    sfx.bell(5, 0.3);
  }

  /** The puddle draws back up into the hard thing with a crystal chime. */
  private async freeze(t: Thing) {
    const tw = this.ctx.tw;
    sfx.sparkle();
    this.ctx.particles.burst(t.node.x, t.node.y - 40, { kind: 'ring', colors: [swatch.blue.light, swatch.white.fill], count: 8, speed: [30, 90], gravity: -40, life: [0.6, 1] });
    void tw.to(t.ghost, { alpha: 0 }, { duration: 0.3 });
    t.solid.alpha = 1;
    void tw.to(t.puddle.scale, { x: 0, y: 0 }, { duration: 1.0, ease: ease.inQuad });
    void tw.to(t.puddle, { alpha: 0 }, { duration: 1.0 });
    await tw.to(t.solid.scale, { y: 1 }, { duration: 1.1, ease: ease.outBack });
    sfx.bell(9, 0.3);
  }

  // Level 1: sun and snow ----------------------------------------------------------------

  private async watchTap(tool: Tool) {
    const t = this.things[0];
    this.sunStreak = tool === 'sun' ? this.sunStreak + 1 : 0;
    this.busy = true;
    const changed = await this.apply(t, tool);
    this.busy = false;
    if (changed && tool === 'sun') {
      this.seenMelt = true;
      if (!this.seenFreeze) void this.ctx.instruct('meltfreeze.instruct.both');
    }
    if (changed && tool === 'snow') this.seenFreeze = true;
    if (this.seenMelt && this.seenFreeze) return void this.end();
    // Three suns and no snowflake: the snowflake pulses (a nudge, nothing counted).
    if (this.sunStreak >= 3) this.pulse.snow = 1;
  }

  // Level 2: three things in turn ----------------------------------------------------------

  private async turnTap(tool: Tool) {
    const t = this.things[0];
    this.busy = true;
    const changed = await this.apply(t, tool);
    if (tool === 'sun') t.warmed = true;
    // Done with this thing: a stayer once warmed, a changer once it is hard again.
    const done = t.warmed && (melts(t.id) ? changed && tool === 'snow' : true);
    if (!done) return void (this.busy = false);
    await this.ctx.tw.wait(0.5);
    this.index++;
    if (this.index >= this.turnThings.length) return void this.end();
    await this.ctx.tw.to(t.node, { x: -200, alpha: 0 }, { duration: 0.4, ease: ease.inQuad });
    this.show([this.turnThings[this.index]]);
    const next = this.things[0];
    next.node.x = this.view.w + 120;
    void this.ctx.say('meltfreeze.next');
    await this.ctx.tw.to(next.node, { x: this.layout.spots[0].x }, { duration: 0.45, ease: ease.outBack });
    this.busy = false;
  }

  // Level 3: make it… ------------------------------------------------------------------------

  private showCard() {
    const r = this.round!.request;
    this.cardArt?.destroy({ children: true });
    this.cardArt = targetArt(r.thing, r.to === 'melted');
    this.cardArt.y = -20;
    this.card.addChild(this.cardArt);
    this.card.scale.set(0);
    void this.ctx.tw.to(this.card.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  private askRequest() {
    const r = this.round!.request;
    void this.ctx.instruct(r.to === 'melted' ? 'meltfreeze.instruct.make.melt' : 'meltfreeze.instruct.make.hard', { thing: SUBSTANCES[r.thing].word });
  }

  private async makeTap(tool: Tool) {
    const round = this.round!;
    const t = this.things[0];
    const r = round.request;
    const out = round.tap(tool);
    this.misses = round.misses;
    this.hints = round.hints;
    this.busy = true;
    if (out.miss) {
      sfx.boing();
      // The tool she picked does what it does (usually nothing), so she sees it; then the clue.
      await this.apply(t, tool);
      if (out.hint) await this.ctx.say(out.hint);
      if (out.glow) this.setGlow(toolFor(r));
    } else {
      await this.apply(t, tool);
    }
    if (out.supported) {
      // A third miss: the pet taps the right tool for her.
      const right = toolFor(r);
      await this.ctx.tw.wait(0.5);
      this.pulse[right] = 1;
      sfx.tick();
      void this.ctx.say(sayAfter(t.id, t.state, right));
      t.state = r.to;
      if (right === 'sun') await this.melt(t);
      else await this.freeze(t);
    }
    if (!out.done) return void (this.busy = false);
    this.setGlow(null);
    this.ctx.pet.cheer();
    await this.ctx.say('meltfreeze.same');
    if (round.finished) return void this.end();
    await this.ctx.tw.to(t.node, { x: -200, alpha: 0 }, { duration: 0.4, ease: ease.inQuad });
    this.show([round.request.thing], round.request.from);
    const next = this.things[0];
    next.node.x = this.view.w + 120;
    this.showCard();
    await this.ctx.tw.to(next.node, { x: this.layout.spots[0].x }, { duration: 0.45, ease: ease.outBack });
    this.busy = false;
    this.askRequest();
  }

  /** Show a hint, from the pause sheet: the right tool glows and the clue is spoken; one counted hint per request. */
  private hint() {
    if (this.finished || !this.round || this.round.finished) return;
    const { hint } = this.round.ask();
    this.hints = this.round.hints;
    this.setGlow(toolFor(this.round.request));
    void this.ctx.say(hint);
  }

  private setGlow(tool: Tool | null) {
    this.glowOn = tool;
    this.drawGlow();
  }

  // Level 4: some do, some don't ---------------------------------------------------------------

  private async trayTap(tool: Tool) {
    this.busy = true;
    this.used.add(tool);
    const movers = this.things.filter((t) => step(t.id, t.state, tool) !== t.state);
    if (!movers.length) {
      const t = this.things[0];
      void this.ctx.say(sayAfter(t.id, t.state, tool));
    } else {
      for (const t of movers) t.state = step(t.id, t.state, tool);
      void this.ctx.say(tool === 'sun' ? 'meltfreeze.melt' : 'meltfreeze.freeze');
      await Promise.all(movers.map((t, i) => this.ctx.tw.wait(i * 0.15).then(() => (tool === 'sun' ? this.melt(t) : this.freeze(t)))));
      if (tool === 'sun') {
        for (const t of movers) this.changed.add(t.id);
        if (this.things.some((t) => !melts(t.id))) {
          this.seenStay = true;
          await this.ctx.say('meltfreeze.stays.some');
        }
      }
    }
    if (this.used.size < 2) return void (this.busy = false);
    await this.ctx.tw.wait(0.6);
    this.tray++;
    if (this.tray >= this.trays.length) return void this.end();
    void this.ctx.say('meltfreeze.next');
    await Promise.all(this.things.map((t) => this.ctx.tw.to(t.node, { alpha: 0, y: t.node.y + 40 }, { duration: 0.35 })));
    this.show(this.trays[this.tray]);
    for (const t of this.things) {
      t.node.alpha = 0;
      t.node.y += 40;
    }
    await Promise.all(this.things.map((t, i) => this.ctx.tw.wait(i * 0.08).then(() => this.ctx.tw.to(t.node, { alpha: 1, y: t.node.y - 40 }, { duration: 0.35, ease: ease.outBack }))));
    this.busy = false;
    void this.ctx.instruct('meltfreeze.instruct.tray');
  }

  // Round end and the pause sheet --------------------------------------------------------------

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.setGlow(null);
    await this.ctx.tw.wait(0.8);
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say('meltfreeze.done');
    const discoveries = this.plan.mode === 'tray' ? [...[...this.changed].map((s) => entryId('melt-freeze', s)), ...(this.seenStay ? [entryId('melt-freeze', 'stays')] : [])] : undefined;
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries });
  }

  /** Start again: the part in play goes back to its first position; counts stay. */
  restart() {
    if (this.finished || this.busy) return;
    this.setGlow(null);
    if (this.plan.mode === 'watch') {
      this.seenMelt = this.seenFreeze = false;
      this.sunStreak = 0;
    }
    if (this.plan.mode === 'make') {
      this.round!.state = this.round!.request.from;
      this.round!.wrong = 0;
    }
    for (const t of this.things) {
      t.state = this.plan.mode === 'make' ? this.round!.request.from : 'solid';
      if (!melts(t.id)) t.state = 'solid';
      t.warmed = false;
      this.ctx.tw.kill(t.solid);
      this.ctx.tw.kill(t.solid.scale);
      this.ctx.tw.kill(t.puddle);
      this.ctx.tw.kill(t.puddle.scale);
      this.ctx.tw.kill(t.ghost);
      this.pose(t);
    }
    this.used.clear();
  }

  // Layout ----------------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.layout = tableLayout(v, this.things.length);
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.place();
  }

  private place() {
    const L = this.layout;
    const v = this.view;
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light).rect(0, L.table.y + L.table.h - 20, v.w, v.h).fill({ color: swatch.teal.fill, alpha: 0.18 });
    drawTable(this.table, L.table);
    this.things.forEach((t, i) => {
      if (this.ctx.tw.busy(t.node)) return;
      const k = L.thing / 100;
      t.node.scale.set(k);
      t.node.position.set(L.spots[i].x, L.spots[i].y + 40 * k);
    });
    this.sunButton.position.set(L.sun.x + L.sun.w / 2, L.sun.y + L.sun.h / 2);
    this.snowButton.position.set(L.snow.x + L.snow.w / 2, L.snow.y + L.snow.h / 2);
    this.card.position.set(L.card.x + L.card.w / 2, L.card.y + L.card.h / 2);
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (!this.glowOn || this.finished) return;
    const b = this.glowOn === 'sun' ? this.sunButton : this.snowButton;
    g.roundRect(b.x - 92, b.y - 92, 184, 184, 30).stroke({ width: 8, color: swatch.yellow.line });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    for (const tool of ['sun', 'snow'] as const) {
      const b = tool === 'sun' ? this.sunButton : this.snowButton;
      if (this.pulse[tool] > 0) {
        this.pulse[tool] = Math.max(0, this.pulse[tool] - dt * 2.2);
        const p = this.pulse[tool];
        b.scale.set(1 + 0.14 * Math.sin(p * Math.PI));
      } else b.scale.set(1);
    }
    // Level 1: a long rest with one change still unseen, and the pet shows the other tool so the round finishes.
    if (this.plan.mode === 'watch' && !this.busy && !this.finished && !this.ctx.demo) {
      this.rest += dt;
      if (this.rest > REST_BEFORE_HELP && (this.seenMelt || this.seenFreeze)) {
        const t = this.things[0];
        this.useTool(t.state === 'solid' ? 'sun' : 'snow');
      }
    }
  }

  destroy() {
    this.cardArt?.destroy({ children: true });
  }
}

export const meltFreeze: GameModule = {
  id: 'melt-freeze',
  name: 'Melt and Freeze',
  titleLine: 'game.melt-freeze',
  region: 'tinker-lab',
  skills: ['states-of-matter', 'cause-and-effect', 'observation'],
  bands: ['lap', 'toddler', 'preschool'],
  levels: (b) => (b === 'preschool' ? { min: 3, max: 4 } : b === 'toddler' ? { min: 1, max: 3 } : { min: 1, max: 2 }),
  describeLevel: (l) => meltPlan(l).name,
  music: STYLES.bubbles,
  coplayHint: 'Ask {name} what the sun did, then what the snowflake did.',
  offScreen: 'Put an ice cube on a plate by a window and watch it with her. Say what is happening.',
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker: (seed) => iconArt(seed),
  create: (ctx) => new MeltFreeze(ctx),
};
