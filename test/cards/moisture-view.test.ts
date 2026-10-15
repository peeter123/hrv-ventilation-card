import { describe, expect, test } from 'vitest';
import type { MoistureRates } from '../../src/calc/recovery';
import {
  bypassPercent,
  directedFigures,
  isGaining,
  isNeutral,
  moistureHeader,
  moistureView,
  type MoistureSettings,
} from '../../src/cards/moisture-view';
import { nb } from '../nbsp';

const EN = { language: 'en', number_format: 'language' };
const SETTINGS: MoistureSettings = {
  dryingColor: '#00897b',
  gainingColor: '#8e24aa',
  neutralThreshold: 0.3,
  minScale: 250,
};
const DRYING: MoistureRates = { extracted: 250, recovered: 150, outside: 100 };
const GAINING: MoistureRates = { extracted: -120, recovered: -80, outside: -40 };
const APART = { indoor: 8.6, outdoor: 7.9 };

describe('direction, neutral band and bypass', () => {
  test('moisture-balance-card "House gaining": extracted -120 g/h is gaining and uses the gaining colour', () => {
    expect(isGaining(GAINING)).toBe(true);
    expect(isGaining(DRYING)).toBe(false);
    expect(isGaining({ extracted: 0, recovered: 0, outside: 0 })).toBe(false);
    const view = moistureView(GAINING, APART, undefined, SETTINGS, EN);
    expect(view.headerColor).toBe('#8e24aa');
    expect(view.title).toBe('Moisture Recovery');
    expect(view.subtitle).toBe('House gaining (outdoor more humid)');
  });

  test('moisture-balance-card "Within sensor accuracy": 8.1 vs 7.9 g/m³ is neutral, without a percentage', () => {
    expect(isNeutral({ indoor: 8.1, outdoor: 7.9 }, 0.3)).toBe(true);
    expect(isNeutral({ indoor: 8.3, outdoor: 7.9 }, 0.3)).toBe(false);
    const view = moistureView(DRYING, { indoor: 8.1, outdoor: 7.9 }, undefined, SETTINGS, EN);
    expect(view.title).toBe('Moisture Recovery');
    expect(view.subtitle).toBe('Indoor ≈ outdoor');
    expect(view.header).toBe('within sensor accuracy');
    expect(view.headerColor).toBeUndefined();
  });

  test('the bypass position is rounded and clamped; without a bypass it is 0', () => {
    expect(bypassPercent(undefined)).toBe(0);
    expect(bypassPercent(39.6)).toBe(40);
    expect(bypassPercent(120)).toBe(100);
    expect(bypassPercent(-3)).toBe(0);
  });
});

describe('headers', () => {
  test('moisture-balance-card "Drying header": subtitle "House drying", "Recovered 150 of 250 g/h (60 %)"', () => {
    expect(moistureHeader(DRYING, false, 0, EN)).toEqual({
      subtitle: 'House drying',
      header: nb('Recovered 150 of 250 g/h (60 %)'),
    });
  });

  test('moisture-balance-card "Gaining header": magnitudes without minus signs, "Kept out"', () => {
    expect(moistureHeader(GAINING, false, 0, EN)).toEqual({
      subtitle: 'House gaining (outdoor more humid)',
      header: nb('Kept out 80 of 120 g/h (67 %)'),
    });
  });

  test('moisture-balance-card "Bypass open": "(N %, with bypass 40 %)"', () => {
    expect(moistureHeader(DRYING, false, 40, EN).header).toBe(nb('Recovered 150 of 250 g/h (60 %, with bypass 40 %)'));
  });

  test('no percentage when nothing is extracted', () => {
    expect(moistureHeader({ extracted: 0, recovered: 10, outside: -10 }, false, 0, EN).header).toBe(
      nb('Recovered 10 of 0 g/h'),
    );
  });
});

describe('flow line and legend', () => {
  test('moisture-balance-card "Gaining legend": the flow line starts with "Outdoor Air Brings In"', () => {
    const view = moistureView(GAINING, APART, undefined, SETTINGS, EN);
    expect(view.lines[0]).toBe(nb('Outdoor Air Brings In 120 → Kept Out 80 + Enters 40 g/h'));
    expect(view.swatches).toMatchObject({ recovered: 'Kept Out', outside: 'Enters' });
  });

  test('drying: the flow line, the smoothed humidities and the scale', () => {
    const view = moistureView(DRYING, APART, undefined, SETTINGS, EN);
    expect(view.lines).toEqual([
      nb('Extracted 250 → Recovered 150 + Outside 100 g/h'),
      nb('Indoor 8.6 g/m³ · Outdoor 7.9 g/m³'),
      nb('Scale ±250 g/h'),
    ]);
    expect(view.swatches).toMatchObject({ recovered: 'Recovered', outside: 'Outside', color: '#00897b' });
  });

  test('a mixed case keeps the sign of the part that goes the other way', () => {
    expect(directedFigures({ extracted: 100, recovered: 150, outside: -50 }, EN)).toEqual({
      gaining: false,
      extracted: '100',
      recovered: '150',
      outside: '−50',
    });
  });
});

describe('moistureView', () => {
  test('moisture-balance-card "Drying": the title "Moisture Recovery" and the subtitle "House drying"', () => {
    const view = moistureView(DRYING, APART, undefined, SETTINGS, EN);
    expect(view.title).toBe('Moisture Recovery');
    expect(view.subtitle).toBe('House drying');
  });

  test('moisture-balance-card "Drying": a solid 150 and a hatched 100 g/h segment right of zero on a 250 g/h scale', () => {
    const view = moistureView(DRYING, APART, undefined, SETTINGS, EN);
    expect(view.segments).toEqual([
      { left: 50, width: 30, background: '#00897b' },
      { left: 80, width: 20, background: expect.stringContaining('repeating-linear-gradient') as unknown },
    ]);
  });

  test('the bypass strip is shown with its explanation only while the bypass is open', () => {
    expect(moistureView(DRYING, APART, 40, SETTINGS, EN).bypass).toEqual({
      position: 40,
      text: nb(
        'Bypass 40 % — part of the supply air skips the exchanger, so less is recovered (intended, free cooling)',
      ),
    });
    expect(moistureView(DRYING, APART, 0, SETTINGS, EN).bypass).toBeUndefined();
    expect(moistureView(DRYING, APART, undefined, SETTINGS, EN).bypass).toBeUndefined();
  });

  test('moisture-balance-card "No value": the same title, no subtitle, no bypass strip', () => {
    expect(moistureView(undefined, undefined, 40, SETTINGS, EN)).toEqual({
      title: 'Moisture Recovery',
      header: 'n/a',
      segments: [],
      swatches: undefined,
      lines: [],
    });
  });
});
