import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import {
  hinted,
  missEvery,
  missOnRequest,
  newRequestTally,
  nextRequest,
  tally,
  type RequestTally,
} from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { hubIconArt, spotBase, stickerArt, stonePiece, streamBed } from './art';
import {
  LEVELS,
  SPOT_SIZE,
  applyMove,
  bestChoice,
  bestMove,
  choiceLayout,
  describeLevel,
  effectiveTarget,
  hintSpot,
  isSteppingStone,
  level1Reply,
  makeCrossing,
  makeRound,
  petMove,
  stoneSpots,
  streamLayout,
  turningPoint,
  turningPointIndex,
  type CrossingState,
  type Move,
  type MoveRecord,
  type Seat,
  type Round,
  type StreamLayout,
} from './logic';

const WHY = {
  first: { 2: 'lp.why.first.2', 3: 'lp.why.first.3', 4: 'lp.why.first.4' },
  second: { 2: 'lp.why.second.2', 3: 'lp.why.second.3', 4: 'lp.why.second.4' },
} as const;

const WHY_MISERE = { first: 'lp.why5.first', second: 'lp.why5.second' } as const;

const STEP_WORDS: Record<number, string> = { 3: 'threes', 4: 'fours', 5: 'fives' };
const MOST_WORDS = ['none', 'one', 'two', 'three', 'four', 'five'];

type Phase = 'choose' | 'turn' | 'replay' | 'pet' | 'between' | 'done';

/** Last Pebble: lay one or two stones across the stream to land on the far bank. */
class LastPebble implements Game {
  readonly round: Round;
  readonly tally: RequestTally = newRequestTally();
  crossingIndex = 0;
  phase: Phase = 'turn';
  crossing: CrossingState;
  moves: MoveRecord[] = [];
  glowSpot: number | null = null;
  finished = false;

  private gen = 0;
  private saidAhead = false;
  private clock = 0;
  private L: StreamLayout;
  private readonly reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly backdrop: Backdrop;
  private readonly bedLayer = new Container();
  private readonly spotLayer = new Container();
  private readonly legalLayer = new Graphics();
  private readonly glowLayer = new Graphics();
  private readonly stoneLayer = new Container();
  spots: Container[] = [];
  private stoneNodes: (Container | null)[] = [];
  private rings: { spot: number; color: number }[] = [];
  /** The button she may pick (levels 3–4), glowing after two misses or on *Show me*. */
  glowChoice: Seat | null = null;
  choice: Seat | null = null;
  private readonly choiceLayer = new Container();
  private readonly takeLayer = new Container();
  private choiceNodes: { pick: Seat; node: Container }[] = [];

  private get spec() {
    return this.round.crossings[this.crossingIndex];
  }

  /** Misère crossing (level 5): landing on the far spot, the whirlpool, loses. */
  private get misere(): boolean {
    return this.spec.misere === true;
  }

  /** The spot every winning-move calculation aims at (`target - 1` in misère). */
  private get win(): number {
    return effectiveTarget(this.crossing.target, this.misere);
  }

  /** The voice line for pointing at `spot`. */
  private hintLine(spot: number): 'lp.hint-safe' | 'lp.hint-step' | 'lp.hint-reach' {
    if (this.misere) return spot === this.win ? 'lp.hint-safe' : 'lp.hint-step';
    return spot === this.crossing.target ? 'lp.hint-reach' : 'lp.hint-step';
  }

  /** The stream bed: lantern on the far bank, or on the safe stone before the whirlpool. */
  private bed(lit = this.crossing.pos >= this.win) {
    return streamBed(this.L, this.crossing.target, lit, this.misere ? this.win : undefined);
  }

  /** The line that opens the round. */
  private get introLine(): 'lp.intro' | 'lp.intro.3' | 'lp.intro.4' | 'lp.intro.5' {
    if (!this.spec.choose) return 'lp.intro';
    return this.round.level === 3 ? 'lp.intro.3' : this.round.level === 5 ? 'lp.intro.5' : 'lp.intro.4';
  }

  /** The most stones one turn may lay, as a word for the voice lines. */
  private get most(): string {
    return MOST_WORDS[this.take] ?? String(this.take);
  }

