import type { Container } from 'pixi.js';
import { voice } from '../audio/voice';
import { SCRIPT } from '../content/voice-script';
import { endingLine, mixGames, nextUp } from '../content/mix';
import type { View } from '../engine/view';
import { GAMES } from '../games/registry';
import type { GameModule } from '../games/types';
import type { Band } from '../progress/bands';
import { store } from '../progress/store';
import { MixSheet } from '../ui/mix';
import type { App } from './App';
import { mixMemory } from './discovery';

export const titleOf = (mod: GameModule) => SCRIPT[mod.titleLine][0].replace(/!$/, '');

/**
 * Little surprises on a home spot (either layout): the entry's eligibility, and the preview/ending sheet over the place.
 * The sheet reopens whenever she comes back to this home spot while the mix is live.
 */
export class MixHost {
  /** The three stops, or null: no entry is drawn on this home spot. */
  readonly mods: GameModule[] | null;
  sheet: MixSheet | null = null;
  private launching = false;

  constructor(private readonly app: App, private readonly band: Band, private readonly ui: Container, private readonly view: () => View) {
    this.mods = mixGames(store.data.profile.band, band, GAMES);
  }

  /** The mix is live for her at this home spot. */
  get live(): boolean {
    return !!this.mods && !!mixMemory.at(store.data, this.band);
  }

  /** The mix spot was tapped: a new session, all three stops still to come. */
  start() {
    if (!this.mods || this.launching) return;
    mixMemory.start(store.data, this.band);
    this.open();
    void voice.say('mix.offer').then(() => this.sayNext('mix.stop'));
  }

  /** Back from a stop (its corner Home, the card's Back, the result's Home): the sheet again, at the next stop or the ending. */
  resume() {
    if (!this.live) return;
    this.open();
    const state = mixMemory.at(store.data, this.band)!;
    if (nextUp(state) === null) void voice.say(endingLine(state));
    else this.sayNext('mix.next');
  }

  private open() {
    const state = mixMemory.at(store.data, this.band);
    if (!this.mods || !state) return;
    if (!this.sheet) {
      this.sheet = new MixSheet(this.mods, {
        tile: (p) => this.hear(p),
        play: () => this.play(),
        skip: () => this.skip(),
        back: () => this.end(),
        againMix: () => this.againMix(),
        home: () => this.end(),
      });
      this.ui.addChild(this.sheet);
    }
    this.sheet.show(state, this.view());
  }

  private refresh() {
    const state = mixMemory.at(store.data, this.band);
    if (state && this.sheet) this.sheet.show(state, this.view());
    return state;
  }

  private sayNext(line: 'mix.stop' | 'mix.next') {
    const state = mixMemory.at(store.data, this.band);
    const p = state ? nextUp(state) : null;
    if (p === null || !this.mods || !this.sheet) return;
    void voice.say(line, { title: titleOf(this.mods[p]) });
  }

  private hear(p: number) {
    if (!this.mods || !this.live) return;
    voice.stop();
    void voice.say('mix.stop', { title: titleOf(this.mods[p]) });
  }

  /** Play the next stop, checked again now: never a different game behind its picture. */
  private play() {
    const state = this.live ? mixMemory.at(store.data, this.band) : undefined;
    const p = state ? nextUp(state) : null;
    if (!state || p === null || this.launching) return;
    this.launch(p);
  }

  private launch(p: number) {
    const now = mixGames(store.data.profile.band, this.band, GAMES);
    if (!now || now[p]?.id !== this.mods![p].id) {
      mixMemory.apply(store.data, { type: 'unavailable', p });
      const state = this.refresh();
      voice.stop();
      void voice.say('mix.changed').then(() => { if (state && nextUp(state) === null) void voice.say(endingLine(state)); });
      return;
    }
    if (!mixMemory.launch(store.data, p)) return;
    this.launching = true;
    voice.stop();
    void voice.say(now[p].titleLine);
    this.app.go.game(now[p].id, store.data.profile.band, undefined, false, { place: this.band });
  }

  private skip() {
    const state = this.live ? mixMemory.at(store.data, this.band) : undefined;
    const p = state ? nextUp(state) : null;
    if (!state || p === null || this.launching) return;
    const after = mixMemory.apply(store.data, { type: 'skip', p })!;
    this.refresh();
    voice.stop();
    void voice.say('mix.skip').then(() => {
      if (!this.sheet || !this.live) return;
      if (nextUp(after) === null) void voice.say(endingLine(after));
      else this.sayNext('mix.next');
    });
  }

  private againMix() {
    if (this.launching || !this.mods) return;
    mixMemory.start(store.data, this.band);
    this.launch(0);
  }

  /** Back on the preview (Explore) or Home on the ending: the mix ends and she stays on the home spot. */
  private end() {
    if (this.launching) return;
    mixMemory.end();
    voice.stop();
    this.close();
  }

  close() {
    this.sheet?.destroy({ children: true });
    this.sheet = null;
  }

  update(dt: number) { this.sheet?.update(dt); }
  resize(view: View) { this.sheet?.layout(view); }
}
