import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:5174', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'sh ../scripts/start-e2e-api.sh',
      url: 'http://127.0.0.1:8001/api/health',
      timeout: 60_000,
      reuseExistingServer: false,
    },
    {
      command: 'API_PROXY_TARGET=http://127.0.0.1:8001 bun run dev --port 5174 --strictPort',
      url: 'http://localhost:5174',
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
})
