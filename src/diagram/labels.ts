// The label model of the airflow diagram: which entity labels the card shows, in which area, with which icon and
// prefix, and whether each is visible right now. Pure: the Lit element formats each label's state with Home Assistant and
// renders the areas.
//
// Rows follow the config, not the states: a configured role always has its label in the model (hidden while it has
// nothing to show), so the card keeps its height when a value becomes unavailable or a season flips.
import { isUnavailable, numericValue, type StateLike } from '../lib/availability';
import { entityAt, mapStreams, type CardConfig, type RolePath, type Stream } from '../lib/config';
import { NOT_PLANNED_STATE } from '../lib/unit-state';
import { DIAGRAM } from '../strings';

/** The `layout` option: automatic by card width, or one layout forced. */
export type LayoutChoice = 'auto' | 'full' | 'compact';

/**
 * With `layout: auto`, cards narrower than this (px) get the compact layout. The full layout fits without overlaps
 * from 320 px (measured), so a narrow desktop section (about 350 px) and a phone (about 360 px) show it in full.
 */
export const COMPACT_BELOW = 340;

/**
 * True when the card shows the compact layout. With `auto` that depends on the card's width; an unknown width
 * (before the first measurement, or 0 while the card is not displayed) gives the full layout.
 */
export function isCompact(layout: LayoutChoice, width: number | undefined): boolean {
  if (layout !== 'auto') return layout === 'compact';
  return width !== undefined && width > 0 && width < COMPACT_BELOW;
}

export interface DiagramLabel {
  role: RolePath;
  entityId: string;
  /** An mdi icon in front of the label, e.g. "mdi:fan"; undefined for none. */
  icon?: string;
  /** Text in front of the state, e.g. "Power: "; empty for none. */
  prefix: string;
  /** False while the label has nothing to show: unavailable (unless shown), or the bypass position while closed. */
  visible: boolean;
  /** True while a next-change label has nothing planned ("n/a" or unknown): it shows a dimmed dash in its cell. */
  notPlanned?: true;
}

export interface LabelModel {
  /**
   * The top row's labels (power, RMOT), in both layouts, or undefined when the row is not shown. The row is also
   * shown with only a season entity configured; the season icon is not a label (see season.ts).
   */
  top?: DiagramLabel[];
  /** The stack at each stream's end on the drawing: temperature, relative and absolute humidity. */
  corners: Record<Stream, DiagramLabel[]>;
  /** At the top of the exchanger: the bypass position. The saving badge is not a label (see badge.ts). */
  centre: DiagramLabel[];
  /** Above the tip of the supply and the exhaust arrow: the supply and the exhaust flow (full layout only). */
  flows: DiagramLabel[];
  /** The status grid below the drawing (see STATUS_CELLS), or undefined when the grid is not shown. */
  status?: DiagramLabel[];
}

export interface LabelOptions {
  showUnavailable: boolean;
  compact: boolean;
}

const TOP_ROLES = ['status.power', 'status.rmot'] as const satisfies readonly RolePath[];
const SEASON_ROLES = ['seasons.heating', 'seasons.cooling'] as const satisfies readonly RolePath[];
const FLOW_ROLES = ['fans.supply_flow', 'fans.exhaust_flow'] as const satisfies readonly RolePath[];
const STATUS_ROLES = [
  'fans.level',
  'bypass.mode',
  'bypass.next_change',
  'status.operating_mode',
  'status.target_temperature',
  'status.temperature_profile',
  'status.next_fan_change',
  'status.filter_days',
] as const satisfies readonly RolePath[];

/**
 * The fixed cell of each status role in the three-column grid below the drawing, one subject per column: the fans
 * (level, next fan change, filter), the bypass (mode, next change) and comfort (operating mode, profile, target). A
 * role keeps its cell whatever the states, and an unconfigured role leaves its cell empty, so nothing shifts.
 */
export const STATUS_CELLS: Readonly<Record<(typeof STATUS_ROLES)[number], { column: number; row: number }>> = {
  'fans.level': { column: 1, row: 1 },
  'status.next_fan_change': { column: 1, row: 2 },
  'status.filter_days': { column: 1, row: 3 },
  'bypass.mode': { column: 2, row: 1 },
  'bypass.next_change': { column: 2, row: 2 },
  'status.operating_mode': { column: 3, row: 1 },
  'status.temperature_profile': { column: 3, row: 2 },
  'status.target_temperature': { column: 3, row: 3 },
};

// Text in front of a state, where its icon alone would not say what it is.
const PREFIXES: Partial<Record<RolePath, string>> = {
  'status.rmot': DIAGRAM.prefixes.rmot,
};

const ICONS: Partial<Record<RolePath, string>> = {
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
};

/** Labels of a planned change: with nothing planned ("n/a" or unknown) they show a dimmed dash, not the state. */
const NEXT_CHANGE: ReadonlySet<RolePath> = new Set(['bypass.next_change', 'status.next_fan_change']);
// The state a unit reports while no change is planned (a value, not text of the card), in any case.
const isNotPlannedState = (state: string): boolean => state.trim().toLowerCase() === NOT_PLANNED_STATE;

function isNotPlanned(role: RolePath, state: StateLike | undefined): boolean {
  return NEXT_CHANGE.has(role) && (isNotPlannedState(state?.state ?? '') || state?.state === 'unknown');
}

function isVisible(role: RolePath, state: StateLike | undefined, showUnavailable: boolean): boolean {
  if (isNotPlanned(role, state)) return true;
  // A closed bypass has no position to show.
  if (role === 'bypass.position' && numericValue(state) === 0) return false;
  return showUnavailable || !isUnavailable(state);
}

/**
 * The labels of a config for the current states. A role that is not configured has no label; a row whose roles
 * are all left out is not shown. The compact layout keeps the top row, each stream's temperature and relative
 * humidity and the bypass position.
 */
export function labelModel(
  config: CardConfig,
  states: Readonly<Record<string, StateLike | undefined>>,
  { showUnavailable, compact }: LabelOptions,
): LabelModel {
  const labels = (roles: readonly RolePath[]): DiagramLabel[] =>
    roles.flatMap((role) => {
      const entityId = entityAt(config, role);
      if (entityId === undefined) return [];
      const state = states[entityId];
      const visible = isVisible(role, state, showUnavailable);
      const icon = ICONS[role];
      return [
        {
          role,
          entityId,
          ...(icon === undefined ? {} : { icon }),
          prefix: PREFIXES[role] ?? '',
          visible,
          ...(isNotPlanned(role, state) ? { notPlanned: true as const } : {}),
        },
      ];
    });
  const configured = (roles: readonly RolePath[]): boolean =>
    roles.some((role) => entityAt(config, role) !== undefined);

  const corner = (stream: Stream): DiagramLabel[] =>
    labels(
      compact
        ? [`${stream}.temperature`, `${stream}.humidity`]
        : [`${stream}.temperature`, `${stream}.humidity`, `${stream}.absolute_humidity`],
    );
  const model: LabelModel = {
    corners: mapStreams(corner),
    centre: labels(['bypass.position']),
    flows: compact ? [] : labels(FLOW_ROLES),
  };
  if (configured([...TOP_ROLES, ...SEASON_ROLES])) model.top = labels(TOP_ROLES);
  if (compact) return model;
  if (configured(STATUS_ROLES)) model.status = labels(STATUS_ROLES);
  return model;
}
