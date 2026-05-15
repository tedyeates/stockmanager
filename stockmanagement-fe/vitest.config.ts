import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      util: path.resolve(__dirname, 'src/util'),
      pages: path.resolve(__dirname, 'src/pages'),
      styles: path.resolve(__dirname, 'src/styles'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
