import type { GameModule, OffScreenLines } from '../games/types';
import { playBand, type Band } from '../progress/bands';

/** The name a line uses when the profile has none, the same as the co-play tip's (`GameScene.showTip`). */
export const NO_NAME = 'your little one';

/** The band entry for a resolved play band: its own sentence, `null` to withhold, else `all` (or the plain string). */
function lineAt(offScreen: string | OffScreenLines, band: Band): string | null {
  if (typeof offScreen === 'string') return offScreen;
  return band in offScreen ? (offScreen[band] ?? null) : offScreen.all;
}

/**
 * The off-screen idea for a game at the band she plays it (`playBand`, the band every launch uses), with her name in place
 * of `{name}`; `null` when the game has no line or withholds it at that band. No other templating.
 */
export function offScreenFor(mod: Pick<GameModule, 'bands' | 'offScreen'>, band: Band, childName: string): string | null {
  if (!mod.offScreen) return null;
  const line = lineAt(mod.offScreen, playBand(mod.bands, band));
  return line === null ? null : line.replaceAll('{name}', childName.trim() || NO_NAME);
}

/** The ideas the grown-ups' page prints: the first `count` games with a line at her band, in the order given. */
export function offScreenIdeas<T extends Pick<GameModule, 'bands' | 'offScreen'>>(
  games: readonly T[],
  band: Band,
  childName: string,
  count = 2,
): { game: T; line: string }[] {
  const out: { game: T; line: string }[] = [];
  for (const game of games) {
    const line = offScreenFor(game, band, childName);
    if (line !== null) out.push({ game, line });
    if (out.length >= count) break;
  }
  return out;
}