  /** Most stones one turn may lay on this crossing. */
  get take(): number {
    return this.spec.maxTake;
  }

  private set highlightRing(r: { spot: number; color: number } | null) {
    this.rings = r ? [r] : [];
  }

  constructor(private readonly ctx: GameContext) {
    this.round = makeRound(ctx.level, ctx.rng);
    const spec = this.round.crossings[0];
    this.crossing = makeCrossing(spec.target, spec.startPos);
    this.L = streamLayout(ctx.view, this.crossing.target);
    this.backdrop = new Backdrop(
      {
        sky: [0xcfe0ff, 0xfff6e0],
        hills: [0xb3c7f2, 0x9ed6c6, 0xa8dc8f],
        horizon: 0.25,
        clouds: 2,
        sun: true,
        seed: 173,
      },
      ctx.view,
    );
    this.bedLayer.eventMode = 'none';
    this.legalLayer.eventMode = 'none';
    this.glowLayer.eventMode = 'none';
    this.stoneLayer.eventMode = 'none';

    ctx.stage.addChild(
      this.backdrop,
      this.bedLayer,
      this.legalLayer,
      this.spotLayer,
      this.glowLayer,
      this.stoneLayer,
      this.takeLayer,
      this.choiceLayer,
    );
    this.rebuildBoard();
    if (this.spec.choose) this.openChoice();
  }

  /** Exposed for scripted browser play assertions. */
  get state() {
    const best = bestMove(this.crossing.pos, this.win, this.take);
    return {
      level: this.round.level,
      crossingIndex: this.crossingIndex,
      crossingsTotal: this.round.crossings.length,
      target: this.crossing.target,
      pos: this.crossing.pos,
      stones: this.crossing.stones.slice(),
      phase: this.phase,
      misses: this.tally.misses,
      hints: this.tally.hints,
      glowSpot: this.glowSpot,
      bestSpot: best === null ? null : this.crossing.pos + best,
      take: this.take,
      choice: this.choice,
      misere: this.misere,
      bestChoice: this.spec.choose ? bestChoice(this.win, this.take) : null,
      glowChoice: this.glowChoice,
      finished: this.finished,
    };
  }

  start() {
    void this.ctx.say(this.introLine, { most: this.most }).then(() => {
      if (!this.finished) void this.instruct();
    });
  }

  destroy() {
    this.finished = true;
    this.gen++;
    for (const node of this.stoneLayer.children) {
      this.ctx.tw.kill(node);
      this.ctx.tw.kill(node.scale);
    }
    for (const spot of this.spots) {
      this.ctx.tw.kill(spot);
      if (spot.children[0]) this.ctx.tw.kill(spot.children[0]);
    }
  }

  private instruct() {
    if (this.spec.choose)
      return this.ctx.instruct(
        this.round.level === 3 ? 'lp.instruct.3' : this.round.level === 5 ? 'lp.instruct.5' : 'lp.instruct.4',
        { most: this.most },
      );
    return this.ctx.instruct(this.round.level === 1 ? 'lp.instruct.1' : 'lp.instruct.2');
  }

  private rebuildBoard() {
    this.L = streamLayout(this.ctx.view, this.crossing.target);
    this.bedLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.bedLayer.addChild(this.bed());

    for (const s of this.spots) {
      this.ctx.tw.kill(s);
      if (s.children[0]) this.ctx.tw.kill(s.children[0]);
      s.destroy({ children: true });
    }
    this.spots = [];

    for (let i = 0; i < this.crossing.target; i++) {
      const spotNum = i + 1;
      const box = this.L.spots[i];
      const node = spotBase(spotNum, spotNum === this.crossing.target, this.L.spotSize, this.misere);
      node.position.set(box.x, box.y);
      node.hitArea = new Rectangle(-box.w / 2, -box.h / 2, box.w, box.h);
      onTap(node, () => this.tapSpot(spotNum));
      this.spots.push(node);
      this.spotLayer.addChild(node);
    }
    this.drawStones();
    this.buildTake();
  }

