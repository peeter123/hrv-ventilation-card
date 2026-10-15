// The sample the cards show while their config sets no entity role (the card picker, a fresh editor, a bare YAML
// card): a config and the states of its entities, shared by the three cards so their figures match. A typical
// heating day, with every role the cards show. The IDs use a made-up domain, so they hold no installation
// identifiers and cannot collide with real entities.
import { ROLE_LABELS } from '../strings';
import { valueAt, type CardConfig } from './config';
import type { HassEntityState } from './hass';

/** The sample's entity ID of a role path: `hrv_sample.<role>` with the dot of the path written as an underscore. */
const id = (role: string): string => `hrv_sample.${role.replace('.', '_')}`;

/** The sample config: every entity role of the cards set to its sample entity. */
export const SAMPLE_CONFIG: CardConfig = {
  outdoor: { temperature: id('outdoor.temperature'), humidity: id('outdoor.humidity') },
  supply: { temperature: id('supply.temperature'), humidity: id('supply.humidity') },
  extract: { temperature: id('extract.temperature'), humidity: id('extract.humidity') },
  exhaust: { temperature: id('exhaust.temperature'), humidity: id('exhaust.humidity') },
  fans: { level: id('fans.level'), supply_flow: id('fans.supply_flow'), exhaust_flow: id('fans.exhaust_flow') },
  bypass: { position: id('bypass.position'), mode: id('bypass.mode'), next_change: id('bypass.next_change') },
  status: {
    operating_mode: id('status.operating_mode'),
    target_temperature: id('status.target_temperature'),
    temperature_profile: id('status.temperature_profile'),
    next_fan_change: id('status.next_fan_change'),
    filter_days: id('status.filter_days'),
    power: id('status.power'),
    rmot: id('status.rmot'),
    saving: id('status.saving'),
    moisture_recovery: id('status.moisture_recovery'),
  },
  seasons: { heating: id('seasons.heating'), cooling: id('seasons.cooling') },
};

const isGroup = (value: unknown): value is CardConfig =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const merge = (base: CardConfig, over: CardConfig): CardConfig => ({
  ...base,
  ...Object.fromEntries(
    Object.entries(over).map(([key, value]) => {
      const inBase = base[key];
      return [key, isGroup(value) && isGroup(inBase) ? merge(inBase, value) : value];
    }),
  ),
});

/** True when the config gives any entity role a value, valid or not: a malformed one is still the user's choice. */
export const setsAnyRole = (config: CardConfig): boolean =>
  Object.keys(ROLE_LABELS).some((role) => {
    const value = valueAt(config, role);
    return value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');
  });

/** The user's config (its options; it sets no entity role) merged over the sample config. */
export const withSample = (config: CardConfig): CardConfig => merge(SAMPLE_CONFIG, config);

// Outdoor 2 °C / 85 %, supply 18.5 °C / 45 %, extract 21.5 °C / 50 %, exhaust 5.5 °C / 90 %. The saved power and
// the moisture recovery are what the calculation gives for these values (a test checks them).
const VALUES: readonly (readonly [role: string, state: string, unit?: string])[] = [
  ['outdoor.temperature', '2', '°C'],
  ['outdoor.humidity', '85', '%'],
  ['supply.temperature', '18.5', '°C'],
  ['supply.humidity', '45', '%'],
  ['extract.temperature', '21.5', '°C'],
  ['extract.humidity', '50', '%'],
  ['exhaust.temperature', '5.5', '°C'],
  ['exhaust.humidity', '90', '%'],
  ['fans.level', '2'],
  ['fans.supply_flow', '200', 'm³/h'],
  ['fans.exhaust_flow', '200', 'm³/h'],
  ['bypass.position', '0', '%'],
  ['bypass.mode', 'Auto'],
  ['bypass.next_change', 'n/a'],
  ['status.operating_mode', 'Auto'],
  ['status.target_temperature', '21', '°C'],
  ['status.temperature_profile', 'Normal'],
  ['status.next_fan_change', 'n/a'],
  ['status.filter_days', '120', 'd'],
  ['status.power', '38', 'W'],
  ['status.rmot', '4.5', '°C'],
  ['status.saving', '1452', 'W'],
  ['status.moisture_recovery', '478', 'g/h'],
  ['seasons.heating', 'on'],
  ['seasons.cooling', 'off'],
];

// The calculation reads the update time of its inputs; the sample is always current, so one fixed time will do.
const UPDATED = '2026-01-01T12:00:00Z';

/** The states of the sample entities, by entity ID. */
export const SAMPLE_STATES: Readonly<Record<string, HassEntityState>> = Object.fromEntries(
  VALUES.map(([role, state, unit]) => [
    id(role),
    {
      entity_id: id(role),
      state,
      last_updated: UPDATED,
      attributes: unit === undefined ? {} : { unit_of_measurement: unit },
    } satisfies HassEntityState,
  ]),
);
