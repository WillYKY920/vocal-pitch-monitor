import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    build: {
      outDir: '../server/src/main/resources/static/', // Relative to frontend folder
      emptyOutDir: true, // Cleans the directory before building
    },
  }
)