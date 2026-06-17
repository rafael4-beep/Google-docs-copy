import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Use an isolated database file so tests never touch the app's real data.
    env: {
      DB_PATH: "tmp/test-db.json",
    },
  },
});