  private drawStones() {
    for (const node of this.stoneLayer.removeChildren()) {
      this.ctx.tw.kill(node);
      this.ctx.tw.kill(node.scale);
      node.destroy({ children: true });
    }
    this.stoneNodes = this.crossing.stones.map((owner, idx) => {
      if (!owner) return null;
      const spotNum = idx + 1;
      const box = this.L.spots[idx];
      const stone = stonePiece(
        owner,
        spotNum,
        this.L.spotSize,
        spotNum === this.crossing.target && !this.misere,
      );
      stone.position.set(box.x, box.y);
      this.stoneLayer.addChild(stone);
      return stone;
    });
  }

  private flashSpot(spotNum: number) {
    const press = this.spots[spotNum - 1]?.children[0] as Graphics | undefined;
    if (!press) return;
    this.ctx.tw.kill(press);
    press.alpha = 1;
    void this.ctx.tw.to(press, { alpha: 0 }, { duration: 0.32 });
  }

  private async layStones(player: 'her' | 'pet', delta: Move) {
    const from = this.crossing.pos;
    const { state, record } = applyMove(this.crossing, player, delta);
    this.crossing = state;
    this.moves.push(record);

    for (let s = from + 1; s <= state.pos; s++) {
      const box = this.L.spots[s - 1];
      const stone = stonePiece(player, s, this.L.spotSize, s === this.crossing.target && !this.misere);
      stone.position.set(box.x, box.y);
      stone.scale.set(1.22);
      stone.alpha = 0.7;
      this.stoneLayer.addChild(stone);
      this.stoneNodes[s - 1] = stone;
      if (player === 'her') sfx.pluck(Math.min(9, (s % 8) + 2), 0.28);
      else sfx.pluck(1, 0.28);
      await this.ctx.tw.to(
        stone.scale,
        { x: 1, y: 1 },
        { duration: this.reduce ? 0.12 : 0.22, ease: ease.outBack },
      );
      if (!stone.destroyed) stone.alpha = 1;
    }
  }

  private tapSpot(spotNum: number) {
    if (this.finished || this.phase !== 'turn') return;
    this.flashSpot(spotNum);

    const delta = spotNum - this.crossing.pos;
    if (delta < 1 || delta > this.take) {
      const targetNode = this.spots[spotNum - 1];
      if (targetNode) {
        this.ctx.tw.kill(targetNode);
        targetNode.rotation = 0.12;
        void this.ctx.tw.to(targetNode, { rotation: 0 }, { duration: 0.28, ease: ease.outBack });
      }
      sfx.tick();
      if (!this.saidAhead) {
        this.saidAhead = true;
        void this.ctx.say(this.take > 2 ? 'lp.pick-ahead.many' : 'lp.pick-ahead', { most: this.most });
      }
      return;
    }

    if (this.round.level === 1) {
      void this.playLevel1Move(delta as Move);
    } else {
      void this.playLevel2Move(delta as Move);
    }
  }

  readonly hintLabel = 'Show me';

  /** *Show me*: glows the winning stone (or at level 2 rewinds to the turning point first); a second tap plays it. */
  askForHint() {
    if (this.finished) return;
    if (this.phase === 'choose') {
      if (this.glowChoice !== null) {
        void this.pickSeat(this.glowChoice);
        return;
      }
      hinted(this.tally);
      this.tally.helped = true;
      this.glowChoice = bestChoice(this.win, this.take);
      void this.ctx.say('lp.hint-choice');
      return;
    }
    if (this.phase !== 'turn') return;
    if (this.glowSpot !== null) {
      this.tapSpot(this.glowSpot);
      return;
    }
    const g = this.gen;
    hinted(this.tally);
    this.tally.helped = true;

    const targetSpot = hintSpot(this.crossing.pos, this.win, this.take);
    if (targetSpot !== null) {
      this.glowSpot = targetSpot;
      void this.ctx.say(this.hintLine(targetSpot));
      return;
    }

    // In a losing position: rewind immediately to the turning point (or the choice) and glow its winning spot.
    void this.rewindToTurningPoint(g, true);
  }

  // ---- Level 1: Near the far bank ----

