import { describe, expect, test } from 'vitest';
import { formatState, type HassEntityState } from '../../src/lib/hass';

const STATES: Record<string, HassEntityState> = {
  'sensor.hrv_t': { entity_id: 'sensor.hrv_t', state: '21.43', attributes: { unit_of_measurement: '°C' } },
  'sensor.hrv_mode': { entity_id: 'sensor.hrv_mode', state: 'auto', attributes: {} },
};

describe('formatState', () => {
  test("uses Home Assistant's formatting when it exists", () => {
    const hass = { states: STATES, formatEntityState: (stateObj: HassEntityState) => `${stateObj.state}!` };
    expect(formatState(hass, 'sensor.hrv_t')).toBe('21.43!');
  });

  test('falls back to the state with its unit on versions without it', () => {
    expect(formatState({ states: STATES }, 'sensor.hrv_t')).toBe('21.43 °C');
    expect(formatState({ states: STATES }, 'sensor.hrv_mode')).toBe('auto');
  });

  test('the fallback leaves the unit off a state without a value', () => {
    const states = {
      'sensor.hrv_t': { entity_id: 'sensor.hrv_t', state: 'unavailable', attributes: { unit_of_measurement: '°C' } },
    };
    expect(formatState({ states }, 'sensor.hrv_t')).toBe('unavailable');
  });

  test('an entity missing from Home Assistant gives n/a', () => {
    expect(formatState({ states: STATES }, 'sensor.hrv_missing')).toBe('n/a');
  });
});
