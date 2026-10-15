import { describe, expect, test } from 'vitest';
import { isCompact, labelModel, STATUS_CELLS, type DiagramLabel, type LabelModel } from '../../src/diagram/labels';
import type { StateLike } from '../../src/lib/availability';
import type { CardConfig } from '../../src/lib/config';

const FULL: CardConfig = {
  type: 'custom:hrv-ventilation-card',
  outdoor: {
    temperature: 'sensor.hrv_outdoor_t',
    humidity: 'sensor.hrv_outdoor_rh',
    absolute_humidity: 'sensor.hrv_outdoor_ah',
  },
  supply: {
    temperature: 'sensor.hrv_supply_t',
    humidity: 'sensor.hrv_supply_rh',
    absolute_humidity: 'sensor.hrv_supply_ah',
  },
  extract: {
    temperature: 'sensor.hrv_extract_t',
    humidity: 'sensor.hrv_extract_rh',
    absolute_humidity: 'sensor.hrv_extract_ah',
  },
  exhaust: {
    temperature: 'sensor.hrv_exhaust_t',
    humidity: 'sensor.hrv_exhaust_rh',
    absolute_humidity: 'sensor.hrv_exhaust_ah',
  },
  fans: { level: 'sensor.hrv_level', supply_flow: 'sensor.hrv_supply_flow', exhaust_flow: 'sensor.hrv_exhaust_flow' },
  bypass: { position: 'sensor.hrv_bypass', mode: 'sensor.hrv_bypass_mode', next_change: 'sensor.hrv_bypass_next' },
  status: {
    operating_mode: 'sensor.hrv_mode',
    target_temperature: 'sensor.hrv_target',
    temperature_profile: 'sensor.hrv_profile',
    next_fan_change: 'sensor.hrv_fan_next',
    filter_days: 'sensor.hrv_filter',
    power: 'sensor.hrv_power',
    rmot: 'sensor.hrv_rmot',
  },
  seasons: { heating: 'binary_sensor.hrv_heating', cooling: 'binary_sensor.hrv_cooling' },
};

const TEMPERATURES_ONLY: CardConfig = {
  outdoor: { temperature: 'sensor.hrv_outdoor_t' },
  supply: { temperature: 'sensor.hrv_supply_t' },
  extract: { temperature: 'sensor.hrv_extract_t' },
  exhaust: { temperature: 'sensor.hrv_exhaust_t' },
};

/** Every entity of the full config with a plain value: the next changes with a time, the bypass at 40 %. */
function allStates(overrides: Record<string, string> = {}): Record<string, StateLike> {
  const ids = JSON.stringify(FULL).match(/(binary_)?sensor\.[a-z0-9_]+/g) ?? [];
  const states: Record<string, StateLike> = Object.fromEntries(ids.map((id) => [id, { state: '12' }]));
  states['sensor.hrv_bypass'] = { state: '40' };
  states['sensor.hrv_bypass_next'] = { state: '01:30' };
  states['sensor.hrv_fan_next'] = { state: '00:20' };
  for (const [id, state] of Object.entries(overrides)) states[id] = { state };
  return states;
}

const FULL_LAYOUT = { showUnavailable: false, compact: false };
const roles = (labels: DiagramLabel[] | undefined): string[] | undefined => labels?.map((label) => label.role);
const visibleRoles = (model: LabelModel): string[] =>
  [model.top, ...Object.values(model.corners), model.centre, model.flows, model.status]
    .flatMap((labels) => labels ?? [])
    .filter((label) => label.visible)
    .map((label) => label.role);

