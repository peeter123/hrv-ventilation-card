// Turns a card config and `hass` into the recovery calculation's inputs and result, shared by the cards that show
// calculated figures. The config decides which inputs exist (humidity on all streams or none, a bypass or not);
// each configured input is read through the availability and unit rules and is undefined while it has no value.
import { entityAt, humidityRoles, type CardConfig, type Stream } from '../lib/config';
import { optionValue, type NumberOption } from '../lib/options';
import { convertedState, type Quantity } from '../lib/units';
import { preHeaterRunning } from '../lib/preheater';
import { absoluteHumidity } from './humidity';
import {
  calculateRecovery,
  DEFAULT_AIR_DENSITY,
  type RecoveryInputs,
  type RecoveryResult,
  type Streams,
} from './recovery';
import {
  latestUpdate,
  MAX_SMOOTHING_MINUTES,
  smoothingStore,
  type SmoothingHass,
  type SmoothingSource,
  type SmoothingStore,
} from './smoothing';

/** The calculation's options, shared by every card that shows calculated figures (one range and default each). */
export const CALCULATION_OPTIONS = {
  smoothing: { kind: 'number', path: 'smoothing', min: 0, max: MAX_SMOOTHING_MINUTES, default: 10 },
  airDensity: { kind: 'number', path: 'air_density', min: 0.5, max: 1.5, default: DEFAULT_AIR_DENSITY },
} as const satisfies Record<string, NumberOption>;

const STREAMS = ['outdoor', 'supply', 'extract'] as const satisfies readonly Stream[];

export interface CardCalculation {
  /** The inputs as read, with the smoothed absolute humidities. */
  inputs: RecoveryInputs;
  /** The figures, or undefined when an input has no value. */
  result?: RecoveryResult;
}

/**
 * Computes a card's figures for the current `hass`; built once per config by createCalculator. With `noAirflow` the
 * supply flow counts as 0 whatever the sensor reads (the unit is not ventilating), so the figures show no recovery.
 */
export type Calculator = (hass: SmoothingHass, options?: { noAirflow?: boolean }) => CardCalculation;

/** The smoothing source of a stream's absolute humidity, or undefined when the stream has no humidity. */
function humiditySource(config: CardConfig, stream: Stream): SmoothingSource | undefined {
  const roles = humidityRoles(config, stream);
  if (roles === undefined) return undefined;
  if ('absolute' in roles) {
    return {
      key: roles.absolute,
      entityIds: [roles.absolute],
      value: ([state]) => convertedState(state, 'absolute_humidity'),
    };
  }
  return derivedSource(roles.relative, roles.temperature);
}

/** The smoothing source of the absolute humidity computed from a relative humidity and a temperature entity. */
function derivedSource(relative: string, temperature: string): SmoothingSource {
  return {
    // The computed series is shared by every card with the same pair of entities.
    key: `derived:${relative}|${temperature}`,
    entityIds: [relative, temperature],
    value: ([rh, t]) => {
      const [humidity, celsius] = [convertedState(rh, 'relative_humidity'), convertedState(t, 'temperature')];
      return humidity === undefined || celsius === undefined ? undefined : absoluteHumidity(celsius, humidity);
    },
  };
}

/**
 * The calculator for a card config: the entity IDs and humidity sources are resolved once; each call reads them
 * from `hass`, smooths absolute humidity over the config's `smoothing` minutes (default 10) at the latest update of
 * the inputs it uses, and computes the figures. Humidity is used only when all three streams have it.
 */
export function createCalculator(config: CardConfig, store: SmoothingStore = smoothingStore): Calculator {
  // The cards' setConfig reports invalid values; here they fall back, so a figure is never computed from them.
  const smoothing = optionValue(config, CALCULATION_OPTIONS.smoothing);
  const airDensity = optionValue(config, CALCULATION_OPTIONS.airDensity);
  const temperatures = STREAMS.map((stream) => entityAt(config, `${stream}.temperature`));
  const sources = STREAMS.map((stream) => humiditySource(config, stream));
  const humidity = sources.every((source) => source !== undefined) ? sources : undefined;
  const supplyFlow = entityAt(config, 'fans.supply_flow');
  const bypass = entityAt(config, 'bypass.position');
  // The pre-heater block exists only with the temperature after it; its humidity only with that role too.
  const preHeaterPower = entityAt(config, 'pre_heater.power');
  const temperatureAfter = entityAt(config, 'pre_heater.temperature_after');
  const humidityAfterRole = entityAt(config, 'pre_heater.humidity_after');
  const humidityAfter =
    temperatureAfter !== undefined && humidityAfterRole !== undefined
      ? derivedSource(humidityAfterRole, temperatureAfter)
      : undefined;
  // The entities the calculation uses, for the smoothing time.
  const used = [
    ...temperatures,
    ...(humidity ?? []).flatMap((source) => source.entityIds),
    supplyFlow,
    bypass,
    ...(temperatureAfter === undefined ? [] : [preHeaterPower, temperatureAfter, ...(humidityAfter?.entityIds ?? [])]),
  ].filter((id): id is string => id !== undefined);
  const perStream = <T>([outdoor, supply, extract]: T[]): Streams<T> => ({
    outdoor: outdoor as T,
    supply: supply as T,
    extract: extract as T,
  });

  return (hass, { noAirflow = false } = {}) => {
    const read = (id: string | undefined, quantity: Quantity): number | undefined =>
      id === undefined ? undefined : convertedState(hass.states[id], quantity);
    const at = latestUpdate(used.map((id) => hass.states[id]));
    const inputs: RecoveryInputs = {
      temperature: perStream(temperatures.map((id) => read(id, 'temperature'))),
      supplyFlow: noAirflow ? 0 : read(supplyFlow, 'flow'),
      bypass: bypass === undefined ? 0 : read(bypass, 'percentage'),
      airDensity,
    };
    if (humidity !== undefined) {
      inputs.absoluteHumidity = perStream(humidity.map((source) => store.smoothed(hass, source, smoothing, at)));
    }
    if (temperatureAfter !== undefined) {
      inputs.preHeater = {
        on: preHeaterPower === undefined ? undefined : preHeaterRunning(hass.states[preHeaterPower]),
        temperatureAfter: read(temperatureAfter, 'temperature'),
      };
      if (humidityAfter !== undefined) {
        inputs.preHeater.absoluteHumidityAfter = store.smoothed(hass, humidityAfter, smoothing, at);
      }
    }
    const result = calculateRecovery(inputs);
    return result === undefined ? { inputs } : { inputs, result };
  };
}
