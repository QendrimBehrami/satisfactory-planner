import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/satisfactory-planner/',
  assetsInclude: ['**/*.wasm'],
  plugins: [
    tailwindcss(),
    svelte(),
  ],
  resolve: {
    alias: {
      $lib: resolve('./src/lib'),
    },
  },
})