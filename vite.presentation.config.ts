import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

// Portable client presentation build. The existing Sites/Worker build is intact.
export default defineConfig({
  root: fileURLToPath(new URL('./presentation', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  plugins: [react()],
  // Windows may lock these static portrait exports; they do not need HMR.
  server: { watch: { ignored: ['**/public/assets/deniz/**'] } },
  css: { postcss: { plugins: [tailwindcss()] } },
  // Copy the reachable public assets after prerendering instead of shipping studies.
  build: { outDir: '../dist-presentation', emptyOutDir: true, copyPublicDir: false },
});
