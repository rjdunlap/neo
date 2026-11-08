import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Put the castle's people and rooms where their work needs them.",
  steps: [
    { from: 1, to: 1, text: 'Tap a door and see who comes out; tap the well too.' },
    { from: 2, to: 2, text: 'Drag each one to the room where its work is.' },
    {
      from: 3,
      to: 3,
      text: 'Put the kitchen down and watch the soup: does it reach the hall hot? Then the stable, for the horses.',
    },
    {
      from: 4,
      to: 4,
      text: 'Fit the five rooms to the five needs, then ring the bell. Tap a need card to hear it again.',
    },
    {
      from: 5,
      to: 5,
      text: "Tap a room to hear what's left in it; drag each picture to the room its clues say it was.",
    },
    {
      from: 6,
      to: 6,
      text: "Look at timber and stone along the lord's years, then build; watch what the years do.",
    },
  ],
  finish: 'Everyone is at work in the right place.',
  note: [
    { from: 1, to: 1, text: 'Nothing is counted. Every door, the well and a wave are free.' },
    {
      from: 2,
      to: 2,
      text: "A first wrong room for each figure is never counted; the next wrong room is a miss. After two misses the right room glows, which counts as one hint. This is the island's castle, like the castles people built long ago: a home, and a workplace for everyone in it.",
    },
    {
      from: 3,
      to: 3,
      text: "A placement is never a miss: either spot finishes. After a cold walk, Keep it once replays it; Keep it twice shows the near spot, which counts as one hint. This is the island's castle, like the castles people built long ago: a home, and a workplace for everyone in it.",
    },
    {
      from: 4,
      to: 4,
      text: "Moving rooms around and hearing a need again are never counted; the bell is what checks, one miss per unmet need. After two misses the next move glows, which counts as one hint. This is the island's castle, like the castles people built long ago: a home, and a workplace for everyone in it.",
    },
    {
      from: 5,
      to: 5,
      text: "Hearing a room's clues is never counted; a wrong label is, one miss each, and one picture always stays in the tray. A hearth or a drain can belong to two rooms, so another clue decides. After two misses the deciding clue glows, which counts as one hint. The stones that stayed tell us which room was which.",
    },
    {
      from: 6,
      to: 6,
      text: "Looking at a build and building again are never counted, and no choice is a miss. After the other choice, Keep it once replays the years; Keep it twice shows the better build, which counts as one hint. Bags are counters, not money, and nothing is kept. Stone took much longer to build than timber, and lasted much longer. The bag numbers are the island's own; real costs varied widely. Records for Beaumaris castle (begun 1295) mention about 400 masons and 2,000 other workers in one season, with pay often late, and it was never finished.",
    },
  ],
};
