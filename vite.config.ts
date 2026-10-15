import { playwright } from '@vitest/browser-playwright';
import type { CDPSession, Page } from 'playwright';
import { defineConfig } from 'vitest/config';

/** Per page under test, for the device pixel ratio command: its CDP session and its own ratio. */
const emulations = new WeakMap<Page, { session: CDPSession; ratio: number }>();

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
              // Chromium drops a CDP session's emulation when it detaches, so the session stays attached. Playwright
              // emulates the viewport through the same override, so it keeps the viewport's size, and a reset restores
              // the page's own ratio (clearing the override would drop Playwright's viewport too).
              emulateDevicePixelRatio: async ({ page }, ratio: number | null) => {
                let emulation = emulations.get(page);
                if (!emulation) {
                  emulation = {
                    session: await page.context().newCDPSession(page),
                    ratio: await page.evaluate('window.devicePixelRatio'),
                  };
                  emulations.set(page, emulation);
                }
                const size = page.viewportSize();
                if (!size) throw new Error('the page has no emulated viewport');
                await emulation.session.send('Emulation.setDeviceMetricsOverride', {
                  width: size.width,
                  height: size.height,
                  deviceScaleFactor: ratio ?? emulation.ratio,
                  mobile: false,
                });
              },
            },
          },
        },
      },
    ],
  },
});
