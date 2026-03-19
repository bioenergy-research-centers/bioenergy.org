import { fileURLToPath, URL } from 'node:url';
import { defineConfig, configDefaults } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/*'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/__tests__/**', 'src/main.js', 'src/models/**'],
      thresholds: {
        lines: 80,
        functions: 65,
        branches: 80,
        statements: 80,
      },
    },
  }
});
