import { describe, expect, test } from 'vitest';
import {
  entityAt,
  hasAllHumidity,
  isConfigured,
  missingHumidity,
  missingRoles,
  valueAt,
  type CardConfig,
  type Requirements,
  type Stream,
} from '../../src/lib/config';

const STREAMS: Stream[] = ['outdoor', 'supply', 'extract'];
const RECOVERY: Requirements = {
  paths: ['outdoor.temperature', 'supply.temperature', 'extract.temperature', 'fans.supply_flow'],
  humidity: { streams: STREAMS, rule: 'all_or_none' },
};
const MOISTURE: Requirements = {
  paths: ['fans.supply_flow'],
  humidity: { streams: STREAMS, rule: 'required' },
};

/** A copy of the config without one top-level key. */
const without = (config: CardConfig, key: string): CardConfig =>
  Object.fromEntries(Object.entries(config).filter(([name]) => name !== key));

const complete: CardConfig = {
  type: 'custom:hrv-recovery-balance-card',
  outdoor: { temperature: 'sensor.outdoor_temperature', absolute_humidity: 'sensor.outdoor_absolute_humidity' },
  supply: { temperature: 'sensor.supply_temperature', humidity: 'sensor.supply_humidity' },
  extract: { temperature: 'sensor.extract_temperature', absolute_humidity: 'sensor.extract_absolute_humidity' },
  fans: { supply_flow: 'sensor.supply_flow' },
};

describe('valueAt, entityAt and isConfigured', () => {
  test('reads nested paths', () => {
    expect(valueAt(complete, 'fans.supply_flow')).toBe('sensor.supply_flow');
    expect(valueAt(complete, 'bypass.position')).toBeUndefined();
    expect(valueAt(complete, 'type.length')).toBeUndefined();
  });

  test('an entity ID is trimmed, so what the check accepts is what the card reads', () => {
    expect(entityAt({ supply: { temperature: ' sensor.supply_temperature ' } }, 'supply.temperature')).toBe(
      'sensor.supply_temperature',
    );
  });

  test('only something shaped like an entity ID counts as configured', () => {
    expect(isConfigured(complete, 'supply.temperature')).toBe(true);
    for (const value of ['', '  ', 'sensor', 'supply flow', 'Sensor.Supply', 'sensor.', '.supply', '1.2', null, 42]) {
      expect(isConfigured({ supply: { temperature: value } }, 'supply.temperature'), String(value)).toBe(false);
    }
    expect(isConfigured({ supply: 'sensor.x' }, 'supply.temperature')).toBe(false);
    expect(isConfigured({}, 'supply.temperature')).toBe(false);
  });

  test('inherited object members are not config values', () => {
    expect(isConfigured({}, 'constructor')).toBe(false);
    expect(valueAt({ outdoor: {} }, 'outdoor.toString')).toBeUndefined();
  });
});

describe('missingRoles', () => {
  test('a complete config misses nothing', () => {
    expect(missingRoles(complete, RECOVERY)).toEqual([]);
    expect(missingRoles(complete, MOISTURE)).toEqual([]);
  });

  test('recovery-balance-card "Supply flow missing" names the supply flow', () => {
    expect(missingRoles(without(complete, 'fans'), RECOVERY)).toEqual(['fans.supply_flow']);
  });

  test('a partly missing config names each missing role, required paths first', () => {
    const partial = { outdoor: { temperature: 'sensor.outdoor_temperature', humidity: 'sensor.outdoor_humidity' } };
    expect(missingRoles(partial, RECOVERY)).toEqual([
      'supply.temperature',
      'extract.temperature',
      'fans.supply_flow',
      'supply.humidity',
      'extract.humidity',
    ]);
  });

  test('an empty config misses every required role; without humidity the recovery bar needs none', () => {
    expect(missingRoles({ type: 'custom:hrv-recovery-balance-card' }, RECOVERY)).toEqual(RECOVERY.paths);
    expect(missingRoles({}, MOISTURE)).toEqual([
      'fans.supply_flow',
      'outdoor.humidity',
      'supply.humidity',
      'extract.humidity',
    ]);
  });

  test('a role missing under both checks is named once', () => {
    const config = { ...complete, supply: { humidity: 'sensor.supply_humidity' } };
    expect(missingRoles(config, RECOVERY)).toEqual(['supply.temperature']);
  });

  test('recovery-balance-card "Partial humidity": only outdoor and extract name the supply air humidity', () => {
    const partial = {
      ...complete,
      supply: { temperature: 'sensor.supply_temperature' },
    };
    expect(missingRoles(partial, RECOVERY)).toEqual(['supply.humidity']);
  });

  test('moisture-balance-card "Required humidity missing" names the supply air humidity', () => {
    expect(missingRoles(without(complete, 'supply'), MOISTURE)).toEqual(['supply.humidity']);
  });

  test('moisture-balance-card "Relative humidity without temperature" names the supply air temperature', () => {
    const config = { ...complete, supply: { humidity: 'sensor.supply_humidity' } };
    expect(missingRoles(config, MOISTURE)).toEqual(['supply.temperature']);
  });
});

describe('missingHumidity', () => {
  test('all or none: no humidity at all is fine (sensible-only)', () => {
    const temperaturesOnly = {
      outdoor: { temperature: 'sensor.a' },
      supply: { temperature: 'sensor.b' },
      extract: { temperature: 'sensor.c' },
    };
    expect(missingHumidity(temperaturesOnly, STREAMS, 'all_or_none')).toEqual([]);
  });

  test('all or none: the only humidity is relative on a stream without temperature', () => {
    const config = { outdoor: { humidity: 'sensor.a_rh' }, supply: {}, extract: {} };
    expect(missingHumidity(config, STREAMS, 'all_or_none')).toEqual([
      'outdoor.temperature',
      'supply.humidity',
      'extract.humidity',
    ]);
  });

  test('absolute humidity needs no temperature', () => {
    const config = { ...complete, supply: { absolute_humidity: 'sensor.supply_absolute_humidity' } };
    expect(missingHumidity(config, STREAMS, 'required')).toEqual([]);
  });
});

describe('hasAllHumidity', () => {
  test('true for a complete set, false for none or a partial set', () => {
    expect(hasAllHumidity(complete, STREAMS)).toBe(true);
    expect(hasAllHumidity({}, STREAMS)).toBe(false);
    expect(hasAllHumidity(without(complete, 'supply'), STREAMS)).toBe(false);
  });

  test('false when a stream has only a relative humidity and no temperature', () => {
    const config = { ...complete, supply: { humidity: 'sensor.supply_humidity' } };
    expect(hasAllHumidity(config, STREAMS)).toBe(false);
  });
});
