import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { App, type Routes } from './app/App';
import { placeAtRoot } from './app/origin';
import { createRoutes } from './app/routes';
import { applySettings } from './app/settings';
import { loadCastArt } from './art/creatures/cast';
import { loadArt } from './art/creatures/illustrated';
import { loadWearables } from './art/creatures/wearables';
import { isLocation, LocationScene } from './app/scenes/LocationScene';
import { loadCollectionArt } from './creatures/companion';
import { CreaturePreview } from './dev/creature-preview';
import { ArcadeScene } from './app/scenes/ArcadeScene';
import { ExploreScene } from './app/scenes/ExploreScene';
import { HomeScene } from './app/scenes/HomeScene';
import { LibraryScene } from './app/scenes/LibraryScene';
import { PlayScene } from './app/scenes/PlayScene';
import { ProjectScene } from './app/scenes/ProjectScene';
import { loadHomeBackdrop } from './art/home/backdrop';
import { loadLocationArt } from './art/locations';
import { store } from './progress/store';

/**
 * The site root: the creature-world rework as it stands (docs/rework/). It boots to "Who's playing?", then the person's
 * Home (RW06 slice 2, docs/rework/HOME.md#routes-and-the-root-front-door): `hub` is Home, `room` is creature play, and a
 * built location (RW13) replaces its land. RW02b's creature preview stays behind `?preview`, in production too, until
 * RW08 replaces the root's interim Explore. The island game boots from `src/main.ts` at `classic/` (decided by the
 * developer 2026-10-19); RW08 decides what becomes of it.
 */
async function boot() {
  await store.load();
  applySettings();
  await Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('500 20px Fredoka')]).catch(() => {});
  const app = new App();
  await app.init(document.getElementById('app')!);
  const island = createRoutes(app);
  const query = new URLSearchParams(location.search);
  const land: Routes['land'] = (id, page) => (isLocation(id) ? void app.show(new LocationScene(app, id, undefined, page)) : island.land(id, page));
  // At the root a location's Back returns to Explore's Places (RW08); its games' results come back to the location.
  const atRoot: Routes['land'] = (id, page) => (isLocation(id) ? void app.show(new LocationScene(app, id, () => app.go.explore('places'), page)) : island.land(id, page));
  // The page's link to the island games shows only on the root's entry scene (Home, or the preview).
  const link = document.querySelector<HTMLElement>('.classic-link');
  const withLink = (routes: Routes) =>
    Object.fromEntries(
      Object.entries(routes).map(([name, route]) => [name, (...args: unknown[]) => {
        if (link) link.hidden = name !== 'hub';
        return (route as (...a: unknown[]) => void)(...args);
      }]),
    ) as unknown as Routes;
  if (import.meta.env.DEV && query.has('cast')) {
    app.go = island;
    // RW02b step 3: the second-wave six, on the dev server only, so their sprites stay out of the build.
    await (await import('./dev/cast-preview')).showCast(app);
  } else if (query.has('preview')) {
    // RW02b's preview, for comparing the rigs on the iPad until RW08; its meadow button opens Rainbow Meadow, whose Home comes back here.
    const [sprout, river, glider, items] = await Promise.all([loadArt('sprout'), loadArt('river'), loadArt('glider'), loadWearables(), loadCollectionArt(), loadCastArt()]);
    const entry = () => void app.show(new CreaturePreview(app, { sprout, river, glider }, items));
    app.go = withLink({ ...island, hub: entry, land });
    app.go.hub();
  } else {
    // The residents' art (RW14 slice 2) and the location pictures (slice 4) load with the collection's, so a location never waits for them.
    await Promise.all([loadCollectionArt(), loadHomeBackdrop(), loadCastArt(), loadLocationArt()]);
    app.creatureWorld = true;
    app.go = withLink({
      ...island,
      hub: () => void app.show(new HomeScene(app)),
      room: () => void app.show(new PlayScene(app)),
      library: () => void app.show(new LibraryScene(app)),
      project: (from) => void app.show(new ProjectScene(app, from)),
      // The Arcade is Explore's fifth entry with its own scene (docs/rework/ARCADE.md).
      explore: (entry, page, others) => void app.show(entry === 'arcade' ? new ArcadeScene(app, page ?? 0) : new ExploreScene(app, entry ?? null, page ?? 0, others ?? false)),
      land: atRoot,
      // No age places at the root (RW08 slice 2): Little surprises' stops, its Explore and a game with no origin come back to All games.
      place: () => placeAtRoot(app.go),
    });
    app.go.start();
  }
  if (import.meta.env.DEV) {
    Object.assign(window, { neo: app });
    // Scripted checks of the root (`BROWSER_SUITE=home`) drive it with the same kit as the island.
    void import('./dev/testkit');
  }
  registerSW({ immediate: true });
}

void boot();
