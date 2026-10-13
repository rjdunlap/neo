import { COUCH_INFO } from '../couch/catalog';
import { STOPS, type CouchId } from '../couch/party';
import type { CouchControls } from '../engine/controller';
import type { GameModule } from '../games/types';

/** What the person at the island is using right now: a finger or mouse, or keys and a pad. */
export type InputKind = 'touch' | 'controller';

/** A real press in one sampled frame: a direction that just changed, or a button that just went down. A resting stick and Start are not. */
export function pressed(c: CouchControls): boolean {
  return c.players.some((p) => p.direction >= 0 || p.action || p.undo || p.back);
}

/**
 * Which input the person is using. It turns to `controller` on a real key or button and back to `touch` on a pointer press, so a
 * game is only handed `control()` after someone used a controller: several games switch their focus ring on at the first call.
 */
export class InputInUse {
  kind: InputKind = 'touch';

  /** One sampled frame. True on the frame it turned to controller. */
  sample(c: CouchControls): boolean {
    if (this.kind === 'controller' || !pressed(c)) return false;
    this.kind = 'controller';
    return true;
  }

  /** A finger, pen or mouse went down. */
  touched() {
    this.kind = 'touch';
  }
}

/** The levels of a game that couch play already runs on a controller: its trip stops and its "watch me" demo. */
export function controllerLevels(id: string): ReadonlySet<number> {
  const info = (COUCH_INFO as Record<string, (typeof COUCH_INFO)[CouchId] | undefined>)[id];
  if (!info) return new Set();
  const levels = new Set<number>([info.demoLevel]);
  for (let stop = 0; stop < STOPS; stop++) levels.add(info.level(stop));
  return levels;
}

/**
 * Whether keys and a pad play this game at this level on the island: the game switches to a controller while it runs
 * (`liveController`), and the level is one couch play has played. Other levels stay touch until they are checked.
 */
export function controllerPlays(mod: Pick<GameModule, 'id' | 'liveController'>, level: number): boolean {
  return !!mod.liveController && controllerLevels(mod.id).has(level);
}
