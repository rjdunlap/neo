import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { entryId } from '../../content/journal';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { COLORS, CupView, heapArt, iconArt, outcomeArt, spoonArt } from './art';
import {
  cupLayout,
  cupOf,
  describeLevel,
  discoveryOf,
  emptyCup,
  FindRound,
  findRound,
  GuessRound,
  guessRound,
  LEVELS,
  OUTCOMES,
  outcomeOf,
  sayStir,
  SortRound,
  sortRound,
  stir,
  stirPlan,
  stirRound,
  threeRound,
  wordOf,
  type Box,
  type Cup,
  type CupLayout,
  type Material,
  type Outcome,
  type Plan,
} from './logic';

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

/** Seconds of rest at levels 1–2 before the pet taps the spoon for her, so the first round always finishes. */
const REST_BEFORE_HELP = 14;

interface CupSlot {
  view: CupView;
  cup: Cup;
  material: Material | null;
}

class StirSee implements Game {
  readonly plan: Plan;
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  /** What the round showed her, which is what it may file in the journal. */
  readonly seen = new Set<Outcome>();
  /** She tapped a cup with something vanished in it and saw the shimmer: "still in there". */
  stillThere = false;

  /** Levels 1–2: the spoons in turn. */
  queue: Material[] = [];
  index = 0;
  find: FindRound | null = null;
  guess: GuessRound | null = null;
  sort: SortRound | null = null;

  readonly cups: CupSlot[] = [];
  readonly spoonButton = new Container();
  private spoonPic: Container | null = null;
  readonly choices: Record<Outcome, Container> = {
    vanish: new Container(),
    settle: new Container(),
    float: new Container(),
  };
  /** Level 5: what each tray keeps. */
  readonly filed: Record<Outcome, Material[]> = { vanish: [], settle: [], float: [] };
  private readonly card = new Container();
  private cardPic: Container | null = null;
  private readonly background = new Graphics();
  private readonly glow = new Graphics();
  private glowCup: number | null = null;
  glowChoice: Outcome | null = null;
  private layout: CupLayout;
  private view: View;
  private clock = 0;
  private rest = 0;
  private beckon = 0;
  private spoonPulse = 0;
  /** The spoon and choice tiles are drawn at one size and scaled to the layout's (larger upright). */
  private spoonK = 1;
  private choiceK = 1;
  private choiceTile = 150;
  private readonly choicePulse: Record<Outcome, number> = { vanish: 0, settle: 0, float: 0 };
  askForHint?: () => void;
  hintLabel?: string;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = stirPlan(ctx.level);
    this.layout = cupLayout(ctx.view, this.plan.mode);
    const authored = !!ctx.demo || !authoredShown.has(ctx.level);
    authoredShown.add(ctx.level);
    ctx.stage.addChild(this.background);
    const mode = this.plan.mode;

    if (mode === 'stir' || mode === 'three') {
      this.queue = mode === 'stir' ? stirRound() : threeRound(ctx.rng, authored);
      this.addCup(emptyCup(), null);
    } else if (mode === 'find') {
      this.find = new FindRound(findRound(ctx.rng, authored));
      this.card.addChild(tile(150, 150));
      ctx.stage.addChild(this.card);
      this.showQuestion();
    } else if (mode === 'guess') {
      this.guess = new GuessRound(guessRound(ctx.rng, authored));
      this.addCup(emptyCup(), null);
    } else {
      this.sort = new SortRound(sortRound(ctx.rng, authored));
      this.addCup(cupOf(this.sort.material), this.sort.material);
      this.cups[0].view.setSwirling(true);
    }

