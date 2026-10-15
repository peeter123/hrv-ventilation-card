// A mock `hass` for the preview page: placeholder entities of a ventilation unit whose values come from the page's
// controls. A state object is replaced only when its value changes, as Home Assistant does, so the cards' re-render
// rule is exercised too.
import { absoluteHumidity } from '../src/calc/humidity';
import type { CardHass } from '../src/cards/base-card';
import { STREAMS, type Stream } from '../src/lib/config';
import type { HassEntityState } from '../src/lib/hass';

export type SeasonChoice = 'heating' | 'cooling' | 'between';

export interface MockValues {
  temperature: Record<Stream, number>;
  humidity: Record<Stream, number>;
  /** The supply and the exhaust flow, which the unit keeps in balance. */
  flow: number;
  /** For tests only: an exhaust flow other than the supply flow. */
  exhaustFlow?: number;
  bypass: number;
  season: SeasonChoice;
  /** Entity IDs reported as unavailable. */
  unavailable: ReadonlySet<string>;
}

export const id = {
  temperature: (stream: Stream): string => `sensor.hrv_${stream}_temperature`,
  humidity: (stream: Stream): string => `sensor.hrv_${stream}_humidity`,
  absoluteHumidity: (stream: Stream): string => `sensor.hrv_${stream}_absolute_humidity`,
  level: 'sensor.hrv_fan_level',
  supplyFlow: 'sensor.hrv_supply_flow',
  exhaustFlow: 'sensor.hrv_exhaust_flow',
  bypass: 'sensor.hrv_bypass_position',
  bypassMode: 'sensor.hrv_bypass_mode',
  bypassNext: 'sensor.hrv_bypass_next_change',
  operatingMode: 'sensor.hrv_operating_mode',
  target: 'sensor.hrv_target_temperature',
  profile: 'sensor.hrv_temperature_profile',
  fanNext: 'sensor.hrv_next_fan_change',
  filter: 'sensor.hrv_filter_days',
  power: 'sensor.hrv_power',
  rmot: 'sensor.hrv_rmot',
  heating: 'binary_sensor.hrv_heating_season',
  cooling: 'binary_sensor.hrv_cooling_season',
} as const;

/** The card configs the page can switch between. */
export const CONFIGS: Readonly<Record<string, Record<string, unknown>>> = {
  full: {
    ...Object.fromEntries(
      STREAMS.map((stream) => [
        stream,
        {
          temperature: id.temperature(stream),
          humidity: id.humidity(stream),
          absolute_humidity: id.absoluteHumidity(stream),
        },
      ]),
    ),
    fans: { level: id.level, supply_flow: id.supplyFlow, exhaust_flow: id.exhaustFlow },
    bypass: { position: id.bypass, mode: id.bypassMode, next_change: id.bypassNext },
    status: {
      operating_mode: id.operatingMode,
      target_temperature: id.target,
      temperature_profile: id.profile,
      next_fan_change: id.fanNext,
      filter_days: id.filter,
      power: id.power,
      rmot: id.rmot,
    },
    seasons: { heating: id.heating, cooling: id.cooling },
  },
  'temperatures only': Object.fromEntries(STREAMS.map((stream) => [stream, { temperature: id.temperature(stream) }])),
  'without bypass': {
    ...Object.fromEntries(
      STREAMS.map((stream) => [stream, { temperature: id.temperature(stream), humidity: id.humidity(stream) }]),
    ),
    fans: { level: id.level, supply_flow: id.supplyFlow, exhaust_flow: id.exhaustFlow },
    status: { operating_mode: id.operatingMode, filter_days: id.filter },
  },
};

interface Reading {
  state: string;
  unit?: string;
  decimals?: number;
}

/** The unit's named fan level for a flow, as a Zehnder reports it. */
function fanLevel(flow: number): string {
  if (flow <= 0) return 'Away';
  if (flow < 150) return 'Low';
  return flow < 250 ? 'Medium' : 'High';
}

