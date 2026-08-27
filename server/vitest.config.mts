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
      // Set just under what the suite covers today. The point is not the
      // number but the ratchet: a change that drops coverage fails CI instead
      // of being noticed months later.
      thresholds: {
        statements: 60,
        branches: 55,
        functions: 45,
        lines: 60,
      },
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/**/*.d.ts", "src/server.ts"],
    },
  },
});
