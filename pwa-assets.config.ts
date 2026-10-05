import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// `npm run icons` renders the app icons from public/icon.svg (drawn in code, like everything else).
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#FFF4E3' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#FFF4E3' } },
  },
  images: ['public/icon.svg'],
});
