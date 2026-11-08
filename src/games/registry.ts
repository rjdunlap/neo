import { LANDS } from '../content/lands';
import type { GameModule } from './types';

/** A game folder's module: the one export with an id and a `create`; its id is the folder's name. */
function moduleOf(path: string, exports: Record<string, unknown>): GameModule {
  const folder = path.split('/')[1];
  const mods = Object.values(exports).filter(
    (v): v is GameModule =>
      !!v &&
      typeof v === 'object' &&
      typeof (v as GameModule).id === 'string' &&
      typeof (v as GameModule).create === 'function',
  );
  if (mods.length !== 1)
    throw new Error(`src/games/${folder}/index.ts exports ${mods.length} game modules, not one`);
  if (mods[0].id !== folder)
    throw new Error(`src/games/${folder} holds the game "${mods[0].id}"; a game's folder is named by its id`);
  return mods[0];
}

/** Where a game sits on the island: its land, then its spot in that land. A game in no land sorts last (the lands test fails). */
const landOrder = new Map(LANDS.flatMap((land) => land.games).map((id, i) => [id, i]));
const spot = (id: string) => landOrder.get(id) ?? Number.MAX_SAFE_INTEGER;

/**
 * Every minigame, found from its folder (`src/games/<id>/index.ts`), in island order: land by land, each land's games
 * in its order in `LANDS`. Nothing lists games by hand here; a new game needs only its folder and its land.
 */
export const GAMES: GameModule[] = Object.entries(
  import.meta.glob<Record<string, unknown>>('./*/index.ts', { eager: true }),
)
  .map(([path, exports]) => moduleOf(path, exports))
  .sort((a, b) => spot(a.id) - spot(b.id) || a.id.localeCompare(b.id));

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

/** Whether the island's own scene can play a game: it takes touch unless the module says it takes only a controller. */
export const playsByTouch = (mod: Pick<GameModule, 'inputs'>) => !mod.inputs || mod.inputs.includes('touch');

/** Couch play looks games up here too. The grown-up games are island games now (band `grownup`), so there is one list. */
export const couchGameById = gameById;