  private async playLevel1Move(delta: Move) {
    const g = ++this.gen;
    const beforePos = this.crossing.pos;
    const beforeMoves = this.moves.slice();
    const expected = bestMove(beforePos, this.crossing.target);
    const isGood = expected === delta;

    this.glowSpot = null;
    this.saidAhead = false;

    if (!isGood) {
      this.phase = 'replay';
      await this.layStones('her', delta);
      if (g !== this.gen) return;

      await this.ctx.tw.wait(this.reduce ? 0.18 : 0.35);
      if (g !== this.gen) return;

      const reply = level1Reply(this.crossing.pos, this.crossing.target);
      await this.layStones('pet', reply.move);
      if (g !== this.gen) return;

      this.highlightRing = { spot: reply.highlightSpot, color: swatch.purple.fill };
      sfx.boing();
      const showGlow = missOnRequest(this.tally);
      await Promise.all([this.ctx.say(reply.voice), this.ctx.tw.wait(this.reduce ? 0.35 : 0.7)]);
      if (g !== this.gen) return;

      await this.liftStonesBackTo(beforePos, g);
      if (g !== this.gen) return;

      this.highlightRing = null;
      this.moves = beforeMoves;
      this.crossing = {
        target: this.crossing.target,
        pos: beforePos,
        stones: this.crossing.stones.map((s, i) => (i < beforePos ? s : null)),
      };
      this.drawStones();
      this.phase = 'turn';

      if (showGlow) {
        hinted(this.tally);
        this.glowSpot = hintSpot(this.crossing.pos, this.win, this.take);
        if (this.glowSpot !== null) {
          await this.ctx.say(this.hintLine(this.glowSpot));
        }
      }
      return;
    }

    // Good move on Level 1
    this.phase = 'pet';
    await this.layStones('her', delta);
    if (g !== this.gen) return;

    if (this.crossing.pos === this.crossing.target) {
      await this.finishCrossing(g);
      return;
    }

    // She landed on T - 3: gentle celebration, then the pet plays its move
    this.highlightRing = { spot: this.crossing.pos, color: swatch.yellow.fill };
    sfx.bell(5, 0.25);
    await this.ctx.say('lp.good-stone');
    if (g !== this.gen) return;
    this.highlightRing = null;

    await this.ctx.tw.wait(this.reduce ? 0.2 : 0.45);
    if (g !== this.gen) return;

    const replyDelta = petMove(this.crossing.pos, this.win, this.round.seed);
    await this.layStones('pet', replyDelta);
    if (g !== this.gen) return;

    this.phase = 'turn';
  }

  // ---- Level 2: Across the stream ----

  private async playLevel2Move(delta: Move) {
    const g = ++this.gen;
    this.phase = 'pet';
    this.glowSpot = null;
    this.saidAhead = false;

    await this.layStones('her', delta);
    if (g !== this.gen) return;

    if (this.crossing.pos === this.crossing.target) {
      // Misère: laying a stone on the whirlpool is falling in.
      if (this.misere) await this.whirlpoolLoss(g, 'lp.whirlpool-fell');
      else await this.finishCrossing(g);
      return;
    }

    if (isSteppingStone(this.crossing.pos, this.win, this.take)) {
      sfx.bell(4, 0.2);
    }

    await this.ctx.tw.wait(this.reduce ? 0.2 : 0.5);
    if (g !== this.gen) return;

    const replyDelta = petMove(this.crossing.pos, this.win, this.round.seed, this.take);
    await this.layStones('pet', replyDelta);
    if (g !== this.gen) return;

    if (this.misere && this.crossing.pos === this.crossing.target) {
      // The pet was left only the whirlpool.
      this.phase = 'between';
      this.highlightRing = { spot: this.crossing.target, color: swatch.blue.fill };
      sfx.whoosh();
      await this.ctx.say('lp.splash');
      if (g !== this.gen) return;
      this.highlightRing = null;
      await this.finishCrossing(g);
      return;
    }

    if (this.misere && this.crossing.pos === this.win) {
      // She is left only the whirlpool: the crossing is lost here, so step back now.
      await this.whirlpoolLoss(g, 'lp.whirlpool-why');
      return;
    }

    if (this.crossing.pos === this.crossing.target) {
      this.phase = 'replay';
      this.highlightRing = { spot: this.crossing.target, color: swatch.purple.fill };
      sfx.boing();
      const showGlow = missEvery(this.tally);
      await Promise.all([this.ctx.say('lp.got-bank'), this.ctx.tw.wait(this.reduce ? 0.35 : 0.7)]);
      if (g !== this.gen) return;
      if (this.spec.choose && !turningPoint(this.moves, this.win, this.take)) {
        await this.rewindToChoice(g, showGlow);
      } else {
        await this.rewindToTurningPoint(g, showGlow, true);
      }
      return;
    }

    this.phase = 'turn';
  }

