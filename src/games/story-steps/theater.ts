import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { theaterScene, theaterSymbol } from './theater-art';
import { canFinish, completeStory, editStory, endingFor, nextTheaterAction, OPTIONS, sameStory, THEATER_PLANS, type TheaterAction, type TheaterDraft, type TheaterField, type TheaterStory } from './theater-logic';

export class TheaterStoryGame implements Game {
  readonly plan;
  draft: TheaterDraft = { cast: null, weather: null, prop: null };
  readonly shows: TheaterStory[] = [];
  readonly choices: { field: TheaterField; value: TheaterStory[TheaterField]; node: Container }[] = [];
  readonly showButton = new Container();
  readonly undoButton = new Container();
  readonly helpButton = new Container();
  readonly finishButton = new Container();
  private readonly background = new Graphics();
  private readonly stage = new Container();
  private readonly selection = new Graphics();
  private readonly helpGlow = new Graphics();
  private readonly title = label('Story Theater', 30, ink);
  private readonly caption = label('Choose your picnic story', 23, ink);
  private readonly comparison = new Container();
  private readonly groupLabels = ['Who?', 'Weather?', 'Bring what?'].map(t => label(t, 23, ink));
  private previous: TheaterDraft | null = null;
  private helped: Container | null = null;
  private shown: TheaterStory | null = null;
  private cue = -1;
  private alive = true;
  playing = false;
  finished = false;
  misses = 0;
  hints = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = THEATER_PLANS[ctx.level >= 13 ? 1 : 0];
    for (const field of ['cast', 'weather', 'prop'] as const) {
      for (const value of ctx.rng.shuffle([...OPTIONS[field]])) {
        const node = new Container(); node.hitArea = new Rectangle(-74, -53, 148, 106);
        const symbol = theaterSymbol(value);
        node.addChild(tile(148, 106, 'purple'), symbol, label(value === 'sun' ? 'Sun' : value[0].toUpperCase() + value.slice(1), 18, ink));
        // Put the word under the picture; pictures and speech carry the interaction.
        node.children[2].position.set(0, 32); symbol.position.set(0, -9); symbol.scale.set(0.72);
        onTap(node, () => this.choose(field, value));
        this.choices.push({ field, value, node });
      }
    }
    for (const [node, symbol, text, action] of [
      [this.showButton, 'show', 'Watch', () => { void this.watch(); }],
      [this.undoButton, 'undo', 'Undo', () => this.undo()],
      [this.helpButton, 'help', 'Help', () => this.askForHint()],
      [this.finishButton, 'finish', 'Take a bow', () => this.finish()],
    ] as const) {
      const art = theaterSymbol(symbol); art.scale.set(0.7); art.y = -12;
      const textNode = label(text, 19, ink); textNode.y = 34;
      node.addChild(tile(148, 106, symbol === 'finish' ? 'teal' : 'yellow'), art, textNode);
      node.hitArea = new Rectangle(-74, -53, 148, 106); onTap(node, action);
    }
    for (const node of [this.background, this.selection, this.helpGlow, this.title, this.caption, this.comparison, this.stage, ...this.groupLabels]) node.eventMode = 'none';
    ctx.stage.addChild(this.background, this.title, this.stage, this.caption, this.comparison, ...this.groupLabels,
      ...this.choices.map(c => c.node), this.showButton, this.undoButton, this.helpButton, this.finishButton, this.selection, this.helpGlow);
    this.resize(ctx.view);
  }
  start() { void this.ctx.instruct(this.plan.compare ? 'theater.start.compare' : 'theater.start'); }
  choose<K extends TheaterField>(field: K, value: TheaterStory[K]) {
    if (!this.alive || this.playing || this.finished) return;
    const first = this.plan.compare ? this.shows[0] : undefined;
    const next = editStory(this.draft, field, value, first);
    if (sameStory(next, this.draft)) {
      void this.ctx.say(first && field === 'cast' ? 'theater.keepcast' : `theater.pick.${value}`);
      return;
    }
    this.previous = { ...this.draft }; this.draft = next; this.helped = null;
    this.cue = -1; this.shown = null; sfx.tick(); this.draw();
    void this.ctx.say(`theater.pick.${value}`);
  }
  private undo() {
    if (!this.alive || this.playing || this.finished || !this.previous) return;
    const before = this.previous; this.previous = null; this.draft = before; this.shown = null; this.cue = -1; this.helped = null;
    this.draw(); sfx.tick(); void this.ctx.say('theater.undo');
  }
  private async watch() {
    if (!this.alive || this.playing || this.finished) return;
    if (!completeStory(this.draft)) { void this.ctx.say('theater.choose'); return; }
    const story = { ...this.draft };
    this.playing = true; this.helped = null; this.shown = story;
    this.draw(); sfx.tick();
    const script: LineId[] = [`theater.scene.${story.cast}`, `theater.scene.${story.weather}`, `theater.scene.${story.prop}`, `theater.end.${endingFor(story)}`];
    for (let i = 0; i < script.length; i++) {
      if (!this.alive) return;
      this.cue = i; this.drawStage();
      await this.ctx.say(script[i]);
      if (!this.alive) return;
      await this.ctx.tw.wait(0.4);
    }
    if (!this.alive) return;
    if (!this.shows.length) { this.shows.push(story); this.previous = null; }
    else if (!sameStory(this.shows[this.shows.length - 1], story)) {
      if (this.shows.length === 1) this.shows.push(story); else this.shows[1] = story;
    }
    this.playing = false;
    this.draw();
    if (this.plan.compare && canFinish(true, this.draft, this.shows)) {
      const first = this.shows[0];
      void this.ctx.instruct(first.weather !== story.weather ? `theater.compare.weather.${story.prop}` : `theater.compare.prop.${story.weather}`);
    } else void this.ctx.instruct(this.plan.compare ? 'theater.revise' : 'theater.bow');
  }
  askForHint() {
    if (!this.alive || this.playing || this.finished) return;
    this.hints++;
    const action = nextTheaterAction(this.plan.compare, this.draft, this.shows);
    this.helped = this.targetFor(action); this.drawGlow();
    const line: LineId = action.kind === 'choose' ? (this.draft[action.field] ? 'theater.help.change' : 'theater.help.choose') : action.kind === 'show' ? 'theater.help.watch' : 'theater.help.bow';
    void this.ctx.say(line);
  }
  private finish() {
    if (!this.alive || this.playing || this.finished) return;
    if (!canFinish(this.plan.compare, this.draft, this.shows)) { void this.ctx.say(this.plan.compare && this.shows.length ? 'theater.revise' : 'theater.watchfirst'); return; }
    this.finished = true; this.drawGlow(); sfx.bell(8, 0.3);
    void this.ctx.say('theater.done').then(() => { if (this.alive) this.ctx.finish({ misses: 0, hints: this.hints }); });
  }
  private targetFor(action: TheaterAction): Container {
    return action.kind === 'choose' ? this.choices.find(c => c.field === action.field && c.value === action.value)!.node : action.kind === 'show' ? this.showButton : this.finishButton;
  }
  private drawStage() {
    this.stage.removeChildren().forEach(c => c.destroy({ children: true }));
    const story = this.shown ?? (completeStory(this.draft) ? this.draft : { cast: this.draft.cast ?? 'bunny', weather: this.draft.weather ?? 'sun', prop: this.draft.prop ?? 'blanket' });
    const art = theaterScene(story, Math.max(0, this.cue)); this.stage.addChild(art);
    this.caption.text = this.playing ? ['Once upon a picnic…', 'Then the weather changed…', 'Our friend brought…', 'And here is what happened!'][this.cue < 0 ? 0 : this.cue]
      : canFinish(this.plan.compare, this.draft, this.shows) ? 'Your story is ready. Take a bow, or try another show.'
      : this.plan.compare && this.shows.length ? 'Change the weather or prop. Watch what changes.' : 'Choose who, the weather, and what to bring.';
  }
  private draw() {
    this.drawStage(); this.drawGlow();
    this.showButton.alpha = completeStory(this.draft) && !this.playing ? 1 : 0.55;
    this.undoButton.alpha = this.previous && !this.playing ? 1 : 0.55;
    this.finishButton.alpha = canFinish(this.plan.compare, this.draft, this.shows) && !this.playing ? 1 : 0.55;
    this.comparison.removeChildren().forEach(c => c.destroy({ children: true }));
    if (this.plan.compare && this.shows.length) {
      this.shows.forEach((story, i) => {
        const art = theaterScene(story, 3); art.scale.set(0.24); art.position.set(i === 0 ? -420 : 420, 0); this.comparison.addChild(art);
        const text = label(i === 0 ? 'First show' : 'Changed show', 17, ink); text.position.set(art.x, 48); this.comparison.addChild(text);
      });
    }
  }
  private drawGlow() {
    this.selection.clear(); this.helpGlow.clear();
    if (this.finished) return;
    for (const choice of this.choices) if (this.draft[choice.field] === choice.value) {
      this.selection.roundRect(choice.node.x - 77, choice.node.y - 56, 154, 112, 20).stroke({ width: 5, color: swatch.teal.line });
    }
    if (this.helped) this.helpGlow.roundRect(this.helped.x - 79, this.helped.y - 58, 158, 116, 20).stroke({ width: 6, color: swatch.yellow.line });
  }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.purple.light);
    const extra = Math.max(0, v.h - 768);
    this.title.position.set(v.w / 2, 112 + extra * 0.12);
    this.stage.position.set(v.w / 2, 284 + extra * 0.3);
    this.caption.position.set(v.w / 2, 426 + extra * 0.3);
    const row = v.h - 210 - extra * 0.45;
    const centers = [v.w / 2 - 326, v.w / 2, v.w / 2 + 326];
    this.groupLabels.forEach((node, i) => node.position.set(centers[i], row - 85));
    this.choices.forEach((c, i) => c.node.position.set(centers[Math.floor(i / 2)] + (i % 2 === 0 ? -80 : 80), row));
    [this.showButton, this.undoButton, this.helpButton, this.finishButton].forEach((node, i) => node.position.set(260 + i * (v.w - 360) / 3, v.h - 62 - extra * 0.25));
    this.comparison.position.set(v.w / 2, this.stage.y);
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (!this.alive || this.playing || this.finished) return null;
    return { tap: { on: this.targetFor(nextTheaterAction(this.plan.compare, this.draft, this.shows)) }, pause: 0.45 };
  }
  update(_dt: number) {}
  destroy() { this.alive = false; }
}
