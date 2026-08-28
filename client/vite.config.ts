import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Vitest config lives here too. It's cast to `any` because this project uses
// Vite 8, whose plugin types conflict with the Vite version bundled inside
// vitest/config — the cast avoids that clash while runtime works fine.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    coverage: {
      provider: 'v8',
      // lcov is the only format SonarCloud reads.
      reporter: ['text', 'lcov'],
      // A floor, not a target. It is low because most of this application is
      // page components with no tests, and stating that plainly is more useful
      // than a number that flatters. What it buys is a ratchet: coverage
      // cannot fall below where it is today without failing the build. Raise
      // it whenever a batch of components gains tests.
      thresholds: {
        statements: 3.5,
        branches: 55,
        functions: 30,
        lines: 3.5,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx'],
    },
  },
} as any)
