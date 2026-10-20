import { describe, expect, test } from 'vitest';
import {
  calculateRecovery,
  DEFAULT_AIR_DENSITY,
  type RecoveryInputs,
  type RecoveryResult,
} from '../../src/calc/recovery';
import golden from '../vectors.json';

interface Vector {
  name: string;
  inputs: {
    outdoor: { temperature: number; absolute_humidity: number };
    supply: { temperature: number; absolute_humidity: number };
    extract: { temperature: number; absolute_humidity: number };
    supply_flow: number;
    bypass: number;
  };
  expected: {
    mode: 'heating' | 'cooling';
    saving_w: number;
    recovered_w: { sensible: number; latent: number };
    lost_w: { sensible: number; latent: number };
    moisture_gh: { extracted: number; recovered: number; outside: number };
    /** The macro's whole percentages; null where it gives None (bypass open, or the gradient under its gate) */
    eff_sensible: number | null;
    eff_moisture: number | null;
  };
}

const vectors = golden.vectors as Vector[];
const { w: TOLERANCE_W, gh: TOLERANCE_GH } = golden.tolerance;
const TOLERANCE_PCT = 1; // the macro rounds to whole percentages
const near = (actual: number | undefined, expected: number, tolerance: number): void => {
  expect(actual).toBeDefined();
  expect(Math.abs((actual ?? NaN) - expected)).toBeLessThanOrEqual(tolerance);
};
const byName = (name: string): Vector => {
  const vector = vectors.find((v) => v.name === name);
  if (!vector) throw new Error(`no vector ${name}`);
  return vector;
};

const toInputs = ({ inputs }: Vector): RecoveryInputs => ({
  temperature: {
    outdoor: inputs.outdoor.temperature,
    supply: inputs.supply.temperature,
    extract: inputs.extract.temperature,
  },
  absoluteHumidity: {
    outdoor: inputs.outdoor.absolute_humidity,
    supply: inputs.supply.absolute_humidity,
    extract: inputs.extract.absolute_humidity,
  },
  supplyFlow: inputs.supply_flow,
  bypass: inputs.bypass,
  airDensity: DEFAULT_AIR_DENSITY,
});

const calculate = (inputs: RecoveryInputs): RecoveryResult => {
  const result = calculateRecovery(inputs);
  if (!result) throw new Error('no result');
  return result;
};

describe('golden vectors (recovery-calculation "Golden vectors")', () => {
  test('the file holds at least 15 vectors', () => {
    expect(vectors.length).toBeGreaterThanOrEqual(15);
  });

  test.each(vectors.map((vector) => [vector.name, vector] as const))('%s', (_name, vector) => {
    const result = calculate(toInputs(vector));
    const { expected } = vector;
    expect(result.mode).toBe(expected.mode);
    near(result.saving, expected.saving_w, TOLERANCE_W);
    near(result.recovered.sensible, expected.recovered_w.sensible, TOLERANCE_W);
    near(result.recovered.latent, expected.recovered_w.latent, TOLERANCE_W);
    near(result.lost.sensible, expected.lost_w.sensible, TOLERANCE_W);
    near(result.lost.latent, expected.lost_w.latent, TOLERANCE_W);
    near(result.moisture?.extracted, expected.moisture_gh.extracted, TOLERANCE_GH);
    near(result.moisture?.recovered, expected.moisture_gh.recovered, TOLERANCE_GH);
    near(result.moisture?.outside, expected.moisture_gh.outside, TOLERANCE_GH);
  });

  // The macro rounds to whole percentages, does not cap and has a bypass gate the calculation lacks: compare only
  // where the macro gives a value from 0 to 100.
  const inRange = (value: number | null): value is number => value !== null && value >= 0 && value <= 100;

  test.each(vectors.map((vector) => [vector.name, vector] as const))('%s: effectiveness', (_name, vector) => {
    const { effectiveness } = calculate(toInputs(vector));
    const { eff_sensible: sensible, eff_moisture: moisture } = vector.expected;
    if (inRange(sensible)) near(effectiveness.temperature, sensible, TOLERANCE_PCT);
    if (inRange(moisture)) near(effectiveness.moisture, moisture, TOLERANCE_PCT);
    // With the bypass closed the macro's null comes from the gradient gate alone.
    if (vector.inputs.bypass === 0 && sensible === null) expect(effectiveness.temperature).toBeUndefined();
    if (vector.inputs.bypass === 0 && moisture === null) expect(effectiveness.moisture).toBeUndefined();
  });

  test('the macro gives a value from 0 to 100 on several sets', () => {
    const compared = vectors.filter((v) => inRange(v.expected.eff_sensible) || inRange(v.expected.eff_moisture));
    expect(compared.length).toBeGreaterThanOrEqual(10);
  });
});