  /** Misère loss (the pet took the safe stone, or she laid on the whirlpool): say why, count a miss, step back. */
  private async whirlpoolLoss(g: number, line: 'lp.whirlpool-why' | 'lp.whirlpool-fell') {
    this.phase = 'replay';
    this.highlightRing = { spot: this.crossing.target, color: swatch.purple.fill };
    sfx.boing();
    const showGlow = missEvery(this.tally);
    await Promise.all([
      this.ctx.say(line, { step: STEP_WORDS[this.take + 1] ?? 'threes' }),
      this.ctx.tw.wait(this.reduce ? 0.35 : 0.7),
    ]);
    if (g !== this.gen) return;
    if (this.spec.choose && !turningPoint(this.moves, this.win, this.take)) {
      await this.rewindToChoice(g, showGlow);
    } else {
      await this.rewindToTurningPoint(g, showGlow, true);
    }
  }

  private async rewindToTurningPoint(g: number, showGlow: boolean, alreadySaidReason = false) {
    this.phase = 'replay';
    const tp = turningPoint(this.moves, this.win, this.take);
    const tpIdx = turningPointIndex(this.moves, this.win, this.take);
    const backTo = tp ? tp.from : 0;

    if (!alreadySaidReason) {
      // Show me with no turning point in the moves means her pick was the mistake: step back to the choice.
      if (this.spec.choose && !tp) {
        await this.rewindToChoice(g, true, false);
        return;
      }
      await this.ctx.say(this.misere ? 'lp.hint-forced' : 'lp.hint-rewind');
      if (g !== this.gen) return;
    }

    await this.liftStonesBackTo(backTo, g);
    if (g !== this.gen) return;

    this.highlightRing = null;
    this.moves = tpIdx >= 0 ? this.moves.slice(0, tpIdx) : [];
    this.crossing = {
      target: this.crossing.target,
      pos: backTo,
      stones: this.crossing.stones.map((s, i) => (i < backTo ? s : null)),
    };
    this.drawStones();
    this.phase = 'turn';

    if (showGlow) {
      if (!alreadySaidReason) {
        // Hint came from Show me (already counted in askForHint).
      } else {
        hinted(this.tally);
      }
      this.glowSpot = hintSpot(this.crossing.pos, this.win, this.take);
      if (alreadySaidReason && this.glowSpot !== null) {
        await this.ctx.say(this.hintLine(this.glowSpot));
      }
    }
  }

  // ---- Levels 3–4: she chooses who lays the first stone ----

  /** Draws the choice buttons over the middle of the (dimmed) board and waits for her pick. */
  private openChoice() {
    this.phase = 'choose';
    this.choice = null;
    this.spotLayer.alpha = 0.4;
    this.buildChoice();
  }

  /** The take, drawn as that many of her stones beside the stream for the whole crossing (levels 3–4). */
  private buildTake() {
    for (const c of this.takeLayer.removeChildren()) c.destroy({ children: true });
    if (!this.spec.choose) return;
    const gap = SPOT_SIZE * 0.5;
    const size = SPOT_SIZE * 0.5;
    const { board } = this.L;
    const upright = this.ctx.view.upright;
    for (let i = 0; i < this.take; i++) {
      const st = stonePiece('her', i + 1, size, false);
      const off = (i - (this.take - 1) / 2) * gap;
      if (upright) st.position.set(board.x + board.w / 2 + off, board.y + board.h + 48);
      else st.position.set(board.x - 64, board.y + board.h / 2 + off);
      this.takeLayer.addChild(st);
    }
  }

