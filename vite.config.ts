import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    // Production builds skip source maps: they added ~11MB to the Pages deploy
    // artifact (very slow uploads) and aren't useful for the shipped game. The
    // dev server keeps its own inline maps, so local debugging is unaffected.
    sourcemap: false,
  },
});
