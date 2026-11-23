import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { CRITTERS, Critter } from '../../art/critter';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { bridgeLayout, type Box } from './layout';
import {
  LEVELS,
  NAMES,
  boardFor,
  boardKey,
  check,
  code,
  countsAsMiss,
  cycle,
  describeLevel,
  hintFor,
  hintLine,
  missLine,
  roundPools,
  sentenceLine,
  title,
  words,
  type Board,
  type Domain,
  type Kind,
  type Name,
  type PoolId,
  type Step,
} from './logic';

/** The sentence, miss and hint ids are computed in `voice.ts`; `voice.test.ts` checks each one the pools produce has a line. */
const line = (id: string) => id as LineId;

const RULE = 'A Topsy islander says the opposite of what is so.';
const WORD: Record<Kind, string> = { straight: 'Straight', topsy: 'Topsy' };

/** The board each pool showed last, so the next round never repeats it. */
const lastBoard: Partial<Record<PoolId, string>> = {};

/** A lantern about 44 units tall at scale 1, centred on (x, y): upright for Straight, upside down for Topsy. */
function lantern(g: Graphics, x: number, y: number, s: number, upside = false, lit = true) {
  const d = upside ? -1 : 1;
  const glass = lit ? swatch.yellow : swatch.white;
  g.moveTo(x - 7 * s, y - 16 * s * d)
    .quadraticCurveTo(x, y - 30 * s * d, x + 7 * s, y - 16 * s * d)
    .stroke({ color: wood.line, width: 3 * s, cap: 'round' });
  g.roundRect(x - 11 * s, y - 18 * s * d - 3 * s, 22 * s, 6 * s, 2 * s).fill(wood.line);
  g.roundRect(x - 13 * s, y - 14 * s, 26 * s, 28 * s, 7 * s)
    .fill(glass.fill)
    .stroke({ color: glass.line, width: 3 * s });
  g.roundRect(x - 9 * s, y + 15 * s * d - 3 * s, 18 * s, 6 * s, 2 * s).fill(wood.line);
  if (lit) g.ellipse(x, y + 2 * s * d, 4 * s, 6 * s).fill(swatch.orange.fill);
}

/** Where the rope bridge runs in the scene box: `t` from the near bank (0) to the far bank (1). */
function bridgePoint(scene: Box, t: number) {
  const x0 = scene.x - scene.w / 2 + scene.w * 0.16;
  const x1 = scene.x + scene.w / 2 - scene.w * 0.2;
  return { x: x0 + (x1 - x0) * t, y: scene.y + scene.h * 0.08 + scene.h * 0.14 * 4 * t * (1 - t) };
}

/** The lake, both banks, the rope bridge and one lantern post per islander on the far bank. */
function drawScene(g: Graphics, scene: Box, posts: number, lit: number) {
  const { x, y, w, h } = scene;
  const left = x - w / 2;
  const top = y - h / 2;
  g.clear()
    .roundRect(left, top, w, h, 22)
    .fill(swatch.lavender.light)
    .roundRect(left, y + h * 0.1, w, h * 0.4, 22)
    .fill(swatch.blue.light);
  g.ellipse(left + w * 0.09, y + h * 0.32, w * 0.15, h * 0.3).fill(grass);
  g.ellipse(left + w * 0.9, y + h * 0.32, w * 0.2, h * 0.3).fill(grass);
  g.circle(left + w * 0.5, top + h * 0.22, h * 0.1).fill(cream);
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const p = bridgePoint(scene, i / steps);
    g.roundRect(p.x - w * 0.02, p.y - 3, w * 0.04, 7, 3).fill(wood.fill);
  }
  for (const lift of [0, h * 0.16]) {
    const a = bridgePoint(scene, 0);
    const b = bridgePoint(scene, 1);
    const mid = bridgePoint(scene, 0.5);
    g.moveTo(a.x, a.y - lift)
      .quadraticCurveTo(mid.x, 2 * mid.y - (a.y + b.y) / 2 - lift, b.x, b.y - lift)
      .stroke({ color: wood.line, width: 3 });
  }
  for (const end of [0, 1]) {
    const p = bridgePoint(scene, end);
    g.roundRect(p.x - 4, p.y - h * 0.2, 8, h * 0.24, 3).fill(wood.line);
  }
  for (let i = 0; i < posts; i++)
    lantern(g, x + w / 2 - w * 0.15 + i * w * 0.05, y - h * 0.12, h / 150, false, i < lit);
}

function icon() {
  const g = new Graphics();
  drawScene(g, { x: 0, y: 8, w: 108, h: 96 }, 0, 0);
  lantern(g, 0, -14, 1.05);
  return new Container().addChild(g);
}

