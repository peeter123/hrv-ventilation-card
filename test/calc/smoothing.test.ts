import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { absoluteHumidity } from '../../src/calc/humidity';
import {
  SmoothingStore,
  smoothedValue,
  timeWeightedAverage,
  type Sample,
  type SmoothingHass,
  type SmoothingSource,
} from '../../src/calc/smoothing';
import { numericValue, parseNumericState } from '../../src/lib/availability';
import type { HassEntityState } from '../../src/lib/hass';
import hour from '../fixtures/smoothing-hour.json';

const MIN = 60_000;

describe('timeWeightedAverage', () => {
  test('weights each value by how long it held within the window', () => {
    const samples: Sample[] = [
      { time: 0, value: 10 },
      { time: 6 * MIN, value: 20 },
    ];
    // Window [0, 10 min]: 10 for 6 min, 20 for 4 min.
    expect(timeWeightedAverage(samples, 10 * MIN, 10 * MIN)).toBeCloseTo(14, 9);
  });

  test('the value that holds at the window start counts from the start', () => {
    const samples: Sample[] = [
      { time: 0, value: 10 },
      { time: 20 * MIN, value: 20 },
    ];
    // Window [15, 25 min]: 10 for 5 min, 20 for 5 min.
    expect(timeWeightedAverage(samples, 25 * MIN, 10 * MIN)).toBeCloseTo(15, 9);
  });

  test('before the first sample in the window, the first value counts from the window start (as the HA filter)', () => {
    const samples: Sample[] = [
      { time: 5 * MIN, value: 10 },
      { time: 8 * MIN, value: 20 },
    ];
    // Window [0, 10 min]: 10 for 8 min (from the start), 20 for 2 min.
    expect(timeWeightedAverage(samples, 10 * MIN, 10 * MIN)).toBeCloseTo(12, 9);
  });

  test('a sample at the end of the window has no weight yet', () => {
    const samples: Sample[] = [
      { time: 0, value: 10 },
      { time: 10 * MIN, value: 30 },
    ];
    expect(timeWeightedAverage(samples, 10 * MIN, 10 * MIN)).toBe(10);
  });

  test('gaps are left out of the average, and only gaps give no value', () => {
    const samples: Sample[] = [
      { time: 0, value: 10 },
      { time: 5 * MIN, value: undefined },
      { time: 8 * MIN, value: 20 },
    ];
    // 10 for 5 min, gap for 3 min, 20 for 2 min: (50 + 40) / 7.
    expect(timeWeightedAverage(samples, 10 * MIN, 10 * MIN)).toBeCloseTo(90 / 7, 9);
    expect(timeWeightedAverage([{ time: 0, value: undefined }], 5 * MIN, 10 * MIN)).toBeUndefined();
  });
});

describe('smoothedValue', () => {
  // A step of 0.2 g/m³ (one whole percent of relative humidity) that stays.
  const step: Sample[] = [
    { time: -60 * MIN, value: 10.0 },
    { time: 0, value: 10.2 },
  ];

  test('recovery-calculation "One whole-percent step": the average moves towards the new value over the window', () => {
    // Asked at later times (the cards pass the latest update of any input), the step gains weight.
    expect(smoothedValue(step, 10, 2 * MIN)).toBeCloseTo(10.04, 9);
    expect(smoothedValue(step, 10, 5 * MIN)).toBeCloseTo(10.1, 9);
    expect(smoothedValue(step, 10, 10 * MIN)).toBeCloseTo(10.2, 9);
    // At the step itself (the default: the latest sample) it has no weight yet, as in the HA filter.
    expect(smoothedValue(step, 10)).toBeCloseTo(10.0, 9);
  });

  test('a time before the latest sample is not used', () => {
    expect(smoothedValue(step, 10, -30 * MIN)).toBeCloseTo(10.0, 9);
  });

  test('recovery-calculation "Smoothing off": a window of 0 gives the current value', () => {
    expect(smoothedValue(step, 0, 5 * MIN)).toBe(10.2);
  });

  test('a single sample, or none, gives that value or no value', () => {
    expect(smoothedValue([{ time: 0, value: 7.5 }], 10)).toBe(7.5);
    expect(smoothedValue([], 10)).toBeUndefined();
  });
});

describe('the recorded hour', () => {
  test('a 10-minute average of the raw sensor matches the filter helper within 0.02 g/m³', () => {
    const raw: Sample[] = hour.raw.map((row) => ({ time: row.t, value: parseNumericState(row.s) }));
    const checked = hour.helper.filter((row) => row.t >= hour.hourStart);
    expect(checked.length).toBeGreaterThan(20);
    for (const row of checked) {
      const average = timeWeightedAverage(
        raw.filter((sample) => sample.time <= row.t),
        row.t,
        hour.windowMinutes * MIN,
      );
      expect(Math.abs((average ?? NaN) - Number(row.s)), new Date(row.t).toISOString()).toBeLessThanOrEqual(0.02);
    }
  });
});

