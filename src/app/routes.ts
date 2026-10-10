import { gameById } from '../games/registry';
import { playBand } from '../progress/bands';
import { store } from '../progress/store';
import type { App, Routes } from './App';
import { GameScene } from './scenes/GameScene';
import { HatchScene } from './scenes/HatchScene';
import { MapScene } from './scenes/MapScene';
import { PicnicScene } from './scenes/PicnicScene';
import { SubjectPlaceScene } from './scenes/SubjectPlaceScene';
import { PlaceScene } from './scenes/PlaceScene';
import { ChooserScene } from './scenes/ChooserScene';
import { JournalScene } from './scenes/JournalScene';
import { LandScene } from './scenes/LandScene';
import { RoomScene } from './scenes/RoomScene';
import { StickerBookScene } from './scenes/StickerBookScene';
import { CouchScene } from './scenes/CouchScene';

export function createRoutes(app: App): Routes {
  return {
    couch: (play) => void app.show(new CouchScene(app, play)),
    start: () => void app.show(new ChooserScene(app)),
    hub: () => void app.show(new MapScene(app)),
    place: (band) => void app.show(store.data.settings.placeLayout === 'subjects' ? new SubjectPlaceScene(app, band) : new PlaceScene(app, band)),
    hatch: (quick) => void app.show(new HatchScene(app, quick)),
    land: (id) => void app.show(new LandScene(app, id)),
    game: (id, band = store.data.profile.band, story, again = false, origin) => {
      // Couch-only games are not island games, so they never open here.
      const mod = gameById(id);
      if (mod) void app.show(new GameScene(app, mod, playBand(mod.bands, band), story, again, origin));
    },
    picnic: (from) => void app.show(new PicnicScene(app, from)),
    stickers: () => void app.show(new StickerBookScene(app)),
    room: () => void app.show(new RoomScene(app)),
    journal: () => void app.show(new JournalScene(app)),
  };
}
