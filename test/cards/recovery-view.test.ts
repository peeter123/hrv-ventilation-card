import { describe, expect, test } from 'vitest';
import type { RecoveryResult } from '../../src/calc/recovery';
import { recoveryView, type LegendEntry, type RecoveryColors } from '../../src/cards/recovery-view';
import { nb } from '../nbsp';

const COLORS: RecoveryColors = {
  heating: { color: '#db4437', latent: '#f4a09a' },
  cooling: { color: '#039be5', latent: '#8fd3f7' },
};
const EN = { language: 'en', number_format: 'language' };

const result = (overrides: Partial<RecoveryResult> = {}): RecoveryResult => ({
  mode: 'heating',
  freeCooling: false,
  saving: 300,
  recovered: { sensible: 250, latent: 50 },
  lost: { sensible: 80, latent: 20 },
  latentKnown: true,
  moisture: { extracted: 200, recovered: 120, outside: 80 },
  ...overrides,
});

const texts = (legend: LegendEntry[]): string[] =>
  legend.map((entry) => (entry.kind === 'text' ? entry.text : `${entry.label}: ${entry.recovered} | ${entry.lost}`));

describe('recoveryView', () => {
  test('recovery-balance-card "Positive potential": "Recovered 300 W of 400 W (75 %)"', () => {
    const view = recoveryView(result(), { colors: COLORS, minScale: 500 }, EN);
    expect(view.title).toBe('Heat Recovery');
    expect(view.header).toBe(nb('Recovered 300 W of 400 W (75 %)'));
    expect(view.headerColor).toBe('#db4437');
  });

  test('without a positive potential the header has no percentage', () => {
    const view = recoveryView(
      result({ recovered: { sensible: 0, latent: 0 }, lost: { sensible: 0, latent: 0 } }),
      { colors: COLORS, minScale: 500 },
      EN,
    );
    expect(view.header).toBe(nb('Recovered 0 W'));
  });

  test('recovery-balance-card "Free cooling": the bypass case reads as cooling delivered', () => {
    const view = recoveryView(
      result({
        mode: 'cooling',
        freeCooling: true,
        recovered: { sensible: 974, latent: 246 },
        lost: { sensible: 51, latent: 10 },
      }),
      { colors: COLORS, minScale: 500 },
      EN,
    );
    expect(view.title).toBe('Free Cooling');
    expect(view.header).toBe(nb('Cooling 1,220 W of 1,281 W (95 %)'));
    expect(view.headerColor).toBe('#039be5');
    expect(texts(view.legend).slice(0, 2)).toEqual([
      nb('Temperature: Cooling 974 W | Missed 51 W'),
      nb('Moisture: Cooling 246 W | Missed 10 W'),
    ]);
  });

  test('recovery-balance-card "Water kept out": a negative rate shows as "Water Kept Out 418 g/h"', () => {
    const moisture = { extracted: -706, recovered: -418, outside: -288 };
    const view = recoveryView(result({ moisture }), { colors: COLORS, minScale: 500 }, EN);
    expect(texts(view.legend)).toContain(nb('Water Kept Out 418 g/h'));
  });

  test('recovery-balance-card "Water recovered": the legend shows "Water Recovered 120 g/h"', () => {
    const view = recoveryView(result(), { colors: COLORS, minScale: 500 }, EN);
    expect(texts(view.legend)).toEqual([
      nb('Temperature: Recovered 250 W | Lost 80 W'),
      nb('Moisture: Recovered 50 W | Lost 20 W'),
      nb('Water Recovered 120 g/h'),
      nb('Scale ±500 W'),
    ]);
  });

  test('recovery-balance-card "Unit without humidity sensors": no moisture or water entries, one lane', () => {
    const view = recoveryView(
      result({ latentKnown: false, recovered: { sensible: 300, latent: 0 }, lost: { sensible: 100, latent: 0 } }),
      { colors: COLORS, minScale: 500 },
      EN,
    );
    expect(view.lanes).toHaveLength(1);
    expect(view.lanes[0]).toHaveLength(2);
    expect(texts(view.legend)).toEqual([nb('Temperature: Recovered 300 W | Lost 100 W'), nb('Scale ±500 W')]);
  });

  test('cooling uses the cooling title and colours', () => {
    const view = recoveryView(result({ mode: 'cooling' }), { colors: COLORS, minScale: 500 }, EN);
    expect(view.title).toBe('Cooling Recovery');
    expect(view.headerColor).toBe('#039be5');
    expect(view.lanes[0]?.[0]?.background).toBe('#039be5');
  });

  test('recovery-balance-card "Two lanes": temperature then moisture, each recovered solid then lost hatched', () => {
    const view = recoveryView(
      result({ recovered: { sensible: 500, latent: 100 }, lost: { sensible: 120, latent: 40 } }),
      { colors: COLORS, minScale: 500 },
      EN,
    );
    const hatched = (color: string) =>
      expect.stringMatching(new RegExp(`repeating-linear-gradient.*${color}`)) as unknown;
    expect(view.lanes.map((lane) => lane.map((segment) => segment.background))).toEqual([
      ['#db4437', hatched('#db4437')],
      ['#f4a09a', hatched('#f4a09a')],
    ]);
    // The scale of the fuller lane: 620 W rounds up to 750 W, so 500 W is a third of the bar.
    expect(texts(view.legend).at(-1)).toBe(nb('Scale ±750 W'));
    expect(view.lanes[0]?.[0]).toMatchObject({ left: 50 });
    expect(view.lanes[0]?.[0]?.width).toBeCloseTo((500 / 750) * 50, 9);
    expect(view.lanes[1]?.[0]).toMatchObject({ left: 50 });
    expect(view.lanes[1]?.[0]?.width).toBeCloseTo((100 / 750) * 50, 9);
  });

  test('recovery-balance-card "Opposite signs": each lane grows to its own side', () => {
    const view = recoveryView(
      result({ recovered: { sensible: 200, latent: -50 }, lost: { sensible: 0, latent: 0 } }),
      { colors: COLORS, minScale: 500 },
      EN,
    );
    const [sensible, latent] = view.lanes.map((lane) => lane[0]);
    expect(sensible).toMatchObject({ left: 50 });
    expect((latent?.left ?? 0) + (latent?.width ?? 0)).toBeCloseTo(50, 9);
  });

  test('a negative value is written with a minus sign and the locale format is used', () => {
    const view = recoveryView(
      result({ recovered: { sensible: -1250, latent: 50 } }),
      { colors: COLORS, minScale: 500 },
      { language: 'en', number_format: 'decimal_comma' },
    );
    expect(texts(view.legend)[0]).toBe(nb('Temperature: Recovered −1.250 W | Lost 80 W'));
  });

  test('without a result: the no-value view', () => {
    const view = recoveryView(undefined, { colors: COLORS, minScale: 500 }, EN);
    expect(view).toEqual({ title: 'Recovery', header: 'n/a', lanes: [], legend: [] });
  });
});