  private buildChoice() {
    for (const c of this.choiceLayer.removeChildren()) c.destroy({ children: true });
    this.choiceNodes = [];
    const boxes = choiceLayout(this.L);
    for (const box of boxes) {
      const node = new Container();
      node.position.set(box.x, box.y);
      node.hitArea = new Rectangle(-box.w / 2, -box.h / 2, box.w, box.h);
      const pad = tile(box.w, box.h, 'white');
      const mine = box.pick === 'first';
      const icon = stonePiece(mine ? 'her' : 'pet', mine ? 1 : 2, SPOT_SIZE * 0.8, false);
      icon.position.set(0, -box.h * 0.17);
      const text = label(mine ? 'I go first' : 'Pet goes first', 30, ink);
      text.position.set(0, box.h * 0.31);
      node.addChild(pad, icon, text);
      onTap(node, () => this.pickSeat(box.pick));
      this.choiceLayer.addChild(node);
      this.choiceNodes.push({ pick: box.pick, node });
    }
  }

  private async pickSeat(pick: Seat) {
    if (this.finished || this.phase !== 'choose') return;
    const g = ++this.gen;
    this.phase = 'pet';
    this.choice = pick;
    this.glowChoice = null;
    sfx.tick();
    for (const c of this.choiceLayer.removeChildren()) c.destroy({ children: true });
    this.choiceNodes = [];
    this.spotLayer.alpha = 1;
    await this.ctx.say(pick === 'first' ? 'lp.go-first' : 'lp.pet-first', { most: this.most });
    if (g !== this.gen) return;
    if (pick === 'second') {
      await this.ctx.tw.wait(this.reduce ? 0.15 : 0.35);
      if (g !== this.gen) return;
      const first = petMove(0, this.win, this.round.seed, this.take);
      await this.layStones('pet', first);
      if (g !== this.gen) return;
    }
    this.phase = 'turn';
  }

  /** Her pick was the mistake: light the stepping stones once, explain, clear the stream and ask again. */
  private async rewindToChoice(g: number, showGlow: boolean, countHint = true) {
    this.phase = 'replay';
    const right = bestChoice(this.win, this.take);
    this.rings = stoneSpots(this.win, this.take).map((spot) => ({
      spot,
      color: swatch.yellow.fill,
    }));
    await Promise.all([
      this.ctx.say(
        this.misere ? WHY_MISERE[right] : WHY[right][this.take === 4 ? 4 : this.take === 3 ? 3 : 2],
        {
          step: STEP_WORDS[this.take + 1] ?? 'threes',
        },
      ),
      this.ctx.tw.wait(this.reduce ? 0.5 : 1.2),
    ]);
    if (g !== this.gen) return;
    await this.liftStonesBackTo(0, g);
    if (g !== this.gen) return;
    this.rings = [];
    this.moves = [];
    this.glowSpot = null;
    this.crossing = makeCrossing(this.crossing.target, 0);
    this.drawStones();
    this.openChoice();
    if (showGlow) {
      if (countHint) hinted(this.tally);
      this.glowChoice = right;
    }
  }

  private async liftStonesBackTo(backTo: number, g: number) {
    const lifting: Promise<unknown>[] = [];
    for (let s = this.crossing.pos; s > backTo; s--) {
      const node = this.stoneNodes[s - 1];
      if (node) {
        lifting.push(
          this.ctx.tw.to(node, { y: node.y - 36, alpha: 0 }, { duration: this.reduce ? 0.18 : 0.36 }),
        );
      }
      await this.ctx.tw.wait(this.reduce ? 0.04 : 0.1);
      if (g !== this.gen) return;
    }
    await Promise.all(lifting);
  }

