import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { BANDS, type Band } from '../progress/bands';
import { visibleGames } from './lands';
import { NO_NAME } from './offscreen';
import { DEFERRED_CLASSES, EVERY_BAND, UNDER_3, wordPattern } from './offscreen-rules';
import { TALK_CARDS, talkCards } from './talk';

const NAME = 'Mira';
const NOW = Date.UTC(2026, 10, 18);
const YEAR = 365 * 24 * 60 * 60 * 1000;
const CLAIMS = [
  'protect',
  'safe',
  'learn',
  'teach',
  'improve',
  'boost',
  'develop',
  'skill',
  'brain',
  'attention',
  'smarter',
  'benefit',
  'helps',
].map(wordPattern);
const MEASURING = ["can't", 'able', 'yet', 'should', 'ready', 'by now', 'behind', 'ahead'].map(wordPattern);

const cards = (band: Band, played: Record<string, number> = {}, childName = NAME) =>
  talkCards({
    games: visibleGames(band, GAMES),
    band,
    childName,
    lastPlayed: (g) => played[g.id],
  });
const ids = (result: ReturnType<typeof cards>) => result.map(({ game }) => game.id);

function checkCopy(id: string, text: string, young: boolean, allowReady = false) {
  const forbidden = [
    ...EVERY_BAND,
    ...DEFERRED_CLASSES.map(wordPattern),
    ...(young ? UNDER_3.map(wordPattern) : []),
    ...CLAIMS,
    ...MEASURING,
  ];
  const wording = text.replaceAll('{name}', NAME);
  const checked = allowReady
    ? wording.replace('With a reader who is ready for it', 'With a reader')
    : wording;
  for (const pattern of forbidden) expect(checked, id).not.toMatch(pattern);
}

describe('Conversation cards', () => {
  it('uses registered games, short copy and age-appropriate wording', () => {
    for (const [id, card] of Object.entries(TALK_CARDS)) {
      const game = GAMES.find((g) => g.id === id);
      expect(game, id).toBeDefined();
      const young = game?.bands.some((band) => band === 'lap' || band === 'toddler') ?? false;
      expect(card.title.length, id).toBeLessThanOrEqual(40);
      expect(card.lines.length, id).toBeGreaterThanOrEqual(2);
      expect(card.lines.length, id).toBeLessThanOrEqual(4);
      if (young) expect(card.under2, id).toBeTruthy();
      for (const text of [card.title, card.source, card.under2]) {
        if (text !== undefined) checkCopy(id, text, young);
      }
      card.lines.forEach((line, index) => {
        expect(line.length, id).toBeLessThanOrEqual(240);
        checkCopy(id, line, young, id === 'thought-bubbles' && index === 2);
      });
    }
  });

  it('shows nothing before a saved round and keeps a card for a round a year ago', () => {
    for (const { id } of BANDS) expect(cards(id)).toEqual([]);
    expect(ids(cards('prek', { 'notice-board': NOW - YEAR }))).toEqual(['notice-board']);
  });

  it('shows at most two visible cards in recency order with catalog order on a tie', () => {
    const played = { 'notice-board': NOW, 'thought-bubbles': NOW - 1, 'not-always': NOW - 2 };
    const recent = cards('school', played);
    expect(ids(recent)).toEqual(['notice-board', 'thought-bubbles']);
    expect(cards('school', played)).toEqual(recent);
    const tied = Object.fromEntries(Object.keys(played).map((id) => [id, NOW]));
    const catalogOrder = visibleGames('school', GAMES).filter((game) => Object.hasOwn(tied, game.id));
    expect(ids(cards('school', tied))).toEqual(catalogOrder.slice(0, 2).map((game) => game.id));
    expect(cards('toddler', { 'not-always': NOW })).toEqual([]);
    expect(cards('grownup', played)).toEqual([]);
  });

  it('fills the name, including a fallback for blank names', () => {
    const played = { 'not-always': NOW };
    expect(cards('prek', played, ' Mira ')[0].lines[1]).toContain('Whatever Mira says');
    expect(cards('prek', played, ' ')[0].lines[1]).toContain(`Whatever ${NO_NAME} says`);
    expect(cards('prek', played, '$&')[0].lines[1]).toContain('Whatever $& says');
  });

  it('uses a single under-two paragraph for lap and toddler profiles', () => {
    const id = 'puppet-stage';
    const fixture = {
      title: 'Puppet talk',
      lines: ['Ask a question.', 'Swap places.'],
      under2: 'Say hello to {name}.',
    };
    TALK_CARDS[id] = fixture;
    try {
      checkCopy(id, fixture.under2, true);
      const played = { [id]: NOW };
      for (const band of ['lap', 'toddler'] as const)
        expect(cards(band, played)[0].lines).toEqual(['Say hello to Mira.']);
      expect(cards('preschool', played)[0].lines).toEqual(fixture.lines);
    } finally {
      delete TALK_CARDS[id];
    }
  });
});
