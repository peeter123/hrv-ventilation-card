import { describe, expect, test } from 'vitest';
import type { RecoveryResult } from '../../src/calc/recovery';
import { hasBadge, moistureFigure, savingBadge } from '../../src/diagram/badge';
import type { CardConfig } from '../../src/lib/config';
import { nb } from '../nbsp';

const COLORS = { cold: '#039be5', warm: '#db4437' };
const OPTIONS = { colors: COLORS, showUnavailable: false };
const LOCALE = { language: 'en', number_format: 'language' };

const result = (mode: 'heating' | 'cooling', saving: number): RecoveryResult => ({
  mode,
  freeCooling: false,
  saving,
  recovered: { sensible: saving, latent: 0 },
  lost: { sensible: 0, latent: 0 },
  latentKnown: true,
});

const TEMPERATURES: CardConfig = {
  outdoor: { temperature: 'sensor.hrv_outdoor_t' },
  supply: { temperature: 'sensor.hrv_supply_t' },
  extract: { temperature: 'sensor.hrv_extract_t' },
  exhaust: { temperature: 'sensor.hrv_exhaust_t' },
};
const CALCULATION: CardConfig = {
  outdoor: { temperature: 'sensor.hrv_outdoor_t', humidity: 'sensor.hrv_outdoor_rh' },
  supply: { temperature: 'sensor.hrv_supply_t', absolute_humidity: 'sensor.hrv_supply_ah' },
  extract: { temperature: 'sensor.hrv_extract_t', humidity: 'sensor.hrv_extract_rh' },
  exhaust: { temperature: 'sensor.hrv_exhaust_t' },
  fans: { supply_flow: 'sensor.hrv_supply_flow' },
};

describe('savingBadge', () => {
  test('airflow-diagram-card "Heating saving": a warm badge shows "120 W"', () => {
    expect(savingBadge(result('heating', 120.4), OPTIONS, LOCALE)).toEqual({
      kind: 'warm',
      text: nb('120 W'),
      tint: '#db4437',
    });
  });

  test('a cooling saving gives a cold badge, formatted with the locale', () => {
    expect(savingBadge(result('cooling', 1234), OPTIONS, { language: 'de' })).toEqual({
      kind: 'cold',
      text: nb('1.234 W'),
      tint: '#039be5',
    });
  });

  test('airflow-diagram-card "Saving below threshold": a grey badge shows the saving', () => {
    expect(savingBadge(result('heating', 0.4), OPTIONS, LOCALE)).toEqual({ kind: 'grey', text: nb('0 W') });
    expect(savingBadge(result('cooling', 0.5), OPTIONS, LOCALE)).toEqual({ kind: 'grey', text: nb('1 W') });
    expect(savingBadge(result('heating', 0.51), OPTIONS, LOCALE)?.kind).toBe('warm');
    expect(savingBadge(result('heating', 0), OPTIONS, LOCALE)).toEqual({ kind: 'grey', text: nb('0 W') });
  });

  test('airflow-diagram-card "Calculation input unavailable": no badge, or a grey "n/a" with show_unavailable', () => {
    expect(savingBadge(undefined, OPTIONS, LOCALE)).toBeUndefined();
    expect(savingBadge(undefined, { ...OPTIONS, showUnavailable: true }, LOCALE)).toEqual({
      kind: 'grey',
      text: 'n/a',
    });
  });

  test('airflow-diagram-card "Custom warm colour": the badge is tinted with it', () => {
    const colors = { ...COLORS, warm: 'orange' };
    expect(savingBadge(result('heating', 300), { colors, showUnavailable: false }, LOCALE)?.tint).toBe('orange');
  });
});

describe('moistureFigure', () => {
  const ERV = { exchanger: 'erv', badge: true, showUnavailable: false } as const;
  const withMoisture = (recovered: number): RecoveryResult => ({
    ...result('heating', 300),
    moisture: { extracted: 500, recovered, outside: 500 - recovered },
  });

  test('airflow-diagram-card "Moisture recovered": "120 g/h"', () => {
    expect(moistureFigure(withMoisture(120.3), ERV, LOCALE)).toEqual({
      text: nb('120 g/h'),
      title: nb('Moisture recovered: 120 g/h'),
    });
  });

  test('airflow-diagram-card "Moisture kept out": "−418 g/h", the tooltip with the magnitude', () => {
    expect(moistureFigure(withMoisture(-418), ERV, LOCALE)).toEqual({
      text: nb('−418 g/h'),
      title: nb('Moisture kept out: 418 g/h'),
    });
  });

  test('a rate that shows as 0 g/h has no sign and counts as recovered', () => {
    expect(moistureFigure(withMoisture(-0.4), ERV, LOCALE)).toEqual({
      text: nb('0 g/h'),
      title: nb('Moisture recovered: 0 g/h'),
    });
  });

  test('the rate is formatted with the locale', () => {
    expect(moistureFigure(withMoisture(-1234), ERV, { language: 'de' })?.text).toBe(nb('−1.234 g/h'));
  });

  test('airflow-diagram-card "Input unavailable": hidden, or "n/a" with show_unavailable, like the badge', () => {
    expect(moistureFigure(undefined, ERV, LOCALE)).toBeUndefined();
    expect(moistureFigure(undefined, { ...ERV, showUnavailable: true }, LOCALE)).toEqual({
      text: 'n/a',
      title: 'Moisture recovery: n/a',
    });
    // A result without moisture rates counts as no value.
    expect(moistureFigure(result('heating', 300), ERV, LOCALE)).toBeUndefined();
  });

  test('airflow-diagram-card "HRV": no figure, also with humidity', () => {
    expect(moistureFigure(withMoisture(120), { ...ERV, exchanger: 'hrv' }, LOCALE)).toBeUndefined();
    expect(moistureFigure(undefined, { ...ERV, exchanger: 'hrv', showUnavailable: true }, LOCALE)).toBeUndefined();
  });

  test('no figure without the badge inputs, also with show_unavailable', () => {
    expect(moistureFigure(undefined, { ...ERV, badge: false, showUnavailable: true }, LOCALE)).toBeUndefined();
  });
});

describe('hasBadge', () => {
  test('airflow-diagram-card "No calculation inputs": only the four temperatures give no badge', () => {
    expect(hasBadge(TEMPERATURES)).toBe(false);
  });

  test('temperatures, a humidity per stream (relative or absolute) and the supply flow give a badge', () => {
    expect(hasBadge(CALCULATION)).toBe(true);
    expect(hasBadge({ ...CALCULATION, fans: {} })).toBe(false);
    expect(hasBadge({ ...CALCULATION, supply: { temperature: 'sensor.hrv_supply_t' } })).toBe(false);
  });
});