function button(root: Container, run: () => void) {
  const node = new Container();
  const panel = new Graphics();
  const text = label('', 30);
  panel.eventMode = text.eventMode = 'none';
  node.addChild(panel, text);
  onTap(node, run);
  root.addChild(node);
  return { node, panel, text };
}

type Button = ReturnType<typeof button>;

function place({ node }: Button, { x, y, w, h }: Box) {
  node.position.set(x, y);
  node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
}

class Round implements Game {
  private readonly root = new Container();
  private readonly backdrop = new Graphics();
  private readonly scene = new Graphics();
  private readonly status = label(RULE, 26);
  private readonly bubbles: Button[];
  private readonly seats: (Button & { word: Text })[];
  private readonly critters: Record<Name, Critter>;
  private readonly helpButton = button(this.root, () => this.askForHint());
  private readonly crossButton = button(this.root, () => this.cross());
  private readonly boards: Board[];
  private readonly rejected = new Set<string>();
  private readonly counts = newTally();
  private at = 0;
  private marks: Domain[];
  private hint: Step | null = null;
  private hintedAt: string | null = null;
  private wrong: number | null = null;
  private blank: number | null = null;
  private reading: number | null = null;
  private lit = 0;
  private busy = false;
  /** Bumped by every touch, so a read-aloud in progress stops speaking over the player. */
  private turn = 0;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.boards = roundPools(ctx.level).map((id) => {
      const board = boardFor(id, ctx.rng, lastBoard[id]);
      lastBoard[id] = boardKey(board.seats, board.pattern);
      return board;
    });
    const count = this.boards[0].seats.length;
    this.marks = Array<Domain>(count).fill(null);
    this.backdrop.eventMode = this.scene.eventMode = this.status.eventMode = 'none';
    this.status.style.wordWrap = true;
    this.root.addChildAt(this.backdrop, 0);
    this.root.addChildAt(this.scene, 1);
    this.root.addChild(this.status);
    this.bubbles = [...Array(count).keys()].map((seat) => {
      const b = button(this.root, () => this.hear(seat));
      b.text.style.wordWrap = true;
      return b;
    });
    this.seats = [...Array(count).keys()].map((seat) => {
      const b = button(this.root, () => this.mark(seat));
      const word = label('', 24);
      word.eventMode = 'none';
      b.node.addChild(word);
      return { ...b, word };
    });
    this.critters = Object.fromEntries(
      NAMES.map((name) => {
        const critter = ctx.track(new Critter(CRITTERS[name]));
        critter.eventMode = 'none';
        this.root.addChild(critter);
        return [name, critter];
      }),
    ) as Record<Name, Critter>;
    this.helpButton.text.text = 'Help';
    this.crossButton.text.text = 'Cross';
    ctx.stage.addChild(this.root);
    this.render();
  }

  private get board() {
    return this.boards[this.at];
  }

  start() {
    void this.open(this.ctx.level === 1);
  }

  /** The festival rule (level 1), the instruction, then each sentence in seat order. Any touch stops the reading. */
  private async open(rule: boolean) {
    const turn = this.turn;
    if (rule) await this.ctx.say('bridge.topsy');
    if (!this.ctx.alive || turn !== this.turn) return;
    await this.ctx.instruct('bridge.start');
    await this.readAll(turn);
  }

  private async readAll(turn: number) {
    for (let seat = 0; seat < this.board.seats.length; seat++) {
      if (!this.ctx.alive || turn !== this.turn) return;
      this.reading = seat;
      this.render();
      await this.ctx.say(line(sentenceLine(this.board, seat)));
    }
    if (!this.ctx.alive || turn !== this.turn) return;
    this.reading = null;
    this.render();
  }

  private touched() {
    this.turn++;
    this.reading = null;
    this.blank = null;
  }

  /** Tapping a bubble repeats its sentence, free. */
  private hear(seat: number) {
    if (this.busy) return;
    this.touched();
    const turn = this.turn;
    this.reading = seat;
    this.render();
    void this.ctx.say(line(sentenceLine(this.board, seat))).then(() => {
      if (!this.ctx.alive || turn !== this.turn) return;
      this.reading = null;
      this.render();
    });
  }

  /** Tapping an islander cycles blank, Straight, Topsy. Always free; nothing is refused. */
  private mark(seat: number) {
    if (this.busy) return;
    this.touched();
    this.marks = this.marks.map((m, i) => (i === seat ? cycle(m) : m));
    this.hint = null;
    this.wrong = null;
    this.status.text = RULE;
    this.critters[this.board.seats[seat]].poke();
    sfx.pop(this.marks[seat] === null ? 3 : this.marks[seat] === 'straight' ? 7 : 5);
    this.render();
  }

  private key() {
    return `${this.at}:${this.marks.join(',')}`;
  }

  /** Shows the next hint, counting it once until the marks change. Null when every mark is already right. */
  private showHint(): Step | null {
    this.hint = hintFor(this.board, this.marks);
    if (!this.hint) return null;
    if (this.hintedAt !== this.key()) {
      hinted(this.counts);
      this.hintedAt = this.key();
    }
    const { seats } = this.board;
    this.status.text = `${title(seats[this.hint.speaker])}’s words settle ${title(seats[this.hint.seat])}: ${WORD[this.hint.kind]}.`;
    this.render();
    return this.hint;
  }

  /** The Help button, and the pause sheet's "show a hint". */
  askForHint() {
    if (this.busy) return;
    this.touched();
    this.wrong = null;
    const hint = this.showHint();
    if (hint) void this.ctx.say(line(hintLine(this.board, hint)));
    else {
      this.status.text = 'Every sentence fits. Tap Cross.';
      this.render();
      void this.ctx.say('bridge.hint.done');
    }
  }

  private cross() {
    if (this.busy) return;
    this.touched();
    const verdict = check(this.board, this.marks);
    if (verdict.kind === 'cross') {
      void this.walk();
      return;
    }
    const { seats } = this.board;
    if (verdict.kind === 'blank') {
      this.blank = verdict.seat;
      this.status.text = `Mark ${title(seats[verdict.seat])} first.`;
      this.render();
      void this.ctx.say(line(`bridge.blank.${seats[verdict.seat]}`));
      return;
    }
    // One miss per distinct wrong complete answer; the same marks again replay the explanation, free.
    const first = countsAsMiss(this.rejected, this.at, this.marks);
    const due = first && missEvery(this.counts);
    if (first) sfx.boing();
    const speaker = verdict.speaker;
    const marked = this.marks[speaker] as Kind;
    this.wrong = speaker;
    this.hint = null;
    this.status.text = `${title(seats[speaker])} is marked ${WORD[marked]}, so these words ${marked === 'straight' ? 'should be so. They are not' : 'should not be so. They are'}.`;
    this.critters[seats[speaker]].setMood('surprised', 1.2);
    this.render();
    const turn = this.turn;
    void this.ctx.say(line(missLine(this.board, speaker, marked))).then(() => {
      if (!due || !this.ctx.alive || turn !== this.turn) return;
      const hint = this.showHint();
      if (hint) void this.ctx.say(line(hintLine(this.board, hint)));
    });
  }

  /** An accepted answer: the islanders cross in seat order, a lantern lighting as each steps off. */
  private async walk() {
    const { ctx } = this;
    this.busy = true;
    this.hint = null;
    this.wrong = null;
    this.status.text = 'Every sentence fits.';
    this.render();
    const scene = bridgeLayout(this.view, this.board.seats.length).scene;
    const small = scene.h / 520;
    for (const [seat, name] of this.board.seats.entries()) {
      const critter = this.critters[name];
      const near = bridgePoint(scene, 0);
      await ctx.tw.to(critter, { x: near.x, y: near.y }, { duration: 0.3 });
      if (!ctx.alive) return;
      critter.scale.set(small);
      sfx.marimba(2 + seat * 2);
      for (let i = 1; i <= 4; i++) {
        const p = bridgePoint(scene, i / 4);
        await ctx.tw.to(critter, { x: p.x, y: p.y }, { duration: 0.14 });
        if (!ctx.alive) return;
      }
      critter.visible = false;
      this.lit = seat + 1;
      sfx.bell(4 + seat * 2);
      this.render();
    }
    await ctx.tw.wait(0.3);
    if (!ctx.alive) return;
    if (this.at < this.boards.length - 1) {
      this.at++;
      this.marks = this.marks.map(() => null);
      this.lit = 0;
      this.hintedAt = null;
      this.status.text = RULE;
      this.busy = false;
      this.render();
      const turn = this.turn;
      await ctx.say('bridge.next');
      await this.readAll(turn);
      return;
    }
    await ctx.say('bridge.done');
    if (ctx.alive) ctx.finish(tally(this.counts));
  }

  private render() {
    const { board } = this;
    const layout = bridgeLayout(this.view, board.seats.length);
    this.backdrop.clear().rect(0, 0, this.view.w, this.view.h).fill(cream);
    drawScene(this.scene, layout.scene, board.seats.length, this.lit);

    this.status.position.set(layout.status.x, layout.status.y);
    this.status.style.wordWrapWidth = layout.status.wrap;

    for (const name of NAMES) {
      const critter = this.critters[name];
      const seat = board.seats.indexOf(name);
      if (this.busy) continue;
      critter.visible = seat >= 0;
      if (seat < 0) continue;
      const box = layout.seats[seat];
      critter.scale.set(layout.critter);
      critter.position.set(box.x, box.y - box.h / 2 + 250 * layout.critter + 8);
    }

    board.seats.forEach((name, seat) => {
      const bubble = this.bubbles[seat];
      const box = layout.bubbles[seat];
      place(bubble, box);
      const speaking = this.reading === seat;
      const pointed = this.hint?.speaker === seat;
      const broken = this.wrong === seat;
      const color = broken ? swatch.coral : pointed ? swatch.yellow : speaking ? swatch.teal : swatch.white;
      const { w, h } = box;
      bubble.panel
        .clear()
        .roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 20, 24)
        .fill(broken || pointed || speaking ? color.light : swatch.white.fill)
        .stroke({ color: color.line, width: broken || pointed || speaking ? 6 : 3 });
      if (layout.rows) bubble.panel.poly([-w / 2 + 5, -8, -w / 2 - 9, 2, -w / 2 + 5, 12]).fill(color.line);
      else bubble.panel.poly([-12, h / 2 - 18, 0, h / 2 - 2, 12, h / 2 - 18]).fill(color.line);
      bubble.text.text = words(code(board.pattern[seat], seat, board.seats));
      bubble.text.style.fontSize = layout.text;
      bubble.text.style.wordWrapWidth = layout.wrap;
      bubble.text.position.set(0, -7);

      const control = this.seats[seat];
      const at = layout.seats[seat];
      place(control, at);
      const mark = this.marks[seat];
      const target = this.hint?.seat === seat || this.blank === seat;
      const plateH = layout.rows ? 54 : 88;
      const plateY = at.h / 2 - plateH / 2 - 3;
      const plateW = at.w - 10;
      control.panel
        .clear()
        .roundRect(-at.w / 2 + 2, -at.h / 2 + 2, at.w - 4, at.h - 4, 20)
        .fill({ color: swatch.yellow.light, alpha: target ? 1 : 0 })
        .stroke({ color: swatch.yellow.line, width: target ? 6 : 0, alpha: target ? 1 : 0 })
        .roundRect(-plateW / 2, plateY - plateH / 2, plateW, plateH, 16)
        .fill(mark ? swatch.peach.light : swatch.white.fill)
        .stroke({ color: mark ? wood.line : swatch.white.line, width: 3 });
      const size = layout.rows ? 20 : 26;
      control.text.style.fontSize = size;
      control.word.style.fontSize = size;
      control.text.text = title(name);
      control.text.style.fill = ink;
      control.word.text = mark ? WORD[mark] : 'Tap to mark';
      control.word.alpha = mark ? 1 : 0.6;
      if (layout.rows) {
        // Sideways the plate is too small for the name as well, so it heads the islander's bubble.
        control.text.style.fontSize = 22;
        control.text.style.fill = swatch.teal.line;
        control.text.position.set(box.x - at.x, -box.h / 2 + 24);
        bubble.text.position.set(0, 10);
        control.word.text = mark ? WORD[mark] : 'Tap';
        control.word.position.set(mark ? 14 : 0, plateY);
        if (mark) lantern(control.panel, -plateW / 2 + 22, plateY, 0.7, mark === 'topsy');
      } else {
        control.text.position.set(0, plateY - 22);
        control.word.position.set(mark ? 16 : 0, plateY + 18);
        if (mark) lantern(control.panel, -plateW / 2 + 40, plateY + 16, 0.72, mark === 'topsy');
      }
    });

    for (const [control, box, main] of [
      [this.helpButton, layout.help, false],
      [this.crossButton, layout.cross, true],
    ] as const) {
      place(control, box);
      const color = main ? swatch.teal : swatch.white;
      control.panel
        .clear()
        .roundRect(-box.w / 2 + 4, -box.h / 2 + 4, box.w - 8, box.h - 8, 22)
        .fill(color.light)
        .stroke({ color: color.line, width: main ? 5 : 3 });
      control.text.style.fontSize = 32;
      control.node.alpha = this.busy ? 0.55 : 1;
    }
  }

  update() {}

  resize(view: View) {
    this.view = view;
    this.render();
  }

  autotouch(): TouchIntent | null {
    if (this.busy) return null;
    const next = hintFor(this.board, this.marks);
    return { tap: { on: next ? this.seats[next.seat].node : this.crossButton.node } };
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'truth-bridge',
  name: 'Truth Bridge',
  titleLine: 'game.truth-bridge',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['checking that statements are consistent', 'deduction from one settled fact to the next'],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  hubIcon: () => new WigglyIcon(icon()),
  sticker: icon,
  upright: true,
  touchDemo: true,
  coplayHint: 'One person reads the sentences aloud and the other moves the marks. Swap after a round.',
  offScreen:
    'Secretly write S or T for two family members. Each says one sentence that fits their letter, and the others work out who is who.',
  create: (ctx) => new Round(ctx),
};
