import { afterEach, describe, expect, test } from 'vitest';
import type { CardHass } from '../../src/cards/base-card';
import { checkMoistureConfig } from '../../src/cards/moisture-balance-card';
import type { CardConfig } from '../../src/lib/config';
import type { HassEntityState } from '../../src/lib/hass';
import { nb } from '../nbsp';

const NOW = Date.parse('2026-10-13T12:00:00Z');

const state = (entity_id: string, value: string, unit?: string): HassEntityState => ({
  entity_id,
  state: value,
  attributes: unit ? { unit_of_measurement: unit } : {},
  last_updated: new Date(NOW).toISOString(),
});

// Drying: extract 8.6, supply 8.2, outdoor 7.6 g/m³ at 230 m³/h: extracted 230, recovered 138, outside 92 g/h.
const STATES = [
  state('sensor.mb_outdoor_t', '10', '°C'),
  state('sensor.mb_outdoor_ah', '7.6', 'g/m³'),
  state('sensor.mb_supply_t', '18', '°C'),
  state('sensor.mb_supply_ah', '8.2', 'g/m³'),
  state('sensor.mb_extract_t', '21', '°C'),
  state('sensor.mb_extract_ah', '8.6', 'g/m³'),
  state('sensor.mb_supply_flow', '230', 'm³/h'),
  state('sensor.mb_bypass', '0', '%'),
];

const CONFIG: CardConfig = {
  type: 'custom:hrv-moisture-balance-card',
  outdoor: { absolute_humidity: 'sensor.mb_outdoor_ah' },
  supply: { absolute_humidity: 'sensor.mb_supply_ah' },
  extract: { absolute_humidity: 'sensor.mb_extract_ah' },
  fans: { supply_flow: 'sensor.mb_supply_flow' },
  bypass: { position: 'sensor.mb_bypass' },
};

const hassWith = (states: HassEntityState[]): CardHass => ({
  states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
  locale: { language: 'en', number_format: 'language' },
  callWS: () => new Promise(() => undefined),
});

const replace = (states: HassEntityState[], next: HassEntityState): HassEntityState[] =>
  states.map((s) => (s.entity_id === next.entity_id ? next : s));

async function render(config: CardConfig, states: HassEntityState[]) {
  const card = document.createElement('hrv-moisture-balance-card');
  card.setConfig(config);
  card.hass = hassWith(states);
  document.body.append(card);
  await card.updateComplete;
  const root = card.shadowRoot;
  if (!root) throw new Error('no shadow root');
  return { card, root };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('checkMoistureConfig', () => {
  test('moisture-balance-card "Required humidity missing" names the supply air humidity', () => {
    const { supply: _supply, ...withoutSupply } = CONFIG;
    expect(() => {
      checkMoistureConfig(withoutSupply);
    }).toThrow('Missing required entities: supply air humidity');
  });

  test('moisture-balance-card "Relative humidity without temperature" names the supply air temperature', () => {
    expect(() => {
      checkMoistureConfig({ ...CONFIG, supply: { humidity: 'sensor.mb_supply_rh' } });
    }).toThrow('supply air temperature');
  });

  test('the supply flow is required', () => {
    const { fans: _fans, ...withoutFlow } = CONFIG;
    expect(() => {
      checkMoistureConfig(withoutFlow);
    }).toThrow('supply flow');
  });

  test('an invalid neutral threshold is reported', () => {
    expect(() => {
      checkMoistureConfig({ ...CONFIG, neutral_threshold: -0.1 });
    }).toThrow('Invalid option neutral_threshold: expected a number from 0 to 5');
  });
});

describe('hrv-moisture-balance-card', () => {
  test('renders the drying bar from absolute humidity sensors alone, without temperatures', async () => {
    const { root } = await render(CONFIG, STATES);
    expect(root.querySelector('.title')?.textContent).toBe('Moisture: House Drying');
    expect(root.querySelector('.net')?.textContent.trim()).toBe(nb('Recovered 138 of 230 g/h (60 %)'));
    expect(root.querySelectorAll('.seg')).toHaveLength(2);
    expect(root.textContent).toContain(nb('Indoor 8.6 g/m³ · Outdoor 7.6 g/m³'));
  });

  test('relative humidity with temperatures works too', async () => {
    const config = {
      ...CONFIG,
      outdoor: { temperature: 'sensor.mb_outdoor_t', humidity: 'sensor.mb_outdoor_rh' },
      supply: { temperature: 'sensor.mb_supply_t', humidity: 'sensor.mb_supply_rh' },
      extract: { temperature: 'sensor.mb_extract_t', humidity: 'sensor.mb_extract_rh' },
    };
    const states = [
      ...STATES,
      state('sensor.mb_outdoor_rh', '80', '%'),
      state('sensor.mb_supply_rh', '55', '%'),
      state('sensor.mb_extract_rh', '50', '%'),
    ];
    const { root } = await render(config, states);
    expect(root.querySelector('.net')?.textContent).not.toContain('n/a');
  });

  test('moisture-balance-card "No bypass entity": renders without the bypass strip', async () => {
    const { bypass: _bypass, ...withoutBypass } = CONFIG;
    const { root } = await render(withoutBypass, STATES);
    expect(root.querySelector('.bypass')).toBeNull();
    expect(root.querySelectorAll('.seg')).toHaveLength(2);
  });

  test('moisture-balance-card "Bypass open": the strip is filled to the position and the header gets the suffix', async () => {
    const { root } = await render(CONFIG, replace(STATES, state('sensor.mb_bypass', '40', '%')));
    expect(root.querySelector<HTMLElement>('.bypass-fill')?.style.width).toBe('40%');
    expect(root.querySelector('.net')?.textContent.trim()).toBe(
      nb('Recovered 138 of 230 g/h (60 %, with bypass 40 %)'),
    );
  });

  test('moisture-balance-card "Configured input unavailable": a configured bypass without a value gives n/a', async () => {
    const { root } = await render(CONFIG, replace(STATES, state('sensor.mb_bypass', 'unavailable')));
    expect(root.querySelector('.net')?.textContent.trim()).toBe('n/a');
    expect(root.querySelectorAll('.seg')).toHaveLength(0);
    expect(root.querySelector('.bypass')).toBeNull();
  });

  test('an unavailable humidity or supply flow gives n/a', async () => {
    for (const unavailable of [
      state('sensor.mb_extract_ah', 'unknown'),
      state('sensor.mb_supply_flow', 'unavailable'),
    ]) {
      const { root } = await render(CONFIG, replace(STATES, unavailable));
      expect(root.querySelector('.net')?.textContent.trim(), unavailable.entity_id).toBe('n/a');
      document.body.innerHTML = '';
    }
  });

  test('configurable colours and neutral threshold', async () => {
    const { root } = await render({ ...CONFIG, drying_color: '#123456', neutral_threshold: 2 }, STATES);
    // 8.6 vs 7.6 g/m³ is within a threshold of 2: neutral, so the header has no colour of its own.
    expect(root.querySelector('.title')?.textContent).toBe('Moisture: Indoor ≈ Outdoor');
    expect(root.querySelector<HTMLElement>('.fill')?.style.background).toContain('#123456');
  });
});
