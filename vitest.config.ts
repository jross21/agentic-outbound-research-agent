import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    coverage: { provider: "v8" },
    setupFiles: ["./vitest.setup.ts"],
    // Force keyless/deterministic mode so tests never hit live APIs even if the
    // developer has ANTHROPIC_API_KEY / provider keys exported in their shell.
    env: { FORCE_SAMPLE: "1" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
