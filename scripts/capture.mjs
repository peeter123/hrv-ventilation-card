// `npm run capture`: takes the README images of the three cards from the preview page (dev/, mock states, so no
// installation identifiers can be in view) into docs/images/: the diagram in light, dark, compact, ERV (plain and with
// the effectiveness rings) and in frost (pre-heater coil glowing), the bypass GIF, the recovery bar and the moisture
// bar. The air shown must be physically possible: the supply and exhaust temperature and absolute humidity lie between
// the exchanger's inlet (the outdoor air, after the pre-heater when it runs) and the extract air. The stills and the
// GIF's endpoints are checked, and the script fails otherwise. It starts its own Vite server, drives the page's
// controls with Playwright and encodes the animated GIF in Node, so it needs no system tools. The visual editor
// (editor.png) and the card picker preview are taken from a live installation by hand (see README.md, "Development").
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
/** The GIF's off-season day, as the preview's "bypass 50 % (off season)" scenario sets it: outdoor and extract air. */
const DAY = { outdoor: { t: 16, rh: 70 }, extract: { t: 23, rh: 50 } };
/**
 * The supply and exhaust air of that day with the bypass closed and fully open; in between they move in proportion.
 * Closed: an enthalpy exchanger of about 85 % sensible and 60 % moisture effectiveness. Open: the supply air
 * bypasses the exchanger and is warmed half a degree by the fan; the exhaust air no longer exchanges with the outdoor
 * air, so it leaves almost as warm as the extract air, never warmer.
 */
const AIR = {
  supply: { closed: { t: 22, rh: 51 }, open: { t: 16.5, rh: 68 } },
  exhaust: { closed: { t: 17, rh: 68 }, open: { t: 22.8, rh: 50 } },
};
/** Volumetric heat capacity of air in Wh/(m³ K), to find the temperature rise of the pre-heater. */
const AIR_HEAT_CAPACITY = 0.335;
const GIF_LIMIT = 3 * 1024 * 1024;

mkdirSync(OUT, { recursive: true });
const server = await createServer({ logLevel: 'warn', server: { port: 5300, strictPort: false } });
await server.listen();
const base = server.resolvedUrls?.local[0];
if (!base) throw new Error('the Vite server did not report a URL');

const { absoluteHumidity } = await server.ssrLoadModule('/src/calc/humidity.ts');

/**
 * Throws unless the supply and exhaust air lie between the exchanger's inlet and the extract air in temperature and
 * in absolute humidity (either orientation: heating or cooling). The inlet is the outdoor air, warmed by the
 * pre-heater when it runs (power / (flow x heat capacity); heating leaves the absolute humidity alone). Returns the
 * line for the log. @param {string} label
 * @param {Record<'outdoor' | 'supply' | 'extract' | 'exhaust', { t: number; rh: number }>} air
 * @param {{ power: number; flow: number }} [preHeater] the pre-heater's power in W and the flow in m³/h
 */
const checkPhysical = (label, air, preHeater) => {
  for (const [stream, { t, rh }] of Object.entries(air)) {
    if (!Number.isFinite(t) || !Number.isFinite(rh)) {
      throw new Error(`${label}: ${stream} is ${String(t)} C / ${String(rh)} %`);
    }
  }
  const rise = preHeater && preHeater.power > 0 ? preHeater.power / (preHeater.flow * AIR_HEAT_CAPACITY) : 0;
  const ends = {
    T: { unit: 'C', from: air.outdoor.t + rise, to: air.extract.t, of: (/** @type {{ t: number }} */ a) => a.t },
    AH: {
      unit: 'g/m3',
      from: absoluteHumidity(air.outdoor.t, air.outdoor.rh),
      to: absoluteHumidity(air.extract.t, air.extract.rh),
      of: (/** @type {{ t: number; rh: number }} */ a) => absoluteHumidity(a.t, a.rh),
    },
  };
  /** @type {string[]} */
  const parts = [];
  for (const [quantity, { unit, from, to, of }] of Object.entries(ends)) {
    const min = Math.min(from, to);
    const max = Math.max(from, to);
    for (const stream of /** @type {const} */ (['supply', 'exhaust'])) {
      const value = of(air[stream]);
      const order = `${min.toFixed(2)} <= ${value.toFixed(2)} <= ${max.toFixed(2)} ${unit}`;
      if (!(value >= min && value <= max)) throw new Error(`${label}: ${stream} ${quantity} breaks ${order}`);
      parts.push(`${stream} ${quantity} ${order}`);
    }
  }
  const inlet = rise
    ? `inlet ${(air.outdoor.t + rise).toFixed(2)} C (outdoor + ${rise.toFixed(2)} K pre-heater); `
    : '';
  return `check: ${label}: ${inlet}${parts.join('; ')}: ok`;
};

