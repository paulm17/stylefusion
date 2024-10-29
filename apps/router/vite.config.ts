import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pigment } from "@stylefusion/vite-plugin";
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pigment({
      // theme: {
      //   "--raikou-scale": 1,
      // },
    }),
    TanStackRouterVite({}), 
    react()
  ],
})
