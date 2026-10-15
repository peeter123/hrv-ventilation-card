// Config checks shared by the cards: which required roles a config leaves out. Roles are config paths such as
// "supply.temperature"; the cards turn the missing ones into the error message that setConfig throws.

/** A card config as it comes from YAML or the editor: nested objects with entity IDs as strings. */
export type CardConfig = Readonly<Record<string, unknown>>;

export type Stream = 'outdoor' | 'supply' | 'extract' | 'exhaust';

/** The four air streams, in the order the cards list them. */
export const STREAMS = ['outdoor', 'supply', 'extract', 'exhaust'] as const satisfies readonly Stream[];

/** A value per stream, from a function of the stream. */
export const mapStreams = <T>(fn: (stream: Stream) => T): Record<Stream, T> => ({
  outdoor: fn('outdoor'),
  supply: fn('supply'),
  extract: fn('extract'),
  exhaust: fn('exhaust'),
});

/** Every entity role of the cards, as a config path. Typed, so a misspelled role does not compile. */
export type RolePath =
  | `${Stream}.${'temperature' | 'humidity' | 'absolute_humidity'}`
  | `fans.${'level' | 'supply_flow' | 'exhaust_flow'}`
  | `bypass.${'position' | 'mode' | 'next_change'}`
  | `status.${'operating_mode' | 'target_temperature' | 'temperature_profile' | 'next_fan_change' | 'filter_days' | 'power' | 'rmot'}`
  | `seasons.${'heating' | 'cooling'}`;

/**
 * How humidity is required:
 * - `all_or_none`: every listed stream has a humidity (absolute, or relative), or none has (recovery bar,
 *   sensible-only without humidity);
 * - `required`: every listed stream needs a humidity (moisture bar).
 * In both, a stream whose humidity is only relative also needs its temperature (to compute absolute humidity).
 */
export type HumidityRule = 'all_or_none' | 'required';

/** What a card requires: role paths, and optionally a humidity rule over some streams. */
export interface Requirements {
  paths: readonly RolePath[];
  humidity?: { streams: readonly Stream[]; rule: HumidityRule };
}

// The shape of a Home Assistant entity ID: a domain starting with a letter, a dot, an object ID (lowercase letters,
// digits, underscores). The leading letter keeps numbers written as strings ("1.2") out.
const ENTITY_ID = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;

/** The value at a dotted path such as "fans.supply_flow", or undefined when any part of the path is missing. */
export function valueAt(config: CardConfig, path: string): unknown {
  let value: unknown = config;
  for (const key of path.split('.')) {
    if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

/** The value as an entity ID, trimmed, or undefined when it is not a string shaped like an entity ID. */
export function asEntityId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const id = value.trim();
  return ENTITY_ID.test(id) ? id : undefined;
}

/**
 * The entity ID configured for the role at `path`, trimmed, or undefined when the role is not set or does not hold
 * something shaped like an entity ID. Cards read entities through this, so what the check accepts is what they use.
 */
export function entityAt(config: CardConfig, path: string): string | undefined {
  return asEntityId(valueAt(config, path));
}

/** True when the role at `path` holds an entity ID. */
export function isConfigured(config: CardConfig, path: string): boolean {
  return entityAt(config, path) !== undefined;
}

/** Where a stream's absolute humidity comes from: its own entity, or relative humidity with the temperature. */
export type HumidityRoles = { absolute: string } | { relative: string; temperature: string };

/**
 * The entities a stream's absolute humidity comes from, or undefined when the stream has no humidity the
 * calculation can use. The config check and the calculator both read humidity through this one rule.
 */
export function humidityRoles(config: CardConfig, stream: Stream): HumidityRoles | undefined {
  const absolute = entityAt(config, `${stream}.absolute_humidity`);
  if (absolute !== undefined) return { absolute };
  const relative = entityAt(config, `${stream}.humidity`);
  const temperature = entityAt(config, `${stream}.temperature`);
  return relative !== undefined && temperature !== undefined ? { relative, temperature } : undefined;
}

const hasUsableHumidity = (config: CardConfig, stream: Stream): boolean => humidityRoles(config, stream) !== undefined;

/** True when every listed stream has a usable humidity, so the calculation can give latent and moisture figures. */
export function hasAllHumidity(config: CardConfig, streams: readonly Stream[]): boolean {
  return streams.every((stream) => hasUsableHumidity(config, stream));
}

/**
 * The humidity roles the config leaves out under `rule`, as paths: `<stream>.humidity` for a stream without any
 * humidity, `<stream>.temperature` for a stream with only a relative humidity and no temperature.
 */
export function missingHumidity(config: CardConfig, streams: readonly Stream[], rule: HumidityRule): RolePath[] {
  const hasAnyHumidity = (stream: Stream): boolean =>
    isConfigured(config, `${stream}.absolute_humidity`) || isConfigured(config, `${stream}.humidity`);
  if (rule === 'all_or_none' && !streams.some(hasAnyHumidity)) return [];

  return streams.flatMap((stream): RolePath[] => {
    if (!hasAnyHumidity(stream)) return [`${stream}.humidity`];
    return hasUsableHumidity(config, stream) ? [] : [`${stream}.temperature`];
  });
}

/**
 * Every role the config leaves out: the required paths first, in order, then the humidity roles, each named once.
 * An empty list means the config is complete.
 */
export function missingRoles(config: CardConfig, requirements: Requirements): RolePath[] {
  const missing = requirements.paths.filter((path) => !isConfigured(config, path));
  const { humidity } = requirements;
  if (humidity) missing.push(...missingHumidity(config, humidity.streams, humidity.rule));
  return [...new Set(missing)];
}
