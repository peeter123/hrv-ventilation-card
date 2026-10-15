// `npm run capture`: takes the README images of the three cards from the preview page (dev/, mock states, so no
// installation identifiers can be in view) into docs/images/: the diagram in light, dark, compact and ERV, the bypass
// GIF, the recovery bar and the moisture bar. It starts its own Vite server, drives the page's controls with
// Playwright and encodes the animated GIF in Node, so it needs no system tools. The visual editor (editor.png) and the
// card picker preview are taken from a live installation by hand (see README.md, "Development").
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import gifenc from 'gifenc';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { createServer } from 'vite';

// gifenc is CommonJS without named ESM exports.
const { GIFEncoder, applyPalette, quantize } = gifenc;

const OUT = fileURLToPath(new URL('../docs/images/', import.meta.url));
/** Card widths of the captures, as the preview page labels its slots: full layout, and compact (below 340 px). */
const WIDTH_FULL = 400;
const WIDTH_COMPACT = 320;
/** Widths of the recovery bar and the moisture bar captures. */
const WIDTH_BAR = 350;
const WIDTH_WIDE = 600;
/** Pixel ratio of the captures, so text stays sharp on high-density screens. */
const SCALE = 2;
/** The GIF: bypass positions of the sweep, and the frames held at each end. */
const SWEEP = Array.from({ length: 21 }, (_, i) => i * 5);
const HOLD = 6;
/**
 * The supply and exhaust air of the GIF's off-season day (outdoor 16 °C / 70 %, indoor 23 °C / 50 %) with the bypass
 * closed and fully open; in between they move in proportion. Closed: an enthalpy exchanger of about 85 % sensible and
 * 60 % moisture effectiveness. Open: the air passes the exchanger, warmed half a degree by the fans.
 */
const AIR = {
  supply: { closed: { t: 22, rh: 51 }, open: { t: 16.5, rh: 68 } },
  exhaust: { closed: { t: 17, rh: 68 }, open: { t: 23.3, rh: 49 } },
};
const GIF_LIMIT = 3 * 1024 * 1024;

mkdirSync(OUT, { recursive: true });
const server = await createServer({ logLevel: 'warn', server: { port: 5300, strictPort: false } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error('the Vite server did not report a URL');

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: SCALE });
  await page.goto(new URL('dev/index.html', base).href);
  /** @param {'light' | 'dark'} theme @param {number} width the slot's card width, from its "<width> px" label */
  const diagram = (theme, width) =>
    page
      .locator(`.theme.${theme} .slot`)
      .filter({ has: page.locator('span', { hasText: new RegExp(`^${String(width)} px$`) }) })
      .locator('hrv-ventilation-card');
  /** A bar card of the light theme's real-config slot (not a sample slot) of the given width. @param {string} tag @param {number} width */
  const bar = (tag, width) =>
    page
      .locator('.theme.light .slot')
      .filter({ has: page.locator('span', { hasText: new RegExp(`^${String(width)} px$`) }) })
      .locator(tag);
  await diagram('light', WIDTH_FULL).waitFor();
  /** @param {string} name */
  const scenario = async (name) => {
    await page.getByRole('button', { name }).click();
    await page.waitForTimeout(300);
  };
  /** @param {string} name @param {import('playwright').Locator} card */
  const still = async (name, card) => {
    await card.screenshot({ path: join(OUT, name), animations: 'disabled' });
    console.log(`capture: ${name}`);
  };

  await scenario('heating (winter)');
  await still('diagram-light.png', diagram('light', WIDTH_FULL));
  await still('diagram-dark.png', diagram('dark', WIDTH_FULL));
  await still('diagram-compact.png', diagram('light', WIDTH_COMPACT));

  // The ERV drawing: the same winter day on an energy recovery unit, then back to the default for the GIF.
  const exchanger = page.locator('label', { hasText: 'exchanger' }).locator('select');
  await exchanger.selectOption('erv');
  await page.waitForTimeout(300);
  await still('diagram-erv.png', diagram('light', WIDTH_FULL));
  await exchanger.selectOption('hrv');

  // The bar cards: free cooling for the recovery bar, a drying house with the bypass open for the moisture bar.
  await scenario('bypass 100 % (night cooling)');
  await still('recovery-bar.png', bar('hrv-recovery-balance-card', WIDTH_BAR));
  await scenario('bypass 50 % (off season)');
  await still('moisture-bar.png', bar('hrv-moisture-balance-card', WIDTH_WIDE));

  // The hero GIF: an off-season day with the bypass opening from 0 to 100 % and closing again, the air moving and
  // the supply and exhaust air following the bypass.
  await scenario('bypass 50 % (off season)');
  const bypass = page.locator('label', { hasText: 'bypass %' }).locator('input');
  /** @param {'supply' | 'exhaust'} stream @param {'T' | 'RH'} field */
  const input = (stream, field) =>
    page
      .locator('fieldset')
      .filter({ has: page.locator('legend', { hasText: new RegExp(`^${stream}$`) }) })
      .getByLabel(field, { exact: true });
  /** Sets the bypass and the supply and exhaust air that go with it. @param {number} position */
  const setBypass = async (position) => {
    const share = position / 100;
    for (const stream of /** @type {const} */ (['supply', 'exhaust'])) {
      const { closed, open } = AIR[stream];
      await input(stream, 'T').fill((closed.t + (open.t - closed.t) * share).toFixed(1));
      await input(stream, 'RH').fill(String(Math.round(closed.rh + (open.rh - closed.rh) * share)));
    }
    await bypass.fill(String(position));
  };
  const card = diagram('light', WIDTH_FULL);
  const positions = [
    ...Array.from({ length: HOLD }, () => 0),
    ...SWEEP,
    ...Array.from({ length: HOLD }, () => 100),
    ...SWEEP.toReversed(),
  ];
  /** @type {{ png: Buffer; at: number }[]} */
  const frames = [];
  for (const position of positions) {
    await setBypass(position);
    frames.push({ png: await card.screenshot(), at: Date.now() });
  }

  const gif = GIFEncoder();
  frames.forEach(({ png, at }, i) => {
    const { width, height, data } = PNG.sync.read(png);
    const rgba = new Uint8Array(data.buffer, data.byteOffset, data.length);
    // 255 quantized colours plus exact white. applyPalette matches colours reduced to RGB565, where white lies
    // nearer a light blue of the drawing than the white entry, so white pixels are mapped to it here.
    const palette = [...quantize(rgba, 255), [255, 255, 255]];
    const white = palette.length - 1;
    const indexed = applyPalette(rgba, palette);
    for (let p = 0; p < indexed.length; p++) {
      if (rgba[p * 4] === 255 && rgba[p * 4 + 1] === 255 && rgba[p * 4 + 2] === 255) indexed[p] = white;
    }
    // Each frame lasts as long as it took to capture, so the moving air keeps its real speed.
    const next = frames[i + 1]?.at ?? at + 100;
    gif.writeFrame(indexed, width, height, { palette, delay: next - at });
  });
  gif.finish();
  const bytes = gif.bytes();
  const size = `${(bytes.length / 1024 / 1024).toFixed(2)} MB`;
  // Checked before writing, so an oversize GIF never replaces the one in the repo.
  if (bytes.length > GIF_LIMIT) throw new Error(`the GIF is ${size}, over 3 MB; lower SCALE or the number of frames`);
  writeFileSync(join(OUT, 'diagram-bypass.gif'), bytes);
  console.log(`capture: diagram-bypass.gif, ${String(frames.length)} frames, ${size}`);
} finally {
  await browser.close();
  await server.close();
}
