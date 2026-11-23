import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import { jobArt } from '../tide-line/art';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { tableLayout } from './layout';
import {
  BOAT_MIN,
  EMPTY,
  JOBS,
  LEVELS,
  ROWS,
  boardFor,
  check,
  describeLevel,
  hintFor,
  metres,
  place,
  solutions,
  type Draft,
  type Job,
  type Row,
  type Verdict,
} from './logic';

const NAMES = ['Rock-pool sketch', 'Toy-boat float', 'Terrace picnic'];
const SHORT = ['Sketch', 'Toy boat', 'Picnic'];
const ART = ['shows', 'boat', 'picnic'] as const;
const COLORS = [swatch.teal, swatch.blue, swatch.peach];
const ACTIONS = ['Undo', 'Help', 'Check'];
const STATUS = 'Select a job, then a time.';

function icon() {
  const g = new Graphics()
    .roundRect(-52, -49, 104, 98, 18)
    .fill(cream)
    .stroke({ color: swatch.teal.line, width: 4 })
    .roundRect(-31, -33, 62, 8, 4)
    .fill(swatch.teal.fill);
  for (const y of [-12, 3, 18]) g.roundRect(-31, y, 34, 4, 2).fill(swatch.teal.line);
  jobArt(g, 'boat', 20, 22, 0.61);
  return new Container().addChild(g);
}

function button(root: Container, run: () => void) {
  const node = new Container();
  const panel = new Graphics();
  const art = new Graphics();
  const main = label('', 30);
  const detail = label('', 25, ink, '500');
  const aside = label('', 25);
  const mark = label('', 23);
  for (const child of [panel, art, main, detail, aside, mark]) child.eventMode = 'none';
  node.addChild(panel, art, main, detail, aside, mark);
  onTap(node, run);
  root.addChild(node);
  return { node, panel, art, main, detail, aside, mark };
}

type Button = ReturnType<typeof button>;
type Box = { x: number; y: number; w: number; h: number };

function drawPanel({ node, panel, art }: Button, box: Box, fill: number, border: number, weight = 2) {
  const { x, y, w, h } = box;
  node.position.set(x, y);
  node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  panel
    .clear()
    .roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 17)
    .fill(fill)
    .stroke({ color: border, width: weight });
  art.clear();
}

