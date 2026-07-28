import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Standalone build with Preact replacing React
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false, // Don't clear dist directory
    lib: {
      entry: resolve(__dirname, 'src/standalone.tsx'),
      name: 'AccessQABot',
      formats: ['iife'],
      fileName: () => 'access-qa-bot.standalone.js'
    },
    rollupOptions: {
      output: {
        // Bundle everything, no externals
        globals: {},
        // The standalone build injects its CSS at runtime, so its emitted
        // stylesheet is an unused byproduct. Give it a distinct name so it
        // can't overwrite dist/style.css from the library build (which
        // consumers like access-ci-ui import directly).
        assetFileNames: (asset) =>
          asset.name === 'style.css'
            ? 'access-qa-bot.standalone.css'
            : '[name][extname]',
      }
    },
    sourcemap: true
  },
  resolve: {
    alias: {
      // Replace React with Preact for smaller bundle size
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  }
});
