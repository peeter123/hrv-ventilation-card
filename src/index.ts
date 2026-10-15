// The bundle's entry: registers the three cards (each card module defines its element once) and lists them in the
// dashboard's card picker. Loading the bundle a second time, for example under another resource URL, defines no
// element again and adds no second picker entry.
import { MOISTURE_CARD_TAG } from './cards/moisture-balance-card';
import { RECOVERY_CARD_TAG } from './cards/recovery-balance-card';
import { DIAGRAM_CARD_TAG } from './cards/ventilation-card';
import { CARD_PICKER } from './strings';

/** An entry of Home Assistant's card picker (`window.customCards`). */
export interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  /** The picker shows a live preview; a card without entities renders sample values (sample mode). */
  preview: boolean;
}

declare global {
  interface Window {
    customCards?: CustomCardEntry[];
  }
}

export const CARD_ENTRIES: readonly CustomCardEntry[] = [
  { type: DIAGRAM_CARD_TAG, ...CARD_PICKER.diagram, preview: true },
  { type: RECOVERY_CARD_TAG, ...CARD_PICKER.recovery, preview: true },
  { type: MOISTURE_CARD_TAG, ...CARD_PICKER.moisture, preview: true },
];

/** Adds the cards to the card picker, each once, whatever else the list holds. */
export function registerCardPicker(target: { customCards?: CustomCardEntry[] } = window): void {
  const entries = (target.customCards ??= []);
  for (const entry of CARD_ENTRIES)
    if (!entries.some((existing) => existing.type === entry.type)) entries.push({ ...entry });
}

registerCardPicker();
