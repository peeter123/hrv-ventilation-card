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

/** The element a selector finds in a card's shadow root; throws when there is none. */
const element = (root: ShadowRoot, selector: string): Element => {
  const found = root.querySelector(selector);
  if (!found) throw new Error(`no ${selector}`);
  return found;
};

const box = (root: ShadowRoot, selector: string): DOMRect => element(root, selector).getBoundingClientRect();

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
    test(`${theme}, ${type}: no labels overlap or leave the card, text at least 11 px, 280 to 600 px`, async () => {
      const shown = await show(280, theme, 'auto', VALUES, { exchanger_type: type });
      const { root } = shown;
      for (const width of [280, 320, COMPACT_BELOW, 360, 400, 600]) {
        await resize(shown, width);
        const where = `${String(width)} px`;
        if (type === 'erv') expect(root.querySelector('.moisture-recovery .figure'), where).not.toBeNull();
        const boxes = shownBoxes(root);
        expect(boxes.length, where).toBeGreaterThan(width < COMPACT_BELOW ? 4 : 20);
        const card = box(root, 'ha-card');
        for (const { name, box: rect } of boxes) {
          expect(rect.left, `${where} ${name}`).toBeGreaterThanOrEqual(card.left);
          expect(rect.right, `${where} ${name}`).toBeLessThanOrEqual(card.right);
          expect(rect.top, `${where} ${name}`).toBeGreaterThanOrEqual(card.top);
          expect(rect.bottom, `${where} ${name}`).toBeLessThanOrEqual(card.bottom);
        }
        const overlapping = boxes.flatMap((a, i) =>
          boxes.slice(i + 1).flatMap((b) => (overlap(a.box, b.box) ? [`${a.name} / ${b.name}`] : [])),
        );
        expect(overlapping, where).toEqual([]);
        for (const label of root.querySelectorAll('.label, .badge')) {
          expect(parseFloat(getComputedStyle(label).fontSize), where).toBeGreaterThanOrEqual(11);
        }
      }
    });
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

  test('power is centred on the card; each flow label sits below the tip of its arrow', async () => {
    for (const width of [320, 350, 400, 600]) {
      const { root } = await show(width, 'light');
      const centre = (rect: DOMRect): number => rect.left + rect.width / 2;
      expect(Math.abs(centre(box(root, '.top .power')) - centre(box(root, 'ha-card')))).toBeLessThan(1);
      if (width < COMPACT_BELOW) continue; // the compact layout has no flow labels or status grid
      // The status grid: centred on the card; both separators as wide as the corner stacks' outer edges.
      expect(Math.abs(centre(box(root, '.status .cell:nth-child(2)')) - centre(box(root, 'ha-card')))).toBeLessThan(1);
      const [left, right] = [box(root, '.corner.exhaust'), box(root, '.corner.supply')];
      for (const row of ['.top', '.status']) {
        expect(box(root, row).left, row).toBeCloseTo(left.left, 0);
        expect(box(root, row).right, row).toBeCloseTo(right.right, 0);
      }
      const [supplyHead, exhaustHead] = [...root.querySelectorAll('svg .head')].map((h) => h.getBoundingClientRect());
      for (const [label, head] of [
        [box(root, '.supply-flow .label'), supplyHead],
        [box(root, '.exhaust-flow .label'), exhaustHead],
      ] as const) {
        if (!head) throw new Error('no arrowhead');
        expect(label.top).toBeGreaterThanOrEqual(head.bottom);
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
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
  if (a !== 255) throw new Error(`colour is not opaque: ${color}`);
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

describe('exchanger type', () => {
  /** Whether a point on the screen lies in the exchanger's hexagon, not only in its bounding box. */
  const inExchanger = (root: ShadowRoot) => {
    const exchanger = root.querySelector<SVGPolygonElement>('svg .exchanger');
    const toDrawing = exchanger?.getScreenCTM()?.inverse();
    if (!exchanger || !toDrawing) throw new Error('no exchanger');
    return (x: number, y: number): boolean => exchanger.isPointInFill(new DOMPoint(x, y).matrixTransform(toDrawing));
  };
  /** The screen x of the exchanger's right vertex and of the house symbol's left edge, the figure's room. */
  const figureRoom = (root: ShadowRoot): { left: number; right: number } => {
    const exchanger = box(root, 'svg .exchanger');
    const house = root.querySelectorAll('svg .symbol circle')[1]?.getBoundingClientRect();
    if (!house) throw new Error('no house symbol');
    return { left: exchanger.right, right: house.left };
  };

  test('airflow-diagram-card "ERV at the narrowest width": bypass position and badge inside the exchanger, the figure right of it', async () => {
    const { root } = await show(280, 'light', 'auto', { ...VALUES, bypass: 50 }, { exchanger_type: 'erv' });
    const inside = inExchanger(root);
    const [bypass, badge] = ['.bypass-position .label', '.saving .badge'].map((selector) => {
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
    }) as [DOMRect, DOMRect];
    const figure = box(root, '.moisture-recovery .figure');
    const room = figureRoom(root);
    expect(figure.left).toBeGreaterThan(room.left);
    expect(figure.right).toBeLessThan(room.right);
    expect(streamCrossing(root)(figure)).toBe(false);
    expect(root.querySelector('.moisture-recovery')?.textContent).toMatch(/^\s*\d{3}g\/h\s*$/);
    expect(overlap(bypass, badge)).toBe(false);
    expect(overlap(badge, figure)).toBe(false);
    expect(overlap(bypass, figure)).toBe(false);
  });

  const FIGURE_WIDTHS = [280, 320, COMPACT_BELOW, 360, 400, 401, 450, 500, 600];

  for (const layout of ['full', 'compact'] as const) {
    for (const [digits, values, pattern] of [
      ['three digits', VALUES, /^\d{3}$/],
      ['four digits', KEPT_OUT, /^\d,\d{3}$/],
    ] as const) {
      test(`airflow-diagram-card "Four-digit rate on a narrow card", ${layout} layout, ${digits}: the moisture figure is clear of the exchanger, the house symbol, the streams and the corner stacks, 280 to 600 px`, async () => {
        // No smoothing: the humidity history of the other tests would average this day away.
        const shown = await show(280, 'light', layout, values, { exchanger_type: 'erv', smoothing: 0 });
        const { root } = shown;
        for (const width of FIGURE_WIDTHS) {
          await resize(shown, width);
          const where = `${layout} ${digits} ${String(width)} px`;
          const figure = box(root, '.moisture-recovery .figure');
          const number = box(root, '.moisture-recovery .number');
          const unit = box(root, '.moisture-recovery .unit');
          expect(root.querySelector('.moisture-recovery .number')?.textContent, where).toMatch(pattern);
          expect(root.querySelector('.moisture-recovery')?.textContent, where).not.toContain('−');
          const room = figureRoom(root);
          expect(figure.left, where).toBeGreaterThan(room.left);
          expect(figure.right, where).toBeLessThan(room.right);
          expect(streamCrossing(root)(figure), where).toBe(false);
          expect(overlap(box(root, '.saving .badge'), figure), where).toBe(false);
          for (const corner of root.querySelectorAll('.corner .label:not(.hidden)'))
            expect(overlap(corner.getBoundingClientRect(), figure), `${where} ${corner.textContent}`).toBe(false);
          const value = root.querySelector('.moisture-recovery .value');
          const unitElement = root.querySelector('.moisture-recovery .unit');
          if (!value || !unitElement) throw new Error('no figure value');
          expect(parseFloat(getComputedStyle(value).fontSize), where).toBeGreaterThanOrEqual(11);
          // Never clipped or ellipsized: the label's rule for long values (overflow hidden) must not reach the figure.
          expect(getComputedStyle(value).overflow, where).toBe('visible');
          expect(value.scrollWidth, where).toBeLessThanOrEqual(value.clientWidth);
          // The unit under the number at a container width of 400 px or less, on the number's line above it.
          if (width <= 400) {
            expect(unit.top, where).toBeGreaterThanOrEqual(number.bottom - 0.5);
            expect(Math.abs(unit.left + unit.width / 2 - (number.left + number.width / 2)), where).toBeLessThan(
              number.width,
            );
            expect(getComputedStyle(unitElement).marginLeft, where).toBe('0px');
          } else {
            expect(unit.left, where).toBeGreaterThan(number.right + 1);
            expect(Math.abs(middle(unit) - middle(number)), where).toBeLessThan(2);
          }
        }
      });
    }
  }

  test('airflow-diagram-card "Four-digit rate on a narrow card": the two-line form fits the wedge at 280 px', async () => {
    const { root } = await show(280, 'light', 'full', KEPT_OUT, { exchanger_type: 'erv', smoothing: 0 });
    const number = box(root, '.moisture-recovery .number');
    const unit = box(root, '.moisture-recovery .unit');
    expect(unit.top).toBeGreaterThanOrEqual(number.bottom - 0.5);
    // Both lines together, and the icon, between the exhaust stream above and the supply stream below.
    const left = Math.min(number.left, unit.left);
    const text = new DOMRect(left, number.top, Math.max(number.right, unit.right) - left, unit.bottom - number.top);
    expect(streamCrossing(root)(text)).toBe(false);
    expect(streamCrossing(root)(box(root, '.moisture-recovery .figure'))).toBe(false);
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

  const WIDTHS = [280, 320, COMPACT_BELOW, 360, 400, 500, 600];

  for (const theme of ['light', 'dark'] as const) {
    for (const [digits, values] of [
      ['three digits', VALUES],
      ['four digits', KEPT_OUT],
    ] as const) {
      test(`airflow-diagram-card "Text on the exchanger", ${theme}, ${digits}: the badge and bypass position keep 4.5:1 and no ring covers them, 280 to 600 px`, async () => {
        const shown = await show(WIDTHS[0] ?? 280, theme, 'auto', values, RINGS);
        const { root } = shown;
        for (const width of WIDTHS) {
          await resize(shown, width);
          const where = `${theme} ${digits} ${String(width)} px`;
          // Both rings are drawn, so the test measures the rings as they are in use.
          expect(root.querySelectorAll('svg .ring-track.total'), where).toHaveLength(1);
          const exchanger = root.querySelector<SVGPolygonElement>('svg .exchanger');
          const badge = root.querySelector('.saving .badge');
          const bypass = root.querySelector('.bypass-position .label:not(.hidden)');
          const figure = root.querySelector('.moisture-recovery .figure');
          if (!exchanger || !badge || !figure) throw new Error(`a text is missing at ${where}`);
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
          const ink = { badge: inkBoxes(badge), bypass: bypass ? inkBoxes(bypass) : [] };
          for (const track of tracks) {
            for (const name of ['badge', 'bypass'] as const) {
              if (ink[name].length > 0)
                expect(clearance(track, ink[name]), `${name} / ${track.name}, ${where}`).toBeGreaterThan(0);
            }
          }
          // What is behind the text: the exchanger's fill for the bypass position, the badge's own fill.
          const fill = getComputedStyle(exchanger).fill;
          if (bypass) {
            expect(contrast(fill, getComputedStyle(bypass).color), `bypass, ${where}`).toBeGreaterThanOrEqual(4.5);
          }
          const badgeFill = getComputedStyle(badge, '::before').backgroundColor;
          expect(contrast(badgeFill, getComputedStyle(badge).color), `badge, ${where}`).toBeGreaterThanOrEqual(4.5);
          // The figure keeps its size, 11 px at least; it sits right of the exchanger, clear of the rings.
          expect(parseFloat(getComputedStyle(figure).fontSize), where).toBeGreaterThanOrEqual(11);
          // The streams cross the badge, which hides them with its fill; they stay clear of the bypass position.
          const crossed = streamCrossing(root);
          for (const glyph of ink.bypass) expect(crossed(glyph), `bypass ${where}`).toBe(false);
        }
      });
    }
  }

  test('airflow-diagram-card "Both layouts": the rings and their tracks are drawn at 320 px in the compact layout', async () => {
    const { root } = await show(320, 'light', 'auto', VALUES, RINGS);
    expect(root.querySelector('.status')).toBeNull();
    for (const selector of ['.ring.moisture', '.ring.total', '.ring-track.total']) {
      const element = root.querySelector(`svg ${selector}`);
      if (!element) throw new Error(`no ${selector}`);
      const rect = element.getBoundingClientRect();
      expect(rect.width, selector).toBeGreaterThan(20);
      expect(rect.height, selector).toBeGreaterThan(40);
      expect(getComputedStyle(element).visibility, selector).toBe('visible');
    }
  });
});

describe('ring colours and coverage', () => {
  const RINGS = { show_effectiveness: true, smoothing: 0 };
  // Heating (cold outdoors) and cooling (hot outdoors): the total ring takes the warm or the cold colour.
  const MODES = { heating: { ...VALUES, bypass: 0 }, cooling: KEPT_OUT } as const;
  /** The exchanger fully effective: the supply leaves as the extract air does, so both figures are 100 %. */
  const FULL: MockValues = {
    ...VALUES,
    temperature: { outdoor: -12.5, supply: 21.4, extract: 21.4, exhaust: -12.5 },
    humidity: { outdoor: 85, supply: 50, extract: 50, exhaust: 85 },
    bypass: 0,
  };

  const stroke = (root: ShadowRoot, selector: string): string => getComputedStyle(element(root, selector)).stroke;

  const COLOUR_CASES = (['light', 'dark'] as const).flatMap((theme) =>
    (['heating', 'cooling'] as const).flatMap((mode) =>
      (['hrv', 'erv'] as const).map((type) => ({ theme, mode, type })),
    ),
  );

  for (const { theme, mode, type } of COLOUR_CASES) {
    test(`airflow-diagram-card "Ring colours", ${theme}, ${mode}, ${type}: the total ring keeps 3:1 against the core fill${type === 'erv' ? ' and the moisture ring' : ''}`, async () => {
      const { root } = await show(400, theme, 'auto', MODES[mode], { ...RINGS, exchanger_type: type });
      const total = stroke(root, 'svg .ring.total');
      const fill = getComputedStyle(element(root, 'svg .exchanger')).fill;
      expect(contrast(total, fill), 'fill').toBeGreaterThanOrEqual(3);
      if (type === 'erv') {
        expect(contrast(total, stroke(root, 'svg .ring.moisture')), 'moisture ring').toBeGreaterThanOrEqual(3);
      } else {
        expect(root.querySelector('svg .ring.moisture')).toBeNull();
      }
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`airflow-diagram-card "Moisture ring in both themes", ${theme}: the filled rim is at least ${theme === 'light' ? '1.5' : '1.3'}:1 against the empty rim`, async () => {
      const { root } = await show(400, theme, 'auto', VALUES, { ...RINGS, exchanger_type: 'erv' });
      const filled = stroke(root, 'svg .ring.moisture');
      const empty = getComputedStyle(element(root, 'svg .exchanger')).fill;
      expect(contrast(filled, empty)).toBeGreaterThanOrEqual(theme === 'light' ? 1.5 : 1.3);
      // Blue-grey, not the moisture bar's teal: the blue channel is the strongest.
      const [r, g, b] = channels(filled);
      expect(b).toBeGreaterThan(g);
      expect(b).toBeGreaterThan(r);
    });
  }

  test('the warm and the cold total ring differ', async () => {
    const colors: number[][] = [];
    for (const values of Object.values(MODES)) {
      const { root } = await show(400, 'light', 'auto', values, { ...RINGS, exchanger_type: 'erv' });
      colors.push(channels(stroke(root, 'svg .ring.total')));
      document.body.innerHTML = '';
    }
    expect(colors[0]).not.toEqual(colors[1]);
  });

  /** A screenshot of the drawing as pixels, with the map from drawing units to its pixels. */
  async function pixels(root: ShadowRoot) {
    const art = element(root, 'svg.art') as SVGSVGElement;
    const shot = await page.screenshot({ element: art, base64: true, save: false });
    const image = new Image();
    image.src = `data:image/png;base64,${shot}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [image.width, image.height];
    const pixelContext = canvas.getContext('2d', { willReadFrequently: true });
    if (!pixelContext) throw new Error('no canvas');
    pixelContext.drawImage(image, 0, 0);
    const rect = art.getBoundingClientRect();
    const toViewport = art.getScreenCTM();
    if (!toViewport) throw new Error('no transform');
    const scale = image.width / rect.width;
    return (x: number, y: number): [number, number, number] => {
      const point = new DOMPoint(x, y).matrixTransform(toViewport);
      const [r = 0, g = 0, b = 0] = pixelContext.getImageData(
        Math.round((point.x - rect.left) * scale),
        Math.round((point.y - rect.top) * scale),
        1,
        1,
      ).data;
      return [r, g, b];
    };
  }

  /** A rendered polygon's vertices in drawing units (the exchanger's outer and inner hexagon, vertex for vertex). */
  const vertices = (root: ShadowRoot, selector: string): [number, number][] =>
    [...(element(root, selector) as SVGPolygonElement).points].map((point) => [point.x, point.y]);

  for (const theme of ['light', 'dark'] as const) {
    test(`airflow-diagram-card "Full moisture ring", ${theme}: the whole rim is filled from outline to outline and nothing outside or inside it is`, async () => {
      const { root } = await show(900, theme, 'auto', FULL, { ...RINGS, exchanger_type: 'erv' });
      const [OUTER, INNER] = [vertices(root, 'svg .exchanger'), vertices(root, 'svg .exchanger-inner')];
      const ring = element(root, 'svg .ring.moisture');
      expect(ring.getAttribute('stroke-dasharray')).toBe('100 100');
      const ringColor = channels(stroke(root, 'svg .ring.moisture'));
      const at = await pixels(root);
      const streams = [...root.querySelectorAll<SVGPathElement>('svg .stream')];
      const covered = (x: number, y: number): boolean => {
        const point = new DOMPoint(x, y);
        return streams.some((stream) => stream.isPointInStroke(point));
      };
      const near = (a: number[], b: number[]): boolean => a.every((v, i) => Math.abs(v - (b[i] ?? 0)) <= 3);
      const counted = { rim: 0, outside: 0, core: 0 };
      for (let edge = 0; edge < 6; edge++) {
        for (const t of [0.15, 0.3, 0.7, 0.85]) {
          const [o1, o2] = [OUTER[edge], OUTER[(edge + 1) % 6]] as [[number, number], [number, number]];
          const [i1, i2] = [INNER[edge], INNER[(edge + 1) % 6]] as [[number, number], [number, number]];
          const outer = [o1[0] + (o2[0] - o1[0]) * t, o1[1] + (o2[1] - o1[1]) * t] as const;
          const inner = [i1[0] + (i2[0] - i1[0]) * t, i1[1] + (i2[1] - i1[1]) * t] as const;
          // A point at a fraction of the way from the outer to the inner outline; below 0 is outside, above 1 inside.
          const along = (f: number): [number, number] => [
            outer[0] + (inner[0] - outer[0]) * f,
            outer[1] + (inner[1] - outer[1]) * f,
          ];
          // The streams are drawn over the rings, so the points they cover say nothing about the rim.
          const free = (f: number): boolean => !covered(...along(f));
          for (const f of [0.2, 0.5, 0.7]) {
            if (!free(f)) continue;
            counted.rim++;
            expect(near(at(...along(f)), ringColor), `rim, edge ${String(edge)}, t ${String(t)}, f ${String(f)}`).toBe(
              true,
            );
          }
          // Outside the outer outline (stroke 2) and inside the inner outline and the total ring on it (3).
          for (const [f, name] of [
            [-0.45, 'outside'],
            [-0.8, 'outside'],
            [1.45, 'core'],
          ] as const) {
            if (!free(f)) continue;
            counted[name]++;
            expect(
              near(at(...along(f)), ringColor),
              `${name}, edge ${String(edge)}, t ${String(t)}, f ${String(f)}`,
            ).toBe(false);
          }
        }
      }
      // Enough points of each kind were free of the streams to mean something.
      expect(counted.rim).toBeGreaterThan(30);
      expect(counted.outside).toBeGreaterThan(30);
      expect(counted.core).toBeGreaterThan(10);
    });
  }
});

describe('flow labels', () => {
  const FULL_BYPASS: MockValues = { ...VALUES, bypass: 100 };
  const WIDTHS = [280, 300, 320, COMPACT_BELOW, 360, 400, 500, 600];

  for (const type of ['hrv', 'erv']) {
    test(`airflow-diagram-card "Flow labels", ${type}: below the arrowheads, clear of the bypass path at 100 % and of the corner stacks, 280 to 600 px`, async () => {
      // The compact layout has no flow labels, so the full layout is forced at the narrow widths.
      const shown = await show(280, 'light', 'full', FULL_BYPASS, { exchanger_type: type });
      const { root } = shown;
      for (const width of WIDTHS) {
        await resize(shown, width);
        const where = `${type} ${String(width)} px`;
        const heads = [...root.querySelectorAll('svg .head')].map((head) => head.getBoundingClientRect());
        const labels = ['.supply-flow .label', '.exhaust-flow .label'].map((selector) => {
          const found = root.querySelector(selector)?.getBoundingClientRect();
          if (!found) throw new Error(`no ${selector} at ${where}`);
          return found;
        });
        expect(root.querySelector('svg .stream.bypass'), where).not.toBeNull();
        expect(root.querySelector('svg .stream.supply'), where).toBeNull();
        const crossed = streamCrossing(root);
        const card = root.querySelector('ha-card')?.getBoundingClientRect();
        if (!card) throw new Error('no card');
        for (const [index, label] of labels.entries()) {
          for (const head of heads) expect(overlap(label, head), `${where} label ${String(index)} / head`).toBe(false);
          // The text itself (the label's box has empty corners) clear of the streams, the bypass path among them.
          const ink = inkBoxes(element(root, index === 0 ? '.supply-flow .label' : '.exhaust-flow .label'));
          expect(ink.length, where).toBeGreaterThan(0);
          for (const glyph of ink) expect(crossed(glyph), `${where} label ${String(index)} / streams`).toBe(false);
          for (const corner of root.querySelectorAll('.corner .label:not(.hidden)'))
            expect(
              overlap(label, corner.getBoundingClientRect()),
              `${where} label ${String(index)} / ${corner.textContent}`,
            ).toBe(false);
          expect(label.left, where).toBeGreaterThanOrEqual(card.left);
          expect(label.right, where).toBeLessThanOrEqual(card.right);
          // Below its own arrowhead.
          const head = heads[index === 0 ? 0 : 1];
          expect(label.top, where).toBeGreaterThanOrEqual((head?.bottom ?? 0) - 0.5);
        }
      }
    });
  }
});

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateReducedMotion: (reducedMotion: 'reduce' | 'no-preference' | null) => Promise<void>;
  }
}

describe('pre-heater coil', () => {
  const HEATER = { pre_heater: { power: id.preHeater, max_power: 1000 } };
  const WIDTHS = [280, 300, 320, COMPACT_BELOW, 360, 400, 500, 600];

  for (const layout of ['full', 'compact'] as const) {
    for (const [name, values] of [
      ['off', VALUES],
      ['on', { ...VALUES, preHeater: 600 }],
    ] as const) {
      test(`airflow-diagram-card "Narrow card with all outdoor labels", ${layout} layout, ${name}: the coil's box is clear of the outdoor labels, the flow labels and the bypass position, 280 to 600 px`, async () => {
        const shown = await show(280, 'light', layout, { ...values, bypass: 100 }, HEATER);
        const { root } = shown;
        for (const width of WIDTHS) {
          await resize(shown, width);
          const where = `${layout} ${name} ${String(width)} px`;
          const coil = box(root, '.on-drawing.pre-heater');
          const wire = box(root, 'svg path.coil');
          // The coil's state: on draws the wire lit over a glow, off draws the dim wire alone.
          expect(root.querySelector('svg path.coil.on') !== null, `${where} lit`).toBe(name === 'on');
          expect(root.querySelector('svg path.coil.off') !== null, `${where} dim`).toBe(name === 'off');
          expect(root.querySelector('svg path.coil-glow') !== null, `${where} glow`).toBe(name === 'on');
          // The glow is a wider, blurred stroke: its box is the wire's, grown by half the stroke and one blur radius.
          const reach = (3 + 3) * (element(root, 'svg path.coil') as SVGGraphicsElement).getScreenCTM()!.a;
          const glow = new DOMRect(wire.x - reach, wire.y - reach, wire.width + 2 * reach, wire.height + 2 * reach);
          expect(coil.width, where).toBeGreaterThan(0);
          expect(coil.height, where).toBeGreaterThan(0);
          // The outdoor stack is the corner's labels; the flow labels and the bypass position have their own boxes.
          const outdoor = [...root.querySelectorAll('.corner .label:not(.hidden)')];
          expect(outdoor.length, where).toBeGreaterThan(0);
          const others = [
            ...root.querySelectorAll('.supply-flow .label, .exhaust-flow .label, .bypass-position .label:not(.hidden)'),
          ];
          expect(others.length, where).toBeGreaterThan(layout === 'full' ? 1 : 0);
          for (const other of [...outdoor, ...others]) {
            const label = other.getBoundingClientRect();
            const what = `${where} ${other.textContent.trim()}`;
            expect(overlap(coil, label), `${what} / box`).toBe(false);
            expect(overlap(wire, label), `${what} / wire`).toBe(false);
            if (name === 'on') expect(overlap(glow, label), `${what} / glow`).toBe(false);
          }
        }
      });
    }
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`airflow-diagram-card "Off", ${theme}: the off coil is drawn dim and differs from the outdoor stream's colour`, async () => {
      const { root } = await show(400, theme, 'auto', { ...VALUES, bypass: 0 }, HEATER);
      const coil = element(root, 'svg .coil');
      expect(coil.classList.contains('off')).toBe(true);
      const style = getComputedStyle(coil);
      expect(parseFloat(style.opacity)).toBeGreaterThan(0);
      expect(parseFloat(style.opacity)).toBeLessThan(1);
      // The stream under the coil: the supply gradient (x 86 to 326, y 62 to 138) at the coil's middle (114, 62).
      const [from, to] = [...root.querySelectorAll('svg linearGradient stop')].map((stop) =>
        channels(getComputedStyle(stop).stopColor),
      ) as [[number, number, number], [number, number, number]];
      const along = ((114 - 86) * 240) / (240 ** 2 + 76 ** 2);
      const stream = from.map((channel, i) => channel + ((to[i] ?? 0) - channel) * along);
      const background = channels(THEMES[theme]['--card-background-color']);
      const wire = channels(style.stroke);
      const opacity = parseFloat(style.opacity);
      // Luminance contrast cannot tell a grey from a blue of the same lightness, so the colours' distance is measured:
      // the dim wire as it shows over the stream, and over the card where it leaves the stream (y 50 to 74).
      const distanceOver = (under: number[]): number =>
        Math.hypot(...wire.map((channel, i) => (channel - (under[i] ?? 0)) * opacity));
      expect(distanceOver(stream), 'over the stream').toBeGreaterThan(30);
      expect(distanceOver(background), 'over the card').toBeGreaterThan(30);
    });
  }
});

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
