import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { createRoutes } from './app/routes';
import { applySettings } from './app/settings';
import { loadArt } from './art/creatures/illustrated';
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
  const [sprout, river, glider] = await Promise.all([loadArt('sprout'), loadArt('river'), loadArt('glider')]);
  void app.show(new CreaturePreview(app, { sprout, river, glider }));
  if (import.meta.env.DEV) Object.assign(window, { neo: app });
  registerSW({ immediate: true });
}

void boot();
