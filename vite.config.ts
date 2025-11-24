import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      rollupTypes: true
    })
  ],
  server: {
    port: 3000
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib.tsx'),
      name: 'AccessQABot',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'access-qa-bot.js';
        if (format === 'umd') return 'access-qa-bot.umd.cjs';
        return `access-qa-bot.${format}.js`;
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    },
    sourcemap: true
  }
});
