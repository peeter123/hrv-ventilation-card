import { afterEach, describe, expect, test, vi } from 'vitest';
import type { CardHass, HrvCard } from '../../src/cards/base-card';
import '../../src/cards/moisture-balance-card';
import '../../src/cards/recovery-balance-card';
import '../../src/cards/ventilation-card';
import type { CardConfig } from '../../src/lib/config';

const TAGS = ['hrv-ventilation-card', 'hrv-recovery-balance-card', 'hrv-moisture-balance-card'] as const;

// A hass with no ventilation entities, as in an installation without a unit; callWS is the smoothing history.
const callWS = vi.fn(() => new Promise<never>(() => undefined));
const makeHass = (): CardHass => ({
  states: { 'sensor.other': { entity_id: 'sensor.other', state: '1', attributes: {} } },
  locale: { language: 'en', number_format: 'language' },
  callWS,
});

async function show(tag: (typeof TAGS)[number], config: CardConfig, hass = makeHass()) {
  const card = document.createElement(tag) as HrvCard;
  card.setConfig(config);
  card.hass = hass;
  document.body.append(card);
  await card.updateComplete;
  const root = card.shadowRoot;
  if (!root) throw new Error('no shadow root');
  return { card, root, hass };
}

afterEach(() => {
  callWS.mockClear();
  document.body.innerHTML = '';
});

describe.each(TAGS)('%s in sample mode', (tag) => {
  test('card-preview "No entities configured": renders the sample with the note, without a history request', async () => {
    const { root } = await show(tag, {});
    expect(root.querySelector('ha-card')?.textContent).toContain('Sample values');
    expect(root.querySelectorAll('.sample-note')).toHaveLength(1);
    expect(root.querySelector('ha-card')?.textContent).not.toContain('n/a');
    expect(callWS).not.toHaveBeenCalled();
  });

  test('a user smoothing window is not requested either', async () => {
    await show(tag, { smoothing: 30 });
    expect(callWS).not.toHaveBeenCalled();
  });

  test('nothing in the sample opens a dialog', async () => {
    const { card, root } = await show(tag, {});
    const opened: unknown[] = [];
    card.addEventListener('hass-more-info', (event) => opened.push(event));
    expect(root.querySelectorAll('[data-entity], [role="button"], [tabindex]')).toHaveLength(0);
    for (const element of root.querySelectorAll('ha-card *'))
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(opened).toEqual([]);
  });

  test('an invalid option is a configuration error naming the option', () => {
    const card = document.createElement(tag) as HrvCard;
    expect(() => {
      card.setConfig({ smoothing: -5 });
    }).toThrow('smoothing');
  });

  test('one entity set leaves sample mode: the missing roles error, no note', () => {
    const card = document.createElement(tag) as HrvCard;
    expect(() => {
      card.setConfig({ outdoor: { temperature: 'sensor.outdoor_t' } });
    }).toThrow('Missing required entities');
  });

  test('a config with entities after a sample config shows the real states, no note', async () => {
    const { card, root } = await show(tag, {});
    card.setConfig({
      outdoor: { temperature: 'sensor.o_t', absolute_humidity: 'sensor.o_ah' },
      supply: { temperature: 'sensor.s_t', absolute_humidity: 'sensor.s_ah' },
      extract: { temperature: 'sensor.e_t', absolute_humidity: 'sensor.e_ah' },
      exhaust: { temperature: 'sensor.x_t' },
      fans: { supply_flow: 'sensor.flow' },
      bypass: { position: 'sensor.bypass' },
    });
    await card.updateComplete;
    expect(root.querySelector('.sample-note')).toBeNull();
  });
});

describe('sample mode options', () => {
  test('exchanger_type erv gives the ERV drawing with the moisture figure; the enthalpy default does not', async () => {
    const erv = await show('hrv-ventilation-card', { exchanger_type: 'erv' });
    expect(erv.root.querySelector('.moisture-recovery')).not.toBeNull();
    expect(erv.root.querySelector('.sample-note')).not.toBeNull();
    document.body.innerHTML = '';
    const hrv = await show('hrv-ventilation-card', {});
    expect(hrv.root.querySelector('.moisture-recovery')).toBeNull();
  });
});
