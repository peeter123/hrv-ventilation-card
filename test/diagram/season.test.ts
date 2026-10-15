import { describe, expect, test } from 'vitest';
import { seasonIcon } from '../../src/diagram/season';
import type { StateLike } from '../../src/lib/availability';
import type { CardConfig } from '../../src/lib/config';

const COLORS = { cold: '#039be5', warm: '#db4437' };
const BOTH: CardConfig = { seasons: { heating: 'binary_sensor.hrv_heating', cooling: 'binary_sensor.hrv_cooling' } };
const HEATING_ONLY: CardConfig = { seasons: { heating: 'binary_sensor.hrv_heating' } };

const states = (heating?: string, cooling?: string): Record<string, StateLike> => ({
  ...(heating === undefined ? {} : { 'binary_sensor.hrv_heating': { state: heating } }),
  ...(cooling === undefined ? {} : { 'binary_sensor.hrv_cooling': { state: cooling } }),
});

describe('seasonIcon', () => {
  test('airflow-diagram-card "Heating season": the heating icon in the warm colour', () => {
    expect(seasonIcon(BOTH, states('on', 'off'), COLORS)).toEqual({
      season: 'heating',
      icon: 'mdi:sun-thermometer',
      color: '#db4437',
      title: 'Heating season',
      entityId: 'binary_sensor.hrv_heating',
    });
  });

  test('cooling season: the cooling icon in the cold colour, tapping opens the cooling entity', () => {
    expect(seasonIcon(BOTH, states('off', 'on'), COLORS)).toEqual({
      season: 'cooling',
      icon: 'mdi:snowflake-thermometer',
      color: '#039be5',
      title: 'Cooling season',
      entityId: 'binary_sensor.hrv_cooling',
    });
  });

  test('airflow-diagram-card "Between seasons" and "Only season entities, between seasons"', () => {
    expect(seasonIcon(BOTH, states('off', 'off'), COLORS)).toMatchObject({
      season: 'between',
      icon: 'mdi:sun-snowflake-variant',
      color: 'var(--secondary-text-color)',
      title: 'Between seasons',
    });
  });

  test('airflow-diagram-card "Tapping between seasons" opens the heating season entity', () => {
    expect(seasonIcon(BOTH, states('off', 'off'), COLORS)?.entityId).toBe('binary_sensor.hrv_heating');
  });

  test('both on counts as heating', () => {
    expect(seasonIcon(BOTH, states('on', 'on'), COLORS)?.season).toBe('heating');
  });

  test('airflow-diagram-card "One season entity, off": no icon', () => {
    expect(seasonIcon(HEATING_ONLY, states('off'), COLORS)).toBeUndefined();
    expect(seasonIcon(HEATING_ONLY, states('on'), COLORS)?.season).toBe('heating');
    const coolingOnly = { seasons: { cooling: 'binary_sensor.hrv_cooling' } };
    expect(seasonIcon(coolingOnly, states(undefined, 'off'), COLORS)).toBeUndefined();
    expect(seasonIcon(coolingOnly, states(undefined, 'on'), COLORS)?.season).toBe('cooling');
  });

  test('no icon while a season entity is unavailable and the other is off, or without season entities', () => {
    expect(seasonIcon(BOTH, states('unavailable', 'off'), COLORS)).toBeUndefined();
    expect(seasonIcon(BOTH, states(undefined, 'off'), COLORS)).toBeUndefined();
    expect(seasonIcon({}, states('on', 'off'), COLORS)).toBeUndefined();
  });
});
