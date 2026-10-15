import { playwright } from '@vitest/browser-playwright';
import type { CDPSession, Page } from 'playwright';
import { defineConfig } from 'vitest/config';

/** One CDP session per page under test, for the device pixel ratio command. */
const cdpSessions = new WeakMap<Page, CDPSession>();

// Always builds into build/ (git-ignored, never deployed). `npm run release` then copies the checked build to
// dist/ with scripts/check-release.mjs; do not build into dist/ directly.
export default defineConfig({
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'hrv-ventilation-card.js',
    },
    // One self-contained file: dynamic imports (for example a lazily loaded editor) are inlined, not split into
    // chunks that the release step would not copy.
    rolldownOptions: { output: { codeSplitting: false } },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['test/**/*.test.ts'],
          exclude: ['test/**/*.browser.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            commands: {
              // Sets the reduced-motion media feature of the page under test; null removes the override.
              emulateReducedMotion: async ({ page }, reducedMotion: 'reduce' | 'no-preference' | null) => {
                await page.emulateMedia({ reducedMotion });
              },
              // Sets the device pixel ratio of the page under test (Chromium only), keeping its size; null resets it.
              // The CDP session stays attached: Chromium drops its emulation when the session detaches.
              emulateDevicePixelRatio: async ({ page }, ratio: number | null) => {
                let session = cdpSessions.get(page);
                if (!session) {
                  session = await page.context().newCDPSession(page);
                  cdpSessions.set(page, session);
                }
                await (ratio === null
                  ? session.send('Emulation.clearDeviceMetricsOverride')
                  : session.send('Emulation.setDeviceMetricsOverride', {
                      width: 0,
                      height: 0,
                      deviceScaleFactor: ratio,
                      mobile: false,
                    }));
              },
            },
          },
        },
      },
    ],
  },
});
