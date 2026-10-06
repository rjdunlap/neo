import { gameById } from '../games/registry';
import { store } from '../progress/store';
import type { App, Routes } from './App';
import { GameScene } from './scenes/GameScene';
import { GoodnightScene } from './scenes/GoodnightScene';
import { HatchScene } from './scenes/HatchScene';
import { MapScene } from './scenes/MapScene';
import { SubjectPlaceScene } from './scenes/SubjectPlaceScene';
import { PlaceScene } from './scenes/PlaceScene';
import { StartScene } from './scenes/StartScene';
import { StickerBookScene } from './scenes/StickerBookScene';

export function createRoutes(app: App): Routes {
  return {
    start: () => void app.show(new StartScene(app)),
    hub: () => void app.show(new MapScene(app)),
    place: (band) => void app.show(store.data.settings.placeLayout === 'subjects' ? new SubjectPlaceScene(app, band) : new PlaceScene(app, band)),
    hatch: () => void app.show(new HatchScene(app)),
    game: (id, band = store.data.profile.band) => {
      const mod = gameById(id);
      if (mod?.bands.includes(band)) void app.show(new GameScene(app, mod, band));
    },
    stickers: () => void app.show(new StickerBookScene(app)),
    goodnight: () => void app.show(new GoodnightScene(app)),
  };
}
