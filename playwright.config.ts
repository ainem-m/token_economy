import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:8795",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && rm -f data/playwright.sqlite data/playwright.sqlite-shm data/playwright.sqlite-wal && TOKEN_ECO_DB=data/playwright.sqlite TOKEN_ECO_PARENT_PIN=2468 TOKEN_ECO_TEST_RESET=1 PORT=8795 npm start",
    url: "http://127.0.0.1:8795/kids",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
