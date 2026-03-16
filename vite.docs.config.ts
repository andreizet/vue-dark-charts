import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: resolve(currentDir, 'docs'),
  publicDir: resolve(currentDir, 'public'),
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  server: {
    open: true,
  },
  build: {
    outDir: resolve(currentDir, 'dist/docs'),
    emptyOutDir: true,
  },
})
