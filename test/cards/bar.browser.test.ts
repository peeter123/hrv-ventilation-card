// The shared bar in a real browser: every segment's fill has the bar's box, so the stripes of adjacent hatched parts
// line up as one pattern.
import { afterEach, expect, test } from 'vitest';
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

for (const tag of ['hrv-recovery-balance-card', 'hrv-moisture-balance-card'] as const) {
  for (const width of [280, 437, 600]) {
    test(`${tag}, ${String(width)} px: every fill covers the bar exactly`, async () => {
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
