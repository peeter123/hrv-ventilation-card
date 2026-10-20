import { describe, expect, test } from 'vitest';
import type { RecoveryResult } from '../../src/calc/recovery';
import {
  effectivenessLabel,
  hasBadge,
  hasRings,
  modeColor,
  moistureFigure,
  savingBadge,
  savingTarget,
} from '../../src/diagram/badge';
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
  effectiveness: {},
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

  test('airflow-diagram-card "Moisture recovered": water-sync and "120 g/h"', () => {
    expect(moistureFigure(withMoisture(120.3), ERV, LOCALE)).toEqual({
      text: '120',
      unit: 'g/h',
      icon: 'mdi:water-sync',
      title: nb('Moisture recovered: 120 g/h'),
    });
  });

  test('airflow-diagram-card "Moisture kept out": water-remove and "418 g/h" without a sign, the tooltip with the magnitude', () => {
    expect(moistureFigure(withMoisture(-418), ERV, LOCALE)).toEqual({
      text: '418',
      unit: 'g/h',
      icon: 'mdi:water-remove',
      title: nb('Moisture kept out: 418 g/h'),
    });
  });

  test('a rate that shows as 0 g/h counts as recovered', () => {
    expect(moistureFigure(withMoisture(-0.4), ERV, LOCALE)).toEqual({
      text: '0',
      unit: 'g/h',
      icon: 'mdi:water-sync',
      title: nb('Moisture recovered: 0 g/h'),
    });
  });

  test('the rate is formatted with the locale', () => {
    expect(moistureFigure(withMoisture(-1234), ERV, { language: 'de' })?.text).toBe('1.234');
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

describe('hasRings', () => {
  test('the badge inputs without the humidities: the three temperatures and the supply flow', () => {
    const { humidity: _outdoor, ...outdoor } = CALCULATION['outdoor'] as Record<string, string>;
    const sensible: CardConfig = {
      ...TEMPERATURES,
      outdoor,
      fans: CALCULATION['fans'],
    };
    expect(hasRings(sensible)).toBe(true);
    expect(hasBadge(sensible)).toBe(false);
    expect(hasRings(CALCULATION)).toBe(true);
    expect(hasRings(TEMPERATURES)).toBe(false);
    expect(hasRings({ ...sensible, extract: {} })).toBe(false);
  });
});

describe('modeColor', () => {
  test('cold in cooling, warm in heating and without a mode', () => {
    expect(modeColor('cooling', COLORS)).toBe(COLORS.cold);
    expect(modeColor('heating', COLORS)).toBe(COLORS.warm);
    expect(modeColor(undefined, COLORS)).toBe(COLORS.warm);
  });
});

describe('savingTarget', () => {
  const BOTH = { heating: 'sensor.heat', cooling: 'sensor.cool' };
  const reading = (state: string, unit = 'W') => ({ state, attributes: { unit_of_measurement: unit } });
  const states = (heat: ReturnType<typeof reading>, cool: ReturnType<typeof reading>) => ({
    'sensor.heat': heat,
    'sensor.cool': cool,
  });

  test('airflow-diagram-card "Higher saving opened": the higher reading, kW against W, also against the mode', () => {
    const readings = states(reading('1.2', 'kW'), reading('0', 'kW'));
    expect(savingTarget(result('heating', 1200), BOTH, readings)).toBe('sensor.heat');
    expect(savingTarget(result('cooling', 50), BOTH, readings)).toBe('sensor.heat');
    expect(savingTarget(result('heating', 50), BOTH, states(reading('900'), reading('1.2', 'kW')))).toBe('sensor.cool');
  });

  test('airflow-diagram-card "Cooling saving opened while cooling"', () => {
    expect(savingTarget(result('cooling', 300), BOTH, states(reading('0'), reading('300')))).toBe('sensor.cool');
  });

  test('airflow-diagram-card "Saving state not a number": falls back to the mode', () => {
    const readings = states(reading('unavailable'), reading('300'));
    expect(savingTarget(result('cooling', 300), BOTH, readings)).toBe('sensor.cool');
    expect(savingTarget(result('heating', 300), BOTH, readings)).toBe('sensor.heat');
    expect(savingTarget(result('heating', 300), BOTH, states(reading('5', 'furlongs'), reading('300')))).toBe(
      'sensor.heat',
    );
    expect(savingTarget(result('heating', 300), BOTH, {})).toBe('sensor.heat');
  });

  test('equal readings, also in different units, fall back to the mode', () => {
    const readings = states(reading('1000'), reading('1', 'kW'));
    expect(savingTarget(result('heating', 1000), BOTH, readings)).toBe('sensor.heat');
    expect(savingTarget(result('cooling', 1000), BOTH, readings)).toBe('sensor.cool');
  });

  test('airflow-diagram-card "Mode without its saving entity": one role opens only in its mode', () => {
    const readings = states(reading('500'), reading('0'));
    const heatingOnly = { heating: 'sensor.heat', cooling: undefined };
    expect(savingTarget(result('heating', 500), heatingOnly, readings)).toBe('sensor.heat');
    expect(savingTarget(result('cooling', 500), heatingOnly, readings)).toBeUndefined();
    expect(
      savingTarget(result('heating', 500), { heating: undefined, cooling: 'sensor.cool' }, readings),
    ).toBeUndefined();
  });

  test('airflow-diagram-card "No saving entity", or no calculated saving: nothing', () => {
    const none = { heating: undefined, cooling: undefined };
    expect(savingTarget(result('heating', 500), none, states(reading('1'), reading('2')))).toBeUndefined();
    expect(savingTarget(undefined, BOTH, states(reading('1'), reading('2')))).toBeUndefined();
  });
});

describe('effectivenessLabel', () => {
  const withFigures = (
    total?: number,
    moisture?: number,
    options: { mode?: 'heating' | 'cooling'; freeCooling?: boolean; rates?: [number, number] } = {},
  ): RecoveryResult => ({
    ...result(options.mode ?? 'heating', 100),
    freeCooling: options.freeCooling ?? false,
    recovered: { sensible: 1000.4, latent: 199.7 },
    lost: { sensible: 80, latent: 24 },
    ...(options.rates ? { moisture: { recovered: options.rates[0], extracted: options.rates[1], outside: 0 } } : {}),
    effectiveness: {
      ...(total === undefined ? {} : { total }),
      ...(moisture === undefined ? {} : { moisture }),
    },
  });

  test('airflow-diagram-card "Bypass closed": both figures with their absolute values, no bypass', () => {
    const closed = withFigures(92.4, 65.2, { rates: [390, 600] });
    const text = nb('Effectiveness: heat 92 % (1,200 / 1,304 W), moisture 65 % (390 / 600 g/h)');
    expect(effectivenessLabel(closed, 0, true, LOCALE)).toBe(text);
    expect(effectivenessLabel(closed, undefined, true, LOCALE)).toBe(text);
  });

  test('airflow-diagram-card "Bypass modulating": free cooling, a figure without a value is not measurable', () => {
    const modulating: RecoveryResult = {
      ...withFigures(61, undefined, { mode: 'cooling', freeCooling: true }),
      recovered: { sensible: 500, latent: 110 },
      lost: { sensible: 300, latent: 90 },
    };
    expect(effectivenessLabel(modulating, 40, true, LOCALE)).toBe(
      nb('Effectiveness: free cooling 61 % (610 / 1,000 W), moisture not measurable (bypass 40 %)'),
    );
  });

  test('airflow-diagram-card "Moisture kept out of the house": cooling, the rates as magnitudes', () => {
    // 200 m3/h with 14.0 g/m3 outdoor, 13.0 supply and 12.0 extract: the supply air brings in 200 g/h, 400 g/h leave.
    const flow = 200;
    const keptOut: RecoveryResult = {
      ...withFigures(76, ((13 - 14) / (12 - 14)) * 100, { mode: 'cooling' }),
      recovered: { sensible: 700, latent: 60 },
      lost: { sensible: 200, latent: 40 },
      moisture: { recovered: flow * (13 - 14), extracted: flow * (12 - 14), outside: flow * (12 - 13) },
    };
    expect(effectivenessLabel(keptOut, 0, true, LOCALE)).toBe(
      nb('Effectiveness: cooling 76 % (760 / 1,000 W), moisture 50 % (200 / 400 g/h)'),
    );
  });

  test('airflow-diagram-card "Recovery against the mode": the recovered figure gets a minus, the potential does not', () => {
    const against: RecoveryResult = {
      ...withFigures(0, 0, { mode: 'cooling', freeCooling: true }),
      recovered: { sensible: -100, latent: -20 },
      lost: { sensible: 900, latent: 220 },
      moisture: { recovered: 100, extracted: -800, outside: 0 },
    };
    expect(effectivenessLabel(against, 0, true, LOCALE)).toBe(
      nb('Effectiveness: free cooling 0 % (−120 / 1,000 W), moisture 0 % (−100 / 800 g/h)'),
    );
  });

  test('a ratio clamped to 100 % keeps magnitudes, however far the recovered part overshoots', () => {
    const over: RecoveryResult = {
      ...withFigures(100, 100, { rates: [-500, -400] }),
      recovered: { sensible: 1100, latent: 200 },
      lost: { sensible: -200, latent: -100 },
    };
    expect(effectivenessLabel(over, 0, true, LOCALE)).toBe(
      nb('Effectiveness: heat 100 % (1,300 / 1,000 W), moisture 100 % (500 / 400 g/h)'),
    );
  });

  test('airflow-diagram-card "Figure not measurable": the mode alone, no absolute values', () => {
    expect(effectivenessLabel(withFigures(), 0, false, LOCALE)).toBe('Effectiveness: heat not measurable');
  });

  test('airflow-diagram-card "Rings without a figure": no calculation leaves both not measurable', () => {
    expect(effectivenessLabel(undefined, 0, true, LOCALE)).toBe(
      'Effectiveness: not measurable, moisture not measurable',
    );
  });

  test('a moisture figure without moisture rates has no absolute values', () => {
    expect(effectivenessLabel(withFigures(92, 65), 0, true, LOCALE)).toBe(
      nb('Effectiveness: heat 92 % (1,200 / 1,304 W), moisture 65 %'),
    );
  });

  test('airflow-diagram-card "Rings by exchanger type": without a moisture ring the text leaves moisture out', () => {
    expect(effectivenessLabel(withFigures(92, 65, { rates: [390, 600] }), 25, false, LOCALE)).toBe(
      nb('Effectiveness: heat 92 % (1,200 / 1,304 W) (bypass 25 %)'),
    );
  });

  test('any bypass above 0 is named, as it turns the calculation to cooling: one decimal below 1 %', () => {
    const at = (bypass: number): string => effectivenessLabel(withFigures(92), bypass, false, LOCALE);
    expect(at(0)).toBe(nb('Effectiveness: heat 92 % (1,200 / 1,304 W)'));
    expect(at(0.3)).toBe(nb('Effectiveness: heat 92 % (1,200 / 1,304 W) (bypass 0.3 %)'));
    expect(at(0.04)).toBe(nb('Effectiveness: heat 92 % (1,200 / 1,304 W) (bypass 0.1 %)'));
    expect(at(1.4)).toBe(nb('Effectiveness: heat 92 % (1,200 / 1,304 W) (bypass 1 %)'));
  });

  test('the numbers are formatted with the locale and joined to their unit by a no-break space', () => {
    // Arabic-Indic digits, so a label that ignored the locale would fail.
    const text = effectivenessLabel(withFigures(92), 40, false, { language: 'ar-EG' });
    expect(text).toContain('٩٢ %');
    expect(text).toContain(' W)');
    expect(text).toContain('(bypass ٤٠ %)');
  });
});