describe('history vectors against the recorded helpers', () => {
  // kW to 3 decimals and whole g/h: within half a unit of the helpers' rounding.
  const recorded = (golden.vectors as (Vector & { helpers_recorded?: Record<string, number> })[]).filter(
    (vector) => vector.helpers_recorded !== undefined,
  );

  test('the vectors with recorded helper values are the three checked moments', () => {
    expect(recorded.map((vector) => vector.name)).toEqual([
      'history_2026-09-30_1200',
      'history_2026-10-06_1300',
      'history_2026-10-12_1830',
    ]);
  });

  test.each(recorded.map((vector) => [vector.name, vector] as const))('%s', (_name, vector) => {
    const { expected } = vector;
    const [mode, other] = expected.mode === 'heating' ? ['heating', 'cooling'] : ['cooling', 'heating'];
    const computed: Record<string, number> = {
      [`${mode}_power_kw`]: expected.saving_w,
      [`${other}_power_kw`]: 0,
      [`${mode}_sensible_kw`]: expected.recovered_w.sensible,
      [`${mode}_latent_kw`]: expected.recovered_w.latent,
      [`${mode}_loss_sensible_kw`]: expected.lost_w.sensible,
      [`${mode}_loss_latent_kw`]: expected.lost_w.latent,
      moisture_recovery_rate_gh: expected.moisture_gh.recovered,
      moisture_loss_rate_gh: expected.moisture_gh.outside,
      moisture_loss_rate_hrv_gh: expected.moisture_gh.extracted,
    };
    for (const [key, value] of Object.entries(vector.helpers_recorded ?? {})) {
      const scaled = key.endsWith('_kw') ? value * 1000 : value;
      expect(Math.abs((computed[key] ?? NaN) - scaled), key).toBeLessThanOrEqual(0.5 + 1e-6);
    }
  });
});