// The GIF's frames move linearly between the closed and the open endpoints, so checking both covers every frame.
for (const position of /** @type {const} */ (['closed', 'open'])) {
  console.log(
    checkPhysical(`GIF bypass ${position}`, { ...DAY, supply: AIR.supply[position], exhaust: AIR.exhaust[position] }),
  );
}

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
  /** @param {string} stream @param {'T' | 'RH'} field */
  const inputOf = (stream, field) =>
    page
      .locator('fieldset')
      .filter({ has: page.locator('legend', { hasText: new RegExp(`^${stream}$`) }) })
      .getByLabel(field, { exact: true });
  /** @param {string} name @param {import('playwright').Locator} card */
  const still = async (name, card) => {
    await card.screenshot({ path: join(OUT, name), animations: 'disabled' });
    console.log(`capture: ${name}`);
  };

  /** Reads the air, flow and pre-heater power the preview page shows now and checks them. @param {string} label */
  const checkScene = async (label) => {
    /** @param {string} stream @param {'T' | 'RH'} field */
    const read = async (stream, field) => {
      const raw = await inputOf(stream, field).inputValue();
      const value = raw.trim() === '' ? Number.NaN : Number(raw);
      if (!Number.isFinite(value)) throw new Error(`the ${stream} ${field} input holds "${raw}", not a number`);
      return value;
    };
    /** @param {RegExp} name */
    const slider = async (name) => Number(await page.locator('label', { hasText: name }).locator('input').inputValue());
    const air = /** @type {Record<'outdoor' | 'supply' | 'extract' | 'exhaust', { t: number; rh: number }>} */ ({});
    for (const stream of /** @type {const} */ (['outdoor', 'supply', 'extract', 'exhaust'])) {
      air[stream] = { t: await read(stream, 'T'), rh: await read(stream, 'RH') };
    }
    console.log(checkPhysical(label, air, { power: await slider(/^power W/), flow: await slider(/^flow/) }));
  };

  await scenario('heating (winter)');
  await checkScene('heating (winter)');
  await still('diagram-light.png', diagram('light', WIDTH_FULL));
  await still('diagram-dark.png', diagram('dark', WIDTH_FULL));
  await still('diagram-compact.png', diagram('light', WIDTH_COMPACT));

  // The ERV drawing: the same winter day on an energy recovery unit, then back to the default for the GIF.
  const exchanger = page.locator('label', { hasText: 'exchanger' }).locator('select');
  await exchanger.selectOption('erv');
  await page.waitForTimeout(300);
  await still('diagram-erv.png', diagram('light', WIDTH_FULL));
  // The same unit with the effectiveness rings on the exchanger outline.
  const rings = page.getByLabel('show effectiveness');
  await rings.check();
  await page.waitForTimeout(300);
  await still('diagram-erv-rings.png', diagram('light', WIDTH_FULL));
  await rings.uncheck();
  await exchanger.selectOption('hrv');

  // Frost: the pre-heater (a power sensor, rated 1000 W) runs at 600 W, the coil glows and its power is in the top row.
  const preHeaterKind = page.locator('label', { hasText: /^kind/ }).locator('select');
  const preHeaterMax = page.getByLabel('max W (0 = none)');
  await preHeaterKind.selectOption('power sensor');
  await preHeaterMax.fill('1000');
  await scenario('frost (pre-heater on)');
  await checkScene('frost (pre-heater on)');
  await still('diagram-frost.png', diagram('light', WIDTH_FULL));
  await preHeaterKind.selectOption('none');
  await preHeaterMax.fill('0');
  await scenario('heating (winter)'); // the scenario button waits for the cards to redraw

  // The bar cards: the heating scenario (the most used mode) is still on for the recovery bar; a drying house with
  // the bypass open for the moisture bar.
  await still('recovery-bar.png', bar('hrv-recovery-balance-card', WIDTH_BAR));
  await scenario('bypass 50 % (off season)');
  await still('moisture-bar.png', bar('hrv-moisture-balance-card', WIDTH_WIDE));

  // The hero GIF: an off-season day (the scenario above) with the bypass opening from 0 to 100 % and closing again,
  // the air moving and the supply and exhaust air following the bypass.
  const bypass = page.locator('label', { hasText: 'bypass %' }).locator('input');
  /** Sets the bypass and the supply and exhaust air that go with it. @param {number} position */
  const setBypass = async (position) => {
    const share = position / 100;
    for (const stream of /** @type {const} */ (['supply', 'exhaust'])) {
      const { closed, open } = AIR[stream];
      await inputOf(stream, 'T').fill((closed.t + (open.t - closed.t) * share).toFixed(1));
      await inputOf(stream, 'RH').fill(String(Math.round(closed.rh + (open.rh - closed.rh) * share)));
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