class Round implements Game {
  private readonly root = new Container();
  private readonly backdrop = new Graphics();
  private readonly heading = label('Fictional harbor', 40);
  private readonly columns = ['Time', 'Height', 'Job'].map((name) => label(name, 27));
  private readonly status = label(STATUS, 26);
  private readonly rows = ROWS.map((row) => button(this.root, () => this.tapRow(row)));
  private readonly jobs = JOBS.map((job) => button(this.root, () => this.select(job)));
  private readonly actions = [
    button(this.root, () => this.undo()),
    button(this.root, () => this.askForHint()),
    button(this.root, () => this.submit()),
  ];
  private readonly board;
  private readonly plans;
  private readonly history: Draft[] = [];
  private readonly rejected = new Set<string>();
  private readonly counts = newTally();
  private draft = EMPTY;
  private selected: Job | null = 0;
  private readRow: Row | null = null;
  private hint: ReturnType<typeof hintFor> = null;
  private hintedDraft: string | null = null;
  private activeRow: Row | null = null;
  private completed: Row[] = [];
  private running = false;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.board = boardFor(ctx.level, ctx.rng);
    this.plans = solutions(this.board);
    this.view = ctx.view;
    this.backdrop.eventMode = 'none';
    this.root.addChildAt(this.backdrop, 0);
    this.root.addChild(this.heading, ...this.columns, this.status);
    ctx.stage.addChild(this.root);
    this.render();
  }

  start() {
    void this.ctx.instruct(this.ctx.level === 1 ? 'tides.start.1' : 'tides.start.2');
  }

  private condition(job: Job) {
    if (job === 0) return `At most ${metres(this.board.sketchMax)} m`;
    if (job === 1) return `At least ${metres(BOAT_MIN)} m`;
    if (this.board.order === 'before') return 'Before sketch';
    if (this.board.order === 'after') return 'After toy boat';
    return 'Any free time';
  }

  private sayJob(job: Job) {
    if (job === 0) void this.ctx.say('tides.sketch', { height: metres(this.board.sketchMax) });
    else if (job === 1) void this.ctx.say('tides.boat');
    else void this.ctx.say(`tides.picnic.${this.board.order}`);
  }

  private select(job: Job) {
    if (this.running) return;
    this.selected = this.selected === job ? null : job;
    this.readRow = null;
    this.status.text = this.selected === null ? STATUS : `Choose a time for ${SHORT[job].toLowerCase()}.`;
    this.render();
    if (this.selected !== null) this.sayJob(job);
  }

  private tapRow(row: Row) {
    if (this.running) return;
    const occupant = JOBS.find((j) => this.draft[j] === row);
    const time = this.board.times[row];
    const height = metres(this.board.heights[row]);
    if (this.selected === null) {
      this.readRow = row;
      this.selected = occupant ?? null;
      this.status.text =
        occupant === undefined ? `${time} · ${height} m` : `${NAMES[occupant]} · ${this.condition(occupant)}`;
      this.render();
      if (occupant === undefined) void this.ctx.say('tides.row', { time, height });
      else
        void this.ctx.say('tides.row.assigned', {
          time,
          height,
          job: NAMES[occupant],
          rule: this.condition(occupant).replace(/ m$/, ' metres'),
        });
      return;
    }
    const job = this.selected;
    const next = place(this.draft, job, row);
    if (next === this.draft) return;
    this.history.push(this.draft);
    this.edit(next, `${SHORT[job]} at ${time}.`);
    if (occupant === undefined) void this.ctx.say('tides.place', { job: NAMES[job], time });
    else void this.ctx.say('tides.displace', { job: NAMES[job], time, lifted: NAMES[occupant] });
  }

  private edit(draft: Draft, message: string) {
    this.draft = draft;
    this.selected = null;
    this.readRow = null;
    this.hint = null;
    this.hintedDraft = null;
    this.status.text = message;
    this.render();
  }

  private undo() {
    if (this.running) return;
    const previous = this.history.pop();
    if (!previous) {
      void this.ctx.say('tides.no-undo');
      return;
    }
    this.edit(previous, 'Previous plan restored.');
    void this.ctx.say('tides.undo');
  }

  askForHint() {
    if (this.running) return;
    const hint = this.showHint();
    if (!hint) {
      this.status.text = 'All jobs fit. Tap Check.';
      void this.ctx.say('tides.hint.done');
      return;
    }
    this.status.text = `Try ${SHORT[hint.job].toLowerCase()} at ${this.board.times[hint.row]}.`;
    const { line, vars } = this.hintSpeech(hint);
    void this.ctx.say(line, vars);
  }

  private showHint() {
    this.hint = hintFor(this.plans, this.draft);
    if (!this.hint) return null;
    const key = this.draft.join(',');
    if (this.hintedDraft !== key) {
      hinted(this.counts);
      this.hintedDraft = key;
    }
    this.selected = this.hint.job;
    this.render();
    return this.hint;
  }

  private hintSpeech({ job, row }: NonNullable<ReturnType<typeof hintFor>>) {
    const line: LineId =
      job === 0
        ? 'tides.hint.sketch'
        : job === 1
          ? 'tides.hint.boat'
          : `tides.hint.picnic.${this.board.order}`;
    return { line, vars: { time: this.board.times[row], height: metres(this.board.heights[row]) } };
  }

  private submit() {
    if (this.running) return;
    const verdict = check(this.board, this.draft);
    if (verdict.kind === 'missing') {
      this.status.text = `Give ${SHORT[verdict.job].toLowerCase()} a time first.`;
      void this.ctx.say('tides.missing', { job: NAMES[verdict.job] });
      return;
    }
    if (verdict.kind === 'ready') {
      void this.replay(verdict.plan);
      return;
    }
    const key = this.draft.join(',');
    const first = !this.rejected.has(key);
    this.rejected.add(key);
    const due = first && missEvery(this.counts);
    if (first) sfx.boing();
    this.explain(verdict, due ? this.showHint() : null);
  }

  private explain(verdict: Extract<Verdict, { row: Row }>, hint: ReturnType<typeof hintFor>) {
    const { row, kind } = verdict;
    const time = this.board.times[row];
    this.status.text = {
      sketch: 'The sketch needs lower water.',
      boat: 'The boat needs higher water.',
      before: `Set up the picnic before ${time}.`,
      after: `Set up the picnic after ${time}.`,
    }[kind];
    const line = `tides.miss.${kind}` as const;
    const vars = {
      time,
      height: metres(this.board.heights[row]),
      limit: metres(this.board.sketchMax),
    };
    if (!hint) {
      void this.ctx.say(line, vars);
      return;
    }
    const move = this.hintSpeech(hint);
    void this.ctx.say('tides.auto.assist', {
      error: voice.line(line, vars),
      move: voice.line(move.line, move.vars),
    });
  }

  private async replay(plan: Extract<Verdict, { kind: 'ready' }>['plan']) {
    this.running = true;
    this.selected = this.readRow = this.hint = null;
    this.render();
    for (const row of ROWS) {
      const job = JOBS.find((id) => plan[id] === row);
      if (job === undefined) continue;
      const time = this.board.times[row];
      this.activeRow = row;
      this.status.text = `${time} · ${NAMES[job]}`;
      this.render();
      sfx.marimba(4 + row * 2);
      await Promise.all([this.ctx.say('tides.replay', { job: NAMES[job], time }), this.ctx.tw.wait(0.54)]);
      if (!this.ctx.alive) return;
      this.completed.push(row);
    }
    this.activeRow = null;
    this.status.text = 'All three jobs done!';
    this.render();
    await this.ctx.say('tides.done');
    if (this.ctx.alive) this.ctx.finish(tally(this.counts));
  }

  private render() {
    const layout = tableLayout(this.view);
    const { w, h, upright } = this.view;
    this.backdrop
      .clear()
      .rect(0, 0, w, h)
      .fill(swatch.teal.light)
      .moveTo(0, h - 142)
      .quadraticCurveTo(w * 0.48, h - 224, w, h - 160)
      .lineTo(w, h)
      .lineTo(0, h)
      .closePath()
      .fill(cream);
    this.heading.position.copyFrom(layout.heading);
    const rowBox = layout.rows[0];
    const columnX = [-0.32, -0.01, upright ? 0.3 : 0.32];
    this.columns.forEach((column, i) => {
      column.position.set(rowBox.x + rowBox.w * columnX[i], layout.heading.y + 43);
    });
    this.status.position.copyFrom(layout.status);

    for (const row of ROWS) {
      const control = this.rows[row];
      const box = layout.rows[row];
      const occupant = JOBS.find((j) => this.draft[j] === row);
      const active = this.activeRow === row;
      const done = this.completed.includes(row);
      const pointing = this.hint?.row === row;
      const inspect = this.readRow === row;
      const color = pointing ? swatch.yellow : active || done ? swatch.green : swatch.teal;
      drawPanel(
        control,
        box,
        pointing || active || done || inspect ? color.light : swatch.white.fill,
        color.line,
        pointing || active || inspect ? 6 : 2,
      );
      control.main.text = this.board.times[row];
      control.main.position.set(box.w * columnX[0], 0);
      control.detail.text = `${metres(this.board.heights[row])} m`;
      control.detail.position.set(box.w * columnX[1], 0);
      control.aside.text = occupant === undefined ? '—' : done ? '✓' : upright ? SHORT[occupant] : '';
      control.aside.position.set(box.w * 0.38, 0);
      if (occupant !== undefined)
        jobArt(control.art, ART[occupant], box.w * (upright ? 0.22 : 0.32), 0, 0.54);
    }

    for (const job of JOBS) {
      const control = this.jobs[job];
      const pointing = this.hint?.job === job;
      const selected = this.selected === job;
      const color = pointing ? swatch.yellow : COLORS[job];
      drawPanel(
        control,
        layout.jobs[job],
        pointing || selected ? color.light : swatch.white.fill,
        color.line,
        pointing || selected ? 6 : 2,
      );
      const assigned = this.draft[job];
      jobArt(control.art, ART[job], -30, -30, 0.59);
      control.aside.text = assigned === null ? '—' : this.board.times[assigned];
      control.aside.position.set(33, -28);
      control.main.text = SHORT[job];
      control.main.position.set(0, 7);
      control.detail.text = this.condition(job);
      control.detail.position.set(0, 36);
      control.mark.text = selected ? '✓' : '';
      control.mark.position.set(-layout.jobs[job].w / 2 + 17, -34);
      if (job === 2 && this.board.order !== 'any') {
        jobArt(
          control.art,
          this.board.order === 'before' ? 'shows' : 'boat',
          layout.jobs[job].w / 2 - 18,
          36,
          0.23,
        );
        control.detail.x = -10;
        control.detail.style.fontSize = upright ? 25 : 21;
      }
    }

    for (const i of JOBS) {
      const control = this.actions[i];
      const color = i === 2 ? swatch.teal : swatch.white;
      drawPanel(control, layout.actions[i], color.light, color.line, i === 2 ? 4 : 2);
      control.main.text = ACTIONS[i];
      control.node.alpha = this.running ? 0.55 : 1;
    }
  }

  update() {}

  resize(view: View) {
    this.view = view;
    this.render();
  }

  autotouch(): TouchIntent | null {
    if (this.running) return null;
    const next = hintFor(this.plans, this.draft);
    const node = !next
      ? this.actions[2].node
      : this.selected === next.job
        ? this.rows[next.row].node
        : this.jobs[next.job].node;
    return { tap: { on: node } };
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'tide-tables',
  name: 'Tide Tables',
  titleLine: 'game.tide-tables',
  region: 'tinker-lab',
  challenge: 'logic',
  skills: ['reading a table', 'comparing measurements', 'planning with constraints'],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  hubIcon: () => new WigglyIcon(icon()),
  sticker: icon,
  upright: true,
  touchDemo: true,
  coplayHint:
    'One person reads the tide height and suggests a time. The other places the job. Trade roles after a round.',
  offScreen:
    'Write four times on paper and fit three household jobs into the day. Make one job come after another.',
  create: (ctx) => new Round(ctx),
};
