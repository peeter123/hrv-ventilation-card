// Humidity smoothing: a time-weighted moving average over a window of minutes, the same filter as Home Assistant's
// `time_simple_moving_average` helpers. The unit reports relative humidity in whole percent, so raw absolute
// humidity jumps in steps of about 0.2 g/m³; the average smooths those steps.
//
// Like the helper, the average is recomputed when an input changes, not on a timer. It covers the window ending at
// the time it is asked for (the cards pass the latest update of their inputs, in server time), each value weighted
// by how long it held; before the first sample in the window the first value counts from the window start.
import type { EntityStateLike, HassEntityState, HassLike } from '../lib/hass';

/** A value from `time` (epoch ms) until the next sample; undefined for a gap (no value). */
export interface Sample {
  time: number;
  value: number | undefined;
}

const MINUTE = 60_000;
/** The longest smoothing window, so a mistyped one cannot reach outside the range of a date. */
export const MAX_SMOOTHING_MINUTES = 24 * 60;
/** A failed or empty history load is tried again after this long. */
const HISTORY_RETRY_MS = 5 * MINUTE;

/** The latest `last_updated` of the states (epoch ms, server time), or undefined when none has one. */
export function latestUpdate(
  states: readonly (Pick<HassEntityState, 'last_updated'> | undefined)[],
): number | undefined {
  const times = states.map((state) => Date.parse(state?.last_updated ?? '')).filter(Number.isFinite);
  return times.length > 0 ? Math.max(...times) : undefined;
}

/**
 * The time-weighted average of the step function of `samples` (sorted by time) over the window ending at `at`.
 * Gaps are left out of the average. Undefined when no value covers any of the window.
 */
export function timeWeightedAverage(samples: readonly Sample[], at: number, windowMs: number): number | undefined {
  const start = at - windowMs;
  let sum = 0;
  let covered = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample === undefined || sample.time > at) break;
    const next = samples[i + 1];
    // The first sample also covers the window before it; later ones start at their own time.
    const from = i === 0 ? start : Math.max(sample.time, start);
    const to = next === undefined || next.time > at ? at : next.time;
    if (to <= from || sample.value === undefined) continue;
    sum += sample.value * (to - from);
    covered += to - from;
  }
  return covered > 0 ? sum / covered : undefined;
}

/**
 * The smoothed value of a series at `at` (default: its latest sample): the average over `windowMinutes`, or the
 * latest value itself when smoothing is off (0) or the series has only one sample.
 */
export function smoothedValue(samples: readonly Sample[], windowMinutes: number, at?: number): number | undefined {
  const last = samples.at(-1);
  if (last === undefined) return undefined;
  if (!(windowMinutes > 0) || samples.length === 1) return last.value;
  return timeWeightedAverage(samples, Math.max(at ?? last.time, last.time), windowMinutes * MINUTE);
}

/** What a series is computed from: one or more entities and how their states combine into one value. */
export interface SmoothingSource {
  /** Identifies the series: the same key on several cards shares one series and one history request. */
  key: string;
  entityIds: readonly string[];
  /** The value for the entities' states (in the order of entityIds), or undefined for no value. */
  value(states: readonly (EntityStateLike | undefined)[]): number | undefined;
}

/** The part of `hass` the store uses. */
export type SmoothingHass = Pick<HassLike, 'states'> & {
  callWS<T>(message: Record<string, unknown>): Promise<T>;
};

/** One row of the history response with minimal_response and no_attributes; other keys are ignored. */
interface HistoryRow {
  s?: unknown;
  lu?: unknown;
}

/** Where a series' history stands: never asked, loading, loaded for a window, or failed (empty or an error). */
type HistoryState =
  | { state: 'none' }
  | { state: 'loading'; first: boolean }
  | { state: 'loaded'; windowMs: number }
  | { state: 'failed'; at: number };

interface Series {
  samples: Sample[];
  windowMs: number;
  history: HistoryState;
}

/** Inserts a sample in time order; a sample at the time of an existing one replaces it. */
function insert(samples: Sample[], sample: Sample): void {
  let i = samples.length;
  while (i > 0 && (samples[i - 1]?.time ?? -Infinity) > sample.time) i--;
  if (samples[i - 1]?.time === sample.time) samples[i - 1] = sample;
  else samples.splice(i, 0, sample);
}

/**
 * The series of every smoothed source on the page, shared by all cards. A source's history is loaded once for the
 * largest window asked for, again when a card asks for a larger one, and again after a failed or empty load; live
 * states are added on every call to `smoothed`.
 */
export class SmoothingStore {
  private readonly series = new Map<string, Series>();
  private readonly listeners = new Set<() => void>();