    if (mode !== 'find' && mode !== 'sort') {
      this.spoonButton.addChild(tile(150, 150));
      this.spoonButton.hitArea = new Rectangle(-80, -80, 160, 160);
      onTap(this.spoonButton, () => this.useSpoon());
      ctx.stage.addChild(this.spoonButton);
      this.showSpoon();
    }
    if (mode === 'guess' || mode === 'sort') {
      for (const o of OUTCOMES) {
        const c = this.choices[o];
        const size = (this.choiceTile = mode === 'sort' ? 170 : 150);
        c.addChild(tile(size, size));
        const pic = outcomeArt(o);
        pic.scale.set(mode === 'sort' ? 0.82 : 0.95);
        pic.y = mode === 'sort' ? -16 : 0;
        c.addChild(pic);
        c.hitArea = new Rectangle(-size / 2 - 5, -size / 2 - 5, size + 10, size + 10);
        onTap(c, () => (mode === 'guess' ? this.choose(o) : void this.fileTap(o)));
        ctx.stage.addChild(c);
      }
    }
    if (mode === 'find' || mode === 'guess' || mode === 'sort') {
      this.askForHint = () => void this.hint();
      this.hintLabel = 'Show a hint';
    }
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.glow);
    this.place();
  }

  // Building the table ------------------------------------------------------------------------------

  private addCup(cup: Cup, material: Material | null) {
    const b = this.layout.cups[Math.min(this.cups.length, this.layout.cups.length - 1)];
    const view = new CupView(b.w, b.h);
    view.show(cup);
    const slot: CupSlot = { view, cup, material };
    onTap(view, () => this.tapCup(slot));
    this.cups.push(slot);
    this.ctx.stage.addChildAt(view, this.ctx.stage.getChildIndex(this.background) + 1);
    return slot;
  }

  private clearCups() {
    for (const c of this.cups) c.view.destroy({ children: true });
    this.cups.length = 0;
  }

  /** The spoon button shows what the next spoon carries. */
  private showSpoon() {
    this.spoonPic?.destroy({ children: true });
    const m = this.nextMaterial();
    this.spoonPic = spoonArt(m);
    this.spoonPic.scale.set(0.95);
    this.spoonPic.x = -12;
    this.spoonButton.addChild(this.spoonPic);
    this.poseSpoon();
  }

  private nextMaterial(): Material | null {
    if (this.guess) return this.guess.finished ? null : this.guess.material;
    return this.queue[Math.min(this.index, this.queue.length - 1)] ?? null;
  }

  /** Level 4: the spoon stays dim until she has guessed. */
  private poseSpoon() {
    this.spoonButton.alpha = this.guess && !this.guess.guess && !this.busy ? 0.5 : 1;
  }

  private showQuestion() {
    const f = this.find!;
    this.clearCups();
    for (const m of f.question.cups) this.addCup(cupOf(m), m);
    this.cardPic?.destroy({ children: true });
    this.cardPic = heapArt(f.question.target, 84);
    this.cardPic.y = 30;
    this.card.addChild(this.cardPic);
    this.card.scale.set(0);
    void this.ctx.tw.to(this.card.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  start() {
    switch (this.plan.mode) {
      case 'stir':
      case 'three':
        return void this.ctx.instruct('stirsee.instruct.stir');
      case 'find':
        return this.askFind();
      case 'guess':
        return this.askGuess();
      case 'sort':
        return void this.ctx.instruct('stirsee.instruct.sort');
    }
  }

  /** The ghost finger: the spoon; the right cup; the picture of what happens, then the spoon; look, then the right tray. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    switch (this.plan.mode) {
      case 'stir':
      case 'three':
        return { tap: { on: this.spoonButton } };
      case 'find': {
        const f = this.find!;
        return f.finished ? null : { tap: { on: this.cups[f.answer].view } };
      }
      case 'guess': {
        const g = this.guess!;
        if (g.finished) return null;
        return g.guess
          ? { tap: { on: this.spoonButton } }
          : { tap: { on: this.choices[outcomeOf(g.material)] } };
      }
      case 'sort': {
        const s = this.sort!;
        if (s.finished) return null;
        return s.looked
          ? { tap: { on: this.choices[outcomeOf(s.material)] } }
          : { tap: { on: this.cups[0].view } };
      }
    }
  }

  // The spoon ----------------------------------------------------------------------------------------

  private useSpoon(helped = false) {
    if (this.finished) return;
    this.spoonPulse = 1;
    this.rest = 0;
    if (this.guess && !this.guess.guess && !this.busy) {
      // The spoon waits for her guess: a soft tick, the cards beckon and the question is asked again.
      sfx.tick();
      this.beckon = 1;
      return this.askGuess();
    }
    sfx.pluck(7);
    if (this.busy) return;
    if (!helped) this.rest = 0;
    if (this.guess) return void this.guessTap();
    return void this.stirTap();
  }

  /** Levels 1–2: the next spoon goes into the one cup, which keeps everything stirred so far. */
  private async stirTap() {
    const m = this.queue[this.index];
    if (!m) return;
    this.busy = true;
    const slot = this.cups[0];
    await this.stirIn(slot, m);
    this.index++;
    if (this.index >= this.queue.length) {
      await this.ctx.tw.wait(0.4);
      return void this.end();
    }
    this.showSpoon();
    this.busy = false;
    void this.ctx.say('stirsee.more');
  }

  /**
   * The spoon flies to the cup, dips and circles for about a second, and what it carried does its one thing: a vanish fades
   * from a lump to the shimmer, a settle falls as grains to the heap, a float rides on top and rocks once. The line names it.
   */
  private async stirIn(slot: CupSlot, m: Material) {
    const tw = this.ctx.tw;
    const cv = slot.view;
    const spoon = spoonArt(m);
    spoon.position.copyFrom(this.spoonButton.position);
    spoon.rotation = -0.35;
    this.spoonPic && (this.spoonPic.visible = false);
    this.ctx.stage.addChild(spoon);
    const top = { x: cv.x + 10, y: cv.y + cv.surface - 50 };
    await tw.to(spoon, top, { duration: 0.35, ease: ease.inOutSine });
    sfx.splash();
    await tw.to(spoon, { y: top.y + 60, rotation: 0.4 }, { duration: 0.2, ease: ease.outQuad });
    for (const dx of [-34, 30, -26, 0]) {
      sfx.trickle(1);
      await tw.to(spoon, { x: cv.x + dx }, { duration: 0.22, ease: ease.inOutSine });
    }
    // The spoon comes out empty; what it carried is in the cup now.
    const carried = spoon.children[1];
    if (carried) carried.visible = false;
    void tw
      .to(
        spoon,
        { x: this.spoonButton.x, y: this.spoonButton.y, rotation: -0.35, alpha: 0 },
        { duration: 0.35 },
      )
      .then(() => {
        spoon.destroy({ children: true });
        if (this.spoonPic) this.spoonPic.visible = true;
      });
    const before = slot.cup;
    slot.cup = stir(before, m);
    slot.material = m;
    const o = outcomeOf(m);
    this.seen.add(o);
    void this.ctx.say(sayStir(m));
    await this.reveal(slot, before, m);
    if (o === 'vanish') sfx.bell(5, 0.25);
  }

  /** Shows what a spoon did to a cup: the change appears on its own drawing, the others stay as they were. */
  private async reveal(slot: CupSlot, before: Cup, m: Material) {
    const tw = this.ctx.tw;
    const cv = slot.view;
    const o = outcomeOf(m);
    cv.show(slot.cup);
    if (o === 'vanish') {
      // A lump of it in the water fades away, and the shimmer comes up where it was.
      const lump = heapArt(m, 44);
      lump.position.set(0, (cv.surface + cv.bottom) / 2);
      cv.addChild(lump);
      const firstShimmer = !before.shimmer.length;
      if (firstShimmer) cv.shimmer.alpha = 0;
      sfx.pop(2);
      void tw
        .to(lump, { alpha: 0, y: lump.y + 20 }, { duration: 0.8, ease: ease.inQuad })
        .then(() => lump.destroy());
      void tw.to(lump.scale, { x: 1.6, y: 0.3 }, { duration: 0.8 });
      if (firstShimmer) await tw.to(cv.shimmer, { alpha: 1 }, { duration: 0.6 });
      else await tw.wait(0.6);
      cv.pulse = 0.8;
    } else if (o === 'settle') {
      const c = COLORS[m];
      this.ctx.particles.burst(cv.x, cv.y + cv.surface + 20, {
        colors: [c.fill, c.line],
        count: m === 'pebble' ? 3 : 14,
        speed: [20, 70],
        gravity: 700,
        angle: Math.PI / 2,
        spread: 0.5,
        size: m === 'pebble' ? [0.6, 0.8] : [0.2, 0.35],
      });
      cv.heap.y = -24;
      cv.heap.alpha = 0.3;
      void tw.to(cv.heap, { alpha: 1 }, { duration: 0.4 });
      await tw.to(cv.heap, { y: 0 }, { duration: 0.6, ease: ease.outBack });
      sfx.clunk();
    } else {
      cv.floating.y = -70;
      sfx.pop(9);
      await tw.to(cv.floating, { y: 0 }, { duration: 0.6, ease: ease.outBack });
      await tw.to(cv.floating, { rotation: 0.05 }, { duration: 0.15 });
      await tw.to(cv.floating, { rotation: 0 }, { duration: 0.4, ease: ease.outElastic });
    }
  }

  /** A tap on a cup. Levels 1, 2 and 4: a free look, and a shimmer says "still in there". Levels 3 and 5 answer with it. */
  private tapCup(slot: CupSlot) {
    if (this.finished) return;
    this.rest = 0;
    if (this.find) return void this.findTap(this.cups.indexOf(slot));
    if (this.sort) return void this.lookTap();
    this.look(slot);
  }

  private look(slot: CupSlot) {
    slot.view.pulse = 1;
    sfx.sparkle();
    if (slot.cup.shimmer.length) {
      this.stillThere = true;
      void this.ctx.say('stirsee.still');
    }
    if (this.ctx.tw.busy(slot.view)) return;
    void this.ctx.tw
      .to(slot.view, { rotation: 0.05 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(slot.view, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }));
  }

  // Level 3: which one? -------------------------------------------------------------------------------

  private askFind() {
    const f = this.find!;
    if (f.finished) return;
    void this.ctx.instruct('stirsee.instruct.find', { thing: wordOf(f.question.target) });
  }

  private async findTap(i: number) {
    const f = this.find!;
    if (this.busy || f.finished || i < 0) return;
    const slot = this.cups[i];
    const right = f.answer;
    const out = f.tap(i);
    this.misses = f.misses;
    this.hints = f.hints;
    slot.view.pulse = 1;
    if (slot.cup.shimmer.length) this.stillThere = true;
    if (!out.done) {
      sfx.boing();
      this.wiggle(slot.view);
      if (out.hint) void this.ctx.say(out.hint);
      if (out.glow) this.setGlowCup(right);
      return;
    }
    this.busy = true;
    if (out.supported) {
      // A third wrong tap: the clue, then the pet taps the right cup for her.
      sfx.boing();
      if (out.hint) await this.ctx.say(out.hint);
      this.setGlowCup(right);
      await this.ctx.tw.wait(0.4);
      sfx.tick();
      this.cups[right].view.pulse = 1;
    } else {
      this.ctx.pet.cheer();
      sfx.bell(9, 0.3);
    }
    const target = this.cups[right];
    void this.ctx.tw.to(target.view.scale, { x: 1.1, y: 1.1 }, { duration: 0.2 });
    const line = target.cup.shimmer.length ? this.ctx.say('stirsee.still') : this.ctx.say('stirsee.right');
    if (target.cup.shimmer.length) this.stillThere = true;
    await line;
    this.setGlowCup(null);
    if (f.finished) return void this.end();
    await Promise.all(
      this.cups.map((c) => this.ctx.tw.to(c.view, { alpha: 0, y: c.view.y + 40 }, { duration: 0.3 })),
    );
    this.showQuestion();
    this.place();
    for (const c of this.cups) c.view.alpha = 0;
    await Promise.all(this.cups.map((c) => this.ctx.tw.to(c.view, { alpha: 1 }, { duration: 0.3 })));
    this.busy = false;
    this.askFind();
  }

  // Level 4: what will it do? -----------------------------------------------------------------------------

  private askGuess() {
    const g = this.guess!;
    if (g.finished) return;
    if (g.guess) void this.ctx.instruct('stirsee.instruct.test');
    else void this.ctx.instruct('stirsee.instruct.guess', { thing: wordOf(g.material) });
  }

  private choose(o: Outcome) {
    const g = this.guess!;
    this.choicePulse[o] = 1;
    if (this.finished || this.busy || g.finished) return;
    this.rest = 0;
    sfx.pluck(o === 'vanish' ? 9 : o === 'settle' ? 2 : 6);
    const first = !g.guess;
    g.choose(o);
    this.poseGuess();
    if (first) this.askGuess();
  }

  /** The picked card lifts and stays ringed as "what you thought"; the others dim. */
  private poseGuess() {
    const picked = this.guess?.guess ?? null;
    for (const o of OUTCOMES) {
      const c = this.choices[o];
      c.alpha = picked && picked !== o ? 0.55 : 1;
      c.pivot.y = picked === o ? 12 : 0;
    }
    this.poseSpoon();
    this.drawGlow();
  }

  private async guessTap() {
    const g = this.guess!;
    const m = g.material;
    const out = g.test();
    if (!out) return;
    this.busy = true;
    this.poseSpoon();
    await this.stirIn(this.cups[0], m);
    if (out.match) this.ctx.pet.cheer();
    await this.ctx.say(out.line);
    if (g.finished) return void this.end();
    // A fresh cup of clear water for the next one.
    const old = this.cups[0].view;
    await this.ctx.tw.to(old, { x: -200, alpha: 0 }, { duration: 0.4, ease: ease.inQuad });
    this.clearCups();
    this.addCup(emptyCup(), null);
    this.place();
    const next = this.cups[0].view;
    const x = next.x;
    next.x = this.view.w + 160;
    this.showSpoon();
    this.poseGuess();
    await this.ctx.tw.to(next, { x }, { duration: 0.45, ease: ease.outBack });
    this.busy = false;
    this.rest = 0;
    this.poseGuess();
    this.askGuess();
  }

  // Level 5: sort the cups ---------------------------------------------------------------------------------

  private async lookTap() {
    const s = this.sort!;
    if (this.busy || s.finished) return;
    const slot = this.cups[0];
    if (s.looked) return this.look(slot);
    s.look();
    this.busy = true;
    await this.settleCup(slot);
    this.busy = false;
  }

  /** The swirl stops and the cup shows what it holds, with its line. */
  private async settleCup(slot: CupSlot) {
    const cv = slot.view;
    sfx.sparkle();
    void this.ctx.tw.to(cv.swirl, { alpha: 0 }, { duration: 0.4 });
    await this.ctx.tw.wait(0.3);
    cv.swirl.alpha = 1;
    cv.setSwirling(false);
    this.seen.add(outcomeOf(slot.material!));
    cv.pulse = 1;
    if (slot.cup.shimmer.length) this.stillThere = true;
    await this.reveal(slot, emptyCup(), slot.material!);
    void this.ctx.say(sayStir(slot.material!));
  }

  private async fileTap(tray: Outcome) {
    const s = this.sort!;
    this.choicePulse[tray] = 1;
    if (this.finished || s.finished) return;
    sfx.pluck(tray === 'vanish' ? 9 : tray === 'settle' ? 2 : 6);
    if (this.busy) return;
    this.rest = 0;
    const slot = this.cups[0];
    const m = s.material;
    const out = s.file(tray);
    this.misses = s.misses;
    this.hints = s.hints;
    this.busy = true;
    if (out.looked) await this.settleCup(slot);
    if (out.miss) {
      await this.hop(slot.view, this.choices[tray]);
      if (out.glow) this.setGlowChoice(out.tray);
      if (!out.done) {
        if (out.hint) void this.ctx.say(out.hint);
        this.busy = false;
        return;
      }
      if (out.hint) await this.ctx.say(out.hint);
      this.choicePulse[out.tray] = 1;
      sfx.tick();
    }
    this.setGlowChoice(null);
    await this.land(slot.view, m, out.tray);
    if (!out.supported) {
      this.ctx.pet.cheer();
      const said = this.ctx.say(`stirsee.filed.${out.tray}` as const);
      if (s.finished) await said;
    }
    if (s.finished) return void this.end();
    this.clearCups();
    const next = this.addCup(cupOf(s.material), s.material);
    next.view.setSwirling(true);
    this.place();
    const x = next.view.x;
    next.view.x = this.view.w + 160;
    await this.ctx.tw.to(next.view, { x }, { duration: 0.45, ease: ease.outBack });
    this.place();
    this.busy = false;
  }

  private async hop(node: Container, to: Container) {
    const tw = this.ctx.tw;
    const home = { x: node.x, y: node.y };
    await tw.to(
      node,
      { x: home.x + (to.x - home.x) * 0.4, y: home.y + (to.y - home.y) * 0.4 },
      { duration: 0.22, ease: ease.outQuad },
    );
    sfx.boing();
    await tw.to(node, home, { duration: 0.45, ease: ease.outBack });
    this.place();
  }

  /** The cup goes into its tray, which keeps a small picture of what was in it. */
  private async land(node: Container, m: Material, tray: Outcome) {
    const tw = this.ctx.tw;
    const t = this.choices[tray];
    void tw.to(node.scale, { x: 0.3, y: 0.3 }, { duration: 0.35 });
    await tw.to(node, { x: t.x, y: t.y + 30 }, { duration: 0.35, ease: ease.inOutSine });
    node.visible = false;
    const pic = heapArt(m, 30);
    pic.position.set(this.filed[tray].length === 0 ? -34 : 34, 76);
    t.addChild(pic);
    this.filed[tray].push(m);
    this.choicePulse[tray] = 1;
    sfx.pluck(4);
    void tw.wait(0.12).then(() => sfx.pluck(7));
  }

  // Help ---------------------------------------------------------------------------------------------

  /** Show a hint: the right cup or tray glows and the clue is spoken (one counted hint each); at level 4, how it works. */
  private async hint() {
    if (this.finished || this.busy) return;
    if (this.find && !this.find.finished) {
      const { glow, hint } = this.find.ask();
      this.hints = this.find.hints;
      this.setGlowCup(glow);
      void this.ctx.say(hint);
    } else if (this.guess && !this.guess.finished) {
      this.beckon = this.guess.guess ? 0 : 1;
      if (this.guess.guess) this.spoonPulse = 1;
      void this.ctx.say(this.guess.ask());
    } else if (this.sort && !this.sort.finished) {
      const out = this.sort.ask();
      this.hints = this.sort.hints;
      if (out.looked) {
        this.busy = true;
        await this.settleCup(this.cups[0]);
        this.busy = false;
      }
      this.setGlowChoice(out.glow);
      void this.ctx.say(out.hint);
    }
  }

  private setGlowCup(i: number | null) {
    this.glowCup = i;
    this.drawGlow();
  }

  private setGlowChoice(o: Outcome | null) {
    this.glowChoice = o;
    this.drawGlow();
  }

  private wiggle(node: Container) {
    if (this.ctx.tw.busy(node)) return;
    void this.ctx.tw
      .to(node, { rotation: 0.08 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }));
  }

  // Round end and the pause sheet -------------------------------------------------------------------------

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.glowCup = null;
    this.glowChoice = null;
    this.drawGlow();
    await this.ctx.tw.wait(0.6);
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say(this.guess ? 'stirsee.done.guess' : 'stirsee.done');
    const discoveries = [
      ...OUTCOMES.filter((o) => this.seen.has(o)).map((o) => entryId('stir-see', discoveryOf(o))),
      ...(this.stillThere ? [entryId('stir-see', 'still-there')] : []),
    ];
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries });
  }

  /** Start again: the part in play goes back to how it began; counts and what was filed stay. */
  restart() {
    if (this.finished || this.busy) return;
    this.setGlowCup(null);
    this.setGlowChoice(null);
    if (this.plan.mode === 'stir' || this.plan.mode === 'three') {
      this.index = 0;
      this.cups[0].cup = emptyCup();
      this.cups[0].view.show(this.cups[0].cup);
      this.showSpoon();
    }
    if (this.guess) {
      this.guess.clear();
      this.poseGuess();
      this.askGuess();
    }
    this.start();
  }

  // Layout -------------------------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.layout = cupLayout(v, this.plan.mode);
    this.place();
  }

  private place() {
    const L = this.layout;
    const v = this.view;
    const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
    const tableY = L.cups[0] ? L.cups[0].y + L.cups[0].h : v.h * 0.6;
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.blue.light)
      .rect(0, tableY - 6, v.w, v.h - tableY + 6)
      .fill({ color: swatch.teal.light, alpha: 0.9 });
    this.cups.forEach((c, i) => {
      const b = L.cups[Math.min(i, L.cups.length - 1)];
      if (this.ctx.tw.busy(c.view) || !c.view.visible) return;
      if (c.view.cw !== b.w || c.view.ch !== b.h) {
        c.view.resizeTo(b.w, b.h);
        c.view.show(c.cup);
      }
      const p = centre(b);
      c.view.position.set(p.x, p.y);
    });
    if (L.spoon) {
      this.spoonButton.position.copyFrom(centre(L.spoon));
      this.spoonK = L.spoon.w / 150;
      this.spoonButton.scale.set(this.spoonK);
    }
    OUTCOMES.forEach((o, i) => {
      const b = L.choices[i];
      if (!b) return;
      this.choices[o].position.copyFrom(centre(b));
      this.choiceK = b.w / this.choiceTile;
      this.choices[o].scale.set(this.choiceK);
    });
    if (L.card) this.card.position.copyFrom(centre(L.card));
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.finished) return;
    const ring = (x: number, y: number, w: number, h: number) =>
      g.roundRect(x - w / 2, y - h / 2, w, h, 26).stroke({ width: 8, color: swatch.yellow.line });
    const picked = this.guess?.guess;
    if (picked) {
      const c = this.choices[picked];
      ring(
        c.x,
        c.y - c.pivot.y * this.choiceK,
        this.choiceTile * this.choiceK + 20,
        this.choiceTile * this.choiceK + 20,
      );
    }
    if (this.glowChoice) {
      const c = this.choices[this.glowChoice];
      ring(c.x, c.y, this.choiceTile * this.choiceK + 40, this.choiceTile * this.choiceK + 40);
    }
    if (this.glowCup !== null && this.cups[this.glowCup]) {
      const c = this.cups[this.glowCup].view;
      ring(c.x, c.y, c.cw + 30, c.ch + 40);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    for (const c of this.cups) c.view.update(dt);
    if (this.spoonPulse > 0) {
      this.spoonPulse = Math.max(0, this.spoonPulse - dt * 2.4);
      this.spoonButton.scale.set(this.spoonK * (1 + 0.14 * Math.sin(this.spoonPulse * Math.PI)));
    }
    for (const o of OUTCOMES) {
      if (this.choicePulse[o] <= 0) continue;
      this.choicePulse[o] = Math.max(0, this.choicePulse[o] - dt * 2.6);
      if (!this.ctx.tw.busy(this.choices[o].scale))
        this.choices[o].scale.set(this.choiceK * (1 + 0.1 * Math.sin(this.choicePulse[o] * Math.PI)));
    }
    if (this.guess && !this.guess.guess) {
      if (this.beckon > 0) this.beckon = Math.max(0, this.beckon - dt * 1.6);
      const k = 1 + 0.08 * Math.sin(this.beckon * Math.PI * 2);
      for (const o of OUTCOMES) if (this.choicePulse[o] <= 0) this.choices[o].scale.set(this.choiceK * k);
    }
    if (this.busy || this.finished || this.ctx.demo) return;
    this.rest += dt;
    if (this.rest < REST_BEFORE_HELP) return;
    this.rest = 0;
    // A long rest: at levels 1–2 the pet taps the spoon for her, so the round always finishes (nothing is counted);
    // elsewhere it asks again.
    if (this.plan.mode === 'stir' || this.plan.mode === 'three') this.useSpoon(true);
    else if (this.find) this.askFind();
    else if (this.guess) this.askGuess();
  }

  destroy() {
    this.cardPic?.destroy({ children: true });
    if (this.plan.mode !== 'find') this.card.destroy({ children: true });
    if (this.plan.mode === 'find' || this.plan.mode === 'sort') this.spoonButton.destroy({ children: true });
    if (this.plan.mode !== 'guess' && this.plan.mode !== 'sort')
      for (const o of OUTCOMES) this.choices[o].destroy({ children: true });
  }
}

export const stirSee: GameModule = {
  id: 'stir-see',
  name: 'Stir and See',
  titleLine: 'game.stir-see',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['mixtures', 'cause-and-effect', 'observation', 'prediction'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.bubbles,
  upright: true,
  coplayHint: 'Ask {name} where the sugar went. Is it still in there?',
  offScreen: {
    all: 'Stir a spoon of sugar into a clear glass of water together, and a spoon of sand into another. What do you see?',
    school:
      'Try a pinch of salt, a pebble and a leaf in three cups of water. Which vanish, which sink, which float?',
  },
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker: (seed) => iconArt(seed),
  create: (ctx) => new StirSee(ctx),
};
