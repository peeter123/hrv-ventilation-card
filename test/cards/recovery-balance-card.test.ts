import { afterEach, describe, expect, test } from 'vitest';
import { checkRecoveryConfig, type CardHass } from '../../src/cards/recovery-balance-card';
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

const STATES = [
  state('sensor.rb_outdoor_t', '0', '°C'),
  state('sensor.rb_outdoor_ah', '4.0', 'g/m³'),
  state('sensor.rb_supply_t', '17', '°C'),
  state('sensor.rb_supply_ah', '6.5', 'g/m³'),
  state('sensor.rb_extract_t', '21', '°C'),
  state('sensor.rb_extract_ah', '7.5', 'g/m³'),
  state('sensor.rb_supply_flow', '230', 'm³/h'),
  state('sensor.rb_bypass', '0', '%'),
];

const CONFIG: CardConfig = {
  type: 'custom:hrv-recovery-balance-card',
  outdoor: { temperature: 'sensor.rb_outdoor_t', absolute_humidity: 'sensor.rb_outdoor_ah' },
  supply: { temperature: 'sensor.rb_supply_t', absolute_humidity: 'sensor.rb_supply_ah' },
  extract: { temperature: 'sensor.rb_extract_t', absolute_humidity: 'sensor.rb_extract_ah' },
  fans: { supply_flow: 'sensor.rb_supply_flow' },
  bypass: { position: 'sensor.rb_bypass' },
};

const hassWith = (states: HassEntityState[]): CardHass => ({
  states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
  locale: { language: 'en', number_format: 'language' },
  // No smoothing history in these tests: the store uses the current values.
  callWS: () => new Promise(() => undefined),
});

const replace = (states: HassEntityState[], next: HassEntityState): HassEntityState[] =>
  states.map((s) => (s.entity_id === next.entity_id ? next : s));

async function render(config: CardConfig, states: HassEntityState[]) {
  const card = document.createElement('hrv-recovery-balance-card');
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

describe('checkRecoveryConfig', () => {
  test('recovery-balance-card "Supply flow missing" names the supply flow', () => {
    const { fans: _fans, ...withoutFlow } = CONFIG;
    expect(() => {
      checkRecoveryConfig(withoutFlow);
    }).toThrow('Missing required entities: supply flow');
  });

  test('recovery-balance-card "Partial humidity" names the supply air humidity', () => {
    const partial = { ...CONFIG, supply: { temperature: 'sensor.rb_supply_t' } };
    expect(() => {
      checkRecoveryConfig(partial);
    }).toThrow('supply air humidity');
  });

  test('card-bundle "Negative smoothing window" and "Air density as text"', () => {
    expect(() => {
      checkRecoveryConfig({ ...CONFIG, smoothing: -5 });
    }).toThrow('Invalid option smoothing: expected a number from 0 to 1440');
    expect(() => {
      checkRecoveryConfig({ ...CONFIG, air_density: 'heavy' });
    }).toThrow('air_density');
  });

  test('an invalid colour or minimum scale is reported; a complete config passes', () => {
    expect(() => {
      checkRecoveryConfig({ ...CONFIG, heating: { color: 'red; x' } });
    }).toThrow('heating.color');
    expect(() => {
      checkRecoveryConfig({ ...CONFIG, min_scale: 0 });
    }).toThrow('min_scale');
    expect(() => {
      checkRecoveryConfig(CONFIG);
    }).not.toThrow();
  });
});

describe('hrv-recovery-balance-card', () => {
  test('renders the heating bar from the configured entities', async () => {
    const { root } = await render(CONFIG, STATES);
    expect(root.querySelector('.title')?.textContent).toBe('Heat Recovery');
    expect(root.querySelector('.net')?.textContent.trim()).toBe(nb('Recovered 1,723 W of 2,197 W (78 %)'));
    expect(root.querySelectorAll('.lane')).toHaveLength(2);
    expect(root.querySelectorAll('.lane .seg')).toHaveLength(4);
    expect(root.textContent).not.toContain('Water');
    expect(root.textContent).not.toContain('g/h');
  });

  test('recovery-balance-card "Bypass open": bypass 40 % on a cooler day shows free cooling', async () => {
    const { root } = await render(CONFIG, replace(STATES, state('sensor.rb_bypass', '40', '%')));
    expect(root.querySelector('.title')?.textContent).toBe('Free Cooling');
    expect(root.querySelector<HTMLElement>('.net')?.style.color).toBe('#039be5');
  });

  test('recovery-balance-card "Temperature unavailable": header n/a, bar only the zero line', async () => {
    const { root } = await render(CONFIG, replace(STATES, state('sensor.rb_outdoor_t', 'unavailable')));
    expect(root.querySelector('.net')?.textContent.trim()).toBe('n/a');
    expect(root.querySelectorAll('.seg')).toHaveLength(0);
    expect(root.querySelector('.zero')).not.toBeNull();
  });

  test('recovery-balance-card "Unit without humidity sensors": sensible parts only, no moisture or water', async () => {
    const config = {
      ...CONFIG,
      outdoor: { temperature: 'sensor.rb_outdoor_t' },
      supply: { temperature: 'sensor.rb_supply_t' },
      extract: { temperature: 'sensor.rb_extract_t' },
    };
    const { root } = await render(config, STATES);
    expect(root.querySelectorAll('.lane')).toHaveLength(1);
    expect(root.querySelectorAll('.seg')).toHaveLength(2);
    expect(root.textContent).not.toContain('Moisture');
    expect(root.textContent).not.toContain('Water');
  });

  test('changing a colour in the config re-renders the card with that colour', async () => {
    const { card, root } = await render(CONFIG, STATES);
    expect(root.querySelector<HTMLElement>('.fill')?.style.background).toContain('#db4437');
    card.setConfig({ ...CONFIG, heating: { color: '#ff8800', color_latent: '#ffcc00' } });
    await card.updateComplete;
    const segments = [...root.querySelectorAll<HTMLElement>('.fill')].map((fill) => fill.style.background);
    // Temperature lane (solid, hatched), then moisture lane (solid, hatched).
    expect(segments[0]).toContain('#ff8800');
    expect(segments[1]).toContain('#ff8800');
    expect(segments[2]).toContain('#ffcc00');
    expect(root.querySelector<HTMLElement>('.net')?.style.color).toBe('#ff8800');
    const swatches = [...root.querySelectorAll<HTMLElement>('.swatch')].map((s) => s.style.background);
    expect(swatches[0]).toContain('#ff8800');
    expect(swatches[2]).toContain('#ffcc00');
  });

  test('an unrelated entity change does not re-render; a configured one does', async () => {
    const { card, root } = await render(CONFIG, STATES);
    const header = root.querySelector('.net');
    card.hass = hassWith([...STATES, state('light.kitchen', 'on')]);
    await card.updateComplete;
    expect(root.querySelector('.net')).toBe(header);
    card.hass = hassWith(replace(STATES, state('sensor.rb_supply_flow', '115', 'm³/h')));
    await card.updateComplete;
    expect(root.querySelector('.net')?.textContent.trim()).toBe(nb('Recovered 862 W of 1,099 W (78 %)'));
  });

  test('setConfig throws for a missing role, which Home Assistant shows as an error card', () => {
    const card = document.createElement('hrv-recovery-balance-card');
    expect(() => {
      card.setConfig({ type: 'custom:hrv-recovery-balance-card' });
    }).toThrow('Missing required entities');
  });
});
