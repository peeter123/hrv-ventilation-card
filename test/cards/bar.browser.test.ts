// The shared bar in a real browser: every segment's fill has the bar's box, so the stripes of adjacent hatched parts
// line up as one pattern, and the two lanes of the recovery bar are equally high.
import { afterEach, expect, test } from 'vitest';
import { commands } from 'vitest/browser';
import '../../dev/ha-stubs';
import { CONFIGS, MockHass, type MockValues } from '../../dev/mock-hass';
import '../../src/cards/moisture-balance-card';
import '../../src/cards/recovery-balance-card';

// Heating with all four recovery parts and both moisture parts.
const VALUES: MockValues = {
  temperature: { outdoor: 0, supply: 18.3, extract: 21.5, exhaust: 3.5 },
  humidity: { outdoor: 90, supply: 44, extract: 50, exhaust: 95 },
  flow: 180,
  bypass: 0,
  season: 'heating',
  unavailable: new Set(),
};

afterEach(() => {
  document.body.innerHTML = '';
});

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateDevicePixelRatio: (ratio: number | null) => Promise<void>;
  }
}

/** A bar card at the given width with every recovery part, rendered; its shadow root. */
async function show(
  tag: 'hrv-recovery-balance-card' | 'hrv-moisture-balance-card',
  width: number,
): Promise<ShadowRoot> {
  const wrapper = document.createElement('div');
  wrapper.style.width = `${String(width)}px`;
  const card = document.createElement(tag);
  card.setConfig({ type: `custom:${tag}`, ...CONFIGS['full'], smoothing: 0 });
  card.hass = new MockHass().build(VALUES, false);
  wrapper.append(card);
  document.body.append(wrapper);
  await card.updateComplete;
  const root = card.shadowRoot;
  if (!root) throw new Error('no shadow root');
  return root;
}

for (const tag of ['hrv-recovery-balance-card', 'hrv-moisture-balance-card'] as const) {
  for (const width of [280, 437, 600]) {
    test(`${tag}, ${String(width)} px: every fill covers the bar exactly`, async () => {
      const root = await show(tag, width);
      const bar = root.querySelector('.bar');
      if (!bar) throw new Error('no bar');
      const inside = bar.getBoundingClientRect().left + bar.clientLeft;
      const fills = [...root.querySelectorAll('.fill')].map((fill) => fill.getBoundingClientRect());
      expect(fills.length).toBeGreaterThan(1);
      // Within a quarter pixel: Chrome rounds each segment's layout a little.
      for (const fill of fills) {
        expect(Math.abs(fill.left - inside)).toBeLessThan(0.25);
        expect(Math.abs(fill.width - bar.clientWidth)).toBeLessThan(0.25);
      }
    });
  }
}

for (const ratio of [1, 2]) {
  test(`recovery-balance-card "Equal lanes": both lanes equally high at device pixel ratio ${String(ratio)}`, async () => {
    await commands.emulateDevicePixelRatio(ratio);
    try {
      expect(window.devicePixelRatio).toBe(ratio);
      const root = await show('hrv-recovery-balance-card', 437);
      const bar = root.querySelector('.bar');
      const lanes = [...root.querySelectorAll('.lane')].map((lane) => lane.getBoundingClientRect());
      expect(bar?.getBoundingClientRect().height).toBe(28);
      expect(lanes.map((lane) => lane.height)).toEqual([13, 13]);
      // The divider lies across the middle, between the lanes, and takes no height from them.
      const divider = root.querySelector('.divider')?.getBoundingClientRect();
      expect(divider?.height).toBe(1);
      expect((divider?.top ?? 0) + 0.5).toBe(lanes[1]?.top);
    } finally {
      await commands.emulateDevicePixelRatio(null);
    }
  });
}

test('moisture-balance-card "Drying": the muted subtitle lies under the title, smaller, in the secondary text colour', async () => {
  const root = await show('hrv-moisture-balance-card', 437);
  const host = root.host as HTMLElement;
  host.style.setProperty('--primary-text-color', '#212121');
  host.style.setProperty('--secondary-text-color', '#727272');
  const title = root.querySelector('.title');
  const subtitle = root.querySelector('.subtitle');
  if (!title || !subtitle) throw new Error('no title or subtitle');
  expect(subtitle.textContent).toBe('House drying');
  expect(subtitle.getBoundingClientRect().top).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom);
  expect(subtitle.getBoundingClientRect().left).toBe(title.getBoundingClientRect().left);
  const style = getComputedStyle(subtitle);
  expect(parseFloat(style.fontSize)).toBeLessThan(parseFloat(getComputedStyle(title).fontSize));
  expect(style.color).toBe('rgb(114, 114, 114)');
  expect(getComputedStyle(title).color).toBe('rgb(33, 33, 33)');
});

test('the one-lane moisture bar keeps its 22 px height and has no divider', async () => {
  const root = await show('hrv-moisture-balance-card', 437);
  expect(root.querySelector('.bar')?.getBoundingClientRect().height).toBe(22);
  expect(root.querySelectorAll('.lane')).toHaveLength(1);
  expect(root.querySelector('.lane')?.getBoundingClientRect().height).toBe(20);
  expect(root.querySelector('.divider')).toBeNull();
});
