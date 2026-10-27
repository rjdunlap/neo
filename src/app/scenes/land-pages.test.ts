import { describe, expect, it } from 'vitest';
import { clampLandPage, landFor, landPages, olderIn, visibleIn } from '../../content/lands';
import { GAMES } from '../../games/registry';
import { forgetLands, rememberedPage, rememberPage } from './LandScene';

describe('a full land\'s pages', () => {
  it('remembers each side\'s page for the session, and forgets them all when another player comes', () => {
    forgetLands();
    expect(rememberedPage('tinker-lab', false)).toBe(0);
    rememberPage('tinker-lab', false, 1);
    rememberPage('tinker-lab', true, 2);
    expect(rememberedPage('tinker-lab', false)).toBe(1);
    expect(rememberedPage('tinker-lab', true)).toBe(2);
    expect(rememberedPage('puzzle-peaks', false)).toBe(0);
    forgetLands();
    expect(rememberedPage('tinker-lab', false)).toBe(0);
    expect(rememberedPage('tinker-lab', true)).toBe(0);
  });

  it('pages Tinker Lab at school (17 games and a signpost) as 9 and 8, and holds a page past the end on the last', () => {
    const lab = landFor('tinker-lab');
    const sign = olderIn(lab, 'school', GAMES).length > 0;
    const pages = landPages(visibleIn(lab, 'school', GAMES), sign);
    expect(sign).toBe(true);
    expect(pages.map((p) => p.length)).toEqual([9, 8]);
    expect(clampLandPage(4, pages.length)).toBe(1);
  });
});
