// The airflow diagram card's layout in a real browser: with the automatic layout, no two labels overlap and none
// lies outside the card at 280, 320, 340, 360, 400 and 600 px in a light and a dark theme, the text stays at least
// 11 px high, and the compact layout switches at 340 px.
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { commands, page } from 'vitest/browser';
import '../../dev/ha-stubs';
import { CONFIGS, id, MockHass, type MockValues } from '../../dev/mock-hass';
import '../../src/cards/ventilation-card';
import { COMPACT_BELOW } from '../../src/diagram/labels';

const THEMES = {
  light: {
    '--card-background-color': '#ffffff',
    '--primary-text-color': '#212121',
    '--secondary-text-color': '#727272',
    '--divider-color': 'rgba(0, 0, 0, 0.12)',
    '--secondary-background-color': '#e5e5e5',
  },
  dark: {
    '--card-background-color': '#1c1c1c',
    '--primary-text-color': '#e1e1e1',
    '--secondary-text-color': '#9b9b9b',
    '--divider-color': 'rgba(225, 225, 225, 0.12)',
    '--secondary-background-color': '#282828',
  },
};

// Every label shown: the bypass half open with a planned change, long-ish values, a heating season.
const VALUES: MockValues = {
  temperature: { outdoor: -12.5, supply: 18.5, extract: 21.4, exhaust: -8.1 },
  humidity: { outdoor: 85, supply: 45, extract: 50, exhaust: 80 },
  flow: 180,
  bypass: 40,
  season: 'heating',
  unavailable: new Set(),
};

// A humid summer day at a high flow: the exchanger keeps out more than 1000 g/h, the widest realistic figure.
const KEPT_OUT: MockValues = {
  ...VALUES,
  temperature: { outdoor: 32, supply: 26, extract: 24, exhaust: 30 },
  humidity: { outdoor: 70, supply: 60, extract: 55, exhaust: 60 },
  flow: 300,
  bypass: 0,
};

const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

async function show(
  width: number,
  theme: keyof typeof THEMES,
  layout = 'auto',
  values = VALUES,
  extra: Record<string, unknown> = {},
) {
  const wrapper = document.createElement('div');
  wrapper.style.width = `${String(width)}px`;
  for (const [name, value] of Object.entries(THEMES[theme])) wrapper.style.setProperty(name, value);
  const card = document.createElement('hrv-ventilation-card');
  card.setConfig({ type: 'custom:hrv-ventilation-card', ...CONFIGS['full'], layout, ...extra });
  card.hass = new MockHass().build(values, theme === 'dark');
  wrapper.append(card);
  document.body.append(wrapper);
  // The ResizeObserver reports the width after layout; the card then renders the layout for it.
  await card.updateComplete;
  await frames();
  await card.updateComplete;
  const root = card.shadowRoot;
  if (!root) throw new Error('no shadow root');
  return { card, root, wrapper };
}

/** Changes the width of a shown card and waits for the card to lay out for it (the ResizeObserver reports it). */
async function resize({ card, wrapper }: Awaited<ReturnType<typeof show>>, width: number): Promise<void> {
  wrapper.style.width = `${String(width)}px`;
  await frames();
  await card.updateComplete;
}

/** The boxes of everything shown as text or icon, and of the arrowheads, which labels must not cover either. */
function shownBoxes(root: ShadowRoot): { name: string; box: DOMRect }[] {
  return [...root.querySelectorAll('.label:not(.hidden), .badge, ha-icon.season, svg .head')].map((element) => ({
    name: element.textContent.trim() || element.tagName,
    box: element.getBoundingClientRect(),
  }));
}

const middle = (rect: DOMRect): number => rect.top + rect.height / 2;

/** The box of the svg an icon draws (inside its shadow root), not of its host. */
function drawnIcon(icon: Element | null): DOMRect {
  const drawn = icon?.shadowRoot?.querySelector('svg')?.getBoundingClientRect();
  if (!drawn) throw new Error('no drawn icon');
  return drawn;
}

