import { extendTheme, pigment } from '@stylefusion/vite-plugin';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const theme = extendTheme({
  cssVarPrefix: 'raikou',
  getSelector: (colorScheme) =>
    colorScheme ? `[data-raikou-color-scheme='${colorScheme}']` : ':root',
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    pigment({
      atomic: false,
      theme,
      rawTheme: {},
    }),
    TanStackRouterVite({}),
    react(),
  ],
  optimizeDeps: {
    exclude: ['vite-plugin-node-polyfills']
  },
  resolve: {
    alias: {
    },
  },
});
