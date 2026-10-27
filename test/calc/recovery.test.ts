import { describe, expect, test } from 'vitest';
import {
  calculateRecovery,
  DEFAULT_AIR_DENSITY,
  type RecoveryInputs,
  type RecoveryResult,
} from '../../src/calc/recovery';
import { recoveryView } from '../../src/cards/recovery-view';
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
    /** The macro's whole percentage; null where it gives None (bypass open, or the gradient under its gate) */
    eff_moisture: number | null;
  };
}

const COLORS = {
  heating: { color: '#db4437', latent: '#f4a09a' },
  cooling: { color: '#039be5', latent: '#8fd3f7' },
};
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

  // The macro rounds eff_moisture to whole percentages, does not cap and has a bypass gate the calculation lacks:
  // compare only where the macro gives a value from 0 to 100.
  const inRange = (value: number | null): value is number => value !== null && value >= 0 && value <= 100;
  const enthalpy = (stream: { temperature: number; absolute_humidity: number }): number =>
    DEFAULT_AIR_DENSITY * 1006 * stream.temperature + stream.absolute_humidity * (2501 + 1.86 * stream.temperature);
  const aboveGate = ({ inputs }: Vector): boolean =>
    Math.abs(enthalpy(inputs.extract) - enthalpy(inputs.outdoor)) >= DEFAULT_AIR_DENSITY * 1006 * 3;
  // The macro's recovered share: recovered total / (recovered + lost total) of the expected power figures.
  const macroTotal = ({ expected }: Vector): number => {
    const recovered = expected.recovered_w.sensible + expected.recovered_w.latent;
    const lost = expected.lost_w.sensible + expected.lost_w.latent;
    return Math.min(Math.max((recovered / (recovered + lost)) * 100, 0), 100);
  };

  test.each(vectors.map((vector) => [vector.name, vector] as const))('%s: effectiveness', (_name, vector) => {
    const { effectiveness } = calculate(toInputs(vector));
    const { eff_moisture: moisture } = vector.expected;
    // Without flow the macro's powers are all 0 and there is no potential: neither figure is measurable
    // (recovery-calculation "Unit in standby").
    if (vector.inputs.supply_flow === 0) {
      expect(effectiveness).toEqual({});
      return;
    }
    if (!aboveGate(vector)) expect(effectiveness.total).toBeUndefined();
    else near(effectiveness.total, macroTotal(vector), TOLERANCE_PCT);
    if (inRange(moisture)) near(effectiveness.moisture, moisture, TOLERANCE_PCT);
    // With the bypass closed the macro's null comes from the gradient gate alone.
    if (vector.inputs.bypass === 0 && moisture === null) expect(effectiveness.moisture).toBeUndefined();
  });

  test('the total effectiveness equals the recovery card header percentage within 1 % on every set (recovery-calculation "Matches the recovery card")', () => {
    let compared = 0;
    for (const vector of vectors) {
      const result = calculate(toInputs(vector));
      const { total } = result.effectiveness;
      if (total === undefined) continue;
      const header = recoveryView(
        result,
        { colors: COLORS, minScale: 100 },
        { language: 'en', number_format: 'language' },
      ).header;
      const match = /\(([^)]*?)\s%\)/.exec(header); // \s matches the no-break space
      if (!match?.[1]) continue; // no potential: no percentage in the header
      const shown = Number(match[1].replace('−', '-').replace(/,/g, ''));
      near(total, Math.min(Math.max(shown, 0), 100), TOLERANCE_PCT);
      compared += 1;
    }
    expect(compared).toBeGreaterThanOrEqual(10);
  });

  test('the macro gives a value from 0 to 100 on several sets', () => {
    expect(vectors.filter(aboveGate).length).toBeGreaterThanOrEqual(10);
    expect(vectors.filter((v) => inRange(v.expected.eff_moisture)).length).toBeGreaterThanOrEqual(10);
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
    // Without humidity the enthalpies are sensible only: the total is the temperature ratio.
    const { absoluteHumidity: _humidity, ...temperaturesOnly } = winter;
    const totalEffectiveness = (outdoor: number, supply: number, extract: number, bypass = 0) =>
      calculate({ ...temperaturesOnly, temperature: { outdoor, supply, extract }, bypass }).effectiveness.total;
    const moistureEffectiveness = (outdoor: number, supply: number, extract: number) =>
      calculate({ ...winter, absoluteHumidity: { outdoor, supply, extract } }).effectiveness.moisture;

    test('"Winter heating": 0 °C / 4.0 g/m³, 17 °C / 6.5 g/m³, 21 °C / 7.5 g/m³ gives 78 % and 71 % within 1 %', () => {
      const { effectiveness } = calculate(winter);
      near(effectiveness.total, 78, 1);
      near(effectiveness.moisture, 71, 1);
    });

    test('"Latent heat counts": supply at the outdoor humidity (as for an HRV) gives 60 %, below the 81 % of the temperatures', () => {
      const humidity = { outdoor: 4.0, supply: 4.0, extract: 7.5 };
      const { effectiveness } = calculate({ ...winter, absoluteHumidity: humidity });
      near(effectiveness.total, 60, 1);
    });

    test('"Humid summer day": 24 °C / 14.0, 23.2 °C / 11.0, 23 °C / 10.0 g/m³ gives 76 % with 1 K between the temperatures', () => {
      const result = calculate({
        ...winter,
        temperature: { outdoor: 24, supply: 23.2, extract: 23 },
        absoluteHumidity: { outdoor: 14.0, supply: 11.0, extract: 10.0 },
      });
      near(result.effectiveness.total, 76, 1);
    });

    test('"Free cooling": at 40 % bypass, no humidity, outdoor 12 °C, supply 14 °C, extract 22 °C gives 80 %', () => {
      const result = calculate({
        ...temperaturesOnly,
        temperature: { outdoor: 12, supply: 14, extract: 22 },
        bypass: 40,
      });
      expect(result.effectiveness.total).toBeCloseTo(80, 9);
    });

    test('"Bypass modulating": at 40 % bypass, outdoor 12 °C, supply 17 °C, extract 22 °C is 50 %', () => {
      expect(totalEffectiveness(12, 17, 22, 40)).toBeCloseTo(50, 9);
    });

    test('"Outdoor air more humid": 14.0, 13.0 and 12.0 g/m³ give a positive 50 %', () => {
      expect(moistureEffectiveness(14.0, 13.0, 12.0)).toBeCloseTo(50, 9);
    });

    test('"Ratio below 0": outdoor 10.0 °C, supply 9.5 °C, extract 20.0 °C gives 0 %', () => {
      expect(totalEffectiveness(10.0, 9.5, 20.0)).toBe(0);
    });

    test('"Ratio above 100": outdoor 5 °C, supply 21.5 °C, extract 21 °C gives 100 %', () => {
      expect(totalEffectiveness(5, 21.5, 21)).toBe(100);
    });

    test('"Small gradient": extract 22 °C and outdoor 20 °C, both at 8.0 g/m³, give no total effectiveness', () => {
      const equalHumidity = { outdoor: 8.0, supply: 8.0, extract: 8.0 };
      const small = calculate({
        ...winter,
        temperature: { outdoor: 20, supply: 21, extract: 22 },
        absoluteHumidity: equalHumidity,
      });
      expect(small.effectiveness.total).toBeUndefined();
      expect(totalEffectiveness(20, 21, 22)).toBeUndefined();
      // Exactly at the gate it is given.
      expect(totalEffectiveness(19, 21, 22)).toBeCloseTo(66.67, 2);
      // Also at other air densities, where float rounding could put the gradient a hair under the gate.
      for (const airDensity of [0.7, 0.93, 1.0, 1.1, 1.13, 1.29]) {
        const { total } = calculate({
          ...temperaturesOnly,
          temperature: { outdoor: 19.1, supply: 21, extract: 22.1 },
          airDensity,
        }).effectiveness;
        expect(total, String(airDensity)).toBeDefined();
      }
    });

    test('the gradient gate holds in both directions and at its boundaries', () => {
      expect(totalEffectiveness(30, 24, 22)).toBeCloseTo(75, 9); // summer: outdoor warmer than extract
      expect(totalEffectiveness(20, 20, 20)).toBeUndefined(); // zero gradient, no NaN
      expect(moistureEffectiveness(6.0, 6.75, 7.5)).toBeCloseTo(50, 9); // exactly 1.5 g/m³
      expect(moistureEffectiveness(6.0, 6.7, 7.4)).toBeUndefined();
      // The same boundary where float subtraction lands under it: 9.6 - 8.1 is 1.4999999999999991.
      expect(moistureEffectiveness(8.1, 8.85, 9.6)).toBeCloseTo(50, 9);
    });

    test('"Unit in standby": a supply flow of 0 gives neither figure, while the gradients are large', () => {
      const result = calculate({ ...winter, supplyFlow: 0 });
      expect(result.effectiveness).toEqual({});
      expect(calculate({ ...temperaturesOnly, supplyFlow: 0 }).effectiveness.total).toBeUndefined();
      // With a flow they are given again.
      expect(calculate({ ...winter, supplyFlow: 100 }).effectiveness.total).toBeDefined();
    });

    test('"One figure gated": 8 K and 0.7 g/m³ apart give the total effectiveness only', () => {
      const result = calculate({
        ...winter,
        temperature: { outdoor: 12, supply: 19, extract: 20 },
        absoluteHumidity: { outdoor: 6.0, supply: 6.4, extract: 6.7 },
      });
      // (h_sup - h_out) / (h_ext - h_out) with the humidity terms, not the 87.5 % of the temperatures alone
      expect(result.effectiveness.total).toBeCloseTo(82.82, 1);
      expect(result.effectiveness.moisture).toBeUndefined();
    });

    test('"No humidity configured": temperatures 10 K apart give the total effectiveness only', () => {
      const result = calculate({ ...temperaturesOnly, temperature: { outdoor: 10, supply: 17, extract: 20 } });
      expect(result.effectiveness.total).toBeCloseTo(70, 9);
      expect(result.effectiveness.moisture).toBeUndefined();
    });
  });
});