describe('labelModel', () => {
  test('a full config: every role in its area, in order, with its prefix', () => {
    const model = labelModel(FULL, allStates(), FULL_LAYOUT);
    expect(roles(model.top)).toEqual(['status.power', 'status.rmot']);
    expect(roles(model.corners.outdoor)).toEqual([
      'outdoor.temperature',
      'outdoor.humidity',
      'outdoor.absolute_humidity',
    ]);
    expect(roles(model.corners.exhaust)).toEqual([
      'exhaust.temperature',
      'exhaust.humidity',
      'exhaust.absolute_humidity',
    ]);
    expect(roles(model.centre)).toEqual(['bypass.position']);
    expect(roles(model.flows)).toEqual(['fans.supply_flow', 'fans.exhaust_flow']);
    expect(roles(model.status)).toEqual([
      'fans.level',
      'bypass.mode',
      'bypass.next_change',
      'status.operating_mode',
      'status.target_temperature',
      'status.temperature_profile',
      'status.next_fan_change',
      'status.filter_days',
    ]);
    const prefixes = Object.fromEntries(
      [...(model.top ?? []), ...(model.status ?? [])].filter((l) => l.prefix).map((l) => [l.role, l.prefix]),
    );
    expect(prefixes).toEqual({ 'status.rmot': 'RMOT ' });
    const icons = Object.fromEntries(
      [...(model.top ?? []), ...(model.status ?? [])].filter((l) => l.icon).map((l) => [l.role, l.icon]),
    );
    expect(icons).toEqual({
      'status.power': 'mdi:lightning-bolt',
      'status.rmot': 'mdi:thermometer-lines',
      'fans.level': 'mdi:fan',
      'bypass.mode': 'mdi:shuffle-variant',
      'bypass.next_change': 'mdi:timer-outline',
      'status.operating_mode': 'mdi:cog-outline',
      'status.target_temperature': 'mdi:thermometer',
      'status.temperature_profile': 'mdi:thermostat',
      'status.next_fan_change': 'mdi:timer-outline',
      'status.filter_days': 'mdi:air-filter',
    });
    expect(model.corners.supply[0]).toEqual({
      role: 'supply.temperature',
      entityId: 'sensor.hrv_supply_t',
      prefix: '',
      visible: true,
    });
    expect(visibleRoles(model)).toHaveLength(25);
  });

  test('airflow-diagram-card "Optional role missing": a config without power has no power label', () => {
    const { status, ...rest } = FULL;
    const config = { ...rest, status: { ...(status as object), power: undefined } };
    const model = labelModel(config, allStates(), FULL_LAYOUT);
    expect(roles(model.top)).toEqual(['status.rmot']);
  });

  test('a config without bypass entities: no bypass position, mode or next change', () => {
    const { bypass: _bypass, ...config } = FULL;
    const model = labelModel(config, allStates(), FULL_LAYOUT);
    expect(model.centre).toEqual([]);
    expect(roles(model.status)).not.toContain('bypass.mode');
    expect(roles(model.status)).not.toContain('bypass.next_change');
  });

  test('airflow-diagram-card "Status strip": the fan level and status in the strip, the flows at the arrows', () => {
    const config = { ...TEMPERATURES_ONLY, fans: FULL['fans'], status: { operating_mode: 'sensor.hrv_mode' } };
    const model = labelModel(config, allStates(), FULL_LAYOUT);
    expect(roles(model.status)).toEqual(['fans.level', 'status.operating_mode']);
    expect(roles(model.flows)).toEqual(['fans.supply_flow', 'fans.exhaust_flow']);
    const drawing = [...Object.values(model.corners), model.centre].flat().map((label) => label.role);
    expect(drawing.every((role) => role.endsWith('temperature'))).toBe(true);
  });

  test('flows alone do not make a status grid', () => {
    const config = { ...TEMPERATURES_ONLY, fans: { supply_flow: 'sensor.hrv_supply_flow' } };
    const model = labelModel(config, allStates(), FULL_LAYOUT);
    expect(model.status).toBeUndefined();
    expect(roles(model.flows)).toEqual(['fans.supply_flow']);
  });

  test('airflow-diagram-card "No top row roles": no top row', () => {
    const config = { ...FULL, status: { operating_mode: 'sensor.hrv_mode' }, seasons: undefined };
    expect(labelModel(config, allStates(), FULL_LAYOUT).top).toBeUndefined();
  });

  test('airflow-diagram-card "Only season entities, between seasons": the top row is shown without labels', () => {
    const config = { ...TEMPERATURES_ONLY, seasons: FULL['seasons'] };
    const states = allStates({ 'binary_sensor.hrv_heating': 'off', 'binary_sensor.hrv_cooling': 'off' });
    expect(labelModel(config, states, FULL_LAYOUT).top).toEqual([]);
  });

  test('airflow-diagram-card "No status roles": no status grid', () => {
    const model = labelModel(
      { ...TEMPERATURES_ONLY, bypass: { position: 'sensor.hrv_bypass' } },
      allStates(),
      FULL_LAYOUT,
    );
    expect(model.status).toBeUndefined();
    expect(roles(model.centre)).toEqual(['bypass.position']);
  });

  test('airflow-diagram-card "All status values unavailable": the strip keeps its labels, all hidden', () => {
    const unavailable = Object.fromEntries(
      Object.values(FULL['status'] as object)
        .concat(Object.values(FULL['fans'] as object), ['sensor.hrv_bypass_mode', 'sensor.hrv_bypass_next'])
        .map((id: string) => [id, 'unavailable']),
    );
    const model = labelModel(FULL, allStates(unavailable), FULL_LAYOUT);
    expect(model.status).toHaveLength(8);
    expect(model.status?.some((label) => label.visible)).toBe(false);
  });

  test('airflow-diagram-card "One entity unavailable": only that label is hidden', () => {
    const states = allStates({ 'sensor.hrv_outdoor_rh': 'unavailable' });
    const model = labelModel(FULL, states, FULL_LAYOUT);
    expect(model.corners.outdoor.map((label) => label.visible)).toEqual([true, false, true]);
    expect(visibleRoles(model)).toHaveLength(24);
  });

  test('an entity missing from Home Assistant or unknown counts as unavailable', () => {
    const states = allStates({ 'sensor.hrv_outdoor_t': 'unknown' });
    delete states['sensor.hrv_supply_t'];
    const model = labelModel(FULL, states, FULL_LAYOUT);
    expect(model.corners.outdoor[0]?.visible).toBe(false);
    expect(model.corners.supply[0]?.visible).toBe(false);
  });

  test('airflow-diagram-card "Showing unavailable values": the label is shown', () => {
    const states = allStates({ 'sensor.hrv_outdoor_rh': 'unavailable' });
    const model = labelModel(FULL, states, { showUnavailable: true, compact: false });
    expect(model.corners.outdoor[1]).toMatchObject({ role: 'outdoor.humidity', visible: true });
  });

  test('airflow-diagram-card "Bypass closed": no bypass position label while the position is 0', () => {
    for (const state of ['0', '0.0', '-0'])
      expect(labelModel(FULL, allStates({ 'sensor.hrv_bypass': state }), FULL_LAYOUT).centre[0]?.visible).toBe(false);
    expect(labelModel(FULL, allStates({ 'sensor.hrv_bypass': '5' }), FULL_LAYOUT).centre[0]?.visible).toBe(true);
    // A closed bypass stays hidden with show_unavailable; an unavailable position is then shown.
    const showing = { showUnavailable: true, compact: false };
    expect(labelModel(FULL, allStates({ 'sensor.hrv_bypass': '0' }), showing).centre[0]?.visible).toBe(false);
    expect(labelModel(FULL, allStates({ 'sensor.hrv_bypass': 'unavailable' }), showing).centre[0]?.visible).toBe(true);
  });

  test('airflow-diagram-card "Nothing planned": a next change on n/a or unknown is a visible dash, whatever the option', () => {
    for (const showUnavailable of [false, true]) {
      for (const state of ['n/a', 'N/A', 'unknown']) {
        const states = allStates({ 'sensor.hrv_bypass_next': state, 'sensor.hrv_fan_next': state });
        const next = labelModel(FULL, states, { showUnavailable, compact: false }).status?.filter((label) =>
          label.role.includes('next'),
        );
        expect(
          next?.map((label) => [label.visible, label.notPlanned]),
          state,
        ).toEqual([
          [true, true],
          [true, true],
        ]);
      }
    }
    // A planned change shows its time; an unavailable one follows the show_unavailable option like any label.
    const planned = labelModel(FULL, allStates(), { showUnavailable: false, compact: false });
    expect(planned.status?.find((label) => label.role === 'bypass.next_change')?.notPlanned).toBeUndefined();
    const states = allStates({ 'sensor.hrv_bypass_next': 'unavailable' });
    const hidden = labelModel(FULL, states, { showUnavailable: false, compact: false });
    expect(hidden.status?.find((label) => label.role === 'bypass.next_change')?.visible).toBe(false);
  });

  test('airflow-diagram-card "Status grid": each status role has its own fixed cell, one subject per column', () => {
    const cells = Object.values(STATUS_CELLS).map(({ column, row }) => `${String(column)},${String(row)}`);
    expect(new Set(cells).size).toBe(cells.length);
    expect(Object.values(STATUS_CELLS).every(({ column }) => column >= 1 && column <= 3)).toBe(true);
    const model = labelModel(FULL, allStates(), FULL_LAYOUT);
    expect(model.status?.every((label) => label.role in STATUS_CELLS)).toBe(true);
    expect(STATUS_CELLS['fans.level']).toEqual({ column: 1, row: 1 });
    expect(STATUS_CELLS['bypass.next_change']).toEqual({ column: 2, row: 2 });
    expect(STATUS_CELLS['status.target_temperature']).toEqual({ column: 3, row: 3 });
  });

  test('airflow-diagram-card "Phone width": the compact layout keeps the top row, temperatures, humidities and bypass', () => {
    const model = labelModel(FULL, allStates(), { showUnavailable: false, compact: isCompact('auto', 320) });
    expect(roles(model.top)).toEqual(['status.power', 'status.rmot']);
    expect(model.status).toBeUndefined();
    for (const stream of ['outdoor', 'supply', 'extract', 'exhaust'] as const)
      expect(roles(model.corners[stream])).toEqual([`${stream}.temperature`, `${stream}.humidity`]);
    expect(model.flows).toEqual([]);
    expect(roles(model.centre)).toEqual(['bypass.position']);
  });

  test('airflow-diagram-card "Desktop width": all configured labels at 500 px', () => {
    const model = labelModel(FULL, allStates(), { showUnavailable: false, compact: isCompact('auto', 500) });
    expect(visibleRoles(model)).toHaveLength(25);
  });

  test('airflow-diagram-card "Forced full layout": all configured labels at 380 px', () => {
    expect(isCompact('full', 380)).toBe(false);
    const model = labelModel(FULL, allStates(), { showUnavailable: false, compact: isCompact('full', 380) });
    expect(visibleRoles(model)).toHaveLength(25);
  });
});

describe('isCompact', () => {
  test('automatic: compact below 340 px, full from 340 px and while the width is unknown', () => {
    expect(isCompact('auto', 280)).toBe(true);
    expect(isCompact('auto', 339.5)).toBe(true);
    expect(isCompact('auto', 340)).toBe(false);
    expect(isCompact('auto', 350)).toBe(false);
    expect(isCompact('auto', undefined)).toBe(false);
    expect(isCompact('auto', 0)).toBe(false);
  });

  test('a forced layout ignores the width', () => {
    expect(isCompact('compact', 1200)).toBe(true);
    expect(isCompact('full', 280)).toBe(false);
  });
});
