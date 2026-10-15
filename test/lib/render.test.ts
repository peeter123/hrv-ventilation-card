import { describe, expect, test } from 'vitest';
import type { HassEntityState, HassLike } from '../../src/lib/hass';
import { configuredEntityIds, hassChanged, shouldRender } from '../../src/lib/render';

const state = (entity_id: string, value: string, unit?: string): HassEntityState => ({
  entity_id,
  state: value,
  attributes: unit ? { unit_of_measurement: unit } : {},
});

const supply = state('sensor.supply_temperature', '19.8', '°C');
const kitchen = state('light.kitchen', 'off');
const locale = { language: 'en', number_format: 'language' };
const registry = { 'sensor.supply_temperature': { display_precision: 1 } };

const base: HassLike = {
  states: { 'sensor.supply_temperature': supply, 'light.kitchen': kitchen },
  entities: registry,
  locale,
  themes: { darkMode: false },
};
const IDS = ['sensor.supply_temperature'];

describe('configuredEntityIds', () => {
  test('collects the entity IDs of nested roles, once each, and ignores other values', () => {
    const config = {
      type: 'custom:hrv-ventilation-card',
      outdoor: { temperature: 'sensor.outdoor_temperature', humidity: 'sensor.outdoor_humidity' },
      extract: { temperature: ' sensor.extract_temperature ' },
      fans: { supply_flow: 'sensor.supply_flow' },
      bypass: { position: 'sensor.outdoor_temperature' },
      colors: { warm: '#c62828' },
      smoothing: 10,
      air_density: '1.2',
      layout: 'auto',
      'status.power': 'sensor.power',
    };
    expect(configuredEntityIds(config).sort()).toEqual([
      'sensor.extract_temperature',
      'sensor.outdoor_humidity',
      'sensor.outdoor_temperature',
      'sensor.power',
      'sensor.supply_flow',
    ]);
  });

  test('an empty config has no entities', () => {
    expect(configuredEntityIds({ type: 'custom:hrv-recovery-balance-card' })).toEqual([]);
  });
});

describe('hassChanged', () => {
  test('card-bundle "Unrelated entity changes": another entity changing does not re-render', () => {
    const next = { ...base, states: { ...base.states, 'light.kitchen': state('light.kitchen', 'on') } };
    expect(hassChanged(base, next, IDS)).toBe(false);
  });

  test('a new hass with the same objects does not re-render', () => {
    expect(hassChanged(base, { ...base }, IDS)).toBe(false);
  });

  test('a state change of a configured entity re-renders', () => {
    const next = { ...base, states: { ...base.states, 'sensor.supply_temperature': { ...supply, state: '20.1' } } };
    expect(hassChanged(base, next, IDS)).toBe(true);
  });

  test('an attribute-only change (new state object, same state) re-renders', () => {
    const changed = { ...supply, attributes: { unit_of_measurement: '°F' } };
    const next = { ...base, states: { ...base.states, 'sensor.supply_temperature': changed } };
    expect(hassChanged(base, next, IDS)).toBe(true);
  });

  test('a configured entity disappearing re-renders', () => {
    const next = { ...base, states: { 'light.kitchen': kitchen } };
    expect(hassChanged(base, next, IDS)).toBe(true);
  });

  test('card-bundle "Registry entry changed": a new registry entry for a configured entity re-renders', () => {
    const next = { ...base, entities: { 'sensor.supply_temperature': { display_precision: 2 } } };
    expect(hassChanged(base, next, IDS)).toBe(true);
  });

  test('a registry update that rebuilds every entry with the same fields does not re-render', () => {
    // HA builds new entry objects for every entity on each registry update, e.g. when a light is renamed.
    const next = {
      ...base,
      entities: { 'sensor.supply_temperature': { display_precision: 1 }, 'light.kitchen': { name: 'Kitchen' } },
    };
    expect(hassChanged(base, next, IDS)).toBe(false);
  });

  test('a rebuilt labels array with the same labels does not re-render', () => {
    const rendered = { ...base, entities: { 'sensor.supply_temperature': { display_precision: 1, labels: ['hvac'] } } };
    const next = { ...base, entities: { 'sensor.supply_temperature': { display_precision: 1, labels: ['hvac'] } } };
    expect(hassChanged(rendered, next, IDS)).toBe(false);
    const relabelled = { ...base, entities: { 'sensor.supply_temperature': { display_precision: 1, labels: [] } } };
    expect(hassChanged(rendered, relabelled, IDS)).toBe(true);
  });

  test('translations loading (a new localize or formatEntityState) re-renders', () => {
    const rendered = { ...base, localize: () => '', formatEntityState: () => '' };
    expect(hassChanged(rendered, { ...rendered, localize: () => '' }, IDS)).toBe(true);
    expect(hassChanged(rendered, { ...rendered, formatEntityState: () => '' }, IDS)).toBe(true);
    expect(hassChanged(rendered, { ...rendered }, IDS)).toBe(false);
  });

  test('a registry field added to or removed from a configured entity re-renders', () => {
    const added = { ...base, entities: { 'sensor.supply_temperature': { display_precision: 1, name: 'Supply' } } };
    expect(hassChanged(base, added, IDS)).toBe(true);
    expect(hassChanged(added, base, IDS)).toBe(true);
  });

  test('a locale change re-renders', () => {
    expect(hassChanged(base, { ...base, locale: { language: 'nl', number_format: 'language' } }, IDS)).toBe(true);
  });

  test('a language change re-renders (older versions without locale)', () => {
    const before = { ...base, locale: undefined, language: 'en' };
    expect(hassChanged(before, { ...before, language: 'nl' }, IDS)).toBe(true);
  });

  test('a dark mode change re-renders', () => {
    expect(hassChanged(base, { ...base, themes: { darkMode: true } }, IDS)).toBe(true);
  });

  test('the first hass renders', () => {
    expect(hassChanged(undefined, base, IDS)).toBe(true);
  });
});

describe('shouldRender', () => {
  test('card-bundle "Editing the config": a config change re-renders even with an unchanged hass', () => {
    expect(shouldRender(new Map([['_config', {}]]), base, base, IDS)).toBe(true);
  });

  test("the card's own state changing re-renders", () => {
    expect(shouldRender(new Map([['_compact', false]]), base, base, IDS)).toBe(true);
  });

  test('a hass change re-renders only when it differs from the last rendered hass', () => {
    const unrelated = { ...base, states: { ...base.states, 'light.kitchen': state('light.kitchen', 'on') } };
    expect(shouldRender(new Map([['hass', base]]), unrelated, base, IDS)).toBe(false);
    const related = { ...base, locale: { language: 'de' } };
    expect(shouldRender(new Map([['hass', base]]), related, base, IDS)).toBe(true);
  });

  test('the comparison is against the last render, not the previous update', () => {
    // Update 2 was skipped; update 3 is compared with what was rendered (update 1), not with update 2.
    const update2 = { ...base, states: { ...base.states, 'light.kitchen': state('light.kitchen', 'on') } };
    const changedSupply = { ...supply, state: '20.1' };
    const update3 = { ...update2, states: { ...update2.states, 'sensor.supply_temperature': changedSupply } };
    expect(shouldRender(new Map([['hass', update2]]), update3, base, IDS)).toBe(true);
  });

  test('a plain requestUpdate() (no changed properties) renders', () => {
    expect(shouldRender(new Map(), base, base, IDS)).toBe(true);
  });

  test('a hass change without a hass yet does not render', () => {
    expect(shouldRender(new Map([['hass', undefined]]), undefined, undefined, IDS)).toBe(false);
  });
});
