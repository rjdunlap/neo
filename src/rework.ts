import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { App, type Routes } from './app/App';
import { createRoutes } from './app/routes';
import { applySettings } from './app/settings';
import { loadArt } from './art/creatures/illustrated';
import { loadWearables } from './art/creatures/wearables';
import { isLocation, LocationScene } from './app/scenes/LocationScene';
import { loadCollectionArt } from './creatures/companion';
import { CreaturePreview } from './dev/creature-preview';
import { store } from './progress/store';

/**
 * The site root: the creature-world rework as it stands (docs/rework/), today RW02b's creature
 * preview, with RW13's first location (Rainbow Meadow) behind its meadow button. The island game boots from `src/main.ts` at `classic/` (decided by the developer
 * 2026-10-19); RW05 onward replaces this preview with the real collection and home, and RW08
 * decides what becomes of `classic/`.
 */
async function boot() {
  await store.load();
  applySettings();
  await Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('500 20px Fredoka')]).catch(() => {});
  const app = new App();
  await app.init(document.getElementById('app')!);
  const island = createRoutes(app);
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('cast')) {
    app.go = island;
    // RW02b step 3: the second-wave six, on the dev server only, so their sprites stay out of the build.
    await (await import('./dev/cast-preview')).showCast(app);
  } else {
    const [sprout, river, glider, items] = await Promise.all([loadArt('sprout'), loadArt('river'), loadArt('glider'), loadWearables(), loadCollectionArt()]);
    // The page's link to the island games sits where every other scene has its Home button, so only the entry scene shows it.
    const link = document.querySelector<HTMLElement>('.classic-link');
    const entry = () => void app.show(new CreaturePreview(app, { sprout, river, glider }, items));
    // RW13: a built location replaces its land at the root, and the root's entry scene stands in for the island map
    // (a location's Home, the sticker book's way back) until RW06/RW08 give the root its real home.
    const routes: Routes = { ...island, hub: entry, land: (id) => (isLocation(id) ? void app.show(new LocationScene(app, id)) : island.land(id)) };
    app.go = Object.fromEntries(
      Object.entries(routes).map(([name, route]) => [name, (...args: unknown[]) => {
        if (link) link.hidden = name !== 'hub';
        return (route as (...a: unknown[]) => void)(...args);
      }]),
    ) as unknown as Routes;
    app.go.hub();
  }
  if (import.meta.env.DEV) Object.assign(window, { neo: app });
  registerSW({ immediate: true });
}

void boot();
