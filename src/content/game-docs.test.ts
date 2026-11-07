import { describe, expect, it } from 'vitest';
// @ts-expect-error: a plain Node script with no type declarations.
import { exists, listDir, readText, writeMode, writeText } from '../../scripts/game-docs-io.mjs';
import { GAMES } from '../games/registry';
import { LANDS, landOf } from './lands';
import { BEGIN, emptyPage, END, gamesIndex, readmeBlocks, renderPage, replaceBlock, type Entry } from './game-docs';

// `npm run game-docs` sets GAME_DOCS=write to rewrite the files; otherwise this fails when one is stale.
const write: boolean = writeMode;
const read = (p: string): string => readText(p);

function expected(): Map<string, string> {
  const files = new Map<string, string>();
  const entries: Entry[] = GAMES.map((game) => {
    const path = `docs/games/${game.id}.md`;
    const page = renderPage(exists(path) ? read(path) : emptyPage(game), game, landOf(game.id));
    files.set(path, page);
    return { game, land: landOf(game.id), page };
  });
  let readme = read('README.md');
  for (const [what, body] of Object.entries(readmeBlocks(entries, LANDS))) readme = replaceBlock(readme, what, body);
  files.set('README.md', readme);
  files.set('docs/GAMES.md', replaceBlock(read('docs/GAMES.md'), 'the games by land', gamesIndex(entries, LANDS)));
  return files;
}

describe('generated game docs', () => {
  const files = expected();

  it.runIf(write)('writes them', () => {
    for (const [path, text] of files) writeText(path, text);
  });

  it.skipIf(write)('are current (run npm run game-docs after changing a game, its land, or a page)', () => {
    const stale = [...files].filter(([path, text]) => read(path) !== text).map(([path]) => path);
    expect(stale, 'run `npm run game-docs`').toEqual([]);
  });

  it('have one page per game and none for a game that is gone', () => {
    const ids = new Set(GAMES.map((g) => g.id));
    const extra = (listDir('docs/games') as string[]).filter((f) => !ids.has(f.replace(/\.md$/, '')));
    expect(extra).toEqual([]);
  });

  it('keep each page’s hand-written lines and design notes after the generated block', () => {
    for (const g of GAMES) {
      const page = files.get(`docs/games/${g.id}.md`)!;
      expect(page.startsWith(`# ${g.name}\n\n${BEGIN(`from src/games/${g.id}; edit the text below the end mark`)}`)).toBe(true);
      const hand = page.slice(page.indexOf(END));
      expect(hand, g.id).toMatch(/\*\*Starts as:\*\* \S/);
      expect(hand, g.id).toMatch(/\*\*Grows into:\*\* \S/);
      expect(hand, g.id).toContain('\n## Design notes\n');
    }
  });
});
