import { describe, expect, test } from 'vitest';
import { fanLevelText, formatState, type HassEntityState } from '../../src/lib/hass';

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

describe('fanLevelText', () => {
  const fan = (attributes: Record<string, unknown>, state = 'on', entityId = 'fan.hrv'): HassEntityState => ({
    entity_id: entityId,
    state,
    attributes,
  });

  test('names the level of a three-speed fan', () => {
    expect(fanLevelText(fan({ percentage: 66, percentage_step: 33.333333333333336 }))).toBe('Medium');
    expect(fanLevelText(fan({ percentage: 66, percentage_step: 33.33 }))).toBe('Medium');
    expect(fanLevelText(fan({ percentage: 0, percentage_step: 33.33 }, 'off'))).toBe('Away');
  });

  test('rounds to the nearest level and clamps to the highest', () => {
    const level = (percentage: number) => fanLevelText(fan({ percentage, percentage_step: 33.333333333333336 }));
    expect(level(33)).toBe('Low');
    expect(level(67)).toBe('Medium');
    expect(level(100)).toBe('High');
    expect(level(120)).toBe('High');
    expect(level(-5)).toBe('Away');
    expect(level(10)).toBe('Low');
    expect(level(1)).toBe('Low');
    expect(level(0)).toBe('Away');
  });

  test('another number of speeds gives the rounded percentage', () => {
    expect(fanLevelText(fan({ percentage: 40, percentage_step: 10 }))).toBe('40 %');
    expect(fanLevelText(fan({ percentage: 49.6, percentage_step: 25 }))).toBe('50 %');
  });

  test('gives undefined without a usable fan level', () => {
    expect(fanLevelText(fan({ percentage_step: 33.33 }))).toBeUndefined();
    expect(fanLevelText(fan({ percentage: '66', percentage_step: 33.33 }))).toBeUndefined();
    expect(fanLevelText(fan({ percentage: null, percentage_step: 33.33 }))).toBeUndefined();
    expect(fanLevelText(fan({ percentage: 66 }))).toBeUndefined();
    expect(fanLevelText(fan({ percentage: 66, percentage_step: 0 }))).toBeUndefined();
    expect(fanLevelText(fan({ percentage: 66, percentage_step: 33.33 }, 'unavailable'))).toBeUndefined();
    expect(fanLevelText(fan({ percentage: 66, percentage_step: 33.33 }, 'unknown'))).toBeUndefined();
    expect(fanLevelText(fan({ percentage: 66, percentage_step: 33.33 }, 'on', 'sensor.hrv'))).toBeUndefined();
    expect(fanLevelText(undefined)).toBeUndefined();
  });
});
