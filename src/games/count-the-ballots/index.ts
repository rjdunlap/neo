import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { isParentPanelOpen } from '../../parent/panel';
import { hinted, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon, undoIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { ballotBox, ride, rideColor, slip } from './art';
import { layout, type Layout } from './layout';
import {
  LEVELS,
  LastMove,
  MAJORITY,
  VOTERS,
  describeLevel,
  gridStep,
  makeRound,
  movers,
  pileFor,
  rideName,
  type Round,
} from './logic';

const line = (id: string) => id as LineId;

/** `sort`: first choices. `counting`: the piles are being counted aloud. `runoff`: the smallest pile's ballots move on. `question`: level 2's first count. */
type Stage = 'sort' | 'counting' | 'runoff' | 'question' | 'done';

class CountTheBallots implements Game {
  readonly round: Round;
  stage: Stage = 'sort';
  /** The pile each ballot sits in, or null while it is in the hand. */
  placed: (number | null)[] = Array.from({ length: VOTERS }, () => null);
  selected: number | null = null;
  finished = false;
  private readonly score = newTally();
  private readonly missesBy = new Map<number, number>();
  private readonly hintedFor = new Set<number>();
  private questionHinted = false;
  private outShown = false;
  /** Piles' numbers are shown once they have been counted aloud. */
  private counted: (number | null)[] = [null, null, null];
  private glow: number | null = null;
  /** The pile a 1–3 key picked, waiting for Enter. */
  private pilePick: number | null = null;
  /** The ballot a finger is carrying right now, so a redraw leaves it under the finger. */
  private carrying: number | null = null;
  private pickedWas = false;
  private readonly last = new LastMove();
  private readonly drags: DragHandle[] = [];
  private gen = 0;
  private clock = 0;
  private L: Layout;
  private readonly backdrop: Backdrop;
  private readonly cards: Container[] = [];
  private readonly cardArt: Graphics[] = [];
  private readonly cardNums: Text[][] = [];
  private readonly trays: Container[] = [];
  private readonly trayArt: Graphics[] = [];
  private readonly trayNum: Text[] = [];
  private readonly trayOut: Text[] = [];
  readonly help = new Container();
  readonly undoBtn: RoundButton;
  readonly restartBtn: RoundButton;
  private readonly helpArt = new Graphics();
  private readonly glowArt = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.round = makeRound(ctx.level, ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [0xd9c8f2, 0xffe9c4],
        hills: [0xb9c8f2, 0x9ed6d8, 0xa8dc8f],
        horizon: 0.3,
        clouds: 2,
        sun: false,
        seed: 163,
      },
      ctx.view,
    );
    this.L = layout(ctx.view);
    ctx.stage.addChild(this.backdrop);
    for (let c = 0; c < 3; c++) {
      const t = new Container();
      const art = new Graphics();
      art.eventMode = 'none';
      const num = label('', 44);
      const out = label('Out', 30, swatch.red.line);
      num.eventMode = out.eventMode = 'none';
      t.addChild(art, num, out);
      onTap(t, () => this.tapPile(c));
      this.trays.push(t);
      this.trayArt.push(art);
      this.trayNum.push(num);
      this.trayOut.push(out);
      ctx.stage.addChild(t);
    }
    for (let i = 0; i < VOTERS; i++) {
      const k = new Container();
      const art = new Graphics();
      art.eventMode = 'none';
      const nums = [1, 2, 3].map((n) => {
        const t = label(String(n), 24, ink);
        t.eventMode = 'none';
        return t;
      });
      k.addChild(art, ...nums);
      this.drags.push(
        draggable(k, ctx.tw, {
          lift: 0,
          onPick: () => {
            this.pickedWas = this.selected === i;
            this.carrying = i;
            this.selected = i;
            this.glow = null;
          },
          onDrop: (x, y) => this.dropCard(i, x, y),
        }),
      );
      this.cards.push(k);
      this.cardArt.push(art);
      this.cardNums.push(nums);
      ctx.stage.addChild(k);
    }
    this.glowArt.eventMode = 'none';
    this.helpArt.eventMode = 'none';
    const helpText = label('Help', 32);
    helpText.eventMode = 'none';
    this.help.addChild(this.helpArt, helpText);
    onTap(this.help, () => this.askForHint());
    this.undoBtn = new RoundButton(undoIcon(), swatch.white, 50, () => this.undo());
    this.restartBtn = new RoundButton(againIcon(), swatch.white, 50, () => this.restart());
    ctx.stage.addChild(this.glowArt, this.help, this.undoBtn, this.restartBtn);
    if (!ctx.demo) ctx.listen(window, 'keydown', this.onKey);
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.round.level,
      stage: this.stage,
      placed: this.placed.slice(),
      selected: this.selected,
      hand: this.round.hand.map((b) => b.join('')),
      out: this.round.out,
      plurality: this.round.plurality,
      winner: this.round.winner,
      misses: this.score.misses,
      hints: this.score.hints,
      glow: this.glow,
      finished: this.finished,
    };
  }

  /** The pile ballot `i` belongs in right now. */
  private target(i: number): number {
    return pileFor(this.round.hand[i], this.stage === 'runoff' ? this.round.out : null);
  }
  private remaining(): number[] {
    return this.round.hand.flatMap((_, i) => (this.placed[i] === null ? [i] : []));
  }

  start() {
    void this.ctx.instruct(line(`ballots.instruct.${this.round.level}`));
  }

  destroy() {
    for (const d of this.drags) d.destroy();
    this.finished = true;
    this.gen++;
  }

  // ---- play ----

  /** A ballot let go at (x, y): a still tap lifts or lowers it; a drop on a pile is the same as tapping that pile. */
  private dropCard(i: number, x: number, y: number): boolean {
    this.carrying = null;
    if (this.drags[i].tapped) {
      this.selected = this.pickedWas ? null : i;
      sfx.tick();
      this.draw();
      return false;
    }
    const c = this.pileAt(x, y);
    this.draw();
    if (c < 0 || this.finished || (this.stage !== 'sort' && this.stage !== 'runoff')) return false;
    if (c !== this.target(i)) return (void this.wrong(i), false);
    this.place(i, c);
    return true;
  }

  private pileAt(x: number, y: number): number {
    const { w, h } = this.L.tray;
    return this.L.piles.findIndex((p) => Math.abs(x - p.x) <= w / 2 && Math.abs(y - p.y) <= h / 2);
  }

  /** The one-step Undo: the last ballot moved comes back to the hand. Never a miss, never a hint. */
  undo() {
    if (this.finished || (this.stage !== 'sort' && this.stage !== 'runoff')) return;
    const i = this.last.undo(this.placed);
    if (i === null) return;
    this.selected = i;
    this.glow = null;
    this.pilePick = null;
    this.draw();
  }

  /** Starts the same deal over, from the first count. Misses and hints already earned stay as they are. */
  restart() {
    if (this.finished) return;
    this.gen++;
    this.stage = 'sort';
    this.placed = Array.from({ length: VOTERS }, () => null);
    this.selected = this.glow = this.pilePick = null;
    this.counted = [null, null, null];
    this.outShown = false;
    this.last.clear();
    this.draw();
  }

  /** Arrow keys walk the hand, 1 to 3 pick a pile, Enter or Space moves the ballot there, Backspace undoes. */
  private onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || this.finished || isParentPanelOpen()) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]'))
      return;
    const sorting = this.stage === 'sort' || this.stage === 'runoff';
    const arrow = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key);
    const digit = Number(e.key);
    if (arrow >= 0 && sorting) {
      e.preventDefault();
      this.selected = gridStep(this.placed, this.selected, arrow);
      this.glow = null;
      sfx.tick();
      this.draw();
    } else if (digit >= 1 && digit <= 3 && (sorting || this.stage === 'question')) {
      e.preventDefault();
      this.pilePick = digit - 1;
      sfx.tick();
      this.draw();
    } else if ((e.key === 'Enter' || e.key === ' ') && this.pilePick !== null) {
      e.preventDefault();
      const c = this.pilePick;
      this.pilePick = null;
      this.tapPile(c);
      this.draw();
    } else if (e.key === 'Backspace' && sorting) {
      e.preventDefault();
      this.undo();
    }
  };

  private tapPile(c: number) {
    if (this.finished) return;
    if (this.stage === 'question') return void this.answer(c);
    if (this.stage !== 'sort' && this.stage !== 'runoff') return;
    const i = this.selected;
    if (i === null) {
      sfx.tick();
      void this.ctx.say(line('ballots.pick'));
      return;
    }
    if (c === this.target(i)) this.place(i, c);
    else this.wrong(i);
  }

  private place(i: number, c: number) {
    this.placed[i] = c;
    this.last.record(i);
    this.pilePick = null;
    this.selected = null;
    this.glow = null;
    sfx.pluck(i % 5, 0.3);
    const at = this.L.piles[c];
    this.ctx.particles.burst(at.x, at.y - this.L.tray.h / 4, {
      kind: 'dot',
      colors: [rideColor(this.round.rides[c]).fill, 0xffffff],
      count: 6,
      speed: [40, 100],
      gravity: 0,
      life: [0.25, 0.5],
    });
    this.draw();
    if (this.remaining().length === 0) void this.advance();
  }

  private wrong(i: number) {
    this.score.misses++;
    const n = (this.missesBy.get(i) ?? 0) + 1;
    this.missesBy.set(i, n);
    sfx.boing();
    const card = this.cards[i];
    card.rotation = 0.14;
    void this.ctx.tw.to(card, { rotation: 0 }, { duration: 0.4 });
    const right = this.target(i);
    const vars = { ride: rideName(this.round, right) };
    void this.ctx.say(line(this.stage === 'runoff' ? 'ballots.wrong-next' : 'ballots.wrong'), vars);
    // After two misses on one ballot the right pile glows: one hint.
    if (n === 2) this.hintBallot(i, false);
  }

  private hintBallot(i: number, speak: boolean) {
    if (!this.hintedFor.has(i)) {
      this.hintedFor.add(i);
      hinted(this.score);
    }
    this.glow = this.target(i);
    if (speak) void this.ctx.say(line('ballots.hint'), { ride: rideName(this.round, this.glow) });
  }

  /** The Help button, and the pause sheet's "show a hint". */
  askForHint() {
    if (this.finished) return;
    if (this.stage === 'question') {
      if (!this.questionHinted) {
        this.questionHinted = true;
        hinted(this.score);
      }
      this.glow = this.round.plurality;
      return;
    }
    if (this.stage !== 'sort' && this.stage !== 'runoff') return;
    const i = this.selected ?? this.remaining()[0];
    if (i === undefined) return;
    this.selected = i;
    this.hintBallot(i, true);
    this.draw();
  }

  // ---- the counts ----

  private async countAloud(g: number, from: number[]) {
    for (let c = 0; c < 3; c++) {
      if (this.stage === 'runoff' && c === this.round.out) continue;
      this.counted[c] = from[c];
      this.draw();
      sfx.bell(c * 2, 0.3);
      await this.ctx.say(line('ballots.count'), { ride: rideName(this.round, c), n: from[c] });
      if (g !== this.gen) return false;
    }
    return true;
  }

  private async advance() {
    const g = ++this.gen;
    const second = this.stage === 'runoff';
    this.stage = 'counting';
    this.selected = null;
    this.glow = null;
    this.pilePick = null;
    this.last.clear();
    await this.ctx.tw.wait(0.4);
    if (g !== this.gen) return;
    if (!second) {
      this.stage = 'sort';
      if (!(await this.countAloud(g, this.round.first))) return;
      this.stage = 'counting';
      this.outShown = true;
      this.draw();
      sfx.rumble();
      await this.ctx.say(line('ballots.none'), {
        need: MAJORITY,
        ride: rideName(this.round, this.round.out),
      });
      if (g !== this.gen) return;
      // The smallest pile's ballots come back to their hand slots, each now looking for its next choice.
      for (const i of movers(this.round)) this.placed[i] = null;
      this.counted = [null, null, null];
      this.stage = 'runoff';
      sfx.whoosh();
      this.draw();
      void this.ctx.say(line('ballots.runoff'));
      return;
    }
    this.stage = 'runoff';
    if (!(await this.countAloud(g, this.round.second))) return;
    this.stage = 'counting';
    const w = this.round.winner;
    this.celebrate(w);
    await this.ctx.say(line('ballots.five'), { ride: rideName(this.round, w), n: this.round.second[w] });
    if (g !== this.gen) return;
    if (this.round.level === 1) return void this.end(g, false);
    // Level 2: what did the first count alone say?
    this.stage = 'question';
    this.counted = [...this.round.first];
    this.outShown = false;
    this.draw();
    void this.ctx.instruct(line('ballots.ask'));
  }

  private celebrate(c: number) {
    const at = this.L.piles[c];
    sfx.tada();
    this.ctx.particles.burst(at.x, at.y, {
      kind: 'dot',
      colors: [swatch.yellow.fill, swatch.pink.fill, 0xffffff],
      count: 22,
      speed: [80, 220],
      gravity: 120,
      life: [0.5, 1],
    });
  }

  private async answer(c: number) {
    if (c !== this.round.plurality) {
      this.score.misses++;
      sfx.boing();
      void this.ctx.say(line('ballots.ask-wrong'));
      if (!this.questionHinted) {
        this.questionHinted = true;
        hinted(this.score);
      }
      this.glow = this.round.plurality;
      return;
    }
    const g = ++this.gen;
    this.stage = 'counting';
    this.glow = null;
    sfx.bell(4, 0.3);
    await this.end(g, true);
  }

  private async end(g: number, asked: boolean) {
    this.stage = 'done';
    this.finished = true;
    this.draw();
    this.ctx.pet.cheer();
    const r = this.round;
    if (asked)
      await this.ctx.say(line('ballots.found'), {
        first: rideName(r, r.plurality),
        second: rideName(r, r.winner),
      });
    else await this.ctx.say(line('ballots.same'), { ride: rideName(r, r.winner) });
    if (g !== this.gen) return;
    await this.ctx.tw.wait(0.4);
    if (g !== this.gen) return;
    this.ctx.finish(tally(this.score));
  }

  // ---- drawing ----

  private slipsIn(c: number): number {
    if (this.round.level === 2 && (this.stage === 'question' || this.stage === 'done'))
      return this.round.first[c];
    return this.placed.filter((p) => p === c).length;
  }

  private draw() {
    const L = this.L,
      r = this.round;
    const second = this.stage === 'runoff';
    const { w: cw, h: ch } = L.card;
    this.round.hand.forEach((b, i) => {
      const g = this.cardArt[i];
      g.clear();
      const k = this.cards[i];
      k.visible = true;
      const s = L.slots[i];
      const lifted = this.selected === i;
      if (this.carrying !== i) k.position.set(s.x, s.y);
      this.drags[i].enabled = this.placed[i] === null && (this.stage === 'sort' || this.stage === 'runoff');
      if (this.placed[i] !== null || this.stage === 'done' || this.stage === 'question') {
        // Its place in the hand: an empty outline.
        g.roundRect(-cw / 2, -ch / 2, cw, ch, 12).stroke({ width: 3, color: wood.line, alpha: 0.35 });
        for (const n of this.cardNums[i]) n.visible = false;
        return;
      }
      g.roundRect(-cw / 2, -ch / 2, cw, ch, 12)
        .fill(cream)
        .stroke(lifted ? { width: 8, color: swatch.yellow.fill } : { width: 4, color: wood.fill });
      const pick = second ? pileFor(b, r.out) : b[0];
      b.forEach((cand, rank) => {
        const x = L.across ? (rank - 1) * (cw / 3) : -cw / 4;
        const y = L.across ? 8 : (rank - 1) * (ch / 3);
        const rad = L.across ? cw / 8.5 : ch / 8;
        ride(g, r.rides[cand], x, y, rad);
        const gone = second && cand === r.out;
        if (gone)
          g.moveTo(x - rad, y - rad)
            .lineTo(x + rad, y + rad)
            .moveTo(x + rad, y - rad)
            .lineTo(x - rad, y + rad)
            .stroke({ width: 5, color: swatch.red.fill });
        if (cand === pick) g.circle(x, y, rad * 1.15).stroke({ width: 4, color: swatch.green.fill });
        const n = this.cardNums[i][rank];
        n.visible = true;
        n.alpha = gone ? 0.35 : 1;
        n.position.set(L.across ? x : cw / 4, L.across ? -ch / 2 + 18 : y);
      });
    });
    for (let c = 0; c < 3; c++) {
      const { w: tw, h: th } = L.tray;
      const g = this.trayArt[c];
      const col = rideColor(r.rides[c]);
      const out = this.outShown && c === r.out;
      g.clear();
      g.roundRect(-tw / 2, -th / 2, tw, th, 18)
        .fill({ color: cream, alpha: out ? 0.55 : 0.95 })
        .stroke({ width: 6, color: col.line, alpha: out ? 0.5 : 1 });
      const rad = Math.min(tw * 0.22, 40);
      ride(g, r.rides[c], -tw * 0.22, -th / 2 + 56, rad);
      const n = out ? 0 : this.slipsIn(c);
      const sw = Math.min(46, (tw - 30) / 3 - 6),
        sh = sw * 0.9,
        pitch = Math.min(sh + 6, (th - 112 - 12) / 3);
      for (let k = 0; k < n; k++)
        slip(
          g,
          ((k % 3) - 1) * (sw + 6),
          -th / 2 + 112 + Math.floor(k / 3) * pitch + sh / 2,
          sw,
          sh,
          col.light,
        );
      if (this.glow === c && !out)
        g.roundRect(-tw / 2 - 6, -th / 2 - 6, tw + 12, th + 12, 22).stroke({
          width: 8,
          color: swatch.yellow.fill,
          alpha: 0.5 + 0.5 * Math.sin(this.clock * 6),
        });
      const shown = this.counted[c];
      this.trayNum[c].text = shown === null || out ? '' : String(shown);
      this.trayNum[c].position.set(tw * 0.25, -th / 2 + 56);
      this.trayOut[c].text = out ? 'Out' : '';
      this.trayOut[c].position.set(tw * 0.25, -th / 2 + 56);
      if (this.pilePick === c)
        g.roundRect(-tw / 2 - 10, -th / 2 - 10, tw + 20, th + 20, 24).stroke({ width: 6, color: ink });
      this.trays[c].alpha = 1;
    }
  }

  resize(view: View) {
    this.L = layout(view);
    const L = this.L;
    this.backdrop.resize(view);
    L.slots.forEach((s, i) => {
      this.cards[i].position.set(s.x, s.y);
      this.drags[i].home = { x: s.x, y: s.y };
      this.cards[i].hitArea = new Rectangle(-L.card.w / 2, -L.card.h / 2, L.card.w, L.card.h);
    });
    L.piles.forEach((p, c) => {
      this.trays[c].position.set(p.x, p.y);
      this.trays[c].hitArea = new Rectangle(-L.tray.w / 2, -L.tray.h / 2, L.tray.w, L.tray.h);
    });
    this.help.position.set(L.help.x, L.help.y);
    this.help.hitArea = new Rectangle(-L.help.w / 2, -L.help.h / 2, L.help.w, L.help.h);
    this.undoBtn.position.set(L.undo.x, L.undo.y);
    this.restartBtn.position.set(L.restart.x, L.restart.y);
    this.helpArt
      .clear()
      .roundRect(-L.help.w / 2, -L.help.h / 2, L.help.w, L.help.h, 22)
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: wood.line });
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.glow !== null) this.draw();
  }

  // ---- the ghost finger ----

  private botWrong = false;
  private botHelped = false;

  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const pile = (c: number) => ({ on: this.trays[c], x: 0, y: 0 });
    if (this.stage === 'question') return { tap: pile(this.round.plurality) };
    if (this.stage !== 'sort' && this.stage !== 'runoff') return null;
    const left = this.remaining();
    if (!left.length) return null;
    if (this.selected === null) return { tap: { on: this.cards[left[0]], x: 0, y: 0 }, pause: 0.3 };
    const right = this.target(this.selected);
    // Once at level 1, a deliberate wrong pile for the wobble, then Help for its hint.
    if (this.round.level === 1 && this.stage === 'sort' && !this.botWrong) {
      this.botWrong = true;
      return { tap: pile((right + 1) % 3), pause: 0.5 };
    }
    if (this.round.level === 1 && this.botWrong && !this.botHelped) {
      this.botHelped = true;
      return { tap: { on: this.help, x: 0, y: 0 }, pause: 0.6 };
    }
    return { tap: pile(right) };
  }
}

function icon(): Container {
  const g = new Graphics();
  ballotBox(g, 1.1);
  return new Container().addChild(g);
}

function sticker(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const g = new Graphics();
  ballotBox(g, 1.3, true);
  g.position.set(0, 20);
  void seed;
  c.addChild(g);
  return c;
}

export const game: GameModule = {
  id: 'count-the-ballots',
  name: 'Count the Ballots',
  titleLine: 'ballots.title',
  region: 'cozy-village',
  challenge: 'logic',
  skills: ['counting', 'comparing', 'rules and fairness'],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint: "One reads each ballot's first choice aloud and the other puts it in its pile.",
  offScreen:
    "Nine slips of paper, each ranking three favourite ice creams: sort them into piles, then move the smallest pile's slips to their next choice.",
  ownKeys: true,
  hubIcon: () => new WigglyIcon(icon()),
  sticker,
  upright: true,
  touchDemo: true,
  create: (ctx) => new CountTheBallots(ctx),
};