  /** Calls `listener` when a history load changes a series; returns the function that unsubscribes it. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * The smoothed value of `source` for the current `hass`, at `at` (epoch ms, server time; default: the source's
   * latest sample), after adding its current state. No value while the source has none right now (an entity
   * missing, unavailable or not numeric), whatever its earlier samples were; while its first history load runs, the
   * current value.
   */
  smoothed(hass: SmoothingHass, source: SmoothingSource, windowMinutes: number, at?: number): number | undefined {
    const minutes = Number.isFinite(windowMinutes) ? Math.min(Math.max(0, windowMinutes), MAX_SMOOTHING_MINUTES) : 0;
    const windowMs = minutes * MINUTE;
    let series = this.series.get(source.key);
    if (series === undefined) {
      series = { samples: [], windowMs, history: { state: 'none' } };
      this.series.set(source.key, series);
    }
    series.windowMs = Math.max(series.windowMs, windowMs);
    const current = this.add(series, hass, source);
    if (windowMs > 0 && this.needsHistory(series)) void this.loadHistory(series, hass, source);
    if (current === undefined) return undefined;
    if (series.history.state === 'loading' && series.history.first) return current;
    return smoothedValue(series.samples, minutes, at);
  }

  private needsHistory(series: Series): boolean {
    const { history, samples, windowMs } = series;
    switch (history.state) {
      case 'none':
        return true;
      case 'loading':
        return false;
      case 'loaded':
        return windowMs > history.windowMs;
      case 'failed': {
        // Retry until live samples cover the window, then there is nothing left to load.
        const [first, last] = [samples[0], samples.at(-1)];
        const covered = first !== undefined && last !== undefined && first.time <= last.time - windowMs;
        return !covered && Date.now() - history.at >= HISTORY_RETRY_MS;
      }
    }
  }

  /**
   * Adds the current state and returns its value. Without any update time (all entities missing) there is no
   * sample to add and no value.
   */
  private add(series: Series, hass: SmoothingHass, source: SmoothingSource): number | undefined {
    const states = source.entityIds.map((id) => hass.states[id]);
    const time = latestUpdate(states);
    if (time === undefined) return undefined;
    const value = source.value(states);
    insert(series.samples, { time, value });
    this.prune(series);
    return value;
  }

  /** Drops samples that ended before the window of the latest sample; keeps the one that holds at its start. */
  private prune(series: Series): void {
    const last = series.samples.at(-1);
    if (last === undefined) return;
    const start = last.time - series.windowMs;
    let first = 0;
    while (first + 1 < series.samples.length && (series.samples[first + 1]?.time ?? Infinity) <= start) first++;
    if (first > 0) series.samples.splice(0, first);
  }

  private async loadHistory(series: Series, hass: SmoothingHass, source: SmoothingSource): Promise<void> {
    const windowMs = series.windowMs;
    series.history = { state: 'loading', first: series.history.state === 'none' };
    // The window ends at the latest sample, in server time, so a browser clock that is off does not move it.
    const end = series.samples.at(-1)?.time ?? Date.now();
    let samples: Sample[] = [];
    try {
      const response = await hass.callWS<Record<string, HistoryRow[] | undefined>>({
        type: 'history/history_during_period',
        start_time: new Date(end - windowMs).toISOString(),
        end_time: new Date(end).toISOString(),
        entity_ids: [...source.entityIds],
        minimal_response: true,
        no_attributes: true,
      });
      samples = historySamples(response, hass, source);
    } catch {
      // A rejected call, or a connection that is not ready and throws at once: a failed load.
    }
    if (!samples.some((sample) => sample.value !== undefined)) {
      // An entity the recorder excludes, a recorder still starting, or only gaps: fill from live updates, retry.
      series.history = { state: 'failed', at: Date.now() };
      return;
    }
    series.history = { state: 'loaded', windowMs };
    for (const sample of samples) insert(series.samples, sample);
    this.prune(series);
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}

/**
 * The samples of a history response: every row of every entity of the source, in time order, each giving the
 * source's value from the latest row of each entity. History has no attributes, so units come from the current
 * states. Rows without a numeric time or a string state are skipped; non-numeric states become gaps through `value`.
 */
function historySamples(
  response: Record<string, HistoryRow[] | undefined>,
  hass: SmoothingHass,
  source: SmoothingSource,
): Sample[] {
  const events = source.entityIds.flatMap((id, index) =>
    (response[id] ?? []).flatMap((row) =>
      typeof row.lu === 'number' && typeof row.s === 'string' ? [{ time: row.lu * 1000, index, state: row.s }] : [],
    ),
  );
  events.sort((a, b) => a.time - b.time);
  const attributes = source.entityIds.map((id) => hass.states[id]?.attributes ?? {});
  const latest: (EntityStateLike | undefined)[] = source.entityIds.map(() => undefined);
  const samples: Sample[] = [];
  for (const event of events) {
    latest[event.index] = { state: event.state, attributes: attributes[event.index] ?? {} };
    insert(samples, { time: event.time, value: source.value(latest) });
  }
  return samples;
}

/** The store shared by every card on the page. */
export const smoothingStore = new SmoothingStore();
