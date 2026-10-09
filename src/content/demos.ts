import { demoFor } from '../couch/catalog';
import type { GameModule } from '../games/types';
import { pointerKind } from '../engine/input';
import type { Band } from '../progress/bands';

/** The demonstration in a window on the island's how-to card: who plays it, and which round. */
export interface IslandDemo {
  /**
   * Who plays it, by what the person plays with: a ghost finger on a touch screen, a mouse pointer on a desktop, or (a
   * stopgap until the game has a pointer bot) a controller moving the couch's highlight. Couch play shows its own
   * controller or key caps by its Settings, never through here.
   */
  input: 'finger' | 'mouse' | 'controller';
  level: number;
  band: Band;
}

/**
 * What the island's card shows for a game. A game with `autotouch` gets a pretend pointer (finger or mouse) at *her* level, so the window
 * matches the card's "this level" line. A game that only the couch bots can play keeps its controller demonstration at
 * the couch's demo level for now. Everything else is text alone.
 */
export function islandDemo(mod: GameModule, level: number, band: Band, kind = pointerKind()): IslandDemo | null {
  if (mod.touchDemo) return { input: kind === 'mouse' ? 'mouse' : 'finger', level, band };
  const couch = demoFor(mod.id);
  return couch ? { input: 'controller', ...couch } : null;
}