describe('pre-heater (recovery-calculation "Exchanger inlet after the pre-heater")', () => {
  const winter = toInputs(byName('winter_design'));
  const { absoluteHumidity: _humidity, ...dry } = winter;
  // The scenario's unit: no humidity, outdoor -6 °C, supply 15 °C, extract 21 °C, 200 m³/h, bypass 0 %.
  const cold: RecoveryInputs = { ...dry, temperature: { outdoor: -6, supply: 15, extract: 21 }, supplyFlow: 200 };
  const humid: RecoveryInputs = { ...winter, temperature: { outdoor: -6, supply: 15, extract: 21 }, supplyFlow: 200 };
  const withHeater = (
    base: RecoveryInputs,
    on: boolean | undefined,
    temperatureAfter: number | undefined,
    afterHumidity?: { value: number | undefined },
  ): RecoveryInputs => ({
    ...base,
    preHeater: { on, temperatureAfter, ...(afterHumidity ? { absoluteHumidityAfter: afterHumidity.value } : {}) },
  });
  const sum = (result: RecoveryResult, lane: 'sensible' | 'latent'): number =>
    result.recovered[lane] + result.lost[lane] + result.preHeater[lane];

  test('"Pre-heater running": recovered 1073 W, lost 402 W, pre-heater 335 W, saving 1073 W (1408 W without the block)', () => {
    const result = calculate(withHeater(cold, true, -1));
    near(result.recovered.sensible, 1073, 1);
    near(result.lost.sensible, 402, 1);
    near(result.preHeater.sensible, 335, 1);
    near(result.saving, 1073, 1);
    near(calculate(cold).saving, 1408, 1);
    expect(calculate(cold).preHeater).toEqual({ sensible: 0, latent: 0 });
  });

  test('"Effectiveness of the exchanger": 73 % on the inlet instead of 78 %', () => {
    near(calculate(withHeater(cold, true, -1)).effectiveness.total, (16 / 22) * 100, 1e-9);
    near(calculate(cold).effectiveness.total, (21 / 27) * 100, 1e-9);
  });

  test('"Gradient on the inlet": extract 21 °C, outdoor 15 °C, after 19 °C gives no total effectiveness', () => {
    const inputs = { ...cold, temperature: { outdoor: 15, supply: 18, extract: 21 } };
    expect(calculate(inputs).effectiveness.total).toBeDefined();
    expect(calculate(withHeater(inputs, true, 19)).effectiveness.total).toBeUndefined();
  });

  test('"Power above 0": it runs whatever the two temperatures read', () => {
    expect(calculate(withHeater(cold, true, -6)).preHeater).toEqual({ sensible: 0, latent: 0 });
    expect(calculate(withHeater(cold, true, -7)).preHeater.sensible).toBeLessThan(0);
  });

  test('"Power 0 with a sensor offset": 0.3 K above the outdoor temperature does not run', () => {
    expect(calculate(withHeater(cold, false, -5.7))).toEqual(calculate(cold));
    expect(calculate(withHeater(cold, false, 5))).toEqual(calculate(cold));
  });

  test('"No power entity": it does not run at 0.3 K and runs at 0.6 K, and exactly at the gate', () => {
    expect(calculate(withHeater(cold, undefined, -5.7))).toEqual(calculate(cold));
    near(calculate(withHeater(cold, undefined, -5.4)).preHeater.sensible, (1.2 * 1006 * 0.6 * 200) / 3600, 1e-9);
    expect(calculate(withHeater(cold, undefined, -5.5)).preHeater.sensible).toBeGreaterThan(0);
  });

  test('"Cooling mode": at 40 % bypass the pre-heater does not count as running', () => {
    const open = { ...cold, bypass: 40, temperature: { outdoor: 12, supply: 14, extract: 22 } };
    const result = calculate(withHeater(open, true, 20));
    expect(result).toEqual(calculate(open));
    expect(result.mode).toBe('cooling');
    expect(result.preHeater).toEqual({ sensible: 0, latent: 0 });
  });

  test('"Only the after temperature": the latent parts equal those without the block', () => {
    const without = calculate(humid);
    const result = calculate(withHeater(humid, true, -1));
    expect(result.recovered.latent).toBeCloseTo(without.recovered.latent, 9);
    expect(result.lost.latent).toBeCloseTo(without.lost.latent, 9);
    expect(result.preHeater.latent).toBeCloseTo(0, 9);
    expect(Math.abs(result.recovered.sensible - without.recovered.sensible)).toBeGreaterThan(100);
  });

  test('"Moisture figures unchanged": the moisture rates and the moisture effectiveness equal those without the block', () => {
    const without = calculate(winter);
    const result = calculate(withHeater(winter, true, 8, { value: 5.5 }));
    expect(result.moisture).toEqual(without.moisture);
    expect(result.effectiveness.moisture).toBe(without.effectiveness.moisture);
    expect(result.mode).toBe('heating');
  });

  test('"Parts sum to the load": recovered, lost and the pre-heater part equal the extract minus the outdoor enthalpy', () => {
    const toWatts = 200 / 3600;
    for (const [base, afterHumidity] of [
      [cold, undefined],
      [humid, undefined],
      [humid, { value: 4.3 }],
    ] as const) {
      const result = calculate(withHeater(base, true, -1, afterHumidity));
      const { outdoor = 0, extract = 0 } = base.absoluteHumidity ?? {};
      const latent = 2501 * (extract - outdoor) * toWatts;
      const sensible = (1.2 * 1006 * (21 - -6) + 1.86 * (21 * extract - -6 * outdoor)) * toWatts;
      near(sum(result, 'sensible'), sensible, 1);
      near(sum(result, 'latent'), latent, 1);
    }
  });

  test('"After humidity differs": 0.1 g/m³ above the outdoor air gives a latent pre-heater part of 14 W', () => {
    const outdoorAH = humid.absoluteHumidity?.outdoor ?? 0;
    const same = calculate(withHeater(humid, true, -1));
    const result = calculate(withHeater(humid, true, -1, { value: outdoorAH + 0.1 }));
    near(result.preHeater.latent, 14, 1);
    near(same.recovered.latent - result.recovered.latent, 14, 1);
  });

  test('"After temperature unavailable while off": the figures equal those without the block', () => {
    expect(calculate(withHeater(cold, false, undefined))).toEqual(calculate(cold));
    expect(calculate(withHeater(cold, undefined, undefined))).toEqual(calculate(cold));
    expect(calculate(withHeater(winter, false, undefined, { value: undefined }))).toEqual(calculate(winter));
  });

  test('"After temperature unavailable while running": no figures, nor without an after humidity value', () => {
    expect(calculateRecovery(withHeater(cold, true, undefined))).toBeUndefined();
    expect(calculateRecovery(withHeater(winter, true, 5, { value: undefined }))).toBeUndefined();
    expect(calculateRecovery(withHeater(winter, true, 5, { value: Number.NaN }))).toBeUndefined();
  });

  test('"Unit without pre-heater roles": no block gives a zero pre-heater part and the same figures', () => {
    const result = calculate(winter);
    expect(result.preHeater).toEqual({ sensible: 0, latent: 0 });
    expect(Math.round(result.recovered.sensible)).toBe(1324);
  });
});
