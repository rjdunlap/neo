import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { createRoutes } from './app/routes';
import { applySettings } from './app/settings';
import { loadArt } from './art/creatures/illustrated';
import { loadWearables } from './art/creatures/wearables';
import { CreaturePreview } from './dev/creature-preview';
import { store } from './progress/store';

/**
 * The site root: the creature-world rework as it stands (docs/rework/), today RW02b's creature
 * preview. The island game boots from `src/main.ts` at `classic/` (decided by the developer
 * 2026-10-19); RW05 onward replaces this preview with the real collection and home, and RW08
 * decides what becomes of `classic/`.
 */
async function boot() {
  await store.load();
  applySettings();
  await Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('500 20px Fredoka')]).catch(() => {});
  const app = new App();
  await app.init(document.getElementById('app')!);
  app.go = createRoutes(app);
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('cast')) {
    // RW02b step 3: the second-wave six, on the dev server only, so their sprites stay out of the build.
    await (await import('./dev/cast-preview')).showCast(app);
  } else {
    const [sprout, river, glider, items] = await Promise.all([loadArt('sprout'), loadArt('river'), loadArt('glider'), loadWearables()]);
    void app.show(new CreaturePreview(app, { sprout, river, glider }, items));
  }
  if (import.meta.env.DEV) Object.assign(window, { neo: app });
  registerSW({ immediate: true });
}

void boot();
