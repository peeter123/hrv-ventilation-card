// The saving badge in the centre of the airflow diagram: the saving of the shared recovery calculation, in W; and on
// an ERV the moisture recovery figure at the bottom of the exchanger, in g/h. Pure: the Lit element renders the result.
import type { RecoveryResult } from '../calc/recovery';
import { missingRoles, type CardConfig, type Requirements } from '../lib/config';
import { formatNumber, type LocaleLike } from '../lib/format';
import { DIAGRAM, NO_VALUE } from '../strings';
import type { ExchangerType } from './drawing';

/** The roles the badge needs: the calculation's temperatures and humidities of three streams, and the supply flow. */
export const BADGE_REQUIREMENTS: Requirements = {
  paths: ['outdoor.temperature', 'supply.temperature', 'extract.temperature', 'fans.supply_flow'],
  humidity: { streams: ['outdoor', 'supply', 'extract'], rule: 'required' },
};

/** A saving above this (W) gets a warm or cold badge; at or below it the badge is grey. */
export const SAVING_THRESHOLD = 0.5;

export interface Badge {
  kind: 'warm' | 'cold' | 'grey';
  text: string;
  /** The configured colour a warm or cold badge is tinted with. */
  tint?: string;
}

/** True when the config has every input the badge needs. Checked once per config by the card. */
export const hasBadge = (config: CardConfig): boolean => missingRoles(config, BADGE_REQUIREMENTS).length === 0;

/**
 * The badge for a calculation result. Heating with a saving above the threshold gives a warm badge, cooling a cold
 * one, anything else a grey badge with the value ("0 W"). Without a result (an input has no value) there is no badge,
 * or a grey "n/a" badge with `showUnavailable`.
 */
export function savingBadge(
  result: RecoveryResult | undefined,
  options: { colors: { cold: string; warm: string }; showUnavailable: boolean },
  locale: LocaleLike,
): Badge | undefined {
  if (result === undefined) return options.showUnavailable ? { kind: 'grey', text: NO_VALUE } : undefined;
  const text = DIAGRAM.saving(formatNumber(result.saving, locale));
  if (result.saving <= SAVING_THRESHOLD) return { kind: 'grey', text };
  return result.mode === 'heating'
    ? { kind: 'warm', text, tint: options.colors.warm }
    : { kind: 'cold', text, tint: options.colors.cold };
}

export interface MoistureFigure {
  /** A drop while moisture is recovered, a crossed-out drop while it is kept out. */
  icon: string;
  /** The magnitude, e.g. "120 g/h", or "n/a". */
  text: string;
  /** The tooltip, e.g. "Moisture recovered: 120 g/h". */
  title: string;
}

const RECOVERED_ICON = 'mdi:water-outline';
const KEPT_OUT_ICON = 'mdi:water-off-outline';

/**
 * The moisture recovery figure of an ERV for a calculation result: the recovered moisture rate as a magnitude, with a
 * crossed-out drop while it is negative (moisture kept out). None for an HRV or without the badge's inputs (`badge`).
 * Without a moisture rate (an input has no value) it is hidden like the badge, or "n/a" with `showUnavailable`.
 */
export function moistureFigure(
  result: RecoveryResult | undefined,
  options: { exchanger: ExchangerType; badge: boolean; showUnavailable: boolean },
  locale: LocaleLike,
): MoistureFigure | undefined {
  if (options.exchanger !== 'erv' || !options.badge) return undefined;
  const rate = result?.moisture?.recovered;
  if (rate === undefined) {
    return options.showUnavailable
      ? { icon: RECOVERED_ICON, text: NO_VALUE, title: DIAGRAM.moistureNoValue }
      : undefined;
  }
  const text = DIAGRAM.moisture(formatNumber(Math.abs(rate), locale));
  // Kept out only when the magnitude shows as more than 0, so "0 g/h" never gets the crossed-out drop.
  return rate <= -0.5
    ? { icon: KEPT_OUT_ICON, text, title: DIAGRAM.moistureKeptOut(text) }
    : { icon: RECOVERED_ICON, text, title: DIAGRAM.moistureRecovered(text) };
}
