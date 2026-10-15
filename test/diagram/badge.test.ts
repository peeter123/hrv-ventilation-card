import { describe, expect, test } from 'vitest';
import type { RecoveryResult } from '../../src/calc/recovery';
import { hasBadge, savingBadge } from '../../src/diagram/badge';
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
