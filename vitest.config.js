import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    // Os testes de regras compartilham o mesmo emulador, então rodam um por vez.
    fileParallelism: false,
    testTimeout: 15000,
  },
})
