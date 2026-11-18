import { rangeFor } from '../../progress/difficulty';
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
import {
  binArt,
  cookedArt,
  drawTable,
  filedArt,
  ghostArt,
  guessArt,
  iconArt,
  puddleArt,
  snowArt,
  solidArt,
  sunArt,
  targetArt,
} from './art';
import {
  arrivesAs,
  binFor,
  BINS,
  GUESSES,
  LAP_LEVEL,
  LEVELS,
  MakeRound,
  meltPlan,
  melts,
  predictFor,
  PredictRound,
  requestsFor,
  sayAfter,
  sortFor,
  SortRound,
  step,
  SUBSTANCES,
  TAPS_TO_MELT,
  tableLayout,
  thingsFor,
  toolFor,
  traysFor,
  truthOf,
  type Bin,
  type Guess,
  type Plan,
  type State,
  type Substance,
  type TableLayout,
  type Tool,
} from './logic';

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
  /** Level 3: the request on the table has not been spoken yet (it waits behind the lesson line, U7 R4). */
  private unasked = false;
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
  /** Level 6: what she thought and what the sun showed, and the two picture cards she guesses with. */
  predict: PredictRound | null = null;
  readonly guessCards: Record<Guess, Container> = { melts: new Container(), stays: new Container() };
  private readonly guessPics: Partial<Record<Guess, Container>> = {};
  /** Level 7: the things in turn, the two bins she files them in, and how many small pictures each bin keeps. */
  sort: SortRound | null = null;
  readonly bins: Record<Bin, Container> = { back: new Container(), stuck: new Container() };
  readonly filed: Record<Bin, Substance[]> = { back: [], stuck: [] };
  private readonly binPulse: Record<Bin, number> = { back: 0, stuck: 0 };
  private glowBin: Bin | null = null;
  /** Level 7: taps so far, so a line that waits behind another is dropped once she has moved on. */
  private touches = 0;

  private readonly background = new Graphics();
  private readonly table = new Graphics();
  private readonly glow = new Graphics();
  private readonly playfield = new Container();
  private warmth = 0;
  readonly sunButton = new Container();
  readonly snowButton = new Container();
  private readonly pulse = { sun: 0, snow: 0 };
  private readonly card = new Container();
  private cardArt: Container | null = null;
  private layout: TableLayout;
  private view: View;
  private clock = 0;
  /** Level 6: the cards bob once when the sun is tapped before a guess, or a hint is asked for. */
  private beckon = 0;
  private glowOn: Tool | null = null;
  askForHint?: () => void;
  hintLabel?: string;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = meltPlan(ctx.level);
    const authored = !!ctx.demo || !authoredShown.has(ctx.level);
    authoredShown.add(ctx.level);
    ctx.stage.addChild(this.background, this.table);
    if (this.plan.mode === 'watch' || this.plan.mode === 'tap') this.show(['ice']);
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
    } else if (this.plan.mode === 'predict') {
      this.predict = new PredictRound(predictFor(ctx.rng, authored));
      this.show([this.predict.thing]);
      for (const guess of GUESSES) {
        const card = this.guessCards[guess];
        card.addChild(tile(150, 150));
        card.hitArea = new Rectangle(-80, -80, 160, 160);
        onTap(card, () => this.choose(guess));
        ctx.stage.addChild(card);
      }
      this.showGuessCards();
      // A melted thing gets no snowflake at this level: going back is the next level's question.
      this.snowButton.visible = false;
      this.askForHint = () => this.predictHint();
      this.hintLabel = 'Show a hint';
    } else if (this.plan.mode === 'sort') {
      this.sort = new SortRound(sortFor(ctx.rng, authored));
      this.show([this.sort.thing], this.sort.state);
      for (const bin of BINS) {
        const box = this.bins[bin];
        const sign = binArt(bin);
        sign.y = -32;
        box.addChild(tile(150, 150), sign);
        box.hitArea = new Rectangle(-80, -80, 160, 160);
        onTap(box, () => this.fileTap(bin));
        ctx.stage.addChild(box);
      }
      this.askForHint = () => this.sortHint();
      this.hintLabel = 'Show a hint';
    } else {
      this.trays = traysFor(ctx.rng, authored);
      this.show(this.trays[0]);
    }
    if (this.plan.mode === 'tap') {
      this.playfield.hitArea = new Rectangle(0, 0, ctx.view.w, ctx.view.h);
      onTap(this.playfield, () => this.warmIce(), { cooldown: 60 });
      ctx.stage.addChild(this.playfield);
      this.snowButton.visible = false;
    }
    for (const [button, art, tool] of [
      [this.sunButton, sunArt(), 'sun'],
      [this.snowButton, snowArt(), 'snow'],
    ] as const) {
      if (this.plan.mode === 'tap' && tool === 'sun') continue;
      if (this.plan.mode === 'predict' && tool === 'snow') continue;
      // Nothing is warmed at level 7: the snowflake is the test, and it stands alone.
      if (this.plan.mode === 'sort' && tool === 'sun') continue;
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
      // A thing that arrives changed for good is drawn as that (toast, a popped kernel) and never changes again; the
      // faint outline of what it was stands beside it, as a puddle's does above it.
      const cooked = state === 'cooked';
      const solid = cooked ? cookedArt(id) : solidArt(id);
      const puddle = cooked ? new Graphics() : puddleArt(id);
      const ghost = ghostArt(id, cooked ? 70 : 100);
      if (cooked) {
        solid.x = 28;
        ghost.x = -52;
      }
      node.addChild(puddle, ghost, solid);
      node.hitArea = new Rectangle(-70, -110, 140, 150);
      const thing: Thing = {
        id,
        state: cooked || melts(id) ? state : 'solid',
        node,
        solid,
        puddle,
        ghost,
        warmed: false,
      };
      this.pose(thing);
      if (this.plan.mode !== 'tap') onTap(node, () => this.wiggle(thing));
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
    t.ghost.alpha = melted ? 0.22 : t.state === 'cooked' ? 0.3 : 0;
  }

  start() {
    if (this.plan.mode === 'tap') void this.ctx.instruct('meltfreeze.instruct.tap');
    else if (this.plan.mode === 'watch') void this.ctx.instruct('meltfreeze.instruct.watch');
    else if (this.plan.mode === 'turn') void this.ctx.instruct('meltfreeze.instruct.both');
    else if (this.plan.mode === 'make') this.askRequest();
    else if (this.plan.mode === 'predict') this.askGuess();
    else if (this.plan.mode === 'sort') void this.askSort();
    else void this.ctx.instruct('meltfreeze.instruct.tray');
  }

  /** The ghost finger: the sun, then the snowflake, for whatever is on the table; the right tool for a request. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const tap = (tool: Tool): TouchIntent => ({
      tap: { on: tool === 'sun' ? this.sunButton : this.snowButton },
    });
    switch (this.plan.mode) {
      case 'tap':
        return this.snowButton.visible
          ? tap('snow')
          : { tap: { on: this.things[0].node, y: -40 }, receiver: this.playfield };
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
      case 'predict': {
        // The demonstration shows a match; the surprise is hers to find.
        const p = this.predict;
        if (!p || p.finished) return null;
        return p.guess ? tap('sun') : { tap: { on: this.guessCards[truthOf(p.thing)] } };
      }
      case 'sort': {
        const r = this.sort;
        if (!r || r.finished) return null;
        return r.tested ? { tap: { on: this.bins[binFor(r.thing)] } } : tap('snow');
      }
    }
  }

  private async warmIce() {
    if (this.busy || this.finished || this.snowButton.visible) {
      sfx.tick();
      return;
    }
    sfx.pop(4 + this.warmth * 2);
    const ice = this.things[0];
    this.warmth++;
    ice.solid.scale.y = 1 - this.warmth * 0.1;
    if (this.warmth < TAPS_TO_MELT) return;

    this.busy = true;
    await this.apply(ice, 'sun');
    this.snowButton.visible = true;
    this.busy = false;
    void this.ctx.instruct('meltfreeze.instruct.snow');
  }

  private wiggle(t: Thing) {
    if (this.ctx.tw.busy(t.node)) return;
    sfx.tick();
    void this.ctx.tw
      .to(t.node, { rotation: 0.12 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(t.node, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }));
  }

  // Tools -------------------------------------------------------------------------------

  /** A tool is pressed: brightens at once, then every thing on the table takes one step. */
  private useTool(tool: Tool) {
    if (this.finished) return;
    // Touch-down feedback at once, even while the table is still changing; the step itself waits for a still table.
    this.pulse[tool] = 1;
    if (this.plan.mode === 'predict' && !this.predict?.guess && !this.busy) {
      // The sun waits for her guess: a soft tick, the cards beckon and the question is asked again.
      sfx.tick();
      this.rest = 0;
      this.beckon = 1;
      return void this.askGuess();
    }
    if (tool === 'sun') sfx.pop(7);
    else sfx.pluck(11);
    if (this.busy) return;
    this.rest = 0;
    switch (this.plan.mode) {
      case 'tap':
        return void this.freezeLapIce();
      case 'watch':
        return void this.watchTap(tool);
      case 'turn':
        return void this.turnTap(tool);
      case 'make':
        return void this.makeTap(tool);
      case 'tray':
        return void this.trayTap(tool);
      case 'predict':
        return void this.predictTap();
      case 'sort':
        return void this.sortTap();
    }
  }

  private async freezeLapIce() {
    this.busy = true;
    await this.apply(this.things[0], 'snow');
    void this.end();
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
      this.ctx.particles.burst(t.node.x + 30, t.node.y - 10, {
        colors: [swatch.blue.light, swatch.white.fill],
        count: 5,
        speed: [40, 120],
        gravity: 500,
        angle: Math.PI / 2,
        spread: 0.6,
        size: [0.25, 0.4],
      });
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
    this.ctx.particles.burst(t.node.x, t.node.y - 40, {
      kind: 'ring',
      colors: [swatch.blue.light, swatch.white.fill],
      count: 8,
      speed: [30, 90],
      gravity: -40,
      life: [0.6, 1],
    });
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
    this.unasked = false;
    const r = this.round!.request;
    void this.ctx.instruct(
      r.to === 'melted' ? 'meltfreeze.instruct.make.melt' : 'meltfreeze.instruct.make.hard',
      { thing: SUBSTANCES[r.thing].word },
    );
  }

  /** The guide was tapped while the ask waits: say this request, not the last one's. */
  sayWaitingAsk() {
    if (!this.unasked || this.finished) return false;
    this.askRequest();
    return true;
  }

  private async makeTap(tool: Tool) {
    const round = this.round!;
    const t = this.things[0];
    const r = round.request;
    // A tap before the request was spoken: the request becomes the instruction now, and the tool's own line cuts it.
    if (this.unasked) this.askRequest();
    const out = round.tap(tool);
    this.misses = round.misses;
    this.hints = round.hints;
    this.busy = true;
    if (out.miss) {
      sfx.boing();
      // The tool she picked does what it does (usually nothing), so she sees it; then the clue.
      await this.apply(t, tool);
      // The clue plays over an open table: a tap on the right tool while it is spoken still counts.
      if (out.hint) void this.ctx.say(out.hint);
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
    // The lesson line never holds the next request (U7 R4): it plays over the thing's exit and the next thing's
    // arrival, the tools open as soon as that thing stands, and the request is spoken when the lesson ends (or as
    // she taps, if she is quicker). On the last request it is heard out, because the closing line would cut it.
    const lesson = this.ctx.say('meltfreeze.same');
    if (round.finished) {
      await lesson;
      return void this.end();
    }
    await this.ctx.tw.to(t.node, { x: -200, alpha: 0 }, { duration: 0.4, ease: ease.inQuad });
    this.show([round.request.thing], round.request.from);
    const next = this.things[0];
    next.node.x = this.view.w + 120;
    this.showCard();
    await this.ctx.tw.to(next.node, { x: this.layout.spots[0].x }, { duration: 0.45, ease: ease.outBack });
    this.busy = false;
    this.unasked = true;
    await lesson;
    if (this.unasked && !this.finished) this.askRequest();
  }

  /** Show a hint, from the pause sheet: the right tool glows and the clue is spoken; one counted hint per request. */
  private hint() {
    if (this.finished || !this.round || this.round.finished) return;
    if (this.unasked) this.askRequest();
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
      await Promise.all(
        movers.map((t, i) =>
          this.ctx.tw.wait(i * 0.15).then(() => (tool === 'sun' ? this.melt(t) : this.freeze(t))),
        ),
      );
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
    await Promise.all(
      this.things.map((t) => this.ctx.tw.to(t.node, { alpha: 0, y: t.node.y + 40 }, { duration: 0.35 })),
    );
    this.show(this.trays[this.tray]);
    for (const t of this.things) {
      t.node.alpha = 0;
      t.node.y += 40;
    }
    await Promise.all(
      this.things.map((t, i) =>
        this.ctx.tw
          .wait(i * 0.08)
          .then(() =>
            this.ctx.tw.to(t.node, { alpha: 1, y: t.node.y - 40 }, { duration: 0.35, ease: ease.outBack }),
          ),
      ),
    );
    this.busy = false;
    void this.ctx.instruct('meltfreeze.instruct.tray');
  }

  // Level 6: will it melt? --------------------------------------------------------------------

  /** The question for the thing on the table, or the next step once she has guessed: the line the guide repeats. */
  private askGuess() {
    const p = this.predict!;
    if (p.finished) return;
    if (p.guess) void this.ctx.instruct('meltfreeze.predict.test');
    else void this.ctx.instruct('meltfreeze.instruct.predict', { thing: SUBSTANCES[p.thing].word });
  }

  /** Redraws both cards as pictures of the thing on the table, and shows which one she has picked (if any). */
  private showGuessCards() {
    const p = this.predict!;
    for (const guess of GUESSES) {
      this.guessPics[guess]?.destroy({ children: true });
      const pic = guessArt(p.thing, guess);
      this.guessPics[guess] = pic;
      this.guessCards[guess].addChild(pic);
    }
    this.poseGuess();
  }

  /** The picked card lifts and stays lit as "what you thought"; the sun opens once there is a guess. */
  private poseGuess() {
    const picked = this.predict!.guess;
    for (const guess of GUESSES) {
      const card = this.guessCards[guess];
      card.alpha = picked && picked !== guess ? 0.55 : 1;
      card.pivot.y = picked === guess ? 14 : 0;
    }
    this.sunButton.alpha = picked || this.busy ? 1 : 0.45;
    this.drawGlow();
  }

  /** She taps a card: it lifts at once. A tap on the other card before the sun is tapped changes her mind freely. */
  private choose(guess: Guess) {
    const p = this.predict!;
    if (this.finished || this.busy || p.finished) return;
    this.rest = 0;
    sfx.pluck(guess === 'melts' ? 4 : 7);
    const first = !p.guess;
    p.choose(guess);
    this.poseGuess();
    const card = this.guessCards[guess];
    card.scale.set(1.12);
    void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    if (first) this.askGuess();
  }

  /** The sun is tapped after a guess: the thing melts or stays, then the match or the surprise is named, warmly either way. */
  private async predictTap() {
    const p = this.predict!;
    const t = this.things[0];
    const said = sayAfter(t.id, t.state, 'sun');
    const out = p.test();
    if (!out) return;
    this.busy = true;
    if (out.result === 'melts') {
      t.state = 'melted';
      this.changed.add(t.id);
      void this.ctx.say(said);
      await this.melt(t);
    } else {
      this.seenStay = true;
      this.wiggle(t);
      await this.ctx.say(said);
    }
    if (out.match) this.ctx.pet.cheer();
    await this.ctx.say(out.line);
    if (p.finished) return void this.end();
    await this.ctx.tw.to(t.node, { x: -200, alpha: 0 }, { duration: 0.4, ease: ease.inQuad });
    this.show([p.thing]);
    const next = this.things[0];
    next.node.x = this.view.w + 120;
    this.showGuessCards();
    await this.ctx.tw.to(next.node, { x: this.layout.spots[0].x }, { duration: 0.45, ease: ease.outBack });
    this.busy = false;
    this.rest = 0;
    this.poseGuess();
    this.askGuess();
  }

  /** Show a hint: how the level works. There is no right card to show, and nothing is counted. */
  private predictHint() {
    if (this.finished || !this.predict || this.predict.finished) return;
    this.beckon = this.predict.guess ? 0 : 1;
    if (this.predict.guess) this.pulse.sun = 1;
    void this.ctx.say(this.predict.ask());
  }

  // Level 7: can it go back? ------------------------------------------------------------------

  /**
   * The question for the thing on the table. Toast and the popped kernel are named first ("This was bread. Now it's
   * toast."); the question follows unless she has already tapped something, so it never cuts a line her own tap earned.
   */
  private async askSort() {
    const r = this.sort!;
    if (r.finished) return;
    const at = this.touches;
    if (r.state === 'cooked')
      await this.ctx.say(r.thing === 'kernel' ? 'meltfreeze.sort.popped' : 'meltfreeze.sort.toast');
    if (at !== this.touches || this.finished) return;
    void this.ctx.instruct('meltfreeze.instruct.sort');
  }

  /** The snowflake is the test, and it is always free: a puddle goes hard again, toast stays toast. */
  private async sortTap() {
    const r = this.sort!;
    if (r.finished) return;
    this.touches++;
    r.test();
    this.busy = true;
    await this.runTest(this.things[0]);
    this.busy = false;
  }

  /** Shows what the snowflake does to the thing on the table: the freeze, or a small shake and "Still toast." */
  private async runTest(t: Thing) {
    this.pulse.snow = 1;
    if (t.state === 'cooked') {
      this.wiggle(t);
      sfx.sparkle();
      await this.ctx.say(sayAfter(t.id, t.state, 'snow'));
    } else await this.apply(t, 'snow');
  }

  /**
   * She taps a bin. Filing before testing is allowed: the snowflake then runs first, so every filing has its evidence. A
   * wrong bin is the only thing counted: the thing hops back with a boing and the clue names what the test showed; from
   * the second the right bin glows, and on the third the pet files it.
   */
  private async fileTap(bin: Bin) {
    const r = this.sort!;
    if (this.finished || r.finished) return;
    // Touch-down feedback at once, even while the table is still changing.
    this.binPulse[bin] = 1;
    sfx.pluck(bin === 'back' ? 4 : 7);
    if (this.busy) return;
    this.touches++;
    const t = this.things[0];
    const thing = r.thing;
    const out = r.file(bin);
    this.misses = r.misses;
    this.hints = r.hints;
    this.busy = true;
    if (out.ranTest) await this.runTest(t);
    if (out.miss) {
      await this.hop(t, bin);
      if (out.glow) this.setBinGlow(out.bin);
      if (!out.done) {
        // The clue plays over an open table: a tap on the right bin while it is spoken still counts.
        if (out.hint) void this.ctx.say(out.hint);
        return void (this.busy = false);
      }
      // A third wrong bin: the pet files it, after the clue.
      if (out.hint) await this.ctx.say(out.hint);
      this.binPulse[out.bin] = 1;
      sfx.tick();
    }
    this.setBinGlow(null);
    await this.land(t, thing, out.bin);
    let said: Promise<void> = Promise.resolve();
    if (!out.supported) {
      this.ctx.pet.cheer();
      // Heard out on the last thing, because the closing line would cut it; otherwise it plays over the next arrival.
      said = this.ctx.say(
        out.hint ?? (out.bin === 'back' ? 'meltfreeze.sort.back' : 'meltfreeze.sort.stuck'),
      );
      if (r.finished) await said;
    }
    if (r.finished) return void this.end();
    this.show([r.thing], r.state);
    const next = this.things[0];
    next.node.x = this.view.w + 120;
    await this.ctx.tw.to(next.node, { x: this.layout.spots[0].x }, { duration: 0.45, ease: ease.outBack });
    // The screen may have turned while the thing came in.
    this.place();
    this.busy = false;
    // The lesson line never holds the table, and the next question waits for it to end (or is dropped if she taps first).
    const at = this.touches;
    await said;
    if (at === this.touches && !this.finished) void this.askSort();
  }

  /** A wrong bin: the thing hops toward it and comes back to the table with a gentle boing. */
  private async hop(t: Thing, bin: Bin) {
    const tw = this.ctx.tw;
    const home = { x: t.node.x, y: t.node.y };
    const b = this.bins[bin];
    await tw.to(
      t.node,
      { x: home.x + (b.x - home.x) * 0.45, y: home.y + (b.y - home.y) * 0.45 },
      { duration: 0.22, ease: ease.outQuad },
    );
    sfx.boing();
    await tw.to(t.node, home, { duration: 0.45, ease: ease.outBack });
    // The screen may have turned mid-hop: the thing takes its place in the layout as it is now.
    this.place();
  }

  /** The thing hops into its bin, which keeps a small picture of it for the rest of the round. */
  private async land(t: Thing, id: Substance, bin: Bin) {
    const tw = this.ctx.tw;
    const b = this.bins[bin];
    void tw.to(t.node.scale, { x: 0.4, y: 0.4 }, { duration: 0.35 });
    await tw.to(t.node, { x: b.x, y: b.y + 50 }, { duration: 0.35, ease: ease.inOutSine });
    t.node.visible = false;
    const pic = filedArt(id);
    pic.position.set(this.filed[bin].length === 0 ? -34 : 34, 62);
    b.addChild(pic);
    this.filed[bin].push(id);
    this.binPulse[bin] = 1;
    sfx.pluck(4);
    void tw.wait(0.12).then(() => sfx.pluck(7));
  }

  /** Show a hint: the test runs if she has not run it, the right bin glows and the clue is spoken; one hint per thing. */
  private async sortHint() {
    const r = this.sort;
    if (this.finished || this.busy || !r || r.finished) return;
    this.touches++;
    const out = r.ask();
    this.hints = r.hints;
    if (out.ranTest) {
      this.busy = true;
      await this.runTest(this.things[0]);
      this.busy = false;
    }
    this.setBinGlow(out.glow);
    void this.ctx.say(out.hint);
  }

  private setBinGlow(bin: Bin | null) {
    this.glowBin = bin;
    this.drawGlow();
  }

  // Round end and the pause sheet --------------------------------------------------------------

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.setGlow(null);
    this.glowBin = null;
    await this.ctx.tw.wait(0.8);
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say(
      this.plan.mode === 'predict'
        ? 'meltfreeze.done.predict'
        : this.plan.mode === 'sort'
          ? 'meltfreeze.done.sort'
          : 'meltfreeze.done',
    );
    const discoveries = this.sort
      ? [...this.sort.shown].map((k) => entryId('melt-freeze', k))
      : this.plan.mode === 'tray' || this.plan.mode === 'predict'
        ? [
            ...[...this.changed].map((s) => entryId('melt-freeze', s)),
            ...(this.seenStay ? [entryId('melt-freeze', 'stays')] : []),
          ]
        : undefined;
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries });
  }

  /** Start again: the part in play goes back to its first position; counts stay. */
  restart() {
    if (this.finished || this.busy) return;
    this.setGlow(null);
    if (this.plan.mode === 'tap') {
      this.warmth = 0;
      this.snowButton.visible = false;
      this.start();
    }
    if (this.plan.mode === 'watch') {
      this.seenMelt = this.seenFreeze = false;
      this.sunStreak = 0;
    }
    if (this.plan.mode === 'make') {
      this.round!.state = this.round!.request.from;
      this.round!.wrong = 0;
    }
    if (this.sort) {
      // The thing in play returns to how it arrived, untested; counts and filed things stay.
      this.sort.reset();
      // A question still waiting behind a line is dropped: Start again asks it afresh below.
      this.touches++;
      this.setBinGlow(null);
    }
    for (const t of this.things) {
      t.state = this.plan.mode === 'make' ? this.round!.request.from : this.sort ? arrivesAs(t.id) : 'solid';
      if (!melts(t.id) && t.state !== 'cooked') t.state = 'solid';
      t.warmed = false;
      this.ctx.tw.kill(t.solid);
      this.ctx.tw.kill(t.solid.scale);
      this.ctx.tw.kill(t.puddle);
      this.ctx.tw.kill(t.puddle.scale);
      this.ctx.tw.kill(t.ghost);
      this.pose(t);
    }
    this.used.clear();
    if (this.predict) {
      this.predict.clear();
      this.poseGuess();
      this.askGuess();
    }
    if (this.sort) void this.askSort();
  }

  // Layout ----------------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.layout = tableLayout(v, this.things.length);
    if (this.plan.mode === 'tap') this.playfield.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.place();
  }

  private place() {
    const L = this.layout;
    const v = this.view;
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.teal.light)
      .rect(0, L.table.y + L.table.h - 20, v.w, v.h)
      .fill({ color: swatch.teal.fill, alpha: 0.18 });
    drawTable(this.table, L.table);
    this.things.forEach((t, i) => {
      if (this.ctx.tw.busy(t.node)) return;
      const k = this.plan.mode === 'tap' ? 2.8 : L.thing / 100;
      t.node.scale.set(k);
      t.node.position.set(L.spots[i].x, L.spots[i].y + 40 * (L.thing / 100));
    });
    this.sunButton.position.set(L.sun.x + L.sun.w / 2, L.sun.y + L.sun.h / 2);
    this.snowButton.position.set(L.snow.x + L.snow.w / 2, L.snow.y + L.snow.h / 2);
    if (this.plan.mode === 'tap' && v.h > v.w) {
      this.snowButton.position.set(L.spots[0].x, L.table.y + L.table.h + 110);
    }
    // Level 6 has no snowflake, so the sun stands alone in the middle of the bottom row when the screen is upright.
    if (this.plan.mode === 'predict' && v.h > v.w) this.sunButton.x = v.w / 2;
    // Level 7 has no sun, so the snowflake stands alone there instead.
    if (this.plan.mode === 'sort' && v.h > v.w) this.snowButton.x = v.w / 2;
    BINS.forEach((bin, i) => {
      const b = L.bins[i];
      this.bins[bin].position.set(b.x + b.w / 2, b.y + b.h / 2);
    });
    this.card.position.set(L.card.x + L.card.w / 2, L.card.y + L.card.h / 2);
    GUESSES.forEach((guess, i) => {
      const b = L.cards[i];
      this.guessCards[guess].position.set(b.x + b.w / 2, b.y + b.h / 2);
    });
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    const picked = this.predict?.guess;
    if (picked && !this.finished) {
      // "What you thought": a steady ring round the picked card, lifted with it.
      const c = this.guessCards[picked];
      g.roundRect(c.x - 84, c.y - 84 - c.pivot.y, 168, 172, 24).stroke({
        width: 8,
        color: swatch.yellow.line,
      });
    }
    if (this.glowBin && !this.finished) {
      const c = this.bins[this.glowBin];
      g.roundRect(c.x - 86, c.y - 86, 172, 176, 26).stroke({ width: 8, color: swatch.yellow.line });
    }
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
    for (const bin of BINS) {
      if (this.binPulse[bin] <= 0) continue;
      this.binPulse[bin] = Math.max(0, this.binPulse[bin] - dt * 2.6);
      this.bins[bin].scale.set(1 + 0.1 * Math.sin(this.binPulse[bin] * Math.PI));
    }
    if (this.plan.mode === 'predict') {
      if (this.beckon > 0) this.beckon = Math.max(0, this.beckon - dt * 1.6);
      const k = 1 + 0.08 * Math.sin(this.beckon * Math.PI * 2);
      if (!this.predict?.guess)
        for (const guess of GUESSES)
          if (!this.ctx.tw.busy(this.guessCards[guess].scale)) this.guessCards[guess].scale.set(k);
      // A long rest: the pet asks again. Nothing is tapped for her, because there is no right card to show.
      if (!this.busy && !this.finished && !this.ctx.demo) {
        this.rest += dt;
        if (this.rest > REST_BEFORE_HELP) {
          this.rest = 0;
          this.askGuess();
        }
      }
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
    if (this.plan.mode !== 'tap') this.playfield.destroy();
    else this.sunButton.destroy();
    if (this.plan.mode !== 'predict') for (const guess of GUESSES) this.guessCards[guess].destroy();
    else this.snowButton.destroy();
    if (this.plan.mode !== 'sort') for (const bin of BINS) this.bins[bin].destroy();
    else this.sunButton.destroy();
  }
}

export const meltFreeze: GameModule = {
  id: 'melt-freeze',
  name: 'Melt and Freeze',
  titleLine: 'game.melt-freeze',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['states-of-matter', 'cause-and-effect', 'observation', 'prediction'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [LAP_LEVEL],
  describeLevel: (l) => meltPlan(l).name,
  music: STYLES.bubbles,
  coplayHint: 'Ask {name} what the sun did, then what the snowflake did.',
  coplayHintLap: 'Tell {name} what happened: "The ice melted! The snowflake froze it again!"',
  offScreen: {
    all: 'Put an ice cube on a plate by a window and watch it with her. Say what is happening.',
    school: 'Tear a piece of paper together, then ask: can it go back?',
  },
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker: (seed) => iconArt(seed),
  create: (ctx) => new MeltFreeze(ctx),
};
