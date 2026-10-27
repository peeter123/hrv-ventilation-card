// The recovery bar with the preview's mock pre-heater: a third segment in the pre-heater colour and a legend entry
// while the pre-heater runs, none at 0 W.
import { afterEach, expect, test } from 'vitest';
import '../../dev/ha-stubs';
import { CONFIGS, id, MockHass, type MockValues } from '../../dev/mock-hass';
import '../../src/cards/recovery-balance-card';

const VALUES: MockValues = {
  temperature: { outdoor: -8, supply: 18.5, extract: 21.5, exhaust: 5 },
  humidity: { outdoor: 90, supply: 40, extract: 50, exhaust: 85 },
  flow: 180,
  bypass: 0,
  season: 'heating',
  unavailable: new Set(),
};

afterEach(() => {
  document.body.innerHTML = '';
});

async function show(preHeater: number): Promise<ShadowRoot> {
  const card = document.createElement('hrv-recovery-balance-card');
  card.style.width = '400px';
  card.setConfig({
    type: 'custom:hrv-recovery-balance-card',
    ...CONFIGS['full'],
    smoothing: 0,
    pre_heater: { power: id.preHeater, temperature_after: id.preHeaterAfter },
  });
  card.hass = new MockHass().build({ ...VALUES, preHeater }, false);
  document.body.append(card);
  await card.updateComplete;
  const root = card.shadowRoot;
  if (!root) throw new Error('no shadow root');
  return root;
}

const preHeaterFills = (root: ShadowRoot): Element[] =>
  [...root.querySelectorAll('.fill')].filter((fill) =>
    /rgb\(255, 152, 0\)|#ff9800/i.test(getComputedStyle(fill).backgroundColor),
  );

test('500 W: a pre-heater segment in the temperature lane and its legend entry', async () => {
  const root = await show(500);
  expect(preHeaterFills(root).length).toBeGreaterThan(0);
  expect(root.textContent).toContain('Pre-Heater');
});

test('0 W: no pre-heater segment and no legend entry', async () => {
  const root = await show(0);
  // The bar itself is there (the recovered and the lost part), only the pre-heater part is missing.
  expect(root.querySelectorAll('.fill').length).toBeGreaterThan(1);
  expect(preHeaterFills(root)).toHaveLength(0);
  expect(root.textContent).not.toContain('Pre-Heater');
});
