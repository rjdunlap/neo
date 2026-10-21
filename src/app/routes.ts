import { FIRST_COURSE } from '../couch/courses';
import { gameById, playsByTouch } from '../games/registry';
import { playBand } from '../progress/bands';
import { store } from '../progress/store';
import type { App, Routes } from './App';
import { GameScene } from './scenes/GameScene';
import { HatchScene } from './scenes/HatchScene';
import { MapScene } from './scenes/MapScene';
import { PicnicScene } from './scenes/PicnicScene';
import { WoodlandScene } from './scenes/WoodlandScene';
import { SubjectPlaceScene } from './scenes/SubjectPlaceScene';
import { PlaceScene } from './scenes/PlaceScene';
import { ChooserScene } from './scenes/ChooserScene';
import { JournalScene } from './scenes/JournalScene';
import { LandScene } from './scenes/LandScene';
import { RoomScene } from './scenes/RoomScene';
import { FriendsScene } from './scenes/FriendsScene';
import { DressScene } from './scenes/DressScene';
import { StickerBookScene } from './scenes/StickerBookScene';
import { CouchScene } from './scenes/CouchScene';

export function createRoutes(app: App): Routes {
  return {
    couch: (play, origin) => void app.show(new CouchScene(app, play, origin)),
    start: () => void app.show(new ChooserScene(app)),
    hub: () => void app.show(new MapScene(app)),
    // Explore is the root's (src/rework.ts); the island never makes an Explore origin, so it falls back to the map.
    explore: () => void app.show(new MapScene(app)),
    place: (band) => void app.show(store.data.settings.placeLayout === 'subjects' ? new SubjectPlaceScene(app, band) : new PlaceScene(app, band)),
    hatch: (quick) => void app.show(new HatchScene(app, quick)),
    land: (id) => void app.show(new LandScene(app, id)),
    game: (id, band = store.data.profile.band, story, again = false, origin, level) => {
      const mod = gameById(id);
      if (!mod) return;
      // A game that takes only a controller opens its couch puzzle-shelf course; the island's scene has no controller input yet.
      if (!playsByTouch(mod)) {
        const course = FIRST_COURSE[id];
        if (course) void app.show(new CouchScene(app, course, origin ?? { land: 'lantern-lake' }));
        return;
      }
      void app.show(new GameScene(app, mod, playBand(mod.bands, band), story, again, origin, level));
    },
    picnic: (from) => void app.show(new PicnicScene(app, from)),
    woodland: (from) => void app.show(new WoodlandScene(app, from)),
    // Welcome a New Friend lives at the root only (src/rework.ts); the island has no project page.
    project: () => void app.show(new MapScene(app)),
    stickers: () => void app.show(new StickerBookScene(app)),
    room: () => void app.show(new RoomScene(app)),
    friends: (previewId) => void app.show(new FriendsScene(app, previewId)),
    dress: (id) => void app.show(new DressScene(app, id)),
    journal: () => void app.show(new JournalScene(app)),
  };
}
