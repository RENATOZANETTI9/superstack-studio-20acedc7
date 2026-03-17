import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || 'https://id-preview--b0469be3-ad0e-4993-92f9-ef6c0bbd1e01.lovable.app',
  },
});
