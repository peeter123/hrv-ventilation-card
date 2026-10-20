import { describe, expect, test } from 'vitest';
import { preHeaterLevel } from '../../src/diagram/preheater';

const watts = (state: string, unit = 'W') => ({ state, attributes: { unit_of_measurement: unit } });

describe('preHeaterLevel', () => {
  test('airflow-diagram-card "Modulating pre-heater": the share of the maximum', () => {
    expect(preHeaterLevel(watts('250'), 1000)).toBe(0.25);
  });

  test('airflow-diagram-card "No maximum": any power is full', () => {
    expect(preHeaterLevel(watts('120'), undefined)).toBe(1);
  });

  test('airflow-diagram-card "On/off entity": on is full', () => {
    expect(preHeaterLevel({ state: 'on', attributes: {} }, 1000)).toBe(1);
  });

  test('airflow-diagram-card "Off": off and 0 W are 0', () => {
    expect(preHeaterLevel({ state: 'off', attributes: {} }, 1000)).toBe(0);
    expect(preHeaterLevel(watts('0'), 1000)).toBe(0);
    expect(preHeaterLevel(watts('-5'), undefined)).toBe(0);
  });

  test('airflow-diagram-card "Unavailable": no value is 0', () => {
    expect(preHeaterLevel({ state: 'unavailable', attributes: {} }, 1000)).toBe(0);
    expect(preHeaterLevel({ state: 'unknown', attributes: {} }, undefined)).toBe(0);
    expect(preHeaterLevel({ state: 'heating', attributes: {} }, 1000)).toBe(0);
    expect(preHeaterLevel(undefined, 1000)).toBe(0);
  });

  test('a power in kW is converted to W', () => {
    expect(preHeaterLevel(watts('0.5', 'kW'), 1000)).toBe(0.5);
  });

  test('the level is at least 0.1 while power is drawn', () => {
    expect(preHeaterLevel(watts('20'), 1000)).toBe(0.1);
  });

  test('the level is capped at 1 above the maximum', () => {
    expect(preHeaterLevel(watts('1500'), 1000)).toBe(1);
  });
});
