import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5180",
    browserName: "chromium",
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
    env: { PORT: "5180", NODE_USE_ENV_PROXY: "1" },
    timeout: 30000,
  },
  reporter: "list",
});
