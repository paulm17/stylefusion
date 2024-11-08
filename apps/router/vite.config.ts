import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { extendTheme, pigment } from "@stylefusion/vite-plugin";
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pigment({
      theme: extendTheme({}),
    }),
    TanStackRouterVite({}), 
    react()
  ],
})