const overlap = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

beforeAll(async () => {
  await page.viewport(1000, 900);
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('airflow diagram layout', () => {
  for (const [theme, type] of [
    ['light', 'hrv'],
    ['dark', 'hrv'],
    // The moisture figure's place does not depend on the theme.
    ['light', 'erv'],
  ] as const) {
    for (const width of [280, 320, COMPACT_BELOW, 360, 400, 600]) {
      test(`${theme}, ${type}, ${String(width)} px: no labels overlap or leave the card, text at least 11 px`, async () => {
        const { root } = await show(width, theme, 'auto', VALUES, { exchanger_type: type });
        if (type === 'erv') expect(root.querySelector('.moisture-recovery .figure')).not.toBeNull();
        const boxes = shownBoxes(root);
        expect(boxes.length).toBeGreaterThan(width < COMPACT_BELOW ? 4 : 20);
        const card = root.querySelector('ha-card')?.getBoundingClientRect();
        if (!card) throw new Error('no ha-card');
        for (const { name, box } of boxes) {
          expect(box.left, name).toBeGreaterThanOrEqual(card.left);
          expect(box.right, name).toBeLessThanOrEqual(card.right);
          expect(box.top, name).toBeGreaterThanOrEqual(card.top);
          expect(box.bottom, name).toBeLessThanOrEqual(card.bottom);
        }
        const overlapping = boxes.flatMap((a, i) =>
          boxes.slice(i + 1).flatMap((b) => (overlap(a.box, b.box) ? [`${a.name} / ${b.name}`] : [])),
        );
        expect(overlapping).toEqual([]);
        for (const label of root.querySelectorAll('.label, .badge')) {
          expect(parseFloat(getComputedStyle(label).fontSize)).toBeGreaterThanOrEqual(11);
        }
      });
    }
  }

  test(`airflow-diagram-card "Phone width" and "Desktop width": compact below ${String(COMPACT_BELOW)} px, full from it`, async () => {
    const narrow = await show(COMPACT_BELOW - 1, 'light');
    expect(narrow.root.querySelector('.status')).toBeNull();
    expect(narrow.root.querySelectorAll('.corner .label')).toHaveLength(8);
    expect(narrow.root.querySelector('.top .power')).not.toBeNull();
    expect(narrow.root.querySelector('.top .rmot')).not.toBeNull();
    expect(narrow.root.querySelector('.top ha-icon.season')).not.toBeNull();
    document.body.innerHTML = '';
    const wide = await show(COMPACT_BELOW, 'light');
    expect(wide.root.querySelector('.status')).not.toBeNull();
    expect(wide.root.querySelectorAll('.corner .label')).toHaveLength(12);
  });

  test('power is centred on the card; each flow label sits above the tip of its arrow', async () => {
    for (const width of [320, 350, 400, 600]) {
      const { root } = await show(width, 'light');
      const box = (selector: string): DOMRect => {
        const element = root.querySelector(selector);
        if (!element) throw new Error(`no ${selector}`);
        return element.getBoundingClientRect();
      };
      const centre = (rect: DOMRect): number => rect.left + rect.width / 2;
      expect(Math.abs(centre(box('.top .power')) - centre(box('ha-card')))).toBeLessThan(1);
      if (width < COMPACT_BELOW) continue; // the compact layout has no flow labels or status grid
      // The status grid: centred on the card; both separators as wide as the corner stacks' outer edges.
      expect(Math.abs(centre(box('.status .cell:nth-child(2)')) - centre(box('ha-card')))).toBeLessThan(1);
      const [left, right] = [box('.corner.exhaust'), box('.corner.supply')];
      for (const row of ['.top', '.status']) {
        expect(box(row).left, row).toBeCloseTo(left.left, 0);
        expect(box(row).right, row).toBeCloseTo(right.right, 0);
      }
      const [supplyHead, exhaustHead] = [...root.querySelectorAll('svg .head')].map((h) => h.getBoundingClientRect());
      for (const [label, head] of [
        [box('.supply-flow .label'), supplyHead],
        [box('.exhaust-flow .label'), exhaustHead],
      ] as const) {
        if (!head) throw new Error('no arrowhead');
        expect(label.bottom).toBeLessThanOrEqual(head.top);
        expect(label.left < head.right && label.right > head.left).toBe(true);
      }
      document.body.innerHTML = '';
    }
  });

  test(`the layout follows a card that is resized across ${String(COMPACT_BELOW)} px`, async () => {
    const { card, root } = await show(600, 'light');
    expect(root.querySelector('.status')).not.toBeNull();
    card.parentElement?.style.setProperty('width', '300px');
    await frames();
    await card.updateComplete;
    expect(root.querySelector('.status')).toBeNull();
  });

  for (const width of [400, 600]) {
    test(`airflow-diagram-card "Icon centred on its text": every top row and status icon at ${String(width)} px`, async () => {
      const { root } = await show(width, 'light');
      const labels = [...root.querySelectorAll('.top .label:not(.hidden), .status .label:not(.hidden)')];
      expect(labels.length).toBeGreaterThan(8);
      for (const label of labels) {
        const icon = drawnIcon(label.querySelector('ha-icon'));
        const value = label.querySelector('.value')?.getBoundingClientRect();
        if (!value) throw new Error(`no value in ${label.className}`);
        expect(icon.height).toBeGreaterThan(10);
        expect(Math.abs(middle(icon) - middle(value)), label.className).toBeLessThanOrEqual(1);
      }
      // Across the top row: the season icon, power and RMOT on one line.
      const season = middle(drawnIcon(root.querySelector('.top ha-icon.season')));
      for (const selector of ['.top .power .value', '.top .rmot .value']) {
        const value = root.querySelector(selector)?.getBoundingClientRect();
        if (!value) throw new Error(`no ${selector}`);
        expect(Math.abs(middle(value) - season), selector).toBeLessThanOrEqual(1);
      }
    });
  }

  test('a status value too long for its cell ends in an ellipsis, with its full text in the tooltip', async () => {
    const { card, root } = await show(400, 'light');
    const hass = card.hass;
    if (!hass) throw new Error('no hass');
    const long = 'Manual override until the next scheduled change';
    const entity = hass.states[id.operatingMode];
    if (!entity) throw new Error('no operating mode');
    card.hass = { ...hass, states: { ...hass.states, [id.operatingMode]: { ...entity, state: long } } };
    await card.updateComplete;
    const label = root.querySelector<HTMLElement>('.status .label.operating_mode');
    const value = label?.querySelector<HTMLElement>('.value');
    const cell = label?.parentElement?.getBoundingClientRect();
    if (!label || !value || !cell) throw new Error('no operating mode label');
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    expect(getComputedStyle(value).textOverflow).toBe('ellipsis');
    expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(cell.right + 0.5);
    expect(label.getBoundingClientRect().left).toBeGreaterThanOrEqual(cell.left - 0.5);
    expect(label.title).toBe(`Operating mode: ${long}`);
  });

  test('airflow-diagram-card "Centred cells": the fan level and filter days share a horizontal centre', async () => {
    for (const width of [400, 600]) {
      const { root } = await show(width, 'light');
      const centre = (selector: string): number => {
        const rect = root.querySelector(selector)?.getBoundingClientRect();
        if (!rect) throw new Error(`no ${selector}`);
        return rect.left + rect.width / 2;
      };
      expect(Math.abs(centre('.status .label.level') - centre('.status .label.filter_days'))).toBeLessThanOrEqual(1);
      document.body.innerHTML = '';
    }
  });

  // Below the breakpoint, where layout: auto would be compact, so only the option can make it full.
  test('airflow-diagram-card "Forced full layout": all labels at 300 px', async () => {
    const { root } = await show(300, 'light', 'full');
    expect(root.querySelector('.status')).not.toBeNull();
    expect(root.querySelectorAll('.corner .label')).toHaveLength(12);
  });
});

/** A 2D canvas context: one for reading colours back, one for measuring text. */
function canvasContext(options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D {
  const found = document.createElement('canvas').getContext('2d', options);
  if (!found) throw new Error('no canvas');
  return found;
}
const context = canvasContext({ willReadFrequently: true });
const measuring = canvasContext();

/** A CSS colour as the browser computes it (rgb() or color(srgb ...)), as 0 to 255 channels, through a canvas. */
function channels(color: string): [number, number, number] {
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** The WCAG contrast ratio of two colours. */
function contrast(a: string, b: string): number {
  const luminance = (color: string): number => {
    const [r, g, b] = channels(color).map((channel) => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Whether a rectangle's outline (in screen px) touches one of the drawing's air streams, for the card in `root`. */
function streamCrossing(root: ShadowRoot): (rect: DOMRect) => boolean {
  const toDrawing = root.querySelector<SVGGraphicsElement>('svg .exchanger')?.getScreenCTM()?.inverse();
  if (!toDrawing) throw new Error('no exchanger');
  const streams = [...root.querySelectorAll<SVGPathElement>('svg .stream')];
  return (rect) => {
    for (let i = 0; i <= 10; i++) {
      for (const [x, y] of [
        [rect.left + (rect.width * i) / 10, rect.top],
        [rect.left + (rect.width * i) / 10, rect.bottom],
        [rect.left, rect.top + (rect.height * i) / 10],
        [rect.right, rect.top + (rect.height * i) / 10],
      ] as const) {
        const point = new DOMPoint(x, y).matrixTransform(toDrawing);
        if (streams.some((stream) => stream.isPointInStroke(point))) return true;
      }
    }
    return false;
  };
}

describe('exchanger type', () => {
  /** Whether a point on the screen lies in the exchanger's hexagon, not only in its bounding box. */
  const inExchanger = (root: ShadowRoot) => {
    const exchanger = root.querySelector<SVGPolygonElement>('svg .exchanger');
    const toDrawing = exchanger?.getScreenCTM()?.inverse();
    if (!exchanger || !toDrawing) throw new Error('no exchanger');
    return (x: number, y: number): boolean => exchanger.isPointInFill(new DOMPoint(x, y).matrixTransform(toDrawing));
  };
  const box = (root: ShadowRoot, selector: string): DOMRect => {
    const found = root.querySelector(selector)?.getBoundingClientRect();
    if (!found) throw new Error(`no ${selector}`);
    return found;
  };

  test('airflow-diagram-card "ERV at the narrowest width": bypass position, badge and figure inside the exchanger', async () => {
    const { root } = await show(280, 'light', 'auto', { ...VALUES, bypass: 50 }, { exchanger_type: 'erv' });
    const inside = inExchanger(root);
    const [bypass, badge, figure] = ['.bypass-position .label', '.saving .badge', '.moisture-recovery .figure'].map(
      (selector) => {
        const rect = box(root, selector);
        for (const [x, y] of [
          [rect.left, rect.top],
          [rect.right, rect.top],
          [rect.left, rect.bottom],
          [rect.right, rect.bottom],
        ] as const) {
          expect(inside(x, y), `${selector} corner ${String(x)}, ${String(y)}`).toBe(true);
        }
        return rect;
      },
    ) as [DOMRect, DOMRect, DOMRect];
    expect(root.querySelector('.moisture-recovery')?.textContent).toMatch(/^\s*\d{3}\sg\/h\s*$/);
    expect(overlap(bypass, badge)).toBe(false);
    expect(overlap(badge, figure)).toBe(false);
    expect(overlap(bypass, figure)).toBe(false);
  });

  test('a four-digit kept-out figure stays between the slanted sides, clear of the streams and the badge', async () => {
    // No smoothing: the humidity history of the other tests would average this day away.
    const shown = await show(280, 'light', 'auto', KEPT_OUT, { exchanger_type: 'erv', smoothing: 0 });
    const { root } = shown;
    for (const width of [280, 320, COMPACT_BELOW, 400, 600]) {
      await resize(shown, width);
      const text = box(root, '.moisture-recovery .value');
      expect(root.querySelector('.moisture-recovery')?.textContent).toMatch(/−\d,\d{3}/);
      // The text's middle row lies in the hexagon; only the empty corners of its line box may reach past the sides.
      const inside = inExchanger(root);
      const middle = text.top + text.height / 2;
      expect(inside(text.left, middle) && inside(text.right, middle), `${String(width)} px`).toBe(true);
      expect(streamCrossing(root)(text), `${String(width)} px`).toBe(false);
      expect(overlap(box(root, '.saving .badge'), text)).toBe(false);
    }
  });

  test('airflow-diagram-card "ERV on a phone": the compact layout shows the moisture figure', async () => {
    const { root } = await show(320, 'light', 'auto', VALUES, { exchanger_type: 'erv' });
    expect(root.querySelector('.status')).toBeNull();
    expect(root.querySelector('.moisture-recovery .figure')).not.toBeNull();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`airflow-diagram-card "ERV", ${theme}: a fill other than the HRV's, with text on it at 4.5:1 or more`, async () => {
      const fill = async (type: string): Promise<{ fill: string; text: string }> => {
        const { root } = await show(400, theme, 'auto', VALUES, { exchanger_type: type });
        const exchanger = root.querySelector('svg .exchanger');
        const label = root.querySelector('.bypass-position .label');
        if (!exchanger || !label) throw new Error('no exchanger or bypass label');
        const result = { fill: getComputedStyle(exchanger).fill, text: getComputedStyle(label).color };
        document.body.innerHTML = '';
        return result;
      };
      const [hrv, erv] = [await fill('hrv'), await fill('erv')];
      expect(channels(erv.fill)).not.toEqual(channels(hrv.fill));
      expect(contrast(erv.fill, erv.text)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('effectiveness rings', () => {
  const RINGS = { exchanger_type: 'erv', show_effectiveness: true, smoothing: 0 };

  /** The boxes of a node's text, one per text node (the browser's text boxes, not the label's line box). */
  const textNodes = (element: Element): { node: Node; box: DOMRect }[] => {
    const found: { node: Node; box: DOMRect }[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      found.push({ node, box: range.getBoundingClientRect() });
    }
    return found;
  };

  /**
   * The ink of an element's text, one box per glyph (and per icon), measured with a canvas in the element's font:
   * the empty corners of a line box, such as the space under "983 g/h" except for its "g", are not text, and a ring
   * may pass through them. The baseline is where a zero-size inline box, put after the text for a moment, lands.
   */
  function inkBoxes(element: Element): DOMRect[] {
    const boxes = [...element.querySelectorAll('ha-icon')].map(drawnIcon);
    for (const { node, box } of textNodes(element)) {
      measuring.font = getComputedStyle(node.parentElement as Element).font;
      const text = node.textContent ?? '';
      const probe = document.createElement('span');
      probe.style.cssText = 'display: inline-block; width: 0; height: 0';
      node.parentNode?.insertBefore(probe, node.nextSibling);
      const baseline = probe.getBoundingClientRect().bottom;
      probe.remove();
      for (let i = 0; i < text.length; i++) {
        const glyph = measuring.measureText(text.charAt(i));
        if (glyph.actualBoundingBoxRight + glyph.actualBoundingBoxLeft <= 0) continue; // a space
        const x = box.left + measuring.measureText(text.slice(0, i)).width;
        boxes.push(
          new DOMRect(
            x - glyph.actualBoundingBoxLeft,
            baseline - glyph.actualBoundingBoxAscent,
            glyph.actualBoundingBoxLeft + glyph.actualBoundingBoxRight,
            glyph.actualBoundingBoxAscent + glyph.actualBoundingBoxDescent,
          ),
        );
      }
    }
    return boxes;
  }

  /** A ring track sampled along its path, in screen px, with half its drawn stroke width. */
  interface Track {
    name: string;
    points: DOMPoint[];
    half: number;
  }

  /** The tracks (as long as their rings, whatever the figure), sampled once for every text measured against them. */
  function sampleTracks(root: ShadowRoot): Track[] {
    return [...root.querySelectorAll<SVGPathElement>('svg .ring-track')].map((track) => {
      const toScreen = track.getScreenCTM();
      if (!toScreen) throw new Error('no ring transform');
      const length = track.getTotalLength();
      return {
        name: track.getAttribute('class') ?? '',
        points: Array.from({ length: 601 }, (_, i) =>
          track.getPointAtLength((length * i) / 600).matrixTransform(toScreen),
        ),
        half: (parseFloat(track.getAttribute('stroke-width') ?? '0') / 2) * toScreen.a,
      };
    });
  }

  /**
   * The smallest gap, in screen px, between some boxes and the drawn stroke of a track: the distance from the boxes to
   * the sampled points, less half the stroke width, so a negative gap is a stroke over a box.
   */
  function clearance({ points, half }: Track, rects: DOMRect[]): number {
    let nearest = Infinity;
    for (const point of points) {
      for (const rect of rects) {
        const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
        const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
        nearest = Math.min(nearest, Math.hypot(dx, dy));
      }
    }
    return nearest - half;
  }

  /** The halo of a text: the colours and the largest reach of its text shadows, and their largest blur. */
  function haloOf(element: Element): { colors: string[]; radius: number; blur: number } {
    const shadows = [
      ...getComputedStyle(element).textShadow.matchAll(
        /(rgba?\([^)]*\)|color\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/g,
      ),
    ].map(([, color = '', x = '0', y = '0', blur = '0']) => ({
      color,
      radius: Math.hypot(parseFloat(x), parseFloat(y)),
      blur: parseFloat(blur),
    }));
    return {
      colors: shadows.map((shadow) => shadow.color),
      radius: Math.max(0, ...shadows.map((shadow) => shadow.radius)),
      blur: Math.max(0, ...shadows.map((shadow) => shadow.blur)),
    };
  }

  // The most, in px, by which the figure's halo may reach into a stream beside the glyphs' boxes (see the test).
  const STREAM_NOTCH = 1.5;
  const WIDTHS = [280, 320, COMPACT_BELOW, 360, 400, 500, 600];

  for (const theme of ['light', 'dark'] as const) {
    for (const [digits, values] of [
      ['three digits', VALUES],
      ['four digits', KEPT_OUT],
    ] as const) {
      test(`airflow-diagram-card "Text on the exchanger", ${theme}, ${digits}: the badge and bypass position keep 4.5:1 and no ring covers them, and the moisture figure has a halo, 280 to 600 px`, async () => {
        const shown = await show(WIDTHS[0] ?? 280, theme, 'auto', values, RINGS);
        const { root } = shown;
        // How far a ring reaches into the figure's glyphs, in px, over the widths; the halo has to cover it.
        let deepest = 0;
        let smallestHalo = Infinity;
        for (const width of WIDTHS) {
          await resize(shown, width);
          const where = `${theme} ${digits} ${String(width)} px`;
          // Both rings are drawn, so the test measures the rings as they are in use.
          expect(root.querySelectorAll('svg .ring-track.moisture, svg .ring-track.temperature'), where).toHaveLength(2);
          const exchanger = root.querySelector<SVGPolygonElement>('svg .exchanger');
          const badge = root.querySelector('.saving .badge');
          const bypass = root.querySelector('.bypass-position .label:not(.hidden)');
          const figure = root.querySelector('.moisture-recovery .figure');
          const value = figure?.querySelector('.value');
          if (!exchanger || !badge || !figure || !value) throw new Error(`a text is missing at ${where}`);
          if (digits === 'three digits') {
            expect(bypass, where).not.toBeNull();
            for (const ring of root.querySelectorAll('svg .ring')) {
              const length = parseFloat((ring.getAttribute('stroke-dasharray') ?? '0').split(' ')[0] ?? '0');
              expect(length, where).toBeGreaterThan(0);
            }
          } else {
            expect(figure.textContent, where).toMatch(/\d,\d{3}/);
          }
          // Each text measured once, each track sampled once.
          const tracks = sampleTracks(root);
          const ink = { badge: inkBoxes(badge), bypass: bypass ? inkBoxes(bypass) : [], figure: inkBoxes(figure) };
          for (const track of tracks) {
            for (const name of ['badge', 'bypass'] as const) {
              if (ink[name].length > 0)
                expect(clearance(track, ink[name]), `${name} / ${track.name}, ${where}`).toBeGreaterThan(0);
            }
            deepest = Math.max(deepest, -clearance(track, ink.figure));
          }
          // What is behind the text: the exchanger's fill for the bypass position and the figure, the badge's own fill.
          const fill = getComputedStyle(exchanger).fill;
          if (bypass) {
            expect(contrast(fill, getComputedStyle(bypass).color), `bypass, ${where}`).toBeGreaterThanOrEqual(4.5);
          }
          expect(contrast(fill, getComputedStyle(figure).color), `figure, ${where}`).toBeGreaterThanOrEqual(4.5);
          const badgeFill = getComputedStyle(badge, '::before').backgroundColor;
          expect(contrast(badgeFill, getComputedStyle(badge).color), `badge, ${where}`).toBeGreaterThanOrEqual(4.5);
          // The figure keeps its size, 11 px at least, and a halo in the exchanger's colour (solid text shadows, painted
          // behind the glyphs) masks a ring where it meets a glyph; the text keeps 4.5:1 against the halo as against
          // the fill.
          expect(parseFloat(getComputedStyle(value).fontSize), where).toBeGreaterThanOrEqual(11);
          const halo = haloOf(value);
          expect(halo.colors.length, where).toBeGreaterThan(0);
          expect(halo.blur, where).toBe(0);
          for (const color of halo.colors) {
            expect(channels(color), where).toEqual(channels(fill));
            expect(contrast(color, getComputedStyle(figure).color), `halo, ${where}`).toBeGreaterThanOrEqual(4.5);
          }
          smallestHalo = Math.min(smallestHalo, halo.radius);
          // The streams cross the badge, which hides them with its fill; they stay clear of the bypass position and
          // of the figure with its halo.
          const crossed = streamCrossing(root);
          for (const glyph of ink.bypass) expect(crossed(glyph), `bypass ${where}`).toBe(false);
          // The glyphs' boxes grown by the halo, less STREAM_NOTCH, stay clear of the streams: the boxes' corners are
          // empty and the halo is round, so it may notch a stream's edge there by that much and no more.
          const reach = halo.radius - STREAM_NOTCH;
          for (const glyph of ink.figure) {
            const grown = new DOMRect(
              glyph.left - reach,
              glyph.top - reach,
              glyph.width + 2 * reach,
              glyph.height + 2 * reach,
            );
            expect(crossed(grown), `figure halo ${where}`).toBe(false);
          }
        }
        expect(smallestHalo, `halo radius for ${digits}`).toBeGreaterThanOrEqual(deepest + 0.5);
      });
    }
  }

  test('without the rings the moisture figure has no halo', async () => {
    const { root } = await show(280, 'light', 'auto', VALUES, { exchanger_type: 'erv' });
    const value = root.querySelector('.moisture-recovery .figure .value');
    if (!value) throw new Error('no moisture figure');
    expect(getComputedStyle(value).textShadow).toBe('none');
  });

  test('airflow-diagram-card "Both layouts": the rings and their tracks are drawn at 320 px in the compact layout', async () => {
    const { root } = await show(320, 'light', 'auto', VALUES, RINGS);
    expect(root.querySelector('.status')).toBeNull();
    for (const selector of ['.ring.moisture', '.ring.temperature', '.ring-track.moisture', '.ring-track.temperature']) {
      const element = root.querySelector(`svg ${selector}`);
      if (!element) throw new Error(`no ${selector}`);
      const rect = element.getBoundingClientRect();
      expect(rect.width, selector).toBeGreaterThan(20);
      expect(rect.height, selector).toBeGreaterThan(40);
      expect(getComputedStyle(element).visibility, selector).toBe('visible');
    }
  });
});

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateReducedMotion: (reducedMotion: 'reduce' | 'no-preference' | null) => Promise<void>;
  }
}

describe('animated flow', () => {
  const running = (root: ShadowRoot): number =>
    [...root.querySelectorAll('.flow')].flatMap((overlay) => overlay.getAnimations()).length;

  // Each test sets the media feature itself, so the result does not depend on the machine's setting.
  afterEach(async () => {
    await commands.emulateReducedMotion(null);
  });

  test('the overlays animate by default', async () => {
    await commands.emulateReducedMotion('no-preference');
    const { root } = await show(600, 'light');
    expect(root.querySelectorAll('.flow').length).toBeGreaterThan(0);
    expect(running(root)).toBe(root.querySelectorAll('.flow').length);
  });

  test('airflow-diagram-card "Fans stopped": the supply overlays stand still, the exhaust overlay moves', async () => {
    await commands.emulateReducedMotion('no-preference');
    const { root } = await show(600, 'light', 'auto', { ...VALUES, flow: 0, exhaustFlow: 180 });
    const states = (selector: string) =>
      [...root.querySelectorAll(selector)].flatMap((overlay) => overlay.getAnimations().map((a) => a.playState));
    expect(states('.flow.supply-air')).toEqual(['paused', 'paused']);
    expect(states('.flow.exhaust-air')).toEqual(['running']);
  });

  test("a nominal flow sets each stream's animation duration", async () => {
    await commands.emulateReducedMotion('no-preference');
    const wrapper = await show(600, 'light', 'auto', { ...VALUES, exhaustFlow: 175 });
    wrapper.card.setConfig({
      type: 'custom:hrv-ventilation-card',
      ...CONFIGS['full'],
      animation: { nominal_flow: 360 },
    });
    await wrapper.card.updateComplete;
    const duration = (selector: string): string => {
      const overlay = wrapper.root.querySelector(selector);
      if (!overlay) throw new Error(`no ${selector}`);
      return getComputedStyle(overlay).animationDuration;
    };
    expect(duration('.flow.supply-air')).toBe('3s'); // 180 of 360 m³/h: half speed
    expect(duration('.flow.exhaust-air')).toBe(`${String(Math.round((1.5 / (175 / 360)) * 1000) / 1000)}s`);
  });

  test('airflow-diagram-card "Reduced motion": no overlay animates, the paths and the bypass split stay', async () => {
    await commands.emulateReducedMotion('reduce');
    const { root } = await show(600, 'light');
    expect(running(root)).toBe(0);
    expect(root.querySelector('.stream.bypass')?.getAttribute('opacity')).toBe('0.4');
    expect(root.querySelector('.stream.supply')?.getAttribute('opacity')).toBe('0.6');
    expect(root.querySelectorAll('.flow')).toHaveLength(3);
  });
});
