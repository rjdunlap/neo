import { bubblePop } from './bubble-pop';
import { jellyDrums } from './jelly-drums';
import { rainbowFingers } from './rainbow-fingers';
import type { GameModule } from './types';

/** Every minigame, in the order they appear in the hub. */
export const GAMES: GameModule[] = [bubblePop, rainbowFingers, jellyDrums];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
