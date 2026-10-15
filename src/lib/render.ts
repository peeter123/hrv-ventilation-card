// The re-render rule shared by the three cards (design.md, "Re-render rule"): a card renders again when its
// config or its own state changed, or when the part of `hass` it shows changed since its last render. Other `hass`
// updates, which arrive for every state change in the installation, are skipped.
import type { CardConfig } from './config';
import { asEntityId } from './config';
import type { HassLike } from './hass';

/** Every entity ID in a config, found by walking its nested objects. Computed once per config by the cards. */
export function configuredEntityIds(config: CardConfig): string[] {
  const ids = new Set<string>();
  const walk = (node: CardConfig): void => {
    for (const value of Object.values(node)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        walk(value as CardConfig);
      } else {
        const id = asEntityId(value);
        if (id !== undefined) ids.add(id);
      }
    }
  };
  walk(config);
  return [...ids];
}

/** Two field values are the same when equal, or arrays with equal items (an entry's `labels` is rebuilt too). */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => item === b[i]);
}

/** Two registry entries are the same when their own fields are equal: HA builds new entry objects on every update. */
function sameEntry(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length &&
    keysA.every(
      (key) =>
        Object.hasOwn(b, key) && sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

/**
 * True when `hass` differs from the `hass` of the last render in what a card with these entities shows: the state
 * object of one of them (HA replaces it on every state or attribute change), the fields of its registry entry, the
 * locale, the language or the dark mode. Without a last render the card renders.
 */
export function hassChanged(rendered: HassLike | undefined, hass: HassLike, entityIds: readonly string[]): boolean {
  if (rendered === undefined) return true;
  if (rendered.locale !== hass.locale || rendered.language !== hass.language) return true;
  // Replaced when translations load, which changes how states are shown.
  if (rendered.localize !== hass.localize || rendered.formatEntityState !== hass.formatEntityState) return true;
  if (rendered.themes?.darkMode !== hass.themes?.darkMode) return true;
  return entityIds.some(
    (id) => rendered.states[id] !== hass.states[id] || !sameEntry(rendered.entities?.[id], hass.entities?.[id]),
  );
}

/**
 * Lit's shouldUpdate for the cards. `changed` is Lit's map of changed properties; `rendered` is the `hass` the card
 * last rendered with (the card stores it, because Lit's old value is only the previous update's). Any change other
 * than `hass` (the config, the card's own state) renders; a `hass` change renders when hassChanged says so.
 */
export function shouldRender(
  changed: ReadonlyMap<PropertyKey, unknown>,
  hass: HassLike | undefined,
  rendered: HassLike | undefined,
  entityIds: readonly string[],
): boolean {
  // Anything but a lone hass change renders: the config, the card's own state, or a plain requestUpdate().
  if (!(changed.size === 1 && changed.has('hass'))) return true;
  if (hass === undefined) return false;
  return hassChanged(rendered, hass, entityIds);
}
