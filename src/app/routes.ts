import { gameById } from '../games/registry';
import type { App, Routes } from './App';
import { GameScene } from './scenes/GameScene';
import { GoodnightScene } from './scenes/GoodnightScene';
import { HubScene } from './scenes/HubScene';
import { StartScene } from './scenes/StartScene';
import { StickerBookScene } from './scenes/StickerBookScene';

export function createRoutes(app: App): Routes {
  return {
    start: () => void app.show(new StartScene(app)),
    hub: () => void app.show(new HubScene(app)),
    game: (id) => {
      const mod = gameById(id);
      if (mod) void app.show(new GameScene(app, mod));
    },
    stickers: () => void app.show(new StickerBookScene(app)),
    goodnight: () => void app.show(new GoodnightScene(app)),
  };
}