  private async finishCrossing(g: number) {
    this.phase = 'between';
    this.bedLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.bedLayer.addChild(this.bed(true));
    const lastBox = this.L.spots[this.crossing.target - 1];
    this.ctx.particles.burst(lastBox.x, lastBox.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff],
      count: 14,
      speed: [50, 140],
      gravity: 40,
      life: [0.35, 0.7],
    });
    this.ctx.pet.cheer();
    for (const step of [5, 7, 9]) {
      if (g !== this.gen) return;
      sfx.bell(step, 0.3);
      await this.ctx.tw.wait(0.11);
    }
    if (g !== this.gen) return;
    await this.ctx.say('lp.you-win');
    if (g !== this.gen) return;

    if (this.crossingIndex + 1 < this.round.crossings.length) {
      this.crossingIndex++;
      nextRequest(this.tally);
      const spec = this.round.crossings[this.crossingIndex];
      this.crossing = makeCrossing(spec.target, spec.startPos);
      this.moves = [];
      this.glowSpot = null;
      this.saidAhead = false;
      sfx.whoosh();
      this.rebuildBoard();
      this.choice = null;
      this.glowChoice = null;
      if (this.spec.choose) this.openChoice();
      else this.phase = 'turn';
      return;
    }

    this.phase = 'done';
    this.finished = true;
    sfx.tada();
    await this.ctx.say('lp.done');
    if (g !== this.gen) return;
    await this.ctx.tw.wait(0.25);
    if (g !== this.gen) return;
    this.ctx.finish(tally(this.tally));
  }

  resize(view: View) {
    this.backdrop.resize(view);
    this.L = streamLayout(view, this.crossing.target);
    if (this.phase === 'choose') this.buildChoice();
    this.buildTake();
    this.bedLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.bedLayer.addChild(this.bed());

    this.spots.forEach((node, idx) => {
      const box = this.L.spots[idx];
      node.position.set(box.x, box.y);
      node.hitArea = new Rectangle(-box.w / 2, -box.h / 2, box.w, box.h);
    });

    if (this.phase === 'turn') {
      this.drawStones();
    } else {
      this.stoneNodes.forEach((node, idx) => {
        if (node && !node.destroyed) node.position.set(this.L.spots[idx].x, this.L.spots[idx].y);
      });
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.legalLayer.clear();
    if (this.phase === 'turn') {
      for (let delta = 1; delta <= this.take; delta++) {
        const spot = this.crossing.pos + delta;
        if (spot > this.crossing.target) continue;
        const box = this.L.spots[spot - 1];
        const pulse = 3 + 2.5 * Math.sin(this.clock * 3.5 + delta);
        this.legalLayer
          .circle(box.x, box.y, SPOT_SIZE * 0.45 + pulse)
          .stroke({ width: 3.5, color: swatch.teal.light, alpha: 0.75 });
      }
    }

    this.glowLayer.clear();
    for (const ring of this.rings) {
      const box = this.L.spots[ring.spot - 1];
      this.glowLayer
        .circle(box.x, box.y, SPOT_SIZE * 0.48)
        .stroke({ width: 7, color: ring.color, alpha: 0.9 });
    }
    if (this.glowChoice !== null && this.phase === 'choose') {
      const box = choiceLayout(this.L).find((b) => b.pick === this.glowChoice);
      if (box) {
        const pulse = 4 + 3 * Math.sin(this.clock * 5);
        this.glowLayer
          .roundRect(
            box.x - box.w / 2 - pulse,
            box.y - box.h / 2 - pulse,
            box.w + 2 * pulse,
            box.h + 2 * pulse,
            24,
          )
          .stroke({ width: 8, color: swatch.yellow.fill });
      }
    }
    if (this.glowSpot !== null && this.phase === 'turn') {
      const box = this.L.spots[this.glowSpot - 1];
      const pulse = 4 + 3 * Math.sin(this.clock * 5);
      this.glowLayer
        .circle(box.x, box.y, SPOT_SIZE * 0.46 + pulse)
        .stroke({ width: 7, color: swatch.yellow.fill });
    }
  }

  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.phase === 'choose') {
      const right = bestChoice(this.win, this.take);
      const hit = this.choiceNodes.find((c) => c.pick === right);
      return hit ? { tap: { on: hit.node } } : null;
    }
    if (this.phase !== 'turn') return null;
    const d = bestMove(this.crossing.pos, this.win, this.take);
    if (d === null) return null;
    const node = this.spots[this.crossing.pos + d - 1];
    return node ? { tap: { on: node } } : null;
  }
}

export const game: GameModule = {
  id: 'last-pebble',
  name: 'Last Pebble',
  titleLine: 'game.last-pebble',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['planning', 'logic', 'looking ahead'],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint:
    'About 10 and up. Ask before she taps: count backwards in threes from the far bank—which stone stops the pet from reaching it?',
  offScreen:
    'Line up ten or eleven spoons or pebbles on the table. Take turns picking up one or two; whoever takes the last one wins. Try changing the starting count!',
  hubIcon: () => new WigglyIcon(hubIconArt()),
  sticker: (seed) => stickerArt(seed),
  upright: true,
  create: (ctx) => new LastPebble(ctx),
};
