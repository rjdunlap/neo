import { Graphics } from 'pixi.js';
import { ink } from '../art/palette';
import { audio } from '../audio/engine';
import { sfx } from '../audio/sfx';
import { voice } from '../audio/voice';
import { nextSpot } from '../couch/focus';
import { CouchInput, type CouchControls } from '../engine/controller';
import { isParentPanelOpen } from '../parent/panel';
import type { App } from './App';

/** Something a key or pad can press on a plain island screen: a ring goes round it at (x, y) with radius r. */
export interface FocusSpot {
  id: string;
  x: number;
  y: number;
  r: number;
  press(): void;
}

/** Seconds a scene ignores keys after it appears: a key mashed through the fade must not press what is under the ring. */
export const ENTRY_GUARD = 0.35;

export type FocusEvent = 'move' | 'press' | 'back' | null;

/**
 * Where the ring is and what a frame of keys does to it, kept apart from the scene so it is tested without a browser. The first
 * press after a finger (or on a new screen) only shows the ring: Enter never presses a spot nobody has seen.
 */
export class SpotFocus {
  /** The id of the spot the ring is on. */
  id: string | null = null;
  private age = 0;

  /** The index of the ring's spot, or 0 when it is on nothing (the spots changed under it). */
  indexIn(spots: readonly FocusSpot[]): number {
    const i = spots.findIndex((s) => s.id === this.id);
    return i < 0 ? 0 : i;
  }

  focusOn(id: string) {
    this.id = id;
  }

  /** One frame. `shown`: the ring was already showing before this frame's press. */
  update(spots: readonly FocusSpot[], keys: CouchControls, dt: number, shown: boolean): FocusEvent {
    this.age += dt;
    if (!spots.length || this.age < ENTRY_GUARD) return null;
    const at = this.indexIn(spots);
    this.id = spots[at].id;
    for (const p of keys.players) {
      if (p.back || p.undo) return 'back';
      if (!shown) continue;
      if (p.direction >= 0) {
        this.id = spots[nextSpot(spots, at, p.direction)].id;
        return 'move';
      }
      if (p.action) {
        spots[at].press();
        return 'press';
      }
    }
    return null;
  }
}

interface ScreenKeysOptions {
  spots(): readonly FocusSpot[];
  /** Backspace or B. Left out where going back would be an accident (the map). */
  back?(): void;
  /** False while the scene is leaving: the ring hides and keys do nothing. */
  active(): boolean;
}

/**
 * Keys and a pad on a plain island screen (the map, a land): arrows move a ring over its spots, Enter or the bottom button
 * presses, Backspace or B goes back. The ring stays hidden for a finger and shows at the first key or button, and a finger
 * hides it again (`App.input`), so a tap behaves exactly as before. The scene adds `ring` to its layer, calls `update` every frame and
 * `destroy` when it goes.
 */
export class ScreenKeys {
  readonly ring = new Graphics();
  readonly focus = new SpotFocus();
  private readonly input: CouchInput;

  constructor(private readonly app: App, private readonly options: ScreenKeysOptions) {
    this.ring.eventMode = 'none';
    this.ring.visible = false;
    this.input = new CouchInput(
      () => { audio.unlock(); voice.unlock(); },
      () => undefined,
      { listening: () => !this.app.paused && !isParentPanelOpen() },
    );
  }

  update(dt: number) {
    const keys = this.input.poll();
    const shown = this.app.input.kind === 'controller';
    this.app.input.sample(keys);
    const spots = this.options.spots();
    const live = this.options.active() && spots.length > 0;
    if (!live) {
      this.ring.visible = false;
      return;
    }
    const paused = this.app.paused || isParentPanelOpen();
    const event = paused ? null : this.focus.update(spots, keys, dt, shown);
    if (event === 'back') this.options.back?.();
    else if (event === 'move') sfx.tick();
    const at = spots[this.focus.indexIn(spots)];
    this.ring.visible = this.app.input.kind === 'controller';
    this.ring.clear().circle(0, 0, at.r + 10).stroke({ width: 14, color: 0xffffff }).circle(0, 0, at.r + 10).stroke({ width: 5, color: ink });
    this.ring.position.set(at.x, at.y);
  }

  destroy() {
    this.input.destroy();
  }
}
