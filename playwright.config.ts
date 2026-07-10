import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  outputDir: ".vite/playwright",
  reporter: "line",
  workers: 1,
  projects: [{ name: "firefox", use: { browserName: "firefox" } }],
  use: { baseURL: "http://127.0.0.1:8000" },
  webServer: {
    command: "deno task serve",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: true,
  },
})