const state = (entity_id: string, value: string, time: number | undefined, unit: string): HassEntityState => ({
  entity_id,
  state: value,
  attributes: { unit_of_measurement: unit },
  ...(time === undefined ? {} : { last_updated: new Date(time).toISOString() }),
});

/** A mock callWS; the store's callWS is generic, which a vi.fn cannot type. */
const asCallWS = (fn: () => Promise<unknown>): SmoothingHass['callWS'] => fn as unknown as SmoothingHass['callWS'];
const never = (): Promise<unknown> => new Promise(() => undefined);

const AH: SmoothingSource = {
  key: 'sensor.extract_ah',
  entityIds: ['sensor.extract_ah'],
  value: ([ah]) => numericValue(ah),
};

const hassWith = (states: HassEntityState[], callWS: SmoothingHass['callWS']): SmoothingHass => ({
  states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
  callWS,
});

/** Lets pending promise callbacks run. */
const settle = async (): Promise<void> => {
  for (let i = 0; i < 3; i++) await Promise.resolve();
};

describe('SmoothingStore', () => {
  let store: SmoothingStore;
  beforeEach(() => {
    store = new SmoothingStore();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('uses the current value while the history loads, then the average including the history', async () => {
    const now = Date.now();
    let resolve: (value: unknown) => void = () => undefined;
    const callWS = asCallWS(() => new Promise((r) => (resolve = r)));
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.smoothed(hassWith([state('sensor.extract_ah', '10.0', now - 2000, 'g/m³')], callWS), AH, 10)).toBe(
      10.0,
    );
    // A second live update while loading: still the current value, not an average of the two.
    const live = hassWith([state('sensor.extract_ah', '10.2', now - 1000, 'g/m³')], callWS);
    expect(store.smoothed(live, AH, 10)).toBe(10.2);

    // History: 9.8 from the window start, 10.0 for the last 5 minutes.
    resolve({
      'sensor.extract_ah': [
        { s: '9.8', lu: (now - 10 * MIN) / 1000 },
        { s: '10.0', lu: (now - 5 * MIN) / 1000 },
      ],
    });
    await settle();
    expect(listener).toHaveBeenCalledOnce();
    const smoothed = store.smoothed(live, AH, 10, now);
    expect(smoothed).toBeGreaterThan(9.8);
    expect(smoothed).toBeLessThan(10.0);
  });

  test('recovery-calculation "History not available": a failed call leaves the current value, without an error', async () => {
    const callWS = vi.fn(() => Promise.reject(new Error('recorder excludes the entity')));
    const hass = hassWith([state('sensor.extract_ah', '10.2', Date.now(), 'g/m³')], asCallWS(callWS));
    expect(store.smoothed(hass, AH, 10)).toBe(10.2);
    await settle();
    expect(store.smoothed(hass, AH, 10)).toBe(10.2);
    expect(callWS).toHaveBeenCalledTimes(1);
  });

  test('a failed or empty load is tried again after 5 minutes', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-13T12:00:00Z') });
    const callWS = vi.fn(() => Promise.resolve({}));
    const hass = hassWith([state('sensor.extract_ah', '10.2', Date.now(), 'g/m³')], asCallWS(callWS));
    store.smoothed(hass, AH, 10);
    await settle();
    store.smoothed(hass, AH, 10);
    expect(callWS).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 5 * MIN);
    store.smoothed(hass, AH, 10);
    expect(callWS).toHaveBeenCalledTimes(2);
  });

  test('two cards on one entity load its history once', () => {
    const callWS = vi.fn(never);
    const hass = hassWith([state('sensor.extract_ah', '10.2', Date.now(), 'g/m³')], asCallWS(callWS));
    store.smoothed(hass, AH, 10); // first card
    store.smoothed(hass, AH, 5); // second card, smaller window
    expect(callWS).toHaveBeenCalledTimes(1);
  });

  test('a card asking for a larger window than loaded loads the history again', async () => {
    const now = Date.now();
    const callWS = vi.fn(() => Promise.resolve({ 'sensor.extract_ah': [{ s: '10.0', lu: (now - 5 * MIN) / 1000 }] }));
    const hass = hassWith([state('sensor.extract_ah', '10.2', now, 'g/m³')], asCallWS(callWS));
    store.smoothed(hass, AH, 5);
    await settle();
    store.smoothed(hass, AH, 5);
    expect(callWS).toHaveBeenCalledTimes(1);
    store.smoothed(hass, AH, 30);
    expect(callWS).toHaveBeenCalledTimes(2);
  });

  test('with smoothing off no history is requested', () => {
    const callWS = vi.fn(never);
    const hass = hassWith([state('sensor.extract_ah', '10.2', Date.now(), 'g/m³')], asCallWS(callWS));
    expect(store.smoothed(hass, AH, 0)).toBe(10.2);
    expect(callWS).not.toHaveBeenCalled();
  });

  test('a state that arrives with an older time is still added, in time order', () => {
    const now = Date.now();
    const callWS = asCallWS(never);
    store.smoothed(hassWith([state('sensor.extract_ah', '10.0', now - 10 * MIN, 'g/m³')], callWS), AH, 0);
    store.smoothed(hassWith([state('sensor.extract_ah', '10.4', now, 'g/m³')], callWS), AH, 0);
    // Older than the latest: inserted before it, so the latest stays the current value.
    expect(store.smoothed(hassWith([state('sensor.extract_ah', '10.2', now - 5 * MIN, 'g/m³')], callWS), AH, 0)).toBe(
      10.4,
    );
  });

  test('a state without an update time adds nothing (no browser clock mixed with server time)', () => {
    const hass = hassWith([state('sensor.extract_ah', '10.2', undefined, 'g/m³')], asCallWS(never));
    expect(store.smoothed(hass, AH, 0)).toBeUndefined();
  });

  test('keeps the computed series when absolute humidity comes from relative humidity and temperature', async () => {
    const now = Date.now();
    const derived: SmoothingSource = {
      key: 'derived:sensor.extract_rh|sensor.extract_t',
      entityIds: ['sensor.extract_rh', 'sensor.extract_t'],
      value: ([rh, t]) => {
        const [relative, temperature] = [numericValue(rh), numericValue(t)];
        return relative === undefined || temperature === undefined
          ? undefined
          : absoluteHumidity(temperature, relative);
      },
    };
    const callWS = asCallWS(() =>
      Promise.resolve({
        'sensor.extract_rh': [{ s: '55', lu: (now - 10 * MIN) / 1000 }],
        'sensor.extract_t': [{ s: '22.3', lu: (now - 10 * MIN) / 1000 }],
      }),
    );
    const hass = hassWith(
      [state('sensor.extract_rh', '55', now - 10 * MIN, '%'), state('sensor.extract_t', '22.3', now - 10 * MIN, '°C')],
      callWS,
    );
    store.smoothed(hass, derived, 10);
    await settle();
    expect(store.smoothed(hass, derived, 10, now)).toBeCloseTo(absoluteHumidity(22.3, 55) ?? NaN, 9);
  });

  test('a reload for a larger window keeps the average the series already has', async () => {
    const now = Date.now();
    const loads: ((value: unknown) => void)[] = [];
    const callWS = asCallWS(() => new Promise((r) => loads.push(r)));
    const hass = hassWith([state('sensor.extract_ah', '10.2', now, 'g/m³')], callWS);
    store.smoothed(hass, AH, 10);
    loads[0]?.({ 'sensor.extract_ah': [{ s: '9.8', lu: (now - 10 * MIN) / 1000 }] });
    await settle();
    const average = store.smoothed(hass, AH, 10, now + 5 * MIN);
    expect(average).toBeGreaterThan(9.8);
    expect(average).toBeLessThan(10.2);
    // A card with a larger window starts a reload; meanwhile the average stays, not the raw 10.2.
    store.smoothed(hass, AH, 30);
    expect(loads).toHaveLength(2);
    expect(store.smoothed(hass, AH, 10, now + 5 * MIN)).toBe(average);
  });

  test('a history of only gaps counts as no history', async () => {
    const callWS = vi.fn(() =>
      Promise.resolve({ 'sensor.extract_ah': [{ s: 'unavailable', lu: Date.now() / 1000 - 60 }] }),
    );
    const hass = hassWith([state('sensor.extract_ah', '10.2', Date.now(), 'g/m³')], asCallWS(callWS));
    vi.useFakeTimers({ now: Date.now() });
    store.smoothed(hass, AH, 10);
    await settle();
    vi.setSystemTime(Date.now() + 5 * MIN);
    store.smoothed(hass, AH, 10);
    expect(callWS).toHaveBeenCalledTimes(2);
  });

  test('retries stop once live samples cover the window', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-13T12:00:00Z') });
    const start = Date.now();
    const callWS = vi.fn(() => Promise.resolve({}));
    const at = (minutes: number, value: string) =>
      hassWith([state('sensor.extract_ah', value, start + minutes * MIN, 'g/m³')], asCallWS(callWS));
    store.smoothed(at(0, '10.0'), AH, 10);
    await settle();
    vi.setSystemTime(start + 11 * MIN);
    store.smoothed(at(11, '10.2'), AH, 10); // live samples now span more than the window
    expect(callWS).toHaveBeenCalledTimes(1);
  });

  test('a callWS that throws at once counts as a failed load, without an error', () => {
    const callWS = asCallWS(() => {
      throw new Error('not connected');
    });
    const hass = hassWith([state('sensor.extract_ah', '10.2', Date.now(), 'g/m³')], callWS);
    expect(() => store.smoothed(hass, AH, 10)).not.toThrow();
    expect(store.smoothed(hass, AH, 10)).toBe(10.2);
  });

  test('a window that is not a number counts as 0 (the current value, no history)', () => {
    const callWS = vi.fn(never);
    const hass = hassWith([state('sensor.extract_ah', '10.2', Date.now(), 'g/m³')], asCallWS(callWS));
    expect(store.smoothed(hass, AH, Number.NaN)).toBe(10.2);
    expect(callWS).not.toHaveBeenCalled();
  });
});
