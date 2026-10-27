import { describe, expect, test } from 'vitest';
import { createCalculator } from '../../src/calc/inputs';
import { SmoothingStore } from '../../src/calc/smoothing';
import { SAVING_THRESHOLD, savingTarget } from '../../src/diagram/badge';
import { asEntityId, entityAt, type RolePath } from '../../src/lib/config';
import { formatState } from '../../src/lib/hass';
import { SAMPLE_CONFIG, SAMPLE_STATES } from '../../src/lib/sample';
import { ROLE_LABELS } from '../../src/strings';

// The absolute humidities are left out on purpose: the sample gives relative humidity and the cards derive the rest.
// The ventilation mode is left out too: it is an input of the stopped state, which the sample never shows.
const SAMPLE_ROLES = (Object.keys(ROLE_LABELS) as RolePath[]).filter(
  (role) => !role.endsWith('absolute_humidity') && role !== 'fans.ventilation_mode',
);

const calculate = (): ReturnType<ReturnType<typeof createCalculator>> =>
  createCalculator(
    { ...SAMPLE_CONFIG, smoothing: 0 },
    new SmoothingStore(),
  )({
    states: SAMPLE_STATES,
    // History never arrives (the card also sets smoothing to 0): the calculation uses the current values.
    callWS: () => new Promise(() => undefined),
  });
// The sample config sets every role, so the entity ID of a role is always there.
const entityId = (role: RolePath): string => entityAt(SAMPLE_CONFIG, role) ?? '';
const sampleState = (role: RolePath): string | undefined => SAMPLE_STATES[entityId(role)]?.state;

describe('the sample', () => {
  test('sets every role the cards show, to a state in the sample, under the made-up domain', () => {
    for (const role of SAMPLE_ROLES) {
      expect(entityId(role), role).toMatch(/^hrv_sample\./);
      expect(asEntityId(entityId(role)), role).toBeDefined();
      expect(SAMPLE_STATES[entityId(role)], role).toBeDefined();
    }
  });

  test('holds no state for an entity the config does not set', () => {
    const configured = new Set(SAMPLE_ROLES.map(entityId));
    expect(Object.keys(SAMPLE_STATES).filter((id) => !configured.has(id))).toEqual([]);
  });

  test('is a heating day: a saving above the badge threshold, a drying house, positive moisture recovery', () => {
    const { result } = calculate();
    expect(result?.mode).toBe('heating');
    expect(result?.saving).toBeGreaterThan(SAVING_THRESHOLD);
    expect(result?.moisture?.extracted).toBeGreaterThan(0);
    expect(result?.moisture?.recovered).toBeGreaterThan(0);
  });

  test('the cooling saving reads 0 W in the sample heating mode, so the badge opens the heating saving', () => {
    const { result } = calculate();
    expect(result?.mode).toBe('heating');
    expect(Number(sampleState('status.cooling_saving'))).toBe(0);
    expect(
      savingTarget(
        result,
        { heating: entityId('status.heating_saving'), cooling: entityId('status.cooling_saving') },
        SAMPLE_STATES,
      ),
    ).toBe(entityId('status.heating_saving'));
  });

  test('the saved power and moisture recovery states match the calculation', () => {
    const { result } = calculate();
    expect(Math.abs(Number(sampleState('status.heating_saving')) - (result?.saving ?? NaN))).toBeLessThan(1);
    expect(
      Math.abs(Number(sampleState('status.moisture_recovery')) - (result?.moisture?.recovered ?? NaN)),
    ).toBeLessThan(1);
    expect(Math.abs(Number(sampleState('status.moisture_outside')) - (result?.moisture?.outside ?? NaN))).toBeLessThan(
      1,
    );
  });

  test('formats like real sensors through the formatState fallback, a number with its unit', () => {
    const format = (role: RolePath): string => formatState({ states: SAMPLE_STATES }, entityId(role));
    expect(format('outdoor.temperature')).toBe('2 °C');
    expect(format('supply.humidity')).toBe('45 %');
    expect(format('fans.supply_flow')).toBe('200 m³/h');
    expect(format('status.filter_days')).toBe('120 d');
    expect(format('bypass.mode')).toBe('Auto');
  });
});