describe('recovery-calculation scenarios', () => {
  const winter = toInputs(byName('winter_design'));

  test('"Default density": at the default air density the results equal those of the macro', () => {
    expect(DEFAULT_AIR_DENSITY).toBe(1.2);
    // The vectors store 4 decimals.
    expect(calculate(winter).recovered.sensible).toBeCloseTo(byName('winter_design').expected.recovered_w.sensible, 3);
  });

  test('"Unit at altitude": at 1.0 kg/m³ the dry-air part of each sensible part scales by 1.0/1.2', () => {
    const base = calculate(winter);
    const altitude = calculate({ ...winter, airDensity: 1.0 });
    // Sensible = dry air (rho * 1006 * dT) + the vapour term 1.86 * (T * AH) differences, which does not depend on
    // the density. Winter vector, heating: recovered between supply and outdoor, lost between extract and supply.
    const { outdoor, supply, extract, supply_flow } = byName('winter_design').inputs;
    const vapour = (s: { temperature: number; absolute_humidity: number }): number =>
      1.86 * s.temperature * s.absolute_humidity * (supply_flow / 3600);
    const vapourRecovered = vapour(supply) - vapour(outdoor);
    const vapourLost = vapour(extract) - vapour(supply);
    expect(altitude.recovered.sensible - vapourRecovered).toBeCloseTo(
      ((base.recovered.sensible - vapourRecovered) * 1.0) / 1.2,
      9,
    );
    expect(altitude.lost.sensible - vapourLost).toBeCloseTo(((base.lost.sensible - vapourLost) * 1.0) / 1.2, 9);
    expect(altitude.recovered.latent).toBeCloseTo(base.recovered.latent, 9);
    expect(altitude.lost.latent).toBeCloseTo(base.lost.latent, 9);
    expect(altitude.moisture).toEqual(base.moisture);
  });

  test('"Winter heating": recovered 1324 + 400 W, lost 314 + 160 W, moisture 575 / 230 / 805 g/h', () => {
    const result = calculate(winter);
    expect(result.mode).toBe('heating');
    expect(Math.round(result.recovered.sensible)).toBe(1324);
    expect(Math.abs(result.recovered.latent - 400)).toBeLessThanOrEqual(1);
    expect(Math.round(result.lost.sensible)).toBe(314);
    expect(Math.round(result.lost.latent)).toBe(160);
    expect(result.moisture).toEqual({ extracted: 805, recovered: 575, outside: 230 });
  });

  test('"Opposite signs": 2026-09-30 12:00 has a negative sensible and a positive latent part', () => {
    const result = calculate(toInputs(byName('history_2026-09-30_1200')));
    expect(result.recovered.sensible).toBeLessThan(0);
    expect(result.recovered.latent).toBeGreaterThan(0);
  });

  test('"Bypass open on a mild day": bypass 40 % with outdoor enthalpy below extract is free cooling', () => {
    const result = calculate({ ...winter, bypass: 40 });
    expect(result.mode).toBe('cooling');
    expect(result.freeCooling).toBe(true);
  });

  test('"Cooling without bypass": warmer outdoor air with the bypass closed is cooling recovery, not free cooling', () => {
    const summer = toInputs(byName('history_2026-09-30_1200'));
    const result = calculate({ ...summer, bypass: 0 });
    expect(result.freeCooling).toBe(false);
    expect(calculate(winter).freeCooling).toBe(false);
  });

  test('"House gaining moisture": extracted is negative and equals recovered plus outside', () => {
    const { moisture } = calculate(toInputs(byName('house_gaining')));
    expect(moisture?.extracted).toBeLessThan(0);
    expect(moisture?.extracted).toBeCloseTo((moisture?.recovered ?? 0) + (moisture?.outside ?? 0), 9);
  });

  test('"Temperatures only": sensible parts are calculated, latent parts are 0 and there are no moisture figures', () => {
    const { absoluteHumidity: _humidity, ...temperaturesOnly } = winter;
    const result = calculate(temperaturesOnly);
    expect(result.mode).toBe('heating');
    expect(result.latentKnown).toBe(false);
    expect(result.recovered.latent).toBe(0);
    expect(result.lost.latent).toBe(0);
    expect(result.moisture).toBeUndefined();
    // Dry air only: 1.2 * 1006 * 17 K * 230 m³/h / 3600
    expect(result.recovered.sensible).toBeCloseTo((1.2 * 1006 * 17 * 230) / 3600, 6);
    expect(result.saving).toBeCloseTo(result.recovered.sensible, 9);
  });

  test('"Supply flow unavailable": no figures', () => {
    expect(calculateRecovery({ ...winter, supplyFlow: undefined })).toBeUndefined();
    expect(calculateRecovery({ ...winter, supplyFlow: Number.NaN })).toBeUndefined();
  });

  test('a temperature, a humidity or the bypass without a value gives no figures', () => {
    expect(calculateRecovery({ ...winter, temperature: { ...winter.temperature, supply: undefined } })).toBeUndefined();
    const humidity = { outdoor: 4.0, supply: undefined, extract: 7.5 };
    expect(calculateRecovery({ ...winter, absoluteHumidity: humidity })).toBeUndefined();
    expect(calculateRecovery({ ...winter, bypass: undefined })).toBeUndefined();
  });

  test('an air density that is not a positive number gives no figures', () => {
    for (const airDensity of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(calculateRecovery({ ...winter, airDensity }), String(airDensity)).toBeUndefined();
    }
  });

  test('the total is clamped at 0 while the parts keep their signs', () => {
    const result = calculate(toInputs(byName('negative_delta_heating')));
    expect(result.saving).toBe(0);
    expect(result.recovered.sensible + result.recovered.latent).toBeLessThan(0);
  });

  describe('effectiveness', () => {
    const temperatureEffectiveness = (outdoor: number, supply: number, extract: number, bypass = 0) =>
      calculate({ ...winter, temperature: { outdoor, supply, extract }, bypass }).effectiveness.temperature;
    const moistureEffectiveness = (outdoor: number, supply: number, extract: number) =>
      calculate({ ...winter, absoluteHumidity: { outdoor, supply, extract } }).effectiveness.moisture;

    test('"Winter heating": 0 °C / 4.0 g/m³, 17 °C / 6.5 g/m³, 21 °C / 7.5 g/m³ gives 81 % and 71 % within 1 %', () => {
      const { effectiveness } = calculate(winter);
      near(effectiveness.temperature, 81, 1);
      near(effectiveness.moisture, 71, 1);
    });

    test('"Bypass modulating": at 40 % bypass, outdoor 12 °C, supply 17 °C, extract 22 °C is 50 %', () => {
      expect(temperatureEffectiveness(12, 17, 22, 40)).toBeCloseTo(50, 9);
    });

    test('"Outdoor air more humid": 14.0, 13.0 and 12.0 g/m³ give a positive 50 %', () => {
      expect(moistureEffectiveness(14.0, 13.0, 12.0)).toBeCloseTo(50, 9);
    });

    test('"Ratio below 0": outdoor 10.0 °C, supply 9.5 °C, extract 20.0 °C gives 0 %', () => {
      expect(temperatureEffectiveness(10.0, 9.5, 20.0)).toBe(0);
    });

    test('"Ratio above 100": outdoor 5 °C, supply 21.5 °C, extract 21 °C gives 100 %', () => {
      expect(temperatureEffectiveness(5, 21.5, 21)).toBe(100);
    });

    test('"Small temperature gradient": extract 22 °C and outdoor 20 °C give no temperature effectiveness', () => {
      expect(temperatureEffectiveness(20, 21, 22)).toBeUndefined();
      // Exactly at the gate it is given.
      expect(temperatureEffectiveness(19, 21, 22)).toBeCloseTo(66.67, 2);
    });

    test('the gradient gate holds in both directions and at its boundaries', () => {
      expect(temperatureEffectiveness(30, 24, 22)).toBeCloseTo(75, 9); // summer: outdoor warmer than extract
      expect(temperatureEffectiveness(20, 20, 20)).toBeUndefined(); // zero gradient, no NaN
      expect(moistureEffectiveness(6.0, 6.75, 7.5)).toBeCloseTo(50, 9); // exactly 1.5 g/m³
      expect(moistureEffectiveness(6.0, 6.7, 7.4)).toBeUndefined();
    });

    test('"One figure gated": 8 K and 0.7 g/m³ apart give the temperature effectiveness only', () => {
      const result = calculate({
        ...winter,
        temperature: { outdoor: 12, supply: 19, extract: 20 },
        absoluteHumidity: { outdoor: 6.0, supply: 6.4, extract: 6.7 },
      });
      expect(result.effectiveness.temperature).toBeCloseTo(87.5, 9);
      expect(result.effectiveness.moisture).toBeUndefined();
    });

    test('"No humidity configured": temperatures 10 K apart give the temperature effectiveness only', () => {
      const { absoluteHumidity: _humidity, ...temperaturesOnly } = winter;
      const result = calculate({ ...temperaturesOnly, temperature: { outdoor: 10, supply: 17, extract: 20 } });
      expect(result.effectiveness.temperature).toBeCloseTo(70, 9);
      expect(result.effectiveness.moisture).toBeUndefined();
    });
  });
});
