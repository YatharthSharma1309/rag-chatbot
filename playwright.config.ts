import { defineConfig, devices } from "@playwright/test";

/** Dedicated port so a separate `npm run dev` on :3000 cannot serve a stale bundle to E2E. */
const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? "4173";
const PLAYWRIGHT_ORIGIN = `http://127.0.0.1:${PLAYWRIGHT_PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? PLAYWRIGHT_ORIGIN,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npx next dev -p ${PLAYWRIGHT_PORT}`,
        url: PLAYWRIGHT_ORIGIN,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
