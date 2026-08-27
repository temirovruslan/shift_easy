import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    // One in-memory mongod is shared by the whole run, so files must not
    // compete for it: each one wipes the collections between tests.
    fileParallelism: false,
    hookTimeout: 120_000,
    coverage: {
      provider: "v8",
      // `text` for a human reading CI output, `lcov` for SonarCloud, which
      // reads no other format and reports 0% coverage without it.
      reporter: ["text", "lcov"],
      // Set just under what the suite covers today. The point is not the
      // number but the ratchet: a change that drops coverage fails CI instead
      // of being noticed months later.
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 60,
        lines: 80,
      },
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/**/*.d.ts", "src/server.ts"],
    },
  },
});
