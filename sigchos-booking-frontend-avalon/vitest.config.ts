import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Simula un entorno de navegador (DOM) en Node.js
    environment: 'jsdom',
    // Carga el setup de jest-dom antes de cada archivo de test
    setupFiles: ['./vitest.setup.ts'],
    // Muestra resultados detallados en la terminal
    reporters: ['verbose'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        '.next/**',
        'mocks/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'vitest.setup.ts',
        'vitest.config.ts',
        'next.config.js',
      ],
    },
  },
  resolve: {
    // Resuelve el alias @/ que usa el proyecto (equivalente al tsconfig paths)
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