function readings(values: MockValues): Record<string, Reading> {
  const result: Record<string, Reading> = {};
  for (const stream of STREAMS) {
    const t = values.temperature[stream];
    const rh = values.humidity[stream];
    result[id.temperature(stream)] = { state: t.toFixed(1), unit: '°C', decimals: 1 };
    result[id.humidity(stream)] = { state: rh.toFixed(0), unit: '%', decimals: 0 };
    const ah = absoluteHumidity(t, rh);
    result[id.absoluteHumidity(stream)] =
      ah === undefined ? { state: 'unknown' } : { state: ah.toFixed(2), unit: 'g/m³', decimals: 1 };
  }
  const flow = (value: number): Reading => ({ state: value.toFixed(0), unit: 'm³/h', decimals: 0 });
  Object.assign(result, {
    [id.level]: { state: fanLevel(values.flow) },
    [id.supplyFlow]: flow(values.flow),
    [id.exhaustFlow]: flow(values.exhaustFlow ?? values.flow),
    [id.bypass]: { state: values.bypass.toFixed(0), unit: '%', decimals: 0 },
    [id.bypassMode]: { state: 'auto' },
    [id.bypassNext]: { state: values.bypass > 0 ? '01:30' : 'n/a' },
    [id.operatingMode]: { state: 'Auto' },
    [id.target]: { state: '21.0', unit: '°C', decimals: 1 },
    [id.profile]: { state: 'Comfort' },
    [id.fanNext]: { state: 'n/a' },
    [id.filter]: { state: '64', unit: 'd', decimals: 0 },
    [id.power]: { state: '32', unit: 'W', decimals: 0 },
    [id.rmot]: { state: '14.2', unit: '°C', decimals: 1 },
    [id.heating]: { state: values.season === 'heating' ? 'on' : 'off' },
    [id.cooling]: { state: values.season === 'cooling' ? 'on' : 'off' },
  } satisfies Record<string, Reading>);
  for (const entityId of values.unavailable) result[entityId] = { state: 'unavailable' };
  return result;
}

/** What `hass.formatEntityState` does for these entities: the value with its precision and unit. */
function formatEntityState(stateObj: HassEntityState): string {
  if (stateObj.state === 'unavailable') return 'Unavailable';
  if (stateObj.state === 'unknown') return 'Unknown';
  const decimals = stateObj.attributes['decimals'];
  const value =
    typeof decimals === 'number'
      ? Number(stateObj.state).toLocaleString('en', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : stateObj.state;
  const unit = stateObj.attributes.unit_of_measurement;
  return unit ? `${value} ${unit}` : value;
}

// Home Assistant replaces the locale only when the user changes it.
const LOCALE = { language: 'en', number_format: 'language' };

/** Builds `hass` objects, keeping a state object while its reading stays the same. */
export class MockHass {
  private states: Record<string, HassEntityState> = {};

  build(values: MockValues, darkMode: boolean): CardHass {
    const now = new Date().toISOString();
    const next: Record<string, HassEntityState> = {};
    for (const [entityId, reading] of Object.entries(readings(values))) {
      const previous = this.states[entityId];
      const same = previous?.state === reading.state && previous.attributes.unit_of_measurement === reading.unit;
      next[entityId] =
        previous && same
          ? previous
          : {
              entity_id: entityId,
              state: reading.state,
              attributes: {
                ...(reading.unit === undefined ? {} : { unit_of_measurement: reading.unit }),
                ...(reading.decimals === undefined ? {} : { decimals: reading.decimals }),
              },
              last_updated: now,
            };
    }
    this.states = next;
    return {
      states: next,
      locale: LOCALE,
      language: 'en',
      themes: { darkMode },
      formatEntityState,
      // No recorder: the smoothing starts from the current values.
      callWS: () => Promise.resolve({}),
    } as CardHass;
  }
}
