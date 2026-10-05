import type { Container, Renderer } from 'pixi.js';
import type { Updatable } from '../app/Scene';
import type { Critter } from '../art/critter';
import type { Particles } from '../art/particles';
import type { MusicStyle } from '../audio/music';
import type { LineVars } from '../audio/voice';
import type { LineId } from '../content/voice-script';
import type { Rng } from '../engine/random';
import type { Tweener } from '../engine/tween';
import type { View } from '../engine/view';
import type { Band } from '../progress/bands';
import type { LevelRange } from '../progress/difficulty';

/** The object that stands for a game in the hub. Its feet sit on (0, 0). */
export type HubIcon = Container & Updatable;

/** A minigame describes itself and builds rounds. Everything around a round belongs to the shell. */
export interface GameModule {
  id: string;
  /** For grown-ups (parent zone). Kids hear `titleLine` instead. */
  name: string;
  /** Spoken when the game is picked. */
  titleLine: LineId;
  region: string;
  skills: string[];
  bands: Band[];
  levels(band: Band): LevelRange;
  /** What a level plays like, in a few words for grown-ups ("Pop one color, 3 colors"). */
  describeLevel(level: number): string;
  music: MusicStyle;
  /** A prompt for the grown-up in early bands. `{name}` is the child's name. */
  coplayHint?: string;
  /** A real-world activity that carries the same skill off the screen, for the parent zone. */
  offScreen?: string;
  hubIcon(): HubIcon;
  /** The sticker for finishing a round, rebuilt from its seed. */
  sticker(seed: number): Container;
  create(ctx: GameContext): Game;
}

export interface RoundResult {
  misses: number;
  hints: number;
}

export interface GameContext {
  /** Draw here; it sits under the pet, the home button and the particles. */
  stage: Container;
  view: View;
  level: number;
  band: Band;
  rng: Rng;
  tw: Tweener;
  particles: Particles;
  renderer: Renderer;
  /** The guide in the corner. It cheers, and tapping it repeats the last instruction. */
  pet: Critter;
  track<T extends Updatable>(obj: T): T;
  untrack(obj: Updatable): void;
  /** Speak an instruction; the pet repeats the latest one when tapped. */
  instruct(id: LineId, vars?: LineVars): Promise<void>;
  say(id: LineId, vars?: LineVars): Promise<void>;
  /** End the round. The shell celebrates, saves the result and offers "again". */
  finish(result: RoundResult): void;
}

export interface Game {
  start(): void;
  update(dt: number): void;
  resize(view: View): void;
  destroy(): void;
}
