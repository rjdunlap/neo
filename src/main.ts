import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { App } from './app/App';
import { createRoutes } from './app/routes';
import { applySettings } from './app/settings';
import { loadCollectionArt } from './creatures/companion';
import { store } from './progress/store';

async function boot() {
  await store.load();
  applySettings();
  // Pixi draws text onto canvases, so the font has to be ready first.
  await Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('500 20px Fredoka')]).catch(() => {});
  const app = new App();
  await app.init(document.getElementById('app')!);
  // The companions' illustrated art, once, so every scene builds its friend without waiting (RW05).
  await loadCollectionArt();
  app.go = createRoutes(app);
  // This is the island game, served at `classic/`; the site root boots the rework (`src/rework.ts`).
  app.go.start();
  // A handle for poking at the running game from the browser console during development.
  if (import.meta.env.DEV) {
    Object.assign(window, { neo: app });
    void import('./dev/testkit');
  }
  // The offline worker sits at the site root, one level up from `classic/` (where `registerSW` would look). An update
  // waits until every copy of the app has closed (vite.config.ts), so play is never interrupted by a reload.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register(new URL('../sw.js', location.href), { scope: '../' }).catch(() => {});
}

void boot();
