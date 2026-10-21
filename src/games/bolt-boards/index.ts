import { Container } from 'pixi.js';
import { STYLES } from '../../audio/music';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { GameModule } from '../types';
import { planFor } from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 4 },
  prek: { min: 2, max: 6 },
  school: { min: 4, max: 7 },
};

export const boltBoards: GameModule = {
  id: 'bolt-boards',
  name: 'Bolt Boards',
  titleLine: 'game.bolt-boards',
  region: 'tinker-lab',
  skills: ['cause-and-effect', 'planning', 'spatial-reasoning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  hubIcon: () => new WigglyIcon(new Container()),
  sticker: () => new Container(),
  create: () => { throw new Error('stub'); },
};
