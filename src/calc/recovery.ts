// The recovery calculation: a TypeScript port of the formulas of the author's template macro (comfoair_q450.jinja,
// not published), checked against the golden vectors in test/vectors.json. Pure: numbers in the calculation units in, figures in W and g/h out.
//
// Enthalpy of moist air per m³: h = rho * 1006 * T + AH * (2501 + 1.86 * T), in J/m³ (T in °C, AH in g/m³).
// Mode: cooling while the bypass is open or the outdoor air has the higher enthalpy, else heating. Free cooling: the
// bypass is open and the extract air has the higher enthalpy, so the figures are the cooling the supply air brings
// compared with the indoor air, not what the exchanger recovers.
// Heating recovers h_sup - h_out; cooling recovers h_ref - h_sup, where the reference is the extract or the outdoor
// air, whichever has the higher enthalpy. Latent = 2501 * dAH, sensible = the rest (it includes the small vapour
// term 1.86 * T * AH). Lost = potential minus recovered. Moisture rates are flow times AH differences.

/** Default air density in kg/m³, the macro's fixed value. */
export const DEFAULT_AIR_DENSITY = 1.2;

const CP_AIR = 1006; // J/(kg K)
const LATENT_HEAT = 2501; // J/g, water vapour at 0 °C
const CP_VAPOUR = 1.86; // J/(g K)
const SECONDS_PER_HOUR = 3600;

/** A value per air stream. */
export interface Streams<T> {
  outdoor: T;
  supply: T;
  extract: T;
}

/**
 * The calculation's inputs in its units. A value is undefined when its input has no value right now (unavailable,
 * unknown, not numeric, or in a unit the calculation does not know). Which inputs exist is decided by the caller
 * from the config: absolute humidity for all three streams or for none, a bypass of 0 for a unit without one.
 */
export interface RecoveryInputs {
  /** °C */
  temperature: Streams<number | undefined>;
  /** g/m³, smoothed; left out without humidity sensors (sensible-only) */
  absoluteHumidity?: Streams<number | undefined>;
  /** m³/h */
  supplyFlow: number | undefined;
  /** %, 0 to 100; 0 for a unit without a bypass sensor */
  bypass: number | undefined;
  /** kg/m³, a positive number */
  airDensity: number;
}

export interface PowerSplit {
  sensible: number;
  latent: number;
}

export interface MoistureRates {
  /** Moisture taken out of the house relative to the outdoor air: flow * (AH_ext - AH_out) */
  extracted: number;
  /** Moisture the exchanger hands back to the supply air: flow * (AH_sup - AH_out) */
  recovered: number;
  /** Moisture still put outside: flow * (AH_ext - AH_sup) = extracted - recovered */
  outside: number;
}

export interface RecoveryResult {
  mode: 'heating' | 'cooling';
  /**
   * Cooling with the bypass open and outdoor air of lower enthalpy than the extract (cooler, or drier): recovered is
   * the cooling the supply air delivers against the extract air, not what the exchanger recovers.
   */
  freeCooling: boolean;
  /** The recovered total in W, clamped at 0 */
  saving: number;
  /** Signed parts recovered by the exchanger, W */
  recovered: PowerSplit;
  /** Signed parts still lost with the ventilation air, W */
  lost: PowerSplit;
  /** False without humidity for the three streams: latent parts are then 0 and there are no moisture rates. */
  latentKnown: boolean;
  /** g/h, only with humidity */
  moisture?: MoistureRates;
}

const known = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value);

/** A point of the calculation: the enthalpy (J/m³) and absolute humidity (g/m³) of one air stream. */
interface AirState {
  h: number;
  A: number;
}

/** The enthalpy difference a - b and its latent part, in J/m³. */
const diff = (a: AirState, b: AirState): { total: number; latent: number } => ({
  total: a.h - b.h,
  latent: LATENT_HEAT * (a.A - b.A),
});

/**
 * The figures for the inputs, or undefined when an input has no value or the air density is not a positive number.
 * Without absolute humidity the result is sensible-only.
 */
export function calculateRecovery(inputs: RecoveryInputs): RecoveryResult | undefined {
  const { temperature, absoluteHumidity, supplyFlow, bypass, airDensity: rho } = inputs;
  const T = [temperature.outdoor, temperature.supply, temperature.extract].filter(known);
  const AH =
    absoluteHumidity && [absoluteHumidity.outdoor, absoluteHumidity.supply, absoluteHumidity.extract].filter(known);
  if (T.length !== 3 || !known(supplyFlow) || !known(bypass)) return undefined;
  if (AH !== undefined && AH.length !== 3) return undefined;
  if (!(Number.isFinite(rho) && rho > 0)) return undefined;

  const air = (t: number, A: number): AirState => ({ h: rho * CP_AIR * t + A * (LATENT_HEAT + CP_VAPOUR * t), A });
  const [outdoor, supply, extract] = T.map((t, index) => air(t, AH?.[index] ?? 0)) as [AirState, AirState, AirState];
  const toWatts = supplyFlow / SECONDS_PER_HOUR; // J/m³ times m³/s

  const cooling = bypass > 0 || outdoor.h > extract.h;
  // The cooling reference: the extract or the outdoor air, whichever has the higher enthalpy. With the bypass open
  // and the extract as reference, the figures are free cooling.
  const extractIsReference = extract.h >= outdoor.h;
  let recovered;
  let lost;
  if (cooling) {
    // The other air is what the supply would be without recovery.
    const [reference, other] = extractIsReference ? [extract, outdoor] : [outdoor, extract];
    recovered = diff(reference, supply);
    lost = diff(supply, other);
  } else {
    recovered = diff(supply, outdoor);
    lost = diff(extract, supply);
  }

  const result: RecoveryResult = {
    mode: cooling ? 'cooling' : 'heating',
    freeCooling: bypass > 0 && extractIsReference,
    saving: Math.max(recovered.total, 0) * toWatts,
    recovered: { sensible: (recovered.total - recovered.latent) * toWatts, latent: recovered.latent * toWatts },
    lost: { sensible: (lost.total - lost.latent) * toWatts, latent: lost.latent * toWatts },
    latentKnown: AH !== undefined,
  };
  if (absoluteHumidity !== undefined) {
    const moisture = calculateMoisture(absoluteHumidity, supplyFlow);
    if (moisture !== undefined) result.moisture = moisture;
  }
  return result;
}

/**
 * The moisture rates in g/h from the absolute humidities (g/m³) and the supply flow (m³/h), or undefined when one of
 * them has no value. Needs no temperatures, so a unit with absolute humidity sensors alone can show them.
 */
export function calculateMoisture(
  absoluteHumidity: Streams<number | undefined> | undefined,
  supplyFlow: number | undefined,
): MoistureRates | undefined {
  if (absoluteHumidity === undefined || !known(supplyFlow)) return undefined;
  const { outdoor, supply, extract } = absoluteHumidity;
  if (!known(outdoor) || !known(supply) || !known(extract)) return undefined;
  return {
    extracted: supplyFlow * (extract - outdoor),
    recovered: supplyFlow * (supply - outdoor),
    outside: supplyFlow * (extract - supply),
  };
}
