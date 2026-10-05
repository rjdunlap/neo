import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { createRoutes } from './app/routes';
import { applySettings } from './app/settings';
import { store } from './progress/store';

async function boot() {
  await store.load();
  applySettings();
  // Pixi draws text onto canvases, so the font has to be ready first.
  await Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('500 20px Fredoka')]).catch(() => {});
  const app = new App();
  await app.init(document.getElementById('app')!);
  app.go = createRoutes(app);
  app.go.start();
  // A handle for poking at the running game from the browser console during development.
  if (import.meta.env.DEV) {
    Object.assign(window, { neo: app });
    void import('./dev/testkit');
  }
  registerSW({ immediate: true });
}

void boot();
