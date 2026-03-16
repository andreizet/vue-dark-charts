import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [],
    }),
  ],
  build: {
    lib: {
      entry: resolve(currentDir, 'src/index.ts'),
      name: 'VueDarkCharts',
      cssFileName: 'style',
      fileName: (format) =>
        format === 'es'
          ? 'vue-dark-charts.js'
          : format === 'cjs'
            ? 'vue-dark-charts.cjs'
            : 'vue-dark-charts.iife.js',
      formats: ['es', 'cjs', 'iife'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/**/*.spec.ts'],
  },
})
