import { gameById } from '../games/registry';
import type { App, Routes } from './App';
import { GameScene } from './scenes/GameScene';
import { GoodnightScene } from './scenes/GoodnightScene';
import { MapScene } from './scenes/MapScene';
import { RegionScene } from './scenes/RegionScene';
import { HatchScene } from './scenes/HatchScene';
import { store } from '../progress/store';
import { StartScene } from './scenes/StartScene';
import { StickerBookScene } from './scenes/StickerBookScene';

export function createRoutes(app: App): Routes {
  return {
    start: () => void app.show(new StartScene(app)),
    hub: () => void app.show(new MapScene(app)),
    region: (id) => void app.show(new RegionScene(app, id)),
    hatch: () => void app.show(new HatchScene(app)),
    game: (id) => {
      const mod = gameById(id);
      if (mod?.bands.includes(store.data.profile.band)) void app.show(new GameScene(app, mod));
    },
    stickers: () => void app.show(new StickerBookScene(app)),
    goodnight: () => void app.show(new GoodnightScene(app)),
  };
}
