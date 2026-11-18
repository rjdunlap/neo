import type { GameModule } from '../games/types';
import type { Band } from '../progress/bands';
import { NO_NAME } from './offscreen';

type TalkCard = { title: string; lines: string[]; under2?: string; source?: string };

export const TALK_CARDS: Record<string, TalkCard> = {
  'not-always': {
    title: 'A question with no right answer',
    lines: [
      'Pick one thing you both saw today and ask one open question about it: "Is it always true that big things are heavy?" or "What if it never stopped raining?"',
      'Whatever {name} says, two follow-ups: "Why do you think that?" and "Can you think of a time when it isn\'t so?"',
      'A what-if or an is-it-fair question has no right answer, so there is nothing to correct. Say what you think too; disagreeing kindly is part of it.',
    ],
    source:
      'The shape, one thing to look at, one question and two follow-ups, is borrowed from Philosophy for Children classroom practice.',
  },
  'notice-board': {
    title: 'Who made this?',
    lines: [
      'When a poster, a toy box or a video is in front of you both, wonder aloud about three things: "Who made this?", "Why did they make it?" and "What did they leave out?"',
      'Any answer is a start: "the shop", "so we come in". Say your own guess too.',
      'A thing made to sell is ordinary, not bad. The questions are about who and why.',
    ],
    source:
      'The three questions follow the key questions of the National Association for Media Literacy Education.',
  },
  'thought-bubbles': {
    title: 'Story talk',
    lines: [
      'At any picture book, stop on one page and ask instead of telling: "What does the bear want?" "Does the fox know that?"',
      'Then: "How do you know? Show me in the picture."',
      'With a reader who is ready for it: "Who is telling this story?"',
    ],
    source: 'Asking instead of telling is borrowed from dialogic reading (Whitehurst and colleagues, 1988).',
  },
};

/** Pick up to two conversations from visible games with a saved round, most recent first. */
export function talkCards<T extends Pick<GameModule, 'id'>>({
  games,
  band,
  childName,
  lastPlayed,
}: {
  games: readonly T[];
  band: Band;
  childName: string;
  lastPlayed: (game: T) => number | undefined;
}): { game: T; title: string; lines: string[]; source?: string }[] {
  if (band === 'grownup') return [];
  const name = childName.trim() || NO_NAME;
  const young = band === 'lap' || band === 'toddler';
  return games
    .flatMap((game) => {
      if (!Object.hasOwn(TALK_CARDS, game.id)) return [];
      const card = TALK_CARDS[game.id];
      const when = lastPlayed(game);
      return when === undefined ? [] : [{ game, card, when }];
    })
    .sort((a, b) => b.when - a.when) // Stable sort retains the input's catalog order on a tie.
    .slice(0, 2)
    .map(({ game, card }) => ({
      game,
      title: card.title,
      lines: (young && card.under2 ? [card.under2] : card.lines).map((line) =>
        line.replaceAll('{name}', () => name),
      ),
      source: card.source,
    }));
}
